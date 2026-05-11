"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Notifications Center  (Milestone 27)
//
// Live unified notifications stream derived from returned records (M23),
// sensitive amendments (M19), Reg 40 triages, manager review backlog and
// routing failures. Implements CLAUDE.md "notify relevant staff in-app".
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bell, ExternalLink, AlertTriangle, AlertCircle, Info } from "lucide-react";
import Link from "next/link";
import { useCareEventsNotifications } from "@/hooks/use-care-events-notifications";
import type {
  NotificationItem,
  NotificationSeverity,
  NotificationSource,
  NotificationAudience,
} from "@/lib/care-events/notifications";

const HOME_ID = "home_oak";

const SEVERITY_TONE: Record<NotificationSeverity, string> = {
  critical: "bg-rose-100 text-rose-800 border-rose-300",
  warning:  "bg-amber-100 text-amber-800 border-amber-300",
  info:     "bg-slate-100 text-slate-700 border-slate-300",
};

const SEVERITY_ICON: Record<NotificationSeverity, React.ComponentType<{ className?: string }>> = {
  critical: AlertTriangle,
  warning:  AlertCircle,
  info:     Info,
};

const SOURCE_LABEL: Record<NotificationSource, string> = {
  returned_record:         "Returned record",
  sensitive_amendment:     "Sensitive amendment",
  reg40_triage_pending:    "Reg 40 triage",
  manager_review_required: "Manager review",
  routing_failure:         "Routing failure",
};

const AUDIENCE_LABEL: Record<NotificationAudience, string> = {
  manager: "Manager",
  staff:   "Staff",
};

const SEVERITY_ORDER: NotificationSeverity[] = ["critical", "warning", "info"];

export default function NotificationsPage() {
  const { data, refetch, isFetching, isLoading } = useCareEventsNotifications(HOME_ID);
  const stream = data?.data;

  return (
    <PageShell
      title="Notifications"
      subtitle="Live alerts derived from the live engines. Critical first, then newest."
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {isLoading && <p className="text-sm text-slate-500">Loading notifications…</p>}

      {stream && (
        <div className="space-y-6">
          {/* Counters */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{stream.total}</p>
              </CardContent>
            </Card>
            {SEVERITY_ORDER.map((s) => (
              <Card key={s}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wide text-slate-500">{s}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{stream.by_severity[s]}</p>
                </CardContent>
              </Card>
            ))}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Audience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  <span className="font-semibold">{stream.for_managers}</span> manager
                  <span className="mx-1 text-slate-400">·</span>
                  <span className="font-semibold">{stream.for_staff}</span> staff
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Items */}
          {stream.items.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-slate-500">
                <Bell className="mx-auto mb-2 h-6 w-6" />
                No notifications. All clear.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {stream.items.map((n) => (
                <NotificationCard key={n.id} item={n} />
              ))}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}

function NotificationCard({ item }: { item: NotificationItem }) {
  const Icon = SEVERITY_ICON[item.severity];
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`border ${SEVERITY_TONE[item.severity]}`}>
            <Icon className="mr-1 h-3 w-3" />
            {item.severity}
          </Badge>
          <Badge variant="outline" className="text-xs">{SOURCE_LABEL[item.source]}</Badge>
          <Badge variant="outline" className="text-xs">{AUDIENCE_LABEL[item.audience]}</Badge>
          {item.target_staff_id && (
            <Badge variant="outline" className="text-xs">{item.target_staff_id}</Badge>
          )}
        </div>
        <CardTitle className="mt-2 text-base">{item.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-slate-700">{item.body}</p>
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-500">
            {new Date(item.created_at).toLocaleString()}
            {item.child_id && <> · {item.child_id}</>}
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href={item.link_href}>
              Open <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
