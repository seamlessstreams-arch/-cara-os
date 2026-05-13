"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SANCTIONS & REWARDS INTELLIGENCE CARD
// Dashboard card for behaviour management, sanction/reward ratios,
// proportionality tracking, and ARIA behaviour management intelligence.
// CHR 2015 Reg 19 (behaviour management), Reg 35 (behaviour management
// standards), SCCIF Experiences & Progress, Helped & Protected.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Award, ChevronRight, AlertTriangle, Brain,
  ThumbsDown, ThumbsUp, BarChart3, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_BEHAVIOUR_METRICS = {
  sanctions_this_month: 8,
  rewards_this_month: 22,
  reward_to_sanction_ratio: 2.75,
  proportionality_rate: 88,
  manager_review_rate: 75,
  unreviewed_sanctions: 2,
  children_with_sanctions: 3,
  children_with_rewards: 5,
};

const DEMO_SANCTION_TYPES = [
  { type: "Verbal Reminder", count: 3 },
  { type: "Time Out", count: 2 },
  { type: "Loss of Privilege", count: 1 },
  { type: "Restorative Conversation", count: 2 },
];

const DEMO_REWARD_TYPES = [
  { type: "Verbal Praise", count: 10 },
  { type: "Extra Privilege", count: 4 },
  { type: "Special Activity", count: 3 },
  { type: "Sticker Chart", count: 3 },
  { type: "Certificate", count: 2 },
];

const DEMO_CHILD_BREAKDOWN = [
  { child: "Child A", sanctions: 4, rewards: 8, ratio: 2.0 },
  { child: "Child B", sanctions: 3, rewards: 6, ratio: 2.0 },
  { child: "Child C", sanctions: 1, rewards: 4, ratio: 4.0 },
  { child: "Child D", sanctions: 0, rewards: 2, ratio: 0 },
  { child: "Child E", sanctions: 0, rewards: 2, ratio: 0 },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "unreviewed", severity: "high", message: "2 sanctions not yet reviewed by a manager. All sanctions must be reviewed for proportionality (Reg 19)." },
  { type: "high_sanctions", severity: "medium", message: "Child A has 4 sanctions this month — review behaviour support plan and discuss with key worker." },
];

const ARIA_INSIGHTS = [
  "2 unreviewed sanctions — both from the last 3 days. Manager review ensures proportionality and consistency. Schedule review before end of shift. Both are for Child A (verbal reminder + time out).",
  "Reward-to-sanction ratio is 2.75:1 — above the recommended 3:1 target but improving. Verbal praise is the most used reward (10/22). Consider diversifying with more tangible rewards and linking to specific targets in behaviour support plans.",
  "Overall behaviour management: 88% proportionality rate, 75% manager review rate. 5 of 5 children received rewards this month. Restorative conversations used twice — good practice. No prohibited sanctions detected. Child A and B have highest sanction counts — cross-reference with incident and restraint data.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function SanctionsRewardsCard() {
  const b = DEMO_BEHAVIOUR_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-brand" />
            Sanctions & Rewards
          </CardTitle>
          <Link href="/sanctions-rewards" className="text-xs text-brand hover:underline flex items-center gap-1">
            Framework <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", b.reward_to_sanction_ratio >= 3 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", b.reward_to_sanction_ratio >= 3 ? "text-green-600" : "text-amber-600")}>
              {b.reward_to_sanction_ratio}:1
            </p>
            <p className="text-[10px] text-muted-foreground">R:S Ratio</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", b.proportionality_rate >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", b.proportionality_rate >= 90 ? "text-green-600" : "text-amber-600")}>
              {b.proportionality_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Proportionate</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", b.manager_review_rate >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", b.manager_review_rate >= 90 ? "text-green-600" : "text-amber-600")}>
              {b.manager_review_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Reviewed</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", b.unreviewed_sanctions === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", b.unreviewed_sanctions === 0 ? "text-green-600" : "text-red-600")}>
              {b.unreviewed_sanctions}
            </p>
            <p className="text-[10px] text-muted-foreground">Unreviewed</p>
          </div>
        </div>

        {/* ── Sanctions vs rewards ────────────────────────────────────── */}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <ThumbsDown className="h-3 w-3" />
              Sanctions ({b.sanctions_this_month})
            </p>
            {DEMO_SANCTION_TYPES.map((s) => (
              <div key={s.type} className="flex items-center justify-between text-xs rounded border p-1.5">
                <span className="truncate">{s.type}</span>
                <Badge variant="outline" className="text-[10px] tabular-nums">{s.count}</Badge>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              Rewards ({b.rewards_this_month})
            </p>
            {DEMO_REWARD_TYPES.map((r) => (
              <div key={r.type} className="flex items-center justify-between text-xs rounded border p-1.5">
                <span className="truncate">{r.type}</span>
                <Badge variant="outline" className="text-[10px] tabular-nums">{r.count}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* ── Per-child breakdown ──────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            Per Child (This Month)
          </p>
          {DEMO_CHILD_BREAKDOWN.map((c) => (
            <div key={c.child} className="flex items-center justify-between rounded border p-2 text-xs">
              <span className="font-medium">{c.child}</span>
              <div className="flex items-center gap-2">
                <span className="text-red-600 tabular-nums">{c.sanctions}S</span>
                <span className="text-green-600 tabular-nums">{c.rewards}R</span>
                {c.sanctions > 0 && (
                  <Badge className={cn(
                    "text-[10px] tabular-nums",
                    c.ratio >= 3 ? "bg-green-100 text-green-700" : c.ratio >= 2 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700",
                  )}>
                    {c.ratio.toFixed(1)}:1
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Manager review compliance ───────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <Eye className="h-3 w-3 text-blue-500" />
            Manager Review Compliance
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  b.manager_review_rate >= 90 ? "bg-green-500" : b.manager_review_rate >= 70 ? "bg-amber-500" : "bg-red-500",
                )}
                style={{ width: `${b.manager_review_rate}%` }}
              />
            </div>
            <span className={cn(
              "text-xs font-bold tabular-nums",
              b.manager_review_rate >= 90 ? "text-green-600" : b.manager_review_rate >= 70 ? "text-amber-600" : "text-red-600",
            )}>
              {b.manager_review_rate}%
            </span>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Behaviour Alerts
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
            ARIA Behaviour Intelligence
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
