"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SAFEGUARDING PARTNERSHIP CARD
// Dashboard card powered by the Safeguarding Intelligence Engine.
// Focus: referrals, escalations, outcomes, notifiable events.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield, ChevronRight, Brain, Loader2, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSafeguardingIntelligence } from "@/hooks/use-safeguarding-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning:  "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

// ── Component ───────────────────────────────────────────────────────────────

export function SafeguardingPartnershipCard() {
  const { data, isLoading } = useSafeguardingIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-600" />
            Safeguarding Partners
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
  const ne = intel.notifiable_events;
  const m = intel.missing;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-600" />
            Safeguarding Partners
          </CardTitle>
          <Link href="/safeguarding" className="text-xs text-brand hover:underline flex items-center gap-1">
            Safeguarding <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Partnership metrics strip ───────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", p.safeguarding_incidents_90d === 0 ? "bg-green-50" : p.safeguarding_incidents_90d <= 3 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", p.safeguarding_incidents_90d === 0 ? "text-green-600" : p.safeguarding_incidents_90d <= 3 ? "text-amber-600" : "text-red-600")}>{p.safeguarding_incidents_90d}</p>
            <p className="text-[10px] text-muted-foreground">SG Referrals</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", p.incidents_needing_oversight === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", p.incidents_needing_oversight === 0 ? "text-green-600" : "text-red-600")}>{p.incidents_needing_oversight}</p>
            <p className="text-[10px] text-muted-foreground">Escalated</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", ne.compliance_rate >= 100 ? "bg-green-50" : ne.compliance_rate >= 80 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", ne.compliance_rate >= 100 ? "text-green-600" : ne.compliance_rate >= 80 ? "text-amber-600" : "text-red-600")}>{ne.compliance_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Compliance</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", m.children_with_episodes === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.children_with_episodes === 0 ? "text-green-600" : "text-amber-600")}>{m.children_with_episodes}</p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
        </div>

        {/* ── Notifiable events ───────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Bell className="h-3 w-3" />
            Notifiable Events
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-sm font-bold tabular-nums text-blue-600">{ne.total_events}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
            <div>
              <p className={cn("text-sm font-bold tabular-nums", ne.notified_on_time === ne.total_events ? "text-green-600" : "text-amber-600")}>{ne.notified_on_time}</p>
              <p className="text-[10px] text-muted-foreground">On Time</p>
            </div>
            <div>
              <p className={cn("text-sm font-bold tabular-nums", ne.notified_late === 0 ? "text-green-600" : "text-amber-600")}>{ne.notified_late}</p>
              <p className="text-[10px] text-muted-foreground">Late</p>
            </div>
            <div>
              <p className={cn("text-sm font-bold tabular-nums", ne.pending_notification === 0 ? "text-green-600" : "text-red-600")}>{ne.pending_notification}</p>
              <p className="text-[10px] text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>

        {/* ── Event type breakdown ────────────────────────────────────── */}

        {ne.by_type.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(ne.by_type ?? []).map((t, i) => (
              <Badge key={i} variant="outline" className="text-[10px] capitalize">
                {t.type.replace(/_/g, " ")} ({t.count})
              </Badge>
            ))}
          </div>
        )}

        {/* ── ARIA Partnership Intelligence ───────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Partnership Intelligence
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
