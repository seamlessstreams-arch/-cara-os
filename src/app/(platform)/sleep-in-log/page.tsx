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
  AlertTriangle, CheckCircle2, Clock, Moon, XCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName, STAFF } from "@/lib/seed-data";
import { toast } from "sonner";
import { useSleepInRecords, useCreateSleepInRecord } from "@/hooks/use-sleep-in-records";
import type { SleepInRecord, SleepInStatus, SleepInRoomCondition } from "@/types/extended";
import { SLEEP_IN_STATUS_LABEL, SLEEP_IN_ROOM_CONDITION_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── local config ─────────────────────────────────────────────────────── */

const STATUS_CLR: Record<SleepInStatus, string> = { completed: "bg-green-100 text-green-800", disturbed: "bg-amber-100 text-amber-800", abandoned: "bg-red-100 text-red-800", in_progress: "bg-blue-100 text-blue-800" };
const BORDER_CLR: Record<SleepInStatus, string> = { completed: "border-green-400", disturbed: "border-amber-400", abandoned: "border-red-400", in_progress: "border-blue-400" };
const ROOM_CLR: Record<SleepInRoomCondition, string> = { clean: "bg-green-100 text-green-800", acceptable: "bg-yellow-100 text-yellow-800", needs_attention: "bg-red-100 text-red-800" };

/* ── component ─────────────────────────────────────────────────────────── */

export default function SleepInLogPage() {
  const { data: records = [], isLoading } = useSleepInRecords();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const createSleepIn = useCreateSleepInRecord();
  const [siForm, setSiForm] = useState({ date: new Date().toISOString().slice(0, 10), staff_member: "staff_darren", start_time: "22:00", end_time: "07:00", room_used: "Sleep-in room (ground floor)", handover_notes: "", handover_to: "staff_ryan" });
  const setSI = (k: keyof typeof siForm, v: string) => setSiForm((p) => ({ ...p, [k]: v }));

  const handleCreateSleepIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siForm.handover_notes.trim()) { toast.error("Handover notes are required."); return; }
    await createSleepIn.mutateAsync({ date: siForm.date, staff_member: siForm.staff_member, start_time: siForm.start_time, end_time: siForm.end_time, room_used: siForm.room_used, disturbances: [], total_disturbance_minutes: 0, rest_achieved: true, handover_notes: siForm.handover_notes.trim(), handover_to: siForm.handover_to, room_condition: "clean", safety_check_completed: true, alarms_working: true, issues_reported: [], compensatory_rest: false, compensatory_rest_date: null, status: "completed", notes: "" });
    toast.success("Sleep-in logged.");
    setSiForm({ date: new Date().toISOString().slice(0, 10), staff_member: "staff_darren", start_time: "22:00", end_time: "07:00", room_used: "Sleep-in room (ground floor)", handover_notes: "", handover_to: "staff_ryan" });
    setDialogOpen(false);
  };

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const filtered = useMemo(() => {
    let out = [...records];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => getStaffName(r.staff_member).toLowerCase().includes(s) || r.handover_notes.toLowerCase().includes(s)); }
    if (statusFilter !== "all") out = out.filter(r => r.status === statusFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "oldest": return a.date.localeCompare(b.date);
        case "disturbed": return b.total_disturbance_minutes - a.total_disturbance_minutes;
        default: return b.date.localeCompare(a.date);
      }
    });
    return out;
  }, [records, search, statusFilter, sortBy]);

  const thisMonth = records.length;
  const disturbedPct = records.length > 0 ? Math.round(records.filter(r => r.status !== "completed").length / records.length * 100) : 0;
  const compRestOwed = records.filter(r => r.compensatory_rest && !r.compensatory_rest_date).length;
  const avgDistMins = records.length > 0 ? Math.round(records.reduce((s, r) => s + r.total_disturbance_minutes, 0) / records.length) : 0;

  /* staff summary */
  const staffIds = useMemo(() => [...new Set(records.map(r => r.staff_member))], [records]);
  const staffSummary = useMemo(() => staffIds.map(sid => {
    const recs = records.filter(r => r.staff_member === sid);
    const disturbed = recs.filter(r => r.status !== "completed").length;
    const compOwed = recs.filter(r => r.compensatory_rest && !r.compensatory_rest_date).length;
    return { id: sid, total: recs.length, disturbedPct: recs.length > 0 ? Math.round(disturbed / recs.length * 100) : 0, compOwed, last: recs.sort((a, b) => b.date.localeCompare(a.date))[0]?.date };
  }), [records, staffIds]);

  const exportCols: ExportColumn<SleepInRecord>[] = [
    { header: "Date", accessor: (r) => r.date },
    { header: "Staff", accessor: (r) => getStaffName(r.staff_member) },
    { header: "Start", accessor: (r) => r.start_time },
    { header: "End", accessor: (r) => r.end_time },
    { header: "Status", accessor: (r) => SLEEP_IN_STATUS_LABEL[r.status] },
    { header: "Disturbances", accessor: (r) => String(r.disturbances.length) },
    { header: "Total Mins Disturbed", accessor: (r) => String(r.total_disturbance_minutes) },
    { header: "Rest Achieved", accessor: (r) => r.rest_achieved ? "Yes" : "No" },
    { header: "Comp Rest Required", accessor: (r) => r.compensatory_rest ? "Yes" : "No" },
    { header: "Comp Rest Taken", accessor: (r) => r.compensatory_rest_date ?? "N/A" },
    { header: "Handover To", accessor: (r) => getStaffName(r.handover_to) },
    { header: "Notes", accessor: (r) => r.handover_notes },
  ];

  if (isLoading) {
    return (
      <PageShell title="Staff Sleep-In Log" subtitle="Sleep-in shift records, disturbances, and compensatory rest tracking">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Staff Sleep-In Log"
      subtitle="Sleep-in shift records, disturbances, and compensatory rest tracking"
      ariaContext={{ pageTitle: "Sleep-In Log", sourceType: "staff" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Sleep-In Log" />
          <ExportButton data={filtered} columns={exportCols} filename="sleep-in-log" />
          <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Log Sleep-In</Button>
          <AriaStudioQuickActionButton context={{ record_type: "rota", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

        {/* summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Sleep-Ins This Month", value: thisMonth, icon: Moon, colour: "text-indigo-600" },
            { label: "Disturbed Nights", value: `${disturbedPct}%`, icon: AlertTriangle, colour: "text-amber-600" },
            { label: "Comp Rest Owed", value: compRestOwed, icon: Clock, colour: "text-red-600" },
            { label: "Avg Disturbance Mins", value: avgDistMins, icon: Clock, colour: "text-gray-600" },
          ].map(s => (
            <Card key={s.label}><CardContent className="pt-4 flex items-center gap-3"><s.icon className={cn("h-8 w-8", s.colour)} /><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></CardContent></Card>
          ))}
        </div>

        {/* staff summary */}
        <div className="grid md:grid-cols-4 gap-4">
          {staffSummary.map(ss => (
            <Card key={ss.id}>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{getStaffName(ss.id)}</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Total Sleep-Ins</span><span className="font-medium">{ss.total}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Disturbed</span><span className={cn("font-medium", ss.disturbedPct > 50 ? "text-red-600" : "")}>{ss.disturbedPct}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Comp Rest Owed</span><Badge className={cn("text-xs", ss.compOwed > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800")}>{ss.compOwed}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Last Sleep-In</span><span>{ss.last}</span></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* alerts */}
        {compRestOwed > 0 && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div><p className="font-semibold text-red-900">Compensatory rest owed to {compRestOwed} staff member{compRestOwed > 1 ? "s" : ""}</p><p className="text-sm text-red-800">Working Time Regulations require compensatory rest within a reasonable period.</p></div>
          </div>
        )}

        {/* filter */}
        <Card><CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]"><Label className="text-xs">Search</Label><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Staff name, notes…" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
            <div className="w-40"><Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(Object.keys(SLEEP_IN_STATUS_LABEL) as SleepInStatus[]).map(k => <SelectItem key={k} value={k}>{SLEEP_IN_STATUS_LABEL[k]}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-40"><Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="oldest">Oldest</SelectItem><SelectItem value="disturbed">Most Disturbed</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent></Card>

        {/* sleep-in cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_CLR[r.status])}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Moon className="h-4 w-4 text-indigo-500" />
                        <CardTitle className="text-base">{r.date}</CardTitle>
                        <span className="text-sm text-muted-foreground">{getStaffName(r.staff_member)}</span>
                        <Badge className={cn("text-xs", STATUS_CLR[r.status])}>{SLEEP_IN_STATUS_LABEL[r.status]}</Badge>
                        {r.disturbances.length > 0 && <Badge variant="outline" className="text-xs">{r.disturbances.length} disturbance{r.disturbances.length > 1 ? "s" : ""}</Badge>}
                        {!r.rest_achieved && <Badge className="text-xs bg-red-100 text-red-800">Rest NOT achieved</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{r.start_time}–{r.end_time}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span><strong>Room:</strong> {r.room_used}</span>
                      <span><strong>Room Condition:</strong> <Badge className={cn("text-xs", ROOM_CLR[r.room_condition])}>{SLEEP_IN_ROOM_CONDITION_LABEL[r.room_condition]}</Badge></span>
                      <span><strong>Rest Achieved:</strong> {r.rest_achieved ? <CheckCircle2 className="inline h-4 w-4 text-green-600" /> : <XCircle className="inline h-4 w-4 text-red-600" />}</span>
                    </div>

                    {/* disturbance timeline */}
                    {r.disturbances.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold mb-2">Disturbances ({r.total_disturbance_minutes} mins total)</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div className={cn("h-2 rounded-full", r.total_disturbance_minutes >= 60 ? "bg-red-500" : r.total_disturbance_minutes >= 30 ? "bg-amber-500" : "bg-green-500")} style={{ width: `${Math.min(r.total_disturbance_minutes / 120 * 100, 100)}%` }} />
                        </div>
                        <div className="space-y-3 border-l-2 border-indigo-200 pl-4">
                          {r.disturbances.map((dist, i) => (
                            <div key={i} className="relative">
                              <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-400" />
                              <div className="text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-medium">{dist.time}</span>
                                  <Badge variant="outline" className="text-xs">{dist.duration} mins</Badge>
                                  {dist.child_id && <span className="text-xs">{getYPName(dist.child_id)}</span>}
                                  <span className="text-xs text-muted-foreground">Response: {dist.response_time} min</span>
                                </div>
                                <p className="text-xs text-muted-foreground font-medium mt-0.5">{dist.reason}</p>
                                <p className="text-xs text-muted-foreground">{dist.action_taken}</p>
                                <p className="text-xs">Back to bed: {dist.back_to_bed}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                        <CheckCircle2 className="inline h-4 w-4 mr-1" />No disturbances — peaceful night
                      </div>
                    )}

                    {/* safety checks */}
                    <div className="flex gap-4 text-xs">
                      <span className="flex items-center gap-1">{r.safety_check_completed ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}Safety check</span>
                      <span className="flex items-center gap-1">{r.alarms_working ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}Alarms working</span>
                    </div>

                    {r.issues_reported.length > 0 && (
                      <div><p className="text-xs font-semibold mb-1">Issues Reported</p><div className="flex gap-1 flex-wrap">{r.issues_reported.map(iss => <Badge key={iss} className="text-xs bg-amber-100 text-amber-800">{iss}</Badge>)}</div></div>
                    )}

                    {r.compensatory_rest && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm">
                        <p className="font-semibold text-red-800">Compensatory Rest Required</p>
                        {r.compensatory_rest_date ? <p className="text-red-700">Taken: {r.compensatory_rest_date}</p> : <p className="text-red-700 font-medium">Not yet taken — action required</p>}
                      </div>
                    )}

                    {/* handover */}
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-1">Handover Notes → {getStaffName(r.handover_to)}</p>
                      <p className="text-sm text-blue-900">{r.handover_notes}</p>
                    </div>

                    {r.notes && <p className="text-xs text-muted-foreground italic">{r.notes}</p>}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Working Time Regulations</p>
          <p>Working Time Regulations 1998 — workers are entitled to a minimum daily rest period of 11 consecutive hours. Where a sleep-in is significantly disturbed (rest not achieved), compensatory rest must be provided within a reasonable period. All disturbances must be documented for audit purposes.</p>
        </div>
      </div>

      {/* dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Sleep-In</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateSleepIn} className="space-y-3">
            <div><Label>Date</Label><Input type="date" value={siForm.date} onChange={(e) => setSI("date", e.target.value)} /></div>
            <div><Label>Staff Member</Label><Select value={siForm.staff_member} onValueChange={(v) => setSI("staff_member", v)}><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{STAFF.filter((s) => s.employment_status === "active").map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Start Time</Label><Input type="time" value={siForm.start_time} onChange={(e) => setSI("start_time", e.target.value)} /></div><div><Label>End Time</Label><Input type="time" value={siForm.end_time} onChange={(e) => setSI("end_time", e.target.value)} /></div></div>
            <div><Label>Room Used</Label><Input value={siForm.room_used} onChange={(e) => setSI("room_used", e.target.value)} /></div>
            <div><Label>Handover Notes *</Label><Textarea rows={3} placeholder="Summary of the night…" value={siForm.handover_notes} onChange={(e) => setSI("handover_notes", e.target.value)} /></div>
            <div><Label>Handover To</Label><Select value={siForm.handover_to} onValueChange={(v) => setSI("handover_to", v)}><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{STAFF.filter((s) => s.employment_status === "active").map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent></Select></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createSleepIn.isPending}>{createSleepIn.isPending ? "Saving…" : "Save Entry"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Sleep"
        category="sleep"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Sleep-In Log — staff sleep-in duty records, waking night cover, sleep-in entitlements, staffing compliance, Reg 40 staffing evidence, overnight incident evidence, Ofsted evidence"
        recordType="rota"
        className="mt-6"
      />
    </PageShell>
  );
}
