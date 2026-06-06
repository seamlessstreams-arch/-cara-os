// ══════════���══════════════════════════════════��════════════════════════════════
// CRITICAL INCIDENT LESSONS LEARNED INTELLIGENCE ENGINE
//
// Pure deterministic engine for tracking post-incident reviews, lessons learned
// identification, implementation tracking, and practice embedding evidence.
//
// Regulatory basis:
//   - CHR 2015, Reg 40(4)(b) — Notifications: review of events
//   - CHR 2015, Reg 45(1) — Quality of care review must evaluate impact
//   - SCCIF — "Learning organisation" culture is key differentiator
//   - Guide to CHR Regs — Incidents should lead to demonstrable improvements
//
// This engine answers: "Does this home learn from incidents?"
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type IncidentCategory =
  | "restraint"
  | "missing_from_care"
  | "safeguarding"
  | "self_harm"
  | "violence_aggression"
  | "property_damage"
  | "substance_misuse"
  | "exploitation"
  | "medication_error"
  | "staff_conduct"
  | "complaint"
  | "near_miss";

export type ReviewStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "overdue";

export type ActionStatus =
  | "identified"
  | "in_progress"
  | "completed"
  | "evidenced"
  | "abandoned";

export type EmbeddingStatus =
  | "not_started"
  | "action_taken"
  | "practice_changed"
  | "embedded_evidenced"
  | "failed_to_embed";

export type PatternType =
  | "recurring_incident"
  | "recurring_trigger"
  | "recurring_time"
  | "recurring_location"
  | "recurring_staff_involved"
  | "escalating_severity"
  | "lessons_not_embedded";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface IncidentRecord {
  id: string;
  date: string; // ISO date
  category: IncidentCategory;
  severity: 1 | 2 | 3 | 4 | 5; // 1 = minor, 5 = critical
  childId?: string;
  childName?: string;
  staffInvolved: string[];
  description: string;
  triggers?: string[];
  location?: string;
  timeOfDay?: string; // HH:MM
}

export interface PostIncidentReview {
  id: string;
  incidentId: string;
  status: ReviewStatus;
  reviewDate?: string; // ISO date
  dueDate: string; // ISO date
  reviewedBy?: string;
  rootCauses: string[];
  lessonsIdentified: string[];
  childVoiceIncluded: boolean;
  staffReflectionCompleted: boolean;
  immediateChanges: string[];
  longerTermActions: LessonAction[];
}

export interface LessonAction {
  id: string;
  reviewId: string;
  description: string;
  assignedTo: string;
  status: ActionStatus;
  dueDate: string;
  completedDate?: string;
  evidenceDescription?: string;
  embeddingStatus: EmbeddingStatus;
  embeddingEvidence?: string;
}

export interface LessonPattern {
  type: PatternType;
  description: string;
  incidentIds: string[];
  frequency: number;
  firstOccurrence: string;
  lastOccurrence: string;
  wasAddressed: boolean;
  actionTaken?: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ReviewComplianceResult {
  totalIncidents: number;
  reviewsCompleted: number;
  reviewsOverdue: number;
  reviewsPending: number;
  averageReviewDays: number;
  compliancePercentage: number;
  childVoiceInclusionRate: number;
  staffReflectionRate: number;
}

export interface LessonImplementationResult {
  totalLessonsIdentified: number;
  actionsCreated: number;
  actionsCompleted: number;
  actionsEvidenced: number;
  actionsOverdue: number;
  actionsAbandoned: number;
  implementationRate: number;
  embeddingRate: number;
}

export interface LearningOrganisationScore {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  // Overall
  overallScore: number; // 0-100
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";

  // Components
  reviewCompliance: ReviewComplianceResult;
  lessonImplementation: LessonImplementationResult;
  patterns: LessonPattern[];
  patternsAddressed: number;
  patternsUnaddressed: number;

  // SCCIF alignment
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];

  // Trend indicators
  improvementTrend: "improving" | "stable" | "declining";
  repeatIncidentRate: number;
}

// ── Helper: Days between dates ─────────────────────────────────────────────

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Helper: Is overdue ─────────────────────────────────────────────────────

function isOverdue(dueDate: string, currentDate: string): boolean {
  return new Date(currentDate) > new Date(dueDate);
}

// ── Core: Evaluate Review Compliance ───────────────────────────────────────

export function evaluateReviewCompliance(
  incidents: IncidentRecord[],
  reviews: PostIncidentReview[],
  currentDate: string,
): ReviewComplianceResult {
  const totalIncidents = incidents.length;

  const reviewsCompleted = reviews.filter((r) => r.status === "completed").length;
  const reviewsPending = reviews.filter((r) => r.status === "pending" || r.status === "in_progress").length;
  const reviewsOverdue = reviews.filter(
    (r) => (r.status === "pending" || r.status === "in_progress") && isOverdue(r.dueDate, currentDate),
  ).length;

  // Calculate average days to complete review
  const completedReviews = reviews.filter((r) => r.status === "completed" && r.reviewDate);
  let averageReviewDays = 0;
  if (completedReviews.length > 0) {
    const totalDays = completedReviews.reduce((sum, r) => {
      const incident = incidents.find((i) => i.id === r.incidentId);
      if (!incident || !r.reviewDate) return sum;
      return sum + daysBetween(incident.date, r.reviewDate);
    }, 0);
    averageReviewDays = Math.round(totalDays / completedReviews.length);
  }

  const compliancePercentage =
    totalIncidents > 0 ? Math.round((reviewsCompleted / totalIncidents) * 100) : 100;

  const childVoiceIncluded = reviews.filter((r) => r.childVoiceIncluded).length;
  const childVoiceInclusionRate =
    reviews.length > 0 ? Math.round((childVoiceIncluded / reviews.length) * 100) : 0;

  const staffReflectionDone = reviews.filter((r) => r.staffReflectionCompleted).length;
  const staffReflectionRate =
    reviews.length > 0 ? Math.round((staffReflectionDone / reviews.length) * 100) : 0;

  return {
    totalIncidents,
    reviewsCompleted,
    reviewsOverdue,
    reviewsPending,
    averageReviewDays,
    compliancePercentage,
    childVoiceInclusionRate,
    staffReflectionRate,
  };
}

// ── Core: Evaluate Lesson Implementation ───────────────────────────────────

export function evaluateLessonImplementation(
  reviews: PostIncidentReview[],
  currentDate: string,
): LessonImplementationResult {
  const allLessons = reviews.flatMap((r) => r.lessonsIdentified);
  const allActions = reviews.flatMap((r) => r.longerTermActions);

  const actionsCompleted = allActions.filter(
    (a) => a.status === "completed" || a.status === "evidenced",
  ).length;
  const actionsEvidenced = allActions.filter((a) => a.status === "evidenced").length;
  const actionsAbandoned = allActions.filter((a) => a.status === "abandoned").length;
  const actionsOverdue = allActions.filter(
    (a) =>
      (a.status === "identified" || a.status === "in_progress") &&
      isOverdue(a.dueDate, currentDate),
  ).length;

  const implementationRate =
    allActions.length > 0 ? Math.round((actionsCompleted / allActions.length) * 100) : 0;

  const embeddedActions = allActions.filter(
    (a) => a.embeddingStatus === "embedded_evidenced",
  ).length;
  const embeddingRate =
    allActions.length > 0 ? Math.round((embeddedActions / allActions.length) * 100) : 0;

  return {
    totalLessonsIdentified: allLessons.length,
    actionsCreated: allActions.length,
    actionsCompleted,
    actionsEvidenced,
    actionsOverdue,
    actionsAbandoned,
    implementationRate,
    embeddingRate,
  };
}

// ── Core: Detect Patterns ──���───────────────────────────────────────────────

export function detectPatterns(
  incidents: IncidentRecord[],
  reviews: PostIncidentReview[],
): LessonPattern[] {
  const patterns: LessonPattern[] = [];

  // 1. Recurring incident categories
  const categoryGroups = new Map<IncidentCategory, IncidentRecord[]>();
  for (const incident of incidents) {
    const existing = categoryGroups.get(incident.category) || [];
    existing.push(incident);
    categoryGroups.set(incident.category, existing);
  }

  for (const [category, group] of categoryGroups) {
    if (group.length >= 3) {
      const sorted = group.sort((a, b) => a.date.localeCompare(b.date));
      const relatedReviews = reviews.filter((r) =>
        group.some((i) => i.id === r.incidentId),
      );
      const wasAddressed = relatedReviews.some(
        (r) =>
          r.status === "completed" &&
          r.longerTermActions.some((a) => a.status === "evidenced"),
      );

      patterns.push({
        type: "recurring_incident",
        description: `${getCategoryLabel(category)} incidents occurred ${group.length} times`,
        incidentIds: group.map((i) => i.id),
        frequency: group.length,
        firstOccurrence: sorted[0].date,
        lastOccurrence: sorted[sorted.length - 1].date,
        wasAddressed,
        actionTaken: wasAddressed
          ? "Post-incident review completed with evidenced actions"
          : undefined,
      });
    }
  }

  // 2. Recurring triggers
  const triggerCounts = new Map<string, IncidentRecord[]>();
  for (const incident of incidents) {
    for (const trigger of incident.triggers ?? []) {
      const existing = triggerCounts.get(trigger) || [];
      existing.push(incident);
      triggerCounts.set(trigger, existing);
    }
  }

  for (const [trigger, group] of triggerCounts) {
    if (group.length >= 2) {
      const sorted = group.sort((a, b) => a.date.localeCompare(b.date));
      patterns.push({
        type: "recurring_trigger",
        description: `Trigger "${trigger}" identified in ${group.length} incidents`,
        incidentIds: group.map((i) => i.id),
        frequency: group.length,
        firstOccurrence: sorted[0].date,
        lastOccurrence: sorted[sorted.length - 1].date,
        wasAddressed: false, // would need deeper analysis
      });
    }
  }

  // 3. Escalating severity
  if (incidents.length >= 3) {
    const sorted = [...incidents].sort((a, b) => a.date.localeCompare(b.date));
    const recentHalf = sorted.slice(Math.floor(sorted.length / 2));
    const olderHalf = sorted.slice(0, Math.floor(sorted.length / 2));

    const recentAvgSeverity =
      recentHalf.reduce((s, i) => s + i.severity, 0) / recentHalf.length;
    const olderAvgSeverity =
      olderHalf.reduce((s, i) => s + i.severity, 0) / olderHalf.length;

    if (recentAvgSeverity > olderAvgSeverity + 0.5) {
      patterns.push({
        type: "escalating_severity",
        description: `Average severity increasing: ${olderAvgSeverity.toFixed(1)} → ${recentAvgSeverity.toFixed(1)}`,
        incidentIds: sorted.map((i) => i.id),
        frequency: sorted.length,
        firstOccurrence: sorted[0].date,
        lastOccurrence: sorted[sorted.length - 1].date,
        wasAddressed: false,
      });
    }
  }

  // 4. Lessons not embedded (repeated incident after review completed)
  for (const review of reviews.filter((r) => r.status === "completed")) {
    const reviewedIncident = incidents.find((i) => i.id === review.incidentId);
    if (!reviewedIncident) continue;

    const laterSameCategory = incidents.filter(
      (i) =>
        i.category === reviewedIncident.category &&
        i.date > (review.reviewDate ?? reviewedIncident.date) &&
        i.id !== reviewedIncident.id,
    );

    if (laterSameCategory.length > 0) {
      patterns.push({
        type: "lessons_not_embedded",
        description: `${getCategoryLabel(reviewedIncident.category)} incident recurred after review (${laterSameCategory.length} times)`,
        incidentIds: [reviewedIncident.id, ...laterSameCategory.map((i) => i.id)],
        frequency: laterSameCategory.length,
        firstOccurrence: reviewedIncident.date,
        lastOccurrence: laterSameCategory[laterSameCategory.length - 1].date,
        wasAddressed: false,
      });
    }
  }

  return patterns;
}

// ── Main: Generate Learning Organisation Score ──��──────────────────────────

export function generateLearningOrganisationScore(
  incidents: IncidentRecord[],
  reviews: PostIncidentReview[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  currentDate: string,
): LearningOrganisationScore {
  const assessedAt = new Date().toISOString();

  // Filter to period
  const periodIncidents = incidents.filter(
    (i) => withinPeriod(i.date, periodStart, periodEnd),
  );

  // 1. Review compliance
  const reviewCompliance = evaluateReviewCompliance(periodIncidents, reviews, currentDate);

  // 2. Lesson implementation
  const lessonImplementation = evaluateLessonImplementation(reviews, currentDate);

  // 3. Pattern detection
  const patterns = detectPatterns(periodIncidents, reviews);
  const patternsAddressed = patterns.filter((p) => p.wasAddressed).length;
  const patternsUnaddressed = patterns.filter((p) => !p.wasAddressed).length;

  // 4. Repeat incident rate
  const lessonsNotEmbedded = patterns.filter((p) => p.type === "lessons_not_embedded");
  const repeatIncidentRate =
    periodIncidents.length > 0
      ? Math.round(
          (lessonsNotEmbedded.reduce((s, p) => s + p.frequency, 0) / periodIncidents.length) *
            100,
        )
      : 0;

  // 5. Calculate overall score
  const overallScore = calculateLearningScore(
    reviewCompliance,
    lessonImplementation,
    patterns,
    patternsAddressed,
  );

  // 6. Determine rating
  const rating = getScoreRating(overallScore);

  // 7. Determine trend
  const improvementTrend = determineTrend(patterns, lessonImplementation);

  // 8. Generate insights
  const strengths = generateStrengths(reviewCompliance, lessonImplementation, patterns);
  const areasForDevelopment = generateAreasForDevelopment(
    reviewCompliance,
    lessonImplementation,
    patterns,
  );
  const immediateActions = generateLearningActions(
    reviewCompliance,
    lessonImplementation,
    patterns,
    currentDate,
  );
  const regulatoryLinks = generateLearningRegulatoryLinks(patterns, reviewCompliance);

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    reviewCompliance,
    lessonImplementation,
    patterns,
    patternsAddressed,
    patternsUnaddressed,
    strengths,
    areasForDevelopment,
    immediateActions,
    regulatoryLinks,
    improvementTrend,
    repeatIncidentRate,
  };
}

// ── Scoring ────────────────────────────────────────────────────────────────

function calculateLearningScore(
  reviewCompliance: ReviewComplianceResult,
  implementation: LessonImplementationResult,
  patterns: LessonPattern[],
  patternsAddressed: number,
): number {
  let score = 0;

  // Review compliance (max 30 points)
  score += (reviewCompliance.compliancePercentage / 100) * 20;
  score += (reviewCompliance.childVoiceInclusionRate / 100) * 5;
  score += (reviewCompliance.staffReflectionRate / 100) * 5;

  // Lesson implementation (max 35 points)
  score += (implementation.implementationRate / 100) * 20;
  score += (implementation.embeddingRate / 100) * 15;

  // Timeliness (max 15 points)
  if (reviewCompliance.averageReviewDays <= 3) score += 15;
  else if (reviewCompliance.averageReviewDays <= 7) score += 12;
  else if (reviewCompliance.averageReviewDays <= 14) score += 8;
  else if (reviewCompliance.averageReviewDays <= 28) score += 4;

  // Pattern response (max 20 points)
  const totalPatterns = patterns.length;
  if (totalPatterns === 0) {
    score += 15; // No patterns = good baseline
  } else {
    score += (patternsAddressed / totalPatterns) * 20;
  }

  // Penalties
  if (reviewCompliance.reviewsOverdue > 0) score -= reviewCompliance.reviewsOverdue * 3;
  if (implementation.actionsAbandoned > 2) score -= 5;

  const lessonsNotEmbedded = patterns.filter((p) => p.type === "lessons_not_embedded");
  score -= lessonsNotEmbedded.length * 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getScoreRating(
  score: number,
): "outstanding" | "good" | "requires_improvement" | "inadequate" {
  if (score >= 85) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "requires_improvement";
  return "inadequate";
}

function determineTrend(
  patterns: LessonPattern[],
  implementation: LessonImplementationResult,
): "improving" | "stable" | "declining" {
  const escalating = patterns.filter((p) => p.type === "escalating_severity");
  const notEmbedded = patterns.filter((p) => p.type === "lessons_not_embedded");

  if (escalating.length > 0 || notEmbedded.length > 2) return "declining";
  if (implementation.embeddingRate >= 60 && notEmbedded.length === 0) return "improving";
  return "stable";
}

// ── Insight Generation ─────────────────────────────────────────────────────

function generateStrengths(
  rc: ReviewComplianceResult,
  impl: LessonImplementationResult,
  patterns: LessonPattern[],
): string[] {
  const strengths: string[] = [];

  if (rc.compliancePercentage >= 90) {
    strengths.push("Strong review compliance: all incidents receive timely post-incident reviews");
  }
  if (rc.childVoiceInclusionRate >= 80) {
    strengths.push("Excellent child voice inclusion in reviews demonstrates child-centred practice");
  }
  if (rc.staffReflectionRate >= 80) {
    strengths.push("High staff reflection completion rate supports professional development");
  }
  if (impl.embeddingRate >= 60) {
    strengths.push("Good evidence of lessons being embedded into practice changes");
  }
  if (impl.implementationRate >= 80) {
    strengths.push("High action implementation rate demonstrates organisational follow-through");
  }
  if (rc.averageReviewDays <= 5) {
    strengths.push(`Rapid review turnaround (average ${rc.averageReviewDays} days) enables swift learning`);
  }
  if (patterns.filter((p) => p.type === "lessons_not_embedded").length === 0) {
    strengths.push("No evidence of lesson failures — patterns are being addressed effectively");
  }

  return strengths;
}

function generateAreasForDevelopment(
  rc: ReviewComplianceResult,
  impl: LessonImplementationResult,
  patterns: LessonPattern[],
): string[] {
  const areas: string[] = [];

  if (rc.compliancePercentage < 80) {
    areas.push("Review compliance below 80% — ensure all incidents receive post-incident review");
  }
  if (rc.childVoiceInclusionRate < 60) {
    areas.push("Child voice included in fewer than 60% of reviews — develop approach to capture child's perspective");
  }
  if (rc.staffReflectionRate < 60) {
    areas.push("Staff reflection completion below 60% — embed reflective practice as standard");
  }
  if (impl.embeddingRate < 40) {
    areas.push("Lesson embedding rate below 40% — strengthen mechanisms to evidence practice change");
  }
  if (impl.actionsOverdue > 0) {
    areas.push(`${impl.actionsOverdue} overdue action(s) — review capacity and prioritise completion`);
  }
  if (rc.averageReviewDays > 14) {
    areas.push(`Reviews take ${rc.averageReviewDays} days on average — target completion within 7 working days`);
  }

  const notEmbedded = patterns.filter((p) => p.type === "lessons_not_embedded");
  if (notEmbedded.length > 0) {
    areas.push(`${notEmbedded.length} pattern(s) where lessons were not embedded — review learning transfer mechanisms`);
  }

  return areas;
}

function generateLearningActions(
  rc: ReviewComplianceResult,
  impl: LessonImplementationResult,
  patterns: LessonPattern[],
  currentDate: string,
): string[] {
  const actions: string[] = [];

  if (rc.reviewsOverdue > 0) {
    actions.push(
      `URGENT: ${rc.reviewsOverdue} post-incident review(s) overdue. Complete within 48 hours and document reasons for delay.`,
    );
  }

  if (impl.actionsOverdue > 3) {
    actions.push(
      `HIGH: ${impl.actionsOverdue} lesson actions overdue. Schedule manager review to triage: complete, extend, or formally close with rationale.`,
    );
  }

  const escalating = patterns.filter((p) => p.type === "escalating_severity");
  if (escalating.length > 0) {
    actions.push(
      `HIGH: Escalating severity pattern detected. Convene multi-disciplinary review to analyse root causes and develop enhanced prevention strategy.`,
    );
  }

  const notEmbedded = patterns.filter((p) => p.type === "lessons_not_embedded");
  if (notEmbedded.length > 0) {
    actions.push(
      `MEDIUM: ${notEmbedded.length} lesson(s) failed to embed. Review learning transfer approach — consider team sessions, supervision agenda items, or practice observations.`,
    );
  }

  if (rc.childVoiceInclusionRate < 50) {
    actions.push(
      `MEDIUM: Child voice included in only ${rc.childVoiceInclusionRate}% of reviews. Develop age-appropriate tools for capturing children's perspectives post-incident.`,
    );
  }

  if (actions.length === 0) {
    actions.push(
      "No immediate actions required. Learning culture is functioning effectively. Continue to monitor patterns and maintain review quality.",
    );
  }

  return actions;
}

function generateLearningRegulatoryLinks(
  patterns: LessonPattern[],
  rc: ReviewComplianceResult,
): string[] {
  const links = new Set<string>();

  links.add("CHR 2015, Reg 45(1) — Quality of care review: evaluate patterns and responses");
  links.add("SCCIF: Effectiveness of leaders — Learning from incidents and driving improvement");

  if (rc.reviewsOverdue > 0) {
    links.add("CHR 2015, Reg 40(4)(b) — Review of notifiable events must be timely");
  }
  if (rc.childVoiceInclusionRate < 100) {
    links.add("CHR 2015, Reg 7 — Children's wishes and feelings: include in all review processes");
    links.add("UNCRC Article 12 — Right of children to express views in matters affecting them");
  }

  const notEmbedded = patterns.filter((p) => p.type === "lessons_not_embedded");
  if (notEmbedded.length > 0) {
    links.add("Guide to CHR 2015: Incidents should lead to demonstrable practice improvements");
    links.add("SCCIF: Impact of leaders — Evidence of systematic quality improvement");
  }

  const escalating = patterns.filter((p) => p.type === "escalating_severity");
  if (escalating.length > 0) {
    links.add("CHR 2015, Reg 12 — Protection of children: proactive risk management");
    links.add("CHR 2015, Reg 34(1) — Review quality of care when concerns identified");
  }

  return [...links];
}

// ── Utility: Category label ────────────────────────────────────────────────

export function getCategoryLabel(category: IncidentCategory): string {
  const labels: Record<IncidentCategory, string> = {
    restraint: "Physical Restraint",
    missing_from_care: "Missing from Care",
    safeguarding: "Safeguarding Concern",
    self_harm: "Self-Harm",
    violence_aggression: "Violence/Aggression",
    property_damage: "Property Damage",
    substance_misuse: "Substance Misuse",
    exploitation: "Exploitation",
    medication_error: "Medication Error",
    staff_conduct: "Staff Conduct",
    complaint: "Complaint",
    near_miss: "Near Miss",
  };
  return labels[category];
}

// ── Utility: Review status label ───────────────────────────────────────────

export function getReviewStatusLabel(status: ReviewStatus): string {
  const labels: Record<ReviewStatus, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    overdue: "Overdue",
  };
  return labels[status];
}

// ── Utility: Embedding status label ────────────────────────────────────────

export function getEmbeddingStatusLabel(status: EmbeddingStatus): string {
  const labels: Record<EmbeddingStatus, string> = {
    not_started: "Not Started",
    action_taken: "Action Taken",
    practice_changed: "Practice Changed",
    embedded_evidenced: "Embedded & Evidenced",
    failed_to_embed: "Failed to Embed",
  };
  return labels[status];
}

// ── Utility: Rating label ──────────────────────────────────────────────────

export function getRatingLabel(
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate",
): string {
  const labels = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[rating];
}
