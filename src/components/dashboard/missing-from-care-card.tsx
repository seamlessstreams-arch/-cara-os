"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MISSING FROM CARE INTELLIGENCE CARD
// Dashboard card for missing episode tracking, return interviews,
// push/pull factors, and ARIA missing intelligence (Reg 34).
// Powered by the Missing From Care Intelligence Engine — live data.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, ChevronRight, AlertTriangle, CheckCircle2,
  Brain, Radio, UserSearch, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMissingIntelligence } from "@/hooks/use-missing-intelligence";

// ── Colour maps ────────────────────────────────────────────────────────────

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

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

// ── Component ──────────────────────────────────────────────────────────────

export function MissingFromCareCard() {
  const { data, isLoading } = useMissingIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand" />
            Missing from Care
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const p = intel.profile;

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
          <div className={cn("text-center rounded-lg p-2", p.active_episodes > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", p.active_episodes > 0 ? "text-red-600" : "text-green-600")}>
              {p.active_episodes}
            </p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2">
            <p className="text-lg font-bold tabular-nums">{p.total_episodes}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2">
            <p className="text-lg font-bold tabular-nums">
              {Math.floor(p.avg_duration_minutes / 60)}h {p.avg_duration_minutes % 60}m
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Duration</p>
          </div>
          <div
            className="text-center rounded-lg p-2"
            style={{
              background: p.return_interview_completion_rate >= 100
                ? "hsl(var(--chart-2) / 0.1)"
                : "hsl(var(--destructive) / 0.08)",
            }}
          >
            <p className={cn(
              "text-lg font-bold tabular-nums",
              p.return_interview_completion_rate >= 100 ? "text-green-600" : "text-amber-600",
            )}>
              {p.return_interview_completion_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Interviews</p>
          </div>
        </div>

        {/* ── Active alert ────────────────────────────────────────────── */}

        {p.active_episodes > 0 && (
          <div className="rounded-lg border-2 border-red-300 bg-red-50 p-3 flex items-start gap-2">
            <Radio className="h-4 w-4 text-red-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-red-800">ACTIVE MISSING EPISODE</p>
              <p className="text-[10px] text-red-700">
                Immediate action required — check police notification and placing authority contact.
              </p>
            </div>
          </div>
        )}

        {/* ── Recent episodes ─────────────────────────────────────────── */}

        {intel.recent_episodes.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <UserSearch className="h-3 w-3" />
              Recent Episodes
            </p>
            {intel.recent_episodes.slice(0, 3).map((ep) => (
              <div key={ep.id} className="rounded-lg border p-3 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ep.child_name}</span>
                    <Badge className={cn("text-[10px]", TYPE_COLOURS[ep.type] ?? "bg-gray-100 text-gray-600")}>
                      {ep.type}
                    </Badge>
                    <Badge className={cn("text-[10px]", RISK_COLOURS[ep.risk_level] ?? "")}>
                      {ep.risk_level}
                    </Badge>
                    {ep.contextual_safeguarding && (
                      <Badge className="text-[10px] bg-purple-100 text-purple-700">
                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                        CS
                      </Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground">{ep.date}</span>
                </div>
                <p className="text-muted-foreground">
                  Duration: {ep.duration} · Return interview: {ep.return_interview} · Trigger: {ep.trigger.replace(/_/g, " ")}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Push/Pull factors ────────────────────────────────────────── */}

        {(intel.push_pull.pull.length > 0 || intel.push_pull.push.length > 0 || intel.push_pull.risk.length > 0) && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Push/Pull Factor Analysis</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5">
                <p className="text-[10px] font-semibold text-blue-800 mb-1">Pull Factors</p>
                {intel.push_pull.pull.length > 0 ? intel.push_pull.pull.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] text-blue-700">
                    <span>{f.factor.replace(/_/g, " ")}</span>
                    <span className="font-bold">{f.count}</span>
                  </div>
                )) : (
                  <p className="text-[10px] text-blue-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> None identified
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-2.5">
                <p className="text-[10px] font-semibold text-orange-800 mb-1">Push Factors</p>
                {intel.push_pull.push.length > 0 ? intel.push_pull.push.map((f, i) => (
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
            {intel.push_pull.risk.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2.5">
                <p className="text-[10px] font-semibold text-red-800 mb-1">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  Risk Indicators
                </p>
                {intel.push_pull.risk.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] text-red-700">
                    <span>{f.factor.replace(/_/g, " ")}</span>
                    <span className="font-bold">{f.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ARIA insights ────────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Missing Intelligence
            </p>
            {intel.insights.map((insight, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive,
                )}
              >
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
