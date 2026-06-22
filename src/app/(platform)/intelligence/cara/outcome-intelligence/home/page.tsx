"use client";

import React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useHomeOutcomeOverview } from "@/hooks/use-home-outcome-overview";
import type {
  OutcomeStatus,
  OutcomeDirection,
} from "@/lib/outcome-intelligence/outcome-intelligence-engine";
import type { HomeOutcomeChild } from "@/lib/outcome-intelligence/home-outcome-overview";
import { cn } from "@/lib/utils";
import {
  Target,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  GraduationCap,
  HeartPulse,
  Users,
  MessageCircle,
} from "lucide-react";

const STATUS_DOT: Record<OutcomeStatus, { cls: string; label: string }> = {
  on_track: { cls: "bg-emerald-500", label: "On track" },
  progressing: { cls: "bg-amber-400", label: "Progressing" },
  needs_focus: { cls: "bg-red-500", label: "Needs focus" },
};

const STATUS_BADGE: Record<OutcomeStatus, string> = {
  on_track: "bg-emerald-100 text-emerald-800 border-emerald-200",
  progressing: "bg-amber-100 text-amber-800 border-amber-200",
  needs_focus: "bg-red-100 text-red-800 border-red-200",
};

const DIR_CONFIG: Record<OutcomeDirection, { icon: React.ElementType; cls: string }> = {
  improving: { icon: TrendingUp, cls: "text-emerald-600" },
  stable: { icon: Minus, cls: "text-slate-500" },
  declining: { icon: TrendingDown, cls: "text-red-600" },
};

const DOMAIN_ICON: Record<string, React.ElementType> = {
  safety: ShieldCheck,
  education: GraduationCap,
  wellbeing: HeartPulse,
  relationships: Users,
  voice: MessageCircle,
};

function ChildRow({ child }: { child: HomeOutcomeChild }) {
  const dir = DIR_CONFIG[child.overallTrajectory];
  const DirIcon = dir.icon;
  const priority = child.domainsNeedingFocus > 0;
  return (
    <Link
      href={`/intelligence/cara/outcome-intelligence?child=${child.childId}`}
      className="block"
    >
      <Card className={cn("transition-shadow hover:shadow-md", priority && "border-l-4 border-l-red-400")}>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">{child.childName}</span>
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", STATUS_BADGE[child.overallStatus])}>
                {STATUS_DOT[child.overallStatus].label}
              </span>
              <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-semibold", dir.cls)}>
                <DirIcon className="h-3 w-3" /> {child.overallTrajectory}
              </span>
            </div>
            {/* Per-child domain heatmap dots */}
            <div className="flex items-center gap-1.5">
              {Object.entries(child.domainStatuses).map(([key, st]) => {
                const Icon = DOMAIN_ICON[key] ?? Target;
                return (
                  <span key={key} className="relative inline-flex" title={`${key}: ${STATUS_DOT[st].label}`}>
                    <Icon className="h-4 w-4 text-[var(--cs-text-muted,#94a3b8)]" />
                    <span className={cn("absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full", STATUS_DOT[st].cls)} />
                  </span>
                );
              })}
            </div>
          </div>
          {child.domainsNeedingFocus > 0 && (
            <p className="mt-2 text-xs text-rose-700">{child.topConcern}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function HomeOutcomeOverviewPage() {
  const { data, isLoading } = useHomeOutcomeOverview();

  return (
    <PageShell
      title="Home Outcomes"
      subtitle="Across this home — whose outcomes need us most, and where the patterns are"
    >
      <div className="space-y-6 animate-fade-in">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Measuring outcomes across the home…
          </div>
        )}

        {data && (
          <>
            {/* Headline + counts */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-[var(--cs-cara-gold,#b45309)]" />
                  <h2 className="text-base font-bold text-[var(--cs-navy,#1e293b)]">Outcome intelligence — whole home</h2>
                </div>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary,#475569)]">{data.headline}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    {data.childrenOnTrack} on track
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    {data.childrenImproving} improving
                  </span>
                  {data.childrenNeedingFocus > 0 && (
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                      {data.childrenNeedingFocus} need focus
                    </span>
                  )}
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    Last {data.windowDays} days
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Home-wide domain heatmap */}
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 text-sm font-bold text-[var(--cs-navy,#1e293b)]">Outcomes by domain</h3>
                <div className="space-y-2">
                  {data.domainSummaries.map((d) => {
                    const Icon = DOMAIN_ICON[d.key] ?? Target;
                    const total = Math.max(1, d.onTrack + d.progressing + d.needsFocus);
                    return (
                      <div key={d.key} className="flex items-center gap-3">
                        <span className="flex w-48 shrink-0 items-center gap-2 text-sm text-[var(--cs-navy,#1e293b)]">
                          <Icon className="h-4 w-4 text-[var(--cs-cara-gold,#b45309)]" /> {d.label}
                        </span>
                        <div className="flex h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                          {d.onTrack > 0 && <div className="bg-emerald-400" style={{ width: `${(d.onTrack / total) * 100}%` }} />}
                          {d.progressing > 0 && <div className="bg-amber-300" style={{ width: `${(d.progressing / total) * 100}%` }} />}
                          {d.needsFocus > 0 && <div className="bg-red-400" style={{ width: `${(d.needsFocus / total) * 100}%` }} />}
                        </div>
                        <span className="w-28 shrink-0 text-right text-xs text-[var(--cs-text-muted,#64748b)]">
                          {d.needsFocus > 0 ? `${d.needsFocus} need focus` : `${d.onTrack} on track`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Ranked children */}
            <div>
              <h3 className="mb-2 px-1 text-sm font-bold text-[var(--cs-navy,#1e293b)]">Children — most needing focus first</h3>
              <div className="space-y-2">
                {data.children.map((c) => (
                  <ChildRow key={c.childId} child={c} />
                ))}
              </div>
            </div>

            <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
              CARA ranks outcomes to direct attention and evidence inspection readiness. It informs practice — it never replaces
              professional judgement.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
