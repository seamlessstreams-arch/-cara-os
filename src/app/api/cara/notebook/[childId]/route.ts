// CARA STUDIO NOTEBOOK — GET /api/cara/notebook/[childId]
// The child's live-safe whole-child briefing. Reads the record spine through
// the dal (Supabase-backed on live) and composes a deterministic briefing —
// never invents a signal; absent records are reported as gaps.
import { NextResponse, type NextRequest } from "next/server";
import { gatherNotebookData } from "@/lib/cara-studio/notebook/gather";
import { buildNotebookBriefing } from "@/lib/cara-studio/notebook/notebook-briefing";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ childId: string }> }) {
  const { childId } = await ctx.params;
  const input = await gatherNotebookData(childId);
  if (!input) return NextResponse.json({ error: "Child not found" }, { status: 404 });
  return NextResponse.json({ data: { briefing: buildNotebookBriefing(input) } });
}
