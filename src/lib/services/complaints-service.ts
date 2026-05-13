// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — COMPLAINTS & NOTIFICATIONS SERVICE
// Manages complaints handling (CHR 2015 Reg 39), Reg 40 statutory notifications
// to Ofsted, compliance tracking, and pattern analysis.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface Complaint {
  id: string;
  home_id: string;
  complaint_category: string;
  source: string;
  complainant_name: string;
  child_id?: string | null;
  staff_id?: string | null;
  date_received: string;
  date_acknowledged?: string | null;
  date_responded?: string | null;
  stage: string;
  description: string;
  desired_outcome?: string | null;
  investigation_notes?: string | null;
  outcome?: string | null;
  actions_taken: string[];
  lessons_learned?: string | null;
  complainant_satisfied?: boolean | null;
  advocacy_offered: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Reg40Notification {
  id: string;
  home_id: string;
  notification_type: string;
  child_id?: string | null;
  staff_id?: string | null;
  linked_incident_id?: string | null;
  linked_complaint_id?: string | null;
  event_date: string;
  notification_date?: string | null;
  sent_by?: string | null;
  ofsted_reference?: string | null;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const COMPLAINT_CATEGORIES: { category: string; label: string }[] = [
  { category: "care_quality", label: "Quality of Care" },
  { category: "staff_conduct", label: "Staff Conduct" },
  { category: "food_nutrition", label: "Food & Nutrition" },
  { category: "physical_environment", label: "Physical Environment" },
  { category: "privacy_dignity", label: "Privacy & Dignity" },
  { category: "bullying", label: "Bullying" },
  { category: "contact_arrangements", label: "Contact Arrangements" },
  { category: "activities", label: "Activities & Enrichment" },
  { category: "education", label: "Education" },
  { category: "health", label: "Health & Wellbeing" },
  { category: "medication", label: "Medication" },
  { category: "communication", label: "Communication" },
  { category: "decision_making", label: "Decision Making" },
  { category: "discrimination", label: "Discrimination" },
  { category: "other", label: "Other" },
];

export const COMPLAINT_SOURCES: string[] = [
  "child", "parent", "placing_authority", "advocate",
  "staff", "visitor", "professional", "anonymous",
];

export const REG40_NOTIFICATION_TYPES: {
  type: string;
  deadline_hours: number;
  label: string;
}[] = [
  { type: "death", deadline_hours: 0, label: "Death of a Child" },
  { type: "serious_injury", deadline_hours: 24, label: "Serious Injury" },
  { type: "serious_illness", deadline_hours: 24, label: "Serious Illness" },
  { type: "missing", deadline_hours: 24, label: "Missing from Care" },
  { type: "police_involvement", deadline_hours: 24, label: "Police Involvement" },
  { type: "allegation_against_staff", deadline_hours: 24, label: "Allegation Against Staff" },
  { type: "physical_intervention", deadline_hours: 24, label: "Physical Intervention (significant)" },
  { type: "child_protection", deadline_hours: 24, label: "Child Protection Enquiry" },
  { type: "serious_complaint", deadline_hours: 24, label: "Serious Complaint" },
  { type: "absconding", deadline_hours: 24, label: "Absconding" },
  { type: "accommodation_issue", deadline_hours: 24, label: "Significant Accommodation Issue" },
];

export const COMPLAINT_STAGES: string[] = [
  "informal", "formal_stage1", "formal_stage2", "independent_review", "ombudsman",
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute summary statistics from a set of complaints.
 */
export function computeComplaintsSummary(complaints: Complaint[]): {
  total: number;
  open: number;
  investigating: number;
  responded: number;
  closed: number;
  escalated: number;
  by_category: Record<string, number>;
  by_source: Record<string, number>;
  avg_response_days: number;
  acknowledged_within_2_days: number;
  acknowledged_total: number;
  satisfaction_rate: number;
  advocacy_offered_rate: number;
} {
  const byCategory: Record<string, number> = {};
  const bySource: Record<string, number> = {};

  let open = 0;
  let investigating = 0;
  let responded = 0;
  let closed = 0;
  let escalated = 0;

  let totalResponseDays = 0;
  let responseCount = 0;
  let acknowledgedWithin2Days = 0;
  let acknowledgedTotal = 0;
  let satisfiedCount = 0;
  let satisfactionDenominator = 0;
  let advocacyOfferedCount = 0;

  for (const c of complaints) {
    // Count by status
    switch (c.status) {
      case "open": open++; break;
      case "investigating": investigating++; break;
      case "responded": responded++; break;
      case "closed": closed++; break;
      case "escalated": escalated++; break;
    }

    // Count by category
    byCategory[c.complaint_category] = (byCategory[c.complaint_category] ?? 0) + 1;

    // Count by source
    bySource[c.source] = (bySource[c.source] ?? 0) + 1;

    // Average response days (for responded/closed complaints with date_responded)
    if ((c.status === "responded" || c.status === "closed") && c.date_responded) {
      const received = new Date(c.date_received).getTime();
      const respondedAt = new Date(c.date_responded).getTime();
      const days = (respondedAt - received) / (1000 * 60 * 60 * 24);
      totalResponseDays += days;
      responseCount++;
    }

    // Acknowledgement tracking
    if (c.date_acknowledged) {
      acknowledgedTotal++;
      const received = new Date(c.date_received).getTime();
      const acknowledged = new Date(c.date_acknowledged).getTime();
      const days = (acknowledged - received) / (1000 * 60 * 60 * 24);
      if (days <= 2) {
        acknowledgedWithin2Days++;
      }
    }

    // Satisfaction tracking (ignore null)
    if (c.complainant_satisfied === true) {
      satisfiedCount++;
      satisfactionDenominator++;
    } else if (c.complainant_satisfied === false) {
      satisfactionDenominator++;
    }

    // Advocacy offered
    if (c.advocacy_offered) {
      advocacyOfferedCount++;
    }
  }

  const total = complaints.length;

  const avgResponseDays =
    responseCount > 0
      ? Math.round((totalResponseDays / responseCount) * 10) / 10
      : 0;

  const satisfactionRate =
    satisfactionDenominator > 0
      ? Math.round((satisfiedCount / satisfactionDenominator) * 1000) / 10
      : 0;

  const advocacyOfferedRate =
    total > 0
      ? Math.round((advocacyOfferedCount / total) * 1000) / 10
      : 0;

  return {
    total,
    open,
    investigating,
    responded,
    closed,
    escalated,
    by_category: byCategory,
    by_source: bySource,
    avg_response_days: avgResponseDays,
    acknowledged_within_2_days: acknowledgedWithin2Days,
    acknowledged_total: acknowledgedTotal,
    satisfaction_rate: satisfactionRate,
    advocacy_offered_rate: advocacyOfferedRate,
  };
}

/**
 * Compute Reg 40 notification compliance metrics.
 */
export function computeNotificationCompliance(notifications: Reg40Notification[]): {
  total: number;
  pending: number;
  sent_on_time: number;
  sent_late: number;
  overdue: number;
  by_type: Record<string, number>;
  compliance_rate: number;
} {
  const byType: Record<string, number> = {};

  let pending = 0;
  let sentOnTime = 0;
  let sentLate = 0;
  let overdue = 0;

  const now = new Date();

  for (const n of notifications) {
    // Count by type
    byType[n.notification_type] = (byType[n.notification_type] ?? 0) + 1;

    // Look up deadline hours for this notification type
    const typeConfig = REG40_NOTIFICATION_TYPES.find((t) => t.type === n.notification_type);
    const deadlineHours = typeConfig?.deadline_hours ?? 24;

    if (n.status === "sent" || n.status === "acknowledged") {
      // Notification was sent — check if on time
      if (n.notification_date) {
        const eventDate = new Date(n.event_date).getTime();
        const notificationDate = new Date(n.notification_date).getTime();
        const hoursElapsed = (notificationDate - eventDate) / (1000 * 60 * 60);

        if (hoursElapsed <= deadlineHours) {
          sentOnTime++;
        } else {
          sentLate++;
        }
      } else {
        // Status is sent but no notification_date — treat as sent on time
        sentOnTime++;
      }
    } else if (n.status === "pending") {
      // Check if overdue
      const eventDate = new Date(n.event_date).getTime();
      const hoursElapsed = (now.getTime() - eventDate) / (1000 * 60 * 60);

      if (hoursElapsed > deadlineHours) {
        overdue++;
      } else {
        pending++;
      }
    } else if (n.status === "overdue") {
      overdue++;
    }
  }

  const complianceDenominator = sentOnTime + sentLate + overdue;
  const complianceRate =
    complianceDenominator > 0
      ? Math.round((sentOnTime / complianceDenominator) * 1000) / 10
      : 100;

  return {
    total: notifications.length,
    pending,
    sent_on_time: sentOnTime,
    sent_late: sentLate,
    overdue,
    by_type: byType,
    compliance_rate: complianceRate,
  };
}

/**
 * Compute complaint trends for the last 6 months.
 */
export function computeComplaintTrends(complaints: Complaint[]): {
  monthly_counts: { month: string; count: number }[];
  top_categories: { category: string; count: number }[];
  repeat_complainants: { name: string; count: number }[];
  child_complaints_count: number;
  lessons_identified: number;
} {
  const now = new Date();

  // Build last 6 months
  const months: { key: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    months.push({ key, start: d, end });
  }

  // Monthly counts
  const monthlyCounts: Record<string, number> = {};
  for (const m of months) {
    monthlyCounts[m.key] = 0;
  }

  // Category counts for top categories
  const categoryCounts: Record<string, number> = {};

  // Complainant name counts for repeat detection
  const complainantCounts: Record<string, number> = {};

  let childComplaintsCount = 0;
  let lessonsIdentified = 0;

  for (const c of complaints) {
    const receivedDate = new Date(c.date_received);

    // Monthly bucketing
    for (const m of months) {
      if (receivedDate >= m.start && receivedDate <= m.end) {
        monthlyCounts[m.key]++;
        break;
      }
    }

    // Category counts
    categoryCounts[c.complaint_category] = (categoryCounts[c.complaint_category] ?? 0) + 1;

    // Complainant counts
    const name = c.complainant_name.trim().toLowerCase();
    if (name) {
      complainantCounts[name] = (complainantCounts[name] ?? 0) + 1;
    }

    // Child complaints
    if (c.source === "child") {
      childComplaintsCount++;
    }

    // Lessons learned
    if (c.lessons_learned && c.lessons_learned.trim().length > 0) {
      lessonsIdentified++;
    }
  }

  // Format monthly counts
  const monthlyCountsArray = months.map((m) => ({
    month: m.key,
    count: monthlyCounts[m.key],
  }));

  // Top 5 categories
  const topCategories = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Repeat complainants (2+)
  const repeatComplainants = Object.entries(complainantCounts)
    .filter(([, count]) => count >= 2)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    monthly_counts: monthlyCountsArray,
    top_categories: topCategories,
    repeat_complainants: repeatComplainants,
    child_complaints_count: childComplaintsCount,
    lessons_identified: lessonsIdentified,
  };
}

/**
 * Identify alerts from complaints and Reg 40 notifications.
 */
export function identifyComplaintAlerts(
  complaints: Complaint[],
  notifications: Reg40Notification[],
): { type: string; severity: "critical" | "high" | "medium" | "low"; message: string; id: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string; id: string }[] = [];
  const now = new Date();

  // ── Notification alerts ──────────────────────────────────────────────
  for (const n of notifications) {
    if (n.status === "pending" || n.status === "overdue") {
      const typeConfig = REG40_NOTIFICATION_TYPES.find((t) => t.type === n.notification_type);
      const deadlineHours = typeConfig?.deadline_hours ?? 24;
      const label = typeConfig?.label ?? n.notification_type;
      const eventDate = new Date(n.event_date).getTime();
      const hoursElapsed = (now.getTime() - eventDate) / (1000 * 60 * 60);

      if (hoursElapsed > deadlineHours) {
        alerts.push({
          type: "notification_overdue",
          severity: "critical",
          message: `Reg 40 notification "${label}" is overdue — event occurred ${Math.round(hoursElapsed)}h ago, deadline was ${deadlineHours}h`,
          id: n.id,
        });
      }
    }
  }

  // ── Complaint alerts ─────────────────────────────────────────────────
  const twentyDaysMs = 20 * 24 * 60 * 60 * 1000;
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

  for (const c of complaints) {
    const receivedDate = new Date(c.date_received).getTime();

    // Response overdue: open/investigating complaint older than 20 days
    if ((c.status === "open" || c.status === "investigating") && !c.date_responded) {
      if (now.getTime() - receivedDate > twentyDaysMs) {
        const daysElapsed = Math.round((now.getTime() - receivedDate) / (1000 * 60 * 60 * 24));
        alerts.push({
          type: "response_overdue",
          severity: "high",
          message: `Complaint from ${c.complainant_name} has been ${c.status} for ${daysElapsed} days — response required within 20 working days`,
          id: c.id,
        });
      }
    }

    // Acknowledgement overdue: no date_acknowledged within 2 days
    if (!c.date_acknowledged) {
      if (now.getTime() - receivedDate > twoDaysMs) {
        const daysElapsed = Math.round((now.getTime() - receivedDate) / (1000 * 60 * 60 * 24));
        alerts.push({
          type: "acknowledgement_overdue",
          severity: "medium",
          message: `Complaint from ${c.complainant_name} has not been acknowledged after ${daysElapsed} days — acknowledgement required within 2 working days`,
          id: c.id,
        });
      }
    }

    // Escalated complaint: stage formal_stage2 or higher
    const escalatedStages = ["formal_stage2", "independent_review", "ombudsman"];
    if (escalatedStages.includes(c.stage)) {
      alerts.push({
        type: "escalated_complaint",
        severity: "high",
        message: `Complaint from ${c.complainant_name} has been escalated to ${c.stage.replace(/_/g, " ")}`,
        id: c.id,
      });
    }
  }

  // ── Pattern detection: 3+ complaints in same category within 30 days ─
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const recentComplaints = complaints.filter(
    (c) => now.getTime() - new Date(c.date_received).getTime() <= thirtyDaysMs,
  );

  const recentByCategory: Record<string, Complaint[]> = {};
  for (const c of recentComplaints) {
    if (!recentByCategory[c.complaint_category]) {
      recentByCategory[c.complaint_category] = [];
    }
    recentByCategory[c.complaint_category].push(c);
  }

  for (const [category, group] of Object.entries(recentByCategory)) {
    if (group.length >= 3) {
      const catConfig = COMPLAINT_CATEGORIES.find((cc) => cc.category === category);
      const label = catConfig?.label ?? category;
      alerts.push({
        type: "pattern_detected",
        severity: "medium",
        message: `${group.length} complaints in "${label}" category within the last 30 days — possible systemic issue`,
        id: group[0].id,
      });
    }
  }

  return alerts;
}

// ── CRUD — Complaints ────────────────────────────────────────────────────

export async function listComplaints(
  homeId: string,
  filters?: {
    childId?: string;
    status?: string;
    category?: string;
    source?: string;
    limit?: number;
  },
): Promise<ServiceResult<Complaint[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_complaints") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.category) q = q.eq("complaint_category", filters.category);
  if (filters?.source) q = q.eq("source", filters.source);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getComplaint(
  id: string,
): Promise<ServiceResult<Complaint>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_complaints") as SB)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createComplaint(
  input: Omit<Complaint, "id" | "status" | "created_at" | "updated_at">,
): Promise<ServiceResult<Complaint>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_complaints") as SB)
    .insert({
      home_id: input.home_id,
      complaint_category: input.complaint_category,
      source: input.source,
      complainant_name: input.complainant_name,
      child_id: input.child_id ?? null,
      staff_id: input.staff_id ?? null,
      date_received: input.date_received,
      date_acknowledged: input.date_acknowledged ?? null,
      date_responded: input.date_responded ?? null,
      stage: input.stage,
      description: input.description,
      desired_outcome: input.desired_outcome ?? null,
      investigation_notes: input.investigation_notes ?? null,
      outcome: input.outcome ?? null,
      actions_taken: input.actions_taken ?? [],
      lessons_learned: input.lessons_learned ?? null,
      complainant_satisfied: input.complainant_satisfied ?? null,
      advocacy_offered: input.advocacy_offered,
      status: "open",
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateComplaint(
  id: string,
  updates: Partial<Complaint>,
): Promise<ServiceResult<Complaint>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_complaints") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function closeComplaint(
  id: string,
  outcome: string,
  lessonLearned?: string,
): Promise<ServiceResult<Complaint>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const updatePayload: Record<string, unknown> = {
    status: "closed",
    outcome,
    updated_at: new Date().toISOString(),
  };
  if (lessonLearned !== undefined) {
    updatePayload.lessons_learned = lessonLearned;
  }

  const { data, error } = await (s.from("cs_complaints") as SB)
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Reg 40 Notifications ──────────────────────────────────────────

export async function listNotifications(
  homeId: string,
  filters?: {
    status?: string;
    notificationType?: string;
    limit?: number;
  },
): Promise<ServiceResult<Reg40Notification[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_reg40_notifications") as SB).select("*").eq("home_id", homeId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.notificationType) q = q.eq("notification_type", filters.notificationType);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createNotification(
  input: Omit<Reg40Notification, "id" | "status" | "created_at" | "updated_at">,
): Promise<ServiceResult<Reg40Notification>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const status = input.notification_date ? "sent" : "pending";

  const { data, error } = await (s.from("cs_reg40_notifications") as SB)
    .insert({
      home_id: input.home_id,
      notification_type: input.notification_type,
      child_id: input.child_id ?? null,
      staff_id: input.staff_id ?? null,
      linked_incident_id: input.linked_incident_id ?? null,
      linked_complaint_id: input.linked_complaint_id ?? null,
      event_date: input.event_date,
      notification_date: input.notification_date ?? null,
      sent_by: input.sent_by ?? null,
      ofsted_reference: input.ofsted_reference ?? null,
      description: input.description,
      status,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function sendNotification(
  id: string,
  sentBy: string,
  ofstedReference?: string,
): Promise<ServiceResult<Reg40Notification>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const updatePayload: Record<string, unknown> = {
    status: "sent",
    notification_date: new Date().toISOString(),
    sent_by: sentBy,
    updated_at: new Date().toISOString(),
  };
  if (ofstedReference !== undefined) {
    updatePayload.ofsted_reference = ofstedReference;
  }

  const { data, error } = await (s.from("cs_reg40_notifications") as SB)
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeComplaintsSummary,
  computeNotificationCompliance,
  computeComplaintTrends,
  identifyComplaintAlerts,
};
