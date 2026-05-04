"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, ChevronDown, ChevronUp, ArrowUpDown, Calendar,
  Clock, AlertTriangle, CheckCircle2, Shield, Moon,
  ClipboardList, Eye, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type VisitType = "RI Monitoring" | "Management Spot Check" | "External Professional" | "Ofsted";
type OverallAssessment = "Good" | "Requires attention" | "Immediate action needed";

interface ActionRequired {
  description: string;
  owner: string;
  deadline: string;
}

interface UnannouncedVisit {
  id: string;
  date: string;
  timeOfVisit: string;
  visitType: VisitType;
  visitor: string;
  areasInspected: string[];
  childrenSpokenTo: string[];
  staffOnDuty: string[];
  findings: string;
  positiveObservations: string[];
  concerns: string[];
  actionsRequired: ActionRequired[];
  overallAssessment: OverallAssessment;
  followUpDate: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const fmt = (iso: string) => {
  const [y, m, day] = iso.split("-");
  return `${day}/${m}/${y}`;
};

const isNightVisit = (time: string): boolean => {
  const hour = parseInt(time.split(":")[0], 10);
  return hour >= 22 || hour < 6;
};

const ASSESSMENT_CLR: Record<OverallAssessment, string> = {
  "Good": "bg-green-100 text-green-800",
  "Requires attention": "bg-amber-100 text-amber-800",
  "Immediate action needed": "bg-red-100 text-red-800",
};

const TYPE_CLR: Record<VisitType, string> = {
  "RI Monitoring": "bg-purple-100 text-purple-800",
  "Management Spot Check": "bg-blue-100 text-blue-800",
  "External Professional": "bg-indigo-100 text-indigo-800",
  "Ofsted": "bg-rose-100 text-rose-800",
};

type SortOption = "date-desc" | "date-asc" | "type" | "assessment";

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: UnannouncedVisit[] = [
  {
    id: "uv_1",
    date: d(-5),
    timeOfVisit: "22:30",
    visitType: "RI Monitoring",
    visitor: "staff_darren",
    areasInspected: ["night routines", "staffing levels", "security checks", "sleep logs"],
    childrenSpokenTo: ["Casey", "Alex"],
    staffOnDuty: ["staff_edward", "staff_mirela"],
    findings: "Night routines are calm and consistent. Both children were settled by 22:00. Staff completed all security checks on time. Sleep logs up to date.",
    positiveObservations: [
      "Staff demonstrated warm, nurturing interactions during bedtime routines",
      "Home was quiet, calm, and felt settled — children clearly feel safe",
      "Security checklist completed thoroughly with no omissions",
    ],
    concerns: [],
    actionsRequired: [],
    overallAssessment: "Good",
    followUpDate: d(25),
  },
  {
    id: "uv_2",
    date: d(-12),
    timeOfVisit: "08:15",
    visitType: "Management Spot Check",
    visitor: "staff_ryan",
    areasInspected: ["morning routines", "breakfast provision", "school preparation", "medication administration"],
    childrenSpokenTo: ["Casey", "Alex", "Jordan"],
    staffOnDuty: ["staff_anna", "staff_chervelle"],
    findings: "Morning routines are well-structured. All children were up, dressed, and ready for school on time. Breakfast choices were varied and healthy. Medication administered correctly with proper recording.",
    positiveObservations: [
      "Staff were proactive in encouraging independence during morning routines",
      "Breakfast area was clean and welcoming with good food options",
      "Medication double-checked and counter-signed appropriately",
    ],
    concerns: [
      "One child's school bag was not packed the evening before, causing minor morning rush",
    ],
    actionsRequired: [
      { description: "Remind staff to prompt evening bag-packing as part of bedtime routine", owner: "staff_anna", deadline: d(-10) },
    ],
    overallAssessment: "Good",
    followUpDate: d(18),
  },
  {
    id: "uv_3",
    date: d(-21),
    timeOfVisit: "02:45",
    visitType: "RI Monitoring",
    visitor: "staff_darren",
    areasInspected: ["night waking checks", "lone working practice", "building security", "fire safety"],
    childrenSpokenTo: [],
    staffOnDuty: ["staff_lackson"],
    findings: "Night waking check conducted — all children asleep and settled. Single staff member on sleep-in was awake and alert. All doors and windows secure. Fire panel checked and clear.",
    positiveObservations: [
      "Staff member fully alert and engaged in productive tasks between checks",
      "Building security was excellent — all entry points confirmed locked",
      "Night check records were accurate and contemporaneous",
    ],
    concerns: [],
    actionsRequired: [],
    overallAssessment: "Good",
    followUpDate: d(9),
  },
  {
    id: "uv_4",
    date: d(-30),
    timeOfVisit: "14:00",
    visitType: "External Professional",
    visitor: "Sarah Mitchell (IRO)",
    areasInspected: ["care planning", "child participation", "placement stability", "key working records"],
    childrenSpokenTo: ["Casey"],
    staffOnDuty: ["staff_darren", "staff_anna", "staff_edward"],
    findings: "Casey's care plan is being implemented well. Key working sessions are regular and child-centred. Casey reports feeling settled and happy. Placement stability is strong.",
    positiveObservations: [
      "Key working records are detailed, reflective, and include the child's voice",
      "Casey was able to articulate her goals and felt listened to by staff",
      "Care plan objectives are being met consistently with clear evidence",
    ],
    concerns: [],
    actionsRequired: [],
    overallAssessment: "Good",
    followUpDate: d(30),
  },
  {
    id: "uv_5",
    date: d(-38),
    timeOfVisit: "23:15",
    visitType: "Management Spot Check",
    visitor: "staff_darren",
    areasInspected: ["night staffing", "incident response readiness", "medication storage", "CCTV functioning"],
    childrenSpokenTo: [],
    staffOnDuty: ["staff_chervelle", "staff_lackson"],
    findings: "Night staffing at expected levels. Both staff alert and positioned appropriately. Medication cabinet locked and secure. CCTV recording across all external areas. Incident folder accessible and up to date.",
    positiveObservations: [
      "Staff were well-prepared and could articulate the evening's events clearly",
      "Incident response folder was immediately accessible and staff knew its location",
      "CCTV system fully operational with no blind spots identified",
    ],
    concerns: [],
    actionsRequired: [],
    overallAssessment: "Good",
    followUpDate: d(-8),
  },
  {
    id: "uv_6",
    date: d(-45),
    timeOfVisit: "16:30",
    visitType: "Management Spot Check",
    visitor: "staff_ryan",
    areasInspected: ["after-school environment", "activities provision", "safeguarding display", "visitor log"],
    childrenSpokenTo: ["Alex", "Jordan"],
    staffOnDuty: ["staff_edward", "staff_anna", "staff_mirela"],
    findings: "After-school period was lively and well-managed. Children engaged in activities. Safeguarding information is clearly displayed. Visitor log is being completed but one entry was unsigned.",
    positiveObservations: [
      "Children were relaxed and enjoying structured free time with staff engagement",
      "Safeguarding posters are child-friendly and prominently displayed",
      "Activities were varied and matched children's interests",
    ],
    concerns: [
      "Visitor log had one unsigned entry from earlier that day — a professional visit",
    ],
    actionsRequired: [
      { description: "Staff to ensure all visitors sign out before leaving — add prompt to front door checklist", owner: "staff_edward", deadline: d(-40) },
    ],
    overallAssessment: "Requires attention",
    followUpDate: d(-15),
  },
  {
    id: "uv_7",
    date: d(-60),
    timeOfVisit: "04:00",
    visitType: "RI Monitoring",
    visitor: "staff_darren",
    areasInspected: ["overnight environment", "staff wakefulness", "fire exits", "temperature checks"],
    childrenSpokenTo: [],
    staffOnDuty: ["staff_mirela"],
    findings: "Fire exits clear and accessible. Building temperature appropriate. Staff member was awake but the night log had not been updated since 01:00, creating a gap in records.",
    positiveObservations: [
      "Fire exits completely clear with no obstructions",
      "Building temperature comfortable throughout — thermostat appropriately set",
    ],
    concerns: [
      "Night log not updated between 01:00 and 04:00 — 3-hour gap in recording",
      "Staff member could not confirm whether 02:00 check on children had been completed",
    ],
    actionsRequired: [
      { description: "Implement hourly prompts for night log completion — consider a timer/alarm system", owner: "staff_darren", deadline: d(-50) },
      { description: "Supervision session with staff member to address recording expectations", owner: "staff_ryan", deadline: d(-53) },
    ],
    overallAssessment: "Immediate action needed",
    followUpDate: d(-45),
  },
  {
    id: "uv_8",
    date: d(-75),
    timeOfVisit: "10:45",
    visitType: "Ofsted",
    visitor: "Helen Carter (Ofsted Inspector)",
    areasInspected: ["safeguarding practice", "staff files", "children's records", "quality of care", "leadership"],
    childrenSpokenTo: ["Casey", "Alex", "Jordan"],
    staffOnDuty: ["staff_darren", "staff_ryan", "staff_anna", "staff_edward"],
    findings: "Monitoring visit as part of ongoing regulatory framework. Inspector reviewed safeguarding processes, staff safer recruitment files, and children's care records. Leadership and management were observed to be effective.",
    positiveObservations: [
      "Safeguarding culture is strong — staff demonstrated good awareness and confidence",
      "Safer recruitment files are compliant and well-organised",
      "Children spoke positively about their care and relationships with staff",
      "Leadership demonstrates reflective practice and continuous improvement",
    ],
    concerns: [
      "One staff file was missing an updated DBS renewal confirmation letter — DBS itself valid but admin gap",
    ],
    actionsRequired: [
      { description: "Obtain and file the DBS renewal confirmation letter for the identified staff member", owner: "staff_darren", deadline: d(-65) },
    ],
    overallAssessment: "Good",
    followUpDate: d(-30),
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function UnannouncedVisitsLogPage() {
  const [data] = useState<UnannouncedVisit[]>(SEED);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<VisitType | "all">("all");

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  /* ── filtered & sorted ─────────────────────────────────────────────────── */
  const processed = useMemo(() => {
    let result = [...data];

    // filter by type
    if (filterType !== "all") {
      result = result.filter((v) => v.visitType === filterType);
    }

    // search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((v) =>
        v.findings.toLowerCase().includes(q) ||
        v.visitType.toLowerCase().includes(q) ||
        v.visitor.toLowerCase().includes(q) ||
        v.areasInspected.some((a) => a.toLowerCase().includes(q)) ||
        v.positiveObservations.some((o) => o.toLowerCase().includes(q)) ||
        v.concerns.some((c) => c.toLowerCase().includes(q))
      );
    }

    // sort
    switch (sortBy) {
      case "date-desc":
        result.sort((a, b) => b.date.localeCompare(a.date));
        break;
      case "date-asc":
        result.sort((a, b) => a.date.localeCompare(b.date));
        break;
      case "type":
        result.sort((a, b) => a.visitType.localeCompare(b.visitType));
        break;
      case "assessment":
        const order: Record<OverallAssessment, number> = { "Immediate action needed": 0, "Requires attention": 1, "Good": 2 };
        result.sort((a, b) => order[a.overallAssessment] - order[b.overallAssessment]);
        break;
    }

    return result;
  }, [data, search, sortBy, filterType]);

  /* ── summary stats ─────────────────────────────────────────────────────── */
  const now = new Date();
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().slice(0, 10);

  const visitsThisQuarter = data.filter((v) => v.date >= quarterStart).length;
  const nightVisits = data.filter((v) => isNightVisit(v.timeOfVisit)).length;
  const outstandingActions = data.reduce(
    (sum, v) => sum + v.actionsRequired.filter((a) => a.deadline >= d(0) || a.deadline >= d(-7)).length,
    0
  );
  const assessmentBreakdown = {
    good: data.filter((v) => v.overallAssessment === "Good").length,
    attention: data.filter((v) => v.overallAssessment === "Requires attention").length,
    immediate: data.filter((v) => v.overallAssessment === "Immediate action needed").length,
  };

  /* ── export columns ────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<UnannouncedVisit>[] = [
    { header: "Date", accessor: (r: UnannouncedVisit) => r.date },
    { header: "Time", accessor: (r: UnannouncedVisit) => r.timeOfVisit },
    { header: "Visit Type", accessor: (r: UnannouncedVisit) => r.visitType },
    { header: "Visitor", accessor: (r: UnannouncedVisit) => r.visitor.startsWith("staff_") ? getStaffName(r.visitor) : r.visitor },
    { header: "Areas Inspected", accessor: (r: UnannouncedVisit) => r.areasInspected.join(", ") },
    { header: "Children Spoken To", accessor: (r: UnannouncedVisit) => r.childrenSpokenTo.join(", ") },
    { header: "Staff On Duty", accessor: (r: UnannouncedVisit) => r.staffOnDuty.map((s: string) => getStaffName(s)).join(", ") },
    { header: "Findings", accessor: (r: UnannouncedVisit) => r.findings },
    { header: "Positive Observations", accessor: (r: UnannouncedVisit) => r.positiveObservations.join("; ") },
    { header: "Concerns", accessor: (r: UnannouncedVisit) => r.concerns.join("; ") },
    { header: "Actions Required", accessor: (r: UnannouncedVisit) => r.actionsRequired.map((a: ActionRequired) => a.description).join("; ") },
    { header: "Overall Assessment", accessor: (r: UnannouncedVisit) => r.overallAssessment },
    { header: "Follow-Up Date", accessor: (r: UnannouncedVisit) => r.followUpDate },
  ];

  return (
    <PageShell
      title="Unannounced Visits Log"
      subtitle="Management, RI, and external oversight visits — demonstrating active monitoring under Regulation 44/45"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Unannounced Visits Log" />
          <ExportButton data={processed} columns={exportCols} filename="unannounced-visits-log" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

        {/* ── Summary stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Visits This Quarter", value: visitsThisQuarter, icon: Calendar, clr: "text-blue-600" },
            { label: "Night Visits", value: nightVisits, icon: Moon, clr: "text-indigo-600" },
            { label: "Outstanding Actions", value: outstandingActions, icon: AlertTriangle, clr: outstandingActions > 0 ? "text-amber-600" : "text-green-600" },
            { label: "Assessment Breakdown", value: `${assessmentBreakdown.good}G / ${assessmentBreakdown.attention}A / ${assessmentBreakdown.immediate}I`, icon: Shield, clr: assessmentBreakdown.immediate > 0 ? "text-red-600" : "text-green-600" },
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

        {/* ── Filters & Sort ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search visits, findings, concerns..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="border rounded-md px-3 py-2 text-sm bg-background"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as VisitType | "all")}
          >
            <option value="all">All visit types</option>
            <option value="RI Monitoring">RI Monitoring</option>
            <option value="Management Spot Check">Management Spot Check</option>
            <option value="External Professional">External Professional</option>
            <option value="Ofsted">Ofsted</option>
          </select>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              className="border rounded-md px-3 py-2 text-sm bg-background"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="type">Visit type</option>
              <option value="assessment">Assessment (urgent first)</option>
            </select>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {processed.length} visit{processed.length !== 1 ? "s" : ""}
        </p>

        {/* ── Visit cards ───────────────────────────────────────────────── */}
        <div className="space-y-3">
          {processed.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Eye className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="font-medium">No visits match your criteria</p>
            </div>
          )}

          {processed.map((visit) => {
            const isOpen = expandedId === visit.id;
            const assessmentClr = ASSESSMENT_CLR[visit.overallAssessment];
            const typeClr = TYPE_CLR[visit.visitType];
            const isNight = isNightVisit(visit.timeOfVisit);
            const borderClr = visit.overallAssessment === "Immediate action needed"
              ? "border-l-red-500"
              : visit.overallAssessment === "Requires attention"
              ? "border-l-amber-400"
              : "border-l-green-400";

            return (
              <Card key={visit.id} className={cn("border-l-4", borderClr)}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(visit.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {fmt(visit.date)} at {visit.timeOfVisit}
                        {isNight && <Moon className="h-3.5 w-3.5 text-indigo-500" />}
                        <Badge variant="outline" className={typeClr}>
                          {visit.visitType}
                        </Badge>
                        <Badge variant="outline" className={assessmentClr}>
                          {visit.overallAssessment}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {visit.visitor.startsWith("staff_") ? getStaffName(visit.visitor) : visit.visitor}
                        {" · "}
                        {visit.areasInspected.length} area{visit.areasInspected.length !== 1 ? "s" : ""} inspected
                        {visit.childrenSpokenTo.length > 0 && ` · ${visit.childrenSpokenTo.length} child${visit.childrenSpokenTo.length !== 1 ? "ren" : ""} spoken to`}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* Areas inspected */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <ClipboardList className="h-3.5 w-3.5" /> Areas Inspected
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {visit.areasInspected.map((area) => (
                          <Badge key={area} variant="outline" className="text-xs bg-slate-50">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Staff on duty */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> Staff on Duty
                      </p>
                      <p className="text-muted-foreground">
                        {visit.staffOnDuty.map((s) => getStaffName(s)).join(", ")}
                      </p>
                    </div>

                    {/* Children spoken to */}
                    {visit.childrenSpokenTo.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Children Spoken To</p>
                        <p className="text-muted-foreground">{visit.childrenSpokenTo.join(", ")}</p>
                      </div>
                    )}

                    {/* Findings */}
                    <div>
                      <p className="font-medium mb-1">Findings</p>
                      <p className="text-muted-foreground">{visit.findings}</p>
                    </div>

                    {/* Positive observations */}
                    {visit.positiveObservations.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="font-medium text-green-800 mb-2 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Positive Observations
                        </p>
                        <ul className="space-y-1">
                          {visit.positiveObservations.map((obs, i) => (
                            <li key={i} className="text-green-700 text-xs flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
                              {obs}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Concerns */}
                    {visit.concerns.length > 0 && (
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="font-medium text-amber-800 mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Concerns
                        </p>
                        <ul className="space-y-1">
                          {visit.concerns.map((concern, i) => (
                            <li key={i} className="text-amber-700 text-xs flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                              {concern}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions required */}
                    {visit.actionsRequired.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="font-medium text-blue-800 mb-2 flex items-center gap-1">
                          <ClipboardList className="h-3.5 w-3.5" /> Actions Required
                        </p>
                        <div className="space-y-2">
                          {visit.actionsRequired.map((action, i) => (
                            <div key={i} className="text-xs bg-white rounded p-2 border border-blue-100">
                              <p className="text-blue-900 font-medium">{action.description}</p>
                              <p className="text-blue-600 mt-1">
                                Owner: {action.owner.startsWith("staff_") ? getStaffName(action.owner) : action.owner}
                                {" · "}Deadline: {fmt(action.deadline)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow-up */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
                      <Clock className="h-3.5 w-3.5" />
                      Follow-up due: {fmt(visit.followUpDate)}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── Regulatory note ──────────────────────────────────────────── */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-slate-700 flex items-center gap-1.5 mb-2">
              <Shield className="h-3.5 w-3.5" /> Regulatory Framework
            </p>
            <ul className="text-xs text-slate-600 space-y-1">
              <li><span className="font-medium">Regulation 44</span> — An independent person must visit the home at least once per month and produce a written report on the conduct of the home.</li>
              <li><span className="font-medium">Regulation 45</span> — The registered person must review the quality of care at least every 6 months and produce a written report, consulting the independent visitor&apos;s reports.</li>
              <li><span className="font-medium">Quality Standard 25</span> — The registered person ensures effective governance, with systems to monitor the quality of care and address shortfalls promptly.</li>
            </ul>
            <p className="text-xs text-slate-500 mt-2">
              Unannounced visits at varied times (including nights and weekends) demonstrate robust oversight and ensure standards are consistently maintained outside of planned visits.
            </p>
          </CardContent>
        </Card>

      </div>
    </PageShell>
  );
}
