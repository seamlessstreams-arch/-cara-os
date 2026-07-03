// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/document-compare
//
// Compares two documents via the document intelligence agent through
// the orchestration pipeline. Useful for comparing Reg 44 reports across
// months, tracking changes in care plans, etc.
//
// POST body: { documentA, documentB, query?, actorUserId, actorRole, homeId,
//              organisationId?, childId? }
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { orchestrate } from "@/lib/cara/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;

    // Validate required fields
    const { documentA, documentB, actorUserId, actorRole, homeId } = body;

    if (!documentA || !documentB || !actorUserId || !actorRole || !homeId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: documentA, documentB, actorUserId, actorRole, homeId",
        },
        { status: 400 },
      );
    }

    if (documentA.trim().length < 10 || documentB.trim().length < 10) {
      return NextResponse.json(
        { error: "Both documents must contain meaningful content (minimum 10 characters each)." },
        { status: 400 },
      );
    }

    // Build a combined source context with clear document separation
    const combinedContext = [
      "═══ DOCUMENT A (EARLIER / BASELINE) ═══",
      documentA,
      "",
      "═══ DOCUMENT B (LATER / CURRENT) ═══",
      documentB,
    ].join("\n");

    // Default comparison query if none provided
    const query =
      body.query ||
      "Compare these two documents. Identify: (1) new issues in the later document, (2) resolved items from the earlier document, (3) recurring recommendations that remain unaddressed, (4) changes in tone or grading, (5) progress made on previously identified actions.";

    // Route through orchestrator with document analysis task type
    const result = await orchestrate({
      query,
      sourceContext: combinedContext,
      userId: actorUserId,
      role: actorRole,
      homeId,
      organisationId: body.organisationId,
      childId: body.childId,
      attachedDocuments: ["comparison"],
      currentPage: "document-analysis",
      requestedAction: "document_analysis",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/cara/document-compare] Error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown document comparison error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
