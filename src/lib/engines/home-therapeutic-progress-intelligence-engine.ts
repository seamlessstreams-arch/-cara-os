// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME THERAPEUTIC PROGRESS INTELLIGENCE ENGINE
// Home-level: aggregates behaviour mapping, sensory profiles, sleep
// assessments, emotional vocabulary, bereavement support, attachment
// profiles, and self-soothing toolkits.
// CHR 2015 Reg 6: "The quality and purpose of care standard."
// Therapeutically informed residential care model.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export interface BehaviourMapInput {
  id: string;
  child_id: string;
  date: string;
  behaviour_type: string;        // aggression | self_harm | absconding | property_damage | verbal_aggression | withdrawal | refusal | dysregulation
  intensity: string;             // low | moderate | high | crisis
  de_escalation_used_count: number;
  trigger_pattern_present: boolean;
}

export interface SensoryProfileInput {
  id: string;
  child_id: string;
  assessment_date: string;
  review_date: string;
  entries_count: number;
  strategies_count: number;
  environmental_adaptations_count: number;
  child_views_provided: boolean;
}

export interface SleepAssessmentInput {
  id: string;
  child_id: string;
  assessment_date: string;
  review_date: string;
  average_hours: number;
  sleep_quality: string;         // poor | fair | moderate | good | excellent
  night_wakings: number;
  strategies_count: number;
  trend: string;                 // improving | stable | declining | fluctuating
}

export interface EmotionalVocabInput {
  id: string;
  child_id: string;
  recorded_date: string;
  review_date: string;
  feelings_recognised_count: number;
  tools_in_use_count: number;
  breakthroughs_count: number;
  child_voice_provided: boolean;
}

export interface BereavementInput {
  id: string;
  child_id: string;
  record_date: string;
  review_date: string;
  grief_stage: string;           // acute | adjusting | integrated | complicated
  support_provided_count: number;
  memory_work_count: number;
  child_voice_provided: boolean;
  external_support_present: boolean;
}

export interface AttachmentProfileInput {
  id: string;
  child_id: string;
  assessment_date: string;
  review_date: string;
  primary_style: string;         // secure | anxious_ambivalent | anxious_avoidant | disorganised
  therapeutic_approach_count: number;
  staff_guidance_count: number;
  protective_factors_count: number;
  child_views_provided: boolean;
}

export interface SelfSoothingToolkitInput {
  id: string;
  child_id: string;
  last_updated: string;
  review_date: string;
  total_strategies_count: number;
  child_chose_all: boolean;
  effectiveness_rating: string;  // highly_effective | effective | partially_effective | not_effective | not_yet_assessed
  child_voice_provided: boolean;
}

export interface HomeTherapeuticProgressInput {
  today: string;
  behaviour_map_entries: BehaviourMapInput[];
  sensory_profiles: SensoryProfileInput[];
  sleep_assessments: SleepAssessmentInput[];
  emotional_vocab_records: EmotionalVocabInput[];
  bereavement_records: BereavementInput[];
  attachment_profiles: AttachmentProfileInput[];
  self_soothing_toolkits: SelfSoothingToolkitInput[];
  total_children: number;
}

// ── Output types ────────────────────────────────────────────────────────────

export type TherapeuticRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface BehaviourMapProfile {
  total_entries_90d: number;
  crisis_count: number;
  high_count: number;
  de_escalation_rate: number;
  trigger_identification_rate: number;
  children_mapped: number;
}

export interface SensoryProfileSummary {
  total_profiles: number;
  child_coverage: number;
  overdue_reviews: number;
  // fab-0: null when no sensory profiles.
  avg_strategies: number | null;
  child_views_rate: number;
}

export interface SleepAssessmentSummary {
  total_assessments: number;
  child_coverage: number;
  // fab-0: null when no sleep assessments.
  avg_hours: number | null;
  good_quality_rate: number;
  improving_trend_rate: number;
  overdue_reviews: number;
}

export interface EmotionalVocabSummary {
  total_records: number;
  child_coverage: number;
  // fab-0: null when no emotional vocab records.
  avg_feelings_recognised: number | null;
  breakthrough_count: number;
  child_voice_rate: number;
}

export interface BereavementSummary {
  total_records: number;
  children_supported: number;
  external_support_rate: number;
  memory_work_rate: number;
  child_voice_rate: number;
}

export interface AttachmentSummary {
  total_profiles: number;
  child_coverage: number;
  overdue_reviews: number;
  // fab-0: null when no attachment profiles.
  avg_therapeutic_approaches: number | null;
  child_views_rate: number;
}

export interface SelfSoothingSummary {
  total_toolkits: number;
  child_coverage: number;
  child_led_rate: number;
  effectiveness_rate: number;
  child_voice_rate: number;
}

export interface HomeTherapeuticProgressResult {
  therapeutic_rating: TherapeuticRating;
  therapeutic_score: number;
  headline: string;
  behaviour_map: BehaviourMapProfile;
  sensory: SensoryProfileSummary;
  sleep: SleepAssessmentSummary;
  emotional_vocab: EmotionalVocabSummary;
  bereavement: BereavementSummary;
  attachment: AttachmentSummary;
  self_soothing: SelfSoothingSummary;
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

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeTherapeuticProgress(
  input: HomeTherapeuticProgressInput,
): HomeTherapeuticProgressResult {
  const {
    today, behaviour_map_entries, sensory_profiles, sleep_assessments,
    emotional_vocab_records, bereavement_records, attachment_profiles,
    self_soothing_toolkits, total_children,
  } = input;

  // ── Insufficient data guard ──────────────────────────────────────────
  if (
    total_children === 0 &&
    behaviour_map_entries.length === 0 &&
    sensory_profiles.length === 0 &&
    sleep_assessments.length === 0 &&
    emotional_vocab_records.length === 0 &&
    bereavement_records.length === 0 &&
    attachment_profiles.length === 0 &&
    self_soothing_toolkits.length === 0
  ) {
    return {
      therapeutic_rating: "insufficient_data",
      therapeutic_score: 0,
      headline: "No therapeutic data available for analysis.",
      behaviour_map: { total_entries_90d: 0, crisis_count: 0, high_count: 0, de_escalation_rate: 0, trigger_identification_rate: 0, children_mapped: 0 },
      sensory: { total_profiles: 0, child_coverage: 0, overdue_reviews: 0, avg_strategies: null, child_views_rate: 0 },
      sleep: { total_assessments: 0, child_coverage: 0, avg_hours: null, good_quality_rate: 0, improving_trend_rate: 0, overdue_reviews: 0 },
      emotional_vocab: { total_records: 0, child_coverage: 0, avg_feelings_recognised: null, breakthrough_count: 0, child_voice_rate: 0 },
      bereavement: { total_records: 0, children_supported: 0, external_support_rate: 0, memory_work_rate: 0, child_voice_rate: 0 },
      attachment: { total_profiles: 0, child_coverage: 0, overdue_reviews: 0, avg_therapeutic_approaches: null, child_views_rate: 0 },
      self_soothing: { total_toolkits: 0, child_coverage: 0, child_led_rate: 0, effectiveness_rate: 0, child_voice_rate: 0 },
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Behaviour mapping analysis (last 90 days) ────────────────────────
  const bm90 = behaviour_map_entries.filter(e => daysBetween(e.date, today) >= 0 && daysBetween(e.date, today) <= 90);
  const bmCrisis = bm90.filter(e => e.intensity === "crisis").length;
  const bmHigh = bm90.filter(e => e.intensity === "high").length;
  const bmDeEscUsed = bm90.filter(e => e.de_escalation_used_count > 0).length;
  const bmDeEscRate = pct(bmDeEscUsed, bm90.length);
  const bmTriggerFound = bm90.filter(e => e.trigger_pattern_present).length;
  const bmTriggerRate = pct(bmTriggerFound, bm90.length);
  const bmChildIds = new Set(bm90.map(e => e.child_id));

  const behaviour_map: BehaviourMapProfile = {
    total_entries_90d: bm90.length,
    crisis_count: bmCrisis,
    high_count: bmHigh,
    de_escalation_rate: bmDeEscRate,
    trigger_identification_rate: bmTriggerRate,
    children_mapped: bmChildIds.size,
  };

  // ── Sensory profile analysis ─────────────────────────────────────────
  const spChildIds = new Set(sensory_profiles.map(p => p.child_id));
  const spCoverage = pct(spChildIds.size, total_children);
  const spOverdue = sensory_profiles.filter(p => daysBetween(p.review_date, today) > 0).length;
  // fab-0: null when no sensory profiles.
  const spAvgStrat: number | null = sensory_profiles.length > 0
    ? Math.round(sensory_profiles.reduce((s, p) => s + p.strategies_count, 0) / sensory_profiles.length)
    : null;
  const spViewsRate = pct(
    sensory_profiles.filter(p => p.child_views_provided).length,
    sensory_profiles.length,
  );

  const sensory: SensoryProfileSummary = {
    total_profiles: sensory_profiles.length,
    child_coverage: spCoverage,
    overdue_reviews: spOverdue,
    avg_strategies: spAvgStrat,
    child_views_rate: spViewsRate,
  };

  // ── Sleep assessment analysis ────────────────────────────────────────
  const slChildIds = new Set(sleep_assessments.map(a => a.child_id));
  const slCoverage = pct(slChildIds.size, total_children);
  // fab-0: null when no sleep assessments.
  const slAvgHours: number | null = sleep_assessments.length > 0
    ? Math.round((sleep_assessments.reduce((s, a) => s + a.average_hours, 0) / sleep_assessments.length) * 10) / 10
    : null;
  const slGoodQuality = sleep_assessments.filter(a => a.sleep_quality === "good" || a.sleep_quality === "excellent").length;
  const slGoodRate = pct(slGoodQuality, sleep_assessments.length);
  const slImproving = sleep_assessments.filter(a => a.trend === "improving").length;
  const slImprovingRate = pct(slImproving, sleep_assessments.length);
  const slOverdue = sleep_assessments.filter(a => daysBetween(a.review_date, today) > 0).length;

  const sleep: SleepAssessmentSummary = {
    total_assessments: sleep_assessments.length,
    child_coverage: slCoverage,
    avg_hours: slAvgHours,
    good_quality_rate: slGoodRate,
    improving_trend_rate: slImprovingRate,
    overdue_reviews: slOverdue,
  };

  // ── Emotional vocabulary analysis ────────────────────────────────────
  const evChildIds = new Set(emotional_vocab_records.map(r => r.child_id));
  const evCoverage = pct(evChildIds.size, total_children);
  // fab-0: null when no emotional vocab records.
  const evAvgFeelings: number | null = emotional_vocab_records.length > 0
    ? Math.round(emotional_vocab_records.reduce((s, r) => s + r.feelings_recognised_count, 0) / emotional_vocab_records.length)
    : null;
  const evBreakthroughs = emotional_vocab_records.reduce((s, r) => s + r.breakthroughs_count, 0);
  const evVoiceRate = pct(
    emotional_vocab_records.filter(r => r.child_voice_provided).length,
    emotional_vocab_records.length,
  );

  const emotional_vocab: EmotionalVocabSummary = {
    total_records: emotional_vocab_records.length,
    child_coverage: evCoverage,
    avg_feelings_recognised: evAvgFeelings,
    breakthrough_count: evBreakthroughs,
    child_voice_rate: evVoiceRate,
  };

  // ── Bereavement & loss analysis ──────────────────────────────────────
  const brChildIds = new Set(bereavement_records.map(r => r.child_id));
  const brExtSupport = bereavement_records.filter(r => r.external_support_present).length;
  const brExtRate = pct(brExtSupport, bereavement_records.length);
  const brMemWork = bereavement_records.filter(r => r.memory_work_count > 0).length;
  const brMemRate = pct(brMemWork, bereavement_records.length);
  const brVoiceRate = pct(
    bereavement_records.filter(r => r.child_voice_provided).length,
    bereavement_records.length,
  );

  const bereavement: BereavementSummary = {
    total_records: bereavement_records.length,
    children_supported: brChildIds.size,
    external_support_rate: brExtRate,
    memory_work_rate: brMemRate,
    child_voice_rate: brVoiceRate,
  };

  // ── Attachment profile analysis ──────────────────────────────────────
  const atChildIds = new Set(attachment_profiles.map(p => p.child_id));
  const atCoverage = pct(atChildIds.size, total_children);
  const atOverdue = attachment_profiles.filter(p => daysBetween(p.review_date, today) > 0).length;
  // fab-0: null when no attachment profiles.
  const atAvgApproaches: number | null = attachment_profiles.length > 0
    ? Math.round(attachment_profiles.reduce((s, p) => s + p.therapeutic_approach_count, 0) / attachment_profiles.length)
    : null;
  const atViewsRate = pct(
    attachment_profiles.filter(p => p.child_views_provided).length,
    attachment_profiles.length,
  );

  const attachment: AttachmentSummary = {
    total_profiles: attachment_profiles.length,
    child_coverage: atCoverage,
    overdue_reviews: atOverdue,
    avg_therapeutic_approaches: atAvgApproaches,
    child_views_rate: atViewsRate,
  };

  // ── Self-soothing toolkit analysis ───────────────────────────────────
  const ssChildIds = new Set(self_soothing_toolkits.map(t => t.child_id));
  const ssCoverage = pct(ssChildIds.size, total_children);
  const ssChildLed = self_soothing_toolkits.filter(t => t.child_chose_all).length;
  const ssChildLedRate = pct(ssChildLed, self_soothing_toolkits.length);
  const ssEffective = self_soothing_toolkits.filter(t =>
    t.effectiveness_rating === "highly_effective" || t.effectiveness_rating === "effective",
  ).length;
  const ssEffRate = pct(ssEffective, self_soothing_toolkits.length);
  const ssVoiceRate = pct(
    self_soothing_toolkits.filter(t => t.child_voice_provided).length,
    self_soothing_toolkits.length,
  );

  const self_soothing: SelfSoothingSummary = {
    total_toolkits: self_soothing_toolkits.length,
    child_coverage: ssCoverage,
    child_led_rate: ssChildLedRate,
    effectiveness_rate: ssEffRate,
    child_voice_rate: ssVoiceRate,
  };

  // ══════════════════════════════════════════════════════════════════════
  // SCORING — base 52 + 8 modifiers (max ±28) → max 80
  // ══════════════════════════════════════════════════════════════════════

  let score = 52;

  // ── Mod 1: Behaviour mapping & de-escalation (±5) ────────────────────
  {
    let m = 0;
    if (bm90.length > 0) {
      if (bmDeEscRate >= 90) m += 3;
      else if (bmDeEscRate >= 70) m += 1;
      else m -= 2;

      if (bmTriggerRate >= 80) m += 2;
      else if (bmTriggerRate >= 60) m += 1;
      else if (bmTriggerRate < 30) m -= 2;

      const crisisRatio = pct(bmCrisis, bm90.length);
      if (crisisRatio > 30) m -= 1;
    } else {
      // No behaviour mapping at all — neutral if few children, concern otherwise
      if (total_children >= 3) m -= 2;
    }
    score += Math.max(-5, Math.min(5, m));
  }

  // ── Mod 2: Sensory profile completeness (±4) ────────────────────────
  {
    let m = 0;
    if (sensory_profiles.length > 0) {
      if (spCoverage >= 80) m += 2;
      else if (spCoverage >= 50) m += 1;
      else m -= 1;

      if (spOverdue === 0) m += 1;
      else if (spOverdue >= 3) m -= 2;

      if (spAvgStrat! >= 4) m += 1;
      else if (spAvgStrat! < 2) m -= 1;
    } else {
      if (total_children >= 2) m -= 2;
    }
    score += Math.max(-4, Math.min(4, m));
  }

  // ── Mod 3: Sleep assessment & quality (±4) ───────────────────────────
  {
    let m = 0;
    if (sleep_assessments.length > 0) {
      if (slCoverage >= 80) m += 2;
      else if (slCoverage >= 50) m += 1;
      else m -= 1;

      if (slGoodRate >= 70) m += 1;
      else if (slGoodRate < 30) m -= 1;

      if (slOverdue === 0) m += 1;
      else if (slOverdue >= 3) m -= 2;
    } else {
      if (total_children >= 2) m -= 2;
    }
    score += Math.max(-4, Math.min(4, m));
  }

  // ── Mod 4: Emotional vocabulary development (±3) ─────────────────────
  {
    let m = 0;
    if (emotional_vocab_records.length > 0) {
      if (evCoverage >= 80) m += 1;
      else if (evCoverage < 40) m -= 1;

      if (evAvgFeelings! >= 8) m += 1;
      else if (evAvgFeelings! < 3) m -= 1;

      if (evBreakthroughs >= 3) m += 1;
    } else {
      if (total_children >= 2) m -= 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 5: Bereavement & loss support (±3) ──────────────────────────
  {
    let m = 0;
    if (bereavement_records.length > 0) {
      if (brExtRate >= 80) m += 1;
      else if (brExtRate < 30) m -= 1;

      if (brMemRate >= 80) m += 1;
      else if (brMemRate < 30) m -= 1;

      const complicated = bereavement_records.filter(r => r.grief_stage === "complicated").length;
      if (complicated > 0 && brExtRate < 50) m -= 1;
      else if (complicated === 0) m += 1;
    }
    // No bereavement records is neutral — not all homes have children experiencing bereavement
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 6: Attachment-informed practice (±3) ─────────────────────────
  {
    let m = 0;
    if (attachment_profiles.length > 0) {
      if (atCoverage >= 80) m += 1;
      else if (atCoverage < 40) m -= 1;

      if (atOverdue === 0) m += 1;
      else if (atOverdue >= 3) m -= 1;

      if (atAvgApproaches! >= 3) m += 1;
      else if (atAvgApproaches! < 1) m -= 1;
    } else {
      if (total_children >= 2) m -= 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 7: Self-soothing toolkit quality (±3) ───────────────────────
  {
    let m = 0;
    if (self_soothing_toolkits.length > 0) {
      if (ssCoverage >= 80) m += 1;
      else if (ssCoverage < 40) m -= 1;

      if (ssChildLedRate >= 80) m += 1;
      else if (ssChildLedRate < 30) m -= 1;

      if (ssEffRate >= 80) m += 1;
      else if (ssEffRate < 30) m -= 1;
    } else {
      if (total_children >= 2) m -= 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 8: Child voice across therapeutic work (±3) ──────────────────
  {
    let m = 0;
    const voiceSources: number[] = [];
    if (sensory_profiles.length > 0) voiceSources.push(spViewsRate);
    if (emotional_vocab_records.length > 0) voiceSources.push(evVoiceRate);
    if (bereavement_records.length > 0) voiceSources.push(brVoiceRate);
    if (attachment_profiles.length > 0) voiceSources.push(atViewsRate);
    if (self_soothing_toolkits.length > 0) voiceSources.push(ssVoiceRate);

    if (voiceSources.length > 0) {
      const avgVoice = Math.round(voiceSources.reduce((s, v) => s + v, 0) / voiceSources.length);
      if (avgVoice >= 90) m += 3;
      else if (avgVoice >= 70) m += 2;
      else if (avgVoice >= 50) m += 1;
      else if (avgVoice < 30) m -= 2;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Clamp ────────────────────────────────────────────────────────────
  score = Math.max(0, Math.min(100, score));

  // ── Rating ───────────────────────────────────────────────────────────
  let therapeutic_rating: TherapeuticRating;
  if (score >= 80) therapeutic_rating = "outstanding";
  else if (score >= 65) therapeutic_rating = "good";
  else if (score >= 45) therapeutic_rating = "adequate";
  else therapeutic_rating = "inadequate";

  // ══════════════════════════════════════════════════════════════════════
  // NARRATIVE
  // ══════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: HomeTherapeuticProgressResult["recommendations"] = [];
  const insights: HomeTherapeuticProgressResult["insights"] = [];
  let rank = 0;

  // Behaviour mapping
  if (bm90.length > 0 && bmDeEscRate >= 90) {
    strengths.push(`Excellent de-escalation practice — ${bmDeEscRate}% of behaviour entries show de-escalation techniques used.`);
  }
  if (bm90.length > 0 && bmTriggerRate >= 80) {
    strengths.push(`Strong trigger identification — ${bmTriggerRate}% of behaviour entries have trigger patterns documented.`);
  }
  if (bm90.length > 0 && bmDeEscRate < 50) {
    concerns.push(`Low de-escalation usage — only ${bmDeEscRate}% of behaviour entries record de-escalation techniques.`);
    recommendations.push({ rank: ++rank, recommendation: "Review de-escalation training and ensure all staff are documenting techniques used during incidents.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 6" });
  }
  if (bmCrisis >= 5) {
    concerns.push(`${bmCrisis} crisis-level behaviour entries in the last 90 days — requires clinical review.`);
    recommendations.push({ rank: ++rank, recommendation: "Convene multi-disciplinary review of crisis-level behaviours and update behaviour support plans.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 6" });
  }

  // Sensory profiles
  if (sensory_profiles.length > 0 && spCoverage >= 80 && spOverdue === 0) {
    strengths.push(`Comprehensive sensory profiling — ${spCoverage}% coverage with all reviews up to date.`);
  }
  if (spOverdue >= 3) {
    concerns.push(`${spOverdue} sensory profiles are overdue for review.`);
    recommendations.push({ rank: ++rank, recommendation: "Schedule overdue sensory profile reviews to maintain therapeutic accuracy.", urgency: "soon", regulatory_ref: null });
  }

  // Sleep
  if (sleep_assessments.length > 0 && slGoodRate >= 70) {
    strengths.push(`Good sleep quality across the home — ${slGoodRate}% of children assessed as good or excellent.`);
  }
  if (sleep_assessments.length > 0 && slGoodRate < 30) {
    concerns.push(`Poor sleep quality — only ${slGoodRate}% of sleep assessments rated good or excellent.`);
    recommendations.push({ rank: ++rank, recommendation: "Review bedtime routines and environmental factors affecting sleep quality.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 6" });
  }
  if (slOverdue >= 3) {
    concerns.push(`${slOverdue} sleep assessments are overdue for review.`);
  }

  // Emotional vocabulary
  if (emotional_vocab_records.length > 0 && evAvgFeelings! >= 8) {
    strengths.push(`Strong emotional literacy development — children recognise an average of ${evAvgFeelings} feelings.`);
  }
  if (evBreakthroughs >= 3) {
    strengths.push(`${evBreakthroughs} emotional breakthroughs recorded — evidence of therapeutic progress.`);
  }
  if (emotional_vocab_records.length === 0 && total_children >= 3) {
    concerns.push("No emotional vocabulary records — emotional literacy development is not being tracked.");
    recommendations.push({ rank: ++rank, recommendation: "Implement emotional vocabulary tracking for all children to evidence therapeutic progress.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 6" });
  }

  // Bereavement
  if (bereavement_records.length > 0 && brExtRate >= 80 && brMemRate >= 80) {
    strengths.push("Excellent bereavement support — high rates of external support engagement and memory work.");
  }
  if (bereavement_records.length > 0) {
    const complicated = bereavement_records.filter(r => r.grief_stage === "complicated").length;
    if (complicated > 0 && brExtRate < 50) {
      concerns.push(`${complicated} child(ren) in complicated grief with insufficient external support.`);
      recommendations.push({ rank: ++rank, recommendation: "Urgently refer children experiencing complicated grief for specialist bereavement counselling.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 6" });
    }
  }

  // Attachment
  if (attachment_profiles.length > 0 && atCoverage >= 80 && atOverdue === 0) {
    strengths.push(`Attachment-informed practice embedded — ${atCoverage}% coverage with current reviews.`);
  }
  if (attachment_profiles.length === 0 && total_children >= 3) {
    concerns.push("No attachment profiles in place — attachment-informed practice cannot be evidenced.");
    recommendations.push({ rank: ++rank, recommendation: "Develop attachment profiles for all children to inform therapeutic care planning.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 6" });
  }
  if (atOverdue >= 3) {
    concerns.push(`${atOverdue} attachment profiles are overdue for review.`);
  }

  // Self-soothing
  if (self_soothing_toolkits.length > 0 && ssChildLedRate >= 80 && ssEffRate >= 80) {
    strengths.push(`Outstanding self-soothing practice — ${ssChildLedRate}% child-led with ${ssEffRate}% rated effective.`);
  }
  if (self_soothing_toolkits.length > 0 && ssEffRate < 30) {
    concerns.push(`Low self-soothing effectiveness — only ${ssEffRate}% of toolkits rated as effective.`);
    recommendations.push({ rank: ++rank, recommendation: "Review and co-produce self-soothing toolkits with children — current strategies show low effectiveness.", urgency: "soon", regulatory_ref: null });
  }

  // ── Cara Insights ────────────────────────────────────────────────────
  if (bm90.length >= 10) {
    const selfHarm = bm90.filter(e => e.behaviour_type === "self_harm").length;
    const selfHarmPct = pct(selfHarm, bm90.length);
    if (selfHarmPct >= 20) {
      insights.push({ text: `Self-harm accounts for ${selfHarmPct}% of behaviour entries — review risk assessments and therapeutic interventions.`, severity: "critical" });
    }
  }
  if (sleep_assessments.length > 0) {
    const declining = sleep_assessments.filter(a => a.trend === "declining").length;
    if (declining >= 2) {
      insights.push({ text: `${declining} children show declining sleep trends — consider environmental audit and CAMHS review.`, severity: "warning" });
    }
  }
  if (attachment_profiles.length > 0) {
    const disorg = attachment_profiles.filter(p => p.primary_style === "disorganised").length;
    if (disorg >= 2) {
      insights.push({ text: `${disorg} children have disorganised attachment styles — ensure DDP/PACE-informed staff guidance is in place.`, severity: "warning" });
    }
  }
  if (self_soothing_toolkits.length > 0 && ssChildLedRate >= 90 && ssEffRate >= 90) {
    insights.push({ text: "Self-soothing toolkits are almost entirely child-led with high effectiveness — outstanding therapeutic co-production.", severity: "positive" });
  }
  if (evBreakthroughs >= 5) {
    insights.push({ text: `${evBreakthroughs} emotional breakthroughs recorded — strong evidence of therapeutic progress across the home.`, severity: "positive" });
  }

  // ── Headline ─────────────────────────────────────────────────────────
  let headline: string;
  if (therapeutic_rating === "outstanding") {
    headline = "Therapeutic practice is embedded and evidenced across the home with strong child voice.";
  } else if (therapeutic_rating === "good") {
    headline = "Good therapeutic foundations with opportunities to deepen child-led practice.";
  } else if (therapeutic_rating === "adequate") {
    headline = "Therapeutic practice is developing but gaps exist in coverage and review compliance.";
  } else {
    headline = "Significant therapeutic practice gaps — children may not be receiving the therapeutic care they need.";
  }

  return {
    therapeutic_rating,
    therapeutic_score: score,
    headline,
    behaviour_map,
    sensory,
    sleep,
    emotional_vocab,
    bereavement,
    attachment,
    self_soothing,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
