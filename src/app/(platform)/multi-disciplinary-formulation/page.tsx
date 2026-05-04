"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Brain,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Users,
  Layers,
  Info,
  CalendarClock,
  Shield,
  Lightbulb,
  ClipboardList,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type FormulationModel =
  | "5Ps"
  | "Cognitive Behavioural"
  | "Attachment-based"
  | "Trauma-informed"
  | "Systemic"
  | "Integrated";

interface Formulation {
  id: string;
  youngPerson: string;
  version: number;
  formulationDate: string;
  modelUsed: FormulationModel;
  participantsAttended: string[];
  presentingDifficulties: string[];
  predisposing: string[];
  precipitating: string[];
  perpetuating: string[];
  protective: string[];
  keyHypotheses: string[];
  agreedInterventions: string[];
  riskFactors: string[];
  childContribution: string;
  nextReviewDate: string;
  internalLead: string;
  shareableSummary: string;
  confidentialNotes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const MODEL_COLOURS: Record<FormulationModel, string> = {
  "5Ps": "bg-blue-100 text-blue-800",
  "Cognitive Behavioural": "bg-indigo-100 text-indigo-800",
  "Attachment-based": "bg-pink-100 text-pink-800",
  "Trauma-informed": "bg-purple-100 text-purple-800",
  "Systemic": "bg-emerald-100 text-emerald-800",
  "Integrated": "bg-amber-100 text-amber-800",
};

/* ── seed ──────────────────────────────────────────────────────────────── */

const SEED: Formulation[] = [
  {
    id: "form_alex",
    youngPerson: "yp_alex",
    version: 3,
    formulationDate: d(-28),
    modelUsed: "5Ps",
    participantsAttended: [
      "CAMHS Psychologist Dr Patel",
      "ADHD Nurse Specialist Helen Marsh",
      "Social Worker Linda Carter",
      "College SENCO Marcus Webb",
      "staff_anna",
      "staff_darren",
    ],
    presentingDifficulties: [
      "Emotional dysregulation following perceived rejection (especially around birth father contact)",
      "Avoidant coping — withdraws under stress and dismisses praise",
      "Sleep disturbance and rumination at night",
      "Difficulty sustaining attention in college without scaffolding",
      "Episodes of low mood preceding placement transitions",
    ],
    predisposing: [
      "Early relational trauma — neglect identified age 6, inconsistent maternal care due to substance use",
      "Diagnosed ADHD (combined presentation) with executive functioning impact",
      "Three foster placement disruptions (age 12–15) reinforcing rejection schema",
      "Father's repeated DNAs reinforcing 'I am not worth showing up for' narrative",
      "Genetic loading — maternal family history of ADHD and depression",
    ],
    precipitating: [
      "Pending move to semi-independent living within 6 months",
      "Recent missed contact with birth father (third in succession)",
      "End of college term and loss of routine",
      "Conflict with peer at the home over shared space",
    ],
    perpetuating: [
      "Avoidant coping style prevents help-seeking and reinforces isolation",
      "Sleep deficit amplifies emotional reactivity and reduces ADHD compensation",
      "Inconsistent paternal contact pattern keeps hope-then-loss cycle alive",
      "Self-narrative of 'I cope alone' blocks acceptance of support",
      "Stimulant medication adherence variable at weekends",
    ],
    protective: [
      "Strong, consistent relationship with key worker Anna (8+ months)",
      "Engagement with college and clear vocational ambition (motor mechanics)",
      "Improving relationship with birth mum — weekly calls now consistent",
      "Intelligence and emerging self-awareness — can name some patterns",
      "Stable placement at Oak House since September 2024",
      "Positive peer friendship with another resident",
    ],
    keyHypotheses: [
      "Avoidant attachment strategies, learned in early childhood, are activated by anticipated transitions and contact disruptions — presenting as withdrawal rather than overt distress.",
      "ADHD-related executive dysfunction reduces Alex's capacity to plan around emotional triggers, particularly when sleep-deprived; this compounds the avoidant pattern.",
      "The 'I cope alone' narrative is functional in the short term but increases risk during the upcoming transition to semi-independence.",
      "Behavioural changes around father's contact are best understood as a relational injury response, not as 'oppositional' behaviour.",
    ],
    agreedInterventions: [
      "Continue DDP-informed keywork with Anna; prioritise consistency over depth",
      "CAMHS to offer 8 sessions of trauma-focused CBT, beginning with psychoeducation about avoidant coping",
      "ADHD nurse to review medication adherence and weekend planning with Alex",
      "Phased transition plan to semi-independence over 6 months — maintained Oak House contact post-move",
      "College SENCO to extend in-class support through end of academic year",
      "Social worker to facilitate honest conversation with father re: contact reliability — clarify rather than continue cycle",
      "Sleep hygiene plan led by keyworker; review in 4 weeks",
    ],
    riskFactors: [
      "Risk of placement self-sabotage as transition approaches (historic pattern)",
      "Low mood may deepen if paternal contact ends without resolution",
      "Vulnerability post-transition due to reduced staff scaffolding",
      "Risk of disengagement from college if support reduces too quickly",
    ],
    childContribution:
      "Alex attended the second half of the meeting with Anna present. Alex said: 'I just want people to stop making a big deal out of stuff. I'm fine, I just need things to be steady.' Alex agreed the avoidant pattern description 'sounds about right' and was open to CBT 'as long as it's not all feelings, all the time.' Alex asked that the move plan be written down so they can see it.",
    nextReviewDate: d(62),
    internalLead: "staff_anna",
    shareableSummary:
      "Alex is dealing with a lot of changes coming up. The team agreed Alex copes by going quiet rather than asking for help, and that's understandable given Alex's experiences. The plan is steady support from Anna, some sessions with Dr Patel, a clear written plan for the move, and a check-in with Alex's college. Alex's strengths — being smart, working hard at college, and the trust built with Anna — are the foundation we're building on.",
    confidentialNotes:
      "Dr Patel raised diagnostic question of emerging EUPD traits secondary to attachment trauma — agreed not to pursue formal assessment at this stage given Alex's age and active developmental change. Revisit if presentation persists post-transition. Father's pattern may warrant safeguarding consideration if it continues to destabilise Alex.",
  },
  {
    id: "form_jordan",
    youngPerson: "yp_jordan",
    version: 2,
    formulationDate: d(-14),
    modelUsed: "5Ps",
    participantsAttended: [
      "CAMHS Therapist Dr Shah",
      "Contextual Safeguarding Lead DS James Okafor",
      "Social Worker Priya Anand",
      "School Pastoral Lead Rachel Owen",
      "Art Therapist Naomi Brooks",
      "staff_ryan",
      "staff_darren",
    ],
    presentingDifficulties: [
      "Going-missing episodes (3 in last 6 weeks) returning with unexplained items",
      "Freeze response and brief dissociation when adults raise voices",
      "Hypervigilance disrupting sleep and daytime functioning",
      "Approach-avoidance pattern with key worker — distress when close, distress when distant",
      "Academic engagement dropping despite strong art-based work",
    ],
    predisposing: [
      "Exposure to domestic violence between birth parents (age 0–5)",
      "Disorganised attachment pattern documented in earlier CAMHS work",
      "Multiple placement moves (foster x2, residential x2) since age 11",
      "Separation from older brother Tyler — only consistent attachment figure",
      "Sensory sensitivities and likely undiagnosed ADHD (referral pending)",
    ],
    precipitating: [
      "Two new peer relationships outside the home of safeguarding concern",
      "Contextual mapping has identified hotspot near previous foster placement Jordan visits",
      "Scheduled court date for parents' family proceedings — re-exposure to history",
      "Loss of art teacher at school (last term)",
    ],
    perpetuating: [
      "Going-missing provides regulation function — escape from arousal — reinforced by peer attention outside home",
      "Hypervigilance prevents the rest needed to recover from arousal",
      "Limited verbal access to feelings — under-developed emotional vocabulary",
      "Adults' (understandable) anxious responses to going-missing reinforce the cycle",
      "Phone access enables contact with concerning peers between episodes",
    ],
    protective: [
      "Strong sibling bond with Tyler — weekly video contact",
      "Engagement with art therapy (Naomi) — non-verbal processing route",
      "Developing trust with key worker Chervelle and deputy Ryan",
      "Calm, predictable home environment at Oak House",
      "School pastoral relationship with Rachel Owen",
      "Self-awareness that 'something happens' when arousal builds",
    ],
    keyHypotheses: [
      "Going-missing episodes are best understood as trauma-driven escape responses combined with developmentally-appropriate seeking of belonging — not as 'risky behaviour' in isolation.",
      "Disorganised attachment means closeness with caregivers itself triggers arousal; intervention must build tolerance gradually rather than push connection.",
      "Concerning peer group offers identity and predictable arousal-discharge cycle that the home cannot match without recognising this function.",
      "Court date is a foreseeable trigger — proactive scaffolding required in surrounding weeks.",
    ],
    agreedInterventions: [
      "Contextual safeguarding plan — joint working with DS Okafor, mapping reviewed monthly",
      "Continue weekly art therapy; Naomi to share non-identifying themes with team for context",
      "CAMHS to begin sensorimotor stabilisation work — body-based regulation before any narrative work",
      "Predictable handover routine and 'check-in/check-out' rhythm with Chervelle/Ryan",
      "Tyler video contact to be protected during court proceedings — additional call scheduled",
      "Phone use plan agreed with Jordan — not punitive, framed as 'support to stay safer'",
      "School to maintain pastoral consistency; cover teacher briefed on Jordan's needs",
      "ADHD/sensory assessment referral to be progressed by SW",
    ],
    riskFactors: [
      "Child sexual exploitation indicators on contextual mapping — active concern",
      "Risk of escalation around court date",
      "Self-injury risk if dissociative episodes increase",
      "Placement stability — Jordan may experience increased contact with police as rejection",
      "Online/peer-led grooming risk via phone",
    ],
    childContribution:
      "Jordan did not attend the meeting. Naomi shared (with consent) that recent art has shown a recurring 'small figure looking up at a doorway' image. Jordan told Chervelle the day before: 'I don't want a meeting about me. Just tell people not to shout, and to leave Tyler alone.' Both messages were brought into the formulation explicitly.",
    nextReviewDate: d(28),
    internalLead: "staff_ryan",
    shareableSummary:
      "Jordan has had a tough few weeks and the team came together to understand what's happening. We agreed that when Jordan goes missing, it's not naughtiness — it's Jordan's body trying to feel safe. We're going to keep things calm and predictable at home, keep art therapy going, make sure Jordan gets to talk to Tyler, and work closely with police and school to keep Jordan safer. The plan is gentle and slow — we're not going to force big conversations.",
    confidentialNotes:
      "DS Okafor flagged two named adults of safeguarding concern — details held on contextual safeguarding plan, not in this record. Discussion held with SW about whether court attendance is in Jordan's interest — agreed Jordan should be supported NOT to attend; SW to communicate to legal team. Disclosure to staff team on need-to-know basis only.",
  },
  {
    id: "form_casey",
    youngPerson: "yp_casey",
    version: 4,
    formulationDate: d(-7),
    modelUsed: "5Ps",
    participantsAttended: [
      "CAMHS ASD Pathway Dr Lin Chen",
      "Speech & Language Therapist Aisha Bello",
      "Educational Psychologist Dr Tom Hartley",
      "Social Worker Melanie Hughes",
      "School SENCO Joanna Pike",
      "staff_anna",
      "staff_darren",
    ],
    presentingDifficulties: [
      "Heightened separation distress when key worker Anna ends shift",
      "Meltdowns triggered by unexpected change to routine",
      "Difficulty sustaining peer interactions beyond 1:1 structured activity",
      "Comfort-eating and regression after family contact",
      "Sleep onset difficulty — multiple bedtime requests",
    ],
    predisposing: [
      "Confirmed Autism Spectrum Disorder (level 1) and possible PDA profile",
      "Mother's postnatal depression — inconsistent early caregiving (age 0–2)",
      "Anxious-ambivalent attachment pattern documented",
      "Sensory processing differences (hyperresponsive auditory, hyporesponsive proprioceptive)",
      "Communication profile — receptive language stronger than expressive under stress",
    ],
    precipitating: [
      "Reunification planning meeting last month — change in trajectory",
      "School trip planned next month — anxiety about overnight stay",
      "Anna's annual leave due in 3 weeks",
      "Recent change of bus route to school",
    ],
    perpetuating: [
      "Reinforcement loop where heightened distress reliably elicits attention — not blame, this is the learned pattern",
      "Sole reliance on Anna risks overload and limits Casey's secure-base diversification",
      "Sensory load at school amplifies dysregulation by the time Casey returns home",
      "Mum's variable attention during contact reactivates the original ambivalent pattern",
      "Lack of visual structure for unfamiliar transitions",
    ],
    protective: [
      "Consistent, warm relationship with maternal grandmother Margaret (weekly call without fail)",
      "Strong bond with Anna and emerging trust with Edward",
      "School SENCO and 1:1 TA in place — trusted relationships",
      "Clear ASD diagnosis and adapted communication strategies in use",
      "Mum engaged in parenting support and contact going better",
      "Casey's articulate self-advocacy when calm — can name many needs",
    ],
    keyHypotheses: [
      "Casey's presentation is best understood through an integrated lens: ASD shapes the threshold and the recovery, attachment shapes the meaning Casey makes of separations, and current life events provide the triggers.",
      "The 'meltdown around transitions' pattern is sensory and predictability driven, not relational — but the recovery is relational.",
      "Reunification is therapeutically appropriate but the 6-month transition period must account for both attachment AND autism needs.",
      "Casey's reliance on Anna is a strength to broaden, not a problem to remove.",
    ],
    agreedInterventions: [
      "Visual transition planner co-produced with Casey for all known upcoming changes",
      "Phased introduction of Edward as second secure-base figure (currently 4 hrs/week, increasing)",
      "SaLT-supported 'feelings vocabulary' work — 6 sessions",
      "Sensory diet integrated into evening routine (proprioceptive activities before homework)",
      "Pre- and post-contact regulation routine with Anna or duty key worker",
      "School trip preparation pack (visual schedule, photo of accommodation, comfort item plan)",
      "Anna's leave to be planned in detail with Casey 2 weeks ahead — written 'when Anna's back' calendar",
      "Reunification transition plan sequenced with Mum's parenting support — 6-month window",
    ],
    riskFactors: [
      "Risk of autistic burnout if reunification pace is too fast",
      "Mum's mental health — relapse would be highly destabilising; safety net plan needed",
      "Comfort eating contributing to weight gain — health implications",
      "Vulnerability to exploitative relationships in adolescence (attachment seeking)",
      "Loss of Oak House structure post-reunification",
    ],
    childContribution:
      "Casey attended the first 20 minutes with Anna. Casey brought a written list and read it: 'Things I want — gran to keep calling me. Anna to come back from holiday. To know about the school trip. To go home but not too fast. To still come and see Anna after.' All five points were incorporated into the plan. Casey left the room when professionals introduced themselves — this was anticipated and respected.",
    nextReviewDate: d(56),
    internalLead: "staff_anna",
    shareableSummary:
      "Casey, you wrote down five things you wanted and the team listened. Gran will keep calling on Wednesdays. We've got a plan for when Anna goes on holiday — Anna will help you make a calendar so you know exactly when she's back. Edward will spend a bit more time with you so there's another grown-up at Oak House you know really well. We're getting a special pack ready for the school trip with photos. Going home to Mum is going to happen step-by-step over six months, and you'll still see us at Oak House after. You did really well bringing your list.",
    confidentialNotes:
      "Dr Chen noted possible PDA profile — recommended further observation rather than additional diagnostic label at this stage. SW to maintain contingency plan for Mum's mental health (escalation pathway agreed with adult mental health). Health concerns re: weight to be addressed sensitively via routine LAC health review, not as standalone intervention.",
  },
];

/* ── flat row for export ───────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string;
  version: number;
  formulationDate: string;
  modelUsed: string;
  participants: string;
  presentingDifficulties: string;
  predisposing: string;
  precipitating: string;
  perpetuating: string;
  protective: string;
  keyHypotheses: string;
  agreedInterventions: string;
  riskFactors: string;
  childContribution: string;
  internalLead: string;
  nextReviewDate: string;
  shareableSummary: string;
}

const renderParticipant = (p: string) =>
  p.startsWith("staff_") ? getStaffName(p) : p;

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Young Person", accessor: (r: FlatRow) => r.youngPerson },
  { header: "Version", accessor: (r: FlatRow) => r.version },
  { header: "Formulation Date", accessor: (r: FlatRow) => r.formulationDate },
  { header: "Model Used", accessor: (r: FlatRow) => r.modelUsed },
  { header: "Participants", accessor: (r: FlatRow) => r.participants },
  { header: "Presenting Difficulties", accessor: (r: FlatRow) => r.presentingDifficulties },
  { header: "Predisposing", accessor: (r: FlatRow) => r.predisposing },
  { header: "Precipitating", accessor: (r: FlatRow) => r.precipitating },
  { header: "Perpetuating", accessor: (r: FlatRow) => r.perpetuating },
  { header: "Protective", accessor: (r: FlatRow) => r.protective },
  { header: "Key Hypotheses", accessor: (r: FlatRow) => r.keyHypotheses },
  { header: "Agreed Interventions", accessor: (r: FlatRow) => r.agreedInterventions },
  { header: "Risk Factors", accessor: (r: FlatRow) => r.riskFactors },
  { header: "Child Contribution", accessor: (r: FlatRow) => r.childContribution },
  { header: "Internal Lead", accessor: (r: FlatRow) => r.internalLead },
  { header: "Next Review", accessor: (r: FlatRow) => r.nextReviewDate },
  { header: "Shareable Summary", accessor: (r: FlatRow) => r.shareableSummary },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function MultiDisciplinaryFormulationPage() {
  const [data] = useState<Formulation[]>(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterModel, setFilterModel] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const active = data.length;
    const reviewDue = data.filter((f) => f.nextReviewDate <= d(30)).length;
    const avgParticipants =
      data.length === 0
        ? 0
        : Math.round(
            (data.reduce((s, f) => s + f.participantsAttended.length, 0) /
              data.length) *
              10,
          ) / 10;
    const modelsUsed = new Set(data.map((f) => f.modelUsed)).size;
    return { active, reviewDue, avgParticipants, modelsUsed };
  }, [data]);

  /* ── filter / sort ────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          getYPName(f.youngPerson).toLowerCase().includes(q) ||
          f.modelUsed.toLowerCase().includes(q) ||
          f.keyHypotheses.some((h) => h.toLowerCase().includes(q)),
      );
    }
    if (filterModel !== "all") list = list.filter((f) => f.modelUsed === filterModel);
    const out = [...list];
    switch (sortBy) {
      case "name":
        out.sort((a, b) =>
          getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson)),
        );
        break;
      case "date":
        out.sort((a, b) => b.formulationDate.localeCompare(a.formulationDate));
        break;
      case "review":
        out.sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate));
        break;
    }
    return out;
  }, [data, search, filterModel, sortBy]);

  /* ── export ───────────────────────────────────────────────────────── */
  const exportData = useMemo<FlatRow[]>(
    () =>
      data.map((f) => ({
        youngPerson: getYPName(f.youngPerson),
        version: f.version,
        formulationDate: f.formulationDate,
        modelUsed: f.modelUsed,
        participants: f.participantsAttended.map(renderParticipant).join("; "),
        presentingDifficulties: f.presentingDifficulties.join("; "),
        predisposing: f.predisposing.join("; "),
        precipitating: f.precipitating.join("; "),
        perpetuating: f.perpetuating.join("; "),
        protective: f.protective.join("; "),
        keyHypotheses: f.keyHypotheses.join("; "),
        agreedInterventions: f.agreedInterventions.join("; "),
        riskFactors: f.riskFactors.join("; "),
        childContribution: f.childContribution,
        internalLead: getStaffName(f.internalLead),
        nextReviewDate: f.nextReviewDate,
        shareableSummary: f.shareableSummary,
      })),
    [data],
  );

  return (
    <PageShell
      title="Multi-Disciplinary Formulation"
      subtitle="Collaborative psychological case formulation across CAMHS, social work, education and home staff — aligned with NICE and BPS principles"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Multi-Disciplinary Formulation" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="multi-disciplinary-formulation" />
        </div>
      }
    >
      {/* ── info banner ─────────────────────────────────────────────── */}
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-900">
          <strong>A formulation is a working hypothesis, not a diagnosis.</strong>{" "}
          It is the team&apos;s best shared understanding of why this child is
          presenting in this way, at this time, and what is most likely to help.
          It must be revisited regularly, updated as the child develops, and
          held lightly — held with confidence enough to act, lightly enough to
          revise as new information arrives. The child&apos;s own contribution is
          central, not optional.
        </div>
      </div>

      {/* ── stat strip ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Active Formulations",
            value: stats.active,
            icon: Brain,
            colour: "text-blue-600",
          },
          {
            label: "Review Due (30 d)",
            value: stats.reviewDue,
            icon: AlertTriangle,
            colour: stats.reviewDue > 0 ? "text-amber-600" : "text-gray-400",
          },
          {
            label: "Avg Participants",
            value: stats.avgParticipants,
            icon: Users,
            colour: "text-emerald-600",
          },
          {
            label: "Models Used",
            value: stats.modelsUsed,
            icon: Layers,
            colour: "text-purple-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border bg-white p-4 flex items-center gap-3"
          >
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── filters ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search children, model or hypothesis…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterModel} onValueChange={setFilterModel}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
            <SelectItem value="5Ps">5Ps</SelectItem>
            <SelectItem value="Cognitive Behavioural">Cognitive Behavioural</SelectItem>
            <SelectItem value="Attachment-based">Attachment-based</SelectItem>
            <SelectItem value="Trauma-informed">Trauma-informed</SelectItem>
            <SelectItem value="Systemic">Systemic</SelectItem>
            <SelectItem value="Integrated">Integrated</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="review">Review Due</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ───────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((f) => {
          const open = expandedId === f.id;
          const reviewDue = f.nextReviewDate <= d(30);
          return (
            <div key={f.id} className="rounded-lg border bg-white">
              <button
                onClick={() => toggle(f.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Brain className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">
                      {getYPName(f.youngPerson)}
                    </h3>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        MODEL_COLOURS[f.modelUsed],
                      )}
                    >
                      {f.modelUsed}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      v{f.version}
                    </span>
                    {reviewDue && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Review Due
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Formulated {f.formulationDate} ·{" "}
                    {f.participantsAttended.length} participants · Lead:{" "}
                    {getStaffName(f.internalLead)} · Next review{" "}
                    {f.nextReviewDate}
                  </p>
                </div>
                {open ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* meta */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Date:</span>{" "}
                      <span className="font-medium">{f.formulationDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Model:</span>{" "}
                      <span className="font-medium">{f.modelUsed}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Lead:</span>{" "}
                      <span className="font-medium">
                        {getStaffName(f.internalLead)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Next review:</span>{" "}
                      <span
                        className={cn(
                          "font-medium",
                          f.nextReviewDate <= d(0) ? "text-red-600" : "",
                        )}
                      >
                        {f.nextReviewDate}
                      </span>
                    </div>
                  </div>

                  {/* participants */}
                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> Participants
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {f.participantsAttended.map((p, i) => (
                        <span
                          key={i}
                          className={cn(
                            "px-2 py-0.5 rounded text-xs",
                            p.startsWith("staff_")
                              ? "bg-blue-100 text-blue-800"
                              : "bg-white border text-gray-700",
                          )}
                        >
                          {renderParticipant(p)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* presenting */}
                  <div className="rounded-md border p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                      <ClipboardList className="h-3.5 w-3.5" /> Presenting
                      Difficulties
                    </h4>
                    <ul className="list-disc list-inside text-sm text-gray-800 space-y-0.5">
                      {f.presentingDifficulties.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 5 Ps grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1">
                        Predisposing — &quot;What made this child vulnerable?&quot;
                      </h4>
                      <ul className="list-disc list-inside text-sm text-amber-900 space-y-0.5">
                        {f.predisposing.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md bg-orange-50 border border-orange-200 p-3">
                      <h4 className="text-xs font-semibold text-orange-700 mb-1">
                        Precipitating — &quot;What triggered things now?&quot;
                      </h4>
                      <ul className="list-disc list-inside text-sm text-orange-900 space-y-0.5">
                        {f.precipitating.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <h4 className="text-xs font-semibold text-red-700 mb-1">
                        Perpetuating — &quot;What keeps it going?&quot;
                      </h4>
                      <ul className="list-disc list-inside text-sm text-red-900 space-y-0.5">
                        {f.perpetuating.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md bg-green-50 border border-green-200 p-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">
                        Protective — &quot;What is helping?&quot;
                      </h4>
                      <ul className="list-disc list-inside text-sm text-green-900 space-y-0.5">
                        {f.protective.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* hypotheses */}
                  <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                    <h4 className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1">
                      <Lightbulb className="h-3.5 w-3.5" /> Key Hypotheses
                    </h4>
                    <ul className="list-disc list-inside text-sm text-purple-900 space-y-1">
                      {f.keyHypotheses.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>

                  {/* interventions */}
                  <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                    <h4 className="text-xs font-semibold text-blue-700 mb-1">
                      Agreed Interventions
                    </h4>
                    <ul className="list-disc list-inside text-sm text-blue-900 space-y-0.5">
                      {f.agreedInterventions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>

                  {/* risk */}
                  <div className="rounded-md bg-red-50 border border-red-200 p-3">
                    <h4 className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5" /> Risk Factors
                    </h4>
                    <ul className="list-disc list-inside text-sm text-red-900 space-y-0.5">
                      {f.riskFactors.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  {/* child contribution */}
                  <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                    <h4 className="text-xs font-semibold text-pink-700 mb-1">
                      Child&apos;s Contribution
                    </h4>
                    <p className="text-sm text-pink-900">{f.childContribution}</p>
                  </div>

                  {/* shareable */}
                  <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
                    <h4 className="text-xs font-semibold text-emerald-700 mb-1">
                      Shareable Summary — Child-Friendly Version
                    </h4>
                    <p className="text-sm text-emerald-900">
                      {f.shareableSummary}
                    </p>
                  </div>

                  {/* confidential */}
                  <div className="rounded-md bg-gray-100 border border-gray-300 p-3">
                    <h4 className="text-xs font-semibold text-gray-700 mb-1">
                      Confidential Notes — Restricted Access
                    </h4>
                    <p className="text-sm text-gray-800">
                      {f.confidentialNotes}
                    </p>
                  </div>

                  {/* review */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Next formulation review:{" "}
                    <span className="font-medium text-gray-700">
                      {f.nextReviewDate}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ─────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Regulatory and professional standards:</strong>{" "}
        Multi-disciplinary formulation aligns with the British Psychological
        Society&apos;s <em>Good Practice Guidelines on the Use of Psychological
        Formulation</em> (BPS, 2011) and underpins NICE-recommended care
        planning for children with mental health and developmental needs.
        Formulations are working hypotheses, co-produced with the child wherever
        possible, regularly reviewed, and held alongside — not in place of —
        statutory plans (Care Plan, EHCP, PEP). They support the home&apos;s duty
        under the Children&apos;s Homes (England) Regulations 2015 to provide
        care that is informed by each child&apos;s individual psychological,
        emotional and developmental needs.
      </div>
    </PageShell>
  );
}
