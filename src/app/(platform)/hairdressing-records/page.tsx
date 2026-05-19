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
  Scissors,
  Heart,
  Star,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HairAppointment, SalonType } from "@/types/extended";
import { SALON_TYPE_LABEL } from "@/types/extended";
import { useHairAppointments } from "@/hooks/use-hair-appointments";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const salonColour: Record<SalonType, string> = {
  high_street_barber: "bg-blue-100 text-blue-800",
  specialist_black_hair: "bg-amber-100 text-amber-800",
  mobile_home: "bg-emerald-100 text-emerald-800",
  salon: "bg-pink-100 text-pink-800",
  specialist_sensory: "bg-purple-100 text-purple-800",
};

const exportCols: ExportColumn<HairAppointment>[] = [
  { header: "Young Person", accessor: (r: HairAppointment) => getYPName(r.child_id) },
  { header: "Date", accessor: (r: HairAppointment) => r.date },
  { header: "Salon/Barber", accessor: (r: HairAppointment) => r.salon_or_barber },
  { header: "Type", accessor: (r: HairAppointment) => SALON_TYPE_LABEL[r.salon_type] },
  { header: "Style", accessor: (r: HairAppointment) => r.style_achieved },
  { header: "Cost £", accessor: (r: HairAppointment) => `£${r.cost}` },
  { header: "Satisfaction", accessor: (r: HairAppointment) => `${r.child_satisfaction}/5` },
  { header: "Adjustments", accessor: (r: HairAppointment) => r.reasonable_adjustments.length > 0 ? "Yes" : "Standard" },
];

export default function HairdressingRecordsPage() {
  const { data: res, isLoading } = useHairAppointments();
  const data = res?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((a) => a.child_id === filterYP);
    if (filterType !== "all") items = items.filter((a) => a.salon_type === filterType);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "satisfaction":
          return b.child_satisfaction - a.child_satisfaction;
        default:
          return 0;
      }
    });
    return items;
  }, [data, filterYP, filterType, sortBy]);

  if (isLoading) return <PageShell title="Hairdressing Records" subtitle="Hair appointments per child — choice, dignity, cultural and sensory awareness"><div className="p-8 text-center text-muted-foreground">Loading hairdressing records…</div></PageShell>;

  const total = data.length;
  const culturalMatched = data.filter((a) => a.salon_type === "specialist_black_hair").length;
  const sensoryAdjusted = data.filter((a) => a.reasonable_adjustments.length > 0).length;
  const allChildChose = data.every((a) => a.child_chose);

  return (
    <PageShell
      title="Hairdressing Records"
      subtitle="Hair appointments per child — choice, dignity, cultural and sensory awareness"
      ariaContext={{ pageTitle: "Hairdressing Records", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="hairdressing-records" />
          <PrintButton title="Hairdressing Records" />
          <AriaStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Recent Appointments</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{culturalMatched}</p>
          <p className="text-xs text-muted-foreground">Cultural Specialist</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{sensoryAdjusted}</p>
          <p className="text-xs text-muted-foreground">Sensory Adjustments</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allChildChose ? "100%" : `${data.filter((a) => a.child_chose).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Child-Chosen Style</p>
        </div>
      </div>

      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3 mb-6 flex items-start gap-2">
        <Scissors className="h-4 w-4 text-pink-600 mt-0.5 shrink-0" />
        <p className="text-sm text-pink-800">
          Hair is identity. Children choose their own style. Cultural matching matters — Jordan goes to a
          Black-led barbershop. Sensory needs matter — Casey&apos;s mobile hairdresser visits home with
          adaptations. Every appointment is an act of dignity.
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
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Salon Types</SelectItem>
            {(Object.keys(salonColour) as SalonType[]).map((k) => (
              <SelectItem key={k} value={k}>{SALON_TYPE_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="satisfaction">By Satisfaction</SelectItem>
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
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : a.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Scissors className="h-5 w-5 text-pink-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(a.child_id)} — {a.salon_or_barber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.date} &middot; {a.style_achieved} &middot; £{a.cost}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", salonColour[a.salon_type])}>{SALON_TYPE_LABEL[a.salon_type]}</span>
                  <span className="text-sm font-bold text-amber-600">{a.child_satisfaction}/5</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-3 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Style Requested</p>
                      <p>{a.style_requested}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Style Achieved</p>
                      <p>{a.style_achieved}</p>
                    </div>
                  </div>

                  {a.reasonable_adjustments.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Reasonable Adjustments</p>
                      <ul className="space-y-1">
                        {a.reasonable_adjustments.map((adj, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Sparkles className="h-3 w-3 text-purple-500 mt-1 shrink-0" />
                            <span>{adj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Cultural Relevance</p>
                    <p>{a.cultural_relevance}</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Staff Observation</p>
                    <p>{a.staff_observation}</p>
                    <p className="text-xs text-muted-foreground mt-1">Anxiety level: {a.anxiety_level_observed}</p>
                  </div>

                  {a.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Notes</p>
                      <p>{a.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Heart className="h-3 w-3 inline mr-1" />Satisfaction: {a.child_satisfaction}/5</span>
                    <span>£{a.cost} &middot; {a.duration_minutes} mins</span>
                    <span>Escort: {getStaffName(a.staff_escort)}</span>
                    <span>Next: {a.next_appointment_due}</span>
                    {a.child_chose && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium"><Star className="h-3 w-3 inline mr-1" />Child Chose</span>}
                  </div>

                  <SmartLinkPanel sourceType="hairdressing-records" sourceId={a.id} childId={a.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Hairdressing records support Quality Standard 1 (child-centred
          care), Quality Standard 2 (children&apos;s wishes and feelings), and Equality Act 2010 reasonable
          adjustments. Cultural and sensory matching is core, not optional. Linked to Cultural Identity,
          Sensory Profiles, and Personal Belongings.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Hairdressing Records — haircuts, appointments, child preferences, salon visits, cultural hair care, costs, looked-after child entitlement, wellbeing"
        recordType="direct_work"
        className="mt-6"
      />
    </PageShell>
  );
}
