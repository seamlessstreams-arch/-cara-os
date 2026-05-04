"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  Clock, Sun, Moon, Sunset, AlertTriangle, CheckCircle2,
  FileText, Users, Star
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type ShiftType = "morning" | "afternoon" | "evening" | "night" | "sleep_in";

interface ChildNote {
  childId: string;
  mood: "great" | "good" | "okay" | "low" | "distressed";
  summary: string;
  meals: string;
  medication: boolean;
  concerns: string;
}

interface ShiftNote {
  id: string;
  date: string;
  shift: ShiftType;
  startTime: string;
  endTime: string;
  staffOnDuty: string[];
  childNotes: ChildNote[];
  generalNotes: string;
  maintenanceIssues: string;
  visitorsLog: string;
  handoverPriorities: string[];
  incidentsRef: string[];
  completedTasks: string[];
  outstandingTasks: string[];
  recordedBy: string;
  createdAt: string;
}

const SHIFT_META: Record<ShiftType, { label: string; icon: React.ReactNode; color: string; times: string }> = {
  morning:   { label: "Morning",   icon: <Sun className="h-4 w-4" />,    color: "bg-amber-100 text-amber-800",   times: "07:00 – 14:00" },
  afternoon: { label: "Afternoon", icon: <Sunset className="h-4 w-4" />, color: "bg-orange-100 text-orange-800", times: "14:00 – 21:00" },
  evening:   { label: "Evening",   icon: <Moon className="h-4 w-4" />,   color: "bg-indigo-100 text-indigo-800", times: "21:00 – 23:00" },
  night:     { label: "Night",     icon: <Moon className="h-4 w-4" />,   color: "bg-slate-100 text-slate-800",   times: "23:00 – 07:00" },
  sleep_in:  { label: "Sleep-In",  icon: <Moon className="h-4 w-4" />,   color: "bg-purple-100 text-purple-800", times: "23:00 – 07:00" },
};

const MOOD_META: Record<string, { label: string; emoji: string; color: string }> = {
  great:     { label: "Great",     emoji: "😊", color: "text-green-600" },
  good:      { label: "Good",      emoji: "🙂", color: "text-blue-600" },
  okay:      { label: "Okay",      emoji: "😐", color: "text-gray-600" },
  low:       { label: "Low",       emoji: "😟", color: "text-amber-600" },
  distressed:{ label: "Distressed",emoji: "😢", color: "text-red-600" },
};

// ── Seed data ────────────────────────────────────────────────────────────────
const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: ShiftNote[] = [
  {
    id: "sn_001", date: d(0), shift: "morning", startTime: "07:00", endTime: "14:00",
    staffOnDuty: ["staff_darren", "staff_anna"],
    childNotes: [
      { childId: "yp_alex", mood: "good", summary: "Up on time, had breakfast, left for school on time. Good mood this morning — excited about cooking later.", meals: "Cereal and toast", medication: false, concerns: "" },
      { childId: "yp_jordan", mood: "okay", summary: "Reluctant to get up. Eventually had breakfast at 8am. Quiet but cooperative. Mentioned not sleeping well.", meals: "Just toast", medication: false, concerns: "Sleep disruption — third night in a row. Consider CAMHS referral if continues." },
      { childId: "yp_casey", mood: "good", summary: "Bright this morning. Showed staff the poem they wrote last night. Ready for school early — unusual and positive.", meals: "Pancakes (helped cook them)", medication: false, concerns: "" },
    ],
    generalNotes: "Quiet morning overall. All YP left for school on time. Laundry completed for Jordan and Casey. Weekly shopping order placed.",
    maintenanceIssues: "Kitchen tap still dripping — chased maintenance team.", visitorsLog: "",
    handoverPriorities: ["Jordan's sleep — monitor tonight", "Alex cooking session at 5pm", "Casey's therapist calling at 3pm"],
    incidentsRef: [], completedTasks: ["Weekly shop ordered", "Laundry done", "Medication check completed"],
    outstandingTasks: ["Chase kitchen tap repair", "Book dentist for Casey"],
    recordedBy: "staff_darren", createdAt: d(0),
  },
  {
    id: "sn_002", date: d(-1), shift: "afternoon", startTime: "14:00", endTime: "21:00",
    staffOnDuty: ["staff_ryan", "staff_chervelle"],
    childNotes: [
      { childId: "yp_alex", mood: "great", summary: "Came home from school buzzing. Got a good mark in maths. Helped prepare taco dinner — Jordan's request from house meeting.", meals: "Tacos (ate loads!)", medication: false, concerns: "" },
      { childId: "yp_jordan", mood: "good", summary: "Perked up after school. Football training tonight — came back tired but happy. Loved the tacos.", meals: "Tacos x3!", medication: false, concerns: "" },
      { childId: "yp_casey", mood: "good", summary: "Quiet afternoon doing homework. Joined everyone for dinner. Had a good conversation about weekend plans.", meals: "Tacos and fruit", medication: false, concerns: "" },
    ],
    generalNotes: "Great shift. Taco night was a big success — all three YP engaged and helped. Jordan's football training went well. Coach said he's improving.",
    maintenanceIssues: "", visitorsLog: "",
    handoverPriorities: ["All settled for evening", "Jordan tired from football — may go to bed early", "Casey has homework due tomorrow"],
    incidentsRef: [], completedTasks: ["Dinner prepared and served", "Jordan to football and back", "Homework support for Casey"],
    outstandingTasks: ["Casey's homework — English essay due tomorrow"],
    recordedBy: "staff_ryan", createdAt: d(-1),
  },
  {
    id: "sn_003", date: d(-1), shift: "night", startTime: "23:00", endTime: "07:00",
    staffOnDuty: ["staff_edward"],
    childNotes: [
      { childId: "yp_alex", mood: "okay", summary: "Settled by 10pm. Slept through the night.", meals: "Hot chocolate at supper", medication: false, concerns: "" },
      { childId: "yp_jordan", mood: "low", summary: "Couldn't sleep. Staff found Jordan still awake at midnight. Had a brief chat about worries. Eventually fell asleep around 1am.", meals: "", medication: false, concerns: "Persistent sleep issues. Third night of broken sleep. Spoke about missing mum." },
      { childId: "yp_casey", mood: "okay", summary: "In bed by 9:30pm. Slept well throughout.", meals: "", medication: false, concerns: "" },
    ],
    generalNotes: "Quiet night overall. Jordan struggled to sleep again — emotional about mum's cancelled contact. Night checks completed at 23:30, 01:00, 03:00, 05:00 — all YP in rooms and safe.",
    maintenanceIssues: "Hallway motion light flickering.", visitorsLog: "",
    handoverPriorities: ["Jordan — update morning team about sleep issues", "Hallway light needs looking at", "All YP safe and well"],
    incidentsRef: [], completedTasks: ["Night checks x4", "Doors and windows secured", "Alarm set"],
    outstandingTasks: ["Report hallway light to maintenance"],
    recordedBy: "staff_edward", createdAt: d(-1),
  },
  {
    id: "sn_004", date: d(-2), shift: "morning", startTime: "07:00", endTime: "14:00",
    staffOnDuty: ["staff_anna", "staff_chervelle"],
    childNotes: [
      { childId: "yp_alex", mood: "good", summary: "Good morning. Completed laundry independently — big step. Made own breakfast.", meals: "Scrambled eggs (self-made)", medication: false, concerns: "" },
      { childId: "yp_jordan", mood: "low", summary: "Didn't want to get up. Eventually emerged at 8:30. Ate minimal breakfast. Quiet on walk to school.", meals: "Half a piece of toast", medication: false, concerns: "Low mood continuing. Contact cancellation still affecting Jordan." },
      { childId: "yp_casey", mood: "good", summary: "Morning art session before school. Created beautiful drawing. In good spirits.", meals: "Cereal and juice", medication: false, concerns: "" },
    ],
    generalNotes: "Alex's independence showing real progress — made breakfast AND did laundry without prompting. Jordan needs extra attention today. Casey thriving in creative work.",
    maintenanceIssues: "", visitorsLog: "Social worker Emma Watson visited Casey at 10:30 — routine visit.",
    handoverPriorities: ["Jordan needs emotional support", "Alex deserves praise for independence", "SW visit notes to be filed for Casey"],
    incidentsRef: [], completedTasks: ["SW visit facilitated", "Kitchen deep clean", "Garden tidied"],
    outstandingTasks: ["File SW visit notes", "Order art supplies for Casey"],
    recordedBy: "staff_anna", createdAt: d(-2),
  },
  {
    id: "sn_005", date: d(-3), shift: "afternoon", startTime: "14:00", endTime: "21:00",
    staffOnDuty: ["staff_darren", "staff_ryan"],
    childNotes: [
      { childId: "yp_alex", mood: "good", summary: "Key work session completed — discussed college application. Mock interview practice went well.", meals: "Pasta bake", medication: false, concerns: "" },
      { childId: "yp_jordan", mood: "okay", summary: "Better this afternoon. Watched cooking show with staff — initiated conversation about family memories.", meals: "Pasta bake and salad", medication: false, concerns: "" },
      { childId: "yp_casey", mood: "great", summary: "Received Merit award at school today! Very proud. Showed certificate to everyone at dinner.", meals: "Pasta bake", medication: false, concerns: "" },
    ],
    generalNotes: "Positive shift. Casey's school achievement really lifted the mood of the whole house. Jordan more engaged than yesterday. House meeting scheduled for tomorrow.",
    maintenanceIssues: "", visitorsLog: "",
    handoverPriorities: ["House meeting tomorrow at 4pm", "Casey's achievement to be recorded as significant event", "All YP in good form tonight"],
    incidentsRef: [], completedTasks: ["Key work session (Alex)", "Dinner cooked", "House meeting prep"],
    outstandingTasks: ["Record Casey's significant event", "Prep house meeting agenda"],
    recordedBy: "staff_darren", createdAt: d(-3),
  },
];

// ── Export ────────────────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<ShiftNote>[] = [
  { header: "ID",               accessor: (r: ShiftNote) => r.id },
  { header: "Date",             accessor: (r: ShiftNote) => r.date },
  { header: "Shift",            accessor: (r: ShiftNote) => SHIFT_META[r.shift].label },
  { header: "Times",            accessor: (r: ShiftNote) => `${r.startTime} – ${r.endTime}` },
  { header: "Staff on Duty",    accessor: (r: ShiftNote) => r.staffOnDuty.map(getStaffName).join(", ") },
  { header: "General Notes",    accessor: (r: ShiftNote) => r.generalNotes },
  { header: "Handover",         accessor: (r: ShiftNote) => r.handoverPriorities.join("; ") },
  { header: "Completed Tasks",  accessor: (r: ShiftNote) => r.completedTasks.join("; ") },
  { header: "Outstanding",      accessor: (r: ShiftNote) => r.outstandingTasks.join("; ") },
  { header: "Maintenance",      accessor: (r: ShiftNote) => r.maintenanceIssues || "—" },
  { header: "Visitors",         accessor: (r: ShiftNote) => r.visitorsLog || "—" },
  { header: "Recorded By",      accessor: (r: ShiftNote) => getStaffName(r.recordedBy) },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function ShiftNotesPage() {
  const [notes, setNotes] = useState<ShiftNote[]>(SEED);
  const [search, setSearch] = useState("");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let list = [...notes];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((n) => n.generalNotes.toLowerCase().includes(s) || n.childNotes.some((cn) => cn.summary.toLowerCase().includes(s)) || n.handoverPriorities.some((h) => h.toLowerCase().includes(s)));
    }
    if (shiftFilter !== "all") list = list.filter((n) => n.shift === shiftFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":  return b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime);
        case "shift": return SHIFT_META[a.shift].label.localeCompare(SHIFT_META[b.shift].label);
        default:      return 0;
      }
    });
    return list;
  }, [notes, search, shiftFilter, sortBy]);

  const stats = useMemo(() => {
    const total = notes.length;
    const today = notes.filter((n) => n.date === d(0)).length;
    const outstandingTotal = notes.reduce((a, n) => a + n.outstandingTasks.length, 0);
    const concerns = notes.flatMap((n) => n.childNotes).filter((cn) => cn.concerns).length;
    return { total, today, outstandingTotal, concerns };
  }, [notes]);

  return (
    <PageShell
      title="Shift Notes"
      subtitle="Detailed per-shift records for continuity of care across the team"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Shift Notes" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="shift-notes" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Shift Note</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Entries",   value: stats.total,            icon: <FileText className="h-4 w-4" />,      color: "text-blue-600" },
            { label: "Today",           value: stats.today,            icon: <Sun className="h-4 w-4" />,           color: "text-amber-600" },
            { label: "Outstanding Tasks",value: stats.outstandingTotal,icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-600" },
            { label: "Concerns Logged", value: stats.concerns,         icon: <Star className="h-4 w-4" />,          color: "text-purple-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", s.color)}>{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search shift notes…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={shiftFilter} onValueChange={setShiftFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Shift" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shifts</SelectItem>
              {Object.entries(SHIFT_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="shift">Shift</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Shift notes list ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No shift notes match your filters.</p>}
          {filtered.map((n) => {
            const open = !!expanded[n.id];
            const shiftM = SHIFT_META[n.shift];
            const hasOutstanding = n.outstandingTasks.length > 0;
            const hasConcerns = n.childNotes.some((cn) => cn.concerns);
            return (
              <Card key={n.id} className={cn("border-l-4", n.shift === "night" || n.shift === "sleep_in" ? "border-l-indigo-400" : n.shift === "morning" ? "border-l-amber-400" : "border-l-orange-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(n.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", shiftM.color)}>{shiftM.icon}<span className="ml-1">{shiftM.label}</span></Badge>
                        <Badge variant="outline" className="text-xs">{shiftM.times}</Badge>
                        {hasOutstanding && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">{n.outstandingTasks.length} outstanding</Badge>}
                        {hasConcerns && <Badge variant="outline" className="text-xs text-red-600 border-red-300">Concerns</Badge>}
                      </div>
                      <p className="font-semibold">{n.date} — {shiftM.label} Shift</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Staff: {n.staffOnDuty.map(getStaffName).join(", ")}</span>
                        <span>By {getStaffName(n.recordedBy)}</span>
                      </div>
                      {/* Child mood overview */}
                      <div className="flex items-center gap-3 mt-2">
                        {n.childNotes.map((cn) => (
                          <span key={cn.childId} className="flex items-center gap-1 text-xs">
                            <span>{getYPName(cn.childId)}</span>
                            <span className={MOOD_META[cn.mood]?.color}>{MOOD_META[cn.mood]?.emoji}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-4 border-t pt-3 text-sm">
                      {/* Per-child notes */}
                      {n.childNotes.map((childNote) => (
                        <div key={childNote.childId} className="bg-muted/40 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium">{getYPName(childNote.childId)}</p>
                            <span className={cn("text-xs font-medium", MOOD_META[childNote.mood]?.color)}>{MOOD_META[childNote.mood]?.emoji} {MOOD_META[childNote.mood]?.label}</span>
                          </div>
                          <p className="text-xs mb-1">{childNote.summary}</p>
                          {childNote.meals && <p className="text-xs text-muted-foreground">Meals: {childNote.meals}</p>}
                          {childNote.concerns && (
                            <div className="mt-1 flex items-start gap-1 text-xs text-red-700 bg-red-50 p-1.5 rounded">
                              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{childNote.concerns}</span>
                            </div>
                          )}
                        </div>
                      ))}

                      <div>
                        <p className="font-medium text-muted-foreground mb-1">General Notes</p>
                        <p>{n.generalNotes}</p>
                      </div>

                      {n.visitorsLog && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Visitors</p>
                          <p className="text-xs">{n.visitorsLog}</p>
                        </div>
                      )}

                      {n.maintenanceIssues && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Maintenance Issues</p>
                          <p className="text-xs text-amber-700">{n.maintenanceIssues}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Completed Tasks</p>
                          <ul className="text-xs space-y-0.5">{n.completedTasks.map((t, i) => (
                            <li key={i} className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" />{t}</li>
                          ))}</ul>
                        </div>
                        {n.outstandingTasks.length > 0 && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Outstanding Tasks</p>
                            <ul className="text-xs space-y-0.5">{n.outstandingTasks.map((t, i) => (
                              <li key={i} className="flex items-center gap-1"><Clock className="h-3 w-3 text-amber-600" />{t}</li>
                            ))}</ul>
                          </div>
                        )}
                      </div>

                      {n.handoverPriorities.length > 0 && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="font-medium text-blue-800 mb-1 text-xs">Handover Priorities</p>
                          <ul className="text-xs text-blue-900 space-y-0.5">{n.handoverPriorities.map((h, i) => (
                            <li key={i} className="flex items-center gap-1"><Star className="h-3 w-3 text-blue-500" />{h}</li>
                          ))}</ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Guidance ─────────────────────────────────────────────────────── */}
        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Shift notes must be completed before the end of each shift. They form part of the daily record and are referenced during handover, Reg 44 visits, and Ofsted inspections. Outstanding tasks must be handed over to the incoming team. Each child&apos;s mood, meals, and any concerns should be recorded every shift.
            </span>
          </CardContent>
        </Card>
      </div>

      {/* ── New shift note dialog ─────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Shift Note</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); setShowNew(false); }} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-sm font-medium">Shift</label>
                <Select><SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                  <SelectContent>{Object.entries(SHIFT_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label} ({v.times})</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">General Notes</label>
              <Textarea placeholder="Overview of the shift…" rows={4} />
            </div>
            <div>
              <label className="text-sm font-medium">Handover Priorities</label>
              <Textarea placeholder="One priority per line" rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium">Outstanding Tasks</label>
              <Textarea placeholder="One task per line" rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit">Save Shift Note</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
