"use client";

import { useState, useMemo } from "react";
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
  AlertTriangle, CheckCircle2, Clock, BookOpen,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn, todayStr } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useDutyLogEntries, useCreateDutyLogEntry } from "@/hooks/use-duty-log-entries";
import type { DutyLogEntry, DutyLogShift, DutyLogCategory, DutyLogPriority } from "@/types/extended";
import { DUTY_LOG_SHIFT_LABEL, DUTY_LOG_CATEGORY_LABEL, DUTY_LOG_PRIORITY_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const SHIFT_CLR: Record<DutyLogShift, string> = { morning: "bg-yellow-100 text-yellow-800", afternoon: "bg-orange-100 text-orange-800", evening: "bg-indigo-100 text-indigo-800", night: "bg-slate-100 text-[var(--cs-navy)]", sleep_in: "bg-purple-100 text-purple-800" };

const CAT_CLR: Record<DutyLogCategory, string> = {
  incident: "bg-red-100 text-red-800", visitor: "bg-blue-100 text-blue-800",
  phone_call: "bg-indigo-100 text-indigo-800", maintenance: "bg-gray-100 text-gray-800",
  staff_change: "bg-slate-100 text-[var(--cs-navy)]", welfare: "bg-amber-100 text-amber-800",
  medication: "bg-purple-100 text-purple-800", safeguarding: "bg-red-100 text-red-800",
  routine: "bg-gray-100 text-gray-700", handover: "bg-blue-100 text-blue-800",
  complaint: "bg-orange-100 text-orange-800", positive: "bg-green-100 text-green-800",
};

const PRI_CLR: Record<DutyLogPriority, string> = { routine: "border-gray-300", important: "border-blue-400", urgent: "border-amber-400", critical: "border-red-500" };
const PRI_BADGE: Record<DutyLogPriority, string> = { routine: "bg-gray-100 text-gray-800", important: "bg-blue-100 text-blue-800", urgent: "bg-amber-100 text-amber-800", critical: "bg-red-100 text-red-800" };

/* ── component ─────────────────────────────────────────────────────────────── */

export default function DutyLogPage() {
  const { data: queryData, isLoading } = useDutyLogEntries();
  const data = queryData?.data ?? [];
  const createEntry = useCreateDutyLogEntry();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [priFilter, setPriFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  /* ── create form state ────────────────────────────────────────────────────── */
  const [formDate, setFormDate] = useState(todayStr());
  const [formTime, setFormTime] = useState("");
  const [formShift, setFormShift] = useState<DutyLogShift | "">("");
  const [formCategory, setFormCategory] = useState<DutyLogCategory | "">("");
  const [formPriority, setFormPriority] = useState<DutyLogPriority>("routine");
  const [formDescription, setFormDescription] = useState("");
  const [formActionTaken, setFormActionTaken] = useState("");

  const resetForm = () => {
    setFormDate(todayStr());
    setFormTime("");
    setFormShift("");
    setFormCategory("");
    setFormPriority("routine");
    setFormDescription("");
    setFormActionTaken("");
  };

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => r.description.toLowerCase().includes(s) || getStaffName(r.recorded_by).toLowerCase().includes(s)); }
    if (catFilter !== "all") out = out.filter(r => r.category === catFilter);
    if (priFilter !== "all") out = out.filter(r => r.priority === priFilter);
    if (shiftFilter !== "all") out = out.filter(r => r.shift === shiftFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "oldest": return `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);
        default: return `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`);
      }
    });
    return out;
  }, [data, search, catFilter, priFilter, shiftFilter, sortBy]);

  const todayEntries = data.filter(r => r.date === todayStr());
  const urgentCritical = todayEntries.filter(r => r.priority === "urgent" || r.priority === "critical");

  const exportCols: ExportColumn<DutyLogEntry>[] = useMemo(() => [
    { header: "Date", accessor: (r: DutyLogEntry) => r.date },
    { header: "Time", accessor: (r: DutyLogEntry) => r.time },
    { header: "Shift", accessor: (r: DutyLogEntry) => DUTY_LOG_SHIFT_LABEL[r.shift] },
    { header: "Category", accessor: (r: DutyLogEntry) => DUTY_LOG_CATEGORY_LABEL[r.category] },
    { header: "Priority", accessor: (r: DutyLogEntry) => r.priority },
    { header: "Recorded By", accessor: (r: DutyLogEntry) => getStaffName(r.recorded_by) },
    { header: "Young People", accessor: (r: DutyLogEntry) => r.young_person_ids.map(id => getYPName(id)).join(", ") || "N/A" },
    { header: "Description", accessor: (r: DutyLogEntry) => r.description },
    { header: "Action Taken", accessor: (r: DutyLogEntry) => r.action_taken },
    { header: "Follow-Up", accessor: (r: DutyLogEntry) => r.follow_up_required ? r.follow_up_notes : "No" },
    { header: "Manager Notified", accessor: (r: DutyLogEntry) => r.manager_notified ? "Yes" : "No" },
    { header: "Signed Off", accessor: (r: DutyLogEntry) => r.signed_off ? getStaffName(r.signed_off_by ?? "") : "No" },
  ], []);

  if (isLoading) {
    return (
      <PageShell title="Duty Log" subtitle="Daily Occurrence Book — legal record of all significant events per shift">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Duty Log"
      subtitle="Daily Occurrence Book — legal record of all significant events per shift"
      ariaContext={{ pageTitle: "Duty Log", sourceType: "general" }}
      actions={[
        <PrintButton key="p" title="Duty Log" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="duty-log" />,
        <Button key="n" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />New Entry</Button>,
        <AriaStudioQuickActionButton key="a" context={{ record_type: "daily_log", record_id: "home_oak", home_id: "home_oak" }} />,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Entries Today", value: todayEntries.length, icon: BookOpen, colour: "text-blue-600" },
            { label: "Urgent / Critical", value: urgentCritical.length, icon: AlertTriangle, colour: "text-red-600" },
            { label: "Follow-Ups Pending", value: data.filter(r => r.follow_up_required).length, icon: Clock, colour: "text-amber-600" },
            { label: "Signed Off", value: `${data.filter(r => r.signed_off).length}/${data.length}`, icon: CheckCircle2, colour: "text-green-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 flex items-center gap-3">
                <s.icon className={cn("h-8 w-8", s.colour)} />
                <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* filter bar */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[180px]">
                <Label className="text-xs">Search</Label>
                <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Description, staff…" value={search} onChange={e => setSearch(e.target.value)} /></div>
              </div>
              <div className="w-36">
                <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Shift</Label>
                <Select value={shiftFilter} onValueChange={setShiftFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Shifts</SelectItem>{(Object.entries(DUTY_LOG_SHIFT_LABEL) as [DutyLogShift, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Label className="text-xs">Category</Label>
                <Select value={catFilter} onValueChange={setCatFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All</SelectItem>{(Object.entries(DUTY_LOG_CATEGORY_LABEL) as [DutyLogCategory, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <Label className="text-xs">Priority</Label>
                <Select value={priFilter} onValueChange={setPriFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All</SelectItem>{(["routine", "important", "urgent", "critical"] as DutyLogPriority[]).map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="oldest">Oldest</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* timeline entries */}
        <div className="space-y-2">
          {filtered.map(r => {
            const open = expanded === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", PRI_CLR[r.priority])}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-mono text-muted-foreground w-12">{r.time}</span>
                        <Badge className={cn("text-xs", CAT_CLR[r.category])}>{DUTY_LOG_CATEGORY_LABEL[r.category]}</Badge>
                        <Badge className={cn("text-xs", SHIFT_CLR[r.shift])}>{DUTY_LOG_SHIFT_LABEL[r.shift]}</Badge>
                        {r.priority !== "routine" && <Badge className={cn("text-xs", PRI_BADGE[r.priority])}>{r.priority}</Badge>}
                        <span className="text-sm text-muted-foreground">— {getStaffName(r.recorded_by)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.young_person_ids.length > 0 && <span className="text-xs text-muted-foreground">{r.young_person_ids.map(id => getYPName(id)).join(", ")}</span>}
                        {r.signed_off && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                    <p className="text-sm mt-1 line-clamp-2">{r.description}</p>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-3 pt-0">
                    <p className="text-sm">{r.description}</p>

                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-1">Action Taken</p>
                      <p className="text-sm text-blue-900">{r.action_taken}</p>
                    </div>

                    {r.follow_up_required && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-semibold text-amber-800 mb-1">Follow-Up Required</p>
                        <p className="text-sm text-amber-900">{r.follow_up_notes}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs">
                      {r.manager_notified && <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-blue-500" />Manager notified</span>}
                      {r.witnessed_by && <span>Witnessed by: {getStaffName(r.witnessed_by)}</span>}
                      {r.signed_off && <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />Signed off: {getStaffName(r.signed_off_by ?? "")}</span>}
                    </div>

                    {r.linked_records.length > 0 && (
                      <div><p className="text-xs font-semibold mb-1">Linked Records</p><div className="flex gap-1 flex-wrap">{r.linked_records.map(lr => <Badge key={lr} variant="outline" className="text-xs">{lr}</Badge>)}</div></div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No entries match filters.</p>}
        </div>

        {/* daily summary */}
        <Card>
          <CardHeader><CardTitle className="text-base">Daily Summary — {todayStr()}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><span className="text-muted-foreground">Total entries:</span> <strong>{todayEntries.length}</strong></div>
              <div><span className="text-muted-foreground">Incidents:</span> <strong>{todayEntries.filter(r => r.category === "incident").length}</strong></div>
              <div><span className="text-muted-foreground">Positive:</span> <strong>{todayEntries.filter(r => r.category === "positive").length}</strong></div>
              <div><span className="text-muted-foreground">Signed off:</span> <strong>{todayEntries.filter(r => r.signed_off).length}/{todayEntries.length}</strong></div>
            </div>
          </CardContent>
        </Card>

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Legal Document</p>
          <p>The Duty Log is a legal document and must be available for inspection by Ofsted, Reg 44 visitors, and the Registered Individual. All entries must be factual, signed off, and contemporaneous. Entries cannot be deleted or altered — amendments must be clearly marked with reason and authorisation.</p>
        </div>
      </div>

      {/* dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Duty Log Entry</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} /></div>
              <div><Label>Time</Label><Input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Shift</Label><Select value={formShift} onValueChange={v => setFormShift(v as DutyLogShift)}><SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger><SelectContent>{(Object.entries(DUTY_LOG_SHIFT_LABEL) as [DutyLogShift, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Category</Label><Select value={formCategory} onValueChange={v => setFormCategory(v as DutyLogCategory)}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{(Object.entries(DUTY_LOG_CATEGORY_LABEL) as [DutyLogCategory, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Priority</Label><Select value={formPriority} onValueChange={v => setFormPriority(v as DutyLogPriority)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["routine", "important", "urgent", "critical"] as DutyLogPriority[]).map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Description</Label><Textarea rows={3} placeholder="What happened…" value={formDescription} onChange={e => setFormDescription(e.target.value)} /></div>
            <div><Label>Action Taken</Label><Textarea rows={2} placeholder="What was done…" value={formActionTaken} onChange={e => setFormActionTaken(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button disabled={createEntry.isPending} onClick={() => { createEntry.mutate({ date: formDate, time: formTime, shift: formShift as DutyLogShift, category: formCategory as DutyLogCategory, priority: formPriority, recorded_by: "staff_darren", young_person_ids: [], description: formDescription, action_taken: formActionTaken, follow_up_required: false, follow_up_notes: "", manager_notified: false, linked_records: [], witnessed_by: null, signed_off: false, signed_off_by: null }, { onSuccess: () => { toast.success("Duty log entry created"); setDialogOpen(false); resetForm(); }, onError: () => toast.error("Failed to create duty log entry") }); }}>{createEntry.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Creating...</> : "Save Entry"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Daily Log"
        category="general"
        days={14}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Duty Log — shift handover notes, on-call events, manager on duty, overnight incidents, emergency responses, duty manager decisions, staffing issues, building issues"
        recordType="daily_log"
        className="mt-6"
      />
    </PageShell>
  );
}
