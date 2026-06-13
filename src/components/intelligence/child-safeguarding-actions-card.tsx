"use client";

// CARA — Child safeguarding OPEN ACTIONS card.
// The operational companion to the analytical ChildSafeguardingIntelligenceCard:
// "what's open and needs doing for this child right now" — incidents awaiting
// oversight, active missing / outstanding return interviews, overdue risk
// assessments, open LADO and outstanding notifications. Reuses the home
// safeguarding-overview engine, child-scoped. Deterministic.

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardErrorBoundary } from "@/components/dashboard/card-error-boundary";
import { ShieldAlert, ShieldCheck, ArrowRight } from "lucide-react";
import { useChildSafeguarding } from "@/hooks/use-child-safeguarding";
import type { SafeguardingItem } from "@/lib/engines/safeguarding-overview-engine";

const ITEM_BAR: Record<SafeguardingItem["severity"], string> = {
  critical: "border-l-[var(--cs-risk)]",
  high: "border-l-[var(--cs-warning)]",
  medium: "border-l-[var(--cs-teal)]",
  low: "border-l-[var(--cs-border)]",
};

function Inner({ childId, childName }: { childId: string; childName: string }) {
  const { data, isLoading } = useChildSafeguarding(childId);
  const o = data?.data;
  const openSections = (o?.sections ?? []).filter((s) => s.count > 0);
  const critical = o?.overall === "critical";

  return (
    <Card className={critical ? "border-l-4 border-l-[var(--cs-risk)]" : openSections.length ? "border-l-4 border-l-[var(--cs-warning)]" : ""}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm">
          {openSections.length === 0 && o ? <ShieldCheck className="h-4 w-4 text-[var(--cs-success)]" /> : <ShieldAlert className="h-4 w-4 text-[var(--cs-warning)]" />}
          Safeguarding — open actions
        </CardTitle>
        <Link href="/safeguarding-overview" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--cs-teal)] hover:underline">
          Home picture <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-2 text-sm text-[var(--cs-text-muted)]">Loading…</p>
        ) : !o ? (
          <p className="py-2 text-sm text-[var(--cs-text-muted)]">No safeguarding data.</p>
        ) : openSections.length === 0 ? (
          <p className="flex items-center gap-2 py-1 text-sm text-[var(--cs-text-secondary)]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--cs-success)]" />
            No open safeguarding actions for {childName}.
          </p>
        ) : (
          <div className="space-y-3">
            {openSections.map((s) => (
              <div key={s.key}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">{s.label}</span>
                  <span className="text-xs font-semibold text-[var(--cs-navy)]">{s.status_text}</span>
                </div>
                <div className="space-y-1.5">
                  {s.items.map((it, i) => (
                    <Link key={i} href={it.href} className={`block rounded-lg border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] p-2.5 border-l-4 ${ITEM_BAR[it.severity]} transition-shadow hover:shadow-[var(--cs-shadow-soft)]`}>
                      <p className="text-sm font-semibold capitalize text-[var(--cs-navy)]">{it.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--cs-text-secondary)]">{it.detail}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ChildSafeguardingActionsCard({ childId, childName }: { childId: string; childName: string }) {
  return (
    <CardErrorBoundary>
      <Inner childId={childId} childName={childName} />
    </CardErrorBoundary>
  );
}
