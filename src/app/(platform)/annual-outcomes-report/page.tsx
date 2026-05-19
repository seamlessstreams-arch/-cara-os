"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown, ChevronUp, ArrowUpDown, Target, TrendingUp,
  Users, BarChart3, Star, ShieldCheck, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName } from "@/lib/seed-data";
import type { AnnualOutcome, AnnualOutcomeDomain } from "@/types/extended";
import { useAnnualOutcomes } from "@/hooks/use-annual-outcomes";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const DOMAIN_LABEL: Record<AnnualOutcomeDomain, string> = {
  health: "Health",
  education: "Education",
  emotional_wellbeing: "Emotional Wellbeing",
  relationships: "Relationships",
  independence: "Independence",
  identity: "Identity",
  safety: "Safety",
};

const DOMAINS: AnnualOutcomeDomain[] = ["health", "education", "emotional_wellbeing", "relationships", "independence", "identity", "safety"];

const RATING_LABEL: Record<number, string> = { 1: "Significantly Below", 2: "Below Target", 3: "Progressing", 4: "Achieved", 5: "Exceeded" };
const RATING_CLR: Record<number, string> = {
  1: "bg-red-100 text-red-800 border-red-300",
  2: "bg-orange-100 text-orange-800 border-orange-300",
  3: "bg-amber-100 text-amber-800 border-amber-300",
  4: "bg-green-100 text-green-800 border-green-300",
  5: "bg-emerald-100 text-emerald-800 border-emerald-300",
};
const RATING_BAR: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-orange-500",
  3: "bg-amber-500",
  4: "bg-green-500",
  5: "bg-emerald-500",
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function AnnualOutcomesReportPage() {
  const { data: aoData, isLoading } = useAnnualOutcomes();
  const data = aoData?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterYP, setFilterYP] = useState("all");
  const [filterDomain, setFilterDomain] = useState("all");
  const [sortBy, setSortBy] = useState("rating-desc");

  const childIds = useMemo(() => [...new Set(data.map(r => r.child_id))], [data]);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (filterYP !== "all") rows = rows.filter((r) => r.child_id === filterYP);
    if (filterDomain !== "all") rows = rows.filter((r) => r.domain === filterDomain);
    rows.sort((a, b) => {
      switch (sortBy) {
        case "rating-desc": return b.progress_rating - a.progress_rating;
        case "rating-asc": return a.progress_rating - b.progress_rating;
        case "domain": return a.domain.localeCompare(b.domain);
        case "child": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default: return 0;
      }
    });
    return rows;
  }, [data, filterYP, filterDomain, sortBy]);

  /* ── summary stats ── */
  const avgProgress = data.length > 0 ? (data.reduce((sum, r) => sum + r.progress_rating, 0) / data.length).toFixed(1) : "0";
  const targetsAchieved = data.filter((r) => r.progress_rating >= 4).length;
  const childrenReviewed = new Set(data.map((r) => r.child_id)).size;
  const domainsCovered = new Set(data.map((r) => r.domain)).size;

  const exportCols: ExportColumn<AnnualOutcome>[] = [
    { header: "Young Person", accessor: (r: AnnualOutcome) => getYPName(r.child_id) },
    { header: "Reporting Year", accessor: (r: AnnualOutcome) => r.reporting_year },
    { header: "Domain", accessor: (r: AnnualOutcome) => DOMAIN_LABEL[r.domain] },
    { header: "Target Set", accessor: (r: AnnualOutcome) => r.target_set },
    { header: "Progress Rating", accessor: (r: AnnualOutcome) => String(r.progress_rating) },
    { header: "Evidence", accessor: (r: AnnualOutcome) => r.evidence },
    { header: "Barriers", accessor: (r: AnnualOutcome) => r.barriers_faced.join("; ") },
    { header: "Support Provided", accessor: (r: AnnualOutcome) => r.support_provided.join("; ") },
    { header: "Child View", accessor: (r: AnnualOutcome) => r.child_view },
    { header: "Next Year Target", accessor: (r: AnnualOutcome) => r.next_year_target },
    { header: "Reviewed By", accessor: (r: AnnualOutcome) => r.reviewed_by },
    { header: "Review Date", accessor: (r: AnnualOutcome) => r.review_date },
  ];

  return (
    <PageShell
      title="Annual Outcomes Report"
      subtitle="Year-End Progress · Care Plan Goals · Quality of Care Indicators"
      ariaContext={{ pageTitle: "Annual Outcomes Report", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Annual Outcomes Report" />
          <ExportButton data={data} columns={exportCols} filename="annual-outcomes-report" />
          <AriaStudioQuickActionButton context={{ record_type: "reg45", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <div id="print-area">
        {/* ── summary stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Avg Progress Score", value: avgProgress, icon: BarChart3, clr: "text-blue-600" },
            { label: "Targets Achieved (4+/5)", value: targetsAchieved, icon: Target, clr: "text-green-600" },
            { label: "Children Reviewed", value: childrenReviewed, icon: Users, clr: "text-purple-600" },
            { label: "Domains Covered", value: domainsCovered, icon: Star, clr: "text-amber-600" },
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
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Young Person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {childIds.map((c) => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterDomain} onValueChange={setFilterDomain}>
            <SelectTrigger className="w-[190px]"><SelectValue placeholder="Domain" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {DOMAINS.map((dom) => (
                <SelectItem key={dom} value={dom}>{DOMAIN_LABEL[dom]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]">
              <div className="flex items-center gap-1">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <SelectValue placeholder="Sort" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating-desc">Highest Rating</SelectItem>
              <SelectItem value="rating-asc">Lowest Rating</SelectItem>
              <SelectItem value="domain">Domain A-Z</SelectItem>
              <SelectItem value="child">Child A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── card list ── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <Card key={r.id} className="border-l-4 border-l-blue-400">
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.child_id)}
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">{DOMAIN_LABEL[r.domain]}</Badge>
                        <Badge variant="outline" className={RATING_CLR[r.progress_rating]}>
                          {r.progress_rating}/5 — {RATING_LABEL[r.progress_rating]}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.target_set}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Year: {r.reporting_year} · Reviewed: {r.review_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* progress bar mini */}
                      <div className="hidden sm:flex items-center gap-1 mr-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", RATING_BAR[r.progress_rating])} style={{ width: `${(r.progress_rating / 5) * 100}%` }} />
                        </div>
                      </div>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* Evidence */}
                    <div>
                      <p className="font-medium mb-1">Evidence of Progress</p>
                      <p className="text-muted-foreground text-xs">{r.evidence}</p>
                    </div>

                    {/* Barriers */}
                    {r.barriers_faced.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-amber-700">Barriers Faced</p>
                        <ul className="space-y-1">
                          {r.barriers_faced.map((b, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <ShieldCheck className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Support Provided */}
                    {r.support_provided.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-green-700">Support Provided</p>
                        <ul className="space-y-1">
                          {r.support_provided.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <TrendingUp className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Child's Own View */}
                    <div className="bg-purple-50 border border-purple-200 rounded p-2">
                      <p className="font-medium text-xs text-purple-800 mb-1">Child&apos;s Own View</p>
                      <p className="text-xs text-purple-700 italic">&ldquo;{r.child_view}&rdquo;</p>
                    </div>

                    {/* Next Year Target */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1">Next Year Target</p>
                      <p className="text-xs text-blue-700">{r.next_year_target}</p>
                    </div>

                    <SmartLinkPanel sourceType="annual_outcome" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No outcomes match the current filters.
          </div>
        )}

        {/* ── regulatory reference ── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>
            Annual outcomes reporting is aligned with <strong>Quality Standard 1</strong> (children receive care that is focused on their individual needs and feelings) and <strong>Regulation 5</strong> (quality of care — ensuring children&apos;s needs are met and they make measurable progress). Outcomes are tracked against the <strong>SCCIF outcomes framework</strong>, evidencing that children are helped to achieve their potential across all developmental domains. Progress ratings inform care plan reviews, LAC reviews, and the home&apos;s Statement of Purpose evaluation.
          </p>
        </div>
      </div>
      )}
      <CareEventsPanel
        title="Care Events — Care Planning"
        category="general"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Annual Outcomes Report — year-end outcomes analysis, permanence, education, health, wellbeing, placement stability, Reg 45, Annex A themes, Ofsted judgement evidence"
        recordType="reg45"
        className="mt-6"
      />
    </PageShell>
  );
}
