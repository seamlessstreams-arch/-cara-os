"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SIGNIFICANT EVENTS INTELLIGENCE CARD
// Dashboard card for significant events — achievements, milestones,
// life changes, and the full picture of each child's journey.
// CHR 2015 Reg 36/6/7. SCCIF: Overall Experiences.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star, ChevronRight, AlertTriangle, Brain,
  Smile, Frown, Heart, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  total_events: 18,
  events_this_month: 4,
  positive_events: 12,
  negative_events: 3,
  positive_ratio: 66.7,
  achievements: 5,
  children_with_events: 6,
  event_coverage: 100,
  child_views_recorded_rate: 72.2,
  added_to_life_story_rate: 44.4,
};

const DEMO_EVENTS: {
  child: string;
  title: string;
  category: string;
  sentiment: string;
  date: string;
  impact: string;
}[] = [
  { child: "Child A", title: "Passed maths exam", category: "Achievement", sentiment: "very_positive", date: "2026-05-10", impact: "high" },
  { child: "Child C", title: "First overnight stay with aunt", category: "Family Contact", sentiment: "positive", date: "2026-05-06", impact: "high" },
  { child: "Child B", title: "Started guitar lessons", category: "Life Skill Gained", sentiment: "positive", date: "2026-05-02", impact: "medium" },
  { child: "Child D", title: "LAC review — care plan updated", category: "Review Meeting", sentiment: "neutral", date: "2026-04-28", impact: "medium" },
  { child: "Child E", title: "Loss of family pet", category: "Bereavement", sentiment: "negative", date: "2026-04-20", impact: "high" },
  { child: "Child A", title: "Represented school at sports day", category: "Achievement", sentiment: "very_positive", date: "2026-04-15", impact: "medium" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "bereavement_no_followup", severity: "high", message: "Bereavement event for Child E (2026-04-20) has no follow-up actions recorded — ensure support is in place." },
  { type: "negative_pattern", severity: "medium", message: "Child F has more negative (3) than positive (1) significant events — review wellbeing and care plan." },
];

const ARIA_INSIGHTS = [
  "18 significant events across 6 children this quarter. 4 events this month. Positive ratio: 66.7% — healthy balance. 5 achievements celebrated. All children have events recorded (100% coverage). Child views recorded in 72.2% of events.",
  "Child A: Strong positive trajectory — 2 achievements in recent weeks (maths exam, sports day). Ensure these are shared with family and added to life story work. Child C's first overnight stay with aunt is a significant positive milestone for family contact.",
  "Gap: Only 44.4% of events added to life story work — this should be higher. Bereavement support for Child E needs follow-up actions. Consider scheduling a team discussion about how positive events are celebrated and shared.",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const SENTIMENT_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  very_positive: { icon: Star, color: "text-green-600" },
  positive: { icon: Smile, color: "text-green-500" },
  neutral: { icon: BookOpen, color: "text-blue-500" },
  negative: { icon: Frown, color: "text-orange-500" },
  very_negative: { icon: Frown, color: "text-red-500" },
};

const IMPACT_BADGES: Record<string, { label: string; color: string }> = {
  high: { label: "High", color: "text-red-700 bg-red-50 border-red-200" },
  medium: { label: "Medium", color: "text-blue-700 bg-blue-50 border-blue-200" },
  low: { label: "Low", color: "text-gray-700 bg-gray-50 border-gray-200" },
};

// ── Component ────────────────────────────────────────────────────────────────

export function SignificantEventsCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="h-4 w-4 text-brand" />
            Significant Events
          </CardTitle>
          <Link href="/significant-events" className="text-xs text-brand hover:underline flex items-center gap-1">
            Events <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.events_this_month}</p>
            <p className="text-[10px] text-muted-foreground">This Month</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{m.achievements}</p>
            <p className="text-[10px] text-muted-foreground">Achievements</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{m.positive_ratio}%</p>
            <p className="text-[10px] text-muted-foreground">Positive</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.added_to_life_story_rate >= 70 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.added_to_life_story_rate >= 70 ? "text-green-600" : "text-amber-600")}>
              {m.added_to_life_story_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Life Story</p>
          </div>
        </div>

        {/* ── Recent events ───────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Heart className="h-3 w-3" />
            Recent Significant Events
          </p>
          <div className="space-y-1">
            {DEMO_EVENTS.map((ev, i) => {
              const sentimentMeta = SENTIMENT_ICONS[ev.sentiment] ?? SENTIMENT_ICONS.neutral;
              const SentIcon = sentimentMeta.icon;
              const impactBadge = IMPACT_BADGES[ev.impact] ?? IMPACT_BADGES.medium;
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <SentIcon className={cn("h-3 w-3 shrink-0", sentimentMeta.color)} />
                    <span className="font-medium">{ev.child}</span>
                    <span className="text-muted-foreground truncate">{ev.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-muted-foreground">{ev.date}</span>
                    <Badge variant="outline" className={cn("text-[10px]", impactBadge.color)}>
                      {impactBadge.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Event Alerts
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
            ARIA Significant Events Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-blue-200 bg-blue-50 text-blue-800"
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
