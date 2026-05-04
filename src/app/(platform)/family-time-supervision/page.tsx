"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Search,
  Users,
  AlertTriangle,
  FileCheck,
  CalendarClock,
  Heart,
  ShieldCheck,
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

type Location = "Oak House" | "Family home" | "Contact centre" | "Public venue";
type SupervisionLevel = "Supervised" | "Supported" | "Unsupervised";
type Presentation = "Settled" | "Anxious" | "Excited" | "Withdrawn" | "Resistant";

interface FamilyTimeSession {
  id: string;
  youngPerson: string;
  date: string;
  time: string;
  durationMinutes: number;
  location: Location;
  familyMember: string;
  familyMemberName: string;
  supervisedBy: string;
  supervisionLevel: SupervisionLevel;
  childPresentationBefore: Presentation;
  childPresentationDuring: string;
  childPresentationAfter: string;
  interactionsObserved: string;
  warmthAffectionShown: string;
  boundaryIssues: string;
  concernsRaised: string[];
  positiveObservations: string[];
  childVoiceAfter: string;
  parentEngagement: string;
  giftsExchanged: string;
  foodSharedWho: string;
  wasItSafe: boolean;
  incidentsDuring: string;
  recommendationsForNext: string[];
  reportSentToSW: boolean;
  reportSentDate: string;
}

/* ── helpers ───────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const LEVEL_COLOURS: Record<SupervisionLevel, string> = {
  Supervised:   "bg-red-100 text-red-800",
  Supported:    "bg-amber-100 text-amber-800",
  Unsupervised: "bg-green-100 text-green-800",
};

const PRESENTATION_COLOURS: Record<Presentation, string> = {
  Settled:    "bg-green-100 text-green-800",
  Excited:    "bg-blue-100 text-blue-800",
  Anxious:    "bg-amber-100 text-amber-800",
  Withdrawn:  "bg-purple-100 text-purple-800",
  Resistant:  "bg-red-100 text-red-800",
};

const LOCATION_OPTIONS: Location[] = ["Oak House", "Family home", "Contact centre", "Public venue"];
const LEVEL_OPTIONS: SupervisionLevel[] = ["Supervised", "Supported", "Unsupervised"];

/* ── seed ──────────────────────────────────────────────────────────────── */

const SEED: FamilyTimeSession[] = [
  {
    id: "ft1",
    youngPerson: "yp_alex",
    date: d(-2),
    time: "14:00",
    durationMinutes: 90,
    location: "Contact centre",
    familyMember: "Mother",
    familyMemberName: "Michelle Thompson",
    supervisedBy: "staff_anna",
    supervisionLevel: "Supervised",
    childPresentationBefore: "Anxious",
    childPresentationDuring: "Initially reserved for the first 10 minutes, then warmed up. Sat next to mum while looking at family photos. Made good eye contact and laughed at shared memories. Spoke about college coursework with confidence.",
    childPresentationAfter: "Quiet on the journey back but not distressed. Said 'that was actually nice'. Ate a full evening meal and engaged well at handover.",
    interactionsObserved: "Mum asked open, age-appropriate questions about Alex's interests. Alex initiated showing photos on their phone. Reciprocal turn-taking in conversation. One short hug at the end — Alex initiated.",
    warmthAffectionShown: "Mum showed genuine warmth — used Alex's name often, listened actively, mirrored body language. Alex relaxed into the contact and smiled frequently in the second half.",
    boundaryIssues: "None observed. Mum stayed within the agreed conversation boundaries (no discussion of court proceedings or other family disputes).",
    concernsRaised: [],
    positiveObservations: [
      "Mum arrived 10 minutes early and well-presented",
      "Alex initiated physical affection (a hug)",
      "Conversation remained age-appropriate throughout",
      "Mum praised Alex's college progress sincerely",
    ],
    childVoiceAfter: "Alex said 'mum seems different — calmer'. Asked if next session could be longer. Wants to bring a college art project to show.",
    parentEngagement: "Excellent — fully present, no phone use, brought a memory album she had been working on.",
    giftsExchanged: "Mum brought a memory photo album (pre-approved by SW). Alex accepted it warmly.",
    foodSharedWho: "Shared a hot chocolate and brownie from the contact centre cafe — paid for by mum.",
    wasItSafe: true,
    incidentsDuring: "",
    recommendationsForNext: [
      "Extend session to 2 hours",
      "Allow Alex to bring art project",
      "Discuss progression to supported (rather than fully supervised) at next LAC review",
    ],
    reportSentToSW: true,
    reportSentDate: d(-1),
  },
  {
    id: "ft2",
    youngPerson: "yp_alex",
    date: d(-16),
    time: "14:00",
    durationMinutes: 60,
    location: "Contact centre",
    familyMember: "Father",
    familyMemberName: "Craig Thompson",
    supervisedBy: "staff_ryan",
    supervisionLevel: "Supervised",
    childPresentationBefore: "Resistant",
    childPresentationDuring: "Father attended 25 minutes late. Alex had become withdrawn during the wait. When dad arrived, Alex was monosyllabic. Dad spent much of the session on his phone. Alex eventually disengaged and asked to leave 20 minutes early.",
    childPresentationAfter: "Tearful and angry on return to Oak House. Withdrew to bedroom. Declined evening meal. Settled with key-worker support after 45 minutes.",
    interactionsObserved: "Limited reciprocal interaction. Dad did most of the talking, mostly about his own life. Alex responded with short answers. No physical affection shown by either party.",
    warmthAffectionShown: "Minimal warmth from dad — distracted and self-focused. Alex's body language was closed (arms crossed, leaning away).",
    boundaryIssues: "Dad referenced ongoing tension with mum twice — gently redirected by supervising staff each time.",
    concernsRaised: [
      "Father's repeated lateness (third time in four sessions)",
      "Excessive phone use during contact",
      "Inappropriate references to other parent",
      "Significant negative impact on Alex's emotional wellbeing post-contact",
    ],
    positiveObservations: [
      "Alex used appropriate self-advocacy by asking to leave early",
    ],
    childVoiceAfter: "Alex said 'I don't want to keep doing this if he can't even turn up on time'. Asked whether they have to attend if they don't want to. Wants this raised at the next LAC review.",
    parentEngagement: "Poor — late, distracted, self-focused. Boundary breaches required intervention.",
    giftsExchanged: "None.",
    foodSharedWho: "Dad bought himself a coffee. Did not offer Alex anything.",
    wasItSafe: true,
    incidentsDuring: "No safeguarding incident, but two boundary redirections required.",
    recommendationsForNext: [
      "Convene professionals meeting before next session",
      "Centre Alex's voice in deciding whether contact continues in current form",
      "Consider letterbox or supported-only arrangement",
      "Share concerns with IRO ahead of LAC review",
    ],
    reportSentToSW: true,
    reportSentDate: d(-15),
  },
  {
    id: "ft3",
    youngPerson: "yp_jordan",
    date: d(-4),
    time: "10:30",
    durationMinutes: 60,
    location: "Oak House",
    familyMember: "Brother (sibling)",
    familyMemberName: "Tyler (age 14)",
    supervisedBy: "staff_chervelle",
    supervisionLevel: "Supported",
    childPresentationBefore: "Excited",
    childPresentationDuring: "Bright and animated throughout. Showed Tyler around the lounge area and a recent art project. Both laughing and joking. Jordan's communication was noticeably better than usual — relaxed body language, age-appropriate turn-taking.",
    childPresentationAfter: "Happy and energised. Talked about Tyler throughout the rest of the day. Made a card to send him. Sleep settled.",
    interactionsObserved: "Strong sibling bond evident. Tyler took a caring older-brother role — asked Jordan how school was going and praised the artwork. Lots of natural humour. Both clearly value the connection.",
    warmthAffectionShown: "Genuine, easy warmth. A hug at greeting and another at goodbye, both initiated mutually.",
    boundaryIssues: "None.",
    concernsRaised: [],
    positiveObservations: [
      "Strong, protective sibling relationship",
      "Jordan's communication noticeably better in this context",
      "Tyler is encouraging and emotionally attuned",
      "Session ended with both asking when the next one would be",
    ],
    childVoiceAfter: "Jordan said 'Tyler is the best — can he come every weekend?'. Wants to plan a joint baking activity for next time.",
    parentEngagement: "N/A — sibling contact. Tyler's foster carer transported and waited in reception.",
    giftsExchanged: "Tyler brought a small drawing he had done for Jordan. Pre-approved.",
    foodSharedWho: "Shared squash and biscuits prepared by Jordan with key-worker support.",
    wasItSafe: true,
    incidentsDuring: "",
    recommendationsForNext: [
      "Plan joint baking activity for next session",
      "Increase frequency to fortnightly if SW agrees",
      "Explore overnight sibling stays (longer term goal)",
    ],
    reportSentToSW: true,
    reportSentDate: d(-3),
  },
  {
    id: "ft4",
    youngPerson: "yp_casey",
    date: d(-6),
    time: "11:00",
    durationMinutes: 75,
    location: "Public venue",
    familyMember: "Mother",
    familyMemberName: "Sarah Williams",
    supervisedBy: "staff_anna",
    supervisionLevel: "Supported",
    childPresentationBefore: "Excited",
    childPresentationDuring: "Initial joy and a long hug. Played in the park for about 20 minutes. In the second half mum became distracted by her phone — Casey responded by becoming louder, climbing higher than was safe, and seeking attention by pushing boundaries.",
    childPresentationAfter: "Tearful in the car. Did not want the session to end. Comfort-ate at dinner. Settled after a 1:1 with key worker, but emotionally dysregulated for the rest of the evening.",
    interactionsObserved: "Strong attachment evident. Mum's inconsistent attention is confusing and dysregulating for Casey. Casey is clearly attempting to maintain mum's focus through louder behaviour.",
    warmthAffectionShown: "Genuine warmth from both at the start and end. Mum's affection became distracted and intermittent in the middle of the session.",
    boundaryIssues: "Mum's phone use breached the contact agreement — gentle reminder given by supervising staff. Casey climbed too high on play equipment and was redirected.",
    concernsRaised: [
      "Mum's phone use during contact (recurring pattern)",
      "Casey's heightened, attention-seeking behaviour as a response",
      "Emotional dysregulation post-contact",
    ],
    positiveObservations: [
      "Genuine excitement and affection between Casey and mum",
      "Good initial play interaction",
      "Casey's attachment to mum is clearly evident",
    ],
    childVoiceAfter: "Casey said 'mum was on her phone again'. Wants mum to 'just play with me'. Also said 'I love seeing mummy'.",
    parentEngagement: "Mixed — engaged at start and end, distracted in the middle.",
    giftsExchanged: "Mum brought a small stuffed toy — checked against contact agreement, accepted.",
    foodSharedWho: "Shared an ice cream from a kiosk — bought by mum.",
    wasItSafe: true,
    incidentsDuring: "Boundary redirection re. phone use; play-equipment safety redirection.",
    recommendationsForNext: [
      "Update contact agreement to explicitly address phone use",
      "Plan a structured activity (less unstructured time)",
      "Build a consistent post-contact regulation routine for Casey",
    ],
    reportSentToSW: true,
    reportSentDate: d(-5),
  },
  {
    id: "ft5",
    youngPerson: "yp_casey",
    date: d(-1),
    time: "16:30",
    durationMinutes: 45,
    location: "Oak House",
    familyMember: "Maternal Grandmother",
    familyMemberName: "Margaret Williams",
    supervisedBy: "staff_mirela",
    supervisionLevel: "Supported",
    childPresentationBefore: "Settled",
    childPresentationDuring: "Calm, chatty and content throughout. Showed gran a school project. Gran asked about meals, sleep and friendships in a nurturing way. Casey laughed easily. They did a short jigsaw together.",
    childPresentationAfter: "Content and well-regulated. Asked when gran could come again. Good evening routine and bedtime.",
    interactionsObserved: "Warm, consistent, nurturing relationship. Gran provides emotional stability that mum currently cannot. Casey is visibly more regulated in her presence.",
    warmthAffectionShown: "Easy, natural physical affection — Casey sat close to gran throughout. Mutual hug at end.",
    boundaryIssues: "None.",
    concernsRaised: [],
    positiveObservations: [
      "Stable, nurturing relationship",
      "Casey is open and comfortable",
      "Gran is a clear protective factor",
      "Visibly improved emotional regulation in gran's presence",
    ],
    childVoiceAfter: "Casey said 'gran always asks me nice questions'. Asked if gran could come every week.",
    parentEngagement: "N/A — grandparent contact. Highly engaged and emotionally attuned.",
    giftsExchanged: "Gran brought a small notebook for Casey to draw in.",
    foodSharedWho: "Shared a snack of fruit and toast prepared together with key-worker support.",
    wasItSafe: true,
    incidentsDuring: "",
    recommendationsForNext: [
      "Increase to weekly if SW agrees",
      "Explore a short community trip (e.g. cafe) as the next step",
      "Identify gran formally as a protective factor in care plan",
    ],
    reportSentToSW: true,
    reportSentDate: d(-1),
  },
  {
    id: "ft6",
    youngPerson: "yp_jordan",
    date: d(-9),
    time: "13:00",
    durationMinutes: 90,
    location: "Family home",
    familyMember: "Mother",
    familyMemberName: "Donna Mason",
    supervisedBy: "staff_lackson",
    supervisionLevel: "Supervised",
    childPresentationBefore: "Withdrawn",
    childPresentationDuring: "Jordan was quiet on arrival. The home environment was disorganised and a third adult (not on the agreed contact list) was present briefly. Jordan asked twice when they could leave. Mum was warm but emotionally overwhelmed and cried at one point — Jordan tried to comfort her, which is a reversed parent–child dynamic.",
    childPresentationAfter: "Withdrawn for the rest of the day. Declined dinner but ate later with prompting. Difficult bedtime — needed extra reassurance.",
    interactionsObserved: "Reversed care-giving dynamic — Jordan in the role of comforting mum. Limited fun or play. Some genuine warmth but session weighted with adult emotional content.",
    warmthAffectionShown: "Mum was affectionate but emotionally dysregulated. Jordan's affection appeared protective rather than spontaneous.",
    boundaryIssues: "Unapproved third adult present at start of session — staff requested they leave, which they did within 5 minutes. Mum disclosed adult relationship difficulties in front of Jordan — redirected.",
    concernsRaised: [
      "Unapproved third party present at start of session",
      "Reversed parent-child emotional dynamic",
      "Adult content shared in front of Jordan",
      "Home environment disorganised",
      "Negative impact on Jordan's mood and bedtime routine",
    ],
    positiveObservations: [
      "Mum genuinely loves Jordan and wanted the contact to go well",
      "Jordan demonstrated empathy and emotional intelligence",
    ],
    childVoiceAfter: "Jordan said 'mum was sad and I didn't know what to do'. Said they would prefer to see mum at Oak House next time. Asked staff not to tell mum they said that.",
    parentEngagement: "Engaged but emotionally overwhelmed. Not currently able to hold the parental role for the duration of an unsupported session.",
    giftsExchanged: "None.",
    foodSharedWho: "Mum offered crisps and squash — shared with Jordan.",
    wasItSafe: true,
    incidentsDuring: "Unapproved third party — managed at the time. No safeguarding referral required, but recorded.",
    recommendationsForNext: [
      "Move next session back to Oak House (per Jordan's stated preference)",
      "Reinforce contact agreement with mum re. third parties and adult content",
      "Offer parenting support / signposting to mum",
      "Discuss session at next LAC review",
    ],
    reportSentToSW: true,
    reportSentDate: d(-8),
  },
];

/* ── export columns ───────────────────────────────────────────────────── */

const EXPORT_COLS: ExportColumn<FamilyTimeSession>[] = [
  { header: "Young Person",       accessor: (r: FamilyTimeSession) => getYPName(r.youngPerson) },
  { header: "Date",               accessor: (r: FamilyTimeSession) => r.date },
  { header: "Time",               accessor: (r: FamilyTimeSession) => r.time },
  { header: "Duration (mins)",    accessor: (r: FamilyTimeSession) => r.durationMinutes },
  { header: "Location",           accessor: (r: FamilyTimeSession) => r.location },
  { header: "Family Member",      accessor: (r: FamilyTimeSession) => r.familyMember },
  { header: "Family Member Name", accessor: (r: FamilyTimeSession) => r.familyMemberName },
  { header: "Supervised By",      accessor: (r: FamilyTimeSession) => getStaffName(r.supervisedBy) },
  { header: "Supervision Level",  accessor: (r: FamilyTimeSession) => r.supervisionLevel },
  { header: "Presentation Before",accessor: (r: FamilyTimeSession) => r.childPresentationBefore },
  { header: "Concerns",           accessor: (r: FamilyTimeSession) => r.concernsRaised.join("; ") },
  { header: "Positives",          accessor: (r: FamilyTimeSession) => r.positiveObservations.join("; ") },
  { header: "Child Voice After",  accessor: (r: FamilyTimeSession) => r.childVoiceAfter },
  { header: "Was It Safe",        accessor: (r: FamilyTimeSession) => (r.wasItSafe ? "Yes" : "No") },
  { header: "Report Sent to SW",  accessor: (r: FamilyTimeSession) => (r.reportSentToSW ? "Yes" : "No") },
  { header: "Report Sent Date",   accessor: (r: FamilyTimeSession) => r.reportSentDate },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function FamilyTimeSupervisionPage() {
  const [data] = useState<FamilyTimeSession[]>(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterChild, setFilterChild] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);

    const sessionsThisWeek = data.filter((s) => {
      const dt = new Date(s.date);
      return dt >= weekAgo && dt <= today;
    }).length;

    const childrenWithContact = new Set(data.map((s) => s.youngPerson)).size;
    const concernsRaised = data.reduce((acc, s) => acc + s.concernsRaised.length, 0);
    const reportsFiled = data.filter((s) => s.reportSentToSW).length;

    return { sessionsThisWeek, childrenWithContact, concernsRaised, reportsFiled };
  }, [data]);

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        getYPName(s.youngPerson).toLowerCase().includes(q) ||
        s.familyMemberName.toLowerCase().includes(q) ||
        s.familyMember.toLowerCase().includes(q),
      );
    }
    if (filterChild !== "all") list = list.filter((s) => s.youngPerson === filterChild);
    if (filterLevel !== "all") list = list.filter((s) => s.supervisionLevel === filterLevel);

    const out = [...list];
    switch (sortBy) {
      case "date_desc":
        out.sort((a, b) => b.date.localeCompare(a.date));
        break;
      case "date_asc":
        out.sort((a, b) => a.date.localeCompare(b.date));
        break;
      case "child":
        out.sort((a, b) => getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson)));
        break;
      case "concerns":
        out.sort((a, b) => b.concernsRaised.length - a.concernsRaised.length);
        break;
    }
    return out;
  }, [data, search, filterChild, filterLevel, sortBy]);

  return (
    <PageShell
      title="Family Time Supervision"
      subtitle="Detailed records of supervised family time (contact) sessions — interactions, child presentation, concerns and recommendations"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Family Time Supervision Records" />
          <ExportButton data={data} columns={EXPORT_COLS} filename="family-time-supervision" />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Sessions This Week",      value: stats.sessionsThisWeek,    icon: CalendarClock, colour: "text-blue-600" },
          { label: "Children with Contact",   value: stats.childrenWithContact, icon: Users,         colour: "text-indigo-600" },
          { label: "Concerns Raised",         value: stats.concernsRaised,      icon: AlertTriangle, colour: stats.concernsRaised > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Reports Filed",           value: stats.reportsFiled,        icon: FileCheck,     colour: "text-green-600" },
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

      {/* ── filters / sort ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search child or family member…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>

        <Select value={filterChild} onValueChange={setFilterChild}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {["yp_alex", "yp_jordan", "yp_casey"].map((id) => (
              <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {LEVEL_OPTIONS.map((lvl) => (
              <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Most Recent</SelectItem>
              <SelectItem value="date_asc">Oldest First</SelectItem>
              <SelectItem value="child">Child</SelectItem>
              <SelectItem value="concerns">Most Concerns</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((s) => {
          const open = expandedId === s.id;
          return (
            <div key={s.id} className="rounded-lg border bg-white">
              <button
                onClick={() => toggle(s.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Heart className="h-4 w-4 text-pink-500" />
                    <h3 className="font-semibold">
                      {getYPName(s.youngPerson)} — {s.familyMember} ({s.familyMemberName})
                    </h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", LEVEL_COLOURS[s.supervisionLevel])}>
                      {s.supervisionLevel}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", PRESENTATION_COLOURS[s.childPresentationBefore])}>
                      Before: {s.childPresentationBefore}
                    </span>
                    {s.concernsRaised.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {s.concernsRaised.length} concern{s.concernsRaised.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {s.reportSentToSW && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 inline-flex items-center gap-1">
                        <FileCheck className="h-3 w-3" /> SW notified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {s.date} · {s.time} · {s.durationMinutes} mins · {s.location} · supervised by {getStaffName(s.supervisedBy)}
                  </p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* key details */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Family Member:</span> <span className="font-medium">{s.familyMember}</span></div>
                    <div><span className="text-gray-500">Name:</span> <span className="font-medium">{s.familyMemberName}</span></div>
                    <div><span className="text-gray-500">Location:</span> <span className="font-medium">{s.location}</span></div>
                    <div><span className="text-gray-500">Duration:</span> <span className="font-medium">{s.durationMinutes} mins</span></div>
                  </div>

                  {/* presentation */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Child Presentation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">Before</p>
                        <p className="text-sm">{s.childPresentationBefore}</p>
                      </div>
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">During</p>
                        <p className="text-sm">{s.childPresentationDuring}</p>
                      </div>
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">After</p>
                        <p className="text-sm">{s.childPresentationAfter}</p>
                      </div>
                    </div>
                  </div>

                  {/* interactions / warmth / boundaries */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-md bg-blue-50 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Interactions Observed</h4>
                      <p className="text-sm text-blue-900">{s.interactionsObserved}</p>
                    </div>
                    <div className="rounded-md bg-pink-50 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Warmth &amp; Affection</h4>
                      <p className="text-sm text-pink-900">{s.warmthAffectionShown}</p>
                    </div>
                    <div className="rounded-md bg-purple-50 p-3">
                      <h4 className="text-xs font-semibold text-purple-700 mb-1">Boundary Issues</h4>
                      <p className="text-sm text-purple-900">{s.boundaryIssues || "None observed."}</p>
                    </div>
                  </div>

                  {/* positives / concerns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {s.positiveObservations.length > 0 && (
                      <div className="rounded-md bg-green-50 p-3">
                        <h4 className="text-xs font-semibold text-green-700 mb-1">Positive Observations</h4>
                        <ul className="list-disc list-inside text-sm text-green-800 space-y-0.5">
                          {s.positiveObservations.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                    )}
                    {s.concernsRaised.length > 0 && (
                      <div className="rounded-md bg-amber-50 p-3">
                        <h4 className="text-xs font-semibold text-amber-700 mb-1">Concerns Raised</h4>
                        <ul className="list-disc list-inside text-sm text-amber-800 space-y-0.5">
                          {s.concernsRaised.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* parent engagement / gifts / food / safety */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500 font-medium">Parent / Family Engagement:</span> {s.parentEngagement}</div>
                    <div className="inline-flex items-center gap-2">
                      <ShieldCheck className={cn("h-4 w-4", s.wasItSafe ? "text-green-600" : "text-red-600")} />
                      <span className="text-gray-500 font-medium">Was it safe?</span>
                      <span className={cn("font-medium", s.wasItSafe ? "text-green-700" : "text-red-700")}>
                        {s.wasItSafe ? "Yes" : "No"}
                      </span>
                    </div>
                    {s.giftsExchanged && (
                      <div><span className="text-gray-500 font-medium">Gifts Exchanged:</span> {s.giftsExchanged}</div>
                    )}
                    {s.foodSharedWho && (
                      <div><span className="text-gray-500 font-medium">Food Shared:</span> {s.foodSharedWho}</div>
                    )}
                  </div>

                  {/* incidents */}
                  {s.incidentsDuring && (
                    <div className="rounded-md bg-orange-50 border border-orange-200 p-3">
                      <h4 className="text-xs font-semibold text-orange-700 mb-1">Incidents During Session</h4>
                      <p className="text-sm text-orange-800">{s.incidentsDuring}</p>
                    </div>
                  )}

                  {/* child voice */}
                  {s.childVoiceAfter && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Child&apos;s Voice (After Session)</h4>
                      <p className="text-sm text-pink-800">{s.childVoiceAfter}</p>
                    </div>
                  )}

                  {/* recommendations */}
                  {s.recommendationsForNext.length > 0 && (
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Recommendations for Next Session</h4>
                      <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                        {s.recommendationsForNext.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* report status */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
                    <FileCheck className={cn("h-4 w-4", s.reportSentToSW ? "text-green-600" : "text-gray-400")} />
                    {s.reportSentToSW
                      ? <span>Report sent to social worker on <span className="font-medium">{s.reportSentDate}</span></span>
                      : <span className="text-amber-700 font-medium">Report not yet sent to social worker</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
            No family time sessions match the current filters.
          </div>
        )}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Regulatory basis:</strong> The Care Planning, Placement and Case Review (England) Regulations 2010 require that arrangements for promoting contact with the child&apos;s family and significant others are recorded and reviewed. Children&apos;s Homes (England) Regulations 2015 — Quality Standard 9 (Positive Relationships, Reg 11) — places a duty on the home to help children develop and maintain positive relationships, and to record interactions, child presentation and any concerns from supervised family time. Reports of supervised contact must be shared with the responsible local authority and inform the child&apos;s care plan and LAC review.
      </div>
    </PageShell>
  );
}
