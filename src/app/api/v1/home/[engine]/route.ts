import { NextResponse } from "next/server";
import { dispatchHomeHandler } from "@/lib/intelligence-api/home-dispatcher";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ engine: string }> },
) {
  const { engine } = await context.params;
  const handler = dispatchHomeHandler(engine);
  if (!handler) {
    return NextResponse.json(
      { error: `Unknown intelligence engine: ${engine}` },
      { status: 404 },
    );
  }
  return handler();
}
