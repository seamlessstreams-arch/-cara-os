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

export function IncidentPatternAnalysisIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/incident-pattern-analysis")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading incident pattern analysis intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const ir = d.incidentResponse as Record<string, number>;
  const nc = d.notificationCompliance as Record<string, number>;
  const pa = d.patternAnalysis as Record<string, unknown>;
  const pi = d.postIncident as Record<string, number>;
  const children = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Incident Pattern Analysis Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Incidents" value={ir.totalIncidents} />
        <Stat label="Critical" value={ir.criticalIncidentCount} />
        <Stat label="Children" value={children.length} />
      </div>

      <Section title="Incident Response" defaultOpen>
        <ScoreBar label="Incident Response" value={ir.overallScore} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Response Quality" value={`${ir.responseQualityRate}%`} />
          <Stat label="De-escalation" value={`${ir.deEscalationSuccessRate}%`} />
          <Stat label="Child Debrief" value={`${ir.childDebriefRate}%`} />
          <Stat label="Restraint Rate" value={`${ir.restraintRate}%`} />
          <Stat label="Major Incidents" value={ir.majorIncidentCount} />
          <Stat label="Avg Response (min)" value={ir.averageResponseTimeMins} />
        </div>
      </Section>

      <Section title="Notification Compliance">
        <ScoreBar label="Notification Compliance" value={nc.overallScore} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Notifiable" value={nc.totalNotifiable} />
          <Stat label="Timely & Complete" value={`${nc.timelyCompleteRate}%`} />
          <Stat label="Late" value={nc.lateNotificationCount} />
          <Stat label="Not Notified" value={nc.notNotifiedCount} />
          <Stat label="Managers Informed" value={`${nc.managersInformedRate}%`} />
        </div>
      </Section>

      <Section title="Pattern Analysis">
        <ScoreBar label="Pattern Analysis" value={pa.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Trends Analysed" value={pa.trendsAnalysed as number} />
          <Stat label="Escalating Children" value={pa.escalatingChildCount as number} />
          <Stat label="Predominant Category" value={(pa.predominantCategory as string).replace(/_/g, " ")} />
          <Stat label="Lessons Identified" value={`${pa.lessonsIdentifiedRate as number}%`} />
          <Stat label="Trigger Patterns" value={pa.triggerPatternsIdentified as number} />
          <Stat label="Environmental Factors" value={pa.environmentalFactorsCount as number} />
        </div>
      </Section>

      <Section title="Post-Incident">
        <ScoreBar label="Post-Incident" value={pi.overallScore} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Debrief Rate" value={`${pi.debriefCompletionRate}%`} />
          <Stat label="Support Plan" value={`${pi.supportPlanUpdateRate}%`} />
          <Stat label="Medical Attention" value={`${pi.medicalAttentionRate}%`} />
          <Stat label="External Referral" value={`${pi.externalReferralRate}%`} />
          <Stat label="No Action" value={pi.noActionCount} />
        </div>
      </Section>

      {children.length > 0 && (
        <Section title={`Child Profiles (${children.length})`}>
          {children.map((c) => (
            <div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span>{c.overallScore as number}/10</span></div>
              <p className="text-xs text-gray-500 mt-1">{c.incidentCount as number} incidents · {c.criticalCount as number} critical · De-escalation {c.deEscalationSuccessRate as number}% · {c.restraintCount as number} restraints{(c.escalating as boolean) ? " · ESCALATING" : ""}</p>
            </div>
          ))}
        </Section>
      )}

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">&#10003; {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">&#9888; {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
