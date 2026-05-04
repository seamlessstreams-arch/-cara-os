"use client";

import { useState, useMemo } from "react";
import {
  Heart,
  Calendar,
  Star,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Sparkles,
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

type AnniversaryType =
  | "Entering care"
  | "Coming to this home"
  | "Leaving prior placement"
  | "Reuniting with sibling in care"
  | "Becoming a care leaver (18)"
  | "Pathway end (21 / 25)"
  | "Other significant date";

type ChildAttitude =
  | "Wants celebrated"
  | "Wants quietly noted"
  | "Wants ignored"
  | "Wants reflective space"
  | "Mixed / changes year by year"
  | "Not yet old enough to choose";

interface AnniversaryRecord {
  id: string;
  youngPerson: string;
  anniversaryType: AnniversaryType;
  significantDate: string;
  yearsSinceEvent: number;
  childAttitude: ChildAttitude;
  upcomingPlan?: string;
  pastApproachesUsed: string[];
  whatWorks: string[];
  whatDoesntWork: string[];
  triggersAroundDate: string[];
  supportInPlaceForDate: string[];
  childVoice: string;
  staffObservation: string;
  flagsForReview: string[];
  reviewDate: string;
  keyWorker: string;
}

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

/* ── colour maps ───────────────────────────────────────────────────────── */

const TYPE_COLOURS: Record<AnniversaryType, string> = {
  "Entering care": "bg-rose-100 text-rose-800",
  "Coming to this home": "bg-teal-100 text-teal-800",
  "Leaving prior placement": "bg-amber-100 text-amber-800",
  "Reuniting with sibling in care": "bg-emerald-100 text-emerald-800",
  "Becoming a care leaver (18)": "bg-indigo-100 text-indigo-800",
  "Pathway end (21 / 25)": "bg-purple-100 text-purple-800",
  "Other significant date": "bg-gray-100 text-gray-700",
};

const ATTITUDE_COLOURS: Record<ChildAttitude, string> = {
  "Wants celebrated": "bg-emerald-100 text-emerald-800",
  "Wants quietly noted": "bg-teal-100 text-teal-800",
  "Wants ignored": "bg-gray-100 text-gray-700",
  "Wants reflective space": "bg-rose-100 text-rose-800",
  "Mixed / changes year by year": "bg-amber-100 text-amber-800",
  "Not yet old enough to choose": "bg-blue-100 text-blue-800",
};

/* ── seed ──────────────────────────────────────────────────────────────── */

const SEED: AnniversaryRecord[] = [
  {
    id: "ca1",
    youngPerson: "yp_casey",
    anniversaryType: "Coming to this home",
    significantDate: d(45),
    yearsSinceEvent: 2,
    childAttitude: "Wants quietly noted",
    upcomingPlan: "Anna will give Casey a small thoughtful gesture — this year a hand-bound notebook in her favourite colour. Last year was a butterfly hairclip Casey had been quietly admiring. No cake, no balloons, no announcements — just a small moment between Casey and Anna over hot chocolate after school.",
    pastApproachesUsed: [
      "Year 1 — handmade card from Anna left on Casey&apos;s pillow, hot chocolate after school",
      "Year 2 — butterfly hairclip Casey had wanted, given quietly during their usual one-to-one walk",
    ],
    whatWorks: [
      "Small, thoughtful, personal — something Casey has noticed and quietly wanted",
      "Given by Anna alone, not with the whole staff team present",
      "No mention of &apos;anniversary&apos; or &apos;celebration&apos; — framed as &apos;I was thinking of you&apos;",
      "Hot chocolate ritual provides a gentle container",
    ],
    whatDoesntWork: [
      "Cake — sensory overwhelm and complicated feelings about birthdays-vs-this",
      "Balloons or any &apos;party&apos; signalling — Casey associates with arrival day trauma",
      "Group acknowledgement at handover — Casey shrinks visibly",
      "Cards from staff who haven&apos;t built deep relationship yet — feels performative",
    ],
    triggersAroundDate: [
      "Sleep can become unsettled in the week leading up",
      "Increased sensitivity to changes in routine on the day itself",
      "May ask repeated questions about why she came into care",
    ],
    supportInPlaceForDate: [
      "Anna on shift on the day where possible (planned 6 weeks ahead)",
      "Reduced sensory load that evening — no visitors, lighter dinner, calm wind-down",
      "Therapy session pre-arranged for the week after if Casey wants it",
      "Flexibility on school attendance the day before if Casey is struggling",
    ],
    childVoice: "I don&apos;t want a fuss. I just want Anna to know that she knows. That&apos;s enough.",
    staffObservation: "Casey&apos;s preference has been consistent for two years — quiet acknowledgement, one trusted adult, something small and personally chosen. The fact that she wants the date noted at all (rather than ignored) is meaningful — she is integrating her arrival here as part of her story.",
    flagsForReview: [
      "Check preference again 4 weeks before — may shift as Casey matures",
      "Coordinate Anna&apos;s shift pattern around the date",
    ],
    reviewDate: d(28),
    keyWorker: "staff_anna",
  },
  {
    id: "ca2",
    youngPerson: "yp_casey",
    anniversaryType: "Entering care",
    significantDate: d(120),
    yearsSinceEvent: 3,
    childAttitude: "Wants ignored",
    pastApproachesUsed: [
      "Year 1 — staff did not mention the date but were extra warm and available all week",
      "Year 2 — same approach, with Anna making sure she was on shift the day itself without Casey knowing why",
    ],
    whatWorks: [
      "Active non-marking — the date passes without acknowledgement to Casey",
      "Quiet staff awareness — extra warmth, extra patience, extra availability that week",
      "Anna or Chervelle on shift if at all possible — known, trusted faces",
      "No log entries that Casey could see referring to the date",
    ],
    whatDoesntWork: [
      "Asking Casey if she wants to talk about it — this re-traumatises",
      "Treating the day as &apos;normal&apos; in a way that misses her cues",
      "Mentioning it in handovers within Casey&apos;s earshot",
    ],
    triggersAroundDate: [
      "The date itself is associated with the police visit and removal from her mum",
      "Anniversary reactions can show as withdrawal, irritability, or somatic complaints",
      "School can feel harder that week",
    ],
    supportInPlaceForDate: [
      "Staff briefing one week prior — quiet, sensitive, no involvement of Casey",
      "Reduced expectation around homework / chores that week",
      "Anna available for one-to-one time if Casey initiates — she rarely does, but the door is open",
      "Therapist informed of date so any spike in sessions can be contextualised",
    ],
    childVoice: "I don&apos;t want anyone to know. I just want it to go past. I&apos;ll be ok if no one says anything.",
    staffObservation: "This is a date Casey has explicitly asked us NOT to mark. We honour that. The team holds the date silently and adjusts the environment around her without her knowing why. This is care done well — invisible to the child, deeply intentional behind the scenes.",
    flagsForReview: [
      "Re-confirm preference annually — never assume",
      "Do NOT enter date into any system that surfaces it back to Casey",
    ],
    reviewDate: d(90),
    keyWorker: "staff_anna",
  },
  {
    id: "ca3",
    youngPerson: "yp_jordan",
    anniversaryType: "Coming to this home",
    significantDate: d(60),
    yearsSinceEvent: 4,
    childAttitude: "Wants celebrated",
    upcomingPlan: "A small home-style celebration — Jordan&apos;s favourite meal cooked together (chicken biryani, recipe from his aunty in Bradford). Mum sends a voice note that Jordan plays at the table. A card signed by all the staff. A small gift Jordan has chosen with Anna in advance (this year — new football boots).",
    pastApproachesUsed: [
      "Year 1 — Jordan asked for biryani and a film night — staff and Jordan only",
      "Year 2 — biryani plus video call with mum during dinner",
      "Year 3 — biryani, voice note from mum, and Jordan invited a school friend over for the first time",
    ],
    whatWorks: [
      "Treating it like a small birthday — Jordan&apos;s framing, not staff&apos;s",
      "Food from his cultural heritage — biryani every year, non-negotiable",
      "Mum&apos;s voice in some form — voice note, video, letter — keeps her present",
      "Jordan choosing the gift with Anna in advance, not surprise",
    ],
    whatDoesntWork: [
      "Anything that frames coming into care as sad on this particular day — Jordan has integrated this date as a happy one and we follow his lead",
      "Forgetting — the year a previous staff member missed it Jordan was visibly hurt",
    ],
    triggersAroundDate: [
      "Jordan can dip in the few days after — &apos;the high&apos; passing",
      "Sometimes brings up bigger questions about his early years",
    ],
    supportInPlaceForDate: [
      "Coordinated with mum 3 weeks ahead so her voice note arrives in time",
      "Anna on shift for the meal",
      "Cultural mentor sent a card for the first time last year — Jordan loved it",
      "Quiet check-in two days after for any low mood",
    ],
    childVoice: "It&apos;s like my second birthday. The day I got to a place that felt safe. I want biryani and I want mum&apos;s voice and I want it to feel like a yes-day.",
    staffObservation: "Jordan&apos;s relationship to this date is positive and integrated — he frames Oak House as a turning point in his story. Honouring his celebratory framing is itself trauma-informed practice. The presence of his mum&apos;s voice each year keeps the connection alive without competing with the placement.",
    flagsForReview: [
      "Mum&apos;s voice note coordination — confirm 3 weeks ahead",
      "Quiet check-in scheduled 2 days post-event",
    ],
    reviewDate: d(35),
    keyWorker: "staff_chervelle",
  },
  {
    id: "ca4",
    youngPerson: "yp_jordan",
    anniversaryType: "Becoming a care leaver (18)",
    significantDate: d(310),
    yearsSinceEvent: 0,
    childAttitude: "Wants quietly noted",
    upcomingPlan: "Jordan has been clear from a young age — &apos;a real flat key, a real cup of tea, no fuss&apos;. Planning is underway. The team has begun arranging for Jordan&apos;s flat keys (semi-independent provision is identified) to be presented at home, with Anna and Chervelle, with one cup of tea and one biscuit and no speeches.",
    pastApproachesUsed: [
      "(First time — Jordan turns 18 next year)",
    ],
    whatWorks: [
      "Honouring Jordan&apos;s explicit ask — understated, intimate, real",
      "Continuity of the people he trusts most — Anna and Chervelle",
      "Marking adulthood without the &apos;leaving&apos; framing — Oak House remains his",
      "Pathway plan signed off well in advance so the date itself is not about logistics",
    ],
    whatDoesntWork: [
      "Big gathering — Jordan finds them performative and overwhelming",
      "Speeches or formal presentations — feels like &apos;graduating out&apos; which he resents",
      "Treating the day as an ending — for Jordan it is a continuing",
    ],
    triggersAroundDate: [
      "The system framing of &apos;turning 18 = adult = on your own&apos; — Jordan has voiced fear of this",
      "Comparison to peers with families who do not face this transition",
    ],
    supportInPlaceForDate: [
      "Pathway plan finalised 3 months before — already in progress",
      "Staying-Put / staying-close arrangements being explored — Jordan to stay in regular contact",
      "Personal Adviser introduced in advance — relationship built before the date",
      "Mum&apos;s voice note tradition continues — not ending with 18",
      "Mental health step-up plan agreed with CAMHS / adult services bridging team",
    ],
    childVoice: "I don&apos;t want a party. I want a real flat key and a real cup of tea and to know that you lot are still my people after.",
    staffObservation: "Jordan&apos;s 18th approaches with anxiety the system creates rather than the day itself. Our task is to make sure the date feels like continuity not severance. His explicit ask — &apos;you lot are still my people after&apos; — is the entire frame for the planning.",
    flagsForReview: [
      "Pathway plan sign-off 3 months out",
      "Personal Adviser introduction at 6 months out",
      "Confirm Anna and Chervelle shift coverage on the day",
      "Coordinate with adult services bridging team",
    ],
    reviewDate: d(60),
    keyWorker: "staff_chervelle",
  },
  {
    id: "ca5",
    youngPerson: "yp_alex",
    anniversaryType: "Coming to this home",
    significantDate: d(80),
    yearsSinceEvent: 2,
    childAttitude: "Mixed / changes year by year",
    upcomingPlan: "Anna will read Alex&apos;s mood in the days before and follow Alex&apos;s lead. Three options held quietly in mind: (1) a long walk in the woods, (2) poetry alone in their room with hot chocolate brought up, (3) an early bedtime with no marking at all. Anna will not name the date — she will create the space and let Alex choose what to do with it.",
    pastApproachesUsed: [
      "Year 1 — Alex asked for a walk in the woods with Anna, mostly in silence — that was right that year",
      "Year 2 — Alex wanted to be alone in their room with poetry and hot chocolate — Anna brought the drink up and left",
    ],
    whatWorks: [
      "Anna reading the room and following Alex&apos;s lead — never assuming",
      "Holding multiple possible plans without needing Alex to choose in advance",
      "Not naming the date — letting Alex name it (or not)",
      "Allowing the response to be different every single year",
    ],
    whatDoesntWork: [
      "Asking Alex weeks ahead what they want — adds pressure they don&apos;t want",
      "Choosing one fixed approach — feels like staff need rather than Alex&apos;s need",
      "Anyone other than Anna initiating the day&apos;s tone",
    ],
    triggersAroundDate: [
      "Mood can be unpredictable — sometimes flat, sometimes raw, sometimes settled",
      "Sometimes the date passes without notice from Alex — and that is also valid",
      "Identity questions can surface — about the move, about what was lost, about who they are now",
    ],
    supportInPlaceForDate: [
      "Anna on shift the day itself and the day after",
      "Three pre-considered options held quietly in mind, not announced",
      "Poetry book on Alex&apos;s shelf restocked recently — small act of attention",
      "Therapy session available the week of, not pushed",
    ],
    childVoice: "Some years it feels like nothing. Some years it feels like everything. I don&apos;t know in advance which year it will be. Just be there and let me decide.",
    staffObservation: "Alex&apos;s shifting relationship to this date is itself the data. The team&apos;s task is to remain attuned and unattached to outcome — to hold space without filling it. Anna&apos;s capacity to read Alex on the day, every year, is the single most important factor. This kind of attunement cannot be scripted.",
    flagsForReview: [
      "Anna shift coverage — non-negotiable on the day",
      "Three-option plan reviewed at next supervision",
      "Therapist informed of date window",
    ],
    reviewDate: d(45),
    keyWorker: "staff_anna",
  },
  {
    id: "ca6",
    youngPerson: "yp_alex",
    anniversaryType: "Entering care",
    significantDate: d(200),
    yearsSinceEvent: 3,
    childAttitude: "Wants reflective space",
    pastApproachesUsed: [
      "Year 1 — Alex barely spoke that day; Anna sat with them on the sofa for an hour saying nothing",
      "Year 2 — Alex asked Anna for a check-in conversation; they talked about Alex&apos;s mum for the first time in a long while",
    ],
    whatWorks: [
      "Anna offering presence without agenda — &apos;I&apos;m here if you want&apos;",
      "Letting Alex initiate the conversation if they want one",
      "Reflective rather than celebratory — this is the day Alex was moved from mum&apos;s house",
      "Quiet environment — no visitors, low stimulation, soft lighting",
    ],
    whatDoesntWork: [
      "Pushing Alex to talk — they will not, and pushing damages trust",
      "Treating the day with cheer — this is a grief date for Alex",
      "Handing over to a staff member who doesn&apos;t know the weight of the date",
    ],
    triggersAroundDate: [
      "Memories of the safeguarding crisis that led to removal",
      "Complicated feelings about their mum — love, anger, longing, protection",
      "Sometimes nightmares in the week leading up",
      "Body-level distress — Alex has described it as &apos;heaviness in the chest&apos;",
    ],
    supportInPlaceForDate: [
      "Anna on shift, with explicit awareness of the date",
      "Soft handover note to next shift — &apos;today has been a heavy one for Alex&apos;",
      "Therapist appointment offered for the week of — Alex to choose",
      "Birth mum (Michelle) aware of the date and sends a short kind message every year — Alex has said this helps",
      "No visitors, no new staff, no demands that day",
    ],
    childVoice: "It&apos;s the day my life split in two. I don&apos;t want to celebrate that. I just want someone to know that I know, and to sit near me without making me talk.",
    staffObservation: "This date is a grief anniversary, not a placement anniversary. Alex&apos;s framing — &apos;the day my life split in two&apos; — is the truest description we have. NICE bereavement principles apply here: acknowledge, sit alongside, do not rush the process. Anna&apos;s presence without agenda is the intervention.",
    flagsForReview: [
      "Confirm with Michelle that her annual message is still welcomed",
      "Therapy slot held in the week of, not pushed",
      "Soft handover protocol shared with all staff on rota that week",
    ],
    reviewDate: d(150),
    keyWorker: "staff_anna",
  },
];

/* ── flat row for export ───────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string;
  anniversaryType: string;
  significantDate: string;
  yearsSinceEvent: number;
  childAttitude: string;
  upcomingPlan: string;
  reviewDate: string;
  keyWorker: string;
  childVoice: string;
  staffObservation: string;
}

const exportCols: ExportColumn<FlatRow>[] = [
  { header: "Young Person", accessor: (r: FlatRow) => r.youngPerson },
  { header: "Anniversary Type", accessor: (r: FlatRow) => r.anniversaryType },
  { header: "Significant Date", accessor: (r: FlatRow) => r.significantDate },
  { header: "Years Since Event", accessor: (r: FlatRow) => r.yearsSinceEvent },
  { header: "Child Attitude", accessor: (r: FlatRow) => r.childAttitude },
  { header: "Upcoming Plan", accessor: (r: FlatRow) => r.upcomingPlan },
  { header: "Review Date", accessor: (r: FlatRow) => r.reviewDate },
  { header: "Key Worker", accessor: (r: FlatRow) => r.keyWorker },
  { header: "Child Voice", accessor: (r: FlatRow) => r.childVoice },
  { header: "Staff Observation", accessor: (r: FlatRow) => r.staffObservation },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function ChildCareAnniversaryPage() {
  const [data] = useState<AnniversaryRecord[]>(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("upcoming");

  const toggle = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const tracked = data.length;
    const celebrated = data.filter((r) => r.childAttitude === "Wants celebrated").length;
    const today = new Date();
    const ninetyOut = new Date();
    ninetyOut.setDate(ninetyOut.getDate() + 90);
    const upcoming90 = data.filter((r) => {
      const dt = new Date(r.significantDate);
      return dt >= today && dt <= ninetyOut;
    }).length;
    const reviewsDue = data.filter((r) => r.reviewDate <= d(30)).length;
    return { tracked, celebrated, upcoming90, reviewsDue };
  }, [data]);

  /* ── filter / sort ────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        getYPName(r.youngPerson).toLowerCase().includes(q) ||
        r.anniversaryType.toLowerCase().includes(q) ||
        r.childAttitude.toLowerCase().includes(q) ||
        r.childVoice.toLowerCase().includes(q)
      );
    }
    if (filterType !== "all") list = list.filter((r) => r.anniversaryType === filterType);
    const out = [...list];
    switch (sortBy) {
      case "upcoming": out.sort((a, b) => a.significantDate.localeCompare(b.significantDate)); break;
      case "child": out.sort((a, b) => getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson))); break;
      case "type": out.sort((a, b) => a.anniversaryType.localeCompare(b.anniversaryType)); break;
      case "review": out.sort((a, b) => a.reviewDate.localeCompare(b.reviewDate)); break;
    }
    return out;
  }, [data, search, filterType, sortBy]);

  /* ── export rows ──────────────────────────────────────────────────── */
  const exportRows = useMemo<FlatRow[]>(() =>
    data.map((r) => ({
      youngPerson: getYPName(r.youngPerson),
      anniversaryType: r.anniversaryType,
      significantDate: r.significantDate,
      yearsSinceEvent: r.yearsSinceEvent,
      childAttitude: r.childAttitude,
      upcomingPlan: r.upcomingPlan ?? "",
      reviewDate: r.reviewDate,
      keyWorker: getStaffName(r.keyWorker),
      childVoice: r.childVoice,
      staffObservation: r.staffObservation,
    })), [data]);

  const annTypes: AnniversaryType[] = [
    "Entering care",
    "Coming to this home",
    "Leaving prior placement",
    "Reuniting with sibling in care",
    "Becoming a care leaver (18)",
    "Pathway end (21 / 25)",
    "Other significant date",
  ];

  return (
    <PageShell
      title="Child Care Anniversary"
      subtitle="Per-child, child-led acknowledgement of the dates that shape a young person&apos;s care story"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Care Anniversaries" />
          <ExportButton data={exportRows} columns={exportCols} filename="child-care-anniversary" />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Anniversaries tracked", value: stats.tracked, icon: Calendar, colour: "text-teal-600" },
          { label: "Celebrated each year", value: stats.celebrated, icon: Sparkles, colour: "text-emerald-600" },
          { label: "Upcoming (90 days)", value: stats.upcoming90, icon: Star, colour: stats.upcoming90 > 0 ? "text-rose-600" : "text-gray-400" },
          { label: "Reviews due (30d)", value: stats.reviewsDue, icon: Heart, colour: stats.reviewsDue > 0 ? "text-amber-600" : "text-gray-400" },
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
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 mb-6">
        <div className="flex items-start gap-2">
          <Heart className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong>Held with care, led by the child.</strong> Care anniversaries — the day a child entered care, came to this home, was separated from a parent, will leave care — can be tender, painful, joyful, or all three at once. We never assume. We ask, we listen, and we follow the child&apos;s lead every single year. A child&apos;s preference can change, and that is part of the work. This is distinct from staff placement anniversaries — this is the child&apos;s own story.
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
            placeholder="Search by child, type, or attitude…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[240px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All anniversary types</SelectItem>
            {annTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming first</SelectItem>
              <SelectItem value="child">Child name</SelectItem>
              <SelectItem value="type">Anniversary type</SelectItem>
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
            <div key={r.id} className="rounded-lg border border-teal-100 bg-white">
              <button
                onClick={() => toggle(r.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-teal-50/40"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Heart className="h-4 w-4 text-rose-400" />
                    <h3 className="font-semibold">{getYPName(r.youngPerson)}</h3>
                    <span className="text-sm text-gray-600">— {r.anniversaryType}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", TYPE_COLOURS[r.anniversaryType])}>{r.anniversaryType}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", ATTITUDE_COLOURS[r.childAttitude])}>{r.childAttitude}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 inline-flex items-center gap-1">
                      <Star className="h-3 w-3" /> {r.yearsSinceEvent} {r.yearsSinceEvent === 1 ? "year" : "years"} since
                    </span>
                    {r.flagsForReview.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 inline-flex items-center gap-1">
                        {r.flagsForReview.length} note{r.flagsForReview.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Date {r.significantDate} · Key worker {getStaffName(r.keyWorker)} · Review {r.reviewDate}
                  </p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />}
              </button>

              {open && (
                <div className="border-t border-teal-100 px-4 pb-4 space-y-4">
                  {/* date + years + attitude */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Significant date</h4>
                      <p className="text-sm font-medium">{r.significantDate}</p>
                    </div>
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Years since event</h4>
                      <p className="text-sm font-medium">{r.yearsSinceEvent} {r.yearsSinceEvent === 1 ? "year" : "years"}</p>
                    </div>
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Child&apos;s current attitude</h4>
                      <p className="text-sm font-medium">{r.childAttitude}</p>
                    </div>
                  </div>

                  {/* upcoming plan */}
                  <div className="rounded-md bg-teal-50 border border-teal-200 p-3">
                    <h4 className="text-xs font-semibold text-teal-700 mb-1 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" /> Plan for the upcoming date
                    </h4>
                    {r.upcomingPlan ? (
                      <p className="text-sm text-teal-900">{r.upcomingPlan}</p>
                    ) : (
                      <p className="text-sm italic text-teal-700/70">No active marking — the date is held quietly by the team and not surfaced to the child.</p>
                    )}
                  </div>

                  {/* child voice */}
                  <div className="rounded-md bg-rose-50 border border-rose-200 p-3">
                    <h4 className="text-xs font-semibold text-rose-700 mb-1">Child&apos;s voice</h4>
                    <p className="text-sm italic text-rose-900">&ldquo;{r.childVoice}&rdquo;</p>
                  </div>

                  {/* staff observation */}
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-xs font-semibold text-amber-700 mb-1">Staff observation</h4>
                    <p className="text-sm text-amber-900">{r.staffObservation}</p>
                  </div>

                  {/* past approaches */}
                  <div className="rounded-md bg-indigo-50 border border-indigo-200 p-3">
                    <h4 className="text-xs font-semibold text-indigo-700 mb-1">Past approaches used</h4>
                    <ul className="list-disc list-inside text-sm text-indigo-900 space-y-0.5">
                      {r.pastApproachesUsed.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>

                  {/* what works / what doesn't */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
                      <h4 className="text-xs font-semibold text-emerald-700 mb-1">What works</h4>
                      <ul className="list-disc list-inside text-sm text-emerald-900 space-y-0.5">
                        {r.whatWorks.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-rose-50 border border-rose-200 p-3">
                      <h4 className="text-xs font-semibold text-rose-700 mb-1">What doesn&apos;t work</h4>
                      <ul className="list-disc list-inside text-sm text-rose-900 space-y-0.5">
                        {r.whatDoesntWork.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* triggers + support */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                      <h4 className="text-xs font-semibold text-purple-700 mb-1">Triggers around the date</h4>
                      <ul className="list-disc list-inside text-sm text-purple-900 space-y-0.5">
                        {r.triggersAroundDate.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Support in place for the date</h4>
                      <ul className="list-disc list-inside text-sm text-blue-900 space-y-0.5">
                        {r.supportInPlaceForDate.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* flags */}
                  {r.flagsForReview.length > 0 && (
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1">Notes for review</h4>
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
            No records match these filters.
          </div>
        )}
      </div>

      {/* ── regulatory footer ──────────────────────────────────────── */}
      <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-4 text-sm text-teal-900 mb-6">
        <strong>Regulatory framework.</strong> Recognition of care anniversaries sits within the Children&apos;s Homes (England) Regulations 2015 — Quality Standard 6 (enjoyment &amp; achievement), Quality Standard 7 (positive relationships) and Quality Standard 8 (education). Practice is grounded in trauma-informed care, and in UNCRC Article 8 (right to identity), Article 12 (the right to be heard) and Article 16 (privacy and dignity). NICE NG196 bereavement guidance principles are applied to the grief-of-care experience — these dates are losses as well as milestones, and the child leads on whether, how, and when they are marked. A child&apos;s preference can change every year. We never assume a celebration is wanted.
      </div>
    </PageShell>
  );
}
