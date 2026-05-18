"use client";

// ==============================================================================
// KEY WORKING EFFECTIVENESS DASHBOARD WIDGET
//
// Displays the 4-layer key working effectiveness intelligence:
// - Overall score with Ofsted-aligned rating
// - Key metrics: Total Sessions, Engagement Rate, Trust Rate, Review Attendance,
//   Training Compliance
// - 4 ScoreBars: Session Effectiveness, Relationship Quality, Care Plan
//   Integration, Professional Development
// - Collapsible sections: Child Profiles, Strengths, Areas for Improvement,
//   Actions, Regulatory Links
// ==============================================================================

import { useState, useEffect } from "react";

// -- Local interfaces (mirrors API shape) ------------------------------------

interface SessionEffectiveness {
  overallScore: number;
  totalSessions: number;
  excellentGoodRate: number;
  childEngagementRate: number;
  childVoiceRate: number;
  recordingComplianceRate: number;
  averageDurationMinutes: number;
  actionsCompletionRate: number;
}

interface RelationshipQuality {
  overallScore: number;
  totalRelationships: number;
  strongDevelopingRate: number;
  childFeelsListenedRate: number;
  childTrustsRate: number;
  averageConsistencyRating: number;
  highTurnoverCount: number;
}

interface CarePlanIntegration {
  overallScore: number;
  totalContributions: number;
  comprehensivePartialRate: number;
  reviewAttendanceRate: number;
  reportsTimelyRate: number;
  childViewsRepresentedRate: number;
  outcomesFocusedRate: number;
}

interface ProfessionalDevelopment {
  overallScore: number;
  totalKeyWorkers: number;
  trainingComplianceRate: number;
  supervisionRegularRate: number;
  reflectivePracticeRate: number;
  managableCaseloadRate: number;
  peerSupportRate: number;
}

interface ChildProfile {
  childId: string;
  childName: string;
  keyWorkerName: string;
  sessionCount: number;
  relationshipQuality: string;
  engagementRate: number;
  carePlanInput: string;
  overallScore: number;
}

interface KeyWorkingData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  sessionEffectiveness: SessionEffectiveness;
  relationshipQuality: RelationshipQuality;
  carePlanIntegration: CarePlanIntegration;
  professionalDevelopment: ProfessionalDevelopment;
  childProfiles: ChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Rating Badge ------------------------------------------------------------

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

// -- Score Bar ---------------------------------------------------------------

function ScoreBar({ score, label, maxScore = 25 }: { score: number; label: string; maxScore?: number }) {
  const pctVal = (score / maxScore) * 100;
  const color = pctVal >= 80 ? "bg-green-500" : pctVal >= 60 ? "bg-blue-500" : pctVal >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-44 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pctVal, 100)}%` }} />
      </div>
      <span className="text-sm font-medium w-12 text-right">{score}/{maxScore}</span>
    </div>
  );
}

// -- Metric Card -------------------------------------------------------------

function MetricCard({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className={`text-xl font-bold ${alert ? "text-amber-600" : "text-gray-900"}`}>
        {value}
      </div>
      <div className="text-[10px] font-medium text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

// -- Collapsible Section -----------------------------------------------------

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
        <span className="font-medium text-gray-900">{title}</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

// -- Relationship Quality Label ----------------------------------------------

const RELATIONSHIP_LABELS: Record<string, string> = {
  strong_and_trusting: "Strong & Trusting",
  developing: "Developing",
  inconsistent: "Inconsistent",
  difficult: "Difficult",
  not_established: "Not Established",
  not_assessed: "Not Assessed",
};

const CARE_PLAN_LABELS: Record<string, string> = {
  comprehensive: "Comprehensive",
  partial: "Partial",
  minimal: "Minimal",
  none: "None",
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  strong_and_trusting: "bg-green-100 text-green-700",
  developing: "bg-blue-100 text-blue-700",
  inconsistent: "bg-amber-100 text-amber-700",
  difficult: "bg-red-100 text-red-700",
  not_established: "bg-gray-100 text-gray-600",
  not_assessed: "bg-gray-100 text-gray-500",
};

// -- Main Widget -------------------------------------------------------------

export function KeyWorkingEffectivenessDashboardWidget() {
  const [data, setData] = useState<KeyWorkingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/key-working-effectiveness");
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
        <h3 className="font-semibold text-red-800">Key Working Effectiveness</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Key Working Effectiveness
          </h3>
          <p className="text-sm text-gray-500">
            {data.periodStart} to {data.periodEnd}
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricCard
          label="Total Sessions"
          value={String(data.sessionEffectiveness.totalSessions)}
        />
        <MetricCard
          label="Engagement Rate"
          value={`${data.sessionEffectiveness.childEngagementRate}%`}
          alert={data.sessionEffectiveness.childEngagementRate < 70}
        />
        <MetricCard
          label="Trust Rate"
          value={`${data.relationshipQuality.childTrustsRate}%`}
          alert={data.relationshipQuality.childTrustsRate < 70}
        />
        <MetricCard
          label="Review Attendance"
          value={`${data.carePlanIntegration.reviewAttendanceRate}%`}
          alert={data.carePlanIntegration.reviewAttendanceRate < 80}
        />
        <MetricCard
          label="Training Compliance"
          value={`${data.professionalDevelopment.trainingComplianceRate}%`}
          alert={data.professionalDevelopment.trainingComplianceRate < 80}
        />
      </div>

      {/* Score Bars */}
      <div className="space-y-2">
        <ScoreBar score={data.sessionEffectiveness.overallScore} label="Session Effectiveness" />
        <ScoreBar score={data.relationshipQuality.overallScore} label="Relationship Quality" />
        <ScoreBar score={data.carePlanIntegration.overallScore} label="Care Plan Integration" />
        <ScoreBar score={data.professionalDevelopment.overallScore} label="Professional Development" />
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-3">
        {/* Child Profiles */}
        <Section title={`Child Profiles (${data.childProfiles.length})`} defaultOpen>
          {data.childProfiles.length === 0 ? (
            <p className="text-sm text-gray-500">No child profiles available.</p>
          ) : (
            <div className="space-y-2">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{child.childName}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${RELATIONSHIP_COLORS[child.relationshipQuality] ?? "bg-gray-100 text-gray-600"}`}>
                        {RELATIONSHIP_LABELS[child.relationshipQuality] ?? child.relationshipQuality}
                      </span>
                    </div>
                    <div className="flex gap-3 text-[10px] text-gray-400 mt-0.5">
                      <span>KW: {child.keyWorkerName}</span>
                      <span>Sessions: {child.sessionCount}</span>
                      <span>Engagement: {child.engagementRate}%</span>
                      <span>Care Plan: {CARE_PLAN_LABELS[child.carePlanInput] ?? child.carePlanInput}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className={`text-lg font-bold ${child.overallScore >= 7 ? "text-green-700" : child.overallScore >= 5 ? "text-blue-700" : child.overallScore >= 3 ? "text-amber-700" : "text-red-700"}`}>
                      {child.overallScore}/10
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Strengths */}
        {data.strengths.length > 0 && (
          <Section title={`Strengths (${data.strengths.length})`}>
            <ul className="space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-sm text-green-800 flex gap-2">
                  <span className="shrink-0">+</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Areas for Improvement */}
        {data.areasForImprovement.length > 0 && (
          <Section title={`Areas for Improvement (${data.areasForImprovement.length})`}>
            <ul className="space-y-1">
              {data.areasForImprovement.map((a, i) => (
                <li key={i} className="text-sm text-orange-800 flex gap-2">
                  <span className="shrink-0">!</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Actions */}
        {data.actions.length > 0 && (
          <Section title={`Actions (${data.actions.length})`}>
            <ul className="space-y-1">
              {data.actions.map((a, i) => (
                <li key={i} className={`text-sm flex gap-2 ${a.startsWith("URGENT") ? "text-red-800 font-medium" : "text-gray-800"}`}>
                  <span className="shrink-0">{a.startsWith("URGENT") ? "!!" : "-"}</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Regulatory Links */}
        {data.regulatoryLinks.length > 0 && (
          <Section title={`Regulatory Links (${data.regulatoryLinks.length})`}>
            <ul className="space-y-1">
              {data.regulatoryLinks.map((l, i) => (
                <li key={i} className="text-sm text-gray-600 flex gap-2">
                  <span className="shrink-0 text-gray-400">&sect;</span>
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}
