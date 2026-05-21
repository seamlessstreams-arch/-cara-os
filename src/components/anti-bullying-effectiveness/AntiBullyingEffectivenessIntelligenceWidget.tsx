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

export function AntiBullyingEffectivenessIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/anti-bullying-effectiveness")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading anti-bullying effectiveness intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const incident = d.incidentManagement as Record<string, unknown>;
  const prevention = d.preventionCulture as Record<string, unknown>;
  const intervention = d.interventionQuality as Record<string, unknown>;
  const staffReadiness = d.staffReadiness as Record<string, unknown>;
  const childProfiles = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Anti-Bullying Effectiveness Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Incident Mgmt" value={`${incident.score}/25`} />
        <Stat label="Prevention" value={`${prevention.score}/25`} />
        <Stat label="Total Incidents" value={incident.totalIncidents as number} />
      </div>

      <Section title="Incident Management" defaultOpen>
        <ScoreBar label="Incident Management Score" value={incident.score as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Timely Response" value={`${incident.timelyResponseRate}%`} />
          <Stat label="Fully Resolved" value={`${incident.fullyResolvedRate}%`} />
          <Stat label="Follow-Up Done" value={`${incident.followUpCompletedRate}%`} />
          <Stat label="Child View Sought" value={`${incident.childViewSoughtRate}%`} />
          <Stat label="Impact Assessed" value={`${incident.impactAssessedRate}%`} />
          <Stat label="Avg Response (hrs)" value={incident.averageResponseHours as number} />
        </div>
      </Section>

      <Section title="Prevention Culture">
        <ScoreBar label="Prevention Culture Score" value={prevention.score as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Surveys" value={prevention.totalSurveys as number} />
          <Stat label="Feels Safe" value={`${prevention.feelsSafeRate}%`} />
          <Stat label="Bullied Recently" value={`${prevention.bulliedRecentlyRate}%`} />
          <Stat label="High Confidence" value={`${prevention.highConfidenceRate}%`} />
          <Stat label="Children Consulted" value={(prevention.childrenConsulted as boolean) ? "✓" : "✗"} />
        </div>
      </Section>

      <Section title="Intervention Quality">
        <ScoreBar label="Intervention Quality Score" value={intervention.score as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Safety Plan Rate (High/Critical)" value={`${intervention.safetyPlanRateHighCritical}%`} />
          <Stat label="Restorative Practice" value={`${intervention.restorativePracticeRate}%`} />
          <Stat label="Diverse Interventions" value={intervention.diverseInterventions as number} />
          <Stat label="Resolution Rate" value={`${intervention.resolutionRate}%`} />
          <Stat label="Critical Incidents" value={intervention.criticalIncidents as number} />
        </div>
      </Section>

      <Section title="Staff Readiness">
        <ScoreBar label="Staff Readiness Score" value={staffReadiness.score as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Staff" value={staffReadiness.totalStaff as number} />
          <Stat label="Recognition Skills" value={`${staffReadiness.recognitionSkillsRate}%`} />
          <Stat label="Intervention Skills" value={`${staffReadiness.interventionSkillsRate}%`} />
          <Stat label="Restorative Practice" value={`${staffReadiness.restorativePracticeRate}%`} />
          <Stat label="Overall Trained" value={`${staffReadiness.overallTrainedRate}%`} />
        </div>
      </Section>

      {childProfiles.length > 0 && (
        <Section title={`Child Profiles (${childProfiles.length})`}>
          {childProfiles.map((c) => (
            <div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span>Wellbeing: {c.wellbeingScore as number}/10</span></div>
              <p className="text-xs text-gray-500 mt-1">Target: {c.incidentsAsTarget as number} · Perpetrator: {c.incidentsAsPerpetrator as number} · Bystander: {c.incidentsAsBystander as number}</p>
              <div className="flex gap-2 mt-1 text-xs">
                {c.feelsSafe !== null && <span>{(c.feelsSafe as boolean) ? "✓" : "✗"} Feels Safe</span>}
                {c.bulliedRecently !== null && <span>{(c.bulliedRecently as boolean) ? "✗ Bullied Recently" : "✓ Not Bullied"}</span>}
              </div>
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
