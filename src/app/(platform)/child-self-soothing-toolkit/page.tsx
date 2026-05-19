"use client";

import { useState, useMemo } from "react";
import {
  Heart,
  Wind,
  Activity,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Sparkles,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn, formatDate } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { SelfSoothingToolkit, ArousalState, WindowOfTolerance, ToolkitEffectiveness } from "@/types/extended";
import { AROUSAL_STATE_LABEL, WINDOW_OF_TOLERANCE_LABEL, TOOLKIT_EFFECTIVENESS_LABEL } from "@/types/extended";
import { useSelfSoothingToolkits } from "@/hooks/use-self-soothing-toolkits";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── colour helpers ────────────────────────────────────────────────────── */

const STATE_COLOURS: Record<ArousalState, string> = {
  hyperarousal: "bg-red-100 text-red-800",
  hypoarousal: "bg-blue-100 text-blue-800",
  mixed: "bg-amber-100 text-amber-800",
};

const WINDOW_COLOURS: Record<WindowOfTolerance, string> = {
  narrow: "bg-red-100 text-red-800",
  moderate: "bg-amber-100 text-amber-800",
  widening: "bg-emerald-100 text-emerald-800",
};

const EFFECTIVENESS_COLOURS: Record<ToolkitEffectiveness, string> = {
  highly_effective: "bg-emerald-100 text-emerald-800",
  effective: "bg-green-100 text-green-800",
  mixed: "bg-amber-100 text-amber-800",
  needs_review: "bg-red-100 text-red-800",
};

/* ── flat row for export ──────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string;
  lastUpdated: string;
  primaryState: string;
  windowOfTolerance: string;
  effectivenessRating: string;
  sensoryStrategies: string;
  breathingStrategies: string;
  movementStrategies: string;
  distractionStrategies: string;
  coRegulationStrategies: string;
  whatWorksAnxious: string;
  whatWorksAngry: string;
  whatWorksOverwhelmed: string;
  doNotUse: string;
  childChoseAll: string;
  childVoice: string;
  staffObservation: string;
  externalSupport: string;
  reviewDate: string;
  keyWorker: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Young Person",       accessor: (r: FlatRow) => r.youngPerson },
  { header: "Last Updated",       accessor: (r: FlatRow) => r.lastUpdated },
  { header: "Primary State",      accessor: (r: FlatRow) => r.primaryState },
  { header: "Window of Tolerance",accessor: (r: FlatRow) => r.windowOfTolerance },
  { header: "Effectiveness",      accessor: (r: FlatRow) => r.effectivenessRating },
  { header: "Sensory",            accessor: (r: FlatRow) => r.sensoryStrategies },
  { header: "Breathing",          accessor: (r: FlatRow) => r.breathingStrategies },
  { header: "Movement",           accessor: (r: FlatRow) => r.movementStrategies },
  { header: "Distraction",        accessor: (r: FlatRow) => r.distractionStrategies },
  { header: "Co-Regulation",      accessor: (r: FlatRow) => r.coRegulationStrategies },
  { header: "Anxious — Works",    accessor: (r: FlatRow) => r.whatWorksAnxious },
  { header: "Angry — Works",      accessor: (r: FlatRow) => r.whatWorksAngry },
  { header: "Overwhelmed — Works",accessor: (r: FlatRow) => r.whatWorksOverwhelmed },
  { header: "Do Not Use",         accessor: (r: FlatRow) => r.doNotUse },
  { header: "Child Chose All",    accessor: (r: FlatRow) => r.childChoseAll },
  { header: "Child Voice",        accessor: (r: FlatRow) => r.childVoice },
  { header: "Staff Observation",  accessor: (r: FlatRow) => r.staffObservation },
  { header: "External Support",   accessor: (r: FlatRow) => r.externalSupport },
  { header: "Review Date",        accessor: (r: FlatRow) => r.reviewDate },
  { header: "Key Worker",         accessor: (r: FlatRow) => r.keyWorker },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function ChildSelfSoothingToolkitPage() {
  const { data: res, isLoading } = useSelfSoothingToolkits();
  const items = res?.data ?? [];

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterEffect, setFilterEffect] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── loading ─────────────────────────────────────────────────────── */
  if (isLoading) {
    return <PageShell title="Child Self-Soothing Toolkit" subtitle="Loading…"><div /></PageShell>;
  }

  /* ── stats ────────────────────────────────────────────────────────── */
  const in21d = new Date();
  in21d.setDate(in21d.getDate() + 21);
  const in21dStr = in21d.toISOString().slice(0, 10);

  const stats = (() => {
    const withToolkits = items.length;
    const highlyEffective = items.filter((r) => r.effectiveness_rating === "highly_effective").length;
    const reviewsDue = items.filter((r) => r.review_date <= in21dStr).length;
    const widening = items.filter((r) => r.window_of_tolerance === "widening").length;
    return { withToolkits, highlyEffective, reviewsDue, widening };
  })();

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = (() => {
    let list = items;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        getYPName(r.child_id).toLowerCase().includes(q) ||
        AROUSAL_STATE_LABEL[r.primary_state].toLowerCase().includes(q) ||
        TOOLKIT_EFFECTIVENESS_LABEL[r.effectiveness_rating].toLowerCase().includes(q)
      );
    }
    if (filterEffect !== "all") list = list.filter((r) => r.effectiveness_rating === filterEffect);
    const out = [...list];
    switch (sortBy) {
      case "name":
        out.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id)));
        break;
      case "effectiveness": {
        const order: Record<ToolkitEffectiveness, number> = {
          highly_effective: 0, effective: 1, mixed: 2, needs_review: 3,
        };
        out.sort((a, b) => order[a.effectiveness_rating] - order[b.effectiveness_rating]);
        break;
      }
      case "review":
        out.sort((a, b) => a.review_date.localeCompare(b.review_date));
        break;
    }
    return out;
  })();

  /* ── export ───────────────────────────────────────────────────────── */
  const exportData: FlatRow[] = items.map((r) => ({
    youngPerson: getYPName(r.child_id),
    lastUpdated: r.last_updated,
    primaryState: AROUSAL_STATE_LABEL[r.primary_state],
    windowOfTolerance: WINDOW_OF_TOLERANCE_LABEL[r.window_of_tolerance],
    effectivenessRating: TOOLKIT_EFFECTIVENESS_LABEL[r.effectiveness_rating],
    sensoryStrategies: r.sensory_strategies.join("; "),
    breathingStrategies: r.breathing_strategies.join("; "),
    movementStrategies: r.movement_strategies.join("; "),
    distractionStrategies: r.distraction_strategies.join("; "),
    coRegulationStrategies: r.co_regulation_strategies.join("; "),
    whatWorksAnxious: r.what_works_anxious.join("; "),
    whatWorksAngry: r.what_works_angry.join("; "),
    whatWorksOverwhelmed: r.what_works_overwhelmed.join("; "),
    doNotUse: r.do_not_use.join("; "),
    childChoseAll: r.child_chose_all ? "Yes" : "No",
    childVoice: r.child_voice,
    staffObservation: r.staff_observation,
    externalSupport: r.external_support ?? "",
    reviewDate: r.review_date,
    keyWorker: getStaffName(r.key_worker),
  }));

  return (
    <PageShell
      title="Child Self-Soothing Toolkit"
      subtitle="Per-child library of regulation strategies — sensory, breathing, movement, distraction and co-regulation"
      ariaContext={{ pageTitle: "Self-Soothing Toolkit", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Self-Soothing Toolkit" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="child-self-soothing-toolkit" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Children with toolkits", value: stats.withToolkits, icon: Heart, colour: "text-violet-600" },
          { label: "Highly effective", value: stats.highlyEffective, icon: Sparkles, colour: stats.highlyEffective > 0 ? "text-emerald-600" : "text-gray-400" },
          { label: "Reviews due (21 d)", value: stats.reviewsDue, icon: Wind, colour: stats.reviewsDue > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Window widening", value: stats.widening, icon: Activity, colour: stats.widening > 0 ? "text-emerald-600" : "text-gray-400" },
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
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search children, states, effectiveness…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterEffect} onValueChange={setFilterEffect}>
          <SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All effectiveness</SelectItem>
            {Object.entries(TOOLKIT_EFFECTIVENESS_LABEL).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="effectiveness">Effectiveness</SelectItem>
              <SelectItem value="review">Review date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expanded[r.id] ?? false;
          return (
            <div key={r.id} className="rounded-lg border bg-white">
              <button
                onClick={() => toggle(r.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-violet-50/40"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Heart className="h-4 w-4 text-violet-500" />
                    <h3 className="font-semibold">{getYPName(r.child_id)}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATE_COLOURS[r.primary_state])}>
                      {AROUSAL_STATE_LABEL[r.primary_state]}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", WINDOW_COLOURS[r.window_of_tolerance])}>
                      Window: {WINDOW_OF_TOLERANCE_LABEL[r.window_of_tolerance]}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", EFFECTIVENESS_COLOURS[r.effectiveness_rating])}>
                      {TOOLKIT_EFFECTIVENESS_LABEL[r.effectiveness_rating]}
                    </span>
                    {r.child_chose_all && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                        Child-chosen
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Key worker: {getStaffName(r.key_worker)} · Updated {formatDate(r.last_updated)} · Review {r.review_date}
                  </p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* strategies grouped by category */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-violet-50 border border-violet-200 p-3">
                      <h4 className="text-xs font-semibold text-violet-700 mb-1">Sensory</h4>
                      <ul className="list-disc list-inside text-sm text-violet-900 space-y-0.5">
                        {r.sensory_strategies.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-sky-50 border border-sky-200 p-3">
                      <h4 className="text-xs font-semibold text-sky-700 mb-1">Breathing</h4>
                      <ul className="list-disc list-inside text-sm text-sky-900 space-y-0.5">
                        {r.breathing_strategies.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1">Movement</h4>
                      <ul className="list-disc list-inside text-sm text-amber-900 space-y-0.5">
                        {r.movement_strategies.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-indigo-50 border border-indigo-200 p-3">
                      <h4 className="text-xs font-semibold text-indigo-700 mb-1">Distraction</h4>
                      <ul className="list-disc list-inside text-sm text-indigo-900 space-y-0.5">
                        {r.distraction_strategies.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-fuchsia-50 border border-fuchsia-200 p-3 md:col-span-2">
                      <h4 className="text-xs font-semibold text-fuchsia-700 mb-1">Co-Regulation</h4>
                      <ul className="list-disc list-inside text-sm text-fuchsia-900 space-y-0.5">
                        {r.co_regulation_strategies.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* what works in different states */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">What works in each state</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3">
                        <p className="text-xs font-semibold text-amber-700 mb-1">When anxious</p>
                        <ul className="list-disc list-inside text-xs text-amber-900 space-y-0.5">
                          {r.what_works_anxious.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-md border border-rose-200 bg-rose-50/60 p-3">
                        <p className="text-xs font-semibold text-rose-700 mb-1">When angry</p>
                        <ul className="list-disc list-inside text-xs text-rose-900 space-y-0.5">
                          {r.what_works_angry.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-md border border-blue-200 bg-blue-50/60 p-3">
                        <p className="text-xs font-semibold text-blue-700 mb-1">When overwhelmed</p>
                        <ul className="list-disc list-inside text-xs text-blue-900 space-y-0.5">
                          {r.what_works_overwhelmed.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* do not use */}
                  <div className="rounded-md bg-red-50 border border-red-200 p-3">
                    <h4 className="text-xs font-semibold text-red-700 mb-1">Do NOT use</h4>
                    <ul className="list-disc list-inside text-sm text-red-800 space-y-0.5">
                      {r.do_not_use.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>

                  {/* child voice */}
                  <div className="rounded-md bg-violet-50 border border-violet-200 p-3">
                    <h4 className="text-xs font-semibold text-violet-700 mb-1">Child&apos;s voice</h4>
                    <p className="text-sm italic text-violet-900">&ldquo;{r.child_voice}&rdquo;</p>
                  </div>

                  {/* staff observation */}
                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Staff observation</h4>
                    <p className="text-sm">{r.staff_observation}</p>
                  </div>

                  {/* external support */}
                  {r.external_support && (
                    <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
                      <h4 className="text-xs font-semibold text-emerald-700 mb-1">External support</h4>
                      <p className="text-sm text-emerald-900">{r.external_support}</p>
                    </div>
                  )}

                  {/* smart link panel */}
                  <SmartLinkPanel sourceType="self-soothing-toolkits" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory footer ──────────────────────────────────────── */}
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
        <strong>Trauma-informed practice:</strong> Self-soothing toolkits are grounded in polyvagal theory (Porges) and the
        window of tolerance model (Siegel/Ogden). Strategies are co-produced with each child using Dan Hughes&apos; PACE
        framework — Playfulness, Acceptance, Curiosity, Empathy. Regulation is built through repeated co-regulation
        before children can self-regulate. This supports Children&apos;s Homes Quality Standards 5 (Care &amp; Support)
        and 7 (Positive Relationships), and gives effect to UNCRC Article 12 — the child&apos;s right to be heard in
        decisions affecting them. Toolkits must be reviewed regularly and updated as the child&apos;s needs evolve.
      </div>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Self-Soothing Toolkit — regulation strategies, sensory tools, grounding techniques, breathing exercises, comfort items, co-regulation, trauma-informed approach, behaviour support plan"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
