import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import {
  computeFamilyRelationships,
  type FamilyRelationshipsInput,
  type FamilyTimeInput,
  type ContactArrangementInput,
  type GenogramInput,
  type ProfessionalContactInput,
  type LACReviewInput,
  type MissingEpisodeInput,
  type PlacementMoveInput,
} from "@/lib/engines/family-relationships-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const childId = request.nextUrl.searchParams.get("childId");

  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }

  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  const child = store.youngPeople.find((yp) => yp.id === childId);
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const childName = `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim() || "Unknown";
  const placementStart = (child as any).placement_start_date
    ?? (child as any).admission_date
    ?? (child as any).created_at
    ?? "2025-01-01";

  // ── Family Time Sessions ──────────────────────────────────────────────────
  const familyTimeSessions: FamilyTimeInput[] = (store.familyTimeSessions ?? [])
    .filter((f: any) => f.child_id === childId)
    .map((f: any) => ({
      id: f.id,
      date: (f.date ?? "").slice(0, 10),
      family_member: f.family_member ?? "",
      family_member_name: f.family_member_name ?? "",
      duration_minutes: f.duration_minutes ?? 60,
      supervision_level: f.supervision_level ?? "supervised",
      child_presentation_before: f.child_presentation_before ?? "",
      child_presentation_after: f.child_presentation_after ?? "",
      was_it_safe: f.was_it_safe !== false,
      concerns: f.concerns_raised ?? f.concerns ?? [],
      positive_observations: f.positive_observations ?? [],
      child_voice: f.child_voice_after ?? f.child_voice ?? "",
    }));

  // ── Contact Arrangements ──────────────────────────────────────────────────
  // No contactArrangements collection exists — the old read was always empty.
  // The real data lives on ContactPlan.arrangements; flatten each plan's
  // arrangements into the per-arrangement shape the engine expects.
  const contactArrangements: ContactArrangementInput[] = (store.contactPlans ?? [])
    .filter((p) => p.child_id === childId)
    .flatMap((p) =>
      p.arrangements.map((a) => ({
        id: p.id,
        child_id: p.child_id,
        contact_type: a.type,
        frequency: a.frequency,
        supervision_level: a.supervision_level,
        court_ordered: !!p.court_orders,
        status: p.status,
        review_date: p.review_date ? p.review_date.slice(0, 10) : null,
      })),
    );

  // ── Genogram ──────────────────────────────────────────────────────────────
  const genograms = (store.genogramEntries ?? []).filter((g: any) => g.child_id === childId);
  let genogram: GenogramInput | null = null;
  if (genograms.length > 0) {
    const g = genograms[0] as any;
    genogram = {
      immediate_family: (g.immediate_family ?? []).map((f: any) => ({
        relation: f.relation ?? "",
        name: f.name ?? "",
        status: f.status ?? "living",
      })),
      extended_family: (g.extended_family ?? []).map((f: any) => ({
        relation: f.relation ?? "",
        name: f.name ?? "",
      })),
      important_non_family: (g.important_non_family_adults ?? []).map((a: any) => ({
        name: a.name ?? "",
        role: a.role ?? "",
      })),
      protective_relationships: g.protective_relationships ?? [],
      risk_relationships: g.risk_relationships ?? [],
      estranged_relationships: g.estranged_relationships ?? [],
      child_input_provided: g.child_input_provided ?? false,
    };
  }

  // ── Professional Contacts ─────────────────────────────────────────────────
  const professionalContacts: ProfessionalContactInput[] = (store.contactDirectoryEntries ?? [])
    .filter((c: any) => c.child_id === childId || c.linked_child_id === childId)
    .map((c: any) => ({
      role: c.role ?? c.relationship ?? "professional",
      name: c.name ?? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim(),
      last_contact_date: c.last_contact_date ? c.last_contact_date.slice(0, 10) : null,
      frequency: c.contact_frequency ?? "",
    }));

  // ── LAC Reviews ───────────────────────────────────────────────────────────
  const lacReviews: LACReviewInput[] = (store.lacReviews ?? [])
    .filter((r: any) => r.child_id === childId)
    .map((r: any) => ({
      date: (r.review_date ?? r.date ?? "").slice(0, 10),
      family_attended: r.family_attended ?? r.parent_attended ?? false,
      child_participated: r.child_participated ?? r.child_views_obtained ?? false,
      contact_discussed: r.contact_discussed ?? true,
    }));

  // ── Missing Episodes ──────────────────────────────────────────────────────
  const missingEpisodes: MissingEpisodeInput[] = (store.missingEpisodes ?? [])
    .filter((m: any) => m.child_id === childId)
    .map((m: any) => ({
      date: (m.date_missing ?? m.date ?? "").slice(0, 10),
      trigger: m.trigger ?? m.possible_reason ?? "",
      family_related: (m.trigger ?? m.possible_reason ?? "").toLowerCase().includes("family")
        || (m.trigger ?? m.possible_reason ?? "").toLowerCase().includes("contact")
        || (m.trigger ?? m.possible_reason ?? "").toLowerCase().includes("parent"),
    }));

  // ── Placement Moves ───────────────────────────────────────────────────────
  const placementMoves: PlacementMoveInput[] = (store.placementStabilityRecords ?? [])
    .filter((p: any) => p.child_id === childId && p.move_type)
    .map((p: any) => ({
      date: (p.move_date ?? p.date ?? "").slice(0, 10),
      reason: p.reason ?? p.move_type ?? "",
    }));

  const input: FamilyRelationshipsInput = {
    today,
    child_id: childId,
    child_name: childName,
    placement_start_date: placementStart.slice(0, 10),
    family_time_sessions: familyTimeSessions,
    contact_arrangements: contactArrangements,
    genogram,
    professional_contacts: professionalContacts,
    lac_reviews: lacReviews,
    missing_episodes: missingEpisodes,
    placement_moves: placementMoves,
  };

  const result = computeFamilyRelationships(input);
  return NextResponse.json({ data: result });
}
