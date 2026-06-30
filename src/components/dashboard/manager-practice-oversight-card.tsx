"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGER PRACTICE OVERSIGHT CARD
// Surfaces the two home-scoped practice modules on the manager dashboard so they
// reach the manager's point of work, not just their standalone pages:
//   • SOP Reality Check  • Burnout & Organisational Risk
// Pure read: calls each module's own overview hook and deep-links to the full
// module. Summarises, never duplicates. Empty/low states are neutral.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, Activity, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSopRealityCheck } from "@/hooks/use-sop-reality-check";
import { useOrgRisk } from "@/hooks/use-org-risk";

const RISK_LEVEL: Record<string, { label: string; accent: string }> = {
  low: { label: "Low", accent: "text-green-700" },
  moderate: { label: "Moderate", accent: "text-amber-700" },
  high: { label: "High", accent: "text-orange-700" },
  critical: { label: "Critical", accent: "text-red-700" },
};

const EVIDENCE: Record<string, { label: string; accent: string }> = {
  strong: { label: "Strong", accent: "text-green-700" },
  developing: { label: "Developing", accent: "text-amber-700" },
  limited: { label: "Limited", accent: "text-orange-700" },
};

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className={cn("text-sm font-bold", accent ?? "text-[var(--cs-navy,#1e293b)]")}>{value}</span>
      <span className="text-[11px] text-[var(--cs-text-muted,#64748b)]">{label}</span>
    </span>
  );
}

function Panel({
  href, icon: Icon, title, loading, children,
}: {
  href: string;
  icon: typeof FileCheck;
  title: string;
  loading: boolean;
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
      ) : (
        children
      )}
    </Link>
  );
}

function SopPanel() {
  const { data, isLoading } = useSopRealityCheck();
  const conf = data ? EVIDENCE[data.overallConfidence] : undefined;
  return (
    <Panel href="/intelligence/cara/sop-reality-check" icon={FileCheck} title="SOP Reality Check" loading={isLoading}>
      {data ? (
        <>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {conf && <Stat label="evidence" value={conf.label} accent={conf.accent} />}
            <Stat label="strong" value={data.areasStrong} accent="text-green-700" />
            <Stat label="developing" value={data.areasDeveloping} accent="text-amber-700" />
            {data.areasLimited > 0 && <Stat label="limited" value={data.areasLimited} accent="text-orange-700" />}
          </div>
          {data.inspectionRisks.length > 0 && (
            <p className="mt-1.5 text-[11px] leading-snug text-[var(--cs-text-secondary,#475569)]">
              {data.inspectionRisks.length} inspection-risk{data.inspectionRisks.length === 1 ? "" : "s"} flagged
            </p>
          )}
        </>
      ) : (
        <p className="py-0.5 text-xs text-[var(--cs-text-muted,#94a3b8)]">No SOP data yet</p>
      )}
    </Panel>
  );
}

function OrgRiskPanel() {
  const { data, isLoading } = useOrgRisk();
  const level = data ? RISK_LEVEL[data.overallLevel] : undefined;
  const open = data ? data.indicators.filter((i) => i.level === "high" || i.level === "critical").length : 0;
  return (
    <Panel href="/intelligence/cara/org-risk" icon={Activity} title="Burnout & Org Risk" loading={isLoading}>
      {data ? (
        <>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {level && <Stat label="overall" value={level.label} accent={level.accent} />}
            {open > 0 && <Stat label="elevated indicators" value={open} accent="text-orange-700" />}
          </div>
          {data.headline && (
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-[var(--cs-text-secondary,#475569)]">
              {data.headline}
            </p>
          )}
        </>
      ) : (
        <p className="py-0.5 text-xs text-[var(--cs-text-muted,#94a3b8)]">No risk data yet</p>
      )}
    </Panel>
  );
}

export function ManagerPracticeOversightCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileCheck className="h-5 w-5 text-[var(--cs-cara-gold,#b45309)]" />
          Practice Oversight
        </CardTitle>
        <p className="text-xs text-[var(--cs-text-muted,#64748b)]">
          Statement-of-Purpose assurance and organisational risk — a summary, with the full module one click away.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <SopPanel />
          <OrgRiskPanel />
        </div>
      </CardContent>
    </Card>
  );
}
