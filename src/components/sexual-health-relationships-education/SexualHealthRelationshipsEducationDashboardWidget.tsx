"use client";

// ══════════════════════════════════════════════════════════════════════════════
// SEXUAL HEALTH & RELATIONSHIPS EDUCATION DASHBOARD WIDGET
//
// Displays the 4-layer RSE intelligence:
// - Overall score with rating
// - Layer scores: RSE delivery, sexual health access, policy quality, staff readiness
// - Child RSE profiles
// - Strengths, areas for improvement, and actions
// - Regulatory references
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Local interfaces (mirrors API shape) ──────────────────────────────────

interface ChildRSESummary {
  childId: string;
  childName: string;
  sessionsAttended: number;
  topicsCovered: string[];
  averageEngagement: number;
  referralsMade: number;
  score: number;
}

interface SHREData {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  rseDeliveryScore: number;
  sexualHealthAccessScore: number;
  rsePolicyQualityScore: number;
  staffRSEReadinessScore: number;
  childRSESummaries: ChildRSESummary[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  meta?: {
    topicAreaLabels: Record<string, string>;
    deliveryMethodLabels: Record<string, string>;
    ageAppropriatenessLabels: Record<string, string>;
    engagementLevelLabels: Record<string, string>;
    ratingLabels: Record<string, string>;
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

// ── Score Bar ──────────────────────────────────────────────────────────────

function ScoreBar({
  label,
  score,
  max = 25,
}: {
  label: string;
  score: number;
  max?: number;
}) {
  const percentage = Math.round((score / max) * 100);
  const barColor =
    percentage >= 80
      ? "bg-green-500"
      : percentage >= 60
        ? "bg-blue-500"
        : percentage >= 40
          ? "bg-orange-500"
          : "bg-red-500";

  const textColor =
    percentage >= 80
      ? "text-green-700"
      : percentage >= 60
        ? "text-blue-700"
        : percentage >= 40
          ? "text-orange-700"
          : "text-red-700";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className={`text-xs font-bold ${textColor}`}>
          {score}/{max}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ── Stat Box ──────────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  color = "gray",
}: {
  label: string;
  value: string | number;
  color?: "green" | "blue" | "orange" | "red" | "gray";
}) {
  const colorClasses: Record<string, string> = {
    green: "bg-green-50 text-green-700",
    blue: "bg-blue-50 text-blue-700",
    orange: "bg-orange-50 text-orange-700",
    red: "bg-red-50 text-red-700",
    gray: "bg-gray-50 text-gray-700",
  };

  return (
    <div className={`rounded-lg p-2.5 text-center ${colorClasses[color]}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] font-medium mt-0.5">{label}</div>
    </div>
  );
}

// ── Collapsible Section ───────────────────────────────────────────────────

function CollapsibleSection({
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
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        <span className="text-gray-500 text-xs">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

// ── Child Profile Row ─────────────────────────────────────────────────────

function ChildProfileRow({ child }: { child: ChildRSESummary }) {
  const scoreColor =
    child.score >= 8
      ? "bg-green-100 text-green-700"
      : child.score >= 5
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{child.childName}</span>
          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
            {child.sessionsAttended} sessions
          </span>
          {child.referralsMade > 0 && (
            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
              {child.referralsMade} referral{child.referralsMade !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex gap-1 flex-wrap mt-1">
          {child.topicsCovered.map((topic) => (
            <span
              key={topic}
              className="text-[9px] bg-purple-50 text-purple-600 px-1 py-0.5 rounded"
            >
              {topic.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      </div>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ml-2 ${scoreColor}`}
      >
        {child.score}/10
      </span>
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function SexualHealthRelationshipsEducationDashboardWidget() {
  const [data, setData] = useState<SHREData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/sexual-health-relationships-education");
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

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-2/5 mb-4" />
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-6" />
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
        <div className="h-24 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">
          Sexual Health & Relationships Education
        </h3>
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
            Sexual Health & Relationships Education
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.periodStart} to {data.periodEnd} |{" "}
            {data.childRSESummaries.length} children
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* 4 Score Bars */}
      <div className="space-y-3 mb-5">
        <ScoreBar label="RSE Delivery" score={data.rseDeliveryScore} />
        <ScoreBar label="Sexual Health Access" score={data.sexualHealthAccessScore} />
        <ScoreBar label="RSE Policy Quality" score={data.rsePolicyQualityScore} />
        <ScoreBar label="Staff RSE Readiness" score={data.staffRSEReadinessScore} />
      </div>

      {/* Stat Boxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        <StatBox
          label="Overall Score"
          value={`${data.overallScore}/100`}
          color={
            data.overallScore >= 80
              ? "green"
              : data.overallScore >= 60
                ? "blue"
                : data.overallScore >= 40
                  ? "orange"
                  : "red"
          }
        />
        <StatBox
          label="Children"
          value={data.childRSESummaries.length}
          color="blue"
        />
        <StatBox
          label="Rating"
          value={data.meta?.ratingLabel ?? data.rating}
          color={
            data.rating === "outstanding"
              ? "green"
              : data.rating === "good"
                ? "blue"
                : data.rating === "requires_improvement"
                  ? "orange"
                  : "red"
          }
        />
        <StatBox
          label="Period"
          value={`${data.periodStart.slice(5)} - ${data.periodEnd.slice(5)}`}
          color="gray"
        />
      </div>

      {/* Urgent Actions */}
      {data.actions.length > 0 &&
        !data.actions[0].startsWith("No immediate actions") && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5">
            <h4 className="text-sm font-semibold text-red-800 mb-2">
              Actions Required
            </h4>
            <ul className="space-y-1">
              {data.actions.slice(0, 5).map((action, i) => (
                <li
                  key={i}
                  className="text-xs text-red-700 flex items-start gap-1.5"
                >
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT")
                      ? "●"
                      : action.startsWith("HIGH")
                        ? "○"
                        : action.startsWith("MEDIUM")
                          ? "▪"
                          : "▫"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Collapsible Sections */}
      <div className="space-y-3">
        {/* Child Profiles */}
        <CollapsibleSection title="Child RSE Profiles" defaultOpen>
          {data.childRSESummaries.length > 0 ? (
            <div className="bg-gray-50 rounded-lg p-3">
              {data.childRSESummaries.map((child) => (
                <ChildProfileRow key={child.childId} child={child} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-2">
              No child profiles available
            </p>
          )}
        </CollapsibleSection>

        {/* Strengths */}
        {data.strengths.length > 0 && (
          <CollapsibleSection title="Strengths">
            <ul className="space-y-1.5">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0 text-green-500">+</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* Areas for Improvement */}
        {data.areasForImprovement.length > 0 && (
          <CollapsibleSection title="Areas for Improvement">
            <ul className="space-y-1.5">
              {data.areasForImprovement.map((a, i) => (
                <li key={i} className="text-xs text-orange-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0 text-orange-500">-</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* Actions */}
        {data.actions.length > 0 && (
          <CollapsibleSection title="All Actions">
            <ul className="space-y-1.5">
              {data.actions.map((action, i) => (
                <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("URGENT")
                      ? "●"
                      : action.startsWith("HIGH")
                        ? "○"
                        : action.startsWith("MEDIUM")
                          ? "▪"
                          : "▫"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* Regulatory Links */}
        {data.regulatoryLinks.length > 0 && (
          <CollapsibleSection title="Regulatory References">
            <ul className="space-y-1">
              {data.regulatoryLinks.map((link, i) => (
                <li key={i} className="text-xs text-gray-600">
                  {link}
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}
