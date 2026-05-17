// ══════════════════════════════════════════════════════════════════════════════
// ARIA Intelligence Engine — Contact & Relationships
//
// Pure deterministic analysis of family/significant person contact for LAC.
// Tracks:
//   - Contact frequency vs care plan expectations
//   - Contact quality (child's experience)
//   - Missed/cancelled contacts and patterns
//   - Relationship health across network
//   - Advocacy and child's voice in contact decisions
//   - Supervised vs unsupervised progression
//
// Regulatory alignment:
//   - CHR 2015 Reg 9 — Promotion of contact
//   - Children Act 1989 s34 — Contact with children in care
//   - SCCIF — Relationships and belonging
//   - IRO Handbook — Contact arrangements
//
// No AI calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type ContactType = "face_to_face" | "video_call" | "phone_call" | "letter" | "text_message" | "supervised" | "unsupervised";

export type ContactPerson =
  | "mother"
  | "father"
  | "sibling"
  | "grandparent"
  | "other_family"
  | "friend"
  | "previous_carer"
  | "mentor"
  | "other";

export type ContactOutcome = "positive" | "neutral" | "negative" | "distressing" | "not_recorded";

export interface ContactSession {
  id: string;
  date: string;
  person: ContactPerson;
  personName: string;
  type: ContactType;
  plannedDuration: number; // minutes
  actualDuration: number; // minutes — 0 if missed
  occurred: boolean;
  cancelledBy?: "child" | "parent" | "social_worker" | "court" | "other";
  cancellationReason?: string;
  outcome: ContactOutcome;
  childWanted: boolean; // did child want this contact?
  childFeedback?: string;
  supervisedRequired: boolean;
  supervisorPresent?: boolean;
}

export interface ContactArrangement {
  person: ContactPerson;
  personName: string;
  agreedFrequency: string; // e.g. "weekly", "fortnightly", "monthly"
  agreedFrequencyPerMonth: number; // numeric: 4=weekly, 2=fortnightly, 1=monthly
  contactType: ContactType;
  supervisedRequired: boolean;
  courtOrdered: boolean;
  childViews: "wants_contact" | "ambivalent" | "does_not_want" | "not_asked";
}

export interface ContactInput {
  childId: string;
  childName: string;
  age: number;
  contactSessions: ContactSession[];
  arrangements: ContactArrangement[];
  contactPlanReviewed: boolean;
  contactPlanLastReviewDate?: string;
  childConsultedOnPlan: boolean;
  advocateAvailableForContact: boolean;
  lifestoryWorkStarted: boolean;
  siblingPlacementConsidered: boolean;
  letterboxContactAvailable: boolean;
}

export interface ContactAssessment {
  childName: string;
  overallScore: number;
  overallRating: "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate";
  frequencyScore: number;
  qualityScore: number;
  consistencyScore: number;
  voiceScore: number;
  totalSessions: number;
  occurredSessions: number;
  missedSessions: number;
  missedRate: number;
  positiveRate: number;
  distressingRate: number;
  contactByPerson: PersonContactSummary[];
  cancellationPatterns: CancellationPattern[];
  concerns: ContactConcern[];
  strengths: ContactStrength[];
  regulatoryFlags: RegulatoryFlag[];
  recommendations: string[];
  summary: string;
}

export interface PersonContactSummary {
  person: ContactPerson;
  personName: string;
  sessionsPlanned: number;
  sessionsOccurred: number;
  complianceRate: number; // vs agreed frequency
  avgOutcome: number; // -1 distressing, 0 negative, 1 neutral, 2 positive
  childWantsContact: boolean;
}

export interface CancellationPattern {
  pattern: string;
  count: number;
  description: string;
}

export interface ContactConcern {
  severity: "critical" | "significant" | "moderate" | "low";
  category: string;
  description: string;
}

export interface ContactStrength {
  category: string;
  description: string;
}

export interface RegulatoryFlag {
  regulation: string;
  area: string;
  status: "met" | "partially_met" | "not_met";
  detail: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const OUTCOME_VALUES: Record<ContactOutcome, number> = {
  positive: 2,
  neutral: 1,
  negative: 0,
  distressing: -1,
  not_recorded: 1,
};

// ── Main Engine ─────────────────────────────────────────────────────────────

export function analyseContact(input: ContactInput): ContactAssessment {
  const { childName, contactSessions, arrangements } = input;

  // ── Basic counts ────────────────────────────────────────────────────
  const totalSessions = contactSessions.length;
  const occurredSessions = contactSessions.filter(s => s.occurred).length;
  const missedSessions = totalSessions - occurredSessions;
  const missedRate = totalSessions > 0 ? Math.round((missedSessions / totalSessions) * 100) / 100 : 0;

  // ── Quality metrics ─────────────────────────────────────────────────
  const occurredWithOutcome = contactSessions.filter(s => s.occurred && s.outcome !== "not_recorded");
  const positiveCount = occurredWithOutcome.filter(s => s.outcome === "positive").length;
  const distressingCount = occurredWithOutcome.filter(s => s.outcome === "distressing").length;
  const positiveRate = occurredWithOutcome.length > 0
    ? Math.round((positiveCount / occurredWithOutcome.length) * 100) / 100
    : 1;
  const distressingRate = occurredWithOutcome.length > 0
    ? Math.round((distressingCount / occurredWithOutcome.length) * 100) / 100
    : 0;

  // ── Per-person analysis ─────────────────────────────────────────────
  const contactByPerson = analyseByPerson(contactSessions, arrangements);

  // ── Cancellation patterns ───────────────────────────────────────────
  const cancellationPatterns = analyseCancellations(contactSessions);

  // ── Scores ────────────────────────────────────────────────────────
  const frequencyScore = scoreFrequency(contactByPerson, arrangements);
  const qualityScore = scoreQuality(contactSessions);
  const consistencyScore = scoreConsistency(contactSessions, missedRate);
  const voiceScore = scoreVoice(input);

  // ── Overall ───────────────────────────────────────────────────────
  const overallScore = Math.round(
    frequencyScore * 0.30 +
    qualityScore * 0.25 +
    consistencyScore * 0.25 +
    voiceScore * 0.20
  );
  const overallRating = scoreToRating(overallScore);

  // ── Concerns ──────────────────────────────────────────────────────
  const concerns = identifyConcerns(input, contactByPerson, missedRate, distressingRate);

  // ── Strengths ─────────────────────────────────────────────────────
  const strengths = identifyStrengths(input, contactByPerson, positiveRate, missedRate);

  // ── Regulatory flags ──────────────────────────────────────────────
  const regulatoryFlags = assessRegulatory(input, contactByPerson, missedRate);

  // ── Recommendations ───────────────────────────────────────────────
  const recommendations = buildRecommendations(input, contactByPerson, missedRate, distressingRate);

  // ── Summary ───────────────────────────────────────────────────────
  const summary = buildSummary(childName, overallRating, totalSessions, occurredSessions, positiveRate);

  return {
    childName,
    overallScore,
    overallRating,
    frequencyScore,
    qualityScore,
    consistencyScore,
    voiceScore,
    totalSessions,
    occurredSessions,
    missedSessions,
    missedRate,
    positiveRate,
    distressingRate,
    contactByPerson,
    cancellationPatterns,
    concerns,
    strengths,
    regulatoryFlags,
    recommendations,
    summary,
  };
}

// ── Per-Person Analysis ─────────────────────────────────────────────────────

function analyseByPerson(
  sessions: ContactSession[],
  arrangements: ContactArrangement[],
): PersonContactSummary[] {
  const personGroups: Record<string, ContactSession[]> = {};
  sessions.forEach(s => {
    const key = `${s.person}::${s.personName}`;
    if (!personGroups[key]) personGroups[key] = [];
    personGroups[key].push(s);
  });

  return Object.entries(personGroups).map(([key, pSessions]) => {
    const [person, personName] = key.split("::");
    const occurred = pSessions.filter(s => s.occurred);
    const planned = pSessions.length;

    // Find arrangement for this person
    const arrangement = arrangements.find(a => a.personName === personName);
    const agreedPerMonth = arrangement?.agreedFrequencyPerMonth ?? 0;

    // Calculate compliance over the period (assume 3 months of data)
    const expectedTotal = agreedPerMonth * 3;
    const complianceRate = expectedTotal > 0
      ? Math.min(1, Math.round((occurred.length / expectedTotal) * 100) / 100)
      : planned > 0 ? Math.round((occurred.length / planned) * 100) / 100 : 1;

    // Average outcome
    const outcomes = occurred
      .filter(s => s.outcome !== "not_recorded")
      .map(s => OUTCOME_VALUES[s.outcome]);
    const avgOutcome = outcomes.length > 0
      ? Math.round((outcomes.reduce((a, b) => a + b, 0) / outcomes.length) * 10) / 10
      : 1;

    // Did child want this contact?
    const childWantsContact = pSessions.some(s => s.childWanted);

    return {
      person: person as ContactPerson,
      personName,
      sessionsPlanned: planned,
      sessionsOccurred: occurred.length,
      complianceRate,
      avgOutcome,
      childWantsContact,
    };
  });
}

// ── Cancellation Patterns ───────────────────────────────────────────────────

function analyseCancellations(sessions: ContactSession[]): CancellationPattern[] {
  const missed = sessions.filter(s => !s.occurred && s.cancelledBy);
  if (missed.length === 0) return [];

  const patterns: CancellationPattern[] = [];

  // By person cancelling
  const byWho: Record<string, number> = {};
  missed.forEach(s => {
    const who = s.cancelledBy ?? "unknown";
    byWho[who] = (byWho[who] ?? 0) + 1;
  });

  Object.entries(byWho)
    .sort((a, b) => b[1] - a[1])
    .forEach(([who, count]) => {
      if (count >= 2) {
        patterns.push({
          pattern: `cancelled_by_${who}`,
          count,
          description: `${count} sessions cancelled by ${who.replace(/_/g, " ")}`,
        });
      }
    });

  // Repeat cancellations for specific person
  const byPerson: Record<string, number> = {};
  missed.forEach(s => {
    byPerson[s.personName] = (byPerson[s.personName] ?? 0) + 1;
  });

  Object.entries(byPerson)
    .filter(([_, count]) => count >= 3)
    .forEach(([name, count]) => {
      patterns.push({
        pattern: "repeat_person_cancel",
        count,
        description: `Contact with ${name} cancelled ${count} times`,
      });
    });

  return patterns;
}

// ── Scoring ─────────────────────────────────────────────────────────────────

function scoreFrequency(personSummaries: PersonContactSummary[], arrangements: ContactArrangement[]): number {
  if (arrangements.length === 0 && personSummaries.length === 0) return 50;

  // Average compliance rate across all people with arrangements
  const withArrangements = personSummaries.filter(p =>
    arrangements.some(a => a.personName === p.personName)
  );

  if (withArrangements.length === 0) return 60;

  const avgCompliance = withArrangements.reduce((sum, p) => sum + p.complianceRate, 0) / withArrangements.length;
  return Math.round(avgCompliance * 100);
}

function scoreQuality(sessions: ContactSession[]): number {
  const occurred = sessions.filter(s => s.occurred);
  if (occurred.length === 0) return 100; // no data, assume OK

  const outcomes = occurred.map(s => OUTCOME_VALUES[s.outcome]);
  const avgOutcome = outcomes.reduce((a, b) => a + b, 0) / outcomes.length;

  // Scale: -1 to 2 → 0 to 100
  return Math.max(0, Math.min(100, Math.round(((avgOutcome + 1) / 3) * 100)));
}

function scoreConsistency(sessions: ContactSession[], missedRate: number): number {
  if (sessions.length === 0) return 100;
  // Low missed rate = high consistency
  return Math.max(0, Math.round(100 - missedRate * 150));
}

function scoreVoice(input: ContactInput): number {
  let score = 0;
  const max = 100;

  if (input.childConsultedOnPlan) score += 30;
  if (input.contactPlanReviewed) score += 20;
  if (input.advocateAvailableForContact) score += 15;
  if (input.lifestoryWorkStarted) score += 15;

  // Child's views represented in arrangements
  const childAsked = input.arrangements.filter(a => a.childViews !== "not_asked");
  if (input.arrangements.length > 0 && childAsked.length === input.arrangements.length) {
    score += 20;
  } else if (childAsked.length > 0) {
    score += 10;
  }

  return Math.min(max, score);
}

// ── Concerns ────────────────────────────────────────────────────────────────

function identifyConcerns(
  input: ContactInput,
  personSummaries: PersonContactSummary[],
  missedRate: number,
  distressingRate: number,
): ContactConcern[] {
  const concerns: ContactConcern[] = [];

  // High missed rate
  if (missedRate >= 0.5) {
    concerns.push({
      severity: "critical",
      category: "consistency",
      description: "Over half of planned contacts not occurring — significant disruption to relationships",
    });
  } else if (missedRate >= 0.3) {
    concerns.push({
      severity: "significant",
      category: "consistency",
      description: "High rate of missed contacts affecting relationship stability",
    });
  }

  // Distressing contacts
  if (distressingRate >= 0.3) {
    concerns.push({
      severity: "critical",
      category: "quality",
      description: "Significant proportion of contacts distressing for child — urgent review needed",
    });
  } else if (distressingRate >= 0.15) {
    concerns.push({
      severity: "significant",
      category: "quality",
      description: "Some contacts causing distress — review arrangements",
    });
  }

  // Contact child doesn't want being forced
  const unwantedContacts = input.contactSessions.filter(s => !s.childWanted && s.occurred);
  if (unwantedContacts.length >= 3) {
    concerns.push({
      severity: "significant",
      category: "voice",
      description: "Child repeatedly having contact they don't want — views not being respected",
    });
  }

  // Parent repeatedly cancelling
  const parentCancels = input.contactSessions.filter(s =>
    !s.occurred && s.cancelledBy === "parent"
  );
  if (parentCancels.length >= 4) {
    concerns.push({
      severity: "significant",
      category: "parent_engagement",
      description: "Repeated cancellations by parent — child may feel rejected",
    });
  } else if (parentCancels.length >= 2) {
    concerns.push({
      severity: "moderate",
      category: "parent_engagement",
      description: "Multiple cancellations by parent — monitor impact on child",
    });
  }

  // No contact plan review
  if (!input.contactPlanReviewed) {
    concerns.push({
      severity: "moderate",
      category: "planning",
      description: "Contact plan not reviewed — arrangements may not reflect current needs",
    });
  }

  // Child not consulted
  if (!input.childConsultedOnPlan) {
    concerns.push({
      severity: "significant",
      category: "voice",
      description: "Child not consulted on contact arrangements",
    });
  }

  // Sibling placement not considered
  if (!input.siblingPlacementConsidered) {
    concerns.push({
      severity: "moderate",
      category: "siblings",
      description: "Sibling placement/contact not considered in planning",
    });
  }

  // Very low compliance for specific person child wants contact with
  personSummaries.forEach(p => {
    if (p.childWantsContact && p.complianceRate < 0.4 && p.sessionsPlanned >= 3) {
      concerns.push({
        severity: "significant",
        category: "frequency",
        description: `Contact with ${p.personName} well below agreed frequency — child wants this contact`,
      });
    }
  });

  return concerns;
}

// ── Strengths ───────────────────────────────────────────────────────────────

function identifyStrengths(
  input: ContactInput,
  personSummaries: PersonContactSummary[],
  positiveRate: number,
  missedRate: number,
): ContactStrength[] {
  const strengths: ContactStrength[] = [];

  if (positiveRate >= 0.8 && input.contactSessions.filter(s => s.occurred).length >= 3) {
    strengths.push({
      category: "quality",
      description: "Majority of contacts positive experiences for child",
    });
  }

  if (missedRate <= 0.1 && input.contactSessions.length >= 3) {
    strengths.push({
      category: "consistency",
      description: "Contact arrangements highly consistent — very few missed sessions",
    });
  }

  if (input.childConsultedOnPlan && input.advocateAvailableForContact) {
    strengths.push({
      category: "voice",
      description: "Child's views central to contact planning with advocacy support",
    });
  }

  if (input.lifestoryWorkStarted) {
    strengths.push({
      category: "identity",
      description: "Life story work supporting understanding of relationships and identity",
    });
  }

  // Good compliance across relationships
  const goodCompliance = personSummaries.filter(p => p.complianceRate >= 0.8);
  if (goodCompliance.length >= 2) {
    strengths.push({
      category: "frequency",
      description: "Contact frequency meeting or exceeding agreed arrangements",
    });
  }

  if (input.contactPlanReviewed && input.childConsultedOnPlan) {
    strengths.push({
      category: "planning",
      description: "Contact plan regularly reviewed with child involvement",
    });
  }

  return strengths;
}

// ── Regulatory Flags ────────────────────────────────────────────────────────

function assessRegulatory(
  input: ContactInput,
  personSummaries: PersonContactSummary[],
  missedRate: number,
): RegulatoryFlag[] {
  const flags: RegulatoryFlag[] = [];

  // CHR 2015 Reg 9 — Promotion of contact
  const contactPromoted = missedRate < 0.3 && input.contactPlanReviewed;
  flags.push({
    regulation: "CHR 2015 Reg 9",
    area: "Contact Promotion",
    status: contactPromoted ? "met" : missedRate < 0.5 ? "partially_met" : "not_met",
    detail: contactPromoted
      ? "Contact actively promoted and reviewed"
      : "Contact arrangements not being consistently maintained",
  });

  // Children Act 1989 s34 — Contact rights
  const arrangements = input.arrangements;
  const courtOrdered = arrangements.filter(a => a.courtOrdered);
  const courtCompliance = courtOrdered.length > 0
    ? personSummaries
      .filter(p => courtOrdered.some(a => a.personName === p.personName))
      .every(p => p.complianceRate >= 0.7)
    : true;
  if (courtOrdered.length > 0) {
    flags.push({
      regulation: "Children Act 1989 s34",
      area: "Court-Ordered Contact",
      status: courtCompliance ? "met" : "not_met",
      detail: courtCompliance
        ? "Court-ordered contact arrangements being maintained"
        : "Court-ordered contact not being delivered as required",
    });
  }

  // SCCIF — Relationships and belonging
  const hasRelationships = personSummaries.length > 0 && personSummaries.some(p => p.sessionsOccurred > 0);
  const childVoiced = input.childConsultedOnPlan;
  flags.push({
    regulation: "SCCIF",
    area: "Relationships",
    status: (hasRelationships && childVoiced) ? "met" : hasRelationships ? "partially_met" : "not_met",
    detail: (hasRelationships && childVoiced)
      ? "Child maintaining relationships with child's views informing arrangements"
      : "Improvements needed in supporting relationships",
  });

  // IRO Handbook — Contact reviewed
  flags.push({
    regulation: "IRO Handbook",
    area: "Contact Review",
    status: input.contactPlanReviewed ? "met" : "not_met",
    detail: input.contactPlanReviewed
      ? "Contact arrangements reviewed"
      : "Contact plan not reviewed at LAC review",
  });

  return flags;
}

// ── Recommendations ─────────────────────────────────────────────────────────

function buildRecommendations(
  input: ContactInput,
  personSummaries: PersonContactSummary[],
  missedRate: number,
  distressingRate: number,
): string[] {
  const recs: string[] = [];

  if (missedRate >= 0.3) {
    recs.push("Review contact arrangements — high missed rate suggests barriers to attendance");
  }

  if (distressingRate >= 0.15) {
    recs.push("URGENT: Review contact causing distress — consider support, supervision, or format changes");
  }

  if (!input.childConsultedOnPlan) {
    recs.push("Consult child on contact arrangements — ensure views inform planning");
  }

  if (!input.contactPlanReviewed) {
    recs.push("Review contact plan at next LAC review");
  }

  if (!input.lifestoryWorkStarted) {
    recs.push("Consider life story work to support understanding of relationships");
  }

  if (!input.siblingPlacementConsidered) {
    recs.push("Review sibling contact/placement arrangements");
  }

  // Specific people with low compliance
  personSummaries
    .filter(p => p.complianceRate < 0.5 && p.childWantsContact && p.sessionsPlanned >= 3)
    .forEach(p => {
      recs.push(`Address barriers to contact with ${p.personName} — child wants more contact`);
    });

  // Parent cancelling repeatedly
  const parentCancels = input.contactSessions.filter(s =>
    !s.occurred && s.cancelledBy === "parent"
  ).length;
  if (parentCancels >= 3) {
    recs.push("Engage with parent about cancellations — explore barriers and child's feelings about this");
  }

  if (!input.advocateAvailableForContact) {
    recs.push("Ensure child has access to advocacy for contact decisions");
  }

  return recs;
}

// ── Summary ─────────────────────────────────────────────────────────────────

function buildSummary(
  childName: string,
  rating: string,
  total: number,
  occurred: number,
  positiveRate: number,
): string {
  if (total === 0) {
    return `${childName}: No contact sessions recorded. Contact arrangements should be reviewed.`;
  }
  const pct = Math.round(positiveRate * 100);
  return `${childName}: Contact rated ${rating.replace(/_/g, " ")}. ${occurred}/${total} sessions occurred, ${pct}% positive.`;
}

// ── Utility ─────────────────────────────────────────────────────────────────

function scoreToRating(score: number): "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "adequate";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}
