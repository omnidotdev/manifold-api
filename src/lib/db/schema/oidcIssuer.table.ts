import { boolean, pgTable, text } from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Trusted OIDC issuers for trusted publishing.
 *
 * An issuer is a CI/build identity provider (the in-cluster identity, a git
 * forge's Actions issuer, etc.) whose signed identity tokens Manifold accepts
 * in exchange for an ephemeral publish token. Adding a new issuer is a row, not
 * a code change.
 */
export const oidcIssuerTable = pgTable("oidc_issuer", {
  id: generateDefaultId(),
  // issuer URL, matched against the `iss` claim of a presented token
  issuer: text().notNull().unique(),
  // explicit JWKS URL; when null, resolved via OIDC discovery
  // (`<issuer>/.well-known/openid-configuration`)
  jwksUri: text(),
  // expected `aud` claim; a token minted for another audience is rejected
  audience: text().notNull(),
  // soft disable without deleting the row (kills all its trusted publishers)
  enabled: boolean().notNull().default(true),
  createdAt: generateDefaultDate(),
  updatedAt: generateDefaultDate(),
});

export type InsertOidcIssuer = InferInsertModel<typeof oidcIssuerTable>;
export type SelectOidcIssuer = InferSelectModel<typeof oidcIssuerTable>;
