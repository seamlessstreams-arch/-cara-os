// ══════════════════════════════════════════════════════════════════════════════
// Cara — SAFEGUARDING GUARDRAILS
//
// Post-generation scan of Cara outputs for safeguarding content. Every
// generated text passes through this scanner which:
//
// 1. Detects safeguarding themes (abuse, exploitation, self-harm, missing, etc.)
// 2. Detects whether the output makes conclusions Cara should not make
// 3. Flags risk language that needs mandatory human review
// 4. Returns a structured result the UI uses to show warnings
//
// This layer runs after the provider response and after the post-processor.
// It does NOT block output — it annotates it with warnings. The approval
// workflow gates whether the output can be committed to records.
//
// The safety.ts layer handles output sanitisation (banned phrases, blame
// language). This layer handles safeguarding-specific content analysis.
// ══════════════════════════════════════════════════════════════════════════════

import { validateOutputSafety } from "@/lib/cara/ai/safety";
import { getSafeguardingSignal, type SafeguardingSignalId } from "@/lib/cara/safeguarding-signals";

// ── Types ──────────────────────────────────────────────────────────────────

export type GuardrailSeverity = "critical" | "warning" | "info";

export interface GuardrailFlag {
  id: string;
  severity: GuardrailSeverity;
  category: string;
  message: string;
  /** Matched text snippet for the reviewer to see */
  matchedSnippet?: string;
}

export interface GuardrailResult {
  /** Whether any flags were raised */
  flagged: boolean;
  /** Whether a critical flag demands mandatory human review */
  mandatoryReview: boolean;
  /** Individual flags sorted by severity */
  flags: GuardrailFlag[];
  /** Short summary for the banner */
  summary: string;
}

// ── Safeguarding theme patterns ──────────────────────────────────────────────

interface ThemePattern {
  id: string;
  category: string;
  pattern: RegExp;
  severity: GuardrailSeverity;
  message: string;
}

// Patterns are sourced from the canonical safeguarding-signals registry (defined
// ONCE there), so this scanner and every other detector share one set of
// patterns. Guardrails keeps its OWN severity + message: those are tuned for
// "does this AI output need human review" (a different axis from the registry's
// real-world action urgency), so they must not be derived from the registry.
const sig = (id: SafeguardingSignalId): RegExp => getSafeguardingSignal(id).pattern;

/** Union of several canonical patterns into one case-insensitive matcher. */
function unionSignals(...ids: SafeguardingSignalId[]): RegExp {
  return new RegExp(ids.map((id) => `(?:${getSafeguardingSignal(id).pattern.source})`).join("|"), "i");
}

const SAFEGUARDING_THEMES: ThemePattern[] = [
  {
    id: "sg_physical_abuse",
    category: "safeguarding",
    pattern: sig("physical_abuse"),
    severity: "critical",
    message: "Physical abuse indicators detected. This output requires mandatory safeguarding-qualified human review.",
  },
  {
    id: "sg_sexual",
    category: "safeguarding",
    pattern: sig("sexual_harm_exploitation"),
    severity: "critical",
    message: "Sexual abuse/exploitation indicators detected. This output requires mandatory safeguarding-qualified human review.",
  },
  {
    id: "sg_self_harm",
    category: "safeguarding",
    pattern: sig("self_harm"),
    severity: "critical",
    message: "Self-harm or suicidal ideation indicators detected. Mandatory review required before any output is shared.",
  },
  {
    id: "sg_missing",
    category: "safeguarding",
    pattern: sig("missing_from_care"),
    severity: "warning",
    message: "Missing from care references detected. Verify return interview and risk assessment are in place.",
  },
  {
    id: "sg_allegation",
    category: "safeguarding",
    pattern: sig("allegation_against_staff"),
    severity: "critical",
    message: "Staff allegation references detected. LADO referral status must be verified by a human.",
  },
  {
    id: "sg_neglect",
    category: "safeguarding",
    pattern: sig("neglect"),
    severity: "warning",
    message: "Neglect indicators detected. Verify source evidence supports these references.",
  },
  {
    // Guardrails treats contextual exploitation and radicalisation as one theme;
    // the registry separates them (different statutory routes), so union both to
    // preserve this scanner's existing coverage.
    id: "sg_contextual",
    category: "safeguarding",
    pattern: unionSignals("contextual_exploitation", "radicalisation"),
    severity: "critical",
    message: "Contextual safeguarding themes detected. Mandatory senior manager review.",
  },
  {
    id: "sg_restraint",
    category: "practice",
    pattern: sig("restrictive_practice"),
    severity: "warning",
    message: "Physical intervention references detected. Verify body map and debrief records exist.",
  },
  {
    id: "sg_medication",
    category: "practice",
    pattern: sig("medication_error"),
    severity: "warning",
    message: "Medication concern detected. Verify against medication administration records.",
  },
  {
    id: "sg_bullying",
    category: "safeguarding",
    pattern: sig("peer_abuse_bullying"),
    severity: "warning",
    message: "Bullying references detected. Verify anti-bullying strategy and follow-up actions.",
  },
];

// ── Conclusion patterns Cara should not make ─────────────────────────────────

const CONCLUSION_PATTERNS: ThemePattern[] = [
  {
    id: "conc_suitability",
    category: "conclusion",
    pattern: /\b(?:the\s+child\s+(?:is|should\s+be)\s+(?:safe|unsafe)|the\s+(?:home|placement)\s+is\s+(?:safe|unsafe|suitable|unsuitable))\b/i,
    severity: "critical",
    message: "Cara must not declare safety or suitability. Only qualified humans make these determinations.",
  },
  {
    id: "conc_referral_decision",
    category: "conclusion",
    pattern: /\b(?:this\s+(?:should|must|needs\s+to)\s+be\s+referred\s+to\s+(?:police|LADO|social\s+(?:services|worker)|Ofsted))\b/i,
    severity: "warning",
    message: "Cara should flag referral considerations but must not instruct referrals. Referral decisions belong to the Designated Safeguarding Lead.",
  },
  {
    id: "conc_fitness",
    category: "conclusion",
    pattern: /\b(?:(?:the\s+staff\s+member|this\s+person)\s+(?:is|should\s+be)\s+(?:dismissed|suspended|unfit|unsuitable))\b/i,
    severity: "critical",
    message: "Cara must not determine staff fitness or disciplinary outcomes. These are HR and management decisions.",
  },
  {
    id: "conc_diagnosis",
    category: "conclusion",
    pattern: /\b(?:the\s+child\s+(?:has|is\s+(?:suffering|living)\s+with)\s+(?:PTSD|anxiety|depression|ADHD|ASD|attachment\s+disorder))\b/i,
    severity: "critical",
    message: "Cara must not diagnose. Clinical conditions must be diagnosed by qualified health professionals.",
  },
];

// ── Risk language requiring review ──────────────────────────────────────────

const RISK_LANGUAGE: ThemePattern[] = [
  {
    id: "risk_escalating",
    category: "risk",
    pattern: /\b(?:escalating\s+(?:risk|concern|behaviour|pattern)|deteriorat(?:ing|ion)|increasing\s+frequency)\b/i,
    severity: "warning",
    message: "Escalating risk language detected. Verify the pattern is supported by the source evidence.",
  },
  {
    id: "risk_imminent",
    category: "risk",
    pattern: /\b(?:imminent\s+(?:risk|danger|harm)|immediate\s+(?:risk|concern|danger)|at\s+risk\s+of\s+(?:significant\s+)?harm)\b/i,
    severity: "critical",
    message: "Imminent risk language detected. This requires immediate senior manager review.",
  },
  {
    id: "risk_pattern",
    category: "risk",
    pattern: /\b(?:recurring\s+pattern|repeated\s+(?:incidents?|concerns?|shortfalls?)|pattern\s+of\s+(?:behaviour|concern|risk))\b/i,
    severity: "info",
    message: "Pattern language detected. Verify the pattern claim against the actual record count and dates.",
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SCANNER
// ══════════════════════════════════════════════════════════════════════════════

export function scanForSafeguardingFlags(
  text: string,
  commandRiskLevel: "low" | "medium" | "high" = "medium",
): GuardrailResult {
  if (!text || text.length === 0) {
    return { flagged: false, mandatoryReview: false, flags: [], summary: "" };
  }

  const flags: GuardrailFlag[] = [];

  // Run all pattern sets
  const allPatterns = [
    ...SAFEGUARDING_THEMES,
    ...CONCLUSION_PATTERNS,
    ...RISK_LANGUAGE,
  ];

  for (const theme of allPatterns) {
    const match = theme.pattern.exec(text);
    if (match) {
      flags.push({
        id: theme.id,
        severity: theme.severity,
        category: theme.category,
        message: theme.message,
        matchedSnippet: extractSnippet(text, match.index, match[0].length),
      });
    }
  }

  // Also run the existing safety validator for diagnostic/blame/conclusion patterns
  const safetyResult = validateOutputSafety(text);
  for (const warning of safetyResult.warnings) {
    flags.push({
      id: `safety_${flags.length}`,
      severity: "warning",
      category: "safety",
      message: warning,
    });
  }

  // If command is high-risk and any flags exist, bump to mandatory review
  const hasCritical = flags.some((f) => f.severity === "critical");
  const mandatoryReview =
    hasCritical || (commandRiskLevel === "high" && flags.length > 0);

  // Sort: critical first, then warning, then info
  const severityOrder: Record<GuardrailSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  flags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // De-duplicate by id
  const seen = new Set<string>();
  const deduped = flags.filter((f) => {
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });

  // Build summary
  const criticalCount = deduped.filter((f) => f.severity === "critical").length;
  const warningCount = deduped.filter((f) => f.severity === "warning").length;
  const summaryParts: string[] = [];
  if (criticalCount > 0) summaryParts.push(`${criticalCount} critical`);
  if (warningCount > 0) summaryParts.push(`${warningCount} warning`);

  return {
    flagged: deduped.length > 0,
    mandatoryReview,
    flags: deduped,
    summary:
      deduped.length > 0
        ? `${deduped.length} safeguarding flag${deduped.length !== 1 ? "s" : ""} detected (${summaryParts.join(", ")}). ${mandatoryReview ? "Mandatory human review required." : "Review recommended."}`
        : "",
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractSnippet(
  text: string,
  matchIndex: number,
  matchLength: number,
): string {
  const contextChars = 40;
  const start = Math.max(0, matchIndex - contextChars);
  const end = Math.min(text.length, matchIndex + matchLength + contextChars);
  let snippet = text.slice(start, end).replace(/\n/g, " ");
  if (start > 0) snippet = "…" + snippet;
  if (end < text.length) snippet = snippet + "…";
  return snippet;
}

// ── Exports for testing ──────────────────────────────────────────────────────
export const _testing = {
  SAFEGUARDING_THEMES,
  CONCLUSION_PATTERNS,
  RISK_LANGUAGE,
  extractSnippet,
};
