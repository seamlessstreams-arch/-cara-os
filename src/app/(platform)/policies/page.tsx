"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — POLICIES & PROCEDURES
// Centralised register of all home policies required by Children's Homes
// Regulations 2015 & Quality Standards 2015. Tracks version history,
// review dates, responsible owners, and staff read-acknowledgements.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn, formatDate, todayStr } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { getStaffName } from "@/lib/seed-data";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { useHomePolicies } from "@/hooks/use-home-policies";
import type { HomePolicy, HomePolicyCategory, HomePolicyStatus } from "@/types/extended";
import { HOME_POLICY_CATEGORY_LABEL, HOME_POLICY_STATUS_LABEL } from "@/types/extended";
import {
  FileText, Search, Filter, ArrowUpDown, CheckCircle2, AlertTriangle,
  Clock, ChevronDown, ChevronUp, Eye, Shield, Users, Calendar, Download,
  BookOpen, Loader2, RefreshCw, Star, Lock, UserCheck, Pencil,
} from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<HomePolicyCategory, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  safeguarding:     { label: "Safeguarding",       icon: Shield,      color: "text-red-600",      bg: "bg-red-50",      border: "border-red-200"     },
  care_practice:    { label: "Care Practice",       icon: BookOpen,    color: "text-indigo-600",   bg: "bg-indigo-50",   border: "border-indigo-200"  },
  health_safety:    { label: "Health & Safety",     icon: CheckCircle2,color: "text-emerald-600",  bg: "bg-emerald-50",  border: "border-emerald-200" },
  workforce:        { label: "Workforce",           icon: Users,       color: "text-teal-600",     bg: "bg-teal-50",     border: "border-teal-200"    },
  behaviour:        { label: "Behaviour Support",   icon: Star,        color: "text-amber-600",    bg: "bg-amber-50",    border: "border-amber-200"   },
  complaints:       { label: "Complaints",          icon: FileText,    color: "text-[var(--cs-aria-gold)]",   bg: "bg-[var(--cs-aria-gold-bg)]",   border: "border-[var(--cs-aria-gold-soft)]"  },
  data_protection:  { label: "Data Protection",     icon: Lock,        color: "text-[var(--cs-text-secondary)]",    bg: "bg-slate-50",    border: "border-[var(--cs-border)]"   },
  admissions:       { label: "Admissions",          icon: UserCheck,   color: "text-blue-600",     bg: "bg-blue-50",     border: "border-blue-200"    },
  missing_persons:  { label: "Missing Persons",     icon: AlertTriangle,color: "text-orange-600",  bg: "bg-orange-50",   border: "border-orange-200"  },
  medication:       { label: "Medication",          icon: FileText,    color: "text-pink-600",     bg: "bg-pink-50",     border: "border-pink-200"    },
  fire_safety:      { label: "Fire Safety",         icon: AlertTriangle,color: "text-red-600",     bg: "bg-red-50",      border: "border-red-200"     },
  lone_working:     { label: "Lone Working",        icon: Users,       color: "text-[var(--cs-text-secondary)]",    bg: "bg-slate-50",    border: "border-[var(--cs-border)]"   },
  whistleblowing:   { label: "Whistleblowing",      icon: Shield,      color: "text-indigo-600",   bg: "bg-indigo-50",   border: "border-indigo-200"  },
};

const STATUS_CONFIG: Record<HomePolicyStatus, { label: string; cls: string }> = {
  current:    { label: "Current",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  due_review: { label: "Due Review",  cls: "bg-amber-50 text-amber-700 border-amber-200"      },
  overdue:    { label: "Overdue",     cls: "bg-red-50 text-red-700 border-red-200"             },
  draft:      { label: "Draft",       cls: "bg-slate-50 text-[var(--cs-text-secondary)] border-[var(--cs-border)]"       },
  archived:   { label: "Archived",    cls: "bg-slate-50 text-[var(--cs-text-muted)] border-[var(--cs-border)]"       },
};

const POLICY_EXPORT_COLS: ExportColumn<HomePolicy>[] = [
  { header: "Title", accessor: (p) => p.title },
  { header: "Category", accessor: (p) => CATEGORY_CONFIG[p.category].label },
  { header: "Version", accessor: (p) => p.version },
  { header: "Status", accessor: (p) => STATUS_CONFIG[p.status].label },
  { header: "Owner", accessor: (p) => getStaffName(p.owner_id) },
  { header: "Effective Date", accessor: (p) => p.effective_date },
  { header: "Next Review", accessor: (p) => p.next_review_date },
  { header: "Last Reviewed", accessor: (p) => p.last_reviewed ?? "—" },
  { header: "Statutory Basis", accessor: (p) => p.statutory_basis },
  { header: "Linked Standard", accessor: (p) => p.linked_standard },
  { header: "Read %", accessor: (p) => `${Math.round((p.read_acknowledgements.filter((a) => a.acknowledged).length / p.total_staff_required) * 100)}%` },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

// ── Policy Card ──────────────────────────────────────────────────────────────

function PolicyCard({ policy }: { policy: HomePolicy }) {
  const [expanded, setExpanded] = useState(false);
  const catCfg = CATEGORY_CONFIG[policy.category];
  const CatIcon = catCfg.icon;
  const stCfg = STATUS_CONFIG[policy.status];
  const readCount = policy.read_acknowledgements.filter((a) => a.acknowledged).length;
  const readPct = Math.round((readCount / policy.total_staff_required) * 100);
  const reviewDays = daysUntil(policy.next_review_date);

  return (
    <div className={cn(
      "rounded-2xl border bg-white overflow-hidden transition-all",
      policy.status === "overdue" ? "border-red-200" :
      policy.status === "due_review" ? "border-amber-200" :
      policy.status === "draft" ? "border-[var(--cs-border)] border-dashed" :
      "border-[var(--cs-border)]",
    )}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", catCfg.bg)}>
          <CatIcon className={cn("h-4 w-4", catCfg.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-[var(--cs-navy)]">{policy.title}</span>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", stCfg.cls)}>
              {stCfg.label}
            </Badge>
            <span className="text-[10px] text-[var(--cs-text-muted)] font-mono">v{policy.version}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--cs-text-muted)] flex-wrap">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />Owner: {getStaffName(policy.owner_id)}
            </span>
            <span>·</span>
            <span className={cn(
              "flex items-center gap-1",
              reviewDays < 0 ? "text-red-600 font-semibold" :
              reviewDays <= 30 ? "text-amber-600" :
              "text-[var(--cs-text-muted)]",
            )}>
              <Calendar className="h-3 w-3" />
              {reviewDays < 0
                ? `Review ${Math.abs(reviewDays)}d overdue`
                : reviewDays === 0
                  ? "Review due today"
                  : `Review in ${reviewDays}d`}
            </span>
            <span>·</span>
            <span className={cn(
              "flex items-center gap-1",
              readPct === 100 ? "text-emerald-600" :
              readPct >= 75 ? "text-amber-600" :
              "text-red-600",
            )}>
              <Eye className="h-3 w-3" />{readCount}/{policy.total_staff_required} read ({readPct}%)
            </span>
          </div>

          {/* Read progress bar */}
          <div className="mt-2 max-w-xs">
            <Progress value={readPct} className="h-1.5" />
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] shrink-0"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-[var(--cs-border-subtle)] px-4 pb-4 pt-3 space-y-3">
          {/* Description */}
          <div className="rounded-xl border border-[var(--cs-border)] bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-1">Description</p>
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{policy.description}</p>
          </div>

          {/* Key points */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
            <p className="text-[10px] font-semibold text-indigo-700 uppercase tracking-widest mb-2">Key Points</p>
            <ul className="space-y-1">
              {policy.key_points.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[var(--cs-text-secondary)]">
                  <CheckCircle2 className="h-3 w-3 text-indigo-500 shrink-0 mt-0.5" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Statutory basis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--cs-border)] bg-white p-3">
              <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-1">Statutory Basis</p>
              <p className="text-xs text-[var(--cs-text-secondary)]">{policy.statutory_basis}</p>
            </div>
            <div className="rounded-xl border border-[var(--cs-border)] bg-white p-3">
              <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-1">Linked Quality Standard</p>
              <p className="text-xs text-[var(--cs-text-secondary)]">{policy.linked_standard}</p>
            </div>
          </div>

          {/* Read acknowledgements */}
          <div>
            <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-2">Staff Read Status</p>
            <div className="flex flex-wrap gap-2">
              {policy.read_acknowledgements.map((ack) => (
                <div
                  key={ack.staff_id}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium",
                    ack.acknowledged
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-red-50 border-red-200 text-red-700",
                  )}
                >
                  {ack.acknowledged ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {getStaffName(ack.staff_id)}
                </div>
              ))}
            </div>
          </div>

          {/* Version & dates */}
          <div className="flex items-center gap-4 text-[10px] text-[var(--cs-text-muted)] flex-wrap">
            {policy.approved_by && (
              <span>Approved by {getStaffName(policy.approved_by)} on {formatDate(policy.approved_date!)}</span>
            )}
            <span>Effective {formatDate(policy.effective_date)}</span>
            {policy.last_reviewed && (
              <span>Last reviewed {formatDate(policy.last_reviewed)}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

type ViewTab = "all" | "current" | "due_review" | "overdue";

export default function PoliciesPage() {
  const { data: policies = [], isLoading } = useHomePolicies();

  const [viewTab, setViewTab] = useState<ViewTab>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "review" | "read" | "category">("review");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Computed statuses — override seed status based on real dates
  const enrichedPolicies = useMemo(() => {
    const today = todayStr();
    return policies.map((p) => {
      let status = p.status;
      if (status !== "draft" && status !== "archived") {
        if (p.next_review_date < today) status = "overdue";
        else if (daysUntil(p.next_review_date) <= 30) status = "due_review";
        else status = "current";
      }
      return { ...p, status } as HomePolicy;
    });
  }, [policies]);

  // Counts
  const currentCount = enrichedPolicies.filter((p) => p.status === "current").length;
  const dueReviewCount = enrichedPolicies.filter((p) => p.status === "due_review").length;
  const overdueCount = enrichedPolicies.filter((p) => p.status === "overdue").length;
  const draftCount = enrichedPolicies.filter((p) => p.status === "draft").length;

  // Overall read compliance
  const overallReadPct = useMemo(() => {
    const total = enrichedPolicies.reduce((acc, p) => acc + p.total_staff_required, 0);
    const read = enrichedPolicies.reduce((acc, p) => acc + p.read_acknowledgements.filter((a) => a.acknowledged).length, 0);
    return total > 0 ? Math.round((read / total) * 100) : 0;
  }, [enrichedPolicies]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of enrichedPolicies) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [enrichedPolicies]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = enrichedPolicies;

    // Tab
    switch (viewTab) {
      case "current": list = list.filter((p) => p.status === "current"); break;
      case "due_review": list = list.filter((p) => p.status === "due_review"); break;
      case "overdue": list = list.filter((p) => p.status === "overdue"); break;
    }

    // Category
    if (categoryFilter !== "all") list = list.filter((p) => p.category === categoryFilter);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.statutory_basis.toLowerCase().includes(q) ||
        CATEGORY_CONFIG[p.category].label.toLowerCase().includes(q)
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "title": return a.title.localeCompare(b.title);
        case "category": return CATEGORY_CONFIG[a.category].label.localeCompare(CATEGORY_CONFIG[b.category].label);
        case "read": {
          const aPct = a.read_acknowledgements.filter((x) => x.acknowledged).length / a.total_staff_required;
          const bPct = b.read_acknowledgements.filter((x) => x.acknowledged).length / b.total_staff_required;
          return aPct - bPct; // least read first
        }
        default: // review date — soonest first
          return a.next_review_date.localeCompare(b.next_review_date);
      }
    });

    return list;
  }, [enrichedPolicies, viewTab, categoryFilter, search, sortBy]);

  if (isLoading) {
    return (
      <PageShell title="Policies & Procedures" subtitle="All home policies — version control, review dates, and staff read-acknowledgements">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Policies & Procedures"
      subtitle="All home policies — version control, review dates, and staff read-acknowledgements"
      quickCreateContext={{ module: "compliance", defaultTaskCategory: "compliance" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={POLICY_EXPORT_COLS} filename="policies" />
          <PrintButton title="Policies & Procedures" subtitle="Oak House — Policies Register" targetId="policies-content" />
          <SmartUploadButton variant="inline" label="Upload Policy" uploadContext="Policies & Procedures — policy document upload" />
        </div>
      }
    >
      <div id="policies-content" className="space-y-5 animate-fade-in">

        {/* ── Summary stats ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total Policies", value: enrichedPolicies.length, colour: "text-[var(--cs-text-secondary)]", bg: "bg-slate-50 border-[var(--cs-border-subtle)]", icon: FileText },
            { label: "Current", value: currentCount, colour: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", icon: CheckCircle2 },
            { label: "Due Review", value: dueReviewCount, colour: dueReviewCount > 0 ? "text-amber-600" : "text-emerald-600", bg: dueReviewCount > 0 ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100", icon: Clock },
            { label: "Overdue", value: overdueCount, colour: overdueCount > 0 ? "text-red-600" : "text-emerald-600", bg: overdueCount > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100", icon: AlertTriangle },
            { label: "Staff Read %", value: `${overallReadPct}%`, colour: overallReadPct >= 90 ? "text-emerald-600" : overallReadPct >= 70 ? "text-amber-600" : "text-red-600", bg: overallReadPct >= 90 ? "bg-emerald-50 border-emerald-100" : overallReadPct >= 70 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100", icon: Eye },
          ].map(({ label, value, colour, bg, icon: Icon }) => (
            <div key={label} className={cn("rounded-2xl border p-4 text-center", bg)}>
              <Icon className={cn("h-4 w-4 mx-auto mb-1", colour)} />
              <div className={cn("text-2xl font-bold tabular-nums", colour)}>{value}</div>
              <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Overdue alert ────────────────────────────────────────────────── */}
        {overdueCount > 0 && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-800">
                {overdueCount} polic{overdueCount !== 1 ? "ies" : "y"} overdue for review
              </p>
              <p className="text-[11px] text-red-700 mt-0.5">
                Overdue policies are a common Ofsted finding. Review and update these as a priority.
              </p>
            </div>
          </div>
        )}

        {/* ── Tab bar + search ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search policies, standards, legislation…"
              className="pl-9 h-8 text-xs"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            {([
              { key: "all" as const, label: `All (${enrichedPolicies.length})` },
              { key: "current" as const, label: `Current (${currentCount})` },
              { key: "due_review" as const, label: `Due Review (${dueReviewCount})` },
              { key: "overdue" as const, label: `Overdue (${overdueCount})` },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setViewTab(key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  viewTab === key
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-[var(--cs-border)] bg-white px-2.5 py-1 text-[11px] text-[var(--cs-text-secondary)] focus:border-[var(--cs-aria-gold)] focus:ring-1 focus:ring-[var(--cs-aria-gold)]/30 outline-none"
            >
              <option value="all">All categories</option>
              {(Object.entries(CATEGORY_CONFIG) as [HomePolicyCategory, typeof CATEGORY_CONFIG[HomePolicyCategory]][]).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label} ({categoryCounts[key] ?? 0})</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-[var(--cs-border)] bg-white px-2.5 py-1 text-[11px] text-[var(--cs-text-secondary)] focus:border-[var(--cs-aria-gold)] focus:ring-1 focus:ring-[var(--cs-aria-gold)]/30 outline-none"
            >
              <option value="review">Review date (soonest first)</option>
              <option value="title">Title A–Z</option>
              <option value="category">Category</option>
              <option value="read">Read % (lowest first)</option>
            </select>
          </div>
          {(search || categoryFilter !== "all") && (
            <p className="text-xs text-[var(--cs-text-muted)] ml-auto">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* ── Policies list ────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[var(--cs-text-muted)]">
            <FileText className="h-10 w-10 text-[var(--cs-text-gentle)] mx-auto mb-3" />
            <p className="text-sm font-medium">
              {search ? `No policies match "${search}"` : "No policies in this view"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((policy) => (
              <PolicyCard key={policy.id} policy={policy} />
            ))}
          </div>
        )}

        {/* ── Regulatory note ──────────────────────────────────────────────── */}
        <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50 px-4 py-3 text-xs text-[var(--cs-text-muted)]">
          <span className="font-semibold text-[var(--cs-text-secondary)]">Regulatory Basis — </span>
          Children&apos;s Homes Regulations 2015, Reg 16 (Statement of Purpose) requires that the home
          has clear policies covering all aspects of care. Quality Standard 14 (Financial Viability &amp;
          Governance) requires policies to be current, reviewed regularly, understood by all staff, and
          effectively implemented. Ofsted inspectors routinely check that policies are up to date,
          that staff can evidence their understanding of key policies, and that practice reflects written policy.
          All policies should be reviewed at least annually — critical policies (safeguarding, medication, PI)
          should be reviewed 6-monthly.
        </div>
      </div>
    </PageShell>
  );
}
