// ══════════════════════════════════════════════════════════════════════════════
// CARA — Practice Reasoning API (Layer 3)
//
// GET ?childId=  → deterministic practice reasoning for a child, assembled from
//                  their real records. With no childId, reasons over the first
//                  young person so the endpoint is curl-verifiable anywhere.
//
// Guarded by VIEW_CARA_INTELLIGENCE. Read-only against the store; no model calls
// (enhanced reflective drafting is only RECOMMENDED, via the LLM gatekeeper).
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db/store";
import { dal } from "@/lib/db/dal";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { buildReasoningSignals } from "@/lib/cara-reasoning/hydrate";
import { reasonOverChild } from "@/lib/cara-reasoning/practice-reasoning-engine";

export const dynamic = "force-dynamic";

// Read a dal collection defensively: on a live tenant a transient query failure
// must degrade to an empty section, never 500 the whole route.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_CARA_INTELLIGENCE);
  if (auth instanceof NextResponse) return auth;

  const today = new Date().toISOString().slice(0, 10);
  const youngPeople = await safeList(dal.youngPeople.findAll());
  const childId =
    req.nextUrl.searchParams.get("childId") ||
    req.nextUrl.searchParams.get("child_id") ||
    youngPeople[0]?.id;

  if (!childId) {
    return NextResponse.json({ error: "No child available to reason over" }, { status: 404 });
  }

  const youngPerson = db.youngPeople.findById(childId);
  if (!youngPerson) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const incidents = db.incidents.findAll().filter((i) => i.child_id === childId);
  const dailyLogs = db.dailyLog.findByChild(childId);
  const chronology = db.chronology.findByChild(childId);

  try {
    const signals = buildReasoningSignals({ childId, youngPerson, incidents, dailyLogs, chronology, today });
    const reasoning = reasonOverChild(signals);
    // A lightweight child list powers the page's picker in the same call.
    const children = youngPeople
      .filter((yp) => yp.status === "current" || yp.status === "planned")
      .map((yp) => ({ id: yp.id, name: yp.preferred_name || yp.first_name || "Unknown" }));
    const child = { id: childId, name: signals.childName };
    return NextResponse.json({ data: { child, children, signals, reasoning } });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate practice reasoning", details: String(error) },
      { status: 500 },
    );
  }
}
