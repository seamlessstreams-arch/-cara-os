// CARA STUDIO NOTEBOOK — GET /api/cara/notebook/[childId]/audio
// A deterministic two-voice audio-briefing SCRIPT, composed LIVE-SAFELY from the
// whole-child briefing (read aloud / recorded / played with browser TTS).
import { NextResponse, type NextRequest } from "next/server";
import { gatherNotebookData } from "@/lib/cara-studio/notebook/gather";
import { buildNotebookBriefing } from "@/lib/cara-studio/notebook/notebook-briefing";
import { buildNotebookAudioScript } from "@/lib/cara-studio/notebook/notebook-audio";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ childId: string }> }) {
  const { childId } = await ctx.params;
  const input = await gatherNotebookData(childId);
  if (!input) return NextResponse.json({ error: "Child not found" }, { status: 404 });
  const script = buildNotebookAudioScript(buildNotebookBriefing(input));
  return NextResponse.json({ data: { script } });
}
