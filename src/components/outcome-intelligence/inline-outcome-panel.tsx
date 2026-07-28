"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { OutcomeStatus, OutcomeIntelligence } from "@/lib/outcome-intelligence/outcome-intelligence-engine";
import { cn } from "@/lib/utils";
import { Target, TrendingUp, TrendingDown, Minus, ArrowRight, Loader2 } from "lucide-react";

function useOutcomeIntelligence(childId: string | undefined) {
  return useQuery({
    queryKey: ["outcome-intelligence", childId],
    enabled: !!childId,
    queryFn: async () =>
      (
        await api.get<{ data: OutcomeIntelligence }>(
          `/outcome-intelligence?child_id=${encodeURIComponent(childId!)}`,
        )
      ).data,
  });
}

const STATUS: Record<OutcomeStatus, { label: string; badge: string; pill: string }> = {
  on_track: { label: "On track", badge: "bg-emerald-100 text-emerald-800 border-emerald-200", pill: "bg-emerald-50 text-emerald-700" },
  progressing: { label: "Progressing", badge: "bg-amber-100 text-amber-800 border-amber-200", pill: "bg-amber-50 text-amber-700" },
  needs_focus: { label: "Needs focus", badge: "bg-red-100 text-red-800 border-red-200", pill: "bg-red-50 text-red-700" },
};
const TREND_COLOR: Record<string, string> = { improving: "text-emerald-600", stable: "text-slate-500", declining: "text-red-600" };

/**
 * A compact, read-only Outcome Intelligence summary for a child, designed to sit
 * at a point of work (e.g. a LAC review) so the question "is this child's life
 * measurably getting better?" is answered right where progress is reviewed.
 * Informs the conversation — never makes the judgement.
 */
export function InlineOutcomePanel({ childId }: { childId: string }) {
  const { data: o, isLoading } = useOutcomeIntelligence(childId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-white px-3 py-2 text-xs text-[var(--cs-text-muted,#64748b)]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Measuring outcomes…
      </div>
    );
  }
  if (!o) return null;

  const s = STATUS[o.overallStatus];
  const TrendIcon = o.overallTrajectory === "improving" ? TrendingUp : o.overallTrajectory === "declining" ? TrendingDown : Minus;

  return (
    <div className="rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-cara-gold,#b45309)]">
          <Target className="h-3.5 w-3.5" /> Outcome intelligence
        </span>
        <span className="flex items-center gap-1.5">
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", s.badge)}>{s.label}</span>
          <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-semibold", TREND_COLOR[o.overallTrajectory])}>
            <TrendIcon className="h-3 w-3" /> {o.overallTrajectory}
          </span>
        </span>
      </div>

      <p className="mb-2 text-xs text-[var(--cs-text-secondary,#475569)]">{o.headline}</p>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {o.domains.map((d) => (
          <span key={d.key} className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS[d.status].pill)} title={`${d.label}: ${STATUS[d.status].label}`}>
            {d.label}
          </span>
        ))}
      </div>

      <Link
        href={`/intelligence/cara/outcome-intelligence?child=${childId}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--cs-cara-gold,#b45309)]"
      >
        View full outcomes <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
