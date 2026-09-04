"use client";

import { formatRate } from "@/lib/metrics/rate";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";

import { EmptyState } from "@/components/ui/empty-state";
type ApproachType = "therapeutic" | "boundary" | "physical" | "undocumented";
type ConsistencyLevel = "consistent" | "mixed" | "divergent";

interface StaffApproachProfile {
  staffId: string;
  staffName: string;
  totalEntries: number;
  therapeuticCount: number;
  boundaryCount: number;
  physicalCount: number;
  undocumentedCount: number;
  therapeuticRate: number;
  dominantApproach: ApproachType;
}

interface ChildConsistencyProfile {
  childId: string;
  childName: string;
  totalEntries: number;
  staffProfiles: StaffApproachProfile[];
  consistencyLevel: ConsistencyLevel;
  overallTherapeuticRate: number;
  therapeuticRateVariance: number;
  mostTherapeuticStaff: string | null;
  leastTherapeuticStaff: string | null;
  supervisionPrompt: string;
}

interface ApproachSummary {
  totalChildren: number;
  consistentCount: number;
  mixedCount: number;
  divergentCount: number;
  overallTherapeuticRate: number;
  mostCommonDivergencePattern: string;
}

interface TeamApproachConsistencyResponse {
  data: {
    childProfiles: ChildConsistencyProfile[];
    summary: ApproachSummary;
  };
}

function useTeamApproachConsistency() {
  return useQuery<TeamApproachConsistencyResponse>({
    queryKey: ["team-approach-consistency"],
    queryFn: async () => {
      const res = await fetch("/api/v1/team-approach-consistency");
      if (!res.ok) throw new Error("Failed to fetch team approach consistency");
      return res.json();
    },
    staleTime: 120_000,
  });
}

// ── Visual helpers ────────────────────────────────────────────────────────────

const LEVEL_BADGE: Record<ConsistencyLevel, string> = {
  consistent: "bg-emerald-100 text-emerald-800",
  mixed:      "bg-amber-100 text-amber-800",
  divergent:  "bg-red-100 text-red-800",
};

const LEVEL_LABEL: Record<ConsistencyLevel, string> = {
  consistent: "Consistent",
  mixed:      "Mixed",
  divergent:  "Divergent",
};

const LEVEL_BORDER: Record<ConsistencyLevel, string> = {
  consistent: "border-emerald-200 bg-emerald-50/30",
  mixed:      "border-amber-200 bg-amber-50/40",
  divergent:  "border-red-200 bg-red-50/40",
};

const APPROACH_COLOUR: Record<ApproachType, string> = {
  therapeutic:   "bg-emerald-400",
  boundary:      "bg-amber-400",
  physical:      "bg-red-400",
  undocumented:  "bg-gray-200",
};

const APPROACH_LABEL: Record<ApproachType, string> = {
  therapeutic:   "Therapeutic",
  boundary:      "Boundary",
  physical:      "Physical",
  undocumented:  "Not documented",
};

// ── Staff approach bar ────────────────────────────────────────────────────────

function StaffApproachBar({ profile }: { profile: StaffApproachProfile }) {
  const total = profile.totalEntries;
  if (total === 0) return null;

  const segments = ([
    { type: "therapeutic" as ApproachType,  count: profile.therapeuticCount },
    { type: "boundary" as ApproachType,     count: profile.boundaryCount },
    { type: "physical" as ApproachType,     count: profile.physicalCount },
    { type: "undocumented" as ApproachType, count: profile.undocumentedCount },
  ] as const).filter((s) => s.count > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-gray-700 truncate max-w-[120px]">{profile.staffName}</p>
        <span className={`text-xs font-semibold ${profile.therapeuticRate >= 60 ? "text-emerald-600" : profile.therapeuticRate >= 30 ? "text-amber-600" : "text-red-500"}`}>
          {formatRate(profile.therapeuticRate)} therapeutic
        </span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
        {segments.map((s) => (
          <div
            key={s.type}
            title={`${APPROACH_LABEL[s.type]}: ${s.count}`}
            className={`h-full ${APPROACH_COLOUR[s.type]}`}
            style={{ width: `${(s.count / total) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Child card ────────────────────────────────────────────────────────────────

function ChildCard({ profile }: { profile: ChildConsistencyProfile }) {
  return (
    <div className={`rounded-lg border p-4 ${LEVEL_BORDER[profile.consistencyLevel]}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-0.5">{profile.childName}</p>
          <p className="text-xs text-gray-400">{profile.totalEntries} behaviour entries · {profile.staffProfiles.length} staff</p>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${LEVEL_BADGE[profile.consistencyLevel]}`}>
            {LEVEL_LABEL[profile.consistencyLevel]}
          </span>
          {profile.therapeuticRateVariance > 0 && profile.staffProfiles.length > 1 && (
            <p className="text-xs text-gray-400 mt-1">{profile.therapeuticRateVariance}pt variance</p>
          )}
        </div>
      </div>

      {/* Staff approach bars */}
      <div className="space-y-2.5 mb-3">
        {profile.staffProfiles.map((sp) => (
          <StaffApproachBar key={sp.staffId} profile={sp} />
        ))}
      </div>

      {/* Overall rate */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${profile.overallTherapeuticRate >= 60 ? "bg-emerald-500" : profile.overallTherapeuticRate >= 30 ? "bg-amber-400" : "bg-red-400"}`}
            style={{ width: `${formatRate(profile.overallTherapeuticRate)}` }}
          />
        </div>
        <p className="text-xs font-semibold text-gray-600 shrink-0">{formatRate(profile.overallTherapeuticRate)} overall</p>
      </div>

      {/* Supervision prompt */}
      {profile.consistencyLevel !== "consistent" && (
        <details open={profile.consistencyLevel === "divergent"}>
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

type Filter = ConsistencyLevel | "all";

export default function TeamApproachConsistencyPage() {
  const { data, isLoading, isError } = useTeamApproachConsistency();
  const [filter, setFilter] = useState<Filter>("all");

  return (
    <PageShell
      title="Team Approach Consistency"
      description="Analyses how consistently different staff members use therapeutic approaches with each child. Detects divergence — where one staff member's approach differs significantly from colleagues — which can recreate unpredictability for children."
    >
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load team approach consistency. Please refresh.
        </div>
      )}

      {data && (() => {
        const { childProfiles, summary } = data.data;
        const visible = filter === "all" ? childProfiles : childProfiles.filter((c) => c.consistencyLevel === filter);

        return (
          <div className="space-y-6">
            {/* ── Summary tiles ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`rounded-xl border p-4 ${summary.overallTherapeuticRate >= 60 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                <p className="text-2xl font-bold text-gray-800">{formatRate(summary.overallTherapeuticRate)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Overall therapeutic rate</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-2xl font-bold text-gray-800">{summary.consistentCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">Consistent approach</p>
              </div>
              <div className={`rounded-xl border p-4 ${summary.mixedCount > 0 ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
                <p className="text-2xl font-bold text-gray-800">{summary.mixedCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">Mixed approach</p>
              </div>
              <div className={`rounded-xl border p-4 ${summary.divergentCount > 0 ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                <p className="text-2xl font-bold text-gray-800">{summary.divergentCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">Divergent approach</p>
              </div>
            </div>

            {/* ── Divergence pattern strip ──────────────────────────────── */}
            {summary.divergentCount > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs font-semibold text-red-700 mb-0.5">Divergence pattern detected</p>
                <p className="text-xs text-red-600">{summary.mostCommonDivergencePattern}</p>
              </div>
            )}

            {/* ── Legend ───────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              {(["therapeutic", "boundary", "physical", "undocumented"] as ApproachType[]).map((type) => (
                <span key={type} className="flex items-center gap-1.5">
                  <span className={`h-3 w-3 rounded-sm ${APPROACH_COLOUR[type]}`} />
                  {APPROACH_LABEL[type]}
                </span>
              ))}
            </div>

            {/* ── Practice callout ──────────────────────────────────────── */}
            <blockquote className="border-l-4 border-teal-400 bg-teal-50 rounded-r-lg px-4 py-3 text-xs text-teal-900 leading-relaxed italic">
              &ldquo;Children in residential care need a consistent therapeutic environment. Inconsistency in staff approach recreates the unpredictability that caused harm in the first place. Consistency is itself the therapy.&rdquo;
              <br /><span className="not-italic font-medium mt-1 block">— Good Care Guide; 21 Skills for Residential Workers</span>
            </blockquote>

            {/* ── Filter chips ──────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2">
              {([
                { key: "all",        label: `All (${summary.totalChildren})` },
                { key: "divergent",  label: `Divergent (${summary.divergentCount})` },
                { key: "mixed",      label: `Mixed (${summary.mixedCount})` },
                { key: "consistent", label: `Consistent (${summary.consistentCount})` },
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

            {/* ── Child cards ───────────────────────────────────────────── */}
            {childProfiles.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                No behaviour log entries found. As staff record entries, Cara will build the approach consistency picture here.
              </div>
            ) : visible.length === 0 ? (
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
              Approach classification is based on keyword detection in behaviour log strategy fields. A &quot;boundary&quot; or &quot;physical&quot; classification does not mean the intervention was wrong — context matters. The manager uses this as a prompt for professional conversation about consistency, not as a performance judgement. Some variation across staff is normal and healthy; significant divergence warrants exploration.
            </div>
          </div>
        );
      })()}
    </PageShell>
  );
}
