"use client";
import { useEffect, useState } from "react";
function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colour = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500";
  return (<div className="mb-2"><div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="font-medium">{value}/{max}</span></div><div className="w-full h-2 bg-gray-200 rounded"><div className={`${colour} h-2 rounded`} style={{ width: `${pct}%` }} /></div></div>);
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="bg-gray-50 rounded p-3 text-center"><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-semibold">{String(value)}</p></div>;
}
function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (<div className="border rounded mb-3"><button className="w-full flex justify-between items-center p-3 text-left font-medium text-sm" onClick={() => setOpen(!open)}>{title}<span>{open ? "▲" : "▼"}</span></button>{open && <div className="p-3 pt-0">{children}</div>}</div>);
}
function ratingBadge(rating: string) {
  const colours: Record<string, string> = { outstanding: "bg-green-100 text-green-800", good: "bg-yellow-100 text-yellow-800", requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>;
}

export function EnvironmentalRiskComplianceIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/environmental-risk-compliance").then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); }).then((json) => setData(json.data)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading environmental risk compliance intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const risk = d.riskAssessmentCoverage as Record<string, number>;
  const safety = d.safetyCheckCompliance as Record<string, unknown>;
  const remediation = d.remediationEffectiveness as Record<string, number>;
  const staff = d.staffSafetyReadiness as Record<string, number>;
  const profiles = (d.areaProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Environmental Risk Compliance Intelligence</h2>{ratingBadge(d.rating as string)}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Risk Coverage" value={`${risk.overallScore}/25`} />
        <Stat label="Safety Checks" value={`${safety.overallScore}/25`} />
        <Stat label="Area Profiles" value={profiles.length} />
      </div>
      <Section title="Risk Assessment Coverage" defaultOpen>
        <ScoreBar label="Risk Coverage" value={risk.overallScore} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Assessments" value={risk.totalAssessments} />
          <Stat label="Area Coverage" value={`${risk.areaCoverageRate}%`} />
          <Stat label="Review Current" value={`${risk.reviewCurrentRate}%`} />
          <Stat label="Mitigation in Place" value={`${risk.mitigationInPlaceRate}%`} />
          <Stat label="High/Critical Mitigated" value={`${risk.highCriticalMitigatedRate}%`} />
        </div>
      </Section>
      <Section title="Safety Check Compliance">
        <ScoreBar label="Safety Checks" value={safety.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Checks" value={safety.totalChecks as number} />
          <Stat label="Compliant" value={`${safety.compliantRate}%`} />
          <Stat label="Non-Compliant" value={safety.nonCompliantCount as number} />
          <Stat label="Actions Completed" value={`${safety.actionRequiredCompletedRate}%`} />
          <Stat label="Frequency Adequate" value={safety.checkFrequencyAdequate ? "✓" : "✗"} />
        </div>
      </Section>
      <Section title="Remediation Effectiveness">
        <ScoreBar label="Remediation" value={remediation.overallScore} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Actions" value={remediation.totalActions} />
          <Stat label="Completed On Time" value={`${remediation.completedOnTimeRate}%`} />
          <Stat label="Overdue" value={`${remediation.overdueRate}%`} />
          <Stat label="Verified" value={`${remediation.verifiedRate}%`} />
          <Stat label="In Progress" value={remediation.inProgressCount} />
        </div>
      </Section>
      <Section title="Staff Safety Readiness">
        <ScoreBar label="Staff Readiness" value={staff.overallScore} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Staff" value={staff.totalStaff} />
          <Stat label="Ligature Awareness" value={`${staff.ligatureAwarenessRate}%`} />
          <Stat label="COSHH Trained" value={`${staff.coshhTrainedRate}%`} />
          <Stat label="Fire Safety" value={`${staff.fireSafetyRate}%`} />
          <Stat label="Water Safety" value={`${staff.waterSafetyRate}%`} />
          <Stat label="Risk Assessment" value={`${staff.riskAssessmentCompetentRate}%`} />
        </div>
      </Section>
      {profiles.length > 0 && (<Section title={`Area Profiles (${profiles.length})`}>{profiles.map((p, i) => (<div key={i} className="mb-2 p-2 bg-gray-50 rounded"><div className="flex justify-between text-sm font-medium"><span>{p.areaName as string}</span><span>{p.overallScore as number}/100</span></div><p className="text-xs text-gray-500 mt-1">Type: {(p.areaType as string).replace(/_/g, " ")} · Assessments: {p.assessmentCount as number} · Checks: {p.checkCount as number} · Coverage: {p.assessmentCoverage ? "✓" : "✗"} · Compliance: {p.checkCompliance ? "✓" : "✗"}</p></div>))}</Section>)}
      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">✓ {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">⚠ {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
