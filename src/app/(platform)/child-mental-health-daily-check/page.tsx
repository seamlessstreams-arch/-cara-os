"use client";

import { useState, useMemo } from "react";
import {
  Smile, Heart, Sun, Cloud,
  ChevronUp, ChevronDown, ArrowUpDown,
  Search, TrendingUp,
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
type MoodRating = 1 | 2 | 3 | 4 | 5;

const MOOD_CONFIG: Record<MoodRating, { color: string; bar: string; label: string }> = {
  1: { color: "text-red-600",    bar: "bg-red-400",    label: "Very low" },
  2: { color: "text-orange-600", bar: "bg-orange-400", label: "Low" },
  3: { color: "text-amber-600",  bar: "bg-amber-400",  label: "OK" },
  4: { color: "text-sky-600",    bar: "bg-sky-400",    label: "Good" },
  5: { color: "text-violet-600", bar: "bg-violet-500", label: "Great" },
};

const SLEEP = ["Poor", "Disrupted", "OK", "Good", "Great"] as const;
type Sleep = typeof SLEEP[number];
const SLEEP_COLORS: Record<Sleep, string> = {
  "Poor":      "bg-red-100 text-red-800",
  "Disrupted": "bg-orange-100 text-orange-800",
  "OK":        "bg-amber-100 text-amber-800",
  "Good":      "bg-sky-100 text-sky-800",
  "Great":     "bg-violet-100 text-violet-800",
};

const APPETITE = ["Skipped meals", "Picked", "Ate normally", "Hungry/ate well"] as const;
type Appetite = typeof APPETITE[number];
const APPETITE_COLORS: Record<Appetite, string> = {
  "Skipped meals":   "bg-red-100 text-red-800",
  "Picked":          "bg-amber-100 text-amber-800",
  "Ate normally":    "bg-sky-100 text-sky-800",
  "Hungry/ate well": "bg-violet-100 text-violet-800",
};

const ENERGY = ["Exhausted", "Low", "OK", "Good", "Buzzy"] as const;
type Energy = typeof ENERGY[number];
const ENERGY_COLORS: Record<Energy, string> = {
  "Exhausted": "bg-red-100 text-red-800",
  "Low":       "bg-orange-100 text-orange-800",
  "OK":        "bg-amber-100 text-amber-800",
  "Good":      "bg-sky-100 text-sky-800",
  "Buzzy":     "bg-violet-100 text-violet-800",
};

const CONVERSATION = ["Brief", "5 minutes", "10+ minutes", "Extended"] as const;
type ConversationLength = typeof CONVERSATION[number];

interface CheckInRecord {
  id: string;
  youngPerson: string;
  date: string;
  moodRating: 1 | 2 | 3 | 4 | 5;
  moodEmoji: string;
  whatsHeavy: string;
  whatsGood: string;
  whatWouldHelp: string;
  sleepQuality: "Poor" | "Disrupted" | "OK" | "Good" | "Great";
  appetite: "Skipped meals" | "Picked" | "Ate normally" | "Hungry/ate well";
  energy: "Exhausted" | "Low" | "OK" | "Good" | "Buzzy";
  conversationLength: "Brief" | "5 minutes" | "10+ minutes" | "Extended";
  staffPresent: string;
  followUpAction?: string;
  flagsConcerns: string[];
  weeklyTrendNote?: string;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: CheckInRecord[] = [
  /* ── JORDAN — mostly good week, dip on contact day ──────────── */
  {
    id: "checkin_1", youngPerson: "yp_jordan", date: d(0),
    moodRating: 5, moodEmoji: "😄",
    whatsHeavy: "Nothing today really. Maths homework but it's fine.",
    whatsGood: "Coach said I'm starting on Saturday. First time ever.",
    whatWouldHelp: "Just keep reminding me about the kit list.",
    sleepQuality: "Great", appetite: "Hungry/ate well", energy: "Buzzy",
    conversationLength: "10+ minutes", staffPresent: "staff_anna",
    flagsConcerns: [],
    weeklyTrendNote: "Steady upward week — lighter affect throughout.",
  },
  {
    id: "checkin_2", youngPerson: "yp_jordan", date: d(-1),
    moodRating: 4, moodEmoji: "🙂",
    whatsHeavy: "A bit tired. Late night doing FIFA with Alex.",
    whatsGood: "Got picked for the squad list at training.",
    whatWouldHelp: "Earlier bedtime tonight maybe.",
    sleepQuality: "OK", appetite: "Ate normally", energy: "Good",
    conversationLength: "5 minutes", staffPresent: "staff_edward",
    flagsConcerns: [],
  },
  {
    id: "checkin_3", youngPerson: "yp_jordan", date: d(-2),
    moodRating: 3, moodEmoji: "😐",
    whatsHeavy: "Mum cancelled contact again. Found out at lunch.",
    whatsGood: "Anna sat with me after — didn't push, just sat.",
    whatWouldHelp: "Knowing if she's actually coming next week.",
    sleepQuality: "Disrupted", appetite: "Picked", energy: "Low",
    conversationLength: "Extended", staffPresent: "staff_anna",
    followUpAction: "Anna to chase social worker re: contact reliability and update Jordan by Friday.",
    flagsConcerns: ["Contact disappointment", "Skipped pudding"],
  },
  {
    id: "checkin_4", youngPerson: "yp_jordan", date: d(-3),
    moodRating: 4, moodEmoji: "🙂",
    whatsHeavy: "Bit nervous about contact tomorrow.",
    whatsGood: "Cooked pasta with Edward. Turned out alright.",
    whatWouldHelp: "Someone to drop me at the visit.",
    sleepQuality: "Good", appetite: "Ate normally", energy: "OK",
    conversationLength: "5 minutes", staffPresent: "staff_edward",
    flagsConcerns: [],
  },
  /* ── ALEX — variable, building emotional vocabulary ──────────── */
  {
    id: "checkin_5", youngPerson: "yp_alex", date: d(0),
    moodRating: 4, moodEmoji: "🙂",
    whatsHeavy: "Bit worried about the maths test on Thursday. My head goes fuzzy.",
    whatsGood: "Read three chapters of the dragon book before bed.",
    whatWouldHelp: "Practising past papers with someone who's patient.",
    sleepQuality: "Good", appetite: "Ate normally", energy: "Good",
    conversationLength: "10+ minutes", staffPresent: "staff_anna",
    followUpAction: "Anna to book maths revision slot Wednesday evening.",
    flagsConcerns: [],
    weeklyTrendNote: "Naming feelings more clearly — 'fuzzy', 'tight chest' — vocab is growing.",
  },
  {
    id: "checkin_6", youngPerson: "yp_alex", date: d(-1),
    moodRating: 2, moodEmoji: "😟",
    whatsHeavy: "Tight chest feeling came back. Don't know why exactly.",
    whatsGood: "Chervelle made me toast and didn't ask anything.",
    whatWouldHelp: "Quiet room. No questions for a bit.",
    sleepQuality: "Disrupted", appetite: "Skipped meals", energy: "Exhausted",
    conversationLength: "Brief", staffPresent: "staff_chervelle",
    followUpAction: "Quiet evening offered. Re-check at bedtime. Note for handover.",
    flagsConcerns: ["Somatic anxiety", "Skipped breakfast"],
  },
  {
    id: "checkin_7", youngPerson: "yp_alex", date: d(-2),
    moodRating: 3, moodEmoji: "😐",
    whatsHeavy: "School felt loud today.",
    whatsGood: "Got an A on the spelling test.",
    whatWouldHelp: "Headphones for the bus tomorrow maybe.",
    sleepQuality: "OK", appetite: "Picked", energy: "OK",
    conversationLength: "5 minutes", staffPresent: "staff_edward",
    flagsConcerns: ["Sensory overwhelm"],
  },
  /* ── CASEY — mostly 4-5 with one 2 after nightmare ──────────── */
  {
    id: "checkin_8", youngPerson: "yp_casey", date: d(0),
    moodRating: 5, moodEmoji: "😊",
    whatsHeavy: "Nothing big. Just normal stuff.",
    whatsGood: "Finished the mural in the lounge — Anna helped with the sky bit.",
    whatWouldHelp: "Maybe more art supplies for the next one.",
    sleepQuality: "Great", appetite: "Hungry/ate well", energy: "Good",
    conversationLength: "10+ minutes", staffPresent: "staff_anna",
    flagsConcerns: [],
    weeklyTrendNote: "Settled week overall apart from Tuesday nightmare — positive baseline.",
  },
  {
    id: "checkin_9", youngPerson: "yp_casey", date: d(-2),
    moodRating: 2, moodEmoji: "😢",
    whatsHeavy: "Bad nightmare last night. Woke up at 3 and couldn't get back.",
    whatsGood: "Edward made hot chocolate when I came down.",
    whatWouldHelp: "Night light on. Door open. Maybe early bed tonight.",
    sleepQuality: "Poor", appetite: "Picked", energy: "Exhausted",
    conversationLength: "Extended", staffPresent: "staff_edward",
    followUpAction: "Night light installed. Edward to log sleep pattern for the week. Mention to therapist Friday.",
    flagsConcerns: ["Recurring nightmare", "Sleep loss"],
  },
  {
    id: "checkin_10", youngPerson: "yp_casey", date: d(-4),
    moodRating: 4, moodEmoji: "🙂",
    whatsHeavy: "Missing my nan. Anniversary coming up next month.",
    whatsGood: "Wrote her a letter in the journal. Felt lighter after.",
    whatWouldHelp: "Visit her grave on the anniversary if possible.",
    sleepQuality: "Good", appetite: "Ate normally", energy: "Good",
    conversationLength: "10+ minutes", staffPresent: "staff_chervelle",
    followUpAction: "Chervelle to add anniversary date to care plan diary and discuss visit logistics.",
    flagsConcerns: [],
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function ChildMentalHealthDailyCheckPage() {
  const [records] = useState<CheckInRecord[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.whatsHeavy.toLowerCase().includes(q) ||
          r.whatsGood.toLowerCase().includes(q) ||
          r.whatWouldHelp.toLowerCase().includes(q) ||
          (r.followUpAction ?? "").toLowerCase().includes(q) ||
          r.flagsConcerns.some((f) => f.toLowerCase().includes(q))
      );
    }
    if (filterYP !== "all") list = list.filter((r) => r.youngPerson === filterYP);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":      return b.date.localeCompare(a.date);
        case "yp":        return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        case "mood-high": return b.moodRating - a.moodRating;
        case "mood-low":  return a.moodRating - b.moodRating;
        default:          return 0;
      }
    });
    return list;
  }, [records, search, filterYP, sortBy]);

  /* stats */
  const sevenDaysAgo = d(-7);
  const thisWeekRecords = records.filter((r) => r.date >= sevenDaysAgo);
  const checkInsThisWeek = thisWeekRecords.length;
  const avgMood = records.length === 0 ? 0
    : records.reduce((s, r) => s + r.moodRating, 0) / records.length;
  const flagsThisWeek = thisWeekRecords.reduce((s, r) => s + r.flagsConcerns.length, 0);
  const childLedConversations = records.filter(
    (r) => r.conversationLength === "10+ minutes" || r.conversationLength === "Extended"
  ).length;

  const ypIds = ["yp_alex", "yp_jordan", "yp_casey"];

  const exportCols: ExportColumn<CheckInRecord>[] = [
    { header: "ID",                  accessor: (r: CheckInRecord) => r.id },
    { header: "Young Person",        accessor: (r: CheckInRecord) => getYPName(r.youngPerson) },
    { header: "Date",                accessor: (r: CheckInRecord) => r.date },
    { header: "Mood Rating",         accessor: (r: CheckInRecord) => r.moodRating },
    { header: "Mood Emoji",          accessor: (r: CheckInRecord) => r.moodEmoji },
    { header: "What's Heavy",        accessor: (r: CheckInRecord) => r.whatsHeavy },
    { header: "What's Good",         accessor: (r: CheckInRecord) => r.whatsGood },
    { header: "What Would Help",     accessor: (r: CheckInRecord) => r.whatWouldHelp },
    { header: "Sleep Quality",       accessor: (r: CheckInRecord) => r.sleepQuality },
    { header: "Appetite",            accessor: (r: CheckInRecord) => r.appetite },
    { header: "Energy",              accessor: (r: CheckInRecord) => r.energy },
    { header: "Conversation Length", accessor: (r: CheckInRecord) => r.conversationLength },
    { header: "Staff Present",       accessor: (r: CheckInRecord) => getStaffName(r.staffPresent) },
    { header: "Follow-Up Action",    accessor: (r: CheckInRecord) => r.followUpAction ?? "" },
    { header: "Flags / Concerns",    accessor: (r: CheckInRecord) => r.flagsConcerns.join("; ") },
    { header: "Weekly Trend Note",   accessor: (r: CheckInRecord) => r.weeklyTrendNote ?? "" },
  ];

  return (
    <PageShell
      title="Daily Mental Health Check-Ins"
      subtitle="Quick child-led mood and wellbeing pulse — a daily moment to ask, listen, and notice patterns"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Daily Mental Health Check-Ins" />
          <ExportButton data={filtered} columns={exportCols} filename="daily-mental-health-check-ins" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-gradient-to-br from-sky-50 to-white p-4 flex items-center gap-3">
            <Heart className="h-5 w-5 text-sky-600" />
            <div>
              <p className="text-xs text-muted-foreground">Check-Ins This Week</p>
              <p className="text-lg font-bold">{checkInsThisWeek}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-violet-50 to-white p-4 flex items-center gap-3">
            <Smile className={cn("h-5 w-5", MOOD_CONFIG[Math.round(avgMood) as MoodRating]?.color ?? "text-violet-600")} />
            <div>
              <p className="text-xs text-muted-foreground">Average Mood</p>
              <p className={cn("text-lg font-bold", MOOD_CONFIG[Math.round(avgMood) as MoodRating]?.color)}>
                {avgMood.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">/5</span>
              </p>
            </div>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-white p-4 flex items-center gap-3">
            <Cloud className={cn("h-5 w-5", flagsThisWeek > 0 ? "text-amber-600" : "text-slate-400")} />
            <div>
              <p className="text-xs text-muted-foreground">Flags This Week</p>
              <p className={cn("text-lg font-bold", flagsThisWeek > 0 && "text-amber-600")}>{flagsThisWeek}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-violet-50 to-white p-4 flex items-center gap-3">
            <Sun className="h-5 w-5 text-violet-600" />
            <div>
              <p className="text-xs text-muted-foreground">Child-Led Conversations</p>
              <p className="text-lg font-bold">{childLedConversations}</p>
            </div>
          </div>
        </div>

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search what's heavy, what's good, flags…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {ypIds.map((id) => (
                <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="yp">Young Person</SelectItem>
                <SelectItem value="mood-high">Mood (High → Low)</SelectItem>
                <SelectItem value="mood-low">Mood (Low → High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No check-ins match your filters.</div>
          )}
          {filtered.map((rec) => {
            const isExpanded = expandedId === rec.id;
            const moodCfg = MOOD_CONFIG[rec.moodRating];
            return (
              <div key={rec.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-sky-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center text-xl shrink-0",
                      "bg-gradient-to-br from-sky-50 to-violet-50 border"
                    )}>
                      <span aria-hidden>{rec.moodEmoji}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {getYPName(rec.youngPerson)} — {rec.date}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <Badge className={cn("text-xs", moodCfg.color, "bg-white border")}>
                          {rec.moodRating}/5 · {moodCfg.label}
                        </Badge>
                        <Badge className={cn("text-xs", SLEEP_COLORS[rec.sleepQuality])}>
                          Sleep: {rec.sleepQuality}
                        </Badge>
                        <Badge className={cn("text-xs", APPETITE_COLORS[rec.appetite])}>
                          {rec.appetite}
                        </Badge>
                        <Badge className={cn("text-xs", ENERGY_COLORS[rec.energy])}>
                          {rec.energy}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {rec.flagsConcerns.length > 0 && (
                      <Badge className="bg-amber-100 text-amber-800 text-xs">
                        {rec.flagsConcerns.length} flag{rec.flagsConcerns.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-gradient-to-br from-sky-50/40 to-violet-50/30 p-4 space-y-4">
                    {/* mood scale visual */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs font-medium text-slate-600 mb-2">Mood Scale (1-5)</p>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((n) => {
                          const cfg = MOOD_CONFIG[n as MoodRating];
                          const active = n === rec.moodRating;
                          return (
                            <div key={n} className="flex-1">
                              <div className={cn(
                                "h-2 rounded-full",
                                active ? cfg.bar : "bg-slate-100"
                              )} />
                              <p className={cn(
                                "text-[10px] mt-1 text-center",
                                active ? cfg.color + " font-semibold" : "text-slate-400"
                              )}>
                                {n}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white border border-slate-200 p-3">
                        <p className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1.5">
                          <Cloud className="h-3.5 w-3.5 text-slate-500" />
                          What&apos;s Heavy Today
                        </p>
                        <p className="text-sm italic text-slate-800">&ldquo;{rec.whatsHeavy}&rdquo;</p>
                      </div>
                      <div className="rounded-lg bg-white border border-violet-200 p-3">
                        <p className="text-xs font-medium text-violet-700 mb-1 flex items-center gap-1.5">
                          <Sun className="h-3.5 w-3.5 text-violet-600" />
                          What&apos;s Good Today
                        </p>
                        <p className="text-sm italic text-violet-900">&ldquo;{rec.whatsGood}&rdquo;</p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-white border border-sky-200 p-3">
                      <p className="text-xs font-medium text-sky-700 mb-1 flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5 text-sky-600" />
                        What Would Help
                      </p>
                      <p className="text-sm text-sky-900">{rec.whatWouldHelp}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground">Conversation</p>
                        <p className="font-medium">{rec.conversationLength}</p>
                      </div>
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground">Staff Present</p>
                        <p className="font-medium">{getStaffName(rec.staffPresent)}</p>
                      </div>
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground">Sleep</p>
                        <p className="font-medium">{rec.sleepQuality}</p>
                      </div>
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground">Energy</p>
                        <p className="font-medium">{rec.energy}</p>
                      </div>
                    </div>

                    {rec.followUpAction && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-medium text-amber-800 mb-1">Follow-Up Action</p>
                        <p className="text-sm text-amber-900">{rec.followUpAction}</p>
                      </div>
                    )}

                    {rec.flagsConcerns.length > 0 && (
                      <div className="rounded-lg bg-white border border-amber-200 p-3">
                        <p className="text-xs font-medium text-amber-800 mb-2">Flags / Concerns</p>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.flagsConcerns.map((f, i) => (
                            <Badge key={i} className="bg-amber-100 text-amber-800 text-xs">{f}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {rec.weeklyTrendNote && (
                      <div className="rounded-lg bg-violet-50 border border-violet-200 p-3">
                        <p className="text-xs font-medium text-violet-800 mb-1 flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5" />
                          Weekly Trend Note
                        </p>
                        <p className="text-sm text-violet-900">{rec.weeklyTrendNote}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-sky-50 border border-sky-200 p-4 text-sm text-sky-900">
          <strong>Anna Freud Centre &mdash; Mentally Healthy Schools framework</strong> &middot;
          {" "}<strong>Quality Standard 8 (Health &amp; Wellbeing)</strong>, The Children&apos;s Homes
          (England) Regulations 2015 &middot; <strong>UNCRC Article 12</strong> (the right of the child
          to be heard) &middot; <strong>Working Together 2023</strong>. Daily check-ins are a brief,
          child-led pulse — distinct from clinical CAMHS appointments and from digital-wellbeing
          monitoring. They surface emerging worries early, evidence ongoing voice-of-the-child
          practice for Ofsted and Reg 44 visitors, and feed weekly trend notes into key work and
          care plan reviews.
        </div>
      </div>
    </PageShell>
  );
}
