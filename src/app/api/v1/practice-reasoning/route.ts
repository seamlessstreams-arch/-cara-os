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
import { db, getStore } from "@/lib/db/store";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { buildReasoningSignals } from "@/lib/cara-reasoning/hydrate";
import { reasonOverChild } from "@/lib/cara-reasoning/practice-reasoning-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_CARA_INTELLIGENCE);
  if (auth instanceof NextResponse) return auth;

  const today = new Date().toISOString().slice(0, 10);
  const store = getStore();
  const childId =
    req.nextUrl.searchParams.get("childId") ||
    req.nextUrl.searchParams.get("child_id") ||
    store.youngPeople[0]?.id;

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
    const children = store.youngPeople
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
