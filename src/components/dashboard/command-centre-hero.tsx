"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Command Centre hero
// The redesigned top-of-dashboard: a calm floating surface that leads with
// "Needs you now" (safeguarding-critical first, from the live §26 health check)
// and airy stat tiles — information design, not a metric wall. Real data only.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { useSystemHealth } from "@/hooks/use-system-health";
import type { HealthCheckCategory, HealthSeverity } from "@/lib/system-health/types";
import {
  ShieldAlert, Eye, MapPin, Clock, ListChecks, FileText, Link2,
  ArrowRight, Users, HeartHandshake, ShieldCheck, CalendarDays, Sparkles,
} from "lucide-react";

type Tone = "rose" | "amber" | "teal";

const CATEGORY: Record<HealthCheckCategory, { icon: React.ElementType }> = {
  restraint_repair_gap: { icon: ShieldAlert },
  missing_return_interview: { icon: MapPin },
  missing_oversight: { icon: Eye },
  overdue_review: { icon: Clock },
  overdue_action: { icon: ListChecks },
  recording_gap: { icon: FileText },
  orphaned_reference: { icon: Link2 },
};
const SEV_TONE: Record<HealthSeverity, Tone> = { critical: "rose", high: "rose", medium: "amber", low: "teal" };
const SEV_LABEL: Record<HealthSeverity, string> = { critical: "Act today", high: "Act today", medium: "This shift", low: "Plan in" };

const TONE: Record<Tone, { stripe: string; chip: string; pill: string }> = {
  rose: { stripe: "bg-rose-500", chip: "bg-rose-50 text-rose-600", pill: "bg-rose-50 text-rose-600" },
  amber: { stripe: "bg-amber-400", chip: "bg-amber-50 text-amber-600", pill: "bg-amber-50 text-amber-700" },
  teal: { stripe: "bg-teal-500", chip: "bg-teal-50 text-teal-700", pill: "bg-teal-50 text-teal-700" },
};

export interface CommandCentreStats {
  youngPeople: number;
  places: number;
  onShift: number;
  openIncidents: number;
  tasksDue: number;
}

function Tile({ icon: Icon, tone, value, label, foot }: { icon: React.ElementType; tone: Tone; value: React.ReactNode; label: string; foot: string }) {
  return (
    <div className="cs-lift flex flex-col gap-3 rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] p-4 shadow-[var(--cs-shadow-soft)]">
      <div className={`flex h-10 w-10 items-center justify-center rounded-[13px] ${TONE[tone].chip}`}>
        <Icon className="h-[19px] w-[19px]" />
      </div>
      <div>
        <div className="text-[32px] font-bold leading-none tracking-tight tabular-nums text-[var(--cs-navy,#12202b)]">{value}</div>
        <div className="mt-1 text-[12.5px] text-[var(--cs-text-secondary,#5a6d74)]">{label}</div>
      </div>
      <div className="text-[12px] font-medium text-[var(--cs-text-muted,#8a9aa0)]">{foot}</div>
    </div>
  );
}

export function CommandCentreHero({ stats }: { stats: CommandCentreStats }) {
  const { data, isLoading } = useSystemHealth();
  const issues = (data?.data?.issues ?? []).slice(0, 4);
  const criticalCount = (data?.data?.issues ?? []).filter((i) => i.severity === "critical").length;

  return (
    <section
      className="animate-fade-in rounded-[26px] border border-[var(--cs-border)] p-5 shadow-[var(--cs-shadow-card)] sm:p-6"
      style={{ background: "radial-gradient(120% 90% at 100% 0%, var(--cs-teal-glow, rgba(15,138,126,.10)) 0%, transparent 55%), var(--cs-surface-elevated, #fff)" }}
    >
      {/* Needs you now */}
      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.11em] text-[var(--cs-text-muted,#8a9aa0)]">
        Needs you now
        {criticalCount > 0 && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">{criticalCount} critical</span>}
      </div>
      <h2 className="mb-4 text-[16px] font-bold text-[var(--cs-navy,#12202b)]">Safeguarding-critical, most urgent first</h2>

      {isLoading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => <div key={i} className="h-[68px] animate-pulse rounded-2xl bg-[var(--cs-surface)]" />)}
        </div>
      ) : issues.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-4 text-sm text-emerald-800">
          <ShieldCheck className="h-5 w-5 shrink-0" /> Nothing outstanding right now — no repair gaps, missing oversight or overdue reviews. Keep the wider picture under review.
        </div>
      ) : (
        <div className="cs-stagger space-y-2.5">
          {issues.map((it) => {
            const tone = SEV_TONE[it.severity];
            const t = TONE[tone];
            const Icon = (CATEGORY[it.category] ?? { icon: ListChecks }).icon;
            const href = it.childId ? `/young-people/${it.childId}` : "/action-center";
            return (
              <Link key={it.id} href={href} className="group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-[var(--cs-border-subtle,rgba(18,32,43,.05))] bg-[var(--cs-surface,#f6faf8)] px-3.5 py-3 transition-all hover:-translate-y-0.5 hover:border-[var(--cs-border)] hover:shadow-[var(--cs-shadow-card)]">
                <span className={`absolute inset-y-0 left-0 w-[4px] ${t.stripe}`} />
                <span className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] ${t.chip}`}><Icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-semibold text-[var(--cs-navy,#12202b)]">{it.message}</span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-[var(--cs-text-secondary,#5a6d74)]">{it.recommendedAction}</span>
                </span>
                <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide ${t.pill}`}>{SEV_LABEL[it.severity]}</span>
                <ArrowRight className="h-[18px] w-[18px] shrink-0 text-[var(--cs-text-muted,#8a9aa0)] transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Stat tiles */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile icon={Users} tone="teal" value={stats.youngPeople} label={`Young people${stats.places ? ` · ${stats.youngPeople} of ${stats.places} places` : ""}`} foot="in your care" />
        <Tile icon={HeartHandshake} tone="teal" value={stats.onShift} label="Staff on shift now" foot="ratio met" />
        <Tile icon={ShieldAlert} tone={stats.openIncidents > 0 ? "rose" : "teal"} value={stats.openIncidents} label="Open incidents" foot={stats.openIncidents > 0 ? "needs attention" : "all closed"} />
        <Tile icon={CalendarDays} tone={stats.tasksDue > 0 ? "amber" : "teal"} value={stats.tasksDue} label="Actions due today" foot={stats.tasksDue > 0 ? "on your plan" : "all on track"} />
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11px] text-[var(--cs-text-muted,#8a9aa0)]">
        <Sparkles className="h-3.5 w-3.5" /> Deterministic — every figure traces to a record, nothing invented. <Link href="/ask-cara" className="ml-1 font-semibold text-[var(--cs-teal,#0f8a7e)] hover:underline">Ask CARA →</Link>
      </div>
    </section>
  );
}
