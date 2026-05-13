"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MISSING FROM CARE INTELLIGENCE CARD
// Dashboard card for missing episode tracking, return interviews,
// push/pull factors, and ARIA missing intelligence (Reg 34).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, ChevronRight, AlertTriangle, CheckCircle2,
  Brain, Radio, UserSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_PROFILE = {
  totalEpisodes: 5,
  activeEpisodes: 0,
  resolvedThisMonth: 1,
  avgDurationMinutes: 127,
  policeNotificationRate: 80,
  returnInterviewCompletionRate: 75,
};

const RECENT_EPISODES = [
  {
    id: "me_1",
    child: "Tyler R",
    type: "missing",
    riskLevel: "high",
    status: "closed",
    date: "2026-05-07",
    duration: "2h 15m",
    returnInterview: "completed",
    trigger: "peer_influence",
  },
  {
    id: "me_2",
    child: "Tyler R",
    type: "absent",
    riskLevel: "medium",
    status: "closed",
    date: "2026-04-28",
    duration: "1h 30m",
    returnInterview: "completed",
    trigger: "peer_influence",
  },
];

const PUSH_PULL = {
  push: [{ factor: "conflict_with_staff", count: 1 }],
  pull: [{ factor: "peer_influence", count: 3 }, { factor: "romantic_relationship", count: 1 }],
  risk: [] as { factor: string; count: number }[],
};

const TYPE_COLOURS: Record<string, string> = {
  missing: "bg-red-100 text-red-700",
  absent: "bg-amber-100 text-amber-700",
  awol: "bg-red-100 text-red-700",
  failed_to_return: "bg-orange-100 text-orange-700",
};

const RISK_COLOURS: Record<string, string> = {
  very_high: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};

const ARIA_INSIGHTS = [
  "Tyler R has had 3 missing episodes in the past 6 weeks, all linked to peer influence. Consider whether exploitation screening is required and discuss at next strategy meeting.",
  "Return interview completion rate at 75% — 1 interview was refused. Ensure independent person availability is maintained and children are supported to engage.",
  "Positive: Zero active missing episodes. Average duration reducing (from 3h to 2h15m). Push factors are minimal — most episodes are pull-related, suggesting the placement itself is not a driver.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function MissingFromCareCard() {
  const p = DEMO_PROFILE;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand" />
            Missing from Care
          </CardTitle>
          <Link href="/missing" className="text-xs text-brand hover:underline flex items-center gap-1">
            Missing <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", p.activeEpisodes > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", p.activeEpisodes > 0 ? "text-red-600" : "text-green-600")}>
              {p.activeEpisodes}
            </p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2">
            <p className="text-lg font-bold tabular-nums">{p.totalEpisodes}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2">
            <p className="text-lg font-bold tabular-nums">{Math.floor(p.avgDurationMinutes / 60)}h {p.avgDurationMinutes % 60}m</p>
            <p className="text-[10px] text-muted-foreground">Avg Duration</p>
          </div>
          <div className="text-center rounded-lg p-2" style={{ background: p.returnInterviewCompletionRate >= 100 ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", p.returnInterviewCompletionRate >= 100 ? "text-green-600" : "text-amber-600")}>
              {p.returnInterviewCompletionRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Interviews</p>
          </div>
        </div>

        {/* ── Active alert ────────────────────────────────────────────── */}

        {p.activeEpisodes > 0 && (
          <div className="rounded-lg border-2 border-red-300 bg-red-50 p-3 flex items-start gap-2">
            <Radio className="h-4 w-4 text-red-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-red-800">ACTIVE MISSING EPISODE</p>
              <p className="text-[10px] text-red-700">Immediate action required — check police notification and placing authority contact.</p>
            </div>
          </div>
        )}

        {/* ── Recent episodes ─────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <UserSearch className="h-3 w-3" />
            Recent Episodes
          </p>
          {RECENT_EPISODES.map((ep) => (
            <div key={ep.id} className="rounded-lg border p-3 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{ep.child}</span>
                  <Badge className={cn("text-[10px]", TYPE_COLOURS[ep.type] ?? "bg-gray-100 text-gray-600")}>
                    {ep.type}
                  </Badge>
                  <Badge className={cn("text-[10px]", RISK_COLOURS[ep.riskLevel] ?? "")}>
                    {ep.riskLevel}
                  </Badge>
                </div>
                <span className="text-muted-foreground">{ep.date}</span>
              </div>
              <p className="text-muted-foreground">
                Duration: {ep.duration} · Return interview: {ep.returnInterview} · Trigger: {ep.trigger.replace("_", " ")}
              </p>
            </div>
          ))}
        </div>

        {/* ── Push/Pull factors ────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Push/Pull Factor Analysis</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5">
              <p className="text-[10px] font-semibold text-blue-800 mb-1">Pull Factors</p>
              {PUSH_PULL.pull.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] text-blue-700">
                  <span>{f.factor.replace(/_/g, " ")}</span>
                  <span className="font-bold">{f.count}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-2.5">
              <p className="text-[10px] font-semibold text-orange-800 mb-1">Push Factors</p>
              {PUSH_PULL.push.length > 0 ? PUSH_PULL.push.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] text-orange-700">
                  <span>{f.factor.replace(/_/g, " ")}</span>
                  <span className="font-bold">{f.count}</span>
                </div>
              )) : (
                <p className="text-[10px] text-orange-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> None identified
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── ARIA insights ────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA Missing Intelligence
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
