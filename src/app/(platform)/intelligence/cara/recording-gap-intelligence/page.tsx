"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";

import { EmptyState } from "@/components/ui/empty-state";
type GapSeverity = "critical" | "warning" | "current";
type RecordingDomain = "daily_log" | "key_working" | "lac_review" | "welfare_check";

interface DomainGap {
  domain: RecordingDomain;
  domainLabel: string;
  severity: GapSeverity;
  daysSinceLastRecord: number | null;
  lastRecordDate: string | null;
  overdueMessage: string;
}

interface ChildRecordingProfile {
  childId: string;
  childName: string;
  placementDays: number;
  gaps: DomainGap[];
  criticalGapCount: number;
  warningGapCount: number;
  overallSeverity: GapSeverity;
  supervisionPrompt: string;
}

interface DomainSummary {
  domain: RecordingDomain;
  domainLabel: string;
  childrenWithCritical: number;
  childrenWithWarning: number;
  totalChildrenAffected: number;
}

interface RecordingGapSummary {
  totalCurrentChildren: number;
  childrenWithCriticalGap: number;
  childrenWithAnyGap: number;
  totalCriticalGaps: number;
  totalWarningGaps: number;
  domainSummaries: DomainSummary[];
  ofstedNote: string;
}

interface RecordingGapIntelligenceResponse {
  data: {
    childProfiles: ChildRecordingProfile[];
    summary: RecordingGapSummary;
  };
}

function useRecordingGapIntelligence() {
  return useQuery<RecordingGapIntelligenceResponse>({
    queryKey: ["recording-gap-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/recording-gap-intelligence");
      if (!res.ok) throw new Error("Failed to fetch recording gap intelligence");
      return res.json();
    },
    staleTime: 60_000,
  });
}

// ── Visual helpers ────────────────────────────────────────────────────────────

const SEV_BADGE: Record<GapSeverity, string> = {
  critical: "bg-red-100 text-red-800",
  warning:  "bg-amber-100 text-amber-800",
  current:  "bg-emerald-100 text-emerald-800",
};

const SEV_BORDER: Record<GapSeverity, string> = {
  critical: "border-red-200 bg-red-50/40",
  warning:  "border-amber-200 bg-amber-50/40",
  current:  "border-emerald-200 bg-emerald-50/30",
};

const SEV_DOT: Record<GapSeverity, string> = {
  critical: "bg-red-500",
  warning:  "bg-amber-400",
  current:  "bg-emerald-500",
};

// ── Domain gap pill ───────────────────────────────────────────────────────────

function GapPill({ gap }: { gap: DomainGap }) {
  return (
    <div className={`flex items-start gap-1.5 rounded px-2 py-1.5 ${gap.severity === "critical" ? "bg-red-50" : "bg-amber-50"}`}>
      <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${SEV_DOT[gap.severity]}`} />
      <div>
        <p className="text-xs font-medium text-gray-700">{gap.domainLabel}</p>
        <p className="text-xs text-gray-500">{gap.overdueMessage}</p>
      </div>
    </div>
  );
}

// ── Child card ────────────────────────────────────────────────────────────────

function ChildCard({ profile }: { profile: ChildRecordingProfile }) {
  return (
    <div className={`rounded-lg border p-4 ${SEV_BORDER[profile.overallSeverity]}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{profile.childName}</p>
          <p className="text-xs text-gray-400">{profile.placementDays} day{profile.placementDays !== 1 ? "s" : ""} in placement</p>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${SEV_BADGE[profile.overallSeverity]}`}>
            {profile.criticalGapCount > 0
              ? `${profile.criticalGapCount} critical gap${profile.criticalGapCount > 1 ? "s" : ""}`
              : profile.warningGapCount > 0
              ? `${profile.warningGapCount} warning${profile.warningGapCount > 1 ? "s" : ""}`
              : "Recording current"}
          </span>
        </div>
      </div>

      {profile.gaps.length > 0 ? (
        <div className="space-y-1.5 mb-3">
          {profile.gaps.map((g) => (
            <GapPill key={g.domain} gap={g} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-emerald-600 mb-3">All monitored domains are current.</p>
      )}

      {profile.gaps.length > 0 && (
        <details open={profile.overallSeverity === "critical"}>
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

// ── Domain summary bar ────────────────────────────────────────────────────────

function DomainBar({ domain, total }: { domain: DomainSummary; total: number }) {
  if (total === 0) return null;
  const critPct = (domain.childrenWithCritical / total) * 100;
  const warnPct = (domain.childrenWithWarning / total) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-gray-600">{domain.domainLabel}</p>
        {domain.totalChildrenAffected > 0 && (
          <p className="text-xs text-gray-500">
            {domain.childrenWithCritical > 0 && (
              <span className="text-red-600 font-medium">{domain.childrenWithCritical} critical </span>
            )}
            {domain.childrenWithWarning > 0 && (
              <span className="text-amber-600">{domain.childrenWithWarning} warning</span>
            )}
          </p>
        )}
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
        <div className="h-full bg-red-400 rounded-l-full" style={{ width: `${critPct}%` }} />
        <div className="h-full bg-amber-300" style={{ width: `${warnPct}%` }} />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type Filter = "all" | "critical" | "warning" | "current";

export default function RecordingGapIntelligencePage() {
  const { data, isLoading, isError } = useRecordingGapIntelligence();
  const [filter, setFilter] = useState<Filter>("all");

  return (
    <PageShell
      title="Recording Gap Intelligence"
      description="Identifies gaps in care recording across four safeguarding-critical domains: daily logs, key work sessions, LAC reviews, and welfare checks. Cara flags — the manager reviews and acts."
    >
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load recording gap intelligence. Please refresh.
        </div>
      )}

      {data && (() => {
        const { childProfiles, summary } = data.data;

        const visible: ChildRecordingProfile[] =
          filter === "all" ? childProfiles
          : filter === "critical" ? childProfiles.filter((c) => c.overallSeverity === "critical")
          : filter === "warning"  ? childProfiles.filter((c) => c.overallSeverity === "warning")
          : childProfiles.filter((c) => c.overallSeverity === "current");

        const allCurrent = summary.childrenWithAnyGap === 0;

        return (
          <div className="space-y-6">
            {/* ── Ofsted note banner ────────────────────────────────────── */}
            <div className={`rounded-lg border p-4 ${
              summary.childrenWithCriticalGap > 0
                ? "border-red-200 bg-red-50"
                : summary.childrenWithAnyGap > 0
                ? "border-amber-200 bg-amber-50"
                : "border-emerald-200 bg-emerald-50"
            }`}>
              <p className="text-sm font-medium text-gray-800">{summary.ofstedNote}</p>
            </div>

            {/* ── Summary tiles ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-2xl font-bold text-gray-800">{summary.totalCurrentChildren}</p>
                <p className="text-xs text-gray-500 mt-0.5">Current residents</p>
              </div>
              <div className={`rounded-xl border p-4 ${summary.childrenWithCriticalGap > 0 ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                <p className="text-2xl font-bold text-gray-800">{summary.childrenWithCriticalGap}</p>
                <p className="text-xs text-gray-500 mt-0.5">Critical gaps</p>
              </div>
              <div className={`rounded-xl border p-4 ${summary.totalWarningGaps > 0 ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
                <p className="text-2xl font-bold text-gray-800">{summary.totalWarningGaps}</p>
                <p className="text-xs text-gray-500 mt-0.5">Warnings</p>
              </div>
              <div className={`rounded-xl border p-4 ${allCurrent ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-gray-50"}`}>
                <p className="text-2xl font-bold text-gray-800">{summary.totalCurrentChildren - summary.childrenWithAnyGap}</p>
                <p className="text-xs text-gray-500 mt-0.5">Fully current</p>
              </div>
            </div>

            {/* ── Domain breakdown ──────────────────────────────────────── */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-700 mb-4">Recording Domain Overview</p>
              <div className="space-y-4">
                {summary.domainSummaries.map((d) => (
                  <DomainBar key={d.domain} domain={d} total={summary.totalCurrentChildren} />
                ))}
              </div>
            </div>

            {/* ── Ofsted callout ────────────────────────────────────────── */}
            <blockquote className="border-l-4 border-slate-400 bg-slate-50 rounded-r-lg px-4 py-3 text-xs text-slate-700 leading-relaxed italic">
              &ldquo;Poor and infrequent recording makes it impossible for managers to assure themselves of the quality of care being provided and whether children are safe.&rdquo;
              <br /><span className="not-italic font-medium mt-1 block">— Ofsted ILACS Handbook</span>
            </blockquote>

            {/* ── Filter chips ──────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2">
              {([
                { key: "all",      label: `All (${summary.totalCurrentChildren})` },
                { key: "critical", label: `Critical (${summary.childrenWithCriticalGap})` },
                { key: "warning",  label: `Warning (${summary.childrenWithAnyGap - summary.childrenWithCriticalGap})` },
                { key: "current",  label: `Current (${summary.totalCurrentChildren - summary.childrenWithAnyGap})` },
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
              Gap detection is based on records entered into this platform only. A gap may reflect records held elsewhere, not a failure to carry out the activity. The manager verifies and investigates before drawing conclusions. Thresholds: daily log &gt;3 days; key work &gt;30 days; LAC review &gt;180 days or overdue; welfare check &gt;7 days.
            </div>
          </div>
        );
      })()}
    </PageShell>
  );
}
