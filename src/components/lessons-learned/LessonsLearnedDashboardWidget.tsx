"use client";

// ══════════════════════════════════════════════════════════════════════════════
// LESSONS LEARNED DASHBOARD WIDGET
//
// Displays Learning Organisation Intelligence including:
// - Overall learning culture score and Ofsted-aligned rating
// - Review compliance metrics
// - Lesson implementation progress
// - Pattern detection and embedding status
// - Immediate actions for improvement
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

interface ReviewCompliance {
  totalIncidents: number;
  reviewsCompleted: number;
  reviewsOverdue: number;
  reviewsPending: number;
  averageReviewDays: number;
  compliancePercentage: number;
  childVoiceInclusionRate: number;
  staffReflectionRate: number;
}

interface LessonImplementation {
  totalLessonsIdentified: number;
  actionsCreated: number;
  actionsCompleted: number;
  actionsEvidenced: number;
  actionsOverdue: number;
  actionsAbandoned: number;
  implementationRate: number;
  embeddingRate: number;
}

interface Pattern {
  type: string;
  description: string;
  frequency: number;
  wasAddressed: boolean;
}

interface LearningData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  reviewCompliance: ReviewCompliance;
  lessonImplementation: LessonImplementation;
  patterns: Pattern[];
  patternsAddressed: number;
  patternsUnaddressed: number;
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
  improvementTrend: string;
  repeatIncidentRate: number;
  meta?: {
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
    rating === "outstanding"
      ? "Outstanding"
      : rating === "good"
        ? "Good"
        : rating === "requires_improvement"
          ? "Requires Improvement"
          : "Inadequate";

  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colorClass}`}>
      <div className="text-3xl font-bold">{score}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
    </div>
  );
}

// ── Progress Bar ───────────────────────────────────────────────────────────

function ProgressBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "green" | "blue" | "orange" | "red";
}) {
  const barColor = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
  }[color];

  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ── Pattern Chip ───────────────────────────────────────────────────────────

function PatternChip({ pattern }: { pattern: Pattern }) {
  const typeColors: Record<string, string> = {
    recurring_incident: "bg-orange-100 text-orange-700",
    recurring_trigger: "bg-yellow-100 text-yellow-700",
    escalating_severity: "bg-red-100 text-red-700",
    lessons_not_embedded: "bg-purple-100 text-purple-700",
  };

  return (
    <div className={`text-xs px-2 py-1.5 rounded ${typeColors[pattern.type] ?? "bg-gray-100 text-gray-600"}`}>
      <div className="font-medium">{pattern.description}</div>
      <div className="mt-0.5 opacity-75">
        {pattern.wasAddressed ? "Addressed" : "Unaddressed"} | x{pattern.frequency}
      </div>
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function LessonsLearnedDashboardWidget() {
  const [data, setData] = useState<LearningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/lessons-learned");
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
        <h3 className="font-semibold text-red-800">Lessons Learned</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  const trendIcon =
    data.improvementTrend === "improving"
      ? "↑"
      : data.improvementTrend === "declining"
        ? "↓"
        : "→";
  const trendColor =
    data.improvementTrend === "improving"
      ? "text-green-600"
      : data.improvementTrend === "declining"
        ? "text-red-600"
        : "text-gray-500";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Learning Organisation Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} | {data.reviewCompliance.totalIncidents} incidents
            <span className={`ml-2 font-medium ${trendColor}`}>
              {trendIcon} {data.improvementTrend}
            </span>
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <ProgressBar
            label="Review Compliance"
            value={data.reviewCompliance.compliancePercentage}
            color={data.reviewCompliance.compliancePercentage >= 80 ? "green" : "orange"}
          />
          <ProgressBar
            label="Child Voice Inclusion"
            value={data.reviewCompliance.childVoiceInclusionRate}
            color={data.reviewCompliance.childVoiceInclusionRate >= 80 ? "green" : "orange"}
          />
        </div>
        <div>
          <ProgressBar
            label="Action Implementation"
            value={data.lessonImplementation.implementationRate}
            color={data.lessonImplementation.implementationRate >= 70 ? "blue" : "orange"}
          />
          <ProgressBar
            label="Practice Embedding"
            value={data.lessonImplementation.embeddingRate}
            color={data.lessonImplementation.embeddingRate >= 50 ? "blue" : "red"}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-lg font-bold text-gray-800">
            {data.reviewCompliance.averageReviewDays}d
          </div>
          <div className="text-[10px] text-gray-500 uppercase">Avg Review</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-lg font-bold text-orange-600">
            {data.reviewCompliance.reviewsOverdue}
          </div>
          <div className="text-[10px] text-gray-500 uppercase">Overdue</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-lg font-bold text-purple-600">
            {data.patterns.length}
          </div>
          <div className="text-[10px] text-gray-500 uppercase">Patterns</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-lg font-bold text-red-600">
            {data.repeatIncidentRate}%
          </div>
          <div className="text-[10px] text-gray-500 uppercase">Repeat Rate</div>
        </div>
      </div>

      {/* Actions */}
      {data.immediateActions.length > 0 &&
        !data.immediateActions[0].startsWith("No immediate actions") && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-amber-800 mb-2">Improvement Actions</h4>
            <ul className="space-y-1">
              {data.immediateActions.slice(0, 3).map((action, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT")
                      ? "🔴"
                      : action.startsWith("HIGH")
                        ? "🟠"
                        : "🟡"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Expandable Details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details ▲" : "Show details ▼"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Patterns */}
          {data.patterns.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Detected Patterns ({data.patternsAddressed} addressed, {data.patternsUnaddressed} unaddressed)
              </h4>
              <div className="space-y-2">
                {data.patterns.map((p, i) => (
                  <PatternChip key={i} pattern={p} />
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                    <span className="mt-0.5">+</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Development */}
          {data.areasForDevelopment.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-800 mb-2">Areas for Development</h4>
              <ul className="space-y-1">
                {data.areasForDevelopment.map((a, i) => (
                  <li key={i} className="text-xs text-orange-700 flex items-start gap-1.5">
                    <span className="mt-0.5">-</span>
                    <span>{a}</span>
                  </li>
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
                  <li key={i} className="text-xs text-gray-600">
                    {link}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
