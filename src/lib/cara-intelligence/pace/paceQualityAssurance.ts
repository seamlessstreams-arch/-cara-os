// ══════════════════════════════════════════════════════════════════════════════
// CARA INTELLIGENCE — PACE practice engine · QUALITY ASSURANCE (scoring)
//
// Turns the analyzer's deterministic signals into a 0–100 PACE quality score
// across eight dimensions, a band, and banner-level triggers. Low scores route
// to manager review and reflective supervision. Pure — no clock, no I/O.
// ══════════════════════════════════════════════════════════════════════════════

import type { PACEBand, PACEElement, PACEQualityScore, PACEScoreDimension } from "./pace.types";

/** The deterministic signals the scorer needs (produced by the analyzer). */
export interface PACEScoreSignals {
  elementsPresent: Set<PACEElement>;
  connectBeforeCorrect: boolean;
  exploresNeed: boolean;
  childVoicePresent: boolean;
  hasRepair: boolean;
  hasDeescalation: boolean;
  hasRegulation: boolean;
  hasBoundary: boolean;
  blameBased: boolean;
  shaming: boolean;
  antiCuriosity: boolean;
  /** Record describes risk / unsafe behaviour. */
  riskPresent: boolean;
  /** Record evidences escalation / manager / safeguarding awareness. */
  escalationEvidenced: boolean;
  /** Is this a context where boundaries/safety must be evidenced (incident etc.)? */
  riskyContext: boolean;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function bandFor(overall: number): PACEBand {
  if (overall >= 80) return "strong";
  if (overall >= 60) return "developing";
  if (overall >= 40) return "emerging";
  return "needs_attention";
}

export function scorePACE(s: PACEScoreSignals): PACEQualityScore {
  const has = (e: PACEElement) => s.elementsPresent.has(e);

  // 1. Connection — playfulness/acceptance/empathy + connect-before-correct.
  let connection = 0;
  if (has("ACCEPTANCE")) connection += 30;
  if (has("EMPATHY")) connection += 30;
  if (has("PLAYFULNESS")) connection += 15;
  if (s.connectBeforeCorrect) connection += 25;

  // 2. Emotional attunement — acceptance + empathy.
  let attunement = 20;
  if (has("ACCEPTANCE")) attunement += 40;
  if (has("EMPATHY")) attunement += 40;

  // 3. Curiosity / meaning-making — curiosity + exploring the need; anti-curiosity hurts.
  let curiosity = 10;
  if (has("CURIOSITY")) curiosity += 45;
  if (s.exploresNeed) curiosity += 45;
  if (s.antiCuriosity) curiosity -= 50;

  // 4. Boundaries & safety — must be evidenced especially in risky contexts.
  let boundaries: number;
  if (s.hasBoundary) boundaries = 100;
  else if (s.riskyContext || s.riskPresent) boundaries = 25; // risk but no boundary recorded
  else boundaries = 70; // non-risk context, boundary not central

  // 5. Child voice.
  const childVoice = s.childVoicePresent ? 100 : 25;

  // 6. Repair & follow-up.
  const repair = s.hasRepair ? 100 : 35;

  // 7. Recording objectivity — blame/shaming language drags this down.
  let objectivity = 100;
  if (s.blameBased) objectivity -= 40;
  if (s.shaming) objectivity -= 45;

  // 8. Safeguarding escalation — when risk present, escalation must be evidenced.
  let safeguarding: number;
  if (!s.riskPresent) safeguarding = 100;
  else safeguarding = s.escalationEvidenced ? 100 : 30;

  const dims: PACEScoreDimension[] = [
    { key: "connection", label: "Connection", score: clamp(connection), weight: 0.18 },
    { key: "emotional_attunement", label: "Emotional attunement", score: clamp(attunement), weight: 0.15 },
    { key: "curiosity_meaning", label: "Curiosity & meaning-making", score: clamp(curiosity), weight: 0.15 },
    { key: "boundaries_safety", label: "Boundaries & safety", score: clamp(boundaries), weight: 0.15 },
    { key: "child_voice", label: "Child voice", score: clamp(childVoice), weight: 0.12 },
    { key: "repair_followup", label: "Repair & follow-up", score: clamp(repair), weight: 0.1 },
    { key: "recording_objectivity", label: "Recording objectivity", score: clamp(objectivity), weight: 0.1 },
    { key: "safeguarding_escalation", label: "Safeguarding escalation", score: clamp(safeguarding), weight: 0.05 },
  ];

  const overall = clamp(dims.reduce((sum, d) => sum + d.score * d.weight, 0));

  const triggers: string[] = [];
  if (overall < 50) {
    triggers.push("Needs manager review");
    triggers.push("Needs reflective supervision");
    triggers.push("Recording does not yet evidence trauma-informed practice");
  } else if (overall < 65) {
    triggers.push("Consider reflective supervision");
  }
  if (s.shaming || s.blameBased) triggers.push("Recording language needs revising before sign-off");
  if (s.riskPresent && !s.escalationEvidenced) triggers.push("Confirm safeguarding/manager escalation");

  return { overall, band: bandFor(overall), dimensions: dims, triggers: [...new Set(triggers)] };
}
