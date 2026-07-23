"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — NOTIFIABLE EVENTS INTELLIGENCE CARD
// Dashboard card powered by the Notifiable Events Intelligence Engine.
// Reg 40 (notifiable events), SCCIF Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell, ChevronRight, AlertTriangle, CheckCircle2,
  Brain, Clock, Send, ShieldAlert, Loader2, FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useNotifiableEventsIntelligence } from "@/hooks/use-notifiable-events-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  high:     "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  medium:   "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  low:      "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning:  "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  notified_within_24h: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle2 },
  notified_late:       { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
  pending:             { bg: "bg-red-100", text: "text-red-700", icon: Clock },
  not_required:        { bg: "bg-gray-100", text: "text-gray-700", icon: Send },
};

// ── Component ───────────────────────────────────────────────────────────────

export function NotifiableEventsCard() {
  const { data, isLoading } = useNotifiableEventsIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="h-4 w-4 text-brand" />
            Notifiable Events (Reg 40)
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
            <Bell className="h-4 w-4 text-brand" />
            Notifiable Events (Reg 40)
          </CardTitle>
          <Link href="/notifiable-events" className="text-xs text-brand hover:underline flex items-center gap-1">
            Events <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.total_events}
            </p>
            <p className="text-[10px] text-muted-foreground">Events</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.compliance_rate === null ? "bg-muted" : meets(o.compliance_rate, 100) ? "bg-green-50" : meets(o.compliance_rate, 80) ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.compliance_rate === null ? "text-muted-foreground" : meets(o.compliance_rate, 100) ? "text-[--cs-success]" : meets(o.compliance_rate, 80) ? "text-[--cs-warning]" : "text-[--cs-risk]",
            )}>
              {formatRate(o.compliance_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {o.compliance_rate === null ? "None recorded" : "Compliant"}
            </p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.pending === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.pending === 0 ? "text-[--cs-success]" : "text-[--cs-risk]",
            )}>
              {o.pending}
            </p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-slate-600">
              {o.events_last_30_days}
            </p>
            <p className="text-[10px] text-muted-foreground">Last 30d</p>
          </div>
        </div>

        {/* ── Recent events ────────────────────────────────────────────── */}

        {intel.recent_events.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              Recent Events
            </p>
            {intel.recent_events.slice(0, 4).map((event) => {
              const style = STATUS_STYLES[event.ofsted_status] ?? STATUS_STYLES.pending;
              const Icon = style.icon;
              return (
                <div key={event.id} className="rounded-lg border p-2.5 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate">{event.type_label}</span>
                    {event.child_name && (
                      <span className="text-muted-foreground">— {event.child_name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge className={cn("text-[10px]", style.bg, style.text)}>
                      <Icon className="h-2.5 w-2.5 mr-0.5" />
                      {event.ofsted_status === "notified_within_24h" ? "Sent" :
                       event.ofsted_status === "notified_late" ? "Late" :
                       event.ofsted_status === "pending" ? "Pending" : "N/A"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Event type breakdown ──────────────────────────────────────── */}

        {intel.event_types.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">Event Types</p>
            <div className="space-y-1">
              {intel.event_types.slice(0, 5).map((et) => (
                <div key={et.event_type} className="flex items-center gap-2 text-xs">
                  <span className="w-36 text-muted-foreground truncate">{et.type_label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-400" style={{ width: `${et.pct}%` }} />
                  </div>
                  <span className="w-6 text-right tabular-nums font-medium">{et.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Per-child breakdown ──────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              Per Child
            </p>
            {intel.child_profiles.slice(0, 4).map((c) => (
              <div key={c.child_id} className="rounded-lg border p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.child_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-slate-600">{c.total_events} events</span>
                    {c.pending_notifications > 0 && (
                      <Badge className="text-[10px] bg-[--cs-risk-bg] text-[--cs-risk]">
                        {c.pending_notifications} pending
                      </Badge>
                    )}
                  </div>
                </div>
                {(c.risk_flags?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(c.risk_flags ?? []).slice(0, 3).map((flag, i) => (
                      <Badge key={i} className="text-[9px] bg-[--cs-risk-bg] text-[--cs-risk]">
                        <FileWarning className="h-2.5 w-2.5 mr-0.5" />
                        {flag.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Key metrics ──────────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.unique_children_involved}</p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.unique_staff_reporting}</p>
            <p className="text-[10px] text-muted-foreground">Staff Reporting</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.events_last_90_days}</p>
            <p className="text-[10px] text-muted-foreground">Last 90d</p>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Notification Alerts
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

        {/* ── Cara Notification Intelligence ──────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Notification Intelligence
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
