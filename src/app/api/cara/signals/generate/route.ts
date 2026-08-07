import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateRiskSignals } from "@/lib/cara/signals";
import { readJsonBody } from "@/lib/http/read-json";

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

    const raw = await readJsonBody(req);
    if (!raw.ok) return raw.response;
    const body = Schema.parse(raw.data);
    const result = await generateRiskSignals(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
