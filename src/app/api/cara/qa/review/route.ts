// ══════════════════════════════════════════════════════════════════════════════
// API: POST /api/cara/qa/review — Quality assurance record review
//
// Reviews records for quality, identifies gaps, and generates QA feedback.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { CaraQualityAssuranceEngine } from "@/lib/cara/qa/qa-engine";
import { sanitiseErrorForClient } from "@/lib/cara/core/errors";
import type { CaraQAReviewRequest } from "@/lib/cara/core/types";

const qaEngine = new CaraQualityAssuranceEngine();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.recordId || !body.recordType || !body.recordContent || !body.userId || !body.userRole || !body.organisationId || !body.homeId) {
      return NextResponse.json(
        { error: "Missing required fields: recordId, recordType, recordContent, userId, userRole, organisationId, homeId" },
        { status: 400 },
      );
    }

    // Quick check (local, no AI call) for immediate feedback
    const quickResult = qaEngine.quickCheck(body.recordContent, body.recordType);

    // If user requests full AI review
    if (body.fullReview) {
      const request: CaraQAReviewRequest = {
        recordId: body.recordId,
        recordType: body.recordType,
        recordContent: body.recordContent,
        childId: body.childId,
        homeId: body.homeId,
        organisationId: body.organisationId,
        userId: body.userId,
        userRole: body.userRole,
      };

      const fullResult = await qaEngine.reviewRecord(request);
      return NextResponse.json({
        quickCheck: quickResult,
        fullReview: fullResult,
        _meta: {
          aiGenerated: true,
          disclaimer: "QA review is advisory — professional judgement must be applied",
        },
      });
    }

    // Return quick check only
    return NextResponse.json({
      quickCheck: quickResult,
      _meta: {
        aiGenerated: false,
        note: "Quick check uses rule-based analysis. Set fullReview: true for AI-powered review.",
      },
    });
  } catch (error: any) {
    const safe = sanitiseErrorForClient(error);
    return NextResponse.json({ error: safe.message, code: safe.code }, { status: error?.statusCode ?? 500 });
  }
}
