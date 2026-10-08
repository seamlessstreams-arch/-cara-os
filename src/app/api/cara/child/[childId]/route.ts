// CARA STUDIO — GET /api/cara/child/[childId]
// The child's Cara workspace: learning profile + all saved outputs by module.
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db/store";
import { dal } from "@/lib/db/dal";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import { getCaraStudioOutputsByChild, getCaraLearningProfileByChild } from "@/lib/supabase/cara-persist";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ childId: string }> }) {
  const { childId } = await ctx.params;
  // Live: resolve via the dal — the in-memory store is emptied on a live tenant,
  // so db.youngPeople misses every real uuid and the workspace 404s.
  const child = await dal.youngPeople.findById(childId);
  if (!child) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  // Live: read the child's drafts from the durable cara_studio_outputs table
  // (persistCaraStudioOutput wrote them there); demo: the in-memory store.
  const outputs = isSupabaseEnabled()
    ? await getCaraStudioOutputsByChild(childId)
    : db.caraStudioOutputs.findByChild(childId);
  const byModule = (m: string) => outputs.filter((o) => o.module === m).sort((a, b) => b.created_at.localeCompare(a.created_at));

  const learningProfile = isSupabaseEnabled()
    ? await getCaraLearningProfileByChild(childId)
    : db.caraLearningProfiles.findByChild(childId) ?? null;

  return NextResponse.json({
    data: {
      child: { id: child.id, name: `${child.first_name} ${child.last_name}`, preferred_name: child.preferred_name },
      learning_profile: learningProfile,
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
