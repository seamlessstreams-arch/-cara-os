"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, ChevronDown, ChevronUp, ArrowUpDown, AlertTriangle, CheckCircle2,
  Clock, Search, Users, UserCheck, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type VettingStatus = "fully_vetted" | "partially_vetted" | "pending" | "expired";
type BookingReason = "sickness_cover" | "vacancy_cover" | "annual_leave" | "training_cover" | "additional_support" | "emergency";

interface AgencyStaffRecord {
  id: string;
  agencyName: string;
  workerName: string;
  workerRef: string;
  dateOfShift: string;
  shiftType: string;
  shiftHours: number;
  bookingReason: BookingReason;
  coveringForId: string | null;
  vettingStatus: VettingStatus;
  dbsNumber: string;
  dbsDate: string;
  dbsEnhanced: boolean;
  inductionCompleted: boolean;
  inductionDate: string | null;
  inductionBy: string | null;
  safeguardingBriefing: boolean;
  youngPeopleBriefing: boolean;
  medicationTrained: boolean;
  priceTrainedLevel: string | null;
  feedbackScore: number | null;
  feedbackNotes: string;
  concerns: string;
  authorisedById: string;
  costPerHour: number;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const VETTING_LABEL: Record<VettingStatus, string> = { fully_vetted: "Fully Vetted", partially_vetted: "Partially Vetted", pending: "Pending", expired: "Expired" };
const VETTING_CLR: Record<VettingStatus, string> = { fully_vetted: "bg-green-100 text-green-800", partially_vetted: "bg-amber-100 text-amber-800", pending: "bg-red-100 text-red-800", expired: "bg-red-200 text-red-900" };
const VETTING_BORDER: Record<VettingStatus, string> = { fully_vetted: "border-l-green-400", partially_vetted: "border-l-amber-400", pending: "border-l-red-500", expired: "border-l-red-700" };

const REASON_LABEL: Record<BookingReason, string> = {
  sickness_cover: "Sickness Cover", vacancy_cover: "Vacancy Cover", annual_leave: "Annual Leave Cover",
  training_cover: "Training Cover", additional_support: "Additional Support", emergency: "Emergency Cover",
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: AgencyStaffRecord[] = [
  {
    id: "ag_001", agencyName: "CareStaff Solutions", workerName: "Marcus Thompson", workerRef: "CSS-4821",
    dateOfShift: d(-2), shiftType: "Day Shift (08:00–20:00)", shiftHours: 12,
    bookingReason: "sickness_cover", coveringForId: "staff_edward",
    vettingStatus: "fully_vetted", dbsNumber: "DBS-001-29384756", dbsDate: d(-120), dbsEnhanced: true,
    inductionCompleted: true, inductionDate: d(-90), inductionBy: "staff_darren",
    safeguardingBriefing: true, youngPeopleBriefing: true, medicationTrained: false,
    priceTrainedLevel: "Level 2 PRICE", feedbackScore: 4,
    feedbackNotes: "Marcus worked well. Good rapport with Alex and Jordan. Followed daily routines competently. Handover notes were clear and detailed. Would request again.",
    concerns: "", authorisedById: "staff_darren", costPerHour: 18.50,
    notes: "Marcus has worked at Oak House 6 times previously. Familiar with YP, routines, and layout. Edward was off sick (gastro). Marcus arrived on time and was briefed by Ryan before shift. No incidents during shift.",
  },
  {
    id: "ag_002", agencyName: "CareStaff Solutions", workerName: "Marcus Thompson", workerRef: "CSS-4821",
    dateOfShift: d(-1), shiftType: "Day Shift (08:00–20:00)", shiftHours: 12,
    bookingReason: "sickness_cover", coveringForId: "staff_edward",
    vettingStatus: "fully_vetted", dbsNumber: "DBS-001-29384756", dbsDate: d(-120), dbsEnhanced: true,
    inductionCompleted: true, inductionDate: d(-90), inductionBy: "staff_darren",
    safeguardingBriefing: true, youngPeopleBriefing: true, medicationTrained: false,
    priceTrainedLevel: "Level 2 PRICE", feedbackScore: 4,
    feedbackNotes: "Second consecutive day covering for Edward. Consistent performance. Casey was slightly dysregulated in the afternoon — Marcus followed the BSP appropriately and de-escalated well.",
    concerns: "", authorisedById: "staff_darren", costPerHour: 18.50,
    notes: "Continuation of Edward's sickness cover. Marcus managed Casey's afternoon dysregulation by offering space, validating feelings, and redirecting to art activities. Good communication with Anna throughout.",
  },
  {
    id: "ag_003", agencyName: "NightOwl Staffing", workerName: "Priya Patel", workerRef: "NOS-7712",
    dateOfShift: d(-7), shiftType: "Waking Night (20:00–08:00)", shiftHours: 12,
    bookingReason: "annual_leave", coveringForId: "staff_lackson",
    vettingStatus: "fully_vetted", dbsNumber: "DBS-003-84927361", dbsDate: d(-200), dbsEnhanced: true,
    inductionCompleted: true, inductionDate: d(-180), inductionBy: "staff_ryan",
    safeguardingBriefing: true, youngPeopleBriefing: true, medicationTrained: true,
    priceTrainedLevel: "Level 2 PRICE", feedbackScore: 5,
    feedbackNotes: "Excellent. Priya is our preferred waking night agency worker. Thorough night checks, detailed handover, and proactively completed cleaning tasks. Casey had a restless night — Priya sat outside her room and offered reassurance without intruding.",
    concerns: "", authorisedById: "staff_ryan", costPerHour: 19.00,
    notes: "Lackson on annual leave. Priya has completed 15+ waking nights at Oak House. She knows the night routines, medication protocols, and individual check frequencies for each YP. Casey was restless (11pm–1am) — Priya followed the night support plan and logged all checks. Handover to morning staff was detailed and accurate.",
  },
  {
    id: "ag_004", agencyName: "Premier Care Agency", workerName: "Daniel Okafor", workerRef: "PCA-3345",
    dateOfShift: d(-14), shiftType: "Day Shift (08:00–20:00)", shiftHours: 12,
    bookingReason: "training_cover", coveringForId: null,
    vettingStatus: "partially_vetted", dbsNumber: "DBS-004-11928374", dbsDate: d(-60), dbsEnhanced: true,
    inductionCompleted: true, inductionDate: d(-14), inductionBy: "staff_ryan",
    safeguardingBriefing: true, youngPeopleBriefing: true, medicationTrained: false,
    priceTrainedLevel: null, feedbackScore: 2,
    feedbackNotes: "Daniel was polite but lacked confidence in a children's home setting. He required significant direction throughout the shift. Did not initiate activities with YP and spent time on his phone during quiet periods. Would not request again unless no alternatives available.",
    concerns: "Seen using personal phone during shift despite being told about the phone policy. Reminded twice by Ryan. Left the kitchen without cleaning up after preparing lunch.",
    authorisedById: "staff_darren", costPerHour: 17.00,
    notes: "Daniel was new to Oak House — first booking from Premier Care Agency. Full induction completed by Ryan on arrival. Daniel is a newly qualified care worker with limited children's home experience. Despite briefing, he seemed unsure of expectations around engagement and proactive care. Two concerns logged: phone use and kitchen cleanliness. Feedback shared with agency. Partially vetted — 2 references received but training matrix incomplete (no PRICE, no medication).",
  },
  {
    id: "ag_005", agencyName: "CareStaff Solutions", workerName: "Aisha Bello", workerRef: "CSS-5590",
    dateOfShift: d(1), shiftType: "Day Shift (08:00–20:00)", shiftHours: 12,
    bookingReason: "vacancy_cover", coveringForId: null,
    vettingStatus: "fully_vetted", dbsNumber: "DBS-005-66738291", dbsDate: d(-45), dbsEnhanced: true,
    inductionCompleted: true, inductionDate: d(-30), inductionBy: "staff_darren",
    safeguardingBriefing: true, youngPeopleBriefing: true, medicationTrained: true,
    priceTrainedLevel: "Level 3 PRICE", feedbackScore: null,
    feedbackNotes: "",
    concerns: "", authorisedById: "staff_darren", costPerHour: 18.50,
    notes: "Aisha is booked for tomorrow to cover ongoing vacancy gap while recruitment is progressed. Aisha has 5 years children's home experience and has worked at Oak House 3 times previously. Fully vetted, PRICE L3 trained, medication competent. Preferred agency worker alongside Marcus and Priya.",
  },
  {
    id: "ag_006", agencyName: "NightOwl Staffing", workerName: "James Whitfield", workerRef: "NOS-8834",
    dateOfShift: d(-21), shiftType: "Waking Night (20:00–08:00)", shiftHours: 12,
    bookingReason: "emergency", coveringForId: "staff_lackson",
    vettingStatus: "fully_vetted", dbsNumber: "DBS-006-44582910", dbsDate: d(-300), dbsEnhanced: true,
    inductionCompleted: false, inductionDate: null, inductionBy: null,
    safeguardingBriefing: true, youngPeopleBriefing: true, medicationTrained: false,
    priceTrainedLevel: "Level 1 PRICE", feedbackScore: 3,
    feedbackNotes: "James was adequate for emergency cover. He completed night checks as directed but his notes were brief. Safeguarding briefing completed verbally by Ryan at handover. No incidents but limited engagement. Full induction to be completed if booked again.",
    concerns: "Full induction not completed due to emergency booking (Lackson called in sick at 19:30). Verbal briefing only. James must complete full induction before any future booking.",
    authorisedById: "staff_ryan", costPerHour: 19.00,
    notes: "Emergency booking — Lackson called in sick 30 minutes before waking night shift. James was the only available worker from NightOwl at short notice. Ryan completed a verbal safeguarding and YP briefing during handover (documented). James was paired with Ryan who stayed for the first 2 hours to support. No incidents overnight. Full induction flagged as required before any future booking.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function AgencyStaffLogPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterVetting, setFilterVetting] = useState("all");
  const [filterReason, setFilterReason] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.workerName.toLowerCase().includes(q) ||
        r.agencyName.toLowerCase().includes(q) ||
        r.workerRef.toLowerCase().includes(q)
      );
    }
    if (filterVetting !== "all") rows = rows.filter((r) => r.vettingStatus === filterVetting);
    if (filterReason !== "all") rows = rows.filter((r) => r.bookingReason === filterReason);
    rows.sort((a, b) => sortBy === "newest" ? b.dateOfShift.localeCompare(a.dateOfShift) : a.dateOfShift.localeCompare(b.dateOfShift));
    return rows;
  }, [data, search, filterVetting, filterReason, sortBy]);

  const totalShifts = data.length;
  const totalHours = data.reduce((s, r) => s + r.shiftHours, 0);
  const totalCost = data.reduce((s, r) => s + (r.shiftHours * r.costPerHour), 0);
  const withConcerns = data.filter((r) => r.concerns.length > 0).length;
  const uniqueWorkers = new Set(data.map((r) => r.workerRef)).size;

  const exportCols: ExportColumn<AgencyStaffRecord>[] = [
    { header: "Date", accessor: (r: AgencyStaffRecord) => r.dateOfShift },
    { header: "Worker", accessor: (r: AgencyStaffRecord) => r.workerName },
    { header: "Ref", accessor: (r: AgencyStaffRecord) => r.workerRef },
    { header: "Agency", accessor: (r: AgencyStaffRecord) => r.agencyName },
    { header: "Shift", accessor: (r: AgencyStaffRecord) => r.shiftType },
    { header: "Hours", accessor: (r: AgencyStaffRecord) => String(r.shiftHours) },
    { header: "Reason", accessor: (r: AgencyStaffRecord) => REASON_LABEL[r.bookingReason] },
    { header: "Vetting", accessor: (r: AgencyStaffRecord) => VETTING_LABEL[r.vettingStatus] },
    { header: "Induction", accessor: (r: AgencyStaffRecord) => r.inductionCompleted ? "Yes" : "No" },
    { header: "Score", accessor: (r: AgencyStaffRecord) => r.feedbackScore !== null ? `${r.feedbackScore}/5` : "N/A" },
    { header: "Cost/hr", accessor: (r: AgencyStaffRecord) => `£${r.costPerHour.toFixed(2)}` },
  ];

  return (
    <PageShell
      title="Agency Staff Log"
      subtitle="Reg 32 · Fitness of Workers · Safer Recruitment · Agency Vetting"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Agency Staff Log" />
          <ExportButton data={data} columns={exportCols} filename="agency-staff-log" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Log Agency Shift</Button>
        </div>
      }
    >
      <div id="print-area">
        {/* stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Shifts", value: totalShifts, icon: Users, clr: "text-blue-600" },
            { label: "Total Hours", value: totalHours, icon: Clock, clr: "text-amber-600" },
            { label: "Unique Workers", value: uniqueWorkers, icon: UserCheck, clr: "text-purple-600" },
            { label: "With Concerns", value: withConcerns, icon: AlertTriangle, clr: "text-red-600" },
            { label: "Total Cost", value: `£${totalCost.toFixed(0)}`, icon: Shield, clr: "text-green-600" },
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

        {/* filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search workers, agencies..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterVetting} onValueChange={setFilterVetting}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Vetting" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vetting</SelectItem>
              {(Object.entries(VETTING_LABEL) as [VettingStatus, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterReason} onValueChange={setFilterReason}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Reason" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              {(Object.entries(REASON_LABEL) as [BookingReason, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}>
            <ArrowUpDown className="h-4 w-4 mr-1" />{sortBy === "newest" ? "Newest" : "Oldest"}
          </Button>
        </div>

        {/* concerns alert */}
        {withConcerns > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{withConcerns} shift(s) with concerns recorded</p>
              <p className="text-amber-700">All concerns about agency staff must be fed back to the supplying agency in writing. Concerns about safeguarding must be escalated to the LADO. Persistent concerns should result in the worker being removed from the preferred list.</p>
            </div>
          </div>
        )}

        {/* shift cards */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", VETTING_BORDER[r.vettingStatus])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {r.workerName} ({r.workerRef})
                        <Badge variant="outline" className={VETTING_CLR[r.vettingStatus]}>{VETTING_LABEL[r.vettingStatus]}</Badge>
                        <Badge variant="outline" className="bg-muted/50">{REASON_LABEL[r.bookingReason]}</Badge>
                        {r.concerns && <Badge variant="outline" className="bg-red-100 text-red-800">Concern</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.agencyName} · {r.dateOfShift} · {r.shiftType} · {r.shiftHours}hrs
                        {r.coveringForId && ` · Covering: ${getStaffName(r.coveringForId)}`}
                        {" "}· Auth: {getStaffName(r.authorisedById)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.feedbackScore !== null && (
                        <Badge variant="outline" className={cn(
                          r.feedbackScore >= 4 ? "bg-green-100 text-green-800" :
                          r.feedbackScore >= 3 ? "bg-amber-100 text-amber-800" :
                          "bg-red-100 text-red-800"
                        )}>{r.feedbackScore}/5</Badge>
                      )}
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* compliance checklist */}
                    <div>
                      <p className="font-medium mb-1">Compliance Checklist</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { label: "DBS Enhanced", ok: r.dbsEnhanced },
                          { label: "Induction", ok: r.inductionCompleted },
                          { label: "Safeguarding Brief", ok: r.safeguardingBriefing },
                          { label: "YP Briefing", ok: r.youngPeopleBriefing },
                          { label: "Medication Trained", ok: r.medicationTrained },
                          { label: "PRICE Trained", ok: !!r.priceTrainedLevel },
                        ].map((c) => (
                          <div key={c.label} className="flex items-center gap-1.5 text-xs">
                            {c.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                            <span className={c.ok ? "" : "text-red-700 font-medium"}>{c.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* DBS details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">DBS Number</p>
                        <p className="text-xs font-bold">{r.dbsNumber}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">DBS Date</p>
                        <p className="text-xs font-bold">{r.dbsDate}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">PRICE Level</p>
                        <p className="text-xs font-bold">{r.priceTrainedLevel || "None"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Cost/Hour</p>
                        <p className="text-xs font-bold">£{r.costPerHour.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* induction */}
                    {r.inductionCompleted && r.inductionDate && r.inductionBy && (
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <p className="text-xs"><span className="font-medium text-green-800">Induction completed:</span> <span className="text-green-700">{r.inductionDate} by {getStaffName(r.inductionBy)}</span></p>
                      </div>
                    )}
                    {!r.inductionCompleted && (
                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <p className="text-xs font-medium text-red-800">⚠ Full induction NOT completed — verbal briefing only</p>
                      </div>
                    )}

                    {/* feedback */}
                    {r.feedbackNotes && (
                      <div>
                        <p className="font-medium mb-1">Shift Feedback</p>
                        <p className="text-muted-foreground text-xs">{r.feedbackNotes}</p>
                      </div>
                    )}

                    {/* concerns */}
                    {r.concerns && (
                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <p className="font-medium text-xs text-red-800 mb-1">Concerns</p>
                        <p className="text-xs text-red-700">{r.concerns}</p>
                      </div>
                    )}

                    {/* notes */}
                    <div><p className="font-medium mb-1">Notes</p><p className="text-muted-foreground text-xs">{r.notes}</p></div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Children&apos;s Homes (England) Regulations 2015, Reg 32 — the registered person must ensure that all persons working at the home (including agency staff) are of integrity and good character, have the qualifications, skills, and experience necessary, and are physically and mentally fit. Agency workers must have enhanced DBS checks, receive a local induction (including safeguarding, YP profiles, emergency procedures), and be briefed on behaviour support plans. The home must maintain records of all agency usage, including vetting checks, induction records, and any concerns. Agency use should be minimised and monitored via Reg 44/45 reporting.</p>
        </div>
      </div>

      {/* new shift dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Agency Shift</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Agency Name</Label><Input placeholder="e.g. CareStaff Solutions" /></div>
            <div><Label>Worker Name</Label><Input placeholder="Full name" /></div>
            <div><Label>Worker Reference</Label><Input placeholder="e.g. CSS-4821" /></div>
            <div><Label>Date of Shift</Label><Input type="date" /></div>
            <div>
              <Label>Shift Type</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day Shift (08:00–20:00)</SelectItem>
                  <SelectItem value="night">Waking Night (20:00–08:00)</SelectItem>
                  <SelectItem value="short">Short Shift (08:00–14:00)</SelectItem>
                  <SelectItem value="late">Late Shift (14:00–22:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Booking Reason</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(REASON_LABEL) as [BookingReason, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>DBS Number</Label><Input placeholder="DBS reference" /></div>
            <div><Label>Notes</Label><Textarea placeholder="Shift notes, feedback..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={() => setShowNew(false)}>Log Shift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
