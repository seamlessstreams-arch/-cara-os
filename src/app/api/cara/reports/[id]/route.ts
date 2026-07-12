// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/reports/[id]
//
// GET   — Fetch a single report by ID, including sections and evidence.
// PUT   — Update a report section (action: "update_section").
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  getReport,
  updateReportSection,
} from "@/lib/cara/reports/report-generator";
import { readJsonBody } from "@/lib/http/read-json";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const result = await getReport(id);
    if (!result) {
      return NextResponse.json(
        { ok: false, error: "Report not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    console.error("[api/cara/reports/[id]] GET error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
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

    const action = body.action as string | undefined;

    if (action === "update_section") {
      const sectionId = body.sectionId as string | undefined;
      const content = body.content as string | undefined;
      const updatedBy = body.updatedBy as string | undefined;

      if (!sectionId || !content || !updatedBy) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "update_section requires sectionId, content, and updatedBy fields",
          },
          { status: 400 },
        );
      }

      const updated = await updateReportSection(sectionId, content, updatedBy);
      if (!updated) {
        return NextResponse.json(
          { ok: false, error: "Failed to update section" },
          { status: 404 },
        );
      }

      return NextResponse.json({ ok: true, data: updated });
    }

    return NextResponse.json(
      {
        ok: false,
        error: `Unknown action: "${action}". Supported actions: update_section`,
      },
      { status: 400 },
    );
  } catch (err) {
    console.error("[api/cara/reports/[id]] PUT error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
