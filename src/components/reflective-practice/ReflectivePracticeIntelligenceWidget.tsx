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

export function ReflectivePracticeIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reflective-practice")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading reflective practice intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const engagement = d.engagement as Record<string, unknown>;
  const outcomes = d.learningOutcomes as Record<string, unknown>;
  const teamLearning = d.teamLearning as Record<string, unknown>;
  const goals = d.goalProgress as Record<string, unknown>;
  const profiles = (d.staffProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Reflective Practice Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Activities" value={engagement.totalActivities as number} />
        <Stat label="Total Hours" value={engagement.totalHours as number} />
        <Stat label="Goals" value={goals.totalGoals as number} />
      </div>

      <Section title="Reflective Engagement" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Per Staff" value={engagement.activitiesPerStaff as number} />
          <Stat label="Engagement Rate" value={`${engagement.engagementRate}%`} />
          <Stat label="Total Hours" value={engagement.totalHours as number} />
          <Stat label="Avg Hours/Staff" value={engagement.avgHoursPerStaff as number} />
        </div>
        {((engagement.staffWithZeroActivities ?? []) as string[]).length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium text-red-600 mb-1">Staff With No Activities</p>
            <p className="text-sm text-red-600">{((engagement.staffWithZeroActivities ?? []) as string[]).join(", ")}</p>
          </div>
        )}
      </Section>

      <Section title="Learning Outcomes">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Practice Change" value={`${outcomes.practiceChangeRate}%`} />
          <Stat label="Skill Development" value={`${outcomes.skillDevelopmentRate}%`} />
          <Stat label="Shared With Team" value={`${outcomes.sharedWithTeamRate}%`} />
          <Stat label="Child Outcome Link" value={`${outcomes.linkedToChildOutcomeRate}%`} />
          <Stat label="No Outcome" value={`${outcomes.noOutcomeRate}%`} />
          <Stat label="Total Outcomes" value={outcomes.totalOutcomes as number} />
        </div>
      </Section>

      <Section title="Team Learning">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Team Sessions" value={teamLearning.totalTeamSessions as number} />
          <Stat label="Avg Attendance" value={teamLearning.avgAttendance as number} />
          <Stat label="Shared Learning" value={`${teamLearning.sharedLearningRate}%`} />
        </div>
        {((teamLearning.topTeamTopics ?? []) as Record<string, unknown>[]).length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium mb-1">Top Topics</p>
            {((teamLearning.topTeamTopics ?? []) as Record<string, unknown>[]).slice(0, 5).map((t, i) => (
              <div key={i} className="flex justify-between text-sm bg-gray-50 p-1 rounded mb-1">
                <span>{(t.practiceArea as string).replace(/_/g, " ")}</span>
                <span className="font-medium">{t.count as number}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Goal Progress">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Total Goals" value={goals.totalGoals as number} />
          <Stat label="Achieved" value={goals.achieved as number} />
          <Stat label="In Progress" value={goals.inProgress as number} />
          <Stat label="Overdue" value={goals.overdue as number} />
          <Stat label="Achievement Rate" value={`${goals.achievementRate}%`} />
        </div>
        {((goals.overdueGoals ?? []) as Record<string, unknown>[]).length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium text-red-600 mb-1">Overdue Goals</p>
            {((goals.overdueGoals ?? []) as Record<string, unknown>[]).map((g, i) => (
              <div key={i} className="text-sm bg-red-50 p-2 rounded mb-1">
                {g.staffName as string} — {g.goalDescription as string} ({g.daysPastDue as number} days overdue)
              </div>
            ))}
          </div>
        )}
      </Section>

      {profiles.length > 0 && (
        <Section title={`Staff Profiles (${profiles.length})`}>
          {profiles.map((p) => (
            <div key={p.staffId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium">
                <span>{p.staffName as string}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${(p.developmentRating as string) === "exemplary" ? "bg-green-100 text-green-800" : (p.developmentRating as string) === "engaged" ? "bg-yellow-100 text-yellow-800" : (p.developmentRating as string) === "developing" ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800"}`}>{(p.developmentRating as string).replace(/_/g, " ")}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{p.totalActivities as number} activities · {p.totalHours as number}h · {p.practiceChangeCount as number} practice changes · {p.goalsAchieved as number} goals achieved · {p.activeGoals as number} active</p>
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
