"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRACTICE MODULE PANELS (shared)
// Compact, per-child summary panels for the four child-scoped practice modules,
// reused by both the child-record card and the inline point-of-work panels on
// recording forms. Each panel calls the module's OWN per-child hook and
// deep-links to the full module — it summarises, never duplicates the engine.
// Empty states are neutral (never a false-red): "no data yet" ≠ "a concern".
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Scale, ShieldCheck, Network, RefreshCcw, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChildRestrictions } from "@/hooks/use-rights-restriction";
import { useChildStayingSafePlan } from "@/hooks/use-staying-safe-plan";
import { useChildRelationships } from "@/hooks/use-protective-relationships";
import { useChildReflections } from "@/hooks/use-post-incident-reflection";

// ── Shared flag handling ──────────────────────────────────────────────────────

type Flag = { key: string; severity: "info" | "advisory" | "high"; message: string; why: string };

const SEV_RANK: Record<string, number> = { high: 3, advisory: 2, info: 1 };
const SEV_DOT: Record<string, string> = {
  high: "bg-red-500",
  advisory: "bg-amber-500",
  info: "bg-blue-400",
};

function topFlag(flags: Flag[]): Flag | null {
  if (!flags.length) return null;
  return [...flags].sort((a, b) => (SEV_RANK[b.severity] ?? 0) - (SEV_RANK[a.severity] ?? 0))[0];
}

// ── Presentational shell ──────────────────────────────────────────────────────

function ModulePanel({
  href, icon: Icon, title, loading, empty, emptyLabel, children,
}: {
  href: string;
  icon: typeof Scale;
  title: string;
  loading: boolean;
  empty: boolean;
  emptyLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-white p-3 transition-colors hover:border-[var(--cs-cara-gold,#b45309)]/40 hover:bg-[var(--cs-cara-gold-bg,#fffbeb)]"
    >
      <div className="mb-1.5 flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-[var(--cs-cara-gold,#b45309)]" />
        <span className="text-sm font-semibold text-[var(--cs-navy,#1e293b)]">{title}</span>
        <ChevronRight className="ml-auto h-3.5 w-3.5 text-[var(--cs-text-muted,#94a3b8)] transition-transform group-hover:translate-x-0.5" />
      </div>
      {loading ? (
        <div className="flex items-center gap-1.5 py-1 text-xs text-[var(--cs-text-muted,#94a3b8)]">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading…
        </div>
      ) : empty ? (
        <p className="py-0.5 text-xs text-[var(--cs-text-muted,#94a3b8)]">{emptyLabel}</p>
      ) : (
        children
      )}
    </Link>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className={cn("text-sm font-bold", accent ?? "text-[var(--cs-navy,#1e293b)]")}>{value}</span>
      <span className="text-[11px] text-[var(--cs-text-muted,#64748b)]">{label}</span>
    </span>
  );
}

function FlagLine({ flag }: { flag: Flag }) {
  return (
    <div className="mt-1.5 flex items-start gap-1.5">
      <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", SEV_DOT[flag.severity] ?? "bg-slate-400")} />
      <span className="line-clamp-2 text-[11px] leading-snug text-[var(--cs-text-secondary,#475569)]">{flag.message}</span>
    </div>
  );
}

// ── Per-module panels ─────────────────────────────────────────────────────────

export function RightsRestrictionPanel({ childId }: { childId: string }) {
  const { data, isLoading } = useChildRestrictions(childId);
  const reviews = data?.reviews ?? [];
  const needsAttn = reviews.filter((r) => r.analysis.needsManagerAttention).length;
  const flag = topFlag(reviews.flatMap((r) => r.analysis.flags as Flag[]));
  return (
    <ModulePanel
      href="/intelligence/cara/rights-restriction"
      icon={Scale}
      title="Rights & Restriction"
      loading={isLoading}
      empty={reviews.length === 0}
      emptyLabel="No restriction reviews recorded"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stat label={reviews.length === 1 ? "review" : "reviews"} value={reviews.length} />
        {needsAttn > 0 && <Stat label="need manager attention" value={needsAttn} accent="text-amber-700" />}
      </div>
      {flag && <FlagLine flag={flag} />}
    </ModulePanel>
  );
}

export function StayingSafePanel({ childId }: { childId: string }) {
  const { data, isLoading } = useChildStayingSafePlan(childId);
  const plan = data?.plan ?? null;
  const analysis = data?.analysis ?? null;
  const flag = topFlag((analysis?.flags ?? []) as Flag[]);
  return (
    <ModulePanel
      href="/intelligence/cara/staying-safe-plans"
      icon={ShieldCheck}
      title="Staying Safe Plan"
      loading={isLoading}
      empty={!plan || !analysis}
      emptyLabel="No Staying Safe Plan yet"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stat
          label="complete"
          value={`${analysis?.completenessPct ?? 0}%`}
          accent={(analysis?.completenessPct ?? 0) >= 80 ? "text-green-700" : "text-amber-700"}
        />
        {analysis?.needsAttention && <Stat label="needs attention" value="•" accent="text-amber-700" />}
      </div>
      {flag && <FlagLine flag={flag} />}
    </ModulePanel>
  );
}

const REL_STATUS: Record<string, { label: string; accent: string }> = {
  secure: { label: "Secure", accent: "text-green-700" },
  developing: { label: "Developing", accent: "text-amber-700" },
  fragile: { label: "Fragile", accent: "text-red-700" },
};

export function RelationshipsPanel({ childId }: { childId: string }) {
  const { data, isLoading } = useChildRelationships(childId);
  const entries = data?.entries ?? [];
  const a = data?.analysis;
  const status = entries.length > 0 && a ? REL_STATUS[a.status] : undefined;
  return (
    <ModulePanel
      href="/intelligence/cara/protective-relationships"
      icon={Network}
      title="Protective Relationships"
      loading={isLoading}
      empty={entries.length === 0}
      emptyLabel="No relationships mapped yet"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {status && <Stat label="network" value={status.label} accent={status.accent} />}
        <Stat label="protective" value={a?.protectiveCount ?? 0} accent="text-green-700" />
        <Stat label="trusted adults" value={a?.trustedAdultCount ?? 0} />
        {(a?.riskCount ?? 0) > 0 && <Stat label="risk" value={a!.riskCount} accent="text-red-700" />}
      </div>
    </ModulePanel>
  );
}

export function ReflectionPanel({ childId }: { childId: string }) {
  const { data, isLoading } = useChildReflections(childId);
  const reflections = data?.reflections ?? [];
  const needsAttn = reflections.filter((r) => r.analysis.needsManagerAttention).length;
  const inProgress = reflections.filter((r) => r.analysis.progressPct < 100).length;
  const flag = topFlag(reflections.flatMap((r) => r.analysis.flags as Flag[]));
  return (
    <ModulePanel
      href="/intelligence/cara/post-incident-reflection"
      icon={RefreshCcw}
      title="Post-Incident Reflection"
      loading={isLoading}
      empty={reflections.length === 0}
      emptyLabel="No reflections recorded"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stat label={reflections.length === 1 ? "reflection" : "reflections"} value={reflections.length} />
        {inProgress > 0 && <Stat label="in progress" value={inProgress} accent="text-blue-700" />}
        {needsAttn > 0 && <Stat label="need attention" value={needsAttn} accent="text-amber-700" />}
      </div>
      {flag && <FlagLine flag={flag} />}
    </ModulePanel>
  );
}

// ── Inline point-of-work wrapper ──────────────────────────────────────────────

export type PracticeModuleKey = "rights" | "safe" | "relationships" | "reflection";

const PANEL_FOR: Record<PracticeModuleKey, (p: { childId: string }) => React.ReactElement> = {
  rights: RightsRestrictionPanel,
  safe: StayingSafePanel,
  relationships: RelationshipsPanel,
  reflection: ReflectionPanel,
};

/**
 * Inline practice-module context for a recording form. Renders only the modules
 * relevant to that form, for the child currently being recorded. Returns null
 * until a child is chosen, so it never shows stale or empty-of-context panels.
 */
export function InlinePracticeModules({
  childId,
  modules,
}: {
  childId: string | undefined;
  modules: PracticeModuleKey[];
}) {
  if (!childId) return null;
  return (
    <div className="rounded-xl border border-[var(--cs-cara-gold,#b45309)]/20 bg-[var(--cs-cara-gold-bg,#fffbeb)]/40 p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <Scale className="h-3.5 w-3.5 text-[var(--cs-cara-gold,#b45309)]" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-cara-gold,#b45309)]">
          Cara — practice context for this child
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {modules.map((m) => {
          const Panel = PANEL_FOR[m];
          return <Panel key={m} childId={childId} />;
        })}
      </div>
    </div>
  );
}
