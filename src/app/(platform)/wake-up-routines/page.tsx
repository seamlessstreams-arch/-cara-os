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
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import type { WakeUpRoutine } from "@/types/extended";
import { useWakeUpRoutines } from "@/hooks/use-wake-up-routines";

// ── export columns ──────────────────────────────────────────────────────────
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

const exportCols: ExportColumn<WakeUpRoutine>[] = [
  { header: "Young Person", accessor: (r: WakeUpRoutine) => getYPName(r.child_id) },
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
  const { data: result, isLoading } = useWakeUpRoutines(undefined, "home_oak");
  const data = result?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((r) => r.child_id === filterYP);

    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.child_id.localeCompare(b.child_id);
        case "wake":
          return a.weekdayWakeTime.localeCompare(b.weekdayWakeTime);
        case "effectiveness":
          return b.effectivenessRating - a.effectivenessRating;
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, sortBy, data]);

  const allChildAgreed = data.every((r) => r.childAgreed);
  const avgRating = (data.reduce((sum, r) => sum + r.effectivenessRating, 0) / data.length).toFixed(1);
  const reviewedRecently = data.filter((r) => r.reviewedDate >= new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)).length;

  return (
    <PageShell
      title="Wake-Up Routines"
      subtitle="Personalised morning routines — supporting transitions from sleep, regulation, and a calm start"
      caraContext={{ pageTitle: "Wake-Up Routines", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="wake-up-routines" />
          <PrintButton title="Wake-Up Routines" />
          <CaraStudioQuickActionButton context={{ record_type: "daily_log", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : (<>
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
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : routine.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Sun className="h-5 w-5 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(routine.child_id)}</p>
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
        title="Care Events — Sleep"
        category="sleep"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Wake-Up Routines — morning routines, getting-up protocols, medication times, breakfast routines, school readiness, child-specific wake-up needs, daily structure evidence"
        recordType="daily_log"
        className="mt-6"
      />
      </>)}
    </PageShell>
  );
}
