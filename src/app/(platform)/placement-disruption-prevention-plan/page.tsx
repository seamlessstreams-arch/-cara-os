"use client";

import { useState, useMemo } from "react";
import {
  ShieldAlert, Search, ArrowUpDown,
  AlertTriangle, CheckCircle2, TrendingUp,
  ChevronDown, ChevronUp, Calendar, Shield,
  Heart, Target, Clock, Users, UserCheck,
  Activity, FileSignature, Eye, Wrench,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
const RISK_LEVELS = ["Low", "Building", "Heightened", "Acute"] as const;
type RiskLevel = typeof RISK_LEVELS[number];
const RISK_COLORS: Record<RiskLevel, string> = {
  Low: "bg-green-100 text-green-800",
  Building: "bg-yellow-100 text-yellow-800",
  Heightened: "bg-orange-100 text-orange-800",
  Acute: "bg-red-100 text-red-800",
};

interface WarningSignAction {
  warningSign: string;
  action: string;
  owner: string; // staff ID
  timeframe: string;
}

interface InterventionHistory {
  date: string;
  intervention: string;
  outcome: string;
}

interface DisruptionPlan {
  id: string;
  youngPerson: string; // yp ID
  planDate: string;
  riskOfDisruptionLevel: RiskLevel;
  keyStabilityFactors: string[];
  warningSignsToWatchFor: string[];
  recentTriggers: string[];
  proactiveActionsInPlace: string[];
  supportNetworkInPlace: string[];
  childAwareOfPlan: boolean;
  childContribution: string;
  familyInvolvement: string;
  professionalsInvolved: string[];
  specialActionsIfWarningSignsAppear: WarningSignAction[];
  homeSpecificMitigations: string[];
  staffingAdjustments: string;
  childActionsAgreed: string[];
  reviewedDate: string;
  reviewedBy: string; // staff ID
  nextReviewDate: string;
  signedOffByLA: boolean;
  interventionsDeployedHistory: InterventionHistory[];
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: DisruptionPlan[] = [
  {
    id: "ddp_alex",
    youngPerson: "yp_alex",
    planDate: d(-45),
    riskOfDisruptionLevel: "Low",
    keyStabilityFactors: [
      "Longest placement to date — strong sense of belonging",
      "Trusted attachment to key worker (Anna) and wider staff team",
      "Improving relationship with mum",
      "Stable peer dynamic with Jordan and Casey",
    ],
    warningSignsToWatchFor: [
      "School avoidance increasing or refusal escalating",
      "Withdrawal from key worker or refusing key work sessions",
      "Late-night phone use causing sleep disruption",
      "Reactive social-media-driven distress",
      "Comments suggesting wanting to leave or 'they'll send me away'",
    ],
    recentTriggers: [
      "Bullying concern at school under investigation",
      "Sibling-like friction with Jordan during exam stress (resolved)",
    ],
    proactiveActionsInPlace: [
      "Daily wellbeing check-ins with key worker each morning",
      "Phone handover at 9:30pm — maintained consistently",
      "School liaison meetings every 2 weeks while bullying issue active",
      "Key work sessions weekly focused on emotional literacy",
      "CAMHS open referral retained — re-activate if anxiety escalates",
    ],
    supportNetworkInPlace: [
      "Key Worker: Anna",
      "Co-Key Worker: Chervelle",
      "Social Worker: Sarah Mitchell (LA)",
      "IRO: Helen Brown",
      "School pastoral lead: Mr Davies",
      "Mum (positive contact)",
    ],
    childAwareOfPlan: true,
    childContribution:
      "Alex helped write the warning signs section. Said 'I know when I'm getting wobbly — it's usually about phone stuff or school.' Asked that staff don't 'make a big deal' if they spot warning signs but instead 'just sit with me'.",
    familyInvolvement:
      "Mum is aware of the plan in principle. Sarah (SW) shared headlines with mum at last LAC. Mum agreed to flag any concerns from contact calls quickly.",
    professionalsInvolved: [
      "Social Worker — Sarah Mitchell",
      "IRO — Helen Brown",
      "CAMHS — open referral, Dr Patel",
      "School pastoral — Mr Davies",
      "GP — Dr Khan",
    ],
    specialActionsIfWarningSignsAppear: [
      {
        warningSign: "Two consecutive school refusals",
        action: "Trigger school liaison meeting; key work session same day; review phone routine",
        owner: "staff_anna",
        timeframe: "Same day",
      },
      {
        warningSign: "Late-night social media distress incident",
        action: "Phone removed for 24h with explanation; calm conversation next morning; log on behaviour map",
        owner: "staff_chervelle",
        timeframe: "Within 2h",
      },
      {
        warningSign: "Comments about leaving or being 'sent away'",
        action: "Reassurance script; one-to-one with key worker; escalate to RM and SW if persists 48h",
        owner: "staff_darren",
        timeframe: "Same shift",
      },
    ],
    homeSpecificMitigations: [
      "Bedroom is fully personalised — protected space",
      "Favourite chair in lounge respected as 'Alex's spot'",
      "Sunday cooking ritual maintained — protective routine",
      "Wi-fi schedule applied consistently across home",
    ],
    staffingAdjustments:
      "Anna's shift pattern preserved on Mondays/Wednesdays where possible — Alex's preferred days. No new agency staff to be lone-working with Alex during school-bullying investigation period.",
    childActionsAgreed: [
      "Tell Anna or any trusted staff if school feels unsafe",
      "Hand phone in by 9:30pm without resistance",
      "Try at least one coping strategy before reaching for phone when upset",
    ],
    reviewedDate: d(-45),
    reviewedBy: "staff_darren",
    nextReviewDate: d(45),
    signedOffByLA: true,
    interventionsDeployedHistory: [
      {
        date: d(-120),
        intervention: "Phone routine introduced after late-night distress pattern",
        outcome: "Sleep improved within 2 weeks; pattern stable since",
      },
      {
        date: d(-60),
        intervention: "School pastoral liaison stepped up after attendance dip",
        outcome: "Attendance recovered to 78% (target 90% — still in progress)",
      },
    ],
  },
  {
    id: "ddp_jordan",
    youngPerson: "yp_jordan",
    planDate: d(-14),
    riskOfDisruptionLevel: "Building",
    keyStabilityFactors: [
      "5 months in placement — settled, says 'best home'",
      "Strong school engagement and peer relationships",
      "Effective coping strategies developing through key work",
      "Positive recent LAC review — IRO praised stability",
    ],
    warningSignsToWatchFor: [
      "Increased anxiety leading up to or after contact calls with mum",
      "Sleep disturbance returning",
      "Withdrawal from football or peer activities",
      "Asking repeated questions about 'when mum's out'",
      "Regression in self-care or appetite changes",
    ],
    recentTriggers: [
      "Mum's release from prison confirmed for next month — anticipated change in contact arrangements",
      "Solicitor letter received re: future contact — Jordan present when post arrived (now mitigated)",
    ],
    proactiveActionsInPlace: [
      "Pre-contact and post-contact debrief sessions with key worker",
      "Calm-down toolkit kept in Jordan's bedroom (chosen items)",
      "Weekly key work session dedicated to processing mum's release",
      "Coordinated comms plan with SW so Jordan hears news from trusted adults first",
      "Therapeutic life-story work brought forward",
    ],
    supportNetworkInPlace: [
      "Key Worker: Anna",
      "Co-Key Worker: Darren (RM)",
      "Social Worker: Tom Richards (LA)",
      "IRO: Helen Brown",
      "School pastoral: Ms Lewis",
      "Therapist: pending allocation",
    ],
    childAwareOfPlan: true,
    childContribution:
      "Jordan said 'I want to know what's happening but not all at once.' Asked that staff give one piece of news at a time. Chose three trusted adults (Anna, Darren, Tom) as 'okay to give me news'.",
    familyInvolvement:
      "Mum's release is the central trigger. Information sharing is being managed jointly with Tom (SW). Father remains supervised contact only — anxiety pre-visit being supported well.",
    professionalsInvolved: [
      "Social Worker — Tom Richards",
      "IRO — Helen Brown",
      "Prison release liaison via LA",
      "School pastoral — Ms Lewis",
      "GP — Dr Khan",
      "CAMHS — referral submitted, awaiting allocation",
    ],
    specialActionsIfWarningSignsAppear: [
      {
        warningSign: "Sleep disturbance for two consecutive nights",
        action: "Gentle bedtime check-in; offer warm drink and chat; record on sleep log; flag to SW if persists",
        owner: "staff_anna",
        timeframe: "Same night",
      },
      {
        warningSign: "Repeated questions about mum's release indicating overwhelm",
        action: "Plan-led conversation using agreed script; loop in Tom (SW) within 24h to coordinate next info update",
        owner: "staff_darren",
        timeframe: "Same shift",
      },
      {
        warningSign: "Withdrawal from football or refusing to attend school",
        action: "Do not pressure; key work check-in; protective contact with school pastoral; avoid linking to mum unless Jordan opens it",
        owner: "staff_chervelle",
        timeframe: "Same day",
      },
      {
        warningSign: "Distress directly linked to contact call",
        action: "Pause future calls until SW review; debrief with Anna; ensure father-contact dynamics not bleeding in",
        owner: "staff_anna",
        timeframe: "Within 24h",
      },
    ],
    homeSpecificMitigations: [
      "Post is opened by staff first while mum's release process is active",
      "TV news channels avoided during shared time if mum's case was reported locally",
      "Football kit kept ready — protective routine, never used as leverage",
      "Bedroom door policy unchanged — not raised with Jordan unless he raises it",
    ],
    staffingAdjustments:
      "Anna and Darren cover the week of mum's release. Agency staff briefed to defer any contact-related questions to Anna. Handovers extended by 15 minutes during this period to maintain continuity.",
    childActionsAgreed: [
      "Tell a trusted adult if I'm thinking about mum and feeling worried",
      "Use the calm-down toolkit before bed if I can't settle",
      "Keep going to football even on tricky weeks — staff will help",
    ],
    reviewedDate: d(-14),
    reviewedBy: "staff_darren",
    nextReviewDate: d(16),
    signedOffByLA: true,
    interventionsDeployedHistory: [
      {
        date: d(-90),
        intervention: "Pre-contact support routine introduced for paternal contact",
        outcome: "Anxiety reduced; Jordan now uses coping strategies independently most weeks",
      },
      {
        date: d(-30),
        intervention: "Coordinated comms plan agreed with SW for mum's release",
        outcome: "Working — Jordan hearing one update at a time and digesting well so far",
      },
      {
        date: d(-7),
        intervention: "Solicitor letter intercepted; calm conversation held with Jordan",
        outcome: "Initial spike in questioning, settled within 48h with Anna's support",
      },
    ],
  },
  {
    id: "ddp_casey",
    youngPerson: "yp_casey",
    planDate: d(-30),
    riskOfDisruptionLevel: "Low",
    keyStabilityFactors: [
      "310 days in placement — strong stability history",
      "Thriving at college — protective routine and identity factor",
      "Close attachment to key worker Chervelle",
      "Engaged CAMHS support and family relationship",
      "Developing independence skills — sense of forward momentum",
    ],
    warningSignsToWatchFor: [
      "Sleep difficulties worsening or insomnia returning",
      "Withdrawal from art portfolio work or college absences",
      "Anxiety spikes around transition planning conversations",
      "Reduced food intake or appetite changes",
      "Increased reassurance-seeking from staff",
    ],
    recentTriggers: [
      "Approaching transition planning milestone (semi-independence pathway)",
      "CAMHS therapist on extended leave — interim cover only",
    ],
    proactiveActionsInPlace: [
      "Sleep hygiene plan agreed and embedded — followed nightly",
      "College tutor liaison every 4 weeks — strong rapport already",
      "Transition planning paced to Casey's lead — no fixed timeline pressure",
      "Mother included in monthly care plan reviews",
      "Art studio space at home protected — creative outlet maintained",
    ],
    supportNetworkInPlace: [
      "Key Worker: Chervelle",
      "Co-Key Worker: Anna",
      "Social Worker: Lisa Park (LA)",
      "IRO: Helen Brown",
      "CAMHS: Dr Reeves (interim cover)",
      "College tutor: Ms Hartley",
      "Mother (positive engaged contact)",
    ],
    childAwareOfPlan: true,
    childContribution:
      "Casey reviewed and signed the plan with Chervelle. Asked for the line about 'pacing transition to my lead' to be highlighted. Said 'I want to be ready, not rushed.' Suggested the art studio mitigation themselves.",
    familyInvolvement:
      "Mother is engaged in monthly reviews and is supportive of the pace. Mother to flag any concerns from weekend contact directly to Chervelle.",
    professionalsInvolved: [
      "Social Worker — Lisa Park",
      "IRO — Helen Brown",
      "CAMHS — Dr Reeves (interim)",
      "College tutor — Ms Hartley",
      "GP — Dr Khan",
      "Independence pathway worker — to be allocated",
    ],
    specialActionsIfWarningSignsAppear: [
      {
        warningSign: "Two nights of disrupted sleep in a row",
        action: "Reinforce sleep hygiene plan; offer chamomile/quiet time; flag to CAMHS interim if 4+ nights",
        owner: "staff_chervelle",
        timeframe: "Same night",
      },
      {
        warningSign: "College absence not explained by illness",
        action: "Gentle check-in same evening; tutor liaison if 2+ days; never frame as failure",
        owner: "staff_chervelle",
        timeframe: "Same day",
      },
      {
        warningSign: "Distress linked to transition conversation",
        action: "Pause transition planning; reassure timeline is Casey-led; key work session focused on grounding",
        owner: "staff_anna",
        timeframe: "Within 24h",
      },
      {
        warningSign: "Reduced appetite over 3+ days",
        action: "GP appointment booked; CAMHS informed; mother gently informed via Lisa (SW)",
        owner: "staff_darren",
        timeframe: "Within 72h",
      },
    ],
    homeSpecificMitigations: [
      "Vegetarian menu options always available — agency added",
      "Art supplies budget protected in monthly spend",
      "Quiet hours respected — Casey's room is a sanctuary",
      "No surprise visitors — Casey notified in advance of any new professional",
    ],
    staffingAdjustments:
      "Chervelle's key-work shifts protected through transition planning period. Any new staff briefed by Chervelle before lone-working with Casey. CAMHS interim cover gap mitigated by extra weekly key work session.",
    childActionsAgreed: [
      "Tell Chervelle if I'm not sleeping or eating properly",
      "Use the art studio when I'm overwhelmed",
      "Keep going to college — say if I need a break, we'll plan it together",
    ],
    reviewedDate: d(-30),
    reviewedBy: "staff_darren",
    nextReviewDate: d(60),
    signedOffByLA: true,
    interventionsDeployedHistory: [
      {
        date: d(-180),
        intervention: "CAMHS referral activated for anxiety management",
        outcome: "Significant improvement in coping strategies and self-awareness",
      },
      {
        date: d(-90),
        intervention: "Sleep hygiene plan introduced",
        outcome: "Sleep improved markedly; Casey owns the routine independently",
      },
    ],
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function PlacementDisruptionPreventionPlanPage() {
  const [records] = useState<DisruptionPlan[]>(SEED);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("risk");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.youngPerson).toLowerCase().includes(q) ||
          r.keyStabilityFactors.some((s) => s.toLowerCase().includes(q)) ||
          r.warningSignsToWatchFor.some((s) => s.toLowerCase().includes(q)) ||
          r.proactiveActionsInPlace.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (riskFilter !== "all") {
      list = list.filter((r) => r.riskOfDisruptionLevel === riskFilter);
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "risk":
          return (
            RISK_LEVELS.indexOf(b.riskOfDisruptionLevel) -
            RISK_LEVELS.indexOf(a.riskOfDisruptionLevel)
          );
        case "review":
          return a.nextReviewDate.localeCompare(b.nextReviewDate);
        case "name":
          return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        default:
          return 0;
      }
    });
    return list;
  }, [records, search, riskFilter, sortBy]);

  // Summary stats
  const activePlans = records.length;
  const heightenedOrAcute = records.filter(
    (r) => r.riskOfDisruptionLevel === "Heightened" || r.riskOfDisruptionLevel === "Acute"
  ).length;
  const todayIso = new Date().toISOString().slice(0, 10);
  const reviewsDue30 = records.filter((r) => {
    const nr = new Date(r.nextReviewDate);
    const today = new Date(todayIso);
    const diff = (nr.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  }).length;
  const allInterventions = records.flatMap((r) => r.interventionsDeployedHistory);
  const successfulInterventions = allInterventions.filter((i) =>
    /improv|recover|reduced|stable|working|signific|markedly/i.test(i.outcome)
  ).length;
  const successRate =
    allInterventions.length > 0
      ? Math.round((successfulInterventions / allInterventions.length) * 100)
      : 0;

  const exportCols: ExportColumn<DisruptionPlan>[] = [
    { header: "Young Person", accessor: (r: DisruptionPlan) => getYPName(r.youngPerson) },
    { header: "Plan Date", accessor: (r: DisruptionPlan) => r.planDate },
    { header: "Risk Level", accessor: (r: DisruptionPlan) => r.riskOfDisruptionLevel },
    { header: "Key Stability Factors", accessor: (r: DisruptionPlan) => r.keyStabilityFactors.join("; ") },
    { header: "Warning Signs", accessor: (r: DisruptionPlan) => r.warningSignsToWatchFor.join("; ") },
    { header: "Recent Triggers", accessor: (r: DisruptionPlan) => r.recentTriggers.join("; ") },
    { header: "Proactive Actions", accessor: (r: DisruptionPlan) => r.proactiveActionsInPlace.join("; ") },
    { header: "Support Network", accessor: (r: DisruptionPlan) => r.supportNetworkInPlace.join("; ") },
    { header: "Child Aware", accessor: (r: DisruptionPlan) => (r.childAwareOfPlan ? "Yes" : "No") },
    { header: "Child Contribution", accessor: (r: DisruptionPlan) => r.childContribution },
    { header: "Family Involvement", accessor: (r: DisruptionPlan) => r.familyInvolvement },
    { header: "Professionals Involved", accessor: (r: DisruptionPlan) => r.professionalsInvolved.join("; ") },
    {
      header: "Warning-Sign Actions",
      accessor: (r: DisruptionPlan) =>
        r.specialActionsIfWarningSignsAppear
          .map((a) => `${a.warningSign} -> ${a.action} (owner: ${getStaffName(a.owner)}, ${a.timeframe})`)
          .join("; "),
    },
    { header: "Home-Specific Mitigations", accessor: (r: DisruptionPlan) => r.homeSpecificMitigations.join("; ") },
    { header: "Staffing Adjustments", accessor: (r: DisruptionPlan) => r.staffingAdjustments },
    { header: "Child Actions Agreed", accessor: (r: DisruptionPlan) => r.childActionsAgreed.join("; ") },
    { header: "Reviewed Date", accessor: (r: DisruptionPlan) => r.reviewedDate },
    { header: "Reviewed By", accessor: (r: DisruptionPlan) => getStaffName(r.reviewedBy) },
    { header: "Next Review", accessor: (r: DisruptionPlan) => r.nextReviewDate },
    { header: "Signed Off by LA", accessor: (r: DisruptionPlan) => (r.signedOffByLA ? "Yes" : "No") },
    {
      header: "Interventions History",
      accessor: (r: DisruptionPlan) =>
        r.interventionsDeployedHistory
          .map((i) => `${i.date}: ${i.intervention} -> ${i.outcome}`)
          .join("; "),
    },
  ];

  return (
    <PageShell
      title="Placement Disruption Prevention Plan"
      subtitle="Per-child proactive plans to prevent placement breakdown when warning signs emerge"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Placement Disruption Prevention Plans" />
          <ExportButton data={filtered} columns={exportCols} filename="disruption-prevention-plans" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Children with Active Plans", value: activePlans, icon: ShieldAlert, colour: "text-blue-600" },
            {
              label: "Heightened / Acute Risk",
              value: heightenedOrAcute,
              icon: AlertTriangle,
              colour: heightenedOrAcute > 0 ? "text-red-600" : "text-green-600",
            },
            { label: "Reviews Due (30d)", value: reviewsDue30, icon: Calendar, colour: "text-amber-600" },
            { label: "Intervention Success Rate", value: `${successRate}%`, icon: TrendingUp, colour: "text-green-600" },
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

        {/* ── filters / sort ─────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search young people, factors, warning signs…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Building">Building</SelectItem>
                <SelectItem value="Heightened">Heightened</SelectItem>
                <SelectItem value="Acute">Acute</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="risk">Risk Level</SelectItem>
                <SelectItem value="review">Next Review Date</SelectItem>
                <SelectItem value="name">Young Person</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── cards ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((rec) => {
            const isExpanded = expandedId === rec.id;
            return (
              <div key={rec.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <ShieldAlert
                      className={cn(
                        "h-5 w-5 shrink-0",
                        rec.riskOfDisruptionLevel === "Low"
                          ? "text-green-600"
                          : rec.riskOfDisruptionLevel === "Building"
                          ? "text-yellow-600"
                          : rec.riskOfDisruptionLevel === "Heightened"
                          ? "text-orange-600"
                          : "text-red-600"
                      )}
                    />
                    <div className="min-w-0">
                      <p className="font-medium">{getYPName(rec.youngPerson)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Plan dated {rec.planDate} · Reviewed by {getStaffName(rec.reviewedBy)} · Next review {rec.nextReviewDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rec.signedOffByLA && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <FileSignature className="h-3 w-3" /> LA signed
                      </Badge>
                    )}
                    <Badge className={cn("text-xs", RISK_COLORS[rec.riskOfDisruptionLevel])}>
                      {rec.riskOfDisruptionLevel}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* meta */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Plan Date:</span> <span className="font-medium">{rec.planDate}</span></div>
                      <div><span className="text-muted-foreground">Reviewed:</span> <span className="font-medium">{rec.reviewedDate}</span></div>
                      <div><span className="text-muted-foreground">Reviewed By:</span> <span className="font-medium">{getStaffName(rec.reviewedBy)}</span></div>
                      <div><span className="text-muted-foreground">Next Review:</span> <span className="font-medium">{rec.nextReviewDate}</span></div>
                    </div>

                    {/* stability + warning signs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <Heart className="h-4 w-4 text-green-700" />
                          <p className="text-xs font-medium text-green-700">Key Stability Factors</p>
                        </div>
                        <ul className="space-y-1">
                          {rec.keyStabilityFactors.map((s, i) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <Eye className="h-4 w-4 text-orange-700" />
                          <p className="text-xs font-medium text-orange-700">Warning Signs to Watch For</p>
                        </div>
                        <ul className="space-y-1">
                          {rec.warningSignsToWatchFor.map((s, i) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <AlertTriangle className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* recent triggers + proactive actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <Activity className="h-4 w-4 text-yellow-700" />
                          <p className="text-xs font-medium text-yellow-700">Recent Triggers</p>
                        </div>
                        <ul className="space-y-1">
                          {rec.recentTriggers.map((t, i) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <span className="mt-1.5 h-1 w-1 rounded-full bg-yellow-700 shrink-0" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <Target className="h-4 w-4 text-blue-700" />
                          <p className="text-xs font-medium text-blue-700">Proactive Actions in Place</p>
                        </div>
                        <ul className="space-y-1">
                          {rec.proactiveActionsInPlace.map((a, i) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <CheckCircle2 className="h-3 w-3 text-blue-600 mt-0.5 shrink-0" />
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* warning-sign action plan */}
                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        <ShieldAlert className="h-4 w-4 text-red-700" />
                        <p className="text-sm font-medium">Special Actions if Warning Signs Appear</p>
                      </div>
                      <div className="space-y-2">
                        {rec.specialActionsIfWarningSignsAppear.map((wa, i) => (
                          <div key={i} className="rounded-lg border bg-white p-3 text-sm">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                              <div className="flex-1">
                                <p className="font-medium">{wa.warningSign}</p>
                                <p className="text-muted-foreground mt-1">{wa.action}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    <UserCheck className="h-3 w-3" /> {getStaffName(wa.owner)}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {wa.timeframe}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* support network + professionals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-white border p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <Users className="h-4 w-4 text-slate-700" />
                          <p className="text-xs font-medium text-slate-700">Support Network</p>
                        </div>
                        <ul className="space-y-1">
                          {rec.supportNetworkInPlace.map((s, i) => (
                            <li key={i} className="text-sm text-slate-700">{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-white border p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <UserCheck className="h-4 w-4 text-slate-700" />
                          <p className="text-xs font-medium text-slate-700">Professionals Involved</p>
                        </div>
                        <ul className="space-y-1">
                          {rec.professionalsInvolved.map((p, i) => (
                            <li key={i} className="text-sm text-slate-700">{p}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* child + family involvement */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <Heart className="h-4 w-4 text-pink-700" />
                          <p className="text-xs font-medium text-pink-700">Child's Voice & Contribution</p>
                        </div>
                        <p className="text-sm">
                          <Badge variant="outline" className="text-xs mr-2">
                            {rec.childAwareOfPlan ? "Aware of plan" : "Not yet shared"}
                          </Badge>
                        </p>
                        <p className="text-sm mt-2">{rec.childContribution}</p>
                        {rec.childActionsAgreed.length > 0 && (
                          <>
                            <p className="text-xs font-medium text-pink-700 mt-3 mb-1">Actions Child Agreed</p>
                            <ul className="space-y-1">
                              {rec.childActionsAgreed.map((c, i) => (
                                <li key={i} className="flex items-start gap-1 text-sm">
                                  <CheckCircle2 className="h-3 w-3 text-pink-600 mt-0.5 shrink-0" />
                                  <span>{c}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <Users className="h-4 w-4 text-purple-700" />
                          <p className="text-xs font-medium text-purple-700">Family Involvement</p>
                        </div>
                        <p className="text-sm">{rec.familyInvolvement}</p>
                      </div>
                    </div>

                    {/* home-specific mitigations + staffing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-white border p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <Wrench className="h-4 w-4 text-slate-700" />
                          <p className="text-xs font-medium text-slate-700">Home-Specific Mitigations</p>
                        </div>
                        <ul className="space-y-1">
                          {rec.homeSpecificMitigations.map((m, i) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <span className="mt-1.5 h-1 w-1 rounded-full bg-slate-700 shrink-0" />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-white border p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <UserCheck className="h-4 w-4 text-slate-700" />
                          <p className="text-xs font-medium text-slate-700">Staffing Adjustments</p>
                        </div>
                        <p className="text-sm">{rec.staffingAdjustments}</p>
                      </div>
                    </div>

                    {/* interventions history */}
                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        <Activity className="h-4 w-4 text-slate-700" />
                        <p className="text-sm font-medium">Interventions Deployed History</p>
                      </div>
                      <div className="space-y-2">
                        {rec.interventionsDeployedHistory.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-lg border bg-white p-2.5 text-sm">
                            <Badge variant="outline" className="text-xs shrink-0">{h.date}</Badge>
                            <div className="min-w-0">
                              <p className="font-medium">{h.intervention}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Outcome: {h.outcome}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* sign-off */}
                    <div className="rounded-lg bg-slate-100 border p-3 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <FileSignature className="h-4 w-4 text-slate-700" />
                        <span className="text-muted-foreground">Local Authority sign-off:</span>
                        <Badge className={cn("text-xs", rec.signedOffByLA ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700")}>
                          {rec.signedOffByLA ? "Signed" : "Pending"}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Reviewed {rec.reviewedDate} by {getStaffName(rec.reviewedBy)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Quality Standard 4 (Enjoyment & Achievement) and Reg 5:</strong> Children must experience
          stable placements that meet their needs. Per-child disruption prevention plans demonstrate the home's
          proactive, anticipatory approach to placement stability — identifying warning signs early, agreeing
          actions in advance, involving the child in planning, and coordinating with the placing authority,
          family, and external professionals. Plans are reviewed regularly and updated as triggers, warning
          signs, or stability factors change.
        </div>
      </div>
    </PageShell>
  );
}
