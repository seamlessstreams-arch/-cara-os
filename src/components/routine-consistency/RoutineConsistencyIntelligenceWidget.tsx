"use client";
import { useEffect, useState } from "react";

function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colour = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{value}/{max}</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded">
        <div className={`${colour} h-2 rounded`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{String(value)}</p>
    </div>
  );
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded mb-3">
      <button className="w-full flex justify-between items-center p-3 text-left font-medium text-sm" onClick={() => setOpen(!open)}>
        {title}<span>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-3 pt-0">{children}</div>}
    </div>
  );
}

function ratingBadge(rating: string) {
  const colours: Record<string, string> = { outstanding: "bg-green-100 text-green-800", good: "bg-yellow-100 text-yellow-800", requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>;
}

export function RoutineConsistencyIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/routine-consistency")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading routine consistency intelligence: {error}</div>;
  if (!data) return null;

  const overallScore = data.overallScore as number;
  const rating = data.rating as string;
  const morningRoutine = data.morningRoutine as Record<string, unknown>;
  const eveningRoutine = data.eveningRoutine as Record<string, unknown>;
  const phaseBreakdown = (data.phaseBreakdown ?? []) as Record<string, unknown>[];
  const staffConsistency = data.staffConsistency as Record<string, unknown>;
  const childProfiles = (data.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (data.strengths ?? []) as string[];
  const areasForDevelopment = (data.areasForDevelopment ?? []) as string[];
  const immediateActions = (data.immediateActions ?? []) as string[];
  const regulatoryLinks = (data.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Routine Consistency Intelligence</h2>
        {ratingBadge(rating)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Overall Score" value={`${overallScore}/100`} />
        <Stat label="Morning Quality" value={`${morningRoutine.qualityRate}%`} />
        <Stat label="Evening Quality" value={`${eveningRoutine.qualityRate}%`} />
        <Stat label="Regular Staff" value={`${staffConsistency.regularStaffRate}%`} />
      </div>

      <Section title="Morning Routine" defaultOpen>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="Quality Rate" value={`${morningRoutine.qualityRate}%`} />
          <Stat label="On-Time Rate" value={`${morningRoutine.onTimeRate}%`} />
          <Stat label="Cooperation" value={`${morningRoutine.cooperationRate}%`} />
          <Stat label="School Readiness" value={`${morningRoutine.schoolReadinessRate}%`} />
        </div>
        {(morningRoutine.commonDisruptions as Record<string, unknown>[]).length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Common Disruptions:</p>
            <div className="flex flex-wrap gap-1">
              {(morningRoutine.commonDisruptions as Record<string, unknown>[]).slice(0, 5).map((d, i) => (
                <span key={i} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded">
                  {(d.type as string).replace(/_/g, " ")} ({d.count as number})
                </span>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="Evening Routine">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="Quality Rate" value={`${eveningRoutine.qualityRate}%`} />
          <Stat label="On-Time Rate" value={`${eveningRoutine.onTimeRate}%`} />
          <Stat label="Bedtime Compliance" value={`${eveningRoutine.bedtimeComplianceRate}%`} />
          <Stat label="Wind-Down Quality" value={`${eveningRoutine.windDownQuality}%`} />
        </div>
      </Section>

      {phaseBreakdown.length > 0 && (
        <Section title="Phase Breakdown">
          <div className="space-y-2">
            {phaseBreakdown.map((phase) => (
              <div key={phase.phase as string} className="border rounded p-2">
                <div className="flex justify-between items-center text-sm font-medium mb-1">
                  <span>{phase.phaseLabel as string}</span>
                  <span className="text-xs text-gray-500">{phase.totalRecords as number} records</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-xs text-gray-600">
                  <span>Quality: {phase.excellentOrGoodRate as number}%</span>
                  <span>On-Time: {phase.onTimeRate as number}%</span>
                  <span>Cooperation: {phase.cooperationRate as number}%</span>
                  <span>Mood: {phase.averageMood as number}/5</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Staff Consistency">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="Regular Staff" value={`${staffConsistency.regularStaffRate}%`} />
          <Stat label="Handover Completion" value={`${staffConsistency.handoverCompletionRate}%`} />
          <Stat label="Handover Quality" value={`${staffConsistency.handoverQualityRate}%`} />
          <Stat label="Staff Change Disruptions" value={staffConsistency.staffTurnoverImpact as number} />
        </div>
      </Section>

      {childProfiles.length > 0 && (
        <Section title="Child Profiles">
          <div className="space-y-2">
            {childProfiles.map((cp) => (
              <div key={cp.childId as string} className="border rounded p-2">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span>{cp.childName as string}</span>
                  <span className="text-xs">Cooperation: {cp.overallCooperationRate as number}%</span>
                </div>
                <div className="grid grid-cols-3 gap-1 mt-1 text-xs text-gray-600">
                  <span>Morning: {cp.morningQualityRate as number}%</span>
                  <span>Evening: {cp.eveningQualityRate as number}%</span>
                  <span>Disruptions: {cp.disruptionCount as number}</span>
                </div>
                {cp.primaryConcern && (
                  <p className="text-xs text-orange-600 mt-1">{cp.primaryConcern as string}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {strengths.length > 0 && (
        <Section title="Strengths">
          <ul className="text-sm space-y-1 list-disc list-inside">{strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </Section>
      )}

      {areasForDevelopment.length > 0 && (
        <Section title="Areas for Development">
          <ul className="text-sm space-y-1 list-disc list-inside">{areasForDevelopment.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </Section>
      )}

      {immediateActions.length > 0 && (
        <Section title="Immediate Actions">
          <ul className="text-sm space-y-1 list-disc list-inside">{immediateActions.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </Section>
      )}

      {regulatoryLinks.length > 0 && (
        <Section title="Regulatory Links">
          <ul className="text-sm space-y-1 list-disc list-inside">{regulatoryLinks.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </Section>
      )}
    </div>
  );
}
