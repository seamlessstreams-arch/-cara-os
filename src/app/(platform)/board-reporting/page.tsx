"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useBoardReports } from "@/hooks/use-board-reports";
import type { BoardReport, BoardAgreedAction, BoardReportType, RagRating } from "@/types/extended";
import {
  BOARD_REPORT_TYPE_LABEL,
  RAG_RATING_LABEL,
  BOARD_ACTION_STATUS_LABEL,
} from "@/types/extended";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Send,
  Shield,
  TrendingUp,
  MessageSquare,
  Paperclip,
  Users,
  Target,
  Loader2,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ─── helpers ─── */
const ragColours = (rag: RagRating) => {
  switch (rag) {
    case "red":
      return "bg-red-100 text-red-800 border-red-200";
    case "amber":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "green":
      return "bg-green-100 text-green-800 border-green-200";
  }
};

const reportTypeColour = (t: BoardReportType) => {
  switch (t) {
    case "monthly_rm_report":
      return "bg-blue-100 text-blue-800";
    case "quarterly_performance":
      return "bg-purple-100 text-purple-800";
    case "annual_report":
      return "bg-amber-100 text-amber-800";
    case "reg_45_six_monthly":
      return "bg-emerald-100 text-emerald-800";
    case "reg_44_triangulation":
      return "bg-teal-100 text-teal-800";
    case "incident_briefing":
      return "bg-rose-100 text-rose-800";
    case "strategic_update":
      return "bg-indigo-100 text-indigo-800";
  }
};

const todayDate = () => new Date().toISOString().slice(0, 10);

const isCurrentYear = (dt: string) => {
  const yr = new Date().getFullYear().toString();
  return dt.startsWith(yr);
};

/* ─── export columns ─── */
const exportCols: ExportColumn<BoardReport>[] = [
  { header: "Report Type", accessor: (r: BoardReport) => BOARD_REPORT_TYPE_LABEL[r.report_type] },
  { header: "Period", accessor: (r: BoardReport) => r.report_period },
  { header: "Submitted Date", accessor: (r: BoardReport) => r.submitted_date },
  { header: "Submitted To", accessor: (r: BoardReport) => r.submitted_to },
  { header: "Authored By", accessor: (r: BoardReport) => getStaffName(r.authored_by) },
  { header: "RAG Rating", accessor: (r: BoardReport) => RAG_RATING_LABEL[r.risk_rag_rating] },
  { header: "Summary", accessor: (r: BoardReport) => r.summary },
  { header: "Board Response Received", accessor: (r: BoardReport) => (r.board_response_received ? "Yes" : "No") },
  { header: "Board Feedback", accessor: (r: BoardReport) => r.board_feedback },
  { header: "Actions (Total)", accessor: (r: BoardReport) => r.actions_agreed.length.toString() },
  { header: "Actions (Open)", accessor: (r: BoardReport) => r.actions_agreed.filter((a) => a.status !== "completed").length.toString() },
  { header: "Distribution", accessor: (r: BoardReport) => r.distribution_list.join("; ") },
  { header: "Next Report Due", accessor: (r: BoardReport) => r.next_report_due },
];

/* ─── component ─── */
export default function BoardReportingPage() {
  const { data: res, isLoading } = useBoardReports();
  const reports = useMemo(() => res?.data ?? [], [res]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  if (isLoading) {
    return (
      <PageShell title="Board Reporting" subtitle="Formal reports submitted to the Responsible Individual and Cornerstone Care Group Board — required by Quality Standard 13 and Regulation 45">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  /* ─── filtered & sorted ─── */
  const filtered = (() => {
    let list = [...reports];
    if (filterType !== "all") list = list.filter((r) => r.report_type === filterType);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.submitted_date.localeCompare(a.submitted_date);
        case "type":
          return a.report_type.localeCompare(b.report_type);
        case "rag": {
          const order: Record<RagRating, number> = { red: 0, amber: 1, green: 2 };
          return order[a.risk_rag_rating] - order[b.risk_rag_rating];
        }
        case "openActions":
          return (
            b.actions_agreed.filter((x) => x.status !== "completed").length -
            a.actions_agreed.filter((x) => x.status !== "completed").length
          );
        default:
          return 0;
      }
    });
    return list;
  })();

  /* ─── summary stats ─── */
  const stats = useMemo(() => {
    const allActions = reports.flatMap((r) => r.actions_agreed);
    const reportsThisYear = reports.filter((r) => isCurrentYear(r.submitted_date)).length;
    const feedbackReceived = reports.filter((r) => r.board_response_received).length;
    const openActions = allActions.filter((a) => a.status !== "completed").length;
    const today = todayDate();
    const upcoming = reports
      .map((r) => r.next_report_due)
      .filter((dt) => dt >= today)
      .sort()[0] ?? "Not scheduled";
    return { reportsThisYear, feedbackReceived, openActions, upcoming };
  }, [reports]);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const actionStatusBadge = (status: BoardAgreedAction["status"], deadline: string) => {
    const today = todayDate();
    const isOverdue = status === "overdue" || (status !== "completed" && deadline < today);
    if (isOverdue) return <Badge className="bg-red-100 text-red-800 text-xs">Overdue</Badge>;
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 text-xs">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800 text-xs">In Progress</Badge>;
      case "pending":
        return <Badge className="bg-gray-100 text-gray-800 text-xs">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{BOARD_ACTION_STATUS_LABEL[status]}</Badge>;
    }
  };

  return (
    <PageShell
      title="Board Reporting"
      subtitle="Formal reports submitted to the Responsible Individual and Cornerstone Care Group Board — required by Quality Standard 13 and Regulation 45"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={reports} columns={exportCols} filename="board-reporting" />
          <PrintButton title="Board Reporting" />
        </div>
      }
    >
      {/* ─── transparent governance banner ─── */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-100 rounded-full shrink-0">
            <Shield className="h-5 w-5 text-indigo-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-900 mb-1">Transparent Governance</p>
            <p className="text-xs text-indigo-800 leading-relaxed">
              Every report submitted upward is also a report on the lives of the children we care for. We
              report the whole picture — the progress and the concerns — so that those holding us to
              account can ask the right questions, scrutinise our judgements, and remain assured that
              children&apos;s welfare is genuinely central to every decision. Board feedback and agreed
              actions are tracked here as evidence of an active, two-way governance relationship.
            </p>
          </div>
        </div>
      </div>

      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.reportsThisYear}</p>
            <p className="text-xs text-muted-foreground">Reports This Year</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">
              {stats.feedbackReceived} / {reports.length}
            </p>
            <p className="text-xs text-muted-foreground">Board Feedback Received</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.openActions}</p>
            <p className="text-xs text-muted-foreground">Open Agreed Actions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.upcoming}</p>
            <p className="text-xs text-muted-foreground">Next Report Due</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── filters / sort ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All report types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Report Types</SelectItem>
            <SelectItem value="monthly_rm_report">{BOARD_REPORT_TYPE_LABEL.monthly_rm_report}</SelectItem>
            <SelectItem value="quarterly_performance">{BOARD_REPORT_TYPE_LABEL.quarterly_performance}</SelectItem>
            <SelectItem value="annual_report">{BOARD_REPORT_TYPE_LABEL.annual_report}</SelectItem>
            <SelectItem value="reg_45_six_monthly">{BOARD_REPORT_TYPE_LABEL.reg_45_six_monthly}</SelectItem>
            <SelectItem value="reg_44_triangulation">{BOARD_REPORT_TYPE_LABEL.reg_44_triangulation}</SelectItem>
            <SelectItem value="incident_briefing">{BOARD_REPORT_TYPE_LABEL.incident_briefing}</SelectItem>
            <SelectItem value="strategic_update">{BOARD_REPORT_TYPE_LABEL.strategic_update}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="type">Report Type</SelectItem>
              <SelectItem value="rag">RAG Rating</SelectItem>
              <SelectItem value="openActions">Open Actions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── report cards ─── */}
      <div className="space-y-4">
        {filtered.map((report) => {
          const expanded = expandedId === report.id;
          const openActionCount = report.actions_agreed.filter((a) => a.status !== "completed").length;
          const today = todayDate();
          const overdueCount = report.actions_agreed.filter(
            (a) => a.status === "overdue" || (a.status !== "completed" && a.deadline < today),
          ).length;

          return (
            <Card
              key={report.id}
              className={cn(
                "overflow-hidden",
                report.risk_rag_rating === "red" && "border-red-200",
                report.risk_rag_rating === "amber" && "border-amber-200",
              )}
            >
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(report.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-slate-100">
                      <FileText className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {BOARD_REPORT_TYPE_LABEL[report.report_type]} — {report.report_period}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={cn("text-xs", reportTypeColour(report.report_type))}>
                          {BOARD_REPORT_TYPE_LABEL[report.report_type]}
                        </Badge>
                        <Badge className={cn("text-xs border", ragColours(report.risk_rag_rating))}>
                          RAG: {RAG_RATING_LABEL[report.risk_rag_rating]}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Send className="h-3 w-3" /> {report.submitted_date} → {report.submitted_to}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className={cn(
                        "text-sm font-medium",
                        overdueCount > 0 ? "text-red-700" : openActionCount === 0 ? "text-green-700" : "text-blue-700",
                      )}>
                        {openActionCount} open
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {overdueCount > 0 ? `${overdueCount} overdue` : "actions"}
                      </p>
                    </div>
                    {expanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-5">
                  {/* meta */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-3 border-b">
                    <div>
                      <p className="text-xs text-muted-foreground">Authored By</p>
                      <p className="text-sm font-medium">{getStaffName(report.authored_by)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Submitted To</p>
                      <p className="text-sm font-medium">{report.submitted_to}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Submitted
                      </p>
                      <p className="text-sm font-medium">{report.submitted_date}</p>
                    </div>
                  </div>

                  {/* executive summary */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <FileText className="h-4 w-4 text-muted-foreground" /> Executive Summary
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{report.summary}</p>
                  </div>

                  {/* key metrics */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" /> Key Metrics
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(report.key_metrics).map(([k, v]) => (
                        <div key={k} className="border rounded-md p-2 bg-slate-50/60">
                          <p className="text-xs text-muted-foreground">{k}</p>
                          <p className="text-sm font-semibold">{v.value}</p>
                          <p className="text-xs text-muted-foreground italic">{v.change}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* narrative highlights */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-800 mb-2 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Narrative Highlights
                    </p>
                    <ul className="space-y-1">
                      {report.narrative_highlights.map((h, i) => (
                        <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                          <span className="text-green-400 mt-1.5">•</span> {h}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* areas of concern */}
                  {report.areas_of_concern.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Areas of Concern
                      </p>
                      <ul className="space-y-1">
                        {report.areas_of_concern.map((c, i) => (
                          <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                            <span className="text-amber-400 mt-1.5">•</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* child outcomes narrative */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" /> Child Outcomes Narrative
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {report.child_outcomes_narrative}
                    </p>
                  </div>

                  {/* strategic questions */}
                  {report.strategic_questions_raised.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Target className="h-4 w-4 text-muted-foreground" /> Strategic Questions Raised
                      </p>
                      <ul className="space-y-1">
                        {report.strategic_questions_raised.map((q, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-indigo-400 mt-1.5">•</span> {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* board feedback */}
                  <div className={cn(
                    "border rounded-lg p-3",
                    report.board_response_received ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200",
                  )}>
                    <p className={cn(
                      "text-sm font-medium mb-2 flex items-center gap-1",
                      report.board_response_received ? "text-blue-800" : "text-gray-700",
                    )}>
                      <MessageSquare className="h-4 w-4" /> Board / RI Feedback
                      {report.board_response_received ? (
                        <Badge className="bg-blue-100 text-blue-800 text-xs ml-2">Received</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 text-xs ml-2">Awaiting</Badge>
                      )}
                    </p>
                    {report.board_response_received ? (
                      <p className="text-sm text-blue-700 leading-relaxed">{report.board_feedback}</p>
                    ) : (
                      <p className="text-sm text-gray-600 italic">
                        No formal feedback recorded yet — awaiting Board / RI response.
                      </p>
                    )}
                  </div>

                  {/* actions agreed */}
                  {report.actions_agreed.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" /> Actions Agreed (
                        {report.actions_agreed.filter((a) => a.status === "completed").length}/
                        {report.actions_agreed.length} complete)
                      </p>
                      <div className="space-y-2">
                        {report.actions_agreed.map((action, i) => {
                          const isActionOverdue =
                            action.status === "overdue" ||
                            (action.status !== "completed" && action.deadline < today);
                          return (
                            <div
                              key={i}
                              className={cn(
                                "border rounded-md p-2 flex items-center justify-between gap-2",
                                isActionOverdue && "border-red-200 bg-red-50/50",
                              )}
                            >
                              <div className="min-w-0">
                                <p className="text-sm">{action.action}</p>
                                <p className="text-xs text-muted-foreground">
                                  {getStaffName(action.owner)} · by {action.deadline}
                                </p>
                              </div>
                              {actionStatusBadge(action.status, action.deadline)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* attachments & distribution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Paperclip className="h-4 w-4 text-muted-foreground" /> Evidence Attachments
                      </p>
                      <ul className="space-y-1">
                        {report.evidence_attachments.map((a, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-slate-400 mt-1.5">•</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Send className="h-4 w-4 text-muted-foreground" /> Distribution List
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {report.distribution_list.map((rec, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {rec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* footer */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Retention Period</p>
                      <p className="text-sm font-medium">{report.retention_period}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Next Report Due
                      </p>
                      <p className="text-sm font-medium">{report.next_report_due}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">Regulatory Context</p>
        <p className="text-xs text-slate-600 leading-relaxed">
          Quality Standard 13 (Leadership and Management) requires that the registered manager and
          responsible individual lead and manage the home in a way that promotes children&apos;s
          welfare and protects them from harm. Regulation 45 of the Children&apos;s Homes (England)
          Regulations 2015 requires the registered person to review the quality of care provided at
          least every six months and produce a written report. The reports recorded here form the
          formal evidence base of upward governance — demonstrating that the home is operating with
          transparency, accountability and reflective practice. Two-way feedback from the Responsible
          Individual and Board, captured against each report, evidences active oversight rather than
          passive submission.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
