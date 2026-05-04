"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INSPECTION READINESS PACK
// Tracks documents and evidence prepared for Ofsted inspection — readiness
// pack contents and currency. Required by Reg 45 and Quality Standard 13.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import {
  ClipboardCheck, Search, ArrowUpDown, Filter,
  CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
  Calendar, User, Star, FileText, BookOpen,
  Folder, MessageSquare, Eye, EyeOff, MapPin,
  Sparkles, RefreshCw, XCircle, Clock,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
type SccifJudgementArea =
  | "Overall Experiences and Progress"
  | "How well children are helped and protected"
  | "Effectiveness of leaders and managers";

type ReadinessCategory =
  | "Statutory documentation"
  | "Records of practice"
  | "Children's voice evidence"
  | "Outcome data"
  | "Workforce"
  | "Environment"
  | "Quality assurance";

type InPackStatus = "Ready" | "Needs refresh" | "Missing" | "In progress";

interface ReadinessItem {
  id: string;
  itemName: string;
  sccifJudgementArea: SccifJudgementArea;
  category: ReadinessCategory;
  description: string;
  currentVersion: string;
  lastUpdated: string;
  nextReviewDue: string;
  locationOfDocument: string;
  responsibleOwner: string;
  inPackStatus: InPackStatus;
  evidenceQualityRating: number; // 1-5
  examplesIncluded: string[];
  childVoiceWoven: boolean;
  accessibleToInspector: boolean;
  accessibleToChildren: boolean;
  commentary: string;
}

/* ── label & colour maps ─────────────────────────────────────────────── */
const STATUS_COLOUR: Record<InPackStatus, string> = {
  "Ready": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Needs refresh": "bg-amber-50 text-amber-700 border-amber-200",
  "Missing": "bg-red-50 text-red-700 border-red-200",
  "In progress": "bg-blue-50 text-blue-700 border-blue-200",
};

const STATUS_BORDER: Record<InPackStatus, string> = {
  "Ready": "border-l-emerald-400",
  "Needs refresh": "border-l-amber-400",
  "Missing": "border-l-red-400",
  "In progress": "border-l-blue-400",
};

const STATUS_ICON: Record<InPackStatus, React.ComponentType<{ className?: string }>> = {
  "Ready": CheckCircle2,
  "Needs refresh": RefreshCw,
  "Missing": XCircle,
  "In progress": Clock,
};

const STATUS_ICON_COLOUR: Record<InPackStatus, string> = {
  "Ready": "text-emerald-600",
  "Needs refresh": "text-amber-600",
  "Missing": "text-red-600",
  "In progress": "text-blue-600",
};

const SCCIF_COLOUR: Record<SccifJudgementArea, string> = {
  "Overall Experiences and Progress": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "How well children are helped and protected": "bg-rose-50 text-rose-700 border-rose-200",
  "Effectiveness of leaders and managers": "bg-violet-50 text-violet-700 border-violet-200",
};

const CATEGORY_COLOUR: Record<ReadinessCategory, string> = {
  "Statutory documentation": "bg-slate-100 text-slate-700 border-slate-200",
  "Records of practice": "bg-blue-50 text-blue-700 border-blue-200",
  "Children's voice evidence": "bg-pink-50 text-pink-700 border-pink-200",
  "Outcome data": "bg-teal-50 text-teal-700 border-teal-200",
  "Workforce": "bg-amber-50 text-amber-700 border-amber-200",
  "Environment": "bg-lime-50 text-lime-700 border-lime-200",
  "Quality assurance": "bg-violet-50 text-violet-700 border-violet-200",
};

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: ReadinessItem[] = [
  {
    id: "rdy_01",
    itemName: "Statement of Purpose",
    sccifJudgementArea: "Effectiveness of leaders and managers",
    category: "Statutory documentation",
    description: "Document setting out the home's aims, objectives, ethos, and the range of needs of the children for whom it provides care. Required under Reg 16 and Schedule 1 of the Children's Homes Regulations 2015.",
    currentVersion: "v4.2",
    lastUpdated: d(-22),
    nextReviewDue: d(160),
    locationOfDocument: "Office locked file + Platform — Statement of Purpose page",
    responsibleOwner: "staff_darren",
    inPackStatus: "Ready",
    evidenceQualityRating: 5,
    examplesIncluded: [
      "Schedule 1 mapping appendix",
      "Therapeutic model articulated (trauma-informed, relational practice)",
      "Range of needs detailed with admission criteria",
      "Staffing structure and qualifications",
    ],
    childVoiceWoven: true,
    accessibleToInspector: true,
    accessibleToChildren: true,
    commentary: "Reviewed and refreshed following the most recent Ofsted inspection feedback. Cross-referenced with Children's Guide to ensure consistency. Inspector copy ready in office; child-friendly summary embedded in Children's Guide.",
  },
  {
    id: "rdy_02",
    itemName: "Children's Guide",
    sccifJudgementArea: "Overall Experiences and Progress",
    category: "Statutory documentation",
    description: "Accessible guide for children in the home explaining how the home runs, their rights, how to make complaints, and how to access an advocate. Required under Reg 16(3).",
    currentVersion: "v3.1",
    lastUpdated: d(-40),
    nextReviewDue: d(140),
    locationOfDocument: "Each child's bedroom + Office reception copy + Platform — Children's Guide page",
    responsibleOwner: "staff_ryan",
    inPackStatus: "Ready",
    evidenceQualityRating: 4,
    examplesIncluded: [
      "Plain English version reviewed by current residents",
      "Pictorial / accessible version available",
      "Complaints process and Children's Commissioner contact details",
      "Independent advocate (NYAS) details and Reg 44 visitor introduction",
    ],
    childVoiceWoven: true,
    accessibleToInspector: true,
    accessibleToChildren: true,
    commentary: "Children helped review and approve the latest version during a house meeting. One area for refresh — adding more imagery to the online safety section per feedback from Casey.",
  },
  {
    id: "rdy_03",
    itemName: "Reg 45 Quality of Care Review (most recent)",
    sccifJudgementArea: "Effectiveness of leaders and managers",
    category: "Quality assurance",
    description: "Six-monthly review of the quality of care provided. Includes analysis of incidents, complaints, outcomes, and feedback from children, staff, and external partners.",
    currentVersion: "v1.0 — H1 2026",
    lastUpdated: d(-18),
    nextReviewDue: d(165),
    locationOfDocument: "Office locked file + Platform — Reg 45 Reports page",
    responsibleOwner: "staff_darren",
    inPackStatus: "Ready",
    evidenceQualityRating: 5,
    examplesIncluded: [
      "Quantitative data section (incidents, missing episodes, restraints, attendance)",
      "Children's voice section with direct quotes and feedback",
      "External feedback (social workers, IROs, schools, health)",
      "Action plan with owners and timescales",
    ],
    childVoiceWoven: true,
    accessibleToInspector: true,
    accessibleToChildren: false,
    commentary: "Strong report with clear self-reflection. Action plan owned by RM and tracked through monthly senior team meetings. Previous Reg 45 reports archived alongside for trend comparison.",
  },
  {
    id: "rdy_04",
    itemName: "Reg 44 Independent Visitor Reports (last 6 months)",
    sccifJudgementArea: "How well children are helped and protected",
    category: "Quality assurance",
    description: "Monthly reports from the independent visitor evidencing scrutiny of safeguarding, children's welfare, and the home's compliance with regulations.",
    currentVersion: "Reports Nov 2025 — Apr 2026",
    lastUpdated: d(-9),
    nextReviewDue: d(21),
    locationOfDocument: "Office locked file + Platform — Reg 44 Reports page",
    responsibleOwner: "staff_darren",
    inPackStatus: "Ready",
    evidenceQualityRating: 5,
    examplesIncluded: [
      "Six consecutive monthly reports filed",
      "Children's views directly captured and quoted",
      "Recommendations tracked with response timescales",
      "Cross-referenced against safeguarding register",
    ],
    childVoiceWoven: true,
    accessibleToInspector: true,
    accessibleToChildren: false,
    commentary: "All recommendations actioned within agreed timescales — tracker shows 100% closure. Independent visitor relationship strong; visits unannounced and consistently thorough.",
  },
  {
    id: "rdy_05",
    itemName: "Care Plans (sample of 3)",
    sccifJudgementArea: "Overall Experiences and Progress",
    category: "Records of practice",
    description: "Sample of current care plans for the three children in placement, evidencing how needs are identified and met, with clear outcomes and review history.",
    currentVersion: "Current cycle — reviewed within last 90 days",
    lastUpdated: d(-12),
    nextReviewDue: d(78),
    locationOfDocument: "Platform — Care Plans page (Alex, Jordan, Casey)",
    responsibleOwner: "staff_darren",
    inPackStatus: "Ready",
    evidenceQualityRating: 4,
    examplesIncluded: [
      "Identified needs across health, education, contact, identity, emotional development",
      "SMART outcomes with progress evidence",
      "Child's view evidenced in 'My Plan' section",
      "Linked to Outcome Star and Reg 45 outcome data",
    ],
    childVoiceWoven: true,
    accessibleToInspector: true,
    accessibleToChildren: true,
    commentary: "All three plans current. Jordan's CAMHS section needs strengthening once external assessment date is confirmed — flagged on action log.",
  },
  {
    id: "rdy_06",
    itemName: "Placement Plans (sample of 3)",
    sccifJudgementArea: "Overall Experiences and Progress",
    category: "Statutory documentation",
    description: "Documents agreed with the placing authority describing how the day-to-day care of each child will be delivered, in line with the child's care plan.",
    currentVersion: "Current per child",
    lastUpdated: d(-15),
    nextReviewDue: d(75),
    locationOfDocument: "Platform — Placement Plans page",
    responsibleOwner: "staff_ryan",
    inPackStatus: "Needs refresh",
    evidenceQualityRating: 3,
    examplesIncluded: [
      "Delegated authority schedule",
      "Contact arrangements",
      "Behaviour management approach individualised",
      "Risk and protective factors",
    ],
    childVoiceWoven: false,
    accessibleToInspector: true,
    accessibleToChildren: true,
    commentary: "Casey's placement plan needs refresh following recent exploitation strategy meeting — updated risk and protective factors not yet re-documented. Action: refresh by end of week. Child voice section underdeveloped across all three — wider improvement piece.",
  },
  {
    id: "rdy_07",
    itemName: "Individual Outcomes Evidence (Outcome Stars + progress data)",
    sccifJudgementArea: "Overall Experiences and Progress",
    category: "Outcome data",
    description: "Evidence of measurable progress for each child across emotional, educational, health, and social domains — Outcome Star assessments, attendance data, and developmental milestones.",
    currentVersion: "Q1 2026 cycle complete",
    lastUpdated: d(-25),
    nextReviewDue: d(65),
    locationOfDocument: "Platform — Outcome Tracking page + Annual Outcomes Report",
    responsibleOwner: "staff_darren",
    inPackStatus: "Ready",
    evidenceQualityRating: 5,
    examplesIncluded: [
      "Outcome Star comparison charts (entry vs current)",
      "Education attendance and attainment data",
      "Health appointment compliance",
      "Behaviour incident trend (downward across all three children)",
    ],
    childVoiceWoven: true,
    accessibleToInspector: true,
    accessibleToChildren: true,
    commentary: "Strong evidence of progress for all three children. Visual data summaries are inspection-ready. Outcome Stars co-produced with each young person.",
  },
  {
    id: "rdy_08",
    itemName: "Voice of the Child Evidence Pack",
    sccifJudgementArea: "Overall Experiences and Progress",
    category: "Children's voice evidence",
    description: "Curated pack evidencing how children's views shape the home — house meetings, key-work records, advocacy contacts, complaints, surveys, and direct quotes.",
    currentVersion: "Rolling 12 months",
    lastUpdated: d(-7),
    nextReviewDue: d(30),
    locationOfDocument: "Platform — Voice of the Child page + House Meeting minutes",
    responsibleOwner: "staff_ryan",
    inPackStatus: "Ready",
    evidenceQualityRating: 5,
    examplesIncluded: [
      "House meeting minutes (12 months)",
      "Examples of decisions changed because of children's input",
      "NYAS advocacy contact log",
      "Children's feedback on staff and Reg 44 visitors",
    ],
    childVoiceWoven: true,
    accessibleToInspector: true,
    accessibleToChildren: true,
    commentary: "Particularly strong area. Concrete examples include menu redesign, bedroom personalisation budget, and the activities programme — all driven by children's input.",
  },
  {
    id: "rdy_09",
    itemName: "Complaints Log + Responses (rolling 12 months)",
    sccifJudgementArea: "How well children are helped and protected",
    category: "Records of practice",
    description: "Record of all complaints received from children, parents, professionals, or others — including investigation, response, outcome, and learning.",
    currentVersion: "Rolling — 4 entries in last 12 months",
    lastUpdated: d(-11),
    nextReviewDue: d(50),
    locationOfDocument: "Platform — Complaints Log page",
    responsibleOwner: "staff_darren",
    inPackStatus: "Ready",
    evidenceQualityRating: 4,
    examplesIncluded: [
      "Each complaint logged with timeline",
      "Outcome and response shared with complainant",
      "Learning identified and embedded",
      "Themes analysed quarterly",
    ],
    childVoiceWoven: true,
    accessibleToInspector: true,
    accessibleToChildren: false,
    commentary: "Low volume but openly recorded — including minor concerns from children that did not formally meet 'complaint' threshold but were treated as such. Demonstrates a culture of openness.",
  },
  {
    id: "rdy_10",
    itemName: "Safeguarding Records (notifications, strategy, MASH referrals)",
    sccifJudgementArea: "How well children are helped and protected",
    category: "Records of practice",
    description: "All Reg 40 notifications to Ofsted, strategy meeting minutes, MASH/LADO referrals, and safeguarding chronologies for each child.",
    currentVersion: "Rolling 12 months",
    lastUpdated: d(-4),
    nextReviewDue: d(30),
    locationOfDocument: "Office locked safeguarding file + Platform — Safeguarding page",
    responsibleOwner: "staff_darren",
    inPackStatus: "Ready",
    evidenceQualityRating: 4,
    examplesIncluded: [
      "Reg 40 notifications log with Ofsted reference numbers",
      "Strategy meeting minutes for Casey's exploitation concerns",
      "LADO referrals (zero in past 12 months)",
      "Missing from care episodes with return interviews",
    ],
    childVoiceWoven: false,
    accessibleToInspector: true,
    accessibleToChildren: false,
    commentary: "One late notification 3 months ago — process strengthened with same-day reporting protocol. All return interviews completed within 72 hours.",
  },
  {
    id: "rdy_11",
    itemName: "Training Matrix (all staff, all mandatory and supplementary)",
    sccifJudgementArea: "Effectiveness of leaders and managers",
    category: "Workforce",
    description: "Live matrix tracking every staff member's training status across mandatory, role-specific, and developmental areas. Shows compliance, expiry dates, and renewal pipeline.",
    currentVersion: "Live — refreshed monthly",
    lastUpdated: d(-2),
    nextReviewDue: d(28),
    locationOfDocument: "Platform — Training Matrix page",
    responsibleOwner: "staff_darren",
    inPackStatus: "Ready",
    evidenceQualityRating: 5,
    examplesIncluded: [
      "Mandatory training compliance: 100%",
      "TCI refresher cycle tracked",
      "Online safety training added quarterly",
      "Level 3/4/5 qualification progression evidenced",
    ],
    childVoiceWoven: false,
    accessibleToInspector: true,
    accessibleToChildren: false,
    commentary: "Inspection-ready. Two new starters tracked through induction milestones. Deputy recently completed Level 5; RM progressing through Level 7.",
  },
  {
    id: "rdy_12",
    itemName: "Reg 32 Fitness of Workers Checks",
    sccifJudgementArea: "Effectiveness of leaders and managers",
    category: "Workforce",
    description: "Documentation evidencing all staff have undergone the Schedule 2 checks required under Reg 32 — DBS, references, identity, qualifications, right to work, health.",
    currentVersion: "All staff current",
    lastUpdated: d(-30),
    nextReviewDue: d(60),
    locationOfDocument: "Office locked HR file (per staff member)",
    responsibleOwner: "staff_darren",
    inPackStatus: "Ready",
    evidenceQualityRating: 4,
    examplesIncluded: [
      "Enhanced DBS with Children's Barred List for all staff",
      "Two written references per staff member, verified verbally",
      "Identity, right to work, qualifications evidenced",
      "Health declaration signed and reviewed",
    ],
    childVoiceWoven: false,
    accessibleToInspector: true,
    accessibleToChildren: false,
    commentary: "All Schedule 2 checks complete and audited. DBS update service registrations active. Annual rechecks scheduled. One staff member's reference file required minor admin tidy — actioned.",
  },
  {
    id: "rdy_13",
    itemName: "Recruitment Files (sample of 2 — most recent appointments)",
    sccifJudgementArea: "Effectiveness of leaders and managers",
    category: "Workforce",
    description: "Full recruitment files for the two most recent appointments — application, shortlisting, interview notes, references, pre-employment checks, induction record.",
    currentVersion: "2 appointments since Jan 2026",
    lastUpdated: d(-44),
    nextReviewDue: d(90),
    locationOfDocument: "Office locked HR file",
    responsibleOwner: "staff_darren",
    inPackStatus: "In progress",
    evidenceQualityRating: 3,
    examplesIncluded: [
      "Application form and motivation statement",
      "Interview panel notes with scoring",
      "Pre-employment check pack",
      "Induction record signed off",
    ],
    childVoiceWoven: false,
    accessibleToInspector: true,
    accessibleToChildren: false,
    commentary: "One of the two files needs interview notes uploading from the panel chair — overdue admin task. Files otherwise complete and compliant. Action: chase by end of week.",
  },
  {
    id: "rdy_14",
    itemName: "Environment Audits (latest cycle)",
    sccifJudgementArea: "How well children are helped and protected",
    category: "Environment",
    description: "Latest health and safety, fire, infection control, and bedroom personalisation audits showing the home is a safe, well-maintained, and homely environment.",
    currentVersion: "Q1 2026 cycle",
    lastUpdated: d(-6),
    nextReviewDue: d(85),
    locationOfDocument: "Platform — Audits page + Building Compliance file",
    responsibleOwner: "staff_ryan",
    inPackStatus: "Ready",
    evidenceQualityRating: 4,
    examplesIncluded: [
      "Fire risk assessment current with drill records",
      "Infection control audit signed off",
      "Bedroom personalisation evidence (each child)",
      "Maintenance log with response times",
    ],
    childVoiceWoven: true,
    accessibleToInspector: true,
    accessibleToChildren: false,
    commentary: "Home presents as warm, homely, and well-maintained. Children's bedrooms personalised with photos, posters, and chosen decor. Communal areas refreshed in last 6 months.",
  },
  {
    id: "rdy_15",
    itemName: "Business Continuity Plan",
    sccifJudgementArea: "Effectiveness of leaders and managers",
    category: "Statutory documentation",
    description: "Plan addressing how the home will continue to operate safely in the event of disruption — staffing crisis, RM absence, building incident, IT failure, pandemic.",
    currentVersion: "v2.0 — draft for RI sign-off",
    lastUpdated: d(-50),
    nextReviewDue: d(14),
    locationOfDocument: "Platform — Business Continuity page (DRAFT)",
    responsibleOwner: "staff_darren",
    inPackStatus: "Needs refresh",
    evidenceQualityRating: 3,
    examplesIncluded: [
      "RM absence cover arrangements",
      "Staffing escalation contacts",
      "IT/data continuity",
      "Building / utilities emergency response",
    ],
    childVoiceWoven: false,
    accessibleToInspector: true,
    accessibleToChildren: false,
    commentary: "Identified as a development area in the latest Self-Evaluation. Draft v2.0 written; awaiting RI review and formal sign-off. Target: completion within 14 days. Once finalised, status moves to Ready.",
  },
  {
    id: "rdy_16",
    itemName: "Location Risk Assessment",
    sccifJudgementArea: "How well children are helped and protected",
    category: "Statutory documentation",
    description: "Reg 26 location risk assessment evidencing analysis of community risks (exploitation hotspots, gang activity, transport, isolation) and the home's mitigations.",
    currentVersion: "v3.0",
    lastUpdated: d(-35),
    nextReviewDue: d(150),
    locationOfDocument: "Office locked file + Platform — Location Risk Assessment page",
    responsibleOwner: "staff_darren",
    inPackStatus: "Ready",
    evidenceQualityRating: 4,
    examplesIncluded: [
      "Police data on local community risks",
      "Mapping of CSE/CCE hotspots",
      "Transport links and missing-from-care risk analysis",
      "Mitigations linked to individual placement plans",
    ],
    childVoiceWoven: false,
    accessibleToInspector: true,
    accessibleToChildren: false,
    commentary: "Reviewed annually with police single point of contact and the local safeguarding partnership. Updated to reflect Casey's exploitation profile and the wider Op-level intelligence shared at the most recent strategy meeting.",
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function InspectionReadinessPackPage() {
  const [entries] = useState<ReadinessItem[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterArea, setFilterArea] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "status" | "quality" | "review">("status");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ── filtering & sorting ────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...entries];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.itemName.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.commentary.toLowerCase().includes(q) ||
          e.examplesIncluded.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (filterStatus !== "all") list = list.filter((e) => e.inPackStatus === filterStatus);
    if (filterArea !== "all") list = list.filter((e) => e.sccifJudgementArea === filterArea);
    if (filterCategory !== "all") list = list.filter((e) => e.category === filterCategory);

    const statusOrder: Record<InPackStatus, number> = {
      "Missing": 0,
      "Needs refresh": 1,
      "In progress": 2,
      "Ready": 3,
    };

    list.sort((a, b) => {
      switch (sortBy) {
        case "status":
          return statusOrder[a.inPackStatus] - statusOrder[b.inPackStatus];
        case "quality":
          return b.evidenceQualityRating - a.evidenceQualityRating;
        case "review":
          return a.nextReviewDue.localeCompare(b.nextReviewDue);
        case "name":
        default:
          return a.itemName.localeCompare(b.itemName);
      }
    });
    return list;
  }, [entries, search, filterStatus, filterArea, filterCategory, sortBy]);

  /* ── stats ──────────────────────────────────────────────────────── */
  const totalItems = entries.length;
  const readyCount = entries.filter((e) => e.inPackStatus === "Ready").length;
  const readyPct = totalItems > 0 ? Math.round((readyCount / totalItems) * 100) : 0;
  const needsRefreshCount = entries.filter((e) => e.inPackStatus === "Needs refresh").length;
  const avgQuality = totalItems > 0
    ? (entries.reduce((sum, e) => sum + e.evidenceQualityRating, 0) / totalItems).toFixed(1)
    : "0.0";

  /* ── export columns ─────────────────────────────────────────────── */
  const exportCols: ExportColumn<ReadinessItem>[] = [
    { header: "Item", accessor: (r: ReadinessItem) => r.itemName },
    { header: "SCCIF Judgement Area", accessor: (r: ReadinessItem) => r.sccifJudgementArea },
    { header: "Category", accessor: (r: ReadinessItem) => r.category },
    { header: "Status", accessor: (r: ReadinessItem) => r.inPackStatus },
    { header: "Version", accessor: (r: ReadinessItem) => r.currentVersion },
    { header: "Last Updated", accessor: (r: ReadinessItem) => r.lastUpdated },
    { header: "Next Review Due", accessor: (r: ReadinessItem) => r.nextReviewDue },
    { header: "Location", accessor: (r: ReadinessItem) => r.locationOfDocument },
    { header: "Owner", accessor: (r: ReadinessItem) => getStaffName(r.responsibleOwner) },
    { header: "Quality (1-5)", accessor: (r: ReadinessItem) => r.evidenceQualityRating },
    { header: "Child Voice Woven", accessor: (r: ReadinessItem) => r.childVoiceWoven ? "Yes" : "No" },
    { header: "Accessible to Inspector", accessor: (r: ReadinessItem) => r.accessibleToInspector ? "Yes" : "No" },
    { header: "Accessible to Children", accessor: (r: ReadinessItem) => r.accessibleToChildren ? "Yes" : "No" },
    { header: "Commentary", accessor: (r: ReadinessItem) => r.commentary },
  ];

  return (
    <PageShell
      title="Inspection Readiness Pack"
      subtitle="Curated documents and evidence prepared for Ofsted inspection — readiness pack contents and currency"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Inspection Readiness Pack" />
          <ExportButton data={filtered} columns={exportCols} filename="inspection-readiness-pack" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── summary stats ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Items", value: totalItems, icon: Folder, colour: "text-indigo-600" },
            { label: "Ready %", value: `${readyPct}%`, icon: CheckCircle2, colour: "text-emerald-600" },
            { label: "Needs Refresh", value: needsRefreshCount, icon: RefreshCw, colour: "text-amber-600" },
            { label: "Avg Quality (1-5)", value: avgQuality, icon: Star, colour: "text-violet-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── filters & sort ─────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search items, descriptions, examples, commentary..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[170px] h-9 text-sm">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Ready">Ready</SelectItem>
                <SelectItem value="Needs refresh">Needs refresh</SelectItem>
                <SelectItem value="In progress">In progress</SelectItem>
                <SelectItem value="Missing">Missing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="w-[260px] h-9 text-sm">
                <SelectValue placeholder="All SCCIF Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SCCIF Areas</SelectItem>
                <SelectItem value="Overall Experiences and Progress">Overall Experiences and Progress</SelectItem>
                <SelectItem value="How well children are helped and protected">Helped and Protected</SelectItem>
                <SelectItem value="Effectiveness of leaders and managers">Leaders and Managers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Folder className="h-4 w-4 text-muted-foreground" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[210px] h-9 text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Statutory documentation">Statutory documentation</SelectItem>
                <SelectItem value="Records of practice">Records of practice</SelectItem>
                <SelectItem value="Children's voice evidence">Children&apos;s voice evidence</SelectItem>
                <SelectItem value="Outcome data">Outcome data</SelectItem>
                <SelectItem value="Workforce">Workforce</SelectItem>
                <SelectItem value="Environment">Environment</SelectItem>
                <SelectItem value="Quality assurance">Quality assurance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "name" | "status" | "quality" | "review")}>
              <SelectTrigger className="w-[170px] h-9 text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Status (most urgent)</SelectItem>
                <SelectItem value="name">Item name</SelectItem>
                <SelectItem value="quality">Quality rating</SelectItem>
                <SelectItem value="review">Next review due</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── readiness item cards ───────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardCheck className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              No readiness items match your filters.
            </div>
          )}
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            const StatusIcon = STATUS_ICON[item.inPackStatus];
            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl border border-l-4 bg-white overflow-hidden",
                  STATUS_BORDER[item.inPackStatus]
                )}
              >
                {/* collapsed header */}
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <StatusIcon className={cn("h-5 w-5 shrink-0", STATUS_ICON_COLOUR[item.inPackStatus])} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{item.itemName}</p>
                        <span className="text-xs text-muted-foreground">{item.currentVersion}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", STATUS_COLOUR[item.inPackStatus])}>
                          {item.inPackStatus}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", SCCIF_COLOUR[item.sccifJudgementArea])}>
                          {item.sccifJudgementArea}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", CATEGORY_COLOUR[item.category])}>
                          {item.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Star className="h-3 w-3 text-violet-500" />
                          {item.evidenceQualityRating}/5
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground hidden md:inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Review {item.nextReviewDue}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {/* expanded detail */}
                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* description */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-500" />
                          Description
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-700">{item.description}</p>
                      </CardContent>
                    </Card>

                    {/* meta grid */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <ClipboardCheck className="h-4 w-4 text-indigo-500" />
                          Pack Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Location</p>
                              <p className="text-slate-700">{item.locationOfDocument}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <User className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Responsible Owner</p>
                              <p className="text-slate-700">{getStaffName(item.responsibleOwner)}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Last Updated</p>
                              <p className="text-slate-700">{item.lastUpdated}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Next Review Due</p>
                              <p className="text-slate-700">{item.nextReviewDue}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Star className="h-3.5 w-3.5 text-violet-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Evidence Quality</p>
                              <p className="text-slate-700 font-medium">{item.evidenceQualityRating} / 5</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Current Version</p>
                              <p className="text-slate-700">{item.currentVersion}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* examples included */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-emerald-500" />
                          Examples Included
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {item.examplesIncluded.map((ex, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              {ex}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* access & voice flags */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Eye className="h-4 w-4 text-blue-500" />
                          Access &amp; Voice
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={cn(
                            "text-xs px-2 py-0.5 border inline-flex items-center gap-1",
                            item.childVoiceWoven
                              ? "bg-pink-50 text-pink-700 border-pink-200"
                              : "bg-slate-50 text-slate-500 border-slate-200"
                          )}>
                            <MessageSquare className="h-3 w-3" />
                            {item.childVoiceWoven ? "Child voice woven" : "Child voice not woven"}
                          </Badge>
                          <Badge variant="outline" className={cn(
                            "text-xs px-2 py-0.5 border inline-flex items-center gap-1",
                            item.accessibleToInspector
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          )}>
                            {item.accessibleToInspector ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            {item.accessibleToInspector ? "Accessible to inspector" : "Inspector access blocked"}
                          </Badge>
                          <Badge variant="outline" className={cn(
                            "text-xs px-2 py-0.5 border inline-flex items-center gap-1",
                            item.accessibleToChildren
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-50 text-slate-500 border-slate-200"
                          )}>
                            {item.accessibleToChildren ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            {item.accessibleToChildren ? "Accessible to children" : "Not for children"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* commentary */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          Commentary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-700 whitespace-pre-line">{item.commentary}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory note ──────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <div className="flex items-start gap-2">
            <BookOpen className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p>
                <strong>About the Inspection Readiness Pack:</strong> Ofsted inspections are short-notice
                events. The Registered Manager and Responsible Individual must be able to evidence the home&apos;s
                practice quickly, accurately, and honestly. This readiness pack is a living index of the
                documents and evidence an inspector may request — kept current, locatable, and quality-assured.
              </p>
              <p>
                The pack is structured around the three SCCIF judgement areas — overall experiences and
                progress, how well children are helped and protected, and the effectiveness of leaders and
                managers. Required by <strong>Reg 45</strong> (review of quality of care) and aligned to
                <strong> Quality Standard 13</strong> (the leadership and management standard) of the
                Children&apos;s Homes Regulations 2015. Reg 16 (Statement of Purpose) and Reg 32 (fitness of
                workers) are also core components.
              </p>
              <p>
                <strong>Important:</strong> Documents alone do not evidence a good home — practice does.
                The readiness pack is a starting point; inspectors will triangulate written evidence with
                children&apos;s lived experience, staff practice, and external partner views. Honest curation
                — including identifying what needs refresh — strengthens credibility far more than a pack
                that overstates readiness.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
