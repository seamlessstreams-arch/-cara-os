"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";

// ── Types ─────────────────────────────────────────────────────────────────────

type RelationalStatus = "secure" | "developing" | "fragile";
type KeyWorkFrequency = "regular" | "intermittent" | "absent";

interface StaffSnapshot {
  id: string;
  fullName: string;
  jobTitle: string;
}

interface ChildRelationalProfile {
  childId: string;
  childName: string;
  placementStatus: string;
  keyWorkerAssigned: boolean;
  keyWorker: StaffSnapshot | null;
  secondaryWorker: StaffSnapshot | null;
  totalKeyWorkSessions: number;
  sessionsLast30d: number;
  sessionsLast90d: number;
  lastKeyWorkDate: string | null;
  keyWorkFrequency: KeyWorkFrequency;
  keyWorkStaffIds: string[];
  hasPaceProfile: boolean;
  trustedAdultCount: number;
  trustedAdults: string[];
  incidentsLast30d: number;
  incidentsLast90d: number;
  status: RelationalStatus;
  statusReason: string;
  supervisionPrompt: string;
}

interface RelationalSafetyMapSummary {
  totalChildren: number;
  secureCount: number;
  developingCount: number;
  fragileCount: number;
  noKeyWorkerAssigned: number;
  noKeyWorkLast30d: number;
  noPaceProfile: number;
  fragileWithElevatedIncidents: number;
  overallStatus: "positive" | "mixed" | "concern";
}

interface RelationalSafetyMapResponse {
  data: {
    childProfiles: ChildRelationalProfile[];
    summary: RelationalSafetyMapSummary;
  };
}

// ── Visual constants ──────────────────────────────────────────────────────────

const STATUS_BADGE: Record<RelationalStatus, string> = {
  secure:     "bg-emerald-100 text-emerald-800",
  developing: "bg-amber-100 text-amber-800",
  fragile:    "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<RelationalStatus, string> = {
  secure:     "Secure",
  developing: "Developing",
  fragile:    "Fragile",
};

const STATUS_BORDER: Record<RelationalStatus, string> = {
  secure:     "border-emerald-200 bg-emerald-50/40",
  developing: "border-amber-200 bg-amber-50/40",
  fragile:    "border-red-200 bg-red-50/40",
};

const FREQ_LABEL: Record<KeyWorkFrequency, string> = {
  regular:      "Regular",
  intermittent: "Intermittent",
  absent:       "No recent sessions",
};

const FREQ_COLOUR: Record<KeyWorkFrequency, string> = {
  regular:      "text-emerald-700",
  intermittent: "text-amber-700",
  absent:       "text-red-700",
};

// ── Child card ────────────────────────────────────────────────────────────────

function ChildCard({ profile }: { profile: ChildRelationalProfile }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-lg border p-4 ${STATUS_BORDER[profile.status]}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-gray-800">{profile.childName}</p>
            {profile.incidentsLast30d >= 2 && profile.status === "fragile" && (
              <span className="text-xs bg-red-200 text-red-800 font-semibold px-1.5 py-0.5 rounded">
                Elevated incidents
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{profile.statusReason}</p>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${STATUS_BADGE[profile.status]}`}>
          {STATUS_LABEL[profile.status]}
        </span>
      </div>

      {/* Three pillars */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Key worker */}
        <div className="rounded bg-white/70 border border-gray-100 p-2 text-center">
          <p className="text-xs font-medium text-gray-500 mb-0.5">Key Worker</p>
          {profile.keyWorker ? (
            <>
              <p className="text-xs font-semibold text-gray-800 truncate">{profile.keyWorker.fullName}</p>
              <p className="text-xs text-gray-400 truncate">{profile.keyWorker.jobTitle}</p>
            </>
          ) : (
            <p className="text-xs text-red-500 font-medium">Not assigned</p>
          )}
        </div>

        {/* Key work sessions */}
        <div className="rounded bg-white/70 border border-gray-100 p-2 text-center">
          <p className="text-xs font-medium text-gray-500 mb-0.5">Key Work (30d)</p>
          <p className={`text-sm font-bold ${profile.sessionsLast30d >= 2 ? "text-emerald-600" : profile.sessionsLast30d === 0 ? "text-red-500" : "text-amber-600"}`}>
            {profile.sessionsLast30d}
          </p>
          <p className={`text-xs ${FREQ_COLOUR[profile.keyWorkFrequency]}`}>
            {FREQ_LABEL[profile.keyWorkFrequency]}
          </p>
        </div>

        {/* Trusted adults */}
        <div className="rounded bg-white/70 border border-gray-100 p-2 text-center">
          <p className="text-xs font-medium text-gray-500 mb-0.5">Trusted Adults</p>
          <p className={`text-sm font-bold ${profile.trustedAdultCount >= 1 ? "text-emerald-600" : "text-red-500"}`}>
            {profile.trustedAdultCount}
          </p>
          <p className="text-xs text-gray-400">in PACE profile</p>
        </div>
      </div>

      {/* Incidents strip */}
      {profile.incidentsLast30d > 0 && (
        <div className="mb-3 rounded bg-red-50 border border-red-100 px-3 py-1.5 flex items-center justify-between">
          <span className="text-xs text-red-700">{profile.incidentsLast30d} incident{profile.incidentsLast30d > 1 ? "s" : ""} in last 30 days</span>
          <span className="text-xs text-red-500">{profile.incidentsLast90d} in 90d</span>
        </div>
      )}

      {/* Supervision prompt */}
      <details open={profile.status === "fragile"} onToggle={() => setExpanded(!expanded)}>
        <summary className="text-xs font-medium text-indigo-700 cursor-pointer list-none hover:underline select-none">
          Supervision prompt ↓
        </summary>
        <p className="mt-2 text-xs text-gray-700 bg-white/70 rounded p-2 leading-relaxed">
          {profile.supervisionPrompt}
        </p>
        {profile.trustedAdults.length > 0 && (
          <div className="mt-2 bg-white/70 rounded p-2">
            <p className="text-xs font-medium text-gray-600 mb-1">Documented trusted adults (PACE):</p>
            <ul className="text-xs text-gray-600 space-y-0.5">
              {profile.trustedAdults.map((a, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="mt-0.5 text-emerald-500">✓</span> {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </details>
    </div>
  );
}

// ── Summary tiles ─────────────────────────────────────────────────────────────

function SummaryTile({ value, label, colour }: { value: number | string; label: string; colour: string }) {
  return (
    <div className={`rounded-xl border p-4 ${colour}`}>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-600 mt-0.5">{label}</p>
    </div>
  );
}

function OverallBanner({ summary }: { summary: RelationalSafetyMapSummary }) {
  if (summary.totalChildren === 0) return null;

  const pct = Math.round((summary.secureCount / summary.totalChildren) * 100);
  const { overallStatus } = summary;

  const bannerStyle = overallStatus === "positive"
    ? "border-emerald-200 bg-emerald-50"
    : overallStatus === "mixed"
    ? "border-amber-200 bg-amber-50"
    : "border-red-200 bg-red-50";

  const label = overallStatus === "positive"
    ? "Relational safety picture looks positive"
    : overallStatus === "mixed"
    ? "Some children have developing relational safety — review in supervision"
    : "One or more children have a fragile relational safety picture — priority discussion needed";

  return (
    <div className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${bannerStyle}`}>
      <p className="text-sm font-medium text-gray-800">{label}</p>
      <div className="shrink-0 text-right">
        <p className="text-2xl font-bold text-gray-800">{pct}%</p>
        <p className="text-xs text-gray-500">children secure</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type Filter = "all" | "fragile" | "developing" | "secure";

export default function RelationalSafetyMapPage() {
  const { data, isLoading, isError } = useQuery<RelationalSafetyMapResponse>({
    queryKey: ["relational-safety-map"],
    queryFn: async () => {
      const res = await fetch("/api/v1/relational-safety-map");
      if (!res.ok) throw new Error("Failed to fetch relational safety map");
      return res.json();
    },
    staleTime: 60_000,
  });
  const [filter, setFilter] = useState<Filter>("all");

  return (
    <PageShell
      title="Relational Safety Map"
      description="Maps each child's documented trusted relationships: key worker assignment, key work session frequency, PACE trusted adults, and incident patterns. Grounded in DDP — children thrive through consistent, warm relationships with at least one safe adult."
    >
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load relational safety map. Please refresh.
        </div>
      )}

      {data && (() => {
        const { childProfiles, summary } = data.data;
        const visible = filter === "all"
          ? childProfiles
          : childProfiles.filter((c) => c.status === filter);

        return (
          <div className="space-y-6">
            {/* ── Overall banner ────────────────────────────────────────── */}
            <OverallBanner summary={summary} />

            {/* ── Summary tiles ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryTile value={summary.secureCount}     label="Secure"                 colour="border-emerald-200 bg-emerald-50" />
              <SummaryTile value={summary.developingCount} label="Developing"              colour="border-amber-200 bg-amber-50" />
              <SummaryTile value={summary.fragileCount}    label="Fragile"                 colour="border-red-200 bg-red-50" />
              <SummaryTile value={summary.fragileWithElevatedIncidents} label="Fragile + elevated incidents" colour="border-red-300 bg-red-100" />
            </div>

            {/* ── Alert strip ───────────────────────────────────────────── */}
            {(summary.noKeyWorkerAssigned > 0 || summary.noPaceProfile > 0) && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-1">
                {summary.noKeyWorkerAssigned > 0 && (
                  <p className="text-xs text-amber-800">
                    <span className="font-semibold">{summary.noKeyWorkerAssigned} child{summary.noKeyWorkerAssigned > 1 ? "ren" : ""}</span> without a key worker formally assigned
                  </p>
                )}
                {summary.noPaceProfile > 0 && (
                  <p className="text-xs text-amber-800">
                    <span className="font-semibold">{summary.noPaceProfile} child{summary.noPaceProfile > 1 ? "ren" : ""}</span> without a PACE profile — trusted adults cannot be mapped
                  </p>
                )}
                {summary.noKeyWorkLast30d > 0 && (
                  <p className="text-xs text-amber-800">
                    <span className="font-semibold">{summary.noKeyWorkLast30d} child{summary.noKeyWorkLast30d > 1 ? "ren" : ""}</span> with no key work sessions in the last 30 days
                  </p>
                )}
              </div>
            )}

            {/* ── DDP callout ───────────────────────────────────────────── */}
            <blockquote className="border-l-4 border-violet-400 bg-violet-50 rounded-r-lg px-4 py-3 text-xs text-violet-800 leading-relaxed italic">
              &ldquo;Children who have experienced developmental trauma need consistent, predictable, warm relationships with adults to build the foundations of trust and felt safety. Key working is not an administrative task — it is a therapeutic relationship.&rdquo;
              <br /><span className="not-italic font-medium mt-1 block">— DDP (Dan Hughes); 21 Skills for Residential Workers</span>
            </blockquote>

            {/* ── Filter chips ──────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2">
              {(["all", "fragile", "developing", "secure"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === f
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f === "all" ? `All (${summary.totalChildren})` : `${STATUS_LABEL[f as RelationalStatus]} (${summary[`${f}Count` as keyof RelationalSafetyMapSummary]})`}
                </button>
              ))}
            </div>

            {/* ── Child cards ───────────────────────────────────────────── */}
            {visible.length === 0 ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center text-sm text-emerald-700">
                No children in this category.
              </div>
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
              Relational safety status is derived from platform records — key worker assignment, logged sessions, PACE profile content, and incident logs. A &ldquo;fragile&rdquo; status reflects a gap in documented evidence, not necessarily a failure of care. The manager investigates, interprets, and decides next steps.
            </div>
          </div>
        );
      })()}
    </PageShell>
  );
}
