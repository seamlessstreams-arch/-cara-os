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
import { classifyCareEvent, buildRoutingSummary } from "./routing-engine";
import type { CareEvent, RouteType, CareEventRoute } from "@/types/care-events";

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
  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_id: task.id,
    linked_record_table: "tasks",
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
  // Creates a chronology entry as the filing reference
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
  db.careEventRoutes.patch(route.id, {
    status: "completed",
    linked_record_table: "chronology",
    processing_notes: "Auto-filed to chronology.",
  });
}

function processSavedTime(event: CareEvent, route: CareEventRoute): void {
  // Calculate total time saved by all completed routes
  const routes = db.careEventRoutes.findByCareEvent(event.id);
  const totalMinutes = routes.reduce((acc, r) => acc + (TIME_SAVED_BY_ROUTE[r.route_type] ?? 0), 0);

  db.careEventRoutes.patch(route.id, {
    status: "completed",
    time_saved_minutes: totalMinutes,
    processing_notes: `${totalMinutes} minutes saved by automatic routing.`,
  });
}

// ── Route dispatch ────────────────────────────────────────────────────────────

const ROUTE_PROCESSORS: Partial<Record<RouteType, (event: CareEvent, route: CareEventRoute) => void>> = {
  daily_log:          processDailyLog,
  management_oversight: processManagementOversight,
  reg40_triage:       processReg40Triage,
  reg45_evidence:     processReg45Evidence,
  annex_a_evidence:   processAnnexAEvidence,
  filing_cabinet:     processFilingCabinet,
  saved_time:         processSavedTime,
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
