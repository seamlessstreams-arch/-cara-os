"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — OFSTED SELF-EVALUATION
// Presents the home's honest self-assessment against Ofsted's SCCIF judgement
// areas — strengths, evidence, areas for development, and actions in progress.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import {
  ClipboardCheck, Search, ArrowUpDown, Filter,
  CheckCircle2, TrendingUp, ChevronDown, ChevronUp,
  Calendar, User, Star, ShieldCheck, Award,
  Target, AlertTriangle, Lightbulb, FileText,
  BookOpen, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useSelfEvaluationAreas } from "@/hooks/use-self-evaluation-areas";
import type { SelfEvaluationArea, SelfEvaluationGrade } from "@/types/extended";
import { SELF_EVALUATION_GRADE_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── label & colour maps ─────────────────────────────────────────────── */
const GRADE_COLOUR: Record<SelfEvaluationGrade, string> = {
  outstanding: "bg-indigo-50 text-indigo-700 border-indigo-200",
  good: "bg-emerald-50 text-emerald-700 border-emerald-200",
  requires_improvement: "bg-amber-50 text-amber-700 border-amber-200",
  inadequate: "bg-red-50 text-red-700 border-red-200",
};

const GRADE_CARD_BORDER: Record<SelfEvaluationGrade, string> = {
  outstanding: "border-l-indigo-400",
  good: "border-l-emerald-400",
  requires_improvement: "border-l-amber-400",
  inadequate: "border-l-red-400",
};

const GRADE_ICON_COLOUR: Record<SelfEvaluationGrade, string> = {
  outstanding: "text-indigo-600",
  good: "text-emerald-600",
  requires_improvement: "text-amber-600",
  inadequate: "text-red-600",
};

/* ── component ───────────────────────────────────────────────────────── */
export default function OfstedSelfEvaluationPage() {
  const { data: res, isLoading } = useSelfEvaluationAreas();
  const entries: SelfEvaluationArea[] = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [sortBy, setSortBy] = useState<"area" | "grade">("area");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ── filtering & sorting ────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...entries];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.area.toLowerCase().includes(q) ||
          e.strengths.some((s) => s.toLowerCase().includes(q)) ||
          e.evidence.some((s) => s.toLowerCase().includes(q)) ||
          e.areas_for_development.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (filterGrade !== "all") list = list.filter((e) => e.self_grade === filterGrade);

    const gradeOrder: Record<SelfEvaluationGrade, number> = { outstanding: 0, good: 1, requires_improvement: 2, inadequate: 3 };
    list.sort((a, b) => {
      switch (sortBy) {
        case "grade":
          return gradeOrder[a.self_grade] - gradeOrder[b.self_grade];
        case "area":
        default:
          return a.area.localeCompare(b.area);
      }
    });
    return list;
  }, [entries, search, filterGrade, sortBy]);

  /* ── stats ──────────────────────────────────────────────────────── */
  const totalAreas = entries.length;
  const areasAtGoodPlus = entries.filter((e) => e.self_grade === "good" || e.self_grade === "outstanding").length;
  const totalActions = entries.reduce((sum, e) => sum + (e.actions?.length ?? 0), 0);
  const overallGrade = "Good (with Outstanding leadership)";

  /* ── export columns ─────────────────────────────────────────────── */
  const exportCols: ExportColumn<SelfEvaluationArea>[] = [
    { header: "Judgement Area", accessor: (r: SelfEvaluationArea) => r.area },
    { header: "Self-Assessed Grade", accessor: (r: SelfEvaluationArea) => SELF_EVALUATION_GRADE_LABEL[r.self_grade] },
    { header: "Strengths Summary", accessor: (r: SelfEvaluationArea) => r.strengths.join("; ") },
    { header: "Development Summary", accessor: (r: SelfEvaluationArea) => r.areas_for_development.join("; ") },
    { header: "Actions Count", accessor: (r: SelfEvaluationArea) => r.actions.length },
  ];

  /* ── loading state ──────────────────────────────────────────────── */
  if (isLoading) return (
    <PageShell title="Ofsted Self-Evaluation" subtitle="Loading…">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </PageShell>
  );

  return (
    <PageShell
      title="Ofsted Self-Evaluation"
      subtitle="Self-assessment against the Social Care Common Inspection Framework (SCCIF) judgement areas"
      ariaContext={{ pageTitle: "Ofsted Self-Evaluation", sourceType: "reg45" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Ofsted Self-Evaluation" />
          <ExportButton data={filtered} columns={exportCols} filename="ofsted-self-evaluation" />
          <AriaStudioQuickActionButton context={{ record_type: "ofsted_evidence", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── overall summary banner ─────────────────────────────────── */}
        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" />
              Overall Self-Assessment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Overall Self-Assessed Grade</p>
                <div className="mt-0.5">
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 font-semibold">
                    {overallGrade}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm font-semibold flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  {d(-14)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Author</p>
                <p className="text-sm font-semibold flex items-center gap-1.5 mt-0.5">
                  <User className="h-3.5 w-3.5 text-indigo-500" />
                  {getStaffName("staff_darren")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next Review Due</p>
                <p className="text-sm font-semibold flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  {d(76)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── summary stats ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Overall Grade", value: "Good", icon: Award, colour: "text-emerald-600" },
            { label: "Areas at Good+", value: `${areasAtGoodPlus}/${totalAreas}`, icon: CheckCircle2, colour: "text-emerald-600" },
            { label: "Actions In Progress", value: totalActions, icon: TrendingUp, colour: "text-amber-600" },
            { label: "Judgement Areas", value: totalAreas, icon: ClipboardCheck, colour: "text-indigo-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── filters & sort ─────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search strengths, evidence, development areas..."
              className="w-full rounded-lg border border-[var(--cs-border)] bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="rounded-lg border border-[var(--cs-border)] bg-white px-2 py-2 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All Grades</option>
              <option value="outstanding">Outstanding</option>
              <option value="good">Good</option>
              <option value="requires_improvement">Requires Improvement</option>
              <option value="inadequate">Inadequate</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "area" | "grade")}
              className="rounded-lg border border-[var(--cs-border)] bg-white px-2 py-2 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="area">Judgement Area</option>
              <option value="grade">Grade</option>
            </select>
          </div>
        </div>

        {/* ── judgement area cards ────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardCheck className="h-10 w-10 mx-auto mb-3 text-[var(--cs-text-gentle)]" />
              No judgement areas match your filters.
            </div>
          )}
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl border border-l-4 bg-white overflow-hidden",
                  GRADE_CARD_BORDER[item.self_grade]
                )}
              >
                {/* collapsed header */}
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Star className={cn("h-5 w-5 shrink-0", GRADE_ICON_COLOUR[item.self_grade])} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{item.area}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", GRADE_COLOUR[item.self_grade])}>
                          {SELF_EVALUATION_GRADE_LABEL[item.self_grade]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {(item.strengths?.length ?? 0)} strengths &middot; {item.areas_for_development.length} development areas &middot; {(item.actions?.length ?? 0)} actions
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {item.self_grade === "outstanding" && <Award className="h-4 w-4 text-indigo-500" />}
                    {item.self_grade === "good" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {/* expanded detail */}
                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* strengths */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {(item.strengths ?? []).map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[var(--cs-text-secondary)]">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* evidence */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          Evidence
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {item.evidence.map((e, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[var(--cs-text-secondary)]">
                              <ShieldCheck className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                              {e}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* areas for development */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          Areas for Development
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {item.areas_for_development.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[var(--cs-text-secondary)]">
                              <Target className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* actions in progress */}
                    {(item.actions?.length ?? 0) > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-teal-500" />
                            Actions In Progress
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {(item.actions ?? []).map((action, i) => (
                              <div key={i} className="rounded-lg border border-[var(--cs-border)] bg-white p-3">
                                <p className="text-sm text-[var(--cs-text-secondary)] font-medium">{action.action}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {getStaffName(action.owner)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Target: {action.target_date}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">
                                    {action.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory note ──────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <div className="flex items-start gap-2">
            <BookOpen className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p>
                <strong>About Self-Evaluation:</strong> Ofsted does not require children&apos;s homes to produce
                a self-evaluation form (SEF) in a prescribed format. However, the expectation is that
                registered managers maintain a clear, honest understanding of their home&apos;s strengths and
                areas for development. This self-assessment should be a living document that evolves as the
                home develops.
              </p>
              <p>
                Ofsted uses the home&apos;s self-evaluation to help focus inspection activity. A well-prepared,
                honest self-assessment demonstrates strong leadership and a commitment to continuous
                improvement. The SCCIF assesses three key judgement areas: the overall experiences and progress
                of children, how well children are helped and protected, and the effectiveness of leaders and
                managers.
              </p>
              <p>
                <strong>Important:</strong> This document should reflect genuine, honest self-reflection
                rather than self-promotion. Inspectors value homes that can identify their own areas for
                development and demonstrate active steps being taken to address them. Over-grading undermines
                credibility; under-grading fails to recognise the team&apos;s achievements.
              </p>
            </div>
          </div>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Compliance Evidence"
        category="general"
        days={90}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Ofsted Self-Evaluation — SEF, quality of care judgements, leadership and management, outstanding practice, areas for development, evidence gathering, ILACS framework, Reg 45"
        recordType="ofsted_evidence"
        className="mt-6"
      />
    </PageShell>
  );
}
