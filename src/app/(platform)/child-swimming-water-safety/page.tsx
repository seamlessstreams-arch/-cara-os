"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Waves,
  LifeBuoy,
  Award,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SwimRecord {
  id: string;
  youngPerson: string;
  recordedDate: string;
  swimmingLevel:
    | "Pre-Stage 1 (water shy)"
    | "Stage 1"
    | "Stage 2"
    | "Stage 3"
    | "Stage 4"
    | "Stage 5"
    | "Stage 6"
    | "Stage 7"
    | "Beyond stages — recreational competent"
    | "Not currently swimming";
  canSwim25m: boolean;
  canTreadWater: boolean;
  canFloatBack: boolean;
  comfortableUnderwater: boolean;
  lessonsBookedActive: boolean;
  lessonProvider?: string;
  lessonFrequency?: string;
  lessonsCost?: number;
  homeFundingSource?: string;
  schoolSwimmingDone: boolean;
  schoolSwimmingOutcome?: string;
  beachSafetyAware: string[];
  openWaterAwareness: string[];
  lifeJacketUsage: string[];
  triggersToWaterShy: string[];
  childVoice: string;
  staffObservation: string;
  nextStep: string;
  reviewDate: string;
  keyWorker: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const records: SwimRecord[] = [
  {
    id: "swim_001",
    youngPerson: "yp_jordan",
    recordedDate: d(-14),
    swimmingLevel: "Beyond stages — recreational competent",
    canSwim25m: true,
    canTreadWater: true,
    canFloatBack: true,
    comfortableUnderwater: true,
    lessonsBookedActive: false,
    schoolSwimmingDone: true,
    schoolSwimmingOutcome:
      "Met KS2 standard at primary school — 25m+, treading water, safe self-rescue all evidenced.",
    beachSafetyAware: [
      "Knows RNLI red and yellow flag system",
      "Will not swim alone on unfamiliar beach",
      "Understands lifeguard whistle signals",
    ],
    openWaterAwareness: [
      "Knows rip currents — float, signal, do not fight",
      "Cold water shock — enter slowly",
      "No diving into unknown depth",
    ],
    lifeJacketUsage: [
      "Wears buoyancy aid on kayak / paddleboard activities",
      "Has used life jacket on family ferry trip",
    ],
    triggersToWaterShy: [],
    childVoice:
      "I'm fine in water. I went to the leisure centre with my mates last week — we did the flumes. I'd want my own kids to be able to swim, definitely.",
    staffObservation:
      "Jordan is a confident, competent swimmer. Goes to leisure centre independently with peers. Strong protective factor for adulthood. No formal lessons needed — focus is on maintaining access (free swim card budgeted) and water safety conversations before holidays.",
    nextStep:
      "Free swim leisure card renewed for summer. Pre-Spain holiday water safety chat (pool depth, no drinking + swimming, sea conditions).",
    reviewDate: d(120),
    keyWorker: "staff_anna",
  },
  {
    id: "swim_002",
    youngPerson: "yp_alex",
    recordedDate: d(-21),
    swimmingLevel: "Stage 5",
    canSwim25m: true,
    canTreadWater: true,
    canFloatBack: true,
    comfortableUnderwater: true,
    lessonsBookedActive: false,
    lessonProvider: "Was attending Riverside Pool pre-care — currently paused",
    lessonFrequency: "Was weekly Saturdays",
    schoolSwimmingDone: true,
    schoolSwimmingOutcome:
      "Stage 5 reached at school — strong technical swimmer (front crawl, breaststroke, basic backstroke).",
    beachSafetyAware: [
      "Knows flag system",
      "Familiar with pool rules",
    ],
    openWaterAwareness: [
      "Anxious about open water post-trauma — links to specific incident",
      "Will go in supervised lakes / calm sea but reluctant",
      "Knows cold water shock theory",
    ],
    lifeJacketUsage: [
      "Will wear buoyancy aid for any open water activity",
      "Used life jacket on therapeutic boat trip last summer",
    ],
    triggersToWaterShy: [
      "Open / dark / deep water linked to pre-care incident",
      "Choppy conditions cause withdrawal",
      "Boxing fitness regime is helping rebuild physical confidence in body",
    ],
    childVoice:
      "I can swim 50m+ no problem in a pool. The sea freaks me out though — I don't like not seeing the bottom. I think I'll start lessons again in the summer when it's warmer. Boxing is helping me feel strong again.",
    staffObservation:
      "Alex is technically a strong swimmer (Stage 5) but post-trauma anxiety around open / deep water is significant. Pool sessions fine. Plan: resume Riverside Pool lessons in June (gentle re-entry), then build to lake / sea via supervised sessions with therapy support. Boxing fitness is rebuilding body confidence — relevant.",
    nextStep:
      "Resume Riverside Pool weekly lessons in June. Therapy team aware. Open water exposure work paced — only when Alex requests.",
    reviewDate: d(45),
    keyWorker: "staff_anna",
  },
  {
    id: "swim_003",
    youngPerson: "yp_casey",
    recordedDate: d(-7),
    swimmingLevel: "Stage 2",
    canSwim25m: false,
    canTreadWater: false,
    canFloatBack: true,
    comfortableUnderwater: false,
    lessonsBookedActive: true,
    lessonProvider: "Olympic Pool — private 1:1 with coach Jess",
    lessonFrequency: "Weekly Tuesdays 4pm (45 mins)",
    lessonsCost: 32,
    homeFundingSource:
      "Leaving care preventive fund — water safety prioritised as life skill / anti-drowning evidence base",
    schoolSwimmingDone: false,
    schoolSwimmingOutcome:
      "Declined school swimming sessions — sensory overwhelm in busy changing rooms + chlorine smell + cold pool. Home + school agreed private 1:1 alternative.",
    beachSafetyAware: [
      "Working on flag system (visual cards used)",
      "Knows to stay with adult at all beach visits",
    ],
    openWaterAwareness: [
      "Not yet — focus is still on pool confidence",
      "Will introduce calm-water awareness once Stage 4 reached",
    ],
    lifeJacketUsage: [
      "Will wear buoyancy aid at all open / shallow water",
      "Practised in pool with Jess to reduce sensory shock",
    ],
    triggersToWaterShy: [
      "Chlorine smell (sensory)",
      "Cold pool water (sensory)",
      "Loud echoey changing rooms (sensory)",
      "Other children splashing unpredictably",
      "Water in eyes",
    ],
    childVoice:
      "Jess is nice. The Olympic Pool is quieter than the school one. I can float on my back for 30 seconds now. I don't like the smell but the swimming is OK.",
    staffObservation:
      "Casey was water-shy at intake — sensory overwhelm rather than fear. Private 1:1 with experienced SEN-aware coach (Jess) at Olympic Pool (warmer water, quieter sessions, accessible changing) has been transformative. Stage 2 reached, working on Stage 3 (front paddle 5m + submerging face). This is regulated, well-paced, life-skill development — directly anti-drowning. Funding from leaving care preventive fund is well-justified — Casey will be a care leaver and water safety is a recognised vulnerability.",
    nextStep:
      "Continue weekly 1:1 with Jess. Stage 3 target by end of summer. Then introduce small-group lessons if Casey wants.",
    reviewDate: d(30),
    keyWorker: "staff_anna",
  },
];

const exportCols: ExportColumn<SwimRecord>[] = [
  { header: "Young Person", accessor: (r: SwimRecord) => getYPName(r.youngPerson) },
  { header: "Recorded", accessor: (r: SwimRecord) => r.recordedDate },
  { header: "Level", accessor: (r: SwimRecord) => r.swimmingLevel },
  { header: "Can swim 25m", accessor: (r: SwimRecord) => (r.canSwim25m ? "Yes" : "No") },
  { header: "Treads water", accessor: (r: SwimRecord) => (r.canTreadWater ? "Yes" : "No") },
  { header: "Floats on back", accessor: (r: SwimRecord) => (r.canFloatBack ? "Yes" : "No") },
  { header: "Comfortable underwater", accessor: (r: SwimRecord) => (r.comfortableUnderwater ? "Yes" : "No") },
  { header: "Lessons active", accessor: (r: SwimRecord) => (r.lessonsBookedActive ? "Yes" : "No") },
  { header: "Provider", accessor: (r: SwimRecord) => r.lessonProvider ?? "—" },
  { header: "Frequency", accessor: (r: SwimRecord) => r.lessonFrequency ?? "—" },
  { header: "Cost", accessor: (r: SwimRecord) => (r.lessonsCost != null ? `£${r.lessonsCost}` : "—") },
  { header: "Funding", accessor: (r: SwimRecord) => r.homeFundingSource ?? "—" },
  { header: "School swimming", accessor: (r: SwimRecord) => (r.schoolSwimmingDone ? "Yes" : "No") },
  { header: "School outcome", accessor: (r: SwimRecord) => r.schoolSwimmingOutcome ?? "—" },
  { header: "Beach safety", accessor: (r: SwimRecord) => r.beachSafetyAware.join("; ") },
  { header: "Open water", accessor: (r: SwimRecord) => r.openWaterAwareness.join("; ") },
  { header: "Life jacket", accessor: (r: SwimRecord) => r.lifeJacketUsage.join("; ") },
  { header: "Triggers", accessor: (r: SwimRecord) => r.triggersToWaterShy.join("; ") },
  { header: "Child Voice", accessor: (r: SwimRecord) => r.childVoice },
  { header: "Staff Observation", accessor: (r: SwimRecord) => r.staffObservation },
  { header: "Next Step", accessor: (r: SwimRecord) => r.nextStep },
  { header: "Review", accessor: (r: SwimRecord) => r.reviewDate },
  { header: "Key Worker", accessor: (r: SwimRecord) => getStaffName(r.keyWorker) },
];

const levelColour: Record<SwimRecord["swimmingLevel"], string> = {
  "Pre-Stage 1 (water shy)": "bg-rose-100 text-rose-800 border-rose-200",
  "Stage 1": "bg-amber-100 text-amber-800 border-amber-200",
  "Stage 2": "bg-amber-100 text-amber-800 border-amber-200",
  "Stage 3": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Stage 4": "bg-sky-100 text-sky-800 border-sky-200",
  "Stage 5": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Stage 6": "bg-blue-100 text-blue-800 border-blue-200",
  "Stage 7": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Beyond stages — recreational competent": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Not currently swimming": "bg-slate-100 text-slate-800 border-slate-200",
};

export default function ChildSwimmingWaterSafetyPage() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "level">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.youngPerson).toLowerCase().includes(search.toLowerCase()) ||
        rec.swimmingLevel.toLowerCase().includes(search.toLowerCase()) ||
        (rec.lessonProvider ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesLevel = levelFilter === "all" || rec.swimmingLevel === levelFilter;
      return matchesSearch && matchesLevel;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
      if (sortBy === "level") return a.swimmingLevel.localeCompare(b.swimmingLevel);
      return b.recordedDate.localeCompare(a.recordedDate);
    });
    return r;
  }, [search, levelFilter, sortBy]);

  const stats = useMemo(() => {
    const activeLearners = records.filter(
      (r) => r.swimmingLevel !== "Not currently swimming"
    ).length;
    const canSwim25m = records.filter((r) => r.canSwim25m).length;
    const lessonsRunning = records.filter((r) => r.lessonsBookedActive).length;
    const reviewsDue90 = records.filter((r) => {
      const today = new Date().toISOString().slice(0, 10);
      const ninety = d(90);
      return r.reviewDate >= today && r.reviewDate <= ninety;
    }).length;
    return { activeLearners, canSwim25m, lessonsRunning, reviewsDue90 };
  }, []);

  return (
    <PageShell
      title="Swimming & Water Safety"
      subtitle="Per-child swimming competence and water safety — RLSS National Curriculum stages, school swimming, current lessons, open water awareness, beach safety, life jacket use. Critical life skill especially for care leavers — anti-drowning evidence base."
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-swimming-water-safety" />
          <PrintButton title="Swimming & Water Safety" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
          <div className="flex items-center gap-2 text-sky-700 text-sm mb-1">
            <Waves className="h-4 w-4" />
            <span>Active learners</span>
          </div>
          <div className="text-2xl font-semibold text-sky-900">{stats.activeLearners}</div>
        </div>
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4">
          <div className="flex items-center gap-2 text-cyan-700 text-sm mb-1">
            <Award className="h-4 w-4" />
            <span>Can swim 25m</span>
          </div>
          <div className="text-2xl font-semibold text-cyan-900">{stats.canSwim25m}</div>
        </div>
        <div className="rounded-lg border border-sky-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <LifeBuoy className="h-4 w-4" />
            <span>Lessons running</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.lessonsRunning}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Calendar className="h-4 w-4" />
            <span>Reviews due (90d)</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.reviewsDue90}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search young person, level, provider..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Swimming level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="Pre-Stage 1 (water shy)">Pre-Stage 1 (water shy)</SelectItem>
            <SelectItem value="Stage 1">Stage 1</SelectItem>
            <SelectItem value="Stage 2">Stage 2</SelectItem>
            <SelectItem value="Stage 3">Stage 3</SelectItem>
            <SelectItem value="Stage 4">Stage 4</SelectItem>
            <SelectItem value="Stage 5">Stage 5</SelectItem>
            <SelectItem value="Stage 6">Stage 6</SelectItem>
            <SelectItem value="Stage 7">Stage 7</SelectItem>
            <SelectItem value="Beyond stages — recreational competent">Beyond stages</SelectItem>
            <SelectItem value="Not currently swimming">Not currently swimming</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Most recent</SelectItem>
            <SelectItem value="name">Young person A→Z</SelectItem>
            <SelectItem value="level">Swimming level</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isOpen = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-lg border border-sky-200 bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : r.id)}
                className="w-full p-4 flex items-start justify-between gap-3 hover:bg-sky-50/50 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-slate-900">{getYPName(r.youngPerson)}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", levelColour[r.swimmingLevel])}>
                      {r.swimmingLevel}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full border",
                        r.canSwim25m
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      )}
                    >
                      {r.canSwim25m ? "Can swim 25m" : "Not yet 25m"}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full border",
                        r.lessonsBookedActive
                          ? "bg-cyan-100 text-cyan-800 border-cyan-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      )}
                    >
                      {r.lessonsBookedActive ? "Lessons active" : "No active lessons"}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    Recorded {r.recordedDate} · Review {r.reviewDate} · {getStaffName(r.keyWorker)}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-sky-100 bg-sky-50/30">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Child Voice</div>
                      <p className="text-sm text-slate-700 italic">&ldquo;{r.childVoice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Staff Observation</div>
                      <p className="text-sm text-slate-700">{r.staffObservation}</p>
                    </div>

                    <div className="rounded-md border border-cyan-200 bg-white p-3">
                      <div className="text-xs font-semibold text-cyan-700 uppercase mb-2">Lessons</div>
                      <div className="text-sm text-slate-700 space-y-1">
                        <div>
                          <span className="text-slate-500">Active:</span>{" "}
                          {r.lessonsBookedActive ? "Yes" : "No"}
                        </div>
                        <div>
                          <span className="text-slate-500">Provider:</span> {r.lessonProvider ?? "—"}
                        </div>
                        <div>
                          <span className="text-slate-500">Frequency:</span> {r.lessonFrequency ?? "—"}
                        </div>
                        <div>
                          <span className="text-slate-500">Cost:</span>{" "}
                          {r.lessonsCost != null ? `£${r.lessonsCost}/session` : "—"}
                        </div>
                        <div>
                          <span className="text-slate-500">Funding:</span>{" "}
                          {r.homeFundingSource ?? "—"}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border border-sky-200 bg-white p-3">
                      <div className="text-xs font-semibold text-sky-700 uppercase mb-2">School Swimming</div>
                      <div className="text-sm text-slate-700 space-y-1">
                        <div>
                          <span className="text-slate-500">Done:</span>{" "}
                          {r.schoolSwimmingDone ? "Yes" : "No"}
                        </div>
                        <div className="text-slate-700">{r.schoolSwimmingOutcome ?? "—"}</div>
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                        Competence (KS2 standard: 25m + tread water + safe self-rescue)
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                        <div
                          className={cn(
                            "rounded-md border px-2 py-1.5",
                            r.canSwim25m
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-slate-50 border-slate-200 text-slate-600"
                          )}
                        >
                          {r.canSwim25m ? "✓" : "○"} 25m unaided
                        </div>
                        <div
                          className={cn(
                            "rounded-md border px-2 py-1.5",
                            r.canTreadWater
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-slate-50 border-slate-200 text-slate-600"
                          )}
                        >
                          {r.canTreadWater ? "✓" : "○"} Tread water
                        </div>
                        <div
                          className={cn(
                            "rounded-md border px-2 py-1.5",
                            r.canFloatBack
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-slate-50 border-slate-200 text-slate-600"
                          )}
                        >
                          {r.canFloatBack ? "✓" : "○"} Float on back
                        </div>
                        <div
                          className={cn(
                            "rounded-md border px-2 py-1.5",
                            r.comfortableUnderwater
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-slate-50 border-slate-200 text-slate-600"
                          )}
                        >
                          {r.comfortableUnderwater ? "✓" : "○"} Underwater
                        </div>
                      </div>
                    </div>

                    {r.beachSafetyAware.length ? (
                      <div className="rounded-md border border-sky-200 bg-white p-3">
                        <div className="text-xs font-semibold text-sky-700 uppercase mb-2">Beach safety</div>
                        <ul className="text-sm text-slate-700 space-y-1">
                          {r.beachSafetyAware.map((b, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-sky-500">•</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {r.openWaterAwareness.length ? (
                      <div className="rounded-md border border-cyan-200 bg-white p-3">
                        <div className="text-xs font-semibold text-cyan-700 uppercase mb-2">Open water awareness</div>
                        <ul className="text-sm text-slate-700 space-y-1">
                          {r.openWaterAwareness.map((o, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-cyan-500">•</span>
                              <span>{o}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {r.lifeJacketUsage.length ? (
                      <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Life jacket / buoyancy aid</div>
                        <ul className="text-sm text-slate-700 space-y-1">
                          {r.lifeJacketUsage.map((l, i) => (
                            <li key={i} className="flex gap-2">
                              <LifeBuoy className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                              <span>{l}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {r.triggersToWaterShy.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 uppercase mb-2">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Triggers / water-shy factors
                        </div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.triggersToWaterShy.map((t, i) => (
                            <li key={i} className="flex gap-2">
                              <span>!</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className="rounded-md border border-sky-200 bg-sky-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-sky-800 uppercase mb-2">Next step</div>
                      <p className="text-sm text-sky-900">{r.nextStep}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Swimming and water safety is a critical life skill — especially for care leavers who lose universal access on
          leaving care. Practice is grounded in the National Curriculum PE programme of study (KS2 swimming standard:
          25m unaided, tread water, perform safe self-rescue), Royal Life Saving Society UK National Curriculum stages
          1&ndash;7, and the RLSS UK National Drowning Prevention Strategy. Children&rsquo;s Homes Regulations Quality
          Standard 6 (Enjoyment & Achievement) and Quality Standard 8 (Health & Wellbeing) frame the duty. UNCRC Article
          31 (right to play, leisure, recreation) and RoSPA water safety guidance inform open water, beach, holiday and
          life jacket practice.
        </p>
      </div>
    </PageShell>
  );
}
