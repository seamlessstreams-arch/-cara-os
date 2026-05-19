"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CARE FORMS LIST PAGE
// Full-featured care form registry with timeline grouping, print support,
// status filtering, and manager review workflow.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  Search, FileText, RotateCcw, Clock, CheckCircle2, XCircle,
  AlertTriangle, Archive, ChevronRight, Heart, CalendarDays,
  Pencil, Loader2, AlertCircle, ClipboardList, CircleDot,
  LayoutList, Calendar, FolderOpen, ArrowUpDown,
} from "lucide-react";
import { useForms } from "@/hooks/use-forms";
import { PrintButton } from "@/components/common/print-button";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions";
import { CARE_FORM_TYPE_LABELS, CARE_FORM_TYPES } from "@/lib/constants";
import { cn, todayStr, formatRelative } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type { CareForm } from "@/types";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const FORM_EXPORT_COLS: ExportColumn<CareForm>[] = [
  { header: "Title", accessor: (f) => f.title },
  { header: "Form Type", accessor: (f) => CARE_FORM_TYPE_LABELS[f.form_type] ?? f.form_type },
  { header: "Status", accessor: (f) => f.status },
  { header: "Priority", accessor: (f) => f.priority },
  { header: "Young Person", accessor: (f) => f.linked_child_id ? getYPName(f.linked_child_id) : "" },
  { header: "Staff", accessor: (f) => f.linked_staff_id ? getStaffName(f.linked_staff_id) : "" },
  { header: "Due Date", accessor: (f) => f.due_date ?? "" },
  { header: "Submitted By", accessor: (f) => f.submitted_by ? getStaffName(f.submitted_by) : "" },
  { header: "Submitted At", accessor: (f) => f.submitted_at ?? "" },
  { header: "Created", accessor: (f) => f.created_at },
];

// ── Context for QuickCreate ───────────────────────────────────────────────────
const FORMS_QUICK_CREATE_CONTEXT = { module: "forms", preferredTab: "form" } as const;

// ── Status display config ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  draft:          { label: "Draft",          color: "text-[var(--cs-text-muted)]",   bgColor: "bg-slate-100",   icon: Pencil       },
  submitted:      { label: "Submitted",      color: "text-blue-600",    bgColor: "bg-blue-100",    icon: Clock        },
  pending_review: { label: "Pending Review", color: "text-amber-600",   bgColor: "bg-amber-100",   icon: AlertTriangle },
  approved:       { label: "Approved",       color: "text-emerald-600", bgColor: "bg-emerald-100", icon: CheckCircle2 },
  rejected:       { label: "Rejected",       color: "text-red-600",     bgColor: "bg-red-100",     icon: XCircle      },
  archived:       { label: "Archived",       color: "text-[var(--cs-text-muted)]",   bgColor: "bg-slate-100",   icon: Archive      },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800",       border: "border-l-red-600"   },
  high:   { label: "High",   color: "bg-orange-100 text-orange-800", border: "border-l-orange-500" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-800",     border: "border-l-blue-400"  },
  low:    { label: "Low",    color: "bg-slate-100 text-[var(--cs-text-secondary)]",   border: "border-l-slate-300"  },
};

type GroupMode = "none" | "timeline" | "type";

// ── Stat card with icon ──────────────────────────────────────────────────────

function StatCard({ label, value, highlight, icon: Icon }: { label: string; value: number; highlight?: boolean; icon: React.ElementType }) {
  return (
    <div className={cn("rounded-2xl border bg-white p-4 text-center", highlight && value > 0 && "border-red-200 bg-red-50")}>
      <Icon className={cn("h-4 w-4 mx-auto mb-1.5", highlight && value > 0 ? "text-red-400" : "text-[var(--cs-text-muted)]")} />
      <div className={cn("text-2xl font-bold tabular-nums", highlight && value > 0 ? "text-red-600" : "text-[var(--cs-navy)]")}>{value}</div>
      <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">{label}</div>
    </div>
  );
}

// ── Timeline helper ──────────────────────────────────────────────────────────

function getTimelineBucket(dateStr: string | null, today: string): string {
  if (!dateStr) return "No date";
  if (dateStr === today) return "Today";
  const d = new Date(dateStr);
  const t = new Date(today);
  const diffDays = Math.round((t.getTime() - d.getTime()) / 86400000);
  if (diffDays === 1) return "Yesterday";
  if (diffDays >= 0 && diffDays < 7) return "This week";
  if (diffDays >= 7 && diffDays < 30) return "This month";
  if (diffDays < 0 && diffDays > -7) return "Due this week";
  if (diffDays < 0) return "Upcoming";
  return "Older";
}

const TIMELINE_ORDER = ["Today", "Yesterday", "This week", "This month", "Due this week", "Upcoming", "Older", "No date"];

// ── Form card ────────────────────────────────────────────────────────────────

function FormCard({ form, today, canApprove, onClick }: {
  form: CareForm; today: string; canApprove: boolean; onClick: () => void;
}) {
  const stat = STATUS_CONFIG[form.status] ?? STATUS_CONFIG.draft;
  const prio = PRIORITY_CONFIG[form.priority];
  const StatusIcon = stat.icon;
  const isOverdue = form.due_date && form.due_date < today && form.status !== "approved" && form.status !== "archived";
  const childName = form.linked_child_id ? getYPName(form.linked_child_id) : null;
  const submitterName = form.submitted_by ? getStaffName(form.submitted_by) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={cn(
        "rounded-2xl border bg-white border-l-4 p-4 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer group",
        prio.border,
        isOverdue && "ring-1 ring-red-200",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className={cn("mt-0.5 rounded-full p-1.5 shrink-0", stat.bgColor)}>
          <StatusIcon className={cn("h-4 w-4", stat.color)} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-[var(--cs-navy)] leading-snug">{form.title}</h4>
              {form.description && (
                <p className="text-xs text-[var(--cs-text-muted)] mt-0.5 line-clamp-1">{form.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {form.priority === "urgent" && (
                <Badge variant="destructive" className="text-[9px] rounded-full gap-0.5">
                  <AlertTriangle className="h-3 w-3" />Urgent
                </Badge>
              )}
              {isOverdue && (
                <Badge variant="destructive" className="text-[9px] rounded-full gap-0.5">
                  Overdue
                </Badge>
              )}
              <ChevronRight className="h-4 w-4 text-[var(--cs-text-gentle)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Type */}
            <Badge variant="outline" className="text-[10px] rounded-full">
              <FileText className="h-3 w-3 mr-0.5" />
              {CARE_FORM_TYPE_LABELS[form.form_type as keyof typeof CARE_FORM_TYPE_LABELS] ?? form.form_type}
            </Badge>

            {/* Status */}
            <Badge className={cn("text-[10px] rounded-full border-0", stat.bgColor, stat.color)}>
              {stat.label}
            </Badge>

            {/* Priority */}
            <Badge className={cn("text-[10px] rounded-full border-0", prio.color)}>{prio.label}</Badge>

            {/* Due date */}
            {form.due_date && (
              <span className={cn("text-[11px] font-medium flex items-center gap-1", isOverdue ? "text-red-600" : "text-[var(--cs-text-muted)]")}>
                <CalendarDays className="h-3 w-3" />{formatRelative(form.due_date)}
              </span>
            )}

            {/* Linked child */}
            {childName && (
              <Badge variant="purple" className="text-[9px] rounded-full gap-0.5">
                <Heart className="h-3 w-3" />{childName}
              </Badge>
            )}

            {/* Tags */}
            {form.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] text-[var(--cs-text-muted)] bg-slate-50 rounded-full px-2 py-0.5 border border-[var(--cs-border)]">
                #{tag}
              </span>
            ))}
          </div>

          {/* Footer: submitted by + approve action */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {submitterName ? (
                <>
                  <Avatar name={submitterName} size="xs" />
                  <span className="text-xs text-[var(--cs-text-muted)]">Submitted by {submitterName}</span>
                  {form.submitted_at && (
                    <span className="text-[11px] text-[var(--cs-text-muted)]">{formatRelative(form.submitted_at.slice(0, 10))}</span>
                  )}
                </>
              ) : (
                <span className="text-xs text-[var(--cs-text-muted)] italic">Not yet submitted</span>
              )}
            </div>
            {/* Quick approve for managers */}
            {canApprove && (form.status === "submitted" || form.status === "pending_review") && (
              <Badge variant="warning" className="text-[10px] rounded-full cursor-pointer hover:bg-amber-200 transition-colors">
                Needs review
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section header for grouped views ─────────────────────────────────────────

function GroupHeader({ title, count, icon: Icon }: { title: string; count: number; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <Icon className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
      <span className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">{title}</span>
      <span className="text-[10px] text-[var(--cs-text-muted)] bg-slate-100 rounded-full px-1.5 py-0.5 tabular-nums">{count}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function FormsPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupMode>("none");
  const [sortBy, setSortBy] = useState<"date" | "title" | "priority" | "status">("date");
  const today = todayStr();

  const formsQuery = useForms();
  const forms: CareForm[] = formsQuery.data?.data ?? [];
  const meta = formsQuery.data?.meta;

  const filtered = useMemo(() => {
    let list = forms;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((f) =>
        f.title.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q) ||
        f.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filterStatus)   list = list.filter((f) => f.status === filterStatus);
    if (filterType)     list = list.filter((f) => f.form_type === filterType);
    if (filterPriority) list = list.filter((f) => f.priority === filterPriority);
    const pOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "title": return a.title.localeCompare(b.title);
        case "priority": return (pOrder[a.priority] ?? 4) - (pOrder[b.priority] ?? 4);
        case "status": return a.status.localeCompare(b.status);
        default: return (b.created_at || "").localeCompare(a.created_at || "");
      }
    });
  }, [forms, search, filterStatus, filterType, filterPriority, sortBy]);

  // Group forms for timeline/type view
  const grouped = useMemo(() => {
    if (groupBy === "none") return null;

    const groups = new Map<string, CareForm[]>();

    if (groupBy === "timeline") {
      for (const form of filtered) {
        const dateForBucket = form.submitted_at?.slice(0, 10) ?? form.due_date ?? form.created_at?.slice(0, 10) ?? null;
        const bucket = getTimelineBucket(dateForBucket, today);
        if (!groups.has(bucket)) groups.set(bucket, []);
        groups.get(bucket)!.push(form);
      }
      // Sort by timeline order
      const sorted = new Map<string, CareForm[]>();
      for (const key of TIMELINE_ORDER) {
        if (groups.has(key)) sorted.set(key, groups.get(key)!);
      }
      return sorted;
    }

    if (groupBy === "type") {
      for (const form of filtered) {
        const typeLabel = CARE_FORM_TYPE_LABELS[form.form_type as keyof typeof CARE_FORM_TYPE_LABELS] ?? form.form_type;
        if (!groups.has(typeLabel)) groups.set(typeLabel, []);
        groups.get(typeLabel)!.push(form);
      }
      // Sort by count descending
      const sorted = new Map([...groups.entries()].sort((a, b) => b[1].length - a[1].length));
      return sorted;
    }

    return null;
  }, [filtered, groupBy, today]);

  const clearFilters = () => { setSearch(""); setFilterStatus(null); setFilterType(null); setFilterPriority(null); };
  const hasFilters = search || filterStatus || filterType || filterPriority;

  const canApprove = can(PERMISSIONS.APPROVE_FORMS);

  // Count overdue forms for the alert banner
  const overdueCount = useMemo(() =>
    forms.filter((f) => f.due_date && f.due_date < today && f.status !== "approved" && f.status !== "archived").length,
  [forms, today]);

  // Count pending review
  const pendingCount = useMemo(() =>
    forms.filter((f) => f.status === "submitted" || f.status === "pending_review").length,
  [forms]);

  if (formsQuery.isError) {
    return (
      <PageShell title="Care Forms" quickCreateContext={FORMS_QUICK_CREATE_CONTEXT}>
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-sm font-medium text-[var(--cs-text-secondary)]">Failed to load forms</p>
          <Button size="sm" variant="outline" onClick={() => formsQuery.refetch()}>Retry</Button>
        </div>
      </PageShell>
    );
  }

  const renderFormsList = (formsList: CareForm[]) =>
    formsList.map((form) => (
      <FormCard
        key={form.id}
        form={form}
        today={today}
        canApprove={canApprove}
        onClick={() => router.push(`/forms/${form.id}`)}
      />
    ));

  return (
    <PageShell
      title="Care Forms"
      subtitle={`${filtered.length} form${filtered.length !== 1 ? "s" : ""} ${hasFilters ? "(filtered)" : ""}`}
      ariaContext={{ pageTitle: "Care Forms", sourceType: "document" }}
      quickCreateContext={FORMS_QUICK_CREATE_CONTEXT}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={FORM_EXPORT_COLS} filename="care-forms" />
          <PrintButton title="Care Forms" subtitle="Oak House — Forms Registry" targetId="forms-content" />
          <SmartUploadButton variant="inline" label="Upload Document" uploadContext="Forms — supporting document upload" />
          <AriaStudioQuickActionButton context={{ record_type: "uploaded_document", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="forms-content" className="space-y-5 animate-fade-in">

        {/* ── Overdue alert banner ────────────────────────────────────────── */}
        {overdueCount > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-1.5">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                {overdueCount} form{overdueCount !== 1 ? "s" : ""} overdue
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Overdue forms require immediate attention — review and complete or escalate.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => { setFilterStatus(null); setFilterPriority(null); setFilterType(null); setSearch(""); }}
            >
              View all
            </Button>
          </div>
        )}

        {/* ── Manager review prompt ──────────────────────────────────────── */}
        {canApprove && pendingCount > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3">
            <div className="rounded-full bg-amber-100 p-1.5">
              <ClipboardList className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">
                {pendingCount} form{pendingCount !== 1 ? "s" : ""} awaiting your review
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Staff have submitted forms that need manager approval.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => { setFilterStatus("pending_review"); setFilterPriority(null); setFilterType(null); setSearch(""); }}
            >
              Review now
            </Button>
          </div>
        )}

        {/* ── Summary stats ──────────────────────────────────────────────── */}
        {meta && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total"           value={meta.total}          icon={FileText} />
            <StatCard label="Draft"           value={meta.draft}          icon={Pencil} />
            <StatCard label="Awaiting Review" value={meta.pending_review} icon={Clock}          highlight />
            <StatCard label="Approved"        value={meta.approved}       icon={CheckCircle2} />
            <StatCard label="Overdue"         value={meta.overdue}        icon={AlertTriangle}  highlight />
            <StatCard label="Urgent"          value={meta.urgent}         icon={AlertCircle}    highlight />
          </div>
        )}

        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cs-text-muted)]" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search forms…" className="pl-9" />
          </div>

          {/* Status filter */}
          <div className="flex gap-1 flex-wrap">
            {(["draft", "submitted", "pending_review", "approved", "rejected"] as const).map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <Button
                  key={s} size="sm"
                  variant={filterStatus === s ? "default" : "outline"}
                  onClick={() => setFilterStatus(filterStatus === s ? null : s)}
                  className="gap-1"
                >
                  {cfg.label}
                </Button>
              );
            })}
          </div>

          {/* Type filter */}
          <select
            value={filterType || ""}
            onChange={(e) => setFilterType(e.target.value || null)}
            className="h-8 rounded-lg border border-[var(--cs-border)] bg-white px-2 text-xs text-[var(--cs-text-secondary)] outline-none"
          >
            <option value="">All types</option>
            {CARE_FORM_TYPES.map((t) => (
              <option key={t} value={t}>{CARE_FORM_TYPE_LABELS[t]}</option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={filterPriority || ""}
            onChange={(e) => setFilterPriority(e.target.value || null)}
            className="h-8 rounded-lg border border-[var(--cs-border)] bg-white px-2 text-xs text-[var(--cs-text-secondary)] outline-none"
          >
            <option value="">All priorities</option>
            {(["urgent", "high", "medium", "low"] as const).map((p) => (
              <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>

          {/* Sort */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)]">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="h-8 rounded-lg border border-[var(--cs-border)] bg-white px-2 text-xs text-[var(--cs-text-secondary)] outline-none"
            >
              <option value="date">Date</option>
              <option value="title">Title</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </div>

          {/* Grouping toggle */}
          <div className="flex gap-0.5 rounded-lg border border-[var(--cs-border)] bg-white p-0.5">
            <button
              onClick={() => setGroupBy("none")}
              className={cn("rounded-md px-2 py-1 text-xs transition-colors", groupBy === "none" ? "bg-slate-900 text-white" : "text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]")}
            >
              <LayoutList className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setGroupBy("timeline")}
              className={cn("rounded-md px-2 py-1 text-xs transition-colors", groupBy === "timeline" ? "bg-slate-900 text-white" : "text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]")}
              title="Group by timeline"
            >
              <Calendar className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setGroupBy("type")}
              className={cn("rounded-md px-2 py-1 text-xs transition-colors", groupBy === "type" ? "bg-slate-900 text-white" : "text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]")}
              title="Group by form type"
            >
              <FolderOpen className="h-3.5 w-3.5" />
            </button>
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <RotateCcw className="h-3.5 w-3.5" />Clear
            </Button>
          )}
        </div>

        {/* ── Loading skeleton ─────────────────────────────────────────────── */}
        {formsQuery.isLoading && (
          <div className="flex items-center justify-center py-16 gap-2 text-[var(--cs-text-muted)]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading forms…</span>
          </div>
        )}

        {/* ── Forms list ───────────────────────────────────────────────────── */}
        {!formsQuery.isLoading && (
          <div className="space-y-2">
            {/* Flat list */}
            {groupBy === "none" && renderFormsList(filtered)}

            {/* Grouped view */}
            {grouped && Array.from(grouped.entries()).map(([groupName, groupForms]) => (
              <div key={groupName} className="space-y-2">
                <GroupHeader
                  title={groupName}
                  count={groupForms.length}
                  icon={groupBy === "timeline" ? Calendar : FolderOpen}
                />
                {renderFormsList(groupForms)}
              </div>
            ))}

            {/* Empty state */}
            {!formsQuery.isLoading && filtered.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-[var(--cs-border)] p-12 text-center">
                <FileText className="h-8 w-8 text-[var(--cs-text-gentle)] mx-auto mb-3" />
                <div className="text-sm font-medium text-[var(--cs-text-muted)]">No forms match your filters</div>
                <div className="text-xs text-[var(--cs-text-muted)] mt-1">Try adjusting your search or filters, or create a new form</div>
              </div>
            )}
          </div>
        )}

        {/* ── Form type distribution (below list) ──────────────────────────── */}
        {!formsQuery.isLoading && filtered.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center gap-2">
                <CircleDot className="h-4 w-4 text-indigo-500" />
                Form Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(
                  filtered.reduce<Record<string, number>>((acc, f) => {
                    const label = CARE_FORM_TYPE_LABELS[f.form_type as keyof typeof CARE_FORM_TYPE_LABELS] ?? f.form_type;
                    acc[label] = (acc[label] ?? 0) + 1;
                    return acc;
                  }, {})
                )
                  .sort((a, b) => b[1] - a[1])
                  .map(([label, count]) => (
                    <div key={label} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                      <FileText className="h-3 w-3 text-[var(--cs-text-muted)] shrink-0" />
                      <span className="text-[11px] text-[var(--cs-text-secondary)] truncate flex-1">{label}</span>
                      <span className="text-[11px] font-bold text-[var(--cs-text-secondary)] tabular-nums">{count}</span>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Care Forms — statutory forms, consent forms, placement forms, review forms, LAC forms, PEP forms, health assessment forms, complaints forms, referral forms, Ofsted forms"
        recordType="uploaded_document"
        className="mt-6"
      />
    </PageShell>
  );
}
