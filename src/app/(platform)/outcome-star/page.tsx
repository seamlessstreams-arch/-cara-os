"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useOutcomeStarAssessments } from "@/hooks/use-outcome-star-assessments";
import type { OutcomeStarAssessment, OutcomeStarDomain } from "@/types/extended";
import { OUTCOME_STAR_DOMAIN_LABEL } from "@/types/extended";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const DOMAINS: OutcomeStarDomain[] = ["safety", "emotional_wellbeing", "physical_health", "education", "relationships", "identity", "independence", "social_presentation", "self_care", "community"];

function scoreColor(score: number): string {
  if (score >= 8) return "text-green-700 bg-green-100";
  if (score >= 6) return "text-blue-700 bg-blue-100";
  if (score >= 4) return "text-amber-700 bg-amber-100";
  return "text-red-700 bg-red-100";
}

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function OutcomeStarPage() {
  const { data: res, isLoading } = useOutcomeStarAssessments();
  const entries: OutcomeStarAssessment[] = res?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const exportData = useMemo(() => {
    return entries.flatMap((a) =>
      DOMAINS.map((dom) => ({
        youngPerson: getYPName(a.child_id),
        date: a.date,
        domain: OUTCOME_STAR_DOMAIN_LABEL[dom],
        score: a.scores[dom],
        previousScore: a.previous_scores ? a.previous_scores[dom] : null,
        change: a.previous_scores ? a.scores[dom] - a.previous_scores[dom] : null,
      }))
    );
  }, [entries]);

  type ExportRow = (typeof exportData)[number];

  const exportCols: ExportColumn<ExportRow>[] = [
    { header: "Young Person", accessor: (r: ExportRow) => r.youngPerson },
    { header: "Date", accessor: (r: ExportRow) => r.date },
    { header: "Domain", accessor: (r: ExportRow) => r.domain },
    { header: "Score", accessor: (r: ExportRow) => String(r.score) },
    { header: "Previous", accessor: (r: ExportRow) => r.previousScore !== null ? String(r.previousScore) : "N/A" },
    { header: "Change", accessor: (r: ExportRow) => r.change !== null ? String(r.change) : "N/A" },
  ];

  if (isLoading) {
    return (
      <PageShell title="Outcome Star Assessments" subtitle="Outcomes Framework · Child-Centred Progress · 10-Domain Model">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Outcome Star Assessments"
      subtitle="Outcomes Framework · Child-Centred Progress · 10-Domain Model"
      ariaContext={{ pageTitle: "Outcome Star Assessments", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Outcome Star Assessments" />
          <ExportButton data={exportData} columns={exportCols} filename="outcome-star" />
          <AriaStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        <AriaPanel
          mode="assist"
          pageContext="Outcome Star Assessments — 10-domain outcomes framework, child-centred progress measurement, LAC review evidence, care planning"
          recordType="direct_work"
          userRole="registered_manager"
          className="mb-6"
        />
        {/* per-child summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {entries.map((a) => {
            const avg = Math.round((Object.values(a.scores).reduce((s, v) => s + v, 0) / DOMAINS.length) * 10) / 10;
            const prevAvg = a.previous_scores ? Math.round((Object.values(a.previous_scores).reduce((s, v) => s + v, 0) / DOMAINS.length) * 10) / 10 : null;
            const trend = prevAvg !== null ? avg - prevAvg : 0;
            return (
              <Card key={a.id}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold">{getYPName(a.child_id)}</p>
                    <div className="flex items-center gap-1">
                      {trend > 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : trend < 0 ? <TrendingDown className="h-4 w-4 text-red-600" /> : <Minus className="h-4 w-4 text-[var(--cs-text-muted)]" />}
                      <span className={cn("text-xs font-medium", trend > 0 ? "text-green-700" : trend < 0 ? "text-red-700" : "text-[var(--cs-text-muted)]")}>
                        {trend > 0 ? "+" : ""}{trend.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{avg.toFixed(1)}<span className="text-sm text-muted-foreground font-normal">/10</span></p>
                  <p className="text-xs text-muted-foreground">Average score · {a.date}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {DOMAINS.map((dom) => (
                      <span key={dom} className={cn("inline-block rounded px-1.5 py-0.5 text-[10px] font-medium", scoreColor(a.scores[dom]))}>
                        {a.scores[dom]}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* detailed assessments */}
        <div className="space-y-3">
          {entries.map((a) => {
            const isOpen = expandedId === a.id;
            const avg = Math.round((Object.values(a.scores).reduce((s, v) => s + v, 0) / DOMAINS.length) * 10) / 10;
            return (
              <Card key={a.id} className="border-l-4 border-l-blue-400">
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : a.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        {getYPName(a.child_id)} — Outcome Star
                        <Badge variant="outline" className={scoreColor(avg)}>{avg.toFixed(1)}/10 avg</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Assessed: {a.date} · By: {getStaffName(a.assessed_by_id)} · {a.action_plan.length} action(s)
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* domain scores grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {DOMAINS.map((dom) => {
                        const score = a.scores[dom];
                        const prev = a.previous_scores ? a.previous_scores[dom] : null;
                        const change = prev !== null ? score - prev : null;
                        return (
                          <div key={dom} className="bg-muted/40 rounded p-2 text-center">
                            <p className="font-medium text-[10px] text-muted-foreground mb-0.5">{OUTCOME_STAR_DOMAIN_LABEL[dom]}</p>
                            <p className={cn("text-lg font-bold", scoreColor(score).split(" ")[0])}>{score}</p>
                            {change !== null && (
                              <div className="flex items-center justify-center gap-0.5 text-[10px]">
                                {change > 0 ? <TrendingUp className="h-3 w-3 text-green-600" /> : change < 0 ? <TrendingDown className="h-3 w-3 text-red-600" /> : <Minus className="h-3 w-3 text-[var(--cs-text-muted)]" />}
                                <span className={change > 0 ? "text-green-700" : change < 0 ? "text-red-700" : "text-[var(--cs-text-muted)]"}>
                                  {change > 0 ? "+" : ""}{change} from {prev}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* child views */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1">Child&apos;s Views</p>
                      <p className="text-xs text-blue-700">{a.child_views}</p>
                    </div>

                    {/* staff views */}
                    <div>
                      <p className="font-medium mb-1">Staff Assessment</p>
                      <p className="text-muted-foreground text-xs">{a.staff_views}</p>
                    </div>

                    {/* action plan */}
                    <div>
                      <p className="font-medium mb-1">Action Plan</p>
                      {a.action_plan.map((ap, i) => (
                        <div key={i} className="bg-muted/40 rounded p-2 mb-1 flex items-start gap-2">
                          <Badge variant="outline" className="bg-muted/50 text-[10px] shrink-0">{OUTCOME_STAR_DOMAIN_LABEL[ap.domain]}</Badge>
                          <p className="text-xs">{ap.action}</p>
                        </div>
                      ))}
                    </div>

                    {/* smart links */}
                    <SmartLinkPanel sourceType="outcome_star" sourceId={a.id} childId={a.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* key */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-2">
          {DOMAINS.map((dom) => (
            <div key={dom} className="text-xs text-center bg-muted/20 rounded p-1.5">
              <p className="font-medium">{OUTCOME_STAR_DOMAIN_LABEL[dom]}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Outcomes Framework</p>
          <p>The Outcome Star is a collaborative assessment tool completed with the young person. Each domain is scored 1-10, where 1 indicates significant concern and 10 indicates the young person is thriving. Assessments should be completed quarterly and at key transition points. The child&apos;s voice is central — scores should reflect both the professional assessment and the child&apos;s own perception. Progress (and regression) across domains informs care planning, LAC reviews, and Reg 45 quality reporting. Trends over time are more meaningful than individual scores.</p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
