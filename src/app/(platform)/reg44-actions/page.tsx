"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Clock, Eye, ListChecks, Loader2, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, STAFF } from "@/lib/seed-data";
import { toast } from "sonner";
import { useReg44ActionRecords, useCreateReg44ActionRecord } from "@/hooks/use-reg44-action-records";
import type {
  Reg44ActionRecord,
  Reg44ActionPriority,
  Reg44ActionStatus,
  Reg44ActionTheme,
} from "@/types/extended";
import {
  REG44_ACTION_PRIORITY_LABEL,
  REG44_ACTION_STATUS_LABEL,
  REG44_ACTION_THEME_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local colour maps ────────────────────────────────────────────────── */

const PRIORITY_CLR: Record<Reg44ActionPriority, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};
const STATUS_CLR: Record<Reg44ActionStatus, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  carried_forward: "bg-amber-100 text-amber-800",
};
const BORDER_PRI: Record<Reg44ActionPriority, string> = {
  low: "border-l-green-400",
  medium: "border-l-yellow-400",
  high: "border-l-orange-500",
  critical: "border-l-red-600",
};

/* ── page ─────────────────────────────────────────────────────────────── */

export default function Reg44ActionsPage() {
  const { data: records = [], isLoading } = useReg44ActionRecords();
  const createMutation = useCreateReg44ActionRecord();
  const today = new Date().toISOString().slice(0, 10);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterTheme, setFilterTheme] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const [form, setForm] = useState({
    visit_date: today,
    visit_ref: "",
    visitor_name: "",
    theme: "" as Reg44ActionTheme | "",
    priority: "medium" as Reg44ActionPriority,
    recommendation: "",
    action_required: "",
    management_response: "",
    assigned_to: "staff_darren",
    due_date: "",
  });
  const setF = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.theme || !form.recommendation.trim() || !form.action_required.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    await createMutation.mutateAsync({
      visit_date: form.visit_date,
      visit_ref: form.visit_ref.trim() || `R44-${form.visit_date.slice(0, 7).replace("-", "-")}`,
      visitor_name: form.visitor_name.trim() || "Independent Person",
      theme: form.theme as Reg44ActionTheme,
      priority: form.priority,
      status: "open",
      recommendation: form.recommendation.trim(),
      action_required: form.action_required.trim(),
      management_response: form.management_response.trim(),
      assigned_to: form.assigned_to,
      due_date: form.due_date || today,
      completed_date: null,
      evidence_of_completion: "",
      carried_forward_count: 0,
      notes: "",
    });
    toast.success("Reg 44 action recorded.");
    setForm({
      visit_date: today, visit_ref: "", visitor_name: "",
      theme: "", priority: "medium",
      recommendation: "", action_required: "", management_response: "",
      assigned_to: "staff_darren", due_date: "",
    });
    setShowNew(false);
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let rows = records.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterPriority !== "all" && r.priority !== filterPriority) return false;
      if (filterTheme !== "all" && r.theme !== filterTheme) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.recommendation.toLowerCase().includes(q) || r.action_required.toLowerCase().includes(q) || REG44_ACTION_THEME_LABEL[r.theme].toLowerCase().includes(q);
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.visit_date.localeCompare(a.visit_date);
        case "date-asc": return a.visit_date.localeCompare(b.visit_date);
        case "priority": { const p = ["critical", "high", "medium", "low"]; return p.indexOf(a.priority) - p.indexOf(b.priority); }
        case "due": return a.due_date.localeCompare(b.due_date);
        default: return 0;
      }
    });
    return rows;
  }, [records, search, filterStatus, filterPriority, filterTheme, sortBy]);

  const totalActions = records.length;
  const completed = records.filter((r) => r.status === "completed").length;
  const openActions = records.filter((r) => r.status === "open" || r.status === "in_progress").length;
  const overdue = records.filter((r) => r.status === "overdue" || r.status === "carried_forward").length;
  const completionRate = totalActions > 0 ? Math.round((completed / totalActions) * 100) : 0;

  const exportCols: ExportColumn<Reg44ActionRecord>[] = [
    { header: "Visit Date", accessor: (r) => r.visit_date },
    { header: "Visit Ref", accessor: (r) => r.visit_ref },
    { header: "Visitor", accessor: (r) => r.visitor_name },
    { header: "Theme", accessor: (r) => REG44_ACTION_THEME_LABEL[r.theme] },
    { header: "Priority", accessor: (r) => REG44_ACTION_PRIORITY_LABEL[r.priority] },
    { header: "Status", accessor: (r) => REG44_ACTION_STATUS_LABEL[r.status] },
    { header: "Recommendation", accessor: (r) => r.recommendation },
    { header: "Action Required", accessor: (r) => r.action_required },
    { header: "Assigned To", accessor: (r) => getStaffName(r.assigned_to) },
    { header: "Due Date", accessor: (r) => r.due_date },
    { header: "Completed", accessor: (r) => r.completed_date || "" },
    { header: "Evidence", accessor: (r) => r.evidence_of_completion },
    { header: "Mgmt Response", accessor: (r) => r.management_response },
  ];

  if (isLoading) {
    return (
      <PageShell title="Reg 44 Action Tracker" subtitle="Children's Homes Regulations 2015, Reg 44 — Independent Person's Report">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Reg 44 Action Tracker" subtitle="Children's Homes Regulations 2015, Reg 44 — Independent Person's Report" 
      ariaContext={{ pageTitle: "Reg 44 Action Tracker", sourceType: "child_record" }}
      actions={<div className="flex items-center gap-2"><PrintButton title="Reg 44 Actions" /><ExportButton data={filtered} columns={exportCols} filename="reg44-actions" /><Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Add Action</Button></div>}>
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Actions", value: totalActions, icon: ListChecks, clr: "text-blue-600" },
            { label: "Completed", value: completed, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Open / In Progress", value: openActions, icon: Clock, clr: "text-indigo-600" },
            { label: "Overdue / C/F", value: overdue, icon: AlertTriangle, clr: "text-red-600" },
            { label: "Completion Rate", value: `${completionRate}%`, icon: Eye, clr: "text-purple-600" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="pt-4 pb-3 text-center"><s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} /><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>

        {overdue > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm"><p className="font-semibold text-red-800">{overdue} action(s) overdue or carried forward</p><p className="text-red-700">Carried-forward actions will be highlighted to the Responsible Individual and may feature in the Reg 45 quality of care report.</p></div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search recommendation, action…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{(Object.keys(REG44_ACTION_STATUS_LABEL) as Reg44ActionStatus[]).map((k) => (<SelectItem key={k} value={k}>{REG44_ACTION_STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}><SelectTrigger className="w-[140px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Priority</SelectItem>{(Object.keys(REG44_ACTION_PRIORITY_LABEL) as Reg44ActionPriority[]).map((k) => (<SelectItem key={k} value={k}>{REG44_ACTION_PRIORITY_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterTheme} onValueChange={setFilterTheme}><SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Themes</SelectItem>{(Object.keys(REG44_ACTION_THEME_LABEL) as Reg44ActionTheme[]).map((k) => (<SelectItem key={k} value={k}>{REG44_ACTION_THEME_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date-desc">Newest Visit</SelectItem><SelectItem value="date-asc">Oldest Visit</SelectItem><SelectItem value="priority">By Priority</SelectItem><SelectItem value="due">By Due Date</SelectItem></SelectContent></Select>
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_PRI[r.priority])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {REG44_ACTION_THEME_LABEL[r.theme]}
                        <Badge variant="outline" className={PRIORITY_CLR[r.priority]}>{REG44_ACTION_PRIORITY_LABEL[r.priority]}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{REG44_ACTION_STATUS_LABEL[r.status]}</Badge>
                        {r.carried_forward_count > 0 && <Badge variant="outline" className="bg-amber-50">C/F ×{r.carried_forward_count}</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Visit: {r.visit_date} ({r.visit_ref}) · {r.visitor_name} · Assigned: {getStaffName(r.assigned_to)} · Due: {r.due_date}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    <div><p className="font-medium mb-1">Recommendation</p><p className="text-muted-foreground">{r.recommendation}</p></div>
                    <div className="bg-indigo-50 rounded-lg p-3"><p className="font-medium text-indigo-800 mb-1">Action Required</p><p className="text-indigo-700 text-xs">{r.action_required}</p></div>
                    <div><p className="font-medium mb-1">Management Response</p><p className="text-muted-foreground">{r.management_response}</p></div>
                    {r.evidence_of_completion && (
                      <div className="bg-green-50 rounded-lg p-3"><p className="font-medium text-green-800 mb-1">Evidence of Completion</p><p className="text-green-700 text-xs">{r.evidence_of_completion}</p></div>
                    )}
                    {r.notes && <div><p className="font-medium mb-1">Notes</p><p className="text-muted-foreground">{r.notes}</p></div>}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Assigned to: {getStaffName(r.assigned_to)}</span>
                      <span>Due: {r.due_date}</span>
                      <span>{r.completed_date ? `Completed: ${r.completed_date}` : "⚠ Not yet completed"}</span>
                    </div>
                    {r.visit_ref.startsWith("CE-") && (
                      <div className="pt-2 border-t">
                        <Link
                          href={`/care-events/${r.visit_ref.replace("CE-", "")}`}
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View source care event
                        </Link>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Children&apos;s Homes (England) Regulations 2015, Reg 44 — an independent person must visit at least monthly and produce a report with recommendations. The Registered Manager must respond to all recommendations within 14 days. Actions should be completed within the timescale agreed or carried forward with justification. The Responsible Individual must monitor action completion as part of Reg 45 oversight. Persistently carried-forward actions may indicate systemic issues requiring escalation.</p>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Regulation 44 Action</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label htmlFor="r44-date">Visit Date *</Label><Input id="r44-date" type="date" value={form.visit_date} max={today} onChange={(e) => setF("visit_date", e.target.value)} required /></div>
              <div className="space-y-1"><Label htmlFor="r44-ref">Visit Reference</Label><Input id="r44-ref" placeholder="e.g. R44-2026-MAY" value={form.visit_ref} onChange={(e) => setF("visit_ref", e.target.value)} /></div>
              <div className="space-y-1"><Label htmlFor="r44-visitor">Visitor Name</Label><Input id="r44-visitor" placeholder="Independent Person" value={form.visitor_name} onChange={(e) => setF("visitor_name", e.target.value)} /></div>
              <div className="space-y-1"><Label htmlFor="r44-theme">Theme *</Label>
                <Select value={form.theme} onValueChange={(v) => setF("theme", v)}>
                  <SelectTrigger id="r44-theme"><SelectValue placeholder="Select theme…" /></SelectTrigger>
                  <SelectContent>{(Object.keys(REG44_ACTION_THEME_LABEL) as Reg44ActionTheme[]).map((k) => (<SelectItem key={k} value={k}>{REG44_ACTION_THEME_LABEL[k]}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label htmlFor="r44-priority">Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setF("priority", v)}>
                  <SelectTrigger id="r44-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(REG44_ACTION_PRIORITY_LABEL) as Reg44ActionPriority[]).map((k) => (<SelectItem key={k} value={k}>{REG44_ACTION_PRIORITY_LABEL[k]}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label htmlFor="r44-due">Due Date</Label><Input id="r44-due" type="date" value={form.due_date} onChange={(e) => setF("due_date", e.target.value)} /></div>
              <div className="col-span-2 space-y-1"><Label htmlFor="r44-assigned">Assigned To</Label>
                <Select value={form.assigned_to} onValueChange={(v) => setF("assigned_to", v)}>
                  <SelectTrigger id="r44-assigned"><SelectValue /></SelectTrigger>
                  <SelectContent>{STAFF.filter((s) => s.employment_status === "active").map((s) => (<SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1"><Label htmlFor="r44-rec">Recommendation *</Label><Textarea id="r44-rec" rows={3} placeholder="What did the visitor recommend?" value={form.recommendation} onChange={(e) => setF("recommendation", e.target.value)} required /></div>
              <div className="col-span-2 space-y-1"><Label htmlFor="r44-action">Action Required *</Label><Textarea id="r44-action" rows={2} placeholder="What needs to be done?" value={form.action_required} onChange={(e) => setF("action_required", e.target.value)} required /></div>
              <div className="col-span-2 space-y-1"><Label htmlFor="r44-response">Management Response</Label><Textarea id="r44-response" rows={2} placeholder="RM response to the recommendation…" value={form.management_response} onChange={(e) => setF("management_response", e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save Action"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
