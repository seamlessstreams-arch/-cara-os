// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SAFEGUARDING DEPTH INTELLIGENCE ENGINE
// Aggregates body maps, disclosures, escalations, LADO referrals,
// safeguarding supervision, safe-touch protocols, and substance screenings.
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
// Regulatory: CHR 2015 Reg 12 (protection), Reg 13 (safeguarding notifications).
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface BodyMapInput {
  id: string;
  child_id: string;
  date: string;
  areas_documented: number;
  photo_evidence: boolean;
  staff_signed: boolean;
  manager_reviewed: boolean;
  child_explanation_recorded: boolean;
}

export interface DisclosureInput {
  id: string;
  child_id: string;
  date: string;
  response_within_1h: boolean;
  escalated_appropriately: boolean;
  child_informed_of_process: boolean;
  written_up_within_24h: boolean;
  outcome_recorded: boolean;
}

export interface EscalationInput {
  id: string;
  date: string;
  multi_agency_engaged: boolean;
  resolution_date: string;
  outcome_documented: boolean;
  learning_captured: boolean;
}

export interface LADOReferralInput {
  id: string;
  date: string;
  referred_within_1_business_day: boolean;
  outcome_recorded: boolean;
  staff_support_documented: boolean;
  learning_shared: boolean;
  review_date: string;
}

export interface SafeguardingSupervisionInput {
  id: string;
  staff_id: string;
  date: string;
  cases_discussed: number;
  actions_set: number;
  actions_completed: number;
  reflective_practice: boolean;
}

export interface SafeTouchProtocolInput {
  id: string;
  child_id: string;
  consent_obtained: boolean;
  protocol_documented: boolean;
  child_voice_captured: boolean;
  review_date: string;
}

export interface SubstanceScreeningInput {
  id: string;
  date: string;
  child_id: string;
  result: string; // "negative" | "positive" | "inconclusive"
  follow_up_actioned: boolean;
  child_supported: boolean;
}

export interface HomeSafeguardingDepthInput {
  today: string;
  body_maps: BodyMapInput[];
  disclosures: DisclosureInput[];
  escalations: EscalationInput[];
  lado_referrals: LADOReferralInput[];
  safeguarding_supervisions: SafeguardingSupervisionInput[];
  safe_touch_protocols: SafeTouchProtocolInput[];
  substance_screenings: SubstanceScreeningInput[];
  total_children: number;
  total_staff: number;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SafeguardingDepthRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface BodyMapSummary {
  total: number;
  photo_evidence_rate: number;
  manager_reviewed_rate: number;
  child_explanation_rate: number;
}

export interface DisclosureSummary {
  total: number;
  response_within_1h_rate: number;
  escalated_rate: number;
  child_informed_rate: number;
  written_up_within_24h_rate: number;
}

export interface EscalationSummary {
  total: number;
  multi_agency_rate: number;
  resolved_rate: number;
  learning_captured_rate: number;
  avg_resolution_days: number;
}

export interface LADOSummary {
  total: number;
  referred_timely_rate: number;
  outcome_recorded_rate: number;
  learning_shared_rate: number;
  overdue_reviews: number;
}

export interface SupervisionSummary {
  total_sessions: number;
  staff_coverage: number;
  avg_actions_completion_rate: number;
  reflective_practice_rate: number;
}

export interface SafeTouchSummary {
  total: number;
  child_coverage: number;
  consent_rate: number;
  child_voice_rate: number;
  overdue_reviews: number;
}

export interface SubstanceScreeningSummary {
  total_90d: number;
  positive_rate: number;
  follow_up_rate: number;
  child_supported_rate: number;
}

export interface HomeSafeguardingDepthResult {
  safeguarding_depth_rating: SafeguardingDepthRating;
  safeguarding_depth_score: number;
  headline: string;
  body_maps: BodyMapSummary;
  disclosures: DisclosureSummary;
  escalations: EscalationSummary;
  lado: LADOSummary;
  supervision: SupervisionSummary;
  safe_touch: SafeTouchSummary;
  substance_screening: SubstanceScreeningSummary;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// A review is overdue if its date has passed OR if no review date is set at all.
// daysBetween("", today) is NaN and NaN > 0 is false, so a missing review date
// would otherwise silently NOT count as overdue — hiding a LADO referral or
// safe-touch protocol that has no review scheduled (worse than merely overdue).
function reviewOverdue(reviewDate: string, today: string): boolean {
  const n = daysBetween(reviewDate, today);
  return Number.isNaN(n) || n > 0;
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeSafeguardingDepth(
  input: HomeSafeguardingDepthInput,
): HomeSafeguardingDepthResult {
  const {
    today, body_maps, disclosures, escalations, lado_referrals,
    safeguarding_supervisions, safe_touch_protocols, substance_screenings,
    total_children, total_staff,
  } = input;

  // ── Insufficient data guard ──────────────────────────────────────────
  if (
    total_children === 0 &&
    body_maps.length === 0 &&
    disclosures.length === 0 &&
    escalations.length === 0 &&
    lado_referrals.length === 0 &&
    safeguarding_supervisions.length === 0 &&
    safe_touch_protocols.length === 0 &&
    substance_screenings.length === 0
  ) {
    return {
      safeguarding_depth_rating: "insufficient_data",
      safeguarding_depth_score: 0,
      headline: "No safeguarding depth data available for analysis.",
      body_maps: { total: 0, photo_evidence_rate: 0, manager_reviewed_rate: 0, child_explanation_rate: 0 },
      disclosures: { total: 0, response_within_1h_rate: 0, escalated_rate: 0, child_informed_rate: 0, written_up_within_24h_rate: 0 },
      escalations: { total: 0, multi_agency_rate: 0, resolved_rate: 0, learning_captured_rate: 0, avg_resolution_days: 0 },
      lado: { total: 0, referred_timely_rate: 0, outcome_recorded_rate: 0, learning_shared_rate: 0, overdue_reviews: 0 },
      supervision: { total_sessions: 0, staff_coverage: 0, avg_actions_completion_rate: 0, reflective_practice_rate: 0 },
      safe_touch: { total: 0, child_coverage: 0, consent_rate: 0, child_voice_rate: 0, overdue_reviews: 0 },
      substance_screening: { total_90d: 0, positive_rate: 0, follow_up_rate: 0, child_supported_rate: 0 },
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════

  // ── Body Maps ───────────────────────────────────────────────────────
  const bmPhoto = body_maps.filter(b => b.photo_evidence).length;
  const bmPhotoRate = pct(bmPhoto, body_maps.length);
  const bmManagerReviewed = body_maps.filter(b => b.manager_reviewed).length;
  const bmManagerRate = pct(bmManagerReviewed, body_maps.length);
  const bmChildExpl = body_maps.filter(b => b.child_explanation_recorded).length;
  const bmChildRate = pct(bmChildExpl, body_maps.length);

  const body_map_summary: BodyMapSummary = {
    total: body_maps.length,
    photo_evidence_rate: bmPhotoRate,
    manager_reviewed_rate: bmManagerRate,
    child_explanation_rate: bmChildRate,
  };

  // ── Disclosures ─────────────────────────────────────────────────────
  const dResp = disclosures.filter(d => d.response_within_1h).length;
  const dRespRate = pct(dResp, disclosures.length);
  const dEscal = disclosures.filter(d => d.escalated_appropriately).length;
  const dEscalRate = pct(dEscal, disclosures.length);
  const dInformed = disclosures.filter(d => d.child_informed_of_process).length;
  const dInformedRate = pct(dInformed, disclosures.length);
  const dWritten = disclosures.filter(d => d.written_up_within_24h).length;
  const dWrittenRate = pct(dWritten, disclosures.length);

  const disclosure_summary: DisclosureSummary = {
    total: disclosures.length,
    response_within_1h_rate: dRespRate,
    escalated_rate: dEscalRate,
    child_informed_rate: dInformedRate,
    written_up_within_24h_rate: dWrittenRate,
  };

  // ── Escalations ─────────────────────────────────────────────────────
  const eMulti = escalations.filter(e => e.multi_agency_engaged).length;
  const eMultiRate = pct(eMulti, escalations.length);
  const eResolved = escalations.filter(e => e.resolution_date && e.resolution_date.length > 0).length;
  const eResolvedRate = pct(eResolved, escalations.length);
  const eLearning = escalations.filter(e => e.learning_captured).length;
  const eLearningRate = pct(eLearning, escalations.length);
  const resolvedWithDates = escalations.filter(e => e.resolution_date && e.resolution_date.length > 0);
  const avgResDays = resolvedWithDates.length > 0
    ? Math.round((resolvedWithDates.reduce((s, e) => s + Math.max(0, daysBetween(e.date, e.resolution_date)), 0) / resolvedWithDates.length) * 10) / 10
    : 0;

  const escalation_summary: EscalationSummary = {
    total: escalations.length,
    multi_agency_rate: eMultiRate,
    resolved_rate: eResolvedRate,
    learning_captured_rate: eLearningRate,
    avg_resolution_days: avgResDays,
  };

  // ── LADO Referrals ──────────────────────────────────────────────────
  const lTimely = lado_referrals.filter(l => l.referred_within_1_business_day).length;
  const lTimelyRate = pct(lTimely, lado_referrals.length);
  const lOutcome = lado_referrals.filter(l => l.outcome_recorded).length;
  const lOutcomeRate = pct(lOutcome, lado_referrals.length);
  const lLearning = lado_referrals.filter(l => l.learning_shared).length;
  const lLearningRate = pct(lLearning, lado_referrals.length);
  const lOverdue = lado_referrals.filter(l => reviewOverdue(l.review_date, today)).length;

  const lado_summary: LADOSummary = {
    total: lado_referrals.length,
    referred_timely_rate: lTimelyRate,
    outcome_recorded_rate: lOutcomeRate,
    learning_shared_rate: lLearningRate,
    overdue_reviews: lOverdue,
  };

  // ── Safeguarding Supervision ────────────────────────────────────────
  const ssStaffIds = new Set(safeguarding_supervisions.map(s => s.staff_id));
  const ssCoverage = pct(ssStaffIds.size, total_staff);
  const ssActionsComp = safeguarding_supervisions.map(s =>
    s.actions_set > 0 ? pct(s.actions_completed, s.actions_set) : 100,
  );
  const ssAvgActComp = ssActionsComp.length > 0
    ? Math.round(ssActionsComp.reduce((s, v) => s + v, 0) / ssActionsComp.length)
    : 0;
  const ssReflective = safeguarding_supervisions.filter(s => s.reflective_practice).length;
  const ssReflectiveRate = pct(ssReflective, safeguarding_supervisions.length);

  const supervision_summary: SupervisionSummary = {
    total_sessions: safeguarding_supervisions.length,
    staff_coverage: ssCoverage,
    avg_actions_completion_rate: ssAvgActComp,
    reflective_practice_rate: ssReflectiveRate,
  };

  // ── Safe Touch Protocols ────────────────────────────────────────────
  const stChildIds = new Set(safe_touch_protocols.map(p => p.child_id));
  const stCoverage = pct(stChildIds.size, total_children);
  const stConsent = safe_touch_protocols.filter(p => p.consent_obtained).length;
  const stConsentRate = pct(stConsent, safe_touch_protocols.length);
  const stVoice = safe_touch_protocols.filter(p => p.child_voice_captured).length;
  const stVoiceRate = pct(stVoice, safe_touch_protocols.length);
  const stOverdue = safe_touch_protocols.filter(p => reviewOverdue(p.review_date, today)).length;

  const safe_touch_summary: SafeTouchSummary = {
    total: safe_touch_protocols.length,
    child_coverage: stCoverage,
    consent_rate: stConsentRate,
    child_voice_rate: stVoiceRate,
    overdue_reviews: stOverdue,
  };

  // ── Substance Screening (90d window) ────────────────────────────────
  const ss90d = substance_screenings.filter(s => {
    const d = daysBetween(s.date, today);
    return d >= 0 && d <= 90;
  });
  const ssPositive = ss90d.filter(s => s.result === "positive").length;
  const ssPositiveRate = pct(ssPositive, ss90d.length);
  const ssFollowUp = ss90d.filter(s => s.follow_up_actioned).length;
  const ssFollowUpRate = pct(ssFollowUp, ss90d.length);
  const ssSupported = ss90d.filter(s => s.child_supported).length;
  const ssSupportedRate = pct(ssSupported, ss90d.length);

  const substance_summary: SubstanceScreeningSummary = {
    total_90d: ss90d.length,
    positive_rate: ssPositiveRate,
    follow_up_rate: ssFollowUpRate,
    child_supported_rate: ssSupportedRate,
  };

  // ═══════════════════════════════════════════════════════════════════════
  // SCORING — base 52 + 8 modifiers (max +28) -> max 80
  // ═══════════════════════════════════════════════════════════════════════

  let score = 52;

  // ── Mod 1: Body map documentation quality (±5) ─────────────────────
  {
    let m = 0;
    if (body_maps.length > 0) {
      if (bmPhotoRate >= 80) m += 1; else if (bmPhotoRate < 40) m -= 1;
      if (bmManagerRate >= 90) m += 2; else if (bmManagerRate < 50) m -= 2;
      if (bmChildRate >= 80) m += 1; else if (bmChildRate < 40) m -= 1;
      const bmStaffSigned = pct(body_maps.filter(b => b.staff_signed).length, body_maps.length);
      if (bmStaffSigned >= 90) m += 1; else if (bmStaffSigned < 50) m -= 1;
    } else {
      if (total_children >= 2) m -= 2;
    }
    score += Math.max(-5, Math.min(5, m));
  }

  // ── Mod 2: Disclosure handling (±4) ────────────────────────────────
  {
    let m = 0;
    if (disclosures.length > 0) {
      if (dRespRate >= 90) m += 1; else if (dRespRate < 50) m -= 1;
      if (dEscalRate >= 90) m += 1; else if (dEscalRate < 50) m -= 1;
      if (dInformedRate >= 80) m += 1; else if (dInformedRate < 40) m -= 1;
      if (dWrittenRate >= 90) m += 1; else if (dWrittenRate < 50) m -= 1;
    }
    // No disclosures is not necessarily bad — neutral
    score += Math.max(-4, Math.min(4, m));
  }

  // ── Mod 3: Escalation effectiveness (±3) ───────────────────────────
  {
    let m = 0;
    if (escalations.length > 0) {
      if (eMultiRate >= 80) m += 1; else if (eMultiRate < 40) m -= 1;
      if (eResolvedRate >= 80) m += 1; else if (eResolvedRate < 40) m -= 1;
      if (eLearningRate >= 70) m += 1; else if (eLearningRate < 30) m -= 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 4: LADO referral compliance (±4) ───────────────────────────
  {
    let m = 0;
    if (lado_referrals.length > 0) {
      if (lTimelyRate >= 90) m += 1; else if (lTimelyRate < 50) m -= 1;
      if (lOutcomeRate >= 80) m += 1; else if (lOutcomeRate < 40) m -= 1;
      if (lLearningRate >= 70) m += 1; else if (lLearningRate < 30) m -= 1;
      if (lOverdue === 0) m += 1; else if (lOverdue >= 3) m -= 2; else m -= 1;
    }
    score += Math.max(-4, Math.min(4, m));
  }

  // ── Mod 5: Safeguarding supervision quality (±3) ──────────────────
  {
    let m = 0;
    if (safeguarding_supervisions.length > 0) {
      if (ssCoverage >= 80) m += 1; else if (ssCoverage < 40) m -= 1;
      if (ssAvgActComp >= 80) m += 1; else if (ssAvgActComp < 40) m -= 1;
      if (ssReflectiveRate >= 70) m += 1; else if (ssReflectiveRate < 30) m -= 1;
    } else {
      if (total_staff >= 3) m -= 2;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 6: Safe touch protocols (±3) ──────────────────────────────
  {
    let m = 0;
    if (safe_touch_protocols.length > 0) {
      if (stCoverage >= 80) m += 1; else if (stCoverage < 40) m -= 1;
      if (stConsentRate >= 90) m += 1; else if (stConsentRate < 50) m -= 1;
      if (stOverdue === 0) m += 1; else if (stOverdue >= 3) m -= 2; else m -= 1;
    } else {
      if (total_children >= 2) m -= 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 7: Substance screening (±3) ───────────────────────────────
  {
    let m = 0;
    if (ss90d.length > 0) {
      if (ssFollowUpRate >= 90) m += 1; else if (ssFollowUpRate < 50) m -= 1;
      if (ssSupportedRate >= 80) m += 1; else if (ssSupportedRate < 40) m -= 1;
      if (ssPositiveRate <= 10) m += 1; else if (ssPositiveRate > 40) m -= 1;
    }
    // No screenings is neutral — not all homes need them
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 8: Child voice in safeguarding (±3) ───────────────────────
  {
    let m = 0;
    const voiceSources: number[] = [];
    if (body_maps.length > 0) voiceSources.push(bmChildRate);
    if (disclosures.length > 0) voiceSources.push(dInformedRate);
    if (safe_touch_protocols.length > 0) voiceSources.push(stVoiceRate);

    if (voiceSources.length > 0) {
      const avg = Math.round(voiceSources.reduce((s, v) => s + v, 0) / voiceSources.length);
      if (avg >= 90) m += 3;
      else if (avg >= 70) m += 2;
      else if (avg >= 50) m += 1;
      else if (avg < 30) m -= 2;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Clamp ──────────────────────────────────────────────────────────
  score = Math.max(0, Math.min(100, score));

  // ── Rating ─────────────────────────────────────────────────────────
  let safeguarding_depth_rating: SafeguardingDepthRating;
  if (score >= 80) safeguarding_depth_rating = "outstanding";
  else if (score >= 65) safeguarding_depth_rating = "good";
  else if (score >= 45) safeguarding_depth_rating = "adequate";
  else safeguarding_depth_rating = "inadequate";

  // ═══════════════════════════════════════════════════════════════════════
  // NARRATIVE
  // ═══════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: HomeSafeguardingDepthResult["recommendations"] = [];
  const insights: HomeSafeguardingDepthResult["insights"] = [];
  let rank = 0;

  // Body map strengths/concerns
  if (body_maps.length > 0 && bmManagerRate >= 90 && bmPhotoRate >= 80) {
    strengths.push(`Excellent body map documentation — ${bmManagerRate}% manager-reviewed with ${bmPhotoRate}% photographic evidence.`);
  }
  if (body_maps.length > 0 && bmManagerRate < 50) {
    concerns.push(`Low manager review rate for body maps — only ${bmManagerRate}%. All body maps must be reviewed by management.`);
    recommendations.push({ rank: ++rank, recommendation: "Ensure all body maps are reviewed by a manager within 24 hours of completion.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" });
  }

  // Disclosure strengths/concerns
  if (disclosures.length > 0 && dRespRate >= 90 && dEscalRate >= 90) {
    strengths.push(`Strong disclosure handling — ${dRespRate}% responded within 1 hour with ${dEscalRate}% appropriately escalated.`);
  }
  if (disclosures.length > 0 && dRespRate < 50) {
    concerns.push(`Poor disclosure response time — only ${dRespRate}% responded within 1 hour. Immediate response is critical.`);
    recommendations.push({ rank: ++rank, recommendation: "Reinforce disclosure response procedures — all disclosures must be acted on within 1 hour.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" });
  }
  if (disclosures.length > 0 && dEscalRate < 50) {
    concerns.push(`Only ${dEscalRate}% of disclosures appropriately escalated — disclosures indicating harm must be escalated to the DSL/MASH.`);
    recommendations.push({ rank: ++rank, recommendation: "Reinforce escalation thresholds — every disclosure indicating risk must be escalated to the designated safeguarding lead and, where appropriate, MASH/LADO.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" });
  }

  // Escalation strengths/concerns
  if (escalations.length > 0 && eMultiRate >= 80 && eLearningRate >= 70) {
    strengths.push(`Effective escalation practice — ${eMultiRate}% multi-agency engagement with ${eLearningRate}% learning captured.`);
  }
  if (escalations.length > 0 && eResolvedRate < 40) {
    concerns.push(`Low escalation resolution rate — only ${eResolvedRate}%. Escalations are not being resolved effectively.`);
  }

  // LADO strengths/concerns
  if (lado_referrals.length > 0 && lTimelyRate >= 90 && lOverdue === 0) {
    strengths.push(`LADO referrals are timely and well-tracked — ${lTimelyRate}% referred within 1 business day with no overdue reviews.`);
  }
  if (lado_referrals.length > 0 && lTimelyRate < 50) {
    concerns.push(`LADO referrals not timely — only ${lTimelyRate}% referred within 1 business day. This is a serious compliance risk.`);
    recommendations.push({ rank: ++rank, recommendation: "LADO referrals must be made within 1 business day of becoming aware of an allegation.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 13" });
  }

  // Supervision concerns
  if (safeguarding_supervisions.length === 0 && total_staff >= 3) {
    concerns.push("No safeguarding supervision sessions recorded — staff may not be receiving adequate safeguarding support.");
    recommendations.push({ rank: ++rank, recommendation: "Implement regular safeguarding supervision for all care staff.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  }

  // Safe touch concerns
  if (safe_touch_protocols.length === 0 && total_children >= 2) {
    concerns.push("No safe touch protocols in place — physical contact boundaries are not formally documented.");
    recommendations.push({ rank: ++rank, recommendation: "Develop and document safe touch protocols for all children in placement.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  }

  // ── ARIA Insights ──────────────────────────────────────────────────
  if (safeguarding_depth_rating === "outstanding") {
    insights.push({ text: `Safeguarding depth is outstanding (${score}%). Body maps, disclosures, escalations, LADO referrals, and supervision all evidence excellent practice. This would be viewed very favourably at inspection.`, severity: "positive" });
  }
  if (safeguarding_depth_rating === "inadequate") {
    insights.push({ text: `Safeguarding depth is inadequate (${score}%). Significant gaps in safeguarding practice. This is a serious regulatory concern under CHR 2015 Reg 12/13.`, severity: "critical" });
  }
  if (disclosures.length > 0 && dRespRate >= 90 && dWrittenRate >= 90) {
    insights.push({ text: "Disclosure handling demonstrates exemplary practice — rapid response combined with thorough documentation supports child protection outcomes.", severity: "positive" });
  }
  if (lado_referrals.length > 0 && lTimelyRate >= 90 && lLearningRate >= 70) {
    insights.push({ text: "LADO referral practice is strong — timely referrals combined with organisational learning demonstrate a culture of accountability.", severity: "positive" });
  }

  // ── Headline ───────────────────────────────────────────────────────
  let headline: string;
  if (safeguarding_depth_rating === "outstanding") {
    headline = "Safeguarding depth is outstanding — robust body map documentation, disclosure handling, LADO compliance, and supervision across the home.";
  } else if (safeguarding_depth_rating === "good") {
    headline = "Good safeguarding depth with effective practices in place, with some areas for improvement.";
  } else if (safeguarding_depth_rating === "adequate") {
    headline = "Adequate safeguarding depth but gaps in documentation, supervision, or LADO compliance need attention.";
  } else {
    headline = "Significant safeguarding depth gaps — documentation, disclosure handling, and supervision require urgent improvement.";
  }

  return {
    safeguarding_depth_rating,
    safeguarding_depth_score: score,
    headline,
    body_maps: body_map_summary,
    disclosures: disclosure_summary,
    escalations: escalation_summary,
    lado: lado_summary,
    supervision: supervision_summary,
    safe_touch: safe_touch_summary,
    substance_screening: substance_summary,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
