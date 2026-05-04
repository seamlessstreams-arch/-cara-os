"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search, ChevronDown, ChevronUp, ArrowUpDown, Calendar,
  Clock, AlertTriangle, CheckCircle2, Shield, UserCheck,
  ClipboardList, Eye, Users, FileText, MessageSquare,
  Home, BookOpen, Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type VisitType =
  | "First visit (within 7 days)"
  | "First 6-week review"
  | "Routine 6-weekly"
  | "Quarterly"
  | "Six-monthly"
  | "Pre-LAC review"
  | "Unannounced";

type ChildPresented = "Settled" | "Anxious" | "Withdrawn" | "Engaged" | "Distressed";

interface ActionAgreed {
  action: string;
  owner: string;
  deadline: string;
}

interface StatutoryVisit {
  id: string;
  youngPerson: string;
  date: string;
  visitType: VisitType;
  socialWorker: string;
  localAuthority: string;
  durationMinutes: number;
  sawChildAlone: boolean;
  aloneTime: number;
  childWishesShared: string;
  homeStaffPresent: string[];
  areasInspected: string[];
  bedroomsSeen: boolean;
  recordsReviewed: string[];
  childPresented: ChildPresented;
  keyDiscussions: string[];
  socialWorkerObservations: string;
  actionsAgreed: ActionAgreed[];
  nextVisitDue: string;
  reportFiledDate: string;
  withinTimeframe: boolean;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const fmt = (iso: string) => {
  if (!iso) return "—";
  const [y, m, day] = iso.split("-");
  return `${day}/${m}/${y}`;
};

const PRESENTED_CLR: Record<ChildPresented, string> = {
  "Settled": "bg-green-100 text-green-800",
  "Engaged": "bg-emerald-100 text-emerald-800",
  "Anxious": "bg-amber-100 text-amber-800",
  "Withdrawn": "bg-slate-100 text-slate-700",
  "Distressed": "bg-red-100 text-red-800",
};

const TYPE_CLR: Record<VisitType, string> = {
  "First visit (within 7 days)": "bg-purple-100 text-purple-800",
  "First 6-week review": "bg-indigo-100 text-indigo-800",
  "Routine 6-weekly": "bg-blue-100 text-blue-800",
  "Quarterly": "bg-cyan-100 text-cyan-800",
  "Six-monthly": "bg-teal-100 text-teal-800",
  "Pre-LAC review": "bg-violet-100 text-violet-800",
  "Unannounced": "bg-rose-100 text-rose-800",
};

type SortOption = "date-desc" | "date-asc" | "due-soonest" | "type" | "child";

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: StatutoryVisit[] = [
  {
    id: "sv_1",
    youngPerson: "yp_alex",
    date: d(-3),
    visitType: "Routine 6-weekly",
    socialWorker: "Jenna Brown",
    localAuthority: "Birmingham Children's Trust",
    durationMinutes: 95,
    sawChildAlone: true,
    aloneTime: 35,
    childWishesShared: "Alex would like more contact with his older sister and asked about visiting home for his birthday in three weeks. He is settled and wants to remain at Oak House.",
    homeStaffPresent: ["staff_darren", "staff_anna"],
    areasInspected: ["bedroom", "living areas", "kitchen", "outdoor space"],
    bedroomsSeen: true,
    recordsReviewed: ["care plan", "PEP", "key working notes", "incident log"],
    childPresented: "Settled",
    keyDiscussions: [
      "Family contact arrangements and birthday plans",
      "Progress at school and engagement with PEP targets",
      "Friendships and social activities outside the home",
      "Any worries or wishes Alex wants reflected in his care plan",
    ],
    socialWorkerObservations: "Alex appears settled and well-cared-for. Bedroom is personalised and reflects his interests. Strong, warm relationships observed with staff. Care plan goals are being progressed effectively.",
    actionsAgreed: [
      { action: "Arrange supervised contact with sister within 14 days", owner: "Jenna Brown", deadline: d(11) },
      { action: "Update care plan to include birthday family time", owner: "staff_darren", deadline: d(7) },
    ],
    nextVisitDue: d(39),
    reportFiledDate: d(-1),
    withinTimeframe: true,
  },
  {
    id: "sv_2",
    youngPerson: "yp_jordan",
    date: d(-9),
    visitType: "Routine 6-weekly",
    socialWorker: "Mark Thompson",
    localAuthority: "Solihull MBC",
    durationMinutes: 80,
    sawChildAlone: true,
    aloneTime: 25,
    childWishesShared: "Jordan shared that he is enjoying the new football club and wants to keep going. He asked whether he could have a phone upgrade for Christmas.",
    homeStaffPresent: ["staff_ryan"],
    areasInspected: ["bedroom", "communal lounge", "study area"],
    bedroomsSeen: true,
    recordsReviewed: ["care plan", "PEP", "behaviour support plan", "medication records"],
    childPresented: "Engaged",
    keyDiscussions: [
      "PEP progress and EHCP review preparation",
      "Engagement with football club and social skills development",
      "Coping strategies and use of behaviour support plan",
      "Family contact with mum (currently fortnightly)",
    ],
    socialWorkerObservations: "Jordan was open, chatty, and clearly proud of recent achievements. Behaviour support plan being implemented consistently with positive impact. Records well-maintained and reflective.",
    actionsAgreed: [
      { action: "Confirm EHCP review date with school SENCo", owner: "Mark Thompson", deadline: d(14) },
    ],
    nextVisitDue: d(33),
    reportFiledDate: d(-7),
    withinTimeframe: true,
  },
  {
    id: "sv_3",
    youngPerson: "yp_casey",
    date: d(-14),
    visitType: "First 6-week review",
    socialWorker: "Priya Sharma",
    localAuthority: "Coventry City Council",
    durationMinutes: 110,
    sawChildAlone: true,
    aloneTime: 45,
    childWishesShared: "Casey said she feels safe at Oak House and likes the staff team. She would like to start drama club and would prefer fewer professionals at her LAC review.",
    homeStaffPresent: ["staff_darren", "staff_anna"],
    areasInspected: ["bedroom", "kitchen", "garden", "quiet room"],
    bedroomsSeen: true,
    recordsReviewed: ["placement plan", "care plan", "key working notes", "health passport", "PEP"],
    childPresented: "Settled",
    keyDiscussions: [
      "Casey's first six weeks — settling in and forming relationships",
      "Aspirations and goals — including drama club interest",
      "Preparation for upcoming LAC review and Casey's preferred format",
      "Therapy referral progress (CAMHS waitlist)",
    ],
    socialWorkerObservations: "Casey has settled remarkably well. Strong attachment forming with key worker. Placement plan goals on track. Casey's voice is clearly evidenced throughout records.",
    actionsAgreed: [
      { action: "Source local drama club and complete consent paperwork", owner: "staff_anna", deadline: d(7) },
      { action: "Chase CAMHS regarding waitlist position", owner: "Priya Sharma", deadline: d(10) },
      { action: "Plan child-friendly LAC review format with Casey", owner: "staff_darren", deadline: d(20) },
    ],
    nextVisitDue: d(28),
    reportFiledDate: d(-12),
    withinTimeframe: true,
  },
  {
    id: "sv_4",
    youngPerson: "yp_alex",
    date: d(-46),
    visitType: "Routine 6-weekly",
    socialWorker: "Jenna Brown",
    localAuthority: "Birmingham Children's Trust",
    durationMinutes: 75,
    sawChildAlone: true,
    aloneTime: 20,
    childWishesShared: "Alex was quieter than usual but said he is OK. He raised a concern about a peer at school and asked staff to support him with this.",
    homeStaffPresent: ["staff_darren"],
    areasInspected: ["bedroom", "living areas"],
    bedroomsSeen: true,
    recordsReviewed: ["care plan", "PEP", "incident log"],
    childPresented: "Anxious",
    keyDiscussions: [
      "School-based peer concern and any safeguarding implications",
      "Family contact and recent missed phone call from sister",
      "Sleep and emotional regulation",
    ],
    socialWorkerObservations: "Alex appeared subdued. The peer concern at school is being well-managed by Oak House and the school. Staff aware and providing additional emotional support. Recommend tracking mood over coming weeks.",
    actionsAgreed: [
      { action: "Schedule key working session focused on peer concern", owner: "staff_anna", deadline: d(-40) },
      { action: "Liaise with school pastoral lead", owner: "Jenna Brown", deadline: d(-39) },
    ],
    nextVisitDue: d(-4),
    reportFiledDate: d(-43),
    withinTimeframe: true,
  },
  {
    id: "sv_5",
    youngPerson: "yp_jordan",
    date: d(-58),
    visitType: "Quarterly",
    socialWorker: "Mark Thompson",
    localAuthority: "Solihull MBC",
    durationMinutes: 100,
    sawChildAlone: false,
    aloneTime: 0,
    childWishesShared: "Jordan declined to speak alone with the social worker on this visit, stating he was tired. He said he is happy and has nothing to raise.",
    homeStaffPresent: ["staff_darren", "staff_ryan"],
    areasInspected: ["bedroom", "lounge", "kitchen", "garden"],
    bedroomsSeen: true,
    recordsReviewed: ["care plan", "PEP", "behaviour support plan", "incident log", "medication records"],
    childPresented: "Withdrawn",
    keyDiscussions: [
      "Three-month placement progress overall",
      "Education attendance and engagement",
      "Mum's contact pattern — recent inconsistency",
      "Jordan's preferences for social worker visit format going forward",
    ],
    socialWorkerObservations: "Important note: Jordan declined alone time with SW. This will be reattempted at next visit. Otherwise placement progress is positive. Records up to date and reflective.",
    actionsAgreed: [
      { action: "SW to attempt alone time again at next visit and offer alternative settings (e.g. walk)", owner: "Mark Thompson", deadline: d(-15) },
      { action: "Discuss contact inconsistency with Jordan's mum", owner: "Mark Thompson", deadline: d(-50) },
    ],
    nextVisitDue: d(-16),
    reportFiledDate: d(-55),
    withinTimeframe: true,
  },
  {
    id: "sv_6",
    youngPerson: "yp_casey",
    date: d(-55),
    visitType: "First visit (within 7 days)",
    socialWorker: "Priya Sharma",
    localAuthority: "Coventry City Council",
    durationMinutes: 130,
    sawChildAlone: true,
    aloneTime: 30,
    childWishesShared: "Casey said the home is bigger than she expected and she likes her bedroom. She is missing her younger brother and would like to know when she can see him.",
    homeStaffPresent: ["staff_darren", "staff_anna"],
    areasInspected: ["bedroom", "kitchen", "lounge", "garden", "bathroom"],
    bedroomsSeen: true,
    recordsReviewed: ["placement plan", "admission paperwork", "initial care plan"],
    childPresented: "Anxious",
    keyDiscussions: [
      "Initial impressions of Oak House and the staff team",
      "Sibling contact arrangements — priority for Casey",
      "Education plan and school transition",
      "Health needs and outstanding appointments",
    ],
    socialWorkerObservations: "Statutory first visit completed within 7 days. Casey understandably anxious but engaged. Welcoming, child-centred environment. Sibling contact must be prioritised.",
    actionsAgreed: [
      { action: "Establish sibling contact plan within 14 days", owner: "Priya Sharma", deadline: d(-41) },
      { action: "Confirm school start date and transport", owner: "staff_darren", deadline: d(-50) },
      { action: "Book initial health assessment", owner: "staff_anna", deadline: d(-48) },
    ],
    nextVisitDue: d(-13),
    reportFiledDate: d(-52),
    withinTimeframe: true,
  },
  {
    id: "sv_7",
    youngPerson: "yp_alex",
    date: d(-90),
    visitType: "Six-monthly",
    socialWorker: "Jenna Brown",
    localAuthority: "Birmingham Children's Trust",
    durationMinutes: 120,
    sawChildAlone: true,
    aloneTime: 40,
    childWishesShared: "Alex described feeling settled and proud of his progress at school. He shared that he sometimes worries about his future and what will happen when he turns 16.",
    homeStaffPresent: ["staff_darren"],
    areasInspected: ["bedroom", "all communal areas", "garden"],
    bedroomsSeen: true,
    recordsReviewed: ["care plan", "PEP", "key working notes", "all incident logs", "health record", "pathway plan draft"],
    childPresented: "Engaged",
    keyDiscussions: [
      "Six-month placement review — progress, stability, identity",
      "Pathway planning and preparation for adulthood (PfA)",
      "Long-term family contact arrangements",
      "Independence skills development",
    ],
    socialWorkerObservations: "Alex has made significant progress over six months. Placement is highly stable and well-matched. Pathway planning should now be initiated formally given Alex's age. Strong evidence base across all records.",
    actionsAgreed: [
      { action: "Initiate formal pathway plan with leaving care team", owner: "Jenna Brown", deadline: d(-75) },
      { action: "Begin independence skills programme", owner: "staff_anna", deadline: d(-80) },
    ],
    nextVisitDue: d(-48),
    reportFiledDate: d(-87),
    withinTimeframe: true,
  },
  {
    id: "sv_8",
    youngPerson: "yp_casey",
    date: d(-30),
    visitType: "Pre-LAC review",
    socialWorker: "Priya Sharma",
    localAuthority: "Coventry City Council",
    durationMinutes: 90,
    sawChildAlone: true,
    aloneTime: 30,
    childWishesShared: "Casey shared her views for the LAC review using a 'My Views' form. Key wishes: stay at Oak House, more frequent sibling contact, and choosing her own clothes budget.",
    homeStaffPresent: ["staff_darren"],
    areasInspected: ["bedroom", "lounge"],
    bedroomsSeen: true,
    recordsReviewed: ["care plan", "key working notes", "child's views form", "health passport"],
    childPresented: "Engaged",
    keyDiscussions: [
      "Casey's wishes and feelings ahead of LAC review",
      "Progress against placement plan goals",
      "Format and attendance for the LAC review meeting",
      "Sibling contact escalation",
    ],
    socialWorkerObservations: "Excellent preparation by the home. Casey clearly knows her rights and feels heard. 'My Views' form completed thoughtfully. Recommend LAC review chair receives this report in advance.",
    actionsAgreed: [
      { action: "Submit visit report to IRO before LAC review", owner: "Priya Sharma", deadline: d(-25) },
      { action: "Set up child-led portion of LAC review", owner: "staff_darren", deadline: d(-23) },
    ],
    nextVisitDue: d(12),
    reportFiledDate: "",
    withinTimeframe: false,
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function StatutoryVisitLogPage() {
  const [data] = useState<StatutoryVisit[]>(SEED);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterChild, setFilterChild] = useState<string>("all");
  const [filterType, setFilterType] = useState<VisitType | "all">("all");

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  /* ── filtered & sorted ─────────────────────────────────────────────────── */
  const processed = useMemo(() => {
    let result = [...data];

    if (filterChild !== "all") {
      result = result.filter((v) => v.youngPerson === filterChild);
    }
    if (filterType !== "all") {
      result = result.filter((v) => v.visitType === filterType);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((v) =>
        v.socialWorker.toLowerCase().includes(q) ||
        v.localAuthority.toLowerCase().includes(q) ||
        v.visitType.toLowerCase().includes(q) ||
        v.childWishesShared.toLowerCase().includes(q) ||
        v.socialWorkerObservations.toLowerCase().includes(q) ||
        v.keyDiscussions.some((k) => k.toLowerCase().includes(q))
      );
    }

    switch (sortBy) {
      case "date-desc":
        result.sort((a, b) => b.date.localeCompare(a.date));
        break;
      case "date-asc":
        result.sort((a, b) => a.date.localeCompare(b.date));
        break;
      case "due-soonest":
        result.sort((a, b) => a.nextVisitDue.localeCompare(b.nextVisitDue));
        break;
      case "type":
        result.sort((a, b) => a.visitType.localeCompare(b.visitType));
        break;
      case "child":
        result.sort((a, b) => a.youngPerson.localeCompare(b.youngPerson));
        break;
    }

    return result;
  }, [data, search, sortBy, filterChild, filterType]);

  /* ── summary stats ─────────────────────────────────────────────────────── */
  const today = d(0);
  const monthStart = today.slice(0, 7) + "-01";
  const visitsThisMonth = data.filter((v) => v.date >= monthStart).length;

  const aloneCount = data.filter((v) => v.sawChildAlone).length;
  const alonePct = data.length > 0 ? Math.round((aloneCount / data.length) * 100) : 0;

  const onTimeCount = data.filter((v) => v.withinTimeframe).length;
  const onTimePct = data.length > 0 ? Math.round((onTimeCount / data.length) * 100) : 0;

  // closest next visit due (per young person)
  const nextDueByChild = ["yp_alex", "yp_jordan", "yp_casey"].map((yp) => {
    const visits = data.filter((v) => v.youngPerson === yp);
    if (visits.length === 0) return null;
    const latest = visits.sort((a, b) => b.date.localeCompare(a.date))[0];
    return { yp, due: latest.nextVisitDue };
  }).filter((x): x is { yp: string; due: string } => x !== null);

  const closestDue = nextDueByChild.length > 0
    ? nextDueByChild.reduce((min, cur) => cur.due < min.due ? cur : min)
    : null;

  // overdue / unfiled
  const overdueVisits = nextDueByChild.filter((n) => n.due < today);
  const unfiledReports = data.filter((v) => !v.reportFiledDate);
  const declinedAlone = data.filter((v) => !v.sawChildAlone);

  /* ── export columns ────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<StatutoryVisit>[] = [
    { header: "Date", accessor: (r: StatutoryVisit) => r.date },
    { header: "Young Person", accessor: (r: StatutoryVisit) => getYPName(r.youngPerson) },
    { header: "Visit Type", accessor: (r: StatutoryVisit) => r.visitType },
    { header: "Social Worker", accessor: (r: StatutoryVisit) => r.socialWorker },
    { header: "Local Authority", accessor: (r: StatutoryVisit) => r.localAuthority },
    { header: "Duration (mins)", accessor: (r: StatutoryVisit) => String(r.durationMinutes) },
    { header: "Saw Child Alone", accessor: (r: StatutoryVisit) => r.sawChildAlone ? "Yes" : "No" },
    { header: "Alone Time (mins)", accessor: (r: StatutoryVisit) => String(r.aloneTime) },
    { header: "Child's Wishes", accessor: (r: StatutoryVisit) => r.childWishesShared },
    { header: "Home Staff Present", accessor: (r: StatutoryVisit) => r.homeStaffPresent.map((s: string) => getStaffName(s)).join(", ") },
    { header: "Areas Inspected", accessor: (r: StatutoryVisit) => r.areasInspected.join(", ") },
    { header: "Bedrooms Seen", accessor: (r: StatutoryVisit) => r.bedroomsSeen ? "Yes" : "No" },
    { header: "Records Reviewed", accessor: (r: StatutoryVisit) => r.recordsReviewed.join(", ") },
    { header: "Child Presented", accessor: (r: StatutoryVisit) => r.childPresented },
    { header: "Key Discussions", accessor: (r: StatutoryVisit) => r.keyDiscussions.join("; ") },
    { header: "SW Observations", accessor: (r: StatutoryVisit) => r.socialWorkerObservations },
    { header: "Actions Agreed", accessor: (r: StatutoryVisit) => r.actionsAgreed.map((a: ActionAgreed) => `${a.action} (owner: ${a.owner.startsWith("staff_") ? getStaffName(a.owner) : a.owner}, by ${a.deadline})`).join("; ") },
    { header: "Next Visit Due", accessor: (r: StatutoryVisit) => r.nextVisitDue },
    { header: "Report Filed", accessor: (r: StatutoryVisit) => r.reportFiledDate || "Not filed" },
    { header: "Within Timeframe", accessor: (r: StatutoryVisit) => r.withinTimeframe ? "Yes" : "No" },
  ];

  return (
    <PageShell
      title="Statutory Visit Log"
      subtitle="Local authority social worker visits to each child — Care Planning Regulations 2010 and Quality Standard 4"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Statutory Visit Log" />
          <ExportButton data={processed} columns={exportCols} filename="statutory-visit-log" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

        {/* ── Summary stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Visits This Month", value: visitsThisMonth, icon: Calendar, clr: "text-blue-600" },
            { label: "Saw Child Alone", value: `${alonePct}%`, icon: UserCheck, clr: alonePct >= 80 ? "text-green-600" : "text-amber-600" },
            { label: "Within Timeframe", value: `${onTimePct}%`, icon: CheckCircle2, clr: onTimePct >= 90 ? "text-green-600" : "text-amber-600" },
            {
              label: "Next Visit Due",
              value: closestDue ? fmt(closestDue.due) : "—",
              icon: Clock,
              clr: closestDue && closestDue.due < today ? "text-red-600" : "text-blue-600",
              sub: closestDue ? getYPName(closestDue.yp) : undefined,
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                {s.sub && <p className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Alerts ────────────────────────────────────────────────────── */}
        {(overdueVisits.length > 0 || unfiledReports.length > 0 || declinedAlone.length > 0) && (
          <div className="space-y-2">
            {overdueVisits.length > 0 && (
              <Card className="border-l-4 border-l-red-500 bg-red-50">
                <CardContent className="pt-3 pb-3">
                  <p className="text-sm font-medium text-red-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {overdueVisits.length} child{overdueVisits.length !== 1 ? "ren have" : " has"} an overdue statutory visit
                  </p>
                  <ul className="text-xs text-red-700 mt-1.5 space-y-0.5">
                    {overdueVisits.map((o) => (
                      <li key={o.yp}>· {getYPName(o.yp)} — was due {fmt(o.due)}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {unfiledReports.length > 0 && (
              <Card className="border-l-4 border-l-amber-400 bg-amber-50">
                <CardContent className="pt-3 pb-3">
                  <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {unfiledReports.length} visit report{unfiledReports.length !== 1 ? "s" : ""} not yet filed by social worker
                  </p>
                  <ul className="text-xs text-amber-700 mt-1.5 space-y-0.5">
                    {unfiledReports.map((u) => (
                      <li key={u.id}>· {getYPName(u.youngPerson)} — visit {fmt(u.date)} ({u.socialWorker})</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {declinedAlone.length > 0 && (
              <Card className="border-l-4 border-l-amber-400 bg-amber-50">
                <CardContent className="pt-3 pb-3">
                  <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    {declinedAlone.length} visit{declinedAlone.length !== 1 ? "s" : ""} where SW did not see child alone
                  </p>
                  <p className="text-xs text-amber-700 mt-1.5">
                    Statutory expectation is that SW sees and speaks with the child alone unless the child refuses or it is contrary to their welfare.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Filters & Sort ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search visits, SW, observations..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={filterChild} onValueChange={setFilterChild}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All children" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All children</SelectItem>
              <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
              <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
              <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={(v) => setFilterType(v as VisitType | "all")}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All visit types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All visit types</SelectItem>
              <SelectItem value="First visit (within 7 days)">First visit (within 7 days)</SelectItem>
              <SelectItem value="First 6-week review">First 6-week review</SelectItem>
              <SelectItem value="Routine 6-weekly">Routine 6-weekly</SelectItem>
              <SelectItem value="Quarterly">Quarterly</SelectItem>
              <SelectItem value="Six-monthly">Six-monthly</SelectItem>
              <SelectItem value="Pre-LAC review">Pre-LAC review</SelectItem>
              <SelectItem value="Unannounced">Unannounced</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest first</SelectItem>
                <SelectItem value="date-asc">Oldest first</SelectItem>
                <SelectItem value="due-soonest">Next due soonest</SelectItem>
                <SelectItem value="type">Visit type</SelectItem>
                <SelectItem value="child">Young person</SelectItem>
              </SelectContent>
            </Select>
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
            const presentedClr = PRESENTED_CLR[visit.childPresented];
            const typeClr = TYPE_CLR[visit.visitType];
            const isOverdue = visit.nextVisitDue < today;
            const reportLate = !visit.reportFiledDate;

            const borderClr = !visit.withinTimeframe || reportLate
              ? "border-l-red-500"
              : !visit.sawChildAlone
              ? "border-l-amber-400"
              : "border-l-green-400";

            return (
              <Card key={visit.id} className={cn("border-l-4", borderClr)}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(visit.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(visit.youngPerson)}
                        <span className="text-muted-foreground font-normal text-sm">·</span>
                        <span className="text-sm font-normal text-muted-foreground">{fmt(visit.date)}</span>
                        <Badge variant="outline" className={typeClr}>
                          {visit.visitType}
                        </Badge>
                        <Badge variant="outline" className={presentedClr}>
                          Presented: {visit.childPresented}
                        </Badge>
                        {visit.sawChildAlone ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            <UserCheck className="h-3 w-3 mr-0.5" /> Saw alone {visit.aloneTime}m
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800">
                            <AlertTriangle className="h-3 w-3 mr-0.5" /> Not seen alone
                          </Badge>
                        )}
                        {!visit.withinTimeframe && (
                          <Badge variant="outline" className="bg-red-100 text-red-800">
                            Out of timeframe
                          </Badge>
                        )}
                        {reportLate && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800">
                            Report not filed
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        SW: {visit.socialWorker} · {visit.localAuthority} · {visit.durationMinutes} mins
                        {" · "}Next due: <span className={cn(isOverdue && "text-red-600 font-medium")}>{fmt(visit.nextVisitDue)}</span>
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* Child's wishes & feelings */}
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="font-medium text-purple-800 mb-1 flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" /> Child&apos;s Wishes &amp; Feelings
                      </p>
                      <p className="text-purple-700 text-xs">{visit.childWishesShared}</p>
                    </div>

                    {/* Areas inspected & bedrooms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <Home className="h-3.5 w-3.5" /> Areas Inspected
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {visit.areasInspected.map((area) => (
                            <Badge key={area} variant="outline" className="text-xs bg-slate-50">
                              {area}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Bedroom seen: <span className={cn("font-medium", visit.bedroomsSeen ? "text-green-700" : "text-red-700")}>{visit.bedroomsSeen ? "Yes" : "No"}</span>
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" /> Records Reviewed
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {visit.recordsReviewed.map((rec) => (
                            <Badge key={rec} variant="outline" className="text-xs bg-slate-50">
                              {rec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Home staff present */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> Home Staff Present
                      </p>
                      <p className="text-muted-foreground">
                        {visit.homeStaffPresent.length > 0
                          ? visit.homeStaffPresent.map((s) => getStaffName(s)).join(", ")
                          : "None recorded"}
                      </p>
                    </div>

                    {/* Key discussions */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" /> Key Discussions
                      </p>
                      <ul className="space-y-1">
                        {visit.keyDiscussions.map((kd, i) => (
                          <li key={i} className="text-muted-foreground text-xs flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                            {kd}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* SW observations */}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="font-medium text-blue-800 mb-1 flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> Social Worker Observations
                      </p>
                      <p className="text-blue-700 text-xs">{visit.socialWorkerObservations}</p>
                    </div>

                    {/* Actions agreed */}
                    {visit.actionsAgreed.length > 0 && (
                      <div className="bg-emerald-50 rounded-lg p-3">
                        <p className="font-medium text-emerald-800 mb-2 flex items-center gap-1">
                          <ClipboardList className="h-3.5 w-3.5" /> Actions Agreed
                        </p>
                        <div className="space-y-2">
                          {visit.actionsAgreed.map((a, i) => (
                            <div key={i} className="text-xs bg-white rounded p-2 border border-emerald-100">
                              <p className="text-emerald-900 font-medium">{a.action}</p>
                              <p className="text-emerald-600 mt-1">
                                Owner: {a.owner.startsWith("staff_") ? getStaffName(a.owner) : a.owner}
                                {" · "}Deadline: {fmt(a.deadline)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compliance footer */}
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-2 border-t flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Next visit due: <span className={cn(isOverdue && "text-red-600 font-medium")}>{fmt(visit.nextVisitDue)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        Report filed: {visit.reportFiledDate ? fmt(visit.reportFiledDate) : <span className="text-amber-600 font-medium">Not yet filed</span>}
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5" />
                        Within timeframe: <span className={cn("font-medium", visit.withinTimeframe ? "text-green-700" : "text-red-700")}>{visit.withinTimeframe ? "Yes" : "No"}</span>
                      </span>
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
              <li><span className="font-medium">Care Planning, Placement &amp; Case Review (England) Regulations 2010, Reg 28</span> — Statutory visiting duties: the responsible authority must ensure a visit by a representative within 7 working days of placement, then within 6 weeks, then at intervals of not more than 6 weeks during the first year, and thereafter at intervals of not more than 3 months (or more often if the placement plan or child requires).</li>
              <li><span className="font-medium">Reg 28(4)</span> — On each visit the representative must, so far as reasonably practicable, see and speak to the child alone (unless the child, being of sufficient age and understanding, refuses).</li>
              <li><span className="font-medium">Quality Standard 4 (Children&apos;s Homes Regulations 2015)</span> — The enjoyment and achievement standard requires the home to support each child to participate in decisions about their care and have their wishes and feelings heard.</li>
              <li><span className="font-medium">Quality Standard 5</span> — The home enables children to maintain and develop relationships with those important to them, including their social worker, and supports effective placement reviews.</li>
            </ul>
            <p className="text-xs text-slate-500 mt-2">
              The home keeps its own log of statutory visits to evidence active partnership with placing authorities, monitor compliance with statutory timeframes, and ensure each child&apos;s voice is consistently captured.
            </p>
          </CardContent>
        </Card>

      </div>
    </PageShell>
  );
}
