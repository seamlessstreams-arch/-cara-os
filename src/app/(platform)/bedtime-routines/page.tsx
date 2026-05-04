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
  Moon,
  Clock,
  AlertTriangle,
  CheckCircle,
  Heart,
  BookOpen,
  Coffee,
  Bath,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── types ───────────────────────────────────────────────────────────────────
interface BedtimeRoutine {
  id: string;
  youngPerson: string;
  ageBand: "Under 11" | "11-13" | "14-15" | "16+";
  agreedBedtime: string; // HH:mm
  weekendBedtime: string;
  windDownStartTime: string;
  routineSteps: { time: string; activity: string; supportLevel: "Independent" | "Prompted" | "Supported" }[];
  preBedRituals: string[];
  sensoryNeeds: string[];
  comfortItems: string[];
  preferredEnvironment: { lighting: string; temperature: string; sound: string; bedding: string };
  triggersToAvoid: string[];
  ifStrugglingToSleep: string[];
  nightTerrors: string;
  morningWakeRoutine: string;
  reviewedDate: string;
  reviewedWith: string;
  childAgreed: boolean;
  effectivenessRating: number; // 1-5
}

// ── seed data ───────────────────────────────────────────────────────────────
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: BedtimeRoutine[] = [
  {
    id: "br-001",
    youngPerson: "yp_alex",
    ageBand: "11-13",
    agreedBedtime: "21:30",
    weekendBedtime: "22:00",
    windDownStartTime: "20:30",
    routineSteps: [
      { time: "20:30", activity: "Screens off, agreed phone hand-in", supportLevel: "Prompted" },
      { time: "20:35", activity: "Shower or bath", supportLevel: "Independent" },
      { time: "20:50", activity: "Brush teeth, get into pyjamas", supportLevel: "Independent" },
      { time: "21:00", activity: "Hot chocolate (if wanted) and quiet chat with key worker", supportLevel: "Supported" },
      { time: "21:15", activity: "Reading or audiobook in bed", supportLevel: "Independent" },
      { time: "21:30", activity: "Lights out, low light from corner lamp until asleep", supportLevel: "Supported" },
    ],
    preBedRituals: [
      "Hot chocolate (Alex's preference, no caffeine alternatives)",
      "Quick chat about tomorrow's plan — reduces anxiety",
      "Choosing tomorrow's outfit reduces morning friction",
    ],
    sensoryNeeds: [
      "Weighted blanket (heavy preference, 7kg)",
      "Cool room (around 18°C)",
      "Brown noise from sleep speaker",
      "Eye mask for very light summer evenings",
    ],
    comfortItems: [
      "Old football scarf (kept since age 7)",
      "Phone (handed in but kept where Alex can see it through doorway)",
    ],
    preferredEnvironment: {
      lighting: "Off — corner lamp on lowest until asleep, then off",
      temperature: "Cool, ~18°C, window open if not raining",
      sound: "Brown noise machine on quietly",
      bedding: "Weighted blanket + light cotton sheet",
    },
    triggersToAvoid: [
      "Raised voices in evening",
      "Conversations about social worker visits or court near bedtime",
      "Caffeine after 4pm",
      "Energetic activities in last 30 mins",
    ],
    ifStrugglingToSleep: [
      "Offer warm milk if requested",
      "Sit quietly outside door if anxious",
      "Don't engage in long discussions — note for tomorrow",
      "If still awake at 22:30 — quiet activity (audiobook) until tired",
    ],
    nightTerrors: "Occasional — historic. Approach: stay calm, don't wake fully, low voice reassurance, stay until settled. Log in shift notes.",
    morningWakeRoutine: "Wake at 07:00 with gentle voice and corner lamp on. 5-min snooze allowed once. Breakfast laid out by 07:15.",
    reviewedDate: d(-14),
    reviewedWith: "staff_edward",
    childAgreed: true,
    effectivenessRating: 4,
  },
  {
    id: "br-002",
    youngPerson: "yp_jordan",
    ageBand: "11-13",
    agreedBedtime: "22:00",
    weekendBedtime: "22:30",
    windDownStartTime: "21:00",
    routineSteps: [
      { time: "21:00", activity: "End of phone time, music optional in own room", supportLevel: "Prompted" },
      { time: "21:15", activity: "Shower (Jordan's preference — usually long)", supportLevel: "Independent" },
      { time: "21:40", activity: "Get into bed clothes, prep football kit for tomorrow", supportLevel: "Independent" },
      { time: "21:50", activity: "Quick chat with staff about day, key working when needed", supportLevel: "Supported" },
      { time: "22:00", activity: "Lights low, music ambient until asleep", supportLevel: "Independent" },
    ],
    preBedRituals: [
      "Football kit prep — provides predictability for tomorrow",
      "Brief chat about day with on-shift staff — Jordan often opens up at this time",
      "Music helps — usually low-key R&B or chillhop",
    ],
    sensoryNeeds: [
      "Standard duvet, prefers cool room",
      "Music until asleep (low volume)",
      "Some light from hallway preferred (door slightly open)",
    ],
    comfortItems: [
      "Phone (close by but typically not used after agreed time)",
      "Football trophy on bedside (significance — first achievement at Oak House)",
    ],
    preferredEnvironment: {
      lighting: "Off but hallway light visible (door 6 inches open)",
      temperature: "Cool, ~17-18°C",
      sound: "Low music until asleep, then auto-off",
      bedding: "Standard duvet, no preferred weight",
    },
    triggersToAvoid: [
      "Discussion about birth mother near bedtime (especially before contact)",
      "Restrictive language around phone — request rather than demand",
      "Bright overhead lights in evening",
    ],
    ifStrugglingToSleep: [
      "Ask if anything on his mind — Jordan often shares at this time",
      "Don't push for sleep if he wants to talk — relational time is precious",
      "Offer to make a milky drink",
      "If after 23:30, agree quiet activity until tired (no clock-watching pressure)",
    ],
    nightTerrors: "Rare. Linked to fire (childhood trauma). Wake fully, reassure, offer water, sit until calm. Never restrain or hold tightly.",
    morningWakeRoutine: "Wake at 07:00 weekdays. Allow phone access from wake-up. Football kit ready. Hot drink on offer.",
    reviewedDate: d(-21),
    reviewedWith: "staff_ryan",
    childAgreed: true,
    effectivenessRating: 4,
  },
  {
    id: "br-003",
    youngPerson: "yp_casey",
    ageBand: "11-13",
    agreedBedtime: "20:30",
    weekendBedtime: "21:00",
    windDownStartTime: "19:00",
    routineSteps: [
      { time: "19:00", activity: "Visual timetable check — bedtime sequence reviewed", supportLevel: "Supported" },
      { time: "19:15", activity: "Bath (sensory regulation — Epsom salts, dim lighting)", supportLevel: "Prompted" },
      { time: "19:45", activity: "Pyjamas — own choice, soft seamless fabric", supportLevel: "Independent" },
      { time: "19:55", activity: "Quiet sensory activity: weighted toys, fidgets, drawing", supportLevel: "Independent" },
      { time: "20:15", activity: "Story (audio or read by staff) — usually familiar repeat", supportLevel: "Supported" },
      { time: "20:25", activity: "Melatonin given (prescribed)", supportLevel: "Supported" },
      { time: "20:30", activity: "Lights out, white noise on, weighted blanket arranged", supportLevel: "Supported" },
    ],
    preBedRituals: [
      "VERY consistent timing — variation causes dysregulation",
      "Same pyjamas pattern (3 sets of identical) — reduces decision fatigue",
      "Audiobook from same series — repetition is comforting, not boring",
      "Melatonin at exactly 20:25 (prescribed by paediatrician)",
    ],
    sensoryNeeds: [
      "Weighted blanket essential (8kg, ASD-specialised)",
      "White noise (specific track — same every night)",
      "No tags in clothing — all removed",
      "Cool room (16-17°C — Casey's preference)",
      "Total darkness — blackout blind + no hallway light",
    ],
    comfortItems: [
      "Stuffed otter (named 'Otter') — has been with Casey since age 5",
      "Specific bedsheet (sensory: smooth, slight weight)",
    ],
    preferredEnvironment: {
      lighting: "Total darkness — blackout blind down, door fully closed",
      temperature: "16-17°C — cool",
      sound: "White noise track specific (saved to phone), continuous overnight",
      bedding: "Weighted blanket 8kg + specific smooth bedsheet",
    },
    triggersToAvoid: [
      "ANY change in routine without 24-hour visual warning",
      "Bright lights",
      "Overhead/sudden noises",
      "Texture changes (new pyjamas, new bedding) without preparation",
      "Fluorescent lighting in evening",
    ],
    ifStrugglingToSleep: [
      "Do NOT enter room repeatedly — increases distress",
      "Listen at door — if upset, knock first then enter calmly",
      "Offer Otter and weighted blanket adjustment",
      "Quiet, predictable language only",
      "Sensory tools available: putty, weighted lap pad",
      "If awake past 22:00 — discuss with on-call manager",
    ],
    nightTerrors: "Rare but extreme when occur. Do NOT wake fully. Stay calm presence. Do not touch unless invited. Speak slowly if speaking. Document in detail next morning.",
    morningWakeRoutine: "Wake at 07:30 with white noise transitioning to morning playlist. Visual timetable for the day on bedroom wall. No surprises.",
    reviewedDate: d(-7),
    reviewedWith: "staff_anna",
    childAgreed: true,
    effectivenessRating: 5,
  },
];

// ── config ──────────────────────────────────────────────────────────────────
function ratingColour(r: number): string {
  if (r >= 4) return "text-green-600";
  if (r === 3) return "text-amber-600";
  return "text-red-600";
}

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<BedtimeRoutine>[] = [
  { header: "Young Person", accessor: (r: BedtimeRoutine) => getYPName(r.youngPerson) },
  { header: "Age Band", accessor: (r: BedtimeRoutine) => r.ageBand },
  { header: "Bedtime (Weekday)", accessor: (r: BedtimeRoutine) => r.agreedBedtime },
  { header: "Bedtime (Weekend)", accessor: (r: BedtimeRoutine) => r.weekendBedtime },
  { header: "Wind-Down Starts", accessor: (r: BedtimeRoutine) => r.windDownStartTime },
  { header: "Effectiveness", accessor: (r: BedtimeRoutine) => `${r.effectivenessRating}/5` },
  { header: "Child Agreed", accessor: (r: BedtimeRoutine) => r.childAgreed ? "Yes" : "No" },
  { header: "Last Reviewed", accessor: (r: BedtimeRoutine) => r.reviewedDate },
];

// ── component ───────────────────────────────────────────────────────────────
export default function BedtimeRoutinesPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((r) => r.youngPerson === filterYP);

    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.youngPerson.localeCompare(b.youngPerson);
        case "bedtime":
          return a.agreedBedtime.localeCompare(b.agreedBedtime);
        case "effectiveness":
          return b.effectivenessRating - a.effectivenessRating;
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, sortBy]);

  // ── stats ─────────────────────────────────────────────────────────────────
  const totalPlans = data.length;
  const allChildAgreed = data.every((r) => r.childAgreed);
  const avgRating = (data.reduce((sum, r) => sum + r.effectivenessRating, 0) / data.length).toFixed(1);
  const reviewedRecently = data.filter((r) => r.reviewedDate >= d(-30)).length;

  return (
    <PageShell
      title="Bedtime Routines"
      subtitle="Personalised, co-produced bedtime plans — supporting sleep, regulation, and emotional safety"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="bedtime-routines" />
          <PrintButton title="Bedtime Routines" />
        </div>
      }
    >
      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{totalPlans}</p>
          <p className="text-xs text-muted-foreground">Active Plans</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allChildAgreed ? "100%" : `${data.filter((r) => r.childAgreed).length}/${totalPlans}`}</p>
          <p className="text-xs text-muted-foreground">Child Agreed</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{avgRating}/5</p>
          <p className="text-xs text-muted-foreground">Avg Effectiveness</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{reviewedRecently}</p>
          <p className="text-xs text-muted-foreground">Reviewed (30d)</p>
        </div>
      </div>

      {/* ── philosophy banner ──────────────────────────────────────────── */}
      <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 mb-6 flex items-start gap-2">
        <Moon className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
        <p className="text-sm text-indigo-800">
          Sleep is a safeguarding issue. A consistent, child-led bedtime routine is a relational act of care.
          Plans are co-produced, sensory-informed, and reviewed monthly with each child.
        </p>
      </div>

      {/* ── filters/sort ───────────────────────────────────────────────── */}
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
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="bedtime">By Bedtime</SelectItem>
              <SelectItem value="effectiveness">By Effectiveness</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── routine cards ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No routines match your filters.</div>
        )}
        {filtered.map((routine) => {
          const isExpanded = expandedId === routine.id;

          return (
            <div key={routine.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : routine.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Moon className="h-5 w-5 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(routine.youngPerson)} ({routine.ageBand})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Weekday {routine.agreedBedtime} &middot; Weekend {routine.weekendBedtime} &middot; Wind-down {routine.windDownStartTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-sm font-bold", ratingColour(routine.effectivenessRating))}>{routine.effectivenessRating}/5</span>
                  {routine.childAgreed && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* routine steps */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Clock className="h-3 w-3 inline mr-1" />Routine Sequence
                    </p>
                    <div className="space-y-1.5">
                      {routine.routineSteps.map((step, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border flex items-start gap-3 text-sm">
                          <span className="font-mono text-xs font-bold text-indigo-700 shrink-0 w-12">{step.time}</span>
                          <span className="flex-1">{step.activity}</span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                            step.supportLevel === "Independent" ? "bg-green-100 text-green-800" :
                            step.supportLevel === "Prompted" ? "bg-blue-100 text-blue-800" :
                            "bg-purple-100 text-purple-800"
                          )}>
                            {step.supportLevel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* environment grid */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sleep Environment</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-white rounded-lg p-2 border">
                        <p className="text-xs font-medium">Lighting</p>
                        <p className="text-xs text-muted-foreground">{routine.preferredEnvironment.lighting}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border">
                        <p className="text-xs font-medium">Temperature</p>
                        <p className="text-xs text-muted-foreground">{routine.preferredEnvironment.temperature}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border">
                        <p className="text-xs font-medium">Sound</p>
                        <p className="text-xs text-muted-foreground">{routine.preferredEnvironment.sound}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border">
                        <p className="text-xs font-medium">Bedding</p>
                        <p className="text-xs text-muted-foreground">{routine.preferredEnvironment.bedding}</p>
                      </div>
                    </div>
                  </div>

                  {/* sensory + comfort */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Sensory Needs</p>
                      <ul className="space-y-1">
                        {routine.sensoryNeeds.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-purple-600 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <Heart className="h-3 w-3 inline mr-1" />Comfort Items
                      </p>
                      <ul className="space-y-1">
                        {routine.comfortItems.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-pink-600 mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* triggers + struggling */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Triggers To Avoid
                      </p>
                      <ul className="space-y-1">
                        {routine.triggersToAvoid.map((t, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                        <BookOpen className="h-3 w-3 inline mr-1" />If Struggling To Sleep
                      </p>
                      <ul className="space-y-1">
                        {routine.ifStrugglingToSleep.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* night terrors */}
                  {routine.nightTerrors && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Night Terrors / Disturbance Plan</p>
                      <p className="text-sm text-purple-900">{routine.nightTerrors}</p>
                    </div>
                  )}

                  {/* morning */}
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
                      <Coffee className="h-3 w-3 inline mr-1" />Morning Wake Routine
                    </p>
                    <p className="text-sm text-green-900">{routine.morningWakeRoutine}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Bath className="h-3 w-3 inline mr-1" />Last reviewed: {routine.reviewedDate}</span>
                    <span>With: {getStaffName(routine.reviewedWith)}</span>
                    <span>Effectiveness: {routine.effectivenessRating}/5</span>
                    {routine.childAgreed && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Child Co-Produced</span>}
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
          <strong>Regulatory Context:</strong> Bedtime routines support Quality Standard 7 (health and wellbeing),
          Quality Standard 5 (protection), and the home&apos;s sensory and trauma-informed care framework.
          Routines are co-produced with each child per UNCRC Article 12 and reviewed at least monthly.
          Linked to Sleep Assessments and Daily Routine Plans.
        </p>
      </div>
    </PageShell>
  );
}
