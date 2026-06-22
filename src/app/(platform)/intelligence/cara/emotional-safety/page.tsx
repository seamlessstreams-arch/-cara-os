"use client";

import React, { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useEmotionalSafety } from "@/hooks/use-emotional-safety";
import type { EmotionalSafetyStatus, TimeOfDayPattern } from "@/lib/emotional-safety/emotional-safety-engine";
import { cn } from "@/lib/utils";
import {
  HeartPulse,
  Loader2,
  Zap,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";

const STATUS_CONFIG: Record<EmotionalSafetyStatus, { label: string; badge: string }> = {
  secure: { label: "Settled", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  watch: { label: "Watch", badge: "bg-amber-100 text-amber-800 border-amber-200" },
  concern: { label: "Needs support", badge: "bg-red-100 text-red-800 border-red-200" },
};

const TREND_CONFIG: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  rising: { label: "Rising", icon: TrendingUp, cls: "text-red-600" },
  steady: { label: "Steady", icon: Minus, cls: "text-slate-500" },
  easing: { label: "Easing", icon: TrendingDown, cls: "text-emerald-600" },
};

const INSIGHT_TONE: Record<string, { icon: React.ElementType; cls: string }> = {
  positive: { icon: Sparkles, cls: "text-emerald-700 bg-emerald-50 border-emerald-100" },
  watch: { icon: AlertTriangle, cls: "text-amber-700 bg-amber-50 border-amber-100" },
  gap: { icon: Lightbulb, cls: "text-rose-700 bg-rose-50 border-rose-100" },
};

const TIME_LABEL: Record<keyof TimeOfDayPattern, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2">
      <div className={cn("text-lg font-bold", accent ?? "text-[var(--cs-navy,#1e293b)]")}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-[var(--cs-text-muted,#64748b)]">{label}</div>
    </div>
  );
}

export default function EmotionalSafetyPage() {
  const ypQuery = useYoungPeople("current");
  const youngPeople = useMemo(
    () => (ypQuery.data?.data ?? []).map((yp) => ({ id: yp.id, name: yp.preferred_name || yp.first_name || "Child" })),
    [ypQuery.data],
  );

  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const childId = selectedChildId || youngPeople[0]?.id || "";

  const { data: a, isLoading } = useEmotionalSafety(childId);
  const status = a ? STATUS_CONFIG[a.status] : null;
  const trend = a ? TREND_CONFIG[a.escalation.trend] : null;
  const TrendIcon = trend?.icon ?? Minus;

  const maxBar = a ? Math.max(1, ...Object.values(a.escalation.byTimeOfDay)) : 1;

  return (
    <PageShell
      title="Emotional Safety"
      subtitle="What triggers dysregulation, what helps a child regulate, and how escalation is trending"
    >
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-center gap-3">
          <HeartPulse className="h-5 w-5 text-[var(--cs-cara-gold,#b45309)]" />
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
            <Loader2 className="h-4 w-4 animate-spin" /> Analysing emotional safety…
          </div>
        )}

        {a && status && trend && (
          <>
            {/* Status header */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[var(--cs-navy,#1e293b)]">{a.childName}’s emotional safety</h2>
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase", status.badge)}>
                    {status.label}
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-sm text-[var(--cs-text-secondary,#475569)]">{a.statusReason}</p>
              </CardContent>
            </Card>

            {/* Triggers vs what helps */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">What triggers dysregulation</h3>
                  </div>
                  {a.triggers.length === 0 ? (
                    <p className="text-sm text-[var(--cs-text-muted,#64748b)]">No triggers recorded yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {a.triggers.map((t) => (
                        <li key={t.label} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 text-sm text-[var(--cs-navy,#1e293b)]">
                            {t.label}
                            {t.fromPace && (
                              <span className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">PACE</span>
                            )}
                          </span>
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">×{t.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">What helps them regulate</h3>
                  </div>
                  {a.whatHelps.length === 0 ? (
                    <p className="text-sm text-[var(--cs-text-muted,#64748b)]">
                      No regulating strategy captured yet — note what helps after each episode to build the plan.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {a.whatHelps.map((h) => (
                        <li key={h.label} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 text-sm text-[var(--cs-navy,#1e293b)]">
                            {h.label}
                            {h.fromPace && (
                              <span className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">PACE</span>
                            )}
                          </span>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">×{h.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Escalation patterns */}
            <Card>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">Escalation patterns</h3>
                  <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", trend.cls)}>
                    <TrendIcon className="h-4 w-4" /> {trend.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Stat label="Escalations" value={a.escalation.concernCount} />
                  <Stat label="High intensity" value={a.escalation.highIntensityCount} accent={a.escalation.highIntensityCount > 0 ? "text-red-600" : undefined} />
                  <Stat label="Incidents" value={a.escalation.incidentCount} />
                  <Stat label="Last 30d / prior" value={`${a.escalation.recent30d} / ${a.escalation.prior30d}`} />
                </div>

                {/* Time-of-day bars */}
                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-1 text-xs font-medium text-[var(--cs-text-muted,#64748b)]">
                    <Clock className="h-3.5 w-3.5" /> When escalation happens
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(a.escalation.byTimeOfDay) as (keyof TimeOfDayPattern)[]).map((k) => {
                      const v = a.escalation.byTimeOfDay[k];
                      const isPeak = a.escalation.peakTime === k && v > 0;
                      return (
                        <div key={k} className="text-center">
                          <div className="flex h-16 items-end justify-center">
                            <div
                              className={cn("w-7 rounded-t", isPeak ? "bg-red-400" : "bg-slate-300")}
                              style={{ height: `${Math.max(4, (v / maxBar) * 100)}%` }}
                            />
                          </div>
                          <div className="mt-1 text-[11px] text-[var(--cs-text-muted,#64748b)]">{TIME_LABEL[k]}</div>
                          <div className="text-xs font-bold text-[var(--cs-navy,#1e293b)]">{v}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            {a.insights.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {a.insights.map((ins) => {
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
              CARA surfaces emotional-safety patterns to support reflection and planning. It informs practice — it never replaces
              professional judgement.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
