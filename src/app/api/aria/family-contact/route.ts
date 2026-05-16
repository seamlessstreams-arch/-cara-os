// ══════════════════════════════════════════════════════════════════════════════
// API: /api/aria/family-contact — Family Contact Intelligence
//
// Analyses family time patterns, quality, compliance, and emotional impact.
// Pure deterministic — no AI. Returns structured assessment.
// Reg 7 alignment (Contact between child and parents, relatives, friends).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseFamilyContact } from "@/lib/aria/family-contact-intelligence";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { FamilyContact, ContactPlanRequirement, FamilyContactInput } from "@/lib/aria/family-contact-intelligence";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const childId = url.searchParams.get("childId");
    const homeId = process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";

    if (!childId) {
      return NextResponse.json(
        { error: "childId query parameter is required" },
        { status: 400 },
      );
    }

    // ── Fetch data from Supabase or use demo ────────────────────────────────
    const sb = createServerClient();
    let input: FamilyContactInput;

    if (sb && isSupabaseEnabled()) {
      input = await fetchContactData(sb, childId, homeId);
    } else {
      input = buildDemoData(childId);
    }

    // ── Run intelligence engine ─────────────────────────────────────────────
    const assessment = analyseFamilyContact(input);

    return NextResponse.json({
      success: true,
      data: assessment,
    });
  } catch (err) {
    console.error("[aria/family-contact] Error:", err);
    return NextResponse.json(
      { error: "Family contact intelligence failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// ── Supabase Data Fetch ─────────────────────────────────────────────────────

async function fetchContactData(sb: any, childId: string, homeId: string): Promise<FamilyContactInput> {
  // Fetch child basic info
  const { data: child } = await (sb.from("children") as SB)
    .select("id, first_name, last_name, placement_start_date")
    .eq("id", childId)
    .single();

  const childName = child ? `${child.first_name} ${child.last_name}` : "Unknown";
  const placementStartDate = child?.placement_start_date ?? "2026-01-01";

  // Fetch contacts from last 56 days (8 weeks)
  const cutoff = new Date(Date.now() - 56 * 86400000).toISOString();
  const { data: rawContacts } = await (sb.from("family_contacts") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("date", cutoff)
    .order("date", { ascending: false });

  const contacts: FamilyContact[] = (rawContacts ?? []).map((c: any) => ({
    id: c.id,
    date: c.date,
    contactType: c.contact_type ?? "face_to_face",
    familyMember: c.family_member_name ?? "Unknown",
    familyMemberRelation: c.family_member_relation ?? "other_family",
    planned: c.planned ?? true,
    occurred: c.occurred ?? true,
    cancelledBy: c.cancelled_by ?? undefined,
    cancellationReason: c.cancellation_reason ?? undefined,
    duration: c.duration_minutes ?? undefined,
    quality: c.quality ?? undefined,
    childMoodBefore: c.child_mood_before ?? undefined,
    childMoodAfter: c.child_mood_after ?? undefined,
    supervisedBy: c.supervised_by ?? undefined,
    incidentDuring: c.incident_during ?? false,
    incidentAfter: c.incident_after ?? false,
  }));

  // Fetch contact plan requirements
  const { data: rawReqs } = await (sb.from("contact_plan_requirements") as SB)
    .select("*")
    .eq("child_id", childId)
    .eq("active", true);

  const planRequirements: ContactPlanRequirement[] = (rawReqs ?? []).map((r: any) => ({
    familyMember: r.family_member_name ?? "Unknown",
    relation: r.family_member_relation ?? "other_family",
    requiredFrequency: r.required_frequency ?? "as_agreed",
    contactType: r.contact_type ?? "any",
    supervised: r.supervised ?? false,
    conditions: r.conditions ?? undefined,
  }));

  return {
    childId,
    childName,
    contacts,
    planRequirements,
    placementStartDate,
  };
}

// ── Demo Data ───────────────────────────────────────────────────────────────

function buildDemoData(childId: string): FamilyContactInput {
  const isJordan = childId.includes("jordan") || childId === "child_1";
  const childName = isJordan ? "Jordan" : "Sam";

  const contacts: FamilyContact[] = isJordan ? [
    // Mum — weekly, mixed quality, some cancellations
    { id: "fc_1", date: "2026-03-22", contactType: "face_to_face", familyMember: "Mum", familyMemberRelation: "mother", planned: true, occurred: true, quality: "positive", childMoodBefore: 3, childMoodAfter: 4 },
    { id: "fc_2", date: "2026-03-29", contactType: "face_to_face", familyMember: "Mum", familyMemberRelation: "mother", planned: true, occurred: true, quality: "mixed", childMoodBefore: 3, childMoodAfter: 3 },
    { id: "fc_3", date: "2026-04-05", contactType: "face_to_face", familyMember: "Mum", familyMemberRelation: "mother", planned: true, occurred: false, cancelledBy: "family", cancellationReason: "Mum unwell" },
    { id: "fc_4", date: "2026-04-12", contactType: "face_to_face", familyMember: "Mum", familyMemberRelation: "mother", planned: true, occurred: true, quality: "positive", childMoodBefore: 3, childMoodAfter: 5 },
    { id: "fc_5", date: "2026-04-19", contactType: "face_to_face", familyMember: "Mum", familyMemberRelation: "mother", planned: true, occurred: true, quality: "mixed", childMoodBefore: 3, childMoodAfter: 2, incidentAfter: true },
    { id: "fc_6", date: "2026-04-26", contactType: "face_to_face", familyMember: "Mum", familyMemberRelation: "mother", planned: true, occurred: false, cancelledBy: "family" },
    { id: "fc_7", date: "2026-05-03", contactType: "face_to_face", familyMember: "Mum", familyMemberRelation: "mother", planned: true, occurred: true, quality: "positive", childMoodBefore: 4, childMoodAfter: 4 },
    { id: "fc_8", date: "2026-05-10", contactType: "phone", familyMember: "Mum", familyMemberRelation: "mother", planned: false, occurred: true, quality: "positive", childMoodBefore: 3, childMoodAfter: 4 },
    // Dad — fortnightly, limited engagement
    { id: "fc_9", date: "2026-03-30", contactType: "face_to_face", familyMember: "Dad", familyMemberRelation: "father", planned: true, occurred: false, cancelledBy: "family" },
    { id: "fc_10", date: "2026-04-13", contactType: "face_to_face", familyMember: "Dad", familyMemberRelation: "father", planned: true, occurred: true, quality: "mixed", childMoodBefore: 3, childMoodAfter: 2 },
    { id: "fc_11", date: "2026-04-27", contactType: "face_to_face", familyMember: "Dad", familyMemberRelation: "father", planned: true, occurred: false, cancelledBy: "family" },
    { id: "fc_12", date: "2026-05-11", contactType: "face_to_face", familyMember: "Dad", familyMemberRelation: "father", planned: true, occurred: false, cancelledBy: "family" },
    // Sister — sporadic
    { id: "fc_13", date: "2026-04-20", contactType: "video", familyMember: "Chloe (sister)", familyMemberRelation: "sibling", planned: true, occurred: true, quality: "positive", childMoodBefore: 3, childMoodAfter: 5 },
  ] : [
    // Sam — minimal contact
    { id: "fc_1", date: "2026-04-05", contactType: "phone", familyMember: "Mum", familyMemberRelation: "mother", planned: true, occurred: true, quality: "positive", childMoodBefore: 3, childMoodAfter: 4 },
    { id: "fc_2", date: "2026-04-19", contactType: "phone", familyMember: "Mum", familyMemberRelation: "mother", planned: true, occurred: true, quality: "positive", childMoodBefore: 3, childMoodAfter: 4 },
    { id: "fc_3", date: "2026-05-03", contactType: "face_to_face", familyMember: "Mum", familyMemberRelation: "mother", planned: true, occurred: true, quality: "positive", childMoodBefore: 2, childMoodAfter: 4 },
  ];

  const planRequirements: ContactPlanRequirement[] = isJordan ? [
    { familyMember: "Mum", relation: "mother", requiredFrequency: "weekly", contactType: "face_to_face", supervised: false },
    { familyMember: "Dad", relation: "father", requiredFrequency: "fortnightly", contactType: "face_to_face", supervised: true },
    { familyMember: "Chloe (sister)", relation: "sibling", requiredFrequency: "monthly", contactType: "any", supervised: false },
  ] : [
    { familyMember: "Mum", relation: "mother", requiredFrequency: "fortnightly", contactType: "any", supervised: false },
  ];

  return {
    childId,
    childName,
    contacts,
    planRequirements,
    placementStartDate: "2025-09-01",
  };
}
