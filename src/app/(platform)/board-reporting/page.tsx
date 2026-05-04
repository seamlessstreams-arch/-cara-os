"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BOARD REPORTING
// Formal reports submitted by the Registered Manager to the Responsible
// Individual, Cornerstone Care Group Board and other governance bodies.
// Required by Quality Standard 13 (Leadership & Management) and Regulation 45.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Send,
  Shield,
  TrendingUp,
  MessageSquare,
  Paperclip,
  Users,
  Target,
} from "lucide-react";

/* ─── date helper ─── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ─── types ─── */
type ReportType =
  | "Monthly RM Report"
  | "Quarterly Performance"
  | "Annual Report"
  | "Reg 45 Six-Monthly"
  | "Reg 44 Triangulation"
  | "Incident Briefing"
  | "Strategic Update";

type RagRating = "Red" | "Amber" | "Green";

interface MetricValue {
  value: string;
  change: string;
}

interface AgreedAction {
  action: string;
  owner: string;
  deadline: string;
  status: "completed" | "in_progress" | "overdue" | "pending";
}

interface BoardReport {
  id: string;
  reportType: ReportType;
  reportPeriod: string;
  submittedDate: string;
  submittedTo: string;
  authoredBy: string;
  summary: string;
  keyMetrics: Record<string, MetricValue>;
  narrativeHighlights: string[];
  areasOfConcern: string[];
  riskRagRating: RagRating;
  strategicQuestionsRaised: string[];
  boardResponseReceived: boolean;
  boardFeedback: string;
  actionsAgreed: AgreedAction[];
  evidenceAttachments: string[];
  childOutcomesNarrative: string;
  distributionList: string[];
  retentionPeriod: string;
  nextReportDue: string;
}

/* ─── seed data ─── */
const reports: BoardReport[] = [
  {
    id: "br_001",
    reportType: "Monthly RM Report",
    reportPeriod: "April 2026",
    submittedDate: d(-3),
    submittedTo: "Helen Frost (Responsible Individual)",
    authoredBy: "staff_darren",
    summary:
      "Oak House continues to operate to a Good standard with Outstanding features. All three young people made measurable progress against placement plans this month. Staffing remains stable with one waking-night vacancy now offered. No notifiable events. One Reg 44 visit completed with positive findings and a single recommendation actioned within 7 days.",
    keyMetrics: {
      "Occupancy": { value: "3 / 3", change: "stable" },
      "Education attendance": { value: "94%", change: "+2% MoM" },
      "Significant incidents": { value: "1", change: "−2 vs last month" },
      "Restraints": { value: "0", change: "stable at zero" },
      "Missing episodes": { value: "1", change: "−1 MoM" },
      "Staff sickness": { value: "1.8%", change: "−0.4% MoM" },
      "Agency hours": { value: "82h", change: "−24h MoM" },
      "Complaints": { value: "0", change: "stable" },
    },
    narrativeHighlights: [
      "Alex achieved 100% education attendance for second consecutive month",
      "Casey began Independence Skills programme with Chervelle as lead key worker",
      "Therapeutic consultation embedded into supervision cycle",
      "Reg 44 visitor commended the relational warmth of the staff team",
      "Garden improvement project completed with young people's involvement",
    ],
    areasOfConcern: [
      "Casey's missing episode on 14 April — multi-agency strategy meeting held, no exploitation indicators identified",
      "Waking-night vacancy filled by agency until new starter inducted (estimated 4 weeks)",
    ],
    riskRagRating: "Green",
    strategicQuestionsRaised: [
      "Should we commission additional therapeutic input for Jordan ahead of Year 11 transition pressures?",
      "Is the current key working frequency (weekly) sufficient for Casey during transitions planning?",
    ],
    boardResponseReceived: true,
    boardFeedback:
      "RI confirmed report is comprehensive and assured by direction of travel. Approved commissioning of additional therapeutic input for Jordan subject to local authority funding agreement. Asked RM to bring transitions plan for Casey to next monthly meeting in full detail.",
    actionsAgreed: [
      { action: "Commission additional therapeutic input for Jordan — agree scope with commissioner", owner: "staff_darren", deadline: d(14), status: "in_progress" },
      { action: "Bring full Casey transitions plan to next monthly RM report", owner: "staff_darren", deadline: d(27), status: "pending" },
      { action: "Confirm waking-night recruit start date and induction plan", owner: "staff_ryan", deadline: d(7), status: "in_progress" },
    ],
    evidenceAttachments: [
      "Reg 44 visitor report — April 2026.pdf",
      "Education attendance summary.xlsx",
      "Incident analysis pack — April.pdf",
      "Outcome Star summaries (anonymised).pdf",
    ],
    childOutcomesNarrative:
      "All three young people are progressing against placement plan goals. Alex shows sustained academic engagement and stable peer relationships. Jordan continues to manage emotional regulation more effectively, supported by therapeutic input. Casey is showing readiness for independence work, though missing-from-care risk requires continued vigilance through the transitions period.",
    distributionList: ["Helen Frost (RI)", "Cornerstone Care Group Board (Chair)", "Quality & Compliance Lead"],
    retentionPeriod: "Retain for 7 years (governance record)",
    nextReportDue: d(27),
  },
  {
    id: "br_002",
    reportType: "Quarterly Performance",
    reportPeriod: "Q1 2026",
    submittedDate: d(-25),
    submittedTo: "Cornerstone Care Group Board",
    authoredBy: "staff_darren",
    summary:
      "Q1 2026 performance shows continued strong outcomes across Quality Standards. Education attendance averaged 92% across the quarter. Zero restraints. One missing episode resulting in safe return within 4 hours. Staff retention 100% over the period with one new appointment completing successful induction. All Reg 44 visits completed, all Reg 45 reviews on schedule.",
    keyMetrics: {
      "Occupancy (avg)": { value: "98%", change: "+3% vs Q4 2025" },
      "Education attendance (avg)": { value: "92%", change: "+5% YoY" },
      "Restraints": { value: "0", change: "−2 vs Q4" },
      "Significant incidents": { value: "4", change: "−6 vs Q4" },
      "Complaints upheld": { value: "0", change: "stable" },
      "Compliments": { value: "9", change: "+4 vs Q4" },
      "Mandatory training compliance": { value: "98%", change: "+2% QoQ" },
      "Supervision compliance": { value: "100%", change: "stable" },
      "Reg 44 actions closed": { value: "6 / 6", change: "100%" },
    },
    narrativeHighlights: [
      "Outstanding feedback from independent visitor across all three quarterly visits",
      "Zero restraints across the quarter — embedded de-escalation approach",
      "All three young people achieved at least one personally significant outcome",
      "Staff team completed therapeutic care framework training",
      "Two compliments from placing local authorities regarding quality of practice",
    ],
    areasOfConcern: [
      "Local authority fee uplift not yet confirmed — may affect Q2 budget projections",
      "Casey's transitions planning needs strategic-level engagement with commissioner",
    ],
    riskRagRating: "Green",
    strategicQuestionsRaised: [
      "Does the Board wish to formally publish anonymised quarterly outcomes data on the Cornerstone website?",
      "Should we expand the therapeutic care offer to include ART-informed group work?",
    ],
    boardResponseReceived: true,
    boardFeedback:
      "Board commended the home's performance and the clarity of reporting. Approved publication of anonymised outcomes data subject to legal review of consent and disclosure principles. Deferred ART decision pending costed proposal at Q2 reporting. Asked RM to escalate fee uplift discussion via the commissioning relationship lead.",
    actionsAgreed: [
      { action: "Submit anonymised outcomes data publication plan to legal review", owner: "staff_darren", deadline: d(-10), status: "completed" },
      { action: "Prepare costed ART-informed group work proposal for Q2 report", owner: "staff_darren", deadline: d(60), status: "in_progress" },
      { action: "Escalate fee uplift discussion to commissioning lead", owner: "staff_darren", deadline: d(-15), status: "completed" },
    ],
    evidenceAttachments: [
      "Q1 2026 Outcomes Pack.pdf",
      "Reg 44 quarterly summary.pdf",
      "Workforce dashboard Q1.xlsx",
      "Complaints & compliments register Q1.pdf",
    ],
    childOutcomesNarrative:
      "Across the quarter, all three young people demonstrated meaningful progress in education, emotional wellbeing and social development. Outcome Star scores increased on average by 1.4 points across all domains. Placement stability is strong and matching remains appropriate.",
    distributionList: ["Cornerstone Care Group Board", "Helen Frost (RI)", "Operations Director", "Quality & Compliance Lead"],
    retentionPeriod: "Retain indefinitely (strategic governance record)",
    nextReportDue: d(60),
  },
  {
    id: "br_003",
    reportType: "Reg 45 Six-Monthly",
    reportPeriod: "October 2025 – March 2026",
    submittedDate: d(-32),
    submittedTo: "Cornerstone Care Group Board & Ofsted",
    authoredBy: "staff_darren",
    summary:
      "Statutory Regulation 45 review of the quality of care provided at Oak House for the six-month period to 31 March 2026. Independent triangulation by RI and Reg 44 visitor confirms the home is delivering Good outcomes with Outstanding features. All nine Quality Standards are met or exceeded. No regulatory breaches. Three improvement priorities identified for next period.",
    keyMetrics: {
      "Quality Standards met": { value: "9 / 9", change: "stable" },
      "Outstanding features": { value: "3", change: "+1 vs prev period" },
      "Regulatory breaches": { value: "0", change: "stable" },
      "Notifiable events": { value: "2", change: "−4 vs prev period" },
      "Children's voice activities": { value: "48", change: "+12 vs prev period" },
      "Outcomes — improved": { value: "3 / 3", change: "all young people" },
    },
    narrativeHighlights: [
      "Independent triangulation confirms home is operating effectively against all Quality Standards",
      "Strong children's participation evidenced through house meetings, key working and feedback",
      "Therapeutic care model now fully embedded in practice",
      "Workforce stability and development demonstrably improved",
      "Children's outcomes show measurable progress for all three young people",
    ],
    areasOfConcern: [
      "Sustaining current low restraint and incident profile during transitions period for Casey",
      "Continuing reliance on agency cover for occasional waking-night shifts pending recruitment",
    ],
    riskRagRating: "Green",
    strategicQuestionsRaised: [
      "Does the Board wish to formally pursue an Outstanding inspection grade as strategic objective for next reporting period?",
      "Should we extend the therapeutic care model to a sister home in the group?",
    ],
    boardResponseReceived: true,
    boardFeedback:
      "Board accepted the report and noted the assurance provided by independent triangulation. Confirmed strategic direction toward Outstanding grade is endorsed. Asked Operations Director to scope cross-home roll-out of therapeutic model with RM as practice lead. Report to be shared with Ofsted and placing authorities.",
    actionsAgreed: [
      { action: "Share Reg 45 report with Ofsted and all placing authorities", owner: "staff_darren", deadline: d(-25), status: "completed" },
      { action: "Scope cross-home roll-out of therapeutic care model", owner: "staff_darren", deadline: d(45), status: "in_progress" },
      { action: "Develop Outstanding-grade improvement plan for next 6-month cycle", owner: "staff_darren", deadline: d(30), status: "in_progress" },
    ],
    evidenceAttachments: [
      "Reg 45 Quality of Care Review — Mar 2026.pdf",
      "RI triangulation statement.pdf",
      "Reg 44 visitor cumulative report.pdf",
      "Children's voice evidence pack.pdf",
      "Quality Standards self-evaluation.xlsx",
    ],
    childOutcomesNarrative:
      "All three young people have made sustained progress against placement plan objectives during the six-month period. Education engagement is strong, emotional regulation is improving, and relationships within the home remain warm and stable. Casey is being supported through pre-transitions independence work; Jordan continues to benefit from therapeutic input; Alex's academic and social progression is exemplary.",
    distributionList: ["Cornerstone Care Group Board", "Helen Frost (RI)", "Ofsted (statutory)", "Placing Authorities (×3)", "IRO services"],
    retentionPeriod: "Retain indefinitely (statutory record)",
    nextReportDue: d(150),
  },
  {
    id: "br_004",
    reportType: "Incident Briefing",
    reportPeriod: "Casey missing episode — 14 April 2026",
    submittedDate: d(-18),
    submittedTo: "Helen Frost (Responsible Individual)",
    authoredBy: "staff_ryan",
    summary:
      "Brief to RI regarding Casey's missing episode on 14 April 2026. Casey was missing for 3h 40m, returned safely, no harm sustained. Return-home interview completed within 24 hours. Multi-agency strategy meeting held. No exploitation indicators identified. This briefing summarises facts, learning, and immediate actions.",
    keyMetrics: {
      "Duration missing": { value: "3h 40m", change: "—" },
      "Time to police notification": { value: "Within protocol (1h)", change: "—" },
      "Return-home interview": { value: "Completed in 24h", change: "—" },
      "Strategy meeting held": { value: "Within 72h", change: "—" },
      "Exploitation indicators": { value: "None identified", change: "—" },
    },
    narrativeHighlights: [
      "All protocols followed correctly by staff team",
      "Police notified within agreed timescales",
      "Casey returned safely with no harm",
      "Return-home interview captured Casey's voice and identified peer-related triggers",
      "Multi-agency response was prompt and joined-up",
    ],
    areasOfConcern: [
      "Pattern of missing episodes during evening hours requires continued attention",
      "Specific peer relationship identified as a potential trigger — being addressed via key working",
    ],
    riskRagRating: "Amber",
    strategicQuestionsRaised: [
      "Is current evening staffing pattern sufficient for relational support during identified trigger periods?",
      "Should we request a contextual safeguarding consultation regarding peer relationships?",
    ],
    boardResponseReceived: true,
    boardFeedback:
      "RI assured by the rigour of the response and the quality of multi-agency working. Approved request for contextual safeguarding consultation. Asked RM to consider an additional twilight relational hour for the next 4 weeks while patterns are addressed. Will be reviewed at next monthly meeting.",
    actionsAgreed: [
      { action: "Request contextual safeguarding consultation", owner: "staff_darren", deadline: d(-10), status: "completed" },
      { action: "Implement additional twilight relational hour for 4 weeks", owner: "staff_ryan", deadline: d(-12), status: "completed" },
      { action: "Update Casey's missing protocol with new trigger insights", owner: "staff_ryan", deadline: d(-5), status: "completed" },
    ],
    evidenceAttachments: [
      "Casey missing episode chronology.pdf",
      "Return-home interview record (anonymised).pdf",
      "Strategy meeting minutes.pdf",
    ],
    childOutcomesNarrative:
      "Despite the missing episode, Casey's overall placement progress remains positive. The episode has been used as a learning opportunity within the relational and therapeutic framework. Casey has engaged well with the return-home interview process and is being supported by Chervelle as key worker.",
    distributionList: ["Helen Frost (RI)", "Local Authority Safeguarding Lead", "Quality & Compliance Lead"],
    retentionPeriod: "Retain for 25 years (safeguarding-related)",
    nextReportDue: d(-3),
  },
  {
    id: "br_005",
    reportType: "Reg 44 Triangulation",
    reportPeriod: "March 2026 visit",
    submittedDate: d(-58),
    submittedTo: "Helen Frost (Responsible Individual)",
    authoredBy: "staff_darren",
    summary:
      "RM response and triangulation report following the independent Regulation 44 visit conducted by Mary Underwood on 12 March 2026. The visitor judged the home as effectively safeguarding and promoting the welfare of children, with one recommendation regarding visitor information packs. This report triangulates the visit findings with our internal evidence and confirms actions taken.",
    keyMetrics: {
      "Visitor judgement": { value: "Effective", change: "—" },
      "Recommendations": { value: "1", change: "−2 vs last visit" },
      "Recommendations actioned": { value: "1 / 1", change: "100%" },
      "Children spoken with": { value: "3 / 3", change: "100%" },
      "Staff spoken with": { value: "5", change: "—" },
    },
    narrativeHighlights: [
      "Visitor commended the relational warmth and personalised care evident in the home",
      "All children were able to speak privately with the visitor",
      "Records reviewed: care plans, daily logs, medication, incidents, supervision",
      "Visitor noted strong evidence of children's voice influencing day-to-day practice",
    ],
    areasOfConcern: [
      "Visitor information pack required updating — completed within 7 days",
    ],
    riskRagRating: "Green",
    strategicQuestionsRaised: [
      "Should the visitor's positive observations on relational practice be formally captured as case study evidence for the next inspection?",
    ],
    boardResponseReceived: true,
    boardFeedback:
      "RI noted the report and the prompt action taken on the single recommendation. Endorsed the proposal to capture relational practice as case study material for inspection evidence. Asked RM to share visitor's positive feedback with the staff team.",
    actionsAgreed: [
      { action: "Update and publish revised visitor information pack", owner: "staff_ryan", deadline: d(-50), status: "completed" },
      { action: "Capture relational practice as case study for inspection evidence", owner: "staff_darren", deadline: d(-30), status: "completed" },
      { action: "Share Reg 44 positive feedback with staff team at next meeting", owner: "staff_darren", deadline: d(-45), status: "completed" },
    ],
    evidenceAttachments: [
      "Reg 44 visit report — March 2026.pdf",
      "Updated visitor information pack v3.pdf",
      "RM triangulation evidence.pdf",
    ],
    childOutcomesNarrative:
      "The Reg 44 visit provided independent assurance that the home continues to safeguard and promote the welfare of children effectively. Children's experiences of living in the home were positive, and their voice was clearly evidenced in daily practice.",
    distributionList: ["Helen Frost (RI)", "Cornerstone Care Group Board", "Quality & Compliance Lead"],
    retentionPeriod: "Retain for 7 years",
    nextReportDue: d(30),
  },
  {
    id: "br_006",
    reportType: "Annual Report",
    reportPeriod: "Year ending 31 March 2026",
    submittedDate: d(-50),
    submittedTo: "Cornerstone Care Group Board",
    authoredBy: "staff_darren",
    summary:
      "Annual report on the operation of Oak House for the year ending 31 March 2026. The home has operated continuously to a Good standard with Outstanding features, achieved sustained outcomes for all three young people, and met all statutory and regulatory requirements. This report sets out the year's achievements, learning, and strategic direction for the year ahead.",
    keyMetrics: {
      "Annual occupancy": { value: "97%", change: "+4% YoY" },
      "Education attendance (avg)": { value: "91%", change: "+7% YoY" },
      "Restraints (annual)": { value: "2", change: "−9 YoY" },
      "Significant incidents": { value: "18", change: "−24 YoY" },
      "Notifiable events": { value: "5", change: "−7 YoY" },
      "Reg 44 visits completed": { value: "12 / 12", change: "100%" },
      "Reg 45 reviews": { value: "2 / 2", change: "100%" },
      "Staff turnover": { value: "8%", change: "−14% YoY" },
      "Mandatory training compliance": { value: "97%", change: "+5% YoY" },
      "Compliments received": { value: "31", change: "+12 YoY" },
      "Complaints upheld": { value: "0", change: "stable" },
    },
    narrativeHighlights: [
      "Sustained outcomes for all three young people across all developmental domains",
      "Therapeutic care model fully embedded across the workforce",
      "Significant reduction in restraints and incidents year-on-year",
      "100% compliance with Reg 44 and Reg 45 statutory requirements",
      "Workforce stability strengthened through development and supervision",
      "Strong external assurance from independent visitor and RI triangulation",
    ],
    areasOfConcern: [
      "Casey's transitions planning will dominate operational focus for next 12 months",
      "Sector-wide recruitment pressures require ongoing creative workforce strategies",
      "Potential local authority budget pressures may affect commissioning of additional supports",
    ],
    riskRagRating: "Green",
    strategicQuestionsRaised: [
      "Does the Board endorse the strategic objective of pursuing an Outstanding inspection grade in the next inspection cycle?",
      "Should the home formally submit for Outstanding-themed quality marks or external accreditation?",
      "How can the home contribute its learning to wider Cornerstone Care Group practice?",
    ],
    boardResponseReceived: true,
    boardFeedback:
      "Board commended the year's performance and accepted the report in full. Endorsed the strategic objective of pursuing an Outstanding inspection grade. Approved exploration of external quality accreditation. Asked RM to develop a learning-sharing framework with Operations Director to extend Oak House practice across the group.",
    actionsAgreed: [
      { action: "Develop Outstanding-grade improvement plan for the year ahead", owner: "staff_darren", deadline: d(15), status: "in_progress" },
      { action: "Scope external quality accreditation options and costs", owner: "staff_darren", deadline: d(45), status: "in_progress" },
      { action: "Co-develop learning-sharing framework with Operations Director", owner: "staff_darren", deadline: d(60), status: "in_progress" },
    ],
    evidenceAttachments: [
      "Annual Report 2025-26 — Oak House.pdf",
      "Annual outcomes summary (anonymised).pdf",
      "Workforce annual review.pdf",
      "Financial summary.xlsx",
      "Statement of Purpose v6.pdf",
    ],
    childOutcomesNarrative:
      "Over the reporting year, all three young people made sustained and measurable progress against placement plans. Education outcomes improved year-on-year. Emotional regulation and relational stability are strong indicators of the therapeutic care model's effectiveness. Children's voice is clearly evidenced in daily practice and strategic decision-making.",
    distributionList: ["Cornerstone Care Group Board", "Helen Frost (RI)", "Operations Director", "Placing Authorities", "Ofsted"],
    retentionPeriod: "Retain indefinitely (annual governance record)",
    nextReportDue: d(305),
  },
];

/* ─── helpers ─── */
const ragColours = (rag: RagRating) => {
  switch (rag) {
    case "Red":
      return "bg-red-100 text-red-800 border-red-200";
    case "Amber":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Green":
      return "bg-green-100 text-green-800 border-green-200";
  }
};

const reportTypeColour = (t: ReportType) => {
  switch (t) {
    case "Monthly RM Report":
      return "bg-blue-100 text-blue-800";
    case "Quarterly Performance":
      return "bg-purple-100 text-purple-800";
    case "Annual Report":
      return "bg-amber-100 text-amber-800";
    case "Reg 45 Six-Monthly":
      return "bg-emerald-100 text-emerald-800";
    case "Reg 44 Triangulation":
      return "bg-teal-100 text-teal-800";
    case "Incident Briefing":
      return "bg-rose-100 text-rose-800";
    case "Strategic Update":
      return "bg-indigo-100 text-indigo-800";
  }
};

const isCurrentYear = (dt: string) => {
  const yr = new Date().getFullYear().toString();
  return dt.startsWith(yr);
};

/* ─── export columns ─── */
const exportCols: ExportColumn<BoardReport>[] = [
  { header: "Report Type", accessor: (r: BoardReport) => r.reportType },
  { header: "Period", accessor: (r: BoardReport) => r.reportPeriod },
  { header: "Submitted Date", accessor: (r: BoardReport) => r.submittedDate },
  { header: "Submitted To", accessor: (r: BoardReport) => r.submittedTo },
  { header: "Authored By", accessor: (r: BoardReport) => getStaffName(r.authoredBy) },
  { header: "RAG Rating", accessor: (r: BoardReport) => r.riskRagRating },
  { header: "Summary", accessor: (r: BoardReport) => r.summary },
  { header: "Board Response Received", accessor: (r: BoardReport) => (r.boardResponseReceived ? "Yes" : "No") },
  { header: "Board Feedback", accessor: (r: BoardReport) => r.boardFeedback },
  { header: "Actions (Total)", accessor: (r: BoardReport) => r.actionsAgreed.length.toString() },
  { header: "Actions (Open)", accessor: (r: BoardReport) => r.actionsAgreed.filter((a) => a.status !== "completed").length.toString() },
  { header: "Distribution", accessor: (r: BoardReport) => r.distributionList.join("; ") },
  { header: "Next Report Due", accessor: (r: BoardReport) => r.nextReportDue },
];

/* ─── component ─── */
export default function BoardReportingPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  /* ─── filtered & sorted ─── */
  const filtered = useMemo(() => {
    let list = [...reports];
    if (filterType !== "all") list = list.filter((r) => r.reportType === filterType);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.submittedDate.localeCompare(a.submittedDate);
        case "type":
          return a.reportType.localeCompare(b.reportType);
        case "rag": {
          const order: Record<RagRating, number> = { Red: 0, Amber: 1, Green: 2 };
          return order[a.riskRagRating] - order[b.riskRagRating];
        }
        case "openActions":
          return (
            b.actionsAgreed.filter((x) => x.status !== "completed").length -
            a.actionsAgreed.filter((x) => x.status !== "completed").length
          );
        default:
          return 0;
      }
    });
    return list;
  }, [filterType, sortBy]);

  /* ─── summary stats ─── */
  const stats = useMemo(() => {
    const allActions = reports.flatMap((r) => r.actionsAgreed);
    const reportsThisYear = reports.filter((r) => isCurrentYear(r.submittedDate)).length;
    const feedbackReceived = reports.filter((r) => r.boardResponseReceived).length;
    const openActions = allActions.filter((a) => a.status !== "completed").length;
    const upcoming = reports
      .map((r) => r.nextReportDue)
      .filter((dt) => dt >= d(0))
      .sort()[0] ?? "Not scheduled";
    return { reportsThisYear, feedbackReceived, openActions, upcoming };
  }, []);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const actionStatusBadge = (status: AgreedAction["status"], deadline: string) => {
    const isOverdue = status === "overdue" || (status !== "completed" && deadline < d(0));
    if (isOverdue) return <Badge className="bg-red-100 text-red-800 text-xs">Overdue</Badge>;
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 text-xs">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800 text-xs">In Progress</Badge>;
      case "pending":
        return <Badge className="bg-gray-100 text-gray-800 text-xs">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <PageShell
      title="Board Reporting"
      subtitle="Formal reports submitted to the Responsible Individual and Cornerstone Care Group Board — required by Quality Standard 13 and Regulation 45"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={reports} columns={exportCols} filename="board-reporting" />
          <PrintButton title="Board Reporting" />
        </div>
      }
    >
      {/* ─── transparent governance banner ─── */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-100 rounded-full shrink-0">
            <Shield className="h-5 w-5 text-indigo-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-900 mb-1">Transparent Governance</p>
            <p className="text-xs text-indigo-800 leading-relaxed">
              Every report submitted upward is also a report on the lives of the children we care for. We
              report the whole picture — the progress and the concerns — so that those holding us to
              account can ask the right questions, scrutinise our judgements, and remain assured that
              children&apos;s welfare is genuinely central to every decision. Board feedback and agreed
              actions are tracked here as evidence of an active, two-way governance relationship.
            </p>
          </div>
        </div>
      </div>

      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.reportsThisYear}</p>
            <p className="text-xs text-muted-foreground">Reports This Year</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">
              {stats.feedbackReceived} / {reports.length}
            </p>
            <p className="text-xs text-muted-foreground">Board Feedback Received</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.openActions}</p>
            <p className="text-xs text-muted-foreground">Open Agreed Actions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.upcoming}</p>
            <p className="text-xs text-muted-foreground">Next Report Due</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── filters / sort ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All report types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Report Types</SelectItem>
            <SelectItem value="Monthly RM Report">Monthly RM Report</SelectItem>
            <SelectItem value="Quarterly Performance">Quarterly Performance</SelectItem>
            <SelectItem value="Annual Report">Annual Report</SelectItem>
            <SelectItem value="Reg 45 Six-Monthly">Reg 45 Six-Monthly</SelectItem>
            <SelectItem value="Reg 44 Triangulation">Reg 44 Triangulation</SelectItem>
            <SelectItem value="Incident Briefing">Incident Briefing</SelectItem>
            <SelectItem value="Strategic Update">Strategic Update</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="type">Report Type</SelectItem>
              <SelectItem value="rag">RAG Rating</SelectItem>
              <SelectItem value="openActions">Open Actions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── report cards ─── */}
      <div className="space-y-4">
        {filtered.map((report) => {
          const expanded = expandedId === report.id;
          const openActionCount = report.actionsAgreed.filter((a) => a.status !== "completed").length;
          const overdueCount = report.actionsAgreed.filter(
            (a) => a.status === "overdue" || (a.status !== "completed" && a.deadline < d(0)),
          ).length;

          return (
            <Card
              key={report.id}
              className={cn(
                "overflow-hidden",
                report.riskRagRating === "Red" && "border-red-200",
                report.riskRagRating === "Amber" && "border-amber-200",
              )}
            >
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(report.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-slate-100">
                      <FileText className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {report.reportType} — {report.reportPeriod}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={cn("text-xs", reportTypeColour(report.reportType))}>
                          {report.reportType}
                        </Badge>
                        <Badge className={cn("text-xs border", ragColours(report.riskRagRating))}>
                          RAG: {report.riskRagRating}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Send className="h-3 w-3" /> {report.submittedDate} → {report.submittedTo}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className={cn(
                        "text-sm font-medium",
                        overdueCount > 0 ? "text-red-700" : openActionCount === 0 ? "text-green-700" : "text-blue-700",
                      )}>
                        {openActionCount} open
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {overdueCount > 0 ? `${overdueCount} overdue` : "actions"}
                      </p>
                    </div>
                    {expanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-5">
                  {/* meta */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-3 border-b">
                    <div>
                      <p className="text-xs text-muted-foreground">Authored By</p>
                      <p className="text-sm font-medium">{getStaffName(report.authoredBy)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Submitted To</p>
                      <p className="text-sm font-medium">{report.submittedTo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Submitted
                      </p>
                      <p className="text-sm font-medium">{report.submittedDate}</p>
                    </div>
                  </div>

                  {/* executive summary */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <FileText className="h-4 w-4 text-muted-foreground" /> Executive Summary
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{report.summary}</p>
                  </div>

                  {/* key metrics */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" /> Key Metrics
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(report.keyMetrics).map(([k, v]) => (
                        <div key={k} className="border rounded-md p-2 bg-slate-50/60">
                          <p className="text-xs text-muted-foreground">{k}</p>
                          <p className="text-sm font-semibold">{v.value}</p>
                          <p className="text-xs text-muted-foreground italic">{v.change}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* narrative highlights */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-800 mb-2 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Narrative Highlights
                    </p>
                    <ul className="space-y-1">
                      {report.narrativeHighlights.map((h, i) => (
                        <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                          <span className="text-green-400 mt-1.5">•</span> {h}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* areas of concern */}
                  {report.areasOfConcern.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Areas of Concern
                      </p>
                      <ul className="space-y-1">
                        {report.areasOfConcern.map((c, i) => (
                          <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                            <span className="text-amber-400 mt-1.5">•</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* child outcomes narrative */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" /> Child Outcomes Narrative
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {report.childOutcomesNarrative}
                    </p>
                  </div>

                  {/* strategic questions */}
                  {report.strategicQuestionsRaised.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Target className="h-4 w-4 text-muted-foreground" /> Strategic Questions Raised
                      </p>
                      <ul className="space-y-1">
                        {report.strategicQuestionsRaised.map((q, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-indigo-400 mt-1.5">•</span> {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* board feedback */}
                  <div className={cn(
                    "border rounded-lg p-3",
                    report.boardResponseReceived ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200",
                  )}>
                    <p className={cn(
                      "text-sm font-medium mb-2 flex items-center gap-1",
                      report.boardResponseReceived ? "text-blue-800" : "text-gray-700",
                    )}>
                      <MessageSquare className="h-4 w-4" /> Board / RI Feedback
                      {report.boardResponseReceived ? (
                        <Badge className="bg-blue-100 text-blue-800 text-xs ml-2">Received</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 text-xs ml-2">Awaiting</Badge>
                      )}
                    </p>
                    {report.boardResponseReceived ? (
                      <p className="text-sm text-blue-700 leading-relaxed">{report.boardFeedback}</p>
                    ) : (
                      <p className="text-sm text-gray-600 italic">
                        No formal feedback recorded yet — awaiting Board / RI response.
                      </p>
                    )}
                  </div>

                  {/* actions agreed */}
                  {report.actionsAgreed.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" /> Actions Agreed (
                        {report.actionsAgreed.filter((a) => a.status === "completed").length}/
                        {report.actionsAgreed.length} complete)
                      </p>
                      <div className="space-y-2">
                        {report.actionsAgreed.map((action, i) => {
                          const isOverdue =
                            action.status === "overdue" ||
                            (action.status !== "completed" && action.deadline < d(0));
                          return (
                            <div
                              key={i}
                              className={cn(
                                "border rounded-md p-2 flex items-center justify-between gap-2",
                                isOverdue && "border-red-200 bg-red-50/50",
                              )}
                            >
                              <div className="min-w-0">
                                <p className="text-sm">{action.action}</p>
                                <p className="text-xs text-muted-foreground">
                                  {getStaffName(action.owner)} · by {action.deadline}
                                </p>
                              </div>
                              {actionStatusBadge(action.status, action.deadline)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* attachments & distribution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Paperclip className="h-4 w-4 text-muted-foreground" /> Evidence Attachments
                      </p>
                      <ul className="space-y-1">
                        {report.evidenceAttachments.map((a, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-slate-400 mt-1.5">•</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Send className="h-4 w-4 text-muted-foreground" /> Distribution List
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {report.distributionList.map((rec, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {rec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* footer */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Retention Period</p>
                      <p className="text-sm font-medium">{report.retentionPeriod}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Next Report Due
                      </p>
                      <p className="text-sm font-medium">{report.nextReportDue}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">Regulatory Context</p>
        <p className="text-xs text-slate-600 leading-relaxed">
          Quality Standard 13 (Leadership and Management) requires that the registered manager and
          responsible individual lead and manage the home in a way that promotes children&apos;s
          welfare and protects them from harm. Regulation 45 of the Children&apos;s Homes (England)
          Regulations 2015 requires the registered person to review the quality of care provided at
          least every six months and produce a written report. The reports recorded here form the
          formal evidence base of upward governance — demonstrating that the home is operating with
          transparency, accountability and reflective practice. Two-way feedback from the Responsible
          Individual and Board, captured against each report, evidences active oversight rather than
          passive submission.
        </p>
      </div>
    </PageShell>
  );
}
