/** Skill item returned by ClawHub's /api/v1/skills endpoint */
type ClawHubSkillItem = {
  slug: string;
  displayName: string;
  summary: string;
  tags?: Record<string, unknown>;
  stats?: {
    downloads?: number;
    stars?: number;
    versions?: number;
    installsAllTime?: number;
  };
  createdAt?: number;
  updatedAt?: number;
  latestVersion?: {
    version: string;
    createdAt: number;
    changelog?: string;
  };
  metadata?: unknown;
};

/** Normalized skill summary used internally */
type ClawHubSkillSummary = {
  slug: string;
  name: string;
  description?: string;
  downloads?: number;
  stars?: number;
  version?: string;
};

/** Result from a federated artifact lookup */
type FederatedArtifactResult = {
  content: string;
  mediaType: string;
};

/** Result from a federated tag list lookup */
type FederatedTagListResult = {
  name: string;
  tags: string[];
};

export type {
  ClawHubSkillItem,
  ClawHubSkillSummary,
  FederatedArtifactResult,
  FederatedTagListResult,
};
