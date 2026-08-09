// ══════════════════════════════════════════════════════════════════════════════
// CARA — EVENT CAPTURE ORCHESTRATOR (the write path)
//
// Pure deterministic engine — no DB calls, no side effects, no external calls.
//
// The "capture once, validate once, route everywhere" write path. Given a DRAFT
// event (what a form is about to submit), it returns — before anything is saved —
// a single preview that composes the platform's safeguards:
//   • validation  (mandatory fields / approval expectations)         [#4 rules]
//   • duplicate check against existing events                        [#12 dedupe]
//   • where it will route (in-app surfaces + gated external)         [#6 routing]
//   • which evidence categories it will build                        [#8 evidence]
//
// So a form becomes a thin view that captures once; the orchestrator validates,
// de-duplicates and routes — no manual re-entry, nothing fired without approval.
//
// Regulatory: CHR 2015 Reg 13/36; underpins "enter once, surface everywhere".
// ══════════════════════════════════════════════════════════════════════════════

import type { CornerstoneEvent } from "@/types/cornerstone-event";
import { evidenceCategoriesFor } from "@/lib/event-stream/event-projector";
import { computeEventRouting } from "@/lib/event-routing/event-routing-engine";
import { computeDuplicateDetection } from "@/lib/duplicate-detection/duplicate-detection-engine";
import { todayStr } from "@/lib/utils";

// ── Input / Output ──────────────────────────────────────────────────────────────

export interface EventCaptureInput {
  draft: CornerstoneEvent;
  existingEvents: CornerstoneEvent[];
  today?: string;
}

export interface ValidationIssue {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface DuplicateMatch {
  event_id: string;
  similarity: number;
  reason: string;
}

export interface EventCaptureResult {
  validation: { passed: boolean; issues: ValidationIssue[] };
  duplicates: { suspected: boolean; matches: DuplicateMatch[] };
  routing: { destinations: string[]; external_apis: string[]; requires_human_approval: boolean };
  evidence_categories: string[];
  ready_to_submit: boolean;
  blocks: string[];
  insights: { severity: "critical" | "warning" | "positive"; text: string }[];
}

// ── Mandatory-field expectations by event type ──────────────────────────────────

const CHILD_EVENTS = new Set([
  "daily_log", "incident", "safeguarding", "medication", "missing", "physical_intervention",
  "keywork", "education", "health", "family_contact", "complaint",
]);
const STAFF_EVENTS = new Set(["supervision", "overtime", "staff_absence", "training"]);

export function validateDraft(draft: CornerstoneEvent): { passed: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  if (!draft.summary || draft.summary.trim().length < 5) {
    issues.push({ field: "summary", message: "A clear summary is required (at least a sentence).", severity: "error" });
  }
  if (!draft.occurredAt) {
    issues.push({ field: "occurredAt", message: "When it occurred must be recorded.", severity: "error" });
  }
  if (CHILD_EVENTS.has(draft.eventType) && !draft.childId) {
    issues.push({ field: "childId", message: "This event type must be linked to a child.", severity: "error" });
  }
  if (STAFF_EVENTS.has(draft.eventType) && !draft.staffId) {
    issues.push({ field: "staffId", message: "This event type must be linked to a staff member.", severity: "error" });
  }
  if ((draft.riskLevel === "high" || draft.riskLevel === "critical") && !draft.requiresApproval) {
    issues.push({ field: "requiresApproval", message: "A high/critical event should require management approval.", severity: "warning" });
  }
  const passed = issues.every((i) => i.severity !== "error");
  return { passed, issues };
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeEventCapture(input: EventCaptureInput): EventCaptureResult {
  const today = input.today ?? todayStr();
  const draft = input.draft;

  // Evidence the draft will build.
  const evidence_categories = (draft.evidenceCategories && draft.evidenceCategories.length > 0)
    ? draft.evidenceCategories
    : evidenceCategoriesFor(draft.eventType, draft.riskLevel);

  // 1) Validate (fixed rules).
  const validation = validateDraft(draft);

  // 2) Duplicate check — run detection over existing events + the draft, keep matches involving the draft.
  const dd = computeDuplicateDetection({ events: [...input.existingEvents, { ...draft, evidenceCategories: evidence_categories }], today });
  const matches: DuplicateMatch[] = (dd.duplicates ?? [])
    .filter((d: any) => d.primary_event_id === draft.id || d.duplicate_event_id === draft.id)
    .map((d: any) => ({
      event_id: d.primary_event_id === draft.id ? d.duplicate_event_id : d.primary_event_id,
      similarity: d.similarity,
      reason: d.reason,
    }));
  const duplicates = { suspected: matches.length > 0, matches };

  // 3) Routing — where the draft will surface (external destinations are gated).
  const plan = computeEventRouting({ events: [{ ...draft, evidenceCategories: evidence_categories }] }).plans[0];
  const routing = {
    destinations: plan?.destinations ?? [],
    external_apis: plan?.external_apis ?? [],
    requires_human_approval: plan?.requires_human_approval ?? false,
  };

  // Submission gate.
  const blocks: string[] = [];
  for (const i of validation.issues) if (i.severity === "error") blocks.push(i.message);
  if (duplicates.suspected) blocks.push("Possible duplicate of an existing event — link to it or confirm this is genuinely new.");
  const ready_to_submit = blocks.length === 0;

  return {
    validation,
    duplicates,
    routing,
    evidence_categories,
    ready_to_submit,
    blocks,
    insights: buildInsights(validation, duplicates, routing, evidence_categories, ready_to_submit),
  };
}

// ── Insights ──────────────────────────────────────────────────────────────────

function buildInsights(
  validation: EventCaptureResult["validation"],
  duplicates: EventCaptureResult["duplicates"],
  routing: EventCaptureResult["routing"],
  evidence: string[],
  ready: boolean,
): EventCaptureResult["insights"] {
  const insights: EventCaptureResult["insights"] = [];

  if (duplicates.suspected) {
    insights.push({
      severity: "warning",
      text: `This looks like a duplicate of ${duplicates.matches.length} existing event${duplicates.matches.length === 1 ? "" : "s"}. Capture once: link to the existing record rather than creating a second copy, so dashboards, evidence and trends stay accurate.`,
    });
  }
  if (!validation.passed) {
    insights.push({ severity: "critical", text: `Missing mandatory information — this can't be submitted until the required fields are completed. The form is validated once here, so the gap is caught at the point of entry, not at audit.` });
  }
  if (routing.external_apis.length > 0) {
    insights.push({
      severity: "warning",
      text: `On submission this will be queued to notify ${routing.external_apis.join(", ")} — held for human approval, never sent automatically.`,
    });
  }
  if (ready) {
    insights.push({
      severity: "positive",
      text: `Validated and ready. Captured once, this single record will surface across ${routing.destinations.length} workflow${routing.destinations.length === 1 ? "" : "s"} and build ${evidence.length} evidence categor${evidence.length === 1 ? "y" : "ies"} automatically — no re-entry.`,
    });
  }
  return insights;
}
