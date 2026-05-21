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
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>;
}

export function DataProtectionIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/data-protection")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading data protection intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const breach = d.breachManagement as Record<string, number>;
  const consent = d.consentCompliance as Record<string, unknown>;
  const sar = d.sarCompliance as Record<string, unknown>;
  const governance = d.governancePractice as Record<string, unknown>;
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Data Protection Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Breach Mgmt" value={`${breach.overallScore}/25`} />
        <Stat label="Consent" value={`${(consent.overallScore as number)}/25`} />
        <Stat label="SAR" value={`${(sar.overallScore as number)}/25`} />
      </div>

      <Section title="Breach Management" defaultOpen>
        <ScoreBar label="Breach Management" value={breach.overallScore} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Breaches" value={breach.totalBreaches} />
          <Stat label="Critical" value={breach.criticalBreaches} />
          <Stat label="ICO Notified" value={`${breach.icoNotificationRate}%`} />
          <Stat label="Within 72hrs" value={`${breach.icoNotificationWithin72HoursRate}%`} />
          <Stat label="Root Cause" value={`${breach.rootCauseRate}%`} />
          <Stat label="Resolution" value={`${breach.resolutionRate}%`} />
        </div>
      </Section>

      <Section title="Consent Compliance">
        <ScoreBar label="Consent" value={consent.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Records" value={consent.totalRecords as number} />
          <Stat label="Consent Obtained" value={`${consent.consentObtainedRate}%`} />
          <Stat label="Age Appropriate" value={`${consent.ageAppropriateExplainedRate}%`} />
          <Stat label="Review Current" value={`${consent.reviewDateCurrentRate}%`} />
          <Stat label="Expired" value={consent.expiredConsentCount as number} />
          <Stat label="Avg Types/Child" value={consent.averageTypesPerChild as number} />
        </div>
      </Section>

      <Section title="SAR Compliance">
        <ScoreBar label="SAR Compliance" value={sar.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Requests" value={sar.totalRequests as number} />
          <Stat label="Ack Within 5d" value={`${sar.acknowledgedWithin5DaysRate}%`} />
          <Stat label="Done Within 30d" value={`${sar.completedWithin30DaysRate}%`} />
          <Stat label="Redaction" value={`${sar.redactionCompletedRate}%`} />
          <Stat label="Quality Checked" value={`${sar.qualityCheckedRate}%`} />
          <Stat label="Overdue" value={sar.overdueCount as number} />
        </div>
      </Section>

      <Section title="Governance Practice">
        <ScoreBar label="Governance" value={governance.overallScore as number} />
        <ul className="text-sm space-y-1 mt-2">
          {([
            ["DPO Appointed", governance.dpoAppointed],
            ["DPIA Completed", governance.dpiaCompleted],
            ["Retention Schedule", governance.retentionScheduleInPlace],
            ["Privacy Notices", governance.privacyNoticesUpToDate],
            ["Audit Within 12 Months", governance.auditWithin12Months],
            ["Processing Register", governance.dataProcessingRegisterMaintained],
            ["Third Party Reviewed", governance.thirdPartyAgreementsReviewed],
          ] as [string, unknown][]).map(([label, val]) => (
            <li key={label} className="flex items-center gap-2">
              <span className={val ? "text-green-600" : "text-red-500"}>{val ? "✓" : "✗"}</span>{label}
            </li>
          ))}
          <li className="flex items-center gap-2 mt-1">
            <span className="text-gray-500">Staff Training:</span> {governance.staffTrainingCompliance as number}%
          </li>
        </ul>
      </Section>

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">&#10003; {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">&#9888; {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
