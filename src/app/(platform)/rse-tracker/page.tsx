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
  Heart,
  BookOpen,
  Shield,
  MessageCircle,
  Sparkles,
  Calendar,
  Users,
  HelpCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RseTopic =
  | "Healthy relationships"
  | "Consent"
  | "Online safety + relationships"
  | "Body changes/puberty"
  | "Boundaries"
  | "Identity (incl. LGBTQ+)"
  | "Family relationships"
  | "Friendship"
  | "Coping with peer pressure"
  | "Recognising harmful relationships";

type RseMethod =
  | "Conversation"
  | "Books/visual resources"
  | "External programme"
  | "Through school"
  | "Drawing/expressive";

interface RseRecord {
  id: string;
  youngPerson: string;
  date: string;
  topic: RseTopic;
  durationMinutes: number;
  deliveredBy: string;
  method: RseMethod;
  childInitiationOfTopic: boolean;
  keyConceptsCovered: string[];
  childContribution: string;
  questionsRaised: string[];
  followUp: string;
  parentalAwareness: string;
  curriculumLinkedTo: string;
  recordedBy: string;
  notes: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: RseRecord[] = [
  {
    id: "rse-001",
    youngPerson: "yp_alex",
    date: d(-6),
    topic: "Healthy relationships",
    durationMinutes: 35,
    deliveredBy: "staff_darren",
    method: "Conversation",
    childInitiationOfTopic: true,
    keyConceptsCovered: [
      "What makes a friendship feel safe vs unsafe",
      "Mutual respect and reciprocity",
      "Recognising when something feels off",
      "It's okay to step back from a relationship",
    ],
    childContribution:
      "Alex described a situation with a peer at boxing where he felt pressured. Articulated clearly what felt wrong and what good friendship looks like to him.",
    questionsRaised: [
      "How do you know if someone is a real friend?",
      "Is it bad to want time on your own?",
    ],
    followUp:
      "Revisit in 2 weeks — Alex working on naming feelings in the moment. Continue boxing peer reflections.",
    parentalAwareness:
      "Mum aware via fortnightly catch-up that healthy relationships work continues; specifics kept confidential per Alex's wishes.",
    curriculumLinkedTo: "DfE RSE Guidance — Respectful relationships, including friendships",
    recordedBy: "staff_darren",
    notes:
      "Alex initiated this — sign of growing trust. Conversation kept open-ended; no agenda forced.",
  },
  {
    id: "rse-002",
    youngPerson: "yp_jordan",
    date: d(-12),
    topic: "Consent",
    durationMinutes: 45,
    deliveredBy: "staff_chervelle",
    method: "External programme",
    childInitiationOfTopic: false,
    keyConceptsCovered: [
      "Consent must be enthusiastic, ongoing, freely given",
      "Right to say no at any point",
      "Consent in everyday situations (hugs, sharing, photos)",
      "Recognising pressure and coercion",
    ],
    childContribution:
      "Jordan engaged well with scenario discussion. Gave examples from football team about respecting teammates' choices. Asked thoughtful questions about online consent.",
    questionsRaised: [
      "What if someone changes their mind halfway?",
      "Does consent count if you've been drinking?",
      "How do you ask without it being awkward?",
    ],
    followUp:
      "Programme runs for 3 more sessions. Continue conversation at home about online consent specifically.",
    parentalAwareness:
      "Mum informed of programme attendance and themes; supportive. Detailed content shared in age-appropriate way.",
    curriculumLinkedTo: "DfE RSE Guidance — Being safe / Intimate and sexual relationships",
    recordedBy: "staff_chervelle",
    notes:
      "Brook external programme — high-quality delivery. Jordan comfortable with female facilitator.",
  },
  {
    id: "rse-003",
    youngPerson: "yp_casey",
    date: d(-9),
    topic: "Body changes/puberty",
    durationMinutes: 25,
    deliveredBy: "staff_anna",
    method: "Books/visual resources",
    childInitiationOfTopic: false,
    keyConceptsCovered: [
      "Bodies change at different times — all normal",
      "Names for body parts (correct, age-appropriate)",
      "Personal hygiene routines",
      "Privacy — own body, own choices",
    ],
    childContribution:
      "Casey followed the visual book closely. Pointed at images and asked yes/no questions. Took the book to keep in their room.",
    questionsRaised: [
      "Why does it happen?",
      "Will I look different?",
    ],
    followUp:
      "Re-read book together in 2 weeks. Anna to remain primary trusted adult for these conversations.",
    parentalAwareness:
      "Family informed where appropriate — social worker notified that puberty conversations have begun; aligns with care plan.",
    curriculumLinkedTo: "DfE RSE Guidance — Changing adolescent body / Health education",
    recordedBy: "staff_anna",
    notes:
      "Visual/book-led approach matched Casey's neurodivergent communication preferences. Calm, unhurried.",
  },
  {
    id: "rse-004",
    youngPerson: "yp_alex",
    date: d(-18),
    topic: "Online safety + relationships",
    durationMinutes: 30,
    deliveredBy: "staff_darren",
    method: "Conversation",
    childInitiationOfTopic: false,
    keyConceptsCovered: [
      "Who you talk to online vs offline",
      "Image sharing — once sent, you lose control",
      "Recognising grooming patterns",
      "Trusted adults to tell if something feels wrong",
    ],
    childContribution:
      "Alex shared that a stranger had messaged him on a gaming platform. Showed the message, blocked together. Articulated red flags well.",
    questionsRaised: [
      "Why do adults want to talk to kids online?",
      "What if I already replied?",
    ],
    followUp:
      "Reviewed device safety settings together. Re-check in 1 month. CAMHS informed for context.",
    parentalAwareness:
      "Mum informed of incident and protective response; reassured by Alex's disclosure.",
    curriculumLinkedTo: "DfE RSE Guidance — Online and media / KCSIE 2024 online safety",
    recordedBy: "staff_darren",
    notes:
      "Strong example of disclosure leading to protective action. Praised Alex for telling.",
  },
  {
    id: "rse-005",
    youngPerson: "yp_jordan",
    date: d(-25),
    topic: "Identity (incl. LGBTQ+)",
    durationMinutes: 40,
    deliveredBy: "staff_chervelle",
    method: "Conversation",
    childInitiationOfTopic: true,
    keyConceptsCovered: [
      "Sexuality and gender are diverse — all valid",
      "Heritage and identity intersect",
      "Allies and how to be one",
      "Home is a safe place to be yourself",
    ],
    childContribution:
      "Jordan asked about a teammate who came out as gay. Wanted to know how to be supportive. Reflected on cultural attitudes within own family.",
    questionsRaised: [
      "How do I know if I'm an ally and not just polite?",
      "What if family members say things that aren't okay?",
    ],
    followUp:
      "Continue heritage and identity conversations through cultural mentor. Cornerstone explicitly inclusive — reaffirmed.",
    parentalAwareness:
      "Family informed where appropriate — Mum aware Jordan exploring identity and inclusion themes; supportive.",
    curriculumLinkedTo: "DfE RSE Guidance — Respectful relationships including LGBTQ+ inclusion",
    recordedBy: "staff_chervelle",
    notes:
      "Jordan showed maturity and empathy. Cornerstone affirms all identities — visible in posters and language.",
  },
  {
    id: "rse-006",
    youngPerson: "yp_casey",
    date: d(-30),
    topic: "Boundaries",
    durationMinutes: 20,
    deliveredBy: "staff_anna",
    method: "Drawing/expressive",
    childInitiationOfTopic: false,
    keyConceptsCovered: [
      "My body, my rules",
      "Saying 'no' or 'stop' is always allowed",
      "Different rules for different people (family, friends, strangers)",
      "How to ask for space",
    ],
    childContribution:
      "Casey drew a circle around a stick figure of themselves and labelled 'my space'. Used drawing to indicate who is allowed close (Anna, Darren) and who isn't.",
    questionsRaised: [
      "What if someone won't listen?",
    ],
    followUp:
      "Display drawing in Casey's room as a self-advocacy tool. Practise saying 'stop' in role play.",
    parentalAwareness:
      "Family informed where appropriate — social worker aware boundary work continues per care plan.",
    curriculumLinkedTo: "DfE RSE Guidance — Being safe / Health education",
    recordedBy: "staff_anna",
    notes:
      "Drawing method very effective for Casey. Visual record now serves as ongoing reference.",
  },
  {
    id: "rse-007",
    youngPerson: "yp_alex",
    date: d(-40),
    topic: "Coping with peer pressure",
    durationMinutes: 30,
    deliveredBy: "staff_darren",
    method: "Through school",
    childInitiationOfTopic: false,
    keyConceptsCovered: [
      "Recognising pressure (direct and indirect)",
      "Strategies — pause, leave, name it, use a code word",
      "Real friends respect 'no'",
      "It's okay to walk away",
    ],
    childContribution:
      "Alex shared that PSHE class covered vaping pressure. Practised saying no without losing face. Identified two friends who would back him up.",
    questionsRaised: [
      "What do you do if your whole group is doing it?",
    ],
    followUp:
      "Code word agreed for Alex to text Darren if stuck — 'pickup'. Reviewed at next 1:1.",
    parentalAwareness:
      "Mum aware of school PSHE topics; reinforced messaging at home.",
    curriculumLinkedTo: "School PSHE / DfE RSE Guidance — Being safe",
    recordedBy: "staff_darren",
    notes:
      "School lesson reinforced at home — joined-up RSE delivery working well.",
  },
  {
    id: "rse-008",
    youngPerson: "yp_jordan",
    date: d(-50),
    topic: "Recognising harmful relationships",
    durationMinutes: 50,
    deliveredBy: "staff_chervelle",
    method: "External programme",
    childInitiationOfTopic: false,
    keyConceptsCovered: [
      "Signs of controlling behaviour",
      "Difference between conflict and abuse",
      "Coercive control — what it looks like at any age",
      "Where to get help — Childline, trusted adult, NSPCC",
    ],
    childContribution:
      "Jordan engaged with case studies. Articulated that manipulation can come from peers as well as partners. Identified Cornerstone staff and football coach as trusted adults.",
    questionsRaised: [
      "Can a friend be controlling, not just a partner?",
      "What if you feel sorry for the person?",
    ],
    followUp:
      "Programme continues — next session on healthy conflict resolution. Childline number on Jordan's phone.",
    parentalAwareness:
      "Family informed where appropriate — Mum aware Jordan attending Brook programme; specifics confidential.",
    curriculumLinkedTo: "DfE RSE Guidance — Being safe / Intimate relationships",
    recordedBy: "staff_chervelle",
    notes:
      "Brook external programme. Strong protective work given Jordan's age and developmental stage.",
  },
];

const topicColour: Record<string, string> = {
  "Healthy relationships": "bg-rose-100 text-rose-800",
  Consent: "bg-purple-100 text-purple-800",
  "Online safety + relationships": "bg-blue-100 text-blue-800",
  "Body changes/puberty": "bg-emerald-100 text-emerald-800",
  Boundaries: "bg-amber-100 text-amber-800",
  "Identity (incl. LGBTQ+)": "bg-pink-100 text-pink-800",
  "Family relationships": "bg-teal-100 text-teal-800",
  Friendship: "bg-cyan-100 text-cyan-800",
  "Coping with peer pressure": "bg-orange-100 text-orange-800",
  "Recognising harmful relationships": "bg-red-100 text-red-800",
};

const exportCols: ExportColumn<RseRecord>[] = [
  { header: "Young Person", accessor: (r: RseRecord) => getYPName(r.youngPerson) },
  { header: "Date", accessor: (r: RseRecord) => r.date },
  { header: "Topic", accessor: (r: RseRecord) => r.topic },
  { header: "Method", accessor: (r: RseRecord) => r.method },
  { header: "Duration (min)", accessor: (r: RseRecord) => `${r.durationMinutes}` },
  { header: "Delivered By", accessor: (r: RseRecord) => getStaffName(r.deliveredBy) },
  { header: "Child Initiated", accessor: (r: RseRecord) => (r.childInitiationOfTopic ? "Yes" : "No") },
  { header: "Curriculum Link", accessor: (r: RseRecord) => r.curriculumLinkedTo },
  { header: "Recorded By", accessor: (r: RseRecord) => getStaffName(r.recordedBy) },
];

export default function RseTrackerPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [filterTopic, setFilterTopic] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((r) => r.youngPerson === filterYP);
    if (filterTopic !== "all") items = items.filter((r) => r.topic === filterTopic);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "duration":
          return b.durationMinutes - a.durationMinutes;
        case "topic":
          return a.topic.localeCompare(b.topic);
        case "child":
          return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, filterTopic, sortBy]);

  const total = data.length;
  const uniqueTopics = new Set(data.map((r) => r.topic)).size;
  const uniqueChildren = new Set(data.map((r) => r.youngPerson)).size;
  const externalResources = data.filter(
    (r) => r.method === "External programme" || r.method === "Through school",
  ).length;

  return (
    <PageShell
      title="RSE Tracker"
      subtitle="Relationships and Sex Education — per-child delivery covering relationships, consent, online safety, healthy bodies"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="rse-tracker" />
          <PrintButton title="RSE Tracker" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Sessions This Term</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-rose-600">{uniqueTopics}</p>
          <p className="text-xs text-muted-foreground">Topics Covered</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{uniqueChildren}</p>
          <p className="text-xs text-muted-foreground">Children Engaged</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{externalResources}</p>
          <p className="text-xs text-muted-foreground">External Resources Used</p>
        </div>
      </div>

      <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
        <p className="text-sm text-rose-800">
          RSE is delivered developmentally, child-led where possible, and always age-appropriate.
          We work alongside school PSHE and external programmes — not in place of them. Each child&apos;s
          questions and pace are honoured.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTopic} onValueChange={setFilterTopic}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="All Topics" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            <SelectItem value="Healthy relationships">Healthy relationships</SelectItem>
            <SelectItem value="Consent">Consent</SelectItem>
            <SelectItem value="Online safety + relationships">Online safety + relationships</SelectItem>
            <SelectItem value="Body changes/puberty">Body changes/puberty</SelectItem>
            <SelectItem value="Boundaries">Boundaries</SelectItem>
            <SelectItem value="Identity (incl. LGBTQ+)">Identity (incl. LGBTQ+)</SelectItem>
            <SelectItem value="Family relationships">Family relationships</SelectItem>
            <SelectItem value="Friendship">Friendship</SelectItem>
            <SelectItem value="Coping with peer pressure">Coping with peer pressure</SelectItem>
            <SelectItem value="Recognising harmful relationships">Recognising harmful relationships</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">By Date</SelectItem>
              <SelectItem value="duration">By Duration</SelectItem>
              <SelectItem value="topic">By Topic</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;

          return (
            <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Heart className="h-5 w-5 text-rose-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.topic}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getYPName(r.youngPerson)} &middot; {r.date} &middot; {r.method} &middot; {r.durationMinutes} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {r.childInitiationOfTopic && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800">
                      Child-initiated
                    </span>
                  )}
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", topicColour[r.topic])}>
                    {r.topic}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-medium">{r.date}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-medium">{r.durationMinutes} min</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Method</p>
                      <p className="font-medium">{r.method}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Delivered By</p>
                      <p className="font-medium">{getStaffName(r.deliveredBy)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <BookOpen className="h-3 w-3 inline mr-1" />Key Concepts Covered
                    </p>
                    <ul className="space-y-1">
                      {r.keyConceptsCovered.map((k, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Sparkles className="h-3 w-3 text-rose-500 mt-1 shrink-0" />
                          <span>{k}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      <MessageCircle className="h-3 w-3 inline mr-1" />Child&apos;s Contribution
                    </p>
                    <p className="text-sm">{r.childContribution}</p>
                  </div>

                  {r.questionsRaised.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">
                        <HelpCircle className="h-3 w-3 inline mr-1" />Questions Raised
                      </p>
                      <ul className="space-y-1">
                        {r.questionsRaised.map((q, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-purple-600 mt-0.5">?</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Follow-Up</p>
                    <p className="text-sm">{r.followUp}</p>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                      <Shield className="h-3 w-3 inline mr-1" />Parental Awareness
                    </p>
                    <p className="text-sm">{r.parentalAwareness}</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Curriculum Link</p>
                    <p className="text-sm">{r.curriculumLinkedTo}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Calendar className="h-3 w-3 inline mr-1" />{r.date}</span>
                    <span><Users className="h-3 w-3 inline mr-1" />Delivered by {getStaffName(r.deliveredBy)}</span>
                    <span>Recorded by {getStaffName(r.recordedBy)}</span>
                    <span>Child-initiated: {r.childInitiationOfTopic ? "Yes" : "No"}</span>
                  </div>

                  {r.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{r.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> RSE delivery is required by KCSIE 2024 (online safety, harmful
          relationships, consent) and Children&apos;s Homes Quality Standard 7 (health and wellbeing — including
          sexual health and healthy relationships). Aligned with DfE RSE Statutory Guidance and delivered
          alongside school PSHE. Linked to Online Safety, Safeguarding, Health, and Identity pages.
        </p>
      </div>
    </PageShell>
  );
}
