"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — POLICY REVIEW TRACKER
// Tracks the review cycle of all policies — when each was last reviewed, when
// it's next due, who's responsible, version history, and staff sign-off status.
// Ensures compliance with Regulation 36 (policies and procedures) and supports
// Ofsted's expectation that policies are reviewed, updated, and understood by
// all staff.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { usePolicyReviewRecords } from "@/hooks/use-policy-review-records";
import type { PolicyReviewRecord, PolicyReviewCycle, PolicyReviewStatus } from "@/types/extended";
import { POLICY_REVIEW_CYCLE_LABEL, POLICY_REVIEW_STATUS_LABEL } from "@/types/extended";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, AlertOctagon, Shield, ShieldCheck,
  CheckCircle2, Clock, Calendar, FileText, BookOpen,
  User, Users, PenLine, History, Loader2,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PolicyReviewStatus, { label: string; colour: string }> = {
  current:  { label: "Current",  colour: "bg-green-100 text-green-700" },
  due_soon: { label: "Due Soon", colour: "bg-amber-100 text-amber-700" },
  overdue:  { label: "Overdue",  colour: "bg-red-100 text-red-700" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const dt = new Date(iso);
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function PolicyReviewTrackerPage() {
  const { data: policies = [], isLoading } = usePolicyReviewRecords();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<PolicyReviewStatus | "all">("all");
  const [filterOwner, setFilterOwner] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"next_review" | "name">("next_review");

  // ── Filtering & Sorting ───────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let results = [...policies];

    if (filterStatus !== "all") {
      results = results.filter(p => p.status === filterStatus);
    }
    if (filterOwner !== "all") {
      results = results.filter(p => p.owner === filterOwner);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(p =>
        p.title.toLowerCase().includes(q) ||
        getStaffName(p.owner).toLowerCase().includes(q) ||
        p.changes.toLowerCase().includes(q)
      );
    }

    if (sortBy === "next_review") {
      results.sort((a, b) => new Date(a.next_review_date).getTime() - new Date(b.next_review_date).getTime());
    } else {
      results.sort((a, b) => a.title.localeCompare(b.title));
    }

    return results;
  }, [policies, filterStatus, filterOwner, searchQuery, sortBy]);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = policies.length;
    const overdue = policies.filter(p => p.status === "overdue").length;
    const dueSoon = policies.filter(p => p.status === "due_soon").length;
    const fullySigned = policies.filter(p => p.staff_signed === p.staff_total).length;
    return { total, overdue, dueSoon, fullySigned };
  }, [policies]);

  // ── Export Columns ────────────────────────────────────────────────────────

  const exportCols: ExportColumn<PolicyReviewRecord>[] = [
    { header: "Policy", accessor: (r) => r.title },
    { header: "Owner", accessor: (r) => getStaffName(r.owner) },
    { header: "Version", accessor: (r) => r.version },
    { header: "Review Cycle", accessor: (r) => POLICY_REVIEW_CYCLE_LABEL[r.review_cycle] },
    { header: "Last Reviewed", accessor: (r) => r.last_review_date },
    { header: "Next Due", accessor: (r) => r.next_review_date },
    { header: "Days Until Due", accessor: (r) => daysUntil(r.next_review_date).toString() },
    { header: "Status", accessor: (r) => STATUS_CONFIG[r.status].label },
    { header: "Staff Signed", accessor: (r) => `${r.staff_signed}/${r.staff_total}` },
    { header: "Last Changes", accessor: (r) => r.changes },
    { header: "Approved By", accessor: (r) => getStaffName(r.approved_by) },
  ];

  if (isLoading) {
    return (
      <PageShell title="Policy Review Tracker" subtitle="Monitor review cycles, version history, and staff sign-off for all home policies">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Policy Review Tracker"
      subtitle="Monitor review cycles, version history, and staff sign-off for all home policies"
      caraContext={{ pageTitle: "Policy Review Tracker", sourceType: "document" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Policy Review Tracker" subtitle="Chamberlain House — Policy Management" />
          <ExportButton data={filtered} columns={exportCols} filename="policy-review-tracker" />
          <CaraStudioQuickActionButton context={{ record_type: "policy", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── Summary Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Policies", value: stats.total, icon: BookOpen, c: "text-blue-600" },
          { label: "Overdue", value: stats.overdue, icon: AlertOctagon, c: "text-red-600" },
          { label: "Due Within 30 Days", value: stats.dueSoon, icon: AlertTriangle, c: "text-amber-600" },
          { label: "Fully Signed", value: stats.fullySigned, icon: CheckCircle2, c: "text-green-600" },
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

      {/* ── Overdue Alert Banner ───────────────────────────────────────────── */}
      {stats.overdue > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 mb-6 flex items-center gap-3">
          <AlertOctagon className="h-5 w-5 text-red-600 shrink-0" />
          <div className="text-sm text-red-800 dark:text-red-300">
            <strong>{stats.overdue} polic{stats.overdue > 1 ? "ies" : "y"} overdue!</strong>{" "}
            Overdue policies must be reviewed immediately. Ofsted expects all policies to be current, regularly reviewed, and fully understood by staff. Failure to maintain up-to-date policies may result in regulatory action.
          </div>
        </div>
      )}

      {/* ── Filters & Search ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search policies..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as PolicyReviewStatus | "all")}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="current">Current</option>
            <option value="due_soon">Due Soon</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <select
          value={filterOwner}
          onChange={e => setFilterOwner(e.target.value)}
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          <option value="all">All Owners</option>
          <option value="staff_darren">Darren (RM)</option>
          <option value="staff_ryan">Ryan (Deputy)</option>
        </select>

        <button
          onClick={() => setSortBy(sortBy === "next_review" ? "name" : "next_review")}
          className="flex items-center gap-1 rounded-md border bg-background px-2 py-1.5 text-sm hover:bg-muted transition-colors"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {sortBy === "next_review" ? "By Due Date" : "By Name"}
        </button>
      </div>

      {/* ── Policy List ────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No policies found</p>
          </div>
        )}

        {filtered.map(policy => {
          const isOpen = expandedId === policy.id;
          const sc = STATUS_CONFIG[policy.status];
          const days = daysUntil(policy.next_review_date);
          const signedAll = policy.staff_signed === policy.staff_total;

          return (
            <div key={policy.id} className={cn("rounded-lg border bg-card overflow-hidden",
              policy.status === "overdue" && "border-red-200",
              policy.status === "due_soon" && "border-amber-200"
            )}>
              <button onClick={() => setExpandedId(isOpen ? null : policy.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors">
                <div className={cn("rounded-full p-1.5 shrink-0",
                  policy.status === "overdue" ? "bg-red-100 text-red-700" :
                  policy.status === "due_soon" ? "bg-amber-100 text-amber-700" :
                  "bg-blue-100 text-blue-700"
                )}>
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{policy.title}</span>
                    <Badge variant="outline" className="text-xs">v{policy.version}</Badge>
                    <Badge variant="outline" className={cn("text-xs", sc.colour)}>{sc.label}</Badge>
                    {!signedAll && (
                      <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700">
                        <Users className="h-3 w-3 mr-0.5" />
                        {policy.staff_signed}/{policy.staff_total} signed
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Next review: {formatDate(policy.next_review_date)}
                    {" · "}
                    {days < 0
                      ? <span className="text-red-600 font-semibold">{Math.abs(days)} days overdue</span>
                      : days <= 30
                        ? <span className="text-amber-600 font-semibold">{days} days remaining</span>
                        : <span>{days} days remaining</span>
                    }
                    {" · "}
                    Owner: {getStaffName(policy.owner)}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Version</p>
                      <p className="text-sm">{policy.version}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Review Cycle</p>
                      <p className="text-sm">{POLICY_REVIEW_CYCLE_LABEL[policy.review_cycle]}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Approved By</p>
                      <p className="text-sm">{getStaffName(policy.approved_by)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Last Reviewed</p>
                      <p className="text-sm">{formatDate(policy.last_review_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Next Due</p>
                      <p className="text-sm">{formatDate(policy.next_review_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Staff Sign-Off</p>
                      <p className="text-sm">
                        <span className={cn(signedAll ? "text-green-600" : "text-orange-600", "font-medium")}>
                          {policy.staff_signed}/{policy.staff_total}
                        </span>
                        {signedAll ? " — All staff signed" : " — Incomplete"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Summary of Last Changes</p>
                    <p className="text-sm">{policy.changes}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span><User className="inline h-3.5 w-3.5 mr-0.5" />Owner: {getStaffName(policy.owner)}</span>
                    <span><History className="inline h-3.5 w-3.5 mr-0.5" />v{policy.version}</span>
                    <span><Calendar className="inline h-3.5 w-3.5 mr-0.5" />Due: {formatDate(policy.next_review_date)}</span>
                    <span><PenLine className="inline h-3.5 w-3.5 mr-0.5" />Cycle: {POLICY_REVIEW_CYCLE_LABEL[policy.review_cycle]}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Regulatory Context ─────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-dashed p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">Regulatory Context</p>
            <p>
              <strong>Regulation 36 (Policies and Procedures)</strong> requires the registered person to
              prepare and implement policies for the matters set out in Schedule 5 of the Children&apos;s
              Homes (England) Regulations 2015. These policies must be kept under review and revised where
              appropriate.
            </p>
            <p>
              Ofsted expects that all policies are regularly reviewed, remain current and reflective of
              practice, and are fully understood by all staff. Inspectors will check that policies are not
              merely &quot;paper exercises&quot; but are actively embedded in the home&apos;s culture. Staff
              sign-off provides evidence that the team has read, understood, and committed to each policy.
              Overdue reviews or incomplete sign-offs may indicate a leadership and management shortfall.
            </p>
          </div>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Policy Review Tracker — policy due dates, review cycles, last reviewed date, version control, policy owner, regulatory requirement, Ofsted evidence, quality assurance"
        recordType="policy"
        className="mt-6"
      />
    </PageShell>
  );
}
