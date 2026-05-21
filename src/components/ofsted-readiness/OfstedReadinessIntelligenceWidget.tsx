"use client";
import { useEffect, useState } from "react";
function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) { const pct = Math.min(100, Math.round((value / max) * 100)); const colour = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500"; return (<div className="mb-2"><div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="font-medium">{value}/{max}</span></div><div className="w-full h-2 bg-gray-200 rounded"><div className={`${colour} h-2 rounded`} style={{ width: `${pct}%` }} /></div></div>); }
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="bg-gray-50 rounded p-3 text-center"><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-semibold">{String(value)}</p></div>; }
function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) { const [open, setOpen] = useState(defaultOpen); return (<div className="border rounded mb-3"><button className="w-full flex justify-between items-center p-3 text-left font-medium text-sm" onClick={() => setOpen(!open)}>{title}<span>{open ? "▲" : "▼"}</span></button>{open && <div className="p-3 pt-0">{children}</div>}</div>); }
function ratingBadge(rating: string) { const colours: Record<string, string> = { outstanding: "bg-green-100 text-green-800", good: "bg-yellow-100 text-yellow-800", requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800" }; return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>; }
function readinessBadge(readiness: string) { const colours: Record<string, string> = { ready: "bg-green-100 text-green-800", mostly_ready: "bg-yellow-100 text-yellow-800", partially_ready: "bg-orange-100 text-orange-800", not_ready: "bg-red-100 text-red-800" }; return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[readiness] ?? "bg-gray-100"}`}>{readiness.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>; }

export function OfstedReadinessIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/ofsted-readiness").then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); }).then((json) => setData(json.data)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading Ofsted readiness intelligence: {error}</div>;
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const judgmentSummaries = (d.judgmentAreaSummaries ?? []) as Record<string, unknown>[];
  const gapAnalysis = (d.gapAnalysis ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as Record<string, string>[];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Ofsted Readiness Intelligence</h2><div className="flex gap-2">{readinessBadge(d.readiness as string)}{ratingBadge(d.rating as string)}</div></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2"><Stat label="Overall Score" value={`${d.overallScore}/100`} /><Stat label="Judgment Areas" value={`${d.judgmentAreaReadinessScore}/30`} /><Stat label="Evidence" value={`${d.evidencePortfolioScore}/25`} /><Stat label="Action Plan" value={`${d.actionPlanProgressScore}/25`} /></div>
      <Section title="Score Breakdown" defaultOpen><ScoreBar label="Judgment Area Readiness" value={d.judgmentAreaReadinessScore as number} max={30} /><ScoreBar label="Evidence Portfolio" value={d.evidencePortfolioScore as number} /><ScoreBar label="Action Plan Progress" value={d.actionPlanProgressScore as number} /><ScoreBar label="Inspection Preparedness" value={d.inspectionPreparednessScore as number} max={20} /></Section>
      {judgmentSummaries.length > 0 && (<Section title="Judgment Area Summaries">{judgmentSummaries.map((j) => (<div key={j.area as string} className="mb-3 p-2 bg-gray-50 rounded"><div className="flex justify-between text-sm font-medium"><span>{j.label as string}</span><span>Avg {j.averageScore as number}</span></div><p className="text-xs text-gray-500 mt-1">{j.areaCount as number} areas · {j.evidenceCount as number} evidence items · Strong: {j.strongEvidenceCount as number} · Weak: {j.weakEvidenceCount as number} · Absent: {j.absentEvidenceCount as number}</p></div>))}</Section>)}
      {gapAnalysis.length > 0 && (<Section title={`Gap Analysis (${gapAnalysis.length})`}>{gapAnalysis.map((g) => (<div key={g.requirement as string} className="mb-2 p-2 bg-gray-50 rounded"><div className="flex justify-between text-sm font-medium"><span>{g.label as string}</span><span className={`text-xs px-1.5 py-0.5 rounded ${(g.priority as string) === "critical" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}`}>{(g.priority as string).toUpperCase()}</span></div><p className="text-xs text-gray-500 mt-1">Current: {(g.currentStrength as string).replace(/_/g, " ")} · {g.recommendation as string}</p></div>))}</Section>)}
      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">&#10003; {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">&#9888; {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}><span className="font-medium">{r.reference}</span> — {r.title}: {r.relevance}</li>)}</ul></Section>
    </div>
  );
}
