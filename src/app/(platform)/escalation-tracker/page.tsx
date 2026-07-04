"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent } from "@/components/ui/card";
import { FlatList, FlatListRow, FlatListRowDetail, type RowSeverity } from "@/components/ui/list-row";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { useEscalations } from "@/hooks/use-escalations";
import type { Escalation } from "@/types/extended";
import {
  ESCALATION_CATEGORY_LABEL,
  ESCALATION_PRIORITY_LABEL,
  ESCALATION_STATUS_LABEL,
} from "@/types/extended";
import {
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  ArrowUp,
  CheckCircle2,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { EscalationDecisionPanel } from "@/components/risk-escalation/escalation-decision-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ─── export columns ─── */
const exportCols: ExportColumn<Escalation>[] = [
  { header: "Title", accessor: (r) => r.title },
  { header: "Date", accessor: (r) => r.date },
  { header: "Escalated By", accessor: (r) => getStaffName(r.escalated_by) },
  { header: "Escalated To", accessor: (r) => r.escalated_to.startsWith("staff_") ? getStaffName(r.escalated_to) : r.escalated_to },
  { header: "Category", accessor: (r) => ESCALATION_CATEGORY_LABEL[r.category] },
  { header: "Priority", accessor: (r) => ESCALATION_PRIORITY_LABEL[r.priority] },
  { header: "Young Person", accessor: (r) => r.child_id ? getYPName(r.child_id) : "N/A" },
  { header: "Status", accessor: (r) => ESCALATION_STATUS_LABEL[r.status] },
  { header: "Time to Resolve", accessor: (r) => r.time_to_resolve ?? "Open" },
  { header: "Action Taken", accessor: (r) => r.action_taken },
];

/* ─── component ─── */
export default function EscalationTrackerPage() {
  const { data: res, isLoading } = useEscalations();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterCategory !== "all") list = list.filter((r) => r.category === filterCategory);
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "priority": {
          const pOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2 };
          return (pOrder[a.priority] ?? 3) - (pOrder[b.priority] ?? 3);
        }
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
    return list;
  }, [records, filterCategory, filterStatus, sortBy]);

  const stats = useMemo(() => {
    const total = records.length;
    const open = records.filter((e) => e.status === "open" || e.status === "monitoring").length;
    const resolved = records.filter((e) => e.status === "resolved").length;
    const urgent = records.filter((e) => e.priority === "urgent" && e.status !== "resolved").length;
    return { total, open, resolved, urgent };
  }, [records]);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const priorityRow = (esc: { priority: string; status: string }): RowSeverity => {
    if (esc.status === "resolved") return "success";
    if (esc.priority === "urgent" || esc.priority === "high") return "risk";
    if (esc.priority === "medium") return "warning";
    return "neutral";
  };

  const priorityText = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <span className="text-[11px] font-semibold uppercase tracking-wide text-[--cs-risk]">Urgent</span>;
      case "high":
        return <span className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">High</span>;
      case "medium":
        return <span className="text-[11px] font-semibold uppercase tracking-wide text-[--cs-warning]">Medium</span>;
      default:
        return <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">{priority}</span>;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-[--cs-success-bg] text-[--cs-success]">Resolved</Badge>;
      case "open":
        return <Badge className="bg-[--cs-info-bg] text-[--cs-info]">Open</Badge>;
      case "monitoring":
        return <Badge className="bg-purple-100 text-purple-800">Monitoring</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <PageShell title="Escalation Tracker" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Escalation Tracker"
      subtitle="Recording when concerns are escalated, to whom, actions taken, and outcomes"
      caraContext={{ pageTitle: "Escalation Tracker", sourceType: "incident" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="escalation-tracker" />
          <PrintButton title="Escalation Tracker" />
          <CaraStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* Risk escalation decision workflow — Cara suggests a level from the
          evidence; a named manager confirms/amends/rejects. Logged + traced. */}
      <div className="mb-6">
        <EscalationDecisionPanel />
      </div>

      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Escalations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-[--cs-info]">{stats.open}</p>
            <p className="text-xs text-muted-foreground">Open / Monitoring</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-[--cs-success]">{stats.resolved}</p>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className={cn("text-2xl font-bold", stats.urgent > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>
              {stats.urgent}
            </p>
            <p className="text-xs text-muted-foreground">Urgent Active</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── urgent alert ─── */}
      {stats.urgent > 0 && (
        <div className="bg-[--cs-risk-bg] border border-[--cs-risk-soft] rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-[--cs-risk] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-[--cs-risk]">Urgent Escalation Active</p>
              <p className="text-xs text-[--cs-risk] mt-1">
                {records
                  .filter((e) => e.priority === "urgent" && e.status !== "resolved")
                  .map((e) => e.title)
                  .join("; ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── filters ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {Object.entries(ESCALATION_CATEGORY_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {Object.entries(ESCALATION_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Most Recent</option>
            <option value="priority">Priority</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>

      {/* ─── escalation cards ─── */}
      <FlatList>
        {filtered.map((esc) => {
          const expanded = expandedId === esc.id;

          return (
            <div key={esc.id}>
              <FlatListRow severity={priorityRow(esc)} onClick={() => toggle(esc.id)} aria-expanded={expanded}>
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <ArrowUp className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-[var(--cs-navy)]">{esc.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {priorityText(esc.priority)}
                        {statusBadge(esc.status)}
                        <span className="text-xs text-muted-foreground">{ESCALATION_CATEGORY_LABEL[esc.category]}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">{esc.date}</p>
                    </div>
                    {expanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </FlatListRow>

              {expanded && (
                <FlatListRowDetail>
                  <div>
                    <p className="text-sm font-medium mb-1">What Happened</p>
                    <p className="text-sm text-muted-foreground">{esc.description}</p>
                  </div>

                  <div className="bg-[--cs-warning-bg] border border-[--cs-warning-soft] rounded-md p-3">
                    <p className="text-sm font-medium text-[--cs-warning] mb-1">Why Escalated</p>
                    <p className="text-sm text-[--cs-warning]">{esc.reason}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-[--cs-success]" /> Action Taken
                    </p>
                    <p className="text-sm text-muted-foreground">{esc.action_taken}</p>
                  </div>

                  <div className={cn(
                    "rounded-md p-3 border",
                    esc.status === "resolved" ? "bg-[--cs-success-bg] border-[--cs-success-soft]" : "bg-[--cs-info-bg] border-[--cs-info-soft]"
                  )}>
                    <p className={cn(
                      "text-sm font-medium mb-1",
                      esc.status === "resolved" ? "text-[--cs-success]" : "text-[--cs-info]"
                    )}>Outcome</p>
                    <p className={cn(
                      "text-sm",
                      esc.status === "resolved" ? "text-[--cs-success]" : "text-[--cs-info]"
                    )}>{esc.outcome}</p>
                  </div>

                  {esc.linked_documents.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Linked Records</p>
                      <div className="flex flex-wrap gap-1">
                        {esc.linked_documents.map((doc, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{doc}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {esc.notes && (
                    <div className="bg-muted/30 rounded-md p-3">
                      <p className="text-sm font-medium mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground">{esc.notes}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Escalated By</p>
                      <p className="text-sm font-medium">{getStaffName(esc.escalated_by)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Escalated To</p>
                      <p className="text-sm font-medium">
                        {esc.escalated_to.startsWith("staff_") ? getStaffName(esc.escalated_to) : esc.escalated_to}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Resolved</p>
                      <p className="text-sm font-medium">{esc.resolved_date ?? "Ongoing"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Resolution Time</p>
                      <p className="text-sm font-medium">{esc.time_to_resolve ?? "—"}</p>
                    </div>
                  </div>
                </FlatListRowDetail>
              )}
            </div>
          );
        })}
      </FlatList>

      <div className="mt-8 bg-slate-50 border border-[var(--cs-border)] rounded-lg p-4">
        <p className="text-sm font-medium text-[var(--cs-text-secondary)] mb-1">Regulatory Context</p>
        <p className="text-xs text-[var(--cs-text-secondary)]">
          Effective escalation demonstrates professional accountability and safeguarding culture.
          Regulation 13 (Leadership and Management) requires clear lines of accountability.
          The SCCIF examines whether staff escalate concerns appropriately and whether managers
          respond effectively. Quality Standard 3 (Protection) requires that safeguarding
          concerns are escalated without delay. This tracker provides an audit trail showing
          that escalation pathways work — concerns are raised, heard, and acted upon.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Safeguarding & Behaviour"
        category={["safeguarding", "behaviour"]}
        days={90}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Escalation Tracker — concerns escalated to management, RI, Ofsted, LADO, police, safeguarding, decision audit trail, management response, outcome, Reg 40, Reg 45 evidence"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}
