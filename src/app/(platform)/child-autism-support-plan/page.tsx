"use client";

import { useState, useMemo } from "react";
import {
  Brain,
  Sparkles,
  Heart,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Star,
  Clock,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn, todayStr } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AutismPlan, AutismDiagnosisStatus, AutismSensoryPattern } from "@/types/extended";
import { AUTISM_DIAGNOSIS_STATUS_LABEL, AUTISM_SENSORY_PATTERN_LABEL } from "@/types/extended";
import { useAutismPlans } from "@/hooks/use-autism-plans";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";

/* ── helpers ───────────────────────────────────────────────────────────── */

const STATUS_COLOURS: Record<AutismDiagnosisStatus, string> = {
  diagnosed: "bg-violet-100 text-violet-800 border-violet-200",
  self_identified: "bg-teal-100 text-teal-800 border-teal-200",
  awaiting_assessment: "bg-amber-100 text-amber-800 border-amber-200",
  suspected_gathering_evidence: "bg-sky-100 text-sky-800 border-sky-200",
  not_currently_considered: "bg-gray-100 text-gray-700 border-gray-200",
};

const SEEKING_COLOURS: Record<AutismSensoryPattern, string> = {
  seeking: "bg-emerald-100 text-emerald-800",
  avoiding: "bg-rose-100 text-rose-800",
  mixed: "bg-amber-100 text-amber-800",
  neutral: "bg-gray-100 text-gray-700",
};

/* ── flat row for export ───────────────────────────────────────────────── */

interface FlatRow {
  child: string;
  plan_date: string;
  diagnosis_status: string;
  diagnosis_date: string;
  diagnosing_clinician: string;
  special_interests: string;
  communication_preferences: string;
  processing_time: string;
  sensory_profile: string;
  predictability_needs: string;
  routine_anchors: string;
  meltdown_triggers: string;
  meltdown_support: string;
  shutdown_indicators: string;
  shutdown_support: string;
  masking_awareness: string;
  unmasking_permissions: string;
  transition_support: string;
  social_preferences: string;
  staff_do_strategies: string;
  staff_do_not_strategies: string;
  external_support: string;
  child_voice: string;
  staff_observation: string;
  next_step: string;
  review_date: string;
  key_worker: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Young Person", accessor: (r: FlatRow) => r.child },
  { header: "Plan Date", accessor: (r: FlatRow) => r.plan_date },
  { header: "Diagnosis Status", accessor: (r: FlatRow) => r.diagnosis_status },
  { header: "Diagnosis Date", accessor: (r: FlatRow) => r.diagnosis_date },
  { header: "Diagnosing Clinician", accessor: (r: FlatRow) => r.diagnosing_clinician },
  { header: "Special Interests", accessor: (r: FlatRow) => r.special_interests },
  { header: "Communication Preferences", accessor: (r: FlatRow) => r.communication_preferences },
  { header: "Processing Time", accessor: (r: FlatRow) => r.processing_time },
  { header: "Sensory Profile", accessor: (r: FlatRow) => r.sensory_profile },
  { header: "Predictability Needs", accessor: (r: FlatRow) => r.predictability_needs },
  { header: "Routine Anchors", accessor: (r: FlatRow) => r.routine_anchors },
  { header: "Meltdown Triggers", accessor: (r: FlatRow) => r.meltdown_triggers },
  { header: "Meltdown Support", accessor: (r: FlatRow) => r.meltdown_support },
  { header: "Shutdown Indicators", accessor: (r: FlatRow) => r.shutdown_indicators },
  { header: "Shutdown Support", accessor: (r: FlatRow) => r.shutdown_support },
  { header: "Masking Awareness", accessor: (r: FlatRow) => r.masking_awareness },
  { header: "Unmasking Permissions", accessor: (r: FlatRow) => r.unmasking_permissions },
  { header: "Transition Support", accessor: (r: FlatRow) => r.transition_support },
  { header: "Social Preferences", accessor: (r: FlatRow) => r.social_preferences },
  { header: "Staff DO", accessor: (r: FlatRow) => r.staff_do_strategies },
  { header: "Staff DO NOT", accessor: (r: FlatRow) => r.staff_do_not_strategies },
  { header: "External Support", accessor: (r: FlatRow) => r.external_support },
  { header: "Child Voice", accessor: (r: FlatRow) => r.child_voice },
  { header: "Staff Observation", accessor: (r: FlatRow) => r.staff_observation },
  { header: "Next Step", accessor: (r: FlatRow) => r.next_step },
  { header: "Review Date", accessor: (r: FlatRow) => r.review_date },
  { header: "Key Worker", accessor: (r: FlatRow) => r.key_worker },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function ChildAutismSupportPlanPage() {
  const { data: resp, isLoading } = useAutismPlans();
  const data = resp?.data ?? [];

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* stats */
  const stats = useMemo(() => {
    const active = data.length;
    const diagnosed = data.filter((r) => r.diagnosis_status === "diagnosed").length;
    const awaiting = data.filter((r) => r.diagnosis_status === "awaiting_assessment").length;
    const reviewSoon = data.filter((r) => r.review_date <= todayStr()).length;
    return { active, diagnosed, awaiting, reviewSoon };
  }, [data]);

  /* filtered / sorted */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.child_id).toLowerCase().includes(q) ||
          r.special_interests.some((i) => i.toLowerCase().includes(q)) ||
          AUTISM_DIAGNOSIS_STATUS_LABEL[r.diagnosis_status].toLowerCase().includes(q),
      );
    }
    if (filterStatus !== "all") {
      list = list.filter((r) => r.diagnosis_status === filterStatus);
    }
    const out = [...list];
    switch (sortBy) {
      case "name":
        out.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id)));
        break;
      case "review":
        out.sort((a, b) => a.review_date.localeCompare(b.review_date));
        break;
      case "interests":
        out.sort((a, b) => b.special_interests.length - a.special_interests.length);
        break;
    }
    return out;
  }, [data, search, filterStatus, sortBy]);

  /* export */
  const exportData = useMemo<FlatRow[]>(
    () =>
      data.map((r) => ({
        child: getYPName(r.child_id),
        plan_date: r.plan_date,
        diagnosis_status: AUTISM_DIAGNOSIS_STATUS_LABEL[r.diagnosis_status],
        diagnosis_date: r.diagnosis_date ?? "",
        diagnosing_clinician: r.diagnosing_clinician ?? "",
        special_interests: r.special_interests.join("; "),
        communication_preferences: r.communication_preferences.join("; "),
        processing_time: r.processing_time,
        sensory_profile: r.sensory_profile
          .map((s) => `${s.sense} (${AUTISM_SENSORY_PATTERN_LABEL[s.seeking_or_avoiding]}): ${s.specific_notes}`)
          .join(" | "),
        predictability_needs: r.predictability_needs.join("; "),
        routine_anchors: r.routine_anchors.join("; "),
        meltdown_triggers: r.meltdown_triggers.join("; "),
        meltdown_support: r.meltdown_support.join("; "),
        shutdown_indicators: r.shutdown_indicators.join("; "),
        shutdown_support: r.shutdown_support.join("; "),
        masking_awareness: r.masking_awareness,
        unmasking_permissions: r.unmasking_permissions.join("; "),
        transition_support: r.transition_support.join("; "),
        social_preferences: r.social_preferences.join("; "),
        staff_do_strategies: r.staff_do_strategies.join("; "),
        staff_do_not_strategies: r.staff_do_not_strategies.join("; "),
        external_support: r.external_support
          .map((e) => `${e.agency} — ${e.role} (${e.frequency})`)
          .join(" | "),
        child_voice: r.child_voice,
        staff_observation: r.staff_observation,
        next_step: r.next_step,
        review_date: r.review_date,
        key_worker: getStaffName(r.key_worker),
      })),
    [data],
  );

  if (isLoading) {
    return (
      <PageShell
        title="Autism Support Plans"
        subtitle="Per-child, strength-based, neurodiversity-affirming support — monotropism, sensory regulation, masking and unmasking, meltdown vs shutdown protocols"
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Autism Support Plans"
      subtitle="Per-child, strength-based, neurodiversity-affirming support — monotropism, sensory regulation, masking and unmasking, meltdown vs shutdown protocols"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Autism Support Plans" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="autism-support-plans" />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Plans", value: stats.active, icon: Brain, colour: "text-violet-600" },
          { label: "Diagnosed", value: stats.diagnosed, icon: Sparkles, colour: "text-teal-600" },
          { label: "Awaiting Assessment", value: stats.awaiting, icon: Clock, colour: "text-amber-600" },
          { label: "Reviews Due 90d", value: stats.reviewSoon, icon: Heart, colour: "text-sky-600" },
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

      {/* ── filters ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search children, special interests, status…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[220px] h-9 text-sm">
            <SelectValue placeholder="All Diagnosis Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Diagnosis Statuses</SelectItem>
            <SelectItem value="diagnosed">{AUTISM_DIAGNOSIS_STATUS_LABEL.diagnosed}</SelectItem>
            <SelectItem value="self_identified">{AUTISM_DIAGNOSIS_STATUS_LABEL.self_identified}</SelectItem>
            <SelectItem value="awaiting_assessment">{AUTISM_DIAGNOSIS_STATUS_LABEL.awaiting_assessment}</SelectItem>
            <SelectItem value="suspected_gathering_evidence">{AUTISM_DIAGNOSIS_STATUS_LABEL.suspected_gathering_evidence}</SelectItem>
            <SelectItem value="not_currently_considered">{AUTISM_DIAGNOSIS_STATUS_LABEL.not_currently_considered}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="review">Review Date</SelectItem>
              <SelectItem value="interests">Most Interests</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expanded[r.id] ?? false;
          const sensoryComplexity = r.sensory_profile.filter(
            (s) => s.seeking_or_avoiding !== "neutral",
          ).length;
          return (
            <div key={r.id} className="rounded-lg border bg-white">
              <button
                onClick={() => toggle(r.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Brain className="h-4 w-4 text-violet-500" />
                    <h3 className="font-semibold">{getYPName(r.child_id)}</h3>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium border",
                        STATUS_COLOURS[r.diagnosis_status],
                      )}
                    >
                      {AUTISM_DIAGNOSIS_STATUS_LABEL[r.diagnosis_status]}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                      <Star className="h-3 w-3 inline mr-1" />
                      {r.special_interests.length} special interests
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                      Sensory: {sensoryComplexity}/{r.sensory_profile.length} active
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Plan {r.plan_date} · Key worker {getStaffName(r.key_worker)} · Review{" "}
                    <span className={cn(r.review_date <= todayStr() ? "text-red-600 font-medium" : "")}>
                      {r.review_date}
                    </span>
                  </p>
                </div>
                {open ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-5">
                  {/* diagnosis info */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm rounded-md bg-violet-50 border border-violet-200 p-3">
                    <div>
                      <span className="text-gray-500">Status:</span>{" "}
                      <span className="font-medium">{AUTISM_DIAGNOSIS_STATUS_LABEL[r.diagnosis_status]}</span>
                    </div>
                    {r.diagnosis_date && (
                      <div>
                        <span className="text-gray-500">Diagnosed:</span>{" "}
                        <span className="font-medium">{r.diagnosis_date}</span>
                      </div>
                    )}
                    {r.diagnosing_clinician && (
                      <div className="md:col-span-3">
                        <span className="text-gray-500">Clinician:</span>{" "}
                        <span className="font-medium">{r.diagnosing_clinician}</span>
                      </div>
                    )}
                  </div>

                  {/* special interests */}
                  <div>
                    <h4 className="text-xs font-semibold text-violet-700 mb-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Special Interests (monotropic strengths)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {r.special_interests.map((i, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800 border border-violet-200"
                        >
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* communication */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-teal-50 border border-teal-200 p-3">
                      <h4 className="text-xs font-semibold text-teal-700 mb-1">
                        Communication Preferences
                      </h4>
                      <ul className="list-disc list-inside text-sm text-teal-900 space-y-0.5">
                        {r.communication_preferences.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md bg-sky-50 border border-sky-200 p-3">
                      <h4 className="text-xs font-semibold text-sky-700 mb-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Processing Time
                      </h4>
                      <p className="text-sm text-sky-900">{r.processing_time}</p>
                    </div>
                  </div>

                  {/* sensory profile */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Sensory Profile</h4>
                    <div className="overflow-x-auto rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="text-left px-3 py-2">Sense</th>
                            <th className="text-left px-3 py-2">Pattern</th>
                            <th className="text-left px-3 py-2">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.sensory_profile.map((s, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-3 py-2 font-medium">{s.sense}</td>
                              <td className="px-3 py-2">
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-medium",
                                    SEEKING_COLOURS[s.seeking_or_avoiding],
                                  )}
                                >
                                  {AUTISM_SENSORY_PATTERN_LABEL[s.seeking_or_avoiding]}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-gray-700">{s.specific_notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* predictability + routines */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-violet-50 border border-violet-200 p-3">
                      <h4 className="text-xs font-semibold text-violet-700 mb-1">
                        Predictability Needs
                      </h4>
                      <ul className="list-disc list-inside text-sm text-violet-900 space-y-0.5">
                        {r.predictability_needs.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md bg-teal-50 border border-teal-200 p-3">
                      <h4 className="text-xs font-semibold text-teal-700 mb-1">Routine Anchors</h4>
                      <ul className="list-disc list-inside text-sm text-teal-900 space-y-0.5">
                        {r.routine_anchors.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* meltdown vs shutdown */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">
                      Dysregulation Support — Meltdown and Shutdown
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-md bg-rose-50 border border-rose-200 p-3 space-y-2">
                        <p className="text-xs font-semibold text-rose-700">Meltdown</p>
                        <div>
                          <p className="text-xs font-medium text-rose-700">Triggers</p>
                          <ul className="list-disc list-inside text-sm text-rose-900 space-y-0.5">
                            {r.meltdown_triggers.map((t, idx) => (
                              <li key={idx}>{t}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-rose-700">Support</p>
                          <ul className="list-disc list-inside text-sm text-rose-900 space-y-0.5">
                            {r.meltdown_support.map((t, idx) => (
                              <li key={idx}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="rounded-md bg-indigo-50 border border-indigo-200 p-3 space-y-2">
                        <p className="text-xs font-semibold text-indigo-700">Shutdown</p>
                        <div>
                          <p className="text-xs font-medium text-indigo-700">Indicators</p>
                          <ul className="list-disc list-inside text-sm text-indigo-900 space-y-0.5">
                            {r.shutdown_indicators.map((t, idx) => (
                              <li key={idx}>{t}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-indigo-700">Support</p>
                          <ul className="list-disc list-inside text-sm text-indigo-900 space-y-0.5">
                            {r.shutdown_support.map((t, idx) => (
                              <li key={idx}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* masking */}
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3 space-y-2">
                    <h4 className="text-xs font-semibold text-amber-700">
                      Masking Awareness and Unmasking Permissions
                    </h4>
                    <p className="text-sm text-amber-900">{r.masking_awareness}</p>
                    <div>
                      <p className="text-xs font-medium text-amber-700 mt-2">
                        Unmasking permissions (home as sanctuary)
                      </p>
                      <ul className="list-disc list-inside text-sm text-amber-900 space-y-0.5">
                        {r.unmasking_permissions.map((u, idx) => (
                          <li key={idx}>{u}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* transitions + social */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-sky-50 border border-sky-200 p-3">
                      <h4 className="text-xs font-semibold text-sky-700 mb-1">Transition Support</h4>
                      <ul className="list-disc list-inside text-sm text-sky-900 space-y-0.5">
                        {r.transition_support.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md bg-teal-50 border border-teal-200 p-3">
                      <h4 className="text-xs font-semibold text-teal-700 mb-1">Social Preferences</h4>
                      <ul className="list-disc list-inside text-sm text-teal-900 space-y-0.5">
                        {r.social_preferences.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* DO / DO NOT */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
                      <h4 className="text-xs font-semibold text-emerald-700 mb-1">Staff DO</h4>
                      <ul className="list-disc list-inside text-sm text-emerald-900 space-y-0.5">
                        {r.staff_do_strategies.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md bg-rose-50 border border-rose-200 p-3">
                      <h4 className="text-xs font-semibold text-rose-700 mb-1">Staff DO NOT</h4>
                      <ul className="list-disc list-inside text-sm text-rose-900 space-y-0.5">
                        {r.staff_do_not_strategies.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* external support */}
                  {r.external_support.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-2">External Support</h4>
                      <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                              <th className="text-left px-3 py-2">Agency</th>
                              <th className="text-left px-3 py-2">Role</th>
                              <th className="text-left px-3 py-2">Frequency</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.external_support.map((e, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-3 py-2 font-medium">{e.agency}</td>
                                <td className="px-3 py-2 text-gray-700">{e.role}</td>
                                <td className="px-3 py-2 text-gray-700">{e.frequency}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* child voice */}
                  <div className="rounded-md bg-violet-50 border-l-4 border-violet-400 p-3">
                    <h4 className="text-xs font-semibold text-violet-700 mb-1">
                      Child&apos;s Voice
                    </h4>
                    <p className="text-sm text-violet-900 italic">&ldquo;{r.child_voice}&rdquo;</p>
                  </div>

                  {/* staff observation */}
                  <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Staff Observation</h4>
                    <p className="text-sm text-gray-800">{r.staff_observation}</p>
                  </div>

                  {/* next step */}
                  <div className="rounded-md bg-teal-50 border border-teal-200 p-3">
                    <h4 className="text-xs font-semibold text-teal-700 mb-1">Next Step</h4>
                    <p className="text-sm text-teal-900">{r.next_step}</p>
                  </div>

                  {/* smart link panel */}
                  <SmartLinkPanel sourceType="autism-plan" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900 mb-6 space-y-2">
        <p>
          <strong>Regulatory and clinical framework:</strong> Plans aligned with NICE CG142
          (autism in children and young people), the Autism Act 2009, the NHS Neurodevelopmental
          Pathway, and the Equality Act 2010 (autism as a disability requires reasonable
          adjustments). Children&apos;s Homes Regulations Quality Standards 5 (health and
          wellbeing), 6 (positive relationships), 7 (protection of children), and 8 (leadership
          and management) all apply.
        </p>
        <p>
          <strong>Theoretical framing:</strong> Monotropism theory (Murray, Lawson, Lesser) — autistic
          attention is deeply channelled rather than diffuse, and special interests are a
          neurological feature, not a deficit. Strength-based, neurodiversity-affirming guidance
          drawn from the National Autistic Society, Autistica, and AsIAm. UNCRC Article 12
          (right to be heard) and Article 23 (rights of disabled children) guide the child-voice
          centring of this plan. Functioning labels are avoided.
        </p>
      </div>
    </PageShell>
  );
}
