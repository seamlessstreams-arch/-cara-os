// ══════════════════════════════════════════════════════════════════════════════
// CARA — VISITORS LOG SERVICE
// Tracks all visitors to children's homes for safeguarding, regulatory
// compliance (CHR 2015), fire register accuracy, and Reg 44 evidencing.
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

export interface VisitorEntry {
  id: string;
  home_id: string;
  visitor_name: string;
  visitor_type: string;
  organisation?: string | null;
  purpose: string;
  child_visited?: string | null;
  child_name?: string | null;
  arrival_time: string;
  departure_time?: string | null;
  duration_minutes?: number | null;
  dbs_checked: boolean;
  id_verified: boolean;
  notes?: string | null;
  recorded_by: string;
  date: string;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const VISITOR_TYPES: {
  type: string;
  label: string;
  professional: boolean;
}[] = [
  { type: "social_worker", label: "Social Worker", professional: true },
  { type: "iro", label: "Independent Reviewing Officer", professional: true },
  { type: "ofsted_inspector", label: "Ofsted Inspector", professional: true },
  { type: "reg44_visitor", label: "Reg 44 Independent Visitor", professional: true },
  { type: "camhs", label: "CAMHS / Mental Health", professional: true },
  { type: "health_visitor", label: "Health Professional", professional: true },
  { type: "education_professional", label: "Education Professional", professional: true },
  { type: "police", label: "Police Officer", professional: true },
  { type: "advocate", label: "Children's Advocate", professional: true },
  { type: "therapist", label: "Therapist / Counsellor", professional: true },
  { type: "family_member", label: "Family Member", professional: false },
  { type: "friend", label: "Friend / Peer", professional: false },
  { type: "contractor", label: "Contractor / Tradesperson", professional: false },
  { type: "other", label: "Other Visitor", professional: false },
];

export const VISIT_PURPOSES: string[] = [
  "statutory_visit", "lac_review", "care_planning", "safeguarding",
  "health_appointment", "education_meeting", "family_contact",
  "reg44_visit", "inspection", "maintenance", "delivery", "social", "other",
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute summary statistics from visitor entries within a date range.
 */
export function computeVisitorSummary(
  entries: VisitorEntry[],
  dateFrom: string,
  dateTo: string,
): {
  total_visits: number;
  unique_visitors: number;
  by_type: Record<string, number>;
  by_purpose: Record<string, number>;
  professional_visits: number;
  family_visits: number;
  avg_duration_minutes: number;
  busiest_day: string | null;
  children_visited: Record<string, number>;
} {
  const fromDate = new Date(dateFrom);
  const toDate = new Date(dateTo);

  // Filter entries within the date range
  const filtered = entries.filter((e) => {
    const d = new Date(e.date);
    return d >= fromDate && d <= toDate;
  });

  const byType: Record<string, number> = {};
  const byPurpose: Record<string, number> = {};
  const visitorNames = new Set<string>();
  const dayCount: Record<string, number> = {};
  const childrenVisited: Record<string, number> = {};

  let professionalVisits = 0;
  let familyVisits = 0;
  let totalDuration = 0;
  let durationCount = 0;

  const professionalTypes = new Set(
    VISITOR_TYPES.filter((vt) => vt.professional).map((vt) => vt.type),
  );

  for (const e of filtered) {
    // By type
    byType[e.visitor_type] = (byType[e.visitor_type] ?? 0) + 1;

    // By purpose
    byPurpose[e.purpose] = (byPurpose[e.purpose] ?? 0) + 1;

    // Unique visitors
    visitorNames.add(e.visitor_name.trim().toLowerCase());

    // Professional vs family
    if (professionalTypes.has(e.visitor_type)) {
      professionalVisits++;
    }
    if (e.visitor_type === "family_member") {
      familyVisits++;
    }

    // Duration
    if (e.duration_minutes != null && e.duration_minutes > 0) {
      totalDuration += e.duration_minutes;
      durationCount++;
    }

    // Busiest day
    dayCount[e.date] = (dayCount[e.date] ?? 0) + 1;

    // Children visited
    if (e.child_name && e.child_name.trim().length > 0) {
      const name = e.child_name.trim();
      childrenVisited[name] = (childrenVisited[name] ?? 0) + 1;
    }
  }

  // Find busiest day
  let busiestDay: string | null = null;
  let busiestCount = 0;
  for (const [day, count] of Object.entries(dayCount)) {
    if (count > busiestCount) {
      busiestCount = count;
      busiestDay = day;
    }
  }

  const avgDuration =
    durationCount > 0
      ? Math.round((totalDuration / durationCount) * 10) / 10
      : 0;

  return {
    total_visits: filtered.length,
    unique_visitors: visitorNames.size,
    by_type: byType,
    by_purpose: byPurpose,
    professional_visits: professionalVisits,
    family_visits: familyVisits,
    avg_duration_minutes: avgDuration,
    busiest_day: busiestDay,
    children_visited: childrenVisited,
  };
}

/**
 * Compute compliance metrics from visitor entries.
 */
export function computeVisitorCompliance(entries: VisitorEntry[]): {
  total_entries: number;
  // Null when there is nobody in the relevant population — an empty visitor
  // book evidences nothing, so it cannot evidence compliance either.
  dbs_check_rate: number | null;
  id_verification_rate: number | null;
  sign_out_rate: number | null;
  incomplete_entries: number;
} {
  const professionalTypes = new Set(
    VISITOR_TYPES.filter((vt) => vt.professional).map((vt) => vt.type),
  );

  const total = entries.length;

  // DBS check rate — professional visitors only
  const professionalEntries = entries.filter((e) =>
    professionalTypes.has(e.visitor_type),
  );
  const dbsCheckedCount = professionalEntries.filter((e) => e.dbs_checked).length;
  const dbsCheckRate =
    professionalEntries.length > 0
      ? Math.round((dbsCheckedCount / professionalEntries.length) * 1000) / 10
      : null;

  // ID verification rate — all visitors
  const idVerifiedCount = entries.filter((e) => e.id_verified).length;
  const idVerificationRate =
    total > 0
      ? Math.round((idVerifiedCount / total) * 1000) / 10
      : null;

  // Sign-out rate — all visitors
  const signedOutCount = entries.filter((e) => e.departure_time != null).length;
  const signOutRate =
    total > 0
      ? Math.round((signedOutCount / total) * 1000) / 10
      : null;

  // Incomplete entries — missing departure time
  const incompleteEntries = entries.filter((e) => e.departure_time == null).length;

  return {
    total_entries: total,
    dbs_check_rate: dbsCheckRate,
    id_verification_rate: idVerificationRate,
    sign_out_rate: signOutRate,
    incomplete_entries: incompleteEntries,
  };
}

/**
 * Identify safeguarding and compliance alerts from visitor entries.
 */
export function identifyVisitorAlerts(
  entries: VisitorEntry[],
): { type: string; severity: "high" | "medium" | "low"; message: string }[] {
  const alerts: { type: string; severity: "high" | "medium" | "low"; message: string }[] = [];
  const now = new Date();
  const fourHoursMs = 4 * 60 * 60 * 1000;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const professionalTypes = new Set(
    VISITOR_TYPES.filter((vt) => vt.professional).map((vt) => vt.type),
  );

  const todayStr = now.toISOString().slice(0, 10);

  // Day-level visitor counts for high_volume detection
  const dayCount: Record<string, number> = {};

  for (const e of entries) {
    // visitor_not_signed_out: entry from today with no departure_time and arrival > 4 hours ago
    if (
      e.date === todayStr &&
      e.departure_time == null
    ) {
      const arrivalTime = new Date(e.arrival_time).getTime();
      if (now.getTime() - arrivalTime > fourHoursMs) {
        alerts.push({
          type: "visitor_not_signed_out",
          severity: "medium",
          message: `${e.visitor_name} has not signed out — arrived ${e.arrival_time}`,
        });
      }
    }

    // dbs_not_checked: professional visitor with dbs_checked false
    if (professionalTypes.has(e.visitor_type) && !e.dbs_checked) {
      alerts.push({
        type: "dbs_not_checked",
        severity: "high",
        message: `DBS not checked for ${e.visitor_name} (${e.visitor_type})`,
      });
    }

    // id_not_verified: visitor with id_verified false
    if (!e.id_verified) {
      alerts.push({
        type: "id_not_verified",
        severity: "medium",
        message: `ID not verified for ${e.visitor_name}`,
      });
    }

    // Accumulate day counts
    dayCount[e.date] = (dayCount[e.date] ?? 0) + 1;
  }

  // high_volume: more than 5 visitors in a single day
  for (const [day, count] of Object.entries(dayCount)) {
    if (count > 5) {
      alerts.push({
        type: "high_volume",
        severity: "low",
        message: `High visitor volume on ${day} — ${count} visitors recorded`,
      });
    }
  }

  // no_reg44_visit: no reg44_visitor type entries in the last 30 days
  const hasRecentReg44 = entries.some((e) => {
    if (e.visitor_type !== "reg44_visitor") return false;
    const entryDate = new Date(e.date).getTime();
    return now.getTime() - entryDate <= thirtyDaysMs;
  });

  if (!hasRecentReg44) {
    alerts.push({
      type: "no_reg44_visit",
      severity: "high",
      message: "No Reg 44 independent visitor recorded in the last 30 days",
    });
  }

  return alerts;
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function listVisitorEntries(
  homeId: string,
  filters?: {
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    visitorType?: string;
    childId?: string;
    limit?: number;
  },
): Promise<ServiceResult<VisitorEntry[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<VisitorEntry[]>;

  let q = (s.from("cs_visitor_entries") as SB).select("*").eq("home_id", homeId);

  if (filters?.date) q = q.eq("date", filters.date);
  if (filters?.dateFrom) q = q.gte("date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("date", filters.dateTo);
  if (filters?.visitorType) q = q.eq("visitor_type", filters.visitorType);
  if (filters?.childId) q = q.eq("child_visited", filters.childId);

  q = q.order("arrival_time", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createVisitorEntry(
  input: Omit<VisitorEntry, "id" | "created_at">,
): Promise<ServiceResult<VisitorEntry>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_visitor_entries") as SB)
    .insert({
      home_id: input.home_id,
      visitor_name: input.visitor_name,
      visitor_type: input.visitor_type,
      organisation: input.organisation ?? null,
      purpose: input.purpose,
      child_visited: input.child_visited ?? null,
      child_name: input.child_name ?? null,
      arrival_time: input.arrival_time,
      departure_time: input.departure_time ?? null,
      duration_minutes: input.duration_minutes ?? null,
      dbs_checked: input.dbs_checked,
      id_verified: input.id_verified,
      notes: input.notes ?? null,
      recorded_by: input.recorded_by,
      date: input.date,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateVisitorEntry(
  id: string,
  updates: Partial<VisitorEntry>,
): Promise<ServiceResult<VisitorEntry>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_visitor_entries") as SB)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function signOutVisitor(
  id: string,
): Promise<ServiceResult<VisitorEntry>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  // First fetch the current entry to calculate duration
  const { data: existing, error: fetchError } = await (s.from("cs_visitor_entries") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) return { ok: false, error: fetchError.message };
  if (!existing) return { ok: false, error: "Visitor entry not found" };

  const departureTime = new Date().toISOString();
  const arrivalMs = new Date(existing.arrival_time).getTime();
  const departureMs = new Date(departureTime).getTime();
  const durationMinutes = Math.round((departureMs - arrivalMs) / (1000 * 60));

  const { data, error } = await (s.from("cs_visitor_entries") as SB)
    .update({
      departure_time: departureTime,
      duration_minutes: durationMinutes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeVisitorSummary,
  computeVisitorCompliance,
  identifyVisitorAlerts,
};
