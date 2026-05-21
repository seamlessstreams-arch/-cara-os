"use client";

import { useEffect, useState } from "react";

function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colour = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="font-medium">{value}/{max}</span></div>
      <div className="w-full h-2 bg-gray-200 rounded"><div className={`${colour} h-2 rounded`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="bg-gray-50 rounded p-3 text-center"><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-semibold">{String(value)}</p></div>;
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded mb-3">
      <button className="w-full flex justify-between items-center p-3 text-left font-medium text-sm" onClick={() => setOpen(!open)}>{title}<span>{open ? "▲" : "▼"}</span></button>
      {open && <div className="p-3 pt-0">{children}</div>}
    </div>
  );
}

function ratingBadge(rating: string) {
  const colours: Record<string, string> = { outstanding: "bg-green-100 text-green-800", good: "bg-yellow-100 text-yellow-800", requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>;
}

export function MedicationAdherenceMonitoringIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/medication-adherence-monitoring")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading medication adherence monitoring intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const aq = d.administrationQuality as Record<string, number>;
  const ms = d.medicationSafety as Record<string, number>;
  const mp = d.medicationPolicy as Record<string, unknown>;
  const sr = d.staffMedicationReadiness as Record<string, number>;
  const profiles = (d.childMedicationProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Medication Adherence Monitoring Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Total Records" value={aq.totalRecords} />
        <Stat label="Correct Admin" value={`${aq.correctAdministrationRate}%`} />
        <Stat label="Error Rate" value={`${ms.errorRate}%`} />
      </div>

      <ScoreBar label="Administration Quality" value={aq.overallScore} />
      <ScoreBar label="Medication Safety" value={ms.overallScore} />
      <ScoreBar label="Medication Policy" value={mp.overallScore as number} />
      <ScoreBar label="Staff Readiness" value={sr.overallScore} />

      <Section title="Administration Quality" defaultOpen>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Correct Administration" value={`${aq.correctAdministrationRate}%`} />
          <Stat label="Two-Staff Witnessed" value={`${aq.twoStaffWitnessedRate}%`} />
          <Stat label="Documented Immediately" value={`${aq.documentedImmediatelyRate}%`} />
          <Stat label="Consent Obtained" value={`${aq.consentObtainedRate}%`} />
          <Stat label="Side Effects Monitored" value={`${aq.sideEffectsMonitoredRate}%`} />
        </div>
      </Section>

      <Section title="Medication Safety">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Error Rate" value={`${ms.errorRate}%`} />
          <Stat label="Storage Correct" value={`${ms.storageCorrectRate}%`} />
          <Stat label="Review Compliance" value={`${ms.reviewComplianceRate}%`} />
        </div>
      </Section>

      <Section title="Medication Policy">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Administration Policy" value={mp.medicationAdministrationPolicy ? "Yes" : "No"} />
          <Stat label="Controlled Drugs Protocol" value={mp.controlledDrugsProtocol ? "Yes" : "No"} />
          <Stat label="Consent Framework" value={mp.consentFramework ? "Yes" : "No"} />
          <Stat label="Error Reporting" value={mp.errorReportingProcess ? "Yes" : "No"} />
          <Stat label="Storage Audit" value={mp.storageAuditSchedule ? "Yes" : "No"} />
          <Stat label="Staff Competency" value={mp.staffCompetencyCheck ? "Yes" : "No"} />
          <Stat label="Regular Review" value={mp.regularReview ? "Yes" : "No"} />
        </div>
      </Section>

      <Section title="Staff Readiness">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Med Administration" value={`${sr.medicationAdministrationRate}%`} />
          <Stat label="Controlled Drugs" value={`${sr.controlledDrugsRate}%`} />
          <Stat label="Error Reporting" value={`${sr.errorReportingRate}%`} />
          <Stat label="Consent Practice" value={`${sr.consentPracticeRate}%`} />
          <Stat label="Side Effect Recognition" value={`${sr.sideEffectRecognitionRate}%`} />
          <Stat label="Storage Compliance" value={`${sr.storageComplianceRate}%`} />
        </div>
      </Section>

      {profiles.length > 0 && (
        <Section title={`Child Medication Profiles (${profiles.length})`}>
          {profiles.map((c) => (
            <div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span>{c.overallScore as number}/10</span></div>
              <p className="text-xs text-gray-500 mt-1">{c.totalRecords as number} records · {c.correctAdministrationRate as number}% correct · {c.errorRate as number}% error rate</p>
              <p className="text-xs text-gray-500">Documented immediately: {c.documentedImmediatelyRate as number}%</p>
            </div>
          ))}
        </Section>
      )}

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">✓ {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">⚠ {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
