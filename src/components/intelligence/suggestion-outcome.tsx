"use client";

// Phase 1.2 — record what happened to an AI/deterministic suggestion
// (smart link, early warning, pattern alert): accepted / dismissed / escalated.
// Reusable + optimistic + best-effort (never blocks acting on the suggestion).

import { useState } from "react";
import { api } from "@/hooks/use-api";

type Outcome = "accepted" | "dismissed" | "escalated";
type SuggestionType = "smart_link" | "early_warning" | "pattern_alert";

const LABEL: Record<Outcome, string> = { accepted: "Accepted", dismissed: "Dismissed", escalated: "Escalated" };

export function SuggestionOutcome({
  suggestionType,
  suggestionRef,
  className,
}: {
  suggestionType: SuggestionType;
  suggestionRef: string;
  className?: string;
}) {
  const [done, setDone] = useState<Outcome | null>(null);

  async function send(outcome: Outcome) {
    if (done) return;
    setDone(outcome); // optimistic
    try {
      await api.post("/suggestion-outcome", { suggestion_type: suggestionType, suggestion_ref: suggestionRef, outcome });
    } catch {
      /* best-effort capture */
    }
  }

  if (done) {
    return <span className={`text-[11px] font-medium text-[var(--cs-text-muted,#64748b)] ${className ?? ""}`}>{LABEL[done]}</span>;
  }

  const btn =
    "rounded px-1.5 py-0.5 text-[11px] font-medium text-[var(--cs-text-muted,#64748b)] hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[var(--cs-teal,#0d9488)]";
  return (
    <span className={`inline-flex items-center gap-0.5 ${className ?? ""}`}>
      <button type="button" onClick={() => send("accepted")} className={btn}>Accept</button>
      <button type="button" onClick={() => send("dismissed")} className={btn}>Dismiss</button>
      <button type="button" onClick={() => send("escalated")} className={btn}>Escalate</button>
    </span>
  );
}
