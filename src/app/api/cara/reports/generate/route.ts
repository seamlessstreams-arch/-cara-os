// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/reports/generate
//
// POST  — Generate a new child report via the Cara report generation pipeline.
//         Validates the request body against reportGenerationRequestSchema,
//         invokes generateChildReport, and returns the full result.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { reportGenerationRequestSchema } from "@/lib/cara/ai/schemas";
import { generateChildReport } from "@/lib/cara/reports/report-generator";

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    // Validate request
    const validation = reportGenerationRequestSchema.safeParse(body);
    if (!validation.success) {
      const issues = validation.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return NextResponse.json(
        { ok: false, error: `Validation failed: ${issues}` },
        { status: 400 },
      );
    }

    const result = await generateChildReport(validation.data);

    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    console.error("[api/cara/reports/generate] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
