// CARA STUDIO — GET /api/cara/child/[childId]
// The child's Cara workspace: learning profile + all saved outputs by module.
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ childId: string }> }) {
  const { childId } = await ctx.params;
  const child = db.youngPeople.findById(childId);
  if (!child) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  const outputs = db.caraStudioOutputs.findByChild(childId);
  const byModule = (m: string) => outputs.filter((o) => o.module === m).sort((a, b) => b.created_at.localeCompare(a.created_at));

  return NextResponse.json({
    data: {
      child: { id: child.id, name: `${child.first_name} ${child.last_name}`, preferred_name: child.preferred_name },
      learning_profile: db.caraLearningProfiles.findByChild(childId) ?? null,
      curriculum: byModule("curriculum"),
      sessions: byModule("session_plan"),
      materials: byModule("material"),
      conversations: byModule("conversation"),
      incident_learning: byModule("incident_learning"),
      adaptations: byModule("adaptation"),
      review_notes: outputs
        .filter((o) => o.review_note)
        .map((o) => ({ id: o.id, title: o.title, note: o.review_note, by: o.reviewed_by, at: o.reviewed_at })),
    },
  });
}
