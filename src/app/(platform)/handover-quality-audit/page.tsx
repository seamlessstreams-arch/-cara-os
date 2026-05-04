"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HANDOVER QUALITY AUDIT
// Observation-based audits of shift handovers. Scoring across information,
// safeguarding coverage, child voice, action handovers and professionalism.
// Required by Quality Standard 13 (Leadership & Management) and Reg 33.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Star,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Eye,
  EyeOff,
  Megaphone,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

// ── Local date helper ────────────────────────────────────────────────────────
const d = (n: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + n);
  return date.toISOString().slice(0, 10);
};

// ── Types ────────────────────────────────────────────────────────────────────
type RagRating = "Red" | "Amber" | "Green";

interface DomainScore {
  domain: string;
  score: 1 | 2 | 3 | 4 | 5;
  observation: string;
  evidence: string;
}

interface HandoverAudit {
  id: string;
  auditDate: string;
  auditPeriod: string;
  handoverObserved: string;
  auditor: string;
  staffOnDuty: string[];
  durationMinutes: number;
  scoringDomains: DomainScore[];
  overallScore: number;
  overallRagRating: RagRating;
  strengthsObserved: string[];
  gapsIdentified: string[];
  childrensSafetyInfoCovered: boolean;
  riskInfoCovered: boolean;
  handoverDocumentationQuality: string;
  childVoiceReflected: boolean;
  recommendationsToHandover: string[];
  trainingArising: string[];
  policyArising: string[];
  shareableObservations: string[];
  confidentialNotes: string;
  nextAuditDate: string;
}

// ── Seed audits (most recent first) ──────────────────────────────────────────
const AUDITS: HandoverAudit[] = [
  {
    id: "hq_005",
    auditDate: d(-3),
    auditPeriod: "Week 18, 2026",
    handoverObserved: "Late→Sleep-in handover, 21:30, Tuesday",
    auditor: "staff_darren",
    staffOnDuty: ["staff_ryan", "staff_anna"],
    durationMinutes: 28,
    scoringDomains: [
      {
        domain: "Information completeness",
        score: 5,
        observation: "All three children covered with structured key headings. Outgoing staff used the new handover template introduced after the March audit.",
        evidence: "Template visible in CharmsCare; printed prompt sheet on table.",
      },
      {
        domain: "Risk and safeguarding coverage",
        score: 5,
        observation: "Active safeguarding concern for Alex explicitly named with current strategy meeting status. Risk indicators referenced from placement plan.",
        evidence: "Safeguarding flag visible; reference made to most recent strategy minutes.",
      },
      {
        domain: "Child-specific updates",
        score: 4,
        observation: "Strong on Alex and Casey. Jordan's update was brief — could have included his recent positive engagement with the boxing club.",
        evidence: "Jordan section ~30 seconds vs 4 minutes for Alex.",
      },
      {
        domain: "Action handovers",
        score: 5,
        observation: "Three named actions handed over with deadlines. Sleep-in worker re-stated each one to confirm understanding.",
        evidence: "Action sheet completed and countersigned.",
      },
      {
        domain: "Handover etiquette/professionalism",
        score: 5,
        observation: "Phones away, door closed, no interruptions tolerated, language strengths-based throughout.",
        evidence: "Direct observation.",
      },
      {
        domain: "Use of recording tools",
        score: 4,
        observation: "Daily logs open and referenced live. Risk assessments not opened during handover although verbally summarised correctly.",
        evidence: "Screen observation.",
      },
      {
        domain: "Child voice reflected",
        score: 4,
        observation: "Casey's request for an earlier wake time was passed on accurately. Alex's view on the upcoming LAC review was paraphrased rather than quoted.",
        evidence: "Verbal recall of Casey's exact wording confirmed in daily log.",
      },
    ],
    overallScore: 4.6,
    overallRagRating: "Green",
    strengthsObserved: [
      "New handover template embedded in practice",
      "Active listening — incoming worker re-stated actions",
      "Safeguarding flag opened first, before general updates",
      "No mobile phone interruptions",
    ],
    gapsIdentified: [
      "Jordan's section disproportionately short",
      "Risk assessments not opened on screen",
    ],
    childrensSafetyInfoCovered: true,
    riskInfoCovered: true,
    handoverDocumentationQuality:
      "High quality — structured template followed, risk flag highlighted, actions clearly recorded with named owners and deadlines.",
    childVoiceReflected: true,
    recommendationsToHandover: [
      "Open risk assessment on screen for any child with active concern",
      "Allocate equal time to each child unless flagged otherwise",
      "Quote child's own words where possible, not paraphrase",
    ],
    trainingArising: [],
    policyArising: [],
    shareableObservations: [
      "Excellent embedding of the new handover template — keep this up across all shifts.",
      "Re-stating actions back is brilliant practice — adopting house-wide.",
    ],
    confidentialNotes: "",
    nextAuditDate: d(25),
  },
  {
    id: "hq_004",
    auditDate: d(-12),
    auditPeriod: "Week 17, 2026",
    handoverObserved: "Sleep-in→Early handover, 07:00, Saturday",
    auditor: "staff_ryan",
    staffOnDuty: ["staff_anna", "staff_darren"],
    durationMinutes: 18,
    scoringDomains: [
      {
        domain: "Information completeness",
        score: 4,
        observation: "All children covered. Overnight monitoring summary clear. Some weekend appointments not flagged.",
        evidence: "Saturday appointment for Casey was missed in the handover and picked up by incoming staff.",
      },
      {
        domain: "Risk and safeguarding coverage",
        score: 4,
        observation: "Overnight risk check completed and verbalised. Did not reference current safeguarding strategy outcome.",
        evidence: "No mention of strategy meeting outcome from Friday.",
      },
      {
        domain: "Child-specific updates",
        score: 4,
        observation: "Sleep quality reported well. Emotional state of each child described.",
        evidence: "Aligned with sleep monitoring log.",
      },
      {
        domain: "Action handovers",
        score: 3,
        observation: "Two actions handed over verbally. Not recorded on action sheet at the time.",
        evidence: "Action sheet completed retrospectively.",
      },
      {
        domain: "Handover etiquette/professionalism",
        score: 5,
        observation: "Calm, focused, respectful. Door closed.",
        evidence: "Direct observation.",
      },
      {
        domain: "Use of recording tools",
        score: 3,
        observation: "Sleep logs referenced verbally but not opened. Daily logs not reviewed live.",
        evidence: "Screen observation — logs closed throughout.",
      },
      {
        domain: "Child voice reflected",
        score: 4,
        observation: "Alex's expressed worry about his social worker visit was passed on with care.",
        evidence: "Recorded in handover sheet with quote marks.",
      },
    ],
    overallScore: 3.9,
    overallRagRating: "Amber",
    strengthsObserved: [
      "Calm, focused tone",
      "Child voice carried across — Alex's worry handed on accurately",
      "Sleep monitoring summary tight",
    ],
    gapsIdentified: [
      "Saturday appointment for Casey not flagged",
      "Strategy meeting outcome not referenced",
      "Actions recorded retrospectively not at the time",
      "Recording tools not used live during handover",
    ],
    childrensSafetyInfoCovered: true,
    riskInfoCovered: true,
    handoverDocumentationQuality:
      "Adequate — record completed but actions added retrospectively. Live use of digital records during handover would strengthen quality.",
    childVoiceReflected: true,
    recommendationsToHandover: [
      "Open daily logs and risk assessments live during every handover",
      "Record actions on the action sheet at the moment they are agreed",
      "Sweep the next 48 hours of appointments at the start of every handover",
    ],
    trainingArising: ["Refresher on live use of CharmsCare during handovers"],
    policyArising: [],
    shareableObservations: [
      "Handing over Alex's worry word-for-word was excellent practice — that's how children's voice carries through.",
    ],
    confidentialNotes:
      "Anna would benefit from paired shadowing with Ryan on a structured handover — schedule before next month's audit.",
    nextAuditDate: d(15),
  },
  {
    id: "hq_003",
    auditDate: d(-22),
    auditPeriod: "Week 16, 2026",
    handoverObserved: "Early→Late handover, 14:00, Wednesday",
    auditor: "staff_darren",
    staffOnDuty: ["staff_darren", "staff_anna"],
    durationMinutes: 35,
    scoringDomains: [
      {
        domain: "Information completeness",
        score: 4,
        observation: "Full coverage of all three children. Education updates shared in detail for Casey.",
        evidence: "Cross-checked with morning logs.",
      },
      {
        domain: "Risk and safeguarding coverage",
        score: 5,
        observation: "Active concern raised first. Safety plan referenced and current trigger picture explained.",
        evidence: "Safety plan opened on screen.",
      },
      {
        domain: "Child-specific updates",
        score: 4,
        observation: "Each child given their own section. Strengths and concerns balanced.",
        evidence: "Followed structured template.",
      },
      {
        domain: "Action handovers",
        score: 4,
        observation: "Actions named, owners assigned. Deadlines for two of four actions were vague ('this evening').",
        evidence: "Action sheet recorded.",
      },
      {
        domain: "Handover etiquette/professionalism",
        score: 4,
        observation: "Mostly focused. One brief interruption from a delivery — handled well, returned to topic.",
        evidence: "Direct observation.",
      },
      {
        domain: "Use of recording tools",
        score: 5,
        observation: "Daily logs, safety plan, and behaviour log all open and referenced live.",
        evidence: "Screen observation.",
      },
      {
        domain: "Child voice reflected",
        score: 3,
        observation: "Children's views referenced generally but not quoted. Casey had a key meeting that morning — her words were summarised by adult.",
        evidence: "Daily log entry contained Casey's exact words but these did not appear in handover.",
      },
    ],
    overallScore: 4.1,
    overallRagRating: "Green",
    strengthsObserved: [
      "Live use of recording tools throughout",
      "Safeguarding raised first, not last",
      "Balanced strengths and concerns per child",
    ],
    gapsIdentified: [
      "Action deadlines too vague",
      "Children's voice paraphrased rather than quoted",
    ],
    childrensSafetyInfoCovered: true,
    riskInfoCovered: true,
    handoverDocumentationQuality:
      "Good — template followed, live record-keeping. Action deadlines need to be specific times not 'this evening'.",
    childVoiceReflected: false,
    recommendationsToHandover: [
      "Always record action deadlines as specific times",
      "Quote children's exact words when their voice is being passed on",
    ],
    trainingArising: [
      "Children's voice in records — workshop scheduled for next team meeting",
    ],
    policyArising: [],
    shareableObservations: [
      "Live use of records during handover is strong — let's keep that as the house standard.",
    ],
    confidentialNotes: "",
    nextAuditDate: d(5),
  },
  {
    id: "hq_002",
    auditDate: d(-32),
    auditPeriod: "Week 14, 2026",
    handoverObserved: "Late→Sleep-in handover, 21:45, Thursday",
    auditor: "staff_ryan",
    staffOnDuty: ["staff_anna", "staff_darren"],
    durationMinutes: 14,
    scoringDomains: [
      {
        domain: "Information completeness",
        score: 3,
        observation: "Two children covered properly. Jordan's update was very brief and missed his school report received that day.",
        evidence: "School report email visible in inbox, not referenced in handover.",
      },
      {
        domain: "Risk and safeguarding coverage",
        score: 3,
        observation: "Safeguarding flag mentioned but not the most recent professional advice received earlier that day.",
        evidence: "Strategy meeting note from earlier was not in the conversation.",
      },
      {
        domain: "Child-specific updates",
        score: 3,
        observation: "Mood and behaviour covered, but not progress against current pieces of work or plans.",
        evidence: "Care plan goals not referenced.",
      },
      {
        domain: "Action handovers",
        score: 2,
        observation: "Actions discussed but no action sheet completed. Incoming worker had to ask for clarification later.",
        evidence: "No action sheet on file.",
      },
      {
        domain: "Handover etiquette/professionalism",
        score: 4,
        observation: "Tone respectful but rushed. Outgoing staff visibly tired at end of long shift.",
        evidence: "Handover ran 14 minutes vs typical 25–30.",
      },
      {
        domain: "Use of recording tools",
        score: 2,
        observation: "No records opened during handover. All verbal.",
        evidence: "Screen locked throughout.",
      },
      {
        domain: "Child voice reflected",
        score: 3,
        observation: "Casey's bedtime concern mentioned but not in her own words.",
        evidence: "Daily log had Casey's words, handover did not.",
      },
    ],
    overallScore: 2.9,
    overallRagRating: "Red",
    strengthsObserved: [
      "Tone remained respectful despite tiredness",
      "Casey's bedtime concern was at least surfaced",
    ],
    gapsIdentified: [
      "Handover too short — 14 minutes is below house standard",
      "No action sheet completed",
      "Recording tools not used at all",
      "Recent strategy meeting outcome not referenced",
      "Jordan's school report missed",
    ],
    childrensSafetyInfoCovered: false,
    riskInfoCovered: false,
    handoverDocumentationQuality:
      "Poor — verbal-only handover, no action sheet, no live records. Documentation quality below expected standard.",
    childVoiceReflected: false,
    recommendationsToHandover: [
      "Minimum 25 minute handover for full house",
      "Action sheet to be completed in real time during every handover",
      "Open daily logs, risk assessments, and safeguarding flags on screen",
      "Sweep email/inbox for the day's professional contacts before handover",
    ],
    trainingArising: [
      "Whole-team refresher on handover standards — delivered at April team meeting",
      "Anna shadowed by Ryan for next three structured handovers",
    ],
    policyArising: [
      "Handover policy reviewed and minimum duration of 25 minutes formally added",
      "Action sheet now mandatory — no handover signed off without one",
    ],
    shareableObservations: [
      "From this audit we've added a 25-minute minimum and a mandatory action sheet — protecting children means protecting the handover.",
    ],
    confidentialNotes:
      "Anna was visibly exhausted — wellbeing conversation held next day. Roster reviewed to avoid back-to-back long shifts.",
    nextAuditDate: d(-3),
  },
  {
    id: "hq_001",
    auditDate: d(-45),
    auditPeriod: "Week 12, 2026",
    handoverObserved: "Early→Late handover, 14:15, Monday",
    auditor: "staff_darren",
    staffOnDuty: ["staff_ryan", "staff_anna"],
    durationMinutes: 22,
    scoringDomains: [
      {
        domain: "Information completeness",
        score: 4,
        observation: "All children covered. Some daily routines mentioned only in passing.",
        evidence: "Cross-checked with daily logs.",
      },
      {
        domain: "Risk and safeguarding coverage",
        score: 4,
        observation: "Risk flags shared. Safeguarding chronology not referenced.",
        evidence: "Safeguarding log not opened.",
      },
      {
        domain: "Child-specific updates",
        score: 3,
        observation: "Basic updates only. Care plan progress not mentioned.",
        evidence: "Care plans not referenced in handover.",
      },
      {
        domain: "Action handovers",
        score: 3,
        observation: "Two actions handed over verbally. Action sheet partly completed.",
        evidence: "Action sheet incomplete.",
      },
      {
        domain: "Handover etiquette/professionalism",
        score: 4,
        observation: "Professional and calm. One phone call answered mid-handover.",
        evidence: "Direct observation.",
      },
      {
        domain: "Use of recording tools",
        score: 3,
        observation: "Daily log briefly opened. Risk assessments and care plans not opened.",
        evidence: "Screen observation.",
      },
      {
        domain: "Child voice reflected",
        score: 3,
        observation: "Children referenced in third person summary, not quoted.",
        evidence: "Daily logs had quotes that were not passed on.",
      },
    ],
    overallScore: 3.4,
    overallRagRating: "Amber",
    strengthsObserved: [
      "Professional tone",
      "All children covered",
    ],
    gapsIdentified: [
      "Care plan progress missing",
      "Safeguarding chronology not opened",
      "Children's voice paraphrased",
      "Phone interruption tolerated",
    ],
    childrensSafetyInfoCovered: true,
    riskInfoCovered: true,
    handoverDocumentationQuality:
      "Adequate — basic record, action sheet incomplete, live records under-used.",
    childVoiceReflected: false,
    recommendationsToHandover: [
      "Phones away during handover",
      "Always reference care plan goals in child updates",
      "Open the safeguarding log routinely, not only when prompted",
    ],
    trainingArising: ["Workshop on linking handover updates to care plan goals"],
    policyArising: [],
    shareableObservations: [
      "From this audit we agreed: phones go away, care plan goals get named in every handover.",
    ],
    confidentialNotes: "",
    nextAuditDate: d(-15),
  },
];

// ── RAG colour helpers ───────────────────────────────────────────────────────
const ragColour = (rag: RagRating): string => {
  if (rag === "Green") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (rag === "Amber") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-rose-100 text-rose-800 border-rose-200";
};

const scoreColour = (score: number): string => {
  if (score >= 4.5) return "text-emerald-700";
  if (score >= 3.5) return "text-emerald-600";
  if (score >= 2.5) return "text-amber-600";
  return "text-rose-600";
};

const formatPretty = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ── Sort options ─────────────────────────────────────────────────────────────
type SortKey =
  | "date_desc"
  | "date_asc"
  | "score_desc"
  | "score_asc"
  | "rag";

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HandoverQualityAuditPage() {
  const [sortKey, setSortKey] = useState<SortKey>("date_desc");
  const [filterRag, setFilterRag] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const ninety = new Date();
    ninety.setDate(ninety.getDate() - 90);
    const thisQuarter = AUDITS.filter((a) => new Date(a.auditDate) >= ninety);
    const avg =
      AUDITS.reduce((s, a) => s + a.overallScore, 0) / Math.max(AUDITS.length, 1);
    const green = AUDITS.filter((a) => a.overallRagRating === "Green").length;
    const recOpen = AUDITS.reduce(
      (s, a) => s + a.recommendationsToHandover.length,
      0,
    );
    return {
      thisQuarter: thisQuarter.length,
      avg: Math.round(avg * 10) / 10,
      green,
      recOpen,
    };
  }, []);

  // ── Filtered + sorted ──────────────────────────────────────────────────────
  const visible = useMemo(() => {
    let list = [...AUDITS];
    if (filterRag !== "all") {
      list = list.filter((a) => a.overallRagRating === filterRag);
    }
    switch (sortKey) {
      case "date_desc":
        list.sort((a, b) => b.auditDate.localeCompare(a.auditDate));
        break;
      case "date_asc":
        list.sort((a, b) => a.auditDate.localeCompare(b.auditDate));
        break;
      case "score_desc":
        list.sort((a, b) => b.overallScore - a.overallScore);
        break;
      case "score_asc":
        list.sort((a, b) => a.overallScore - b.overallScore);
        break;
      case "rag": {
        const order: Record<RagRating, number> = { Red: 0, Amber: 1, Green: 2 };
        list.sort(
          (a, b) => order[a.overallRagRating] - order[b.overallRagRating],
        );
        break;
      }
    }
    return list;
  }, [sortKey, filterRag]);

  // ── Export columns (explicit annotations per rule) ─────────────────────────
  const exportColumns: ExportColumn<HandoverAudit>[] = [
    { header: "Audit ID", accessor: (r: HandoverAudit) => r.id },
    { header: "Date", accessor: (r: HandoverAudit) => r.auditDate },
    { header: "Period", accessor: (r: HandoverAudit) => r.auditPeriod },
    {
      header: "Handover observed",
      accessor: (r: HandoverAudit) => r.handoverObserved,
    },
    {
      header: "Auditor",
      accessor: (r: HandoverAudit) => getStaffName(r.auditor),
    },
    {
      header: "Staff on duty",
      accessor: (r: HandoverAudit) =>
        r.staffOnDuty.map((id: string) => getStaffName(id)).join("; "),
    },
    {
      header: "Duration (min)",
      accessor: (r: HandoverAudit) => String(r.durationMinutes),
    },
    {
      header: "Overall score",
      accessor: (r: HandoverAudit) => String(r.overallScore),
    },
    {
      header: "RAG",
      accessor: (r: HandoverAudit) => r.overallRagRating,
    },
    {
      header: "Safety info covered",
      accessor: (r: HandoverAudit) =>
        r.childrensSafetyInfoCovered ? "Yes" : "No",
    },
    {
      header: "Risk info covered",
      accessor: (r: HandoverAudit) => (r.riskInfoCovered ? "Yes" : "No"),
    },
    {
      header: "Child voice reflected",
      accessor: (r: HandoverAudit) => (r.childVoiceReflected ? "Yes" : "No"),
    },
    {
      header: "Strengths",
      accessor: (r: HandoverAudit) => r.strengthsObserved.join(" | "),
    },
    {
      header: "Gaps",
      accessor: (r: HandoverAudit) => r.gapsIdentified.join(" | "),
    },
    {
      header: "Recommendations",
      accessor: (r: HandoverAudit) =>
        r.recommendationsToHandover.join(" | "),
    },
    {
      header: "Training arising",
      accessor: (r: HandoverAudit) => r.trainingArising.join(" | "),
    },
    {
      header: "Policy arising",
      accessor: (r: HandoverAudit) => r.policyArising.join(" | "),
    },
    {
      header: "Next audit",
      accessor: (r: HandoverAudit) => r.nextAuditDate,
    },
  ];

  return (
    <PageShell
      title="Handover Quality Audit"
      subtitle="Observation-based scoring of shift handovers — required by Quality Standard 13 and Reg 33."
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            data={visible}
            columns={exportColumns}
            filename="handover-quality-audits"
          />
          <PrintButton title="Handover Quality Audits" />
        </div>
      }
    >
      {/* Banner — handover as safeguarding moment */}
      <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 text-indigo-700 mt-0.5" />
          <div className="text-sm text-indigo-900">
            <p className="font-semibold">
              Handover is a safeguarding moment.
            </p>
            <p className="mt-1">
              Every handover protects a child's safety, voice and continuity of
              care. Auditing handover quality is one of the clearest ways a
              Registered Manager can evidence Quality Standard 13 (Leadership &
              Management) and inform the Independent Person under Reg 33. Each
              gap captured here becomes learning, training, or policy — never
              just a note.
            </p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 uppercase tracking-wide">
            <CalendarClock className="h-4 w-4" /> Audits this quarter
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            {summary.thisQuarter}
          </div>
          <div className="mt-1 text-xs text-slate-500">last 90 days</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 uppercase tracking-wide">
            <Star className="h-4 w-4" /> Average score
          </div>
          <div
            className={cn(
              "mt-2 text-3xl font-semibold",
              scoreColour(summary.avg),
            )}
          >
            {summary.avg.toFixed(1)}
          </div>
          <div className="mt-1 text-xs text-slate-500">out of 5.0</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 uppercase tracking-wide">
            <CheckCircle2 className="h-4 w-4" /> Green-rated handovers
          </div>
          <div className="mt-2 text-3xl font-semibold text-emerald-700">
            {summary.green}
            <span className="text-base font-normal text-slate-500">
              {" "}
              / {AUDITS.length}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">overall RAG</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 uppercase tracking-wide">
            <Lightbulb className="h-4 w-4" /> Recommendations open
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            {summary.recOpen}
          </div>
          <div className="mt-1 text-xs text-slate-500">across all audits</div>
        </div>
      </div>

      {/* Filters / sort */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">RAG</span>
          <Select value={filterRag} onValueChange={setFilterRag}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Green">Green</SelectItem>
              <SelectItem value="Amber">Amber</SelectItem>
              <SelectItem value="Red">Red</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-600">Sort by</span>
          <Select
            value={sortKey}
            onValueChange={(v: string) => setSortKey(v as SortKey)}
          >
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Date (newest first)</SelectItem>
              <SelectItem value="date_asc">Date (oldest first)</SelectItem>
              <SelectItem value="score_desc">Score (highest)</SelectItem>
              <SelectItem value="score_asc">Score (lowest)</SelectItem>
              <SelectItem value="rag">RAG (red first)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-xs text-slate-500">
          Showing {visible.length} of {AUDITS.length}
        </div>
      </div>

      {/* Audit list */}
      <div className="space-y-3">
        {visible.map((a) => {
          const isOpen = expandedId === a.id;
          return (
            <div
              key={a.id}
              className="rounded-lg border border-slate-200 bg-white shadow-sm"
            >
              {/* Card header */}
              <button
                type="button"
                onClick={() =>
                  setExpandedId((current) => (current === a.id ? null : a.id))
                }
                className="flex w-full items-start justify-between gap-4 p-4 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {a.handoverObserved}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-medium",
                        ragColour(a.overallRagRating),
                      )}
                    >
                      {a.overallRagRating}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        scoreColour(a.overallScore),
                      )}
                    >
                      {a.overallScore.toFixed(1)} / 5.0
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatPretty(a.auditDate)} · {a.auditPeriod}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      Auditor: {getStaffName(a.auditor)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {a.durationMinutes} min observed
                    </span>
                    <span className="flex items-center gap-1">
                      {a.childVoiceReflected ? (
                        <>
                          <Eye className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">
                            Child voice reflected
                          </span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-amber-700">
                            Child voice gap
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 pt-1">
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Expanded body */}
              {isOpen && (
                <div className="border-t border-slate-200 p-4 space-y-5">
                  {/* Headline blocks */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-md bg-slate-50 p-3">
                      <div className="text-xs font-medium text-slate-600">
                        Staff on duty
                      </div>
                      <div className="mt-1 text-sm text-slate-900">
                        {a.staffOnDuty.map((id) => getStaffName(id)).join(", ")}
                      </div>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <div className="text-xs font-medium text-slate-600">
                        Safety information covered
                      </div>
                      <div
                        className={cn(
                          "mt-1 text-sm font-medium",
                          a.childrensSafetyInfoCovered
                            ? "text-emerald-700"
                            : "text-rose-700",
                        )}
                      >
                        {a.childrensSafetyInfoCovered ? "Yes" : "No"}
                      </div>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <div className="text-xs font-medium text-slate-600">
                        Risk information covered
                      </div>
                      <div
                        className={cn(
                          "mt-1 text-sm font-medium",
                          a.riskInfoCovered
                            ? "text-emerald-700"
                            : "text-rose-700",
                        )}
                      >
                        {a.riskInfoCovered ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>

                  {/* Domain scores */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4" /> Domain scores
                    </h3>
                    <div className="overflow-hidden rounded-md border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                          <tr>
                            <th className="px-3 py-2 text-left">Domain</th>
                            <th className="px-3 py-2 text-left w-16">Score</th>
                            <th className="px-3 py-2 text-left">Observation</th>
                            <th className="px-3 py-2 text-left">Evidence</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {a.scoringDomains.map((dom) => (
                            <tr key={dom.domain}>
                              <td className="px-3 py-2 align-top font-medium text-slate-800">
                                {dom.domain}
                              </td>
                              <td className="px-3 py-2 align-top">
                                <span
                                  className={cn(
                                    "font-semibold",
                                    scoreColour(dom.score),
                                  )}
                                >
                                  {dom.score} / 5
                                </span>
                              </td>
                              <td className="px-3 py-2 align-top text-slate-700">
                                {dom.observation}
                              </td>
                              <td className="px-3 py-2 align-top text-slate-500 italic">
                                {dom.evidence}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Strengths / Gaps */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                      <h4 className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Strengths observed
                      </h4>
                      {a.strengthsObserved.length > 0 ? (
                        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-emerald-900">
                          {a.strengthsObserved.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-emerald-800 italic">
                          None recorded.
                        </p>
                      )}
                    </div>
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                      <h4 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Gaps identified
                      </h4>
                      {a.gapsIdentified.length > 0 ? (
                        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-amber-900">
                          {a.gapsIdentified.map((g, i) => (
                            <li key={i}>{g}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-amber-800 italic">
                          No gaps recorded.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Documentation quality */}
                  <div className="rounded-md border border-slate-200 p-3">
                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" /> Handover documentation
                      quality
                    </h4>
                    <p className="mt-1 text-sm text-slate-700">
                      {a.handoverDocumentationQuality}
                    </p>
                  </div>

                  {/* Recommendations / Training / Policy */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3">
                      <h4 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" /> Recommendations
                      </h4>
                      {a.recommendationsToHandover.length > 0 ? (
                        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-indigo-900">
                          {a.recommendationsToHandover.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-indigo-800 italic">
                          None.
                        </p>
                      )}
                    </div>
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                      <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" /> Training arising
                      </h4>
                      {a.trainingArising.length > 0 ? (
                        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-blue-900">
                          {a.trainingArising.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-blue-800 italic">
                          None.
                        </p>
                      )}
                    </div>
                    <div className="rounded-md border border-violet-200 bg-violet-50 p-3">
                      <h4 className="text-sm font-semibold text-violet-900 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" /> Policy arising
                      </h4>
                      {a.policyArising.length > 0 ? (
                        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-violet-900">
                          {a.policyArising.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-violet-800 italic">
                          None.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Shareable team observations */}
                  <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3">
                    <h4 className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                      <Megaphone className="h-4 w-4" /> Shared with the team
                    </h4>
                    {a.shareableObservations.length > 0 ? (
                      <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-emerald-900">
                        {a.shareableObservations.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-emerald-800 italic">
                        Nothing published from this audit yet.
                      </p>
                    )}
                  </div>

                  {/* Confidential notes (RM only) */}
                  {a.confidentialNotes && (
                    <div className="rounded-md border border-slate-300 bg-slate-50 p-3">
                      <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <EyeOff className="h-4 w-4" /> Confidential note
                        (Registered Manager only)
                      </h4>
                      <p className="mt-1 text-sm text-slate-700">
                        {a.confidentialNotes}
                      </p>
                    </div>
                  )}

                  {/* Footer line */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Audit ID: {a.id}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Next audit due: {formatPretty(a.nextAuditDate)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {visible.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No audits match the current filters.
          </div>
        )}
      </div>

      {/* Regulatory note */}
      <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> Regulatory basis
        </h3>
        <p>
          The Children's Homes (England) Regulations 2015 — Quality Standard 13
          (Leadership and Management Standard) requires the Registered Manager
          to lead a culture of continuous improvement and to use evidence to
          improve quality of care. Reg 33 visits ask the Independent Person to
          consider whether children are effectively safeguarded and whether
          systems for sharing information between staff are robust. Auditing
          handovers — the moment a child's safety, voice, and continuity of care
          travel from one shift to the next — is one of the strongest direct
          evidence sources for both. Findings here feed Reg 45 quality of care
          reviews and the SCCIF self-evaluation.
        </p>
      </div>
    </PageShell>
  );
}

