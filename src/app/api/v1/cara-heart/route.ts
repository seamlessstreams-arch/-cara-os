// ══════════════════════════════════════════════════════════════════════════════
// CARA — CARA HEART RESIDENTIAL PRACTICE ENGINE API
// POST /api/v1/cara-heart
//        Body: CaraPracticeRecord (JSON)
//        → CaraPracticeIntelligenceOutput
//
// Runs the full Cara Heart engine deterministically against the submitted
// practice record. No AI calls are made here — all analysis is pure logic.
// The response includes llmRequired and llmReason if an AI layer should be
// added by a higher-level service.
//
// GET /api/v1/cara-heart
//        → { disclaimer, engines[], prompt_count_example }
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  runCaraHeartResidentialPracticeEngine,
  CARA_HEART_DISCLAIMER,
} from "@/lib/cara-heart";
import type { CaraPracticeRecord } from "@/lib/cara-heart";
import { readJsonBody } from "@/lib/http/read-json";

function buildValidationError(field: string, message: string) {
  return NextResponse.json(
    { ok: false, error: `Validation error: ${field} — ${message}` },
    { status: 400 },
  );
}

export async function GET() {
  return NextResponse.json({
    data: {
      name: "Cara Heart Residential Practice Intelligence Engine",
      version: "1.0.0",
      disclaimer: CARA_HEART_DISCLAIMER,
      engines: [
        "SafeguardingOverrideEngine",
        "CaraHeartEngine",
        "ChildVoiceRightsEngine",
        "AntiCriminalisationDecisionEngine",
        "RestorativeRepairEngine",
        "CareForCarersEngine",
        "LifeSpaceInterventionEngine",
        "ResidentialInterventionEngine",
        "SocialPedagogyReflectionEngine",
        "ManagerPatternOversightEngine",
      ],
      usage: "POST with a CaraPracticeRecord JSON body to receive a CaraPracticeIntelligenceOutput.",
    },
  });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const record = body as Partial<CaraPracticeRecord>;

  // ── Basic validation ──────────────────────────────────────────────────────
  if (!record.id || typeof record.id !== "string" || record.id.trim() === "") {
    return buildValidationError("id", "A non-empty string id is required.");
  }
  if (!record.childId || typeof record.childId !== "string" || record.childId.trim() === "") {
    return buildValidationError("childId", "A non-empty string childId is required.");
  }
  if (!record.type || typeof record.type !== "string") {
    return buildValidationError("type", "A valid record type is required.");
  }
  if (!record.description || typeof record.description !== "string" || record.description.trim() === "") {
    return buildValidationError("description", "A non-empty description is required.");
  }
  if (!record.dateTime || typeof record.dateTime !== "string") {
    return buildValidationError("dateTime", "A dateTime string is required.");
  }

  try {
    const output = runCaraHeartResidentialPracticeEngine(record as CaraPracticeRecord);
    return NextResponse.json({ ok: true, data: output }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown engine error";
    return NextResponse.json(
      { ok: false, error: `Engine error: ${message}` },
      { status: 500 },
    );
  }
}
