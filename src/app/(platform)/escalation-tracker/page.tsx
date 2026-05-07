"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case "medium":
        return <Badge className="bg-amber-100 text-amber-800">Medium</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      case "open":
        return <Badge className="bg-blue-100 text-blue-800">Open</Badge>;
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
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Escalation Tracker"
      subtitle="Recording when concerns are escalated, to whom, actions taken, and outcomes"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="escalation-tracker" />
          <PrintButton title="Escalation Tracker" />
        </div>
      }
    >
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
            <p className="text-2xl font-bold text-blue-700">{stats.open}</p>
            <p className="text-xs text-muted-foreground">Open / Monitoring</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className={cn("text-2xl font-bold", stats.urgent > 0 ? "text-red-700" : "text-green-700")}>
              {stats.urgent}
            </p>
            <p className="text-xs text-muted-foreground">Urgent Active</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── urgent alert ─── */}
      {stats.urgent > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Urgent Escalation Active</p>
              <p className="text-xs text-red-700 mt-1">
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
      <div className="space-y-3">
        {filtered.map((esc) => {
          const expanded = expandedId === esc.id;

          return (
            <Card key={esc.id} className={cn(
              "overflow-hidden",
              esc.priority === "urgent" && esc.status !== "resolved" && "border-red-200"
            )}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(esc.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      esc.priority === "urgent" ? "bg-red-100" :
                      esc.priority === "high" ? "bg-orange-100" : "bg-amber-100"
                    )}>
                      <ArrowUp className={cn(
                        "h-5 w-5",
                        esc.priority === "urgent" ? "text-red-600" :
                        esc.priority === "high" ? "text-orange-600" : "text-amber-600"
                      )} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{esc.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {priorityBadge(esc.priority)}
                        {statusBadge(esc.status)}
                        <Badge variant="outline" className="text-xs">{ESCALATION_CATEGORY_LABEL[esc.category]}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
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
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">What Happened</p>
                    <p className="text-sm text-muted-foreground">{esc.description}</p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                    <p className="text-sm font-medium text-amber-800 mb-1">Why Escalated</p>
                    <p className="text-sm text-amber-700">{esc.reason}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600" /> Action Taken
                    </p>
                    <p className="text-sm text-muted-foreground">{esc.action_taken}</p>
                  </div>

                  <div className={cn(
                    "rounded-md p-3 border",
                    esc.status === "resolved" ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
                  )}>
                    <p className={cn(
                      "text-sm font-medium mb-1",
                      esc.status === "resolved" ? "text-green-800" : "text-blue-800"
                    )}>Outcome</p>
                    <p className={cn(
                      "text-sm",
                      esc.status === "resolved" ? "text-green-700" : "text-blue-700"
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
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">Regulatory Context</p>
        <p className="text-xs text-slate-600">
          Effective escalation demonstrates professional accountability and safeguarding culture.
          Regulation 13 (Leadership and Management) requires clear lines of accountability.
          The SCCIF examines whether staff escalate concerns appropriately and whether managers
          respond effectively. Quality Standard 3 (Protection) requires that safeguarding
          concerns are escalated without delay. This tracker provides an audit trail showing
          that escalation pathways work — concerns are raised, heard, and acted upon.
        </p>
      </div>
    </PageShell>
  );
}
