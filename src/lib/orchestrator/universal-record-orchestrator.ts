// ══════════════════════════════════════════════════════════════════════════════
// UNIVERSAL RECORD ORCHESTRATOR
//
// The single entry point for creating ANY record type. Coordinates ALL side
// effects so that every record — regardless of type — flows through the same
// pipeline:
//
//   1. Save record to store (with reference number generation)
//   2. Create audit log entry
//   3. Create timeline event
//   4. Generate follow-up tasks (type-specific)
//   5. Detect alerts (safeguarding language, severity, missing info)
//   6. Log to ARIA context
//   7. Return linked_updates summary
//
// "Enter once. Use everywhere."
//
// Pure orchestration — no HTTP concerns. Called by POST /api/v1/records.
// ══════════════════════════════════════════════════════════════════════════════

import { getStore } from "@/lib/db/store";
import { db } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { recordEvent } from "@/lib/timeline/timeline-service";
import { logInteraction } from "@/lib/aria/aria-config";
import { createIncident } from "@/lib/incidents/incident-orchestrator";
import { createDailyLog } from "@/lib/daily-log/daily-log-orchestrator";
import type { Task } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreateRecordInput {
  record_type: string;
  child_id?: string;
  staff_id: string;
  home_id?: string;
  title: string;
  description: string;
  severity?: string;
  data: Record<string, unknown>;
}

export interface OrchestrationResult {
  record: Record<string, unknown>;
  audit_entry: Record<string, unknown>;
  timeline_event: Record<string, unknown>;
  tasks_created: Record<string, unknown>[];
  linked_updates: string[];
  alerts: string[];
}

// ─── Record Type Configuration ───────────────────────────────────────────────

/** Maps record_type to a short prefix for reference numbers. */
const RECORD_PREFIX_MAP: Record<string, string> = {
  safeguarding_concern: "SAF",
  risk_assessment: "RSK",
  care_plan: "CPL",
  key_work_session: "KWS",
  direct_work: "DWK",
  health_update: "HLT",
  education_update: "EDU",
  family_contact: "FAM",
  professional_contact: "PRO",
  supervision: "SUP",
  welfare_check: "WEL",
  complaint: "CMP",
  medication: "MED",
  restraint: "RST",
  missing_from_care: "MFC",
  fire_drill: "FDR",
  vehicle_check: "VCK",
  observation: "OBS",
  training_record: "TRN",
  wellbeing_check: "WBC",
  performance_support: "PSP",
  health_safety_check: "HSC",
  maintenance_request: "MNT",
  home_audit: "AUD",
};

/** Maps record_type to the timeline event_type string. */
const TIMELINE_EVENT_TYPE_MAP: Record<string, string> = {
  safeguarding_concern: "safeguarding_concern_raised",
  risk_assessment: "risk_assessment_created",
  care_plan: "care_plan_updated",
  key_work_session: "key_work_session_completed",
  direct_work: "direct_work_recorded",
  health_update: "health_update_recorded",
  education_update: "education_update_recorded",
  family_contact: "family_contact_recorded",
  professional_contact: "professional_contact_recorded",
  supervision: "staff_supervision_completed",
  welfare_check: "welfare_check_completed",
  complaint: "complaint_submitted",
  medication: "medication_administered",
  restraint: "restraint_recorded",
  missing_from_care: "missing_from_care_reported",
  fire_drill: "fire_drill_completed",
  vehicle_check: "vehicle_check_completed",
  observation: "observation_recorded",
  training_record: "staff_training_completed",
  wellbeing_check: "staff_wellbeing_check",
  performance_support: "staff_performance_support",
  health_safety_check: "health_safety_check_completed",
  maintenance_request: "maintenance_logged",
  home_audit: "home_audit_completed",
};

/** Record types that are inherently high-risk by default. */
const HIGH_RISK_TYPES = new Set([
  "safeguarding_concern",
  "restraint",
  "missing_from_care",
]);

/** Record types that should have safeguarding-level visibility on the timeline. */
const SAFEGUARDING_VISIBILITY_TYPES = new Set([
  "safeguarding_concern",
  "restraint",
  "missing_from_care",
]);

/** Maps record_type to its store collection key (if one exists). */
const STORE_COLLECTION_MAP: Record<string, string> = {
  safeguarding_concern: "safeguardingConcerns",
  risk_assessment: "riskAssessments",
  care_plan: "carePlans",
  key_work_session: "keyWorkingSessions",
  direct_work: "directWork",
  health_update: "healthUpdates",
  education_update: "educationRecords",
  family_contact: "familyContacts",
  professional_contact: "professionalContacts",
  supervision: "supervisions",
  welfare_check: "welfareChecks",
  complaint: "complaints",
  medication: "medicationAdministrations",
  restraint: "restraints",
  missing_from_care: "missingEpisodes",
  fire_drill: "fireDrills",
  vehicle_check: "vehicleChecks",
  observation: "observations",
  training_record: "trainingRecords",
  wellbeing_check: "staffWellbeingChecks",
  performance_support: "performanceSupportPlans",
  health_safety_check: "buildingChecks",
  maintenance_request: "maintenanceRequests",
  home_audit: "homeAudits",
};

// ─── Reference Number Generator ─────────────────────────────────────────────

function generateReference(recordType: string): string {
  const store = getStore();
  const prefix = RECORD_PREFIX_MAP[recordType] ?? "REC";
  const year = new Date().getFullYear();
  const collectionKey = STORE_COLLECTION_MAP[recordType];
  const collection = collectionKey ? (store as Record<string, unknown[]>)[collectionKey] : undefined;
  const existingCount = Array.isArray(collection) ? collection.length : 0;
  const seq = String(existingCount + 1).padStart(4, "0");
  return `${prefix}-${year}-${seq}`;
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

const auditLog: Record<string, unknown>[] = [];

function createAuditEntry(
  eventType: string,
  entityType: string,
  entityId: string,
  actorId: string,
  summary: string,
  detail: Record<string, unknown>,
  riskLevel: string,
): Record<string, unknown> {
  const entry = {
    id: generateId("audit"),
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
  if (auditLog.length > 1000) auditLog.splice(0, auditLog.length - 1000);
  return entry;
}

export function getAuditLog(): Record<string, unknown>[] {
  return [...auditLog];
}

// ─── Risk Level Resolution ──────────────────────────────────────────────────

function resolveRiskLevel(recordType: string, severity?: string): string {
  if (severity === "critical") return "critical";
  if (severity === "high") return "high";
  if (HIGH_RISK_TYPES.has(recordType)) return "high";
  if (severity === "medium") return "medium";
  if (severity === "low") return "low";
  return "none";
}

// ─── Safeguarding Language Detection ────────────────────────────────────────

const SAFEGUARDING_PATTERN = /safeguard|harm|abuse|disclosure|exploit|neglect|allegation|self[- ]?harm|suicide|trafficking|radicalisation|county lines|cse|cce|fgm/i;

function detectAlerts(input: CreateRecordInput): string[] {
  const alerts: string[] = [];
  const text = `${input.title} ${input.description}`;

  // Safeguarding language in free text
  if (SAFEGUARDING_PATTERN.test(text)) {
    alerts.push(
      "SAFEGUARDING LANGUAGE DETECTED in record content — review immediately and consider raising a safeguarding concern if not already done",
    );
  }

  // High severity flagging
  if (input.severity === "critical" || input.severity === "high") {
    alerts.push(
      `High severity (${input.severity}) record — flagged for immediate manager oversight`,
    );
  }

  // Missing child_id for child-related record types
  const childRequiredTypes = new Set([
    "safeguarding_concern", "risk_assessment", "care_plan", "key_work_session",
    "direct_work", "health_update", "education_update", "family_contact",
    "welfare_check", "medication", "restraint", "missing_from_care", "observation",
  ]);
  if (childRequiredTypes.has(input.record_type) && !input.child_id) {
    alerts.push(
      "WARNING: No child linked to this record — child-related records should reference a child_id",
    );
  }

  // Missing severity for types that should have it
  const severityExpectedTypes = new Set([
    "safeguarding_concern", "risk_assessment", "restraint", "missing_from_care", "complaint",
  ]);
  if (severityExpectedTypes.has(input.record_type) && !input.severity) {
    alerts.push(
      `WARNING: No severity set for ${input.record_type.replace(/_/g, " ")} — consider adding a severity rating`,
    );
  }

  return alerts;
}

// ─── Task Generator ─────────────────────────────────────────────────────────

function createFollowUpTasks(
  recordType: string,
  recordId: string,
  reference: string,
  input: CreateRecordInput,
): Task[] {
  const tasks: Task[] = [];
  const now = new Date();

  const makeTask = (
    title: string,
    description: string,
    priority: string,
    category: string,
    dueHours: number,
    assignedTo?: string | null,
  ): Task => {
    const dueDate = new Date(now.getTime() + dueHours * 60 * 60 * 1000);
    return db.tasks.create({
      title,
      description,
      status: "pending",
      priority,
      category,
      assigned_to: assignedTo ?? null,
      due_date: dueDate.toISOString().slice(0, 10),
      child_id: input.child_id,
      home_id: input.home_id ?? "home_oak",
      linked_record_type: recordType,
      linked_record_id: recordId,
      created_by: "system",
    } as Partial<Task>);
  };

  switch (recordType) {
    // ── Safeguarding Concern ──────────────────────────────────────────────
    case "safeguarding_concern": {
      tasks.push(makeTask(
        `RM review safeguarding concern ${reference}`,
        `Urgent review required for safeguarding concern ${reference}. Assess the concern, determine threshold, and decide on escalation pathway (MASH/LADO/s47).`,
        "urgent",
        "safeguarding",
        4, // 4 hours
      ));
      tasks.push(makeTask(
        `Notify social worker — ${reference}`,
        `Safeguarding concern ${reference} raised. Notify the child's allocated social worker and record the notification.`,
        "urgent",
        "safeguarding",
        4,
      ));
      tasks.push(makeTask(
        `Strategy discussion consideration — ${reference}`,
        `Assess whether a strategy discussion is required following safeguarding concern ${reference}. Liaise with MASH if threshold is met.`,
        "high",
        "safeguarding",
        24,
      ));
      tasks.push(makeTask(
        `Assess Reg 40 notification requirement — ${reference}`,
        `Safeguarding concern ${reference} may require notification to Ofsted under Regulation 40. Assess and submit if required.`,
        "urgent",
        "compliance",
        24,
      ));
      break;
    }

    // ── Risk Assessment ───────────────────────────────────────────────────
    case "risk_assessment": {
      const reviewWeeks = input.severity === "high" || input.severity === "critical" ? 4 : 12;
      tasks.push(makeTask(
        `Schedule risk assessment review — ${reference}`,
        `Risk assessment ${reference} created. Schedule next review in ${reviewWeeks} weeks or sooner if circumstances change.`,
        input.severity === "high" || input.severity === "critical" ? "high" : "medium",
        "safeguarding",
        reviewWeeks * 7 * 24,
      ));
      tasks.push(makeTask(
        `Implement control measures — ${reference}`,
        `Review and implement the control measures identified in risk assessment ${reference}. Ensure all staff are briefed.`,
        "high",
        "safeguarding",
        48,
      ));
      break;
    }

    // ── Care Plan ─────────────────────────────────────────────────────────
    case "care_plan": {
      const goals = (input.data.goals as string[]) ?? [];
      if (goals.length > 0) {
        for (const goal of goals) {
          tasks.push(makeTask(
            `Care plan goal: ${typeof goal === "string" ? goal.slice(0, 60) : "goal action"}`,
            `Implement care plan goal from ${reference}: ${goal}`,
            "medium",
            "young_person_plans",
            72,
          ));
        }
      } else {
        tasks.push(makeTask(
          `Review and implement care plan ${reference}`,
          `New care plan created. Review goals with the young person and begin implementation.`,
          "medium",
          "young_person_plans",
          72,
        ));
      }
      break;
    }

    // ── Missing From Care ─────────────────────────────────────────────────
    case "missing_from_care": {
      tasks.push(makeTask(
        `Return interview — ${reference}`,
        `A return interview must be conducted within 72 hours of the child's return. Record the child's views, triggers, and any safeguarding concerns identified.`,
        "urgent",
        "safeguarding",
        72,
      ));
      tasks.push(makeTask(
        `Police liaison — ${reference}`,
        `Liaise with police regarding missing episode ${reference}. Confirm reporting status and obtain updates.`,
        "urgent",
        "safeguarding",
        2,
      ));
      tasks.push(makeTask(
        `Review risk assessment following missing episode — ${reference}`,
        `Missing episode ${reference} may indicate a change in risk profile. Review and update the child's risk assessment.`,
        "high",
        "safeguarding",
        48,
      ));
      break;
    }

    // ── Restraint / Physical Intervention ─────────────────────────────────
    case "restraint": {
      tasks.push(makeTask(
        `Child debrief — ${reference}`,
        `A post-incident debrief must be conducted with the child within 24 hours of restraint ${reference}. Record the child's views and emotional state.`,
        "urgent",
        "safeguarding",
        24,
      ));
      tasks.push(makeTask(
        `Staff debrief — ${reference}`,
        `A post-incident debrief must be conducted with all staff involved in restraint ${reference} within 24 hours.`,
        "urgent",
        "safeguarding",
        24,
      ));
      tasks.push(makeTask(
        `Complete body map — ${reference}`,
        `A body map must be completed following restraint ${reference}. Check for any marks or injuries to both child and staff.`,
        "urgent",
        "safeguarding",
        4,
      ));
      tasks.push(makeTask(
        `Reg 40 notification — ${reference}`,
        `Physical intervention ${reference} requires notification to Ofsted under Regulation 40. Submit notification.`,
        "urgent",
        "compliance",
        24,
      ));
      break;
    }

    // ── Welfare Check ─────────────────────────────────────────────────────
    case "welfare_check": {
      const hasConcerns = input.data.concerns_noted === true
        || (typeof input.description === "string" && input.description.length > 50);
      if (hasConcerns) {
        tasks.push(makeTask(
          `Follow up on welfare check concerns — ${reference}`,
          `Concerns were noted during welfare check ${reference}. Follow up with the child and consider whether further action is needed.`,
          "medium",
          "young_person_plans",
          24,
        ));
      }
      break;
    }

    // ── Complaint ─────────────────────────────────────────────────────────
    case "complaint": {
      tasks.push(makeTask(
        `Acknowledge complaint — ${reference}`,
        `Complaint ${reference} has been received. Acknowledge receipt to the complainant within 24 hours.`,
        "high",
        "compliance",
        24,
      ));
      tasks.push(makeTask(
        `Investigate complaint — ${reference}`,
        `Commence investigation into complaint ${reference}. Gather evidence, interview relevant parties, and prepare findings.`,
        "high",
        "compliance",
        72,
      ));
      break;
    }

    // ── Medication ────────────────────────────────────────────────────────
    case "medication": {
      const isError = input.data.type === "error" || input.data.is_error === true;
      if (isError) {
        tasks.push(makeTask(
          `Report medication error — ${reference}`,
          `A medication error was recorded in ${reference}. Complete the medication error reporting form and notify the prescriber.`,
          "urgent",
          "health",
          4,
        ));
        tasks.push(makeTask(
          `Pharmacy liaison — medication error ${reference}`,
          `Liaise with the dispensing pharmacy regarding medication error ${reference}.`,
          "high",
          "health",
          24,
        ));
      }
      break;
    }

    // ── Supervision ───────────────────────────────────────────────────────
    case "supervision": {
      const actions = (input.data.action_points as string[]) ?? [];
      for (const action of actions) {
        tasks.push(makeTask(
          `Supervision action: ${typeof action === "string" ? action.slice(0, 60) : "action item"}`,
          `Action agreed during supervision ${reference}: ${action}`,
          "medium",
          "staff_development",
          168, // 1 week
        ));
      }
      break;
    }

    // ── All other types: no auto-tasks ────────────────────────────────────
    default:
      break;
  }

  return tasks;
}

// ─── Delegation helpers ──────────────────────────────────────────────────────

/** Route an "incident" classification through the dedicated incident orchestrator. */
function delegateToIncident(input: CreateRecordInput): OrchestrationResult {
  const now = new Date();
  const data = input.data ?? {};
  // Derive incident sub-type from classifier hints, defaulting to behaviour_incident
  const secondaryTypes = (data.secondary_types as string[]) ?? [];
  const tags = (data.tags as string[]) ?? [];
  let incidentType = "behaviour_incident";
  if (tags.includes("self-harm")) incidentType = "self_harm";
  else if (tags.includes("missing")) incidentType = "missing_from_care";
  else if (tags.includes("restraint")) incidentType = "physical_intervention";
  else if (tags.includes("bullying")) incidentType = "bullying";
  else if (tags.includes("police-involvement")) incidentType = "police_involvement";
  else if (secondaryTypes.includes("health_update")) incidentType = "hospital_attendance";

  const result = createIncident({
    child_id: input.child_id ?? "unknown",
    type: incidentType,
    severity: (input.severity as string) ?? "medium",
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    description: input.description,
    immediate_action: (data.immediate_action as string) ?? "Recorded via universal entry — see description. Immediate action to be confirmed by recording staff.",
    reported_by: input.staff_id,
    body_map_required: tags.includes("self-harm") || tags.includes("restraint"),
    home_id: input.home_id,
  });

  return {
    record: result.incident as unknown as Record<string, unknown>,
    audit_entry: result.audit_entry as unknown as Record<string, unknown>,
    timeline_event: result.timeline_event as unknown as Record<string, unknown>,
    tasks_created: result.tasks_created as unknown as Record<string, unknown>[],
    linked_updates: result.linked_updates,
    alerts: result.automation_runs.map((r) => `Automation: ${r.rule_name}`),
  };
}

/** Route a "daily_log" classification through the dedicated daily-log orchestrator. */
function delegateToDailyLog(input: CreateRecordInput): OrchestrationResult {
  const now = new Date();
  const data = input.data ?? {};
  const tags = (data.tags as string[]) ?? [];
  // Derive mood from tags/severity
  let mood: "great" | "good" | "okay" | "low" | "distressed" = "okay";
  if (tags.includes("positive")) mood = "good";
  else if (tags.includes("emotional-wellbeing")) mood = "low";
  if (input.severity === "high" || input.severity === "critical") mood = "distressed";

  const result = createDailyLog({
    child_id: input.child_id ?? "unknown",
    date: now.toISOString().slice(0, 10),
    staff_id: input.staff_id,
    mood,
    engagement: mood === "good" ? 4 : mood === "distressed" ? 2 : 3,
    key_events: input.description,
    concerns: tags.some((t) => ["safeguarding", "self-harm", "emotional-wellbeing"].includes(t)) ? input.description : "",
    follow_up_needed: ((data.flags as unknown[])?.length ?? 0) > 0 || tags.includes("emotional-wellbeing"),
    home_id: input.home_id,
  });

  return {
    record: result.log as Record<string, unknown>,
    audit_entry: result.audit_entry as Record<string, unknown>,
    timeline_event: result.timeline_event as Record<string, unknown>,
    tasks_created: [],
    linked_updates: result.linked_updates,
    alerts: result.alerts,
  };
}

// ─── Main Orchestrator ──────────────────────────────────────────────────────

export function createRecord(input: CreateRecordInput): OrchestrationResult {
  // ── Delegation: route the two specialised types to their own orchestrators ──
  // This ensures incidents land in store.incidents with an INC- reference and
  // full incident task generation, and daily logs land in store.dailyLog with
  // mood/engagement alerts — so they appear on /incidents and /daily-log.
  if (input.record_type === "incident") {
    return delegateToIncident(input);
  }
  if (input.record_type === "daily_log") {
    return delegateToDailyLog(input);
  }

  const now = new Date().toISOString();
  const linkedUpdates: string[] = [];

  // ── 1. Generate reference and save to store ────────────────────────────────
  const reference = generateReference(input.record_type);
  const id = generateId(RECORD_PREFIX_MAP[input.record_type]?.toLowerCase() ?? "rec");

  const record: Record<string, unknown> = {
    id,
    reference,
    record_type: input.record_type,
    child_id: input.child_id ?? null,
    staff_id: input.staff_id,
    home_id: input.home_id ?? "home_oak",
    title: input.title,
    description: input.description,
    severity: input.severity ?? null,
    status: "open",
    ...input.data,
    created_at: now,
    updated_at: now,
    created_by: input.staff_id,
  };

  // Push to the appropriate store collection or a generic records array
  const store = getStore();
  const collectionKey = STORE_COLLECTION_MAP[input.record_type];
  if (collectionKey && Array.isArray((store as Record<string, unknown[]>)[collectionKey])) {
    (store as Record<string, unknown[]>)[collectionKey].push(record);
  } else {
    // Generic fallback collection
    if (!Array.isArray((store as Record<string, unknown[]>).records)) {
      (store as Record<string, unknown[]>).records = [];
    }
    (store as Record<string, unknown[]>).records.push(record);
  }

  linkedUpdates.push(`${input.record_type.replace(/_/g, " ")} ${reference} saved`);

  // ── 2. Create audit log entry ──────────────────────────────────────────────
  const riskLevel = resolveRiskLevel(input.record_type, input.severity);

  const auditEntry = createAuditEntry(
    `${input.record_type}_created`,
    input.record_type,
    id,
    input.staff_id,
    `${input.record_type.replace(/_/g, " ")} ${reference} created: ${input.title}${input.child_id ? ` for child ${input.child_id}` : ""}`,
    {
      reference,
      record_type: input.record_type,
      severity: input.severity ?? null,
      child_id: input.child_id ?? null,
      title: input.title,
    },
    riskLevel,
  );

  linkedUpdates.push("Audit trail entry created");

  // ── 3. Create timeline event ───────────────────────────────────────────────
  const eventType = TIMELINE_EVENT_TYPE_MAP[input.record_type] ?? "custom_event";
  const visibilityLevel = SAFEGUARDING_VISIBILITY_TYPES.has(input.record_type) ? "safeguarding" : "standard";

  const timelineEvent = recordEvent({
    event_type: eventType as "custom_event",
    child_id: input.child_id,
    staff_id: input.staff_id,
    home_id: input.home_id ?? "home_oak",
    title: `${input.record_type.replace(/_/g, " ")} ${reference}: ${input.title}`,
    summary: input.description.slice(0, 150) + (input.description.length > 150 ? "..." : ""),
    linked_record_type: input.record_type,
    linked_record_id: id,
    tags: [input.record_type, ...(input.severity ? [input.severity] : [])],
    risk_level: riskLevel as "none" | "low" | "medium" | "high" | "critical",
    visibility_level: visibilityLevel as "standard" | "safeguarding",
    created_by: input.staff_id,
  });

  linkedUpdates.push("Timeline event recorded");

  // ── 4. Generate follow-up tasks ────────────────────────────────────────────
  const tasksCreated = createFollowUpTasks(input.record_type, id, reference, input);

  for (const task of tasksCreated) {
    linkedUpdates.push(`Task created: ${task.title}`);
  }

  // ── 5. Detect alerts ──────────────────────────────────────────────────────
  const alerts = detectAlerts(input);

  for (const alert of alerts) {
    linkedUpdates.push(`Alert: ${alert}`);
  }

  // ── 6. Log to ARIA context ────────────────────────────────────────────────
  logInteraction({
    user_id: input.staff_id,
    child_id: input.child_id ?? null,
    conversation_id: `${input.record_type}_${id}`,
    request_type: `${input.record_type}_creation`,
    prompt_summary: `${input.record_type.replace(/_/g, " ")} ${reference} created: ${input.title}`,
    response_summary: `Record saved. ${tasksCreated.length} follow-up tasks generated. ${alerts.length} alerts raised.`,
    tools_used: [
      "create_record",
      "create_timeline_event",
      "create_audit_entry",
      ...(tasksCreated.length > 0 ? ["create_tasks"] : []),
    ],
    risk_level: (riskLevel === "critical" || riskLevel === "high") ? "high" : riskLevel === "medium" ? "medium" : "low",
    requires_review: riskLevel === "critical" || riskLevel === "high",
  });

  linkedUpdates.push("ARIA intelligence context updated");

  // Dashboard + reports availability (implicit via store)
  linkedUpdates.push("Dashboard metrics updated");
  linkedUpdates.push("Available in reports and inspection evidence pack");

  // Oversight flagging
  if (riskLevel === "critical" || riskLevel === "high") {
    linkedUpdates.push("Flagged for manager oversight");
  }

  // ── 7. Return result ──────────────────────────────────────────────────────
  return {
    record,
    audit_entry: auditEntry,
    timeline_event: timelineEvent,
    tasks_created: tasksCreated as unknown as Record<string, unknown>[],
    linked_updates: linkedUpdates,
    alerts,
  };
}
