"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILDREN'S PARTICIPATION INTELLIGENCE CARD
// Dashboard card for participation, consultations, children's voice.
// Powered by the Contact Engagement Intelligence Engine — live data.
// CHR 2015 Reg 7. UNCRC Article 12. SCCIF: Children's Experiences.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle, ChevronRight, AlertTriangle, Brain,
  Loader2, Users, CheckCircle2,
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

export function ChildrensParticipationCard() {
  const { data, isLoading } = useContactEngagement();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-brand" />
            Children&apos;s Participation
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
  const ft = intel.family_time;
  const mi = intel.mood_impact;

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-brand" />
            Children&apos;s Participation
          </CardTitle>
          <Link href="/contact-directory" className="text-xs text-brand hover:underline flex items-center gap-1">
            Participation <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{c.completed_sessions_30d}</p>
            <p className="text-[10px] text-muted-foreground">Sessions (30d)</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", c.overall_completion_rate >= 80 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", c.overall_completion_rate >= 80 ? "text-green-600" : "text-amber-600")}>{c.overall_completion_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Completion</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{c.active_plans}</p>
            <p className="text-[10px] text-muted-foreground">Active Plans</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", ft.safe_sessions_pct === 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", ft.safe_sessions_pct === 100 ? "text-green-600" : "text-amber-600")}>{ft.safe_sessions_pct}%</p>
            <p className="text-[10px] text-muted-foreground">Safe</p>
          </div>
        </div>

        {/* ── Mood impact summary ─────────────────────────────────────── */}

        {mi.children_with_data > 0 && (
          <div className="rounded-lg border p-3 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Participation Mood Impact</p>
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
          </div>
        )}

        {/* ── Child profiles ─────────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Participation Profiles
            </p>
            {intel.child_profiles.map((cp) => (
              <div key={cp.child_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{cp.child_name}</span>
                  <span className="text-[10px] text-muted-foreground">{cp.unique_contacts} contacts</span>
                </div>
                <div className="flex items-center gap-1">
                  {cp.has_active_plan ? (
                    <Badge className="text-[9px] bg-green-100 text-green-700">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                      plan
                    </Badge>
                  ) : (
                    <Badge className="text-[9px] bg-gray-100 text-gray-600">no plan</Badge>
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
              Participation Alerts
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

        {/* ── ARIA Participation Intelligence ─────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Participation Intelligence
            </p>
            {intel.insights.slice(0, 2).map((insight, i) => (
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
