// ══════════════════════════════════════════════════════════════════════════════
// CARA — Practice Learning API (Layer 5)
//
// GET ?childId=  → retrospective organisational learning for a child, assembled
//                  from their incidents + debriefs. With no childId, learns at
//                  HOME level across all incidents so it is curl-verifiable.
//
// Guarded by VIEW_CARA_INTELLIGENCE. Read-only against the store; no model calls.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { buildLearningInput } from "@/lib/practice-learning/hydrate";
import { learnFromEvents } from "@/lib/practice-learning/learning-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_CARA_INTELLIGENCE);
  if (auth instanceof NextResponse) return auth;

  const today = new Date().toISOString().slice(0, 10);
  const childId = req.nextUrl.searchParams.get("childId") || req.nextUrl.searchParams.get("child_id");
  const debriefs = db.debriefRecords.findAll();

  try {
    let input;
    if (childId) {
      const yp = db.youngPeople.findById(childId);
      if (!yp) return NextResponse.json({ error: "Child not found" }, { status: 404 });
      const incidents = db.incidents.findAll().filter((i) => i.child_id === childId);
      input = buildLearningInput({
        scope: "child",
        childName: yp.preferred_name || yp.first_name,
        incidents,
        debriefs: debriefs.filter((d) => d.child_id === childId),
        today,
      });
    } else {
      input = buildLearningInput({ scope: "home", incidents: db.incidents.findAll(), debriefs, today });
    }
    const learning = learnFromEvents(input);
    return NextResponse.json({ data: { learning } });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate practice learning", details: String(error) },
      { status: 500 },
    );
  }
}
