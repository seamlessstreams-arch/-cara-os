import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateOfstedReadinessSnapshot } from "@/lib/cara/ofsted-readiness";

const Schema = z.object({
  homeId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const generatedBy = req.headers.get("x-user-id");
    if (!generatedBy) {
      return NextResponse.json({ error: "Unauthenticated request." }, { status: 401 });
    }

    const body = Schema.parse(await req.json());
    const snapshot = await generateOfstedReadinessSnapshot({ ...body, generatedBy });
    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
