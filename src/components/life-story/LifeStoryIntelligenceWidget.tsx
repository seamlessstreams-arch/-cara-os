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
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>;
}

export function LifeStoryIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/life-story")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading life story intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const sq = d.sessionQuality as Record<string, unknown>;
  const ic = d.identityCulture as Record<string, unknown>;
  const lp = d.lifeStoryPolicy as Record<string, unknown>;
  const sr = d.staffReadiness as Record<string, unknown>;
  const profiles = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Life Story Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Total Sessions" value={sq.totalSessions as number} />
        <Stat label="Completed" value={sq.completedSessions as number} />
        <Stat label="Staff Trained" value={sr.totalStaff as number} />
      </div>

      <ScoreBar label="Session Quality" value={sq.overallScore as number} />
      <ScoreBar label="Identity & Culture" value={ic.overallScore as number} />
      <ScoreBar label="Policy & Governance" value={lp.overallScore as number} />
      <ScoreBar label="Staff Readiness" value={sr.overallScore as number} />

      <Section title="Session Quality" defaultOpen>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Completion Rate" value={`${sq.completionRate as number}%`} />
          <Stat label="Child-Led Rate" value={`${sq.childLedRate as number}%`} />
          <Stat label="Engagement Rate" value={`${sq.engagementRate as number}%`} />
          <Stat label="Documentation Rate" value={`${sq.documentationRate as number}%`} />
        </div>
      </Section>

      <Section title="Identity & Culture">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Identity Addressed" value={`${ic.identityAddressedRate as number}%`} />
          <Stat label="Cultural Activity" value={`${ic.culturalActivityRate as number}%`} />
          <Stat label="Family Explored" value={`${ic.familyExploredRate as number}%`} />
          <Stat label="Photograph Rate" value={`${ic.photographRate as number}%`} />
        </div>
      </Section>

      <Section title="Policy & Governance">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Life Story Policy" value={lp.lifeStoryWorkPolicy ? "Yes" : "No"} />
          <Stat label="Child-Friendly Materials" value={lp.childFriendlyMaterials ? "Yes" : "No"} />
          <Stat label="Review Schedule" value={lp.regularReviewSchedule ? "Yes" : "No"} />
          <Stat label="Memory Keeping" value={lp.memoryKeepingProtocol ? "Yes" : "No"} />
          <Stat label="Identity Framework" value={lp.identityAssessmentFramework ? "Yes" : "No"} />
          <Stat label="Cultural Plan" value={lp.culturalCompetencyPlan ? "Yes" : "No"} />
          <Stat label="Family Protocol" value={lp.familyConnectionProtocol ? "Yes" : "No"} />
        </div>
      </Section>

      <Section title="Staff Readiness">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Life Story Work" value={`${sr.lifeStoryWorkRate as number}%`} />
          <Stat label="Identity Support" value={`${sr.identitySupportRate as number}%`} />
          <Stat label="Cultural Competency" value={`${sr.culturalCompetencyRate as number}%`} />
          <Stat label="Therapeutic Approach" value={`${sr.therapeuticApproachRate as number}%`} />
          <Stat label="Memory Keeping" value={`${sr.memoryKeepingRate as number}%`} />
          <Stat label="Family Work Skills" value={`${sr.familyWorkSkillsRate as number}%`} />
        </div>
      </Section>

      {profiles.length > 0 && (
        <Section title={`Child Profiles (${profiles.length})`}>
          {profiles.map((c) => (
            <div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span>{c.overallScore as number}/10</span></div>
              <p className="text-xs text-gray-500 mt-1">{c.totalSessions as number} sessions · {c.completionRate as number}% completed · {c.childLedRate as number}% child-led</p>
              <p className="text-xs text-gray-500">Types covered: {(c.sessionTypesCovered as string[]).length}</p>
            </div>
          ))}
        </Section>
      )}

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">✓ {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">⚠ {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
