"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { meets, formatRate } from "@/lib/metrics/rate";
import { useRepairCycleIntelligence } from "@/hooks/use-repair-cycle-intelligence";
import type {
  CycleStatus,
  RepairStep,
  ChildRepairSummary,
} from "@/hooks/use-repair-cycle-intelligence";

// ── Visual helpers ────────────────────────────────────────────────────────────

const CYCLE_BADGE: Record<CycleStatus, string> = {
  complete: "bg-emerald-100 text-emerald-800",
  partial:  "bg-amber-100 text-amber-800",
  missing:  "bg-red-100 text-red-800",
};

const CYCLE_LABEL: Record<CycleStatus, string> = {
  complete: "Complete",
  partial:  "Partial",
  missing:  "No repair",
};

const CYCLE_BORDER: Record<CycleStatus, string> = {
  complete: "border-emerald-200 bg-emerald-50/30",
  partial:  "border-amber-200 bg-amber-50/40",
  missing:  "border-red-200 bg-red-50/40",
};

const STEP_ICON: Record<string, string> = {
  true:  "✓",
  false: "○",
};

// ── Step checklist ────────────────────────────────────────────────────────────

function StepChecklist({ steps }: { steps: RepairStep[] }) {
  return (
    <div className="space-y-1.5">
      {steps.map((step) => (
        <div key={step.id} className="flex items-start gap-2">
          <span className={`mt-0.5 shrink-0 text-sm font-bold ${step.complete ? "text-emerald-600" : "text-gray-300"}`}>
            {STEP_ICON[String(step.complete)]}
          </span>
          <div>
            <p className={`text-xs font-medium ${step.complete ? "text-gray-700" : "text-gray-500"}`}>{step.label}</p>
            <p className="text-xs text-gray-400">{step.note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Completion bar ────────────────────────────────────────────────────────────

function CompletionBar({ rate }: { rate: number | null }) {
  if (rate === null) {
    return <div className="h-2 bg-gray-100 rounded-full overflow-hidden" />;
  }
  const colour = rate >= 80 ? "bg-emerald-500" : rate >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${colour}`} style={{ width: `${rate}%` }} />
    </div>
  );
}

// ── Child summary card ────────────────────────────────────────────────────────

function ChildCard({ summary }: { summary: ChildRepairSummary }) {
  const overallStatus: CycleStatus =
    meets(summary.cycleCompletionRate, 80) ? "complete"
    : summary.incidentsWithNoRepair > 0 ? "missing"
    : "partial";

  return (
    <div className={`rounded-lg border p-4 ${CYCLE_BORDER[overallStatus]}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-sm font-semibold text-gray-800">{summary.childName}</p>
          <p className="text-xs text-gray-400">{summary.totalIncidents} incident{summary.totalIncidents !== 1 ? "s" : ""} total</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-gray-800">{formatRate(summary.cycleCompletionRate)}</p>
          <p className="text-xs text-gray-400">complete</p>
        </div>
      </div>

      <CompletionBar rate={summary.cycleCompletionRate} />

      <div className="grid grid-cols-3 gap-2 mt-3 mb-3">
        <div className="bg-white/70 rounded border border-gray-100 p-2 text-center">
          <p className="text-sm font-bold text-emerald-600">{summary.incidentsWithCompleteRepair}</p>
          <p className="text-xs text-gray-400">complete</p>
        </div>
        <div className="bg-white/70 rounded border border-gray-100 p-2 text-center">
          <p className="text-sm font-bold text-amber-500">{summary.incidentsWithPartialRepair}</p>
          <p className="text-xs text-gray-400">partial</p>
        </div>
        <div className="bg-white/70 rounded border border-gray-100 p-2 text-center">
          <p className={`text-sm font-bold ${summary.incidentsWithNoRepair > 0 ? "text-red-500" : "text-gray-400"}`}>
            {summary.incidentsWithNoRepair}
          </p>
          <p className="text-xs text-gray-400">missing</p>
        </div>
      </div>

      {summary.mostCommonMissingStep && (
        <p className="text-xs text-gray-500 mb-2">
          Most missed: <span className="font-medium text-gray-700">{summary.mostCommonMissingStep}</span>
        </p>
      )}

      {summary.incidentsWithNoRepair > 0 && (
        <details open>
          <summary className="text-xs font-medium text-indigo-700 cursor-pointer list-none hover:underline select-none">
            Supervision prompt ↓
          </summary>
          <p className="mt-2 text-xs text-gray-700 bg-white/70 rounded p-2 leading-relaxed">
            {summary.supervisionPrompt}
          </p>
        </details>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type View = "children" | "incidents";

export default function RepairCycleIntelligencePage() {
  const { data, isLoading, isError } = useRepairCycleIntelligence();
  const [view, setView] = useState<View>("children");
  const [statusFilter, setStatusFilter] = useState<CycleStatus | "all">("all");

  return (
    <PageShell
      title="Post-Incident Repair Cycle"
      description="Tracks whether the therapeutic repair cycle completes after every incident — debrief, child perspective, lessons learned, changes identified, staff wellbeing support. Grounded in DDP rupture-repair theory."
    >
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load repair cycle intelligence. Please refresh.
        </div>
      )}

      {data && (() => {
        const { incidentProfiles, childSummaries, summary } = data.data;

        const visibleIncidents = statusFilter === "all"
          ? incidentProfiles
          : incidentProfiles.filter((p) => p.cycleStatus === statusFilter);

        const visibleChildren = statusFilter === "all"
          ? childSummaries
          : childSummaries.filter((c) =>
              statusFilter === "missing" ? c.incidentsWithNoRepair > 0
              : statusFilter === "partial" ? c.incidentsWithPartialRepair > 0
              : meets(c.cycleCompletionRate, 80),
            );

        return (
          <div className="space-y-6">
            {/* ── Ofsted note ───────────────────────────────────────────── */}
            <div className={`rounded-lg border p-4 ${
              meets(summary.overallCompletionRate, 80)
                ? "border-emerald-200 bg-emerald-50"
                : summary.overallCompletionRate === null
                  ? "border-gray-200 bg-gray-50"
                  : "border-amber-200 bg-amber-50"
            }`}>
              <p className="text-sm font-medium text-gray-800">{summary.ofstedNote}</p>
            </div>

            {/* ── Summary tiles ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-2xl font-bold text-gray-800">{summary.totalIncidents}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total incidents</p>
              </div>
              <div className={`rounded-xl border p-4 ${summary.incidentsWithDebrief < summary.totalIncidents ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
                <p className="text-2xl font-bold text-gray-800">{summary.incidentsWithDebrief}</p>
                <p className="text-xs text-gray-500 mt-0.5">With debrief</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-2xl font-bold text-gray-800">{summary.avgDebriefTurnaroundDays ?? "—"}</p>
                <p className="text-xs text-gray-500 mt-0.5">Avg. debrief days</p>
              </div>
              <div className={`rounded-xl border p-4 ${meets(summary.overallCompletionRate, 80) ? "border-emerald-200 bg-emerald-50" : summary.overallCompletionRate === null ? "border-gray-200 bg-gray-50" : "border-amber-200 bg-amber-50"}`}>
                <p className="text-2xl font-bold text-gray-800">{formatRate(summary.overallCompletionRate)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Cycle completion</p>
              </div>
            </div>

            {/* ── Most missed step strip ────────────────────────────────── */}
            {summary.mostCommonMissingStep !== "None" && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-3">
                <span className="text-slate-400 text-lg font-bold">○</span>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Most commonly missed repair step</p>
                  <p className="text-sm text-slate-600">{summary.mostCommonMissingStep}</p>
                </div>
              </div>
            )}

            {/* ── DDP callout ───────────────────────────────────────────── */}
            <blockquote className="border-l-4 border-purple-400 bg-purple-50 rounded-r-lg px-4 py-3 text-xs text-purple-900 leading-relaxed italic">
              &ldquo;When rupture happens in any relationship, the opportunity for repair is therapeutic. The repair teaches the child: relationships survive difficulty, adults come back, I matter.&rdquo;
              <br /><span className="not-italic font-medium mt-1 block">— Dan Hughes, Dyadic Developmental Psychotherapy</span>
            </blockquote>

            {/* ── View and filter controls ──────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                <button
                  onClick={() => setView("children")}
                  className={`px-3 py-1.5 transition-colors ${view === "children" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  By child ({childSummaries.length})
                </button>
                <button
                  onClick={() => setView("incidents")}
                  className={`px-3 py-1.5 border-l border-gray-200 transition-colors ${view === "incidents" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  By incident ({incidentProfiles.length})
                </button>
              </div>
              <div className="flex gap-1.5">
                {(["all", "complete", "partial", "missing"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      statusFilter === s
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {s === "all" ? "All" : CYCLE_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Child view ────────────────────────────────────────────── */}
            {view === "children" && (
              visibleChildren.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                  No children in this category.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {visibleChildren.map((cs) => (
                    <ChildCard key={cs.childId} summary={cs} />
                  ))}
                </div>
              )
            )}

            {/* ── Incident view ─────────────────────────────────────────── */}
            {view === "incidents" && (
              visibleIncidents.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                  No incidents in this category.
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleIncidents.map((inc) => (
                    <div key={inc.incidentId} className={`rounded-lg border p-4 ${CYCLE_BORDER[inc.cycleStatus]}`}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-0.5">
                            {inc.incidentType.replace(/_/g, " ")} · {inc.incidentDate}
                          </p>
                          <p className="text-xs text-gray-500">{inc.stepsComplete}/{inc.totalSteps} steps complete</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CYCLE_BADGE[inc.cycleStatus]}`}>
                            {CYCLE_LABEL[inc.cycleStatus]}
                          </span>
                          {inc.debriefTurnaroundDays !== null && (
                            <span className={`text-xs ${inc.debriefTurnaroundDays <= 3 ? "text-emerald-600" : "text-amber-600"}`}>
                              {inc.debriefTurnaroundDays}d to debrief
                            </span>
                          )}
                        </div>
                      </div>
                      <details>
                        <summary className="text-xs text-indigo-700 font-medium cursor-pointer list-none hover:underline select-none mb-2">
                          Repair cycle steps ↓
                        </summary>
                        <StepChecklist steps={inc.steps} />
                        {inc.cycleStatus !== "complete" && (
                          <p className="mt-3 text-xs text-gray-600 bg-white/70 rounded p-2 leading-relaxed">
                            {inc.supervisionPrompt}
                          </p>
                        )}
                      </details>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── Accountability note ───────────────────────────────────── */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-3 text-xs text-gray-500 leading-relaxed">
              <span className="font-medium text-gray-600">Professional accountability: </span>
              Repair cycle completion is detected from debrief records linked to incidents in this platform. A missing debrief in the system does not necessarily mean no debrief occurred — it may not have been recorded yet. The manager verifies, investigates any gaps, and supports the team to complete the cycle.
            </div>
          </div>
        );
      })()}
    </PageShell>
  );
}
