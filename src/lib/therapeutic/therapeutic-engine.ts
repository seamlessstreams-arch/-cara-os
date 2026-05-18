// ══════════════════════════════════════════════════════════════════════════════
// Therapeutic Support & Emotional Wellbeing Engine
// CHR 2015 Reg 6 (Quality & Purpose), Reg 10 (Health & Wellbeing)
// SCCIF: Experiences & Progress — Emotional Health
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export type TherapeuticModel =
  | "dyadic_developmental_psychotherapy"
  | "pace"
  | "theraplay"
  | "cbt"
  | "emdr"
  | "art_therapy"
  | "play_therapy"
  | "systemic_family_therapy"
  | "dialectical_behaviour_therapy"
  | "trauma_focused_cbt"
  | "sensory_integration"
  | "narrative_therapy"
  | "other";

export type EmotionalRegulationLevel =
  | "emerging"
  | "developing"
  | "established"
  | "secure";

export type MentalHealthStatus =
  | "stable"
  | "improving"
  | "declining"
  | "crisis"
  | "monitoring";

export type ReferralStatus =
  | "not_referred"
  | "referral_pending"
  | "on_waiting_list"
  | "active_treatment"
  | "discharged"
  | "declined_service";

export type InterventionType =
  | "individual_therapy"
  | "group_work"
  | "therapeutic_parenting"
  | "life_story_work"
  | "sensory_regulation"
  | "emotional_coaching"
  | "crisis_intervention"
  | "medication_review"
  | "psychoeducation"
  | "creative_therapy"
  | "outdoor_therapy"
  | "peer_support";

export type WellbeingDomain =
  | "emotional_regulation"
  | "attachment_security"
  | "self_esteem"
  | "peer_relationships"
  | "trauma_recovery"
  | "anxiety_management"
  | "resilience"
  | "identity";

export interface WellbeingScore {
  domain: WellbeingDomain;
  score: number; // 0-100
  trend: "improving" | "stable" | "declining";
  lastAssessed: string; // ISO date
  targetScore: number;
}

export interface TherapeuticIntervention {
  id: string;
  type: InterventionType;
  provider: string;
  startDate: string;
  endDate?: string;
  frequency: string; // e.g., "weekly", "fortnightly"
  sessionsAttended: number;
  sessionsMissed: number;
  effectiveness: number; // 0-100 rated by practitioner
  childFeedback?: number; // 0-100 child's own rating
  notes?: string;
  active: boolean;
}

export interface CAMHSReferral {
  status: ReferralStatus;
  referralDate?: string;
  acceptedDate?: string;
  firstAppointment?: string;
  lastAppointment?: string;
  nextAppointment?: string;
  waitingWeeks?: number;
  tier: 1 | 2 | 3 | 4;
  diagnosis?: string[];
  clinician?: string;
}

export interface CrisisEvent {
  id: string;
  date: string;
  trigger: string;
  severity: "low" | "moderate" | "high" | "critical";
  interventionUsed: string;
  deEscalationTime: number; // minutes
  outcome: string;
  followUpCompleted: boolean;
}

export interface ChildTherapeuticProfile {
  childId: string;
  childName: string;
  primaryModel: TherapeuticModel;
  secondaryModels: TherapeuticModel[];
  emotionalRegulationLevel: EmotionalRegulationLevel;
  mentalHealthStatus: MentalHealthStatus;
  wellbeingScores: WellbeingScore[];
  interventions: TherapeuticIntervention[];
  camhsReferral: CAMHSReferral;
  crisisEvents: CrisisEvent[];
  sdqScore?: number; // Strengths & Difficulties Questionnaire 0-40
  sdqDate?: string;
  safetyPlanInPlace: boolean;
  safetyPlanReviewDate?: string;
  therapeuticGoals: string[];
  protectiveFactors: string[];
  riskFactors: string[];
  keyRelationships: string[];
  lastTherapeuticReview: string;
  nextTherapeuticReview: string;
}

export interface HomeTherapeuticConfig {
  homeId: string;
  primaryTherapeuticModel: TherapeuticModel;
  supportingModels: TherapeuticModel[];
  therapeuticConsultant?: string;
  consultationFrequency: string;
  lastConsultation?: string;
  nextConsultation?: string;
  trainedStaffPercentage: number; // % of staff trained in primary model
  reflectivePracticeFrequency: string;
  lastReflectivePractice?: string;
  sdqFrequency: "quarterly" | "biannual" | "annual";
  wellbeingReviewFrequency: "monthly" | "quarterly";
  maxCrisisEventsBeforeEscalation: number;
  minimumTherapeuticHoursPerWeek: number;
}

// ── Result Types ─────────────────────────────────────────────────────────────

export interface TherapeuticComplianceResult {
  isCompliant: boolean;
  overallScore: number;
  issues: string[];
  warnings: string[];
  modelAdherenceScore: number;
  staffTrainingScore: number;
  interventionCoverageScore: number;
  wellbeingProgressScore: number;
  crisisManagementScore: number;
  childrenWithActiveInterventions: number;
  childrenWithoutSupport: string[];
  childrenInCrisis: string[];
  childrenDeclining: string[];
  averageWellbeingScore: number;
  sdqOverdue: string[];
  wellbeingReviewOverdue: string[];
  camhsWaitingList: string[];
  therapeuticReviewOverdue: string[];
}

export interface HomeTherapeuticMetrics {
  overallWellbeingScore: number;
  totalActiveInterventions: number;
  interventionAttendanceRate: number;
  averageEffectiveness: number;
  childrenImproving: number;
  childrenStable: number;
  childrenDeclining: number;
  childrenInCrisis: number;
  crisisEventsThisMonth: number;
  averageDeEscalationTime: number;
  camhsActiveCount: number;
  camhsWaitingCount: number;
  sdqAverageScore: number;
  staffTrainingPercentage: number;
  therapeuticHoursThisWeek: number;
  modelAdherenceRate: number;
  childMetrics: ChildWellbeingSummary[];
  issues: string[];
  warnings: string[];
}

export interface ChildWellbeingSummary {
  childId: string;
  childName: string;
  overallWellbeing: number;
  trend: "improving" | "stable" | "declining";
  mentalHealthStatus: MentalHealthStatus;
  activeInterventions: number;
  emotionalRegulationLevel: EmotionalRegulationLevel;
  camhsStatus: ReferralStatus;
  lastCrisisDate?: string;
  daysStable: number;
}

// ── Engine Functions ─────────────────────────────────────────────────────────

/**
 * Evaluate therapeutic compliance for a home
 */
export function evaluateTherapeuticCompliance(
  profiles: ChildTherapeuticProfile[],
  config: HomeTherapeuticConfig,
  now: string
): TherapeuticComplianceResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  const nowDate = new Date(now);

  // 1. Model adherence — staff training percentage
  const staffTrainingScore = Math.min(100, Math.round(config.trainedStaffPercentage * 1.25));
  if (config.trainedStaffPercentage < 80) {
    issues.push(`Only ${config.trainedStaffPercentage}% of staff trained in ${getModelLabel(config.primaryTherapeuticModel)} — minimum 80% required`);
  } else if (config.trainedStaffPercentage < 90) {
    warnings.push(`Staff training at ${config.trainedStaffPercentage}% — target 90%+ for model fidelity`);
  }

  // 2. Model adherence — consultation currency
  let modelAdherenceScore = staffTrainingScore;
  if (config.lastConsultation) {
    const daysSinceConsultation = daysBetween(config.lastConsultation, now);
    if (daysSinceConsultation > 90) {
      issues.push("Therapeutic consultation overdue (>90 days)");
      modelAdherenceScore = Math.max(0, modelAdherenceScore - 20);
    } else if (daysSinceConsultation > 60) {
      warnings.push("Therapeutic consultation approaching overdue");
      modelAdherenceScore = Math.max(0, modelAdherenceScore - 10);
    }
  }

  // 3. Reflective practice currency
  if (config.lastReflectivePractice) {
    const daysSinceReflective = daysBetween(config.lastReflectivePractice, now);
    if (daysSinceReflective > 30) {
      warnings.push("Reflective practice overdue (>30 days)");
      modelAdherenceScore = Math.max(0, modelAdherenceScore - 5);
    }
  }

  // 4. Intervention coverage
  const childrenWithActiveInterventions = profiles.filter(
    (p) => p.interventions.some((i) => i.active)
  ).length;
  const childrenWithoutSupport: string[] = [];
  profiles.forEach((p) => {
    if (!p.interventions.some((i) => i.active) && p.mentalHealthStatus !== "stable") {
      childrenWithoutSupport.push(p.childName);
    }
  });
  if (childrenWithoutSupport.length > 0) {
    issues.push(`${childrenWithoutSupport.length} child(ren) need therapeutic support but have no active intervention: ${childrenWithoutSupport.join(", ")}`);
  }
  const interventionCoverageScore = profiles.length > 0
    ? Math.round(((profiles.length - childrenWithoutSupport.length) / profiles.length) * 100)
    : 100;

  // 5. Wellbeing progress
  let totalWellbeing = 0;
  let wellbeingCount = 0;
  const childrenDeclining: string[] = [];
  profiles.forEach((p) => {
    const avgScore = p.wellbeingScores.length > 0
      ? p.wellbeingScores.reduce((sum, w) => sum + w.score, 0) / p.wellbeingScores.length
      : 0;
    totalWellbeing += avgScore;
    wellbeingCount++;
    const decliningDomains = p.wellbeingScores.filter((w) => w.trend === "declining");
    if (decliningDomains.length >= 3) {
      childrenDeclining.push(p.childName);
    }
  });
  const averageWellbeingScore = wellbeingCount > 0
    ? Math.round(totalWellbeing / wellbeingCount)
    : 0;
  const wellbeingProgressScore = Math.min(100, averageWellbeingScore);
  if (childrenDeclining.length > 0) {
    issues.push(`${childrenDeclining.length} child(ren) declining across 3+ wellbeing domains: ${childrenDeclining.join(", ")}`);
  }

  // 6. Crisis management
  const childrenInCrisis: string[] = [];
  let totalCrisisEvents = 0;
  let followUpCompleted = 0;
  let totalFollowUps = 0;
  profiles.forEach((p) => {
    if (p.mentalHealthStatus === "crisis") {
      childrenInCrisis.push(p.childName);
    }
    const recentCrises = p.crisisEvents.filter((c) => daysBetween(c.date, now) <= 30);
    totalCrisisEvents += recentCrises.length;
    recentCrises.forEach((c) => {
      totalFollowUps++;
      if (c.followUpCompleted) followUpCompleted++;
    });
  });
  if (childrenInCrisis.length > 0) {
    issues.push(`${childrenInCrisis.length} child(ren) currently in crisis: ${childrenInCrisis.join(", ")}`);
  }
  const crisisFollowUpRate = totalFollowUps > 0
    ? Math.round((followUpCompleted / totalFollowUps) * 100)
    : 100;
  if (crisisFollowUpRate < 100 && totalFollowUps > 0) {
    issues.push(`Crisis follow-up completion at ${crisisFollowUpRate}% — must be 100%`);
  }
  const crisisManagementScore = totalFollowUps > 0
    ? Math.min(100, crisisFollowUpRate)
    : 100;

  // 7. SDQ overdue check
  const sdqOverdue: string[] = [];
  const sdqMaxDays = config.sdqFrequency === "quarterly" ? 90 : config.sdqFrequency === "biannual" ? 180 : 365;
  profiles.forEach((p) => {
    if (p.sdqDate) {
      if (daysBetween(p.sdqDate, now) > sdqMaxDays) {
        sdqOverdue.push(p.childName);
      }
    } else {
      sdqOverdue.push(p.childName);
    }
  });
  if (sdqOverdue.length > 0) {
    warnings.push(`SDQ overdue for: ${sdqOverdue.join(", ")}`);
  }

  // 8. Wellbeing review overdue
  const wellbeingReviewOverdue: string[] = [];
  const reviewMaxDays = config.wellbeingReviewFrequency === "monthly" ? 35 : 100;
  profiles.forEach((p) => {
    if (p.lastTherapeuticReview && daysBetween(p.lastTherapeuticReview, now) > reviewMaxDays) {
      wellbeingReviewOverdue.push(p.childName);
    }
  });
  if (wellbeingReviewOverdue.length > 0) {
    warnings.push(`Therapeutic review overdue for: ${wellbeingReviewOverdue.join(", ")}`);
  }

  // 9. CAMHS waiting list
  const camhsWaitingList = profiles
    .filter((p) => p.camhsReferral.status === "on_waiting_list")
    .map((p) => p.childName);
  if (camhsWaitingList.length > 0) {
    warnings.push(`${camhsWaitingList.length} child(ren) on CAMHS waiting list: ${camhsWaitingList.join(", ")}`);
  }

  // 10. Therapeutic review overdue
  const therapeuticReviewOverdue: string[] = [];
  profiles.forEach((p) => {
    if (p.nextTherapeuticReview && new Date(p.nextTherapeuticReview) < nowDate) {
      therapeuticReviewOverdue.push(p.childName);
    }
  });
  if (therapeuticReviewOverdue.length > 0) {
    issues.push(`Therapeutic review overdue for: ${therapeuticReviewOverdue.join(", ")}`);
  }

  // Overall score
  const overallScore = Math.round(
    modelAdherenceScore * 0.2 +
    staffTrainingScore * 0.15 +
    interventionCoverageScore * 0.25 +
    wellbeingProgressScore * 0.25 +
    crisisManagementScore * 0.15
  );

  const isCompliant = issues.length === 0 && overallScore >= 70;

  return {
    isCompliant,
    overallScore,
    issues,
    warnings,
    modelAdherenceScore,
    staffTrainingScore,
    interventionCoverageScore,
    wellbeingProgressScore,
    crisisManagementScore,
    childrenWithActiveInterventions,
    childrenWithoutSupport,
    childrenInCrisis,
    childrenDeclining,
    averageWellbeingScore,
    sdqOverdue,
    wellbeingReviewOverdue,
    camhsWaitingList,
    therapeuticReviewOverdue,
  };
}

/**
 * Calculate home-level therapeutic metrics
 */
export function calculateHomeTherapeuticMetrics(
  profiles: ChildTherapeuticProfile[],
  config: HomeTherapeuticConfig,
  now: string
): HomeTherapeuticMetrics {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Overall wellbeing
  let totalWellbeing = 0;
  let wellbeingCount = 0;
  profiles.forEach((p) => {
    if (p.wellbeingScores.length > 0) {
      const avg = p.wellbeingScores.reduce((sum, w) => sum + w.score, 0) / p.wellbeingScores.length;
      totalWellbeing += avg;
      wellbeingCount++;
    }
  });
  const overallWellbeingScore = wellbeingCount > 0
    ? Math.round(totalWellbeing / wellbeingCount)
    : 0;

  // Interventions
  const allActiveInterventions = profiles.flatMap((p) => p.interventions.filter((i) => i.active));
  const totalActiveInterventions = allActiveInterventions.length;
  const totalAttended = allActiveInterventions.reduce((sum, i) => sum + i.sessionsAttended, 0);
  const totalSessions = allActiveInterventions.reduce((sum, i) => sum + i.sessionsAttended + i.sessionsMissed, 0);
  const interventionAttendanceRate = totalSessions > 0
    ? Math.round((totalAttended / totalSessions) * 100)
    : 100;
  const averageEffectiveness = allActiveInterventions.length > 0
    ? Math.round(allActiveInterventions.reduce((sum, i) => sum + i.effectiveness, 0) / allActiveInterventions.length)
    : 0;

  if (interventionAttendanceRate < 80) {
    warnings.push(`Intervention attendance rate at ${interventionAttendanceRate}% — below 80% target`);
  }

  // Status counts
  let childrenImproving = 0;
  let childrenStable = 0;
  let childrenDeclining = 0;
  let childrenInCrisis = 0;
  profiles.forEach((p) => {
    switch (p.mentalHealthStatus) {
      case "improving": childrenImproving++; break;
      case "stable": childrenStable++; break;
      case "declining": childrenDeclining++; break;
      case "crisis": childrenInCrisis++; break;
      case "monitoring": childrenStable++; break;
    }
  });

  if (childrenInCrisis > 0) {
    issues.push(`${childrenInCrisis} child(ren) currently in mental health crisis`);
  }
  if (childrenDeclining > 0) {
    warnings.push(`${childrenDeclining} child(ren) with declining mental health status`);
  }

  // Crisis events this month
  const crisisEventsThisMonth = profiles.flatMap((p) =>
    p.crisisEvents.filter((c) => daysBetween(c.date, now) <= 30)
  );
  const avgDeEscalation = crisisEventsThisMonth.length > 0
    ? Math.round(crisisEventsThisMonth.reduce((sum, c) => sum + c.deEscalationTime, 0) / crisisEventsThisMonth.length)
    : 0;

  // CAMHS
  const camhsActiveCount = profiles.filter((p) => p.camhsReferral.status === "active_treatment").length;
  const camhsWaitingCount = profiles.filter((p) => p.camhsReferral.status === "on_waiting_list").length;

  // SDQ average
  const sdqScores = profiles.filter((p) => p.sdqScore !== undefined).map((p) => p.sdqScore!);
  const sdqAverageScore = sdqScores.length > 0
    ? Math.round(sdqScores.reduce((a, b) => a + b, 0) / sdqScores.length)
    : 0;

  // Therapeutic hours (estimate from active interventions)
  const weeklyHours = allActiveInterventions.reduce((sum, i) => {
    if (i.frequency === "daily") return sum + 5;
    if (i.frequency === "twice_weekly") return sum + 2;
    if (i.frequency === "weekly") return sum + 1;
    if (i.frequency === "fortnightly") return sum + 0.5;
    return sum + 1;
  }, 0);

  if (weeklyHours < config.minimumTherapeuticHoursPerWeek) {
    warnings.push(`Therapeutic hours (${weeklyHours}) below minimum target (${config.minimumTherapeuticHoursPerWeek})`);
  }

  // Model adherence
  const childrenUsingPrimaryModel = profiles.filter(
    (p) => p.primaryModel === config.primaryTherapeuticModel || p.secondaryModels.includes(config.primaryTherapeuticModel)
  ).length;
  const modelAdherenceRate = profiles.length > 0
    ? Math.round((childrenUsingPrimaryModel / profiles.length) * 100)
    : 100;

  // Child summaries
  const childMetrics: ChildWellbeingSummary[] = profiles.map((p) => {
    const avgWellbeing = p.wellbeingScores.length > 0
      ? Math.round(p.wellbeingScores.reduce((sum, w) => sum + w.score, 0) / p.wellbeingScores.length)
      : 0;
    const improvingCount = p.wellbeingScores.filter((w) => w.trend === "improving").length;
    const decliningCount = p.wellbeingScores.filter((w) => w.trend === "declining").length;
    const trend: "improving" | "stable" | "declining" =
      improvingCount > decliningCount ? "improving" :
      decliningCount > improvingCount ? "declining" : "stable";

    const lastCrisis = p.crisisEvents.length > 0
      ? p.crisisEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
      : undefined;
    const daysStable = lastCrisis ? daysBetween(lastCrisis, now) : 999;

    return {
      childId: p.childId,
      childName: p.childName,
      overallWellbeing: avgWellbeing,
      trend,
      mentalHealthStatus: p.mentalHealthStatus,
      activeInterventions: p.interventions.filter((i) => i.active).length,
      emotionalRegulationLevel: p.emotionalRegulationLevel,
      camhsStatus: p.camhsReferral.status,
      lastCrisisDate: lastCrisis,
      daysStable: Math.min(daysStable, 999),
    };
  });

  return {
    overallWellbeingScore,
    totalActiveInterventions,
    interventionAttendanceRate,
    averageEffectiveness,
    childrenImproving,
    childrenStable,
    childrenDeclining,
    childrenInCrisis,
    crisisEventsThisMonth: crisisEventsThisMonth.length,
    averageDeEscalationTime: avgDeEscalation,
    camhsActiveCount,
    camhsWaitingCount,
    sdqAverageScore,
    staffTrainingPercentage: config.trainedStaffPercentage,
    therapeuticHoursThisWeek: weeklyHours,
    modelAdherenceRate,
    childMetrics,
    issues,
    warnings,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getModelLabel(model: TherapeuticModel): string {
  const labels: Record<TherapeuticModel, string> = {
    dyadic_developmental_psychotherapy: "Dyadic Developmental Psychotherapy (DDP)",
    pace: "PACE (Playfulness, Acceptance, Curiosity, Empathy)",
    theraplay: "Theraplay",
    cbt: "Cognitive Behavioural Therapy (CBT)",
    emdr: "Eye Movement Desensitisation & Reprocessing (EMDR)",
    art_therapy: "Art Therapy",
    play_therapy: "Play Therapy",
    systemic_family_therapy: "Systemic Family Therapy",
    dialectical_behaviour_therapy: "Dialectical Behaviour Therapy (DBT)",
    trauma_focused_cbt: "Trauma-Focused CBT (TF-CBT)",
    sensory_integration: "Sensory Integration Therapy",
    narrative_therapy: "Narrative Therapy",
    other: "Other",
  };
  return labels[model] ?? model;
}

export function getWellbeingDomainLabel(domain: WellbeingDomain): string {
  const labels: Record<WellbeingDomain, string> = {
    emotional_regulation: "Emotional Regulation",
    attachment_security: "Attachment Security",
    self_esteem: "Self-Esteem",
    peer_relationships: "Peer Relationships",
    trauma_recovery: "Trauma Recovery",
    anxiety_management: "Anxiety Management",
    resilience: "Resilience",
    identity: "Identity & Self-Worth",
  };
  return labels[domain] ?? domain;
}

export function getRegulationLevelLabel(level: EmotionalRegulationLevel): string {
  const labels: Record<EmotionalRegulationLevel, string> = {
    emerging: "Emerging",
    developing: "Developing",
    established: "Established",
    secure: "Secure",
  };
  return labels[level] ?? level;
}

function daysBetween(dateStr: string, nowStr: string): number {
  const d1 = new Date(dateStr).getTime();
  const d2 = new Date(nowStr).getTime();
  return Math.floor(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
}
