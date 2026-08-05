// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF RECORDING QUALITY PATHWAY
// GET /api/v1/staff-recording-quality-pathway
//
// Maps each active staff member's writing-assistant engagement (accept/ignore
// patterns from WAUD) onto KB practice-framework skill domains. Returns per-
// staff development signals, supervision prompts, and team summary — all
// grounded in the 21 Skills and PACE Model frameworks.
//
// No LLM calls. Fully deterministic from store data.
//
// Compute lives in a pure, importable builder so other modules can reuse it and
// it is unit-testable in isolation — see src/lib/staff-recording-quality-pathway.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { buildStaffRecordingPathway } from "@/lib/staff-recording-quality-pathway/staff-recording-pathway-engine";

export async function GET() {
  const [staff, writingAssistantAuditEvents] = await Promise.all([dal.staff.findAll(), dal.writingAssistantAuditEvents.findAll()]);
  return NextResponse.json({ data: buildStaffRecordingPathway({ staff, writingAssistantAuditEvents }) });
}
