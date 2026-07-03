// ══════════════════════════════════════════════════════════════════════════════
// API: POST /api/cara/studio/generate — Generate Cara Studio content
//
// Creates child-centred session plans, therapeutic activities, and resources.
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { CaraStudioEngine } from "@/lib/cara/studio/studio-engine";
import { CaraAuditLogger } from "@/lib/cara/audit/audit-logger";
import { sanitiseErrorForClient } from "@/lib/cara/core/errors";
import type { CaraStudioRequest } from "@/lib/cara/core/types";

const studioEngine = new CaraStudioEngine();
const auditLogger = new CaraAuditLogger();

export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;

    if (!body.type || !body.childId || !body.userId || !body.userRole || !body.organisationId || !body.homeId) {
      return NextResponse.json(
        { error: "Missing required fields: type, childId, userId, userRole, organisationId, homeId" },
        { status: 400 },
      );
    }

    const request: CaraStudioRequest = {
      type: body.type,
      childId: body.childId,
      childContext: body.childContext ?? {},
      focusArea: body.focusArea,
      duration: body.duration,
      staffId: body.staffId,
      userId: body.userId,
      userRole: body.userRole,
      organisationId: body.organisationId,
      homeId: body.homeId,
      additionalInstructions: body.additionalInstructions,
    };

    const output = await studioEngine.generate(request);

    return NextResponse.json({
      ...output,
      _meta: {
        aiGenerated: true,
        disclaimer: "AI-generated draft — requires human review before use with children",
      },
    });
  } catch (error: any) {
    const safe = sanitiseErrorForClient(error);
    return NextResponse.json({ error: safe.message, code: safe.code }, { status: error?.statusCode ?? 500 });
  }
}
