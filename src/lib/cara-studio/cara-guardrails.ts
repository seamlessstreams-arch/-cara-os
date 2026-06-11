// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — GUARDRAIL ENGINE
//
// Deterministic safety net over every generated output. Scans the FULL
// serialised output for blaming, shaming, punitive, interrogating, secrecy,
// restraint, diagnosis, confidentiality and unsafe-practice patterns;
// assigns a severity; decides the action:
//
//   allow                  → no flags
//   flag_for_review        → low/medium flags: shown with a review banner
//   block_pending_review   → high/critical: NOT shown to staff until a
//                            manager reviews (critical never bypasses).
//
// Also owns the §23 manager-review rules (computeManagerReview) so routes
// apply one consistent policy. Pure functions; no IO.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CaraGuardrailResult,
  GuardrailFlag,
  GuardrailSeverity,
} from "./cara-types";

interface GuardrailRule {
  risk_type: string;
  severity: GuardrailSeverity;
  pattern: RegExp;
  guidance: string;
}

// NOTE: patterns are deliberately conservative — they catch phrasing that has
// no place in child-facing or staff-facing therapeutic material. False
// positives go to review, never silently dropped.
const RULES: GuardrailRule[] = [
  // ── Blaming / shaming / punitive ──
  { risk_type: "blaming", severity: "high", pattern: /\b(it'?s|this is) (all |entirely )?(your|the child'?s) fault\b/i, guidance: "Never attribute fault to the child. Reframe around the unmet need." },
  { risk_type: "blaming", severity: "medium", pattern: /\byou (brought this on yourself|only have yourself to blame|made (me|us|staff) do)\b/i, guidance: "Blame language — reframe with curiosity about what was happening for the child." },
  { risk_type: "shaming", severity: "high", pattern: /\b(you should be ashamed|shame on you|embarrass(ed)? of yourself|disgrace(ful)?)\b/i, guidance: "Shaming language is never acceptable in therapeutic material." },
  { risk_type: "shaming", severity: "medium", pattern: /\byou'?re (a )?(bad|naughty|horrible|nasty) (kid|child|boy|girl|person)\b/i, guidance: "Labels the child rather than the behaviour." },
  { risk_type: "punitive", severity: "high", pattern: /\b(as punishment|to punish|you will be punished|lose (all )?(your )?privileges|grounded until)\b/i, guidance: "Punitive framing — consequences belong to manager-overseen plans, not learning materials." },
  { risk_type: "threatening", severity: "high", pattern: /\b(or else|you'?ll regret|last warning|final warning|if you do that again[, ]+(there will|you will))\b/i, guidance: "Threat constructions escalate distress and damage trust." },

  // ── Restraint / sanctions without oversight ──
  { risk_type: "restraint_without_oversight", severity: "critical", pattern: /\b(restrain|physical intervention|hold (him|her|them) down|pin (him|her|them))\b/i, guidance: "Any reference to physical intervention requires manager oversight and the home's approved framework — never a generated suggestion." },
  { risk_type: "sanction_without_oversight", severity: "medium", pattern: /\b(sanction|confiscate|withhold (food|contact|family time))\b/i, guidance: "Sanctions need manager oversight; withholding food or family time is never acceptable." },

  // ── Interrogation ──
  { risk_type: "interrogation", severity: "medium", pattern: /\b(interrogate|demand (an )?answers?|make (him|her|them) (tell|explain|admit)|don'?t let (him|her|them) leave until)\b/i, guidance: "Staff explore with curiosity — they never interrogate or detain." },

  // ── Secrecy / confidentiality ──
  { risk_type: "secrecy", severity: "critical", pattern: /\b(keep (this|it) (a )?secret|just between us|don'?t tell (anyone|your manager|staff|the home)|our little secret|promise not to tell)\b/i, guidance: "Never promise secrecy. Be honest about what must be shared and why." },
  { risk_type: "confidentiality_breach", severity: "high", pattern: /\b(share (this|the child'?s (file|records?)) (publicly|on social media)|post (this|it) online)\b/i, guidance: "Child-specific content must never leave authorised channels." },

  // ── Clinical overreach ──
  { risk_type: "diagnosis_claim", severity: "high", pattern: /\b(the child (has|suffers from|is) (adhd|autistic|autism|ptsd|bipolar|a personality disorder)\b(?! (traits|needs profile)))/i, guidance: "Cara never diagnoses. Describe needs and presentations, not diagnoses, unless formally recorded by a clinician." },
  { risk_type: "therapy_replacement", severity: "medium", pattern: /\b(this (session|material) (replaces|is a substitute for) (therapy|counselling)|no need for (a )?(therapist|camhs))\b/i, guidance: "Cara supports relational practice; it never replaces therapy." },

  // ── Safeguarding minimisation ──
  { risk_type: "safeguarding_minimisation", severity: "critical", pattern: /\b(probably (nothing|fine)|no need to (report|refer|tell anyone)|don'?t (involve|bother) (the )?(lado|police|social worker)|it'?s not (really )?exploitation)\b/i, guidance: "Concerns are never minimised. Follow safeguarding procedures every time." },
  { risk_type: "unsafe_practice", severity: "high", pattern: /\b(alone in (his|her|their) bedroom with the door (closed|locked)|off[- ]record|don'?t log (this|it)|skip the (risk assessment|policy))\b/i, guidance: "Generated guidance must never bypass policy, recording or safe-working practice." },
];

const SEVERITY_ORDER: GuardrailSeverity[] = ["low", "medium", "high", "critical"];

function maxSeverity(flags: GuardrailFlag[]): GuardrailSeverity | null {
  let max: GuardrailSeverity | null = null;
  for (const f of flags) {
    if (!max || SEVERITY_ORDER.indexOf(f.severity) > SEVERITY_ORDER.indexOf(max)) max = f.severity;
  }
  return max;
}

// Fields that intentionally QUOTE unacceptable phrasing as negative examples
// (e.g. a blueprint's avoid-phrases list). They are teaching artefacts, not
// generated advice, so they are excluded from the scan.
const QUOTED_EXAMPLE_FIELDS = new Set(["avoidPhrases", "avoid_phrases"]);

function stripQuotedExamples(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripQuotedExamples);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (QUOTED_EXAMPLE_FIELDS.has(k)) continue;
      out[k] = stripQuotedExamples(v);
    }
    return out;
  }
  return value;
}

/** Scan any serialisable output. Returns flags, severity and the action. */
export function runCaraGuardrails(output: unknown): CaraGuardrailResult {
  const text = typeof output === "string" ? output : JSON.stringify(stripQuotedExamples(output));
  const flags: GuardrailFlag[] = [];
  for (const rule of RULES) {
    const m = text.match(rule.pattern);
    if (m) {
      flags.push({
        risk_type: rule.risk_type,
        severity: rule.severity,
        matched_text: m[0].slice(0, 120),
        guidance: rule.guidance,
      });
    }
  }
  const severity = maxSeverity(flags);
  const action: CaraGuardrailResult["action"] =
    severity === "critical" || severity === "high"
      ? "block_pending_review"
      : severity
        ? "flag_for_review"
        : "allow";
  return { passed: flags.length === 0, severity, flags, action };
}

// ── §23 Manager-review policy ─────────────────────────────────────────────────

const HIGH_RISK_THEMES =
  /\b(exploitation|cse|cce|self[- ]harm|suicid|violence|sexual|missing|abuse|disclosure|trafficking|weapon|overdose)\b/i;

export interface ManagerReviewInput {
  emotionalIntensity?: "low" | "medium" | "high";
  staffConfidence?: "low" | "medium" | "high";
  topicOrTheme: string;
  fromSeriousIncident?: boolean;
  childTriggerMatch?: boolean;
  guardrailSeverity: GuardrailSeverity | null;
  outputText: string;
}

export interface ManagerReviewDecision {
  required: boolean;
  reasons: string[];
}

export function computeManagerReview(input: ManagerReviewInput): ManagerReviewDecision {
  const reasons: string[] = [];
  if (input.emotionalIntensity === "high") reasons.push("High emotional intensity");
  if (HIGH_RISK_THEMES.test(input.topicOrTheme)) reasons.push("High-risk theme (exploitation, harm, missing, abuse or similar)");
  if (HIGH_RISK_THEMES.test(input.outputText)) reasons.push("Generated content touches safeguarding-sensitive territory");
  if (input.staffConfidence === "low" && input.emotionalIntensity !== "low") {
    reasons.push("Low staff confidence on a non-trivial topic — pair with a senior before use");
  }
  if (input.fromSeriousIncident) reasons.push("Converted from a serious incident");
  if (input.childTriggerMatch) reasons.push("Topic overlaps the child's known triggers");
  if (input.guardrailSeverity && input.guardrailSeverity !== "low") {
    reasons.push(`Guardrail severity ${input.guardrailSeverity}`);
  }
  return { required: reasons.length > 0, reasons: [...new Set(reasons)] };
}
