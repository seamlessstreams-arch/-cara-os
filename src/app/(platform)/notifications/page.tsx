"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatDate, todayStr } from "@/lib/utils";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useAlertNotifications } from "@/hooks/use-alert-notifications";
import { useNotifications, useMarkNotificationRead } from "@/hooks/use-notifications";
import { useAuthContext } from "@/contexts/auth-context";
import type {
  AlertNotification,
  AlertNotificationType,
  AlertSeverity,
  AlertStatus,
  Notification,
} from "@/types/extended";
import {
  ALERT_NOTIFICATION_TYPE_LABEL,
  ALERT_SEVERITY_LABEL,
} from "@/types/extended";
import {
  Search, ArrowUpDown, X, Bell, BellRing,
  CheckCircle2, AlertTriangle, Clock, Calendar,
  Shield, FileText, User, Pill, Flame,
  GraduationCap, Heart, Eye, Loader2, Zap,
  ExternalLink,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AlertNotificationType, { label: string; icon: React.ElementType }> = {
  overdue_task:         { label: "Overdue Task",         icon: Clock          },
  expiring_document:    { label: "Expiring Document",    icon: FileText       },
  review_due:           { label: "Review Due",           icon: Calendar       },
  compliance_deadline:  { label: "Compliance Deadline",  icon: Shield         },
  health_alert:         { label: "Health Alert",         icon: Heart          },
  training_expiry:      { label: "Training Expiry",      icon: GraduationCap  },
  incident_followup:    { label: "Incident Follow-up",   icon: AlertTriangle  },
  medication_review:    { label: "Medication Review",    icon: Pill           },
  placement_review:     { label: "Placement Review",     icon: Eye            },
  fire_drill_due:       { label: "Fire Drill Due",       icon: Flame          },
  system:               { label: "System",               icon: Bell           },
};

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; colour: string }> = {
  critical: { label: "Critical", colour: "bg-red-100 text-red-700 border-red-200"     },
  high:     { label: "High",     colour: "bg-orange-100 text-orange-700 border-orange-200" },
  medium:   { label: "Medium",   colour: "bg-amber-100 text-amber-700 border-amber-200"   },
  low:      { label: "Low",      colour: "bg-blue-100 text-blue-700 border-blue-200"      },
  info:     { label: "Info",     colour: "bg-gray-100 text-gray-600 border-gray-200"      },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { currentUser } = useAuthContext();
  const { data: records = [], isLoading } = useAlertNotifications();
  const { data: careEventNotifs = [] } = useNotifications({ recipientId: currentUser?.id });
  const markRead = useMarkNotificationRead();

  const PRIORITY_COLOUR: Record<Notification["priority"], string> = {
    urgent: "bg-red-100 text-red-700 border-red-200",
    high:   "bg-orange-100 text-orange-700 border-orange-200",
    normal: "bg-blue-100 text-blue-700 border-blue-200",
    low:    "bg-slate-100 text-slate-600 border-slate-200",
  };

  const unreadCareEventNotifs = careEventNotifs.filter((n) => !n.read);

  const [localStatuses, setLocalStatuses] = useState<Record<string, AlertStatus>>({});
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [tab, setTab] = useState<"all" | "unread" | "actioned">("all");

  const entries = useMemo(() =>
    records.map((r) => ({ ...r, status: localStatuses[r.id] ?? r.status })),
    [records, localStatuses]
  );

  const filtered = useMemo(() => {
    let list = [...entries];
    if (tab === "unread") list = list.filter(e => e.status === "unread");
    if (tab === "actioned") list = list.filter(e => e.status === "actioned");
    if (severityFilter !== "all") list = list.filter(e => e.severity === severityFilter);
    if (typeFilter !== "all") list = list.filter(e => e.type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.created_at.localeCompare(a.created_at);
        case "oldest": return a.created_at.localeCompare(b.created_at);
        case "severity": {
          const so: Record<AlertSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
          return so[a.severity] - so[b.severity];
        }
        default: return 0;
      }
    });
    return list;
  }, [entries, search, severityFilter, typeFilter, sortBy, tab]);

  const stats = useMemo(() => ({
    total: entries.length,
    unread: entries.filter(e => e.status === "unread").length,
    critical: entries.filter(e => e.severity === "critical" && e.status !== "actioned").length,
    overdue: entries.filter(e => e.due_date && e.due_date < todayStr() && e.status !== "actioned").length,
    actioned: entries.filter(e => e.status === "actioned").length,
  }), [entries]);

  // Progressive disclosure — cap both notification lists so a year-two home
  // doesn't render every accumulated alert at once. Tabs/stats/export keep the
  // full lists; only rendering is capped.
  const [visibleCount, setVisibleCount] = useState(50);
  const [visibleCareEventCount, setVisibleCareEventCount] = useState(50);
  useEffect(() => {
    setVisibleCount(50);
  }, [tab, search, severityFilter, typeFilter, sortBy]);

  const setStatus = (id: string, status: AlertStatus) => {
    setLocalStatuses((prev) => ({ ...prev, [id]: status }));
  };

  const exportCols: ExportColumn<AlertNotification>[] = [
    { header: "ID", accessor: r => r.id },
    { header: "Type", accessor: r => TYPE_CONFIG[r.type]?.label ?? r.type },
    { header: "Severity", accessor: r => SEVERITY_CONFIG[r.severity]?.label ?? r.severity },
    { header: "Status", accessor: r => localStatuses[r.id] ?? r.status },
    { header: "Title", accessor: r => r.title },
    { header: "Description", accessor: r => r.description },
    { header: "Child", accessor: r => r.related_child ? getYPName(r.related_child) : "" },
    { header: "Due Date", accessor: r => r.due_date || "" },
    { header: "Created", accessor: r => r.created_at.slice(0, 10) },
  ];

  if (isLoading) {
    return (
      <PageShell title="Notifications & Alerts" subtitle="System alerts, deadlines, and action items">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Notifications & Alerts"
      subtitle="System alerts, deadlines, and action items"
      caraContext={{ pageTitle: "Notifications", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Notifications" />
          <ExportButton data={filtered} columns={exportCols} filename="notifications" />
          <CaraStudioQuickActionButton context={{ record_type: "task", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total",     value: stats.total, icon: Bell, c: "text-blue-600" },
          { label: "Unread",    value: stats.unread, icon: BellRing, c: "text-amber-600" },
          { label: "Critical",  value: stats.critical, icon: AlertTriangle, c: "text-red-600" },
          { label: "Overdue",   value: stats.overdue, icon: Clock, c: "text-orange-600" },
          { label: "Actioned",  value: stats.actioned, icon: CheckCircle2, c: "text-green-600" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border bg-card p-3 flex items-center gap-3">
            <s.icon className={cn("h-5 w-5", s.c)} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Care Event Alerts ──────────────────────────────────────────────── */}
      {unreadCareEventNotifs.length > 0 && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 mb-6 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-800">
              Care Event Alerts ({unreadCareEventNotifs.length} unread)
            </span>
          </div>
          {unreadCareEventNotifs.slice(0, visibleCareEventCount).map((n) => (
            <div
              key={n.id}
              className={cn(
                "rounded-lg border bg-white p-3 flex items-start justify-between gap-3",
                n.priority === "urgent" && "border-red-200",
                n.priority === "high" && "border-orange-200",
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-sm font-medium text-slate-900">{n.title}</span>
                  <Badge variant="outline" className={cn("text-[10px]", PRIORITY_COLOUR[n.priority])}>
                    {n.priority}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mb-1">{n.body}</p>
                <p className="text-[10px] text-slate-400">{formatDate(n.created_at.slice(0, 10))}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {n.action_url && (
                  <Link
                    href={n.action_url}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-100"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View
                  </Link>
                )}
                <Button
                  size="sm" variant="ghost" className="h-7 px-2 text-xs"
                  onClick={() => markRead.mutate(n.id)}
                  disabled={markRead.isPending}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Done
                </Button>
              </div>
            </div>
          ))}
          {unreadCareEventNotifs.length > visibleCareEventCount && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setVisibleCareEventCount((c) => c + 50)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cs-border)] bg-[var(--cs-surface-elevated,#fff)] px-4 py-2 text-[13px] font-semibold text-[var(--cs-text-secondary,#5a6d74)] shadow-[var(--cs-shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--cs-shadow-card)]"
              >
                Show more ({unreadCareEventNotifs.length - visibleCareEventCount} more)
              </button>
            </div>
          )}
        </div>
      )}

      {stats.critical > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 mb-6 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300">
            {stats.critical} critical alert{stats.critical !== 1 ? "s" : ""} requiring immediate attention.
          </p>
        </div>
      )}

      <div className="flex gap-1 mb-4 border-b">
        {([
          { key: "all", label: "All", count: entries.length },
          { key: "unread", label: "Unread", count: stats.unread },
          { key: "actioned", label: "Actioned", count: stats.actioned },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn(
            "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}>
            {t.label} <span className="text-xs ml-1 text-muted-foreground">({t.count})</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5"><X className="h-4 w-4 text-muted-foreground" /></button>}
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {(Object.entries(SEVERITY_CONFIG) as [AlertSeverity, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.entries(TYPE_CONFIG) as [AlertNotificationType, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="severity">By Severity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{filtered.length} notification{filtered.length !== 1 ? "s" : ""}</p>

      <div className="space-y-2" id="notifications-print">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No notifications</p>
          </div>
        )}

        {filtered.slice(0, visibleCount).map(n => {
          const tc = TYPE_CONFIG[n.type];
          const sc = SEVERITY_CONFIG[n.severity];
          const Icon = tc?.icon || Bell;
          const effectiveStatus = localStatuses[n.id] ?? n.status;
          const isOverdue = n.due_date && n.due_date < todayStr() && effectiveStatus !== "actioned";

          return (
            <div key={n.id} className={cn(
              "rounded-lg border p-3 flex items-start gap-3 transition-colors",
              effectiveStatus === "unread" ? "bg-card border-l-4" : "bg-muted/30",
              effectiveStatus === "unread" && n.severity === "critical" && "border-l-red-500",
              effectiveStatus === "unread" && n.severity === "high" && "border-l-orange-500",
              effectiveStatus === "unread" && n.severity === "medium" && "border-l-amber-500",
              effectiveStatus === "unread" && n.severity === "low" && "border-l-blue-500",
              effectiveStatus === "unread" && n.severity === "info" && "border-l-gray-400",
              effectiveStatus === "actioned" && "opacity-60",
            )}>
              <div className={cn("rounded-full p-1.5 shrink-0 mt-0.5", sc?.colour)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className={cn("font-medium text-sm", effectiveStatus === "actioned" && "line-through")}>{n.title}</span>
                  <Badge variant="outline" className={cn("text-xs", sc?.colour)}>{sc?.label}</Badge>
                  {effectiveStatus === "unread" && <Badge className="text-xs bg-blue-600 text-white">New</Badge>}
                  {isOverdue && <Badge variant="outline" className="text-xs bg-red-50 text-red-700">Overdue</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mb-1.5">{n.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatDate(n.created_at.slice(0, 10))}</span>
                  {n.related_child && <span>{getYPName(n.related_child)}</span>}
                  {n.due_date && <span>Due: {formatDate(n.due_date)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {effectiveStatus === "unread" && (
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setStatus(n.id, "read")}>
                    Read
                  </Button>
                )}
                {effectiveStatus !== "actioned" && (
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setStatus(n.id, "actioned")}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                {effectiveStatus !== "dismissed" && effectiveStatus !== "actioned" && (
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => setStatus(n.id, "dismissed")}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length > visibleCount && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + 50)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cs-border)] bg-[var(--cs-surface-elevated,#fff)] px-4 py-2 text-[13px] font-semibold text-[var(--cs-text-secondary,#5a6d74)] shadow-[var(--cs-shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--cs-shadow-card)]"
            >
              Show more ({filtered.length - visibleCount} more)
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-lg border border-dashed p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">Regulatory Context</p>
            <p>
              <strong>Regulation 22 (Notification of Events)</strong> requires the registered person to notify
              relevant authorities of significant events without delay. A centralised notification system ensures
              no deadlines are missed, statutory reviews are completed on time, and management oversight is
              maintained across all compliance areas.
            </p>
          </div>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={14}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Notifications — system alerts, task reminders, review deadlines, incident alerts, management notifications, regulatory deadlines, in-app notifications, action required"
        recordType="task"
        className="mt-6"
      />
    </PageShell>
  );
}
