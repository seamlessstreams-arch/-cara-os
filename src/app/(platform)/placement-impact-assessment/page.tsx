"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent } from "@/components/ui/card";
import { FlatList, FlatListRow, FlatListRowDetail, type RowSeverity } from "@/components/ui/list-row";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import type {
  PlacementImpactAssessment,
  ImpactOnChildAssessment,
  CompatibilityFactor,
  PlacementImpactStatus,
  ImpactRiskLevel,
} from "@/types/extended";
import { PLACEMENT_IMPACT_STATUS_LABEL, IMPACT_RISK_LEVEL_LABEL } from "@/types/extended";
import { usePlacementImpactAssessments } from "@/hooks/use-placement-impact-assessments";
import {
  ChevronUp,
  ChevronDown,
  Users,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Shield,
  Heart,
  ArrowUpDown,
  XCircle,
  Loader2,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ─── export columns ─── */
const exportCols: ExportColumn<PlacementImpactAssessment>[] = [
  { header: "Referral", accessor: (r: PlacementImpactAssessment) => r.referral_name },
  { header: "Age", accessor: (r: PlacementImpactAssessment) => r.referral_age.toString() },
  { header: "LA", accessor: (r: PlacementImpactAssessment) => r.referral_la },
  { header: "Assessed By", accessor: (r: PlacementImpactAssessment) => getStaffName(r.assessed_by) },
  { header: "Date", accessor: (r: PlacementImpactAssessment) => r.assessment_date },
  { header: "Status", accessor: (r: PlacementImpactAssessment) => r.status.replace(/_/g, " ") },
  { header: "Overall Risk", accessor: (r: PlacementImpactAssessment) => r.overall_risk },
  { header: "Decision", accessor: (r: PlacementImpactAssessment) => r.decision },
  { header: "Conditions", accessor: (r: PlacementImpactAssessment) => r.conditions.length.toString() },
];

/* ─── component ─── */
export default function PlacementImpactAssessmentPage() {
  const { data: res, isLoading } = usePlacementImpactAssessments();
  const entries = res?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filtered = useMemo(() => {
    let list = [...entries];
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.assessment_date.localeCompare(a.assessment_date);
        case "risk":
          const riskOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
          return (riskOrder[a.overall_risk] ?? 3) - (riskOrder[b.overall_risk] ?? 3);
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
    return list;
  }, [entries, filterStatus, sortBy]);

  const stats = useMemo(() => {
    const total = entries.length;
    const approved = entries.filter((a) => a.status === "approved" || a.status === "approved_with_conditions").length;
    const declined = entries.filter((a) => a.status === "declined").length;
    const pending = entries.filter((a) => a.status === "pending").length;
    return { total, approved, declined, pending };
  }, [entries]);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const riskBadge = (risk: string) => {
    switch (risk) {
      case "low":
        return <Badge className="bg-[--cs-success-bg] text-[--cs-success] text-xs">Low Risk</Badge>;
      case "medium":
        return <Badge className="bg-[--cs-warning-bg] text-[--cs-warning] text-xs">Medium Risk</Badge>;
      case "high":
        return <Badge className="bg-[--cs-risk-bg] text-[--cs-risk] text-xs">High Risk</Badge>;
      default:
        return null;
    }
  };

  const statusRow = (status: string): RowSeverity =>
    status === "declined" ? "risk" : status === "pending" ? "warning" : status === "approved_with_conditions" ? "info" : "success";

  const statusText = (status: string) => {
    const cls = status === "approved" ? "text-[--cs-success]" : status === "approved_with_conditions" ? "text-[--cs-info]" : status === "declined" ? "text-[--cs-risk]" : status === "pending" ? "text-[--cs-warning]" : "text-muted-foreground";
    const label = status === "approved" ? "Approved" : status === "approved_with_conditions" ? "Approved (Conditions)" : status === "declined" ? "Declined" : status === "pending" ? "Pending" : status;
    return <span className={cn("text-[11px] font-semibold uppercase tracking-wide", cls)}>{label}</span>;
  };

  const riskText = (risk: string) => {
    if (!["low", "medium", "high"].includes(risk)) return null;
    const cls = risk === "low" ? "text-[--cs-success]" : risk === "medium" ? "text-[--cs-warning]" : "text-[--cs-risk]";
    return <span className={cn("text-[11px] font-semibold uppercase tracking-wide", cls)}>{risk === "low" ? "Low Risk" : risk === "medium" ? "Medium Risk" : "High Risk"}</span>;
  };

  const compatRating = (rating: string) => {
    switch (rating) {
      case "positive":
        return <CheckCircle2 className="h-4 w-4 text-[--cs-success] shrink-0" />;
      case "concern":
        return <AlertTriangle className="h-4 w-4 text-[--cs-risk] shrink-0" />;
      default:
        return <Scale className="h-4 w-4 text-gray-400 shrink-0" />;
    }
  };

  if (isLoading) {
    return (
      <PageShell title="Placement Impact Assessments" subtitle="Reg 14 — assessing the impact of new admissions on existing children before placement decisions">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Placement Impact Assessments"
      subtitle="Reg 14 — assessing the impact of new admissions on existing children before placement decisions"
      caraContext={{ pageTitle: "Placement Impact Assessments", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={entries} columns={exportCols} filename="placement-impact-assessments" />
          <PrintButton title="Placement Impact Assessments" />
          <CaraStudioQuickActionButton context={{ record_type: "placement_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Assessments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-[--cs-success]">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-[--cs-risk]">{stats.declined}</p>
            <p className="text-xs text-muted-foreground">Declined</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-[--cs-warning]">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── pending alert ─── */}
      {stats.pending > 0 && (
        <div className="bg-[--cs-warning-bg] border border-[--cs-warning-soft] rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <Scale className="h-5 w-5 text-[--cs-warning] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-[--cs-warning]">Assessment Pending</p>
              <p className="text-xs text-[--cs-warning] mt-1">
                {entries
                  .filter((a) => a.status === "pending")
                  .map((a) => `${a.referral_name} (${a.referral_la})`)
                  .join("; ")}{" "}
                — awaiting further information before decision.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── filters ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {(Object.entries(PLACEMENT_IMPACT_STATUS_LABEL) as [string, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Most Recent</option>
            <option value="risk">Risk Level</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* ─── assessment cards ─── */}
      <FlatList>
        {filtered.map((assessment) => {
          const expanded = expandedId === assessment.id;

          return (
            <div key={assessment.id}>
              <FlatListRow severity={statusRow(assessment.status)} onClick={() => toggle(assessment.id)} aria-expanded={expanded}>
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <Scale className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-[var(--cs-navy)]">
                        {assessment.referral_name} — Age {assessment.referral_age}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {statusText(assessment.status)}
                        {riskText(assessment.overall_risk)}
                        <span className="text-xs text-muted-foreground">{assessment.referral_la}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Assessed</p>
                      <p className="text-sm">{assessment.assessment_date}</p>
                    </div>
                    {expanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </FlatListRow>

              {expanded && (
                <FlatListRowDetail className="pb-4 space-y-5">
                  {/* decision */}
                  <div className={cn(
                    "rounded-lg p-3 border",
                    assessment.status === "declined" ? "bg-[--cs-risk-bg] border-[--cs-risk-soft]" :
                    assessment.status === "pending" ? "bg-[--cs-warning-bg] border-[--cs-warning-soft]" :
                    "bg-[--cs-success-bg] border-[--cs-success-soft]"
                  )}>
                    <p className="text-sm font-medium">{assessment.decision}</p>
                    <p className="text-sm text-muted-foreground mt-1">{assessment.decision_rationale}</p>
                  </div>

                  {/* impact on existing children */}
                  <div>
                    <p className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" /> Impact on Existing Children
                    </p>
                    <div className="space-y-3">
                      {assessment.impact_on_existing.map((impact) => (
                        <div key={impact.child_id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{getYPName(impact.child_id)}</span>
                            {riskBadge(impact.risk_level)}
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Considerations</p>
                              <ul className="space-y-0.5">
                                {impact.considerations.map((c, i) => (
                                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                    <span className="mt-1">•</span> {c}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Mitigations</p>
                              <ul className="space-y-0.5">
                                {impact.mitigations.map((m, i) => (
                                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                    <span className="text-[--cs-success] mt-1">✓</span> {m}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {impact.child_view && (
                              <div className="bg-[--cs-info-bg] rounded p-2 mt-1">
                                <p className="text-xs text-[--cs-info]">
                                  <span className="font-medium">Child&apos;s view:</span> {impact.child_view}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* compatibility factors */}
                  <div>
                    <p className="text-sm font-medium mb-2">Compatibility Factors</p>
                    <div className="space-y-1.5">
                      {assessment.compatibility_factors.map((cf, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          {compatRating(cf.rating)}
                          <span>{cf.factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* staffing, environment, safeguarding */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                        <Users className="h-3 w-3" /> Staffing
                      </p>
                      <ul className="space-y-0.5">
                        {assessment.staffing_implications.map((s, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                        <Heart className="h-3 w-3" /> Environment
                      </p>
                      <ul className="space-y-0.5">
                        {assessment.environmental_considerations.map((e, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {e}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Safeguarding
                      </p>
                      <ul className="space-y-0.5">
                        {assessment.safeguarding_considerations.map((s, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* conditions */}
                  {assessment.conditions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 text-[--cs-info]">Conditions of Approval</p>
                      <ol className="space-y-1">
                        {assessment.conditions.map((cond, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-xs font-medium bg-[--cs-info-bg] text-[--cs-info] rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            {cond}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* notes */}
                  <div className="bg-muted/30 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{assessment.notes}</p>
                  </div>

                  {/* footer */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Assessed By</p>
                      <p className="text-sm font-medium">{getStaffName(assessment.assessed_by)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="text-sm font-medium">{assessment.assessment_date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Gender</p>
                      <p className="text-sm font-medium">{assessment.referral_gender}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Review</p>
                      <p className="text-sm font-medium">{assessment.review_date ?? "N/A"}</p>
                    </div>
                  </div>
                </FlatListRowDetail>
              )}
            </div>
          );
        })}
      </FlatList>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 bg-slate-50 border border-[var(--cs-border)] rounded-lg p-4">
        <p className="text-sm font-medium text-[var(--cs-text-secondary)] mb-1">Regulatory Context</p>
        <p className="text-xs text-[var(--cs-text-secondary)]">
          Regulation 14 of the Children&apos;s Homes Regulations 2015 requires that before admitting
          a child, the registered person assesses whether the placement is consistent with the
          home&apos;s Statement of Purpose and will not be detrimental to existing children. Quality
          Standard 3 (Protection of Children) requires that the impact of a new admission on the
          existing group is fully assessed. Ofsted&apos;s SCCIF specifically examines matching
          decisions and evidence that children&apos;s needs are compatible. The child&apos;s views
          must be sought (where appropriate) as part of this assessment.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Placement Evidence"
        category="general"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Placement Impact Assessments — impact of new admissions on existing residents, group dynamics, risk assessment, compatibility, safeguarding considerations, Reg 45 evidence"
        recordType="placement_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
