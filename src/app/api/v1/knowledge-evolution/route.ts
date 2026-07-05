// ══════════════════════════════════════════════════════════════════════════════
// CARA — KNOWLEDGE EVOLUTION API
// GET → how the knowledge base is keeping pace with practice: a lifecycle signal
//       per KB entry (embedded / emerging / dormant / review_due) plus coverage
//       gaps — recurring practice themes no entry addresses — as evolution
//       proposals for a practice lead to decide on.
//
// Deterministic. The engine is pure; this route reads the KB + a practice text
// corpus from the store. Cara proposes; it never auto-edits knowledge.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { KB_ALL_ENTRIES } from "@/lib/cara/knowledge-base";
import { runKnowledgeEvolution } from "@/lib/knowledge-evolution/knowledge-evolution-engine";
import type { KBEntryInput, PracticeRecordText } from "@/lib/knowledge-evolution/types";

export const dynamic = "force-dynamic";

const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** Concatenate a record's known free-text fields into one scannable blob. */
function textOf(r: Record<string, unknown>, fields: string[]): string {
  return fields.map((f) => str(r[f])).filter(Boolean).join(" · ");
}

function buildCorpus(store: ReturnType<typeof getStore>): PracticeRecordText[] {
  const corpus: PracticeRecordText[] = [];
  const push = (recordType: string, coll: unknown, fields: string[]) => {
    for (const r of (coll ?? []) as Array<Record<string, unknown>>) {
      const text = textOf(r, fields);
      if (text.trim()) corpus.push({ recordType, text });
    }
  };
  push("incidents", store.incidents, ["description", "immediate_action", "outcome", "lessons_learned"]);
  push("dailyLog", store.dailyLog, ["content"]);
  push("behaviourLog", store.behaviourLog, ["antecedent", "behaviour", "consequence", "strategy", "notes", "trigger", "description"]);
  push("restraints", store.restraints, ["antecedent", "behaviour", "description", "justification"]);
  push("carePlans", store.carePlans, ["summary", "goals", "notes", "description"]);
  push("keyWorkSessions", (store as Record<string, unknown>).keyWorkSessions, ["summary", "notes", "content"]);
  push("supervisionRecords", (store as Record<string, unknown>).supervisionRecords, ["notes", "reflections", "summary"]);
  return corpus;
}

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const store = getStore();
    const asOf = new Date().toISOString().slice(0, 10);

    const entries: KBEntryInput[] = KB_ALL_ENTRIES.map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      // Keywords = curated tags + salient title words (so an entry is found even
      // when records name it by title rather than tag).
      keywords: Array.from(new Set([...(e.tags ?? []), ...titleKeywords(e.title)])),
      ingestedAt: str(e.ingested_at).slice(0, 10) || asOf,
      reviewed: !!e.reviewed,
    }));

    const corpus = buildCorpus(store);
    return NextResponse.json({ data: runKnowledgeEvolution({ homeId: "home_oak", asOf, entries, corpus }) });
  } catch (err) {
    console.error("[knowledge-evolution] failed", err);
    return NextResponse.json({ error: "Failed to run knowledge evolution" }, { status: 500 });
  }
}

/** Pull distinctive words from an entry title (drop short/stop words and the
 *  parenthetical gloss) so title mentions in records still count as references. */
function titleKeywords(title: string): string[] {
  const stop = new Set(["the", "and", "for", "of", "to", "a", "an", "in", "on", "with", "model", "approach", "care"]);
  return title
    .replace(/\(.*?\)/g, " ")
    .split(/[^a-zA-Z]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !stop.has(w.toLowerCase()));
}
