// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/document-analyse
//
// Dedicated endpoint for document analysis via the orchestration pipeline.
// Accepts document text + analysis query, routes through the document
// intelligence agent, and returns structured analysis results.
//
// POST body: { documentText, query, actorUserId, actorRole, homeId,
//              organisationId?, childId?, documentType? }
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { orchestrate } from "@/lib/cara/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;

    // Validate required fields
    const { documentText, query, actorUserId, actorRole, homeId } = body;

    if (!documentText || !query || !actorUserId || !actorRole || !homeId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: documentText, query, actorUserId, actorRole, homeId",
        },
        { status: 400 },
      );
    }

    if (documentText.trim().length < 10) {
      return NextResponse.json(
        { error: "Document text is too short. Please provide meaningful content for analysis." },
        { status: 400 },
      );
    }

    if (query.trim().length < 3) {
      return NextResponse.json(
        { error: "Query is too short. Please provide a meaningful analysis request." },
        { status: 400 },
      );
    }

    // Build the CaraRequest for the orchestrator
    const result = await orchestrate({
      query,
      sourceContext: documentText,
      userId: actorUserId,
      role: actorRole,
      homeId,
      organisationId: body.organisationId,
      childId: body.childId,
      attachedDocuments: body.documentType ? [body.documentType] : undefined,
      currentPage: "document-analysis",
      requestedAction: "document_analysis",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/cara/document-analyse] Error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown document analysis error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
