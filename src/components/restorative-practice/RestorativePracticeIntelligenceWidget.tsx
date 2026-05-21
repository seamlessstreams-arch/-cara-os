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

export function RestorativePracticeIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/restorative-practice")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading restorative practice intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const usage = d.usage as Record<string, unknown>;
  const quality = d.quality as Record<string, number>;
  const outcomes = d.outcomes as Record<string, unknown>;
  const incidentConversion = d.incidentConversion as Record<string, unknown>;
  const staffProfiles = (d.staffProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Restorative Practice Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Conversations" value={usage.totalConversations as number} />
        <Stat label="Per Week" value={usage.conversationsPerWeek as number} />
        <Stat label="Repair Rate" value={`${outcomes.repairRate as number}%`} />
      </div>

      <Section title="Usage" defaultOpen>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total" value={usage.totalConversations as number} />
          <Stat label="Completion" value={`${usage.completionRate as number}%`} />
          <Stat label="Avg Duration" value={`${usage.avgDuration as number}m`} />
          <Stat label="Scheduled" value={usage.scheduledCount as number} />
          <Stat label="Declined" value={usage.declinedCount as number} />
          <Stat label="Per Week" value={usage.conversationsPerWeek as number} />
        </div>
      </Section>

      <Section title="Quality">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Avg Quality" value={`${quality.avgQualityScore}%`} />
          <Stat label="Child Voice" value={`${quality.childVoiceRate}%`} />
          <Stat label="Child Led" value={`${quality.childLedRate}%`} />
          <Stat label="All Heard" value={`${quality.allPartiesHeardRate}%`} />
          <Stat label="Harm Acknowledged" value={`${quality.harmAcknowledgedRate}%`} />
          <Stat label="Repair Plan" value={`${quality.repairPlanRate}%`} />
          <Stat label="Emotions Explored" value={`${quality.emotionsExploredRate}%`} />
          <Stat label="Needs Identified" value={`${quality.needsIdentifiedRate}%`} />
        </div>
      </Section>

      <Section title="Outcomes">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Resolved" value={outcomes.totalResolved as number} />
          <Stat label="Repair Rate" value={`${outcomes.repairRate as number}%`} />
          <Stat label="No Resolution" value={`${outcomes.noResolutionRate as number}%`} />
          <Stat label="Escalated" value={outcomes.escalatedCount as number} />
          <Stat label="Follow-Up" value={`${outcomes.followUpRate as number}%`} />
          <Stat label="Follow-Up Done" value={`${outcomes.followUpCompletedRate as number}%`} />
          <Stat label="Avg Agreements" value={outcomes.averageAgreementsPerConversation as number} />
        </div>
      </Section>

      <Section title="Incident Conversion">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Incidents w/ Restorative" value={incidentConversion.incidentsWithRestorative as number} />
          <Stat label="Linked Incidents" value={incidentConversion.totalLinkedIncidents as number} />
          <Stat label="Conversion Rate" value={`${incidentConversion.conversionRate as number}%`} />
          <Stat label="Avg Days to Restorative" value={incidentConversion.avgDaysToRestorative as number} />
        </div>
      </Section>

      {staffProfiles.length > 0 && (
        <Section title={`Staff Facilitator Profiles (${staffProfiles.length})`}>
          {staffProfiles.map((s) => (
            <div key={s.staffName as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{s.staffName as string}</span><span>Quality {s.avgQualityScore as number}%</span></div>
              <p className="text-xs text-gray-500 mt-1">{s.totalFacilitated as number} facilitated · Repair {s.repairRate as number}% · Child voice {s.childVoiceRate as number}%</p>
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
