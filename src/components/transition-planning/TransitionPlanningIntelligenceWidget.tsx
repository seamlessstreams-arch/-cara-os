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

export function TransitionPlanningIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/transition-planning").then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); }).then((json) => setData(json.data)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading transition planning intelligence: {error}</div>;
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const planning = d.planningQuality as Record<string, unknown>;
  const independence = d.independenceReadiness as Record<string, unknown>;
  const goals = d.goalProgress as Record<string, unknown>;
  const stability = d.placementStability as Record<string, unknown>;
  const childProfiles = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForDevelopment ?? []) as string[];
  const actions = (d.immediateActions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Transition Planning Intelligence</h2>{ratingBadge(d.rating as string)}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2"><Stat label="Overall Score" value={`${d.overallScore}/100`} /><Stat label="Total Plans" value={planning.totalPlans as number} /><Stat label="Active Plans" value={planning.activePlans as number} /><Stat label="Overdue Plans" value={planning.overduePlans as number} /></div>
      <Section title="Planning Quality" defaultOpen>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Plan Currency" value={`${planning.planCurrencyRate}%`} />
          <Stat label="Child Voice" value={`${planning.childVoiceRate}%`} />
          <Stat label="Multi-Agency" value={`${planning.multiAgencyRate}%`} />
          <Stat label="Goal Achievement" value={`${planning.goalAchievementRate}%`} />
          <Stat label="Family Involvement" value={`${planning.familyInvolvementRate}%`} />
          <Stat label="Social Worker" value={`${planning.socialWorkerRate}%`} />
          <Stat label="Reviewed Plans" value={planning.reviewedPlans as number} />
          <Stat label="Draft Plans" value={planning.draftPlans as number} />
        </div>
      </Section>
      <Section title="Independence Readiness">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Average Confidence" value={(independence.overallAverageConfidence as number).toFixed(2)} />
          <Stat label="Skill Gaps" value={(independence.skillGaps as string[]).length} />
          <Stat label="Strongest Skills" value={(independence.strongestSkills as string[]).length} />
          <Stat label="Profiles Assessed" value={(independence.profiles as unknown[]).length} />
        </div>
        {(independence.categoryAverages as Record<string, unknown>[])?.length > 0 && (
          <div className="mt-2">{(independence.categoryAverages as Record<string, unknown>[]).map((ca, i) => (
            <ScoreBar key={i} label={(ca.category as string).replace(/_/g, " ")} value={Number((ca.average as number).toFixed(1))} max={4} />
          ))}</div>
        )}
      </Section>
      <Section title="Goal Progress">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          <Stat label="Total Goals" value={goals.totalGoals as number} />
          <Stat label="Achieved" value={goals.achieved as number} />
          <Stat label="In Progress" value={goals.inProgress as number} />
          <Stat label="Not Started" value={goals.notStarted as number} />
          <Stat label="Deferred" value={goals.deferred as number} />
          <Stat label="Achievement Rate" value={`${goals.achievementRate}%`} />
          <Stat label="Nearing Deadline" value={(goals.goalsNearingDeadline as unknown[]).length} />
        </div>
      </Section>
      <Section title="Placement Stability">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Avg Previous Placements" value={stability.averagePreviousPlacements as number} />
          <Stat label="Disruption Risks" value={stability.totalDisruptionRisks as number} />
          <Stat label="Stability Factors" value={stability.totalStabilityFactors as number} />
          <Stat label="High Risk Children" value={stability.childrenWithHighRisk as number} />
          <Stat label="Stable Children" value={stability.childrenStable as number} />
          <Stat label="Avg Disruption Risks" value={stability.averageDisruptionRisks as number} />
        </div>
      </Section>
      {childProfiles.length > 0 && <Section title={`Child Profiles (${childProfiles.length})`}>
        <div className="space-y-2">{childProfiles.map((c, i) => (
          <div key={i} className="border rounded p-2 text-sm">
            <div className="flex justify-between font-medium"><span>{c.childName as string}</span><span className="text-xs text-gray-500">{(c.transitionType as string).replace(/_/g, " ")}</span></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mt-1 text-xs">
              <span>Plan: {(c.planStatus as string).replace(/_/g, " ")}</span>
              <span>Skills: {c.skillReadinessScore as number}%</span>
              <span>Goals: {c.goalAchievementRate as number}%</span>
              <span>Stability: {(c.placementStability as string).replace(/_/g, " ")}</span>
            </div>
            {c.primaryConcern && <p className="text-xs text-orange-700 mt-1">{c.primaryConcern as string}</p>}
          </div>
        ))}</div>
      </Section>}
      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">&#10003; {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Development"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">&#9888; {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Immediate Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
