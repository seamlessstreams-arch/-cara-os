"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RECORDING QUALITY CARD
// Dashboard widget showing daily recording compliance, quality distribution,
// staff recording profiles, and ARIA recording intelligence.
// Reg 36 — records must be accurate, up-to-date, and stored securely.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, ChevronRight, CheckCircle2, AlertTriangle,
  Clock, Brain, PenLine, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_QUALITY = {
  totalExpected: 42,
  totalSubmitted: 38,
  missing: 4,
  lateSubmissions: 3,
  compliancePercentage: 90,
  averageQualityScore: 72,
  qualityBreakdown: {
    excellent: 8,
    good: 16,
    adequate: 10,
    poor: 4,
    missing: 4,
  },
};

const STAFF_PROFILES = [
  { name: "Ryan Clarke", avgQuality: 88, records: 12, trend: "improving" as const },
  { name: "Anna Kowalska", avgQuality: 82, records: 10, trend: "stable" as const },
  { name: "Chervelle Thomas", avgQuality: 76, records: 8, trend: "improving" as const },
  { name: "Edward Barnes", avgQuality: 52, records: 5, trend: "declining" as const },
  { name: "Lackson Moyo", avgQuality: 45, records: 3, trend: "declining" as const },
];

const ARIA_INSIGHTS = [
  "Edward Barnes's recording quality has declined over the past 2 weeks — average word count dropped from 180 to 65. Consider addressing in next supervision session.",
  "Alex W was not mentioned in any shift notes on 3 days this week. SCCIF requires that all children's daily experiences are recorded.",
  "Excellent recording trend from Ryan Clarke and Anna Kowalska — both consistently include mood observations, positive highlights, and behaviour analysis.",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const QUALITY_COLOURS: Record<string, { bg: string; text: string; bar: string }> = {
  excellent: { bg: "bg-green-100", text: "text-green-700", bar: "bg-green-500" },
  good: { bg: "bg-blue-100", text: "text-blue-700", bar: "bg-blue-400" },
  adequate: { bg: "bg-amber-100", text: "text-amber-700", bar: "bg-amber-400" },
  poor: { bg: "bg-red-100", text: "text-red-700", bar: "bg-red-400" },
  missing: { bg: "bg-gray-100", text: "text-gray-600", bar: "bg-gray-400" },
};

const TREND_ICON: Record<string, { icon: typeof TrendingUp; colour: string }> = {
  improving: { icon: TrendingUp, colour: "text-green-600" },
  stable: { icon: CheckCircle2, colour: "text-gray-500" },
  declining: { icon: AlertTriangle, colour: "text-red-600" },
};

function qualityLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 40) return "Adequate";
  return "Poor";
}

// ── Component ────────────────────────────────────────────────────────────────

export function RecordingQualityCard() {
  const q = DEMO_QUALITY;
  const maxQuality = Math.max(...Object.values(q.qualityBreakdown), 1);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <PenLine className="h-4 w-4 text-brand" />
            Recording Quality
          </CardTitle>
          <Link href="/daily-log" className="text-xs text-brand hover:underline flex items-center gap-1">
            Daily Records <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Headline strip ───────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2">
            <p className="text-lg font-bold tabular-nums">{q.totalSubmitted}/{q.totalExpected}</p>
            <p className="text-[10px] text-muted-foreground">Submitted</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", q.missing > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", q.missing > 0 ? "text-red-600" : "text-green-600")}>{q.missing}</p>
            <p className="text-[10px] text-muted-foreground">Missing</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", q.lateSubmissions > 0 ? "bg-amber-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", q.lateSubmissions > 0 ? "text-amber-600" : "text-gray-500")}>{q.lateSubmissions}</p>
            <p className="text-[10px] text-muted-foreground">Late</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2">
            <p className="text-lg font-bold tabular-nums">{q.averageQualityScore}%</p>
            <p className="text-[10px] text-muted-foreground">Avg Quality</p>
          </div>
        </div>

        {/* ── Compliance bar ───────────────────────────────────────────── */}

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Reg 36 Compliance</span>
            <span className={cn(
              "font-bold tabular-nums",
              q.compliancePercentage >= 90 ? "text-green-600" : q.compliancePercentage >= 75 ? "text-amber-600" : "text-red-600",
            )}>
              {q.compliancePercentage}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                q.compliancePercentage >= 90 ? "bg-green-500" : q.compliancePercentage >= 75 ? "bg-amber-500" : "bg-red-500",
              )}
              style={{ width: `${q.compliancePercentage}%` }}
            />
          </div>
        </div>

        {/* ── Quality distribution ─────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Quality Distribution</p>
          {(["excellent", "good", "adequate", "poor", "missing"] as const).map((level) => {
            const count = q.qualityBreakdown[level];
            const pct = (count / maxQuality) * 100;
            const colours = QUALITY_COLOURS[level];
            return (
              <div key={level} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-14 text-right capitalize">{level}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={cn("h-full rounded-full", colours.bar)} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] font-bold tabular-nums w-4 text-right">{count}</span>
              </div>
            );
          })}
        </div>

        {/* ── Staff profiles ───────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Staff Recording Profiles
          </p>
          {STAFF_PROFILES.map((staff, i) => {
            const trend = TREND_ICON[staff.trend] ?? TREND_ICON.stable;
            const TIcon = trend.icon;
            return (
              <div key={i} className="flex items-center justify-between rounded border px-3 py-1.5 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <TIcon className={cn("h-3 w-3 flex-shrink-0", trend.colour)} />
                  <span className="font-medium truncate">{staff.name}</span>
                  <span className="text-muted-foreground">({staff.records})</span>
                </div>
                <Badge className={cn(
                  "text-[10px] flex-shrink-0",
                  staff.avgQuality >= 65 ? "bg-green-100 text-green-700" : staff.avgQuality >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700",
                )}>
                  {qualityLabel(staff.avgQuality)} ({staff.avgQuality}%)
                </Badge>
              </div>
            );
          })}
        </div>

        {/* ── ARIA insights ────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA Recording Intelligence
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

        {/* ── Reg note ─────────────────────────────────────────────────── */}

        <div className="rounded border-l-3 border-blue-400 bg-blue-50 px-3 py-2 text-[11px] text-blue-800">
          <strong>Reg 36</strong> — Records must be kept of the matters in Schedule 4.
          They must be accurate, up-to-date, maintained to evidence the quality of care,
          and available on request by Ofsted inspectors.
        </div>
      </CardContent>
    </Card>
  );
}
