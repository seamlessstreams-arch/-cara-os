"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INDEPENDENCE PREPARATION INTELLIGENCE CARD
// Dashboard card for practical life skills assessment and readiness tracking.
// CHR 2015 Reg 5/6/7. SCCIF: Overall Experiences — Independence.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Rocket, ChevronRight, AlertTriangle, Brain,
  Target, TrendingUp, User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = {
  total_assessments: 45,
  children_assessed: 4,
  assessment_coverage: 66.7,
  not_started_count: 8,
  emerging_count: 12,
  developing_count: 15,
  competent_count: 7,
  independent_count: 3,
  on_target_count: 28,
  mentor_assigned_rate: 60.0,
  young_person_views_rate: 73.3,
};

const DEMO_SKILLS: { child: string; skill: string; level: string; target: string }[] = [
  { child: "Child E", skill: "Cooking & Nutrition", level: "Developing", target: "Competent" },
  { child: "Child E", skill: "Budgeting & Finance", level: "Emerging", target: "Competent" },
  { child: "Child D", skill: "Travel & Transport", level: "Competent", target: "Independent" },
  { child: "Child F", skill: "Employment Readiness", level: "Not Started", target: "Developing" },
  { child: "Child D", skill: "Housing Knowledge", level: "Developing", target: "Competent" },
  { child: "Child F", skill: "Digital Literacy", level: "Emerging", target: "Competent" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "no_assessment", severity: "high", message: "2 children have no independence skills assessment — all young people should have preparation plans." },
  { type: "many_not_started", severity: "high", message: "Child F has 5 independence skills not yet started — prioritise practical skills development." },
  { type: "target_missed", severity: "medium", message: "Child E's budgeting & finance target missed — currently emerging, target was developing by 2026-04-01." },
];

const ARIA_INSIGHTS = [
  "45 skill assessments across 4 children (66.7% coverage). 8 not started, 12 emerging, 15 developing, 7 competent, 3 independent. 28 skills on target. Mentor assigned: 60%. Young person views: 73.3%.",
  "Priority: 2 children have no assessments at all. Child F has 5 skills not started — needs immediate independence skills programme. Child E missed budgeting target — consider more structured financial literacy activities.",
  "Positive: Child D is progressing well (competent in travel, developing in housing). Increase mentor assignment rate from 60% — mentors accelerate skill development. Ensure all young people contribute their views to their preparation plans.",
];

const LEVEL_BADGES: Record<string, { label: string; color: string }> = {
  "Not Started": { label: "Not Started", color: "text-gray-700 bg-gray-50 border-gray-200" },
  Emerging: { label: "Emerging", color: "text-orange-700 bg-orange-50 border-orange-200" },
  Developing: { label: "Developing", color: "text-blue-700 bg-blue-50 border-blue-200" },
  Competent: { label: "Competent", color: "text-green-700 bg-green-50 border-green-200" },
  Independent: { label: "Independent", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
};

export function IndependencePreparationCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Rocket className="h-4 w-4 text-brand" />
            Independence Preparation
          </CardTitle>
          <Link href="/independence-preparation" className="text-xs text-brand hover:underline flex items-center gap-1">
            Independence <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.assessment_coverage === 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.assessment_coverage === 100 ? "text-green-600" : "text-amber-600")}>{m.assessment_coverage}%</p>
            <p className="text-[10px] text-muted-foreground">Coverage</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{m.competent_count + m.independent_count}</p>
            <p className="text-[10px] text-muted-foreground">Ready</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.not_started_count === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.not_started_count === 0 ? "text-green-600" : "text-amber-600")}>{m.not_started_count}</p>
            <p className="text-[10px] text-muted-foreground">Not Started</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.on_target_count}</p>
            <p className="text-[10px] text-muted-foreground">On Target</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" />Skill Assessments</p>
          <div className="space-y-1">
            {DEMO_SKILLS.map((sk, i) => {
              const badge = LEVEL_BADGES[sk.level] ?? LEVEL_BADGES.Emerging;
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <TrendingUp className="h-3 w-3 text-blue-500 shrink-0" />
                    <span className="font-medium">{sk.child}</span>
                    <span className="text-muted-foreground truncate">{sk.skill}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-muted-foreground">→ {sk.target}</span>
                    <Badge variant="outline" className={cn("text-[10px]", badge.color)}>{badge.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Independence Alerts</p>
            {DEMO_ALERTS.map((a, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Independence Intelligence</p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
