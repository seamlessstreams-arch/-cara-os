// ══════════════════════════════════════════════════════════════════════════════
// CARA — SUPERVISION QUALITY INTELLIGENCE
// GET /api/v1/supervision-quality-intelligence
//
// Analyses the quality and regularity of reflective supervision across the
// workforce. Tracks who is overdue, wellbeing trends, PACE engagement,
// action completion, and unmet training needs.
//
// Supports the Ofsted inspection question: "How do you ensure your staff
// receive regular, high-quality supervision that supports both their
// wellbeing and their practice with children?"
//
// "Regular, reflective supervision is not a management task — it is the
//  primary mechanism by which therapeutic culture is built and sustained.
//  Without it, staff burn out, practice drifts, and children suffer."
// — CACHE Supervision Framework; CHR Reg 33; NICE Quality Standards
//
// Per-staff signal: excellent / good / developing / at_risk
// All deterministic. No LLM calls.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  paceEngagementRate: number | null;
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
  currentSupervisionRate: number | null;
  averageWellbeingScore: number | null;
  totalOverdueActions: number;
  staffAtRisk: number;
  ofstedNote: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function supervisionStatus(daysSince: number | null): SupervisionStatus {
  if (daysSince === null) return "never";
  if (daysSince <= 28) return "current";
  if (daysSince <= 42) return "due_soon";
  return "overdue";
}

function wellbeingTrend(scores: number[]): WellbeingTrend | null {
  if (scores.length < 2) return null;
  const last = scores[scores.length - 1];
  const prev = scores[scores.length - 2];
  if (last > prev) return "improving";
  if (last < prev) return "declining";
  return "stable";
}

function paceEngaged(text: string): boolean {
  return !!(text && text.trim().length >= 20);
}

function buildSignal(
  status: SupervisionStatus,
  wellbeing: number | null,
  confidence: number | null,
  overdueActionCount: number,
  paceRate: number,
  followUpOverdue: boolean,
): SupervisionSignal {
  if (status === "overdue" || status === "never") return "at_risk";
  if (wellbeing !== null && wellbeing <= 2) return "at_risk";
  if (overdueActionCount >= 2) return "at_risk";
  if (followUpOverdue && wellbeing !== null && wellbeing <= 3) return "at_risk";

  if (status === "due_soon") return "developing";
  if (confidence !== null && confidence <= 2) return "developing";
  if (paceRate < 40) return "developing";
  if (overdueActionCount >= 1) return "developing";

  if (wellbeing !== null && wellbeing >= 4 && confidence !== null && confidence >= 4 && paceRate >= 60) return "excellent";
  return "good";
}

function buildPrompt(
  name: string,
  signal: SupervisionSignal,
  status: SupervisionStatus,
  wellbeing: number | null,
  overdueActionCount: number,
  paceRate: number,
  followUpOverdue: boolean,
  trainingNeeds: string[],
): string {
  if (status === "never") {
    return `${name} has no supervision recorded. This is a regulatory and safeguarding concern. Arrange supervision within the next 7 days and ensure ongoing regularity is built into the rota.`;
  }
  if (status === "overdue") {
    return `${name}'s supervision is overdue. Arrange immediately — an overdue supervision means we don't know how this member of staff is doing, and we can't assure practice quality.`;
  }
  if (wellbeing !== null && wellbeing <= 2) {
    return `${name} showed a low wellbeing score (${wellbeing}/5) in their last supervision. Arrange a wellbeing check-in before the next scheduled supervision. Is this person at risk of burnout? Have they been offered the EAP?`;
  }
  if (overdueActionCount >= 2) {
    return `${name} has ${overdueActionCount} overdue supervision actions. In the next session: review each action, identify barriers, and either reassign or recommit to realistic timescales. Actions left unresolved undermine trust.`;
  }
  if (paceRate < 40) {
    return `PACE is rarely referenced in ${name}'s supervision records. Explore in the next session: is this a recording gap, or are therapeutic principles not featuring enough in practice discussions? Reflection on PACE should be routine.`;
  }
  if (followUpOverdue) {
    return `${name} has an overdue follow-up from a previous supervision. Schedule the check-in this week — follow-ups signal that the manager keeps their commitments too.`;
  }
  if (trainingNeeds.length > 0) {
    return `${name} has unmet training needs: ${trainingNeeds.slice(0, 2).join(", ")}. Discuss in next supervision whether a plan is in place to address these.`;
  }
  if (signal === "excellent") {
    return `${name}'s supervision picture is excellent — current, high wellbeing, confident, and reflective. In supervision, explore what's sustaining this and whether ${name} could support or mentor others.`;
  }
  return `${name}'s supervision is on track. Use the next session to deepen reflective practice and ensure PACE examples are being captured as evidence of therapeutic culture.`;
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const [reflectiveSupervisionsList, staffList] = await Promise.all([
      dal.reflectiveSupervisions.findAll(),
      dal.staff.findAll(),
    ]);
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const staff = (staffList ?? []) as Array<{
    id: string; full_name: string; first_name: string; last_name: string;
    job_title: string; employment_status: string;
  }>;

  const supervisions = (reflectiveSupervisionsList ?? []) as Array<{
    id: string;
    staff_id: string;
    staff_name?: string | null;
    date: string;
    wellbeing_score: number | null;
    confidence_level: number;
    pace_examples: string;
    training_needs: string[];
    actions: Array<{ action: string; owner?: string | null; due?: string | null; done?: boolean }>;
    follow_up_date: string | null;
  }>;

  const activeStaff = staff.filter((s) => s.employment_status === "active");

  // Index supervisions by staff, sorted by date desc
  const supsByStaff = new Map<string, typeof supervisions>();
  for (const s of supervisions) {
    const arr = supsByStaff.get(s.staff_id) ?? [];
    arr.push(s);
    supsByStaff.set(s.staff_id, arr);
  }
  for (const [, arr] of supsByStaff) {
    arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // ── Per-staff profiles ────────────────────────────────────────────────────
  const staffProfiles: StaffSupervisionProfile[] = activeStaff.map((member) => {
    const sups = supsByStaff.get(member.id) ?? [];
    const latest = sups[0] ?? null;

    const daysSince = latest
      ? Math.floor((now.getTime() - new Date(latest.date).getTime()) / (24 * 60 * 60 * 1000))
      : null;

    const status = supervisionStatus(daysSince);

    const wellbeingScores = sups.map((s) => s.wellbeing_score).filter((s) => s != null);
    const latestWellbeing = wellbeingScores[0] ?? null;
    const wTrend = wellbeingTrend(wellbeingScores.slice(0, 3).reverse());

    const latestConfidence = latest?.confidence_level ?? null;

    // PACE engagement rate
    const supsWithPace = sups.filter((s) => paceEngaged(s.pace_examples));
    const paceRate = sups.length > 0 ? Math.round((supsWithPace.length / sups.length) * 100) : null;

    // Overdue actions (across all supervisions)
    const overdueActions: OverdueAction[] = sups.flatMap((s) =>
      (s.actions ?? [])
        .filter((a) => !a.done && a.due && a.due < todayStr)
        .map((a) => ({
          action: a.action,
          due: a.due as string,
          owner: a.owner ?? "Not assigned",
        }))
    );

    // Training needs from last 2 supervisions
    const recentNeeds = [...new Set(sups.slice(0, 2).flatMap((s) => s.training_needs ?? []))];

    // Follow-up overdue
    const followUpOverdue = !!(latest?.follow_up_date && latest.follow_up_date < todayStr);

    const signal = buildSignal(status, latestWellbeing, latestConfidence, overdueActions.length, (paceRate ?? 0), followUpOverdue);

    return {
      staffId: member.id,
      staffName: member.full_name || `${member.first_name} ${member.last_name}`,
      jobTitle: member.job_title,
      supervisionCount: sups.length,
      daysSinceLastSupervision: daysSince,
      supervisionStatus: status,
      latestWellbeingScore: latestWellbeing,
      wellbeingTrend: wTrend,
      latestConfidenceScore: latestConfidence,
      paceEngagementRate: paceRate,
      overdueActions,
      overdueActionCount: overdueActions.length,
      trainingNeeds: recentNeeds,
      followUpOverdue,
      signal,
      supervisionPrompt: buildPrompt(
        member.first_name, signal, status, latestWellbeing,
        overdueActions.length, (paceRate ?? 0), followUpOverdue, recentNeeds,
      ),
    };
  });

  // Sort: at_risk → developing → good → excellent
  const SIGNAL_ORDER: Record<SupervisionSignal, number> = {
    at_risk: 0, developing: 1, good: 2, excellent: 3,
  };
  staffProfiles.sort((a, b) => SIGNAL_ORDER[a.signal] - SIGNAL_ORDER[b.signal]);

  // ── Home summary ──────────────────────────────────────────────────────────
  const statusCounts = staffProfiles.reduce(
    (acc, p) => { acc[p.supervisionStatus]++; return acc; },
    { current: 0, due_soon: 0, overdue: 0, never: 0 } as Record<SupervisionStatus, number>,
  );

  const atRisk = staffProfiles.filter((p) => p.signal === "at_risk").length;
  const totalOverdueActions = staffProfiles.reduce((s, p) => s + p.overdueActionCount, 0);

  const wellbeingScoresAll = staffProfiles.map((p) => p.latestWellbeingScore).filter((s): s is number => s !== null);
  const avgWellbeing = wellbeingScoresAll.length > 0
    ? Math.round((wellbeingScoresAll.reduce((a, b) => a + b, 0) / wellbeingScoresAll.length) * 10) / 10
    : null;

  const currentRate = activeStaff.length > 0
    ? Math.round((statusCounts.current / activeStaff.length) * 100)
    : null;

  const ofstedNote =
    statusCounts.never > 0
      ? `${statusCounts.never} staff member${statusCounts.never > 1 ? "s" : ""} have never had a recorded supervision. This is a regulatory concern — arrange immediately.`
      : statusCounts.overdue > 0
      ? `${statusCounts.overdue} staff member${statusCounts.overdue > 1 ? "s are" : " is"} overdue for supervision. Ofsted inspect supervision regularity as evidence of safe management practice.`
      : totalOverdueActions > 0
      ? `${totalOverdueActions} supervision action${totalOverdueActions > 1 ? "s are" : " is"} overdue. Supervision is only as good as the follow-through on agreed actions.`
      : (currentRate ?? 0) >= 90 && avgWellbeing !== null && avgWellbeing >= 4
      ? `${currentRate}% of staff have current supervision. Average wellbeing score is ${avgWellbeing}/5 — a strong picture of a supportive management culture.`
      : `${currentRate}% of staff have had supervision in the last 28 days. Regular supervision is the foundation of safe, therapeutic residential care.`;

  const summary: SupervisionQualitySummary = {
    totalActiveStaff: activeStaff.length,
    staffWithCurrentSupervision: statusCounts.current,
    staffDueSoon: statusCounts.due_soon,
    staffOverdue: statusCounts.overdue,
    staffNeverSupervised: statusCounts.never,
    currentSupervisionRate: currentRate,
    averageWellbeingScore: avgWellbeing,
    totalOverdueActions,
    staffAtRisk: atRisk,
    ofstedNote,
  };

  return NextResponse.json({ data: { staffProfiles, summary } });
}
