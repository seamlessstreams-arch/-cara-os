import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { dal } from "@/lib/db";
import { todayStr } from "@/lib/utils";
import { mentionsAny } from "@/lib/text/keyword-match";
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

// Word lists, matched with the house `mentionsAny` helper rather than raw
// `.includes()` — the old code's `.toLowerCase().includes("contact")` would
// also fire on "contactless" and on a professional's job title.
const FAMILY_ROLE_WORDS = [
  "mother", "father", "parent", "grandmother", "grandfather", "grandparent",
  "aunt", "uncle", "sibling", "brother", "sister", "stepmother", "stepfather", "family",
];
const CONTACT_WORDS = ["contact", "family", "mother", "father", "parent", "sibling"];
const FAMILY_WORDS = ["family", "contact", "parent", "mother", "father", "sibling", "home"];

/** The text a missing episode actually carries about why it happened. */
function episodeNotes(m: { return_interview_notes: string | null; pattern_notes: string | null }): string {
  return [m.return_interview_notes, m.pattern_notes].filter(Boolean).join(" · ");
}

export async function GET(request: NextRequest) {
  const childId = request.nextUrl.searchParams.get("childId");

  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }

  const [contactDirectoryEntriesList, contactPlansList, familyTimeSessionsList, genogramEntriesList, lacReviewsList, missingEpisodesList, placementStabilityRecordsList, youngPeopleList] = await Promise.all([dal.contactDirectoryEntries.findAll(), dal.contactPlans.findAll(), dal.familyTimeSessions.findAll(), dal.genogramEntries.findAll(), dal.lacReviews.findAll(), dal.missingEpisodes.findAll(), dal.placementStabilityRecords.findAll(), dal.youngPeople.findAll()]);
  const today = todayStr();

  const child = youngPeopleList.find((yp) => yp.id === childId);
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const childName = `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim() || "Unknown";
  const placementStart = child.placement_start
    ?? ((child)).created_at
    ?? "2025-01-01";

  // ── Family Time Sessions ──────────────────────────────────────────────────
  const familyTimeSessions: FamilyTimeInput[] = (familyTimeSessionsList ?? [])
    .filter((f) => f.child_id === childId)
    .map((f) => ({
      id: f.id,
      date: (f.date ?? "").slice(0, 10),
      family_member: f.family_member ?? "",
      family_member_name: f.family_member_name ?? "",
      duration_minutes: f.duration_minutes ?? 60,
      supervision_level: f.supervision_level ?? "supervised",
      child_presentation_before: f.child_presentation_before ?? "",
      child_presentation_after: f.child_presentation_after ?? "",
      was_it_safe: f.was_it_safe !== false,
      concerns: f.concerns_raised,
      positive_observations: f.positive_observations,
      child_voice: f.child_voice_after,
    }));

  // ── Contact Arrangements ──────────────────────────────────────────────────
  // No contactArrangements collection exists — the old read was always empty.
  // The real data lives on ContactPlan.arrangements; flatten each plan's
  // arrangements into the per-arrangement shape the engine expects.
  const contactArrangements: ContactArrangementInput[] = (contactPlansList ?? [])
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
  const genograms = (genogramEntriesList ?? []).filter((g) => g.child_id === childId);
  let genogram: GenogramInput | null = null;
  if (genograms.length > 0) {
    // Was `genograms[0] as any`, which turned off checking for every read
    // below. The record's own shape already satisfies all of them.
    const g = genograms[0];
    genogram = {
      immediate_family: g.immediate_family.map((f) => ({
        relation: f.relation,
        name: f.name,
        status: f.status,
      })),
      extended_family: g.extended_family.map((f) => ({
        relation: f.relation,
        name: f.name,
      })),
      important_non_family: g.important_non_family_adults.map((a) => ({
        name: a.name,
        role: a.role,
      })),
      protective_relationships: g.protective_relationships,
      risk_relationships: g.risk_relationships,
      estranged_relationships: g.estranged_relationships,
      child_input_provided: g.child_input_provided,
    };
  }

  // ── Professional Contacts ─────────────────────────────────────────────────
  const professionalContacts: ProfessionalContactInput[] = (contactDirectoryEntriesList ?? [])
    // ContactDirectoryEntry has neither child_id nor linked_child_id — it links
    // through `linked_children`. Both sides of the old test were undefined, so
    // this list was empty for every child. (The collection is empty today too,
    // so the filter was latent rather than live.)
    .filter((c) => c.linked_children.includes(childId))
    .map((c) => ({
      role: c.role,
      name: c.name,
      // The entry records when it was last EDITED (`last_updated`), not when
      // anyone last made contact, and carries no contact frequency. Neither is
      // derivable, so both stay unmeasured rather than reading last_updated as
      // if it were a contact date.
      last_contact_date: null,
      frequency: "",
    }));

  // ── LAC Reviews ───────────────────────────────────────────────────────────
  const lacReviews: LACReviewInput[] = (lacReviewsList ?? [])
    .filter((r) => r.child_id === childId)
    .map((r) => ({
      date: r.date.slice(0, 10),
      // None of family_attended, child_participated or contact_discussed is on
      // LACReview, so every review reported no family present, the child not
      // participating, and contact discussed — the last one asserted, the
      // other two denied. The record carries an attendee list with roles, a
      // `child_participation` outcome, and the discussion headings.
      family_attended: r.attendees.some((a) => mentionsAny(a.role, FAMILY_ROLE_WORDS)),
      child_participated: r.child_participation !== "did_not_participate",
      contact_discussed: mentionsAny(r.key_discussions.join(" · "), CONTACT_WORDS),
    }));

  // ── Missing Episodes ──────────────────────────────────────────────────────
  const missingEpisodes: MissingEpisodeInput[] = (missingEpisodesList ?? [])
    .filter((m) => m.child_id === childId)
    .map((m) => ({
      date: m.date_missing.slice(0, 10),
      // MissingEpisode has no `trigger` or `possible_reason`, so `trigger` was
      // always "" and `family_related` — a safeguarding signal about whether a
      // child goes missing around family contact — was permanently false. What
      // the record does carry is the return-interview and pattern notes.
      trigger: episodeNotes(m),
      family_related: mentionsAny(episodeNotes(m), FAMILY_WORDS),
    }));

  // ── Placement Moves ───────────────────────────────────────────────────────
  const placementMoves: PlacementMoveInput[] = (placementStabilityRecordsList ?? [])
    // PlacementStabilityRecord has no move_type, move_date or reason: it is a
    // stability ASSESSMENT (risk, trend, factors), not a move log. `p.move_type`
    // was undefined, so the filter was already excluding everything — this list
    // has always been empty, and there is nothing here to build it from.
    .filter(() => false)
    .map((p) => ({ date: p.last_review.slice(0, 10), reason: "" }));

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
