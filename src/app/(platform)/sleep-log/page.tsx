"use client";

import { useState, useMemo } from "react";
import {
  Moon, Plus, Search, ArrowUpDown, Filter,
  AlertTriangle, Clock, CheckCircle2,
  ChevronDown, ChevronUp, CloudMoon, Sun,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
const SHIFT_TYPES = ["sleep_in", "waking_night"] as const;
type ShiftType = typeof SHIFT_TYPES[number];
const SHIFT_LABELS: Record<ShiftType, string> = {
  sleep_in: "Sleep-in", waking_night: "Waking Night",
};

const DISTURBANCE_LEVELS = ["none", "minor", "moderate", "significant"] as const;
type DisturbanceLevel = typeof DISTURBANCE_LEVELS[number];
const DISTURBANCE_COLORS: Record<DisturbanceLevel, string> = {
  none: "bg-green-100 text-green-800", minor: "bg-yellow-100 text-yellow-800",
  moderate: "bg-orange-100 text-orange-800", significant: "bg-red-100 text-red-800",
};

interface Disturbance {
  time: string;
  youngPerson: string;
  description: string;
  actionTaken: string;
  duration: number; // minutes
}

interface SleepLogEntry {
  id: string;
  date: string;
  shiftType: ShiftType;
  staffId: string;
  startTime: string;
  endTime: string;
  disturbanceLevel: DisturbanceLevel;
  disturbances: Disturbance[];
  checksCompleted: string[];
  buildingSecure: boolean;
  alarmsSet: boolean;
  handoverNotes: string;
  morningHandover: string;
  hoursSlept: number | null;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: SleepLogEntry[] = [
  {
    id: "sl_1", date: d(-1), shiftType: "sleep_in", staffId: "staff_anna",
    startTime: "22:00", endTime: "07:00", disturbanceLevel: "minor",
    disturbances: [
      {
        time: "01:15", youngPerson: "Alex",
        description: "Heard moving around in room. Door opened briefly.",
        actionTaken: "Checked on Alex — said they needed the bathroom. Returned to bed within 5 mins. No concerns.",
        duration: 10,
      },
    ],
    checksCompleted: ["22:30 — All YP in rooms", "23:00 — House quiet", "00:00 — All settled", "06:00 — Morning check"],
    buildingSecure: true, alarmsSet: true,
    handoverNotes: "Alex had an unsettled evening — argument with Jordan before bed. May be more restless tonight.",
    morningHandover: "Quiet night overall. Alex woke once but settled quickly. All YP still sleeping at 06:00. Kitchen prepped for breakfast.",
    hoursSlept: 7.5,
  },
  {
    id: "sl_2", date: d(-2), shiftType: "waking_night", staffId: "staff_lackson",
    startTime: "22:00", endTime: "07:00", disturbanceLevel: "moderate",
    disturbances: [
      {
        time: "23:45", youngPerson: "Jordan",
        description: "Came downstairs saying they couldn't sleep. Appeared anxious.",
        actionTaken: "Made warm drink. Sat with Jordan in lounge for 20 mins. Talked about worries about contact visit tomorrow. Returned to bed at 00:10.",
        duration: 25,
      },
      {
        time: "03:30", youngPerson: "Casey",
        description: "Shouting in sleep — possible nightmare.",
        actionTaken: "Went to Casey's door, listened for 2 mins. Settled without intervention. Continued to monitor.",
        duration: 5,
      },
    ],
    checksCompleted: ["22:30 — All YP in rooms", "23:00 — Checks complete", "00:30 — Post-Jordan check", "02:00 — All quiet", "04:00 — Post-Casey check", "06:00 — Morning round"],
    buildingSecure: true, alarmsSet: true,
    handoverNotes: "Jordan has contact visit tomorrow — expressed anxiety during evening. Casey reported bad dreams recently.",
    morningHandover: "Two disturbances overnight. Jordan settled after support. Casey had brief nightmare but self-settled. All YP sleeping at 06:00. Laundry started.",
    hoursSlept: null,
  },
  {
    id: "sl_3", date: d(-3), shiftType: "sleep_in", staffId: "staff_edward",
    startTime: "22:00", endTime: "07:00", disturbanceLevel: "none",
    disturbances: [],
    checksCompleted: ["22:30 — All YP in rooms", "23:00 — House quiet", "06:00 — Morning check"],
    buildingSecure: true, alarmsSet: true,
    handoverNotes: "Good evening. All YP engaged well at movie night. Everyone in rooms by 21:30.",
    morningHandover: "Completely quiet night. No disturbances. All YP sleeping soundly at 06:00. Bins put out for collection.",
    hoursSlept: 8,
  },
  {
    id: "sl_4", date: d(-4), shiftType: "waking_night", staffId: "staff_mirela",
    startTime: "22:00", endTime: "07:00", disturbanceLevel: "significant",
    disturbances: [
      {
        time: "00:30", youngPerson: "Alex",
        description: "Heard loud music from Alex's room. Asked to turn down.",
        actionTaken: "Knocked on door, reminded Alex of house rules re: noise after 22:00. Alex turned music off after brief protest.",
        duration: 10,
      },
      {
        time: "02:15", youngPerson: "Alex",
        description: "Alex came downstairs, upset about social media message. Tearful and angry.",
        actionTaken: "Spent 45 minutes with Alex in lounge. Used de-escalation. Phone placed in office for rest of night as agreed. Alex returned to bed at 03:05.",
        duration: 50,
      },
      {
        time: "04:00", youngPerson: "Jordan",
        description: "Woken by earlier noise. Came to check what was happening.",
        actionTaken: "Reassured Jordan everything was fine. Returned to bed within 5 mins.",
        duration: 5,
      },
    ],
    checksCompleted: ["22:30 — All in rooms", "23:00 — Music issue with Alex", "01:00 — Settled", "03:10 — Post-incident check", "04:10 — All settled", "06:00 — Morning"],
    buildingSecure: true, alarmsSet: true,
    handoverNotes: "Alex's phone access to be discussed at team meeting. Pattern of late-night social media distress.",
    morningHandover: "Significant night — three disturbances, mainly Alex. Social media triggered emotional distress at 02:15. Phone now in office. Jordan also woke. All settled by 04:10. RM to be updated.",
    hoursSlept: null,
  },
  {
    id: "sl_5", date: d(-5), shiftType: "sleep_in", staffId: "staff_diane",
    startTime: "22:00", endTime: "07:00", disturbanceLevel: "minor",
    disturbances: [
      {
        time: "05:30", youngPerson: "Casey",
        description: "Woke early, came downstairs for a drink.",
        actionTaken: "Casey got a glass of water and returned to room independently. No concerns.",
        duration: 5,
      },
    ],
    checksCompleted: ["22:30 — All YP in rooms", "23:00 — Settled", "05:45 — Post Casey check", "06:00 — Morning"],
    buildingSecure: true, alarmsSet: true,
    handoverNotes: "Good evening. Casey mentioned wanting to get up early for a run — may wake before usual.",
    morningHandover: "Quiet night. Casey woke briefly at 05:30 for water — expected as discussed in handover. All well.",
    hoursSlept: 7,
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function SleepLogPage() {
  const [entries] = useState<SleepLogEntry[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let list = [...entries];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          getStaffName(e.staffId).toLowerCase().includes(q) ||
          e.handoverNotes.toLowerCase().includes(q) ||
          e.morningHandover.toLowerCase().includes(q) ||
          e.disturbances.some((d) => d.youngPerson.toLowerCase().includes(q) || d.description.toLowerCase().includes(q))
      );
    }
    if (filterType !== "all") list = list.filter((e) => e.shiftType === filterType);
    if (filterLevel !== "all") list = list.filter((e) => e.disturbanceLevel === filterLevel);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "staff": return getStaffName(a.staffId).localeCompare(getStaffName(b.staffId));
        case "disturbances": return b.disturbances.length - a.disturbances.length;
        default: return 0;
      }
    });
    return list;
  }, [entries, search, filterType, filterLevel, sortBy]);

  /* stats */
  const totalNights = entries.length;
  const quietNights = entries.filter((e) => e.disturbanceLevel === "none").length;
  const totalDisturbances = entries.reduce((s, e) => s + e.disturbances.length, 0);
  const significantNights = entries.filter((e) => e.disturbanceLevel === "significant").length;

  const exportCols: ExportColumn<SleepLogEntry>[] = [
    { header: "ID", accessor: (r: SleepLogEntry) => r.id },
    { header: "Date", accessor: (r: SleepLogEntry) => r.date },
    { header: "Shift Type", accessor: (r: SleepLogEntry) => SHIFT_LABELS[r.shiftType] },
    { header: "Staff", accessor: (r: SleepLogEntry) => getStaffName(r.staffId) },
    { header: "Start", accessor: (r: SleepLogEntry) => r.startTime },
    { header: "End", accessor: (r: SleepLogEntry) => r.endTime },
    { header: "Disturbance Level", accessor: (r: SleepLogEntry) => r.disturbanceLevel },
    { header: "No. Disturbances", accessor: (r: SleepLogEntry) => r.disturbances.length },
    { header: "Disturbance Details", accessor: (r: SleepLogEntry) => r.disturbances.map((d: Disturbance) => `${d.time} — ${d.youngPerson}: ${d.description}`).join("; ") },
    { header: "Building Secure", accessor: (r: SleepLogEntry) => r.buildingSecure ? "Yes" : "No" },
    { header: "Alarms Set", accessor: (r: SleepLogEntry) => r.alarmsSet ? "Yes" : "No" },
    { header: "Hours Slept", accessor: (r: SleepLogEntry) => r.hoursSlept?.toString() ?? "N/A (Waking)" },
    { header: "Handover Notes", accessor: (r: SleepLogEntry) => r.handoverNotes },
    { header: "Morning Handover", accessor: (r: SleepLogEntry) => r.morningHandover },
  ];

  return (
    <PageShell
      title="Sleep-in & Waking Night Log"
      subtitle="Overnight shift records, disturbances, and morning handover"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Sleep-in & Waking Night Log" />
          <ExportButton data={filtered} columns={exportCols} filename="sleep-log" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Entry
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Nights", value: totalNights, icon: Moon, colour: "text-indigo-600" },
            { label: "Quiet Nights", value: quietNights, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Total Disturbances", value: totalDisturbances, icon: Clock, colour: "text-orange-600" },
            { label: "Significant Nights", value: significantNights, icon: AlertTriangle, colour: significantNights > 0 ? "text-red-600" : "text-slate-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── alerts ────────────────────────────────────────────── */}
        {significantNights > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">
                <strong>{significantNights}</strong> night(s) with significant disturbances in this period —
                review patterns and consider support plan adjustments.
              </p>
            </div>
          </div>
        )}

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff, young people, notes…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shift Types</SelectItem>
                {SHIFT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{SHIFT_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {DISTURBANCE_LEVELS.map((l) => (
                <SelectItem key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="staff">Staff Name</SelectItem>
                <SelectItem value="disturbances">Most Disturbances</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No entries match your filters.</div>
          )}
          {filtered.map((entry) => {
            const isExpanded = expanded === entry.id;
            return (
              <div key={entry.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : entry.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {entry.shiftType === "sleep_in" ? (
                      <CloudMoon className="h-5 w-5 text-indigo-600 shrink-0" />
                    ) : (
                      <Moon className="h-5 w-5 text-violet-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium">{entry.date} — {SHIFT_LABELS[entry.shiftType]}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getStaffName(entry.staffId)} · {entry.startTime}–{entry.endTime} · {entry.disturbances.length} disturbance(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", DISTURBANCE_COLORS[entry.disturbanceLevel])}>
                      {entry.disturbanceLevel.charAt(0).toUpperCase() + entry.disturbanceLevel.slice(1)}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* security checks */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className={cn("h-4 w-4", entry.buildingSecure ? "text-green-600" : "text-red-600")} />
                        <span>Building Secure: <strong>{entry.buildingSecure ? "Yes" : "No"}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className={cn("h-4 w-4", entry.alarmsSet ? "text-green-600" : "text-red-600")} />
                        <span>Alarms Set: <strong>{entry.alarmsSet ? "Yes" : "No"}</strong></span>
                      </div>
                      {entry.hoursSlept !== null && (
                        <div><span className="text-muted-foreground">Hours Slept:</span> <strong>{entry.hoursSlept}h</strong></div>
                      )}
                    </div>

                    {/* evening handover */}
                    <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                      <p className="text-xs font-medium text-indigo-700 mb-1">Evening Handover Notes</p>
                      <p className="text-sm">{entry.handoverNotes}</p>
                    </div>

                    {/* checks completed */}
                    <div>
                      <p className="text-sm font-medium mb-2">Checks Completed</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                        {entry.checksCompleted.map((check: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-1 text-sm">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span>{check}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* disturbances */}
                    {entry.disturbances.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Disturbances</p>
                        <div className="space-y-2">
                          {entry.disturbances.map((dist: Disturbance, idx: number) => (
                            <div key={idx} className="rounded-lg border bg-white p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">{dist.time}</Badge>
                                <span className="font-medium text-sm">{dist.youngPerson}</span>
                                <Badge variant="outline" className="text-xs">{dist.duration} min</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">{dist.description}</p>
                              <p className="text-sm"><strong>Action:</strong> {dist.actionTaken}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* morning handover */}
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Sun className="h-4 w-4 text-amber-600" />
                        <p className="text-xs font-medium text-amber-700">Morning Handover</p>
                      </div>
                      <p className="text-sm">{entry.morningHandover}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Overnight Records:</strong> All overnight shifts must be recorded with building security
          checks, disturbance logs, and morning handover. Records are reviewed by the Registered Manager
          and are subject to Reg 44 inspection. Waking night staff must maintain hourly awareness checks.
        </div>
      </div>

      {/* ── placeholder dialog ──────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Sleep / Waking Night Entry</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground text-sm">
            <Moon className="h-10 w-10 mx-auto mb-3 text-indigo-300" />
            <p>Full entry form will capture shift type, security checks,</p>
            <p>disturbance timeline, and handover notes.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
