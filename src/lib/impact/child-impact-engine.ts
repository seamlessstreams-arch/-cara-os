// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD IMPACT ENGINE
// Per-child engine computing a holistic impact view across 10 care domains.
// Evaluates risk reduction, care plan progress, behaviour, education, health,
// relationships, direct work, independence, voice, and safety/stability.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 5, Reg 6, Reg 7, Reg 9, Reg 13, Reg 14, Reg 16.
// SCCIF: "Progress and experiences of children and young people."
// ══════════════════════════════════════════════════════════════════════════════

import type { ChildImpactView, ChildImpactDomain } from "./types";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface RiskAssessmentInput {
  id: string;
  child_id: string;
  risk_level: string;
  date: string;
  review_date?: string | null;
  controls: string[];
  category?: string;
  status?: string;
}

export interface OutcomeTargetInput {
  id: string;
  child_id: string;
  domain: string;
  target_description: string;
  baseline_rating: number;
  current_rating: number;
  target_rating: number;
  direction: string;
  status: string;
  review_date: string;
  set_date: string;
  yp_voice: string | null;
}

export interface IncidentInput {
  id: string;
  child_id?: string;
  young_person_id?: string;
  date: string;
  severity: string;
  category?: string;
  type?: string;
  outcome?: string;
}

export interface EducationRecordInput {
  id: string;
  child_id: string;
  attendance_percentage?: number;
  engagement_level?: string;
  achievement_notes?: string;
  exclusions?: number;
  date?: string;
  term?: string;
}

export interface HealthAssessmentInput {
  id: string;
  child_id: string;
  date: string;
  type?: string;
  outcome?: string;
  next_due?: string;
  attended?: boolean;
}

export interface KeyWorkSessionInput {
  id: string;
  child_id: string;
  date: string;
  duration_minutes?: number;
  child_engaged?: boolean;
  child_views_captured?: boolean;
  topics?: string[];
  themes?: string[];
  mood_before?: number;
  mood_after?: number;
}

export interface FamilyTimeSessionInput {
  id: string;
  child_id: string;
  date: string;
  contact_type?: string;
  quality?: string;
  attended?: boolean;
  notes?: string;
}

export interface MissingEpisodeInput {
  id: string;
  child_id: string;
  date: string;
  duration_hours?: number;
  return_interview_completed?: boolean;
}

export interface IndependenceSkillInput {
  child_id: string;
  skills: Array<{
    name: string;
    proficiency: string;
    category: string;
  }>;
  strengths?: string[];
  areas_for_development?: string[];
}

export interface YPFeedbackInput {
  id: string;
  child_id: string;
  date: string;
  type?: string;
  category?: string;
  sentiment?: string;
  response_given_to_child?: boolean;
  status?: string;
}

export interface BehaviourEntryInput {
  id: string;
  child_id: string;
  date: string;
  type?: string;
  severity?: string;
  category?: string;
  regulation_support_given?: boolean;
  outcome?: string;
}

export interface LACReviewInput {
  id: string;
  child_id: string;
  date: string;
  child_participation?: string;
  child_views?: string;
  outcome?: string;
}

export interface LessonLearnedInput {
  id: string;
  child_id?: string;
  lesson: string;
  date: string;
  category?: string;
}

export interface ChildImpactInput {
  today: string;
  child_id: string;
  child_name: string;
  placement_start: string;
  risk_assessments: RiskAssessmentInput[];
  outcome_targets: OutcomeTargetInput[];
  incidents: IncidentInput[];
  education_records: EducationRecordInput[];
  health_assessments: HealthAssessmentInput[];
  key_work_sessions: KeyWorkSessionInput[];
  family_time_sessions: FamilyTimeSessionInput[];
  missing_episodes: MissingEpisodeInput[];
  independence_skills: IndependenceSkillInput | null;
  yp_feedback: YPFeedbackInput[];
  behaviour_entries: BehaviourEntryInput[];
  lac_reviews: LACReviewInput[];
  lessons_learned: LessonLearnedInput[];
  advocacy_records: Array<{ id: string; child_id: string; status?: string }>;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pct(n: number, d: number): number | null {
  return d > 0 ? Math.round((n / d) * 100) : null;
}

function recent(today: string, date: string, windowDays: number): boolean {
  return daysBetween(date, today) <= windowDays && daysBetween(date, today) >= 0;
}

function computeTrend(recentCount: number, olderCount: number): "up" | "flat" | "down" {
  if (recentCount > olderCount) return "up";
  if (recentCount < olderCount) return "down";
  return "flat";
}

function statusFromScore(score: number): "improving" | "stable" | "declining" | "not_assessed" {
  if (score >= 70) return "improving";
  if (score >= 40) return "stable";
  if (score > 0) return "declining";
  return "not_assessed";
}

function trendFromStatus(status: "improving" | "stable" | "declining" | "not_assessed"): "up" | "flat" | "down" {
  if (status === "improving") return "up";
  if (status === "declining") return "down";
  return "flat";
}

// ── Domain Scorers ──────────────────────────────────────────────────────────

function scoreRiskReduction(input: ChildImpactInput): ChildImpactDomain {
  const ra = input.risk_assessments;
  const highlights: string[] = [];
  const concerns: string[] = [];

  if (ra.length === 0) {
    return {
      domain: "risk_reduction",
      label: "Risk Reduction",
      icon: "Shield",
      current_status: "not_assessed",
      score: 0,
      trend: "flat",
      highlights: [],
      concerns: ["No risk assessments on file"],
      evidence_count: 0,
    };
  }

  const hasRecentReview = ra.some((r) => r.review_date && recent(input.today, r.review_date, 90));

  // Score components
  let score = 50;

  // Risk level scoring
  const riskLevels = ra.map((r) => r.risk_level?.toLowerCase() ?? "medium");
  const highRisks = riskLevels.filter((l) => l === "high" || l === "critical").length;
  const lowRisks = riskLevels.filter((l) => l === "low").length;
  score += lowRisks * 5;
  score -= highRisks * 10;

  // Controls in place
  const totalControls = ra.reduce((sum, r) => sum + (r.controls?.length ?? 0), 0);
  if (totalControls > 0) {
    score += Math.min(totalControls * 3, 20);
    highlights.push(`${totalControls} risk control measure${totalControls > 1 ? "s" : ""} in place`);
  }

  // Recent reviews
  if (hasRecentReview) {
    score += 10;
    highlights.push("Risk assessments reviewed within the last 90 days");
  } else {
    score -= 10;
    concerns.push("Risk assessments not reviewed recently");
  }

  if (highRisks > 0) {
    concerns.push(`${highRisks} risk${highRisks > 1 ? "s" : ""} rated high or critical`);
  }
  if (lowRisks > 0) {
    highlights.push(`${lowRisks} risk area${lowRisks > 1 ? "s" : ""} reduced to low`);
  }

  score = clamp(score, 0, 100);
  const status = statusFromScore(score);

  return {
    domain: "risk_reduction",
    label: "Risk Reduction",
    icon: "Shield",
    current_status: status,
    score,
    trend: trendFromStatus(status),
    highlights,
    concerns,
    evidence_count: ra.length,
  };
}

function scoreCarePlanProgress(input: ChildImpactInput): ChildImpactDomain {
  const targets = input.outcome_targets;
  const highlights: string[] = [];
  const concerns: string[] = [];

  if (targets.length === 0) {
    return {
      domain: "care_plan_progress",
      label: "Care Plan Progress",
      icon: "Target",
      current_status: "not_assessed",
      score: 0,
      trend: "flat",
      highlights: [],
      concerns: ["No outcome targets set"],
      evidence_count: 0,
    };
  }

  const active = targets.filter((t) => t.status === "active");
  const achieved = targets.filter((t) => t.status === "achieved");
  const improving = active.filter((t) => t.direction === "improving");
  const declining = active.filter((t) => t.direction === "declining");

  // Score: % achieved + % improving of active + yp voice bonus
  let score = 0;
  const achievedPct = pct(achieved.length, targets.length);
  score += (achievedPct ?? 0) * 0.4;

  if (active.length > 0) {
    const improvingPct = pct(improving.length, active.length);
    score += (improvingPct ?? 0) * 0.4;
  } else {
    score += 40; // all achieved = full marks for improvement
  }

  // YP voice
  const withVoice = targets.filter((t) => t.yp_voice && t.yp_voice.trim().length > 0);
  const voicePct = pct(withVoice.length, targets.length);
  score += (voicePct ?? 0) * 0.2;

  // Review timeliness
  const overdue = targets.filter((t) =>
    t.status === "active" && t.review_date && daysBetween(t.review_date, input.today) > 0,
  );
  if (overdue.length > 0) {
    score -= overdue.length * 5;
    concerns.push(`${overdue.length} target${overdue.length > 1 ? "s" : ""} overdue for review`);
  }

  if (achieved.length > 0) highlights.push(`${achieved.length} target${achieved.length > 1 ? "s" : ""} achieved`);
  if (improving.length > 0) highlights.push(`${improving.length} target${improving.length > 1 ? "s" : ""} showing improvement`);
  if (declining.length > 0) concerns.push(`${declining.length} target${declining.length > 1 ? "s" : ""} declining`);
  if ((voicePct ?? 0) >= 80) highlights.push("Strong child voice captured in targets");

  score = clamp(Math.round(score), 0, 100);
  const status = statusFromScore(score);

  return {
    domain: "care_plan_progress",
    label: "Care Plan Progress",
    icon: "Target",
    current_status: status,
    score,
    trend: trendFromStatus(status),
    highlights,
    concerns,
    evidence_count: targets.length,
  };
}

function scoreBehaviourWellbeing(input: ChildImpactInput): ChildImpactDomain {
  const incidents = input.incidents;
  const behaviour = input.behaviour_entries;
  const highlights: string[] = [];
  const concerns: string[] = [];

  const allEntries = [...incidents, ...behaviour];
  if (allEntries.length === 0) {
    return {
      domain: "behaviour_wellbeing",
      label: "Behaviour & Emotional Wellbeing",
      icon: "Heart",
      current_status: "stable",
      score: 75,
      trend: "flat",
      highlights: ["No incidents or behavioural concerns recorded"],
      concerns: [],
      evidence_count: 0,
    };
  }

  // Split into recent (30d) and older (31-90d)
  const recentIncidents = incidents.filter((i) => recent(input.today, i.date, 30));
  const olderIncidents = incidents.filter(
    (i) => recent(input.today, i.date, 90) && !recent(input.today, i.date, 30),
  );
  const recentBehaviour = behaviour.filter((b) => recent(input.today, b.date, 30));

  // Incidents trending
  const incTrend = computeTrend(recentIncidents.length, olderIncidents.length / 2);

  // Score: fewer incidents = better. Start at 80, deduct per recent incident.
  let score = 80;
  score -= recentIncidents.length * 8;
  // "critical" was missing from this list while the incident check below
  // (i.severity === "high" || "critical" || "major") already had it, so the
  // most serious behaviour a child can record — a self-harm attempt — cost
  // the score nothing.
  score -= recentBehaviour.filter(
    (b) => b.severity === "high" || b.severity === "critical" || b.severity === "major",
  ).length * 5;

  // Regulation support
  const withSupport = recentBehaviour.filter((b) => b.regulation_support_given);
  if (withSupport.length > 0) {
    score += Math.min(withSupport.length * 3, 10);
    highlights.push("Emotional regulation support consistently provided");
  }

  // Trend bonus/penalty
  if (incTrend === "down") {
    score += 10;
    highlights.push("Incidents trending downward — positive trajectory");
  } else if (incTrend === "up") {
    score -= 10;
    concerns.push("Incidents trending upward — needs attention");
  }

  if (recentIncidents.length === 0) {
    highlights.push("No incidents in the last 30 days");
  } else {
    concerns.push(`${recentIncidents.length} incident${recentIncidents.length > 1 ? "s" : ""} in the last 30 days`);
  }

  // Key work sessions for mood improvement
  const kwSessions = input.key_work_sessions.filter(
    (k) => recent(input.today, k.date, 90) && k.mood_before != null && k.mood_after != null,
  );
  const moodImproved = kwSessions.filter((k) => (k.mood_after ?? 0) > (k.mood_before ?? 0));
  if (moodImproved.length > 0) {
    highlights.push(`Mood improved in ${moodImproved.length} key work session${moodImproved.length > 1 ? "s" : ""}`);
  }

  score = clamp(score, 0, 100);
  const status = statusFromScore(score);

  return {
    domain: "behaviour_wellbeing",
    label: "Behaviour & Emotional Wellbeing",
    icon: "Heart",
    current_status: status,
    score,
    trend: incTrend === "down" ? "down" : incTrend === "up" ? "up" : "flat",
    highlights,
    concerns,
    evidence_count: allEntries.length,
  };
}

function scoreEducation(input: ChildImpactInput): ChildImpactDomain {
  const records = input.education_records;
  const highlights: string[] = [];
  const concerns: string[] = [];

  if (records.length === 0) {
    return {
      domain: "education",
      label: "Education",
      icon: "GraduationCap",
      current_status: "not_assessed",
      score: 0,
      trend: "flat",
      highlights: [],
      concerns: ["No education records on file"],
      evidence_count: 0,
    };
  }

  let score = 50;

  // Attendance
  const attendanceRecords = records.filter((r) => r.attendance_percentage != null);
  if (attendanceRecords.length > 0) {
    const avgAttendance = attendanceRecords.reduce(
      (sum, r) => sum + (r.attendance_percentage ?? 0), 0,
    ) / attendanceRecords.length;

    if (avgAttendance >= 95) {
      score += 30;
      highlights.push(`Excellent attendance — ${Math.round(avgAttendance)}%`);
    } else if (avgAttendance >= 85) {
      score += 20;
      highlights.push(`Good attendance — ${Math.round(avgAttendance)}%`);
    } else if (avgAttendance >= 70) {
      score += 10;
      concerns.push(`Attendance below target — ${Math.round(avgAttendance)}%`);
    } else {
      concerns.push(`Low attendance — ${Math.round(avgAttendance)}%`);
    }
  }

  // Engagement
  const engagedRecords = records.filter((r) =>
    r.engagement_level === "high" || r.engagement_level === "good",
  );
  const disengaged = records.filter((r) =>
    r.engagement_level === "low" || r.engagement_level === "disengaged",
  );
  if (engagedRecords.length > 0) {
    score += 15;
    highlights.push("Positive engagement with education");
  }
  if (disengaged.length > 0) {
    score -= 10;
    concerns.push("Education engagement levels are low");
  }

  // Achievements
  const withAchievements = records.filter(
    (r) => r.achievement_notes && r.achievement_notes.trim().length > 0,
  );
  if (withAchievements.length > 0) {
    score += 10;
    highlights.push(`${withAchievements.length} achievement${withAchievements.length > 1 ? "s" : ""} recorded`);
  }

  // Exclusions
  const totalExclusions = records.reduce((sum, r) => sum + (r.exclusions ?? 0), 0);
  if (totalExclusions > 0) {
    score -= totalExclusions * 8;
    concerns.push(`${totalExclusions} exclusion${totalExclusions > 1 ? "s" : ""} recorded`);
  }

  score = clamp(score, 0, 100);
  const status = statusFromScore(score);

  return {
    domain: "education",
    label: "Education",
    icon: "GraduationCap",
    current_status: status,
    score,
    trend: trendFromStatus(status),
    highlights,
    concerns,
    evidence_count: records.length,
  };
}

function scoreHealth(input: ChildImpactInput): ChildImpactDomain {
  const assessments = input.health_assessments;
  const highlights: string[] = [];
  const concerns: string[] = [];

  if (assessments.length === 0) {
    return {
      domain: "health",
      label: "Health",
      icon: "Stethoscope",
      current_status: "not_assessed",
      score: 0,
      trend: "flat",
      highlights: [],
      concerns: ["No health assessments on file"],
      evidence_count: 0,
    };
  }

  let score = 50;

  const attended = assessments.filter((a) => a.attended !== false);
  const missed = assessments.filter((a) => a.attended === false);
  const attendRate = pct(attended.length, assessments.length);

  if ((attendRate ?? 0) >= 90) {
    score += 30;
    highlights.push(`${attendRate}% of health appointments attended`);
  } else if ((attendRate ?? 0) >= 70) {
    score += 15;
    highlights.push(`${attendRate}% health appointment attendance`);
  } else {
    concerns.push(`Only ${attendRate}% of health appointments attended`);
  }

  if (missed.length > 0) {
    score -= missed.length * 5;
    concerns.push(`${missed.length} missed health appointment${missed.length > 1 ? "s" : ""}`);
  }

  // Recent assessment
  const recentAssessments = assessments.filter((a) => recent(input.today, a.date, 180));
  if (recentAssessments.length > 0) {
    score += 10;
    highlights.push("Health assessment completed within the last 6 months");
  } else {
    score -= 10;
    concerns.push("No health assessment within the last 6 months");
  }

  // Overdue next assessments
  const overdue = assessments.filter(
    (a) => a.next_due && daysBetween(a.next_due, input.today) > 0,
  );
  if (overdue.length > 0) {
    score -= overdue.length * 5;
    concerns.push(`${overdue.length} overdue health follow-up${overdue.length > 1 ? "s" : ""}`);
  }

  score = clamp(score, 0, 100);
  const status = statusFromScore(score);

  return {
    domain: "health",
    label: "Health",
    icon: "Stethoscope",
    current_status: status,
    score,
    trend: trendFromStatus(status),
    highlights,
    concerns,
    evidence_count: assessments.length,
  };
}

function scoreRelationships(input: ChildImpactInput): ChildImpactDomain {
  const family = input.family_time_sessions;
  const keyWork = input.key_work_sessions;
  const advocacy = input.advocacy_records;
  const highlights: string[] = [];
  const concerns: string[] = [];

  const totalEvidence = family.length + keyWork.length + advocacy.length;

  if (totalEvidence === 0) {
    return {
      domain: "relationships",
      label: "Relationships",
      icon: "Users",
      current_status: "not_assessed",
      score: 0,
      trend: "flat",
      highlights: [],
      concerns: ["No relationship evidence recorded"],
      evidence_count: 0,
    };
  }

  let score = 50;

  // Family contact
  const recentFamily = family.filter((f) => recent(input.today, f.date, 90));
  if (recentFamily.length >= 6) {
    score += 15;
    highlights.push("Regular family contact maintained");
  } else if (recentFamily.length >= 3) {
    score += 10;
    highlights.push(`${recentFamily.length} family contact sessions in 90 days`);
  } else if (recentFamily.length > 0) {
    score += 5;
    concerns.push("Limited family contact — consider whether more is appropriate");
  } else if (family.length > 0) {
    concerns.push("No recent family contact");
  }

  // Quality of family contact
  const goodQuality = recentFamily.filter(
    (f) => f.quality === "good" || f.quality === "excellent" || f.quality === "positive",
  );
  if (goodQuality.length > 0) {
    score += 10;
    highlights.push("Family contact quality rated positively");
  }

  // Key worker relationship
  const recentKW = keyWork.filter((k) => recent(input.today, k.date, 90));
  if (recentKW.length >= 6) {
    score += 15;
    highlights.push("Strong key worker relationship — regular sessions");
  } else if (recentKW.length >= 3) {
    score += 10;
    highlights.push(`${recentKW.length} key work sessions in 90 days`);
  } else {
    score -= 5;
    concerns.push("Key work sessions are infrequent");
  }

  // Engaged in sessions
  const engaged = recentKW.filter((k) => k.child_engaged);
  if (engaged.length > 0 && recentKW.length > 0) {
    const engagePct = pct(engaged.length, recentKW.length);
    if ((engagePct ?? 0) >= 80) highlights.push("Child actively engaged in key work sessions");
  }

  // Advocacy
  const activeAdvocacy = advocacy.filter((a) => a.status === "active");
  if (activeAdvocacy.length > 0) {
    score += 5;
    highlights.push("Independent advocacy in place");
  }

  score = clamp(score, 0, 100);
  const status = statusFromScore(score);

  return {
    domain: "relationships",
    label: "Relationships",
    icon: "Users",
    current_status: status,
    score,
    trend: trendFromStatus(status),
    highlights,
    concerns,
    evidence_count: totalEvidence,
  };
}

function scoreDirectWork(input: ChildImpactInput): ChildImpactDomain {
  const sessions = input.key_work_sessions;
  const highlights: string[] = [];
  const concerns: string[] = [];

  if (sessions.length === 0) {
    return {
      domain: "direct_work",
      label: "Direct Work",
      icon: "Handshake",
      current_status: "not_assessed",
      score: 0,
      trend: "flat",
      highlights: [],
      concerns: ["No direct work / key work sessions recorded"],
      evidence_count: 0,
    };
  }

  let score = 50;

  // Frequency
  const recentSessions = sessions.filter((s) => recent(input.today, s.date, 90));
  const olderSessions = sessions.filter(
    (s) => recent(input.today, s.date, 180) && !recent(input.today, s.date, 90),
  );

  if (recentSessions.length >= 12) {
    score += 25;
    highlights.push("Excellent direct work frequency — weekly or more");
  } else if (recentSessions.length >= 6) {
    score += 15;
    highlights.push(`${recentSessions.length} direct work sessions in 90 days`);
  } else if (recentSessions.length >= 3) {
    score += 5;
    concerns.push("Direct work sessions could be more frequent");
  } else {
    score -= 10;
    concerns.push("Very few direct work sessions recently");
  }

  // Quality: child engagement
  const engaged = recentSessions.filter((s) => s.child_engaged);
  if (recentSessions.length > 0) {
    const engageRate = pct(engaged.length, recentSessions.length);
    if ((engageRate ?? 0) >= 80) {
      score += 15;
      highlights.push(`${engageRate}% child engagement rate — child is actively participating`);
    } else if ((engageRate ?? 0) >= 50) {
      score += 5;
    } else {
      concerns.push("Low child engagement in direct work sessions");
    }
  }

  // Views captured
  const viewsCaptured = recentSessions.filter((s) => s.child_views_captured);
  if (viewsCaptured.length > 0 && recentSessions.length > 0) {
    const viewsRate = pct(viewsCaptured.length, recentSessions.length);
    if ((viewsRate ?? 0) >= 80) {
      score += 10;
      highlights.push("Child's views consistently captured in direct work");
    }
  }

  // Trend
  const trend = computeTrend(recentSessions.length, olderSessions.length);
  if (trend === "up") highlights.push("Direct work frequency is increasing");
  if (trend === "down") concerns.push("Direct work frequency has decreased");

  score = clamp(score, 0, 100);
  const status = statusFromScore(score);

  return {
    domain: "direct_work",
    label: "Direct Work",
    icon: "Handshake",
    current_status: status,
    score,
    trend: trend === "up" ? "up" : trend === "down" ? "down" : "flat",
    highlights,
    concerns,
    evidence_count: sessions.length,
  };
}

function scoreIndependence(input: ChildImpactInput): ChildImpactDomain {
  const skills = input.independence_skills;
  const highlights: string[] = [];
  const concerns: string[] = [];

  if (!skills || skills.skills.length === 0) {
    return {
      domain: "independence",
      label: "Independence & Life Skills",
      icon: "Compass",
      current_status: "not_assessed",
      score: 0,
      trend: "flat",
      highlights: [],
      concerns: ["No independence skills assessment on file"],
      evidence_count: 0,
    };
  }

  let score = 50;

  const proficiencyScores: Record<string, number> = {
    established: 4,
    developing: 3,
    emerging: 2,
    not_started: 1,
  };

  const skillScores = skills.skills.map(
    (s) => proficiencyScores[s.proficiency] ?? 1,
  );
  const avgSkill = skillScores.reduce((a, b) => a + b, 0) / skillScores.length;

  // Scale: 1 = 25, 2 = 50, 3 = 75, 4 = 100
  score = Math.round(avgSkill * 25);

  const established = skills.skills.filter((s) => s.proficiency === "established");
  const developing = skills.skills.filter((s) => s.proficiency === "developing");
  const notStarted = skills.skills.filter((s) => s.proficiency === "not_started");

  if (established.length > 0) {
    highlights.push(`${established.length} skill${established.length > 1 ? "s" : ""} fully established`);
  }
  if (developing.length > 0) {
    highlights.push(`${developing.length} skill${developing.length > 1 ? "s" : ""} actively developing`);
  }
  if (notStarted.length > 0) {
    concerns.push(`${notStarted.length} skill area${notStarted.length > 1 ? "s" : ""} not yet started`);
  }

  if (skills.strengths && skills.strengths.length > 0) {
    highlights.push(`Key strengths: ${skills.strengths.slice(0, 3).join(", ")}`);
  }
  if (skills.areas_for_development && skills.areas_for_development.length > 0) {
    concerns.push(`Areas for development: ${skills.areas_for_development.slice(0, 3).join(", ")}`);
  }

  score = clamp(score, 0, 100);
  const status = statusFromScore(score);

  return {
    domain: "independence",
    label: "Independence & Life Skills",
    icon: "Compass",
    current_status: status,
    score,
    trend: trendFromStatus(status),
    highlights,
    concerns,
    evidence_count: skills.skills.length,
  };
}

function scoreVoiceParticipation(input: ChildImpactInput): ChildImpactDomain {
  const feedback = input.yp_feedback;
  const lacReviews = input.lac_reviews;
  const kwSessions = input.key_work_sessions;
  const highlights: string[] = [];
  const concerns: string[] = [];

  const totalEvidence = feedback.length + lacReviews.length;

  if (totalEvidence === 0 && kwSessions.length === 0) {
    return {
      domain: "voice_participation",
      label: "Voice & Participation",
      icon: "MessageCircle",
      current_status: "not_assessed",
      score: 0,
      trend: "flat",
      highlights: [],
      concerns: ["No evidence of voice or participation captured"],
      evidence_count: 0,
    };
  }

  let score = 50;

  // LAC review participation
  if (lacReviews.length > 0) {
    const participated = lacReviews.filter(
      (r) => r.child_participation === "attended" || r.child_participation === "views_submitted",
    );
    const pRate = pct(participated.length, lacReviews.length);
    if ((pRate ?? 0) >= 80) {
      score += 15;
      highlights.push("Strong participation in LAC reviews");
    } else if ((pRate ?? 0) >= 50) {
      score += 5;
    } else {
      concerns.push("Low participation rate in LAC reviews");
    }

    // Views recorded
    const viewsRecorded = lacReviews.filter(
      (r) => r.child_views && r.child_views.trim().length > 0,
    );
    if (viewsRecorded.length > 0) {
      score += 10;
      highlights.push("Child's views recorded in LAC reviews");
    }
  }

  // YP feedback
  const recentFeedback = feedback.filter((f) => recent(input.today, f.date, 90));
  if (recentFeedback.length >= 3) {
    score += 10;
    highlights.push("Child actively providing feedback");
  } else if (recentFeedback.length > 0) {
    score += 5;
  } else {
    concerns.push("Limited feedback from child in recent months");
  }

  // Responses given
  const responded = recentFeedback.filter((f) => f.response_given_to_child);
  if (recentFeedback.length > 0) {
    const responseRate = pct(responded.length, recentFeedback.length);
    if ((responseRate ?? 0) >= 80) {
      score += 10;
      highlights.push("Feedback is acted upon and responded to");
    } else if ((responseRate ?? 0) < 50) {
      concerns.push("Feedback responses need improvement");
    }
  }

  // Key work views captured
  const viewsCaptured = kwSessions.filter((k) => k.child_views_captured);
  if (viewsCaptured.length >= 3) {
    score += 5;
    highlights.push("Child's views regularly captured in key work");
  }

  score = clamp(score, 0, 100);
  const status = statusFromScore(score);

  return {
    domain: "voice_participation",
    label: "Voice & Participation",
    icon: "MessageCircle",
    current_status: status,
    score,
    trend: trendFromStatus(status),
    highlights,
    concerns,
    evidence_count: totalEvidence + kwSessions.length,
  };
}

function scoreSafetyStability(input: ChildImpactInput): ChildImpactDomain {
  const missing = input.missing_episodes;
  const incidents = input.incidents;
  const highlights: string[] = [];
  const concerns: string[] = [];

  let score = 80; // Start positive — stability is the default

  // Placement duration
  const placementDays = daysBetween(input.placement_start, input.today);
  if (placementDays >= 365) {
    score += 10;
    highlights.push(`Stable placement for over ${Math.floor(placementDays / 365)} year${Math.floor(placementDays / 365) > 1 ? "s" : ""}`);
  } else if (placementDays >= 180) {
    score += 5;
    highlights.push(`Placement stable for ${Math.floor(placementDays / 30)} months`);
  }

  // Missing episodes
  const recentMissing = missing.filter((m) => recent(input.today, m.date, 90));
  const olderMissing = missing.filter(
    (m) => recent(input.today, m.date, 180) && !recent(input.today, m.date, 90),
  );

  if (recentMissing.length > 0) {
    score -= recentMissing.length * 10;
    concerns.push(`${recentMissing.length} missing episode${recentMissing.length > 1 ? "s" : ""} in the last 90 days`);
  } else {
    highlights.push("No missing episodes in the last 90 days");
  }

  // Return interviews
  const returnInterviews = recentMissing.filter((m) => m.return_interview_completed);
  if (recentMissing.length > 0 && returnInterviews.length === recentMissing.length) {
    score += 5;
    highlights.push("All return home interviews completed");
  } else if (recentMissing.length > 0 && returnInterviews.length < recentMissing.length) {
    concerns.push("Not all return home interviews completed");
  }

  // Missing trend
  const missTrend = computeTrend(recentMissing.length, olderMissing.length);
  if (missTrend === "down") {
    score += 5;
    highlights.push("Missing episodes trending downward");
  } else if (missTrend === "up") {
    score -= 5;
    concerns.push("Missing episodes are increasing");
  }

  // Serious incidents
  const seriousIncidents = incidents.filter(
    (i) => recent(input.today, i.date, 90) &&
      (i.severity === "high" || i.severity === "critical" || i.severity === "major"),
  );
  if (seriousIncidents.length > 0) {
    score -= seriousIncidents.length * 8;
    concerns.push(`${seriousIncidents.length} serious incident${seriousIncidents.length > 1 ? "s" : ""} in the last 90 days`);
  }

  score = clamp(score, 0, 100);
  const status = statusFromScore(score);

  return {
    domain: "safety_stability",
    label: "Safety & Stability",
    icon: "Home",
    current_status: status,
    score,
    trend: missTrend === "down" ? "down" : missTrend === "up" ? "up" : "flat",
    highlights,
    concerns,
    evidence_count: missing.length + incidents.length,
  };
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeChildImpact(input: ChildImpactInput): ChildImpactView {
  const { today, child_id, child_name, placement_start } = input;

  const placementDays = Math.max(0, daysBetween(placement_start, today));

  // ── Compute all 10 domains ──────────────────────────────────────────────
  const domains: ChildImpactDomain[] = [
    scoreRiskReduction(input),
    scoreCarePlanProgress(input),
    scoreBehaviourWellbeing(input),
    scoreEducation(input),
    scoreHealth(input),
    scoreRelationships(input),
    scoreDirectWork(input),
    scoreIndependence(input),
    scoreVoiceParticipation(input),
    scoreSafetyStability(input),
  ];

  // ── Overall score ───────────────────────────────────────────────────────
  const assessedDomains = domains.filter((d) => d.current_status !== "not_assessed");
  const overallScore = assessedDomains.length > 0
    ? Math.round(assessedDomains.reduce((s, d) => s + d.score, 0) / assessedDomains.length)
    : null;

  // ── Overall progress ────────────────────────────────────────────────────
  let overallProgress: ChildImpactView["overall_progress"];
  if (assessedDomains.length === 0) {
    overallProgress = "not_assessed";
  } else if ((overallScore ?? 0) >= 80) {
    overallProgress = "significant";
  } else if ((overallScore ?? 0) >= 65) {
    overallProgress = "good";
  } else if ((overallScore ?? 0) >= 45) {
    overallProgress = "some";
  } else {
    overallProgress = "limited";
  }

  // ── Key achievements ────────────────────────────────────────────────────
  const keyAchievements: string[] = [];
  for (const d of domains) {
    if (d.score >= 70) {
      keyAchievements.push(`${d.label}: ${d.highlights[0] ?? "showing strong progress"}`);
    }
  }
  // Add achieved targets
  const achieved = input.outcome_targets.filter((t) => t.status === "achieved");
  for (const t of achieved.slice(0, 3)) {
    keyAchievements.push(`Achieved target: ${t.target_description}`);
  }

  // ── Outstanding actions ─────────────────────────────────────────────────
  const outstandingActions: string[] = [];
  for (const d of domains) {
    for (const c of d.concerns) {
      outstandingActions.push(`[${d.label}] ${c}`);
    }
  }

  // ── Risks reduced ──────────────────────────────────────────────────────
  const risksReduced: string[] = [];
  const riskDomain = domains.find((d) => d.domain === "risk_reduction");
  if (riskDomain) {
    risksReduced.push(...riskDomain.highlights);
  }

  // ── Goals progressed ───────────────────────────────────────────────────
  const goalsProgressed: string[] = [];
  const improving = input.outcome_targets.filter(
    (t) => t.status === "active" && t.direction === "improving",
  );
  for (const t of improving.slice(0, 5)) {
    goalsProgressed.push(`${t.target_description} (${t.current_rating}/${t.target_rating})`);
  }

  // ── Relationships supported ────────────────────────────────────────────
  const relationshipsSupported: string[] = [];
  const relDomain = domains.find((d) => d.domain === "relationships");
  if (relDomain) {
    relationshipsSupported.push(...relDomain.highlights);
  }

  // ── Lessons learned ────────────────────────────────────────────────────
  const lessonsLearned = input.lessons_learned
    .filter((l) => !l.child_id || l.child_id === child_id)
    .slice(0, 5)
    .map((l) => l.lesson);

  // ── Next steps ─────────────────────────────────────────────────────────
  const nextSteps: string[] = [];
  for (const d of domains) {
    if (d.current_status === "declining" && d.concerns.length > 0) {
      nextSteps.push(`Address ${d.label.toLowerCase()}: ${d.concerns[0]}`);
    }
  }
  // Add overdue targets
  const overdueTargets = input.outcome_targets.filter(
    (t) => t.status === "active" && t.review_date && daysBetween(t.review_date, today) > 0,
  );
  for (const t of overdueTargets.slice(0, 3)) {
    nextSteps.push(`Review overdue target: ${t.target_description}`);
  }
  if (nextSteps.length === 0) {
    nextSteps.push("Continue current trajectory — all domains are on track or stable");
  }

  // ── Direct work hours ──────────────────────────────────────────────────
  const totalDirectWorkHours = input.key_work_sessions.reduce(
    (sum, s) => sum + (s.duration_minutes ?? 45) / 60,
    0,
  );

  // ── Incidents ──────────────────────────────────────────────────────────
  const totalIncidents = input.incidents.length;
  const recentIncidents = input.incidents.filter((i) => recent(today, i.date, 30));
  const olderIncidents = input.incidents.filter(
    (i) => recent(today, i.date, 90) && !recent(today, i.date, 30),
  );
  const incidentsTrend = computeTrend(recentIncidents.length, olderIncidents.length / 2);

  return {
    child_id,
    child_name,
    assessment_date: today,
    placement_duration_days: placementDays,
    overall_progress: overallProgress,
    overall_score: overallScore,
    domains,
    key_achievements: keyAchievements,
    outstanding_actions: outstandingActions,
    risks_reduced: risksReduced,
    goals_progressed: goalsProgressed,
    relationships_supported: relationshipsSupported,
    lessons_learned: lessonsLearned,
    next_steps: nextSteps,
    total_direct_work_hours: Math.round(totalDirectWorkHours * 10) / 10,
    total_incidents: totalIncidents,
    incidents_trend: incidentsTrend,
  };
}
