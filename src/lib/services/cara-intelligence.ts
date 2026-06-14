// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara OPERATIONAL INTELLIGENCE SERVICE
// Cross-module pattern detection: overdue forms, missing oversight, weak
// recording, staffing concerns, compliance gaps, incident trends, medication
// patterns, positive recognition, and more. Generates actionable recommendations.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type {
  CsCaraRecommendation, CaraRecommendationType,
  CaraRecommendationSeverity, CaraRecommendationStatus,
  ServiceResult,
} from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Recommendation CRUD ─────────────────────────────────────────────────────

export async function listRecommendations(
  homeId: string,
  opts?: {
    type?: CaraRecommendationType;
    severity?: CaraRecommendationSeverity;
    status?: CaraRecommendationStatus;
    childId?: string;
    staffId?: string;
    limit?: number;
  },
): Promise<ServiceResult<CsCaraRecommendation[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_aria_recommendations") as SB).select("*").eq("home_id", homeId);
  if (opts?.type) q = q.eq("recommendation_type", opts.type);
  if (opts?.severity) q = q.eq("severity", opts.severity);
  if (opts?.status) q = q.eq("status", opts.status);
  if (opts?.childId) q = q.eq("linked_child_id", opts.childId);
  if (opts?.staffId) q = q.eq("linked_staff_id", opts.staffId);
  q = q.order("created_at", { ascending: false }).limit(opts?.limit ?? 50);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function acknowledgeRecommendation(
  id: string,
  userId: string,
): Promise<ServiceResult<CsCaraRecommendation>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_aria_recommendations") as SB)
    .update({
      status: "acknowledged",
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function actionRecommendation(
  id: string,
  userId: string,
  actionTaken: string,
): Promise<ServiceResult<CsCaraRecommendation>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_aria_recommendations") as SB)
    .update({
      status: "actioned",
      action_taken: actionTaken,
      action_by: userId,
      action_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function dismissRecommendation(
  id: string,
  userId: string,
  reason: string,
): Promise<ServiceResult<CsCaraRecommendation>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_aria_recommendations") as SB)
    .update({
      status: "dismissed",
      dismissed_reason: reason,
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Detection engine (pure functions for testability) ───────────────────────

export interface DetectionContext {
  homeId: string;
  now: Date;
}

export interface DetectedRecommendation {
  recommendation_type: CaraRecommendationType;
  title: string;
  description: string;
  severity: CaraRecommendationSeverity;
  suggested_action: string;
  linked_child_id?: string;
  linked_staff_id?: string;
  linked_entity_type?: string;
  linked_entity_id?: string;
  data_points: number;
  confidence: number;
  supporting_data?: Record<string, unknown>;
}

// ── Overdue forms detector ──────────────────────────────────────────────────

export function detectOverdueForms(
  submissions: { id: string; status: string; due_date: string | null; template_id: string; linked_child_id: string | null }[],
  now: Date,
): DetectedRecommendation[] {
  const results: DetectedRecommendation[] = [];

  const overdue = submissions.filter(
    (s) => s.due_date && new Date(s.due_date) < now && !["approved", "archived", "rejected"].includes(s.status),
  );

  if (overdue.length > 0) {
    const daysOverdue = overdue.map((s) => Math.floor((now.getTime() - new Date(s.due_date!).getTime()) / 86400000));
    const maxDays = Math.max(...daysOverdue);

    results.push({
      recommendation_type: "overdue_form",
      title: `${overdue.length} form${overdue.length > 1 ? "s" : ""} overdue`,
      description: `There ${overdue.length === 1 ? "is" : "are"} ${overdue.length} form submission${overdue.length > 1 ? "s" : ""} past ${overdue.length === 1 ? "its" : "their"} due date. The most overdue is ${maxDays} days late. Overdue forms may indicate gaps in required recording or staff awareness.`,
      severity: maxDays > 14 ? "high" : maxDays > 7 ? "medium" : "low",
      suggested_action: "Review the overdue submissions and either complete them or reassign to available staff. Consider whether the due dates are realistic and whether additional support is needed.",
      data_points: overdue.length,
      confidence: 0.95,
      supporting_data: { overdue_count: overdue.length, max_days_overdue: maxDays },
    });
  }

  return results;
}

// ── Missing oversight detector ──────────────────────────────────────────────

export function detectMissingOversight(
  records: { id: string; type: string; reference: string; created_at: string; has_oversight: boolean }[],
  now: Date,
): DetectedRecommendation[] {
  const results: DetectedRecommendation[] = [];

  const OVERSIGHT_REQUIRED_TYPES = ["incident", "safeguarding", "missing_episode", "restraint", "complaint", "medication_error"];
  const OVERSIGHT_WINDOW_HOURS = 48;

  const needingOversight = records.filter((r) => {
    if (!OVERSIGHT_REQUIRED_TYPES.includes(r.type)) return false;
    if (r.has_oversight) return false;
    const hoursSince = (now.getTime() - new Date(r.created_at).getTime()) / 3600000;
    return hoursSince > OVERSIGHT_WINDOW_HOURS;
  });

  if (needingOversight.length > 0) {
    const byType: Record<string, number> = {};
    for (const r of needingOversight) {
      byType[r.type] = (byType[r.type] ?? 0) + 1;
    }

    results.push({
      recommendation_type: "missing_oversight",
      title: `${needingOversight.length} record${needingOversight.length > 1 ? "s" : ""} without management oversight`,
      description: `${needingOversight.length} significant record${needingOversight.length > 1 ? "s" : ""} ${needingOversight.length === 1 ? "has" : "have"} been open for more than 48 hours without management oversight. ${Object.entries(byType).map(([t, c]) => `${c} ${t.replace(/_/g, " ")}${c > 1 ? "s" : ""}`).join(", ")}. Ofsted expects timely, reflective management oversight of all significant events.`,
      severity: needingOversight.length > 3 ? "critical" : needingOversight.length > 1 ? "high" : "medium",
      suggested_action: "Prioritise providing written oversight for these records. Use Cara's oversight quality prompts to ensure your oversight demonstrates reflective analysis, child focus, and clear actions.",
      data_points: needingOversight.length,
      confidence: 0.98,
      supporting_data: { by_type: byType, records: needingOversight.map((r) => r.reference) },
    });
  }

  return results;
}

// ── Weak recording detector ─────────────────────────────────────────────────

export function detectWeakRecording(
  logs: { id: string; content: string; child_id: string; date: string; mood_score: number | null }[],
  childNames: Record<string, string>,
): DetectedRecommendation[] {
  const results: DetectedRecommendation[] = [];

  // Group by child
  const byChild: Record<string, typeof logs> = {};
  for (const log of logs) {
    if (!byChild[log.child_id]) byChild[log.child_id] = [];
    byChild[log.child_id].push(log);
  }

  for (const [childId, childLogs] of Object.entries(byChild)) {
    // Check 1: Short entries (under 50 chars)
    const shortEntries = childLogs.filter((l) => l.content.length < 50);
    if (shortEntries.length > childLogs.length * 0.5 && childLogs.length >= 5) {
      results.push({
        recommendation_type: "weak_recording",
        title: `Brief daily log entries for ${childNames[childId] ?? "a young person"}`,
        description: `${shortEntries.length} of ${childLogs.length} recent daily log entries are very brief (under 50 characters). Short entries may not provide sufficient detail for regulatory compliance or demonstrate the quality of care.`,
        severity: "medium",
        suggested_action: "Discuss recording standards with the team. Entries should capture the child's experience, mood, activities, and any significant observations. Use Cara's writing support to improve recording quality.",
        linked_child_id: childId,
        data_points: childLogs.length,
        confidence: 0.8,
        supporting_data: { short_count: shortEntries.length, total_count: childLogs.length },
      });
    }

    // Check 2: Missing mood scores
    const withoutMood = childLogs.filter((l) => l.mood_score === null);
    if (withoutMood.length > childLogs.length * 0.6 && childLogs.length >= 7) {
      results.push({
        recommendation_type: "weak_recording",
        title: `Missing mood scores for ${childNames[childId] ?? "a young person"}`,
        description: `${withoutMood.length} of ${childLogs.length} recent daily logs are missing mood scores. Consistent mood tracking enables Cara to detect trends and supports evidence-based care planning.`,
        severity: "low",
        suggested_action: "Remind staff to include mood scores in daily logs. Mood data powers Cara's pattern detection and is valuable evidence for reviews.",
        linked_child_id: childId,
        data_points: childLogs.length,
        confidence: 0.85,
      });
    }
  }

  return results;
}

// ── Staffing concern detector ───────────────────────────────────────────────

export function detectStaffingConcerns(
  shifts: { staff_id: string; date: string; shift_type: string; actual_start: string | null; actual_end: string | null; status: string }[],
  now: Date,
): DetectedRecommendation[] {
  const results: DetectedRecommendation[] = [];

  // Check for open shifts in the next 7 days
  const weekAhead = new Date(now.getTime() + 7 * 86400000);
  const openShifts = shifts.filter(
    (s) => s.status === "scheduled" && !s.staff_id && new Date(s.date) <= weekAhead && new Date(s.date) >= now,
  );

  if (openShifts.length > 0) {
    results.push({
      recommendation_type: "staffing_concern",
      title: `${openShifts.length} unfilled shift${openShifts.length > 1 ? "s" : ""} this week`,
      description: `There ${openShifts.length === 1 ? "is" : "are"} ${openShifts.length} shift${openShifts.length > 1 ? "s" : ""} without an assigned staff member in the next 7 days. Staffing gaps may affect the quality of care and regulatory compliance.`,
      severity: openShifts.length > 3 ? "high" : "medium",
      suggested_action: "Fill the open shifts by assigning available staff, contacting bank workers, or reviewing whether shift patterns need adjustment.",
      data_points: openShifts.length,
      confidence: 0.95,
      supporting_data: { open_shift_count: openShifts.length },
    });
  }

  // Check for excessive consecutive shifts per staff member
  const staffShifts: Record<string, string[]> = {};
  for (const s of shifts) {
    if (s.staff_id && s.status !== "cancelled") {
      if (!staffShifts[s.staff_id]) staffShifts[s.staff_id] = [];
      staffShifts[s.staff_id].push(s.date);
    }
  }

  for (const [staffId, dates] of Object.entries(staffShifts)) {
    const sorted = [...new Set(dates)].sort();
    let maxConsecutive = 1;
    let current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
      if (diff === 1) {
        current++;
        maxConsecutive = Math.max(maxConsecutive, current);
      } else {
        current = 1;
      }
    }

    if (maxConsecutive >= 6) {
      results.push({
        recommendation_type: "wellbeing_concern",
        title: "Staff member working 6+ consecutive days",
        description: `A staff member has been scheduled for ${maxConsecutive} consecutive days. Extended working patterns risk burnout and may affect the quality of care provided to young people.`,
        severity: maxConsecutive >= 8 ? "high" : "medium",
        suggested_action: "Review this staff member's rota pattern. Ensure adequate rest days are scheduled and check in on their wellbeing. Consider the impact on care quality.",
        linked_staff_id: staffId,
        data_points: maxConsecutive,
        confidence: 0.9,
        supporting_data: { consecutive_days: maxConsecutive },
      });
    }
  }

  return results;
}

// ── Compliance gap detector ─────────────────────────────────────────────────

export function detectComplianceGaps(
  training: { staff_id: string; course_name: string; status: string; expiry_date: string | null; is_mandatory: boolean }[],
  supervisions: { staff_id: string; status: string; scheduled_date: string; actual_date: string | null }[],
  now: Date,
): DetectedRecommendation[] {
  const results: DetectedRecommendation[] = [];

  // Expired mandatory training
  const expired = training.filter(
    (t) => t.is_mandatory && t.expiry_date && new Date(t.expiry_date) < now && t.status !== "completed",
  );

  if (expired.length > 0) {
    results.push({
      recommendation_type: "training_due",
      title: `${expired.length} expired mandatory training record${expired.length > 1 ? "s" : ""}`,
      description: `${expired.length} mandatory training record${expired.length > 1 ? "s have" : " has"} expired. Expired mandatory training is a regulatory compliance issue that Ofsted will scrutinise (CHR2015 Reg 34).`,
      severity: expired.length > 5 ? "critical" : expired.length > 2 ? "high" : "medium",
      suggested_action: "Book renewal training immediately. Prioritise safeguarding, first aid, and medication training. Document any risk mitigations in place while training is being arranged.",
      data_points: expired.length,
      confidence: 0.98,
      supporting_data: { expired_courses: expired.map((t) => t.course_name) },
    });
  }

  // Overdue supervisions
  const overdue = supervisions.filter(
    (s) => s.status === "scheduled" && new Date(s.scheduled_date) < now && !s.actual_date,
  );

  if (overdue.length > 0) {
    results.push({
      recommendation_type: "supervision_due",
      title: `${overdue.length} overdue supervision${overdue.length > 1 ? "s" : ""}`,
      description: `${overdue.length} supervision session${overdue.length > 1 ? "s are" : " is"} overdue. Regular supervision is a regulatory requirement under CHR 2015 Reg 8 and demonstrates effective leadership and management.`,
      severity: overdue.length > 4 ? "high" : "medium",
      suggested_action: "Schedule the overdue supervisions as a priority. Supervision should be reflective and focus on the staff member's practice, wellbeing, and professional development.",
      data_points: overdue.length,
      confidence: 0.95,
      supporting_data: { overdue_count: overdue.length },
    });
  }

  return results;
}

// ── Incident trend detector ─────────────────────────────────────────────────

export function detectIncidentTrends(
  incidents: { id: string; type: string; severity: string; child_id: string; date: string }[],
  now: Date,
): DetectedRecommendation[] {
  const results: DetectedRecommendation[] = [];

  if (incidents.length < 3) return results;

  // Split into two periods
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);

  const recentPeriod = incidents.filter((i) => new Date(i.date) >= thirtyDaysAgo);
  const previousPeriod = incidents.filter((i) => new Date(i.date) >= sixtyDaysAgo && new Date(i.date) < thirtyDaysAgo);

  // Overall trend
  if (previousPeriod.length > 0 && recentPeriod.length > previousPeriod.length * 1.5) {
    const increase = Math.round(((recentPeriod.length - previousPeriod.length) / previousPeriod.length) * 100);
    results.push({
      recommendation_type: "incident_trend",
      title: `Incident rate increased ${increase}%`,
      description: `There have been ${recentPeriod.length} incidents in the last 30 days, compared to ${previousPeriod.length} in the previous 30 days — a ${increase}% increase. Consider whether this reflects a genuine change in risk or improved recording.`,
      severity: increase > 100 ? "high" : "medium",
      suggested_action: "Analyse the incidents for common themes, triggers, or contributing factors. Consider whether staffing, group dynamics, or external factors have changed. Discuss in the next team meeting.",
      data_points: recentPeriod.length + previousPeriod.length,
      confidence: 0.8,
      supporting_data: { recent: recentPeriod.length, previous: previousPeriod.length, increase_pct: increase },
    });
  }

  // Positive trend
  if (previousPeriod.length > 3 && recentPeriod.length < previousPeriod.length * 0.6) {
    const decrease = Math.round(((previousPeriod.length - recentPeriod.length) / previousPeriod.length) * 100);
    results.push({
      recommendation_type: "positive_recognition",
      title: `Incidents reduced by ${decrease}%`,
      description: `Incidents have decreased from ${previousPeriod.length} to ${recentPeriod.length} in the last 30 days — a ${decrease}% reduction. This is a positive trend that should be recognised and understood.`,
      severity: "info",
      suggested_action: "Celebrate this improvement with the team. Identify what has contributed to the reduction so it can be sustained. Document as evidence for Reg 45 reporting.",
      data_points: recentPeriod.length + previousPeriod.length,
      confidence: 0.8,
      supporting_data: { recent: recentPeriod.length, previous: previousPeriod.length, decrease_pct: decrease },
    });
  }

  // Per-child escalation
  const childIncidents: Record<string, { recent: number; previous: number }> = {};
  for (const i of recentPeriod) {
    if (!childIncidents[i.child_id]) childIncidents[i.child_id] = { recent: 0, previous: 0 };
    childIncidents[i.child_id].recent++;
  }
  for (const i of previousPeriod) {
    if (!childIncidents[i.child_id]) childIncidents[i.child_id] = { recent: 0, previous: 0 };
    childIncidents[i.child_id].previous++;
  }

  for (const [childId, counts] of Object.entries(childIncidents)) {
    if (counts.previous > 0 && counts.recent > counts.previous * 2 && counts.recent >= 3) {
      results.push({
        recommendation_type: "risk_escalation",
        title: "Individual incident escalation detected",
        description: `A young person's incident frequency has more than doubled: ${counts.recent} incidents in the last 30 days compared to ${counts.previous} previously. This may indicate escalating risk or unmet needs.`,
        severity: "high",
        suggested_action: "Review this young person's risk assessment and behaviour support plan. Schedule a key work session to explore what may be driving the change. Consider whether a multi-agency discussion is needed.",
        linked_child_id: childId,
        data_points: counts.recent + counts.previous,
        confidence: 0.85,
        supporting_data: { recent: counts.recent, previous: counts.previous },
      });
    }
  }

  return results;
}

// ── Positive recognition detector ───────────────────────────────────────────

export function detectPositivePatterns(
  logs: { child_id: string; mood_score: number | null; date: string }[],
  childNames: Record<string, string>,
): DetectedRecommendation[] {
  const results: DetectedRecommendation[] = [];

  // Group by child
  const byChild: Record<string, number[]> = {};
  for (const log of logs) {
    if (log.mood_score != null) {
      if (!byChild[log.child_id]) byChild[log.child_id] = [];
      byChild[log.child_id].push(log.mood_score);
    }
  }

  for (const [childId, scores] of Object.entries(byChild)) {
    if (scores.length < 10) continue;

    // Check for consistent improvement
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (avgSecond > avgFirst + 1.5) {
      results.push({
        recommendation_type: "positive_recognition",
        title: `Improving mood trend for ${childNames[childId] ?? "a young person"}`,
        description: `Average mood score has improved from ${avgFirst.toFixed(1)} to ${avgSecond.toFixed(1)} over recent recordings. This positive trajectory suggests current care arrangements are supporting this young person's emotional wellbeing.`,
        severity: "info",
        suggested_action: "Recognise this improvement with the young person and team. Record in the care plan review. Identify what has been working well so the approach can be sustained.",
        linked_child_id: childId,
        data_points: scores.length,
        confidence: 0.75,
        supporting_data: { avg_early: avgFirst, avg_recent: avgSecond, total_scores: scores.length },
      });
    }
  }

  return results;
}

// ── Handover quality detector ───────────────────────────────────────────────

export function detectHandoverGaps(
  handovers: { date: string; shift_type: string; content: string; has_yp_updates: boolean }[],
): DetectedRecommendation[] {
  const results: DetectedRecommendation[] = [];

  if (handovers.length < 5) return results;

  // Check for missing YP updates in handovers
  const withoutUpdates = handovers.filter((h) => !h.has_yp_updates);
  if (withoutUpdates.length > handovers.length * 0.4) {
    results.push({
      recommendation_type: "handover_quality",
      title: "Handover notes missing young person updates",
      description: `${withoutUpdates.length} of ${handovers.length} recent handover notes do not contain individual young person updates. Effective handovers should include updates on each young person's mood, activities, and any significant events.`,
      severity: "medium",
      suggested_action: "Remind staff that handover notes should include individual updates for each young person. Consider using a structured handover template to ensure consistency.",
      data_points: handovers.length,
      confidence: 0.8,
      supporting_data: { without_updates: withoutUpdates.length, total: handovers.length },
    });
  }

  // Check for very short handovers
  const shortHandovers = handovers.filter((h) => h.content.length < 100);
  if (shortHandovers.length > handovers.length * 0.3) {
    results.push({
      recommendation_type: "handover_quality",
      title: "Brief handover notes",
      description: `${shortHandovers.length} of ${handovers.length} recent handovers are very brief (under 100 characters). Quality handovers are essential for safe transitions between shifts.`,
      severity: "low",
      suggested_action: "Discuss handover expectations with the team. Handovers should cover: key events, young people's presentations, medication updates, outstanding tasks, and any risks.",
      data_points: handovers.length,
      confidence: 0.75,
    });
  }

  return results;
}

// ── Store recommendations ───────────────────────────────────────────────────

export async function storeRecommendations(
  homeId: string,
  recommendations: DetectedRecommendation[],
): Promise<ServiceResult<CsCaraRecommendation[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };
  if (recommendations.length === 0) return { ok: true, data: [] };

  const inserts = recommendations.map((r) => ({
    home_id: homeId,
    recommendation_type: r.recommendation_type,
    title: r.title,
    description: r.description,
    severity: r.severity,
    suggested_action: r.suggested_action,
    linked_child_id: r.linked_child_id ?? null,
    linked_staff_id: r.linked_staff_id ?? null,
    linked_entity_type: r.linked_entity_type ?? null,
    linked_entity_id: r.linked_entity_id ?? null,
    data_points: r.data_points,
    confidence: r.confidence,
    supporting_data: r.supporting_data ?? null,
    status: "active",
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(), // 7 days
  }));

  const { data, error } = await (s.from("cs_aria_recommendations") as SB)
    .insert(inserts)
    .select();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

// ── Recommendation stats ────────────────────────────────────────────────────

export async function getRecommendationStats(
  homeId: string,
): Promise<ServiceResult<{
  total_active: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
  actioned_this_week: number;
  dismissed_this_week: number;
}>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_aria_recommendations") as SB)
    .select("status, severity, recommendation_type, action_at, acknowledged_at")
    .eq("home_id", homeId);

  if (error) return { ok: false, error: error.message };

  const all = data ?? [];
  const active = all.filter((r: any) => r.status === "active");
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const bySeverity: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const r of active) {
    bySeverity[r.severity] = (bySeverity[r.severity] ?? 0) + 1;
    byType[r.recommendation_type] = (byType[r.recommendation_type] ?? 0) + 1;
  }

  return {
    ok: true,
    data: {
      total_active: active.length,
      by_severity: bySeverity,
      by_type: byType,
      actioned_this_week: all.filter((r: any) => r.status === "actioned" && r.action_at > weekAgo).length,
      dismissed_this_week: all.filter((r: any) => r.status === "dismissed" && r.acknowledged_at > weekAgo).length,
    },
  };
}

// ── Testing exports ─────────────────────────────────────────────────────────

export const _testing = {
  detectOverdueForms,
  detectMissingOversight,
  detectWeakRecording,
  detectStaffingConcerns,
  detectComplianceGaps,
  detectIncidentTrends,
  detectPositivePatterns,
  detectHandoverGaps,
};
