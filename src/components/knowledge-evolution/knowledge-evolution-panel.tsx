"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Knowledge Evolution Panel
//
// How the knowledge base is keeping pace with practice: coverage gaps and
// review-due entries first, then dormant knowledge to embed, then what's working.
// Cara proposes; a practice lead decides. Nothing is auto-edited.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookMarked, PlusCircle, RefreshCw, EyeOff, CheckCircle2 } from "lucide-react";
import { useKnowledgeEvolution } from "@/hooks/use-knowledge-evolution";
import { cn } from "@/lib/utils";
import type { EvolutionProposal, ProposalKind, ProposalSeverity } from "@/lib/knowledge-evolution/types";

const KIND_META: Record<ProposalKind, { icon: React.ElementType; label: string; fg: string; border: string }> = {
  codify_gap: { icon: PlusCircle, label: "Coverage gap", fg: "text-[var(--cs-risk)]", border: "border-[var(--cs-risk-soft)]" },
  review_entry: { icon: RefreshCw, label: "Review due", fg: "text-[var(--cs-warning)]", border: "border-[var(--cs-warning-soft)]" },
  embed_dormant: { icon: EyeOff, label: "Dormant", fg: "text-[var(--cs-info)]", border: "border-[var(--cs-info-soft)]" },
  reinforce: { icon: CheckCircle2, label: "Working well", fg: "text-[var(--cs-teal)]", border: "border-[var(--cs-success-soft)]" },
};

const SEV_BG: Record<ProposalSeverity, string> = { high: "bg-[var(--cs-risk-bg)]", medium: "bg-[var(--cs-warning-bg)]", low: "bg-[var(--cs-info-bg)]" };

function ProposalRow({ p }: { p: EvolutionProposal }) {
  const m = KIND_META[p.kind];
  const Icon = m.icon;
  return (
    <div className={cn("rounded-lg border px-3 py-2.5", m.border, SEV_BG[p.severity])}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-3.5 w-3.5 shrink-0", m.fg)} />
          <span className="text-[13px] font-medium text-[var(--cs-text,#1f2a30)]">{p.title}</span>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", m.fg)}>
          {m.label}
        </span>
      </div>
      <p className="mt-1 text-[12px] text-[var(--cs-text-muted,#6c7a83)]">{p.evidence}</p>
      <p className="mt-1 text-[12px] text-[var(--cs-text,#37424a)]"><span className="font-medium">Suggested:</span> {p.recommendation}</p>
    </div>
  );
}

export function KnowledgeEvolutionPanel() {
  const { data, isLoading, isError } = useKnowledgeEvolution();
  const r = data?.data;
  const s = r?.summary;

  return (
    <Card className="border-[var(--cs-border,#e2e8ec)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookMarked className="h-4 w-4" style={{ color: "var(--cs-teal,#0d9488)" }} />
          Knowledge Evolution
        </CardTitle>
        <CardDescription>
          {s
            ? `${s.entries} entries · ${s.embedded} embedded · ${s.dormant} dormant · ${s.reviewDue} to review · ${s.coverageGaps} coverage gap${s.coverageGaps === 1 ? "" : "s"}.`
            : "Whether the knowledge base is keeping pace with what practice actually does."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && (
          <div className="flex items-center gap-2 py-6 text-sm text-[var(--cs-text-muted,#6c7a83)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading knowledge against practice…
          </div>
        )}
        {isError && <p className="py-4 text-sm text-[var(--cs-text-muted,#6c7a83)]">Couldn&apos;t load knowledge evolution right now.</p>}

        {r && r.proposals.length === 0 && !isLoading && (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--cs-success-soft)] bg-[var(--cs-success-bg)] px-3 py-4 text-sm text-[var(--cs-teal)]">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> The knowledge base is tracking practice — no evolution needed right now.
          </div>
        )}

        {r?.proposals.map((p) => <ProposalRow key={p.id} p={p} />)}

        {r && <p className="pt-1 text-[11px] leading-relaxed text-[var(--cs-text-muted,#8a97a0)]">{r.disclaimer}</p>}
      </CardContent>
    </Card>
  );
}
