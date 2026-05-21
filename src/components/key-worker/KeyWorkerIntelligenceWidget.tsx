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

export function KeyWorkerIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/key-worker")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading key worker intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const scoring = d.scoring as Record<string, number>;
  const sc = d.sessionConsistency as Record<string, unknown>;
  const cv = d.childVoice as Record<string, unknown>;
  const rq = d.relationshipQuality as Record<string, unknown>;
  const gp = d.goalProgress as Record<string, unknown>;
  const children = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regLinks = (d.regulatoryLinks ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Key Worker Intelligence</h2>
        {ratingBadge(d.overallRating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Sessions" value={sc.totalSessions as number} />
        <Stat label="Completed" value={sc.completedSessions as number} />
        <Stat label="Children" value={children.length} />
      </div>

      <Section title="Session Consistency" defaultOpen>
        <ScoreBar label="Session Consistency" value={scoring.sessionConsistencyScore} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Completion Rate" value={`${sc.completionRate}%`} />
          <Stat label="Cancellation Rate" value={`${sc.cancellationRate}%`} />
          <Stat label="Avg Duration (min)" value={sc.averageDuration as number} />
          <Stat label="Session Type Variety" value={sc.sessionTypeVariety as number} />
          <Stat label="Cancelled by Child" value={sc.cancelledByChild as number} />
          <Stat label="Cancelled by Staff" value={sc.cancelledByStaff as number} />
          <Stat label="Missed" value={sc.missed as number} />
          <Stat label="Below Minimum" value={((sc.childrenBelowMinimum ?? []) as string[]).length} />
        </div>
      </Section>

      <Section title="Child Voice">
        <ScoreBar label="Child Voice" value={scoring.childVoiceScore} max={30} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Voice Indicators" value={cv.totalVoiceIndicators as number} />
          <Stat label="Avg Voice Score" value={`${cv.averageVoiceScore}%`} />
          <Stat label="Plan Influence" value={`${cv.planInfluenceRate}%`} />
          <Stat label="Low Voice Children" value={((cv.childrenWithLowVoice ?? []) as string[]).length} />
        </div>
      </Section>

      <Section title="Relationship Quality">
        <ScoreBar label="Relationship Quality" value={scoring.relationshipQualityScore} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Quality Indicators" value={rq.totalIndicators as number} />
          <Stat label="Avg Quality Score" value={`${rq.averageQualityScore}%`} />
          <Stat label="Trauma-Informed" value={`${rq.traumaInformedRate}%`} />
          <Stat label="Culturally Responsive" value={`${rq.culturallyResponsiveRate}%`} />
        </div>
      </Section>

      <Section title="Goal Progress">
        <ScoreBar label="Goal Progress" value={scoring.goalProgressScore} max={20} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Goals" value={gp.totalGoals as number} />
          <Stat label="Achieved" value={gp.achievedGoals as number} />
          <Stat label="Achievement Rate" value={`${gp.achievementRate}%`} />
          <Stat label="Partially Achieved" value={gp.partiallyAchieved as number} />
          <Stat label="Not Achieved" value={gp.notAchieved as number} />
          <Stat label="Deferred" value={gp.deferred as number} />
          <Stat label="Active Goals" value={gp.activeGoals as number} />
        </div>
      </Section>

      {children.length > 0 && (
        <Section title={`Child Profiles (${children.length})`}>
          {children.map((c) => (
            <div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span className={`text-xs px-2 py-0.5 rounded ${(c.consistencyRating as string) === "excellent" ? "bg-green-100 text-green-800" : (c.consistencyRating as string) === "good" ? "bg-yellow-100 text-yellow-800" : (c.consistencyRating as string) === "fair" ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800"}`}>{c.consistencyRating as string}</span></div>
              <p className="text-xs text-gray-500 mt-1">{c.completedSessions as number}/{c.totalSessions as number} sessions · Voice {c.voiceScore as number}% · Relationship {c.relationshipScore as number}% · Goals {c.goalProgress as number}% · {c.activeGoals as number} active goals</p>
            </div>
          ))}
        </Section>
      )}

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">&#10003; {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">&#9888; {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links">
        <ul className="text-sm text-gray-600 space-y-1">
          {regLinks.map((r, i) => (
            <li key={i}>
              <span className="font-medium">{r.regulation as string}</span> — {r.description as string}
              {" "}
              <span className={`text-xs px-1 py-0.5 rounded ${(r.status as string) === "met" ? "bg-green-100 text-green-800" : (r.status as string) === "partially_met" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>{(r.status as string).replace(/_/g, " ")}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
