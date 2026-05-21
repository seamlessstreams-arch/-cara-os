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

export function TransitionReadinessIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/transition-readiness").then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); }).then((json) => setData(json.data)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading transition readiness intelligence: {error}</div>;
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const tp = d.transitionPlanning as Record<string, unknown>;
  const ho = d.handover as Record<string, unknown>;
  const rd = d.readiness as Record<string, unknown>;
  const pt = d.postTransition as Record<string, unknown>;
  const childProfiles = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Transition Readiness Intelligence</h2>{ratingBadge(d.rating as string)}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2"><Stat label="Overall Score" value={`${d.overallScore}/100`} /><Stat label="Transitions" value={tp.totalTransitions as number} /><Stat label="Handovers" value={ho.totalHandovers as number} /><Stat label="Follow-Ups" value={pt.totalFollowUps as number} /></div>
      <Section title="Transition Planning" defaultOpen>
        <ScoreBar label="Planning Quality" value={tp.overallScore as number} max={30} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Planned Rate" value={`${tp.plannedTransitionRate}%`} />
          <Stat label="Child Involvement" value={`${tp.childInvolvementRate}%`} />
          <Stat label="Child Views" value={`${tp.childViewsRate}%`} />
          <Stat label="Parent Involvement" value={`${tp.parentInvolvementRate}%`} />
          <Stat label="Visit Completed" value={`${tp.visitCompletedRate}%`} />
          <Stat label="Risk Assessment" value={`${tp.riskAssessmentRate}%`} />
          <Stat label="Info Transfer" value={`${tp.infoTransferRate}%`} />
          <Stat label="Goodbyes Celebrated" value={`${tp.goodbyesCelebratedRate}%`} />
        </div>
      </Section>
      <Section title="Handover Quality">
        <ScoreBar label="Handover" value={ho.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Comprehensive Rate" value={`${ho.comprehensiveRate}%`} />
          <Stat label="Document Transfer" value={`${ho.documentTransferRate}%`} />
          <Stat label="Care Plan Shared" value={`${ho.carePlanSharedRate}%`} />
          <Stat label="Health Info" value={`${ho.healthInfoRate}%`} />
          <Stat label="Triggers Shared" value={`${ho.triggersSharedRate}%`} />
          <Stat label="Child Preferences" value={`${ho.childPreferencesRate}%`} />
        </div>
      </Section>
      <Section title="Readiness Assessments">
        <ScoreBar label="Readiness" value={rd.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Fully Ready" value={`${rd.fullyReadyRate}%`} />
          <Stat label="Support Plan" value={`${rd.supportPlanRate}%`} />
          <Stat label="Contingency" value={`${rd.contingencyRate}%`} />
          <Stat label="Prof. Briefed" value={`${rd.professionalBriefedRate}%`} />
          <Stat label="Emotional Readiness" value={`${rd.emotionalReadinessGoodRate}%`} />
          <Stat label="Total Assessments" value={rd.totalAssessments as number} />
        </div>
      </Section>
      <Section title="Post-Transition Support">
        <ScoreBar label="Post-Transition" value={pt.overallScore as number} max={20} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Follow-Up Completed" value={`${pt.followUpCompletedRate}%`} />
          <Stat label="Within 7 Days" value={`${pt.within7DaysRate}%`} />
          <Stat label="Settling-In Review" value={`${pt.settlingInReviewRate}%`} />
          <Stat label="Key Worker Contact" value={`${pt.previousKeyWorkerContactRate}%`} />
          <Stat label="Child Feedback" value={`${pt.childFeedbackRate}%`} />
          <Stat label="Issue Resolution" value={`${pt.issueResolutionRate}%`} />
        </div>
      </Section>
      {childProfiles.length > 0 && <Section title={`Child Profiles (${childProfiles.length})`}>
        <div className="space-y-2">{childProfiles.map((c, i) => (
          <div key={i} className="border rounded p-2 text-sm">
            <div className="flex justify-between font-medium"><span>{c.childName as string}</span><span className="text-xs">{(c.transitionType as string).replace(/_/g, " ")}</span></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mt-1 text-xs">
              <span>Status: {(c.status as string).replace(/_/g, " ")}</span>
              <span>Readiness: {(c.readinessLevel as string).replace(/_/g, " ")}</span>
              <span>Handover: {(c.handoverQuality as string).replace(/_/g, " ")}</span>
              <span>Score: {c.overallScore as number}/10</span>
            </div>
            <div className="text-xs mt-1"><span>Child Feeling: {(c.childFeeling as string).replace(/_/g, " ")}</span>{c.followUpCompleted ? <span className="text-green-700 ml-2">Follow-up done</span> : <span className="text-orange-700 ml-2">No follow-up</span>}</div>
          </div>
        ))}</div>
      </Section>}
      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">&#10003; {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">&#9888; {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
