"use client";

import React, { useMemo, useState } from "react";
import { useUrlParam } from "@/hooks/use-client-value";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import type { YoungPerson, StaffMember } from "@/types";

interface YPEnriched extends YoungPerson {
  age: number;
  key_worker: StaffMember | null;
  secondary_worker: StaffMember | null;
  open_incidents: number;
  active_tasks: number;
  missing_episodes_total: number;
  last_log_date: string | null;
  active_medications: number;
  risk_flags_count: number;
}

function useYoungPeople(status = "current") {
  return useQuery({
    queryKey: ["young-people", status],
    queryFn: () =>
      api.get<{ data: YPEnriched[]; meta: Record<string, number> }>(
        `/young-people?status=${status}`
      ),
  });
}
import { api } from "@/hooks/use-api";
import type {
  OutcomeStatus,
  OutcomeDirection,
  OutcomeDomain,
  OutcomeIntelligence,
} from "@/lib/outcome-intelligence/outcome-intelligence-engine";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Target,
  Loader2,
  ShieldCheck,
  GraduationCap,
  HeartPulse,
  Users,
  MessageCircle,
  TrendingDown,
  Minus,
  Lightbulb,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

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

const STATUS_CONFIG: Record<OutcomeStatus, { label: string; badge: string; dot: string }> = {
  on_track: { label: "On track", badge: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  progressing: { label: "Progressing", badge: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  needs_focus: { label: "Needs focus", badge: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
};

const DIRECTION_CONFIG: Record<OutcomeDirection, { label: string; icon: React.ElementType; cls: string }> = {
  improving: { label: "Improving", icon: TrendingUp, cls: "text-emerald-600" },
  stable: { label: "Stable", icon: Minus, cls: "text-slate-500" },
  declining: { label: "Declining", icon: TrendingDown, cls: "text-red-600" },
};

const DOMAIN_ICON: Record<string, React.ElementType> = {
  safety: ShieldCheck,
  education: GraduationCap,
  wellbeing: HeartPulse,
  relationships: Users,
  voice: MessageCircle,
};

const INSIGHT_TONE: Record<string, { icon: React.ElementType; cls: string }> = {
  positive: { icon: Sparkles, cls: "text-emerald-700 bg-emerald-50 border-emerald-100" },
  watch: { icon: AlertTriangle, cls: "text-amber-700 bg-amber-50 border-amber-100" },
  gap: { icon: Lightbulb, cls: "text-rose-700 bg-rose-50 border-rose-100" },
};

function DomainCard({ domain }: { domain: OutcomeDomain }) {
  const status = STATUS_CONFIG[domain.status];
  const dir = DIRECTION_CONFIG[domain.direction];
  const Icon = DOMAIN_ICON[domain.key] ?? Target;
  const DirIcon = dir.icon;
  return (
    <Card className={cn(domain.status === "needs_focus" && "border-l-4 border-l-red-400")}>
      <CardContent className="p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy,#1e293b)]">
            <Icon className="h-4 w-4 text-[var(--cs-cara-gold,#b45309)]" /> {domain.label}
          </span>
          <span className="flex items-center gap-2">
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", status.badge)}>
              {status.label}
            </span>
            <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-semibold", dir.cls)}>
              <DirIcon className="h-3 w-3" /> {dir.label}
            </span>
          </span>
        </div>
        <p className="mb-3 text-sm text-[var(--cs-text-secondary,#475569)]">{domain.headline}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {domain.metrics.map((m) => (
            <div key={m.label} className="rounded-lg border border-[var(--cs-border)] bg-white px-2.5 py-1.5">
              <div className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">{m.value}</div>
              <div className="text-[10px] uppercase tracking-wide text-[var(--cs-text-muted,#64748b)]">{m.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OutcomeIntelligencePage() {
  const ypQuery = useYoungPeople("current");
  const youngPeople = useMemo(
    () => (ypQuery.data?.data ?? []).map((yp) => ({ id: yp.id, name: yp.preferred_name || yp.first_name || "Child" })),
    [ypQuery.data],
  );

  const [selectedChildId, setSelectedChildId] = useState<string>("");
  // Deep-link: ?child=<id> (e.g. from a relational dashboard or briefing) —
  // read as an external value, not copied into state by an effect.
  const urlChildId = useUrlParam("child");
  const childId = selectedChildId || urlChildId || youngPeople[0]?.id || "";

  const { data: o, isLoading } = useOutcomeIntelligence(childId);
  const overallStatus = o ? STATUS_CONFIG[o.overallStatus] : null;
  const overallDir = o ? DIRECTION_CONFIG[o.overallTrajectory] : null;
  const OverallDirIcon = overallDir?.icon ?? Minus;

  return (
    <PageShell
      title="Outcome Intelligence"
      subtitle="Are this child's life outcomes measurably getting better — across safety, learning, wellbeing, relationships and voice?"
    >
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-center gap-3">
          <Target className="h-5 w-5 text-[var(--cs-cara-gold,#b45309)]" />
          <select
            value={childId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-white px-3 py-2 text-sm font-medium text-[var(--cs-navy,#1e293b)]"
          >
            {youngPeople.length === 0 && <option>Loading…</option>}
            {youngPeople.map((yp) => (
              <option key={yp.id} value={yp.id}>
                {yp.name}
              </option>
            ))}
          </select>
          {o && <span className="text-xs text-[var(--cs-text-muted,#64748b)]">Comparing the last {o.windowDays} days with the {o.windowDays} before</span>}
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Measuring outcomes…
          </div>
        )}

        {o && overallStatus && overallDir && (
          <>
            {/* Overall synthesis */}
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-[var(--cs-navy,#1e293b)]">{o.childName}’s outcomes</h2>
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase", overallStatus.badge)}>
                    {overallStatus.label}
                  </span>
                  <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", overallDir.cls)}>
                    <OverallDirIcon className="h-4 w-4" /> {overallDir.label}
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-sm text-[var(--cs-text-secondary,#475569)]">{o.headline}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    {o.domainsOnTrack} on track
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    {o.domainsImproving} improving
                  </span>
                  {o.domainsDeclining > 0 && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      {o.domainsDeclining} declining
                    </span>
                  )}
                  {o.domainsNeedingFocus > 0 && (
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                      {o.domainsNeedingFocus} needs focus
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Per-domain outcome cards */}
            <div className="grid gap-4 lg:grid-cols-2">
              {o.domains.map((d) => (
                <DomainCard key={d.key} domain={d} />
              ))}
            </div>

            {/* What needs us / what's working */}
            {o.insights.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {o.insights.map((ins) => {
                  const tone = INSIGHT_TONE[ins.tone] ?? INSIGHT_TONE.watch;
                  const Icon = tone.icon;
                  return (
                    <div key={ins.key} className={cn("flex items-start gap-2 rounded-lg border px-3 py-2 text-sm", tone.cls)}>
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{ins.text}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
              CARA measures outcome trends to support reflection, planning and inspection evidence. It informs practice — it
              never replaces professional judgement.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
