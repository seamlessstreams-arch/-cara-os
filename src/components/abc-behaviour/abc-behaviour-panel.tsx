"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — ABC Behaviour Panel · §16
//
// Per-child Antecedent → Behaviour → Consequence: the flow visual, then which
// strategies tend to contain the behaviour, and a recording-quality note. A lens
// for reflection and planning — never a judgement or prediction.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, GitBranch } from "lucide-react";
import { useABCBehaviour } from "@/hooks/use-abc-behaviour";
import { ABCFlowVisual } from "./abc-flow-visual";

export function ABCBehaviourPanel() {
  const { data, isLoading, isError } = useABCBehaviour();
  const report = data?.data;
  const [selected, setSelected] = useState<string | null>(null);
  const children = report?.children ?? [];
  const active = children.find((c) => c.childId === selected) ?? children[0];

  return (
    <Card className="border-[var(--cs-border,#e2e8ec)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="h-4 w-4" style={{ color: "var(--cs-teal,#0d9488)" }} />
          ABC Behaviour Patterns
        </CardTitle>
        <CardDescription>
          What tends to precede a behaviour, the behaviour itself, and what staff did in response — for reflection and planning.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 py-6 text-sm text-[var(--cs-text-muted,#6c7a83)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Charting behaviour patterns…
          </div>
        )}
        {isError && <p className="py-4 text-sm text-[var(--cs-text-muted,#6c7a83)]">Couldn&apos;t load ABC patterns right now.</p>}
        {report && children.length === 0 && !isLoading && (
          <p className="py-4 text-sm text-[var(--cs-text-muted,#6c7a83)]">No behaviour-log entries to chart yet.</p>
        )}

        {active && (
          <>
            {/* Child selector */}
            <div className="flex flex-wrap gap-1.5">
              {children.map((c) => (
                <button
                  key={c.childId}
                  type="button"
                  onClick={() => setSelected(c.childId)}
                  className="rounded-full px-2.5 py-0.5 text-[12px] font-medium"
                  style={
                    c.childId === active.childId
                      ? { backgroundColor: "var(--cs-teal,#0d9488)", color: "#fff" }
                      : { backgroundColor: "var(--cs-surface-subtle,#f0faf7)", color: "var(--cs-text-muted,#6c7a83)" }
                  }
                >
                  {c.childName} <span className="opacity-70">· {c.episodes}</span>
                </button>
              ))}
            </div>

            <ABCFlowVisual profile={active} />

            {/* Strategy containment */}
            {active.strategies.length > 0 && (
              <div>
                <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted,#6c7a83)]">
                  Response strategies — how often the behaviour stayed contained
                </p>
                <div className="space-y-1.5">
                  {active.strategies.slice(0, 5).map((s) => (
                    <div key={s.strategy} className="flex items-center gap-2">
                      <span className="w-44 shrink-0 truncate text-[12px] text-[var(--cs-text,#37424a)]" title={s.strategy}>{s.strategy}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--cs-surface-subtle,#eef2f4)]">
                        <div className="h-full rounded-full" style={{ width: `${s.containedRate}%`, backgroundColor: s.containedRate >= 66 ? "#0d9488" : s.containedRate >= 34 ? "#b7791f" : "#c0392b" }} />
                      </div>
                      <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-[var(--cs-text-muted,#6c7a83)]">{s.containedRate}% · {s.uses}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(active.unrecordedAntecedentRate > 0 || active.unrecordedStrategyRate > 0) && (
              <p className="text-[11px] text-[var(--cs-text-muted,#8a97a0)]">
                Recording note: {active.unrecordedAntecedentRate}% of entries have no antecedent recorded and {active.unrecordedStrategyRate}% no strategy — the fuller the record, the clearer the pattern.
              </p>
            )}
          </>
        )}

        {report && <p className="pt-1 text-[11px] leading-relaxed text-[var(--cs-text-muted,#8a97a0)]">{report.disclaimer}</p>}
      </CardContent>
    </Card>
  );
}
