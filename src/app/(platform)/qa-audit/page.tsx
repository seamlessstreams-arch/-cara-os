"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Target,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useQaAuditRecords } from "@/hooks/use-qa-audit-records";
import type { QAAuditRecord, QAAuditRating, QAAuditActionStatus } from "@/types/extended";
import { QA_AUDIT_RATING_LABEL, QA_AUDIT_ACTION_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── local colour maps ───────────────────────────────────────────────────── */

const RATING_CLR: Record<QAAuditRating, string> = {
  excellent: "bg-green-100 text-green-800",
  good: "bg-blue-100 text-blue-800",
  requires_improvement: "bg-amber-100 text-amber-800",
  inadequate: "bg-red-100 text-red-800",
};

const BORDER_RATING: Record<QAAuditRating, string> = {
  excellent: "border-l-green-500",
  good: "border-l-blue-500",
  requires_improvement: "border-l-amber-500",
  inadequate: "border-l-red-500",
};

const ACTION_STATUS_CLR: Record<QAAuditActionStatus, string> = {
  completed: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  pending: "bg-slate-100 text-[var(--cs-text-secondary)]",
  overdue: "bg-red-100 text-red-800",
};

/* ── page ────────────────────────────────────────────────────────────────── */

export default function QAAuditPage() {
  const { data: records = [], isLoading } = useQaAuditRecords();
  const [search, setSearch] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const filtered = useMemo(() => {
    let rows = records.filter((r) => {
      if (filterRating !== "all" && r.overall_rating !== filterRating) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.scope.toLowerCase().includes(q) ||
          r.findings.some((f) => f.toLowerCase().includes(q)) ||
          getStaffName(r.auditor).toLowerCase().includes(q)
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date.localeCompare(a.date);
        case "date-asc": return a.date.localeCompare(b.date);
        case "score-desc": return b.score - a.score;
        case "score-asc": return a.score - b.score;
        default: return 0;
      }
    });
    return rows;
  }, [records, search, filterRating, sortBy]);

  const totalAudits = records.length;
  const avgScore = records.length > 0 ? Math.round(records.reduce((sum, r) => sum + r.score, 0) / records.length) : 0;
  const areasOfConcern = records.filter((r) => r.overall_rating === "requires_improvement" || r.overall_rating === "inadequate").length;
  const excellentCount = records.filter((r) => r.overall_rating === "excellent").length;

  const exportCols: ExportColumn<QAAuditRecord>[] = [
    { header: "Title", accessor: (r) => r.title },
    { header: "Date", accessor: (r) => r.date },
    { header: "Auditor", accessor: (r) => getStaffName(r.auditor) },
    { header: "Scope", accessor: (r) => r.scope },
    { header: "Overall Rating", accessor: (r) => QA_AUDIT_RATING_LABEL[r.overall_rating] },
    { header: "Score %", accessor: (r) => `${r.score}%` },
    { header: "Findings", accessor: (r) => r.findings.join("; ") },
    { header: "Strengths", accessor: (r) => r.strengths.join("; ") },
    { header: "Areas for Improvement", accessor: (r) => r.areas_for_improvement.join("; ") },
    { header: "Actions", accessor: (r) => r.actions.map((a) => `${a.action} (${a.status})`).join("; ") },
    { header: "Notes", accessor: (r) => r.notes },
  ];

  if (isLoading) {
    return (
      <PageShell title="QA Audit" subtitle="Reg 45 · Self-Assessment · Continuous Improvement · Quality Monitoring">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="QA Audit"
      subtitle="Reg 45 · Self-Assessment · Continuous Improvement · Quality Monitoring"
      caraContext={{ pageTitle: "QA Audit Records", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="QA Audit Records" />
          <ExportButton data={filtered} columns={exportCols} filename="qa-audit" />
          <CaraStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        {/* ── stat strip ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Audits", value: totalAudits, icon: ClipboardCheck, clr: "text-blue-600" },
            { label: "Average Score", value: `${avgScore}%`, icon: TrendingUp, clr: "text-green-600" },
            { label: "Excellent", value: excellentCount, icon: CheckCircle2, clr: "text-emerald-600" },
            { label: "Areas of Concern", value: areasOfConcern, icon: AlertTriangle, clr: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── areas of concern alert ─────────────────────────────────── */}
        {areasOfConcern > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{areasOfConcern} audit(s) rated Requires Improvement or below</p>
              <p className="text-amber-700">Action plans must be implemented and progress tracked. Ofsted will expect evidence of self-assessment leading to measurable improvement.</p>
            </div>
          </div>
        )}

        {/* ── regulatory note ────────────────────────────────────────── */}
        <div className="bg-slate-50 border border-[var(--cs-border)] rounded-lg p-3 mb-6 flex items-start gap-2">
          <Target className="h-5 w-5 text-[var(--cs-text-secondary)] shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-[var(--cs-navy)]">Self-Assessment &amp; Quality Monitoring</p>
            <p className="text-[var(--cs-text-secondary)]">Ofsted expects children&apos;s homes to demonstrate continuous improvement through rigorous self-assessment. Internal QA audits evidence proactive quality monitoring, identify areas for development, and show that the home does not wait for external inspection to drive improvement. Reg 45 independent reviews should be complemented by ongoing internal quality checks.</p>
          </div>
        </div>

        {/* ── filters ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search audits, findings, auditor…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              className="text-sm border rounded px-2 py-1.5"
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
            >
              <option value="all">All Ratings</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="requires_improvement">Requires Improvement</option>
              <option value="inadequate">Inadequate</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              className="text-sm border rounded px-2 py-1.5"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="score-desc">Highest Score</option>
              <option value="score-asc">Lowest Score</option>
            </select>
          </div>
        </div>

        {/* ── audit records ───────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_RATING[r.overall_rating])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {r.title}
                        <Badge variant="outline" className={RATING_CLR[r.overall_rating]}>{QA_AUDIT_RATING_LABEL[r.overall_rating]}</Badge>
                        <Badge variant="outline" className="bg-slate-100 text-[var(--cs-navy)]">{r.score}%</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.date} · Auditor: {getStaffName(r.auditor)} · Scope: {r.scope}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.actions.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {r.actions.filter((a) => a.status === "completed").length}/{r.actions.length} actions done
                        </Badge>
                      )}
                      {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    <div>
                      <p className="font-semibold text-[var(--cs-text-secondary)] mb-1">Findings</p>
                      <ul className="list-disc list-inside space-y-0.5 text-[var(--cs-text-secondary)]">
                        {r.findings.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>

                    {r.strengths.length > 0 && (
                      <div>
                        <p className="font-semibold text-green-700 mb-1">Strengths</p>
                        <ul className="list-disc list-inside space-y-0.5 text-green-600">
                          {r.strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}

                    {r.areas_for_improvement.length > 0 && (
                      <div>
                        <p className="font-semibold text-amber-700 mb-1">Areas for Improvement</p>
                        <ul className="list-disc list-inside space-y-0.5 text-amber-600">
                          {r.areas_for_improvement.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                    )}

                    {r.actions.length > 0 && (
                      <div>
                        <p className="font-semibold text-[var(--cs-text-secondary)] mb-2">Action Plan</p>
                        <div className="space-y-2">
                          {r.actions.map((a, i) => (
                            <div key={i} className="bg-muted/40 rounded p-2 flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-[var(--cs-text-secondary)]">{a.action}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Owner: {getStaffName(a.owner)} · Deadline: {a.deadline}
                                </p>
                              </div>
                              <Badge variant="outline" className={ACTION_STATUS_CLR[a.status]}>
                                {QA_AUDIT_ACTION_STATUS_LABEL[a.status]}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {r.notes && (
                      <div>
                        <p className="font-semibold text-[var(--cs-text-secondary)] mb-1">Notes</p>
                        <p className="text-[var(--cs-text-secondary)]">{r.notes}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardCheck className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>No QA audits match the current filters.</p>
          </div>
        )}
      </div>
      <CareEventsPanel
        title="Care Events — Compliance Evidence"
        category="general"
        days={90}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="QA Audit Records — quality assurance audits, record-keeping checks, compliance audits, practice quality, management oversight, audit findings, improvement actions, Reg 45 governance evidence"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}
