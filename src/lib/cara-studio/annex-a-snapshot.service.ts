// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — ANNEX A LIVE SNAPSHOT SERVICE
//
// The live-tenant counterpart to lib/cara/cara-annex-a-snapshot.ts (the
// in-memory engine). The store is emptied on a live tenant, so the snapshot
// data is recomputed here from the home's real records:
//   • children + staff via the dal (which reads young_people / staff_members),
//   • notifiable events from the care_events spine,
//   • complaints / missing / restraints / Reg 44 / Reg 45 from the cs_* tables.
// Snapshots are persisted to cara_studio_annex_a_snapshots so history and the
// manager lock survive.
//
// The readiness maths (weights, thresholds, scoring) is imported from the store
// engine — one source of truth, so the live and demo snapshots agree.
//
// Honest-absence rule: a source read that ERRORS throws, so a storage failure
// surfaces as a failed snapshot rather than silently reading as "0 records =
// green". An empty table (no rows, no error) is a genuine zero and is reported
// as such.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import { dal } from "@/lib/db/dal";
import {
  type CaraAnnexAReadiness,
  type CaraAnnexASectionReading,
  type CaraAnnexASnapshot,
} from "@/types/cara-studio";
import {
  defaultPeriod,
  inPeriod,
  isStale,
  readinessFromCounts,
  readinessScore,
  overallReadiness,
} from "@/lib/cara/cara-annex-a-snapshot";
import type { RawClient, SB } from "@/lib/supabase/loose-client";

const TABLE = "cara_studio_annex_a_snapshots";
const REG44_EXPECTED_VISITS = 6; // ~1/month across the default 180-day period

function raw(c: NonNullable<ReturnType<typeof createServerClient>>): RawClient {
  return c as unknown as RawClient;
}

export interface SnapshotData {
  sections: CaraAnnexASectionReading[];
  readiness_score: number | null;
  overall_readiness: CaraAnnexAReadiness;
  total_gaps: number;
  total_stale: number;
  period_start: string;
  period_end: string;
  generated_at: string;
}

type Row = Record<string, unknown>;

/** Fetch every home-scoped row of a table. Throws on a read error so a failure
 *  is never mistaken for an empty table (honest-absence). */
async function fetchHomeRows(sb: SB, table: string, cols: string, hId: string): Promise<Row[]> {
  const { data, error } = await raw(sb).from(table).select(cols).eq("home_id", hId);
  if (error) throw new Error(`[annex-a] read ${table} failed: ${error.code ?? error.message ?? "unknown"}`);
  return (data ?? []) as Row[];
}

const str = (v: unknown): string => (v == null ? "" : String(v));
const returnInterviewDone = (v: unknown): boolean =>
  ["completed", "complete", "done"].includes(str(v).toLowerCase());
const reg45Approved = (v: unknown): boolean =>
  ["approved", "locked", "published", "accepted", "sent"].includes(str(v).toLowerCase());

// ── Section builders (live data, same readiness maths as the store engine) ──────

async function buildSection1(hId: string): Promise<CaraAnnexASectionReading> {
  const present = Boolean(hId);
  return {
    key: "section_1",
    label: "Section 1 — Details of the home",
    weight: 5,
    record_count: present ? 1 : 0,
    gap_count: present ? 0 : 1,
    stale_count: 0,
    readiness: present ? "green" : "red",
    issues: present ? [] : ["Home identifier missing"],
    notes: present ? "Home record present." : "No home record located.",
  };
}

async function buildSection2(): Promise<CaraAnnexASectionReading> {
  // dal.youngPeople.findCurrent() is already home-scoped + status=current on live.
  const children = await dal.youngPeople.findCurrent();
  const issues: string[] = [];
  let gaps = 0;
  for (const y of children) {
    const missing: string[] = [];
    if (!y.social_worker_name) missing.push("social worker");
    if (!y.key_worker_id) missing.push("key worker");
    if (!y.iro_name) missing.push("IRO");
    if (!y.legal_status) missing.push("legal status");
    if (missing.length > 0) {
      gaps++;
      issues.push(`${y.first_name} ${y.last_name}: missing ${missing.join(", ")}`);
    }
  }
  return {
    key: "section_2",
    label: "Section 2 — Children and young people",
    weight: 20,
    record_count: children.length,
    gap_count: gaps,
    stale_count: 0,
    readiness: readinessFromCounts(children.length, gaps, false),
    issues: issues.slice(0, 10),
    notes: `${children.length} current children${gaps > 0 ? `, ${gaps} with missing key fields` : ""}.`,
  };
}

async function buildSection3(asOf: string): Promise<CaraAnnexASectionReading> {
  const staff = await dal.staff.findActive();
  const issues: string[] = [];
  let gaps = 0;
  let stale = 0;
  for (const s of staff) {
    const missing: string[] = [];
    if (!s.dbs_number) missing.push("DBS number");
    if (!s.next_supervision_due) missing.push("supervision schedule");
    if (s.next_supervision_due && s.next_supervision_due.slice(0, 10) < asOf.slice(0, 10)) {
      missing.push("overdue supervision");
      stale++;
    }
    if (missing.length > 0) {
      gaps++;
      issues.push(`${s.full_name}: ${missing.join(", ")}`);
    }
  }
  return {
    key: "section_3",
    label: "Section 3 — Staffing",
    weight: 15,
    record_count: staff.length,
    gap_count: gaps,
    stale_count: stale,
    readiness: readinessFromCounts(staff.length, gaps, true),
    issues: issues.slice(0, 10),
    notes: `${staff.length} active staff${gaps > 0 ? `, ${gaps} with compliance gaps` : ""}.`,
  };
}

async function buildSection4(sb: SB, hId: string, ps: string, pe: string): Promise<CaraAnnexASectionReading> {
  // "Incidents and notifications" ← the care-event spine. A notifiable event is
  // a Reg 40 triage item or a safeguarding event; an oversight gap is one that
  // still needs manager review.
  const rows = await fetchHomeRows(
    sb,
    "care_events",
    "id, title, category, requires_reg40_triage, requires_manager_review, manager_review_at, submitted_at, created_at",
    hId,
  );
  const notif = rows.filter(
    (r) =>
      (r.requires_reg40_triage === true || r.category === "safeguarding") &&
      inPeriod(str(r.submitted_at) || str(r.created_at), ps, pe),
  );
  const issues: string[] = [];
  let gaps = 0;
  for (const r of notif) {
    if (r.requires_manager_review === true && !r.manager_review_at) {
      gaps++;
      issues.push(`${str(r.title) || str(r.id)}: manager oversight outstanding`);
    }
  }
  return {
    key: "section_4",
    label: "Section 4 — Incidents and notifications",
    weight: 15,
    record_count: notif.length,
    gap_count: gaps,
    stale_count: 0,
    readiness: readinessFromCounts(notif.length, gaps, false),
    issues: issues.slice(0, 10),
    notes: `${notif.length} notifiable events in period${gaps > 0 ? `, ${gaps} awaiting oversight` : ""}.`,
  };
}

async function buildSection5(sb: SB, hId: string, ps: string, pe: string): Promise<CaraAnnexASectionReading> {
  const rows = await fetchHomeRows(sb, "cs_complaints", "id, complainant_name, date_received, date_responded, status", hId);
  const inp = rows.filter((r) => inPeriod(str(r.date_received), ps, pe));
  const issues: string[] = [];
  let gaps = 0;
  for (const r of inp) {
    if (!r.date_responded) {
      gaps++;
      issues.push(`${str(r.complainant_name) || str(r.id)}: not yet responded`);
    }
  }
  return {
    key: "section_5",
    label: "Section 5 — Complaints and representations",
    weight: 10,
    record_count: inp.length,
    gap_count: gaps,
    stale_count: 0,
    readiness: readinessFromCounts(inp.length, gaps, false),
    issues: issues.slice(0, 10),
    notes: `${inp.length} complaints in period${gaps > 0 ? `, ${gaps} awaiting response` : ""}.`,
  };
}

async function buildSection6(sb: SB, hId: string, ps: string, pe: string): Promise<CaraAnnexASectionReading> {
  const rows = await fetchHomeRows(sb, "cs_missing_episodes", "id, reported_missing_at, status, return_interview_status", hId);
  const inp = rows.filter((r) => inPeriod(str(r.reported_missing_at), ps, pe));
  const issues: string[] = [];
  let gaps = 0;
  for (const r of inp) {
    if (!returnInterviewDone(r.return_interview_status)) {
      gaps++;
      issues.push(`${str(r.id).slice(-6)}: return interview outstanding`);
    }
  }
  return {
    key: "section_6",
    label: "Section 6 — Missing episodes",
    weight: 10,
    record_count: inp.length,
    gap_count: gaps,
    stale_count: 0,
    readiness: readinessFromCounts(inp.length, gaps, false),
    issues: issues.slice(0, 10),
    notes: `${inp.length} missing episodes in period${gaps > 0 ? `, ${gaps} missing return interview` : ""}.`,
  };
}

async function buildSection7(sb: SB, hId: string, ps: string, pe: string): Promise<CaraAnnexASectionReading> {
  const rows = await fetchHomeRows(sb, "cs_restraint_records", "id, incident_date, manager_reviewed, debrief_completed", hId);
  const inp = rows.filter((r) => inPeriod(str(r.incident_date), ps, pe));
  const issues: string[] = [];
  let gaps = 0;
  for (const r of inp) {
    const problems: string[] = [];
    if (r.manager_reviewed !== true) problems.push("manager review pending");
    if (r.debrief_completed !== true) problems.push("debrief missing");
    if (problems.length > 0) {
      gaps++;
      issues.push(`${str(r.id).slice(-6)}: ${problems.join(", ")}`);
    }
  }
  return {
    key: "section_7",
    label: "Section 7 — Physical interventions / restraints",
    weight: 10,
    record_count: inp.length,
    gap_count: gaps,
    stale_count: 0,
    readiness: readinessFromCounts(inp.length, gaps, false),
    issues: issues.slice(0, 10),
    notes: `${inp.length} restraints in period${gaps > 0 ? `, ${gaps} with outstanding follow-up` : ""}.`,
  };
}

async function buildSection8(sb: SB, hId: string, ps: string, pe: string, asOf: string): Promise<CaraAnnexASectionReading> {
  const rows = await fetchHomeRows(sb, "cs_reg44_independent_visitor_reports", "id, visit_date, report_status", hId);
  const inp = rows.filter((r) => inPeriod(str(r.visit_date), ps, pe));
  const issues: string[] = [];
  let gaps = 0;
  let stale = 0;
  if (inp.length < REG44_EXPECTED_VISITS) {
    gaps += REG44_EXPECTED_VISITS - inp.length;
    issues.push(`${REG44_EXPECTED_VISITS - inp.length} fewer Reg 44 visits than expected in period`);
  }
  for (const r of inp) {
    if (isStale(str(r.visit_date), asOf)) stale++;
  }
  let readiness: CaraAnnexAReadiness;
  if (inp.length === 0) readiness = "red";
  else if (inp.length < REG44_EXPECTED_VISITS) readiness = "amber";
  else readiness = readinessFromCounts(inp.length, gaps, true);
  return {
    key: "section_8",
    label: "Section 8 — Regulation 44 visits",
    weight: 10,
    record_count: inp.length,
    gap_count: gaps,
    stale_count: stale,
    readiness,
    issues: issues.slice(0, 10),
    notes: `${inp.length} Reg 44 visits in period (expected ~${REG44_EXPECTED_VISITS}).`,
  };
}

async function buildSection9(sb: SB, hId: string, ps: string, pe: string): Promise<CaraAnnexASectionReading> {
  const rows = await fetchHomeRows(sb, "cs_reg45_reports", "id, report_period_end, status", hId);
  const inp = rows.filter((r) => reg45Approved(r.status) && inPeriod(str(r.report_period_end), ps, pe));
  const recordCount = inp.length;
  const issues: string[] = [];
  let gaps = 0;
  if (recordCount === 0) {
    gaps = 1;
    issues.push("No approved Reg 45 report in period");
  }
  const readiness: CaraAnnexAReadiness = recordCount === 0 ? "red" : "green";
  return {
    key: "section_9",
    label: "Section 9 — Regulation 45 reports",
    weight: 5,
    record_count: recordCount,
    gap_count: gaps,
    stale_count: 0,
    readiness,
    issues,
    notes: `${recordCount} approved Reg 45 reports in period.`,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Recompute the nine Annex A section readings from the home's live records. */
export async function buildAnnexASnapshotDataLive(
  sb: SB,
  hId: string,
  opts: { periodStart?: string; periodEnd?: string } = {},
): Promise<SnapshotData> {
  const { periodStart: defStart, periodEnd: defEnd } = defaultPeriod();
  const periodStart = opts.periodStart ?? defStart;
  const periodEnd = opts.periodEnd ?? defEnd;
  const generatedAt = new Date().toISOString();

  // Ordered section_1 … section_9.
  const sections = await Promise.all([
    buildSection1(hId),
    buildSection2(),
    buildSection3(generatedAt),
    buildSection4(sb, hId, periodStart, periodEnd),
    buildSection5(sb, hId, periodStart, periodEnd),
    buildSection6(sb, hId, periodStart, periodEnd),
    buildSection7(sb, hId, periodStart, periodEnd),
    buildSection8(sb, hId, periodStart, periodEnd, generatedAt),
    buildSection9(sb, hId, periodStart, periodEnd),
  ]);

  const score = readinessScore(sections);
  return {
    sections,
    readiness_score: score,
    overall_readiness: overallReadiness(score ?? 0),
    total_gaps: sections.reduce((acc, s) => acc + s.gap_count, 0),
    total_stale: sections.reduce((acc, s) => acc + s.stale_count, 0),
    period_start: periodStart,
    period_end: periodEnd,
    generated_at: generatedAt,
  };
}

function mapRow(r: Row): CaraAnnexASnapshot {
  return {
    id: str(r.id),
    home_id: str(r.home_id),
    period_start: str(r.period_start).slice(0, 10),
    period_end: str(r.period_end).slice(0, 10),
    generated_at: str(r.generated_at),
    status: r.status === "locked" ? "locked" : "draft",
    readiness_score: r.readiness_score == null ? null : Number(r.readiness_score),
    overall_readiness: (str(r.overall_readiness) || "red") as CaraAnnexAReadiness,
    sections: Array.isArray(r.sections) ? (r.sections as CaraAnnexASectionReading[]) : [],
    total_gaps: Number(r.total_gaps ?? 0),
    total_stale: Number(r.total_stale ?? 0),
    locked_by: (r.locked_by as string | null) ?? null,
    locked_at: (r.locked_at as string | null) ?? null,
    lock_note: (r.lock_note as string | null) ?? null,
  };
}

/** Build + persist a snapshot. Refreshes the live draft for the same period in
 *  place; a locked snapshot for that period is never touched. Returns null when
 *  Supabase is off (the caller falls back to the in-memory engine). */
export async function runAnnexASnapshotLive(
  hId: string,
  opts: { periodStart?: string; periodEnd?: string } = {},
): Promise<CaraAnnexASnapshot | null> {
  const sb = createServerClient();
  if (!sb) return null;

  const data = await buildAnnexASnapshotDataLive(sb, hId, opts);

  const { data: existing, error: findErr } = await raw(sb)
    .from(TABLE)
    .select("id")
    .eq("home_id", hId)
    .eq("status", "draft")
    .eq("period_start", data.period_start)
    .eq("period_end", data.period_end)
    .limit(1);
  if (findErr) throw new Error(`[annex-a] find draft failed: ${findErr.code ?? findErr.message ?? "unknown"}`);

  const existingId = Array.isArray(existing) && existing[0]?.id ? str(existing[0].id) : null;
  const now = new Date().toISOString();

  if (existingId) {
    const { data: updated, error } = await raw(sb)
      .from(TABLE)
      .update({
        generated_at: data.generated_at,
        sections: data.sections,
        readiness_score: data.readiness_score,
        overall_readiness: data.overall_readiness,
        total_gaps: data.total_gaps,
        total_stale: data.total_stale,
        updated_at: now,
      })
      .eq("id", existingId)
      .select("*")
      .single();
    if (error) throw new Error(`[annex-a] update draft failed: ${error.code ?? error.message ?? "unknown"}`);
    return mapRow(updated as Row);
  }

  const { data: inserted, error } = await raw(sb)
    .from(TABLE)
    .insert({
      home_id: hId,
      period_start: data.period_start,
      period_end: data.period_end,
      generated_at: data.generated_at,
      status: "draft",
      readiness_score: data.readiness_score,
      overall_readiness: data.overall_readiness,
      sections: data.sections,
      total_gaps: data.total_gaps,
      total_stale: data.total_stale,
    })
    .select("*")
    .single();
  if (error) throw new Error(`[annex-a] insert snapshot failed: ${error.code ?? error.message ?? "unknown"}`);
  return mapRow(inserted as Row);
}

/** One snapshot by id (any home), or null. Used by the lock route to read the
 *  home + status before the permission check and the 404/409 decision. */
export async function getAnnexASnapshotByIdLive(id: string): Promise<CaraAnnexASnapshot | null> {
  const sb = createServerClient();
  if (!sb) return null;
  const { data, error } = await raw(sb).from(TABLE).select("*").eq("id", id).limit(1);
  if (error) throw new Error(`[annex-a] get snapshot failed: ${error.code ?? error.message ?? "unknown"}`);
  const row = Array.isArray(data) ? (data[0] as Row | undefined) : undefined;
  return row ? mapRow(row) : null;
}

/** All snapshots for a home, newest first. */
export async function loadAnnexASnapshotsLive(hId: string): Promise<CaraAnnexASnapshot[]> {
  const sb = createServerClient();
  if (!sb) return [];
  const { data, error } = await raw(sb)
    .from(TABLE)
    .select("*")
    .eq("home_id", hId)
    .order("generated_at", { ascending: false });
  if (error) throw new Error(`[annex-a] list snapshots failed: ${error.code ?? error.message ?? "unknown"}`);
  return ((data ?? []) as Row[]).map(mapRow);
}

/** Lock a snapshot (immutable thereafter). A snapshot already locked is returned
 *  unchanged; a missing id returns null. */
export async function lockAnnexASnapshotLive(
  id: string,
  lockedBy: string,
  lockNote: string | null,
): Promise<CaraAnnexASnapshot | null> {
  const sb = createServerClient();
  if (!sb) return null;

  const { data: cur, error: findErr } = await raw(sb).from(TABLE).select("*").eq("id", id).limit(1);
  if (findErr) throw new Error(`[annex-a] find snapshot failed: ${findErr.code ?? findErr.message ?? "unknown"}`);
  const row = Array.isArray(cur) ? (cur[0] as Row | undefined) : undefined;
  if (!row) return null;
  if (row.status === "locked") return mapRow(row);

  const { data: updated, error } = await raw(sb)
    .from(TABLE)
    .update({
      status: "locked",
      locked_by: lockedBy,
      locked_at: new Date().toISOString(),
      lock_note: lockNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`[annex-a] lock snapshot failed: ${error.code ?? error.message ?? "unknown"}`);
  return mapRow(updated as Row);
}
