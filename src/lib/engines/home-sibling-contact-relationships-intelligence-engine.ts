import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME SIBLING CONTACT & RELATIONSHIPS INTELLIGENCE ENGINE
// Measures sibling relationship quality — sibling placement considerations,
// contact facilitation, relationship quality assessments, sibling event
// coordination, and child wishes documentation.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Contact), Reg 7 (Family contact), Reg 11 (Positive
// relationships). SCCIF: Experiences and progress of children.
// Store keys: siblingPlacementRecords, contactFacilitationRecords,
//             relationshipAssessmentRecords, siblingEventRecords,
//             childWishesRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface SiblingPlacementRecordInput {
  id: string;
  child_id: string;
  sibling_id: string;
  sibling_name: string;
  placement_together: boolean;
  placement_considered: boolean;
  consideration_documented: boolean;
  reason_for_separation: string;
  separation_justified: boolean;
  plan_to_reunify: boolean;
  reunification_timeline: string | null;
  social_worker_consulted: boolean;
  child_views_sought: boolean;
  sibling_views_sought: boolean;
  irm_consulted: boolean;
  review_date: string | null;
  review_completed: boolean;
  notes: string;
  created_at: string;
}

export interface ContactFacilitationRecordInput {
  id: string;
  child_id: string;
  sibling_id: string;
  date: string;
  contact_type: "face_to_face" | "video_call" | "phone_call" | "letter" | "social_media" | "shared_activity" | "overnight_stay" | "other";
  facilitated: boolean;
  location: string;
  duration_minutes: number;
  quality_rating: number; // 1-5
  child_enjoyed: boolean;
  sibling_enjoyed: boolean;
  any_concerns: boolean;
  concern_details: string;
  staff_supervised: boolean;
  transport_provided: boolean;
  contact_plan_followed: boolean;
  cancelled: boolean;
  cancellation_reason: string;
  rescheduled: boolean;
  notes: string;
  created_at: string;
}

export interface RelationshipAssessmentRecordInput {
  id: string;
  child_id: string;
  sibling_id: string;
  assessment_date: string;
  assessor: string;
  relationship_quality: "excellent" | "good" | "fair" | "poor" | "estranged";
  attachment_strength: "secure" | "anxious" | "avoidant" | "disorganised" | "not_assessed";
  communication_quality: "excellent" | "good" | "fair" | "poor";
  conflict_frequency: "none" | "rare" | "occasional" | "frequent" | "constant";
  positive_interactions_observed: boolean;
  shared_interests_identified: boolean;
  protective_factors_present: boolean;
  risk_factors_present: boolean;
  risk_factor_details: string;
  therapeutic_support_recommended: boolean;
  therapeutic_support_in_place: boolean;
  improvement_plan_created: boolean;
  next_review_date: string | null;
  child_participated: boolean;
  sibling_participated: boolean;
  notes: string;
  created_at: string;
}

export interface SiblingEventRecordInput {
  id: string;
  event_name: string;
  event_type: "birthday" | "holiday" | "celebration" | "trip" | "shared_meal" | "activity_day" | "family_event" | "milestone" | "other";
  date: string;
  children_invited: string[];
  children_attended: string[];
  siblings_present: boolean;
  event_quality_rating: number; // 1-5
  child_feedback_positive: boolean;
  sibling_feedback_positive: boolean;
  photos_taken: boolean;
  memory_book_updated: boolean;
  staff_facilitated: boolean;
  any_incidents: boolean;
  incident_details: string;
  planned_in_advance: boolean;
  child_involved_in_planning: boolean;
  notes: string;
  created_at: string;
}

export interface ChildWishesRecordInput {
  id: string;
  child_id: string;
  date: string;
  wish_category: "more_contact" | "less_contact" | "different_contact_type" | "placement_together" | "shared_activities" | "celebrations" | "communication" | "other";
  wish_details: string;
  child_voice_captured: boolean;
  age_appropriate_method: boolean;
  wish_acknowledged: boolean;
  wish_acted_upon: boolean;
  outcome_recorded: boolean;
  outcome_shared_with_child: boolean;
  child_satisfied_with_outcome: boolean;
  social_worker_informed: boolean;
  recorded_in_care_plan: boolean;
  advocate_involved: boolean;
  review_date: string | null;
  notes: string;
  created_at: string;
}

export interface SiblingContactInput {
  today: string;
  total_children: number;
  sibling_placement_records: SiblingPlacementRecordInput[];
  contact_facilitation_records: ContactFacilitationRecordInput[];
  relationship_assessment_records: RelationshipAssessmentRecordInput[];
  sibling_event_records: SiblingEventRecordInput[];
  child_wishes_records: ChildWishesRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SiblingContactRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SiblingContactInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface SiblingContactRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface SiblingContactResult {
  sibling_rating: SiblingContactRating;
  sibling_score: number | null;
  headline: string;
  total_placement_records: number;
  total_contact_records: number;
  total_assessment_records: number;
  total_event_records: number;
  total_wishes_records: number;
  placement_consideration_rate: number | null;
  contact_facilitation_rate: number | null;
  relationship_quality_rate: number | null;
  event_participation_rate: number | null;
  child_wishes_rate: number | null;
  child_satisfaction_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: SiblingContactRecommendation[];
  insights: SiblingContactInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): SiblingContactRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: SiblingContactRating,
  score: number,
  headline: string,
): SiblingContactResult {
  return {
    sibling_rating: rating,
    sibling_score: score,
    headline,
    total_placement_records: 0,
    total_contact_records: 0,
    total_assessment_records: 0,
    total_event_records: 0,
    total_wishes_records: 0,
    placement_consideration_rate: null,
    contact_facilitation_rate: null,
    relationship_quality_rate: null,
    event_participation_rate: null,
    child_wishes_rate: null,
    child_satisfaction_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeSiblingContactRelationships(
  input: SiblingContactInput,
): SiblingContactResult {
  const {
    total_children,
    sibling_placement_records,
    contact_facilitation_records,
    relationship_assessment_records,
    sibling_event_records,
    child_wishes_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    sibling_placement_records.length === 0 &&
    contact_facilitation_records.length === 0 &&
    relationship_assessment_records.length === 0 &&
    sibling_event_records.length === 0 &&
    child_wishes_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess sibling contact and relationships intelligence.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No sibling contact or relationship data recorded despite children on placement — sibling placement considerations, contact facilitation, and relationship assessments require urgent attention.",
      ),
      concerns: [
        "No sibling placement records, contact facilitation records, relationship assessments, sibling events, or child wishes records exist despite children being on placement — the home cannot evidence any sibling contact or relationship work.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of sibling placement considerations, contact facilitation, relationship quality assessments, sibling events, and children's wishes about sibling contact to evidence the home's commitment to maintaining and promoting sibling relationships.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 — Contact between child and family",
        },
        {
          rank: 2,
          recommendation:
            "For each child with siblings, complete a sibling placement consideration assessment documenting whether co-placement was explored, the reasons for any separation, and the ongoing plan for maintaining sibling relationships through regular contact.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Engagement with parents, etc.",
        },
      ],
      insights: [
        {
          text: "The complete absence of sibling contact and relationship records means the home cannot demonstrate compliance with Reg 7 (family contact) or evidence that sibling relationships are being actively promoted and maintained. This represents a significant regulatory gap and a failure to meet children's fundamental need for family connection.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Sibling placement consideration metrics ---
  const totalPlacementRecords = sibling_placement_records.length;
  const placementConsidered = sibling_placement_records.filter((p) => p.placement_considered).length;
  const placementConsiderationRate = rate(placementConsidered, totalPlacementRecords);

  const considerationDocumented = sibling_placement_records.filter(
    (p) => p.placement_considered && p.consideration_documented,
  ).length;
  const documentationRate = rate(considerationDocumented, totalPlacementRecords);

  const separatedRecords = sibling_placement_records.filter((p) => !p.placement_together);
  const separationJustified = separatedRecords.filter((p) => p.separation_justified).length;
  const separationJustifiedRate = rate(separationJustified, separatedRecords.length);

  const childViewsSought = sibling_placement_records.filter((p) => p.child_views_sought).length;
  const childViewsRate = rate(childViewsSought, totalPlacementRecords);

  // --- Contact facilitation metrics ---
  const totalContactRecords = contact_facilitation_records.length;
  const nonCancelled = contact_facilitation_records.filter((c) => !c.cancelled);
  const facilitatedContacts = nonCancelled.filter((c) => c.facilitated).length;
  const contactFacilitationRate = rate(facilitatedContacts, nonCancelled.length);

  const cancelledContacts = contact_facilitation_records.filter((c) => c.cancelled).length;
  const cancellationRate = rate(cancelledContacts, totalContactRecords);

  const contactPlanFollowed = nonCancelled.filter((c) => c.contact_plan_followed).length;
  const contactPlanRate = rate(contactPlanFollowed, nonCancelled.length);

  const childEnjoyedCount = nonCancelled.filter((c) => c.child_enjoyed).length;
  const childEnjoyedRate = rate(childEnjoyedCount, nonCancelled.length);

  const siblingEnjoyedCount = nonCancelled.filter((c) => c.sibling_enjoyed).length;
  const siblingEnjoyedRate = rate(siblingEnjoyedCount, nonCancelled.length);

  const contactConcernsCount = nonCancelled.filter((c) => c.any_concerns).length;
  const contactConcernRate = rate(contactConcernsCount, nonCancelled.length);

  const qualitySum = nonCancelled.reduce((sum, c) => sum + c.quality_rating, 0);
  const avgContactQuality =
    nonCancelled.length > 0
      ? Math.round((qualitySum / nonCancelled.length) * 100) / 100
      : null;

  // Contact type diversity
  const contactTypes = new Set(nonCancelled.map((c) => c.contact_type));
  const contactTypeDiversity = contactTypes.size;

  // --- Relationship assessment metrics ---
  const totalAssessmentRecords = relationship_assessment_records.length;

  const excellentOrGoodRelationships = relationship_assessment_records.filter(
    (a) => a.relationship_quality === "excellent" || a.relationship_quality === "good",
  ).length;
  const relationshipQualityRate = rate(excellentOrGoodRelationships, totalAssessmentRecords);

  const poorOrEstrangedRelationships = relationship_assessment_records.filter(
    (a) => a.relationship_quality === "poor" || a.relationship_quality === "estranged",
  ).length;
  const poorRelationshipRate = rate(poorOrEstrangedRelationships, totalAssessmentRecords);

  const positiveInteractions = relationship_assessment_records.filter(
    (a) => a.positive_interactions_observed,
  ).length;
  const positiveInteractionRate = rate(positiveInteractions, totalAssessmentRecords);

  const therapeuticRecommended = relationship_assessment_records.filter(
    (a) => a.therapeutic_support_recommended,
  ).length;
  const therapeuticInPlace = relationship_assessment_records.filter(
    (a) => a.therapeutic_support_recommended && a.therapeutic_support_in_place,
  ).length;
  const therapeuticFollowThroughRate = rate(therapeuticInPlace, therapeuticRecommended);

  const frequentConflict = relationship_assessment_records.filter(
    (a) => a.conflict_frequency === "frequent" || a.conflict_frequency === "constant",
  ).length;
  const frequentConflictRate = rate(frequentConflict, totalAssessmentRecords);

  // --- Sibling event metrics ---
  const totalEventRecords = sibling_event_records.length;

  const totalChildrenInvited = sibling_event_records.reduce(
    (sum, e) => sum + e.children_invited.length,
    0,
  );
  const totalChildrenAttended = sibling_event_records.reduce(
    (sum, e) => sum + e.children_attended.length,
    0,
  );
  const eventParticipationRate = rate(totalChildrenAttended, totalChildrenInvited);

  const eventQualitySum = sibling_event_records.reduce(
    (sum, e) => sum + e.event_quality_rating,
    0,
  );
  const avgEventQuality =
    totalEventRecords > 0
      ? Math.round((eventQualitySum / totalEventRecords) * 100) / 100
      : null;

  const memoryBookUpdated = sibling_event_records.filter((e) => e.memory_book_updated).length;
  const memoryBookRate = rate(memoryBookUpdated, totalEventRecords);

  const photosTaken = sibling_event_records.filter((e) => e.photos_taken).length;
  const photosRate = rate(photosTaken, totalEventRecords);

  const eventIncidents = sibling_event_records.filter((e) => e.any_incidents).length;
  const eventIncidentRate = rate(eventIncidents, totalEventRecords);

  // Event type diversity
  const eventTypes = new Set(sibling_event_records.map((e) => e.event_type));
  const eventTypeDiversity = eventTypes.size;

  // --- Child wishes metrics ---
  const totalWishesRecords = child_wishes_records.length;

  const voiceCaptured = child_wishes_records.filter((w) => w.child_voice_captured).length;
  const voiceCapturedRate = rate(voiceCaptured, totalWishesRecords);

  const ageAppropriateMethod = child_wishes_records.filter(
    (w) => w.age_appropriate_method,
  ).length;
  const ageAppropriateRate = rate(ageAppropriateMethod, totalWishesRecords);

  const wishAcknowledged = child_wishes_records.filter((w) => w.wish_acknowledged).length;
  const wishAcknowledgedRate = rate(wishAcknowledged, totalWishesRecords);

  const wishActedUpon = child_wishes_records.filter((w) => w.wish_acted_upon).length;
  const wishActedUponRate = rate(wishActedUpon, totalWishesRecords);
  // childWishesRate = composite of acknowledged + acted upon
  const childWishesRate =
    totalWishesRecords > 0 ? Math.round((wishAcknowledgedRate! + wishActedUponRate!) / 2) : null;

  const outcomeShared = child_wishes_records.filter((w) => w.outcome_shared_with_child).length;
  const outcomeSharedRate = rate(outcomeShared, totalWishesRecords);

  const childSatisfied = child_wishes_records.filter(
    (w) => w.child_satisfied_with_outcome,
  ).length;
  const childSatisfactionRate = rate(childSatisfied, totalWishesRecords);

  const socialWorkerInformed = child_wishes_records.filter(
    (w) => w.social_worker_informed,
  ).length;
  const socialWorkerInformedRate = rate(socialWorkerInformed, totalWishesRecords);

  const recordedInCarePlan = child_wishes_records.filter(
    (w) => w.recorded_in_care_plan,
  ).length;
  const carePlanRate = rate(recordedInCarePlan, totalWishesRecords);

  // Wish category breakdown
  const wishCategories: Record<string, number> = {};
  for (const w of child_wishes_records) {
    wishCategories[w.wish_category] = (wishCategories[w.wish_category] ?? 0) + 1;
  }

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: placementConsiderationRate (>=95: +4, >=80: +2) ---
  if (meets(placementConsiderationRate, 95)) score += 4;
  else if (meets(placementConsiderationRate, 80)) score += 2;

  // --- Bonus 2: contactFacilitationRate (>=90: +4, >=75: +2) ---
  if (meets(contactFacilitationRate, 90)) score += 4;
  else if (meets(contactFacilitationRate, 75)) score += 2;

  // --- Bonus 3: relationshipQualityRate (>=80: +4, >=60: +2) ---
  if (meets(relationshipQualityRate, 80)) score += 4;
  else if (meets(relationshipQualityRate, 60)) score += 2;

  // --- Bonus 4: eventParticipationRate (>=90: +3, >=70: +1) ---
  if (meets(eventParticipationRate, 90)) score += 3;
  else if (meets(eventParticipationRate, 70)) score += 1;

  // --- Bonus 5: childWishesRate (>=90: +3, >=70: +1) ---
  if ((childWishesRate ?? 0) >= 90) score += 3;
  else if ((childWishesRate ?? 0) >= 70) score += 1;

  // --- Bonus 6: childSatisfactionRate (>=90: +3, >=70: +1) ---
  if (meets(childSatisfactionRate, 90)) score += 3;
  else if (meets(childSatisfactionRate, 70)) score += 1;

  // --- Bonus 7: contactPlanRate (>=90: +3, >=70: +1) ---
  if (meets(contactPlanRate, 90)) score += 3;
  else if (meets(contactPlanRate, 70)) score += 1;

  // --- Bonus 8: childEnjoyedRate (>=90: +2, >=70: +1) ---
  if (meets(childEnjoyedRate, 90)) score += 2;
  else if (meets(childEnjoyedRate, 70)) score += 1;

  // --- Bonus 9: avgContactQuality (>=4.0: +2, >=3.0: +1) ---
  if ((avgContactQuality ?? 0) >= 4.0) score += 2;
  else if ((avgContactQuality ?? 0) >= 3.0) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // placementConsiderationRate < 50 → -5 (guarded)
  if (below(placementConsiderationRate, 50) && sibling_placement_records.length > 0) score -= 5;

  // contactFacilitationRate < 50 → -5 (guarded)
  if (below(contactFacilitationRate, 50) && contact_facilitation_records.length > 0) score -= 5;

  // childWishesRate < 40 → -4 (guarded)
  if ((childWishesRate ?? 0) < 40 && child_wishes_records.length > 0) score -= 4;

  // relationshipQualityRate < 30 → -4 (guarded)
  if (below(relationshipQualityRate, 30) && relationship_assessment_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const sibling_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (meets(placementConsiderationRate, 95) && totalPlacementRecords > 0) {
    strengths.push(
      `${placementConsiderationRate}% of sibling placements have documented consideration — the home demonstrates exemplary practice in evidencing sibling placement decisions and ensuring every sibling group is properly assessed.`,
    );
  } else if (meets(placementConsiderationRate, 80) && totalPlacementRecords > 0) {
    strengths.push(
      `${placementConsiderationRate}% sibling placement consideration rate — strong evidence that the home actively considers co-placement for siblings and documents the rationale for placement decisions.`,
    );
  }

  if (meets(contactFacilitationRate, 90) && nonCancelled.length > 0) {
    strengths.push(
      `${contactFacilitationRate}% of sibling contacts actively facilitated — the home consistently supports and enables meaningful sibling contact, demonstrating commitment to maintaining family relationships.`,
    );
  } else if (meets(contactFacilitationRate, 75) && nonCancelled.length > 0) {
    strengths.push(
      `${contactFacilitationRate}% contact facilitation rate — good evidence that the home actively supports sibling contact arrangements and removes barriers to maintaining relationships.`,
    );
  }

  if (meets(relationshipQualityRate, 80) && totalAssessmentRecords > 0) {
    strengths.push(
      `${relationshipQualityRate}% of assessed sibling relationships rated as good or excellent — the home's approach to sibling contact is successfully maintaining and strengthening sibling bonds.`,
    );
  } else if (meets(relationshipQualityRate, 60) && totalAssessmentRecords > 0) {
    strengths.push(
      `${relationshipQualityRate}% of sibling relationships assessed as good or excellent — the majority of sibling relationships are being maintained at a positive level through the home's contact facilitation.`,
    );
  }

  if (meets(eventParticipationRate, 90) && totalChildrenInvited > 0) {
    strengths.push(
      `${eventParticipationRate}% attendance at sibling events — children and siblings are consistently attending and participating in planned events, demonstrating the effectiveness of the home's event coordination.`,
    );
  } else if (meets(eventParticipationRate, 70) && totalChildrenInvited > 0) {
    strengths.push(
      `${eventParticipationRate}% sibling event participation — good attendance at shared events indicates the home creates welcoming and accessible opportunities for siblings to spend time together.`,
    );
  }

  if ((childWishesRate ?? 0) >= 90 && totalWishesRecords > 0) {
    strengths.push(
      `${childWishesRate}% of children's wishes about sibling contact acknowledged and acted upon — the home demonstrates outstanding practice in listening to and responding to what children want from their sibling relationships.`,
    );
  } else if ((childWishesRate ?? 0) >= 70 && totalWishesRecords > 0) {
    strengths.push(
      `${childWishesRate}% child wishes response rate — good evidence that the home captures children's views about sibling contact and takes meaningful action in response.`,
    );
  }

  if (meets(childSatisfactionRate, 90) && totalWishesRecords > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction with outcomes — children report high levels of satisfaction with how their wishes about sibling contact have been addressed, evidencing child-centred practice.`,
    );
  } else if (meets(childSatisfactionRate, 70) && totalWishesRecords > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction rate — the majority of children are satisfied with the outcomes of their expressed wishes about sibling contact.`,
    );
  }

  if (meets(contactPlanRate, 90) && nonCancelled.length > 0) {
    strengths.push(
      `${contactPlanRate}% of contacts follow the agreed contact plan — the home consistently delivers sibling contact in line with agreed arrangements, providing stability and predictability for children.`,
    );
  } else if (meets(contactPlanRate, 70) && nonCancelled.length > 0) {
    strengths.push(
      `${contactPlanRate}% contact plan adherence — good compliance with agreed contact arrangements ensures children experience consistent and reliable sibling contact.`,
    );
  }

  if (meets(childEnjoyedRate, 90) && nonCancelled.length > 0) {
    strengths.push(
      `${childEnjoyedRate}% of sibling contacts reported as enjoyable by children — the quality of contact experiences is consistently high, indicating well-facilitated and child-centred arrangements.`,
    );
  } else if (meets(childEnjoyedRate, 70) && nonCancelled.length > 0) {
    strengths.push(
      `${childEnjoyedRate}% of children enjoyed their sibling contacts — the majority of contact sessions are positive experiences for the children involved.`,
    );
  }

  if ((avgContactQuality ?? 0) >= 4.0 && nonCancelled.length > 0) {
    strengths.push(
      `Average contact quality rating of ${avgContactQuality}/5 — the home consistently facilitates high-quality sibling contacts that support relationship maintenance and child wellbeing.`,
    );
  } else if ((avgContactQuality ?? 0) >= 3.0 && nonCancelled.length > 0) {
    strengths.push(
      `Average contact quality rating of ${avgContactQuality}/5 — contact sessions are generally well-facilitated and appropriate for the children's needs.`,
    );
  }

  if (meets(documentationRate, 90) && totalPlacementRecords > 0) {
    strengths.push(
      `${documentationRate}% of placement considerations documented — the home maintains thorough records of sibling placement decision-making, supporting regulatory compliance and evidence-based practice.`,
    );
  }

  if (meets(separationJustifiedRate, 90) && separatedRecords.length > 0) {
    strengths.push(
      `${separationJustifiedRate}% of sibling separations have documented justification — where siblings are not placed together, the reasons are clearly recorded and defensible.`,
    );
  }

  if (meets(childViewsRate, 90) && totalPlacementRecords > 0) {
    strengths.push(
      `${childViewsRate}% of placement decisions include the child's views — children's voices are central to sibling placement considerations.`,
    );
  }

  if (meets(therapeuticFollowThroughRate, 90) && therapeuticRecommended > 0) {
    strengths.push(
      `${therapeuticFollowThroughRate}% of recommended therapeutic support in place — where professional support has been recommended for sibling relationships, the home has followed through effectively.`,
    );
  }

  if (meets(positiveInteractionRate, 90) && totalAssessmentRecords > 0) {
    strengths.push(
      `Positive interactions observed in ${positiveInteractionRate}% of assessments — sibling relationships are characterised by warm, positive interactions that are being actively nurtured by the home.`,
    );
  }

  if (meets(voiceCapturedRate, 95) && totalWishesRecords > 0) {
    strengths.push(
      `${voiceCapturedRate}% of wishes records capture the child's authentic voice — the home uses effective methods to hear and record what children genuinely want from their sibling relationships.`,
    );
  }

  if (meets(outcomeSharedRate, 90) && totalWishesRecords > 0) {
    strengths.push(
      `${outcomeSharedRate}% of outcomes shared with children — the home closes the loop by informing children about what has happened in response to their expressed wishes, demonstrating genuine respect for children's participation.`,
    );
  }

  if (meets(memoryBookRate, 80) && totalEventRecords > 0) {
    strengths.push(
      `Memory books updated for ${memoryBookRate}% of sibling events — the home actively preserves memories of sibling time together, supporting children's identity and sense of belonging.`,
    );
  }

  if (contactTypeDiversity >= 4 && nonCancelled.length > 0) {
    strengths.push(
      `${contactTypeDiversity} different types of sibling contact used — the home offers diverse contact arrangements including face-to-face, virtual, and shared activity options to suit different sibling needs.`,
    );
  }

  if (eventTypeDiversity >= 4 && totalEventRecords > 0) {
    strengths.push(
      `${eventTypeDiversity} different types of sibling events organised — the home provides varied opportunities for siblings to share experiences across birthdays, celebrations, activities, and milestones.`,
    );
  }

  if (cancellationRate === 0 && totalContactRecords > 0) {
    strengths.push(
      "Zero contact cancellations — the home has maintained every planned sibling contact without disruption, demonstrating outstanding reliability and commitment to sibling relationships.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (below(placementConsiderationRate, 50) && totalPlacementRecords > 0) {
    concerns.push(
      `Only ${placementConsiderationRate}% of sibling placements have documented consideration — the home is failing to evidence that co-placement has been properly considered for the majority of sibling groups, representing a significant regulatory concern under Reg 7.`,
    );
  } else if (meets(placementConsiderationRate, 50) && below(placementConsiderationRate, 80) && totalPlacementRecords > 0) {
    concerns.push(
      `Sibling placement consideration at ${placementConsiderationRate}% — not all sibling placement decisions are being properly considered and documented, creating gaps in the home's evidence base.`,
    );
  }

  if (below(contactFacilitationRate, 50) && contact_facilitation_records.length > 0) {
    concerns.push(
      `Only ${contactFacilitationRate}% of sibling contacts facilitated — the majority of sibling contact is not being actively supported, indicating a fundamental failure to promote family relationships as required by Reg 7.`,
    );
  } else if (meets(contactFacilitationRate, 50) && below(contactFacilitationRate, 75) && contact_facilitation_records.length > 0) {
    concerns.push(
      `Contact facilitation at ${contactFacilitationRate}% — a significant proportion of sibling contacts are not being actively facilitated, suggesting barriers that the home needs to address.`,
    );
  }

  if (below(relationshipQualityRate, 30) && totalAssessmentRecords > 0) {
    concerns.push(
      `Only ${relationshipQualityRate}% of sibling relationships assessed as good or excellent — the majority of sibling relationships show concerning quality levels, suggesting that contact arrangements are not effectively supporting relationship maintenance.`,
    );
  } else if (meets(relationshipQualityRate, 30) && below(relationshipQualityRate, 60) && totalAssessmentRecords > 0) {
    concerns.push(
      `Relationship quality rate at ${relationshipQualityRate}% — a significant number of sibling relationships are not assessed as good or excellent, indicating the need for enhanced relationship support and more effective contact arrangements.`,
    );
  }

  if ((childWishesRate ?? 0) < 40 && totalWishesRecords > 0) {
    concerns.push(
      `Only ${childWishesRate}% of children's wishes about sibling contact acknowledged and acted upon — children's views are not being heard or responded to, undermining the child-centred approach required by Reg 11 and the SCCIF.`,
    );
  } else if ((childWishesRate ?? 0) >= 40 && (childWishesRate ?? 0) < 70 && totalWishesRecords > 0) {
    concerns.push(
      `Child wishes response rate at ${childWishesRate}% — not all children's expressed wishes about sibling contact are being acknowledged or acted upon, weakening the home's child-centred practice.`,
    );
  }

  if (below(childSatisfactionRate, 40) && totalWishesRecords > 0) {
    concerns.push(
      `Only ${childSatisfactionRate}% child satisfaction with sibling contact outcomes — the majority of children are not satisfied with how their wishes about sibling contact have been addressed, raising serious concerns about the quality of child-centred practice.`,
    );
  } else if (meets(childSatisfactionRate, 40) && below(childSatisfactionRate, 70) && totalWishesRecords > 0) {
    concerns.push(
      `Child satisfaction at ${childSatisfactionRate}% — a notable proportion of children are dissatisfied with sibling contact outcomes, suggesting the home needs to better understand and respond to children's needs.`,
    );
  }

  if (meets(cancellationRate, 30) && totalContactRecords > 0) {
    concerns.push(
      `${cancellationRate}% of sibling contacts cancelled — high cancellation rates cause distress for children and erode trust in contact arrangements. This pattern of disruption undermines sibling relationship stability.`,
    );
  } else if (meets(cancellationRate, 15) && below(cancellationRate, 30) && totalContactRecords > 0) {
    concerns.push(
      `${cancellationRate}% contact cancellation rate — some sibling contacts are being cancelled, causing disappointment and disruption to children who rely on these arrangements for maintaining family connections.`,
    );
  }

  if (meets(contactConcernRate, 30) && nonCancelled.length > 0) {
    concerns.push(
      `Concerns recorded in ${contactConcernRate}% of sibling contacts — a significant proportion of contacts are raising concerns, suggesting that contact arrangements may need review to ensure they are safe and beneficial.`,
    );
  } else if (meets(contactConcernRate, 15) && below(contactConcernRate, 30) && nonCancelled.length > 0) {
    concerns.push(
      `${contactConcernRate}% of contacts raising concerns — some sibling contacts are generating concerns that need to be monitored and addressed to ensure contact remains positive.`,
    );
  }

  if (meets(poorRelationshipRate, 30) && totalAssessmentRecords > 0) {
    concerns.push(
      `${poorRelationshipRate}% of sibling relationships rated poor or estranged — a significant proportion of sibling relationships are in difficulty, requiring urgent intervention and support to prevent further deterioration.`,
    );
  } else if (meets(poorRelationshipRate, 15) && below(poorRelationshipRate, 30) && totalAssessmentRecords > 0) {
    concerns.push(
      `${poorRelationshipRate}% of relationships assessed as poor or estranged — some sibling relationships are struggling and require targeted support and enhanced contact arrangements.`,
    );
  }

  if (meets(frequentConflictRate, 25) && totalAssessmentRecords > 0) {
    concerns.push(
      `${frequentConflictRate}% of sibling relationships experiencing frequent or constant conflict — unresolved conflict between siblings risks causing emotional harm and may indicate the need for therapeutic intervention.`,
    );
  }

  if (below(therapeuticFollowThroughRate, 50) && therapeuticRecommended > 0) {
    concerns.push(
      `Only ${therapeuticFollowThroughRate}% of recommended therapeutic support in place — where professionals have recommended support for sibling relationships, the home has not followed through, leaving children without necessary help.`,
    );
  }

  if (below(eventParticipationRate, 50) && totalChildrenInvited > 0) {
    concerns.push(
      `Only ${eventParticipationRate}% attendance at sibling events — poor attendance suggests that events may not be accessible, appealing, or properly facilitated for children and their siblings.`,
    );
  } else if (meets(eventParticipationRate, 50) && below(eventParticipationRate, 70) && totalChildrenInvited > 0) {
    concerns.push(
      `Sibling event participation at ${eventParticipationRate}% — some children and siblings are not attending planned events, reducing opportunities for shared positive experiences.`,
    );
  }

  if (below(voiceCapturedRate, 50) && totalWishesRecords > 0) {
    concerns.push(
      `Only ${voiceCapturedRate}% of wishes records capture the child's authentic voice — the home is not effectively hearing what children want from their sibling relationships, undermining the child-centred approach.`,
    );
  }

  if (below(socialWorkerInformedRate, 50) && totalWishesRecords > 0) {
    concerns.push(
      `Only ${socialWorkerInformedRate}% of children's wishes shared with the social worker — the child's placing authority is not being kept informed about the child's views on sibling contact, weakening multi-agency working.`,
    );
  }

  if (meets(eventIncidentRate, 20) && totalEventRecords > 0) {
    concerns.push(
      `${eventIncidentRate}% of sibling events involved incidents — a concerning proportion of events are disrupted by incidents, potentially undermining the positive intent of sibling contact opportunities.`,
    );
  }

  if (below(contactPlanRate, 50) && nonCancelled.length > 0) {
    concerns.push(
      `Only ${contactPlanRate}% of contacts follow the agreed plan — the majority of sibling contacts deviate from agreed arrangements, creating inconsistency and unpredictability for children.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: SiblingContactRecommendation[] = [];
  let rank = 0;

  if (below(placementConsiderationRate, 50) && totalPlacementRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review all sibling placement arrangements — ensure every sibling group has a documented placement consideration assessment that evidences whether co-placement was explored, the rationale for any separation, and the ongoing plan for maintaining sibling relationships.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Contact between child and family",
    });
  }

  if (below(contactFacilitationRate, 50) && contact_facilitation_records.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a comprehensive sibling contact facilitation improvement plan — identify and remove barriers to contact, ensure transport is available, train staff in contact facilitation skills, and establish a proactive approach to promoting sibling contact for every child.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Contact between child and family",
    });
  }

  if ((childWishesRate ?? 0) < 40 && totalWishesRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop systematic processes for capturing, acknowledging, and acting on children's wishes about sibling contact — use age-appropriate methods to hear children's views, record their wishes, and provide meaningful responses that demonstrate their voice has been heard and valued.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (below(relationshipQualityRate, 30) && totalAssessmentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commission professional relationship assessments for sibling groups where quality is assessed as poor or estranged — develop targeted intervention plans to rebuild relationships, consider therapeutic support, and ensure contact arrangements are designed to improve relationship quality.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engagement with parents, etc.",
    });
  }

  if (meets(cancellationRate, 30) && totalContactRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address the high rate of contact cancellations — analyse the reasons for cancellations, implement contingency plans to prevent avoidable cancellations, and ensure rescheduling happens promptly when cancellations are unavoidable.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Contact between child and family",
    });
  }

  if (below(childSatisfactionRate, 40) && totalWishesRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Engage with children to understand their dissatisfaction with sibling contact outcomes — review how wishes are responded to, ensure children understand the process, and explore creative solutions to meet children's expressed needs.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Experiences and progress of children",
    });
  }

  if (below(therapeuticFollowThroughRate, 50) && therapeuticRecommended > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all recommended therapeutic support for sibling relationships is put in place — liaise with CAMHS and other therapeutic services to secure timely access to recommended interventions and track progress.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (meets(frequentConflictRate, 25) && totalAssessmentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address persistent sibling conflict through structured mediation and therapeutic intervention — conflict between siblings causes emotional harm and needs professional support to resolve, not just management during contact sessions.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (meets(contactFacilitationRate, 50) && below(contactFacilitationRate, 75) && contact_facilitation_records.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve contact facilitation to at least 75% — review barriers that prevent active facilitation of sibling contacts and implement solutions including better transport arrangements, flexible scheduling, and staff allocation for contact support.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Contact between child and family",
    });
  }

  if (meets(placementConsiderationRate, 50) && below(placementConsiderationRate, 80) && totalPlacementRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen sibling placement consideration processes — ensure all placement decisions include documented evidence of co-placement exploration, child and sibling views, and social worker consultation.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Contact between child and family",
    });
  }

  if ((childWishesRate ?? 0) >= 40 && (childWishesRate ?? 0) < 70 && totalWishesRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve the response to children's wishes about sibling contact — establish a tracking system to ensure every expressed wish is acknowledged, acted upon, and the outcome is fed back to the child.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (meets(relationshipQualityRate, 30) && below(relationshipQualityRate, 60) && totalAssessmentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance contact quality and frequency for sibling relationships assessed below 'good' — consider increasing contact frequency, diversifying contact types, and providing relationship-building activities during contact sessions.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engagement with parents, etc.",
    });
  }

  if (below(eventParticipationRate, 50) && totalChildrenInvited > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review sibling event planning to improve attendance — consult with children about preferred event types and timing, remove practical barriers such as transport and scheduling, and ensure events are welcoming for visiting siblings.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Experiences and progress of children",
    });
  }

  if (below(voiceCapturedRate, 50) && totalWishesRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement age-appropriate methods for capturing children's authentic views about sibling contact — use creative tools such as talking mats, wishes trees, or structured conversations adapted to each child's communication needs and developmental stage.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (below(socialWorkerInformedRate, 50) && totalWishesRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish routine sharing of children's sibling contact wishes with their social workers — the placing authority needs to know what children want from their sibling relationships to inform care planning and review decisions.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engagement with parents, etc.",
    });
  }

  if (meets(cancellationRate, 15) && below(cancellationRate, 30) && totalContactRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Reduce contact cancellations by identifying common causes and implementing preventive measures — ensure backup arrangements are in place and that rescheduling happens promptly when cancellations occur.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Contact between child and family",
    });
  }

  if (meets(eventParticipationRate, 50) && below(eventParticipationRate, 70) && totalChildrenInvited > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase sibling event participation by involving children in event planning, offering diverse event types, and ensuring practical arrangements such as transport and timing support attendance.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress of children",
    });
  }

  if (meets(childSatisfactionRate, 40) && below(childSatisfactionRate, 70) && totalWishesRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Explore with children how the response to their sibling contact wishes could be improved — understand what drives dissatisfaction and develop more responsive, creative approaches to meeting children's needs.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (below(memoryBookRate, 50) && totalEventRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve memory book and life story recording for sibling events — capturing memories of sibling time together supports children's identity, sense of belonging, and emotional wellbeing.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress of children",
    });
  }

  if (contactTypeDiversity < 3 && nonCancelled.length > 3) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Diversify sibling contact arrangements — offer a wider range of contact types including face-to-face visits, video calls, shared activities, and overnight stays to meet the different needs and preferences of sibling groups.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Contact between child and family",
    });
  }

  if (below(carePlanRate, 60) && totalWishesRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children's expressed wishes about sibling contact are systematically recorded in their care plans — this provides a formal record of the child's voice and ensures wishes are considered in care planning and review.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: SiblingContactInsight[] = [];

  // -- Critical insights --

  if (below(placementConsiderationRate, 50) && totalPlacementRecords > 0) {
    insights.push({
      text: `Only ${placementConsiderationRate}% of sibling placements have documented consideration. The home cannot demonstrate that co-placement has been properly explored for most sibling groups. This represents a significant failure to comply with Reg 7 and places the home at risk of regulatory action regarding sibling placement practice.`,
      severity: "critical",
    });
  }

  if (below(contactFacilitationRate, 50) && contact_facilitation_records.length > 0) {
    insights.push({
      text: `Only ${contactFacilitationRate}% of sibling contacts facilitated. The home is not actively promoting and supporting sibling contact, meaning children are being denied meaningful opportunities to maintain family relationships. This undermines Reg 7 compliance and causes emotional harm to children who are separated from their siblings.`,
      severity: "critical",
    });
  }

  if ((childWishesRate ?? 0) < 40 && totalWishesRecords > 0) {
    insights.push({
      text: `Children's wishes about sibling contact are being acknowledged and acted upon in only ${childWishesRate}% of cases. The home is not demonstrating that children's views are central to sibling contact arrangements, undermining the child-centred approach that Ofsted expects to see in practice.`,
      severity: "critical",
    });
  }

  if (below(relationshipQualityRate, 30) && totalAssessmentRecords > 0) {
    insights.push({
      text: `Only ${relationshipQualityRate}% of sibling relationships rated good or excellent. The majority of sibling relationships assessed by the home are in difficulty, suggesting that current contact arrangements are insufficient to maintain and strengthen sibling bonds. Without intervention, these relationships risk further deterioration.`,
      severity: "critical",
    });
  }

  if (totalAssessmentRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No sibling relationship assessments recorded despite children being on placement. Without formal assessment of sibling relationship quality, the home cannot evidence that it understands the dynamics of sibling relationships or is taking appropriate action to maintain and strengthen them.",
      severity: "critical",
    });
  }

  if (totalWishesRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No records of children's wishes about sibling contact. The absence of any wishes documentation means the home cannot demonstrate that children's views are being sought, heard, or responded to regarding their sibling relationships — a fundamental element of child-centred practice.",
      severity: "critical",
    });
  }

  if (meets(cancellationRate, 30) && totalContactRecords > 0) {
    insights.push({
      text: `${cancellationRate}% of sibling contacts cancelled. Repeated cancellations cause significant emotional distress for children who look forward to seeing their siblings. Each cancellation erodes children's trust in adults and their sense of security in contact arrangements.`,
      severity: "critical",
    });
  }

  if (meets(poorRelationshipRate, 30) && totalAssessmentRecords > 0) {
    insights.push({
      text: `${poorRelationshipRate}% of sibling relationships assessed as poor or estranged. A significant proportion of children are experiencing damaged or broken sibling relationships. Without targeted intervention, these children risk permanent loss of sibling connection, with lifelong consequences for their emotional wellbeing and identity.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (meets(placementConsiderationRate, 50) && below(placementConsiderationRate, 80) && totalPlacementRecords > 0) {
    insights.push({
      text: `Sibling placement consideration at ${placementConsiderationRate}% — while improving, the home still has gaps in evidencing that co-placement has been explored for all sibling groups. Consistent documentation of placement decision-making strengthens regulatory compliance and ensures no sibling group is overlooked.`,
      severity: "warning",
    });
  }

  if (meets(contactFacilitationRate, 50) && below(contactFacilitationRate, 75) && contact_facilitation_records.length > 0) {
    insights.push({
      text: `Contact facilitation at ${contactFacilitationRate}% — while some contacts are actively supported, a significant proportion are not being facilitated. Identifying and removing barriers to facilitation would improve the consistency and quality of sibling contact.`,
      severity: "warning",
    });
  }

  if (meets(relationshipQualityRate, 30) && below(relationshipQualityRate, 60) && totalAssessmentRecords > 0) {
    insights.push({
      text: `Sibling relationship quality at ${relationshipQualityRate}% — a notable number of relationships are assessed below good. Enhanced contact arrangements, therapeutic support, and relationship-building activities could help improve outcomes for these sibling groups.`,
      severity: "warning",
    });
  }

  if ((childWishesRate ?? 0) >= 40 && (childWishesRate ?? 0) < 70 && totalWishesRecords > 0) {
    insights.push({
      text: `Child wishes response rate at ${childWishesRate}% — not all children's expressed wishes about sibling contact are receiving acknowledgement and action. Strengthening the wishes process would demonstrate more consistent child-centred practice.`,
      severity: "warning",
    });
  }

  if (meets(childSatisfactionRate, 40) && below(childSatisfactionRate, 70) && totalWishesRecords > 0) {
    insights.push({
      text: `Child satisfaction at ${childSatisfactionRate}% — while some children are content with outcomes, a notable proportion are not. Understanding what drives dissatisfaction and adapting the home's response would improve children's experience of sibling contact.`,
      severity: "warning",
    });
  }

  if (meets(cancellationRate, 15) && below(cancellationRate, 30) && totalContactRecords > 0) {
    insights.push({
      text: `Contact cancellation rate at ${cancellationRate}% — some contacts are being cancelled, causing disappointment for children. Implementing contingency plans and backup arrangements would reduce the impact of unavoidable cancellations.`,
      severity: "warning",
    });
  }

  if (meets(contactConcernRate, 15) && below(contactConcernRate, 30) && nonCancelled.length > 0) {
    insights.push({
      text: `Concerns raised in ${contactConcernRate}% of contacts — while not at critical levels, concerns during sibling contact require monitoring and action to ensure contact remains safe and positive for all children involved.`,
      severity: "warning",
    });
  }

  if (meets(frequentConflictRate, 15) && below(frequentConflictRate, 25) && totalAssessmentRecords > 0) {
    insights.push({
      text: `${frequentConflictRate}% of sibling relationships experiencing frequent conflict — emerging conflict patterns need to be addressed proactively before relationships deteriorate further.`,
      severity: "warning",
    });
  }

  if (meets(eventParticipationRate, 50) && below(eventParticipationRate, 70) && totalChildrenInvited > 0) {
    insights.push({
      text: `Sibling event participation at ${eventParticipationRate}% — while many children attend, some are not participating. Exploring barriers and involving children in event planning could improve engagement.`,
      severity: "warning",
    });
  }

  if (meets(therapeuticFollowThroughRate, 50) && below(therapeuticFollowThroughRate, 80) && therapeuticRecommended > 0) {
    insights.push({
      text: `Therapeutic follow-through at ${therapeuticFollowThroughRate}% — some recommended support for sibling relationships has not yet been secured. Prompt action is needed to prevent relationship deterioration.`,
      severity: "warning",
    });
  }

  if (meets(contactPlanRate, 50) && below(contactPlanRate, 70) && nonCancelled.length > 0) {
    insights.push({
      text: `Contact plan adherence at ${contactPlanRate}% — some contacts deviate from agreed arrangements. Consistent adherence to contact plans provides stability and predictability that children need.`,
      severity: "warning",
    });
  }

  if (meets(socialWorkerInformedRate, 50) && below(socialWorkerInformedRate, 75) && totalWishesRecords > 0) {
    insights.push({
      text: `Social worker informed of children's wishes in ${socialWorkerInformedRate}% of cases — sharing children's views with the placing authority strengthens multi-agency working and ensures sibling contact is considered in care planning.`,
      severity: "warning",
    });
  }

  // Wish category analysis
  const moreContactWishes = wishCategories["more_contact"] ?? 0;
  const lessContactWishes = wishCategories["less_contact"] ?? 0;
  if (moreContactWishes > 0 && totalWishesRecords > 0) {
    const moreContactPct = rate(moreContactWishes, totalWishesRecords);
    if (meets(moreContactPct, 40)) {
      insights.push({
        text: `${moreContactPct}% of children's wishes are for more sibling contact — this suggests current contact frequency may be insufficient. Children are clearly expressing a desire for more time with their siblings, and the home should respond by exploring ways to increase contact opportunities.`,
        severity: "warning",
      });
    }
  }

  if (lessContactWishes > 0 && totalWishesRecords > 0) {
    const lessContactPct = rate(lessContactWishes, totalWishesRecords);
    if (meets(lessContactPct, 20)) {
      insights.push({
        text: `${lessContactPct}% of children's wishes are for less sibling contact — some children may be finding contact stressful or unwanted. The home must respect these views and ensure contact arrangements are genuinely in each child's best interests, not imposed without regard to the child's feelings.`,
        severity: "warning",
      });
    }
  }

  // -- Positive insights --

  if (sibling_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding sibling contact and relationship practice — placement decisions are well-considered, contact is actively facilitated, relationship quality is high, events bring siblings together effectively, and children's wishes are heard and acted upon. This comprehensive approach supports children's emotional wellbeing, identity, and sense of belonging.",
      severity: "positive",
    });
  }

  if (meets(placementConsiderationRate, 95) && meets(documentationRate, 90) && totalPlacementRecords > 0) {
    insights.push({
      text: `${placementConsiderationRate}% placement consideration with ${documentationRate}% documentation — the home demonstrates exemplary practice in evidencing sibling placement decision-making, ensuring every sibling group receives proper consideration and that decisions are transparent and defensible.`,
      severity: "positive",
    });
  }

  if (meets(contactFacilitationRate, 90) && meets(contactPlanRate, 90) && nonCancelled.length > 0) {
    insights.push({
      text: `${contactFacilitationRate}% contact facilitation with ${contactPlanRate}% plan adherence — the home consistently facilitates and delivers sibling contact in line with agreed arrangements, providing children with reliable and predictable opportunities to maintain family relationships.`,
      severity: "positive",
    });
  }

  if (meets(relationshipQualityRate, 80) && meets(positiveInteractionRate, 80) && totalAssessmentRecords > 0) {
    insights.push({
      text: `${relationshipQualityRate}% relationship quality with ${positiveInteractionRate}% positive interactions observed — sibling relationships are thriving under the home's care, with warm and positive interactions characterising the majority of assessed sibling pairs.`,
      severity: "positive",
    });
  }

  if ((childWishesRate ?? 0) >= 90 && meets(childSatisfactionRate, 90) && totalWishesRecords > 0) {
    insights.push({
      text: `${childWishesRate}% wishes response rate with ${childSatisfactionRate}% child satisfaction — children's voices are genuinely central to sibling contact decisions. The home demonstrates that listening to children leads to better outcomes and higher satisfaction.`,
      severity: "positive",
    });
  }

  if (meets(childEnjoyedRate, 90) && meets(siblingEnjoyedRate, 90) && nonCancelled.length > 0) {
    insights.push({
      text: `${childEnjoyedRate}% of children and ${siblingEnjoyedRate}% of siblings enjoyed contact sessions — the overwhelmingly positive experience of contact demonstrates that arrangements are well-designed, properly facilitated, and genuinely beneficial for all children involved.`,
      severity: "positive",
    });
  }

  if (eventTypeDiversity >= 4 && (avgEventQuality ?? 0) >= 4.0 && totalEventRecords > 0) {
    insights.push({
      text: `${eventTypeDiversity} different event types with an average quality of ${avgEventQuality}/5 — the home creates diverse, high-quality opportunities for siblings to share meaningful experiences together, strengthening bonds through birthdays, celebrations, activities, and milestones.`,
      severity: "positive",
    });
  }

  if (cancellationRate === 0 && totalContactRecords >= 5) {
    insights.push({
      text: "Zero cancellations across all recorded contacts — the home demonstrates exceptional reliability in maintaining sibling contact, giving children confidence that they can depend on seeing their siblings as planned.",
      severity: "positive",
    });
  }

  if (meets(voiceCapturedRate, 95) && meets(ageAppropriateRate, 90) && totalWishesRecords > 0) {
    insights.push({
      text: `${voiceCapturedRate}% voice capture with ${ageAppropriateRate}% using age-appropriate methods — the home excels at hearing children's authentic views using methods tailored to each child's developmental stage and communication needs.`,
      severity: "positive",
    });
  }

  if (meets(memoryBookRate, 80) && meets(photosRate, 80) && totalEventRecords > 0) {
    insights.push({
      text: `Memory books updated for ${memoryBookRate}% and photos taken at ${photosRate}% of sibling events — the home actively preserves memories of sibling time together, supporting children's identity narrative and providing tangible evidence of valued family connections.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (sibling_rating === "outstanding") {
    headline =
      "Outstanding sibling contact and relationships — placement decisions are well-evidenced, contact is actively facilitated, relationship quality is strong, and children's wishes are heard and acted upon.";
  } else if (sibling_rating === "good") {
    headline = `Good sibling contact and relationships — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (sibling_rating === "adequate") {
    headline = `Adequate sibling contact and relationships — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure sibling relationships are effectively maintained and promoted.`;
  } else {
    headline = `Sibling contact and relationships are inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to improve sibling placement practice, contact facilitation, and relationship support.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    sibling_rating,
    sibling_score: score,
    headline,
    total_placement_records: totalPlacementRecords,
    total_contact_records: totalContactRecords,
    total_assessment_records: totalAssessmentRecords,
    total_event_records: totalEventRecords,
    total_wishes_records: totalWishesRecords,
    placement_consideration_rate: placementConsiderationRate,
    contact_facilitation_rate: contactFacilitationRate,
    relationship_quality_rate: relationshipQualityRate,
    event_participation_rate: eventParticipationRate,
    child_wishes_rate: childWishesRate,
    child_satisfaction_rate: childSatisfactionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
