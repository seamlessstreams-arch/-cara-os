"use client";

import { useState, useEffect } from "react";
import type { EmotionalRegulationDevelopmentIntelligence } from "@/lib/emotional-regulation-development";

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

function boolBadge(val: boolean, label: string) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${val ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
      {val ? "Yes" : "No"} — {label}
    </span>
  );
}

function ScoreBar({ label, score, max = 25, color }: { label: string; score: number; max?: number; color?: string }) {
  const percentage = max > 0 ? (score / max) * 100 : 0;
  const barColor = color || (percentage >= 80 ? "bg-green-500" : percentage >= 60 ? "bg-blue-500" : percentage >= 40 ? "bg-amber-500" : "bg-red-500");
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-48 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${barColor}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
      <span className="text-sm font-medium w-14 text-right">{score}/{max}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
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

export default function EmotionalRegulationDevelopmentDashboardWidget() {
  const [data, setData] = useState<EmotionalRegulationDevelopmentIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/emotional-regulation-development")
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
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
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-200 rounded" />)}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-gray-200 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800">Emotional Regulation Development</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Emotional Regulation Development</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}>
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      {/* Stat Boxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Sessions" value={data.regulationQuality.totalSessions} />
        <Stat label="Improvement Rate" value={`${data.regulationQuality.improvementRate}%`} />
        <Stat label="Child-Initiated" value={`${data.regulationQuality.childInitiatedRate}%`} />
        <Stat label="Staff Trained" value={data.staffReadiness.totalStaff} />
      </div>

      {/* Score Bars */}
      <div className="space-y-2">
        <ScoreBar label="Regulation Quality" score={data.regulationQuality.overallScore} max={25} />
        <ScoreBar label="Regulation Compliance" score={data.regulationCompliance.overallScore} max={25} />
        <ScoreBar label="Regulation Policy" score={data.regulationPolicy.overallScore} max={25} />
        <ScoreBar label="Staff Readiness" score={data.staffReadiness.overallScore} max={25} />
      </div>

      {/* Policy Status */}
      <Section title="Policy Status" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {boolBadge(data.regulationPolicy.emotionalWellbeingStrategy, "Emotional Wellbeing Strategy")}
          {boolBadge(data.regulationPolicy.therapeuticApproachFramework, "Therapeutic Approach Framework")}
          {boolBadge(data.regulationPolicy.crisisInterventionProtocol, "Crisis Intervention Protocol")}
          {boolBadge(data.regulationPolicy.deEscalationProcedure, "De-Escalation Procedure")}
          {boolBadge(data.regulationPolicy.sensoryEnvironmentPolicy, "Sensory Environment Policy")}
          {boolBadge(data.regulationPolicy.staffEmotionalSupportGuidance, "Staff Emotional Support Guidance")}
          {boolBadge(data.regulationPolicy.regularReview, "Regular Review")}
        </div>
      </Section>

      {/* Child Profiles */}
      <Section title="Child Emotional Regulation Profiles" defaultOpen={true}>
        {data.childProfiles.map((child) => (
          <div key={child.childId} className="border border-gray-100 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{child.childName}</span>
              <span className="text-sm font-medium text-gray-600">{child.overallScore}/10</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
              <div>Sessions: {child.totalSessions}</div>
              <div>Improvement: {child.improvementRate}%</div>
              <div>Child-Initiated: {child.childInitiatedRate}%</div>
            </div>
          </div>
        ))}
      </Section>

      {/* Strengths */}
      {data.strengths.length > 0 && (
        <Section title="Strengths" defaultOpen={false}>
          <ul className="space-y-1">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-green-500 shrink-0">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Areas for Improvement */}
      {data.areasForImprovement.length > 0 && (
        <Section title="Areas for Improvement" defaultOpen={false}>
          <ul className="space-y-1">
            {data.areasForImprovement.map((a, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-amber-500 shrink-0">!</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Actions */}
      {data.actions.length > 0 && (
        <Section title="Actions" defaultOpen={false}>
          <ul className="space-y-1">
            {data.actions.map((a, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-blue-500 shrink-0">&gt;</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Regulatory Links */}
      <Section title="Regulatory Links" defaultOpen={false}>
        <ul className="space-y-1">
          {data.regulatoryLinks.map((link, i) => (
            <li key={i} className="text-xs text-gray-600">{link}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
