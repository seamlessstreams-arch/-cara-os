"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ONLINE SAFETY & DIGITAL WELLBEING DASHBOARD WIDGET
//
// Displays online safety intelligence:
// - Overall digital safety rating
// - Risk assessment coverage
// - Incident tracking & severity
// - E-safety education delivery
// - Staff training compliance
// - Per-child online safety profiles
// - Policy & filtering status
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

interface ChildOnlineProfileData {
  childId: string;
  childName: string;
  hasRiskAssessment: boolean;
  assessmentOverdue: boolean;
  overallRiskLevel?: string;
  riskCount: number;
  deviceAgreementSigned: boolean;
  safetyMeasureCount: number;
  incidentCount: number;
  highSeverityIncidents: number;
  educationSessionCount: number;
  socialMediaAccounts: number;
  primaryConcern?: string;
}

interface OnlineSafetyData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  riskAssessments: {
    totalChildren: number;
    childrenWithAssessment: number;
    assessmentRate: number;
    overdueAssessments: number;
    deviceAgreementRate: number;
    averageSafetyMeasures: number;
    childrenAtHighRisk: string[];
  };
  incidentAnalysis: {
    totalIncidents: number;
    averageSeverity: number;
    resolvedRate: number;
    ceopReferrals: number;
    policeInvolvement: number;
    typeBreakdown: { incidentType: string; incidentTypeLabel?: string; count: number }[];
  };
  education: {
    totalSessions: number;
    sessionsPerChild: number;
    topicsCovered: number;
    totalTopics: number;
    topicCoverageRate: number;
    engagementRate: number;
    topicBreakdown: { topic: string; topicLabel?: string; count: number }[];
    childrenWithNoEducation: string[];
  };
  staffTraining: {
    trainingRate: number;
    expiredTraining: number;
    staffMissingTraining: string[];
  };
  childProfiles: ChildOnlineProfileData[];
  policyStatus: {
    current: boolean;
    overdue: boolean;
    filteringInPlace: boolean;
    monitoringInPlace: boolean;
    reportingPathway: boolean;
    childFriendly: boolean;
  };
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Rating Badge ───────────────────────────────────────────────────────────

function RatingBadge({ score, rating }: { score: number; rating: string }) {
  const colorClass =
    rating === "outstanding" ? "bg-green-100 text-green-800 border-green-300"
      : rating === "good" ? "bg-blue-100 text-blue-800 border-blue-300"
        : rating === "requires_improvement" ? "bg-orange-100 text-orange-800 border-orange-300"
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

// ── Risk Level Dot ─────────────────────────────────────────────────────────

function RiskDot({ level }: { level?: string }) {
  const color =
    level === "very_high" ? "bg-red-600"
      : level === "high" ? "bg-red-400"
        : level === "medium" ? "bg-orange-400"
          : level === "low" ? "bg-green-400"
            : "bg-gray-300";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

// ── Child Online Card ──────────────────────────────────────────────────────

function ChildOnlineCard({ child }: { child: ChildOnlineProfileData }) {
  return (
    <div className={`rounded-lg border p-3 ${child.primaryConcern ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm">{child.childName}</span>
          <RiskDot level={child.overallRiskLevel} />
        </div>
        <div className="flex gap-1">
          {!child.hasRiskAssessment && (
            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">NO ASSESSMENT</span>
          )}
          {child.highSeverityIncidents > 0 && (
            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">ALERT</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1 text-center">
        <div>
          <div className="text-xs text-gray-500">Risk</div>
          <div className="text-sm font-bold text-gray-800">{child.overallRiskLevel?.replace(/_/g, " ") ?? "—"}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Safety</div>
          <div className="text-sm font-bold text-blue-700">{child.safetyMeasureCount}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Incidents</div>
          <div className={`text-sm font-bold ${child.incidentCount > 0 ? "text-orange-700" : "text-green-700"}`}>{child.incidentCount}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Education</div>
          <div className="text-sm font-bold text-purple-700">{child.educationSessionCount}</div>
        </div>
      </div>
      {child.socialMediaAccounts > 0 && (
        <div className="mt-1.5 text-[10px] text-gray-500">
          {child.socialMediaAccounts} social media account{child.socialMediaAccounts !== 1 ? "s" : ""} monitored
        </div>
      )}
      {child.primaryConcern && (
        <div className="mt-2 text-[10px] text-red-700 bg-red-100 rounded px-2 py-1">{child.primaryConcern}</div>
      )}
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function OnlineSafetyDashboardWidget() {
  const [data, setData] = useState<OnlineSafetyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/online-safety");
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
        <div className="h-24 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Online Safety Intelligence</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">Online Safety & Digital Wellbeing</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            KCSIE 2024 | {data.incidentAnalysis.totalIncidents} incident{data.incidentAnalysis.totalIncidents !== 1 ? "s" : ""} | {data.education.totalSessions} e-safety sessions
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-700">{data.riskAssessments.assessmentRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Assessed</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-700">{data.staffTraining.trainingRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Staff Trained</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-xl font-bold text-purple-700">{data.education.topicCoverageRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Topics Covered</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="text-xl font-bold text-orange-700">{data.riskAssessments.deviceAgreementRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Device Agreements</div>
        </div>
      </div>

      {/* Policy & Safeguards Status */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`text-xs px-2 py-1 rounded ${data.policyStatus.current ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          Policy: {data.policyStatus.current ? "Current" : "OVERDUE"}
        </span>
        {data.policyStatus.filteringInPlace && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Filtering active</span>
        )}
        {data.policyStatus.monitoringInPlace && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Monitoring active</span>
        )}
        {data.policyStatus.reportingPathway && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">CEOP pathway</span>
        )}
        {data.riskAssessments.childrenAtHighRisk.length > 0 && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-semibold">
            {data.riskAssessments.childrenAtHighRisk.length} high risk
          </span>
        )}
        {data.incidentAnalysis.ceopReferrals > 0 && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
            {data.incidentAnalysis.ceopReferrals} CEOP referral{data.incidentAnalysis.ceopReferrals !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Child Online Safety Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {data.childProfiles.map((child) => (
          <ChildOnlineCard key={child.childId} child={child} />
        ))}
      </div>

      {/* Immediate Actions */}
      {data.immediateActions.length > 0 &&
        !data.immediateActions[0].startsWith("No immediate actions") && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-amber-800 mb-2">Required Actions</h4>
            <ul className="space-y-1">
              {data.immediateActions.map((action, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT") ? "\u{1F534}" : action.startsWith("HIGH") ? "\u{1F7E0}" : "\u{1F7E1}"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details ▲" : "Show education, incidents & regulatory links ▼"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Education Topics */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              E-Safety Education ({data.education.topicsCovered}/{data.education.totalTopics} topics)
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {data.education.topicBreakdown.map((t) => (
                <span key={t.topic} className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                  {t.topicLabel ?? t.topic.replace(/_/g, " ")}: {t.count}
                </span>
              ))}
            </div>
            {data.education.childrenWithNoEducation.length > 0 && (
              <p className="text-xs text-red-600 mt-1">
                No education: {data.education.childrenWithNoEducation.join(", ")}
              </p>
            )}
          </div>

          {/* Incident Types */}
          {data.incidentAnalysis.totalIncidents > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Incident Breakdown</h4>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {data.incidentAnalysis.typeBreakdown.map((t) => (
                  <span key={t.incidentType} className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded">
                    {t.incidentTypeLabel ?? t.incidentType.replace(/_/g, " ")}: {t.count}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Avg severity: {data.incidentAnalysis.averageSeverity}/5 | Resolved: {data.incidentAnalysis.resolvedRate}%
              </p>
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

          {/* Areas for Development */}
          {data.areasForDevelopment.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-800 mb-2">Areas for Development</h4>
              <ul className="space-y-1">
                {data.areasForDevelopment.map((area, i) => (
                  <li key={i} className="text-xs text-orange-700">- {area}</li>
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
