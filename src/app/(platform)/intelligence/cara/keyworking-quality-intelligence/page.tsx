"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  ChildKeyworkProfile,
  KeyworkingQualityResponse,
  KeyworkSignal,
  OverallSignal,
  SessionSummary,
} from "@/app/api/v1/keyworking-quality-intelligence/route";

const SIGNAL_CONFIG: Record<KeyworkSignal, { label: string; bg: string; border: string; text: string; dot: string }> = {
  concern: { label: "Concern", bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" },
  attention: { label: "Attention", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  positive: { label: "Positive", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-400" },
  strong: { label: "Strong", bg: "bg-green-50", border: "border-green-200", text: "text-green-700", dot: "bg-green-500" },
};

const OVERALL_CONFIG: Record<OverallSignal, { label: string; bg: string; border: string; text: string }> = {
  concern: { label: "Key working concerns require attention", bg: "bg-red-50", border: "border-red-300", text: "text-red-800" },
  attention: { label: "Key working attention needed", bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-800" },
  positive: { label: "Key working is positive across the home", bg: "bg-green-50", border: "border-green-300", text: "text-green-800" },
};

function MoodPips({ value, max = 5 }: { value: number; max?: number }) {
  const colour = value <= 2 ? "bg-red-400" : value <= 3 ? "bg-amber-400" : "bg-green-400";
  return (
    <div className="flex gap-0.5 items-center">
      {[...Array(max)].map((_, i) => (
        <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < value ? colour : "bg-gray-200"}`} />
      ))}
    </div>
  );
}

function MoodImprovementBadge({ delta }: { delta: number }) {
  if (delta > 0) return <span className="text-xs text-green-700 font-semibold">+{delta}</span>;
  if (delta < 0) return <span className="text-xs text-red-700 font-semibold">{delta}</span>;
  return <span className="text-xs text-gray-500">±0</span>;
}

function SessionRow({ session }: { session: SessionSummary }) {
  return (
    <div className="border-t border-gray-100 pt-2 pb-1 text-xs">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">{session.type}</span>
          <span className="text-gray-400">{session.daysAgo}d ago · {session.duration}min</span>
          {session.confidential && (
            <span className="text-purple-600 text-xs">🔒 Confidential</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <MoodPips value={session.moodBefore} />
          <span className="text-gray-400">→</span>
          <MoodPips value={session.moodAfter} />
          <MoodImprovementBadge delta={session.moodImprovement} />
        </div>
      </div>
      {session.childVoice && !session.confidential && (
        <p className="text-gray-700 italic border-l-2 border-blue-300 pl-2 mt-1">
          "{session.childVoice}"
        </p>
      )}
      {session.overdueFollowUp && (
        <p className="text-red-700 font-medium mt-1">⚠ Follow-up overdue (due {session.followUpDate})</p>
      )}
    </div>
  );
}

function ChildKeyworkCard({ profile }: { profile: ChildKeyworkProfile }) {
  const cfg = SIGNAL_CONFIG[profile.signal];
  const improvementColour =
    (profile.avgMoodImprovement ?? 0) > 0 ? "text-green-700" : (profile.avgMoodImprovement ?? 0) < 0 ? "text-red-700" : "text-gray-500";

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{profile.childName}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {profile.sessionCount} session{profile.sessionCount !== 1 ? "s" : ""}
            {profile.daysSinceLastSession !== null && (
              <> · Last {profile.daysSinceLastSession}d ago</>
            )}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${cfg.bg} ${cfg.border} ${cfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <p className="font-bold text-lg text-gray-900">{profile.avgMoodBefore}/5</p>
          <p className="text-gray-500">Avg before</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-lg text-gray-900">{profile.avgMoodAfter}/5</p>
          <p className="text-gray-500">Avg after</p>
        </div>
        <div className="text-center">
          <p className={`font-bold text-lg ${improvementColour}`}>
            {(profile.avgMoodImprovement ?? 0) > 0 ? "+" : ""}{profile.avgMoodImprovement}
          </p>
          <p className="text-gray-500">Improvement</p>
        </div>
      </div>

      {/* Session types */}
      {profile.sessionTypes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {profile.sessionTypes.map((t) => (
            <span key={t} className="px-1.5 py-0.5 rounded text-xs bg-white bg-opacity-60 border border-gray-200 text-gray-600">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Child voice */}
      {profile.latestChildVoice && (
        <div className="text-xs text-gray-700 italic border-l-2 border-blue-300 pl-2">
          "{profile.latestChildVoice}"
        </div>
      )}

      {/* Worker observation */}
      {profile.latestWorkerObservation && (
        <div className="text-xs text-gray-600 border-t border-gray-200 pt-2">
          <span className="font-medium">Worker: </span>{profile.latestWorkerObservation}
        </div>
      )}

      {/* Overdue follow-up warning */}
      {profile.overdueFollowUpCount > 0 && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
          ⚠ {profile.overdueFollowUpCount} overdue follow-up{profile.overdueFollowUpCount !== 1 ? "s" : ""}
        </div>
      )}

      {/* Child voice absent warning */}
      {!profile.childVoicePresent && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          No child voice recorded across sessions
        </div>
      )}

      {/* Sessions */}
      <div className="space-y-0">
        {profile.sessions.map((s) => (
          <SessionRow key={s.sessionId} session={s} />
        ))}
      </div>
    </div>
  );
}

export default function KeyworkingQualityIntelligencePage() {
  // Inlined: useKeyworkingQualityIntelligence
  const { data, isLoading, error } = useQuery<KeyworkingQualityResponse>({
    queryKey: ["keyworking-quality-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/keyworking-quality-intelligence");
      if (!res.ok) throw new Error("Failed to fetch keyworking quality intelligence");
      return res.json();
    },
    staleTime: 120_000,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-8 w-80 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return <div className="p-6 text-red-600">Failed to load keyworking quality intelligence.</div>;
  }

  const { profiles, summary } = data.data;
  const overallCfg = OVERALL_CONFIG[summary.overallSignal];

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Key Working Quality Intelligence</h1>
        <p className="text-sm text-gray-500 mt-1">
          Child voice presence, mood improvement trajectories, overdue follow-ups, and
          session quality across all key working sessions.
        </p>
      </div>

      {/* Overall signal */}
      <div className={`rounded-lg border px-5 py-4 ${overallCfg.bg} ${overallCfg.border}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className={`font-semibold ${overallCfg.text}`}>{overallCfg.label}</p>
          <div className="flex gap-5 text-sm">
            <div className="text-center">
              <p className="font-bold text-xl text-gray-900">{summary.totalSessions}</p>
              <p className="text-gray-500 text-xs">Sessions</p>
            </div>
            <div className="text-center">
              <p className={`font-bold text-xl ${(summary.avgMoodImprovement ?? 0) > 0 ? "text-green-700" : "text-gray-900"}`}>
                {(summary.avgMoodImprovement ?? 0) > 0 ? "+" : ""}{summary.avgMoodImprovement}
              </p>
              <p className="text-gray-500 text-xs">Avg mood Δ</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-xl text-gray-900">{summary.childVoiceRate}%</p>
              <p className="text-gray-500 text-xs">Child voice</p>
            </div>
            {summary.overdueFollowUpCount > 0 && (
              <div className="text-center">
                <p className="font-bold text-xl text-red-700">{summary.overdueFollowUpCount}</p>
                <p className="text-gray-500 text-xs">Overdue</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Per-child profiles */}
      <div className="grid gap-6 md:grid-cols-2">
        {profiles.map((profile) => (
          <ChildKeyworkCard key={profile.childId} profile={profile} />
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-6 text-center">
          <p className="text-gray-500">No key working sessions found.</p>
        </div>
      )}

      {/* Regulatory callout */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 text-xs text-gray-600 space-y-1">
        <p className="font-semibold text-gray-700">Regulatory basis</p>
        <p>
          <strong>CHR 2015 Reg 44:</strong> Each child must have a designated key worker. Key
          working sessions must be regular, purposeful, and child-centred. Cara surfaces sessions
          where child voice is absent or follow-up is overdue.
        </p>
        <p>
          <strong>Mood scores:</strong> Before/after mood ratings are recorded by the key worker
          at each session. An improvement score ≥1 is generally positive. Persistent low or
          declining scores warrant review with the child's social worker and CAMHS where indicated.
        </p>
      </div>
    </div>
  );
}
