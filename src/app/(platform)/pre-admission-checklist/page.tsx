"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  FileCheck,
  Home,
  Shield,
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
import { usePreAdmissionChecklists } from "@/hooks/use-pre-admission-checklists";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { PreAdmissionChecklist, PreAdmissionStatus } from "@/types/extended";
import { PRE_ADMISSION_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<PreAdmissionChecklist>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Referral Date", accessor: (r) => r.referral_date },
  { header: "Target Admission", accessor: (r) => r.target_admission_date },
  { header: "Status", accessor: (r) => PRE_ADMISSION_STATUS_LABEL[r.status] },
  { header: "Local Authority", accessor: (r) => r.local_authority },
  { header: "Social Worker", accessor: (r) => r.social_worker },
  { header: "Completion", accessor: (r) => `${r.items.filter((i) => i.completed).length}/${r.items.length}` },
  { header: "Assigned To", accessor: (r) => getStaffName(r.assigned_to) },
];

// ── component ───────────────────────────────────────────────────────────────
export default function PreAdmissionChecklistPage() {
  const { data: records = [], isLoading } = usePreAdmissionChecklists();
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterStatus !== "all") items = items.filter((c) => c.status === filterStatus);

    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.referral_date.localeCompare(a.referral_date);
        case "completion": {
          const pctA = a.items.filter((i) => i.completed).length / a.items.length;
          const pctB = b.items.filter((i) => i.completed).length / b.items.length;
          return pctA - pctB;
        }
        case "child":
          return a.child_id.localeCompare(b.child_id);
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterStatus, sortBy]);

  // ── stats ──────────────────────────────────────────────────────────────────
  const totalChecklists = records.length;
  const complete = records.filter((c) => c.status === "complete").length;
  const totalTasks = records.reduce((sum, c) => sum + c.items.length, 0);
  const completedTasks = records.reduce((sum, c) => sum + c.items.filter((i) => i.completed).length, 0);

  if (isLoading) {
    return (
      <PageShell title="Pre-Admission Checklist" subtitle="Structured preparation for every admission — ensuring safe, planned, and child-centred transitions">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Pre-Admission Checklist"
      subtitle="Structured preparation for every admission — ensuring safe, planned, and child-centred transitions"
      ariaContext={{ pageTitle: "Pre-Admission Checklists", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="pre-admission-checklists" />
          <PrintButton title="Pre-Admission Checklists" />
          <AriaStudioQuickActionButton context={{ record_type: "placement_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{totalChecklists}</p>
          <p className="text-xs text-muted-foreground">Total Admissions</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{complete}</p>
          <p className="text-xs text-muted-foreground">Fully Complete</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{completedTasks}/{totalTasks}</p>
          <p className="text-xs text-muted-foreground">Tasks Done</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">
            {totalChecklists > 0 ? (records.filter(r => r.impact_assessment_done).length === totalChecklists ? "100%" : `${Math.round((records.filter(r => r.impact_assessment_done).length / totalChecklists) * 100)}%`) : "—"}
          </p>
          <p className="text-xs text-muted-foreground">Impact Assessed</p>
        </div>
      </div>

      {/* ── filters/sort ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.entries(PRE_ADMISSION_STATUS_LABEL) as [PreAdmissionStatus, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="completion">Completion %</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── checklist cards ────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No checklists match your filters.</div>
        )}
        {filtered.map((checklist) => {
          const isExpanded = expandedId === checklist.id;
          const completedCount = checklist.items.filter((i) => i.completed).length;
          const totalCount = checklist.items.length;
          const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          return (
            <div key={checklist.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : checklist.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileCheck className={cn("h-5 w-5 shrink-0",
                    checklist.status === "complete" ? "text-green-600" : "text-blue-600"
                  )} />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(checklist.child_id)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Referred: {checklist.referral_date} &middot; {checklist.local_authority} &middot; {checklist.social_worker}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">{pct}%</p>
                    <p className="text-xs text-muted-foreground">{completedCount}/{totalCount}</p>
                  </div>
                  <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", pct === 100 ? "bg-green-500" : "bg-blue-500")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* task checklist */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Admission Tasks</p>
                    <div className="space-y-1.5">
                      {checklist.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          {item.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-300 mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1">
                            <span className={cn(item.completed ? "text-slate-700" : "text-slate-500")}>{item.task}</span>
                            {item.notes && <span className="text-xs text-muted-foreground ml-2">({item.notes})</span>}
                            {item.completed_date && (
                              <span className="text-xs text-muted-foreground ml-2">
                                — {item.completed_date} by {getStaffName(item.completed_by || "")}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* risk considerations */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />Risk Considerations
                    </p>
                    <ul className="space-y-1">
                      {checklist.risk_considerations.map((risk, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Shield className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* special requirements */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Home className="h-3 w-3 inline mr-1" />Special Requirements
                    </p>
                    <ul className="space-y-1">
                      {checklist.special_requirements.map((req, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Clock className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* metadata */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Users className="h-3 w-3 inline mr-1" />Assigned: {getStaffName(checklist.assigned_to)}</span>
                    <span>Target admission: {checklist.target_admission_date}</span>
                    {checklist.matching_panel_date && <span>Matching panel: {checklist.matching_panel_date}</span>}
                    <span className={cn(
                      "px-2 py-0.5 rounded-full font-medium",
                      checklist.impact_assessment_done ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    )}>
                      Impact Assessment: {checklist.impact_assessment_done ? "Complete" : "Pending"}
                    </span>
                  </div>

                  <SmartLinkPanel sourceType="pre_admission_checklist" sourceId={checklist.id} childId={checklist.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ──────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Pre-admission checklists support Regulation 14 (assessment of children
          proposed to be looked after), Regulation 5 (engagement with placing authority), and Quality Standard 4
          (the child&apos;s plan). Every admission must include an impact assessment on existing residents and a
          matching consideration per Quality Standard 14 guidance.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Admissions & Placements"
        category="general"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Pre-Admission Checklists — placement planning, referral screening, bedroom readiness, health and safety checks, risk assessment, staffing, placement matching, emergency moves"
        recordType="placement_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
