// CARA STUDIO — POST /api/cara/incident-learning
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db/store";
import { IncidentLearningRequestSchema, CaraIncidentLearningOutputSchema } from "@/lib/cara-studio/cara-types";
import { convertIncidentToLearning } from "@/lib/cara-studio/cara-incident-converter";
import { actorFromHeaders, loadContext, persistCaraOutput, caraResponse } from "@/lib/cara-studio/cara-studio-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const actor = actorFromHeaders(req.headers);
  const body = IncidentLearningRequestSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message ?? "Invalid request" }, { status: 422 });

  // If an incidentId is given, pull the summary from the real record.
  let summary = body.data.incidentSummary;
  if (body.data.incidentId) {
    const incident = db.incidents.findById(body.data.incidentId);
    if (incident) summary = `${incident.type}: ${incident.description}`;
  }

  const ctx = loadContext(body.data.childId, summary);
  if (!ctx.childId) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  const { output, review } = convertIncidentToLearning({ ctx, ...body.data, incidentSummary: summary });
  const result = persistCaraOutput({
    module: "incident_learning",
    promptType: "incident_to_learning",
    actor,
    childId: ctx.childId,
    title: `Learning from: ${summary.slice(0, 80)}`,
    inputSummary: summary,
    schema: CaraIncidentLearningOutputSchema,
    output,
    review,
  });
  return NextResponse.json({ data: caraResponse(result) }, { status: 201 });
}
