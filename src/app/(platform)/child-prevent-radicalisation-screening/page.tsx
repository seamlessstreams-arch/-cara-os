"use client";

import { useState, useMemo } from "react";
import {
  Shield,
  AlertTriangle,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Eye,
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

type ScreeningOutcome =
  | "No concerns"
  | "Watchful awareness"
  | "Concerns identified — internal support"
  | "Channel discussion considered"
  | "Channel referred"
  | "De-escalated / closed";

type ChannelStatus =
  | "Considered, not made"
  | "Made — accepted"
  | "Made — rejected"
  | "Active panel"
  | "Closed";

interface ExternalConsultation {
  agency: string;
  clinician?: string;
  date: string;
  outcome: string;
}

interface PreventScreen {
  id: string;
  youngPerson: string;
  recordedDate: string;
  screeningOutcome: ScreeningOutcome;
  vulnerabilityFactorsConsidered: string[];
  protectiveFactorsConsidered: string[];
  identityIdeologyExposureNotes?: string;
  onlineActivityFlags: string[];
  peerGroupNotes?: string;
  childVoiceConsulted: boolean;
  childVoice?: string;
  staffObservation: string;
  externalConsultation: ExternalConsultation[];
  channelReferralStatus?: ChannelStatus;
  proportionalityReflection: string;
  reviewDate: string;
  flagsForReview: string[];
  recordedBy: string;
}

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

/* ── colour maps ───────────────────────────────────────────────────────── */

const OUTCOME_COLOURS: Record<ScreeningOutcome, string> = {
  "No concerns": "bg-emerald-100 text-emerald-800",
  "Watchful awareness": "bg-sky-100 text-sky-800",
  "Concerns identified — internal support": "bg-amber-100 text-amber-800",
  "Channel discussion considered": "bg-orange-100 text-orange-800",
  "Channel referred": "bg-rose-100 text-rose-800",
  "De-escalated / closed": "bg-slate-100 text-slate-700",
};

const CHANNEL_COLOURS: Record<ChannelStatus, string> = {
  "Considered, not made": "bg-slate-100 text-slate-700",
  "Made — accepted": "bg-amber-100 text-amber-800",
  "Made — rejected": "bg-slate-100 text-slate-700",
  "Active panel": "bg-rose-100 text-rose-800",
  "Closed": "bg-emerald-100 text-emerald-800",
};

/* ── seed ──────────────────────────────────────────────────────────────── */

const SEED: PreventScreen[] = [
  {
    id: "ps1",
    youngPerson: "yp_jordan",
    recordedDate: d(-21),
    screeningOutcome: "No concerns",
    vulnerabilityFactorsConsidered: [
      "Adverse childhood experiences related to displacement of family — already held in care plan",
      "Long-distance separation from sibling abroad — sense-of-belonging factor considered",
      "Previous bullying at primary school based on faith — historic, well-resolved",
    ],
    protectiveFactorsConsidered: [
      "Strong, stable Muslim faith identity — Jordan articulates this with clarity and pride",
      "Mosque attendance is regular, joyful and embedded in Jordan&apos;s wider social life",
      "Prosocial peer group at Highfields Academy — academically focused friendship circle",
      "Trusted relationship with cultural mentor and aunt — both consulted in care planning",
      "Secure key-worker relationship with Anna; therapy with mosque-aligned therapist",
      "Critical thinking skills — Jordan questions sources and discusses news in considered ways",
    ],
    identityIdeologyExposureNotes: "No identified exposure to extremist ideology of any form. Religious practice is mainstream, scholarly and community-based. The mosque Jordan attends is well-known to the home, the local authority and the wider community; it runs youth programmes that are explicitly anti-extremist and pro-civic. To name mosque attendance as a risk factor would be both factually wrong and a form of religious profiling under the Equality Act 2010.",
    onlineActivityFlags: [],
    peerGroupNotes: "Jordan&apos;s peer group at school and at the mosque is prosocial and wide-ranging. Friends include young people of different faiths and none. No concerning peer influences identified.",
    childVoiceConsulted: true,
    childVoice: "I know why you&apos;re asking. My faith is the thing that keeps me grounded — it&apos;s not the thing that puts me at risk. Please don&apos;t mix those up.",
    staffObservation: "Jordan presents as settled, articulate and rooted in a healthy identity. Discussions about world events show a thoughtful, compassionate frame of reference. Nothing in observable behaviour, online activity or peer group raises a Prevent-related concern. The screening exists in our framework as a duty applied to all young people; the outcome here is unambiguously &lsquo;no concerns&rsquo; and we are explicit that mosque attendance and faith identity are protective, not concerning.",
    externalConsultation: [
      { agency: "Cultural mentor (mosque youth lead)", clinician: "Imam Bilal Hussain", date: d(-25), outcome: "Confirmed Jordan&apos;s engagement is age-typical and prosocial; mosque youth programme is explicitly civic and anti-extremist." },
    ],
    channelReferralStatus: "Considered, not made",
    proportionalityReflection: "We have applied the Prevent duty here with explicit care not to conflate faith identity with risk. Jordan&apos;s mosque attendance is a protective factor and a strength; to record it as a vulnerability factor would be to repeat a pattern criticised in successive David Anderson reviews of Prevent and would breach the Equality Act 2010 duty not to discriminate on the basis of religion or belief. Channel was considered only because the duty requires that the question be asked of every child; the answer was a clear no, and we are explicit about why. Jordan has been told the screening took place, why, and what we concluded.",
    reviewDate: d(70),
    flagsForReview: [],
    recordedBy: "staff_anna",
  },
  {
    id: "ps2",
    youngPerson: "yp_alex",
    recordedDate: d(-14),
    screeningOutcome: "Watchful awareness",
    vulnerabilityFactorsConsidered: [
      "LGBTQ+ identity (trans, non-binary) — historically targeted by online incel and alt-right hate content",
      "Family rejection has produced periods of identity-related distress — held in trauma therapy",
      "Algorithmic exposure on TikTok &lsquo;For You&rsquo; feed has occasionally surfaced anti-trans alt-right content",
    ],
    protectiveFactorsConsidered: [
      "High level of media and digital literacy — Alex names extremist tactics when they see them",
      "Open dialogue with key worker Anna about online experiences — Alex initiates these conversations",
      "Active membership of LGBTQ+ youth groups (Mermaids peer mentoring) — prosocial belonging",
      "Strong therapeutic alliance with Dr Sasha Patel (CAMHS specialist trauma)",
      "Boxing as a regulation strategy — physical, embodied, away from screens",
      "Articulate critical position on hate-content — Alex describes incel pipelines analytically",
    ],
    identityIdeologyExposureNotes: "Critical distinction: Alex is not at risk of being radicalised toward extremist ideology. Alex is at risk of being targeted by extremist content directed against trans young people. The Prevent duty asks us to consider radicalisation risk; the safeguarding question for Alex is the inverse — protection from hostile content aimed at their identity. Alex has discussed alt-right and incel narratives openly with Anna, identifies them as harmful, and seeks support to manage exposure rather than gravitating toward such content.",
    onlineActivityFlags: [
      "TikTok &lsquo;For You&rsquo; algorithm occasionally surfaces anti-trans alt-right content — Alex reports and discusses with Anna",
      "Alex has blocked specific accounts and uses content filtering proactively — discussed and supported",
    ],
    peerGroupNotes: "Peer group is prosocial — LGBTQ+ youth group, boxing gym, online Mermaids peer-mentor circle. No concerning peer influences identified. Alex&apos;s peers share Alex&apos;s critical, resilient stance toward hate content.",
    childVoiceConsulted: true,
    childVoice: "I want to be really clear. The risk for me is being a target of this stuff, not being recruited by it. Please don&apos;t flip that round when you write it down. I&apos;ve seen Prevent get used against trans kids who were the ones being attacked, and I don&apos;t want that to be me.",
    staffObservation: "Alex demonstrates sophisticated digital literacy and a clear analytical frame on extremist content. The home&apos;s response is to support Alex&apos;s resilience to hostile content — not to treat Alex as a radicalisation risk. Watchful awareness category reflects the home&apos;s ongoing attention to online wellbeing, not a concern about Alex&apos;s ideology, which is consistently progressive, peaceful and pro-social. Anna and Alex meet weekly to talk through anything that has come up online.",
    externalConsultation: [
      { agency: "CAMHS — Specialist Trauma Team", clinician: "Dr Sasha Patel", date: d(-18), outcome: "Confirmed Alex&apos;s framing is accurate and clinically sound; recommended supporting Alex&apos;s existing protective strategies rather than escalating." },
      { agency: "Mermaids peer mentor service", date: d(-20), outcome: "Confirmed Alex&apos;s online experiences are common for trans youth; protective network in place." },
    ],
    channelReferralStatus: "Considered, not made",
    proportionalityReflection: "This is the most important reflection on this page. Prevent has a documented history — examined in successive David Anderson reviews — of being applied disproportionately to young people who are targets of extremism rather than vehicles for it. Alex named that risk in their own voice during this screening. The home&apos;s position is unambiguous: Alex is being targeted by alt-right and incel content directed at trans young people. Alex&apos;s response to that targeting — naming it, analysing it, building resilience, drawing on therapy and prosocial peer networks — is a protective strength, not a vulnerability. To record this screening as a Prevent concern would be a category error and would risk causing the very harm Prevent is meant to prevent. We are explicit with Alex about the screening, why we have done it, and what we have concluded. Channel was considered as the duty requires; not made because there is no radicalisation concern.",
    reviewDate: d(76),
    flagsForReview: [
      "Continue to monitor algorithmic exposure on TikTok — review with Alex monthly in key-worker session",
    ],
    recordedBy: "staff_anna",
  },
  {
    id: "ps3",
    youngPerson: "yp_casey",
    recordedDate: d(-7),
    screeningOutcome: "No concerns",
    vulnerabilityFactorsConsidered: [
      "Age 12 — developmental stage considered; no specific Prevent-relevant factors identified",
      "Recent bereavement (grandad) — held in play therapy; not a Prevent indicator",
    ],
    protectiveFactorsConsidered: [
      "Age-appropriate online activity — supervised, time-limited, on family-safe platforms",
      "Strong attachment to key worker Chervelle and to Eeyore as a transitional object",
      "Engaged in play therapy with the Anna Freud Centre",
      "Predictable home routines, secure base, prosocial school environment at Allestree Woodlands",
      "No exposure to ideological content of any kind identified — not an interest area for Casey",
    ],
    onlineActivityFlags: [],
    peerGroupNotes: "Casey&apos;s peer group is age-typical — school friends, primarily focused on creative play, drawing and music. No concerning peer influences identified.",
    childVoiceConsulted: true,
    childVoice: "I don&apos;t really know what this is for. Anna said it&apos;s a thing they have to ask all the kids. That&apos;s okay. I haven&apos;t seen anything weird and I&apos;d tell Chervelle if I had.",
    staffObservation: "Casey shows no Prevent-relevant indicators. Online activity is age-appropriate and well-supervised. Casey was told the screening was happening, why, and what we concluded — in age-appropriate language. Casey&apos;s response demonstrates trust in the home&apos;s safeguarding adults, which is the most important protective factor at this age.",
    externalConsultation: [],
    channelReferralStatus: "Considered, not made",
    proportionalityReflection: "Applying Prevent screening to a 12-year-old in age-appropriate, transparent, non-alarming language is the test of whether the duty is being implemented well. We told Casey what we were doing, why, and what we found, in language that respected her age and stage. The screening exists in our records as a routine, dignified safeguarding step — not as a label or a flag. The duty applies; the answer is clearly no concerns; the proportionate response is to record that and move on.",
    reviewDate: d(83),
    flagsForReview: [],
    recordedBy: "staff_chervelle",
  },
];

/* ── flat row for export ───────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string;
  recordedDate: string;
  screeningOutcome: string;
  vulnerabilityFactorsCount: string;
  protectiveFactorsCount: string;
  identityIdeologyExposureNotes: string;
  onlineActivityFlagsCount: string;
  peerGroupNotes: string;
  childVoiceConsulted: string;
  childVoice: string;
  staffObservation: string;
  externalConsultationCount: string;
  channelReferralStatus: string;
  proportionalityReflection: string;
  reviewDate: string;
  flagsForReviewCount: string;
  recordedBy: string;
}

const exportCols: ExportColumn<FlatRow>[] = [
  { header: "Young Person", accessor: (r: FlatRow) => r.youngPerson },
  { header: "Recorded Date", accessor: (r: FlatRow) => r.recordedDate },
  { header: "Screening Outcome", accessor: (r: FlatRow) => r.screeningOutcome },
  { header: "Vulnerability Factors", accessor: (r: FlatRow) => r.vulnerabilityFactorsCount },
  { header: "Protective Factors", accessor: (r: FlatRow) => r.protectiveFactorsCount },
  { header: "Identity / Ideology Notes", accessor: (r: FlatRow) => r.identityIdeologyExposureNotes },
  { header: "Online Activity Flags", accessor: (r: FlatRow) => r.onlineActivityFlagsCount },
  { header: "Peer Group Notes", accessor: (r: FlatRow) => r.peerGroupNotes },
  { header: "Child Voice Consulted", accessor: (r: FlatRow) => r.childVoiceConsulted },
  { header: "Child Voice", accessor: (r: FlatRow) => r.childVoice },
  { header: "Staff Observation", accessor: (r: FlatRow) => r.staffObservation },
  { header: "External Consultations", accessor: (r: FlatRow) => r.externalConsultationCount },
  { header: "Channel Referral Status", accessor: (r: FlatRow) => r.channelReferralStatus },
  { header: "Proportionality Reflection", accessor: (r: FlatRow) => r.proportionalityReflection },
  { header: "Review Date", accessor: (r: FlatRow) => r.reviewDate },
  { header: "Flags For Review", accessor: (r: FlatRow) => r.flagsForReviewCount },
  { header: "Recorded By", accessor: (r: FlatRow) => r.recordedBy },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function ChildPreventRadicalisationScreeningPage() {
  const [data] = useState<PreventScreen[]>(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterOutcome, setFilterOutcome] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  const toggle = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const today = new Date();
    const in90d = new Date();
    in90d.setDate(in90d.getDate() + 90);

    const activeScreenings = data.length;
    const watchfulAwareness = data.filter((r) => r.screeningOutcome === "Watchful awareness").length;
    const channelReferrals = data.filter((r) =>
      r.channelReferralStatus === "Made — accepted" ||
      r.channelReferralStatus === "Active panel" ||
      r.channelReferralStatus === "Made — rejected"
    ).length;
    const reviewsDue = data.filter((r) => {
      const rv = new Date(r.reviewDate);
      return rv >= today && rv <= in90d;
    }).length;

    return { activeScreenings, watchfulAwareness, channelReferrals, reviewsDue };
  }, [data]);

  /* ── filter / sort ────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        getYPName(r.youngPerson).toLowerCase().includes(q) ||
        r.screeningOutcome.toLowerCase().includes(q) ||
        r.staffObservation.toLowerCase().includes(q) ||
        r.proportionalityReflection.toLowerCase().includes(q) ||
        (r.peerGroupNotes ?? "").toLowerCase().includes(q) ||
        (r.identityIdeologyExposureNotes ?? "").toLowerCase().includes(q)
      );
    }
    if (filterOutcome !== "all") list = list.filter((r) => r.screeningOutcome === filterOutcome);
    const out = [...list];
    switch (sortBy) {
      case "date": out.sort((a, b) => b.recordedDate.localeCompare(a.recordedDate)); break;
      case "child": out.sort((a, b) => getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson))); break;
      case "outcome": out.sort((a, b) => a.screeningOutcome.localeCompare(b.screeningOutcome)); break;
      case "review": out.sort((a, b) => a.reviewDate.localeCompare(b.reviewDate)); break;
    }
    return out;
  }, [data, search, filterOutcome, sortBy]);

  /* ── export rows ──────────────────────────────────────────────────── */
  const exportRows = useMemo<FlatRow[]>(() =>
    data.map((r) => ({
      youngPerson: getYPName(r.youngPerson),
      recordedDate: r.recordedDate,
      screeningOutcome: r.screeningOutcome,
      vulnerabilityFactorsCount: String(r.vulnerabilityFactorsConsidered.length),
      protectiveFactorsCount: String(r.protectiveFactorsConsidered.length),
      identityIdeologyExposureNotes: r.identityIdeologyExposureNotes ?? "",
      onlineActivityFlagsCount: String(r.onlineActivityFlags.length),
      peerGroupNotes: r.peerGroupNotes ?? "",
      childVoiceConsulted: r.childVoiceConsulted ? "Yes" : "No",
      childVoice: r.childVoice ?? "",
      staffObservation: r.staffObservation,
      externalConsultationCount: String(r.externalConsultation.length),
      channelReferralStatus: r.channelReferralStatus ?? "",
      proportionalityReflection: r.proportionalityReflection,
      reviewDate: r.reviewDate,
      flagsForReviewCount: String(r.flagsForReview.length),
      recordedBy: getStaffName(r.recordedBy),
    })), [data]);

  const outcomes: ScreeningOutcome[] = [
    "No concerns",
    "Watchful awareness",
    "Concerns identified — internal support",
    "Channel discussion considered",
    "Channel referred",
    "De-escalated / closed",
  ];

  return (
    <PageShell
      title="Child Prevent Radicalisation Screening"
      subtitle="Per-child Prevent duty screening — child-rights based, proportionate, and explicit about not conflating identity with risk"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Prevent Screening" />
          <ExportButton data={exportRows} columns={exportCols} filename="child-prevent-radicalisation-screening" />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active screenings", value: stats.activeScreenings, icon: Shield, colour: "text-sky-600" },
          { label: "Watchful awareness", value: stats.watchfulAwareness, icon: Eye, colour: stats.watchfulAwareness > 0 ? "text-sky-600" : "text-gray-400" },
          { label: "Channel referrals", value: stats.channelReferrals, icon: AlertTriangle, colour: stats.channelReferrals > 0 ? "text-rose-600" : "text-gray-400" },
          { label: "Reviews due (90d)", value: stats.reviewsDue, icon: ShieldCheck, colour: "text-teal-600" },
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
      <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 mb-6">
        <div className="flex items-start gap-2">
          <ShieldCheck className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <strong>Proportionate, child-rights based screening.</strong> The Prevent duty applies to every child in our care — the question is asked routinely. The answer must be honest and proportionate. We do not conflate faith identity, gender identity or normal teenage interests with risk. Vulnerability indicators are informed by BRIEF and ERG22+ frames but are never deterministic. The most important section on each record is the proportionality reflection — it is where we examine whether we are applying the duty rightly.
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
            placeholder="Search by child, outcome, observation or reflection…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterOutcome} onValueChange={setFilterOutcome}>
          <SelectTrigger className="w-[260px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All outcomes</SelectItem>
            {outcomes.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most recent</SelectItem>
              <SelectItem value="child">Child name</SelectItem>
              <SelectItem value="outcome">Outcome</SelectItem>
              <SelectItem value="review">Review date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── records ────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-lg border border-sky-100 bg-white">
              <button
                onClick={() => toggle(r.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-sky-50/40"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Shield className="h-4 w-4 text-sky-500" />
                    <h3 className="font-semibold">{getYPName(r.youngPerson)}</h3>
                    <span className="text-xs text-gray-500">— recorded {r.recordedDate}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", OUTCOME_COLOURS[r.screeningOutcome])}>
                      {r.screeningOutcome}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1",
                      r.childVoiceConsulted ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-600"
                    )}>
                      {r.childVoiceConsulted ? "Child voice consulted" : "Child voice not consulted"}
                    </span>
                    {r.channelReferralStatus && (
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", CHANNEL_COLOURS[r.channelReferralStatus])}>
                        Channel: {r.channelReferralStatus}
                      </span>
                    )}
                    {r.flagsForReview.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {r.flagsForReview.length} review flag{r.flagsForReview.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Review {r.reviewDate} · Recorded by {getStaffName(r.recordedBy)}
                  </p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />}
              </button>

              {open && (
                <div className="border-t border-sky-100 px-4 pb-4 space-y-4">
                  {/* vulnerability + protective — two column */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div className="rounded-md bg-amber-50 border border-amber-100 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1">Vulnerability factors considered</h4>
                      {r.vulnerabilityFactorsConsidered.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-amber-900 space-y-0.5">
                          {r.vulnerabilityFactorsConsidered.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      ) : (
                        <p className="text-sm italic text-amber-700/70">None identified.</p>
                      )}
                      <p className="text-[11px] text-amber-700/70 mt-2 italic">BRIEF / ERG22+ informed — never deterministic.</p>
                    </div>
                    <div className="rounded-md bg-emerald-50 border border-emerald-100 p-3">
                      <h4 className="text-xs font-semibold text-emerald-700 mb-1">Protective factors considered</h4>
                      {r.protectiveFactorsConsidered.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-emerald-900 space-y-0.5">
                          {r.protectiveFactorsConsidered.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      ) : (
                        <p className="text-sm italic text-emerald-700/70">None recorded.</p>
                      )}
                    </div>
                  </div>

                  {/* identity / ideology */}
                  {r.identityIdeologyExposureNotes && (
                    <div className="rounded-md bg-indigo-50 border border-indigo-200 p-3">
                      <h4 className="text-xs font-semibold text-indigo-700 mb-1">Identity and ideology exposure — context</h4>
                      <p className="text-sm text-indigo-900">{r.identityIdeologyExposureNotes}</p>
                    </div>
                  )}

                  {/* online activity */}
                  <div className="rounded-md bg-sky-50 border border-sky-200 p-3">
                    <h4 className="text-xs font-semibold text-sky-700 mb-1">Online activity flags</h4>
                    {r.onlineActivityFlags.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-sky-900 space-y-0.5">
                        {r.onlineActivityFlags.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    ) : (
                      <p className="text-sm italic text-sky-700/70">None flagged.</p>
                    )}
                  </div>

                  {/* peer group */}
                  {r.peerGroupNotes && (
                    <div className="rounded-md bg-teal-50 border border-teal-100 p-3">
                      <h4 className="text-xs font-semibold text-teal-700 mb-1">Peer group notes</h4>
                      <p className="text-sm text-teal-900">{r.peerGroupNotes}</p>
                    </div>
                  )}

                  {/* child voice — only if consulted and shared */}
                  {r.childVoiceConsulted && r.childVoice && (
                    <div className="rounded-md bg-rose-50 border border-rose-200 p-3">
                      <h4 className="text-xs font-semibold text-rose-700 mb-1">Child&apos;s voice (consulted)</h4>
                      <p className="text-sm italic text-rose-900">&ldquo;{r.childVoice}&rdquo;</p>
                    </div>
                  )}

                  {/* staff observation */}
                  <div className="rounded-md bg-slate-50 border border-slate-200 p-3">
                    <h4 className="text-xs font-semibold text-slate-700 mb-1">Staff observation</h4>
                    <p className="text-sm text-slate-900">{r.staffObservation}</p>
                  </div>

                  {/* external consultation */}
                  {r.externalConsultation.length > 0 && (
                    <div className="rounded-md bg-violet-50 border border-violet-200 p-3">
                      <h4 className="text-xs font-semibold text-violet-700 mb-1">External consultation</h4>
                      <ul className="text-sm text-violet-900 space-y-1.5">
                        {r.externalConsultation.map((c, i) => (
                          <li key={i} className="border-l-2 border-violet-300 pl-2">
                            <p className="font-medium">{c.agency}{c.clinician ? ` — ${c.clinician}` : ""} · {c.date}</p>
                            <p className="text-violet-800/90">{c.outcome}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* channel referral status */}
                  {r.channelReferralStatus && (
                    <div className="rounded-md bg-orange-50 border border-orange-200 p-3 inline-flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-900">Channel referral: <span className="font-medium">{r.channelReferralStatus}</span></span>
                    </div>
                  )}

                  {/* proportionality reflection — highlighted */}
                  <div className="rounded-md bg-gradient-to-br from-sky-50 to-teal-50 border-2 border-sky-300 p-4">
                    <h4 className="text-xs font-semibold text-sky-800 mb-1 flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4" /> Proportionality reflection
                    </h4>
                    <p className="text-sm text-sky-950 leading-relaxed">{r.proportionalityReflection}</p>
                  </div>

                  {/* flags for review */}
                  {r.flagsForReview.length > 0 && (
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Flags for review
                      </h4>
                      <ul className="list-disc list-inside text-sm text-amber-900 space-y-0.5">
                        {r.flagsForReview.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed bg-white p-8 text-center text-sm text-gray-500">
            No screenings match these filters.
          </div>
        )}
      </div>

      {/* ── regulatory footer ──────────────────────────────────────── */}
      <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-4 text-sm text-sky-900 mb-6">
        <strong>Regulatory framework.</strong> The Prevent duty is set out in the Counter-Terrorism and Security Act 2015 (s.26) and operationalised through the Prevent Duty Guidance (DfE, updated 2023) and the Channel Process (HMG 2020). Per-child screening is integrated with our wider safeguarding approach under KCSIE 2024 and Working Together to Safeguard Children 2023. We apply the duty in a way that is consistent with the Equality Act 2010 — particularly the protected characteristics of race and of religion or belief — and in awareness of successive David Anderson reviews of Prevent, which document the risks of disproportionate application. The screening contributes to evidence under the Children&apos;s Homes (England) Regulations 2015 — Quality Standard 9 (protection of children) — while honouring UNCRC Article 12 (the child&apos;s right to be heard), Article 14 (freedom of thought, conscience and religion) and Article 19 (protection from harm). This page exists to ensure the duty is applied; it exists equally to ensure it is not over-applied.
      </div>
    </PageShell>
  );
}
