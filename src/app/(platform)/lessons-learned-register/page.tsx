"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown, ChevronUp, ArrowUpDown, Search, Lightbulb, CheckCircle2,
  AlertTriangle, Clock, BookOpen, GraduationCap, FileText, Sparkles, Star, Users,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useLessonsLearned } from "@/hooks/use-lessons-learned";
import type { LessonLearned, LessonSource, LessonThemeArea, LessonStatus } from "@/types/extended";
import { LESSON_SOURCE_LABEL, LESSON_THEME_AREA_LABEL, LESSON_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── UI metadata ─────────────────────────────────────────────────────────── */

const SOURCE_CLR: Record<LessonSource, string> = {
  incident: "bg-red-100 text-red-800",
  complaint: "bg-orange-100 text-orange-800",
  audit: "bg-blue-100 text-blue-800",
  reflective_practice: "bg-purple-100 text-purple-800",
  reg_44: "bg-emerald-100 text-emerald-800",
  external_feedback: "bg-cyan-100 text-cyan-800",
  critical_incident_review: "bg-rose-100 text-rose-900",
};

const THEME_CLR: Record<LessonThemeArea, string> = {
  safeguarding: "bg-red-50 text-red-700",
  practice: "bg-blue-50 text-blue-700",
  communication: "bg-amber-50 text-amber-700",
  recording: "bg-slate-100 text-slate-700",
  training: "bg-indigo-50 text-indigo-700",
  environment: "bg-teal-50 text-teal-700",
  wellbeing: "bg-purple-50 text-purple-700",
  multi_agency: "bg-cyan-50 text-cyan-700",
};

const STATUS_CLR: Record<LessonStatus, string> = {
  identified: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  embedded: "bg-green-100 text-green-800",
  monitoring: "bg-purple-100 text-purple-800",
};

const STATUS_BORDER: Record<LessonStatus, string> = {
  identified: "border-l-amber-400",
  in_progress: "border-l-blue-500",
  embedded: "border-l-green-500",
  monitoring: "border-l-purple-500",
};

export default function LessonsLearnedRegisterPage() {
  const { data: res, isLoading } = useLessonsLearned();
  const data: LessonLearned[] = res?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [filterTheme, setFilterTheme] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.lesson.toLowerCase().includes(q) ||
          r.context.toLowerCase().includes(q) ||
          r.source_reference.toLowerCase().includes(q),
      );
    }
    if (filterSource !== "all") rows = rows.filter((r) => r.source === filterSource);
    if (filterTheme !== "all") rows = rows.filter((r) => r.theme_area === filterTheme);
    if (filterStatus !== "all") rows = rows.filter((r) => r.status === filterStatus);
    rows.sort((a, b) => {
      if (sortBy === "newest") return b.date_identified.localeCompare(a.date_identified);
      if (sortBy === "oldest") return a.date_identified.localeCompare(b.date_identified);
      if (sortBy === "embedding_low") return a.embedding_score - b.embedding_score;
      if (sortBy === "embedding_high") return b.embedding_score - a.embedding_score;
      return 0;
    });
    return rows;
  }, [data, search, filterSource, filterTheme, filterStatus, sortBy]);

  const total = data.length;
  const embedded = data.filter((r) => r.status === "embedded").length;
  const active = data.filter((r) => r.status === "identified" || r.status === "in_progress").length;
  const avgEmbedding =
    data.length > 0
      ? (data.reduce((s, r) => s + r.embedding_score, 0) / data.length).toFixed(1)
      : "0.0";

  const exportCols: ExportColumn<LessonLearned>[] = [
    { header: "Date Identified", accessor: (r: LessonLearned) => r.date_identified },
    { header: "Source", accessor: (r: LessonLearned) => LESSON_SOURCE_LABEL[r.source] },
    { header: "Source Reference", accessor: (r: LessonLearned) => r.source_reference },
    { header: "Theme", accessor: (r: LessonLearned) => LESSON_THEME_AREA_LABEL[r.theme_area] },
    { header: "Lesson", accessor: (r: LessonLearned) => r.lesson },
    { header: "Status", accessor: (r: LessonLearned) => LESSON_STATUS_LABEL[r.status] },
    { header: "Embedding Score", accessor: (r: LessonLearned) => String(r.embedding_score) },
    { header: "Staff Briefed", accessor: (r: LessonLearned) => (r.staff_briefed ? "Yes" : "No") },
    { header: "Briefing Date", accessor: (r: LessonLearned) => r.briefing_date },
    { header: "Reviewed By", accessor: (r: LessonLearned) => getStaffName(r.reviewed_by) },
    { header: "Next Review", accessor: (r: LessonLearned) => r.next_review_date },
    { header: "What We Changed", accessor: (r: LessonLearned) => r.what_we_changed.join(" | ") },
    { header: "Policies Updated", accessor: (r: LessonLearned) => r.policies_updated.join(" | ") },
    { header: "Recurrence Check", accessor: (r: LessonLearned) => r.recurrence_check },
  ];

  if (isLoading) return <PageShell title="Lessons Learned Register" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Lessons Learned Register"
      subtitle="Cross-cutting organisational learning · Quality Standard 13 · Reg 45"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Lessons Learned Register" />
          <ExportButton data={data} columns={exportCols} filename="lessons-learned-register" />
        </div>
      }
    >
      <div id="print-area">
        {/* banner */}
        <div className="mb-6 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 flex items-start gap-3">
          <Lightbulb className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">A lesson is only learned when it changes practice.</p>
            <p className="text-sm text-amber-800 mt-0.5">
              This register tracks every cross-cutting insight from incidents, complaints, audits, Reg 44 visits and reflective practice — and follows it through to embedded change.
            </p>
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Lessons", value: total, icon: BookOpen, clr: "text-blue-600" },
            { label: "Embedded", value: embedded, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Active", value: active, icon: Clock, clr: "text-amber-600" },
            { label: "Avg Embedding", value: `${avgEmbedding} / 5`, icon: Star, clr: "text-purple-600" },
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

        {/* active alert */}
        {active > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">
                {active} lesson{active === 1 ? "" : "s"} still in active embedding
              </p>
              <p className="text-amber-700">
                These items have changes underway but are not yet evidenced as embedded. They are reviewed at every leadership and clinical meeting until the embedding score reaches 4+ and recurrence is checked.
              </p>
            </div>
          </div>
        )}

        {/* filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search lessons, context, source ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {(Object.keys(SOURCE_CLR) as LessonSource[]).map((k) => (
                <SelectItem key={k} value={k}>{LESSON_SOURCE_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTheme} onValueChange={setFilterTheme}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Theme" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Themes</SelectItem>
              {(Object.keys(THEME_CLR) as LessonThemeArea[]).map((k) => (
                <SelectItem key={k} value={k}>{LESSON_THEME_AREA_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(Object.keys(STATUS_CLR) as LessonStatus[]).map((k) => (
                <SelectItem key={k} value={k}>{LESSON_STATUS_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="embedding_low">Embedding (low → high)</SelectItem>
                <SelectItem value="embedding_high">Embedding (high → low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setFilterSource("all");
              setFilterTheme("all");
              setFilterStatus("all");
              setSortBy("newest");
            }}
          >
            Reset
          </Button>
        </div>

        {/* cards */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            const needsAttention =
              r.status === "identified" ||
              (r.status === "in_progress" && r.embedding_score <= 2) ||
              !r.staff_briefed;
            return (
              <Card key={r.id} className={cn("border-l-4", STATUS_BORDER[r.status])}>
                <CardHeader
                  className="pb-2 cursor-pointer"
                  onClick={() => setExpandedId(isOpen ? null : r.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        <span>{r.lesson}</span>
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={SOURCE_CLR[r.source]}>{LESSON_SOURCE_LABEL[r.source]}</Badge>
                        <Badge variant="outline" className={THEME_CLR[r.theme_area]}>{LESSON_THEME_AREA_LABEL[r.theme_area]}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{LESSON_STATUS_LABEL[r.status]}</Badge>
                        <Badge variant="outline" className="bg-muted/50">
                          <Star className="h-3 w-3 mr-1 text-amber-500" />
                          {r.embedding_score}/5
                        </Badge>
                        {needsAttention && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Needs attention
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Identified: {r.date_identified} · Source ref: {r.source_reference} · Reviewed by {getStaffName(r.reviewed_by)} · Next review: {r.next_review_date}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    <div>
                      <p className="font-medium mb-1">Context</p>
                      <p className="text-muted-foreground text-xs">{r.context}</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">What Happened</p>
                      <p className="text-muted-foreground text-xs">{r.what_happened}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <p className="font-medium text-xs text-red-800 mb-1">Root Cause Analysis</p>
                      <p className="text-xs text-red-700">{r.root_cause_analysis}</p>
                    </div>
                    {r.what_we_changed.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-blue-700">What We Changed</p>
                        <ul className="space-y-1">
                          {r.what_we_changed.map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {r.policies_updated.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Policies / Procedures Updated</p>
                        <div className="flex flex-wrap gap-1">
                          {r.policies_updated.map((p, i) => (
                            <Badge key={i} variant="outline" className="bg-slate-100 text-slate-700 text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {r.training_delivered.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Training Delivered</p>
                        <div className="flex flex-wrap gap-1">
                          {r.training_delivered.map((t, i) => (
                            <Badge key={i} variant="outline" className="bg-indigo-50 text-indigo-700 text-xs">
                              <GraduationCap className="h-3 w-3 mr-1" />
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {r.staff_briefed ? (
                        <span className="text-green-700">
                          Staff briefed on {r.briefing_date}
                        </span>
                      ) : (
                        <span className="text-amber-700">
                          Briefing scheduled for {r.briefing_date} — not yet delivered
                        </span>
                      )}
                    </div>
                    {r.evidence_of_embedding.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-green-700">Evidence of Embedding</p>
                        <ul className="space-y-1">
                          {r.evidence_of_embedding.map((e, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                              <span>{e}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="bg-purple-50 border border-purple-200 rounded p-2">
                      <p className="font-medium text-xs text-purple-800 mb-1">Recurrence Check — has it happened again?</p>
                      <p className="text-xs text-purple-700">{r.recurrence_check}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework — Quality Standard 13 & Regulation 45</p>
          <p>
            The Children&apos;s Homes (England) Regulations 2015 — Quality Standard 13 (the leadership and management standard) requires the Registered Manager to demonstrate that practice in the home is informed by an understanding of the views and needs of children, and that learning from incidents, complaints and other sources is used to improve the home. Regulation 45 requires the Registered Person to undertake a six-monthly review of the quality of care, drawing on this learning. This register evidences the cross-cutting organisational learning required by both: each lesson is sourced, themed, root-caused, actioned, briefed, embedded and recurrence-checked. Lessons are reviewed at leadership and clinical meetings until embedded, and form a standing input into the Reg 45 review.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
