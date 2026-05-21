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

export function AttachmentRelationshipsIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/attachment-relationships")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading attachment relationships intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const assessments = d.attachmentAssessments as Record<string, number>;
  const relQuality = d.relationshipQuality as Record<string, unknown>;
  const interQuality = d.interactionQuality as Record<string, number>;
  const stability = d.stability as Record<string, number>;
  const peerRels = d.peerRelationships as Record<string, number>;
  const childProfiles = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Attachment &amp; Relationships Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Assessments" value={`${assessments.overallScore}/100`} />
        <Stat label="Relationships" value={`${(relQuality as Record<string, number>).overallScore}/100`} />
        <Stat label="Children Assessed" value={assessments.childrenAssessed} />
      </div>

      <Section title="Attachment Assessments" defaultOpen>
        <ScoreBar label="Assessment Score" value={assessments.overallScore} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Assessments" value={assessments.totalAssessments} />
          <Stat label="Coverage Rate" value={`${assessments.assessmentCoverageRate}%`} />
          <Stat label="Currency" value={`${assessments.assessmentCurrency}%`} />
          <Stat label="Informed Care" value={`${assessments.informedCareRate}%`} />
          <Stat label="Shared With Team" value={`${assessments.sharedWithTeamRate}%`} />
          <Stat label="Showing Progress" value={assessments.childrenShowingProgress} />
        </div>
      </Section>

      <Section title="Relationship Quality">
        <ScoreBar label="Relationship Quality Score" value={(relQuality as Record<string, number>).overallScore} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Relationships" value={(relQuality as Record<string, number>).totalRelationships} />
          <Stat label="Avg Trust" value={(relQuality as Record<string, number>).averageTrustScore} />
          <Stat label="Avg Consistency" value={(relQuality as Record<string, number>).averageConsistencyScore} />
          <Stat label="Avg Child Rating" value={(relQuality as Record<string, number>).averageChildRating} />
          <Stat label="Strong Rate" value={`${(relQuality as Record<string, number>).strongRelationshipsRate}%`} />
          <Stat label="Key Worker Quality" value={(relQuality as Record<string, number>).keyWorkerRelationshipQuality} />
        </div>
      </Section>

      <Section title="Interaction Quality">
        <ScoreBar label="Interaction Quality Score" value={interQuality.overallScore} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Interactions" value={interQuality.totalInteractions} />
          <Stat label="Avg Quality" value={interQuality.averageQuality} />
          <Stat label="Child Initiated" value={`${interQuality.childInitiatedRate}%`} />
          <Stat label="Attachment Relevant" value={`${interQuality.attachmentRelevantRate}%`} />
          <Stat label="Regulation Support" value={`${interQuality.regulationSupportRate}%`} />
          <Stat label="Per Child/Week" value={interQuality.interactionsPerChildPerWeek} />
        </div>
      </Section>

      <Section title="Stability">
        <ScoreBar label="Stability Score" value={stability.overallScore} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Key Worker Consistency" value={`${stability.keyWorkerConsistencyRate}%`} />
          <Stat label="Team Stability" value={`${stability.staffTeamStabilityRate}%`} />
          <Stat label="Avg Routine" value={stability.averageRoutineConsistency} />
          <Stat label="Avg Belonging" value={stability.averageBelonging} />
          <Stat label="Feels Safe" value={`${stability.childFeelsSafeRate}%`} />
          <Stat label="Feels Valued" value={`${stability.childFeelsValuedRate}%`} />
        </div>
      </Section>

      <Section title="Peer Relationships">
        <ScoreBar label="Peer Relationships Score" value={peerRels.overallScore} max={100} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Peer Rels" value={peerRels.totalPeerRelationships} />
          <Stat label="Avg Positive" value={peerRels.averagePositiveInteractions} />
          <Stat label="Avg Negative" value={peerRels.averageNegativeInteractions} />
          <Stat label="Conflict Resolution" value={`${peerRels.conflictResolutionRate}%`} />
          <Stat label="Mediation Needed" value={`${peerRels.mediationNeededRate}%`} />
        </div>
      </Section>

      {childProfiles.length > 0 && (
        <Section title={`Child Profiles (${childProfiles.length})`}>
          {childProfiles.map((c) => (
            <div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span>Wellbeing: {c.overallWellbeing as number}/10</span></div>
              <p className="text-xs text-gray-500 mt-1">Style: {String(c.attachmentStyle).replace(/_/g, " ")} · {c.totalRelationships as number} relationships · {c.strongRelationships as number} strong</p>
              {(c.riskFactors as string[]).length > 0 && <p className="text-xs text-red-600 mt-1">Risk: {(c.riskFactors as string[]).join(", ")}</p>}
              {(c.protectiveFactors as string[]).length > 0 && <p className="text-xs text-green-600 mt-1">Protective: {(c.protectiveFactors as string[]).join(", ")}</p>}
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
