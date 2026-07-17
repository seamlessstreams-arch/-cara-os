"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — KNOWLEDGE GOVERNANCE (§6)
//
// Content is not governance. Every piece of practice knowledge Cara leans on
// carries provenance: what KIND of evidence it is, who reviewed it, what it may
// be used for, and when it is next due. The rule this surface exists to hold:
// social media graphics, infographics and practitioner summaries must never be
// treated as statutory, clinical or scientific authority without review.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useKnowledgeGovernance } from "@/hooks/use-knowledge-governance";
import { AUTHORITATIVE } from "@/lib/knowledge-governance/knowledge-governance-engine";
import { BookMarked, AlertTriangle, CheckCircle2, ShieldQuestion, Loader2 } from "lucide-react";

export default function KnowledgeGovernancePage() {
  const q = useKnowledgeGovernance();
  const d = q.data;
  const authoritative = new Set<string>(AUTHORITATIVE);

  return (
    <PageShell
      title="Knowledge Governance"
      subtitle="Provenance for the practice knowledge Cara leans on — and the rule that informal sources are never treated as authority without review"
    >
      <div className="space-y-6 animate-fade-in">
        {q.isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading the knowledge base…
          </div>
        )}

        {d && (
          <>
            <div className="grid gap-3 sm:grid-cols-4">
              {([
                ["Entries", d.counts.total, "text-[var(--cs-navy,#1e293b)]"],
                ["Authoritative", d.counts.authoritative, "text-emerald-700"],
                ["Informal", d.counts.informal, "text-amber-700"],
                ["Not yet classified", d.counts.unassessed, "text-rose-700"],
              ] as const).map(([label, value, cls]) => (
                <Card key={label}><CardContent className="pt-5">
                  <p className={cn("text-2xl font-extrabold tabular-nums", cls)}>{value}</p>
                  <p className="mt-0.5 text-xs font-semibold text-[var(--cs-text-secondary,#475569)]">{label}</p>
                </CardContent></Card>
              ))}
            </div>

            {/* Evidence-weight distribution — not colour alone; labelled bars */}
            {d.byEvidence.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Evidence weight across the knowledge base</CardTitle></CardHeader>
                <CardContent className="space-y-1.5">
                  {d.byEvidence.map((b) => {
                    const pct = Math.round((b.count / d.counts.total) * 100);
                    const auth = authoritative.has(b.status);
                    return (
                      <div key={b.status} className="flex items-center gap-2 text-xs">
                        <span className="w-40 shrink-0 text-[var(--cs-text-secondary,#475569)]">{d.evidenceLabels[b.status]}</span>
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--cs-surface,#f1f5f9)]">
                          <div className={cn("h-full rounded-full", auth ? "bg-emerald-400" : b.status === "unassessed" ? "bg-rose-300" : "bg-amber-400")} style={{ width: `${Math.max(pct, 3)}%` }} />
                        </div>
                        <span className="w-16 shrink-0 text-right tabular-nums text-[var(--cs-text-muted,#64748b)]">{b.count} · {pct}%</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {d.detections.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-amber-600" /> Governance attention</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {d.detections.map((det) => (
                    <div key={`${det.entryId}-${det.key}`} className={cn("rounded-lg border px-3 py-2 text-sm", det.tone === "positive" ? "border-emerald-100 bg-emerald-50" : det.key === "informal_source_as_authority" ? "border-rose-200 bg-rose-50" : "border-amber-100 bg-amber-50")}>
                      <p className={cn("font-semibold", det.tone === "positive" ? "text-emerald-900" : det.key === "informal_source_as_authority" ? "text-rose-900" : "text-amber-900")}>{det.headline}</p>
                      <p className="mt-0.5 text-xs text-[var(--cs-text-secondary,#475569)]">
                        <span className="font-semibold">Why Cara is showing this:</span> {det.whyShown}
                      </p>
                      {det.suggestedQuestions.length > 0 && (
                        <ul className="mt-1 list-disc pl-4 text-xs text-[var(--cs-text-secondary,#475569)]">{det.suggestedQuestions.map((qq) => <li key={qq}>{qq}</li>)}</ul>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BookMarked className="h-4 w-4 text-[var(--cs-cara-gold,#b45309)]" /> Entries</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-[var(--cs-border,#e2e8f0)] text-left text-[11px] uppercase tracking-wide text-[var(--cs-text-muted,#64748b)]">
                      <th className="py-2 pr-3 font-bold">Entry</th>
                      <th className="py-2 pr-3 font-bold">Evidence</th>
                      <th className="py-2 pr-3 font-bold">Reviewer</th>
                      <th className="py-2 pr-3 font-bold">Next review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.entries.map((e) => (
                      <tr key={e.id} className="border-b border-[var(--cs-border-subtle,#f1f5f9)] last:border-0">
                        <td className="py-2 pr-3">
                          <span className="text-[var(--cs-text,#0f172a)]">{e.title}</span>
                          <span className="ml-1 text-[11px] text-[var(--cs-text-muted,#94a3b8)]">{e.type.replace(/_/g, " ")}{e.kbStatus !== "approved" ? ` · ${e.kbStatus.replace(/_/g, " ")}` : ""}</span>
                        </td>
                        <td className="py-2 pr-3">
                          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                            e.isAuthoritative ? "border-emerald-200 bg-emerald-50 text-emerald-800" :
                            e.isInformal ? "border-amber-200 bg-amber-50 text-amber-800" :
                            "border-rose-200 bg-rose-50 text-rose-800")}>
                            {e.isAuthoritative ? <CheckCircle2 className="h-3 w-3" /> : e.evidenceStatus === "unassessed" ? <ShieldQuestion className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                            {d.evidenceLabels[e.evidenceStatus]}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-xs text-[var(--cs-text-secondary,#475569)]">{e.reviewer || "—"}</td>
                        <td className={cn("py-2 pr-3 text-xs tabular-nums", e.reviewOverdue ? "font-semibold text-rose-700" : "text-[var(--cs-text-muted,#64748b)]")}>
                          {e.nextReview ? e.nextReview.slice(0, 10) : "—"}{e.reviewOverdue ? " · overdue" : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {!d.writeEnabled && (
              <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
                Read-only: recording governance metadata is gated behind the knowledge_governance_write flag (and manager access), which is off. Detections still run.
              </p>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
