// ══════════════════════════════════════════════════════════════════════════════
// CARA — SELF-HEALING INTEGRITY ENGINE (pure)
//
// runSelfHealingScan(input) inspects the store's reference graph and proposes
// repairs. It NEVER mutates — a scan is read-only. selectAutoRepairs(plan)
// applies the safety guard: only structurally-safe, reversible, non-practice
// repairs are eligible for auto-apply; everything else is a person's call.
//
// No model calls, no store access — the route feeds it a snapshot.
// ══════════════════════════════════════════════════════════════════════════════

import {
  SELF_HEALING_VERSION,
  type ApplySelection,
  type IntegrityRepair,
  type RepairKind,
  type SelfHealingInput,
  type SelfHealingPlan,
} from "./types";

const DISCLAIMER =
  "Cara repairs only what is structurally safe and reversible — a missing mirror in a derived index. Anything that would change, merge or delete a practice record, or where the right answer is unclear, is left for a person. Cara never auto-changes the meaning of a safeguarding record.";

const RANK: Record<IntegrityRepair["severity"], number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function runSelfHealingScan(input: SelfHealingInput): SelfHealingPlan {
  const childIds = new Set(input.childIds);
  const incidentById = new Map(input.incidents.map((i) => [i.id, i]));
  const repairs: IntegrityRepair[] = [];

  // ── 1. Incident ↔ task back-links ────────────────────────────────────────
  // A task authoritatively declares its incident (task.linked_incident_id). The
  // incident's linked_task_ids is a DERIVED mirror index. If the task points at a
  // real incident that doesn't list it back, restoring the mirror is safe. If the
  // incident lists a task that points at a DIFFERENT incident, that's a conflict a
  // person must resolve — never auto-touched.
  for (const task of input.tasks) {
    const incId = task.linked_incident_id;
    if (!incId) continue;
    const inc = incidentById.get(incId);
    if (!inc) {
      // Task references an incident that doesn't exist → dangling, a person decides.
      repairs.push({
        id: `heal_task_${task.id}_dangling_inc`,
        kind: "conflicting_link",
        classification: "needs_human",
        severity: "high",
        recordType: "tasks",
        recordId: task.id,
        relatedRecordId: incId,
        description: `Task references incident ${incId}, which no longer exists.`,
        rationale: "The referenced incident is missing — a person must decide whether to re-link or clear the reference. Cara will not guess.",
        reversible: false,
        targetIsPractice: true,
        before: `linked_incident_id="${incId}"`,
        after: "(needs a person)",
      });
      continue;
    }
    if (!inc.linked_task_ids.includes(task.id)) {
      // Does the task collide with the incident's existing claims? Only a pure
      // missing-mirror (incident simply doesn't list this task) is safe to restore.
      repairs.push({
        id: `heal_inc_${inc.id}_backlink_${task.id}`,
        kind: "missing_back_link",
        classification: "safe_auto",
        severity: "low",
        recordType: "incidents",
        recordId: inc.id,
        relatedRecordId: task.id,
        childId: task.child_id,
        description: `Incident ${inc.id} is missing its back-link to task ${task.id}, which points at it.`,
        rationale: "The task authoritatively links to this incident; the incident's derived task index simply doesn't mirror it. Restoring the mirror changes no practice content and is reversible.",
        reversible: true,
        targetIsPractice: false,
        before: `linked_task_ids=[${inc.linked_task_ids.map((t) => `"${t}"`).join(", ")}]`,
        after: `linked_task_ids=[${[...inc.linked_task_ids, task.id].map((t) => `"${t}"`).join(", ")}]`,
      });
    }
  }

  // Incident lists a task that disowns it (points at another incident, or nothing).
  const taskById = new Map(input.tasks.map((t) => [t.id, t]));
  for (const inc of input.incidents) {
    for (const taskId of inc.linked_task_ids) {
      const task = taskById.get(taskId);
      if (task && task.linked_incident_id && task.linked_incident_id !== inc.id) {
        repairs.push({
          id: `heal_inc_${inc.id}_conflict_${taskId}`,
          kind: "conflicting_link",
          classification: "needs_human",
          severity: "medium",
          recordType: "incidents",
          recordId: inc.id,
          relatedRecordId: taskId,
          description: `Incident ${inc.id} lists task ${taskId}, but that task links to a different incident (${task.linked_incident_id}).`,
          rationale: "Two records disagree about the link. Cara will not silently pick a winner — a person must confirm which incident the task belongs to.",
          reversible: false,
          targetIsPractice: true,
          before: `incident ${inc.id} ↔ task ${taskId} (task says ${task.linked_incident_id})`,
          after: "(needs a person)",
        });
      }
    }
  }

  // ── 2. Dangling child references ──────────────────────────────────────────
  const childRefCheck = (recordType: string, recs: Array<{ id: string; child_id?: string }>) => {
    for (const r of recs) {
      if (r.child_id && !childIds.has(r.child_id)) {
        repairs.push({
          id: `heal_${recordType}_${r.id}_orphan_child`,
          kind: "dangling_child_reference",
          classification: "needs_human",
          severity: "medium",
          recordType,
          recordId: r.id,
          childId: r.child_id,
          description: `${recordType} record references child ${r.child_id}, who is not on the current roll.`,
          rationale: "The child may have left the home, or the reference may be wrong. Never auto-delete a reference to a child — a person checks.",
          reversible: false,
          targetIsPractice: true,
          before: `child_id="${r.child_id}"`,
          after: "(needs a person)",
        });
      }
    }
  };
  childRefCheck("incidents", input.incidents);
  childRefCheck("tasks", input.tasks);

  // ── 3. Duplicate ids within a collection (corruption) ─────────────────────
  const dupIdCheck = (recordType: string, recs: Array<{ id: string }>) => {
    const seen = new Map<string, number>();
    for (const r of recs) seen.set(r.id, (seen.get(r.id) ?? 0) + 1);
    for (const [id, n] of seen) {
      if (n > 1) {
        repairs.push({
          id: `heal_${recordType}_${id}_dupid`,
          kind: "duplicate_id",
          classification: "needs_human",
          severity: "critical",
          recordType,
          recordId: id,
          description: `${n} ${recordType} records share the id ${id}.`,
          rationale: "Colliding ids are data corruption. Cara flags it loudly but never auto-merges or deletes practice records — a person resolves it.",
          reversible: false,
          targetIsPractice: true,
          before: `${n} records with id="${id}"`,
          after: "(needs a person)",
        });
      }
    }
  };
  dupIdCheck("incidents", input.incidents);
  dupIdCheck("tasks", input.tasks);

  repairs.sort((a, b) => RANK[a.severity] - RANK[b.severity]);

  const byKind: Partial<Record<RepairKind, number>> = {};
  let safeAuto = 0;
  let needsHuman = 0;
  for (const r of repairs) {
    byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;
    if (r.classification === "safe_auto") safeAuto++;
    else needsHuman++;
  }

  return {
    homeId: input.homeId,
    asOf: input.asOf,
    repairs,
    summary: { total: repairs.length, safeAuto, needsHuman, byKind },
    disclaimer: DISCLAIMER,
    engineVersion: SELF_HEALING_VERSION,
  };
}

// ── The safety guard ──────────────────────────────────────────────────────────
// Only repairs that are safe_auto AND reversible AND explicitly not a practice
// target are eligible. The triple check is deliberate belt-and-braces: even a
// mis-classified repair (safe_auto but targetIsPractice=true) is refused here, so
// a single wrong label can never leak a practice mutation into the apply path.
export function selectAutoRepairs(plan: SelfHealingPlan): ApplySelection {
  const apply: IntegrityRepair[] = [];
  const skip: ApplySelection["skip"] = [];
  for (const r of plan.repairs) {
    if (r.classification !== "safe_auto") {
      skip.push({ repair: r, reason: "Needs a person — not eligible for auto-repair." });
    } else if (r.targetIsPractice) {
      skip.push({ repair: r, reason: "Refused: labelled safe_auto but targets a practice record." });
    } else if (!r.reversible) {
      skip.push({ repair: r, reason: "Refused: not reversible, so not auto-applied." });
    } else {
      apply.push(r);
    }
  }
  return { apply, skip };
}

export { SELF_HEALING_VERSION };
