"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useKeyWorkerEffectivenessIntelligence } from "@/hooks/use-key-worker-effectiveness-intelligence";
import type {
  EffectivenessSignal,
  StaffKeyWorkerProfile,
  KeyChildSnapshot,
} from "@/hooks/use-key-worker-effectiveness-intelligence";

// ── Visual helpers ────────────────────────────────────────────────────────────

const SIGNAL_BADGE: Record<EffectivenessSignal, string> = {
  exemplary:     "bg-emerald-100 text-emerald-800",
  strong:        "bg-blue-100 text-blue-800",
  developing:    "bg-amber-100 text-amber-800",
  needs_support: "bg-red-100 text-red-800",
};

const SIGNAL_LABEL: Record<EffectivenessSignal, string> = {
  exemplary:     "Exemplary",
  strong:        "Strong",
  developing:    "Developing",
  needs_support: "Needs Support",
};

const SIGNAL_BORDER: Record<EffectivenessSignal, string> = {
  exemplary:     "border-emerald-200 bg-emerald-50/30",
  strong:        "border-blue-200 bg-blue-50/30",
  developing:    "border-amber-200 bg-amber-50/40",
  needs_support: "border-red-200 bg-red-50/40",
};

// ── Metric bar ────────────────────────────────────────────────────────────────

function MetricBar({
  label,
  value,
  good,
  warn,
}: {
  label: string;
  value: number | null;
  good: number;
  warn: number;
}) {
  if (value === null) {
    return (
      <div>
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-xs text-gray-600">{label}</span>
          <span className="text-xs font-medium text-gray-400">Not yet measured</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden" />
      </div>
    );
  }
  const colour = meets(value, good) ? "bg-emerald-500" : meets(value, warn) ? "bg-amber-400" : "bg-red-400";
  return (
    <div>
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-xs text-gray-600">{label}</span>
        <span className={`text-xs font-semibold ${meets(value, good) ? "text-emerald-600" : meets(value, warn) ? "text-amber-600" : "text-red-600"}`}>
          {formatRate(value)}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${colour}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ── Key child pill ────────────────────────────────────────────────────────────

function KeyChildPill({ snapshot }: { snapshot: KeyChildSnapshot }) {
  return (
    <div className={`rounded border px-2.5 py-1.5 text-xs ${snapshot.notSeenIn30d ? "border-red-200 bg-red-50" : "border-gray-100 bg-white/70"}`}>
      <p className="font-medium text-gray-700 leading-tight">{snapshot.childName}</p>
      <p className={`mt-0.5 ${snapshot.notSeenIn30d ? "text-red-600 font-medium" : "text-gray-400"}`}>
        {snapshot.notSeenIn30d
          ? `Not seen in 30d${snapshot.daysSinceLastSession != null ? ` (${snapshot.daysSinceLastSession}d ago)` : ""}`
          : `${snapshot.sessionsLast30d} session${snapshot.sessionsLast30d !== 1 ? "s" : ""} (30d)`}
      </p>
    </div>
  );
}

// ── Staff card ────────────────────────────────────────────────────────────────

function StaffCard({ profile }: { profile: StaffKeyWorkerProfile }) {
  return (
    <div className={`rounded-lg border p-4 ${SIGNAL_BORDER[profile.effectivenessSignal]}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{profile.staffName}</p>
          <p className="text-xs text-gray-400 mt-0.5">{profile.jobTitle}</p>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${SIGNAL_BADGE[profile.effectivenessSignal]}`}>
          {SIGNAL_LABEL[profile.effectivenessSignal]}
        </span>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white/70 rounded border border-gray-100 p-2 text-center">
          <p className="text-lg font-bold text-gray-800">{profile.keyChildCount}</p>
          <p className="text-xs text-gray-400">key children</p>
        </div>
        <div className="bg-white/70 rounded border border-gray-100 p-2 text-center">
          <p className="text-lg font-bold text-gray-800">{profile.totalSessionsLast30d}</p>
          <p className="text-xs text-gray-400">sessions (30d)</p>
        </div>
        <div className={`rounded border p-2 text-center ${profile.keyChildrenNotSeen > 0 ? "border-red-200 bg-red-50" : "border-gray-100 bg-white/70"}`}>
          <p className={`text-lg font-bold ${profile.keyChildrenNotSeen > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {profile.keyChildrenNotSeen}
          </p>
          <p className="text-xs text-gray-400">not seen</p>
        </div>
      </div>

      {/* Key children */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {profile.keyChildren.map((c) => (
          <KeyChildPill key={c.childId} snapshot={c} />
        ))}
      </div>

      {/* Metric bars */}
      <div className="space-y-2 mb-3">
        <MetricBar label="Child voice presence" value={profile.childVoicePresenceRate} good={60} warn={30} />
        <MetricBar label="Follow-up completion" value={profile.followUpCompletionRate} good={75} warn={50} />
        <MetricBar label="Mood improvement in sessions" value={profile.moodImprovementRate} good={50} warn={25} />
        <MetricBar label="Therapeutic approach (behaviour)" value={profile.therapeuticApproachRate} good={60} warn={35} />
      </div>

      {/* Supervision prompt */}
      <details open={profile.effectivenessSignal === "needs_support"}>
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

// ── Page ─────────────────────────────────────────────────────────────────────

type Filter = EffectivenessSignal | "all";

export default function KeyWorkerEffectivenessPage() {
  const { data, isLoading, isError } = useKeyWorkerEffectivenessIntelligence();
  const [filter, setFilter] = useState<Filter>("all");

  return (
    <PageShell
      title="Key Worker Effectiveness Intelligence"
      description="A management-support view of each key worker's relational effectiveness with their assigned key children. Tracks session frequency, child voice quality, mood change, and follow-through. Designed to direct supportive supervision — not performance management."
    >
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load key worker effectiveness. Please refresh.
        </div>
      )}

      {data && (() => {
        const { staffProfiles, summary } = data.data;
        const visible = filter === "all" ? staffProfiles : staffProfiles.filter((p) => p.effectivenessSignal === filter);

        return (
          <div className="space-y-6">
            {/* ── Manager note ────────────────────────────────────────────── */}
            <div className={`rounded-lg border p-4 ${
              summary.keyChildrenNotSeenIn30d > 0 ? "border-red-200 bg-red-50"
              : summary.needs_support > 0 ? "border-amber-200 bg-amber-50"
              : "border-emerald-200 bg-emerald-50"
            }`}>
              <p className="text-sm font-medium text-gray-800">{summary.managerNote}</p>
            </div>

            {/* ── Summary tiles ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`rounded-xl border p-4 ${summary.keyChildrenNotSeenIn30d > 0 ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                <p className={`text-2xl font-bold ${summary.keyChildrenNotSeenIn30d > 0 ? "text-red-600" : "text-gray-800"}`}>
                  {summary.keyChildrenNotSeenIn30d}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Children not seen (30d)</p>
              </div>
              <div className={`rounded-xl border p-4 ${
                summary.homeChildVoicePresenceRate === null ? "border-gray-200 bg-gray-50"
                : meets(summary.homeChildVoicePresenceRate, 60) ? "border-violet-200 bg-violet-50"
                : "border-amber-200 bg-amber-50"
              }`}>
                <p className="text-2xl font-bold text-gray-800">{formatRate(summary.homeChildVoicePresenceRate)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Sessions with child voice</p>
              </div>
              <div className={`rounded-xl border p-4 ${
                summary.homeFollowUpCompletionRate === null ? "border-gray-200 bg-gray-50"
                : meets(summary.homeFollowUpCompletionRate, 75) ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
              }`}>
                <p className="text-2xl font-bold text-gray-800">{formatRate(summary.homeFollowUpCompletionRate)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Follow-up completion</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-2xl font-bold text-gray-800">{summary.totalKeyWorkers}</p>
                <p className="text-xs text-gray-500 mt-0.5">Active key workers</p>
              </div>
            </div>

            {/* ── Callout ───────────────────────────────────────────────── */}
            <blockquote className="border-l-4 border-indigo-400 bg-indigo-50 rounded-r-lg px-4 py-3 text-xs text-indigo-900 leading-relaxed italic">
              &ldquo;The quality of the key worker relationship is the single most significant protective factor in a child&rsquo;s residential placement. When that relationship is absent or strained, all other interventions are weakened.&rdquo;
              <br /><span className="not-italic font-medium mt-1 block">— DfE Children&rsquo;s Homes Guidance; DDP Practice Principles</span>
            </blockquote>

            {/* ── Signal legend ─────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              {(["exemplary", "strong", "developing", "needs_support"] as EffectivenessSignal[]).map((sig) => (
                <span key={sig} className={`px-2 py-0.5 rounded-full ${SIGNAL_BADGE[sig]}`}>
                  {SIGNAL_LABEL[sig]} ({summary[sig]})
                </span>
              ))}
            </div>

            {/* ── Metric guide ──────────────────────────────────────────── */}
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 text-xs text-gray-500 leading-relaxed">
              <span className="font-medium text-gray-600">Metric thresholds: </span>
              Child voice ≥60% good · Follow-up completion ≥75% good · Mood improvement ≥50% good · Therapeutic approach ≥60% good
            </div>

            {/* ── Filter chips ──────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2">
              {([
                { key: "all",          label: `All (${summary.totalKeyWorkers})` },
                { key: "needs_support", label: `Needs Support (${summary.needs_support})` },
                { key: "developing",   label: `Developing (${summary.developing})` },
                { key: "strong",       label: `Strong (${summary.strong})` },
                { key: "exemplary",    label: `Exemplary (${summary.exemplary})` },
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

            {/* ── Staff cards ───────────────────────────────────────────── */}
            {visible.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                No key workers in this category.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {visible.map((profile) => (
                  <StaffCard key={profile.staffId} profile={profile} />
                ))}
              </div>
            )}

            {/* ── Accountability note ───────────────────────────────────── */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-3 text-xs text-gray-500 leading-relaxed">
              <span className="font-medium text-gray-600">Professional accountability: </span>
              This view surfaces relational signals from documented sessions and behaviour entries. Key work that happens informally — in the kitchen, on a drive, during activities — may not be captured here. A manager considers this tool alongside their direct knowledge of each staff member before drawing any conclusions.
            </div>
          </div>
        );
      })()}
    </PageShell>
  );
}
