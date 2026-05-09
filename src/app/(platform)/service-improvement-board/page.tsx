"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  TrendingUp,
  Lightbulb,
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useServiceImprovementRecords } from "@/hooks/use-service-improvement-records";
import type { ServiceImprovementRecord, ServiceImprovementStatus, ServiceImprovementCategory, ServiceImprovementRagRating } from "@/types/extended";
import {
  SERVICE_IMPROVEMENT_STATUS_LABEL,
  SERVICE_IMPROVEMENT_CATEGORY_LABEL,
  SERVICE_IMPROVEMENT_SOURCE_LABEL,
  SERVICE_IMPROVEMENT_RAG_RATING_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local config ─────────────────────────────────────────────────────────── */

const statusColour: Record<ServiceImprovementStatus, string> = {
  proposed: "bg-slate-100 text-slate-800",
  approved: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  implemented: "bg-emerald-100 text-emerald-800",
  embedded: "bg-green-100 text-green-800",
  on_hold: "bg-purple-100 text-purple-800",
  closed: "bg-slate-100 text-slate-800",
};

const ragColour: Record<ServiceImprovementRagRating, string> = {
  red: "bg-red-100 text-red-800",
  amber: "bg-amber-100 text-amber-800",
  green: "bg-green-100 text-green-800",
};

/* ── component ────────────────────────────────────────────────────────────── */

export default function ServiceImprovementBoardPage() {
  const { data: records = [], isLoading } = useServiceImprovementRecords();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("status");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterStatus !== "all") items = items.filter((i) => i.status === filterStatus);
    if (filterCategory !== "all") items = items.filter((i) => i.category === filterCategory);
    items.sort((a, b) => {
      switch (sortBy) {
        case "status": {
          const ord: Record<ServiceImprovementStatus, number> = { in_progress: 0, approved: 1, proposed: 2, implemented: 3, embedded: 4, on_hold: 5, closed: 6 };
          return ord[a.status] - ord[b.status];
        }
        case "date":
          return a.target_completion_date.localeCompare(b.target_completion_date);
        case "rag": {
          const ragOrd: Record<ServiceImprovementRagRating, number> = { red: 0, amber: 1, green: 2 };
          return ragOrd[a.risk_rag_rating] - ragOrd[b.risk_rag_rating];
        }
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterStatus, filterCategory, sortBy]);

  const total = records.length;
  const inProgress = records.filter((i) => i.status === "in_progress" || i.status === "approved").length;
  const embedded = records.filter((i) => i.status === "embedded" || i.status === "implemented").length;
  const totalBudget = records.reduce((sum, i) => sum + i.budget_allocated, 0);

  const exportCols: ExportColumn<ServiceImprovementRecord>[] = [
    { header: "Title", accessor: (r) => r.title },
    { header: "Category", accessor: (r) => SERVICE_IMPROVEMENT_CATEGORY_LABEL[r.category] },
    { header: "Status", accessor: (r) => SERVICE_IMPROVEMENT_STATUS_LABEL[r.status] },
    { header: "RAG", accessor: (r) => SERVICE_IMPROVEMENT_RAG_RATING_LABEL[r.risk_rag_rating] },
    { header: "Source", accessor: (r) => SERVICE_IMPROVEMENT_SOURCE_LABEL[r.source] },
    { header: "Owner", accessor: (r) => getStaffName(r.owner_staff) },
    { header: "Started", accessor: (r) => r.start_date },
    { header: "Target Completion", accessor: (r) => r.target_completion_date },
    { header: "Budget", accessor: (r) => `£${r.budget_allocated}` },
  ];

  if (isLoading) {
    return (
      <PageShell title="Service Improvement Board" subtitle="Active service improvement initiatives — co-produced, evidence-based, outcome-focused">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Service Improvement Board"
      subtitle="Active service improvement initiatives — co-produced, evidence-based, outcome-focused"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="service-improvement-board" />
          <PrintButton title="Service Improvement Board" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Total Initiatives</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{inProgress}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{embedded}</p>
          <p className="text-xs text-muted-foreground">Embedded/Implemented</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">£{totalBudget.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Budget</p>
        </div>
      </div>

      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mb-6 flex items-start gap-2">
        <Lightbulb className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <p className="text-sm text-emerald-800">
          We never stand still. Every initiative on this board started with a question or a piece of feedback —
          from a child, a staff member, a Reg 44 visitor, or an audit. Continuous improvement is part of who we are.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.keys(SERVICE_IMPROVEMENT_STATUS_LABEL) as ServiceImprovementStatus[]).map((k) => (
              <SelectItem key={k} value={k}>{SERVICE_IMPROVEMENT_STATUS_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(Object.keys(SERVICE_IMPROVEMENT_CATEGORY_LABEL) as ServiceImprovementCategory[]).map((k) => (
              <SelectItem key={k} value={k}>{SERVICE_IMPROVEMENT_CATEGORY_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="status">By Status</SelectItem>
              <SelectItem value="date">Earliest Target</SelectItem>
              <SelectItem value="rag">By RAG</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((init) => {
          const isExpanded = expandedId === init.id;
          const milestonesAchieved = init.key_milestones.filter((m) => m.achieved).length;
          const milestoneProgress = init.key_milestones.length > 0 ? Math.round((milestonesAchieved / init.key_milestones.length) * 100) : 0;

          return (
            <div key={init.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : init.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Target className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{init.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {SERVICE_IMPROVEMENT_CATEGORY_LABEL[init.category]} &middot; Owner: {getStaffName(init.owner_staff)} &middot; {milestonesAchieved}/{init.key_milestones.length} milestones &middot; Source: {SERVICE_IMPROVEMENT_SOURCE_LABEL[init.source]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColour[init.status])}>
                    {SERVICE_IMPROVEMENT_STATUS_LABEL[init.status]}
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", ragColour[init.risk_rag_rating])}>
                    {SERVICE_IMPROVEMENT_RAG_RATING_LABEL[init.risk_rag_rating]}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                    <p className="text-sm">{init.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Problem Statement</p>
                      <p className="text-sm">{init.problem_statement}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">Expected Outcome</p>
                      <p className="text-sm">{init.expected_outcome}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Evidence Base</p>
                    <p className="text-sm text-blue-900">{init.evidence_base}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Milestones ({milestoneProgress}%)</p>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${milestoneProgress}%` }} />
                    </div>
                    <div className="space-y-1">
                      {init.key_milestones.map((m, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-center justify-between gap-2">
                          {m.achieved ? (
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                          )}
                          <span className="flex-1">{m.milestone}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {m.achieved ? `Done ${m.achieved_date}` : `Target ${m.target_date}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Child Involvement</p>
                      <p className="text-sm">{init.child_involvement}</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide mb-1">Staff Involvement</p>
                      <p className="text-sm">{init.staff_involvement}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Success Measures</p>
                    <ul className="space-y-1">
                      {init.success_measures.map((m, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <TrendingUp className="h-3 w-3 text-emerald-500 mt-1 shrink-0" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {init.early_results && (
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Early Results</p>
                      <p className="text-sm text-emerald-900">{init.early_results}</p>
                    </div>
                  )}

                  {init.challenges.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Challenges
                      </p>
                      <ul className="space-y-1">
                        {init.challenges.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Users className="h-3 w-3 inline mr-1" />Owner: {getStaffName(init.owner_staff)}</span>
                    <span>Started: {init.start_date}</span>
                    <span>Target: {init.target_completion_date}</span>
                    <span>Budget: £{init.budget_allocated}</span>
                    <span>Next review: {init.next_review_date}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Service improvement initiatives support Quality Standard 13
          (leadership and management), Regulation 45 (review of quality of care), and SCCIF judgement
          area on continuous improvement. Initiatives feed into Reg 45 reports and Ofsted inspection
          evidence. All initiatives are evidence-based, child-informed, and outcome-measured.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
