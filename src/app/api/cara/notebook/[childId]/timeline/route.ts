// CARA STUDIO NOTEBOOK — GET /api/cara/notebook/[childId]/timeline
// The child's relational timeline (connection · repair · rupture), projected
// LIVE-SAFELY over the record spine via the pure buildRelationalTimeline engine.
import { NextResponse, type NextRequest } from "next/server";
import { gatherNotebookTimeline } from "@/lib/cara-studio/notebook/gather";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ childId: string }> }) {
  const { childId } = await ctx.params;
  const timeline = await gatherNotebookTimeline(childId);
  if (!timeline) return NextResponse.json({ error: "Child not found" }, { status: 404 });
  return NextResponse.json({ data: { timeline } });
}
