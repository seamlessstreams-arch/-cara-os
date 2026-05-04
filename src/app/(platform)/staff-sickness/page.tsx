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
  Clock, Search, UserMinus, Calendar, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type SicknessCategory = "short_term" | "long_term" | "intermittent" | "work_related";
type AbsenceReason = "cold_flu" | "gastro" | "covid" | "mental_health" | "musculoskeletal" | "surgery" | "family_emergency" | "injury" | "migraine" | "other";
type RTWStatus = "not_required" | "scheduled" | "completed" | "overdue";

interface SicknessRecord {
  id: string;
  staffId: string;
  dateStarted: string;
  dateEnded: string | null;
  totalDays: number;
  category: SicknessCategory;
  reason: AbsenceReason;
  reasonDetail: string;
  selfCertified: boolean;
  fitNote: boolean;
  fitNoteExpiry: string | null;
  coverArrangements: string;
  rtwStatus: RTWStatus;
  rtwDate: string | null;
  rtwConductedById: string | null;
  rtwOutcome: string;
  occupationalHealthReferral: boolean;
  triggerPoints: string[];
  managerNotes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const CAT_LABEL: Record<SicknessCategory, string> = { short_term: "Short-Term (≤7 days)", long_term: "Long-Term (>7 days)", intermittent: "Intermittent", work_related: "Work-Related" };
const CAT_CLR: Record<SicknessCategory, string> = { short_term: "bg-blue-100 text-blue-800", long_term: "bg-red-100 text-red-800", intermittent: "bg-amber-100 text-amber-800", work_related: "bg-purple-100 text-purple-800" };

const REASON_LABEL: Record<AbsenceReason, string> = {
  cold_flu: "Cold / Flu", gastro: "Gastroenteritis", covid: "COVID-19",
  mental_health: "Mental Health", musculoskeletal: "Musculoskeletal", surgery: "Surgery/Procedure",
  family_emergency: "Family Emergency", injury: "Injury", migraine: "Migraine/Headache", other: "Other",
};

const RTW_LABEL: Record<RTWStatus, string> = { not_required: "Not Required", scheduled: "Scheduled", completed: "Completed", overdue: "Overdue" };
const RTW_CLR: Record<RTWStatus, string> = { not_required: "bg-slate-100 text-slate-700", scheduled: "bg-blue-100 text-blue-800", completed: "bg-green-100 text-green-800", overdue: "bg-red-100 text-red-800" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: SicknessRecord[] = [
  {
    id: "sick_001", staffId: "staff_edward", dateStarted: d(-5), dateEnded: d(-2), totalDays: 3,
    category: "short_term", reason: "gastro", reasonDetail: "Vomiting and diarrhoea — 48-hour rule applied before return to work.",
    selfCertified: true, fitNote: false, fitNoteExpiry: null,
    coverArrangements: "Day 1 & 2: Marcus Thompson (CareStaff Solutions agency). Day 3: Ryan covered with overtime. All shifts filled — no gap in care.",
    rtwStatus: "completed", rtwDate: d(-1), rtwConductedById: "staff_darren",
    rtwOutcome: "Edward confirmed symptoms fully resolved. 48 hours symptom-free before returning. No ongoing concerns. Discussed hand hygiene re-awareness. RTW form completed and filed.",
    occupationalHealthReferral: false,
    triggerPoints: [],
    managerNotes: "Edward's third sickness absence this year (previous: 1 day cold in Jan, 2 days back pain in March). Total: 6 days in 5 months. Approaching Bradford Factor trigger point. Discussed pattern in RTW — no underlying concerns identified. Edward is aware of the trigger threshold.",
  },
  {
    id: "sick_002", staffId: "staff_lackson", dateStarted: d(-21), dateEnded: d(-21), totalDays: 1,
    category: "short_term", reason: "migraine",
    reasonDetail: "Called in at 19:30 (30 mins before waking night shift). Severe migraine with visual disturbance. Unable to work safely.",
    selfCertified: true, fitNote: false, fitNoteExpiry: null,
    coverArrangements: "Emergency agency cover arranged — James Whitfield (NightOwl Staffing). Ryan attended for first 2 hours to brief and support.",
    rtwStatus: "completed", rtwDate: d(-20), rtwConductedById: "staff_ryan",
    rtwOutcome: "Lackson confirmed migraine resolved. Has a history of occasional migraines (1-2 per year). GP aware. No referral needed. Discussed late notice — Lackson acknowledged difficulty but explained sudden onset. No disciplinary concern.",
    occupationalHealthReferral: false,
    triggerPoints: [],
    managerNotes: "First sickness absence for Lackson this year. Late call-off required emergency agency cover. Lackson was apologetic and understanding of the impact. Ryan conducted RTW sensitively. No pattern of concern. Lackson's GP manages his migraines with preventive medication.",
  },
  {
    id: "sick_003", staffId: "staff_anna", dateStarted: d(-90), dateEnded: d(-76), totalDays: 14,
    category: "long_term", reason: "mental_health",
    reasonDetail: "Stress and anxiety related to workload and emotional impact of Casey's LADO referral. GP recommended 2 weeks off with phased return.",
    selfCertified: false, fitNote: true, fitNoteExpiry: d(-76),
    coverArrangements: "Anna's key working sessions redistributed to Chervelle and Ryan. Agency cover used for 6 of the 14 shifts. Remaining shifts covered by existing team with adjusted rota.",
    rtwStatus: "completed", rtwDate: d(-75), rtwConductedById: "staff_darren",
    rtwOutcome: "Phased return plan agreed: Week 1 — 3 shifts (no waking nights), Week 2 — 4 shifts (regular pattern), Week 3 onwards — full duties. Anna reported feeling much better. Counselling arranged through employee assistance programme (6 sessions). Clinical supervision frequency increased to fortnightly for 2 months. Key working for Casey transferred to Chervelle during phased return.",
    occupationalHealthReferral: true,
    triggerPoints: ["Occupational health referral completed", "Counselling provision confirmed"],
    managerNotes: "Anna's absence was directly linked to the emotional impact of the LADO referral (allegation against her). This was a significant contributor to her stress alongside general workload. The allegation was subsequently found to be unsubstantiated but the process was understandably distressing. Anna was well-supported throughout — regular welfare calls during absence, no pressure to return early. Phased return worked well. Anna is now back to full duties and engaging well in clinical supervision. EAP counselling ongoing.",
  },
  {
    id: "sick_004", staffId: "staff_ryan", dateStarted: d(-45), dateEnded: d(-44), totalDays: 2,
    category: "short_term", reason: "cold_flu",
    reasonDetail: "Heavy cold with fever. GP advised rest and fluids. Not COVID (negative LFT).",
    selfCertified: true, fitNote: false, fitNoteExpiry: null,
    coverArrangements: "Day 1: Darren covered Ryan's deputy duties. Day 2: Chervelle led the shift with agency support (Marcus Thompson). No supervision sessions needed rescheduling.",
    rtwStatus: "completed", rtwDate: d(-43), rtwConductedById: "staff_darren",
    rtwOutcome: "Ryan confirmed symptoms resolved. LFT negative on both days. No ongoing issues. RTW brief and straightforward.",
    occupationalHealthReferral: false,
    triggerPoints: [],
    managerNotes: "Ryan's first sickness absence in 14 months. No concerns about pattern. Ryan is reliable and the absence was genuine. Cover arrangements worked smoothly.",
  },
  {
    id: "sick_005", staffId: "staff_mirela", dateStarted: d(-10), dateEnded: d(-8), totalDays: 2,
    category: "short_term", reason: "injury",
    reasonDetail: "Twisted ankle during commute to work (fell on icy pavement). Attended A&E — X-ray confirmed soft tissue injury, no fracture. Advised rest for 48 hours.",
    selfCertified: true, fitNote: false, fitNoteExpiry: null,
    coverArrangements: "Both shifts covered by existing team (Chervelle and Edward with adjusted rotas). No agency required.",
    rtwStatus: "completed", rtwDate: d(-7), rtwConductedById: "staff_ryan",
    rtwOutcome: "Mirela confirmed ankle significantly improved. Wearing supportive boot for 1 week. Can mobilise around the home. Agreed to avoid any activities requiring running/stairs for first week back. Workplace risk assessment completed — no adaptation needed beyond phased physical activity.",
    occupationalHealthReferral: false,
    triggerPoints: [],
    managerNotes: "Mirela is still in probation — first sickness absence. Injury was clearly accidental and not work-related. A&E documentation provided. Mirela was keen to return as soon as possible. Ryan conducted RTW with compassion and ensured Mirela wasn't pushing herself too hard during recovery. No concerns.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function StaffSicknessPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterRTW, setFilterRTW] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        getStaffName(r.staffId).toLowerCase().includes(q) ||
        REASON_LABEL[r.reason].toLowerCase().includes(q)
      );
    }
    if (filterCategory !== "all") rows = rows.filter((r) => r.category === filterCategory);
    if (filterRTW !== "all") rows = rows.filter((r) => r.rtwStatus === filterRTW);
    rows.sort((a, b) => sortBy === "newest" ? b.dateStarted.localeCompare(a.dateStarted) : a.dateStarted.localeCompare(b.dateStarted));
    return rows;
  }, [data, search, filterCategory, filterRTW, sortBy]);

  const totalAbsences = data.length;
  const totalDays = data.reduce((s, r) => s + r.totalDays, 0);
  const currentlyOff = data.filter((r) => r.dateEnded === null).length;
  const rtwOverdue = data.filter((r) => r.rtwStatus === "overdue").length;

  const exportCols: ExportColumn<SicknessRecord>[] = [
    { header: "Staff", accessor: (r: SicknessRecord) => getStaffName(r.staffId) },
    { header: "Start", accessor: (r: SicknessRecord) => r.dateStarted },
    { header: "End", accessor: (r: SicknessRecord) => r.dateEnded || "Ongoing" },
    { header: "Days", accessor: (r: SicknessRecord) => String(r.totalDays) },
    { header: "Category", accessor: (r: SicknessRecord) => CAT_LABEL[r.category] },
    { header: "Reason", accessor: (r: SicknessRecord) => REASON_LABEL[r.reason] },
    { header: "Fit Note", accessor: (r: SicknessRecord) => r.fitNote ? "Yes" : "No" },
    { header: "RTW Status", accessor: (r: SicknessRecord) => RTW_LABEL[r.rtwStatus] },
    { header: "OH Referral", accessor: (r: SicknessRecord) => r.occupationalHealthReferral ? "Yes" : "No" },
  ];

  return (
    <PageShell
      title="Staff Sickness & Return to Work"
      subtitle="Absence Management · Wellbeing · Workforce Planning"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Sickness Record" />
          <ExportButton data={data} columns={exportCols} filename="staff-sickness" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Log Absence</Button>
        </div>
      }
    >
      <div id="print-area">
        {/* stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Absences (Year)", value: totalAbsences, icon: UserMinus, clr: "text-blue-600" },
            { label: "Total Days Lost", value: totalDays, icon: Calendar, clr: "text-amber-600" },
            { label: "Currently Off", value: currentlyOff, icon: Clock, clr: "text-red-600" },
            { label: "RTW Overdue", value: rtwOverdue, icon: AlertTriangle, clr: "text-red-600" },
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
            <Input className="pl-8" placeholder="Search staff, reasons..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {(Object.entries(CAT_LABEL) as [SicknessCategory, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterRTW} onValueChange={setFilterRTW}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="RTW Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All RTW</SelectItem>
              {(Object.entries(RTW_LABEL) as [RTWStatus, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}>
            <ArrowUpDown className="h-4 w-4 mr-1" />{sortBy === "newest" ? "Newest" : "Oldest"}
          </Button>
        </div>

        {/* absence cards */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", r.dateEnded === null ? "border-l-red-500" : r.totalDays > 7 ? "border-l-amber-400" : "border-l-green-400")}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getStaffName(r.staffId)}
                        <Badge variant="outline" className={CAT_CLR[r.category]}>{CAT_LABEL[r.category]}</Badge>
                        <Badge variant="outline" className={RTW_CLR[r.rtwStatus]}>{RTW_LABEL[r.rtwStatus]}</Badge>
                        {r.occupationalHealthReferral && <Badge variant="outline" className="bg-purple-100 text-purple-800">OH Referral</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {REASON_LABEL[r.reason]} · {r.dateStarted} → {r.dateEnded || "Ongoing"} · {r.totalDays} day(s)
                        {r.fitNote && " · Fit Note"} {r.selfCertified && " · Self-Cert"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{r.totalDays}d</span>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* reason detail */}
                    <div>
                      <p className="font-medium mb-1">Absence Details</p>
                      <p className="text-muted-foreground text-xs">{r.reasonDetail}</p>
                    </div>

                    {/* cover */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1">Cover Arrangements</p>
                      <p className="text-xs text-blue-700">{r.coverArrangements}</p>
                    </div>

                    {/* RTW */}
                    {r.rtwOutcome && (
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <p className="font-medium text-xs text-green-800 mb-1">Return to Work Interview</p>
                        <p className="text-xs text-green-700">
                          {r.rtwDate && `Date: ${r.rtwDate}`}
                          {r.rtwConductedById && ` · Conducted by: ${getStaffName(r.rtwConductedById)}`}
                        </p>
                        <p className="text-xs text-green-700 mt-1">{r.rtwOutcome}</p>
                      </div>
                    )}

                    {/* trigger points */}
                    {r.triggerPoints.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Trigger Points / Actions</p>
                        <div className="flex flex-wrap gap-1">
                          {r.triggerPoints.map((t, i) => (
                            <Badge key={i} variant="outline" className="bg-amber-50 text-amber-700 text-xs">{t}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* summary grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Self-Certified</p>
                        <p className="text-xs font-bold">{r.selfCertified ? "Yes" : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Fit Note</p>
                        <p className="text-xs font-bold">{r.fitNote ? `Yes (exp: ${r.fitNoteExpiry})` : "N/A"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">OH Referral</p>
                        <p className="text-xs font-bold">{r.occupationalHealthReferral ? "Yes" : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Duration</p>
                        <p className="text-xs font-bold">{r.totalDays} day(s)</p>
                      </div>
                    </div>

                    {/* manager notes */}
                    <div><p className="font-medium mb-1">Manager Notes</p><p className="text-muted-foreground text-xs">{r.managerNotes}</p></div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* policy note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Absence Management Policy</p>
          <p>All sickness absences must be recorded. Staff must notify the home as early as possible (minimum 1 hour before shift start). Self-certification covers up to 7 days; a GP fit note is required for absences exceeding 7 calendar days. Return to work interviews must be conducted after every absence regardless of length. The Bradford Factor is monitored — trigger points are: Score 100 (informal discussion), Score 250 (formal meeting), Score 500 (final review). Occupational health referrals should be made for absences exceeding 14 days or where a pattern of concern is identified. All records are confidential and stored in accordance with GDPR. Cover arrangements must be documented to demonstrate continuity of care for children.</p>
        </div>
      </div>

      {/* new absence dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Sickness Absence</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Staff Member</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff_darren">{getStaffName("staff_darren")}</SelectItem>
                  <SelectItem value="staff_ryan">{getStaffName("staff_ryan")}</SelectItem>
                  <SelectItem value="staff_edward">{getStaffName("staff_edward")}</SelectItem>
                  <SelectItem value="staff_anna">{getStaffName("staff_anna")}</SelectItem>
                  <SelectItem value="staff_chervelle">{getStaffName("staff_chervelle")}</SelectItem>
                  <SelectItem value="staff_lackson">{getStaffName("staff_lackson")}</SelectItem>
                  <SelectItem value="staff_mirela">{getStaffName("staff_mirela")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Date Started</Label><Input type="date" /></div>
            <div>
              <Label>Reason</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(REASON_LABEL) as [AbsenceReason, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Details</Label><Textarea placeholder="Describe symptoms and circumstances..." /></div>
            <div><Label>Cover Arrangements</Label><Textarea placeholder="How will shifts be covered?" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={() => setShowNew(false)}>Log Absence</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
