"use client";

import { useState, useMemo } from "react";
import {
  Laptop,
  Mail,
  Lock,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Award,
  Globe,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type Domain =
  | "Device basics"
  | "Email"
  | "Word processing"
  | "Cloud storage"
  | "Online banking"
  | "gov.uk services"
  | "Scam awareness"
  | "Password hygiene"
  | "Form completion"
  | "Job applications"
  | "Browsing safely";

type Competency =
  | "Not yet introduced"
  | "Aware"
  | "Did with help"
  | "Did independently"
  | "Confident";

interface SkillRecord {
  id: string;
  youngPerson: string;
  recordedDate: string;
  domain: Domain;
  competency: Competency;
  specificSkills: { skill: string; achieved: boolean }[];
  toolsUsed: string[];
  realWorldApplication: string[];
  childVoice: string;
  staffObservation: string;
  nextStep: string;
  reviewDate: string;
  keyWorker: string;
  notes?: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const SEED: SkillRecord[] = [
  {
    id: "dls1",
    youngPerson: "yp_jordan",
    recordedDate: d(-10),
    domain: "Email",
    competency: "Confident",
    specificSkills: [
      { skill: "Compose and send a professional email", achieved: true },
      { skill: "Attach files (CV, photo ID)", achieved: true },
      { skill: "Use BCC vs CC appropriately", achieved: true },
      { skill: "Spot phishing in inbox", achieved: true },
      { skill: "Manage folders and filters", achieved: true },
    ],
    toolsUsed: ["Gmail", "Google Account recovery", "2FA via Authenticator app"],
    realWorldApplication: [
      "Holds a professional Gmail address (jordan.m.football@gmail.com) used for football trial bookings",
      "Emails coaches at scouted clubs to confirm match details",
      "Receives wage slips from Saturday football coaching role",
    ],
    childVoice:
      "Email used to feel like a grown-up thing, but it's just texts that you can attach stuff to. I keep my football one separate from my mates' one so coaches see something proper.",
    staffObservation:
      "Jordan independently set up a second Gmail address with staff oversight, configured 2FA, and now manages all football-related correspondence without prompts. Demonstrates clear understanding of professional tone.",
    nextStep:
      "Introduce calendar invites and shared Google Calendar for managing fixtures alongside school commitments.",
    reviewDate: d(80),
    keyWorker: "staff_anna",
  },
  {
    id: "dls2",
    youngPerson: "yp_jordan",
    recordedDate: d(-6),
    domain: "Online banking",
    competency: "Did independently",
    specificSkills: [
      { skill: "Log in using biometric / PIN", achieved: true },
      { skill: "Check balance and recent transactions", achieved: true },
      { skill: "Make a transfer to a saved payee", achieved: true },
      { skill: "Set up a new payee safely", achieved: false },
      { skill: "Recognise a suspicious transaction", achieved: true },
    ],
    toolsUsed: ["Monzo app", "Monzo pots (savings)", "Open Banking notifications"],
    realWorldApplication: [
      "Receives Saturday football coaching wages directly into Monzo current account",
      "Splits £20/week into a 'kit & boots' Monzo pot",
      "Used Monzo to pay back a teammate who covered his away-match travel",
    ],
    childVoice:
      "Seeing my own wages land is mad. The pots help me not blow it on takeaways. I want to learn how to send money to someone new without staff hovering.",
    staffObservation:
      "Jordan transfers between own pots independently and reads balances accurately. Still requires support adding a brand-new payee — needs more practice spotting account-name mismatches before confirming.",
    nextStep:
      "Practice Confirmation of Payee checks using a staff-supervised £1 test transfer to a new payee.",
    reviewDate: d(60),
    keyWorker: "staff_anna",
  },
  {
    id: "dls3",
    youngPerson: "yp_alex",
    recordedDate: d(-12),
    domain: "Word processing",
    competency: "Confident",
    specificSkills: [
      { skill: "Create, name and organise documents in folders", achieved: true },
      { skill: "Use headings, lists and basic formatting", achieved: true },
      { skill: "Insert images and tables", achieved: true },
      { skill: "Share a document with view / comment / edit rights", achieved: true },
      { skill: "Export to PDF for submission", achieved: true },
    ],
    toolsUsed: ["Google Docs", "Google Drive", "School-issued Google Workspace account"],
    realWorldApplication: [
      "Submits all school coursework via Google Classroom",
      "Maintains a personal 'About Me' document used for PEP and LAC review meetings",
      "Co-edited a group history project with two classmates remotely",
    ],
    childVoice:
      "Docs is just easier than paper. I like that I can see when teachers leave comments. I made my own LAC review thing so people stop talking over me about my own life.",
    staffObservation:
      "Alex demonstrates fluent use of Google Docs including version history, comment resolution, and collaborative editing. Has independently produced a personal profile document used to express views in statutory meetings.",
    nextStep:
      "Introduce Google Slides for upcoming year-group presentation; explore basic spreadsheet skills (budget tracker).",
    reviewDate: d(90),
    keyWorker: "staff_edward",
  },
  {
    id: "dls4",
    youngPerson: "yp_alex",
    recordedDate: d(-4),
    domain: "gov.uk services",
    competency: "Did with help",
    specificSkills: [
      { skill: "Navigate gov.uk to find the right service", achieved: true },
      { skill: "Complete an NHS appointment booking online", achieved: true },
      { skill: "Apply to register to vote (16+)", achieved: true },
      { skill: "Understand National Insurance number letter", achieved: false },
      { skill: "Identify official .gov.uk URL vs spoof site", achieved: true },
    ],
    toolsUsed: ["gov.uk", "NHS App", "Register to vote service", "Email verification flow"],
    realWorldApplication: [
      "Booked own GP appointment via NHS App with staff sitting alongside",
      "Submitted online application to register to vote (16, attainer status — Scotland/Wales rules explained but Alex resides in England so registers as attainer)",
      "Bookmarked gov.uk on Chromebook to reduce risk of clicking spoof results",
    ],
    childVoice:
      "I didn't know voting was a thing you sign up for — I thought you just turned 18 and a card showed up. Doing it on the NHS app was actually quicker than ringing.",
    staffObservation:
      "Alex completed both transactions with verbal prompts only. Confidently spotted that 'nhs-appointments-uk.co' result was not the real NHS site. Needs further work understanding the NI number letter and what to do with it.",
    nextStep:
      "Walk through NI number letter together; introduce HMRC personal tax account when Alex begins paid work experience.",
    reviewDate: d(45),
    keyWorker: "staff_edward",
  },
  {
    id: "dls5",
    youngPerson: "yp_casey",
    recordedDate: d(-8),
    domain: "Device basics",
    competency: "Confident",
    specificSkills: [
      { skill: "Power on, log in and shut down safely", achieved: true },
      { skill: "Connect to home Wi-Fi", achieved: true },
      { skill: "Save files to the correct folder", achieved: true },
      { skill: "Use keyboard shortcuts (copy / paste / undo)", achieved: true },
      { skill: "Know what to do if device freezes", achieved: true },
    ],
    toolsUsed: ["School-issued Chromebook", "Google account (school-managed)", "Home Wi-Fi"],
    realWorldApplication: [
      "Uses Chromebook for all homework — logs in, opens correct subject folder, submits to Google Classroom",
      "Helped a younger peer in the home log onto Wi-Fi during a school catch-up session",
      "Has independently restarted device when the screen froze rather than panicking",
    ],
    childVoice:
      "It's just a laptop, it's not scary. The school one only does school stuff so there's not really anything I can break.",
    staffObservation:
      "Casey demonstrates confident, age-appropriate device handling on a managed Chromebook. Clear understanding that the school device is for school use; respects the boundary without prompting.",
    nextStep:
      "Introduce concept of personal vs managed accounts ahead of any future personal device.",
    reviewDate: d(120),
    keyWorker: "staff_chervelle",
  },
  {
    id: "dls6",
    youngPerson: "yp_casey",
    recordedDate: d(-5),
    domain: "Email",
    competency: "Aware",
    specificSkills: [
      { skill: "Understand what an email address is", achieved: true },
      { skill: "Read an email sent by a trusted adult", achieved: true },
      { skill: "Reply with adult support", achieved: true },
      { skill: "Send an email independently", achieved: false },
      { skill: "Recognise a suspicious sender", achieved: false },
    ],
    toolsUsed: [
      "Family-style shared inbox (kid-safe, monitored by key worker)",
      "Gmail (read-only access to school updates)",
    ],
    realWorldApplication: [
      "Reads weekly school newsletter in the shared inbox alongside key worker",
      "Replied (with key worker present) to a birthday message from her social worker",
    ],
    childVoice:
      "I don't really need email yet — I just text. But it's good to know how it works for when I'm bigger.",
    staffObservation:
      "Age-appropriate. Casey (12) is exposed to email through a monitored, shared family-style inbox rather than a personal account. Plan is to introduce a personal account closer to age 13 in line with platform terms and the home's online safety policy.",
    nextStep:
      "At 13, set up a personal Gmail with parental controls and 2FA. Begin staff-supervised composition of short emails.",
    reviewDate: d(180),
    keyWorker: "staff_chervelle",
  },
  {
    id: "dls7",
    youngPerson: "yp_casey",
    recordedDate: d(-2),
    domain: "Scam awareness",
    competency: "Did with help",
    specificSkills: [
      { skill: "Spot urgency / pressure tactics in a message", achieved: true },
      { skill: "Identify a fake sender address", achieved: true },
      { skill: "Know never to click suspicious links", achieved: true },
      { skill: "Tell a trusted adult before acting", achieved: true },
      { skill: "Report to the platform (Snapchat / TikTok)", achieved: false },
    ],
    toolsUsed: [
      "Take Five to Stop Fraud worksheet",
      "Worked example: 'Royal Mail parcel' SMS phishing screenshot",
      "NCSC 'Cyber Sprinters' resource",
    ],
    realWorldApplication: [
      "Showed key worker a 'parcel delivery fee £1.99' text and asked 'is this fake?' before clicking — it was",
      "Explained to a peer at the home why a 'free Roblox' link in a Snap was a scam",
    ],
    childVoice:
      "The parcel one looked properly real but the link was weird. I'm glad I asked before clicking — Anna said that's exactly what you're meant to do.",
    staffObservation:
      "Casey's instinct to pause and check before clicking is a genuine strength and was praised in key work. Building confidence to use in-platform reporting tools is the next step.",
    nextStep:
      "Walk through reporting routes on Snapchat and TikTok; revisit Take Five materials at next key work session.",
    reviewDate: d(40),
    keyWorker: "staff_chervelle",
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const DOMAINS: Domain[] = [
  "Device basics",
  "Email",
  "Word processing",
  "Cloud storage",
  "Online banking",
  "gov.uk services",
  "Scam awareness",
  "Password hygiene",
  "Form completion",
  "Job applications",
  "Browsing safely",
];

const COMPETENCIES: Competency[] = [
  "Not yet introduced",
  "Aware",
  "Did with help",
  "Did independently",
  "Confident",
];

const COMP_META: Record<Competency, { colour: string; order: number }> = {
  "Not yet introduced": { colour: "bg-gray-100 text-gray-700",     order: 0 },
  "Aware":              { colour: "bg-violet-100 text-violet-700", order: 1 },
  "Did with help":      { colour: "bg-amber-100 text-amber-800",   order: 2 },
  "Did independently":  { colour: "bg-blue-100 text-blue-700",     order: 3 },
  "Confident":          { colour: "bg-indigo-100 text-indigo-800", order: 4 },
};

const DOMAIN_COLOUR: Record<Domain, string> = {
  "Device basics":     "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Email":             "bg-violet-50 text-violet-700 border-violet-200",
  "Word processing":   "bg-sky-50 text-sky-700 border-sky-200",
  "Cloud storage":     "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Online banking":    "bg-emerald-50 text-emerald-700 border-emerald-200",
  "gov.uk services":   "bg-blue-50 text-blue-700 border-blue-200",
  "Scam awareness":    "bg-rose-50 text-rose-700 border-rose-200",
  "Password hygiene":  "bg-amber-50 text-amber-800 border-amber-200",
  "Form completion":   "bg-teal-50 text-teal-700 border-teal-200",
  "Job applications":  "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  "Browsing safely":   "bg-lime-50 text-lime-700 border-lime-200",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function DigitalLiteracySkillsPage() {
  const [data] = useState<SkillRecord[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recorded" | "competency" | "review" | "child">("recorded");

  /* ── stats ───────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const today = d(0);
    const skillsTracked = data.length;
    const confident = data.filter((r) => r.competency === "Confident").length;
    const reviewsDue = data.filter((r) => r.reviewDate <= d(30)).length;
    const realWorld = data.reduce((acc, r) => acc + r.realWorldApplication.length, 0);
    void today;
    return { skillsTracked, confident, reviewsDue, realWorld };
  }, [data]);

  /* ── filtered & sorted ──────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...data];
    if (filterDomain !== "all") list = list.filter((r) => r.domain === filterDomain);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.youngPerson).toLowerCase().includes(q) ||
          r.domain.toLowerCase().includes(q) ||
          r.staffObservation.toLowerCase().includes(q) ||
          r.childVoice.toLowerCase().includes(q) ||
          r.specificSkills.some((s) => s.skill.toLowerCase().includes(q)) ||
          r.toolsUsed.some((t) => t.toLowerCase().includes(q)),
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "competency":
          return COMP_META[b.competency].order - COMP_META[a.competency].order;
        case "review":
          return a.reviewDate.localeCompare(b.reviewDate);
        case "child":
          return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        case "recorded":
        default:
          return b.recordedDate.localeCompare(a.recordedDate);
      }
    });
    return list;
  }, [data, filterDomain, search, sortBy]);

  /* ── export ──────────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<SkillRecord>[] = [
    { header: "Young Person",          accessor: (r: SkillRecord) => getYPName(r.youngPerson) },
    { header: "Recorded",              accessor: (r: SkillRecord) => r.recordedDate },
    { header: "Domain",                accessor: (r: SkillRecord) => r.domain },
    { header: "Competency",            accessor: (r: SkillRecord) => r.competency },
    { header: "Specific Skills",       accessor: (r: SkillRecord) => r.specificSkills.map((s) => `${s.achieved ? "[x]" : "[ ]"} ${s.skill}`).join("; ") },
    { header: "Tools Used",            accessor: (r: SkillRecord) => r.toolsUsed.join("; ") },
    { header: "Real-World Application", accessor: (r: SkillRecord) => r.realWorldApplication.join("; ") },
    { header: "Child Voice",           accessor: (r: SkillRecord) => r.childVoice },
    { header: "Staff Observation",     accessor: (r: SkillRecord) => r.staffObservation },
    { header: "Next Step",             accessor: (r: SkillRecord) => r.nextStep },
    { header: "Review Date",           accessor: (r: SkillRecord) => r.reviewDate },
    { header: "Key Worker",            accessor: (r: SkillRecord) => getStaffName(r.keyWorker) },
    { header: "Notes",                 accessor: (r: SkillRecord) => r.notes ?? "" },
  ];

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <PageShell
      title="Digital Literacy Skills"
      subtitle="Per-child digital competence — from device basics to online banking, gov.uk services and scam awareness. A core preparation-for-adulthood skill, distinct from online safety."
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="digital-literacy-skills" />
          <PrintButton title="Digital Literacy Skills" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stat cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Skills tracked",           value: stats.skillsTracked, icon: Laptop, c: "text-indigo-600" },
            { label: "Confident competencies",   value: stats.confident,     icon: Award,  c: "text-violet-600" },
            { label: "Reviews due ≤ 30 days",    value: stats.reviewsDue,    icon: Lock,   c: "text-amber-600" },
            { label: "Real-world applications",  value: stats.realWorld,     icon: Globe,  c: "text-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between">
                <s.icon className={cn("h-5 w-5", s.c)} />
                <span className="text-2xl font-bold">{s.value}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── filters ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search child, domain, skill, tool…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterDomain} onValueChange={setFilterDomain}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All domains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All domains</SelectItem>
              {DOMAINS.map((dm) => (
                <SelectItem key={dm} value={dm}>{dm}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="recorded">Most recently recorded</option>
              <option value="competency">Highest competency</option>
              <option value="review">Soonest review</option>
              <option value="child">Child name</option>
            </select>
          </div>
        </div>

        {/* ── records ───────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-lg border bg-white p-8 text-center text-sm text-muted-foreground">
              No records match the current filters.
            </div>
          )}
          {filtered.map((rec) => {
            const isOpen = expanded === rec.id;
            const achievedCount = rec.specificSkills.filter((s) => s.achieved).length;
            return (
              <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : rec.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-indigo-50/40 transition-colors"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 p-2 text-white">
                      <Laptop className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 flex-wrap">
                        {getYPName(rec.youngPerson)}
                        <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", DOMAIN_COLOUR[rec.domain])}>
                          {rec.domain}
                        </span>
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", COMP_META[rec.competency].colour)}>
                          {rec.competency}
                        </span>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Recorded {rec.recordedDate} · Key worker {getStaffName(rec.keyWorker)} · {achievedCount}/{rec.specificSkills.length} specific skills achieved · Review {rec.reviewDate}
                      </p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="border-t bg-gradient-to-b from-indigo-50/30 to-white p-4 space-y-4">
                    {/* specific skills checklist */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-indigo-600" /> Specific skills
                      </h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        {rec.specificSkills.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span
                              className={cn(
                                "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold",
                                s.achieved
                                  ? "bg-indigo-600 text-white border-indigo-600"
                                  : "bg-white text-transparent border-gray-300",
                              )}
                              aria-hidden
                            >
                              {s.achieved ? "✓" : ""}
                            </span>
                            <span className={cn(s.achieved ? "text-gray-900" : "text-muted-foreground")}>{s.skill}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* tools & real-world */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3">
                        <h4 className="text-sm font-semibold text-violet-800 mb-1.5 flex items-center gap-1.5">
                          <Mail className="h-4 w-4" /> Tools used
                        </h4>
                        <ul className="list-disc list-inside text-sm text-violet-900 space-y-0.5">
                          {rec.toolsUsed.map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                        <h4 className="text-sm font-semibold text-emerald-800 mb-1.5 flex items-center gap-1.5">
                          <Globe className="h-4 w-4" /> Real-world application
                        </h4>
                        <ul className="list-disc list-inside text-sm text-emerald-900 space-y-0.5">
                          {rec.realWorldApplication.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    </div>

                    {/* child voice */}
                    <div className="rounded-lg border border-pink-200 bg-pink-50/60 p-3">
                      <h4 className="text-sm font-semibold text-pink-800 mb-1">Child&apos;s voice</h4>
                      <p className="text-sm text-pink-900 italic">&ldquo;{rec.childVoice}&rdquo;</p>
                    </div>

                    {/* staff observation */}
                    <div className="rounded-lg border bg-white p-3">
                      <h4 className="text-sm font-semibold mb-1">Staff observation</h4>
                      <p className="text-sm text-gray-800">{rec.staffObservation}</p>
                    </div>

                    {/* next step */}
                    <div className="rounded-lg border-l-4 border-indigo-500 bg-indigo-50 p-3">
                      <h4 className="text-sm font-semibold text-indigo-800 mb-1">Next step</h4>
                      <p className="text-sm text-indigo-900">{rec.nextStep}</p>
                    </div>

                    {rec.notes && (
                      <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                        <span className="font-semibold">Notes: </span>{rec.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory note ───────────────────────────────────────────── */}
        <div className="rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 text-sm text-indigo-900 space-y-1">
          <p>
            <strong>Pathway Plan</strong> — Care Leavers (England) Regulations 2010: digital literacy is a core preparation-for-adulthood domain captured in each young person&apos;s pathway plan.
          </p>
          <p>
            <strong>Quality Standard 5 (Education) &amp; Quality Standard 6 (Enjoyment &amp; Achievement)</strong> — Children&apos;s Homes Regulations 2015: the home must help every child develop the skills, confidence and competence to participate fully in education and modern life.
          </p>
          <p>
            <strong>UNCRC Article 17</strong> — every child has the right to access information from a diversity of sources, with appropriate support to use it safely and effectively.
          </p>
          <p className="text-xs text-indigo-800/80 pt-1">
            This module is distinct from the home&apos;s Online Safety record (which logs incidents and risk). Digital Literacy evidences <em>competence</em> — what each child can independently do.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
