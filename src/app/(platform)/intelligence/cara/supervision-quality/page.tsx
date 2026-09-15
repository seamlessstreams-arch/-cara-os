"use client";

import { formatRate } from "@/lib/metrics/rate";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";

import { EmptyState } from "@/components/ui/empty-state";
type SupervisionStatus = "current" | "due_soon" | "overdue" | "never";
type SupervisionSignal = "excellent" | "good" | "developing" | "at_risk";
type WellbeingTrend = "improving" | "stable" | "declining";

interface OverdueAction {
  action: string;
  due: string;
  owner: string;
}

interface StaffSupervisionProfile {
  staffId: string;
  staffName: string;
  jobTitle: string;
  supervisionCount: number;
  daysSinceLastSupervision: number | null;
  supervisionStatus: SupervisionStatus;
  latestWellbeingScore: number | null;
  wellbeingTrend: WellbeingTrend | null;
  latestConfidenceScore: number | null;
  paceEngagementRate: number;
  overdueActions: OverdueAction[];
  overdueActionCount: number;
  trainingNeeds: string[];
  followUpOverdue: boolean;
  signal: SupervisionSignal;
  supervisionPrompt: string;
}

interface SupervisionQualitySummary {
  totalActiveStaff: number;
  staffWithCurrentSupervision: number;
  staffDueSoon: number;
  staffOverdue: number;
  staffNeverSupervised: number;
  currentSupervisionRate: number;
  averageWellbeingScore: number | null;
  totalOverdueActions: number;
  staffAtRisk: number;
  ofstedNote: string;
}

interface SupervisionQualityResponse {
  data: {
    staffProfiles: StaffSupervisionProfile[];
    summary: SupervisionQualitySummary;
  };
}

function useSupervisionQualityIntelligence() {
  return useQuery<SupervisionQualityResponse>({
    queryKey: ["supervision-quality-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/supervision-quality-intelligence");
      if (!res.ok) throw new Error("Failed to fetch supervision quality intelligence");
      return res.json();
    },
    staleTime: 120_000,
  });
}

// ── Visual helpers ────────────────────────────────────────────────────────────

const SIGNAL_BADGE: Record<SupervisionSignal, string> = {
  excellent:  "bg-emerald-100 text-emerald-800",
  good:       "bg-blue-100 text-blue-800",
  developing: "bg-amber-100 text-amber-800",
  at_risk:    "bg-red-100 text-red-800",
};

const SIGNAL_LABEL: Record<SupervisionSignal, string> = {
  excellent:  "Excellent",
  good:       "Good",
  developing: "Developing",
  at_risk:    "At Risk",
};

const SIGNAL_BORDER: Record<SupervisionSignal, string> = {
  excellent:  "border-emerald-200 bg-emerald-50/30",
  good:       "border-blue-200 bg-blue-50/30",
  developing: "border-amber-200 bg-amber-50/40",
  at_risk:    "border-red-200 bg-red-50/40",
};

const STATUS_BADGE: Record<SupervisionStatus, string> = {
  current:  "bg-emerald-100 text-emerald-700",
  due_soon: "bg-amber-100 text-amber-700",
  overdue:  "bg-red-100 text-red-700",
  never:    "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<SupervisionStatus, string> = {
  current:  "Current",
  due_soon: "Due Soon",
  overdue:  "Overdue",
  never:    "Never",
};

const TREND_ICON: Record<WellbeingTrend, string> = {
  improving: "↑",
  stable:    "→",
  declining: "↓",
};

const TREND_COLOUR: Record<WellbeingTrend, string> = {
  improving: "text-emerald-600",
  stable:    "text-gray-400",
  declining: "text-red-500",
};

// ── Wellbeing dots ────────────────────────────────────────────────────────────

function WellbeingDots({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full ${i < score ? (score <= 2 ? "bg-red-400" : score <= 3 ? "bg-amber-400" : "bg-emerald-500") : "bg-gray-100"}`}
        />
      ))}
    </div>
  );
}

// ── Staff card ────────────────────────────────────────────────────────────────

function StaffCard({ profile }: { profile: StaffSupervisionProfile }) {
  return (
    <div className={`rounded-lg border p-4 ${SIGNAL_BORDER[profile.signal]}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{profile.staffName}</p>
          <p className="text-xs text-gray-400 mt-0.5">{profile.jobTitle}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SIGNAL_BADGE[profile.signal]}`}>
            {SIGNAL_LABEL[profile.signal]}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[profile.supervisionStatus]}`}>
            {STATUS_LABEL[profile.supervisionStatus]}
            {profile.daysSinceLastSupervision !== null && ` · ${profile.daysSinceLastSupervision}d`}
          </span>
        </div>
      </div>

      {/* Wellbeing + confidence */}
      {(profile.latestWellbeingScore !== null || profile.latestConfidenceScore !== null) && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          {profile.latestWellbeingScore !== null && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-xs text-gray-500">Wellbeing</p>
                {profile.wellbeingTrend && (
                  <span className={`text-xs font-bold ${TREND_COLOUR[profile.wellbeingTrend]}`}>
                    {TREND_ICON[profile.wellbeingTrend]}
                  </span>
                )}
              </div>
              <WellbeingDots score={profile.latestWellbeingScore} />
            </div>
          )}
          {profile.latestConfidenceScore !== null && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Confidence</p>
              <WellbeingDots score={profile.latestConfidenceScore} />
            </div>
          )}
        </div>
      )}

      {/* PACE engagement */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-xs text-gray-600">PACE in supervision</span>
          <span className={`text-xs font-semibold ${profile.paceEngagementRate >= 60 ? "text-emerald-600" : profile.paceEngagementRate >= 30 ? "text-amber-600" : "text-red-600"}`}>
            {formatRate(profile.paceEngagementRate)}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${profile.paceEngagementRate >= 60 ? "bg-emerald-500" : profile.paceEngagementRate >= 30 ? "bg-amber-400" : "bg-red-400"}`}
            style={{ width: `${formatRate(profile.paceEngagementRate)}` }}
          />
        </div>
      </div>

      {/* Overdue actions */}
      {profile.overdueActionCount > 0 && (
        <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-xs font-medium text-amber-800 mb-1">
            {profile.overdueActionCount} overdue action{profile.overdueActionCount > 1 ? "s" : ""}:
          </p>
          {profile.overdueActions.slice(0, 2).map((a, i) => (
            <p key={i} className="text-xs text-amber-700">• {a.action} (due {a.due})</p>
          ))}
        </div>
      )}

      {/* Training needs */}
      {profile.trainingNeeds.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {profile.trainingNeeds.map((need) => (
            <span key={need} className="rounded-full px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-xs text-indigo-700">
              {need}
            </span>
          ))}
        </div>
      )}

      {/* Follow-up overdue */}
      {profile.followUpOverdue && (
        <div className="mb-3 text-xs text-amber-600 font-medium">
          ⚠ Supervision follow-up overdue
        </div>
      )}

      {/* Supervision count */}
      <p className="text-xs text-gray-400 mb-3">
        {profile.supervisionCount} supervision{profile.supervisionCount !== 1 ? "s" : ""} recorded
      </p>

      {/* Supervision prompt */}
      <details open={profile.signal === "at_risk"}>
        <summary className="text-xs font-medium text-indigo-700 cursor-pointer list-none hover:underline select-none">
          Supervision focus ↓
        </summary>
        <p className="mt-2 text-xs text-gray-700 bg-white/70 rounded p-2 leading-relaxed">
          {profile.supervisionPrompt}
        </p>
      </details>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type Filter = SupervisionSignal | "all";

export default function SupervisionQualityPage() {
  const { data, isLoading, isError } = useSupervisionQualityIntelligence();
  const [filter, setFilter] = useState<Filter>("all");

  return (
    <PageShell
      title="Supervision Quality Intelligence"
      description="Tracks the regularity and quality of reflective supervision across the team. Surfaces who is overdue, who is showing wellbeing concerns, whether PACE is being discussed, and whether agreed actions are being completed."
    >
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load supervision quality data. Please refresh.
        </div>
      )}

      {data && (() => {
        const { staffProfiles, summary } = data.data;
        const visible = filter === "all" ? staffProfiles : staffProfiles.filter((p) => p.signal === filter);

        return (
          <div className="space-y-6">
            {/* ── Ofsted note ──────────────────────────────────────────── */}
            <div className={`rounded-lg border p-4 ${
              summary.staffNeverSupervised > 0 || summary.staffOverdue > 0 ? "border-red-200 bg-red-50"
              : summary.staffAtRisk > 0 ? "border-amber-200 bg-amber-50"
              : summary.currentSupervisionRate >= 90 ? "border-emerald-200 bg-emerald-50"
              : "border-gray-200 bg-gray-50"
            }`}>
              <p className="text-sm font-medium text-gray-800">{summary.ofstedNote}</p>
            </div>

            {/* ── Summary tiles ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`rounded-xl border p-4 ${summary.currentSupervisionRate >= 90 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                <p className="text-2xl font-bold text-gray-800">{formatRate(summary.currentSupervisionRate)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Supervision current</p>
              </div>
              <div className={`rounded-xl border p-4 ${summary.staffOverdue + summary.staffNeverSupervised > 0 ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                <p className={`text-2xl font-bold ${summary.staffOverdue + summary.staffNeverSupervised > 0 ? "text-red-600" : "text-gray-800"}`}>
                  {summary.staffOverdue + summary.staffNeverSupervised}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Overdue / never</p>
              </div>
              <div className={`rounded-xl border p-4 ${summary.averageWellbeingScore !== null && summary.averageWellbeingScore >= 4 ? "border-emerald-200 bg-emerald-50" : summary.averageWellbeingScore !== null && summary.averageWellbeingScore <= 2.5 ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                <p className="text-2xl font-bold text-gray-800">
                  {summary.averageWellbeingScore !== null ? `${summary.averageWellbeingScore}/5` : "–"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Avg wellbeing score</p>
              </div>
              <div className={`rounded-xl border p-4 ${summary.totalOverdueActions > 0 ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
                <p className={`text-2xl font-bold ${summary.totalOverdueActions > 0 ? "text-amber-600" : "text-gray-800"}`}>
                  {summary.totalOverdueActions}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Overdue actions</p>
              </div>
            </div>

            {/* ── Callout ───────────────────────────────────────────────── */}
            <blockquote className="border-l-4 border-purple-400 bg-purple-50 rounded-r-lg px-4 py-3 text-xs text-purple-900 leading-relaxed italic">
              &ldquo;Regular, reflective supervision is not a management task — it is the primary mechanism by which therapeutic culture is built and sustained. Without it, staff burn out, practice drifts, and children suffer.&rdquo;
              <br /><span className="not-italic font-medium mt-1 block">— CACHE Supervision Framework; Children&rsquo;s Homes Regulations; NICE</span>
            </blockquote>

            {/* ── Filter chips ──────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2">
              {([
                { key: "all",       label: `All (${summary.totalActiveStaff})` },
                { key: "at_risk",   label: `At Risk (${staffProfiles.filter((p) => p.signal === "at_risk").length})` },
                { key: "developing",label: `Developing (${staffProfiles.filter((p) => p.signal === "developing").length})` },
                { key: "good",      label: `Good (${staffProfiles.filter((p) => p.signal === "good").length})` },
                { key: "excellent", label: `Excellent (${staffProfiles.filter((p) => p.signal === "excellent").length})` },
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
              <EmptyState compact title="No staff in this category." />
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
              Supervision quality is assessed from recorded reflective supervision data. A staff member with no recorded supervision may have received support informally — the manager verifies before acting on this data. Wellbeing scores are self-reported and a single data point; they are a prompt for conversation, not a diagnosis.
            </div>
          </div>
        );
      })()}
    </PageShell>
  );
}
