import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { approveCaraRun, rejectCaraRun } from "@/lib/cara/engine";

const ReviewSchema = z.object({
  homeId: z.string().uuid(),
  aiRunId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthenticated request." }, { status: 401 });
    }

    const body = ReviewSchema.parse(await req.json());

    if (body.action === "approve") {
      const result = await approveCaraRun({
        homeId: body.homeId,
        aiRunId: body.aiRunId,
        actorId: userId,
        notes: body.notes,
      });
      return NextResponse.json(result);
    }

    const result = await rejectCaraRun({
      homeId: body.homeId,
      aiRunId: body.aiRunId,
      actorId: userId,
      reason: body.reason ?? "Rejected by reviewer.",
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
