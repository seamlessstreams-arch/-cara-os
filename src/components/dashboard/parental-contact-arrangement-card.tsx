"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PARENTAL CONTACT ARRANGEMENT INTELLIGENCE CARD
// Dashboard card for parental contact compliance, supervision, and outcomes.
// Powered by the Contact Engagement Intelligence Engine — live data.
// CHR 2015 Reg 6/7. SCCIF: Overall Experiences — Contact & relationships.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users2, ChevronRight, AlertTriangle, Brain,
  Loader2, Users,
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

export function ParentalContactArrangementCard() {
  const { data, isLoading } = useContactEngagement();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users2 className="h-4 w-4 text-brand" />
            Parental Contact
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
  const c = intel.compliance;

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users2 className="h-4 w-4 text-brand" />
            Parental Contact
          </CardTitle>
          <Link href="/contact" className="text-xs text-brand hover:underline flex items-center gap-1">
            Contact <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{ft.total_sessions_30d}</p>
            <p className="text-[10px] text-muted-foreground">Sessions (30d)</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{ft.family_contact_sessions}</p>
            <p className="text-[10px] text-muted-foreground">Family</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", ft.concern_sessions === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", ft.concern_sessions === 0 ? "text-green-600" : "text-amber-600")}>{ft.concern_sessions}</p>
            <p className="text-[10px] text-muted-foreground">Concerns</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", ft.safe_sessions_pct === 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", ft.safe_sessions_pct === 100 ? "text-green-600" : "text-amber-600")}>{ft.safe_sessions_pct}%</p>
            <p className="text-[10px] text-muted-foreground">Safe</p>
          </div>
        </div>

        {/* ── Per-child profiles ──────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Parental Contact
            </p>
            {intel.child_profiles.slice(0, 4).map((cp) => (
              <div key={cp.child_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{cp.child_name}</span>
                  {cp.most_frequent_contact && (
                    <span className="text-[10px] text-muted-foreground">{cp.most_frequent_contact}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tabular-nums">{cp.sessions_30d}</span>
                  <span className="text-muted-foreground text-[10px]">/ 30d</span>
                  {cp.concern_sessions_90d > 0 && (
                    <Badge className="text-[9px] bg-amber-100 text-amber-700">
                      {cp.concern_sessions_90d} concerns
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Supervision breakdown ──────────────────────────────────── */}

        {(ft.supervision_breakdown?.length ?? 0) > 0 && (
          <div className="rounded-lg border p-3 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Supervision Levels</p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {(ft.supervision_breakdown ?? []).slice(0, 3).map((sb) => (
                <div key={sb.level}>
                  <p className="font-bold tabular-nums text-blue-600">{sb.count}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{sb.level}</p>
                </div>
              ))}
            </div>
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

        {/* ── ARIA Contact Intelligence ───────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Contact Intelligence
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
