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
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HouseholdTask, TaskCategory, SupportLevel } from "@/types/extended";
import { TASK_CATEGORY_LABEL, TASK_FREQUENCY_LABEL, SUPPORT_LEVEL_LABEL } from "@/types/extended";
import { useHouseholdTasks } from "@/hooks/use-household-tasks";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";

// ── helpers ─────────────────────────────────────────────────────────────────
function supportColour(s: SupportLevel): string {
  switch (s) {
    case "independent":
      return "bg-green-100 text-green-800";
    case "prompted":
      return "bg-blue-100 text-blue-800";
    case "supported":
      return "bg-purple-100 text-purple-800";
    case "doing_alongside_staff":
      return "bg-amber-100 text-amber-800";
  }
}

function categoryColour(c: TaskCategory): string {
  switch (c) {
    case "personal_room":
      return "bg-indigo-50 text-indigo-700";
    case "shared_space":
      return "bg-slate-100 text-slate-700";
    case "kitchen":
      return "bg-orange-50 text-orange-700";
    case "laundry":
      return "bg-cyan-50 text-cyan-700";
    case "garden":
      return "bg-emerald-50 text-emerald-700";
    case "pet_care":
      return "bg-pink-50 text-pink-700";
    case "shopping":
      return "bg-yellow-50 text-yellow-700";
    case "cooking":
      return "bg-red-50 text-red-700";
    case "cleaning":
      return "bg-blue-50 text-blue-700";
  }
}

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<HouseholdTask>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Task", accessor: (r) => r.task_name },
  { header: "Category", accessor: (r) => TASK_CATEGORY_LABEL[r.task_category] },
  { header: "Frequency", accessor: (r) => TASK_FREQUENCY_LABEL[r.frequency] },
  { header: "Support Level", accessor: (r) => SUPPORT_LEVEL_LABEL[r.support_level] },
  { header: "Child Chose", accessor: (r) => (r.child_chose ? "Yes" : "No") },
  {
    header: "Pocket Money",
    accessor: (r) =>
      r.pocket_money_linked && r.pocket_money_amount ? `£${r.pocket_money_amount}` : "No",
  },
  { header: "Recent Completions (4w)", accessor: (r) => String(r.completion_recent) },
  { header: "Last Reviewed", accessor: (r) => r.reviewed_date },
];

// ── component ───────────────────────────────────────────────────────────────
export default function HouseholdTasksRotaPage() {
  const { data: raw, isLoading } = useHouseholdTasks();
  const data = useMemo(() => raw?.data ?? [], [raw]);
  const [filterYP, setFilterYP] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <PageShell title="Household Tasks Rota" subtitle="Loading…">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </PageShell>
    );
  }

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((r) => r.child_id === filterYP);
    if (filterCategory !== "all") items = items.filter((r) => r.task_category === filterCategory);

    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.child_id.localeCompare(b.child_id);
        case "category":
          return a.task_category.localeCompare(b.task_category);
        case "frequency":
          return a.frequency.localeCompare(b.frequency);
        case "support":
          return a.support_level.localeCompare(b.support_level);
        case "reviewed":
          return a.reviewed_date.localeCompare(b.reviewed_date);
        default:
          return 0;
      }
    });
    return items;
  }, [data, filterYP, filterCategory, sortBy]);

  // ── stats ─────────────────────────────────────────────────────────────────
  const totalTasks = data.length;
  const childCount = new Set(data.map((r) => r.child_id)).size;
  const avgPerChild = childCount > 0 ? (totalTasks / childCount).toFixed(1) : "0";
  const independentTasks = data.filter((r) => r.support_level === "independent").length;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);
  const reviewsDue30d = data.filter((r) => r.reviewed_date < thirtyDaysAgoStr).length;

  const CATEGORIES: TaskCategory[] = [
    "personal_room", "shared_space", "kitchen", "laundry", "garden",
    "pet_care", "shopping", "cooking", "cleaning",
  ];

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
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{TASK_CATEGORY_LABEL[c]}</SelectItem>
            ))}
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
          const reviewOverdue = task.reviewed_date < thirtyDaysAgoStr;

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
                      {getYPName(task.child_id)} &middot; {task.task_name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", categoryColour(task.task_category))}>
                        {TASK_CATEGORY_LABEL[task.task_category]}
                      </span>
                      <span className="text-xs text-muted-foreground">{TASK_FREQUENCY_LABEL[task.frequency]}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", supportColour(task.support_level))}>
                        {SUPPORT_LEVEL_LABEL[task.support_level]}
                      </span>
                      {task.child_chose && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 font-medium">
                          Child chose
                        </span>
                      )}
                      {task.pocket_money_linked && task.pocket_money_amount && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium inline-flex items-center gap-0.5">
                          <Coins className="h-3 w-3" />£{task.pocket_money_amount}
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
                  <span className="text-sm font-bold text-emerald-700">{task.completion_recent}</span>
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
                      {task.skills_being_developed.map((s, i) => (
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
                      <p className="text-sm text-pink-900">{task.child_attitude}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                        <Eye className="h-3 w-3 inline mr-1" />Staff Observation
                      </p>
                      <p className="text-sm text-blue-900">{task.staff_observation}</p>
                    </div>
                  </div>

                  {/* sensory considerations */}
                  {task.sensory_considerations && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">
                        Sensory / Environmental Considerations
                      </p>
                      <p className="text-sm text-purple-900">{task.sensory_considerations}</p>
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
                    <span><Calendar className="h-3 w-3 inline mr-1" />Last reviewed: {task.reviewed_date}</span>
                    <span>Recent completions (4w): <strong className="text-foreground">{task.completion_recent}</strong></span>
                    <span>Frequency: {TASK_FREQUENCY_LABEL[task.frequency]}</span>
                    {task.pocket_money_linked && task.pocket_money_amount && (
                      <span>Pocket money: £{task.pocket_money_amount}</span>
                    )}
                  </div>

                  <SmartLinkPanel sourceType="household-tasks" sourceId={task.id} childId={task.child_id} compact />
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
