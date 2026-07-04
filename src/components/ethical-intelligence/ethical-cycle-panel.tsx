"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Ethical Intelligence Cycle Panel (at the point of work)
//
// Shows where a child's learning events sit on the ethical cycle
// (Experience → Insight → Decision → Impact → Learning → Integration) with the
// house progressive-disclosure pattern: stage dots + next step collapsed;
// per-stage outstanding items, integration questions and traceability expanded.
//
// Honest by design: an empty state says no learning events exist yet — it never
// fabricates a cycle. Every displayed claim is source-linked ("If Cara cannot
// trace it, Cara cannot claim it").
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, CircleCheck, Circle, Link2, Loader2, RefreshCcw } from "lucide-react";
import { useEthicalIntelligence, type EthicalEventWithStatus } from "@/hooks/use-ethical-intelligence";
import { cn } from "@/lib/utils";

function StageDots({ item }: { item: EthicalEventWithStatus }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {item.status.stages.map((s) => (
        <span
          key={s.stage}
          title={`${s.label}${s.complete ? " — complete" : s.outstanding[0] ? ` — ${s.outstanding[0]}` : ""}`}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
            s.complete
              ? "border-[var(--cs-success-border,#bbe5c8)] bg-[var(--cs-success-bg,#eaf7ee)] text-[var(--cs-success-text,#1e6b40)]"
              : "border-[var(--cs-border,#e2e8ec)] bg-[var(--cs-surface,#fff)] text-[var(--cs-text-muted,#6c7a83)]",
          )}
        >
          {s.complete ? <CircleCheck className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
          {s.label}
        </span>
      ))}
    </div>
  );
}

function EventRow({ item }: { item: EthicalEventWithStatus }) {
  const [open, setOpen] = useState(false);
  const { event, status } = item;

  return (
    <div className="rounded-lg border border-[var(--cs-border,#e2e8ec)] bg-[var(--cs-surface,#fff)] p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--cs-text,#14202a)]">{event.triggerSummary}</p>
          <p className="mt-0.5 text-xs text-[var(--cs-text-muted,#6c7a83)]">
            {status.stagesComplete}/6 stages · {status.cycleComplete ? "cycle complete" : status.nextStep}
          </p>
        </div>
        {open ? (
          <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-text-muted,#6c7a83)]" />
        ) : (
          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-text-muted,#6c7a83)]" />
        )}
      </button>

      <div className="mt-2">
        <StageDots item={item} />
      </div>

      {open && (
        <div className="mt-3 space-y-3 border-t border-[var(--cs-border,#e2e8ec)] pt-3">
          {status.stages
            .filter((s) => s.outstanding.length > 0)
            .map((s) => (
              <div key={s.stage}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted,#6c7a83)]">
                  {s.label} — outstanding
                </p>
                <ul className="mt-1 space-y-1">
                  {s.outstanding.map((o) => (
                    <li key={o} className="text-xs text-[var(--cs-text,#14202a)]">
                      • {o}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--cs-text-muted,#6c7a83)]">
            <span className="inline-flex items-center gap-1">
              <Link2 className="h-3 w-3" />
              {status.fullyTraceable
                ? "Every entry is traced to a source record"
                : "Untraced entries present — link source records"}
            </span>
            <span>
              · Trigger: {event.trigger.recordType}/{event.trigger.recordId}
            </span>
            <span>· {event.auditTrail.length} audit entries</span>
          </div>

          <p className="text-[11px] leading-relaxed text-[var(--cs-text-muted,#6c7a83)]">{status.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

export function EthicalCyclePanel({
  childId,
  triggerRecordId,
  title = "Ethical Intelligence — the learning cycle",
}: {
  childId?: string;
  triggerRecordId?: string;
  title?: string;
}) {
  const { data, isLoading, isError, refetch } = useEthicalIntelligence({ childId, triggerRecordId });
  const items = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <RefreshCcw className="h-4 w-4 text-[var(--cs-teal,#0d9488)]" />
          {title}
        </CardTitle>
        <CardDescription>
          Experience → Insight → Decision → Impact → Learning → Integration. Cara traces the cycle; the judgements
          inside it belong to named humans.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#6c7a83)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading the cycle…
          </p>
        ) : isError ? (
          <button type="button" onClick={() => refetch()} className="text-sm text-[var(--cs-teal,#0d9488)] underline">
            Could not load — retry
          </button>
        ) : items.length === 0 ? (
          <p className="text-sm text-[var(--cs-text-muted,#6c7a83)]">
            No learning events yet{childId ? " for this child" : ""}. Cycles are created at points of work (incidents,
            decisions, oversight) — never fabricated, always traced to a source record.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <EventRow key={item.event.id} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
