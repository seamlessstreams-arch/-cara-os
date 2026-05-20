"use client";

import { useState, useEffect } from "react";

/* ──────────────────────────────────────────────────────────────
   Supervision Dashboard Widget

   Fetches from /api/supervision and reads json.data.
   React + Tailwind only — no external UI libraries.
   ────────────────────────────────────────────────────────────── */

// ── Local types (mirrors engine output) ──────────────────────────────────────

interface StaffSupervisionProfile {
  staffId: string;
  staffName: string;
  sessionCount: number;
  overallScore: number;
  frequencyScore: number;
  contentScore: number;
  reflectiveScore: number;
  diversityScore: number;
}

interface SupervisionData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  supervisionQuality: {
    overallScore: number;
    contentRate: number;
    reflectiveRate: number;
    safeguardingRate: number;
    wellbeingRate: number;
  };
  supervisionCompliance: {
    overallScore: number;
    documentedRate: number;
    withinTimescaleRate: number;
    actionsReviewedRate: number;
  };
  supervisionPolicy: {
    overallScore: number;
  };
  staffReadiness: {
    overallScore: number;
  };
  staffProfiles: StaffSupervisionProfile[];
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

// ── Rating helpers ───────────────────────────────────────────────────────────

const ratingColors: Record<string, string> = {
  outstanding: "bg-green-100 text-green-800 border-green-300",
  good: "bg-blue-100 text-blue-800 border-blue-300",
  requires_improvement: "bg-amber-100 text-amber-800 border-amber-300",
  inadequate: "bg-red-100 text-red-800 border-red-300",
};

const ratingLabels: Record<string, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// ── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ score, label, maxScore = 25 }: { score: number; label: string; maxScore?: number }) {
  const pctVal = (score / maxScore) * 100;
  const color =
    pctVal >= 80 ? "bg-green-500" :
    pctVal >= 60 ? "bg-blue-500" :
    pctVal >= 40 ? "bg-amber-500" :
    "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-40 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pctVal, 100)}%` }} />
      </div>
      <span className="text-sm font-medium w-14 text-right">{score}/{maxScore}</span>
    </div>
  );
}

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

// ── Main Widget ──────────────────────────────────────────────────────────────

export default function SupervisionDashboardWidget() {
  const [data, setData] = useState<SupervisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/supervision")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => setData(json.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800">Supervision Intelligence</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Supervision Intelligence</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}>
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.supervisionQuality.contentRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Content Quality</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.supervisionCompliance.documentedRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Documented</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.supervisionQuality.reflectiveRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Reflective</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.supervisionQuality.safeguardingRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Safeguarding</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.supervisionQuality.overallScore} label="Quality" />
        <ScoreBar score={data.supervisionCompliance.overallScore} label="Compliance" />
        <ScoreBar score={data.supervisionPolicy.overallScore} label="Policy" />
        <ScoreBar score={data.staffReadiness.overallScore} label="Staff Readiness" />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {/* Staff Supervision Profiles */}
        {data.staffProfiles.length > 0 && (
          <Section title="Staff Supervision Profiles" defaultOpen>
            <div className="space-y-3">
              {data.staffProfiles.map((profile) => (
                <div key={profile.staffId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{profile.staffName}</span>
                    <span className="text-sm text-gray-500">{profile.overallScore}/10</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${profile.sessionCount >= 5 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {profile.sessionCount} sessions
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${profile.contentScore >= 2 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      Content: {profile.contentScore}/3
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${profile.reflectiveScore >= 2 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      Reflective: {profile.reflectiveScore}/3
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${profile.diversityScore >= 1 ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-700"}`}>
                      Diversity: {profile.diversityScore}/2
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Strengths, Areas & Actions */}
        <Section title="Strengths, Areas & Actions">
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-1">Strengths</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-amber-700 mb-1">Areas for Improvement</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.areasForImprovement.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
          {data.actions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-1">Recommended Actions</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.actions.map((a, i) => (
                  <li key={i} className={a.startsWith("URGENT") ? "text-red-700 font-medium" : ""}>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        {/* Regulatory Framework */}
        <Section title="Regulatory Framework">
          <ul className="text-sm text-gray-600 space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">§</span>
                <span>{link}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
