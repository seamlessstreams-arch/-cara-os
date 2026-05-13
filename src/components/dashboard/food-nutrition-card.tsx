"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FOOD & NUTRITION INTELLIGENCE CARD
// Dashboard card for dietary profiles, meal satisfaction, food hygiene,
// and ARIA nutrition intelligence.
// CHR 2015 Reg 9 (promoting good health — nutritional needs),
// Reg 6 (quality of care — nourishing food), Reg 7 (children's views),
// Reg 10 (dignity — dietary/cultural preferences).
// SCCIF: Children's Experiences.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UtensilsCrossed, ChevronRight, AlertTriangle, Brain,
  Heart, Star, ShieldCheck, Apple,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  profiles_complete: 5,
  total_children: 5,
  children_with_allergies: 2,
  meals_this_week: 28,
  avg_satisfaction: 4.2,
  hygiene_pass_rate: 100,
  food_waste_rate: 8,
  alternative_meals_rate: 14,
};

const DEMO_DIETARY_SUMMARY = [
  { requirement: "Halal", count: 1 },
  { requirement: "Nut Allergy", count: 1 },
  { requirement: "Dairy Free", count: 1 },
  { requirement: "Vegetarian", count: 1 },
];

const DEMO_RECENT_MEALS = [
  { date: "2026-05-13", type: "Dinner", description: "Chicken stir-fry with rice", satisfaction: 4.4, waste: "low" },
  { date: "2026-05-13", type: "Lunch", description: "Jacket potato bar with fillings", satisfaction: 4.6, waste: "none" },
  { date: "2026-05-12", type: "Dinner", description: "Spaghetti bolognese (veggie option)", satisfaction: 4.0, waste: "low" },
];

const DEMO_HYGIENE = [
  { date: "2026-05-12", result: "pass", checkedBy: "Sarah M." },
  { date: "2026-05-05", result: "pass", checkedBy: "James T." },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "profile_review", severity: "medium", message: "Child E's dietary profile is due for review on 20 May — ensure allergies and preferences are current before the summer menu cycle." },
];

const ARIA_INSIGHTS = [
  "All 5 children have dietary profiles recorded — 2 with allergies (nut, dairy). Average meal satisfaction this week is 4.2/5, above the 3.5 target. Children's favourites: jacket potato bar (4.6), chicken stir-fry (4.4). Food waste is low at 8%. 14% of meals included alternative options for dietary needs — all allergies catered for.",
  "Food hygiene checks: 100% pass rate this quarter (8 checks completed). Fridge/freezer temperatures consistently compliant. Kitchen cleanliness maintained to high standard. No major issues identified. Next environmental health inspection due August 2026.",
  "Children's involvement in menu planning: 3 children contributed recipe suggestions this month — 2 have been added to the summer cycle. Child A requested more variety at breakfast; trial of smoothie bar started this week with positive feedback (4.8/5). Strong Reg 7 compliance — children's food preferences are actively sought and acted upon.",
];

const satisfactionColor = (score: number) =>
  score >= 4.0 ? "text-green-600" : score >= 3.0 ? "text-blue-600" : "text-amber-600";

const wasteColor: Record<string, string> = {
  none: "bg-green-100 text-green-700",
  low: "bg-green-100 text-green-700",
  moderate: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

// ── Component ────────────────────────────────────────────────────────────────

export function FoodNutritionCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-brand" />
            Food &amp; Nutrition
          </CardTitle>
          <Link href="/food-nutrition" className="text-xs text-brand hover:underline flex items-center gap-1">
            Meals <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.profiles_complete === m.total_children ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.profiles_complete === m.total_children ? "text-green-600" : "text-amber-600")}>
              {m.profiles_complete}/{m.total_children}
            </p>
            <p className="text-[10px] text-muted-foreground">Profiles</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className={cn("text-lg font-bold tabular-nums", satisfactionColor(m.avg_satisfaction))}>
              {m.avg_satisfaction}
            </p>
            <p className="text-[10px] text-muted-foreground">Satisfaction</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.hygiene_pass_rate === 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.hygiene_pass_rate === 100 ? "text-green-600" : "text-amber-600")}>
              {m.hygiene_pass_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Hygiene</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.food_waste_rate <= 15 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.food_waste_rate <= 15 ? "text-green-600" : "text-amber-600")}>
              {m.food_waste_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Waste</p>
          </div>
        </div>

        {/* ── Dietary requirements ────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <Heart className="h-3 w-3 text-red-500" />
            Dietary Requirements
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {DEMO_DIETARY_SUMMARY.map((d) => (
              <div key={d.requirement} className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="truncate flex-1">{d.requirement}</span>
                <span className="font-bold tabular-nums text-blue-600 ml-1">{d.count}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground pt-0.5">
            {m.children_with_allergies} child(ren) with allergies — all catered for
          </p>
        </div>

        {/* ── Recent meals ────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Apple className="h-3 w-3" />
            Recent Meals
          </p>
          {DEMO_RECENT_MEALS.map((meal, i) => (
            <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-medium truncate">{meal.description}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge variant="outline" className="text-[10px] tabular-nums">
                  <Star className="h-2.5 w-2.5 mr-0.5" />
                  {meal.satisfaction}
                </Badge>
                <Badge className={cn("text-[10px]", wasteColor[meal.waste])}>
                  {meal.waste}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* ── Hygiene checks ──────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-green-500" />
            Food Hygiene
          </p>
          {DEMO_HYGIENE.map((h, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {new Date(h.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — {h.checkedBy}
              </span>
              <Badge className="bg-green-100 text-green-700 text-[10px]">{h.result}</Badge>
            </div>
          ))}
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Nutrition Alerts
            </p>
            {DEMO_ALERTS.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  alert.severity === "critical" || alert.severity === "high"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA insights ───────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA Nutrition Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-blue-200 bg-blue-50 text-blue-800"
                  : i === 1 ? "border-green-200 bg-green-50 text-green-800"
                  : "border-amber-200 bg-amber-50 text-amber-800",
              )}
            >
              {insight}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
