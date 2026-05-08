"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Users,
  FileText,
  Heart,
  Mic,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLacReviewPreps } from "@/hooks/use-lac-review-preps";
import type { LacReviewPrep, LacPrepStatus } from "@/types/extended";
import { LAC_REVIEW_TYPE_LABEL, LAC_PREP_STATUS_LABEL, CHILD_PREP_STATUS_LABEL, CHILD_ATTENDANCE_CHOICE_LABEL, LAC_PREP_ACTION_STATUS_LABEL } from "@/types/extended";

const prepStatusColour: Record<LacPrepStatus, string> = {
  not_started: "bg-slate-100 text-slate-800",
  in_progress: "bg-amber-100 text-amber-800",
  ready_for_review: "bg-blue-100 text-blue-800",
  review_held: "bg-green-100 text-green-800",
  post_review_actions: "bg-purple-100 text-purple-800",
};

export default function LacReviewPrepPage() {
  const { data: res, isLoading } = useLacReviewPreps();
  const data: LacReviewPrep[] = res?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const childIds = useMemo(() => [...new Set(data.map((p) => p.child_id))], [data]);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((p) => p.child_id === filterYP);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return a.review_scheduled_for.localeCompare(b.review_scheduled_for);
        case "child":
          return a.child_id.localeCompare(b.child_id);
        default:
          return 0;
      }
    });
    return items;
  }, [data, filterYP, sortBy]);

  const total = data.length;
  const reportsSubmitted = data.filter((p) => p.home_report_submitted).length;
  const totalOpenActions = data.reduce((sum, p) => sum + p.outstanding_actions.filter((a) => a.status !== "done").length, 0);
  const todayStr = new Date().toISOString().slice(0, 10);
  const d30 = new Date(); d30.setDate(d30.getDate() + 30);
  const d30Str = d30.toISOString().slice(0, 10);
  const upcoming30 = data.filter((p) => p.review_scheduled_for >= todayStr && p.review_scheduled_for <= d30Str).length;

  const exportCols: ExportColumn<LacReviewPrep>[] = [
    { header: "Young Person", accessor: (r: LacReviewPrep) => getYPName(r.child_id) },
    { header: "Review Type", accessor: (r: LacReviewPrep) => LAC_REVIEW_TYPE_LABEL[r.review_type] },
    { header: "Review Date", accessor: (r: LacReviewPrep) => r.review_scheduled_for },
    { header: "IRO", accessor: (r: LacReviewPrep) => r.iro_name },
    { header: "Prep Status", accessor: (r: LacReviewPrep) => LAC_PREP_STATUS_LABEL[r.prep_status] },
    { header: "Child Prep", accessor: (r: LacReviewPrep) => CHILD_PREP_STATUS_LABEL[r.child_prep_status] },
    { header: "Child Attendance", accessor: (r: LacReviewPrep) => CHILD_ATTENDANCE_CHOICE_LABEL[r.child_choose_to_attend] },
    { header: "Report Submitted", accessor: (r: LacReviewPrep) => r.home_report_submitted ? "Yes" : "No" },
    { header: "Open Actions", accessor: (r: LacReviewPrep) => String(r.outstanding_actions.filter((a) => a.status !== "done").length) },
  ];

  if (isLoading) return <PageShell title="LAC Review Preparation" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="LAC Review Preparation"
      subtitle="Pre-review work for each child — wishes and feelings, multi-agency reports, action progress"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="lac-review-prep" />
          <PrintButton title="LAC Review Preparation" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Active Reviews</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{upcoming30}</p>
          <p className="text-xs text-muted-foreground">Due Next 30 Days</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{reportsSubmitted}/{total}</p>
          <p className="text-xs text-muted-foreground">Home Reports Submitted</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{totalOpenActions}</p>
          <p className="text-xs text-muted-foreground">Open Actions</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Calendar className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          LAC reviews are statutory checkpoints, but they are also the child&apos;s opportunity to be heard at
          the highest level of their care planning. Preparation is everything — particularly the child&apos;s
          voice work, captured in the way each child finds easiest.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {childIds.map((id) => (
              <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Soonest Review</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((prep) => {
          const isExpanded = expandedId === prep.id;
          const collected = prep.multi_agency_reports_collected.filter((r) => r.received).length;
          const totalReports = prep.multi_agency_reports_collected.length;
          const openActions = prep.outstanding_actions.filter((a) => a.status !== "done").length;

          return (
            <div key={prep.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : prep.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Calendar className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(prep.child_id)} &middot; {LAC_REVIEW_TYPE_LABEL[prep.review_type]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Review {prep.review_scheduled_for} &middot; IRO: {prep.iro_name} &middot; Reports {collected}/{totalReports} &middot; {openActions} open actions
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", prepStatusColour[prep.prep_status])}>
                    {LAC_PREP_STATUS_LABEL[prep.prep_status]}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* child voice prep */}
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">
                      <Mic className="h-3 w-3 inline mr-1" />Child Voice Prep ({CHILD_PREP_STATUS_LABEL[prep.child_prep_status]})
                    </p>
                    <p className="text-sm mb-2">Attendance: <strong>{CHILD_ATTENDANCE_CHOICE_LABEL[prep.child_choose_to_attend]}</strong></p>
                    {prep.child_advocate_involved && (
                      <p className="text-sm text-purple-700">Advocate: {prep.child_advocate_name}</p>
                    )}
                    <ul className="space-y-1 mt-2">
                      {prep.child_prep_activities.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-purple-600 mt-0.5">•</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* wishes and feelings */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      <Heart className="h-3 w-3 inline mr-1" />Wishes &amp; Feelings
                    </p>
                    <ul className="space-y-1">
                      {prep.child_wishes_and_feelings.map((w, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* topics to raise/avoid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Topics To Raise</p>
                      <ul className="space-y-1">
                        {prep.child_topics_to_raise.map((t, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-emerald-600 mt-0.5">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Topics To Avoid</p>
                      <ul className="space-y-1">
                        {prep.child_topics_to_avoid.map((t, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* multi-agency reports */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <FileText className="h-3 w-3 inline mr-1" />Multi-Agency Reports ({collected}/{totalReports})
                    </p>
                    <div className="space-y-1">
                      {prep.multi_agency_reports_collected.map((r, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-center justify-between">
                          <span>{r.agency}</span>
                          {r.received ? (
                            <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />{r.received_date}</span>
                          ) : (
                            <span className="text-xs text-amber-600 flex items-center gap-1"><Clock className="h-3 w-3" />Pending</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* past actions progress */}
                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Past Actions — Progress Review</p>
                    <ul className="space-y-1">
                      {prep.past_actions_to_review_progress.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          {a.status.startsWith("Achieved") ? <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" /> :
                           a.status.startsWith("In progress") || a.status.startsWith("Progress") ? <Clock className="h-3 w-3 text-amber-500 mt-1 shrink-0" /> :
                           <AlertTriangle className="h-3 w-3 text-red-500 mt-1 shrink-0" />}
                          <span>{a.action} — <em>{a.status}</em></span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* outstanding prep actions */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Prep Actions ({openActions} open)</p>
                    <div className="space-y-1">
                      {prep.outstanding_actions.map((a, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-start justify-between gap-2">
                          <span className="flex-1">{a.action}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {a.owner.startsWith("staff_") ? getStaffName(a.owner) : a.owner} &middot; {a.deadline}
                          </span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                            a.status === "done" ? "bg-green-100 text-green-800" :
                            a.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                            "bg-amber-100 text-amber-800"
                          )}>
                            {LAC_PREP_ACTION_STATUS_LABEL[a.status]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* document currency */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Document Currency</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <div className={cn("rounded-lg p-2 text-center text-sm", prep.risk_assessment_current ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
                        {prep.risk_assessment_current ? <CheckCircle className="h-4 w-4 inline mr-1" /> : <AlertTriangle className="h-4 w-4 inline mr-1" />}
                        Risk Assessment
                      </div>
                      <div className={cn("rounded-lg p-2 text-center text-sm", prep.care_plan_current ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
                        {prep.care_plan_current ? <CheckCircle className="h-4 w-4 inline mr-1" /> : <AlertTriangle className="h-4 w-4 inline mr-1" />}
                        Care Plan
                      </div>
                      <div className={cn("rounded-lg p-2 text-center text-sm", prep.education_report_obtained ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800")}>
                        {prep.education_report_obtained ? <CheckCircle className="h-4 w-4 inline mr-1" /> : <Clock className="h-4 w-4 inline mr-1" />}
                        Education Report
                      </div>
                      <div className={cn("rounded-lg p-2 text-center text-sm", prep.health_report_obtained ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800")}>
                        {prep.health_report_obtained ? <CheckCircle className="h-4 w-4 inline mr-1" /> : <Clock className="h-4 w-4 inline mr-1" />}
                        Health Report
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Post-Review Support Plan</p>
                    <p className="text-sm text-emerald-900">{prep.child_post_review_support_plan}</p>
                  </div>

                  {prep.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{prep.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Users className="h-3 w-3 inline mr-1" />Prepared by: {getStaffName(prep.prepared_by)}</span>
                    <span>Report deadline: {prep.home_report_deadline}</span>
                    <span>Review: {prep.review_scheduled_for}</span>
                  </div>

                  <div className="mt-4">
                    <SmartLinkPanel sourceType="lac-review-preps" sourceId={prep.id} childId={prep.child_id} compact />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> LAC review preparation supports Care Planning Regulations 2010,
          IRO Handbook 2010, Quality Standard 4 (the child&apos;s plan), and UNCRC Article 12. Reviews must
          consider the child&apos;s wishes and feelings as central. Preparation begins at least 4 weeks
          before the scheduled review. Linked to IRO Correspondence and Statutory Visit Log.
        </p>
      </div>
    </PageShell>
  );
}
