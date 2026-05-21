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

export function PostIncidentLearningIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/post-incident-learning")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading post-incident learning intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const debrief = d.debriefQuality as Record<string, unknown>;
  const learning = d.learningEffectiveness as Record<string, unknown>;
  const pattern = d.patternRecognition as Record<string, unknown>;
  const team = d.teamLearning as Record<string, number>;
  const incidentProfiles = (d.incidentProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Post-Incident Learning Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Reviews" value={debrief.totalReviews as number} />
        <Stat label="Actions" value={learning.totalActions as number} />
        <Stat label="Team Sessions" value={team.totalSessions} />
      </div>

      <Section title="Debrief Quality" defaultOpen>
        <ScoreBar label="Debrief Quality" value={debrief.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Within 24h" value={`${debrief.within24hRate as number}%`} />
          <Stat label="Completed" value={`${debrief.completedRate as number}%`} />
          <Stat label="Child Debrief" value={`${debrief.childDebriefRate as number}%`} />
          <Stat label="Staff Debrief" value={`${debrief.staffDebriefRate as number}%`} />
          <Stat label="Root Cause" value={`${debrief.rootCauseRate as number}%`} />
          <Stat label="Lessons Documented" value={`${debrief.lessonsDocumentedRate as number}%`} />
        </div>
      </Section>

      <Section title="Learning Effectiveness">
        <ScoreBar label="Learning" value={learning.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Completed" value={`${learning.completedRate as number}%`} />
          <Stat label="Evidence Recorded" value={`${learning.evidenceRate as number}%`} />
          <Stat label="Practice Changes" value={learning.practiceChangeCount as number} />
          <Stat label="Policy Updates" value={learning.policyUpdateCount as number} />
          <Stat label="Training Delivered" value={learning.trainingDeliveredCount as number} />
        </div>
      </Section>

      <Section title="Pattern Recognition">
        <ScoreBar label="Pattern Recognition" value={pattern.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Patterns" value={pattern.totalPatterns as number} />
          <Stat label="Triggers Identified" value={`${pattern.triggerIdentifiedRate as number}%`} />
          <Stat label="Strategies Updated" value={`${pattern.strategiesUpdatedRate as number}%`} />
          <Stat label="Multi-Agency" value={`${pattern.multiAgencyRate as number}%`} />
          <Stat label="Escalating" value={pattern.escalatingCount as number} />
          <Stat label="Chronic" value={pattern.chronicCount as number} />
          <Stat label="Recurring Rate" value={`${pattern.recurringRate as number}%`} />
        </div>
      </Section>

      <Section title="Team Learning">
        <ScoreBar label="Team Learning" value={team.overallScore} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Sessions" value={team.totalSessions} />
          <Stat label="Incident Related" value={`${team.incidentRelatedRate}%`} />
          <Stat label="Avg Attendance" value={`${team.averageAttendance}%`} />
          <Stat label="Action Completion" value={`${team.actionCompletionRate}%`} />
          <Stat label="Avg Action Points" value={team.averageActionPoints} />
        </div>
      </Section>

      {incidentProfiles.length > 0 && (
        <Section title={`Incident Learning Profiles (${incidentProfiles.length})`}>
          {incidentProfiles.map((p, i) => (
            <div key={i} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{String(p.incidentType).replace(/_/g, " ")}</span><span>{p.overallScore as number}/10</span></div>
              <p className="text-xs text-gray-500 mt-1">{p.reviewCount as number} reviews · Debrief {p.debriefRate as number}% · Lessons {p.lessonsRate as number}%{p.recurrencePattern ? ` · ${String(p.recurrencePattern).replace(/_/g, " ")}` : ""}</p>
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
