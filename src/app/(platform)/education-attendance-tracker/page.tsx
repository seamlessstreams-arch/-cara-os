"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, GraduationCap, CalendarCheck, UserX, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type Provision = "school" | "college" | "PRU" | "AP" | "EOTAS";
type Session = "AM" | "PM" | "Full Day";
type AttendanceCode = "/" | "\\" | "L" | "U" | "N" | "O" | "I" | "M" | "E";

interface AttendanceRecord {
  id: string;
  date: string;
  youngPerson: string;
  provision: Provision;
  session: Session;
  attendanceCode: AttendanceCode;
  codeMeaning: string;
  arrivalTime: string;
  departureTime: string;
  reason: string;
  authorisedAbsence: boolean;
  interventionsUsed: string[];
  recordedBy: string;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const PROVISION_LABEL: Record<Provision, string> = {
  school: "School", college: "College", PRU: "PRU", AP: "Alternative Provision", EOTAS: "EOTAS",
};
const PROVISION_CLR: Record<Provision, string> = {
  school: "bg-blue-100 text-blue-800",
  college: "bg-indigo-100 text-indigo-800",
  PRU: "bg-amber-100 text-amber-800",
  AP: "bg-purple-100 text-purple-800",
  EOTAS: "bg-orange-100 text-orange-800",
};

const CODE_CLR: Record<AttendanceCode, string> = {
  "/": "bg-green-100 text-green-800",
  "\\": "bg-green-100 text-green-800",
  "L": "bg-amber-100 text-amber-800",
  "I": "bg-blue-100 text-blue-800",
  "M": "bg-blue-100 text-blue-800",
  "E": "bg-purple-100 text-purple-800",
  "O": "bg-red-100 text-red-800",
  "U": "bg-red-100 text-red-800",
  "N": "bg-red-100 text-red-800",
};

const CODE_OPTIONS: { code: AttendanceCode; meaning: string }[] = [
  { code: "/", meaning: "Present (AM)" },
  { code: "\\", meaning: "Present (PM)" },
  { code: "L", meaning: "Late (before register closed)" },
  { code: "U", meaning: "Late after register closed (unauthorised)" },
  { code: "I", meaning: "Illness (authorised)" },
  { code: "M", meaning: "Medical/dental appointment" },
  { code: "E", meaning: "Excluded (no alternative provision)" },
  { code: "O", meaning: "Unauthorised absence (other)" },
  { code: "N", meaning: "Reason not yet provided" },
];

const BORDER_CODE: Record<AttendanceCode, string> = {
  "/": "border-l-green-500",
  "\\": "border-l-green-500",
  "L": "border-l-amber-500",
  "I": "border-l-blue-400",
  "M": "border-l-blue-400",
  "E": "border-l-purple-500",
  "O": "border-l-red-600",
  "U": "border-l-red-600",
  "N": "border-l-red-400",
};

const PRESENT_CODES: AttendanceCode[] = ["/", "\\", "L"];
const UNAUTH_CODES: AttendanceCode[] = ["O", "U", "N"];

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: AttendanceRecord[] = [
  // Alex — strong attendance
  {
    id: "att_1", date: d(-1), youngPerson: "yp_alex", provision: "school", session: "Full Day",
    attendanceCode: "/", codeMeaning: "Present (AM)",
    arrivalTime: "08:45", departureTime: "15:15", reason: "", authorisedAbsence: false,
    interventionsUsed: ["Morning routine adjustment", "Breakfast at home before transport"],
    recordedBy: "staff_edward",
    notes: "Settled day at Oakfield Academy. Engaged in maths and PE. Designated teacher confirmed full attendance.",
  },
  {
    id: "att_2", date: d(-2), youngPerson: "yp_alex", provision: "school", session: "Full Day",
    attendanceCode: "/", codeMeaning: "Present (AM)",
    arrivalTime: "08:50", departureTime: "15:15", reason: "", authorisedAbsence: false,
    interventionsUsed: ["Transport support"],
    recordedBy: "staff_darren",
    notes: "Full attendance. Arrived slightly later due to traffic.",
  },
  {
    id: "att_3", date: d(-3), youngPerson: "yp_alex", provision: "school", session: "Full Day",
    attendanceCode: "/", codeMeaning: "Present (AM)",
    arrivalTime: "08:40", departureTime: "15:15", reason: "", authorisedAbsence: false,
    interventionsUsed: [],
    recordedBy: "staff_anna",
    notes: "Good day reported by form tutor.",
  },
  {
    id: "att_4", date: d(-4), youngPerson: "yp_alex", provision: "school", session: "AM",
    attendanceCode: "M", codeMeaning: "Medical/dental appointment",
    arrivalTime: "11:30", departureTime: "15:15", reason: "Dental appointment — pre-booked",
    authorisedAbsence: true,
    interventionsUsed: ["Transport support", "Appointment letter provided to school"],
    recordedBy: "staff_edward",
    notes: "Dental check-up. Returned to school for afternoon session. Authorised by school office.",
  },
  {
    id: "att_5", date: d(-7), youngPerson: "yp_alex", provision: "school", session: "Full Day",
    attendanceCode: "/", codeMeaning: "Present (AM)",
    arrivalTime: "08:45", departureTime: "15:15", reason: "", authorisedAbsence: false,
    interventionsUsed: [],
    recordedBy: "staff_darren",
    notes: "Standard school day, no issues.",
  },
  {
    id: "att_6", date: d(-8), youngPerson: "yp_alex", provision: "school", session: "Full Day",
    attendanceCode: "L", codeMeaning: "Late (before register closed)",
    arrivalTime: "09:10", departureTime: "15:15", reason: "Overslept — bus missed",
    authorisedAbsence: false,
    interventionsUsed: ["Morning routine adjustment", "Reviewed alarm system with Alex"],
    recordedBy: "staff_anna",
    notes: "Late arrival but before register closed. Discussed with Alex — agreed earlier alarm.",
  },

  // Jordan — part-time timetable, EHCP, more variable
  {
    id: "att_7", date: d(-1), youngPerson: "yp_jordan", provision: "school", session: "AM",
    attendanceCode: "/", codeMeaning: "Present (AM)",
    arrivalTime: "09:00", departureTime: "12:30", reason: "",
    authorisedAbsence: false,
    interventionsUsed: ["1:1 TA support", "Sensory break scheduled"],
    recordedBy: "staff_edward",
    notes: "Morning session attended in full. PTT in place — afternoons not currently expected.",
  },
  {
    id: "att_8", date: d(-2), youngPerson: "yp_jordan", provision: "school", session: "AM",
    attendanceCode: "/", codeMeaning: "Present (AM)",
    arrivalTime: "09:05", departureTime: "12:30", reason: "",
    authorisedAbsence: false,
    interventionsUsed: ["1:1 TA support"],
    recordedBy: "staff_darren",
    notes: "Engaged well in English. SENCO reported a positive morning.",
  },
  {
    id: "att_9", date: d(-3), youngPerson: "yp_jordan", provision: "school", session: "AM",
    attendanceCode: "I", codeMeaning: "Illness (authorised)",
    arrivalTime: "", departureTime: "", reason: "Migraine — kept home with paracetamol",
    authorisedAbsence: true,
    interventionsUsed: ["Quiet room provided", "GP contacted for advice"],
    recordedBy: "staff_anna",
    notes: "Authorised absence. Jordan reported severe headache on waking. School informed.",
  },
  {
    id: "att_10", date: d(-4), youngPerson: "yp_jordan", provision: "school", session: "AM",
    attendanceCode: "O", codeMeaning: "Unauthorised absence (other)",
    arrivalTime: "", departureTime: "",
    reason: "Refused to attend citing anxiety — no medical evidence",
    authorisedAbsence: false,
    interventionsUsed: ["Anxiety management plan reviewed", "CAMHS referral progressed", "Morning routine adjustment"],
    recordedBy: "staff_edward",
    notes: "Jordan refused to leave room. School informed. Virtual school flagged. CAMHS aware. Reflective conversation held in afternoon.",
  },
  {
    id: "att_11", date: d(-7), youngPerson: "yp_jordan", provision: "school", session: "AM",
    attendanceCode: "/", codeMeaning: "Present (AM)",
    arrivalTime: "09:00", departureTime: "12:30", reason: "",
    authorisedAbsence: false,
    interventionsUsed: ["1:1 TA support", "Sensory break scheduled"],
    recordedBy: "staff_darren",
    notes: "Good morning session.",
  },
  {
    id: "att_12", date: d(-8), youngPerson: "yp_jordan", provision: "school", session: "AM",
    attendanceCode: "L", codeMeaning: "Late (before register closed)",
    arrivalTime: "09:25", departureTime: "12:30", reason: "Sensory overload at breakfast",
    authorisedAbsence: false,
    interventionsUsed: ["Sensory regulation strategies", "Transport support"],
    recordedBy: "staff_anna",
    notes: "Arrived late after sensory regulation needed. School aware of EHCP context.",
  },
  {
    id: "att_13", date: d(-9), youngPerson: "yp_jordan", provision: "school", session: "AM",
    attendanceCode: "O", codeMeaning: "Unauthorised absence (other)",
    arrivalTime: "", departureTime: "",
    reason: "Anxiety — refused transport",
    authorisedAbsence: false,
    interventionsUsed: ["De-escalation", "Anxiety management plan reviewed"],
    recordedBy: "staff_edward",
    notes: "Second unauthorised absence this fortnight. Pattern emerging — flagged at next PTT review.",
  },

  // Casey — missing education, AP being explored
  {
    id: "att_14", date: d(-1), youngPerson: "yp_casey", provision: "AP", session: "Full Day",
    attendanceCode: "O", codeMeaning: "Unauthorised absence (other)",
    arrivalTime: "", departureTime: "",
    reason: "Refused to engage with alternative provision",
    authorisedAbsence: false,
    interventionsUsed: ["Mentoring session attempted", "Virtual School Head consulted"],
    recordedBy: "staff_edward",
    notes: "AP placement at Bridge House offered for trial day. Casey refused to attend. Virtual school informed. CME process active.",
  },
  {
    id: "att_15", date: d(-2), youngPerson: "yp_casey", provision: "college", session: "Full Day",
    attendanceCode: "N", codeMeaning: "Reason not yet provided",
    arrivalTime: "", departureTime: "",
    reason: "Not provided — Casey did not communicate",
    authorisedAbsence: false,
    interventionsUsed: ["Welfare check completed", "Advocate contacted"],
    recordedBy: "staff_darren",
    notes: "No reason offered. Welfare check completed — Casey safe in placement. College informed.",
  },
  {
    id: "att_16", date: d(-3), youngPerson: "yp_casey", provision: "college", session: "Full Day",
    attendanceCode: "O", codeMeaning: "Unauthorised absence (other)",
    arrivalTime: "", departureTime: "",
    reason: "Disengaged following LADO investigation — unwilling to return to college",
    authorisedAbsence: false,
    interventionsUsed: ["Therapeutic conversation", "Social worker informed"],
    recordedBy: "staff_anna",
    notes: "Continued non-attendance. Year 11 — exam impact escalating. Emergency PEP requested.",
  },
  {
    id: "att_17", date: d(-4), youngPerson: "yp_casey", provision: "college", session: "Full Day",
    attendanceCode: "I", codeMeaning: "Illness (authorised)",
    arrivalTime: "", departureTime: "",
    reason: "Migraine — GP contacted",
    authorisedAbsence: true,
    interventionsUsed: ["GP appointment arranged", "Quiet room provided"],
    recordedBy: "staff_edward",
    notes: "Authorised absence. GP advised rest. College notified.",
  },
  {
    id: "att_18", date: d(-7), youngPerson: "yp_casey", provision: "college", session: "Full Day",
    attendanceCode: "O", codeMeaning: "Unauthorised absence (other)",
    arrivalTime: "", departureTime: "",
    reason: "Persistent disengagement",
    authorisedAbsence: false,
    interventionsUsed: ["Mentoring session attempted", "AP options explored with LA"],
    recordedBy: "staff_darren",
    notes: "Pattern of non-attendance continuing. CME referral active. Alternative provision being progressed.",
  },
  {
    id: "att_19", date: d(-8), youngPerson: "yp_casey", provision: "college", session: "AM",
    attendanceCode: "/", codeMeaning: "Present (AM)",
    arrivalTime: "09:30", departureTime: "12:00", reason: "",
    authorisedAbsence: false,
    interventionsUsed: ["Transport support", "1:1 mentoring"],
    recordedBy: "staff_anna",
    notes: "Brief attendance — Casey left at lunch reporting feeling overwhelmed. Partial credit recorded.",
  },
  {
    id: "att_20", date: d(-9), youngPerson: "yp_casey", provision: "college", session: "Full Day",
    attendanceCode: "U", codeMeaning: "Late after register closed (unauthorised)",
    arrivalTime: "11:15", departureTime: "15:00", reason: "Overslept — no contact made with college",
    authorisedAbsence: false,
    interventionsUsed: ["Morning routine adjustment", "Mentoring session"],
    recordedBy: "staff_edward",
    notes: "Late beyond register close — counted as unauthorised absence. College DSL informed.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function EducationAttendanceTrackerPage() {
  const [data] = useState(SEED);
  const [search, setSearch] = useState("");
  const [filterChild, setFilterChild] = useState("all");
  const [filterCode, setFilterCode] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((p) => (p === id ? null : id));

  /* ── derived ─────────────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let rows = data.filter((r: AttendanceRecord) => {
      if (filterChild !== "all" && r.youngPerson !== filterChild) return false;
      if (filterCode !== "all" && r.attendanceCode !== filterCode) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          getYPName(r.youngPerson).toLowerCase().includes(q) ||
          r.codeMeaning.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          PROVISION_LABEL[r.provision].toLowerCase().includes(q)
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date.localeCompare(a.date);
        case "date-asc": return a.date.localeCompare(b.date);
        case "name-asc": return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        case "code-asc": return a.attendanceCode.localeCompare(b.attendanceCode);
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterChild, filterCode, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────────────── */

  const weekStart = d(-7);
  const weekRecords = data.filter((r) => r.date >= weekStart);
  const weekPresent = weekRecords.filter((r) => PRESENT_CODES.includes(r.attendanceCode)).length;
  const weekTotal = weekRecords.length || 1;
  const weekPct = Math.round((weekPresent / weekTotal) * 100);

  const weekUnauth = weekRecords.filter((r) => UNAUTH_CODES.includes(r.attendanceCode)).length;

  // attendance % per child (overall in dataset)
  const ypIds = ["yp_alex", "yp_jordan", "yp_casey"];
  const perChild = ypIds.map((id) => {
    const recs = data.filter((r) => r.youngPerson === id);
    const present = recs.filter((r) => PRESENT_CODES.includes(r.attendanceCode)).length;
    const total = recs.length || 1;
    const pct = Math.round((present / total) * 100);
    return { id, pct, total: recs.length };
  });
  const meetingTarget = perChild.filter((c) => c.pct >= 95).length;

  const daysTracked = new Set(data.map((r) => r.date)).size;

  /* ── export ──────────────────────────────────────────────────────────────── */

  const exportCols: ExportColumn<AttendanceRecord>[] = [
    { header: "Date", accessor: (r: AttendanceRecord) => r.date },
    { header: "Young Person", accessor: (r: AttendanceRecord) => getYPName(r.youngPerson) },
    { header: "Provision", accessor: (r: AttendanceRecord) => PROVISION_LABEL[r.provision] },
    { header: "Session", accessor: (r: AttendanceRecord) => r.session },
    { header: "Code", accessor: (r: AttendanceRecord) => r.attendanceCode },
    { header: "Code Meaning", accessor: (r: AttendanceRecord) => r.codeMeaning },
    { header: "Arrival", accessor: (r: AttendanceRecord) => r.arrivalTime },
    { header: "Departure", accessor: (r: AttendanceRecord) => r.departureTime },
    { header: "Reason", accessor: (r: AttendanceRecord) => r.reason },
    { header: "Authorised", accessor: (r: AttendanceRecord) => r.authorisedAbsence ? "Yes" : "No" },
    { header: "Interventions", accessor: (r: AttendanceRecord) => r.interventionsUsed.join("; ") },
    { header: "Recorded By", accessor: (r: AttendanceRecord) => getStaffName(r.recordedBy) },
    { header: "Notes", accessor: (r: AttendanceRecord) => r.notes },
  ];

  /* ── render ──────────────────────────────────────────────────────────────── */

  return (
    <PageShell
      title="Education Attendance Tracker"
      subtitle="Quality Standard 8 (Education) · Virtual School Oversight · Daily Attendance Monitoring"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Education Attendance Tracker" />
          <ExportButton data={filtered} columns={exportCols} filename="education-attendance-tracker" />
        </div>
      }
    >
      <div id="print-area">
        {/* ── stat strip ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "This Week Attendance", value: `${weekPct}%`, icon: CalendarCheck, clr: "text-blue-600" },
            { label: "Unauthorised Absences (Week)", value: weekUnauth, icon: UserX, clr: "text-red-600" },
            { label: "Children Meeting 95%+ Target", value: `${meetingTarget}/${perChild.length}`, icon: Target, clr: "text-green-600" },
            { label: "Days Tracked", value: daysTracked, icon: GraduationCap, clr: "text-indigo-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── per-child attendance ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {perChild.map((c) => {
            const meets = c.pct >= 95;
            const concerning = c.pct < 90;
            return (
              <Card key={c.id} className={cn("border-l-4",
                meets ? "border-l-green-500" : concerning ? "border-l-red-500" : "border-l-amber-500")}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{getYPName(c.id)}</p>
                      <p className="text-xs text-muted-foreground">{c.total} session{c.total === 1 ? "" : "s"} recorded</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-2xl font-bold",
                        meets ? "text-green-600" : concerning ? "text-red-600" : "text-amber-600")}>
                        {c.pct}%
                      </p>
                      <Badge variant="outline" className={cn(
                        meets ? "bg-green-100 text-green-800"
                          : concerning ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800")}>
                        {meets ? "Meets target" : concerning ? "Below threshold" : "Concerning"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── alert banner ─────────────────────────────────────────────────── */}
        {weekUnauth > 0 && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">{weekUnauth} unauthorised absence(s) recorded this week</p>
              <p className="text-red-700">Each unauthorised absence (codes O, U, N) must be reported to the Virtual School and reviewed against the child&apos;s PEP. Consider whether the pattern indicates a need for an emergency PEP review or CME referral.</p>
            </div>
          </div>
        )}

        {meetingTarget === perChild.length && weekUnauth === 0 && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-3 mb-6 flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-green-800">All children currently meeting 95% attendance target</p>
              <p className="text-green-700">Continue daily monitoring and ensure PEP targets remain on track.</p>
            </div>
          </div>
        )}

        {/* ── filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, reason, notes, provision..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterChild} onValueChange={setFilterChild}>
            <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
              <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
              <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCode} onValueChange={setFilterCode}>
            <SelectTrigger className="w-[220px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Attendance Codes</SelectItem>
              {CODE_OPTIONS.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.code} — {c.meaning}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Date (Newest First)</SelectItem>
              <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
              <SelectItem value="name-asc">Name A–Z</SelectItem>
              <SelectItem value="code-asc">Attendance Code</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── records ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expandedId === r.id;
            const isUnauth = UNAUTH_CODES.includes(r.attendanceCode);
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_CODE[r.attendanceCode])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.youngPerson)} — {r.date}
                        <Badge variant="outline" className={CODE_CLR[r.attendanceCode]}>
                          {r.attendanceCode} — {r.codeMeaning}
                        </Badge>
                        <Badge variant="outline" className={PROVISION_CLR[r.provision]}>
                          {PROVISION_LABEL[r.provision]}
                        </Badge>
                        {isUnauth && (
                          <Badge variant="outline" className="bg-red-100 text-red-800">Unauthorised</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.session}
                        {r.arrivalTime && ` · Arrived ${r.arrivalTime}`}
                        {r.departureTime && ` · Departed ${r.departureTime}`}
                        {" · Recorded by "}{getStaffName(r.recordedBy)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.authorisedAbsence && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">Authorised</Badge>
                      )}
                      {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* session detail */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Session</p>
                        <p className="text-xs text-muted-foreground">{r.session}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Provision</p>
                        <p className="text-xs text-muted-foreground">{PROVISION_LABEL[r.provision]}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Arrival</p>
                        <p className="text-xs text-muted-foreground">{r.arrivalTime || "—"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Departure</p>
                        <p className="text-xs text-muted-foreground">{r.departureTime || "—"}</p>
                      </div>
                    </div>

                    {/* reason */}
                    {r.reason && (
                      <div className={cn(
                        "rounded-lg p-3",
                        isUnauth ? "bg-red-50" : r.authorisedAbsence ? "bg-blue-50" : "bg-amber-50"
                      )}>
                        <p className={cn(
                          "font-medium mb-1",
                          isUnauth ? "text-red-800" : r.authorisedAbsence ? "text-blue-800" : "text-amber-800"
                        )}>Reason</p>
                        <p className={cn(
                          "text-xs",
                          isUnauth ? "text-red-700" : r.authorisedAbsence ? "text-blue-700" : "text-amber-700"
                        )}>{r.reason}</p>
                      </div>
                    )}

                    {/* interventions */}
                    {r.interventionsUsed.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Interventions Used</p>
                        <ul className="list-disc list-inside space-y-1">
                          {r.interventionsUsed.map((i, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground">{i}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* notes */}
                    {r.notes && (
                      <div>
                        <p className="font-medium mb-1">Notes</p>
                        <p className="text-muted-foreground">{r.notes}</p>
                      </div>
                    )}

                    {/* footer */}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Code: {r.attendanceCode} ({r.codeMeaning})</span>
                      <span>{r.authorisedAbsence ? "Authorised" : isUnauth ? "Unauthorised" : "Present"}</span>
                      <span>Recorded by {getStaffName(r.recordedBy)}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── regulatory note ────────────────────────────────────────────── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Children&apos;s Homes (England) Regulations 2015, Quality Standard 8 — the education standard requires the registered person to ensure each child has access to suitable educational provision and that their attendance and progress are actively monitored. Daily attendance must be recorded using the DfE statutory school attendance codes and shared with the Virtual School Head, who has statutory responsibility under the Children Act 2004 for monitoring the educational achievement of looked-after children. Unauthorised absences (codes O, U, N) and persistent absence (below 90%) trigger review of the Personal Education Plan (PEP). Sustained non-attendance must be reported to the Local Authority under the Children Missing Education (CME) duty (Education Act 1996, s.436A).</p>
        </div>
      </div>
    </PageShell>
  );
}
