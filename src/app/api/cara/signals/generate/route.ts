import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateRiskSignals } from "@/lib/cara/signals";

const Schema = z.object({
  homeId: z.string().uuid(),
  childId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthenticated request." }, { status: 401 });
    }

    const body = Schema.parse(await req.json());
    const result = await generateRiskSignals(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
