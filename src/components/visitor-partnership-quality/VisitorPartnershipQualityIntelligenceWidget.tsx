"use client";
import { useEffect, useState } from "react";
function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) { const pct = Math.min(100, Math.round((value / max) * 100)); const colour = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500"; return (<div className="mb-2"><div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="font-medium">{value}/{max}</span></div><div className="w-full h-2 bg-gray-200 rounded"><div className={`${colour} h-2 rounded`} style={{ width: `${pct}%` }} /></div></div>); }
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="bg-gray-50 rounded p-3 text-center"><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-semibold">{String(value)}</p></div>; }
function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) { const [open, setOpen] = useState(defaultOpen); return (<div className="border rounded mb-3"><button className="w-full flex justify-between items-center p-3 text-left font-medium text-sm" onClick={() => setOpen(!open)}>{title}<span>{open ? "▲" : "▼"}</span></button>{open && <div className="p-3 pt-0">{children}</div>}</div>); }
function ratingBadge(rating: string) { const colours: Record<string, string> = { outstanding: "bg-green-100 text-green-800", good: "bg-yellow-100 text-yellow-800", requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800" }; return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>; }

export function VisitorPartnershipQualityIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/visitor-partnership-quality").then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); }).then((json) => setData(json.data)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading visitor partnership quality intelligence: {error}</div>;
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const vq = d.visitQuality as Record<string, unknown>;
  const pe = d.partnershipEffectiveness as Record<string, unknown>;
  const r44 = d.reg44Compliance as Record<string, unknown>;
  const ar = d.actionResponse as Record<string, unknown>;
  const childProfiles = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Visitor Partnership Quality Intelligence</h2>{ratingBadge(d.rating as string)}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2"><Stat label="Overall Score" value={`${d.overallScore}/100`} /><Stat label="Total Visits" value={vq.totalVisits as number} /><Stat label="Positive Outcomes" value={`${vq.positiveOutcomeRate}%`} /><Stat label="Child Seen" value={`${vq.childSeenRate}%`} /></div>
      <Section title="Score Breakdown" defaultOpen><ScoreBar label="Visit Quality" value={vq.overallScore as number} /><ScoreBar label="Partnership Effectiveness" value={pe.overallScore as number} /><ScoreBar label="Reg 44 Compliance" value={r44.overallScore as number} /><ScoreBar label="Action Response" value={ar.overallScore as number} /></Section>
      <Section title="Visit Quality Metrics"><div className="grid grid-cols-2 sm:grid-cols-3 gap-2"><Stat label="Total Visits" value={vq.totalVisits as number} /><Stat label="Positive Outcomes" value={`${vq.positiveOutcomeRate}%`} /><Stat label="Reports Provided" value={`${vq.reportProvidedRate}%`} /><Stat label="Child Seen" value={`${vq.childSeenRate}%`} /><Stat label="Child Spoken Alone" value={`${vq.childSpokenAloneRate}%`} /><Stat label="Cancellation Rate" value={`${vq.cancellationRate}%`} /><Stat label="Avg Duration (min)" value={vq.averageDuration as number} /></div></Section>
      <Section title="Partnership Effectiveness"><div className="grid grid-cols-2 sm:grid-cols-3 gap-2"><Stat label="Assessments" value={pe.totalAssessments as number} /><Stat label="Excellent/Good" value={`${pe.excellentGoodRate}%`} /><Stat label="Info Sharing" value={`${pe.informationSharingRate}%`} /><Stat label="Joint Planning" value={`${pe.jointPlanningRate}%`} /><Stat label="Responsive" value={`${pe.responsiveRate}%`} /><Stat label="Attends Reviews" value={`${pe.attendsReviewsRate}%`} /><Stat label="Child Focused" value={`${pe.childFocusedRate}%`} /><Stat label="Challenge Accepted" value={`${pe.challengeAcceptedRate}%`} /></div></Section>
      <Section title="Reg 44 Compliance"><div className="grid grid-cols-2 sm:grid-cols-3 gap-2"><Stat label="Total Visits" value={r44.totalVisits as number} /><Stat label="Child Interview" value={`${r44.childInterviewRate}%`} /><Stat label="Report Timely" value={`${r44.reportTimelyRate}%`} /><Stat label="Issue Resolution" value={`${r44.issueResolutionRate}%`} /><Stat label="Prev Recs Reviewed" value={`${r44.previousRecsReviewedRate}%`} /><Stat label="Overall Positive" value={`${r44.overallPositiveRate}%`} /><Stat label="Avg Issues Raised" value={r44.averageIssuesRaised as number} /></div></Section>
      <Section title="Action Response"><div className="grid grid-cols-2 sm:grid-cols-3 gap-2"><Stat label="Total Actions" value={ar.totalActions as number} /><Stat label="Completed" value={`${ar.completedRate}%`} /><Stat label="Overdue" value={ar.overdueCount as number} /><Stat label="In Progress" value={ar.inProgressCount as number} /></div></Section>
      {childProfiles.length > 0 && (<Section title={`Child Profiles (${childProfiles.length})`}>{childProfiles.map((c) => (<div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded"><div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span className="text-xs text-gray-500">Score: {c.overallScore as number}/10</span></div><p className="text-xs text-gray-500 mt-1">Visits: {c.totalVisits as number} · SW: {c.socialWorkerVisits as number} · Therapy: {c.therapistVisits as number} · Seen: {c.childSeenRate as number}% · Positive: {c.positiveOutcomeRate as number}%</p></div>))}</Section>)}
      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">&#10003; {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">&#9888; {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
