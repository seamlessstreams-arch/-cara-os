// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CAPTURE EVENT SERVICE (the real write path)
//
// Turns "capture once, validate once, route everywhere, never duplicate" from a
// preview into an executed write. A form submits a DRAFT; this service validates
// it once, checks for duplicates once, routes it once, and — if it passes the
// gate — PERSISTS a single canonical CornerstoneEvent to the spine
// (store.cornerstoneEvents). That one record then surfaces everywhere the spine
// is read (timeline, intelligence, evidence, conflict/duplicate checks) with no
// re-keying.
//
// Split for testability:
//   • draftToEvent / buildCapturePlan — PURE (injected id/now/today; no store).
//   • captureEvent                    — the write path (reads the live spine,
//                                       persists on a pass). Mutates only the
//                                       in-memory store, same class as the
//                                       existing POST /api/incidents.
//
// SAFETY: capture records routing INTENT only. External notifications stay
// requires_human_approval and are never auto-sent from here.
// ══════════════════════════════════════════════════════════════════════════════

import type { CornerstoneEvent, CornerstoneEventType, CornerstoneRiskLevel, CornerstoneApprovalLevel } from "@/types/cornerstone-event";
import { computeEventCapture, type EventCaptureResult } from "./event-capture-engine";
import { deriveApproval, evidenceCategoriesFor } from "@/lib/event-stream/event-projector";
import { buildLiveEventStream } from "@/lib/event-stream/live-event-stream";
import { getStore, db } from "@/lib/db/store";
import { generateId } from "@/lib/utils";

const DEFAULT_HOME = "home_oak";

export interface CaptureDraft {
  eventType: CornerstoneEventType;
  summary: string;
  homeId?: string;
  childId?: string;
  staffId?: string;
  shiftId?: string;
  occurredAt?: string;
  createdBy?: string;
  structuredTags?: string[];
  riskLevel?: CornerstoneRiskLevel;
  requiresApproval?: boolean;
  approvalLevel?: CornerstoneApprovalLevel;
  linkedDocuments?: string[];
  linkedTasks?: string[];
  linkedRisks?: string[];
  linkedNotifications?: string[];
}

export interface CapturePlan {
  event: CornerstoneEvent;
  capture: EventCaptureResult;
  persist: boolean;
  hold_reason: string | null;
}

export interface CaptureOutcome {
  persisted: boolean;
  event: CornerstoneEvent | null;
  capture: EventCaptureResult;
  hold_reason: string | null;
}

/** PURE: build a fully-formed canonical event from a draft + injected id/now. */
export function draftToEvent(draft: CaptureDraft, opts: { id: string; now: string }): CornerstoneEvent {
  const riskLevel: CornerstoneRiskLevel = draft.riskLevel ?? "low";
  const approval = deriveApproval(draft.eventType, riskLevel);
  return {
    id: opts.id,
    eventType: draft.eventType,
    homeId: draft.homeId || DEFAULT_HOME,
    childId: draft.childId,
    staffId: draft.staffId,
    shiftId: draft.shiftId,
    occurredAt: draft.occurredAt || opts.now,
    createdBy: draft.createdBy || "system",
    summary: (draft.summary ?? "").trim(),
    structuredTags: draft.structuredTags && draft.structuredTags.length > 0 ? draft.structuredTags : [draft.eventType],
    evidenceCategories: evidenceCategoriesFor(draft.eventType, riskLevel),
    riskLevel,
    requiresApproval: draft.requiresApproval ?? approval.requiresApproval,
    approvalLevel: draft.approvalLevel ?? approval.approvalLevel,
    linkedDocuments: draft.linkedDocuments ?? [],
    linkedTasks: draft.linkedTasks ?? [],
    linkedRisks: draft.linkedRisks ?? [],
    linkedNotifications: draft.linkedNotifications ?? [],
    audit: { createdAt: opts.now, updatedAt: opts.now, version: 1, changeHistory: [] },
  };
}

/**
 * PURE: validate-once + dedupe-once decision for a candidate event against the
 * existing spine. Validation errors can never be overridden; a suspected
 * duplicate is held unless opts.force is set.
 */
export function buildCapturePlan(
  candidate: CornerstoneEvent,
  existingEvents: CornerstoneEvent[],
  today?: string,
  opts?: { force?: boolean },
): CapturePlan {
  const capture = computeEventCapture({ draft: candidate, existingEvents, today });

  let persist = false;
  let hold_reason: string | null = null;
  if (!capture.validation.passed) {
    hold_reason = "Validation failed — required fields are missing. Nothing was captured.";
  } else if (capture.duplicates.suspected && !opts?.force) {
    hold_reason = "Possible duplicate of an existing event — held for confirmation. Link to the existing record, or re-capture with force to override.";
  } else {
    persist = true;
  }
  return { event: candidate, capture, persist, hold_reason };
}

/**
 * The write path. Reads the live spine, builds the candidate, runs the
 * validate-once/dedupe-once gate, and persists the canonical event on a pass.
 * id/now/today are injectable for deterministic tests.
 */
export function captureEvent(
  draft: CaptureDraft,
  opts?: { id?: string; now?: string; today?: string; force?: boolean },
): CaptureOutcome {
  const now = opts?.now ?? new Date().toISOString();
  const today = opts?.today ?? now.slice(0, 10);
  const id = opts?.id ?? `evt_${generateId("cap")}`;

  const store = getStore() as any;
  const existingEvents = buildLiveEventStream(store).events;
  const candidate = draftToEvent(draft, { id, now });
  const plan = buildCapturePlan(candidate, existingEvents, today, { force: opts?.force });

  if (plan.persist) {
    db.cornerstoneEvents.append(plan.event);
  }

  return {
    persisted: plan.persist,
    event: plan.persist ? plan.event : null,
    capture: plan.capture,
    hold_reason: plan.hold_reason,
  };
}
