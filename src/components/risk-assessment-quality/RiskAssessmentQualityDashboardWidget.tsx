"use client";

// ══════════════════════════════════════════════════════════════════════════════
// RISK ASSESSMENT QUALITY DASHBOARD WIDGET
//
// Displays the 4-layer risk assessment quality intelligence:
// - Overall score with rating
// - Layer scores: quality, compliance, policy, staff readiness
// - Child risk profiles
// - Strengths, areas for improvement, and actions
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { formatRate } from "@/lib/metrics/rate";
import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface RiskQuality {
  overallScore: number;
  totalAssessments: number;
  mitigationRate: number;
  childConsultedRate: number;
  reviewScheduledRate: number;
  comprehensiveRate: number;
}

interface RiskCompliance {
  overallScore: number;
  documentedRate: number;
  staffAwareRate: number;
  feedbackRate: number;
  riskCategoryDiversityRatio: number;
}

interface RiskPolicy {
  overallScore: number;
  riskManagementFramework: boolean;
  dynamicAssessmentProcedure: boolean;
  positiveRiskTakingPolicy: boolean;
  incidentResponseProtocol: boolean;
  multiAgencyRiskSharing: boolean;
  staffRiskTrainingRequirement: boolean;
  regularReview: boolean;
}

interface StaffRiskReadiness {
  overallScore: number;
  totalStaff: number;
  riskIdentificationRate: number;
  mitigationPlanningRate: number;
  dynamicRiskAssessmentRate: number;
  positiveRiskTakingRate: number;
  incidentManagementRate: number;
  multiAgencyWorkingRate: number;
}

interface ChildProfile {
  childId: string;
  childName: string;
  totalAssessments: number;
  mitigationRate: number;
  consultedRate: number;
  overallScore: number;
}

interface RiskAssessmentQualityData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  riskQuality: RiskQuality;
  riskCompliance: RiskCompliance;
  riskPolicy: RiskPolicy;
  staffRiskReadiness: StaffRiskReadiness;
  childProfiles: ChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    assessmentSummary: { id: string; date: string; child: string; category: string; level: string }[];
    ratingLabel: string;
  };
}

// ── Rating Badge ───────────────────────────────────────────────────────────

function RatingBadge({ score, rating }: { score: number; rating: string }) {
  const colorClass =
    rating === "outstanding"
      ? "bg-green-100 text-green-800 border-green-300"
      : rating === "good"
        ? "bg-blue-100 text-blue-800 border-blue-300"
        : rating === "requires_improvement"
          ? "bg-orange-100 text-orange-800 border-orange-300"
          : "bg-red-100 text-red-800 border-red-300";

  const label =
    rating === "outstanding" ? "Outstanding"
      : rating === "good" ? "Good"
        : rating === "requires_improvement" ? "Requires Improvement"
          : "Inadequate";

  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colorClass}`}>
      <div className="text-3xl font-bold">{score}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
    </div>
  );
}

// ── Layer Score Card ───────────────────────────────────────────────────────

function LayerScoreCard({ label, score, max }: { label: string; score: number; max: number }) {
  const pctVal = Math.round((score / max) * 100);
  const color =
    pctVal >= 80 ? "text-green-700 bg-green-50 border-green-200"
      : pctVal >= 60 ? "text-blue-700 bg-blue-50 border-blue-200"
        : pctVal >= 40 ? "text-orange-700 bg-orange-50 border-orange-200"
          : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className={`rounded-lg border p-3 text-center ${color}`}>
      <div className="text-2xl font-bold">{score}<span className="text-sm font-normal">/{max}</span></div>
      <div className="text-xs font-medium mt-0.5">{label}</div>
    </div>
  );
}

// ── Compliance Gauge ───────────────────────────────────────────────────────

function ComplianceGauge({ label, value }: { label: string; value: number }) {
  const color =
    value >= 90 ? "text-green-700 bg-green-100"
      : value >= 70 ? "text-yellow-700 bg-yellow-100"
        : "text-red-700 bg-red-100";

  return (
    <div className={`rounded-lg p-2.5 text-center ${color}`}>
      <div className="text-xl font-bold">{value}%</div>
      <div className="text-[10px] font-medium mt-0.5">{label}</div>
    </div>
  );
}

// ── Policy Item ────────────────────────────────────────────────────────────

function PolicyItem({ label, met }: { label: string; met: boolean }) {
  return (
    <div className={`flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0`}>
      <span className={`text-xs font-medium ${met ? "text-green-600" : "text-red-600"}`}>
        {met ? "Yes" : "No"}
      </span>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
}

// ── Child Profile Row ─────────────────────────────────────────────────────

function ChildProfileRow({ profile }: { profile: ChildProfile }) {
  const scoreColor =
    profile.overallScore >= 8 ? "bg-green-100 text-green-700"
      : profile.overallScore >= 5 ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{profile.childName}</span>
        </div>
        <div className="flex gap-3 text-[10px] text-gray-400 mt-0.5">
          <span>Assessments: {profile.totalAssessments}</span>
          <span>Mitigation: {formatRate(profile.mitigationRate)}</span>
          <span>Consulted: {formatRate(profile.consultedRate)}</span>
        </div>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${scoreColor}`}>
        {profile.overallScore}/10
      </span>
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function RiskAssessmentQualityDashboardWidget() {
  const [data, setData] = useState<RiskAssessmentQualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"quality" | "compliance" | "policy" | "staff" | "children">("quality");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/risk-assessment-quality");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-20 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Risk Assessment Quality</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Risk Assessment Quality
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.riskQuality.totalAssessments} assessments | {data.staffRiskReadiness.totalStaff} staff
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* 4 Layer Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <LayerScoreCard label="Quality" score={data.riskQuality.overallScore} max={25} />
        <LayerScoreCard label="Compliance" score={data.riskCompliance.overallScore} max={25} />
        <LayerScoreCard label="Policy" score={data.riskPolicy.overallScore} max={25} />
        <LayerScoreCard label="Staff Readiness" score={data.staffRiskReadiness.overallScore} max={25} />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <ComplianceGauge label="Mitigation" value={data.riskQuality.mitigationRate} />
        <ComplianceGauge label="Consulted" value={data.riskQuality.childConsultedRate} />
        <ComplianceGauge label="Documented" value={data.riskCompliance.documentedRate} />
        <ComplianceGauge label="Staff Aware" value={data.riskCompliance.staffAwareRate} />
        <ComplianceGauge label="Comprehensive" value={data.riskQuality.comprehensiveRate} />
        <ComplianceGauge label="Feedback" value={data.riskCompliance.feedbackRate} />
      </div>

      {/* Urgent Actions */}
      {data.actions.length > 0 &&
        !data.actions[0].startsWith("No immediate actions") && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Actions Required</h4>
            <ul className="space-y-1">
              {data.actions.slice(0, 4).map((action, i) => (
                <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT") ? "●" : action.startsWith("HIGH") ? "○" : "▪"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Expandable Detail Tabs */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details" : "Show detailed breakdown"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Tab Navigation */}
          <div className="flex gap-1 border-b border-gray-200">
            {([
              ["quality", "Quality"],
              ["compliance", "Compliance"],
              ["policy", "Policy"],
              ["staff", "Staff"],
              ["children", "Children"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
                  activeTab === key
                    ? "bg-white border border-b-white border-gray-200 text-gray-900 -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Quality Tab */}
          {activeTab === "quality" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge label="Mitigation Plans" value={data.riskQuality.mitigationRate} />
                <ComplianceGauge label="Child Consulted" value={data.riskQuality.childConsultedRate} />
                <ComplianceGauge label="Review Scheduled" value={data.riskQuality.reviewScheduledRate} />
                <ComplianceGauge label="Comprehensive" value={data.riskQuality.comprehensiveRate} />
              </div>
              <div className="p-2 bg-gray-50 rounded text-center">
                <div className="text-lg font-bold text-gray-700">{data.riskQuality.totalAssessments}</div>
                <div className="text-[10px] text-gray-500 uppercase">Total Assessments</div>
              </div>
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === "compliance" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ComplianceGauge label="Documented" value={data.riskCompliance.documentedRate} />
                <ComplianceGauge label="Staff Aware" value={data.riskCompliance.staffAwareRate} />
                <ComplianceGauge label="Feedback Given" value={data.riskCompliance.feedbackRate} />
                <div className="rounded-lg p-2.5 text-center bg-gray-100 text-gray-700">
                  <div className="text-xl font-bold">{data.riskCompliance.riskCategoryDiversityRatio}</div>
                  <div className="text-[10px] font-medium mt-0.5">Diversity Ratio</div>
                </div>
              </div>
            </div>
          )}

          {/* Policy Tab */}
          {activeTab === "policy" && (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <PolicyItem label="Risk Management Framework" met={data.riskPolicy.riskManagementFramework} />
                <PolicyItem label="Dynamic Assessment Procedure" met={data.riskPolicy.dynamicAssessmentProcedure} />
                <PolicyItem label="Positive Risk-Taking Policy" met={data.riskPolicy.positiveRiskTakingPolicy} />
                <PolicyItem label="Incident Response Protocol" met={data.riskPolicy.incidentResponseProtocol} />
                <PolicyItem label="Multi-Agency Risk Sharing" met={data.riskPolicy.multiAgencyRiskSharing} />
                <PolicyItem label="Staff Risk Training Requirement" met={data.riskPolicy.staffRiskTrainingRequirement} />
                <PolicyItem label="Regular Review" met={data.riskPolicy.regularReview} />
              </div>
              <div className="p-2 bg-gray-50 rounded text-center">
                <div className="text-lg font-bold text-gray-700">{data.riskPolicy.overallScore}/25</div>
                <div className="text-[10px] text-gray-500 uppercase">Policy Score</div>
              </div>
            </div>
          )}

          {/* Staff Tab */}
          {activeTab === "staff" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <ComplianceGauge label="Risk ID" value={data.staffRiskReadiness.riskIdentificationRate} />
                <ComplianceGauge label="Mitigation" value={data.staffRiskReadiness.mitigationPlanningRate} />
                <ComplianceGauge label="Dynamic RA" value={data.staffRiskReadiness.dynamicRiskAssessmentRate} />
                <ComplianceGauge label="Positive RT" value={data.staffRiskReadiness.positiveRiskTakingRate} />
                <ComplianceGauge label="Incident Mgmt" value={data.staffRiskReadiness.incidentManagementRate} />
                <ComplianceGauge label="Multi-Agency" value={data.staffRiskReadiness.multiAgencyWorkingRate} />
              </div>
              <div className="p-2 bg-gray-50 rounded text-center">
                <div className="text-lg font-bold text-gray-700">{data.staffRiskReadiness.totalStaff}</div>
                <div className="text-[10px] text-gray-500 uppercase">Total Staff</div>
              </div>
            </div>
          )}

          {/* Children Tab */}
          {activeTab === "children" && (
            <div className="bg-gray-50 rounded-lg p-3">
              {data.childProfiles.length > 0 ? (
                data.childProfiles.map((profile) => (
                  <ChildProfileRow key={profile.childId} profile={profile} />
                ))
              ) : (
                <p className="text-xs text-gray-500 text-center py-2">No child profiles available</p>
              )}
            </div>
          )}

          {/* Assessment Summary */}
          {activeTab === "quality" && data.meta?.assessmentSummary && (
            <div className="bg-gray-50 rounded-lg p-3">
              {data.meta.assessmentSummary.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium text-sm truncate">{a.child}</span>
                    <span className="text-xs text-gray-400">{a.category}</span>
                    <span className="text-xs text-gray-400">{a.date}</span>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">{a.level}</span>
                </div>
              ))}
            </div>
          )}

          {/* Strengths */}
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-green-700">+ {s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-800 mb-2">Areas for Improvement</h4>
              <ul className="space-y-1">
                {data.areasForImprovement.map((a, i) => (
                  <li key={i} className="text-xs text-orange-700">- {a}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Regulatory Links */}
          {data.regulatoryLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Regulatory References</h4>
              <ul className="space-y-1">
                {data.regulatoryLinks.map((link, i) => (
                  <li key={i} className="text-xs text-gray-600">{link}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
