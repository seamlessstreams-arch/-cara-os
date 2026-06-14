"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  GraduationCap,
  Users,
  Stethoscope,
  Heart,
  Sparkles,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type { EhcpRecord, EhcpPlanStatus } from "@/types/extended";
import { useEhcpRecords } from "@/hooks/use-ehcp-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const STATUS_META: Record<EhcpPlanStatus, { label: string; color: string }> = {
  pre_assessment: { label: "Pre-assessment", color: "bg-slate-100 text-[var(--cs-text-secondary)]" },
  needs_assessment_in_progress: {
    label: "Needs Assessment",
    color: "bg-blue-100 text-blue-800",
  },
  final_plan_in_place: { label: "Final Plan", color: "bg-green-100 text-green-800" },
  annual_review_due: { label: "Review Due", color: "bg-amber-100 text-amber-800" },
  refused: { label: "Refused", color: "bg-red-100 text-red-800" },
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function EhcpTrackerPage() {
  const query = useEhcpRecords();
  const data = query.data?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "status" | "review">("status");
  const [filterStatus, setFilterStatus] = useState<"all" | EhcpPlanStatus>("all");

  const filtered = useMemo(() => {
    return data.filter((r) => filterStatus === "all" || r.plan_status === filterStatus);
  }, [data, filterStatus]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "review":
          // Records with no review due date go to bottom
          if (a.next_annual_review_due === "—") return 1;
          if (b.next_annual_review_due === "—") return -1;
          return a.next_annual_review_due.localeCompare(b.next_annual_review_due);
        default:
          // status order: review due > assessment in progress > final plan > pre-assessment > refused
          const order: Record<EhcpPlanStatus, number> = {
            annual_review_due: 0,
            needs_assessment_in_progress: 1,
            final_plan_in_place: 2,
            pre_assessment: 3,
            refused: 4,
          };
          return order[a.plan_status] - order[b.plan_status];
      }
    });
  }, [filtered, sortBy]);

  const exportCols: ExportColumn<EhcpRecord>[] = [
    { header: "Young Person", accessor: (r: EhcpRecord) => getYPName(r.child_id) },
    { header: "Plan Status", accessor: (r: EhcpRecord) => r.plan_status },
    { header: "Plan Version", accessor: (r: EhcpRecord) => r.plan_version },
    { header: "Date of Plan", accessor: (r: EhcpRecord) => r.date_of_plan },
    { header: "Last Annual Review", accessor: (r: EhcpRecord) => r.last_annual_review_date },
    { header: "Next Annual Review Due", accessor: (r: EhcpRecord) => r.next_annual_review_due },
    { header: "Primary Need", accessor: (r: EhcpRecord) => r.primary_need },
    { header: "Secondary Needs", accessor: (r: EhcpRecord) => r.secondary_needs.join("; ") },
    { header: "Placement / Setting", accessor: (r: EhcpRecord) => r.placement },
    { header: "Local Authority", accessor: (r: EhcpRecord) => r.local_authority },
    { header: "SENDO Officer", accessor: (r: EhcpRecord) => r.sendo_officer },
    { header: "Funding", accessor: (r: EhcpRecord) => r.funding },
    { header: "Reviewed By", accessor: (r: EhcpRecord) => getStaffName(r.reviewed_by) },
    {
      header: "Outstanding Actions",
      accessor: (r: EhcpRecord) => r.outstanding_actions.join(" | "),
    },
  ];

  /* summary stats */
  const activePlans = data.filter((r) => r.plan_status === "final_plan_in_place").length;
  const reviewsDue = data.filter((r) => r.plan_status === "annual_review_due").length;
  const inAssessment = data.filter(
    (r) => r.plan_status === "needs_assessment_in_progress"
  ).length;
  // Time-to-plan: average gap from earliest plan in our data — illustrative only.
  // Statutory deadline is 20 weeks; we display the LA's stated average.
  const avgTimeToPlan = "18 weeks (LA stated average)";

  // Alert: any plan with annual review due within 30 days (or "annual_review_due" status)
  const reviewSoon = data.filter((r) => {
    if (r.plan_status === "annual_review_due") return true;
    if (r.next_annual_review_due === "—") return false;
    const dueDate = new Date(r.next_annual_review_due);
    const now = new Date();
    const days = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return days <= 30 && days >= 0;
  });

  const inAssessmentList = data.filter((r) => r.plan_status === "needs_assessment_in_progress");

  if (query.isLoading) {
    return (
      <PageShell
        title="EHCP Tracker"
        subtitle="Education, Health and Care Plans · SEND · Children and Families Act 2014"
      >
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="EHCP Tracker"
      subtitle="Education, Health and Care Plans · SEND · Children and Families Act 2014"
      caraContext={{ pageTitle: "EHCP Tracker", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="EHCP Tracker" />
          <ExportButton data={data} columns={exportCols} filename="ehcp-tracker" />
          <CaraStudioQuickActionButton context={{ record_type: "education", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{activePlans}</p>
              <p className="text-xs text-muted-foreground">Active EHCPs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p
                className={cn(
                  "text-2xl font-bold",
                  reviewsDue > 0 ? "text-amber-600" : "text-green-600"
                )}
              >
                {reviewsDue}
              </p>
              <p className="text-xs text-muted-foreground">Annual Reviews Due</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-blue-700">{inAssessment}</p>
              <p className="text-xs text-muted-foreground">In Assessment</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{avgTimeToPlan}</p>
              <p className="text-xs text-muted-foreground">
                Avg Time-to-Plan (statutory: 20 wks)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* alerts */}
        {reviewSoon.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">Annual Review Approaching</p>
              <p className="text-amber-700">
                {reviewSoon
                  .map(
                    (r) =>
                      `${getYPName(r.child_id)} (due ${r.next_annual_review_due === "—" ? "review now" : r.next_annual_review_due})`
                  )
                  .join(", ")}{" "}
                — annual reviews are statutory under the Children and Families Act 2014. Convene
                review meeting and notify SENDO officer.
              </p>
            </div>
          </div>
        )}

        {inAssessmentList.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-800">EHCP Needs Assessment Underway</p>
              <p className="text-blue-700">
                {inAssessmentList
                  .map((r) => `${getYPName(r.child_id)} (${r.primary_need})`)
                  .join(", ")}{" "}
                — LA must complete needs assessment and issue draft/refusal within 20 weeks of
                request. Track statutory deadline and chase SENDO if drift.
              </p>
            </div>
          </div>
        )}

        {/* filters and sort */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[200px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Sort: Status priority</SelectItem>
                <SelectItem value="review">Sort: Next review (soonest)</SelectItem>
                <SelectItem value="name">Sort: Name (A–Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}
            >
              <SelectTrigger className="w-[220px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Filter: All statuses</SelectItem>
                <SelectItem value="final_plan_in_place">Final Plan in place</SelectItem>
                <SelectItem value="needs_assessment_in_progress">
                  Needs Assessment in progress
                </SelectItem>
                <SelectItem value="annual_review_due">Annual Review due</SelectItem>
                <SelectItem value="pre_assessment">Pre-assessment</SelectItem>
                <SelectItem value="refused">Refused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* records */}
        <div className="space-y-3">
          {sorted.map((r) => {
            const isOpen = expandedId === r.id;
            const isFinal = r.plan_status === "final_plan_in_place";
            const isInAssessment = r.plan_status === "needs_assessment_in_progress";
            const isPre = r.plan_status === "pre_assessment";
            return (
              <Card
                key={r.id}
                className={cn(
                  "border-l-4",
                  isFinal
                    ? "border-l-green-500"
                    : isInAssessment
                      ? "border-l-blue-500"
                      : r.plan_status === "annual_review_due"
                        ? "border-l-amber-500"
                        : "border-l-slate-300"
                )}
              >
                <CardHeader
                  className="pb-2 cursor-pointer"
                  onClick={() => setExpandedId(isOpen ? null : r.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        <FileText className="h-4 w-4 text-blue-600" />
                        {getYPName(r.child_id)}
                        <Badge variant="outline" className={STATUS_META[r.plan_status].color}>
                          {STATUS_META[r.plan_status].label}
                        </Badge>
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                          {r.primary_need}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.placement} · LA: {r.local_authority} · Reviewed by{" "}
                        {getStaffName(r.reviewed_by)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Plan: {r.plan_version}
                        {r.date_of_plan !== "—" && <> · Issued {r.date_of_plan}</>}
                        {r.next_annual_review_due !== "—" && (
                          <> · Next review {r.next_annual_review_due}</>
                        )}
                      </p>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* SEN Support note for Jordan */}
                    {isPre && (
                      <div className="bg-slate-50 border border-[var(--cs-border)] rounded p-3">
                        <p className="font-medium text-xs text-[var(--cs-navy)] mb-1 flex items-center gap-1">
                          <ClipboardList className="h-3.5 w-3.5" />
                          No EHCP — SEN Support only
                        </p>
                        <p className="text-xs text-[var(--cs-text-secondary)]">
                          {getYPName(r.child_id)} does not currently have an EHCP. Educational
                          needs are met through the school&apos;s graduated SEN Support approach
                          (assess-plan-do-review). An EHCP needs assessment can be requested by
                          the young person, parent, or carer at any time if needs escalate or
                          progress is not made via SEN Support.
                        </p>
                      </div>
                    )}

                    {/* core info grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Date of Plan</p>
                        <p className="font-medium">{r.date_of_plan}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Last Annual Review</p>
                        <p className="font-medium">{r.last_annual_review_date}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Next Review Due</p>
                        <p className="font-medium">{r.next_annual_review_due}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">SENDO Officer</p>
                        <p className="font-medium">{r.sendo_officer}</p>
                      </div>
                    </div>

                    {/* needs */}
                    <div>
                      <p className="font-medium mb-2 flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-purple-600" /> Identified Needs
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                          Primary: {r.primary_need}
                        </Badge>
                        {r.secondary_needs.map((n, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="bg-purple-50 text-purple-700"
                          >
                            {n}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* sections A, B, D, E */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="font-medium text-xs text-blue-800 mb-1 flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" /> Section A — Aspirations
                        </p>
                        <p className="text-xs text-blue-700">{r.section_a}</p>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-200 rounded p-2">
                        <p className="font-medium text-xs text-indigo-800 mb-1 flex items-center gap-1">
                          <GraduationCap className="h-3.5 w-3.5" /> Section B — Special
                          Educational Needs
                        </p>
                        <p className="text-xs text-indigo-700">{r.section_b}</p>
                      </div>
                      <div className="bg-rose-50 border border-rose-200 rounded p-2">
                        <p className="font-medium text-xs text-rose-800 mb-1 flex items-center gap-1">
                          <Stethoscope className="h-3.5 w-3.5" /> Section D — Health Needs
                        </p>
                        <p className="text-xs text-rose-700">{r.section_d}</p>
                      </div>
                      <div className="bg-teal-50 border border-teal-200 rounded p-2">
                        <p className="font-medium text-xs text-teal-800 mb-1 flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> Section E — Social Care Needs
                        </p>
                        <p className="text-xs text-teal-700">{r.section_e}</p>
                      </div>
                    </div>

                    {/* provisions */}
                    <div>
                      <p className="font-medium mb-2 flex items-center gap-1">
                        <ClipboardList className="h-4 w-4 text-green-600" /> Provisions
                      </p>
                      <div className="space-y-1">
                        {r.provisions_listed.map((p, i) => (
                          <div key={i} className="bg-muted/40 rounded p-2 text-xs">
                            <div className="flex items-center justify-between mb-0.5 flex-wrap gap-1">
                              <span className="font-medium">{p.provision}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {p.section}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">
                              {p.frequency} · Provider: {p.provider}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* funding */}
                    <div className="bg-amber-50 border border-amber-200 rounded p-2">
                      <p className="font-medium text-xs text-amber-800 mb-1">Funding</p>
                      <p className="text-xs text-amber-700">{r.funding}</p>
                    </div>

                    {/* transition planning */}
                    <div>
                      <p className="font-medium text-xs mb-1 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-purple-600" /> Transition Planning
                      </p>
                      <p className="text-xs text-muted-foreground">{r.transition_planning}</p>
                    </div>

                    {/* child contribution */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1">
                        Child&apos;s Contribution
                      </p>
                      <p className="text-xs text-blue-700">{r.child_contribution}</p>
                    </div>

                    {/* parental involvement */}
                    <div>
                      <p className="font-medium text-xs mb-1">Parental / Carer Involvement</p>
                      <p className="text-xs text-muted-foreground">{r.parental_involvement}</p>
                    </div>

                    {/* outstanding actions */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <Clock className="h-4 w-4 text-amber-600" /> Outstanding Actions
                      </p>
                      {r.outstanding_actions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No outstanding actions.</p>
                      ) : (
                        r.outstanding_actions.map((a, i) => (
                          <div
                            key={i}
                            className="bg-muted/40 rounded p-2 mb-1 flex items-start gap-2 text-xs"
                          >
                            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>{a}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* reviewed by */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      <span>
                        Last reviewed by {getStaffName(r.reviewed_by)} (Education Lead)
                      </span>
                    </div>

                    {/* smart links */}
                    <SmartLinkPanel sourceType="ehcp-record" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">
            Education, Health and Care Plans (EHCPs) — Statutory Framework
          </p>
          <p>
            EHCPs are statutory documents under the Children and Families Act 2014 (Part 3) and
            the SEND Code of Practice 2015 (0-25 years). They describe the special educational,
            health and social care needs of a child or young person and the provision required.
            The Local Authority must complete a needs assessment and issue a final plan (or
            decide not to issue) within 20 weeks of a request. EHCPs must be reviewed at least
            annually (every 12 months), and within 6 months for children under 5. Children&apos;s
            home registered managers are responsible under Quality Standard 8 (Education) of the
            Children&apos;s Homes Regulations 2015 for ensuring EHCPs are in place where needed,
            up to date, and that provision is delivered. Where needs are not met, escalation to
            the SENDO and, if necessary, the SEND Tribunal (SENDIST) is the formal route. The
            child&apos;s views must be central to the EHCP process at every stage (Section A,
            child&apos;s contribution).
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Education"
        category="education"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="EHCP Tracker — Education Health and Care Plan, annual review dates, outcomes, placement requirements, school support, SENCO, OT, SALT, PEP, progress against targets, LA"
        recordType="education"
        className="mt-6"
      />
    </PageShell>
  );
}
