"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  Users,
  Star,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Camera,
  Award,
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

type EventType =
  | "Parents' evening"
  | "Options evening"
  | "Prize-giving / awards"
  | "Sports day"
  | "School production / play"
  | "Concert / performance"
  | "Leavers' assembly"
  | "Prom"
  | "Open evening (Y6/Y11)"
  | "PEP attendance"
  | "Subject taster / fair";

interface EventRecord {
  id: string;
  youngPerson: string;
  eventDate: string;
  eventType: EventType;
  schoolName: string;
  attendedBy: string[];
  birthFamilyAttended?: string;
  socialWorkerAttended: boolean;
  childWantedHomeAttendance: boolean;
  whatHappened: string;
  childAchievementsRecognised: string[];
  photosTakenWithConsent: boolean;
  photosLocation?: string;
  feedbackFromSchool: string;
  followUpActions: string[];
  childVoice: string;
  staffObservation: string;
  flagsConcerns: string[];
  recordedBy: string;
}

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

/* ── colour maps ───────────────────────────────────────────────────────── */

const EVENT_COLOURS: Record<EventType, string> = {
  "Parents' evening": "bg-teal-100 text-teal-800",
  "Options evening": "bg-indigo-100 text-indigo-800",
  "Prize-giving / awards": "bg-amber-100 text-amber-800",
  "Sports day": "bg-emerald-100 text-emerald-800",
  "School production / play": "bg-purple-100 text-purple-800",
  "Concert / performance": "bg-purple-100 text-purple-800",
  "Leavers' assembly": "bg-rose-100 text-rose-800",
  "Prom": "bg-pink-100 text-pink-800",
  "Open evening (Y6/Y11)": "bg-blue-100 text-blue-800",
  "PEP attendance": "bg-slate-100 text-slate-800",
  "Subject taster / fair": "bg-cyan-100 text-cyan-800",
};

/* ── seed ──────────────────────────────────────────────────────────────── */

const SEED: EventRecord[] = [
  {
    id: "ev1",
    youngPerson: "yp_casey",
    eventDate: d(-12),
    eventType: "Prize-giving / awards",
    schoolName: "Allestree Woodlands",
    attendedBy: ["staff_anna"],
    socialWorkerAttended: false,
    childWantedHomeAttendance: true,
    whatHappened: "Y6 SATs results assembly. Casey&apos;s class were called up by name and given a certificate and a small book token. Casey was visibly nervous beforehand — Anna sat in the second row so Casey could see her from the stage. When Casey&apos;s name was called she beamed, did a little wave to Anna, and walked tall back to her seat.",
    childAchievementsRecognised: [
      "Reading scaled score 110 (above expected)",
      "Maths scaled score 105 (expected)",
      "Form tutor read out a personal note about Casey&apos;s &quot;quiet kindness to new pupils&quot;",
    ],
    photosTakenWithConsent: true,
    photosLocation: "Casey&apos;s life-story box (printed copy) + secure care record",
    feedbackFromSchool: "Mrs Pritchard (form tutor): &quot;Casey has had the most settled term we&apos;ve seen. Whatever you&apos;re doing at home — keep doing it.&quot;",
    followUpActions: [
      "Print second copy of certificate for Casey&apos;s mum&apos;s next contact",
      "Mention in Casey&apos;s next PEP",
    ],
    childVoice: "I didn&apos;t want to do it but I&apos;m glad I did. When I saw Anna in the audience I wasn&apos;t scared anymore.",
    staffObservation: "Casey needed someone there. The certificate matters less than the moment of being seen. Sitting in row two — not the back — was deliberate; Casey could find me in 1 second from the stage.",
    flagsConcerns: [],
    recordedBy: "staff_anna",
  },
  {
    id: "ev2",
    youngPerson: "yp_casey",
    eventDate: d(-3),
    eventType: "Leavers' assembly",
    schoolName: "Allestree Woodlands",
    attendedBy: ["staff_anna", "staff_edward"],
    birthFamilyAttended: "Casey&apos;s mum could not attend (court-restricted to supervised contact only). She suggested via the SW that Casey bring a small framed photo of grandad and place it on an empty chair as a memorial gesture. Casey loved this idea.",
    socialWorkerAttended: true,
    childWantedHomeAttendance: true,
    whatHappened: "Y6 leavers&apos; assembly. Casey had specifically asked for both Anna AND Edward to come — &apos;I want a row of people&apos;. Grandad&apos;s framed photo sat on an empty seat between them, Casey&apos;s idea via her mum. Casey sang the leavers&apos; song without crying until the very last line, then was tearful but dignified. Walked out under the parents&apos; archway holding her certificate. Anna and Edward both clapped until their hands hurt.",
    childAchievementsRecognised: [
      "Head teacher&apos;s commendation for &quot;resilience and growth&quot;",
      "Year-group award for kindness (voted by peers)",
      "Solo line in the leavers&apos; song",
    ],
    photosTakenWithConsent: true,
    photosLocation: "Casey&apos;s memory box + life-story book + sent to mum via SW + framed copy for Casey&apos;s bedroom",
    feedbackFromSchool: "Head teacher came over afterwards specifically to thank both staff for being there. &quot;You didn&apos;t just send one — you sent her people.&quot;",
    followUpActions: [
      "Transition meeting with new secondary school next Tuesday",
      "Casey wants to write a thank-you card to Mrs Pritchard — order one this week",
      "Add the leavers&apos; song lyrics to Casey&apos;s memory box (her request)",
    ],
    childVoice: "Mum had a really good idea about grandad&apos;s chair. I felt like everyone was there. Even the people who couldn&apos;t come.",
    staffObservation: "Two staff at a leavers&apos; assembly is unusual but it was Casey&apos;s explicit request — and the right call. The grandad-chair gesture came from her mum, which Casey treasured. This is what corporate parenting actually looks like: showing up in numbers, holding space for the absent, and following the child&apos;s lead.",
    flagsConcerns: [
      "Casey has a wobble due — first big school transition since coming into care",
      "Anniversary of grandad&apos;s death falls 6 weeks before secondary school starts — plan support",
    ],
    recordedBy: "staff_anna",
  },
  {
    id: "ev3",
    youngPerson: "yp_jordan",
    eventDate: d(-45),
    eventType: "Prom",
    schoolName: "Highfields Academy",
    attendedBy: ["staff_anna"],
    socialWorkerAttended: false,
    childWantedHomeAttendance: true,
    whatHappened: "Y11 prom. Jordan went with Maya (his girlfriend — see first-relationship-support records). Anna helped with the suit fitting two weekends earlier (navy three-piece, Jordan picked it himself). Jordan was nervous about the photos — a long conversation about consent, who would see them, and what would happen if he didn&apos;t want them later. Anna dropped Jordan and Maya at the venue, was on standby in the car park for the first hour, and Jordan messaged at 9pm to say he was OK to stay till the end.",
    childAchievementsRecognised: [
      "Voted &quot;most improved&quot; by the year group (peer-voted award)",
      "Form tutor&apos;s personal speech mentioned Jordan by name for &quot;quiet leadership&quot;",
    ],
    photosTakenWithConsent: true,
    photosLocation: "Jordan&apos;s phone + printed copies in his bedroom + shared (with Jordan&apos;s consent) with mum and his older brother via WhatsApp",
    feedbackFromSchool: "Mr Begum (head of year): &quot;He&apos;s come a long way. Tonight he was just a kid at his prom. That matters.&quot;",
    followUpActions: [
      "Suit kept in Jordan&apos;s wardrobe — Anna offered to dry-clean and store, Jordan declined (&apos;I want to wear it again&apos;)",
      "Jordan asked about a college fresher&apos;s event — flag for August planning",
    ],
    childVoice: "Maya looked unreal. I looked alright. The DJ played the song we both like. I&apos;m gonna remember this when I&apos;m old.",
    staffObservation: "Standby-in-car-park is exactly the right level for a prom — present, not visible. Jordan did the consent conversation about photos like a young adult, not a child. The fact that he chose to share with mum AND his brother is significant — those relationships are healing in real time.",
    flagsConcerns: [],
    recordedBy: "staff_anna",
  },
  {
    id: "ev4",
    youngPerson: "yp_jordan",
    eventDate: d(-90),
    eventType: "Parents' evening",
    schoolName: "Highfields Academy",
    attendedBy: ["staff_anna"],
    birthFamilyAttended: "Imam Yusuf attended at the school&apos;s explicit invitation, which Jordan had requested through the SW. Imam is a known cultural mentor — see culture and identity records. Sat alongside Anna for all subject discussions.",
    socialWorkerAttended: false,
    childWantedHomeAttendance: true,
    whatHappened: "Y11 parents&apos; evening — full round of subject teachers. Jordan had specifically asked for Imam Yusuf to come (cultural mentor, mosque link). The school welcomed this and Imam sat as Jordan&apos;s &apos;extra adult&apos;. English teacher mentioned that Jordan&apos;s creative writing piece about Eid in Bradford had moved her — she is keeping a copy. Maths teacher confirmed Jordan is on track for Grade 6. Imam later wrote a reference letter for Jordan&apos;s college application.",
    childAchievementsRecognised: [
      "On track for Grade 6 in Maths",
      "Predicted Grade 7 in English Language",
      "Creative writing piece praised — &quot;the Eid piece&quot;",
      "Tutor commendation for attendance recovery (was 78%, now 96%)",
    ],
    photosTakenWithConsent: false,
    feedbackFromSchool: "Mr Begum: &quot;Bringing the Imam was the right call. We need to see who the team around him is.&quot;",
    followUpActions: [
      "Imam&apos;s reference letter referenced in college application — copy in Jordan&apos;s file",
      "English teacher to send copy of the Eid piece for life-story work",
      "Plan Y11 mock-exam wraparound support in Jordan&apos;s PEP",
    ],
    childVoice: "I wanted them to see I&apos;ve got more than one adult. Imam knows where I came from. Anna knows where I am now. Both matter.",
    staffObservation: "Jordan&apos;s instinct to bring Imam was sound and was honoured by the school. Corporate parenting is not just &apos;the home turns up&apos; — it is the whole team around the child being legible to the school. The Imam&apos;s reference letter is now load-bearing for the college place.",
    flagsConcerns: [],
    recordedBy: "staff_anna",
  },
  {
    id: "ev5",
    youngPerson: "yp_alex",
    eventDate: d(-160),
    eventType: "Options evening",
    schoolName: "Derby Alternative Provision",
    attendedBy: ["staff_anna"],
    socialWorkerAttended: true,
    childWantedHomeAttendance: true,
    whatHappened: "Y10 options evening / Y11 transition planning. Alex had been agonising for weeks — wanted to keep options open. Walked the room methodically: Sociology, English Lit, History, Psychology stalls all visited. Subject leads briefed in advance about Alex&apos;s preferred name and pronouns (school had it right). After two hours Alex chose A-level Sociology + English Lit + History. SW (Karen Holding) attended — first options-evening she had ever been to for a child on her caseload.",
    childAchievementsRecognised: [
      "Predicted Grade 7 in English Lit",
      "Predicted Grade 8 in History",
      "Sociology teacher invited Alex to a Y12 lesson as a &quot;clearly ready&quot; pupil",
    ],
    photosTakenWithConsent: false,
    feedbackFromSchool: "Subject leads all reported respectful, thoughtful conversations with Alex. The Sociology lead said &apos;Alex asked the questions a Y13 would ask&apos;.",
    followUpActions: [
      "Update PEP with subject choices",
      "Coordinate with college link teacher about A-level transition support",
      "Order the Sociology summer reading list",
    ],
    childVoice: "I&apos;m not just picking subjects — I&apos;m picking who I want to be. Sociology because I want to understand why the system did what it did to me. English Lit because words saved me. History because the past matters.",
    staffObservation: "This is the first options evening Karen (SW) has attended — she came because Anna asked her to. Three adults in Alex&apos;s corner, all hearing the same conversation. Alex chose subjects with deep reasoning. The pronouns and name were right on every staff lanyard — Anna had emailed ahead.",
    flagsConcerns: [],
    recordedBy: "staff_anna",
  },
  {
    id: "ev6",
    youngPerson: "yp_alex",
    eventDate: d(-22),
    eventType: "School production / play",
    schoolName: "Derby Alternative Provision",
    attendedBy: ["staff_anna", "staff_chervelle"],
    socialWorkerAttended: false,
    childWantedHomeAttendance: true,
    whatHappened: "School production of Antigone (sold-out final night). Alex played Haemon. Anna, Casey AND Jordan all attended — Casey had asked if she could come, Jordan offered to come too &apos;to fill out the row&apos;. Coach Khalid (community football coach, see external-relationships records) came after Alex personally invited him. Five seats together in the second row. Standing ovation at curtain. Alex visibly emotional during the bow — saw the row and waved.",
    childAchievementsRecognised: [
      "Lead supporting role (Haemon) — chosen by drama teacher from open auditions",
      "Memorised 240 lines",
      "Drama teacher mentioned Alex by name in the curtain speech",
    ],
    photosTakenWithConsent: true,
    photosLocation: "Alex&apos;s bedroom + life-story file + a printed copy on the kitchen fridge (&apos;family wall&apos;) at Alex&apos;s request",
    feedbackFromSchool: "Drama teacher (Ms Adeyemi) found Anna afterwards: &quot;Alex told me three weeks ago that &apos;the home would come&apos;. They came mob-handed. That&apos;s the line of the term.&quot;",
    followUpActions: [
      "Alex asked to keep the programme — laminated and in the memory box",
      "Casey wants to do drama club — discuss with Casey&apos;s school",
      "Send thank-you card to Ms Adeyemi from the home",
    ],
    childVoice: "I looked out and there were five of you. Five. I&apos;ve never had five before. I forgot my next line for a second because of it.",
    staffObservation: "Bringing the other young people was Anna&apos;s judgement call after Casey asked. It worked because Alex wanted it — checked first via the keyworker. The home turning up as a unit is the most powerful corporate parenting move we have. Coach Khalid being there alongside us widens the team-around-the-child visibly.",
    flagsConcerns: [],
    recordedBy: "staff_anna",
  },
  {
    id: "ev7",
    youngPerson: "yp_casey",
    eventDate: d(-60),
    eventType: "Sports day",
    schoolName: "Allestree Woodlands",
    attendedBy: ["staff_anna"],
    socialWorkerAttended: false,
    childWantedHomeAttendance: true,
    whatHappened: "Y6 sports day. Casey had a high-anxiety week leading up — sports days have historically been hard (a previous foster placement once forgot to attend). Anna was there from 9am. Ellie&apos;s mum Linda (Ellie is Casey&apos;s closest friend) came and sat next to Anna — they&apos;ve met before at the school gate and Linda had texted to suggest sitting together. Casey ran the 100m (came 4th), did the long jump, and joined the relay. Saw Anna and Linda cheering together for every event.",
    childAchievementsRecognised: [
      "Joint third in long jump",
      "Relay team came second",
      "Form tutor noted &quot;tried every event — last year wouldn&apos;t leave the bench&quot;",
    ],
    photosTakenWithConsent: true,
    photosLocation: "Casey&apos;s life-story album + sent to Linda for Ellie&apos;s side too",
    feedbackFromSchool: "PE teacher: &quot;Casey ran the relay anchor leg — that&apos;s the most exposed position. She volunteered.&quot;",
    followUpActions: [
      "Linda has invited Casey for tea on Saturday — Anna has already done the friend-family check",
      "Plan secondary-school sports-day prep — different format, will need a walk-through visit",
    ],
    childVoice: "Linda is Ellie&apos;s mum but she sat with Anna like they were a team. I had two people clapping. That&apos;s sometimes more than the kids who go home to their actual mum and dad.",
    staffObservation: "Linda sitting with Anna was not staged — it was offered. We accepted gladly. Casey&apos;s anxiety about sports day is rooted in the previous-placement no-show; the answer is consistent attendance over years, not reassurance in the moment. The friend-family integration with Ellie&apos;s family is one of the most protective factors in Casey&apos;s life.",
    flagsConcerns: [
      "Watch for sports-day anxiety pattern at new secondary — flag in transition handover",
    ],
    recordedBy: "staff_anna",
  },
];

/* ── flat row for export ───────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string;
  eventDate: string;
  eventType: string;
  schoolName: string;
  attendedBy: string;
  birthFamilyAttended: string;
  socialWorkerAttended: string;
  childWantedHomeAttendance: string;
  achievements: string;
  photosTakenWithConsent: string;
  photosLocation: string;
  feedbackFromSchool: string;
  followUpActions: string;
  childVoice: string;
  staffObservation: string;
  flagsConcerns: string;
  recordedBy: string;
}

const exportCols: ExportColumn<FlatRow>[] = [
  { header: "Young Person", accessor: (r: FlatRow) => r.youngPerson },
  { header: "Event Date", accessor: (r: FlatRow) => r.eventDate },
  { header: "Event Type", accessor: (r: FlatRow) => r.eventType },
  { header: "School", accessor: (r: FlatRow) => r.schoolName },
  { header: "Attended By (Home)", accessor: (r: FlatRow) => r.attendedBy },
  { header: "Birth Family Attended", accessor: (r: FlatRow) => r.birthFamilyAttended },
  { header: "Social Worker Attended", accessor: (r: FlatRow) => r.socialWorkerAttended },
  { header: "Child Wanted Home Attendance", accessor: (r: FlatRow) => r.childWantedHomeAttendance },
  { header: "Achievements", accessor: (r: FlatRow) => r.achievements },
  { header: "Photos w/ Consent", accessor: (r: FlatRow) => r.photosTakenWithConsent },
  { header: "Photos Location", accessor: (r: FlatRow) => r.photosLocation },
  { header: "School Feedback", accessor: (r: FlatRow) => r.feedbackFromSchool },
  { header: "Follow-up Actions", accessor: (r: FlatRow) => r.followUpActions },
  { header: "Child Voice", accessor: (r: FlatRow) => r.childVoice },
  { header: "Staff Observation", accessor: (r: FlatRow) => r.staffObservation },
  { header: "Flags / Concerns", accessor: (r: FlatRow) => r.flagsConcerns },
  { header: "Recorded By", accessor: (r: FlatRow) => r.recordedBy },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function ChildSchoolEngagementEventsPage() {
  const [data] = useState<EventRecord[]>(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  const toggle = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const yearStart = new Date();
    yearStart.setMonth(0, 1);
    const ytdISO = yearStart.toISOString().slice(0, 10);
    const eventsYTD = data.filter((r) => r.eventDate >= ytdISO).length;
    const photosKept = data.filter((r) => r.photosTakenWithConsent).length;
    const swAttended = data.filter((r) => r.socialWorkerAttended).length;
    const achievementsRecognised = data.reduce((acc, r) => acc + r.childAchievementsRecognised.length, 0);
    return { eventsYTD, photosKept, swAttended, achievementsRecognised };
  }, [data]);

  /* ── filter / sort ────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        getYPName(r.youngPerson).toLowerCase().includes(q) ||
        r.schoolName.toLowerCase().includes(q) ||
        r.eventType.toLowerCase().includes(q) ||
        r.whatHappened.toLowerCase().includes(q)
      );
    }
    if (filterType !== "all") list = list.filter((r) => r.eventType === filterType);
    const out = [...list];
    switch (sortBy) {
      case "date": out.sort((a, b) => b.eventDate.localeCompare(a.eventDate)); break;
      case "child": out.sort((a, b) => getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson))); break;
      case "type": out.sort((a, b) => a.eventType.localeCompare(b.eventType)); break;
      case "attendance": out.sort((a, b) => b.attendedBy.length - a.attendedBy.length); break;
    }
    return out;
  }, [data, search, filterType, sortBy]);

  /* ── export rows ──────────────────────────────────────────────────── */
  const exportRows = useMemo<FlatRow[]>(() =>
    data.map((r) => ({
      youngPerson: getYPName(r.youngPerson),
      eventDate: r.eventDate,
      eventType: r.eventType,
      schoolName: r.schoolName,
      attendedBy: r.attendedBy.map((s) => getStaffName(s)).join("; "),
      birthFamilyAttended: r.birthFamilyAttended ?? "",
      socialWorkerAttended: r.socialWorkerAttended ? "Yes" : "No",
      childWantedHomeAttendance: r.childWantedHomeAttendance ? "Yes" : "No",
      achievements: r.childAchievementsRecognised.join("; "),
      photosTakenWithConsent: r.photosTakenWithConsent ? "Yes" : "No",
      photosLocation: r.photosLocation ?? "",
      feedbackFromSchool: r.feedbackFromSchool,
      followUpActions: r.followUpActions.join("; "),
      childVoice: r.childVoice,
      staffObservation: r.staffObservation,
      flagsConcerns: r.flagsConcerns.join("; "),
      recordedBy: getStaffName(r.recordedBy),
    })), [data]);

  const eventTypes: EventType[] = [
    "Parents' evening", "Options evening", "Prize-giving / awards", "Sports day",
    "School production / play", "Concert / performance", "Leavers' assembly",
    "Prom", "Open evening (Y6/Y11)", "PEP attendance", "Subject taster / fair",
  ];

  return (
    <PageShell
      title="School Engagement Events"
      subtitle="Showing up — every parents&apos; evening, every prize-giving, every prom. Corporate parenting evidenced."
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="School Engagement Events" />
          <ExportButton data={exportRows} columns={exportCols} filename="school-engagement-events" />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Events attended (YTD)", value: stats.eventsYTD, icon: Calendar, colour: "text-teal-600" },
          { label: "Photos kept (with consent)", value: stats.photosKept, icon: Camera, colour: "text-amber-600" },
          { label: "Social worker attended", value: stats.swAttended, icon: Users, colour: "text-purple-600" },
          { label: "Achievements recognised", value: stats.achievementsRecognised, icon: Award, colour: "text-emerald-600" },
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
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 mb-6">
        <div className="flex items-start gap-2">
          <Star className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>The home shows up.</strong> Looked-after children should never be the child sitting alone at the leavers&apos; assembly or scanning the crowd at sports day for a face that doesn&apos;t come. This page records every school occasion the home attended, who else came, what the child achieved, and how it felt to them. Photos are kept only with the child&apos;s informed consent and stored where they choose.
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
            placeholder="Search by child, school, event, or detail…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[230px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All event types</SelectItem>
            {eventTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most recent</SelectItem>
              <SelectItem value="child">Child name</SelectItem>
              <SelectItem value="type">Event type</SelectItem>
              <SelectItem value="attendance">Attendance count</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── records ────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expandedId === r.id;
          const totalAttendees =
            r.attendedBy.length +
            (r.birthFamilyAttended ? 1 : 0) +
            (r.socialWorkerAttended ? 1 : 0);
          return (
            <div key={r.id} className="rounded-lg border border-amber-100 bg-white">
              <button
                onClick={() => toggle(r.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-amber-50/40"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Calendar className="h-4 w-4 text-teal-500" />
                    <h3 className="font-semibold">{getYPName(r.youngPerson)}</h3>
                    <span className="text-sm text-gray-600">— {r.schoolName}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", EVENT_COLOURS[r.eventType])}>{r.eventType}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-800 inline-flex items-center gap-1">
                      <Users className="h-3 w-3" /> {totalAttendees} attended
                    </span>
                    {r.photosTakenWithConsent && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                        <Camera className="h-3 w-3" /> Photos kept
                      </span>
                    )}
                    {r.childAchievementsRecognised.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                        <Award className="h-3 w-3" /> {r.childAchievementsRecognised.length} achievement{r.childAchievementsRecognised.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {r.eventDate} · From the home: {r.attendedBy.map((s) => getStaffName(s)).join(", ")} · Recorded by {getStaffName(r.recordedBy)}
                  </p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />}
              </button>

              {open && (
                <div className="border-t border-amber-100 px-4 pb-4 space-y-4">
                  {/* what happened */}
                  <div className="rounded-md bg-gray-50 p-3 mt-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">What happened</h4>
                    <p className="text-sm">{r.whatHappened}</p>
                  </div>

                  {/* who turned up */}
                  <div className="rounded-md bg-teal-50 border border-teal-200 p-3">
                    <h4 className="text-xs font-semibold text-teal-700 mb-1 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> Team around the child — who turned up
                    </h4>
                    <ul className="text-sm text-teal-900 space-y-0.5">
                      <li><span className="font-medium">From the home:</span> {r.attendedBy.map((s) => getStaffName(s)).join(", ")}</li>
                      {r.birthFamilyAttended && (
                        <li><span className="font-medium">Birth family:</span> {r.birthFamilyAttended}</li>
                      )}
                      <li><span className="font-medium">Social worker:</span> {r.socialWorkerAttended ? "Yes" : "Not on this occasion"}</li>
                      <li><span className="font-medium">Child wanted home there:</span> {r.childWantedHomeAttendance ? "Yes — explicitly requested" : "Did not specify"}</li>
                    </ul>
                  </div>

                  {/* achievements */}
                  {r.childAchievementsRecognised.length > 0 && (
                    <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
                      <h4 className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" /> Achievements recognised
                      </h4>
                      <ul className="list-disc list-inside text-sm text-emerald-900 space-y-0.5">
                        {r.childAchievementsRecognised.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* photos */}
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                      <Camera className="h-3.5 w-3.5" /> Photos
                    </h4>
                    {r.photosTakenWithConsent ? (
                      <p className="text-sm text-amber-900">
                        <span className="font-medium">Taken with consent.</span> Stored: {r.photosLocation ?? "location not recorded"}
                      </p>
                    ) : (
                      <p className="text-sm italic text-amber-700/70">No photos taken / kept on this occasion.</p>
                    )}
                  </div>

                  {/* school feedback + follow-ups */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-indigo-50 border border-indigo-200 p-3">
                      <h4 className="text-xs font-semibold text-indigo-700 mb-1">Feedback from school</h4>
                      <p className="text-sm text-indigo-900">{r.feedbackFromSchool}</p>
                    </div>
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Follow-up actions</h4>
                      {r.followUpActions.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-blue-900 space-y-0.5">
                          {r.followUpActions.map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                      ) : (
                        <p className="text-sm italic text-blue-700/70">No follow-up actions.</p>
                      )}
                    </div>
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

                  {/* flags */}
                  {r.flagsConcerns.length > 0 && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <h4 className="text-xs font-semibold text-red-700 mb-1">Flags / concerns</h4>
                      <ul className="list-disc list-inside text-sm text-red-900 space-y-0.5">
                        {r.flagsConcerns.map((f, i) => <li key={i}>{f}</li>)}
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
        <strong>Regulatory framework.</strong> Attendance at school events sits within the Statutory Guidance on Promoting the Education of Looked-After and Previously Looked-After Children (DfE 2018), the Children&apos;s Homes (England) Regulations 2015 — Quality Standard 5 (education) and Quality Standard 7 (positive relationships) — and the corporate parenting principles set out in the Children Act 2004 (as amended by the Children and Social Work Act 2017). UNCRC Article 12 (the right to be heard) and Article 28 (the right to education) underpin our practice. Photos are kept only with the child&apos;s informed consent and stored according to the home&apos;s privacy and life-story policy. The home turning up — in numbers, alongside birth family, social worker, mentors and friends&apos; families — is the visible evidence of corporate parenting in action.
      </div>
    </PageShell>
  );
}
