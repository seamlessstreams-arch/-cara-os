"use client";

import { useState, useMemo } from "react";
import {
  Zap,
  Sparkles,
  Clock,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Brain,
  Pill,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ADHDDiagnosisStatus,
  ADHDPresentation,
  ADHDPlan,
} from "@/types/extended";
import { useADHDPlans } from "@/hooks/use-adhd-plans";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── label maps ───────────────────────────────────────────────────────── */

const DIAGNOSIS_STATUS_LABEL: Record<ADHDDiagnosisStatus, string> = {
  diagnosed: "Diagnosed",
  awaiting_assessment: "Awaiting assessment",
  suspected_being_explored: "Suspected — being explored",
  self_identified: "Self-identified",
  not_currently_considered: "Not currently considered",
};

const PRESENTATION_LABEL: Record<ADHDPresentation, string> = {
  predominantly_inattentive: "Predominantly inattentive",
  predominantly_hyperactive_impulsive: "Predominantly hyperactive-impulsive",
  combined: "Combined",
  unspecified: "Unspecified",
};

/* ── helpers ──────────────────────────────────────────────────────────── */

const STATUS_COLOURS: Record<ADHDDiagnosisStatus, string> = {
  diagnosed: "bg-violet-100 text-violet-800",
  awaiting_assessment: "bg-sky-100 text-sky-800",
  suspected_being_explored: "bg-amber-100 text-amber-800",
  self_identified: "bg-pink-100 text-pink-800",
  not_currently_considered: "bg-gray-100 text-gray-700",
};

/* ── flat row for export ─────────────────────────────────────────────── */

const EXPORT_COLS: ExportColumn<ADHDPlan>[] = [
  { header: "Young Person", accessor: (r: ADHDPlan) => getYPName(r.child_id) },
  { header: "Plan Date", accessor: (r: ADHDPlan) => r.plan_date },
  { header: "Diagnosis Status", accessor: (r: ADHDPlan) => DIAGNOSIS_STATUS_LABEL[r.diagnosis_status] },
  { header: "Presentation", accessor: (r: ADHDPlan) => r.presentation ? PRESENTATION_LABEL[r.presentation] : "" },
  { header: "Diagnosis Date", accessor: (r: ADHDPlan) => r.diagnosis_date ?? "" },
  { header: "Diagnosing Clinician", accessor: (r: ADHDPlan) => r.diagnosing_clinician ?? "" },
  { header: "Strengths", accessor: (r: ADHDPlan) => r.strengths.join("; ") },
  { header: "Challenges", accessor: (r: ADHDPlan) => r.challenges.join("; ") },
  { header: "Medication", accessor: (r: ADHDPlan) => r.medication ? `${r.medication.name} ${r.medication.dose} (${r.medication.timing})` : "" },
  { header: "Side Effects Monitored", accessor: (r: ADHDPlan) => r.medication?.side_effects_being_monitored.join("; ") ?? "" },
  { header: "Medication Holiday Plan", accessor: (r: ADHDPlan) => r.medication_holiday_plan ?? "" },
  { header: "Executive Function Support", accessor: (r: ADHDPlan) => r.executive_function_support.join("; ") },
  { header: "Time Blindness Strategies", accessor: (r: ADHDPlan) => r.time_blindness_strategies.join("; ") },
  { header: "Hyperfocus Management", accessor: (r: ADHDPlan) => r.hyperfocus_management.join("; ") },
  { header: "RSD Awareness", accessor: (r: ADHDPlan) => r.rsd_awareness },
  { header: "RSD Support", accessor: (r: ADHDPlan) => r.rsd_support.join("; ") },
  { header: "School Adjustments", accessor: (r: ADHDPlan) => r.school_adjustments.join("; ") },
  { header: "Home Adjustments", accessor: (r: ADHDPlan) => r.home_adjustments.join("; ") },
  { header: "Body Doubling Notes", accessor: (r: ADHDPlan) => r.body_doubling_notes ?? "" },
  { header: "External Support", accessor: (r: ADHDPlan) => r.external_support.map((e) => `${e.agency} (${e.role}) — ${e.frequency}`).join(" | ") },
  { header: "Staff DO", accessor: (r: ADHDPlan) => r.staff_do_strategies.join("; ") },
  { header: "Staff DO NOT", accessor: (r: ADHDPlan) => r.staff_do_not_strategies.join("; ") },
  { header: "Child Voice", accessor: (r: ADHDPlan) => r.child_voice },
  { header: "Staff Observation", accessor: (r: ADHDPlan) => r.staff_observation },
  { header: "Next Step", accessor: (r: ADHDPlan) => r.next_step },
  { header: "Review Date", accessor: (r: ADHDPlan) => r.review_date },
  { header: "Key Worker", accessor: (r: ADHDPlan) => getStaffName(r.key_worker) },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function ChildADHDSupportPlanPage() {
  const { data: apData, isLoading } = useADHDPlans();
  const data = apData?.data ?? [];

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const toggle = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── stats ─────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const d90 = new Date();
    d90.setDate(d90.getDate() + 90);
    const ninetyDays = d90.toISOString().slice(0, 10);

    const active = data.length;
    const onMeds = data.filter((r) => r.medication).length;
    const schoolAdj = data.filter((r) => r.school_adjustments.length > 0).length;
    const reviewsDue = data.filter(
      (r) => r.review_date >= today && r.review_date <= ninetyDays,
    ).length;
    return { active, onMeds, schoolAdj, reviewsDue };
  }, [data]);

  /* ── filtered / sorted ─────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.child_id).toLowerCase().includes(q) ||
          DIAGNOSIS_STATUS_LABEL[r.diagnosis_status].toLowerCase().includes(q) ||
          (r.presentation
            ? PRESENTATION_LABEL[r.presentation].toLowerCase().includes(q)
            : false),
      );
    }
    if (filterStatus !== "all") {
      list = list.filter((r) => r.diagnosis_status === filterStatus);
    }
    const out = [...list];
    switch (sortBy) {
      case "name":
        out.sort((a, b) =>
          getYPName(a.child_id).localeCompare(getYPName(b.child_id)),
        );
        break;
      case "review":
        out.sort((a, b) => a.review_date.localeCompare(b.review_date));
        break;
      case "planDate":
        out.sort((a, b) => b.plan_date.localeCompare(a.plan_date));
        break;
    }
    return out;
  }, [data, search, filterStatus, sortBy]);

  return (
    <PageShell
      title="ADHD Support Plans"
      subtitle="Per-child, strength-based ADHD support planning — neurodiversity-affirming, NICE NG87 aligned"
      ariaContext={{ pageTitle: "ADHD Support Plans", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="ADHD Support Plans" />
          <ExportButton
            data={data}
            columns={EXPORT_COLS}
            filename="adhd-support-plans"
          />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* ── stat strip ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Active Plans", value: stats.active, icon: Brain, colour: "text-violet-600" },
              { label: "On Medication", value: stats.onMeds, icon: Pill, colour: "text-amber-600" },
              { label: "School Adjustments Active", value: stats.schoolAdj, icon: Sparkles, colour: "text-sky-600" },
              { label: "Reviews Due (90d)", value: stats.reviewsDue, icon: Clock, colour: stats.reviewsDue > 0 ? "text-amber-600" : "text-gray-400" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg border bg-white p-4 flex items-center gap-3"
              >
                <s.icon className={cn("h-6 w-6", s.colour)} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── filters ────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search children, diagnosis status or presentation…"
                className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[210px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Diagnosis Statuses</SelectItem>
                {(Object.keys(STATUS_COLOURS) as ADHDDiagnosisStatus[]).map(
                  (k) => (
                    <SelectItem key={k} value={k}>
                      {DIAGNOSIS_STATUS_LABEL[k]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <ArrowUpDown className="h-4 w-4" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="review">Review Due</SelectItem>
                  <SelectItem value="planDate">Most Recent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── cards ──────────────────────────────────────────────────── */}
          <div className="space-y-4 mb-8">
            {filtered.map((r) => {
              const open = expanded[r.id] ?? false;
              return (
                <div
                  key={r.id}
                  className="rounded-lg border border-violet-100 bg-white"
                >
                  <button
                    onClick={() => toggle(r.id)}
                    className="flex w-full items-center justify-between p-4 text-left hover:bg-violet-50/50"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Brain className="h-4 w-4 text-[var(--cs-aria-gold)]" />
                        <h3 className="font-semibold">
                          {getYPName(r.child_id)}
                        </h3>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            STATUS_COLOURS[r.diagnosis_status],
                          )}
                        >
                          {DIAGNOSIS_STATUS_LABEL[r.diagnosis_status]}
                        </span>
                        {r.presentation && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                            {PRESENTATION_LABEL[r.presentation]}
                          </span>
                        )}
                        {r.medication && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <Pill className="h-3 w-3" />
                            On medication
                          </span>
                        )}
                        {r.rsd_awareness && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                            RSD-aware
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Plan {r.plan_date} · Key worker {getStaffName(r.key_worker)} ·{" "}
                        Review {r.review_date}
                      </p>
                    </div>
                    {open ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </button>

                  {open && (
                    <div className="border-t border-violet-100 px-4 pb-4 space-y-4">
                      {/* meta row */}
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Plan date:</span>{" "}
                          <span className="font-medium">{r.plan_date}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Diagnosis date:</span>{" "}
                          <span className="font-medium">
                            {r.diagnosis_date ?? "—"}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Clinician:</span>{" "}
                          <span className="font-medium">
                            {r.diagnosing_clinician ?? "—"}
                          </span>
                        </div>
                      </div>

                      {/* strengths + challenges */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                          <h4 className="text-xs font-semibold text-emerald-700 mb-1 inline-flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Strengths
                          </h4>
                          <ul className="list-disc list-inside text-sm text-emerald-900 space-y-0.5">
                            {r.strengths.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                          <h4 className="text-xs font-semibold text-amber-700 mb-1">
                            Challenges
                          </h4>
                          <ul className="list-disc list-inside text-sm text-amber-900 space-y-0.5">
                            {r.challenges.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* medication */}
                      {r.medication && (
                        <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
                          <h4 className="text-xs font-semibold text-amber-800 mb-2 inline-flex items-center gap-1">
                            <Pill className="h-3 w-3" /> Medication
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-amber-900 mb-2">
                            <div>
                              <span className="text-amber-700">Name:</span>{" "}
                              <span className="font-medium">
                                {r.medication.name}
                              </span>
                            </div>
                            <div>
                              <span className="text-amber-700">Dose:</span>{" "}
                              <span className="font-medium">
                                {r.medication.dose}
                              </span>
                            </div>
                            <div>
                              <span className="text-amber-700">Timing:</span>{" "}
                              <span className="font-medium">
                                {r.medication.timing}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-amber-900">
                            <p className="font-medium mb-1">
                              Side effects being monitored:
                            </p>
                            <ul className="list-disc list-inside space-y-0.5">
                              {r.medication.side_effects_being_monitored.map(
                                (s, i) => (
                                  <li key={i}>{s}</li>
                                ),
                              )}
                            </ul>
                          </div>
                          <p className="text-xs text-amber-700 mt-2">
                            Next medication review:{" "}
                            <span className="font-medium">
                              {r.medication.review_date}
                            </span>
                          </p>
                          {r.medication_holiday_plan && (
                            <div className="mt-2 rounded bg-white/60 p-2 text-sm text-amber-900">
                              <span className="font-medium">
                                Medication holiday plan:
                              </span>{" "}
                              {r.medication_holiday_plan}
                            </div>
                          )}
                        </div>
                      )}

                      {/* executive function */}
                      <div className="rounded-md border border-violet-200 bg-violet-50 p-3">
                        <h4 className="text-xs font-semibold text-violet-700 mb-1 inline-flex items-center gap-1">
                          <Brain className="h-3 w-3" /> Executive Function Support
                        </h4>
                        <ul className="list-disc list-inside text-sm text-violet-900 space-y-0.5">
                          {r.executive_function_support.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      {/* time blindness + hyperfocus */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-md border border-sky-200 bg-sky-50 p-3">
                          <h4 className="text-xs font-semibold text-sky-700 mb-1 inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Time Blindness Strategies
                          </h4>
                          <ul className="list-disc list-inside text-sm text-sky-900 space-y-0.5">
                            {r.time_blindness_strategies.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-md border border-violet-200 bg-violet-50 p-3">
                          <h4 className="text-xs font-semibold text-violet-700 mb-1 inline-flex items-center gap-1">
                            <Zap className="h-3 w-3" /> Hyperfocus Management
                          </h4>
                          <ul className="list-disc list-inside text-sm text-violet-900 space-y-0.5">
                            {r.hyperfocus_management.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* RSD */}
                      <div className="rounded-md border border-pink-200 bg-pink-50 p-3">
                        <h4 className="text-xs font-semibold text-pink-700 mb-1">
                          Rejection Sensitive Dysphoria (RSD) — Awareness
                        </h4>
                        <p className="text-sm text-pink-900 mb-2">
                          {r.rsd_awareness}
                        </p>
                        {r.rsd_support.length > 0 && (
                          <>
                            <h5 className="text-xs font-semibold text-pink-700 mb-1">
                              RSD support
                            </h5>
                            <ul className="list-disc list-inside text-sm text-pink-900 space-y-0.5">
                              {r.rsd_support.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>

                      {/* school + home adjustments */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-md border border-sky-200 bg-sky-50 p-3">
                          <h4 className="text-xs font-semibold text-sky-700 mb-1">
                            School Adjustments
                          </h4>
                          <ul className="list-disc list-inside text-sm text-sky-900 space-y-0.5">
                            {r.school_adjustments.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-md border border-violet-200 bg-violet-50 p-3">
                          <h4 className="text-xs font-semibold text-violet-700 mb-1">
                            Home Adjustments
                          </h4>
                          <ul className="list-disc list-inside text-sm text-violet-900 space-y-0.5">
                            {r.home_adjustments.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* body doubling */}
                      {r.body_doubling_notes && (
                        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                          <h4 className="text-xs font-semibold text-emerald-700 mb-1">
                            Body Doubling
                          </h4>
                          <p className="text-sm text-emerald-900">
                            {r.body_doubling_notes}
                          </p>
                        </div>
                      )}

                      {/* external support */}
                      {r.external_support.length > 0 && (
                        <div className="rounded-md border bg-white p-3">
                          <h4 className="text-xs font-semibold text-gray-500 mb-2">
                            External Support
                          </h4>
                          <div className="space-y-2">
                            {r.external_support.map((e, i) => (
                              <div
                                key={i}
                                className="rounded bg-gray-50 p-2 text-sm"
                              >
                                <p className="font-medium">{e.agency}</p>
                                <p className="text-gray-700">{e.role}</p>
                                <p className="text-xs text-gray-500">
                                  Frequency: {e.frequency}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* staff DO / DO NOT */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                          <h4 className="text-xs font-semibold text-emerald-700 mb-1">
                            Staff DO
                          </h4>
                          <ul className="list-disc list-inside text-sm text-emerald-900 space-y-0.5">
                            {r.staff_do_strategies.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
                          <h4 className="text-xs font-semibold text-rose-700 mb-1">
                            Staff DO NOT
                          </h4>
                          <ul className="list-disc list-inside text-sm text-rose-900 space-y-0.5">
                            {r.staff_do_not_strategies.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* child voice */}
                      <div className="rounded-md border border-pink-200 bg-pink-50 p-3">
                        <h4 className="text-xs font-semibold text-pink-700 mb-1">
                          Child&apos;s Voice
                        </h4>
                        <p className="text-sm italic text-pink-900">
                          {r.child_voice}
                        </p>
                      </div>

                      {/* staff observation */}
                      <div className="rounded-md bg-gray-50 p-3">
                        <h4 className="text-xs font-semibold text-gray-500 mb-1">
                          Staff Observation
                        </h4>
                        <p className="text-sm text-gray-800">
                          {r.staff_observation}
                        </p>
                      </div>

                      {/* next step */}
                      <div className="rounded-md border border-sky-200 bg-sky-50 p-3">
                        <h4 className="text-xs font-semibold text-sky-700 mb-1">
                          Next Step
                        </h4>
                        <p className="text-sm text-sky-900">{r.next_step}</p>
                      </div>

                      {/* smart link panel */}
                      <SmartLinkPanel sourceType="adhd_plan" sourceId={r.id} childId={r.child_id} compact />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── regulatory note ────────────────────────────────────────── */}
          <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900 mb-6">
            <strong>Regulatory framework:</strong> ADHD support planning aligns
            with NICE NG87 (Attention deficit hyperactivity disorder: diagnosis
            and management), NHS Right to Choose pathway for assessment, ADHD UK
            and ADHD Foundation guidance, the Equality Act 2010, the Children&apos;s
            Homes (England) Regulations 2015 Quality Standards 5 (Education), 6
            (Enjoyment and Achievement), 7 (Health and Well-being) and 8
            (Positive Relationships), and UNCRC Articles 12 (right to be heard)
            and 23 (rights of disabled children). Plans are strength-based and
            neurodiversity-affirming — ADHD is a difference in cognitive style,
            not a deficit of character.
          </div>
        </>
      )}
      <CareEventsPanel
        title="Care Events — Health"
        category="health"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="ADHD Support Plans — ADHD diagnosis, medication, coping strategies, school liaison, attention support, impulsivity strategies, reward systems, EHCP, key worker support"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
