"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CULTURAL IDENTITY & DIVERSITY INTELLIGENCE CARD
// Dashboard card for identity profiles, cultural actions, diversity support,
// and ARIA cultural identity intelligence.
// CHR 2015 Reg 7 (quality of care), Reg 11 (positive relationships),
// Equality Act 2010, SCCIF Well-Led.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe, ChevronRight, AlertTriangle, Brain,
  Heart, Users, Palette, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  children_with_profiles: 5,
  total_children: 5,
  profile_review_rate: 80,
  actions_this_quarter: 18,
  satisfaction_rate: 89,
  children_with_community_links: 3,
  avg_actions_per_child: 3.6,
};

const DEMO_BY_ACTION_TYPE = [
  { type: "Cultural Activity", count: 4 },
  { type: "Religious Practice", count: 3 },
  { type: "Dietary Provision", count: 3 },
  { type: "Community Engagement", count: 2 },
  { type: "Hair & Skin Care", count: 2 },
  { type: "Festival Celebration", count: 2 },
  { type: "Language Support", count: 1 },
  { type: "Heritage Exploration", count: 1 },
];

const DEMO_CHILDREN = [
  { name: "Child A", ethnicity: "Black British", actions: 5, community: true, reviewed: true },
  { name: "Child B", ethnicity: "Mixed Heritage", actions: 4, community: true, reviewed: true },
  { name: "Child C", ethnicity: "White British", actions: 3, community: false, reviewed: true },
  { name: "Child D", ethnicity: "South Asian", actions: 4, community: true, reviewed: false },
  { name: "Child E", ethnicity: "Eastern European", actions: 2, community: false, reviewed: true },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "review_overdue", severity: "high", message: "Child D's identity profile has not been reviewed in over 6 months. Reg 7 requires cultural needs to be regularly assessed and supported." },
  { type: "community_links", severity: "medium", message: "2 children (C and E) have no recorded community links. Explore opportunities for community engagement that reflect their identity." },
];

const ARIA_INSIGHTS = [
  "Child D's identity profile review overdue — South Asian heritage, halal dietary requirements, Urdu first language. Last cultural action was 2 months ago (Eid celebration). Schedule identity profile review and consider connecting with local South Asian community groups.",
  "Language support gap: Child E (Eastern European, Polish first language) has only 2 cultural actions this quarter and no language support recorded. Consider Polish language resources, cultural connections, and heritage exploration activities.",
  "Overall: 5/5 children have identity profiles. 18 cultural actions this quarter (avg 3.6 per child). 89% satisfaction rate. 3 children have community links. Most common activities: cultural events and religious practices. Profile review rate at 80% — 1 overdue. All dietary requirements documented and met.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function CulturalIdentityCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4 text-brand" />
            Cultural Identity
          </CardTitle>
          <Link href="/cultural-identity" className="text-xs text-brand hover:underline flex items-center gap-1">
            Profiles <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.children_with_profiles === m.total_children ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.children_with_profiles === m.total_children ? "text-green-600" : "text-red-600")}>
              {m.children_with_profiles}/{m.total_children}
            </p>
            <p className="text-[10px] text-muted-foreground">Profiles</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.actions_this_quarter}</p>
            <p className="text-[10px] text-muted-foreground">Actions (Q)</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.satisfaction_rate >= 80 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.satisfaction_rate >= 80 ? "text-green-600" : "text-amber-600")}>
              {m.satisfaction_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Satisfaction</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.profile_review_rate >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.profile_review_rate >= 90 ? "text-green-600" : "text-amber-600")}>
              {m.profile_review_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Reviewed</p>
          </div>
        </div>

        {/* ── Per-child summary ───────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            Children
          </p>
          {DEMO_CHILDREN.map((c) => (
            <div key={c.name} className="flex items-center justify-between rounded border p-2 text-xs">
              <div className="flex-1">
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground ml-1">({c.ethnicity})</span>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Badge variant="outline" className="text-[10px] tabular-nums">{c.actions} acts</Badge>
                {c.community && <Heart className="h-3 w-3 text-pink-500" />}
                {!c.reviewed && <AlertTriangle className="h-3 w-3 text-amber-500" />}
              </div>
            </div>
          ))}
        </div>

        {/* ── Action types ────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Palette className="h-3 w-3" />
            Cultural Actions This Quarter
          </p>
          <div className="grid grid-cols-2 gap-1">
            {DEMO_BY_ACTION_TYPE.map((a) => (
              <div key={a.type} className="flex items-center justify-between rounded border p-1.5 text-xs">
                <span className="truncate flex-1 text-[11px]">{a.type}</span>
                <Badge variant="outline" className="text-[9px] tabular-nums ml-1">{a.count}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* ── Satisfaction ────────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-xs font-semibold flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500" />
            Child Satisfaction
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Overall satisfaction rate</span>
            <span className={cn("font-bold tabular-nums", m.satisfaction_rate >= 80 ? "text-green-600" : "text-amber-600")}>
              {m.satisfaction_rate}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={cn("h-full rounded-full", m.satisfaction_rate >= 80 ? "bg-green-500" : "bg-amber-500")}
                style={{ width: `${m.satisfaction_rate}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Identity Alerts
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

        {/* ── ARIA insights ────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA Identity Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-red-200 bg-red-50 text-red-800"
                  : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-green-200 bg-green-50 text-green-800",
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
