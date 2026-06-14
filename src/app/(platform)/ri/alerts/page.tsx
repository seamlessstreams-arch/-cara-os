"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — RI ALERTS COMMAND CENTRE
// Auto-detected governance, compliance, and safeguarding alerts with
// severity distribution, category filtering, trend analysis, and resolution
// workflow. Powers the RI engine's proactive risk identification.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useRiAlerts, useResolveRiAlert, useCreateTrainingNeed } from "@/hooks/use-ri-learning";
import { useAuthContext } from "@/contexts/auth-context";
import type { RiAlert, RiAlertType, RiAlertSeverity } from "@/types/extended";
import { cn, formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import Link from "next/link";
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Shield, Brain,
  Search, Filter, ArrowUpDown, Clock, TrendingUp, TrendingDown, Minus,
  ShieldAlert, Eye, UserX, FileWarning, Timer, Flame, GraduationCap,
  MessageSquare, BarChart3, Activity, X, Zap,
} from "lucide-react";

const ALERT_EXPORT_COLS: ExportColumn<RiAlert>[] = [
  { header: "Title", accessor: (a) => a.title },
  { header: "Type", accessor: (a) => a.alert_type.replace(/_/g, " ") },
  { header: "Severity", accessor: (a) => a.severity },
  { header: "Resolved", accessor: (a) => a.is_resolved ? "Yes" : "No" },
  { header: "Description", accessor: (a) => a.description },
  { header: "Resolution Note", accessor: (a) => a.resolution_note ?? "" },
  { header: "Auto-Generated", accessor: (a) => a.auto_generated ? "Yes" : "No" },
  { header: "Created", accessor: (a) => a.created_at },
];

// ── Config maps ──────────────────────────────────────────────────────────────

const SEVERITY_COLOURS: Record<string, string> = {
  critical: "border-red-300 bg-red-50",
  high:     "border-orange-200 bg-orange-50",
  medium:   "border-amber-200 bg-amber-50",
  low:      "border-[var(--cs-border)] bg-slate-50",
};
const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high:     "bg-orange-100 text-orange-700",
  medium:   "bg-amber-100 text-amber-700",
  low:      "bg-slate-100 text-[var(--cs-text-secondary)]",
};
const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high:     "bg-orange-500",
  medium:   "bg-amber-400",
  low:      "bg-slate-300",
};
const SEVERITY_BAR: Record<string, string> = {
  critical: "bg-red-500",
  high:     "bg-orange-400",
  medium:   "bg-amber-300",
  low:      "bg-slate-200",
};
const SEVERITY_ORDER: RiAlertSeverity[] = ["critical", "high", "medium", "low"];

const TYPE_CONFIG: Record<RiAlertType, { label: string; icon: React.ReactNode; colour: string }> = {
  safeguarding_risk:  { label: "Safeguarding",       icon: <ShieldAlert className="h-3.5 w-3.5" />, colour: "text-red-600 bg-red-50 border-red-200" },
  repeated_incident:  { label: "Repeated Incident",  icon: <Flame className="h-3.5 w-3.5" />,      colour: "text-orange-600 bg-orange-50 border-orange-200" },
  weak_oversight:     { label: "Weak Oversight",      icon: <Eye className="h-3.5 w-3.5" />,        colour: "text-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)] border-[var(--cs-cara-gold-soft)]" },
  missing_compliance: { label: "Missing Compliance",  icon: <FileWarning className="h-3.5 w-3.5" />,colour: "text-pink-600 bg-pink-50 border-pink-200" },
  overdue_action:     { label: "Overdue Action",      icon: <Timer className="h-3.5 w-3.5" />,      colour: "text-amber-600 bg-amber-50 border-amber-200" },
  rising_risk:        { label: "Rising Risk",         icon: <TrendingUp className="h-3.5 w-3.5" />, colour: "text-rose-600 bg-rose-50 border-rose-200" },
  training_gap:       { label: "Training Gap",        icon: <GraduationCap className="h-3.5 w-3.5" />, colour: "text-blue-600 bg-blue-50 border-blue-200" },
  supervision_gap:    { label: "Supervision Gap",     icon: <MessageSquare className="h-3.5 w-3.5" />, colour: "text-teal-600 bg-teal-50 border-teal-200" },
};

type SortMode = "newest" | "oldest" | "severity";

// ── Alert Card Component ─────────────────────────────────────────────────────

function AlertCard({ alert }: { alert: RiAlert }) {
  const { currentUser } = useAuthContext();
  const [expanded, setExpanded]   = useState(false);
  const [resolving, setResolving] = useState(false);
  const [note, setNote]           = useState("");
  const [needCreated, setNeedCreated] = useState(false);
  const resolveMutation = useResolveRiAlert();
  const createNeed      = useCreateTrainingNeed();

  const typeConfig = TYPE_CONFIG[alert.alert_type] ?? { label: alert.alert_type, icon: <AlertTriangle className="h-3.5 w-3.5" />, colour: "text-[var(--cs-text-secondary)] bg-slate-50" };

  const createTrainingNeed = () => {
    const priority = alert.severity === "critical" ? "urgent"
      : alert.severity === "high" ? "high"
      : alert.severity === "medium" ? "medium" : "low";
    createNeed.mutate(
      {
        home_id: alert.home_id,
        identified_by: "cara",
        need_type: "safeguarding",
        title: `Training need from RI alert: ${alert.title}`,
        description: alert.description,
        priority,
        status: "identified",
        cara_evidence: `Auto-generated from RI Alert (${alert.severity} severity, type: ${alert.alert_type}).`,
        created_by: currentUser?.id ?? "staff_darren",
      },
      { onSuccess: () => setNeedCreated(true) },
    );
  };

  const handleResolve = () => {
    if (!note.trim()) return;
    resolveMutation.mutate(
      { id: alert.id, resolution_note: note, resolved_by: currentUser?.id ?? "staff_darren" },
      { onSuccess: () => setResolving(false) },
    );
  };

  // Days since alert was created
  const daysOpen = Math.round((Date.now() - new Date(alert.created_at).getTime()) / 86400000);

  return (
    <Card className={cn("border transition-all", SEVERITY_COLOURS[alert.severity], alert.is_resolved && "opacity-60")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Severity dot */}
          <div className="shrink-0 mt-1.5 flex flex-col items-center gap-1">
            <div className={cn("w-2.5 h-2.5 rounded-full", SEVERITY_DOT[alert.severity])} />
            {alert.auto_generated && (
              <Zap className="h-3 w-3 text-[var(--cs-text-muted)]" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--cs-navy)] leading-snug">{alert.title}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge className={cn("text-[10px] h-4 px-1.5 border", SEVERITY_BADGE[alert.severity])}>
                    {alert.severity}
                  </Badge>
                  <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5 gap-0.5 border", typeConfig.colour)}>
                    {typeConfig.icon}
                    {typeConfig.label}
                  </Badge>
                  {alert.is_resolved ? (
                    <Badge className="text-[10px] h-4 px-1.5 bg-emerald-100 text-emerald-700 border-0">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                      Resolved
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-[var(--cs-text-muted)] flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {daysOpen}d open
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--cs-text-muted)]">{formatDate(alert.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Collapsed preview */}
            {!expanded && (
              <p className="text-[12px] text-[var(--cs-text-muted)] mt-2 line-clamp-2 leading-relaxed">
                {alert.description}
              </p>
            )}

            {/* Expanded detail */}
            {expanded && (
              <div className="mt-3 space-y-3 pt-3 border-t border-[var(--cs-border-subtle)]/80">
                <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed">{alert.description}</p>

                {/* Data evidence chips */}
                {alert.data_evidence && Object.keys(alert.data_evidence).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(alert.data_evidence).map(([key, val]) => (
                      <span key={key} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-[var(--cs-text-secondary)] font-mono">
                        {key.replace(/_/g, " ")}: {typeof val === "object" ? JSON.stringify(val) : String(val)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Linked challenge log */}
                {alert.linked_challenge_id && (
                  <Link href="/ri/challenge-log">
                    <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 hover:text-indigo-800 transition-colors">
                      <Shield className="h-3 w-3" />
                      Linked challenge log entry →
                    </div>
                  </Link>
                )}

                {/* Resolution display */}
                {alert.resolution_note && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <p className="text-xs font-semibold text-emerald-700">Resolution</p>
                      {alert.resolved_at && (
                        <span className="text-[10px] text-emerald-500 ml-auto">{formatDate(alert.resolved_at)}</span>
                      )}
                    </div>
                    <p className="text-sm text-emerald-900 leading-relaxed">{alert.resolution_note}</p>
                  </div>
                )}

                {/* Actions */}
                {!alert.is_resolved && !resolving && (
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => setResolving(true)}>
                      <CheckCircle2 className="h-3 w-3" />
                      Resolve Alert
                    </Button>
                    {!needCreated ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 gap-1 text-[var(--cs-cara-gold)] border-[var(--cs-cara-gold-soft)] hover:bg-[var(--cs-cara-gold-bg)]"
                        onClick={createTrainingNeed}
                        disabled={createNeed.isPending}
                      >
                        <Brain className="h-3 w-3" />
                        {createNeed.isPending ? "Creating…" : "Create Training Need"}
                      </Button>
                    ) : (
                      <Link href="/learning/training-needs">
                        <Button size="sm" variant="ghost" className="text-xs h-7 gap-1 text-[var(--cs-cara-gold)]">
                          <CheckCircle2 className="h-3 w-3" />
                          Training need created →
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {/* Resolve form */}
                {resolving && (
                  <div className="space-y-2">
                    <Textarea
                      rows={2}
                      className="text-sm"
                      placeholder="Describe how this alert was resolved…"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleResolve} disabled={!note.trim() || resolveMutation.isPending} className="text-xs h-7">
                        {resolveMutation.isPending ? "Saving…" : "Confirm Resolved"}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setResolving(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] shrink-0 mt-1 rounded-md p-1 hover:bg-[var(--cs-surface)] transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Severity Distribution Bar ────────────────────────────────────────────────

function SeverityBar({ counts }: { counts: Record<RiAlertSeverity, number> }) {
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  if (total === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
        {SEVERITY_ORDER.map((sev) => {
          const pct = (counts[sev] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={sev}
              className={cn("transition-all duration-500", SEVERITY_BAR[sev])}
              style={{ width: `${pct}%` }}
              title={`${sev}: ${counts[sev]}`}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        {SEVERITY_ORDER.map((sev) => (
          <div key={sev} className="flex items-center gap-1 text-[10px] text-[var(--cs-text-muted)]">
            <div className={cn("w-2 h-2 rounded-full", SEVERITY_DOT[sev])} />
            <span className="capitalize">{sev}</span>
            <span className="font-semibold text-[var(--cs-text-secondary)]">{counts[sev]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Timeline Sparkline ───────────────────────────────────────────────────────

function AlertTimeline({ timeline }: { timeline: { week: string; created: number; resolved: number }[] }) {
  const maxVal = Math.max(...timeline.map((t) => Math.max(t.created, t.resolved)), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[13px] flex items-center gap-2">
          <Activity className="h-4 w-4 text-indigo-500" />
          Alert Activity (12 weeks)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-end gap-1 h-16">
          {timeline.map((t, i) => {
            const createdH = (t.created / maxVal) * 100;
            const resolvedH = (t.resolved / maxVal) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`Week of ${t.week}: ${t.created} created, ${t.resolved} resolved`}>
                <div className="w-full flex items-end gap-px" style={{ height: "100%" }}>
                  <div
                    className="flex-1 bg-red-300 rounded-t-sm transition-all"
                    style={{ height: `${Math.max(createdH, t.created > 0 ? 15 : 0)}%` }}
                  />
                  <div
                    className="flex-1 bg-emerald-300 rounded-t-sm transition-all"
                    style={{ height: `${Math.max(resolvedH, t.resolved > 0 ? 15 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-[var(--cs-text-muted)]">{timeline[0]?.week}</span>
          <span className="text-[9px] text-[var(--cs-text-muted)]">Now</span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1 text-[10px] text-[var(--cs-text-muted)]">
            <div className="w-2 h-2 rounded-sm bg-red-300" />
            Created
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[var(--cs-text-muted)]">
            <div className="w-2 h-2 rounded-sm bg-emerald-300" />
            Resolved
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Type Breakdown Grid ──────────────────────────────────────────────────────

function TypeBreakdown({
  typeCounts,
  activeFilter,
  onFilter,
}: {
  typeCounts: Record<string, number>;
  activeFilter: string | null;
  onFilter: (type: string | null) => void;
}) {
  const allTypes = Object.keys(TYPE_CONFIG) as RiAlertType[];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[13px] flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-500" />
          By Category
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-1.5">
          {allTypes.map((type) => {
            const cfg = TYPE_CONFIG[type];
            const count = typeCounts[type] ?? 0;
            const isActive = activeFilter === type;
            return (
              <button
                key={type}
                onClick={() => onFilter(isActive ? null : type)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left transition-all",
                  isActive
                    ? "ring-2 ring-indigo-300 border-indigo-300 bg-indigo-50"
                    : count > 0
                      ? "hover:bg-[var(--cs-surface)] border-[var(--cs-border-subtle)]"
                      : "border-slate-50 opacity-40",
                )}
              >
                <span className={cn("shrink-0", cfg.colour.split(" ")[0])}>{cfg.icon}</span>
                <span className="text-[10px] text-[var(--cs-text-secondary)] truncate flex-1">{cfg.label}</span>
                <span className={cn("text-[11px] font-bold tabular-nums", count > 0 ? "text-[var(--cs-navy)]" : "text-[var(--cs-text-gentle)]")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        {activeFilter && (
          <button
            onClick={() => onFilter(null)}
            className="flex items-center gap-1 mt-2 text-[10px] text-indigo-600 hover:text-indigo-800"
          >
            <X className="h-3 w-3" />
            Clear filter
          </button>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function RiAlertsPage() {
  const { currentUser }  = useAuthContext();
  const homeId           = currentUser?.home_id ?? "home_oak";
  const { data, isLoading } = useRiAlerts({ homeId });

  // ── State ────────────────────────────────────────────────────────────────
  const [showResolved, setShowResolved] = useState(false);
  const [search, setSearch]            = useState("");
  const [sevFilter, setSevFilter]      = useState<RiAlertSeverity | null>(null);
  const [typeFilter, setTypeFilter]    = useState<string | null>(null);
  const [sortMode, setSortMode]        = useState<SortMode>("newest");

  // ── Derived data ─────────────────────────────────────────────────────────
  const alerts   = data?.data ?? [];
  const meta     = data?.meta as Record<string, unknown> | undefined;
  const active   = alerts.filter((a: RiAlert) => !a.is_resolved);
  const resolved = alerts.filter((a: RiAlert) => a.is_resolved);

  const severityCounts = (meta?.severity_counts ?? { critical: 0, high: 0, medium: 0, low: 0 }) as Record<RiAlertSeverity, number>;
  const typeCounts     = (meta?.type_counts ?? {}) as Record<string, number>;
  const avgResDays     = (meta?.avg_resolution_days ?? 0) as number;
  const timeline       = (meta?.timeline ?? []) as { week: string; created: number; resolved: number }[];

  // ── Filtering + sorting ──────────────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = showResolved ? alerts : active;

    if (sevFilter) list = list.filter((a: RiAlert) => a.severity === sevFilter);
    if (typeFilter) list = list.filter((a: RiAlert) => a.alert_type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a: RiAlert) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q),
      );
    }

    // Sort
    list = [...list].sort((a: RiAlert, b: RiAlert) => {
      if (sortMode === "oldest") return a.created_at.localeCompare(b.created_at);
      if (sortMode === "severity") {
        const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
      }
      return b.created_at.localeCompare(a.created_at); // newest
    });

    return list;
  }, [alerts, active, showResolved, sevFilter, typeFilter, search, sortMode]);

  const activeFilterCount = [sevFilter, typeFilter, search.trim()].filter(Boolean).length;

  return (
    <PageShell
      title="RI Alerts"
      subtitle="Auto-detected governance, compliance, and safeguarding alerts"
      caraContext={{ pageTitle: "RI Alerts", sourceType: "general" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={displayed} columns={ALERT_EXPORT_COLS} filename="ri-alerts" />
          <PrintButton title="RI Alerts Report" subtitle="Chamberlain House Compliance" targetId="ri-alerts-content" />
          <SmartUploadButton variant="inline" label="Upload Evidence" uploadContext="RI Alerts — evidence upload" />
          <CaraStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="ri-alerts-content" className="space-y-4 animate-fade-in">

        {/* ── KPI Banner ──────────────────────────────────────────────────── */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
          {[
            {
              label: "Critical",
              value: severityCounts.critical,
              colour: severityCounts.critical > 0 ? "text-red-700" : "text-[var(--cs-text-gentle)]",
              bg: severityCounts.critical > 0 ? "bg-red-50 border-red-100" : "",
              icon: <ShieldAlert className={cn("h-4 w-4", severityCounts.critical > 0 ? "text-red-500" : "text-[var(--cs-text-gentle)]")} />,
            },
            {
              label: "High",
              value: severityCounts.high,
              colour: severityCounts.high > 0 ? "text-orange-700" : "text-[var(--cs-text-gentle)]",
              bg: severityCounts.high > 0 ? "bg-orange-50 border-orange-100" : "",
              icon: <AlertTriangle className={cn("h-4 w-4", severityCounts.high > 0 ? "text-orange-500" : "text-[var(--cs-text-gentle)]")} />,
            },
            {
              label: "Active",
              value: active.length,
              colour: active.length > 0 ? "text-amber-700" : "text-[var(--cs-text-gentle)]",
              icon: <Flame className={cn("h-4 w-4", active.length > 0 ? "text-amber-500" : "text-[var(--cs-text-gentle)]")} />,
            },
            {
              label: "Resolved",
              value: resolved.length,
              colour: "text-emerald-700",
              icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
            },
            {
              label: "Avg Resolution",
              value: `${avgResDays}d`,
              colour: "text-indigo-700",
              icon: <Clock className="h-4 w-4 text-indigo-500" />,
            },
          ].map(({ label, value, colour, bg, icon }) => (
            <div key={label} className={cn("rounded-xl border border-[var(--cs-border-subtle)] bg-white p-3 text-center", bg)}>
              <div className="flex justify-center mb-1">{icon}</div>
              <div className={cn("text-xl font-bold tabular-nums", colour)}>{value}</div>
              <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Severity Distribution ───────────────────────────────────────── */}
        {active.length > 0 && (
          <Card>
            <CardContent className="py-3 px-4">
              <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-2">
                Active Alert Severity
              </p>
              <SeverityBar counts={severityCounts} />
            </CardContent>
          </Card>
        )}

        {/* ── Analysis Row: Timeline + Type Breakdown ─────────────────────── */}
        <div className="grid gap-4 md:grid-cols-2">
          {timeline.length > 0 && <AlertTimeline timeline={timeline} />}
          <TypeBreakdown
            typeCounts={typeCounts}
            activeFilter={typeFilter}
            onFilter={setTypeFilter}
          />
        </div>

        {/* ── Filter Bar ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alerts…"
              className="pl-8 h-8 text-sm"
            />
          </div>

          {/* Severity filter chips */}
          <div className="flex items-center gap-1">
            {SEVERITY_ORDER.map((sev) => (
              <button
                key={sev}
                onClick={() => setSevFilter(sevFilter === sev ? null : sev)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium border transition-all capitalize",
                  sevFilter === sev
                    ? cn(SEVERITY_BADGE[sev], "ring-2 ring-offset-1 ring-slate-300")
                    : "border-[var(--cs-border)] text-[var(--cs-text-muted)] hover:bg-[var(--cs-surface)]",
                )}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full", SEVERITY_DOT[sev])} />
                {sev}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1 ml-auto">
            <ArrowUpDown className="h-3 w-3 text-[var(--cs-text-muted)]" />
            {(["newest", "severity", "oldest"] as SortMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className={cn(
                  "text-[10px] px-2 py-1 rounded-md transition-all capitalize",
                  sortMode === mode
                    ? "bg-indigo-100 text-indigo-700 font-semibold"
                    : "text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]",
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* ── Show / Hide Resolved Toggle ─────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResolved((p) => !p)}
              className="text-xs text-[var(--cs-text-muted)] underline hover:text-[var(--cs-text-secondary)]"
            >
              {showResolved ? "Hide resolved" : `Show ${resolved.length} resolved`}
            </button>
            {activeFilterCount > 0 && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-0.5">
                <Filter className="h-2.5 w-2.5" />
                {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <span className="text-[11px] text-[var(--cs-text-muted)]">
            {displayed.length} alert{displayed.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Alert List ──────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="text-sm text-[var(--cs-text-muted)] text-center py-8">Loading…</div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="h-10 w-10 text-emerald-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--cs-text-secondary)]">
              {activeFilterCount > 0 ? "No alerts match your filters" : "No active alerts"}
            </p>
            <p className="text-xs text-[var(--cs-text-muted)] mt-1">
              {activeFilterCount > 0
                ? "Try adjusting your search or filter criteria"
                : "Alerts are generated automatically as governance issues are detected"}
            </p>
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => { setSevFilter(null); setTypeFilter(null); setSearch(""); }}
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((alert: RiAlert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>
      <CaraPanel
        mode="assist"
        pageContext="RI Alerts — auto-detected governance alerts, compliance alerts, safeguarding alerts, regulatory triggers, escalation evidence, RI oversight, Ofsted readiness indicators"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}

