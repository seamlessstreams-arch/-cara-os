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
import { dal } from "@/lib/db";
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

    const [educationRecordsList, pepRecordsList, youngPeopleList] = await Promise.all([
      dal.educationRecords.findAll(),
      dal.pepRecords.findAll(),
      dal.youngPeople.findAll(),
    ]);
    const now = new Date().toISOString();
    const edu = (educationRecordsList ?? []) as unknown as DisruptionEducationRecord[];
    const peps = (pepRecordsList ?? []) as unknown as DisruptionPepRecord[];

    const readFor = (id: string, name: string) =>
      readEducationDisruption({ childId: id, childName: name, now, educationRecords: edu, pepRecords: peps });

    if (childId) {
      return NextResponse.json({ data: { ...readFor(childId, getYPName(childId)), statutoryBasis: STATUTORY_BASIS } });
    }

    const children = (youngPeopleList ?? []).filter((yp) => yp.status === "current");
    const reads = children.map((yp) => readFor(yp.id, yp.preferred_name || yp.first_name || "Child"));
    return NextResponse.json({ data: { ...buildEducationDisruptionOverview(reads), statutoryBasis: STATUTORY_BASIS } });
  } catch (error: unknown) {
    console.error("[api] unhandled route error:", error);
    const message = "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
