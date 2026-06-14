// ══════════════════════════════════════════════════════════════════════════════
// CARA INTELLIGENCE — PACE practice engine · ANALYZER
//
// Scans a staff-written record and RECOGNISES: evidence of each PACE element,
// whether it explores the need beneath behaviour (not just the behaviour),
// blaming/shaming/punitive/adult-reactive language, missing child voice,
// de-escalation, co-regulation, repair, boundaries, connect-before-correct, and
// whether the response was trauma-informed and safeguarding-aware. Deterministic
// (no AI key, no clock). Cara recognises and advises; humans decide. It quotes
// evidence from the record — it never invents events.
// ══════════════════════════════════════════════════════════════════════════════

import {
  ADULT_TRIGGER_CUES, ANTI_CURIOSITY_CUES, BLAME_CUES, BOUNDARY_CUES, CHILD_VOICE_CUES,
  DEESCALATION_CUES, ELEMENT_CUES, NEED_CUES, PACE_DISCLAIMER, PACE_PROMPTS, PACE_SCRIPTS,
  PUNITIVE_CUES, REGULATION_CUES, REPAIR_CUES, RISK_CUES, RISKY_CONTEXTS, SHAMING_CUES,
} from "./pace.constants";
import { scorePACE, type PACEScoreSignals } from "./paceQualityAssurance";
import type {
  PACEAnalysisInput, PACEAnalysisResult, PACEElement, PACEElementEvidence, PACEFlag,
  PACEPracticePrompt, PACERecommendation,
} from "./pace.types";

const ELEMENTS: PACEElement[] = ["PLAYFULNESS", "ACCEPTANCE", "CURIOSITY", "EMPATHY"];
const ESCALATION_CUES = ["escalat", "manager", "safeguard", "social worker", "notified", "reported to", "designated", "reg 40", "regulation 40", "notifiable", "on-call", "on call"];

function norm(t: string): string { return (t ?? "").toLowerCase(); }
function matched(text: string, cues: string[]): string[] {
  const t = norm(text);
  return cues.filter((c) => t.includes(c));
}
function has(text: string, cues: string[]): boolean { return matched(text, cues).length > 0; }

export function analyzePACE(input: PACEAnalysisInput): PACEAnalysisResult {
  const text = input.text ?? "";
  const longEnough = text.trim().length > 120;
  const riskyContext = RISKY_CONTEXTS.includes(input.context);

  // ── Signals ──
  const riskHits = matched(text, RISK_CUES);
  const riskPresent = !!input.riskPresentHint || riskHits.length > 0 || riskyContext;
  const childVoicePresent = has(text, CHILD_VOICE_CUES);
  const exploresNeed = has(text, NEED_CUES);
  const hasRepair = has(text, REPAIR_CUES);
  const hasDeescalation = has(text, DEESCALATION_CUES);
  const hasRegulation = has(text, REGULATION_CUES);
  const hasBoundary = has(text, BOUNDARY_CUES);
  const blameBased = has(text, BLAME_CUES);
  const shaming = has(text, SHAMING_CUES);
  const punitive = has(text, PUNITIVE_CUES);
  const adultTrigger = has(text, ADULT_TRIGGER_CUES);
  const antiCuriosity = has(text, ANTI_CURIOSITY_CUES);
  const escalationEvidenced = has(text, ESCALATION_CUES);

  // ── PACE element evidence ──
  const elements: PACEElementEvidence[] = ELEMENTS.map((element) => {
    const ev = matched(text, ELEMENT_CUES[element]);
    // "Why did you do that?" is not curiosity — suppress curiosity if anti-pattern present.
    const present = element === "CURIOSITY" ? ev.length > 0 && !antiCuriosity : ev.length > 0;
    return { element, present, evidence: ev, confidence: present ? Math.min(1, ev.length * 0.5) : 0 };
  });
  const elementsPresent = new Set(elements.filter((e) => e.present).map((e) => e.element));

  const connectBeforeCorrect =
    (elementsPresent.has("ACCEPTANCE") || elementsPresent.has("EMPATHY") || elementsPresent.has("CURIOSITY")) &&
    !shaming &&
    (exploresNeed || hasDeescalation || hasRegulation || hasRepair);

  // ── Flags ──
  const flags: PACEFlag[] = [];
  const flag = (f: PACEFlag) => flags.push(f);
  if (shaming) flag({ flag: "SHAMING_LANGUAGE", severity: "high", title: "Shaming language", description: "The record contains language that may shame the child rather than describe behaviour objectively.", evidence: matched(text, SHAMING_CUES), recommendedAction: "Rewrite objectively: describe what was observed, separate the feeling from the behaviour, and remove labels." });
  if (blameBased) flag({ flag: "BLAME_BASED_RECORDING", severity: "medium", title: "Blame-based recording", description: "Wording frames the child as deliberately at fault rather than exploring need and context.", evidence: matched(text, BLAME_CUES), recommendedAction: "Describe the behaviour and what may have driven it; avoid 'deliberately', 'non-compliant', 'for no reason'." });
  if (antiCuriosity) flag({ flag: "BLAME_BASED_RECORDING", severity: "medium", title: "Judgemental questioning (not PACE curiosity)", description: "Questions like 'why did you do that?' demand justification and shut down trust. PACE curiosity wonders non-judgementally.", evidence: matched(text, ANTI_CURIOSITY_CUES), recommendedAction: "Replace with wondering: 'I wonder if something about that felt unfair / unsafe.'" });
  if (punitive && !elementsPresent.has("ACCEPTANCE") && !elementsPresent.has("EMPATHY")) flag({ flag: "PUNITIVE_RESPONSE", severity: shaming ? "high" : "medium", title: "Punitive / sanction-first response", description: "The response leads with sanction/consequence without evidence of connection or understanding the need.", evidence: matched(text, PUNITIVE_CUES), recommendedAction: "Connect before correct: attend to the feeling and need, then hold the boundary calmly and proportionately." });
  if (adultTrigger) flag({ flag: "ADULT_TRIGGER", severity: "medium", title: "Adult-triggered / reactive response", description: "The record suggests the staff member's own emotional response may have driven the interaction (blocked care).", evidence: matched(text, ADULT_TRIGGER_CUES), recommendedAction: "Reflect in supervision on the trigger; plan co-regulation and self-regulation strategies." });
  if (!childVoicePresent && longEnough) flag({ flag: "MISSING_CHILD_VOICE", severity: "medium", title: "Child's voice missing", description: "The record does not capture what the child said, showed or experienced.", evidence: [], recommendedAction: "Add the child's voice — their words, what they showed, and how things were for them." });
  if (!exploresNeed && longEnough && (riskyContext || blameBased)) flag({ flag: "BEHAVIOUR_WITHOUT_NEED", severity: "medium", title: "Behaviour described without the need beneath it", description: "The record focuses on behaviour without exploring the unmet need, feeling, trigger or context.", evidence: [], recommendedAction: "Ask what the behaviour was communicating — the need, feeling or trigger underneath." });
  if ((riskPresent || riskyContext) && !hasDeescalation) flag({ flag: "NO_DEESCALATION", severity: "medium", title: "No de-escalation recorded", description: "Risk/incident context with no de-escalation steps captured.", evidence: [], recommendedAction: "Record the de-escalation tried — space, lowered voice, reduced demands, time to settle." });
  if (riskPresent && !hasRegulation) flag({ flag: "NO_REGULATION", severity: "low", title: "Co-regulation not evidenced", description: "No evidence the adult stayed regulated and supported the child to settle.", evidence: [], recommendedAction: "Record how you stayed calm and helped the child regulate (co-regulation)." });
  if ((riskPresent || input.context === "INCIDENT" || input.context === "PHYSICAL_INTERVENTION") && !hasRepair) flag({ flag: "NO_REPAIR", severity: "medium", title: "Relationship repair missing", description: "No evidence of reconnection/repair after the rupture.", evidence: [], recommendedAction: "Plan and record relationship repair — return when calm, reassure, rebuild connection." });
  if (riskPresent && !hasBoundary) flag({ flag: "UNSAFE_BOUNDARY", severity: "high", title: "Risk described without a safety/boundary action", description: "Unsafe behaviour or risk is described but no boundary or safety action is recorded.", evidence: riskHits, recommendedAction: "Record the boundary held and the action taken to keep the child and others safe." });
  if (riskPresent) flag({ flag: "PROFESSIONAL_JUDGEMENT_REQUIRED", severity: "high", title: "Professional judgement required", description: "Risk is present. Cara advises only — a manager/safeguarding decision is required.", evidence: riskHits, recommendedAction: "Apply professional judgement; confirm safeguarding/manager escalation as appropriate." });

  // ── Missing facets ──
  const missing: string[] = [];
  if (!childVoicePresent) missing.push("the child's voice");
  if (!exploresNeed) missing.push("the need beneath the behaviour");
  if (!elementsPresent.has("ACCEPTANCE")) missing.push("acceptance of the feeling");
  if (!elementsPresent.has("EMPATHY")) missing.push("empathy (the child not being alone)");
  if (!elementsPresent.has("CURIOSITY")) missing.push("curiosity about meaning");
  if ((riskPresent || riskyContext) && !hasDeescalation) missing.push("de-escalation steps");
  if (riskPresent && !hasRegulation) missing.push("co-regulation");
  if ((riskPresent || input.context === "INCIDENT") && !hasRepair) missing.push("relationship repair");
  if (riskPresent && !hasBoundary) missing.push("a boundary / safety action");

  // ── Score ──
  const signals: PACEScoreSignals = {
    elementsPresent, connectBeforeCorrect, exploresNeed, childVoicePresent, hasRepair,
    hasDeescalation, hasRegulation, hasBoundary, blameBased, shaming, antiCuriosity,
    riskPresent, escalationEvidenced, riskyContext,
  };
  const score = scorePACE(signals);

  // ── Recommendations ──
  const recommendations: PACERecommendation[] = [];
  for (const f of flags) {
    const area: PACERecommendation["area"] =
      f.flag === "MISSING_CHILD_VOICE" ? "CHILD_VOICE"
      : f.flag === "NO_REPAIR" ? "REPAIR"
      : f.flag === "NO_REGULATION" || f.flag === "NO_DEESCALATION" ? "REGULATION"
      : f.flag === "UNSAFE_BOUNDARY" ? "BOUNDARY"
      : f.flag === "PROFESSIONAL_JUDGEMENT_REQUIRED" ? "SAFEGUARDING"
      : "RECORDING";
    recommendations.push({
      priority: f.severity === "critical" || f.severity === "high" ? "immediate" : "soon",
      area,
      recommendation: f.recommendedAction,
      rationale: f.description,
    });
  }
  // Weak-element script suggestions.
  for (const el of ["ACCEPTANCE", "CURIOSITY", "EMPATHY"] as PACEElement[]) {
    if (!elementsPresent.has(el)) {
      recommendations.push({ priority: "soon", area: el, recommendation: `Bring in ${el.toLowerCase()} — e.g. "${PACE_SCRIPTS[el].use[0]}"`, rationale: PACE_SCRIPTS[el].note });
    }
  }

  // ── Prompts ──
  const prompts: PACEPracticePrompt[] = [];
  for (const el of ELEMENTS) if (!elementsPresent.has(el)) prompts.push({ element: el, prompt: PACE_PROMPTS[el][0] });
  if (!connectBeforeCorrect) prompts.push({ element: "GENERAL", prompt: PACE_PROMPTS.GENERAL[0] });

  const hasCriticalOrHigh = flags.some((f) => f.severity === "high" || f.severity === "critical");
  const managerReviewRequired = score.overall < 50 || hasCriticalOrHigh || (riskPresent && !escalationEvidenced);

  const strong = elements.filter((e) => e.present).map((e) => e.element.toLowerCase());
  const summary =
    `PACE quality ${score.overall}/100 (${score.band.replace("_", " ")}). ` +
    (strong.length ? `Evidence of ${strong.join(", ")}. ` : "Little PACE evidence yet. ") +
    (flags.length ? `${flags.length} area${flags.length === 1 ? "" : "s"} to strengthen.` : "No concerns flagged.") +
    (riskPresent ? " Risk present — professional judgement required." : "");

  return {
    context: input.context,
    elements,
    flags,
    missing,
    connectBeforeCorrect,
    childVoicePresent,
    exploresNeed,
    score,
    recommendations,
    prompts,
    managerReviewRequired,
    professionalJudgementRequired: riskPresent,
    summary,
    disclaimer: PACE_DISCLAIMER,
  };
}
