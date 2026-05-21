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
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>;
}

export function MenuPlanningNutritionIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/menu-planning-nutrition")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading menu planning nutrition intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const mq = d.menuQuality as Record<string, number>;
  const cs = d.childSatisfaction as Record<string, number>;
  const ci = d.childInvolvement as Record<string, number>;
  const nc = d.nutritionCompliance as Record<string, number>;
  const profiles = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Menu Planning &amp; Nutrition Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Menus Planned" value={mq.totalMenus} />
        <Stat label="Feedback Received" value={cs.totalFeedback} />
        <Stat label="Audits" value={nc.totalAudits} />
      </div>

      <ScoreBar label="Menu Quality" value={mq.overallScore} />
      <ScoreBar label="Child Satisfaction" value={cs.overallScore} />
      <ScoreBar label="Child Involvement" value={ci.overallScore} />
      <ScoreBar label="Nutrition Compliance" value={nc.overallScore} />

      <Section title="Menu Quality" defaultOpen>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Nutritional Balance" value={`${mq.nutritionalBalanceRate}%`} />
          <Stat label="Variety" value={`${mq.varietyRate}%`} />
          <Stat label="Cultural Accommodation" value={`${mq.culturalAccommodationRate}%`} />
          <Stat label="Children Consulted" value={`${mq.childrenConsultedRate}%`} />
          <Stat label="Special Dietary Met" value={`${mq.specialDietaryMetRate}%`} />
        </div>
      </Section>

      <Section title="Child Satisfaction">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Avg Enjoyment" value={`${cs.averageEnjoyment}/5`} />
          <Stat label="Portion Satisfactory" value={`${cs.portionSatisfactoryRate}%`} />
          <Stat label="Positive Feedback" value={`${cs.positiveFeedbackRate}%`} />
          <Stat label="Response Rate" value={`${cs.responseRate}%`} />
        </div>
      </Section>

      <Section title="Child Involvement">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Participation Rate" value={`${ci.participationRate}%`} />
          <Stat label="Activity Variety" value={ci.activityVariety} />
          <Stat label="Child Enjoyed" value={`${ci.childEnjoyedRate}%`} />
          <Stat label="Cooking Activities" value={`${ci.cookingActivityRate}%`} />
          <Stat label="Staff Support" value={`${ci.staffSupportRate}%`} />
        </div>
      </Section>

      <Section title="Nutrition Compliance">
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Five a Day" value={`${nc.fiveADayRate}%`} />
          <Stat label="Fresh Food" value={`${nc.freshFoodRate}%`} />
          <Stat label="Sugar Limits" value={`${nc.sugarLimitsRate}%`} />
          <Stat label="Portion Guidance" value={`${nc.portionGuidanceRate}%`} />
          <Stat label="Overall Compliant" value={`${nc.overallCompliantRate}%`} />
        </div>
      </Section>

      {profiles.length > 0 && (
        <Section title={`Child Profiles (${profiles.length})`}>
          {profiles.map((c) => (
            <div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span>{c.overallScore as number}/10</span></div>
              <p className="text-xs text-gray-500 mt-1">Enjoyment: {c.averageEnjoyment as number}/5 · {c.feedbackCount as number} feedback · {c.participationCount as number} activities</p>
              <p className="text-xs text-gray-500">Portions satisfactory: {c.portionSatisfactoryRate as number}%</p>
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
