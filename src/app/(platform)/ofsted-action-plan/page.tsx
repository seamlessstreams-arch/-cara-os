"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — OFSTED ACTION PLAN
// Tracks responses to inspection requirements, recommendations, and areas
// for improvement identified during Ofsted inspections.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import {
  ClipboardCheck, Search, ArrowUpDown, Filter,
  CheckCircle2, AlertTriangle, Clock, TrendingUp,
  ChevronDown, ChevronUp, Calendar, User, Flag,
  FileText, ShieldCheck, Star, Eye, Plus, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStaffName, STAFF } from "@/lib/seed-data";
import { toast } from "sonner";
import { useOfstedActionPlan, useCreateOfstedActionItem } from "@/hooks/use-ofsted-action-plan";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  OfstedActionItem,
  OfstedActionType,
  OfstedActionPriority,
  OfstedActionStatus,
  OfstedActionUpdate,
} from "@/types/extended";
import {
  OFSTED_ACTION_TYPE_LABEL,
  OFSTED_ACTION_PRIORITY_LABEL,
  OFSTED_ACTION_STATUS_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── colour maps ────────────────────────────────────────────────────── */
const TYPE_COLOUR: Record<OfstedActionType, string> = {
  requirement: "bg-red-50 text-red-700 border-red-200",
  recommendation: "bg-amber-50 text-amber-700 border-amber-200",
  observation: "bg-blue-50 text-blue-700 border-blue-200",
};

const TYPE_ICON_COLOUR: Record<OfstedActionType, string> = {
  requirement: "text-red-600",
  recommendation: "text-amber-600",
  observation: "text-blue-600",
};

const PRIORITY_COLOUR: Record<OfstedActionPriority, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
};

const STATUS_COLOUR: Record<OfstedActionStatus, string> = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  not_started: "bg-slate-50 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
  noted: "bg-blue-50 text-blue-700 border-blue-200",
};

const STATUS_CARD_BORDER: Record<OfstedActionStatus, string> = {
  completed: "border-l-emerald-400",
  in_progress: "border-l-amber-400",
  not_started: "border-l-slate-400",
  noted: "border-l-blue-400",
};

const PRIORITY_ORDER: Record<OfstedActionPriority, number> = { high: 0, medium: 1, low: 2 };
const STATUS_ORDER: Record<OfstedActionStatus, number> = { not_started: 0, in_progress: 1, noted: 2, completed: 3 };

/* ── inspection summary (static display data) ───────────────────────── */
const INSPECTION = {
  date: d(-180),
  type: "Full inspection",
  overallJudgment: "Good",
  subJudgments: {
    overallExperiences: "Good",
    helpedAndProtected: "Good",
    leadersAndManagers: "Good",
  },
  requirements: 2,
  recommendations: 3,
  observations: 1,
};

/* ── component ───────────────────────────────────────────────────────── */
export default function OfstedActionPlanPage() {
  const { data: res, isLoading } = useOfstedActionPlan();
  const entries: OfstedActionItem[] = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState<"priority" | "status" | "type">("priority");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const createItem = useCreateOfstedActionItem();
  const [oaForm, setOaForm] = useState({ action_type: "requirement" as OfstedActionType, priority: "medium" as OfstedActionPriority, text: "", owner: "", target_date: "", evidence: "" });
  const setOA = (k: string, v: unknown) => setOaForm((p) => ({ ...p, [k]: v }));

  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oaForm.text.trim()) { toast.error("Action text is required."); return; }
    const today = new Date().toISOString().slice(0, 10);
    await createItem.mutateAsync({ inspection_date: today, action_type: oaForm.action_type, text: oaForm.text.trim(), priority: oaForm.priority, status: "not_started" as OfstedActionStatus, owner: oaForm.owner || null, target_date: oaForm.target_date || null, completed_date: null, progress: 0, evidence: oaForm.evidence.trim(), updates: [] });
    toast.success("Action item added.");
    setOaForm({ action_type: "requirement", priority: "medium", text: "", owner: "", target_date: "", evidence: "" });
    setShowNew(false);
  };

  /* ── filtering & sorting ────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...entries];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.text.toLowerCase().includes(q) ||
          e.evidence.toLowerCase().includes(q) ||
          (e.owner && getStaffName(e.owner).toLowerCase().includes(q))
      );
    }
    if (filterStatus !== "all") list = list.filter((e) => e.status === filterStatus);
    if (filterType !== "all") list = list.filter((e) => e.action_type === filterType);
    if (filterPriority !== "all") list = list.filter((e) => e.priority === filterPriority);

    list.sort((a, b) => {
      switch (sortBy) {
        case "priority": {
          const pa = a.priority ? PRIORITY_ORDER[a.priority] : 3;
          const pb = b.priority ? PRIORITY_ORDER[b.priority] : 3;
          return pa - pb || STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        }
        case "status":
          return STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || (
            (a.priority ? PRIORITY_ORDER[a.priority] : 3) - (b.priority ? PRIORITY_ORDER[b.priority] : 3)
          );
        case "type": {
          const typeOrder: Record<OfstedActionType, number> = { requirement: 0, recommendation: 1, observation: 2 };
          return typeOrder[a.action_type] - typeOrder[b.action_type] || (
            (a.priority ? PRIORITY_ORDER[a.priority] : 3) - (b.priority ? PRIORITY_ORDER[b.priority] : 3)
          );
        }
        default:
          return 0;
      }
    });
    return list;
  }, [entries, search, filterStatus, filterType, filterPriority, sortBy]);

  /* ── stats ──────────────────────────────────────────────────────── */
  const actionable = entries.filter((e) => e.status !== "noted");
  const totalActionable = actionable.length;
  const completedCount = entries.filter((e) => e.status === "completed").length;
  const inProgressCount = entries.filter((e) => e.status === "in_progress").length;
  const requirementsMet = entries.filter((e) => e.action_type === "requirement" && e.status === "completed").length;
  const requirementsTotal = entries.filter((e) => e.action_type === "requirement").length;
  const recommendationsAddressed = entries.filter((e) => e.action_type === "recommendation" && e.status === "completed").length;
  const recommendationsTotal = entries.filter((e) => e.action_type === "recommendation").length;

  /* ── export columns ─────────────────────────────────────────────── */
  const exportCols: ExportColumn<OfstedActionItem>[] = [
    { header: "ID", accessor: (r: OfstedActionItem) => r.id },
    { header: "Inspection Date", accessor: (r: OfstedActionItem) => r.inspection_date },
    { header: "Type", accessor: (r: OfstedActionItem) => OFSTED_ACTION_TYPE_LABEL[r.action_type] },
    { header: "Action", accessor: (r: OfstedActionItem) => r.text },
    { header: "Priority", accessor: (r: OfstedActionItem) => r.priority ? OFSTED_ACTION_PRIORITY_LABEL[r.priority] : "N/A" },
    { header: "Status", accessor: (r: OfstedActionItem) => OFSTED_ACTION_STATUS_LABEL[r.status] },
    { header: "Owner", accessor: (r: OfstedActionItem) => r.owner ? getStaffName(r.owner) : "N/A" },
    { header: "Target Date", accessor: (r: OfstedActionItem) => r.target_date ?? "" },
    { header: "Completed Date", accessor: (r: OfstedActionItem) => r.completed_date ?? "" },
    { header: "Progress (%)", accessor: (r: OfstedActionItem) => r.progress },
    { header: "Evidence", accessor: (r: OfstedActionItem) => r.evidence },
    { header: "Updates", accessor: (r: OfstedActionItem) => r.updates.map((u) => `${u.date}: ${u.note}`).join("; ") },
  ];

  /* ── loading state ──────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <PageShell title="Ofsted Action Plan" subtitle="Tracking responses to inspection requirements, recommendations, and areas for improvement">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Ofsted Action Plan"
      subtitle="Tracking responses to inspection requirements, recommendations, and areas for improvement"
      caraContext={{ pageTitle: "Ofsted Action Plan", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Ofsted Action Plan" />
          <ExportButton data={filtered} columns={exportCols} filename="ofsted-action-plan" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Action
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "ofsted_evidence", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── inspection summary banner ─────────────────────────────── */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              Last Full Inspection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Inspection Date</p>
                <p className="text-sm font-semibold flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-500" />
                  {INSPECTION.date}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overall Judgment</p>
                <div className="mt-0.5">
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 font-semibold">
                    {INSPECTION.overallJudgment}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Requirements Issued</p>
                <p className="text-sm font-semibold mt-0.5">{INSPECTION.requirements}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recommendations Made</p>
                <p className="text-sm font-semibold mt-0.5">{INSPECTION.recommendations}</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-200/50">
              <p className="text-xs text-muted-foreground mb-2">Sub-judgments</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs text-[var(--cs-text-secondary)]">Overall experiences &amp; progress:</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
                    {INSPECTION.subJudgments.overallExperiences}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs text-[var(--cs-text-secondary)]">Helped &amp; protected:</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
                    {INSPECTION.subJudgments.helpedAndProtected}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs text-[var(--cs-text-secondary)]">Leaders &amp; managers:</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
                    {INSPECTION.subJudgments.leadersAndManagers}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── progress stats ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Requirements Met", value: `${requirementsMet}/${requirementsTotal}`, icon: Flag, colour: requirementsMet === requirementsTotal ? "text-emerald-600" : "text-red-600" },
            { label: "Recommendations Addressed", value: `${recommendationsAddressed}/${recommendationsTotal}`, icon: ClipboardCheck, colour: recommendationsAddressed === recommendationsTotal ? "text-emerald-600" : "text-amber-600" },
            { label: "In Progress", value: inProgressCount, icon: TrendingUp, colour: "text-amber-600" },
            { label: "Overall Completion", value: `${totalActionable > 0 ? Math.round((completedCount / totalActionable) * 100) : 0}%`, icon: CheckCircle2, colour: completedCount === totalActionable ? "text-emerald-600" : "text-blue-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── filters & sort ─────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search actions, evidence, owners..."
              className="w-full rounded-lg border border-[var(--cs-border)] bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-[var(--cs-border)] bg-white px-2 py-2 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="not_started">Not Started</option>
              <option value="noted">Noted</option>
            </select>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-[var(--cs-border)] bg-white px-2 py-2 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="all">All Types</option>
            <option value="requirement">Requirements</option>
            <option value="recommendation">Recommendations</option>
            <option value="observation">Observations</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-lg border border-[var(--cs-border)] bg-white px-2 py-2 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "priority" | "status" | "type")}
              className="rounded-lg border border-[var(--cs-border)] bg-white px-2 py-2 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="type">Type</option>
            </select>
          </div>
        </div>

        {/* ── action item cards ──────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardCheck className="h-10 w-10 mx-auto mb-3 text-[var(--cs-text-gentle)]" />
              No action items match your filters.
            </div>
          )}
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl border border-l-4 bg-white overflow-hidden",
                  STATUS_CARD_BORDER[item.status]
                )}
              >
                {/* collapsed header */}
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {item.action_type === "requirement" && <Flag className={cn("h-5 w-5 shrink-0", TYPE_ICON_COLOUR[item.action_type])} />}
                    {item.action_type === "recommendation" && <ClipboardCheck className={cn("h-5 w-5 shrink-0", TYPE_ICON_COLOUR[item.action_type])} />}
                    {item.action_type === "observation" && <Eye className={cn("h-5 w-5 shrink-0", TYPE_ICON_COLOUR[item.action_type])} />}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{item.text}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", TYPE_COLOUR[item.action_type])}>
                          {OFSTED_ACTION_TYPE_LABEL[item.action_type]}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", STATUS_COLOUR[item.status])}>
                          {OFSTED_ACTION_STATUS_LABEL[item.status]}
                        </Badge>
                        {item.priority && (
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", PRIORITY_COLOUR[item.priority])}>
                            {OFSTED_ACTION_PRIORITY_LABEL[item.priority]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.owner && <>Owner: {getStaffName(item.owner)}</>}
                        {item.target_date && <> · Target: {item.target_date}</>}
                        {item.completed_date && <> · Completed: {item.completed_date}</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {/* progress indicator */}
                    {item.status === "in_progress" && (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-[var(--cs-text-muted)] tabular-nums">{item.progress}%</span>
                      </div>
                    )}
                    {item.status === "completed" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                    {item.status === "noted" && (
                      <Star className="h-4 w-4 text-blue-500" />
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {/* expanded detail */}
                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* evidence */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[var(--cs-text-muted)]" />
                          Evidence &amp; Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-[var(--cs-text-secondary)]">{item.evidence}</p>
                      </CardContent>
                    </Card>

                    {/* progress bar (for actionable items) */}
                    {item.status !== "noted" && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-indigo-500" />
                            Progress
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  item.progress === 100 ? "bg-emerald-500"
                                    : item.progress >= 50 ? "bg-amber-500"
                                    : "bg-blue-500"
                                )}
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-[var(--cs-text-secondary)] tabular-nums w-12 text-right">{item.progress}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* updates timeline */}
                    {item.updates.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4 text-teal-500" />
                            Update History
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {item.updates.map((update, i) => (
                              <div key={i} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={cn(
                                    "h-2.5 w-2.5 rounded-full shrink-0 mt-1.5",
                                    i === item.updates.length - 1 ? "bg-indigo-500" : "bg-slate-300"
                                  )} />
                                  {i < item.updates.length - 1 && (
                                    <div className="w-px flex-1 bg-slate-200 mt-1" />
                                  )}
                                </div>
                                <div className="pb-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-medium text-[var(--cs-text-muted)]">{update.date}</span>
                                    <span className="text-xs text-[var(--cs-text-muted)]">by {getStaffName(update.updated_by)}</span>
                                  </div>
                                  <p className="text-sm text-[var(--cs-text-secondary)] mt-0.5">{update.note}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* metadata grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type:</span>{" "}
                        <span className="font-medium">{OFSTED_ACTION_TYPE_LABEL[item.action_type]}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Owner:</span>{" "}
                        <span className="font-medium">{item.owner ? getStaffName(item.owner) : "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target Date:</span>{" "}
                        <span className="font-medium">{item.target_date ?? "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Completed:</span>{" "}
                        <span className={cn("font-medium", item.completed_date ? "text-emerald-600" : "text-[var(--cs-text-muted)]")}>
                          {item.completed_date ?? "Pending"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Inspection:</span>{" "}
                        <span className="font-medium">{item.inspection_date}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Priority:</span>{" "}
                        <span className="font-medium">{item.priority ? OFSTED_ACTION_PRIORITY_LABEL[item.priority] : "N/A"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory note ──────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Regulatory Context:</strong> Ofsted inspections of children&apos;s homes are conducted
          under the Social Care Common Inspection Framework (SCCIF). Inspections assess the overall
          experiences and progress of children, how well children are helped and protected, and the
          effectiveness of leaders and managers. Requirements are actions the provider must take and are
          linked to specific regulations under the Children&apos;s Homes (England) Regulations 2015.
          Recommendations are actions the provider should take to improve practice. The registered manager
          must evidence continuous improvement by maintaining a clear action plan that tracks progress
          against all requirements and recommendations, demonstrating to Ofsted that identified areas for
          improvement have been acted upon effectively and within reasonable timescales.
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Compliance Evidence"
        category="general"
        days={90}
        defaultCollapsed
      />
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Action Item</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveAction} className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label><Select value={oaForm.action_type} onValueChange={(v) => setOA("action_type", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(OFSTED_ACTION_TYPE_LABEL) as OfstedActionType[]).map((k) => (<SelectItem key={k} value={k}>{OFSTED_ACTION_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
              <div><Label>Priority</Label><Select value={oaForm.priority} onValueChange={(v) => setOA("priority", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(OFSTED_ACTION_PRIORITY_LABEL) as OfstedActionPriority[]).map((k) => (<SelectItem key={k} value={k}>{OFSTED_ACTION_PRIORITY_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            </div>
            <div><Label>Action Text *</Label><Textarea className="mt-1" rows={3} placeholder="Describe the action required…" value={oaForm.text} onChange={(e) => setOA("text", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Owner</Label><Select value={oaForm.owner} onValueChange={(v) => setOA("owner", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select staff…" /></SelectTrigger><SelectContent><SelectItem value="">Unassigned</SelectItem>{STAFF.filter((s) => s.employment_status === "active").map((s) => (<SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>))}</SelectContent></Select></div>
              <div><Label>Target Date</Label><Input type="date" className="mt-1" value={oaForm.target_date} onChange={(e) => setOA("target_date", e.target.value)} /></div>
            </div>
            <div><Label>Evidence / Notes</Label><Textarea className="mt-1" rows={2} placeholder="Evidence to be gathered or notes" value={oaForm.evidence} onChange={(e) => setOA("evidence", e.target.value)} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={createItem.isPending}>{createItem.isPending ? "Saving…" : "Add Action"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
