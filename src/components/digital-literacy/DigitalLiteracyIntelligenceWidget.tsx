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

export function DigitalLiteracyIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/digital-literacy")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading digital literacy intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const skills = d.digitalSkills as Record<string, unknown>;
  const access = d.deviceAccess as Record<string, unknown>;
  const learning = d.onlineLearning as Record<string, unknown>;
  const citizenship = d.digitalCitizenship as Record<string, unknown>;
  const children = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForDevelopment ?? []) as string[];
  const actions = (d.immediateActions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Digital Literacy Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Assessment Rate" value={`${skills.assessmentRate}%`} />
        <Stat label="Access Rate" value={`${access.accessRate}%`} />
        <Stat label="Children" value={children.length} />
      </div>

      <Section title="Digital Skills" defaultOpen>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Children" value={skills.totalChildren as number} />
          <Stat label="Assessed" value={skills.childrenWithAssessment as number} />
          <Stat label="Avg Skill Level" value={skills.averageSkillLevel as number} />
          <Stat label="Skill Gaps" value={(skills.skillGaps as string[]).length} />
          <Stat label="Dev Goals" value={skills.developmentGoalCount as number} />
          <Stat label="Overdue Reviews" value={skills.overdueReviews as number} />
        </div>
      </Section>

      <Section title="Device Access">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Children with Access" value={access.childrenWithAccess as number} />
          <Stat label="Access Rate" value={`${access.accessRate}%`} />
          <Stat label="Agreement Compliance" value={`${access.agreementComplianceRate}%`} />
          <Stat label="Age Appropriate" value={`${access.ageAppropriateRate}%`} />
          <Stat label="Overdue Reviews" value={access.overdueReviews as number} />
          <Stat label="Without Access" value={(access.childrenWithoutAccess as string[]).length} />
        </div>
      </Section>

      <Section title="Online Learning">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Sessions" value={learning.totalSessions as number} />
          <Stat label="Per Child" value={learning.sessionsPerChild as number} />
          <Stat label="Activity Types" value={learning.activityTypeCount as number} />
          <Stat label="Positive Outcome" value={`${learning.positiveOutcomeRate}%`} />
          <Stat label="Supervised" value={`${learning.supervisedRate}%`} />
          <Stat label="Avg Duration" value={`${learning.averageDuration}m`} />
        </div>
        {(learning.childrenWithNoLearning as string[]).length > 0 && (
          <p className="text-xs text-red-600 mt-2">No learning: {(learning.childrenWithNoLearning as string[]).join(", ")}</p>
        )}
      </Section>

      <Section title="Digital Citizenship">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Records" value={citizenship.totalRecords as number} />
          <Stat label="Positive Rate" value={`${citizenship.positiveRate}%`} />
          <Stat label="Area Coverage" value={`${citizenship.areaCoverage}/${citizenship.totalAreas}`} />
          <Stat label="Children Recorded" value={citizenship.childrenWithRecords as number} />
        </div>
      </Section>

      {children.length > 0 && (
        <Section title={`Child Profiles (${children.length})`}>
          {children.map((c) => (
            <div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span>{c.overallSkillLevel ? String(c.overallSkillLevel) : "Not assessed"}</span></div>
              <p className="text-xs text-gray-500 mt-1">{c.deviceAccessCount as number} devices · {c.learningSessionCount as number} sessions · {c.learningMinutes as number}m learning · Citizenship: {c.citizenshipPositiveRate as number}%</p>
              {(c.developmentAreas as string[]).length > 0 && (
                <p className="text-xs text-orange-600 mt-1">{(c.developmentAreas as string[]).join(", ")}</p>
              )}
            </div>
          ))}
        </Section>
      )}

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">&#10003; {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Development"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">&#9888; {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Immediate Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
