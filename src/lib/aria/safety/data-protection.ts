// ══════════════════════════════════════════════════════════════════════════════
// Aria Intelligence — Data Protection Service
//
// Detects, classifies, and redacts sensitive information before routing
// to AI providers. Ensures child-identifiable data is never sent to
// uncontrolled external services.
//
// UK GDPR compliant. ICO children's data principles applied.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  AriaDataSensitivity,
  AriaProviderName,
  AriaRedactionEntry,
  AriaRedactionCategory,
  AriaTaskType,
} from "../core/types";
import {
  PROVIDER_MAX_SENSITIVITY,
  TASK_DEFAULT_SENSITIVITY,
} from "../core/constants";
import { AriaSafetyBlockError, AriaRedactionError } from "../core/errors";

// ── Sensitivity Classification ────────────────────────────────────────────

/**
 * Classify the sensitivity level of input text.
 * Detects PII, safeguarding language, health data, legal references.
 */
export function classifyInputSensitivity(
  text: string,
  taskType: AriaTaskType,
  context?: { childId?: string; staffId?: string },
): AriaDataSensitivity {
  // Start with task default
  let level: AriaDataSensitivity = TASK_DEFAULT_SENSITIVITY[taskType] ?? "internal";

  // Escalate based on content detection
  if (detectSafeguardingLanguage(text)) {
    level = escalateSensitivity(level, "safeguarding_sensitive");
  }
  if (detectHealthInformation(text)) {
    level = escalateSensitivity(level, "health_sensitive");
  }
  if (detectLegalLanguage(text)) {
    level = escalateSensitivity(level, "legal_sensitive");
  }
  if (detectChildIdentifiers(text) || context?.childId) {
    level = escalateSensitivity(level, "child_sensitive");
  }
  if (detectStaffIdentifiers(text) || context?.staffId) {
    level = escalateSensitivity(level, "staff_sensitive");
  }

  return level;
}

// ── Redaction ─────────────────────────────────────────────────────────────

export interface RedactionResult {
  redactedText: string;
  redactionMap: AriaRedactionEntry[];
  sensitiveItemsDetected: number;
}

/**
 * Redact all sensitive data from text, replacing with placeholder tokens.
 * Returns redacted text and a map for potential restoration.
 */
export function redactSensitiveData(text: string): RedactionResult {
  const entries: AriaRedactionEntry[] = [];
  let redacted = text;
  let offset = 0;

  // Track counters per category
  const counters: Record<string, number> = {};

  function getNextPlaceholder(category: AriaRedactionCategory): string {
    const prefix = CATEGORY_PREFIXES[category];
    counters[category] = (counters[category] ?? 0) + 1;
    return `[${prefix}_${counters[category]}]`;
  }

  // Apply redaction patterns in order of specificity
  for (const rule of REDACTION_RULES) {
    const regex = new RegExp(rule.pattern, "gi");
    let match: RegExpExecArray | null;

    while ((match = regex.exec(redacted)) !== null) {
      const placeholder = getNextPlaceholder(rule.category);
      const originalLength = match[0].length;

      entries.push({
        placeholder,
        category: rule.category,
        originalLength,
        position: { start: match.index, end: match.index + originalLength },
      });

      redacted = redacted.slice(0, match.index) + placeholder + redacted.slice(match.index + originalLength);

      // Reset regex lastIndex due to modified string
      regex.lastIndex = match.index + placeholder.length;
      offset += placeholder.length - originalLength;
    }
  }

  return {
    redactedText: redacted,
    redactionMap: entries,
    sensitiveItemsDetected: entries.length,
  };
}

/**
 * Create a redaction map from input (for audit storage).
 * Does NOT store original values — only placeholder, category, and length.
 */
export function createRedactionMap(entries: AriaRedactionEntry[]): AriaRedactionEntry[] {
  // Return sanitised entries — never store actual sensitive values
  return entries.map(e => ({
    placeholder: e.placeholder,
    category: e.category,
    originalLength: e.originalLength,
    position: e.position,
  }));
}

// ── Provider Validation ───────────────────────────────────────────────────

/**
 * Check if a provider is allowed for the detected sensitivity level.
 */
export function validateProviderAllowedForSensitivity(
  provider: AriaProviderName,
  sensitivity: AriaDataSensitivity,
): boolean {
  const allowed = PROVIDER_MAX_SENSITIVITY[provider] ?? [];
  return allowed.includes(sensitivity);
}

/**
 * Block unsafe routing — throws if provider cannot handle sensitivity.
 */
export function blockUnsafeRouting(
  provider: AriaProviderName,
  sensitivity: AriaDataSensitivity,
): void {
  if (!validateProviderAllowedForSensitivity(provider, sensitivity)) {
    throw new AriaSafetyBlockError(
      `Provider '${provider}' is not approved for '${sensitivity}' data. ` +
      `Route blocked to protect sensitive information.`,
    );
  }
}

/**
 * Determine if human approval is required before finalisation.
 */
export function requireHumanApproval(
  taskType: AriaTaskType,
  sensitivity: AriaDataSensitivity,
  riskLevel: string,
): boolean {
  const { TASKS_REQUIRING_APPROVAL } = require("../core/constants");

  if (TASKS_REQUIRING_APPROVAL.includes(taskType)) return true;
  if (riskLevel === "critical" || riskLevel === "high") return true;
  if (sensitivity === "safeguarding_sensitive" || sensitivity === "legal_sensitive") return true;
  return false;
}

// ── Detection Functions ───────────────────────────────────────────────────

export function detectNames(text: string): boolean {
  // UK-style name patterns (Title + Name)
  return /\b(Mr|Mrs|Ms|Miss|Dr|Prof)\s+[A-Z][a-z]+/g.test(text) ||
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(text);
}

export function detectDOBs(text: string): boolean {
  return /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/.test(text) ||
    /\b\d{4}-\d{2}-\d{2}\b/.test(text) ||
    /\bdate\s+of\s+birth\b/i.test(text) ||
    /\bDOB\b/.test(text);
}

export function detectAddresses(text: string): boolean {
  return /\b\d+\s+[A-Z][a-z]+\s+(Road|Street|Lane|Drive|Avenue|Close|Way|Crescent|Court|Place|Terrace|Gardens)\b/i.test(text) ||
    /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/.test(text); // UK postcode (e.g. SW1A 1AA, M1 1AA, EC1A 1BB)
}

export function detectPlacementNames(text: string): boolean {
  return /\b(Oak|Elm|Willow|Beech|Cedar|Maple|Holly|Ivy|Rose|Birch|Chamberlain)\s+(House|Home|Lodge|Cottage|Villa|Court)\b/i.test(text);
}

export function detectLocalAuthorityNames(text: string): boolean {
  return /\b(County|Borough|City|District|Metropolitan)\s+Council\b/i.test(text) ||
    /\bLocal\s+Authority\b/i.test(text);
}

export function detectSchoolNames(text: string): boolean {
  return /\b[A-Z][a-z]+\s+(Academy|School|College|Primary|Secondary|High School|Grammar)\b/.test(text);
}

export function detectNHSInfo(text: string): boolean {
  return /\bNHS\s+number\b/i.test(text) ||
    /\b\d{3}\s?\d{3}\s?\d{4}\b/.test(text) || // NHS number format
    /\b(GP|consultant|clinic|hospital|ward|diagnosis|prescription)\b/i.test(text);
}

export function detectChildIdentifiers(text: string): boolean {
  return /\bchild[-_]?id\b/i.test(text) ||
    /\bLAC\s+\d+/i.test(text) ||
    /\bS47\b/.test(text) ||
    /\bCP\s+Plan\b/i.test(text);
}

export function detectStaffIdentifiers(text: string): boolean {
  return /\bstaff[-_]?id\b/i.test(text) ||
    /\bDBS\s+(number|check)\b/i.test(text) ||
    /\bemployee\s+number\b/i.test(text);
}

export function detectSafeguardingLanguage(text: string): boolean {
  const patterns = [
    /\bsafeguarding\b/i,
    /\bchild\s+protection\b/i,
    /\bsection\s*47\b/i,
    /\bsection\s*17\b/i,
    /\ballegation/i,
    /\bdisclosure\b/i,
    /\babuse\b/i,
    /\bneglect\b/i,
    /\bexploitation\b/i,
    /\b(CSE|CCE)\b/,
    /\bMARAC\b/,
    /\bMAFT\b/,
    /\bLADO\b/,
    /\bstrategy\s+meeting\b/i,
    /\bICPC\b/,
    /\bRCPC\b/,
  ];
  return patterns.some(p => p.test(text));
}

export function detectLegalLanguage(text: string): boolean {
  const patterns = [
    /\bcourt\s+order\b/i,
    /\bcare\s+order\b/i,
    /\binterim\s+care\s+order\b/i,
    /\bsection\s*31\b/i,
    /\bsection\s*20\b/i,
    /\bsolicitor\b/i,
    /\bproceedings\b/i,
    /\btribunal\b/i,
    /\bCAFCASS\b/i,
    /\bguardian\s+ad\s+litem\b/i,
    /\bFamily\s+Court\b/i,
  ];
  return patterns.some(p => p.test(text));
}

export function detectHealthInformation(text: string): boolean {
  const patterns = [
    /\bdiagnos(is|ed)\b/i,
    /\bmedication\b/i,
    /\bprescri(ption|bed)\b/i,
    /\bmental\s+health\b/i,
    /\bCAMHS\b/i,
    /\bself[- ]harm\b/i,
    /\bsuicid(e|al)\b/i,
    /\bADHD\b/,
    /\bASD\b/,
    /\bFASD\b/,
    /\banxiety\b/i,
    /\bdepression\b/i,
    /\bOCD\b/,
    /\beating\s+disorder\b/i,
  ];
  return patterns.some(p => p.test(text));
}

export function detectSelfHarmLanguage(text: string): boolean {
  return /\bself[- ]harm\b/i.test(text) ||
    /\bsuicid(e|al|ality)\b/i.test(text) ||
    /\bself[- ]injur(y|ious)\b/i.test(text) ||
    /\boverdos(e|ed)\b/i.test(text) ||
    /\bligature\b/i.test(text);
}

export function detectExploitationIndicators(text: string): boolean {
  return /\b(CSE|CCE|county\s+lines)\b/i.test(text) ||
    /\bexploit(ation|ed)\b/i.test(text) ||
    /\bgrooming\b/i.test(text) ||
    /\btraffick(ing|ed)\b/i.test(text) ||
    /\bcuckooing\b/i.test(text);
}

export function detectMissingFromCare(text: string): boolean {
  return /\bmissing\s+(from\s+)?(care|home|placement)\b/i.test(text) ||
    /\babscond(ing|ed)\b/i.test(text) ||
    /\bunauthorised\s+absence\b/i.test(text) ||
    /\breturn\s+(home\s+)?interview\b/i.test(text);
}

export function detectRestraintReferences(text: string): boolean {
  return /\brestraint\b/i.test(text) ||
    /\bphysical\s+intervention\b/i.test(text) ||
    /\bholding\b/i.test(text) ||
    /\b(PRICE|MAPA|Team-Teach|PROACT-SCIPr)\b/i.test(text);
}

// ── Internal Helpers ──────────────────────────────────────────────────────

const SENSITIVITY_ORDER: AriaDataSensitivity[] = [
  "public",
  "internal",
  "confidential",
  "staff_sensitive",
  "child_sensitive",
  "health_sensitive",
  "legal_sensitive",
  "safeguarding_sensitive",
];

function escalateSensitivity(
  current: AriaDataSensitivity,
  detected: AriaDataSensitivity,
): AriaDataSensitivity {
  const currentIdx = SENSITIVITY_ORDER.indexOf(current);
  const detectedIdx = SENSITIVITY_ORDER.indexOf(detected);
  return detectedIdx > currentIdx ? detected : current;
}

// ── Redaction Rules ───────────────────────────────────────────────────────

const CATEGORY_PREFIXES: Record<AriaRedactionCategory, string> = {
  child_name: "CHILD",
  staff_name: "STAFF",
  dob: "DOB",
  address: "ADDRESS",
  home_name: "HOME",
  school_name: "SCHOOL",
  local_authority: "LOCAL_AUTHORITY",
  nhs_info: "HEALTH_INFO",
  child_identifier: "CHILD_ID",
  phone_number: "PHONE",
  email: "EMAIL",
  placement_name: "PLACEMENT",
};

interface RedactionRule {
  pattern: string;
  category: AriaRedactionCategory;
}

const REDACTION_RULES: RedactionRule[] = [
  // Email addresses
  { pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", category: "email" },
  // UK phone numbers
  { pattern: "(?:0|\\+44)\\s?\\d{2,4}\\s?\\d{3,4}\\s?\\d{3,4}", category: "phone_number" },
  // UK postcodes (e.g. SW1A 2AA, M1 1AA, EC1A 1BB)
  { pattern: "\\b[A-Z]{1,2}\\d[A-Z\\d]?\\s?\\d[A-Z]{2}\\b", category: "address" },
  // NHS numbers (3-3-4)
  { pattern: "\\b\\d{3}\\s\\d{3}\\s\\d{4}\\b", category: "nhs_info" },
  // Dates (DD/MM/YYYY or YYYY-MM-DD)
  { pattern: "\\b\\d{1,2}[\\/-]\\d{1,2}[\\/-]\\d{2,4}\\b", category: "dob" },
  { pattern: "\\b\\d{4}-\\d{2}-\\d{2}\\b", category: "dob" },
  // Home/placement names — tree-name heuristic + the configured home (keep the
  // last alternative in sync with HOME.name in seed-data.ts so ARIA redacts it).
  { pattern: "\\b(?:Oak|Elm|Willow|Beech|Cedar|Maple|Holly|Ivy|Rose|Birch|Chamberlain)\\s+(?:House|Home|Lodge|Cottage|Villa|Court)\\b", category: "home_name" },
  // School names (requires capitalised proper noun + keyword, not just "at school")
  { pattern: "\\b[A-Z][a-z]{2,}\\s+(?:Academy|College|Primary|Secondary|High School|Grammar School)\\b", category: "school_name" },
  // Local authority names
  { pattern: "\\b[A-Z][a-z]+\\s+(?:County|Borough|City|District)\\s+Council\\b", category: "local_authority" },
  // Titled names (Mr/Mrs/Dr + Name)
  { pattern: "\\b(?:Mr|Mrs|Ms|Miss|Dr|Prof)\\.?\\s+[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?\\b", category: "staff_name" },
];
