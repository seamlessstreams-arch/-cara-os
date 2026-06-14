"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown, ChevronUp, ArrowUpDown,
  UserCheck, Shield, AlertTriangle, CheckCircle, Clock, Phone, Eye, Loader2,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLoneWorkingRiskAssessments } from "@/hooks/use-lone-working-risk-assessments";
import type { LoneWorkingRiskAssessment, LWRAOverallRisk, LWRAScenario, LWRATraining } from "@/types/extended";
import { LWRA_OVERALL_RISK_LABEL, LWRA_APPROVED_SHIFT_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── UI metadata ──────────────────────────────────────────────────────── */

const riskColour: Record<LWRAOverallRisk, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

export default function LoneWorkingRiskAssessmentPage() {
  const { data: res, isLoading } = useLoneWorkingRiskAssessments();
  const data: LoneWorkingRiskAssessment[] = res?.data ?? [];

  const [filterStaff, setFilterStaff] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [sortBy, setSortBy] = useState("review");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const d = (n: number) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + n);
    return dt.toISOString().slice(0, 10);
  };

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterStaff !== "all") items = items.filter((a) => a.staff_member === filterStaff);
    if (filterRisk !== "all") items = items.filter((a) => a.overall_risk_level === filterRisk);
    items.sort((a, b) => {
      switch (sortBy) {
        case "review": return a.next_review_date.localeCompare(b.next_review_date);
        case "name": return a.staff_member.localeCompare(b.staff_member);
        case "risk": {
          const ord: Record<LWRAOverallRisk, number> = { high: 0, medium: 1, low: 2 };
          return ord[a.overall_risk_level] - ord[b.overall_risk_level];
        }
        default: return 0;
      }
    });
    return items;
  }, [data, filterStaff, filterRisk, sortBy]);

  const total = data.length;
  const allApproved = data.every((a) => a.approved_to_work_alone);
  const dueReview = data.filter((a) => a.next_review_date <= d(60)).length;
  const trainingExpiring = data.filter((a) => a.training_completed.some((t: LWRATraining) => !t.valid)).length;

  const exportCols: ExportColumn<LoneWorkingRiskAssessment>[] = [
    { header: "Staff Member", accessor: (r) => getStaffName(r.staff_member) },
    { header: "Role", accessor: (r) => r.role },
    { header: "Approved Solo", accessor: (r) => r.approved_to_work_alone ? "Yes" : "No" },
    { header: "Vehicle Approved", accessor: (r) => r.vehicle_approved ? "Yes" : "No" },
    { header: "Community Visits", accessor: (r) => r.community_visits_approved ? "Yes" : "No" },
    { header: "Overall Risk", accessor: (r) => LWRA_OVERALL_RISK_LABEL[r.overall_risk_level] },
    { header: "Reviewed", accessor: (r) => r.reviewed_date },
    { header: "Next Review", accessor: (r) => r.next_review_date },
  ];

  if (isLoading) return <PageShell title="Lone Working Risk Assessment" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Lone Working Risk Assessment"
      subtitle="Per-staff lone working assessments — scenarios, controls, and approved activities"
      caraContext={{ pageTitle: "Lone Working Risk Assessments", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="lone-working-risk-assessments" />
          <PrintButton title="Lone Working Risk Assessments" />
          <CaraStudioQuickActionButton context={{ record_type: "risk_assessment", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Active Assessments</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allApproved ? "100%" : `${data.filter((a) => a.approved_to_work_alone).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Approved Solo Working</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", dueReview > 0 ? "text-amber-600" : "text-green-600")}>{dueReview}</p>
          <p className="text-xs text-muted-foreground">Review Due 60 Days</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", trainingExpiring > 0 ? "text-red-600" : "text-green-600")}>{trainingExpiring}</p>
          <p className="text-xs text-muted-foreground">Training Expiring</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <UserCheck className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          Lone working in residential care is high-stakes — staff must be safe, supported, and competent.
          Each assessment is individualised to the staff member, their role, and the specific scenarios they
          face. Calling on-call is always encouraged, never penalised.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterStaff} onValueChange={setFilterStaff}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Staff" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            {data.map((a) => (
              <SelectItem key={a.staff_member} value={a.staff_member}>{getStaffName(a.staff_member)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterRisk} onValueChange={setFilterRisk}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Risk Levels" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="review">Earliest Review</SelectItem>
              <SelectItem value="name">By Name</SelectItem>
              <SelectItem value="risk">By Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((assessment) => {
          const isExpanded = expandedId === assessment.id;

          return (
            <div key={assessment.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : assessment.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <UserCheck className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getStaffName(assessment.staff_member)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {assessment.role} &middot; Reviewed {assessment.reviewed_date} &middot; Next due {assessment.next_review_date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", riskColour[assessment.overall_risk_level])}>
                    {LWRA_OVERALL_RISK_LABEL[assessment.overall_risk_level]} Risk
                  </span>
                  {assessment.approved_to_work_alone && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* scenarios */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Lone Working Scenarios</p>
                    <div className="space-y-2">
                      {assessment.scenarios.map((s: LWRAScenario, i: number) => (
                        <div key={i} className="bg-white rounded-lg p-3 border">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">{s.scenario}</p>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", riskColour[s.risk])}>{LWRA_OVERALL_RISK_LABEL[s.risk]}</span>
                          </div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Controls:</p>
                          <ul className="space-y-0.5">
                            {s.controls.map((c: string, ci: number) => (
                              <li key={ci} className="text-xs flex items-start gap-1">
                                <Shield className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* approved/restricted */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
                        <CheckCircle className="h-3 w-3 inline mr-1" />Approved Activities
                      </p>
                      <ul className="space-y-1">
                        {assessment.approved_activities.map((a: string, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-green-600 mt-0.5">•</span><span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Restricted Activities
                      </p>
                      <ul className="space-y-1">
                        {assessment.restricted_activities.map((r: string, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span><span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* training */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Training Status</p>
                    <div className="space-y-1">
                      {assessment.training_completed.map((t: LWRATraining, i: number) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-center justify-between">
                          <span>{t.course}</span>
                          <span className="text-xs text-muted-foreground">{t.date}</span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                            t.valid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          )}>
                            {t.valid ? "Valid" : "Expired"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* check-in & escalation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                        <Phone className="h-3 w-3 inline mr-1" />Check-In Arrangements
                      </p>
                      <p className="text-sm">{assessment.check_in_arrangements}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Escalation Path</p>
                      <ol className="space-y-1 text-sm list-decimal pl-4">
                        {assessment.escalation_path.map((e: string, i: number) => (
                          <li key={i}>{e.replace(/^\d+\.\s*/, "")}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {/* approved shifts */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Approved Shift Types</p>
                    <div className="flex flex-wrap gap-1">
                      {assessment.approved_shifts.map((s) => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{LWRA_APPROVED_SHIFT_LABEL[s]}</span>
                      ))}
                    </div>
                  </div>

                  {/* self-assessment */}
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Staff Self-Assessment</p>
                    <p className="text-sm text-purple-900 italic">&ldquo;{assessment.staff_self_assessment}&rdquo;</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Individual Considerations</p>
                    <p className="text-sm">{assessment.individual_considerations}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Eye className="h-3 w-3 inline mr-1" />Reviewed by: {getStaffName(assessment.reviewed_by)}</span>
                    <span><Clock className="h-3 w-3 inline mr-1" />Next review: {assessment.next_review_date}</span>
                    {assessment.vehicle_approved && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">Vehicle Approved</span>}
                    {assessment.community_visits_approved && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Community Approved</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Lone working assessments support Health and Safety at Work
          Act 1974, Management of Health and Safety at Work Regulations 1999, Quality Standard 13 (leadership
          and management), and the home&apos;s safer-recruitment-to-supervision continuum. Reviewed annually
          minimum, or when role/circumstances change.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Health & Safety"
        category="general"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Lone Working Risk Assessments — staff safety, sole staffing arrangements, risk controls, communication protocols, emergency procedures, Reg 31, safe staffing, Ofsted evidence"
        recordType="risk_assessment"
        className="mt-6"
      />
    </PageShell>
  );
}
