// ══════════════════════════════════════════════════════════════════════════════
// API: POST /api/cara/route — Route decision without execution
//
// Returns which provider/model would be used and why, without calling the AI.
// Useful for UI to preview routing before committing.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { CaraModelRouter } from "@/lib/cara/router/model-router";
import { sanitiseErrorForClient } from "@/lib/cara/core/errors";
import type { CaraTaskRequest } from "@/lib/cara/core/types";

const router = new CaraModelRouter();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.taskType || !body.prompt || !body.userId || !body.userRole || !body.organisationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const taskRequest: CaraTaskRequest = {
      taskType: body.taskType,
      userId: body.userId,
      userRole: body.userRole,
      organisationId: body.organisationId,
      homeId: body.homeId,
      childId: body.childId,
      staffId: body.staffId,
      prompt: body.prompt,
      systemPrompt: body.systemPrompt,
      context: body.context,
      options: body.options,
    };

    const decision = await router.routeTask(taskRequest);
    const explanation = router.explainRouting(decision);

    return NextResponse.json({ decision, explanation });
  } catch (error: any) {
    const safe = sanitiseErrorForClient(error);
    return NextResponse.json({ error: safe.message, code: safe.code }, { status: error?.statusCode ?? 500 });
  }
}
