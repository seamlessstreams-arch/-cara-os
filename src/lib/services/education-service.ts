// ══════════════════════════════════════════════════════════════════════════════
// CARA — EDUCATION & ACTIVITIES SERVICE
// Tracks education placements, attendance, exclusions, PEPs, enrichment
// activities, and generates alerts for Ofsted-scrutinised outcomes.
// CHR 2015 Reg 8 (education), Reg 10 (enjoyment and achievement).
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const EDUCATION_STATUSES = [
  { status: "full_time_school", label: "Full-Time School" },
  { status: "part_time_school", label: "Part-Time/Reduced Timetable" },
  { status: "alternative_provision", label: "Alternative Provision" },
  { status: "preschool", label: "Pre-School/Nursery" },
  { status: "college", label: "College/FE" },
  { status: "apprenticeship", label: "Apprenticeship" },
  { status: "neet", label: "NEET (Not in Education, Employment or Training)" },
  { status: "home_educated", label: "Home Educated" },
  { status: "excluded", label: "Currently Excluded" },
  { status: "awaiting_placement", label: "Awaiting School Placement" },
] as const;

export const EXCLUSION_TYPES = ["fixed_term", "permanent", "internal", "informal"] as const;

export const ATTENDANCE_MARKS = [
  "present", "authorised_absence", "unauthorised_absence",
  "late", "excluded", "medical", "activity",
] as const;

export const ACTIVITY_CATEGORIES = [
  { category: "sport", label: "Sport & Physical Activity" },
  { category: "creative", label: "Creative Arts" },
  { category: "social", label: "Social Activity" },
  { category: "educational", label: "Educational Enrichment" },
  { category: "life_skills", label: "Life Skills" },
  { category: "community", label: "Community Involvement" },
  { category: "therapeutic", label: "Therapeutic Activity" },
  { category: "outdoor", label: "Outdoor Adventure" },
  { category: "cultural", label: "Cultural Experience" },
  { category: "employment", label: "Employment/Work Experience" },
] as const;

export const PEP_TARGETS_STATUS = [
  "not_started", "in_progress", "achieved", "partially_achieved", "not_achieved",
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EducationRecord {
  id: string;
  home_id: string;
  child_id: string;
  education_status: string;
  school_name: string;
  year_group?: string | null;
  sen_status?: string | null; // none, sen_support, ehcp
  pupil_premium_plus: boolean;
  virtual_school_contact?: string | null;
  designated_teacher?: string | null;
  pep_date?: string | null;
  next_pep_date?: string | null;
  attendance_percentage?: number | null;
  exclusion_count: number;
  achievements: string[]; // jsonb
  concerns: string[]; // jsonb
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttendanceEntry {
  id: string;
  home_id: string;
  child_id: string;
  education_record_id: string;
  date: string;
  mark: string; // from ATTENDANCE_MARKS
  session: "am" | "pm";
  notes?: string | null;
  recorded_by: string;
  created_at: string;
}

export interface ActivityRecord {
  id: string;
  home_id: string;
  child_id: string;
  activity_name: string;
  category: string; // from ACTIVITY_CATEGORIES
  date: string;
  duration_minutes?: number | null;
  location?: string | null;
  description?: string | null;
  child_feedback?: string | null;
  child_enjoyed: boolean;
  skills_developed: string[]; // jsonb
  staff_member: string;
  created_at: string;
}

// ── Pure analysis functions ───────────────────────────────────────────────────

export function computeAttendanceStats(entries: AttendanceEntry[]): {
  total_sessions: number;
  present: number;
  authorised_absence: number;
  unauthorised_absence: number;
  late: number;
  excluded: number;
  attendance_rate: number | null;
  unauthorised_rate: number | null;
} {
  const total_sessions = entries.length;

  const present = entries.filter((e) => e.mark === "present").length;
  const authorised_absence = entries.filter((e) => e.mark === "authorised_absence").length;
  const unauthorised_absence = entries.filter((e) => e.mark === "unauthorised_absence").length;
  const late = entries.filter((e) => e.mark === "late").length;
  const excluded = entries.filter((e) => e.mark === "excluded").length;

  const attendance_rate = total_sessions > 0
    ? Math.round(((present + late) / total_sessions) * 1000) / 10
    : null;

  const unauthorised_rate = total_sessions > 0
    ? Math.round((unauthorised_absence / total_sessions) * 1000) / 10
    : null;

  return {
    total_sessions,
    present,
    authorised_absence,
    unauthorised_absence,
    late,
    excluded,
    attendance_rate,
    unauthorised_rate,
  };
}

export function computeEducationProfile(
  records: EducationRecord[],
  _attendance: AttendanceEntry[],
  activities: ActivityRecord[],
): {
  total_children: number;
  neet_count: number;
  excluded_count: number;
  sen_count: number;
  ehcp_count: number;
  avg_attendance: number | null;
  pep_overdue: number;
  activity_count_30d: number;
  activity_categories: Record<string, number>;
} {
  // Unique children across all records
  const childIds = new Set(records.map((r) => r.child_id));
  const total_children = childIds.size;

  // Per-child current status counts (use the record itself, which may be current)
  const neet_count = new Set(
    records.filter((r) => r.education_status === "neet").map((r) => r.child_id),
  ).size;

  const excluded_count = new Set(
    records.filter((r) => r.education_status === "excluded").map((r) => r.child_id),
  ).size;

  const sen_count = new Set(
    records
      .filter((r) => r.sen_status != null && r.sen_status !== "none")
      .map((r) => r.child_id),
  ).size;

  const ehcp_count = new Set(
    records.filter((r) => r.sen_status === "ehcp").map((r) => r.child_id),
  ).size;

  // Average attendance_percentage across records with non-null values
  const attendanceValues = records
    .map((r) => r.attendance_percentage)
    .filter((v): v is number => v != null);
  const avg_attendance = attendanceValues.length > 0
    ? Math.round((attendanceValues.reduce((s, v) => s + v, 0) / attendanceValues.length) * 10) / 10
    : null;

  // PEP overdue: next_pep_date in the past
  const now = new Date();
  const pep_overdue = records.filter((r) => {
    if (!r.next_pep_date) return false;
    return new Date(r.next_pep_date) < now;
  }).length;

  // Activities in last 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const recentActivities = activities.filter((a) => new Date(a.date) >= thirtyDaysAgo);
  const activity_count_30d = recentActivities.length;

  const activity_categories: Record<string, number> = {};
  for (const a of recentActivities) {
    activity_categories[a.category] = (activity_categories[a.category] ?? 0) + 1;
  }

  return {
    total_children,
    neet_count,
    excluded_count,
    sen_count,
    ehcp_count,
    avg_attendance,
    pep_overdue,
    activity_count_30d,
    activity_categories,
  };
}

export function computeActivityEngagement(activities: ActivityRecord[]): {
  total_activities: number;
  unique_children: number;
  enjoyment_rate: number | null;
  avg_duration: number | null;
  by_category: Record<string, number>;
  top_skills: { skill: string; count: number }[];
  feedback_rate: number | null;
} {
  const total_activities = activities.length;
  const unique_children = new Set(activities.map((a) => a.child_id)).size;

  const enjoyment_rate = total_activities > 0
    ? Math.round((activities.filter((a) => a.child_enjoyed).length / total_activities) * 1000) / 10
    : null;

  const durations = activities
    .map((a) => a.duration_minutes)
    .filter((d): d is number => d != null);
  const avg_duration = durations.length > 0
    ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
    : null;

  const by_category: Record<string, number> = {};
  for (const a of activities) {
    by_category[a.category] = (by_category[a.category] ?? 0) + 1;
  }

  // Top 5 skills across all activities
  const skillCounts: Record<string, number> = {};
  for (const a of activities) {
    for (const skill of a.skills_developed) {
      skillCounts[skill] = (skillCounts[skill] ?? 0) + 1;
    }
  }
  const top_skills = Object.entries(skillCounts)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const feedback_rate = total_activities > 0
    ? Math.round(
        (activities.filter((a) => a.child_feedback != null && a.child_feedback !== "").length /
          total_activities) *
          1000,
      ) / 10
    : null;

  return {
    total_activities,
    unique_children,
    enjoyment_rate,
    avg_duration,
    by_category,
    top_skills,
    feedback_rate,
  };
}

export function identifyEducationAlerts(
  records: EducationRecord[],
  _attendance: AttendanceEntry[],
): { type: string; severity: "critical" | "high" | "medium" | "low"; message: string; child_id: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string; child_id: string }[] = [];

  const now = new Date();

  for (const r of records) {
    // NEET
    if (r.education_status === "neet") {
      alerts.push({
        type: "neet",
        severity: "critical",
        message: `Child is NEET (Not in Education, Employment or Training)`,
        child_id: r.child_id,
      });
    }

    // Currently excluded
    if (r.education_status === "excluded") {
      alerts.push({
        type: "excluded",
        severity: "high",
        message: `Child is currently excluded from education`,
        child_id: r.child_id,
      });
    }

    // Awaiting school placement
    if (r.education_status === "awaiting_placement") {
      alerts.push({
        type: "no_school_placement",
        severity: "high",
        message: `Child is awaiting school placement`,
        child_id: r.child_id,
      });
    }

    // Persistent absence (< 50%)
    if (r.attendance_percentage != null && r.attendance_percentage < 50) {
      alerts.push({
        type: "persistent_absence",
        severity: "critical",
        message: `Persistent absence: attendance at ${r.attendance_percentage}%`,
        child_id: r.child_id,
      });
    }
    // Low attendance (< 90%, but not already flagged as persistent absence)
    else if (r.attendance_percentage != null && r.attendance_percentage < 90) {
      alerts.push({
        type: "low_attendance",
        severity: r.attendance_percentage < 85 ? "high" : "medium",
        message: `Low attendance: ${r.attendance_percentage}%`,
        child_id: r.child_id,
      });
    }

    // PEP overdue
    if (r.next_pep_date && new Date(r.next_pep_date) < now) {
      alerts.push({
        type: "pep_overdue",
        severity: "medium",
        message: `PEP review overdue (was due ${r.next_pep_date})`,
        child_id: r.child_id,
      });
    }
  }

  return alerts;
}

// ── Education record CRUD ─────────────────────────────────────────────────────

export async function listEducationRecords(
  homeId: string,
  filters?: { childId?: string; currentOnly?: boolean },
): Promise<ServiceResult<EducationRecord[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  const currentOnly = filters?.currentOnly ?? true;

  let q = (s.from("cs_education_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (currentOnly) q = q.eq("is_current", true);
  q = q.order("updated_at", { ascending: false });

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getEducationRecord(
  id: string,
): Promise<ServiceResult<EducationRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_education_records") as SB)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createEducationRecord(
  input: Omit<EducationRecord, "id" | "is_current" | "exclusion_count" | "created_at" | "updated_at">,
): Promise<ServiceResult<EducationRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_education_records") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      education_status: input.education_status,
      school_name: input.school_name,
      year_group: input.year_group ?? null,
      sen_status: input.sen_status ?? null,
      pupil_premium_plus: input.pupil_premium_plus,
      virtual_school_contact: input.virtual_school_contact ?? null,
      designated_teacher: input.designated_teacher ?? null,
      pep_date: input.pep_date ?? null,
      next_pep_date: input.next_pep_date ?? null,
      attendance_percentage: input.attendance_percentage ?? null,
      exclusion_count: 0,
      achievements: input.achievements ?? [],
      concerns: input.concerns ?? [],
      is_current: true,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateEducationRecord(
  id: string,
  updates: Partial<EducationRecord>,
): Promise<ServiceResult<EducationRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_education_records") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Attendance CRUD ───────────────────────────────────────────────────────────

export async function recordAttendance(
  input: Omit<AttendanceEntry, "id" | "created_at">,
): Promise<ServiceResult<AttendanceEntry>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_attendance_entries") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      education_record_id: input.education_record_id,
      date: input.date,
      mark: input.mark,
      session: input.session,
      notes: input.notes ?? null,
      recorded_by: input.recorded_by,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function listAttendance(
  homeId: string,
  filters?: { childId?: string; educationRecordId?: string; dateFrom?: string; dateTo?: string; limit?: number },
): Promise<ServiceResult<AttendanceEntry[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_attendance_entries") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.educationRecordId) q = q.eq("education_record_id", filters.educationRecordId);
  if (filters?.dateFrom) q = q.gte("date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("date", filters.dateTo);
  q = q.order("date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

// ── Activity CRUD ─────────────────────────────────────────────────────────────

export async function recordActivity(
  input: Omit<ActivityRecord, "id" | "created_at">,
): Promise<ServiceResult<ActivityRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_activities") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      activity_name: input.activity_name,
      category: input.category,
      date: input.date,
      duration_minutes: input.duration_minutes ?? null,
      location: input.location ?? null,
      description: input.description ?? null,
      child_feedback: input.child_feedback ?? null,
      child_enjoyed: input.child_enjoyed,
      skills_developed: input.skills_developed ?? [],
      staff_member: input.staff_member,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function listActivities(
  homeId: string,
  filters?: { childId?: string; category?: string; dateFrom?: string; dateTo?: string; limit?: number },
): Promise<ServiceResult<ActivityRecord[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_activities") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.dateFrom) q = q.gte("date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("date", filters.dateTo);
  q = q.order("date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

// ── Testing exports ───────────────────────────────────────────────────────────

export const _testing = {
  computeAttendanceStats,
  computeEducationProfile,
  computeActivityEngagement,
  identifyEducationAlerts,
};
