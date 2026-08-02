// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEDICATION ERROR PATTERN INTELLIGENCE
// GET /api/v1/medication-error-pattern-intelligence
//
// Analyses the home's real medication error record to surface recurring
// patterns, outstanding duty-of-candour obligations, pending remedial actions,
// and child-specific risk signals.
//
// Medication errors are among the most visible areas of Ofsted inspection.
// The test is not whether errors occurred, but whether the home:
//   (a) identified and reported them promptly
//   (b) enacted duty of candour
//   (c) completed remedial actions and learned from them
//   (d) broke recurring patterns rather than repeating the same mistakes
//
// All deterministic. No LLM calls.
// Sources: medicationErrorsList, youngPeopleList
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import type { MedicationError } from "@/types/extended";

// ── Types ─────────────────────────────────────────────────────────────────────

type ErrorSignal = "alert" | "attention" | "monitoring" | "safe";

interface PendingAction {
  action: string;
  owner: string;
  dueDate: string;
  overdue: boolean;
}

interface ChildErrorProfile {
  childId: string;
  childName: string;
  totalErrors: number;
  last30dErrors: number;
  severityBreakdown: Record<string, number>;
  mostCommonErrorType: string | null;
  openDoC: boolean;
  docCompletionDate: string | null;
  pendingActions: PendingAction[];
  openOrActiveErrors: number;
  recentMedications: string[];
  signal: ErrorSignal;
  supervisionPrompt: string;
}

interface HomePattern {
  factorLabel: string;
  count: number;
}

interface MedicationErrorSummary {
  totalErrors: number;
  last30dErrors: number;
  openErrors: number;
  moderateOrSevereCount: number;
  openDoCCount: number;
  overdueActionsCount: number;
  topContributingFactors: HomePattern[];
  recurringErrorTypes: HomePattern[];
  eveningRoundRisk: boolean;
  ofstedNote: string;
}

interface MedicationErrorPatternResponse {
  data: {
    childProfiles: ChildErrorProfile[];
    summary: MedicationErrorSummary;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function signalFor(
  last30d: number,
  openOrActive: number,
  openDoC: boolean,
  pendingOverdue: PendingAction[],
  hasModeratePlus: boolean,
): ErrorSignal {
  if (hasModeratePlus && (openOrActive > 0 || openDoC)) return "alert";
  if (openDoC || pendingOverdue.length > 0) return "attention";
  if (last30d > 0 || openOrActive > 0) return "monitoring";
  return "safe";
}

function buildSupervisionPrompt(
  name: string,
  signal: ErrorSignal,
  totalErrors: number,
  last30d: number,
  openDoC: boolean,
  pendingActions: PendingAction[],
  mostCommon: string | null,
  hasModeratePlus: boolean,
): string {
  if (signal === "alert") {
    return `${name} has had a moderate or severe medication error that remains open or under investigation${openDoC ? ", with duty of candour not yet completed" : ""}. This requires immediate management focus. In supervision: what is the current status of the investigation? Has duty of candour been offered to the child and family? Are all relevant staff receiving support?`;
  }
  if (openDoC) {
    return `${name} has an outstanding duty of candour obligation from a medication error. In supervision: when will this be completed and who is responsible? Duty of candour must be offered to the child and their family promptly.`;
  }
  if (pendingActions.length > 0 && pendingActions.some((a) => a.overdue)) {
    return `${name} has overdue remedial actions from medication error(s). In supervision: review who owns the outstanding actions and set a firm deadline. Uncompleted actions increase the risk of recurrence.`;
  }
  if (last30d > 0) {
    return `${name} has had ${last30d} medication error${last30d > 1 ? "s" : ""} in the last 30 days${mostCommon ? ` (most common: ${mostCommon.replace(/_/g, " ")})` : ""}. In supervision: review whether the same contributing factors are recurring and whether the remedial actions from previous errors were sufficient.`;
  }
  if (totalErrors === 0) {
    return `${name} has no medication errors on record. In supervision, explore: are all administrations being documented correctly? Absence of errors can reflect good practice or under-reporting.`;
  }
  return `${name} has ${totalErrors} historical medication error${totalErrors > 1 ? "s" : ""} — all appear closed. In supervision: confirm that lessons learned were shared with the team and that there has been no recurrence.`;
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const [medicationErrorsList, youngPeopleList] = await Promise.all([
      dal.medicationErrors.findAll(),
      dal.youngPeople.findAll(),
    ]);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const cutoff30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const youngPeople = (youngPeopleList ?? []) as Array<{
    id: string; first_name: string; last_name: string; status: string;
  }>;

  const errors = ((medicationErrorsList ?? []) as unknown) as MedicationError[];

  const currentChildren = youngPeople.filter((yp) => yp.status === "current");

  // Index errors by child
  const errorsByChild = new Map<string, MedicationError[]>();
  for (const e of errors) {
    const arr = errorsByChild.get(e.child_id) ?? [];
    arr.push(e);
    errorsByChild.set(e.child_id, arr);
  }

  // ── Per-child profiles ────────────────────────────────────────────────────
  const childProfiles: ChildErrorProfile[] = currentChildren.map((yp) => {
    const childErrors = errorsByChild.get(yp.id) ?? [];

    const last30dErrors = childErrors.filter(
      (e) => new Date(e.date_occurred) >= cutoff30d,
    ).length;

    const severityBreakdown: Record<string, number> = {};
    for (const e of childErrors) {
      severityBreakdown[e.severity] = (severityBreakdown[e.severity] ?? 0) + 1;
    }

    const errorTypeCounts: Record<string, number> = {};
    for (const e of childErrors) {
      errorTypeCounts[e.error_type] = (errorTypeCounts[e.error_type] ?? 0) + 1;
    }
    const mostCommonErrorType = childErrors.length > 0
      ? Object.entries(errorTypeCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null;

    // Duty of candour: required (duty_of_candour=true) but not completed
    const openDoCErrors = childErrors.filter(
      (e) => e.duty_of_candour && !e.duty_of_candour_completed,
    );
    const openDoC = openDoCErrors.length > 0;
    const docCompletionDate = childErrors
      .filter((e) => e.duty_of_candour_completed)
      .sort((a, b) =>
        new Date(b.duty_of_candour_completed!).getTime() -
        new Date(a.duty_of_candour_completed!).getTime()
      )[0]?.duty_of_candour_completed ?? null;

    // Pending remedial actions
    const pendingActions: PendingAction[] = [];
    for (const e of childErrors) {
      for (const action of e.remedial_actions) {
        if (action.status !== "completed") {
          pendingActions.push({
            action: action.action,
            owner: action.owner,
            dueDate: action.due_date,
            overdue: action.due_date < today,
          });
        }
      }
    }

    const openOrActiveErrors = childErrors.filter(
      (e) => e.status !== "closed",
    ).length;

    const recentMedications = [
      ...new Set(childErrors.map((e) => e.medication)),
    ].slice(0, 4);

    const hasModeratePlus = childErrors.some(
      (e) => e.severity === "moderate" || e.severity === "severe" || e.severity === "death",
    );

    const signal = signalFor(
      last30dErrors,
      openOrActiveErrors,
      openDoC,
      pendingActions.filter((a) => a.overdue),
      hasModeratePlus,
    );

    return {
      childId: yp.id,
      childName: `${yp.first_name} ${yp.last_name}`,
      totalErrors: childErrors.length,
      last30dErrors,
      severityBreakdown,
      mostCommonErrorType,
      openDoC,
      docCompletionDate,
      pendingActions,
      openOrActiveErrors,
      recentMedications,
      signal,
      supervisionPrompt: buildSupervisionPrompt(
        yp.first_name,
        signal,
        childErrors.length,
        last30dErrors,
        openDoC,
        pendingActions,
        mostCommonErrorType,
        hasModeratePlus,
      ),
    };
  });

  // Sort: alert → attention → monitoring → safe
  const SIGNAL_ORDER: Record<ErrorSignal, number> = {
    alert: 0, attention: 1, monitoring: 2, safe: 3,
  };
  childProfiles.sort((a, b) => SIGNAL_ORDER[a.signal] - SIGNAL_ORDER[b.signal]);

  // ── Home-wide patterns ─────────────────────────────────────────────────────
  const allErrors = errors;
  const last30dAll = allErrors.filter(
    (e) => new Date(e.date_occurred) >= cutoff30d,
  ).length;

  const openErrors = allErrors.filter((e) => e.status !== "closed").length;

  const moderateOrSevereCount = allErrors.filter(
    (e) => e.severity === "moderate" || e.severity === "severe" || e.severity === "death",
  ).length;

  const openDoCCount = allErrors.filter(
    (e) => e.duty_of_candour && !e.duty_of_candour_completed,
  ).length;

  let overdueActionsCount = 0;
  for (const e of allErrors) {
    for (const a of e.remedial_actions) {
      if (a.status !== "completed" && a.due_date < today) overdueActionsCount++;
    }
  }

  // Contributing factor frequency
  const factorCounts: Record<string, number> = {};
  for (const e of allErrors) {
    for (const f of e.contributing_factors) {
      const key = f.toLowerCase().trim();
      factorCounts[key] = (factorCounts[key] ?? 0) + 1;
    }
  }
  const topContributingFactors: HomePattern[] = Object.entries(factorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([factorLabel, count]) => ({ factorLabel, count }));

  // Recurring error type distribution
  const errTypeCounts: Record<string, number> = {};
  for (const e of allErrors) {
    errTypeCounts[e.error_type] = (errTypeCounts[e.error_type] ?? 0) + 1;
  }
  const recurringErrorTypes: HomePattern[] = Object.entries(errTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([factorLabel, count]) => ({ factorLabel, count }));

  // Evening round risk: ≥2 errors where time_occurred is between 17:00 and 21:30
  const eveningErrors = allErrors.filter((e) => {
    const h = parseInt(e.time_occurred.slice(0, 2), 10);
    return h >= 17 && h <= 21;
  }).length;
  const eveningRoundRisk = eveningErrors >= 2;

  // Ofsted note
  const ofstedNote =
    openDoCCount > 0
      ? `${openDoCCount} duty of candour obligation${openDoCCount > 1 ? "s" : ""} outstanding. An inspector will ask whether the child and family have been told about the error and what steps were taken.`
      : moderateOrSevereCount > 0
      ? `${moderateOrSevereCount} moderate or severe medication error${moderateOrSevereCount > 1 ? "s" : ""} on record. An inspector will scrutinise investigation quality, remedial actions, and whether lessons were shared with the whole team.`
      : eveningRoundRisk
      ? "Multiple errors occurring during the evening medication round. An inspector will ask what systemic changes the home made to protect this high-risk period."
      : overdueActionsCount > 0
      ? `${overdueActionsCount} remedial action${overdueActionsCount > 1 ? "s" : ""} from medication errors overdue. Incomplete remedial actions undermine the home's evidence of learning and improvement.`
      : `${allErrors.length} medication error${allErrors.length !== 1 ? "s" : ""} on record — all ${openErrors === 0 ? "closed with remedial actions complete" : "being actively managed"}. Be prepared to evidence learning and system changes made.`;

  const summary: MedicationErrorSummary = {
    totalErrors: allErrors.length,
    last30dErrors: last30dAll,
    openErrors,
    moderateOrSevereCount,
    openDoCCount,
    overdueActionsCount,
    topContributingFactors,
    recurringErrorTypes,
    eveningRoundRisk,
    ofstedNote,
  };

  const response: MedicationErrorPatternResponse = {
    data: { childProfiles, summary },
  };

  return NextResponse.json(response);
}
