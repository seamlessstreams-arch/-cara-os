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
  AlertTriangle, CheckCircle2, Clock, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type Shift = "morning" | "afternoon" | "evening" | "night" | "sleep_in";
type Category = "incident" | "visitor" | "phone_call" | "maintenance" | "staff_change" | "welfare" | "medication" | "safeguarding" | "routine" | "handover" | "complaint" | "positive";
type Priority = "routine" | "important" | "urgent" | "critical";

interface DutyLogEntry {
  id: string;
  date: string;
  time: string;
  shift: Shift;
  recordedBy: string;
  category: Category;
  priority: Priority;
  youngPersonIds: string[];
  description: string;
  actionTaken: string;
  followUpRequired: boolean;
  followUpNotes: string;
  managerNotified: boolean;
  linkedRecords: string[];
  witnessedBy: string | null;
  signedOff: boolean;
  signedOffBy: string | null;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SHIFT_LABEL: Record<Shift, string> = { morning: "Morning", afternoon: "Afternoon", evening: "Evening", night: "Night", sleep_in: "Sleep-In" };
const SHIFT_CLR: Record<Shift, string> = { morning: "bg-yellow-100 text-yellow-800", afternoon: "bg-orange-100 text-orange-800", evening: "bg-indigo-100 text-indigo-800", night: "bg-slate-100 text-slate-800", sleep_in: "bg-purple-100 text-purple-800" };

const CAT_LABEL: Record<Category, string> = {
  incident: "Incident", visitor: "Visitor", phone_call: "Phone Call", maintenance: "Maintenance",
  staff_change: "Staff Change", welfare: "Welfare", medication: "Medication", safeguarding: "Safeguarding",
  routine: "Routine", handover: "Handover", complaint: "Complaint", positive: "Positive",
};
const CAT_CLR: Record<Category, string> = {
  incident: "bg-red-100 text-red-800", visitor: "bg-blue-100 text-blue-800",
  phone_call: "bg-indigo-100 text-indigo-800", maintenance: "bg-gray-100 text-gray-800",
  staff_change: "bg-slate-100 text-slate-800", welfare: "bg-amber-100 text-amber-800",
  medication: "bg-purple-100 text-purple-800", safeguarding: "bg-red-100 text-red-800",
  routine: "bg-gray-100 text-gray-700", handover: "bg-blue-100 text-blue-800",
  complaint: "bg-orange-100 text-orange-800", positive: "bg-green-100 text-green-800",
};

const PRI_CLR: Record<Priority, string> = { routine: "border-gray-300", important: "border-blue-400", urgent: "border-amber-400", critical: "border-red-500" };
const PRI_BADGE: Record<Priority, string> = { routine: "bg-gray-100 text-gray-800", important: "bg-blue-100 text-blue-800", urgent: "bg-amber-100 text-amber-800", critical: "bg-red-100 text-red-800" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: DutyLogEntry[] = [
  {
    id: "dl1", date: d(0), time: "07:00", shift: "morning", recordedBy: "staff_darren",
    category: "handover", priority: "routine", youngPersonIds: ["yp_alex", "yp_jordan", "yp_casey"],
    description: "Morning handover from night staff (Diane). All children slept through the night. Jordan had a slight cough overnight but did not require attention. Casey's room light was on at 06:30 — she was reading. No incidents overnight. Medication cupboard checked and locked.",
    actionTaken: "Handover accepted. Day shift briefed. Breakfast prep started.", followUpRequired: false, followUpNotes: "",
    managerNotified: false, linkedRecords: [], witnessedBy: "staff_anna", signedOff: true, signedOffBy: "staff_darren",
  },
  {
    id: "dl2", date: d(0), time: "08:45", shift: "morning", recordedBy: "staff_anna",
    category: "welfare", priority: "important", youngPersonIds: ["yp_alex"],
    description: "Alex refused to get ready for school. Stayed in bed and said he felt sick but did not present with temperature or visible symptoms. After 20 minutes of encouragement and offering breakfast in his room, Alex agreed to go to school for the afternoon only.",
    actionTaken: "Key worker spoke with Alex. Agreed compromise — rest this morning, school from 12:30. School notified of late arrival. Alex came downstairs for toast at 10am and seemed brighter.", followUpRequired: true, followUpNotes: "Monitor attendance pattern this week — third late start this month.",
    managerNotified: false, linkedRecords: ["Absence tracking"], witnessedBy: null, signedOff: true, signedOffBy: "staff_darren",
  },
  {
    id: "dl3", date: d(0), time: "10:00", shift: "morning", recordedBy: "staff_darren",
    category: "visitor", priority: "routine", youngPersonIds: [],
    description: "Reg 44 independent visitor Mrs Patel arrived for scheduled monthly visit. Provided access to all required documentation. Toured the home including all bedrooms (with permission). Spoke privately with Jordan and Casey. Will submit report within 5 working days.",
    actionTaken: "Visitor logged in visitor book. DBS checked and verified. Provided refreshments. Visitor departed at 12:30.", followUpRequired: false, followUpNotes: "",
    managerNotified: true, linkedRecords: ["Visitor log"], witnessedBy: null, signedOff: true, signedOffBy: "staff_darren",
  },
  {
    id: "dl4", date: d(0), time: "12:15", shift: "afternoon", recordedBy: "staff_ryan",
    category: "incident", priority: "urgent", youngPersonIds: ["yp_jordan"],
    description: "Jordan had a meltdown in the kitchen triggered by sensory overload — the dishwasher, radio, and blender were all on simultaneously. Jordan covered his ears, shouted, and ran to his bedroom. Knocked a chair over in the process but did not harm himself or anyone else.",
    actionTaken: "Staff followed at distance. Gave Jordan 15 minutes quiet time. Offered noise-cancelling headphones. Jordan calmed down and apologised. Discussed triggers and agreed a kitchen quiet time signal.", followUpRequired: true, followUpNotes: "Update sensory profile — add kitchen noise as trigger. Discuss with team at next staff meeting.",
    managerNotified: true, linkedRecords: ["Incident log — INC-2345", "Behaviour log"], witnessedBy: "staff_edward", signedOff: true, signedOffBy: "staff_ryan",
  },
  {
    id: "dl5", date: d(0), time: "13:00", shift: "afternoon", recordedBy: "staff_darren",
    category: "phone_call", priority: "important", youngPersonIds: ["yp_casey"],
    description: "Phone call from Fiona Brennan (Casey's social worker). Discussed updated contact arrangements following safety concerns. Confirmed direct contact with birth mother remains suspended. Indirect contact (letters) continuing. Fiona satisfied with Casey's emotional support.",
    actionTaken: "Updated contact plan. Informed evening staff. Documented in SW contact log.", followUpRequired: false, followUpNotes: "",
    managerNotified: false, linkedRecords: ["SW contact log"], witnessedBy: null, signedOff: true, signedOffBy: "staff_darren",
  },
  {
    id: "dl6", date: d(0), time: "15:30", shift: "afternoon", recordedBy: "staff_chervelle",
    category: "positive", priority: "routine", youngPersonIds: ["yp_casey"],
    description: "Casey completed an art therapy session with external therapist Sarah. Produced a painting about her feelings that she was very proud of. Asked if it could be hung in her bedroom. Therapist reported Casey was very engaged and this was her best session yet.",
    actionTaken: "Painting framed and hung in Casey's room. Positive feedback shared with Casey and recorded in therapeutic input notes.", followUpRequired: false, followUpNotes: "",
    managerNotified: false, linkedRecords: ["Therapeutic input"], witnessedBy: null, signedOff: true, signedOffBy: "staff_chervelle",
  },
  {
    id: "dl7", date: d(0), time: "16:45", shift: "afternoon", recordedBy: "staff_edward",
    category: "maintenance", priority: "routine", youngPersonIds: [],
    description: "Kitchen tap leaking from the base. Water pooling on worktop. Tap tightened but continues to drip slowly. Not a flood risk but needs plumber.",
    actionTaken: "Towel placed under tap. Maintenance request submitted. Plumber booked for tomorrow morning.", followUpRequired: true, followUpNotes: "Chase plumber if not arrived by 10am tomorrow.",
    managerNotified: false, linkedRecords: ["Maintenance log"], witnessedBy: null, signedOff: true, signedOffBy: "staff_edward",
  },
  {
    id: "dl8", date: d(0), time: "20:00", shift: "evening", recordedBy: "staff_anna",
    category: "medication", priority: "routine", youngPersonIds: ["yp_alex", "yp_jordan", "yp_casey"],
    description: "Evening medication round completed. All medications administered as prescribed. Alex — Melatonin 3mg. Jordan — no evening medication. Casey — Fluoxetine 20mg. All MAR sheets signed. Medication cabinet locked.",
    actionTaken: "MAR sheets completed and signed. Second check by staff_diane. All correct.", followUpRequired: false, followUpNotes: "",
    managerNotified: false, linkedRecords: ["MAR sheets"], witnessedBy: "staff_diane", signedOff: true, signedOffBy: "staff_anna",
  },
  {
    id: "dl9", date: d(-1), time: "02:15", shift: "night", recordedBy: "staff_diane",
    category: "welfare", priority: "important", youngPersonIds: ["yp_jordan"],
    description: "Jordan woke at 02:15 upset from a nightmare. Found sitting on his bed crying. Said he dreamt about being back at his previous placement. Needed reassurance and a warm drink.",
    actionTaken: "Sat with Jordan for 20 minutes. Made hot chocolate. Read part of his book together. Jordan settled back to sleep at 02:45. Checked again at 03:30 — sleeping peacefully.", followUpRequired: true, followUpNotes: "Discuss with key worker — nightmares about previous placement may need therapeutic support.",
    managerNotified: false, linkedRecords: [], witnessedBy: null, signedOff: true, signedOffBy: "staff_diane",
  },
  {
    id: "dl10", date: d(-1), time: "07:00", shift: "morning", recordedBy: "staff_diane",
    category: "handover", priority: "routine", youngPersonIds: ["yp_alex", "yp_jordan", "yp_casey"],
    description: "Night to morning handover. Jordan woke at 02:15 from nightmare — see welfare entry. Alex and Casey slept through. All night checks completed at 23:00, 01:00, 03:00, 05:00. No security concerns. Building secure.",
    actionTaken: "Handover to Darren. Briefed on Jordan's disturbance. Day shift begins.", followUpRequired: false, followUpNotes: "",
    managerNotified: false, linkedRecords: ["Night checks"], witnessedBy: "staff_darren", signedOff: true, signedOffBy: "staff_diane",
  },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function DutyLogPage() {
  const [data] = useState<DutyLogEntry[]>(SEED);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [priFilter, setPriFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => r.description.toLowerCase().includes(s) || getStaffName(r.recordedBy).toLowerCase().includes(s)); }
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

  const todayEntries = data.filter(r => r.date === d(0));
  const urgentCritical = todayEntries.filter(r => r.priority === "urgent" || r.priority === "critical");

  const exportCols: ExportColumn<DutyLogEntry>[] = useMemo(() => [
    { header: "Date", accessor: (r: DutyLogEntry) => r.date },
    { header: "Time", accessor: (r: DutyLogEntry) => r.time },
    { header: "Shift", accessor: (r: DutyLogEntry) => SHIFT_LABEL[r.shift] },
    { header: "Category", accessor: (r: DutyLogEntry) => CAT_LABEL[r.category] },
    { header: "Priority", accessor: (r: DutyLogEntry) => r.priority },
    { header: "Recorded By", accessor: (r: DutyLogEntry) => getStaffName(r.recordedBy) },
    { header: "Young People", accessor: (r: DutyLogEntry) => r.youngPersonIds.map(id => getYPName(id)).join(", ") || "N/A" },
    { header: "Description", accessor: (r: DutyLogEntry) => r.description },
    { header: "Action Taken", accessor: (r: DutyLogEntry) => r.actionTaken },
    { header: "Follow-Up", accessor: (r: DutyLogEntry) => r.followUpRequired ? r.followUpNotes : "No" },
    { header: "Manager Notified", accessor: (r: DutyLogEntry) => r.managerNotified ? "Yes" : "No" },
    { header: "Signed Off", accessor: (r: DutyLogEntry) => r.signedOff ? getStaffName(r.signedOffBy ?? "") : "No" },
  ], []);

  return (
    <PageShell
      title="Duty Log"
      subtitle="Daily Occurrence Book — legal record of all significant events per shift"
      actions={[
        <PrintButton key="p" title="Duty Log" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="duty-log" />,
        <Button key="n" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />New Entry</Button>,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Entries Today", value: todayEntries.length, icon: BookOpen, colour: "text-blue-600" },
            { label: "Urgent / Critical", value: urgentCritical.length, icon: AlertTriangle, colour: "text-red-600" },
            { label: "Follow-Ups Pending", value: data.filter(r => r.followUpRequired).length, icon: Clock, colour: "text-amber-600" },
            { label: "Signed Off", value: `${data.filter(r => r.signedOff).length}/${data.length}`, icon: CheckCircle2, colour: "text-green-600" },
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
                  <SelectContent><SelectItem value="all">All Shifts</SelectItem>{(Object.entries(SHIFT_LABEL) as [Shift, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Label className="text-xs">Category</Label>
                <Select value={catFilter} onValueChange={setCatFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All</SelectItem>{(Object.entries(CAT_LABEL) as [Category, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <Label className="text-xs">Priority</Label>
                <Select value={priFilter} onValueChange={setPriFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All</SelectItem>{(["routine", "important", "urgent", "critical"] as Priority[]).map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}</SelectContent>
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
                        <Badge className={cn("text-xs", CAT_CLR[r.category])}>{CAT_LABEL[r.category]}</Badge>
                        <Badge className={cn("text-xs", SHIFT_CLR[r.shift])}>{SHIFT_LABEL[r.shift]}</Badge>
                        {r.priority !== "routine" && <Badge className={cn("text-xs", PRI_BADGE[r.priority])}>{r.priority}</Badge>}
                        <span className="text-sm text-muted-foreground">— {getStaffName(r.recordedBy)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.youngPersonIds.length > 0 && <span className="text-xs text-muted-foreground">{r.youngPersonIds.map(id => getYPName(id)).join(", ")}</span>}
                        {r.signedOff && <CheckCircle2 className="h-4 w-4 text-green-500" />}
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
                      <p className="text-sm text-blue-900">{r.actionTaken}</p>
                    </div>

                    {r.followUpRequired && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-semibold text-amber-800 mb-1">Follow-Up Required</p>
                        <p className="text-sm text-amber-900">{r.followUpNotes}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs">
                      {r.managerNotified && <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-blue-500" />Manager notified</span>}
                      {r.witnessedBy && <span>Witnessed by: {getStaffName(r.witnessedBy)}</span>}
                      {r.signedOff && <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />Signed off: {getStaffName(r.signedOffBy ?? "")}</span>}
                    </div>

                    {r.linkedRecords.length > 0 && (
                      <div><p className="text-xs font-semibold mb-1">Linked Records</p><div className="flex gap-1 flex-wrap">{r.linkedRecords.map(lr => <Badge key={lr} variant="outline" className="text-xs">{lr}</Badge>)}</div></div>
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
          <CardHeader><CardTitle className="text-base">Daily Summary — {d(0)}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><span className="text-muted-foreground">Total entries:</span> <strong>{todayEntries.length}</strong></div>
              <div><span className="text-muted-foreground">Incidents:</span> <strong>{todayEntries.filter(r => r.category === "incident").length}</strong></div>
              <div><span className="text-muted-foreground">Positive:</span> <strong>{todayEntries.filter(r => r.category === "positive").length}</strong></div>
              <div><span className="text-muted-foreground">Signed off:</span> <strong>{todayEntries.filter(r => r.signedOff).length}/{todayEntries.length}</strong></div>
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Duty Log Entry</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3"><div><Label>Date</Label><Input type="date" defaultValue={d(0)} /></div><div><Label>Time</Label><Input type="time" /></div></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Shift</Label><Select><SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger><SelectContent>{(Object.entries(SHIFT_LABEL) as [Shift, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Category</Label><Select><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{(Object.entries(CAT_LABEL) as [Category, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Priority</Label><Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["routine", "important", "urgent", "critical"] as Priority[]).map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Description</Label><Textarea rows={3} placeholder="What happened…" /></div>
            <div><Label>Action Taken</Label><Textarea rows={2} placeholder="What was done…" /></div>
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
