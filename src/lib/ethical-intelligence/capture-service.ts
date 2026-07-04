// ══════════════════════════════════════════════════════════════════════════════
// CARA — ETHICAL INTELLIGENCE CAPTURE SERVICE (the write path)
//
// Creates learning events on the ethical cycle and appends stage records to
// them — REFUSING any stage that is not traceable to a source record:
//
//   "If Cara cannot trace it, Cara cannot claim it."
//
// Every mutation appends an audit-trail entry. Mutates only the in-memory
// store (same class as every other write path; Supabase persistence activates
// with migration 422 when the platform's dual-mode dal adopts it).
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import {
  emptyIntegrationChecklist,
  isTraceable,
} from "./ethical-intelligence-engine";
import type {
  EthicalIntegrationChecklist,
  EthicalIntelligenceAction,
  EthicalIntelligenceAuditEntry,
  EthicalIntelligenceDecision,
  EthicalIntelligenceEvent,
  EthicalIntelligenceInsight,
  EthicalIntelligenceLearning,
  EthicalIntelligenceOutcome,
  EthicalSourceRef,
} from "./types";

// ── Results (never throw across the API boundary) ─────────────────────────────

export type CaptureResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string };

const UNTRACED =
  "Refused: this entry cites no source record. If Cara cannot trace it, Cara cannot claim it — link at least one record (recordType + recordId).";

const nonEmpty = (s?: string | null) => !!s && s.trim().length > 0;

function audit(actor: string, action: string, stage?: EthicalIntelligenceAuditEntry["stage"], detail?: string): EthicalIntelligenceAuditEntry {
  return { id: generateId("eia"), at: new Date().toISOString(), actor, action, stage, detail };
}

// ── Event creation ─────────────────────────────────────────────────────────────

export interface CreateEthicalEventInput {
  createdBy: string;
  homeId?: string;
  childId?: string;
  childName?: string;
  /** The operational record this learning event grows from. Mandatory. */
  trigger: EthicalSourceRef;
  triggerSummary: string;
  whatHappened: string;
  childExperience?: string;
  staffObserved?: string;
}

export function createEthicalEvent(input: CreateEthicalEventInput): CaptureResult<EthicalIntelligenceEvent> {
  if (!isTraceable([input.trigger])) return { ok: false, reason: UNTRACED };
  if (!nonEmpty(input.whatHappened)) return { ok: false, reason: "Refused: record what happened — the experience stage cannot be empty." };
  if (!nonEmpty(input.createdBy)) return { ok: false, reason: "Refused: a named human must create the event." };

  const now = new Date().toISOString();
  const event: EthicalIntelligenceEvent = {
    id: generateId("eie"),
    createdAt: now,
    updatedAt: now,
    createdBy: input.createdBy,
    homeId: input.homeId,
    childId: input.childId,
    childName: input.childName,
    trigger: input.trigger,
    triggerSummary: input.triggerSummary,
    whatHappened: input.whatHappened,
    childExperience: input.childExperience,
    staffObserved: input.staffObserved,
    insights: [],
    decisions: [],
    actions: [],
    outcomes: [],
    learning: [],
    integration: emptyIntegrationChecklist(),
    auditTrail: [audit(input.createdBy, "event_created", "experience", input.triggerSummary)],
  };
  db.ethicalIntelligenceEvents.append(event);
  return { ok: true, value: event };
}

// ── Stage appends (each enforces traceability) ─────────────────────────────────

function findEvent(eventId: string): EthicalIntelligenceEvent | undefined {
  return db.ethicalIntelligenceEvents.findById(eventId);
}

function touch(event: EthicalIntelligenceEvent): void {
  event.updatedAt = new Date().toISOString();
}

export function recordInsight(
  eventId: string,
  actor: string,
  input: Omit<EthicalIntelligenceInsight, "id" | "capturedAt" | "capturedBy">,
): CaptureResult<EthicalIntelligenceInsight> {
  const event = findEvent(eventId);
  if (!event) return { ok: false, reason: "Event not found." };
  if (!isTraceable(input.sourceRecords)) return { ok: false, reason: UNTRACED };
  if (!nonEmpty(input.interpretation)) return { ok: false, reason: "Refused: record what was interpreted from the information." };

  const insight: EthicalIntelligenceInsight = {
    ...input,
    id: generateId("eii"),
    capturedAt: new Date().toISOString(),
    capturedBy: actor,
  };
  event.insights.push(insight);
  event.auditTrail.push(audit(actor, "insight_recorded", "insight"));
  touch(event);
  return { ok: true, value: insight };
}

export function recordDecision(
  eventId: string,
  input: Omit<EthicalIntelligenceDecision, "id" | "capturedAt">,
): CaptureResult<EthicalIntelligenceDecision> {
  const event = findEvent(eventId);
  if (!event) return { ok: false, reason: "Event not found." };
  if (!isTraceable(input.sourceRecords)) return { ok: false, reason: UNTRACED };
  if (!nonEmpty(input.decisionMaker)) {
    return { ok: false, reason: "Refused: a decision must name the human who made it — Cara never makes the decision." };
  }
  if (!nonEmpty(input.decisionSummary)) return { ok: false, reason: "Refused: record the decision that was made." };

  const decision: EthicalIntelligenceDecision = {
    ...input,
    id: generateId("eid"),
    capturedAt: new Date().toISOString(),
  };
  event.decisions.push(decision);
  event.auditTrail.push(audit(input.decisionMaker, "decision_recorded", "decision", input.decisionSummary));
  touch(event);
  return { ok: true, value: decision };
}

export function recordAction(
  eventId: string,
  actor: string,
  input: Omit<EthicalIntelligenceAction, "id" | "capturedAt" | "capturedBy">,
): CaptureResult<EthicalIntelligenceAction> {
  const event = findEvent(eventId);
  if (!event) return { ok: false, reason: "Event not found." };
  if (!isTraceable(input.sourceRecords)) return { ok: false, reason: UNTRACED };
  if (!nonEmpty(input.actionTaken)) return { ok: false, reason: "Refused: record what action was taken." };

  const action: EthicalIntelligenceAction = {
    ...input,
    id: generateId("eiact"),
    capturedAt: new Date().toISOString(),
    capturedBy: actor,
  };
  event.actions.push(action);
  event.auditTrail.push(audit(actor, "action_recorded", "impact"));
  touch(event);
  return { ok: true, value: action };
}

export function recordOutcome(
  eventId: string,
  actor: string,
  input: Omit<EthicalIntelligenceOutcome, "id" | "capturedAt" | "capturedBy">,
): CaptureResult<EthicalIntelligenceOutcome> {
  const event = findEvent(eventId);
  if (!event) return { ok: false, reason: "Event not found." };
  if (!isTraceable(input.sourceRecords)) return { ok: false, reason: UNTRACED };
  if (!nonEmpty(input.whatChanged)) return { ok: false, reason: "Refused: record what changed — “too early to say” is a valid, honest answer." };

  const outcome: EthicalIntelligenceOutcome = {
    ...input,
    id: generateId("eio"),
    capturedAt: new Date().toISOString(),
    capturedBy: actor,
  };
  event.outcomes.push(outcome);
  event.auditTrail.push(audit(actor, "outcome_recorded", "impact", input.direction));
  if (input.reviewedAt || input.reviewedBy) {
    event.integration.outcomeReviewed = true;
  }
  touch(event);
  return { ok: true, value: outcome };
}

export function recordLearning(
  eventId: string,
  actor: string,
  input: Omit<EthicalIntelligenceLearning, "id" | "capturedAt" | "capturedBy">,
): CaptureResult<EthicalIntelligenceLearning> {
  const event = findEvent(eventId);
  if (!event) return { ok: false, reason: "Event not found." };
  if (!isTraceable(input.sourceRecords)) return { ok: false, reason: UNTRACED };
  if (!nonEmpty(input.whatWasLearned)) return { ok: false, reason: "Refused: record what was learned." };

  const learning: EthicalIntelligenceLearning = {
    ...input,
    id: generateId("eil"),
    capturedAt: new Date().toISOString(),
    capturedBy: actor,
  };
  event.learning.push(learning);
  event.auditTrail.push(audit(actor, "learning_recorded", "learning"));
  touch(event);
  return { ok: true, value: learning };
}

// ── Integration checklist ──────────────────────────────────────────────────────

export function updateIntegration(
  eventId: string,
  actor: string,
  updates: Partial<EthicalIntegrationChecklist>,
): CaptureResult<EthicalIntegrationChecklist> {
  const event = findEvent(eventId);
  if (!event) return { ok: false, reason: "Event not found." };

  const keys = Object.keys(updates) as Array<keyof EthicalIntegrationChecklist>;
  if (keys.length === 0) return { ok: false, reason: "No integration answers supplied." };
  for (const key of keys) {
    const v = updates[key];
    if (v !== true && v !== false && v !== null) {
      return { ok: false, reason: `Invalid answer for ${String(key)} — must be true, false or null (unanswered).` };
    }
    event.integration[key] = v as boolean | null;
  }
  event.auditTrail.push(audit(actor, "integration_updated", "integration", keys.join(", ")));
  touch(event);
  return { ok: true, value: event.integration };
}

/** Oversight sign-off stamps the cycle — called from the sign-off route. */
export function markOversightCompleted(eventId: string, actor: string): CaptureResult<EthicalIntegrationChecklist> {
  return updateIntegration(eventId, actor, { managementOversightCompleted: true });
}

// ── Reads ──────────────────────────────────────────────────────────────────────

export function listEthicalEvents(filter?: { childId?: string; triggerRecordId?: string }): EthicalIntelligenceEvent[] {
  let events = db.ethicalIntelligenceEvents.findAll();
  if (filter?.childId) events = events.filter((e) => e.childId === filter.childId);
  if (filter?.triggerRecordId) events = events.filter((e) => e.trigger.recordId === filter.triggerRecordId);
  return [...events].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getEthicalEvent(eventId: string): EthicalIntelligenceEvent | undefined {
  return findEvent(eventId);
}
