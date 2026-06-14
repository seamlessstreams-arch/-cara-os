// ══════════════════════════════════════════════════════════════════════════════
// Cara — AUDIT SERVICE
//
// Writes and retrieves audit events for every Cara operation. Every report
// generation, approval, rejection, AI call, and governance action is
// recorded here for transparency and regulatory compliance.
//
// Safety: writeCaraAudit never throws — a failed audit write must not break
// the operation that triggered it. Errors are logged to the console.
//
// When Supabase is unavailable the write is a silent no-op and reads return
// an empty array.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type { CaraAuditEvent } from "@/types/cara-reports";

// ── Write Audit Event ─────────────────────────────────────────────────────

export async function writeCaraAudit(event: {
  organisationId: string;
  homeId: string;
  childId?: string;
  actorId: string;
  eventType: string;
  entityType: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const sb = createServerClient();
    if (!sb) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (sb.from("cara_audit_events") as any).insert({
      organisation_id: event.organisationId,
      home_id: event.homeId,
      event_type: event.eventType,
      agent_id: null,
      agent_run_id: null,
      report_id: event.entityType === "report" ? event.entityId ?? null : null,
      actor_id: event.actorId,
      actor_role: "staff",
      action: event.eventType,
      target_type: event.entityType,
      target_id: event.entityId ?? null,
      details: {
        summary: event.summary,
        child_id: event.childId ?? null,
        ...(event.metadata ?? {}),
      },
      risk_tier: null,
      ip_address: null,
      user_agent: null,
    });
  } catch (err) {
    // Audit writes must never throw — log and continue
    console.error("[cara-audit] Failed to write audit event:", err);
  }
}

// ── Get Audit Trail ───────────────────────────────────────────────────────

export async function getAuditTrail(opts: {
  homeId: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
}): Promise<CaraAuditEvent[]> {
  const sb = createServerClient();
  if (!sb) return getDemoAuditTrail(opts.homeId);

  const { homeId, entityType, entityId, limit = 50 } = opts;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (sb.from("cara_audit_events") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (entityType) {
    query = query.eq("target_type", entityType);
  }
  if (entityId) {
    query = query.eq("target_id", entityId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[cara-audit] Failed to fetch audit trail:", error);
    return [];
  }

  return (data ?? []) as CaraAuditEvent[];
}

// ── Demo Data ─────────────────────────────────────────────────────────────

function getDemoAuditTrail(homeId: string): CaraAuditEvent[] {
  const now = new Date().toISOString();
  return [
    {
      id: "demo-audit-1",
      organisation_id: "demo-org",
      home_id: homeId,
      event_type: "report_generated",
      agent_id: "report_generator_agent",
      agent_run_id: "demo-run-1",
      report_id: "demo-report-1",
      actor_id: "demo-user",
      actor_role: "registered_manager",
      action: "report_generated",
      target_type: "report",
      target_id: "demo-report-1",
      details: { summary: "Weekly child report generated for Jayden Mitchell" },
      risk_tier: "medium",
      ip_address: null,
      user_agent: null,
      created_at: now,
    },
    {
      id: "demo-audit-2",
      organisation_id: "demo-org",
      home_id: homeId,
      event_type: "report_submitted_for_review",
      agent_id: null,
      agent_run_id: null,
      report_id: "demo-report-1",
      actor_id: "demo-user",
      actor_role: "registered_manager",
      action: "report_submitted_for_review",
      target_type: "report",
      target_id: "demo-report-1",
      details: { summary: "Report submitted for manager review" },
      risk_tier: null,
      ip_address: null,
      user_agent: null,
      created_at: now,
    },
  ];
}
