// ══════════════════════════════════════════════════════════════════════════════
// Per-child chronology API — aggregates all significant events for a child
// into a single time-ordered list for inspection readiness and LAC reviews.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { withShiftAccess } from "@/lib/permissions/with-shift-access";

export const dynamic = "force-dynamic";

// ── Normalised chronology item ────────────────────────────────────────────────

export interface ChronologyItem {
  id: string;
  source_type:
    | "care_event"
    | "incident"
    | "missing_episode"
    | "behaviour_log"
    | "key_working"
    | "daily_log"
    | "risk_assessment"
    | "chronology_entry";
  source_id: string;
  date: string;
  time: string | null;
  title: string;
  summary: string;
  severity: "routine" | "significant" | "critical";
  category: string;
  staff_id: string | null;
  links: { label: string; href: string }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function severityFromIncident(sev: string): "routine" | "significant" | "critical" {
  if (sev === "critical" || sev === "high") return "critical";
  if (sev === "medium") return "significant";
  return "routine";
}

function severityFromBehaviour(dir: string): "routine" | "significant" | "critical" {
  return dir === "negative" ? "significant" : "routine";
}

// Per-child chronology — child-record data, guarded by the permission engine.
async function getChronology(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: childId } = await params;

  if (!childId) {
    return NextResponse.json({ error: "Child ID required" }, { status: 400 });
  }

  const url = new URL(_req.url);
  const from  = url.searchParams.get("from");   // ISO date string filter
  const to    = url.searchParams.get("to");
  const types = url.searchParams.getAll("type"); // filter to specific source types
  const limit = parseInt(url.searchParams.get("limit") ?? "200", 10);

  const items: ChronologyItem[] = [];

  // ── Care Events ───────────────────────────────────────────────────────────
  if (!types.length || types.includes("care_event")) {
    const events = db.careEvents.findByChild(childId);
    for (const ev of events) {
      const isSig = ev.category === "safeguarding" || ev.category === "missing_episode"
        || ev.category === "physical_intervention" || ev.category === "restraint"
        || ev.category === "health";
      items.push({
        id:          `ce:${ev.id}`,
        source_type: "care_event",
        source_id:   ev.id,
        date:        ev.event_date,
        time:        ev.event_time ?? null,
        title:       ev.title,
        summary:     ev.content?.slice(0, 200) ?? "",
        severity:    isSig ? "significant" : "routine",
        category:    ev.category,
        staff_id:    ev.staff_id,
        links:       [{ label: "Care Event", href: `/care-events` }],
      });
    }
  }

  // ── Incidents ─────────────────────────────────────────────────────────────
  if (!types.length || types.includes("incident")) {
    const incidents = db.incidents.findAll().filter((i) => i.child_id === childId);
    for (const inc of incidents) {
      items.push({
        id:          `inc:${inc.id}`,
        source_type: "incident",
        source_id:   inc.id,
        date:        inc.date,
        time:        inc.time ?? null,
        title:       `Incident — ${inc.type.replace(/_/g, " ")}`,
        summary:     inc.description?.slice(0, 200) ?? "",
        severity:    severityFromIncident(inc.severity),
        category:    "incident",
        staff_id:    inc.reported_by ?? null,
        links:       [{ label: "Incidents", href: `/incidents` }],
      });
    }
  }

  // ── Missing Episodes ──────────────────────────────────────────────────────
  if (!types.length || types.includes("missing_episode")) {
    const missing = db.missingEpisodes.findByChild(childId);
    for (const ep of missing) {
      items.push({
        id:          `me:${ep.id}`,
        source_type: "missing_episode",
        source_id:   ep.id,
        date:        ep.date_missing,
        time:        ep.time_missing ?? null,
        title:       `Missing from care${ep.date_returned ? " (returned)" : " — ACTIVE"}`,
        summary:     `Risk level: ${ep.risk_level}. ${ep.return_interview_completed ? "Return interview completed." : "Return interview pending."} Duration: ${ep.duration_hours != null ? `${ep.duration_hours}h` : "ongoing"}`,
        severity:    ep.risk_level === "critical" || ep.risk_level === "high" ? "critical" : "significant",
        category:    "missing",
        staff_id:    null,
        links:       [{ label: "Missing from Care", href: `/missing-from-care` }],
      });
    }
  }

  // ── Behaviour Log ─────────────────────────────────────────────────────────
  if (!types.length || types.includes("behaviour_log")) {
    const bhvr = db.behaviourLog.findByChild(childId);
    for (const b of bhvr) {
      items.push({
        id:          `bh:${b.id}`,
        source_type: "behaviour_log",
        source_id:   b.id,
        date:        b.date,
        time:        b.time ?? null,
        title:       b.title || `Behaviour — ${b.direction}`,
        summary:     `Antecedent: ${b.antecedent?.slice(0, 100) ?? "—"} · Outcome: ${b.outcome?.slice(0, 100) ?? "—"}`,
        severity:    severityFromBehaviour(b.direction),
        category:    "behaviour",
        staff_id:    b.recorded_by ?? null,
        links:       [{ label: "Behaviour Log", href: `/behaviour-log` }],
      });
    }
  }

  // ── Key Working Sessions ──────────────────────────────────────────────────
  if (!types.length || types.includes("key_working")) {
    const sessions = db.keyWorkingSessions.findByChild(childId);
    for (const s of sessions) {
      items.push({
        id:          `kw:${s.id}`,
        source_type: "key_working",
        source_id:   s.id,
        date:        s.date,
        time:        null,
        title:       `Key work session — ${s.type.replace(/_/g, " ")}`,
        summary:     `Topics: ${(s.topics ?? []).join(", ") || "general"}. ${s.child_voice?.slice(0, 100) ?? ""}`,
        severity:    "routine",
        category:    "keywork",
        staff_id:    s.staff_id ?? null,
        links:       [{ label: "Key Working", href: `/child-keyworker-1to1-sessions` }],
      });
    }
  }

  // ── Daily Log (significant entries only) ──────────────────────────────────
  if (!types.length || types.includes("daily_log")) {
    const logs = db.dailyLog.findByChild(childId).filter((l) => l.is_significant);
    for (const l of logs) {
      items.push({
        id:          `dl:${l.id}`,
        source_type: "daily_log",
        source_id:   l.id,
        date:        l.date,
        time:        l.time ?? null,
        title:       `Daily log — ${l.entry_type}`,
        summary:     l.content?.slice(0, 200) ?? "",
        severity:    "significant",
        category:    l.entry_type,
        staff_id:    l.staff_id ?? null,
        links:       [{ label: "Daily Log", href: `/daily-log` }],
      });
    }
  }

  // ── Risk Assessments ──────────────────────────────────────────────────────
  if (!types.length || types.includes("risk_assessment")) {
    const risks = db.riskAssessments.findByChild(childId);
    for (const r of risks) {
      items.push({
        id:          `ra:${r.id}`,
        source_type: "risk_assessment",
        source_id:   r.id,
        date:        r.assessed_date,
        time:        null,
        title:       `Risk assessment — ${r.domain?.replace(/_/g, " ") ?? "general"}`,
        summary:     `Level: ${r.current_level}. ${r.contingency_plan?.slice(0, 100) ?? ""}`,
        severity:    r.current_level === "high" || r.current_level === "very_high" ? "significant" : "routine",
        category:    "risk",
        staff_id:    null,
        links:       [{ label: "Risk Assessments", href: `/risk-assessments` }],
      });
    }
  }

  // ── Chronology entries (manually recorded) ───────────────────────────────
  if (!types.length || types.includes("chronology_entry")) {
    const entries = db.chronology.findByChild(childId);
    for (const e of entries) {
      items.push({
        id:          `chr:${e.id}`,
        source_type: "chronology_entry",
        source_id:   e.id,
        date:        e.date,
        time:        e.time ?? null,
        title:       e.title,
        summary:     e.description?.slice(0, 200) ?? "",
        severity:    e.significance === "critical" ? "critical" : e.significance === "significant" ? "significant" : "routine",
        category:    e.category,
        staff_id:    e.recorded_by ?? null,
        links:       [],
      });
    }
  }

  // ── Filter by date range ──────────────────────────────────────────────────
  let filtered = items;
  if (from) filtered = filtered.filter((i) => i.date >= from);
  if (to)   filtered = filtered.filter((i) => i.date <= to);

  // ── Sort chronologically desc ─────────────────────────────────────────────
  filtered.sort((a, b) => {
    const dateComp = b.date.localeCompare(a.date);
    if (dateComp !== 0) return dateComp;
    return (b.time ?? "").localeCompare(a.time ?? "");
  });

  const total = filtered.length;
  const paged = filtered.slice(0, limit);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total,
    critical:    filtered.filter((i) => i.severity === "critical").length,
    significant: filtered.filter((i) => i.severity === "significant").length,
    incidents:   filtered.filter((i) => i.source_type === "incident").length,
    missing:     filtered.filter((i) => i.source_type === "missing_episode").length,
    keywork:     filtered.filter((i) => i.source_type === "key_working").length,
    behaviour:   filtered.filter((i) => i.source_type === "behaviour_log").length,
  };

  return NextResponse.json({ data: paged, stats, total });
}

export const GET = withShiftAccess("child_record", "view", getChronology);
