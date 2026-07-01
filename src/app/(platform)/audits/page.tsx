"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — AUDITS & QUALITY ASSURANCE PAGE
// Internal audit schedule, compliance tracking, category breakdown,
// and action management with print support.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardCheck, Plus, CheckCircle2, AlertTriangle,
  Calendar, Download, X, Brain, Link, Search, LayoutList,
  FolderOpen, BarChart3, TrendingUp, TrendingDown, Minus, ArrowUpDown,
} from "lucide-react";
import { cn, formatDate, daysFromNow, todayStr } from "@/lib/utils";
import { useAudits, useCreateAudit, useUpdateAudit } from "@/hooks/use-audits";
import { useCreateTrainingNeed } from "@/hooks/use-ri-learning";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import type { Audit } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

// ── Audit category → training need type ──────────────────────────────────────
const AUDIT_CATEGORY_NEED: Record<string, string> = {
  medication: "medication_management",
  health_safety: "health_and_safety",
  care_records: "record_keeping",
  finance: "financial_management",
  safeguarding: "safeguarding",
  staffing: "supervision_and_appraisal",
  environment: "health_and_safety",
  general: "professional_practice",
};

type AuditStatus = "completed" | "scheduled" | "in_progress";

const AUDIT_CATEGORIES = [
  { value: "medication",     label: "Medication",       icon: "💊" },
  { value: "health_safety",  label: "Health & Safety",  icon: "🛡" },
  { value: "care_records",   label: "Care Records",     icon: "📋" },
  { value: "finance",        label: "Finance",          icon: "💷" },
  { value: "safeguarding",   label: "Safeguarding",     icon: "🔒" },
  { value: "staffing",       label: "Staffing",         icon: "👥" },
  { value: "environment",    label: "Environment",      icon: "🏠" },
  { value: "general",        label: "General",          icon: "📝" },
];

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(AUDIT_CATEGORIES.map((c) => [c.value, c.label]));

const EMPTY_AUDIT_FORM = {
  title: "", category: "general", date: "",
};

type GroupMode = "none" | "category";
type AuditSortKey = "date" | "score" | "title" | "status";

const AUDIT_EXPORT_COLS: ExportColumn<Audit>[] = [
  { header: "Title", accessor: (a) => a.title },
  { header: "Category", accessor: (a) => a.category ?? "" },
  { header: "Date", accessor: (a) => a.date },
  { header: "Status", accessor: (a) => a.status },
  { header: "Score", accessor: (a) => a.score },
  { header: "Max Score", accessor: (a) => a.max_score },
  { header: "Score %", accessor: (a) => a.max_score ? Math.round((a.score / a.max_score) * 100) : 0 },
  { header: "Completed By", accessor: (a) => a.completed_by ?? "" },
  { header: "Findings", accessor: (a) => a.findings },
  { header: "Actions", accessor: (a) => a.actions },
];

export default function AuditsPage() {
  const router = useRouter();
  const auditsQuery = useAudits();
  const audits: Audit[] = auditsQuery.data?.data ?? [];
  const createAudit = useCreateAudit();
  const updateAudit = useUpdateAudit();
  const createNeed = useCreateTrainingNeed();

  const [filter, setFilter] = useState<"all" | "completed" | "scheduled" | "in_progress">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<AuditSortKey>("date");
  const [groupBy, setGroupBy] = useState<GroupMode>("none");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(EMPTY_AUDIT_FORM);
  const [formError, setFormError] = useState("");
  const [needsCreated, setNeedsCreated] = useState<Set<string>>(new Set());

  const handleCreateNeedFromAudit = (audit: Audit) => {
    createNeed.mutate({
      title: `Audit improvement: ${audit.title}`,
      need_type: AUDIT_CATEGORY_NEED[audit.category ?? "general"] ?? "professional_practice",
      priority: audit.score < 50 ? "urgent" : audit.score < 75 ? "high" : "medium",
      identified_by: "audit",
      status: "identified",
      description: `Created from ${audit.title} audit. Score: ${audit.score}/${audit.max_score}. Findings: ${audit.findings}.`,
      linked_audit_id: audit.id,
    }, { onSuccess: () => setNeedsCreated((prev) => new Set([...prev, audit.id])) });
  };

  const filtered = useMemo(() => {
    let list = audits;
    if (filter !== "all") list = list.filter((a) => a.status === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q) || (a.category ?? "").toLowerCase().includes(q) || (a.completed_by ?? "").toLowerCase().includes(q));
    }
    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "score": return (b.score / (b.max_score || 1)) - (a.score / (a.max_score || 1));
        case "title": return a.title.localeCompare(b.title);
        case "status": return a.status.localeCompare(b.status);
        default: return (b.date ?? "").localeCompare(a.date ?? "");
      }
    });
    return list;
  }, [audits, filter, search, sortBy]);

  // Category grouping
  const grouped = useMemo(() => {
    if (groupBy !== "category") return null;
    const groups = new Map<string, Audit[]>();
    for (const audit of filtered) {
      const cat = audit.category ?? "general";
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(audit);
    }
    return new Map([...groups.entries()].sort((a, b) => b[1].length - a[1].length));
  }, [filtered, groupBy]);

  function handleStart(id: string) {
    updateAudit.mutate({ id, data: { status: "in_progress", date: todayStr() } });
  }

  function handleCreateAudit() {
    if (!form.title.trim()) { setFormError("Title is required."); return; }
    setFormError("");
    createAudit.mutate(
      {
        title: form.title.trim(),
        category: form.category,
        date: form.date || daysFromNow(7),
        completed_by: null,
        score: 0,
        max_score: 100,
        status: "scheduled",
        findings: 0,
        actions: 0,
      },
      {
        onSuccess: () => {
          setShowNew(false);
          setForm(EMPTY_AUDIT_FORM);
        },
      }
    );
  }

  const completedAudits = audits.filter((a) => a.status === "completed");
  const scheduledAudits = audits.filter((a) => a.status === "scheduled");
  const inProgressAudits = audits.filter((a) => a.status === "in_progress");
  const avgScore = completedAudits.length
    ? Math.round(completedAudits.reduce((a, au) => a + au.score, 0) / completedAudits.length)
    : 0;
  const totalFindings = audits.reduce((a, au) => a + au.findings, 0);
  const totalActions = audits.reduce((a, au) => a + au.actions, 0);

  // Category compliance summary
  const categoryStats = useMemo(() => {
    const stats: Record<string, { completed: number; avgScore: number; findings: number }> = {};
    for (const audit of audits) {
      const cat = audit.category ?? "general";
      if (!stats[cat]) stats[cat] = { completed: 0, avgScore: 0, findings: 0 };
      if (audit.status === "completed") {
        stats[cat].completed++;
        stats[cat].avgScore += audit.score;
      }
      stats[cat].findings += audit.findings;
    }
    for (const cat of Object.keys(stats)) {
      if (stats[cat].completed > 0) {
        stats[cat].avgScore = Math.round(stats[cat].avgScore / stats[cat].completed);
      }
    }
    return stats;
  }, [audits]);

  const hasFilters = filter !== "all" || search;

  const renderAuditCard = (audit: Audit) => (
    <div key={audit.id} className="flex items-center gap-4 rounded-xl border border-[var(--cs-border)] bg-white p-4 hover:shadow-sm transition-all">
      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
        audit.status === "completed" ? "bg-[--cs-success-bg]"
          : audit.status === "in_progress" ? "bg-[--cs-warning-bg]"
          : "bg-[--cs-info-bg]"
      )}>
        <ClipboardCheck className={cn(
          "h-5 w-5",
          audit.status === "completed" ? "text-[--cs-success]"
            : audit.status === "in_progress" ? "text-[--cs-warning]"
            : "text-[--cs-info]"
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[var(--cs-navy)]">{audit.title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[var(--cs-text-muted)]">{formatDate(audit.date)}</span>
          {audit.category && (
            <Badge variant="outline" className="text-[10px] rounded-full">{CATEGORY_LABEL[audit.category] ?? audit.category}</Badge>
          )}
          {audit.findings > 0 && (
            <span className="text-[10px] text-[--cs-warning] font-medium">{audit.findings} finding{audit.findings !== 1 ? "s" : ""}</span>
          )}
        </div>
        {audit.status === "completed" && (
          <div className="mt-2">
            <Progress
              value={audit.score}
              color={audit.score >= 90 ? "bg-[--cs-success-bg]0" : audit.score >= 70 ? "bg-[--cs-warning-bg]0" : "bg-[--cs-risk-bg]0"}
              className="h-1.5"
            />
            <div className="text-[10px] text-[var(--cs-text-muted)] mt-1">
              {audit.score}/{audit.max_score}
            </div>
          </div>
        )}
      </div>
      <Badge className={cn(
        "text-[10px] rounded-full shrink-0",
        audit.status === "completed" ? "bg-[--cs-success-bg] text-[--cs-success]"
          : audit.status === "in_progress" ? "bg-[--cs-warning-bg] text-[--cs-warning]"
          : "bg-[--cs-info-bg] text-[--cs-info]"
      )}>
        {audit.status.replace(/_/g, " ")}
      </Badge>
      {audit.status === "completed" && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs shrink-0"
            onClick={() => router.push(`/audits/${audit.id}`)}
          >
            View
          </Button>
          {audit.findings > 0 && (
            needsCreated.has(audit.id) ? (
              <a
                href="/learning/training-needs"
                className="inline-flex items-center gap-1 rounded-lg bg-[--cs-success-bg] border border-[--cs-success-soft] px-2.5 py-1 text-xs font-medium text-[--cs-success] hover:bg-[--cs-success-bg] transition-colors shrink-0"
              >
                <Link className="h-3 w-3" />
                Need created
              </a>
            ) : (
              <button
                onClick={() => handleCreateNeedFromAudit(audit)}
                disabled={createNeed.isPending}
                className="inline-flex items-center gap-1 rounded-lg bg-[var(--cs-cara-gold-bg)] border border-[var(--cs-cara-gold-soft)] px-2.5 py-1 text-xs font-medium text-[var(--cs-cara-gold)] hover:bg-[var(--cs-cara-gold-bg)] transition-colors shrink-0 disabled:opacity-50"
              >
                <Brain className="h-3 w-3" />
                Training Need
              </button>
            )
          )}
        </>
      )}
      {audit.status === "scheduled" && (
        <Button
          size="sm"
          className="h-8 text-xs shrink-0"
          onClick={() => handleStart(audit.id)}
          disabled={updateAudit.isPending}
        >
          Start
        </Button>
      )}
      {audit.status === "in_progress" && (
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs shrink-0"
          disabled
          title="Complete the audit form on paper and record the result."
        >
          In progress
        </Button>
      )}
    </div>
  );

  return (
    <>
      <PageShell
        title="Audits & Quality Assurance"
        subtitle="Internal audits, quality checks, and action tracking"
      caraContext={{ pageTitle: "Audits & Quality Assurance", sourceType: "general" }}
        quickCreateContext={{ module: "audits", defaultTaskCategory: "compliance", defaultFormType: "health_safety_check" }}
        actions={
          <div className="flex gap-2">
            <ExportButton<Audit> filename="audits-export" data={filtered} columns={AUDIT_EXPORT_COLS} label="Export" />
            <PrintButton title="Audits & Quality Assurance" subtitle="Chamberlain House — Audit Schedule & Compliance" targetId="audits-content" />
            <CaraStudioQuickActionButton context={{ record_type: "ofsted_evidence", record_id: "home_oak", home_id: "home_oak" }} />
            <SmartUploadButton variant="inline" label="Upload" uploadContext="Audits — evidence upload" />
            <Button size="sm" onClick={() => setShowNew(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />New Audit
            </Button>
          </div>
        }
      >
        <div id="audits-content" className="space-y-6">

          {/* ── Overdue/scheduled alert ──────────────────────────────────── */}
          {scheduledAudits.length > 0 && (
            <div className="rounded-xl border border-[--cs-info-soft] bg-[--cs-info-bg] px-4 py-3 flex items-center gap-3">
              <div className="rounded-full bg-[--cs-info-bg] p-1.5">
                <Calendar className="h-4 w-4 text-[--cs-info]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[--cs-info]">
                  {scheduledAudits.length} audit{scheduledAudits.length !== 1 ? "s" : ""} scheduled
                </p>
                <p className="text-xs text-[--cs-info] mt-0.5">
                  {inProgressAudits.length > 0 && `${inProgressAudits.length} currently in progress. `}
                  Regular auditing is a key Ofsted requirement under Reg 45.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-[--cs-info-soft] text-[--cs-info] hover:bg-[--cs-info-bg]"
                onClick={() => setFilter("scheduled")}
              >
                View scheduled
              </Button>
            </div>
          )}

          {/* ── KPI Stats ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: "Completed", value: completedAudits.length, icon: CheckCircle2, color: "text-[--cs-success]", bg: "bg-[--cs-success-bg]" },
              { label: "Scheduled", value: scheduledAudits.length, icon: Calendar, color: "text-[--cs-info]", bg: "bg-[--cs-info-bg]" },
              { label: "In Progress", value: inProgressAudits.length, icon: ClipboardCheck, color: "text-[--cs-warning]", bg: "bg-[--cs-warning-bg]" },
              { label: "Open Findings", value: totalFindings, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
              { label: "Avg Score", value: `${avgScore}%`, icon: BarChart3, color: avgScore >= 80 ? "text-[--cs-success]" : avgScore >= 60 ? "text-[--cs-warning]" : "text-[--cs-risk]", bg: avgScore >= 80 ? "bg-[--cs-success-bg]" : avgScore >= 60 ? "bg-[--cs-warning-bg]" : "bg-[--cs-risk-bg]" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-2xl border border-[var(--cs-border)] bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">{label}</div>
                    <div className={cn("mt-1 text-3xl font-bold tabular-nums", color)}>{value}</div>
                  </div>
                  <div className={cn("rounded-2xl p-3", bg)}><Icon className={cn("h-5 w-5", color)} /></div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Category compliance breakdown ─────────────────────────────── */}
          {Object.keys(categoryStats).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-indigo-500" />
                  Compliance by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AUDIT_CATEGORIES.filter((c) => categoryStats[c.value]).map((cat) => {
                    const stat = categoryStats[cat.value];
                    const scoreColour = stat.avgScore >= 80 ? "text-[--cs-success]" : stat.avgScore >= 60 ? "text-[--cs-warning]" : "text-[--cs-risk]";
                    const barColour = stat.avgScore >= 80 ? "bg-emerald-400" : stat.avgScore >= 60 ? "bg-amber-400" : "bg-red-400";
                    return (
                      <div key={cat.value} className="rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50 p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-medium text-[var(--cs-text-secondary)]">{cat.label}</span>
                          <span className={cn("text-[11px] font-bold tabular-nums", stat.completed > 0 ? scoreColour : "text-[var(--cs-text-muted)]")}>
                            {stat.completed > 0 ? `${stat.avgScore}%` : "—"}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          {stat.completed > 0 && (
                            <div className={cn("h-full rounded-full", barColour)} style={{ width: `${stat.avgScore}%` }} />
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-[var(--cs-text-muted)]">{stat.completed} completed</span>
                          {stat.findings > 0 && (
                            <span className="text-[10px] text-[--cs-warning]">{stat.findings} findings</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Toolbar ───────────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="flex-1 shrink-0">Audit Schedule</CardTitle>

                {/* Search */}
                <div className="relative min-w-[180px] max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--cs-text-muted)]" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search audits…" className="pl-9 h-8 text-xs" />
                </div>

                {/* Status filter */}
                <div className="flex gap-1">
                  {(["all", "completed", "in_progress", "scheduled"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium capitalize",
                        filter === f ? "bg-slate-900 text-white" : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200"
                      )}
                    >
                      {f.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as AuditSortKey)}
                    className="rounded-lg border border-[var(--cs-border)] bg-white px-2 py-1.5 text-xs text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="date">Date</option>
                    <option value="score">Score</option>
                    <option value="title">Title</option>
                    <option value="status">Status</option>
                  </select>
                </div>

                {/* Group toggle */}
                <div className="flex gap-0.5 rounded-lg border border-[var(--cs-border)] bg-white p-0.5">
                  <button
                    onClick={() => setGroupBy("none")}
                    className={cn("rounded-md px-2 py-1 text-xs transition-colors", groupBy === "none" ? "bg-slate-900 text-white" : "text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]")}
                    title="Flat list"
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setGroupBy("category")}
                    className={cn("rounded-md px-2 py-1 text-xs transition-colors", groupBy === "category" ? "bg-slate-900 text-white" : "text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]")}
                    title="Group by category"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {auditsQuery.isLoading ? (
                <div className="py-8 text-center text-sm text-[var(--cs-text-muted)]">Loading audits…</div>
              ) : (
                <div className="space-y-3">
                  {/* Flat list */}
                  {groupBy === "none" && filtered.map(renderAuditCard)}

                  {/* Grouped view */}
                  {grouped && Array.from(grouped.entries()).map(([cat, catAudits]) => (
                    <div key={cat} className="space-y-2">
                      <div className="flex items-center gap-2 pt-2 pb-1">
                        <span className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">
                          {CATEGORY_LABEL[cat] ?? cat}
                        </span>
                        <span className="text-[10px] text-[var(--cs-text-muted)] bg-slate-100 rounded-full px-1.5 py-0.5 tabular-nums">{catAudits.length}</span>
                        <div className="flex-1 h-px bg-slate-100" />
                      </div>
                      {catAudits.map(renderAuditCard)}
                    </div>
                  ))}

                  {filtered.length === 0 && (
                    <div className="py-8 text-center text-sm text-[var(--cs-text-muted)]">
                      {hasFilters ? "No audits match your filters." : "No audits yet. Schedule your first audit to get started."}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Regulatory footer ─────────────────────────────────────────── */}
          <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50 px-4 py-3 text-xs text-[var(--cs-text-muted)]">
            <span className="font-semibold text-[var(--cs-text-secondary)]">Regulatory Basis — </span>
            Children&apos;s Homes Regulations 2015: Reg 45 (independent person reviews) and the Guide to the Quality Standards (2.11) require
            regular internal auditing covering medication, health & safety, care records, safeguarding, staffing, environment, and finance.
            Audit findings must generate training needs and improvement actions. Ofsted inspectors review audit schedules and follow-up as evidence
            of effective governance.
          </div>
        </div>
        <CareEventsPanel
        title="Care Events — Compliance Evidence"
        category="general"
        days={90}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Audits & Quality Assurance — internal audits, Reg 44 visit, Reg 45 report, case file audit, quality monitoring, action plans, compliance scoring, Ofsted evidence"
        recordType="ofsted_evidence"
        className="mt-6"
      />
    </PageShell>

      {/* New Audit Modal */}
      {showNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setShowNew(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-[var(--cs-shadow-elevated)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-[var(--cs-navy)]">Schedule New Audit</span>
              <button onClick={() => setShowNew(false)} className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">
                  Audit title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Monthly medication audit"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--cs-border)] bg-slate-50 px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {AUDIT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Scheduled date</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="text-sm"
                />
              </div>
              {formError && <p className="text-xs text-[--cs-risk] font-medium">{formError}</p>}
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                className="flex-1"
                onClick={handleCreateAudit}
                disabled={createAudit.isPending}
              >
                <Plus className="h-4 w-4 mr-1" />Schedule Audit
              </Button>
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
