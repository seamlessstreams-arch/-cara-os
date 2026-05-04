"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Calendar, FileText, GraduationCap,
  Heart, Home, Briefcase, Users, Target, ShieldAlert, Wrench, Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type PlanStatus =
  | "Pre-pathway (15+)"
  | "Active 16-18"
  | "Active 18+ (formerly looked after)"
  | "Closed at 25";

type SkillLevel = "Established" | "Developing" | "Emerging" | "Not yet";

interface PathwayPlan {
  id: string;
  youngPerson: string; // yp ID (or empty if historical)
  childInitials: string; // anonymised initials for historical/future plans
  age: number;
  status: PlanStatus;
  planVersion: string;
  lastReviewDate: string;
  personalAdvisor: string;
  socialWorker: string;
  accommodation: string;
  educationEmploymentTraining: string;
  healthNeeds: string[];
  financialSupport: string[];
  supportNetwork: string[];
  aspirations: string[];
  risks: string[];
  independentLivingSkills: Record<string, SkillLevel>;
  nextReviewDate: string;
  contactArrangements: string;
  statutory16PlusReviewSchedule: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const STATUS_CLR: Record<PlanStatus, string> = {
  "Pre-pathway (15+)": "bg-amber-100 text-amber-800",
  "Active 16-18": "bg-blue-100 text-blue-800",
  "Active 18+ (formerly looked after)": "bg-purple-100 text-purple-800",
  "Closed at 25": "bg-green-100 text-green-800",
};

const STATUS_BORDER: Record<PlanStatus, string> = {
  "Pre-pathway (15+)": "border-amber-400 bg-amber-50",
  "Active 16-18": "border-blue-400 bg-blue-50",
  "Active 18+ (formerly looked after)": "border-purple-400 bg-purple-50",
  "Closed at 25": "border-green-400 bg-green-50",
};

const SKILL_CLR: Record<SkillLevel, string> = {
  Established: "bg-green-100 text-green-800",
  Developing: "bg-blue-100 text-blue-800",
  Emerging: "bg-amber-100 text-amber-800",
  "Not yet": "bg-gray-100 text-gray-700",
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: PathwayPlan[] = [
  {
    id: "pp1",
    youngPerson: "",
    childInitials: "M.T. (former Oak House)",
    age: 15,
    status: "Pre-pathway (15+)",
    planVersion: "v0.2 — Draft pre-pathway",
    lastReviewDate: d(-21),
    personalAdvisor: "TBC — to be allocated at 16th birthday by Millbrook Leaving Care Team",
    socialWorker: "Helena Marsh — Millbrook Children's Social Care",
    accommodation: "Maple View Foster Placement (Mr & Mrs Holloway) — moved from Oak House Apr 2026 following long-term matching",
    educationEmploymentTraining: "Year 11 at Millbrook High — predicted Grade 5 in English, Grade 4 in Maths. Aspiration: Level 2 Public Services course.",
    healthNeeds: [
      "Annual LAC health assessment due Jun 2026",
      "Mild eczema — managed with prescribed emollient",
      "Emotional wellbeing — bi-monthly CAMHS check-ins continue",
    ],
    financialSupport: [
      "Junior ISA held by LA — current balance £1,840",
      "Setting Up Home Allowance entitlement noted for 18+",
      "Pocket money £15/week via foster carer",
    ],
    supportNetwork: [
      "Foster carers Mr & Mrs Holloway — primary attachment",
      "Birth grandmother (supervised contact monthly)",
      "Darren Laville (former RM, Oak House) — Staying Close mentor",
      "School pastoral lead Mrs Ahmed",
    ],
    aspirations: [
      "Complete GCSEs",
      "Join the Army Cadet Force as a step toward Public Services career",
      "Learn to drive at 17",
      "Maintain relationship with former Oak House peers",
    ],
    risks: [
      "Transition anxiety as 16th birthday approaches",
      "Potential placement breakdown if unsupported around exam stress",
    ],
    independentLivingSkills: {
      "Cooking simple meals": "Developing",
      "Budgeting & money management": "Emerging",
      "Laundry & household tasks": "Developing",
      "Personal hygiene & self-care": "Established",
      "Travel & navigation": "Developing",
      "Healthcare self-management": "Emerging",
      "Tenancy & housing literacy": "Not yet",
      "Job-search & CV skills": "Not yet",
    },
    nextReviewDate: d(28),
    contactArrangements: "Quarterly Staying Close calls with Darren (Oak House). Foster carer to host former peer visit at half-term.",
    statutory16PlusReviewSchedule: "Pre-pathway review pre-16th birthday; first formal Pathway Plan within 3 months of 16th birthday; thereafter every 6 months.",
  },
  {
    id: "pp2",
    youngPerson: "",
    childInitials: "S.L. (former Oak House)",
    age: 17,
    status: "Active 16-18",
    planVersion: "v3.1",
    lastReviewDate: d(-45),
    personalAdvisor: "Gemma Woodford — Millbrook Leaving Care Team",
    socialWorker: "Michael Osei — Millbrook Children's Social Care",
    accommodation: "Supported semi-independent living — Beacon Lodge, room 4 (Fresh Start Housing). Tenancy training package in place.",
    educationEmploymentTraining: "Level 2 Health & Social Care at Millbrook College (Year 1, attendance 92%). Saturday job at Costa Coffee (8 hrs/week).",
    healthNeeds: [
      "Registered with Bridge Street GP",
      "Asthma — preventer inhaler daily, reviewed annually",
      "Counselling weekly via The Mix (self-referred)",
      "Dental check-up overdue — appointment booked",
    ],
    financialSupport: [
      "16-19 Bursary £1,200/yr — paid weekly during term",
      "Universal Credit not yet claimed (in education)",
      "Junior ISA matures at 18 — current balance £2,310",
      "Setting Up Home Allowance £2,000 — partially drawn (£640 spent on bedding, kitchenware)",
    ],
    supportNetwork: [
      "Personal Advisor Gemma — fortnightly contact",
      "Ryan Newton (former senior RW, Oak House) — Staying Close monthly call",
      "Birth mother — weekly phone contact, no in-person visits",
      "Two college friends (Tasha, Connor)",
      "Costa shift manager Priya — informal mentor",
    ],
    aspirations: [
      "Complete Level 3 H&SC and apply for Nursing Degree",
      "Move to own one-bed flat at 18",
      "Volunteer at local young carers project",
      "Pass driving theory by Christmas",
    ],
    risks: [
      "Financial pressure if hours at Costa reduce over winter",
      "Mother's mental health relapses can affect S.L.'s emotional state",
      "Living alone at weekends — isolation risk monitored",
    ],
    independentLivingSkills: {
      "Cooking simple meals": "Established",
      "Budgeting & money management": "Developing",
      "Laundry & household tasks": "Established",
      "Personal hygiene & self-care": "Established",
      "Travel & navigation": "Established",
      "Healthcare self-management": "Developing",
      "Tenancy & housing literacy": "Developing",
      "Job-search & CV skills": "Developing",
    },
    nextReviewDate: d(20),
    contactArrangements: "PA visit fortnightly at Beacon Lodge. Monthly Staying Close call with Ryan. Quarterly Oak House peer reunion meal invitation.",
    statutory16PlusReviewSchedule: "Six-monthly statutory review; next due in 20 days. Pre-18 transition review scheduled 3 months before 18th birthday.",
  },
  {
    id: "pp3",
    youngPerson: "",
    childInitials: "D.K. (former Oak House)",
    age: 20,
    status: "Active 18+ (formerly looked after)",
    planVersion: "v6.0",
    lastReviewDate: d(-150),
    personalAdvisor: "Yusuf Patel — Millbrook Leaving Care 18+ Team",
    socialWorker: "N/A — care order discharged at 18; PA is statutory lead",
    accommodation: "Own one-bed council flat — 22 Larkfield House, Southgate. Tenancy held since age 18 (24 months). Rent paid in full via UC housing element.",
    educationEmploymentTraining: "Apprenticeship — Level 3 Plumbing (Year 2 of 3) with Hartfield Plumbing Ltd. Wage £8.60/hr (above apprentice min). Day-release at Southgate College.",
    healthNeeds: [
      "Generally well — no chronic conditions",
      "Annual GP check-up completed Feb 2026",
      "Registered NHS dentist — last seen 4 months ago",
      "Stopped CAMHS at 18; no current MH support — declined offer, doing well",
    ],
    financialSupport: [
      "Universal Credit top-up during low-wage apprenticeship months",
      "Setting Up Home Allowance fully drawn (£2,000) — used for white goods and furniture",
      "ISA matured £2,640 — invested in driving lessons and tools",
      "Council Tax 100% care leaver exemption until age 25",
    ],
    supportNetwork: [
      "Personal Advisor Yusuf — quarterly visit, monthly call",
      "Apprentice mentor Steve (Hartfield Plumbing)",
      "Long-term partner Maya (lives separately) — 14 months",
      "Maya's family — informal support network",
      "Darren Laville (Oak House) — annual Christmas catch-up tradition",
    ],
    aspirations: [
      "Complete plumbing apprenticeship and gain Gas Safe registration",
      "Move in with partner at 22",
      "Save deposit for first home purchase by 25",
      "Mentor a current Oak House young person via peer programme",
    ],
    risks: [
      "Tenancy stable but isolated nights occasionally — partner not co-resident",
      "No identified clinical risks; continues to decline MH support — monitor",
    ],
    independentLivingSkills: {
      "Cooking simple meals": "Established",
      "Budgeting & money management": "Established",
      "Laundry & household tasks": "Established",
      "Personal hygiene & self-care": "Established",
      "Travel & navigation": "Established",
      "Healthcare self-management": "Established",
      "Tenancy & housing literacy": "Established",
      "Job-search & CV skills": "Established",
    },
    nextReviewDate: d(35),
    contactArrangements: "Quarterly PA visits. Annual Christmas dinner invitation at Oak House. Available on request via Staying Close protocol.",
    statutory16PlusReviewSchedule: "Six-monthly review (Reg. 8 Care Leavers Regs 2010) until age 25. Next review in 35 days.",
  },
  {
    id: "pp4",
    youngPerson: "",
    childInitials: "J.W. (former Oak House)",
    age: 25,
    status: "Closed at 25",
    planVersion: "v9.0 (final)",
    lastReviewDate: d(-30),
    personalAdvisor: "Closed — formerly Hannah Brierley (final PA)",
    socialWorker: "N/A",
    accommodation: "Owner-occupier — purchased 2-bed terraced house in Fairfield with partner Sept 2025. Mortgage held jointly.",
    educationEmploymentTraining: "Qualified Social Worker — registered Social Work England (Apr 2025). Currently employed as Children's Social Worker at Fairfield Council (2nd year ASYE complete).",
    healthNeeds: [
      "Excellent general health",
      "Self-managing — registered with GP, dentist, optician",
      "Voluntarily accessed talking therapy briefly during ASYE — completed",
    ],
    financialSupport: [
      "All statutory support concluded at age 25 (per Care Leavers Regs)",
      "Higher Education Bursary £2,000 paid in full during degree",
      "Final Pathway Plan closure interview completed — no outstanding entitlements",
      "Salary £33,400 — fully financially independent",
    ],
    supportNetwork: [
      "Spouse — married 2024",
      "Two godchildren (close friend Anita's children)",
      "Maintains chosen-family contact with two former Oak House peers (Alex circle)",
      "Annual reunion attendance at Oak House Christmas event",
      "Darren Laville — described in closure interview as 'lifelong figure'",
    ],
    aspirations: [
      "Continue social work career — interested in residential care leadership",
      "Complete Practice Educator qualification within 3 years",
      "Start a family within next 5 years",
      "Has expressed interest in mentoring care-experienced young people",
    ],
    risks: [
      "None identified at closure",
      "Closure plan acknowledges right to re-engage if circumstances change before pension age (per LA discretionary policy)",
    ],
    independentLivingSkills: {
      "Cooking simple meals": "Established",
      "Budgeting & money management": "Established",
      "Laundry & household tasks": "Established",
      "Personal hygiene & self-care": "Established",
      "Travel & navigation": "Established",
      "Healthcare self-management": "Established",
      "Tenancy & housing literacy": "Established",
      "Job-search & CV skills": "Established",
    },
    nextReviewDate: "N/A — Plan closed",
    contactArrangements: "Plan formally closed at 25th birthday. Voluntary contact maintained with Oak House — not a statutory arrangement.",
    statutory16PlusReviewSchedule: "Plan closed per Children (Leaving Care) Act 2000 / Care Leavers Regs 2010. Final review held 30 days ago. Closure letter issued.",
  },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function PathwayPlan16PlusPage() {
  const [data] = useState<PathwayPlan[]>(SEED);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("review");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);
  const today = d(0);
  const in30 = d(30);

  const displayName = (r: PathwayPlan) =>
    r.youngPerson ? getYPName(r.youngPerson) : r.childInitials;

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(
        r =>
          displayName(r).toLowerCase().includes(s) ||
          r.accommodation.toLowerCase().includes(s) ||
          r.personalAdvisor.toLowerCase().includes(s),
      );
    }
    if (statusFilter !== "all") out = out.filter(r => r.status === statusFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return displayName(a).localeCompare(displayName(b));
        case "age":
          return a.age - b.age;
        case "status":
          return a.status.localeCompare(b.status);
        default: {
          // review: soonest next review first; closed/N/A at the end
          const av = a.nextReviewDate.startsWith("N/A") ? "9999-12-31" : a.nextReviewDate;
          const bv = b.nextReviewDate.startsWith("N/A") ? "9999-12-31" : b.nextReviewDate;
          return av.localeCompare(bv);
        }
      }
    });
    return out;
  }, [data, search, statusFilter, sortBy]);

  const activePlans = data.filter(
    r =>
      r.status === "Active 16-18" ||
      r.status === "Active 18+ (formerly looked after)" ||
      r.status === "Pre-pathway (15+)",
  ).length;
  const cohort16to18 = data.filter(r => r.status === "Active 16-18").length;
  const cohort18plus = data.filter(r => r.status === "Active 18+ (formerly looked after)").length;
  const reviewsDue30 = data.filter(
    r =>
      !r.nextReviewDate.startsWith("N/A") &&
      r.nextReviewDate >= today &&
      r.nextReviewDate <= in30,
  ).length;

  const exportCols: ExportColumn<PathwayPlan>[] = useMemo(
    () => [
      { header: "Young Person", accessor: (r: PathwayPlan) => displayName(r) },
      { header: "Age", accessor: (r: PathwayPlan) => String(r.age) },
      { header: "Status", accessor: (r: PathwayPlan) => r.status },
      { header: "Plan Version", accessor: (r: PathwayPlan) => r.planVersion },
      { header: "Last Review", accessor: (r: PathwayPlan) => r.lastReviewDate },
      { header: "Next Review", accessor: (r: PathwayPlan) => r.nextReviewDate },
      { header: "Personal Advisor", accessor: (r: PathwayPlan) => r.personalAdvisor },
      { header: "Social Worker", accessor: (r: PathwayPlan) => r.socialWorker },
      { header: "Accommodation", accessor: (r: PathwayPlan) => r.accommodation },
      { header: "EET", accessor: (r: PathwayPlan) => r.educationEmploymentTraining },
      { header: "Health Needs", accessor: (r: PathwayPlan) => r.healthNeeds.join("; ") },
      { header: "Financial Support", accessor: (r: PathwayPlan) => r.financialSupport.join("; ") },
      { header: "Support Network", accessor: (r: PathwayPlan) => r.supportNetwork.join("; ") },
      { header: "Aspirations", accessor: (r: PathwayPlan) => r.aspirations.join("; ") },
      { header: "Risks", accessor: (r: PathwayPlan) => r.risks.join("; ") },
      {
        header: "Independent Living Skills",
        accessor: (r: PathwayPlan) =>
          Object.entries(r.independentLivingSkills)
            .map(([k, v]) => `${k}: ${v}`)
            .join("; "),
      },
      { header: "Contact Arrangements", accessor: (r: PathwayPlan) => r.contactArrangements },
      { header: "Statutory Review Schedule", accessor: (r: PathwayPlan) => r.statutory16PlusReviewSchedule },
    ],
    [],
  );

  return (
    <PageShell
      title="Pathway Plan (16+)"
      subtitle="Statutory pathway planning for care leavers — Children (Leaving Care) Act 2000 / Children Act 1989 (S23B-D) / Care Leavers Regs 2010"
      actions={[
        <PrintButton key="p" title="Pathway Plan (16+)" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="pathway-plan-16plus" />,
      ]}
    >
      <div id="print-area" className="space-y-6">
        {/* summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Plans", value: activePlans, icon: FileText, colour: "text-blue-600" },
            { label: "16-18 Cohort", value: cohort16to18, icon: GraduationCap, colour: "text-purple-600" },
            { label: "18+ Cohort", value: cohort18plus, icon: Users, colour: "text-teal-600" },
            { label: "Reviews Due (30d)", value: reviewsDue30, icon: Calendar, colour: "text-amber-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 flex items-center gap-3">
                <s.icon className={cn("h-8 w-8", s.colour)} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* continuity-of-care note */}
        <div className="rounded-lg border border-blue-300 bg-blue-50 p-4 flex items-start gap-3">
          <Heart className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900">Continuity-of-care record</p>
            <p className="text-sm text-blue-800 mt-0.5">
              This page tracks former Oak House residents now in pathway services. All currently
              resident young people (Alex, Jordan, Casey) are below 16 and remain on Care Plans
              (not yet Pathway Plans). Records below relate to former residents under continuing
              Staying Close arrangements — anonymised where appropriate.
            </p>
          </div>
        </div>

        {/* filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Initials, accommodation, PA…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-56">
                <Label className="text-xs flex items-center gap-1">
                  <Filter className="h-3 w-3" />Status
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Pre-pathway (15+)">Pre-pathway (15+)</SelectItem>
                    <SelectItem value="Active 16-18">Active 16-18</SelectItem>
                    <SelectItem value="Active 18+ (formerly looked after)">Active 18+</SelectItem>
                    <SelectItem value="Closed at 25">Closed at 25</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs flex items-center gap-1">
                  <ArrowUpDown className="h-3 w-3" />Sort
                </Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="review">Next Review</SelectItem>
                    <SelectItem value="age">Age</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* plan cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expandedId === r.id;
            const reviewSoon =
              !r.nextReviewDate.startsWith("N/A") &&
              r.nextReviewDate >= today &&
              r.nextReviewDate <= in30;
            return (
              <Card key={r.id} className={cn("border-l-4", STATUS_BORDER[r.status])}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{displayName(r)}</CardTitle>
                        <Badge variant="outline" className="text-xs">Age {r.age}</Badge>
                        <Badge className={cn("text-xs", STATUS_CLR[r.status])}>{r.status}</Badge>
                        <Badge variant="outline" className="text-xs">{r.planVersion}</Badge>
                        {reviewSoon && (
                          <Badge className="text-xs bg-amber-100 text-amber-800">
                            Review due {r.nextReviewDate}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Last review: {r.lastReviewDate}
                        </span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    {/* core meta */}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                          <Users className="h-3 w-3" />Personal Advisor
                        </p>
                        <p>{r.personalAdvisor}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                          <Users className="h-3 w-3" />Social Worker
                        </p>
                        <p>{r.socialWorker}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                          <Home className="h-3 w-3" />Accommodation
                        </p>
                        <p>{r.accommodation}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />Education / Employment / Training
                        </p>
                        <p>{r.educationEmploymentTraining}</p>
                      </div>
                    </div>

                    {/* lists grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                        <p className="text-xs font-semibold text-rose-800 mb-1 flex items-center gap-1">
                          <Heart className="h-3 w-3" />Health Needs
                        </p>
                        <ul className="text-sm text-rose-900 list-disc list-inside space-y-0.5">
                          {r.healthNeeds.map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                        <p className="text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                          <FileText className="h-3 w-3" />Financial Support
                        </p>
                        <ul className="text-sm text-emerald-900 list-disc list-inside space-y-0.5">
                          {r.financialSupport.map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                        <p className="text-xs font-semibold text-indigo-800 mb-1 flex items-center gap-1">
                          <Users className="h-3 w-3" />Support Network
                        </p>
                        <ul className="text-sm text-indigo-900 list-disc list-inside space-y-0.5">
                          {r.supportNetwork.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
                        <p className="text-xs font-semibold text-sky-800 mb-1 flex items-center gap-1">
                          <Target className="h-3 w-3" />Aspirations
                        </p>
                        <ul className="text-sm text-sky-900 list-disc list-inside space-y-0.5">
                          {r.aspirations.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                    </div>

                    {/* risks */}
                    {r.risks.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3" />Risks
                        </p>
                        <ul className="text-sm text-amber-900 list-disc list-inside space-y-0.5">
                          {r.risks.map((rs, i) => <li key={i}>{rs}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* independent living skills */}
                    <div>
                      <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                        <Wrench className="h-3 w-3" />Independent Living Skills
                      </p>
                      <table className="w-full text-sm border">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-2 font-medium">Skill</th>
                            <th className="text-left p-2 font-medium">Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(r.independentLivingSkills).map(([skill, level]) => (
                            <tr key={skill} className="border-t">
                              <td className="p-2">{skill}</td>
                              <td className="p-2">
                                <Badge className={cn("text-xs", SKILL_CLR[level])}>{level}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* contact + review schedule */}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                          <Phone className="h-3 w-3" />Contact Arrangements
                        </p>
                        <p className="text-muted-foreground">{r.contactArrangements}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />Statutory 16+ Review Schedule
                        </p>
                        <p className="text-muted-foreground">{r.statutory16PlusReviewSchedule}</p>
                      </div>
                    </div>

                    {/* footer meta */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t pt-3">
                      <span>Last Review: <strong>{r.lastReviewDate}</strong></span>
                      <span>
                        Next Review:{" "}
                        <strong className={cn(reviewSoon && "text-amber-700")}>
                          {r.nextReviewDate}
                        </strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Plan Version: <strong>{r.planVersion}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        Maintained by Oak House continuity record (RM:{" "}
                        <strong>{getStaffName("staff_darren")}</strong>, Senior:{" "}
                        <strong>{getStaffName("staff_ryan")}</strong>)
                      </span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-lg border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            No pathway plans match your filters.
          </div>
        )}

        {/* alerts: reviews due */}
        {reviewsDue30 > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                {reviewsDue30} statutory review(s) due within 30 days
              </p>
              <ul className="text-sm text-amber-800 mt-1 list-disc list-inside">
                {data
                  .filter(
                    r =>
                      !r.nextReviewDate.startsWith("N/A") &&
                      r.nextReviewDate >= today &&
                      r.nextReviewDate <= in30,
                  )
                  .map(r => (
                    <li key={r.id}>
                      {displayName(r)} — due {r.nextReviewDate} (PA: {r.personalAdvisor.split("—")[0].trim()})
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>
            The Pathway Plan is a statutory document required under the Children (Leaving Care)
            Act 2000, the Children Act 1989 (sections 23B-D), and the Care Leavers (England)
            Regulations 2010. A Pathway Plan must be prepared for every &quot;eligible&quot;,
            &quot;relevant&quot; and &quot;former relevant&quot; child, must replace the Care
            Plan from age 16, and must address accommodation, education/employment/training,
            health, financial support, family/support network, and contingency planning. Plans
            must be reviewed at least every six months and at any time of significant change.
            A Personal Advisor must be allocated and must remain in contact until the young
            person is 25. This page acts as the home&apos;s continuity-of-care record and does
            not replace the local authority&apos;s statutory Pathway Plan document held by the
            Leaving Care Team.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
