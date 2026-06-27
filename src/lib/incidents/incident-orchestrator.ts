// ══════════════════════════════════════════════════════════════════════════════
// INCIDENT ORCHESTRATOR
//
// The single entry point for creating an incident. Coordinates ALL side effects:
//   1. Save incident to store (with reference number generation)
//   2. Create audit log entry
//   3. Create timeline event
//   4. Generate follow-up tasks (manager review, risk review, body map, debrief)
//   5. Evaluate automation rules
//   6. Return the full result with linked updates
//
// Pure orchestration — no HTTP concerns. Called by the POST /api/incidents route.
// ══════════════════════════════════════════════════════════════════════════════

import { db, getStore } from "@/lib/db/store";
import { createIncidentRecord, createTaskRecord } from "@/lib/supabase/care-records";
import type { Incident, Task } from "@/types";
import { recordEvent } from "@/lib/timeline/timeline-service";
import type { TimelineEvent } from "@/lib/timeline/types";
import { evaluateRules, getApplicableRules } from "@/lib/automation/automation-engine";
import { logInteraction } from "@/lib/cara/cara-config";
import { captureDomainEvent } from "@/lib/event-capture/capture-event-service";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreateIncidentInput {
  child_id: string;
  type: string;
  severity: string;
  date: string;
  time: string;
  location?: string;
  description: string;
  immediate_action: string;
  reported_by: string;
  witnesses?: string[];
  body_map_required?: boolean;
  notifications?: { role: string; name: string; method: string }[];
  home_id?: string;
}

export interface IncidentOrchestrationResult {
  incident: Incident;
  audit_entry: AuditEntry;
  timeline_event: TimelineEvent;
  tasks_created: Task[];
  automation_runs: { rule_name: string; actions: string[] }[];
  linked_updates: string[];
  /** Canonical spine event id written through at creation (forms-as-views), or null. */
  canonical_event_id?: string | null;
}

export interface AuditEntry {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  actor_id: string;
  summary: string;
  detail: Record<string, unknown>;
  risk_level: string;
  created_at: string;
}

// ─── Reference Number Generator ─────────────────────────────────────────────

function generateReference(): string {
  const store = getStore();
  const year = new Date().getFullYear();
  const existingCount = (store.incidents as unknown[]).length;
  const seq = String(existingCount + 1).padStart(4, "0");
  return `INC-${year}-${seq}`;
}

// ─── Audit Logger ────────────────────────────────────────────────────────────

const auditLog: AuditEntry[] = [];

function createAuditEntry(
  eventType: string,
  entityType: string,
  entityId: string,
  actorId: string,
  summary: string,
  detail: Record<string, unknown>,
  riskLevel: string,
): AuditEntry {
  const entry: AuditEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    actor_id: actorId,
    summary,
    detail,
    risk_level: riskLevel,
    created_at: new Date().toISOString(),
  };
  auditLog.push(entry);
  // Keep last 1000 entries
  if (auditLog.length > 1000) auditLog.splice(0, auditLog.length - 1000);
  return entry;
}

export function getAuditLog(): AuditEntry[] {
  return [...auditLog];
}

// ─── Task Generator ──────────────────────────────────────────────────────────

function createFollowUpTasks(incident: Incident): Task[] {
  const tasks: Task[] = [];
  const now = new Date();

  // 1. Manager review task — always created for high/critical, optional for medium
  if (incident.severity === "critical" || incident.severity === "high") {
    const dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    tasks.push(
      createTaskRecord({
        title: `Review incident ${incident.reference}: ${incident.type.replace(/_/g, " ")}`,
        description: `Manager review required for ${incident.severity} severity incident involving ${incident.child_id}. Review the incident record, assess immediate actions taken, determine if further safeguarding measures are needed, and add oversight notes.`,
        status: "pending",
        priority: incident.severity === "critical" ? "urgent" : "high",
        category: "safeguarding",
        assigned_to: null, // Registered Manager picks up
        due_date: dueDate.toISOString().slice(0, 10),
        child_id: incident.child_id,
        home_id: incident.home_id,
        linked_record_type: "incident",
        linked_record_id: incident.id,
        created_by: "system",
        requires_sign_off: true,
      } as Partial<Task>),
    );
  }

  // 2. Risk assessment review — for high/critical
  if (incident.severity === "critical" || incident.severity === "high") {
    const dueDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours
    tasks.push(
      createTaskRecord({
        title: `Review risk assessment for ${incident.child_id} following incident ${incident.reference}`,
        description: `Incident ${incident.reference} (${incident.severity}) may require an update to the child's risk assessment. Review current controls and triggers.`,
        status: "pending",
        priority: "high",
        category: "safeguarding",
        assigned_to: null,
        due_date: dueDate.toISOString().slice(0, 10),
        child_id: incident.child_id,
        home_id: incident.home_id,
        linked_record_type: "incident",
        linked_record_id: incident.id,
        created_by: "system",
      } as Partial<Task>),
    );
  }

  // 3. Body map task — if required
  if (incident.body_map_required) {
    tasks.push(
      createTaskRecord({
        title: `Complete body map for ${incident.child_id} — incident ${incident.reference}`,
        description: `A body map was flagged as required during incident recording. Complete and attach to the incident record.`,
        status: "pending",
        priority: "urgent",
        category: "safeguarding",
        assigned_to: incident.reported_by,
        due_date: now.toISOString().slice(0, 10), // Same day
        child_id: incident.child_id,
        home_id: incident.home_id,
        linked_record_type: "incident",
        linked_record_id: incident.id,
        created_by: "system",
      } as Partial<Task>),
    );
  }

  // 4. PI Debrief task — for physical interventions
  if (incident.type === "physical_intervention") {
    const dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    tasks.push(
      createTaskRecord({
        title: `Conduct post-incident debrief — ${incident.reference}`,
        description: `Physical intervention recorded. A post-incident debrief must be conducted with the child and staff involved within 24 hours. Record the child's views and any lessons learned.`,
        status: "pending",
        priority: "urgent",
        category: "safeguarding",
        assigned_to: null,
        due_date: dueDate.toISOString().slice(0, 10),
        child_id: incident.child_id,
        home_id: incident.home_id,
        linked_record_type: "incident",
        linked_record_id: incident.id,
        created_by: "system",
      } as Partial<Task>),
    );
  }

  // 5. Reg 40 notification check — for notifiable events
  const notifiableTypes = [
    "safeguarding_concern", "missing_from_care", "physical_intervention",
    "self_harm", "allegation", "police_involvement", "hospital_attendance",
    "exploitation_concern",
  ];
  if (notifiableTypes.includes(incident.type) || incident.severity === "critical") {
    tasks.push(
      createTaskRecord({
        title: `Assess Reg 40 notification requirement — ${incident.reference}`,
        description: `This incident type (${incident.type.replace(/_/g, " ")}) may require notification to Ofsted under Regulation 40. Assess within 24 hours and submit notification if required.`,
        status: "pending",
        priority: "urgent",
        category: "compliance",
        assigned_to: null,
        due_date: now.toISOString().slice(0, 10),
        child_id: incident.child_id,
        home_id: incident.home_id,
        linked_record_type: "incident",
        linked_record_id: incident.id,
        created_by: "system",
      } as Partial<Task>),
    );
  }

  // 6. Medium severity — create a follow-up check task
  if (incident.severity === "medium") {
    const dueDate = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours
    tasks.push(
      createTaskRecord({
        title: `Follow-up check on ${incident.child_id} after incident ${incident.reference}`,
        description: `Medium severity incident recorded. Check in with the child within 3 days to assess wellbeing and any ongoing impact.`,
        status: "pending",
        priority: "medium",
        category: "young_person_plans",
        assigned_to: incident.reported_by,
        due_date: dueDate.toISOString().slice(0, 10),
        child_id: incident.child_id,
        home_id: incident.home_id,
        linked_record_type: "incident",
        linked_record_id: incident.id,
        created_by: "system",
      } as Partial<Task>),
    );
  }

  return tasks;
}

// ─── Main Orchestrator ───────────────────────────────────────────────────────

export function createIncident(input: CreateIncidentInput): IncidentOrchestrationResult {
  const now = new Date().toISOString();

  // ── 1. Generate reference and save to store ────────────────────────────────
  const reference = generateReference();
  const requiresOversight = input.severity === "high" || input.severity === "critical";

  const incident = createIncidentRecord({
    reference,
    type: input.type as Incident["type"],
    severity: input.severity as Incident["severity"],
    child_id: input.child_id,
    date: input.date,
    time: input.time,
    location: input.location ?? null,
    description: input.description,
    immediate_action: input.immediate_action,
    reported_by: input.reported_by,
    witnesses: input.witnesses ?? [],
    body_map_required: input.body_map_required ?? false,
    body_map_completed: false,
    body_map_url: null,
    notifications: (input.notifications ?? []) as Incident["notifications"],
    requires_oversight: requiresOversight,
    oversight_note: null,
    oversight_by: null,
    oversight_at: null,
    status: "open",
    outcome: null,
    lessons_learned: null,
    linked_task_ids: [],
    linked_document_ids: [],
    home_id: input.home_id ?? "home_oak",
    created_by: input.reported_by,
    updated_by: input.reported_by,
  });

  // ── 2. Create audit log entry ──────────────────────────────────────────────
  const auditEntry = createAuditEntry(
    "incident_created",
    "incident",
    incident.id,
    input.reported_by,
    `Incident ${reference} logged: ${input.type.replace(/_/g, " ")} (${input.severity}) for child ${input.child_id}`,
    {
      reference,
      type: input.type,
      severity: input.severity,
      child_id: input.child_id,
      requires_oversight: requiresOversight,
      body_map_required: input.body_map_required ?? false,
      notifications_count: (input.notifications ?? []).length,
    },
    input.severity === "critical" ? "critical" : input.severity === "high" ? "high" : input.severity === "medium" ? "medium" : "low",
  );

  // ── 3. Create timeline event ───────────────────────────────────────────────
  const timelineEvent = recordEvent({
    event_type: "incident_submitted",
    child_id: input.child_id,
    staff_id: input.reported_by,
    home_id: input.home_id ?? "home_oak",
    title: `Incident ${reference}: ${input.type.replace(/_/g, " ")}`,
    summary: `${input.severity.charAt(0).toUpperCase() + input.severity.slice(1)} severity incident logged. ${input.description.slice(0, 120)}${input.description.length > 120 ? "..." : ""}`,
    linked_record_type: "incident",
    linked_record_id: incident.id,
    tags: [input.type, input.severity, requiresOversight ? "requires_oversight" : "standard"].filter(Boolean),
    risk_level: input.severity === "critical" ? "critical" : input.severity === "high" ? "high" : input.severity === "medium" ? "medium" : "low",
    visibility_level: ["safeguarding_concern", "allegation", "exploitation_concern"].includes(input.type) ? "safeguarding" : "standard",
    created_by: input.reported_by,
  });

  // ── 4. Generate follow-up tasks ────────────────────────────────────────────
  const tasksCreated = createFollowUpTasks(incident);

  // Link task IDs back to the incident
  const taskIds = tasksCreated.map((t) => t.id);
  const incidentIndex = getStore().incidents.findIndex((i: Incident) => i.id === incident.id);
  if (incidentIndex !== -1) {
    (getStore().incidents[incidentIndex] as Incident).linked_task_ids = taskIds;
  }

  // ── 5. Evaluate automation rules ───────────────────────────────────────────
  const triggerData = {
    incident_id: incident.id,
    reference,
    type: input.type,
    severity: input.severity,
    child_id: input.child_id,
    child_name: input.child_id,
    reported_by: input.reported_by,
    home_id: input.home_id ?? "home_oak",
    requires_oversight: requiresOversight,
    date: input.date,
  };

  const automationRuns: { rule_name: string; actions: string[] }[] = [];

  // Evaluate incident_submitted rules
  const submittedRules = getApplicableRules("incident_submitted");
  for (const rule of submittedRules) {
    const runs = evaluateRules("incident_submitted", triggerData, [rule]);
    for (const run of runs) {
      automationRuns.push({
        rule_name: rule.name,
        actions: run.actions_executed.map((a) => a.action),
      });
    }
  }

  // If high/critical, also evaluate incident_severity_high
  if (input.severity === "high" || input.severity === "critical") {
    const severityRules = getApplicableRules("incident_severity_high");
    for (const rule of severityRules) {
      const runs = evaluateRules("incident_severity_high", triggerData, [rule]);
      for (const run of runs) {
        automationRuns.push({
          rule_name: rule.name,
          actions: run.actions_executed.map((a) => a.action),
        });
      }
    }
  }

  // ── 6. Log to Cara interaction system (for context awareness) ──────────────
  logInteraction({
    user_id: input.reported_by,
    child_id: input.child_id,
    conversation_id: `incident_${incident.id}`,
    request_type: "incident_creation",
    prompt_summary: `Incident ${reference} created: ${input.type} (${input.severity})`,
    response_summary: `${tasksCreated.length} follow-up tasks generated. ${automationRuns.length} automation rules evaluated.`,
    tools_used: ["create_incident", "create_tasks", "create_timeline_event", "create_audit_entry"],
    risk_level: input.severity === "critical" || input.severity === "high" ? "high" : input.severity === "medium" ? "medium" : "low",
    requires_review: requiresOversight,
  });

  // ── 7. Build linked_updates summary ────────────────────────────────────────
  const linkedUpdates: string[] = [
    `Incident ${reference} saved`,
    `Audit trail entry created`,
    `Timeline event recorded`,
  ];
  for (const task of tasksCreated) {
    linkedUpdates.push(`Task created: ${task.title}`);
  }
  for (const run of automationRuns) {
    linkedUpdates.push(`Automation: ${run.rule_name} (${run.actions.length} actions)`);
  }
  if (requiresOversight) {
    linkedUpdates.push("Flagged for manager oversight");
  }

  // ── 8. Write through the canonical event spine (forms-as-views) ─────────────
  // Emit a validated canonical event under the projection's stable id
  // (evt_inc_<id>) so it de-dupes by id (persisted wins, no double-count) and the
  // create path — not just the projection — is the source of the spine event.
  // Mirrors projectIncident's type/risk/summary. Best-effort: never blocks creation.
  let canonicalEventId: string | null = null;
  try {
    const isSafeguarding = /safeguard/i.test(input.type);
    const sevMap: Record<string, "low" | "medium" | "high" | "critical"> = { low: "low", medium: "medium", high: "high", critical: "critical" };
    let risk = sevMap[input.severity] ?? "medium";
    if (isSafeguarding && (risk === "low" || risk === "medium")) risk = "high";
    const tags = [isSafeguarding ? "safeguarding" : "incident", input.type, input.severity].filter(Boolean) as string[];
    if (requiresOversight) tags.push("oversight_required");
    if (input.body_map_required) tags.push("body_map_outstanding");
    const t = /^\d{2}:\d{2}$/.test(input.time) ? input.time : "00:00";
    const outcome = captureDomainEvent(
      {
        eventType: isSafeguarding ? "safeguarding" : "incident",
        childId: input.child_id,
        staffId: input.reported_by,
        homeId: input.home_id ?? "home_oak",
        occurredAt: `${input.date}T${t}:00.000Z`,
        createdBy: input.reported_by,
        summary: `${isSafeguarding ? "Safeguarding" : "Incident"} ${reference}: ${(input.description ?? input.type).slice(0, 140)}`,
        riskLevel: risk,
        structuredTags: tags,
        linkedTasks: taskIds,
      },
      { id: `evt_inc_${incident.id}`, now },
    );
    if (outcome.persisted) {
      canonicalEventId = outcome.event!.id;
      linkedUpdates.push("Captured to the canonical event spine — surfaces across the timeline and intelligence");
    }
  } catch {
    // Write-through is best-effort; never block the incident creation.
  }

  return {
    incident,
    audit_entry: auditEntry,
    timeline_event: timelineEvent,
    tasks_created: tasksCreated,
    automation_runs: automationRuns,
    linked_updates: linkedUpdates,
    canonical_event_id: canonicalEventId,
  };
}
