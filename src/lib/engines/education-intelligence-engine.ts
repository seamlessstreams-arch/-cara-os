// ══════════════════════════════════════════════════════════════════════════════
// CARA — EDUCATION INTELLIGENCE ENGINE
//
// Pure deterministic engine that analyses education and enrichment data:
// - Attendance tracking (overall %, per-child, trend detection)
// - Education status overview (NEET, exclusions, SEN/EHCP)
// - PEP compliance (review currency)
// - Activity/enrichment analysis (breadth, frequency, engagement)
// - Per-child education profiles
// - Auto-generated Cara education insights (deterministic)
//
// Key regulatory requirements:
//   Reg 8  — Promotion of educational achievement
//   Reg 10 — Enjoyment and achievement (activities/enrichment)
//   SCCIF: "Education and learning" quality standard
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ChildInput {
  id: string;
  name: string;
}

export interface EducationRecordInput {
  id: string;
  child_id: string;
  record_type: string; // attendance, exclusion, pep_meeting, attainment, provision_change, achievement, concern
  date: string;
  school: string | null;
  attendance_status: string | null; // present, absent_authorised, absent_unauthorised, late, excluded, part_day
  linked_pep: boolean;
  status: string; // open, resolved, monitoring
}

export interface ActivityInput {
  id: string;
  child_id: string;
  date: string;
  category: string; // sport, creative, outdoor, educational, social, life_skills, cultural, therapeutic, community, digital
  engagement: string; // enthusiastic, willing, reluctant, refused, suggested_by_yp
  duration_minutes: number;
  is_new_experience: boolean;
}

export interface EduAttendanceInput {
  id: string;
  child_id: string;
  date: string;
  attendance_code: string; // "/" present, "\\" present pm, "L" late, "U" unauthorised, "N" no reason, "O" other, "I" illness, "M" medical, "E" excluded
  session: string; // am, pm, full_day
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface EducationOverview {
  total_children: number;
  in_education: number;
  neet_count: number;
  excluded_count: number; // currently excluded (recent)
  exclusion_events_90d: number;
  sen_support_count: number;
  avg_attendance_pct: number | null;  // null = no attendance recorded for any child
  pep_current_count: number;
  pep_overdue_count: number;
}

export interface ChildEducationProfile {
  child_id: string;
  child_name: string;
  school: string | null;
  attendance_pct: number | null;  // null = no attendance recorded for this child
  attendance_trend: "improving" | "stable" | "declining" | "unknown";
  exclusion_count_90d: number;
  latest_pep_date: string | null;
  pep_current: boolean;
  has_sen: boolean;
  achievements_90d: number;
  concerns_open: number;
}

export interface AttendanceAnalysis {
  overall_pct: number | null;
  sessions_total: number;
  sessions_present: number;
  sessions_absent: number;
  sessions_late: number;
  below_90_count: number; // children below 90% attendance
  persistent_absence_count: number; // children below 50%
}

export interface ActivityAnalysis {
  total_activities_30d: number;
  categories: { category: string; count: number; label: string }[];
  new_experiences_30d: number;
  engagement_breakdown: { level: string; count: number }[];
  children_with_zero_activities: number;
  avg_activities_per_child_30d: number;
}

export interface EducationAlert {
  severity: "critical" | "high" | "medium" | "low";
  type: string;
  child_name: string;
  message: string;
}

export interface CaraEducationInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface EducationIntelligenceResult {
  overview: EducationOverview;
  child_profiles: ChildEducationProfile[];
  attendance: AttendanceAnalysis;
  activities: ActivityAnalysis;
  alerts: EducationAlert[];
  insights: CaraEducationInsight[];
}

export interface EducationIntelligenceInput {
  children: ChildInput[];
  educationRecords: EducationRecordInput[];
  activities: ActivityInput[];
  eduAttendance: EduAttendanceInput[];
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

/** Human label for activity categories */
export function activityCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    sport: "Sport & Fitness",
    creative: "Creative Arts",
    outdoor: "Outdoor Adventure",
    educational: "Educational",
    social: "Social",
    life_skills: "Life Skills",
    cultural: "Cultural",
    therapeutic: "Therapeutic",
    community: "Community",
    digital: "Digital & Technology",
  };
  return labels[cat] ?? cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Is attendance code a "present" code */
export function isPresent(code: string): boolean {
  return code === "/" || code === "\\";
}

/** Is attendance code a "late" code */
export function isLate(code: string): boolean {
  return code === "L";
}

/** Is attendance code an "absent" code */
export function isAbsent(code: string): boolean {
  return code === "U" || code === "N" || code === "O" || code === "I" || code === "M";
}

/** Compute attendance percentage. Null when no sessions were recorded at all. */
export function computeAttendancePct(present: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((present / total) * 1000) / 10;
}

/** Compute attendance trend from two period counts */
export function computeAttendanceTrend(
  recentPct: number,
  olderPct: number,
): "improving" | "stable" | "declining" {
  const diff = recentPct - olderPct;
  if (diff >= 3) return "improving";
  if (diff <= -3) return "declining";
  return "stable";
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function computeEducationIntelligence(
  input: EducationIntelligenceInput,
): EducationIntelligenceResult {
  const today = input.today ?? todayStr();
  const { children, educationRecords, activities, eduAttendance } = input;

  const ninetyDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 90);
    return d.toISOString().slice(0, 10);
  })();

  const thirtyDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  })();

  const fortyFiveDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 45);
    return d.toISOString().slice(0, 10);
  })();

  // ── Child name lookup ────────────────────────────────────────────────────

  const childNameMap = new Map<string, string>();
  for (const c of children) {
    childNameMap.set(c.id, c.name);
  }
  const childName = (id: string) => childNameMap.get(id) ?? "Unknown";

  // ── Education records filtered ───────────────────────────────────────────

  const records90d = educationRecords.filter((r) => r.date >= ninetyDaysAgo && r.date <= today);

  // ── Per-child attendance from eduAttendance (detailed) ───────────────────

  const attendanceByChild = new Map<string, EduAttendanceInput[]>();
  for (const ea of eduAttendance) {
    const arr = attendanceByChild.get(ea.child_id) ?? [];
    arr.push(ea);
    attendanceByChild.set(ea.child_id, arr);
  }

  // If no detailed attendance, fall back to education records
  const hasDetailedAttendance = eduAttendance.length > 0;

  // ── Attendance from EducationRecords as fallback ─────────────────────────

  const eduRecordsByChild = new Map<string, EducationRecordInput[]>();
  for (const rec of records90d) {
    const arr = eduRecordsByChild.get(rec.child_id) ?? [];
    arr.push(rec);
    eduRecordsByChild.set(rec.child_id, arr);
  }

  // ── Compute per-child attendance percentages ─────────────────────────────

  function getChildAttendance(childId: string): { pct: number | null; trend: "improving" | "stable" | "declining" | "unknown"; hasData: boolean } {
    if (hasDetailedAttendance) {
      const records = (attendanceByChild.get(childId) ?? [])
        .filter((r) => r.date >= ninetyDaysAgo && r.date <= today);
      if (records.length === 0) return { pct: null, trend: "unknown", hasData: false };

      const presentCount = records.filter((r) => isPresent(r.attendance_code) || isLate(r.attendance_code)).length;
      const pct = computeAttendancePct(presentCount, records.length);

      // Trend: compare last 45 days vs previous 45 days
      const recentRecords = records.filter((r) => r.date >= fortyFiveDaysAgo);
      const olderRecords = records.filter((r) => r.date < fortyFiveDaysAgo);

      if (recentRecords.length >= 3 && olderRecords.length >= 3) {
        const recentPresent = recentRecords.filter((r) => isPresent(r.attendance_code) || isLate(r.attendance_code)).length;
        const olderPresent = olderRecords.filter((r) => isPresent(r.attendance_code) || isLate(r.attendance_code)).length;
        const recentPct = computeAttendancePct(recentPresent, recentRecords.length);
        const olderPct = computeAttendancePct(olderPresent, olderRecords.length);
        if (recentPct !== null && olderPct !== null) {
          return { pct, trend: computeAttendanceTrend(recentPct, olderPct), hasData: true };
        }
      }

      return { pct, trend: "unknown", hasData: true };
    }

    // Fallback: use education records with attendance_status
    const childRecs = (eduRecordsByChild.get(childId) ?? [])
      .filter((r) => r.record_type === "attendance" && r.attendance_status != null);
    if (childRecs.length === 0) return { pct: null, trend: "unknown", hasData: false };

    const presentStatuses = ["present", "late", "part_day"];
    const presentCount = childRecs.filter((r) => presentStatuses.includes(r.attendance_status!)).length;
    const pct = computeAttendancePct(presentCount, childRecs.length);

    // Trend from record dates
    const recentRecs = childRecs.filter((r) => r.date >= fortyFiveDaysAgo);
    const olderRecs = childRecs.filter((r) => r.date < fortyFiveDaysAgo);

    if (recentRecs.length >= 3 && olderRecs.length >= 3) {
      const recentPresent = recentRecs.filter((r) => presentStatuses.includes(r.attendance_status!)).length;
      const olderPresent = olderRecs.filter((r) => presentStatuses.includes(r.attendance_status!)).length;
      const recentPct = computeAttendancePct(recentPresent, recentRecs.length);
      const olderPct = computeAttendancePct(olderPresent, olderRecs.length);
      if (recentPct !== null && olderPct !== null) {
        return { pct, trend: computeAttendanceTrend(recentPct, olderPct), hasData: true };
      }
    }

    return { pct, trend: "unknown", hasData: true };
  }

  // ── Exclusions (90 days) ─────────────────────────────────────────────────

  const exclusions90d = records90d.filter((r) => r.record_type === "exclusion");
  const excludedChildIds = new Set(exclusions90d.map((r) => r.child_id));

  // ── PEP meetings ─────────────────────────────────────────────────────────

  const pepByChild = new Map<string, string>(); // child_id → latest PEP date
  for (const rec of educationRecords) {
    if (rec.record_type === "pep_meeting" || rec.linked_pep) {
      const existing = pepByChild.get(rec.child_id);
      if (!existing || rec.date > existing) {
        pepByChild.set(rec.child_id, rec.date);
      }
    }
  }

  const isPepCurrent = (childId: string): boolean => {
    const lastPep = pepByChild.get(childId);
    if (!lastPep) return false;
    // PEPs should be reviewed termly (approx every 13 weeks / 91 days)
    return daysBetween(lastPep, today) <= 91;
  };

  // ── SEN detection (from education records with provision_change or EHCP mentions) ─
  // Simplified: children with exclusion or concern records indicating SEN

  const senChildren = new Set<string>();
  for (const rec of educationRecords) {
    if (rec.record_type === "concern" && rec.status !== "resolved") {
      senChildren.add(rec.child_id);
    }
  }

  // ── Overview ─────────────────────────────────────────────────────────────

  const childAttendances = children.map((c) => getChildAttendance(c.id));
  // Average only children who actually have attendance data. A child with no
  // attendance records is unmeasured, so they neither inflate nor depress the
  // home average — and with nothing recorded at all there is no average to give.
  const trackedPcts = childAttendances
    .map((a) => a.pct)
    .filter((p): p is number => p !== null);
  const avgAttendance = trackedPcts.length > 0
    ? Math.round((trackedPcts.reduce((sum, p) => sum + p, 0) / trackedPcts.length) * 10) / 10
    : null;

  let pepCurrentCount = 0;
  let pepOverdueCount = 0;
  for (const child of children) {
    if (isPepCurrent(child.id)) pepCurrentCount++;
    else pepOverdueCount++;
  }

  // NEET: children with no education records in last 30 days and no scheduled provision
  const childrenWithRecentEdu = new Set<string>();
  for (const rec of educationRecords) {
    if (rec.date >= thirtyDaysAgo && rec.date <= today) {
      childrenWithRecentEdu.add(rec.child_id);
    }
  }
  for (const ea of eduAttendance) {
    if (ea.date >= thirtyDaysAgo && ea.date <= today) {
      childrenWithRecentEdu.add(ea.child_id);
    }
  }
  const neetCount = children.filter((c) => !childrenWithRecentEdu.has(c.id)).length;

  // Current school per child (latest record with school)
  const schoolByChild = new Map<string, string>();
  for (const rec of educationRecords) {
    if (rec.school) {
      const existing = schoolByChild.get(rec.child_id);
      if (!existing) {
        schoolByChild.set(rec.child_id, rec.school);
      }
    }
  }
  // Sort by date to get latest
  const sortedRecords = [...educationRecords].sort((a, b) => b.date.localeCompare(a.date));
  for (const rec of sortedRecords) {
    if (rec.school) {
      schoolByChild.set(rec.child_id, rec.school);
    }
  }

  const overview: EducationOverview = {
    total_children: children.length,
    in_education: children.length - neetCount,
    neet_count: neetCount,
    excluded_count: excludedChildIds.size,
    exclusion_events_90d: exclusions90d.length,
    sen_support_count: senChildren.size,
    avg_attendance_pct: avgAttendance,
    pep_current_count: pepCurrentCount,
    pep_overdue_count: pepOverdueCount,
  };

  // ── Child Education Profiles ─────────────────────────────────────────────

  const childProfiles: ChildEducationProfile[] = children.map((child, idx) => {
    const att = childAttendances[idx];
    const childExclusions = exclusions90d.filter((r) => r.child_id === child.id).length;
    const achievements = records90d.filter((r) => r.child_id === child.id && (r.record_type === "achievement" || r.record_type === "attainment")).length;
    const concerns = educationRecords.filter((r) => r.child_id === child.id && r.record_type === "concern" && r.status !== "resolved").length;

    return {
      child_id: child.id,
      child_name: child.name,
      school: schoolByChild.get(child.id) ?? null,
      attendance_pct: att.pct,
      attendance_trend: att.trend,
      exclusion_count_90d: childExclusions,
      latest_pep_date: pepByChild.get(child.id) ?? null,
      pep_current: isPepCurrent(child.id),
      has_sen: senChildren.has(child.id),
      achievements_90d: achievements,
      concerns_open: concerns,
    };
  });

  // ── Attendance Analysis ──────────────────────────────────────────────────

  let sessionsTotal = 0;
  let sessionsPresent = 0;
  let sessionsAbsent = 0;
  let sessionsLate = 0;

  if (hasDetailedAttendance) {
    const all90d = eduAttendance.filter((r) => r.date >= ninetyDaysAgo && r.date <= today);
    sessionsTotal = all90d.length;
    sessionsPresent = all90d.filter((r) => isPresent(r.attendance_code)).length;
    sessionsLate = all90d.filter((r) => isLate(r.attendance_code)).length;
    sessionsAbsent = all90d.filter((r) => isAbsent(r.attendance_code) || r.attendance_code === "E").length;
  } else {
    const attRecs = records90d.filter((r) => r.record_type === "attendance" && r.attendance_status != null);
    sessionsTotal = attRecs.length;
    sessionsPresent = attRecs.filter((r) => r.attendance_status === "present").length;
    sessionsLate = attRecs.filter((r) => r.attendance_status === "late").length;
    sessionsAbsent = attRecs.filter((r) => r.attendance_status === "absent_authorised" || r.attendance_status === "absent_unauthorised" || r.attendance_status === "excluded").length;
  }

  const below90 = childProfiles.filter((p) => below(p.attendance_pct, 90)).length;
  const persistentAbsence = childProfiles.filter((p) => below(p.attendance_pct, 50)).length;

  const attendance: AttendanceAnalysis = {
    overall_pct: computeAttendancePct(sessionsPresent + sessionsLate, sessionsTotal),
    sessions_total: sessionsTotal,
    sessions_present: sessionsPresent,
    sessions_absent: sessionsAbsent,
    sessions_late: sessionsLate,
    below_90_count: below90,
    persistent_absence_count: persistentAbsence,
  };

  // ── Activity Analysis (last 30 days) ─────────────────────────────────────

  const activities30d = activities.filter((a) => a.date >= thirtyDaysAgo && a.date <= today);

  const catMap = new Map<string, number>();
  const engagementMap = new Map<string, number>();
  let newExperiences = 0;

  for (const act of activities30d) {
    catMap.set(act.category, (catMap.get(act.category) ?? 0) + 1);
    engagementMap.set(act.engagement, (engagementMap.get(act.engagement) ?? 0) + 1);
    if (act.is_new_experience) newExperiences++;
  }

  const categories = Array.from(catMap.entries())
    .map(([cat, count]) => ({ category: cat, count, label: activityCategoryLabel(cat) }))
    .sort((a, b) => b.count - a.count);

  const engagementBreakdown = Array.from(engagementMap.entries())
    .map(([level, count]) => ({ level, count }))
    .sort((a, b) => b.count - a.count);

  // Children with zero activities in 30 days
  const childrenWithActivities = new Set(activities30d.map((a) => a.child_id));
  const zeroActivityChildren = children.filter((c) => !childrenWithActivities.has(c.id)).length;

  const avgPerChild = children.length > 0
    ? Math.round((activities30d.length / children.length) * 10) / 10
    : 0;

  const activityAnalysis: ActivityAnalysis = {
    total_activities_30d: activities30d.length,
    categories,
    new_experiences_30d: newExperiences,
    engagement_breakdown: engagementBreakdown,
    children_with_zero_activities: zeroActivityChildren,
    avg_activities_per_child_30d: avgPerChild,
  };

  // ── Alerts ───────────────────────────────────────────────────────────────

  const alerts: EducationAlert[] = [];

  // NEET children
  for (const child of children) {
    if (!childrenWithRecentEdu.has(child.id)) {
      alerts.push({
        severity: "critical",
        type: "neet",
        child_name: childName(child.id),
        message: `${childName(child.id)} has no education or training activity recorded in the last 30 days. Reg 8 requires all children to be in suitable full-time education. Urgent review needed.`,
      });
    }
  }

  // Exclusions
  for (const child of children) {
    const childExclusions = exclusions90d.filter((r) => r.child_id === child.id);
    if (childExclusions.length >= 2) {
      alerts.push({
        severity: "high",
        type: "repeat_exclusion",
        child_name: childName(child.id),
        message: `${childName(child.id)} has ${childExclusions.length} exclusion(s) in 90 days. Review behaviour support plan, school placement suitability, and engage Virtual School Head.`,
      });
    } else if (childExclusions.length === 1) {
      alerts.push({
        severity: "medium",
        type: "exclusion",
        child_name: childName(child.id),
        message: `${childName(child.id)} received a fixed-term exclusion. Monitor reintegration and ensure PEP is updated.`,
      });
    }
  }

  // Low attendance. The previous `&& attendance_pct > 0` guard suppressed the
  // single worst case — a child whose recorded attendance is 0% (all absent) —
  // while below90/persistentAbsence already counted them, so the overview showed
  // a child below 90% with no alert naming them. A child with NO attendance
  // records is unmeasured (null) and `below` never fires on that, so dropping
  // the guard does not false-alert untracked children.
  for (const profile of childProfiles) {
    if (below(profile.attendance_pct, 90)) {
      alerts.push({
        severity: below(profile.attendance_pct, 50) ? "critical" : "medium",
        type: "low_attendance",
        child_name: profile.child_name,
        message: `${profile.child_name} attendance at ${formatRate(profile.attendance_pct)} — below 90% threshold. Review barriers to attendance and update attendance plan.`,
      });
    }
  }

  // PEP overdue
  for (const child of children) {
    if (!isPepCurrent(child.id) && childrenWithRecentEdu.has(child.id)) {
      alerts.push({
        severity: "medium",
        type: "pep_overdue",
        child_name: childName(child.id),
        message: `${childName(child.id)} PEP review is overdue. Schedule with Virtual School Head and designated teacher.`,
      });
    }
  }

  // Sort by severity
  const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3));

  // ── Cara Education Insights ──────────────────────────────────────────────

  const insights: CaraEducationInsight[] = [];

  // 1. NEET concern
  if (neetCount > 0) {
    insights.push({
      severity: "critical",
      text: `${neetCount} child(ren) currently NEET (Not in Education, Employment or Training). Reg 8 places a duty on the registered person to ensure all children access suitable full-time education without delay.`,
    });
  }

  // 2. Exclusion pattern
  if (exclusions90d.length > 0) {
    const multiExcluded = children.filter((c) => exclusions90d.filter((r) => r.child_id === c.id).length >= 2);
    if (multiExcluded.length > 0) {
      insights.push({
        severity: "warning",
        text: `${multiExcluded.length} child(ren) with repeat exclusions. Review whether current placements are meeting needs, consider alternative provision, and ensure Virtual School Head is actively involved.`,
      });
    } else {
      insights.push({
        severity: "warning",
        text: `${exclusions90d.length} exclusion event(s) in 90 days across ${excludedChildIds.size} child(ren). Monitor reintegration support and update behaviour plans accordingly.`,
      });
    }
  }

  // 3. Attendance concern
  if (below90 > 0) {
    insights.push({
      severity: "warning",
      text: `${below90} child(ren) with attendance below 90%. Research shows looked-after children with attendance below 90% are significantly less likely to achieve expected outcomes. Prioritise attendance support strategies.`,
    });
  }

  // 4. PEP compliance
  if (pepOverdueCount > 0 && children.length > 0) {
    insights.push({
      severity: "warning",
      text: `${pepOverdueCount} child(ren) without a current PEP review. PEPs must be reviewed at least termly. Schedule with the Virtual School Head to ensure Pupil Premium Plus funding is appropriately targeted.`,
    });
  }

  // 5. Activity gaps
  if (zeroActivityChildren > 0 && children.length > 0) {
    const names = children.filter((c) => !childrenWithActivities.has(c.id)).map((c) => c.name).join(", ");
    insights.push({
      severity: "warning",
      text: `${zeroActivityChildren} child(ren) have not participated in any recorded activities in 30 days: ${names}. Reg 10 requires promoting enjoyment and achievement through a range of activities.`,
    });
  }

  // 6. Positive: all in education
  if (neetCount === 0 && children.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${children.length} children have active education placements. Zero NEET — strong evidence of Reg 8 compliance and proactive education advocacy.`,
    });
  }

  // 7. Positive: good attendance — only when there is actual attendance data
  // (otherwise a home with no logged attendance would falsely "exceed" the target).
  if (meets(avgAttendance, 95)) {
    insights.push({
      severity: "positive",
      text: `Average attendance is ${formatRate(avgAttendance)} — exceeding the 95% national target. Excellent evidence of the home's commitment to educational stability and support.`,
    });
  }

  // 8. Activity breadth
  if (categories.length >= 4 && activities30d.length >= 5) {
    insights.push({
      severity: "positive",
      text: `${activities30d.length} activities across ${categories.length} different categories in 30 days. Good breadth of enrichment opportunities meeting Reg 10 requirements for enjoyment and achievement.`,
    });
  }

  // 9. New experiences
  if (newExperiences >= 3) {
    insights.push({
      severity: "positive",
      text: `${newExperiences} new experiences introduced this month. Exposing children to new activities builds resilience, confidence, and broadens their horizons — key to Reg 10 outcomes.`,
    });
  }

  // Ensure at least one insight
  if (insights.length === 0) {
    insights.push({
      severity: "positive",
      text: `Education monitoring active for ${children.length} child(ren). Continue tracking attendance, scheduling PEP reviews, and recording enrichment activities for Reg 8/10 evidence.`,
    });
  }

  return {
    overview,
    child_profiles: childProfiles,
    attendance,
    activities: activityAnalysis,
    alerts,
    insights,
  };
}
