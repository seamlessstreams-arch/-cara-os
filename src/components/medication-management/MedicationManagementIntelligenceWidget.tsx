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

export function MedicationManagementIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/medication-management")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading medication management intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const scoring = d.scoringBreakdown as Record<string, number>;
  const admin = d.administrationAccuracy as Record<string, unknown>;
  const errors = d.errorAnalysis as Record<string, unknown>;
  const stock = d.stockManagement as Record<string, unknown>;
  const selfAdmin = d.selfAdministration as Record<string, unknown>;
  const cd = d.controlledDrugs as Record<string, number>;
  const perChild = (admin.perChildBreakdown ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.recommendedActions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];
  const trend = errors.trend as Record<string, unknown>;
  const severityBreakdown = errors.severityBreakdown as Record<string, number>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Medication Management Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Total Records" value={admin.totalRecords as number} />
        <Stat label="Accuracy Rate" value={`${admin.accuracyRate as number}%`} />
        <Stat label="Total Errors" value={errors.totalErrors as number} />
      </div>

      <ScoreBar label="Administration Accuracy" value={scoring.administrationAccuracy} max={35} />
      <ScoreBar label="Error Management" value={scoring.errorManagement} max={20} />
      <ScoreBar label="Stock Management" value={scoring.stockManagement} max={15} />
      <ScoreBar label="Self-Administration" value={scoring.selfAdministration} max={15} />
      <ScoreBar label="Controlled Drugs" value={scoring.controlledDrugsCompliance} max={15} />

      <Section title="Administration Accuracy" defaultOpen>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Accuracy Rate" value={`${admin.accuracyRate as number}%`} />
          <Stat label="Refusal Rate" value={`${admin.refusalRate as number}%`} />
          <Stat label="Late Rate" value={`${admin.lateRate as number}%`} />
          <Stat label="Omission Rate" value={`${admin.omissionRate as number}%`} />
          <Stat label="Error Rate" value={`${admin.errorRate as number}%`} />
          <Stat label="Self-Admin Rate" value={`${admin.selfAdminRate as number}%`} />
        </div>
      </Section>

      <Section title="Error Analysis">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Errors" value={errors.totalErrors as number} />
          <Stat label="Trend" value={String(trend.direction).replace(/_/g, " ")} />
          <Stat label="Minor" value={severityBreakdown.minor} />
          <Stat label="Moderate" value={severityBreakdown.moderate} />
          <Stat label="Significant" value={severityBreakdown.significant} />
          <Stat label="Critical" value={severityBreakdown.critical} />
          <Stat label="With Root Cause" value={errors.errorsWithRootCause as number} />
          <Stat label="Without Root Cause" value={errors.errorsWithoutRootCause as number} />
        </div>
      </Section>

      <Section title="Stock Management">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Checks" value={stock.totalChecks as number} />
          <Stat label="Checks/Week" value={stock.checkFrequencyPerWeek as number} />
          <Stat label="Discrepancy Rate" value={`${stock.discrepancyRate as number}%`} />
          <Stat label="Discrepancies" value={stock.discrepancyCount as number} />
        </div>
      </Section>

      <Section title="Self-Administration">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Assessments" value={selfAdmin.totalAssessments as number} />
          <Stat label="Progressing" value={selfAdmin.childrenProgressing as number} />
          <Stat label="At Target" value={selfAdmin.childrenAtTarget as number} />
        </div>
      </Section>

      <Section title="Controlled Drugs">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Records" value={cd.totalRecords} />
          <Stat label="Witness Rate" value={`${cd.witnessRate}%`} />
          <Stat label="Balance Accuracy" value={`${cd.balanceAccuracyRate}%`} />
          <Stat label="Discrepancies" value={cd.discrepancyCount} />
        </div>
      </Section>

      {perChild.length > 0 && (
        <Section title={`Per-Child Breakdown (${perChild.length})`}>
          {perChild.map((c) => (
            <div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span>{c.accuracyRate as number}% accuracy</span></div>
              <p className="text-xs text-gray-500 mt-1">{c.total as number} records · {c.given as number} given · {c.refused as number} refused · {c.late as number} late · {c.errors as number} errors</p>
            </div>
          ))}
        </Section>
      )}

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">✓ {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">⚠ {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Recommended Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
