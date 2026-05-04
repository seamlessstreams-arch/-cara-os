"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Shield,
  AlertTriangle,
  CheckCircle,
  Lock,
  Ear,
  MessageCircle,
  Heart,
  Phone,
  FileText,
  Clock,
  Eye,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── types ───────────────────────────────────────────────────────────────────
interface Disclosure {
  id: string;
  youngPerson: string;
  disclosureDate: string;
  disclosureTime: string;
  location: string;
  contextOfDisclosure: string;
  heardBy: string;
  disclosureSummary: string;
  disclosureType:
    | "Historical abuse"
    | "Recent harm"
    | "Concern about another"
    | "Self-harm"
    | "Online concern"
    | "Family concern"
    | "Peer concern"
    | "Other";
  childWordsUsed: string;
  staffResponseAtTime: string;
  reassuranceGiven: string;
  questionsAsked: "None — listened only" | "Open clarifying" | "Closed/leading — flagged";
  disclosureSeverity: "Low" | "Medium" | "High" | "Crisis";
  immediateActionsTaken: string[];
  reportedToDSL: boolean;
  reportedToDSLDate: string;
  reportedToLADO: boolean;
  reportedToPolice: boolean;
  referralsMade: string[];
  childInformedOfActions: boolean;
  childGivenAgency: string;
  supportProvidedToChild: string[];
  staffDebrief: boolean;
  parallelProcessNoted: string;
  status: "Active investigation" | "External agency leading" | "Closed - actioned" | "Monitoring";
}

// ── seed data ───────────────────────────────────────────────────────────────
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: Disclosure[] = [
  {
    id: "dis-001",
    youngPerson: "yp_alex",
    disclosureDate: d(-46),
    disclosureTime: "16:42",
    location: "Therapy room — post-session, soft chairs area",
    contextOfDisclosure:
      "Alex had just finished a CAMHS therapy session. The therapist had stepped out briefly. Alex was sitting quietly with Edward (key worker) doing nothing in particular — Edward had been mirroring Alex's calm and offering presence rather than conversation. Alex initiated the conversation themselves.",
    heardBy: "staff_edward",
    disclosureSummary:
      "Alex disclosed historical concerning behaviour by an adult family member dating to early childhood. Single, partial disclosure — Alex stopped when they wanted to and was not pressed for more. Anonymised summary held in safeguarding file; full detail in secure report to social worker only.",
    disclosureType: "Historical abuse",
    childWordsUsed:
      "\"There was someone who used to come round when I was little. They weren't supposed to do what they did. I never told anyone before. I don't want to talk about it more right now.\"",
    staffResponseAtTime:
      "Edward thanked Alex for trusting him. Said: 'I believe you. It wasn't your fault. You don't have to say anything more right now unless you want to. I have to tell Darren so we can keep you safe — is that okay?' Stayed sat next to Alex, did not move closer, did not touch.",
    reassuranceGiven:
      "Edward reassured Alex they were believed, that what they shared was not their fault, that Alex had done nothing wrong by waiting to tell, and that telling did not mean Alex had to talk about it again unless they chose to. Confirmed Alex remained safe at Oak House.",
    questionsAsked: "None — listened only",
    disclosureSeverity: "High",
    immediateActionsTaken: [
      "Edward did NOT ask probing questions — listened and reflected only",
      "Verbatim record made within 30 minutes (Edward stepped to office, Alex with second staff)",
      "Verbal report to RM (Darren) within the hour",
      "Written safeguarding referral to LA Social Worker (Sarah Mitchell) same day",
      "Alex offered choice of who would sit with them that evening — chose Edward",
      "Therapist informed (with Alex's consent) so therapy could hold the disclosure",
    ],
    reportedToDSL: true,
    reportedToDSLDate: d(-46),
    reportedToLADO: false,
    reportedToPolice: true,
    referralsMade: [
      "LA Children's Services — Social Worker Sarah Mitchell",
      "Police PVP referral via SW (joint decision after strategy meeting)",
      "CAMHS therapist informed with Alex's consent",
    ],
    childInformedOfActions: true,
    childGivenAgency:
      "Alex was asked at every stage what they wanted to happen. Alex chose: not to be interviewed by police immediately; for Edward to be present at any future conversation; to continue therapy; not to have contact with the named individual (already in place). Alex's pace was followed — strategy meeting outcome was that no current risk was present, so investigation could move at Alex's pace.",
    supportProvidedToChild: [
      "Continued therapy with same CAMHS therapist",
      "Increased key work sessions with Edward (Alex's choice)",
      "Independent advocate offered (Alex declined for now, knows it's available)",
      "Sleep routine support — Edward checked in at bedtime for first 2 weeks",
      "Information about NSPCC Letting the Future In service shared",
    ],
    staffDebrief: true,
    parallelProcessNoted:
      "Edward debriefed with RM next day — disclosure had affected him personally given strength of relationship with Alex. Reflective supervision booked for 1 week later. Edward continued to feel supported and able to maintain consistent care for Alex throughout.",
    status: "External agency leading",
  },
  {
    id: "dis-002",
    youngPerson: "yp_jordan",
    disclosureDate: d(-12),
    disclosureTime: "21:15",
    location: "Kitchen — making hot chocolate after football",
    contextOfDisclosure:
      "Jordan had returned from football club. Anna was making a hot chocolate. They were chatting about the match. Jordan went quiet, then said something that prompted Anna to put the milk down and give full attention.",
    heardBy: "staff_anna",
    disclosureSummary:
      "Jordan disclosed that an older peer at football club had been pressuring them to share their phone location and 'do favours' for older boys in the area. Jordan had not done anything but felt uncomfortable. Concern about peer-on-peer harm and possible early-stage exploitation indicators.",
    disclosureType: "Peer concern",
    childWordsUsed:
      "\"There's this lad, he's older, he keeps asking where I am. He said his mates would 'sort me out' if I helped them with stuff. I haven't done anything. I just don't want to go back if he's there.\"",
    staffResponseAtTime:
      "Anna sat down at the kitchen island. Said: 'Thank you for telling me. That sounds really uncomfortable. You did the right thing telling me. You don't have to go back if you don't want to. Can you tell me a bit more if you feel okay to, or we can leave it there?'",
    reassuranceGiven:
      "Anna reassured Jordan they had done absolutely the right thing by saying no and by telling. Made clear Jordan was not in trouble, this was not their fault, and that Anna's job was to help them stay safe. Confirmed Jordan would not be made to return to football until safe to do so.",
    questionsAsked: "Open clarifying",
    disclosureSeverity: "Medium",
    immediateActionsTaken: [
      "Anna asked open clarifying questions only (not who/where/when as leading) — flagged afterwards as good practice",
      "Verbatim record completed before end of shift",
      "RM notified by phone same evening (out of hours protocol)",
      "Online safety check completed with Jordan — phone reviewed with consent",
      "Football club attendance paused with Jordan's agreement",
      "Contextual safeguarding map updated next morning",
    ],
    reportedToDSL: true,
    reportedToDSLDate: d(-12),
    reportedToLADO: false,
    reportedToPolice: true,
    referralsMade: [
      "Social Worker (Tom Richards) — same day next morning",
      "Police neighbourhood team — intelligence report (named individual)",
      "Local CSE/exploitation team — contextual referral",
    ],
    childInformedOfActions: true,
    childGivenAgency:
      "Jordan helped decide what information to share with police and what to hold back. Jordan chose to make a statement once they had time to think. Football club return plan co-produced with Jordan over following week — Jordan asked to return with adult mentor present; agreed.",
    supportProvidedToChild: [
      "Adult mentor (football coach) briefed with Jordan's consent on safety plan",
      "Online safety key work session — Jordan's idea, picked own focus areas",
      "Increased availability of Anna and Edward for talking time",
      "Trusted Adult one-page profile updated with Jordan",
    ],
    staffDebrief: true,
    parallelProcessNoted:
      "Anna noted in supervision the importance of the unrushed kitchen moment — disclosure happened because of unhurried, ordinary care. Whole team shared learning at next team meeting (anonymised) — ordinary moments matter.",
    status: "Active investigation",
  },
  {
    id: "dis-003",
    youngPerson: "yp_casey",
    disclosureDate: d(-8),
    disclosureTime: "14:30",
    location: "Sensory room — during one-to-one art session",
    contextOfDisclosure:
      "Casey was using the sensory room for a planned art session with Chervelle. Casey was painting and humming. Chervelle was alongside, also painting. Casey communicated through a mix of words, drawings, and a visual emotion board they had been working on.",
    heardBy: "staff_chervelle",
    disclosureSummary:
      "Through drawing and the emotion board, Casey communicated a recent event of self-harm (scratching) that staff had not previously known about, and shared feelings of being overwhelmed by an upcoming health appointment. Disclosure was relational and visual rather than verbal.",
    disclosureType: "Self-harm",
    childWordsUsed:
      "Casey pointed to the 'overwhelmed' card on the emotion board, then drew an outline of an arm with marks on it, then pointed to themselves. Verbalised: \"too much.\" When Chervelle asked gently 'now or before?' Casey indicated 'before, last week.'",
    staffResponseAtTime:
      "Chervelle stayed alongside, kept painting at same pace, said: 'Thank you for showing me Casey. I'm glad I know. Can I see your arm if you want to show me, or we can wait?' Casey showed forearm — superficial scratches, healing, not requiring medical attention. Chervelle thanked Casey for sharing and asked what would help right now.",
    reassuranceGiven:
      "Chervelle communicated through words and the emotion board that Casey was not in trouble, that Chervelle was glad Casey had shared, and that they would work together to make the appointment less overwhelming. No surprise, no big reaction — calm, steady presence.",
    questionsAsked: "Open clarifying",
    disclosureSeverity: "Medium",
    immediateActionsTaken: [
      "Photograph of marks NOT taken without consent — body map record completed by Chervelle with Casey's agreement",
      "Verbal report to RM within 1 hour",
      "Health needs review — paediatrician contacted next day",
      "Risk assessment updated for self-harm — sensory and emotional triggers identified",
      "Casey and Chervelle co-produced an 'overwhelm plan' — visual, sensory tools",
      "Health appointment plan reworked with Casey's input — shorter, familiar adult attending",
    ],
    reportedToDSL: true,
    reportedToDSLDate: d(-8),
    reportedToLADO: false,
    reportedToPolice: false,
    referralsMade: [
      "Social Worker (Lisa Chen) — informed same day",
      "CAMHS — early help consultation requested",
      "Paediatrician — health context shared",
    ],
    childInformedOfActions: true,
    childGivenAgency:
      "Every action plan was checked back with Casey using the emotion board. Casey chose which adults to inform (Chervelle, Edward, Darren only). Casey designed their own overwhelm plan with sensory items they chose. Health appointment co-designed.",
    supportProvidedToChild: [
      "Daily check-ins using emotion board (Casey's choice)",
      "Sensory tools available in bedroom and sensory room",
      "Art therapy session frequency increased temporarily (Casey's request)",
      "Trusted adult plan refreshed",
      "Walk-in 'low-demand' time with Chervelle each day",
    ],
    staffDebrief: true,
    parallelProcessNoted:
      "Team reflected on power of relational, non-verbal disclosure. Chervelle's training in PACE and communication-friendly practice central to Casey feeling able to share. Staff team noted this is exactly what relational practice looks like.",
    status: "Monitoring",
  },
  {
    id: "dis-004",
    youngPerson: "yp_alex",
    disclosureDate: d(-3),
    disclosureTime: "22:50",
    location: "Bedroom doorway — bedtime routine",
    contextOfDisclosure:
      "Edward was doing bedtime check-in. Alex called Edward back as he was leaving. Edward returned, sat on the floor in the doorway (not entering bedroom), and Alex sat up in bed.",
    heardBy: "staff_edward",
    disclosureSummary:
      "Alex shared that they had been receiving messages on a gaming platform from someone they thought was a teenage boy but who had asked for personal photographs. Alex had not sent anything. Wanted advice and was worried about getting in trouble.",
    disclosureType: "Online concern",
    childWordsUsed:
      "\"There's this person on [game]. I thought they were my age but they keep asking weird stuff. They wanted a picture. I haven't sent anything but I didn't know what to do. Am I in trouble?\"",
    staffResponseAtTime:
      "Edward immediately said: 'You are not in trouble. Not even slightly. You did exactly the right thing telling me. Thank you for trusting me with this.' Stayed in the doorway, kept tone calm and quiet. Asked if Alex felt okay to talk now or if they wanted to sleep and talk in the morning.",
    reassuranceGiven:
      "Repeatedly reassured Alex they were not in trouble. Made clear that adults online targeting young people is the adult's wrongdoing, never the child's. Confirmed Alex's quick instinct (not sending) had kept them safe. Explained next steps in simple terms.",
    questionsAsked: "None — listened only",
    disclosureSeverity: "High",
    immediateActionsTaken: [
      "Alex offered choice — talk now or in morning. Chose 10 more minutes then sleep",
      "Device handed in voluntarily by Alex for safekeeping (not as punishment)",
      "Verbatim record completed by Edward before end of shift",
      "RM contacted next morning at 07:00 (not woken overnight as not immediate danger)",
      "CEOP referral submitted same day with Alex's understanding",
      "Account preserved (not deleted) — evidence retained",
    ],
    reportedToDSL: true,
    reportedToDSLDate: d(-2),
    reportedToLADO: false,
    reportedToPolice: true,
    referralsMade: [
      "CEOP (Child Exploitation and Online Protection)",
      "Social Worker (Sarah Mitchell)",
      "Police — joint with CEOP",
    ],
    childInformedOfActions: true,
    childGivenAgency:
      "Alex kept involved at each step. Alex chose how their device was handled, what username/account info was shared, and was told the timeline for police contact. Alex helped draft the simple statement of what happened — own words used in CEOP report (with Alex's review).",
    supportProvidedToChild: [
      "Replacement device discussed — Alex chose to wait",
      "Online safety key work refreshed — Alex chose their own focus",
      "Edward continued bedtime check-ins (Alex's request)",
      "Reassurance that account preservation does not mean Alex is being investigated",
    ],
    staffDebrief: true,
    parallelProcessNoted:
      "Edward reflected that the disclosure happened in a 'doorway moment' — the kind of low-pressure, just-leaving moment when children often share. Team learning shared anonymously: liminal moments matter; never rush a goodnight.",
    status: "External agency leading",
  },
  {
    id: "dis-005",
    youngPerson: "yp_jordan",
    disclosureDate: d(-29),
    disclosureTime: "10:20",
    location: "Car — driving back from contact visit",
    contextOfDisclosure:
      "Jordan was being driven back from a contact visit with extended family by Ryan. They had been driving in companionable silence for about 15 minutes. Jordan was looking out of the window.",
    heardBy: "staff_ryan",
    disclosureSummary:
      "Jordan shared a worry about a younger cousin they had seen at contact, describing things at home that did not sound right. Disclosure was about another child's wellbeing, not Jordan's own — but Jordan was clearly affected.",
    disclosureType: "Concern about another",
    childWordsUsed:
      "\"My cousin… something's not right there. He flinched when his dad came in the room. He's only seven. I don't want him to be like how it was for me.\"",
    staffResponseAtTime:
      "Ryan kept eyes on the road, lowered the radio, said: 'I'm really glad you told me Jordan. That took a lot. Tell me as much or as little as you want. We can do something with this — you're not the only one who has to hold it.' Did not push, did not promise outcomes Ryan couldn't deliver.",
    reassuranceGiven:
      "Ryan reassured Jordan that telling was the right thing for the cousin and for Jordan. Made clear Jordan would not be 'in trouble' with family for sharing, and explained that information could be shared with the right people who could help.",
    questionsAsked: "Open clarifying",
    disclosureSeverity: "Medium",
    immediateActionsTaken: [
      "Ryan stayed with the conversation for full drive — did not 'park it'",
      "Verbatim notes made on arrival at home, before any other tasks",
      "Verbal report to RM same morning",
      "Referral to LA where cousin lives — same day (different LA)",
      "Information shared with Jordan's SW (Tom Richards) for context",
      "Jordan offered key work time same evening — accepted",
    ],
    reportedToDSL: true,
    reportedToDSLDate: d(-29),
    reportedToLADO: false,
    reportedToPolice: false,
    referralsMade: [
      "Cousin's Local Authority Children's Services (different LA)",
      "Jordan's Social Worker (Tom Richards) — for context and Jordan's wellbeing",
    ],
    childInformedOfActions: true,
    childGivenAgency:
      "Jordan was kept informed of which agency had been told and what they would do, in proportionate terms. Jordan's worry about repercussions was named and worked with — confidentiality of source explained. Jordan asked how they could check the cousin was okay; Ryan was honest that Jordan would not get direct updates but explained what 'the system' would do.",
    supportProvidedToChild: [
      "Key work session focused on Jordan's own feelings (not just the cousin)",
      "Recognition that Jordan's disclosure showed protective instincts — strength named",
      "Therapist informed (with consent) — touched Jordan's own history",
      "Follow-up offered after one week to see how Jordan was holding it",
    ],
    staffDebrief: true,
    parallelProcessNoted:
      "Whole team reflected: a child carrying worry for another child is heavy. Jordan had to be allowed to put it down without being asked to be the rescuer. Ryan's car-drive practice (low-eye-contact, sideways listening) noted as best practice for young people who find face-to-face hard.",
    status: "Closed - actioned",
  },
];

// ── config ──────────────────────────────────────────────────────────────────
const severityColour: Record<string, string> = {
  Low: "bg-blue-100 text-blue-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-orange-100 text-orange-800",
  Crisis: "bg-red-100 text-red-800",
};

const statusColour: Record<string, string> = {
  "Active investigation": "bg-red-100 text-red-800",
  "External agency leading": "bg-purple-100 text-purple-800",
  "Closed - actioned": "bg-green-100 text-green-800",
  Monitoring: "bg-blue-100 text-blue-800",
};

const questionsColour: Record<string, string> = {
  "None — listened only": "bg-green-100 text-green-800",
  "Open clarifying": "bg-blue-100 text-blue-800",
  "Closed/leading — flagged": "bg-amber-100 text-amber-800",
};

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<Disclosure>[] = [
  { header: "Young Person", accessor: (r: Disclosure) => getYPName(r.youngPerson) },
  { header: "Date", accessor: (r: Disclosure) => r.disclosureDate },
  { header: "Time", accessor: (r: Disclosure) => r.disclosureTime },
  { header: "Type", accessor: (r: Disclosure) => r.disclosureType },
  { header: "Severity", accessor: (r: Disclosure) => r.disclosureSeverity },
  { header: "Heard By", accessor: (r: Disclosure) => getStaffName(r.heardBy) },
  { header: "Location", accessor: (r: Disclosure) => r.location },
  { header: "Questions Asked", accessor: (r: Disclosure) => r.questionsAsked },
  { header: "DSL Reported", accessor: (r: Disclosure) => (r.reportedToDSL ? "Yes" : "No") },
  { header: "Police Reported", accessor: (r: Disclosure) => (r.reportedToPolice ? "Yes" : "No") },
  { header: "LADO Reported", accessor: (r: Disclosure) => (r.reportedToLADO ? "Yes" : "No") },
  { header: "Status", accessor: (r: Disclosure) => r.status },
];

// ── component ───────────────────────────────────────────────────────────────
export default function DisclosureLogPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((r) => r.youngPerson === filterYP);
    if (filterType !== "all") items = items.filter((r) => r.disclosureType === filterType);
    if (filterSeverity !== "all") items = items.filter((r) => r.disclosureSeverity === filterSeverity);

    const severityOrder: Record<string, number> = { Crisis: 0, High: 1, Medium: 2, Low: 3 };

    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.disclosureDate.localeCompare(a.disclosureDate);
        case "severity":
          return severityOrder[a.disclosureSeverity] - severityOrder[b.disclosureSeverity];
        case "child":
          return a.youngPerson.localeCompare(b.youngPerson);
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, filterType, filterSeverity, sortBy]);

  // ── stats ─────────────────────────────────────────────────────────────────
  const activeDisclosures = data.filter(
    (r) => r.status === "Active investigation" || r.status === "External agency leading",
  ).length;
  const quarterStart = d(-90);
  const thisQuarter = data.filter((r) => r.disclosureDate >= quarterStart).length;
  const policeReported = data.filter((r) => r.reportedToPolice).length;
  const externalAgencies = data.filter((r) => r.referralsMade.length > 0).length;

  return (
    <PageShell
      title="Disclosure Log"
      subtitle="Safeguarding disclosures by children — what was said, the context, and how staff responded"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="disclosure-log" />
          <PrintButton title="Disclosure Log" />
        </div>
      }
    >
      {/* ── confidentiality banner ────────────────────────────────────── */}
      <div className="rounded-lg bg-red-50 border-2 border-red-300 p-4 mb-6 flex items-start gap-3">
        <Lock className="h-5 w-5 text-red-700 mt-0.5 shrink-0" />
        <div className="text-sm text-red-900 space-y-1">
          <p className="font-semibold">Strictly Confidential — Sensitive Content</p>
          <p>
            This log contains anonymised summaries of safeguarding disclosures made by children. Detail is
            recorded sensitively, on a need-to-know basis, and the child&apos;s actual words are preserved only
            where it supports their voice and the safeguarding response. Full case detail is held in secure
            records shared only with the allocated social worker, DSL, and statutory agencies. Children are
            informed about who knows what, in age-appropriate terms.
          </p>
        </div>
      </div>

      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{activeDisclosures}</p>
          <p className="text-xs text-muted-foreground">Active Disclosures</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{thisQuarter}</p>
          <p className="text-xs text-muted-foreground">This Quarter</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{policeReported}</p>
          <p className="text-xs text-muted-foreground">Police-Reported</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{externalAgencies}</p>
          <p className="text-xs text-muted-foreground">External Agencies Involved</p>
        </div>
      </div>

      {/* ── practice reminder banner ──────────────────────────────────── */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-6 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          <strong>Practice reminder:</strong> Listen, do not lead. Believe the child. Record verbatim as soon as
          possible. Tell the DSL. Keep the child informed in age-appropriate terms. Never promise confidentiality
          you cannot keep.
        </p>
      </div>

      {/* ── filters/sort ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Children" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Historical abuse">Historical abuse</SelectItem>
            <SelectItem value="Recent harm">Recent harm</SelectItem>
            <SelectItem value="Concern about another">Concern about another</SelectItem>
            <SelectItem value="Self-harm">Self-harm</SelectItem>
            <SelectItem value="Online concern">Online concern</SelectItem>
            <SelectItem value="Family concern">Family concern</SelectItem>
            <SelectItem value="Peer concern">Peer concern</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Severities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Crisis">Crisis</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="severity">By Severity</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── disclosure cards ──────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No disclosures match your filters.</div>
        )}
        {filtered.map((rec) => {
          const isExpanded = expandedId === rec.id;

          return (
            <div key={rec.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : rec.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Ear className="h-5 w-5 text-red-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {rec.disclosureType} &middot; {getYPName(rec.youngPerson)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {rec.disclosureDate} {rec.disclosureTime} &middot; {rec.location.split(" — ")[0]} &middot;
                      Heard by {getStaffName(rec.heardBy)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      severityColour[rec.disclosureSeverity],
                    )}
                  >
                    {rec.disclosureSeverity}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium hidden sm:inline-block",
                      statusColour[rec.status],
                    )}
                  >
                    {rec.status}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* context */}
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Eye className="h-3 w-3 inline mr-1" />
                      Context of Disclosure
                    </p>
                    <p className="text-sm">{rec.contextOfDisclosure}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Location: {rec.location} &middot; Time: {rec.disclosureTime}
                    </p>
                  </div>

                  {/* what child said */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">
                      <MessageCircle className="h-3 w-3 inline mr-1" />
                      Child&apos;s Own Words (recorded with sensitivity)
                    </p>
                    <p className="text-sm italic text-blue-900">{rec.childWordsUsed}</p>
                    <p className="text-xs text-blue-800 mt-2">
                      <strong>Anonymised summary:</strong> {rec.disclosureSummary}
                    </p>
                  </div>

                  {/* staff response */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Staff Response at the Time
                      </p>
                      <p className="text-sm">{rec.staffResponseAtTime}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <Heart className="h-3 w-3 inline mr-1" />
                        Reassurance Given
                      </p>
                      <p className="text-sm">{rec.reassuranceGiven}</p>
                    </div>
                  </div>

                  {/* questions / severity / type chips */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        questionsColour[rec.questionsAsked],
                      )}
                    >
                      Questions: {rec.questionsAsked}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                      Type: {rec.disclosureType}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        severityColour[rec.disclosureSeverity],
                      )}
                    >
                      Severity: {rec.disclosureSeverity}
                    </span>
                  </div>

                  {/* immediate actions */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Immediate Actions Taken
                    </p>
                    <ul className="space-y-1">
                      {rec.immediateActionsTaken.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* reporting */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div
                      className={cn(
                        "rounded-lg p-2 text-center text-xs border",
                        rec.reportedToDSL ? "bg-green-50 border-green-200" : "bg-slate-50",
                      )}
                    >
                      <Shield className="h-4 w-4 mx-auto mb-1" />
                      <p className="font-medium">DSL</p>
                      <p className="text-muted-foreground">
                        {rec.reportedToDSL ? rec.reportedToDSLDate : "—"}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "rounded-lg p-2 text-center text-xs border",
                        rec.reportedToPolice ? "bg-purple-50 border-purple-200" : "bg-slate-50",
                      )}
                    >
                      <Phone className="h-4 w-4 mx-auto mb-1" />
                      <p className="font-medium">Police</p>
                      <p className="text-muted-foreground">{rec.reportedToPolice ? "Reported" : "—"}</p>
                    </div>
                    <div
                      className={cn(
                        "rounded-lg p-2 text-center text-xs border",
                        rec.reportedToLADO ? "bg-amber-50 border-amber-200" : "bg-slate-50",
                      )}
                    >
                      <FileText className="h-4 w-4 mx-auto mb-1" />
                      <p className="font-medium">LADO</p>
                      <p className="text-muted-foreground">{rec.reportedToLADO ? "Reported" : "—"}</p>
                    </div>
                    <div
                      className={cn(
                        "rounded-lg p-2 text-center text-xs border",
                        rec.childInformedOfActions ? "bg-blue-50 border-blue-200" : "bg-slate-50",
                      )}
                    >
                      <MessageCircle className="h-4 w-4 mx-auto mb-1" />
                      <p className="font-medium">Child Informed</p>
                      <p className="text-muted-foreground">
                        {rec.childInformedOfActions ? "Yes" : "—"}
                      </p>
                    </div>
                  </div>

                  {/* referrals */}
                  {rec.referralsMade.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Referrals Made
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {rec.referralsMade.map((r, i) => (
                          <span
                            key={i}
                            className="text-xs bg-purple-50 text-purple-800 px-2 py-1 rounded-full"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* child agency */}
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-900 uppercase tracking-wide mb-1">
                      <Heart className="h-3 w-3 inline mr-1" />
                      Child&apos;s Voice &amp; Agency
                    </p>
                    <p className="text-sm text-green-900">{rec.childGivenAgency}</p>
                  </div>

                  {/* support */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Support Provided to Child
                    </p>
                    <ul className="space-y-1">
                      {rec.supportProvidedToChild.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Heart className="h-3 w-3 text-pink-500 mt-1 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* parallel process / staff debrief */}
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Staff Debrief &amp; Parallel Process
                    </p>
                    <p className="text-sm">{rec.parallelProcessNoted}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Formal debrief held: {rec.staffDebrief ? "Yes" : "No"}
                    </p>
                  </div>

                  {/* metadata */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>
                      <Clock className="h-3 w-3 inline mr-1" />
                      Recorded: {rec.disclosureDate} {rec.disclosureTime}
                    </span>
                    <span>Heard by: {getStaffName(rec.heardBy)}</span>
                    <span>Status: {rec.status}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Disclosure recording supports Working Together to Safeguard
          Children 2023, Children&apos;s Homes (England) Regulations 2015 Quality Standard 5 (protection of
          children), and Keeping Children Safe in Education principles for safeguarding response. Records
          capture the child&apos;s voice verbatim where appropriate, the staff response, the actions taken, and
          how the child was kept informed and given agency throughout. Detail is shared on a need-to-know basis
          with the DSL, allocated social worker, and statutory agencies only.
        </p>
      </div>
    </PageShell>
  );
}
