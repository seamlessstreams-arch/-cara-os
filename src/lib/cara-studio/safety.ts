// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — Safety Layer
//
// Pre-generation and post-generation safety checks.
//
// Pre-generation:
//   - Validates request doesn't reference excluded categories
//   - Checks for attempts to extract PII
//   - Validates tone/audience combinations
//   - Flags high-risk generation types requiring approval
//
// Post-generation:
//   - Scans output for unsafe content patterns
//   - Checks for clinical language / diagnosis
//   - Validates no PII leakage
//   - Flags statutory content requiring sign-off
//   - Scores overall safety
// ══════════════════════════════════════════════════════════════════════════════

import type { GenerationType, Tone, Audience, SafetyAssessment, SafetyFlag, GenerationOutput } from "./types";

// ── Pre-Generation Check ─────────────────────────────────────────────────────

export function preGenerationCheck(params: {
  generationType: GenerationType;
  brief: string;
  tone: Tone;
  audience: Audience;
  hasProfile: boolean;
}): SafetyAssessment {
  const flags: SafetyFlag[] = [];
  const warnings: string[] = [];
  const blockers: string[] = [];
  const recommendations: string[] = [];

  // Check brief for problematic content
  const briefLower = params.brief.toLowerCase();

  // PII extraction attempts
  const piiPatterns = [
    /national insurance/i,
    /passport number/i,
    /bank account/i,
    /address.*parent/i,
    /phone.*(?:social worker|parent|family)/i,
    /nhs number/i,
  ];
  for (const pattern of piiPatterns) {
    if (pattern.test(params.brief)) {
      blockers.push("Request appears to seek personally identifiable information (PII). Cara Studio cannot generate content containing PII.");
      flags.push({ code: "PII_REQUEST", severity: "critical", message: "PII extraction attempt detected" });
    }
  }

  // Harmful content patterns
  const harmfulPatterns = [
    { pattern: /restraint.*technique/i, message: "Restraint technique generation is not permitted — refer to approved physical intervention training" },
    { pattern: /medication.*dos(?:age|ing)/i, message: "Cara Studio cannot provide medication dosing guidance — refer to prescriber" },
    { pattern: /diagnos/i, message: "Cara Studio cannot diagnose — refer to clinical professionals" },
  ];
  for (const { pattern, message } of harmfulPatterns) {
    if (pattern.test(params.brief)) {
      blockers.push(message);
      flags.push({ code: "HARMFUL_CONTENT", severity: "critical", message });
    }
  }

  // Statutory content warnings
  const statutoryTypes: GenerationType[] = [
    "PLACEMENT_PLAN_DRAFT",
    "RISK_ASSESSMENT_DRAFT",
    "CARE_PLAN_DRAFT",
  ];
  if (statutoryTypes.includes(params.generationType)) {
    warnings.push("This generates DRAFT statutory content. It MUST be reviewed, edited, and approved by a qualified professional before being committed to official records.");
    flags.push({
      code: "STATUTORY_DRAFT",
      severity: "warning",
      message: "Statutory document draft — requires professional sign-off",
    });
    recommendations.push("Ensure the approving professional has the appropriate qualification and role to sign off this document type.");
  }

  // High-sensitivity types
  const sensitiveTypes: GenerationType[] = [
    "LIFE_STORY_SESSION",
    "MISSING_RETURN_HOME_SUPPORT",
    "EMOTIONAL_REGULATION_SESSION",
    "RELATIONSHIP_REPAIR_SESSION",
  ];
  if (sensitiveTypes.includes(params.generationType)) {
    warnings.push("This content type involves sensitive topics. Review carefully before use and adapt to the individual child's presentation on the day.");
    flags.push({
      code: "SENSITIVE_CONTENT",
      severity: "warning",
      message: "High-sensitivity content — tailor to child's current state",
    });
  }

  // Profile requirement check
  const childRequiredTypes: GenerationType[] = [
    "KEYWORK_SESSION",
    "DIRECT_WORK_SESSION",
    "LIFE_STORY_SESSION",
    "MISSING_RETURN_HOME_SUPPORT",
    "BEHAVIOUR_SUPPORT_IDEAS",
    "EMOTIONAL_REGULATION_SESSION",
    "RELATIONSHIP_REPAIR_SESSION",
    "EDUCATION_SUPPORT_SESSION",
    "INDEPENDENCE_SESSION",
    "FAMILY_TIME_PREPARATION",
    "FLASHCARDS",
    "YOUNG_PERSON_EXPLAINER",
  ];
  if (childRequiredTypes.includes(params.generationType) && !params.hasProfile) {
    warnings.push("This generation type works best with a child profile. Content will be generic without it.");
    flags.push({
      code: "NO_PROFILE",
      severity: "warning",
      message: "No child profile provided — output will be generic",
    });
  }

  // Tone/audience mismatch
  if (params.audience === "young_person" && params.tone === "formal") {
    warnings.push("Formal tone is not recommended for young person audience. Consider 'playful' or 'calm_reassuring'.");
    flags.push({
      code: "TONE_MISMATCH",
      severity: "info",
      message: "Tone/audience mismatch — formal tone with young person",
    });
  }

  const score = blockers.length > 0 ? 0 : warnings.length > 2 ? 50 : warnings.length > 0 ? 75 : 100;

  return {
    passed: blockers.length === 0,
    score,
    flags,
    warnings,
    blockers,
    recommendations,
  };
}

// ── Post-Generation Check ────────────────────────────────────────────────────

export function postGenerationCheck(
  output: GenerationOutput,
  generationType: GenerationType,
): SafetyAssessment {
  const flags: SafetyFlag[] = [];
  const warnings: string[] = [];
  const blockers: string[] = [];
  const recommendations: string[] = [];

  // Flatten all content for scanning
  const allContent = [
    output.title,
    output.summary,
    ...output.sections.map((s) => s.content),
    ...output.sections.flatMap((s) => s.items ?? []),
  ].join(" ");

  const contentLower = allContent.toLowerCase();

  // Check for clinical/diagnostic language
  const clinicalPatterns = [
    { pattern: /\bdiagnos(?:ed|is|e)\b/i, code: "CLINICAL_LANGUAGE" },
    { pattern: /\bprescrib(?:e|ed|ing)\b/i, code: "PRESCRIBING_LANGUAGE" },
    { pattern: /\bdisorder\b/i, code: "DIAGNOSTIC_LABEL" },
    { pattern: /\bsymptom(?:s)?\b/i, code: "CLINICAL_LANGUAGE" },
  ];
  for (const { pattern, code } of clinicalPatterns) {
    if (pattern.test(allContent)) {
      warnings.push("Output contains clinical/diagnostic language. Review to ensure it's appropriate for the audience.");
      flags.push({ code, severity: "warning", message: "Clinical language detected — review for appropriateness" });
      break; // Only flag once
    }
  }

  // Check for punitive language
  const punitivePatterns = [
    /\bpunish/i,
    /\bconsequence.*bad\s*behaviour/i,
    /\bnaughty\b/i,
    /\bground(?:ed|ing)\b/i,
    /\btime\s*out\b/i,
    /\bbad\s*(?:boy|girl|child|kid)\b/i,
  ];
  for (const pattern of punitivePatterns) {
    if (pattern.test(allContent)) {
      warnings.push("Output may contain punitive language. Cara Studio content must be non-punitive and strengths-based.");
      flags.push({ code: "PUNITIVE_LANGUAGE", severity: "warning", message: "Potentially punitive language detected" });
      break;
    }
  }

  // Check for potential PII in output
  const piiOutputPatterns = [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,  // Phone numbers
    /\b[A-Z]{2}\d{2}\s?\d[A-Z]{2}\b/,  // UK postcodes
    /\b\d{10,}\b/,                       // Long number sequences
  ];
  for (const pattern of piiOutputPatterns) {
    if (pattern.test(allContent)) {
      blockers.push("Output appears to contain personally identifiable information. This must be removed before use.");
      flags.push({ code: "PII_IN_OUTPUT", severity: "critical", message: "Potential PII detected in generated content" });
      break;
    }
  }

  // Check output length (too short = likely failed)
  if (allContent.length < 100) {
    warnings.push("Output is unusually short. Consider regenerating.");
    flags.push({ code: "SHORT_OUTPUT", severity: "info", message: "Output below expected length" });
  }

  // Statutory draft reminders
  const statutoryTypes: GenerationType[] = ["PLACEMENT_PLAN_DRAFT", "RISK_ASSESSMENT_DRAFT", "CARE_PLAN_DRAFT"];
  if (statutoryTypes.includes(generationType)) {
    recommendations.push("This draft MUST be reviewed by a qualified professional before being committed to statutory records.");
    recommendations.push("Check all facts against existing records — AI may extrapolate beyond available evidence.");
    flags.push({ code: "REQUIRES_APPROVAL", severity: "warning", message: "Statutory draft — requires professional approval" });
  }

  // Score calculation
  let score = 100;
  if (blockers.length > 0) score = 0;
  else {
    score -= flags.filter((f) => f.severity === "warning").length * 15;
    score -= flags.filter((f) => f.severity === "info").length * 5;
    score = Math.max(0, score);
  }

  return {
    passed: blockers.length === 0,
    score,
    flags,
    warnings,
    blockers,
    recommendations,
  };
}
