// ══════════════════════════════════════════════════════════════════════════════
// CARA — TAP SESSION SERVICE (the write path)
//
// createTapSession → a thinking session anchored to its setting + source records.
// answerTapQuestions → append the professionals' answers, stage by stage.
// completeTapSession → close the session; completing with unanswered questions
//                      requires an honest incompleteReason (recorded, never hidden).
//
// On completion with a linked Ethical Intelligence event, the session's
// Think-Deeply answers are recorded as an INSIGHT on the cycle — the thinking
// joins the learning spine, traced back to this session and its sources.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { isTraceable } from "@/lib/ethical-intelligence/ethical-intelligence-engine";
import { recordInsight } from "@/lib/ethical-intelligence/capture-service";
import { computeTapStatus, emptyTapAnswers, isKnownTapQuestion, TAP_STAGE_DEFINITIONS } from "./tap-engine";
import type { TapContext, TapSession, TapStage } from "./types";
import type { EthicalSourceRef } from "@/lib/ethical-intelligence/types";

export type TapResult<T> = { ok: true; value: T } | { ok: false; reason: string };

const UNTRACED =
  "Refused: this session cites no source record. If Cara cannot trace it, Cara cannot claim it — link at least one record (recordType + recordId).";

const nonEmpty = (s?: string | null) => !!s && s.trim().length > 0;

function audit(actor: string, action: string, detail?: string) {
  return { at: new Date().toISOString(), actor, action, detail };
}

// ── Create ─────────────────────────────────────────────────────────────────────

export interface CreateTapSessionInput {
  createdBy: string;
  childId?: string;
  childName?: string;
  context: TapContext;
  purpose: string;
  sourceRecords: EthicalSourceRef[];
}

export function createTapSession(input: CreateTapSessionInput): TapResult<TapSession> {
  if (!nonEmpty(input.createdBy)) return { ok: false, reason: "Refused: a named human must open the session." };
  if (!nonEmpty(input.purpose)) return { ok: false, reason: "Refused: state what this thinking session is for." };
  if (!isTraceable(input.sourceRecords)) return { ok: false, reason: UNTRACED };

  const now = new Date().toISOString();
  const session: TapSession = {
    id: generateId("tap"),
    createdAt: now,
    updatedAt: now,
    createdBy: input.createdBy,
    childId: input.childId,
    childName: input.childName,
    context: input.context,
    purpose: input.purpose,
    answers: emptyTapAnswers(),
    status: "in_progress",
    sourceRecords: input.sourceRecords,
    auditTrail: [audit(input.createdBy, "session_created", input.context)],
  };
  db.tapSessions.append(session);
  return { ok: true, value: session };
}

// ── Answer ─────────────────────────────────────────────────────────────────────

export function answerTapQuestions(
  sessionId: string,
  actor: string,
  stage: TapStage,
  answers: Array<{ question: string; answer: string }>,
): TapResult<TapSession> {
  const session = db.tapSessions.findById(sessionId);
  if (!session) return { ok: false, reason: "Session not found." };
  if (session.status === "complete") return { ok: false, reason: "This session is complete — open a new one to think again." };
  if (!nonEmpty(actor)) return { ok: false, reason: "Refused: answers must be attributed to a named human." };
  if (!TAP_STAGE_DEFINITIONS[stage]) return { ok: false, reason: "Unknown TAP stage." };

  const clean = answers.filter((a) => nonEmpty(a.question) && nonEmpty(a.answer));
  if (clean.length === 0) return { ok: false, reason: "No answers supplied." };
  for (const a of clean) {
    if (!isKnownTapQuestion(stage, a.question)) {
      return { ok: false, reason: `"${a.question}" is not one of the ${TAP_STAGE_DEFINITIONS[stage].label} questions.` };
    }
  }

  const now = new Date().toISOString();
  for (const a of clean) {
    // Latest answer per question wins; earlier answers stay in the audit trail.
    session.answers[stage] = session.answers[stage].filter((existing) => existing.question !== a.question);
    session.answers[stage].push({ question: a.question, answer: a.answer, answeredBy: actor, answeredAt: now });
  }
  session.updatedAt = now;
  session.auditTrail.push(audit(actor, "answers_recorded", `${TAP_STAGE_DEFINITIONS[stage].label}: ${clean.length} answer(s)`));
  return { ok: true, value: session };
}

// ── Complete ───────────────────────────────────────────────────────────────────

export function completeTapSession(
  sessionId: string,
  actor: string,
  opts?: { incompleteReason?: string; ethicalEventId?: string },
): TapResult<TapSession> {
  const session = db.tapSessions.findById(sessionId);
  if (!session) return { ok: false, reason: "Session not found." };
  if (session.status === "complete") return { ok: false, reason: "This session is already complete." };
  if (!nonEmpty(actor)) return { ok: false, reason: "Refused: completion must be attributed to a named human." };

  const status = computeTapStatus(session);
  if (!status.allStagesComplete && !nonEmpty(opts?.incompleteReason)) {
    const open = status.stages.filter((s) => !s.complete).map((s) => s.label).join(", ");
    return {
      ok: false,
      reason: `Stages still have unanswered questions (${open}). Answer them, or record an honest reason for completing without them.`,
    };
  }

  const now = new Date().toISOString();
  session.status = "complete";
  session.completedAt = now;
  session.completedBy = actor;
  session.incompleteReason = status.allStagesComplete ? undefined : opts?.incompleteReason;
  session.updatedAt = now;
  session.auditTrail.push(
    audit(actor, "session_completed", status.allStagesComplete ? "All stages answered" : `Incomplete: ${opts?.incompleteReason}`),
  );

  // The thinking joins the learning cycle: Think-Deeply answers become an
  // INSIGHT on the linked Ethical Intelligence event, traced to this session.
  if (opts?.ethicalEventId) {
    const deeply = session.answers.think_deeply;
    const meaning = deeply.find((a) => a.question === "What does this information mean?")?.answer;
    const alternatives = deeply
      .filter((a) => a.question === "What alternative explanations should be considered?")
      .map((a) => a.answer);
    const seeClearly = session.answers.see_clearly.map((a) => `${a.question} ${a.answer}`);

    const result = recordInsight(opts.ethicalEventId, actor, {
      informationKnown: seeClearly,
      interpretation: meaning ?? `TAP session (${session.context}): ${session.purpose}`,
      alternativeExplanations: alternatives,
      sourceRecords: [...session.sourceRecords, { recordType: "tapSessions", recordId: session.id, note: "TAP thinking session" }],
    });
    session.auditTrail.push(
      audit(actor, result.ok ? "ethical_cycle_recorded" : "ethical_cycle_refused", result.ok ? `Insight recorded on ${opts.ethicalEventId}` : result.reason),
    );
  }

  return { ok: true, value: session };
}

// ── Reads ──────────────────────────────────────────────────────────────────────

export function listTapSessions(filter?: { childId?: string; context?: TapContext; status?: "in_progress" | "complete" }): TapSession[] {
  let items = db.tapSessions.findAll();
  if (filter?.childId) items = items.filter((s) => s.childId === filter.childId);
  if (filter?.context) items = items.filter((s) => s.context === filter.context);
  if (filter?.status) items = items.filter((s) => s.status === filter.status);
  return [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getTapSession(id: string): TapSession | undefined {
  return db.tapSessions.findById(id);
}
