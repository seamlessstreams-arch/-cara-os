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
  Clock, Search, ShieldAlert, Thermometer, Bug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type InfectionType = "gastro" | "respiratory" | "skin" | "covid" | "flu" | "headlice" | "chickenpox" | "conjunctivitis" | "hand_foot_mouth" | "other";
type Severity = "low" | "medium" | "high" | "outbreak";
type Status = "active" | "monitoring" | "resolved" | "notified";

interface InfectionRecord {
  id: string;
  dateReported: string;
  reportedById: string;
  affectedPersonId: string;
  affectedPersonType: "child" | "staff";
  infectionType: InfectionType;
  symptoms: string[];
  severity: Severity;
  status: Status;
  gpConsulted: boolean;
  gpAdvice: string;
  exclusionRequired: boolean;
  exclusionDetails: string;
  controlMeasures: string[];
  otherCasesInHome: number;
  notifiedBodies: string[];
  dateResolved: string | null;
  cleaningActions: string[];
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const TYPE_LABEL: Record<InfectionType, string> = {
  gastro: "Gastroenteritis (D&V)", respiratory: "Respiratory Infection", skin: "Skin Infection",
  covid: "COVID-19", flu: "Influenza", headlice: "Head Lice", chickenpox: "Chickenpox",
  conjunctivitis: "Conjunctivitis", hand_foot_mouth: "Hand, Foot & Mouth", other: "Other",
};

const SEV_LABEL: Record<Severity, string> = { low: "Low", medium: "Medium", high: "High", outbreak: "Outbreak" };
const SEV_CLR: Record<Severity, string> = { low: "bg-green-100 text-green-800", medium: "bg-amber-100 text-amber-800", high: "bg-red-100 text-red-800", outbreak: "bg-red-200 text-red-900" };
const SEV_BORDER: Record<Severity, string> = { low: "border-l-green-400", medium: "border-l-amber-400", high: "border-l-red-500", outbreak: "border-l-red-700" };

const STATUS_LABEL: Record<Status, string> = { active: "Active", monitoring: "Monitoring", resolved: "Resolved", notified: "Notified (PHE)" };
const STATUS_CLR: Record<Status, string> = { active: "bg-red-100 text-red-800", monitoring: "bg-amber-100 text-amber-800", resolved: "bg-green-100 text-green-800", notified: "bg-purple-100 text-purple-800" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: InfectionRecord[] = [
  {
    id: "inf_001", dateReported: d(-3), reportedById: "staff_anna", affectedPersonId: "yp_alex",
    affectedPersonType: "child", infectionType: "gastro", severity: "medium", status: "active",
    symptoms: ["Vomiting (3 episodes)", "Diarrhoea", "Abdominal cramps", "Low-grade temperature 37.8°C"],
    gpConsulted: true, gpAdvice: "Likely viral gastroenteritis. Push fluids, bland diet. No school for 48 hours after last episode. Return if blood in vomit/stool or fever >38.5°C persists more than 48 hours.",
    exclusionRequired: true, exclusionDetails: "Alex excluded from school (Oakfield Academy notified). 48-hour rule applies from last episode of D&V. Currently at home in the unit. Separate bathroom allocated (en-suite).",
    controlMeasures: [
      "Dedicated bathroom allocated (Alex's en-suite only)",
      "Enhanced hand hygiene — all staff to use antibacterial soap and hand gel",
      "Separate laundry wash at 60°C for Alex's bedding and towels",
      "Milton solution for bathroom surfaces — cleaned 3x daily",
      "Staff to use disposable gloves and aprons for any close care",
      "Other YP reminded about hand hygiene before meals",
    ],
    otherCasesInHome: 0, notifiedBodies: [],
    dateResolved: null,
    cleaningActions: ["Bathroom deep-cleaned with Milton 3x daily", "Door handles and light switches wiped hourly in communal areas", "Kitchen surfaces sanitised before and after each meal"],
    notes: "Alex began vomiting at 2am on " + d(-3) + ". Night staff (Lackson) responded and stayed with Alex until morning. Anna took over as key worker. Alex is drinking fluids but not eating much. No other YP or staff showing symptoms. GP telephone consultation completed — no prescription required. School notified and supportive. Alex resting in his room, staff checking every 30 minutes.",
  },
  {
    id: "inf_002", dateReported: d(-14), reportedById: "staff_chervelle", affectedPersonId: "yp_casey",
    affectedPersonType: "child", infectionType: "headlice", severity: "low", status: "resolved",
    symptoms: ["Itchy scalp", "Live lice observed during hair brushing"],
    gpConsulted: false, gpAdvice: "N/A — managed with OTC treatment as per public health guidance.",
    exclusionRequired: false, exclusionDetails: "No exclusion required for head lice. Casey attended college as normal.",
    controlMeasures: [
      "Full Spectrum 4% lotion treatment applied on day of discovery",
      "Repeat treatment applied 7 days later",
      "Nit comb used daily for 14 days",
      "All bedding and pillows washed at 60°C",
      "Headbands, hair ties, and brush replaced",
      "Other YP checked — no cases found",
    ],
    otherCasesInHome: 0, notifiedBodies: [],
    dateResolved: d(-2),
    cleaningActions: ["All soft furnishings in Casey's room vacuumed", "Sofa throws washed", "Shared hair accessories removed from communal bathroom"],
    notes: "Chervelle noticed Casey scratching during direct work. Live lice found during gentle check with Casey's consent. Casey was initially embarrassed — Chervelle handled sensitively, normalising the situation. Treatment applied same day. No other children affected. Casey was reassured this is common and not related to hygiene. Repeat check on " + d(-2) + " — all clear.",
  },
  {
    id: "inf_003", dateReported: d(-30), reportedById: "staff_ryan", affectedPersonId: "staff_edward",
    affectedPersonType: "staff", infectionType: "covid", severity: "high", status: "resolved",
    symptoms: ["Positive lateral flow test", "Cough", "Fatigue", "Loss of taste/smell"],
    gpConsulted: true, gpAdvice: "Isolate for 5 days minimum. Return when 2 consecutive negative LFTs 24 hours apart. No close contact with vulnerable individuals during isolation.",
    exclusionRequired: true, exclusionDetails: "Edward excluded from work for 7 days. Shifts covered by Ryan (2 shifts) and agency worker (3 shifts). Edward returned after 2 negative LFTs on consecutive days.",
    controlMeasures: [
      "Edward isolated at home — no contact with children or staff",
      "All staff and YP offered LFTs daily for 7 days",
      "Enhanced ventilation — windows open in communal areas",
      "Face coverings worn by staff in close contact with YP (optional for YP)",
      "High-touch surfaces cleaned with antiviral wipes every 2 hours during peak",
      "Edward's last shift contacts traced and monitored",
    ],
    otherCasesInHome: 0, notifiedBodies: ["Ofsted (verbal notification)", "Placing local authorities"],
    dateResolved: d(-23),
    cleaningActions: ["Deep clean of all communal areas on day 1", "Antiviral wipes for door handles, light switches, bannisters", "Edward's office area deep-cleaned"],
    notes: "Edward reported symptoms before his shift. Managed well — no transmission to children or other staff. Agency cover arranged within 4 hours. All children tested daily — all negative throughout. Ofsted notified verbally and confirmed no further action. Edward returned to work on " + d(-23) + " after medical clearance. Rota adjusted to avoid consecutive long shifts during recovery period.",
  },
  {
    id: "inf_004", dateReported: d(-7), reportedById: "staff_anna", affectedPersonId: "yp_jordan",
    affectedPersonType: "child", infectionType: "conjunctivitis", severity: "low", status: "monitoring",
    symptoms: ["Red, watery left eye", "Crusty discharge on eyelid (morning)", "Mild irritation — no pain"],
    gpConsulted: true, gpAdvice: "Likely bacterial conjunctivitis. Prescribed chloramphenicol eye drops — 1 drop 4x daily for 5 days. May attend school if drops being administered. No sharing towels or pillows.",
    exclusionRequired: false, exclusionDetails: "Jordan can attend school while on treatment. School notified of condition and medication.",
    controlMeasures: [
      "Separate face towel and flannel for Jordan (labelled)",
      "Jordan reminded not to rub eyes and to wash hands after touching face",
      "Pillowcase changed daily",
      "Chloramphenicol drops administered by trained staff (medication protocol)",
      "Jordan's sensory needs considered — drops given slowly with advance notice",
    ],
    otherCasesInHome: 0, notifiedBodies: [],
    dateResolved: null,
    cleaningActions: ["Jordan's bathroom surfaces cleaned with antibacterial spray daily", "Shared bathroom hand towels replaced with paper towels temporarily"],
    notes: "Anna noticed Jordan's eye was red during breakfast. Jordan said it had been 'sticky' for 2 days but hadn't mentioned it (communication barrier — ASD). GP same-day appointment arranged. Drops prescribed — Jordan initially reluctant (sensory issue with eye drops) but tolerated well after Anna demonstrated on herself. Jordan's teacher informed. Day 4 of treatment — significant improvement, less discharge. Review on " + d(0) + ".",
  },
  {
    id: "inf_005", dateReported: d(-60), reportedById: "staff_darren", affectedPersonId: "yp_alex",
    affectedPersonType: "child", infectionType: "chickenpox", severity: "medium", status: "resolved",
    symptoms: ["Itchy rash (trunk, face, limbs)", "Mild fever 38.1°C", "Tiredness", "Loss of appetite"],
    gpConsulted: true, gpAdvice: "Confirmed chickenpox. Calamine lotion, antihistamine for itch, paracetamol for fever. Exclude from school until all spots crusted over (usually 5-7 days). Contact GP urgently if breathing difficulties, dehydration, or secondary infection signs.",
    exclusionRequired: true, exclusionDetails: "Alex excluded from school for 6 days until all spots crusted. School (Oakfield Academy) notified immediately. Alex remained in the home with enhanced support.",
    controlMeasures: [
      "Check immunity status of all other YP and staff (via immunisation records and GP records)",
      "Jordan confirmed immune (previous infection). Casey — uncertain, GP contacted",
      "Staff immunity checked — Edward and Mirela uncertain, advised to avoid close contact",
      "Alex's fingernails cut short to reduce scratching and secondary infection risk",
      "Calamine lotion and antihistamines kept in medication safe — administered as prescribed",
      "Daily welfare checks documented — temperature, fluid intake, spot progression",
    ],
    otherCasesInHome: 0, notifiedBodies: ["School (Oakfield Academy)", "Alex's social worker", "Placing LA"],
    dateResolved: d(-53),
    cleaningActions: ["Bedding washed daily during active phase", "Extra towels provided — daily wash", "Communal areas cleaned as normal"],
    notes: "Alex managed well with chickenpox. Stayed in his room by choice for first 2 days but then restless. Staff provided activities and extra 1:1 time. No secondary cases. Edward and Mirela were asked to check with their own GPs about immunity — both confirmed immune through bloods. Alex returned to school on " + d(-53) + " with all spots crusted. School welcomed back with no issues. Attendance letter provided to school.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function InfectionControlPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        TYPE_LABEL[r.infectionType].toLowerCase().includes(q) ||
        (r.affectedPersonType === "child" ? getYPName(r.affectedPersonId) : getStaffName(r.affectedPersonId)).toLowerCase().includes(q) ||
        r.notes.toLowerCase().includes(q)
      );
    }
    if (filterSeverity !== "all") rows = rows.filter((r) => r.severity === filterSeverity);
    if (filterStatus !== "all") rows = rows.filter((r) => r.status === filterStatus);
    rows.sort((a, b) => sortBy === "newest" ? b.dateReported.localeCompare(a.dateReported) : a.dateReported.localeCompare(b.dateReported));
    return rows;
  }, [data, search, filterSeverity, filterStatus, sortBy]);

  const total = data.length;
  const active = data.filter((r) => r.status === "active" || r.status === "monitoring").length;
  const resolved = data.filter((r) => r.status === "resolved").length;
  const exclusions = data.filter((r) => r.exclusionRequired).length;

  const exportCols: ExportColumn<InfectionRecord>[] = [
    { header: "Date", accessor: (r: InfectionRecord) => r.dateReported },
    { header: "Affected Person", accessor: (r: InfectionRecord) => r.affectedPersonType === "child" ? getYPName(r.affectedPersonId) : getStaffName(r.affectedPersonId) },
    { header: "Type", accessor: (r: InfectionRecord) => r.affectedPersonType },
    { header: "Infection", accessor: (r: InfectionRecord) => TYPE_LABEL[r.infectionType] },
    { header: "Severity", accessor: (r: InfectionRecord) => SEV_LABEL[r.severity] },
    { header: "Status", accessor: (r: InfectionRecord) => STATUS_LABEL[r.status] },
    { header: "GP Consulted", accessor: (r: InfectionRecord) => r.gpConsulted ? "Yes" : "No" },
    { header: "Exclusion", accessor: (r: InfectionRecord) => r.exclusionRequired ? "Yes" : "No" },
    { header: "Other Cases", accessor: (r: InfectionRecord) => String(r.otherCasesInHome) },
    { header: "Resolved", accessor: (r: InfectionRecord) => r.dateResolved || "Ongoing" },
  ];

  return (
    <PageShell
      title="Infection Prevention & Control"
      subtitle="Health Protection · IPC Policy · Public Health England Guidance"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Infection Control Log" />
          <ExportButton data={data} columns={exportCols} filename="infection-control" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Log Infection</Button>
        </div>
      }
    >
      <div id="print-area">
        {/* stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Records", value: total, icon: Bug, clr: "text-blue-600" },
            { label: "Active / Monitoring", value: active, icon: Thermometer, clr: "text-amber-600" },
            { label: "Resolved", value: resolved, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Exclusions Required", value: exclusions, icon: ShieldAlert, clr: "text-red-600" },
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
            <Input className="pl-8" placeholder="Search infections..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              {(Object.entries(SEV_LABEL) as [Severity, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {(Object.entries(STATUS_LABEL) as [Status, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}>
            <ArrowUpDown className="h-4 w-4 mr-1" />{sortBy === "newest" ? "Newest" : "Oldest"}
          </Button>
        </div>

        {/* active alert */}
        {active > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{active} active or monitoring infection(s)</p>
              <p className="text-amber-700">Active infections require daily monitoring, control measures in place, and GP advice followed. If 2+ cases of the same illness within 48 hours, this constitutes a potential outbreak — notify Public Health England and Ofsted immediately.</p>
            </div>
          </div>
        )}

        {/* record cards */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            const personName = r.affectedPersonType === "child" ? getYPName(r.affectedPersonId) : getStaffName(r.affectedPersonId);
            return (
              <Card key={r.id} className={cn("border-l-4", SEV_BORDER[r.severity])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {personName} — {TYPE_LABEL[r.infectionType]}
                        <Badge variant="outline" className={SEV_CLR[r.severity]}>{SEV_LABEL[r.severity]}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                        {r.exclusionRequired && <Badge variant="outline" className="bg-orange-100 text-orange-800">Exclusion</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.affectedPersonType === "child" ? "Young Person" : "Staff"} · Reported: {r.dateReported} · By: {getStaffName(r.reportedById)}
                        {r.gpConsulted && " · GP Consulted"} · Other cases: {r.otherCasesInHome}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* symptoms */}
                    <div>
                      <p className="font-medium mb-1">Symptoms</p>
                      <div className="flex flex-wrap gap-1">
                        {r.symptoms.map((s, i) => (
                          <Badge key={i} variant="outline" className="bg-red-50 text-red-700 text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* GP advice */}
                    {r.gpConsulted && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="font-medium text-xs text-blue-800 mb-1">GP Advice</p>
                        <p className="text-xs text-blue-700">{r.gpAdvice}</p>
                      </div>
                    )}

                    {/* exclusion */}
                    {r.exclusionRequired && (
                      <div className="bg-orange-50 border border-orange-200 rounded p-2">
                        <p className="font-medium text-xs text-orange-800 mb-1">Exclusion Details</p>
                        <p className="text-xs text-orange-700">{r.exclusionDetails}</p>
                      </div>
                    )}

                    {/* control measures */}
                    <div>
                      <p className="font-medium mb-1">Control Measures</p>
                      <ul className="space-y-1">
                        {r.controlMeasures.map((m, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* cleaning */}
                    <div>
                      <p className="font-medium mb-1">Cleaning Actions</p>
                      <ul className="space-y-1">
                        {r.cleaningActions.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* notifications */}
                    {r.notifiedBodies.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">External Notifications</p>
                        <div className="flex flex-wrap gap-1">
                          {r.notifiedBodies.map((b, i) => (
                            <Badge key={i} variant="outline" className="bg-purple-50 text-purple-700 text-xs">{b}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* timeline */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Reported</p>
                        <p className="text-xs font-bold">{r.dateReported}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Resolved</p>
                        <p className="text-xs font-bold">{r.dateResolved || "Ongoing"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Other Cases in Home</p>
                        <p className={cn("text-xs font-bold", r.otherCasesInHome > 0 ? "text-red-700" : "text-green-700")}>{r.otherCasesInHome}</p>
                      </div>
                    </div>

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
          <p className="font-semibold mb-1">Infection Prevention & Control Framework</p>
          <p>Children&apos;s homes must follow Public Health England guidance on infection prevention and control. All infectious illness must be recorded, with GP advice sought where appropriate. The 48-hour rule applies to D&amp;V (return to school/work 48 hours after last episode). Outbreaks (2+ linked cases within 48 hours) must be reported to the local Health Protection Team and Ofsted. Control measures must be proportionate and documented. Staff must be trained in basic IPC including hand hygiene, PPE use, and cleaning protocols. Records are subject to Reg 44 and Ofsted inspection.</p>
        </div>
      </div>

      {/* new record dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Infection / Illness</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Affected Person Type</Label>
              <Select><SelectTrigger><SelectValue placeholder="Child or Staff" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="child">Young Person</SelectItem>
                  <SelectItem value="staff">Staff Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Affected Person</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
                  <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
                  <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
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
            <div>
              <Label>Infection Type</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TYPE_LABEL) as [InfectionType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severity</Label>
              <Select><SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(SEV_LABEL) as [Severity, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Symptoms</Label><Textarea placeholder="List symptoms observed..." /></div>
            <div><Label>Notes</Label><Textarea placeholder="Additional notes..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={() => setShowNew(false)}>Log Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
