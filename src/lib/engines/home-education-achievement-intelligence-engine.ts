// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME EDUCATION ACHIEVEMENT INTELLIGENCE ENGINE
// Home-level: synthesises education records across all children to produce
// an overall education engagement and achievement intelligence score.
// CHR 2015 Reg 8, 29. SCCIF: "Education", "Experiences and progress."
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rate, rateOf } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface EducationRecordInput {
  id: string;
  child_id: string;
  date: string;                          // YYYY-MM-DD
  record_type: string;                   // "attendance" | "exclusion" | "pep_meeting" | "attainment" | "achievement" | "concern"
  attendance_status: string | null;      // "present" | "absent" | "late" | "excluded" | null
  linked_pep: boolean;
  has_outcome: boolean;
  has_follow_up: boolean;
  status: string;                        // "open" | "monitoring" | "resolved"
}

export interface HomeEducationInput {
  today: string;
  total_children: number;
  child_ids: string[];
  education_records: EducationRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type EducationRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AttendanceProfile {
  total_attendance_records_30d: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excluded_count: number;
  attendance_rate: number | null;        // % present of attendance records; null with none
  punctuality_rate: number | null;       // % on time (present only, not late) of non-excluded
  children_with_exclusions_90d: string[];
  exclusion_count_90d: number;
}

export interface PepProfile {
  total_pep_meetings_90d: number;
  children_with_pep_90d: string[];
  children_without_pep_90d: string[];
  pep_per_child: number | null;          // null when there are no children
}

export interface AchievementProfile {
  achievements_90d: number;
  attainment_records_90d: number;
  concerns_90d: number;
  concern_resolution_rate: number | null; // % of concerns resolved or monitoring; null with none
}

export interface EducationInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface EducationRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeEducationResult {
  education_rating: EducationRating;
  education_score: number;
  headline: string;
  attendance: AttendanceProfile;
  pep: PepProfile;
  achievements: AchievementProfile;
  strengths: string[];
  concerns: string[];
  recommendations: EducationRecommendation[];
  insights: EducationInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): EducationRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeEducation(
  input: HomeEducationInput,
): HomeEducationResult {
  const { today, total_children, child_ids, education_records } = input;

  if (education_records.length < 3) {
    return {
      education_rating: "insufficient_data",
      education_score: 0,
      headline: "Insufficient data to assess education engagement and achievement.",
      attendance: emptyAttendance(),
      pep: emptyPep(),
      achievements: emptyAchievements(),
      strengths: [],
      concerns: [],
      recommendations: [{ rank: 1, recommendation: "Begin recording education data to enable analysis of attendance, achievement, and PEP compliance.", urgency: "immediate", regulatory_ref: "Reg 8" }],
      insights: [{ text: "Not enough education data to assess. Ensure attendance, PEP meetings, and achievements are recorded.", severity: "warning" }],
    };
  }

  // ── Attendance Profile ────────────────────────────────────────────────
  const recs30d = education_records.filter(r => {
    const d = daysBetween(r.date, today);
    return d >= 0 && d <= 30;
  });
  const recs90d = education_records.filter(r => {
    const d = daysBetween(r.date, today);
    return d >= 0 && d <= 90;
  });

  const attendanceRecs30d = recs30d.filter(r => r.attendance_status !== null);
  const present = attendanceRecs30d.filter(r => r.attendance_status === "present").length;
  const absent = attendanceRecs30d.filter(r => r.attendance_status === "absent").length;
  const late = attendanceRecs30d.filter(r => r.attendance_status === "late").length;
  const excluded = attendanceRecs30d.filter(r => r.attendance_status === "excluded").length;

  const attendanceRate = rate(present + late, attendanceRecs30d.length);

  const nonExcluded = attendanceRecs30d.filter(r => r.attendance_status !== "excluded");
  const onTime = nonExcluded.filter(r => r.attendance_status === "present").length;
  const punctualityRate = rate(onTime, nonExcluded.length);

  // Exclusions 90d
  const exclusions90d = recs90d.filter(r => r.attendance_status === "excluded" || r.record_type === "exclusion");
  const childrenWithExclusions = [...new Set(exclusions90d.map(r => r.child_id))];

  const attendanceProfile: AttendanceProfile = {
    total_attendance_records_30d: attendanceRecs30d.length,
    present_count: present,
    absent_count: absent,
    late_count: late,
    excluded_count: excluded,
    attendance_rate: attendanceRate,
    punctuality_rate: punctualityRate,
    children_with_exclusions_90d: childrenWithExclusions,
    exclusion_count_90d: exclusions90d.length,
  };

  // ── PEP Profile ──────────────────────────────────────────────────────
  const peps90d = recs90d.filter(r => r.record_type === "pep_meeting" || r.linked_pep);
  const childrenWithPep = [...new Set(peps90d.map(r => r.child_id))];
  const childrenWithoutPep = child_ids.filter(id => !childrenWithPep.includes(id));
  const pepPerChild = total_children > 0
    ? Math.round((peps90d.length / total_children) * 10) / 10
    : null;

  const pepProfile: PepProfile = {
    total_pep_meetings_90d: peps90d.length,
    children_with_pep_90d: childrenWithPep,
    children_without_pep_90d: childrenWithoutPep,
    pep_per_child: pepPerChild,
  };

  // ── Achievement Profile ──────────────────────────────────────────────
  const achievements90d = recs90d.filter(r => r.record_type === "achievement").length;
  const attainment90d = recs90d.filter(r => r.record_type === "attainment").length;
  const concerns90d = recs90d.filter(r => r.record_type === "concern");
  const resolvedConcerns = concerns90d.filter(r => r.status === "resolved" || r.status === "monitoring");
  const concernResolutionRate = rateOf(resolvedConcerns, concerns90d);

  const achievementProfile: AchievementProfile = {
    achievements_90d: achievements90d,
    attainment_records_90d: attainment90d,
    concerns_90d: concerns90d.length,
    concern_resolution_rate: concernResolutionRate,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 50;

  // Attendance (±15)
  if (attendanceRecs30d.length > 0) {
    if (meets(attendanceRate, 95)) score += 10;
    else if (meets(attendanceRate, 85)) score += 5;
    else if (meets(attendanceRate, 75)) score += 0;
    else if (below(attendanceRate, 75)) score -= 8;

    // Punctuality bonus
    if (meets(punctualityRate, 95)) score += 3;
    else if (below(punctualityRate, 70)) score -= 3;
  }

  // Exclusions (±10)
  if (exclusions90d.length === 0) score += 5;
  else if (exclusions90d.length <= 1) score -= 2;
  else score -= 8;

  // PEP compliance (±10)
  if (childrenWithoutPep.length === 0 && total_children > 0) score += 6;
  else if (childrenWithoutPep.length === 1) score += 2;
  else if (childrenWithoutPep.length > 1) score -= 5;

  // PEP frequency
  if (pepPerChild !== null && pepPerChild >= 1) score += 3;
  else if (peps90d.length === 0 && total_children > 0) score -= 4;

  // Achievements & attainment (±8)
  if (achievements90d >= 2) score += 4;
  else if (achievements90d >= 1) score += 2;

  if (attainment90d >= 1) score += 2;

  // Concerns management (±5)
  if (concerns90d.length > 0) {
    if (meets(concernResolutionRate, 80)) score += 3;
    else if (below(concernResolutionRate, 50)) score -= 4;
  }

  // Recording quality — having outcomes and follow-ups
  const outcomeRate = rateOf(recs90d.filter(r => r.has_outcome), recs90d);
  if (meets(outcomeRate, 60)) score += 3;
  else if (below(outcomeRate, 30)) score -= 2;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(attendanceRate, 90)) strengths.push(`${formatRate(attendanceRate)} attendance rate in the last 30 days — children are consistently attending school.`);
  if (exclusions90d.length === 0 && recs90d.length > 0) strengths.push("Zero exclusions in 90 days — evidence of positive behaviour support.");
  if (childrenWithoutPep.length === 0 && total_children > 0 && peps90d.length > 0) strengths.push("All children have had a PEP meeting in the last 90 days — strong education planning.");
  if (achievements90d >= 2) strengths.push(`${achievements90d} education achievements recorded in 90 days — celebrating children's progress.`);
  if (meets(punctualityRate, 95)) strengths.push(`${formatRate(punctualityRate)} punctuality — children are arriving on time consistently.`);
  if (meets(concernResolutionRate, 80) && concerns90d.length > 0) strengths.push(`${formatRate(concernResolutionRate)} of education concerns resolved or being monitored — proactive support.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (below(attendanceRate, 80)) concerns.push(`Attendance rate is ${formatRate(attendanceRate)} — below the 90% expectation for looked after children.`);
  if (exclusions90d.length > 0) concerns.push(`${exclusions90d.length} exclusion${exclusions90d.length > 1 ? "s" : ""} in 90 days across ${childrenWithExclusions.length} child${childrenWithExclusions.length > 1 ? "ren" : ""}.`);
  if (childrenWithoutPep.length > 0) concerns.push(`${childrenWithoutPep.length} child${childrenWithoutPep.length > 1 ? "ren" : ""} without a PEP meeting in 90 days.`);
  if (absent > 0 && attendanceRecs30d.length > 0) concerns.push(`${absent} absence${absent > 1 ? "s" : ""} recorded in 30 days — investigate reasons and support barriers.`);
  if (below(concernResolutionRate, 50) && concerns90d.length > 0) concerns.push(`Only ${formatRate(concernResolutionRate)} of education concerns are resolved or being monitored.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: EducationRecommendation[] = [];
  let rank = 1;

  if (below(attendanceRate, 85)) {
    recs.push({ rank: rank++, recommendation: "Develop attendance improvement plans — identify and address barriers to school attendance.", urgency: "immediate", regulatory_ref: "Reg 8" });
  }
  if (childrenWithoutPep.length > 0) {
    recs.push({ rank: rank++, recommendation: `Schedule PEP meetings for ${childrenWithoutPep.length} child${childrenWithoutPep.length > 1 ? "ren" : ""} without recent reviews — PEPs should be termly.`, urgency: "immediate", regulatory_ref: "Reg 29" });
  }
  if (exclusions90d.length > 1) {
    recs.push({ rank: rank++, recommendation: "Review exclusion patterns — consider whether additional behaviour support or EHCP assessment is needed.", urgency: "soon", regulatory_ref: "Reg 8" });
  }
  if (achievements90d === 0 && recs90d.length > 0) {
    recs.push({ rank: rank++, recommendation: "Record and celebrate education achievements — positive recognition motivates children.", urgency: "planned", regulatory_ref: "Reg 8" });
  }
  if (below(outcomeRate, 50)) {
    recs.push({ rank: rank++, recommendation: "Improve outcome recording in education entries — document what action was taken and what resulted.", urgency: "planned", regulatory_ref: "Reg 29" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: EducationInsight[] = [];

  if (below(attendanceRate, 75)) {
    insights.push({ text: `Attendance at ${formatRate(attendanceRate)} is significantly below the expected 90% for looked after children. Ofsted will examine what the home is doing to support attendance.`, severity: "critical" });
  }
  if (exclusions90d.length >= 2) {
    insights.push({ text: `${exclusions90d.length} exclusions in 90 days suggests behaviour support may need strengthening. Ofsted will ask about advocacy, EHCP provision, and whether exclusion is being used proportionately.`, severity: "critical" });
  }
  if (childrenWithoutPep.length > 0) {
    insights.push({ text: `${childrenWithoutPep.length} child${childrenWithoutPep.length > 1 ? "ren" : ""} without a PEP in 90 days. PEPs are a statutory requirement — inspectors will check every child has one.`, severity: "critical" });
  }
  if (meets(attendanceRate, 95) && achievements90d >= 1 && exclusions90d.length === 0) {
    insights.push({ text: "Excellent education profile: high attendance, no exclusions, and achievements being celebrated. This demonstrates the home is supporting children's education effectively.", severity: "positive" });
  }
  if (achievements90d >= 2) {
    insights.push({ text: `${achievements90d} education achievements in 90 days. Recording and celebrating progress builds children's confidence and self-esteem.`, severity: "positive" });
  }
  if (pepPerChild !== null && pepPerChild >= 1 && childrenWithoutPep.length === 0 && peps90d.length > 0) {
    insights.push({ text: "PEP compliance is strong — all children have active education plans. This is crucial evidence for Ofsted.", severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = "Outstanding education engagement — high attendance, active PEPs, and children achieving.";
  } else if (rating === "good") {
    headline = `Good education support — ${formatRate(attendanceRate)} attendance with ${peps90d.length} PEP meeting${peps90d.length !== 1 ? "s" : ""} in 90 days.`;
  } else if (rating === "adequate") {
    headline = "Adequate education engagement — improvements needed in attendance, PEPs, or achievement recording.";
  } else {
    headline = "Education engagement is inadequate — children's education is not being sufficiently supported.";
  }

  return {
    education_rating: rating,
    education_score: score,
    headline,
    attendance: attendanceProfile,
    pep: pepProfile,
    achievements: achievementProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Defaults ──────────────────────────────────────────────────────────

function emptyAttendance(): AttendanceProfile {
  return { total_attendance_records_30d: 0, present_count: 0, absent_count: 0, late_count: 0, excluded_count: 0, attendance_rate: null, punctuality_rate: null, children_with_exclusions_90d: [], exclusion_count_90d: 0 };
}

function emptyPep(): PepProfile {
  return { total_pep_meetings_90d: 0, children_with_pep_90d: [], children_without_pep_90d: [], pep_per_child: null };
}

function emptyAchievements(): AchievementProfile {
  return { achievements_90d: 0, attainment_records_90d: 0, concerns_90d: 0, concern_resolution_rate: null };
}
