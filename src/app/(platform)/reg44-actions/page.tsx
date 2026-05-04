"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
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
  AlertTriangle, CheckCircle2, Clock, Eye, ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type Priority = "low" | "medium" | "high" | "critical";
type ActionStatus = "open" | "in_progress" | "completed" | "overdue" | "carried_forward";
type ActionTheme = "safeguarding" | "health_wellbeing" | "education" | "staffing" | "premises" | "record_keeping" | "medication" | "complaints" | "quality_care" | "policies" | "other";

interface Reg44Action {
  id: string;
  visitDate: string;
  visitRef: string;
  visitorName: string;
  theme: ActionTheme;
  priority: Priority;
  status: ActionStatus;
  recommendation: string;
  actionRequired: string;
  assignedTo: string;
  dueDate: string;
  completedDate: string | null;
  evidenceOfCompletion: string;
  managementResponse: string;
  carriedForwardCount: number;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const PRIORITY_LABEL: Record<Priority, string> = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
const PRIORITY_CLR: Record<Priority, string> = { low: "bg-green-100 text-green-800", medium: "bg-yellow-100 text-yellow-800", high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800" };
const STATUS_LABEL: Record<ActionStatus, string> = { open: "Open", in_progress: "In Progress", completed: "Completed", overdue: "Overdue", carried_forward: "Carried Forward" };
const STATUS_CLR: Record<ActionStatus, string> = { open: "bg-blue-100 text-blue-800", in_progress: "bg-indigo-100 text-indigo-800", completed: "bg-green-100 text-green-800", overdue: "bg-red-100 text-red-800", carried_forward: "bg-amber-100 text-amber-800" };
const THEME_LABEL: Record<ActionTheme, string> = {
  safeguarding: "Safeguarding", health_wellbeing: "Health & Wellbeing", education: "Education",
  staffing: "Staffing", premises: "Premises", record_keeping: "Record Keeping",
  medication: "Medication", complaints: "Complaints", quality_care: "Quality of Care",
  policies: "Policies", other: "Other",
};
const BORDER_PRI: Record<Priority, string> = { low: "border-l-green-400", medium: "border-l-yellow-400", high: "border-l-orange-500", critical: "border-l-red-600" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: Reg44Action[] = [
  {
    id: "r44_1", visitDate: d(-28), visitRef: "R44-2024-MAR", visitorName: "Helen Crawford",
    theme: "record_keeping", priority: "medium", status: "completed",
    recommendation: "Daily log entries for 3 days in February had no second-checker signature. While content was present and accurate, the absence of a countersign means entries were not verified.",
    actionRequired: "Implement daily check that all log entries from the previous shift have a countersigning staff member. Add countersign column to handover checklist.",
    assignedTo: "staff_darren", dueDate: d(-14), completedDate: d(-16),
    evidenceOfCompletion: "Handover checklist updated to include countersign verification. Team briefing delivered on 15th. Spot checks conducted over 2 weeks — 100% compliance since implementation. Evidence: updated checklist template, team meeting minutes, spot check log.",
    managementResponse: "Accepted. The gap arose during a period of short staffing when second-checker was not always available at end of shift. New process ensures outgoing staff countersign before leaving.",
    carriedForwardCount: 0, notes: "",
  },
  {
    id: "r44_2", visitDate: d(-28), visitRef: "R44-2024-MAR", visitorName: "Helen Crawford",
    theme: "premises", priority: "high", status: "in_progress",
    recommendation: "Back garden fence panel (between home and neighbouring property) is damaged — 2 panels loose at base. This creates a potential security risk and a gap through which a young person could leave the property unsupervised.",
    actionRequired: "Repair or replace damaged fence panels. Interim risk assessment to be completed until repair is done. Consider whether temporary barrier needed.",
    assignedTo: "staff_ryan", dueDate: d(-7), completedDate: null,
    evidenceOfCompletion: "",
    managementResponse: "Accepted. Interim measure: garden access supervised until repair completed. Maintenance contractor contacted — repair scheduled for next week. Panels ordered. Temporary wire mesh fixed as interim barrier on day of identification.",
    carriedForwardCount: 0, notes: "Fence panels on order. Contractor confirmed for " + d(3) + ". Temporary mesh in place — checked daily.",
  },
  {
    id: "r44_3", visitDate: d(-28), visitRef: "R44-2024-MAR", visitorName: "Helen Crawford",
    theme: "medication", priority: "medium", status: "completed",
    recommendation: "PRN medication protocol for Promethazine (Casey) does not specify the minimum interval between doses. While staff reported they follow GP guidance of 6 hours, this is not documented in the PRN protocol itself.",
    actionRequired: "Update PRN protocol for Promethazine to include minimum dose interval (6 hours as per GP guidance). Ensure all PRN protocols have clear dose intervals documented.",
    assignedTo: "staff_darren", dueDate: d(-14), completedDate: d(-18),
    evidenceOfCompletion: "All PRN protocols reviewed and updated with explicit dose intervals. GP confirmed 6-hour interval for Promethazine in writing (letter dated " + d(-20) + "). All staff briefed at team meeting. Protocols now include: max dose in 24hrs, minimum interval, circumstances for use, who to contact if additional doses needed.",
    managementResponse: "Accepted. Good practice point — all PRN protocols have now been standardised to include dose intervals, maximum daily doses, and escalation procedures.",
    carriedForwardCount: 0, notes: "",
  },
  {
    id: "r44_4", visitDate: d(-56), visitRef: "R44-2024-FEB", visitorName: "Helen Crawford",
    theme: "staffing", priority: "medium", status: "completed",
    recommendation: "Two agency staff used in January did not have home-specific induction records on file. While both had DBS and agency induction, the home's local induction checklist was not completed.",
    actionRequired: "Ensure all agency staff complete local induction checklist before working unsupervised. Checklist to be filed and available for inspection.",
    assignedTo: "staff_ryan", dueDate: d(-42), completedDate: d(-45),
    evidenceOfCompletion: "Local induction checklist updated to include agency-specific section. All future agency staff to complete on arrival — before starting shift. Two retrospective checklists completed for the agency staff in question (interviewed by phone). Checklist now includes: emergency procedures, safeguarding contacts, YP individual needs, medication procedures, behaviour management approaches.",
    managementResponse: "Accepted. Process improvement — induction checklist now a mandatory first task for all new or agency staff. Copy emailed to agency in advance.",
    carriedForwardCount: 0, notes: "",
  },
  {
    id: "r44_5", visitDate: d(-28), visitRef: "R44-2024-MAR", visitorName: "Helen Crawford",
    theme: "quality_care", priority: "low", status: "open",
    recommendation: "The home's statement of purpose references a therapy room, but this room is currently being used as a storage area. Consider either reinstating the therapy space or updating the statement of purpose to reflect current room usage.",
    actionRequired: "Decision needed: reinstate therapy room (clear storage) or update statement of purpose. If reinstated, consider what therapeutic resources should be available.",
    assignedTo: "staff_darren", dueDate: d(14), completedDate: null,
    evidenceOfCompletion: "",
    managementResponse: "Noted. Storage accumulated during building works. Plan to clear and reinstate therapy room — will need to source alternative storage. Discussed with RI — budget approved for a small garden storage unit to free up the therapy room.",
    carriedForwardCount: 0, notes: "Garden storage unit ordered. Expected delivery " + d(7) + ". Aim to have therapy room reinstated by " + d(14) + ".",
  },
  {
    id: "r44_6", visitDate: d(-56), visitRef: "R44-2024-FEB", visitorName: "Helen Crawford",
    theme: "health_wellbeing", priority: "high", status: "carried_forward",
    recommendation: "Casey's dental appointment is overdue by 4 months. Records indicate anxiety around dental visits is the primary barrier. A desensitisation plan should be considered.",
    actionRequired: "Arrange dental appointment with Casey. Consider referral to community dental service for anxious patients. Develop desensitisation plan if needed.",
    assignedTo: "staff_anna", dueDate: d(-42), completedDate: null,
    evidenceOfCompletion: "",
    managementResponse: "Initial appointment booked and cancelled by Casey (anxiety). Community dental service referral made — waiting list approximately 6 weeks. In the interim, Anna is doing direct work with Casey using social stories about dental visits. Casey's CAMHS worker has been asked to support. This action is being carried forward until dental visit is completed.",
    carriedForwardCount: 2, notes: "Community dental service appointment confirmed for " + d(14) + ". Casey has agreed to attend with Anna. CAMHS worker provided coping strategies.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function Reg44ActionsPage() {
  const [data] = useState(SEED);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterTheme, setFilterTheme] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterPriority !== "all" && r.priority !== filterPriority) return false;
      if (filterTheme !== "all" && r.theme !== filterTheme) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.recommendation.toLowerCase().includes(q) || r.actionRequired.toLowerCase().includes(q) || THEME_LABEL[r.theme].toLowerCase().includes(q);
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.visitDate.localeCompare(a.visitDate);
        case "date-asc": return a.visitDate.localeCompare(b.visitDate);
        case "priority": { const p = ["critical", "high", "medium", "low"]; return p.indexOf(a.priority) - p.indexOf(b.priority); }
        case "due": return a.dueDate.localeCompare(b.dueDate);
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterStatus, filterPriority, filterTheme, sortBy]);

  const totalActions = data.length;
  const completed = data.filter((r) => r.status === "completed").length;
  const openActions = data.filter((r) => r.status === "open" || r.status === "in_progress").length;
  const overdue = data.filter((r) => r.status === "overdue" || r.status === "carried_forward").length;
  const completionRate = totalActions > 0 ? Math.round((completed / totalActions) * 100) : 0;

  const exportCols: ExportColumn<Reg44Action>[] = [
    { header: "Visit Date", accessor: (r: Reg44Action) => r.visitDate },
    { header: "Visit Ref", accessor: (r: Reg44Action) => r.visitRef },
    { header: "Visitor", accessor: (r: Reg44Action) => r.visitorName },
    { header: "Theme", accessor: (r: Reg44Action) => THEME_LABEL[r.theme] },
    { header: "Priority", accessor: (r: Reg44Action) => PRIORITY_LABEL[r.priority] },
    { header: "Status", accessor: (r: Reg44Action) => STATUS_LABEL[r.status] },
    { header: "Recommendation", accessor: (r: Reg44Action) => r.recommendation },
    { header: "Action Required", accessor: (r: Reg44Action) => r.actionRequired },
    { header: "Assigned To", accessor: (r: Reg44Action) => getStaffName(r.assignedTo) },
    { header: "Due Date", accessor: (r: Reg44Action) => r.dueDate },
    { header: "Completed", accessor: (r: Reg44Action) => r.completedDate || "" },
    { header: "Evidence", accessor: (r: Reg44Action) => r.evidenceOfCompletion },
    { header: "Mgmt Response", accessor: (r: Reg44Action) => r.managementResponse },
  ];

  return (
    <PageShell title="Reg 44 Action Tracker" subtitle="Children's Homes Regulations 2015, Reg 44 — Independent Person's Report" actions={<div className="flex items-center gap-2"><PrintButton title="Reg 44 Actions" /><ExportButton data={filtered} columns={exportCols} filename="reg44-actions" /><Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Add Action</Button></div>}>
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
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{(Object.keys(STATUS_LABEL) as ActionStatus[]).map((k) => (<SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}><SelectTrigger className="w-[140px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Priority</SelectItem>{(Object.keys(PRIORITY_LABEL) as Priority[]).map((k) => (<SelectItem key={k} value={k}>{PRIORITY_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterTheme} onValueChange={setFilterTheme}><SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Themes</SelectItem>{(Object.keys(THEME_LABEL) as ActionTheme[]).map((k) => (<SelectItem key={k} value={k}>{THEME_LABEL[k]}</SelectItem>))}</SelectContent></Select>
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
                        {THEME_LABEL[r.theme]}
                        <Badge variant="outline" className={PRIORITY_CLR[r.priority]}>{PRIORITY_LABEL[r.priority]}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                        {r.carriedForwardCount > 0 && <Badge variant="outline" className="bg-amber-50">C/F ×{r.carriedForwardCount}</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Visit: {r.visitDate} ({r.visitRef}) · {r.visitorName} · Assigned: {getStaffName(r.assignedTo)} · Due: {r.dueDate}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    <div><p className="font-medium mb-1">Recommendation</p><p className="text-muted-foreground">{r.recommendation}</p></div>
                    <div className="bg-indigo-50 rounded-lg p-3"><p className="font-medium text-indigo-800 mb-1">Action Required</p><p className="text-indigo-700 text-xs">{r.actionRequired}</p></div>
                    <div><p className="font-medium mb-1">Management Response</p><p className="text-muted-foreground">{r.managementResponse}</p></div>
                    {r.evidenceOfCompletion && (
                      <div className="bg-green-50 rounded-lg p-3"><p className="font-medium text-green-800 mb-1">Evidence of Completion</p><p className="text-green-700 text-xs">{r.evidenceOfCompletion}</p></div>
                    )}
                    {r.notes && <div><p className="font-medium mb-1">Notes</p><p className="text-muted-foreground">{r.notes}</p></div>}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Assigned to: {getStaffName(r.assignedTo)}</span>
                      <span>Due: {r.dueDate}</span>
                      <span>{r.completedDate ? `Completed: ${r.completedDate}` : "⚠ Not yet completed"}</span>
                    </div>
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
          <DialogHeader><DialogTitle>Add Reg 44 Action</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Visit Date</Label><Input type="date" /></div>
            <div><Label>Visit Reference</Label><Input placeholder="e.g. R44-2024-APR" /></div>
            <div><Label>Visitor Name</Label><Input placeholder="Independent Person" /></div>
            <div><Label>Theme</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(THEME_LABEL) as ActionTheme[]).map((k) => (<SelectItem key={k} value={k}>{THEME_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Priority</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(PRIORITY_LABEL) as Priority[]).map((k) => (<SelectItem key={k} value={k}>{PRIORITY_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Due Date</Label><Input type="date" /></div>
            <div className="col-span-2"><Label>Recommendation</Label><Textarea rows={3} placeholder="What did the visitor recommend?" /></div>
            <div className="col-span-2"><Label>Action Required</Label><Textarea rows={2} placeholder="What needs to be done?" /></div>
            <div className="col-span-2"><Label>Management Response</Label><Textarea rows={2} placeholder="RM response to the recommendation…" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={() => setShowNew(false)}>Save Action</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}