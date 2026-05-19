"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Gauge,
  Users,
  Scale,
  Lock,
  Megaphone,
  Coins,
  Settings,
  UserCog,
  Leaf,
  Target,
  Calendar,
  Activity,
  CheckCircle2,
  AlertOctagon,
  Link2,
  Info,
  Loader2,
} from "lucide-react";
import { useStrategicRiskRecords } from "@/hooks/use-strategic-risk-records";
import type {
  StrategicRiskRecord,
  StrategicRiskCategory,
  StrategicRiskVelocity,
  StrategicRiskTrendDirection,
  StrategicRiskAppetiteAlignment,
  StrategicRiskKRIStatus,
} from "@/types/extended";
import {
  STRATEGIC_RISK_CATEGORY_LABEL,
  STRATEGIC_RISK_VELOCITY_LABEL,
  STRATEGIC_RISK_TREND_DIRECTION_LABEL,
  STRATEGIC_RISK_APPETITE_ALIGNMENT_LABEL,
  STRATEGIC_RISK_KRI_STATUS_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── local config (icons cannot be serialized) ────────────────────── */

const CATEGORY_CONFIG: Record<StrategicRiskCategory, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  operational:    { icon: Settings,    color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200"    },
  workforce:      { icon: Users,       color: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200"  },
  regulatory:     { icon: Scale,       color: "text-[var(--cs-aria-gold)]",  bg: "bg-[var(--cs-aria-gold-bg)]",  border: "border-[var(--cs-aria-gold-soft)]"  },
  financial:      { icon: Coins,       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  reputational:   { icon: Megaphone,   color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200"    },
  strategic:      { icon: Target,      color: "text-[var(--cs-text-secondary)]",   bg: "bg-slate-50",   border: "border-[var(--cs-border)]"   },
  safeguarding:   { icon: ShieldAlert, color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200"     },
  environmental:  { icon: Leaf,        color: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-200"    },
  cyber_data:     { icon: Lock,        color: "text-cyan-700",    bg: "bg-cyan-50",    border: "border-cyan-200"    },
};

const APPETITE_CONFIG: Record<StrategicRiskAppetiteAlignment, { color: string; bg: string; border: string }> = {
  within_appetite:   { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  at_appetite_limit: { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
  above_appetite:    { color: "text-red-700",     bg: "bg-red-100",    border: "border-red-300"     },
};

const KRI_CONFIG: Record<StrategicRiskKRIStatus, { color: string; bg: string; border: string }> = {
  ok:      { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  warning: { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
  trigger: { color: "text-red-700",     bg: "bg-red-100",    border: "border-red-300"     },
};

function scoreLevel(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 20) return { label: "Severe",   color: "text-red-700",     bg: "bg-red-100",    border: "border-red-300"    };
  if (score >= 15) return { label: "High",     color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-300" };
  if (score >= 8)  return { label: "Moderate", color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"  };
  return              { label: "Low",      color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" };
}

function trendIcon(t: StrategicRiskTrendDirection) {
  if (t === "increasing") return TrendingUp;
  if (t === "decreasing") return TrendingDown;
  return Minus;
}

function trendColor(t: StrategicRiskTrendDirection) {
  if (t === "increasing") return "text-red-600";
  if (t === "decreasing") return "text-emerald-600";
  return "text-[var(--cs-text-muted)]";
}

/* ── page ──────────────────────────────────────────────────────────── */

export default function RiskManagementBoardPage() {
  const { data: risks = [], isLoading } = useStrategicRiskRecords();
  const [categoryFilter, setCategoryFilter] = useState<StrategicRiskCategory | "all">("all");
  const [appetiteFilter, setAppetiteFilter] = useState<StrategicRiskAppetiteAlignment | "all">("all");
  const [sortBy, setSortBy] = useState("residual-desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const stats = useMemo(() => {
    const total = risks.length;
    const highImpact = risks.filter((r) => r.residual_risk_score >= 15).length;
    const aboveAppetite = risks.filter((r) => r.risk_appetite_alignment === "above_appetite").length;
    const reviewsDue30 = risks.filter((r) => {
      const diff = (new Date(r.next_review_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    }).length;
    return { total, highImpact, aboveAppetite, reviewsDue30 };
  }, [risks, today]);

  const visible = useMemo(() => {
    let list = [...risks];
    if (categoryFilter !== "all") list = list.filter((r) => r.category === categoryFilter);
    if (appetiteFilter !== "all") list = list.filter((r) => r.risk_appetite_alignment === appetiteFilter);
    switch (sortBy) {
      case "residual-desc": list.sort((a, b) => b.residual_risk_score - a.residual_risk_score); break;
      case "residual-asc": list.sort((a, b) => a.residual_risk_score - b.residual_risk_score); break;
      case "inherent-desc": list.sort((a, b) => b.inherent_risk_score - a.inherent_risk_score); break;
      case "review-asc": list.sort((a, b) => a.next_review_date.localeCompare(b.next_review_date)); break;
      case "category": list.sort((a, b) => a.category.localeCompare(b.category)); break;
      case "title": list.sort((a, b) => a.risk_title.localeCompare(b.risk_title)); break;
    }
    return list;
  }, [risks, categoryFilter, appetiteFilter, sortBy]);

  const exportCols: ExportColumn<StrategicRiskRecord>[] = [
    { header: "ID",                   accessor: (r) => r.id },
    { header: "Risk",                 accessor: (r) => r.risk_title },
    { header: "Category",             accessor: (r) => STRATEGIC_RISK_CATEGORY_LABEL[r.category] },
    { header: "Description",          accessor: (r) => r.description },
    { header: "Likelihood",           accessor: (r) => r.current_likelihood },
    { header: "Impact",               accessor: (r) => r.current_impact },
    { header: "Inherent score",       accessor: (r) => r.inherent_risk_score },
    { header: "Residual score",       accessor: (r) => r.residual_risk_score },
    { header: "Target score",         accessor: (r) => r.target_risk_score },
    { header: "Owner",                accessor: (r) => getStaffName(r.risk_owner) },
    { header: "Review frequency",     accessor: (r) => r.review_frequency },
    { header: "Last reviewed",        accessor: (r) => r.last_reviewed },
    { header: "Next review",          accessor: (r) => r.next_review_date },
    { header: "Board level",          accessor: (r) => (r.board_level ? "Yes" : "No") },
    { header: "Velocity",             accessor: (r) => STRATEGIC_RISK_VELOCITY_LABEL[r.velocity_of_change] },
    { header: "Trend",                accessor: (r) => STRATEGIC_RISK_TREND_DIRECTION_LABEL[r.trend] },
    { header: "Appetite alignment",   accessor: (r) => STRATEGIC_RISK_APPETITE_ALIGNMENT_LABEL[r.risk_appetite_alignment] },
    { header: "Current controls",     accessor: (r) => r.current_controls.join("; ") },
    { header: "Additional controls",  accessor: (r) => r.additional_controls_required.join("; ") },
    { header: "Escalation criteria",  accessor: (r) => r.escalation_criteria },
    { header: "Interconnected risks", accessor: (r) => r.interconnected_risks.join(", ") },
    { header: "KRIs", accessor: (r) => r.key_risk_indicators.map((k) => `${k.indicator}: ${k.current_value} (threshold ${k.threshold}, ${STRATEGIC_RISK_KRI_STATUS_LABEL[k.status]})`).join(" | ") },
  ];

  if (isLoading) {
    return (
      <PageShell title="Strategic Risk Management Board" subtitle="Organisational risk register — board-level oversight of risks to the home as a regulated business">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Strategic Risk Management Board"
      subtitle="Organisational risk register — board-level oversight of risks to the home as a regulated business"
      ariaContext={{ pageTitle: "Strategic Risk Management Board", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={visible} columns={exportCols} filename="strategic-risk-register" />
          <PrintButton title="Strategic Risk Management Board" />
          <AriaStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 mb-6 flex items-start gap-3">
        <Info className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-indigo-900">Strategic / organisational risk — not per-child risk</p>
          <p className="text-xs text-indigo-800 mt-1 leading-relaxed">
            This board tracks risks to the home as a regulated business: workforce, regulatory, financial, cyber, reputational, succession and environmental. It is the governance counterpart to the operational risk register and the per-child risk plans, which sit under the Risk Register and individual care plans respectively. Required by Quality Standard 13 (Leadership &amp; Management) and reviewed by the Responsible Individual.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total strategic risks", value: stats.total, color: "text-[var(--cs-text-secondary)]", bg: "bg-slate-50", border: "border-[var(--cs-border)]", icon: Gauge },
          { label: "High impact (residual ≥ 15)", value: stats.highImpact, color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", icon: AlertTriangle },
          { label: "Above risk appetite", value: stats.aboveAppetite, color: "text-red-700", bg: "bg-red-50", border: "border-red-200", icon: AlertOctagon },
          { label: "Reviews due within 30 days", value: stats.reviewsDue30, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: Calendar },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={cn("rounded-lg border p-3 flex items-center gap-3", s.bg, s.border)}>
              <Icon className={cn("h-5 w-5 flex-shrink-0", s.color)} />
              <div>
                <div className={cn("text-xl font-bold leading-none", s.color)}>{s.value}</div>
                <div className="text-[10px] text-[var(--cs-text-muted)] font-medium mt-1">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as StrategicRiskCategory | "all")}>
          <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(Object.keys(STRATEGIC_RISK_CATEGORY_LABEL) as StrategicRiskCategory[]).map((c) => (
              <SelectItem key={c} value={c}>{STRATEGIC_RISK_CATEGORY_LABEL[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={appetiteFilter} onValueChange={(v) => setAppetiteFilter(v as StrategicRiskAppetiteAlignment | "all")}>
          <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue placeholder="Appetite" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All appetite alignments</SelectItem>
            {(Object.keys(STRATEGIC_RISK_APPETITE_ALIGNMENT_LABEL) as StrategicRiskAppetiteAlignment[]).map((k) => (
              <SelectItem key={k} value={k}>{STRATEGIC_RISK_APPETITE_ALIGNMENT_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="residual-desc">Residual score (high → low)</SelectItem>
              <SelectItem value="residual-asc">Residual score (low → high)</SelectItem>
              <SelectItem value="inherent-desc">Inherent score (high → low)</SelectItem>
              <SelectItem value="review-asc">Next review (soonest)</SelectItem>
              <SelectItem value="category">Category (A → Z)</SelectItem>
              <SelectItem value="title">Title (A → Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <span className="ml-auto text-[11px] text-[var(--cs-text-muted)]">Showing {visible.length} of {risks.length}</span>
      </div>

      <div className="space-y-3">
        {visible.map((r) => {
          const cat = CATEGORY_CONFIG[r.category];
          const CatIcon = cat.icon;
          const residual = scoreLevel(r.residual_risk_score);
          const inherent = scoreLevel(r.inherent_risk_score);
          const target = scoreLevel(r.target_risk_score);
          const appetite = APPETITE_CONFIG[r.risk_appetite_alignment];
          const TrendIcon = trendIcon(r.trend);
          const isExpanded = expandedId === r.id;

          return (
            <div key={r.id} className={cn("rounded-lg border bg-white transition-all", r.risk_appetite_alignment === "above_appetite" && "ring-2 ring-red-300 border-red-200")}>
              <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                <div className={cn("mt-0.5 rounded-md p-1.5 border flex-shrink-0", cat.bg, cat.border)}>
                  <CatIcon className={cn("h-4 w-4", cat.color)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-semibold text-[var(--cs-navy)]">{r.risk_title}</h3>
                    {r.board_level && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-[var(--cs-text-secondary)] border border-[var(--cs-border)]">Board-level</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-[var(--cs-text-muted)]">
                    <span className={cn("flex items-center gap-1 font-medium", cat.color)}><CatIcon className="h-3 w-3" />{STRATEGIC_RISK_CATEGORY_LABEL[r.category]}</span>
                    <span>·</span>
                    <span>Owner: {getStaffName(r.risk_owner)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Next review: {r.next_review_date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={cn("text-[10px] font-semibold px-2 py-1 rounded border", residual.bg, residual.color, residual.border)}>Residual {r.residual_risk_score} · {residual.label}</div>
                  <div className={cn("text-[10px] font-medium px-2 py-1 rounded border flex items-center gap-1", appetite.bg, appetite.color, appetite.border)}>{STRATEGIC_RISK_APPETITE_ALIGNMENT_LABEL[r.risk_appetite_alignment]}</div>
                  <div className={cn("flex items-center gap-1", trendColor(r.trend))}><TrendIcon className="h-3.5 w-3.5" /><span className="text-[10px] font-medium">{STRATEGIC_RISK_TREND_DIRECTION_LABEL[r.trend]}</span></div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t px-4 pb-4 pt-3 space-y-4">
                  <div>
                    <h4 className="text-[11px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-1">Description</h4>
                    <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{r.description}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="rounded-lg bg-slate-50 border border-[var(--cs-border-subtle)] p-2.5 text-center"><div className="text-lg font-bold text-[var(--cs-text-secondary)]">{r.current_likelihood}</div><div className="text-[10px] text-[var(--cs-text-muted)]">Likelihood (1-5)</div></div>
                    <div className="rounded-lg bg-slate-50 border border-[var(--cs-border-subtle)] p-2.5 text-center"><div className="text-lg font-bold text-[var(--cs-text-secondary)]">{r.current_impact}</div><div className="text-[10px] text-[var(--cs-text-muted)]">Impact (1-5)</div></div>
                    <div className={cn("rounded-lg border p-2.5 text-center", inherent.bg, inherent.border)}><div className={cn("text-lg font-bold", inherent.color)}>{r.inherent_risk_score}</div><div className="text-[10px] text-[var(--cs-text-muted)]">Inherent</div></div>
                    <div className={cn("rounded-lg border p-2.5 text-center", residual.bg, residual.border)}><div className={cn("text-lg font-bold", residual.color)}>{r.residual_risk_score}</div><div className="text-[10px] text-[var(--cs-text-muted)]">Residual</div></div>
                    <div className={cn("rounded-lg border p-2.5 text-center", target.bg, target.border)}><div className={cn("text-lg font-bold", target.color)}>{r.target_risk_score}</div><div className="text-[10px] text-[var(--cs-text-muted)]">Target</div></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-md border border-[var(--cs-border-subtle)] bg-slate-50 p-2.5">
                      <div className="text-[10px] uppercase tracking-wide text-[var(--cs-text-muted)] mb-0.5">Velocity of change</div>
                      <div className="text-xs font-semibold text-[var(--cs-text-secondary)] flex items-center gap-1.5"><Activity className="h-3 w-3" />{STRATEGIC_RISK_VELOCITY_LABEL[r.velocity_of_change]}</div>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border-subtle)] bg-slate-50 p-2.5">
                      <div className="text-[10px] uppercase tracking-wide text-[var(--cs-text-muted)] mb-0.5">Trend</div>
                      <div className={cn("text-xs font-semibold flex items-center gap-1.5", trendColor(r.trend))}><TrendIcon className="h-3 w-3" />{STRATEGIC_RISK_TREND_DIRECTION_LABEL[r.trend]}</div>
                    </div>
                    <div className={cn("rounded-md border p-2.5", appetite.bg, appetite.border)}>
                      <div className="text-[10px] uppercase tracking-wide text-[var(--cs-text-muted)] mb-0.5">Appetite alignment</div>
                      <div className={cn("text-xs font-semibold", appetite.color)}>{STRATEGIC_RISK_APPETITE_ALIGNMENT_LABEL[r.risk_appetite_alignment]}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide mb-2">Current controls ({r.current_controls.length})</h4>
                    <ul className="space-y-1.5">
                      {r.current_controls.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[var(--cs-text-secondary)]"><CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />{c}</li>
                      ))}
                    </ul>
                  </div>

                  {r.additional_controls_required.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-2">Additional controls required ({r.additional_controls_required.length})</h4>
                      <ul className="space-y-1.5">
                        {r.additional_controls_required.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-[var(--cs-text-secondary)]"><AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h4 className="text-[11px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2">Key risk indicators</h4>
                    <div className="overflow-hidden border border-[var(--cs-border-subtle)] rounded-md">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr className="text-left">
                            <th className="px-2.5 py-1.5 font-medium text-[var(--cs-text-secondary)] text-[10px] uppercase tracking-wide">Indicator</th>
                            <th className="px-2.5 py-1.5 font-medium text-[var(--cs-text-secondary)] text-[10px] uppercase tracking-wide">Current</th>
                            <th className="px-2.5 py-1.5 font-medium text-[var(--cs-text-secondary)] text-[10px] uppercase tracking-wide">Threshold</th>
                            <th className="px-2.5 py-1.5 font-medium text-[var(--cs-text-secondary)] text-[10px] uppercase tracking-wide">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.key_risk_indicators.map((k, i) => {
                            const cfg = KRI_CONFIG[k.status];
                            return (
                              <tr key={i} className="border-t border-[var(--cs-border-subtle)]">
                                <td className="px-2.5 py-1.5 text-[var(--cs-text-secondary)]">{k.indicator}</td>
                                <td className="px-2.5 py-1.5 text-[var(--cs-text-secondary)] font-medium">{k.current_value}</td>
                                <td className="px-2.5 py-1.5 text-[var(--cs-text-muted)]">{k.threshold}</td>
                                <td className="px-2.5 py-1.5">
                                  <span className={cn("inline-block text-[10px] font-semibold px-2 py-0.5 rounded border", cfg.bg, cfg.color, cfg.border)}>{STRATEGIC_RISK_KRI_STATUS_LABEL[k.status]}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-md border border-rose-100 bg-rose-50 p-3">
                    <div className="text-[10px] uppercase tracking-wide text-rose-700 font-semibold mb-1 flex items-center gap-1"><AlertOctagon className="h-3 w-3" />Escalation criteria</div>
                    <p className="text-xs text-rose-900 leading-relaxed">{r.escalation_criteria}</p>
                  </div>

                  {r.interconnected_risks.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-1.5 flex items-center gap-1"><Link2 className="h-3 w-3" />Interconnected risks</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {r.interconnected_risks.map((id) => {
                          const linked = risks.find((x) => x.id === id);
                          return (
                            <span key={id} className="text-[10px] px-2 py-0.5 rounded border bg-slate-50 border-[var(--cs-border)] text-[var(--cs-text-secondary)]">
                              {linked ? linked.risk_title : id}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 flex-wrap text-[10px] text-[var(--cs-text-muted)] pt-1 border-t border-[var(--cs-border-subtle)]">
                    <span className="flex items-center gap-1"><UserCog className="h-3 w-3" />Owner: {getStaffName(r.risk_owner)}</span>
                    <span>Review frequency: {r.review_frequency}</span>
                    <span>Last reviewed: {r.last_reviewed}</span>
                    <span>Next review: {r.next_review_date}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {visible.length === 0 && (
          <div className="text-center py-16 text-[var(--cs-text-muted)]">
            <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No strategic risks match the current filters</p>
            <p className="text-xs mt-1">Adjust category or appetite filter to see results</p>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-lg bg-slate-50 border border-[var(--cs-border)] p-4">
        <div className="flex items-start gap-3">
          <Scale className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">About the Strategic Risk Management Board</h4>
            <p className="text-[11px] text-[var(--cs-text-muted)] leading-relaxed">
              This board is the home&apos;s organisational risk register. It captures risks to the home as a regulated business and is reviewed by the Registered Manager and Responsible Individual on the cadence shown against each risk. It is the evidence base for The Children&apos;s Homes (England) Regulations 2015, Schedule 1 and the Quality Standards — specifically Quality Standard 13 (Leadership &amp; Management), which requires the Registered Manager to understand and mitigate risks to the quality of care, and to demonstrate clear accountability, decision-making and oversight at board level. Strategic risks recorded here are distinct from operational risks held in the Risk Register and individual risk plans recorded in each child&apos;s care plan.
            </p>
          </div>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Safeguarding & Behaviour"
        category={["safeguarding", "behaviour", "missing_episode"]}
        days={90}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Strategic Risk Management Board — organisational risk register, workforce risk, regulatory risk, financial risk, reputational risk, governance risk, RI oversight, QS13 evidence"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}
