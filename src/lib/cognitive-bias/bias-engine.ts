// ══════════════════════════════════════════════════════════════════════════════
// CARA — COGNITIVE BIAS REFLECTION ENGINE (pure, deterministic)
//
// Maps a record's own facts to reflective bias-checks. Every triggered prompt
// cites the fact that fired it; every prompt is a question to the team, never
// a judgement of a person. Biases are how all human minds work under pressure —
// noticing them is good practice, not failure.
//
// No model calls, no store access, no text-mining of staff writing. Rules fire
// only on explicit structured signals; contexts that always deserve a check
// (hindsight in a serious-incident review) carry standing reflections.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  BiasContext,
  BiasDefinition,
  BiasKey,
  BiasPrompt,
  BiasReflectionResult,
  BiasSignalInput,
  StandingReflection,
} from "./types";
import { BIAS_CONTEXT_LABELS } from "./types";

export const BIAS_ENGINE_VERSION = "1.0.0";

const DISCLAIMER =
  "Reflective checks, not judgements. Biases are how every human mind works under pressure — these prompts exist to support thinking, never to score or profile anyone. It is always acceptable to note a check, consider it, and proceed.";

// ── The sixteen definitions ───────────────────────────────────────────────────
// Prompt language rules (pinned by tests): questions to the team ("we/our"),
// no "you failed/should have", no naming of individuals, no certainty claims.

export const BIAS_DEFINITIONS: Record<BiasKey, BiasDefinition> = {
  confirmation: {
    key: "confirmation",
    label: "Confirmation bias",
    whatItLooksLike: "Evidence that fits the working theory gets noticed; evidence that complicates it slips past.",
    prompt: "Before finalising, have alternative explanations been considered?",
  },
  anchoring: {
    key: "anchoring",
    label: "Anchoring bias",
    whatItLooksLike: "The first assessment quietly becomes the permanent one, even as the picture changes.",
    prompt: "The first assessment has not changed — does today's evidence still support it, or has it become the anchor?",
  },
  availability: {
    key: "availability",
    label: "Availability bias",
    whatItLooksLike: "A memorable case that resembles this one starts doing the reasoning for us.",
    prompt: "A similar case is shaping this judgement — what do THIS child's records show, on their own terms?",
  },
  recency: {
    key: "recency",
    label: "Recency bias",
    whatItLooksLike: "The last few days loom larger than the last few months.",
    prompt: "Recent incidents may be influencing this judgement. Would reviewing the wider chronology help?",
  },
  negativity: {
    key: "negativity",
    label: "Negativity bias",
    whatItLooksLike: "Concerns are recorded in detail; strengths and protective factors thin out.",
    prompt: "The record holds many concerns and few strengths — what is going well for this child that belongs in the picture?",
  },
  halo: {
    key: "halo",
    label: "Halo effect",
    whatItLooksLike: "A positive overall impression of a person or placement softens a specific concern.",
    prompt: "A strong positive reputation is part of this reasoning — would the concern read differently if it arrived without that reputation?",
  },
  authority: {
    key: "authority",
    label: "Authority bias",
    whatItLooksLike: "A senior view settles the question before the evidence does.",
    prompt: "The conclusion follows a senior view — is the evidence recorded alongside it, so the record stands on its own?",
  },
  groupthink: {
    key: "groupthink",
    label: "Groupthink",
    whatItLooksLike: "Everyone agrees, quickly, and no one is recorded asking the awkward question.",
    prompt: "Everyone recorded agrees and no challenge is noted — who could offer the dissenting read, and has anyone asked?",
  },
  outcome: {
    key: "outcome",
    label: "Outcome bias",
    whatItLooksLike: "A decision gets judged by how things turned out, not by what was knowable at the time.",
    prompt: "The outcome is already known — judged only on what was known AT THE TIME, was the decision reasonable?",
  },
  hindsight: {
    key: "hindsight",
    label: "Hindsight bias",
    whatItLooksLike: "After the event, the warning signs look obvious in a way they never were before it.",
    prompt: "Looking back, the signs feel obvious — were they genuinely visible before the event, or only now?",
  },
  fundamental_attribution: {
    key: "fundamental_attribution",
    label: "Fundamental attribution error",
    whatItLooksLike: "Behaviour gets explained by character ('defiant', 'manipulative') rather than circumstances and unmet need.",
    prompt: "Is this behaviour being read as character, or as communication — what circumstances and unmet needs could explain it?",
  },
  optimism: {
    key: "optimism",
    label: "Optimism bias",
    whatItLooksLike: "Risk drifts down because things feel better, without new evidence to carry the change.",
    prompt: "Risk has been lowered — what NEW evidence supports the change, beyond things feeling calmer?",
  },
  escalation_commitment: {
    key: "escalation_commitment",
    label: "Escalation of commitment",
    whatItLooksLike: "The plan continues because so much has been invested in it, not because it is working.",
    prompt: "The recorded outcomes are not improving but the plan is unchanged — what would need to be true to keep it, and is it?",
  },
  defensive_recording: {
    key: "defensive_recording",
    label: "Defensive recording",
    whatItLooksLike: "The record centres justifying adult actions; the child's experience fades from it.",
    prompt: "This record explains the adults' actions carefully — does it hold the child's experience with the same care?",
  },
  professional_drift: {
    key: "professional_drift",
    label: "Professional drift",
    whatItLooksLike: "Small deviations from agreed practice become the new normal without a decision ever being made.",
    prompt: "Practice has drifted from the agreed approach recently — is that a considered adaptation worth recording, or drift worth correcting?",
  },
  compassion_fatigue: {
    key: "compassion_fatigue",
    label: "Compassion fatigue",
    whatItLooksLike: "A team absorbing a lot can find its empathy running on reserve — a wellbeing signal, not a fault.",
    prompt: "This team has absorbed a great deal recently — is there space to check how people are, before the next judgement is asked of them?",
  },
};

// ── Signal-triggered rules ────────────────────────────────────────────────────

interface BiasRule {
  bias: BiasKey;
  check: (s: BiasSignalInput) => boolean;
  because: (s: BiasSignalInput) => string;
}

const RULES: BiasRule[] = [
  {
    bias: "confirmation",
    check: (s) => s.alternativesConsideredCount !== undefined && s.alternativesConsideredCount === 0,
    because: () => "No alternative explanations are recorded yet.",
  },
  {
    bias: "anchoring",
    check: (s) => s.initialAssessmentUnchanged === true,
    because: () => "The first recorded assessment has not been revised.",
  },
  {
    bias: "availability",
    check: (s) => s.comparisonCaseCitedWithoutRecords === true,
    because: () => "A comparison case is cited without this child's records alongside it.",
  },
  {
    bias: "recency",
    check: (s) => (s.recentIncidentCount7d ?? 0) >= 2 || (s.decisionWithinDaysOfIncident !== undefined && s.decisionWithinDaysOfIncident <= 2),
    because: (s) =>
      (s.recentIncidentCount7d ?? 0) >= 2
        ? `${s.recentIncidentCount7d} incidents in the last 7 days sit close to this judgement.`
        : "This judgement is being made within days of the incident.",
  },
  {
    bias: "negativity",
    check: (s) => (s.concernsRecordedCount ?? 0) >= 3 && (s.strengthsRecordedCount ?? 0) === 0,
    because: (s) => `${s.concernsRecordedCount} concerns are recorded with no strengths alongside them.`,
  },
  {
    bias: "halo",
    check: (s) => s.reputationCitedAgainstConcern === true,
    because: () => "A positive reputation is cited against the concern.",
  },
  {
    bias: "authority",
    check: (s) => s.seniorViewAdoptedWithoutEvidence === true,
    because: () => "The conclusion adopts a senior view without evidence recorded alongside it.",
  },
  {
    bias: "groupthink",
    check: (s) => (s.contributorsAgreeing ?? 0) >= 3 && s.dissentRecorded === false,
    because: (s) => `${s.contributorsAgreeing} contributors agree with no challenge recorded.`,
  },
  {
    bias: "outcome",
    check: (s) => s.outcomeKnownAtReview === true && (s.context === "incident_review" || s.context === "serious_incident_review" || s.context === "complaint"),
    because: () => "The outcome is already known while the decision is being judged.",
  },
  {
    bias: "optimism",
    check: (s) => s.riskDowngradedWithoutNewEvidence === true,
    because: () => "Risk was lowered without new evidence recorded.",
  },
  {
    bias: "escalation_commitment",
    check: (s) => s.planUnchangedDespiteNoImprovement === true,
    because: () => "Recorded outcomes are not improving and the plan is unchanged.",
  },
  {
    bias: "defensive_recording",
    check: (s) => s.justificationFocusedRecording === true,
    because: () => "The record centres justification of adult actions.",
  },
  {
    bias: "professional_drift",
    check: (s) => (s.policyDeviationsRecent ?? 0) >= 2,
    because: (s) => `${s.policyDeviationsRecent} recent deviations from agreed practice are recorded.`,
  },
  {
    bias: "compassion_fatigue",
    check: (s) => (s.staffIncidentExposure30d ?? 0) >= 5,
    because: (s) => `The team has absorbed ${s.staffIncidentExposure30d} incidents in the last 30 days.`,
  },
];

// ── Standing reflections (context-appropriate, always offered) ────────────────

const EVIDENCE_OR_INTERPRETATION: StandingReflection = {
  prompt: "Is this decision based on evidence, interpretation, or both?",
  because: "A decision point in this workflow — the record should show which is which.",
};

const CHILD_VOICE_DIRECT: StandingReflection = {
  prompt: "Has the child's voice been considered directly, or are we relying mainly on adult interpretation?",
  because: "Major decisions must hold the child's own words, not only our reading of them.",
};

const ANTI_OPPRESSIVE_LENS: StandingReflection = {
  prompt: "Have cultural, disability, trauma, neurodiversity or communication needs been considered?",
  because: "These shape how behaviour presents and how it gets read — the check belongs in every serious judgement.",
};

const HINDSIGHT_STANDING: StandingReflection = {
  prompt: BIAS_DEFINITIONS.hindsight.prompt,
  because: "Every retrospective review deserves this check — after the event, signs always look clearer than they were.",
};

const STANDING_BY_CONTEXT: Record<BiasContext, StandingReflection[]> = {
  safeguarding_concern: [EVIDENCE_OR_INTERPRETATION, CHILD_VOICE_DIRECT, ANTI_OPPRESSIVE_LENS],
  risk_escalation: [EVIDENCE_OR_INTERPRETATION, CHILD_VOICE_DIRECT, ANTI_OPPRESSIVE_LENS],
  management_oversight: [EVIDENCE_OR_INTERPRETATION, CHILD_VOICE_DIRECT],
  strategy_discussion: [EVIDENCE_OR_INTERPRETATION, CHILD_VOICE_DIRECT, ANTI_OPPRESSIVE_LENS],
  incident_review: [CHILD_VOICE_DIRECT, HINDSIGHT_STANDING],
  complaint: [EVIDENCE_OR_INTERPRETATION, CHILD_VOICE_DIRECT],
  placement_stability_review: [EVIDENCE_OR_INTERPRETATION, CHILD_VOICE_DIRECT, ANTI_OPPRESSIVE_LENS],
  child_protection: [EVIDENCE_OR_INTERPRETATION, CHILD_VOICE_DIRECT, ANTI_OPPRESSIVE_LENS],
  serious_incident_review: [CHILD_VOICE_DIRECT, HINDSIGHT_STANDING, ANTI_OPPRESSIVE_LENS],
};

// ── The engine ────────────────────────────────────────────────────────────────

export function computeBiasReflections(signal: BiasSignalInput): BiasReflectionResult {
  const prompts: BiasPrompt[] = [];
  for (const rule of RULES) {
    if (rule.check(signal)) {
      const def = BIAS_DEFINITIONS[rule.bias];
      prompts.push({ bias: def.key, label: def.label, prompt: def.prompt, because: rule.because(signal) });
    }
  }

  // The child-voice standing reflection sharpens into a triggered prompt when
  // the record explicitly lacks the child's own words.
  if (signal.childVoiceQuoted === false) {
    const def = BIAS_DEFINITIONS.fundamental_attribution;
    prompts.push({
      bias: def.key,
      label: def.label,
      prompt: def.prompt,
      because: "The child's own words are not quoted in this record.",
    });
  }

  return {
    context: signal.context,
    contextLabel: BIAS_CONTEXT_LABELS[signal.context],
    prompts,
    standing: STANDING_BY_CONTEXT[signal.context] ?? [],
    disclaimer: DISCLAIMER,
    engineVersion: BIAS_ENGINE_VERSION,
  };
}
