"use client";

import { useQuery } from "@tanstack/react-query";

type RelationshipSignal = "good" | "attention" | "concern";

type StaffInteraction = {
  staffId: string;
  staffName: string;
  role: string;
  recordingCount: number;
  positiveCount: number;
  concerningCount: number;
  isKeyWorker: boolean;
  isSecondaryWorker: boolean;
};

type ChildRelationshipProfile = {
  childId: string;
  childName: string;
  designatedKeyWorkerName: string | null;
  designatedSecondaryWorkerName: string | null;
  totalRecordings: number;
  keyWorkerRecordingPct: number | null;
  keyWorkerRank: number | null;
  staffInteractions: StaffInteraction[];
  signal: RelationshipSignal;
  insight: string;
};

type RelationshipIndexSummary = {
  totalChildren: number;
  childrenAtGood: number;
  childrenAtAttention: number;
  childrenAtConcern: number;
  overallSignal: RelationshipSignal;
};

type StaffChildRelationshipResponse = {
  profiles: ChildRelationshipProfile[];
  summary: RelationshipIndexSummary;
};

async function fetchStaffChildRelationshipIndex(): Promise<StaffChildRelationshipResponse> {
  const res = await fetch("/api/v1/staff-child-relationship-index");
  if (!res.ok) throw new Error("Failed to fetch staff-child relationship index");
  const json = await res.json();
  return json.data as StaffChildRelationshipResponse;
}

function useStaffChildRelationshipIndex() {
  return useQuery({
    queryKey: ["staff-child-relationship-index"],
    queryFn: fetchStaffChildRelationshipIndex,
    staleTime: 120_000,
  });
}

// ── Signal helpers ────────────────────────────────────────────────────────────

type Signal = "good" | "attention" | "concern";

const SIGNAL_STYLES: Record<Signal, string> = {
  good: "bg-green-100 text-green-800 border border-green-200",
  attention: "bg-amber-100 text-amber-800 border border-amber-200",
  concern: "bg-red-100 text-red-800 border border-red-200",
};

const SIGNAL_LABELS: Record<Signal, string> = {
  good: "Good",
  attention: "Attention",
  concern: "Concern",
};

function SignalBadge({ signal }: { signal: Signal }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${SIGNAL_STYLES[signal]}`}
    >
      {SIGNAL_LABELS[signal]}
    </span>
  );
}

// ── Interaction bar ───────────────────────────────────────────────────────────

function InteractionBar({
  interaction,
  totalRecordings,
  rank,
}: {
  interaction: StaffInteraction;
  totalRecordings: number;
  rank: number;
}) {
  const pct =
    totalRecordings > 0
      ? Math.round((interaction.recordingCount / totalRecordings) * 100)
      : 0;

  const barColour = interaction.isKeyWorker
    ? "bg-indigo-500"
    : interaction.isSecondaryWorker
    ? "bg-slate-400"
    : "bg-slate-300";

  return (
    <div className="flex items-center gap-3">
      <div className="w-5 text-xs text-slate-400 text-right shrink-0">
        #{rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm text-slate-800 truncate font-medium">
              {interaction.staffName}
            </span>
            {interaction.isKeyWorker && (
              <span className="text-xs text-indigo-600 font-semibold shrink-0">
                KW
              </span>
            )}
            {interaction.isSecondaryWorker && (
              <span className="text-xs text-slate-500 shrink-0">2nd</span>
            )}
          </div>
          <span className="text-xs text-slate-500 shrink-0 ml-2">
            {interaction.recordingCount} ({pct}%)
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-2 rounded-full ${barColour}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex gap-2 mt-0.5">
          <span className="text-xs text-green-600">
            +{interaction.positiveCount} positive
          </span>
          {interaction.concerningCount > 0 && (
            <span className="text-xs text-orange-600">
              {interaction.concerningCount} concerning
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Child card ────────────────────────────────────────────────────────────────

function ChildRelationshipCard({
  profile,
}: {
  profile: ChildRelationshipProfile;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900 text-base">
            {profile.childName}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-slate-500">
            {profile.designatedKeyWorkerName && (
              <span>
                KW: <span className="font-medium text-slate-700">{profile.designatedKeyWorkerName}</span>
              </span>
            )}
            {profile.designatedSecondaryWorkerName && (
              <>
                <span className="text-slate-300">·</span>
                <span>
                  2nd: <span className="font-medium text-slate-700">{profile.designatedSecondaryWorkerName}</span>
                </span>
              </>
            )}
          </div>
        </div>
        <SignalBadge signal={profile.signal as Signal} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold text-slate-800">
            {profile.totalRecordings}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Total recordings</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p
            className={`text-2xl font-bold ${
              profile.keyWorkerRank === 1
                ? "text-green-700"
                : profile.keyWorkerRank === null
                ? "text-slate-400"
                : "text-amber-700"
            }`}
          >
            {profile.keyWorkerRank !== null ? `#${profile.keyWorkerRank}` : "—"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">KW rank</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p
            className={`text-2xl font-bold ${
              (profile.keyWorkerRecordingPct ?? 0) >= 30
                ? "text-green-700"
                : (profile.keyWorkerRecordingPct ?? 0) >= 15
                ? "text-amber-700"
                : "text-red-700"
            }`}
          >
            {profile.keyWorkerRecordingPct !== null
              ? `${Math.round(profile.keyWorkerRecordingPct)}%`
              : "0%"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">KW share</p>
        </div>
      </div>

      {/* Insight */}
      <p className="text-sm text-slate-700 italic bg-white border border-slate-200 rounded-xl px-4 py-3">
        {profile.insight}
      </p>

      {/* Interaction bars */}
      {profile.staffInteractions.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Recording distribution
          </h4>
          <div className="flex flex-col gap-2.5">
            {profile.staffInteractions.map((interaction, idx) => (
              <InteractionBar
                key={interaction.staffId}
                interaction={interaction}
                totalRecordings={profile.totalRecordings}
                rank={idx + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StaffChildRelationshipIndexPage() {
  const { data, isLoading, error } = useStaffChildRelationshipIndex();

  if (isLoading) {
    return (
      <div className="p-8 text-slate-500 text-sm">
        Loading staff-child relationship index…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-red-600 text-sm">
        Unable to load staff-child relationship index.
      </div>
    );
  }

  const { profiles, summary } = data;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Staff-Child Relationship Index
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Maps who is actually recording interactions with each child to
            surface key-worker presence and distribution of relational contact.
          </p>
        </div>
        <SignalBadge signal={summary.overallSignal as Signal} />
      </div>

      {/* Regulatory callout */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 space-y-1">
        <p className="font-semibold">CHR 2015 Reg 16 — Key worker</p>
        <p>
          Reg 16 requires that each child has a designated key worker who
          maintains a meaningful, consistent relationship with them. SCCIF
          expects children to have a trusted adult they can turn to. This index
          uses behaviour recording data as a proxy for visible relational
          contact — low key-worker recording share may indicate a key-working
          gap or an evidence gap that should be explored in supervision.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className={`rounded-xl border p-4 text-center shadow-sm ${
            summary.childrenAtConcern > 0
              ? "border-red-200 bg-red-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <p
            className={`text-3xl font-bold ${
              summary.childrenAtConcern > 0 ? "text-red-700" : "text-slate-800"
            }`}
          >
            {summary.childrenAtConcern}
          </p>
          <p className="text-xs text-slate-500 mt-1">Concern</p>
        </div>
        <div
          className={`rounded-xl border p-4 text-center shadow-sm ${
            summary.childrenAtAttention > 0
              ? "border-amber-200 bg-amber-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <p
            className={`text-3xl font-bold ${
              summary.childrenAtAttention > 0
                ? "text-amber-700"
                : "text-slate-800"
            }`}
          >
            {summary.childrenAtAttention}
          </p>
          <p className="text-xs text-slate-500 mt-1">Attention</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-green-700">
            {summary.childrenAtGood}
          </p>
          <p className="text-xs text-slate-500 mt-1">Good</p>
        </div>
      </div>

      {/* Child profiles */}
      <div className="flex flex-col gap-6">
        {profiles.map((profile) => (
          <ChildRelationshipCard key={profile.childId} profile={profile} />
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-sm">
          No children found in current placement.
        </div>
      )}
    </div>
  );
}
