// ══════════════════════════════════════════════════════════════════════════════
// CARA — QUALITY-GATE ENFORCEMENT (pure engine)
//
// evaluateTransition(input) decides whether a proposed record transition is
// allowed, and if not, exactly what is missing. buildGateBoard(input) runs every
// open record against its natural closing transition so a manager can see what is
// stuck and why. Pure — no store, no model. The route enforces by refusing a
// blocked transition (HTTP 422).
// ══════════════════════════════════════════════════════════════════════════════

import {
  QUALITY_GATES_VERSION,
  type GateBlock,
  type GateBoard,
  type GateBoardEntry,
  type GateBoardInput,
  type GateDecision,
  type GateIncident,
  type GateKind,
  type GateMissingEpisode,
  type GateRestraint,
  type GateTask,
  type GateTransition,
} from "./types";

const DISCLAIMER =
  "A quality gate refuses an unsafe transition and names what is needed — it never judges whether the practice is good enough, and it never changes a record. Completing the requirement clears the gate.";

/** Statuses that count as "closing / finalising" a record. */
const CLOSING_INCIDENT = new Set(["closed", "resolved"]);
const REVIEWED_RESTRAINT = new Set(["reviewed", "signed_off", "closed"]);
const CLOSING_MISSING = new Set(["closed", "resolved", "returned"]);
const COMPLETE_TASK = new Set(["completed", "done", "signed_off"]);

// ── Per-gate requirement checks ───────────────────────────────────────────────

export function checkIncidentClose(inc: GateIncident): GateBlock[] {
  if (inc.requires_oversight && !inc.has_oversight) {
    return [
      {
        requirement: "Management oversight recorded",
        reason: "This incident requires management oversight and none is recorded. Closing it now would leave the oversight gap permanently in the record.",
        howToResolve: "Complete the manager oversight (findings, actions, lessons) before closing the incident.",
        statutoryBasis: "Children's Homes (England) Regulations 2015, Reg 13 — leadership & management oversight.",
      },
    ];
  }
  return [];
}

export function checkRestraintReview(rst: GateRestraint): GateBlock[] {
  if (!rst.child_debriefed) {
    return [
      {
        requirement: "Child debrief recorded",
        reason: "A restraint cannot be signed off as reviewed until the child has been given the opportunity to talk about it and that conversation is recorded.",
        howToResolve: "Hold and record the child's debrief, then complete the review.",
        statutoryBasis: "Children's Homes (England) Regulations 2015, Reg 20 — the child must be able to discuss the use of restraint.",
      },
    ];
  }
  return [];
}

export function checkMissingEpisodeClose(m: GateMissingEpisode): GateBlock[] {
  if (!m.has_return_interview) {
    return [
      {
        requirement: "Independent return home interview offered",
        reason: "A missing episode cannot be closed until an independent return home interview has been offered and recorded — it is a key safeguarding safeguard.",
        howToResolve: "Offer and record the independent return home interview before closing the episode.",
        statutoryBasis: "Statutory Guidance on Children Who Run Away or Go Missing from Home or Care (2014) — independent return interview.",
      },
    ];
  }
  return [];
}

export function checkTaskComplete(t: GateTask): GateBlock[] {
  if (t.requires_sign_off && !t.signed_off) {
    return [
      {
        requirement: "Sign-off recorded",
        reason: "This task requires sign-off and none is recorded. Marking it complete would bypass the required assurance.",
        howToResolve: "Obtain and record the sign-off, then mark the task complete.",
        statutoryBasis: "Children's Homes (England) Regulations 2015, Reg 13 — effective monitoring and assurance.",
      },
    ];
  }
  return [];
}

// ── Transition dispatch ───────────────────────────────────────────────────────

export interface TransitionInput {
  recordType: "incidents" | "restraints" | "missingEpisodes" | "tasks";
  targetStatus: string;
  incident?: GateIncident;
  restraint?: GateRestraint;
  missingEpisode?: GateMissingEpisode;
  task?: GateTask;
}

/** Decide whether a proposed transition is allowed. A transition that is NOT a
 *  gated closing/finalising move is always allowed — gates never block routine
 *  edits, only the finalising step. */
export function evaluateTransition(input: TransitionInput): GateDecision {
  let gate: GateKind | null = null;
  let blocks: GateBlock[] = [];
  const to = input.targetStatus;
  let transition: GateTransition = { recordType: input.recordType, recordId: "", from: "", to };

  if (input.recordType === "incidents" && input.incident && CLOSING_INCIDENT.has(to)) {
    gate = "incident_close";
    blocks = checkIncidentClose(input.incident);
    transition = { recordType: "incidents", recordId: input.incident.id, childId: input.incident.child_id, from: input.incident.status, to };
  } else if (input.recordType === "restraints" && input.restraint && REVIEWED_RESTRAINT.has(to)) {
    gate = "restraint_review";
    blocks = checkRestraintReview(input.restraint);
    transition = { recordType: "restraints", recordId: input.restraint.id, childId: input.restraint.child_id, from: input.restraint.review_status, to };
  } else if (input.recordType === "missingEpisodes" && input.missingEpisode && CLOSING_MISSING.has(to)) {
    gate = "missing_episode_close";
    blocks = checkMissingEpisodeClose(input.missingEpisode);
    transition = { recordType: "missingEpisodes", recordId: input.missingEpisode.id, childId: input.missingEpisode.child_id, from: input.missingEpisode.status, to };
  } else if (input.recordType === "tasks" && input.task && COMPLETE_TASK.has(to)) {
    gate = "task_complete";
    blocks = checkTaskComplete(input.task);
    transition = { recordType: "tasks", recordId: input.task.id, childId: input.task.child_id, from: input.task.status, to };
  }

  return { allowed: blocks.length === 0, gate, transition, blocks };
}

// ── Gate board — every open record against its natural closing move ────────────

export function buildGateBoard(input: GateBoardInput): GateBoard {
  const entries: GateBoardEntry[] = [];

  for (const inc of input.incidents) {
    if (CLOSING_INCIDENT.has(inc.status)) continue; // already closed
    const blocks = checkIncidentClose(inc);
    entries.push({ gate: "incident_close", recordType: "incidents", recordId: inc.id, childId: inc.child_id, currentStatus: inc.status, proposedTransition: "close", blocked: blocks.length > 0, blocks });
  }
  for (const rst of input.restraints) {
    if (REVIEWED_RESTRAINT.has(rst.review_status)) continue;
    const blocks = checkRestraintReview(rst);
    entries.push({ gate: "restraint_review", recordType: "restraints", recordId: rst.id, childId: rst.child_id, currentStatus: rst.review_status, proposedTransition: "sign off review", blocked: blocks.length > 0, blocks });
  }
  for (const m of input.missingEpisodes) {
    if (CLOSING_MISSING.has(m.status)) continue;
    const blocks = checkMissingEpisodeClose(m);
    entries.push({ gate: "missing_episode_close", recordType: "missingEpisodes", recordId: m.id, childId: m.child_id, currentStatus: m.status, proposedTransition: "close", blocked: blocks.length > 0, blocks });
  }
  for (const t of input.tasks) {
    if (COMPLETE_TASK.has(t.status)) continue;
    if (!t.requires_sign_off) continue; // only sign-off tasks are gated
    const blocks = checkTaskComplete(t);
    entries.push({ gate: "task_complete", recordType: "tasks", recordId: t.id, childId: t.child_id, currentStatus: t.status, proposedTransition: "complete", blocked: blocks.length > 0, blocks });
  }

  // Blocked first.
  entries.sort((a, b) => Number(b.blocked) - Number(a.blocked));

  const blocked = entries.filter((e) => e.blocked);
  const byGate: Partial<Record<GateKind, number>> = {};
  for (const e of blocked) byGate[e.gate] = (byGate[e.gate] ?? 0) + 1;

  return {
    homeId: input.homeId,
    asOf: input.asOf,
    entries,
    summary: { total: entries.length, blocked: blocked.length, byGate },
    disclaimer: DISCLAIMER,
    engineVersion: QUALITY_GATES_VERSION,
  };
}

export { QUALITY_GATES_VERSION };
