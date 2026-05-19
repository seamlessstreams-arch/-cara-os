"use client";

import { useState, useEffect } from "react";
import type { DisabilityReasonableAdjustmentsIntelligenceResult } from "@/lib/disability-reasonable-adjustments";

interface ApiResponse {
  data: DisabilityReasonableAdjustmentsIntelligenceResult & {
    meta: {
      disabilityTypeLabels: Record<string, string>;
      adjustmentStatusLabels: Record<string, string>;
      equipmentConditionLabels: Record<string, string>;
      reviewOutcomeLabels: Record<string, string>;
      ratingLabels: Record<string, string>;
    };
  };
}

const ratingColors: Record<string, string> = {
  outstanding: "bg-green-100 text-green-800 border-green-300",
  good: "bg-blue-100 text-blue-800 border-blue-300",
  requires_improvement: "bg-amber-100 text-amber-800 border-amber-300",
  inadequate: "bg-red-100 text-red-800 border-red-300",
};

const ratingLabelsMap: Record<string, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

function ScoreBar({
  label,
  score,
  max = 25,
}: {
  label: string;
  score: number;
  max?: number;
}) {
  const percentage = max > 0 ? Math.round((score / max) * 100) : 0;
  const color =
    percentage >= 80
      ? "bg-green-500"
      : percentage >= 60
        ? "bg-blue-500"
        : percentage >= 40
          ? "bg-amber-500"
          : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-48 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="text-sm font-medium w-14 text-right">
        {score}/{max}
      </span>
    </div>
  );
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

export default function DisabilityReasonableAdjustmentsDashboardWidget() {
  const [data, setData] = useState<ApiResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/disability-reasonable-adjustments")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: ApiResponse) => setData(json.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800">
          Disability &amp; Reasonable Adjustments Intelligence
        </h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  // Null guard
  if (!data) return null;

  const ratingClass = ratingColors[data.rating] || ratingColors.inadequate;
  const ratingLabel = ratingLabelsMap[data.rating] || data.rating;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Disability &amp; Reasonable Adjustments Intelligence
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">
            {data.overallScore}
          </div>
          <span
            className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingClass}`}
          >
            {ratingLabel}
          </span>
        </div>
      </div>

      {/* 4 Score Bars */}
      <div className="space-y-2">
        <ScoreBar
          label="Adjustment Implementation"
          score={data.adjustmentImplementation.overallScore}
        />
        <ScoreBar
          label="Accessibility Compliance"
          score={data.accessibilityCompliance.overallScore}
        />
        <ScoreBar
          label="Equipment Provision"
          score={data.equipmentProvision.overallScore}
        />
        <ScoreBar
          label="Staff Disability Readiness"
          score={data.staffDisabilityReadiness.overallScore}
        />
      </div>

      {/* Expandable Detail Sections */}
      <div className="space-y-3">
        {/* Adjustment Implementation Detail */}
        <CollapsibleSection title="Adjustment Implementation">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Adjustments:</span>{" "}
              <span className="font-medium">
                {data.adjustmentImplementation.totalAdjustments}
              </span>
            </div>
            <div>
              <span className="text-gray-500">In Place:</span>{" "}
              <span className="font-medium">
                {data.adjustmentImplementation.inPlaceCount} (
                {data.adjustmentImplementation.inPlaceRate}%)
              </span>
            </div>
            <div>
              <span className="text-gray-500">Reviews Current:</span>{" "}
              <span className="font-medium">
                {data.adjustmentImplementation.reviewCurrentCount} (
                {data.adjustmentImplementation.reviewCurrentRate}%)
              </span>
            </div>
            <div>
              <span className="text-gray-500">EHCP In Place:</span>{" "}
              <span className="font-medium">
                {data.adjustmentImplementation.ehcpCount} (
                {data.adjustmentImplementation.ehcpRate}%)
              </span>
            </div>
            <div>
              <span className="text-gray-500">Professional Involved:</span>{" "}
              <span className="font-medium">
                {data.adjustmentImplementation.professionalInvolvedCount} (
                {data.adjustmentImplementation.professionalInvolvedRate}%)
              </span>
            </div>
          </div>
        </CollapsibleSection>

        {/* Accessibility Compliance Detail */}
        <CollapsibleSection title="Accessibility Compliance">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Audits:</span>{" "}
              <span className="font-medium">
                {data.accessibilityCompliance.totalAudits}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Physical Access:</span>{" "}
              <span className="font-medium">
                {data.accessibilityCompliance.physicalAccessRate}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Sensory Adaptation:</span>{" "}
              <span className="font-medium">
                {data.accessibilityCompliance.sensoryAdaptationRate}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Communication Aids:</span>{" "}
              <span className="font-medium">
                {data.accessibilityCompliance.communicationAidsRate}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Signage Accessible:</span>{" "}
              <span className="font-medium">
                {data.accessibilityCompliance.signageAccessibleRate}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Overall Compliance:</span>{" "}
              <span className="font-medium">
                {data.accessibilityCompliance.overallComplianceRate}%
              </span>
            </div>
          </div>
        </CollapsibleSection>

        {/* Equipment Provision Detail */}
        <CollapsibleSection title="Equipment Provision">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Equipment:</span>{" "}
              <span className="font-medium">
                {data.equipmentProvision.totalEquipment}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Good Condition:</span>{" "}
              <span className="font-medium">
                {data.equipmentProvision.goodConditionCount} (
                {data.equipmentProvision.goodConditionRate}%)
              </span>
            </div>
            <div>
              <span className="text-gray-500">Maintenance Current:</span>{" "}
              <span className="font-medium">
                {data.equipmentProvision.maintenanceCurrentCount} (
                {data.equipmentProvision.maintenanceCurrentRate}%)
              </span>
            </div>
            <div>
              <span className="text-gray-500">Replacement Backlog:</span>{" "}
              <span
                className={`font-medium ${data.equipmentProvision.replacementBacklog > 0 ? "text-red-600" : "text-green-600"}`}
              >
                {data.equipmentProvision.replacementBacklog}
              </span>
            </div>
          </div>
        </CollapsibleSection>

        {/* Staff Disability Readiness Detail */}
        <CollapsibleSection title="Staff Disability Readiness">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Staff:</span>{" "}
              <span className="font-medium">
                {data.staffDisabilityReadiness.totalStaff}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Disability Awareness:</span>{" "}
              <span className="font-medium">
                {data.staffDisabilityReadiness.awarenessRate}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Adjustments Trained:</span>{" "}
              <span className="font-medium">
                {data.staffDisabilityReadiness.adjustmentsTrainingRate}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">EHCP Understanding:</span>{" "}
              <span className="font-medium">
                {data.staffDisabilityReadiness.ehcpUnderstandingRate}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Communication:</span>{" "}
              <span className="font-medium">
                {data.staffDisabilityReadiness.communicationStrategiesRate}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Personal Care:</span>{" "}
              <span className="font-medium">
                {data.staffDisabilityReadiness.personalCareRate}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Emergency Evacuation:</span>{" "}
              <span className="font-medium">
                {data.staffDisabilityReadiness.emergencyEvacuationRate}%
              </span>
            </div>
          </div>
        </CollapsibleSection>

        {/* Child Profiles */}
        <CollapsibleSection title="Child Adjustment Profiles" defaultOpen>
          <div className="space-y-3">
            {data.childSummaries.map((child) => (
              <div
                key={child.childId}
                className="border border-gray-100 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {child.childName}
                  </span>
                  <span className="text-sm font-medium text-gray-600">
                    Score: {child.overallScore}/10
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400">Disability Types:</span>{" "}
                    <span className="font-medium">
                      {child.disabilityTypes.length > 0
                        ? child.disabilityTypes
                            .map(
                              (t) =>
                                (data.meta?.disabilityTypeLabels as Record<string, string>)?.[t] || t,
                            )
                            .join(", ")
                        : "None recorded"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Adjustments:</span>{" "}
                    <span className="font-medium">
                      {child.inPlaceCount}/{child.totalAdjustments} in place
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Reviews Current:</span>{" "}
                    <span
                      className={
                        child.totalAdjustments > 0 &&
                        child.reviewCurrentCount === child.totalAdjustments
                          ? "text-green-600"
                          : child.totalAdjustments > 0
                            ? "text-amber-600"
                            : "text-gray-600"
                      }
                    >
                      {child.reviewCurrentCount}/{child.totalAdjustments}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">EHCP:</span>{" "}
                    <span
                      className={
                        child.ehcpInPlace ? "text-green-600" : "text-amber-600"
                      }
                    >
                      {child.ehcpInPlace ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Equipment:</span>{" "}
                    <span className="font-medium">
                      {child.equipmentCount > 0
                        ? `${child.equipmentGoodCount}/${child.equipmentCount} good`
                        : "None"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Strengths */}
        {data.strengths.length > 0 && (
          <CollapsibleSection title="Strengths" defaultOpen>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* Areas for Improvement */}
        {data.areasForImprovement.length > 0 && (
          <CollapsibleSection title="Areas for Improvement">
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              {data.areasForImprovement.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* Actions */}
        {data.actions.length > 0 && (
          <CollapsibleSection title="Recommended Actions">
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              {data.actions.map((a, i) => (
                <li
                  key={i}
                  className={
                    a.startsWith("URGENT") ? "text-red-600 font-medium" : ""
                  }
                >
                  {a}
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* Regulatory Links */}
        <CollapsibleSection title="Regulatory Framework">
          <ul className="text-sm text-gray-600 space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">&#167;</span>
                <span>{link}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      </div>
    </div>
  );
}
