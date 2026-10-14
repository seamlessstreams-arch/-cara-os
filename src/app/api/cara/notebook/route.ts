// CARA STUDIO NOTEBOOK — GET /api/cara/notebook
// The home dashboard: every current child's LIVE-SAFE attention summary, sorted
// so whoever needs the team's attention is first. Reuses the per-child briefing.
import { NextResponse, type NextRequest } from "next/server";
import { dal } from "@/lib/db/dal";
import { gatherNotebookData } from "@/lib/cara-studio/notebook/gather";
import { buildNotebookBriefing, buildNotebookHomeCard, type NotebookHomeCard } from "@/lib/cara-studio/notebook/notebook-briefing";

export const dynamic = "force-dynamic";

const RANK: Record<NotebookHomeCard["severity"], number> = { crit: 0, warn: 1, good: 2 };

export async function GET(_req: NextRequest) {
  const children = await dal.youngPeople.findAll("current");
  const cards = (
    await Promise.all(
      children.map(async (c): Promise<NotebookHomeCard | null> => {
        const input = await gatherNotebookData(c.id);
        return input ? buildNotebookHomeCard(c.id, buildNotebookBriefing(input)) : null;
      }),
    )
  ).filter((c): c is NotebookHomeCard => c !== null);

  cards.sort((a, b) => RANK[a.severity] - RANK[b.severity] || b.attention - a.attention || a.firstName.localeCompare(b.firstName));
  return NextResponse.json({ data: { cards } });
}
