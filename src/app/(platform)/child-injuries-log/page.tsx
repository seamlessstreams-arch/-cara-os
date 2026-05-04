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
  AlertTriangle, ShieldAlert, Activity, MapPin, Bandage, Stethoscope, Eye, Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type InjuryType = "Bruise" | "Graze" | "Cut" | "Bump" | "Burn" | "Sprain" | "Other";
type Severity = "Minor" | "Moderate" | "Required medical";

interface InjuryRecord {
  id: string;
  youngPerson: string;
  date: string;
  time: string;
  bodyLocation: string;
  injuryType: InjuryType;
  severity: Severity;
  howItHappened: string;
  childAccountConsistent: boolean;
  witnessed: boolean;
  witnesses: string[];
  firstAidGiven: string;
  photographedToBodyMap: boolean;
  gpRequired: boolean;
  gpAttended: boolean;
  parentsInformed: boolean;
  parentsInformedTime: string;
  socialWorkerInformed: boolean;
  staffOnDuty: string[];
  recordedBy: string;
  safeguardingFlag: boolean;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const SEVERITY_CLR: Record<Severity, string> = {
  "Minor": "bg-green-100 text-green-800",
  "Moderate": "bg-yellow-100 text-yellow-800",
  "Required medical": "bg-red-100 text-red-800",
};

const BORDER_SEV: Record<Severity, string> = {
  "Minor": "border-l-green-400",
  "Moderate": "border-l-yellow-400",
  "Required medical": "border-l-red-600",
};

const TYPE_CLR: Record<InjuryType, string> = {
  "Bruise": "bg-purple-100 text-purple-800",
  "Graze": "bg-orange-100 text-orange-800",
  "Cut": "bg-red-100 text-red-800",
  "Bump": "bg-blue-100 text-blue-800",
  "Burn": "bg-rose-100 text-rose-800",
  "Sprain": "bg-amber-100 text-amber-800",
  "Other": "bg-slate-100 text-slate-800",
};

const INJURY_TYPES: InjuryType[] = ["Bruise", "Graze", "Cut", "Bump", "Burn", "Sprain", "Other"];
const SEVERITIES: Severity[] = ["Minor", "Moderate", "Required medical"];

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: InjuryRecord[] = [
  {
    id: "inj_1",
    youngPerson: "yp_alex",
    date: d(-1),
    time: "16:20",
    bodyLocation: "Right shin",
    injuryType: "Bruise",
    severity: "Minor",
    howItHappened: "Football in back garden — collided with Jordan during slide tackle. Impact to right shin.",
    childAccountConsistent: true,
    witnessed: true,
    witnesses: ["staff_edward", "staff_chervelle"],
    firstAidGiven: "Cold compress applied for 10 minutes. Arnica gel offered with consent.",
    photographedToBodyMap: true,
    gpRequired: false,
    gpAttended: false,
    parentsInformed: false,
    parentsInformedTime: "",
    socialWorkerInformed: false,
    staffOnDuty: ["staff_edward", "staff_chervelle"],
    recordedBy: "staff_edward",
    safeguardingFlag: false,
    notes: "Normal sport-related injury. Alex resumed play after 20 mins.",
  },
  {
    id: "inj_2",
    youngPerson: "yp_jordan",
    date: d(-2),
    time: "08:45",
    bodyLocation: "Left elbow",
    injuryType: "Graze",
    severity: "Minor",
    howItHappened: "Tripped on schoolbag in hallway whilst rushing to get ready for school. Caught elbow on radiator cover.",
    childAccountConsistent: true,
    witnessed: false,
    witnesses: [],
    firstAidGiven: "Cleaned with antiseptic wipe, plaster applied. No bleeding evident.",
    photographedToBodyMap: true,
    gpRequired: false,
    gpAttended: false,
    parentsInformed: false,
    parentsInformedTime: "",
    socialWorkerInformed: false,
    staffOnDuty: ["staff_anna", "staff_ryan"],
    recordedBy: "staff_anna",
    safeguardingFlag: false,
    notes: "Bag now stored under bed each night per house tidiness routine.",
  },
  {
    id: "inj_3",
    youngPerson: "yp_casey",
    date: d(-3),
    time: "19:10",
    bodyLocation: "Right thigh — outer aspect",
    injuryType: "Bruise",
    severity: "Moderate",
    howItHappened: "Casey reported the bruise during evening shower. Stated they didn't remember how it happened. Approx 5cm purple bruise. Casey's account vague — couldn't recall any incident at school or home.",
    childAccountConsistent: false,
    witnessed: false,
    witnesses: [],
    firstAidGiven: "Visual assessment only. No treatment required. Body map completed.",
    photographedToBodyMap: true,
    gpRequired: false,
    gpAttended: false,
    parentsInformed: false,
    parentsInformedTime: "",
    socialWorkerInformed: true,
    staffOnDuty: ["staff_lackson", "staff_mirela"],
    recordedBy: "staff_lackson",
    safeguardingFlag: true,
    notes: "Inconsistency between injury and child's account. Discussed with RM. Social Worker (Karen Holding) informed. To be monitored. Casey's school PE teacher contacted to check for any unwitnessed PE incident — none reported.",
  },
  {
    id: "inj_4",
    youngPerson: "yp_alex",
    date: d(-5),
    time: "14:30",
    bodyLocation: "Forehead — left side",
    injuryType: "Bump",
    severity: "Minor",
    howItHappened: "Bumped head on low branch whilst on woodland walk at Foxley Wood. Walking ahead of group, didn't see branch.",
    childAccountConsistent: true,
    witnessed: true,
    witnesses: ["staff_ryan"],
    firstAidGiven: "Cold compress for 5 minutes. Visual check — no swelling, no double vision, no nausea. Head injury observation form completed.",
    photographedToBodyMap: true,
    gpRequired: false,
    gpAttended: false,
    parentsInformed: false,
    parentsInformedTime: "",
    socialWorkerInformed: false,
    staffOnDuty: ["staff_ryan", "staff_anna"],
    recordedBy: "staff_ryan",
    safeguardingFlag: false,
    notes: "Neuro obs every 30 mins for 2 hrs — all normal. Alex laughed about it after.",
  },
  {
    id: "inj_5",
    youngPerson: "yp_jordan",
    date: d(-6),
    time: "11:45",
    bodyLocation: "Right index finger",
    injuryType: "Cut",
    severity: "Required medical",
    howItHappened: "Helping prepare lunch — cut finger whilst slicing apple. Knife slipped through skin. Required GP attendance for steri-strips.",
    childAccountConsistent: true,
    witnessed: true,
    witnesses: ["staff_chervelle"],
    firstAidGiven: "Direct pressure with sterile dressing. Bleeding controlled within 5 mins. Wound approx 1.5cm long.",
    photographedToBodyMap: true,
    gpRequired: true,
    gpAttended: true,
    parentsInformed: false,
    parentsInformedTime: "",
    socialWorkerInformed: true,
    staffOnDuty: ["staff_chervelle", "staff_darren"],
    recordedBy: "staff_chervelle",
    safeguardingFlag: false,
    notes: "GP applied steri-strips and dressing. Tetanus up to date. Knife skills session to be reviewed in next key work.",
  },
  {
    id: "inj_6",
    youngPerson: "yp_casey",
    date: d(-7),
    time: "20:30",
    bodyLocation: "Left ankle",
    injuryType: "Sprain",
    severity: "Moderate",
    howItHappened: "Casey jumped off second-to-last stair, landed awkwardly. Heard small pop. Mild swelling, tender to touch.",
    childAccountConsistent: true,
    witnessed: true,
    witnesses: ["staff_mirela"],
    firstAidGiven: "RICE protocol — Rest, Ice, Compression, Elevation. Tubigrip applied. Pain relief offered.",
    photographedToBodyMap: true,
    gpRequired: false,
    gpAttended: false,
    parentsInformed: false,
    parentsInformedTime: "",
    socialWorkerInformed: false,
    staffOnDuty: ["staff_mirela", "staff_lackson"],
    recordedBy: "staff_mirela",
    safeguardingFlag: false,
    notes: "Casey reminded about not jumping down stairs. Swelling resolved within 24 hours. Full weight bearing next day.",
  },
  {
    id: "inj_7",
    youngPerson: "yp_alex",
    date: d(-9),
    time: "07:15",
    bodyLocation: "Right hand — back",
    injuryType: "Burn",
    severity: "Minor",
    howItHappened: "Touched edge of toaster whilst making breakfast. Brief contact — small red mark.",
    childAccountConsistent: true,
    witnessed: true,
    witnesses: ["staff_anna"],
    firstAidGiven: "Cool running water for 20 minutes. No blistering. Loose dressing applied.",
    photographedToBodyMap: true,
    gpRequired: false,
    gpAttended: false,
    parentsInformed: false,
    parentsInformedTime: "",
    socialWorkerInformed: false,
    staffOnDuty: ["staff_anna"],
    recordedBy: "staff_anna",
    safeguardingFlag: false,
    notes: "Toaster guard reviewed. Alex shown safer technique for retrieving toast.",
  },
  {
    id: "inj_8",
    youngPerson: "yp_jordan",
    date: d(-11),
    time: "15:00",
    bodyLocation: "Left knee",
    injuryType: "Graze",
    severity: "Minor",
    howItHappened: "Fell off skateboard at the local skate park. Wearing pads but graze through trouser tear.",
    childAccountConsistent: true,
    witnessed: true,
    witnesses: ["staff_edward"],
    firstAidGiven: "Cleaned with saline, antiseptic cream, dressing applied. Plaster reapplied next day.",
    photographedToBodyMap: true,
    gpRequired: false,
    gpAttended: false,
    parentsInformed: false,
    parentsInformedTime: "",
    socialWorkerInformed: false,
    staffOnDuty: ["staff_edward", "staff_ryan"],
    recordedBy: "staff_edward",
    safeguardingFlag: false,
    notes: "Jordan keen to keep skateboarding — knee pads now mandatory before each session.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function ChildInjuriesLogPage() {
  const [data] = useState(SEED);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((p) => (p === id ? null : id));

  /* ── derived ─────────────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterType !== "all" && r.injuryType !== filterType) return false;
      if (filterSeverity !== "all" && r.severity !== filterSeverity) return false;
      if (filterYP !== "all" && r.youngPerson !== filterYP) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.bodyLocation.toLowerCase().includes(q) ||
          r.howItHappened.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          getYPName(r.youngPerson).toLowerCase().includes(q)
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date.localeCompare(a.date);
        case "date-asc": return a.date.localeCompare(b.date);
        case "severity": {
          const order: Severity[] = ["Minor", "Moderate", "Required medical"];
          return order.indexOf(b.severity) - order.indexOf(a.severity);
        }
        case "yp": return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterType, filterSeverity, filterYP, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────────────── */

  const thisWeekCount = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    return data.filter((r) => {
      const rd = new Date(r.date);
      return rd >= sevenDaysAgo && rd <= now;
    }).length;
  }, [data]);

  const requiredMedicalCount = data.filter((r) => r.severity === "Required medical").length;
  const safeguardingFlaggedCount = data.filter((r) => r.safeguardingFlag).length;

  const mostCommonLocation = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((r) => {
      // group by broad area (first word)
      const area = r.bodyLocation.split(" ")[0];
      counts[area] = (counts[area] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : "—";
  }, [data]);

  const yps = Array.from(new Set(data.map((r) => r.youngPerson)));

  /* ── export ──────────────────────────────────────────────────────────────── */

  const exportCols: ExportColumn<InjuryRecord>[] = [
    { header: "Date", accessor: (r: InjuryRecord) => r.date },
    { header: "Time", accessor: (r: InjuryRecord) => r.time },
    { header: "Young Person", accessor: (r: InjuryRecord) => getYPName(r.youngPerson) },
    { header: "Body Location", accessor: (r: InjuryRecord) => r.bodyLocation },
    { header: "Injury Type", accessor: (r: InjuryRecord) => r.injuryType },
    { header: "Severity", accessor: (r: InjuryRecord) => r.severity },
    { header: "How It Happened", accessor: (r: InjuryRecord) => r.howItHappened },
    { header: "Account Consistent", accessor: (r: InjuryRecord) => r.childAccountConsistent ? "Yes" : "No" },
    { header: "Witnessed", accessor: (r: InjuryRecord) => r.witnessed ? "Yes" : "No" },
    { header: "Witnesses", accessor: (r: InjuryRecord) => r.witnesses.map((w) => getStaffName(w)).join("; ") },
    { header: "First Aid Given", accessor: (r: InjuryRecord) => r.firstAidGiven },
    { header: "Body Map Photo", accessor: (r: InjuryRecord) => r.photographedToBodyMap ? "Yes" : "No" },
    { header: "GP Required", accessor: (r: InjuryRecord) => r.gpRequired ? "Yes" : "No" },
    { header: "GP Attended", accessor: (r: InjuryRecord) => r.gpAttended ? "Yes" : "No" },
    { header: "Parents Informed", accessor: (r: InjuryRecord) => r.parentsInformed ? `Yes (${r.parentsInformedTime})` : "No" },
    { header: "SW Informed", accessor: (r: InjuryRecord) => r.socialWorkerInformed ? "Yes" : "No" },
    { header: "Staff On Duty", accessor: (r: InjuryRecord) => r.staffOnDuty.map((s) => getStaffName(s)).join("; ") },
    { header: "Recorded By", accessor: (r: InjuryRecord) => getStaffName(r.recordedBy) },
    { header: "Safeguarding Flag", accessor: (r: InjuryRecord) => r.safeguardingFlag ? "Yes" : "No" },
    { header: "Notes", accessor: (r: InjuryRecord) => r.notes },
  ];

  /* ── render ──────────────────────────────────────────────────────────────── */

  return (
    <PageShell
      title="Child Injuries Log"
      subtitle="Quality Standard 7 (Health) · Children's Homes Regulations 2015, Reg 22"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Child Injuries Log" />
          <ExportButton data={filtered} columns={exportCols} filename="child-injuries-log" />
        </div>
      }
    >
      <div id="print-area">
        {/* ── stat strip ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "This Week", value: thisWeekCount, icon: Activity, clr: "text-blue-600" },
            { label: "Required Medical", value: requiredMedicalCount, icon: Stethoscope, clr: "text-red-600" },
            { label: "Safeguarding Flagged", value: safeguardingFlaggedCount, icon: ShieldAlert, clr: "text-amber-600" },
            { label: "Most Common Area", value: mostCommonLocation, icon: MapPin, clr: "text-purple-600" },
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

        {/* ── safeguarding alert ───────────────────────────────────────────── */}
        {safeguardingFlaggedCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{safeguardingFlaggedCount} injury / injuries flagged for safeguarding review</p>
              <p className="text-amber-700">Where a child&apos;s account is inconsistent or pattern of injury raises concern, RM must review and consider referral. Linked to behaviour log and contextual safeguarding entries.</p>
            </div>
          </div>
        )}

        {/* ── medical alert ────────────────────────────────────────────────── */}
        {requiredMedicalCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">{requiredMedicalCount} injury / injuries required medical attention</p>
              <p className="text-red-700">Cross-check entries with the Accident Book and GP correspondence. Notify placing authority within 24 hrs (Reg 40).</p>
            </div>
          </div>
        )}

        {/* ── body map link ────────────────────────────────────────────────── */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-start gap-2">
          <Camera className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-semibold text-blue-800">Body Map Integration</p>
            <p className="text-blue-700">All injuries should be marked on the child&apos;s body map. <a href="/body-map" className="underline font-medium">Open Body Map →</a></p>
          </div>
        </div>

        {/* ── filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search location, child, description…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {yps.map((y) => (<SelectItem key={y} value={y}>{getYPName(y)}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {INJURY_TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              {SEVERITIES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="severity">By Severity</SelectItem>
              <SelectItem value="yp">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── records ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expandedId === r.id;
            return (
              <Card
                key={r.id}
                className={cn(
                  "border-l-4",
                  BORDER_SEV[r.severity],
                  r.safeguardingFlag && "ring-1 ring-amber-300",
                )}
              >
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.youngPerson)}
                        <Badge variant="outline" className={TYPE_CLR[r.injuryType]}>{r.injuryType}</Badge>
                        <Badge variant="outline" className={SEVERITY_CLR[r.severity]}>{r.severity}</Badge>
                        {r.safeguardingFlag && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                            <ShieldAlert className="h-3 w-3 mr-1" /> Safeguarding Review
                          </Badge>
                        )}
                        {!r.childAccountConsistent && (
                          <Badge variant="outline" className="bg-orange-100 text-orange-800">
                            Account Inconsistent
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.bodyLocation} · {r.date} at {r.time}
                      </p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* concern banner */}
                    {(r.safeguardingFlag || !r.childAccountConsistent) && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="font-semibold text-amber-800 flex items-center gap-1">
                          <ShieldAlert className="h-4 w-4" /> Concerns to review
                        </p>
                        <ul className="list-disc list-inside text-amber-700 text-xs mt-1 space-y-0.5">
                          {!r.childAccountConsistent && <li>Child&apos;s account is not consistent with the injury observed.</li>}
                          {r.safeguardingFlag && <li>Flagged for safeguarding review by RM. Linked to contextual safeguarding considerations.</li>}
                          {r.socialWorkerInformed && <li>Social Worker has been informed.</li>}
                        </ul>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium mb-1">How It Happened</p>
                        <p className="text-muted-foreground">{r.howItHappened}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1"><Bandage className="h-4 w-4" /> First Aid Given</p>
                        <p className="text-muted-foreground">{r.firstAidGiven}</p>
                      </div>
                    </div>

                    {/* witness / consistency strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs flex items-center gap-1"><Eye className="h-3 w-3" /> Witnessed</p>
                        <p className="text-xs text-muted-foreground">{r.witnessed ? "Yes" : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Account Consistent</p>
                        <p className="text-xs text-muted-foreground">{r.childAccountConsistent ? "Yes" : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">GP Required</p>
                        <p className="text-xs text-muted-foreground">{r.gpRequired ? (r.gpAttended ? "Yes — Attended" : "Yes — Pending") : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">SW Informed</p>
                        <p className="text-xs text-muted-foreground">{r.socialWorkerInformed ? "Yes" : "No"}</p>
                      </div>
                    </div>

                    {/* tags */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {r.photographedToBodyMap && (
                        <Badge variant="outline" className="bg-blue-50">
                          <Camera className="h-3 w-3 mr-1" /> Marked on Body Map
                        </Badge>
                      )}
                      {r.parentsInformed && (
                        <Badge variant="outline" className="bg-green-50">
                          Parents informed {r.parentsInformedTime && `(${r.parentsInformedTime})`}
                        </Badge>
                      )}
                      {r.witnesses.length > 0 && (
                        <span className="text-muted-foreground">
                          Witnesses: {r.witnesses.map((w) => getStaffName(w)).join(", ")}
                        </span>
                      )}
                    </div>

                    {/* notes */}
                    {r.notes && (
                      <div>
                        <p className="font-medium mb-1">Notes</p>
                        <p className="text-muted-foreground">{r.notes}</p>
                      </div>
                    )}

                    {/* footer */}
                    <div className="flex flex-wrap justify-between items-center pt-2 border-t text-xs text-muted-foreground gap-2">
                      <span>Recorded by: {getStaffName(r.recordedBy)}</span>
                      <span>On duty: {r.staffOnDuty.map((s) => getStaffName(s)).join(", ")}</span>
                      <a href="/body-map" className="text-blue-600 hover:underline">View body map →</a>
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
          <p>Children&apos;s Homes (England) Regulations 2015, Reg 22 — duty to keep records of any accident or injury to a child. Quality Standard 7 (Health and well-being) — children must receive timely first aid, and the home must monitor patterns of injury. This log captures minor injuries (bruises, scrapes, falls, sport-related) and is distinct from the Accident Book (workplace H&amp;S record, RIDDOR), Incident Log (significant events) and Body Map (visual injury record). Any injury that is unexplained, inconsistent with account, or part of a pattern must be reviewed by the Registered Manager and may trigger a safeguarding referral under Working Together to Safeguard Children 2018. Records retained until the child&apos;s 25th birthday (or 75 years for looked-after children, per Reg 37).</p>
        </div>
      </div>
    </PageShell>
  );
}
