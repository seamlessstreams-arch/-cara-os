// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CARE EVENT PROCESSOR
//
// Executes routing decisions from the routing engine.
// Called after a Care Event is submitted (staff signature confirmed).
//
// Each route is processed independently with safe idempotency:
//   - upsert patterns prevent duplicates on replay
//   - failed routes are marked and retried without affecting others
//   - source Care Event is always preserved regardless of route failures
//
// Time saved tracking:
//   Each route that creates a linked record saves staff recording time.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { generateId, todayStr } from "@/lib/utils";
import { captureDomainEvent, type CaptureDraft } from "@/lib/event-capture/capture-event-service";
import { classifyCareEvent, buildRoutingSummary } from "./routing-engine";

// ── Forms-as-views: spine write-through helpers ───────────────────────────────
// When a care event materialises a domain record, also emit a validated canonical
// event under the projection's stable id (evt_<type>_<recordId>) so it de-dupes by
// id on the live spine (persisted wins, no double-count) — the create path, not
// just the projection, becomes the source. Best-effort: never blocks processing.
function isoAt(date: string | undefined, time?: string | null): string {
  const d = (date ?? "").slice(0, 10) || "1970-01-01";
  const t = /^\d{2}:\d{2}$/.test(time ?? "") ? (time as string) : "00:00";
  return `${d}T${t}:00.000Z`;
}
function writeThroughSpine(draft: CaptureDraft, id: string): void {
  try { captureDomainEvent(draft, { id }); } catch { /* best-effort; never block care-event processing */ }
}
import type { CareEvent, RouteType, CareEventRoute, FilingCategory } from "@/types/care-events";

// ── Time saved per route type (minutes) ───────────────────────────────────────

const TIME_SAVED_BY_ROUTE: Partial<Record<RouteType, number>> = {
  daily_log:              0,  // staff created this — no saving on the primary entry
  child_daily_summary:    8,  // saves manual summary writing
  incident:               15, // saves duplicated incident form
  missing_episode:        12,
  physical_intervention:  15,
  health_record:          8,
  medication_record:      5,
  education_record:       5,
  family_contact_record:  5,
  professional_contact_record: 5,
  complaint_record:       10,
  safeguarding_record:    15,
  management_oversight:   5,
  reg40_triage:           10,
  reg44_evidence:         8,
  reg45_evidence:         10,
  annex_a_evidence:       8,
  filing_cabinet:         6,
  saved_time:             0,
};

// ── Home ID constant (seed data) ──────────────────────────────────────────────

const HOME_ID = "home_oak";

// ── Route processors ──────────────────────────────────────────────────────────

function processDailyLog(event: CareEvent, route: CareEventRoute): void {
  // Always creates/syncs a daily log entry from the care event
  const entry = db.dailyLog.create({
    id: generateId("log"),
    child_id: event.child_id ?? "",
    entry_type: (event.category as string) as never,
    content: event.content,
    mood_score: event.mood_score,
    is_significant: event.is_significant,
    requires_action: event.requires_manager_review,
    action_notes: null,
    staff_id: event.staff_id,
    date: event.event_date,
    time: event.event_time ?? new Date().toTimeString().slice(0, 5),
    linked_incident_id: null,
    home_id: HOME_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: event.staff_id,
    updated_by: event.staff_id,
  } as never);
  {
    const e = entry as any;
    const significant = !!e.is_significant;
    writeThroughSpine({
      eventType: "daily_log",
      childId: e.child_id,
      staffId: e.staff_id,
      homeId: e.home_id,
      occurredAt: isoAt(e.date, e.time),
      createdBy: e.created_by ?? e.staff_id ?? "system",
      summary: `${e.entry_type} log: ${(e.content ?? "").slice(0, 140)}`,
      riskLevel: significant ? "medium" : "low",
      structuredTags: ["daily_log", e.entry_type, significant ? "significant" : ""].filter(Boolean) as string[],
    }, `evt_log_${e.id}`);
  }

  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_id: entry.id,
    linked_record_table: "daily_log",
    processing_notes: "Daily log entry created from care event.",
  });
}

function processChildDailySummary(event: CareEvent): void {
  if (!event.child_id) return;

  // Collect all today's events for this child
  const todayEvents = db.careEvents
    .findAll()
    .filter(
      (e) => e.child_id === event.child_id &&
        e.event_date === event.event_date &&
        e.is_current_version &&
        e.status !== "draft"
    );

  const eventCount = todayEvents.length;
  const significantCount = todayEvents.filter((e) => e.is_significant).length;
  const moodScores = todayEvents.map((e) => e.mood_score).filter((s): s is number => s !== null);
  const avgMood = moodScores.length > 0
    ? Math.round((moodScores.reduce((a, b) => a + b, 0) / moodScores.length) * 10) / 10
    : null;

  const categories = [...new Set(todayEvents.map((e) => e.category))];
  const requiresFollowup = todayEvents.some((e) => e.requires_manager_review);

  const summaryText = eventCount === 0
    ? null
    : `${eventCount} care event${eventCount !== 1 ? "s" : ""} recorded. ` +
      (significantCount > 0 ? `${significantCount} significant. ` : "") +
      (avgMood !== null ? `Average mood: ${avgMood}/10. ` : "") +
      `Categories: ${categories.join(", ")}.`;

  db.childDailySummaries.upsert({
    home_id: HOME_ID,
    child_id: event.child_id,
    summary_date: event.event_date,
    event_count: eventCount,
    significant_count: significantCount,
    avg_mood_score: avgMood,
    categories,
    summary_text: summaryText,
    requires_followup: requiresFollowup,
  });
}

function processManagementOversight(event: CareEvent, route: CareEventRoute): void {
  const task = db.tasks.create({
    home_id: HOME_ID,
    title: `Management oversight: ${event.title}`,
    description: `Care event requires manager review. Category: ${event.category}. Submitted by staff ${event.staff_id}.\n\n${event.content.slice(0, 500)}`,
    category: "management",
    priority: event.requires_reg40_triage ? "urgent" : "high",
    status: "not_started",
    assigned_to: null,
    due_date: todayStr(),
    requires_sign_off: true,
    linked_child_id: event.child_id ?? null,
    tags: ["management_oversight", `care_event_${event.id}`],
    evidence_note: null,
    completed_at: null,
    completed_by: null,
    created_by: event.staff_id,
    updated_by: event.staff_id,
    linked_care_event_id: event.id,
  } as never);

  // Send in-app notification to the manager (or all managers if no manager_id)
  const notifRecipient = event.manager_id ?? event.staff_id;
  try {
    db.notifications.create({
      home_id: HOME_ID,
      recipient_id: notifRecipient,
      title: "Management review required",
      body: `A care event requires your review: "${event.title}". Please check the management oversight queue.`,
      type: "task",
      priority: event.requires_reg40_triage ? "urgent" : "high",
      read: false,
      read_at: null,
      action_url: `/management-oversight`,
      entity_type: "care_event",
      entity_id: event.id,
    });
  } catch { /* non-critical */ }

  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_id: task.id,
    linked_record_table: "tasks",
  });
}

function processReg44Evidence(event: CareEvent, route: CareEventRoute): void {
  // Map care event category to Reg 44 action theme
  const themeMap: Partial<Record<string, string>> = {
    safeguarding:          "safeguarding",
    missing_episode:       "safeguarding",
    physical_intervention: "physical_intervention",
    restraint:             "physical_intervention",
    complaint:             "complaints",
    behaviour:             "behaviour_management",
  };
  const theme = (themeMap[event.category] ?? "other") as
    import("@/types/extended").Reg44ActionTheme;

  const priority = event.requires_reg40_triage ? "high" : "medium";

  const record = db.reg44ActionRecords.create({
    visit_date: todayStr(),
    visit_ref: `CE-${event.id}`,
    visitor_name: "Auto-generated from Care Event",
    theme,
    priority: priority as import("@/types/extended").Reg44ActionPriority,
    status: "open",
    recommendation: `Review this ${event.category.replace(/_/g, " ")} care event for Regulation 44 evidence purposes.`,
    action_required: `Determine whether this event should be referenced in the next Regulation 44 visit report. ` +
      `Event: "${event.title}" recorded on ${event.event_date}.`,
    assigned_to: event.staff_id,
    due_date: todayStr(),
    completed_date: null,
    evidence_of_completion: "",
    management_response: "",
    carried_forward_count: 0,
    notes: `Source care event ID: ${event.id}\nCategory: ${event.category}\nContent: ${event.content.slice(0, 300)}`,
  });

  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_id: record.id,
    linked_record_table: "reg44_action_records",
  });
}

function processReg40Triage(event: CareEvent, route: CareEventRoute): void {
  const task = db.tasks.create({
    home_id: HOME_ID,
    title: `Regulation 40 triage: ${event.title}`,
    description: `This care event may require a Regulation 40 notifiable event notification to Ofsted. ` +
      `Category: ${event.category}. Please review and determine if notification is required.\n\n${event.content.slice(0, 400)}`,
    category: "compliance",
    priority: "urgent",
    status: "not_started",
    assigned_to: null,
    due_date: todayStr(),
    requires_sign_off: true,
    linked_child_id: event.child_id ?? null,
    tags: ["reg40_triage", `care_event_${event.id}`],
    evidence_note: null,
    completed_at: null,
    completed_by: null,
    created_by: event.staff_id,
    updated_by: event.staff_id,
    linked_care_event_id: event.id,
  } as never);
  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_id: task.id,
    linked_record_table: "tasks",
  });
}

function processReg45Evidence(event: CareEvent, route: CareEventRoute): void {
  const classification = classifyCareEvent(event);
  if (!classification.reg45_suggested_text) {
    db.careEventRoutes.patch(route.id, { status: "skipped", processing_notes: "No Reg 45 suggestion applicable." });
    return;
  }

  const item = db.reg45EvidenceQueue.upsert({
    care_event_id: event.id,
    home_id: HOME_ID,
    suggested_text: classification.reg45_suggested_text,
    suggested_theme: event.category.replace(/_/g, " "),
    suggested_section: null,
    manager_decision: "pending",
    manager_approved_text: null,
    reviewed_by: null,
    reviewed_at: null,
    review_notes: null,
  });

  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_id: item.id,
    linked_record_table: "reg45_evidence_queue",
  });
}

function processAnnexAEvidence(event: CareEvent, route: CareEventRoute): void {
  const classification = classifyCareEvent(event);
  if (!classification.annex_a_section || !classification.annex_a_suggested_text) {
    db.careEventRoutes.patch(route.id, { status: "skipped", processing_notes: "No Annex A suggestion applicable." });
    return;
  }

  const item = db.annexAEvidenceQueue.upsert({
    care_event_id: event.id,
    home_id: HOME_ID,
    annex_section: classification.annex_a_section,
    suggested_text: classification.annex_a_suggested_text,
    manager_decision: "pending",
    manager_approved_text: null,
    reviewed_by: null,
    reviewed_at: null,
  });

  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_id: item.id,
    linked_record_table: "annex_a_evidence_queue",
  });
}

function processFilingCabinet(event: CareEvent, route: CareEventRoute): void {
  // Determine filing category from event
  const category: FilingCategory = event.is_safeguarding
    ? "safeguarding"
    : (event.category as FilingCategory) ?? "other";

  // Write to filing cabinet (idempotent via care_event_id + category)
  const item = db.filingCabinet.upsert({
    care_event_id: event.id,
    home_id: HOME_ID,
    child_id: event.child_id,
    category,
    sub_category: event.category !== category ? event.category : null,
    title: event.title,
    description: event.content.slice(0, 500),
    source_type: "care_event",
    linked_record_id: event.id,
    linked_record_table: "care_events",
    is_verified: event.status === "verified" || event.status === "locked",
    verified_at: event.verified_at,
    verified_by: event.verified_by,
    tags: [
      event.category,
      ...(event.is_significant ? ["significant"] : []),
      ...(event.is_safeguarding ? ["safeguarding"] : []),
      ...(event.requires_manager_review ? ["manager_review"] : []),
    ],
    filed_at: new Date().toISOString(),
  });

  // Also create a chronology entry as before (dual-filing)
  try {
    db.chronology.create({
      child_id: event.child_id,
      date: event.event_date,
      time: event.event_time ?? null,
      category: (event.is_safeguarding ? "safeguarding" : event.category) as never,
      title: event.title,
      description: event.content.slice(0, 500),
      significance: event.is_significant ? "significant" : "routine",
      recorded_by: event.staff_id,
      linked_incident_id: null,
      home_id: HOME_ID,
      created_at: new Date().toISOString(),
      care_event_id: event.id,
    } as never);
  } catch {
    // Chronology failure is non-critical — filing cabinet is the primary record
  }

  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_id: item.id,
    linked_record_table: "filing_cabinet",
    processing_notes: `Auto-filed to filing cabinet under '${category}'.`,
  });
}

function processSavedTime(event: CareEvent, route: CareEventRoute): void {
  // Calculate total time saved by all completed routes for this event
  const routes = db.careEventRoutes.findByCareEvent(event.id);
  const totalMinutes = routes.reduce((acc, r) => acc + (TIME_SAVED_BY_ROUTE[r.route_type] ?? 0), 0);

  // Write per-route metrics into savedTimeMetrics
  for (const r of routes) {
    const mins = TIME_SAVED_BY_ROUTE[r.route_type] ?? 0;
    if (mins > 0) {
      db.savedTimeMetrics.upsert({
        care_event_id: event.id,
        home_id: HOME_ID,
        route_type: r.route_type,
        minutes_saved: mins,
        activity_description: `Auto-routing to ${r.route_type.replace(/_/g, " ")} from care event`,
        staff_id: event.staff_id,
        recorded_at: new Date().toISOString(),
      });
    }
  }

  db.careEventRoutes.patch(route.id, {
    status: "completed",
    time_saved_minutes: totalMinutes,
    processing_notes: `${totalMinutes} minutes saved by automatic routing.`,
  });
}

// ── Route dispatch ────────────────────────────────────────────────────────────

// ── Incident ──────────────────────────────────────────────────────────────────

function processIncident(event: CareEvent, route: CareEventRoute): void {
  // Idempotency: one incident per care event
  const existing = db.incidents.findAll().find((i) => (i as never as { care_event_id?: string }).care_event_id === event.id);
  if (existing) {
    db.careEventRoutes.patch(route.id, {
      status: "completed",
      linked_record_id: existing.id,
      linked_record_table: "incidents",
      processing_notes: "Incident record already exists for this care event.",
    });
    return;
  }

  const categoryToType: Record<string, string> = {
    safeguarding: "safeguarding_concern",
    missing_episode: "missing_from_care",
    physical_intervention: "physical_intervention",
    restraint: "physical_intervention",
    complaint: "complaint",
    health: "other",
    behaviour: "behaviour_incident",
    general: "behaviour_incident",
  };

  const categoryToSeverity: Record<string, string> = {
    safeguarding: "high",
    missing_episode: "high",
    physical_intervention: "medium",
    restraint: "high",
    complaint: "medium",
    health: "low",
    behaviour: "medium",
    general: "low",
  };

  const incident = db.incidents.create({
    reference: `INC-${new Date().getFullYear()}-${String(db.incidents.findAll().length + 1).padStart(4, "0")}`,
    type: (categoryToType[event.category] ?? "other") as never,
    severity: (categoryToSeverity[event.category] ?? "medium") as never,
    child_id: event.child_id ?? "",
    date: event.event_date,
    time: event.event_time ?? "00:00",
    location: null,
    description: event.content,
    immediate_action: `Logged via Care Event: ${event.title}`,
    reported_by: event.staff_id,
    witnesses: [],
    body_map_required: false,
    body_map_completed: false,
    body_map_url: null,
    notifications: [],
    requires_oversight: event.requires_manager_review,
    oversight_note: null,
    oversight_by: null,
    oversight_at: null,
    status: "open",
    outcome: null,
    lessons_learned: null,
    linked_task_ids: [],
    linked_document_ids: [],
    home_id: HOME_ID,
    care_event_id: event.id,
    created_by: event.staff_id,
    updated_by: event.staff_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as never);

  {
    const inc = incident as any;
    const isSg = /safeguard/i.test(inc.type ?? "");
    const sev: Record<string, "low" | "medium" | "high" | "critical"> = { low: "low", medium: "medium", high: "high", critical: "critical" };
    let risk = sev[inc.severity] ?? "medium";
    if (isSg && (risk === "low" || risk === "medium")) risk = "high";
    const tags = [isSg ? "safeguarding" : "incident", inc.type, inc.severity].filter(Boolean) as string[];
    if (inc.requires_oversight) tags.push("oversight_required");
    writeThroughSpine({
      eventType: isSg ? "safeguarding" : "incident",
      childId: inc.child_id,
      staffId: inc.reported_by,
      homeId: inc.home_id,
      occurredAt: isoAt(inc.date, inc.time),
      createdBy: inc.reported_by ?? "system",
      summary: `${isSg ? "Safeguarding" : "Incident"} ${inc.reference}: ${(inc.description ?? inc.type ?? "").slice(0, 140)}`,
      riskLevel: risk,
      structuredTags: tags,
    }, `evt_inc_${inc.id}`);
  }

  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_id: incident.id,
    linked_record_table: "incidents",
    processing_notes: `Incident record created: ${incident.reference}`,
  });
}

// ── Missing Episode ────────────────────────────────────────────────────────────

function processMissingEpisode(event: CareEvent, route: CareEventRoute): void {
  const existing = db.missingEpisodes.findAll().find((m) => (m as never as { care_event_id?: string }).care_event_id === event.id);
  if (existing) {
    db.careEventRoutes.patch(route.id, {
      status: "completed",
      linked_record_id: existing.id,
      linked_record_table: "missingEpisodes",
      processing_notes: "Missing episode record already exists for this care event.",
    });
    return;
  }

  const episode = db.missingEpisodes.create({
    child_id: event.child_id ?? "",
    home_id: HOME_ID,
    date_missing: event.event_date,
    time_missing: event.event_time ?? "00:00",
    date_returned: null,
    time_returned: null,
    duration_minutes: null,
    reported_by: event.staff_id,
    reported_to_police: false,
    police_reference: null,
    return_interview_completed: false,
    return_interview_notes: null,
    return_interview_by: null,
    contextual_safeguarding_risk: event.is_safeguarding,
    last_known_location: null,
    description: event.content,
    risk_to_self: "medium",
    risk_to_others: "low",
    actions_taken: `Logged via Care Event: ${event.title}`,
    care_event_id: event.id,
    created_by: event.staff_id,
  } as never);

  // Spine write-through. Care-event episodes carry no `risk_level`, so the
  // projection renders "(undefined risk)"; derive a sensible risk + clean summary.
  {
    const ep = episode as any;
    const risk = event.is_safeguarding ? "critical" : "high";
    writeThroughSpine({
      eventType: "missing",
      childId: ep.child_id,
      homeId: ep.home_id,
      occurredAt: isoAt(ep.date_missing, ep.time_missing),
      createdBy: ep.created_by ?? "system",
      summary: `Missing episode ${ep.reference} (${risk} risk) — active`,
      riskLevel: risk,
      structuredTags: ["missing", risk, "rhi_outstanding"],
    }, `evt_mis_${ep.id}`);
  }

  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_id: episode.id,
    linked_record_table: "missingEpisodes",
    processing_notes: `Missing episode record created: ${episode.reference}`,
  });
}

// ── Physical Intervention / Restraint ─────────────────────────────────────────

function processPhysicalIntervention(event: CareEvent, route: CareEventRoute): void {
  const existing = db.restraints.findAll().find((r) => (r as never as { care_event_id?: string }).care_event_id === event.id);
  if (existing) {
    db.careEventRoutes.patch(route.id, {
      status: "completed",
      linked_record_id: existing.id,
      linked_record_table: "restraints",
      processing_notes: "Restraint record already exists for this care event.",
    });
    return;
  }

  const record = db.restraints.create({
    date: event.event_date,
    start_time: event.event_time ?? "00:00",
    end_time: event.event_time ?? "00:00",
    duration: 0,
    child_id: event.child_id ?? "",
    staff_involved: [{ staff_id: event.staff_id, role: "primary" }],
    reason: "harm_to_others",
    restraint_type: "standing",
    antecedent: "",
    behaviour: event.content,
    de_escalation_attempts: [],
    justification: `Recorded via Care Event: ${event.title}`,
    description: event.content,
    injuries: [],
    child_debriefed: false,
    child_debrief_notes: "",
    staff_debriefed: false,
    witnessed_by: [],
    review_status: "pending_rm",
    review_notes: "",
    reviewed_by: "",
    linked_incident_id: "",
    notifications_sent: [],
    body_map_completed: false,
    medical_check_completed: false,
    recorded_by: event.staff_id,
    care_event_id: event.id,
    created_at: new Date().toISOString(),
  } as never);

  {
    const r = record as any;
    const injuries = Array.isArray(r.injuries) ? r.injuries.length : 0;
    const risk = injuries > 0 ? "critical" : "high";
    const tags = ["physical_intervention", r.restraint_type].filter(Boolean) as string[];
    if (injuries > 0) tags.push("injury");
    if (!r.child_debriefed) tags.push("debrief_outstanding");
    writeThroughSpine({
      eventType: "physical_intervention",
      childId: r.child_id,
      staffId: r.recorded_by,
      occurredAt: isoAt(r.date, r.start_time),
      createdBy: r.recorded_by ?? "system",
      summary: `Physical intervention${r.restraint_type ? ` (${r.restraint_type})` : ""}${injuries > 0 ? " — injury recorded" : ""}`,
      riskLevel: risk,
      structuredTags: tags,
    }, `evt_res_${r.id}`);
  }

  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_id: record.id,
    linked_record_table: "restraints",
    processing_notes: "Physical intervention record created — awaiting RM review.",
  });
}

// ── Health Record ─────────────────────────────────────────────────────────────

function processHealthRecord(event: CareEvent, route: CareEventRoute): void {
  const existing = db.healthRecordEntries.getAll().find((h) => (h as never as { care_event_id?: string }).care_event_id === event.id);
  if (existing) {
    db.careEventRoutes.patch(route.id, {
      status: "completed",
      linked_record_id: existing.id,
      linked_record_table: "healthRecordEntries",
      processing_notes: "Health record already exists for this care event.",
    });
    return;
  }

  const record = db.healthRecordEntries.create({
    child_id: event.child_id ?? "",
    date: event.event_date,
    record_type: "other",
    title: event.title,
    details: event.content,
    professional: "",
    status: "monitoring",
    follow_up_date: null,
    outcome: null,
    staff_id: event.staff_id,
    home_id: HOME_ID,
    care_event_id: event.id,
    created_at: new Date().toISOString(),
  } as never);

  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_id: record.id,
    linked_record_table: "healthRecordEntries",
    processing_notes: "Health record entry created.",
  });
}

// ── Medication Record ─────────────────────────────────────────────────────────

function processMedicationRecord(event: CareEvent, route: CareEventRoute): void {
  // Write to chronology as a medication note — full medication administration
  // records require structured data not available from a care event narrative alone
  const existing = db.chronology.findAll().find((c) => (c as never as { care_event_id?: string }).care_event_id === event.id && (c as never as { category?: string }).category === "medication");
  if (existing) {
    db.careEventRoutes.patch(route.id, {
      status: "completed",
      linked_record_id: existing.id,
      linked_record_table: "chronology",
      processing_notes: "Medication chronology entry already exists.",
    });
    return;
  }

  const entry = db.chronology.create({
    child_id: event.child_id ?? "",
    date: event.event_date,
    time: event.event_time ?? null,
    category: "medication" as never,
    title: event.title,
    description: event.content.slice(0, 500),
    significance: event.is_significant ? "significant" : "routine",
    recorded_by: event.staff_id,
    linked_incident_id: null,
    home_id: HOME_ID,
    care_event_id: event.id,
    created_at: new Date().toISOString(),
  } as never);

  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_id: entry.id,
    linked_record_table: "chronology",
    processing_notes: "Medication note added to chronology.",
  });
}

// ── Education Record ──────────────────────────────────────────────────────────

function processEducationRecord(event: CareEvent, route: CareEventRoute): void {
  const existing = db.educationRecords.findAll().find((r) => (r as never as { care_event_id?: string }).care_event_id === event.id);
  if (existing) {
    db.careEventRoutes.patch(route.id, {
      status: "completed",
      linked_record_id: existing.id,
      linked_record_table: "educationRecords",
      processing_notes: "Education record already exists for this care event.",
    });
    return;
  }

  const record = db.educationRecords.create({
    child_id: event.child_id ?? "",
    record_type: "concern",
    title: event.title,
    date: event.event_date,
    details: event.content,
    outcome: null,
    follow_up_date: null,
    staff_id: event.staff_id,
    status: "open",
    home_id: HOME_ID,
    care_event_id: event.id,
    created_at: new Date().toISOString(),
  } as never);

  {
    const r = record as any;
    const status = r.attendance_status ?? "";
    const risk = status === "excluded" ? "high" : status === "absent_unauthorised" ? "medium" : "low";
    const tags = ["education", r.record_type, status].filter(Boolean) as string[];
    writeThroughSpine({
      eventType: "education",
      childId: r.child_id,
      staffId: r.staff_id,
      homeId: r.home_id,
      occurredAt: isoAt(r.date),
      createdBy: r.staff_id ?? "system",
      summary: `Education: ${r.title ?? r.record_type ?? "record"}${status ? ` (${String(status).replace(/_/g, " ")})` : ""}`,
      riskLevel: risk,
      structuredTags: tags,
    }, `evt_edu_${r.id}`);
  }

  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_id: record.id,
    linked_record_table: "educationRecords",
    processing_notes: "Education record created.",
  });
}

// ── Family Contact Record ─────────────────────────────────────────────────────

function processFamilyContactRecord(event: CareEvent, route: CareEventRoute): void {
  // Log as a chronology entry — FamilyTimeSession has many required structured fields
  // that would need staff to complete separately
  const existing = db.chronology.findAll().find((c) => (c as never as { care_event_id?: string }).care_event_id === event.id && (c as never as { category?: string }).category === "family");
  if (existing) {
    db.careEventRoutes.patch(route.id, {
      status: "completed",
      linked_record_id: existing.id,
      linked_record_table: "chronology",
      processing_notes: "Family contact chronology entry already exists.",
    });
    return;
  }

  const entry = db.chronology.create({
    child_id: event.child_id ?? "",
    date: event.event_date,
    time: event.event_time ?? null,
    category: "family" as never,
    title: event.title,
    description: event.content.slice(0, 500),
    significance: event.is_significant ? "significant" : "routine",
    recorded_by: event.staff_id,
    linked_incident_id: null,
    home_id: HOME_ID,
    care_event_id: event.id,
    created_at: new Date().toISOString(),
  } as never);

  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_id: entry.id,
    linked_record_table: "chronology",
    processing_notes: "Family contact note added to chronology. Create a full family time session record when details are available.",
  });
}

// ── Professional Contact Record ───────────────────────────────────────────────

function processProfessionalContactRecord(event: CareEvent, route: CareEventRoute): void {
  const existing = db.chronology.findAll().find((c) => (c as never as { care_event_id?: string }).care_event_id === event.id && (c as never as { category?: string }).category === "professional");
  if (existing) {
    db.careEventRoutes.patch(route.id, {
      status: "completed",
      linked_record_id: existing.id,
      linked_record_table: "chronology",
      processing_notes: "Professional contact entry already exists.",
    });
    return;
  }

  const entry = db.chronology.create({
    child_id: event.child_id ?? "",
    date: event.event_date,
    time: event.event_time ?? null,
    category: "professional" as never,
    title: event.title,
    description: event.content.slice(0, 500),
    significance: event.is_significant ? "significant" : "routine",
    recorded_by: event.staff_id,
    linked_incident_id: null,
    home_id: HOME_ID,
    care_event_id: event.id,
    created_at: new Date().toISOString(),
  } as never);

  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_id: entry.id,
    linked_record_table: "chronology",
    processing_notes: "Professional contact note added to chronology.",
  });
}

// ── Complaint Record ──────────────────────────────────────────────────────────

function processComplaintRecord(event: CareEvent, route: CareEventRoute): void {
  // Complaints route to incidents (type=complaint) AND chronology
  const existing = db.incidents.findAll().find((i) => (i as never as { care_event_id?: string }).care_event_id === event.id);
  if (existing) {
    db.careEventRoutes.patch(route.id, {
      status: "completed",
      linked_record_id: existing.id,
      linked_record_table: "incidents",
      processing_notes: "Complaint incident record already exists.",
    });
    return;
  }

  const incident = db.incidents.create({
    reference: `CMP-${new Date().getFullYear()}-${String(db.incidents.findAll().length + 1).padStart(4, "0")}`,
    type: "complaint" as never,
    severity: "medium" as never,
    child_id: event.child_id ?? "",
    date: event.event_date,
    time: event.event_time ?? "00:00",
    location: null,
    description: event.content,
    immediate_action: `Complaint logged via Care Event: ${event.title}`,
    reported_by: event.staff_id,
    witnesses: [],
    body_map_required: false,
    body_map_completed: false,
    body_map_url: null,
    notifications: [],
    requires_oversight: true,
    oversight_note: null,
    oversight_by: null,
    oversight_at: null,
    status: "open",
    outcome: null,
    lessons_learned: null,
    linked_task_ids: [],
    linked_document_ids: [],
    home_id: HOME_ID,
    care_event_id: event.id,
    created_by: event.staff_id,
    updated_by: event.staff_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as never);

  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_id: incident.id,
    linked_record_table: "incidents",
    processing_notes: `Complaint record created: ${incident.reference}`,
  });
}

// ── Safeguarding Record ───────────────────────────────────────────────────────

function processSafeguardingRecord(event: CareEvent, route: CareEventRoute): void {
  // Create high-severity incident (type=safeguarding_concern) + chronology entry
  const existing = db.incidents.findAll().find((i) => (i as never as { care_event_id?: string }).care_event_id === event.id);
  if (existing) {
    db.careEventRoutes.patch(route.id, {
      status: "completed",
      linked_record_id: existing.id,
      linked_record_table: "incidents",
      processing_notes: "Safeguarding incident already exists.",
    });
    return;
  }

  const incident = db.incidents.create({
    reference: `SG-${new Date().getFullYear()}-${String(db.incidents.findAll().length + 1).padStart(4, "0")}`,
    type: "safeguarding_concern" as never,
    severity: "high" as never,
    child_id: event.child_id ?? "",
    date: event.event_date,
    time: event.event_time ?? "00:00",
    location: null,
    description: event.content,
    immediate_action: `Safeguarding concern logged via Care Event: ${event.title}`,
    reported_by: event.staff_id,
    witnesses: [],
    body_map_required: false,
    body_map_completed: false,
    body_map_url: null,
    notifications: [],
    requires_oversight: true,
    oversight_note: null,
    oversight_by: null,
    oversight_at: null,
    status: "open",
    outcome: null,
    lessons_learned: null,
    linked_task_ids: [],
    linked_document_ids: [],
    home_id: HOME_ID,
    care_event_id: event.id,
    created_by: event.staff_id,
    updated_by: event.staff_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as never);

  // Also add to chronology
  try {
    db.chronology.create({
      child_id: event.child_id ?? "",
      date: event.event_date,
      time: event.event_time ?? null,
      category: "safeguarding" as never,
      title: event.title,
      description: event.content.slice(0, 500),
      significance: "critical",
      recorded_by: event.staff_id,
      linked_incident_id: incident.id,
      home_id: HOME_ID,
      care_event_id: event.id,
      created_at: new Date().toISOString(),
    } as never);
  } catch { /* non-critical */ }

  // Urgent notification to manager
  try {
    const notifRecipient = event.manager_id ?? event.staff_id;
    db.notifications.create({
      home_id: HOME_ID,
      recipient_id: notifRecipient,
      title: "URGENT — Safeguarding concern logged",
      body: `A safeguarding concern has been recorded: "${event.title}". Immediate review required. Ref: ${incident.reference}`,
      type: "safeguarding",
      priority: "urgent",
      read: false,
      read_at: null,
      action_url: `/incidents`,
      entity_type: "incident",
      entity_id: incident.id,
    });
  } catch { /* non-critical */ }

  {
    const inc = incident as any;
    const tags = ["safeguarding", inc.type, inc.severity].filter(Boolean) as string[];
    if (inc.requires_oversight) tags.push("oversight_required");
    writeThroughSpine({
      eventType: "safeguarding",
      childId: inc.child_id,
      staffId: inc.reported_by,
      homeId: inc.home_id,
      occurredAt: isoAt(inc.date, inc.time),
      createdBy: inc.reported_by ?? "system",
      summary: `Safeguarding ${inc.reference}: ${(inc.description ?? "").slice(0, 140)}`,
      riskLevel: "high",
      structuredTags: tags,
    }, `evt_inc_${inc.id}`);
  }

  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_id: incident.id,
    linked_record_table: "incidents",
    processing_notes: `Safeguarding record created: ${incident.reference} — management notification required.`,
  });
}

// ── Task processors (risk_assessment_task, behaviour_plan_task, followup_task)

function processTask(
  event: CareEvent,
  route: CareEventRoute,
  taskCategory: string,
  taskTitle: string,
  priority: string,
  dueDaysFromNow: number
): void {
  const now = new Date();
  const dueDate = new Date(now.getTime() + dueDaysFromNow * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const existing = db.tasks.findAll().find((t) => (t as never as { care_event_id?: string }).care_event_id === event.id && (t as never as { category?: string }).category === taskCategory);
  if (existing) {
    db.careEventRoutes.patch(route.id, {
      status: "completed",
      linked_record_id: existing.id,
      linked_record_table: "tasks",
      processing_notes: "Task already exists for this care event.",
    });
    return;
  }

  const task = db.tasks.create({
    title: taskTitle,
    description: `Auto-generated from Care Event: ${event.title}\n\n${event.content.slice(0, 200)}`,
    category: taskCategory as never,
    priority: priority as never,
    status: "pending",
    assigned_to: event.manager_id ?? event.staff_id,
    created_by: event.staff_id,
    due_date: dueDate,
    linked_child_id: event.child_id ?? null,
    home_id: HOME_ID,
    care_event_id: event.id,
    evidence_note: null,
    completed_at: null,
    completed_by: null,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  } as never);

  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_id: task.id,
    linked_record_table: "tasks",
    processing_notes: `${taskCategory.replace(/_/g, " ")} task created — due ${dueDate}.`,
  });
}

// ── Route dispatch ────────────────────────────────────────────────────────────

const ROUTE_PROCESSORS: Partial<Record<RouteType, (event: CareEvent, route: CareEventRoute) => void>> = {
  daily_log:                   processDailyLog,
  management_oversight:        processManagementOversight,
  reg40_triage:                processReg40Triage,
  reg44_evidence:              processReg44Evidence,
  reg45_evidence:              processReg45Evidence,
  annex_a_evidence:            processAnnexAEvidence,
  filing_cabinet:              processFilingCabinet,
  saved_time:                  processSavedTime,
  incident:                    processIncident,
  missing_episode:             processMissingEpisode,
  physical_intervention:       processPhysicalIntervention,
  health_record:               processHealthRecord,
  medication_record:           processMedicationRecord,
  education_record:            processEducationRecord,
  family_contact_record:       processFamilyContactRecord,
  professional_contact_record: processProfessionalContactRecord,
  complaint_record:            processComplaintRecord,
  safeguarding_record:         processSafeguardingRecord,
  risk_assessment_task:        (event, route) => processTask(event, route, "risk_assessment", `Review risk assessment: ${event.title}`, "high", 3),
  behaviour_plan_task:         (event, route) => processTask(event, route, "behaviour", `Update behaviour support plan: ${event.title}`, "medium", 7),
  followup_task:               (event, route) => processTask(event, route, "general", `Follow up: ${event.title}`, "medium", 5),
};

// ── Main process function ─────────────────────────────────────────────────────

export interface ProcessResult {
  success: boolean;
  routes_completed: number;
  routes_failed: number;
  routes_skipped: number;
  routing_summary: import("@/types/care-events").RoutingSummary;
  errors: Array<{ route: RouteType; error: string }>;
}

export function processCareEvent(event: CareEvent): ProcessResult {
  const classification = classifyCareEvent(event);
  const errors: Array<{ route: RouteType; error: string }> = [];
  let completed = 0;
  let failed = 0;
  let skipped = 0;

  // Update event with classification flags
  db.careEvents.patch(event.id, {
    status: "routing",
    requires_manager_review: classification.requires_manager_review,
    requires_reg40_triage: classification.requires_reg40_triage,
    contributes_to_reg45: classification.contributes_to_reg45,
    contributes_to_annex_a: classification.contributes_to_annex_a,
    is_safeguarding: classification.is_safeguarding,
    evidence_prompts: classification.evidence_prompts,
  });

  // Enqueue background jobs (non-blocking)
  for (const jobType of classification.background_jobs) {
    db.careEventJobs.upsert({
      care_event_id: event.id,
      home_id: HOME_ID,
      job_type: jobType,
      status: "pending",
      payload: { care_event_id: event.id, category: event.category },
      result: null,
      error_message: null,
      retry_count: 0,
      max_retries: 3,
      scheduled_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
      last_retried_at: null,
    });
  }

  // Process child daily summary (not per-route, always runs)
  try {
    processChildDailySummary(event);
  } catch (e) {
    errors.push({ route: "child_daily_summary", error: String(e) });
  }

  // Process each route
  for (const routeType of classification.routes) {
    // Upsert route record (idempotent)
    const route = db.careEventRoutes.upsert({
      care_event_id: event.id,
      home_id: HOME_ID,
      route_type: routeType,
      status: "processing",
      linked_record_id: null,
      linked_record_table: null,
      processing_notes: null,
      error_message: null,
      retry_count: 0,
      last_retried_at: null,
      time_saved_minutes: TIME_SAVED_BY_ROUTE[routeType] ?? 0,
    });

    const processor = ROUTE_PROCESSORS[routeType];

    if (!processor) {
      // Route type known but no processor yet — mark as pending for background job
      db.careEventRoutes.patch(route.id, {
        status: "pending",
        processing_notes: `Route '${routeType}' will be processed by background job.`,
      });
      skipped++;
      continue;
    }

    try {
      processor(event, route);
      // Re-check status
      const updatedRoute = db.careEventRoutes.findByCareEvent(event.id).find((r) => r.route_type === routeType);
      if (updatedRoute?.status === "completed") completed++;
      else if (updatedRoute?.status === "skipped") skipped++;
      else failed++;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      db.careEventRoutes.patch(route.id, {
        status: "failed",
        error_message: errorMsg,
      });
      errors.push({ route: routeType, error: errorMsg });
      failed++;
    }
  }

  // Build routing summary
  const completedRoutes = db.careEventRoutes
    .findByCareEvent(event.id)
    .filter((r) => r.status === "completed")
    .map((r) => r.route_type);
  const routingSummary = buildRoutingSummary(completedRoutes);

  // Update care event status
  const finalStatus = failed > 0 && completed === 0
    ? "routing_failed"
    : classification.requires_manager_review
    ? "manager_review_required"
    : "routed";

  db.careEvents.patch(event.id, {
    status: finalStatus,
    routing_summary: routingSummary,
  });

  // Audit
  db.careEventAuditLog.append({
    care_event_id: event.id,
    home_id: HOME_ID,
    action: failed > 0 ? "care_event_route_failed" : "care_event_routed",
    actor_staff_id: event.staff_id,
    actor_role: null,
    detail: {
      routes_completed: completed,
      routes_failed: failed,
      routes_skipped: skipped,
      errors,
      routing_summary: routingSummary,
    },
    ip_address: null,
  });

  return {
    success: failed === 0 || completed > 0,
    routes_completed: completed,
    routes_failed: failed,
    routes_skipped: skipped,
    routing_summary: routingSummary,
    errors,
  };
}

// ── Retry failed routes ───────────────────────────────────────────────────────

export function retryFailedRoutes(careEventId: string): ProcessResult {
  const event = db.careEvents.findById(careEventId);
  if (!event) throw new Error(`Care event ${careEventId} not found`);

  const failedRoutes = db.careEventRoutes
    .findByCareEvent(careEventId)
    .filter((r) => r.status === "failed" || r.status === "retry_required");

  let completed = 0;
  let failed = 0;
  const errors: Array<{ route: RouteType; error: string }> = [];

  for (const route of failedRoutes) {
    db.careEventRoutes.patch(route.id, {
      status: "processing",
      retry_count: route.retry_count + 1,
      last_retried_at: new Date().toISOString(),
    });

    const processor = ROUTE_PROCESSORS[route.route_type];
    if (!processor) { failed++; continue; }

    try {
      processor(event, route);
      completed++;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      db.careEventRoutes.patch(route.id, { status: "failed", error_message: errorMsg });
      errors.push({ route: route.route_type, error: errorMsg });
      failed++;
    }
  }

  db.careEventAuditLog.append({
    care_event_id: careEventId,
    home_id: HOME_ID,
    action: "care_event_route_retried",
    actor_staff_id: event.staff_id,
    actor_role: null,
    detail: { routes_retried: failedRoutes.length, completed, failed, errors },
    ip_address: null,
  });

  const completedRoutes = db.careEventRoutes
    .findByCareEvent(careEventId)
    .filter((r) => r.status === "completed")
    .map((r) => r.route_type);
  const routingSummary = buildRoutingSummary(completedRoutes);

  return {
    success: failed === 0,
    routes_completed: completed,
    routes_failed: failed,
    routes_skipped: 0,
    routing_summary: routingSummary,
    errors,
  };
}
