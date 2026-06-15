// ══════════════════════════════════════════════════════════════════════════════
// CARA — Knowledge Graph API (Layer 5)
//
// GET → the home's cross-entity knowledge graph: children, risks, locations and
//       professionals, plus the cross-entity insights (shared locations, shared
//       risks, shared professionals, concentrated risk, recurring locations).
//
// Guarded by VIEW_CARA_INTELLIGENCE. Read-only against the store; no model calls.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { buildKnowledgeGraph } from "@/lib/knowledge-graph/knowledge-graph-engine";
import type { GraphChild, GraphIncident } from "@/lib/knowledge-graph/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_CARA_INTELLIGENCE);
  if (auth instanceof NextResponse) return auth;

  const today = new Date().toISOString().slice(0, 10);
  const windowDays = 180;

  const children: GraphChild[] = db.youngPeople
    .findAll()
    .filter((yp) => yp.status === "current" || yp.status === "planned")
    .map((yp) => ({
      id: yp.id,
      name: yp.preferred_name || yp.first_name,
      riskFlags: yp.risk_flags ?? [],
      socialWorker: yp.social_worker_name || undefined,
    }));

  const incidents: GraphIncident[] = db.incidents
    .findAll()
    .map((i) => ({ childId: i.child_id, type: i.type, location: i.location, date: i.date }));

  try {
    const graph = buildKnowledgeGraph({ children, incidents, windowDays, today });
    return NextResponse.json({ data: { graph } });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to build knowledge graph", details: String(error) },
      { status: 500 },
    );
  }
}
