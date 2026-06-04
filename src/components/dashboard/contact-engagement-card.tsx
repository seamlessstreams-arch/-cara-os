"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CONTACT & FAMILY ENGAGEMENT INTELLIGENCE CARD
// Dashboard widget for contact plan compliance, family time analysis,
// mood impact, per-child profiles, and ARIA contact intelligence.
// Powered by the Contact Engagement Engine — live data (Reg 6/7).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart, ChevronRight, AlertTriangle, CheckCircle2,
  Brain, Users, Loader2, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContactEngagement } from "@/hooks/use-contact-engagement";

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

const PRESENTATION_COLOURS: Record<string, string> = {
  settled: "text-green-600",
  excited: "text-blue-600",
  anxious: "text-amber-600",
  withdrawn: "text-red-600",
  resistant: "text-red-600",
};

// ── Component ────────────────────────────────────────────────────────────────

export function ContactEngagementCard() {
  const { data, isLoading } = useContactEngagement();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-brand" />
            Contact & Family
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

  const c = intel.compliance;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-brand" />
            Contact & Family
          </CardTitle>
          <Link href="/contact-directory" className="text-xs text-brand hover:underline flex items-center gap-1">
            Contact <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{intel.family_time.total_sessions_30d}</p>
            <p className="text-[10px] text-muted-foreground">Sessions (30d)</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{c.avg_sessions_per_child_30d}</p>
            <p className="text-[10px] text-muted-foreground">Per Child</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", intel.family_time.safe_sessions_pct === 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", intel.family_time.safe_sessions_pct === 100 ? "text-green-600" : "text-amber-600")}>
              {intel.family_time.safe_sessions_pct}%
            </p>
            <p className="text-[10px] text-muted-foreground">Safe</p>
          </div>
          <div className="text-center rounded-lg bg-purple-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-purple-600">{intel.family_time.sibling_contact_sessions}</p>
            <p className="text-[10px] text-muted-foreground">Sibling</p>
          </div>
        </div>

        {/* ── Per-child contact profiles ───────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Family Contact
            </p>
            {intel.child_profiles.slice(0, 4).map((child) => (
              <div key={child.child_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{child.child_name}</span>
                    {child.predominant_presentation && (
                      <span className={cn("text-[10px]", PRESENTATION_COLOURS[child.predominant_presentation] ?? "text-gray-500")}>
                        {child.predominant_presentation}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold tabular-nums">{child.sessions_30d}</span>
                    <span className="text-muted-foreground text-[10px]">/ 30d</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                  {child.most_frequent_contact && (
                    <span className="text-[10px]">{child.most_frequent_contact}</span>
                  )}
                  {child.unique_contacts > 1 && (
                    <span className="text-[10px]">+{child.unique_contacts - 1} others</span>
                  )}
                  {child.concern_sessions_90d > 0 && (
                    <Badge className="text-[9px] bg-amber-100 text-amber-700">
                      {child.concern_sessions_90d} concerns
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Mood impact summary ─────────────────────────────────────── */}

        {intel.mood_impact.children_with_data > 0 && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-brand" />
              <div>
                <p className="text-xs font-medium">Mood Impact</p>
                <p className="text-[10px] text-muted-foreground">
                  Contact days avg {intel.mood_impact.avg_mood_contact_days}/10 vs {intel.mood_impact.avg_mood_non_contact_days}/10
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {intel.mood_impact.positive_impact_children > 0 && (
                <Badge className="text-[9px] bg-green-100 text-green-700">
                  {intel.mood_impact.positive_impact_children} positive
                </Badge>
              )}
              {intel.mood_impact.negative_impact_children > 0 && (
                <Badge className="text-[9px] bg-red-100 text-red-700">
                  {intel.mood_impact.negative_impact_children} negative
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* ── Contact Plan status ─────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Heart className={cn("h-4 w-4", c.plans_overdue_review > 0 ? "text-amber-500" : "text-green-500")} />
            <div>
              <p className="text-xs font-medium">Contact Plans</p>
              <p className="text-[10px] text-muted-foreground">
                {c.active_plans}/{c.total_children} active
              </p>
            </div>
          </div>
          {c.plans_overdue_review > 0 ? (
            <Badge className="text-[10px] bg-amber-100 text-amber-700">
              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
              {c.plans_overdue_review} review overdue
            </Badge>
          ) : c.active_plans > 0 ? (
            <Badge className="text-[10px] bg-green-100 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All current
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-gray-100 text-gray-600">
              None active
            </Badge>
          )}
        </div>

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

        {/* ── ARIA Contact Intelligence ───────────────────────────────── */}

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
