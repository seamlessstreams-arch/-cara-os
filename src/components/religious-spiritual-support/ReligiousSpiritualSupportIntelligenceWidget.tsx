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

export function ReligiousSpiritualSupportIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/religious-spiritual-support")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading religious &amp; spiritual support intelligence: {error}</div>;
  if (!data) return null;

  const overallScore = data.overallScore as number;
  const rating = data.rating as string;
  const needsAssessment = data.needsAssessment as Record<string, unknown>;
  const supportProvision = data.supportProvision as Record<string, unknown>;
  const festivalInclusion = data.festivalInclusion as Record<string, unknown>;
  const staffCompetence = data.staffCompetence as Record<string, unknown>;
  const childProfiles = (data.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (data.strengths ?? []) as string[];
  const areasForImprovement = (data.areasForImprovement ?? []) as string[];
  const actions = (data.actions ?? []) as string[];
  const regulatoryLinks = (data.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Religious &amp; Spiritual Support Intelligence</h2>
        {ratingBadge(rating)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Overall Score" value={`${overallScore}/100`} />
        <Stat label="Profiles" value={needsAssessment.totalProfiles as number} />
        <Stat label="Activities" value={supportProvision.totalActivities as number} />
        <Stat label="Festivals" value={festivalInclusion.totalFestivals as number} />
      </div>

      <Section title="Needs Assessment" defaultOpen>
        <ScoreBar label="Assessment Score" value={needsAssessment.overallScore as number} max={25} />
        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
          <Stat label="Needs Assessed" value={`${needsAssessment.needsAssessedRate}%`} />
          <Stat label="Documented" value={`${needsAssessment.needsDocumentedRate}%`} />
          <Stat label="Support Plan" value={`${needsAssessment.supportPlanRate}%`} />
          <Stat label="Review Current" value={`${needsAssessment.reviewCurrentRate}%`} />
        </div>
      </Section>

      <Section title="Support Provision">
        <ScoreBar label="Provision Score" value={supportProvision.overallScore as number} max={25} />
        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
          <Stat label="Excellent/Good" value={`${supportProvision.excellentGoodRate}%`} />
          <Stat label="Child Initiated" value={`${supportProvision.childInitiatedRate}%`} />
          <Stat label="Positive Feedback" value={`${supportProvision.positiveFeedbackRate}%`} />
          <Stat label="Support Types" value={supportProvision.supportTypeVariety as number} />
        </div>
      </Section>

      <Section title="Festival Inclusion">
        <ScoreBar label="Festival Score" value={festivalInclusion.overallScore as number} max={25} />
        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
          <Stat label="Observed" value={`${festivalInclusion.observedRate}%`} />
          <Stat label="Child Involved" value={`${festivalInclusion.childInvolvedRate}%`} />
          <Stat label="Culturally Appropriate" value={`${festivalInclusion.culturallyAppropriateRate}%`} />
          <Stat label="Children Covered" value={`${festivalInclusion.childrenCoveredRate}%`} />
        </div>
      </Section>

      <Section title="Staff Competence">
        <ScoreBar label="Competence Score" value={staffCompetence.overallScore as number} max={25} />
        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
          <Stat label="Faith Awareness" value={`${staffCompetence.faithAwarenessRate}%`} />
          <Stat label="Cultural Competence" value={`${staffCompetence.culturalCompetenceRate}%`} />
          <Stat label="Anti-Discrimination" value={`${staffCompetence.antiDiscriminationRate}%`} />
          <Stat label="Overall Competence" value={`${staffCompetence.overallCompetenceRate}%`} />
        </div>
      </Section>

      {childProfiles.length > 0 && (
        <Section title="Child Profiles">
          <div className="space-y-2">
            {childProfiles.map((cp) => (
              <div key={cp.childId as string} className="border rounded p-2">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span>{cp.childName as string}</span>
                  <span>{cp.overallScore as number}/10</span>
                </div>
                <div className="grid grid-cols-3 gap-1 mt-1 text-xs text-gray-600">
                  <span>Faith: {(cp.faithBackground as string).replace(/_/g, " ")}</span>
                  <span>Activities: {cp.activitiesCount as number}</span>
                  <span>Festivals: {cp.festivalsCount as number}</span>
                </div>
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

      {areasForImprovement.length > 0 && (
        <Section title="Areas for Improvement">
          <ul className="text-sm space-y-1 list-disc list-inside">{areasForImprovement.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </Section>
      )}

      {actions.length > 0 && (
        <Section title="Actions">
          <ul className="text-sm space-y-1 list-disc list-inside">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul>
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
