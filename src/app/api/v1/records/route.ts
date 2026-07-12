// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/records — Universal Record Creation Endpoint
//
// Single endpoint for creating ANY record type with full side effects.
// Delegates to the universal-record-orchestrator which handles:
//   Store → Audit → Timeline → Tasks → Alerts → Cara
//
// "Enter once. Use everywhere."
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  createRecord,
  type CreateRecordInput,
} from "@/lib/orchestrator/universal-record-orchestrator";
import { persistRecord, persistAuditEntry } from "@/lib/orchestrator/record-persistence";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

// ── Valid record types ──────────────────────────────────────────────────────

const VALID_RECORD_TYPES = new Set([
  "incident",          // delegates to incident-orchestrator
  "daily_log",         // delegates to daily-log-orchestrator
  "safeguarding_concern",
  "risk_assessment",
  "care_plan",
  "key_work_session",
  "direct_work",
  "health_update",
  "education_update",
  "family_contact",
  "professional_contact",
  "supervision",
  "welfare_check",
  "complaint",
  "medication",
  "restraint",
  "missing_from_care",
  "fire_drill",
  "vehicle_check",
  "observation",
  "training_record",
  "wellbeing_check",
  "performance_support",
  "health_safety_check",
  "maintenance_request",
  "home_audit",
]);

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── Validate required fields ────────────────────────────────────────────
  const required = ["record_type", "staff_id", "title", "description"];
  const missing = required.filter(
    (f) => !body[f] || (typeof body[f] === "string" && !(body[f] as string).trim()),
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}`, fields: missing },
      { status: 400 },
    );
  }

  // ── Validate record type ────────────────────────────────────────────────
  if (!VALID_RECORD_TYPES.has(body.record_type as string)) {
    return NextResponse.json(
      {
        error: `Invalid record_type: "${body.record_type}". Must be one of: ${Array.from(VALID_RECORD_TYPES).join(", ")}`,
      },
      { status: 400 },
    );
  }

  // ── Validate description length ─────────────────────────────────────────
  if ((body.description as string).trim().length < 10) {
    return NextResponse.json(
      { error: "Description must be at least 10 characters" },
      { status: 400 },
    );
  }

  // ── Build input ─────────────────────────────────────────────────────────
  const input: CreateRecordInput = {
    record_type: body.record_type as string,
    child_id: (body.child_id as string) || undefined,
    staff_id: body.staff_id as string,
    home_id: (body.home_id as string) || undefined,
    title: body.title as string,
    description: body.description as string,
    severity: (body.severity as string) || undefined,
    data: (body.data as Record<string, unknown>) ?? {},
  };

  // ── Orchestrate ─────────────────────────────────────────────────────────
  try {
    const result = createRecord(input);

    // ── Durable write-through (gated) ─────────────────────────────────────
    // No-op when Supabase isn't configured; otherwise persists the record and
    // its audit entry so they survive restarts. Best-effort — never blocks the
    // response on a persistence failure (the in-memory write already succeeded).
    let persisted = false;
    try {
      const [rec] = await Promise.all([
        persistRecord(result.record),
        persistAuditEntry(result.audit_entry, "universal"),
      ]);
      persisted = rec.persisted;
    } catch {
      /* persistence is best-effort */
    }

    return NextResponse.json({
      data: result.record,
      linked_updates: result.linked_updates,
      alerts: result.alerts,
      meta: {
        tasks_created: result.tasks_created.length,
        has_alerts: result.alerts.length > 0,
        risk_level: result.audit_entry.risk_level,
        reference: result.record.reference,
        persisted,
      },
    });
  } catch (err) {
    console.error("[universal-record-orchestrator] Error:", err);
    return NextResponse.json(
      { error: "Internal error creating record" },
      { status: 500 },
    );
  }
}

// ── GET: List recently created records ──────────────────────────────────────

export async function GET() {
  try {
    const store = getStore();
    const records = (store as Record<string, unknown>).records as Record<string, unknown>[] | undefined;
    return NextResponse.json({
      data: records ?? [],
      meta: { total: records?.length ?? 0 },
      usage: "POST to this endpoint with { record_type, staff_id, title, description } to create a record.",
    });
  } catch {
    return NextResponse.json({ data: [], meta: { total: 0 } });
  }
}
