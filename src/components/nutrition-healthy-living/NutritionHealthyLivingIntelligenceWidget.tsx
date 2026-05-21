"use client";
import { useEffect, useState } from "react";
function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) { const pct = Math.min(100, Math.round((value / max) * 100)); const colour = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500"; return (<div className="mb-2"><div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="font-medium">{value}/{max}</span></div><div className="w-full h-2 bg-gray-200 rounded"><div className={`${colour} h-2 rounded`} style={{ width: `${pct}%` }} /></div></div>); }
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="bg-gray-50 rounded p-3 text-center"><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-semibold">{String(value)}</p></div>; }
function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) { const [open, setOpen] = useState(defaultOpen); return (<div className="border rounded mb-3"><button className="w-full flex justify-between items-center p-3 text-left font-medium text-sm" onClick={() => setOpen(!open)}>{title}<span>{open ? "▲" : "▼"}</span></button>{open && <div className="p-3 pt-0">{children}</div>}</div>); }
function ratingBadge(rating: string) { const colours: Record<string, string> = { outstanding: "bg-green-100 text-green-800", good: "bg-yellow-100 text-yellow-800", requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800" }; return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>; }

export function NutritionHealthyLivingIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/nutrition-healthy-living").then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); }).then((json) => setData(json.data)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading nutrition &amp; healthy living intelligence: {error}</div>;
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const meal = d.mealQuality as Record<string, unknown>;
  const activity = d.physicalActivity as Record<string, unknown>;
  const health = d.healthPromotion as Record<string, unknown>;
  const menu = d.menuPlanning as Record<string, unknown>;
  const children = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Nutrition &amp; Healthy Living Intelligence</h2>{ratingBadge(d.rating as string)}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2"><Stat label="Overall Score" value={`${d.overallScore}/100`} /><Stat label="Meals" value={meal.totalMeals as number} /><Stat label="Activities" value={activity.totalActivities as number} /><Stat label="Children" value={children.length} /></div>
      <Section title="Meal Quality" defaultOpen><ScoreBar label="Meal Quality" value={meal.overallScore as number} /><div className="grid grid-cols-2 gap-2 mt-2"><Stat label="Excellent/Good" value={`${meal.excellentGoodRate}%`} /><Stat label="Dietary Compliance" value={`${meal.dietaryComplianceRate}%`} /><Stat label="Fresh Fruit/Veg" value={`${meal.freshFruitVegRate}%`} /><Stat label="Child Involvement" value={`${meal.childInvolvementRate}%`} /><Stat label="Child Enjoyment" value={`${meal.childEnjoymentRate}%`} /><Stat label="Portion OK" value={`${meal.portionAppropriateRate}%`} /></div></Section>
      <Section title="Physical Activity"><ScoreBar label="Activity" value={activity.overallScore as number} /><div className="grid grid-cols-2 gap-2 mt-2"><Stat label="Mins/Child/Week" value={activity.averageMinutesPerChildPerWeek as number} /><Stat label="Active Children" value={`${activity.activeChildrenRate}%`} /><Stat label="Vigorous/Moderate" value={`${activity.vigorousModerateRate}%`} /><Stat label="Enjoyment" value={`${activity.childEnjoymentRate}%`} /><Stat label="Activity Variety" value={activity.activityVariety as number} /><Stat label="NHS Guidelines" value={(activity.meetsNHSGuidelines as boolean) ? "Met" : "Not Met"} /></div></Section>
      <Section title="Health Promotion"><ScoreBar label="Health" value={health.overallScore as number} /><div className="grid grid-cols-2 gap-2 mt-2"><Stat label="Hydration Good" value={`${health.hydrationGoodRate}%`} /><Stat label="Sleep Quality" value={`${health.sleepQualityRate}%`} /><Stat label="Dental Up-to-Date" value={`${health.dentalUpToDateRate}%`} /><Stat label="Optical Up-to-Date" value={`${health.opticalUpToDateRate}%`} /><Stat label="Health Assessment" value={`${health.annualHealthAssessmentRate}%`} /><Stat label="Cooking Skills" value={`${health.cookingSkillsRate}%`} /><Stat label="Nutrition Education" value={`${health.nutritionEducationRate}%`} /><Stat label="Mental Wellbeing" value={`${health.mentalWellbeingRate}%`} /></div></Section>
      <Section title="Menu Planning"><ScoreBar label="Menu Planning" value={menu.overallScore as number} /><div className="grid grid-cols-2 gap-2 mt-2"><Stat label="Balanced Meals" value={`${menu.balancedMealRate}%`} /><Stat label="Child Consultation" value={`${menu.childConsultationRate}%`} /><Stat label="Cultural Diversity" value={`${menu.culturalDiversityRate}%`} /><Stat label="Special Diets" value={`${menu.specialDietsCateredRate}%`} /><Stat label="Seasonal" value={`${menu.seasonalIngredientRate}%`} /><Stat label="Total Plans" value={menu.totalMenuPlans as number} /></div></Section>
      {children.length > 0 && (<Section title={`Child Profiles (${children.length})`}>{children.map((c) => (<div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded"><div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span>{c.overallScore as number}/10</span></div><p className="text-xs text-gray-500 mt-1">Dietary compliance {c.dietaryComplianceRate as number}% · Activity {c.weeklyActivityMinutes as number} min/wk · Health checks {(c.healthChecksUpToDate as boolean) ? "up-to-date" : "outstanding"}</p></div>))}</Section>)}
      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">&#10003; {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">&#9888; {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
