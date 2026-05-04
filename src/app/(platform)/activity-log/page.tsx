"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ACTIVITY LOG
// Home-wide timeline of all events: incidents, daily logs, medication,
// tasks, handovers, shifts, safeguarding. Searchable, filterable, exportable.
// Provides real-time awareness and a full audit trail for regulatory evidence.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { useActivityFeed, type FeedItem } from "@/hooks/use-activity-feed";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  Search, Filter, ArrowUpDown, X, RefreshCw, Loader2,
  AlertTriangle, CheckSquare, BookOpen, Pill, ArrowRightLeft,
  Shield, GraduationCap, FileText, Clock, ClipboardCheck,
  AlertOctagon, Info, ChevronRight, Activity, Eye,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<FeedItem["type"], { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  incident:     { label: "Incident",     icon: AlertTriangle,  color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200"     },
  task:         { label: "Task",         icon: CheckSquare,    color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200"    },
  daily_log:    { label: "Daily Log",    icon: BookOpen,       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  medication:   { label: "Medication",   icon: Pill,           color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200"  },
  handover:     { label: "Handover",     icon: ArrowRightLeft, color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
  safeguarding: { label: "Safeguarding", icon: Shield,         color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200"    },
  training:     { label: "Training",     icon: GraduationCap,  color: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-200"     },
  document:     { label: "Document",     icon: FileText,       color: "text-slate-700",   bg: "bg-slate-50",   border: "border-slate-200"   },
  shift:        { label: "Shift",        icon: Clock,          color: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200"  },
  form:         { label: "Form",         icon: ClipboardCheck, color: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-200"    },
};

const SEVERITY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  critical: { label: "Critical", icon: AlertOctagon,  color: "text-red-700",    bg: "bg-red-100",    border: "border-red-300"    },
  high:     { label: "High",     icon: AlertTriangle, color: "text-orange-700", bg: "bg-orange-50",  border: "border-orange-200" },
  medium:   { label: "Medium",   icon: Info,          color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200"  },
  low:      { label: "Low",      icon: Info,          color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200"   },
  info:     { label: "Info",     icon: Info,          color: "text-slate-500",  bg: "bg-slate-50",   border: "border-slate-200"  },
};

// ── Export Columns ────────────────────────────────────────────────────────────

const FEED_EXPORT_COLS: ExportColumn<FeedItem>[] = [
  { header: "Time",        accessor: (r) => r.timestamp },
  { header: "Type",        accessor: (r) => TYPE_CONFIG[r.type]?.label ?? r.type },
  { header: "Action",      accessor: (r) => r.action },
  { header: "Title",       accessor: (r) => r.title },
  { header: "Description", accessor: (r) => r.description },
  { header: "Severity",    accessor: (r) => r.severity ?? "info" },
  { header: "Staff",       accessor: (r) => r.actor_id ? getStaffName(r.actor_id) : "" },
  { header: "Young Person",accessor: (r) => r.child_id ? getYPName(r.child_id) : "" },
  { header: "Link",        accessor: (r) => r.href },
];

// ── Feed Item Row ────────────────────────────────────────────────────────────

function FeedRow({ item }: { item: FeedItem }) {
  const tc = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.daily_log;
  const sc = SEVERITY_CONFIG[item.severity ?? "info"];
  const TypeIcon = tc.icon;

  // Format timestamp for display
  const ts = item.timestamp;
  const datePart = ts.slice(0, 10);
  const timePart = ts.includes("T") ? ts.split("T")[1]?.slice(0, 5) : "";
  const today = new Date().toISOString().slice(0, 10);
  const isToday = datePart === today;

  return (
    <Link href={item.href} className="block">
      <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group border-b border-slate-50 last:border-0">
        {/* Timeline dot + type icon */}
        <div className="flex flex-col items-center pt-0.5">
          <div className={cn("rounded-md p-1.5 border", tc.bg, tc.border)}>
            <TypeIcon className={cn("h-3.5 w-3.5", tc.color)} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-xs font-semibold text-slate-900">{item.action}</span>
            {item.severity && item.severity !== "info" && (
              <Badge className={cn("text-[9px] px-1.5 py-0 border", sc.bg, sc.color, sc.border)}>
                {sc.label}
              </Badge>
            )}
            <Badge className={cn("text-[9px] px-1.5 py-0 border", tc.bg, tc.color, tc.border)}>
              {tc.label}
            </Badge>
          </div>
          <p className="text-xs text-slate-700 font-medium">{item.title}</p>
          {item.description && (
            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
            <span className="font-medium">
              {isToday ? `Today ${timePart}` : `${formatDate(datePart)} ${timePart}`}
            </span>
            {item.actor_id && (
              <span className="flex items-center gap-0.5">
                <Eye className="h-2.5 w-2.5" />
                {getStaffName(item.actor_id)}
              </span>
            )}
            {item.child_id && (
              <span className="flex items-center gap-0.5">
                <Activity className="h-2.5 w-2.5" />
                {getYPName(item.child_id)}
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="h-4 w-4 text-slate-300 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    </Link>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ActivityLogPage() {
  const { data: res, isLoading, refetch } = useActivityFeed();
  const feed = res?.data ?? [];

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FeedItem["type"] | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("time_desc");

  // Available types from data
  const availableTypes = useMemo(() => {
    const types = new Set(feed.map((f) => f.type));
    return Array.from(types).sort();
  }, [feed]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = [...feed];

    if (typeFilter !== "all") {
      list = list.filter((f) => f.type === typeFilter);
    }

    if (severityFilter !== "all") {
      list = list.filter((f) => (f.severity ?? "info") === severityFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.action.toLowerCase().includes(q) ||
          (f.actor_id && getStaffName(f.actor_id).toLowerCase().includes(q)) ||
          (f.child_id && getYPName(f.child_id).toLowerCase().includes(q))
      );
    }

    switch (sortBy) {
      case "time_asc":
        list.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        break;
      case "severity":
        const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        list.sort((a, b) => (SEV_ORDER[a.severity ?? "info"] ?? 4) - (SEV_ORDER[b.severity ?? "info"] ?? 4));
        break;
      case "type":
        list.sort((a, b) => a.type.localeCompare(b.type));
        break;
      default: // time_desc
        list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }

    return list;
  }, [feed, typeFilter, severityFilter, search, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const critical = feed.filter((f) => f.severity === "critical").length;
    const high = feed.filter((f) => f.severity === "high").length;
    const incidents = feed.filter((f) => f.type === "incident").length;
    const tasks = feed.filter((f) => f.type === "task").length;
    const logs = feed.filter((f) => f.type === "daily_log").length;
    return { total: feed.length, critical, high, incidents, tasks, logs };
  }, [feed]);

  const hasFilters = search || typeFilter !== "all" || severityFilter !== "all";

  if (isLoading) {
    return (
      <PageShell title="Activity Log" subtitle="Home-wide event timeline">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-2 text-sm text-slate-400">Loading activity feed…</span>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Activity Log"
      subtitle="Home-wide event timeline — real-time awareness and audit trail"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
          <ExportButton data={filtered} columns={FEED_EXPORT_COLS} filename="activity-log" />
          <PrintButton title="Activity Log" subtitle="Oak House — Event Timeline" />
        </div>
      }
    >
      {/* ── Summary stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Events",  value: stats.total,     color: "text-slate-700",   bg: "bg-slate-50",   border: "border-slate-200"  },
          { label: "Critical",      value: stats.critical,  color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200"    },
          { label: "High",          value: stats.high,      color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200" },
          { label: "Incidents",     value: stats.incidents, color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200"    },
          { label: "Tasks",         value: stats.tasks,     color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200"   },
          { label: "Daily Logs",    value: stats.logs,      color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200"},
        ].map((s) => (
          <div key={s.label} className={cn("rounded-lg border p-3 text-center", s.bg, s.border)}>
            <div className={cn("text-xl font-bold", s.color)}>{s.value}</div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Alert banner for critical ─────────────────────────────────────── */}
      {stats.critical > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 mb-6 flex items-start gap-3">
          <AlertOctagon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              {stats.critical} critical event{stats.critical !== 1 ? "s" : ""} in the feed
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              Review critical items immediately — these may require urgent action.
            </p>
          </div>
        </div>
      )}

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Filter className="h-3.5 w-3.5" />
        </div>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as FeedItem["type"] | "all")}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {availableTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_CONFIG[t as FeedItem["type"]]?.label ?? t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time_desc">Newest first</SelectItem>
              <SelectItem value="time_asc">Oldest first</SelectItem>
              <SelectItem value="severity">Severity</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-slate-500"
            onClick={() => { setSearch(""); setTypeFilter("all"); setSeverityFilter("all"); }}
          >
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* ── Type chips ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {availableTypes.map((t) => {
          const tc = TYPE_CONFIG[t as FeedItem["type"]];
          if (!tc) return null;
          const count = feed.filter((f) => f.type === t).length;
          const isActive = typeFilter === t;
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(isActive ? "all" : t as FeedItem["type"])}
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium border transition-colors",
                isActive
                  ? `${tc.bg} ${tc.color} ${tc.border} ring-1 ring-offset-1 ${tc.border}`
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <tc.icon className="h-3 w-3" />
              {tc.label}
              <span className="ml-0.5 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Feed List ─────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Activity className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No events found</p>
          <p className="text-xs mt-1">
            {hasFilters ? "Try adjusting your filters" : "No events in the activity feed"}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white divide-y divide-slate-50">
          {filtered.map((item) => (
            <FeedRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Footer count */}
      <div className="text-center text-[10px] text-slate-400 mt-6">
        Showing {filtered.length} of {stats.total} event{stats.total !== 1 ? "s" : ""} · Live refresh every 30s
      </div>

      {/* ── Regulatory Note ───────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-slate-50 border border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <Activity className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-1">About the Activity Log</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              The activity log provides a single, time-ordered view of all events across the home. It aggregates
              incidents, daily log entries, medication administrations, task updates, handovers, shifts, and
              safeguarding events. This audit trail supports Regulation 37 (Record Keeping) of the Children&apos;s
              Homes Regulations 2015 and provides management oversight evidence for Ofsted inspection under
              the Social Care Common Inspection Framework (SCCIF).
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
