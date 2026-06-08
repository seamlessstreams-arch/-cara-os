"use client";

import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Loader2, RefreshCw, FileText, ShieldCheck, AlertTriangle, AlertOctagon,
  CheckCircle2, MinusCircle, ThumbsUp, Sparkles,
} from "lucide-react";
import { useHomeSummaryReport } from "@/hooks/use-home-summary-report";
import type {
  HomeSummaryReportResult, ReportSection, SectionStatus, OverallStatus,
} from "@/lib/engines/home-summary-report-engine";

const OVERALL_META: Record<OverallStatus, { label: string; tone: string; Icon: typeof FileText }> = {
  good: { label: "Good", tone: "bg-green-50 text-green-800 ring-green-200", Icon: ShieldCheck },
  stable: { label: "Stable", tone: "bg-slate-50 text-slate-700 ring-slate-200", Icon: MinusCircle },
  needs_attention: { label: "Needs attention", tone: "bg-amber-50 text-amber-800 ring-amber-200", Icon: AlertTriangle },
  serious_concern: { label: "Serious concern", tone: "bg-red-50 text-red-800 ring-red-200", Icon: AlertOctagon },
};

const SECTION_META: Record<SectionStatus, { label: string; badge: string; dot: string }> = {
  green: { label: "Good", badge: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" },
  amber: { label: "Needs attention", badge: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-400" },
  red: { label: "Serious concern", badge: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
  no_data: { label: "No data", badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-300" },
};

function SectionBlock({ s }: { s: ReportSection }) {
  const meta = SECTION_META[s.status];
  return (
    <Card className="break-inside-avoid">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 font-bold text-slate-900">
            <span className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} />
            {s.title}
          </span>
          <span className="flex items-center gap-2">
            {s.avg_score != null && <span className="text-xs font-semibold tabular-nums text-slate-500">{s.avg_score}%</span>}
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", meta.badge)}>{meta.label}</span>
          </span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">{s.summary}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {s.highlights.length > 0 && (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Priorities to act on</p>
            <ul className="space-y-1">
              {s.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <AlertTriangle className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", s.status === "red" ? "text-red-500" : "text-amber-500")} />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {s.positives.length > 0 && (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Working well</p>
            <ul className="space-y-1">
              {s.positives.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {s.highlights.length === 0 && s.positives.length === 0 && (
          <p className="text-xs italic text-slate-400">
            {s.status === "no_data" ? "No underlying records assessed yet." : "No specific items flagged."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function HomeSummaryReportPage() {
  const { data, isLoading, isFetching, refetch } = useHomeSummaryReport();

  if (isLoading) {
    return (
      <PageShell title="Home Summary Report" subtitle="Compiling across the intelligence engines…">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const r: HomeSummaryReportResult | undefined = data;
  const om = OVERALL_META[r?.overall_status ?? "stable"];

  return (
    <PageShell
      title="Home Summary Report"
      subtitle={`${r?.period_label ?? ""} · ${r?.total_children ?? 0} children · ${r?.total_staff ?? 0} staff · shareable with the placing authority, board or a review`}
      ariaContext={{ pageTitle: "Home Summary Report", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Refresh
          </button>
          <PrintButton />
        </div>
      }
    >
      <div className="mx-auto max-w-4xl space-y-5">
        {/* Document header */}
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-slate-400">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Home Summary Report</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">{r?.home_name}</h1>
              <p className="text-sm text-slate-500">{r?.period_label}</p>
            </div>
            <div className={cn("flex items-center gap-2 rounded-lg px-3 py-2 ring-1", om.tone)}>
              <om.Icon className="h-5 w-5" />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Overall</div>
                <div className="text-sm font-bold">{om.label}</div>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-slate-50 p-4">
            <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Executive summary
              {r?.ai_narrative && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700">
                  <Sparkles className="h-2.5 w-2.5" /> ARIA
                </span>
              )}
            </p>
            <p className="text-sm leading-relaxed text-slate-700">{r?.ai_narrative || r?.executive_summary}</p>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Generated {r?.generated_for} · compiled from {r?.engines_responded ?? 0} of {r?.engines_queried ?? 0} intelligence sources across six domains.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {r?.sections.map((s) => <SectionBlock key={s.key} s={s} />)}
        </div>

        <p className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-400">
          <ThumbsUp className="h-3 w-3" /> This report reflects the home&rsquo;s current recorded standing. Print or export to share at reviews, with the placing authority, or your board.
        </p>
      </div>
    </PageShell>
  );
}
