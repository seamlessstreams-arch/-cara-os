"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Home,
  CheckCircle,
  Heart,
  Sparkles,
  MapPin,
  Clock,
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
import type { WelcomeTour } from "@/types/extended";
import { useWelcomeTours } from "@/hooks/use-welcome-tours";

const exportCols: ExportColumn<WelcomeTour>[] = [
  { header: "Child", accessor: (r: WelcomeTour) => r.childInitials },
  { header: "Age", accessor: (r: WelcomeTour) => String(r.ageAtArrival) },
  { header: "Arrival Date", accessor: (r: WelcomeTour) => r.arrivalDate },
  { header: "Tour Leader", accessor: (r: WelcomeTour) => getStaffName(r.tourLeader) },
  { header: "Duration (min)", accessor: (r: WelcomeTour) => String(r.durationMinutes) },
  { header: "Pace Adjusted", accessor: (r: WelcomeTour) => r.toursPaceAdjusted ? "Yes" : "No" },
  { header: "Welcome Pack", accessor: (r: WelcomeTour) => r.childGivenPersonalisedWelcomePack ? "Yes" : "No" },
  { header: "Calm Night 1", accessor: (r: WelcomeTour) => r.childCalmAtNightOne ? "Yes" : "No" },
];

export default function WelcomeTourChecklistPage() {
  const { data: result, isLoading } = useWelcomeTours(undefined, "home_oak");
  const data = result?.data ?? [];

  const [filterPace, setFilterPace] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterPace !== "all") items = items.filter((t) => filterPace === "yes" ? t.toursPaceAdjusted : !t.toursPaceAdjusted);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.arrivalDate.localeCompare(a.arrivalDate);
        case "duration":
          return b.durationMinutes - a.durationMinutes;
        default:
          return 0;
      }
    });
    return items;
  }, [filterPace, sortBy, data]);

  const total = data.length;
  const allCalm = data.every((t) => t.childCalmAtNightOne);
  const paceAdjusted = data.filter((t) => t.toursPaceAdjusted).length;
  const allWelcomed = data.every((t) => t.childGivenPersonalisedWelcomePack);

  return (
    <PageShell
      title="Welcome Tour Checklist"
      subtitle="The first hour matters. Every welcome tour, paced to the child, recorded in detail."
      caraContext={{ pageTitle: "Welcome Tour Checklist", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="welcome-tour-checklist" />
          <PrintButton title="Welcome Tour Checklist" />
          <CaraStudioQuickActionButton context={{ record_type: "placement_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : (<>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Tours Recorded</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allCalm ? "100%" : `${data.filter((t) => t.childCalmAtNightOne).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Calm Night One</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{paceAdjusted}/{total}</p>
          <p className="text-xs text-muted-foreground">Pace Adjusted</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{allWelcomed ? "100%" : `${data.filter((t) => t.childGivenPersonalisedWelcomePack).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Welcome Pack</p>
        </div>
      </div>

      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-pink-600 mt-0.5 shrink-0" />
        <p className="text-sm text-pink-800">
          The welcome tour is the first message a child receives about what life here will be like. Pace,
          warmth, choice, and sensory respect from minute one. Different children need different welcomes —
          the script bends, the values do not.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterPace} onValueChange={setFilterPace}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Tours" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tours</SelectItem>
            <SelectItem value="yes">Pace-Adjusted</SelectItem>
            <SelectItem value="no">Standard Pace</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="duration">Longest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((t) => {
          const isExpanded = expandedId === t.id;
          const stepsShown = t.toursteps.filter((s) => s.shown).length;

          return (
            <div key={t.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : t.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Home className="h-5 w-5 text-pink-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{t.childInitials} (age {t.ageAtArrival}) — arrived {t.arrivalDate}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.durationMinutes} mins &middot; {stepsShown}/{t.toursteps.length} steps &middot; Led by {getStaffName(t.tourLeader)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {t.toursPaceAdjusted && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">Pace-Adjusted</span>
                  )}
                  {t.childCalmAtNightOne && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Arrived From</p>
                    <p className="text-sm">{t.childArrivedFromWhere}</p>
                  </div>

                  {t.toursPaceAdjusted && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Pace Adjustment</p>
                      <p className="text-sm">{t.paceAdjustmentReason}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Pre-Tour Activities</p>
                    <ul className="space-y-1">
                      {t.preTourActivities.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Sparkles className="h-3 w-3 text-pink-500 mt-1 shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <MapPin className="h-3 w-3 inline mr-1" />Tour Steps
                    </p>
                    <div className="space-y-1">
                      {t.toursteps.map((s, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{s.step}</span>
                            {s.shown && <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />}
                          </div>
                          <p className="text-xs italic">&ldquo;{s.childResponse}&rdquo;</p>
                          {s.noteForCarePlan && <p className="text-xs text-muted-foreground mt-1">Note: {s.noteForCarePlan}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {t.meetingChildrenDuringTour.length > 0 && (
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Meeting Other Young People</p>
                      <div className="space-y-1">
                        {t.meetingChildrenDuringTour.map((m, i) => (
                          <div key={i} className="text-sm">
                            <p className="font-medium">{m.residentInitials} — {m.meetingType}</p>
                            <p className="text-xs text-muted-foreground">{m.observations}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="bg-amber-50 rounded-lg p-2 text-sm">
                      <p className="text-xs font-medium text-amber-800">On Arrival</p>
                      <p>{t.emotionalState.onArrival}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 text-sm">
                      <p className="text-xs font-medium text-blue-800">Mid Tour</p>
                      <p>{t.emotionalState.midTour}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 text-sm">
                      <p className="text-xs font-medium text-green-800">Post Tour</p>
                      <p>{t.emotionalState.postTour}</p>
                    </div>
                  </div>

                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">First Activity Chosen</p>
                    <p className="text-sm">{t.childChoseFirstActivity}</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Bedroom First Sighting</p>
                    <p className="text-sm">{t.bedroomFirstSighting}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <div className={cn("rounded-lg p-2 border", t.childToldAboutPledges ? "bg-green-50" : "bg-amber-50")}>
                      {t.childToldAboutPledges ? <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> : <Clock className="h-3 w-3 inline mr-1 text-amber-500" />}
                      Told about pledges
                    </div>
                    <div className={cn("rounded-lg p-2 border", t.childToldAboutAdvocate ? "bg-green-50" : "bg-amber-50")}>
                      {t.childToldAboutAdvocate ? <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> : <Clock className="h-3 w-3 inline mr-1 text-amber-500" />}
                      Told about advocate
                    </div>
                    <div className={cn("rounded-lg p-2 border", t.childToldAboutComplaints ? "bg-green-50" : "bg-amber-50")}>
                      {t.childToldAboutComplaints ? <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> : <Clock className="h-3 w-3 inline mr-1 text-amber-500" />}
                      Told about complaints
                    </div>
                    <div className={cn("rounded-lg p-2 border", t.childToldAboutContact ? "bg-green-50" : "bg-amber-50")}>
                      {t.childToldAboutContact ? <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> : <Clock className="h-3 w-3 inline mr-1 text-amber-500" />}
                      Told about contact
                    </div>
                    <div className={cn("rounded-lg p-2 border", t.childGivenPersonalisedWelcomePack ? "bg-green-50" : "bg-amber-50")}>
                      {t.childGivenPersonalisedWelcomePack ? <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> : <Clock className="h-3 w-3 inline mr-1 text-amber-500" />}
                      Welcome pack
                    </div>
                    <div className={cn("rounded-lg p-2 border", t.childGivenContactNumbers ? "bg-green-50" : "bg-amber-50")}>
                      {t.childGivenContactNumbers ? <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" /> : <Clock className="h-3 w-3 inline mr-1 text-amber-500" />}
                      Contact numbers
                    </div>
                  </div>

                  {t.followUpActions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Follow-Up Actions</p>
                      <ul className="space-y-1">
                        {t.followUpActions.map((a, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Clock className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {t.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Tour Lead Notes</p>
                      <p className="text-sm">{t.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Welcome tour records support Quality Standard 1 (child-centred
          care), Care Planning Regulations 2010, Reg 14 (assessment and admission), and trauma-informed
          practice. Linked to Pre-Admission Checklist, Warm Welcome Packs, Personal Passport, and Bedroom
          Personalisation.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Welcome Tour Checklist — new admission orientation, tour of facilities, introduction to staff, room setup, safety induction, placement plan welcome evidence"
        recordType="placement_plan"
        className="mt-6"
      />
      </>)}
    </PageShell>
  );
}
