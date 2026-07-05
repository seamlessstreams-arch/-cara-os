// ══════════════════════════════════════════════════════════════════════════════
// CARA — SELF-HEALING INTEGRITY API
//
// GET                     → scan (read-only) + recent heal-log
// POST { mode: "scan" }   → scan only (read-only)
// POST { mode: "apply" }  → scan, then apply ONLY safe_auto/reversible/non-practice
//                           repairs, appending each to the append-only heal-log.
//
// A scan never mutates. Applying requires explicit intent, and the safety guard
// (selectAutoRepairs) refuses anything that touches a practice record — so a
// mis-classification can never leak a practice mutation.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { readJsonBody } from "@/lib/http/read-json";
import { generateId } from "@/lib/utils";
import { runSelfHealingScan, selectAutoRepairs } from "@/lib/self-healing/self-healing-engine";
import type { HealEvent, IntegrityRepair, SelfHealingInput } from "@/lib/self-healing/types";

export const dynamic = "force-dynamic";

function buildInput(store: ReturnType<typeof getStore>): SelfHealingInput {
  return {
    homeId: "home_oak",
    asOf: new Date().toISOString().slice(0, 10),
    childIds: ((store.youngPeople ?? []) as Array<{ id: string }>).map((c) => String(c.id)),
    incidents: ((store.incidents ?? []) as Array<Record<string, unknown>>).map((i) => ({
      id: String(i.id),
      linked_task_ids: Array.isArray(i.linked_task_ids) ? (i.linked_task_ids as unknown[]).map(String) : [],
      child_id: i.child_id ? String(i.child_id) : undefined,
    })),
    tasks: ((store.tasks ?? []) as Array<Record<string, unknown>>).map((t) => ({
      id: String(t.id),
      linked_incident_id: t.linked_incident_id ? String(t.linked_incident_id) : undefined,
      child_id: t.linked_child_id ? String(t.linked_child_id) : undefined,
    })),
  };
}

/** Apply a single safe_auto repair to the live store. Only missing_back_link is
 *  ever eligible (the engine's only safe_auto kind), and it only ADDS a mirror to
 *  a derived index — it never changes practice content. Returns the HealEvent, or
 *  null if the target isn't found / the mirror is already present. */
function applyRepair(store: ReturnType<typeof getStore>, repair: IntegrityRepair, appliedBy: string): HealEvent | null {
  if (repair.kind !== "missing_back_link" || !repair.relatedRecordId) return null;
  const inc = ((store.incidents ?? []) as Array<Record<string, unknown>>).find((i) => String(i.id) === repair.recordId);
  if (!inc) return null;
  const list = Array.isArray(inc.linked_task_ids) ? (inc.linked_task_ids as unknown[]).map(String) : [];
  if (list.includes(repair.relatedRecordId)) return null; // already mirrored — nothing to do
  const before = `linked_task_ids=[${list.map((t) => `"${t}"`).join(", ")}]`;
  const next = [...list, repair.relatedRecordId];
  inc.linked_task_ids = next;
  const after = `linked_task_ids=[${next.map((t) => `"${t}"`).join(", ")}]`;
  return {
    id: generateId("heal"),
    at: new Date().toISOString(),
    repairId: repair.id,
    kind: repair.kind,
    recordType: repair.recordType,
    recordId: repair.recordId,
    before,
    after,
    appliedBy,
  };
}

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const store = getStore();
    const plan = runSelfHealingScan(buildInput(store));
    const healLog = ((store.integrityHealEvents ?? []) as HealEvent[]).slice(-25).reverse();
    return NextResponse.json({ data: { plan, healLog } });
  } catch (err) {
    console.error("[self-healing] scan failed", err);
    return NextResponse.json({ error: "Failed to run integrity scan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const jb = await readJsonBody(req);
    if (!jb.ok) return jb.response;
    const body = jb.data as { mode?: string };

    const store = getStore();
    const plan = runSelfHealingScan(buildInput(store));

    if (body?.mode !== "apply") {
      return NextResponse.json({ data: { plan } });
    }

    // Apply path — guarded selection only.
    const { apply, skip } = selectAutoRepairs(plan);
    const appliedBy = String(identity.userId || "system");
    const applied: HealEvent[] = [];
    for (const repair of apply) {
      const ev = applyRepair(store, repair, appliedBy);
      if (ev) {
        (store.integrityHealEvents ??= []).push(ev);
        applied.push(ev);
      }
    }
    // Re-scan so the response reflects the healed state.
    const after = runSelfHealingScan(buildInput(store));
    return NextResponse.json({
      data: {
        plan: after,
        applied,
        skipped: skip.map((s) => ({ repairId: s.repair.id, kind: s.repair.kind, reason: s.reason })),
      },
    });
  } catch (err) {
    console.error("[self-healing] apply failed", err);
    return NextResponse.json({ error: "Failed to apply repairs" }, { status: 500 });
  }
}
