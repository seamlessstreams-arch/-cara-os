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

export function KeyWorkingEffectivenessIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/key-working-effectiveness")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading key working effectiveness intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const se = d.sessionEffectiveness as Record<string, number>;
  const rq = d.relationshipQuality as Record<string, number>;
  const cpi = d.carePlanIntegration as Record<string, number>;
  const pd = d.professionalDevelopment as Record<string, number>;
  const profiles = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Key Working Effectiveness Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Total Sessions" value={se.totalSessions} />
        <Stat label="Total Relationships" value={rq.totalRelationships} />
        <Stat label="Key Workers" value={pd.totalKeyWorkers} />
      </div>

      <ScoreBar label="Session Effectiveness" value={se.overallScore} />
      <ScoreBar label="Relationship Quality" value={rq.overallScore} />
      <ScoreBar label="Care Plan Integration" value={cpi.overallScore} />
      <ScoreBar label="Professional Development" value={pd.overallScore} />

      <Section title="Session Effectiveness" defaultOpen>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Excellent/Good Rate" value={`${se.excellentGoodRate}%`} />
          <Stat label="Child Engagement" value={`${se.childEngagementRate}%`} />
          <Stat label="Child Voice" value={`${se.childVoiceRate}%`} />
          <Stat label="Recording Compliance" value={`${se.recordingComplianceRate}%`} />
          <Stat label="Avg Duration" value={`${se.averageDurationMinutes} min`} />
          <Stat label="Actions Completion" value={`${se.actionsCompletionRate}%`} />
        </div>
      </Section>

      <Section title="Relationship Quality">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Strong/Developing" value={`${rq.strongDevelopingRate}%`} />
          <Stat label="Child Feels Listened" value={`${rq.childFeelsListenedRate}%`} />
          <Stat label="Child Trusts KW" value={`${rq.childTrustsRate}%`} />
          <Stat label="Avg Consistency" value={rq.averageConsistencyRating} />
          <Stat label="High Turnover" value={rq.highTurnoverCount} />
        </div>
      </Section>

      <Section title="Care Plan Integration">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Comprehensive/Partial" value={`${cpi.comprehensivePartialRate}%`} />
          <Stat label="Review Attendance" value={`${cpi.reviewAttendanceRate}%`} />
          <Stat label="Reports Timely" value={`${cpi.reportsTimelyRate}%`} />
          <Stat label="Child Views Represented" value={`${cpi.childViewsRepresentedRate}%`} />
          <Stat label="Outcomes Focused" value={`${cpi.outcomesFocusedRate}%`} />
        </div>
      </Section>

      <Section title="Professional Development">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Training Compliance" value={`${pd.trainingComplianceRate}%`} />
          <Stat label="Regular Supervision" value={`${pd.supervisionRegularRate}%`} />
          <Stat label="Reflective Practice" value={`${pd.reflectivePracticeRate}%`} />
          <Stat label="Manageable Caseload" value={`${pd.managableCaseloadRate}%`} />
          <Stat label="Peer Support" value={`${pd.peerSupportRate}%`} />
        </div>
      </Section>

      {profiles.length > 0 && (
        <Section title={`Child Profiles (${profiles.length})`}>
          {profiles.map((c) => (
            <div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span>{c.overallScore as number}/10</span></div>
              <p className="text-xs text-gray-500 mt-1">{c.sessionCount as number} sessions · {c.engagementRate as number}% engaged · KW: {c.keyWorkerName as string}</p>
              <p className="text-xs text-gray-500">Relationship: {String(c.relationshipQuality).replace(/_/g, " ")} · Care Plan: {String(c.carePlanInput).replace(/_/g, " ")}</p>
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
