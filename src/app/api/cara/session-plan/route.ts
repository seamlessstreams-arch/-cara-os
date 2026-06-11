// CARA STUDIO — POST /api/cara/session-plan
import { NextResponse, type NextRequest } from "next/server";
import { SessionPlanRequestSchema, CaraSessionPlanOutputSchema } from "@/lib/cara-studio/cara-types";
import { generateCaraSessionPlan } from "@/lib/cara-studio/cara-session-generator";
import { actorFromHeaders, loadContext, persistCaraOutput, caraResponse } from "@/lib/cara-studio/cara-studio-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const actor = actorFromHeaders(req.headers);
  const body = SessionPlanRequestSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message ?? "Invalid request" }, { status: 422 });

  const ctx = loadContext(body.data.childId, body.data.theme);
  if (!ctx.childId) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  const { output, review } = generateCaraSessionPlan({ ctx, ...body.data });
  const result = persistCaraOutput({
    module: "session_plan",
    promptType: "session_plan",
    actor,
    childId: ctx.childId,
    title: output.title,
    inputSummary: `theme=${body.data.theme}; aim=${body.data.aim}; duration=${body.data.durationMinutes}`,
    schema: CaraSessionPlanOutputSchema,
    output,
    review,
  });
  return NextResponse.json({ data: caraResponse(result) }, { status: 201 });
}
