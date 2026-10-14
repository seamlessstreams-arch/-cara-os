// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO NOTEBOOK — grounded Ask (live-safe)
//
// Reuses the Ask CARA engine (answerQuestion) — deterministic, record-grounded
// Q&A with epistemic labelling (fact / account / analysis / hypothesis / action)
// and per-source citations. answerQuestion takes the snapshot as a parameter, so
// the only work to make it live-safe is feeding it a LIVE-SAFE snapshot.
//
// buildAskSnapshot reads the emptied in-memory store (and getChildTwin), so it is
// empty on a live tenant. buildLiveAskSnapshot (shared, in @/lib/ask-cara/
// build-snapshot) maps the live-safe dal collections into the same
// AskCaraSnapshot shape; the store-only composite legs are left empty — honest,
// never invented. The notebook Ask is child-scoped via the question context. No
// LLM layer: the deterministic answer stands on its own (the point — it cannot
// hallucinate).
// ══════════════════════════════════════════════════════════════════════════════

import { todayStr } from "@/lib/utils";
import { answerQuestion } from "@/lib/ask-cara/ask-cara-engine";
import { buildLiveAskSnapshot } from "@/lib/ask-cara/build-snapshot";
import type { AskCaraAnswer } from "@/lib/ask-cara/types";

export async function answerNotebookQuestion(opts: { childId: string; question: string; role?: string }): Promise<AskCaraAnswer> {
  const snapshot = await buildLiveAskSnapshot();
  return answerQuestion({
    question: opts.question,
    asOf: todayStr(),
    role: opts.role,
    snapshot,
    context: { childId: opts.childId },
  });
}
