// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMPLIANCE RULES API ROUTE
// GET /api/v1/compliance-rules
//
// Runs the FIXED compliance-rules engine. Incidents, safeguarding, missing,
// restraint and medication events are read from the canonical event stream
// (capture once → surface everywhere); supervisions and training records are
// mapped straight from the store. These are HARD regulatory rules — pass/fail —
// and are deliberately separate from Cara's suggestions. Cara is not the
// authority here.
//
// CHR 2015 Reg 33 (supervision), Reg 34/35 (medicines & behaviour management),
// Reg 40 (notifications), Reg 12/13 (protection & leadership). SCCIF: leaders
// know the home meets its statutory duties and act when it does not.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { dal } from "@/lib/db/dal";
import { buildEventStream } from "@/lib/event-stream/event-projector";
import { mapStoreToEventInput } from "@/lib/event-stream/store-mapper";
import {
  computeComplianceRules,
  type ComplianceSupervisionInput,
  type ComplianceTrainingInput,
} from "@/lib/compliance-rules/compliance-rules-engine";

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

const d = (v: unknown, fallback = ""): string => (v == null ? fallback : v.toString().slice(0, 10));

export async function GET() {
  const store = getStore();

  // ── Canonical event stream (incident-derived + safeguarding/missing/etc.) ──
  const events = buildEventStream(mapStoreToEventInput(store)).events;

  // ── Supervisions (Reg 33) ──────────────────────────────────────────────
  const supervisions: ComplianceSupervisionInput[] = ((await safeList(dal.supervisions.findAll())) as any[]).map((s: any) => ({
    id: s.id,
    staff_id: s.staff_id ?? "",
    type: s.type ?? "supervision",
    scheduled_date: d(s.scheduled_date ?? s.created_at),
    actual_date: s.actual_date ? d(s.actual_date) : null,
    status: s.status ?? "scheduled",
  }));

  // ── Mandatory training records ──────────────────────────────────────────
  const trainingRecords: ComplianceTrainingInput[] = ((await safeList(dal.training.findAll())) as any[]).map((t: any) => ({
    id: t.id,
    staff_id: t.staff_id ?? "",
    course_name: t.course_name ?? t.category ?? "Training",
    category: t.category ?? "general",
    status: t.status ?? "compliant",
    is_mandatory: t.is_mandatory ?? true,
    expiry_date: t.expiry_date ? d(t.expiry_date) : null,
  }));

  const result = computeComplianceRules({ events, supervisions, trainingRecords });

  return NextResponse.json({ data: result });
}
