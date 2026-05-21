"use client";
import { useEffect, useState } from "react";
function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) { const pct = Math.min(100, Math.round((value / max) * 100)); const colour = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500"; return (<div className="mb-2"><div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="font-medium">{value}/{max}</span></div><div className="w-full h-2 bg-gray-200 rounded"><div className={`${colour} h-2 rounded`} style={{ width: `${pct}%` }} /></div></div>); }
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="bg-gray-50 rounded p-3 text-center"><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-semibold">{String(value)}</p></div>; }
function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) { const [open, setOpen] = useState(defaultOpen); return (<div className="border rounded mb-3"><button className="w-full flex justify-between items-center p-3 text-left font-medium text-sm" onClick={() => setOpen(!open)}>{title}<span>{open ? "▲" : "▼"}</span></button>{open && <div className="p-3 pt-0">{children}</div>}</div>); }
function ratingBadge(rating: string) { const colours: Record<string, string> = { outstanding: "bg-green-100 text-green-800", good: "bg-yellow-100 text-yellow-800", requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800" }; return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>; }

export function MorningRoutinePreparationIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/morning-routine-preparation").then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); }).then((json) => setData(json.data)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading morning routine preparation intelligence: {error}</div>;
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const routine = d.routineCompletion as Record<string, unknown>;
  const wellbeing = d.wellbeingReadiness as Record<string, unknown>;
  const policy = d.morningPolicy as Record<string, unknown>;
  const staff = d.staffReadiness as Record<string, unknown>;
  const children = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Morning Routine &amp; Preparation Intelligence</h2>{ratingBadge(d.rating as string)}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2"><Stat label="Overall Score" value={`${d.overallScore}/100`} /><Stat label="Records" value={routine.totalRecords as number} /><Stat label="Staff" value={staff.totalStaff as number} /><Stat label="Children" value={children.length} /></div>
      <Section title="Routine Completion" defaultOpen><ScoreBar label="Completion" value={routine.overallScore as number} /><div className="grid grid-cols-2 gap-2 mt-2"><Stat label="Completion Rate" value={`${routine.completionRate}%`} /><Stat label="On-Time Rate" value={`${routine.onTimeRate}%`} /><Stat label="Breakfast Rate" value={`${routine.breakfastRate}%`} /><Stat label="Documentation" value={`${routine.supportDocumentationRate}%`} /></div></Section>
      <Section title="Wellbeing & Readiness"><ScoreBar label="Wellbeing" value={wellbeing.overallScore as number} /><div className="grid grid-cols-2 gap-2 mt-2"><Stat label="Mood Positive" value={`${wellbeing.moodPositiveRate}%`} /><Stat label="Parent Informed" value={`${wellbeing.parentInformedRate}%`} /><Stat label="Independent" value={`${wellbeing.independentCompletionRate}%`} /></div></Section>
      <Section title="Morning Policy"><ScoreBar label="Policy" value={policy.overallScore as number} /><ul className="text-sm space-y-1 mt-2">{([["Morning Routine Policy", policy.morningRoutinePolicy], ["Breakfast Standards", policy.breakfastStandards], ["School Readiness Protocol", policy.schoolReadinessProtocol], ["Punctuality Tracking", policy.punctualityTracking], ["Individual Routine Plans", policy.individualRoutinePlans], ["Staff Handover Process", policy.staffHandoverProcess], ["Regular Review", policy.regularReview]] as [string, unknown][]).map(([label, val]) => (<li key={label} className="flex items-center gap-2"><span className={val ? "text-green-600" : "text-red-500"}>{val ? "✓" : "✗"}</span>{label}</li>))}</ul></Section>
      <Section title="Staff Readiness"><ScoreBar label="Staff Readiness" value={staff.overallScore as number} /><div className="grid grid-cols-2 gap-2 mt-2"><Stat label="Routine Mgmt" value={`${staff.morningRoutineManagementRate}%`} /><Stat label="Breakfast Nutrition" value={`${staff.breakfastNutritionRate}%`} /><Stat label="Emotional Reg." value={`${staff.emotionalRegulationRate}%`} /><Stat label="Time Mgmt" value={`${staff.timeManagementRate}%`} /><Stat label="School Liaison" value={`${staff.schoolLiaisonRate}%`} /><Stat label="Handover" value={`${staff.handoverPracticeRate}%`} /></div></Section>
      {children.length > 0 && (<Section title={`Child Profiles (${children.length})`}>{children.map((c) => (<div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded"><div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span>{c.overallScore as number}/10</span></div><p className="text-xs text-gray-500 mt-1">{c.totalRecords as number} records · Completion {c.completionRate as number}% · On-Time {c.onTimeRate as number}% · Breakfast {c.breakfastRate as number}%</p></div>))}</Section>)}
      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">&#10003; {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">&#9888; {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
