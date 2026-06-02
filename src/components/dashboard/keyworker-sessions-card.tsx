"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — KEYWORKER SESSIONS INTELLIGENCE CARD
// Dashboard widget for keyworking session frequency, quality, child-led rates,
// documentation compliance, follow-up tracking, and ARIA keyworking intelligence.
// Powered by the Keyworking Intelligence Engine — live data (Reg 22).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart, ChevronRight, AlertTriangle, Brain,
  Loader2, Users, Clock, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeyworkingIntelligence } from "@/hooks/use-keyworking-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

// ── Component ────────────────────────────────────────────────────────────────

export function KeyworkerSessionsCard() {
  const { data, isLoading } = useKeyworkingIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-brand" />
            Keyworker Sessions
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
            <Heart className="h-4 w-4 text-brand" />
            Keyworker Sessions
          </CardTitle>
          <Link href="/keyworking" className="text-xs text-brand hover:underline flex items-center gap-1">
            Keyworking <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.total_sessions_30d}</p>
            <p className="text-[10px] text-muted-foreground">Sessions (30d)</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.avg_sessions_per_child_30d.toFixed(1)}
            </p>
            <p className="text-[10px] text-muted-foreground">Avg/Child</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.child_led_rate >= 80 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.child_led_rate >= 80 ? "text-green-600" : "text-amber-600")}>
              {o.child_led_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Child-Led</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.session_documented_rate >= 95 ? "bg-green-50" : o.session_documented_rate >= 80 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.session_documented_rate >= 95 ? "text-green-600" : o.session_documented_rate >= 80 ? "text-amber-600" : "text-red-600")}>
              {o.session_documented_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Documented</p>
          </div>
        </div>

        {/* ── Child profiles ───────────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              By Young Person
            </p>
            {intel.child_profiles.slice(0, 5).map((profile) => (
              <div key={profile.child_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{profile.child_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {profile.sessions_30d} session{profile.sessions_30d !== 1 ? "s" : ""} (30d)
                    </span>
                  </div>
                  <Badge className={cn(
                    "text-[10px]",
                    profile.days_since_last <= 7 ? "bg-green-100 text-green-700" :
                    profile.days_since_last <= 14 ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700",
                  )}>
                    {profile.days_since_last}d ago
                  </Badge>
                </div>
                {profile.topics_covered.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(profile.topics_covered ?? []).slice(0, 4).map((topic, i) => (
                      <Badge key={i} className="text-[9px] bg-gray-100 text-gray-700 border-gray-200">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Session type breakdown ──────────────────────────────────── */}

        {intel.session_type_breakdown.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Session Types (30d)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {intel.session_type_breakdown.map((st, i) => (
                <Badge key={i} className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                  {st.label} ({st.count_30d})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* ── Follow-up compliance ────────────────────────────────────── */}

        {intel.follow_up_compliance.total_due > 0 && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs font-medium">Follow-Up Compliance</p>
                <p className="text-[10px] text-muted-foreground">
                  {intel.follow_up_compliance.completed}/{intel.follow_up_compliance.total_due} completed
                  {intel.follow_up_compliance.overdue > 0 && (
                    <span className="text-red-600"> ({intel.follow_up_compliance.overdue} overdue)</span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-sm font-bold tabular-nums",
                intel.follow_up_compliance.rate >= 90 ? "text-green-600" :
                intel.follow_up_compliance.rate >= 70 ? "text-amber-600" : "text-red-600",
              )}>
                {intel.follow_up_compliance.rate}%
              </p>
            </div>
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Session Alerts
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

        {/* ── ARIA Keyworking Intelligence ─────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Keyworking Intelligence
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
