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
import type { EvolutionProposal, ProposalKind, ProposalSeverity } from "@/lib/knowledge-evolution/types";

const KIND_META: Record<ProposalKind, { icon: React.ElementType; label: string; fg: string }> = {
  codify_gap: { icon: PlusCircle, label: "Coverage gap", fg: "#c0392b" },
  review_entry: { icon: RefreshCw, label: "Review due", fg: "#b7791f" },
  embed_dormant: { icon: EyeOff, label: "Dormant", fg: "#31708e" },
  reinforce: { icon: CheckCircle2, label: "Working well", fg: "#0d9488" },
};

const SEV_BG: Record<ProposalSeverity, string> = { high: "#fdeceb", medium: "#fdf4e3", low: "#eef4f8" };

function ProposalRow({ p }: { p: EvolutionProposal }) {
  const m = KIND_META[p.kind];
  const Icon = m.icon;
  return (
    <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: `${m.fg}33`, backgroundColor: `${SEV_BG[p.severity]}80` }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: m.fg }} />
          <span className="text-[13px] font-medium text-[var(--cs-text,#1f2a30)]">{p.title}</span>
        </div>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ backgroundColor: `${m.fg}1a`, color: m.fg }}>
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
          <div className="flex items-center gap-2 rounded-lg border border-[#b6e4d7] bg-[#e6f7f2] px-3 py-4 text-sm" style={{ color: "#0d9488" }}>
            <CheckCircle2 className="h-4 w-4 shrink-0" /> The knowledge base is tracking practice — no evolution needed right now.
          </div>
        )}

        {r?.proposals.map((p) => <ProposalRow key={p.id} p={p} />)}

        {r && <p className="pt-1 text-[11px] leading-relaxed text-[var(--cs-text-muted,#8a97a0)]">{r.disclaimer}</p>}
      </CardContent>
    </Card>
  );
}
