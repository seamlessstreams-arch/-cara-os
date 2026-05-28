// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME KEY WORKER RELATIONSHIP QUALITY INTELLIGENCE ENGINE
// Monitors the quality and consistency of key worker relationships with children.
// Measures key worker allocation coverage, relationship quality assessments,
// session regularity, child satisfaction with key worker, and relationship
// continuity over time.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Engagement with parents, etc.), Reg 11 (Duty of Registered
// Person), Reg 13 (Leadership and management).
// SCCIF: "Children are cared for by staff who understand their needs".
// Store keys: keyWorkerAllocationRecords, relationshipAssessmentRecords,
//             keyWorkerSessionRecords, childSatisfactionRecords,
//             continuityRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface KeyWorkerAllocationInput {
  id: string;
  child_id: string;
  staff_id: string;
  staff_name: string;
  allocated: boolean;
  allocation_date: string;
  active: boolean;
  backup_key_worker_assigned: boolean;
  allocation_reviewed: boolean;
  last_review_date: string | null;
  child_consulted_on_allocation: boolean;
  created_at: string;
}

export interface RelationshipAssessmentInput {
  id: string;
  child_id: string;
  staff_id: string;
  assessment_date: string;
  trust_score: number; // 1-5
  communication_score: number; // 1-5
  responsiveness_score: number; // 1-5
  emotional_attunement_score: number; // 1-5
  overall_quality_score: number; // 1-5
  assessor: string;
  child_voice_included: boolean;
  areas_for_development: string[];
  strengths_identified: string[];
  created_at: string;
}

export interface KeyWorkerSessionInput {
  id: string;
  child_id: string;
  staff_id: string;
  session_date: string;
  session_type: "one_to_one" | "activity" | "review" | "informal" | "outing";
  duration_minutes: number;
  session_completed: boolean;
  session_cancelled: boolean;
  cancellation_reason: string | null;
  child_engaged: boolean;
  objectives_set: boolean;
  objectives_met: boolean;
  child_voice_recorded: boolean;
  notes_recorded: boolean;
  created_at: string;
}

export interface ChildSatisfactionInput {
  id: string;
  child_id: string;
  survey_date: string;
  satisfaction_score: number; // 1-5
  feels_listened_to: boolean;
  feels_supported: boolean;
  would_recommend_key_worker: boolean;
  wants_change_of_key_worker: boolean;
  feedback_text: string | null;
  feedback_method: "survey" | "interview" | "informal" | "meeting";
  created_at: string;
}

export interface ContinuityRecordInput {
  id: string;
  child_id: string;
  key_worker_changes: number;
  current_key_worker_start_date: string;
  longest_relationship_days: number;
  change_reasons: string[];
  child_consulted_on_change: boolean;
  transition_supported: boolean;
  placement_start_date: string;
  created_at: string;
}

export interface KeyWorkerRelationshipQualityInput {
  today: string;
  total_children: number;
  key_worker_allocation_records: KeyWorkerAllocationInput[];
  relationship_assessment_records: RelationshipAssessmentInput[];
  key_worker_session_records: KeyWorkerSessionInput[];
  child_satisfaction_records: ChildSatisfactionInput[];
  continuity_records: ContinuityRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type KeyWorkerRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface KeyWorkerInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface KeyWorkerRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface KeyWorkerRelationshipQualityResult {
  key_worker_rating: KeyWorkerRating;
  key_worker_score: number;
  headline: string;
  total_children_allocated: number;
  allocation_coverage_rate: number;
  relationship_quality_rate: number;
  session_regularity_rate: number;
  child_satisfaction_rate: number;
  continuity_rate: number;
  child_voice_rate: number;
  avg_trust_score: number;
  avg_communication_score: number;
  avg_responsiveness_score: number;
  avg_emotional_attunement_score: number;
  avg_overall_quality_score: number;
  session_completion_rate: number;
  session_cancellation_rate: number;
  backup_key_worker_rate: number;
  allocation_review_rate: number;
  child_consulted_allocation_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: KeyWorkerRecommendation[];
  insights: KeyWorkerInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): KeyWorkerRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.floor(Math.abs(db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: KeyWorkerRating,
  score: number,
  headline: string,
): KeyWorkerRelationshipQualityResult {
  return {
    key_worker_rating: rating,
    key_worker_score: score,
    headline,
    total_children_allocated: 0,
    allocation_coverage_rate: 0,
    relationship_quality_rate: 0,
    session_regularity_rate: 0,
    child_satisfaction_rate: 0,
    continuity_rate: 0,
    child_voice_rate: 0,
    avg_trust_score: 0,
    avg_communication_score: 0,
    avg_responsiveness_score: 0,
    avg_emotional_attunement_score: 0,
    avg_overall_quality_score: 0,
    session_completion_rate: 0,
    session_cancellation_rate: 0,
    backup_key_worker_rate: 0,
    allocation_review_rate: 0,
    child_consulted_allocation_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeKeyWorkerRelationshipQuality(
  input: KeyWorkerRelationshipQualityInput,
): KeyWorkerRelationshipQualityResult {
  const {
    today,
    total_children,
    key_worker_allocation_records,
    relationship_assessment_records,
    key_worker_session_records,
    child_satisfaction_records,
    continuity_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    key_worker_allocation_records.length === 0 &&
    relationship_assessment_records.length === 0 &&
    key_worker_session_records.length === 0 &&
    child_satisfaction_records.length === 0 &&
    continuity_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess key worker relationship quality.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No key worker data recorded despite children on placement — key worker allocation and relationship quality require urgent attention.",
      ),
      concerns: [
        "No key worker allocation records, relationship assessments, session records, satisfaction surveys, or continuity data exist despite children being on placement — the home cannot evidence meaningful key worker relationships.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Immediately allocate a named key worker to every child on placement and implement structured recording of key worker sessions, relationship assessments, and child satisfaction to evidence the quality of key worker relationships.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 11 — Duty of Registered Person",
        },
        {
          rank: 2,
          recommendation:
            "Establish a key worker session schedule ensuring every child has regular, documented one-to-one time with their key worker, with child voice captured in each session.",
          urgency: "immediate",
          regulatory_ref: "SCCIF — Children are cared for by staff who understand their needs",
        },
      ],
      insights: [
        {
          text: "The complete absence of key worker records means Ofsted cannot verify that children have a named key worker who knows and understands them. This is a fundamental gap — key worker relationships are central to individualised care and the voice of the child.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Allocation coverage ---
  const activeAllocations = key_worker_allocation_records.filter(
    (a) => a.allocated && a.active,
  );
  const uniqueChildrenAllocated = new Set(
    activeAllocations.map((a) => a.child_id),
  ).size;
  const allocationCoverageRate =
    total_children > 0 ? pct(uniqueChildrenAllocated, total_children) : 0;

  // --- Backup key worker ---
  const withBackup = activeAllocations.filter((a) => a.backup_key_worker_assigned).length;
  const backupKeyWorkerRate = pct(withBackup, activeAllocations.length);

  // --- Allocation reviewed ---
  const reviewedAllocations = activeAllocations.filter((a) => a.allocation_reviewed).length;
  const allocationReviewRate = pct(reviewedAllocations, activeAllocations.length);

  // --- Child consulted on allocation ---
  const consultedOnAllocation = activeAllocations.filter(
    (a) => a.child_consulted_on_allocation,
  ).length;
  const childConsultedAllocationRate = pct(consultedOnAllocation, activeAllocations.length);

  // --- Relationship quality assessments ---
  const totalAssessments = relationship_assessment_records.length;

  const avgTrustScore = avg(
    relationship_assessment_records.map((r) => r.trust_score),
  );
  const avgCommunicationScore = avg(
    relationship_assessment_records.map((r) => r.communication_score),
  );
  const avgResponsivenessScore = avg(
    relationship_assessment_records.map((r) => r.responsiveness_score),
  );
  const avgEmotionalAttunementScore = avg(
    relationship_assessment_records.map((r) => r.emotional_attunement_score),
  );
  const avgOverallQualityScore = avg(
    relationship_assessment_records.map((r) => r.overall_quality_score),
  );

  const goodQualityAssessments = relationship_assessment_records.filter(
    (r) => r.overall_quality_score >= 4,
  ).length;
  const relationshipQualityRate = pct(goodQualityAssessments, totalAssessments);

  const assessmentsWithChildVoice = relationship_assessment_records.filter(
    (r) => r.child_voice_included,
  ).length;

  // --- Key worker sessions ---
  const totalSessions = key_worker_session_records.length;
  const completedSessions = key_worker_session_records.filter(
    (s) => s.session_completed,
  ).length;
  const cancelledSessions = key_worker_session_records.filter(
    (s) => s.session_cancelled,
  ).length;
  const sessionCompletionRate = pct(completedSessions, totalSessions);
  const sessionCancellationRate = pct(cancelledSessions, totalSessions);

  // Session regularity: unique children who had at least one completed session
  // in the last 14 days as a proportion of allocated children
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().slice(0, 10);

  const recentSessionChildren = new Set(
    key_worker_session_records
      .filter(
        (s) =>
          s.session_completed &&
          s.session_date >= fourteenDaysAgoStr,
      )
      .map((s) => s.child_id),
  ).size;
  const sessionRegularityRate =
    uniqueChildrenAllocated > 0
      ? pct(recentSessionChildren, uniqueChildrenAllocated)
      : totalSessions > 0
        ? sessionCompletionRate
        : 0;

  // Sessions with child engaged
  const engagedSessions = key_worker_session_records.filter(
    (s) => s.session_completed && s.child_engaged,
  ).length;

  // Sessions with child voice recorded
  const sessionsWithVoice = key_worker_session_records.filter(
    (s) => s.session_completed && s.child_voice_recorded,
  ).length;

  // Sessions with notes recorded
  const sessionsWithNotes = key_worker_session_records.filter(
    (s) => s.session_completed && s.notes_recorded,
  ).length;

  // Sessions with objectives set and met
  const sessionsWithObjectives = key_worker_session_records.filter(
    (s) => s.session_completed && s.objectives_set,
  ).length;
  const sessionsObjectivesMet = key_worker_session_records.filter(
    (s) => s.session_completed && s.objectives_set && s.objectives_met,
  ).length;

  // --- Child satisfaction ---
  const totalSatisfactionSurveys = child_satisfaction_records.length;
  const satisfiedChildren = child_satisfaction_records.filter(
    (s) => s.satisfaction_score >= 4,
  ).length;
  const childSatisfactionRate = pct(satisfiedChildren, totalSatisfactionSurveys);

  const feelsListened = child_satisfaction_records.filter(
    (s) => s.feels_listened_to,
  ).length;
  const feelsSupported = child_satisfaction_records.filter(
    (s) => s.feels_supported,
  ).length;
  const wouldRecommend = child_satisfaction_records.filter(
    (s) => s.would_recommend_key_worker,
  ).length;
  const wantsChange = child_satisfaction_records.filter(
    (s) => s.wants_change_of_key_worker,
  ).length;

  const avgSatisfactionScore = avg(
    child_satisfaction_records.map((s) => s.satisfaction_score),
  );

  // --- Continuity ---
  const totalContinuityRecords = continuity_records.length;

  // Continuity rate: children with 1 or fewer key worker changes
  const stableRelationships = continuity_records.filter(
    (c) => c.key_worker_changes <= 1,
  ).length;
  const continuityRate = pct(stableRelationships, totalContinuityRecords);

  // Children consulted on changes
  const changeMadeRecords = continuity_records.filter((c) => c.key_worker_changes > 0);
  const consultedOnChange = changeMadeRecords.filter(
    (c) => c.child_consulted_on_change,
  ).length;

  // Transitions supported
  const transitionsSupported = changeMadeRecords.filter(
    (c) => c.transition_supported,
  ).length;

  // Average longest relationship
  const avgLongestRelationshipDays = avg(
    continuity_records.map((c) => c.longest_relationship_days),
  );

  // Average key worker changes
  const avgKeyWorkerChanges = avg(
    continuity_records.map((c) => c.key_worker_changes),
  );

  // --- Child voice composite ---
  // Composite of: child voice in assessments, child voice in sessions,
  // child consulted on allocation, child satisfaction surveys completed
  const voiceNumerator =
    assessmentsWithChildVoice +
    sessionsWithVoice +
    consultedOnAllocation +
    totalSatisfactionSurveys;
  const voiceDenominator =
    totalAssessments +
    completedSessions +
    activeAllocations.length +
    (total_children > 0 ? total_children : 0);
  const childVoiceRate = pct(voiceNumerator, voiceDenominator);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: allocationCoverageRate (>=100: +4, >=80: +2) ---
  if (allocationCoverageRate >= 100) score += 4;
  else if (allocationCoverageRate >= 80) score += 2;

  // --- Bonus 2: relationshipQualityRate (>=90: +4, >=70: +2) ---
  if (relationshipQualityRate >= 90) score += 4;
  else if (relationshipQualityRate >= 70) score += 2;

  // --- Bonus 3: sessionRegularityRate (>=90: +3, >=70: +1) ---
  if (sessionRegularityRate >= 90) score += 3;
  else if (sessionRegularityRate >= 70) score += 1;

  // --- Bonus 4: childSatisfactionRate (>=90: +3, >=70: +1) ---
  if (childSatisfactionRate >= 90) score += 3;
  else if (childSatisfactionRate >= 70) score += 1;

  // --- Bonus 5: continuityRate (>=90: +3, >=70: +1) ---
  if (continuityRate >= 90) score += 3;
  else if (continuityRate >= 70) score += 1;

  // --- Bonus 6: childVoiceRate (>=90: +3, >=70: +1) ---
  if (childVoiceRate >= 90) score += 3;
  else if (childVoiceRate >= 70) score += 1;

  // --- Bonus 7: backupKeyWorkerRate (>=90: +2, >=70: +1) ---
  if (backupKeyWorkerRate >= 90) score += 2;
  else if (backupKeyWorkerRate >= 70) score += 1;

  // --- Bonus 8: sessionCompletionRate (>=95: +3, >=80: +1) ---
  if (sessionCompletionRate >= 95) score += 3;
  else if (sessionCompletionRate >= 80) score += 1;

  // --- Bonus 9: avgOverallQualityScore (>=4.5: +3, >=3.5: +1) ---
  if (avgOverallQualityScore >= 4.5) score += 3;
  else if (avgOverallQualityScore >= 3.5) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // Penalty 1: allocationCoverageRate < 50 → -5
  if (allocationCoverageRate < 50 && total_children > 0) score -= 5;

  // Penalty 2: childSatisfactionRate < 50 → -5
  if (childSatisfactionRate < 50 && totalSatisfactionSurveys > 0) score -= 5;

  // Penalty 3: sessionRegularityRate < 50 → -4
  if (sessionRegularityRate < 50 && uniqueChildrenAllocated > 0) score -= 4;

  // Penalty 4: continuityRate < 40 → -4
  if (continuityRate < 40 && totalContinuityRecords > 0) score -= 4;

  score = clamp(score, 0, 100);

  const key_worker_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (allocationCoverageRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child has an allocated key worker — the home ensures every child has a named member of staff who knows and understands them.",
    );
  } else if (allocationCoverageRate >= 80 && total_children > 0) {
    strengths.push(
      `${allocationCoverageRate}% of children have an allocated key worker — strong key worker allocation coverage across the home.`,
    );
  }

  if (backupKeyWorkerRate >= 90 && activeAllocations.length > 0) {
    strengths.push(
      `${backupKeyWorkerRate}% of children have a backup key worker assigned — continuity of relationship is protected even when the primary key worker is unavailable.`,
    );
  } else if (backupKeyWorkerRate >= 70 && activeAllocations.length > 0) {
    strengths.push(
      `${backupKeyWorkerRate}% of children have a backup key worker — good contingency planning for relationship continuity.`,
    );
  }

  if (childConsultedAllocationRate >= 90 && activeAllocations.length > 0) {
    strengths.push(
      `${childConsultedAllocationRate}% of children consulted on their key worker allocation — children's preferences are actively sought and respected.`,
    );
  } else if (childConsultedAllocationRate >= 70 && activeAllocations.length > 0) {
    strengths.push(
      `${childConsultedAllocationRate}% of children consulted on their key worker allocation — the home generally seeks children's views on who supports them.`,
    );
  }

  if (relationshipQualityRate >= 90 && totalAssessments > 0) {
    strengths.push(
      `${relationshipQualityRate}% of relationship assessments rated good or outstanding — key worker relationships are consistently high quality.`,
    );
  } else if (relationshipQualityRate >= 70 && totalAssessments > 0) {
    strengths.push(
      `${relationshipQualityRate}% of relationship assessments rated good or outstanding — the majority of key worker relationships are of good quality.`,
    );
  }

  if (avgOverallQualityScore >= 4.5 && totalAssessments > 0) {
    strengths.push(
      `Average relationship quality score ${avgOverallQualityScore}/5 — key workers demonstrate exceptional quality in their relationships with children.`,
    );
  } else if (avgOverallQualityScore >= 3.5 && totalAssessments > 0) {
    strengths.push(
      `Average relationship quality score ${avgOverallQualityScore}/5 — key workers maintain good quality relationships with children.`,
    );
  }

  if (avgTrustScore >= 4.0 && totalAssessments > 0) {
    strengths.push(
      `Trust scores averaging ${avgTrustScore}/5 — children demonstrate strong trust in their key workers, which is foundational to effective care.`,
    );
  }

  if (avgEmotionalAttunementScore >= 4.0 && totalAssessments > 0) {
    strengths.push(
      `Emotional attunement scores averaging ${avgEmotionalAttunementScore}/5 — key workers are attuned to children's emotional needs and respond sensitively.`,
    );
  }

  if (sessionRegularityRate >= 90 && uniqueChildrenAllocated > 0) {
    strengths.push(
      `${sessionRegularityRate}% of children had a key worker session within the last 14 days — excellent session regularity ensuring consistent relationship maintenance.`,
    );
  } else if (sessionRegularityRate >= 70 && uniqueChildrenAllocated > 0) {
    strengths.push(
      `${sessionRegularityRate}% of children had a recent key worker session — good regularity of key worker contact.`,
    );
  }

  if (sessionCompletionRate >= 95 && totalSessions > 0) {
    strengths.push(
      `${sessionCompletionRate}% session completion rate — key worker sessions are rarely missed, demonstrating commitment to maintaining relationships.`,
    );
  } else if (sessionCompletionRate >= 80 && totalSessions > 0) {
    strengths.push(
      `${sessionCompletionRate}% session completion rate — the majority of planned key worker sessions take place as scheduled.`,
    );
  }

  if (completedSessions > 0) {
    const engagementRate = pct(engagedSessions, completedSessions);
    if (engagementRate >= 90) {
      strengths.push(
        `${engagementRate}% child engagement in key worker sessions — children are actively engaged during their time with their key worker.`,
      );
    }
  }

  if (completedSessions > 0) {
    const notesRate = pct(sessionsWithNotes, completedSessions);
    if (notesRate >= 90) {
      strengths.push(
        `${notesRate}% of sessions have notes recorded — thorough documentation of key worker interactions supports continuity and evidences relationship quality.`,
      );
    }
  }

  if (sessionsWithObjectives > 0) {
    const objectivesMetRate = pct(sessionsObjectivesMet, sessionsWithObjectives);
    if (objectivesMetRate >= 80) {
      strengths.push(
        `${objectivesMetRate}% of session objectives met — key worker sessions are purposeful and deliver on planned outcomes.`,
      );
    }
  }

  if (childSatisfactionRate >= 90 && totalSatisfactionSurveys > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction with key worker — children overwhelmingly value and appreciate their key worker relationship.`,
    );
  } else if (childSatisfactionRate >= 70 && totalSatisfactionSurveys > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction rate — most children are satisfied with their key worker relationship.`,
    );
  }

  if (totalSatisfactionSurveys > 0) {
    const listenedRate = pct(feelsListened, totalSatisfactionSurveys);
    if (listenedRate >= 90) {
      strengths.push(
        `${listenedRate}% of children feel listened to by their key worker — children's voices are genuinely heard in the key worker relationship.`,
      );
    }

    const supportedRate = pct(feelsSupported, totalSatisfactionSurveys);
    if (supportedRate >= 90) {
      strengths.push(
        `${supportedRate}% of children feel supported by their key worker — key workers provide meaningful emotional and practical support.`,
      );
    }

    const recommendRate = pct(wouldRecommend, totalSatisfactionSurveys);
    if (recommendRate >= 90) {
      strengths.push(
        `${recommendRate}% of children would recommend their key worker — a strong endorsement of the quality of key worker relationships.`,
      );
    }
  }

  if (continuityRate >= 90 && totalContinuityRecords > 0) {
    strengths.push(
      `${continuityRate}% of children have stable key worker relationships (1 or fewer changes) — the home maintains excellent relationship continuity.`,
    );
  } else if (continuityRate >= 70 && totalContinuityRecords > 0) {
    strengths.push(
      `${continuityRate}% of children have stable key worker relationships — good continuity of key worker assignments across the home.`,
    );
  }

  if (avgLongestRelationshipDays >= 180 && totalContinuityRecords > 0) {
    strengths.push(
      `Average longest key worker relationship is ${Math.round(avgLongestRelationshipDays)} days — children benefit from long-standing, consistent relationships with their key workers.`,
    );
  }

  if (changeMadeRecords.length > 0) {
    const consultedOnChangeRate = pct(consultedOnChange, changeMadeRecords.length);
    if (consultedOnChangeRate >= 90) {
      strengths.push(
        `${consultedOnChangeRate}% of key worker changes involved child consultation — children have a genuine voice in who cares for them, even during transitions.`,
      );
    }

    const transitionSupportRate = pct(transitionsSupported, changeMadeRecords.length);
    if (transitionSupportRate >= 90) {
      strengths.push(
        `${transitionSupportRate}% of key worker transitions were supported — changes are managed sensitively with the child's emotional wellbeing prioritised.`,
      );
    }
  }

  if (childVoiceRate >= 90) {
    strengths.push(
      `Child voice captured across ${childVoiceRate}% of key worker activities — children's perspectives are consistently embedded in the key worker relationship.`,
    );
  } else if (childVoiceRate >= 70) {
    strengths.push(
      `Child voice captured in ${childVoiceRate}% of key worker activities — good practice in embedding children's perspectives.`,
    );
  }

  if (allocationReviewRate >= 90 && activeAllocations.length > 0) {
    strengths.push(
      `${allocationReviewRate}% of key worker allocations have been reviewed — the home regularly evaluates whether key worker matches are working for children.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (allocationCoverageRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${allocationCoverageRate}% of children have an allocated key worker — the majority of children lack a named person who knows them well, undermining individualised care.`,
    );
  } else if (allocationCoverageRate >= 50 && allocationCoverageRate < 80 && total_children > 0) {
    concerns.push(
      `Key worker allocation at ${allocationCoverageRate}% — not all children have a named key worker, which may leave some children without consistent, individualised support.`,
    );
  }

  if (backupKeyWorkerRate < 50 && activeAllocations.length > 0) {
    concerns.push(
      `Only ${backupKeyWorkerRate}% of children have a backup key worker — when the primary key worker is absent, children may lack a consistent adult who knows them.`,
    );
  }

  if (childConsultedAllocationRate < 50 && activeAllocations.length > 0) {
    concerns.push(
      `Only ${childConsultedAllocationRate}% of children consulted on key worker allocation — children are not given a meaningful voice in who their key worker is.`,
    );
  } else if (childConsultedAllocationRate >= 50 && childConsultedAllocationRate < 70 && activeAllocations.length > 0) {
    concerns.push(
      `Child consultation on allocation at ${childConsultedAllocationRate}% — some children are not being asked about their key worker preferences.`,
    );
  }

  if (allocationReviewRate < 50 && activeAllocations.length > 0) {
    concerns.push(
      `Only ${allocationReviewRate}% of key worker allocations reviewed — without regular review, unsuitable key worker matches may persist, affecting relationship quality.`,
    );
  }

  if (relationshipQualityRate < 50 && totalAssessments > 0) {
    concerns.push(
      `Only ${relationshipQualityRate}% of relationship assessments rated good or outstanding — the majority of key worker relationships are not meeting quality expectations.`,
    );
  } else if (relationshipQualityRate >= 50 && relationshipQualityRate < 70 && totalAssessments > 0) {
    concerns.push(
      `Relationship quality rate at ${relationshipQualityRate}% — a significant proportion of key worker relationships are not yet at the level expected.`,
    );
  }

  if (avgOverallQualityScore < 3.0 && totalAssessments > 0) {
    concerns.push(
      `Average relationship quality score only ${avgOverallQualityScore}/5 — key worker relationships are not providing the quality of support children need.`,
    );
  }

  if (avgTrustScore < 3.0 && totalAssessments > 0) {
    concerns.push(
      `Trust scores averaging only ${avgTrustScore}/5 — children do not sufficiently trust their key workers, which undermines the foundation of the care relationship.`,
    );
  }

  if (avgEmotionalAttunementScore < 3.0 && totalAssessments > 0) {
    concerns.push(
      `Emotional attunement scores averaging only ${avgEmotionalAttunementScore}/5 — key workers may not be adequately sensitive to children's emotional states and needs.`,
    );
  }

  if (sessionRegularityRate < 50 && uniqueChildrenAllocated > 0) {
    concerns.push(
      `Only ${sessionRegularityRate}% of children had a key worker session in the last 14 days — irregular contact undermines the key worker relationship and children's sense of being valued.`,
    );
  } else if (sessionRegularityRate >= 50 && sessionRegularityRate < 70 && uniqueChildrenAllocated > 0) {
    concerns.push(
      `Session regularity at ${sessionRegularityRate}% — some children are not receiving regular key worker sessions, which may affect relationship depth.`,
    );
  }

  if (sessionCancellationRate > 30 && totalSessions > 0) {
    concerns.push(
      `Session cancellation rate at ${sessionCancellationRate}% — frequent cancellations may communicate to children that their key worker time is not a priority.`,
    );
  } else if (sessionCancellationRate > 15 && totalSessions > 0) {
    concerns.push(
      `Session cancellation rate at ${sessionCancellationRate}% — cancellations above expected levels may be affecting children's trust in the consistency of their key worker relationship.`,
    );
  }

  if (completedSessions > 0) {
    const engagementRate = pct(engagedSessions, completedSessions);
    if (engagementRate < 50) {
      concerns.push(
        `Only ${engagementRate}% child engagement in sessions — children are not engaging during key worker time, which may indicate sessions are not meeting their needs or preferences.`,
      );
    }
  }

  if (childSatisfactionRate < 50 && totalSatisfactionSurveys > 0) {
    concerns.push(
      `Only ${childSatisfactionRate}% child satisfaction with key worker — the majority of children are not satisfied with their key worker relationship, indicating a fundamental gap in care quality.`,
    );
  } else if (childSatisfactionRate >= 50 && childSatisfactionRate < 70 && totalSatisfactionSurveys > 0) {
    concerns.push(
      `Child satisfaction at ${childSatisfactionRate}% — a significant proportion of children are not satisfied with their key worker, which requires investigation.`,
    );
  }

  if (totalSatisfactionSurveys > 0) {
    const wantsChangeRate = pct(wantsChange, totalSatisfactionSurveys);
    if (wantsChangeRate > 20) {
      concerns.push(
        `${wantsChangeRate}% of children want a change of key worker — this level of dissatisfaction with key worker assignments requires immediate review of allocation practices.`,
      );
    }

    const listenedRate = pct(feelsListened, totalSatisfactionSurveys);
    if (listenedRate < 50) {
      concerns.push(
        `Only ${listenedRate}% of children feel listened to by their key worker — children do not feel their voice matters within the key worker relationship.`,
      );
    }

    const supportedRate = pct(feelsSupported, totalSatisfactionSurveys);
    if (supportedRate < 50) {
      concerns.push(
        `Only ${supportedRate}% of children feel supported by their key worker — key workers are not providing the emotional or practical support children need.`,
      );
    }
  }

  if (continuityRate < 40 && totalContinuityRecords > 0) {
    concerns.push(
      `Only ${continuityRate}% of children have stable key worker relationships — frequent changes of key worker disrupt children's sense of security and belonging.`,
    );
  } else if (continuityRate >= 40 && continuityRate < 70 && totalContinuityRecords > 0) {
    concerns.push(
      `Continuity rate at ${continuityRate}% — some children are experiencing multiple key worker changes which may affect attachment and trust.`,
    );
  }

  if (avgKeyWorkerChanges > 3 && totalContinuityRecords > 0) {
    concerns.push(
      `Average of ${Math.round(avgKeyWorkerChanges * 10) / 10} key worker changes per child — excessive changes prevent children from forming secure, trusting relationships.`,
    );
  }

  if (changeMadeRecords.length > 0) {
    const consultedOnChangeRate = pct(consultedOnChange, changeMadeRecords.length);
    if (consultedOnChangeRate < 50) {
      concerns.push(
        `Only ${consultedOnChangeRate}% of key worker changes involved child consultation — children's views are not being sought when decisions are made about who supports them.`,
      );
    }
  }

  if (childVoiceRate < 50 && voiceDenominator > 0) {
    concerns.push(
      `Child voice captured in only ${childVoiceRate}% of key worker activities — children's perspectives are not being systematically sought or recorded within the key worker framework.`,
    );
  } else if (childVoiceRate >= 50 && childVoiceRate < 70 && voiceDenominator > 0) {
    concerns.push(
      `Child voice rate at ${childVoiceRate}% — capturing children's perspectives in key worker activities is inconsistent and needs strengthening.`,
    );
  }

  if (totalAssessments === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No relationship quality assessments recorded — the home cannot evidence the quality of key worker relationships, which Ofsted will view as a significant gap.",
    );
  }

  if (totalSatisfactionSurveys === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No child satisfaction data for key worker relationships — without actively seeking children's views on their key worker, the home cannot demonstrate that relationships meet children's needs.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: KeyWorkerRecommendation[] = [];
  let rank = 0;

  if (allocationCoverageRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently allocate a named key worker to every child on placement — every child must have a staff member who knows them well, understands their needs, and champions their care.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 11 — Duty of Registered Person",
    });
  }

  if (childSatisfactionRate < 50 && totalSatisfactionSurveys > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review all key worker assignments where children express dissatisfaction — meet individually with each child to understand their concerns and, where appropriate, offer a change of key worker.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Children are cared for by staff who understand their needs",
    });
  }

  if (sessionRegularityRate < 50 && uniqueChildrenAllocated > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a structured key worker session schedule ensuring every child has at least one quality session every 14 days — regular contact is essential for building and maintaining trusting relationships.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 13 — Leadership and management",
    });
  }

  if (continuityRate < 40 && totalContinuityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate the causes of frequent key worker changes and develop a retention and allocation strategy — children need stable, consistent relationships with their key workers to feel secure.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 13 — Leadership and management",
    });
  }

  if (totalAssessments === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement regular relationship quality assessments covering trust, communication, responsiveness, and emotional attunement — these provide evidence of relationship quality and identify areas for development.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 13 — Leadership and management",
    });
  }

  if (totalSatisfactionSurveys === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a regular child satisfaction survey process for key worker relationships — children's views on their key worker are essential evidence that relationships are child-centred and effective.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (childConsultedAllocationRate < 50 && activeAllocations.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Consult every child on their key worker allocation — children should have a meaningful say in who their key worker is, as this fosters ownership and investment in the relationship.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (relationshipQualityRate < 50 && totalAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide targeted support and training for key workers where relationship quality assessments are below standard — invest in staff development to improve trust, communication, and emotional attunement.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 13 — Leadership and management",
    });
  }

  if (backupKeyWorkerRate < 50 && activeAllocations.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Assign backup key workers for all children — when the primary key worker is absent, children should have a familiar, named adult who can provide consistent support.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 13 — Leadership and management",
    });
  }

  if (childVoiceRate < 50 && voiceDenominator > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Systematically embed child voice in all key worker activities — ensure children's views are captured in assessments, sessions, and allocation decisions as standard practice.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (allocationCoverageRate >= 50 && allocationCoverageRate < 80 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend key worker allocation to all children — aim for 100% coverage to ensure every child benefits from a named, dedicated key worker relationship.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 11 — Duty of Registered Person",
    });
  }

  if (sessionRegularityRate >= 50 && sessionRegularityRate < 70 && uniqueChildrenAllocated > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve session regularity to ensure all children have key worker contact at least every 14 days — consistent contact strengthens the relationship and provides opportunities for children to share their views.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 13 — Leadership and management",
    });
  }

  if (sessionCancellationRate > 30 && totalSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate the reasons for high session cancellation rates and implement protective measures — cancelled sessions communicate to children that their time is not valued.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 13 — Leadership and management",
    });
  }

  if (childSatisfactionRate >= 50 && childSatisfactionRate < 70 && totalSatisfactionSurveys > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review key worker assignments with children who report lower satisfaction — explore what would improve their experience and make adjustments, including changes of key worker where requested.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Children are cared for by staff who understand their needs",
    });
  }

  if (continuityRate >= 40 && continuityRate < 70 && totalContinuityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Reduce key worker changes by addressing root causes such as staff turnover, rota patterns, and allocation decisions — aim for relationship stability as a core principle of the home's care model.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 13 — Leadership and management",
    });
  }

  if (relationshipQualityRate >= 50 && relationshipQualityRate < 70 && totalAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Target relationship quality improvement through reflective supervision, mentoring, and peer support — help key workers develop deeper, more attuned relationships with their children.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 13 — Leadership and management",
    });
  }

  if (childVoiceRate >= 50 && childVoiceRate < 70 && voiceDenominator > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen child voice practice by embedding children's views as a standing item in all key worker sessions, assessments, and allocation reviews.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (allocationReviewRate < 50 && activeAllocations.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review all key worker allocations at least quarterly to ensure matches remain appropriate and effective — include the child's voice in every review.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 13 — Leadership and management",
    });
  }

  if (totalSatisfactionSurveys > 0) {
    const wantsChangeRate = pct(wantsChange, totalSatisfactionSurveys);
    if (wantsChangeRate > 20) {
      recommendations.push({
        rank: ++rank,
        recommendation:
          "Urgently review key worker allocations for children requesting a change — every child's request for a different key worker should be taken seriously and acted upon promptly.",
        urgency: "immediate",
        regulatory_ref: "SCCIF — Voice of the child",
      });
    }
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: KeyWorkerInsight[] = [];

  // -- Critical insights --

  if (allocationCoverageRate < 50 && total_children > 0) {
    insights.push({
      text: `Only ${allocationCoverageRate}% of children have an allocated key worker. Ofsted expects every child to have a named key worker who knows them well — without this, the home cannot evidence individualised, relationship-based care.`,
      severity: "critical",
    });
  }

  if (childSatisfactionRate < 50 && totalSatisfactionSurveys > 0) {
    insights.push({
      text: `Only ${childSatisfactionRate}% of children satisfied with their key worker. When children are not satisfied with their primary carer relationship, it indicates a fundamental gap in the home's ability to provide relationship-based care that meets children's emotional needs.`,
      severity: "critical",
    });
  }

  if (sessionRegularityRate < 50 && uniqueChildrenAllocated > 0) {
    insights.push({
      text: `Only ${sessionRegularityRate}% of children had a key worker session in the last 14 days. Irregular contact prevents relationships from deepening and may leave children feeling that their key worker does not prioritise them. Ofsted will view this as a failure in relationship-based care.`,
      severity: "critical",
    });
  }

  if (continuityRate < 40 && totalContinuityRecords > 0) {
    insights.push({
      text: `Only ${continuityRate}% of children have stable key worker relationships. Frequent changes disrupt the trust and security that children need from their primary carer. For children who have experienced loss and instability, key worker changes can be re-traumatising.`,
      severity: "critical",
    });
  }

  if (totalAssessments === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No relationship quality assessments recorded. Without structured assessment of key worker relationships, the home cannot identify strengths, address weaknesses, or evidence to Ofsted that relationships are of sufficient quality to meet children's needs.",
      severity: "critical",
    });
  }

  if (totalSatisfactionSurveys === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No child satisfaction data for key worker relationships. The home has no evidence that children's views on their key worker relationship have been sought — this is a significant gap in the voice of the child framework and will be scrutinised by Ofsted.",
      severity: "critical",
    });
  }

  if (totalSatisfactionSurveys > 0) {
    const wantsChangeRate = pct(wantsChange, totalSatisfactionSurveys);
    if (wantsChangeRate > 30) {
      insights.push({
        text: `${wantsChangeRate}% of children want a change of key worker. This level of dissatisfaction is a serious indicator that key worker allocation is not working for children. Each request must be acted on — forcing children to remain with a key worker they do not want undermines trust and autonomy.`,
        severity: "critical",
      });
    }
  }

  if (avgTrustScore < 2.5 && totalAssessments > 0) {
    insights.push({
      text: `Trust scores averaging only ${avgTrustScore}/5. Trust is the foundation of the key worker relationship — without it, children will not share their feelings, seek help, or engage meaningfully with their care plan. This requires urgent attention.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (allocationCoverageRate >= 50 && allocationCoverageRate < 80 && total_children > 0) {
    insights.push({
      text: `Key worker allocation at ${allocationCoverageRate}% — improving but some children still lack a named key worker. Every child deserves a dedicated staff member who champions their individual needs.`,
      severity: "warning",
    });
  }

  if (relationshipQualityRate >= 50 && relationshipQualityRate < 70 && totalAssessments > 0) {
    insights.push({
      text: `Relationship quality at ${relationshipQualityRate}% good or outstanding — while improving, some key worker relationships need development. Consider targeted training in communication, empathy, and attunement skills.`,
      severity: "warning",
    });
  }

  if (sessionRegularityRate >= 50 && sessionRegularityRate < 70 && uniqueChildrenAllocated > 0) {
    insights.push({
      text: `Session regularity at ${sessionRegularityRate}% — some children are not receiving regular key worker sessions. Relationships require consistent investment of time to deepen and sustain.`,
      severity: "warning",
    });
  }

  if (sessionCancellationRate > 15 && sessionCancellationRate <= 30 && totalSessions > 0) {
    insights.push({
      text: `Session cancellation rate at ${sessionCancellationRate}% — above expected levels. Frequent cancellations, even if rescheduled, can communicate to children that their time is not valued. Review rota planning to protect key worker session time.`,
      severity: "warning",
    });
  }

  if (childSatisfactionRate >= 50 && childSatisfactionRate < 70 && totalSatisfactionSurveys > 0) {
    insights.push({
      text: `Child satisfaction at ${childSatisfactionRate}% — a significant proportion of children are not fully satisfied with their key worker. Explore what children would value in the relationship and adapt practice accordingly.`,
      severity: "warning",
    });
  }

  if (continuityRate >= 40 && continuityRate < 70 && totalContinuityRecords > 0) {
    insights.push({
      text: `Continuity at ${continuityRate}% — some children are experiencing multiple key worker changes. Each change requires the child to invest trust in a new adult, which can be particularly challenging for children with attachment difficulties.`,
      severity: "warning",
    });
  }

  if (childVoiceRate >= 50 && childVoiceRate < 70 && voiceDenominator > 0) {
    insights.push({
      text: `Child voice captured in ${childVoiceRate}% of key worker activities — while present, capturing children's views is not yet consistent. Embedding child voice as standard practice across all key worker interactions would strengthen the home's evidence base.`,
      severity: "warning",
    });
  }

  if (backupKeyWorkerRate < 50 && activeAllocations.length > 0) {
    insights.push({
      text: `Only ${backupKeyWorkerRate}% of children have a backup key worker. When the primary key worker is absent — through leave, sickness, or shift patterns — children may lose contact with anyone who knows them well.`,
      severity: "warning",
    });
  }

  if (avgOverallQualityScore >= 3.0 && avgOverallQualityScore < 3.5 && totalAssessments > 0) {
    insights.push({
      text: `Average relationship quality score at ${avgOverallQualityScore}/5 — relationships are functional but not yet consistently delivering the depth of connection children need. Development in emotional attunement and trust-building would strengthen scores.`,
      severity: "warning",
    });
  }

  if (totalSatisfactionSurveys > 0) {
    const listenedRate = pct(feelsListened, totalSatisfactionSurveys);
    if (listenedRate >= 50 && listenedRate < 70) {
      insights.push({
        text: `${listenedRate}% of children feel listened to by their key worker — while positive, this means some children feel their views are not being heard. Active listening skills development could improve this.`,
        severity: "warning",
      });
    }
  }

  // -- Change reasons analysis --
  if (changeMadeRecords.length > 0) {
    const allReasons = changeMadeRecords.flatMap((c) => c.change_reasons);
    const reasonCounts: Record<string, number> = {};
    for (const reason of allReasons) {
      reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
    }
    const topReasons = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    if (topReasons.length > 0) {
      insights.push({
        text: `Top reasons for key worker changes: ${topReasons.map(([r, c]) => `"${r}" (${c})`).join(", ")}. Understanding and addressing systemic causes of key worker changes is essential to improving relationship continuity.`,
        severity: "warning",
      });
    }
  }

  // -- Positive insights --

  if (key_worker_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding key worker relationship quality — children have named key workers who know them well, sessions are regular, relationships are stable, and children report high satisfaction. This is strong evidence of relationship-based care that genuinely meets children's individual needs.",
      severity: "positive",
    });
  }

  if (allocationCoverageRate >= 100 && backupKeyWorkerRate >= 90 && total_children > 0 && activeAllocations.length > 0) {
    insights.push({
      text: `Every child has a key worker and ${backupKeyWorkerRate}% have a backup — the home ensures relationship continuity is protected through comprehensive allocation and contingency planning.`,
      severity: "positive",
    });
  }

  if (avgOverallQualityScore >= 4.5 && totalAssessments > 0) {
    insights.push({
      text: `Relationship quality averaging ${avgOverallQualityScore}/5 — key workers are forming exceptionally strong, trusting, and attuned relationships with children. This is the hallmark of outstanding relationship-based care.`,
      severity: "positive",
    });
  }

  if (sessionRegularityRate >= 90 && sessionCompletionRate >= 95 && uniqueChildrenAllocated > 0 && totalSessions > 0) {
    insights.push({
      text: `${sessionRegularityRate}% session regularity with ${sessionCompletionRate}% completion — key worker sessions are protected, prioritised, and consistently delivered, ensuring every child has regular quality time with their key worker.`,
      severity: "positive",
    });
  }

  if (childSatisfactionRate >= 90 && totalSatisfactionSurveys > 0) {
    insights.push({
      text: `${childSatisfactionRate}% child satisfaction with key worker relationships — children overwhelmingly value their key worker. Ofsted will view this as powerful evidence that the home's approach to key working is genuinely child-centred and effective.`,
      severity: "positive",
    });
  }

  if (continuityRate >= 90 && totalContinuityRecords > 0) {
    insights.push({
      text: `${continuityRate}% of children have stable key worker relationships — the home maintains excellent relationship continuity, providing children with the consistency and security they need.`,
      severity: "positive",
    });
  }

  if (childVoiceRate >= 90 && voiceDenominator > 0) {
    insights.push({
      text: `Child voice captured across ${childVoiceRate}% of key worker activities — children's perspectives are systematically embedded in every aspect of the key worker relationship, from allocation to sessions to assessments.`,
      severity: "positive",
    });
  }

  if (totalSatisfactionSurveys > 0) {
    const listenedRate = pct(feelsListened, totalSatisfactionSurveys);
    const supportedRate = pct(feelsSupported, totalSatisfactionSurveys);
    if (listenedRate >= 90 && supportedRate >= 90) {
      insights.push({
        text: `${listenedRate}% of children feel listened to and ${supportedRate}% feel supported by their key worker — children experience their key worker relationship as one where they are genuinely heard and helped.`,
        severity: "positive",
      });
    }
  }

  if (childConsultedAllocationRate >= 90 && activeAllocations.length > 0) {
    insights.push({
      text: `${childConsultedAllocationRate}% of children consulted on key worker allocation — the home gives children genuine agency in choosing who their key worker is, which fosters ownership and investment in the relationship.`,
      severity: "positive",
    });
  }

  if (avgLongestRelationshipDays >= 365 && totalContinuityRecords > 0) {
    insights.push({
      text: `Average longest key worker relationship is ${Math.round(avgLongestRelationshipDays)} days (over a year) — children benefit from deeply established relationships built over sustained time. This level of continuity supports secure attachment and emotional stability.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (key_worker_rating === "outstanding") {
    headline =
      "Outstanding key worker relationship quality — children have named key workers they trust, sessions are regular, relationships are stable, and children report high satisfaction.";
  } else if (key_worker_rating === "good") {
    headline = `Good key worker relationship quality — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (key_worker_rating === "adequate") {
    headline = `Adequate key worker relationship quality — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children have consistent, high-quality key worker relationships.`;
  } else {
    headline = `Key worker relationship quality is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children have meaningful, stable key worker relationships.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    key_worker_rating,
    key_worker_score: score,
    headline,
    total_children_allocated: uniqueChildrenAllocated,
    allocation_coverage_rate: allocationCoverageRate,
    relationship_quality_rate: relationshipQualityRate,
    session_regularity_rate: sessionRegularityRate,
    child_satisfaction_rate: childSatisfactionRate,
    continuity_rate: continuityRate,
    child_voice_rate: childVoiceRate,
    avg_trust_score: avgTrustScore,
    avg_communication_score: avgCommunicationScore,
    avg_responsiveness_score: avgResponsivenessScore,
    avg_emotional_attunement_score: avgEmotionalAttunementScore,
    avg_overall_quality_score: avgOverallQualityScore,
    session_completion_rate: sessionCompletionRate,
    session_cancellation_rate: sessionCancellationRate,
    backup_key_worker_rate: backupKeyWorkerRate,
    allocation_review_rate: allocationReviewRate,
    child_consulted_allocation_rate: childConsultedAllocationRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
