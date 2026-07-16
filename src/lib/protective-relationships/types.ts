// ─────────────────────────────────────────────────────────────────────────────
// Protective Relationships Map — data model
//
// Not just a list of names: a map of the people in a child's life, each rated as
// protective, neutral or a risk, with the child's / staff's / manager's view,
// known concerns and strengths, contact arrangements and any restrictions. Used
// to understand the child's network and keep them safe.
//
// Standalone module (no store import) so store + engine share types without a
// circular dependency.
// ─────────────────────────────────────────────────────────────────────────────

export type RelationshipRating = "protective" | "neutral" | "risk";

export type RelationshipCategory =
  | "safe_adult"
  | "unsafe_adult"
  | "trusted_professional"
  | "positive_peer"
  | "risk_peer"
  | "family_support"
  | "goto_when_upset"
  | "linked_to_missing"
  | "exploitation_risk"
  | "other";

export type RelationshipStatus = "active" | "archived";

// ── Social convoy (§ practice model: Kahn & Antonucci) ───────────────────────
// The convoy model structures a child's network as three circles of emotional
// closeness. These fields are OPTIONAL extensions to RelationshipEntry — every
// existing record remains valid — and where they are absent the convoy engine
// derives a circle deterministically and says so.

/** Inner: deeply trusted, emotionally significant. Middle: important support
 *  with less closeness. Outer: professionals, services, community. */
export type ConvoyCircle = "inner" | "middle" | "outer";

export type EmotionalCloseness = "high" | "medium" | "low";

export type ContactFrequency = "daily" | "weekly" | "monthly" | "rare" | "none";

export const CONVOY_CIRCLE_META: Record<ConvoyCircle, { label: string; description: string }> = {
  inner: { label: "Inner circle", description: "Deeply trusted and emotionally significant" },
  middle: { label: "Middle circle", description: "Important support with less emotional closeness" },
  outer: { label: "Outer circle", description: "Professionals, services and community connections" },
};

export interface RelationshipEntry {
  id: string;
  child_id: string;
  home_id: string;

  name: string; // name or identifier
  relationship_to_child: string; // e.g. "mother", "school friend", "social worker"
  category: RelationshipCategory;
  rating: RelationshipRating;

  child_view: string;
  staff_view: string;
  manager_view: string;

  known_concerns: string;
  known_strengths: string;

  contact_arrangements: string;
  restrictions: string; // any restrictions on contact
  linked_record_ids: string[];

  review_date: string | null;
  status: RelationshipStatus;

  // ── Social convoy fields (all optional — see ConvoyCircle above) ──────────
  /** Recorded circle. When absent the engine derives one and labels it so. */
  circle?: ConvoyCircle | null;
  emotional_closeness?: EmotionalCloseness | null;
  contact_frequency?: ContactFrequency | null;
  /** ISO date of the last contact that MEANT something, not the last log row. */
  last_meaningful_contact?: string | null;
  /** The relationship the child wants this to become, in their words where possible. */
  desired_future?: string;
  /** What we genuinely don't know — uncertainty is data, not a blank. */
  uncertainty?: string;

  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export const CATEGORY_META: Record<RelationshipCategory, { label: string }> = {
  safe_adult: { label: "Safe adult" },
  unsafe_adult: { label: "Unsafe adult" },
  trusted_professional: { label: "Trusted professional" },
  positive_peer: { label: "Positive peer" },
  risk_peer: { label: "Risk peer" },
  family_support: { label: "Family support" },
  goto_when_upset: { label: "Goes to when upset" },
  linked_to_missing: { label: "Linked to missing episodes" },
  exploitation_risk: { label: "Exploitation risk" },
  other: { label: "Other" },
};

export const RATING_META: Record<RelationshipRating, { label: string }> = {
  protective: { label: "Protective" },
  neutral: { label: "Neutral" },
  risk: { label: "Risk" },
};
