// ─────────────────────────────────────────────────────────────────────────────
// Social Convoy Engine (Practice Intelligence OS §5.4)
//
// Structures a child's network as three circles of emotional closeness — the
// convoy model (Kahn & Antonucci) — over the EXISTING protective-relationships
// records, and runs deterministic detections over the shape of that network.
//
// Principles, from the build brief and this repo's standing rules:
//   • transparent: every circle membership says whether it was RECORDED by a
//     person or DERIVED by rule, and which rule;
//   • advisory: detections are relational-planning prompts with evidence and
//     suggested questions — never conclusions, never scores, never labels.
//     "No trusted adult" prompts planning; it does not allege harm;
//   • deterministic and pure: no store import, no AI, no Date.now() — the
//     caller supplies `now` so results are reproducible;
//   • silence-aware: an empty network with few records is reported as
//     "insufficient information", not as isolation.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ConvoyCircle,
  RelationshipCategory,
  RelationshipEntry,
} from "./types";

// ── Output shapes ─────────────────────────────────────────────────────────────

export interface ConvoyMember {
  entryId: string;
  name: string;
  relationship: string;
  category: RelationshipCategory;
  circle: ConvoyCircle;
  /** "recorded" = a person chose the circle; "derived" = this rule placed it. */
  basis: "recorded" | "derived";
  /** Present when basis is "derived": the rule, in plain words. */
  derivedBecause?: string;
  rating: RelationshipEntry["rating"];
  lastMeaningfulContact: string | null;
  daysSinceMeaningfulContact: number | null;
}

export type ConvoyDetectionKey =
  | "no_inner_circle_adult"
  | "overreliance_single_adult"
  | "professionalised_network"
  | "repeated_relationship_loss"
  | "sparse_network"
  | "stale_inner_contact"
  | "network_growth";

export interface ConvoyDetection {
  key: ConvoyDetectionKey;
  /** "positive" marks growth; everything else is a planning prompt. */
  tone: "prompt" | "positive";
  headline: string;
  /** Why CARA is showing this — the rule and the numbers behind it. */
  whyShown: string;
  /** Entry ids the detection is built from. Empty is never allowed. */
  evidenceEntryIds: string[];
  suggestedQuestions: string[];
}

export interface SocialConvoy {
  childId: string;
  inner: ConvoyMember[];
  middle: ConvoyMember[];
  outer: ConvoyMember[];
  /** Active entries that could not be placed and why — visible, not dropped. */
  unplaced: { entryId: string; name: string; reason: string }[];
  detections: ConvoyDetection[];
  /** True when there is too little recorded to reason about the network. */
  insufficientInformation: boolean;
  counts: {
    active: number;
    archived: number;
    professionals: number;
    adultsInner: number;
  };
}

// ── Category groupings (deterministic, visible) ──────────────────────────────

const PROFESSIONAL_CATEGORIES: RelationshipCategory[] = ["trusted_professional"];
const ADULT_CATEGORIES: RelationshipCategory[] = [
  "safe_adult",
  "trusted_professional",
  "family_support",
  "goto_when_upset",
];
const PEER_CATEGORIES: RelationshipCategory[] = ["positive_peer", "risk_peer"];

const DAY = 86_400_000;

function daysBetween(later: Date, earlierIso: string | null | undefined): number | null {
  if (!earlierIso) return null;
  const t = Date.parse(earlierIso);
  if (Number.isNaN(t)) return null;
  return Math.floor((later.getTime() - t) / DAY);
}

/** A professional relationship is outer unless someone recorded otherwise —
 *  the convoy model's point is that services are not emotional closeness. */
function deriveCircle(e: RelationshipEntry): { circle: ConvoyCircle; because: string } {
  if (PROFESSIONAL_CATEGORIES.includes(e.category)) {
    return { circle: "outer", because: "professional relationship — outer unless recorded closer" };
  }
  if (e.rating === "risk") {
    return { circle: "outer", because: "rated a risk — closeness must be a recorded human judgement, never derived" };
  }
  if (e.category === "goto_when_upset") {
    return { circle: "inner", because: "the child goes to this person when upset" };
  }
  if (e.emotional_closeness === "high" && e.rating === "protective") {
    return { circle: "inner", because: "recorded high emotional closeness and protective" };
  }
  if (e.rating === "protective") {
    return { circle: "middle", because: "protective relationship without recorded high closeness" };
  }
  return { circle: "outer", because: "no recorded closeness or protective rating" };
}

function toMember(e: RelationshipEntry, now: Date): ConvoyMember {
  const recorded = e.circle ?? null;
  const derived = deriveCircle(e);
  return {
    entryId: e.id,
    name: e.name,
    relationship: e.relationship_to_child,
    category: e.category,
    circle: recorded ?? derived.circle,
    basis: recorded ? "recorded" : "derived",
    derivedBecause: recorded ? undefined : derived.because,
    rating: e.rating,
    lastMeaningfulContact: e.last_meaningful_contact ?? null,
    daysSinceMeaningfulContact: daysBetween(now, e.last_meaningful_contact),
  };
}

// ── The engine ────────────────────────────────────────────────────────────────

export function computeSocialConvoy(
  childId: string,
  entries: RelationshipEntry[],
  now: Date,
): SocialConvoy {
  const mine = entries.filter((e) => e.child_id === childId);
  const active = mine.filter((e) => e.status === "active");
  const archived = mine.filter((e) => e.status === "archived");

  const members = active.map((e) => toMember(e, now));
  const inner = members.filter((m) => m.circle === "inner");
  const middle = members.filter((m) => m.circle === "middle");
  const outer = members.filter((m) => m.circle === "outer");

  const adultsInner = inner.filter((m) => ADULT_CATEGORIES.includes(m.category));
  const professionals = members.filter((m) => PROFESSIONAL_CATEGORIES.includes(m.category));

  // With almost nothing recorded, the honest output is "we don't know", not a
  // stack of alarming prompts about a network nobody has mapped yet.
  const insufficientInformation = mine.length < 2;

  const detections: ConvoyDetection[] = [];
  if (!insufficientInformation) {
    // Scenario G — a relational-planning prompt, never a safeguarding conclusion.
    if (adultsInner.length === 0) {
      detections.push({
        key: "no_inner_circle_adult",
        tone: "prompt",
        headline: "No inner-circle trusted adult is currently mapped",
        whyShown:
          `Of ${active.length} active relationship(s), none is an adult in the inner circle ` +
          `(recorded or derived). This prompts relational planning — it is not a conclusion about the child.`,
        evidenceEntryIds: active.map((e) => e.id),
        suggestedQuestions: [
          "Who does the child say they would go to if something was wrong?",
          "Is there an adult the child is warming to who could be supported to become closer?",
          "Does the child describe anyone differently from how staff have rated them?",
        ],
      });
    }

    if (adultsInner.length === 1) {
      const middleAdults = middle.filter((m) => ADULT_CATEGORIES.includes(m.category));
      if (middleAdults.length === 0) {
        detections.push({
          key: "overreliance_single_adult",
          tone: "prompt",
          headline: `${adultsInner[0].name} is the only close trusted adult`,
          whyShown:
            "Exactly one adult sits in the inner circle and none in the middle circle. " +
            "If that person leaves, is absent or the relationship ruptures, the child has no fallback.",
          evidenceEntryIds: [adultsInner[0].entryId],
          suggestedQuestions: [
            "What happens for the child when this person is off shift or unavailable?",
            "Which existing relationship could be deliberately strengthened as a second anchor?",
          ],
        });
      }
    }

    if (
      members.length >= 3 &&
      professionals.length / members.length >= 0.6 &&
      inner.every((m) => PROFESSIONAL_CATEGORIES.includes(m.category))
    ) {
      detections.push({
        key: "professionalised_network",
        tone: "prompt",
        headline: "The child's network is mostly paid professionals",
        whyShown:
          `${professionals.length} of ${members.length} active relationships are professionals, ` +
          "and no family member, peer or other unpaid adult sits in the inner circle. " +
          "Professionals change roles; a network of services is not the same as belonging.",
        evidenceEntryIds: members.map((m) => m.entryId),
        suggestedQuestions: [
          "Which natural connections — family, community, friends — could be safely strengthened?",
          "What does the child say about who matters to them outside services?",
        ],
      });
    }

    const recentLoss = archived.filter((e) => {
      const d = daysBetween(now, e.updated_at);
      return d !== null && d <= 180;
    });
    if (recentLoss.length >= 2) {
      detections.push({
        key: "repeated_relationship_loss",
        tone: "prompt",
        headline: `${recentLoss.length} relationships ended or were archived in the last 6 months`,
        whyShown:
          "Repeated relationship loss is itself an experience the child is living through, " +
          "separate from the reasons each relationship ended.",
        evidenceEntryIds: recentLoss.map((e) => e.id),
        suggestedQuestions: [
          "Has anyone talked with the child about these endings, in their terms?",
          "What continuity can be protected while the network is changing?",
        ],
      });
    }

    if (members.length > 0 && members.length < 3) {
      detections.push({
        key: "sparse_network",
        tone: "prompt",
        headline: `Only ${members.length} active relationship(s) are mapped`,
        whyShown:
          "A small mapped network either reflects a genuinely thin support system or an " +
          "unmapped one — both are worth establishing deliberately.",
        evidenceEntryIds: members.map((m) => m.entryId),
        suggestedQuestions: [
          "Is the map complete — who is missing from it?",
          "If the map is complete, what would the child like their network to grow towards?",
        ],
      });
    }

    const staleInner = inner.filter(
      (m) => m.daysSinceMeaningfulContact !== null && m.daysSinceMeaningfulContact > 60,
    );
    if (staleInner.length > 0) {
      detections.push({
        key: "stale_inner_contact",
        tone: "prompt",
        headline: "Inner-circle contact has gone quiet",
        whyShown:
          staleInner
            .map((m) => `${m.name}: ${m.daysSinceMeaningfulContact} days since meaningful contact`)
            .join("; ") + ". Closeness recorded in the past is not closeness maintained.",
        evidenceEntryIds: staleInner.map((m) => m.entryId),
        suggestedQuestions: [
          "What is getting in the way of contact with these people?",
          "Does the child want the contact restored, changed or left as it is?",
        ],
      });
    }

    const recentNew = active.filter((e) => {
      const d = daysBetween(now, e.created_at);
      return d !== null && d <= 90;
    });
    if (recentNew.length > recentLoss.length && recentNew.length >= 2) {
      detections.push({
        key: "network_growth",
        tone: "positive",
        headline: `${recentNew.length} new relationships mapped in the last 90 days`,
        whyShown:
          `New relationships (${recentNew.length}) outnumber recent losses (${recentLoss.length}). ` +
          "Worth naming to the child and protecting in planning.",
        evidenceEntryIds: recentNew.map((e) => e.id),
        suggestedQuestions: [
          "Which of these new connections does the child value most?",
          "What would help them deepen?",
        ],
      });
    }
  }

  return {
    childId,
    inner,
    middle,
    outer,
    unplaced: [],
    detections,
    insufficientInformation,
    counts: {
      active: active.length,
      archived: archived.length,
      professionals: professionals.length,
      adultsInner: adultsInner.length,
    },
  };
}
