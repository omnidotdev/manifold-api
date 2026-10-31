import { createWithPgClient } from "postgraphile/adaptors/pg";

import { dbPool, pgPool } from "lib/db";

import type { YogaInitialContext } from "graphql-yoga";
import type { WithPgClient } from "postgraphile/@dataplan/pg";
import type {
  NodePostgresPgClient,
  PgSubscriber,
} from "postgraphile/adaptors/pg";

const withPgClient = createWithPgClient({ pool: pgPool });

import type { TokenScope } from "lib/db/schema";

export interface Observer {
  id: string;
  name?: string;
  email?: string;
  /**
   * Gatekeeper organization ids the caller may see private data for. Drives
   * the org-scope read filter; an empty set sees only public resources.
   */
  organizations: string[];
}

/**
 * Token-based observer for API token authentication.
 */
export interface TokenObserver extends Observer {
  /** Discriminator for token auth */
  isApiToken: true;
  /** Token ID for audit logging */
  tokenId: string;
  /** Token name for display */
  tokenName: string;
  /** Permission scope */
  scope: TokenScope;
  /** Namespace ID scope */
  namespaceId: string;
  /** Optional repository ID scope (null = all repos in namespace) */
  repositoryId: string | null;
}

/**
 * Combined observer type (user or token).
 */
export type ContextObserver = Observer | TokenObserver;

// Expose the observer to Grafast plan resolvers via
// `context().get("observer")`, which the org-scope read filter reads
// (https://grafast.org/grafast/step-library/standard-steps/context)
declare global {
  namespace Grafast {
    interface Context {
      observer: ContextObserver | null;
    }
  }
}

/**
 * Type guard for token observer.
 */
export const isTokenObserver = (
  observer: ContextObserver | null,
): observer is TokenObserver =>
  observer !== null && "isApiToken" in observer && observer.isApiToken;

export interface GraphQLContext {
  /** API observer, injected by the authentication plugin and controlled via `contextFieldName`. Related to the viewer pattern: https://wundergraph.com/blog/graphql_federation_viewer_pattern */
  observer: ContextObserver | null;
  /** Network request. */
  request: Request;
  /** Database. */
  db: typeof dbPool;
  /** Postgres client, injected by Postgraphile. */
  withPgClient: WithPgClient<NodePostgresPgClient>;
  /** Postgres settings for the current request, injected by Postgraphile. */
  pgSettings: Record<string, string | undefined> | null;
  /** Postgres subscription client for the current request, injected by Postgraphile. */
  pgSubscriber: PgSubscriber | null;
}

/**
 * Create a GraphQL context.
 * @see https://graphql.org/learn/execution/#root-fields-and-resolvers
 */
const createGraphqlContext = async ({
  request,
}: Omit<YogaInitialContext, "waitUntil">): Promise<
  Omit<GraphQLContext, "observer" | "pgSettings" | "pgSubscriber">
> => ({
  request,
  db: dbPool,
  withPgClient,
});

export default createGraphqlContext;
