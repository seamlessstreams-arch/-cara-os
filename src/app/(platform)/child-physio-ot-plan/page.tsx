"use client";

import { useState, useMemo } from "react";
import {
  Activity,
  Users,
  Heart,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  CheckCircle,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type {
  PhysioOtPlan,
  PhysioOtTherapyType,
  PhysioOtGoalStatus,
} from "@/types/extended";
import {
  PHYSIO_OT_THERAPY_TYPE_LABEL,
  PHYSIO_OT_GOAL_STATUS_LABEL,
} from "@/types/extended";
import { usePhysioOtPlans } from "@/hooks/use-physio-ot-plans";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── colour maps ──────────────────────────────────────────────────────── */

const THERAPY_TYPE_COLOURS: Record<PhysioOtTherapyType, string> = {
  physiotherapy: "bg-sky-100 text-sky-800",
  occupational_therapy: "bg-teal-100 text-teal-800",
  both: "bg-indigo-100 text-indigo-800",
  hand_therapy: "bg-amber-100 text-amber-800",
  sensory_integration_ot: "bg-purple-100 text-purple-800",
  hydrotherapy: "bg-cyan-100 text-cyan-800",
  awaiting_referral: "bg-gray-100 text-gray-700",
};

const GOAL_STATUS_COLOURS: Record<PhysioOtGoalStatus, string> = {
  achieved: "bg-green-100 text-green-800 border-green-200",
  on_track: "bg-sky-100 text-sky-800 border-sky-200",
  slow_progress: "bg-amber-100 text-amber-800 border-amber-200",
  not_started: "bg-gray-100 text-gray-700 border-gray-200",
};

/* ── flat row for export ───────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string;
  therapyType: string;
  therapistName: string;
  therapistService: string;
  reasonForReferral: string;
  startDate: string;
  reviewFrequency: string;
  goals: string;
  exercisesPrograms: string;
  equipment: string;
  schoolPlanInPlace: string;
  homeEnvironmentAdaptations: string;
  childMotivation: string;
  staffSupportNeeded: string;
  childVoice: string;
  staffObservation: string;
  nextAppointment: string;
  reviewDate: string;
  keyWorker: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Young Person",          accessor: (r: FlatRow) => r.youngPerson },
  { header: "Therapy Type",          accessor: (r: FlatRow) => r.therapyType },
  { header: "Therapist",             accessor: (r: FlatRow) => r.therapistName },
  { header: "Therapist Service",     accessor: (r: FlatRow) => r.therapistService },
  { header: "Reason for Referral",   accessor: (r: FlatRow) => r.reasonForReferral },
  { header: "Start Date",            accessor: (r: FlatRow) => r.startDate },
  { header: "Review Frequency",      accessor: (r: FlatRow) => r.reviewFrequency },
  { header: "Goals",                 accessor: (r: FlatRow) => r.goals },
  { header: "Exercises / Programs",  accessor: (r: FlatRow) => r.exercisesPrograms },
  { header: "Equipment",             accessor: (r: FlatRow) => r.equipment },
  { header: "School Plan in Place",  accessor: (r: FlatRow) => r.schoolPlanInPlace },
  { header: "Home Adaptations",      accessor: (r: FlatRow) => r.homeEnvironmentAdaptations },
  { header: "Child Motivation",      accessor: (r: FlatRow) => r.childMotivation },
  { header: "Staff Support Needed",  accessor: (r: FlatRow) => r.staffSupportNeeded },
  { header: "Child Voice",           accessor: (r: FlatRow) => r.childVoice },
  { header: "Staff Observation",     accessor: (r: FlatRow) => r.staffObservation },
  { header: "Next Appointment",      accessor: (r: FlatRow) => r.nextAppointment },
  { header: "Review Date",           accessor: (r: FlatRow) => r.reviewDate },
  { header: "Key Worker",            accessor: (r: FlatRow) => r.keyWorker },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function ChildPhysioOtPlanPage() {
  const { data: raw, isLoading } = usePhysioOtPlans();
  const items = raw?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("review_asc");

  const toggle = (id: string) =>
    setExpandedId((cur) => (cur === id ? null : id));

  /* ── stats ───────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const ninetyOut = new Date();
    ninetyOut.setDate(ninetyOut.getDate() + 90);
    const ninety = ninetyOut.toISOString().slice(0, 10);

    const activePlans = items.filter(
      (r) => r.therapy_type !== "awaiting_referral"
    ).length;

    const goalsOnTrack = items.reduce(
      (n, r) =>
        n +
        r.goals.filter(
          (g) => g.status === "on_track" || g.status === "achieved"
        ).length,
      0
    );

    const equipmentSupplied = items.reduce(
      (n, r) => n + r.equipment.length,
      0
    );

    const reviewsDue = items.filter(
      (r) => r.review_date >= today && r.review_date <= ninety
    ).length;

    return { activePlans, goalsOnTrack, equipmentSupplied, reviewsDue };
  }, [items]);

  /* ── filter + sort ───────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = items;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.child_id).toLowerCase().includes(q) ||
          (r.therapist_name ?? "").toLowerCase().includes(q) ||
          r.therapist_service.toLowerCase().includes(q) ||
          r.reason_for_referral.toLowerCase().includes(q) ||
          r.goals.some((g) => g.goal.toLowerCase().includes(q))
      );
    }
    if (filterType !== "all") list = list.filter((r) => r.therapy_type === filterType);

    const out = [...list];
    switch (sortBy) {
      case "review_asc":
        out.sort((a, b) => a.review_date.localeCompare(b.review_date));
        break;
      case "review_desc":
        out.sort((a, b) => b.review_date.localeCompare(a.review_date));
        break;
      case "child":
        out.sort((a, b) =>
          getYPName(a.child_id).localeCompare(getYPName(b.child_id))
        );
        break;
      case "type":
        out.sort((a, b) => a.therapy_type.localeCompare(b.therapy_type));
        break;
    }
    return out;
  }, [items, search, filterType, sortBy]);

  /* ── export rows ─────────────────────────────────────────────────── */
  const exportData = useMemo<FlatRow[]>(
    () =>
      items.map((r) => ({
        youngPerson: getYPName(r.child_id),
        therapyType: PHYSIO_OT_THERAPY_TYPE_LABEL[r.therapy_type],
        therapistName: r.therapist_name ?? "",
        therapistService: r.therapist_service,
        reasonForReferral: r.reason_for_referral,
        startDate: r.start_date ?? "",
        reviewFrequency: r.review_frequency ?? "",
        goals: r.goals
          .map(
            (g) =>
              `${g.goal} [${PHYSIO_OT_GOAL_STATUS_LABEL[g.status]}${g.target_date ? `, target ${g.target_date}` : ""}]`
          )
          .join(" | "),
        exercisesPrograms: r.exercises_programs
          .map(
            (e) => `${e.name} (Freq: ${e.frequency}; Support: ${e.who_supports})`
          )
          .join(" | "),
        equipment: r.equipment.join("; "),
        schoolPlanInPlace: r.school_plan_in_place ? "Yes" : "No",
        homeEnvironmentAdaptations: r.home_environment_adaptations.join("; "),
        childMotivation: r.child_motivation,
        staffSupportNeeded: r.staff_support_needed.join("; "),
        childVoice: r.child_voice,
        staffObservation: r.staff_observation,
        nextAppointment: r.next_appointment ?? "",
        reviewDate: r.review_date,
        keyWorker: getStaffName(r.key_worker),
      })),
    [items]
  );

  /* ── loading state ───────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <PageShell
        title="Physio & OT Plans"
        subtitle="Per-child physiotherapy and occupational therapy plans — physical, sensory, motor and self-care needs (QS 8)"
      >
        <p className="text-sm text-gray-500">Loading…</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Physio & OT Plans"
      subtitle="Per-child physiotherapy and occupational therapy plans — physical, sensory, motor and self-care needs (QS 8)"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Physio & OT Plans" />
          <ExportButton
            data={exportData}
            columns={EXPORT_COLS}
            filename="child-physio-ot-plans"
          />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active plans", value: stats.activePlans, icon: Activity, colour: "text-sky-600" },
          { label: "Goals on track / achieved", value: stats.goalsOnTrack, icon: CheckCircle, colour: "text-teal-600" },
          { label: "Equipment supplied", value: stats.equipmentSupplied, icon: Heart, colour: "text-rose-500" },
          { label: "Reviews due (90d)", value: stats.reviewsDue, icon: Users, colour: stats.reviewsDue > 0 ? "text-amber-600" : "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── filters / sort ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search child, therapist, service or goal…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[210px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All therapy types</SelectItem>
            {Object.entries(PHYSIO_OT_THERAPY_TYPE_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="review_asc">Soonest review</SelectItem>
              <SelectItem value="review_desc">Latest review</SelectItem>
              <SelectItem value="child">Child name</SelectItem>
              <SelectItem value="type">Therapy type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── plans ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.length === 0 && (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
            No therapy plans match the current filters.
          </div>
        )}

        {filtered.map((r) => {
          const open = expandedId === r.id;
          const goalsOnTrackCount = r.goals.filter(
            (g) => g.status === "on_track" || g.status === "achieved"
          ).length;

          return (
            <div key={r.id} className="rounded-lg border bg-white">
              <button
                onClick={() => toggle(r.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-sky-50/40"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Activity className="h-4 w-4 text-sky-500" />
                    <h3 className="font-semibold">{getYPName(r.child_id)}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", THERAPY_TYPE_COLOURS[r.therapy_type])}>
                      {PHYSIO_OT_THERAPY_TYPE_LABEL[r.therapy_type]}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                      {r.therapist_service}
                    </span>
                    {r.school_plan_in_place && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <CheckCircle className="h-3 w-3" /> School plan
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                      {goalsOnTrackCount}/{r.goals.length} goals on track
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {r.therapist_name ? `${r.therapist_name} · ` : ""}
                    Key worker {getStaffName(r.key_worker)} · Next review {r.review_date}
                    {r.next_appointment ? ` · Next appt ${r.next_appointment}` : ""}
                  </p>
                </div>
                {open
                  ? <ChevronUp className="h-5 w-5 text-gray-400" />
                  : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* meta row */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Start date:</span> <span className="font-medium">{r.start_date ?? "—"}</span></div>
                    <div><span className="text-gray-500">Review cadence:</span> <span className="font-medium">{r.review_frequency ?? "—"}</span></div>
                    <div><span className="text-gray-500">Next appointment:</span> <span className="font-medium">{r.next_appointment ?? "—"}</span></div>
                    <div><span className="text-gray-500">Plan review:</span> <span className="font-medium">{r.review_date}</span></div>
                  </div>

                  {/* reason for referral */}
                  <div className="rounded-md bg-sky-50 border border-sky-200 p-3">
                    <h4 className="text-xs font-semibold text-sky-700 mb-1">Reason for Referral</h4>
                    <p className="text-sm text-sky-900">{r.reason_for_referral}</p>
                  </div>

                  {/* goals */}
                  {r.goals.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-2">Goals</h4>
                      <ul className="space-y-2">
                        {r.goals.map((g, i) => (
                          <li key={i} className="flex items-start justify-between gap-3 rounded-md border p-3">
                            <div className="flex-1">
                              <p className="text-sm">{g.goal}</p>
                              {g.target_date && (
                                <p className="text-xs text-gray-500 mt-0.5">Target: {g.target_date}</p>
                              )}
                            </div>
                            <span className={cn("shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border", GOAL_STATUS_COLOURS[g.status])}>
                              {PHYSIO_OT_GOAL_STATUS_LABEL[g.status]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* exercises programs */}
                  {r.exercises_programs.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-2">Exercises / Programmes</h4>
                      <div className="overflow-x-auto rounded-md border">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                              <th className="px-3 py-2 text-left">Programme</th>
                              <th className="px-3 py-2 text-left">Frequency</th>
                              <th className="px-3 py-2 text-left">Who Supports</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {r.exercises_programs.map((e, i) => (
                              <tr key={i}>
                                <td className="px-3 py-2 font-medium">{e.name}</td>
                                <td className="px-3 py-2 text-gray-600">{e.frequency}</td>
                                <td className="px-3 py-2 text-gray-600">{e.who_supports}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* equipment + home adaptations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {r.equipment.length > 0 && (
                      <div className="rounded-md bg-cyan-50 border border-cyan-200 p-3">
                        <h4 className="text-xs font-semibold text-cyan-700 mb-1">Equipment</h4>
                        <ul className="list-disc list-inside text-sm text-cyan-900 space-y-0.5">
                          {r.equipment.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </div>
                    )}
                    {r.home_environment_adaptations.length > 0 && (
                      <div className="rounded-md bg-teal-50 border border-teal-200 p-3">
                        <h4 className="text-xs font-semibold text-teal-700 mb-1">Home Environment Adaptations</h4>
                        <ul className="list-disc list-inside text-sm text-teal-900 space-y-0.5">
                          {r.home_environment_adaptations.map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* motivation + staff support */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-md bg-rose-50 border border-rose-200 p-3">
                      <h4 className="text-xs font-semibold text-rose-700 mb-1">Child Motivation</h4>
                      <p className="text-sm text-rose-900">{r.child_motivation}</p>
                    </div>
                    {r.staff_support_needed.length > 0 && (
                      <div className="rounded-md bg-indigo-50 border border-indigo-200 p-3">
                        <h4 className="text-xs font-semibold text-indigo-700 mb-1">Staff Support Needed</h4>
                        <ul className="list-disc list-inside text-sm text-indigo-900 space-y-0.5">
                          {r.staff_support_needed.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* child voice */}
                  {r.child_voice && (
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1">Child&apos;s Voice</h4>
                      <p className="text-sm text-amber-900 italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>
                  )}

                  {/* staff observation */}
                  {r.staff_observation && (
                    <div className="rounded-md bg-gray-50 border p-3">
                      <h4 className="text-xs font-semibold text-gray-600 mb-1">Staff Observation</h4>
                      <p className="text-sm text-gray-800">{r.staff_observation}</p>
                    </div>
                  )}

                  {/* smart link panel */}
                  <SmartLinkPanel sourceType="physio-ot-plan" sourceId={r.id} childId={r.child_id} compact />

                  {/* footer */}
                  <div className="text-xs text-gray-400 pt-2 border-t">
                    Coordinated by key worker {getStaffName(r.key_worker)} · Plan reviewed by {getStaffName("staff_darren")}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 mb-6">
        <strong>Quality Standard 8 — Children&apos;s Health and Wellbeing:</strong> Children must receive specialist therapy input where assessed need exists, with clear individualised plans, equipment provision, environmental adaptations and shared school-home implementation. Plans here align with NHS Children&apos;s Therapy Services pathways, Royal College of Occupational Therapists guidance, Chartered Society of Physiotherapy paediatric standards, the SEND Code of Practice, and UNCRC Article 23 (the right of disabled children to a full and decent life with active participation in the community). The child&apos;s voice — including their right to refuse a programme that isn&apos;t working — is central.
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
