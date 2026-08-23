// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONTACT & FAMILY ENGAGEMENT SERVICE
// Manages contact plans, session recording, family engagement tracking,
// and compliance analytics. CHR 2015 Reg 7 (care plans / contact),
// Reg 8 (promoting contact), Reg 10 (positive relationships).
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import { londonDayDiff } from "@/lib/utils";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface ContactPlan {
  id: string;
  home_id: string;
  child_id: string;
  contact_person_name: string;
  contact_person_role: string;
  relationship_detail: string;
  approved_contact_types: string[];
  supervision_level: string;
  planned_frequency: string;
  court_ordered: boolean;
  risk_notes?: string | null;
  is_active: boolean;
  approved_by: string;
  approved_date: string;
  review_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactRecord {
  id: string;
  home_id: string;
  child_id: string;
  contact_plan_id?: string | null;
  contact_person_name: string;
  contact_person_role: string;
  contact_type: string;
  supervision_level: string;
  scheduled_date: string;
  actual_date?: string | null;
  duration_minutes?: number | null;
  location?: string | null;
  outcome: string;
  child_mood_before?: number | null;
  child_mood_after?: number | null;
  child_voice?: string | null;
  staff_observations?: string | null;
  safeguarding_concerns?: string | null;
  supervised_by?: string | null;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CONTACT_TYPES: { type: string; label: string }[] = [
  { type: "face_to_face", label: "Face to Face Visit" },
  { type: "phone_call", label: "Phone Call" },
  { type: "video_call", label: "Video Call" },
  { type: "letter", label: "Letter/Card" },
  { type: "social_media", label: "Social Media" },
  { type: "outing", label: "Outing/Activity" },
  { type: "overnight_stay", label: "Overnight Stay" },
];

export const CONTACT_PERSONS: { role: string; label: string; is_family: boolean }[] = [
  { role: "birth_parent", label: "Birth Parent", is_family: true },
  { role: "sibling", label: "Sibling", is_family: true },
  { role: "grandparent", label: "Grandparent", is_family: true },
  { role: "extended_family", label: "Extended Family", is_family: true },
  { role: "foster_carer", label: "Previous Foster Carer", is_family: false },
  { role: "friend", label: "Friend", is_family: false },
  { role: "social_worker", label: "Social Worker", is_family: false },
  { role: "advocate", label: "Advocate/IRO", is_family: false },
  { role: "mentor", label: "Mentor", is_family: false },
  { role: "other", label: "Other Approved Person", is_family: false },
];

export const SUPERVISION_LEVELS = [
  "unsupervised",
  "supervised_staff",
  "supervised_social_worker",
  "supervised_contact_centre",
  "no_contact",
] as const;

export const CONTACT_OUTCOMES = [
  "completed",
  "cancelled_by_child",
  "cancelled_by_contact",
  "cancelled_by_authority",
  "no_show",
  "partial",
  "refused_by_child",
] as const;

// ── Pure functions (no DB) ──────────────────────────────────────────────

/**
 * Compute overall contact compliance metrics across all plans and records.
 */
export function computeContactCompliance(
  plans: ContactPlan[],
  records: ContactRecord[],
): {
  total_plans: number;
  active_plans: number;
  total_contacts: number;
  completed_contacts: number;
  cancelled_contacts: number;
  refusals: number;
  no_shows: number;
  completion_rate: number | null;
  by_type: Record<string, number>;
  by_role: Record<string, number>;
  family_contact_count: number;
  sibling_contact_count: number;
  plans_overdue_review: number;
} {
  const now = new Date();

  const activePlans = plans.filter((p) => p.is_active);

  const byType: Record<string, number> = {};
  const byRole: Record<string, number> = {};

  let completed = 0;
  let cancelled = 0;
  let refusals = 0;
  let noShows = 0;
  let familyCount = 0;
  let siblingCount = 0;

  const familyRoles = new Set(
    CONTACT_PERSONS.filter((cp) => cp.is_family).map((cp) => cp.role),
  );

  for (const r of records) {
    // By type
    byType[r.contact_type] = (byType[r.contact_type] ?? 0) + 1;

    // By role
    byRole[r.contact_person_role] = (byRole[r.contact_person_role] ?? 0) + 1;

    // Outcome counts
    if (r.outcome === "completed") completed++;
    if (
      r.outcome === "cancelled_by_child" ||
      r.outcome === "cancelled_by_contact" ||
      r.outcome === "cancelled_by_authority"
    ) {
      cancelled++;
    }
    if (r.outcome === "refused_by_child") refusals++;
    if (r.outcome === "no_show") noShows++;

    // Family / sibling counts
    if (familyRoles.has(r.contact_person_role)) familyCount++;
    if (r.contact_person_role === "sibling") siblingCount++;
  }

  // Plans overdue review
  let plansOverdueReview = 0;
  for (const p of plans) {
    if (p.review_date && new Date(p.review_date) < now) {
      plansOverdueReview++;
    }
  }

  const completionRate =
    records.length > 0
      ? Math.round((completed / records.length) * 1000) / 10
      : null;

  return {
    total_plans: plans.length,
    active_plans: activePlans.length,
    total_contacts: records.length,
    completed_contacts: completed,
    cancelled_contacts: cancelled,
    refusals,
    no_shows: noShows,
    completion_rate: completionRate,
    by_type: byType,
    by_role: byRole,
    family_contact_count: familyCount,
    sibling_contact_count: siblingCount,
    plans_overdue_review: plansOverdueReview,
  };
}

/**
 * Build a contact profile for a specific child: active contacts, recent
 * activity, mood trends, and gaps.
 */
export function computeChildContactProfile(
  childId: string,
  plans: ContactPlan[],
  records: ContactRecord[],
): {
  child_id: string;
  active_contacts: { name: string; role: string; frequency: string; last_contact: string | null }[];
  total_contacts_30d: number;
  family_contacts_30d: number;
  mood_trend: "improving" | "stable" | "declining";
  refusal_rate: number | null;
  no_contact_persons: string[];
} {
  const childPlans = plans.filter((p) => p.child_id === childId);
  const childRecords = records.filter((r) => r.child_id === childId);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const familyRoles = new Set(
    CONTACT_PERSONS.filter((cp) => cp.is_family).map((cp) => cp.role),
  );

  // Active contacts with last contact date
  const activePlans = childPlans.filter((p) => p.is_active);
  const activeContacts = activePlans.map((plan) => {
    const personRecords = childRecords
      .filter(
        (r) =>
          r.contact_person_name === plan.contact_person_name &&
          r.outcome === "completed",
      )
      .sort(
        (a, b) =>
          new Date(b.scheduled_date).getTime() -
          new Date(a.scheduled_date).getTime(),
      );

    return {
      name: plan.contact_person_name,
      role: plan.contact_person_role,
      frequency: plan.planned_frequency,
      last_contact: personRecords.length > 0 ? personRecords[0].scheduled_date : null,
    };
  });

  // Records in the last 30 days
  const recent = childRecords.filter(
    (r) => new Date(r.scheduled_date) >= thirtyDaysAgo,
  );
  const totalContacts30d = recent.length;
  const familyContacts30d = recent.filter((r) =>
    familyRoles.has(r.contact_person_role),
  ).length;

  // Mood trend: compare first half vs second half of child_mood_after
  const moodsAfter = childRecords
    .filter((r) => r.child_mood_after != null)
    .sort(
      (a, b) =>
        new Date(a.scheduled_date).getTime() -
        new Date(b.scheduled_date).getTime(),
    )
    .map((r) => r.child_mood_after as number);

  let moodTrend: "improving" | "stable" | "declining" = "stable";
  if (moodsAfter.length >= 2) {
    const mid = Math.floor(moodsAfter.length / 2);
    const firstHalf = moodsAfter.slice(0, mid);
    const secondHalf = moodsAfter.slice(mid);

    const avgFirst =
      firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const avgSecond =
      secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    if (avgSecond - avgFirst > 0.25) moodTrend = "improving";
    else if (avgFirst - avgSecond > 0.25) moodTrend = "declining";
  }

  // Refusal rate
  const refusedCount = childRecords.filter(
    (r) => r.outcome === "refused_by_child",
  ).length;
  const refusalRate =
    childRecords.length > 0
      ? Math.round((refusedCount / childRecords.length) * 1000) / 10
      : null;

  // People with plans but zero completed records
  const noContactPersons = activePlans
    .filter((plan) => {
      const completedForPerson = childRecords.filter(
        (r) =>
          r.contact_person_name === plan.contact_person_name &&
          r.outcome === "completed",
      );
      return completedForPerson.length === 0;
    })
    .map((plan) => plan.contact_person_name);

  return {
    child_id: childId,
    active_contacts: activeContacts,
    total_contacts_30d: totalContacts30d,
    family_contacts_30d: familyContacts30d,
    mood_trend: moodTrend,
    refusal_rate: refusalRate,
    no_contact_persons: noContactPersons,
  };
}

/**
 * Assess the quality of contact recording — completeness of voice capture,
 * mood tracking, observations, and duration logging.
 */
export function computeContactQuality(records: ContactRecord[]): {
  avg_duration_minutes: number | null;
  voice_capture_rate: number | null;
  mood_recorded_rate: number | null;
  observations_rate: number | null;
  quality_rating: "excellent" | "good" | "adequate" | "poor";
  safeguarding_flags: number;
} {
  if (records.length === 0) {
    return {
      avg_duration_minutes: null,
      voice_capture_rate: null,
      mood_recorded_rate: null,
      observations_rate: null,
      quality_rating: "poor",
      safeguarding_flags: 0,
    };
  }

  const total = records.length;

  // Average duration (non-null only)
  const durations = records
    .filter((r) => r.duration_minutes != null)
    .map((r) => r.duration_minutes as number);
  const avgDuration =
    durations.length > 0
      ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length) : null;

  // Voice capture rate
  const withVoice = records.filter(
    (r) => r.child_voice != null && r.child_voice.trim() !== "",
  ).length;
  const voiceCaptureRate = Math.round((withVoice / total) * 1000) / 10;

  // Mood recorded rate (both before AND after)
  const withMood = records.filter(
    (r) => r.child_mood_before != null && r.child_mood_after != null,
  ).length;
  const moodRecordedRate = Math.round((withMood / total) * 1000) / 10;

  // Observations rate
  const withObs = records.filter(
    (r) =>
      r.staff_observations != null && r.staff_observations.trim() !== "",
  ).length;
  const observationsRate = Math.round((withObs / total) * 1000) / 10;

  // Quality rating
  const allRates = [voiceCaptureRate, moodRecordedRate, observationsRate];
  const avgRate = allRates.reduce((s, v) => s + v, 0) / allRates.length;

  let qualityRating: "excellent" | "good" | "adequate" | "poor";
  if (allRates.every((r) => r >= 80)) {
    qualityRating = "excellent";
  } else if (avgRate >= 60) {
    qualityRating = "good";
  } else if (avgRate >= 40) {
    qualityRating = "adequate";
  } else {
    qualityRating = "poor";
  }

  // Safeguarding flags
  const safeguardingFlags = records.filter(
    (r) =>
      r.safeguarding_concerns != null &&
      r.safeguarding_concerns.trim() !== "",
  ).length;

  return {
    avg_duration_minutes: avgDuration,
    voice_capture_rate: voiceCaptureRate,
    mood_recorded_rate: moodRecordedRate,
    observations_rate: observationsRate,
    quality_rating: qualityRating,
    safeguarding_flags: safeguardingFlags,
  };
}

/**
 * Generate actionable suggestions based on contact plan adherence,
 * refusal patterns, mood concerns, and review dates.
 */
export function suggestContactActions(
  plans: ContactPlan[],
  records: ContactRecord[],
): {
  type: string;
  priority: "high" | "medium" | "low";
  message: string;
  child_id: string;
  contact_person?: string;
}[] {
  const actions: {
    type: string;
    priority: "high" | "medium" | "low";
    message: string;
    child_id: string;
    contact_person?: string;
  }[] = [];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const familyRoles = new Set(
    CONTACT_PERSONS.filter((cp) => cp.is_family).map((cp) => cp.role),
  );

  const activePlans = plans.filter((p) => p.is_active);

  // Frequency thresholds in days
  const frequencyThresholds: Record<string, { days: number; priority: "high" | "medium" | "low" }> = {
    weekly: { days: 10, priority: "high" },
    fortnightly: { days: 18, priority: "medium" },
    monthly: { days: 35, priority: "low" },
  };

  // ── Overdue contact checks ────────────────────────────────────────────

  for (const plan of activePlans) {
    const threshold = frequencyThresholds[plan.planned_frequency];
    if (!threshold) continue; // skip "as_agreed" and unrecognised frequencies

    const completedForPlan = records.filter(
      (r) =>
        r.child_id === plan.child_id &&
        r.contact_person_name === plan.contact_person_name &&
        r.outcome === "completed",
    );

    let daysSinceLast: number;

    if (completedForPlan.length === 0) {
      // No completed records at all — treat as overdue from plan creation
      daysSinceLast = threshold.days + 1;
    } else {
      const sorted = completedForPlan.sort(
        (a, b) =>
          new Date(b.scheduled_date).getTime() -
          new Date(a.scheduled_date).getTime(),
      );
      const lastDate = new Date(sorted[0].scheduled_date);
      daysSinceLast = -londonDayDiff(lastDate);
    }

    if (daysSinceLast > threshold.days) {
      actions.push({
        type: "overdue_contact",
        priority: threshold.priority,
        message: `${plan.planned_frequency} contact with ${plan.contact_person_name} is overdue (${Math.floor(daysSinceLast)} days since last contact)`,
        child_id: plan.child_id,
        contact_person: plan.contact_person_name,
      });
    }
  }

  // ── Plan review due ────────────────────────────────────────────────────

  for (const plan of plans) {
    if (plan.review_date && new Date(plan.review_date) < now) {
      actions.push({
        type: "plan_review_due",
        priority: "medium",
        message: `Contact plan for ${plan.contact_person_name} is due for review (was due ${plan.review_date})`,
        child_id: plan.child_id,
        contact_person: plan.contact_person_name,
      });
    }
  }

  // ── Frequent refusal ───────────────────────────────────────────────────

  // Group refused records by child + contact person
  const refusalCounts = new Map<string, { count: number; childId: string; person: string }>();

  for (const r of records) {
    if (r.outcome === "refused_by_child") {
      const key = `${r.child_id}::${r.contact_person_name}`;
      const existing = refusalCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        refusalCounts.set(key, { count: 1, childId: r.child_id, person: r.contact_person_name });
      }
    }
  }

  for (const [, val] of refusalCounts) {
    if (val.count >= 3) {
      actions.push({
        type: "frequent_refusal",
        priority: "high",
        message: `Child has refused contact with ${val.person} ${val.count} times — review whether contact arrangement remains appropriate`,
        child_id: val.childId,
        contact_person: val.person,
      });
    }
  }

  // ── No family contact in 30 days ───────────────────────────────────────

  // Get all children who have family plans
  const childrenWithFamilyPlans = new Set(
    activePlans
      .filter((p) => familyRoles.has(p.contact_person_role))
      .map((p) => p.child_id),
  );

  for (const childId of childrenWithFamilyPlans) {
    const recentFamilyContacts = records.filter(
      (r) =>
        r.child_id === childId &&
        familyRoles.has(r.contact_person_role) &&
        r.outcome === "completed" &&
        new Date(r.scheduled_date) >= thirtyDaysAgo,
    );

    if (recentFamilyContacts.length === 0) {
      actions.push({
        type: "no_family_contact",
        priority: "high",
        message: `No completed family contact recorded in the last 30 days`,
        child_id: childId,
      });
    }
  }

  // ── Mood concern ───────────────────────────────────────────────────────

  // Group mood_after values by child + contact person
  const moodGroups = new Map<string, { moods: number[]; childId: string; person: string }>();

  for (const r of records) {
    if (r.child_mood_after != null) {
      const key = `${r.child_id}::${r.contact_person_name}`;
      const existing = moodGroups.get(key);
      if (existing) {
        existing.moods.push(r.child_mood_after);
      } else {
        moodGroups.set(key, {
          moods: [r.child_mood_after],
          childId: r.child_id,
          person: r.contact_person_name,
        });
      }
    }
  }

  for (const [, val] of moodGroups) {
    const avg = val.moods.reduce((s, v) => s + v, 0) / val.moods.length;
    if (avg < 2.5) {
      actions.push({
        type: "mood_concern",
        priority: "medium",
        message: `Average mood after contact with ${val.person} is low (${Math.round(avg * 10) / 10}/5) — consider reviewing contact arrangements`,
        child_id: val.childId,
        contact_person: val.person,
      });
    }
  }

  return actions;
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listContactPlans(
  homeId: string,
  filters?: { childId?: string; activeOnly?: boolean },
): Promise<ServiceResult<ContactPlan[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  const activeOnly = filters?.activeOnly ?? true;

  let q = (s.from("cs_contact_plans") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (activeOnly) q = q.eq("is_active", true);
  q = q.order("created_at", { ascending: false });

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getContactPlan(
  id: string,
): Promise<ServiceResult<ContactPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_contact_plans") as SB)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createContactPlan(
  input: Omit<ContactPlan, "id" | "is_active" | "created_at" | "updated_at">,
): Promise<ServiceResult<ContactPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_contact_plans") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      contact_person_name: input.contact_person_name,
      contact_person_role: input.contact_person_role,
      relationship_detail: input.relationship_detail,
      approved_contact_types: input.approved_contact_types,
      supervision_level: input.supervision_level,
      planned_frequency: input.planned_frequency,
      court_ordered: input.court_ordered,
      risk_notes: input.risk_notes ?? null,
      is_active: true,
      approved_by: input.approved_by,
      approved_date: input.approved_date,
      review_date: input.review_date ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateContactPlan(
  id: string,
  updates: Partial<ContactPlan>,
): Promise<ServiceResult<ContactPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_contact_plans") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function recordContact(
  input: Omit<ContactRecord, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<ContactRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_contact_records") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      contact_plan_id: input.contact_plan_id ?? null,
      contact_person_name: input.contact_person_name,
      contact_person_role: input.contact_person_role,
      contact_type: input.contact_type,
      supervision_level: input.supervision_level,
      scheduled_date: input.scheduled_date,
      actual_date: input.actual_date ?? null,
      duration_minutes: input.duration_minutes ?? null,
      location: input.location ?? null,
      outcome: input.outcome,
      child_mood_before: input.child_mood_before ?? null,
      child_mood_after: input.child_mood_after ?? null,
      child_voice: input.child_voice ?? null,
      staff_observations: input.staff_observations ?? null,
      safeguarding_concerns: input.safeguarding_concerns ?? null,
      supervised_by: input.supervised_by ?? null,
      recorded_by: input.recorded_by,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function listContactRecords(
  homeId: string,
  filters?: {
    childId?: string;
    contactPersonRole?: string;
    contactType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<ContactRecord[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_contact_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.contactPersonRole) q = q.eq("contact_person_role", filters.contactPersonRole);
  if (filters?.contactType) q = q.eq("contact_type", filters.contactType);
  if (filters?.dateFrom) q = q.gte("scheduled_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("scheduled_date", filters.dateTo);
  q = q.order("scheduled_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getContactRecord(
  id: string,
): Promise<ServiceResult<ContactRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_contact_records") as SB)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ────────────────────────────────────────────────────

export const _testing = {
  computeContactCompliance,
  computeChildContactProfile,
  computeContactQuality,
  suggestContactActions,
};
