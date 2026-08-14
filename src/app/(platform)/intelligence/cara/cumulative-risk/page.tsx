"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";

import { EmptyState } from "@/components/ui/empty-state";
// ── Types (moved from hook) ───────────────────────────────────────────────────

export type CumulativeSignal = "escalating" | "concerning" | "stable" | "improving";
export type SignalDirection = "worsening" | "stable" | "improving";
export type SupervisionPriority = "urgent" | "this_week" | "monitor" | "none";

export interface RiskSignal {
  id: string;
  label: string;
  direction: SignalDirection;
  recent: number;
  prior: number;
  note: string;
}

export interface ChildCumulativeProfile {
  childId: string;
  childName: string;
  signal: CumulativeSignal;
  worseningSignals: number;
  improvingSignals: number;
  signals: RiskSignal[];
  supervisionPriority: SupervisionPriority;
  supervisionPrompt: string;
  incidentsLast30d: number;
  incidentsLast90d: number;
  missingsLast30d: number;
  highSeverityLast30d: number;
  safeguardingTypeLast30d: number;
}

export interface SignalSummary {
  escalatingCount: number;
  concerningCount: number;
  stableCount: number;
  improvingCount: number;
  urgentSupervisionCount: number;
  mostCommonWorseningSignal: string;
}

export interface CumulativeRiskIntelligenceResponse {
  data: {
    childProfiles: ChildCumulativeProfile[];
    summary: SignalSummary;
  };
}

// ── Visual helpers ────────────────────────────────────────────────────────────

const SIGNAL_BADGE: Record<CumulativeSignal, string> = {
  escalating: "bg-red-100 text-red-800",
  concerning: "bg-amber-100 text-amber-800",
  stable:     "bg-gray-100 text-gray-700",
  improving:  "bg-emerald-100 text-emerald-800",
};

const SIGNAL_LABEL: Record<CumulativeSignal, string> = {
  escalating: "Escalating",
  concerning: "Concerning",
  stable:     "Stable",
  improving:  "Improving",
};

const SIGNAL_BORDER: Record<CumulativeSignal, string> = {
  escalating: "border-red-200 bg-red-50/40",
  concerning: "border-amber-200 bg-amber-50/40",
  stable:     "border-gray-200 bg-white",
  improving:  "border-emerald-200 bg-emerald-50/30",
};

const DIR_ICON: Record<SignalDirection, string> = {
  worsening: "↑",
  stable:    "→",
  improving: "↓",
};

const DIR_COLOUR: Record<SignalDirection, string> = {
  worsening: "text-red-600",
  stable:    "text-gray-400",
  improving: "text-emerald-600",
};

const PRIORITY_BADGE: Record<string, string> = {
  urgent:     "bg-red-600 text-white",
  this_week:  "bg-amber-100 text-amber-800",
  monitor:    "bg-blue-100 text-blue-700",
  none:       "bg-gray-100 text-gray-500",
};

const PRIORITY_LABEL: Record<string, string> = {
  urgent:    "Urgent — this week",
  this_week: "Supervision this week",
  monitor:   "Monitor",
  none:      "Scheduled",
};

// ── Signal row ────────────────────────────────────────────────────────────────

function SignalRow({ signal }: { signal: RiskSignal }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className={`mt-0.5 text-sm font-bold shrink-0 ${DIR_COLOUR[signal.direction]}`}>
        {DIR_ICON[signal.direction]}
      </span>
      <div>
        <p className="text-xs font-medium text-gray-700">{signal.label}</p>
        <p className="text-xs text-gray-500">{signal.note}</p>
      </div>
    </div>
  );
}

// ── Child card ────────────────────────────────────────────────────────────────

function ChildCard({ profile }: { profile: ChildCumulativeProfile }) {
  return (
    <div className={`rounded-lg border p-4 ${SIGNAL_BORDER[profile.signal]}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-0.5">{profile.childName}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[profile.supervisionPriority]}`}>
            {PRIORITY_LABEL[profile.supervisionPriority]}
          </span>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${SIGNAL_BADGE[profile.signal]}`}>
          {SIGNAL_LABEL[profile.signal]}
        </span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white/70 rounded border border-gray-100 p-2 text-center">
          <p className={`text-lg font-bold ${profile.incidentsLast30d >= 3 ? "text-red-600" : profile.incidentsLast30d >= 1 ? "text-amber-600" : "text-gray-500"}`}>
            {profile.incidentsLast30d}
          </p>
          <p className="text-xs text-gray-400">incidents 30d</p>
        </div>
        <div className="bg-white/70 rounded border border-gray-100 p-2 text-center">
          <p className={`text-lg font-bold ${profile.missingsLast30d >= 2 ? "text-red-600" : profile.missingsLast30d === 1 ? "text-amber-600" : "text-gray-500"}`}>
            {profile.missingsLast30d}
          </p>
          <p className="text-xs text-gray-400">missing 30d</p>
        </div>
        <div className="bg-white/70 rounded border border-gray-100 p-2 text-center">
          <p className={`text-lg font-bold ${profile.safeguardingTypeLast30d >= 1 ? "text-red-600" : "text-gray-500"}`}>
            {profile.safeguardingTypeLast30d}
          </p>
          <p className="text-xs text-gray-400">safeguarding 30d</p>
        </div>
      </div>

      {/* Signal rows */}
      <div className="divide-y divide-gray-100 mb-3">
        {profile.signals
          .filter((s) => s.direction !== "stable" || profile.signal === "stable")
          .slice(0, profile.signal === "stable" ? 2 : 10)
          .map((s) => (
            <SignalRow key={s.id} signal={s} />
          ))}
      </div>

      {/* Supervision prompt */}
      {profile.signal !== "stable" && (
        <details open={profile.signal === "escalating"}>
          <summary className="text-xs font-medium text-indigo-700 cursor-pointer list-none hover:underline select-none">
            Supervision prompt ↓
          </summary>
          <p className="mt-2 text-xs text-gray-700 bg-white/70 rounded p-2 leading-relaxed">
            {profile.supervisionPrompt}
          </p>
        </details>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type Filter = "all" | "escalating" | "concerning" | "stable" | "improving";

export default function CumulativeRiskIntelligencePage() {
  const { data, isLoading, isError } = useQuery<CumulativeRiskIntelligenceResponse>({
    queryKey: ["cumulative-risk-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/cumulative-risk-intelligence");
      if (!res.ok) throw new Error("Failed to fetch cumulative risk intelligence");
      return res.json();
    },
    staleTime: 60_000,
  });
  const [filter, setFilter] = useState<Filter>("all");

  return (
    <PageShell
      title="Cumulative Risk Intelligence"
      description="Tracks whether multiple risk signals are converging for each child — incident frequency, severity, missing episodes, relational isolation, and safeguarding-type events. Cara identifies patterns; the manager investigates and acts."
    >
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load cumulative risk intelligence. Please refresh.
        </div>
      )}

      {data && (() => {
        const { childProfiles, summary } = data.data;

        const visible: ChildCumulativeProfile[] =
          filter === "all" ? childProfiles
          : childProfiles.filter((c) => c.signal === filter);

        return (
          <div className="space-y-6">
            {/* ── Urgent banner ─────────────────────────────────────────── */}
            {summary.urgentSupervisionCount > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    {summary.urgentSupervisionCount} child{summary.urgentSupervisionCount > 1 ? "ren" : ""} require urgent supervision discussion
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    {summary.escalatingCount > 0 && `${summary.escalatingCount} escalating signal${summary.escalatingCount > 1 ? "s" : ""} — multiple risk factors converging`}
                  </p>
                </div>
                <div className="shrink-0 text-3xl font-bold text-red-700">{summary.urgentSupervisionCount}</div>
              </div>
            )}

            {/* ── Summary tiles ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`rounded-xl border p-4 ${summary.escalatingCount > 0 ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                <p className="text-2xl font-bold text-gray-800">{summary.escalatingCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">Escalating</p>
              </div>
              <div className={`rounded-xl border p-4 ${summary.concerningCount > 0 ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
                <p className="text-2xl font-bold text-gray-800">{summary.concerningCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">Concerning</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-2xl font-bold text-gray-800">{summary.stableCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">Stable</p>
              </div>
              <div className={`rounded-xl border p-4 ${summary.improvingCount > 0 ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-gray-50"}`}>
                <p className="text-2xl font-bold text-gray-800">{summary.improvingCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">Improving</p>
              </div>
            </div>

            {/* ── Most common worsening signal strip ────────────────────── */}
            {summary.mostCommonWorseningSignal !== "None" && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-3">
                <span className="text-slate-400 text-lg font-bold">↑</span>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Most common worsening signal</p>
                  <p className="text-sm text-slate-600">{summary.mostCommonWorseningSignal}</p>
                </div>
              </div>
            )}

            {/* ── Cumulative harm callout ───────────────────────────────── */}
            <blockquote className="border-l-4 border-orange-400 bg-orange-50 rounded-r-lg px-4 py-3 text-xs text-orange-900 leading-relaxed italic">
              &ldquo;Cumulative harm occurs when multiple risk factors combine over time to produce greater harm than any single factor would alone. Managers and practitioners need to recognise converging signals, not just individual incidents.&rdquo;
              <br /><span className="not-italic font-medium mt-1 block">— Working Together to Safeguard Children (2023)</span>
            </blockquote>

            {/* ── Filter chips ──────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2">
              {([
                { key: "all",        label: `All (${childProfiles.length})` },
                { key: "escalating", label: `Escalating (${summary.escalatingCount})` },
                { key: "concerning", label: `Concerning (${summary.concerningCount})` },
                { key: "stable",     label: `Stable (${summary.stableCount})` },
                { key: "improving",  label: `Improving (${summary.improvingCount})` },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === key
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ── Child cards ───────────────────────────────────────────── */}
            {visible.length === 0 ? (
              <EmptyState compact title="No children in this category." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {visible.map((profile) => (
                  <ChildCard key={profile.childId} profile={profile} />
                ))}
              </div>
            )}

            {/* ── Accountability note ───────────────────────────────────── */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-3 text-xs text-gray-500 leading-relaxed">
              <span className="font-medium text-gray-600">Professional accountability: </span>
              Cumulative risk signal is derived from incident logs, missing episodes, and key work session records in this platform. An escalating signal is a prompt for professional investigation — not a diagnosis of harm. The manager reviews the underlying records, consults with the team and external professionals, and decides whether escalation or additional support is required.
            </div>
          </div>
        );
      })()}
    </PageShell>
  );
}
