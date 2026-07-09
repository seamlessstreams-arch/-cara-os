"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Quality-Gate Board Panel
//
// Every open record that can't yet be finalised, blocked-first, with exactly
// what's needed to clear the gate and the statutory basis. A gate never judges
// the practice — it refuses an unsafe close and names the missing element.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { useQualityGateBoard } from "@/hooks/use-quality-gates";
import type { GateBoardEntry, GateKind } from "@/lib/quality-gates/types";

const GATE_LABEL: Record<GateKind, string> = {
  incident_close: "Incident close",
  restraint_review: "Restraint review sign-off",
  missing_episode_close: "Missing episode close",
  task_complete: "Task completion",
};

function GateRow({ e }: { e: GateBoardEntry }) {
  if (!e.blocked) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[var(--cs-success-soft)] bg-[var(--cs-success-bg)]/60 px-3 py-2 text-[13px] text-[var(--cs-teal)]">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span className="text-[var(--cs-text,#37424a)]">
          {GATE_LABEL[e.gate]} — <span className="font-medium">{e.recordId}</span> is clear to {e.proposedTransition}.
        </span>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-[var(--cs-warning-soft)] bg-[var(--cs-warning-bg)]/60 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 shrink-0 text-[var(--cs-warning)]" />
          <span className="text-[13px] font-medium text-[var(--cs-text,#1f2a30)]">{GATE_LABEL[e.gate]} — {e.recordId}</span>
        </div>
        <span className="rounded-full bg-[var(--cs-warning-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-warning)]">
          Blocked
        </span>
      </div>
      {e.blocks.map((b, i) => (
        <div key={i} className="mt-1.5">
          <p className="text-[13px] text-[var(--cs-text,#37424a)]"><span className="font-medium">Needs:</span> {b.requirement}</p>
          <p className="mt-0.5 text-[12px] text-[var(--cs-text-muted,#6c7a83)]">{b.reason}</p>
          <p className="mt-0.5 text-[12px] text-[var(--cs-text-muted,#6c7a83)]"><span className="font-medium">To clear:</span> {b.howToResolve}</p>
          <p className="mt-0.5 text-[11px] italic text-[var(--cs-text-muted,#8a97a0)]">{b.statutoryBasis}</p>
        </div>
      ))}
    </div>
  );
}

export function QualityGatePanel() {
  const { data, isLoading, isError } = useQualityGateBoard();
  const board = data?.data;

  return (
    <Card className="border-[var(--cs-border,#e2e8ec)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" style={{ color: "var(--cs-teal,#0d9488)" }} />
          Quality Gates
        </CardTitle>
        <CardDescription>
          {board
            ? board.summary.blocked === 0
              ? "Nothing is blocked — every open record has what it needs to be finalised safely."
              : `${board.summary.blocked} record${board.summary.blocked === 1 ? "" : "s"} cannot be finalised yet.`
            : "Records that can't be closed, signed or completed until the required elements are recorded."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && (
          <div className="flex items-center gap-2 py-6 text-sm text-[var(--cs-text-muted,#6c7a83)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking the gates…
          </div>
        )}
        {isError && <p className="py-4 text-sm text-[var(--cs-text-muted,#6c7a83)]">Couldn&apos;t load the gate board right now.</p>}

        {board && board.entries.length === 0 && !isLoading && (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--cs-success-soft)] bg-[var(--cs-success-bg)] px-3 py-4 text-sm text-[var(--cs-teal)]">
            <ShieldCheck className="h-4 w-4 shrink-0" /> No open records are waiting on a gate.
          </div>
        )}

        {board?.entries.map((e) => <GateRow key={`${e.recordType}_${e.recordId}`} e={e} />)}

        {board && <p className="pt-1 text-[11px] leading-relaxed text-[var(--cs-text-muted,#8a97a0)]">{board.disclaimer}</p>}
      </CardContent>
    </Card>
  );
}
