// ══════════════════════════════════════════════════════════════════════════════
// API: POST /api/cara/evidence/search — Semantic evidence search
//
// Search across all Cara records using embeddings and reranking.
// Respects role permissions and organisation boundaries.
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { CaraEvidenceEngine } from "@/lib/cara/evidence/evidence-engine";
import { sanitiseErrorForClient } from "@/lib/cara/core/errors";
import type { CaraEvidenceQuery } from "@/lib/cara/core/types";

const evidenceEngine = new CaraEvidenceEngine();

export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;

    if (!body.query || !body.userId || !body.userRole || !body.organisationId) {
      return NextResponse.json(
        { error: "Missing required fields: query, userId, userRole, organisationId" },
        { status: 400 },
      );
    }

    const query: CaraEvidenceQuery = {
      query: body.query,
      organisationId: body.organisationId,
      homeId: body.homeId,
      childId: body.childId,
      staffId: body.staffId,
      sourceTypes: body.sourceTypes,
      dateFrom: body.dateFrom,
      dateTo: body.dateTo,
      limit: body.limit ?? 10,
      userId: body.userId,
      userRole: body.userRole,
    };

    const results = await evidenceEngine.search(query);

    return NextResponse.json({
      query: body.query,
      results,
      totalResults: results.length,
      _meta: {
        searchMethod: "semantic",
        disclaimer: "Evidence results require professional judgement before use in official reporting",
      },
    });
  } catch (error: any) {
    const safe = sanitiseErrorForClient(error);
    return NextResponse.json({ error: safe.message, code: safe.code }, { status: error?.statusCode ?? 500 });
  }
}
