// CARA INTELLIGENCE — PACE child profile API ("what works for this child")
//   GET  /api/v1/pace/child-profile?childId=…   (requires view_young_people)
//   PUT  /api/v1/pace/child-profile { childId, … } (requires edit_young_people)
// Permission-controlled + auditable (updatedBy/updatedAt). Sensitive child data.
import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import type { ChildPACEProfile } from "@/lib/cara-intelligence/pace";

export const dynamic = "force-dynamic";

function arr(v: unknown, fallback: string[] = []): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : fallback;
}

export function GET(req: Request) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_YOUNG_PEOPLE);
  if (auth instanceof NextResponse) return auth;
  const childId = new URL(req.url).searchParams.get("childId");
  if (!childId) return NextResponse.json({ error: "childId is required" }, { status: 400 });
  return NextResponse.json({ data: { childId, profile: db.childPaceProfiles.findByChild(childId) ?? null } });
}

export async function PUT(req: Request) {
  const auth = requirePermission(req, PERMISSIONS.EDIT_YOUNG_PEOPLE);
  if (auth instanceof NextResponse) return auth;
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const childId = String(body.childId ?? "");
  if (!childId) return NextResponse.json({ error: "childId is required" }, { status: 400 });

  const existing = db.childPaceProfiles.findByChild(childId);
  const profile: ChildPACEProfile = {
    childId,
    homeId: String(body.homeId ?? existing?.homeId ?? "home_oak"),
    knownTriggers: arr(body.knownTriggers, existing?.knownTriggers),
    calmingApproaches: arr(body.calmingApproaches, existing?.calmingApproaches),
    trustedAdults: arr(body.trustedAdults, existing?.trustedAdults),
    phrasesThatHelp: arr(body.phrasesThatHelp, existing?.phrasesThatHelp),
    phrasesThatEscalate: arr(body.phrasesThatEscalate, existing?.phrasesThatEscalate),
    sensoryNeeds: arr(body.sensoryNeeds, existing?.sensoryNeeds),
    repairApproaches: arr(body.repairApproaches, existing?.repairApproaches),
    preferredDebriefStyle: body.preferredDebriefStyle != null ? String(body.preferredDebriefStyle) : existing?.preferredDebriefStyle ?? null,
    traumaInformedStrategies: arr(body.traumaInformedStrategies, existing?.traumaInformedStrategies),
    riskLinkedEscalationRules: arr(body.riskLinkedEscalationRules, existing?.riskLinkedEscalationRules),
    updatedBy: auth.userId,
    updatedAt: new Date().toISOString(),
  };
  const saved = db.childPaceProfiles.upsert(profile);
  return NextResponse.json({ data: saved }, { status: existing ? 200 : 201 });
}

// PATCH behaves identically to PUT (upsert) — the app's api client uses PATCH.
export const PATCH = PUT;
