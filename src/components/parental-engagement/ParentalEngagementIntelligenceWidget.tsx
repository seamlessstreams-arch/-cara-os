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

export function ParentalEngagementIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/parental-engagement")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading parental engagement intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const contactQuality = d.contactQuality as Record<string, unknown>;
  const parentalSupport = d.parentalSupport as Record<string, number>;
  const familyPlanning = d.familyPlanning as Record<string, unknown>;
  const parentalFeedback = d.parentalFeedback as Record<string, unknown>;
  const familyProfiles = (d.familyProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Parental Engagement Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Contacts" value={contactQuality.totalContacts as number} />
        <Stat label="Supports" value={parentalSupport.totalSupports} />
        <Stat label="Families" value={familyProfiles.length} />
      </div>

      <Section title="Contact Quality" defaultOpen>
        <ScoreBar label="Contact Quality" value={contactQuality.score as number} max={30} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Positive Outcome" value={`${contactQuality.positiveOutcomeRate}%`} />
          <Stat label="Mood Uplift" value={`${contactQuality.moodUpliftRate}%`} />
          <Stat label="Follow-Up Done" value={typeof contactQuality.followUpCompletionRate === "number" ? `${contactQuality.followUpCompletionRate}%` : "—"} />
          <Stat label="Child Refusal" value={`${contactQuality.childRefusalRate}%`} />
          <Stat label="Parent No-Show" value={`${contactQuality.parentNoShowRate}%`} />
          <Stat label="Avg Duration" value={`${contactQuality.averageDurationMinutes} min`} />
        </div>
      </Section>

      <Section title="Parental Support">
        <ScoreBar label="Parental Support" value={parentalSupport.score} max={20} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Active Supports" value={parentalSupport.activeSupports} />
          <Stat label="Effective Rate" value={`${parentalSupport.effectiveRate}%`} />
          <Stat label="Referral Rate" value={`${parentalSupport.referralRate}%`} />
          <Stat label="Parents Supported" value={parentalSupport.parentsReceivingSupport} />
        </div>
      </Section>

      <Section title="Family Planning">
        <ScoreBar label="Family Planning" value={familyPlanning.score as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Goal Achievement" value={`${familyPlanning.goalAchievementRate}%`} />
          <Stat label="Family Involvement" value={`${familyPlanning.familyInvolvementRate}%`} />
          <Stat label="Child Involvement" value={`${familyPlanning.childInvolvementRate}%`} />
          <Stat label="Overdue Plans" value={familyPlanning.overduePlans as number} />
        </div>
      </Section>

      <Section title="Parental Feedback">
        <ScoreBar label="Parental Feedback" value={parentalFeedback.score as number} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Satisfaction" value={`${parentalFeedback.averageSatisfaction}/10`} />
          <Stat label="Communication" value={`${parentalFeedback.averageCommunication}/10`} />
          <Stat label="Involvement" value={`${parentalFeedback.averageInvolvement}/10`} />
          <Stat label="Feedbacks" value={parentalFeedback.totalFeedbacks as number} />
        </div>
      </Section>

      {familyProfiles.length > 0 && (
        <Section title={`Family Profiles (${familyProfiles.length})`}>
          {familyProfiles.map((f) => (
            <div key={f.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{f.childName as string}</span><span>{f.positiveContactRate as number}% positive</span></div>
              <p className="text-xs text-gray-500 mt-1">{f.totalContacts as number} contacts · Mood uplift: {f.averageMoodUplift as number} · {f.activeFamilyPlan ? "Active plan" : "No plan"} · Goals: {f.goalAchievementRate as number}%</p>
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
