// ══════════════════════════════════════════════════════════════════════════════
// CARA — STRATEGY DISCUSSION REQUEST EXPORT API (§31)
// GET ?id=<requestId>&format=html|docx|json
//
// Renders one strategy-discussion request as a pack a manager can take to the
// local authority. Deterministic; carries the advisory statement (the threshold
// judgement is the manager's, convening is the LA's decision — never Cara's).
// HTML renders inline for print / save-as-PDF; docx/json download as
// attachments.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { getStrategyRequest } from "@/lib/strategy-discussion/request-service";
import {
  buildStrategyExportModel,
  renderStrategyHtml,
  renderStrategyJson,
} from "@/lib/strategy-discussion/strategy-export";
import { renderStrategyDocx } from "@/lib/strategy-discussion/strategy-docx";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_REPORTS);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") || "").trim();
  if (!id) {
    return NextResponse.json({ error: "A request id is required (?id=)." }, { status: 400 });
  }

  const request = getStrategyRequest(id);
  if (!request) {
    return NextResponse.json({ error: `No strategy-discussion request "${id}".` }, { status: 404 });
  }

  const format = (searchParams.get("format") || "html").toLowerCase();
  const model = buildStrategyExportModel(request);
  const base = `strategy-discussion-${request.id}-${todayStr()}`;

  if (format === "json") {
    return new NextResponse(renderStrategyJson(model), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${base}.json"`,
      },
    });
  }
  if (format === "docx") {
    const buf = await renderStrategyDocx(model);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${base}.docx"`,
      },
    });
  }
  // Default: HTML (renders inline for print / save-as-PDF).
  return new NextResponse(renderStrategyHtml(model), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
