// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/reports/[id]/rewrite
//
// POST  — Rewrite a report section for a different audience. Adapts tone,
//         voice, and style while preserving all facts and evidence.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { rewriteSection } from "@/lib/cara/reports/report-generator";
import { REPORT_AUDIENCES } from "@/types/cara-reports";
import type { ReportAudience } from "@/types/cara-reports";
import { readJsonBody } from "@/lib/http/read-json";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: reportId } = await params;

    let body: Record<string, unknown>;
    try {
      const __parsed = await readJsonBody(req);
      if (!__parsed.ok) return __parsed.response;
      body = __parsed.data;
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const sectionId = body.sectionId as string | undefined;
    const audience = body.audience as string | undefined;

    if (!sectionId) {
      return NextResponse.json(
        { ok: false, error: "sectionId is required" },
        { status: 400 },
      );
    }

    if (
      !audience ||
      !REPORT_AUDIENCES.includes(audience as ReportAudience)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: `audience is required and must be one of: ${REPORT_AUDIENCES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const result = await rewriteSection(
      sectionId,
      reportId,
      audience as ReportAudience,
    );

    if (!result) {
      return NextResponse.json(
        { ok: false, error: "Section not found or rewrite failed" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: { content: result.content, wasSanitised: result.wasSanitised },
    });
  } catch (err) {
    console.error("[api/cara/reports/[id]/rewrite] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
