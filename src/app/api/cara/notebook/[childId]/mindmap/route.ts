// CARA STUDIO NOTEBOOK — GET /api/cara/notebook/[childId]/mindmap
// A deterministic map of the child's world (people · risks · strengths ·
// services), composed LIVE-SAFELY from the record spine.
import { NextResponse, type NextRequest } from "next/server";
import { gatherNotebookMindMap } from "@/lib/cara-studio/notebook/gather";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ childId: string }> }) {
  const { childId } = await ctx.params;
  const mindmap = await gatherNotebookMindMap(childId);
  if (!mindmap) return NextResponse.json({ error: "Child not found" }, { status: 404 });
  return NextResponse.json({ data: { mindmap } });
}
