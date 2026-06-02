// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/audit — Orchestrator Audit Log
//
// Surfaces the audit entries written by the record orchestrators so they are
// viewable in the UI. Merges the universal orchestrator log and the incident
// orchestrator log into one chronological feed.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getAuditLog as getUniversalAudit } from "@/lib/orchestrator/universal-record-orchestrator";
import { getAuditLog as getIncidentAudit } from "@/lib/incidents/incident-orchestrator";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entity_type");
  const actorId = searchParams.get("actor_id");
  const limit = Math.min(Number(searchParams.get("limit") ?? "100"), 500);

  // Merge both orchestrator audit logs
  const universal = getUniversalAudit().map((e) => ({ ...e, source: "universal" }));
  const incident = getIncidentAudit().map((e) => ({ ...e, source: "incident" }));

  let entries = [...universal, ...incident];

  // Filter
  if (entityType) {
    entries = entries.filter((e) => (e as Record<string, unknown>).entity_type === entityType);
  }
  if (actorId) {
    entries = entries.filter((e) => (e as Record<string, unknown>).actor_id === actorId);
  }

  // Sort newest first
  entries.sort((a, b) => {
    const ta = String((a as Record<string, unknown>).created_at ?? "");
    const tb = String((b as Record<string, unknown>).created_at ?? "");
    return tb.localeCompare(ta);
  });

  const total = entries.length;
  entries = entries.slice(0, limit);

  return NextResponse.json({
    data: entries,
    meta: {
      total,
      returned: entries.length,
      sources: { universal: universal.length, incident: incident.length },
    },
  });
}
