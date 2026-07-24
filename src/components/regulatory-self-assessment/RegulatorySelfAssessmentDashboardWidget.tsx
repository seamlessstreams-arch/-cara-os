// ══════════════════════════════════════════════════════════════════════════════
// RegulatorySelfAssessmentDashboardWidget — Compliance self-assessment card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";
import { formatRate } from "@/lib/metrics/rate";

// ── Local Interfaces ────────────────────────────────────────────────────────

interface AreaBreakdown {
  area: string;
  complianceLevel: string;
  evidenceCount: number;
  hasActions: boolean;
  actionCompletionRate: number;
  feedbackCount: number;
  feedbackAddressedRate: number;
}

interface RegulatoryLink {
  reference: string;
  title: string;
  relevance: string;
}

interface Analysis {
  homeId: string;
  overallScore: number;
  overallRating: string;
  assessmentCoverageScore: number;
  complianceQualityScore: number;
  evidenceQualityScore: number;
  actionManagementScore: number;
  regulationsAssessedCount: number;
  regulationsAssessedRate: number;
  averageComplianceLevel: number;
  averageEvidenceSourcesPerAssessment: number;
  actionCompletionRate: number;
  externalFeedbackIntegrationRate: number | null;
  areaBreakdown: AreaBreakdown[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: RegulatoryLink[];
}

interface CriticalAction {
  id: string;
  regulationArea: string;
  action: string;
  responsible: string;
  priority: string;
  dueDate: string;
  status: string;
}

interface OverdueAction {
  id: string;
  regulationArea: string;
  action: string;
  responsible: string;
  dueDate: string;
  status: string;
}

interface UnaddressedFeedback {
  id: string;
  source: string;
  regulationArea: string;
  feedback: string;
}

interface DashboardData {
  analysis: Analysis;
  criticalActions: CriticalAction[];
  overdueActions: OverdueAction[];
  unaddressedFeedback: UnaddressedFeedback[];
}

interface Props {
  homeId?: string;
}

// ── Labels ──────────────────────────────────────────────────────────────────

const AREA_LABELS: Record<string, string> = {
  quality_of_care: "Quality of Care",
  children_views: "Children's Views",
  education: "Education",
  health: "Health",
  positive_relationships: "Positive Relationships",
  protection: "Protection",
  behaviour_management: "Behaviour Mgmt",
  leadership: "Leadership",
  staffing: "Staffing",
  premises: "Premises",
  notifiable_events: "Notifiable Events",
  complaints: "Complaints",
  review_monitoring: "Review & Monitoring",
  records: "Records",
  statement_of_purpose: "Statement of Purpose",
};

const COMPLIANCE_STYLES: Record<string, string> = {
  fully_compliant: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  mostly_compliant: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  partially_compliant: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  non_compliant: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  not_assessed: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const COMPLIANCE_SHORT: Record<string, string> = {
  fully_compliant: "Full",
  mostly_compliant: "Mostly",
  partially_compliant: "Partial",
  non_compliant: "Non",
  not_assessed: "N/A",
};

const RATING_STYLES: Record<string, string> = {
  outstanding: "text-emerald-600 dark:text-emerald-400",
  good: "text-blue-600 dark:text-blue-400",
  requires_improvement: "text-amber-600 dark:text-amber-400",
  inadequate: "text-red-600 dark:text-red-400",
};

const RATING_LABELS: Record<string, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// ── Component ───────────────────────────────────────────────────────────────

export function RegulatorySelfAssessmentDashboardWidget({
  homeId = "oak-house",
}: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/regulatory-self-assessment?homeId=${homeId}`);
      const json = await res.json();
      setData(json);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
        <div className="h-4 w-48 bg-muted rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { analysis, criticalActions, overdueActions, unaddressedFeedback } = data;
  const assessed = analysis.areaBreakdown.filter(
    (a) => a.complianceLevel !== "not_assessed",
  );
  const nonCompliant = analysis.areaBreakdown.filter(
    (a) => a.complianceLevel === "non_compliant",
  );
  const partiallyCompliant = analysis.areaBreakdown.filter(
    (a) => a.complianceLevel === "partially_compliant",
  );

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Regulatory Self-Assessment</h3>
              <p className="text-xs text-muted-foreground">
                Reg 45 — Review of Quality of Care
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{Math.round(analysis.overallScore)}</p>
            <p className="text-[10px] text-muted-foreground">/ 100</p>
          </div>
        </div>
      </div>

      {/* Overall Rating */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Overall Rating</span>
          <span
            className={`text-sm font-bold ${RATING_STYLES[analysis.overallRating] ?? ""}`}
          >
            {RATING_LABELS[analysis.overallRating] ?? analysis.overallRating}
          </span>
        </div>
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              analysis.overallScore >= 80
                ? "bg-emerald-500"
                : analysis.overallScore >= 60
                  ? "bg-blue-500"
                  : analysis.overallScore >= 40
                    ? "bg-amber-500"
                    : "bg-red-500"
            }`}
            style={{ width: `${Math.min(analysis.overallScore, 100)}%` }}
          />
        </div>
      </div>

      {/* Alerts */}
      {(criticalActions.length > 0 ||
        overdueActions.length > 0 ||
        nonCompliant.length > 0) && (
        <div className="px-4 py-2.5 border-b border-border bg-red-50/50 dark:bg-red-900/10">
          {nonCompliant.length > 0 && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-medium text-red-700 dark:text-red-400">
                {nonCompliant.length} non-compliant area
                {nonCompliant.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
          {criticalActions.length > 0 && (
            <p className="text-[10px] text-red-600 dark:text-red-400">
              {criticalActions.length} critical action
              {criticalActions.length > 1 ? "s" : ""} pending
            </p>
          )}
          {overdueActions.length > 0 && (
            <p className="text-[10px] text-red-600 dark:text-red-400">
              {overdueActions.length} overdue action
              {overdueActions.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      {/* Score Breakdown */}
      <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
        <div className="p-2.5 text-center">
          <p className="text-sm font-bold">
            {Math.round(analysis.assessmentCoverageScore)}
          </p>
          <p className="text-[9px] text-muted-foreground">Coverage</p>
        </div>
        <div className="p-2.5 text-center">
          <p className="text-sm font-bold">
            {Math.round(analysis.complianceQualityScore)}
          </p>
          <p className="text-[9px] text-muted-foreground">Compliance</p>
        </div>
        <div className="p-2.5 text-center">
          <p className="text-sm font-bold">
            {Math.round(analysis.evidenceQualityScore)}
          </p>
          <p className="text-[9px] text-muted-foreground">Evidence</p>
        </div>
        <div className="p-2.5 text-center">
          <p className="text-sm font-bold">
            {Math.round(analysis.actionManagementScore)}
          </p>
          <p className="text-[9px] text-muted-foreground">Actions</p>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {analysis.regulationsAssessedCount}/15
          </p>
          <p className="text-[10px] text-muted-foreground">Areas Assessed</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {analysis.actionCompletionRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">Actions Done</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatRate(analysis.externalFeedbackIntegrationRate)}
          </p>
          <p className="text-[10px] text-muted-foreground">Feedback Addressed</p>
        </div>
      </div>

      {/* Compliance Breakdown */}
      <div className="border-b border-border">
        <div className="px-4 py-2 bg-muted/30">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Regulation Area Compliance
          </p>
        </div>
        <div className="divide-y divide-border max-h-64 overflow-y-auto">
          {analysis.areaBreakdown
            .filter((a) => a.complianceLevel !== "not_assessed")
            .sort((a, b) => {
              const order = [
                "non_compliant",
                "partially_compliant",
                "mostly_compliant",
                "fully_compliant",
              ];
              return order.indexOf(a.complianceLevel) - order.indexOf(b.complianceLevel);
            })
            .map((area) => (
              <div
                key={area.area}
                className="px-4 py-2 flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">
                    {AREA_LABELS[area.area] ?? area.area}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {area.evidenceCount} evidence
                    </span>
                    {area.hasActions && (
                      <span className="text-[10px] text-muted-foreground">
                        {area.actionCompletionRate}% actions done
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${COMPLIANCE_STYLES[area.complianceLevel] ?? ""}`}
                >
                  {COMPLIANCE_SHORT[area.complianceLevel] ?? area.complianceLevel}
                </span>
              </div>
            ))}
        </div>
        {analysis.areaBreakdown.filter((a) => a.complianceLevel === "not_assessed")
          .length > 0 && (
          <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/20">
            <p className="text-[10px] text-muted-foreground">
              {
                analysis.areaBreakdown.filter(
                  (a) => a.complianceLevel === "not_assessed",
                ).length
              }{" "}
              area
              {analysis.areaBreakdown.filter(
                (a) => a.complianceLevel === "not_assessed",
              ).length > 1
                ? "s"
                : ""}{" "}
              not yet assessed
            </p>
          </div>
        )}
      </div>

      {/* Partially compliant highlight */}
      {partiallyCompliant.length > 0 && (
        <div className="px-4 py-2.5 border-b border-border bg-amber-50/50 dark:bg-amber-900/10">
          <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400 mb-1">
            Partially Compliant — Action Needed
          </p>
          {partiallyCompliant.map((a) => (
            <p key={a.area} className="text-[10px] text-amber-600 dark:text-amber-400">
              {AREA_LABELS[a.area] ?? a.area}
            </p>
          ))}
        </div>
      )}

      {/* Unaddressed Feedback */}
      {unaddressedFeedback.length > 0 && (
        <div className="border-b border-border">
          <div className="px-4 py-2 bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Unaddressed Feedback
              </p>
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                {unaddressedFeedback.length}
              </span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {unaddressedFeedback.slice(0, 3).map((fb) => (
              <div key={fb.id} className="px-4 py-2">
                <p className="text-xs text-foreground line-clamp-1">
                  {fb.feedback}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {fb.source} &mdash;{" "}
                  {AREA_LABELS[fb.regulationArea] ?? fb.regulationArea}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Stats */}
      <div className="px-4 py-2.5 border-b border-border">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Avg evidence sources</span>
          <span className="font-medium">
            {analysis.averageEvidenceSourcesPerAssessment}
          </span>
        </div>
        <div className="flex justify-between text-[10px] mt-1">
          <span className="text-muted-foreground">Avg compliance level</span>
          <span className="font-medium">
            {analysis.averageComplianceLevel}%
          </span>
        </div>
        <div className="flex justify-between text-[10px] mt-1">
          <span className="text-muted-foreground">Assessment coverage</span>
          <span
            className={`font-medium ${analysis.regulationsAssessedRate < 80 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}
          >
            {analysis.regulationsAssessedRate}%
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 text-center">
        <a
          href="/ri/scorecard"
          className="text-xs text-primary font-medium hover:underline"
        >
          View full self-assessment report →
        </a>
      </div>
    </div>
  );
}
