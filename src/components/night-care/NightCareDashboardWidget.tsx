"use client";

import { useState, useEffect } from "react";
import type { NightCareIntelligence } from "@/lib/night-care";

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function ScoreBar({ score, label, maxScore = 100 }: { score: number; label: string; maxScore?: number }) {
  const pct = (score / maxScore) * 100;
  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-44 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-sm font-medium w-12 text-right">{score}</span>
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

function Stat({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div>
      <span className="text-gray-500 text-sm">{label}:</span>{" "}
      <span className="font-medium text-sm">{value}{suffix}</span>
    </div>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────────

export default function NightCareDashboardWidget() {
  const [data, setData] = useState<NightCareIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/night-care")
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
        <h3 className="text-lg font-semibold text-red-800">Night Care</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Night Care</h3>
          <p className="text-sm text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span
            className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}
          >
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.quality.totalRecords}</div>
          <div className="text-xs text-gray-500 mt-1">Night Records</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.quality.nightCheckCompletedRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Night Checks</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.compliance.documentationRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Documentation</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.staffReadiness.totalStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Trained Staff</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.quality.overallScore} label="Quality" maxScore={25} />
        <ScoreBar score={data.compliance.overallScore} label="Compliance" maxScore={25} />
        <ScoreBar score={data.policy.overallScore} label="Policy" maxScore={25} />
        <ScoreBar score={data.staffReadiness.overallScore} label="Staff Readiness" maxScore={25} />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <Section title="Quality" defaultOpen>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Night Checks" value={data.quality.nightCheckCompletedRate} suffix="%" />
            <Stat label="Sleep Patterns" value={data.quality.sleepPatternRecordedRate} suffix="%" />
            <Stat label="Incidents Handled" value={data.quality.incidentHandledAppropriatelyRate} suffix="%" />
            <Stat label="Comfort Checked" value={data.quality.childComfortCheckedRate} suffix="%" />
          </div>
        </Section>

        <Section title="Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Documentation" value={data.compliance.documentationRate} suffix="%" />
            <Stat label="Timely Recording" value={data.compliance.timelyRecordingRate} suffix="%" />
            <Stat label="Night Checks" value={data.compliance.nightCheckCompletedRate} suffix="%" />
            <Stat label="Categories Covered" value={`${data.compliance.uniqueCategories}/8`} />
          </div>
        </Section>

        <Section title="Policy">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              ["Night Care Policy", data.policy.nightCarePolicy],
              ["Sleep Monitoring", data.policy.sleepMonitoringGuidance],
              ["Incident Procedure", data.policy.nightIncidentProcedure],
              ["Waking Night", data.policy.wakingNightPolicy],
              ["Medication Protocol", data.policy.nightMedicationProtocol],
              ["Bedtime Routine", data.policy.bedtimeRoutineGuidance],
              ["Handover Procedure", data.policy.nightHandoverProcedure],
            ] as [string, boolean][]).map(([label, ok]) => (
              <span
                key={label}
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
              >
                {ok ? "✓" : "✗"} {label}
              </span>
            ))}
          </div>
        </Section>

        <Section title="Staff Readiness">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Stat label="Total Staff" value={data.staffReadiness.totalStaff} />
            <Stat label="Night Care Competency" value={data.staffReadiness.nightCareCompetencyRate} suffix="%" />
            <Stat label="Sleep Monitoring" value={data.staffReadiness.sleepMonitoringSkillsRate} suffix="%" />
            <Stat label="Incident Response" value={data.staffReadiness.nightIncidentResponseRate} suffix="%" />
            <Stat label="Medication Handling" value={data.staffReadiness.nightMedicationHandlingRate} suffix="%" />
            <Stat label="Comfort Techniques" value={data.staffReadiness.childComfortTechniquesRate} suffix="%" />
          </div>
        </Section>

        {data.childProfiles.length > 0 && (
          <Section title="Child Profiles">
            <div className="space-y-2">
              {data.childProfiles.map((cp) => (
                <div key={cp.childId} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div>
                    <span className="font-medium text-sm text-gray-900">{cp.childName}</span>
                    <span className="text-xs text-gray-500 ml-2">{cp.totalRecords} records</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>Checks: {cp.nightCheckCompletedRate}%</span>
                    <span>Sleep: {cp.sleepPatternRecordedRate}%</span>
                    <span>Categories: {cp.uniqueCategories}</span>
                    <span className="font-semibold text-gray-900">{cp.overallScore}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Strengths, Areas & Actions">
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-1">Strengths</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-amber-700 mb-1">Areas for Improvement</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.areasForImprovement.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
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

        <Section title="Regulatory Framework">
          <ul className="text-sm text-gray-600 space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">{"§"}</span>
                <span>{link}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
