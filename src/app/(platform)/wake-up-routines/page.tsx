"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Sun,
  Clock,
  Coffee,
  AlertTriangle,
  CheckCircle,
  Heart,
  Activity,
  BookOpen,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── types ───────────────────────────────────────────────────────────────────
interface WakeUpRoutine {
  id: string;
  youngPerson: string;
  weekdayWakeTime: string;
  weekendWakeTime: string;
  preferredWakeMethod: "Gentle voice" | "Music/playlist" | "Light + voice" | "Phone alarm" | "White noise transition";
  wakeUpSteps: { time: string; activity: string; staffSupport: "None" | "Prompt" | "Hands-on" }[];
  morningTriggers: string[];
  morningProtective: string[];
  breakfastPreferences: string[];
  hygieneSequence: string[];
  schoolPrep: string[];
  arrivalTime: string;
  ifRefusingToGetUp: string[];
  energyPattern: "Slow starter" | "Quick starter" | "Variable";
  medicationMorning: string;
  childAgreed: boolean;
  reviewedDate: string;
  reviewedWith: string;
  effectivenessRating: number;
}

// ── seed data ───────────────────────────────────────────────────────────────
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: WakeUpRoutine[] = [
  {
    id: "wr-001",
    youngPerson: "yp_alex",
    weekdayWakeTime: "07:00",
    weekendWakeTime: "08:30",
    preferredWakeMethod: "Light + voice",
    wakeUpSteps: [
      { time: "07:00", activity: "Corner lamp on lowest, gentle voice from doorway", staffSupport: "Prompt" },
      { time: "07:05", activity: "5-minute snooze allowed (one only)", staffSupport: "None" },
      { time: "07:10", activity: "Sit up, second prompt — 'morning Alex, breakfast in 15'", staffSupport: "Prompt" },
      { time: "07:15", activity: "Bathroom — wash, brush teeth, sort hair", staffSupport: "None" },
      { time: "07:30", activity: "Get dressed — outfit chosen night before", staffSupport: "None" },
      { time: "07:40", activity: "Breakfast", staffSupport: "Prompt" },
      { time: "07:55", activity: "ADHD medication, bag check, leave by 08:05", staffSupport: "Hands-on" },
    ],
    morningTriggers: [
      "Being told to hurry up",
      "Sudden bright lights",
      "Pressure about previous-day issues",
      "Phone access too early — gets stuck on screen",
    ],
    morningProtective: [
      "Outfit prepared night before — reduces decision fatigue",
      "Calm voice, predictable language",
      "Phone NOT accessed until medication taken",
      "Music allowed during dressing if requested",
    ],
    breakfastPreferences: [
      "Cereal (chocolate-flavoured) most days",
      "Toast with peanut butter as alternative",
      "Always orange juice",
      "Will sometimes refuse if rushed — allow 15 mins",
    ],
    hygieneSequence: [
      "Wee, then wash face",
      "Brush teeth (electric brush — 2 min timer)",
      "Hair — quick gel, no fuss",
    ],
    schoolPrep: [
      "Bag packed and by door night before",
      "Lunch made fresh in morning by Alex (with prompt)",
      "Water bottle filled",
      "ADHD medication taken with breakfast — never on empty stomach",
    ],
    arrivalTime: "08:30 (school 8:50)",
    ifRefusingToGetUp: [
      "Don't escalate — Alex needs space to wake up properly",
      "Offer: 'I can come back in 5 mins or we can do this together now — your call'",
      "If still refusing at 07:30, light breakfast in bedroom acceptable as bridge",
      "Genuine school refusal — don't force, document, contact deputy/RM",
    ],
    energyPattern: "Slow starter",
    medicationMorning: "Methylphenidate XL (ADHD) — 7:55am with food, NEVER on empty stomach",
    childAgreed: true,
    reviewedDate: d(-14),
    reviewedWith: "staff_edward",
    effectivenessRating: 4,
  },
  {
    id: "wr-002",
    youngPerson: "yp_jordan",
    weekdayWakeTime: "07:00",
    weekendWakeTime: "08:00",
    preferredWakeMethod: "Music/playlist",
    wakeUpSteps: [
      { time: "07:00", activity: "Music playlist starts low (R&B/chillhop) from speaker", staffSupport: "None" },
      { time: "07:05", activity: "Phone returned (Jordan checks messages — agreed window)", staffSupport: "Prompt" },
      { time: "07:15", activity: "Up, bathroom, shower (long preference, 10-15 mins)", staffSupport: "None" },
      { time: "07:30", activity: "Get dressed, hair routine (Jordan very particular)", staffSupport: "None" },
      { time: "07:45", activity: "Breakfast — sociable time with whoever is up", staffSupport: "None" },
      { time: "08:00", activity: "Football kit/school prep, leave by 08:15", staffSupport: "Prompt" },
    ],
    morningTriggers: [
      "Being denied phone access first thing",
      "Anyone telling him hair/look is wrong",
      "Conversations about birth mother in morning",
      "Rushing — Jordan needs his shower time",
    ],
    morningProtective: [
      "Phone access first 10 mins (agreed)",
      "Music his choice — staff don't change track",
      "Shower not negotiable — schedule allows time",
      "Football routine on football days = built-in motivation",
    ],
    breakfastPreferences: [
      "Eggs and toast (most days)",
      "Cereal as backup",
      "Always tea (strong, milk, one sugar)",
      "On match days: bigger breakfast — porridge added",
    ],
    hygieneSequence: [
      "Shower (long — main wake-up activity)",
      "Skincare routine (started age 12 — important to him)",
      "Hair gel/products — 5 mins minimum",
      "Deodorant, body spray (his choice)",
    ],
    schoolPrep: [
      "Bag packed night before",
      "PE/football kit checked",
      "Lunch money or packed lunch",
      "Phone ready — important to Jordan",
    ],
    arrivalTime: "08:30 (school 8:45)",
    ifRefusingToGetUp: [
      "Often a sign something happened evening before — gently check",
      "Offer brief chat — Jordan often opens up here",
      "If health-related, be flexible (occasional duvet day for genuine need)",
      "If avoidance pattern, key worker conversation that day",
    ],
    energyPattern: "Quick starter",
    medicationMorning: "None prescribed",
    childAgreed: true,
    reviewedDate: d(-21),
    reviewedWith: "staff_ryan",
    effectivenessRating: 4,
  },
  {
    id: "wr-003",
    youngPerson: "yp_casey",
    weekdayWakeTime: "07:30",
    weekendWakeTime: "08:00",
    preferredWakeMethod: "White noise transition",
    wakeUpSteps: [
      { time: "07:30", activity: "White noise switches to morning playlist (specific track) — auto-set", staffSupport: "None" },
      { time: "07:32", activity: "Light gradually brightens via timer (smart bulb)", staffSupport: "None" },
      { time: "07:35", activity: "Knock on door — 'Morning Casey, I'm here when you're ready'", staffSupport: "Prompt" },
      { time: "07:40", activity: "Visual schedule reviewed for the day", staffSupport: "Hands-on" },
      { time: "07:45", activity: "Bathroom — sequence on visual card", staffSupport: "Prompt" },
      { time: "08:00", activity: "Same outfit pattern (3x identical sets)", staffSupport: "None" },
      { time: "08:10", activity: "Breakfast — same options, same cup, same plate", staffSupport: "Prompt" },
      { time: "08:25", activity: "Melatonin info noted, sensory tools packed, leave by 08:35", staffSupport: "Hands-on" },
    ],
    morningTriggers: [
      "ANY change to routine without warning",
      "Different cup/plate/spoon",
      "Bright/sudden light",
      "Multiple people in kitchen at breakfast",
      "Loud voices",
      "Being asked open questions before fully awake",
    ],
    morningProtective: [
      "Visual timetable previewed evening before AND on waking",
      "Same cutlery, same cup, same plate — DO NOT change",
      "One staff member only in kitchen during Casey's breakfast",
      "Predictable language, single instructions",
      "Sensory tools always available",
    ],
    breakfastPreferences: [
      "Plain Cheerios, in specific bowl (blue), with cold milk",
      "Half-glass apple juice (specific brand)",
      "NO variations — even running out of brand causes distress",
      "Backup: dry toast (no butter) — only acceptable substitute",
    ],
    hygieneSequence: [
      "Wee FIRST always (visual prompt)",
      "Wash hands and face with specific cloth (no scented)",
      "Brush teeth — same paste, same brush, 2-min timer",
      "Hair — quick brush only, no styling (sensory issue)",
      "Deodorant — unscented only",
    ],
    schoolPrep: [
      "Same bag, same compartments, same items",
      "Sensory bag (ear defenders, fidget, weighted lap pad) — non-negotiable",
      "Visual day-plan card in pocket",
      "Specific water bottle (Casey selected)",
    ],
    arrivalTime: "08:50 (specialist provision starts 09:00)",
    ifRefusingToGetUp: [
      "ASSUME sensory or anxiety reason first, never assume defiance",
      "Reduce demands — sit nearby, don't speak unnecessarily",
      "Use visual cards — 'school' or 'home' cards offered",
      "If genuinely overwhelmed, planned 'home day' is acceptable — call school",
      "Document trigger if identified — pattern recognition important",
    ],
    energyPattern: "Variable",
    medicationMorning: "None in morning (melatonin only at night). Sensory regulation tools instead of medication.",
    childAgreed: true,
    reviewedDate: d(-7),
    reviewedWith: "staff_anna",
    effectivenessRating: 5,
  },
];

// ── config ──────────────────────────────────────────────────────────────────
function ratingColour(r: number): string {
  if (r >= 4) return "text-green-600";
  if (r === 3) return "text-amber-600";
  return "text-red-600";
}

const energyColour: Record<string, string> = {
  "Slow starter": "bg-blue-100 text-blue-800",
  "Quick starter": "bg-green-100 text-green-800",
  "Variable": "bg-purple-100 text-purple-800",
};

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<WakeUpRoutine>[] = [
  { header: "Young Person", accessor: (r: WakeUpRoutine) => getYPName(r.youngPerson) },
  { header: "Weekday Wake", accessor: (r: WakeUpRoutine) => r.weekdayWakeTime },
  { header: "Weekend Wake", accessor: (r: WakeUpRoutine) => r.weekendWakeTime },
  { header: "Wake Method", accessor: (r: WakeUpRoutine) => r.preferredWakeMethod },
  { header: "Energy Pattern", accessor: (r: WakeUpRoutine) => r.energyPattern },
  { header: "Arrival Time", accessor: (r: WakeUpRoutine) => r.arrivalTime },
  { header: "Effectiveness", accessor: (r: WakeUpRoutine) => `${r.effectivenessRating}/5` },
  { header: "Last Reviewed", accessor: (r: WakeUpRoutine) => r.reviewedDate },
];

// ── component ───────────────────────────────────────────────────────────────
export default function WakeUpRoutinesPage() {
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
        case "wake":
          return a.weekdayWakeTime.localeCompare(b.weekdayWakeTime);
        case "effectiveness":
          return b.effectivenessRating - a.effectivenessRating;
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, sortBy]);

  const allChildAgreed = data.every((r) => r.childAgreed);
  const avgRating = (data.reduce((sum, r) => sum + r.effectivenessRating, 0) / data.length).toFixed(1);
  const reviewedRecently = data.filter((r) => r.reviewedDate >= d(-30)).length;

  return (
    <PageShell
      title="Wake-Up Routines"
      subtitle="Personalised morning routines — supporting transitions from sleep, regulation, and a calm start"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="wake-up-routines" />
          <PrintButton title="Wake-Up Routines" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{data.length}</p>
          <p className="text-xs text-muted-foreground">Active Plans</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allChildAgreed ? "100%" : `${data.filter((r) => r.childAgreed).length}/${data.length}`}</p>
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

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-6 flex items-start gap-2">
        <Sun className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          How a child wakes up sets the tone for their day. Personalised, sensory-informed wake routines are
          co-produced and respect each child&apos;s energy pattern and triggers.
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
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="wake">By Wake Time</SelectItem>
              <SelectItem value="effectiveness">By Effectiveness</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((routine) => {
          const isExpanded = expandedId === routine.id;
          return (
            <div key={routine.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : routine.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Sun className="h-5 w-5 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(routine.youngPerson)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Weekday {routine.weekdayWakeTime} &middot; Weekend {routine.weekendWakeTime} &middot; {routine.preferredWakeMethod}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", energyColour[routine.energyPattern])}>
                    {routine.energyPattern}
                  </span>
                  <span className={cn("text-sm font-bold", ratingColour(routine.effectivenessRating))}>{routine.effectivenessRating}/5</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Clock className="h-3 w-3 inline mr-1" />Wake Sequence
                    </p>
                    <div className="space-y-1.5">
                      {routine.wakeUpSteps.map((step, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border flex items-start gap-3 text-sm">
                          <span className="font-mono text-xs font-bold text-amber-700 shrink-0 w-12">{step.time}</span>
                          <span className="flex-1">{step.activity}</span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                            step.staffSupport === "None" ? "bg-green-100 text-green-800" :
                            step.staffSupport === "Prompt" ? "bg-blue-100 text-blue-800" :
                            "bg-purple-100 text-purple-800"
                          )}>
                            {step.staffSupport}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Morning Triggers
                      </p>
                      <ul className="space-y-1">
                        {routine.morningTriggers.map((t, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
                        <CheckCircle className="h-3 w-3 inline mr-1" />Protective Practices
                      </p>
                      <ul className="space-y-1">
                        {routine.morningProtective.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-green-600 mt-0.5">•</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Coffee className="h-3 w-3 inline mr-1" />Breakfast Preferences
                    </p>
                    <ul className="space-y-1">
                      {routine.breakfastPreferences.map((b, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-amber-600 mt-0.5">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Hygiene Sequence</p>
                      <ul className="space-y-1">
                        {routine.hygieneSequence.map((h, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <BookOpen className="h-3 w-3 inline mr-1" />School/Day Prep
                      </p>
                      <ul className="space-y-1">
                        {routine.schoolPrep.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-purple-600 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">If Refusing To Get Up</p>
                    <ul className="space-y-1">
                      {routine.ifRefusingToGetUp.map((r, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-red-600 mt-0.5">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {routine.medicationMorning && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">
                        <Activity className="h-3 w-3 inline mr-1" />Morning Medication
                      </p>
                      <p className="text-sm text-purple-900">{routine.medicationMorning}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Arrival target: {routine.arrivalTime}</span>
                    <span>Last reviewed: {routine.reviewedDate}</span>
                    <span>With: {getStaffName(routine.reviewedWith)}</span>
                    {routine.childAgreed && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium"><Heart className="h-3 w-3 inline mr-0.5" />Child Co-Produced</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Wake-up routines support Quality Standard 7 (health and wellbeing),
          Quality Standard 8 (education engagement), and the home&apos;s sensory and trauma-informed care framework.
          Plans co-produced with each child per UNCRC Article 12. Linked to Daily Routine Plans, Bedtime Routines,
          and Sleep Assessments.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
