"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — NOTIFICATIONS & ALERTS CENTRE
// Central hub for all system notifications: overdue tasks, expiring
// documents, review dates, compliance deadlines, and regulatory alerts.
// Supports Reg 22 (Notification of Events) and overall governance.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatDate, todayStr } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  Search, ArrowUpDown, X, Bell, BellRing,
  CheckCircle2, AlertTriangle, Clock, Calendar,
  Shield, FileText, User, Pill, Flame,
  GraduationCap, Heart, Eye,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type NotificationType = "overdue_task" | "expiring_document" | "review_due" | "compliance_deadline" | "health_alert" | "training_expiry" | "incident_followup" | "medication_review" | "placement_review" | "fire_drill_due" | "system";
type Severity = "critical" | "high" | "medium" | "low" | "info";
type NotifStatus = "unread" | "read" | "actioned" | "dismissed";

interface Notification {
  id: string;
  type: NotificationType;
  severity: Severity;
  status: NotifStatus;
  title: string;
  description: string;
  link: string | null;
  related_child: string | null;
  related_staff: string | null;
  due_date: string | null;
  created_at: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, { label: string; icon: React.ElementType }> = {
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

const SEVERITY_CONFIG: Record<Severity, { label: string; colour: string }> = {
  critical: { label: "Critical", colour: "bg-red-100 text-red-700 border-red-200"     },
  high:     { label: "High",     colour: "bg-orange-100 text-orange-700 border-orange-200" },
  medium:   { label: "Medium",   colour: "bg-amber-100 text-amber-700 border-amber-200"   },
  low:      { label: "Low",      colour: "bg-blue-100 text-blue-700 border-blue-200"      },
  info:     { label: "Info",     colour: "bg-gray-100 text-gray-600 border-gray-200"      },
};

// ── Seed Data ─────────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10);
};

const SEED: Notification[] = [
  { id: "n_001", type: "incident_followup", severity: "critical", status: "unread", title: "Safeguarding disclosure — Alex — oversight incomplete", description: "Incident INC-2026-0043 (safeguarding disclosure) has no management oversight. This was flagged 2 days ago and requires RM oversight comments.", link: "/incidents", related_child: "yp_alex", related_staff: null, due_date: d(-1), created_at: d(-1) + "T09:00:00Z" },
  { id: "n_002", type: "overdue_task", severity: "high", status: "unread", title: "Safeguarding log oversight — 2 entries pending", description: "Task TASK-002: Two safeguarding entries need RM oversight. Originally due yesterday.", link: "/tasks", related_child: "yp_alex", related_staff: "staff_darren", due_date: d(-1), created_at: d(-1) + "T08:00:00Z" },
  { id: "n_003", type: "compliance_deadline", severity: "high", status: "unread", title: "Ofsted monitoring visit — 2 weeks", description: "Confirmed Ofsted monitoring visit in 2 weeks. Preparation plan, documentation audit, and staff briefing required.", link: "/inspection", related_child: null, related_staff: null, due_date: d(14), created_at: d(-7) + "T09:00:00Z" },
  { id: "n_004", type: "placement_review", severity: "medium", status: "unread", title: "Alex's placement plan review overdue", description: "Placement plan objectives for Alex were due for review and have not been updated. Multiple objectives showing 'at risk' or 'some progress.'", link: "/placement-plan", related_child: "yp_alex", related_staff: null, due_date: d(-3), created_at: d(-3) + "T09:00:00Z" },
  { id: "n_005", type: "training_expiry", severity: "medium", status: "read", title: "Team Teach certificates — update training matrix", description: "5 staff completed Team Teach refresher. Certificates received — need to be filed and training matrix updated.", link: "/training", related_child: null, related_staff: null, due_date: d(7), created_at: d(0) + "T08:30:00Z" },
  { id: "n_006", type: "medication_review", severity: "medium", status: "read", title: "Casey's medication review — GP follow-up in 3 months", description: "Casey's medication dosage was reviewed — no change. Follow-up appointment due in 3 months. Calendar reminder set.", link: "/medication", related_child: "yp_casey", related_staff: null, due_date: d(90), created_at: d(-2) + "T09:00:00Z" },
  { id: "n_007", type: "health_alert", severity: "medium", status: "unread", title: "Casey's new glasses — collection due", description: "Casey's new glasses were ordered 7 days ago. Should be ready for collection. Follow up with Specsavers.", link: "/appointments", related_child: "yp_casey", related_staff: null, due_date: d(3), created_at: d(-1) + "T09:00:00Z" },
  { id: "n_008", type: "review_due", severity: "low", status: "read", title: "Reg 44 recommendations — 3 actions due in 25 days", description: "Three recommendations from the March Reg 44 visit need to be actioned within 28 days: fire drill log, medication storage, visitor signage.", link: "/ri/reg44", related_child: null, related_staff: null, due_date: d(25), created_at: d(-3) + "T10:00:00Z" },
  { id: "n_009", type: "fire_drill_due", severity: "low", status: "actioned", title: "Quarterly fire drill completed", description: "Fire drill conducted on schedule. Result: satisfactory. Next drill due in 83 days.", link: "/fire-drills", related_child: null, related_staff: null, due_date: d(83), created_at: d(-7) + "T10:30:00Z" },
  { id: "n_010", type: "system", severity: "info", status: "read", title: "Monthly placement summary sent to social workers", description: "Monthly placement summaries for all 3 children have been emailed to their allocated social workers.", link: "/correspondence", related_child: null, related_staff: null, due_date: null, created_at: d(-1) + "T13:00:00Z" },
  { id: "n_011", type: "expiring_document", severity: "medium", status: "unread", title: "DBS certificate expiring — Lackson Phiri", description: "Lackson Phiri's enhanced DBS certificate expires in 45 days. Renewal process should begin now.", link: "/recruitment/safer-recruitment/dbs", related_child: null, related_staff: "staff_lackson", due_date: d(45), created_at: d(-2) + "T09:00:00Z" },
  { id: "n_012", type: "overdue_task", severity: "high", status: "unread", title: "Medication audit — MAR sheet discrepancies", description: "Task TASK-004: March MAR audit found two medication events. Urgent review by deputy manager.", link: "/tasks", related_child: "yp_casey", related_staff: "staff_ryan", due_date: d(-1), created_at: d(-2) + "T09:00:00Z" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { currentUser } = useAuthContext();

  const [entries, setEntries] = useState<Notification[]>(SEED);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [tab, setTab] = useState<"all" | "unread" | "actioned">("all");

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
          const so: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
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

  const markRead = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id && e.status === "unread" ? { ...e, status: "read" as NotifStatus } : e));
  };
  const markActioned = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: "actioned" as NotifStatus } : e));
  };
  const dismiss = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: "dismissed" as NotifStatus } : e));
  };

  const exportCols: ExportColumn<Notification>[] = [
    { header: "ID", accessor: r => r.id },
    { header: "Type", accessor: r => TYPE_CONFIG[r.type].label },
    { header: "Severity", accessor: r => SEVERITY_CONFIG[r.severity].label },
    { header: "Status", accessor: r => r.status },
    { header: "Title", accessor: r => r.title },
    { header: "Description", accessor: r => r.description },
    { header: "Child", accessor: r => r.related_child ? getYPName(r.related_child) : "" },
    { header: "Due Date", accessor: r => r.due_date || "" },
    { header: "Created", accessor: r => r.created_at.slice(0, 10) },
  ];

  return (
    <PageShell
      title="Notifications & Alerts"
      subtitle="System alerts, deadlines, and action items"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Notifications" subtitle="Oak House — Alerts Centre" />
          <ExportButton data={filtered} columns={exportCols} filename="notifications" />
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
            {(Object.entries(SEVERITY_CONFIG) as [Severity, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.entries(TYPE_CONFIG) as [NotificationType, { label: string }][]).map(([k, v]) => (
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

        {filtered.map(n => {
          const tc = TYPE_CONFIG[n.type];
          const sc = SEVERITY_CONFIG[n.severity];
          const Icon = tc.icon;
          const isOverdue = n.due_date && n.due_date < todayStr() && n.status !== "actioned";

          return (
            <div key={n.id} className={cn(
              "rounded-lg border p-3 flex items-start gap-3 transition-colors",
              n.status === "unread" ? "bg-card border-l-4" : "bg-muted/30",
              n.status === "unread" && n.severity === "critical" && "border-l-red-500",
              n.status === "unread" && n.severity === "high" && "border-l-orange-500",
              n.status === "unread" && n.severity === "medium" && "border-l-amber-500",
              n.status === "unread" && n.severity === "low" && "border-l-blue-500",
              n.status === "unread" && n.severity === "info" && "border-l-gray-400",
              n.status === "actioned" && "opacity-60",
            )}>
              <div className={cn("rounded-full p-1.5 shrink-0 mt-0.5", sc.colour)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className={cn("font-medium text-sm", n.status === "actioned" && "line-through")}>{n.title}</span>
                  <Badge variant="outline" className={cn("text-xs", sc.colour)}>{sc.label}</Badge>
                  {n.status === "unread" && <Badge className="text-xs bg-blue-600 text-white">New</Badge>}
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
                {n.status === "unread" && (
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => markRead(n.id)}>
                    Read
                  </Button>
                )}
                {n.status !== "actioned" && (
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => markActioned(n.id)}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                {n.status !== "dismissed" && n.status !== "actioned" && (
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => dismiss(n.id)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
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
    </PageShell>
  );
}
