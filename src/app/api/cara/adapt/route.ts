// CARA STUDIO — POST /api/cara/adapt
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db/store";
import { AdaptRequestSchema, CaraAdaptedContentOutputSchema } from "@/lib/cara-studio/cara-types";
import { adaptCaraContent } from "@/lib/cara-studio/cara-adaptation-engine";
import { runCaraGuardrails, computeManagerReview } from "@/lib/cara-studio/cara-guardrails";
import { actorFromHeaders, persistCaraOutput, caraResponse } from "@/lib/cara-studio/cara-studio-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const actor = actorFromHeaders(req.headers);
  const body = AdaptRequestSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message ?? "Invalid request" }, { status: 422 });

  // The SOURCE content is scanned too — adapting unsafe content doesn't launder it.
  const sourceCheck = runCaraGuardrails(body.data.originalContent);
  const profile = body.data.childId ? db.caraLearningProfiles.findByChild(body.data.childId) ?? null : null;
  const output = adaptCaraContent({ ...body.data, profile });
  const review = computeManagerReview({
    topicOrTheme: body.data.originalContent.slice(0, 200),
    guardrailSeverity: sourceCheck.severity,
    outputText: output.adaptedVersion,
  });

  const result = persistCaraOutput({
    module: "adaptation",
    promptType: "send_adaptation",
    actor,
    childId: body.data.childId ?? null,
    title: `Adapted: ${body.data.originalContent.slice(0, 60)}…`,
    inputSummary: `needs=${body.data.adaptationNeeds.join(",")}; format=${body.data.format}`,
    schema: CaraAdaptedContentOutputSchema,
    output: { ...output, managerReviewNeeded: output.managerReviewNeeded || review.required },
    review,
  });
  return NextResponse.json({ data: caraResponse(result) }, { status: 201 });
}
