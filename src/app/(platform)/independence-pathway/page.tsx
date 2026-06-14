"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Shield,
  ArrowUpDown,
  Search,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge }        from "@/components/ui/badge";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { useIndependencePathways } from "@/hooks/use-independence-pathways";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { IndependencePathway, IndependencePathwayStatus } from "@/types/extended";
import { INDEPENDENCE_PATHWAY_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── constants ─────────────────────────────────────────────────────────── */

const STATUS_COLOURS: Record<IndependencePathwayStatus, string> = {
  on_track:            "bg-green-100 text-green-700",
  attention_needed:    "bg-amber-100 text-amber-700",
  not_age_appropriate: "bg-blue-100 text-blue-700",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function IndependencePathwayPage() {
  const { data: res, isLoading } = useIndependencePathways();
  const data: IndependencePathway[] = res?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState<"readiness" | "name" | "review">("readiness");

  /* ── filtered & sorted ───────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...data];
    if (filterYP !== "all") list = list.filter((a) => a.child_id === filterYP);
    list.sort((a, b) => {
      switch (sortBy) {
        case "readiness": return b.overall_readiness - a.overall_readiness;
        case "review":    return a.review_date.localeCompare(b.review_date);
        default:          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      }
    });
    return list;
  }, [data, filterYP, sortBy]);

  /* ── summary stats ───────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    if (!data.length) return { avgReadiness: 0, domainsNeedingAttention: [] as { domain: string; youngPerson: string; score: number }[], nextReviews: [] as { youngPerson: string; reviewDate: string }[] };
    const avgReadiness = Math.round(data.reduce((s, a) => s + a.overall_readiness, 0) / data.length);
    const domainsNeedingAttention = data.flatMap((a) =>
      (a.domains ?? []).filter((dm) => dm.score <= 2).map((dm) => ({ domain: dm.name, youngPerson: getYPName(a.child_id), score: dm.score }))
    );
    const nextReviews = data
      .map((a) => ({ youngPerson: getYPName(a.child_id), reviewDate: a.review_date }))
      .sort((a, b) => a.reviewDate.localeCompare(b.reviewDate));
    return { avgReadiness, domainsNeedingAttention, nextReviews };
  }, [data]);

  /* ── readiness colour helper ─────────────────────────────────────────── */
  const readinessColour = (pct: number) =>
    pct >= 60 ? "text-green-600" : pct >= 40 ? "text-amber-600" : "text-red-600";

  const readinessBg = (pct: number) =>
    pct >= 60 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";

  const scoreBadge = (score: number) =>
    score >= 4 ? "bg-green-100 text-green-700" :
    score >= 3 ? "bg-amber-100 text-amber-700" :
    "bg-red-100 text-red-700";

  /* ── export ──────────────────────────────────────────────────────────── */
  const exportData = useMemo(() => data.flatMap((a) => (a.domains ?? []).map((dm) => ({
    youngPerson: getYPName(a.child_id),
    assessedBy: getStaffName(a.assessed_by),
    assessmentDate: a.assessment_date,
    reviewDate: a.review_date,
    overallReadiness: `${a.overall_readiness}%`,
    status: INDEPENDENCE_PATHWAY_STATUS_LABEL[a.status],
    domain: dm.name,
    score: `${dm.score}/${dm.max_score}`,
    evidence: dm.evidence,
    nextSteps: dm.next_steps,
    expectedTransitionAge: String(a.expected_transition_age),
    pathwayPlanLinked: a.pathway_plan_linked ? "Yes" : "No",
    notes: a.notes,
  }))), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Young Person",          accessor: (r: typeof exportData[number]) => r.youngPerson },
    { header: "Assessed By",           accessor: (r: typeof exportData[number]) => r.assessedBy },
    { header: "Assessment Date",       accessor: (r: typeof exportData[number]) => r.assessmentDate },
    { header: "Review Date",           accessor: (r: typeof exportData[number]) => r.reviewDate },
    { header: "Overall Readiness",     accessor: (r: typeof exportData[number]) => r.overallReadiness },
    { header: "Status",                accessor: (r: typeof exportData[number]) => r.status },
    { header: "Domain",                accessor: (r: typeof exportData[number]) => r.domain },
    { header: "Score",                 accessor: (r: typeof exportData[number]) => r.score },
    { header: "Evidence",              accessor: (r: typeof exportData[number]) => r.evidence },
    { header: "Next Steps",            accessor: (r: typeof exportData[number]) => r.nextSteps },
    { header: "Expected Transition",   accessor: (r: typeof exportData[number]) => r.expectedTransitionAge },
    { header: "Pathway Plan Linked",   accessor: (r: typeof exportData[number]) => r.pathwayPlanLinked },
    { header: "Notes",                 accessor: (r: typeof exportData[number]) => r.notes },
  ];

  if (isLoading) return <PageShell title="Independence Pathway" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <PageShell
      title="Independence Pathway"
      subtitle="Overall pathway assessment and transition readiness tracking for each young person"
      caraContext={{ pageTitle: "Independence Pathway", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="independence-pathway" />
          <PrintButton title="Independence Pathway" />
          <CaraStudioQuickActionButton context={{ record_type: "placement_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── summary stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Readiness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-brand" />
                <div>
                  <p className={cn("text-3xl font-bold", readinessColour(stats.avgReadiness))}>{stats.avgReadiness}%</p>
                  <p className="text-xs text-muted-foreground">across {data.length} young people</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Domains Needing Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-3xl font-bold text-amber-600">{stats.domainsNeedingAttention.length}</p>
                  <p className="text-xs text-muted-foreground">scored 2/5 or below</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Next Review Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-lg font-bold">{stats.nextReviews[0]?.reviewDate ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{stats.nextReviews[0]?.youngPerson ?? "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── per-child readiness overview ──────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.map((a) => {
            const avgDomain = Math.round(((a.domains ?? []).reduce((s, dm) => s + dm.score, 0) / (a.domains?.length ?? 0)) * 20);
            return (
              <div key={a.id} className="rounded-lg border bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{getYPName(a.child_id)}</h3>
                  <span className={cn("text-lg font-bold", readinessColour(a.overall_readiness))}>
                    {a.overall_readiness}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", readinessBg(a.overall_readiness))} style={{ width: `${a.overall_readiness}%` }} />
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge className={cn("text-xs", STATUS_COLOURS[a.status])}>{INDEPENDENCE_PATHWAY_STATUS_LABEL[a.status]}</Badge>
                  {a.pathway_plan_linked && <Badge className="text-xs bg-purple-100 text-purple-700">Pathway Plan Linked</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  Assessed {a.assessment_date} by {getStaffName(a.assessed_by)} · Review due {a.review_date}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── filters ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterYP}
              onChange={(e) => setFilterYP(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="all">All Young People</option>
              {data.map((a) => (
                <option key={a.child_id} value={a.child_id}>{getYPName(a.child_id)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="rounded border px-2 py-1.5 text-sm">
              <option value="readiness">Readiness Score</option>
              <option value="name">Name</option>
              <option value="review">Next Review</option>
            </select>
          </div>
        </div>

        {/* ── expandable assessment cards ───────────────────────────────── */}
        {filtered.map((assessment) => (
          <div key={assessment.id} className="rounded-lg border bg-white overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === assessment.id ? null : assessment.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-brand" />
                <div className="text-left">
                  <h3 className="font-semibold">{getYPName(assessment.child_id)}</h3>
                  <p className="text-xs text-muted-foreground">
                    Readiness {assessment.overall_readiness}% · {assessment.domains.length} domains assessed · Review due {assessment.review_date}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={cn("text-xs", STATUS_COLOURS[assessment.status])}>
                  {INDEPENDENCE_PATHWAY_STATUS_LABEL[assessment.status]}
                </Badge>
                {expandedId === assessment.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </button>

            {expandedId === assessment.id && (
              <div className="border-t p-4 space-y-4">
                {/* assessment meta */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Assessed by:</span>
                    <p className="font-medium">{getStaffName(assessment.assessed_by)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Assessment date:</span>
                    <p className="font-medium">{assessment.assessment_date}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expected transition age:</span>
                    <p className="font-medium">{assessment.expected_transition_age}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pathway Plan linked:</span>
                    <p className="font-medium">{assessment.pathway_plan_linked ? "Yes" : "No"}</p>
                  </div>
                </div>

                {/* readiness bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Overall Readiness</span>
                    <span className={cn("text-sm font-bold", readinessColour(assessment.overall_readiness))}>{assessment.overall_readiness}%</span>
                  </div>
                  <div className="w-full h-4 rounded-full bg-gray-100 overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", readinessBg(assessment.overall_readiness))} style={{ width: `${assessment.overall_readiness}%` }} />
                  </div>
                </div>

                {/* domains table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-3">Domain</th>
                        <th className="pb-2 pr-3">Score</th>
                        <th className="pb-2 pr-3">Evidence</th>
                        <th className="pb-2">Next Steps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessment.domains.map((dm, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 pr-3 font-medium whitespace-nowrap">{dm.name}</td>
                          <td className="py-2 pr-3">
                            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", scoreBadge(dm.score))}>
                              {dm.score}/{dm.max_score}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-xs text-muted-foreground max-w-[250px]">{dm.evidence}</td>
                          <td className="py-2 text-xs max-w-[200px]">{dm.next_steps}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* domain visual breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {assessment.domains.map((dm, i) => (
                    <div key={i} className="rounded-lg border p-2 text-center">
                      <p className="text-xs text-muted-foreground truncate">{dm.name}</p>
                      <p className={cn("text-lg font-bold", dm.score >= 4 ? "text-green-600" : dm.score >= 3 ? "text-amber-600" : "text-red-600")}>
                        {dm.score}/{dm.max_score}
                      </p>
                    </div>
                  ))}
                </div>

                {/* notes */}
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Assessment Notes</h4>
                  <p className="text-sm text-blue-900">{assessment.notes}</p>
                </div>

                <SmartLinkPanel sourceType="independence-pathways" sourceId={assessment.id} childId={assessment.child_id} compact />
              </div>
            )}
          </div>
        ))}

        {/* ── domains needing attention ─────────────────────────────────── */}
        {stats.domainsNeedingAttention.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Domains Needing Attention (Scored 2/5 or Below)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {stats.domainsNeedingAttention.map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div>
                      <span className="text-sm font-medium">{item.domain}</span>
                      <span className="text-xs text-muted-foreground ml-2">({item.youngPerson})</span>
                    </div>
                    <Badge className="bg-red-100 text-red-700 text-xs">{item.score}/5</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── upcoming reviews ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              Upcoming Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.nextReviews.map((review, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span className="text-sm font-medium">{review.youngPerson}</span>
                  <span className="text-sm text-muted-foreground">{review.reviewDate}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── regulatory note ───────────────────────────────────────────── */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900 space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <strong>Regulatory Framework</strong>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><strong>Regulation 12</strong> (Children&apos;s Homes Regulations 2015) — The registered person must ensure children are supported to develop independence skills appropriate to their age and abilities.</li>
            <li><strong>Children (Leaving Care) Act 2000</strong> — Local authorities must assess and meet the needs of eligible and relevant children, including preparation for independence.</li>
            <li><strong>Quality Standard 5</strong> (Guide to Children&apos;s Homes Standards) — Children are prepared for adulthood through a planned approach tailored to their individual needs.</li>
            <li><strong>Pathway Plan</strong> — Required from age 16 for all looked-after children, reviewed at least every 6 months, covering education, health, finances, and accommodation.</li>
          </ul>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Education & Finance"
        category={["education", "finance"]}
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
