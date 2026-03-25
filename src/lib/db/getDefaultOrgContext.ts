import { DEFAULT_ORG_ID, hasBilling } from "lib/config/env.config";

/**
 * Get default organization context when billing is not configured.
 * Used when org context is required but multi-tenant infrastructure is not available.
 */
const getDefaultOrgContext = () => {
  if (hasBilling) return null;

  return {
    id: DEFAULT_ORG_ID,
    slug: "default",
    name: "Default Organization",
    type: "team" as const,
  };
};

export default getDefaultOrgContext;
