"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown, ChevronUp, ArrowUpDown, Target, TrendingUp, TrendingDown,
  Activity, BarChart3, ShieldCheck, AlertTriangle, CheckCircle2, Minus,
  Users, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { useOutcomeMetrics } from "@/hooks/use-outcome-metrics";
import type { OutcomeMetric, OutcomeSCCIFArea, OutcomeDashboardDomain, OutcomeTrend, OutcomeRAG } from "@/types/extended";
import { OUTCOME_SCCIF_AREA_LABEL, OUTCOME_DASHBOARD_DOMAIN_LABEL, OUTCOME_TREND_LABEL, OUTCOME_RAG_LABEL } from "@/types/extended";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const SCCIF_AREAS: OutcomeSCCIFArea[] = [
  "overall_experiences_and_progress",
  "how_well_children_helped_protected",
  "effectiveness_leaders_managers",
];

const DOMAINS: OutcomeDashboardDomain[] = [
  "education", "health", "identity", "family_social",
  "behaviour_emotional", "self_care", "spiritual_cultural",
  "safety", "workforce", "practice",
];

const TREND_CLR: Record<OutcomeTrend, string> = {
  strong_improvement: "bg-emerald-100 text-emerald-800 border-emerald-300",
  improving: "bg-green-100 text-green-800 border-green-300",
  stable: "bg-blue-100 text-blue-800 border-blue-300",
  declining: "bg-orange-100 text-orange-800 border-orange-300",
  concerning: "bg-red-100 text-red-800 border-red-300",
};

const RAG_CLR: Record<OutcomeRAG, string> = {
  green: "bg-green-100 text-green-800 border-green-300",
  amber: "bg-amber-100 text-amber-800 border-amber-300",
  red: "bg-red-100 text-red-800 border-red-300",
};

const SCCIF_BORDER: Record<OutcomeSCCIFArea, string> = {
  overall_experiences_and_progress: "border-l-blue-500",
  how_well_children_helped_protected: "border-l-purple-500",
  effectiveness_leaders_managers: "border-l-emerald-500",
};

const SCCIF_BADGE: Record<OutcomeSCCIFArea, string> = {
  overall_experiences_and_progress: "bg-blue-50 text-blue-700 border-blue-200",
  how_well_children_helped_protected: "bg-purple-50 text-purple-700 border-purple-200",
  effectiveness_leaders_managers: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const trendIcon = (t: OutcomeTrend) => {
  if (t === "strong_improvement" || t === "improving") return <TrendingUp className="h-3.5 w-3.5" />;
  if (t === "declining" || t === "concerning") return <TrendingDown className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
};

/* ── component ─────────────────────────────────────────────────────────────── */

export default function OutcomesDashboardPage() {
  const { data: res, isLoading } = useOutcomeMetrics();
  const metrics: OutcomeMetric[] = res?.data ?? [];

  const [filterArea, setFilterArea] = useState<string>("all");
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [filterRAG, setFilterRAG] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("area");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let rows = [...metrics];
    if (filterArea !== "all") rows = rows.filter((r) => r.sccif_judgement_area === filterArea);
    if (filterDomain !== "all") rows = rows.filter((r) => r.domain === filterDomain);
    if (filterRAG !== "all") rows = rows.filter((r) => r.risk_rating === filterRAG);
    rows.sort((a, b) => {
      switch (sortBy) {
        case "area": return a.sccif_judgement_area.localeCompare(b.sccif_judgement_area);
        case "domain": return a.domain.localeCompare(b.domain);
        case "rag": {
          const order: Record<OutcomeRAG, number> = { red: 0, amber: 1, green: 2 };
          return order[a.risk_rating] - order[b.risk_rating];
        }
        case "trend": {
          const order: Record<OutcomeTrend, number> = {
            concerning: 0, declining: 1, stable: 2, improving: 3, strong_improvement: 4,
          };
          return order[a.trend] - order[b.trend];
        }
        case "name": return a.metric_name.localeCompare(b.metric_name);
        default: return 0;
      }
    });
    return rows;
  }, [metrics, filterArea, filterDomain, filterRAG, sortBy]);

  /* ── summary stats ── */
  const totalMetrics = metrics.length;
  const strongOrImproving = metrics.filter((r) => r.trend === "strong_improvement" || r.trend === "improving").length;
  const strongPct = totalMetrics > 0 ? Math.round((strongOrImproving / totalMetrics) * 100) : 0;
  const decliningOrConcerning = metrics.filter((r) => r.trend === "declining" || r.trend === "concerning").length;
  const greenRag = metrics.filter((r) => r.risk_rating === "green").length;

  const exportCols: ExportColumn<OutcomeMetric>[] = [
    { header: "Metric", accessor: (r: OutcomeMetric) => r.metric_name },
    { header: "SCCIF Judgement Area", accessor: (r: OutcomeMetric) => OUTCOME_SCCIF_AREA_LABEL[r.sccif_judgement_area] },
    { header: "Domain", accessor: (r: OutcomeMetric) => OUTCOME_DASHBOARD_DOMAIN_LABEL[r.domain] },
    { header: "Description", accessor: (r: OutcomeMetric) => r.description },
    { header: "Current Value", accessor: (r: OutcomeMetric) => r.current_value },
    { header: "Baseline", accessor: (r: OutcomeMetric) => r.baseline },
    { header: "Target", accessor: (r: OutcomeMetric) => r.target },
    { header: "Period", accessor: (r: OutcomeMetric) => r.period },
    { header: "Data Source", accessor: (r: OutcomeMetric) => r.data_source },
    { header: "Trend", accessor: (r: OutcomeMetric) => OUTCOME_TREND_LABEL[r.trend] },
    { header: "Per-Child Breakdown", accessor: (r: OutcomeMetric) => Object.entries(r.per_child_breakdown).map(([yp, v]) => `${getYPName(yp)}: ${v}`).join(" | ") },
    { header: "Narrative", accessor: (r: OutcomeMetric) => r.narrative },
    { header: "Contextual Factors", accessor: (r: OutcomeMetric) => r.contextual_factors.join("; ") },
    { header: "RAG", accessor: (r: OutcomeMetric) => OUTCOME_RAG_LABEL[r.risk_rating] },
    { header: "Owner", accessor: (r: OutcomeMetric) => getStaffName(r.responsible_owner) },
    { header: "Review Date", accessor: (r: OutcomeMetric) => r.review_date },
    { header: "Next Review", accessor: (r: OutcomeMetric) => r.next_review },
  ];

  if (isLoading) {
    return (
      <PageShell
        title="Outcomes Dashboard"
        subtitle="Aggregated Quality of Care · SCCIF Judgement Areas · Reg 45 / QS 13"
      >
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Outcomes Dashboard"
      subtitle="Aggregated Quality of Care · SCCIF Judgement Areas · Reg 45 / QS 13"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Outcomes Dashboard" />
          <ExportButton data={metrics} columns={exportCols} filename="outcomes-dashboard" />
        </div>
      }
    >
      <div id="print-area">
        {/* ── summary stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Metrics Tracked", value: String(totalMetrics), icon: BarChart3, clr: "text-blue-600" },
            { label: "Strong / Improving", value: `${strongPct}%`, icon: TrendingUp, clr: "text-emerald-600" },
            { label: "Declining / Concerning", value: String(decliningOrConcerning), icon: AlertTriangle, clr: "text-orange-600" },
            { label: "Green RAG", value: `${greenRag} / ${totalMetrics}`, icon: CheckCircle2, clr: "text-green-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── filters / sort ── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger className="w-[260px]"><SelectValue placeholder="SCCIF Area" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All SCCIF Areas</SelectItem>
              {SCCIF_AREAS.map((a) => (
                <SelectItem key={a} value={a}>{OUTCOME_SCCIF_AREA_LABEL[a]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterDomain} onValueChange={setFilterDomain}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Domain" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {DOMAINS.map((dom) => (
                <SelectItem key={dom} value={dom}>{OUTCOME_DASHBOARD_DOMAIN_LABEL[dom]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterRAG} onValueChange={setFilterRAG}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="RAG" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All RAG</SelectItem>
              {(Object.keys(OUTCOME_RAG_LABEL) as OutcomeRAG[]).map((k) => (
                <SelectItem key={k} value={k}>{OUTCOME_RAG_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-1">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <SelectValue placeholder="Sort" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="area">SCCIF Area</SelectItem>
              <SelectItem value="domain">Domain A-Z</SelectItem>
              <SelectItem value="rag">RAG (Red first)</SelectItem>
              <SelectItem value="trend">Trend (worst first)</SelectItem>
              <SelectItem value="name">Metric A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── card list ── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", SCCIF_BORDER[r.sccif_judgement_area])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                        {r.metric_name}
                        <Badge variant="outline" className={SCCIF_BADGE[r.sccif_judgement_area]}>
                          {OUTCOME_SCCIF_AREA_LABEL[r.sccif_judgement_area]}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                          {OUTCOME_DASHBOARD_DOMAIN_LABEL[r.domain]}
                        </Badge>
                        <Badge variant="outline" className={RAG_CLR[r.risk_rating]}>
                          {OUTCOME_RAG_LABEL[r.risk_rating]}
                        </Badge>
                        <Badge variant="outline" className={cn("flex items-center gap-1", TREND_CLR[r.trend])}>
                          {trendIcon(r.trend)}
                          {OUTCOME_TREND_LABEL[r.trend]}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{r.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Period: {r.period} · Owner: {getStaffName(r.responsible_owner)} · Next review: {r.next_review}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="hidden sm:flex flex-col items-end text-right">
                        <span className="text-base font-semibold">{r.current_value}</span>
                        <span className="text-[10px] text-muted-foreground">vs target {r.target}</span>
                      </div>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* Headline values */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="text-[10px] uppercase tracking-wide text-blue-700">Current</p>
                        <p className="text-sm font-semibold text-blue-900">{r.current_value}</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded p-2">
                        <p className="text-[10px] uppercase tracking-wide text-slate-600">Baseline</p>
                        <p className="text-sm font-semibold text-slate-800">{r.baseline}</p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded p-2">
                        <p className="text-[10px] uppercase tracking-wide text-emerald-700">Target</p>
                        <p className="text-sm font-semibold text-emerald-900">{r.target}</p>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded p-2">
                        <p className="text-[10px] uppercase tracking-wide text-purple-700">Data Source</p>
                        <p className="text-xs text-purple-900">{r.data_source}</p>
                      </div>
                    </div>

                    {/* Narrative */}
                    <div>
                      <p className="font-medium mb-1">Narrative</p>
                      <p className="text-muted-foreground text-xs">{r.narrative}</p>
                    </div>

                    {/* Per-child breakdown */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-blue-600" />
                        Per-Child Breakdown
                      </p>
                      <ul className="space-y-1">
                        {Object.entries(r.per_child_breakdown).map(([yp, v]) => (
                          <li key={yp} className="flex items-start gap-2 text-xs">
                            <Target className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <span><strong>{getYPName(yp)}:</strong> {v}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Contextual factors */}
                    {r.contextual_factors.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-amber-700">Contextual Factors</p>
                        <ul className="space-y-1">
                          {r.contextual_factors.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <ShieldCheck className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Footer meta */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground border-t pt-2">
                      <span>Last review: {r.review_date}</span>
                      <span>Next review: {r.next_review}</span>
                      <span>Owner: {getStaffName(r.responsible_owner)}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No outcome metrics match the current filters.
          </div>
        )}

        {/* ── regulatory note ── */}
        <Card className="mt-6 border-l-4 border-l-amber-500 bg-amber-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              Regulatory Basis
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>
              The Outcomes Dashboard supports the Registered Manager&apos;s duty under
              <strong> Regulation 45 of the Children&apos;s Homes (England) Regulations 2015</strong> to
              keep the quality of care under continuous review, and evidences progress against the
              <strong> Quality Standards</strong> — in particular Quality Standard 13 (the leadership
              and management standard).
            </p>
            <p>
              Metrics are mapped to the three SCCIF judgement areas used by Ofsted inspectors:
              Overall Experiences and Progress, How well children are helped and protected, and
              Effectiveness of leaders and managers. Where a metric trends Amber or Red, the
              responsible owner is required to update the linked action plan and revisit at the
              next monitoring meeting.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
