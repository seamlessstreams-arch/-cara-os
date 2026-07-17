// ══════════════════════════════════════════════════════════════════════════════
// CARA — EDUCATION DISRUPTION (§5.18 / doctrine 1.17)
//
// GET /api/v1/education-disruption            → whole-home rollup
// GET /api/v1/education-disruption?child_id=… → one child's read
//
// Read-only projection over educationRecords + pepRecords. School instability
// is a care-planning event: suspensions prompt interim-PEP consideration,
// managed moves that read as trials get scrutiny, informal send-homes surface
// as prohibited practice. Prompts with statutory basis — never determinations.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { getYPName } from "@/lib/seed-data";
import {
  readEducationDisruption,
  buildEducationDisruptionOverview,
  STATUTORY_BASIS,
  type DisruptionEducationRecord,
  type DisruptionPepRecord,
} from "@/lib/education-disruption/education-disruption-engine";

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
    const edu = (store.educationRecords ?? []) as unknown as DisruptionEducationRecord[];
    const peps = (store.pepRecords ?? []) as unknown as DisruptionPepRecord[];

    const readFor = (id: string, name: string) =>
      readEducationDisruption({ childId: id, childName: name, now, educationRecords: edu, pepRecords: peps });

    if (childId) {
      return NextResponse.json({ data: { ...readFor(childId, getYPName(childId)), statutoryBasis: STATUTORY_BASIS } });
    }

    const children = (store.youngPeople ?? []).filter((yp) => yp.status === "current");
    const reads = children.map((yp) => readFor(yp.id, yp.preferred_name || yp.first_name || "Child"));
    return NextResponse.json({ data: { ...buildEducationDisruptionOverview(reads), statutoryBasis: STATUTORY_BASIS } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
