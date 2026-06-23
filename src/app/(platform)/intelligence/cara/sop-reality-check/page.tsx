"use client";

import React from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { PrintButton } from "@/components/ui/print-button";
import { useSopRealityCheck } from "@/hooks/use-sop-reality-check";
import type { EvidenceStrength, SopArea } from "@/lib/sop-reality-check/sop-reality-check-engine";
import { cn } from "@/lib/utils";
import { FileCheck2, Loader2, CheckCircle2, AlertTriangle, CircleDot, ShieldAlert, FileText } from "lucide-react";

const STRENGTH: Record<EvidenceStrength, { label: string; badge: string; icon: React.ElementType }> = {
  strong: { label: "Strongly evidenced", badge: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
  developing: { label: "Developing", badge: "bg-amber-100 text-amber-800 border-amber-200", icon: CircleDot },
  limited: { label: "Limited evidence", badge: "bg-red-100 text-red-800 border-red-200", icon: AlertTriangle },
};

function AreaCard({ a }: { a: SopArea }) {
  const s = STRENGTH[a.strength];
  const Icon = s.icon;
  return (
    <Card className={cn(a.inspectionRisk && "border-l-4 border-l-red-400")}>
      <CardContent className="p-5">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3 className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">{a.label}</h3>
          <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", s.badge)}><Icon className="h-3 w-3" /> {s.label}</span>
        </div>
        <p className="mb-3 text-sm text-[var(--cs-text-secondary,#475569)]">{a.summary}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700"><FileText className="h-3.5 w-3.5" /> Evidence</div>
            <ul className="space-y-1.5">
              {a.evidence.map((e) => (
                <li key={e.label} className="flex items-start justify-between gap-2 text-sm">
                  <span className="text-[var(--cs-navy,#1e293b)]" title={e.detail}>{e.label}</span>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-bold", e.count > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400")}>{e.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-rose-700"><ShieldAlert className="h-3.5 w-3.5" /> Gaps</div>
            {a.gaps.length === 0 ? <p className="text-sm text-emerald-700">No gaps detected in this area.</p> : (
              <ul className="space-y-1.5">
                {a.gaps.map((g) => (
                  <li key={g.label} className="flex items-start gap-2 text-sm">
                    <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", g.severity === "high" ? "bg-red-500" : "bg-amber-400")} />
                    <span className="text-[var(--cs-text-secondary,#475569)]" title={g.detail}>{g.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SopRealityCheckPage() {
  const { data, isLoading } = useSopRealityCheck();
  const overall = data ? STRENGTH[data.overallConfidence] : null;

  return (
    <PageShell title="Statement of Purpose Reality Check" subtitle="Can the home prove that what it says it does is actually being lived every day?">
      <div id="sop-reality-content" className="space-y-6 animate-fade-in">
        {isLoading && <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]"><Loader2 className="h-4 w-4 animate-spin" /> Checking the evidence…</div>}

        {data && overall && (
          <>
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-5 w-5 text-[var(--cs-cara-gold,#b45309)]" />
                    <h2 className="text-base font-bold text-[var(--cs-navy,#1e293b)]">Statement of Purpose — lived reality</h2>
                    <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase", overall.badge)}>{overall.label}</span>
                  </div>
                  <PrintButton title="SOP Reality Check" />
                </div>
                <p className="mt-1 max-w-3xl text-sm text-[var(--cs-text-secondary,#475569)]">{data.headline}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">{data.areasStrong} strong</span>
                  {data.areasDeveloping > 0 && <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">{data.areasDeveloping} developing</span>}
                  {data.areasLimited > 0 && <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">{data.areasLimited} limited</span>}
                </div>
              </CardContent>
            </Card>

            {data.inspectionRisks.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--cs-navy,#1e293b)]"><ShieldAlert className="h-4 w-4 text-rose-500" /> Evidence gaps that are an inspection risk</h3>
                  <div className="space-y-2">
                    {data.inspectionRisks.map((r, i) => (
                      <div key={`${r.label}-${i}`} className="flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                        <span><span className="font-semibold text-rose-800">{r.label}.</span> <span className="text-rose-700">{r.detail}</span> <span className="ml-1 text-[11px] uppercase tracking-wide text-rose-400">{r.area}</span></span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">{data.areas.map((a) => <AreaCard key={a.key} a={a} />)}</div>

            <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
              Cara checks the evidence behind your Statement of Purpose to support self-evaluation and inspection readiness. It
              informs practice — it never replaces professional judgement, and it does not assign an Ofsted grade.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
