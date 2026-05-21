"use client";
import { useEffect, useState } from "react";
function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) { const pct = Math.min(100, Math.round((value / max) * 100)); const colour = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500"; return (<div className="mb-2"><div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="font-medium">{value}/{max}</span></div><div className="w-full h-2 bg-gray-200 rounded"><div className={`${colour} h-2 rounded`} style={{ width: `${pct}%` }} /></div></div>); }
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="bg-gray-50 rounded p-3 text-center"><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-semibold">{String(value)}</p></div>; }
function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) { const [open, setOpen] = useState(defaultOpen); return (<div className="border rounded mb-3"><button className="w-full flex justify-between items-center p-3 text-left font-medium text-sm" onClick={() => setOpen(!open)}>{title}<span>{open ? "▲" : "▼"}</span></button>{open && <div className="p-3 pt-0">{children}</div>}</div>); }
function ratingBadge(rating: string) { const colours: Record<string, string> = { outstanding: "bg-green-100 text-green-800", good: "bg-yellow-100 text-yellow-800", requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800" }; return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>; }

export function NutritionIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/nutrition").then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); }).then((json) => setData(json.data)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading nutrition intelligence: {error}</div>;
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const dietary = d.dietaryAccommodation as Record<string, unknown>;
  const mealQuality = d.mealQuality as Record<string, unknown>;
  const childInvolvement = d.childInvolvement as Record<string, unknown>;
  const foodSafety = d.foodSafety as Record<string, unknown>;
  const children = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForDevelopment ?? []) as string[];
  const actions = (d.immediateActions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Nutrition &amp; Dietary Compliance Intelligence</h2>{ratingBadge(d.rating as string)}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2"><Stat label="Overall Score" value={`${d.overallScore}/100`} /><Stat label="Total Meals" value={mealQuality.totalMeals as number} /><Stat label="Children" value={dietary.totalChildren as number} /><Stat label="Safety Checks" value={foodSafety.totalChecks as number} /></div>
      <Section title="Dietary Accommodation" defaultOpen><div className="grid grid-cols-2 gap-2"><Stat label="Met Rate" value={`${dietary.metRate}%`} /><Stat label="Allergen Mgmt" value={`${dietary.allergyManagementRate}%`} /><Stat label="With Requirements" value={dietary.childrenWithRequirements as number} /><Stat label="Not Met" value={dietary.requirementsNotMet as number} /></div></Section>
      <Section title="Meal Quality"><div className="grid grid-cols-2 gap-2"><Stat label="Fresh Fruit/Veg" value={`${mealQuality.freshFruitVegRate}%`} /><Stat label="Food Groups Avg" value={mealQuality.averageFoodGroupsCovered as number} /><Stat label="Variety Score" value={`${mealQuality.varietyScore}%`} /><Stat label="Cultural Meals" value={`${mealQuality.culturalMealRate}%`} /><Stat label="Fresh Cooking" value={`${mealQuality.freshCookingRate}%`} /><Stat label="Meals/Day" value={mealQuality.mealsPerDay as number} /></div></Section>
      <Section title="Child Involvement"><div className="grid grid-cols-2 gap-2"><Stat label="Menu Contribution" value={`${childInvolvement.menuContributionRate}%`} /><Stat label="Cooking Sessions" value={childInvolvement.cookingSessionsTotal as number} /><Stat label="Sessions/Child" value={childInvolvement.cookingSessionsPerChild as number} /><Stat label="Engagement" value={`${childInvolvement.engagementRate}%`} /><Stat label="Staff Ate With" value={`${childInvolvement.staffAteWithChildrenRate}%`} /><Stat label="Helped Cook" value={`${childInvolvement.childrenHelpedCookRate}%`} /></div></Section>
      <Section title="Food Safety"><div className="grid grid-cols-2 gap-2"><Stat label="Compliance" value={`${foodSafety.complianceRate}%`} /><Stat label="Corrections Needed" value={foodSafety.correctionsNeeded as number} /><Stat label="Corrections Made" value={foodSafety.correctionsMade as number} /><Stat label="Correction Rate" value={`${foodSafety.correctionRate}%`} /></div></Section>
      {children.length > 0 && (<Section title={`Child Profiles (${children.length})`}>{children.map((c) => (<div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded"><div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span className={`text-xs ${(c.requirementsMet as boolean) ? "text-green-600" : "text-red-600"}`}>{(c.requirementsMet as boolean) ? "Requirements Met" : "Requirements Not Met"}</span></div><p className="text-xs text-gray-500 mt-1">{c.mealsAttended as number} meals · {c.cookingSessions as number} cooking sessions · Skill {c.cookingSkillLevel as number}/5 · Menu contributions: {c.menuContributions as number}{c.primaryConcern ? ` · ${c.primaryConcern}` : ""}</p></div>))}</Section>)}
      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">&#10003; {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Development"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">&#9888; {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Immediate Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
