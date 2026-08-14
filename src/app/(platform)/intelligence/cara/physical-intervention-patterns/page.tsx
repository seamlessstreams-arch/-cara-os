"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import type {
  ChildPISignal,
  PITrend,
  ChildPIProfile,
  StaffPIProfile,
  PhysicalInterventionPatternResponse,
} from "@/app/api/v1/physical-intervention-pattern-intelligence/route";

import { EmptyState } from "@/components/ui/empty-state";
// ── Visual helpers ────────────────────────────────────────────────────────────

const SIGNAL_BADGE: Record<ChildPISignal, string> = {
  concerning: "bg-red-100 text-red-800",
  monitoring: "bg-amber-100 text-amber-800",
  stable:     "bg-gray-100 text-gray-700",
  improving:  "bg-emerald-100 text-emerald-800",
};

const SIGNAL_LABEL: Record<ChildPISignal, string> = {
  concerning: "Concerning",
  monitoring: "Monitoring",
  stable:     "Stable",
  improving:  "Improving",
};

const SIGNAL_BORDER: Record<ChildPISignal, string> = {
  concerning: "border-red-200 bg-red-50/40",
  monitoring: "border-amber-200 bg-amber-50/40",
  stable:     "border-gray-200 bg-gray-50/20",
  improving:  "border-emerald-200 bg-emerald-50/30",
};

const TREND_ICON: Record<PITrend, string> = {
  increasing: "↑",
  stable: "→",
  decreasing: "↓",
};

const TREND_COLOUR: Record<PITrend, string> = {
  increasing: "text-red-500",
  stable:     "text-gray-400",
  decreasing: "text-emerald-600",
};

// ── Metric bar ────────────────────────────────────────────────────────────────

function MetricBar({ label, value, good, warn }: { label: string; value: number | null; good: number; warn: number }) {
  if (value === null) {
    return (
      <div>
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-xs text-gray-600">{label}</span>
          <span className="text-xs font-semibold text-gray-400">—</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden" />
      </div>
    );
  }
  const colour = value >= good ? "bg-emerald-500" : value >= warn ? "bg-amber-400" : "bg-red-400";
  return (
    <div>
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-xs text-gray-600">{label}</span>
        <span className={`text-xs font-semibold ${value >= good ? "text-emerald-600" : value >= warn ? "text-amber-600" : "text-red-600"}`}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${colour}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ── Child card ────────────────────────────────────────────────────────────────

function ChildCard({ profile }: { profile: ChildPIProfile }) {
  if (profile.totalRestraints === 0) {
    return (
      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-800">{profile.childName}</p>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">No PIs recorded</span>
        </div>
        <p className="text-xs text-gray-500">No physical interventions recorded for this child.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${SIGNAL_BORDER[profile.signal]}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{profile.childName}</p>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
            <span>{profile.totalRestraints} total</span>
            <span className={`font-semibold ${TREND_COLOUR[profile.trend]}`}>
              {TREND_ICON[profile.trend]} {profile.trend}
            </span>
          </div>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${SIGNAL_BADGE[profile.signal]}`}>
          {SIGNAL_LABEL[profile.signal]}
        </span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        <div className="bg-white/70 rounded border border-gray-100 p-1.5 text-center">
          <p className={`text-base font-bold ${profile.last30d >= 2 ? "text-red-500" : "text-gray-700"}`}>{profile.last30d}</p>
          <p className="text-xs text-gray-400">30d</p>
        </div>
        <div className="bg-white/70 rounded border border-gray-100 p-1.5 text-center">
          <p className="text-base font-bold text-gray-700">{profile.avgDurationMinutes}m</p>
          <p className="text-xs text-gray-400">avg dur.</p>
        </div>
        <div className={`rounded border p-1.5 text-center ${profile.injuryCount > 0 ? "border-red-200 bg-red-50" : "border-gray-100 bg-white/70"}`}>
          <p className={`text-base font-bold ${profile.injuryCount > 0 ? "text-red-600" : "text-gray-400"}`}>{profile.injuryCount}</p>
          <p className="text-xs text-gray-400">injuries</p>
        </div>
        <div className={`rounded border p-1.5 text-center ${profile.pendingReviewCount > 0 ? "border-amber-200 bg-amber-50" : "border-gray-100 bg-white/70"}`}>
          <p className={`text-base font-bold ${profile.pendingReviewCount > 0 ? "text-amber-600" : "text-gray-400"}`}>{profile.pendingReviewCount}</p>
          <p className="text-xs text-gray-400">pending review</p>
        </div>
      </div>

      {/* Metric bars */}
      <div className="space-y-1.5 mb-3">
        <MetricBar label="De-escalation documented" value={profile.deEscalationRate} good={80} warn={50} />
        <MetricBar label="Child debrief completed" value={profile.debriefRate} good={90} warn={60} />
        <MetricBar label="Staff debrief completed" value={profile.staffDebriefRate} good={90} warn={60} />
      </div>

      {/* Antecedents */}
      {profile.recentAntecedents.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Recent antecedents:</p>
          <div className="space-y-0.5">
            {profile.recentAntecedents.map((a, i) => (
              <p key={i} className="text-xs text-gray-600 pl-2 border-l-2 border-gray-200">{a}</p>
            ))}
          </div>
        </div>
      )}

      {/* Supervision prompt */}
      <details open={profile.signal === "concerning"}>
        <summary className="text-xs font-medium text-indigo-700 cursor-pointer list-none hover:underline select-none">
          Supervision prompt ↓
        </summary>
        <p className="mt-2 text-xs text-gray-700 bg-white/70 rounded p-2 leading-relaxed">
          {profile.supervisionPrompt}
        </p>
      </details>
    </div>
  );
}

// ── Staff card ────────────────────────────────────────────────────────────────

function StaffCard({ profile }: { profile: StaffPIProfile }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white/60 p-3">
      <p className="text-sm font-semibold text-gray-800 mb-1">{profile.staffName}</p>
      <div className="flex gap-3 text-xs text-gray-600 mb-2">
        <span><span className="font-medium text-red-600">{profile.leadCount}</span> lead</span>
        <span><span className="font-medium text-gray-500">{profile.supportCount}</span> support</span>
        <span className="font-medium">{profile.totalInvolvements} total</span>
      </div>
      {profile.leadCount > 0 && (
        <div>
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-xs text-gray-500">De-escalation (on leads)</span>
            <span className={`text-xs font-semibold ${(profile.deEscalationRateOnLeads ?? 0) >= 80 ? "text-emerald-600" : (profile.deEscalationRateOnLeads ?? 0) >= 50 ? "text-amber-600" : "text-red-600"}`}>
              {profile.deEscalationRateOnLeads}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${(profile.deEscalationRateOnLeads ?? 0) >= 80 ? "bg-emerald-500" : (profile.deEscalationRateOnLeads ?? 0) >= 50 ? "bg-amber-400" : "bg-red-400"}`}
              style={{ width: `${profile.deEscalationRateOnLeads}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type ViewMode = "children" | "staff";
type Filter = ChildPISignal | "all";

export default function PhysicalInterventionPatternsPage() {
  const { data, isLoading, isError } = useQuery<PhysicalInterventionPatternResponse>({
    queryKey: ["physical-intervention-pattern-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/physical-intervention-pattern-intelligence");
      if (!res.ok) throw new Error("Failed to fetch physical intervention pattern intelligence");
      return res.json();
    },
    staleTime: 120_000,
  });
  const [viewMode, setViewMode] = useState<ViewMode>("children");
  const [filter, setFilter] = useState<Filter>("all");

  return (
    <PageShell
      title="Physical Intervention Pattern Intelligence"
      description="Tracks per-child restraint frequency trends, antecedent patterns, de-escalation documentation, debrief completion, and pending manager reviews. Supports the regulatory expectation that restraint is reducing and rigorously reviewed."
    >
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load physical intervention data. Please refresh.
        </div>
      )}

      {data && (() => {
        const { childProfiles, staffProfiles, summary } = data.data;
        const visible = filter === "all"
          ? childProfiles
          : childProfiles.filter((c) => c.signal === filter);

        return (
          <div className="space-y-6">
            {/* ── Ofsted note ──────────────────────────────────────────── */}
            <div className={`rounded-lg border p-4 ${
              summary.homeTrend === "increasing" || summary.pendingReviews > 0 || summary.totalInjuries > 0
                ? "border-red-200 bg-red-50"
                : summary.homeTrend === "decreasing" ? "border-emerald-200 bg-emerald-50"
                : "border-gray-200 bg-gray-50"
            }`}>
              <p className="text-sm font-medium text-gray-800">{summary.ofstedNote}</p>
            </div>

            {/* ── Summary tiles ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`rounded-xl border p-4 ${summary.homeTrend === "increasing" ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-gray-800">{summary.totalLast30d}</p>
                  <span className={`text-sm font-bold ${TREND_COLOUR[summary.homeTrend]}`}>
                    {TREND_ICON[summary.homeTrend]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">PIs (last 30 days)</p>
              </div>
              <div className={`rounded-xl border p-4 ${summary.pendingReviews > 0 ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
                <p className={`text-2xl font-bold ${summary.pendingReviews > 0 ? "text-amber-600" : "text-gray-800"}`}>
                  {summary.pendingReviews}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Pending manager review</p>
              </div>
              <div className={`rounded-xl border p-4 ${summary.totalInjuries > 0 ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                <p className={`text-2xl font-bold ${summary.totalInjuries > 0 ? "text-red-600" : "text-gray-800"}`}>
                  {summary.totalInjuries}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Injuries recorded</p>
              </div>
              <div className={`rounded-xl border p-4 ${(summary.avgDurationMinutes ?? 0) > 5 ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
                <p className="text-2xl font-bold text-gray-800">{summary.avgDurationMinutes}m</p>
                <p className="text-xs text-gray-500 mt-0.5">Average PI duration</p>
              </div>
            </div>

            {/* ── Antecedent breakdown ──────────────────────────────────── */}
            {summary.commonAntecedents.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Most common antecedent patterns:</p>
                <div className="flex flex-wrap gap-2">
                  {summary.commonAntecedents.map((a) => (
                    <span key={a.antecedent} className="rounded-full px-3 py-1 bg-white border border-gray-200 text-xs text-gray-700">
                      {a.antecedent} <span className="font-semibold text-gray-500">({a.count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Callout ───────────────────────────────────────────────── */}
            <blockquote className="border-l-4 border-rose-400 bg-rose-50 rounded-r-lg px-4 py-3 text-xs text-rose-900 leading-relaxed italic">
              &ldquo;Physical intervention should always be a last resort. A reducing restraint rate is a sign of a therapeutic culture. Every restraint that does happen must be reviewed, and the child and staff must be supported afterwards.&rdquo;
              <br /><span className="not-italic font-medium mt-1 block">— Regulation 18; Children&rsquo;s Homes Regulations 2015; Positive Environments (DfE)</span>
            </blockquote>

            {/* ── View toggle ───────────────────────────────────────────── */}
            <div className="flex gap-2">
              {(["children", "staff"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                    viewMode === mode ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {mode === "children" ? "By child" : "By staff involvement"}
                </button>
              ))}
            </div>

            {viewMode === "children" && (
              <>
                {/* Filter chips */}
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: "all",       label: `All (${childProfiles.length})` },
                    { key: "concerning", label: `Concerning (${childProfiles.filter((c) => c.signal === "concerning").length})` },
                    { key: "monitoring", label: `Monitoring (${childProfiles.filter((c) => c.signal === "monitoring").length})` },
                    { key: "stable",    label: `Stable (${childProfiles.filter((c) => c.signal === "stable").length})` },
                    { key: "improving", label: `Improving (${childProfiles.filter((c) => c.signal === "improving").length})` },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        filter === key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {visible.length === 0 ? (
                  <EmptyState compact title="No children in this category." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {visible.map((p) => <ChildCard key={p.childId} profile={p} />)}
                  </div>
                )}
              </>
            )}

            {viewMode === "staff" && (
              <>
                {staffProfiles.length === 0 ? (
                  <EmptyState compact title="No staff involvement data recorded." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {staffProfiles.map((p) => <StaffCard key={p.staffId} profile={p} />)}
                  </div>
                )}
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-3 text-xs text-gray-500 leading-relaxed">
                  <span className="font-medium text-gray-600">Important: </span>
                  High involvement counts do not indicate poor practice — some staff work longer hours or are deployed to higher-needs shifts. This view surfaces patterns for reflective supervision, not performance judgements.
                </div>
              </>
            )}

            {/* ── Accountability note ───────────────────────────────────── */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-3 text-xs text-gray-500 leading-relaxed">
              <span className="font-medium text-gray-600">Professional accountability: </span>
              This data reflects restraint records entered in the system. The manager reviews each record independently, ensures all notifications were sent, and uses this view to identify patterns — not to apportion blame. Every PI record should be reviewed, every child should be debriefed, and every staff member should receive post-incident support.
            </div>
          </div>
        );
      })()}
    </PageShell>
  );
}
