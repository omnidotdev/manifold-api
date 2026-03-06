/**
 * Federation proxy.
 * Intercepts requests for federated namespaces, checks cache,
 * and proxies to upstream on miss.
 */

import { and, eq } from "drizzle-orm";

import {
  FEDERATION_AUTO_APPROVE,
  FEDERATION_ENABLED,
} from "lib/config/env.config";
import { dbPool } from "lib/db";
import { federatedSkillCacheTable, federatedSourceTable } from "lib/db/schema";
import { getSkillContent } from "lib/federation/clawhubClient";
import { autoVetSkill } from "lib/federation/vetting";

import type {
  FederatedArtifactResult,
  FederatedTagListResult,
} from "lib/federation/types";

/**
 * Compute a SHA-256 hex digest for content.
 */
const sha256 = async (content: string): Promise<string> => {
  const encoded = new TextEncoder().encode(content);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

/**
 * Look up a federated source by namespace.
 * Returns null if federation is disabled or namespace is not federated.
 */
const getSource = async (namespace: string) => {
  if (FEDERATION_ENABLED !== "true") return null;

  const [source] = await dbPool
    .select()
    .from(federatedSourceTable)
    .where(
      and(
        eq(federatedSourceTable.namespace, namespace),
        eq(federatedSourceTable.enabled, true),
      ),
    )
    .limit(1);

  return source ?? null;
};

/**
 * Normalize SKILL.md content from upstream.
 * Many ClawHub skills omit the closing `---` frontmatter delimiter.
 * Beacon's parser requires it, so insert one if missing.
 */
const normalizeFrontmatter = (raw: string): string => {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith("---")) return raw;

  // Skip the opening delimiter
  const afterOpen = trimmed.slice(3);
  const closingIdx = afterOpen.indexOf("---");

  // Already has closing delimiter
  if (closingIdx >= 0) return raw;

  // Find the first blank line or markdown heading after the YAML block.
  // Insert `---` before it to close the frontmatter.
  const lines = afterOpen.split("\n");
  let insertAt = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Blank line or markdown heading signals end of YAML
    if ((line === "" && i > 0) || line.startsWith("#")) {
      insertAt = i;
      break;
    }
  }

  if (insertAt < 0) return raw;

  const yamlLines = lines.slice(0, insertAt);
  const bodyLines = lines.slice(insertAt);
  return `---\n${yamlLines.join("\n")}\n---\n${bodyLines.join("\n")}`;
};

/**
 * Fetch, vet, and cache a skill from upstream.
 */
const fetchAndCache = async (
  sourceId: string,
  baseUrl: string,
  rpm: number,
  slug: string,
  cacheTtlSeconds: number,
  requireVetting: boolean,
) => {
  const raw = await getSkillContent(baseUrl, sourceId, rpm, slug);
  if (!raw) return null;

  // Normalize frontmatter for Beacon compatibility
  const content = normalizeFrontmatter(raw);

  const digest = await sha256(content);
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + cacheTtlSeconds * 1000,
  ).toISOString();

  // Run auto-vetting
  const vetResult = autoVetSkill(content, slug);
  const autoApprove = FEDERATION_AUTO_APPROVE !== "false";

  // Determine effective vet status
  const effectiveStatus =
    !requireVetting && autoApprove && vetResult.status === "approved"
      ? "approved"
      : vetResult.status;

  await dbPool
    .insert(federatedSkillCacheTable)
    .values({
      sourceId,
      slug,
      content,
      contentDigest: digest,
      fetchedAt: now.toISOString(),
      expiresAt,
      vetStatus: effectiveStatus,
      vetReason: vetResult.reason,
      vettedBy: "auto",
      vettedAt: now.toISOString(),
    })
    .onConflictDoUpdate({
      target: [
        federatedSkillCacheTable.sourceId,
        federatedSkillCacheTable.slug,
      ],
      set: {
        content,
        contentDigest: digest,
        fetchedAt: now.toISOString(),
        expiresAt,
        vetStatus: effectiveStatus,
        vetReason: vetResult.reason,
        vettedBy: "auto",
        vettedAt: now.toISOString(),
      },
    });

  return effectiveStatus === "approved" ? content : null;
};

/**
 * Revalidate a cached skill in the background.
 * Does not block the caller.
 */
const revalidateInBackground = (
  sourceId: string,
  baseUrl: string,
  rpm: number,
  slug: string,
  cacheTtlSeconds: number,
  requireVetting: boolean,
) => {
  fetchAndCache(
    sourceId,
    baseUrl,
    rpm,
    slug,
    cacheTtlSeconds,
    requireVetting,
  ).catch((err) => {
    console.error(
      `[federation] Background revalidation failed for ${slug}:`,
      err,
    );
  });
};

/**
 * Try to resolve an artifact from a federated source.
 * Returns content if found and approved, null otherwise.
 *
 * Cache strategy:
 * - Hit + approved + not expired -> return content
 * - Hit + expired -> return stale, revalidate in background
 * - Miss -> fetch from upstream, vet, cache, return
 */
const tryFederatedArtifact = async (
  namespace: string,
  _repo: string,
  slug: string,
): Promise<FederatedArtifactResult | null> => {
  const source = await getSource(namespace);
  if (!source) return null;

  const now = new Date().toISOString();

  // Check cache
  const [cached] = await dbPool
    .select()
    .from(federatedSkillCacheTable)
    .where(
      and(
        eq(federatedSkillCacheTable.sourceId, source.id),
        eq(federatedSkillCacheTable.slug, slug),
      ),
    )
    .limit(1);

  // Cache hit
  if (cached) {
    if (cached.vetStatus === "approved" && cached.content) {
      // Check if expired
      if (cached.expiresAt && cached.expiresAt > now) {
        return { content: cached.content, mediaType: "text/markdown" };
      }

      // Expired but approved: serve stale, revalidate in background
      revalidateInBackground(
        source.id,
        source.upstreamBaseUrl,
        source.rateLimitRpm,
        slug,
        source.cacheTtlSeconds,
        source.requireVetting,
      );
      return { content: cached.content, mediaType: "text/markdown" };
    }

    // Cached but not approved (pending/rejected/quarantined)
    if (cached.vetStatus !== "approved") return null;
  }

  // Cache miss: fetch from upstream
  const content = await fetchAndCache(
    source.id,
    source.upstreamBaseUrl,
    source.rateLimitRpm,
    slug,
    source.cacheTtlSeconds,
    source.requireVetting,
  );

  if (!content) return null;
  return { content, mediaType: "text/markdown" };
};

/**
 * Try to resolve a tag list from a federated source.
 * Returns cached approved skill slugs.
 */
const tryFederatedTagList = async (
  namespace: string,
  _repo: string,
): Promise<FederatedTagListResult | null> => {
  const source = await getSource(namespace);
  if (!source) return null;

  // Return all approved cached slugs for this source
  const approved = await dbPool
    .select({ slug: federatedSkillCacheTable.slug })
    .from(federatedSkillCacheTable)
    .where(
      and(
        eq(federatedSkillCacheTable.sourceId, source.id),
        eq(federatedSkillCacheTable.vetStatus, "approved"),
      ),
    )
    .orderBy(federatedSkillCacheTable.slug);

  // Check if tag list cache is stale and refresh in background
  const now = new Date();
  const [oldest] = await dbPool
    .select({ expiresAt: federatedSkillCacheTable.expiresAt })
    .from(federatedSkillCacheTable)
    .where(eq(federatedSkillCacheTable.sourceId, source.id))
    .orderBy(federatedSkillCacheTable.expiresAt)
    .limit(1);

  if (!oldest?.expiresAt || oldest.expiresAt < now.toISOString()) {
    // Stale: background sync will handle refresh
  }

  return {
    name: `${namespace}/skills`,
    tags: approved.map((r) => r.slug),
  };
};

export { fetchAndCache, tryFederatedArtifact, tryFederatedTagList };
