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

export function TransitionsIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/transitions").then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); }).then((json) => setData(json.data)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading transitions intelligence: {error}</div>;
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const quality = d.transitionQuality as Record<string, unknown>;
  const compliance = d.transitionCompliance as Record<string, unknown>;
  const policy = d.transitionPolicy as Record<string, unknown>;
  const staff = d.staffReadiness as Record<string, unknown>;
  const childProfiles = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Transitions Intelligence</h2>{ratingBadge(d.rating as string)}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2"><Stat label="Overall Score" value={`${d.overallScore}/100`} /><Stat label="Total Transitions" value={quality.totalTransitions as number} /><Stat label="Total Staff" value={staff.totalStaff as number} /><Stat label="Rating" value={(d.rating as string).replace(/_/g, " ")} /></div>
      <Section title="Transition Quality" defaultOpen>
        <ScoreBar label="Quality" value={quality.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Plan Rate" value={`${quality.transitionPlanRate}%`} />
          <Stat label="Child Prepared" value={`${quality.childPreparedRate}%`} />
          <Stat label="Receiving Briefed" value={`${quality.receivingBriefedRate}%`} />
          <Stat label="Handover Rate" value={`${quality.handoverRate}%`} />
        </div>
      </Section>
      <Section title="Transition Compliance">
        <ScoreBar label="Compliance" value={compliance.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Documentation" value={`${compliance.documentationRate}%`} />
          <Stat label="Timely" value={`${compliance.timelyRate}%`} />
          <Stat label="Handover" value={`${compliance.handoverRate}%`} />
          <Stat label="Category Diversity" value={`${compliance.categoryDiversityRatio}%`} />
        </div>
      </Section>
      <Section title="Transition Policy">
        <ScoreBar label="Policy" value={policy.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Transition Policy" value={policy.transitionPolicy ? "Yes" : "No"} />
          <Stat label="Placement Stability" value={policy.placementStabilityGuidance ? "Yes" : "No"} />
          <Stat label="Handover Protocol" value={policy.handoverProtocol ? "Yes" : "No"} />
          <Stat label="Child Prep Framework" value={policy.childPreparationFramework ? "Yes" : "No"} />
          <Stat label="Family Involvement" value={policy.familyInvolvementPolicy ? "Yes" : "No"} />
          <Stat label="Emergency Protocol" value={policy.emergencyMoveProtocol ? "Yes" : "No"} />
          <Stat label="Review Schedule" value={policy.reviewSchedule ? "Yes" : "No"} />
        </div>
      </Section>
      <Section title="Staff Transition Readiness">
        <ScoreBar label="Staff Readiness" value={staff.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Planning Training" value={`${staff.transitionPlanningRate}%`} />
          <Stat label="Child Preparation" value={`${staff.childPreparationRate}%`} />
          <Stat label="Handover Skills" value={`${staff.handoverSkillsRate}%`} />
          <Stat label="Family Engagement" value={`${staff.familyEngagementRate}%`} />
          <Stat label="Multi-Agency" value={`${staff.multiAgencyWorkingRate}%`} />
          <Stat label="Emotional Support" value={`${staff.emotionalSupportRate}%`} />
        </div>
      </Section>
      {childProfiles.length > 0 && <Section title={`Child Profiles (${childProfiles.length})`}>
        <div className="space-y-2">{childProfiles.map((c, i) => (
          <div key={i} className="border rounded p-2 text-sm">
            <div className="flex justify-between font-medium"><span>{c.childName as string}</span><span className="text-xs">Score: {c.overallScore as number}/10</span></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mt-1 text-xs">
              <span>Records: {c.totalRecords as number}</span>
              <span>Plan Rate: {c.transitionPlanRate as number}%</span>
              <span>Prepared: {c.childPreparedRate as number}%</span>
              <span>Categories: {(c.categoriesCovered as string[]).length}</span>
            </div>
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
