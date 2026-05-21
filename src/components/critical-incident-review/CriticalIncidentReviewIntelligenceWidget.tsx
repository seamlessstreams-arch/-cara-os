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

export function CriticalIncidentReviewIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/critical-incident-review")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading critical incident review intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const debrief = d.debriefQuality as Record<string, number>;
  const learning = d.learningIdentification as Record<string, number>;
  const practice = d.practiceChange as Record<string, unknown>;
  const trend = d.trendAnalysis as Record<string, unknown>;
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Critical Incident Review Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Debrief Quality" value={`${debrief.overallScore}/30`} />
        <Stat label="Learning" value={`${learning.overallScore}/25`} />
        <Stat label="Incidents" value={debrief.totalIncidents} />
      </div>

      <Section title="Debrief Quality" defaultOpen>
        <ScoreBar label="Debrief Quality" value={debrief.overallScore} max={30} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Completion Rate" value={`${debrief.debriefCompletionRate}%`} />
          <Stat label="Timely Debrief" value={`${debrief.timelyDebriefRate}%`} />
          <Stat label="Child Included" value={`${debrief.childIncludedRate}%`} />
          <Stat label="Root Cause ID" value={`${debrief.rootCauseIdentifiedRate}%`} />
          <Stat label="On Time" value={debrief.debriefedOnTime} />
          <Stat label="Not Debriefed" value={debrief.notDebriefed} />
        </div>
      </Section>

      <Section title="Learning Identification">
        <ScoreBar label="Learning" value={learning.overallScore} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Learnings" value={learning.totalLearnings} />
          <Stat label="Implementation" value={`${learning.implementationRate}%`} />
          <Stat label="Shared with Team" value={`${learning.sharedWithTeamRate}%`} />
          <Stat label="In Supervision" value={`${learning.sharedInSupervisionRate}%`} />
          <Stat label="Embedded" value={learning.embedded} />
          <Stat label="Not Identified" value={learning.notIdentified} />
        </div>
      </Section>

      <Section title="Practice Changes">
        <ScoreBar label="Practice Change" value={practice.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Changes" value={practice.totalChanges as number} />
          <Stat label="Impact Assessed" value={`${practice.impactAssessedRate}%`} />
          <Stat label="Positive Impact" value={`${practice.positiveImpactRate}%`} />
          <Stat label="Sustainability" value={`${practice.sustainabilityReviewedRate}%`} />
        </div>
      </Section>

      <Section title="Trend Analysis">
        <ScoreBar label="Trend Analysis" value={trend.overallScore as number} max={20} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Current Period" value={trend.totalIncidents as number} />
          <Stat label="Previous Period" value={trend.previousPeriodTotal as number} />
          <Stat label="Overall Trend" value={trend.overallTrend as string} />
          <Stat label="Repeat Rate" value={`${trend.repeatIncidentRate}%`} />
          <Stat label="High Severity" value={trend.highSeverityCount as number} />
          <Stat label="Critical Severity" value={trend.criticalSeverityCount as number} />
        </div>
      </Section>

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">&#10003; {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">&#9888; {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
