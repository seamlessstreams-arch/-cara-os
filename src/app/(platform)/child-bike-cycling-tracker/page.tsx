"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Bike,
  ShieldCheck,
  Award,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  MapPin,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CyclingBikeRecord,
  BikeabilityLevel,
  HelmetCondition,
  BikeMaintenanceCompetence,
} from "@/types/extended";
import {
  BIKEABILITY_LEVEL_LABEL,
  HELMET_CONDITION_LABEL,
  BIKE_MAINTENANCE_COMPETENCE_LABEL,
} from "@/types/extended";
import { useCyclingBikeRecords } from "@/hooks/use-cycling-bike-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const levelOrder: Record<BikeabilityLevel, number> = {
  not_started: 0,
  level_1_off_road: 1,
  level_2_on_road_basic: 2,
  level_3_on_road_advanced: 3,
  beyond_independent_rider: 4,
};

const levelColour: Record<BikeabilityLevel, string> = {
  not_started: "bg-slate-100 text-slate-700",
  level_1_off_road: "bg-sky-100 text-sky-800",
  level_2_on_road_basic: "bg-teal-100 text-teal-800",
  level_3_on_road_advanced: "bg-emerald-100 text-emerald-800",
  beyond_independent_rider: "bg-indigo-100 text-indigo-800",
};

const maintenanceColour: Record<BikeMaintenanceCompetence, string> = {
  adult_led: "bg-amber-100 text-amber-800",
  with_prompts: "bg-yellow-100 text-yellow-800",
  independent_basics: "bg-teal-100 text-teal-800",
  confident: "bg-emerald-100 text-emerald-800",
};

const exportCols: ExportColumn<CyclingBikeRecord>[] = [
  { header: "Young Person", accessor: (r: CyclingBikeRecord) => getYPName(r.child_id) },
  { header: "Recorded", accessor: (r: CyclingBikeRecord) => r.recorded_date },
  { header: "Bike Owned", accessor: (r: CyclingBikeRecord) => (r.bike_owned ? "Yes" : "No") },
  { header: "Bike", accessor: (r: CyclingBikeRecord) => (r.bike_details ? `${r.bike_details.make} ${r.bike_details.model} (${r.bike_details.size})` : "—") },
  { header: "Helmet", accessor: (r: CyclingBikeRecord) => (r.helmet_owned ? (r.helmet_condition ? HELMET_CONDITION_LABEL[r.helmet_condition] : "Owned") : "No") },
  { header: "Lights", accessor: (r: CyclingBikeRecord) => (r.lights_fitted ? "Yes" : "No") },
  { header: "Lock", accessor: (r: CyclingBikeRecord) => r.lock_type || "—" },
  { header: "Bikeability", accessor: (r: CyclingBikeRecord) => BIKEABILITY_LEVEL_LABEL[r.bikeability_level] },
  { header: "Cert Date", accessor: (r: CyclingBikeRecord) => r.bikeability_certificate_date || "—" },
  { header: "Helmet Worn Consistently", accessor: (r: CyclingBikeRecord) => (r.child_wears_helmet_consistently ? "Yes" : "No") },
  { header: "Maintenance", accessor: (r: CyclingBikeRecord) => BIKE_MAINTENANCE_COMPETENCE_LABEL[r.maintenance_competence] },
  { header: "Routes (count)", accessor: (r: CyclingBikeRecord) => r.routes_ridden_independently.length },
  { header: "Review Due", accessor: (r: CyclingBikeRecord) => r.review_date },
  { header: "Key Worker", accessor: (r: CyclingBikeRecord) => getStaffName(r.key_worker) },
];

export default function ChildBikeCyclingTrackerPage() {
  const { data: res, isLoading } = useCyclingBikeRecords();
  const data = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [sortBy, setSortBy] = useState("level");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (r) =>
          getYPName(r.child_id).toLowerCase().includes(q) ||
          BIKEABILITY_LEVEL_LABEL[r.bikeability_level].toLowerCase().includes(q) ||
          (r.bike_details?.make.toLowerCase().includes(q) ?? false) ||
          (r.bike_details?.model.toLowerCase().includes(q) ?? false) ||
          r.routes_ridden_independently.some((rt) => rt.toLowerCase().includes(q)),
      );
    }
    if (filterLevel !== "all") items = items.filter((r) => r.bikeability_level === filterLevel);
    items.sort((a, b) => {
      switch (sortBy) {
        case "level":
          return levelOrder[b.bikeability_level] - levelOrder[a.bikeability_level];
        case "review":
          return a.review_date.localeCompare(b.review_date);
        case "name":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default:
          return 0;
      }
    });
    return items;
  }, [data, search, filterLevel, sortBy]);

  const today = new Date();
  const in90 = new Date();
  in90.setDate(in90.getDate() + 90);

  const childrenWithBikes = data.filter((r) => r.bike_owned).length;
  const bikeabilityCompleted = data.filter(
    (r) => r.bikeability_level !== "not_started" && r.bikeability_level !== "level_1_off_road",
  ).length;
  const helmetAlwaysWorn = data.filter((r) => r.child_wears_helmet_consistently).length;
  const reviewsDue90 = data.filter((r) => {
    const dt = new Date(r.review_date);
    return dt >= today && dt <= in90;
  }).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <PageShell
      title="Cycling & Bike Safety"
      subtitle="Per-child cycling capability, bike ownership, helmet and safety equipment, Bikeability progression, route competence, and theft prevention"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="cycling-bike-safety" />
          <PrintButton title="Cycling & Bike Safety" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-sky-600">{childrenWithBikes}</p>
          <p className="text-xs text-muted-foreground">Children With Bikes</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">{bikeabilityCompleted}</p>
          <p className="text-xs text-muted-foreground">Bikeability Completed (L2+)</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{helmetAlwaysWorn}</p>
          <p className="text-xs text-muted-foreground">Helmet Always Worn</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{reviewsDue90}</p>
          <p className="text-xs text-muted-foreground">Reviews Due (90d)</p>
        </div>
      </div>

      <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 mb-6 flex items-start gap-2">
        <Bike className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
        <p className="text-sm text-sky-800">
          Cycling is freedom, fitness, and independence. Each child&apos;s journey is paced to their confidence —
          from off-road first wobbles to confident on-road riding. Helmet, lights, lock, and skills are non-negotiable
          before independent road riding.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by child, bike, route, or level..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-md border bg-white text-sm"
          />
        </div>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All Bikeability Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bikeability Levels</SelectItem>
            <SelectItem value="not_started">{BIKEABILITY_LEVEL_LABEL.not_started}</SelectItem>
            <SelectItem value="level_1_off_road">{BIKEABILITY_LEVEL_LABEL.level_1_off_road}</SelectItem>
            <SelectItem value="level_2_on_road_basic">{BIKEABILITY_LEVEL_LABEL.level_2_on_road_basic}</SelectItem>
            <SelectItem value="level_3_on_road_advanced">{BIKEABILITY_LEVEL_LABEL.level_3_on_road_advanced}</SelectItem>
            <SelectItem value="beyond_independent_rider">{BIKEABILITY_LEVEL_LABEL.beyond_independent_rider}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="level">By Level (high to low)</SelectItem>
              <SelectItem value="review">By Review Date</SelectItem>
              <SelectItem value="name">By Child Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((c) => {
          const isExpanded = expandedId === c.id;
          return (
            <div key={c.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Bike className="h-5 w-5 text-sky-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {getYPName(c.child_id)}
                      {c.bike_details && (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          &middot; {c.bike_details.make} {c.bike_details.model}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Recorded {c.recorded_date} &middot; Key worker {getStaffName(c.key_worker)} &middot; Review due {c.review_date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3 flex-wrap justify-end">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", levelColour[c.bikeability_level])}>
                    {BIKEABILITY_LEVEL_LABEL[c.bikeability_level]}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      c.bike_owned ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-700",
                    )}
                  >
                    {c.bike_owned ? "Owns bike" : "No bike"}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      c.child_wears_helmet_consistently ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800",
                    )}
                  >
                    Helmet {c.child_wears_helmet_consistently ? "consistent" : "inconsistent"}
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", maintenanceColour[c.maintenance_competence])}>
                    {BIKE_MAINTENANCE_COMPETENCE_LABEL[c.maintenance_competence]}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {c.bike_details ? (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        <Bike className="h-3 w-3 inline mr-1" />
                        Bike Details
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="bg-white rounded-lg p-2 border text-sm">
                          <p className="text-xs text-muted-foreground">Make / Model</p>
                          <p className="font-medium">
                            {c.bike_details.make} {c.bike_details.model}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border text-sm">
                          <p className="text-xs text-muted-foreground">Frame</p>
                          <p className="font-medium">{c.bike_details.size}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border text-sm">
                          <p className="text-xs text-muted-foreground">Colour</p>
                          <p className="font-medium">{c.bike_details.colour}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border text-sm">
                          <p className="text-xs text-muted-foreground">Serial</p>
                          <p className="font-medium">{c.bike_details.serial_number || "Not recorded"}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-3 border text-sm">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Bike Ownership
                      </p>
                      <p>No bike currently owned. Engagement is via after-school club / school programmes.</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <ShieldCheck className="h-3 w-3 inline mr-1" />
                      Safety Equipment
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-white rounded-lg p-2 border text-sm">
                        <p className="text-xs text-muted-foreground">Helmet</p>
                        <p className="font-medium">
                          {c.helmet_owned ? (c.helmet_condition ? HELMET_CONDITION_LABEL[c.helmet_condition] : "Owned") : "Not owned"}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border text-sm">
                        <p className="text-xs text-muted-foreground">Lights Fitted</p>
                        <p className={cn("font-medium", c.lights_fitted ? "text-emerald-700" : "text-amber-700")}>
                          {c.lights_fitted ? "Yes" : "No / needs fitting"}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border text-sm">
                        <p className="text-xs text-muted-foreground">Reflective Gear</p>
                        <p className={cn("font-medium", c.reflective_gear_owned ? "text-emerald-700" : "text-amber-700")}>
                          {c.reflective_gear_owned ? "Yes" : "No"}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border text-sm">
                        <p className="text-xs text-muted-foreground">Helmet Worn Consistently</p>
                        <p className={cn("font-medium", c.child_wears_helmet_consistently ? "text-emerald-700" : "text-amber-700")}>
                          {c.child_wears_helmet_consistently ? "Yes" : "Working on it"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="bg-white rounded-lg p-3 border text-sm">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Lock</p>
                      <p>{c.lock_type || "Not applicable"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border text-sm">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Storage</p>
                      <p>{c.bike_storage_location}</p>
                    </div>
                  </div>

                  <div className="bg-teal-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide mb-1">
                      <Award className="h-3 w-3 inline mr-1" />
                      Bikeability
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">{BIKEABILITY_LEVEL_LABEL[c.bikeability_level]}</span>
                      {c.bikeability_certificate_date && (
                        <span className="text-muted-foreground"> &middot; Certificate dated {c.bikeability_certificate_date}</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      Routes Ridden Independently
                    </p>
                    {c.routes_ridden_independently.length > 0 ? (
                      <ul className="space-y-1">
                        {c.routes_ridden_independently.map((rt, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <MapPin className="h-3 w-3 text-sky-500 mt-1 shrink-0" />
                            <span>{rt}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">None yet — building confidence.</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Route risk assessment:{" "}
                      <span className={cn("font-medium", c.route_risk_assessment_done ? "text-emerald-700" : "text-amber-700")}>
                        {c.route_risk_assessment_done ? "Completed" : "Pending"}
                      </span>
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Maintenance Competence
                    </p>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", maintenanceColour[c.maintenance_competence])}>
                      {BIKE_MAINTENANCE_COMPETENCE_LABEL[c.maintenance_competence]}
                    </span>
                  </div>

                  {c.theft_risk_screening.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <ShieldCheck className="h-3 w-3 inline mr-1" />
                        Theft Risk Screening
                      </p>
                      <ul className="space-y-1">
                        {c.theft_risk_screening.map((t, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <ShieldCheck className="h-3 w-3 text-teal-600 mt-1 shrink-0" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-sky-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-sky-800 uppercase tracking-wide mb-1">Child&apos;s Voice</p>
                    <p className="text-sm italic">&ldquo;{c.child_voice}&rdquo;</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Staff Observation</p>
                    <p className="text-sm">{c.staff_observation}</p>
                  </div>

                  <SmartLinkPanel sourceType="cycling-bike-record" sourceId={c.id} childId={c.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Cycling provision aligns with the National Standards for Cycle
          Training (Bikeability Trust), RoSPA cycle safety guidance, and Highway Code rules 59-82 (rules for
          cyclists). Supports Children&apos;s Homes Regulations Quality Standard 6 (Enjoyment &amp; Achievement)
          and UNCRC Article 31 (right to rest, play, and leisure). Linked to Activities, After-School Clubs,
          Risk Assessments, and Health pages.
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
