"use client";

import { useState, useEffect } from "react";
import type { MedicationAdherenceMonitoringIntelligence } from "@/lib/medication-adherence-monitoring";

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

function Stat({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div>
      <span className="text-gray-500">{label}:</span>{" "}
      <span className="font-medium">{value}{suffix}</span>
    </div>
  );
}

export default function MedicationAdherenceMonitoringDashboardWidget() {
  const [data, setData] = useState<MedicationAdherenceMonitoringIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/medication-adherence-monitoring")
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
          <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-200 rounded" />)}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800">Medication Adherence Monitoring</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Medication Adherence Monitoring</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}>
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.administrationQuality.totalRecords}</div>
          <div className="text-xs text-gray-500 mt-1">Records</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.administrationQuality.correctAdministrationRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Correct Admin</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.administrationQuality.twoStaffWitnessedRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Dual Witnessed</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${data.medicationSafety.errorRate === 0 ? "text-green-600" : "text-amber-600"}`}>{data.medicationSafety.errorRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Error Rate</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.staffMedicationReadiness.totalStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Staff Trained</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.administrationQuality.overallScore} label="Administration Quality" maxScore={25} />
        <ScoreBar score={data.medicationSafety.overallScore} label="Medication Safety" maxScore={25} />
        <ScoreBar score={data.medicationPolicy.overallScore} label="Medication Policy" maxScore={25} />
        <ScoreBar score={data.staffMedicationReadiness.overallScore} label="Staff Readiness" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childMedicationProfiles.length > 0 && (
          <Section title="Child Medication Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childMedicationProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm font-medium text-gray-600">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Records: <span className="font-medium">{child.totalRecords}</span></div>
                    <div>Correct Admin: <span className="font-medium">{child.correctAdministrationRate}%</span></div>
                    <div>Documented: <span className="font-medium">{child.documentedImmediatelyRate}%</span></div>
                    <div>Error Rate: <span className={`font-medium ${child.errorRate > 0 ? "text-amber-600" : "text-green-600"}`}>{child.errorRate}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Administration Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Records" value={data.administrationQuality.totalRecords} />
            <Stat label="Correct Admin" value={data.administrationQuality.correctAdministrationRate} suffix="%" />
            <Stat label="Two Staff" value={data.administrationQuality.twoStaffWitnessedRate} suffix="%" />
            <Stat label="Documented" value={data.administrationQuality.documentedImmediatelyRate} suffix="%" />
            <Stat label="Consent" value={data.administrationQuality.consentObtainedRate} suffix="%" />
            <Stat label="Side Effects" value={data.administrationQuality.sideEffectsMonitoredRate} suffix="%" />
          </div>
        </Section>

        <Section title="Medication Safety">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Records" value={data.medicationSafety.totalRecords} />
            <Stat label="Error Rate" value={data.medicationSafety.errorRate} suffix="%" />
            <Stat label="Storage Correct" value={data.medicationSafety.storageCorrectRate} suffix="%" />
            <Stat label="Review Compliance" value={data.medicationSafety.reviewComplianceRate} suffix="%" />
          </div>
        </Section>

        <Section title="Medication Policy">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Administration Policy" value={data.medicationPolicy.medicationAdministrationPolicy ? "Yes" : "No"} />
            <Stat label="Controlled Drugs" value={data.medicationPolicy.controlledDrugsProtocol ? "Yes" : "No"} />
            <Stat label="Consent Framework" value={data.medicationPolicy.consentFramework ? "Yes" : "No"} />
            <Stat label="Error Reporting" value={data.medicationPolicy.errorReportingProcess ? "Yes" : "No"} />
            <Stat label="Storage Audit" value={data.medicationPolicy.storageAuditSchedule ? "Yes" : "No"} />
            <Stat label="Competency Check" value={data.medicationPolicy.staffCompetencyCheck ? "Yes" : "No"} />
            <Stat label="Regular Review" value={data.medicationPolicy.regularReview ? "Yes" : "No"} />
          </div>
        </Section>

        <Section title="Staff Medication Readiness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Staff" value={data.staffMedicationReadiness.totalStaff} />
            <Stat label="Med Admin" value={data.staffMedicationReadiness.medicationAdministrationRate} suffix="%" />
            <Stat label="Controlled Drugs" value={data.staffMedicationReadiness.controlledDrugsRate} suffix="%" />
            <Stat label="Error Reporting" value={data.staffMedicationReadiness.errorReportingRate} suffix="%" />
            <Stat label="Consent" value={data.staffMedicationReadiness.consentPracticeRate} suffix="%" />
            <Stat label="Side Effects" value={data.staffMedicationReadiness.sideEffectRecognitionRate} suffix="%" />
            <Stat label="Storage" value={data.staffMedicationReadiness.storageComplianceRate} suffix="%" />
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
                <span className="text-blue-400 mt-0.5">&sect;</span>
                <span>{link}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
