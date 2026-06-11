// CARA STUDIO — POST /api/cara/conversation
import { NextResponse, type NextRequest } from "next/server";
import { ConversationRequestSchema, CaraConversationBlueprintOutputSchema } from "@/lib/cara-studio/cara-types";
import { generateCaraConversationBlueprint } from "@/lib/cara-studio/cara-conversation-coach";
import { actorFromHeaders, loadContext, persistCaraOutput, caraResponse } from "@/lib/cara-studio/cara-studio-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const actor = actorFromHeaders(req.headers);
  const body = ConversationRequestSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message ?? "Invalid request" }, { status: 422 });

  const ctx = loadContext(body.data.childId, body.data.conversationTopic);
  if (!ctx.childId) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  const { output, review } = generateCaraConversationBlueprint({ ctx, ...body.data });
  const result = persistCaraOutput({
    module: "conversation",
    promptType: "conversation_blueprint",
    actor,
    childId: ctx.childId,
    title: output.title,
    inputSummary: `topic=${body.data.conversationTopic}; risk=${body.data.emotionalRisk}`,
    schema: CaraConversationBlueprintOutputSchema,
    output,
    review,
  });
  return NextResponse.json({ data: caraResponse(result) }, { status: 201 });
}
