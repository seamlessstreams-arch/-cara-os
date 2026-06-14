// ══════════════════════════════════════════════════════════════════════════════
// CARA — LINKED UPDATES ENGINE
//
// "Record once, update everywhere."
//
// When any significant event is created, this engine:
//   1. Creates chronology entries
//   2. Auto-generates management tasks
//   3. Appends to handover
//   4. Creates notifications
//   5. Updates daily log
//   6. Tracks time saved
//
// Every function here is called by API route handlers after the primary record
// is created. This is the connective tissue of the platform.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { todayStr, generateId } from "@/lib/utils";
import { persistDailyLog, createTaskRecord } from "@/lib/supabase/care-records";
import { sendPushToUser } from "@/lib/push/web-push";
import type { Incident } from "@/types";
import type { MissingEpisode } from "@/types/extended";

// ── Constants ─────────────────────────────────────────────────────────────────

const TIME_SAVED = {
  auto_chronology: 8,        // minutes saved vs manual chronology entry
  auto_task_creation: 5,     // minutes saved vs manually creating oversight task
  auto_handover: 10,         // minutes saved vs manually updating handover
  auto_notification: 3,      // minutes saved vs manually notifying
  cara_draft: 15,            // minutes saved per Cara-assisted draft
  linked_record_display: 4,  // minutes saved per linked record surfacing
};

// ── Incident linked updates ───────────────────────────────────────────────────

export function processIncidentCreated(incident: Incident, createdBy: string): void {
  const typeLabels: Record<string, string> = {
    safeguarding_concern: "Safeguarding concern",
    missing_from_care: "Missing from care",
    medication_error: "Medication error",
    complaint: "Complaint",
    physical_intervention: "Physical intervention",
    self_harm: "Self-harm",
    exploitation_concern: "Exploitation concern",
    property_damage: "Property damage",
    aggression_verbal: "Verbal aggression",
  };
  const label = typeLabels[incident.type] || incident.type;

  // 1. Chronology entry
  db.chronology.create({
    child_id: incident.child_id,
    date: incident.date,
    time: incident.time,
    category: incident.type === "safeguarding_concern" ? "safeguarding"
      : incident.type === "missing_from_care" ? "missing"
      : "incident",
    title: `${label} logged (${incident.reference})`,
    description: incident.description.slice(0, 300),
    significance: incident.severity === "critical" ? "critical" : incident.severity === "high" ? "significant" : "routine",
    recorded_by: createdBy,
    linked_incident_id: incident.id,
    home_id: incident.home_id,
  });

  // 2. Manager oversight task (for incidents requiring oversight)
  if (incident.requires_oversight) {
    createTaskRecord({
      title: `Manager oversight required — ${incident.reference}`,
      description: `${label} for ${incident.child_id} requires RM oversight comment. ${incident.severity === "critical" ? "CRITICAL — complete today." : ""}`,
      category: incident.type.includes("safeguarding") ? "safeguarding" : "compliance",
      priority: incident.severity === "critical" ? "urgent" : "high",
      status: "not_started",
      assigned_to: "staff_darren",
      assigned_role: "registered_manager",
      due_date: todayStr(),
      start_date: null,
      completed_at: null,
      completed_by: null,
      estimated_minutes: 30,
      actual_minutes: null,
      recurring: false,
      recurring_schedule: null,
      requires_sign_off: false,
      signed_off_by: null,
      signed_off_at: null,
      evidence_note: null,
      evidence_files: [],
      escalated: false,
      escalated_to: null,
      escalated_at: null,
      escalation_reason: null,
      linked_child_id: incident.child_id,
      linked_incident_id: incident.id,
      linked_document_id: null,
      parent_task_id: null,
      home_id: incident.home_id,
      tags: ["auto_generated", "incident_oversight"],
    });
  }

  // 3. Daily log entry (mark incident on daily record)
  const incidentDailyLog = db.dailyLog.create({
    child_id: incident.child_id,
    date: incident.date,
    time: incident.time,
    entry_type: incident.type === "safeguarding_concern" ? "behaviour"
      : incident.type === "medication_error" ? "health"
      : "general",
    content: `[Auto-linked from ${incident.reference}] ${label} recorded. ${incident.immediate_action}`,
    mood_score: null,
    staff_id: createdBy,
    linked_incident_id: incident.id,
    is_significant: incident.severity === "critical" || incident.severity === "high",
    home_id: incident.home_id,
  });
  void persistDailyLog(incidentDailyLog); // best-effort Supabase write-through (no-op when off)

  // 4. Handover flag
  const todayHandover = db.handovers.findByDate(todayStr())[0];
  if (todayHandover && !todayHandover.linked_incident_ids.includes(incident.id)) {
    todayHandover.linked_incident_ids.push(incident.id);
    if (incident.severity === "critical") {
      todayHandover.flags.push(`CRITICAL INCIDENT: ${incident.reference}`);
    }
  }

  // 5. RM notification
  db.notifications.create({
    home_id: incident.home_id,
    recipient_id: "staff_darren",
    title: `${incident.severity === "critical" ? "🔴 CRITICAL: " : ""}${label} — ${incident.reference}`,
    body: `Logged by ${createdBy} at ${incident.time}. ${incident.requires_oversight ? "Your oversight is required." : ""}`,
    type: "incident",
    priority: incident.severity === "critical" ? "urgent" : "high",
    read: false,
    read_at: null,
    action_url: `/incidents`,
    entity_type: "incident",
    entity_id: incident.id,
  });
  // Ping the RM's device — deliberately generic (no incident type/detail on a lock screen).
  void sendPushToUser("staff_darren", {
    title: incident.severity === "critical" ? "🔴 Critical incident" : "Incident logged",
    body: incident.requires_oversight ? "A new incident needs your oversight." : "A new incident has been logged.",
    url: "/incidents",
    tag: "incident",
    priority: incident.severity === "critical" ? "critical" : "normal",
  });

  // 6. Track time saved
  trackTimeSaved(createdBy, incident.home_id, "auto_chronology", "Chronology auto-updated from incident");
  trackTimeSaved(createdBy, incident.home_id, "auto_task_creation", "Oversight task auto-created from incident");
  trackTimeSaved(createdBy, incident.home_id, "auto_handover", "Handover auto-updated from incident");
}

// ── Missing episode linked updates ────────────────────────────────────────────

export function processMissingEpisodeCreated(episode: MissingEpisode, createdBy: string): void {
  // 1. Chronology
  db.chronology.create({
    child_id: episode.child_id,
    date: episode.date_missing,
    time: episode.time_missing,
    category: "missing",
    title: `Missing from care episode (${episode.reference}) — ${episode.risk_level.toUpperCase()} risk`,
    description: `${episode.child_id} missing from ${episode.location_last_seen}. ${episode.contextual_safeguarding_risk ? "Contextual safeguarding risk identified." : ""}`,
    significance: episode.risk_level === "critical" || episode.risk_level === "high" ? "critical" : "significant",
    recorded_by: createdBy,
    linked_incident_id: episode.linked_incident_id,
    home_id: episode.home_id,
  });

  // 2. Return interview task
  if (!episode.return_interview_completed) {
    createTaskRecord({
      title: `Return to home interview — ${episode.reference}`,
      description: "Complete the return-to-home interview within 72 hours of return. Explore contacts, wellbeing, and any safeguarding concerns.",
      category: "safeguarding",
      priority: "urgent",
      status: "not_started",
      assigned_to: "staff_darren",
      assigned_role: "registered_manager",
      due_date: episode.date_returned || todayStr(),
      start_date: null,
      completed_at: null,
      completed_by: null,
      estimated_minutes: 45,
      actual_minutes: null,
      recurring: false,
      recurring_schedule: null,
      requires_sign_off: true,
      signed_off_by: null,
      signed_off_at: null,
      evidence_note: null,
      evidence_files: [],
      escalated: false,
      escalated_to: null,
      escalated_at: null,
      escalation_reason: null,
      linked_child_id: episode.child_id,
      linked_incident_id: episode.linked_incident_id,
      linked_document_id: null,
      parent_task_id: null,
      home_id: episode.home_id,
      tags: ["auto_generated", "missing_from_care", "return_interview"],
    });
  }

  // 3. Notification
  db.notifications.create({
    home_id: episode.home_id,
    recipient_id: "staff_darren",
    title: `Missing from care — ${episode.reference}`,
    body: `${episode.risk_level.toUpperCase()} risk. ${episode.reported_to_police ? "Police informed." : "Police NOT informed."} ${episode.contextual_safeguarding_risk ? "CS risk identified." : ""}`,
    type: "safeguarding",
    priority: episode.risk_level === "critical" ? "urgent" : "high",
    read: false,
    read_at: null,
    action_url: `/safeguarding`,
    entity_type: "missing_episode",
    entity_id: episode.id,
  });

  trackTimeSaved(createdBy, episode.home_id, "auto_chronology", "Chronology auto-updated from MFC episode");
  trackTimeSaved(createdBy, episode.home_id, "auto_task_creation", "Return interview task auto-created");
}

// ── Medication administration linked updates ──────────────────────────────────

export function processMedicationException(
  medId: string, childId: string, staffId: string, homeId: string,
  exceptionType: "refused" | "late" | "missed", notes: string
): void {
  // 1. Daily log
  const medExceptionLog = db.dailyLog.create({
    child_id: childId,
    date: todayStr(),
    time: new Date().toTimeString().slice(0, 5),
    entry_type: "health",
    content: `[Medication ${exceptionType}] ${notes}`,
    mood_score: null,
    staff_id: staffId,
    linked_incident_id: null,
    is_significant: exceptionType === "missed" || exceptionType === "refused",
    home_id: homeId,
  });
  void persistDailyLog(medExceptionLog); // best-effort Supabase write-through (no-op when off)

  // 2. Manager notification
  db.notifications.create({
    home_id: homeId,
    recipient_id: "staff_darren",
    title: `Medication ${exceptionType} — action required`,
    body: notes,
    type: "medication",
    priority: exceptionType === "missed" ? "urgent" : "high",
    read: false,
    read_at: null,
    action_url: `/medication`,
    entity_type: "medication_administration",
    entity_id: medId,
  });

  trackTimeSaved(staffId, homeId, "auto_notification", "Medication exception auto-notified manager");
}

// ── Building check failure linked updates ─────────────────────────────────────

export function processBuildingCheckFail(
  checkId: string, checkType: string, area: string,
  riskLevel: string, actionRequired: string, staffId: string, homeId: string
): void {
  // 1. Maintenance task
  if (riskLevel === "high" || riskLevel === "critical") {
    createTaskRecord({
      title: `URGENT: ${area} — ${checkType} failure`,
      description: actionRequired,
      category: "health_and_safety",
      priority: riskLevel === "critical" ? "urgent" : "high",
      status: "not_started",
      assigned_to: "staff_ryan",
      assigned_role: "deputy_manager",
      due_date: todayStr(),
      start_date: null,
      completed_at: null,
      completed_by: null,
      estimated_minutes: 60,
      actual_minutes: null,
      recurring: false,
      recurring_schedule: null,
      requires_sign_off: true,
      signed_off_by: null,
      signed_off_at: null,
      evidence_note: null,
      evidence_files: [],
      escalated: false,
      escalated_to: null,
      escalated_at: null,
      escalation_reason: null,
      linked_child_id: null,
      linked_incident_id: null,
      linked_document_id: null,
      parent_task_id: null,
      home_id: homeId,
      tags: ["auto_generated", "building_safety", riskLevel],
    });
  }

  // 2. Manager notification
  db.notifications.create({
    home_id: homeId,
    recipient_id: "staff_darren",
    title: `${riskLevel === "critical" ? "🔴 CRITICAL" : "⚠️"} Building check failed — ${area}`,
    body: actionRequired,
    type: "building",
    priority: riskLevel === "critical" ? "urgent" : "high",
    read: false,
    read_at: null,
    action_url: `/buildings`,
    entity_type: "building_check",
    entity_id: checkId,
  });
}

// ── Vehicle defect linked updates ─────────────────────────────────────────────

export function processVehicleDefect(
  vehicleId: string, registration: string, defects: string,
  severity: "advisory" | "fail", staffId: string, homeId: string
): void {
  // 1. Auto-task
  createTaskRecord({
    title: `Vehicle defect — ${registration}`,
    description: defects,
    category: "maintenance",
    priority: severity === "fail" ? "urgent" : "high",
    status: "not_started",
    assigned_to: "staff_ryan",
    assigned_role: "deputy_manager",
    due_date: todayStr(),
    start_date: null,
    completed_at: null,
    completed_by: null,
    estimated_minutes: 30,
    actual_minutes: null,
    recurring: false,
    recurring_schedule: null,
    requires_sign_off: false,
    signed_off_by: null,
    signed_off_at: null,
    evidence_note: null,
    evidence_files: [],
    escalated: false,
    escalated_to: null,
    escalated_at: null,
    escalation_reason: null,
    linked_child_id: null,
    linked_incident_id: null,
    linked_document_id: null,
    parent_task_id: null,
    home_id: homeId,
    tags: ["auto_generated", "vehicle", severity],
  });

  // 2. If fail, flag as restricted
  if (severity === "fail") {
    const vehicle = db.vehicles.findById(vehicleId);
    if (vehicle) vehicle.status = "restricted";
  }

  // 3. Notification
  db.notifications.create({
    home_id: homeId,
    recipient_id: "staff_darren",
    title: `Vehicle ${severity === "fail" ? "UNSAFE" : "advisory"} — ${registration}`,
    body: defects,
    type: "vehicle",
    priority: severity === "fail" ? "urgent" : "normal",
    read: false,
    read_at: null,
    action_url: `/vehicles`,
    entity_type: "vehicle",
    entity_id: vehicleId,
  });
}

// ── Time saved tracker ────────────────────────────────────────────────────────

function trackTimeSaved(
  staffId: string, homeId: string,
  actionType: keyof typeof TIME_SAVED, description: string
): void {
  const minutes = TIME_SAVED[actionType] || 5;
  const entry = {
    id: generateId("ts"),
    home_id: homeId,
    staff_id: staffId,
    action_type: actionType as "auto_fill" | "linked_record" | "cara_draft" | "auto_task" | "auto_handover" | "one_click_summary" | "avoided_duplicate",
    minutes_saved: minutes,
    description,
    created_at: new Date().toISOString(),
  };
  // In-memory store push (we access via getStore())
  try {
    const { getStore } = require("@/lib/db/store");
    getStore().timeSaved.push(entry);
  } catch {}
}
