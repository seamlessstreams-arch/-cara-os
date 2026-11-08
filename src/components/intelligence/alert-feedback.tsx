"use client";

// Phase 1.1 — one-tap feedback on a surfaced attention item. Reusable: drop it
// anywhere an alert/attention item renders, passing the rule that surfaced it and
// the specific entity. Optimistic + best-effort (never blocks the surface).

import { useState } from "react";
import { api } from "@/hooks/use-api";

type Verdict = "useful" | "not_useful" | "wrong";

export function AlertFeedback({
  ruleId,
  entityType,
  entityId,
  className,
}: {
  ruleId: string;
  entityType?: string;
  entityId?: string;
  className?: string;
}) {
  const [sent, setSent] = useState<Verdict | null>(null);

  async function send(verdict: Verdict) {
    if (sent) return;
    setSent(verdict); // optimistic — the control collapses to a thank-you
    try {
      await api.post("/alert-feedback", { rule_id: ruleId, entity_type: entityType, entity_id: entityId, verdict });
    } catch {
      /* best-effort capture — never surface an error for a feedback tap */
    }
  }

  if (sent) {
    return <span className={`text-[11px] text-[var(--cs-text-muted,#64748b)] ${className ?? ""}`}>Thanks — feedback noted</span>;
  }

  const btn =
    "rounded px-1.5 py-0.5 text-[11px] font-medium text-[var(--cs-text-muted,#64748b)] hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[var(--cs-teal,#0d9488)]";
  return (
    <span className={`inline-flex items-center gap-0.5 ${className ?? ""}`}>
      <span className="text-[11px] text-[var(--cs-text-muted,#94a3b8)]">Useful?</span>
      <button type="button" aria-label="Mark useful" title="Useful" onClick={() => send("useful")} className={btn}>👍</button>
      <button type="button" aria-label="Mark not useful" title="Not useful" onClick={() => send("not_useful")} className={btn}>👎</button>
      <button type="button" aria-label="Mark wrong" title="Wrong — should not have surfaced" onClick={() => send("wrong")} className={btn}>Wrong</button>
    </span>
  );
}
