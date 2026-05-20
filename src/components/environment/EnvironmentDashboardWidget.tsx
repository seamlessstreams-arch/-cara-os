"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT DASHBOARD WIDGET
//
// Displays the 4-layer environment intelligence:
// - Overall score with rating
// - Layer scores: quality, compliance, policy, staff readiness
// - Child environment profiles
// - Strengths, areas for improvement, and actions
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface EnvironmentQualityData {
  totalRecords: number;
  adequateRate: number;
  childInvolvedRate: number;
  documentedRate: number;
  childFeedbackSoughtRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface EnvironmentComplianceData {
  totalRecords: number;
  actionTakenRate: number;
  timelyCompletionRate: number;
  adequateRate: number;
  categoryDiversityRate: number;
  uniqueCategories: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface EnvironmentPolicyData {
  environmentPolicy: boolean;
  bedroomStandards: boolean;
  communalSpaceGuidelines: boolean;
  outdoorAreaMaintenance: boolean;
  healthSafetyCompliance: boolean;
  accessibilityPlan: boolean;
  regularInspectionSchedule: boolean;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface StaffReadinessData {
  totalStaff: number;
  environmentalAwarenessRate: number;
  healthSafetyKnowledgeRate: number;
  maintenanceSkillsRate: number;
  childParticipationRate: number;
  riskAssessmentRate: number;
  infectionControlRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface ChildEnvironmentProfileData {
  childId: string;
  childName: string;
  totalRecords: number;
  adequateRate: number;
  childInvolvedRate: number;
  uniqueCategories: number;
  environmentScore: number;
}

interface EnvironmentData {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  environmentQuality: EnvironmentQualityData;
  environmentCompliance: EnvironmentComplianceData;
  environmentPolicy: EnvironmentPolicyData;
  staffReadiness: StaffReadinessData;
  childProfiles: ChildEnvironmentProfileData[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Inline Components ─────────────────────────────────────────────────────

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pctVal = max > 0 ? Math.round((score / max) * 100) : 0;
  const colour =
    pctVal >= 80 ? "bg-green-500" : pctVal >= 60 ? "bg-amber-500" : pctVal >= 40 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-slate-500">{score}/{max}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${colour}`} style={{ width: `${pctVal}%` }} />
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <span className="text-sm font-medium text-slate-700">{title}</span>
        <span className="text-slate-400 text-xs">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-700">{String(value)}</span>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getRatingColour(rating: string): string {
  switch (rating) {
    case "outstanding": return "text-green-600";
    case "good": return "text-amber-600";
    case "requires_improvement": return "text-orange-600";
    case "inadequate": return "text-red-600";
    default: return "text-slate-600";
  }
}

function getRatingBg(rating: string): string {
  switch (rating) {
    case "outstanding": return "bg-green-50 border-green-200";
    case "good": return "bg-amber-50 border-amber-200";
    case "requires_improvement": return "bg-orange-50 border-orange-200";
    case "inadequate": return "bg-red-50 border-red-200";
    default: return "bg-slate-50 border-slate-200";
  }
}

function formatRating(rating: string): string {
  return rating.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function getScoreColour(score: number, max: number): string {
  const pctVal = max > 0 ? (score / max) * 100 : 0;
  if (pctVal >= 80) return "text-green-600";
  if (pctVal >= 60) return "text-amber-600";
  return "text-red-600";
}

// ── Main Component ────────────────────────────────────────────────────────

export default function EnvironmentDashboardWidget() {
  const [data, setData] = useState<EnvironmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/environment")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch environment data");
        return res.json();
      })
      .then((json) => setData(json.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-64 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-lg" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-3/4 bg-slate-100 rounded" />
          <div className="h-4 w-1/2 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-700 text-sm font-medium">Error loading environment data</p>
        <p className="text-red-600 text-xs mt-1">{error}</p>
      </div>
    );
  }

  // Null guard
  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-slate-500 text-sm">No environment data available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Environment</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Premises quality, safety, personalisation, and maintenance
          </p>
        </div>
        <div className={`text-right px-4 py-2 rounded-lg border ${getRatingBg(data.rating)}`}>
          <p className={`text-2xl font-bold ${getRatingColour(data.rating)}`}>
            {data.overallScore}
          </p>
          <p className={`text-xs font-medium ${getRatingColour(data.rating)}`}>
            {formatRating(data.rating)}
          </p>
        </div>
      </div>

      {/* 4 Evaluator Score Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScoreBar label="Environment Quality" score={data.environmentQuality.score} max={25} />
        <ScoreBar label="Environment Compliance" score={data.environmentCompliance.score} max={25} />
        <ScoreBar label="Environment Policy" score={data.environmentPolicy.score} max={25} />
        <ScoreBar label="Staff Readiness" score={data.staffReadiness.score} max={25} />
      </div>

      {/* Environment Quality Section */}
      <Section title="Environment Quality" defaultOpen>
        <Stat label="Total Records" value={data.environmentQuality.totalRecords} />
        <Stat label="Adequate Rate" value={data.environmentQuality.adequateRate + "%"} />
        <Stat label="Child Involved Rate" value={data.environmentQuality.childInvolvedRate + "%"} />
        <Stat label="Documented Rate" value={data.environmentQuality.documentedRate + "%"} />
        <Stat label="Child Feedback Sought" value={data.environmentQuality.childFeedbackSoughtRate + "%"} />
      </Section>

      {/* Environment Compliance Section */}
      <Section title="Environment Compliance">
        <Stat label="Action Taken Rate" value={data.environmentCompliance.actionTakenRate + "%"} />
        <Stat label="Timely Completion Rate" value={data.environmentCompliance.timelyCompletionRate + "%"} />
        <Stat label="Adequate Rate" value={data.environmentCompliance.adequateRate + "%"} />
        <Stat label="Category Coverage" value={data.environmentCompliance.uniqueCategories + "/8"} />
      </Section>

      {/* Environment Policy Section */}
      <Section title="Environment Policy">
        <Stat label="Environment Policy" value={data.environmentPolicy.environmentPolicy ? "Yes" : "No"} />
        <Stat label="Bedroom Standards" value={data.environmentPolicy.bedroomStandards ? "Yes" : "No"} />
        <Stat label="Communal Space Guidelines" value={data.environmentPolicy.communalSpaceGuidelines ? "Yes" : "No"} />
        <Stat label="Outdoor Area Maintenance" value={data.environmentPolicy.outdoorAreaMaintenance ? "Yes" : "No"} />
        <Stat label="Health & Safety Compliance" value={data.environmentPolicy.healthSafetyCompliance ? "Yes" : "No"} />
        <Stat label="Accessibility Plan" value={data.environmentPolicy.accessibilityPlan ? "Yes" : "No"} />
        <Stat label="Regular Inspection Schedule" value={data.environmentPolicy.regularInspectionSchedule ? "Yes" : "No"} />
      </Section>

      {/* Staff Readiness Section */}
      <Section title="Staff Readiness">
        <Stat label="Total Staff Trained" value={data.staffReadiness.totalStaff} />
        <Stat label="Environmental Awareness" value={data.staffReadiness.environmentalAwarenessRate + "%"} />
        <Stat label="Health & Safety Knowledge" value={data.staffReadiness.healthSafetyKnowledgeRate + "%"} />
        <Stat label="Maintenance Skills" value={data.staffReadiness.maintenanceSkillsRate + "%"} />
        <Stat label="Child Participation" value={data.staffReadiness.childParticipationRate + "%"} />
        <Stat label="Risk Assessment" value={data.staffReadiness.riskAssessmentRate + "%"} />
        <Stat label="Infection Control" value={data.staffReadiness.infectionControlRate + "%"} />
      </Section>

      {/* Child Environment Profiles */}
      {data.childProfiles.length > 0 && (
        <Section title="Child Environment Profiles">
          <div className="space-y-3">
            {data.childProfiles.map((child) => (
              <div
                key={child.childId}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{child.childName}</p>
                  <p className="text-xs text-slate-500">
                    {child.totalRecords} records, {child.uniqueCategories} categories, {child.adequateRate}% adequate, {child.childInvolvedRate}% involved
                  </p>
                </div>
                <div className={`text-lg font-bold ${getScoreColour(child.environmentScore, 10)}`}>
                  {child.environmentScore}/10
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Strengths */}
      {data.strengths.length > 0 && (
        <Section title="Strengths">
          <ul className="space-y-1.5">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0 text-green-500">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Areas for Improvement */}
      {data.areasForImprovement.length > 0 && (
        <Section title="Areas for Improvement">
          <ul className="space-y-1.5">
            {data.areasForImprovement.map((a, i) => (
              <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0 text-amber-500">-</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Actions */}
      {data.actions.length > 0 && (
        <Section title="Actions">
          <ul className="space-y-1.5">
            {data.actions.map((a, i) => (
              <li key={i} className={`text-xs flex items-start gap-1.5 ${
                a.startsWith("URGENT") ? "text-red-700" :
                a.startsWith("HIGH") ? "text-orange-700" :
                a.startsWith("MEDIUM") ? "text-amber-700" :
                "text-slate-600"
              }`}>
                <span className="mt-0.5 shrink-0">*</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Regulatory Links */}
      {data.regulatoryLinks.length > 0 && (
        <Section title="Regulatory References">
          <ul className="space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li key={i} className="text-xs text-slate-500">{link}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          Period: {data.periodStart} to {data.periodEnd}
        </span>
        <span className="text-xs text-slate-400">
          Reg 12 &middot; Reg 13 &middot; Reg 25 CHR 2015
        </span>
      </div>
    </div>
  );
}
