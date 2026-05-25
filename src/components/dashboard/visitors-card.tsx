"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — VISITORS LOG INTELLIGENCE CARD
// Dashboard card powered by the Visitors Intelligence Engine.
// Reg 12 (contact), Reg 22 (contact), Reg 44 (independent visits), SCCIF.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DoorOpen, ChevronRight, AlertTriangle, CheckCircle2,
  Brain, Shield, Clock, UserCheck, Loader2,
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

export function VisitorsCard() {
  const { data, isLoading } = useVisitorsIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <DoorOpen className="h-4 w-4 text-brand" />
            Visitors Log
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
            <DoorOpen className="h-4 w-4 text-brand" />
            Visitors Log
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
          <div className="text-center rounded-lg bg-green-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-green-600">
              {o.professional_visits}
            </p>
            <p className="text-[10px] text-muted-foreground">Professional</p>
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
            <p className="text-[10px] text-muted-foreground">DBS Check</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.currently_signed_in === 0 ? "bg-green-50" : "bg-blue-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.currently_signed_in === 0 ? "text-green-600" : "text-blue-600",
            )}>
              {o.currently_signed_in}
            </p>
            <p className="text-[10px] text-muted-foreground">Signed In</p>
          </div>
        </div>

        {/* ── Recent visitors ──────────────────────────────────────────── */}

        {intel.recent_visitors.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Recent Visitors
            </p>
            {intel.recent_visitors.slice(0, 4).map((v) => (
              <div key={v.id} className="rounded-lg border p-2.5 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium truncate">{v.visitor_name}</span>
                  <span className="text-muted-foreground">{v.category_label}</span>
                  {v.children_seen_names.length > 0 && (
                    <span className="text-muted-foreground truncate">
                      → {v.children_seen_names.join(", ")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {v.status === "signed_out" ? (
                    <Badge className="text-[10px] bg-green-100 text-green-700">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                      Out
                    </Badge>
                  ) : (
                    <Badge className="text-[10px] bg-blue-100 text-blue-700">
                      <UserCheck className="h-2.5 w-2.5 mr-0.5" />
                      In
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Category breakdown ───────────────────────────────────────── */}

        {intel.category_breakdown.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">Visitor Types</p>
            <div className="space-y-1">
              {intel.category_breakdown.slice(0, 5).map((cat) => (
                <div key={cat.category} className="flex items-center gap-2 text-xs">
                  <span className="w-28 text-muted-foreground truncate">{cat.category_label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-400" style={{ width: `${cat.pct}%` }} />
                  </div>
                  <span className="w-6 text-right tabular-nums font-medium">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Per-child contact ─────────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Child Contact
            </p>
            {intel.child_profiles.slice(0, 4).map((c) => (
              <div key={c.child_id} className="rounded-lg border p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.child_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-slate-600">{c.total_visits} visits</span>
                    <span className="text-green-600 tabular-nums">{c.professional_visits}P</span>
                    <span className="text-blue-600 tabular-nums">{c.family_visits}F</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Key metrics ──────────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.unique_visitors}</p>
            <p className="text-[10px] text-muted-foreground">Unique Visitors</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.family_visits}</p>
            <p className="text-[10px] text-muted-foreground">Family Visits</p>
          </div>
          <div>
            <p className={cn(
              "font-bold tabular-nums",
              o.id_compliance_rate === 100 ? "text-green-600" : "text-amber-600",
            )}>
              {o.id_compliance_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">ID Verified</p>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Visitor Alerts
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

        {/* ── ARIA Visitor Intelligence ───────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Visitor Intelligence
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
