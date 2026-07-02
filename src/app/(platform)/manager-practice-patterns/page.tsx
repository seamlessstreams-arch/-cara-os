"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGER PRACTICE INTELLIGENCE DASHBOARD
// Aggregates ManagerPatternOversightEngine signals across all recent records
// (last 30 days). Surfaces per-child pattern insights, supervision prompts,
// and plan-review flags. Manager-only view.
//
// Cara advises. Managers decide. Professionals remain accountable.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { FlatList, FlatListRow, FlatListRowDetail } from "@/components/ui/list-row";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useManagerPracticePatterns } from "@/hooks/use-manager-practice-patterns";
import type { ChildPatternSummary, PatternInsightItem } from "@/hooks/use-manager-practice-patterns";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
  Activity,
  MapPin,
  UserCheck,
  BookOpen,
  TrendingUp,
  Info,
  Loader2,
  Brain,
  ClipboardCheck,
  HeartHandshake,
} from "lucide-react";

// ── Pattern type config ───────────────────────────────────────────────────────

const PATTERN_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  incident_frequency: {
    label: "Pattern Emerging",
    icon: Activity,
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  police_contact: {
    label: "Police Contact",
    icon: Shield,
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  missing_episode: {
    label: "Missing Episode",
    icon: MapPin,
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  staff_stress: {
    label: "Staff Support Required",
    icon: UserCheck,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  recording_quality: {
    label: "Recording Language",
    icon: BookOpen,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
};

const RISK_BADGE: Record<string, string> = {
  high:   "bg-[--cs-risk-bg] text-[--cs-risk] border-[--cs-risk-soft]",
  medium: "bg-[--cs-warning-bg] text-[--cs-warning] border-[--cs-warning-soft]",
  low:    "bg-[--cs-info-bg] text-[--cs-info] border-[--cs-info-soft]",
};

function patternCfg(type: string) {
  return PATTERN_CONFIG[type] ?? {
    label: type.replace(/_/g, " "),
    icon: Info,
    color: "text-slate-700",
    bg: "bg-slate-50",
    border: "border-slate-200",
  };
}

// ── Insight card ──────────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: PatternInsightItem }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = patternCfg(insight.patternType);
  const Icon = cfg.icon;

  return (
    <div className={cn("rounded-lg border p-4 space-y-2", cfg.bg, cfg.border)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4 shrink-0", cfg.color)} />
          <span className={cn("text-sm font-medium", cfg.color)}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {insight.planReviewNeeded && (
            <Badge variant="outline" className="text-xs border-[--cs-warning-soft] text-[--cs-warning] bg-[--cs-warning-bg]">
              Plan review
            </Badge>
          )}
          <Badge variant="outline" className={cn("text-xs capitalize border", RISK_BADGE[insight.riskLevel])}>
            {insight.riskLevel}
          </Badge>
        </div>
      </div>

      {insight.evidence.map((ev, i) => (
        <p key={i} className="text-xs text-slate-600 leading-relaxed pl-6">{ev}</p>
      ))}

      {(insight.recommendedManagerActions.length > 0 || insight.supervisionPrompts.length > 0) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn("flex items-center gap-1 text-xs mt-1 pl-6", cfg.color)}
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "Hide prompts" : "Show prompts"}
        </button>
      )}

      {expanded && (
        <div className="pl-6 space-y-3 pt-1">
          {insight.recommendedManagerActions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-700 mb-1">Recommended actions</p>
              <ul className="space-y-1">
                {insight.recommendedManagerActions.map((a, i) => (
                  <li key={i} className="text-xs text-slate-600 flex gap-2">
                    <span className="text-slate-400 shrink-0">•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {insight.supervisionPrompts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-700 mb-1">Supervision prompts</p>
              <ul className="space-y-1">
                {insight.supervisionPrompts.map((p, i) => (
                  <li key={i} className="text-xs text-slate-600 flex gap-2">
                    <span className="text-amber-500 shrink-0">?</span>
                    <span className="italic">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Child pattern card ────────────────────────────────────────────────────────

function ChildPatternCard({ child }: { child: ChildPatternSummary }) {
  const [open, setOpen] = useState(true);
  const hasHighRisk = child.highRiskCount > 0;

  return (
    <div>
      <FlatListRow
        severity={hasHighRisk ? "risk" : "neutral"}
        className="items-center justify-between"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <HeartHandshake className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-semibold text-slate-900 text-sm">{child.childName}</p>
            <p className="text-xs text-slate-500">
              {child.totalRecords} record{child.totalRecords !== 1 ? "s" : ""} analysed ·{" "}
              {child.patternInsights.length} pattern signal{child.patternInsights.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {child.planReviewNeeded && (
            <Badge variant="outline" className="text-xs border-[--cs-warning-soft] text-[--cs-warning] bg-[--cs-warning-bg]">
              <ClipboardCheck className="h-3 w-3 mr-1" />
              Plan review
            </Badge>
          )}
          {child.highRiskCount > 0 && (
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[--cs-risk]">
              {child.highRiskCount} high risk
            </span>
          )}
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </FlatListRow>

      {open && (
        <FlatListRowDetail className="space-y-2">
          {child.patternInsights.map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))}
        </FlatListRowDetail>
      )}
    </div>
  );
}

// ── Pattern breakdown strip ───────────────────────────────────────────────────

function PatternStrip({
  type,
  count,
  affectedChildren,
  highRiskCount,
}: {
  type: string;
  count: number;
  affectedChildren: string[];
  highRiskCount: number;
}) {
  const cfg = patternCfg(type);
  const Icon = cfg.icon;
  return (
    <div className={cn("rounded-lg border p-3 flex items-center justify-between gap-3", cfg.bg, cfg.border)}>
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4 shrink-0", cfg.color)} />
        <span className={cn("text-sm font-medium", cfg.color)}>{cfg.label}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>{count} signal{count !== 1 ? "s" : ""}</span>
        {highRiskCount > 0 && (
          <Badge className="text-xs bg-[--cs-risk-bg] text-[--cs-risk] border border-[--cs-risk-soft] hover:bg-[--cs-risk-bg]">
            {highRiskCount} high risk
          </Badge>
        )}
        <span>· {affectedChildren.length} child{affectedChildren.length !== 1 ? "ren" : ""}</span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ManagerPracticePatternsDashboard() {
  const { data, isLoading, isError, refetch } = useManagerPracticePatterns();
  const result = data?.data;

  return (
    <PageShell
      title="Manager Practice Intelligence"
      subtitle="Pattern signals across recent incidents, behaviour log, and missing episodes — last 30 days"
    >
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400 mr-3" />
          <span className="text-sm text-slate-500">Analysing practice records…</span>
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-[--cs-risk-soft] bg-[--cs-risk-bg] p-6 text-center">
          <AlertTriangle className="h-6 w-6 text-[--cs-risk] mx-auto mb-2" />
          <p className="text-sm text-[--cs-risk] font-medium">Could not load pattern data</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {result && (
        <div className="space-y-6">

          {/* ── Summary bar ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Records analysed", value: result.summary.totalRecordsAnalysed, icon: BookOpen, color: "text-slate-600" },
              { label: "Pattern signals", value: result.summary.totalInsights, icon: Brain, color: "text-violet-600" },
              { label: "Children flagged", value: result.summary.childrenWithPatterns, icon: HeartHandshake, color: "text-orange-600" },
              { label: "Plan reviews needed", value: result.summary.planReviewsNeeded, icon: ClipboardCheck, color: "text-[--cs-warning]" },
              { label: "High risk signals", value: result.summary.highRiskInsights, icon: AlertTriangle, color: "text-[--cs-risk]" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-1 shadow-sm"
              >
                <Icon className={cn("h-4 w-4", color)} />
                <p className={cn("text-2xl font-bold tabular-nums", color)}>{value}</p>
                <p className="text-xs text-slate-500 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* ── Pattern type breakdown ───────────────────────────────────── */}
          {result.patternBreakdown.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-700">Pattern type breakdown</h2>
              </div>
              <div className="space-y-2">
                {result.patternBreakdown.map((p) => (
                  <PatternStrip
                    key={p.patternType}
                    type={p.patternType}
                    count={p.count}
                    affectedChildren={p.affectedChildren}
                    highRiskCount={p.highRiskCount}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Per-child detail ─────────────────────────────────────────── */}
          {result.childSummaries.length > 0 ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HeartHandshake className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-700">Children with pattern signals</h2>
              </div>
              <FlatList>
                {result.childSummaries.map((child) => (
                  <ChildPatternCard key={child.childId} child={child} />
                ))}
              </FlatList>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
              <HeartHandshake className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">No pattern signals detected</p>
              <p className="text-xs text-slate-400 mt-1">
                No concerning records in the last 30 days requiring manager attention.
              </p>
            </div>
          )}

          {/* ── Disclaimer ───────────────────────────────────────────────── */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-medium text-slate-600">Professional accountability: </span>
              {result.disclaimer}
            </p>
          </div>
        </div>
      )}
    </PageShell>
  );
}
