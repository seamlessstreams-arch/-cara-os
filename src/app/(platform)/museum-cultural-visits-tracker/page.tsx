"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown, ChevronUp, ArrowUpDown, Landmark, Palette,
  Theater, Film, BookOpen, Music, Users, Leaf, Fish,
  Sparkles, Calendar, Camera, Heart, GraduationCap, Loader2,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCulturalVisits } from "@/hooks/use-cultural-visits";
import type { CulturalVisit, CulturalVisitVenueType } from "@/types/extended";
import { CULTURAL_VISIT_VENUE_TYPE_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const venueIcon: Record<CulturalVisitVenueType, typeof Landmark> = {
  museum: Landmark,
  art_gallery: Palette,
  theatre: Theater,
  cinema: Film,
  heritage_site: Landmark,
  library_special_exhibit: BookOpen,
  music_venue: Music,
  stadium_tour: Users,
  botanical_garden: Leaf,
  aquarium_zoo: Fish,
  cultural_festival: Sparkles,
};

const venueColour: Record<CulturalVisitVenueType, string> = {
  museum: "bg-amber-100 text-amber-800",
  art_gallery: "bg-fuchsia-100 text-fuchsia-800",
  theatre: "bg-rose-100 text-rose-800",
  cinema: "bg-indigo-100 text-indigo-800",
  heritage_site: "bg-stone-100 text-stone-800",
  library_special_exhibit: "bg-blue-100 text-blue-800",
  music_venue: "bg-purple-100 text-purple-800",
  stadium_tour: "bg-emerald-100 text-emerald-800",
  botanical_garden: "bg-green-100 text-green-800",
  aquarium_zoo: "bg-cyan-100 text-cyan-800",
  cultural_festival: "bg-orange-100 text-orange-800",
};

export default function MuseumCulturalVisitsTrackerPage() {
  const { data: res, isLoading } = useCulturalVisits();
  const data: CulturalVisit[] = res?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((r) => r.young_people_attended.includes(filterYP));
    if (filterType !== "all") items = items.filter((r) => r.venue_type === filterType);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "duration": return b.duration_hours - a.duration_hours;
        case "cost": return b.cost_total - a.cost_total;
        case "venueType": return a.venue_type.localeCompare(b.venue_type);
        default: return 0;
      }
    });
    return items;
  }, [data, filterYP, filterType, sortBy]);

  const totalVisits = data.length;
  const thisTermStart = d(-90);
  const thisTermVisits = data.filter((r) => r.date >= thisTermStart).length;
  const childrenParticipating = new Set(data.flatMap((r) => r.young_people_attended)).size;
  const differentVenueTypes = new Set(data.map((r) => r.venue_type)).size;

  const exportCols: ExportColumn<CulturalVisit>[] = [
    { header: "Date", accessor: (r) => r.date },
    { header: "Venue", accessor: (r) => r.venue_name },
    { header: "Type", accessor: (r) => CULTURAL_VISIT_VENUE_TYPE_LABEL[r.venue_type] },
    { header: "Young People", accessor: (r) => r.young_people_attended.map((id) => getYPName(id)).join(", ") },
    { header: "Staff Escort", accessor: (r) => r.staff_escort.map((id) => getStaffName(id)).join(", ") },
    { header: "Duration (hrs)", accessor: (r) => r.duration_hours.toString() },
    { header: "Cost", accessor: (r) => `£${r.cost_total}` },
    { header: "Purpose", accessor: (r) => r.purpose_of_visit },
    { header: "Linked Curriculum", accessor: (r) => r.linked_to_curriculum },
    { header: "Linked Care Plan Goal", accessor: (r) => r.linked_to_care_plan_goal },
    { header: "Repeat Interest", accessor: (r) => r.repeat_visit_interest ? "Yes" : "No" },
  ];

  if (isLoading) return <PageShell title="Museum & Cultural Visits Tracker" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Museum & Cultural Visits Tracker"
      subtitle="Per-child museum, gallery, theatre, and cultural educational visits — Quality Standards 6 & 8"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="museum-cultural-visits" />
          <PrintButton title="Museum & Cultural Visits Tracker" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold">{totalVisits}</p><p className="text-xs text-muted-foreground">Total Visits</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-blue-600">{thisTermVisits}</p><p className="text-xs text-muted-foreground">This Term</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{childrenParticipating}</p><p className="text-xs text-muted-foreground">Children Participating</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-fuchsia-600">{differentVenueTypes}</p><p className="text-xs text-muted-foreground">Different Venue Types</p></div>
      </div>

      <div className="rounded-lg bg-fuchsia-50 border border-fuchsia-200 p-3 mb-6 flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-fuchsia-600 mt-0.5 shrink-0" />
        <p className="text-sm text-fuchsia-800">
          Cultural capital is built deliberately. Museums, galleries, theatres and festivals are not extras — they are how each child encounters their heritage, broadens their curiosity, and joins the wider world.
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
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Venue Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Venue Types</SelectItem>
            {(Object.keys(CULTURAL_VISIT_VENUE_TYPE_LABEL) as CulturalVisitVenueType[]).map((k) => (
              <SelectItem key={k} value={k}>{CULTURAL_VISIT_VENUE_TYPE_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">By Date (newest)</SelectItem>
              <SelectItem value="duration">By Duration</SelectItem>
              <SelectItem value="cost">By Cost</SelectItem>
              <SelectItem value="venueType">By Venue Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((v) => {
          const isExpanded = expandedId === v.id;
          const Icon = venueIcon[v.venue_type];
          return (
            <div key={v.id} className="rounded-xl border bg-white overflow-hidden">
              <button className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors" onClick={() => setExpandedId(isExpanded ? null : v.id)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Icon className="h-5 w-5 text-fuchsia-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{v.venue_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{v.date} &middot; {v.young_people_attended.map((id) => getYPName(id)).join(", ")} &middot; {v.duration_hours}h</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", venueColour[v.venue_type])}>{CULTURAL_VISIT_VENUE_TYPE_LABEL[v.venue_type]}</span>
                  {v.repeat_visit_interest && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800">Repeat interest</span>}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-white rounded-lg p-2 border text-center text-sm"><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{v.date}</p></div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm"><p className="text-xs text-muted-foreground">Duration</p><p className="font-medium">{v.duration_hours}h</p></div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm"><p className="text-xs text-muted-foreground">Cost</p><p className="font-medium">£{v.cost_total}</p></div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm"><p className="text-xs text-muted-foreground">Photos</p><p className="font-medium">{v.photographs_taken ? "Yes" : "No"}</p></div>
                  </div>

                  <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Purpose of Visit</p><p className="text-sm">{v.purpose_of_visit}</p></div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1"><GraduationCap className="h-3 w-3 inline mr-1" />Learning Outcomes</p>
                    <ul className="space-y-1">{v.learning_outcomes.map((lo: string, i: number) => <li key={i} className="text-sm flex items-start gap-1"><Sparkles className="h-3 w-3 text-fuchsia-500 mt-1 shrink-0" /><span>{lo}</span></li>)}</ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Each Child&apos;s Interest Area</p>
                    <div className="space-y-1">
                      {v.young_people_attended.map((ypId: string) => (
                        <div key={ypId} className="bg-white rounded-lg p-2 border text-sm">
                          <span className="font-medium">{getYPName(ypId)}: </span>
                          <span>{v.child_interest_area[ypId] || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {v.accessibility_adjustments.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Accessibility Adjustments</p>
                      <ul className="space-y-1">{v.accessibility_adjustments.map((a: string, i: number) => <li key={i} className="text-sm flex items-start gap-1"><span className="text-fuchsia-600 mt-0.5">•</span><span>{a}</span></li>)}</ul>
                    </div>
                  )}

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Children&apos;s Comments</p>
                    <div className="space-y-2">
                      {v.young_people_attended.map((ypId: string) => (
                        <div key={ypId} className="text-sm">
                          <span className="font-medium">{getYPName(ypId)}: </span>
                          <span className="italic">&ldquo;{v.child_comments[ypId] || "—"}&rdquo;</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Staff Observations</p>
                    <p className="text-sm">{v.staff_observations}</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1"><Camera className="h-3 w-3 inline mr-1" />Photo Consent Log</p>
                    <p className="text-sm">{v.photo_consent_log}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1"><BookOpen className="h-3 w-3 inline mr-1" />Linked to Curriculum</p>
                      <p className="text-sm">{v.linked_to_curriculum}</p>
                    </div>
                    <div className="bg-rose-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-rose-800 uppercase tracking-wide mb-1"><Heart className="h-3 w-3 inline mr-1" />Linked to Care Plan Goal</p>
                      <p className="text-sm">{v.linked_to_care_plan_goal}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Calendar className="h-3 w-3 inline mr-1" />{v.date}</span>
                    <span><Users className="h-3 w-3 inline mr-1" />Staff: {v.staff_escort.map((id) => getStaffName(id)).join(", ")}</span>
                    <span>Travel: {v.travel_logged}</span>
                    <span>Repeat interest: {v.repeat_visit_interest ? "Yes" : "No"}</span>
                  </div>

                  <SmartLinkPanel sourceType="museum-cultural-visits-tracker" sourceId={v.id} childId={v.young_people_attended[0]} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Museum and cultural visits evidence Quality Standard 8
          (education — broadening cultural capital, supporting curriculum, enriching learning) and Quality
          Standard 6 (positive relationships — shared experiences, trusted-adult time, household belonging).
          Visits also support UNCRC Article 31 (right to participate in cultural life).
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
