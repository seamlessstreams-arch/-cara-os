// ══════════════════════════════════════════════════════════════════════════════
// CARA — SILENT STRUGGLE (doctrine 1.5 / 2.2.2)
//
// GET /api/v1/silent-struggle            → whole-home rollup (who is going quiet)
// GET /api/v1/silent-struggle?child_id=… → one child's withdrawal read
//
// Pure projection over daily logs + incident dates + key-work mood. Read only;
// no writes, no flag. Notices the ABSENCE of signal — the child who generates no
// alarm precisely because they have gone quiet.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { getYPName } from "@/lib/seed-data";
import {
  readSilentStruggle,
  buildSilentStruggleOverview,
  type SilentStruggleLogEntry,
} from "@/lib/silent-struggle/silent-struggle-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const childId = new URL(req.url).searchParams.get("child_id");
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const denied = assertChildHomeAccess(identity, childId);
    if (denied) return denied;

    const store = getStore();
    const now = new Date().toISOString();
    const allLogs = (store.dailyLog ?? []) as unknown as SilentStruggleLogEntry[];
    const incidents = store.incidents ?? [];
    const keywork = store.keyWorkingSessions ?? [];

    const readFor = (id: string, name: string) =>
      readSilentStruggle({
        childId: id,
        childName: name,
        now,
        logs: allLogs,
        incidentDates: incidents.filter((i: { child_id: string }) => i.child_id === id).map((i: { date: string }) => i.date),
        keyWorkMoods: keywork
          .filter((k: { child_id: string }) => k.child_id === id)
          .map((k: { date: string; mood_after?: number | null }) => ({ date: k.date, score: k.mood_after ?? null })),
      });

    if (childId) {
      return NextResponse.json({ data: readFor(childId, getYPName(childId)) });
    }

    const children = (store.youngPeople ?? []).filter((yp) => yp.status === "current");
    const reads = children.map((yp) => readFor(yp.id, yp.preferred_name || yp.first_name || "Child"));
    return NextResponse.json({ data: buildSilentStruggleOverview(reads) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
