// ══════════════════════════════════════════════════════════════════════════════
// Cara — FAMILY CONTACT INTELLIGENCE
//
// Pure deterministic engine analysing family time/contact patterns:
//   - Contact frequency vs care plan requirements
//   - Quality trends (positive/mixed/negative)
//   - Child emotional response patterns (pre/post contact)
//   - Cancellation patterns (who cancels, frequency, impact)
//   - Sibling contact compliance
//   - Supervised vs unsupervised progression
//   - Regulatory alignment (Reg 7 — Contact between child and parents, etc.)
//
// Evidence-based on:
//   - CHR 2015 Regulation 7 (Contact)
//   - SCCIF Quality of Care standards
//   - Sen & Broadhurst (2011) — Contact in Out-of-Home Care
//   - Moyers et al. (2006) — Managing Contact Arrangements
//
// Pure function — no side effects, no API calls.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface FamilyContact {
  id: string;
  date: string;
  contactType: "face_to_face" | "phone" | "video" | "letter" | "supervised" | "unsupervised";
  familyMember: string;
  familyMemberRelation: "mother" | "father" | "sibling" | "grandparent" | "other_family";
  planned: boolean;
  occurred: boolean;
  cancelledBy?: "family" | "child" | "home" | "social_worker" | "court_order";
  cancellationReason?: string;
  duration?: number;               // minutes
  quality?: "positive" | "mixed" | "negative";
  childMoodBefore?: number;        // 1-5
  childMoodAfter?: number;         // 1-5
  supervisedBy?: string;
  notes?: string;
  incidentDuring?: boolean;
  incidentAfter?: boolean;
}

export interface ContactPlanRequirement {
  familyMember: string;
  relation: "mother" | "father" | "sibling" | "grandparent" | "other_family";
  requiredFrequency: "weekly" | "fortnightly" | "monthly" | "as_agreed" | "no_contact";
  contactType: "face_to_face" | "phone" | "video" | "letter" | "any";
  supervised: boolean;
  conditions?: string;
}

export interface FamilyContactInput {
  childId: string;
  childName: string;
  contacts: FamilyContact[];       // last 56 days (8 weeks) for trend analysis
  planRequirements: ContactPlanRequirement[];
  placementStartDate: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface FamilyContactAssessment {
  childId: string;
  childName: string;
  assessedAt: string;
  overallScore: number;            // 0-100
  overallRating: "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate";
  complianceScore: number;         // 0-100 (are plan requirements being met?)
  qualityScore: number;            // 0-100 (what's the quality of contacts?)
  emotionalImpactScore: number;    // 0-100 (how does contact affect the child?)
  memberAnalysis: MemberContactAnalysis[];
  patterns: ContactPattern[];
  concerns: ContactConcern[];
  recommendations: string[];
  regulatoryFlags: RegulatoryFlag[];
  summary: string;
}

export interface MemberContactAnalysis {
  familyMember: string;
  relation: string;
  plannedCount: number;
  occurredCount: number;
  cancelledCount: number;
  cancelledByFamily: number;
  cancelledByChild: number;
  cancelledByOther: number;
  compliancePercent: number;
  averageQuality: number;          // 0-1 (positive=1, mixed=0.5, negative=0)
  averageMoodChange: number;       // negative = mood dropped, positive = mood improved
  trend: "improving" | "stable" | "declining" | "insufficient_data";
  contactTypes: string[];
}

export interface ContactPattern {
  type: string;
  description: string;
  significance: "high" | "medium" | "low";
  evidenceCount: number;
}

export interface ContactConcern {
  severity: "critical" | "significant" | "moderate" | "low";
  category: string;
  description: string;
  recommendation: string;
}

export interface RegulatoryFlag {
  regulation: string;
  description: string;
  status: "met" | "partially_met" | "not_met";
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function analyseFamilyContact(input: FamilyContactInput): FamilyContactAssessment {
  const { childId, childName, contacts, planRequirements } = input;
  const assessedAt = new Date().toISOString();

  // ── Member-level analysis ─────────────────────────────────────────────────
  const memberAnalysis = analyseMemberContacts(contacts, planRequirements);

  // ── Compliance scoring ────────────────────────────────────────────────────
  const complianceScore = calculateComplianceScore(memberAnalysis, planRequirements);

  // ── Quality scoring ───────────────────────────────────────────────────────
  const qualityScore = calculateQualityScore(contacts);

  // ── Emotional impact scoring ──────────────────────────────────────────────
  const emotionalImpactScore = calculateEmotionalImpactScore(contacts);

  // ── Pattern detection ─────────────────────────────────────────────────────
  const patterns = detectPatterns(contacts, memberAnalysis);

  // ── Concern identification ────────────────────────────────────────────────
  const concerns = identifyConcerns(contacts, memberAnalysis, planRequirements);

  // ── Regulatory flags ──────────────────────────────────────────────────────
  const regulatoryFlags = assessRegulatoryCompliance(contacts, planRequirements, memberAnalysis);

  // ── Overall score ─────────────────────────────────────────────────────────
  const overallScore = Math.round(
    (complianceScore * 0.35) + (qualityScore * 0.35) + (emotionalImpactScore * 0.30)
  );

  let overallRating: FamilyContactAssessment["overallRating"];
  if (overallScore >= 85) overallRating = "excellent";
  else if (overallScore >= 70) overallRating = "good";
  else if (overallScore >= 55) overallRating = "adequate";
  else if (overallScore >= 40) overallRating = "requires_improvement";
  else overallRating = "inadequate";

  // ── Recommendations ───────────────────────────────────────────────────────
  const recommendations = generateRecommendations(concerns, patterns, memberAnalysis, overallRating);

  // ── Summary ───────────────────────────────────────────────────────────────
  const summary = generateSummary(childName, overallScore, overallRating, memberAnalysis, concerns);

  return {
    childId,
    childName,
    assessedAt,
    overallScore,
    overallRating,
    complianceScore,
    qualityScore,
    emotionalImpactScore,
    memberAnalysis,
    patterns,
    concerns,
    recommendations,
    regulatoryFlags,
    summary,
  };
}

// ── Member Analysis ─────────────────────────────────────────────────────────

function analyseMemberContacts(
  contacts: FamilyContact[],
  requirements: ContactPlanRequirement[],
): MemberContactAnalysis[] {
  // Group contacts by family member
  const grouped = new Map<string, FamilyContact[]>();
  for (const c of contacts) {
    const key = c.familyMember;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(c);
  }

  // Also include required members with no contacts
  for (const req of requirements) {
    if (!grouped.has(req.familyMember)) {
      grouped.set(req.familyMember, []);
    }
  }

  const analyses: MemberContactAnalysis[] = [];

  for (const [member, memberContacts] of grouped) {
    const requirement = requirements.find(r => r.familyMember === member);
    const relation = requirement?.relation ??
      memberContacts[0]?.familyMemberRelation ?? "other_family";

    const planned = memberContacts.filter(c => c.planned);
    const occurred = memberContacts.filter(c => c.occurred);
    const cancelled = memberContacts.filter(c => !c.occurred && c.planned);

    const cancelledByFamily = cancelled.filter(c => c.cancelledBy === "family").length;
    const cancelledByChild = cancelled.filter(c => c.cancelledBy === "child").length;
    const cancelledByOther = cancelled.filter(c =>
      c.cancelledBy && c.cancelledBy !== "family" && c.cancelledBy !== "child"
    ).length;

    // Quality average
    const qualityContacts = occurred.filter(c => c.quality);
    const qualitySum = qualityContacts.reduce((sum, c) => {
      if (c.quality === "positive") return sum + 1;
      if (c.quality === "mixed") return sum + 0.5;
      return sum; // negative = 0
    }, 0);
    const averageQuality = qualityContacts.length > 0 ? qualitySum / qualityContacts.length : 0.5;

    // Mood change
    const moodContacts = occurred.filter(c => c.childMoodBefore != null && c.childMoodAfter != null);
    const moodChangeSum = moodContacts.reduce((sum, c) => sum + (c.childMoodAfter! - c.childMoodBefore!), 0);
    const averageMoodChange = moodContacts.length > 0 ? moodChangeSum / moodContacts.length : 0;

    // Compliance
    const compliancePercent = planned.length > 0
      ? Math.round((occurred.length / planned.length) * 100)
      : (occurred.length > 0 ? 100 : 0);

    // Trend (compare first 4 weeks vs last 4 weeks)
    const sorted = [...occurred].sort((a, b) => a.date.localeCompare(b.date));
    let trend: MemberContactAnalysis["trend"] = "insufficient_data";
    if (sorted.length >= 4) {
      const midIdx = Math.floor(sorted.length / 2);
      const firstHalf = sorted.slice(0, midIdx);
      const secondHalf = sorted.slice(midIdx);

      const firstQuality = firstHalf.reduce((s, c) => s + (c.quality === "positive" ? 1 : c.quality === "mixed" ? 0.5 : 0), 0) / firstHalf.length;
      const secondQuality = secondHalf.reduce((s, c) => s + (c.quality === "positive" ? 1 : c.quality === "mixed" ? 0.5 : 0), 0) / secondHalf.length;

      if (secondQuality > firstQuality + 0.15) trend = "improving";
      else if (secondQuality < firstQuality - 0.15) trend = "declining";
      else trend = "stable";
    }

    const contactTypes = [...new Set(occurred.map(c => c.contactType))];

    analyses.push({
      familyMember: member,
      relation,
      plannedCount: planned.length,
      occurredCount: occurred.length,
      cancelledCount: cancelled.length,
      cancelledByFamily,
      cancelledByChild,
      cancelledByOther,
      compliancePercent,
      averageQuality,
      averageMoodChange,
      trend,
      contactTypes,
    });
  }

  return analyses;
}

// ── Compliance Score ────────────────────────────────────────────────────────

function calculateComplianceScore(
  memberAnalysis: MemberContactAnalysis[],
  requirements: ContactPlanRequirement[],
): number {
  if (requirements.length === 0) return 75; // No explicit plan = neutral

  let totalWeight = 0;
  let weightedCompliance = 0;

  for (const req of requirements) {
    if (req.requiredFrequency === "no_contact") continue;

    const analysis = memberAnalysis.find(m => m.familyMember === req.familyMember);
    const weight = req.relation === "mother" || req.relation === "father" ? 2 :
                   req.relation === "sibling" ? 1.5 : 1;
    totalWeight += weight;

    if (!analysis || analysis.occurredCount === 0) {
      // No contacts at all
      weightedCompliance += 0;
    } else {
      // Expected contacts in 8 weeks
      const expected = getExpectedCount(req.requiredFrequency);
      const actual = analysis.occurredCount;
      const ratio = Math.min(1, actual / expected);
      weightedCompliance += ratio * weight;
    }
  }

  return totalWeight > 0 ? Math.round((weightedCompliance / totalWeight) * 100) : 75;
}

function getExpectedCount(frequency: ContactPlanRequirement["requiredFrequency"]): number {
  switch (frequency) {
    case "weekly": return 8;
    case "fortnightly": return 4;
    case "monthly": return 2;
    case "as_agreed": return 4; // assume roughly fortnightly
    default: return 0;
  }
}

// ── Quality Score ───────────────────────────────────────────────────────────

function calculateQualityScore(contacts: FamilyContact[]): number {
  const occurred = contacts.filter(c => c.occurred);
  if (occurred.length === 0) return 50; // No data = neutral

  let score = 0;
  let maxScore = 0;

  for (const c of occurred) {
    maxScore += 10;

    // Quality rating
    if (c.quality === "positive") score += 10;
    else if (c.quality === "mixed") score += 5;
    else if (c.quality === "negative") score += 1;
    else score += 5; // unknown = neutral

    // Incident penalty
    if (c.incidentDuring) { score -= 3; maxScore += 3; }
    if (c.incidentAfter) { score -= 2; maxScore += 2; }
  }

  return maxScore > 0 ? Math.round(Math.max(0, Math.min(100, (score / maxScore) * 100))) : 50;
}

// ── Emotional Impact Score ──────────────────────────────────────────────────

function calculateEmotionalImpactScore(contacts: FamilyContact[]): number {
  const withMood = contacts.filter(c => c.occurred && c.childMoodBefore != null && c.childMoodAfter != null);
  if (withMood.length === 0) return 50; // No data

  let positiveImpacts = 0;
  let neutralImpacts = 0;
  let negativeImpacts = 0;

  for (const c of withMood) {
    const change = c.childMoodAfter! - c.childMoodBefore!;
    if (change > 0) positiveImpacts++;
    else if (change === 0) neutralImpacts++;
    else negativeImpacts++;
  }

  const total = withMood.length;
  // Score: 100 if all positive, 50 if neutral, 0 if all negative
  const positiveWeight = positiveImpacts / total;
  const neutralWeight = neutralImpacts / total;
  const negativeWeight = negativeImpacts / total;

  return Math.round((positiveWeight * 100) + (neutralWeight * 50) + (negativeWeight * 10));
}

// ── Pattern Detection ───────────────────────────────────────────────────────

function detectPatterns(
  contacts: FamilyContact[],
  memberAnalysis: MemberContactAnalysis[],
): ContactPattern[] {
  const patterns: ContactPattern[] = [];
  const occurred = contacts.filter(c => c.occurred);
  const cancelled = contacts.filter(c => !c.occurred && c.planned);

  // Pattern: Repeated family cancellations
  const familyCancellations = cancelled.filter(c => c.cancelledBy === "family");
  if (familyCancellations.length >= 3) {
    patterns.push({
      type: "family_cancellation_pattern",
      description: `Family members cancelled ${familyCancellations.length} planned contacts in 8 weeks`,
      significance: familyCancellations.length >= 5 ? "high" : "medium",
      evidenceCount: familyCancellations.length,
    });
  }

  // Pattern: Child refusing contact
  const childRefusals = cancelled.filter(c => c.cancelledBy === "child");
  if (childRefusals.length >= 2) {
    patterns.push({
      type: "child_refusal_pattern",
      description: `Child refused ${childRefusals.length} contacts — may indicate distress or relationship breakdown`,
      significance: childRefusals.length >= 3 ? "high" : "medium",
      evidenceCount: childRefusals.length,
    });
  }

  // Pattern: Post-contact distress
  const postContactDistress = occurred.filter(c =>
    c.childMoodAfter != null && c.childMoodBefore != null && (c.childMoodAfter - c.childMoodBefore) <= -2
  );
  if (postContactDistress.length >= 2) {
    patterns.push({
      type: "post_contact_distress",
      description: `Child's mood dropped significantly after ${postContactDistress.length} contacts`,
      significance: "high",
      evidenceCount: postContactDistress.length,
    });
  }

  // Pattern: Incidents triggered by contact
  const incidentAfterContact = occurred.filter(c => c.incidentAfter);
  if (incidentAfterContact.length >= 2) {
    patterns.push({
      type: "contact_triggered_incidents",
      description: `${incidentAfterContact.length} incidents occurred shortly after family contact`,
      significance: "high",
      evidenceCount: incidentAfterContact.length,
    });
  }

  // Pattern: Quality declining
  for (const member of memberAnalysis) {
    if (member.trend === "declining") {
      patterns.push({
        type: "quality_declining",
        description: `Contact quality with ${member.familyMember} is declining over time`,
        significance: "medium",
        evidenceCount: member.occurredCount,
      });
    }
  }

  // Pattern: Consistent positive contacts
  const consistentlyPositive = memberAnalysis.filter(m => m.averageQuality >= 0.8 && m.occurredCount >= 3);
  if (consistentlyPositive.length > 0) {
    patterns.push({
      type: "consistent_positive",
      description: `${consistentlyPositive.length} family member(s) maintaining consistently positive contact`,
      significance: "medium",
      evidenceCount: consistentlyPositive.reduce((s, m) => s + m.occurredCount, 0),
    });
  }

  // Pattern: No sibling contact
  const siblingReqs = contacts.filter(c => c.familyMemberRelation === "sibling" && c.occurred);
  const hasSiblingReq = memberAnalysis.some(m => m.relation === "sibling");
  if (hasSiblingReq && siblingReqs.length === 0) {
    patterns.push({
      type: "no_sibling_contact",
      description: "No sibling contact has occurred despite being planned",
      significance: "high",
      evidenceCount: 0,
    });
  }

  return patterns;
}

// ── Concern Identification ──────────────────────────────────────────────────

function identifyConcerns(
  contacts: FamilyContact[],
  memberAnalysis: MemberContactAnalysis[],
  requirements: ContactPlanRequirement[],
): ContactConcern[] {
  const concerns: ContactConcern[] = [];

  // No contact at all when required
  for (const req of requirements) {
    if (req.requiredFrequency === "no_contact") continue;
    const analysis = memberAnalysis.find(m => m.familyMember === req.familyMember);
    if (!analysis || analysis.occurredCount === 0) {
      concerns.push({
        severity: "significant",
        category: "compliance",
        description: `No contact with ${req.familyMember} (${req.relation}) has occurred despite care plan requirement of ${req.requiredFrequency} contact`,
        recommendation: `Urgent review needed — establish why ${req.requiredFrequency} contact with ${req.familyMember} is not happening and update plan accordingly`,
      });
    }
  }

  // High cancellation rate by family
  for (const member of memberAnalysis) {
    if (member.cancelledByFamily >= 3) {
      concerns.push({
        severity: "moderate",
        category: "engagement",
        description: `${member.familyMember} has cancelled ${member.cancelledByFamily} planned contacts — may indicate disengagement`,
        recommendation: `Support ${member.familyMember} to maintain contact — explore barriers and offer flexibility in arrangements`,
      });
    }
  }

  // Repeated child refusal
  for (const member of memberAnalysis) {
    if (member.cancelledByChild >= 2) {
      concerns.push({
        severity: "significant",
        category: "child_voice",
        description: `Child has refused ${member.cancelledByChild} contacts with ${member.familyMember} — their voice must be heard and explored`,
        recommendation: `Key work session to explore child's feelings about contact with ${member.familyMember}. Do not force contact against child's wishes.`,
      });
    }
  }

  // Consistently negative quality
  for (const member of memberAnalysis) {
    if (member.averageQuality < 0.3 && member.occurredCount >= 2) {
      concerns.push({
        severity: "significant",
        category: "quality",
        description: `Contact with ${member.familyMember} is consistently rated as negative`,
        recommendation: `Review contact arrangements. Consider whether current format is in child's best interests. Discuss with social worker.`,
      });
    }
  }

  // Post-contact incidents
  const incidentContacts = contacts.filter(c => c.occurred && (c.incidentDuring || c.incidentAfter));
  if (incidentContacts.length >= 3) {
    concerns.push({
      severity: "significant",
      category: "safety",
      description: `${incidentContacts.length} contacts linked to incidents — contact may be triggering dysregulation`,
      recommendation: "Review contact plan with social worker. Consider whether additional support is needed before/during/after contact.",
    });
  }

  // Significant mood drops
  const moodDrops = contacts.filter(c =>
    c.occurred && c.childMoodBefore != null && c.childMoodAfter != null &&
    (c.childMoodAfter - c.childMoodBefore) <= -2
  );
  if (moodDrops.length >= 3) {
    concerns.push({
      severity: "critical",
      category: "emotional_impact",
      description: `Child's mood has dropped significantly after ${moodDrops.length} contacts — consistent pattern of emotional distress`,
      recommendation: "Urgent LAC review discussion. Contact is causing harm. Explore with child, consider therapeutic support, and review plan with IRO.",
    });
  }

  return concerns.sort((a, b) => {
    const severityOrder = { critical: 0, significant: 1, moderate: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

// ── Regulatory Assessment ───────────────────────────────────────────────────

function assessRegulatoryCompliance(
  contacts: FamilyContact[],
  requirements: ContactPlanRequirement[],
  memberAnalysis: MemberContactAnalysis[],
): RegulatoryFlag[] {
  const flags: RegulatoryFlag[] = [];

  // Reg 7: Contact arrangements
  const allCompliant = requirements.every(req => {
    if (req.requiredFrequency === "no_contact") return true;
    const analysis = memberAnalysis.find(m => m.familyMember === req.familyMember);
    return analysis && analysis.compliancePercent >= 75;
  });

  flags.push({
    regulation: "CHR 2015 Reg 7",
    description: "Contact between child and parents/others — arrangements maintained as per care plan",
    status: allCompliant ? "met" : requirements.some(req => {
      const analysis = memberAnalysis.find(m => m.familyMember === req.familyMember);
      return analysis && analysis.compliancePercent >= 50;
    }) ? "partially_met" : "not_met",
  });

  // Reg 7(2)(a): Promote contact in child's best interests
  const hasPositiveContacts = contacts.some(c => c.occurred && c.quality === "positive");
  flags.push({
    regulation: "CHR 2015 Reg 7(2)(a)",
    description: "Promote contact unless not in best interests — evidence of quality contact facilitation",
    status: hasPositiveContacts ? "met" : contacts.some(c => c.occurred) ? "partially_met" : "not_met",
  });

  // Children Act 1989 Schedule 2, Para 15: Sibling contact
  const siblingReqs = requirements.filter(r => r.relation === "sibling");
  if (siblingReqs.length > 0) {
    const siblingContacts = memberAnalysis.filter(m => m.relation === "sibling" && m.occurredCount > 0);
    flags.push({
      regulation: "Children Act 1989 Sch 2 Para 15",
      description: "Sibling contact arrangements maintained where siblings placed separately",
      status: siblingContacts.length === siblingReqs.length ? "met" :
              siblingContacts.length > 0 ? "partially_met" : "not_met",
    });
  }

  // SCCIF: Child's views about contact
  const childRefusals = contacts.filter(c => c.cancelledBy === "child");
  if (childRefusals.length > 0) {
    flags.push({
      regulation: "SCCIF Quality of Care",
      description: "Child's views about contact are heard and respected — evidence of child voice in decisions",
      status: "partially_met", // Child has voiced views, are they being acted on?
    });
  }

  return flags;
}

// ── Recommendations ─────────────────────────────────────────────────────────

function generateRecommendations(
  concerns: ContactConcern[],
  patterns: ContactPattern[],
  memberAnalysis: MemberContactAnalysis[],
  rating: FamilyContactAssessment["overallRating"],
): string[] {
  const recs: string[] = [];

  if (rating === "inadequate" || rating === "requires_improvement") {
    recs.push("Contact arrangements require urgent review at next LAC review or professionals meeting");
  }

  // From concerns
  for (const concern of concerns.slice(0, 3)) {
    recs.push(concern.recommendation);
  }

  // Pattern-based
  const distressPattern = patterns.find(p => p.type === "post_contact_distress");
  if (distressPattern) {
    recs.push("Implement structured post-contact debriefs with the young person — explore what helps them after contact");
  }

  const positivePattern = patterns.find(p => p.type === "consistent_positive");
  if (positivePattern) {
    recs.push("Build on positive contact relationships — consider extending duration or reducing supervision where appropriate");
  }

  // General
  if (memberAnalysis.some(m => m.trend === "declining")) {
    recs.push("Contact quality is declining — consider family work or therapeutic support to improve interactions");
  }

  return [...new Set(recs)].slice(0, 5);
}

// ── Summary Generation ──────────────────────────────────────────────────────

function generateSummary(
  childName: string,
  score: number,
  rating: string,
  memberAnalysis: MemberContactAnalysis[],
  concerns: ContactConcern[],
): string {
  const parts: string[] = [];

  parts.push(`Family contact for ${childName}: ${score}% (${rating.replace(/_/g, " ")}).`);

  const totalOccurred = memberAnalysis.reduce((s, m) => s + m.occurredCount, 0);
  const totalPlanned = memberAnalysis.reduce((s, m) => s + m.plannedCount, 0);
  if (totalPlanned > 0) {
    parts.push(`${totalOccurred} of ${totalPlanned} planned contacts occurred (${Math.round((totalOccurred / totalPlanned) * 100)}% attendance).`);
  }

  if (concerns.length > 0) {
    const critical = concerns.filter(c => c.severity === "critical" || c.severity === "significant");
    if (critical.length > 0) {
      parts.push(`${critical.length} significant concern(s) identified requiring action.`);
    }
  }

  const declining = memberAnalysis.filter(m => m.trend === "declining");
  if (declining.length > 0) {
    parts.push(`Quality declining with ${declining.map(m => m.familyMember).join(", ")}.`);
  }

  const positive = memberAnalysis.filter(m => m.averageQuality >= 0.8 && m.occurredCount >= 2);
  if (positive.length > 0) {
    parts.push(`Positive contact maintained with ${positive.map(m => m.familyMember).join(", ")}.`);
  }

  return parts.join(" ");
}
