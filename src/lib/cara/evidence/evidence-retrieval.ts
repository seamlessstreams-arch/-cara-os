// ══════════════════════════════════════════════════════════════════════════════
// Cara — EVIDENCE RETRIEVAL LAYER
//
// Gathers source records from Cara operational tables and returns
// normalised evidence items for report generation, gap detection, and the
// Cara challenge layer. Each source table has its own query + normaliser;
// queries run in parallel and results are merged, de-duplicated, and sorted.
//
// When Supabase is unavailable the layer returns realistic demo data so the
// UI can render in offline / preview mode.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type { NormalisedEvidence } from "@/types/cara-reports";

// ── Types ──────────────────────────────────────────────────────────────────

interface RetrieveEvidenceOpts {
  homeId: string;
  childId: string;
  dateRangeStart: string; // ISO date
  dateRangeEnd: string;   // ISO date
  types?: string[];       // filter to specific evidence types
  limit?: number;         // max records per type (default 50)
}

interface ChildProfile {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  status: string;
  placementStart: string | null;
  keyWorker: string | null;
}

// ── Evidence type → table mapping ──────────────────────────────────────────

const EVIDENCE_TYPE_MAP: Record<string, string> = {
  daily_log: "daily_log_entries",
  incident: "incidents",
  missing_episode: "missing_episodes",
  generic_record: "generic_records",
  handover: "handovers",
  task: "tasks",
  care_form: "care_forms",
  chronology: "chronology_entries",
  medication: "medications",
  medication_administration: "medication_administrations",
  supervision: "supervisions",
  document: "documents",
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN RETRIEVAL
// ══════════════════════════════════════════════════════════════════════════════

export async function retrieveEvidence(
  opts: RetrieveEvidenceOpts,
): Promise<NormalisedEvidence[]> {
  const { homeId, childId, dateRangeStart, dateRangeEnd, types, limit = 50 } = opts;

  const sb = createServerClient();
  if (!sb) return getDemoEvidence(childId, dateRangeStart, dateRangeEnd);

  // Determine which fetchers to run — if types filter is provided, only run those
  const fetchers: Array<() => Promise<NormalisedEvidence[]>> = [];

  const shouldFetch = (type: string) => !types || types.length === 0 || types.includes(type);

  // ── Daily logs ───────────────────────────────────────────────────────────
  if (shouldFetch("daily_log")) {
    fetchers.push(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (sb.from("daily_log_entries") as any)
        .select("id, child_id, date, time, entry_type, content, mood_score, staff_id, is_significant")
        .eq("child_id", childId)
        .gte("date", dateRangeStart)
        .lte("date", dateRangeEnd)
        .order("date", { ascending: false })
        .limit(limit);

      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: `daily_log_entries::${r.id}`,
        sourceTable: "daily_log_entries",
        sourceRecordId: r.id as string,
        title: `Daily Log — ${r.entry_type ?? "general"}`,
        date: r.date as string,
        type: "daily_log",
        summary: truncate(r.content as string, 300),
        childId: r.child_id as string,
        staffId: r.staff_id as string | null,
        riskLevel: null,
        tags: [
          r.entry_type as string,
          ...(r.is_significant ? ["significant"] : []),
          ...(r.mood_score != null ? [`mood:${r.mood_score}`] : []),
        ].filter(Boolean),
      }));
    });
  }

  // ── Incidents ────────────────────────────────────────────────────────────
  if (shouldFetch("incident")) {
    fetchers.push(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (sb.from("incidents") as any)
        .select("id, home_id, child_id, reference, type, severity, date, description, immediate_action, status")
        .or(`child_id.eq.${childId},home_id.eq.${homeId}`)
        .gte("date", dateRangeStart)
        .lte("date", dateRangeEnd)
        .order("date", { ascending: false })
        .limit(limit);

      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: `incidents::${r.id}`,
        sourceTable: "incidents",
        sourceRecordId: r.id as string,
        title: `Incident ${r.reference} — ${r.type}`,
        date: r.date as string,
        type: "incident",
        summary: truncate(r.description as string, 300),
        childId: r.child_id as string | null,
        staffId: null,
        riskLevel: mapSeverityToRisk(r.severity as string),
        tags: [r.type as string, r.severity as string, r.status as string].filter(Boolean),
      }));
    });
  }

  // ── Missing episodes ─────────────────────────────────────────────────────
  if (shouldFetch("missing_episode")) {
    fetchers.push(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (sb.from("missing_episodes") as any)
        .select("id, child_id, reference, date_missing, date_returned, duration_hours, risk_level, location_last_seen, status, return_interview_completed")
        .eq("child_id", childId)
        .gte("date_missing", dateRangeStart)
        .lte("date_missing", dateRangeEnd)
        .order("date_missing", { ascending: false })
        .limit(limit);

      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: `missing_episodes::${r.id}`,
        sourceTable: "missing_episodes",
        sourceRecordId: r.id as string,
        title: `Missing Episode ${r.reference}`,
        date: r.date_missing as string,
        type: "missing_episode",
        summary: buildMissingSummary(r),
        childId: r.child_id as string,
        staffId: null,
        riskLevel: mapRiskLevel(r.risk_level as string),
        tags: [
          r.status as string,
          r.return_interview_completed ? "ri_completed" : "ri_pending",
        ].filter(Boolean),
      }));
    });
  }

  // ── Generic records ──────────────────────────────────────────────────────
  if (shouldFetch("generic_record")) {
    fetchers.push(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (sb.from("generic_records") as any)
        .select("id, home_id, record_type, data, child_id, staff_id, created_at")
        .eq("child_id", childId)
        .gte("created_at", dateRangeStart)
        .lte("created_at", dateRangeEnd)
        .order("created_at", { ascending: false })
        .limit(limit);

      return (data ?? []).map((r: Record<string, unknown>) => {
        const parsed = (r.data ?? {}) as Record<string, unknown>;
        return {
          id: `generic_records::${r.id}`,
          sourceTable: "generic_records",
          sourceRecordId: r.id as string,
          title: (parsed.title as string) ?? `Record — ${r.record_type}`,
          date: (r.created_at as string).slice(0, 10),
          type: r.record_type as string,
          summary: truncate((parsed.notes ?? parsed.description ?? parsed.content ?? "") as string, 300),
          childId: r.child_id as string | null,
          staffId: r.staff_id as string | null,
          riskLevel: null,
          tags: [r.record_type as string],
        };
      });
    });
  }

  // ── Handovers ────────────────────────────────────────────────────────────
  if (shouldFetch("handover")) {
    fetchers.push(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (sb.from("handovers") as any)
        .select("id, home_id, shift_date, shift_from, shift_to, general_notes, flags, created_at")
        .eq("home_id", homeId)
        .gte("shift_date", dateRangeStart)
        .lte("shift_date", dateRangeEnd)
        .order("shift_date", { ascending: false })
        .limit(limit);

      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: `handovers::${r.id}`,
        sourceTable: "handovers",
        sourceRecordId: r.id as string,
        title: `Handover — ${r.shift_from} to ${r.shift_to}`,
        date: r.shift_date as string,
        type: "handover",
        summary: truncate(r.general_notes as string, 300),
        childId: null,
        staffId: null,
        riskLevel: null,
        tags: [...((r.flags as string[]) ?? [])],
      }));
    });
  }

  // ── Tasks ────────────────────────────────────────────────────────────────
  if (shouldFetch("task")) {
    fetchers.push(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (sb.from("tasks") as any)
        .select("id, home_id, title, description, category, priority, status, assigned_to, due_date, linked_child_id, created_at")
        .or(`linked_child_id.eq.${childId},home_id.eq.${homeId}`)
        .gte("created_at", dateRangeStart)
        .lte("created_at", dateRangeEnd)
        .order("created_at", { ascending: false })
        .limit(limit);

      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: `tasks::${r.id}`,
        sourceTable: "tasks",
        sourceRecordId: r.id as string,
        title: r.title as string,
        date: ((r.due_date ?? r.created_at) as string).slice(0, 10),
        type: "task",
        summary: truncate(r.description as string, 300),
        childId: r.linked_child_id as string | null,
        staffId: r.assigned_to as string | null,
        riskLevel: mapPriorityToRisk(r.priority as string),
        tags: [r.category as string, r.priority as string, r.status as string].filter(Boolean),
      }));
    });
  }

  // ── Care forms ───────────────────────────────────────────────────────────
  if (shouldFetch("care_form")) {
    fetchers.push(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (sb.from("care_forms") as any)
        .select("id, home_id, title, form_type, status, description, linked_child_id, submitted_at, created_at")
        .eq("linked_child_id", childId)
        .gte("created_at", dateRangeStart)
        .lte("created_at", dateRangeEnd)
        .order("created_at", { ascending: false })
        .limit(limit);

      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: `care_forms::${r.id}`,
        sourceTable: "care_forms",
        sourceRecordId: r.id as string,
        title: (r.title as string) || `Care Form — ${r.form_type}`,
        date: ((r.submitted_at ?? r.created_at) as string).slice(0, 10),
        type: "care_form",
        summary: truncate(r.description as string, 300),
        childId: r.linked_child_id as string | null,
        staffId: null,
        riskLevel: null,
        tags: [r.form_type as string, r.status as string].filter(Boolean),
      }));
    });
  }

  // ── Chronology entries ───────────────────────────────────────────────────
  if (shouldFetch("chronology")) {
    fetchers.push(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (sb.from("chronology_entries") as any)
        .select("id, child_id, date, category, title, description, significance, recorded_by")
        .eq("child_id", childId)
        .gte("date", dateRangeStart)
        .lte("date", dateRangeEnd)
        .order("date", { ascending: false })
        .limit(limit);

      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: `chronology_entries::${r.id}`,
        sourceTable: "chronology_entries",
        sourceRecordId: r.id as string,
        title: r.title as string,
        date: r.date as string,
        type: "chronology",
        summary: truncate(r.description as string, 300),
        childId: r.child_id as string,
        staffId: r.recorded_by as string | null,
        riskLevel: mapSignificanceToRisk(r.significance as string),
        tags: [r.category as string, r.significance as string].filter(Boolean),
      }));
    });
  }

  // ── Medications ──────────────────────────────────────────────────────────
  if (shouldFetch("medication")) {
    fetchers.push(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: meds } = await (sb.from("medications") as any)
        .select("id, child_id, name, type, dosage, frequency, start_date, end_date, is_active, special_instructions")
        .eq("child_id", childId)
        .eq("is_active", true)
        .limit(limit);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: admins } = await (sb.from("medication_administrations") as any)
        .select("id, child_id, medication_id, scheduled_time, actual_time, status, administered_by, dose_given, notes")
        .eq("child_id", childId)
        .gte("scheduled_time", dateRangeStart)
        .lte("scheduled_time", dateRangeEnd)
        .order("scheduled_time", { ascending: false })
        .limit(limit);

      const medItems = (meds ?? []).map((r: Record<string, unknown>) => ({
        id: `medications::${r.id}`,
        sourceTable: "medications",
        sourceRecordId: r.id as string,
        title: `Medication — ${r.name}`,
        date: r.start_date as string,
        type: "medication",
        summary: `${r.name} ${r.dosage} ${r.frequency}${r.special_instructions ? ` — ${r.special_instructions}` : ""}`,
        childId: r.child_id as string,
        staffId: null,
        riskLevel: null,
        tags: [r.type as string, r.is_active ? "active" : "discontinued"].filter(Boolean),
      }));

      const adminItems = (admins ?? []).map((r: Record<string, unknown>) => ({
        id: `medication_administrations::${r.id}`,
        sourceTable: "medication_administrations",
        sourceRecordId: r.id as string,
        title: `Medication Administration — ${r.status}`,
        date: ((r.actual_time ?? r.scheduled_time) as string).slice(0, 10),
        type: "medication_administration",
        summary: `${r.dose_given ?? "dose not recorded"} — ${r.status}${r.notes ? `: ${r.notes}` : ""}`,
        childId: r.child_id as string,
        staffId: r.administered_by as string | null,
        riskLevel: r.status === "missed" || r.status === "refused" ? ("medium" as const) : null,
        tags: [r.status as string].filter(Boolean),
      }));

      return [...medItems, ...adminItems];
    });
  }

  // ── Supervisions ─────────────────────────────────────────────────────────
  if (shouldFetch("supervision")) {
    fetchers.push(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (sb.from("supervisions") as any)
        .select("id, home_id, staff_id, supervisor_id, type, scheduled_date, actual_date, status, discussion_points")
        .eq("home_id", homeId)
        .gte("scheduled_date", dateRangeStart)
        .lte("scheduled_date", dateRangeEnd)
        .order("scheduled_date", { ascending: false })
        .limit(limit);

      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: `supervisions::${r.id}`,
        sourceTable: "supervisions",
        sourceRecordId: r.id as string,
        title: `Supervision — ${r.type}`,
        date: (r.actual_date ?? r.scheduled_date) as string,
        type: "supervision",
        summary: truncate(r.discussion_points as string, 300),
        childId: null,
        staffId: r.staff_id as string | null,
        riskLevel: null,
        tags: [r.type as string, r.status as string].filter(Boolean),
      }));
    });
  }

  // ── Documents ────────────────────────────────────────────────────────────
  if (shouldFetch("document")) {
    fetchers.push(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (sb.from("documents") as any)
        .select("id, home_id, title, category, description, file_name, linked_child_id, linked_staff_id, tags, created_at")
        .eq("home_id", homeId)
        .gte("created_at", dateRangeStart)
        .lte("created_at", dateRangeEnd)
        .order("created_at", { ascending: false })
        .limit(limit);

      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: `documents::${r.id}`,
        sourceTable: "documents",
        sourceRecordId: r.id as string,
        title: r.title as string,
        date: (r.created_at as string).slice(0, 10),
        type: "document",
        summary: truncate((r.description ?? `File: ${r.file_name}`) as string, 300),
        childId: r.linked_child_id as string | null,
        staffId: r.linked_staff_id as string | null,
        riskLevel: null,
        tags: [r.category as string, ...((r.tags as string[]) ?? [])].filter(Boolean),
      }));
    });
  }

  // ── Execute all fetchers in parallel ─────────────────────────────────────

  const results = await Promise.all(fetchers.map((fn) => fn().catch((err) => {
    console.error("[cara-evidence] Fetcher failed:", err);
    return [] as NormalisedEvidence[];
  })));

  const all = results.flat();

  // Sort by date descending
  all.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));

  return all;
}

// ══════════════════════════════════════════════════════════════════════════════
// CHILD PROFILE RETRIEVAL
// ══════════════════════════════════════════════════════════════════════════════

export async function retrieveChildProfile(
  childId: string,
  homeId: string,
): Promise<ChildProfile | null> {
  const sb = createServerClient();
  if (!sb) {
    return {
      id: childId,
      firstName: "Jayden",
      lastName: "Mitchell",
      dateOfBirth: "2010-03-15",
      status: "current",
      placementStart: "2025-01-06",
      keyWorker: "Sarah Thompson",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("young_people") as any)
    .select("id, first_name, last_name, date_of_birth, status, placement_start, key_worker_id")
    .eq("id", childId)
    .eq("home_id", homeId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    dateOfBirth: data.date_of_birth ?? null,
    status: data.status,
    placementStart: data.placement_start ?? null,
    keyWorker: data.key_worker_id ?? null,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// GROUPING & SUMMARISATION HELPERS
// ══════════════════════════════════════════════════════════════════════════════

export function groupEvidenceByType(
  evidence: NormalisedEvidence[],
): Record<string, NormalisedEvidence[]> {
  const grouped: Record<string, NormalisedEvidence[]> = {};

  for (const item of evidence) {
    if (!grouped[item.type]) {
      grouped[item.type] = [];
    }
    grouped[item.type].push(item);
  }

  return grouped;
}

export function summariseEvidence(evidence: NormalisedEvidence[]): string {
  if (evidence.length === 0) return "No evidence available for the requested period.";

  const lines = evidence.map((e) => {
    const typeLabel = e.type.toUpperCase().replace(/_/g, " ");
    const dateStr = e.date;
    return `[${typeLabel}] ${e.title} (${dateStr}): ${e.summary}`;
  });

  return lines.join("\n");
}

// ══════════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function truncate(text: string | null | undefined, maxLen: number): string {
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + "…";
}

function mapSeverityToRisk(severity: string): "low" | "medium" | "high" | null {
  switch (severity?.toLowerCase()) {
    case "critical":
    case "high":
      return "high";
    case "medium":
    case "moderate":
      return "medium";
    case "low":
    case "minor":
      return "low";
    default:
      return null;
  }
}

function mapRiskLevel(level: string): "low" | "medium" | "high" | null {
  switch (level?.toLowerCase()) {
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
    default:
      return null;
  }
}

function mapPriorityToRisk(priority: string): "low" | "medium" | "high" | null {
  switch (priority?.toLowerCase()) {
    case "urgent":
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
    default:
      return null;
  }
}

function mapSignificanceToRisk(significance: string): "low" | "medium" | "high" | null {
  switch (significance?.toLowerCase()) {
    case "critical":
    case "high":
      return "high";
    case "medium":
    case "moderate":
      return "medium";
    case "low":
    case "routine":
      return "low";
    default:
      return null;
  }
}

function buildMissingSummary(r: Record<string, unknown>): string {
  const parts: string[] = [];
  parts.push(`Missing from ${r.location_last_seen ?? "unknown location"}`);
  if (r.date_returned) {
    parts.push(`returned ${r.date_returned}`);
    if (r.duration_hours != null) parts.push(`(${r.duration_hours}h)`);
  } else {
    parts.push("not yet returned");
  }
  if (r.return_interview_completed) {
    parts.push("— return interview completed");
  }
  return parts.join(" ");
}

// ══════════════════════════════════════════════════════════════════════════════
// DEMO DATA
// ══════════════════════════════════════════════════════════════════════════════

function getDemoEvidence(
  childId: string,
  dateStart: string,
  dateEnd: string,
): NormalisedEvidence[] {
  // Build dates within the requested range for realistic spread
  const start = new Date(dateStart);
  const end = new Date(dateEnd);
  const mid = new Date(start.getTime() + (end.getTime() - start.getTime()) / 2);
  const d = (offset: number) => {
    const dt = new Date(mid);
    dt.setDate(dt.getDate() + offset);
    return dt.toISOString().slice(0, 10);
  };

  return [
    // ── Daily logs — Jayden's week ─────────────────────────────────────
    {
      id: `daily_log_entries::demo-dl-1`,
      sourceTable: "daily_log_entries",
      sourceRecordId: "demo-dl-1",
      title: "Daily Log — morning routine",
      date: d(-3),
      type: "daily_log",
      summary: "Jayden had a settled morning. Woke independently at 7:15, came downstairs in good spirits. Ate a full breakfast and chatted about wanting to finish his art project at school. Left for school on time with no prompts needed.",
      childId,
      staffId: "demo-staff-sarah",
      riskLevel: null,
      tags: ["routine", "mood:8"],
    },
    {
      id: `daily_log_entries::demo-dl-2`,
      sourceTable: "daily_log_entries",
      sourceRecordId: "demo-dl-2",
      title: "Daily Log — afterschool",
      date: d(-3),
      type: "daily_log",
      summary: "Jayden returned from school slightly quieter than usual. Said he had fallen out with a friend at lunchtime but did not want to talk about it yet. Staff offered a check-in later and Jayden agreed. Played on his Xbox for an hour then joined Amara making brownies in the kitchen.",
      childId,
      staffId: "demo-staff-sarah",
      riskLevel: null,
      tags: ["afterschool", "mood:5", "significant"],
    },
    {
      id: `daily_log_entries::demo-dl-3`,
      sourceTable: "daily_log_entries",
      sourceRecordId: "demo-dl-3",
      title: "Daily Log — evening",
      date: d(-2),
      type: "daily_log",
      summary: "Jayden was in good form during the evening. He completed his homework with minimal support and then watched a film with Amara and staff. Went to bed at 9:30 without any issues. Said he was feeling better about the situation with his friend.",
      childId,
      staffId: "demo-staff-mark",
      riskLevel: null,
      tags: ["evening", "mood:7"],
    },
    {
      id: `daily_log_entries::demo-dl-4`,
      sourceTable: "daily_log_entries",
      sourceRecordId: "demo-dl-4",
      title: "Daily Log — morning routine",
      date: d(-1),
      type: "daily_log",
      summary: "Jayden struggled to get up this morning and needed two prompts. Eventually came downstairs at 7:45 looking tired. Said he had not slept well. Ate a small breakfast. Staff noted this for follow-up with the key worker.",
      childId,
      staffId: "demo-staff-mark",
      riskLevel: null,
      tags: ["routine", "mood:4", "significant"],
    },
    {
      id: `daily_log_entries::demo-dl-5`,
      sourceTable: "daily_log_entries",
      sourceRecordId: "demo-dl-5",
      title: "Daily Log — positive achievement",
      date: d(0),
      type: "daily_log",
      summary: "Jayden received a merit certificate at school for his artwork. He was visibly proud and wanted to put it up on the notice board. Staff praised him and took a photo for his memory box. He spoke about wanting to do more art at the weekend.",
      childId,
      staffId: "demo-staff-sarah",
      riskLevel: null,
      tags: ["achievement", "mood:9"],
    },
    {
      id: `daily_log_entries::demo-dl-6`,
      sourceTable: "daily_log_entries",
      sourceRecordId: "demo-dl-6",
      title: "Daily Log — weekend activity",
      date: d(1),
      type: "daily_log",
      summary: "Jayden went to the local leisure centre with staff for a swimming session. He was engaged and enthusiastic, swimming for a full 45 minutes. Afterwards he asked if they could go again next week. A positive outing with no concerns.",
      childId,
      staffId: "demo-staff-mark",
      riskLevel: null,
      tags: ["activity", "mood:8"],
    },

    // ── Incident ───────────────────────────────────────────────────────
    {
      id: `incidents::demo-inc-1`,
      sourceTable: "incidents",
      sourceRecordId: "demo-inc-1",
      title: "Incident INC-0247 — verbal altercation",
      date: d(-2),
      type: "incident",
      summary: "Jayden became upset during a disagreement with Amara over the TV remote at approximately 18:30. He raised his voice and used inappropriate language. Staff intervened calmly using de-escalation techniques. Jayden took himself to his room after five minutes and apologised to Amara 30 minutes later unprompted.",
      childId,
      staffId: null,
      riskLevel: "low",
      tags: ["verbal_altercation", "low", "resolved"],
    },

    // ── Keywork session (generic record) ───────────────────────────────
    {
      id: `generic_records::demo-gr-1`,
      sourceTable: "generic_records",
      sourceRecordId: "demo-gr-1",
      title: "Keywork Session — weekly check-in",
      date: d(-1),
      type: "keywork",
      summary: "Weekly keywork session with Jayden. Discussed his friendship difficulties at school — he shared that he felt left out at lunch. Explored coping strategies together. Also talked about his upcoming contact visit with mum and how he is feeling about it. Jayden said he is looking forward to it but feels a bit nervous. Agreed to do a worry box activity before the visit.",
      childId,
      staffId: "demo-staff-sarah",
      riskLevel: null,
      tags: ["keywork", "child_voice"],
    },

    // ── Education notes (generic record) ───────────────────────────────
    {
      id: `generic_records::demo-gr-2`,
      sourceTable: "generic_records",
      sourceRecordId: "demo-gr-2",
      title: "Education Update — PEP review feedback",
      date: d(-2),
      type: "education",
      summary: "Attended Jayden's PEP review at Oakfield Academy. Teachers report he is making good progress in art and English, now working at age-related expectations in both. Maths remains a focus area — school has arranged additional small-group support twice a week. Jayden's attendance this term is 96%, which is a significant improvement from last term (89%). Virtual school head pleased with progress.",
      childId,
      staffId: "demo-staff-sarah",
      riskLevel: null,
      tags: ["education", "pep_review"],
    },

    // ── Health appointment (generic record) ────────────────────────────
    {
      id: `generic_records::demo-gr-3`,
      sourceTable: "generic_records",
      sourceRecordId: "demo-gr-3",
      title: "Health — GP appointment",
      date: d(0),
      type: "health",
      summary: "Accompanied Jayden to his routine LAC health review at the GP surgery. No concerns raised. Jayden is up to date with immunisations. GP noted healthy weight and height for age. Jayden mentioned to the GP that he sometimes has trouble sleeping — GP suggested a consistent wind-down routine and will review at the next appointment if it persists.",
      childId,
      staffId: "demo-staff-mark",
      riskLevel: null,
      tags: ["health", "lac_review"],
    },

    // ── Family contact ─────────────────────────────────────────────────
    {
      id: `generic_records::demo-gr-4`,
      sourceTable: "generic_records",
      sourceRecordId: "demo-gr-4",
      title: "Family Contact — supervised visit with mum",
      date: d(1),
      type: "family_contact",
      summary: "Supervised contact session with mum at the family centre. Jayden was initially quiet but warmed up after 10 minutes. They played a board game together and mum brought photos from when Jayden was younger, which he enjoyed looking at. Jayden asked mum about his nan and was pleased to hear she is doing well. Session lasted the full hour. Jayden was a little subdued on the journey back but said he had a nice time.",
      childId,
      staffId: "demo-staff-sarah",
      riskLevel: null,
      tags: ["family_contact", "supervised", "child_voice"],
    },

    // ── Handover ───────────────────────────────────────────────────────
    {
      id: `handovers::demo-ho-1`,
      sourceTable: "handovers",
      sourceRecordId: "demo-ho-1",
      title: "Handover — Day to Night",
      date: d(-1),
      type: "handover",
      summary: "Both young people settled this evening. Jayden completed homework and went to bed on time. Amara had a good day at college. No incidents. Jayden has a GP appointment tomorrow at 10:30 — Mark to accompany. Medication administered as prescribed, no refusals.",
      childId: null,
      staffId: null,
      riskLevel: null,
      tags: ["routine"],
    },

    // ── Task ───────────────────────────────────────────────────────────
    {
      id: `tasks::demo-task-1`,
      sourceTable: "tasks",
      sourceRecordId: "demo-task-1",
      title: "Follow up on Jayden's sleep difficulties",
      date: d(2),
      type: "task",
      summary: "Key worker to follow up on Jayden's report of poor sleep. Discuss with night staff whether there have been any observed patterns. Consider referral to CAMHS if sleep difficulties persist beyond two weeks.",
      childId,
      staffId: "demo-staff-sarah",
      riskLevel: "low",
      tags: ["wellbeing", "medium", "open"],
    },

    // ── Care form ──────────────────────────────────────────────────────
    {
      id: `care_forms::demo-cf-1`,
      sourceTable: "care_forms",
      sourceRecordId: "demo-cf-1",
      title: "Risk Assessment — community activities",
      date: d(-3),
      type: "care_form",
      summary: "Updated risk assessment for Jayden attending the leisure centre independently. Current assessment is that supervised sessions are appropriate with a review in four weeks. Jayden is aware of the boundaries and has agreed to carry his mobile phone at all times.",
      childId,
      staffId: null,
      riskLevel: "low",
      tags: ["risk_assessment", "approved"],
    },

    // ── Chronology entry ───────────────────────────────────────────────
    {
      id: `chronology_entries::demo-chr-1`,
      sourceTable: "chronology_entries",
      sourceRecordId: "demo-chr-1",
      title: "LAC Review meeting",
      date: d(0),
      type: "chronology",
      summary: "Jayden's LAC review held at the home. Social worker, IRO, key worker, virtual school head, and Jayden all attended. Jayden contributed using his consultation form and said he feels safe and mostly happy at the home. Placement plan agreed to continue. Next review in six months.",
      childId,
      staffId: "demo-staff-sarah",
      riskLevel: null,
      tags: ["lac_review", "high"],
    },

    // ── Medication ─────────────────────────────────────────────────────
    {
      id: `medications::demo-med-1`,
      sourceTable: "medications",
      sourceRecordId: "demo-med-1",
      title: "Medication — Melatonin",
      date: d(-5),
      type: "medication",
      summary: "Melatonin 2mg nightly — prescribed to support sleep onset. No reported side effects.",
      childId,
      staffId: null,
      riskLevel: null,
      tags: ["prescription", "active"],
    },

    // ── Supervision ────────────────────────────────────────────────────
    {
      id: `supervisions::demo-sup-1`,
      sourceTable: "supervisions",
      sourceRecordId: "demo-sup-1",
      title: "Supervision — formal",
      date: d(-4),
      type: "supervision",
      summary: "Monthly supervision with Sarah Thompson. Discussed Jayden's progress and the upcoming contact visit. Sarah raised that she would like additional training on therapeutic parenting approaches. Manager agreed to source a course. Also reviewed Amara's placement plan targets.",
      childId: null,
      staffId: "demo-staff-sarah",
      riskLevel: null,
      tags: ["formal", "completed"],
    },
  ];
}
