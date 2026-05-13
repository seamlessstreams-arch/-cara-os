// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DUTY OF CANDOUR SERVICE
// Manages transparency obligations when things go wrong, including
// notifiable safety incidents, apologies, and investigation tracking.
// CHR 2015 Reg 20 (duty of candour),
// Reg 40 (notification of events).
//
// Tracks candour notifications, investigation timelines, family
// engagement following incidents, and regulatory notifications.
//
// SCCIF: Well-Led — "The home is open and transparent when things
// go wrong." "Families are informed promptly and appropriately."
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

export type CandourTrigger =
  | "serious_injury"
  | "safeguarding_incident"
  | "medication_error"
  | "restraint_injury"
  | "missing_child"
  | "police_involvement"
  | "hospitalisation"
  | "death"
  | "abuse_allegation"
  | "near_miss_serious"
  | "other";

export type CandourStatus =
  | "identified"
  | "initial_notification"
  | "verbal_apology_given"
  | "written_apology_sent"
  | "investigation_underway"
  | "investigation_complete"
  | "final_response_sent"
  | "closed";

export type InvestigationOutcome =
  | "upheld"
  | "partially_upheld"
  | "not_upheld"
  | "inconclusive"
  | "ongoing";

export interface CandourRecord {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  trigger: CandourTrigger;
  incident_date: string;
  identified_date: string;
  status: CandourStatus;
  description: string;
  verbal_apology_date: string | null;
  written_apology_date: string | null;
  family_informed: boolean;
  social_worker_informed: boolean;
  ofsted_notified: boolean;
  ofsted_notification_date: string | null;
  investigation_lead: string | null;
  investigation_outcome: InvestigationOutcome | null;
  investigation_completed_date: string | null;
  lessons_learned: string[];
  actions_taken: string[];
  final_response_date: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CANDOUR_TRIGGERS: { trigger: CandourTrigger; label: string }[] = [
  { trigger: "serious_injury", label: "Serious Injury" },
  { trigger: "safeguarding_incident", label: "Safeguarding Incident" },
  { trigger: "medication_error", label: "Medication Error" },
  { trigger: "restraint_injury", label: "Restraint Injury" },
  { trigger: "missing_child", label: "Missing Child" },
  { trigger: "police_involvement", label: "Police Involvement" },
  { trigger: "hospitalisation", label: "Hospitalisation" },
  { trigger: "death", label: "Death" },
  { trigger: "abuse_allegation", label: "Abuse Allegation" },
  { trigger: "near_miss_serious", label: "Serious Near Miss" },
  { trigger: "other", label: "Other" },
];

export const CANDOUR_STATUSES: { status: CandourStatus; label: string }[] = [
  { status: "identified", label: "Identified" },
  { status: "initial_notification", label: "Initial Notification" },
  { status: "verbal_apology_given", label: "Verbal Apology Given" },
  { status: "written_apology_sent", label: "Written Apology Sent" },
  { status: "investigation_underway", label: "Investigation Underway" },
  { status: "investigation_complete", label: "Investigation Complete" },
  { status: "final_response_sent", label: "Final Response Sent" },
  { status: "closed", label: "Closed" },
];

export const INVESTIGATION_OUTCOMES: { outcome: InvestigationOutcome; label: string }[] = [
  { outcome: "upheld", label: "Upheld" },
  { outcome: "partially_upheld", label: "Partially Upheld" },
  { outcome: "not_upheld", label: "Not Upheld" },
  { outcome: "inconclusive", label: "Inconclusive" },
  { outcome: "ongoing", label: "Ongoing" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute duty of candour metrics.
 */
export function computeCandourMetrics(
  records: CandourRecord[],
  now: Date = new Date(),
): {
  total_records: number;
  open_cases: number;
  closed_cases: number;
  verbal_apology_given: number;
  written_apology_sent: number;
  family_informed_rate: number;
  ofsted_notified_rate: number;
  investigation_complete: number;
  investigation_upheld: number;
  avg_days_to_verbal: number;
  avg_days_to_written: number;
  lessons_captured: number;
  by_trigger: Record<string, number>;
  by_status: Record<string, number>;
  by_outcome: Record<string, number>;
} {
  const closedStatuses: CandourStatus[] = ["final_response_sent", "closed"];
  const openCases = records.filter((r) => !closedStatuses.includes(r.status)).length;
  const closedCases = records.filter((r) => closedStatuses.includes(r.status)).length;

  const verbalGiven = records.filter((r) => r.verbal_apology_date !== null).length;
  const writtenSent = records.filter((r) => r.written_apology_date !== null).length;

  const familyInformed = records.filter((r) => r.family_informed).length;
  const familyRate =
    records.length > 0 ? Math.round((familyInformed / records.length) * 1000) / 10 : 0;

  const ofstedNotified = records.filter((r) => r.ofsted_notified).length;
  const ofstedRate =
    records.length > 0 ? Math.round((ofstedNotified / records.length) * 1000) / 10 : 0;

  const investigationComplete = records.filter(
    (r) => r.investigation_completed_date !== null,
  ).length;
  const upheld = records.filter((r) => r.investigation_outcome === "upheld").length;

  // Avg days from incident to verbal apology
  const verbalRecords = records.filter((r) => r.verbal_apology_date && r.incident_date);
  const avgVerbal =
    verbalRecords.length > 0
      ? Math.round(
          (verbalRecords.reduce((sum, r) => {
            const days =
              (new Date(r.verbal_apology_date!).getTime() -
                new Date(r.incident_date).getTime()) /
              86400000;
            return sum + Math.max(0, days);
          }, 0) /
            verbalRecords.length) *
            10,
        ) / 10
      : 0;

  // Avg days from incident to written apology
  const writtenRecords = records.filter((r) => r.written_apology_date && r.incident_date);
  const avgWritten =
    writtenRecords.length > 0
      ? Math.round(
          (writtenRecords.reduce((sum, r) => {
            const days =
              (new Date(r.written_apology_date!).getTime() -
                new Date(r.incident_date).getTime()) /
              86400000;
            return sum + Math.max(0, days);
          }, 0) /
            writtenRecords.length) *
            10,
        ) / 10
      : 0;

  // Records with lessons learned captured
  const lessonsCaptured = records.filter((r) => r.lessons_learned.length > 0).length;

  // By trigger
  const byTrigger: Record<string, number> = {};
  for (const r of records) {
    byTrigger[r.trigger] = (byTrigger[r.trigger] ?? 0) + 1;
  }

  // By status
  const byStatus: Record<string, number> = {};
  for (const r of records) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  }

  // By outcome
  const byOutcome: Record<string, number> = {};
  for (const r of records) {
    if (r.investigation_outcome) {
      byOutcome[r.investigation_outcome] = (byOutcome[r.investigation_outcome] ?? 0) + 1;
    }
  }

  return {
    total_records: records.length,
    open_cases: openCases,
    closed_cases: closedCases,
    verbal_apology_given: verbalGiven,
    written_apology_sent: writtenSent,
    family_informed_rate: familyRate,
    ofsted_notified_rate: ofstedRate,
    investigation_complete: investigationComplete,
    investigation_upheld: upheld,
    avg_days_to_verbal: avgVerbal,
    avg_days_to_written: avgWritten,
    lessons_captured: lessonsCaptured,
    by_trigger: byTrigger,
    by_status: byStatus,
    by_outcome: byOutcome,
  };
}

/**
 * Identify duty of candour alerts.
 */
export function identifyCandourAlerts(
  records: CandourRecord[],
  now: Date = new Date(),
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    id: string;
  }[] = [];

  for (const r of records) {
    const daysSinceIncident = Math.floor(
      (now.getTime() - new Date(r.incident_date).getTime()) / 86400000,
    );

    // No verbal apology within 10 days
    if (
      !r.verbal_apology_date &&
      r.status === "identified" &&
      daysSinceIncident > 10
    ) {
      alerts.push({
        type: "no_verbal_apology",
        severity: "critical",
        message: `No verbal apology given for ${r.trigger === "death" ? "death" : "incident"} involving ${r.child_name} (${r.incident_date}) — ${daysSinceIncident} days since incident. Immediate action required`,
        id: r.id,
      });
    }

    // No written apology within 10 working days (~14 calendar days)
    if (
      r.verbal_apology_date &&
      !r.written_apology_date &&
      daysSinceIncident > 14
    ) {
      alerts.push({
        type: "no_written_apology",
        severity: "high",
        message: `Written apology not yet sent for incident involving ${r.child_name} (${r.incident_date}) — verbal apology given ${r.verbal_apology_date}`,
        id: r.id,
      });
    }

    // Family not informed
    if (!r.family_informed && r.status !== "closed") {
      alerts.push({
        type: "family_not_informed",
        severity: "high",
        message: `Family not yet informed about ${r.trigger === "death" ? "death" : "incident"} involving ${r.child_name} — duty of candour requires prompt notification`,
        id: r.id,
      });
    }

    // Ofsted not notified for notifiable events
    if (
      !r.ofsted_notified &&
      (r.trigger === "death" ||
        r.trigger === "serious_injury" ||
        r.trigger === "hospitalisation" ||
        r.trigger === "abuse_allegation" ||
        r.trigger === "police_involvement") &&
      r.status !== "closed"
    ) {
      alerts.push({
        type: "ofsted_not_notified",
        severity: "critical",
        message: `Ofsted not notified about ${r.trigger.replace(/_/g, " ")} involving ${r.child_name} — statutory notification required`,
        id: r.id,
      });
    }

    // Investigation prolonged (>28 days without completion)
    if (
      r.status === "investigation_underway" &&
      !r.investigation_completed_date &&
      daysSinceIncident > 28
    ) {
      alerts.push({
        type: "investigation_prolonged",
        severity: "medium",
        message: `Investigation for incident involving ${r.child_name} has been ongoing for ${daysSinceIncident} days — review progress and timeline`,
        id: r.id,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    childId?: string;
    trigger?: CandourTrigger;
    status?: CandourStatus;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<CandourRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_candour_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.trigger) q = q.eq("trigger", filters.trigger);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.dateFrom) q = q.gte("incident_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("incident_date", filters.dateTo);
  q = q.order("incident_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    trigger: CandourTrigger;
    incidentDate: string;
    description: string;
  },
): Promise<ServiceResult<CandourRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_candour_records") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      trigger: input.trigger,
      incident_date: input.incidentDate,
      identified_date: new Date().toISOString().split("T")[0],
      status: "identified",
      description: input.description,
      verbal_apology_date: null,
      written_apology_date: null,
      family_informed: false,
      social_worker_informed: false,
      ofsted_notified: false,
      ofsted_notification_date: null,
      investigation_lead: null,
      investigation_outcome: null,
      investigation_completed_date: null,
      lessons_learned: [],
      actions_taken: [],
      final_response_date: null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<CandourRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_candour_records") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeCandourMetrics,
  identifyCandourAlerts,
};
