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

export function StaffPerformanceIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/staff-performance")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading staff performance intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const qualComp = d.qualificationCompliance as Record<string, unknown>;
  const review = d.reviewQuality as Record<string, unknown>;
  const pdp = d.pdpProgress as Record<string, unknown>;
  const competency = d.competencyDevelopment as Record<string, unknown>;
  const profiles = (d.staffProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Staff Performance Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Reviews" value={review.totalReviews as number} />
        <Stat label="PDP Goals" value={pdp.totalGoals as number} />
        <Stat label="Assessments" value={competency.totalAssessments as number} />
      </div>

      <Section title="Qualification Compliance" defaultOpen>
        <ScoreBar label="Qualifications" value={qualComp.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Achieved Rate" value={`${qualComp.achievedRate}%`} />
          <Stat label="Expired" value={qualComp.expiredCount as number} />
          <Stat label="Mandatory Compliance" value={`${qualComp.mandatoryComplianceRate}%`} />
          <Stat label="Renewal Rate" value={typeof qualComp.renewalRate === "number" ? `${qualComp.renewalRate}%` : "—"} />
        </div>
      </Section>

      <Section title="Review Quality">
        <ScoreBar label="Review Quality" value={review.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Completion Rate" value={`${review.completionRate}%`} />
          <Stat label="Objectives Met" value={`${review.objectivesMetRate}%`} />
          <Stat label="Staff Views Recorded" value={`${review.staffViewsRate}%`} />
          <Stat label="Action Plans" value={`${review.actionPlanRate}%`} />
          <Stat label="Positive Rating Rate" value={`${review.positiveRatingRate}%`} />
          <Stat label="Negative Ratings" value={review.negativeRatingCount as number} />
        </div>
      </Section>

      <Section title="PDP Progress">
        <ScoreBar label="PDP Progress" value={pdp.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Achievement Rate" value={`${pdp.achievementRate}%`} />
          <Stat label="Linked to Training" value={`${pdp.linkedToTrainingRate}%`} />
          <Stat label="Missed Goals" value={`${pdp.missedGoalRate}%`} />
          <Stat label="All Staff 2+ Goals" value={pdp.staffWithMinGoals ? "Yes" : "No"} />
        </div>
      </Section>

      <Section title="Competency Development">
        <ScoreBar label="Competency" value={competency.overallScore as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Staff Coverage" value={`${competency.staffCoverageRate}%`} />
          <Stat label="Avg Competency" value={competency.averageCompetencyScore as number} />
          <Stat label="Improvement Rate" value={`${competency.improvementRate}%`} />
          <Stat label="High Competency" value={`${competency.highCompetencyRate}%`} />
          <Stat label="Critical Areas Covered" value={competency.criticalAreasCovered ? "Yes" : "No"} />
        </div>
      </Section>

      {profiles.length > 0 && (
        <Section title={`Staff Profiles (${profiles.length})`}>
          {profiles.map((p) => (
            <div key={p.staffId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium">
                <span>{p.staffName as string}</span>
                <span>{p.overallScore as number}/10</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Quals {p.qualificationComplianceRate as number}% · PDP {p.pdpGoalAchievementRate as number}% · Competency {p.averageCompetencyLevel as number}{p.currentPerformanceRating ? ` · ${(p.currentPerformanceRating as string).replace(/_/g, " ")}` : ""}</p>
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
