"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn, formatDate, todayStr } from "@/lib/utils";
import { useBedtimeRoutines } from "@/hooks/use-bedtime-routines";
import type { BedtimeRoutine } from "@/types/extended";
import {
  AGE_BAND_LABEL,
  ROUTINE_SUPPORT_LEVEL_LABEL,
} from "@/types/extended";
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
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

function ratingColour(r: number): string {
  if (r >= 4) return "text-green-600";
  if (r === 3) return "text-amber-600";
  return "text-red-600";
}

const exportCols: ExportColumn<BedtimeRoutine>[] = [
  { header: "Young Person", accessor: (r: BedtimeRoutine) => getYPName(r.child_id) },
  { header: "Age Band", accessor: (r: BedtimeRoutine) => AGE_BAND_LABEL[r.age_band] },
  { header: "Bedtime (Weekday)", accessor: (r: BedtimeRoutine) => r.agreed_bedtime },
  { header: "Bedtime (Weekend)", accessor: (r: BedtimeRoutine) => r.weekend_bedtime },
  { header: "Wind-Down Starts", accessor: (r: BedtimeRoutine) => r.wind_down_start_time },
  { header: "Effectiveness", accessor: (r: BedtimeRoutine) => `${r.effectiveness_rating}/5` },
  { header: "Child Agreed", accessor: (r: BedtimeRoutine) => r.child_agreed ? "Yes" : "No" },
  { header: "Last Reviewed", accessor: (r: BedtimeRoutine) => r.reviewed_date },
];

export default function BedtimeRoutinesPage() {
  const { data: res, isLoading } = useBedtimeRoutines();
  const data = useMemo(() => res?.data ?? [], [res]);
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <PageShell title="Bedtime Routines" subtitle="Personalised, co-produced bedtime plans — supporting sleep, regulation, and emotional safety">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const filtered = (() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((r) => r.child_id === filterYP);

    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.child_id.localeCompare(b.child_id);
        case "bedtime":
          return a.agreed_bedtime.localeCompare(b.agreed_bedtime);
        case "effectiveness":
          return b.effectiveness_rating - a.effectiveness_rating;
        default:
          return 0;
      }
    });
    return items;
  })();

  const totalPlans = data.length;
  const allChildAgreed = data.every((r) => r.child_agreed);
  const avgRating = (data.reduce((sum, r) => sum + r.effectiveness_rating, 0) / Math.max(1, data.length)).toFixed(1);
  const today = todayStr();
  const thirtyDaysAgo = (() => { const dt = new Date(); dt.setDate(dt.getDate() - 30); return dt.toISOString().slice(0, 10); })();
  const reviewedRecently = data.filter((r) => r.reviewed_date >= thirtyDaysAgo).length;

  return (
    <PageShell
      title="Bedtime Routines"
      subtitle="Personalised, co-produced bedtime plans — supporting sleep, regulation, and emotional safety"
      ariaContext={{ pageTitle: "Bedtime Routines", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="bedtime-routines" />
          <PrintButton title="Bedtime Routines" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{totalPlans}</p>
          <p className="text-xs text-muted-foreground">Active Plans</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allChildAgreed ? "100%" : `${data.filter((r) => r.child_agreed).length}/${totalPlans}`}</p>
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

      <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 mb-6 flex items-start gap-2">
        <Moon className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
        <p className="text-sm text-indigo-800">
          Sleep is a safeguarding issue. A consistent, child-led bedtime routine is a relational act of care.
          Plans are co-produced, sensory-informed, and reviewed monthly with each child.
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
              <SelectItem value="bedtime">By Bedtime</SelectItem>
              <SelectItem value="effectiveness">By Effectiveness</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No routines match your filters.</div>
        )}
        {filtered.map((routine) => {
          const isExpanded = expandedId === routine.id;

          return (
            <div key={routine.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : routine.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Moon className="h-5 w-5 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(routine.child_id)} ({AGE_BAND_LABEL[routine.age_band]})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Weekday {routine.agreed_bedtime} &middot; Weekend {routine.weekend_bedtime} &middot; Wind-down {routine.wind_down_start_time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-sm font-bold", ratingColour(routine.effectiveness_rating))}>{routine.effectiveness_rating}/5</span>
                  {routine.child_agreed && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Clock className="h-3 w-3 inline mr-1" />Routine Sequence
                    </p>
                    <div className="space-y-1.5">
                      {routine.routine_steps.map((step, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border flex items-start gap-3 text-sm">
                          <span className="font-mono text-xs font-bold text-indigo-700 shrink-0 w-12">{step.time}</span>
                          <span className="flex-1">{step.activity}</span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                            step.support_level === "independent" ? "bg-green-100 text-green-800" :
                            step.support_level === "prompted" ? "bg-blue-100 text-blue-800" :
                            "bg-purple-100 text-purple-800"
                          )}>
                            {ROUTINE_SUPPORT_LEVEL_LABEL[step.support_level]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sleep Environment</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-white rounded-lg p-2 border">
                        <p className="text-xs font-medium">Lighting</p>
                        <p className="text-xs text-muted-foreground">{routine.preferred_environment.lighting}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border">
                        <p className="text-xs font-medium">Temperature</p>
                        <p className="text-xs text-muted-foreground">{routine.preferred_environment.temperature}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border">
                        <p className="text-xs font-medium">Sound</p>
                        <p className="text-xs text-muted-foreground">{routine.preferred_environment.sound}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border">
                        <p className="text-xs font-medium">Bedding</p>
                        <p className="text-xs text-muted-foreground">{routine.preferred_environment.bedding}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Sensory Needs</p>
                      <ul className="space-y-1">
                        {routine.sensory_needs.map((s, i) => (
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
                        {routine.comfort_items.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-pink-600 mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Triggers To Avoid
                      </p>
                      <ul className="space-y-1">
                        {routine.triggers_to_avoid.map((t, i) => (
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
                        {routine.if_struggling_to_sleep.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {routine.night_terrors && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Night Terrors / Disturbance Plan</p>
                      <p className="text-sm text-purple-900">{routine.night_terrors}</p>
                    </div>
                  )}

                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
                      <Coffee className="h-3 w-3 inline mr-1" />Morning Wake Routine
                    </p>
                    <p className="text-sm text-green-900">{routine.morning_wake_routine}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Bath className="h-3 w-3 inline mr-1" />Last reviewed: {routine.reviewed_date}</span>
                    <span>With: {getStaffName(routine.reviewed_with)}</span>
                    <span>Effectiveness: {routine.effectiveness_rating}/5</span>
                    {routine.child_agreed && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Child Co-Produced</span>}
                  </div>

                  <SmartLinkPanel sourceType="bedtime-routines" sourceId={routine.id} childId={routine.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Bedtime routines support Quality Standard 7 (health and wellbeing),
          Quality Standard 5 (protection), and the home&apos;s sensory and trauma-informed care framework.
          Routines are co-produced with each child per UNCRC Article 12 and reviewed at least monthly.
          Linked to Sleep Assessments and Daily Routine Plans.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Sleep"
        category="sleep"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Bedtime Routines — sleep schedules, wind-down routines, night-time support, sleep difficulties, PTSD and sleep, medication at bedtime, safe sleeping, night log, wellbeing"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
