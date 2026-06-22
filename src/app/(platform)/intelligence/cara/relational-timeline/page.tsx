"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useRelationalTimeline } from "@/hooks/use-relational-timeline";
import type {
  RelationalLens,
  RelationalMoment,
  RelationalStatus,
} from "@/lib/relational-timeline/relational-timeline-engine";
import { cn, formatDate } from "@/lib/utils";
import {
  Heart,
  Sparkles,
  RefreshCw,
  Award,
  AlertTriangle,
  Users,
  MessageCircle,
  Loader2,
  ShieldCheck,
  Quote,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Link2,
} from "lucide-react";

const LENS_CONFIG: Record<
  RelationalLens,
  { label: string; icon: React.ElementType; dot: string; ring: string; chip: string }
> = {
  connection: { label: "Connection", icon: Heart, dot: "bg-rose-400", ring: "border-rose-200", chip: "bg-rose-50 text-rose-700" },
  breakthrough: { label: "Breakthrough", icon: Sparkles, dot: "bg-amber-400", ring: "border-amber-200", chip: "bg-amber-50 text-amber-700" },
  repair: { label: "Repair", icon: RefreshCw, dot: "bg-emerald-400", ring: "border-emerald-200", chip: "bg-emerald-50 text-emerald-700" },
  achievement: { label: "Achievement", icon: Award, dot: "bg-violet-400", ring: "border-violet-200", chip: "bg-violet-50 text-violet-700" },
  rupture: { label: "Rupture", icon: AlertTriangle, dot: "bg-red-400", ring: "border-red-200", chip: "bg-red-50 text-red-700" },
  reunion: { label: "Family time", icon: Users, dot: "bg-blue-400", ring: "border-blue-200", chip: "bg-blue-50 text-blue-700" },
  voice: { label: "Child's voice", icon: MessageCircle, dot: "bg-sky-400", ring: "border-sky-200", chip: "bg-sky-50 text-sky-700" },
};

const STATUS_CONFIG: Record<RelationalStatus, { label: string; badge: string; bar: string }> = {
  secure: { label: "Secure", badge: "bg-emerald-100 text-emerald-800 border-emerald-200", bar: "bg-emerald-400" },
  developing: { label: "Developing", badge: "bg-amber-100 text-amber-800 border-amber-200", bar: "bg-amber-400" },
  fragile: { label: "Fragile", badge: "bg-red-100 text-red-800 border-red-200", bar: "bg-red-400" },
};

const TREND_COLOR: Record<string, string> = {
  improving: "text-emerald-600",
  stable: "text-slate-500",
  declining: "text-red-600",
};

const INSIGHT_TONE: Record<string, { icon: React.ElementType; cls: string }> = {
  positive: { icon: TrendingUp, cls: "text-emerald-700 bg-emerald-50 border-emerald-100" },
  watch: { icon: TrendingDown, cls: "text-amber-700 bg-amber-50 border-amber-100" },
  gap: { icon: Lightbulb, cls: "text-rose-700 bg-rose-50 border-rose-100" },
};

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2">
      <div className="text-lg font-bold text-[var(--cs-navy,#1e293b)]">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-[var(--cs-text-muted,#64748b)]">{label}</div>
    </div>
  );
}

function MomentRow({ m }: { m: RelationalMoment }) {
  const cfg = LENS_CONFIG[m.lens];
  const Icon = cfg.icon;
  return (
    <div className="relative flex gap-3 pb-5">
      {/* spine dot */}
      <div className="relative flex flex-col items-center">
        <div className={cn("z-10 grid h-8 w-8 place-items-center rounded-full border-2 bg-white", cfg.ring)}>
          <Icon className="h-4 w-4 text-[var(--cs-text-secondary,#475569)]" />
        </div>
        <div className="absolute top-8 h-full w-px bg-[var(--cs-border,#e2e8f0)]" />
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", cfg.chip)}>
            {cfg.label}
          </span>
          <span className="text-xs text-[var(--cs-text-muted,#64748b)]">{formatDate(m.date)}</span>
          {m.moodShift && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              mood {m.moodShift.before} → {m.moodShift.after}
            </span>
          )}
          {m.trustedAdultPresent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <ShieldCheck className="h-3 w-3" /> trusted adult
            </span>
          )}
        </div>

        <p className="mt-1 text-sm font-semibold text-[var(--cs-navy,#1e293b)]">{m.title}</p>
        {m.detail && <p className="mt-0.5 text-sm text-[var(--cs-text-secondary,#475569)]">{m.detail}</p>}
        {m.staffNames.length > 0 && (
          <p className="mt-1 text-xs text-[var(--cs-text-muted,#64748b)]">With {m.staffNames.join(", ")}</p>
        )}
        {m.childVoice && (
          <div className="mt-2 flex gap-2 rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
            <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
            <p className="text-sm italic text-sky-900">“{m.childVoice}”</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RelationalTimelinePage() {
  const ypQuery = useYoungPeople("current");
  const youngPeople = useMemo(
    () =>
      (ypQuery.data?.data ?? []).map((yp) => ({
        id: yp.id,
        name: yp.preferred_name || yp.first_name || "Child",
      })),
    [ypQuery.data],
  );

  const [selectedChildId, setSelectedChildId] = useState<string>("");
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("child");
    if (p) setSelectedChildId(p);
  }, []);
  const childId = selectedChildId || youngPeople[0]?.id || "";

  const { data: timeline, isLoading } = useRelationalTimeline(childId);
  const stability = timeline?.stability;
  const status = stability ? STATUS_CONFIG[stability.status] : null;

  return (
    <PageShell
      title="Relational Timeline"
      subtitle="The child's story, told through relationships — connection, repair, rupture and growth"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Child picker */}
        <div className="flex flex-wrap items-center gap-3">
          <Link2 className="h-5 w-5 text-[var(--cs-cara-gold,#b45309)]" />
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
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Building relational story…
          </div>
        )}

        {timeline && stability && status && (
          <>
            {/* Relationship stability header */}
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-[var(--cs-navy,#1e293b)]">
                        {timeline.childName}’s relationships
                      </h2>
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase", status.badge)}>
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1 max-w-2xl text-sm text-[var(--cs-text-secondary,#475569)]">{stability.statusReason}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  <Stat label="Connection" value={stability.connectionCount} />
                  <Stat label="Repair" value={stability.repairCount} />
                  <Stat label="Rupture" value={stability.ruptureCount} />
                  <Stat label="Achievements" value={stability.achievementCount} />
                  <Stat label="Last 30d connect" value={stability.connectionsLast30d} />
                  <Stat
                    label="Mood improved"
                    value={stability.moodMeasured > 0 ? `${stability.moodImproved}/${stability.moodMeasured}` : "—"}
                  />
                </div>

                {(stability.trustedAdults.length > 0 || stability.keyConnectors.length > 0) && (
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    {stability.trustedAdults.length > 0 && (
                      <div>
                        <span className="text-[var(--cs-text-muted,#64748b)]">Trusted adults: </span>
                        <span className="font-medium text-[var(--cs-navy,#1e293b)]">{stability.trustedAdults.join(", ")}</span>
                      </div>
                    )}
                    {stability.keyConnectors[0] && (
                      <div>
                        <span className="text-[var(--cs-text-muted,#64748b)]">Strongest connection: </span>
                        <span className="font-medium text-[var(--cs-navy,#1e293b)]">
                          {stability.keyConnectors[0].name} ({stability.keyConnectors[0].connections})
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Direction of travel */}
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--cs-border,#e2e8f0)] pt-3">
                  <span className="text-xs font-medium text-[var(--cs-text-muted,#64748b)]">Direction of travel:</span>
                  <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", TREND_COLOR[timeline.trend.direction])}>
                    {timeline.trend.direction === "improving" ? <TrendingUp className="h-4 w-4" /> : timeline.trend.direction === "declining" ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                    {timeline.trend.direction[0].toUpperCase() + timeline.trend.direction.slice(1)}
                  </span>
                  {timeline.trend.monthly.length > 0 && (
                    <div className="flex items-end gap-1" title="Connection + repair per month">
                      {timeline.trend.monthly.map((m) => {
                        const warmth = m.connection + m.repair + m.achievement;
                        const max = Math.max(1, ...timeline.trend.monthly.map((x) => x.connection + x.repair + x.achievement + x.rupture));
                        return (
                          <div key={m.month} className="flex w-5 flex-col items-center gap-px" title={`${m.month}: ${warmth} warm, ${m.rupture} rupture`}>
                            <div className="flex h-8 w-3 flex-col-reverse overflow-hidden rounded-sm bg-slate-100">
                              <div className="w-full bg-emerald-400" style={{ height: `${(warmth / max) * 100}%` }} />
                              <div className="w-full bg-red-300" style={{ height: `${(m.rupture / max) * 100}%` }} />
                            </div>
                            <span className="text-[9px] text-[var(--cs-text-muted,#64748b)]">{m.month.slice(5)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <span className="text-xs text-[var(--cs-text-secondary,#475569)]">{timeline.trend.directionReason}</span>
                </div>
              </CardContent>
            </Card>

            {/* Relationship intelligence insights */}
            {timeline.insights.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {timeline.insights.map((ins) => {
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

            {/* The relational timeline */}
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-[var(--cs-text-muted,#64748b)]">
                  Relational story
                </h3>
                {timeline.moments.length === 0 ? (
                  <p className="text-sm text-[var(--cs-text-muted,#64748b)]">
                    No relational moments recorded yet. As key-work, family time, debriefs and achievements are recorded,
                    {" "}
                    {timeline.childName}’s story will build here automatically — no re-keying.
                  </p>
                ) : (
                  <div className="relative">
                    {timeline.moments.map((m) => (
                      <MomentRow key={m.id} m={m} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
              CARA surfaces relationship patterns to support reflection. It informs practice — it never replaces professional
              judgement.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
