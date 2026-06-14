"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Activity,
  Brain,
  Heart,
  CheckCircle,
  Minus,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import type { OutcomeMeasure } from "@/types/extended";
import { useOutcomeMeasures } from "@/hooks/use-outcome-measures";

const trendIcon: Record<string, typeof TrendingUp> = {
  Improving: TrendingDown, // SDQ scores: lower = better
  Stable: Minus,
  Declining: TrendingUp,
  Baseline: Minus,
};

const trendColour: Record<string, string> = {
  Improving: "text-green-600",
  Stable: "text-blue-600",
  Declining: "text-red-600",
  Baseline: "text-[var(--cs-text-secondary)]",
};

const interpretationColour: Record<string, string> = {
  "Within normal range": "bg-green-100 text-green-800",
  "Borderline": "bg-amber-100 text-amber-800",
  "Clinical concern": "bg-red-100 text-red-800",
};

const exportCols: ExportColumn<OutcomeMeasure>[] = [
  { header: "Young Person", accessor: (r: OutcomeMeasure) => getYPName(r.child_id) },
  { header: "Measure", accessor: (r: OutcomeMeasure) => r.measureName },
  { header: "Domain", accessor: (r: OutcomeMeasure) => r.domain },
  { header: "Date", accessor: (r: OutcomeMeasure) => r.administeredDate },
  { header: "Total Score", accessor: (r: OutcomeMeasure) => `${r.totalScore}/${r.maxTotalScore}` },
  { header: "Previous", accessor: (r: OutcomeMeasure) => r.prevTotalScore !== null ? `${r.prevTotalScore}/${r.maxTotalScore}` : "Baseline" },
  { header: "Trend", accessor: (r: OutcomeMeasure) => r.trendDirection },
  { header: "Administered By", accessor: (r: OutcomeMeasure) => getStaffName(r.administeredBy) },
];

export default function TherapeuticOutcomeMeasuresPage() {
  const { data: result, isLoading } = useOutcomeMeasures(undefined, "home_oak");
  const data = result?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [filterMeasure, setFilterMeasure] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((m) => m.child_id === filterYP);
    if (filterMeasure !== "all") items = items.filter((m) => m.measureName === filterMeasure);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.administeredDate.localeCompare(a.administeredDate);
        case "child":
          return a.child_id.localeCompare(b.child_id);
        case "trend": {
          const ord = { Improving: 0, Stable: 1, Baseline: 2, Declining: 3 };
          return ord[a.trendDirection] - ord[b.trendDirection];
        }
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, filterMeasure, sortBy, data]);

  const totalMeasures = data.length;
  const improving = data.filter((m) => m.trendDirection === "Improving").length;
  const childCompletedCount = data.filter((m) => m.childCompleted).length;
  const uniqueChildren = new Set(data.map((m) => m.child_id)).size;

  return (
    <PageShell
      title="Therapeutic Outcome Measures"
      subtitle="Validated assessment tools tracking therapeutic progress — SDQ, RCADS, Outcome Star, TSCC and others"
      caraContext={{ pageTitle: "Therapeutic Outcome Measures", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="therapeutic-outcome-measures" />
          <PrintButton title="Therapeutic Outcome Measures" />
          <CaraStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : (<>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{totalMeasures}</p>
          <p className="text-xs text-muted-foreground">Total Measures</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{improving}</p>
          <p className="text-xs text-muted-foreground">Improving Trends</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{childCompletedCount}/{totalMeasures}</p>
          <p className="text-xs text-muted-foreground">Self-Report by Child</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{uniqueChildren}</p>
          <p className="text-xs text-muted-foreground">Children Measured</p>
        </div>
      </div>

      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Brain className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800">
          Validated outcome measures provide objective tracking of therapeutic progress alongside clinical
          observation. Scores are interpreted with the child, never used to label or shame, and always
          discussed with CAMHS or relevant clinical colleagues.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterMeasure} onValueChange={setFilterMeasure}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Measures" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Measures</SelectItem>
            <SelectItem value="SDQ (Goodman)">SDQ</SelectItem>
            <SelectItem value="RCADS">RCADS</SelectItem>
            <SelectItem value="CORE-YP">CORE-YP</SelectItem>
            <SelectItem value="Outcome Star">Outcome Star</SelectItem>
            <SelectItem value="Trauma Symptom Checklist (TSCC)">TSCC</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
              <SelectItem value="trend">By Trend</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((measure) => {
          const isExpanded = expandedId === measure.id;
          const TrendIcon = trendIcon[measure.trendDirection];
          const hasClinicalConcern = measure.scores.some((s) => s.interpretation === "Clinical concern");

          return (
            <div key={measure.id} className={cn("rounded-xl border bg-white overflow-hidden",
              hasClinicalConcern && "border-l-4 border-l-red-500"
            )}>
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : measure.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Activity className="h-5 w-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(measure.child_id)} &middot; {measure.measureName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {measure.administeredDate} &middot; {measure.domain} &middot; Score: {measure.totalScore}/{measure.maxTotalScore}
                      {measure.prevTotalScore !== null && ` (was ${measure.prevTotalScore})`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-sm font-bold flex items-center gap-1", trendColour[measure.trendDirection])}>
                    <TrendIcon className="h-4 w-4" />
                    {measure.trendDirection}
                  </span>
                  {hasClinicalConcern && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Measure</p>
                    <p className="text-sm font-medium">{measure.measureFullName}</p>
                  </div>

                  {/* subscale breakdown */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Subscale Scores</p>
                    <div className="space-y-1.5">
                      {measure.scores.map((s, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{s.subscale}</span>
                            <span className="text-sm font-mono">{s.rawScore}/{s.maxScore}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full",
                                  s.interpretation === "Clinical concern" ? "bg-red-500" :
                                  s.interpretation === "Borderline" ? "bg-amber-500" :
                                  "bg-green-500"
                                )}
                                style={{ width: `${(s.rawScore / s.maxScore) * 100}%` }}
                              />
                            </div>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", interpretationColour[s.interpretation])}>
                              {s.interpretation}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">Clinical threshold: {s.clinicalThreshold}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* child reflection */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      <Heart className="h-3 w-3 inline mr-1" />Child&apos;s Reflection
                    </p>
                    <p className="text-sm text-blue-900 italic">&ldquo;{measure.childReflection}&rdquo;</p>
                  </div>

                  {/* staff interpretation */}
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Clinical Interpretation</p>
                    <p className="text-sm text-purple-900">{measure.staffInterpretation}</p>
                  </div>

                  {/* linked interventions */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Linked Interventions</p>
                    <div className="flex flex-wrap gap-2">
                      {measure.linkedInterventions.map((int, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                          <CheckCircle className="h-3 w-3 inline mr-1" />{int}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Administered by: {getStaffName(measure.administeredBy)}</span>
                    <span>Clinical discussion: {measure.clinicalDiscussionWith}</span>
                    <span>Next due: {measure.nextAdministrationDate}</span>
                    {measure.childCompleted && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Self-Report</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Outcome measures support Quality Standard 7 (health and wellbeing),
          Quality Standard 4 (the child&apos;s plan), and evidence-based practice expectations. Tools used:
          SDQ (Goodman, royalty-free), RCADS (Chorpita et al., free), Outcome Star (Triangle Consulting,
          licensed), TSCC (Briere, licensed). All clinical interpretation discussed with CAMHS or qualified
          mental health professional. Linked to Therapeutic Input and Multi-Disciplinary Formulation.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Health & Wellbeing"
        category={["health", "wellbeing"]}
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Therapeutic Outcome Measures — therapy progress, SDQ scores, outcome tracking, goal achievement, wellbeing measures, Reg 45 quality evidence, Ofsted impact evidence"
        recordType="care_plan"
        className="mt-6"
      />
      </>)}
    </PageShell>
  );
}
