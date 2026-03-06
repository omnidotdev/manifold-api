/**
 * Auto-vetting for federated skills.
 * Checks content for safety before serving to users.
 * Motivated by ClawHavoc (341 malicious skills removed from ClawHub).
 */

import type { VetStatus } from "lib/db/schema/federatedSkillCache.table";

/** Max allowed SKILL.md size (256 KB) */
const MAX_CONTENT_SIZE = 256 * 1024;

/** Patterns that indicate shell injection attempts */
const SHELL_INJECTION_PATTERNS = [
  /;\s*(rm|chmod|chown|curl|wget|nc|ncat)\s/i,
  /\$\(\s*(curl|wget|bash|sh|exec)/i,
  /`\s*(curl|wget|bash|sh|exec)/i,
  /\|\s*(bash|sh|zsh|dash)\b/i,
  />\s*\/etc\//i,
  />\s*~\//i,
];

/** Patterns that indicate credential harvesting */
const CREDENTIAL_PATTERNS = [
  /\b(AWS_SECRET|GITHUB_TOKEN|OPENAI_API_KEY|DATABASE_URL|PRIVATE_KEY)\b/i,
  /process\.env\.\w*(SECRET|TOKEN|KEY|PASSWORD|CREDENTIAL)\b/i,
  /\bexfiltrat/i,
];

/** Patterns that indicate suspicious eval/encoded payloads */
const SUSPICIOUS_PAYLOAD_PATTERNS = [
  /\beval\s*\(/,
  /\bnew\s+Function\s*\(/,
  /\batob\s*\(/,
  /\bBuffer\.from\s*\([^)]+,\s*['"]base64['"]\)/,
  /[A-Za-z0-9+/]{100,}={0,2}/,
];

type VetResult = {
  status: VetStatus;
  reason: string;
};

/**
 * Check whether a SKILL.md has valid YAML frontmatter.
 */
const hasValidFrontmatter = (content: string): boolean => {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith("---")) return false;

  const endIdx = trimmed.indexOf("---", 3);
  return endIdx > 3;
};

/**
 * Check content against a list of regex patterns.
 */
const matchesAny = (content: string, patterns: RegExp[]): RegExp | null => {
  for (const pattern of patterns) {
    if (pattern.test(content)) return pattern;
  }
  return null;
};

/**
 * Auto-vet a skill's SKILL.md content.
 * @param content - Raw SKILL.md content
 * @param slug - Skill slug (for logging context)
 * @returns Vet result with status and reason
 */
const autoVetSkill = (content: string, slug: string): VetResult => {
  // Check size limit
  const byteSize = new TextEncoder().encode(content).byteLength;
  if (byteSize > MAX_CONTENT_SIZE) {
    return {
      status: "quarantined",
      reason: `Content exceeds ${MAX_CONTENT_SIZE} byte limit (${byteSize} bytes)`,
    };
  }

  // Check for valid YAML frontmatter
  if (!hasValidFrontmatter(content)) {
    return {
      status: "quarantined",
      reason: "Missing or invalid YAML frontmatter",
    };
  }

  // Check for shell injection patterns
  const shellMatch = matchesAny(content, SHELL_INJECTION_PATTERNS);
  if (shellMatch) {
    return {
      status: "quarantined",
      reason: `Shell injection pattern detected: ${shellMatch.source}`,
    };
  }

  // Check for credential harvesting patterns
  const credMatch = matchesAny(content, CREDENTIAL_PATTERNS);
  if (credMatch) {
    return {
      status: "quarantined",
      reason: `Credential harvesting pattern detected: ${credMatch.source}`,
    };
  }

  // Check for suspicious eval/base64 payloads
  const payloadMatch = matchesAny(content, SUSPICIOUS_PAYLOAD_PATTERNS);
  if (payloadMatch) {
    return {
      status: "quarantined",
      reason: `Suspicious payload pattern detected: ${payloadMatch.source}`,
    };
  }

  return {
    status: "approved",
    reason: `Auto-approved: passed all safety checks for "${slug}"`,
  };
};

export { autoVetSkill };
