"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Self-Healing Integrity Panel
//
// Two groups: what Cara can safely auto-heal (a missing mirror in a derived
// index — reversible, no practice content touched), and what needs a person
// (conflicts, dangling child references, id collisions). Applying is explicit;
// a scan never changes anything. Every applied repair is logged and reversible.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wrench, ShieldCheck, UserCheck, CheckCircle2 } from "lucide-react";
import { useSelfHealing, useApplySelfHealing } from "@/hooks/use-self-healing";
import type { IntegrityRepair, RepairSeverity } from "@/lib/self-healing/types";
import { cn } from "@/lib/utils";

const SEV: Record<RepairSeverity, { cls: string }> = {
  critical: { cls: "text-[var(--cs-risk)] bg-[var(--cs-risk-bg)] border-[var(--cs-risk-soft)]" },
  high: { cls: "text-[var(--cs-warning)] bg-[var(--cs-warning-bg)] border-[var(--cs-warning-soft)]" },
  medium: { cls: "text-[var(--cs-warning)] bg-[var(--cs-warning-bg)] border-[var(--cs-warning-soft)]" },
  low: { cls: "text-[var(--cs-info)] bg-[var(--cs-info-bg)] border-[var(--cs-info-soft)]" },
};

function RepairRow({ r }: { r: IntegrityRepair }) {
  const s = SEV[r.severity];
  return (
    <div className={cn("rounded-lg border px-3 py-2.5", s.cls)}>
      <p className="text-[13px] font-medium text-[var(--cs-text,#1f2a30)]">{r.description}</p>
      <p className="mt-1 text-[12px] text-[var(--cs-text-muted,#6c7a83)]">{r.rationale}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--cs-text-muted,#8a97a0)]">
        <span className="rounded bg-[var(--cs-surface-subtle,#f0f4f6)] px-1.5 py-0.5">{r.recordType} · {r.recordId}</span>
        {r.reversible && <span className="rounded bg-[var(--cs-surface-subtle,#f0f4f6)] px-1.5 py-0.5">Reversible</span>}
        <span className="rounded bg-[var(--cs-surface-subtle,#f0f4f6)] px-1.5 py-0.5 font-mono">{r.before} → {r.after}</span>
      </div>
    </div>
  );
}

export function SelfHealingPanel() {
  const { data, isLoading, isError } = useSelfHealing();
  const apply = useApplySelfHealing();
  const scan = data?.data;
  const plan = scan?.plan;

  const safe = plan?.repairs.filter((r) => r.classification === "safe_auto") ?? [];
  const human = plan?.repairs.filter((r) => r.classification === "needs_human") ?? [];

  return (
    <Card className="border-[var(--cs-border,#e2e8ec)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4" style={{ color: "var(--cs-teal,#0d9488)" }} />
            Self-Healing Integrity
          </CardTitle>
          {safe.length > 0 && (
            <button
              type="button"
              onClick={() => apply.mutate()}
              disabled={apply.isPending}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--cs-teal,#0d9488)" }}
            >
              {apply.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              Auto-heal {safe.length} safe {safe.length === 1 ? "repair" : "repairs"}
            </button>
          )}
        </div>
        <CardDescription>
          {plan
            ? plan.summary.total === 0
              ? "The reference graph is structurally sound — nothing to repair."
              : `${plan.summary.safeAuto} safe to auto-heal · ${plan.summary.needsHuman} need a person.`
            : "A resting-state scan of the store's reference graph for structural integrity."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 py-6 text-sm text-[var(--cs-text-muted,#6c7a83)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Scanning the reference graph…
          </div>
        )}
        {isError && <p className="py-4 text-sm text-[var(--cs-text-muted,#6c7a83)]">Couldn&apos;t run the integrity scan right now.</p>}

        {apply.data?.data?.applied?.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--cs-success-soft)] bg-[var(--cs-success-bg)] px-3 py-2.5 text-sm text-[var(--cs-teal)]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Healed {apply.data.data.applied.length} reference{apply.data.data.applied.length === 1 ? "" : "s"} — logged and reversible.
          </div>
        )}

        {plan && plan.summary.total === 0 && !isLoading && (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--cs-success-soft)] bg-[var(--cs-success-bg)] px-3 py-4 text-sm text-[var(--cs-teal)]">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Every reference is consistent — nothing to heal.
          </div>
        )}

        {safe.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--cs-teal,#0d9488)]">
              <ShieldCheck className="h-3.5 w-3.5" /> Safe to auto-heal
            </p>
            {safe.map((r) => <RepairRow key={r.id} r={r} />)}
          </div>
        )}

        {human.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted,#6c7a83)]">
              <UserCheck className="h-3.5 w-3.5" /> Needs a person
            </p>
            {human.map((r) => <RepairRow key={r.id} r={r} />)}
          </div>
        )}

        {plan && <p className="pt-1 text-[11px] leading-relaxed text-[var(--cs-text-muted,#8a97a0)]">{plan.disclaimer}</p>}
      </CardContent>
    </Card>
  );
}
