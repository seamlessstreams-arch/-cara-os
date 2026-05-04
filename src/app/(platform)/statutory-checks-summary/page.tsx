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
  ShieldCheck, AlertTriangle, Clock, CheckCircle2, FileText, Users,
  Calendar, Eye, FlaskConical, Flame, BookOpen, Building2, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type ComplianceStatus = "Compliant" | "Due soon" | "Overdue" | "In progress";
type CheckCategory = "Per-child" | "Home-wide" | "Workforce" | "Environmental" | "Financial";
type CheckFrequency =
  | "Monthly"
  | "Quarterly"
  | "Six-monthly"
  | "Annual"
  | "Bi-annual"
  | "Per child per year";

interface StatutoryCheck {
  id: string;
  checkName: string;
  regulatoryBasis: string;
  category: CheckCategory;
  frequency: CheckFrequency;
  lastCompletedDate: string;
  nextDueDate: string;
  complianceStatus: ComplianceStatus;
  responsibleOwner: string;
  evidenceLocation: string;
  childrenCovered: string;
  externalReviewer: string;
  summary: string;
  recentObservation: string;
  escalationCriteria: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const STATUS_CLR: Record<ComplianceStatus, string> = {
  "Compliant": "bg-green-100 text-green-800",
  "Due soon": "bg-amber-100 text-amber-800",
  "Overdue": "bg-red-100 text-red-800",
  "In progress": "bg-blue-100 text-blue-800",
};

const STATUS_BORDER: Record<ComplianceStatus, string> = {
  "Compliant": "border-green-400 bg-green-50",
  "Due soon": "border-amber-400 bg-amber-50",
  "Overdue": "border-red-500 bg-red-50",
  "In progress": "border-blue-400 bg-blue-50",
};

const CATEGORY_ICON: Record<CheckCategory, React.ComponentType<{ className?: string }>> = {
  "Per-child": Users,
  "Home-wide": Building2,
  "Workforce": ShieldCheck,
  "Environmental": Flame,
  "Financial": FileText,
};

const CATEGORY_CLR: Record<CheckCategory, string> = {
  "Per-child": "bg-purple-100 text-purple-800",
  "Home-wide": "bg-blue-100 text-blue-800",
  "Workforce": "bg-teal-100 text-teal-800",
  "Environmental": "bg-orange-100 text-orange-800",
  "Financial": "bg-slate-100 text-slate-800",
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: StatutoryCheck[] = [
  {
    id: "sc1",
    checkName: "Reg 44 Independent Visit",
    regulatoryBasis: "Reg 44",
    category: "Home-wide",
    frequency: "Monthly",
    lastCompletedDate: d(-12),
    nextDueDate: d(18),
    complianceStatus: "Compliant",
    responsibleOwner: "staff_darren",
    evidenceLocation: "Reg 44 Visits page",
    childrenCovered: "All 3 children",
    externalReviewer: "Margaret Wensley — Independent Visitor",
    summary: "Monthly unannounced visit by independent person who interviews children and staff, reviews records and reports to Ofsted under regulation 44.",
    recentObservation: "April visit completed. No safeguarding concerns. Two minor recommendations on bedroom personalisation tracked to action log. Report uploaded to Reg 44 page and shared with RI.",
    escalationCriteria: "If visit not completed within calendar month — escalate to RI immediately. Any safeguarding concern raised in report triggers same-day RI notification.",
  },
  {
    id: "sc2",
    checkName: "Reg 45 Six-Monthly Quality Review",
    regulatoryBasis: "Reg 45",
    category: "Home-wide",
    frequency: "Six-monthly",
    lastCompletedDate: d(-95),
    nextDueDate: d(85),
    complianceStatus: "Compliant",
    responsibleOwner: "staff_darren",
    evidenceLocation: "Reg 45 Reviews page",
    childrenCovered: "All 3 children",
    externalReviewer: "—",
    summary: "Six-monthly review of the quality of care provided, evidencing how each child's progress, welfare and outcomes are being supported and what improvements have been made.",
    recentObservation: "Last review (Jan 2026) judged quality of care as 'Good with outstanding features'. Three improvement actions identified — all on track. Next review due Jul 2026.",
    escalationCriteria: "If review not completed within statutory window — RI notification and Ofsted Schedule 5 risk. Quality issues identified must feed into development plan.",
  },
  {
    id: "sc3",
    checkName: "Reg 45 Serious Incident Review",
    regulatoryBasis: "Reg 45",
    category: "Home-wide",
    frequency: "Quarterly",
    lastCompletedDate: d(-40),
    nextDueDate: d(50),
    complianceStatus: "Compliant",
    responsibleOwner: "staff_darren",
    evidenceLocation: "Reg 45 Reviews page",
    childrenCovered: "All 3 children",
    externalReviewer: "—",
    summary: "Quarterly review of all serious incidents, restraints, missing episodes and complaints to identify themes, learning and required practice change.",
    recentObservation: "Q1 2026 review identified rising restraint frequency for one child — therapeutic plan refreshed with CAMHS. Q2 review scheduled.",
    escalationCriteria: "Any spike in incident type triggers ad-hoc review. Themes suggesting unsafe practice escalate to RI within 24 hours.",
  },
  {
    id: "sc4",
    checkName: "Statutory LAC Review",
    regulatoryBasis: "Care Planning Regs 2010 r33",
    category: "Per-child",
    frequency: "Per child per year",
    lastCompletedDate: d(-58),
    nextDueDate: d(32),
    complianceStatus: "Compliant",
    responsibleOwner: "staff_ryan",
    evidenceLocation: "LAC Reviews page",
    childrenCovered: "Per child",
    externalReviewer: "Independent Reviewing Officer (IRO)",
    summary: "Statutory looked-after-child reviews chaired by the IRO — first within 20 working days of placement, second within three months, then six-monthly. Reviews care plan progress and child's wishes.",
    recentObservation: "All three children have current LAC reviews. M.J.'s review due in May 2026; advocacy support arranged. T.R.'s 3-month review held last month — care plan endorsed.",
    escalationCriteria: "If LA fails to convene review within statutory window — Home escalates to IRO Manager and notes on child's record. Late reviews flagged on placement provider report.",
  },
  {
    id: "sc5",
    checkName: "Statutory Visit by Social Worker",
    regulatoryBasis: "Care Planning Regs r28",
    category: "Per-child",
    frequency: "Per child per year",
    lastCompletedDate: d(-22),
    nextDueDate: d(8),
    complianceStatus: "Due soon",
    responsibleOwner: "staff_ryan",
    evidenceLocation: "Statutory Visits page",
    childrenCovered: "Per child",
    externalReviewer: "Allocated Social Worker (LA)",
    summary: "Statutory visits by the child's allocated social worker — within first week of placement, then minimum six-weekly, including alone-time with the child.",
    recentObservation: "M.J.'s next statutory visit due in 8 days — confirmed with Millbrook County. T.R.'s SW visited 12 days ago. S.L.'s SW visit overdue by 4 days — chased and now booked.",
    escalationCriteria: "Visits not completed within six weeks — escalate to LA Team Manager, copy IRO, note on child's record. Repeated delay raised in Reg 45 review.",
  },
  {
    id: "sc6",
    checkName: "Child Protection Conference",
    regulatoryBasis: "Working Together 2023",
    category: "Per-child",
    frequency: "Per child per year",
    lastCompletedDate: d(-110),
    nextDueDate: d(70),
    complianceStatus: "Compliant",
    responsibleOwner: "staff_darren",
    evidenceLocation: "Child Protection page",
    childrenCovered: "Per child",
    externalReviewer: "CP Chair (LA Safeguarding Unit)",
    summary: "Initial CP conference within 15 working days of strategy meeting; review conferences within three months of initial then six-monthly while plan is active.",
    recentObservation: "One child currently subject to a CP plan — last review Feb 2026. Next review July 2026. Home contributing minutes via designated safeguarding lead.",
    escalationCriteria: "Conference not convened within statutory window — escalate to LA Safeguarding Unit; risk-assess immediate child protection arrangements. Notify RI same day.",
  },
  {
    id: "sc7",
    checkName: "Annual Health Assessment",
    regulatoryBasis: "Care Planning Regs r7",
    category: "Per-child",
    frequency: "Per child per year",
    lastCompletedDate: d(-185),
    nextDueDate: d(-5),
    complianceStatus: "Overdue",
    responsibleOwner: "staff_ryan",
    evidenceLocation: "Annual Health Assessment page",
    childrenCovered: "Per child",
    externalReviewer: "LAC Nurse / Designated Doctor",
    summary: "Annual health assessment by a registered medical practitioner; informs the Health Plan section of the care plan. Initial assessment within 20 working days of becoming looked-after.",
    recentObservation: "T.R.'s annual health assessment overdue by 5 days — appointment rebooked for next week. LAC Nurse confirmed availability. Holding letter on file. Other two children compliant.",
    escalationCriteria: "Overdue >14 days — escalate to LA Designated Nurse and IRO. Pattern of delay reported to RI and recorded on Reg 45 review.",
  },
  {
    id: "sc8",
    checkName: "EHCP Annual Review",
    regulatoryBasis: "Children & Families Act 2014 s44",
    category: "Per-child",
    frequency: "Per child per year",
    lastCompletedDate: d(-150),
    nextDueDate: d(30),
    complianceStatus: "Due soon",
    responsibleOwner: "staff_ryan",
    evidenceLocation: "Education page (EHCP section)",
    childrenCovered: "Per child",
    externalReviewer: "School SENCO + LA SEN team",
    summary: "Annual review of Education, Health and Care Plan led by the school SENCO with LA, parents/carers and the child contributing. Six-monthly for under-fives.",
    recentObservation: "Two children have EHCPs. M.J.'s annual review meeting set for 30 days' time at school — internal lead and IRO invited. S.L.'s review completed 4 months ago.",
    escalationCriteria: "Review not held within statutory window — escalate to LA SEN team and Virtual School Head. Note on child's record. Risk to placement stability if SEN provision lapses.",
  },
  {
    id: "sc9",
    checkName: "Fire Risk Assessment",
    regulatoryBasis: "Regulatory Reform (Fire Safety) Order 2005",
    category: "Environmental",
    frequency: "Annual",
    lastCompletedDate: d(-280),
    nextDueDate: d(85),
    complianceStatus: "Compliant",
    responsibleOwner: "staff_darren",
    evidenceLocation: "Fire Safety page / Buildings page",
    childrenCovered: "N/A — home-wide",
    externalReviewer: "Pinnacle Fire Safety Ltd",
    summary: "Annual written Fire Risk Assessment by competent person; identifies hazards, persons at risk, control measures and emergency procedures. Reviewed if material change to building or occupancy.",
    recentObservation: "FRA Aug 2025 — overall risk 'Tolerable'. Three actions: door closer replacement (done), evacuation chair training (done), kitchen extractor servicing (done).",
    escalationCriteria: "FRA overdue or significant change in occupancy/layout — close fire-affected areas if needed and arrange immediate reassessment. RI notification same day.",
  },
  {
    id: "sc10",
    checkName: "Fire Drill",
    regulatoryBasis: "RR(FS)O 2005 / Reg 25 CHR",
    category: "Environmental",
    frequency: "Monthly",
    lastCompletedDate: d(-10),
    nextDueDate: d(20),
    complianceStatus: "Compliant",
    responsibleOwner: "staff_darren",
    evidenceLocation: "Fire Safety page (Drill Log)",
    childrenCovered: "All 3 children",
    externalReviewer: "—",
    summary: "Monthly fire evacuation drill covering all occupants including children and staff on duty; varies time of day and night across the year. Drill log maintained.",
    recentObservation: "April drill — full evacuation in 1 min 47 sec. All staff and children mustered at assembly point. Two learning points logged: bedroom door closer adjustment, rota for night drill scheduling.",
    escalationCriteria: "Drill missed in any calendar month — flag to RI within 7 days; arrange make-up drill same week. Children's response issues followed up in care plan.",
  },
  {
    id: "sc11",
    checkName: "Staff DBS Renewal",
    regulatoryBasis: "Reg 32 Schedule 2",
    category: "Workforce",
    frequency: "Bi-annual",
    lastCompletedDate: d(-210),
    nextDueDate: d(-2),
    complianceStatus: "Overdue",
    responsibleOwner: "staff_darren",
    evidenceLocation: "Staff Files page (DBS section)",
    childrenCovered: "N/A — home-wide",
    externalReviewer: "Disclosure & Barring Service",
    summary: "Enhanced DBS check renewed every three years (or earlier if Update Service flag); checked at recruitment and on update service monthly. No staff to work unsupervised pending renewal.",
    recentObservation: "Two-year internal review found one staff member (admin) due for refresh — applied 12 days ago, awaiting return. Risk-assessed: not in lone-working role. All care staff currently in date.",
    escalationCriteria: "DBS lapsed for any care staff — immediate suspension from unsupervised contact. Notify Ofsted and RI same day. Escalate to HR for renewal.",
  },
  {
    id: "sc12",
    checkName: "Mandatory Training Renewal",
    regulatoryBasis: "Reg 32 / Quality Standard 10",
    category: "Workforce",
    frequency: "Annual",
    lastCompletedDate: d(-300),
    nextDueDate: d(15),
    complianceStatus: "Due soon",
    responsibleOwner: "staff_darren",
    evidenceLocation: "Training Matrix page",
    childrenCovered: "N/A — home-wide",
    externalReviewer: "External training providers",
    summary: "Annual refresh of mandatory training: safeguarding, first aid, fire safety, medication, restraint (PRICE), GDPR, equality. All staff required up-to-date prior to shift work.",
    recentObservation: "Training matrix shows 87% in-date. Three staff due safeguarding refresh in 15 days — sessions booked. PRICE refresh days scheduled in May.",
    escalationCriteria: "Staff member out of date for safeguarding or restraint — removed from rota until refreshed. Pattern of expiry escalated to RI and Reg 45 review.",
  },
  {
    id: "sc13",
    checkName: "Equipment PAT Testing",
    regulatoryBasis: "Electricity at Work Regs 1989",
    category: "Environmental",
    frequency: "Annual",
    lastCompletedDate: d(-360),
    nextDueDate: d(5),
    complianceStatus: "Due soon",
    responsibleOwner: "staff_darren",
    evidenceLocation: "Buildings page (PAT register)",
    childrenCovered: "N/A — home-wide",
    externalReviewer: "Spark & Safe Ltd (PAT contractor)",
    summary: "Annual portable appliance testing across all electrical equipment including kitchen, bedrooms and communal areas. Register maintained with serial numbers and pass/fail.",
    recentObservation: "PAT contractor booked for next week. Last year all 142 items passed; one extension lead failed and was disposed of. New equipment added to register on receipt.",
    escalationCriteria: "PAT overdue >30 days — withdraw any non-fixed appliances until tested. Notify RI. Annual maintenance plan reviewed.",
  },
  {
    id: "sc14",
    checkName: "Water / Legionella Risk Assessment",
    regulatoryBasis: "HSG274 / ACOP L8",
    category: "Environmental",
    frequency: "Bi-annual",
    lastCompletedDate: d(-420),
    nextDueDate: d(-25),
    complianceStatus: "Overdue",
    responsibleOwner: "staff_darren",
    evidenceLocation: "Buildings page (Legionella log)",
    childrenCovered: "N/A — home-wide",
    externalReviewer: "AquaCheck Ltd",
    summary: "Two-yearly Legionella risk assessment plus monthly temperature checks of hot/cold water outlets and quarterly tank inspections. Mandatory under HSE ACOP L8.",
    recentObservation: "Reassessment overdue by 25 days — contractor booked for next week. Monthly temperature checks remain in date. No symptoms reported. Holding precautionary measures: weekly outlet flushing on under-used taps.",
    escalationCriteria: "Reassessment overdue >30 days — formal RI escalation; consider temporary precautionary actions (flushing, tank inspection). Health concerns escalate to PHE.",
  },
  {
    id: "sc15",
    checkName: "Food Hygiene Rating Review",
    regulatoryBasis: "Food Safety Act 1990",
    category: "Environmental",
    frequency: "Annual",
    lastCompletedDate: d(-200),
    nextDueDate: d(165),
    complianceStatus: "Compliant",
    responsibleOwner: "staff_darren",
    evidenceLocation: "Food Hygiene page",
    childrenCovered: "All 3 children",
    externalReviewer: "Local Authority EHO",
    summary: "Local authority Environmental Health Officer rating; HACCP records, temperature logs, cleaning schedules and allergen management evidenced. Self-audit between visits.",
    recentObservation: "Last EHO inspection — rating 5 ('Very good'). Two minor improvements done. Internal monthly audit continuing. Daily temperature checks on file.",
    escalationCriteria: "Rating drops below 4 — immediate corrective action plan; RI notified; self-suspension of menu items if necessary. Re-inspection requested.",
  },
  {
    id: "sc16",
    checkName: "Safeguarding Policy Review",
    regulatoryBasis: "Reg 34 / KCSIE",
    category: "Home-wide",
    frequency: "Annual",
    lastCompletedDate: d(-340),
    nextDueDate: d(25),
    complianceStatus: "Due soon",
    responsibleOwner: "staff_darren",
    evidenceLocation: "Policies page (Safeguarding)",
    childrenCovered: "All 3 children",
    externalReviewer: "RI sign-off",
    summary: "Annual review of safeguarding policy and procedures, signed off by the Responsible Individual; reflects KCSIE updates, learning from incidents and LSCP threshold changes.",
    recentObservation: "Draft revision in progress — incorporates 2025 KCSIE update on AI-generated content and contextual safeguarding additions. RI review meeting booked.",
    escalationCriteria: "Annual review overdue — escalate to RI; interim addendum issued if statutory guidance has changed. Records audit checks evidence.",
  },
  {
    id: "sc17",
    checkName: "Reg 22 Records Audit",
    regulatoryBasis: "Reg 22",
    category: "Home-wide",
    frequency: "Quarterly",
    lastCompletedDate: d(-50),
    nextDueDate: d(40),
    complianceStatus: "Compliant",
    responsibleOwner: "staff_darren",
    evidenceLocation: "Audits page",
    childrenCovered: "All 3 children",
    externalReviewer: "—",
    summary: "Quarterly audit of records held in respect of each child (Schedule 3) including care plan, contact records, education and health records, and significant events. Evidences accuracy and currency.",
    recentObservation: "Q1 audit completed — 96% of items current. Four follow-up actions resolved. Audit identified scope to consolidate education records into one section — done.",
    escalationCriteria: "Records found materially out of date — immediate remediation; pattern raised in Reg 45 review and RI report.",
  },
  {
    id: "sc18",
    checkName: "Reg 36 Records Maintenance",
    regulatoryBasis: "Reg 36 Schedule 4",
    category: "Home-wide",
    frequency: "Monthly",
    lastCompletedDate: d(-8),
    nextDueDate: d(22),
    complianceStatus: "Compliant",
    responsibleOwner: "staff_darren",
    evidenceLocation: "Audits page (Reg 36 register)",
    childrenCovered: "All 3 children",
    externalReviewer: "—",
    summary: "Monthly check that the registers required by regulation 36 (e.g. children accommodated, sanctions, restraints, medicines, complaints, accidents) are maintained, accurate and retained for required periods.",
    recentObservation: "April check completed — all registers current. Sanctions register has been updated to capture new behaviour support measures. Restraint register cross-referenced with incident log.",
    escalationCriteria: "Register found incomplete or inaccurate — immediate correction; entry made noting the discrepancy; reviewed in next Reg 45.",
  },
  {
    id: "sc19",
    checkName: "Statement of Purpose Review",
    regulatoryBasis: "Reg 16",
    category: "Home-wide",
    frequency: "Annual",
    lastCompletedDate: d(-260),
    nextDueDate: d(105),
    complianceStatus: "Compliant",
    responsibleOwner: "staff_darren",
    evidenceLocation: "Statement of Purpose page",
    childrenCovered: "All 3 children",
    externalReviewer: "Submitted to Ofsted",
    summary: "Annual review of the Statement of Purpose covering aims, ethos, accommodation, range of needs, staffing and arrangements for safeguarding. Updated on material change and submitted to Ofsted.",
    recentObservation: "Latest version Aug 2025. Reflects current children's needs and staffing structure. Next scheduled review Aug 2026 — earlier if material change.",
    escalationCriteria: "Material change in offer or staffing not reflected — update within 28 days and notify Ofsted. Statement audited in inspections.",
  },
  {
    id: "sc20",
    checkName: "Children's Guide Review",
    regulatoryBasis: "Reg 5 Schedule 1",
    category: "Home-wide",
    frequency: "Annual",
    lastCompletedDate: d(-90),
    nextDueDate: d(275),
    complianceStatus: "In progress",
    responsibleOwner: "staff_ryan",
    evidenceLocation: "Children's Guide page",
    childrenCovered: "All 3 children",
    externalReviewer: "—",
    summary: "Annual review of the Children's Guide ensuring it is accessible, age-appropriate and accurately describes the home, complaints process, advocacy and rights. Co-produced with children.",
    recentObservation: "Workshop with children scheduled for next month — three children contributing illustrations and feedback on language. Easy-read version in development.",
    escalationCriteria: "Guide significantly outdated or inaccessible — refresh within 60 days. Concerns raised by children require same-week action.",
  },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function StatutoryChecksSummaryPage() {
  const [data] = useState<StatutoryCheck[]>(SEED);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(r =>
        r.checkName.toLowerCase().includes(s) ||
        r.regulatoryBasis.toLowerCase().includes(s) ||
        r.evidenceLocation.toLowerCase().includes(s) ||
        r.summary.toLowerCase().includes(s)
      );
    }
    if (statusFilter !== "all") out = out.filter(r => r.complianceStatus === statusFilter);
    if (categoryFilter !== "all") out = out.filter(r => r.category === categoryFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "name": return a.checkName.localeCompare(b.checkName);
        case "due": return a.nextDueDate.localeCompare(b.nextDueDate);
        case "frequency": return a.frequency.localeCompare(b.frequency);
        case "category": return a.category.localeCompare(b.category);
        default: {
          const ord: ComplianceStatus[] = ["Overdue", "Due soon", "In progress", "Compliant"];
          return ord.indexOf(a.complianceStatus) - ord.indexOf(b.complianceStatus);
        }
      }
    });
    return out;
  }, [data, search, statusFilter, categoryFilter, sortBy]);

  const totalChecks = data.length;
  const compliantCount = data.filter(r => r.complianceStatus === "Compliant").length;
  const compliantPct = totalChecks > 0 ? Math.round((compliantCount / totalChecks) * 100) : 0;
  const dueSoonCount = data.filter(r => {
    const days = Math.ceil((new Date(r.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 30;
  }).length;
  const overdueCount = data.filter(r => r.complianceStatus === "Overdue").length;

  const exportCols: ExportColumn<StatutoryCheck>[] = useMemo(() => [
    { header: "Check Name", accessor: (r: StatutoryCheck) => r.checkName },
    { header: "Regulatory Basis", accessor: (r: StatutoryCheck) => r.regulatoryBasis },
    { header: "Category", accessor: (r: StatutoryCheck) => r.category },
    { header: "Frequency", accessor: (r: StatutoryCheck) => r.frequency },
    { header: "Last Completed", accessor: (r: StatutoryCheck) => r.lastCompletedDate },
    { header: "Next Due", accessor: (r: StatutoryCheck) => r.nextDueDate },
    { header: "Compliance Status", accessor: (r: StatutoryCheck) => r.complianceStatus },
    { header: "Responsible Owner", accessor: (r: StatutoryCheck) => getStaffName(r.responsibleOwner) },
    { header: "Evidence Location", accessor: (r: StatutoryCheck) => r.evidenceLocation },
    { header: "Children Covered", accessor: (r: StatutoryCheck) => r.childrenCovered },
    { header: "External Reviewer", accessor: (r: StatutoryCheck) => r.externalReviewer },
    { header: "Summary", accessor: (r: StatutoryCheck) => r.summary },
    { header: "Recent Observation", accessor: (r: StatutoryCheck) => r.recentObservation },
    { header: "Escalation Criteria", accessor: (r: StatutoryCheck) => r.escalationCriteria },
  ], []);

  return (
    <PageShell
      title="Statutory Checks Summary"
      subtitle="Compliance overview at a glance — required by Quality Standard 13 and Reg 45"
      actions={[
        <PrintButton key="p" title="Statutory Checks Summary" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="statutory-checks-summary" />,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* compliance overview banner */}
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-indigo-600 mt-0.5" />
          <div>
            <p className="font-semibold">A single-page compliance dashboard</p>
            <p className="text-xs mt-1">
              This page brings together every statutory and regulatory check the home is required to evidence — Reg 44 and Reg 45 reviews,
              statutory child-level reviews and visits, fire safety, water safety, training and records audits — so the manager and
              Responsible Individual can see compliance at a glance. Every item links to the page where the underlying evidence is held;
              no information is duplicated. Required by Quality Standard 13 (leadership and management) and Reg 45.
            </p>
          </div>
        </div>

        {/* overdue alert */}
        {overdueCount > 0 && (
          <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 text-sm text-red-900 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">{overdueCount} statutory check{overdueCount === 1 ? " is" : "s are"} overdue</p>
              <p className="text-xs mt-1">
                Overdue items must be remediated and the cause analysed in the next Reg 45 review.
                Where statutory windows have lapsed, escalation to the Responsible Individual is required immediately.
              </p>
            </div>
          </div>
        )}

        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Checks Tracked", value: totalChecks, icon: ShieldCheck, colour: "text-indigo-600" },
            { label: "Compliant", value: `${compliantPct}%`, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Due Within 30 Days", value: dueSoonCount, icon: Clock, colour: "text-amber-600" },
            { label: "Overdue", value: overdueCount, icon: AlertTriangle, colour: overdueCount > 0 ? "text-red-600" : "text-slate-400" },
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

        {/* filters / sort */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Check name, regulation, evidence…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="w-44">
                <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {(Object.keys(STATUS_CLR) as ComplianceStatus[]).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {(Object.keys(CATEGORY_CLR) as CheckCategory[]).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Compliance priority</SelectItem>
                    <SelectItem value="due">Next due date</SelectItem>
                    <SelectItem value="name">Check name</SelectItem>
                    <SelectItem value="frequency">Frequency</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* expandable cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expandedId === r.id;
            const CategoryIcon = CATEGORY_ICON[r.category];
            const isOverdue = r.complianceStatus === "Overdue";
            return (
              <Card
                key={r.id}
                className={cn(
                  "border-l-4",
                  STATUS_BORDER[r.complianceStatus],
                  isOverdue && "ring-2 ring-red-200 shadow-sm"
                )}
              >
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-wrap flex-1 min-w-0">
                        <CategoryIcon className="h-5 w-5 text-slate-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base">{r.checkName}</CardTitle>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            <Badge className={cn("text-xs", STATUS_CLR[r.complianceStatus])}>{r.complianceStatus}</Badge>
                            <Badge variant="outline" className="text-xs">{r.regulatoryBasis}</Badge>
                            <Badge className={cn("text-xs", CATEGORY_CLR[r.category])}>{r.category}</Badge>
                            <Badge variant="outline" className="text-xs">{r.frequency}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Next due</p>
                          <p className={cn("text-xs font-semibold", isOverdue ? "text-red-700" : "text-slate-700")}>{r.nextDueDate}</p>
                        </div>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    {/* summary */}
                    <p className="text-sm text-slate-700">{r.summary}</p>

                    {/* key facts grid */}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" />Schedule</p>
                        <ul className="text-xs space-y-0.5">
                          <li><span className="text-muted-foreground">Frequency:</span> <strong>{r.frequency}</strong></li>
                          <li><span className="text-muted-foreground">Last completed:</span> <strong>{r.lastCompletedDate}</strong></li>
                          <li><span className="text-muted-foreground">Next due:</span> <strong className={isOverdue ? "text-red-700" : ""}>{r.nextDueDate}</strong></li>
                          <li><span className="text-muted-foreground">Children covered:</span> <strong>{r.childrenCovered}</strong></li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1"><Users className="h-3 w-3" />Ownership</p>
                        <ul className="text-xs space-y-0.5">
                          <li><span className="text-muted-foreground">Responsible owner:</span> <strong>{getStaffName(r.responsibleOwner)}</strong></li>
                          <li><span className="text-muted-foreground">External reviewer:</span> <strong>{r.externalReviewer || "—"}</strong></li>
                          <li><span className="text-muted-foreground">Evidence held in:</span> <strong>{r.evidenceLocation}</strong></li>
                          <li><span className="text-muted-foreground">Regulation:</span> <strong>{r.regulatoryBasis}</strong></li>
                        </ul>
                      </div>
                    </div>

                    {/* recent observation */}
                    <div className={cn(
                      "rounded-lg p-3 border",
                      isOverdue ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
                    )}>
                      <p className={cn(
                        "text-xs font-semibold mb-1 flex items-center gap-1",
                        isOverdue ? "text-red-800" : "text-blue-800"
                      )}>
                        <Eye className="h-3 w-3" />Most recent observation
                      </p>
                      <p className={cn("text-sm", isOverdue ? "text-red-900" : "text-blue-900")}>
                        {r.recentObservation}
                      </p>
                    </div>

                    {/* escalation criteria */}
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />Escalation criteria
                      </p>
                      <p className="text-sm text-amber-900">{r.escalationCriteria}</p>
                    </div>

                    {/* meta */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Owner: <strong>{getStaffName(r.responsibleOwner)}</strong></span>
                      <span>Evidence: <strong>{r.evidenceLocation}</strong></span>
                      <span>Last completed: <strong>{r.lastCompletedDate}</strong></span>
                      <span>Next due: <strong>{r.nextDueDate}</strong></span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No statutory checks match your filters.
              </CardContent>
            </Card>
          )}
        </div>

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>
            Children&apos;s Homes (England) Regulations 2015 — Reg 44 (independent person visits, monthly), Reg 45 (six-monthly review of quality of care),
            Reg 22 (records of children) and Reg 36 (other records to be kept) require structured monitoring and audit. Quality Standard 13 (leadership
            and management) requires leaders to have effective oversight of compliance. Care Planning, Placement and Case Review (England) Regulations 2010
            set the cadence of statutory LAC reviews and visits. The Children and Families Act 2014 governs EHCP review timescales. Health and safety
            checks are governed by the Regulatory Reform (Fire Safety) Order 2005, ACOP L8 (Legionella) and the Electricity at Work Regulations 1989.
            Workforce checks (DBS, mandatory training) are required under Reg 32 and Schedule 2. This summary surfaces the underlying records held
            elsewhere on the platform; it does not duplicate them.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
