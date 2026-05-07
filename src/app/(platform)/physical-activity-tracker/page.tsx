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
  Activity,
  Heart,
  TrendingUp,
  Clock,
  Star,
  Smile,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PhysicalActivityEntry } from "@/types/extended";
import {
  PHYSICAL_ACTIVITY_CATEGORY_LABEL,
  PHYSICAL_ACTIVITY_INTENSITY_LABEL,
  PHYSICAL_ACTIVITY_INITIATOR_LABEL,
  PHYSICAL_ACTIVITY_SOCIAL_ASPECT_LABEL,
} from "@/types/extended";
import { usePhysicalActivityEntries } from "@/hooks/use-physical-activity-entries";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";

const categoryColour: Record<string, string> = {
  sport: "bg-red-100 text-red-800",
  walking_hiking: "bg-emerald-100 text-emerald-800",
  cycling: "bg-blue-100 text-blue-800",
  dance_movement: "bg-pink-100 text-pink-800",
  active_play: "bg-amber-100 text-amber-800",
  swimming: "bg-cyan-100 text-cyan-800",
  gym: "bg-purple-100 text-purple-800",
  outdoor_adventure: "bg-emerald-100 text-emerald-800",
  daily_activity: "bg-slate-100 text-slate-800",
  active_travel: "bg-blue-100 text-blue-800",
};

const intensityColour: Record<string, string> = {
  light: "bg-blue-100 text-blue-800",
  moderate: "bg-amber-100 text-amber-800",
  vigorous: "bg-red-100 text-red-800",
};

const exportCols: ExportColumn<PhysicalActivityEntry>[] = [
  { header: "Young Person", accessor: (r: PhysicalActivityEntry) => getYPName(r.child_id) },
  { header: "Date", accessor: (r: PhysicalActivityEntry) => r.date },
  { header: "Activity", accessor: (r: PhysicalActivityEntry) => r.activity },
  { header: "Category", accessor: (r: PhysicalActivityEntry) => PHYSICAL_ACTIVITY_CATEGORY_LABEL[r.category] },
  { header: "Intensity", accessor: (r: PhysicalActivityEntry) => PHYSICAL_ACTIVITY_INTENSITY_LABEL[r.intensity] },
  { header: "Duration (min)", accessor: (r: PhysicalActivityEntry) => String(r.duration_minutes) },
  { header: "Initiated By", accessor: (r: PhysicalActivityEntry) => PHYSICAL_ACTIVITY_INITIATOR_LABEL[r.initiated_by] },
  { header: "Enjoyment", accessor: (r: PhysicalActivityEntry) => `${r.enjoyment_rating}/5` },
  { header: "Social", accessor: (r: PhysicalActivityEntry) => PHYSICAL_ACTIVITY_SOCIAL_ASPECT_LABEL[r.social_aspect] },
];

export default function PhysicalActivityTrackerPage() {
  const { data: res, isLoading } = usePhysicalActivityEntries();
  const records = res?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterIntensity, setFilterIntensity] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterYP !== "all") items = items.filter((a) => a.child_id === filterYP);
    if (filterCategory !== "all") items = items.filter((a) => a.category === filterCategory);
    if (filterIntensity !== "all") items = items.filter((a) => a.intensity === filterIntensity);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "duration":
          return b.duration_minutes - a.duration_minutes;
        case "enjoyment":
          return b.enjoyment_rating - a.enjoyment_rating;
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterYP, filterCategory, filterIntensity, sortBy]);

  const total = records.length;
  const totalMinutes = records.reduce((sum, a) => sum + a.duration_minutes, 0);
  const childInitiated = records.filter((a) => a.initiated_by === "child").length;
  const avgEnjoyment = records.length
    ? (records.reduce((sum, a) => sum + a.enjoyment_rating, 0) / records.length).toFixed(1)
    : "0.0";

  return (
    <PageShell
      title="Physical Activity Tracker"
      subtitle="Per-child physical activity — variety, enjoyment, identity, regulation"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="physical-activity-tracker" />
          <PrintButton title="Physical Activity Tracker" />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border bg-white p-4 text-center">
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">Recent Activities</p>
            </div>
            <div className="rounded-xl border bg-white p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{Math.round(totalMinutes / 60)}h</p>
              <p className="text-xs text-muted-foreground">Total Minutes</p>
            </div>
            <div className="rounded-xl border bg-white p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{childInitiated}</p>
              <p className="text-xs text-muted-foreground">Child-Initiated</p>
            </div>
            <div className="rounded-xl border bg-white p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{avgEnjoyment}/5</p>
              <p className="text-xs text-muted-foreground">Avg Enjoyment</p>
            </div>
          </div>

          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mb-6 flex items-start gap-2">
            <Activity className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-sm text-emerald-800">
              Physical activity is enjoyment, identity, regulation, and health all at once. We track variety,
              intensity, and child voice — the goal isn&apos;t a step count, it&apos;s a thriving body and a
              curious mind. Every child&apos;s activity profile looks different, and that&apos;s the point.
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
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="sport">{PHYSICAL_ACTIVITY_CATEGORY_LABEL.sport}</SelectItem>
                <SelectItem value="walking_hiking">{PHYSICAL_ACTIVITY_CATEGORY_LABEL.walking_hiking}</SelectItem>
                <SelectItem value="cycling">{PHYSICAL_ACTIVITY_CATEGORY_LABEL.cycling}</SelectItem>
                <SelectItem value="dance_movement">{PHYSICAL_ACTIVITY_CATEGORY_LABEL.dance_movement}</SelectItem>
                <SelectItem value="active_play">{PHYSICAL_ACTIVITY_CATEGORY_LABEL.active_play}</SelectItem>
                <SelectItem value="swimming">{PHYSICAL_ACTIVITY_CATEGORY_LABEL.swimming}</SelectItem>
                <SelectItem value="gym">{PHYSICAL_ACTIVITY_CATEGORY_LABEL.gym}</SelectItem>
                <SelectItem value="outdoor_adventure">{PHYSICAL_ACTIVITY_CATEGORY_LABEL.outdoor_adventure}</SelectItem>
                <SelectItem value="daily_activity">{PHYSICAL_ACTIVITY_CATEGORY_LABEL.daily_activity}</SelectItem>
                <SelectItem value="active_travel">{PHYSICAL_ACTIVITY_CATEGORY_LABEL.active_travel}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterIntensity} onValueChange={setFilterIntensity}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Intensity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Intensities</SelectItem>
                <SelectItem value="light">{PHYSICAL_ACTIVITY_INTENSITY_LABEL.light}</SelectItem>
                <SelectItem value="moderate">{PHYSICAL_ACTIVITY_INTENSITY_LABEL.moderate}</SelectItem>
                <SelectItem value="vigorous">{PHYSICAL_ACTIVITY_INTENSITY_LABEL.vigorous}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Most Recent</SelectItem>
                  <SelectItem value="duration">Longest First</SelectItem>
                  <SelectItem value="enjoyment">Most Enjoyed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map((a) => {
              const isExpanded = expandedId === a.id;

              return (
                <div key={a.id} className="rounded-xl border bg-white overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : a.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Activity className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{a.activity}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {a.date} &middot; {getYPName(a.child_id)} &middot; {a.duration_minutes} mins &middot; {a.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", categoryColour[a.category])}>
                        {PHYSICAL_ACTIVITY_CATEGORY_LABEL[a.category]}
                      </span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", intensityColour[a.intensity])}>
                        {PHYSICAL_ACTIVITY_INTENSITY_LABEL[a.intensity]}
                      </span>
                      <span className="text-sm font-bold text-amber-600">{a.enjoyment_rating}/5</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="bg-white rounded-lg p-2 border text-center">
                          <p className="text-xs text-muted-foreground">Initiated By</p>
                          <p className="text-sm font-medium">{PHYSICAL_ACTIVITY_INITIATOR_LABEL[a.initiated_by]}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border text-center">
                          <p className="text-xs text-muted-foreground">Social</p>
                          <p className="text-sm font-medium">{PHYSICAL_ACTIVITY_SOCIAL_ASPECT_LABEL[a.social_aspect]}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border text-center">
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="text-sm font-medium">{a.duration_minutes} mins</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border text-center">
                          <p className="text-xs text-muted-foreground">Enjoyment</p>
                          <p className="text-sm font-medium">{a.enjoyment_rating}/5</p>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                          <Smile className="h-3 w-3 inline mr-1" />Child&apos;s Comment
                        </p>
                        <p className="text-sm italic">&ldquo;{a.child_comment}&rdquo;</p>
                      </div>

                      <div className="bg-emerald-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Staff Observation</p>
                        <p className="text-sm">{a.staff_observation}</p>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">
                          <TrendingUp className="h-3 w-3 inline mr-1" />Contributes To
                        </p>
                        <p className="text-sm">{a.contributes_to_outcome}</p>
                      </div>

                      {a.notes && (
                        <div className="bg-slate-50 rounded-lg p-3 border">
                          <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                          <p className="text-sm">{a.notes}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                        <span><Clock className="h-3 w-3 inline mr-1" />{a.duration_minutes} mins</span>
                        <span>Staff: {a.staff_present.startsWith("staff_") ? getStaffName(a.staff_present) : a.staff_present}</span>
                        <span><Heart className="h-3 w-3 inline mr-1" />{a.enjoyment_rating}/5</span>
                        {a.part_of_weekly_target && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium"><Star className="h-3 w-3 inline mr-0.5" />Counts to weekly target</span>}
                      </div>

                      <SmartLinkPanel sourceType="physical-activity-tracker" sourceId={a.id} childId={a.child_id} compact />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-lg bg-muted/50 border p-4">
            <p className="text-xs text-muted-foreground">
              <strong>Regulatory Context:</strong> Physical activity tracking supports Quality Standard 7 (health
              and wellbeing), CMO physical activity guidelines for children (60 min/day moderate-vigorous), and
              identity-based wellbeing approaches. Linked to Outcomes, Activities, and Healthcare Plans.
            </p>
          </div>
        </>
      )}
    </PageShell>
  );
}
