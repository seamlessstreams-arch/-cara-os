"use client";

import { useState, useMemo } from "react";
import {
  CalendarX, Plus, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, Clock, TrendingDown,
  ChevronDown, ChevronUp, GraduationCap,
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
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
const ABSENCE_TYPES = [
  "authorised", "unauthorised", "medical", "exclusion",
  "part_time_timetable", "late_arrival", "internal_truancy",
] as const;
type AbsenceType = typeof ABSENCE_TYPES[number];
const ABSENCE_LABELS: Record<AbsenceType, string> = {
  authorised: "Authorised", unauthorised: "Unauthorised",
  medical: "Medical", exclusion: "Exclusion",
  part_time_timetable: "Part-Time Timetable", late_arrival: "Late Arrival",
  internal_truancy: "Internal Truancy",
};
const ABSENCE_COLORS: Record<AbsenceType, string> = {
  authorised: "bg-blue-100 text-blue-800", unauthorised: "bg-red-100 text-red-800",
  medical: "bg-yellow-100 text-yellow-800", exclusion: "bg-red-100 text-red-800",
  part_time_timetable: "bg-purple-100 text-purple-800", late_arrival: "bg-orange-100 text-orange-800",
  internal_truancy: "bg-red-100 text-red-800",
};

const SETTINGS = ["school", "college", "pru", "tuition", "activity", "appointment"] as const;
type Setting = typeof SETTINGS[number];
const SETTING_LABELS: Record<Setting, string> = {
  school: "School", college: "College", pru: "PRU",
  tuition: "Home Tuition", activity: "Activity", appointment: "Appointment",
};

interface AbsenceRecord {
  id: string;
  youngPersonId: string;
  date: string;
  type: AbsenceType;
  setting: Setting;
  settingName: string;
  sessions: number; // 1 = half day, 2 = full day
  reason: string;
  actionTaken: string;
  schoolNotified: boolean;
  swNotified: boolean;
  recordedBy: string;
  followUp: string | null;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: AbsenceRecord[] = [
  {
    id: "abs_1", youngPersonId: "yp_alex", date: d(-2), type: "unauthorised",
    setting: "school", settingName: "Riverside Academy",
    sessions: 2, reason: "Alex refused to attend. Said they were feeling anxious about a test. Stayed in room despite encouragement.",
    actionTaken: "Spent 30 minutes with Alex discussing worries. Contacted school to explain absence. Agreed to discuss test anxiety with key worker.",
    schoolNotified: true, swNotified: false, recordedBy: "staff_anna",
    followUp: "Key work session to address test anxiety. CAMHS referral to be considered if pattern continues.",
  },
  {
    id: "abs_2", youngPersonId: "yp_alex", date: d(-5), type: "late_arrival",
    setting: "school", settingName: "Riverside Academy",
    sessions: 1, reason: "Overslept — stayed up late on phone. Arrived at school 45 minutes late.",
    actionTaken: "Morning routine review. Phone collection time brought forward to 21:00.",
    schoolNotified: true, swNotified: false, recordedBy: "staff_edward",
    followUp: "Monitor phone routine for 2 weeks.",
  },
  {
    id: "abs_3", youngPersonId: "yp_alex", date: d(-8), type: "unauthorised",
    setting: "school", settingName: "Riverside Academy",
    sessions: 2, reason: "Left home for school but did not arrive. Located at local park by staff at 10:30am.",
    actionTaken: "Collected from park. Discussed reasons — Alex said they were being bullied in a specific class. School safeguarding lead notified.",
    schoolNotified: true, swNotified: true, recordedBy: "staff_darren",
    followUp: "Meeting with school re: bullying concern. Change of class being explored.",
  },
  {
    id: "abs_4", youngPersonId: "yp_jordan", date: d(-3), type: "medical",
    setting: "school", settingName: "Greenfield Secondary",
    sessions: 2, reason: "Dental appointment — emergency filling needed. Appointment took most of the day.",
    actionTaken: "Accompanied Jordan to dentist. Work sent home by school.",
    schoolNotified: true, swNotified: false, recordedBy: "staff_chervelle",
    followUp: null,
  },
  {
    id: "abs_5", youngPersonId: "yp_jordan", date: d(-10), type: "authorised",
    setting: "school", settingName: "Greenfield Secondary",
    sessions: 1, reason: "LAC review meeting — afternoon session missed.",
    actionTaken: "School aware — planned absence for statutory meeting.",
    schoolNotified: true, swNotified: false, recordedBy: "staff_anna",
    followUp: null,
  },
  {
    id: "abs_6", youngPersonId: "yp_casey", date: d(-1), type: "medical",
    setting: "college", settingName: "City College",
    sessions: 2, reason: "CAMHS appointment in the morning, felt drained afterwards and did not attend afternoon session.",
    actionTaken: "Supported Casey after CAMHS session. College tutor emailed.",
    schoolNotified: true, swNotified: false, recordedBy: "staff_mirela",
    followUp: "Discuss with CAMHS about scheduling appointments at end of day to minimise education impact.",
  },
  {
    id: "abs_7", youngPersonId: "yp_casey", date: d(-6), type: "authorised",
    setting: "college", settingName: "City College",
    sessions: 2, reason: "College inset day — no students required.",
    actionTaken: "N/A — planned closure.",
    schoolNotified: false, swNotified: false, recordedBy: "staff_diane",
    followUp: null,
  },
  {
    id: "abs_8", youngPersonId: "yp_alex", date: d(-12), type: "exclusion",
    setting: "school", settingName: "Riverside Academy",
    sessions: 4, reason: "Fixed-term exclusion (2 days) — verbal altercation with a teacher following being challenged about late homework.",
    actionTaken: "RM attended reintegration meeting. Alex completed work at home during exclusion. Incident discussed in key work. SW informed.",
    schoolNotified: true, swNotified: true, recordedBy: "staff_darren",
    followUp: "Reintegration meeting held. Behaviour support plan updated. Additional in-class support agreed.",
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function AbsenceTrackingPage() {
  const [records] = useState<AbsenceRecord[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterYP, setFilterYP] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.reason.toLowerCase().includes(q) ||
          r.settingName.toLowerCase().includes(q) ||
          r.actionTaken.toLowerCase().includes(q)
      );
    }
    if (filterYP !== "all") list = list.filter((r) => r.youngPersonId === filterYP);
    if (filterType !== "all") list = list.filter((r) => r.type === filterType);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "yp": return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
        case "type": return a.type.localeCompare(b.type);
        case "sessions": return b.sessions - a.sessions;
        default: return 0;
      }
    });
    return list;
  }, [records, search, filterYP, filterType, sortBy]);

  /* per-child stats */
  const ypIds = ["yp_alex", "yp_jordan", "yp_casey"];
  const ypStats = ypIds.map((id) => {
    const yps = records.filter((r) => r.youngPersonId === id);
    const totalSessions = yps.reduce((s, r) => s + r.sessions, 0);
    const unauthorised = yps.filter((r) => r.type === "unauthorised" || r.type === "internal_truancy").reduce((s, r) => s + r.sessions, 0);
    return { id, name: getYPName(id), total: totalSessions, unauthorised };
  });

  const totalAbsences = records.length;
  const totalSessionsLost = records.reduce((s, r) => s + r.sessions, 0);
  const unauthorisedCount = records.filter((r) => r.type === "unauthorised" || r.type === "internal_truancy").length;
  const exclusions = records.filter((r) => r.type === "exclusion").length;

  const exportCols: ExportColumn<AbsenceRecord>[] = [
    { header: "ID", accessor: (r: AbsenceRecord) => r.id },
    { header: "Young Person", accessor: (r: AbsenceRecord) => getYPName(r.youngPersonId) },
    { header: "Date", accessor: (r: AbsenceRecord) => r.date },
    { header: "Type", accessor: (r: AbsenceRecord) => ABSENCE_LABELS[r.type] },
    { header: "Setting", accessor: (r: AbsenceRecord) => SETTING_LABELS[r.setting] },
    { header: "Setting Name", accessor: (r: AbsenceRecord) => r.settingName },
    { header: "Sessions Lost", accessor: (r: AbsenceRecord) => r.sessions },
    { header: "Reason", accessor: (r: AbsenceRecord) => r.reason },
    { header: "Action Taken", accessor: (r: AbsenceRecord) => r.actionTaken },
    { header: "School Notified", accessor: (r: AbsenceRecord) => r.schoolNotified ? "Yes" : "No" },
    { header: "SW Notified", accessor: (r: AbsenceRecord) => r.swNotified ? "Yes" : "No" },
    { header: "Recorded By", accessor: (r: AbsenceRecord) => getStaffName(r.recordedBy) },
    { header: "Follow-Up", accessor: (r: AbsenceRecord) => r.followUp ?? "" },
  ];

  return (
    <PageShell
      title="Absence Tracking"
      subtitle="Monitor school and education attendance for all young people"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Absence Tracking" />
          <ExportButton data={filtered} columns={exportCols} filename="absence-tracking" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> Record Absence
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Absences", value: totalAbsences, icon: CalendarX, colour: "text-blue-600" },
            { label: "Sessions Lost", value: totalSessionsLost, icon: Clock, colour: "text-orange-600" },
            { label: "Unauthorised", value: unauthorisedCount, icon: AlertTriangle, colour: unauthorisedCount > 0 ? "text-red-600" : "text-slate-400" },
            { label: "Exclusions", value: exclusions, icon: TrendingDown, colour: exclusions > 0 ? "text-red-600" : "text-slate-400" },
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

        {/* ── per-child summary ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ypStats.map((yp) => (
            <div key={yp.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                <p className="font-medium text-sm">{yp.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Sessions Lost</p>
                  <p className="font-bold">{yp.total}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Unauthorised</p>
                  <p className={cn("font-bold", yp.unauthorised > 0 && "text-red-600")}>{yp.unauthorised}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── alerts ────────────────────────────────────────────── */}
        {unauthorisedCount > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">
                <strong>{unauthorisedCount}</strong> unauthorised absence(s) recorded. Review patterns and
                implement attendance action plans where attendance falls below 90%.
              </p>
            </div>
          </div>
        )}

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reasons, settings, actions…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterYP} onValueChange={setFilterYP}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Children</SelectItem>
                {ypIds.map((id) => (
                  <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {ABSENCE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{ABSENCE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="yp">Young Person</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="sessions">Sessions Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No absences match your filters.</div>
          )}
          {filtered.map((rec) => {
            const isExpanded = expanded === rec.id;
            return (
              <div key={rec.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : rec.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <CalendarX className={cn("h-5 w-5 shrink-0",
                      rec.type === "unauthorised" || rec.type === "exclusion" ? "text-red-600" :
                      rec.type === "medical" ? "text-yellow-600" : "text-blue-600"
                    )} />
                    <div className="min-w-0">
                      <p className="font-medium">{getYPName(rec.youngPersonId)} — {rec.date}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rec.settingName} · {rec.sessions === 1 ? "½ day" : rec.sessions === 2 ? "Full day" : `${rec.sessions / 2} days`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", ABSENCE_COLORS[rec.type])}>
                      {ABSENCE_LABELS[rec.type]}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Setting:</span> <span className="font-medium">{SETTING_LABELS[rec.setting]}</span></div>
                      <div><span className="text-muted-foreground">Sessions:</span> <span className="font-medium">{rec.sessions}</span></div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className={cn("h-3 w-3", rec.schoolNotified ? "text-green-600" : "text-slate-300")} />
                        <span className="text-sm">School Notified</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className={cn("h-3 w-3", rec.swNotified ? "text-green-600" : "text-slate-300")} />
                        <span className="text-sm">SW Notified</span>
                      </div>
                    </div>

                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Reason</p>
                      <p className="text-sm">{rec.reason}</p>
                    </div>

                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-medium text-blue-700 mb-1">Action Taken</p>
                      <p className="text-sm">{rec.actionTaken}</p>
                    </div>

                    {rec.followUp && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-medium text-amber-700 mb-1">Follow-Up Required</p>
                        <p className="text-sm">{rec.followUp}</p>
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      Recorded by {getStaffName(rec.recordedBy)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Education & Attendance:</strong> Children&apos;s homes must promote education attendance (Reg 8).
          All absences must be recorded with reasons and actions taken. Persistent absence (below 90%)
          triggers a PEP review. Exclusions must be reported to the placing authority and recorded on the
          child&apos;s file. The Virtual School Head should be consulted where attendance is a concern.
        </div>
      </div>

      {/* ── placeholder dialog ──────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Absence</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground text-sm">
            <CalendarX className="h-10 w-10 mx-auto mb-3 text-blue-300" />
            <p>Full form will capture young person, absence type,</p>
            <p>setting, reason, and notification details.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
