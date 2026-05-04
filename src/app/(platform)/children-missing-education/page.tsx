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
  AlertTriangle, CheckCircle2, Clock, GraduationCap, BookOpen, UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type CMEStatus = "in_education" | "missing_education" | "part_time_timetable" | "exclusion" | "awaiting_placement" | "elective_home_ed";
type AttendanceLevel = "good" | "concerning" | "persistent_absence" | "severe_absence";

interface CMERecord {
  id: string;
  youngPersonId: string;
  school: string;
  yearGroup: string;
  currentStatus: CMEStatus;
  attendancePercentage: number;
  attendanceLevel: AttendanceLevel;
  authorisedAbsences: number;
  unauthorisedAbsences: number;
  exclusions: { fixed_term: number; permanent: number };
  currentExclusion: boolean;
  exclusionDetails: string;
  partTimeTimetable: boolean;
  pttDetails: string;
  pttReviewDate: string | null;
  senStatus: string;
  ehcpInPlace: boolean;
  virtualSchoolContact: string;
  lastPepDate: string;
  nextPepDate: string;
  actionsTaken: string[];
  concerns: string;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const STATUS_LABEL: Record<CMEStatus, string> = {
  in_education: "In Education", missing_education: "Missing Education",
  part_time_timetable: "Part-Time Timetable", exclusion: "Exclusion",
  awaiting_placement: "Awaiting Placement", elective_home_ed: "Elective Home Education",
};
const STATUS_CLR: Record<CMEStatus, string> = {
  in_education: "bg-green-100 text-green-800", missing_education: "bg-red-100 text-red-800",
  part_time_timetable: "bg-amber-100 text-amber-800", exclusion: "bg-red-100 text-red-800",
  awaiting_placement: "bg-purple-100 text-purple-800", elective_home_ed: "bg-blue-100 text-blue-800",
};

const ATTEND_LABEL: Record<AttendanceLevel, string> = {
  good: "Good", concerning: "Concerning",
  persistent_absence: "Persistent Absence", severe_absence: "Severe Absence",
};
const ATTEND_CLR: Record<AttendanceLevel, string> = {
  good: "bg-green-100 text-green-800", concerning: "bg-amber-100 text-amber-800",
  persistent_absence: "bg-orange-100 text-orange-800", severe_absence: "bg-red-100 text-red-800",
};

const BORDER_STATUS: Record<CMEStatus, string> = {
  in_education: "border-l-green-500", missing_education: "border-l-red-600",
  part_time_timetable: "border-l-amber-500", exclusion: "border-l-red-400",
  awaiting_placement: "border-l-purple-500", elective_home_ed: "border-l-blue-400",
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: CMERecord[] = [
  {
    id: "cme_1", youngPersonId: "yp_alex",
    school: "Oakfield Academy", yearGroup: "Year 9",
    currentStatus: "in_education", attendancePercentage: 91,
    attendanceLevel: "good", authorisedAbsences: 3, unauthorisedAbsences: 1,
    exclusions: { fixed_term: 0, permanent: 0 }, currentExclusion: false,
    exclusionDetails: "",
    partTimeTimetable: false, pttDetails: "", pttReviewDate: null,
    senStatus: "No SEN", ehcpInPlace: false,
    virtualSchoolContact: "Mrs Patterson (Designated Senior Lead)",
    lastPepDate: d(-45), nextPepDate: d(45),
    actionsTaken: [
      "Virtual School Head notified of 3 authorised absences (chickenpox — medical evidence provided)",
      "Attendance monitored weekly by designated teacher",
      "PEP reviewed and up to date — targets on track",
    ],
    concerns: "Minor — 1 unauthorised absence in current term. School DSL (Mrs Patterson) aware. No pattern of concern identified.",
    notes: "Alex is settled at Oakfield Academy. Positive relationship with form tutor. Attendance generally strong — recent authorised absences due to chickenpox. No exclusions or behavioural concerns. PEP targets progressing well.",
  },
  {
    id: "cme_2", youngPersonId: "yp_jordan",
    school: "Oakfield Academy", yearGroup: "Year 9",
    currentStatus: "part_time_timetable", attendancePercentage: 78,
    attendanceLevel: "concerning", authorisedAbsences: 5, unauthorisedAbsences: 2,
    exclusions: { fixed_term: 1, permanent: 0 }, currentExclusion: false,
    exclusionDetails: "1 fixed-term exclusion (2 days) last term — sensory overload incident in classroom. Reintegration meeting held with SENCO and virtual school.",
    partTimeTimetable: true,
    pttDetails: "Mornings only (9:00–12:30) following repeated sensory overload incidents in afternoon sessions. Reduced timetable agreed at multi-agency meeting with SENCO, virtual school, and educational psychologist. Full timetable reintroduction planned incrementally.",
    pttReviewDate: d(14),
    senStatus: "EHCP (ASD)", ehcpInPlace: true,
    virtualSchoolContact: "Mrs Patterson (Designated Senior Lead)",
    lastPepDate: d(-30), nextPepDate: d(60),
    actionsTaken: [
      "Part-time timetable agreed at multi-agency meeting — reviewed fortnightly",
      "EHCP annual review brought forward due to change in provision",
      "Sensory profile assessment completed by educational psychologist",
      "Virtual school monitoring attendance weekly",
      "1:1 TA support in place for morning sessions",
    ],
    concerns: "Attendance at 78% and declining. Part-time timetable in place but review needed to assess progress toward full reintegration. 2 unauthorised absences flagged — Jordan refused to attend on those mornings citing anxiety. CAMHS referral in progress.",
    notes: "Jordan has an EHCP for ASD. School are supportive but struggling with afternoon provision due to sensory needs. Part-time timetable is a temporary measure — must not become permanent without LA agreement. Virtual school closely involved. Next PTT review scheduled.",
  },
  {
    id: "cme_3", youngPersonId: "yp_casey",
    school: "City College", yearGroup: "Year 11",
    currentStatus: "missing_education", attendancePercentage: 62,
    attendanceLevel: "persistent_absence", authorisedAbsences: 8, unauthorisedAbsences: 6,
    exclusions: { fixed_term: 2, permanent: 0 }, currentExclusion: false,
    exclusionDetails: "2 fixed-term exclusions this academic year — 1 for persistent disruptive behaviour (3 days), 1 for verbal aggression toward staff (2 days). Reintegration meetings held after each exclusion.",
    partTimeTimetable: false, pttDetails: "", pttReviewDate: null,
    senStatus: "SEN Support (SEMH)", ehcpInPlace: false,
    virtualSchoolContact: "Mr Davies (Virtual School Head)",
    lastPepDate: d(-60), nextPepDate: d(5),
    actionsTaken: [
      "CME referral made to Local Authority — awaiting allocation",
      "Virtual school head notified and aware of non-attendance",
      "College maintaining placement on roll — attendance being monitored",
      "Social worker informed of education breakdown",
      "Alternative provision options being explored with LA",
      "Emergency PEP meeting requested",
    ],
    concerns: "Casey has not attended City College for 3 weeks since LADO investigation began. Was already on SEN Support for SEMH needs. Attendance had been declining throughout the year. 2 fixed-term exclusions contributing to disengagement. College report Casey is still on roll but placement is at risk if attendance does not improve. Year 11 — GCSE exams imminent. CME referral made. This is now a safeguarding concern given the combination of non-attendance, LADO involvement, and approaching school-leaving age.",
    notes: "Urgent case. Casey has effectively been missing education for 3 weeks. College are maintaining the placement but have indicated this cannot continue indefinitely. Virtual school aware. CME notification sent to LA. Emergency PEP needed. Alternative provision (AP) being explored as interim measure. LADO investigation adding complexity — Casey expressing reluctance to return to any educational setting.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function ChildrenMissingEducationPage() {
  const [data] = useState(SEED);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAttendance, setFilterAttendance] = useState("all");
  const [sortBy, setSortBy] = useState("attendance-asc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── derived ─────────────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterStatus !== "all" && r.currentStatus !== filterStatus) return false;
      if (filterAttendance !== "all" && r.attendanceLevel !== filterAttendance) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          getYPName(r.youngPersonId).toLowerCase().includes(q) ||
          r.school.toLowerCase().includes(q) ||
          r.concerns.toLowerCase().includes(q) ||
          STATUS_LABEL[r.currentStatus].toLowerCase().includes(q)
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "attendance-asc": return a.attendancePercentage - b.attendancePercentage;
        case "attendance-desc": return b.attendancePercentage - a.attendancePercentage;
        case "name-asc": return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
        case "name-desc": return getYPName(b.youngPersonId).localeCompare(getYPName(a.youngPersonId));
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterStatus, filterAttendance, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────────────── */

  const totalChildren = data.length;
  const missingEd = data.filter((r) => r.currentStatus === "missing_education").length;
  const partTime = data.filter((r) => r.currentStatus === "part_time_timetable").length;
  const belowThreshold = data.filter((r) => r.attendancePercentage < 90).length;

  /* ── export ──────────────────────────────────────────────────────────────── */

  const exportCols: ExportColumn<CMERecord>[] = [
    { header: "Young Person", accessor: (r: CMERecord) => getYPName(r.youngPersonId) },
    { header: "School", accessor: (r: CMERecord) => r.school },
    { header: "Year Group", accessor: (r: CMERecord) => r.yearGroup },
    { header: "Status", accessor: (r: CMERecord) => STATUS_LABEL[r.currentStatus] },
    { header: "Attendance %", accessor: (r: CMERecord) => `${r.attendancePercentage}%` },
    { header: "Attendance Level", accessor: (r: CMERecord) => ATTEND_LABEL[r.attendanceLevel] },
    { header: "Authorised Absences", accessor: (r: CMERecord) => r.authorisedAbsences.toString() },
    { header: "Unauthorised Absences", accessor: (r: CMERecord) => r.unauthorisedAbsences.toString() },
    { header: "Fixed-Term Exclusions", accessor: (r: CMERecord) => r.exclusions.fixed_term.toString() },
    { header: "Permanent Exclusions", accessor: (r: CMERecord) => r.exclusions.permanent.toString() },
    { header: "Part-Time Timetable", accessor: (r: CMERecord) => r.partTimeTimetable ? "Yes" : "No" },
    { header: "SEN Status", accessor: (r: CMERecord) => r.senStatus },
    { header: "EHCP", accessor: (r: CMERecord) => r.ehcpInPlace ? "Yes" : "No" },
    { header: "Virtual School Contact", accessor: (r: CMERecord) => r.virtualSchoolContact },
    { header: "Last PEP", accessor: (r: CMERecord) => r.lastPepDate },
    { header: "Next PEP", accessor: (r: CMERecord) => r.nextPepDate },
    { header: "Concerns", accessor: (r: CMERecord) => r.concerns },
  ];

  /* ── render ──────────────────────────────────────────────────────────────── */

  return (
    <PageShell
      title="Children Missing Education"
      subtitle="Education Act 1996 · Children Act 2004 · CME Monitoring & Attendance Tracking"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Children Missing Education" />
          <ExportButton data={filtered} columns={exportCols} filename="children-missing-education" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Entry</Button>
        </div>
      }
    >
      <div id="print-area">
        {/* ── stat strip ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Children Tracked", value: totalChildren, icon: GraduationCap, clr: "text-blue-600" },
            { label: "Missing Education", value: missingEd, icon: UserX, clr: "text-red-600" },
            { label: "Part-Time Timetable", value: partTime, icon: Clock, clr: "text-amber-600" },
            { label: "Below 90% Attendance", value: belowThreshold, icon: AlertTriangle, clr: "text-orange-600" },
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

        {/* ── alert banner ─────────────────────────────────────────────────── */}
        {missingEd > 0 && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">{missingEd} child(ren) currently missing education</p>
              <p className="text-red-700">Local Authority must be notified of any child missing education. Ensure CME referral has been made, virtual school is aware, and alternative provision is being actively explored.</p>
            </div>
          </div>
        )}

        {/* ── filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, school, concerns..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[190px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{(Object.keys(STATUS_LABEL) as CMEStatus[]).map((k) => (<SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterAttendance} onValueChange={setFilterAttendance}><SelectTrigger className="w-[190px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Attendance</SelectItem>{(Object.keys(ATTEND_LABEL) as AttendanceLevel[]).map((k) => (<SelectItem key={k} value={k}>{ATTEND_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[180px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="attendance-asc">Attendance (Low First)</SelectItem><SelectItem value="attendance-desc">Attendance (High First)</SelectItem><SelectItem value="name-asc">Name A–Z</SelectItem><SelectItem value="name-desc">Name Z–A</SelectItem></SelectContent></Select>
        </div>

        {/* ── records ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_STATUS[r.currentStatus])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getYPName(r.youngPersonId)} — {r.school}
                        <Badge variant="outline" className={STATUS_CLR[r.currentStatus]}>{STATUS_LABEL[r.currentStatus]}</Badge>
                        <Badge variant="outline" className={ATTEND_CLR[r.attendanceLevel]}>{r.attendancePercentage}% — {ATTEND_LABEL[r.attendanceLevel]}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.yearGroup} · Authorised: {r.authorisedAbsences} · Unauthorised: {r.unauthorisedAbsences} · Exclusions: {r.exclusions.fixed_term} FTE, {r.exclusions.permanent} Perm
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.ehcpInPlace && <Badge variant="outline" className="bg-indigo-100 text-indigo-800">EHCP</Badge>}
                      {r.partTimeTimetable && <Badge variant="outline" className="bg-amber-100 text-amber-800">PTT</Badge>}
                      {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* attendance & exclusion summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Attendance</p>
                        <p className="text-xs text-muted-foreground">{r.attendancePercentage}% ({ATTEND_LABEL[r.attendanceLevel]})</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Authorised Absences</p>
                        <p className="text-xs text-muted-foreground">{r.authorisedAbsences}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Unauthorised Absences</p>
                        <p className="text-xs text-muted-foreground">{r.unauthorisedAbsences}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Current Exclusion</p>
                        <p className="text-xs text-muted-foreground">{r.currentExclusion ? "Yes" : "No"}</p>
                      </div>
                    </div>

                    {/* exclusion details */}
                    {r.exclusionDetails && (
                      <div>
                        <p className="font-medium mb-1">Exclusion History</p>
                        <p className="text-muted-foreground">{r.exclusionDetails}</p>
                      </div>
                    )}

                    {/* part-time timetable */}
                    {r.partTimeTimetable && (
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="font-medium text-amber-800 mb-1">Part-Time Timetable</p>
                        <p className="text-amber-700 text-xs">{r.pttDetails}</p>
                        {r.pttReviewDate && (
                          <p className="text-amber-600 text-xs mt-1 font-medium">Next PTT Review: {r.pttReviewDate}</p>
                        )}
                      </div>
                    )}

                    {/* SEN & PEP */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-indigo-50 rounded-lg p-3">
                        <p className="font-medium text-indigo-800 mb-1">SEN Status</p>
                        <p className="text-indigo-700 text-xs">{r.senStatus}</p>
                        <p className="text-indigo-700 text-xs mt-1">EHCP: {r.ehcpInPlace ? "Yes — in place" : "No"}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="font-medium text-blue-800 mb-1">PEP Dates</p>
                        <p className="text-blue-700 text-xs">Last PEP: {r.lastPepDate}</p>
                        <p className="text-blue-700 text-xs">Next PEP: {r.nextPepDate}</p>
                      </div>
                    </div>

                    {/* virtual school contact */}
                    <div className="bg-muted/40 rounded p-3">
                      <p className="font-medium text-xs mb-1">Virtual School Contact</p>
                      <p className="text-xs text-muted-foreground">{r.virtualSchoolContact}</p>
                    </div>

                    {/* actions taken */}
                    {r.actionsTaken.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Actions Taken</p>
                        <ul className="list-disc list-inside space-y-1">
                          {r.actionsTaken.map((a, i) => (
                            <li key={i} className="text-xs text-muted-foreground">{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* concerns */}
                    {r.concerns && (
                      <div className="bg-red-50 rounded-lg p-3">
                        <p className="font-medium text-red-800 mb-1">Concerns</p>
                        <p className="text-red-700 text-xs">{r.concerns}</p>
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
                      <span>{r.school} — {r.yearGroup}</span>
                      <span>Last PEP: {r.lastPepDate}</span>
                      <span>Next PEP: {r.nextPepDate}</span>
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
          <p>Education Act 1996, s.436A — Local authorities must identify children not receiving suitable education. Children Act 2004 — duty to safeguard and promote welfare, including access to education. The Virtual School Head (VSH) has responsibility for monitoring and promoting the educational achievement of looked-after children. Personal Education Plans (PEPs) must be initiated within 20 school days of entering care and reviewed termly. Local authorities must be notified when a child is missing education or at risk of becoming so. Part-time timetables must be regularly reviewed and should not become a long-term arrangement without formal agreement.</p>
        </div>
      </div>

      {/* ── new entry dialog ──────────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New CME Record</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Young Person</Label><Select><SelectTrigger><SelectValue placeholder="Select young person..." /></SelectTrigger><SelectContent><SelectItem value="yp_alex">Alex</SelectItem><SelectItem value="yp_jordan">Jordan</SelectItem><SelectItem value="yp_casey">Casey</SelectItem></SelectContent></Select></div>
            <div><Label>School / Setting</Label><Input placeholder="School name" /></div>
            <div><Label>Year Group</Label><Input placeholder="e.g. Year 9" /></div>
            <div><Label>Current Status</Label><Select><SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger><SelectContent>{(Object.keys(STATUS_LABEL) as CMEStatus[]).map((k) => (<SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Attendance %</Label><Input type="number" placeholder="e.g. 85" min={0} max={100} /></div>
            <div><Label>Attendance Level</Label><Select><SelectTrigger><SelectValue placeholder="Select level..." /></SelectTrigger><SelectContent>{(Object.keys(ATTEND_LABEL) as AttendanceLevel[]).map((k) => (<SelectItem key={k} value={k}>{ATTEND_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Authorised Absences</Label><Input type="number" placeholder="0" min={0} /></div>
            <div><Label>Unauthorised Absences</Label><Input type="number" placeholder="0" min={0} /></div>
            <div><Label>SEN Status</Label><Input placeholder="e.g. No SEN, SEN Support, EHCP" /></div>
            <div><Label>Virtual School Contact</Label><Input placeholder="Name and role" /></div>
            <div><Label>Last PEP Date</Label><Input type="date" /></div>
            <div><Label>Next PEP Date</Label><Input type="date" /></div>
            <div className="col-span-2"><Label>Concerns</Label><Textarea placeholder="Describe any current concerns..." rows={3} /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea placeholder="Additional notes..." rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={() => setShowNew(false)}>Save Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
