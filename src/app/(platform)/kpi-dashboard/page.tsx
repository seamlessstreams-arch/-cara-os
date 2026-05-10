"use client";

import { useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, Minus,
  Shield, CheckCircle2, AlertTriangle, XCircle,
  BarChart3, Heart, GraduationCap, Users, ClipboardCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKpiEntries } from "@/hooks/use-kpi-entries";
import type { KpiEntry, KpiRag, KpiTrend, KpiCategory } from "@/types/extended";
import { KPI_RAG_LABEL, KPI_TREND_LABEL, KPI_CATEGORY_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── UI metadata ──────────────────────────────────────────────────────── */

const CATEGORY_ICON: Record<KpiCategory, React.ReactNode> = {
  experiences_progress:  <BarChart3 className="h-4 w-4" />,
  health_wellbeing:      <Heart className="h-4 w-4" />,
  safety:                <Shield className="h-4 w-4" />,
  education:             <GraduationCap className="h-4 w-4" />,
  leadership_management: <Users className="h-4 w-4" />,
};

const RAG_META: Record<KpiRag, { dotColor: string; bgColor: string; textColor: string }> = {
  green: { dotColor: "bg-green-500", bgColor: "bg-green-50",  textColor: "text-green-700" },
  amber: { dotColor: "bg-amber-500", bgColor: "bg-amber-50",  textColor: "text-amber-700" },
  red:   { dotColor: "bg-red-500",   bgColor: "bg-red-50",    textColor: "text-red-700" },
};

const TREND_ICON: Record<KpiTrend, React.ReactNode> = {
  up:     <TrendingUp className="h-3.5 w-3.5 text-green-600" />,
  down:   <TrendingDown className="h-3.5 w-3.5 text-red-600" />,
  stable: <Minus className="h-3.5 w-3.5 text-muted-foreground" />,
};

export default function KPIDashboardPage() {
  const { data: res, isLoading } = useKpiEntries();
  const kpis: KpiEntry[] = res?.data ?? [];

  const summary = useMemo(() => {
    const green = kpis.filter((k) => k.rag === "green").length;
    const amber = kpis.filter((k) => k.rag === "amber").length;
    const red   = kpis.filter((k) => k.rag === "red").length;

    let overall: KpiRag = "green";
    if (red > 0) overall = "red";
    else if (amber > 0) overall = "amber";

    return { green, amber, red, total: kpis.length, overall };
  }, [kpis]);

  const categories = useMemo(() => {
    const order: KpiCategory[] = [
      "experiences_progress",
      "health_wellbeing",
      "safety",
      "education",
      "leadership_management",
    ];
    return order.map((cat) => ({
      key: cat,
      label: KPI_CATEGORY_LABEL[cat],
      icon: CATEGORY_ICON[cat],
      items: kpis.filter((k) => k.category === cat),
    }));
  }, [kpis]);

  const exportCols: ExportColumn<KpiEntry>[] = [
    { header: "ID",       accessor: (r: KpiEntry) => r.id },
    { header: "Category", accessor: (r: KpiEntry) => KPI_CATEGORY_LABEL[r.category] },
    { header: "KPI",      accessor: (r: KpiEntry) => r.name },
    { header: "Value",    accessor: (r: KpiEntry) => r.value },
    { header: "Target",   accessor: (r: KpiEntry) => r.target },
    { header: "RAG",      accessor: (r: KpiEntry) => r.rag.toUpperCase() },
    { header: "Trend",    accessor: (r: KpiEntry) => KPI_TREND_LABEL[r.trend] },
    { header: "Notes",    accessor: (r: KpiEntry) => r.notes },
  ];

  if (isLoading) return <PageShell title="KPI Dashboard" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="KPI Dashboard"
      subtitle="Ofsted-aligned key performance indicators across care quality, safeguarding, education, staffing, and compliance"
      ariaContext={{ pageTitle: "KPI Dashboard", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="KPI Dashboard" />
          <ExportButton data={kpis} columns={exportCols} filename="kpi-dashboard" />
          <AriaStudioQuickActionButton context={{ record_type: "ofsted_evidence", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

        {/* Overall RAG Rating */}
        <Card className={cn(
          "border-l-4",
          summary.overall === "green" ? "border-l-green-500" : summary.overall === "amber" ? "border-l-amber-500" : "border-l-red-500",
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  RAG_META[summary.overall].bgColor,
                )}>
                  {summary.overall === "green" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : summary.overall === "amber" ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Performance Rating</p>
                  <p className={cn("text-lg font-bold", RAG_META[summary.overall].textColor)}>
                    {summary.overall === "green" ? "Good" : summary.overall === "amber" ? "Requires Improvement" : "Inadequate"} — {KPI_RAG_LABEL[summary.overall].toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm font-semibold">{summary.green}</span>
                  <span className="text-xs text-muted-foreground">Green</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-sm font-semibold">{summary.amber}</span>
                  <span className="text-xs text-muted-foreground">Amber</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm font-semibold">{summary.red}</span>
                  <span className="text-xs text-muted-foreground">Red</span>
                </div>
                <div className="border-l pl-4 ml-2">
                  <span className="text-xs text-muted-foreground">Total KPIs</span>
                  <p className="text-sm font-bold">{summary.total}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Sections */}
        {categories.map((cat) => {
          const catGreens = cat.items.filter((k) => k.rag === "green").length;
          const catAmbers = cat.items.filter((k) => k.rag === "amber").length;
          const catReds   = cat.items.filter((k) => k.rag === "red").length;
          const catRag: KpiRag = catReds > 0 ? "red" : catAmbers > 0 ? "amber" : "green";

          return (
            <Card key={cat.key}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {cat.icon}
                    {cat.label}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      "text-xs",
                      RAG_META[catRag].bgColor,
                      RAG_META[catRag].textColor,
                    )}>
                      {catRag.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {catGreens}G / {catAmbers}A / {catReds}R
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y">
                  {cat.items.map((kpi) => (
                    <div key={kpi.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={cn(
                              "h-2.5 w-2.5 rounded-full flex-shrink-0",
                              RAG_META[kpi.rag].dotColor,
                            )} />
                            <p className="text-sm font-medium">{kpi.name}</p>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              {TREND_ICON[kpi.trend]}
                              {KPI_TREND_LABEL[kpi.trend]}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground ml-[18px]">{kpi.notes}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={cn("text-sm font-bold", RAG_META[kpi.rag].textColor)}>
                            {kpi.value}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Target: {kpi.target}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Regulatory Note */}
        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <ClipboardCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Performance is monitored against Ofsted&apos;s Social Care Common Inspection Framework (SCCIF). KPIs are reviewed monthly by the Registered Manager and reported to the Responsible Individual. Amber and red indicators require an action plan within 7 working days. This dashboard supports continuous improvement and regulatory compliance under the Children&apos;s Homes (England) Regulations 2015.
            </span>
          </CardContent>
        </Card>
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={90}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="KPI Dashboard — Ofsted SCCIF performance indicators, RAG ratings, trends across care quality, safeguarding, education, staffing and compliance"
        recordType="ofsted_evidence"
        className="mt-6"
      />
    </PageShell>
  );
}
