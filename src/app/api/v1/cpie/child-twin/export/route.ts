// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD PRACTICE-INTELLIGENCE PACK EXPORT API (§31)
// GET ?child_id=<id>&format=html|docx|json
//
// Renders one child's Digital Twin as a pack for a review, a new key worker,
// or the child themselves one day. Deterministic; reads the same CPIE
// chokepoint every other module reads; identity first, risks never the
// headline; contradictions and missing information stated, never hidden.
// HTML renders inline for print / save-as-PDF; docx/json download as
// attachments.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getChildTwin } from "@/lib/cpie/get-child-twin";
import {
  buildChildTwinExportModel,
  renderChildTwinHtml,
  renderChildTwinJson,
} from "@/lib/cpie/child-twin-export";
import { renderChildTwinDocx } from "@/lib/cpie/child-twin-docx";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = (searchParams.get("child_id") ?? searchParams.get("childId") ?? "").trim();

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const denied = assertChildHomeAccess(identity, childId || null);
    if (denied) return denied;

    if (!childId) {
      return NextResponse.json({ error: "A child id is required (?child_id=)." }, { status: 400 });
    }

    const twin = getChildTwin(childId);
    if (!twin) return NextResponse.json({ error: "Child not found" }, { status: 404 });

    const format = (searchParams.get("format") || "html").toLowerCase();
    const model = buildChildTwinExportModel(twin);
    const base = `child-practice-intelligence-${childId}-${todayStr()}`;

    if (format === "json") {
      return new NextResponse(renderChildTwinJson(model), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${base}.json"`,
        },
      });
    }
    if (format === "docx") {
      const buf = await renderChildTwinDocx(model);
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${base}.docx"`,
        },
      });
    }
    // Default: HTML (renders inline for print / save-as-PDF).
    return new NextResponse(renderChildTwinHtml(model), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
