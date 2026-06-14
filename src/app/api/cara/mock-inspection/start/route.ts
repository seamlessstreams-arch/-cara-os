import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { startMockInspection } from "@/lib/cara/mock-inspection";

const Schema = z.object({
  homeId: z.string().uuid(),
  focus: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const startedBy = req.headers.get("x-user-id");
    if (!startedBy) {
      return NextResponse.json({ error: "Unauthenticated request." }, { status: 401 });
    }

    const body = Schema.parse(await req.json());
    const result = await startMockInspection({ ...body, startedBy });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
