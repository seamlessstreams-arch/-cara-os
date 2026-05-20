"use client";

import { useEffect, useState } from "react";

/* ──────────────────────────────────────────────────────────────
   HealthDashboardWidget — Health Intelligence dashboard card
   ────────────────────────────────────────────────────────────── */

interface HealthData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  healthQuality: {
    overallScore: number;
    totalRecords: number;
    completedOnTimeRate: number;
    childConsentRate: number;
    actionPlanRate: number;
    followUpRate: number;
  };
  healthCompliance: {
    overallScore: number;
    documentedRate: number;
    gpNotifiedRate: number;
    parentInformedRate: number;
    typeDiversityRatio: number;
  };
  healthPolicy: {
    overallScore: number;
  };
  staffHealthReadiness: {
    overallScore: number;
    totalStaff: number;
  };
  childProfiles: {
    childId: string;
    childName: string;
    totalAssessments: number;
    overallScore: number;
    completedOnTimeRate: number;
  }[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

const RATING_COLORS: Record<string, string> = {
  outstanding: "bg-green-100 text-green-800 border-green-300",
  good: "bg-blue-100 text-blue-800 border-blue-300",
  requires_improvement: "bg-amber-100 text-amber-800 border-amber-300",
  inadequate: "bg-red-100 text-red-800 border-red-300",
};

const RATING_LABELS: Record<string, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

function ScoreBar({ score, label, max = 25 }: { score: number; label: string; max?: number }) {
  const pctVal = (score / max) * 100;
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
      <span className="text-sm font-medium w-12 text-right">{score}/{max}</span>
    </div>
  );
}

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
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

export default function HealthDashboardWidget() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
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
        <h3 className="text-lg font-semibold text-red-800">Health Intelligence</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Health Intelligence</h3>
          <p className="text-sm text-gray-500">
            {data.periodStart} to {data.periodEnd}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full border ${RATING_COLORS[data.rating] ?? "bg-gray-100 text-gray-800 border-gray-300"}`}>
            {RATING_LABELS[data.rating] ?? data.rating}
          </span>
        </div>
      </div>

      {/* Evaluator scores */}
      <div className="space-y-2">
        <ScoreBar score={data.healthQuality.overallScore} label="Health Quality" />
        <ScoreBar score={data.healthCompliance.overallScore} label="Health Compliance" />
        <ScoreBar score={data.healthPolicy.overallScore} label="Health Policy" />
        <ScoreBar score={data.staffHealthReadiness.overallScore} label="Staff Readiness" />
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{data.healthQuality.totalRecords}</p>
          <p className="text-xs text-gray-500">Assessments</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{data.healthQuality.completedOnTimeRate}%</p>
          <p className="text-xs text-gray-500">On Time</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{data.healthCompliance.documentedRate}%</p>
          <p className="text-xs text-gray-500">Documented</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{data.staffHealthReadiness.totalStaff}</p>
          <p className="text-xs text-gray-500">Staff Trained</p>
        </div>
      </div>

      {/* Child profiles */}
      {data.childProfiles.length > 0 && (
        <Section title={`Child Profiles (${data.childProfiles.length})`} defaultOpen>
          <div className="divide-y divide-gray-100">
            {data.childProfiles.map((cp) => (
              <div key={cp.childId} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{cp.childName}</p>
                  <p className="text-xs text-gray-500">
                    {cp.totalAssessments} assessments, {cp.completedOnTimeRate}% on time
                  </p>
                </div>
                <span className={`text-sm font-semibold ${cp.overallScore >= 7 ? "text-green-600" : cp.overallScore >= 4 ? "text-amber-600" : "text-red-600"}`}>
                  {cp.overallScore}/10
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Strengths */}
      {data.strengths.length > 0 && (
        <Section title="Strengths">
          <ul className="space-y-1">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-sm text-green-700 flex gap-2">
                <span className="shrink-0">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Areas for improvement */}
      {data.areasForImprovement.length > 0 && (
        <Section title="Areas for Improvement">
          <ul className="space-y-1">
            {data.areasForImprovement.map((a, i) => (
              <li key={i} className="text-sm text-amber-700 flex gap-2">
                <span className="shrink-0">-</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Actions */}
      {data.actions.length > 0 && (
        <Section title="Actions" defaultOpen>
          <ul className="space-y-1">
            {data.actions.map((a, i) => (
              <li key={i} className={`text-sm flex gap-2 ${a.startsWith("URGENT") ? "text-red-700 font-medium" : "text-gray-700"}`}>
                <span className="shrink-0">{a.startsWith("URGENT") ? "!" : "•"}</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Regulatory links */}
      <Section title="Regulatory Framework">
        <ul className="space-y-1">
          {data.regulatoryLinks.map((l, i) => (
            <li key={i} className="text-xs text-gray-500">{l}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
