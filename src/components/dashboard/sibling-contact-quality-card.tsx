"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SIBLING CONTACT QUALITY INTELLIGENCE CARD
// Dashboard card powered by the Contact Engagement Intelligence Engine.
// CHR 2015 Reg 8/9. SCCIF: Overall Experiences — Contact & relationships.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, ChevronRight, AlertTriangle, Brain,
  HeartHandshake, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContactEngagement } from "@/hooks/use-contact-engagement";

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

export function SiblingContactQualityCard() {
  const { data, isLoading } = useContactEngagement();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-brand" />
            Sibling Contact Quality
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

  const ft = intel.family_time;
  const mi = intel.mood_impact;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-brand" />
            Sibling Contact Quality
          </CardTitle>
          <Link href="/contact-directory" className="text-xs text-brand hover:underline flex items-center gap-1">
            Contact <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{ft.sibling_contact_sessions}</p>
            <p className="text-[10px] text-muted-foreground">Sibling</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{ft.family_contact_sessions}</p>
            <p className="text-[10px] text-muted-foreground">Family</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", ft.concern_sessions === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", ft.concern_sessions === 0 ? "text-green-600" : "text-amber-600")}>{ft.concern_sessions}</p>
            <p className="text-[10px] text-muted-foreground">Concerns</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{ft.avg_duration_minutes}m</p>
            <p className="text-[10px] text-muted-foreground">Avg Duration</p>
          </div>
        </div>

        {/* ── Mood impact ─────────────────────────────────────────────── */}

        {mi.children_with_data > 0 && (
          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1">
              <Users className="h-3 w-3 text-blue-500" />
              Contact Mood Impact
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="font-bold tabular-nums text-green-600">{mi.positive_impact_children}</p>
                <p className="text-[10px] text-muted-foreground">Positive</p>
              </div>
              <div>
                <p className="font-bold tabular-nums text-blue-600">{mi.neutral_impact_children}</p>
                <p className="text-[10px] text-muted-foreground">Neutral</p>
              </div>
              <div>
                <p className={cn("font-bold tabular-nums", mi.negative_impact_children === 0 ? "text-green-600" : "text-red-600")}>{mi.negative_impact_children}</p>
                <p className="text-[10px] text-muted-foreground">Negative</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
              <span>Mood on contact days: {mi.avg_mood_contact_days}/10</span>
              <span>Non-contact: {mi.avg_mood_non_contact_days}/10</span>
            </div>
          </div>
        )}

        {/* ── Child profiles ──────────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            {intel.child_profiles.map((cp) => (
              <div key={cp.child_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{cp.child_name}</span>
                  <span className="text-[10px] text-muted-foreground">{cp.sessions_30d} sessions/30d</span>
                </div>
                <div className="flex items-center gap-1">
                  {!cp.plan_review_current && (
                    <Badge className="text-[9px] bg-amber-100 text-amber-700">review due</Badge>
                  )}
                  {cp.has_active_plan && (
                    <Badge className="text-[9px] bg-green-100 text-green-700">plan active</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Contact Alerts
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

        {/* ── ARIA Intelligence ───────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Contact Intelligence
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
