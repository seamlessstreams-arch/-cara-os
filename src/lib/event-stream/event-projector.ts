// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EVENT PROJECTOR (canonical event stream)
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
//
// Projects the home's many domain collections (incidents, daily logs, missing
// episodes, medication errors, restraints, key-working, education, supervision)
// into a single normalised CornerstoneEvent stream. Each projection derives a
// consistent risk level, approval routing, structured tags, cross-links and a
// rule-based ARIA analysis — so one timeline and one set of intelligence can
// reason across everything. "Capture once, surface everywhere."
//
// The projector is extensible: adding a new source mapper is all that's needed
// to bring a new event type (health, staff_absence, overtime, maintenance,
// qa_check, reg44/45) into the same stream.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CornerstoneEvent,
  CornerstoneEventType,
  CornerstoneRiskLevel,
  CornerstoneApprovalLevel,
  CornerstoneAriaAnalysis,
} from "@/types/cornerstone-event";

// ── Source input types (mapped from the store by the route) ───────────────────

export interface DailyLogSource {
  id: string; child_id: string; staff_id: string; date: string; time?: string;
  entry_type: string; content: string; is_significant?: boolean; linked_incident_id?: string | null;
  home_id?: string; created_at?: string; updated_at?: string; created_by?: string;
}
export interface IncidentSource {
  id: string; child_id: string; reference?: string; type: string; severity: string;
  date: string; time?: string; description?: string; status?: string;
  requires_oversight?: boolean; body_map_required?: boolean; body_map_completed?: boolean;
  outcome?: string | null; reported_by?: string; linked_task_ids?: string[]; linked_document_ids?: string[];
  home_id?: string; created_at?: string; updated_at?: string;
}
export interface MissingSource {
  id: string; child_id: string; reference?: string; date_missing: string; time_missing?: string;
  date_returned?: string | null; risk_level: string; reported_to_police?: boolean; reported_to_la?: boolean;
  return_interview_completed?: boolean; linked_incident_id?: string | null; status?: string;
  home_id?: string; created_at?: string; created_by?: string;
}
export interface RestraintSource {
  id: string; child_id: string; date: string; start_time?: string; restraint_type?: string;
  injuries_count?: number; child_debriefed?: boolean; staff_debriefed?: boolean;
  linked_incident_id?: string | null; recorded_by?: string; created_at?: string;
}
export interface MedErrorSource {
  id: string; child_id: string; date_occurred: string; time_occurred?: string; error_type: string;
  severity: string; medication?: string; duty_of_candour?: boolean; duty_of_candour_completed?: string | null;
  status?: string; reported_by?: string; created_at?: string;
}
export interface KeyworkSource {
  id: string; child_id: string; staff_id: string; date: string; type?: string;
  mood_before?: number; mood_after?: number; home_id?: string; created_at?: string;
}
export interface EducationSource {
  id: string; child_id: string; staff_id?: string; date: string; record_type?: string;
  attendance_status?: string | null; title?: string; status?: string; home_id?: string; created_at?: string;
}
export interface SupervisionSource {
  id: string; staff_id: string; supervisor_id?: string; type?: string; scheduled_date?: string;
  actual_date?: string | null; status?: string; home_id?: string; created_at?: string; updated_at?: string;
}

export interface EventProjectorInput {
  dailyLogs?: DailyLogSource[];
  incidents?: IncidentSource[];
  missingEpisodes?: MissingSource[];
  restraints?: RestraintSource[];
  medicationErrors?: MedErrorSource[];
  keyworkSessions?: KeyworkSource[];
  educationRecords?: EducationSource[];
  supervisions?: SupervisionSource[];
  homeId?: string;
}

export interface EventStreamOverview {
  total: number;
  by_type: Record<string, number>;
  by_risk: Record<CornerstoneRiskLevel, number>;
  pending_approvals: number;
  high_or_critical: number;
  compliance_flags: number;
  latest_occurred_at: string | null;
}

export interface EventStreamResult {
  events: CornerstoneEvent[];
  overview: EventStreamOverview;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const DEFAULT_HOME = "home_oak";

function toIso(date: string | undefined, time?: string | null): string {
  const d = (date ?? "").slice(0, 10) || "1970-01-01";
  const t = (time ?? "00:00").toString().slice(0, 5);
  const tt = /^\d{2}:\d{2}$/.test(t) ? t : "00:00";
  return `${d}T${tt}:00.000Z`;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

const LEVEL_ORDER: Record<CornerstoneApprovalLevel, number> = {
  team_leader: 1, deputy: 2, manager: 3, ri: 4,
};
function bumpAtLeast(
  current: CornerstoneApprovalLevel | null,
  min: CornerstoneApprovalLevel,
): CornerstoneApprovalLevel {
  if (!current) return min;
  return LEVEL_ORDER[current] >= LEVEL_ORDER[min] ? current : min;
}

const LEVEL_BY_RISK: Record<CornerstoneRiskLevel, CornerstoneApprovalLevel | null> = {
  low: null, medium: "team_leader", high: "deputy", critical: "manager",
};

/** Deterministic approval routing from event type + risk. */
export function deriveApproval(
  eventType: CornerstoneEventType,
  risk: CornerstoneRiskLevel,
): { requiresApproval: boolean; approvalLevel?: CornerstoneApprovalLevel } {
  let level = LEVEL_BY_RISK[risk];
  if (eventType === "safeguarding") level = risk === "critical" ? "ri" : "manager";
  if (eventType === "physical_intervention") level = bumpAtLeast(level, "manager");
  if (eventType === "missing") level = bumpAtLeast(level, "deputy");
  if (eventType === "medication" && (risk === "high" || risk === "critical")) level = bumpAtLeast(level, "manager");
  if (eventType === "reg44" || eventType === "reg45") level = bumpAtLeast(level, "ri");
  return level ? { requiresApproval: true, approvalLevel: level } : { requiresApproval: false };
}

const THEMES: Partial<Record<CornerstoneEventType, string[]>> = {
  incident: ["incident management", "child safety"],
  safeguarding: ["safeguarding", "child protection"],
  missing: ["missing from care", "child safety", "contextual safeguarding"],
  physical_intervention: ["behaviour management", "restraint reduction"],
  medication: ["medicines safety", "learning from mistakes"],
  daily_log: ["day-to-day care", "child voice"],
  keywork: ["positive relationships", "child voice"],
  education: ["education & achievement"],
  supervision: ["staff support & development"],
};
const ACTIONS: Partial<Record<CornerstoneEventType, string[]>> = {
  safeguarding: ["Consider a strategy discussion with partner agencies", "Check whether an Ofsted notification (Reg 40) is required"],
  missing: ["Ensure a return home interview is completed within 72 hours", "Review the missing-from-care risk assessment"],
  physical_intervention: ["Complete the post-incident debrief with the child and staff", "Review the behaviour support plan"],
  medication: ["Complete the duty of candour where required", "Review the medicines system for a root cause"],
  incident: ["Record the outcome and lessons learned", "Check whether linked tasks are complete"],
  education: ["Update the PEP and engage the Virtual School where needed"],
};

function buildAria(
  eventType: CornerstoneEventType,
  complianceFlags: string[],
  missingInformation: string[],
  risk: CornerstoneRiskLevel,
): CornerstoneAriaAnalysis {
  const suggestedActions = [...(ACTIONS[eventType] ?? [])];
  if ((risk === "high" || risk === "critical") && !suggestedActions.some((a) => /registered manager|strategy/i.test(a))) {
    suggestedActions.push("Escalate to the registered manager");
  }
  const confidenceScore = clamp(1 - 0.12 * missingInformation.length - 0.05 * complianceFlags.length, 0.4, 1);
  return {
    themes: THEMES[eventType] ?? [eventType],
    suggestedActions,
    complianceFlags,
    missingInformation,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
  };
}

function base(
  home: string | undefined,
  occurredAt: string,
  created_at?: string,
  updated_at?: string,
): { homeId: string; audit: CornerstoneEvent["audit"] } {
  // Deterministic: fall back to the event's occurredAt, never to the wall clock.
  const createdAt = created_at ?? occurredAt;
  return {
    homeId: home || DEFAULT_HOME,
    audit: { createdAt, updatedAt: updated_at ?? createdAt, version: 1, changeHistory: [] },
  };
}

// ── Per-source mappers ────────────────────────────────────────────────────────

const INCIDENT_RISK: Record<string, CornerstoneRiskLevel> = { low: "low", medium: "medium", high: "high", critical: "critical" };
const MED_RISK: Record<string, CornerstoneRiskLevel> = { no_harm: "low", low: "low", moderate: "medium", severe: "high", death: "critical" };

function projectIncident(r: IncidentSource, homeId?: string): CornerstoneEvent {
  const isSafeguarding = /safeguard/i.test(r.type);
  const eventType: CornerstoneEventType = isSafeguarding ? "safeguarding" : "incident";
  let risk = INCIDENT_RISK[r.severity] ?? "medium";
  if (isSafeguarding && (risk === "low" || risk === "medium")) risk = "high";

  const tags = [eventType, r.type, r.severity].filter(Boolean);
  if (r.requires_oversight) tags.push("oversight_required");
  if (r.body_map_required && !r.body_map_completed) tags.push("body_map_outstanding");

  const compliance: string[] = [];
  if (isSafeguarding || risk === "critical") compliance.push("Ofsted notification (Reg 40) may be required");
  if (r.body_map_required && !r.body_map_completed) compliance.push("Body map required but not completed");
  const missing: string[] = [];
  if (!r.outcome && r.status !== "open") missing.push("outcome");

  const { requiresApproval, approvalLevel } = deriveApproval(eventType, risk);
  return {
    id: `evt_inc_${r.id}`, eventType, ...base(r.home_id ?? homeId, toIso(r.date, r.time), r.created_at, r.updated_at),
    childId: r.child_id, staffId: r.reported_by, occurredAt: toIso(r.date, r.time),
    createdBy: r.reported_by ?? "system",
    summary: `${isSafeguarding ? "Safeguarding" : "Incident"}${r.reference ? ` ${r.reference}` : ""}: ${(r.description ?? r.type).slice(0, 140)}`,
    structuredTags: tags, riskLevel: risk, requiresApproval, approvalLevel,
    linkedDocuments: r.linked_document_ids ?? [], linkedTasks: r.linked_task_ids ?? [], linkedRisks: [], linkedNotifications: [],
    ariaAnalysis: buildAria(eventType, compliance, missing, risk),
  };
}

function projectMissing(r: MissingSource, homeId?: string): CornerstoneEvent {
  const risk = (INCIDENT_RISK[r.risk_level] ?? "high") as CornerstoneRiskLevel;
  const tags = ["missing", r.risk_level].filter(Boolean);
  if (r.reported_to_police) tags.push("police_notified");
  if (!r.return_interview_completed) tags.push("rhi_outstanding");
  const compliance: string[] = [];
  if (!r.return_interview_completed) compliance.push("Return home interview outstanding (72h)");
  if (!r.reported_to_la) compliance.push("Local authority notification not recorded");
  const missing: string[] = [];
  if (!r.date_returned && r.status !== "active") missing.push("return time");
  const { requiresApproval, approvalLevel } = deriveApproval("missing", risk);
  return {
    id: `evt_mis_${r.id}`, eventType: "missing", ...base(r.home_id ?? homeId, toIso(r.date_missing, r.time_missing), r.created_at),
    childId: r.child_id, occurredAt: toIso(r.date_missing, r.time_missing), createdBy: r.created_by ?? "system",
    summary: `Missing episode${r.reference ? ` ${r.reference}` : ""} (${r.risk_level} risk)${r.date_returned ? " — returned" : " — active"}`,
    structuredTags: tags, riskLevel: risk, requiresApproval, approvalLevel,
    linkedDocuments: [], linkedTasks: [], linkedRisks: [], linkedNotifications: [],
    ariaAnalysis: buildAria("missing", compliance, missing, risk),
  };
}

function projectRestraint(r: RestraintSource, homeId?: string): CornerstoneEvent {
  const injuries = r.injuries_count ?? 0;
  const risk: CornerstoneRiskLevel = injuries > 0 ? "critical" : "high";
  const tags = ["physical_intervention", r.restraint_type].filter(Boolean) as string[];
  if (injuries > 0) tags.push("injury");
  if (!r.child_debriefed) tags.push("debrief_outstanding");
  const compliance: string[] = [];
  if (!r.child_debriefed) compliance.push("Post-incident debrief with the child outstanding");
  if (injuries > 0) compliance.push("Injury during restraint — medical & notification review");
  const { requiresApproval, approvalLevel } = deriveApproval("physical_intervention", risk);
  return {
    id: `evt_res_${r.id}`, eventType: "physical_intervention", ...base(homeId, toIso(r.date, r.start_time), r.created_at),
    childId: r.child_id, staffId: r.recorded_by, occurredAt: toIso(r.date, r.start_time), createdBy: r.recorded_by ?? "system",
    summary: `Physical intervention${r.restraint_type ? ` (${r.restraint_type})` : ""}${injuries > 0 ? " — injury recorded" : ""}`,
    structuredTags: tags, riskLevel: risk, requiresApproval, approvalLevel,
    linkedDocuments: [], linkedTasks: [], linkedRisks: [], linkedNotifications: [],
    ariaAnalysis: buildAria("physical_intervention", compliance, [], risk),
  };
}

function projectMedication(r: MedErrorSource, homeId?: string): CornerstoneEvent {
  const risk = MED_RISK[r.severity] ?? "low";
  const tags = ["medication", "medication_error", r.error_type, r.severity].filter(Boolean);
  const harm = risk === "medium" || risk === "high" || risk === "critical";
  if (harm) tags.push("harm");
  const candourGap = !!r.duty_of_candour && !r.duty_of_candour_completed;
  if (candourGap) tags.push("candour_outstanding");
  const compliance: string[] = [];
  if (candourGap) compliance.push("Duty of candour outstanding");
  if (risk === "critical") compliance.push("Serious medication harm — Reg 40 notification likely required");
  const { requiresApproval, approvalLevel } = deriveApproval("medication", risk);
  return {
    id: `evt_med_${r.id}`, eventType: "medication", ...base(homeId, toIso(r.date_occurred, r.time_occurred), r.created_at),
    childId: r.child_id, staffId: r.reported_by, occurredAt: toIso(r.date_occurred, r.time_occurred), createdBy: r.reported_by ?? "system",
    summary: `Medication error (${r.error_type.replace(/_/g, " ")}${r.medication ? `, ${r.medication}` : ""}) — ${r.severity.replace(/_/g, " ")}`,
    structuredTags: tags, riskLevel: risk, requiresApproval, approvalLevel,
    linkedDocuments: [], linkedTasks: [], linkedRisks: [], linkedNotifications: [],
    ariaAnalysis: buildAria("medication", compliance, [], risk),
  };
}

function projectDailyLog(r: DailyLogSource, homeId?: string): CornerstoneEvent {
  const significant = !!r.is_significant;
  const risk: CornerstoneRiskLevel = significant ? "medium" : "low";
  const tags = ["daily_log", r.entry_type].filter(Boolean);
  if (significant) tags.push("significant");
  const { requiresApproval, approvalLevel } = significant
    ? { requiresApproval: true, approvalLevel: "team_leader" as CornerstoneApprovalLevel }
    : { requiresApproval: false, approvalLevel: undefined };
  return {
    id: `evt_log_${r.id}`, eventType: "daily_log", ...base(r.home_id ?? homeId, toIso(r.date, r.time), r.created_at, r.updated_at),
    childId: r.child_id, staffId: r.staff_id, occurredAt: toIso(r.date, r.time), createdBy: r.created_by ?? r.staff_id ?? "system",
    summary: `${r.entry_type} log: ${(r.content ?? "").slice(0, 140)}`,
    structuredTags: tags, riskLevel: risk, requiresApproval, approvalLevel,
    linkedDocuments: [], linkedTasks: [], linkedRisks: [],
    linkedNotifications: r.linked_incident_id ? [r.linked_incident_id] : [],
    ariaAnalysis: buildAria("daily_log", [], [], risk),
  };
}

function projectKeywork(r: KeyworkSource, homeId?: string): CornerstoneEvent {
  const moodDrop = typeof r.mood_before === "number" && typeof r.mood_after === "number" && r.mood_after < r.mood_before;
  const risk: CornerstoneRiskLevel = moodDrop ? "medium" : "low";
  const tags = ["keywork", r.type].filter(Boolean) as string[];
  if (moodDrop) tags.push("mood_declined");
  return {
    id: `evt_kw_${r.id}`, eventType: "keywork", ...base(r.home_id ?? homeId, toIso(r.date), r.created_at),
    childId: r.child_id, staffId: r.staff_id, occurredAt: toIso(r.date), createdBy: r.staff_id ?? "system",
    summary: `Key-working session${r.type ? ` (${r.type.replace(/_/g, " ")})` : ""}${moodDrop ? " — mood declined" : ""}`,
    structuredTags: tags, riskLevel: risk, requiresApproval: false,
    linkedDocuments: [], linkedTasks: [], linkedRisks: [], linkedNotifications: [],
    ariaAnalysis: buildAria("keywork", [], [], risk),
  };
}

function projectEducation(r: EducationSource, homeId?: string): CornerstoneEvent {
  const status = r.attendance_status ?? "";
  const risk: CornerstoneRiskLevel = status === "excluded" ? "high" : status === "absent_unauthorised" ? "medium" : "low";
  const tags = ["education", r.record_type, status].filter(Boolean) as string[];
  const compliance: string[] = [];
  if (status === "excluded") compliance.push("Exclusion — notify the Virtual School and review the PEP");
  const { requiresApproval, approvalLevel } = deriveApproval("education", risk);
  return {
    id: `evt_edu_${r.id}`, eventType: "education", ...base(r.home_id ?? homeId, toIso(r.date), r.created_at),
    childId: r.child_id, staffId: r.staff_id, occurredAt: toIso(r.date), createdBy: r.staff_id ?? "system",
    summary: `Education: ${(r.title ?? r.record_type ?? "record")}${status ? ` (${status.replace(/_/g, " ")})` : ""}`,
    structuredTags: tags, riskLevel: risk, requiresApproval, approvalLevel,
    linkedDocuments: [], linkedTasks: [], linkedRisks: [], linkedNotifications: [],
    ariaAnalysis: buildAria("education", compliance, [], risk),
  };
}

function projectSupervision(r: SupervisionSource, homeId?: string): CornerstoneEvent {
  const risk: CornerstoneRiskLevel = "low";
  const tags = ["supervision", r.type, r.status].filter(Boolean) as string[];
  const missing: string[] = [];
  if (r.status !== "completed" && !r.actual_date) missing.push("actual date");
  return {
    id: `evt_sup_${r.id}`, eventType: "supervision", ...base(r.home_id ?? homeId, toIso(r.actual_date ?? r.scheduled_date), r.created_at, r.updated_at),
    staffId: r.staff_id, occurredAt: toIso(r.actual_date ?? r.scheduled_date), createdBy: r.supervisor_id ?? "system",
    summary: `Supervision${r.type ? ` (${r.type.replace(/_/g, " ")})` : ""} — ${r.status ?? "scheduled"}`,
    structuredTags: tags, riskLevel: risk, requiresApproval: false,
    linkedDocuments: [], linkedTasks: [], linkedRisks: [], linkedNotifications: [],
    ariaAnalysis: buildAria("supervision", [], missing, risk),
  };
}

// ── Projection + aggregation ──────────────────────────────────────────────────

export function projectEvents(input: EventProjectorInput): CornerstoneEvent[] {
  const home = input.homeId;
  const events: CornerstoneEvent[] = [
    ...(input.incidents ?? []).map((r) => projectIncident(r, home)),
    ...(input.missingEpisodes ?? []).map((r) => projectMissing(r, home)),
    ...(input.restraints ?? []).map((r) => projectRestraint(r, home)),
    ...(input.medicationErrors ?? []).map((r) => projectMedication(r, home)),
    ...(input.dailyLogs ?? []).map((r) => projectDailyLog(r, home)),
    ...(input.keyworkSessions ?? []).map((r) => projectKeywork(r, home)),
    ...(input.educationRecords ?? []).map((r) => projectEducation(r, home)),
    ...(input.supervisions ?? []).map((r) => projectSupervision(r, home)),
  ];
  // Newest first.
  events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  return events;
}

export function buildEventStream(input: EventProjectorInput): EventStreamResult {
  const events = projectEvents(input);

  const by_type: Record<string, number> = {};
  const by_risk: Record<CornerstoneRiskLevel, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  let pending_approvals = 0;
  let high_or_critical = 0;
  let compliance_flags = 0;

  for (const e of events) {
    by_type[e.eventType] = (by_type[e.eventType] ?? 0) + 1;
    by_risk[e.riskLevel] += 1;
    if (e.requiresApproval) pending_approvals += 1;
    if (e.riskLevel === "high" || e.riskLevel === "critical") high_or_critical += 1;
    compliance_flags += e.ariaAnalysis?.complianceFlags.length ?? 0;
  }

  return {
    events,
    overview: {
      total: events.length,
      by_type,
      by_risk,
      pending_approvals,
      high_or_critical,
      compliance_flags,
      latest_occurred_at: events[0]?.occurredAt ?? null,
    },
  };
}
