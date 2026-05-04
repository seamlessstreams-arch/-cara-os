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
  AlertTriangle, CheckCircle2, Clock, HardHat, Stethoscope, ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type PersonType = "child" | "staff" | "visitor" | "contractor";
type Severity = "minor" | "moderate" | "major" | "riddor_reportable";
type AccidentCategory = "slip_trip_fall" | "collision" | "burn_scald" | "cut_laceration" | "bite" | "self_harm_injury" | "sport_play" | "assault" | "medication_related" | "other";
type Status = "open" | "first_aid_given" | "medical_treatment" | "hospital" | "investigated" | "closed";

interface AccidentRecord {
  id: string;
  date: string;
  time: string;
  reportedBy: string;
  personType: PersonType;
  personId: string | null;
  personName: string;
  category: AccidentCategory;
  severity: Severity;
  status: Status;
  location: string;
  description: string;
  injuryDetails: string;
  firstAidGiven: boolean;
  firstAidBy: string | null;
  firstAidDetails: string;
  medicalAttention: boolean;
  hospitalAttendance: boolean;
  hospitalName: string | null;
  parentCarerNotified: boolean;
  parentNotifiedTime: string | null;
  socialWorkerNotified: boolean;
  riddorReported: boolean;
  riddorRef: string | null;
  witnesses: string[];
  rootCause: string;
  preventiveMeasures: string;
  followUpDate: string | null;
  photographsTaken: boolean;
  bodyMapCompleted: boolean;
  signedOffBy: string | null;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const PERSON_TYPE_LABEL: Record<PersonType, string> = { child: "Child", staff: "Staff", visitor: "Visitor", contractor: "Contractor" };
const SEVERITY_LABEL: Record<Severity, string> = { minor: "Minor", moderate: "Moderate", major: "Major", riddor_reportable: "RIDDOR Reportable" };
const SEVERITY_CLR: Record<Severity, string> = { minor: "bg-green-100 text-green-800", moderate: "bg-yellow-100 text-yellow-800", major: "bg-orange-100 text-orange-800", riddor_reportable: "bg-red-100 text-red-800" };
const CAT_LABEL: Record<AccidentCategory, string> = {
  slip_trip_fall: "Slip / Trip / Fall", collision: "Collision", burn_scald: "Burn / Scald",
  cut_laceration: "Cut / Laceration", bite: "Bite", self_harm_injury: "Self-Harm Injury",
  sport_play: "Sport / Play", assault: "Assault", medication_related: "Medication Related", other: "Other",
};
const STATUS_LABEL: Record<Status, string> = { open: "Open", first_aid_given: "First Aid Given", medical_treatment: "Medical Treatment", hospital: "Hospital Attendance", investigated: "Investigated", closed: "Closed" };
const STATUS_CLR: Record<Status, string> = { open: "bg-blue-100 text-blue-800", first_aid_given: "bg-green-100 text-green-800", medical_treatment: "bg-yellow-100 text-yellow-800", hospital: "bg-red-100 text-red-800", investigated: "bg-purple-100 text-purple-800", closed: "bg-slate-100 text-slate-800" };

const BORDER_SEV: Record<Severity, string> = { minor: "border-l-green-400", moderate: "border-l-yellow-400", major: "border-l-orange-500", riddor_reportable: "border-l-red-600" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: AccidentRecord[] = [
  {
    id: "acc_1", date: d(-2), time: "15:45", reportedBy: "staff_anna",
    personType: "child", personId: "yp_alex", personName: "Alex",
    category: "slip_trip_fall", severity: "minor", status: "closed",
    location: "Garden — near trampoline",
    description: "Alex tripped over the edge of the trampoline safety net while climbing off. Fell onto grass and grazed left knee.",
    injuryDetails: "Minor graze on left knee, approximately 2cm. No swelling or bruising.",
    firstAidGiven: true, firstAidBy: "staff_anna", firstAidDetails: "Cleaned wound with antiseptic wipe, applied plaster. Alex shown wound — consented to treatment.",
    medicalAttention: false, hospitalAttendance: false, hospitalName: null,
    parentCarerNotified: false, parentNotifiedTime: null, socialWorkerNotified: false,
    riddorReported: false, riddorRef: null,
    witnesses: ["staff_edward"], rootCause: "Safety net edge not flush with ground — gap created trip hazard.",
    preventiveMeasures: "Trampoline safety net re-secured. Staff briefed on checking trampoline before each use.",
    followUpDate: null, photographsTaken: false, bodyMapCompleted: true,
    signedOffBy: "staff_darren",
  },
  {
    id: "acc_2", date: d(-5), time: "12:20", reportedBy: "staff_ryan",
    personType: "child", personId: "yp_jordan", personName: "Jordan",
    category: "collision", severity: "moderate", status: "investigated",
    location: "Kitchen",
    description: "Jordan bumped head on open cupboard door at eye level while turning around from the sink. Cupboard door had been left open by another young person.",
    injuryDetails: "Bump to right temple area. Small raised lump (~1cm). No bleeding. Jordan reported brief dizziness lasting approx. 30 seconds.",
    firstAidGiven: true, firstAidBy: "staff_ryan", firstAidDetails: "Applied cold compress for 10 minutes. Head injury protocol followed — neuro obs conducted every 30 mins for 2 hours. All within normal limits.",
    medicalAttention: false, hospitalAttendance: false, hospitalName: null,
    parentCarerNotified: false, parentNotifiedTime: null, socialWorkerNotified: true,
    riddorReported: false, riddorRef: null,
    witnesses: ["staff_chervelle"], rootCause: "Kitchen cupboard doors left open. No slow-close hinges fitted.",
    preventiveMeasures: "Soft-close hinges ordered for all kitchen wall cupboards. Reminder to all YP about closing cupboards after use. Protective corner bumpers fitted as interim measure.",
    followUpDate: d(3), photographsTaken: true, bodyMapCompleted: true,
    signedOffBy: "staff_darren",
  },
  {
    id: "acc_3", date: d(-8), time: "22:10", reportedBy: "staff_lackson",
    personType: "child", personId: "yp_casey", personName: "Casey",
    category: "self_harm_injury", severity: "major", status: "closed",
    location: "Casey's bedroom",
    description: "During evening checks, Lackson noticed Casey had superficial scratches on left forearm. Casey disclosed they had used a hair clip to scratch themselves earlier in the evening. Casey calm and cooperative during disclosure.",
    injuryDetails: "Three superficial linear scratches on left forearm, each approximately 3-4cm long. Skin not broken. No bleeding.",
    firstAidGiven: true, firstAidBy: "staff_lackson", firstAidDetails: "Wound cleaned gently. Casey given choice of dressing — declined. Ice pack offered. Emotional support provided. 1:1 conversation about feelings.",
    medicalAttention: false, hospitalAttendance: false, hospitalName: null,
    parentCarerNotified: false, parentNotifiedTime: null, socialWorkerNotified: true,
    riddorReported: false, riddorRef: null,
    witnesses: [], rootCause: "Casey disclosed feeling anxious about upcoming contact visit with birth mother. Hair clip was personal item — not previously identified as risk.",
    preventiveMeasures: "CAMHS contacted next morning. Risk assessment updated. Hair accessories added to Casey's individual risk management plan for awareness (not restriction). Additional 1:1 key work session booked pre-contact visit.",
    followUpDate: d(-5), photographsTaken: false, bodyMapCompleted: true,
    signedOffBy: "staff_darren",
  },
  {
    id: "acc_4", date: d(-12), time: "09:30", reportedBy: "staff_darren",
    personType: "staff", personId: "staff_mirela", personName: "Mirela",
    category: "slip_trip_fall", severity: "moderate", status: "closed",
    location: "Staircase — top landing",
    description: "Mirela slipped on the top step of the main staircase while carrying laundry basket. Fell down 3 steps, landing on right side. Laundry basket broke fall partially.",
    injuryDetails: "Bruising to right hip and right wrist. Full range of movement maintained. No fracture suspected.",
    firstAidGiven: true, firstAidBy: "staff_darren", firstAidDetails: "Cold compress applied to hip and wrist. Mirela able to walk unaided. Advised to attend GP if pain worsens.",
    medicalAttention: true, hospitalAttendance: false, hospitalName: null,
    parentCarerNotified: false, parentNotifiedTime: null, socialWorkerNotified: false,
    riddorReported: false, riddorRef: null,
    witnesses: ["staff_anna"], rootCause: "Carpet gripper on top step had become slightly loose. Mirela was carrying laundry which obscured her view of the step edge.",
    preventiveMeasures: "Carpet gripper re-fixed immediately. All stair carpet grippers inspected — 2 more tightened. Anti-slip nosings ordered for all stairs. Staff reminded not to carry items that obstruct view on stairs.",
    followUpDate: d(-9), photographsTaken: true, bodyMapCompleted: false,
    signedOffBy: "staff_darren",
  },
  {
    id: "acc_5", date: d(-1), time: "16:15", reportedBy: "staff_edward",
    personType: "child", personId: "yp_alex", personName: "Alex",
    category: "sport_play", severity: "minor", status: "first_aid_given",
    location: "Back garden — football area",
    description: "Alex and Jordan playing football. Alex attempted a slide tackle and collided with Jordan's knee. Alex sustained impact to right shin.",
    injuryDetails: "Red mark and minor swelling to right shin. No bruising visible at time. Alex able to weight-bear and continue walking.",
    firstAidGiven: true, firstAidBy: "staff_edward", firstAidDetails: "Cold compress applied for 10 minutes. Arnica gel with consent. Alex returned to play after 20 minutes.",
    medicalAttention: false, hospitalAttendance: false, hospitalName: null,
    parentCarerNotified: false, parentNotifiedTime: null, socialWorkerNotified: false,
    riddorReported: false, riddorRef: null,
    witnesses: ["staff_chervelle", "yp_jordan"], rootCause: "Normal play activity. No unsafe behaviour identified.",
    preventiveMeasures: "Reminded both YP about safe tackling. Shin pads encouraged for future football sessions.",
    followUpDate: d(1), photographsTaken: false, bodyMapCompleted: true,
    signedOffBy: null,
  },
  {
    id: "acc_6", date: d(-20), time: "11:00", reportedBy: "staff_darren",
    personType: "visitor", personId: null, personName: "Karen Holding (Social Worker)",
    category: "slip_trip_fall", severity: "minor", status: "closed",
    location: "Front entrance — porch step",
    description: "Karen Holding (Alex's SW) slipped on wet porch step during visit. Caught herself on handrail. Right ankle twisted slightly.",
    injuryDetails: "Minor ankle twist. No swelling. Full weight-bearing. Karen declined further treatment.",
    firstAidGiven: false, firstAidBy: null, firstAidDetails: "",
    medicalAttention: false, hospitalAttendance: false, hospitalName: null,
    parentCarerNotified: false, parentNotifiedTime: null, socialWorkerNotified: false,
    riddorReported: false, riddorRef: null,
    witnesses: ["staff_darren"], rootCause: "Porch step wet from rain. No anti-slip surface fitted. Handrail present but grip section worn.",
    preventiveMeasures: "Anti-slip tread strips fitted to all external steps. Handrail grip replaced. Wet weather hazard now included in daily premises check.",
    followUpDate: null, photographsTaken: true, bodyMapCompleted: false,
    signedOffBy: "staff_darren",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function AccidentBookPage() {
  const [data] = useState(SEED);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPersonType, setFilterPersonType] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── derived ─────────────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterSeverity !== "all" && r.severity !== filterSeverity) return false;
      if (filterCategory !== "all" && r.category !== filterCategory) return false;
      if (filterPersonType !== "all" && r.personType !== filterPersonType) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.personName.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          CAT_LABEL[r.category].toLowerCase().includes(q)
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date.localeCompare(a.date);
        case "date-asc": return a.date.localeCompare(b.date);
        case "severity": {
          const sev = ["minor", "moderate", "major", "riddor_reportable"];
          return sev.indexOf(b.severity) - sev.indexOf(a.severity);
        }
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterSeverity, filterCategory, filterPersonType, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────────────── */

  const totalThisMonth = data.filter((r) => {
    const now = new Date();
    const rd = new Date(r.date);
    return rd.getMonth() === now.getMonth() && rd.getFullYear() === now.getFullYear();
  }).length;
  const openRecords = data.filter((r) => r.status !== "closed").length;
  const riddorCount = data.filter((r) => r.riddorReported).length;
  const childInjuries = data.filter((r) => r.personType === "child").length;
  const staffInjuries = data.filter((r) => r.personType === "staff").length;

  /* ── export ──────────────────────────────────────────────────────────────── */

  const exportCols: ExportColumn<AccidentRecord>[] = [
    { header: "Date", accessor: (r: AccidentRecord) => r.date },
    { header: "Time", accessor: (r: AccidentRecord) => r.time },
    { header: "Person", accessor: (r: AccidentRecord) => r.personName },
    { header: "Type", accessor: (r: AccidentRecord) => PERSON_TYPE_LABEL[r.personType] },
    { header: "Category", accessor: (r: AccidentRecord) => CAT_LABEL[r.category] },
    { header: "Severity", accessor: (r: AccidentRecord) => SEVERITY_LABEL[r.severity] },
    { header: "Location", accessor: (r: AccidentRecord) => r.location },
    { header: "Description", accessor: (r: AccidentRecord) => r.description },
    { header: "Injury Details", accessor: (r: AccidentRecord) => r.injuryDetails },
    { header: "First Aid", accessor: (r: AccidentRecord) => r.firstAidGiven ? "Yes" : "No" },
    { header: "First Aid By", accessor: (r: AccidentRecord) => r.firstAidBy ? getStaffName(r.firstAidBy) : "" },
    { header: "Medical Attention", accessor: (r: AccidentRecord) => r.medicalAttention ? "Yes" : "No" },
    { header: "Hospital", accessor: (r: AccidentRecord) => r.hospitalAttendance ? "Yes" : "No" },
    { header: "RIDDOR", accessor: (r: AccidentRecord) => r.riddorReported ? `Yes (${r.riddorRef})` : "No" },
    { header: "Status", accessor: (r: AccidentRecord) => STATUS_LABEL[r.status] },
    { header: "Root Cause", accessor: (r: AccidentRecord) => r.rootCause },
    { header: "Preventive Measures", accessor: (r: AccidentRecord) => r.preventiveMeasures },
    { header: "Reported By", accessor: (r: AccidentRecord) => getStaffName(r.reportedBy) },
    { header: "Signed Off", accessor: (r: AccidentRecord) => r.signedOffBy ? getStaffName(r.signedOffBy) : "Pending" },
  ];

  /* ── render ──────────────────────────────────────────────────────────────── */

  return (
    <PageShell
      title="Accident Book"
      subtitle="Health & Safety at Work Act 1974 · RIDDOR 2013 · Reg 12"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Accident Book" />
          <ExportButton data={filtered} columns={exportCols} filename="accident-book" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Record Accident</Button>
        </div>
      }
    >
      <div id="print-area">
        {/* ── stat strip ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Records", value: data.length, icon: HardHat, clr: "text-blue-600" },
            { label: "This Month", value: totalThisMonth, icon: Clock, clr: "text-indigo-600" },
            { label: "Open / In Progress", value: openRecords, icon: AlertTriangle, clr: "text-amber-600" },
            { label: "Child Injuries", value: childInjuries, icon: ShieldAlert, clr: "text-rose-600" },
            { label: "Staff Injuries", value: staffInjuries, icon: Stethoscope, clr: "text-purple-600" },
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

        {/* ── RIDDOR alert ─────────────────────────────────────────────────── */}
        {riddorCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">{riddorCount} RIDDOR-reportable accident(s)</p>
              <p className="text-red-700">These must be reported to HSE within 10 days of the incident.</p>
            </div>
          </div>
        )}

        {/* ── open records alert ────────────────────────────────────────────── */}
        {openRecords > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{openRecords} record(s) still open</p>
              <p className="text-amber-700">All accident records must be investigated and signed off by the Registered Manager.</p>
            </div>
          </div>
        )}

        {/* ── filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search person, description, location…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}><SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Severity</SelectItem>{(Object.keys(SEVERITY_LABEL) as Severity[]).map((k) => (<SelectItem key={k} value={k}>{SEVERITY_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}><SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{(Object.keys(CAT_LABEL) as AccidentCategory[]).map((k) => (<SelectItem key={k} value={k}>{CAT_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterPersonType} onValueChange={setFilterPersonType}><SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All People</SelectItem>{(Object.keys(PERSON_TYPE_LABEL) as PersonType[]).map((k) => (<SelectItem key={k} value={k}>{PERSON_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date-desc">Newest First</SelectItem><SelectItem value="date-asc">Oldest First</SelectItem><SelectItem value="severity">By Severity</SelectItem></SelectContent></Select>
        </div>

        {/* ── records ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_SEV[r.severity])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {r.personName}
                        <Badge variant="outline" className={SEVERITY_CLR[r.severity]}>{SEVERITY_LABEL[r.severity]}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                        <Badge variant="outline">{PERSON_TYPE_LABEL[r.personType]}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{CAT_LABEL[r.category]} · {r.location} · {r.date} at {r.time}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium mb-1">Description</p>
                        <p className="text-muted-foreground">{r.description}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Injury Details</p>
                        <p className="text-muted-foreground">{r.injuryDetails}</p>
                      </div>
                    </div>

                    {/* first aid */}
                    {r.firstAidGiven && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="font-medium text-green-800 mb-1">First Aid Administered</p>
                        <p className="text-green-700 text-xs">By: {r.firstAidBy ? getStaffName(r.firstAidBy) : "N/A"}</p>
                        <p className="text-green-700 text-xs mt-1">{r.firstAidDetails}</p>
                      </div>
                    )}

                    {/* notifications */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Medical Attention</p>
                        <p className="text-xs text-muted-foreground">{r.medicalAttention ? "Yes" : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Hospital</p>
                        <p className="text-xs text-muted-foreground">{r.hospitalAttendance ? r.hospitalName || "Yes" : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">SW Notified</p>
                        <p className="text-xs text-muted-foreground">{r.socialWorkerNotified ? "Yes" : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">RIDDOR Reported</p>
                        <p className="text-xs text-muted-foreground">{r.riddorReported ? `Yes — ${r.riddorRef}` : "No"}</p>
                      </div>
                    </div>

                    {/* body map / photos */}
                    <div className="flex gap-4 text-xs">
                      {r.bodyMapCompleted && <Badge variant="outline" className="bg-blue-50">Body Map Completed</Badge>}
                      {r.photographsTaken && <Badge variant="outline" className="bg-purple-50">Photographs Taken</Badge>}
                      {r.witnesses.length > 0 && <span className="text-muted-foreground">Witnesses: {r.witnesses.map((w) => w.startsWith("staff_") ? getStaffName(w) : w.startsWith("yp_") ? getYPName(w) : w).join(", ")}</span>}
                    </div>

                    {/* root cause & prevention */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium mb-1">Root Cause Analysis</p>
                        <p className="text-muted-foreground">{r.rootCause}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Preventive Measures</p>
                        <p className="text-muted-foreground">{r.preventiveMeasures}</p>
                      </div>
                    </div>

                    {/* footer */}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Reported by: {getStaffName(r.reportedBy)}</span>
                      {r.followUpDate && <span>Follow-up: {r.followUpDate}</span>}
                      <span>{r.signedOffBy ? `Signed off: ${getStaffName(r.signedOffBy)}` : "⚠ Awaiting sign-off"}</span>
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
          <p>Health & Safety at Work Act 1974 — duty to record all workplace accidents. RIDDOR 2013 — specified injuries, dangerous occurrences and over-7-day incapacitation must be reported to HSE. Children&apos;s Homes (England) Regulations 2015, Reg 12 — protection of children, keeping the home safe. All accident records retained for minimum 3 years (21 years if involving a child under 18 at time of incident).</p>
        </div>
      </div>

      {/* ── new entry dialog ───────────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Accident / Injury</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date</Label><Input type="date" /></div>
            <div><Label>Time</Label><Input type="time" /></div>
            <div><Label>Person Injured</Label><Input placeholder="Name" /></div>
            <div><Label>Person Type</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(PERSON_TYPE_LABEL) as PersonType[]).map((k) => (<SelectItem key={k} value={k}>{PERSON_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Category</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(CAT_LABEL) as AccidentCategory[]).map((k) => (<SelectItem key={k} value={k}>{CAT_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Severity</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(SEVERITY_LABEL) as Severity[]).map((k) => (<SelectItem key={k} value={k}>{SEVERITY_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Location</Label><Input placeholder="Where the accident happened" /></div>
            <div className="col-span-2"><Label>Description</Label><Textarea placeholder="What happened…" rows={3} /></div>
            <div className="col-span-2"><Label>Injury Details</Label><Textarea placeholder="Describe the injury…" rows={2} /></div>
            <div className="col-span-2"><Label>First Aid Given</Label><Textarea placeholder="First aid details…" rows={2} /></div>
            <div className="col-span-2"><Label>Root Cause</Label><Textarea placeholder="What caused the accident?" rows={2} /></div>
            <div className="col-span-2"><Label>Preventive Measures</Label><Textarea placeholder="Actions to prevent recurrence…" rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={() => setShowNew(false)}>Save Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}