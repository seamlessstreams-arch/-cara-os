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
  Sparkles,
  CheckCircle,
  Coins,
  Heart,
  Wrench,
  Calendar,
  Eye,
  Lightbulb,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── types ───────────────────────────────────────────────────────────────────
type TaskCategory =
  | "Personal room"
  | "Shared space"
  | "Kitchen"
  | "Laundry"
  | "Garden"
  | "Pet care"
  | "Shopping"
  | "Cooking"
  | "Cleaning";

type Frequency = "Daily" | "Weekly" | "Fortnightly" | "Ad-hoc";

type SupportLevel =
  | "Independent"
  | "Prompted"
  | "Supported"
  | "Doing alongside staff";

interface HouseholdTask {
  id: string;
  youngPerson: string;
  taskName: string;
  taskCategory: TaskCategory;
  frequency: Frequency;
  supportLevel: SupportLevel;
  childChose: boolean;
  pocketMoneyLinked: boolean;
  pocketMoneyAmount?: number;
  sensoryConsiderations: string;
  skillsBeingDeveloped: string[];
  childAttitude: string;
  staffObservation: string;
  completionRecent: number; // last 4 weeks
  reviewedDate: string;
  notes: string;
}

// ── seed data ───────────────────────────────────────────────────────────────
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: HouseholdTask[] = [
  {
    id: "ht-001",
    youngPerson: "yp_casey",
    taskName: "Bedroom care — making bed, tidying surfaces, hoovering",
    taskCategory: "Personal room",
    frequency: "Daily",
    supportLevel: "Independent",
    childChose: true,
    pocketMoneyLinked: false,
    sensoryConsiderations:
      "Hoover noise dysregulating — Casey wears ear defenders and chooses time. Plain unscented cleaning spray only.",
    skillsBeingDeveloped: [
      "Self-care routines",
      "Sequencing tasks independently",
      "Pride of personal space",
    ],
    childAttitude:
      "Casey's strongest area — bedroom care is self-led and a source of pride. Strong sense of ownership.",
    staffObservation:
      "Casey rarely needs prompting. Visual checklist on inside of wardrobe door. Extremely consistent.",
    completionRecent: 27,
    reviewedDate: d(-9),
    notes:
      "Avoid commenting on minor variations — Casey notices small changes and feels criticised. Affirm consistency only when authentic.",
  },
  {
    id: "ht-002",
    youngPerson: "yp_jordan",
    taskName: "Sunday family-style cooking — Caribbean meal",
    taskCategory: "Cooking",
    frequency: "Weekly",
    supportLevel: "Doing alongside staff",
    childChose: true,
    pocketMoneyLinked: false,
    sensoryConsiderations:
      "Loves the smell of his nan's seasoning — links to early childhood memories. Heat in kitchen ok.",
    skillsBeingDeveloped: [
      "Cultural identity and heritage",
      "Knife skills (under supervision)",
      "Meal planning and budgeting",
      "Pride in cooking for others",
    ],
    childAttitude:
      "Genuinely lit-up activity. Jordan has shared family recipes — rice and peas, jerk chicken. Often invites staff to taste.",
    staffObservation:
      "Has progressed from chopping to leading the timing. Confident with seasoning. Cultural plan links to identity work.",
    completionRecent: 4,
    reviewedDate: d(-12),
    notes:
      "Cultural significance — this is more than a chore. Protects Jordan's heritage connection. Budget £15 from house food spend.",
  },
  {
    id: "ht-003",
    youngPerson: "yp_alex",
    taskName: "Recycling rota — sorting, bins out Tuesday evening",
    taskCategory: "Shared space",
    frequency: "Weekly",
    supportLevel: "Independent",
    childChose: true,
    pocketMoneyLinked: true,
    pocketMoneyAmount: 3,
    sensoryConsiderations:
      "Outdoor task — Alex prefers this in dusk light. Gloves provided.",
    skillsBeingDeveloped: [
      "Environmental responsibility",
      "Time-keeping (specific bin day)",
      "Earning through contribution",
    ],
    childAttitude:
      "Took this on himself after a school project on climate. Takes it seriously — sometimes corrects staff sorting.",
    staffObservation:
      "100% reliability over 8 weeks. Has asked to extend to garden composting next month.",
    completionRecent: 4,
    reviewedDate: d(-6),
    notes:
      "Pocket money agreement reviewed monthly. Linked to Alex's growing interest in environmental issues.",
  },
  {
    id: "ht-004",
    youngPerson: "yp_alex",
    taskName: "Loading and unloading dishwasher (after evening meal)",
    taskCategory: "Kitchen",
    frequency: "Daily",
    supportLevel: "Prompted",
    childChose: false,
    pocketMoneyLinked: false,
    sensoryConsiderations: "No issues noted.",
    skillsBeingDeveloped: [
      "Routine completion without reward",
      "Contributing to shared living",
    ],
    childAttitude:
      "Reluctant. Sees this as 'unfair' as it's not chosen. Will do with one prompt — rarely refuses.",
    staffObservation:
      "Honest reflection: this was assigned not chosen. Discuss whether to swap for a chosen task at next key-work session.",
    completionRecent: 22,
    reviewedDate: d(-21),
    notes:
      "Not all tasks are co-chosen — household functioning matters too. Reviewing balance of chosen vs assigned at next house meeting.",
  },
  {
    id: "ht-005",
    youngPerson: "yp_jordan",
    taskName: "Weekly food shop — list-building and trip",
    taskCategory: "Shopping",
    frequency: "Weekly",
    supportLevel: "Doing alongside staff",
    childChose: true,
    pocketMoneyLinked: false,
    sensoryConsiderations:
      "Larger supermarkets feel overwhelming — uses smaller local shop. Avoids Saturdays.",
    skillsBeingDeveloped: [
      "Budgeting (£120 weekly)",
      "Comparing prices and unit cost",
      "Decision-making within constraints",
      "Independent travel skills (10-min walk)",
    ],
    childAttitude:
      "Genuinely enjoys this — sees it as 'adult'. Has started suggesting house meals.",
    staffObservation:
      "Numeracy skills strengthened. Confident with self-checkout. Building toward solo shop in 6 months per pathway plan.",
    completionRecent: 4,
    reviewedDate: d(-12),
    notes:
      "Evidence for Pathway Plan independence skills. Quality Standard 12 — preparation for adulthood.",
  },
  {
    id: "ht-006",
    youngPerson: "yp_casey",
    taskName: "Folding and putting away own laundry",
    taskCategory: "Laundry",
    frequency: "Weekly",
    supportLevel: "Prompted",
    childChose: true,
    pocketMoneyLinked: false,
    sensoryConsiderations:
      "Specific fold method — Casey insists on consistency. Tag-free clothes only. Same drawer arrangement each week.",
    skillsBeingDeveloped: [
      "Routine maintenance",
      "Caring for own belongings",
      "Following multi-step process",
    ],
    childAttitude:
      "Calming and predictable for Casey. Approaches it as a sensory task rather than a chore.",
    staffObservation:
      "Folds same items in same order — staff respect this. Disturbance to system causes distress.",
    completionRecent: 4,
    reviewedDate: d(-15),
    notes:
      "Do NOT 'help' by re-folding. Visual prompt sheet on bedside table (Casey designed it).",
  },
  {
    id: "ht-007",
    youngPerson: "yp_alex",
    taskName: "Walking Buddy (next-door neighbour's dog) Saturdays",
    taskCategory: "Pet care",
    frequency: "Weekly",
    supportLevel: "Independent",
    childChose: true,
    pocketMoneyLinked: true,
    pocketMoneyAmount: 5,
    sensoryConsiderations:
      "Regulating — outdoor time and animal connection both calming for Alex.",
    skillsBeingDeveloped: [
      "Responsibility to a living thing",
      "Community connection",
      "Earning through paid work",
    ],
    childAttitude:
      "One of Alex's favourite parts of the week. Has asked about volunteering at local rescue centre.",
    staffObservation:
      "Reliable and gentle. Owner Mrs Patterson reports glowing feedback. Risk assessment in place.",
    completionRecent: 4,
    reviewedDate: d(-30),
    notes:
      "Risk assessment due renewal. Real paid work — separate from house pocket money. Counts as community participation.",
  },
  {
    id: "ht-008",
    youngPerson: "yp_jordan",
    taskName: "Vegetable patch — watering and weeding",
    taskCategory: "Garden",
    frequency: "Daily",
    supportLevel: "Independent",
    childChose: true,
    pocketMoneyLinked: false,
    sensoryConsiderations:
      "Outdoor regulation — Jordan finds garden time grounding, especially mornings.",
    skillsBeingDeveloped: [
      "Patience and care over time",
      "Connection to food origins",
      "Quiet outdoor time",
    ],
    childAttitude:
      "Took ownership in spring. Brings vegetables in for cooking task — full circle.",
    staffObservation:
      "Has shown unexpected commitment. Asked for a second bed next year. Therapy team note positive impact on regulation.",
    completionRecent: 26,
    reviewedDate: d(-18),
    notes:
      "Therapeutic angle: nature-based regulation. Linked to Sunday cooking task — meaningful integration.",
  },
  {
    id: "ht-009",
    youngPerson: "yp_casey",
    taskName: "Helping prep weekly visual menu (Sunday morning)",
    taskCategory: "Kitchen",
    frequency: "Weekly",
    supportLevel: "Supported",
    childChose: true,
    pocketMoneyLinked: false,
    sensoryConsiderations:
      "Casey leads — cuts pictures from supermarket leaflets, sticks on weekly chart. Calm activity.",
    skillsBeingDeveloped: [
      "Communication of preferences",
      "Sequencing (days of week)",
      "Decision-making in low-pressure setting",
    ],
    childAttitude:
      "Engaged and focused. Casey created the format — staff follow her system.",
    staffObservation:
      "Excellent example of child-led task design. Has reduced mealtime anxiety because Casey knows what's coming.",
    completionRecent: 4,
    reviewedDate: d(-10),
    notes:
      "The task IS the visual menu other children also benefit from. Casey's accommodation has become house infrastructure.",
  },
  {
    id: "ht-010",
    youngPerson: "yp_alex",
    taskName: "Bathroom clean (own use) — Wednesday and Saturday",
    taskCategory: "Cleaning",
    frequency: "Fortnightly",
    supportLevel: "Prompted",
    childChose: false,
    pocketMoneyLinked: false,
    sensoryConsiderations:
      "Strong cleaning product smells — uses fragrance-free spray only.",
    skillsBeingDeveloped: [
      "Hygiene maintenance",
      "Caring for shared resources",
    ],
    childAttitude:
      "Tolerated rather than enjoyed. Will do but quality varies. Better with two-prompt rule and a podcast playing.",
    staffObservation:
      "Honest — sometimes done minimally. Discussed at last key-work — Alex agreed it's important even if disliked.",
    completionRecent: 7,
    reviewedDate: d(-40),
    notes:
      "DUE FOR REVIEW. Consider whether different cleaning product or time would help.",
  },
  {
    id: "ht-011",
    youngPerson: "yp_jordan",
    taskName: "Helping younger residents with breakfast (mentor role)",
    taskCategory: "Cooking",
    frequency: "Daily",
    supportLevel: "Independent",
    childChose: true,
    pocketMoneyLinked: false,
    sensoryConsiderations: "Kitchen busy in morning — Jordan manages this well.",
    skillsBeingDeveloped: [
      "Leadership and mentoring",
      "Modelling positive behaviour",
      "Empathy in practice",
    ],
    childAttitude:
      "Proud of this role. Sees himself as 'big brother' to newer residents.",
    staffObservation:
      "Significant emotional growth indicator. Jordan asked for this role — staff agreed cautiously, has been excellent.",
    completionRecent: 24,
    reviewedDate: d(-22),
    notes:
      "Not in formal pathway plan but mentioned in monthly placement review. Powerful relational task.",
  },
  {
    id: "ht-012",
    youngPerson: "yp_casey",
    taskName: "Putting clean dishes away (matching to specific places)",
    taskCategory: "Kitchen",
    frequency: "Daily",
    supportLevel: "Supported",
    childChose: true,
    pocketMoneyLinked: false,
    sensoryConsiderations:
      "Casey designed labelled cupboards — items must go in labelled spots.",
    skillsBeingDeveloped: [
      "Sorting and categorisation",
      "Contributing to shared kitchen",
      "Building tolerance to others' presence in kitchen",
    ],
    childAttitude:
      "Casey's choice — likes the matching aspect. Will do alone but tolerates one staff member nearby.",
    staffObservation:
      "Positive. Has begun helping unload shopping into labelled cupboards — same matching skill generalising.",
    completionRecent: 25,
    reviewedDate: d(-14),
    notes:
      "Cupboard label system Casey designed is now permanent — accommodation that benefits everyone.",
  },
];

// ── helpers ─────────────────────────────────────────────────────────────────
function supportColour(s: SupportLevel): string {
  switch (s) {
    case "Independent":
      return "bg-green-100 text-green-800";
    case "Prompted":
      return "bg-blue-100 text-blue-800";
    case "Supported":
      return "bg-purple-100 text-purple-800";
    case "Doing alongside staff":
      return "bg-amber-100 text-amber-800";
  }
}

function categoryColour(c: TaskCategory): string {
  switch (c) {
    case "Personal room":
      return "bg-indigo-50 text-indigo-700";
    case "Shared space":
      return "bg-slate-100 text-slate-700";
    case "Kitchen":
      return "bg-orange-50 text-orange-700";
    case "Laundry":
      return "bg-cyan-50 text-cyan-700";
    case "Garden":
      return "bg-emerald-50 text-emerald-700";
    case "Pet care":
      return "bg-pink-50 text-pink-700";
    case "Shopping":
      return "bg-yellow-50 text-yellow-700";
    case "Cooking":
      return "bg-red-50 text-red-700";
    case "Cleaning":
      return "bg-blue-50 text-blue-700";
  }
}

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<HouseholdTask>[] = [
  { header: "Young Person", accessor: (r: HouseholdTask) => getYPName(r.youngPerson) },
  { header: "Task", accessor: (r: HouseholdTask) => r.taskName },
  { header: "Category", accessor: (r: HouseholdTask) => r.taskCategory },
  { header: "Frequency", accessor: (r: HouseholdTask) => r.frequency },
  { header: "Support Level", accessor: (r: HouseholdTask) => r.supportLevel },
  { header: "Child Chose", accessor: (r: HouseholdTask) => (r.childChose ? "Yes" : "No") },
  {
    header: "Pocket Money",
    accessor: (r: HouseholdTask) =>
      r.pocketMoneyLinked && r.pocketMoneyAmount ? `£${r.pocketMoneyAmount}` : "No",
  },
  { header: "Recent Completions (4w)", accessor: (r: HouseholdTask) => String(r.completionRecent) },
  { header: "Last Reviewed", accessor: (r: HouseholdTask) => r.reviewedDate },
];

// ── component ───────────────────────────────────────────────────────────────
export default function HouseholdTasksRotaPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((r) => r.youngPerson === filterYP);
    if (filterCategory !== "all") items = items.filter((r) => r.taskCategory === filterCategory);

    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.youngPerson.localeCompare(b.youngPerson);
        case "category":
          return a.taskCategory.localeCompare(b.taskCategory);
        case "frequency":
          return a.frequency.localeCompare(b.frequency);
        case "support":
          return a.supportLevel.localeCompare(b.supportLevel);
        case "reviewed":
          return a.reviewedDate.localeCompare(b.reviewedDate);
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, filterCategory, sortBy]);

  // ── stats ─────────────────────────────────────────────────────────────────
  const totalTasks = data.length;
  const childCount = new Set(data.map((r) => r.youngPerson)).size;
  const avgPerChild = (totalTasks / childCount).toFixed(1);
  const independentTasks = data.filter((r) => r.supportLevel === "Independent").length;
  const reviewsDue30d = data.filter((r) => r.reviewedDate < d(-30)).length;

  return (
    <PageShell
      title="Household Tasks Rota"
      subtitle="Children's contribution to household life — building independence skills age-appropriately"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="household-tasks-rota" />
          <PrintButton title="Household Tasks Rota" />
        </div>
      }
    >
      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{totalTasks}</p>
          <p className="text-xs text-muted-foreground">Active Tasks</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{avgPerChild}</p>
          <p className="text-xs text-muted-foreground">Avg per Child</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{independentTasks}</p>
          <p className="text-xs text-muted-foreground">Independent Tasks</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{reviewsDue30d}</p>
          <p className="text-xs text-muted-foreground">Reviews Due 30d</p>
        </div>
      </div>

      {/* ── philosophy banner ──────────────────────────────────────────── */}
      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mb-6 flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <p className="text-sm text-emerald-800">
          Household tasks build independence, identity, and pride. Tasks are co-chosen wherever possible,
          paced to each child&apos;s development, and reviewed alongside the Pathway Plan. This is preparation
          for adulthood happening in the everyday.
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
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Personal room">Personal room</SelectItem>
            <SelectItem value="Shared space">Shared space</SelectItem>
            <SelectItem value="Kitchen">Kitchen</SelectItem>
            <SelectItem value="Laundry">Laundry</SelectItem>
            <SelectItem value="Garden">Garden</SelectItem>
            <SelectItem value="Pet care">Pet care</SelectItem>
            <SelectItem value="Shopping">Shopping</SelectItem>
            <SelectItem value="Cooking">Cooking</SelectItem>
            <SelectItem value="Cleaning">Cleaning</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="category">By Category</SelectItem>
              <SelectItem value="frequency">By Frequency</SelectItem>
              <SelectItem value="support">By Support Level</SelectItem>
              <SelectItem value="reviewed">By Last Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── task cards ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No tasks match your filters.</div>
        )}
        {filtered.map((task) => {
          const isExpanded = expandedId === task.id;
          const reviewOverdue = task.reviewedDate < d(-30);

          return (
            <div key={task.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : task.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Wrench className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {getYPName(task.youngPerson)} &middot; {task.taskName}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", categoryColour(task.taskCategory))}>
                        {task.taskCategory}
                      </span>
                      <span className="text-xs text-muted-foreground">{task.frequency}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", supportColour(task.supportLevel))}>
                        {task.supportLevel}
                      </span>
                      {task.childChose && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 font-medium">
                          Child chose
                        </span>
                      )}
                      {task.pocketMoneyLinked && task.pocketMoneyAmount && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium inline-flex items-center gap-0.5">
                          <Coins className="h-3 w-3" />£{task.pocketMoneyAmount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {reviewOverdue && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                      Review due
                    </span>
                  )}
                  <span className="text-sm font-bold text-emerald-700">{task.completionRecent}</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* skills */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Lightbulb className="h-3 w-3 inline mr-1" />Skills Being Developed
                    </p>
                    <ul className="space-y-1">
                      {task.skillsBeingDeveloped.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* attitude + observation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-pink-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">
                        <Heart className="h-3 w-3 inline mr-1" />Child&apos;s Attitude
                      </p>
                      <p className="text-sm text-pink-900">{task.childAttitude}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                        <Eye className="h-3 w-3 inline mr-1" />Staff Observation
                      </p>
                      <p className="text-sm text-blue-900">{task.staffObservation}</p>
                    </div>
                  </div>

                  {/* sensory considerations */}
                  {task.sensoryConsiderations && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">
                        Sensory / Environmental Considerations
                      </p>
                      <p className="text-sm text-purple-900">{task.sensoryConsiderations}</p>
                    </div>
                  )}

                  {/* notes */}
                  {task.notes && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm text-amber-900">{task.notes}</p>
                    </div>
                  )}

                  {/* metadata */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Calendar className="h-3 w-3 inline mr-1" />Last reviewed: {task.reviewedDate}</span>
                    <span>Recent completions (4w): <strong className="text-foreground">{task.completionRecent}</strong></span>
                    <span>Frequency: {task.frequency}</span>
                    {task.pocketMoneyLinked && task.pocketMoneyAmount && (
                      <span>Pocket money: £{task.pocketMoneyAmount}</span>
                    )}
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
          <strong>Regulatory Context:</strong> Required by Quality Standard 12 (preparation for adulthood
          / independence). Tasks evidence age-appropriate skill-building and contribute to each child&apos;s
          Pathway Plan. Co-chosen tasks reflect UNCRC Article 12 (right to be heard). Reviewed alongside
          Pocket Money agreements, Pathway Plans, and Key-Work records. Staff: {getStaffName("staff_darren")}, {getStaffName("staff_anna")}.
        </p>
      </div>
    </PageShell>
  );
}
