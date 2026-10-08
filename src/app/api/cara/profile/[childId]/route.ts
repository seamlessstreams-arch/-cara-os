// CARA STUDIO — GET/PUT /api/cara/profile/[childId]
// The child's learning profile: read, and manager/staff upsert with audit.
// Sensitive child data — every change is attributed and audit-logged.
import { NextResponse, type NextRequest } from "next/server";
import { tenantHomeId } from "@/lib/supabase/tenant";
import { db } from "@/lib/db/store";
import { dal } from "@/lib/db/dal";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import { generateId } from "@/lib/utils";
import { LearningProfileUpsertSchema, type CaraChildLearningProfile } from "@/lib/cara-studio/cara-types";
import { actorFromHeaders } from "@/lib/cara-studio/cara-studio-service";
import { persistCaraLearningProfile, getCaraLearningProfileByChild } from "@/lib/supabase/cara-persist";
import { writeAuditLog } from "@/lib/supabase/audit";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ childId: string }> }) {
  const { childId } = await ctx.params;
  if (!(await dal.youngPeople.findById(childId))) return NextResponse.json({ error: "Child not found" }, { status: 404 });
  const profile = isSupabaseEnabled()
    ? await getCaraLearningProfileByChild(childId)
    : db.caraLearningProfiles.findByChild(childId) ?? null;
  return NextResponse.json({ data: { profile } });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ childId: string }> }) {
  const { childId } = await ctx.params;
  const actor = actorFromHeaders(req.headers);
  if (!(await dal.youngPeople.findById(childId))) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  const body = LearningProfileUpsertSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0]?.message ?? "Invalid profile" }, { status: 422 });
  }

  const existing = isSupabaseEnabled()
    ? await getCaraLearningProfileByChild(childId)
    : db.caraLearningProfiles.findByChild(childId);
  const now = new Date().toISOString();
  const profile: CaraChildLearningProfile = {
    id: existing?.id ?? generateId("clp"),
    child_id: childId,
    age: body.data.age ?? existing?.age ?? null,
    developmental_age_notes: body.data.developmental_age_notes ?? null,
    communication_needs: body.data.communication_needs ?? null,
    send_needs: body.data.send_needs ?? null,
    learning_style: body.data.learning_style,
    attention_profile: body.data.attention_profile ?? null,
    sensory_profile: body.data.sensory_profile ?? null,
    emotional_triggers: body.data.emotional_triggers ?? null,
    calming_strategies: body.data.calming_strategies ?? null,
    trauma_considerations: body.data.trauma_considerations ?? null,
    cultural_identity_notes: body.data.cultural_identity_notes ?? null,
    literacy_level: body.data.literacy_level ?? null,
    preferred_activities: body.data.preferred_activities ?? null,
    avoided_topics: body.data.avoided_topics ?? null,
    trusted_adults: body.data.trusted_adults ?? null,
    known_strengths: body.data.known_strengths ?? null,
    current_goals: body.data.current_goals ?? null,
    risk_themes: body.data.risk_themes,
    review_notes: body.data.review_notes ?? null,
    created_by: existing?.created_by ?? actor.userId,
    updated_by: actor.userId,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  db.caraLearningProfiles.upsert(profile);
  void persistCaraLearningProfile(profile as unknown as { child_id: string; [key: string]: unknown }); // durable when Supabase is on
  void writeAuditLog({
    home_id: process.env.SUPABASE_HOME_ID ?? tenantHomeId(),
    entity_type: "cara_learning_profile",
    entity_id: profile.id,
    action: existing ? "update" : "create",
    changes: { child_id: childId, fields_set: Object.keys(body.data) },
    performed_by: actor.userId,
  });

  return NextResponse.json({ data: { profile } });
}
