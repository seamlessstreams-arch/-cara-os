"use client";

import { useQuery } from "@tanstack/react-query";

// Types from use-staff-wellbeing-supervision-intelligence
export interface StaffWellbeingSupervisionResponse {
  data: {
    supervisions: StaffWellbeingProfile[];
    summary: {
      totalSupervisions: number;
      avgWellbeingScore: number;
      avgConfidenceLevel: number;
      supportNeededCount: number;
      overdueFollowUps: number;
      overdueActionsTotal: number;
      topTrainingNeeds: Array<{ need: string; count: number }>;
      teamSignal: TeamSignal;
    };
  };
}

const SIGNAL_CONFIG: Record<
  WellbeingSignal,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  support_needed: {
    label: "Support needed",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  attention: {
    label: "Attention",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  positive: {
    label: "Positive",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-400",
  },
  thriving: {
    label: "Thriving",
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    dot: "bg-green-500",
  },
};

const TEAM_SIGNAL_CONFIG: Record<TeamSignal, { label: string; bg: string; border: string; text: string }> = {
  concern: { label: "Team wellbeing concern", bg: "bg-red-50", border: "border-red-300", text: "text-red-800" },
  attention: { label: "Team attention needed", bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-800" },
  positive: { label: "Team wellbeing positive", bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-800" },
  thriving: { label: "Team thriving", bg: "bg-green-50", border: "border-green-300", text: "text-green-800" },
};

function ScorePips({ score, max = 5, colour }: { score: number; max?: number; colour: string }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(max)].map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full ${i < score ? colour : "bg-gray-200"}`}
        />
      ))}
    </div>
  );
}

function StaffSupervisionCard({ profile }: { profile: StaffWellbeingProfile }) {
  const cfg = SIGNAL_CONFIG[profile.signal];
  const overdueActions = profile.actions.filter((a) => a.overdue);
  const pendingActions = profile.actions.filter((a) => !a.done && !a.overdue);
  const completedActions = profile.actions.filter((a) => a.done);

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{profile.staffName}</p>
          <p className="text-xs text-gray-500">
            Supervision {profile.daysSinceSession}d ago · {profile.supervisorName}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 whitespace-nowrap ${cfg.bg} ${cfg.border} ${cfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-gray-500 mb-1">Wellbeing</p>
          <ScorePips
            score={profile.wellbeingScore}
            colour={profile.wellbeingScore <= 2 ? "bg-red-400" : profile.wellbeingScore === 3 ? "bg-amber-400" : "bg-green-400"}
          />
          <p className="text-gray-600 mt-0.5">{profile.wellbeingScore}/5</p>
        </div>
        <div>
          <p className="text-gray-500 mb-1">Confidence</p>
          <ScorePips
            score={profile.confidenceLevel}
            colour={profile.confidenceLevel <= 2 ? "bg-amber-400" : "bg-blue-400"}
          />
          <p className="text-gray-600 mt-0.5">{profile.confidenceLevel}/5</p>
        </div>
      </div>

      {profile.followUpOverdue && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
          ⚠ Wellbeing follow-up overdue (due {profile.followUpDate})
        </div>
      )}

      {profile.trainingNeeds.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Training needs raised</p>
          <div className="flex flex-wrap gap-1">
            {profile.trainingNeeds.map((need, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                {need}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.paceExamples && (
        <div className="text-xs text-gray-700 italic border-l-2 border-blue-300 pl-2">
          {profile.paceExamples}
        </div>
      )}

      {(overdueActions.length > 0 || pendingActions.length > 0) && (
        <div className="space-y-1 border-t border-gray-200 pt-2">
          {overdueActions.map((a, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs">
              <span className="text-red-500 mt-0.5">●</span>
              <span className="text-red-700 font-medium">
                OVERDUE: {a.action} <span className="text-red-500">(due {a.due})</span>
              </span>
            </div>
          ))}
          {pendingActions.map((a, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs">
              <span className="text-blue-400 mt-0.5">●</span>
              <span className="text-gray-700">{a.action} (due {a.due})</span>
            </div>
          ))}
          {completedActions.length > 0 && (
            <p className="text-xs text-green-600">✓ {completedActions.length} action{completedActions.length !== 1 ? "s" : ""} completed</p>
          )}
        </div>
      )}

      {profile.managerFeedback && (
        <div className="text-xs text-gray-600 border-t border-gray-200 pt-2">
          <span className="font-medium">Manager: </span>{profile.managerFeedback}
        </div>
      )}
    </div>
  );
}

export default function StaffWellbeingSupervisionPage() {
  // Inlined: useStaffWellbeingSupervisionIntelligence
  const { data, isLoading, error } = useQuery<StaffWellbeingSupervisionResponse>({
    queryKey: ["staff-wellbeing-supervision-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/staff-wellbeing-supervision-intelligence");
      if (!res.ok) throw new Error("Failed to fetch staff wellbeing supervision intelligence");
      return res.json();
    },
    staleTime: 120_000,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-8 w-80 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-56 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="p-6 text-red-600">Failed to load staff wellbeing supervision intelligence.</div>
    );
  }

  const { supervisions, summary } = data.data;
  const teamCfg = TEAM_SIGNAL_CONFIG[summary.teamSignal];

  const needsAttention = supervisions.filter((s) => ["support_needed", "attention"].includes(s.signal));
  const wellPlaced = supervisions.filter((s) => ["positive", "thriving"].includes(s.signal));

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff Wellbeing & Supervision Quality</h1>
        <p className="text-sm text-gray-500 mt-1">
          Wellbeing scores, PACE practice, training needs, and supervision actions from
          recent reflective supervision records.
        </p>
      </div>

      {/* Team summary */}
      <div className={`rounded-lg border px-5 py-4 ${teamCfg.bg} ${teamCfg.border}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className={`font-semibold ${teamCfg.text}`}>{teamCfg.label}</p>
            <p className="text-sm text-gray-600 mt-0.5">
              {summary.totalSupervisions} recent supervision records
              {summary.overdueFollowUps > 0 && (
                <span className="text-red-700 font-medium">
                  {" "}— {summary.overdueFollowUps} wellbeing follow-up{summary.overdueFollowUps !== 1 ? "s" : ""} overdue
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-5 text-sm">
            <div className="text-center">
              <p className="font-bold text-xl text-gray-900">{summary.avgWellbeingScore}</p>
              <p className="text-gray-500 text-xs">Avg wellbeing</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-xl text-gray-900">{summary.avgConfidenceLevel}</p>
              <p className="text-gray-500 text-xs">Avg confidence</p>
            </div>
            <div className="text-center">
              <p className={`font-bold text-xl ${summary.overdueActionsTotal > 0 ? "text-red-700" : "text-gray-900"}`}>
                {summary.overdueActionsTotal}
              </p>
              <p className="text-gray-500 text-xs">Overdue actions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Training needs */}
      {summary.topTrainingNeeds.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Training needs raised across team</h2>
          <div className="flex flex-wrap gap-2">
            {summary.topTrainingNeeds.map(({ need, count }) => (
              <div key={need} className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 border border-purple-100">
                <span className="text-xs text-purple-700 font-medium">{need}</span>
                {count > 1 && (
                  <span className="text-xs text-purple-400">×{count}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Needs attention */}
      {needsAttention.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Needs attention ({needsAttention.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {needsAttention.map((profile) => (
              <StaffSupervisionCard key={profile.staffId} profile={profile} />
            ))}
          </div>
        </section>
      )}

      {/* Positive / thriving */}
      {wellPlaced.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Positive & thriving ({wellPlaced.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {wellPlaced.map((profile) => (
              <StaffSupervisionCard key={profile.staffId} profile={profile} />
            ))}
          </div>
        </section>
      )}

      {/* Regulatory callout */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 text-xs text-gray-600 space-y-1">
        <p className="font-semibold text-gray-700">Regulatory basis</p>
        <p>
          <strong>CHR 2015 Reg 33:</strong> The registered person must ensure supervision
          supports staff wellbeing, professional development, and safe practice. Wellbeing
          follow-ups are a manager responsibility — Cara surfaces overdue checks, not a
          clinical assessment.
        </p>
        <p>
          <strong>PACE:</strong> Wellbeing scores and PACE examples are drawn directly from
          supervision content. Low wellbeing scores indicate staff may need increased
          support, adjusted workload, or EAP referral — the manager decides the response.
        </p>
      </div>
    </div>
  );
}
