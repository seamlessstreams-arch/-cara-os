// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF WELLBEING & SUPERVISION QUALITY INTELLIGENCE
// GET /api/v1/staff-wellbeing-supervision-intelligence
// Surfaces per-staff wellbeing scores, PACE practice, overdue supervision
// actions, and training needs from reflective supervision records.
// CHR 2015 Reg 33 — supervision quality and staff wellbeing.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { todayStr } from "@/lib/utils";

export type WellbeingSignal = "support_needed" | "attention" | "positive" | "thriving";
export type TeamSignal = "concern" | "attention" | "positive" | "thriving";

export interface SupervisionAction {
  action: string;
  owner: string;
  due: string;
  done: boolean;
  overdue: boolean;
}

export interface StaffWellbeingProfile {
  staffId: string;
  staffName: string;
  supervisorName: string;
  sessionDate: string;
  daysSinceSession: number;
  wellbeingScore: number;
  confidenceLevel: number;
  emotionalWellbeing: string;
  workloadNote: string;
  paceExamples: string;
  managerFeedback: string;
  trainingNeeds: string[];
  followUpDate: string | null;
  followUpOverdue: boolean;
  actions: SupervisionAction[];
  overdueActionsCount: number;
  signal: WellbeingSignal;
}

export interface TrainingNeedCount {
  need: string;
  count: number;
}

export interface WellbeingSummary {
  totalSupervisions: number;
  avgWellbeingScore: number | null;
  avgConfidenceLevel: number | null;
  supportNeededCount: number;
  overdueFollowUps: number;
  overdueActionsTotal: number;
  topTrainingNeeds: TrainingNeedCount[];
  teamSignal: TeamSignal;
}

/** Wire shape of GET /api/v1/staff-wellbeing-supervision-intelligence. */
export interface StaffWellbeingSupervisionResponse {
  data: {
    supervisions: StaffWellbeingProfile[];
    summary: WellbeingSummary;
  };
}

function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function wellbeingSignal(score: number, overdueFollowUp: boolean, overdueActions: number): WellbeingSignal {
  if (score <= 2) return "support_needed";
  if (score === 3 || overdueActions > 0 || overdueFollowUp) return "attention";
  if (score === 5) return "thriving";
  return "positive";
}

export async function GET() {
  const reflectiveSupervisionsList = await dal.reflectiveSupervisions.findAll();
  const today = todayStr();

  const rawSupervisions = (reflectiveSupervisionsList as any[] ?? []);

  const profiles: StaffWellbeingProfile[] = rawSupervisions.map((rec: any) => {
    const sessionDate = typeof rec.date === "string" ? rec.date.slice(0, 10) : today;
    const daysSinceSession = daysBetween(sessionDate, today);

    const followUpDate = rec.follow_up_date
      ? typeof rec.follow_up_date === "string"
        ? rec.follow_up_date.slice(0, 10)
        : null
      : null;

    const followUpOverdue =
      followUpDate !== null &&
      rec.wellbeing_score <= 3 &&
      daysBetween(followUpDate, today) > 0;

    const rawActions: any[] = rec.actions ?? [];
    const actions: SupervisionAction[] = rawActions.map((a: any) => {
      const dueStr = typeof a.due === "string" ? a.due.slice(0, 10) : null;
      const overdue = !a.done && dueStr !== null && daysBetween(dueStr, today) > 0;
      return {
        action: a.action ?? "",
        owner: a.owner ?? "",
        due: dueStr ?? "",
        done: !!a.done,
        overdue,
      };
    });

    const overdueActionsCount = actions.filter((a) => a.overdue).length;
    const signal = wellbeingSignal(rec.wellbeing_score ?? 3, followUpOverdue, overdueActionsCount);

    return {
      staffId: rec.staff_id,
      staffName: rec.staff_name ?? rec.staff_id,
      supervisorName: rec.supervisor_name ?? rec.supervisor_id,
      sessionDate,
      daysSinceSession,
      wellbeingScore: rec.wellbeing_score ?? 3,
      confidenceLevel: rec.confidence_level ?? 3,
      emotionalWellbeing: rec.emotional_wellbeing ?? "",
      workloadNote: rec.workload ?? "",
      paceExamples: rec.pace_examples ?? "",
      managerFeedback: rec.manager_feedback ?? "",
      trainingNeeds: rec.training_needs ?? [],
      followUpDate,
      followUpOverdue,
      actions,
      overdueActionsCount,
      signal,
    };
  });

  // Sort: support_needed first, then attention, positive, thriving
  const signalOrder: Record<WellbeingSignal, number> = {
    support_needed: 0,
    attention: 1,
    positive: 2,
    thriving: 3,
  };
  profiles.sort((a, b) => signalOrder[a.signal] - signalOrder[b.signal]);

  // ── Summary ───────────────────────────────────────────────────────────────

  const totalSupervisions = profiles.length;
  const avgWellbeingScore =
    totalSupervisions > 0
      ? Math.round(
          (profiles.reduce((sum, p) => sum + p.wellbeingScore, 0) / totalSupervisions) * 10
        ) / 10
      : null;

  const avgConfidenceLevel =
    totalSupervisions > 0
      ? Math.round(
          (profiles.reduce((sum, p) => sum + p.confidenceLevel, 0) / totalSupervisions) * 10
        ) / 10
      : null;

  const supportNeededCount = profiles.filter((p) => p.signal === "support_needed").length;
  const overdueFollowUps = profiles.filter((p) => p.followUpOverdue).length;
  const overdueActionsTotal = profiles.reduce((sum, p) => sum + p.overdueActionsCount, 0);

  // Tally training needs across all records
  const needsCount = new Map<string, number>();
  profiles.forEach((p) => {
    p.trainingNeeds.forEach((need) => {
      needsCount.set(need, (needsCount.get(need) ?? 0) + 1);
    });
  });
  const topTrainingNeeds: TrainingNeedCount[] = [...needsCount.entries()]
    .map(([need, count]) => ({ need, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  let teamSignal: TeamSignal = "thriving";
  if (supportNeededCount > 0 && overdueFollowUps > 0) {
    teamSignal = "concern";
  } else if (supportNeededCount > 0 || overdueActionsTotal > 1 || (avgWellbeingScore ?? 0) < 3.5) {
    teamSignal = "attention";
  } else if ((avgWellbeingScore ?? 0) >= 4.5) {
    teamSignal = "thriving";
  } else {
    teamSignal = "positive";
  }

  const summary: WellbeingSummary = {
    totalSupervisions,
    avgWellbeingScore,
    avgConfidenceLevel,
    supportNeededCount,
    overdueFollowUps,
    overdueActionsTotal,
    topTrainingNeeds,
    teamSignal,
  };

  const payload: StaffWellbeingSupervisionResponse = {
    data: { supervisions: profiles, summary },
  };

  return NextResponse.json(payload);
}
