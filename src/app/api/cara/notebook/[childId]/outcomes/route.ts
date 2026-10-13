// CARA STUDIO NOTEBOOK — GET /api/cara/notebook/[childId]/outcomes
// The child's outcomes & evidence (the five SCCIF areas with status, direction
// and evidence) — the child-level evidence that underpins Reg 44 and inspection.
// Projected LIVE-SAFELY via the pure buildOutcomeIntelligence engine. Never a grade.
import { NextResponse, type NextRequest } from "next/server";
import { gatherNotebookOutcomes } from "@/lib/cara-studio/notebook/gather";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ childId: string }> }) {
  const { childId } = await ctx.params;
  const outcomes = await gatherNotebookOutcomes(childId);
  if (!outcomes) return NextResponse.json({ error: "Child not found" }, { status: 404 });
  return NextResponse.json({ data: { outcomes } });
}
