"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RI GOVERNANCE REPORTS
// Central repository of ARIA-generated and manually authored governance
// reports for the Responsible Individual. Covers strategic summaries,
// risk analyses, Reg 45 drafts, Ofsted readiness, and monthly overviews.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { Badge } from "@/components/ui/badge";
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
import { getStaffName } from "@/lib/seed-data";
import type { RiGovernanceReport, RiReportType, RiReportStatus } from "@/types/extended";
import {
  useRiGovernanceReports,
  useCreateRiGovernanceReport,
  useUpdateRiGovernanceReport,
} from "@/hooks/use-ri-governance-reports";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  Plus, FileText, BarChart3, Shield, Award, Calendar,
  Eye, CheckCircle2, Sparkles, Loader2, Clock,
  AlertTriangle, TrendingUp, User, X, Gavel,
  ScrollText, Activity, RefreshCw,
} from "lucide-react";

// ── Seed data (local) ─────────────────────────────────────────────────────────

interface LocalReport extends Omit<RiGovernanceReport, "content"> {
  content: {
    summary?: string;
    key_findings?: string[];
    strengths?: string[];
    concerns?: string[];
    actions?: string[];
    risk_level?: string;
  };
}


// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<RiReportType, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  strategic_summary: { label: "Strategic Summary",  icon: BarChart3,  color: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200" },
  reg45_draft:       { label: "Reg 45 Draft",       icon: Gavel,      color: "text-[var(--cs-aria-gold)]",  bg: "bg-[var(--cs-aria-gold-bg)]",  border: "border-[var(--cs-aria-gold-soft)]" },
  ofsted_readiness:  { label: "Ofsted Readiness",   icon: Award,      color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"  },
  risk_analysis:     { label: "Risk Analysis",      icon: Shield,     color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200"    },
  monthly_overview:  { label: "Monthly Overview",   icon: Calendar,   color: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-200"    },
};

const STATUS_CONFIG: Record<RiReportStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  draft:     { label: "Draft",     icon: FileText,     color: "text-[var(--cs-text-secondary)]",   bg: "bg-slate-50",   border: "border-[var(--cs-border)]"   },
  reviewed:  { label: "Reviewed",  icon: Eye,          color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
  approved:  { label: "Approved",  icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  published: { label: "Published", icon: ScrollText,   color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200"    },
};

// ── Export Columns ────────────────────────────────────────────────────────────

const REPORT_EXPORT_COLS: ExportColumn<LocalReport>[] = [
  { header: "Title",          accessor: (r) => TYPE_CONFIG[r.report_type]?.label ?? r.report_type },
  { header: "Period",         accessor: (r) => r.report_period ?? "" },
  { header: "Status",         accessor: (r) => STATUS_CONFIG[r.status]?.label ?? r.status },
  { header: "ARIA Generated", accessor: (r) => r.generated_by_aria ? "Yes" : "No" },
  { header: "Summary",        accessor: (r) => r.content.summary ?? "" },
  { header: "Key Findings",   accessor: (r) => (r.content.key_findings ?? []).join("; ") },
  { header: "Strengths",      accessor: (r) => (r.content.strengths ?? []).join("; ") },
  { header: "Concerns",       accessor: (r) => (r.content.concerns ?? []).join("; ") },
  { header: "Actions",        accessor: (r) => (r.content.actions ?? []).join("; ") },
  { header: "Created By",     accessor: (r) => getStaffName(r.created_by) },
  { header: "Created",        accessor: (r) => r.created_at.slice(0, 10) },
  { header: "Approved By",    accessor: (r) => r.approved_by ? getStaffName(r.approved_by) : "" },
  { header: "Approved At",    accessor: (r) => r.approved_at?.slice(0, 10) ?? "" },
];

// ── Report Card ──────────────────────────────────────────────────────────────

function ReportCard({
  report,
  onStatusChange,
  busy,
}: {
  report: LocalReport;
  onStatusChange: (newStatus: RiReportStatus) => void;
  busy: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const tc = TYPE_CONFIG[report.report_type];
  const sc = STATUS_CONFIG[report.status];
  const TypeIcon = tc.icon;
  const StIcon = sc.icon;

  return (
    <div className="rounded-lg border bg-white transition-all hover:shadow-sm">
      {/* Header */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={cn("mt-0.5 rounded-md p-1.5 border", tc.bg, tc.border)}>
          <TypeIcon className={cn("h-4 w-4", tc.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-[var(--cs-navy)]">{tc.label}</h3>
            {report.report_period && (
              <span className="text-xs text-[var(--cs-text-muted)]">— {report.report_period}</span>
            )}
            {report.generated_by_aria && (
              <Badge className="bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)] border-[var(--cs-aria-gold-soft)] text-[10px] px-1.5 py-0">
                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                ARIA
              </Badge>
            )}
          </div>
          <p className="text-xs text-[var(--cs-text-secondary)] line-clamp-2">{report.content.summary}</p>

          <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--cs-text-muted)]">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {getStaffName(report.created_by)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(report.created_at)}
            </span>
            {report.content.risk_level && (
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Risk: <span className="capitalize font-medium">{report.content.risk_level}</span>
              </span>
            )}
          </div>
        </div>

        {/* Status + expand */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={cn("text-[10px] px-2 py-0.5 border", sc.bg, sc.color, sc.border)}>
            <StIcon className="h-3 w-3 mr-1" />
            {sc.label}
          </Badge>
          {expanded ? <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" />}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-4">
          {/* Key Findings */}
          {report.content.key_findings && report.content.key_findings.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2">Key Findings</h4>
              <ul className="space-y-1.5">
                {report.content.key_findings.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[var(--cs-text-secondary)]">
                    <Activity className="h-3 w-3 text-[var(--cs-text-muted)] mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strengths */}
          {report.content.strengths && report.content.strengths.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide mb-2">Strengths</h4>
              <ul className="space-y-1.5">
                {report.content.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[var(--cs-text-secondary)]">
                    <TrendingUp className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Concerns */}
          {report.content.concerns && report.content.concerns.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-red-700 uppercase tracking-wide mb-2">Concerns</h4>
              <ul className="space-y-1.5">
                {report.content.concerns.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[var(--cs-text-secondary)]">
                    <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          {report.content.actions && report.content.actions.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide mb-2">Actions</h4>
              <ul className="space-y-1.5">
                {report.content.actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[var(--cs-text-secondary)]">
                    <CheckCircle2 className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Approval info */}
          {report.approved_by && (
            <div className="text-[10px] text-[var(--cs-text-muted)] pt-2 border-t border-[var(--cs-border-subtle)]">
              Approved by {getStaffName(report.approved_by)} — {formatDate(report.approved_at!)}
            </div>
          )}

          {/* Status action buttons */}
          <div className="flex items-center gap-2 pt-1">
            {report.status === "draft" && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                onClick={(e) => { e.stopPropagation(); onStatusChange("reviewed"); }}
                disabled={busy}
              >
                {busy ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Eye className="h-3 w-3 mr-1" />}
                Mark Reviewed
              </Button>
            )}
            {(report.status === "draft" || report.status === "reviewed") && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                onClick={(e) => { e.stopPropagation(); onStatusChange("approved"); }}
                disabled={busy}
              >
                {busy ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                Approve
              </Button>
            )}
            {report.status === "approved" && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                onClick={(e) => { e.stopPropagation(); onStatusChange("published"); }}
                disabled={busy}
              >
                <ScrollText className="h-3 w-3 mr-1" />
                Publish
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── New Report Dialog ────────────────────────────────────────────────────────

function NewReportDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (report: LocalReport) => void;
}) {
  const { currentUser } = useAuthContext();
  const [reportType, setReportType] = useState<RiReportType>("strategic_summary");
  const [period, setPeriod] = useState("");
  const [summary, setSummary] = useState("");
  const [findings, setFindings] = useState("");
  const [strengths, setStrengths] = useState("");
  const [concerns, setConcerns] = useState("");
  const [actions, setActions] = useState("");

  function handleSubmit() {
    if (!summary.trim()) return;
    const now = new Date().toISOString();
    const report: LocalReport = {
      id: `rigr_local_${Date.now()}`,
      home_id: "home_oak",
      report_type: reportType,
      report_period: period || undefined,
      generated_by_aria: false,
      content: {
        summary: summary.trim(),
        key_findings: findings.split("\n").filter(Boolean),
        strengths: strengths.split("\n").filter(Boolean),
        concerns: concerns.split("\n").filter(Boolean),
        actions: actions.split("\n").filter(Boolean),
      },
      status: "draft",
      approved_by: undefined,
      approved_at: undefined,
      created_by: currentUser?.id ?? "staff_darren",
      created_at: now,
      updated_at: now,
    };
    onSubmit(report);
    onClose();
    setSummary("");
    setFindings("");
    setStrengths("");
    setConcerns("");
    setActions("");
    setPeriod("");
    setReportType("strategic_summary");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-indigo-600" />
            New Governance Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-[var(--cs-text-secondary)] mb-1 block">Report Type</label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as RiReportType)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_CONFIG) as RiReportType[]).map((t) => (
                    <SelectItem key={t} value={t}>{TYPE_CONFIG[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--cs-text-secondary)] mb-1 block">Report Period</label>
              <Input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="e.g. April 2026, Q1 2026"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--cs-text-secondary)] mb-1 block">Summary *</label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Executive summary of the report…"
              className="text-xs min-h-[80px]"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--cs-text-secondary)] mb-1 block">Key Findings (one per line)</label>
            <Textarea
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Enter each finding on a new line…"
              className="text-xs min-h-[60px]"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--cs-text-secondary)] mb-1 block">Strengths (one per line)</label>
            <Textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="Enter each strength on a new line…"
              className="text-xs min-h-[60px]"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--cs-text-secondary)] mb-1 block">Concerns (one per line)</label>
            <Textarea
              value={concerns}
              onChange={(e) => setConcerns(e.target.value)}
              placeholder="Enter each concern on a new line…"
              className="text-xs min-h-[60px]"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--cs-text-secondary)] mb-1 block">Actions (one per line)</label>
            <Textarea
              value={actions}
              onChange={(e) => setActions(e.target.value)}
              placeholder="Enter each action on a new line…"
              className="text-xs min-h-[60px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="text-xs" onClick={handleSubmit} disabled={!summary.trim()}>
            Create Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function GovernanceReportsPage() {
  const { currentUser } = useAuthContext();
  const { data: reportsResult } = useRiGovernanceReports("home_oak");
  const reports = (reportsResult?.data ?? []) as LocalReport[];
  const createMutation = useCreateRiGovernanceReport();
  const updateMutation = useUpdateRiGovernanceReport();
  const [showNew, setShowNew] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // View / filter / sort state
  const [tab, setTab] = useState<RiReportStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<RiReportType | "all">("all");
  const [sortBy, setSortBy] = useState("date");

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = [...reports];

    if (tab !== "all") {
      list = list.filter((r) => r.status === tab);
    }

    if (typeFilter !== "all") {
      list = list.filter((r) => r.report_type === typeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          (r.content.summary ?? "").toLowerCase().includes(q) ||
          TYPE_CONFIG[r.report_type].label.toLowerCase().includes(q) ||
          (r.report_period ?? "").toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case "date":
        list.sort((a, b) => b.created_at.localeCompare(a.created_at));
        break;
      case "type":
        list.sort((a, b) => a.report_type.localeCompare(b.report_type));
        break;
      case "status":
        list.sort((a, b) => a.status.localeCompare(b.status));
        break;
      case "period":
        list.sort((a, b) => (b.report_period ?? "").localeCompare(a.report_period ?? ""));
        break;
    }

    return list;
  }, [reports, tab, typeFilter, search, sortBy]);

  // Stats
  const stats = useMemo(() => ({
    total:     reports.length,
    draft:     reports.filter((r) => r.status === "draft").length,
    reviewed:  reports.filter((r) => r.status === "reviewed").length,
    approved:  reports.filter((r) => r.status === "approved").length,
    published: reports.filter((r) => r.status === "published").length,
    ariaGen:   reports.filter((r) => r.generated_by_aria).length,
  }), [reports]);

  const hasFilters = search || typeFilter !== "all";

  // Status change handler
  const handleStatusChange = async (id: string, newStatus: RiReportStatus) => {
    setBusyId(id);
    try {
      await updateMutation.mutateAsync({
        id,
        status: newStatus,
        ...(newStatus === "approved" || newStatus === "published"
          ? { approved_by: currentUser?.id ?? "staff_darren", approved_at: new Date().toISOString() }
          : {}),
      });
    } finally {
      setBusyId(null);
    }
  };

  // Create handler
  const handleCreate = async (report: LocalReport) => {
    await createMutation.mutateAsync(report as unknown as Partial<RiGovernanceReport>);
  };

  // Tab config
  const TABS: { key: typeof tab; label: string; count: number }[] = [
    { key: "all",       label: "All",        count: stats.total     },
    { key: "draft",     label: "Drafts",     count: stats.draft     },
    { key: "reviewed",  label: "Reviewed",   count: stats.reviewed  },
    { key: "approved",  label: "Approved",   count: stats.approved  },
    { key: "published", label: "Published",  count: stats.published },
  ];

  return (
    <PageShell
      title="Governance Reports"
      subtitle="RI oversight reports — strategic summaries, risk analysis, Reg 45 drafts"
      ariaContext={{ pageTitle: "RI Governance", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={REPORT_EXPORT_COLS} filename="governance-reports" />
          <PrintButton title="Governance Reports" subtitle="Chamberlain House — RI Oversight" />
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setShowNew(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            New Report
          </Button>
          <AriaStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── Summary stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Reports",   value: stats.total,     color: "text-[var(--cs-text-secondary)]",   bg: "bg-slate-50",   border: "border-[var(--cs-border)]"   },
          { label: "Drafts",          value: stats.draft,     color: "text-[var(--cs-text-secondary)]",   bg: "bg-slate-50",   border: "border-[var(--cs-border)]"   },
          { label: "Awaiting Review", value: stats.reviewed,  color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200"   },
          { label: "Approved",        value: stats.approved,  color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
          { label: "ARIA Generated",  value: stats.ariaGen,   color: "text-[var(--cs-aria-gold)]",  bg: "bg-[var(--cs-aria-gold-bg)]",  border: "border-[var(--cs-aria-gold-soft)]"  },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-lg border p-3 text-center", s.bg, s.border)}>
            <div className={cn("text-xl font-bold", s.color)}>{s.value}</div>
            <div className="text-[10px] text-[var(--cs-text-muted)] font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

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
            placeholder="Search reports…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-1 text-xs text-[var(--cs-text-muted)]">
          <Filter className="h-3.5 w-3.5" />
        </div>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as RiReportType | "all")}>
          <SelectTrigger className="h-8 w-[170px] text-xs">
            <SelectValue placeholder="Report type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {(Object.keys(TYPE_CONFIG) as RiReportType[]).map((t) => (
              <SelectItem key={t} value={t}>{TYPE_CONFIG[t].label}</SelectItem>
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
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="type">Type</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="period">Period</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-[var(--cs-text-muted)]"
            onClick={() => { setSearch(""); setTypeFilter("all"); }}
          >
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* ── Report List ───────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--cs-text-muted)]">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No reports found</p>
          <p className="text-xs mt-1">
            {hasFilters ? "Try adjusting your filters" : "Create your first governance report"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onStatusChange={(s) => handleStatusChange(report.id, s)}
              busy={busyId === report.id}
            />
          ))}
        </div>
      )}

      {/* Footer count */}
      <div className="text-center text-[10px] text-[var(--cs-text-muted)] mt-6">
        Showing {filtered.length} of {stats.total} report{stats.total !== 1 ? "s" : ""}
      </div>

      {/* ── Regulatory Note ───────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-slate-50 border border-[var(--cs-border)] p-4">
        <div className="flex items-start gap-3">
          <Gavel className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Regulatory Context</h4>
            <p className="text-[11px] text-[var(--cs-text-muted)] leading-relaxed">
              The Responsible Individual must monitor the quality and effectiveness of the home (Reg 45, Children&apos;s
              Homes Regulations 2015). This includes producing a written report at least every 6 months evaluating
              the quality of care, whether children are effectively safeguarded, the conduct of the home, and any
              actions required to improve quality. These governance reports support the RI in fulfilling that duty and
              provide an evidence base for Ofsted inspection under the Social Care Common Inspection Framework (SCCIF).
            </p>
          </div>
        </div>
      </div>

      {/* New Report Dialog */}
      <NewReportDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onSubmit={handleCreate}
      />
      <AriaPanel
        mode="assist"
        pageContext="RI Governance — responsible individual governance reports, oversight visits, management oversight, Reg 45 governance, board reporting, regulatory compliance, Ofsted evidence"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}
