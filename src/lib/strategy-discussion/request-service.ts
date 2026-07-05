// ══════════════════════════════════════════════════════════════════════════════
// CARA — STRATEGY DISCUSSION REQUEST SERVICE (the write path)
//
// createStrategyRequest → assemble the draft FROM THE CHILD'S RECORDS and
//                         persist it (traceability: ≥1 source or refused).
// updateSection / answerThresholdQuestion / recordThinking → humans edit and
//                         reason; every change attributed and audited.
// recordManagerDecision → a NAMED manager judges the threshold, with
//                         mandatory reasoning, either way. Cara never decides.
//
// On a manager decision with a linked Ethical Intelligence event, the
// judgement is recorded as a Decision on the cycle, traced to this request.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { isTraceable } from "@/lib/ethical-intelligence/ethical-intelligence-engine";
import { recordDecision as recordEthicalDecision } from "@/lib/ethical-intelligence/capture-service";
import { assembleStrategyDraft } from "./assembly-engine";
import {
  SEVEN_THRESHOLD_QUESTIONS,
  type StrategyAssemblyInput,
  type StrategyDiscussionRequest,
  type StrategySectionKey,
  STRATEGY_SECTION_LABELS,
} from "./types";
import type { EthicalSourceRef } from "@/lib/ethical-intelligence/types";

export type StrategyResult<T> = { ok: true; value: T } | { ok: false; reason: string };

const UNTRACED =
  "Refused: this request cites no source record. If Cara cannot trace it, Cara cannot claim it — link at least one record (recordType + recordId).";

const nonEmpty = (s?: string | null) => !!s && s.trim().length > 0;

function audit(actor: string, action: string, detail?: string) {
  return { at: new Date().toISOString(), actor, action, detail };
}

// ── Create (assembled from records) ───────────────────────────────────────────

export function createStrategyRequest(
  input: StrategyAssemblyInput,
  sourceRecords: EthicalSourceRef[],
): StrategyResult<StrategyDiscussionRequest> {
  if (!nonEmpty(input.raisedBy)) return { ok: false, reason: "Refused: a named human must raise the request." };
  if (!nonEmpty(input.concernSummary)) return { ok: false, reason: "Refused: state the concern in plain words." };
  if (!isTraceable(sourceRecords)) return { ok: false, reason: UNTRACED };

  const draft = assembleStrategyDraft(input);
  const now = new Date().toISOString();
  const request: StrategyDiscussionRequest = {
    id: generateId("strat"),
    createdAt: now,
    updatedAt: now,
    createdBy: input.raisedBy,
    childId: input.childId,
    childName: input.childName,
    sections: draft.sections,
    evidence: draft.evidence,
    professionalInterpretation: draft.professionalInterpretation,
    unknowns: draft.unknowns,
    alternativeExplanations: draft.alternativeExplanations,
    urgency: draft.urgency,
    thresholdAnswers: [],
    status: "draft",
    sourceRecords,
    auditTrail: [
      audit(input.raisedBy, "request_created", `Assembled ${draft.evidence.length} evidenced items from records`),
    ],
  };
  db.strategyDiscussionRequests.append(request);
  return { ok: true, value: request };
}

// ── Human editing ─────────────────────────────────────────────────────────────

function findRequest(id: string): StrategyDiscussionRequest | undefined {
  return db.strategyDiscussionRequests.findById(id);
}

function editable(request: StrategyDiscussionRequest): StrategyResult<true> {
  if (request.status !== "draft") {
    return { ok: false, reason: "This request has been decided — open a new one if the picture has changed." };
  }
  return { ok: true, value: true };
}

export function updateStrategySection(
  requestId: string,
  actor: string,
  section: StrategySectionKey,
  content: string,
): StrategyResult<StrategyDiscussionRequest> {
  const request = findRequest(requestId);
  if (!request) return { ok: false, reason: "Request not found." };
  const gate = editable(request);
  if (!gate.ok) return gate;
  if (!nonEmpty(actor)) return { ok: false, reason: "Refused: edits must be attributed to a named human." };
  if (!(section in STRATEGY_SECTION_LABELS)) return { ok: false, reason: "Unknown section." };

  request.sections[section] = content;
  request.updatedAt = new Date().toISOString();
  request.auditTrail.push(audit(actor, "section_updated", STRATEGY_SECTION_LABELS[section]));
  return { ok: true, value: request };
}

export function answerThresholdQuestion(
  requestId: string,
  actor: string,
  question: string,
  answer: string,
): StrategyResult<StrategyDiscussionRequest> {
  const request = findRequest(requestId);
  if (!request) return { ok: false, reason: "Request not found." };
  const gate = editable(request);
  if (!gate.ok) return gate;
  if (!nonEmpty(actor)) return { ok: false, reason: "Refused: answers must be attributed to a named human." };
  if (!SEVEN_THRESHOLD_QUESTIONS.includes(question)) {
    return { ok: false, reason: "That is not one of the Seven Threshold Reasoning Questions." };
  }
  if (!nonEmpty(answer)) return { ok: false, reason: "An answer is required." };

  // Latest answer per question wins; earlier attempts stay in the audit trail.
  request.thresholdAnswers = request.thresholdAnswers.filter((a) => a.question !== question);
  request.thresholdAnswers.push({ question, answer, answeredBy: actor, answeredAt: new Date().toISOString() });
  request.updatedAt = new Date().toISOString();
  request.auditTrail.push(audit(actor, "threshold_question_answered", question.slice(0, 60)));

  // Answering "what else could explain this" also feeds the alternatives set.
  if (question === "What else could explain this information?" && !request.alternativeExplanations.includes(answer)) {
    request.alternativeExplanations.push(answer);
  }
  return { ok: true, value: request };
}

export function recordThinking(
  requestId: string,
  actor: string,
  input: { interpretation?: string; unknown?: string; alternativeExplanation?: string },
): StrategyResult<StrategyDiscussionRequest> {
  const request = findRequest(requestId);
  if (!request) return { ok: false, reason: "Request not found." };
  const gate = editable(request);
  if (!gate.ok) return gate;
  if (!nonEmpty(actor)) return { ok: false, reason: "Refused: entries must be attributed to a named human." };

  const added: string[] = [];
  if (nonEmpty(input.interpretation)) {
    request.professionalInterpretation.push(input.interpretation!.trim());
    added.push("interpretation");
  }
  if (nonEmpty(input.unknown)) {
    request.unknowns.push(input.unknown!.trim());
    added.push("unknown");
  }
  if (nonEmpty(input.alternativeExplanation)) {
    request.alternativeExplanations.push(input.alternativeExplanation!.trim());
    added.push("alternative explanation");
  }
  if (added.length === 0) return { ok: false, reason: "Nothing to record." };

  request.updatedAt = new Date().toISOString();
  request.auditTrail.push(audit(actor, "thinking_recorded", added.join(", ")));
  return { ok: true, value: request };
}

// ── The manager's judgement ───────────────────────────────────────────────────

export function recordManagerDecision(
  requestId: string,
  input: {
    decidedBy: string;
    decidedByRole?: string;
    requestDiscussion: boolean;
    reasoning: string;
    ethicalEventId?: string;
  },
): StrategyResult<StrategyDiscussionRequest> {
  const request = findRequest(requestId);
  if (!request) return { ok: false, reason: "Request not found." };
  if (request.status !== "draft") return { ok: false, reason: "This request has already been decided." };
  if (!nonEmpty(input.decidedBy)) {
    return { ok: false, reason: "Refused: the threshold judgement must name the manager who made it — Cara does not decide this." };
  }
  if (!nonEmpty(input.reasoning)) {
    return { ok: false, reason: "Refused: the manager's reasoning is required either way — it becomes part of the record." };
  }

  const now = new Date().toISOString();
  request.status = input.requestDiscussion ? "manager_approved" : "not_pursued";
  request.managerDecision = {
    decidedBy: input.decidedBy,
    decidedByRole: input.decidedByRole,
    decidedAt: now,
    requestDiscussion: input.requestDiscussion,
    reasoning: input.reasoning,
  };
  request.updatedAt = now;
  request.auditTrail.push(
    audit(
      input.decidedBy,
      input.requestDiscussion ? "approved_for_request" : "threshold_not_met",
      input.reasoning.slice(0, 80),
    ),
  );

  // The judgement joins the learning cycle when an event is linked.
  if (input.ethicalEventId) {
    const ethical = recordEthicalDecision(input.ethicalEventId, {
      decisionSummary: input.requestDiscussion
        ? "Strategy discussion requested — threshold judged met"
        : "Strategy discussion not pursued — threshold judged not met",
      decisionMaker: input.decidedBy,
      decisionMakerRole: input.decidedByRole,
      evidence: request.evidence.slice(0, 6).map((e) => e.text),
      sourceRecords: [
        ...request.sourceRecords,
        { recordType: "strategyDiscussionRequests", recordId: request.id, note: "Strategy discussion reasoning" },
      ],
    });
    request.auditTrail.push(
      audit(
        input.decidedBy,
        ethical.ok ? "ethical_cycle_recorded" : "ethical_cycle_refused",
        ethical.ok ? `Decision recorded on ${input.ethicalEventId}` : ethical.reason,
      ),
    );
  }

  return { ok: true, value: request };
}

// ── Reads ─────────────────────────────────────────────────────────────────────

export function listStrategyRequests(filter?: {
  childId?: string;
  status?: StrategyDiscussionRequest["status"];
}): StrategyDiscussionRequest[] {
  let items = db.strategyDiscussionRequests.findAll();
  if (filter?.childId) items = items.filter((r) => r.childId === filter.childId);
  if (filter?.status) items = items.filter((r) => r.status === filter.status);
  return [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getStrategyRequest(id: string): StrategyDiscussionRequest | undefined {
  return findRequest(id);
}
