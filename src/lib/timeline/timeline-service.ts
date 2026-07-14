// ══════════════════════════════════════════════════════════════════════════════
// CARA — UNIVERSAL TIMELINE SERVICE
//
// Aggregates events from every store collection into a unified TimelineEvent
// stream. Uses the in-memory store pattern (reads from getStore()).
//
// TO CONNECT SUPABASE: replace getStore() reads with Supabase queries.
// The public API signatures stay identical.
// ══════════════════════════════════════════════════════════════════════════════

import { getStore } from "@/lib/db/store";
import { generateId } from "@/lib/utils";

/** Defensive dynamic read over drift-prone record shapes — the timeline
 *  aggregates 12+ collections whose fields vary; same object, typed for
 *  key access (identical runtime to the previous inline casts). */
function dyn(r: object): Record<string, unknown> {
  return r as unknown as Record<string, unknown>;
}

import type {
  TimelineEvent,
  TimelineEventType,
  TimelineFilter,
  TimelineRiskLevel,
  TimelineVisibility,
} from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function staffName(staffId: string): string {
  const store = getStore();
  const s = store.staff.find((st) => st.id === staffId);
  return s ? s.full_name : staffId;
}

function severityToRisk(severity: string): TimelineRiskLevel {
  switch (severity) {
    case "critical": return "critical";
    case "major": return "high";
    case "moderate": return "medium";
    case "minor": return "low";
    default: return "none";
  }
}

// ── Aggregation: map store collections to TimelineEvent[] ────────────────────

function aggregateDailyLogs(): TimelineEvent[] {
  const store = getStore();
  return (store.dailyLog ?? []).map((log) => ({
    id: `tl_log_${log.id}`,
    event_type: "daily_log_created" as TimelineEventType,
    child_id: log.child_id,
    staff_id: log.staff_id,
    home_id: log.home_id ?? "home_oak",
    title: `Daily log: ${log.entry_type}`,
    summary: log.content.length > 120 ? log.content.slice(0, 117) + "..." : log.content,
    linked_record_type: "daily_log",
    linked_record_id: log.id,
    tags: [log.entry_type, ...(log.is_significant ? ["significant"] : [])],
    risk_level: "none" as TimelineRiskLevel,
    visibility_level: "standard" as TimelineVisibility,
    metadata: { mood_score: log.mood_score, entry_type: log.entry_type },
    created_at: log.created_at ?? `${log.date}T${log.time || "00:00"}:00Z`,
    created_by: log.staff_id,
  }));
}

function aggregateIncidents(): TimelineEvent[] {
  const store = getStore();
  return (store.incidents ?? []).map((inc) => ({
    id: `tl_inc_${inc.id}`,
    event_type: (inc.status === "closed" ? "incident_closed" : "incident_submitted") as TimelineEventType,
    child_id: inc.child_id,
    staff_id: inc.reported_by,
    home_id: inc.home_id ?? "home_oak",
    title: `Incident: ${inc.type} (${inc.severity})`,
    summary: inc.description.length > 120 ? inc.description.slice(0, 117) + "..." : inc.description,
    linked_record_type: "incident",
    linked_record_id: inc.id,
    tags: [inc.type, inc.severity, inc.status],
    risk_level: severityToRisk(inc.severity),
    visibility_level: (inc.severity === "critical" ? "restricted" : "standard") as TimelineVisibility,
    metadata: { severity: inc.severity, status: inc.status, requires_oversight: inc.requires_oversight },
    created_at: inc.created_at ?? `${inc.date}T${inc.time || "00:00"}:00Z`,
    created_by: inc.reported_by,
  }));
}

function aggregateTasks(): TimelineEvent[] {
  const store = getStore();
  const events: TimelineEvent[] = [];

  for (const task of store.tasks ?? []) {
    // Task creation
    events.push({
      id: `tl_task_${task.id}`,
      event_type: (task.status === "completed" ? "task_completed" : "task_created") as TimelineEventType,
      child_id: task.linked_child_id ?? undefined,
      staff_id: task.assigned_to ?? undefined,
      home_id: task.home_id ?? "home_oak",
      title: task.title,
      summary: task.description?.slice(0, 120) ?? task.title,
      linked_record_type: "task",
      linked_record_id: task.id,
      tags: [task.category, task.priority, task.status],
      risk_level: (task.priority === "urgent" ? "high" : task.priority === "high" ? "medium" : "none") as TimelineRiskLevel,
      visibility_level: "standard" as TimelineVisibility,
      metadata: { priority: task.priority, status: task.status, category: task.category },
      created_at: task.status === "completed" && task.completed_at ? task.completed_at : task.created_at,
      created_by: task.created_by ?? task.assigned_to ?? "system",
    });
  }

  return events;
}

function aggregateCareEvents(): TimelineEvent[] {
  const store = getStore();
  return (store.careEvents ?? []).map((ce) => ({
    id: `tl_ce_${ce.id}`,
    event_type: "daily_log_created" as TimelineEventType,
    child_id: ce.child_id ?? undefined,
    staff_id: ce.staff_id,
    home_id: ce.home_id ?? "home_oak",
    title: ce.title,
    summary: ce.content.length > 120 ? ce.content.slice(0, 117) + "..." : ce.content,
    linked_record_type: "care_event",
    linked_record_id: ce.id,
    tags: [ce.category, ce.status, ...(ce.is_safeguarding ? ["safeguarding"] : []), ...(ce.is_significant ? ["significant"] : [])],
    risk_level: (ce.is_safeguarding ? "high" : ce.is_significant ? "medium" : "none") as TimelineRiskLevel,
    visibility_level: (ce.is_safeguarding ? "safeguarding" : "standard") as TimelineVisibility,
    metadata: { category: ce.category, mood_score: ce.mood_score, status: ce.status },
    created_at: ce.submitted_at ?? ce.created_at ?? `${ce.event_date}T${ce.event_time || "00:00"}:00Z`,
    created_by: ce.staff_id,
  }));
}

function aggregateMedications(): TimelineEvent[] {
  const store = getStore();
  return (store.medicationAdministrations ?? []).map((med) => {
    const medicationName =
      store.medications.find((m) => m.id === med.medication_id)?.name ?? "medication";
    return {
      id: `tl_med_${med.id}`,
      event_type: "medication_administered" as TimelineEventType,
      child_id: med.child_id,
      staff_id: med.administered_by ?? undefined,
      home_id: med.home_id ?? "home_oak",
      title: `Medication administered: ${medicationName}`,
      summary: `${medicationName} administered${med.actual_time ? ` at ${med.actual_time}` : ""}`,
      linked_record_type: "medication_administration",
      linked_record_id: med.id,
      tags: ["medication"],
      risk_level: "none" as TimelineRiskLevel,
      visibility_level: "standard" as TimelineVisibility,
      metadata: { medication_name: medicationName, status: med.status },
      created_at: med.actual_time ?? med.scheduled_time ?? med.created_at ?? new Date().toISOString(),
      created_by: med.administered_by ?? "system",
    };
  });
}

function aggregateMedicationErrors(): TimelineEvent[] {
  const store = getStore();
  return (store.medicationErrors ?? []).map((err) => ({
    id: `tl_mederr_${err.id}`,
    event_type: "medication_error_reported" as TimelineEventType,
    child_id: dyn(err).child_id as string | undefined,
    staff_id: dyn(err).reported_by as string | undefined,
    home_id: "home_oak",
    title: "Medication error reported",
    summary: (dyn(err).description as string ?? "Medication error recorded").slice(0, 120),
    linked_record_type: "medication_error",
    linked_record_id: err.id,
    tags: ["medication", "error", "safety"],
    risk_level: "high" as TimelineRiskLevel,
    visibility_level: "sensitive" as TimelineVisibility,
    metadata: {},
    created_at: dyn(err).created_at as string ?? new Date().toISOString(),
    created_by: dyn(err).reported_by as string ?? "system",
  }));
}

function aggregateMissingEpisodes(): TimelineEvent[] {
  const store = getStore();
  return (store.missingEpisodes ?? []).map((ep) => {
    const hasReturned = Boolean(ep.date_returned);
    return {
      id: `tl_miss_${ep.id}`,
      event_type: (hasReturned ? "missing_from_care_returned" : "missing_from_care_reported") as TimelineEventType,
      child_id: ep.child_id,
      staff_id: ep.created_by,
      home_id: ep.home_id ?? "home_oak",
      title: hasReturned ? "Returned from missing episode" : "Missing from care reported",
      summary: `${hasReturned ? "Returned" : "Reported missing"} — ${ep.risk_level ?? "unknown"} risk`,
      linked_record_type: "missing_episode",
      linked_record_id: ep.id,
      tags: ["missing", "safeguarding", ep.risk_level ?? "unknown"],
      risk_level: (ep.risk_level === "high" || ep.risk_level === "critical" ? "critical" : ep.risk_level === "medium" ? "high" : "medium") as TimelineRiskLevel,
      visibility_level: "safeguarding" as TimelineVisibility,
      metadata: { risk_level: ep.risk_level },
      created_at: ep.created_at ?? new Date().toISOString(),
      created_by: ep.created_by ?? "system",
    };
  });
}

function aggregateRestraints(): TimelineEvent[] {
  const store = getStore();
  return (store.restraints ?? []).map((r) => ({
    id: `tl_rest_${r.id}`,
    event_type: "restraint_recorded" as TimelineEventType,
    child_id: dyn(r).child_id as string | undefined,
    staff_id: dyn(r).staff_id as string | undefined,
    home_id: "home_oak",
    title: "Physical intervention recorded",
    summary: (dyn(r).description as string ?? "Physical intervention recorded").slice(0, 120),
    linked_record_type: "restraint",
    linked_record_id: r.id,
    tags: ["restraint", "safety", "physical_intervention"],
    risk_level: "high" as TimelineRiskLevel,
    visibility_level: "sensitive" as TimelineVisibility,
    metadata: {},
    created_at: dyn(r).created_at as string ?? new Date().toISOString(),
    created_by: dyn(r).staff_id as string ?? "system",
  }));
}

function aggregateBodyMaps(): TimelineEvent[] {
  const store = getStore();
  return (store.bodyMap ?? []).map((bm) => ({
    id: `tl_bmap_${bm.id}`,
    event_type: "body_map_completed" as TimelineEventType,
    child_id: dyn(bm).child_id as string | undefined,
    staff_id: dyn(bm).completed_by as string | undefined,
    home_id: "home_oak",
    title: "Body map completed",
    summary: (dyn(bm).notes as string ?? "Body map assessment completed").slice(0, 120),
    linked_record_type: "body_map",
    linked_record_id: bm.id,
    tags: ["body_map", "safeguarding"],
    risk_level: "medium" as TimelineRiskLevel,
    visibility_level: "sensitive" as TimelineVisibility,
    metadata: {},
    created_at: dyn(bm).created_at as string ?? new Date().toISOString(),
    created_by: dyn(bm).completed_by as string ?? "system",
  }));
}

function aggregateWelfareChecks(): TimelineEvent[] {
  const store = getStore();
  return (store.welfareChecks ?? []).map((wc) => ({
    id: `tl_welf_${wc.id}`,
    event_type: "welfare_check_completed" as TimelineEventType,
    child_id: wc.child_id,
    staff_id: wc.staff_id,
    home_id: "home_oak",
    title: "Welfare check completed",
    summary: `Welfare check — ${wc.status ?? "completed"}`,
    linked_record_type: "welfare_check",
    linked_record_id: wc.id,
    tags: ["welfare", "check"],
    risk_level: "none" as TimelineRiskLevel,
    visibility_level: "standard" as TimelineVisibility,
    metadata: { status: wc.status },
    created_at: wc.created_at ?? new Date().toISOString(),
    created_by: wc.staff_id ?? "system",
  }));
}

function aggregateKeyWorkingSessions(): TimelineEvent[] {
  const store = getStore();
  return (store.keyWorkingSessions ?? []).map((kw) => ({
    id: `tl_kw_${kw.id}`,
    event_type: "key_work_session_completed" as TimelineEventType,
    child_id: kw.child_id,
    staff_id: kw.staff_id,
    home_id: "home_oak",
    title: `Key work session: ${dyn(kw).topic ?? "session"}`,
    summary: (dyn(kw).notes as string ?? "Key working session completed").slice(0, 120),
    linked_record_type: "key_working_session",
    linked_record_id: kw.id,
    tags: ["key_working"],
    risk_level: "none" as TimelineRiskLevel,
    visibility_level: "standard" as TimelineVisibility,
    metadata: {},
    created_at: kw.created_at ?? new Date().toISOString(),
    created_by: kw.staff_id ?? "system",
  }));
}

function aggregateRiskAssessments(): TimelineEvent[] {
  const store = getStore();
  return (store.riskAssessments ?? []).map((ra) => ({
    id: `tl_risk_${ra.id}`,
    event_type: "risk_assessment_created" as TimelineEventType,
    child_id: ra.child_id,
    staff_id: dyn(ra).assessed_by as string | undefined,
    home_id: "home_oak",
    title: `Risk assessment: ${dyn(ra).title ?? "assessment"}`,
    summary: (dyn(ra).summary as string ?? "Risk assessment completed").slice(0, 120),
    linked_record_type: "risk_assessment",
    linked_record_id: ra.id,
    tags: ["risk_assessment", dyn(ra).risk_level as string ?? "unknown"],
    risk_level: (dyn(ra).risk_level as TimelineRiskLevel) ?? "medium",
    visibility_level: "sensitive" as TimelineVisibility,
    metadata: { risk_level: dyn(ra).risk_level },
    created_at: ra.created_at ?? new Date().toISOString(),
    created_by: dyn(ra).assessed_by as string ?? "system",
  }));
}

function aggregateVisitors(): TimelineEvent[] {
  const store = getStore();
  return (store.visitors ?? []).map((v) => ({
    id: `tl_vis_${v.id}`,
    event_type: "visitor_logged" as TimelineEventType,
    home_id: "home_oak",
    title: `Visitor: ${dyn(v).name ?? "visitor"}`,
    summary: `${dyn(v).name ?? "Visitor"} — ${dyn(v).purpose ?? "visit"}`,
    linked_record_type: "visitor",
    linked_record_id: v.id,
    tags: ["visitor"],
    risk_level: "none" as TimelineRiskLevel,
    visibility_level: "standard" as TimelineVisibility,
    metadata: {},
    created_at: dyn(v).created_at as string ?? new Date().toISOString(),
    created_by: dyn(v).logged_by as string ?? "system",
  }));
}

function aggregateFireDrills(): TimelineEvent[] {
  const store = getStore();
  return (store.fireDrills ?? []).map((fd) => ({
    id: `tl_fire_${fd.id}`,
    event_type: "fire_drill_completed" as TimelineEventType,
    home_id: "home_oak",
    title: "Fire drill completed",
    summary: `Fire drill — evacuation time: ${dyn(fd).evacuation_time ?? "not recorded"}`,
    linked_record_type: "fire_drill",
    linked_record_id: fd.id,
    tags: ["fire_drill", "safety", "compliance"],
    risk_level: "none" as TimelineRiskLevel,
    visibility_level: "standard" as TimelineVisibility,
    metadata: {},
    created_at: dyn(fd).created_at as string ?? new Date().toISOString(),
    created_by: dyn(fd).conducted_by as string ?? "system",
  }));
}

function aggregateSignificantEvents(): TimelineEvent[] {
  const store = getStore();
  return (store.significantEvents ?? []).map((se) => ({
    id: `tl_sig_${se.id}`,
    event_type: "custom_event" as TimelineEventType,
    child_id: dyn(se).child_id as string | undefined,
    staff_id: dyn(se).staff_id as string | undefined,
    home_id: "home_oak",
    title: dyn(se).title as string ?? "Significant event",
    summary: (dyn(se).description as string ?? "Significant event recorded").slice(0, 120),
    linked_record_type: "significant_event",
    linked_record_id: se.id,
    tags: ["significant_event"],
    risk_level: "medium" as TimelineRiskLevel,
    visibility_level: "standard" as TimelineVisibility,
    metadata: {},
    created_at: dyn(se).created_at as string ?? new Date().toISOString(),
    created_by: dyn(se).staff_id as string ?? "system",
  }));
}

function aggregateSupervisions(): TimelineEvent[] {
  const store = getStore();
  return (store.supervisions ?? []).map((sup) => ({
    id: `tl_sup_${sup.id}`,
    event_type: "staff_supervision_completed" as TimelineEventType,
    staff_id: sup.staff_id,
    home_id: "home_oak",
    title: `Supervision: ${staffName(sup.staff_id)}`,
    summary: `Supervision session completed`,
    linked_record_type: "supervision",
    linked_record_id: sup.id,
    tags: ["supervision", "staff_development"],
    risk_level: "none" as TimelineRiskLevel,
    visibility_level: "standard" as TimelineVisibility,
    metadata: {},
    created_at: sup.created_at ?? new Date().toISOString(),
    created_by: dyn(sup).supervisor_id as string ?? "system",
  }));
}

function aggregateTrainingRecords(): TimelineEvent[] {
  const store = getStore();
  return (store.trainingRecords ?? []).filter((tr) => tr.completed_date != null).map((tr) => ({
    id: `tl_train_${tr.id}`,
    event_type: "staff_training_completed" as TimelineEventType,
    staff_id: tr.staff_id,
    home_id: "home_oak",
    title: `Training completed: ${tr.course_name}`,
    summary: `${staffName(tr.staff_id)} completed ${tr.course_name}`,
    linked_record_type: "training",
    linked_record_id: tr.id,
    tags: ["training", "staff_development", tr.category ?? "general"],
    risk_level: "none" as TimelineRiskLevel,
    visibility_level: "standard" as TimelineVisibility,
    metadata: { course_name: tr.course_name, category: tr.category },
    created_at: tr.completed_date ?? tr.created_at ?? new Date().toISOString(),
    created_by: tr.staff_id,
  }));
}

function aggregateCompliments(): TimelineEvent[] {
  const store = getStore();
  return (store.compliments ?? []).map((c) => ({
    id: `tl_comp_${c.id}`,
    event_type: "achievement_recorded" as TimelineEventType,
    child_id: dyn(c).child_id as string | undefined,
    staff_id: dyn(c).staff_id as string | undefined,
    home_id: "home_oak",
    title: "Compliment recorded",
    summary: (dyn(c).content as string ?? "Compliment received").slice(0, 120),
    linked_record_type: "compliment",
    linked_record_id: c.id,
    tags: ["compliment", "positive"],
    risk_level: "none" as TimelineRiskLevel,
    visibility_level: "standard" as TimelineVisibility,
    metadata: {},
    created_at: dyn(c).created_at as string ?? new Date().toISOString(),
    created_by: dyn(c).created_by as string ?? "system",
  }));
}

function aggregateEducationRecords(): TimelineEvent[] {
  const store = getStore();
  return (store.educationRecords ?? []).map((ed) => ({
    id: `tl_edu_${ed.id}`,
    event_type: "education_update_recorded" as TimelineEventType,
    child_id: ed.child_id,
    home_id: "home_oak",
    title: `Education update: ${dyn(ed).title ?? "record"}`,
    summary: (dyn(ed).notes as string ?? "Education record updated").slice(0, 120),
    linked_record_type: "education",
    linked_record_id: ed.id,
    tags: ["education"],
    risk_level: "none" as TimelineRiskLevel,
    visibility_level: "standard" as TimelineVisibility,
    metadata: {},
    created_at: ed.created_at ?? new Date().toISOString(),
    created_by: dyn(ed).created_by as string ?? "system",
  }));
}

// ── Core aggregation ─────────────────────────────────────────────────────────

function aggregateAllEvents(): TimelineEvent[] {
  return [
    ...aggregateDailyLogs(),
    ...aggregateIncidents(),
    ...aggregateTasks(),
    ...aggregateCareEvents(),
    ...aggregateMedications(),
    ...aggregateMedicationErrors(),
    ...aggregateMissingEpisodes(),
    ...aggregateRestraints(),
    ...aggregateBodyMaps(),
    ...aggregateWelfareChecks(),
    ...aggregateKeyWorkingSessions(),
    ...aggregateRiskAssessments(),
    ...aggregateVisitors(),
    ...aggregateFireDrills(),
    ...aggregateSignificantEvents(),
    ...aggregateSupervisions(),
    ...aggregateTrainingRecords(),
    ...aggregateCompliments(),
    ...aggregateEducationRecords(),
  ];
}

// ── Filtering ────────────────────────────────────────────────────────────────

function applyFilter(events: TimelineEvent[], filter?: TimelineFilter): TimelineEvent[] {
  if (!filter) return events;

  let result = events;

  if (filter.child_id) {
    result = result.filter((e) => e.child_id === filter.child_id);
  }
  if (filter.staff_id) {
    result = result.filter((e) => e.staff_id === filter.staff_id);
  }
  if (filter.home_id) {
    result = result.filter((e) => e.home_id === filter.home_id);
  }
  if (filter.event_types && filter.event_types.length > 0) {
    const types = new Set(filter.event_types);
    result = result.filter((e) => types.has(e.event_type));
  }
  if (filter.risk_levels && filter.risk_levels.length > 0) {
    const levels = new Set(filter.risk_levels);
    result = result.filter((e) => levels.has(e.risk_level));
  }
  if (filter.date_from) {
    result = result.filter((e) => e.created_at >= filter.date_from!);
  }
  if (filter.date_to) {
    const toDate = filter.date_to.length === 10 ? filter.date_to + "T23:59:59Z" : filter.date_to;
    result = result.filter((e) => e.created_at <= toDate);
  }
  if (filter.search) {
    const q = filter.search.toLowerCase();
    result = result.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return result;
}

function sortByDate(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function paginate(events: TimelineEvent[], limit?: number, offset?: number): TimelineEvent[] {
  const start = offset ?? 0;
  const end = limit ? start + limit : events.length;
  return events.slice(start, end);
}

// ── In-memory recorded events (for recordEvent) ─────────────────────────────

const recordedEvents: TimelineEvent[] = [];

// ── Public API ───────────────────────────────────────────────────────────────

export function recordEvent(
  event: Omit<TimelineEvent, "id" | "created_at">
): TimelineEvent {
  const full: TimelineEvent = {
    ...event,
    id: generateId("tl"),
    created_at: new Date().toISOString(),
  };
  recordedEvents.push(full);
  return full;
}

export function getChildTimeline(
  childId: string,
  filter?: TimelineFilter
): TimelineEvent[] {
  const allEvents = [...aggregateAllEvents(), ...recordedEvents];
  const childFilter: TimelineFilter = { ...filter, child_id: childId };
  return paginate(
    sortByDate(applyFilter(allEvents, childFilter)),
    childFilter.limit,
    childFilter.offset
  );
}

export function getStaffTimeline(
  staffId: string,
  filter?: TimelineFilter
): TimelineEvent[] {
  const allEvents = [...aggregateAllEvents(), ...recordedEvents];
  const staffFilter: TimelineFilter = { ...filter, staff_id: staffId };
  return paginate(
    sortByDate(applyFilter(allEvents, staffFilter)),
    staffFilter.limit,
    staffFilter.offset
  );
}

export function getHomeTimeline(
  homeId: string,
  filter?: TimelineFilter
): TimelineEvent[] {
  const allEvents = [...aggregateAllEvents(), ...recordedEvents];
  const homeFilter: TimelineFilter = { ...filter, home_id: homeId };
  return paginate(
    sortByDate(applyFilter(allEvents, homeFilter)),
    homeFilter.limit,
    homeFilter.offset
  );
}

export function searchTimeline(
  query: string,
  filter?: TimelineFilter
): TimelineEvent[] {
  const allEvents = [...aggregateAllEvents(), ...recordedEvents];
  const searchFilter: TimelineFilter = { ...filter, search: query };
  return paginate(
    sortByDate(applyFilter(allEvents, searchFilter)),
    searchFilter.limit,
    searchFilter.offset
  );
}

export function getRecentEvents(limit: number = 50): TimelineEvent[] {
  const allEvents = [...aggregateAllEvents(), ...recordedEvents];
  return sortByDate(allEvents).slice(0, limit);
}

export function getFilteredTimeline(filter: TimelineFilter): {
  data: TimelineEvent[];
  total: number;
} {
  const allEvents = [...aggregateAllEvents(), ...recordedEvents];
  const filtered = sortByDate(applyFilter(allEvents, filter));
  const total = filtered.length;
  const data = paginate(filtered, filter.limit, filter.offset);
  return { data, total };
}
