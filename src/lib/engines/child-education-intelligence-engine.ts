// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD EDUCATION & LEARNING INTELLIGENCE ENGINE
//
// Per-child education analysis: attendance patterns, attainment progress,
// PEP compliance, EHCP status, exclusion history, homework engagement,
// school engagement events, tutoring effectiveness, and achievements.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 8 (promotion of educational achievement),
// Reg 10 (enjoyment and achievement), Reg 25 (Virtual School Head).
// SCCIF: "Education and learning" — "Are children making good progress
// in their education?"
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface EducationRecordInput {
  id: string;
  date: string;
  record_type: string;         // attendance, exclusion, pep_meeting, attainment, achievement, concern, provision_change
  school: string | null;
  attendance_status: string | null; // present, absent_authorised, absent_unauthorised, late, excluded, part_day
  linked_pep: boolean;
  status: string;              // open, resolved, monitoring
  details: string;
}

export interface EduAttendanceInput {
  id: string;
  date: string;
  attendance_code: string;     // "/" present, "\\" present pm, "L" late, "U" unauthorised, "N" no reason, "O" other, "I" illness, "M" medical, "E" excluded
  session: string;             // am, pm, full_day
}

export interface EhcpInput {
  id: string;
  status: string;              // active, draft, under_review, ceased
  plan_type: string;           // ehcp, sen_support, none
  review_date: string | null;
  annual_review_due: string | null;
  needs_areas: string[];
  provision_in_place: boolean;
}

export interface HomeworkSessionInput {
  id: string;
  date: string;
  subject: string;
  duration_minutes: number;
  completion_level: string;    // completed, partial, not_started, refused
  support_needed: string;      // none, minimal, moderate, significant
  engagement: string;          // enthusiastic, willing, reluctant, refused
}

export interface TutoringInput {
  id: string;
  date: string;
  subject: string;
  duration_minutes: number;
  tutor_feedback: string;
  progress_rating: number;     // 1-5
}

export interface SchoolEngagementInput {
  id: string;
  date: string;
  event_type: string;          // parents_evening, open_day, school_trip, award_ceremony, sports_day, performance, etc.
  attended: boolean;
  staff_attended: boolean;
  child_feedback: string;
}

export interface PepRecordInput {
  id: string;
  date: string;
  attendees: string[];
  targets_set: number;
  targets_achieved: number;
  next_review_date: string | null;
  virtual_school_involved: boolean;
  child_participated: boolean;
  pupil_premium_discussed: boolean;
}

export interface ChildEducationIntelligenceInput {
  today: string;
  child_id: string;
  child_name: string;
  school_name: string | null;
  education_records: EducationRecordInput[];
  attendance_records: EduAttendanceInput[];
  ehcp: EhcpInput | null;
  homework_sessions: HomeworkSessionInput[];
  tutoring_sessions: TutoringInput[];
  school_engagement_events: SchoolEngagementInput[];
  pep_records: PepRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type EducationHealth = "outstanding" | "good" | "requires_improvement" | "inadequate" | "insufficient_data";
export type AttendanceBand = "excellent" | "good" | "concern" | "persistent_absence" | "severe_absence" | "insufficient_data";

export interface AttendanceAnalysis {
  overall_pct: number | null;
  band: AttendanceBand;
  present_count: number;
  absent_count: number;
  late_count: number;
  unauthorised_count: number;
  excluded_count: number;
  total_sessions: number;
  trend: "improving" | "stable" | "declining" | "insufficient_data";
  sessions_30d_pct: number | null;
  sessions_60d_pct: number | null;
}

export interface ExclusionAnalysis {
  total_90d: number;
  total_all_time: number;
  days_lost: number;
  most_recent_date: string | null;
  pattern_detected: boolean;
  reintegration_in_progress: boolean;
}

export interface PepCompliance {
  total_peps: number;
  peps_last_12m: number;
  latest_pep_date: string | null;
  next_review_date: string | null;
  pep_current: boolean;          // had a PEP within last 6 months
  targets_set: number;
  targets_achieved: number;
  target_achievement_rate: number | null;
  virtual_school_involved_rate: number | null;
  child_participation_rate: number | null;
  pupil_premium_discussed_rate: number | null;
}

export interface EhcpStatus {
  has_ehcp: boolean;
  plan_type: string | null;
  status: string | null;
  review_overdue: boolean;
  needs_areas: string[];
  provision_in_place: boolean;
}

export interface HomeworkAnalysis {
  total_sessions_30d: number;
  completion_rate: number | null;       // 0-100
  engagement_rate: number | null;       // 0-100 (enthusiastic + willing)
  avg_duration_minutes: number | null;
  support_level: string;         // none, minimal, moderate, significant
  subjects: string[];
}

export interface TutoringAnalysis {
  total_sessions_90d: number;
  avg_progress_rating: number | null;   // 1-5
  subjects: string[];
  total_hours: number;
}

export interface EngagementAnalysis {
  total_events_90d: number;
  attendance_rate: number | null;       // 0-100
  staff_attendance_rate: number | null; // 0-100
  event_types: string[];
}

export interface EducationAchievement {
  date: string;
  description: string;
}

export type RecommendationUrgency = "immediate" | "soon" | "planned";

export interface EducationRecommendation {
  rank: number;
  recommendation: string;
  urgency: RecommendationUrgency;
  domain: string;
  regulatory_ref: string;
}

export interface EducationInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ChildEducationIntelligenceResult {
  generated_at: string;
  child_id: string;
  child_name: string;
  school_name: string | null;
  education_health: EducationHealth;
  education_score: number | null;         // 0-100
  headline: string;
  attendance: AttendanceAnalysis;
  exclusions: ExclusionAnalysis;
  pep_compliance: PepCompliance;
  ehcp_status: EhcpStatus;
  homework: HomeworkAnalysis;
  tutoring: TutoringAnalysis;
  engagement: EngagementAnalysis;
  achievements: EducationAchievement[];
  strengths: string[];
  concerns: string[];
  recommendations: EducationRecommendation[];
  insights: EducationInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(today: string, date: string): number {
  return Math.round(
    (new Date(today).getTime() - new Date(date).getTime()) / 86_400_000,
  );
}

function isWithin(today: string, date: string, days: number): boolean {
  const da = daysAgo(today, date);
  return da >= 0 && da <= days;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 100;
}

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

const PRESENT_CODES = ["/", "\\", "L"]; // present, present pm, late (counts as present)
const ABSENT_CODES = ["U", "N", "O", "I", "M"]; // various absence
const EXCLUDED_CODES = ["E"];

// ── Main Computation ────────────────────────────────────────────────────────

export function computeChildEducationIntelligence(
  input: ChildEducationIntelligenceInput,
): ChildEducationIntelligenceResult {
  const { today, child_id, child_name, school_name, education_records, attendance_records, ehcp, homework_sessions, tutoring_sessions, school_engagement_events, pep_records } = input;

  // ── Attendance Analysis ───────────────────────────────────────────────
  // Use formal attendance_records if available, fallback to education_records
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let unauthorisedCount = 0;
  let excludedSessionCount = 0;
  let totalSessions = 0;

  if (attendance_records.length > 0) {
    for (const r of attendance_records) {
      totalSessions++;
      if (r.attendance_code === "/" || r.attendance_code === "\\") presentCount++;
      else if (r.attendance_code === "L") { presentCount++; lateCount++; }
      else if (r.attendance_code === "U" || r.attendance_code === "N") { absentCount++; unauthorisedCount++; }
      else if (r.attendance_code === "E") { absentCount++; excludedSessionCount++; }
      else absentCount++;
    }
  } else {
    // Fallback: derive from education records with attendance_status
    const attendanceRecords = education_records.filter((r) => r.attendance_status);
    for (const r of attendanceRecords) {
      totalSessions++;
      switch (r.attendance_status) {
        case "present": presentCount++; break;
        case "late": presentCount++; lateCount++; break;
        case "absent_authorised": absentCount++; break;
        case "absent_unauthorised": absentCount++; unauthorisedCount++; break;
        case "excluded": absentCount++; excludedSessionCount++; break;
        case "part_day": presentCount++; break;
        default: absentCount++; break;
      }
    }
  }

  // pct(0,0) returns 100 — so a child with NO attendance records (e.g. newly
  // placed, or NEET) would otherwise read 100% / "excellent". Treat zero sessions
  // as insufficient_data so it can't masquerade as perfect attendance.
  const hasAttendanceData = totalSessions > 0;
  const overallAttendancePct = hasAttendanceData ? pct(presentCount, totalSessions) : 0;
  const attendanceBand: AttendanceBand =
    !hasAttendanceData ? "insufficient_data" :
    overallAttendancePct >= 96 ? "excellent" :
    overallAttendancePct >= 90 ? "good" :
    overallAttendancePct >= 85 ? "concern" :
    overallAttendancePct >= 50 ? "persistent_absence" :
    "severe_absence";

  // Attendance trend: compare 30d vs 30-60d
  let sessions30dPct = 0;
  let sessions60dPct = 0;

  if (attendance_records.length > 0) {
    const rec30d = attendance_records.filter((r) => isWithin(today, r.date, 30));
    const rec60d = attendance_records.filter((r) => isWithin(today, r.date, 60) && !isWithin(today, r.date, 30));
    const present30d = rec30d.filter((r) => PRESENT_CODES.includes(r.attendance_code)).length;
    const present60d = rec60d.filter((r) => PRESENT_CODES.includes(r.attendance_code)).length;
    sessions30dPct = pct(present30d, rec30d.length);
    sessions60dPct = pct(present60d, rec60d.length);
  } else {
    const eduAtt = education_records.filter((r) => r.attendance_status);
    const att30d = eduAtt.filter((r) => isWithin(today, r.date, 30));
    const att60d = eduAtt.filter((r) => isWithin(today, r.date, 60) && !isWithin(today, r.date, 30));
    const present30d = att30d.filter((r) => r.attendance_status === "present" || r.attendance_status === "late" || r.attendance_status === "part_day").length;
    const present60d = att60d.filter((r) => r.attendance_status === "present" || r.attendance_status === "late" || r.attendance_status === "part_day").length;
    sessions30dPct = pct(present30d, att30d.length);
    sessions60dPct = pct(present60d, att60d.length);
  }

  const attendanceTrend: "improving" | "stable" | "declining" | "insufficient_data" =
    totalSessions < 5 ? "insufficient_data" :
    sessions30dPct > sessions60dPct + 5 ? "improving" :
    sessions30dPct < sessions60dPct - 5 ? "declining" :
    "stable";

  const attendance: AttendanceAnalysis = {
    overall_pct: overallAttendancePct,
    band: attendanceBand,
    present_count: presentCount,
    absent_count: absentCount,
    late_count: lateCount,
    unauthorised_count: unauthorisedCount,
    excluded_count: excludedSessionCount,
    total_sessions: totalSessions,
    trend: attendanceTrend,
    sessions_30d_pct: sessions30dPct,
    sessions_60d_pct: sessions60dPct,
  };

  // ── Exclusion Analysis ────────────────────────────────────────────────
  const exclusionRecords = education_records.filter((r) => r.record_type === "exclusion");
  const exclusions90d = exclusionRecords.filter((r) => isWithin(today, r.date, 90));
  const mostRecentExclusion = exclusionRecords.length > 0
    ? exclusionRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
    : null;
  const reintegrationInProgress = exclusionRecords.some((r) => r.status === "monitoring");
  const patternDetected = exclusions90d.length >= 2;

  const exclusions: ExclusionAnalysis = {
    total_90d: exclusions90d.length,
    total_all_time: exclusionRecords.length,
    days_lost: exclusionRecords.length, // approximate: 1 record = 1 exclusion event
    most_recent_date: mostRecentExclusion ? mostRecentExclusion.slice(0, 10) : null,
    pattern_detected: patternDetected,
    reintegration_in_progress: reintegrationInProgress,
  };

  // ── PEP Compliance ────────────────────────────────────────────────────
  // Use pep_records if available, fallback to education_records with record_type === "pep_meeting"
  let pepData: {
    total: number;
    last12m: number;
    latestDate: string | null;
    nextReview: string | null;
    targetsSet: number;
    targetsAchieved: number;
    vshRate: number;
    childParticipationRate: number;
    ppDiscussedRate: number;
  };

  if (pep_records.length > 0) {
    const last12m = pep_records.filter((p) => isWithin(today, p.date, 365));
    const sorted = [...pep_records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = sorted[0];
    pepData = {
      total: pep_records.length,
      last12m: last12m.length,
      latestDate: latest?.date.slice(0, 10) ?? null,
      nextReview: latest?.next_review_date?.slice(0, 10) ?? null,
      targetsSet: pep_records.reduce((s, p) => s + p.targets_set, 0),
      targetsAchieved: pep_records.reduce((s, p) => s + p.targets_achieved, 0),
      vshRate: pct(pep_records.filter((p) => p.virtual_school_involved).length, pep_records.length),
      childParticipationRate: pct(pep_records.filter((p) => p.child_participated).length, pep_records.length),
      ppDiscussedRate: pct(pep_records.filter((p) => p.pupil_premium_discussed).length, pep_records.length),
    };
  } else {
    const pepMeetings = education_records.filter((r) => r.record_type === "pep_meeting");
    const last12m = pepMeetings.filter((r) => isWithin(today, r.date, 365));
    const sorted = [...pepMeetings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = sorted[0];
    pepData = {
      total: pepMeetings.length,
      last12m: last12m.length,
      latestDate: latest?.date.slice(0, 10) ?? null,
      nextReview: null,
      targetsSet: 0,
      targetsAchieved: 0,
      vshRate: 0,
      childParticipationRate: 0,
      ppDiscussedRate: 0,
    };
  }

  const pepCurrent = pepData.latestDate ? daysAgo(today, pepData.latestDate) <= 180 : false;

  const pep_compliance: PepCompliance = {
    total_peps: pepData.total,
    peps_last_12m: pepData.last12m,
    latest_pep_date: pepData.latestDate,
    next_review_date: pepData.nextReview,
    pep_current: pepCurrent,
    targets_set: pepData.targetsSet,
    targets_achieved: pepData.targetsAchieved,
    target_achievement_rate: pct(pepData.targetsAchieved, pepData.targetsSet),
    virtual_school_involved_rate: pepData.vshRate,
    child_participation_rate: pepData.childParticipationRate,
    pupil_premium_discussed_rate: pepData.ppDiscussedRate,
  };

  // ── EHCP Status ───────────────────────────────────────────────────────
  const ehcpStatus: EhcpStatus = {
    has_ehcp: ehcp?.plan_type === "ehcp" || false,
    plan_type: ehcp?.plan_type ?? null,
    status: ehcp?.status ?? null,
    review_overdue: ehcp?.annual_review_due ? daysAgo(today, ehcp.annual_review_due) > 0 : false,
    needs_areas: ehcp?.needs_areas ?? [],
    provision_in_place: ehcp?.provision_in_place ?? false,
  };

  // ── Homework Analysis ─────────────────────────────────────────────────
  const hw30d = homework_sessions.filter((h) => isWithin(today, h.date, 30));
  const hwCompleted = hw30d.filter((h) => h.completion_level === "completed" || h.completion_level === "partial");
  const hwEngaged = hw30d.filter((h) => h.engagement === "enthusiastic" || h.engagement === "willing");
  const hwDurations = hw30d.map((h) => h.duration_minutes);
  const hwSubjects = [...new Set(hw30d.map((h) => h.subject))];

  // Support level: mode of support_needed
  const supportCounts = new Map<string, number>();
  for (const h of hw30d) {
    supportCounts.set(h.support_needed, (supportCounts.get(h.support_needed) ?? 0) + 1);
  }
  const supportLevel = [...supportCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";

  const homework: HomeworkAnalysis = {
    total_sessions_30d: hw30d.length,
    completion_rate: pct(hwCompleted.length, hw30d.length),
    engagement_rate: pct(hwEngaged.length, hw30d.length),
    avg_duration_minutes: hwDurations.length > 0 ? Math.round(avg(hwDurations)) : null,
    support_level: supportLevel,
    subjects: hwSubjects,
  };

  // ── Tutoring Analysis ─────────────────────────────────────────────────
  const tutor90d = tutoring_sessions.filter((t) => isWithin(today, t.date, 90));
  const tutorRatings = tutor90d.map((t) => t.progress_rating);
  const tutorSubjects = [...new Set(tutor90d.map((t) => t.subject))];
  const tutorHours = Math.round((tutor90d.reduce((s, t) => s + t.duration_minutes, 0) / 60) * 10) / 10;

  const tutoring: TutoringAnalysis = {
    total_sessions_90d: tutor90d.length,
    avg_progress_rating: tutorRatings.length > 0 ? Math.round(avg(tutorRatings) * 10) / 10 : null,
    subjects: tutorSubjects,
    total_hours: tutorHours,
  };

  // ── Engagement Analysis ───────────────────────────────────────────────
  const engagement90d = school_engagement_events.filter((e) => isWithin(today, e.date, 90));
  const attended = engagement90d.filter((e) => e.attended);
  const staffAttended = engagement90d.filter((e) => e.staff_attended);
  const eventTypes = [...new Set(engagement90d.map((e) => e.event_type))];

  const engagement: EngagementAnalysis = {
    total_events_90d: engagement90d.length,
    attendance_rate: pct(attended.length, engagement90d.length),
    staff_attendance_rate: pct(staffAttended.length, engagement90d.length),
    event_types: eventTypes,
  };

  // ── Achievements ──────────────────────────────────────────────────────
  const achievementRecords = education_records
    .filter((r) => r.record_type === "achievement" || r.record_type === "attainment")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const achievements: EducationAchievement[] = achievementRecords.slice(0, 5).map((r) => ({
    date: r.date.slice(0, 10),
    description: r.details.slice(0, 200),
  }));

  // ── Education Score (0-100) ───────────────────────────────────────────
  let score = 50;

  // Attendance — only score when there are attendance records. A child with no
  // attendance data must not read as excellent (+15) NOR as severe absence (-20).
  if (hasAttendanceData) {
    if (overallAttendancePct >= 96) score += 15;
    else if (overallAttendancePct >= 90) score += 8;
    else if (overallAttendancePct >= 85) score += 0;
    else if (overallAttendancePct >= 50) score -= 10;
    else score -= 20;
  }

  if (attendanceTrend === "improving") score += 5;
  else if (attendanceTrend === "declining") score -= 5;

  // Exclusions
  if (exclusions90d.length === 0) score += 5;
  else if (exclusions90d.length === 1) score -= 5;
  else score -= 10;

  // PEP
  if (pepCurrent) score += 5;
  else if (pepData.total === 0) score -= 10;
  else score -= 5;

  if ((pep_compliance.target_achievement_rate ?? 0) >= 75) score += 5;
  else if ((pep_compliance.target_achievement_rate ?? 0) < 50 && pepData.targetsSet > 0) score -= 3;

  // EHCP
  if (ehcpStatus.has_ehcp && ehcpStatus.review_overdue) score -= 5;
  if (ehcpStatus.has_ehcp && ehcpStatus.provision_in_place) score += 3;

  // Homework
  if (homework.total_sessions_30d >= 10 && (homework.completion_rate ?? 0) >= 80) score += 5;
  else if (homework.total_sessions_30d === 0) score -= 3;

  // Tutoring
  if (tutor90d.length > 0 && (tutoring.avg_progress_rating ?? 0) >= 3.5) score += 3;

  // Achievements
  if (achievements.length >= 2) score += 5;
  else if (achievements.length === 1) score += 2;

  // Engagement
  if ((engagement.attendance_rate ?? 0) >= 80 && engagement90d.length >= 2) score += 3;

  // Concerns
  const openConcerns = education_records.filter((r) => r.record_type === "concern" && r.status !== "resolved");
  if (openConcerns.length > 0) score -= openConcerns.length * 3;

  score = clamp(Math.round(score), 0, 100);

  const educationHealth: EducationHealth =
    totalSessions === 0 && education_records.length === 0 ? "insufficient_data" :
    score >= 75 ? "outstanding" :
    score >= 55 ? "good" :
    score >= 35 ? "requires_improvement" :
    "inadequate";

  // ── Headline ──────────────────────────────────────────────────────────
  const headlineParts: string[] = [];
  headlineParts.push(`${child_name}'s education is rated ${educationHealth.replace(/_/g, " ")}`);
  if (totalSessions > 0) {
    headlineParts.push(`Attendance: ${overallAttendancePct}%`);
  }
  if (exclusions90d.length > 0) {
    headlineParts.push(`${exclusions90d.length} exclusion(s) in 90 days`);
  }
  if (!pepCurrent) {
    headlineParts.push("PEP overdue");
  }
  const headline = headlineParts.join(". ") + ".";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (overallAttendancePct >= 96) {
    strengths.push(`Excellent attendance at ${overallAttendancePct}% — above the 96% national expectation for looked after children.`);
  } else if (overallAttendancePct >= 90) {
    strengths.push(`Good attendance at ${overallAttendancePct}% — positive engagement with education.`);
  }

  if (attendanceTrend === "improving") {
    strengths.push("Attendance trend is improving — recent engagement is stronger than earlier in the period.");
  }

  if (pepCurrent && pep_compliance.child_participation_rate === 100) {
    strengths.push(`${child_name} participates in all PEP meetings — voice is central to education planning.`);
  }

  if ((pep_compliance.target_achievement_rate ?? 0) >= 75 && pepData.targetsSet > 0) {
    strengths.push(`${pep_compliance.target_achievement_rate}% of PEP targets achieved — strong progress against education plan.`);
  }

  if (achievements.length >= 2) {
    strengths.push(`${achievements.length} achievements recorded — ${child_name} is being recognised for educational progress.`);
  }

  if ((homework.completion_rate ?? 0) >= 80 && homework.total_sessions_30d >= 5) {
    strengths.push(`Homework completion rate at ${homework.completion_rate}% — consistent academic engagement at home.`);
  }

  if ((tutoring.avg_progress_rating ?? 0) >= 4 && tutor90d.length > 0) {
    strengths.push(`Tutoring showing strong progress (avg rating ${tutoring.avg_progress_rating}/5) — additional support is making a difference.`);
  }

  if (exclusions.total_all_time === 0) {
    strengths.push("No exclusions recorded — positive behaviour in school environment.");
  }

  if (engagement.attendance_rate === 100 && engagement90d.length >= 2) {
    strengths.push(`${child_name} attended all ${engagement90d.length} school engagement events — involvement in school life is excellent.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (attendanceBand === "persistent_absence" || attendanceBand === "severe_absence") {
    concerns.push(`Attendance at ${overallAttendancePct}% constitutes ${attendanceBand === "severe_absence" ? "severe" : "persistent"} absence — urgent intervention required (Reg 8).`);
  } else if (attendanceBand === "concern") {
    concerns.push(`Attendance at ${overallAttendancePct}% is below the 90% threshold — monitoring and support needed.`);
  }

  if (attendanceTrend === "declining") {
    concerns.push("Attendance trend is declining — recent attendance is worse than earlier period. Root cause analysis needed.");
  }

  if (unauthorisedCount > 0) {
    concerns.push(`${unauthorisedCount} unauthorised absence(s) recorded — these need investigation and follow-up with school.`);
  }

  if (exclusions90d.length >= 2) {
    concerns.push(`${exclusions90d.length} exclusions in 90 days — pattern detected. Emergency PEP and behaviour support review needed.`);
  } else if (exclusions90d.length === 1) {
    concerns.push("1 exclusion in 90 days — reintegration support must be in place and monitored.");
  }

  if (!pepCurrent) {
    concerns.push(`PEP is not current (last: ${pepData.latestDate ?? "none"}) — every LAC child must have a current PEP reviewed termly (Reg 8).`);
  }

  if (ehcpStatus.has_ehcp && ehcpStatus.review_overdue) {
    concerns.push("EHCP annual review is overdue — statutory timescales must be met. Contact Virtual School Head.");
  }

  if (openConcerns.length > 0) {
    concerns.push(`${openConcerns.length} open education concern(s) requiring follow-up — ensure actions are tracked and resolved.`);
  }

  if (homework.total_sessions_30d >= 5 && (homework.completion_rate ?? 0) < 50) {
    concerns.push(`Homework completion rate at ${homework.completion_rate}% — consider additional support or adapted homework approach.`);
  }

  if (homework.total_sessions_30d >= 5 && (homework.engagement_rate ?? 0) < 50) {
    concerns.push("Low homework engagement — explore barriers with child and consider if current approach is meeting their needs.");
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: EducationRecommendation[] = [];
  let rank = 0;

  if (attendanceBand === "persistent_absence" || attendanceBand === "severe_absence") {
    recommendations.push({
      rank: ++rank,
      recommendation: `Convene emergency education meeting with school, Virtual School Head, and social worker to address ${overallAttendancePct}% attendance. Develop targeted attendance plan with morning support.`,
      urgency: "immediate",
      domain: "attendance",
      regulatory_ref: "Reg 8",
    });
  }

  if (exclusions.pattern_detected) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Request emergency PEP meeting. Multiple exclusions suggest current provision or behaviour support plan may be inadequate. Consider EHCP assessment if not already in place.",
      urgency: "immediate",
      domain: "exclusion",
      regulatory_ref: "Reg 8",
    });
  }

  if (!pepCurrent) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Schedule PEP review within 10 working days. Ensure Virtual School Head is invited, pupil premium is discussed, and child participates meaningfully.",
      urgency: "soon",
      domain: "pep",
      regulatory_ref: "Reg 8",
    });
  }

  if (ehcpStatus.has_ehcp && ehcpStatus.review_overdue) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Contact Local Authority SEND team to arrange overdue EHCP annual review. Ensure all professionals and the child contribute.",
      urgency: "soon",
      domain: "ehcp",
      regulatory_ref: "Reg 8",
    });
  }

  if (attendanceTrend === "declining") {
    recommendations.push({
      rank: ++rank,
      recommendation: "Investigate declining attendance pattern. Review morning routine, transport, school relationships, and any bullying or anxiety concerns with the child.",
      urgency: "soon",
      domain: "attendance",
      regulatory_ref: "Reg 8",
    });
  }

  if ((pep_compliance.virtual_school_involved_rate ?? 0) < 100 && pepData.total > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Ensure Virtual School Head attends all future PEP meetings. VSH oversight is a statutory requirement for LAC education planning.",
      urgency: "planned",
      domain: "pep",
      regulatory_ref: "Reg 25",
    });
  }

  if ((pep_compliance.child_participation_rate ?? 0) < 100 && pepData.total > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Improve child participation in PEP meetings (currently ${pep_compliance.child_participation_rate}%). Prepare the child beforehand and ensure their views shape targets.`,
      urgency: "planned",
      domain: "voice",
      regulatory_ref: "Reg 7",
    });
  }

  if (homework.total_sessions_30d >= 5 && (homework.completion_rate ?? 0) < 50) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review homework approach — consider adapted tasks, reduced volume, or different support arrangements. Discuss with school and child.",
      urgency: "planned",
      domain: "homework",
      regulatory_ref: "Reg 8",
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: EducationInsight[] = [];

  if (educationHealth === "inadequate") {
    insights.push({
      severity: "critical",
      text: `${child_name}'s education is rated inadequate. Ofsted will scrutinise whether the home is promoting educational achievement effectively (Reg 8). Urgent multi-agency education planning is needed — consider whether current school provision is appropriate and whether additional support (tutoring, mentoring, therapeutic input) has been explored.`,
    });
  }

  if (exclusions.pattern_detected) {
    insights.push({
      severity: "critical",
      text: `Multiple exclusions detected for ${child_name}. Repeated exclusions of LAC children can indicate inadequate matching between the child's needs and educational provision. This is a pattern that Ofsted inspectors specifically examine — ensure the Virtual School Head is actively involved.`,
    });
  }

  if (attendanceBand === "persistent_absence") {
    insights.push({
      severity: "warning",
      text: `${child_name}'s attendance at ${overallAttendancePct}% constitutes persistent absence. National data shows LAC already have lower attendance than peers — persistent absence compounds educational disadvantage. Investigate root causes: anxiety, bullying, transport, curriculum engagement.`,
    });
  }

  if (!pepCurrent && pepData.total === 0) {
    insights.push({
      severity: "warning",
      text: `No PEP on record for ${child_name}. Every looked after child must have a Personal Education Plan reviewed termly. This is a fundamental compliance gap that inspectors will immediately identify.`,
    });
  }

  if (attendanceTrend === "improving" && overallAttendancePct >= 90) {
    insights.push({
      severity: "positive",
      text: `${child_name}'s attendance is improving and now at ${overallAttendancePct}%. Consistent education engagement builds stability, routine, and aspiration — key protective factors for LAC children.`,
    });
  }

  if (achievements.length >= 2 && exclusions90d.length === 0) {
    insights.push({
      severity: "positive",
      text: `${child_name} has ${achievements.length} educational achievements with no exclusions. This combination demonstrates that the educational placement is meeting their needs and the home is actively promoting achievement (Reg 8, Reg 10).`,
    });
  }

  if (pepCurrent && (pep_compliance.target_achievement_rate ?? 0) >= 75) {
    insights.push({
      severity: "positive",
      text: `PEP is current with ${pep_compliance.target_achievement_rate}% target achievement rate. This evidences effective education planning with measurable outcomes — exactly what inspectors want to see.`,
    });
  }

  if ((tutoring.avg_progress_rating ?? 0) >= 4 && tutor90d.length >= 3) {
    insights.push({
      severity: "positive",
      text: `Tutoring support is highly effective with average progress rating of ${tutoring.avg_progress_rating}/5 across ${tutor90d.length} sessions. Pupil premium is being well-used to close educational gaps.`,
    });
  }

  return {
    generated_at: today,
    child_id,
    child_name,
    school_name,
    education_health: educationHealth,
    education_score: score,
    headline,
    attendance,
    exclusions,
    pep_compliance,
    ehcp_status: ehcpStatus,
    homework,
    tutoring,
    engagement,
    achievements,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
