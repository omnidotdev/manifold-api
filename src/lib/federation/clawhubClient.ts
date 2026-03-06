/**
 * Typed HTTP client for ClawHub's public API.
 * Includes rate limiting and promise coalescing.
 */

import { waitForToken } from "lib/federation/rateLimiter";

import type {
  ClawHubSkillItem,
  ClawHubSkillSummary,
} from "lib/federation/types";

/** In-flight request deduplication map */
const inflight = new Map<string, Promise<unknown>>();

/**
 * Coalesce concurrent requests for the same key.
 * Multiple callers get the same promise instead of duplicate upstream fetches.
 */
const coalesce = <T>(key: string, fn: () => Promise<T>): Promise<T> => {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  return promise;
};

/**
 * Fetch with rate limiting for a federated source.
 */
const rateLimitedFetch = async (
  sourceId: string,
  rpm: number,
  url: string,
): Promise<Response> => {
  const allowed = await waitForToken(sourceId, rpm);
  if (!allowed) throw new Error(`Rate limit exceeded for source ${sourceId}`);

  return fetch(url);
};

/**
 * Normalize a ClawHub API skill item into our internal summary format.
 */
const normalizeItem = (item: ClawHubSkillItem): ClawHubSkillSummary => ({
  slug: item.slug,
  name: item.displayName,
  description: item.summary,
  downloads: item.stats?.downloads,
  stars: item.stats?.stars,
  version: item.latestVersion?.version,
});

/**
 * List skills from ClawHub.
 * ClawHub API returns `{ items: [...], nextCursor: "..." }`.
 * @param baseUrl - ClawHub API base URL
 * @param sourceId - Source ID for rate limiting
 * @param rpm - Requests per minute limit
 * @param opts - Pagination and sort options
 */
const listSkills = async (
  baseUrl: string,
  sourceId: string,
  rpm: number,
  opts: { limit?: number; sort?: string; cursor?: string } = {},
): Promise<ClawHubSkillSummary[]> => {
  const params = new URLSearchParams();
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.sort) params.set("sort", opts.sort);
  if (opts.cursor) params.set("cursor", opts.cursor);

  const url = `${baseUrl}/skills?${params}`;
  const res = await rateLimitedFetch(sourceId, rpm, url);

  if (!res.ok) {
    throw new Error(
      `ClawHub listSkills failed: ${res.status} ${res.statusText}`,
    );
  }

  const data = (await res.json()) as {
    items?: ClawHubSkillItem[];
    nextCursor?: string;
  };
  return (data.items ?? []).map(normalizeItem);
};

/**
 * Get SKILL.md content for a specific skill.
 * Uses promise coalescing to deduplicate concurrent requests.
 * @param baseUrl - ClawHub API base URL
 * @param sourceId - Source ID for rate limiting
 * @param rpm - Requests per minute limit
 * @param slug - Skill slug
 */
const getSkillContent = (
  baseUrl: string,
  sourceId: string,
  rpm: number,
  slug: string,
): Promise<string | null> =>
  coalesce(`skill:${sourceId}:${slug}`, async () => {
    const url = `${baseUrl}/skills/${encodeURIComponent(slug)}/file?path=SKILL.md`;
    const res = await rateLimitedFetch(sourceId, rpm, url);

    if (res.status === 404) return null;

    if (!res.ok) {
      throw new Error(
        `ClawHub getSkillContent failed: ${res.status} ${res.statusText}`,
      );
    }

    return res.text();
  });

export { getSkillContent, listSkills };
