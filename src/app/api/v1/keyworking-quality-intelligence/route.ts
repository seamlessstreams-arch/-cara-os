// ══════════════════════════════════════════════════════════════════════════════
// CARA — KEY WORKING QUALITY INTELLIGENCE
// GET /api/v1/keyworking-quality-intelligence
// Synthesises key working sessions to surface child voice presence, mood
// improvement trajectories, overdue follow-ups, and session quality.
// CHR 2015 Reg 44, Reg 33; SCCIF — "children are helped to understand
// and manage their feelings and relationships".
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import type { YoungPerson } from "@/types";

export type KeyworkSignal = "concern" | "attention" | "positive" | "strong";
export type OverallSignal = "concern" | "attention" | "positive";

function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export interface SessionSummary {
  sessionId: string;
  sessionDate: string;
  daysAgo: number;
  type: string;
  duration: number;
  childVoice: string;
  workerObservations: string;
  moodBefore: number;
  moodAfter: number;
  moodImprovement: number;
  actionsCount: number;
  overdueFollowUp: boolean;
  followUpDate: string | null;
  followUpCompleted: boolean;
  confidential: boolean;
}

export interface ChildKeyworkProfile {
  childId: string;
  childName: string;
  sessionCount: number;
  daysSinceLastSession: number | null;
  avgMoodBefore: number;
  avgMoodAfter: number;
  avgMoodImprovement: number;
  childVoicePresent: boolean;
  overdueFollowUpCount: number;
  sessionTypes: string[];
  latestChildVoice: string | null;
  latestWorkerObservation: string | null;
  signal: KeyworkSignal;
  sessions: SessionSummary[];
}

export interface KeyworkSummary {
  totalSessions: number;
  totalChildren: number;
  avgMoodImprovement: number;
  childVoiceRate: number;
  overdueFollowUpCount: number;
  overallSignal: OverallSignal;
}

/** Wire shape of GET /api/v1/keyworking-quality-intelligence. */
export interface KeyworkingQualityResponse {
  data: {
    profiles: ChildKeyworkProfile[];
    summary: KeyworkSummary;
  };
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  one_to_one: "1:1",
  goal_setting: "Goal setting",
  wellbeing_check: "Wellbeing check",
  review: "Review",
  therapeutic: "Therapeutic",
  life_skills: "Life skills",
  informal: "Informal",
};

function keyworkSignal(
  daysSinceLastSession: number | null,
  avgMoodImprovement: number,
  childVoicePresent: boolean,
  overdueFollowUpCount: number
): KeyworkSignal {
  if (daysSinceLastSession !== null && daysSinceLastSession > 21) return "concern";
  if (overdueFollowUpCount > 0 || !childVoicePresent) return "attention";
  if (avgMoodImprovement >= 1.5) return "strong";
  return "positive";
}

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  const youngPeople = (store.youngPeople ?? []) as YoungPerson[];
  const rawSessions = (store.keyWorkingSessions as any[]) ?? [];

  const ypMap = new Map(
    youngPeople.map((yp) => [yp.id, `${yp.first_name} ${yp.last_name}`.trim() || "Unknown"])
  );

  // Group sessions by child
  const sessionsByChild = new Map<string, any[]>();
  rawSessions.forEach((s: any) => {
    const arr = sessionsByChild.get(s.child_id) ?? [];
    arr.push(s);
    sessionsByChild.set(s.child_id, arr);
  });

  const profiles: ChildKeyworkProfile[] = [];

  for (const [childId, sessions] of sessionsByChild.entries()) {
    // Sort newest first
    sessions.sort((a, b) => {
      const aDate = (a.date ?? a.session_date ?? "").slice(0, 10);
      const bDate = (b.date ?? b.session_date ?? "").slice(0, 10);
      return bDate.localeCompare(aDate);
    });

    const sessionSummaries: SessionSummary[] = sessions.map((s: any) => {
      const sessionDate = (s.date ?? s.session_date ?? "").slice(0, 10);
      const daysAgo = sessionDate ? daysBetween(sessionDate, today) : 0;
      const moodBefore = typeof s.mood_before === "number" ? s.mood_before : parseInt(s.mood_before ?? "0") || 0;
      const moodAfter = typeof s.mood_after === "number" ? s.mood_after : parseInt(s.mood_after ?? "0") || 0;
      const followUpDate = s.follow_up_date
        ? (typeof s.follow_up_date === "string" ? s.follow_up_date.slice(0, 10) : null)
        : null;
      const overdueFollowUp =
        !s.follow_up_completed &&
        followUpDate !== null &&
        followUpDate.length > 0 &&
        daysBetween(followUpDate, today) > 0;

      return {
        sessionId: s.id ?? "",
        sessionDate,
        daysAgo,
        type: SESSION_TYPE_LABELS[s.type ?? ""] ?? s.type ?? "Unknown",
        duration: s.duration ?? s.duration_minutes ?? 0,
        childVoice: s.child_voice ?? "",
        workerObservations: s.worker_observations ?? "",
        moodBefore,
        moodAfter,
        moodImprovement: moodAfter - moodBefore,
        actionsCount: (s.actions_agreed ?? []).length,
        overdueFollowUp,
        followUpDate,
        followUpCompleted: !!s.follow_up_completed,
        confidential: !!s.confidential,
      };
    });

    const latestSession = sessionSummaries[0] ?? null;
    const daysSinceLastSession = latestSession?.daysAgo ?? null;

    const moodImprovements = sessionSummaries.map((s) => s.moodImprovement);
    const avgMoodImprovement =
      moodImprovements.length > 0
        ? Math.round((moodImprovements.reduce((a, b) => a + b, 0) / moodImprovements.length) * 10) / 10
        : 0;

    const moodBefores = sessionSummaries.map((s) => s.moodBefore).filter((m) => m > 0);
    const avgMoodBefore =
      moodBefores.length > 0
        ? Math.round((moodBefores.reduce((a, b) => a + b, 0) / moodBefores.length) * 10) / 10
        : 0;

    const moodAfters = sessionSummaries.map((s) => s.moodAfter).filter((m) => m > 0);
    const avgMoodAfter =
      moodAfters.length > 0
        ? Math.round((moodAfters.reduce((a, b) => a + b, 0) / moodAfters.length) * 10) / 10
        : 0;

    const childVoicePresent = sessionSummaries.some((s) => s.childVoice.length > 0);
    const overdueFollowUpCount = sessionSummaries.filter((s) => s.overdueFollowUp).length;
    const sessionTypes = [...new Set(sessionSummaries.map((s) => s.type))];

    // Latest non-confidential child voice
    const latestWithVoice = sessionSummaries.find((s) => s.childVoice.length > 0 && !s.confidential);
    const latestWithObservation = sessionSummaries.find((s) => s.workerObservations.length > 0 && !s.confidential);

    const signal = keyworkSignal(daysSinceLastSession, avgMoodImprovement, childVoicePresent, overdueFollowUpCount);

    profiles.push({
      childId,
      childName: ypMap.get(childId) ?? childId,
      sessionCount: sessions.length,
      daysSinceLastSession,
      avgMoodBefore,
      avgMoodAfter,
      avgMoodImprovement,
      childVoicePresent,
      overdueFollowUpCount,
      sessionTypes,
      latestChildVoice: latestWithVoice?.childVoice ?? null,
      latestWorkerObservation: latestWithObservation?.workerObservations ?? null,
      signal,
      sessions: sessionSummaries,
    });
  }

  // Sort: concern first
  const signalOrder: Record<KeyworkSignal, number> = { concern: 0, attention: 1, positive: 2, strong: 3 };
  profiles.sort((a, b) => signalOrder[a.signal] - signalOrder[b.signal]);

  // Summary
  const totalSessions = rawSessions.length;
  const totalChildren = profiles.length;
  const avgMoodImprovement =
    totalSessions > 0
      ? Math.round(
          (profiles.reduce((sum, p) => sum + p.avgMoodImprovement, 0) / profiles.length) * 10
        ) / 10
      : 0;

  const sessionsWithVoice = rawSessions.filter((s: any) => (s.child_voice ?? "").length > 0).length;
  const childVoiceRate = totalSessions > 0 ? Math.round((sessionsWithVoice / totalSessions) * 100) : 0;
  const overdueFollowUpCount = profiles.reduce((sum, p) => sum + p.overdueFollowUpCount, 0);

  let overallSignal: OverallSignal = "positive";
  if (profiles.some((p) => p.signal === "concern")) {
    overallSignal = "concern";
  } else if (profiles.some((p) => p.signal === "attention")) {
    overallSignal = "attention";
  }

  const summary: KeyworkSummary = {
    totalSessions,
    totalChildren,
    avgMoodImprovement,
    childVoiceRate,
    overdueFollowUpCount,
    overallSignal,
  };

  const payload: KeyworkingQualityResponse = { data: { profiles, summary } };

  return NextResponse.json(payload);
}
