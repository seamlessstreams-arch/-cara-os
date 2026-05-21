"use client";
import { useEffect, useState } from "react";
function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) { const pct = Math.min(100, Math.round((value / max) * 100)); const colour = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500"; return (<div className="mb-2"><div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="font-medium">{value}/{max}</span></div><div className="w-full h-2 bg-gray-200 rounded"><div className={`${colour} h-2 rounded`} style={{ width: `${pct}%` }} /></div></div>); }
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="bg-gray-50 rounded p-3 text-center"><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-semibold">{String(value)}</p></div>; }
function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) { const [open, setOpen] = useState(defaultOpen); return (<div className="border rounded mb-3"><button className="w-full flex justify-between items-center p-3 text-left font-medium text-sm" onClick={() => setOpen(!open)}>{title}<span>{open ? "▲" : "▼"}</span></button>{open && <div className="p-3 pt-0">{children}</div>}</div>); }
function ratingBadge(rating: string) { const colours: Record<string, string> = { outstanding: "bg-green-100 text-green-800", good: "bg-yellow-100 text-yellow-800", requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800" }; return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>; }

export function NotificationTimelinessIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/notification-timeliness").then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); }).then((json) => setData(json.data)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading notification timeliness intelligence: {error}</div>;
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const metrics = d.metrics as Record<string, unknown>;
  const score = d.score as Record<string, number>;
  const eventResults = (d.eventResults ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Notification Timeliness Intelligence</h2>{ratingBadge(d.rating as string)}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2"><Stat label="Overall Score" value={`${score.total}/100`} /><Stat label="Total Events" value={metrics.totalEvents as number} /><Stat label="On-Time Rate" value={`${metrics.onTimeRate}%`} /><Stat label="Avg Delay (hrs)" value={metrics.averageDelayHours as number} /></div>
      <Section title="Score Breakdown" defaultOpen><ScoreBar label="Ofsted Timeliness" value={score.ofstedTimeliness} max={30} /><ScoreBar label="Stakeholder Notification" value={score.stakeholderNotification} /><ScoreBar label="Quality & Completeness" value={score.qualityCompleteness} /><ScoreBar label="Policy Compliance" value={score.policyCompliance} max={20} /></Section>
      <Section title="Timeliness Metrics"><div className="grid grid-cols-2 gap-2"><Stat label="Schedule 5" value={metrics.schedule5Count as number} /><Stat label="Schedule 6" value={metrics.schedule6Count as number} /><Stat label="On-Time" value={metrics.onTimeCount as number} /><Stat label="Late" value={metrics.lateCount as number} /><Stat label="Not Submitted" value={metrics.notSubmittedCount as number} /><Stat label="Pending" value={metrics.pendingCount as number} /><Stat label="Completeness" value={`${metrics.completenessRate}%`} /><Stat label="Acknowledgement" value={`${metrics.acknowledgementRate}%`} /><Stat label="Follow-Up" value={`${metrics.followUpRate}%`} /></div></Section>
      {eventResults.length > 0 && (<Section title={`Event Results (${eventResults.length})`}>{eventResults.map((e) => (<div key={e.eventId as string} className="mb-2 p-2 bg-gray-50 rounded"><div className="flex justify-between text-sm font-medium"><span>{e.title as string}</span><span className={`text-xs px-1.5 py-0.5 rounded ${(e.ofstedNotifiedOnTime as boolean) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{(e.ofstedNotifiedOnTime as boolean) ? "On-Time" : "Late"}</span></div><p className="text-xs text-gray-500 mt-1">{(e.category as string).replace(/_/g, " ")} · Notified {(e.notifiedRecipients as string[]).length}/{(e.requiredRecipients as string[]).length} · Ack {e.acknowledgementRate as number}%{(e.issues as string[]).length > 0 && ` · ${(e.issues as string[]).length} issue(s)`}</p></div>))}</Section>)}
      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">&#10003; {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">&#9888; {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
