"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — PATTERN ALERTS
// Surfaces Cara-detected behavioural, staffing, and environmental patterns.
// Each pattern includes evidence refs, reflective prompts, severity, and a
// workflow for acknowledge → resolve/dismiss. Critical regulatory evidence
// that the home uses intelligence to proactively safeguard and improve care.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { FlatList, FlatListRow, FlatListRowDetail, type RowSeverity } from "@/components/ui/list-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatDate, todayStr } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import {
  usePatternAlerts,
  useAcknowledgePattern,
} from "@/hooks/use-intelligence";
import { getYPName, getStaffName } from "@/lib/seed-data";
import type { PatternAlert, PatternSeverity, PatternStatus } from "@/types/extended";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, AlertOctagon, Info, CheckCircle2, XCircle,
  Eye, Clock, Shield, Sparkles, Activity, Loader2,
  User, Calendar, FileText, Brain, Radar, TrendingUp,
  TrendingDown, Zap, BookOpen, RefreshCw, X,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

// ── Constants ──────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<PatternSeverity, { label: string; icon: React.ElementType; color: string; bg: string; border: string; ring: string }> = {
  critical: { label: "Critical",  icon: AlertOctagon,  color: "text-[--cs-risk]",    bg: "bg-[--cs-risk-bg]",     border: "border-[--cs-risk-soft]",    ring: "ring-[--cs-risk]"    },
  high:     { label: "High",      icon: AlertTriangle, color: "text-orange-700", bg: "bg-orange-50",  border: "border-orange-300", ring: "ring-orange-400" },
  medium:   { label: "Medium",    icon: Info,          color: "text-[--cs-warning]",  bg: "bg-[--cs-warning-bg]",   border: "border-[--cs-warning-soft]",  ring: "ring-[--cs-warning]"  },
  low:      { label: "Low",       icon: Info,          color: "text-[--cs-info]",   bg: "bg-[--cs-info-bg]",    border: "border-[--cs-info-soft]",   ring: "ring-[--cs-info]"   },
};

const STATUS_CONFIG: Record<PatternStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  active:       { label: "Active",       icon: Zap,           color: "text-[--cs-risk]",     bg: "bg-[--cs-risk-bg]",     border: "border-[--cs-risk-soft]"     },
  acknowledged: { label: "Acknowledged", icon: Eye,           color: "text-[--cs-warning]",   bg: "bg-[--cs-warning-bg]",   border: "border-[--cs-warning-soft]"   },
  resolved:     { label: "Resolved",     icon: CheckCircle2,  color: "text-[--cs-success]", bg: "bg-[--cs-success-bg]", border: "border-[--cs-success-soft]" },
  dismissed:    { label: "Dismissed",    icon: XCircle,       color: "text-[var(--cs-text-secondary)]",   bg: "bg-slate-50",   border: "border-[var(--cs-border)]"   },
};

const SEVERITY_ROW: Record<PatternSeverity, RowSeverity> = {
  critical: "risk", high: "risk", medium: "warning", low: "info",
};

const ALERT_TYPE_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  regulation_deterioration:      { label: "Dysregulation Pattern",       icon: Activity       },
  contact_linked_distress:       { label: "Contact-linked Distress",     icon: TrendingDown   },
  staffing_continuity_risk:      { label: "Staffing Continuity Risk",    icon: Shield         },
  education_achievement_milestone:{ label: "Education Achievement",      icon: TrendingUp     },
  behaviour_escalation:          { label: "Behaviour Escalation",        icon: AlertTriangle  },
  placement_stability:           { label: "Placement Stability",         icon: Radar          },
  health_concern:                { label: "Health Concern",              icon: Shield         },
  safeguarding_flag:             { label: "Safeguarding Flag",           icon: AlertOctagon   },
  positive_trajectory:           { label: "Positive Trajectory",         icon: TrendingUp     },
  sleep_pattern:                 { label: "Sleep Pattern",               icon: Clock          },
};

const EVIDENCE_TYPE_ICONS: Record<string, React.ElementType> = {
  incident:  AlertTriangle,
  daily_log: BookOpen,
  shift:     Clock,
  voice_record: Brain,
};

// ── Export Columns ────────────────────────────────────────────────────────────

const PATTERN_EXPORT_COLS: ExportColumn<PatternAlert>[] = [
  { header: "Title",            accessor: (r) => r.title },
  { header: "Type",             accessor: (r) => ALERT_TYPE_LABELS[r.alert_type]?.label ?? r.alert_type },
  { header: "Severity",         accessor: (r) => SEVERITY_CONFIG[r.severity]?.label ?? r.severity },
  { header: "Status",           accessor: (r) => STATUS_CONFIG[r.status]?.label ?? r.status },
  { header: "Young Person",     accessor: (r) => r.child_id ? getYPName(r.child_id) : "Home-wide" },
  { header: "Detected",         accessor: (r) => r.detected_at.slice(0, 10) },
  { header: "Period Start",     accessor: (r) => r.period_start },
  { header: "Period End",       accessor: (r) => r.period_end },
  { header: "Description",      accessor: (r) => r.description },
  { header: "Reflective Prompt",accessor: (r) => r.reflective_prompt },
  { header: "Acknowledged By",  accessor: (r) => r.acknowledged_by ? getStaffName(r.acknowledged_by) : "" },
  { header: "Acknowledged At",  accessor: (r) => r.acknowledged_at?.slice(0, 10) ?? "" },
  { header: "Resolved By",      accessor: (r) => r.resolved_by ? getStaffName(r.resolved_by) : "" },
  { header: "Resolved At",      accessor: (r) => r.resolved_at?.slice(0, 10) ?? "" },
  { header: "Evidence Count",   accessor: (r) => r.evidence_refs.length },
];

// ── Pattern Card ─────────────────────────────────────────────────────────────

function PatternCard({
  pattern,
  onAcknowledge,
  onResolve,
  onDismiss,
  busy,
}: {
  pattern: PatternAlert;
  onAcknowledge: () => void;
  onResolve: () => void;
  onDismiss: () => void;
  busy: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY_CONFIG[pattern.severity];
  const st = STATUS_CONFIG[pattern.status];
  const typeInfo = ALERT_TYPE_LABELS[pattern.alert_type] ?? { label: pattern.alert_type, icon: Radar };
  const TypeIcon = typeInfo.icon;
  const SevIcon = sev.icon;
  const StIcon = st.icon;

  const isPositive = pattern.alert_type === "education_achievement_milestone" || pattern.alert_type === "positive_trajectory";

  return (
    <div>
      {/* Header */}
      <FlatListRow severity={SEVERITY_ROW[pattern.severity]} onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className="items-start gap-3">
        {/* Severity indicator */}
        <SevIcon className={cn("mt-0.5 h-4 w-4 shrink-0", sev.color)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-[var(--cs-navy)]">{pattern.title}</h3>
            {isPositive && (
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[--cs-success]">✦ Positive</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-[11px] text-[var(--cs-text-muted)]">
            <span className="flex items-center gap-1">
              <TypeIcon className="h-3 w-3" />
              {typeInfo.label}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {pattern.child_id ? getYPName(pattern.child_id) : "Home-wide"}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(pattern.detected_at)}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-[10px]">
              {pattern.period_start} → {pattern.period_end}
            </span>
          </div>
        </div>

        {/* Status + Severity labels */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn("text-[11px] font-semibold uppercase tracking-wide", sev.color)}>{sev.label}</span>
          <span className={cn("flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide", st.color)}>
            <StIcon className="h-3 w-3" />
            {st.label}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" />
          )}
        </div>
      </FlatListRow>

      {/* Expanded body */}
      {expanded && (
        <FlatListRowDetail className="space-y-4">
          {/* Description */}
          <div>
            <h4 className="text-[11px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-1">Pattern Description</h4>
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{pattern.description}</p>
          </div>

          {/* Reflective Prompt */}
          <div className={cn("rounded-lg p-3 border", isPositive ? "bg-[--cs-success-bg] border-[--cs-success-soft]" : "bg-[var(--cs-cara-gold-bg)] border-[var(--cs-cara-gold-soft)]")}>
            <div className="flex items-center gap-2 mb-1.5">
              <Brain className={cn("h-4 w-4", isPositive ? "text-[--cs-success]" : "text-[var(--cs-cara-gold)]")} />
              <h4 className={cn("text-[11px] font-semibold uppercase tracking-wide", isPositive ? "text-[--cs-success]" : "text-[var(--cs-cara-gold)]")}>
                Reflective Prompt
              </h4>
            </div>
            <p className={cn("text-xs italic leading-relaxed", isPositive ? "text-[--cs-success]" : "text-[var(--cs-navy)]")}>
              &ldquo;{pattern.reflective_prompt}&rdquo;
            </p>
          </div>

          {/* Evidence References */}
          {pattern.evidence_refs.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2">
                Supporting Evidence ({pattern.evidence_refs.length})
              </h4>
              <div className="space-y-1.5">
                {pattern.evidence_refs.map((ev, i) => {
                  const EvidIcon = EVIDENCE_TYPE_ICONS[ev.type] ?? FileText;
                  return (
                    <div key={i} className="flex items-start gap-2 rounded-md bg-slate-50 border border-[var(--cs-border-subtle)] p-2.5">
                      <EvidIcon className="h-3.5 w-3.5 text-[var(--cs-text-muted)] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[10px] text-[var(--cs-text-muted)] mb-0.5">
                          <span className="capitalize font-medium">{ev.type.replace(/_/g, " ")}</span>
                          <span>·</span>
                          <span>{formatDate(ev.date)}</span>
                          <span className="text-[9px] text-[var(--cs-text-muted)] font-mono">{ev.id}</span>
                        </div>
                        <p className="text-xs text-[var(--cs-text-secondary)]">{ev.excerpt}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Acknowledgement / Resolution info */}
          {(pattern.acknowledged_by || pattern.resolved_by) && (
            <div className="flex items-center gap-4 text-[10px] text-[var(--cs-text-muted)] pt-1 border-t border-[var(--cs-border-subtle)]">
              {pattern.acknowledged_by && (
                <span>Acknowledged by {getStaffName(pattern.acknowledged_by)} — {formatDate(pattern.acknowledged_at!)}</span>
              )}
              {pattern.resolved_by && (
                <span>Resolved by {getStaffName(pattern.resolved_by)} — {formatDate(pattern.resolved_at!)}</span>
              )}
            </div>
          )}

          {/* Action buttons */}
          {pattern.status !== "resolved" && pattern.status !== "dismissed" && (
            <div className="flex items-center gap-2 pt-1">
              {pattern.status === "active" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                  onClick={(e) => { e.stopPropagation(); onAcknowledge(); }}
                  disabled={busy}
                >
                  {busy ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Eye className="h-3 w-3 mr-1" />}
                  Acknowledge
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                onClick={(e) => { e.stopPropagation(); onResolve(); }}
                disabled={busy}
              >
                {busy ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                Resolve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 bg-slate-50 border-[var(--cs-border)] text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]"
                onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                disabled={busy}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Dismiss
              </Button>
            </div>
          )}
        </FlatListRowDetail>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function PatternAlertsPage() {
  const { currentUser } = useAuthContext();
  const { data: res, isLoading, refetch } = usePatternAlerts();
  const ackMutation = useAcknowledgePattern();

  // View / filter / sort state
  const [tab, setTab] = useState<"active" | "acknowledged" | "resolved" | "all">("active");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<PatternSeverity | "all">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("severity");
  const [busyId, setBusyId] = useState<string | null>(null);

  const patterns = res?.data ?? [];

  // Unique alert types from data
  const alertTypes = useMemo(() => {
    const types = new Set(patterns.map((p) => p.alert_type));
    return Array.from(types).sort();
  }, [patterns]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = [...patterns];

    // Tab filter
    if (tab !== "all") {
      list = list.filter((p) => p.status === tab);
    }

    // Severity filter
    if (severityFilter !== "all") {
      list = list.filter((p) => p.severity === severityFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      list = list.filter((p) => p.alert_type === typeFilter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.child_id && getYPName(p.child_id).toLowerCase().includes(q)) ||
          p.alert_type.replace(/_/g, " ").toLowerCase().includes(q)
      );
    }

    // Sort
    const SEV_ORDER: Record<PatternSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    switch (sortBy) {
      case "severity":
        list.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
        break;
      case "date":
        list.sort((a, b) => b.detected_at.localeCompare(a.detected_at));
        break;
      case "child":
        list.sort((a, b) => {
          const na = a.child_id ? getYPName(a.child_id) : "ZZZ";
          const nb = b.child_id ? getYPName(b.child_id) : "ZZZ";
          return na.localeCompare(nb);
        });
        break;
      case "type":
        list.sort((a, b) => a.alert_type.localeCompare(b.alert_type));
        break;
    }

    return list;
  }, [patterns, tab, severityFilter, typeFilter, search, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const active = patterns.filter((p) => p.status === "active").length;
    const acked = patterns.filter((p) => p.status === "acknowledged").length;
    const resolved = patterns.filter((p) => p.status === "resolved").length;
    const critical = patterns.filter((p) => p.severity === "critical" && p.status === "active").length;
    const high = patterns.filter((p) => p.severity === "high" && p.status === "active").length;
    return { active, acked, resolved, critical, high, total: patterns.length };
  }, [patterns]);

  const hasFilters = search || severityFilter !== "all" || typeFilter !== "all";

  // Actions
  const handleAcknowledge = async (id: string) => {
    setBusyId(id);
    try {
      await ackMutation.mutateAsync({
        id,
        status: "acknowledged",
        acknowledged_by: currentUser?.id ?? "staff_darren",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleResolve = async (id: string) => {
    setBusyId(id);
    try {
      await ackMutation.mutateAsync({
        id,
        status: "resolved",
        resolved_by: currentUser?.id ?? "staff_darren",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDismiss = async (id: string) => {
    setBusyId(id);
    try {
      await ackMutation.mutateAsync({
        id,
        status: "dismissed",
        resolved_by: currentUser?.id ?? "staff_darren",
      });
    } finally {
      setBusyId(null);
    }
  };

  // Tab config
  const TABS: { key: typeof tab; label: string; count: number }[] = [
    { key: "active",       label: "Active",       count: stats.active  },
    { key: "acknowledged", label: "Acknowledged",  count: stats.acked   },
    { key: "resolved",     label: "Resolved",      count: stats.resolved },
    { key: "all",          label: "All",           count: stats.total   },
  ];

  if (isLoading) {
    return (
      <PageShell title="Pattern Alerts" subtitle="Cara-detected behavioural & environmental patterns">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" />
          <span className="ml-2 text-sm text-[var(--cs-text-muted)]">Loading pattern alerts…</span>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Pattern Alerts"
      subtitle="Cara-detected behavioural & environmental patterns"
      caraContext={{ pageTitle: "Pattern Alerts", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
          <ExportButton data={filtered} columns={PATTERN_EXPORT_COLS} filename="pattern-alerts" />
          <PrintButton title="Pattern Alerts" subtitle="Cara Pattern Detection" />
          <CaraStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── Summary stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Active",       value: stats.active,   color: "text-[--cs-risk]",     bg: "bg-[--cs-risk-bg]",     border: "border-[--cs-risk-soft]"     },
          { label: "Critical",     value: stats.critical, color: "text-[--cs-risk]",     bg: "bg-[--cs-risk-bg]",    border: "border-[--cs-risk-soft]"     },
          { label: "High",         value: stats.high,     color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200"  },
          { label: "Acknowledged", value: stats.acked,    color: "text-[--cs-warning]",   bg: "bg-[--cs-warning-bg]",   border: "border-[--cs-warning-soft]"   },
          { label: "Resolved",     value: stats.resolved, color: "text-[--cs-success]", bg: "bg-[--cs-success-bg]", border: "border-[--cs-success-soft]" },
        ].map((s) => (
          <div
            key={s.label}
            className={cn("rounded-lg border p-3 text-center", s.bg, s.border)}
          >
            <div className={cn("text-xl font-bold", s.color)}>{s.value}</div>
            <div className="text-[10px] text-[var(--cs-text-muted)] font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Alert Banner ──────────────────────────────────────────────────── */}
      {stats.active > 0 && (
        <div className="rounded-lg border border-[--cs-risk-soft] bg-[--cs-risk-bg] p-3 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[--cs-risk] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[--cs-risk]">
              {stats.active} active pattern{stats.active !== 1 ? "s" : ""} detected
            </p>
            <p className="text-xs text-[--cs-risk] mt-0.5">
              {stats.critical > 0 ? `${stats.critical} critical · ` : ""}
              {stats.high > 0 ? `${stats.high} high severity · ` : ""}
              Review, acknowledge, and action each pattern to demonstrate proactive oversight.
            </p>
          </div>
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]"
            )}
          >
            {t.label}
            <span className="ml-1.5 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
          <Input
            placeholder="Search patterns…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-1 text-xs text-[var(--cs-text-muted)]">
          <Filter className="h-3.5 w-3.5" />
        </div>

        <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as PatternSeverity | "all")}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severity</SelectItem>
            {(["critical", "high", "medium", "low"] as PatternSeverity[]).map((s) => (
              <SelectItem key={s} value={s}>{SEVERITY_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue placeholder="Alert type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {alertTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {ALERT_TYPE_LABELS[t]?.label ?? t.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="severity">Severity</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="child">Young person</SelectItem>
              <SelectItem value="type">Alert type</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-[var(--cs-text-muted)]"
            onClick={() => { setSearch(""); setSeverityFilter("all"); setTypeFilter("all"); }}
          >
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* ── Pattern List ──────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--cs-text-muted)]">
          <Radar className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No patterns found</p>
          <p className="text-xs mt-1">
            {hasFilters
              ? "Try adjusting your filters"
              : tab === "active"
                ? "No active patterns — great!"
                : "No patterns in this category"
            }
          </p>
        </div>
      ) : (
        <FlatList>
          {filtered.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              onAcknowledge={() => handleAcknowledge(pattern.id)}
              onResolve={() => handleResolve(pattern.id)}
              onDismiss={() => handleDismiss(pattern.id)}
              busy={busyId === pattern.id}
            />
          ))}
        </FlatList>
      )}

      {/* ── Footer count ──────────────────────────────────────────────────── */}
      <div className="text-center text-[10px] text-[var(--cs-text-muted)] mt-6">
        Showing {filtered.length} of {stats.total} pattern{stats.total !== 1 ? "s" : ""}
      </div>

      {/* ── Regulatory Note ───────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-slate-50 border border-[var(--cs-border)] p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-[var(--cs-cara-gold)] mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">About Pattern Alerts</h4>
            <p className="text-[11px] text-[var(--cs-text-muted)] leading-relaxed">
              Pattern alerts are generated by Cara when it detects recurring behavioural, environmental, or staffing
              patterns across the home&apos;s data. Each alert includes supporting evidence, a reflective prompt to guide
              professional thinking, and a workflow (acknowledge → resolve). Promptly reviewing and acting on patterns
              demonstrates proactive oversight, a core expectation under the Children&apos;s Homes Regulations 2015
              (Reg 13, Quality of Care) and Ofsted&apos;s Social Care Common Inspection Framework (SCCIF).
            </p>
          </div>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Patterns & Intelligence"
        category={["behaviour", "safeguarding", "health", "missing_episode"]}
        days={90}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Pattern Alerts — Cara pattern detection, behaviour trends, incident patterns, missing episodes patterns, safeguarding themes, risk escalation signals, Reg 45 intelligence evidence"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}
