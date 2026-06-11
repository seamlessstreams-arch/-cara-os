// CARA STUDIO — POST /api/cara/reflect  (staff debrief)
import { NextResponse, type NextRequest } from "next/server";
import { DebriefRequestSchema, CaraStaffDebriefOutputSchema } from "@/lib/cara-studio/cara-types";
import { generateStaffDebrief } from "@/lib/cara-studio/cara-debrief-builder";
import { actorFromHeaders, persistCaraOutput, caraResponse } from "@/lib/cara-studio/cara-studio-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const actor = actorFromHeaders(req.headers);
  const body = DebriefRequestSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message ?? "Invalid request" }, { status: 422 });

  const { output, review } = generateStaffDebrief(body.data);
  const result = persistCaraOutput({
    module: "debrief",
    promptType: "staff_debrief",
    actor,
    childId: body.data.childId ?? null,
    title: `Debrief: ${body.data.incidentSummary.slice(0, 70)}`,
    inputSummary: body.data.incidentSummary,
    schema: CaraStaffDebriefOutputSchema,
    output,
    review,
  });
  return NextResponse.json({ data: caraResponse(result) }, { status: 201 });
}
