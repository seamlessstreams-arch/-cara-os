"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useRelationalTimeline } from "@/hooks/use-relational-timeline";
import { useEmotionalSafety } from "@/hooks/use-emotional-safety";
import { useOutcomeIntelligence } from "@/hooks/use-outcome-intelligence";
import type { OutcomeStatus } from "@/lib/outcome-intelligence/outcome-intelligence-engine";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Link2,
  HeartPulse,
  ShieldCheck,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Loader2,
  Lightbulb,
  Target,
} from "lucide-react";

const OUTCOME_STATUS: Record<OutcomeStatus, { label: string; badge: string; pill: string }> = {
  on_track: { label: "On track", badge: "bg-emerald-100 text-emerald-800 border-emerald-200", pill: "bg-emerald-50 text-emerald-700" },
  progressing: { label: "Progressing", badge: "bg-amber-100 text-amber-800 border-amber-200", pill: "bg-amber-50 text-amber-700" },
  needs_focus: { label: "Needs focus", badge: "bg-red-100 text-red-800 border-red-200", pill: "bg-red-50 text-red-700" },
};

const REL_STATUS: Record<string, { label: string; badge: string }> = {
  secure: { label: "Secure", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  developing: { label: "Developing", badge: "bg-amber-100 text-amber-800 border-amber-200" },
  fragile: { label: "Fragile", badge: "bg-red-100 text-red-800 border-red-200" },
};
const ES_STATUS: Record<string, { label: string; badge: string }> = {
  secure: { label: "Settled", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  watch: { label: "Watch", badge: "bg-amber-100 text-amber-800 border-amber-200" },
  concern: { label: "Needs support", badge: "bg-red-100 text-red-800 border-red-200" },
};
const TREND_COLOR: Record<string, string> = { improving: "text-emerald-600", stable: "text-slate-500", declining: "text-red-600" };

/** A simple worst-of synthesis for the headline across all three lenses. */
function headline(
  rel: string | undefined,
  es: string | undefined,
  outcome: OutcomeStatus | undefined,
): { tone: string; text: string } {
  const concern = rel === "fragile" || es === "concern" || outcome === "needs_focus";
  const watch = rel === "developing" || es === "watch" || outcome === "progressing";
  if (concern)
    return { tone: "concern", text: "This child needs us — prioritise connection and repair, support regulation, and focus on the outcome areas falling behind." };
  if (watch)
    return { tone: "watch", text: "Relationships, regulation and outcomes are developing — keep connection consistent and build the evidence of progress." };
  return { tone: "secure", text: "Relationships, emotional safety and outcomes look settled — protect what's working." };
}

export default function RelationshipIntelligencePage() {
  const ypQuery = useYoungPeople("current");
  const youngPeople = useMemo(
    () => (ypQuery.data?.data ?? []).map((yp) => ({ id: yp.id, name: yp.preferred_name || yp.first_name || "Child" })),
    [ypQuery.data],
  );
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  // Deep-link: ?child=<id> (e.g. from the Home Relationships overview).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("child");
    if (p) setSelectedChildId(p);
  }, []);
  const childId = selectedChildId || youngPeople[0]?.id || "";

  const { data: rel, isLoading: relLoading } = useRelationalTimeline(childId);
  const { data: es, isLoading: esLoading } = useEmotionalSafety(childId);
  const { data: outcome, isLoading: outcomeLoading } = useOutcomeIntelligence(childId);
  const loading = relLoading || esLoading || outcomeLoading;

  const relS = rel ? REL_STATUS[rel.stability.status] : null;
  const esS = es ? ES_STATUS[es.status] : null;
  const outcomeS = outcome ? OUTCOME_STATUS[outcome.overallStatus] : null;
  const head = headline(rel?.stability.status, es?.status, outcome?.overallStatus);
  const TrendIcon = rel?.trend.direction === "improving" ? TrendingUp : rel?.trend.direction === "declining" ? TrendingDown : Minus;
  const OutcomeTrendIcon =
    outcome?.overallTrajectory === "improving" ? TrendingUp : outcome?.overallTrajectory === "declining" ? TrendingDown : Minus;

  const combinedInsights = [
    ...(rel?.insights ?? []).map((i) => ({ ...i, source: "Relationships" })),
    ...(es?.insights ?? []).map((i) => ({ ...i, source: "Emotional safety" })),
    ...(outcome?.insights ?? []).map((i) => ({ ...i, source: "Outcomes" })),
  ].filter((i) => i.tone === "gap").slice(0, 5);

  return (
    <PageShell
      title="Relationship Intelligence"
      subtitle="One view of a child: who they trust, how they're regulating, whether their outcomes are improving, and where they need us"
    >
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-center gap-3">
          <Sparkles className="h-5 w-5 text-[var(--cs-cara-gold,#b45309)]" />
          <select
            value={childId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-white px-3 py-2 text-sm font-medium text-[var(--cs-navy,#1e293b)]"
          >
            {youngPeople.length === 0 && <option>Loading…</option>}
            {youngPeople.map((yp) => (
              <option key={yp.id} value={yp.id}>{yp.name}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Synthesising relationship intelligence…
          </div>
        )}

        {rel && es && relS && esS && (
          <>
            {/* Headline synthesis */}
            <Card>
              <CardContent className="p-5">
                <h2 className="text-base font-bold text-[var(--cs-navy,#1e293b)]">{rel.childName}</h2>
                <p
                  className={cn(
                    "mt-1 max-w-2xl text-sm",
                    head.tone === "concern" ? "text-red-700" : head.tone === "watch" ? "text-amber-700" : "text-emerald-700",
                  )}
                >
                  {head.text}
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Relationships */}
              <Card>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy,#1e293b)]">
                      <Link2 className="h-4 w-4 text-rose-500" /> Relationships
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", relS.badge)}>{relS.label}</span>
                      <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-semibold", TREND_COLOR[rel.trend.direction])}>
                        <TrendIcon className="h-3 w-3" /> {rel.trend.direction}
                      </span>
                    </span>
                  </div>
                  {rel.stability.trustedAdults.length > 0 && (
                    <div className="mb-2 flex items-center gap-2 text-sm">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-[var(--cs-text-muted,#64748b)]">Trusted:</span>
                      <span className="font-medium text-[var(--cs-navy,#1e293b)]">{rel.stability.trustedAdults.join(", ")}</span>
                    </div>
                  )}
                  <div className="mb-3 flex flex-wrap gap-2 text-xs text-[var(--cs-text-secondary,#475569)]">
                    <span>{rel.stability.connectionCount} connection</span>
                    <span>· {rel.stability.repairCount} repair</span>
                    <span>· {rel.stability.ruptureCount} rupture</span>
                  </div>
                  <Link href={`/intelligence/cara/relational-timeline?child=${childId}`} className="inline-flex items-center gap-1 text-sm font-medium text-[var(--cs-cara-gold,#b45309)]">
                    View relational timeline <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>

              {/* Emotional safety */}
              <Card>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy,#1e293b)]">
                      <HeartPulse className="h-4 w-4 text-[var(--cs-cara-gold,#b45309)]" /> Emotional safety
                    </span>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", esS.badge)}>{esS.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase text-amber-700">
                        <Zap className="h-3 w-3" /> Triggers
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {es.triggers.slice(0, 3).map((t) => (
                          <span key={t.label} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800">{t.label}</span>
                        ))}
                        {es.triggers.length === 0 && <span className="text-xs text-[var(--cs-text-muted,#64748b)]">—</span>}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase text-emerald-700">
                        <ShieldCheck className="h-3 w-3" /> What helps
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {es.whatHelps.slice(0, 3).map((h) => (
                          <span key={h.label} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">{h.label}</span>
                        ))}
                        {es.whatHelps.length === 0 && <span className="text-xs text-[var(--cs-text-muted,#64748b)]">—</span>}
                      </div>
                    </div>
                  </div>
                  <Link href={`/intelligence/cara/emotional-safety?child=${childId}`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--cs-cara-gold,#b45309)]">
                    View emotional safety <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Outcomes — is this child's life measurably getting better? */}
            {outcome && outcomeS && (
              <Card>
                <CardContent className="p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy,#1e293b)]">
                      <Target className="h-4 w-4 text-[var(--cs-cara-gold,#b45309)]" /> Outcomes
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", outcomeS.badge)}>{outcomeS.label}</span>
                      <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-semibold", TREND_COLOR[outcome.overallTrajectory])}>
                        <OutcomeTrendIcon className="h-3 w-3" /> {outcome.overallTrajectory}
                      </span>
                    </span>
                  </div>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {outcome.domains.map((d) => {
                      const ds = OUTCOME_STATUS[d.status];
                      return (
                        <span key={d.key} className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ds.pill)} title={`${d.label}: ${ds.label}`}>
                          {d.label}
                        </span>
                      );
                    })}
                  </div>
                  <Link href={`/intelligence/cara/outcome-intelligence?child=${childId}`} className="inline-flex items-center gap-1 text-sm font-medium text-[var(--cs-cara-gold,#b45309)]">
                    View outcomes <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Gaps to close (synthesised) */}
            {combinedInsights.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="mb-3 text-sm font-bold text-[var(--cs-navy,#1e293b)]">What needs us</h3>
                  <div className="space-y-2">
                    {combinedInsights.map((ins, i) => (
                      <div key={`${ins.source}-${ins.key}-${i}`} className="flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          <span className="font-semibold">{ins.source}:</span> {ins.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
              CARA synthesises relationship and emotional-safety intelligence to support reflection and planning. It informs
              practice — it never replaces professional judgement.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
