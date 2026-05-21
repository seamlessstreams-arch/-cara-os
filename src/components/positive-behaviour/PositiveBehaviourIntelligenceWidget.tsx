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

export function PositiveBehaviourIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/positive-behaviour")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading positive behaviour intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const bsp = d.bspEvaluation as Record<string, unknown>;
  const deesc = d.deEscalation as Record<string, unknown>;
  const rsBalance = d.rewardSanctionBalance as Record<string, unknown>;
  const incPatterns = d.incidentPatterns as Record<string, unknown>;
  const childProfiles = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Positive Behaviour Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Active Plans" value={bsp.activePlans as number} />
        <Stat label="De-escalations" value={deesc.totalRecords as number} />
        <Stat label="Incidents" value={incPatterns.totalIncidents as number} />
      </div>

      <Section title="Behaviour Support Plans" defaultOpen>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Plans" value={bsp.totalPlans as number} />
          <Stat label="Coverage" value={`${bsp.planCoverageRate as number}%`} />
          <Stat label="Currency" value={`${bsp.planCurrencyRate as number}%`} />
          <Stat label="Child Involvement" value={`${bsp.childInvolvementRate as number}%`} />
          <Stat label="Family Involvement" value={`${bsp.familyInvolvementRate as number}%`} />
          <Stat label="Strategy Completeness" value={`${bsp.strategyComprehensivenessRate as number}%`} />
          <Stat label="Risk Assessment" value={`${bsp.riskAssessmentAttachmentRate as number}%`} />
        </div>
      </Section>

      <Section title="De-Escalation">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Success Rate" value={`${deesc.successRate as number}%`} />
          <Stat label="Partial Success" value={`${deesc.partialSuccessRate as number}%`} />
          <Stat label="Unsuccessful" value={`${deesc.unsuccessRate as number}%`} />
          <Stat label="PI Avoidance" value={`${deesc.physicalInterventionAvoidanceRate as number}%`} />
          <Stat label="Avg Duration" value={`${deesc.averageDurationMinutes as number}m`} />
          <Stat label="Strategy Variety" value={deesc.strategyVariety as number} />
        </div>
      </Section>

      <Section title="Reward:Sanction Balance">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Recognitions" value={rsBalance.totalRecognitions as number} />
          <Stat label="Sanctions" value={rsBalance.totalSanctions as number} />
          <Stat label="Ratio" value={`${rsBalance.rewardSanctionRatio as number}:1`} />
          <Stat label="Meets 3:1" value={(rsBalance.ratioMeetsTarget as boolean) ? "Yes" : "No"} />
          <Stat label="Rec. Variety" value={rsBalance.recognitionTypeVariety as number} />
          <Stat label="Proportionate" value={`${rsBalance.sanctionProportionalityRate as number}%`} />
          <Stat label="Child Voice" value={`${rsBalance.childVoiceInSanctionsRate as number}%`} />
          <Stat label="Restoration" value={`${rsBalance.restorationPlanningRate as number}%`} />
        </div>
      </Section>

      <Section title="Incident Patterns">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total" value={incPatterns.totalIncidents as number} />
          <Stat label="Trend" value={String(incPatterns.frequencyTrend).replace(/_/g, " ")} />
          <Stat label="Debrief Done" value={`${incPatterns.debriefCompletionRate as number}%`} />
          <Stat label="Physical Int." value={`${incPatterns.physicalInterventionRate as number}%`} />
          <Stat label="De-esc Attempted" value={`${incPatterns.deEscalationAttemptedRate as number}%`} />
        </div>
      </Section>

      {childProfiles.length > 0 && (
        <Section title={`Child Behaviour Profiles (${childProfiles.length})`}>
          {childProfiles.map((c) => (
            <div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span>{String(c.planStatus).replace(/_/g, " ")}</span></div>
              <p className="text-xs text-gray-500 mt-1">{c.incidentCount as number} incidents · De-esc {c.deEscalationSuccessRate as number}% · R:S {c.rewardSanctionRatio as number}:1 · {String(c.improvementTrend).replace(/_/g, " ")}</p>
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
