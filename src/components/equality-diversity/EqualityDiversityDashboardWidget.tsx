"use client";

// ══════════════════════════════════════════════════════════════════════════════
// EQUALITY & DIVERSITY DASHBOARD WIDGET
//
// Displays equality & diversity intelligence:
// - Overall EDI rating and score
// - Individual support metrics (protected characteristics, cultural plans)
// - Staff competency / training compliance
// - Incident response analysis
// - Accessibility audit scores
// - Per-child EDI summaries
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

interface ChildEDISummaryData {
  childId: string;
  childName: string;
  characteristicCount: number;
  fullySupportedCount: number;
  supportRate: number;
  culturalPlanStatus: string;
  dietaryNeedsMet: boolean;
  religiousPracticeFacilitated: boolean;
  languageSupportProvided: boolean;
  identityWorkCompleted: boolean;
  primaryConcern?: string;
}

interface EqualityDiversityData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  individualSupport: {
    totalChildren: number;
    fullySupported: number;
    partiallySupportedCount: number;
    notSupportedCount: number;
    fullySupportedRate: number;
    culturalPlanCoverage: number;
    dietaryRate: number;
    religiousRate: number;
    languageRate: number;
    identityWorkRate: number;
    allAssessedWithin90Days: boolean;
    score: number;
  };
  staffCompetency: {
    totalStaff: number;
    completedCount: number;
    completionRate: number;
    overdueCount: number;
    expiredCount: number;
    trainingTypes: string[];
    uniqueTrainingTypesCount: number;
    hasEqualityActTraining: boolean;
    hasCulturalCompetencyTraining: boolean;
    coverageRate: number;
    score: number;
  };
  incidentResponse: {
    totalIncidents: number;
    resolvedCount: number;
    resolutionRate: number;
    lessonsIdentifiedCount: number;
    lessonsRate: number;
    averageActionsPerIncident: number;
    unresolvedCriticalOrHigh: number;
    escalatedCount: number;
    escalationRate: number;
    allLessonsIdentified: boolean;
    score: number;
  };
  accessibilityInclusion: {
    totalAudits: number;
    latestPhysicalScore: number;
    latestCommunicationScore: number;
    latestInformationScore: number;
    latestActivityScore: number;
    improvementRate: number;
    allScoresAbove9: boolean;
    score: number;
  };
  childSummaries: ChildEDISummaryData[];
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

// ── Score Bar ──────────────────────────────────────────────────────────────

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const width = max === 0 ? 0 : Math.round((score / max) * 100);
  const color = width >= 80 ? "bg-green-500" : width >= 60 ? "bg-blue-500" : width >= 40 ? "bg-orange-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-36 truncate">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
      <span className="text-xs font-semibold w-12 text-right">{score}/{max}</span>
    </div>
  );
}

// ── Access Score Dot ──────────────────────────────────────────────────────

function AccessScoreDot({ label, score }: { label: string; score: number }) {
  const color = score >= 9 ? "text-green-700 bg-green-50" : score >= 8 ? "text-blue-700 bg-blue-50" : score >= 6 ? "text-orange-700 bg-orange-50" : "text-red-700 bg-red-50";

  return (
    <div className={`text-center p-2 rounded-lg ${color}`}>
      <div className="text-xl font-bold">{score}</div>
      <div className="text-[10px] text-gray-500 uppercase">{label}</div>
    </div>
  );
}

// ── Child EDI Card ────────────────────────────────────────────────────────

function ChildEDICard({ child }: { child: ChildEDISummaryData }) {
  const rateColor = (r: number) =>
    r >= 80 ? "text-green-700" : r >= 60 ? "text-blue-700" : r >= 40 ? "text-orange-700" : "text-red-700";

  const planColor =
    child.culturalPlanStatus === "active" ? "bg-green-100 text-green-700"
      : child.culturalPlanStatus === "not_applicable" ? "bg-gray-100 text-gray-500"
        : child.culturalPlanStatus === "review_due" ? "bg-orange-100 text-orange-700"
          : "bg-red-100 text-red-700";

  const planLabel =
    child.culturalPlanStatus === "active" ? "Active"
      : child.culturalPlanStatus === "not_applicable" ? "N/A"
        : child.culturalPlanStatus === "review_due" ? "Review Due"
          : "Not in Place";

  return (
    <div className={`rounded-lg border p-3 ${child.primaryConcern ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{child.childName}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${planColor}`}>{planLabel}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center mb-2">
        <div>
          <div className="text-xs text-gray-500">Support Rate</div>
          <div className={`text-sm font-bold ${rateColor(child.supportRate)}`}>
            {child.characteristicCount > 0 ? `${child.supportRate}%` : "--"}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Characteristics</div>
          <div className="text-sm font-bold text-gray-800">
            {child.fullySupportedCount}/{child.characteristicCount}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {child.dietaryNeedsMet && (
          <span className="text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded">Dietary</span>
        )}
        {child.religiousPracticeFacilitated && (
          <span className="text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded">Religious</span>
        )}
        {child.languageSupportProvided && (
          <span className="text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded">Language</span>
        )}
        {child.identityWorkCompleted && (
          <span className="text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded">Identity</span>
        )}
        {!child.dietaryNeedsMet && (
          <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Dietary</span>
        )}
        {!child.religiousPracticeFacilitated && (
          <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Religious</span>
        )}
        {!child.languageSupportProvided && (
          <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Language</span>
        )}
        {!child.identityWorkCompleted && (
          <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Identity</span>
        )}
      </div>
      {child.primaryConcern && (
        <div className="mt-2 text-[10px] text-red-700 bg-red-100 rounded px-2 py-1">{child.primaryConcern}</div>
      )}
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function EqualityDiversityDashboardWidget() {
  const [data, setData] = useState<EqualityDiversityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/equality-diversity?homeId=home-oak-house");
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
        <h3 className="font-semibold text-red-800">Equality & Diversity Intelligence</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">Equality & Diversity</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.individualSupport.totalChildren} children | {data.staffCompetency.totalStaff} staff | Equality Act 2010 & CHR 2015
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Sub-Score Bars */}
      <div className="space-y-2 mb-4">
        <ScoreBar label="Individual Support" score={data.individualSupport.score} max={30} />
        <ScoreBar label="Staff Competency" score={data.staffCompetency.score} max={25} />
        <ScoreBar label="Incident Response" score={data.incidentResponse.score} max={25} />
        <ScoreBar label="Accessibility" score={data.accessibilityInclusion.score} max={20} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-700">{data.individualSupport.fullySupportedRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Fully Supported</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-700">{data.staffCompetency.completionRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Staff Trained</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-xl font-bold text-purple-700">{data.incidentResponse.resolutionRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Incidents Resolved</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="text-xl font-bold text-orange-700">{data.accessibilityInclusion.improvementRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Improvements Done</div>
        </div>
      </div>

      {/* Alert Badges */}
      {(data.individualSupport.notSupportedCount > 0 ||
        data.staffCompetency.overdueCount > 0 ||
        data.incidentResponse.unresolvedCriticalOrHigh > 0 ||
        data.staffCompetency.expiredCount > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {data.individualSupport.notSupportedCount > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
              {data.individualSupport.notSupportedCount} unsupported characteristic{data.individualSupport.notSupportedCount !== 1 ? "s" : ""}
            </span>
          )}
          {data.staffCompetency.overdueCount > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
              {data.staffCompetency.overdueCount} overdue training
            </span>
          )}
          {data.incidentResponse.unresolvedCriticalOrHigh > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-semibold">
              {data.incidentResponse.unresolvedCriticalOrHigh} unresolved critical/high
            </span>
          )}
          {data.staffCompetency.expiredCount > 0 && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
              {data.staffCompetency.expiredCount} expired training
            </span>
          )}
        </div>
      )}

      {/* Accessibility Scores */}
      {data.accessibilityInclusion.totalAudits > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Accessibility Scores</h4>
          <div className="grid grid-cols-4 gap-2">
            <AccessScoreDot label="Physical" score={data.accessibilityInclusion.latestPhysicalScore} />
            <AccessScoreDot label="Comms" score={data.accessibilityInclusion.latestCommunicationScore} />
            <AccessScoreDot label="Info" score={data.accessibilityInclusion.latestInformationScore} />
            <AccessScoreDot label="Activity" score={data.accessibilityInclusion.latestActivityScore} />
          </div>
        </div>
      )}

      {/* Child EDI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {data.childSummaries.map((child) => (
          <ChildEDICard key={child.childId} child={child} />
        ))}
      </div>

      {/* Immediate Actions */}
      {data.immediateActions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">Required Actions</h4>
          <ul className="space-y-1">
            {data.immediateActions.map((action, i) => (
              <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500" />
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
        {expanded ? "Hide details" : "Show strengths, training & regulatory links"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Strengths */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Strengths</h4>
            <ul className="space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Development */}
          {data.areasForDevelopment.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Areas for Development</h4>
              <ul className="space-y-1">
                {data.areasForDevelopment.map((a, i) => (
                  <li key={i} className="text-xs text-orange-700 flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Staff Training */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Staff Training ({data.staffCompetency.completionRate}% completion)</h4>
            <div className="flex flex-wrap gap-1.5">
              {data.staffCompetency.trainingTypes.map((t) => (
                <span key={t} className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                  {t}
                </span>
              ))}
            </div>
            {data.staffCompetency.hasEqualityActTraining && data.staffCompetency.hasCulturalCompetencyTraining && (
              <p className="text-[10px] text-green-600 mt-1">Core EDI training (Equality Act + Cultural Competency) in place</p>
            )}
          </div>

          {/* Incident Response */}
          {data.incidentResponse.totalIncidents > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Incident Response</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-1.5 bg-green-50 rounded">
                  <div className="text-sm font-bold text-green-700">{data.incidentResponse.resolutionRate}%</div>
                  <div className="text-[9px] text-gray-500">Resolved</div>
                </div>
                <div className="p-1.5 bg-blue-50 rounded">
                  <div className="text-sm font-bold text-blue-700">{data.incidentResponse.lessonsRate}%</div>
                  <div className="text-[9px] text-gray-500">Lessons</div>
                </div>
                <div className="p-1.5 bg-purple-50 rounded">
                  <div className="text-sm font-bold text-purple-700">{data.incidentResponse.averageActionsPerIncident}</div>
                  <div className="text-[9px] text-gray-500">Avg Actions</div>
                </div>
              </div>
            </div>
          )}

          {/* Regulatory Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Regulatory Framework</h4>
            <div className="flex flex-wrap gap-1.5">
              {data.regulatoryLinks.map((link, i) => (
                <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {link}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
