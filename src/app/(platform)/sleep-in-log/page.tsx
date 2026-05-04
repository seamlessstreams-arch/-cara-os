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
  AlertTriangle, CheckCircle2, Clock, Moon, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type SIStatus = "completed" | "disturbed" | "abandoned" | "in_progress";

interface Disturbance {
  time: string;
  duration: number;
  reason: string;
  youngPersonId: string | null;
  responseTime: number;
  actionTaken: string;
  backToBed: string;
}

interface SleepInEntry {
  id: string;
  date: string;
  staffMember: string;
  startTime: string;
  endTime: string;
  roomUsed: string;
  disturbances: Disturbance[];
  totalDisturbanceMinutes: number;
  restAchieved: boolean;
  handoverNotes: string;
  handoverTo: string;
  roomCondition: "clean" | "acceptable" | "needs_attention";
  safetyCheckCompleted: boolean;
  alarmsWorking: boolean;
  issuesReported: string[];
  compensatoryRest: boolean;
  compensatoryRestDate: string | null;
  status: SIStatus;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const STATUS_LABEL: Record<SIStatus, string> = { completed: "Completed", disturbed: "Disturbed", abandoned: "Abandoned", in_progress: "In Progress" };
const STATUS_CLR: Record<SIStatus, string> = { completed: "bg-green-100 text-green-800", disturbed: "bg-amber-100 text-amber-800", abandoned: "bg-red-100 text-red-800", in_progress: "bg-blue-100 text-blue-800" };

const ROOM_CLR: Record<string, string> = { clean: "bg-green-100 text-green-800", acceptable: "bg-yellow-100 text-yellow-800", needs_attention: "bg-red-100 text-red-800" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: SleepInEntry[] = [
  {
    id: "si1", date: d(-1), staffMember: "staff_diane", startTime: "22:00", endTime: "07:00",
    roomUsed: "Sleep-in room (ground floor)", disturbances: [],
    totalDisturbanceMinutes: 0, restAchieved: true,
    handoverNotes: "Peaceful night. All children slept through. No concerns. Building secure. Alarms tested and working. Ready for day shift.",
    handoverTo: "staff_darren", roomCondition: "clean", safetyCheckCompleted: true, alarmsWorking: true,
    issuesReported: [], compensatoryRest: false, compensatoryRestDate: null,
    status: "completed", notes: "",
  },
  {
    id: "si2", date: d(-3), staffMember: "staff_anna", startTime: "22:00", endTime: "07:00",
    roomUsed: "Sleep-in room (ground floor)",
    disturbances: [
      { time: "01:30", duration: 25, reason: "Nightmare", youngPersonId: "yp_jordan", responseTime: 2, actionTaken: "Went to Jordan's room. Sat with him, offered reassurance and warm drink. Jordan had a nightmare about previous placement. Comforted until calm.", backToBed: "01:55" },
      { time: "03:15", duration: 10, reason: "Bathroom visit", youngPersonId: "yp_casey", responseTime: 1, actionTaken: "Heard Casey moving around. Checked — was going to bathroom. No distress. Casey returned to bed independently.", backToBed: "03:25" },
    ],
    totalDisturbanceMinutes: 35, restAchieved: true,
    handoverNotes: "Two disturbances but manageable. Jordan had nightmare at 01:30 — took 25 mins to settle. Casey bathroom at 03:15 — brief. Rest achieved despite interruptions. Jordan may need check-in with key worker about recurring nightmares.",
    handoverTo: "staff_darren", roomCondition: "acceptable", safetyCheckCompleted: true, alarmsWorking: true,
    issuesReported: [], compensatoryRest: false, compensatoryRestDate: null,
    status: "completed", notes: "Recommend monitoring Jordan's sleep pattern this week.",
  },
  {
    id: "si3", date: d(-5), staffMember: "staff_chervelle", startTime: "22:00", endTime: "07:00",
    roomUsed: "Sleep-in room (ground floor)",
    disturbances: [
      { time: "02:00", duration: 90, reason: "Attempted to leave building", youngPersonId: "yp_alex", responseTime: 1, actionTaken: "Door alarm triggered at 02:00. Found Alex fully dressed at front door trying to leave. Alex was agitated and said he wanted to go to his mum's house. De-escalation took 45 minutes. Alex eventually agreed to sit in lounge with a drink. Returned to bed at 03:30. Manager (Darren) called at 02:15 for guidance.", backToBed: "03:30" },
    ],
    totalDisturbanceMinutes: 90, restAchieved: false,
    handoverNotes: "Significant disturbance — Alex attempted to leave building at 02:00. 90 minutes managing the situation. Rest NOT achieved. Compensatory rest required per policy. Full incident report to follow. Alex calm this morning but tired.",
    handoverTo: "staff_ryan", roomCondition: "acceptable", safetyCheckCompleted: true, alarmsWorking: true,
    issuesReported: ["Alex attempted to leave — incident logged", "Compensatory rest needed"],
    compensatoryRest: true, compensatoryRestDate: d(-3),
    status: "disturbed", notes: "Linked to incident report INC-2298. Missing from care protocol was not fully activated as Alex did not leave the building.",
  },
  {
    id: "si4", date: d(-7), staffMember: "staff_edward", startTime: "22:00", endTime: "07:00",
    roomUsed: "Sleep-in room (ground floor)", disturbances: [],
    totalDisturbanceMinutes: 0, restAchieved: true,
    handoverNotes: "Quiet night. No disturbances. Note: lightbulb in sleep-in room has blown — replacement needed.",
    handoverTo: "staff_anna", roomCondition: "needs_attention", safetyCheckCompleted: true, alarmsWorking: true,
    issuesReported: ["Sleep-in room lightbulb blown"],
    compensatoryRest: false, compensatoryRestDate: null,
    status: "completed", notes: "Maintenance request submitted for lightbulb.",
  },
  {
    id: "si5", date: d(-9), staffMember: "staff_diane", startTime: "22:00", endTime: "04:30",
    roomUsed: "Sleep-in room (ground floor)",
    disturbances: [
      { time: "23:45", duration: 20, reason: "Cannot sleep", youngPersonId: "yp_jordan", responseTime: 3, actionTaken: "Jordan came to sleep-in room door saying he couldn't sleep. Offered warm milk and sat with him reading for 15 minutes. Returned to bed at 00:05.", backToBed: "00:05" },
      { time: "01:00", duration: 40, reason: "Upset / emotional", youngPersonId: "yp_alex", responseTime: 2, actionTaken: "Alex crying in his room. Upset about his birthday coming up and missing his mum. Long conversation about feelings. Alex eventually calmed with reassurance that we'd plan something special.", backToBed: "01:40" },
      { time: "04:30", duration: 0, reason: "Night terrors", youngPersonId: "yp_casey", responseTime: 1, actionTaken: "Casey screaming — night terror. Went to room immediately. Casey was thrashing in bed but still asleep. Did not wake her per protocol. Sat in doorway until settled at 04:50. Did not return to sleep-in room — stayed awake on duty until handover.", backToBed: "N/A" },
    ],
    totalDisturbanceMinutes: 120, restAchieved: false,
    handoverNotes: "Very difficult night. Three disturbances totalling 2 hours. Rest NOT achieved — abandoned sleep-in at 04:30 after Casey's night terror. Compensatory rest taken on 2nd. All three children had disrupted nights — may indicate heightened anxiety across the home. Team discussion recommended.",
    handoverTo: "staff_darren", roomCondition: "acceptable", safetyCheckCompleted: true, alarmsWorking: true,
    issuesReported: ["Compensatory rest required", "All 3 YP had disturbed nights — review triggers"],
    compensatoryRest: true, compensatoryRestDate: d(-7),
    status: "abandoned", notes: "Recommend team discussion about home atmosphere this week. Three children all disrupted on same night is unusual.",
  },
  {
    id: "si6", date: d(-11), staffMember: "staff_ryan", startTime: "22:00", endTime: "07:00",
    roomUsed: "Sleep-in room (ground floor)",
    disturbances: [
      { time: "22:30", duration: 10, reason: "Fire alarm test triggered", youngPersonId: null, responseTime: 0, actionTaken: "Fire alarm panel triggered briefly — faulty smoke detector in hallway activated. Reset within 2 minutes. All children woke briefly. Reassured all three — back in beds within 10 minutes. Engineer booked for morning.", backToBed: "22:40" },
    ],
    totalDisturbanceMinutes: 10, restAchieved: true,
    handoverNotes: "Fire alarm triggered at 22:30 — false alarm from faulty detector. Children briefly disturbed but settled quickly. Rest achieved after that. Engineer needed for smoke detector.",
    handoverTo: "staff_darren", roomCondition: "clean", safetyCheckCompleted: true, alarmsWorking: false,
    issuesReported: ["Faulty smoke detector — hallway. Engineer booked."],
    compensatoryRest: false, compensatoryRestDate: null,
    status: "completed", notes: "Smoke detector replaced next day by engineer.",
  },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function SleepInLogPage() {
  const [data] = useState<SleepInEntry[]>(SEED);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => getStaffName(r.staffMember).toLowerCase().includes(s) || r.handoverNotes.toLowerCase().includes(s)); }
    if (statusFilter !== "all") out = out.filter(r => r.status === statusFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "oldest": return a.date.localeCompare(b.date);
        case "disturbed": return b.totalDisturbanceMinutes - a.totalDisturbanceMinutes;
        default: return b.date.localeCompare(a.date);
      }
    });
    return out;
  }, [data, search, statusFilter, sortBy]);

  const thisMonth = data.length;
  const disturbedPct = Math.round(data.filter(r => r.status !== "completed").length / data.length * 100);
  const compRestOwed = data.filter(r => r.compensatoryRest && !r.compensatoryRestDate).length;
  const avgDistMins = Math.round(data.reduce((s, r) => s + r.totalDisturbanceMinutes, 0) / data.length);

  /* staff summary */
  const staffIds = [...new Set(data.map(r => r.staffMember))];
  const staffSummary = staffIds.map(sid => {
    const recs = data.filter(r => r.staffMember === sid);
    const disturbed = recs.filter(r => r.status !== "completed").length;
    const compOwed = recs.filter(r => r.compensatoryRest && !r.compensatoryRestDate).length;
    return { id: sid, total: recs.length, disturbedPct: Math.round(disturbed / recs.length * 100), compOwed, last: recs.sort((a, b) => b.date.localeCompare(a.date))[0]?.date };
  });

  const exportCols: ExportColumn<SleepInEntry>[] = useMemo(() => [
    { header: "Date", accessor: (r: SleepInEntry) => r.date },
    { header: "Staff", accessor: (r: SleepInEntry) => getStaffName(r.staffMember) },
    { header: "Start", accessor: (r: SleepInEntry) => r.startTime },
    { header: "End", accessor: (r: SleepInEntry) => r.endTime },
    { header: "Status", accessor: (r: SleepInEntry) => STATUS_LABEL[r.status] },
    { header: "Disturbances", accessor: (r: SleepInEntry) => String(r.disturbances.length) },
    { header: "Total Mins Disturbed", accessor: (r: SleepInEntry) => String(r.totalDisturbanceMinutes) },
    { header: "Rest Achieved", accessor: (r: SleepInEntry) => r.restAchieved ? "Yes" : "No" },
    { header: "Comp Rest Required", accessor: (r: SleepInEntry) => r.compensatoryRest ? "Yes" : "No" },
    { header: "Comp Rest Taken", accessor: (r: SleepInEntry) => r.compensatoryRestDate ?? "N/A" },
    { header: "Handover To", accessor: (r: SleepInEntry) => getStaffName(r.handoverTo) },
    { header: "Notes", accessor: (r: SleepInEntry) => r.handoverNotes },
  ], []);

  return (
    <PageShell
      title="Staff Sleep-In Log"
      subtitle="Sleep-in shift records, disturbances, and compensatory rest tracking"
      actions={[
        <PrintButton key="p" title="Staff Sleep-In Log" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="sleep-in-log" />,
        <Button key="n" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Log Sleep-In</Button>,
      ]}
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
            <div className="w-40"><Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(Object.entries(STATUS_LABEL) as [SIStatus, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-40"><Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="oldest">Oldest</SelectItem><SelectItem value="disturbed">Most Disturbed</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent></Card>

        {/* sleep-in cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", r.status === "completed" ? "border-green-400" : r.status === "disturbed" ? "border-amber-400" : r.status === "abandoned" ? "border-red-400" : "border-blue-400")}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Moon className="h-4 w-4 text-indigo-500" />
                        <CardTitle className="text-base">{r.date}</CardTitle>
                        <span className="text-sm text-muted-foreground">{getStaffName(r.staffMember)}</span>
                        <Badge className={cn("text-xs", STATUS_CLR[r.status])}>{STATUS_LABEL[r.status]}</Badge>
                        {r.disturbances.length > 0 && <Badge variant="outline" className="text-xs">{r.disturbances.length} disturbance{r.disturbances.length > 1 ? "s" : ""}</Badge>}
                        {!r.restAchieved && <Badge className="text-xs bg-red-100 text-red-800">Rest NOT achieved</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{r.startTime}–{r.endTime}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span><strong>Room:</strong> {r.roomUsed}</span>
                      <span><strong>Room Condition:</strong> <Badge className={cn("text-xs", ROOM_CLR[r.roomCondition])}>{r.roomCondition.replace("_", " ")}</Badge></span>
                      <span><strong>Rest Achieved:</strong> {r.restAchieved ? <CheckCircle2 className="inline h-4 w-4 text-green-600" /> : <XCircle className="inline h-4 w-4 text-red-600" />}</span>
                    </div>

                    {/* disturbance timeline */}
                    {r.disturbances.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold mb-2">Disturbances ({r.totalDisturbanceMinutes} mins total)</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div className={cn("h-2 rounded-full", r.totalDisturbanceMinutes >= 60 ? "bg-red-500" : r.totalDisturbanceMinutes >= 30 ? "bg-amber-500" : "bg-green-500")} style={{ width: `${Math.min(r.totalDisturbanceMinutes / 120 * 100, 100)}%` }} />
                        </div>
                        <div className="space-y-3 border-l-2 border-indigo-200 pl-4">
                          {r.disturbances.map((dist, i) => (
                            <div key={i} className="relative">
                              <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-400" />
                              <div className="text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-medium">{dist.time}</span>
                                  <Badge variant="outline" className="text-xs">{dist.duration} mins</Badge>
                                  {dist.youngPersonId && <span className="text-xs">{getYPName(dist.youngPersonId)}</span>}
                                  <span className="text-xs text-muted-foreground">Response: {dist.responseTime} min</span>
                                </div>
                                <p className="text-xs text-muted-foreground font-medium mt-0.5">{dist.reason}</p>
                                <p className="text-xs text-muted-foreground">{dist.actionTaken}</p>
                                <p className="text-xs">Back to bed: {dist.backToBed}</p>
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
                      <span className="flex items-center gap-1">{r.safetyCheckCompleted ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}Safety check</span>
                      <span className="flex items-center gap-1">{r.alarmsWorking ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}Alarms working</span>
                    </div>

                    {r.issuesReported.length > 0 && (
                      <div><p className="text-xs font-semibold mb-1">Issues Reported</p><div className="flex gap-1 flex-wrap">{r.issuesReported.map(iss => <Badge key={iss} className="text-xs bg-amber-100 text-amber-800">{iss}</Badge>)}</div></div>
                    )}

                    {r.compensatoryRest && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm">
                        <p className="font-semibold text-red-800">Compensatory Rest Required</p>
                        {r.compensatoryRestDate ? <p className="text-red-700">Taken: {r.compensatoryRestDate}</p> : <p className="text-red-700 font-medium">Not yet taken — action required</p>}
                      </div>
                    )}

                    {/* handover */}
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-1">Handover Notes → {getStaffName(r.handoverTo)}</p>
                      <p className="text-sm text-blue-900">{r.handoverNotes}</p>
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
          <div className="space-y-3">
            <div><Label>Date</Label><Input type="date" defaultValue={d(0)} /></div>
            <div><Label>Staff Member</Label><Select><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{staffIds.map(id => <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Start Time</Label><Input type="time" defaultValue="22:00" /></div><div><Label>End Time</Label><Input type="time" defaultValue="07:00" /></div></div>
            <div><Label>Room Used</Label><Input defaultValue="Sleep-in room (ground floor)" /></div>
            <div><Label>Handover Notes</Label><Textarea rows={3} placeholder="Summary of the night…" /></div>
            <div><Label>Handover To</Label><Select><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{staffIds.map(id => <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setDialogOpen(false)}>Save Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
