"use client";

import { useState, useEffect } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Loader2, FileText, Quote, CheckCircle2, ListChecks, CalendarDays, UserSquare2, Sparkles,
} from "lucide-react";
import { useChildReviewPack } from "@/hooks/use-child-review-pack";
import type { PackRag, ReviewSection, ReviewDomainScore } from "@/lib/engines/child-review-pack-engine";

const RAG: Record<PackRag, { dot: string; badge: string; label: string; rag: string; pdot: string }> = {
  green: { dot: "bg-green-500", badge: "bg-green-100 text-green-800 border-green-200", label: "Good", rag: "cs-rag-green", pdot: "cs-dot-green" },
  amber: { dot: "bg-amber-400", badge: "bg-amber-100 text-amber-800 border-amber-200", label: "Attention", rag: "cs-rag-amber", pdot: "cs-dot-amber" },
  red: { dot: "bg-red-500", badge: "bg-red-100 text-red-800 border-red-200", label: "Concern", rag: "cs-rag-red", pdot: "cs-dot-red" },
  no_data: { dot: "bg-slate-300", badge: "bg-slate-100 text-slate-600 border-slate-200", label: "No data", rag: "cs-rag-slate", pdot: "cs-dot-slate" },
};

const WELLBEING_TONE: Record<string, { tone: string; print: string }> = {
  Thriving: { tone: "bg-green-50 text-green-800 ring-green-200", print: "cs-tone-green" },
  Stable: { tone: "bg-blue-50 text-blue-800 ring-blue-200", print: "cs-tone-blue" },
  "Needs attention": { tone: "bg-amber-50 text-amber-800 ring-amber-200", print: "cs-tone-amber" },
  Concerning: { tone: "bg-orange-50 text-orange-800 ring-orange-200", print: "cs-tone-amber" },
  Critical: { tone: "bg-red-50 text-red-800 ring-red-200", print: "cs-tone-red" },
};

function DomainChip({ d }: { d: ReviewDomainScore }) {
  const rag = RAG[(["green", "amber", "red"].includes(d.rag) ? d.rag : "no_data") as PackRag];
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", rag.dot, rag.pdot)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-semibold text-slate-700">{d.domain_label}</span>
          <span className="text-xs font-bold tabular-nums text-slate-500">{d.score}</span>
        </div>
        {d.summary && <p className="truncate text-[11px] text-slate-400" title={d.summary}>{d.summary}</p>}
      </div>
    </div>
  );
}

function SectionCard({ s }: { s: ReviewSection }) {
  const rag = RAG[s.rag];
  return (
    <Card className="break-inside-avoid">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 font-bold text-slate-900">
            <span className={cn("h-2.5 w-2.5 rounded-full", rag.dot, rag.pdot)} />{s.title}
          </span>
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", rag.badge, rag.rag)}>{rag.label}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {s.facts.map((f, i) => (
            <div key={i} className="text-xs">
              <span className="text-slate-400">{f.label}: </span>
              <span className="font-medium text-slate-700">{f.value}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-700">{s.narrative}</p>
      </CardContent>
    </Card>
  );
}

export default function ChildReviewPackPage() {
  const [childId, setChildId] = useState<string | null>(null);
  const { data, isLoading, isFetching } = useChildReviewPack(childId);
  const children = data?.children ?? [];
  const pack = data?.pack ?? null;

  // Default to the first child once the list loads.
  useEffect(() => {
    if (!childId && children.length > 0) setChildId(children[0].id);
  }, [children, childId]);

  return (
    <PageShell
      title="Child Review Pack"
      subtitle="Print-ready LAC review pack — wishes, progress, safety, health, education & recommendations in one document"
      ariaContext={{ pageTitle: "Child Review Pack", sourceType: "general" }}
      actions={<PrintButton />}
    >
      <div className="cs-print-color mx-auto max-w-4xl space-y-5">
        {/* Child selector */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <span className="text-xs font-medium text-slate-500">Child:</span>
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => setChildId(c.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                childId === c.id ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              <UserSquare2 className="h-3.5 w-3.5" /> {c.name}
            </button>
          ))}
          {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        )}

        {!isLoading && !pack && (
          <div className="rounded-lg border bg-white px-4 py-10 text-center text-sm text-slate-500">
            Select a child to generate their review pack.
          </div>
        )}

        {pack && (
          <>
            {/* Document header */}
            <div className="rounded-xl border bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">LAC Review Pack</span>
                  </div>
                  <h1 className="mt-1 text-2xl font-bold text-slate-900">{pack.child_name}</h1>
                  <p className="text-sm text-slate-500">Age {pack.age_years} · generated {pack.generated_for}</p>
                </div>
                <div className={cn("rounded-lg px-3 py-2 text-center ring-1", WELLBEING_TONE[pack.overall_wellbeing]?.tone ?? "bg-slate-50 text-slate-700 ring-slate-200", WELLBEING_TONE[pack.overall_wellbeing]?.print ?? "cs-tone-slate")}>
                  <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Wellbeing</div>
                  <div className="text-sm font-bold">{pack.overall_wellbeing}</div>
                </div>
              </div>

              {/* Demographics */}
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
                {pack.demographics.map((d, i) => (
                  <div key={i} className="text-xs">
                    <span className="text-slate-400">{d.label}: </span>
                    <span className="font-medium text-slate-700">{d.value}</span>
                  </div>
                ))}
              </div>

              {/* Review summary */}
              <div className="mt-4 rounded-lg bg-slate-50 p-4">
                <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Summary for this review
                  {pack.ai_narrative && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700">
                      <Sparkles className="h-2.5 w-2.5" /> ARIA
                    </span>
                  )}
                </p>
                <p className="text-sm leading-relaxed text-slate-700">{pack.ai_narrative || pack.review_summary}</p>
              </div>
            </div>

            {/* Domain scores */}
            {pack.domain_scores.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-slate-700">Domain overview</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {pack.domain_scores.map((d, i) => <DomainChip key={i} d={d} />)}
                </CardContent>
              </Card>
            )}

            {/* Wishes & feelings */}
            <Card className="break-inside-avoid border-indigo-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-indigo-700"><Quote className="h-4 w-4" /> Wishes & feelings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-slate-700">{pack.wishes_and_feelings.narrative}</p>
                {pack.wishes_and_feelings.themes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {pack.wishes_and_feelings.themes.map((t, i) => (
                      <span key={i} className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700">{t}</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sections */}
            <div className="space-y-4">
              {pack.sections.map((s) => <SectionCard key={s.key} s={s} />)}
            </div>

            {/* Strengths + Recommendations */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {pack.strengths.length > 0 && (
                <Card className="break-inside-avoid">
                  <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-semibold text-green-700"><CheckCircle2 className="h-4 w-4" /> Strengths</CardTitle></CardHeader>
                  <CardContent className="space-y-1.5">
                    {pack.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" /><span>{s}</span></div>
                    ))}
                  </CardContent>
                </Card>
              )}
              {pack.recommendations.length > 0 && (
                <Card className="break-inside-avoid">
                  <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700"><ListChecks className="h-4 w-4" /> Recommendations for the review</CardTitle></CardHeader>
                  <CardContent className="space-y-1.5">
                    {pack.recommendations.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-0.5 text-xs font-bold tabular-nums text-slate-400">{i + 1}.</span><span>{r}</span></div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Key dates */}
            {pack.key_dates.length > 0 && (
              <Card className="break-inside-avoid">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700"><CalendarDays className="h-4 w-4" /> Key dates</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {pack.key_dates.map((k, i) => (
                    <div key={i} className="rounded-lg border bg-white px-3 py-1.5 text-xs"><span className="font-medium text-slate-700">{k.label}</span> <span className="text-slate-400">· {k.date}</span></div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
