// ══════════════════════════════════════════════════════════════════════════════
// Trauma-Informed Care Intelligence — Dashboard Widget
// CHR 2015 Reg 6 (Quality of Care), Reg 10 (Positive Relationships),
// Reg 12 (Protection of Children), SCCIF, NICE CG26, Working Together 2023
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

interface RegulatoryLink {
  regulation: string;
  description: string;
  relevance: string;
}

interface LevelBreakdown {
  awareness: number;
  informed: number;
  responsive: number;
  specialist: number;
}

interface StaffCompetency {
  trainingCoverageRate: number;
  averageCompetencyScore: number;
  averageCompetencyLevel: string;
  specialistCount: number;
  specialistAvailable: boolean;
  expiredTrainingCount: number;
  expiringWithin30Days: number;
  staffCount: number;
  trainedStaffCount: number;
  levelBreakdown: LevelBreakdown;
  score: number;
}

interface PerChildQuality {
  childId: string;
  childName: string;
  interventionCount: number;
  positiveResponseRate: number;
  principlesApplied: string[];
  principleGaps: string[];
}

interface PracticeQuality {
  principleCoverage: number;
  principlesUsed: string[];
  principlesMissing: string[];
  indicatorCoverage: number;
  indicatorsUsed: string[];
  indicatorsMissing: string[];
  indicatorFrequency: Record<string, number>;
  childResponseBreakdown: Record<string, number>;
  positiveResponseRate: number;
  interventionVariety: number;
  interventionTypes: string[];
  perChildQuality: PerChildQuality[];
  totalInterventions: number;
  score: number;
}

interface EnvironmentEval {
  totalAdaptations: number;
  activeAdaptations: number;
  adaptationCoverage: number;
  principlesCovered: string[];
  principlesGap: string[];
  reviewCurrency: number;
  overdueReviews: number;
  childSpecificCount: number;
  childSpecificRate: number;
  plannedAdaptations: number;
  score: number;
}

interface ConsultationEval {
  totalConsultations: number;
  consultationFrequencyPerMonth: number;
  actionCompletionRate: number;
  childrenCoverage: number;
  childrenDiscussedIds: string[];
  childrenNotDiscussed: string[];
  specialistVariety: number;
  consultationTypes: string[];
  totalActionsAgreed: number;
  totalActionsCompleted: number;
  score: number;
}

interface TraumaScreeningEval {
  screeningCoverage: number;
  childrenScreened: string[];
  childrenNotScreened: string[];
  triggerDocumentationRate: number;
  copingStrategyRate: number;
  therapeuticNeedsAssessedRate: number;
  referralRate: number;
  averageTriggersPerChild: number;
  averageCopingStrategiesPerChild: number;
  overdueReviews: number;
  score: number;
}

interface IntelligenceData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  overallScore: number;
  rating: string;
  staffCompetency: StaffCompetency;
  practiceQuality: PracticeQuality;
  environment: EnvironmentEval;
  consultation: ConsultationEval;
  traumaScreening: TraumaScreeningEval;
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: RegulatoryLink[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getScoreColour(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function getScoreBg(score: number): string {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function getRatingBadge(rating: string): { bg: string; text: string; label: string } {
  switch (rating) {
    case "outstanding":
      return { bg: "bg-green-100", text: "text-green-700", label: "Outstanding" };
    case "good":
      return { bg: "bg-blue-100", text: "text-blue-700", label: "Good" };
    case "requires_improvement":
      return { bg: "bg-amber-100", text: "text-amber-700", label: "Requires Improvement" };
    case "inadequate":
      return { bg: "bg-red-100", text: "text-red-700", label: "Inadequate" };
    default:
      return { bg: "bg-slate-100", text: "text-slate-600", label: rating };
  }
}

function getLevelBadge(level: string): { bg: string; text: string } {
  switch (level) {
    case "specialist":
      return { bg: "bg-green-100", text: "text-green-700" };
    case "responsive":
      return { bg: "bg-blue-100", text: "text-blue-700" };
    case "informed":
      return { bg: "bg-amber-100", text: "text-amber-700" };
    case "awareness":
      return { bg: "bg-slate-100", text: "text-slate-600" };
    default:
      return { bg: "bg-slate-100", text: "text-slate-600" };
  }
}

function formatLabel(str: string): string {
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Sub-components ─────────────────────────────────────────────────────────

function MetricTile({
  label,
  value,
  sub,
  score,
}: {
  label: string;
  value: string;
  sub?: string;
  score?: number;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${score != null ? getScoreColour(score) : "text-slate-900"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionHeader({
  title,
  score,
  maxScore,
  expanded,
  onToggle,
}: {
  title: string;
  score: number;
  maxScore: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm">{expanded ? "v" : ">"}</span>
        <span className="font-medium text-slate-800 text-sm">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-20 h-2 rounded-full bg-slate-200 overflow-hidden">
          <div className={`h-full rounded-full ${getScoreBg(pct)}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-sm font-semibold ${getScoreColour(pct)}`}>
          {score}/{maxScore}
        </span>
      </div>
    </button>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function TraumaInformedDashboardWidget() {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/trauma-informed")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch trauma-informed data");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── Loading State ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-64 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-3/4 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  // ── Error State ──────────────────────────────────────────────────────────

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-700 text-sm">
          Error loading trauma-informed data: {error}
        </p>
      </div>
    );
  }

  const ratingBadge = getRatingBadge(data.rating);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Trauma-Informed Care Intelligence
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Reg 6 &middot; Reg 10 &middot; Reg 12 &middot; NICE CG26
          </p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${getScoreColour(data.overallScore)}`}>
            {data.overallScore}
          </p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${ratingBadge.bg} ${ratingBadge.text}`}>
            {ratingBadge.label}
          </span>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricTile
          label="Staff Competency"
          value={`${data.staffCompetency.score}/20`}
          sub={`${data.staffCompetency.trainingCoverageRate}% trained`}
          score={(data.staffCompetency.score / 20) * 100}
        />
        <MetricTile
          label="Practice Quality"
          value={`${data.practiceQuality.score}/30`}
          sub={`${data.practiceQuality.totalInterventions} interventions`}
          score={(data.practiceQuality.score / 30) * 100}
        />
        <MetricTile
          label="Environment"
          value={`${data.environment.score}/15`}
          sub={`${data.environment.activeAdaptations} active`}
          score={(data.environment.score / 15) * 100}
        />
        <MetricTile
          label="Consultation"
          value={`${data.consultation.score}/15`}
          sub={`${data.consultation.totalConsultations} sessions`}
          score={(data.consultation.score / 15) * 100}
        />
        <MetricTile
          label="Screening"
          value={`${data.traumaScreening.score}/20`}
          sub={`${data.traumaScreening.screeningCoverage}% covered`}
          score={(data.traumaScreening.score / 20) * 100}
        />
      </div>

      {/* Expandable Sections */}
      <div className="space-y-2">
        {/* Staff Competency */}
        <SectionHeader
          title="Staff Competency"
          score={data.staffCompetency.score}
          maxScore={20}
          expanded={!!expanded.staff}
          onToggle={() => toggle("staff")}
        />
        {expanded.staff && (
          <div className="px-4 pb-3 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <p className="text-slate-500">Staff Trained</p>
                <p className="font-semibold">{data.staffCompetency.trainedStaffCount}/{data.staffCompetency.staffCount}</p>
              </div>
              <div>
                <p className="text-slate-500">Average Level</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getLevelBadge(data.staffCompetency.averageCompetencyLevel).bg} ${getLevelBadge(data.staffCompetency.averageCompetencyLevel).text}`}>
                  {formatLabel(data.staffCompetency.averageCompetencyLevel)}
                </span>
              </div>
              <div>
                <p className="text-slate-500">Specialists</p>
                <p className="font-semibold">{data.staffCompetency.specialistCount}</p>
              </div>
              <div>
                <p className="text-slate-500">Expired Training</p>
                <p className={`font-semibold ${data.staffCompetency.expiredTrainingCount > 0 ? "text-red-600" : "text-green-600"}`}>
                  {data.staffCompetency.expiredTrainingCount}
                </p>
              </div>
            </div>
            {data.staffCompetency.expiringWithin30Days > 0 && (
              <p className="text-xs text-amber-600">
                {data.staffCompetency.expiringWithin30Days} training record(s) expiring within 30 days
              </p>
            )}
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(data.staffCompetency.levelBreakdown) as [string, number][]).map(
                ([level, count]) => (
                  <span
                    key={level}
                    className={`px-2 py-1 rounded text-xs ${getLevelBadge(level).bg} ${getLevelBadge(level).text}`}
                  >
                    {formatLabel(level)}: {count}
                  </span>
                )
              )}
            </div>
          </div>
        )}

        {/* Practice Quality */}
        <SectionHeader
          title="Practice Quality"
          score={data.practiceQuality.score}
          maxScore={30}
          expanded={!!expanded.practice}
          onToggle={() => toggle("practice")}
        />
        {expanded.practice && (
          <div className="px-4 pb-3 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <p className="text-slate-500">Principle Coverage</p>
                <p className="font-semibold">{data.practiceQuality.principleCoverage}%</p>
              </div>
              <div>
                <p className="text-slate-500">Indicator Coverage</p>
                <p className="font-semibold">{data.practiceQuality.indicatorCoverage}%</p>
              </div>
              <div>
                <p className="text-slate-500">Positive Responses</p>
                <p className={`font-semibold ${getScoreColour(data.practiceQuality.positiveResponseRate)}`}>
                  {data.practiceQuality.positiveResponseRate}%
                </p>
              </div>
              <div>
                <p className="text-slate-500">Intervention Types</p>
                <p className="font-semibold">{data.practiceQuality.interventionVariety}</p>
              </div>
            </div>

            {/* Child Response Breakdown */}
            <div>
              <p className="text-xs text-slate-500 mb-1">Child Responses</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(data.practiceQuality.childResponseBreakdown).map(
                  ([response, count]) => (
                    <span
                      key={response}
                      className={`px-2 py-1 rounded text-xs ${
                        response === "positive"
                          ? "bg-green-100 text-green-700"
                          : response === "neutral"
                          ? "bg-slate-100 text-slate-600"
                          : response === "distressed"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {formatLabel(response)}: {count}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Per-Child Quality */}
            {data.practiceQuality.perChildQuality.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Per-Child Quality</p>
                <div className="space-y-1">
                  {data.practiceQuality.perChildQuality.map((child) => (
                    <div
                      key={child.childId}
                      className="flex items-center justify-between text-xs bg-slate-50 rounded px-2 py-1"
                    >
                      <span className="font-medium">{child.childName}</span>
                      <div className="flex gap-3">
                        <span>{child.interventionCount} interventions</span>
                        <span className={getScoreColour(child.positiveResponseRate)}>
                          {child.positiveResponseRate}% positive
                        </span>
                        {child.principleGaps.length > 0 && (
                          <span className="text-amber-600">
                            {child.principleGaps.length} principle gap(s)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.practiceQuality.principlesMissing.length > 0 && (
              <p className="text-xs text-amber-600">
                Missing principles: {data.practiceQuality.principlesMissing.map(formatLabel).join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Environmental Adaptations */}
        <SectionHeader
          title="Environmental Adaptations"
          score={data.environment.score}
          maxScore={15}
          expanded={!!expanded.environment}
          onToggle={() => toggle("environment")}
        />
        {expanded.environment && (
          <div className="px-4 pb-3 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <p className="text-slate-500">Active</p>
                <p className="font-semibold">{data.environment.activeAdaptations}/{data.environment.totalAdaptations}</p>
              </div>
              <div>
                <p className="text-slate-500">Principle Coverage</p>
                <p className="font-semibold">{data.environment.adaptationCoverage}%</p>
              </div>
              <div>
                <p className="text-slate-500">Review Currency</p>
                <p className={`font-semibold ${getScoreColour(data.environment.reviewCurrency)}`}>
                  {data.environment.reviewCurrency}%
                </p>
              </div>
              <div>
                <p className="text-slate-500">Child-Specific</p>
                <p className="font-semibold">{data.environment.childSpecificCount}</p>
              </div>
            </div>
            {data.environment.overdueReviews > 0 && (
              <p className="text-xs text-red-600">
                {data.environment.overdueReviews} adaptation(s) with overdue reviews
              </p>
            )}
            {data.environment.principlesGap.length > 0 && (
              <p className="text-xs text-amber-600">
                Principles not covered: {data.environment.principlesGap.map(formatLabel).join(", ")}
              </p>
            )}
            {data.environment.plannedAdaptations > 0 && (
              <p className="text-xs text-blue-600">
                {data.environment.plannedAdaptations} adaptation(s) planned
              </p>
            )}
          </div>
        )}

        {/* Clinical Consultation */}
        <SectionHeader
          title="Clinical Consultation"
          score={data.consultation.score}
          maxScore={15}
          expanded={!!expanded.consultation}
          onToggle={() => toggle("consultation")}
        />
        {expanded.consultation && (
          <div className="px-4 pb-3 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <p className="text-slate-500">Sessions</p>
                <p className="font-semibold">{data.consultation.totalConsultations}</p>
              </div>
              <div>
                <p className="text-slate-500">Frequency</p>
                <p className="font-semibold">{data.consultation.consultationFrequencyPerMonth}/month</p>
              </div>
              <div>
                <p className="text-slate-500">Action Completion</p>
                <p className={`font-semibold ${getScoreColour(data.consultation.actionCompletionRate)}`}>
                  {data.consultation.actionCompletionRate}%
                </p>
              </div>
              <div>
                <p className="text-slate-500">Children Covered</p>
                <p className="font-semibold">{data.consultation.childrenCoverage}%</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {data.consultation.consultationTypes.map((type) => (
                <span
                  key={type}
                  className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-700"
                >
                  {formatLabel(type)}
                </span>
              ))}
            </div>
            {data.consultation.childrenNotDiscussed.length > 0 && (
              <p className="text-xs text-amber-600">
                {data.consultation.childrenNotDiscussed.length} child(ren) not yet discussed in consultations
              </p>
            )}
          </div>
        )}

        {/* Trauma Screening */}
        <SectionHeader
          title="Trauma Screening"
          score={data.traumaScreening.score}
          maxScore={20}
          expanded={!!expanded.screening}
          onToggle={() => toggle("screening")}
        />
        {expanded.screening && (
          <div className="px-4 pb-3 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <p className="text-slate-500">Coverage</p>
                <p className="font-semibold">{data.traumaScreening.screeningCoverage}%</p>
              </div>
              <div>
                <p className="text-slate-500">Triggers Documented</p>
                <p className="font-semibold">{data.traumaScreening.triggerDocumentationRate}%</p>
              </div>
              <div>
                <p className="text-slate-500">Coping Strategies</p>
                <p className="font-semibold">{data.traumaScreening.copingStrategyRate}%</p>
              </div>
              <div>
                <p className="text-slate-500">Referral Rate</p>
                <p className="font-semibold">{data.traumaScreening.referralRate}%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-slate-500">Avg Triggers/Child</p>
                <p className="font-semibold">{data.traumaScreening.averageTriggersPerChild}</p>
              </div>
              <div>
                <p className="text-slate-500">Avg Coping Strategies/Child</p>
                <p className="font-semibold">{data.traumaScreening.averageCopingStrategiesPerChild}</p>
              </div>
            </div>
            {data.traumaScreening.childrenNotScreened.length > 0 && (
              <p className="text-xs text-red-600">
                Unscreened: {data.traumaScreening.childrenNotScreened.join(", ")}
              </p>
            )}
            {data.traumaScreening.overdueReviews > 0 && (
              <p className="text-xs text-amber-600">
                {data.traumaScreening.overdueReviews} screening review(s) overdue
              </p>
            )}
          </div>
        )}

        {/* Strengths, Areas & Actions */}
        <SectionHeader
          title="Strengths, Areas & Actions"
          score={data.strengths.length}
          maxScore={data.strengths.length + data.areasForImprovement.length}
          expanded={!!expanded.insights}
          onToggle={() => toggle("insights")}
        />
        {expanded.insights && (
          <div className="px-4 pb-3 space-y-4">
            {data.strengths.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-700 mb-1">Strengths</p>
                <ul className="space-y-1">
                  {data.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-slate-700 flex gap-2">
                      <span className="text-green-500 mt-0.5 shrink-0">+</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.areasForImprovement.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-1">Areas for Improvement</p>
                <ul className="space-y-1">
                  {data.areasForImprovement.map((a, i) => (
                    <li key={i} className="text-xs text-slate-700 flex gap-2">
                      <span className="text-amber-500 mt-0.5 shrink-0">!</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.actions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-blue-700 mb-1">Actions</p>
                <ul className="space-y-1">
                  {data.actions.map((a, i) => (
                    <li key={i} className="text-xs text-slate-700 flex gap-2">
                      <span className="text-blue-500 mt-0.5 shrink-0">-</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Regulatory Framework */}
        <SectionHeader
          title="Regulatory Framework"
          score={data.regulatoryLinks.length}
          maxScore={data.regulatoryLinks.length}
          expanded={!!expanded.regulatory}
          onToggle={() => toggle("regulatory")}
        />
        {expanded.regulatory && (
          <div className="px-4 pb-3">
            <div className="space-y-2">
              {data.regulatoryLinks.map((link, i) => (
                <div key={i} className="bg-slate-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800">
                      {link.regulation}
                    </span>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="text-xs text-slate-500">{link.description}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{link.relevance}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
