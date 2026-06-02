"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — VISITOR FEEDBACK COLLECTION INTELLIGENCE CARD
// Dashboard card for visitor feedback metrics, category breakdown,
// recent visitors, and ARIA feedback intelligence.
// CHR 2015 Reg 44, SCCIF Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle, ChevronRight, AlertTriangle, Brain,
  Clock, UserCheck, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVisitorsIntelligence } from "@/hooks/use-visitors-intelligence";

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

export function VisitorFeedbackCollectionCard() {
  const { data, isLoading } = useVisitorsIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-brand" />
            Visitor Feedback
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
  const familyRate =
    o.total_visits > 0
      ? Math.round((o.family_visits / o.total_visits) * 100)
      : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-brand" />
            Visitor Feedback
          </CardTitle>
          <Link href="/visitors" className="text-xs text-brand hover:underline flex items-center gap-1">
            Visitors <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.visits_last_30_days}
            </p>
            <p className="text-[10px] text-muted-foreground">Last 30d</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.dbs_compliance_rate === 100 ? "bg-green-50" : o.dbs_compliance_rate >= 90 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.dbs_compliance_rate === 100 ? "text-green-600" : o.dbs_compliance_rate >= 90 ? "text-amber-600" : "text-red-600",
            )}>
              {o.dbs_compliance_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">DBS</p>
          </div>
          <div className="text-center rounded-lg bg-emerald-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-emerald-600">
              {familyRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Family</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.unique_visitors}
            </p>
            <p className="text-[10px] text-muted-foreground">Unique</p>
          </div>
        </div>

        {/* ── Category breakdown ───────────────────────────────────────── */}

        {intel.category_breakdown.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Category Breakdown</p>
            <div className="space-y-1">
              {intel.category_breakdown.slice(0, 5).map((cat) => (
                <div key={cat.category} className="flex items-center gap-2 text-xs">
                  <span className="w-28 text-muted-foreground truncate">{cat.category_label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-400" style={{ width: `${cat.pct}%` }} />
                  </div>
                  <span className="w-10 text-right tabular-nums font-medium">{cat.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recent visitors ──────────────────────────────────────────── */}

        {intel.recent_visitors.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Recent Visitors
            </p>
            {intel.recent_visitors.slice(0, 5).map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <UserCheck className="h-3 w-3 text-blue-500 shrink-0" />
                  <span className="font-medium truncate">{v.visitor_name}</span>
                  <span className="text-muted-foreground truncate">
                    {v.category_label}
                    {(v.children_seen_names?.length ?? 0) > 0 && ` · ${(v.children_seen_names ?? []).join(", ")}`}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {new Date(v.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Feedback Alerts
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

        {/* ── ARIA insights ────────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Feedback Intelligence
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
