"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  TrendingUp,
  Lightbulb,
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImprovementInitiative {
  id: string;
  title: string;
  category: "Practice" | "Environment" | "Workforce" | "Children's experience" | "Multi-agency" | "Compliance" | "Wellbeing" | "Recording";
  description: string;
  problemStatement: string;
  expectedOutcome: string;
  evidenceBase: string;
  source: "Reg 44 feedback" | "Reg 45 review" | "Children's voice" | "Staff suggestion" | "Audit finding" | "Ofsted" | "Sector guidance";
  startDate: string;
  targetCompletionDate: string;
  status: "Proposed" | "Approved" | "In Progress" | "Implemented" | "Embedded" | "On Hold" | "Closed";
  ownerStaff: string;
  contributors: string[];
  keyMilestones: { milestone: string; targetDate: string; achieved: boolean; achievedDate: string }[];
  childInvolvement: string;
  staffInvolvement: string;
  resourcesRequired: string[];
  successMeasures: string[];
  earlyResults: string;
  challenges: string[];
  riskRagRating: "Red" | "Amber" | "Green";
  budgetAllocated: number;
  lastReviewDate: string;
  nextReviewDate: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: ImprovementInitiative[] = [
  {
    id: "si-001",
    title: "Sensory-friendly communal space redesign",
    category: "Environment",
    description: "Redesign main lounge and dining area with sensory-friendly principles — adjustable lighting, sound dampening, sensory corners, calming colours.",
    problemStatement: "Current communal spaces too stimulating for Casey and occasionally overwhelming for all young people. Multiple sensory regulation incidents traced to environment.",
    expectedOutcome: "Reduced sensory overwhelm incidents. Increased time spent in communal areas (currently low for Casey). Universal design benefits all children.",
    evidenceBase: "NAS environmental design guidance, Casey's sensory profile, occupational therapist recommendations.",
    source: "Children's voice",
    startDate: d(-90),
    targetCompletionDate: d(30),
    status: "In Progress",
    ownerStaff: "staff_darren",
    contributors: ["staff_anna", "staff_ryan"],
    keyMilestones: [
      { milestone: "OT consultation completed", targetDate: d(-75), achieved: true, achievedDate: d(-72) },
      { milestone: "Children's design input session", targetDate: d(-60), achieved: true, achievedDate: d(-58) },
      { milestone: "Quote and budget approval", targetDate: d(-30), achieved: true, achievedDate: d(-25) },
      { milestone: "Phase 1 — lighting installed", targetDate: d(-7), achieved: true, achievedDate: d(-3) },
      { milestone: "Phase 2 — sound dampening", targetDate: d(14), achieved: false, achievedDate: "" },
      { milestone: "Phase 3 — sensory corners", targetDate: d(28), achieved: false, achievedDate: "" },
      { milestone: "Children-led launch event", targetDate: d(35), achieved: false, achievedDate: "" },
    ],
    childInvolvement: "All three young people contributed to design. Casey particularly involved given sensory expertise. Children chose paint colours and corner items.",
    staffInvolvement: "Whole team consulted. Anna leading day-to-day. RM oversight. Cleaning team trained on new fabrics/care.",
    resourcesRequired: ["£3,500 budget approved", "OT consultancy time", "Maintenance contractor", "2 staff days for installation oversight"],
    successMeasures: [
      "Reduction in sensory regulation incidents (baseline: 3/month)",
      "Increase in time Casey spends in communal areas (baseline: 30 min/day)",
      "Children's satisfaction survey at +6 months",
      "All staff trained on new environment principles",
    ],
    earlyResults: "Lighting changes already showing impact. Casey spending more time in lounge. Other children commenting positively on calmer atmosphere.",
    challenges: [
      "Original quote underestimated — needed budget extension",
      "Phase 2 dependent on contractor availability — slight delay",
    ],
    riskRagRating: "Green",
    budgetAllocated: 3500,
    lastReviewDate: d(-7),
    nextReviewDate: d(21),
  },
  {
    id: "si-002",
    title: "Therapeutic outcome measures programme",
    category: "Practice",
    description: "Embed validated therapeutic outcome measures (SDQ, RCADS, Outcome Star, TSCC) for all young people, with regular re-administration and clinical interpretation.",
    problemStatement: "Lack of objective measures of therapeutic progress beyond clinical observation. Difficulty evidencing outcomes for commissioners and Reg 45 reports.",
    expectedOutcome: "Robust outcome data informing care plans. Demonstrable evidence of therapeutic gains. Stronger commissioning relationships.",
    evidenceBase: "Goodman SDQ research, RCADS validity studies, NICE evidence-based practice guidance.",
    source: "Sector guidance",
    startDate: d(-180),
    targetCompletionDate: d(-30),
    status: "Embedded",
    ownerStaff: "staff_darren",
    contributors: ["staff_anna"],
    keyMilestones: [
      { milestone: "Tools selected and licensed", targetDate: d(-170), achieved: true, achievedDate: d(-168) },
      { milestone: "Staff training delivered", targetDate: d(-150), achieved: true, achievedDate: d(-145) },
      { milestone: "Baseline measures completed for all YP", targetDate: d(-120), achieved: true, achievedDate: d(-115) },
      { milestone: "First re-administration cycle", targetDate: d(-60), achieved: true, achievedDate: d(-55) },
      { milestone: "Clinical interpretation embedded with CAMHS", targetDate: d(-30), achieved: true, achievedDate: d(-30) },
    ],
    childInvolvement: "Children consented to measures. Casey supported with visual adaptations. Children given access to their results in age-appropriate format.",
    staffInvolvement: "Anna leads administration. All key workers trained. CAMHS clinical interpretation partnership established.",
    resourcesRequired: ["Outcome Star licence (£800/yr)", "Training time", "CAMHS clinical input"],
    successMeasures: [
      "100% of children have baseline measures (achieved)",
      "Re-administration every 6 months (achieved)",
      "Outcomes featured in Reg 45 reports (achieved)",
      "Demonstrable improvement trends (achieved — 5/6 measures showing improvement)",
    ],
    earlyResults: "Powerful evidence of progress. Now featured in Reg 45 reports and commissioning conversations. Children appreciate seeing their progress visually.",
    challenges: [
      "Initial staff resistance — felt clinical/cold. Resolved through framing as 'celebrating progress'.",
    ],
    riskRagRating: "Green",
    budgetAllocated: 1200,
    lastReviewDate: d(-15),
    nextReviewDate: d(75),
  },
  {
    id: "si-003",
    title: "Reflective practice supervision model",
    category: "Workforce",
    description: "Introduce monthly reflective practice supervision distinct from line management — small group, externally facilitated, focused on emotional impact of work.",
    problemStatement: "Vicarious trauma identified as theme in supervision. Staff retention pressures. Need for protected reflective space beyond performance-focused supervision.",
    expectedOutcome: "Improved staff wellbeing. Reduced sickness. Stronger team cohesion. Better outcomes for children through more reflective practice.",
    evidenceBase: "Wonnacott & Watts reflective supervision research. Ofsted outstanding judgements consistently cite reflective practice.",
    source: "Staff suggestion",
    startDate: d(-60),
    targetCompletionDate: d(120),
    status: "In Progress",
    ownerStaff: "staff_ryan",
    contributors: ["staff_darren"],
    keyMilestones: [
      { milestone: "External facilitator identified", targetDate: d(-50), achieved: true, achievedDate: d(-48) },
      { milestone: "Initial team consultation", targetDate: d(-30), achieved: true, achievedDate: d(-28) },
      { milestone: "First session held", targetDate: d(-14), achieved: true, achievedDate: d(-12) },
      { milestone: "First quarterly evaluation", targetDate: d(60), achieved: false, achievedDate: "" },
      { milestone: "Embedding review", targetDate: d(120), achieved: false, achievedDate: "" },
    ],
    childInvolvement: "Indirect — improved staff wellbeing benefits children. Children consulted that they appreciate when staff seem 'less stressed'.",
    staffInvolvement: "All staff invited (optional but encouraged). 80% attendance to date. Facilitated by external counsellor with care sector expertise.",
    resourcesRequired: ["External facilitator £600/month", "Time off-shift for participation"],
    successMeasures: [
      "75%+ staff attendance",
      "Improved scores on staff wellbeing measure at 6 months",
      "Reduced sickness rate at 12 months",
      "Themes from sessions feeding into practice improvements",
    ],
    earlyResults: "Two sessions held. Strong engagement. Themes already informing practice (e.g. boundary-holding training arising).",
    challenges: [
      "Scheduling difficulty across shift patterns",
      "Some staff initially anxious about 'opening up' — reduced after second session",
    ],
    riskRagRating: "Amber",
    budgetAllocated: 7200,
    lastReviewDate: d(-5),
    nextReviewDate: d(25),
  },
  {
    id: "si-004",
    title: "Children's voice digital toolkit",
    category: "Children's experience",
    description: "Develop digital toolkit allowing children to share views, feedback, and concerns through various media (voice, video, drawing, text).",
    problemStatement: "Some children find face-to-face conversations about views/concerns difficult. Need for multiple channels matching different communication preferences.",
    expectedOutcome: "Increased child participation. Diverse channels matching individual preferences. Casey particularly benefits from non-verbal options.",
    evidenceBase: "Lundy model of participation, UNCRC Article 12, Casey's communication profile.",
    source: "Reg 44 feedback",
    startDate: d(-30),
    targetCompletionDate: d(60),
    status: "In Progress",
    ownerStaff: "staff_anna",
    contributors: ["staff_chervelle"],
    keyMilestones: [
      { milestone: "Tool research completed", targetDate: d(-20), achieved: true, achievedDate: d(-18) },
      { milestone: "Children's input on tool selection", targetDate: d(-7), achieved: true, achievedDate: d(-5) },
      { milestone: "Pilot with one young person (Casey)", targetDate: d(14), achieved: false, achievedDate: "" },
      { milestone: "Roll-out to all young people", targetDate: d(35), achieved: false, achievedDate: "" },
      { milestone: "Six-week review", targetDate: d(60), achieved: false, achievedDate: "" },
    ],
    childInvolvement: "Children co-design the toolkit. Casey's input particularly valuable for accessibility features. Choice of platforms was children's decision.",
    staffInvolvement: "Anna leading. IT support consulted. Training planned for all staff before roll-out.",
    resourcesRequired: ["Software licences (~£200/yr)", "Casey's tablet upgrade", "Staff training time"],
    successMeasures: [
      "All three young people have personalised toolkit",
      "Increase in voice-of-child entries (baseline: 4/month)",
      "Children's satisfaction with feedback channels",
      "Casey specifically: reduction in 'I don't know how to say it' moments",
    ],
    earlyResults: "Children excited about pilot. Casey already using draft tools and engaging well.",
    challenges: [
      "Data protection considerations — being managed",
      "Casey's specific accessibility needs require bespoke setup",
    ],
    riskRagRating: "Green",
    budgetAllocated: 600,
    lastReviewDate: d(-3),
    nextReviewDate: d(18),
  },
  {
    id: "si-005",
    title: "Multi-agency communication protocol",
    category: "Multi-agency",
    description: "Develop and embed a structured protocol for communication with social workers, schools, and CAMHS — frequency, format, escalation.",
    problemStatement: "Multi-agency communication identified as area of inconsistency in last Reg 45 review. Some over-communication, some gaps, no clear protocol.",
    expectedOutcome: "Predictable, professional communication patterns. Improved partner relationships. Stronger coordination of care.",
    evidenceBase: "Working Together 2023, Reg 45 review findings, partner feedback.",
    source: "Reg 45 review",
    startDate: d(-45),
    targetCompletionDate: d(45),
    status: "Approved",
    ownerStaff: "staff_darren",
    contributors: ["staff_ryan", "staff_edward"],
    keyMilestones: [
      { milestone: "Audit of current communication patterns", targetDate: d(-30), achieved: true, achievedDate: d(-28) },
      { milestone: "Protocol drafted", targetDate: d(-7), achieved: false, achievedDate: "" },
      { milestone: "Partner consultation", targetDate: d(7), achieved: false, achievedDate: "" },
      { milestone: "Training delivered", targetDate: d(28), achieved: false, achievedDate: "" },
      { milestone: "Implementation complete", targetDate: d(45), achieved: false, achievedDate: "" },
    ],
    childInvolvement: "Children consulted about how their information is shared. Privacy preferences gathered.",
    staffInvolvement: "Whole team. All key workers will be expected to follow protocol.",
    resourcesRequired: ["Staff time for protocol development", "Training time", "Possible external facilitator for partner consultation"],
    successMeasures: [
      "Documented protocol in place",
      "100% staff trained",
      "Partner satisfaction survey at 6 months",
      "Reduced communication-related complaints",
    ],
    earlyResults: "Audit revealed clear patterns. Drafting in progress. Partners receptive to consultation.",
    challenges: [
      "Balancing professional efficiency with relational warmth",
      "Different partners have different expectations",
    ],
    riskRagRating: "Green",
    budgetAllocated: 0,
    lastReviewDate: d(-7),
    nextReviewDate: d(14),
  },
  {
    id: "si-006",
    title: "Co-produced child-friendly policies refresh",
    category: "Children's experience",
    description: "Refresh all parent policies to ensure each has a co-produced child-friendly version that children can actually understand and use.",
    problemStatement: "Existing child-friendly versions not consistently co-produced. Some inaccessible to neurodivergent children. Children unaware of some rights.",
    expectedOutcome: "Eight child-friendly policies fully co-produced. Children know their rights. Policies displayed and used.",
    evidenceBase: "UNCRC, Equality Act 2010 reasonable adjustments, Lundy model of participation.",
    source: "Children's voice",
    startDate: d(-150),
    targetCompletionDate: d(-30),
    status: "Embedded",
    ownerStaff: "staff_darren",
    contributors: ["staff_anna", "staff_chervelle"],
    keyMilestones: [
      { milestone: "Policies prioritised with children", targetDate: d(-140), achieved: true, achievedDate: d(-138) },
      { milestone: "Co-production sessions held", targetDate: d(-100), achieved: true, achievedDate: d(-95) },
      { milestone: "First drafts produced", targetDate: d(-70), achieved: true, achievedDate: d(-65) },
      { milestone: "Children's review and amendments", targetDate: d(-50), achieved: true, achievedDate: d(-48) },
      { milestone: "Final versions launched", targetDate: d(-30), achieved: true, achievedDate: d(-30) },
    ],
    childInvolvement: "Central. Children co-authored every policy. Casey's contribution particularly powerful for accessibility.",
    staffInvolvement: "All key workers facilitated co-production. Anna led visual design.",
    resourcesRequired: ["Co-production session time", "Design tools for visual elements"],
    successMeasures: [
      "8 policies co-produced (achieved)",
      "Children can articulate their rights (anecdotally evident)",
      "Policies displayed and referenced (achieved)",
      "Featured positively in Reg 44 visit (achieved)",
    ],
    earlyResults: "Children's Pledges page now references policies. Reg 44 visitor commented on quality. Casey particularly proud of accessibility version of Rights policy.",
    challenges: [
      "Time-intensive to do well — but worth it",
    ],
    riskRagRating: "Green",
    budgetAllocated: 0,
    lastReviewDate: d(-30),
    nextReviewDate: d(150),
  },
];

const statusColour: Record<string, string> = {
  Proposed: "bg-slate-100 text-slate-800",
  Approved: "bg-blue-100 text-blue-800",
  "In Progress": "bg-amber-100 text-amber-800",
  Implemented: "bg-emerald-100 text-emerald-800",
  Embedded: "bg-green-100 text-green-800",
  "On Hold": "bg-purple-100 text-purple-800",
  Closed: "bg-slate-100 text-slate-800",
};

const ragColour: Record<string, string> = {
  Red: "bg-red-100 text-red-800",
  Amber: "bg-amber-100 text-amber-800",
  Green: "bg-green-100 text-green-800",
};

const exportCols: ExportColumn<ImprovementInitiative>[] = [
  { header: "Title", accessor: (r: ImprovementInitiative) => r.title },
  { header: "Category", accessor: (r: ImprovementInitiative) => r.category },
  { header: "Status", accessor: (r: ImprovementInitiative) => r.status },
  { header: "RAG", accessor: (r: ImprovementInitiative) => r.riskRagRating },
  { header: "Source", accessor: (r: ImprovementInitiative) => r.source },
  { header: "Owner", accessor: (r: ImprovementInitiative) => getStaffName(r.ownerStaff) },
  { header: "Started", accessor: (r: ImprovementInitiative) => r.startDate },
  { header: "Target Completion", accessor: (r: ImprovementInitiative) => r.targetCompletionDate },
  { header: "Budget", accessor: (r: ImprovementInitiative) => `£${r.budgetAllocated}` },
];

export default function ServiceImprovementBoardPage() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("status");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterStatus !== "all") items = items.filter((i) => i.status === filterStatus);
    if (filterCategory !== "all") items = items.filter((i) => i.category === filterCategory);
    items.sort((a, b) => {
      switch (sortBy) {
        case "status":
          const ord = { "In Progress": 0, Approved: 1, Proposed: 2, Implemented: 3, Embedded: 4, "On Hold": 5, Closed: 6 };
          return ord[a.status] - ord[b.status];
        case "date":
          return a.targetCompletionDate.localeCompare(b.targetCompletionDate);
        case "rag":
          const ragOrd = { Red: 0, Amber: 1, Green: 2 };
          return ragOrd[a.riskRagRating] - ragOrd[b.riskRagRating];
        default:
          return 0;
      }
    });
    return items;
  }, [filterStatus, filterCategory, sortBy]);

  const total = data.length;
  const inProgress = data.filter((i) => i.status === "In Progress" || i.status === "Approved").length;
  const embedded = data.filter((i) => i.status === "Embedded" || i.status === "Implemented").length;
  const totalBudget = data.reduce((sum, i) => sum + i.budgetAllocated, 0);

  return (
    <PageShell
      title="Service Improvement Board"
      subtitle="Active service improvement initiatives — co-produced, evidence-based, outcome-focused"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="service-improvement-board" />
          <PrintButton title="Service Improvement Board" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Total Initiatives</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{inProgress}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{embedded}</p>
          <p className="text-xs text-muted-foreground">Embedded/Implemented</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">£{totalBudget.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Budget</p>
        </div>
      </div>

      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mb-6 flex items-start gap-2">
        <Lightbulb className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <p className="text-sm text-emerald-800">
          We never stand still. Every initiative on this board started with a question or a piece of feedback —
          from a child, a staff member, a Reg 44 visitor, or an audit. Continuous improvement is part of who we are.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Proposed">Proposed</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Implemented">Implemented</SelectItem>
            <SelectItem value="Embedded">Embedded</SelectItem>
            <SelectItem value="On Hold">On Hold</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Practice">Practice</SelectItem>
            <SelectItem value="Environment">Environment</SelectItem>
            <SelectItem value="Workforce">Workforce</SelectItem>
            <SelectItem value="Children's experience">Children&apos;s experience</SelectItem>
            <SelectItem value="Multi-agency">Multi-agency</SelectItem>
            <SelectItem value="Compliance">Compliance</SelectItem>
            <SelectItem value="Wellbeing">Wellbeing</SelectItem>
            <SelectItem value="Recording">Recording</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="status">By Status</SelectItem>
              <SelectItem value="date">Earliest Target</SelectItem>
              <SelectItem value="rag">By RAG</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((init) => {
          const isExpanded = expandedId === init.id;
          const milestonesAchieved = init.keyMilestones.filter((m) => m.achieved).length;
          const milestoneProgress = Math.round((milestonesAchieved / init.keyMilestones.length) * 100);

          return (
            <div key={init.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : init.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Target className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{init.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {init.category} &middot; Owner: {getStaffName(init.ownerStaff)} &middot; {milestonesAchieved}/{init.keyMilestones.length} milestones &middot; Source: {init.source}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColour[init.status])}>
                    {init.status}
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", ragColour[init.riskRagRating])}>
                    {init.riskRagRating}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                    <p className="text-sm">{init.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Problem Statement</p>
                      <p className="text-sm">{init.problemStatement}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">Expected Outcome</p>
                      <p className="text-sm">{init.expectedOutcome}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Evidence Base</p>
                    <p className="text-sm text-blue-900">{init.evidenceBase}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Milestones ({milestoneProgress}%)</p>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${milestoneProgress}%` }} />
                    </div>
                    <div className="space-y-1">
                      {init.keyMilestones.map((m, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-center justify-between gap-2">
                          {m.achieved ? (
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                          )}
                          <span className="flex-1">{m.milestone}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {m.achieved ? `Done ${m.achievedDate}` : `Target ${m.targetDate}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Child Involvement</p>
                      <p className="text-sm">{init.childInvolvement}</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide mb-1">Staff Involvement</p>
                      <p className="text-sm">{init.staffInvolvement}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Success Measures</p>
                    <ul className="space-y-1">
                      {init.successMeasures.map((m, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <TrendingUp className="h-3 w-3 text-emerald-500 mt-1 shrink-0" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {init.earlyResults && (
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Early Results</p>
                      <p className="text-sm text-emerald-900">{init.earlyResults}</p>
                    </div>
                  )}

                  {init.challenges.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Challenges
                      </p>
                      <ul className="space-y-1">
                        {init.challenges.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Users className="h-3 w-3 inline mr-1" />Owner: {getStaffName(init.ownerStaff)}</span>
                    <span>Started: {init.startDate}</span>
                    <span>Target: {init.targetCompletionDate}</span>
                    <span>Budget: £{init.budgetAllocated}</span>
                    <span>Next review: {init.nextReviewDate}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Service improvement initiatives support Quality Standard 13
          (leadership and management), Regulation 45 (review of quality of care), and SCCIF judgement
          area on continuous improvement. Initiatives feed into Reg 45 reports and Ofsted inspection
          evidence. All initiatives are evidence-based, child-informed, and outcome-measured.
        </p>
      </div>
    </PageShell>
  );
}
