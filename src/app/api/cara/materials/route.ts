// CARA STUDIO — POST /api/cara/materials
import { NextResponse, type NextRequest } from "next/server";
import { MaterialRequestSchema, CaraInteractiveMaterialOutputSchema } from "@/lib/cara-studio/cara-types";
import { generateCaraInteractiveMaterial } from "@/lib/cara-studio/cara-material-generator";
import { actorFromHeaders, loadContext, persistCaraOutput, caraResponse } from "@/lib/cara-studio/cara-studio-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const actor = actorFromHeaders(req.headers);
  const body = MaterialRequestSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message ?? "Invalid request" }, { status: 422 });

  const ctx = loadContext(body.data.childId, body.data.theme);
  if (!ctx.childId) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  const { output, review } = generateCaraInteractiveMaterial({ ctx, ...body.data });
  const result = persistCaraOutput({
    module: "material",
    promptType: body.data.materialType,
    actor,
    childId: ctx.childId,
    title: output.title,
    inputSummary: `type=${body.data.materialType}; theme=${body.data.theme}; difficulty=${body.data.difficulty}`,
    schema: CaraInteractiveMaterialOutputSchema,
    output,
    review,
  });
  return NextResponse.json({ data: caraResponse(result) }, { status: 201 });
}
