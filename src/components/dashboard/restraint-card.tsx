"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PHYSICAL INTERVENTION INTELLIGENCE CARD
// Dashboard widget for restraint incidents, compliance metrics, de-escalation,
// debrief rates, injury tracking, and ARIA restraint reduction intelligence.
// Powered by the Restraint Intelligence Engine — live data (Reg 20/35).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Hand, ChevronRight, AlertTriangle, Brain,
  ShieldCheck, Loader2, Clock, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRestraintIntelligence } from "@/hooks/use-restraint-intelligence";

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

// ── Compliance bar sub-component ────────────────────────────────────────────

function ComplianceBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 truncate">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            value >= 90 ? "bg-green-400" : value >= 70 ? "bg-amber-400" : "bg-red-400",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={cn(
        "w-8 text-right tabular-nums font-medium",
        value >= 90 ? "text-green-600" : value >= 70 ? "text-amber-600" : "text-red-600",
      )}>
        {value}%
      </span>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function RestraintCard() {
  const { data, isLoading } = useRestraintIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Hand className="h-4 w-4 text-brand" />
            Physical Interventions
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
            <Hand className="h-4 w-4 text-brand" />
            Physical Interventions
          </CardTitle>
          <Link href="/restraint-log" className="text-xs text-brand hover:underline flex items-center gap-1">
            Records <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", o.total_incidents_90d === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.total_incidents_90d === 0 ? "text-green-600" : "text-amber-600")}>
              {o.total_incidents_90d}
            </p>
            <p className="text-[10px] text-muted-foreground">Total (90d)</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.avg_duration_minutes}m
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Duration</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.incidents_with_injury === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.incidents_with_injury === 0 ? "text-green-600" : "text-red-600")}>
              {o.incidents_with_injury}
            </p>
            <p className="text-[10px] text-muted-foreground">Injuries</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.total_incidents_30d === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.total_incidents_30d === 0 ? "text-green-600" : "text-amber-600")}>
              {o.total_incidents_30d}
            </p>
            <p className="text-[10px] text-muted-foreground">This Month</p>
          </div>
        </div>

        {/* ── Type & reason breakdown ─────────────────────────────────── */}

        {intel.type_breakdown.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            {intel.type_breakdown.slice(0, 4).map((t) => (
              <div key={t.type} className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="truncate capitalize">{t.type.replace(/_/g, " ")}</span>
                <Badge variant="outline" className="text-[10px] tabular-nums ml-1">{t.count}</Badge>
              </div>
            ))}
          </div>
        )}

        {/* ── Per-child profiles ───────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              By Young Person
            </p>
            {intel.child_profiles.slice(0, 3).map((profile) => (
              <div key={profile.child_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{profile.child_name}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {profile.primary_reason?.replace(/_/g, " ") ?? "—"}
                    </span>
                  </div>
                  <Badge className={cn(
                    "text-[10px]",
                    profile.total_incidents_30d >= 3 ? "bg-red-100 text-red-700" :
                    profile.total_incidents_30d >= 1 ? "bg-amber-100 text-amber-700" :
                    "bg-green-100 text-green-700",
                  )}>
                    {profile.total_incidents_30d} this month
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                  <span className="text-[10px] flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {profile.avg_duration}m avg
                  </span>
                  <span className="text-[10px]">{profile.total_incidents_90d} in 90d</span>
                  {profile.injuries_count > 0 && (
                    <Badge className="text-[9px] bg-red-100 text-red-700">
                      {profile.injuries_count} injury
                    </Badge>
                  )}
                  {profile.frequency_trend !== "insufficient_data" && (
                    <span className={cn(
                      "text-[10px] font-medium",
                      profile.frequency_trend === "decreasing" ? "text-green-600" :
                      profile.frequency_trend === "increasing" ? "text-red-600" :
                      "text-gray-500",
                    )}>
                      {profile.frequency_trend}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Compliance metrics ──────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Post-Incident Compliance
          </p>
          <ComplianceBar label="Body maps" value={o.body_map_rate} />
          <ComplianceBar label="Child debrief" value={o.child_debrief_rate} />
          <ComplianceBar label="Staff debrief" value={o.staff_debrief_rate} />
          <ComplianceBar label="De-escalation" value={o.de_escalation_documented_rate} />
          <ComplianceBar label="Manager review" value={o.review_completion_rate} />
          <ComplianceBar label="Team Teach" value={o.team_teach_compliance_rate} />
        </div>

        {/* ── Time patterns ───────────────────────────────────────────── */}

        {intel.time_patterns.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border p-3">
            <Clock className="h-4 w-4 text-blue-500" />
            <div className="flex-1">
              <p className="text-xs font-medium">Peak Incident Time</p>
              <p className="text-[10px] text-muted-foreground">
                {intel.time_patterns[0].period} ({intel.time_patterns[0].count} incident{intel.time_patterns[0].count > 1 ? "s" : ""})
              </p>
            </div>
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Intervention Alerts
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

        {/* ── ARIA Restraint Intelligence ──────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Behaviour Intelligence
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
