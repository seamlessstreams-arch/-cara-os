"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ADVOCACY & CHILDREN'S RIGHTS INTELLIGENCE CARD
// Dashboard card powered by the Advocacy Intelligence Engine.
// Reg 7 (wishes/feelings), Reg 14 (needs assessment), Reg 45 (QoC review),
// Children Act 1989 s26 (advocacy for LAC).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck, ChevronRight, AlertTriangle, Brain,
  Heart, Scale, MessageSquare, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdvocacyIntelligence } from "@/hooks/use-advocacy-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high:     "border-red-200 bg-red-50 text-red-800",
  medium:   "border-amber-200 bg-amber-50 text-amber-800",
  low:      "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning:  "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

// ── Component ───────────────────────────────────────────────────────────────

export function AdvocacyCard() {
  const { data, isLoading } = useAdvocacyIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-brand" />
            Advocacy & Rights
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

  const o = intel.overview;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-brand" />
            Advocacy & Rights
          </CardTitle>
          <Link href="/advocacy" className="text-xs text-brand hover:underline flex items-center gap-1">
            Register <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.total_referrals}
            </p>
            <p className="text-[10px] text-muted-foreground">Referrals</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.active_referrals > 0 ? "bg-amber-50" : "bg-green-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.active_referrals > 0 ? "text-amber-600" : "text-green-600",
            )}>
              {o.active_referrals}
            </p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.children_with_active_advocate}
            </p>
            <p className="text-[10px] text-muted-foreground">With Advocate</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.children_without_any_referral === 0 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.children_without_any_referral === 0 ? "text-green-600" : "text-amber-600",
            )}>
              {o.children_without_any_referral}
            </p>
            <p className="text-[10px] text-muted-foreground">No Referral</p>
          </div>
        </div>

        {/* ── Referral breakdown ──────────────────────────────────────── */}

        {intel.referral_breakdown.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Heart className="h-3 w-3" />
              Referrals by Type
            </p>
            {intel.referral_breakdown.map((r) => (
              <div key={r.type} className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="truncate flex-1">{r.type_label}</span>
                <div className="flex items-center gap-1.5 ml-2">
                  <Badge variant="outline" className="text-[10px] tabular-nums">{r.count}</Badge>
                  {r.active_count > 0 && (
                    <Badge className="text-[10px] bg-blue-100 text-blue-700">{r.active_count} active</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Child advocacy profiles ────────────────────────────────── */}

        {intel.child_advocacy_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Scale className="h-3 w-3" />
              Children's Advocacy
            </p>
            {intel.child_advocacy_profiles.map((cp) => (
              <div key={cp.child_id} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-medium truncate">{cp.child_name}</span>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  {cp.has_advocate ? (
                    <Badge className="text-[10px] bg-green-100 text-green-700">Active</Badge>
                  ) : cp.total_referrals > 0 ? (
                    <Badge className="text-[10px] bg-blue-100 text-blue-700">{cp.total_referrals} past</Badge>
                  ) : (
                    <Badge className="text-[10px] bg-gray-100 text-gray-600">None</Badge>
                  )}
                  {cp.days_since_last_visit !== null && cp.days_since_last_visit > 28 && (
                    <Badge className="text-[10px] bg-amber-100 text-amber-700">{cp.days_since_last_visit}d gap</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Participation metrics ──────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-xs font-semibold flex items-center gap-1">
            <MessageSquare className="h-3 w-3 text-blue-500" />
            Participation
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="font-bold text-blue-600 tabular-nums">{o.avg_days_to_start}d</p>
              <p className="text-[10px] text-muted-foreground">Avg Start</p>
            </div>
            <div>
              <p className="font-bold text-blue-600 tabular-nums">{o.total_visits}</p>
              <p className="text-[10px] text-muted-foreground">Visits</p>
            </div>
            <div>
              <p className="font-bold text-green-600 tabular-nums">{o.completed_referrals}</p>
              <p className="text-[10px] text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Advocacy Alerts
            </p>
            {intel.alerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium,
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA Advocacy Intelligence ──────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Advocacy Intelligence
            </p>
            {intel.insights.slice(0, 3).map((insight, i) => (
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
