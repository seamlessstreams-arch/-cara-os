"use client";

import { useState, useEffect } from "react";
import type { MedicationErrorPreventionIntelligence } from "@/lib/medication-error-prevention";
import { formatRate, meets } from "@/lib/metrics/rate";

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

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

export function MedicationErrorPreventionDashboardWidget() {
  const [data, setData] = useState<MedicationErrorPreventionIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/medication-error-prevention")
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-200 rounded" />)}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800">Medication Error Prevention</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">Medication Error Prevention</h3>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.administrationQuality.totalAdministrations}</div>
          <div className="text-xs text-gray-500 mt-1">Administrations</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.administrationQuality.onTimeRate)}</div>
          <div className="text-xs text-gray-500 mt-1">On-Time Rate</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${data.errorManagement.totalErrors === 0 ? "text-green-600" : "text-amber-600"}`}>
            {data.errorManagement.totalErrors}
          </div>
          <div className="text-xs text-gray-500 mt-1">Errors</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.storageSafety.fullyCompliantRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Storage Compliant</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.trainingCompliance.currentRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Training Current</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.administrationQuality.overallScore} label="Administration Quality" maxScore={25} />
        <ScoreBar score={data.errorManagement.overallScore} label="Error Management" maxScore={25} />
        <ScoreBar score={data.storageSafety.overallScore} label="Storage Safety" maxScore={25} />
        <ScoreBar score={data.trainingCompliance.overallScore} label="Training Compliance" maxScore={25} />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Medication Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm text-gray-500">{child.overallScore}/10</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <StatusBadge ok={meets(child.onTimeRate, 90)} label={`On-Time ${formatRate(child.onTimeRate)}`} />
                    <StatusBadge ok={child.errorCount === 0} label={`Errors: ${child.errorCount}`} />
                    <StatusBadge ok={child.missedCount === 0} label={`Missed: ${child.missedCount}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Administrations: <span className="font-medium">{child.administrationCount}</span></div>
                    <div>On-Time: <span className="font-medium">{formatRate(child.onTimeRate)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Administration Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.administrationQuality.totalAdministrations}</span></div>
            <div><span className="text-gray-500">On-Time:</span> <span className="font-medium">{formatRate(data.administrationQuality.onTimeRate)}</span></div>
            <div><span className="text-gray-500">Missed/Refused:</span> <span className={`font-medium ${data.administrationQuality.missedRefusedCount > 0 ? "text-amber-600" : "text-gray-900"}`}>{data.administrationQuality.missedRefusedCount}</span></div>
            <div><span className="text-gray-500">Two-Person Check:</span> <span className="font-medium">{formatRate(data.administrationQuality.twoPersonCheckRate)}</span></div>
            <div><span className="text-gray-500">Documented Immediately:</span> <span className="font-medium">{formatRate(data.administrationQuality.documentedImmediatelyRate)}</span></div>
            <div><span className="text-gray-500">Child Consent:</span> <span className="font-medium">{formatRate(data.administrationQuality.childConsentRate)}</span></div>
            <div><span className="text-gray-500">Side Effects Monitored:</span> <span className="font-medium">{formatRate(data.administrationQuality.sideEffectsMonitoredRate)}</span></div>
          </div>
        </Section>

        <Section title="Error Management">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total Errors:</span> <span className={`font-medium ${data.errorManagement.totalErrors > 0 ? "text-amber-600" : "text-green-600"}`}>{data.errorManagement.totalErrors}</span></div>
            <div><span className="text-gray-500">Near Misses:</span> <span className="font-medium">{data.errorManagement.nearMissCount}</span></div>
            <div><span className="text-gray-500">No Harm:</span> <span className="font-medium">{formatRate(data.errorManagement.noHarmRate)}</span></div>
            <div><span className="text-gray-500">Reported Immediately:</span> <span className="font-medium">{formatRate(data.errorManagement.reportedImmediatelyRate)}</span></div>
            <div><span className="text-gray-500">Root Cause Identified:</span> <span className="font-medium">{formatRate(data.errorManagement.rootCauseIdentifiedRate)}</span></div>
            <div><span className="text-gray-500">Preventive Action:</span> <span className="font-medium">{formatRate(data.errorManagement.preventiveActionRate)}</span></div>
            <div><span className="text-gray-500">Duty of Candour:</span> <span className="font-medium">{formatRate(data.errorManagement.dutyOfCandourRate)}</span></div>
          </div>
        </Section>

        <Section title="Storage Safety">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total Audits:</span> <span className="font-medium">{data.storageSafety.totalAudits}</span></div>
            <div><span className="text-gray-500">Fully Compliant:</span> <span className="font-medium">{formatRate(data.storageSafety.fullyCompliantRate)}</span></div>
            <div><span className="text-gray-500">Temperature OK:</span> <span className="font-medium">{formatRate(data.storageSafety.temperatureComplianceRate)}</span></div>
            <div><span className="text-gray-500">Expiry Compliance:</span> <span className="font-medium">{formatRate(data.storageSafety.expiryComplianceRate)}</span></div>
            <div><span className="text-gray-500">MAR Chart Accuracy:</span> <span className="font-medium">{formatRate(data.storageSafety.marChartAccuracyRate)}</span></div>
            <div><span className="text-gray-500">Expired Found:</span> <span className={`font-medium ${data.storageSafety.expiredMedicationAudits > 0 ? "text-red-600" : "text-green-600"}`}>{data.storageSafety.expiredMedicationAudits}</span></div>
          </div>
        </Section>

        <Section title="Training Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total Staff:</span> <span className="font-medium">{data.trainingCompliance.totalStaff}</span></div>
            <div><span className="text-gray-500">Current:</span> <span className="font-medium">{formatRate(data.trainingCompliance.currentRate)}</span></div>
            <div><span className="text-gray-500">Competency Assessed:</span> <span className="font-medium">{formatRate(data.trainingCompliance.competencyAssessedRate)}</span></div>
            <div><span className="text-gray-500">Controlled Drugs:</span> <span className="font-medium">{formatRate(data.trainingCompliance.controlledDrugsRate)}</span></div>
            <div><span className="text-gray-500">Error Reporting:</span> <span className="font-medium">{formatRate(data.trainingCompliance.errorReportingRate)}</span></div>
            <div><span className="text-gray-500">Expiring Soon:</span> <span className={`font-medium ${data.trainingCompliance.expiringCount > 0 ? "text-amber-600" : "text-gray-900"}`}>{data.trainingCompliance.expiringCount}</span></div>
          </div>
        </Section>

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
