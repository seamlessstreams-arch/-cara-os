"use client";

import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface HandoverQualityData {
  totalRecords: number;
  allChildrenCoveredRate: number;
  medicationStatusUpdatedRate: number;
  incidentsCommunicatedRate: number;
  tasksHandedOverRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface HandoverComplianceData {
  totalRecords: number;
  documentationRate: number;
  timelyRecordingRate: number;
  allChildrenCoveredRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface HandoverPolicyData {
  handoverPolicy: boolean;
  shiftHandoverProcedure: boolean;
  medicationHandoverProtocol: boolean;
  incidentCommunicationPolicy: boolean;
  taskTrackingProcedure: boolean;
  handoverRecordKeeping: boolean;
  handoverAuditPolicy: boolean;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface StaffReadinessData {
  totalStaff: number;
  handoverCommunicationRate: number;
  medicationHandoverSkillsRate: number;
  incidentReportingRate: number;
  taskPrioritisationRate: number;
  childStatusAssessmentRate: number;
  handoverDocumentationRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

interface ChildHandoverProfileData {
  childId: string;
  childName: string;
  totalRecords: number;
  allChildrenCoveredRate: number;
  medicationStatusUpdatedRate: number;
  uniqueCategories: number;
  handoverScore: number;
}

interface HandoverData {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  handoverQuality: HandoverQualityData;
  handoverCompliance: HandoverComplianceData;
  handoverPolicy: HandoverPolicyData;
  staffReadiness: StaffReadinessData;
  childProfiles: ChildHandoverProfileData[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta: {
    generatedAt: string;
    engine: string;
    version: string;
  };
}

// ── Rating colours ────────────────────────────────────────────────────────

function ratingColour(rating: string): string {
  switch (rating) {
    case "outstanding": return "bg-green-100 text-green-800 border-green-300";
    case "good": return "bg-blue-100 text-blue-800 border-blue-300";
    case "requires_improvement": return "bg-amber-100 text-amber-800 border-amber-300";
    case "inadequate": return "bg-red-100 text-red-800 border-red-300";
    default: return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

function ratingLabel(rating: string): string {
  switch (rating) {
    case "outstanding": return "Outstanding";
    case "good": return "Good";
    case "requires_improvement": return "Requires Improvement";
    case "inadequate": return "Inadequate";
    default: return rating;
  }
}

function scoreBarColour(score: number, max: number): string {
  const pct = max > 0 ? (score / max) * 100 : 0;
  if (pct >= 80) return "bg-green-500";
  if (pct >= 60) return "bg-blue-500";
  if (pct >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function rateTextColour(rate: number): string {
  if (rate >= 80) return "text-green-600";
  if (rate >= 60) return "text-amber-600";
  return "text-red-600";
}

// ── Main Widget ──────────────────────────────────────────────────────────

export default function HandoverDashboardWidget() {
  const [data, setData] = useState<HandoverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/handover")
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((json) => setData(json.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6">
        <div className="h-6 w-48 rounded bg-gray-200 mb-4" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="font-semibold text-red-800">Handover Intelligence</h3>
        <p className="mt-2 text-sm text-red-600">Failed to load: {error}</p>
      </div>
    );
  }

  const toggle = (section: string) =>
    setExpandedSection((prev) => (prev === section ? null : section));

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Handover Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd} -- Engine v{data.meta.version}
          </p>
        </div>
        <span className={"inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold " + ratingColour(data.rating)}>
          {ratingLabel(data.rating)} -- {data.overallScore}/100
        </span>
      </div>

      {/* 4 Evaluator Scores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Quality", score: data.handoverQuality.score },
          { label: "Compliance", score: data.handoverCompliance.score },
          { label: "Policy", score: data.handoverPolicy.score },
          { label: "Staff Readiness", score: data.staffReadiness.score },
        ].map((layer) => (
          <div key={layer.label} className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <span className={"text-2xl font-bold " + rateTextColour((layer.score / 25) * 100)}>
              {layer.score}
            </span>
            <span className="text-xs text-gray-500 text-center mt-1">{layer.label} /25</span>
            <div className="w-full h-1.5 rounded-full bg-gray-200 mt-2 overflow-hidden">
              <div
                className={"h-full rounded-full " + scoreBarColour(layer.score, 25)}
                style={{ width: ((layer.score / 25) * 100) + "%" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Quality Indicators */}
      <div className="mb-5">
        <button
          onClick={() => toggle("quality")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={"transform transition-transform " + (expandedSection === "quality" ? "rotate-90" : "")}>{">"}</span>
          Quality Indicators
        </button>
        {expandedSection === "quality" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            {[
              { label: "All Children Covered", value: data.handoverQuality.allChildrenCoveredRate },
              { label: "Medication Status Updated", value: data.handoverQuality.medicationStatusUpdatedRate },
              { label: "Incidents Communicated", value: data.handoverQuality.incidentsCommunicatedRate },
              { label: "Tasks Handed Over", value: data.handoverQuality.tasksHandedOverRate },
            ].map((indicator) => (
              <div key={indicator.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{indicator.label}</span>
                  <span className={"text-xs font-medium " + rateTextColour(indicator.value)}>{indicator.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={"h-full rounded-full " + scoreBarColour(indicator.value, 100)}
                    style={{ width: indicator.value + "%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compliance Indicators */}
      <div className="mb-5">
        <button
          onClick={() => toggle("compliance")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={"transform transition-transform " + (expandedSection === "compliance" ? "rotate-90" : "")}>{">"}</span>
          Compliance Indicators
        </button>
        {expandedSection === "compliance" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            {[
              { label: "Documentation Complete", value: data.handoverCompliance.documentationRate },
              { label: "Timely Recording", value: data.handoverCompliance.timelyRecordingRate },
              { label: "All Children Covered", value: data.handoverCompliance.allChildrenCoveredRate },
            ].map((indicator) => (
              <div key={indicator.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{indicator.label}</span>
                  <span className={"text-xs font-medium " + rateTextColour(indicator.value)}>{indicator.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={"h-full rounded-full " + scoreBarColour(indicator.value, 100)}
                    style={{ width: indicator.value + "%" }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t text-sm text-gray-600">
              Category Diversity: {data.handoverCompliance.uniqueCategories}/8 categories ({Math.round(data.handoverCompliance.categoryDiversityRatio * 100)}%)
            </div>
          </div>
        )}
      </div>

      {/* Policy Framework */}
      <div className="mb-5">
        <button
          onClick={() => toggle("policy")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={"transform transition-transform " + (expandedSection === "policy" ? "rotate-90" : "")}>{">"}</span>
          Policy Framework ({data.handoverPolicy.score}/25)
        </button>
        {expandedSection === "policy" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-2">
            {[
              { label: "Handover Policy", value: data.handoverPolicy.handoverPolicy },
              { label: "Shift Handover Procedure", value: data.handoverPolicy.shiftHandoverProcedure },
              { label: "Medication Handover Protocol", value: data.handoverPolicy.medicationHandoverProtocol },
              { label: "Incident Communication Policy", value: data.handoverPolicy.incidentCommunicationPolicy },
              { label: "Task Tracking Procedure", value: data.handoverPolicy.taskTrackingProcedure },
              { label: "Handover Record Keeping", value: data.handoverPolicy.handoverRecordKeeping },
              { label: "Handover Audit Policy", value: data.handoverPolicy.handoverAuditPolicy },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-700">{item.label}</span>
                <span className={"text-xs font-semibold " + (item.value ? "text-green-600" : "text-red-600")}>
                  {item.value ? "YES" : "NO"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Staff Readiness */}
      <div className="mb-5">
        <button
          onClick={() => toggle("staff")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={"transform transition-transform " + (expandedSection === "staff" ? "rotate-90" : "")}>{">"}</span>
          Staff Readiness ({data.staffReadiness.totalStaff} staff)
        </button>
        {expandedSection === "staff" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            {[
              { label: "Handover Communication", value: data.staffReadiness.handoverCommunicationRate },
              { label: "Medication Handover Skills", value: data.staffReadiness.medicationHandoverSkillsRate },
              { label: "Incident Reporting", value: data.staffReadiness.incidentReportingRate },
              { label: "Task Prioritisation", value: data.staffReadiness.taskPrioritisationRate },
              { label: "Child Status Assessment", value: data.staffReadiness.childStatusAssessmentRate },
              { label: "Handover Documentation", value: data.staffReadiness.handoverDocumentationRate },
            ].map((skill) => (
              <div key={skill.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{skill.label}</span>
                  <span className={"text-xs font-medium " + rateTextColour(skill.value)}>{skill.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={"h-full rounded-full " + scoreBarColour(skill.value, 100)}
                    style={{ width: skill.value + "%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Child Profiles */}
      {data.childProfiles.length > 0 && (
        <div className="mb-5">
          <button
            onClick={() => toggle("children")}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className={"transform transition-transform " + (expandedSection === "children" ? "rotate-90" : "")}>{">"}</span>
            Child Profiles ({data.childProfiles.length})
          </button>
          {expandedSection === "children" && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{child.childName}</h4>
                    <span className={"text-lg font-bold " + rateTextColour(child.handoverScore * 10)}>
                      {child.handoverScore}/10
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Records</span>
                      <span className="font-medium text-gray-900">{child.totalRecords}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Children Covered</span>
                      <span className={"font-medium " + rateTextColour(child.allChildrenCoveredRate)}>{child.allChildrenCoveredRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medication Updated</span>
                      <span className={"font-medium " + rateTextColour(child.medicationStatusUpdatedRate)}>{child.medicationStatusUpdatedRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Categories</span>
                      <span className="font-medium text-gray-900">{child.uniqueCategories}/8</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Strengths / Areas / Actions */}
      <div className="space-y-4 mb-5">
        {data.actions.length > 0 && !data.actions[0].includes("No immediate") && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Immediate Actions</h4>
            <ul className="space-y-1">
              {data.actions.map((action, i) => (
                <li key={i} className="text-sm text-red-700">{action}</li>
              ))}
            </ul>
          </div>
        )}

        {data.strengths.length > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
            <ul className="space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-sm text-green-700">{s}</li>
              ))}
            </ul>
          </div>
        )}

        {data.areasForImprovement.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h4 className="text-sm font-semibold text-amber-800 mb-2">Areas for Improvement</h4>
            <ul className="space-y-1">
              {data.areasForImprovement.map((a, i) => (
                <li key={i} className="text-sm text-amber-700">{a}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Regulatory Framework */}
      <div>
        <button
          onClick={() => toggle("regulatory")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={"transform transition-transform " + (expandedSection === "regulatory" ? "rotate-90" : "")}>{">"}</span>
          Regulatory Framework ({data.regulatoryLinks.length})
        </button>
        {expandedSection === "regulatory" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            <ul className="space-y-1">
              {data.regulatoryLinks.map((link, i) => (
                <li key={i} className="text-xs text-gray-600">{link}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
