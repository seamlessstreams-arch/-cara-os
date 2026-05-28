// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF SUPERVISION & REFLECTIVE PRACTICE INTELLIGENCE ENGINE
// Monitors the quality and compliance of staff supervision, reflective practice,
// and professional development oversight. Tracks supervision timeliness, quality,
// theme coverage, safeguarding supervision, and reflective practice engagement.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 33 (Registered person — general requirements), Reg 32 (Fitness of workers).
// SCCIF: "Leadership and management — supervision and support".
// Store keys: supervisions, staffReflectionRecords, safeguardingSupervisionRecords,
//             staffSupervisionThemeRecords, supervisionMatrixRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface SupervisionInput {
  id: string;
  staff_id: string;
  supervision_date: string;
  supervisor_id: string;
  type: "formal" | "informal" | "group";
  duration_minutes: number;
  quality_rating: number; // 1-5
  actions_identified: number;
  actions_completed: number;
  wellbeing_discussed: boolean;
  professional_development_discussed: boolean;
  child_focused_topics_discussed: boolean;
  created_at: string;
}

export interface StaffReflectionInput {
  id: string;
  staff_id: string;
  reflection_date: string;
  reflection_type: "individual" | "group" | "peer";
  topic: string;
  learning_identified: boolean;
  action_planned: boolean;
  shared_with_team: boolean;
  created_at: string;
}

export interface SafeguardingSupervisionInput {
  id: string;
  staff_id: string;
  date: string;
  supervisor_id: string;
  cases_discussed: number;
  concerns_raised: number;
  actions_identified: number;
  actions_completed: number;
  competence_assessed: boolean;
  created_at: string;
}

export interface SupervisionThemeInput {
  id: string;
  supervision_id: string;
  theme:
    | "safeguarding"
    | "behaviour_management"
    | "therapeutic_care"
    | "health_wellbeing"
    | "education"
    | "diversity"
    | "practice_standards"
    | "professional_development";
  discussed: boolean;
  created_at: string;
}

export interface SupervisionMatrixInput {
  id: string;
  staff_id: string;
  frequency_weeks: number;
  last_supervision_date: string;
  next_due_date: string;
  overdue: boolean;
  created_at: string;
}

export interface StaffSupervisionReflectivePracticeInput {
  today: string;
  total_staff: number;
  supervisions: SupervisionInput[];
  staff_reflections: StaffReflectionInput[];
  safeguarding_supervisions: SafeguardingSupervisionInput[];
  supervision_themes: SupervisionThemeInput[];
  supervision_matrix: SupervisionMatrixInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SupervisionRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SupervisionInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface SupervisionRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface StaffSupervisionReflectivePracticeResult {
  supervision_rating: SupervisionRating;
  supervision_score: number;
  headline: string;
  total_supervisions: number;
  supervision_timeliness_rate: number;
  supervision_quality_avg: number;
  safeguarding_supervision_coverage_rate: number;
  reflective_practice_engagement_rate: number;
  theme_coverage_breadth: number;
  action_completion_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: SupervisionRecommendation[];
  insights: SupervisionInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): SupervisionRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: SupervisionRating,
  score: number,
  headline: string,
): StaffSupervisionReflectivePracticeResult {
  return {
    supervision_rating: rating,
    supervision_score: score,
    headline,
    total_supervisions: 0,
    supervision_timeliness_rate: 0,
    supervision_quality_avg: 0,
    safeguarding_supervision_coverage_rate: 0,
    reflective_practice_engagement_rate: 0,
    theme_coverage_breadth: 0,
    action_completion_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeStaffSupervisionReflectivePractice(
  input: StaffSupervisionReflectivePracticeInput,
): StaffSupervisionReflectivePracticeResult {
  const {
    today,
    total_staff,
    supervisions,
    staff_reflections,
    safeguarding_supervisions,
    supervision_themes,
    supervision_matrix,
  } = input;

  // ── Special case: all empty + 0 staff → insufficient_data ──────────
  const allEmpty =
    supervisions.length === 0 &&
    staff_reflections.length === 0 &&
    safeguarding_supervisions.length === 0 &&
    supervision_themes.length === 0 &&
    supervision_matrix.length === 0;

  if (allEmpty && total_staff === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No staff on site — insufficient data to assess supervision and reflective practice oversight.",
    );
  }

  // ── Special case: all empty + staff > 0 → inadequate ───────────────
  if (allEmpty && total_staff > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No supervision or reflective practice data recorded despite staff being in post — supervision oversight requires urgent attention.",
      ),
      concerns: [
        "No supervision sessions, reflective practice records, safeguarding supervisions, theme tracking, or supervision matrix entries exist despite staff being employed — the home cannot evidence that staff are being supervised, supported, or developed.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Immediately establish formal supervision scheduling for all staff members — statutory supervision is a core requirement under Reg 33 and Reg 32. Without evidence of supervision, Ofsted cannot be satisfied that staff are fit and supported.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 33 — General requirements",
        },
        {
          rank: 2,
          recommendation:
            "Implement a supervision matrix that assigns every staff member a named supervisor, a defined frequency, and a scheduled next session. Begin recording supervision sessions immediately.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 32 — Fitness of workers",
        },
      ],
      insights: [
        {
          text: "The complete absence of supervision records means Ofsted cannot verify that staff are receiving regular oversight, safeguarding supervision, or professional development support. This is a fundamental failure in leadership and management under Reg 33 and Reg 32.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Supervision timeliness ---
  // Staff with at least one supervision whose matrix entry is NOT overdue
  const totalMatrixEntries = supervision_matrix.length;
  const overdueEntries = supervision_matrix.filter((m) => m.overdue).length;
  const onTimeEntries = totalMatrixEntries - overdueEntries;
  const supervisionTimelinessRate = pct(onTimeEntries, totalMatrixEntries);

  // --- Supervision quality ---
  const totalSupervisions = supervisions.length;
  const qualitySum = supervisions.reduce((sum, s) => sum + s.quality_rating, 0);
  const supervisionQualityAvg =
    totalSupervisions > 0
      ? Math.round((qualitySum / totalSupervisions) * 10) / 10
      : 0;

  // --- Safeguarding supervision coverage ---
  // Unique staff who have received at least one safeguarding supervision
  const staffWithSafeguardingSupervision = new Set(
    safeguarding_supervisions.map((s) => s.staff_id),
  ).size;
  const safeguardingSupervisionCoverageRate = pct(
    staffWithSafeguardingSupervision,
    total_staff,
  );

  // --- Reflective practice engagement ---
  // Unique staff who have at least one reflective practice record
  const staffWithReflection = new Set(
    staff_reflections.map((r) => r.staff_id),
  ).size;
  const reflectivePracticeEngagementRate = pct(staffWithReflection, total_staff);

  // --- Theme coverage breadth ---
  // Count of unique themes discussed (out of 8 possible)
  const ALL_THEMES: SupervisionThemeInput["theme"][] = [
    "safeguarding",
    "behaviour_management",
    "therapeutic_care",
    "health_wellbeing",
    "education",
    "diversity",
    "practice_standards",
    "professional_development",
  ];
  const discussedThemes = new Set<SupervisionThemeInput["theme"]>(
    supervision_themes.filter((t) => t.discussed).map((t) => t.theme),
  );
  const themeCoverageBreadth = discussedThemes.size;

  // --- Action completion rate ---
  const totalActionsIdentified = supervisions.reduce(
    (sum, s) => sum + s.actions_identified,
    0,
  );
  const totalActionsCompleted = supervisions.reduce(
    (sum, s) => sum + s.actions_completed,
    0,
  );
  const sgTotalActionsIdentified = safeguarding_supervisions.reduce(
    (sum, s) => sum + s.actions_identified,
    0,
  );
  const sgTotalActionsCompleted = safeguarding_supervisions.reduce(
    (sum, s) => sum + s.actions_completed,
    0,
  );
  const combinedActionsIdentified =
    totalActionsIdentified + sgTotalActionsIdentified;
  const combinedActionsCompleted =
    totalActionsCompleted + sgTotalActionsCompleted;
  const actionCompletionRate = pct(
    combinedActionsCompleted,
    combinedActionsIdentified,
  );

  // --- Staff wellbeing discussion rate ---
  const supervisionsWithWellbeing = supervisions.filter(
    (s) => s.wellbeing_discussed,
  ).length;
  const staffWellbeingDiscussionRate = pct(
    supervisionsWithWellbeing,
    totalSupervisions,
  );

  // --- Professional development discussion rate ---
  const supervisionsWithPD = supervisions.filter(
    (s) => s.professional_development_discussed,
  ).length;
  const professionalDevelopmentDiscussionRate = pct(
    supervisionsWithPD,
    totalSupervisions,
  );

  // --- Matrix compliance rate ---
  // Percentage of staff who have a matrix entry and are not overdue
  const staffInMatrix = new Set(supervision_matrix.map((m) => m.staff_id)).size;
  const matrixComplianceRate = pct(staffInMatrix, total_staff);

  // --- Reflective practice with learning identified ---
  const reflectionsWithLearning = staff_reflections.filter(
    (r) => r.learning_identified,
  ).length;
  const reflectiveLearningRate = pct(
    reflectionsWithLearning,
    staff_reflections.length,
  );

  // --- Reflective practice shared with team ---
  const reflectionsShared = staff_reflections.filter(
    (r) => r.shared_with_team,
  ).length;
  const reflectiveSharingRate = pct(reflectionsShared, staff_reflections.length);

  // --- Safeguarding competence assessment rate ---
  const sgCompetenceAssessed = safeguarding_supervisions.filter(
    (s) => s.competence_assessed,
  ).length;
  const sgCompetenceRate = pct(
    sgCompetenceAssessed,
    safeguarding_supervisions.length,
  );

  // --- Child-focused topics discussed ---
  const supervisionsWithChildFocus = supervisions.filter(
    (s) => s.child_focused_topics_discussed,
  ).length;
  const childFocusedRate = pct(supervisionsWithChildFocus, totalSupervisions);

  // --- Unique staff supervised ---
  const staffWithSupervision = new Set(
    supervisions.map((s) => s.staff_id),
  ).size;
  const supervisionCoverageRate = pct(staffWithSupervision, total_staff);

  // ── Scoring: base 52 ─────────────────────────────────────────────────
  // Bonuses sum to exactly 28: 4+3+3+3+3+3+3+3+3 = 28

  let score = 52;

  // --- Bonus 1: supervisionTimelinessRate (>=90: +4, >=75: +2) ---
  if (supervisionTimelinessRate >= 90) score += 4;
  else if (supervisionTimelinessRate >= 75) score += 2;

  // --- Bonus 2: supervisionQualityAvg (>=4.0: +3, >=3.0: +1) ---
  if (supervisionQualityAvg >= 4.0) score += 3;
  else if (supervisionQualityAvg >= 3.0) score += 1;

  // --- Bonus 3: safeguardingSupervisionCoverageRate (>=100: +3, >=80: +1) ---
  if (safeguardingSupervisionCoverageRate >= 100) score += 3;
  else if (safeguardingSupervisionCoverageRate >= 80) score += 1;

  // --- Bonus 4: reflectivePracticeEngagementRate (>=80: +3, >=60: +1) ---
  if (reflectivePracticeEngagementRate >= 80) score += 3;
  else if (reflectivePracticeEngagementRate >= 60) score += 1;

  // --- Bonus 5: themeCoverageBreadth (>=6: +3, >=4: +1) ---
  if (themeCoverageBreadth >= 6) score += 3;
  else if (themeCoverageBreadth >= 4) score += 1;

  // --- Bonus 6: actionCompletionRate (>=90: +3, >=70: +1) ---
  if (actionCompletionRate >= 90) score += 3;
  else if (actionCompletionRate >= 70) score += 1;

  // --- Bonus 7: staffWellbeingDiscussionRate (>=90: +3, >=70: +1) ---
  if (staffWellbeingDiscussionRate >= 90) score += 3;
  else if (staffWellbeingDiscussionRate >= 70) score += 1;

  // --- Bonus 8: professionalDevelopmentDiscussionRate (>=80: +3, >=60: +1) ---
  if (professionalDevelopmentDiscussionRate >= 80) score += 3;
  else if (professionalDevelopmentDiscussionRate >= 60) score += 1;

  // --- Bonus 9: matrixComplianceRate (>=90: +3, >=75: +1) ---
  if (matrixComplianceRate >= 90) score += 3;
  else if (matrixComplianceRate >= 75) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // supervisionCoverageRate < 50 → -5 (most staff unsupervised)
  if (supervisionCoverageRate < 50 && total_staff > 0) score -= 5;

  // safeguardingSupervisionCoverageRate < 30 → -5 (safeguarding gap)
  if (safeguardingSupervisionCoverageRate < 30 && total_staff > 0) score -= 5;

  // actionCompletionRate < 40 → -4 (actions not followed through)
  if (actionCompletionRate < 40 && combinedActionsIdentified > 0) score -= 4;

  // overdueEntries > 50% of matrix → -4 (systemic scheduling failure)
  if (totalMatrixEntries > 0 && pct(overdueEntries, totalMatrixEntries) > 50) score -= 4;

  score = clamp(score, 0, 100);

  const supervision_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (supervisionTimelinessRate >= 90 && totalMatrixEntries > 0) {
    strengths.push(
      `${supervisionTimelinessRate}% of supervisions delivered on schedule — the home demonstrates strong compliance with supervision timelines, ensuring staff receive regular, predictable oversight.`,
    );
  } else if (supervisionTimelinessRate >= 75 && totalMatrixEntries > 0) {
    strengths.push(
      `${supervisionTimelinessRate}% supervision timeliness — most staff receive supervision within their scheduled window.`,
    );
  }

  if (supervisionQualityAvg >= 4.0 && totalSupervisions > 0) {
    strengths.push(
      `Average supervision quality rating of ${supervisionQualityAvg}/5.0 — supervisions are consistently high quality, indicating meaningful, reflective, and developmental sessions.`,
    );
  } else if (supervisionQualityAvg >= 3.0 && totalSupervisions > 0) {
    strengths.push(
      `Average supervision quality rating of ${supervisionQualityAvg}/5.0 — supervision sessions are of a satisfactory standard.`,
    );
  }

  if (safeguardingSupervisionCoverageRate >= 100 && total_staff > 0) {
    strengths.push(
      "Every staff member has received safeguarding supervision — the home ensures all staff receive specialist oversight on safeguarding matters.",
    );
  } else if (safeguardingSupervisionCoverageRate >= 80 && total_staff > 0) {
    strengths.push(
      `${safeguardingSupervisionCoverageRate}% of staff have received safeguarding supervision — strong coverage of safeguarding-specific oversight.`,
    );
  }

  if (reflectivePracticeEngagementRate >= 80 && total_staff > 0) {
    strengths.push(
      `${reflectivePracticeEngagementRate}% of staff actively engaged in reflective practice — the home fosters a strong culture of professional reflection and continuous learning.`,
    );
  } else if (reflectivePracticeEngagementRate >= 60 && total_staff > 0) {
    strengths.push(
      `${reflectivePracticeEngagementRate}% reflective practice engagement — a majority of staff are participating in reflective practice activities.`,
    );
  }

  if (themeCoverageBreadth >= 6) {
    strengths.push(
      `${themeCoverageBreadth} out of 8 supervision theme areas covered — supervision discussions demonstrate breadth, addressing multiple aspects of practice including safeguarding, behaviour management, and professional development.`,
    );
  } else if (themeCoverageBreadth >= 4) {
    strengths.push(
      `${themeCoverageBreadth} supervision theme areas covered — supervision sessions address a reasonable range of practice topics.`,
    );
  }

  if (actionCompletionRate >= 90 && combinedActionsIdentified > 0) {
    strengths.push(
      `${actionCompletionRate}% of supervision actions completed — the home demonstrates excellent follow-through on agreed actions, ensuring supervision leads to meaningful practice change.`,
    );
  } else if (actionCompletionRate >= 70 && combinedActionsIdentified > 0) {
    strengths.push(
      `${actionCompletionRate}% supervision action completion — most agreed actions are being followed through.`,
    );
  }

  if (staffWellbeingDiscussionRate >= 90 && totalSupervisions > 0) {
    strengths.push(
      `Staff wellbeing discussed in ${staffWellbeingDiscussionRate}% of supervisions — the home prioritises staff welfare as an integral part of supervision, recognising the emotional demands of residential care work.`,
    );
  } else if (staffWellbeingDiscussionRate >= 70 && totalSupervisions > 0) {
    strengths.push(
      `Staff wellbeing discussed in ${staffWellbeingDiscussionRate}% of supervisions — wellbeing is a regular feature of supervision discussions.`,
    );
  }

  if (professionalDevelopmentDiscussionRate >= 80 && totalSupervisions > 0) {
    strengths.push(
      `Professional development discussed in ${professionalDevelopmentDiscussionRate}% of supervisions — the home actively supports staff growth and career progression through supervision.`,
    );
  } else if (professionalDevelopmentDiscussionRate >= 60 && totalSupervisions > 0) {
    strengths.push(
      `Professional development discussed in ${professionalDevelopmentDiscussionRate}% of supervisions — development conversations are a regular part of supervision.`,
    );
  }

  if (matrixComplianceRate >= 90 && total_staff > 0) {
    strengths.push(
      `${matrixComplianceRate}% of staff included in the supervision matrix — the home has a comprehensive supervision scheduling system covering virtually all staff.`,
    );
  } else if (matrixComplianceRate >= 75 && total_staff > 0) {
    strengths.push(
      `${matrixComplianceRate}% supervision matrix coverage — most staff are assigned within the supervision scheduling framework.`,
    );
  }

  if (supervisionCoverageRate >= 100 && total_staff > 0) {
    strengths.push(
      "Every staff member has received at least one supervision — full supervision coverage across the team.",
    );
  } else if (supervisionCoverageRate >= 80 && total_staff > 0) {
    strengths.push(
      `${supervisionCoverageRate}% of staff have received supervision — strong coverage across the workforce.`,
    );
  }

  if (sgCompetenceRate >= 90 && safeguarding_supervisions.length > 0) {
    strengths.push(
      `Safeguarding competence assessed in ${sgCompetenceRate}% of safeguarding supervisions — the home systematically evaluates staff safeguarding capability.`,
    );
  }

  if (reflectiveLearningRate >= 80 && staff_reflections.length > 0) {
    strengths.push(
      `${reflectiveLearningRate}% of reflective practice entries identify specific learning — staff are using reflection as a genuine tool for professional growth.`,
    );
  }

  if (reflectiveSharingRate >= 70 && staff_reflections.length > 0) {
    strengths.push(
      `${reflectiveSharingRate}% of reflective practice entries shared with the team — the home encourages a culture of collective learning from individual reflections.`,
    );
  }

  if (childFocusedRate >= 80 && totalSupervisions > 0) {
    strengths.push(
      `Child-focused topics discussed in ${childFocusedRate}% of supervisions — supervision consistently centres on children's needs, ensuring staff practice remains child-focused.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (supervisionCoverageRate < 50 && total_staff > 0) {
    concerns.push(
      `Only ${supervisionCoverageRate}% of staff have received supervision — the majority of the workforce lacks formal supervision, representing a significant compliance failure under Reg 33 and Reg 32.`,
    );
  } else if (supervisionCoverageRate < 80 && supervisionCoverageRate >= 50 && total_staff > 0) {
    concerns.push(
      `Supervision coverage at ${supervisionCoverageRate}% — not all staff are receiving regular supervision, which may leave gaps in oversight and support.`,
    );
  }

  if (supervisionTimelinessRate < 50 && totalMatrixEntries > 0) {
    concerns.push(
      `Only ${supervisionTimelinessRate}% of supervisions delivered on time — the majority of scheduled supervisions are overdue, indicating a systemic scheduling or prioritisation problem.`,
    );
  } else if (supervisionTimelinessRate < 75 && supervisionTimelinessRate >= 50 && totalMatrixEntries > 0) {
    concerns.push(
      `Supervision timeliness at ${supervisionTimelinessRate}% — a notable proportion of supervisions are being delivered late.`,
    );
  }

  if (supervisionQualityAvg < 2.5 && totalSupervisions > 0) {
    concerns.push(
      `Average supervision quality rating of ${supervisionQualityAvg}/5.0 — supervision quality is poor, suggesting sessions lack depth, structure, or meaningful engagement.`,
    );
  } else if (supervisionQualityAvg < 3.0 && supervisionQualityAvg >= 2.5 && totalSupervisions > 0) {
    concerns.push(
      `Average supervision quality rating of ${supervisionQualityAvg}/5.0 — supervision quality is below the expected standard and needs improvement.`,
    );
  }

  if (safeguardingSupervisionCoverageRate < 30 && total_staff > 0) {
    concerns.push(
      `Only ${safeguardingSupervisionCoverageRate}% of staff have received safeguarding supervision — the vast majority of staff lack specialist safeguarding oversight, which is a serious gap in the home's safeguarding framework.`,
    );
  } else if (safeguardingSupervisionCoverageRate < 80 && safeguardingSupervisionCoverageRate >= 30 && total_staff > 0) {
    concerns.push(
      `Safeguarding supervision coverage at ${safeguardingSupervisionCoverageRate}% — not all staff are receiving specialist safeguarding oversight.`,
    );
  }

  if (reflectivePracticeEngagementRate < 30 && total_staff > 0) {
    concerns.push(
      `Only ${reflectivePracticeEngagementRate}% of staff engaged in reflective practice — the home is not fostering a culture of professional reflection, which limits learning from practice.`,
    );
  } else if (reflectivePracticeEngagementRate < 60 && reflectivePracticeEngagementRate >= 30 && total_staff > 0) {
    concerns.push(
      `Reflective practice engagement at ${reflectivePracticeEngagementRate}% — a significant proportion of staff are not participating in reflective practice activities.`,
    );
  }

  if (actionCompletionRate < 40 && combinedActionsIdentified > 0) {
    concerns.push(
      `Only ${actionCompletionRate}% of supervision actions completed — the majority of agreed actions remain outstanding, undermining the purpose of supervision entirely.`,
    );
  } else if (actionCompletionRate < 70 && actionCompletionRate >= 40 && combinedActionsIdentified > 0) {
    concerns.push(
      `Supervision action completion at ${actionCompletionRate}% — a notable proportion of agreed actions are not being followed through.`,
    );
  }

  if (staffWellbeingDiscussionRate < 50 && totalSupervisions > 0) {
    concerns.push(
      `Staff wellbeing discussed in only ${staffWellbeingDiscussionRate}% of supervisions — the emotional needs of staff working in a demanding care environment are not being systematically addressed.`,
    );
  } else if (staffWellbeingDiscussionRate < 70 && staffWellbeingDiscussionRate >= 50 && totalSupervisions > 0) {
    concerns.push(
      `Staff wellbeing discussed in ${staffWellbeingDiscussionRate}% of supervisions — wellbeing is not consistently addressed in supervision.`,
    );
  }

  if (professionalDevelopmentDiscussionRate < 40 && totalSupervisions > 0) {
    concerns.push(
      `Professional development discussed in only ${professionalDevelopmentDiscussionRate}% of supervisions — staff development is not being prioritised within supervision, limiting professional growth.`,
    );
  } else if (professionalDevelopmentDiscussionRate < 60 && professionalDevelopmentDiscussionRate >= 40 && totalSupervisions > 0) {
    concerns.push(
      `Professional development discussed in ${professionalDevelopmentDiscussionRate}% of supervisions — development conversations are not a consistent feature of supervision.`,
    );
  }

  if (themeCoverageBreadth < 3 && supervision_themes.length > 0) {
    concerns.push(
      `Only ${themeCoverageBreadth} supervision theme area${themeCoverageBreadth !== 1 ? "s" : ""} covered — supervision discussions are narrow in scope and do not address the full range of practice areas required.`,
    );
  } else if (themeCoverageBreadth < 4 && themeCoverageBreadth >= 3 && supervision_themes.length > 0) {
    concerns.push(
      `${themeCoverageBreadth} supervision theme areas covered — the range of topics discussed in supervision could be broader to ensure comprehensive oversight.`,
    );
  }

  if (matrixComplianceRate < 50 && total_staff > 0) {
    concerns.push(
      `Only ${matrixComplianceRate}% of staff included in the supervision matrix — the home lacks a comprehensive supervision scheduling system, making it impossible to ensure all staff receive timely supervision.`,
    );
  } else if (matrixComplianceRate < 75 && matrixComplianceRate >= 50 && total_staff > 0) {
    concerns.push(
      `Supervision matrix coverage at ${matrixComplianceRate}% — some staff are not assigned within the supervision framework.`,
    );
  }

  if (overdueEntries > 0 && totalMatrixEntries > 0) {
    concerns.push(
      `${overdueEntries} supervision${overdueEntries !== 1 ? "s" : ""} currently overdue according to the matrix — staff are not receiving supervision within their scheduled frequency.`,
    );
  }

  if (sgCompetenceRate < 50 && safeguarding_supervisions.length > 0) {
    concerns.push(
      `Safeguarding competence assessed in only ${sgCompetenceRate}% of safeguarding supervisions — the home is not systematically evaluating whether staff have the skills to keep children safe.`,
    );
  }

  if (totalSupervisions === 0 && total_staff > 0) {
    concerns.push(
      "No supervision sessions recorded despite staff being employed — there is no evidence of any formal supervision taking place.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: SupervisionRecommendation[] = [];
  let rank = 0;

  if (supervisionCoverageRate < 50 && total_staff > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently establish formal supervision for all staff members — the majority of the workforce currently lacks any supervision record. Assign each staff member a named supervisor and schedule their first session within 14 days.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33 — General requirements",
    });
  }

  if (totalSupervisions === 0 && total_staff > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording supervision sessions immediately — without supervision records, the home cannot evidence compliance with Reg 33 or demonstrate that staff are receiving the oversight and support they need.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33 — General requirements",
    });
  }

  if (safeguardingSupervisionCoverageRate < 30 && total_staff > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently implement safeguarding supervision for all staff — specialist safeguarding oversight is essential to ensure staff can recognise and respond to child protection concerns. Schedule safeguarding supervision for every staff member within 21 days.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32 — Fitness of workers",
    });
  }

  if (actionCompletionRate < 40 && combinedActionsIdentified > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement an action tracking system for supervision — the majority of agreed actions are not being completed, which means supervision is not driving practice improvement. Review all outstanding actions and establish accountability.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (matrixComplianceRate < 50 && total_staff > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create a complete supervision matrix covering all staff — assign every staff member a supervisor, define their supervision frequency, and schedule their next session.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33 — General requirements",
    });
  }

  if (supervisionTimelinessRate < 50 && totalMatrixEntries > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address systemic supervision scheduling failures — the majority of supervisions are overdue. Review the supervision calendar, identify barriers to timely delivery, and implement a supervision booking system with automated reminders.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33 — General requirements",
    });
  }

  if (supervisionCoverageRate >= 50 && supervisionCoverageRate < 80 && total_staff > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase supervision coverage to at least 80% of staff — identify which staff members have not received supervision and prioritise scheduling their sessions.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33 — General requirements",
    });
  }

  if (safeguardingSupervisionCoverageRate >= 30 && safeguardingSupervisionCoverageRate < 80 && total_staff > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend safeguarding supervision to all staff — ensure every team member receives specialist safeguarding oversight at least quarterly.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 32 — Fitness of workers",
    });
  }

  if (reflectivePracticeEngagementRate < 30 && total_staff > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a reflective practice framework for the team — introduce structured reflective practice sessions and encourage all staff to engage. Consider group reflective practice as an accessible entry point.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (reflectivePracticeEngagementRate >= 30 && reflectivePracticeEngagementRate < 60 && total_staff > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase reflective practice participation — support disengaged staff through peer mentoring and group reflection sessions to build confidence in reflective practice.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (staffWellbeingDiscussionRate < 50 && totalSupervisions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Embed wellbeing as a standing agenda item in all supervisions — residential care is emotionally demanding work and staff need regular opportunities to discuss their wellbeing within supervision.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (professionalDevelopmentDiscussionRate < 40 && totalSupervisions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Include professional development as a regular supervision topic — staff should have their training needs, career aspirations, and development goals reviewed at each supervision session.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 32 — Fitness of workers",
    });
  }

  if (themeCoverageBreadth < 4 && supervision_themes.length > 0) {
    const uncoveredThemes = ALL_THEMES.filter((t) => !discussedThemes.has(t));
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Broaden supervision theme coverage — ${uncoveredThemes.length} theme areas have not been discussed. Consider using a supervision template that prompts discussion across all key areas including ${uncoveredThemes.slice(0, 3).join(", ")}.`,
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (actionCompletionRate >= 40 && actionCompletionRate < 70 && combinedActionsIdentified > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve supervision action completion to at least 70% — review outstanding actions at the start of each supervision session and hold staff accountable for completion within agreed timescales.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (overdueEntries > 3) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Reschedule ${overdueEntries} overdue supervisions as a priority — staff who are overdue for supervision may be unsupported and oversight gaps may go undetected.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33 — General requirements",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: SupervisionInsight[] = [];

  // -- Critical insights --

  if (supervisionCoverageRate < 50 && total_staff > 0) {
    insights.push({
      text: `Only ${supervisionCoverageRate}% of staff have received supervision. Ofsted will view this as a failure in leadership and management under Reg 33. Staff without supervision may lack the guidance, support, and accountability needed to deliver safe, effective care.`,
      severity: "critical",
    });
  }

  if (safeguardingSupervisionCoverageRate < 30 && total_staff > 0) {
    insights.push({
      text: `Only ${safeguardingSupervisionCoverageRate}% of staff have received safeguarding supervision. Without specialist safeguarding oversight, staff may not recognise or respond appropriately to child protection concerns. This is a significant gap in the home's safeguarding arrangements.`,
      severity: "critical",
    });
  }

  if (totalSupervisions === 0 && total_staff > 0) {
    insights.push({
      text: "No supervision sessions have been recorded. The absence of any supervision evidence means Ofsted cannot assess whether staff are receiving the oversight, support, and professional challenge needed to maintain safe and effective practice.",
      severity: "critical",
    });
  }

  if (actionCompletionRate < 40 && combinedActionsIdentified > 0) {
    insights.push({
      text: `Only ${actionCompletionRate}% of supervision actions completed. When supervision identifies areas for improvement but actions are not followed through, the purpose of supervision is fundamentally undermined. Ofsted will expect to see evidence that supervision drives practice change.`,
      severity: "critical",
    });
  }

  if (matrixComplianceRate < 50 && total_staff > 0) {
    insights.push({
      text: `Only ${matrixComplianceRate}% of staff are included in the supervision matrix. Without a comprehensive scheduling framework, the home cannot ensure that all staff receive timely supervision. This represents a structural failure in supervision management.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (supervisionCoverageRate >= 50 && supervisionCoverageRate < 80 && total_staff > 0) {
    insights.push({
      text: `Supervision coverage at ${supervisionCoverageRate}% — improving but not yet meeting the expected standard. Ofsted will want to see evidence that all staff receive regular, formal supervision.`,
      severity: "warning",
    });
  }

  if (supervisionTimelinessRate >= 50 && supervisionTimelinessRate < 75 && totalMatrixEntries > 0) {
    insights.push({
      text: `Supervision timeliness at ${supervisionTimelinessRate}% — a notable proportion of supervisions are being delivered late. Consistent timeliness is important for demonstrating systematic oversight.`,
      severity: "warning",
    });
  }

  if (supervisionQualityAvg >= 2.5 && supervisionQualityAvg < 3.0 && totalSupervisions > 0) {
    insights.push({
      text: `Average supervision quality rating of ${supervisionQualityAvg}/5.0 — supervision sessions are below the expected quality standard. Consider providing supervision training for supervisors and implementing a supervision quality framework.`,
      severity: "warning",
    });
  }

  if (safeguardingSupervisionCoverageRate >= 30 && safeguardingSupervisionCoverageRate < 80 && total_staff > 0) {
    insights.push({
      text: `Safeguarding supervision coverage at ${safeguardingSupervisionCoverageRate}% — gaps remain in specialist safeguarding oversight. All staff working with vulnerable children should receive regular safeguarding supervision.`,
      severity: "warning",
    });
  }

  if (reflectivePracticeEngagementRate >= 30 && reflectivePracticeEngagementRate < 60 && total_staff > 0) {
    insights.push({
      text: `Reflective practice engagement at ${reflectivePracticeEngagementRate}% — less than two-thirds of staff are actively engaged in reflection. Ofsted values reflective practice as evidence of a learning culture within the home.`,
      severity: "warning",
    });
  }

  if (staffWellbeingDiscussionRate >= 50 && staffWellbeingDiscussionRate < 70 && totalSupervisions > 0) {
    insights.push({
      text: `Staff wellbeing discussed in ${staffWellbeingDiscussionRate}% of supervisions — not all supervision sessions include wellbeing discussions. Given the emotional demands of residential care, consistent wellbeing check-ins are important.`,
      severity: "warning",
    });
  }

  if (professionalDevelopmentDiscussionRate >= 40 && professionalDevelopmentDiscussionRate < 60 && totalSupervisions > 0) {
    insights.push({
      text: `Professional development discussed in ${professionalDevelopmentDiscussionRate}% of supervisions — development conversations are not consistently embedded. Staff benefit from regular discussion of their training needs and career aspirations.`,
      severity: "warning",
    });
  }

  if (overdueEntries > 0 && overdueEntries <= 3 && totalMatrixEntries > 0) {
    insights.push({
      text: `${overdueEntries} supervision${overdueEntries !== 1 ? "s are" : " is"} overdue — prompt rescheduling is needed to maintain supervision compliance.`,
      severity: "warning",
    });
  }

  if (overdueEntries > 3) {
    insights.push({
      text: `${overdueEntries} supervisions are overdue — this volume of overdue sessions suggests a systemic issue with supervision scheduling or capacity.`,
      severity: "warning",
    });
  }

  if (sgCompetenceRate >= 50 && sgCompetenceRate < 80 && safeguarding_supervisions.length > 0) {
    insights.push({
      text: `Safeguarding competence assessed in ${sgCompetenceRate}% of safeguarding supervisions — competence assessment should be a standard element of every safeguarding supervision session.`,
      severity: "warning",
    });
  }

  if (actionCompletionRate >= 40 && actionCompletionRate < 70 && combinedActionsIdentified > 0) {
    insights.push({
      text: `Supervision action completion at ${actionCompletionRate}% — a significant proportion of agreed actions remain outstanding. Without consistent follow-through, supervision risks becoming a compliance exercise rather than a driver of practice improvement.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (supervision_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding supervision and reflective practice oversight — staff receive timely, high-quality supervision with strong safeguarding oversight, active reflective practice engagement, and comprehensive follow-through on actions. This is strong evidence of effective leadership and management under Reg 33.",
      severity: "positive",
    });
  }

  if (supervisionCoverageRate >= 100 && total_staff > 0) {
    insights.push({
      text: "Every staff member has received supervision — the home meets the core expectation that all staff receive formal oversight and support. This is a key indicator of effective management practice.",
      severity: "positive",
    });
  }

  if (safeguardingSupervisionCoverageRate >= 100 && total_staff > 0) {
    insights.push({
      text: "All staff have received safeguarding supervision — the home's safeguarding framework ensures every team member receives specialist oversight on child protection matters.",
      severity: "positive",
    });
  }

  if (reflectivePracticeEngagementRate >= 80 && total_staff > 0) {
    insights.push({
      text: `${reflectivePracticeEngagementRate}% reflective practice engagement demonstrates an embedded culture of professional learning. Ofsted values homes where staff routinely reflect on their practice and identify learning from experience.`,
      severity: "positive",
    });
  }

  if (actionCompletionRate >= 90 && combinedActionsIdentified > 0) {
    insights.push({
      text: `${actionCompletionRate}% of supervision actions completed — supervision is clearly driving practice improvement. The home can evidence that agreed actions are followed through, leading to tangible changes in care quality.`,
      severity: "positive",
    });
  }

  if (supervisionQualityAvg >= 4.0 && totalSupervisions > 0) {
    insights.push({
      text: `Average supervision quality of ${supervisionQualityAvg}/5.0 indicates that supervision sessions are meaningful, structured, and developmental — not just a compliance exercise. This is evidence of strong supervisory practice.`,
      severity: "positive",
    });
  }

  if (staffWellbeingDiscussionRate >= 90 && totalSupervisions > 0 && professionalDevelopmentDiscussionRate >= 80) {
    insights.push({
      text: "Supervision consistently addresses both staff wellbeing and professional development — the home recognises that supporting staff holistically leads to better outcomes for children.",
      severity: "positive",
    });
  }

  if (themeCoverageBreadth >= 7) {
    insights.push({
      text: `${themeCoverageBreadth} out of 8 supervision theme areas covered — supervision discussions demonstrate exceptional breadth, addressing the full spectrum of practice areas expected in residential care.`,
      severity: "positive",
    });
  }

  if (sgCompetenceRate >= 90 && safeguarding_supervisions.length > 0) {
    insights.push({
      text: `Safeguarding competence assessed in ${sgCompetenceRate}% of safeguarding supervisions — the home systematically evaluates staff capability in safeguarding, ensuring confidence that staff can recognise and respond to child protection concerns.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (supervision_rating === "outstanding") {
    headline =
      "Outstanding staff supervision and reflective practice oversight — staff receive timely, high-quality supervision with strong safeguarding oversight, comprehensive theme coverage, and an embedded reflective practice culture.";
  } else if (supervision_rating === "good") {
    headline = `Good supervision and reflective practice oversight — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (supervision_rating === "adequate") {
    headline = `Adequate supervision and reflective practice oversight — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure staff are consistently supervised, supported, and developed.`;
  } else {
    headline = `Staff supervision and reflective practice oversight is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure staff receive the oversight and support they need.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    supervision_rating,
    supervision_score: score,
    headline,
    total_supervisions: totalSupervisions,
    supervision_timeliness_rate: supervisionTimelinessRate,
    supervision_quality_avg: supervisionQualityAvg,
    safeguarding_supervision_coverage_rate: safeguardingSupervisionCoverageRate,
    reflective_practice_engagement_rate: reflectivePracticeEngagementRate,
    theme_coverage_breadth: themeCoverageBreadth,
    action_completion_rate: actionCompletionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
