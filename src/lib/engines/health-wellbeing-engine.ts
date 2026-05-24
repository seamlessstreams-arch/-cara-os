// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HEALTH & WELLBEING INTELLIGENCE ENGINE
//
// Pure deterministic engine that analyses health and wellbeing data to produce:
// - Overall compliance summary (immunisations, dental, optician, health assess.)
// - Per-child health profiles (wellbeing, SDQ, CAMHS, compliance)
// - Appointment analysis (DNA rate, attendance patterns)
// - Wellbeing trend analysis (from daily log mood scores)
// - CAMHS engagement summary
// - Auto-generated ARIA health insights (deterministic)
//
// Key regulatory requirements:
//   Reg 23 — Health of children (promoting, monitoring, arranging)
//   Reg 7  — Welfare of children (health-related welfare needs)
//   SCCIF: "Health and well-being" quality standard
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ChildInput {
  id: string;
  name: string;
  date_of_birth: string;
}

export interface AppointmentInput {
  id: string;
  child_id: string;
  date: string;
  type: string; // gp, dental, optician, camhs, hospital, therapy, immunisation, etc.
  status: string; // scheduled, attended, cancelled, missed, rescheduled
}

export interface HealthAssessmentInput {
  id: string;
  child_id: string;
  type: string; // iha, rha, dental, optician, sdq
  status: string; // completed, scheduled, overdue, referred
  date: string;
  next_due: string;
  sdq_total: number | null;
  sdq_band: string | null; // normal, borderline, abnormal
}

export interface DentalRecordInput {
  id: string;
  child_id: string;
  last_check_up_date: string;
  next_check_up_due: string;
  registration_status: string; // registered, pending, unregistered
}

export interface OpticiansRecordInput {
  id: string;
  child_id: string;
  last_exam_date: string;
  next_exam_due: string;
}

export interface ImmunisationRecordInput {
  id: string;
  child_id: string;
  missed_count: number;
  caught_up_count: number;
  upcoming_due_count: number;
  gp_reviewed_schedule: boolean;
}

export interface CamhsReferralInput {
  id: string;
  child_id: string;
  referral_date: string;
  referral_status: string; // submitted, triaged, on_waiting_list, active_engagement, discharged, re_referred
  urgency: string; // routine, soon, urgent, emergency
  sessions_held: number;
  sessions_scheduled: number;
  engagement_level: string; // strong, building, inconsistent, disengaged
  waiting_time_weeks: number;
}

export interface MoodEntryInput {
  child_id: string;
  date: string;
  mood_score: number; // 1-10
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface HealthComplianceSummary {
  total_children: number;
  immunisation_up_to_date: number;
  dental_up_to_date: number;
  optician_up_to_date: number;
  health_assessment_current: number;
  overall_compliance_rate: number; // percentage
}

export interface AppointmentAnalysis {
  total_appointments_90d: number;
  attended: number;
  missed: number;
  cancelled: number;
  dna_rate: number; // percentage (missed / (attended + missed))
  upcoming_7d: number;
}

export interface WellbeingTrend {
  child_id: string;
  child_name: string;
  current_avg: number; // last 7 days
  previous_avg: number; // 8-14 days ago
  trend: "improving" | "stable" | "declining";
  latest_score: number;
  data_points_30d: number;
}

export interface ChildHealthProfile {
  child_id: string;
  child_name: string;
  wellbeing_score: number | null; // latest mood average (7d)
  wellbeing_trend: "improving" | "stable" | "declining" | "unknown";
  sdq_band: string | null; // normal, borderline, abnormal
  sdq_total: number | null;
  dental_up_to_date: boolean;
  optician_up_to_date: boolean;
  immunisation_up_to_date: boolean;
  health_assessment_current: boolean;
  camhs_status: string | null; // active_engagement, on_waiting_list, submitted, etc.
  camhs_engagement: string | null; // strong, building, inconsistent, disengaged
  appointments_attended_90d: number;
  appointments_missed_90d: number;
}

export interface CamhsSummary {
  active_referrals: number;
  waiting_list: number;
  total_sessions_held: number;
  avg_waiting_weeks: number;
  disengaged_count: number;
}

export interface HealthAlert {
  severity: "critical" | "high" | "medium" | "low";
  type: string;
  child_name: string;
  message: string;
}

export interface AriaHealthInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface HealthWellbeingResult {
  compliance: HealthComplianceSummary;
  appointments: AppointmentAnalysis;
  wellbeing_trends: WellbeingTrend[];
  child_profiles: ChildHealthProfile[];
  camhs: CamhsSummary;
  alerts: HealthAlert[];
  insights: AriaHealthInsight[];
}

export interface HealthWellbeingInput {
  children: ChildInput[];
  appointments: AppointmentInput[];
  healthAssessments: HealthAssessmentInput[];
  dentalRecords: DentalRecordInput[];
  opticiansRecords: OpticiansRecordInput[];
  immunisationRecords: ImmunisationRecordInput[];
  camhsReferrals: CamhsReferralInput[];
  moodEntries: MoodEntryInput[];
  today?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000
  );
}

/** Check if a date is overdue (past today) */
export function isOverdue(dueDate: string, today: string): boolean {
  return dueDate < today;
}

/** Compute average of number array */
export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10;
}

/** Determine wellbeing trend from two period averages */
export function computeWellbeingTrend(
  currentAvg: number,
  previousAvg: number,
): "improving" | "stable" | "declining" {
  if (currentAvg === 0 && previousAvg === 0) return "stable";
  if (previousAvg === 0) return "stable"; // no baseline
  const diff = currentAvg - previousAvg;
  if (diff >= 0.5) return "improving";
  if (diff <= -0.5) return "declining";
  return "stable";
}

/** Classify SDQ total into band (ages 4-17 self-report scoring) */
export function classifySdqBand(total: number): "normal" | "borderline" | "abnormal" {
  if (total <= 14) return "normal";
  if (total <= 16) return "borderline";
  return "abnormal";
}

/** Calculate DNA rate as percentage */
export function computeDnaRate(attended: number, missed: number): number {
  const total = attended + missed;
  if (total === 0) return 0;
  return Math.round((missed / total) * 1000) / 10; // one decimal place
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function computeHealthWellbeing(
  input: HealthWellbeingInput,
): HealthWellbeingResult {
  const today = input.today ?? todayStr();
  const { children, appointments, healthAssessments, dentalRecords, opticiansRecords, immunisationRecords, camhsReferrals, moodEntries } = input;

  const ninetyDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 90);
    return d.toISOString().slice(0, 10);
  })();

  const sevenDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  })();

  const fourteenDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  })();

  const sevenDaysFromNow = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  })();

  // ── Per-child lookups ────────────────────────────────────────────────────

  const childNameMap = new Map<string, string>();
  for (const c of children) {
    childNameMap.set(c.id, c.name);
  }
  const childName = (id: string) => childNameMap.get(id) ?? "Unknown";

  // ── Dental compliance ────────────────────────────────────────────────────

  const dentalByChild = new Map<string, DentalRecordInput>();
  for (const dr of dentalRecords) {
    // Keep the most recent record per child
    const existing = dentalByChild.get(dr.child_id);
    if (!existing || dr.last_check_up_date > existing.last_check_up_date) {
      dentalByChild.set(dr.child_id, dr);
    }
  }

  const isDentalUpToDate = (childId: string): boolean => {
    const rec = dentalByChild.get(childId);
    if (!rec) return false;
    return !isOverdue(rec.next_check_up_due, today);
  };

  // ── Optician compliance ──────────────────────────────────────────────────

  const opticianByChild = new Map<string, OpticiansRecordInput>();
  for (const or of opticiansRecords) {
    const existing = opticianByChild.get(or.child_id);
    if (!existing || or.last_exam_date > existing.last_exam_date) {
      opticianByChild.set(or.child_id, or);
    }
  }

  const isOpticianUpToDate = (childId: string): boolean => {
    const rec = opticianByChild.get(childId);
    if (!rec) return false;
    return !isOverdue(rec.next_exam_due, today);
  };

  // ── Immunisation compliance ──────────────────────────────────────────────

  const immunByChild = new Map<string, ImmunisationRecordInput>();
  for (const ir of immunisationRecords) {
    immunByChild.set(ir.child_id, ir);
  }

  const isImmunisationUpToDate = (childId: string): boolean => {
    const rec = immunByChild.get(childId);
    if (!rec) return true; // No record = assume no outstanding
    // Up to date if nothing missed or all caught up
    return rec.missed_count === 0 || rec.caught_up_count >= rec.missed_count;
  };

  // ── Health Assessment compliance ─────────────────────────────────────────

  const haByChild = new Map<string, HealthAssessmentInput>();
  for (const ha of healthAssessments) {
    // Keep the latest IHA or RHA per child
    if (ha.type === "iha" || ha.type === "rha") {
      const existing = haByChild.get(ha.child_id);
      if (!existing || ha.date > existing.date) {
        haByChild.set(ha.child_id, ha);
      }
    }
  }

  const isHealthAssessmentCurrent = (childId: string): boolean => {
    const ha = haByChild.get(childId);
    if (!ha) return false;
    return ha.status === "completed" && !isOverdue(ha.next_due, today);
  };

  // ── SDQ data ─────────────────────────────────────────────────────────────

  const sdqByChild = new Map<string, { total: number; band: string }>();
  for (const ha of healthAssessments) {
    if (ha.type === "sdq" && ha.sdq_total != null && ha.sdq_band != null) {
      const existing = sdqByChild.get(ha.child_id);
      // Keep latest
      if (!existing) {
        sdqByChild.set(ha.child_id, { total: ha.sdq_total, band: ha.sdq_band });
      }
    }
  }
  // Also look at IHA/RHA that have SDQ data
  for (const ha of healthAssessments) {
    if (ha.sdq_total != null && ha.sdq_band != null && !sdqByChild.has(ha.child_id)) {
      sdqByChild.set(ha.child_id, { total: ha.sdq_total, band: ha.sdq_band });
    }
  }

  // ── CAMHS data ───────────────────────────────────────────────────────────

  const camhsByChild = new Map<string, CamhsReferralInput>();
  for (const cr of camhsReferrals) {
    // Keep most recent referral per child
    const existing = camhsByChild.get(cr.child_id);
    if (!existing || cr.referral_date > existing.referral_date) {
      camhsByChild.set(cr.child_id, cr);
    }
  }

  // ── Compliance Summary ───────────────────────────────────────────────────

  let immunCount = 0;
  let dentalCount = 0;
  let opticianCount = 0;
  let haCount = 0;

  for (const child of children) {
    if (isImmunisationUpToDate(child.id)) immunCount++;
    if (isDentalUpToDate(child.id)) dentalCount++;
    if (isOpticianUpToDate(child.id)) opticianCount++;
    if (isHealthAssessmentCurrent(child.id)) haCount++;
  }

  const totalChecks = children.length * 4;
  const passedChecks = immunCount + dentalCount + opticianCount + haCount;
  const overallRate = totalChecks > 0
    ? Math.round((passedChecks / totalChecks) * 100)
    : 100;

  const compliance: HealthComplianceSummary = {
    total_children: children.length,
    immunisation_up_to_date: immunCount,
    dental_up_to_date: dentalCount,
    optician_up_to_date: opticianCount,
    health_assessment_current: haCount,
    overall_compliance_rate: overallRate,
  };

  // ── Appointment Analysis (last 90 days) ──────────────────────────────────

  const appointments90d = appointments.filter((a) => a.date >= ninetyDaysAgo && a.date <= today);
  const attended = appointments90d.filter((a) => a.status === "attended").length;
  const missed = appointments90d.filter((a) => a.status === "missed").length;
  const cancelled = appointments90d.filter((a) => a.status === "cancelled").length;
  const upcoming = appointments.filter((a) => a.date > today && a.date <= sevenDaysFromNow && a.status === "scheduled").length;

  const appointmentAnalysis: AppointmentAnalysis = {
    total_appointments_90d: appointments90d.length,
    attended,
    missed,
    cancelled,
    dna_rate: computeDnaRate(attended, missed),
    upcoming_7d: upcoming,
  };

  // ── Wellbeing Trends (from mood entries) ─────────────────────────────────

  const moodByChild = new Map<string, MoodEntryInput[]>();
  for (const entry of moodEntries) {
    const existing = moodByChild.get(entry.child_id) ?? [];
    existing.push(entry);
    moodByChild.set(entry.child_id, existing);
  }

  const wellbeingTrends: WellbeingTrend[] = [];

  for (const child of children) {
    const entries = moodByChild.get(child.id) ?? [];
    const thirtyDaysAgo = (() => {
      const d = new Date(today + "T00:00:00Z");
      d.setDate(d.getDate() - 30);
      return d.toISOString().slice(0, 10);
    })();

    const entries30d = entries.filter((e) => e.date >= thirtyDaysAgo && e.date <= today);
    const currentEntries = entries.filter((e) => e.date >= sevenDaysAgo && e.date <= today);
    const previousEntries = entries.filter((e) => e.date >= fourteenDaysAgo && e.date < sevenDaysAgo);

    const currentAvg = average(currentEntries.map((e) => e.mood_score));
    const previousAvg = average(previousEntries.map((e) => e.mood_score));
    const latestScore = currentEntries.length > 0
      ? currentEntries.sort((a, b) => b.date.localeCompare(a.date))[0].mood_score
      : 0;

    if (entries30d.length > 0) {
      wellbeingTrends.push({
        child_id: child.id,
        child_name: child.name,
        current_avg: currentAvg,
        previous_avg: previousAvg,
        trend: computeWellbeingTrend(currentAvg, previousAvg),
        latest_score: latestScore,
        data_points_30d: entries30d.length,
      });
    }
  }

  // ── Child Health Profiles ────────────────────────────────────────────────

  const childProfiles: ChildHealthProfile[] = children.map((child) => {
    const wellbeingTrend = wellbeingTrends.find((w) => w.child_id === child.id);
    const sdqData = sdqByChild.get(child.id);
    const camhsData = camhsByChild.get(child.id);

    // Appointment stats for this child
    const childAppts90d = appointments90d.filter((a) => a.child_id === child.id);
    const childAttended = childAppts90d.filter((a) => a.status === "attended").length;
    const childMissed = childAppts90d.filter((a) => a.status === "missed").length;

    return {
      child_id: child.id,
      child_name: child.name,
      wellbeing_score: wellbeingTrend?.current_avg ?? null,
      wellbeing_trend: wellbeingTrend?.trend ?? "unknown" as const,
      sdq_band: sdqData?.band ?? null,
      sdq_total: sdqData?.total ?? null,
      dental_up_to_date: isDentalUpToDate(child.id),
      optician_up_to_date: isOpticianUpToDate(child.id),
      immunisation_up_to_date: isImmunisationUpToDate(child.id),
      health_assessment_current: isHealthAssessmentCurrent(child.id),
      camhs_status: camhsData?.referral_status ?? null,
      camhs_engagement: camhsData?.engagement_level ?? null,
      appointments_attended_90d: childAttended,
      appointments_missed_90d: childMissed,
    };
  });

  // ── CAMHS Summary ────────────────────────────────────────────────────────

  const activeReferrals = camhsReferrals.filter((r) =>
    r.referral_status === "active_engagement"
  );
  const waitingList = camhsReferrals.filter((r) =>
    r.referral_status === "on_waiting_list" || r.referral_status === "triaged"
  );
  const disengaged = camhsReferrals.filter((r) =>
    r.engagement_level === "disengaged" && r.referral_status === "active_engagement"
  );

  const totalSessionsHeld = camhsReferrals.reduce((sum, r) => sum + r.sessions_held, 0);
  const waitingWeeks = waitingList.length > 0
    ? Math.round(waitingList.reduce((sum, r) => sum + r.waiting_time_weeks, 0) / waitingList.length)
    : 0;

  const camhs: CamhsSummary = {
    active_referrals: activeReferrals.length,
    waiting_list: waitingList.length,
    total_sessions_held: totalSessionsHeld,
    avg_waiting_weeks: waitingWeeks,
    disengaged_count: disengaged.length,
  };

  // ── Health Alerts ────────────────────────────────────────────────────────

  const alerts: HealthAlert[] = [];

  // SDQ abnormal alerts
  for (const child of children) {
    const sdq = sdqByChild.get(child.id);
    if (sdq && sdq.band === "abnormal") {
      alerts.push({
        severity: "high",
        type: "sdq_abnormal",
        child_name: childName(child.id),
        message: `${childName(child.id)} SDQ total difficulties in abnormal range (${sdq.total}). Review with CAMHS referral team and key worker.`,
      });
    }
  }

  // Declining wellbeing alerts
  for (const trend of wellbeingTrends) {
    if (trend.trend === "declining" && trend.current_avg < 5) {
      alerts.push({
        severity: "high",
        type: "wellbeing_declining",
        child_name: trend.child_name,
        message: `${trend.child_name} wellbeing score declining (avg ${trend.current_avg}/10). Review emotional support plan and consider professional intervention.`,
      });
    } else if (trend.trend === "declining") {
      alerts.push({
        severity: "medium",
        type: "wellbeing_declining",
        child_name: trend.child_name,
        message: `${trend.child_name} wellbeing score declining over past week (${trend.previous_avg} → ${trend.current_avg}). Monitor closely and discuss in key-work session.`,
      });
    }
  }

  // Overdue health assessments
  for (const child of children) {
    const ha = haByChild.get(child.id);
    if (ha && ha.status === "overdue") {
      alerts.push({
        severity: "high",
        type: "health_assessment_overdue",
        child_name: childName(child.id),
        message: `${childName(child.id)} health assessment is overdue. Reg 23 requires timely health assessments for all looked-after children.`,
      });
    }
  }

  // CAMHS disengagement
  for (const cr of camhsReferrals) {
    if (cr.engagement_level === "disengaged" && cr.referral_status === "active_engagement") {
      alerts.push({
        severity: "medium",
        type: "camhs_disengaged",
        child_name: childName(cr.child_id),
        message: `${childName(cr.child_id)} disengaged from CAMHS sessions. Review barriers to engagement and consider alternative therapeutic approaches.`,
      });
    }
  }

  // High DNA rate per child
  for (const profile of childProfiles) {
    const total = profile.appointments_attended_90d + profile.appointments_missed_90d;
    if (total >= 3 && profile.appointments_missed_90d >= 2) {
      const childDna = computeDnaRate(profile.appointments_attended_90d, profile.appointments_missed_90d);
      if (childDna >= 30) {
        alerts.push({
          severity: "medium",
          type: "high_dna_rate",
          child_name: profile.child_name,
          message: `${profile.child_name} has a ${childDna}% appointment DNA rate (${profile.appointments_missed_90d} missed). Investigate barriers and support attendance.`,
        });
      }
    }
  }

  // Sort alerts by severity
  const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3));

  // ── ARIA Health Insights ─────────────────────────────────────────────────

  const insights: AriaHealthInsight[] = [];

  // 1. Health assessment compliance
  if (children.length > 0 && haCount < children.length) {
    const missing = children.length - haCount;
    insights.push({
      severity: "warning",
      text: `${missing} child(ren) without a current health assessment. Reg 23 requires the registered person to promote and protect children's health through timely assessment. Arrange review with LAC health team without delay.`,
    });
  }

  // 2. DNA rate concern
  if (appointmentAnalysis.dna_rate > 10) {
    insights.push({
      severity: "warning",
      text: `Appointment DNA rate is ${appointmentAnalysis.dna_rate}% (${missed} missed in 90 days). Investigate patterns — consider transport barriers, appointment timing, anxiety, or relationship with professionals. A rate above 10% warrants team discussion.`,
    });
  }

  // 3. SDQ concerns
  const abnormalSdq = children.filter((c) => sdqByChild.get(c.id)?.band === "abnormal");
  if (abnormalSdq.length > 0) {
    const names = abnormalSdq.map((c) => childName(c.id)).join(", ");
    insights.push({
      severity: "warning",
      text: `${abnormalSdq.length} child(ren) with SDQ total in abnormal range: ${names}. Ensure CAMHS referral is active, review therapeutic support, and discuss at next professionals meeting.`,
    });
  }

  // 4. CAMHS waiting time concern
  if (camhs.waiting_list > 0 && camhs.avg_waiting_weeks > 12) {
    insights.push({
      severity: "warning",
      text: `${camhs.waiting_list} child(ren) on CAMHS waiting list with average wait of ${camhs.avg_waiting_weeks} weeks. Consider interim therapeutic support, advocacy for priority assessment, or private/third-sector alternatives.`,
    });
  }

  // 5. CAMHS disengagement
  if (camhs.disengaged_count > 0) {
    insights.push({
      severity: "warning",
      text: `${camhs.disengaged_count} child(ren) disengaged from CAMHS. Review whether the therapeutic approach is appropriate, discuss in key-work sessions, and liaise with clinician about creative engagement strategies.`,
    });
  }

  // 6. Immunisation gaps
  const immunGaps = children.filter((c) => !isImmunisationUpToDate(c.id));
  if (immunGaps.length > 0) {
    insights.push({
      severity: "warning",
      text: `${immunGaps.length} child(ren) have outstanding immunisations. Reg 23 requires the home to arrange and promote health appointments. Liaise with GP to schedule catch-up programme.`,
    });
  }

  // 7. Positive compliance
  if (overallRate === 100 && children.length > 0) {
    insights.push({
      severity: "positive",
      text: "All children have current health assessments, dental, optician, and immunisation records up to date. Excellent Reg 23 compliance — strong evidence of proactive health promotion for Ofsted inspection.",
    });
  } else if (overallRate >= 75 && children.length > 0) {
    insights.push({
      severity: "positive",
      text: `Health compliance is ${overallRate}%. Continue proactive scheduling and use the approaching-due reminders to maintain standards. Document any refusals with the child's informed view.`,
    });
  }

  // 8. Positive wellbeing trends
  const improvingWellbeing = wellbeingTrends.filter((w) => w.trend === "improving");
  if (improvingWellbeing.length > 0 && wellbeingTrends.length > 0) {
    const pct = Math.round((improvingWellbeing.length / wellbeingTrends.length) * 100);
    if (pct >= 50) {
      insights.push({
        severity: "positive",
        text: `${improvingWellbeing.length} of ${wellbeingTrends.length} children showing improving wellbeing trends. Positive evidence of effective key-work, therapeutic environment, and emotional support.`,
      });
    }
  }

  // 9. Low DNA rate
  if (appointmentAnalysis.total_appointments_90d >= 3 && appointmentAnalysis.dna_rate <= 5) {
    insights.push({
      severity: "positive",
      text: `Appointment DNA rate is only ${appointmentAnalysis.dna_rate}%. Children are well-supported to attend health appointments. Continue current transport and preparation strategies.`,
    });
  }

  // 10. Zero incidents with CAMHS
  if (camhs.active_referrals > 0 && camhs.disengaged_count === 0) {
    insights.push({
      severity: "positive",
      text: `All ${camhs.active_referrals} active CAMHS referral(s) showing engagement. Therapeutic relationships are being maintained — document progress for care plan reviews.`,
    });
  }

  // Ensure at least one insight
  if (insights.length === 0) {
    insights.push({
      severity: "positive",
      text: `Health & wellbeing monitoring active for ${children.length} child(ren). Continue recording health appointments, mood check-ins, and maintaining proactive scheduling for Reg 23 compliance.`,
    });
  }

  return {
    compliance,
    appointments: appointmentAnalysis,
    wellbeing_trends: wellbeingTrends,
    child_profiles: childProfiles,
    camhs,
    alerts,
    insights,
  };
}
