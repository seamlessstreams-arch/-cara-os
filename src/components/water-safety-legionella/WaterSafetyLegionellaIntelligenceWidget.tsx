"use client";
import { useEffect, useState } from "react";
function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) { const pct = Math.min(100, Math.round((value / max) * 100)); const colour = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500"; return (<div className="mb-2"><div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="font-medium">{value}/{max}</span></div><div className="w-full h-2 bg-gray-200 rounded"><div className={`${colour} h-2 rounded`} style={{ width: `${pct}%` }} /></div></div>); }
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="bg-gray-50 rounded p-3 text-center"><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-semibold">{String(value)}</p></div>; }
function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) { const [open, setOpen] = useState(defaultOpen); return (<div className="border rounded mb-3"><button className="w-full flex justify-between items-center p-3 text-left font-medium text-sm" onClick={() => setOpen(!open)}>{title}<span>{open ? "▲" : "▼"}</span></button>{open && <div className="p-3 pt-0">{children}</div>}</div>); }
function ratingBadge(rating: string) { const colours: Record<string, string> = { outstanding: "bg-green-100 text-green-800", good: "bg-yellow-100 text-yellow-800", requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800" }; return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>; }

export function WaterSafetyLegionellaIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/water-safety-legionella").then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); }).then((json) => setData(json.data)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading water safety legionella intelligence: {error}</div>;
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const tc = d.temperatureCompliance as Record<string, unknown>;
  const lm = d.legionellaManagement as Record<string, unknown>;
  const wsp = d.waterSafetyPolicy as Record<string, unknown>;
  const swr = d.staffWaterReadiness as Record<string, unknown>;
  const locationProfiles = (d.locationProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Water Safety &amp; Legionella Intelligence</h2>{ratingBadge(d.rating as string)}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2"><Stat label="Overall Score" value={`${d.overallScore}/100`} /><Stat label="Total Checks" value={tc.totalChecks as number} /><Stat label="Pass Rate" value={`${tc.passRate}%`} /><Stat label="Safe Range" value={`${tc.withinSafeRangeRate}%`} /></div>
      <Section title="Score Breakdown" defaultOpen><ScoreBar label="Temperature Compliance" value={tc.score as number} /><ScoreBar label="Legionella Management" value={lm.score as number} /><ScoreBar label="Water Safety Policy" value={wsp.score as number} /><ScoreBar label="Staff Water Readiness" value={swr.score as number} /></Section>
      <Section title="Temperature Compliance"><div className="grid grid-cols-2 sm:grid-cols-3 gap-2"><Stat label="Total Checks" value={tc.totalChecks as number} /><Stat label="Pass Count" value={tc.passCount as number} /><Stat label="Pass Rate" value={`${tc.passRate}%`} /><Stat label="Safe Range" value={`${tc.withinSafeRangeRate}%`} /><Stat label="Issues" value={tc.issueCount as number} /><Stat label="Corrective Actions" value={`${tc.correctiveActionRate}%`} /><Stat label="Source Coverage" value={tc.sourceTypeCoverage as number} /></div></Section>
      <Section title="Legionella Management"><div className="grid grid-cols-2 sm:grid-cols-3 gap-2"><Stat label="Assessments" value={lm.totalAssessments as number} /><Stat label="Low Risk" value={`${lm.lowRiskRate}%`} /><Stat label="Flushing Schedule" value={`${lm.flushingScheduleRate}%`} /><Stat label="Water Treatment" value={`${lm.waterTreatmentRate}%`} /><Stat label="Dead Legs Found" value={lm.deadLegsIdentifiedCount as number} /><Stat label="Dead Legs Removed" value={lm.deadLegsRemovedCount as number} /><Stat label="Dead Legs Mgmt" value={`${lm.deadLegsManagementRate}%`} /></div></Section>
      <Section title="Water Safety Policy"><div className="grid grid-cols-2 sm:grid-cols-3 gap-2"><Stat label="Total Policies" value={wsp.totalPolicies as number} /><Stat label="Current" value={wsp.policyCurrentCount as number} /><Stat label="Temp Schedule" value={wsp.temperatureScheduleCount as number} /><Stat label="Legionella Plan" value={wsp.legionellaPlanCount as number} /><Stat label="Scalding Prevention" value={wsp.scaldingPreventionCount as number} /><Stat label="Bath Supervision" value={wsp.bathSupervisionCount as number} /><Stat label="Emergency Procedures" value={wsp.emergencyProceduresCount as number} /><Stat label="Record Keeping" value={wsp.recordKeepingCount as number} /></div></Section>
      <Section title="Staff Water Readiness"><div className="grid grid-cols-2 sm:grid-cols-3 gap-2"><Stat label="Total Staff" value={swr.totalStaff as number} /><Stat label="Legionella Awareness" value={`${swr.legionellaAwarenessRate}%`} /><Stat label="Temp Monitoring" value={`${swr.temperatureMonitoringRate}%`} /><Stat label="Scalding Prevention" value={`${swr.scaldingPreventionRate}%`} /><Stat label="Bath Supervision" value={`${swr.bathSupervisionRate}%`} /><Stat label="Emergency Response" value={`${swr.emergencyResponseRate}%`} /><Stat label="Record Keeping" value={`${swr.recordKeepingRate}%`} /></div></Section>
      {locationProfiles.length > 0 && (<Section title={`Location Profiles (${locationProfiles.length})`}>{locationProfiles.map((l, i) => (<div key={i} className="mb-2 p-2 bg-gray-50 rounded"><div className="flex justify-between text-sm font-medium"><span>{l.location as string}</span><span className="text-xs text-gray-500">Score: {l.score as number}/10</span></div><p className="text-xs text-gray-500 mt-1">Checks: {l.checkCount as number} · Pass: {l.passRate as number}% · Safe Range: {l.withinSafeRangeRate as number}% · Avg Temp: {l.averageTemperature as number}C{l.latestRiskLevel ? ` · Risk: ${(l.latestRiskLevel as string).replace(/_/g, " ")}` : ""}</p></div>))}</Section>)}
      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">&#10003; {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">&#9888; {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
