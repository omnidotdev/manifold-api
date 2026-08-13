import { and, eq, isNull } from "drizzle-orm";

import {
  namespaceTable,
  oidcIssuerTable,
  trustedPublisherTable,
} from "lib/db/schema";

import type dbPool from "lib/db/dbPool";

type Db = typeof dbPool;

/**
 * A declarative trusted-publisher binding, supplied via config (the
 * `OIDC_TRUSTED_PUBLISHERS` env, set by Pulumi). Keeping trust in config rather
 * than a one-off manual mutation keeps it GitOps-managed and reproducible.
 */
export interface TrustedPublisherSeed {
  /** OIDC issuer URL (matches the token `iss`). */
  issuer: string;
  /** Expected token audience. */
  audience: string;
  /** Expected token subject (e.g. a k8s ServiceAccount). */
  subject: string;
  /** Target namespace NAME (e.g. "omnidotdev"). */
  namespace: string;
  /** Explicit JWKS URL; when omitted, resolved via OIDC discovery. */
  jwksUri?: string;
  /** Permission granted (default "write"). */
  scope?: string;
  /** Additional required claims. */
  claimConstraints?: Record<string, unknown>;
}

/**
 * Idempotently apply declarative trusted-publisher bindings on boot.
 *
 * Upserts each entry's issuer, then (namespace-level) binding, keyed by
 * issuer + subject + namespace. Re-running with the same config is a no-op;
 * changing config converges the rows. An entry whose namespace does not exist
 * is skipped with a warning rather than failing boot.
 */
export const seedTrustedPublishers = async (
  db: Db,
  entries: TrustedPublisherSeed[],
): Promise<{ seeded: number; skipped: number }> => {
  let seeded = 0;
  let skipped = 0;
  const now = new Date().toISOString();

  for (const entry of entries) {
    const [issuer] = await db
      .insert(oidcIssuerTable)
      .values({
        issuer: entry.issuer,
        jwksUri: entry.jwksUri ?? null,
        audience: entry.audience,
        enabled: true,
      })
      .onConflictDoUpdate({
        target: oidcIssuerTable.issuer,
        set: {
          jwksUri: entry.jwksUri ?? null,
          audience: entry.audience,
          enabled: true,
          updatedAt: now,
        },
      })
      .returning({ id: oidcIssuerTable.id });

    const [namespace] = await db
      .select({ id: namespaceTable.id })
      .from(namespaceTable)
      .where(eq(namespaceTable.name, entry.namespace));
    if (!namespace) {
      skipped++;
      console.warn(
        `OIDC seed: namespace "${entry.namespace}" not found, skipping binding for ${entry.subject}`,
      );
      continue;
    }

    const [existing] = await db
      .select({ id: trustedPublisherTable.id })
      .from(trustedPublisherTable)
      .where(
        and(
          eq(trustedPublisherTable.issuerId, issuer.id),
          eq(trustedPublisherTable.subject, entry.subject),
          eq(trustedPublisherTable.namespaceId, namespace.id),
          isNull(trustedPublisherTable.repositoryId),
        ),
      );

    if (existing) {
      await db
        .update(trustedPublisherTable)
        .set({
          scope: entry.scope ?? "write",
          claimConstraints: entry.claimConstraints ?? {},
          isActive: true,
          updatedAt: now,
        })
        .where(eq(trustedPublisherTable.id, existing.id));
    } else {
      await db.insert(trustedPublisherTable).values({
        namespaceId: namespace.id,
        issuerId: issuer.id,
        subject: entry.subject,
        scope: entry.scope ?? "write",
        claimConstraints: entry.claimConstraints ?? {},
        createdBy: "system:seed",
      });
    }
    seeded++;
  }

  return { seeded, skipped };
};
