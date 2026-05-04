"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown, ChevronUp, ArrowUpDown, Search, Lightbulb, CheckCircle2,
  AlertTriangle, Clock, BookOpen, GraduationCap, FileText, Sparkles, Star, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type Source =
  | "Incident"
  | "Complaint"
  | "Audit"
  | "Reflective practice"
  | "Reg 44"
  | "External feedback"
  | "Critical incident review";

type ThemeArea =
  | "Safeguarding"
  | "Practice"
  | "Communication"
  | "Recording"
  | "Training"
  | "Environment"
  | "Wellbeing"
  | "Multi-agency";

type Status = "Identified" | "In Progress" | "Embedded" | "Monitoring";

interface Lesson {
  id: string;
  dateIdentified: string;
  source: Source;
  sourceReference: string;
  themeArea: ThemeArea;
  lesson: string;
  context: string;
  whatHappened: string;
  rootCauseAnalysis: string;
  whatWeChanged: string[];
  policiesUpdated: string[];
  trainingDelivered: string[];
  staffBriefed: boolean;
  briefingDate: string;
  evidenceOfEmbedding: string[];
  recurrenceCheck: string;
  status: Status;
  embeddingScore: number;
  reviewedBy: string;
  nextReviewDate: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const SOURCE_CLR: Record<Source, string> = {
  "Incident": "bg-red-100 text-red-800",
  "Complaint": "bg-orange-100 text-orange-800",
  "Audit": "bg-blue-100 text-blue-800",
  "Reflective practice": "bg-purple-100 text-purple-800",
  "Reg 44": "bg-emerald-100 text-emerald-800",
  "External feedback": "bg-cyan-100 text-cyan-800",
  "Critical incident review": "bg-rose-100 text-rose-900",
};

const THEME_CLR: Record<ThemeArea, string> = {
  "Safeguarding": "bg-red-50 text-red-700",
  "Practice": "bg-blue-50 text-blue-700",
  "Communication": "bg-amber-50 text-amber-700",
  "Recording": "bg-slate-100 text-slate-700",
  "Training": "bg-indigo-50 text-indigo-700",
  "Environment": "bg-teal-50 text-teal-700",
  "Wellbeing": "bg-purple-50 text-purple-700",
  "Multi-agency": "bg-cyan-50 text-cyan-700",
};

const STATUS_CLR: Record<Status, string> = {
  "Identified": "bg-amber-100 text-amber-800",
  "In Progress": "bg-blue-100 text-blue-800",
  "Embedded": "bg-green-100 text-green-800",
  "Monitoring": "bg-purple-100 text-purple-800",
};

const STATUS_BORDER: Record<Status, string> = {
  "Identified": "border-l-amber-400",
  "In Progress": "border-l-blue-500",
  "Embedded": "border-l-green-500",
  "Monitoring": "border-l-purple-500",
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: Lesson[] = [
  {
    id: "ll_001",
    dateIdentified: d(-180),
    source: "Incident",
    sourceReference: "INC-2024-0214 — Casey self-harm episode",
    themeArea: "Safeguarding",
    lesson:
      "Self-harm risk assessments must be automatically reviewed when a child is involved in a LADO or police investigation, regardless of presenting behaviour.",
    context:
      "Casey disclosed during debrief that anxiety about the LADO timeline was the primary trigger. Her risk assessment had not been updated to reflect this elevated psychological load because outward presentation appeared stable.",
    whatHappened:
      "Casey was found with superficial scratches on her left forearm during a routine bedroom check. She had used a broken pencil sharpener blade. The risk assessment in place rated her self-harm risk as 'low' — based on a 6-month period without incident — and did not factor in the live LADO investigation.",
    rootCauseAnalysis:
      "Risk assessment frameworks were event-triggered (e.g. recent self-harm) rather than context-triggered. Psychological stressors that don't manifest behaviourally were under-weighted. Staff lacked a documented prompt to revisit assessments at key inflection points in safeguarding processes.",
    whatWeChanged: [
      "Added mandatory risk assessment review trigger when LADO, police, or s.47 investigation opens",
      "Introduced a 'context flag' field to risk assessments to capture non-behavioural stressors",
      "Standing item added to weekly clinical meeting: 'Any open investigations? Have linked RAs been refreshed?'",
      "Room-search protocol now includes pencil sharpener blades and similar low-profile sharps",
    ],
    policiesUpdated: [
      "Self-Harm Risk Assessment Policy v3.2 (Sept 2024)",
      "Room Safety Check Procedure v2.1",
      "Safeguarding Investigation Liaison SOP — added s.5 'Internal trigger actions'",
    ],
    trainingDelivered: [
      "Self-harm awareness and response — all permanent staff (Sept 2024)",
      "Emotional first aid for night staff — 4-hour workshop (Oct 2024)",
    ],
    staffBriefed: true,
    briefingDate: d(-170),
    evidenceOfEmbedding: [
      "3 RAs subsequently refreshed under the new trigger (Jordan, Alex, one historic file)",
      "QA audit Nov 2024 sampled 8 RAs — all 8 contained context flag entries where applicable",
      "Anna referenced the new trigger in her Feb supervision when raising a concern about Jordan",
    ],
    recurrenceCheck:
      "No further self-harm incidents from Casey in the 6 months since. One similar early-warning concern raised about Jordan was addressed proactively under the new trigger before any behavioural escalation.",
    status: "Embedded",
    embeddingScore: 5,
    reviewedBy: "staff_darren",
    nextReviewDate: d(90),
  },
  {
    id: "ll_002",
    dateIdentified: d(-140),
    source: "Reg 44",
    sourceReference: "Reg 44 visit — Oct 2024 (Visitor: J. Khatri)",
    themeArea: "Recording",
    lesson:
      "Significant verbal disclosures from young people during informal moments (e.g. car journeys, kitchen chats) were being recorded inconsistently — sometimes in daily logs, sometimes only verbally to the next shift.",
    context:
      "The independent visitor reviewed daily logs against keyworker session notes and identified at least three instances where children had shared important information that appeared in one record but not another.",
    whatHappened:
      "On a return car journey from contact, Jordan disclosed to Ryan that he was being pressured by an older peer at school to hold a phone for them. Ryan briefed the next shift verbally and mentioned it in supervision two weeks later, but the disclosure was not formally logged on the day. The Reg 44 visitor found this in cross-referencing notes.",
    rootCauseAnalysis:
      "No clear written threshold for what constitutes a 'recordable disclosure' versus an everyday conversation. Staff defaulted to memory and verbal handover for borderline items. Pressure of the shift and absence of a quick-capture tool made formal recording feel disproportionate.",
    whatWeChanged: [
      "Introduced a 'Quick Capture' note type in the daily log — 60-second template for verbal disclosures",
      "Defined a written threshold: any information that could affect risk, safeguarding, contact, or wellbeing must be logged within the shift",
      "Keyworkers now sign off weekly that all disclosures from their YP have been captured in the system",
      "Handover sheet redesigned to include a 'verbal disclosures this shift' line",
    ],
    policiesUpdated: [
      "Recording & Information Sharing Policy v4.0 (Nov 2024)",
      "Daily Log Standards SOP — added Quick Capture appendix",
    ],
    trainingDelivered: [
      "Recording disclosures workshop — full team (Nov 2024)",
      "New starter induction now includes 30-min Quick Capture module",
    ],
    staffBriefed: true,
    briefingDate: d(-135),
    evidenceOfEmbedding: [
      "Quick Capture entries averaging 4-6 per week across the home (was 0 prior)",
      "Reg 44 follow-up visit Feb 2025 — visitor confirmed records now consistent",
      "Internal case-file audit Mar 2025 found 100% disclosure capture in sampled records",
    ],
    recurrenceCheck:
      "No recurrence identified. Subsequent Reg 44 visits have specifically commended the Quick Capture approach.",
    status: "Embedded",
    embeddingScore: 5,
    reviewedBy: "staff_darren",
    nextReviewDate: d(60),
  },
  {
    id: "ll_003",
    dateIdentified: d(-95),
    source: "Complaint",
    sourceReference: "Complaint C-2024-09 — Family member of Alex",
    themeArea: "Communication",
    lesson:
      "Family members were not being kept informed about routine positive milestones (school achievements, birthday plans, hobby progress) — only contacted for problems or formal reviews. This created a perception that the home only communicated bad news.",
    context:
      "Alex's grandmother (named contact) raised a complaint that she had not heard anything for six weeks despite Alex doing well. She felt 'invisible' and worried the silence meant something was being hidden.",
    whatHappened:
      "Investigation found that staff had been having warm contact with the grandmother during her visits but no proactive written or phone updates between visits. Positive events were captured internally but not shared outward unless asked.",
    rootCauseAnalysis:
      "No structured family communication rhythm existed beyond statutory reviews and incidents. Staff conflated 'no concerns' with 'no need to contact'. Cultural assumption that families wanted to be left alone unless something specific arose.",
    whatWeChanged: [
      "Introduced a fortnightly 'good news' update for each child sent to named family contacts (with YP consent)",
      "Keyworker monthly call to family contact — calendar-blocked, not optional",
      "Family contact preferences captured at admission and reviewed every 6 months",
      "Birthday and school milestone dates added to keyworker dashboard with auto-prompt",
    ],
    policiesUpdated: [
      "Family & Significant Adult Communication Policy v2.0 (Jan 2025)",
      "Keyworker Standards SOP — section 7 added",
    ],
    trainingDelivered: [
      "Working with families and significant adults — half-day workshop (Jan 2025)",
    ],
    staffBriefed: true,
    briefingDate: d(-90),
    evidenceOfEmbedding: [
      "100% of children with a named family contact now receive fortnightly updates (verified by keyworker dashboard)",
      "Alex's grandmother sent a thank-you card in March specifically referencing the new approach",
      "No further communication-themed complaints in 4 months since change",
    ],
    recurrenceCheck:
      "No recurrence. One related issue raised by Casey's aunt in February — but that was about call timing, not silence, and resolved within 48 hours under the new framework.",
    status: "Embedded",
    embeddingScore: 4,
    reviewedBy: "staff_ryan",
    nextReviewDate: d(45),
  },
  {
    id: "ll_004",
    dateIdentified: d(-70),
    source: "Audit",
    sourceReference: "Medication Audit Q4 2024",
    themeArea: "Practice",
    lesson:
      "PRN (as-required) medication was being administered without consistent recording of the trigger, the prior non-pharmacological strategies tried, and the outcome at 30/60 minutes.",
    context:
      "Quarterly medication audit found that 6 of 18 PRN administrations in the period had complete records. The remaining 12 had time and dose, but missing trigger context and outcome assessment.",
    whatHappened:
      "PRN paracetamol and PRN melatonin were being given correctly from a clinical safety perspective, but the supporting therapeutic context was being skipped. This made it impossible to evidence whether non-pharmacological approaches were tried first or whether the medication had the intended effect.",
    rootCauseAnalysis:
      "MAR chart layout did not have dedicated fields for trigger or outcome. Staff had to write narrative in a small notes box and most defaulted to brevity. Audit had not previously surfaced this because audit criteria focused on the 'five rights' rather than therapeutic context.",
    whatWeChanged: [
      "MAR chart redesigned with explicit fields: trigger, prior strategies tried, outcome at 30 min, outcome at 60 min",
      "Staff cannot save a PRN entry without completing the trigger and outcome fields",
      "Monthly mini-audit (10 PRN entries) added to RM dashboard",
      "Audit framework expanded to include therapeutic context, not just clinical safety",
    ],
    policiesUpdated: [
      "Medication Administration Policy v5.1 (Feb 2025)",
      "MAR Chart Template v3 (Feb 2025)",
    ],
    trainingDelivered: [
      "PRN best practice — 90-minute session for all medication-trained staff (Feb 2025)",
    ],
    staffBriefed: true,
    briefingDate: d(-65),
    evidenceOfEmbedding: [
      "Q1 2025 medication audit: 17 of 18 PRN administrations fully documented (94%, up from 33%)",
      "Two examples in March where the new outcome field led to a GP review of dosage",
    ],
    recurrenceCheck:
      "Significantly reduced. The one outstanding case in Q1 was a night-shift entry where the 60-min outcome was not yet due at end of shift — flagged as a process gap, addressed by adding a follow-on prompt.",
    status: "Monitoring",
    embeddingScore: 4,
    reviewedBy: "staff_anna",
    nextReviewDate: d(30),
  },
  {
    id: "ll_005",
    dateIdentified: d(-50),
    source: "Reflective practice",
    sourceReference: "Group reflective practice session — Feb 2025",
    themeArea: "Wellbeing",
    lesson:
      "Staff supporting children through prolonged distress episodes (1+ hours) were not getting structured decompression time before returning to other duties — leading to fatigue-driven shortcuts later in shift.",
    context:
      "During a facilitated reflective practice session, three staff independently described the same pattern: extended emotional support, no break, then a noticeable dip in patience or recording quality in the 2-3 hours after.",
    whatHappened:
      "The pattern was not visible in any single incident but emerged as a theme when staff were given protected space to reflect. It corroborated quieter observations from supervision notes that had not been joined up.",
    rootCauseAnalysis:
      "Shift structure assumed all children-supporting time was equivalent in cognitive load. No mechanism existed to call a 'pause' after a heavy emotional episode. Staff cultural reluctance to ask for a break for fear of appearing not to cope.",
    whatWeChanged: [
      "Introduced a 'post-incident pause' — minimum 15 mins protected time after distress episodes 1hr+",
      "Senior on shift now offers the pause proactively, rather than waiting for staff to request it",
      "Shift planning includes a 'flex' staff member where rota allows, to enable cover during pauses",
      "Reflective practice sessions formally scheduled monthly (was ad-hoc)",
    ],
    policiesUpdated: [
      "Staff Wellbeing Policy v2.3 (Mar 2025) — section on post-incident pause added",
    ],
    trainingDelivered: [
      "Compassion fatigue and self-monitoring — 2-hour session (Mar 2025)",
    ],
    staffBriefed: true,
    briefingDate: d(-45),
    evidenceOfEmbedding: [
      "Post-incident pauses logged 9 times in March, 11 in April",
      "Two staff reported in supervision that the pause had measurably helped",
      "Recording quality audit showed no afternoon dip in 4 weeks of sampling post-change",
    ],
    recurrenceCheck:
      "Early signs are positive. Will be reviewed formally at the 3-month mark.",
    status: "In Progress",
    embeddingScore: 3,
    reviewedBy: "staff_darren",
    nextReviewDate: d(20),
  },
  {
    id: "ll_006",
    dateIdentified: d(-35),
    source: "Critical incident review",
    sourceReference: "CID-2025-003 — Missing episode (Alex)",
    themeArea: "Multi-agency",
    lesson:
      "Information-sharing with the local Missing Children's Coordinator was happening reactively at return, not proactively at first known risk indicators — meaning early intervention windows were being missed.",
    context:
      "Following Alex's missing episode, the post-incident review identified that warning signs (peer contact patterns, school avoidance) had been observed two weeks earlier but were not shared externally because no specific incident had occurred.",
    whatHappened:
      "Alex left the home for 45 minutes after a screen-time disagreement. Return interview identified social pressure from a peer as a contextual factor. Cross-referencing logs showed similar pressure had been noted earlier but was held internally.",
    rootCauseAnalysis:
      "Threshold for external information sharing was anchored to behavioural events (missing, exploitation referral) rather than cumulative low-level indicators. Multi-agency framework existed but staff were unsure when to use it pre-event.",
    whatWeChanged: [
      "Introduced a 'pattern threshold' for proactive multi-agency contact — 3+ low-level indicators in 14 days",
      "Standing slot at weekly clinical meeting to review pattern indicators across all YP",
      "Direct line of contact established with Missing Children's Coordinator (named officer)",
      "Information-sharing decisions now logged with rationale, including decisions NOT to share",
    ],
    policiesUpdated: [
      "Missing from Care Procedure v3.0 (Apr 2025)",
      "Information Sharing Framework v2.2 — pattern threshold added",
    ],
    trainingDelivered: [
      "Contextual safeguarding briefing — full team (Apr 2025)",
      "Multi-agency working refresher booked for May 2025",
    ],
    staffBriefed: true,
    briefingDate: d(-30),
    evidenceOfEmbedding: [
      "Two pattern-threshold escalations made in April — both led to constructive multi-agency conversations",
      "Decision log now contains 4 explicit 'not sharing because...' entries showing conscious application",
    ],
    recurrenceCheck:
      "Too early to draw conclusions. The 6-month recurrence review is scheduled for September.",
    status: "In Progress",
    embeddingScore: 3,
    reviewedBy: "staff_ryan",
    nextReviewDate: d(15),
  },
  {
    id: "ll_007",
    dateIdentified: d(-18),
    source: "External feedback",
    sourceReference: "School feedback — Education liaison meeting Apr 2025",
    themeArea: "Training",
    lesson:
      "Staff supporting children in education were not consistently briefed on each child's specific learning profile (SpLDs, EHCP targets, sensory needs) — relying on general behavioural knowledge.",
    context:
      "School SENCO raised that handover communication when staff escorted children to appointments or supported homework was strong on behaviour but weak on learning-specific strategies.",
    whatHappened:
      "Two examples cited: a staff member supporting Casey through homework used a strategy that conflicted with her SpLD profile; another supporting Jordan in a meeting was unaware of his sensory regulation needs documented in his EHCP.",
    rootCauseAnalysis:
      "Education documents (EHCPs, school reports, learning plans) were filed in case files but not summarised into accessible 'staff brief' format. Induction did not include education-specific information per child.",
    whatWeChanged: [
      "1-page 'Education at a Glance' summary created for each YP — pinned at start of case file",
      "Updated whenever EHCP review or school report received",
      "Staff sign-off required quarterly to confirm familiarity",
      "Education liaison meeting now standing quarterly with school SENCOs",
    ],
    policiesUpdated: [
      "Education Support SOP v1.4 (Apr 2025)",
    ],
    trainingDelivered: [
      "EHCP literacy and SpLD awareness — half-day session scheduled May 2025 (not yet delivered)",
    ],
    staffBriefed: false,
    briefingDate: d(7),
    evidenceOfEmbedding: [
      "Education at a Glance summaries drafted for 3 of 4 YP (one pending EHCP refresh)",
      "Initial briefing scheduled for upcoming team meeting",
    ],
    recurrenceCheck:
      "Not yet assessable — change very recent. Will be reviewed in next education liaison meeting.",
    status: "In Progress",
    embeddingScore: 2,
    reviewedBy: "staff_anna",
    nextReviewDate: d(10),
  },
  {
    id: "ll_008",
    dateIdentified: d(-7),
    source: "Audit",
    sourceReference: "QA Audit — Apr 2025 (Environment & Maintenance)",
    themeArea: "Environment",
    lesson:
      "Routine environmental checks (window restrictors, smoke alarm tests, water temperature) were being completed and signed off, but the underlying inspection observations were not surfacing minor degradation early enough.",
    context:
      "Audit identified two instances where checks were ticked as 'pass' but subsequent issues emerged within weeks — suggesting the binary pass/fail format was missing early warning signs.",
    whatHappened:
      "A window restrictor was logged as 'pass' but failed mechanically 3 weeks later under normal use. A water temperature check was 'pass' at 42C but moved to 47C two weeks later — within tolerance both times, but the trend was not visible in the binary record.",
    rootCauseAnalysis:
      "Check format optimised for pass/fail compliance, not for trend detection. No mechanism for staff to flag 'borderline OK' or 'showing wear'. Maintenance log existed separately and trends were not cross-referenced.",
    whatWeChanged: [
      "Introduced a 3-point scale on environmental checks: Good / Acceptable / Action needed",
      "Numeric values (where applicable, e.g. water temp) now logged not just pass/fail",
      "Monthly environmental trend review — RM dashboard view",
    ],
    policiesUpdated: [
      "Environmental Safety Checks SOP v2.0 (drafted, not yet ratified)",
    ],
    trainingDelivered: [
      "Briefing scheduled for next team meeting — not yet delivered",
    ],
    staffBriefed: false,
    briefingDate: d(5),
    evidenceOfEmbedding: [
      "New check format being piloted on water temperature checks since this week",
      "No trend data yet — too early",
    ],
    recurrenceCheck:
      "Not yet assessable. This is the most recently identified lesson and is at the start of its embedding cycle.",
    status: "Identified",
    embeddingScore: 1,
    reviewedBy: "staff_darren",
    nextReviewDate: d(7),
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function LessonsLearnedRegisterPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [filterTheme, setFilterTheme] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.lesson.toLowerCase().includes(q) ||
          r.context.toLowerCase().includes(q) ||
          r.sourceReference.toLowerCase().includes(q),
      );
    }
    if (filterSource !== "all") rows = rows.filter((r) => r.source === filterSource);
    if (filterTheme !== "all") rows = rows.filter((r) => r.themeArea === filterTheme);
    if (filterStatus !== "all") rows = rows.filter((r) => r.status === filterStatus);
    rows.sort((a, b) => {
      if (sortBy === "newest") return b.dateIdentified.localeCompare(a.dateIdentified);
      if (sortBy === "oldest") return a.dateIdentified.localeCompare(b.dateIdentified);
      if (sortBy === "embedding_low") return a.embeddingScore - b.embeddingScore;
      if (sortBy === "embedding_high") return b.embeddingScore - a.embeddingScore;
      return 0;
    });
    return rows;
  }, [data, search, filterSource, filterTheme, filterStatus, sortBy]);

  const total = data.length;
  const embedded = data.filter((r) => r.status === "Embedded").length;
  const active = data.filter((r) => r.status === "Identified" || r.status === "In Progress").length;
  const avgEmbedding =
    data.length > 0
      ? (data.reduce((s, r) => s + r.embeddingScore, 0) / data.length).toFixed(1)
      : "0.0";

  const exportCols: ExportColumn<Lesson>[] = [
    { header: "Date Identified", accessor: (r: Lesson) => r.dateIdentified },
    { header: "Source", accessor: (r: Lesson) => r.source },
    { header: "Source Reference", accessor: (r: Lesson) => r.sourceReference },
    { header: "Theme", accessor: (r: Lesson) => r.themeArea },
    { header: "Lesson", accessor: (r: Lesson) => r.lesson },
    { header: "Status", accessor: (r: Lesson) => r.status },
    { header: "Embedding Score", accessor: (r: Lesson) => String(r.embeddingScore) },
    { header: "Staff Briefed", accessor: (r: Lesson) => (r.staffBriefed ? "Yes" : "No") },
    { header: "Briefing Date", accessor: (r: Lesson) => r.briefingDate },
    { header: "Reviewed By", accessor: (r: Lesson) => getStaffName(r.reviewedBy) },
    { header: "Next Review", accessor: (r: Lesson) => r.nextReviewDate },
    {
      header: "What We Changed",
      accessor: (r: Lesson) => r.whatWeChanged.join(" | "),
    },
    {
      header: "Policies Updated",
      accessor: (r: Lesson) => r.policiesUpdated.join(" | "),
    },
    {
      header: "Recurrence Check",
      accessor: (r: Lesson) => r.recurrenceCheck,
    },
  ];

  return (
    <PageShell
      title="Lessons Learned Register"
      subtitle="Cross-cutting organisational learning · Quality Standard 13 · Reg 45"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Lessons Learned Register" />
          <ExportButton data={data} columns={exportCols} filename="lessons-learned-register" />
        </div>
      }
    >
      <div id="print-area">
        {/* banner */}
        <div className="mb-6 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 flex items-start gap-3">
          <Lightbulb className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">A lesson is only learned when it changes practice.</p>
            <p className="text-sm text-amber-800 mt-0.5">
              This register tracks every cross-cutting insight from incidents, complaints, audits, Reg 44 visits and reflective practice — and follows it through to embedded change.
            </p>
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Lessons", value: total, icon: BookOpen, clr: "text-blue-600" },
            { label: "Embedded", value: embedded, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Active", value: active, icon: Clock, clr: "text-amber-600" },
            { label: "Avg Embedding", value: `${avgEmbedding} / 5`, icon: Star, clr: "text-purple-600" },
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

        {/* active alert */}
        {active > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">
                {active} lesson{active === 1 ? "" : "s"} still in active embedding
              </p>
              <p className="text-amber-700">
                These items have changes underway but are not yet evidenced as embedded. They are reviewed at every leadership and clinical meeting until the embedding score reaches 4+ and recurrence is checked.
              </p>
            </div>
          </div>
        )}

        {/* filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search lessons, context, source ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {(Object.keys(SOURCE_CLR) as Source[]).map((k) => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTheme} onValueChange={setFilterTheme}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Theme" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Themes</SelectItem>
              {(Object.keys(THEME_CLR) as ThemeArea[]).map((k) => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(Object.keys(STATUS_CLR) as Status[]).map((k) => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="embedding_low">Embedding (low → high)</SelectItem>
                <SelectItem value="embedding_high">Embedding (high → low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setFilterSource("all");
              setFilterTheme("all");
              setFilterStatus("all");
              setSortBy("newest");
            }}
          >
            Reset
          </Button>
        </div>

        {/* cards */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            const needsAttention =
              r.status === "Identified" ||
              (r.status === "In Progress" && r.embeddingScore <= 2) ||
              !r.staffBriefed;
            return (
              <Card key={r.id} className={cn("border-l-4", STATUS_BORDER[r.status])}>
                <CardHeader
                  className="pb-2 cursor-pointer"
                  onClick={() => setExpandedId(isOpen ? null : r.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        <span>{r.lesson}</span>
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={SOURCE_CLR[r.source]}>{r.source}</Badge>
                        <Badge variant="outline" className={THEME_CLR[r.themeArea]}>{r.themeArea}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{r.status}</Badge>
                        <Badge variant="outline" className="bg-muted/50">
                          <Star className="h-3 w-3 mr-1 text-amber-500" />
                          {r.embeddingScore}/5
                        </Badge>
                        {needsAttention && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Needs attention
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Identified: {r.dateIdentified} · Source ref: {r.sourceReference} · Reviewed by {getStaffName(r.reviewedBy)} · Next review: {r.nextReviewDate}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* context */}
                    <div>
                      <p className="font-medium mb-1">Context</p>
                      <p className="text-muted-foreground text-xs">{r.context}</p>
                    </div>

                    {/* what happened */}
                    <div>
                      <p className="font-medium mb-1">What Happened</p>
                      <p className="text-muted-foreground text-xs">{r.whatHappened}</p>
                    </div>

                    {/* root cause */}
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <p className="font-medium text-xs text-red-800 mb-1">Root Cause Analysis</p>
                      <p className="text-xs text-red-700">{r.rootCauseAnalysis}</p>
                    </div>

                    {/* what we changed */}
                    {r.whatWeChanged.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-blue-700">What We Changed</p>
                        <ul className="space-y-1">
                          {r.whatWeChanged.map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* policies updated */}
                    {r.policiesUpdated.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Policies / Procedures Updated</p>
                        <div className="flex flex-wrap gap-1">
                          {r.policiesUpdated.map((p, i) => (
                            <Badge key={i} variant="outline" className="bg-slate-100 text-slate-700 text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* training delivered */}
                    {r.trainingDelivered.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Training Delivered</p>
                        <div className="flex flex-wrap gap-1">
                          {r.trainingDelivered.map((t, i) => (
                            <Badge key={i} variant="outline" className="bg-indigo-50 text-indigo-700 text-xs">
                              <GraduationCap className="h-3 w-3 mr-1" />
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* briefing */}
                    <div className="flex items-center gap-2 text-xs">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {r.staffBriefed ? (
                        <span className="text-green-700">
                          Staff briefed on {r.briefingDate}
                        </span>
                      ) : (
                        <span className="text-amber-700">
                          Briefing scheduled for {r.briefingDate} — not yet delivered
                        </span>
                      )}
                    </div>

                    {/* evidence of embedding */}
                    {r.evidenceOfEmbedding.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-green-700">Evidence of Embedding</p>
                        <ul className="space-y-1">
                          {r.evidenceOfEmbedding.map((e, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                              <span>{e}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* recurrence check */}
                    <div className="bg-purple-50 border border-purple-200 rounded p-2">
                      <p className="font-medium text-xs text-purple-800 mb-1">Recurrence Check — has it happened again?</p>
                      <p className="text-xs text-purple-700">{r.recurrenceCheck}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework — Quality Standard 13 & Regulation 45</p>
          <p>
            The Children&apos;s Homes (England) Regulations 2015 — Quality Standard 13 (the leadership and management standard) requires the Registered Manager to demonstrate that practice in the home is informed by an understanding of the views and needs of children, and that learning from incidents, complaints and other sources is used to improve the home. Regulation 45 requires the Registered Person to undertake a six-monthly review of the quality of care, drawing on this learning. This register evidences the cross-cutting organisational learning required by both: each lesson is sourced, themed, root-caused, actioned, briefed, embedded and recurrence-checked. Lessons are reviewed at leadership and clinical meetings until embedded, and form a standing input into the Reg 45 review.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
