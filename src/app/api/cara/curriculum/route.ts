// CARA STUDIO — POST /api/cara/curriculum
import { NextResponse, type NextRequest } from "next/server";
import { CurriculumRequestSchema, CaraCurriculumMapOutputSchema } from "@/lib/cara-studio/cara-types";
import { generateCaraCurriculumMap } from "@/lib/cara-studio/cara-curriculum-generator";
import { actorFromHeaders, loadContext, persistCaraOutput, caraResponse } from "@/lib/cara-studio/cara-studio-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const actor = actorFromHeaders(req.headers);
  const body = CurriculumRequestSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message ?? "Invalid request" }, { status: 422 });

  const ctx = loadContext(body.data.childId, body.data.desiredOutcomes.join(" ") || "learning pathway");
  if (!ctx.childId) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  const { output, review } = generateCaraCurriculumMap({ ctx, ...body.data });
  const result = persistCaraOutput({
    module: "curriculum",
    promptType: "curriculum_map",
    actor,
    childId: ctx.childId,
    title: output.title,
    inputSummary: `weeks=${body.data.timeframeWeeks}; outcomes=${body.data.desiredOutcomes.join(", ")}`,
    schema: CaraCurriculumMapOutputSchema,
    output,
    review,
  });
  return NextResponse.json({ data: caraResponse(result) }, { status: 201 });
}
