"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Sprout,
  Leaf,
  Sun,
  Calendar,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Users,
  Clock,
  Heart,
  Wrench,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GardenPlotRecord, GardenPlanting, GardenPlotLocation, CropStatus } from "@/types/extended";
import { GARDEN_PLOT_LOCATION_LABEL, CROP_STATUS_LABEL } from "@/types/extended";
import { useGardenPlotRecords } from "@/hooks/use-garden-plot-records";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";


const statusColour: Record<CropStatus, string> = {
  growing: "bg-green-100 text-green-800",
  ready: "bg-amber-100 text-amber-800",
  harvested: "bg-blue-100 text-blue-800",
  failed: "bg-rose-100 text-rose-800",
};

const exportCols: ExportColumn<GardenPlotRecord>[] = [
  { header: "Plot", accessor: (r: GardenPlotRecord) => r.plot_name },
  { header: "Location", accessor: (r: GardenPlotRecord) => GARDEN_PLOT_LOCATION_LABEL[r.location] },
  { header: "Size", accessor: (r: GardenPlotRecord) => r.size ?? "" },
  { header: "Lead Child", accessor: (r: GardenPlotRecord) => (r.lead_child ? getYPName(r.lead_child) : "Shared") },
  { header: "Contributing Children", accessor: (r: GardenPlotRecord) => r.contributing_children.map(getYPName).join("; ") },
  { header: "Lead Staff", accessor: (r: GardenPlotRecord) => getStaffName(r.lead_staff) },
  { header: "Current Crops", accessor: (r: GardenPlotRecord) => r.current_planting.map((p) => `${p.crop} (${CROP_STATUS_LABEL[p.status]})`).join("; ") },
  { header: "Hours This Month", accessor: (r: GardenPlotRecord) => r.hours_this_month },
  { header: "Harvest So Far", accessor: (r: GardenPlotRecord) => r.harvest_so_far.join("; ") },
  { header: "Next Step", accessor: (r: GardenPlotRecord) => r.next_step },
  { header: "Reviewed", accessor: (r: GardenPlotRecord) => r.review_date },
];

const monthIndex = new Date().getMonth();
const seasonOf = (m: number) => {
  if (m >= 2 && m <= 4) return "Spring";
  if (m >= 5 && m <= 7) return "Summer";
  if (m >= 8 && m <= 10) return "Autumn";
  return "Winter";
};
const currentSeason = seasonOf(monthIndex);

export default function GardenCultivationTrackerPage() {
  const { data: res, isLoading } = useGardenPlotRecords();
  const records = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterLocation, setFilterLocation] = useState("all");
  const [sortBy, setSortBy] = useState("hours");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterLocation !== "all") items = items.filter((r) => r.location === filterLocation);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((r) =>
        r.plot_name.toLowerCase().includes(q) ||
        r.current_planting.some((p) => p.crop.toLowerCase().includes(q)) ||
        r.child_chosen_crops.some((c) => c.toLowerCase().includes(q)) ||
        r.skills_learned.some((s) => s.toLowerCase().includes(q)) ||
        (r.lead_child ? getYPName(r.lead_child).toLowerCase().includes(q) : false)
      );
    }
    items.sort((a, b) => {
      switch (sortBy) {
        case "hours":
          return b.hours_this_month - a.hours_this_month;
        case "crops":
          return b.current_planting.length - a.current_planting.length;
        case "review":
          return a.review_date.localeCompare(b.review_date);
        case "name":
          return a.plot_name.localeCompare(b.plot_name);
        default:
          return 0;
      }
    });
    return items;
  }, [records, search, filterLocation, sortBy]);

  const activePlots = records.length;
  const hoursThisMonth = records.reduce((sum, r) => sum + r.hours_this_month, 0);
  const cropsGrowing = records.reduce(
    (sum, r) => sum + r.current_planting.filter((p) => p.status === "growing" || p.status === "ready").length,
    0
  );
  const childrenInvolved = new Set(records.flatMap((r) => r.contributing_children)).size;

  if (isLoading) {
    return (
      <PageShell title="Garden Cultivation Tracker" subtitle="Therapeutic gardening with our children — plots, plants, harvest, sensory work and seasonal planning">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Garden Cultivation Tracker"
      subtitle="Therapeutic gardening with our children — plots, plants, harvest, sensory work and seasonal planning"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="garden-cultivation" />
          <PrintButton title="Garden Cultivation Tracker" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{activePlots}</p>
          <p className="text-xs text-muted-foreground">Active Plots</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-lime-700">{hoursThisMonth}</p>
          <p className="text-xs text-muted-foreground">Hours This Month</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{cropsGrowing}</p>
          <p className="text-xs text-muted-foreground">Crops Growing / Ready</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{childrenInvolved}</p>
          <p className="text-xs text-muted-foreground">Children Involved</p>
        </div>
      </div>

      <div className="rounded-lg bg-lime-50 border border-lime-200 p-3 mb-6 flex items-start gap-2">
        <Sprout className="h-4 w-4 text-lime-700 mt-0.5 shrink-0" />
        <p className="text-sm text-lime-900">
          Gardening is therapy. Forest-school principles, eco-therapy and sensory horticulture are woven through
          each plot. Each child&apos;s relationship with the soil is theirs — we follow interest, not impose
          a shared template.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search plots, crops, skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 h-9 rounded-md border bg-white text-sm w-[260px] focus:outline-none focus:ring-2 focus:ring-lime-400"
          />
        </div>
        <Select value={filterLocation} onValueChange={setFilterLocation}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Locations" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="back_garden">{GARDEN_PLOT_LOCATION_LABEL.back_garden}</SelectItem>
            <SelectItem value="side_bed">{GARDEN_PLOT_LOCATION_LABEL.side_bed}</SelectItem>
            <SelectItem value="vegetable_patch">{GARDEN_PLOT_LOCATION_LABEL.vegetable_patch}</SelectItem>
            <SelectItem value="greenhouse">{GARDEN_PLOT_LOCATION_LABEL.greenhouse}</SelectItem>
            <SelectItem value="allotment_plot">{GARDEN_PLOT_LOCATION_LABEL.allotment_plot}</SelectItem>
            <SelectItem value="pots_containers">{GARDEN_PLOT_LOCATION_LABEL.pots_containers}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hours">By Hours This Month</SelectItem>
              <SelectItem value="crops">By Crop Count</SelectItem>
              <SelectItem value="review">By Review Date</SelectItem>
              <SelectItem value="name">By Plot Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((p) => {
          const isExpanded = expandedId === p.id;

          return (
            <div key={p.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-lime-50/50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Sprout className="h-5 w-5 text-green-700 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.plot_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.size ? `${p.size} · ` : ""}Lead staff: {getStaffName(p.lead_staff)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3 flex-wrap justify-end">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800">
                    <Leaf className="h-3 w-3 inline mr-1" />{GARDEN_PLOT_LOCATION_LABEL[p.location]}
                  </span>
                  {p.lead_child && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-pink-100 text-pink-800">
                      Lead: {getYPName(p.lead_child)}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-lime-100 text-lime-800">
                    <Clock className="h-3 w-3 inline mr-1" />{p.hours_this_month}h
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">
                    <Sun className="h-3 w-3 inline mr-1" />{currentSeason}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-lime-50/40 space-y-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child Voice</p>
                    <p className="text-sm italic">&ldquo;{p.child_voice}&rdquo;</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Staff Observation</p>
                    <p className="text-sm">{p.staff_observation}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Sprout className="h-3 w-3 inline mr-1" />Current Planting
                    </p>
                    <div className="space-y-2">
                      {p.current_planting.map((c, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 border flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{c.crop}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              <Calendar className="h-3 w-3 inline mr-1" />Planted {c.planted} · Expected harvest {c.expected_harvest}
                            </p>
                          </div>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", statusColour[c.status])}>
                            {CROP_STATUS_LABEL[c.status]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Calendar className="h-3 w-3 inline mr-1" />Seasonal Plan
                    </p>
                    <ul className="space-y-1">
                      {p.seasonal_plan.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Sun className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {p.child_chosen_crops.length > 0 && (
                    <div className="bg-pink-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">Child-Chosen Crops</p>
                      <ul className="space-y-1">
                        {p.child_chosen_crops.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Heart className="h-3 w-3 text-pink-500 mt-1 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {p.harvest_so_far.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Harvest So Far</p>
                      <ul className="space-y-1">
                        {p.harvest_so_far.map((h, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Leaf className="h-3 w-3 text-amber-600 mt-1 shrink-0" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Sensory Benefits</p>
                    <ul className="space-y-1">
                      {p.sensory_benefits.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-purple-500 mt-0.5">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-sky-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-sky-800 uppercase tracking-wide mb-1">Skills Learned</p>
                    <ul className="space-y-1">
                      {p.skills_learned.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-sky-600 mt-0.5">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {p.challenges_issues.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Challenges / Issues</p>
                      <ul className="space-y-1">
                        {p.challenges_issues.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-rose-600 mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">Next Step</p>
                    <p className="text-sm">{p.next_step}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>
                      <Users className="h-3 w-3 inline mr-1" />
                      Contributors: {p.contributing_children.map(getYPName).join(", ")}
                    </span>
                    <span>
                      <Wrench className="h-3 w-3 inline mr-1" />
                      Tools: {p.tools_accessible.join(", ")}
                    </span>
                    <span>Reviewed {p.review_date}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Therapeutic gardening evidences Quality Standard 6 (enjoyment
          and achievement) and supports Quality Standard 7 (health and wellbeing). Practice draws on
          forest-school principles, eco-therapy evidence (nature contact and trauma recovery), and
          sensory-horticulture approaches for children with developmental trauma. UNCRC Article 31 (rest,
          play and leisure) underpins the right to unhurried, child-led outdoor time. Linked to Activities,
          Sensory Profiles, Cultural Identity and Outcomes pages.
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
