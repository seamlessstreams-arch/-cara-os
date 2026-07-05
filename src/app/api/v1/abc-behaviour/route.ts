// ══════════════════════════════════════════════════════════════════════════════
// CARA — ABC BEHAVIOUR PATTERNS API · §16
// GET → per-child Antecedent → Behaviour → Consequence chains over the behaviour
//       log, for the ABC visual. Deterministic; the engine is pure. Reads the
//       same behaviour-log shape as behaviour-trigger-patterns.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { buildABCProfiles } from "@/lib/abc-behaviour/abc-behaviour-engine";
import type { ABCEntryInput } from "@/lib/abc-behaviour/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const store = getStore();
    const asOf = new Date().toISOString().slice(0, 10);

    const children = ((store.youngPeople ?? []) as Array<Record<string, unknown>>)
      .filter((yp) => (yp.status ?? "current") === "current")
      .map((yp) => ({ id: String(yp.id), name: String(yp.preferred_name || yp.first_name || yp.full_name || yp.id) }));

    const entries: ABCEntryInput[] = ((store.behaviourLog ?? []) as Array<Record<string, unknown>>)
      .filter((b) => b.child_id)
      .map((b) => ({
        childId: String(b.child_id),
        date: String(b.date ?? b.created_at ?? ""),
        direction: String(b.direction ?? "concern"),
        intensity: String(b.intensity ?? "low"),
        trigger: String(b.trigger ?? ""),
        antecedent: String(b.antecedent ?? ""),
        strategy: String(b.strategy_used ?? ""),
      }));

    return NextResponse.json({ data: buildABCProfiles({ homeId: "home_oak", asOf, children, entries }) });
  } catch (err) {
    console.error("[abc-behaviour] failed", err);
    return NextResponse.json({ error: "Failed to build ABC patterns" }, { status: 500 });
  }
}
