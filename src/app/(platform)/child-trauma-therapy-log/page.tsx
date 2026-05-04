"use client";

import { useState, useMemo } from "react";
import {
  Heart,
  Brain,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type Modality =
  | "TF-CBT"
  | "EMDR"
  | "Play therapy"
  | "Art therapy"
  | "Narrative therapy"
  | "DDP"
  | "Theraplay"
  | "CBT (general)"
  | "Person-centred"
  | "Sand tray"
  | "Mixed"
  | "Other";

type SessionFormat =
  | "1:1"
  | "Family-included"
  | "Group"
  | "Online"
  | "Outdoor / walk and talk";

type Presentation =
  | "Engaged"
  | "Withdrawn"
  | "Avoidant"
  | "Distressed"
  | "Mixed"
  | "Building trust";

interface TherapyLog {
  id: string;
  youngPerson: string;
  sessionDate: string;
  modality: Modality;
  therapistName: string;
  therapistService: string;
  sessionFormatLabel: SessionFormat;
  sessionLengthMinutes: number;
  attended: boolean;
  reasonIfMissed?: string;
  generalThemeBroad: string;
  childPresentation: Presentation;
  preSessionMoodRating: 1 | 2 | 3 | 4 | 5;
  postSessionMoodRating: 1 | 2 | 3 | 4 | 5;
  regulationStrategiesUsedAfter: string[];
  betweenSessionSupport: string[];
  escalationFlags: string[];
  childVoiceShared?: string;
  staffObservation: string;
  nextSession?: string;
  recordedBy: string;
}

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

/* ── colour maps ───────────────────────────────────────────────────────── */

const MODALITY_COLOURS: Record<Modality, string> = {
  "TF-CBT": "bg-violet-100 text-violet-800",
  "EMDR": "bg-violet-100 text-violet-800",
  "Play therapy": "bg-teal-100 text-teal-800",
  "Art therapy": "bg-teal-100 text-teal-800",
  "Narrative therapy": "bg-indigo-100 text-indigo-800",
  "DDP": "bg-purple-100 text-purple-800",
  "Theraplay": "bg-purple-100 text-purple-800",
  "CBT (general)": "bg-blue-100 text-blue-800",
  "Person-centred": "bg-emerald-100 text-emerald-800",
  "Sand tray": "bg-amber-100 text-amber-800",
  "Mixed": "bg-slate-100 text-slate-800",
  "Other": "bg-gray-100 text-gray-700",
};

const PRESENTATION_COLOURS: Record<Presentation, string> = {
  "Engaged": "bg-emerald-100 text-emerald-800",
  "Withdrawn": "bg-slate-100 text-slate-700",
  "Avoidant": "bg-amber-100 text-amber-800",
  "Distressed": "bg-rose-100 text-rose-800",
  "Mixed": "bg-indigo-100 text-indigo-800",
  "Building trust": "bg-teal-100 text-teal-800",
};

/* ── seed ──────────────────────────────────────────────────────────────── */

const SEED: TherapyLog[] = [
  // ── Alex — TF-CBT / EMDR weekly with Dr Patel CAMHS ──────────────────
  {
    id: "tl1",
    youngPerson: "yp_alex",
    sessionDate: d(-3),
    modality: "TF-CBT",
    therapistName: "Dr Sasha Patel",
    therapistService: "CAMHS — Specialist Trauma Team",
    sessionFormatLabel: "1:1",
    sessionLengthMinutes: 60,
    attended: true,
    generalThemeBroad: "Identity work — continuing the strand around family rejection and how Alex holds their sense of self alongside it. Therapist confirmed broad theme only; specific content held in therapy.",
    childPresentation: "Engaged",
    preSessionMoodRating: 2,
    postSessionMoodRating: 4,
    regulationStrategiesUsedAfter: [
      "Boxing bag in the garage — 20 minutes",
      "Quiet hour in bedroom with door open (Alex&apos;s choice)",
      "Cup of tea with Anna afterwards — no questions, just company",
    ],
    betweenSessionSupport: [
      "Anna available for grounding contact — Alex knows where she is",
      "Boxing as a regulation tool, not just sport — agreed with therapist",
      "Mermaids peer mentor video call mid-week",
    ],
    escalationFlags: [],
    childVoiceShared: "I came out of that one feeling lighter. Don&apos;t ask me about it though — that&apos;s a Dr Patel room thing.",
    staffObservation: "Alex returned settled. Used the boxing bag without prompting — therapist had agreed this is a good post-session step. Slept well that night per Alex&apos;s own report.",
    nextSession: d(4),
    recordedBy: "staff_anna",
  },
  {
    id: "tl2",
    youngPerson: "yp_alex",
    sessionDate: d(-10),
    modality: "EMDR",
    therapistName: "Dr Sasha Patel",
    therapistService: "CAMHS — Specialist Trauma Team",
    sessionFormatLabel: "1:1",
    sessionLengthMinutes: 75,
    attended: true,
    generalThemeBroad: "EMDR processing block — therapist flagged this as a heavier session in advance so the home could plan support. No detail of content shared, by agreement.",
    childPresentation: "Mixed",
    preSessionMoodRating: 3,
    postSessionMoodRating: 2,
    regulationStrategiesUsedAfter: [
      "Walked the dog with Anna (no talking required)",
      "Weighted blanket and a film on the sofa",
      "Early night — heated wheat bag",
    ],
    betweenSessionSupport: [
      "Cleared the evening of any demands — agreed in advance with Alex",
      "Soft check-in next morning — Alex chose to talk briefly",
      "Made favourite breakfast (poached egg on sourdough) — small comfort signal",
    ],
    escalationFlags: [
      "Heavier processing session — monitor sleep and self-talk for 72 hours",
    ],
    childVoiceShared: "It was hard. I&apos;m glad I went. I&apos;m really tired now.",
    staffObservation: "Therapist had given prior heads-up that this would be a deeper EMDR set. Alex was quiet for the evening but accepted comfort. By morning two, mood had lifted again. Pattern matches what therapist described.",
    nextSession: d(-3),
    recordedBy: "staff_anna",
  },
  {
    id: "tl3",
    youngPerson: "yp_alex",
    sessionDate: d(-17),
    modality: "TF-CBT",
    therapistName: "Dr Sasha Patel",
    therapistService: "CAMHS — Specialist Trauma Team",
    sessionFormatLabel: "1:1",
    sessionLengthMinutes: 60,
    attended: true,
    generalThemeBroad: "Boxing-as-grounding — therapist and Alex worked on integrating the boxing routine as a between-session grounding strategy. Theme also touched on identity (broad).",
    childPresentation: "Engaged",
    preSessionMoodRating: 3,
    postSessionMoodRating: 4,
    regulationStrategiesUsedAfter: [
      "Boxing bag — 15 minutes",
      "Made a playlist of session-end songs (Alex&apos;s idea, therapist supported)",
    ],
    betweenSessionSupport: [
      "Boxing slot booked at the gym — twice a week",
      "Anna noted strategy in Alex&apos;s individual support plan",
    ],
    escalationFlags: [],
    childVoiceShared: "We made a plan together. I get to tell my body it&apos;s safe by moving it.",
    staffObservation: "Constructive session — Alex came out with a concrete strategy and a sense of agency. Strategy now mirrored in regulation plan and shared with all staff.",
    nextSession: d(-10),
    recordedBy: "staff_chervelle",
  },
  {
    id: "tl4",
    youngPerson: "yp_alex",
    sessionDate: d(-24),
    modality: "TF-CBT",
    therapistName: "Dr Sasha Patel",
    therapistService: "CAMHS — Specialist Trauma Team",
    sessionFormatLabel: "1:1",
    sessionLengthMinutes: 60,
    attended: false,
    reasonIfMissed: "Alex unwell with a heavy cold — rebooked. Therapist contacted; no follow-up concerns.",
    generalThemeBroad: "Session not attended — to be picked up at the rebook.",
    childPresentation: "Withdrawn",
    preSessionMoodRating: 2,
    postSessionMoodRating: 2,
    regulationStrategiesUsedAfter: [
      "Rest and fluids — recovery focus only",
    ],
    betweenSessionSupport: [
      "Therapist messaged Alex a brief audio note — &lsquo;rest, see you next week&rsquo;",
      "Anna kept the day low-stimulation",
    ],
    escalationFlags: [],
    staffObservation: "Genuine illness, not avoidance — Alex was disappointed to miss. Logged for pattern tracking only.",
    nextSession: d(-17),
    recordedBy: "staff_anna",
  },

  // ── Jordan — monthly narrative therapy ───────────────────────────────
  {
    id: "tl5",
    youngPerson: "yp_jordan",
    sessionDate: d(-7),
    modality: "Narrative therapy",
    therapistName: "Yusuf Rahman",
    therapistService: "Private practice, mosque-aligned therapist (paid via leaving-care fund)",
    sessionFormatLabel: "1:1",
    sessionLengthMinutes: 50,
    attended: true,
    generalThemeBroad: "Identity and contact transitions — broad work on the story of family relationships and Jordan&apos;s place within it. Therapist confirmed only the broad theme.",
    childPresentation: "Engaged",
    preSessionMoodRating: 3,
    postSessionMoodRating: 4,
    regulationStrategiesUsedAfter: [
      "Walked back via the park — 30 minutes — Jordan&apos;s preference",
      "Phoned aunt afterwards (planned in advance)",
    ],
    betweenSessionSupport: [
      "Calendar of contact transitions agreed and visible in Jordan&apos;s room",
      "Aunt aware of session timing — supportive call lined up",
      "Cultural mentor available between sessions if needed",
    ],
    escalationFlags: [],
    childVoiceShared: "Yusuf gets it without me having to explain the basics. That matters.",
    staffObservation: "Jordan came back grounded. The cultural and faith alignment of the therapist continues to be the right fit. Mood lift sustained into the evening.",
    nextSession: d(21),
    recordedBy: "staff_chervelle",
  },
  {
    id: "tl6",
    youngPerson: "yp_jordan",
    sessionDate: d(-35),
    modality: "Narrative therapy",
    therapistName: "Yusuf Rahman",
    therapistService: "Private practice, mosque-aligned therapist (paid via leaving-care fund)",
    sessionFormatLabel: "1:1",
    sessionLengthMinutes: 50,
    attended: true,
    generalThemeBroad: "Brother in Pakistan — broad theme of long-distance sibling relationship and how Jordan is making sense of it. No specifics shared with the home.",
    childPresentation: "Building trust",
    preSessionMoodRating: 2,
    postSessionMoodRating: 3,
    regulationStrategiesUsedAfter: [
      "Quiet evening — Jordan asked for it",
      "Wrote in the personal journal (private, not for staff)",
    ],
    betweenSessionSupport: [
      "Video call with brother arranged for the following week",
      "Photos of brother kept on Jordan&apos;s shelf",
    ],
    escalationFlags: [],
    childVoiceShared: "Some of it is sad. Some of it I didn&apos;t know I was carrying.",
    staffObservation: "Heavier session by Jordan&apos;s own description. Settled by morning. Cultural mentor briefed (with Jordan&apos;s consent) on broad theme so support is joined-up.",
    nextSession: d(-7),
    recordedBy: "staff_chervelle",
  },
  {
    id: "tl7",
    youngPerson: "yp_jordan",
    sessionDate: d(-63),
    modality: "Narrative therapy",
    therapistName: "Yusuf Rahman",
    therapistService: "Private practice, mosque-aligned therapist (paid via leaving-care fund)",
    sessionFormatLabel: "Online",
    sessionLengthMinutes: 45,
    attended: true,
    generalThemeBroad: "First session of this block — relational set-up and agreeing what gets shared with the home (broad themes only).",
    childPresentation: "Building trust",
    preSessionMoodRating: 3,
    postSessionMoodRating: 3,
    regulationStrategiesUsedAfter: [
      "Reflection time on Jordan&apos;s own — door closed, lamp on",
    ],
    betweenSessionSupport: [
      "Agreement in writing about what gets shared with staff (signed by Jordan, therapist, and key worker)",
      "Cultural mentor included in Jordan&apos;s circle of support",
    ],
    escalationFlags: [],
    staffObservation: "First session — set the scene for the work. Jordan was clear-headed about confidentiality boundaries. The home is set up to support without intruding.",
    nextSession: d(-35),
    recordedBy: "staff_chervelle",
  },

  // ── Casey — weekly play therapy with Anna Freud Centre ───────────────
  {
    id: "tl8",
    youngPerson: "yp_casey",
    sessionDate: d(-2),
    modality: "Play therapy",
    therapistName: "Beth Coombs",
    therapistService: "Anna Freud Centre — Children&apos;s Trauma Service",
    sessionFormatLabel: "1:1",
    sessionLengthMinutes: 50,
    attended: true,
    generalThemeBroad: "Sensory processing and bereavement — gentle play themes around grandad and the apple tree. Therapist held the specifics in the therapy space.",
    childPresentation: "Engaged",
    preSessionMoodRating: 3,
    postSessionMoodRating: 4,
    regulationStrategiesUsedAfter: [
      "Cuddle with Eeyore and a quiet snack",
      "Painting at the kitchen table — Anna sat alongside",
    ],
    betweenSessionSupport: [
      "Eeyore travel-bag in Casey&apos;s school rucksack",
      "Predictable evening routine — bath, story, lights low",
      "Memory-corner items for grandad kept available",
    ],
    escalationFlags: [],
    childVoiceShared: "Beth&apos;s room is the sandcastle place. I left some sad in the sand today.",
    staffObservation: "Casey returned bright. The play therapy room continues to be a space she trusts. Eeyore came too — therapist had agreed this is fine. Sleep settled.",
    nextSession: d(5),
    recordedBy: "staff_anna",
  },
  {
    id: "tl9",
    youngPerson: "yp_casey",
    sessionDate: d(-9),
    modality: "Play therapy",
    therapistName: "Beth Coombs",
    therapistService: "Anna Freud Centre — Children&apos;s Trauma Service",
    sessionFormatLabel: "1:1",
    sessionLengthMinutes: 50,
    attended: true,
    generalThemeBroad: "School transitions and sensory regulation — broad theme. Casey arrived wound up after a noisy school morning; Beth used the first ten minutes for sensory grounding.",
    childPresentation: "Distressed",
    preSessionMoodRating: 2,
    postSessionMoodRating: 4,
    regulationStrategiesUsedAfter: [
      "Garden time — barefoot on the grass for ten minutes",
      "Slow-cooked tea (Casey&apos;s favourite — sausage casserole)",
    ],
    betweenSessionSupport: [
      "School informed Casey may be tired Wednesday afternoons (session day)",
      "Sensory toolkit in school bag — fidget, ear defenders, chew necklace",
      "Beth and Anna met for 15 minutes by phone (with Casey&apos;s knowledge) — broad-theme update only",
    ],
    escalationFlags: [
      "School morning sensory overload pattern — review with SENCO",
    ],
    childVoiceShared: "I was a bit sandbag this morning. Beth helped me put the sandbag down.",
    staffObservation: "Big pre-to-post mood lift — therapist&apos;s grounding work was visibly effective. Pattern of Wednesday-morning overload now logged for SENCO conversation.",
    nextSession: d(-2),
    recordedBy: "staff_anna",
  },
  {
    id: "tl10",
    youngPerson: "yp_casey",
    sessionDate: d(-16),
    modality: "Play therapy",
    therapistName: "Beth Coombs",
    therapistService: "Anna Freud Centre — Children&apos;s Trauma Service",
    sessionFormatLabel: "1:1",
    sessionLengthMinutes: 50,
    attended: true,
    generalThemeBroad: "Eeyore and the bereavement work — Casey brought Eeyore in. Therapist signalled (with Casey&apos;s consent) that this was a meaningful session in the bereavement strand.",
    childPresentation: "Mixed",
    preSessionMoodRating: 3,
    postSessionMoodRating: 3,
    regulationStrategiesUsedAfter: [
      "Sat with Eeyore on the apple-tree memorial bench",
      "Drew a picture for grandad — went into the memory corner",
    ],
    betweenSessionSupport: [
      "Anna available — sat near, didn&apos;t hover",
      "Memory corner refreshed with Casey",
    ],
    escalationFlags: [],
    childVoiceShared: "Eeyore did some of the talking today. He&apos;s allowed.",
    staffObservation: "Steady session. Casey held her own emotion well, with Eeyore as the proxy where she needed one. Continues to use the home environment for follow-on regulation in healthy ways.",
    nextSession: d(-9),
    recordedBy: "staff_anna",
  },
];

/* ── flat row for export ───────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string;
  sessionDate: string;
  modality: string;
  therapistName: string;
  therapistService: string;
  sessionFormat: string;
  sessionLengthMinutes: string;
  attended: string;
  reasonIfMissed: string;
  generalThemeBroad: string;
  childPresentation: string;
  preSessionMoodRating: string;
  postSessionMoodRating: string;
  moodChange: string;
  escalationFlagsCount: string;
  childVoiceShared: string;
  staffObservation: string;
  nextSession: string;
  recordedBy: string;
}

const exportCols: ExportColumn<FlatRow>[] = [
  { header: "Young Person", accessor: (r: FlatRow) => r.youngPerson },
  { header: "Session Date", accessor: (r: FlatRow) => r.sessionDate },
  { header: "Modality", accessor: (r: FlatRow) => r.modality },
  { header: "Therapist", accessor: (r: FlatRow) => r.therapistName },
  { header: "Service", accessor: (r: FlatRow) => r.therapistService },
  { header: "Format", accessor: (r: FlatRow) => r.sessionFormat },
  { header: "Length (min)", accessor: (r: FlatRow) => r.sessionLengthMinutes },
  { header: "Attended", accessor: (r: FlatRow) => r.attended },
  { header: "Reason If Missed", accessor: (r: FlatRow) => r.reasonIfMissed },
  { header: "General Theme (broad)", accessor: (r: FlatRow) => r.generalThemeBroad },
  { header: "Child Presentation", accessor: (r: FlatRow) => r.childPresentation },
  { header: "Pre-Session Mood (1-5)", accessor: (r: FlatRow) => r.preSessionMoodRating },
  { header: "Post-Session Mood (1-5)", accessor: (r: FlatRow) => r.postSessionMoodRating },
  { header: "Mood Change", accessor: (r: FlatRow) => r.moodChange },
  { header: "Escalation Flags", accessor: (r: FlatRow) => r.escalationFlagsCount },
  { header: "Child Voice (if shared)", accessor: (r: FlatRow) => r.childVoiceShared },
  { header: "Staff Observation", accessor: (r: FlatRow) => r.staffObservation },
  { header: "Next Session", accessor: (r: FlatRow) => r.nextSession },
  { header: "Recorded By", accessor: (r: FlatRow) => r.recordedBy },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function ChildTraumaTherapyLogPage() {
  const [data] = useState<TherapyLog[]>(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterModality, setFilterModality] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  const toggle = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const in14d = new Date();
    in14d.setDate(in14d.getDate() + 14);

    const sessionsThisMonth = data.filter((r) => {
      const sd = new Date(r.sessionDate);
      return sd >= monthAgo && sd <= today;
    }).length;

    const monthRecords = data.filter((r) => {
      const sd = new Date(r.sessionDate);
      return sd >= monthAgo && sd <= today;
    });
    const attended = monthRecords.filter((r) => r.attended).length;
    const attendancePct = monthRecords.length === 0 ? 0 : Math.round((attended / monthRecords.length) * 100);

    const escalationFlagsThisMonth = monthRecords.reduce((acc, r) => acc + r.escalationFlags.length, 0);

    const upcoming = data.filter((r) => {
      if (!r.nextSession) return false;
      const ns = new Date(r.nextSession);
      return ns >= today && ns <= in14d;
    }).length;

    return { sessionsThisMonth, attendancePct, escalationFlagsThisMonth, upcoming };
  }, [data]);

  /* ── filter / sort ────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        getYPName(r.youngPerson).toLowerCase().includes(q) ||
        r.modality.toLowerCase().includes(q) ||
        r.therapistName.toLowerCase().includes(q) ||
        r.therapistService.toLowerCase().includes(q) ||
        r.generalThemeBroad.toLowerCase().includes(q)
      );
    }
    if (filterModality !== "all") list = list.filter((r) => r.modality === filterModality);
    const out = [...list];
    switch (sortBy) {
      case "date": out.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate)); break;
      case "child": out.sort((a, b) => getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson))); break;
      case "modality": out.sort((a, b) => a.modality.localeCompare(b.modality)); break;
      case "moodChange": out.sort((a, b) => (b.postSessionMoodRating - b.preSessionMoodRating) - (a.postSessionMoodRating - a.preSessionMoodRating)); break;
    }
    return out;
  }, [data, search, filterModality, sortBy]);

  /* ── export rows ──────────────────────────────────────────────────── */
  const exportRows = useMemo<FlatRow[]>(() =>
    data.map((r) => ({
      youngPerson: getYPName(r.youngPerson),
      sessionDate: r.sessionDate,
      modality: r.modality,
      therapistName: r.therapistName,
      therapistService: r.therapistService,
      sessionFormat: r.sessionFormatLabel,
      sessionLengthMinutes: String(r.sessionLengthMinutes),
      attended: r.attended ? "Attended" : "Missed",
      reasonIfMissed: r.reasonIfMissed ?? "",
      generalThemeBroad: r.generalThemeBroad,
      childPresentation: r.childPresentation,
      preSessionMoodRating: String(r.preSessionMoodRating),
      postSessionMoodRating: String(r.postSessionMoodRating),
      moodChange: String(r.postSessionMoodRating - r.preSessionMoodRating),
      escalationFlagsCount: String(r.escalationFlags.length),
      childVoiceShared: r.childVoiceShared ?? "",
      staffObservation: r.staffObservation,
      nextSession: r.nextSession ?? "",
      recordedBy: getStaffName(r.recordedBy),
    })), [data]);

  const modalities: Modality[] = [
    "TF-CBT", "EMDR", "Play therapy", "Art therapy", "Narrative therapy",
    "DDP", "Theraplay", "CBT (general)", "Person-centred", "Sand tray", "Mixed", "Other",
  ];

  return (
    <PageShell
      title="Child Trauma Therapy Log"
      subtitle="Per-child trauma therapy attendance and observable presentation — therapeutic content stays in the therapy room"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Trauma Therapy Log" />
          <ExportButton data={exportRows} columns={exportCols} filename="child-trauma-therapy-log" />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Sessions this month", value: stats.sessionsThisMonth, icon: Brain, colour: "text-violet-600" },
          { label: "Attendance %", value: `${stats.attendancePct}%`, icon: Heart, colour: stats.attendancePct >= 85 ? "text-emerald-600" : "text-amber-600" },
          { label: "Escalation flags this month", value: stats.escalationFlagsThisMonth, icon: AlertTriangle, colour: stats.escalationFlagsThisMonth > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Sessions next 14d", value: stats.upcoming, icon: Calendar, colour: "text-teal-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── opening note ──────────────────────────────────────────── */}
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900 mb-6">
        <div className="flex items-start gap-2">
          <Sparkles className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
          <div>
            <strong>Therapeutic confidence held.</strong> Staff record the broad theme of each session, observable presentation, and the support given between sessions — never the specific disclosures or content of therapy. What the child shares with their therapist stays in that room. This log exists to coordinate care around the work, not to look inside it.
          </div>
        </div>
      </div>

      {/* ── filters ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by child, modality, therapist or theme…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterModality} onValueChange={setFilterModality}>
          <SelectTrigger className="w-[200px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modalities</SelectItem>
            {modalities.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most recent</SelectItem>
              <SelectItem value="child">Child name</SelectItem>
              <SelectItem value="modality">Modality</SelectItem>
              <SelectItem value="moodChange">Mood change</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── records ────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expandedId === r.id;
          const moodDelta = r.postSessionMoodRating - r.preSessionMoodRating;
          return (
            <div key={r.id} className="rounded-lg border border-violet-100 bg-white">
              <button
                onClick={() => toggle(r.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-violet-50/40"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Brain className="h-4 w-4 text-violet-500" />
                    <h3 className="font-semibold">{getYPName(r.youngPerson)}</h3>
                    <span className="text-sm text-gray-600">— {r.therapistName}</span>
                    <span className="text-xs text-gray-400">({r.therapistService})</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", MODALITY_COLOURS[r.modality])}>{r.modality}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", PRESENTATION_COLOURS[r.childPresentation])}>{r.childPresentation}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      r.attended ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    )}>
                      {r.attended ? "Attended" : "Missed"}
                    </span>
                    {r.attended && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1",
                        moodDelta > 0 ? "bg-teal-100 text-teal-800" : moodDelta < 0 ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"
                      )}>
                        <Heart className="h-3 w-3" />
                        Mood {moodDelta > 0 ? `+${moodDelta}` : moodDelta}
                      </span>
                    )}
                    {r.escalationFlags.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {r.escalationFlags.length} flag{r.escalationFlags.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Session {r.sessionDate} · {r.sessionFormatLabel} · {r.sessionLengthMinutes} min · Recorded by {getStaffName(r.recordedBy)}
                    {r.nextSession ? ` · Next ${r.nextSession}` : ""}
                  </p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />}
              </button>

              {open && (
                <div className="border-t border-violet-100 px-4 pb-4 space-y-4">
                  {/* general theme */}
                  <div className="rounded-md bg-gray-50 p-3 mt-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">General theme (broad — agreed with therapist)</h4>
                    <p className="text-sm">{r.generalThemeBroad}</p>
                    {!r.attended && r.reasonIfMissed && (
                      <p className="text-xs text-amber-700 mt-2"><strong>Reason missed:</strong> {r.reasonIfMissed}</p>
                    )}
                  </div>

                  {/* mood scale */}
                  <div className="rounded-md bg-violet-50 border border-violet-200 p-3">
                    <h4 className="text-xs font-semibold text-violet-700 mb-2">Mood — pre and post session</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-violet-700/80 mb-1">Before</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <span key={n} className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium",
                              n <= r.preSessionMoodRating ? "bg-violet-500 text-white" : "bg-violet-100 text-violet-400"
                            )}>{n}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-violet-700/80 mb-1">After</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <span key={n} className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium",
                              n <= r.postSessionMoodRating ? "bg-teal-500 text-white" : "bg-teal-100 text-teal-400"
                            )}>{n}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* regulation + between-session */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-teal-50 p-3">
                      <h4 className="text-xs font-semibold text-teal-700 mb-1">Regulation strategies used after</h4>
                      {r.regulationStrategiesUsedAfter.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-teal-900 space-y-0.5">
                          {r.regulationStrategiesUsedAfter.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      ) : (
                        <p className="text-sm italic text-teal-700/70">None recorded.</p>
                      )}
                    </div>
                    <div className="rounded-md bg-emerald-50 p-3">
                      <h4 className="text-xs font-semibold text-emerald-700 mb-1">Between-session support</h4>
                      {r.betweenSessionSupport.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-emerald-900 space-y-0.5">
                          {r.betweenSessionSupport.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      ) : (
                        <p className="text-sm italic text-emerald-700/70">None recorded.</p>
                      )}
                    </div>
                  </div>

                  {/* child voice — only if shared */}
                  {r.childVoiceShared && (
                    <div className="rounded-md bg-rose-50 border border-rose-200 p-3">
                      <h4 className="text-xs font-semibold text-rose-700 mb-1">Child&apos;s voice (only what the child chose to share)</h4>
                      <p className="text-sm italic text-rose-900">&ldquo;{r.childVoiceShared}&rdquo;</p>
                    </div>
                  )}

                  {/* staff observation */}
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-xs font-semibold text-amber-700 mb-1">Staff observation (observable presentation only)</h4>
                    <p className="text-sm text-amber-900">{r.staffObservation}</p>
                  </div>

                  {/* escalation flags */}
                  {r.escalationFlags.length > 0 && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <h4 className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Escalation flags
                      </h4>
                      <ul className="list-disc list-inside text-sm text-red-900 space-y-0.5">
                        {r.escalationFlags.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* next session */}
                  {r.nextSession && (
                    <div className="rounded-md bg-indigo-50 border border-indigo-200 p-3 inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm text-indigo-900">Next session: <span className="font-medium">{r.nextSession}</span></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed bg-white p-8 text-center text-sm text-gray-500">
            No sessions match these filters.
          </div>
        )}
      </div>

      {/* ── regulatory footer ──────────────────────────────────────── */}
      <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-4 text-sm text-violet-900 mb-6">
        <strong>Regulatory framework.</strong> Trauma therapy work in the home is governed by the standards of the practitioner&apos;s registering body — BPS, BACP or UKCP for psychologists and psychotherapists, BAAT for art therapists, and BAPT for play therapists. Specific modalities follow their evidence base: TF-CBT (Cohen, Mannarino &amp; Deblinger), EMDR (EMDR Institute / EMDR UK), and DDP (DDP Network). In line with the Children&apos;s Homes (England) Regulations 2015 — Quality Standard 8 (care planning) — staff hold therapeutic confidence by recording broad themes only, with the explicit consent of the child and the therapist on what gets shared with the home. UNCRC Article 24 (the right to the highest attainable standard of health) underpins our duty to keep these therapies accessible and well-supported between sessions.
      </div>
    </PageShell>
  );
}
