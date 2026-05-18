// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Critical Incident Lessons Learned Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  generateLearningOrganisationScore,
  evaluateReviewCompliance,
  evaluateLessonImplementation,
  detectPatterns,
  getCategoryLabel,
  getReviewStatusLabel,
  getEmbeddingStatusLabel,
  getRatingLabel,
} from "../lessons-learned-engine";
import type {
  IncidentRecord,
  PostIncidentReview,
  LessonAction,
} from "../lessons-learned-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const makeIncident = (overrides: Partial<IncidentRecord> = {}): IncidentRecord => ({
  id: "inc-1",
  date: "2026-05-10",
  category: "restraint",
  severity: 3,
  childId: "child-1",
  childName: "Alex",
  staffInvolved: ["Sarah Johnson", "Mike Chen"],
  description: "Physical intervention required following escalation",
  triggers: ["transition", "peer conflict"],
  location: "living room",
  timeOfDay: "16:30",
  ...overrides,
});

const makeAction = (overrides: Partial<LessonAction> = {}): LessonAction => ({
  id: "action-1",
  reviewId: "review-1",
  description: "Develop transition support plan for Alex",
  assignedTo: "Sarah Johnson",
  status: "completed",
  dueDate: "2026-05-24",
  completedDate: "2026-05-20",
  evidenceDescription: "Transition plan in place and shared with team",
  embeddingStatus: "embedded_evidenced",
  embeddingEvidence: "Team trained on new approach, 3 successful transitions observed",
  ...overrides,
});

const makeReview = (overrides: Partial<PostIncidentReview> = {}): PostIncidentReview => ({
  id: "review-1",
  incidentId: "inc-1",
  status: "completed",
  reviewDate: "2026-05-13",
  dueDate: "2026-05-17",
  reviewedBy: "Darren Laville (RM)",
  rootCauses: ["Unstructured transition period", "Peer tension unresolved from morning"],
  lessonsIdentified: [
    "Transition periods need structured activities",
    "Morning conflict resolution must be completed before afternoon",
  ],
  childVoiceIncluded: true,
  staffReflectionCompleted: true,
  immediateChanges: ["Added transition activity box to living room"],
  longerTermActions: [makeAction()],
  ...overrides,
});

// ── evaluateReviewCompliance ───────────────────────────────────────────────

describe("evaluateReviewCompliance", () => {
  it("returns 100% compliance when all incidents reviewed", () => {
    const incidents = [makeIncident({ id: "inc-1" }), makeIncident({ id: "inc-2" })];
    const reviews = [
      makeReview({ id: "r1", incidentId: "inc-1", status: "completed" }),
      makeReview({ id: "r2", incidentId: "inc-2", status: "completed" }),
    ];

    const result = evaluateReviewCompliance(incidents, reviews, "2026-05-18");
    expect(result.compliancePercentage).toBe(100);
    expect(result.reviewsCompleted).toBe(2);
    expect(result.reviewsOverdue).toBe(0);
  });

  it("identifies overdue reviews", () => {
    const incidents = [makeIncident({ id: "inc-1" })];
    const reviews = [
      makeReview({ id: "r1", incidentId: "inc-1", status: "pending", dueDate: "2026-05-15" }),
    ];

    const result = evaluateReviewCompliance(incidents, reviews, "2026-05-18");
    expect(result.reviewsOverdue).toBe(1);
    expect(result.compliancePercentage).toBe(0); // 0 completed out of 1
  });

  it("calculates average review days correctly", () => {
    const incidents = [
      makeIncident({ id: "inc-1", date: "2026-05-01" }),
      makeIncident({ id: "inc-2", date: "2026-05-05" }),
    ];
    const reviews = [
      makeReview({ id: "r1", incidentId: "inc-1", reviewDate: "2026-05-04" }), // 3 days
      makeReview({ id: "r2", incidentId: "inc-2", reviewDate: "2026-05-12" }), // 7 days
    ];

    const result = evaluateReviewCompliance(incidents, reviews, "2026-05-18");
    expect(result.averageReviewDays).toBe(5); // (3+7)/2
  });

  it("tracks child voice inclusion rate", () => {
    const incidents = [makeIncident({ id: "inc-1" }), makeIncident({ id: "inc-2" })];
    const reviews = [
      makeReview({ id: "r1", incidentId: "inc-1", childVoiceIncluded: true }),
      makeReview({ id: "r2", incidentId: "inc-2", childVoiceIncluded: false }),
    ];

    const result = evaluateReviewCompliance(incidents, reviews, "2026-05-18");
    expect(result.childVoiceInclusionRate).toBe(50);
  });

  it("tracks staff reflection rate", () => {
    const incidents = [makeIncident()];
    const reviews = [
      makeReview({ staffReflectionCompleted: true }),
      makeReview({ id: "r2", incidentId: "inc-1", staffReflectionCompleted: false }),
    ];

    const result = evaluateReviewCompliance(incidents, reviews, "2026-05-18");
    expect(result.staffReflectionRate).toBe(50);
  });

  it("handles empty incidents gracefully", () => {
    const result = evaluateReviewCompliance([], [], "2026-05-18");
    expect(result.totalIncidents).toBe(0);
    expect(result.compliancePercentage).toBe(100);
  });
});

// ── evaluateLessonImplementation ───────────────────────────────────────────

describe("evaluateLessonImplementation", () => {
  it("calculates implementation rate from actions", () => {
    const reviews = [
      makeReview({
        longerTermActions: [
          makeAction({ id: "a1", status: "completed" }),
          makeAction({ id: "a2", status: "in_progress" }),
          makeAction({ id: "a3", status: "evidenced" }),
        ],
      }),
    ];

    const result = evaluateLessonImplementation(reviews, "2026-05-18");
    expect(result.actionsCreated).toBe(3);
    expect(result.actionsCompleted).toBe(2); // completed + evidenced
    expect(result.actionsEvidenced).toBe(1);
    expect(result.implementationRate).toBe(67); // 2/3
  });

  it("identifies overdue actions", () => {
    const reviews = [
      makeReview({
        longerTermActions: [
          makeAction({ id: "a1", status: "identified", dueDate: "2026-05-10" }),
          makeAction({ id: "a2", status: "in_progress", dueDate: "2026-05-15" }),
        ],
      }),
    ];

    const result = evaluateLessonImplementation(reviews, "2026-05-18");
    expect(result.actionsOverdue).toBe(2);
  });

  it("calculates embedding rate", () => {
    const reviews = [
      makeReview({
        longerTermActions: [
          makeAction({ id: "a1", embeddingStatus: "embedded_evidenced" }),
          makeAction({ id: "a2", embeddingStatus: "action_taken" }),
          makeAction({ id: "a3", embeddingStatus: "not_started" }),
          makeAction({ id: "a4", embeddingStatus: "embedded_evidenced" }),
        ],
      }),
    ];

    const result = evaluateLessonImplementation(reviews, "2026-05-18");
    expect(result.embeddingRate).toBe(50); // 2/4
  });

  it("tracks abandoned actions", () => {
    const reviews = [
      makeReview({
        longerTermActions: [
          makeAction({ id: "a1", status: "abandoned" }),
          makeAction({ id: "a2", status: "abandoned" }),
          makeAction({ id: "a3", status: "completed" }),
        ],
      }),
    ];

    const result = evaluateLessonImplementation(reviews, "2026-05-18");
    expect(result.actionsAbandoned).toBe(2);
  });

  it("counts total lessons identified across reviews", () => {
    const reviews = [
      makeReview({
        lessonsIdentified: ["Lesson 1", "Lesson 2"],
        longerTermActions: [makeAction()],
      }),
      makeReview({
        id: "r2",
        incidentId: "inc-2",
        lessonsIdentified: ["Lesson 3"],
        longerTermActions: [makeAction({ id: "a2", reviewId: "r2" })],
      }),
    ];

    const result = evaluateLessonImplementation(reviews, "2026-05-18");
    expect(result.totalLessonsIdentified).toBe(3);
  });
});

// ── detectPatterns ─────────────────────────────────────────────────────────

describe("detectPatterns", () => {
  it("detects recurring incident category (3+ occurrences)", () => {
    const incidents = [
      makeIncident({ id: "inc-1", category: "restraint", date: "2026-05-01" }),
      makeIncident({ id: "inc-2", category: "restraint", date: "2026-05-05" }),
      makeIncident({ id: "inc-3", category: "restraint", date: "2026-05-10" }),
    ];

    const patterns = detectPatterns(incidents, []);
    const recurring = patterns.find((p) => p.type === "recurring_incident");
    expect(recurring).toBeDefined();
    expect(recurring!.frequency).toBe(3);
    expect(recurring!.description).toContain("Physical Restraint");
  });

  it("does not flag category with fewer than 3 incidents", () => {
    const incidents = [
      makeIncident({ id: "inc-1", category: "restraint", date: "2026-05-01" }),
      makeIncident({ id: "inc-2", category: "restraint", date: "2026-05-05" }),
    ];

    const patterns = detectPatterns(incidents, []);
    const recurring = patterns.filter((p) => p.type === "recurring_incident");
    expect(recurring).toHaveLength(0);
  });

  it("detects recurring triggers", () => {
    const incidents = [
      makeIncident({ id: "inc-1", triggers: ["transition", "tired"] }),
      makeIncident({ id: "inc-2", triggers: ["transition", "hungry"] }),
      makeIncident({ id: "inc-3", triggers: ["bored"] }),
    ];

    const patterns = detectPatterns(incidents, []);
    const triggerPatterns = patterns.filter((p) => p.type === "recurring_trigger");
    const transitionPattern = triggerPatterns.find((p) => p.description.includes("transition"));
    expect(transitionPattern).toBeDefined();
    expect(transitionPattern!.frequency).toBe(2);
  });

  it("detects escalating severity", () => {
    const incidents = [
      makeIncident({ id: "inc-1", date: "2026-05-01", severity: 1 }),
      makeIncident({ id: "inc-2", date: "2026-05-03", severity: 2 }),
      makeIncident({ id: "inc-3", date: "2026-05-05", severity: 2 }),
      makeIncident({ id: "inc-4", date: "2026-05-08", severity: 4 }),
      makeIncident({ id: "inc-5", date: "2026-05-10", severity: 4 }),
      makeIncident({ id: "inc-6", date: "2026-05-12", severity: 5 }),
    ];

    const patterns = detectPatterns(incidents, []);
    const escalating = patterns.find((p) => p.type === "escalating_severity");
    expect(escalating).toBeDefined();
  });

  it("detects lessons not embedded (repeat after review)", () => {
    const incidents = [
      makeIncident({ id: "inc-1", category: "missing_from_care", date: "2026-05-01" }),
      makeIncident({ id: "inc-2", category: "missing_from_care", date: "2026-05-15" }),
    ];
    const reviews = [
      makeReview({
        id: "r1",
        incidentId: "inc-1",
        status: "completed",
        reviewDate: "2026-05-05",
        longerTermActions: [makeAction()],
      }),
    ];

    const patterns = detectPatterns(incidents, reviews);
    const notEmbedded = patterns.find((p) => p.type === "lessons_not_embedded");
    expect(notEmbedded).toBeDefined();
    expect(notEmbedded!.description).toContain("Missing from Care");
    expect(notEmbedded!.frequency).toBe(1);
  });

  it("marks recurring patterns as addressed when evidenced actions exist", () => {
    const incidents = [
      makeIncident({ id: "inc-1", category: "self_harm", date: "2026-05-01" }),
      makeIncident({ id: "inc-2", category: "self_harm", date: "2026-05-05" }),
      makeIncident({ id: "inc-3", category: "self_harm", date: "2026-05-10" }),
    ];
    const reviews = [
      makeReview({
        incidentId: "inc-1",
        status: "completed",
        longerTermActions: [makeAction({ status: "evidenced" })],
      }),
    ];

    const patterns = detectPatterns(incidents, reviews);
    const recurring = patterns.find((p) => p.type === "recurring_incident");
    expect(recurring!.wasAddressed).toBe(true);
  });

  it("returns empty array for no incidents", () => {
    const patterns = detectPatterns([], []);
    expect(patterns).toHaveLength(0);
  });
});

// ── generateLearningOrganisationScore ──────────────────────────────────────

describe("generateLearningOrganisationScore", () => {
  it("produces high score for well-functioning learning culture", () => {
    const incidents = [
      makeIncident({ id: "inc-1", date: "2026-05-01" }),
      makeIncident({ id: "inc-2", date: "2026-05-05", category: "missing_from_care" }),
    ];
    const reviews = [
      makeReview({
        id: "r1",
        incidentId: "inc-1",
        reviewDate: "2026-05-03",
        childVoiceIncluded: true,
        staffReflectionCompleted: true,
        longerTermActions: [
          makeAction({ status: "evidenced", embeddingStatus: "embedded_evidenced" }),
        ],
      }),
      makeReview({
        id: "r2",
        incidentId: "inc-2",
        reviewDate: "2026-05-08",
        childVoiceIncluded: true,
        staffReflectionCompleted: true,
        longerTermActions: [
          makeAction({ id: "a2", reviewId: "r2", status: "evidenced", embeddingStatus: "embedded_evidenced" }),
        ],
      }),
    ];

    const result = generateLearningOrganisationScore(
      incidents, reviews, "oak-house", "2026-05-01", "2026-05-18", "2026-05-18",
    );

    expect(result.overallScore).toBeGreaterThanOrEqual(70);
    expect(result.rating).toMatch(/outstanding|good/);
    expect(result.reviewCompliance.compliancePercentage).toBe(100);
    expect(result.lessonImplementation.embeddingRate).toBe(100);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("produces low score for poor learning culture", () => {
    const incidents = [
      makeIncident({ id: "inc-1", date: "2026-05-01" }),
      makeIncident({ id: "inc-2", date: "2026-05-05" }),
      makeIncident({ id: "inc-3", date: "2026-05-10" }),
    ];
    const reviews = [
      makeReview({
        id: "r1",
        incidentId: "inc-1",
        status: "pending",
        dueDate: "2026-05-05",
        reviewDate: undefined,
        childVoiceIncluded: false,
        staffReflectionCompleted: false,
        longerTermActions: [],
      }),
    ];

    const result = generateLearningOrganisationScore(
      incidents, reviews, "oak-house", "2026-05-01", "2026-05-18", "2026-05-18",
    );

    expect(result.overallScore).toBeLessThan(50);
    expect(result.rating).toMatch(/requires_improvement|inadequate/);
    expect(result.reviewCompliance.reviewsOverdue).toBe(1);
    expect(result.areasForDevelopment.length).toBeGreaterThan(0);
    expect(result.immediateActions.length).toBeGreaterThan(0);
  });

  it("detects declining trend when severity escalates", () => {
    const incidents = [
      makeIncident({ id: "inc-1", date: "2026-05-01", severity: 1 }),
      makeIncident({ id: "inc-2", date: "2026-05-03", severity: 2 }),
      makeIncident({ id: "inc-3", date: "2026-05-05", severity: 2 }),
      makeIncident({ id: "inc-4", date: "2026-05-08", severity: 4 }),
      makeIncident({ id: "inc-5", date: "2026-05-10", severity: 4 }),
      makeIncident({ id: "inc-6", date: "2026-05-12", severity: 5 }),
    ];

    const result = generateLearningOrganisationScore(
      incidents, [], "oak-house", "2026-05-01", "2026-05-18", "2026-05-18",
    );

    expect(result.improvementTrend).toBe("declining");
  });

  it("calculates repeat incident rate", () => {
    const incidents = [
      makeIncident({ id: "inc-1", date: "2026-05-01", category: "missing_from_care" }),
      makeIncident({ id: "inc-2", date: "2026-05-10", category: "missing_from_care" }),
      makeIncident({ id: "inc-3", date: "2026-05-12", category: "restraint" }),
    ];
    const reviews = [
      makeReview({ id: "r1", incidentId: "inc-1", reviewDate: "2026-05-05", status: "completed" }),
    ];

    const result = generateLearningOrganisationScore(
      incidents, reviews, "oak-house", "2026-05-01", "2026-05-18", "2026-05-18",
    );

    // inc-2 is a repeat after review of inc-1 (same category)
    expect(result.repeatIncidentRate).toBeGreaterThan(0);
  });

  it("includes regulatory links", () => {
    const incidents = [makeIncident()];
    const reviews = [makeReview()];

    const result = generateLearningOrganisationScore(
      incidents, reviews, "oak-house", "2026-05-01", "2026-05-18", "2026-05-18",
    );

    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 45"))).toBe(true);
  });

  it("filters incidents to the specified period", () => {
    const incidents = [
      makeIncident({ id: "inc-outside", date: "2026-04-01" }), // outside period
      makeIncident({ id: "inc-inside", date: "2026-05-10" }),
    ];
    const reviews = [makeReview({ incidentId: "inc-inside" })];

    const result = generateLearningOrganisationScore(
      incidents, reviews, "oak-house", "2026-05-01", "2026-05-18", "2026-05-18",
    );

    expect(result.reviewCompliance.totalIncidents).toBe(1); // only the one in period
  });

  it("handles zero incidents gracefully", () => {
    const result = generateLearningOrganisationScore(
      [], [], "oak-house", "2026-05-01", "2026-05-18", "2026-05-18",
    );

    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.reviewCompliance.totalIncidents).toBe(0);
    expect(result.patterns).toHaveLength(0);
  });

  it("populates homeId and period metadata", () => {
    const result = generateLearningOrganisationScore(
      [], [], "oak-house", "2026-05-01", "2026-05-18", "2026-05-18",
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-05-01");
    expect(result.periodEnd).toBe("2026-05-18");
    expect(result.assessedAt).toBeTruthy();
  });
});

// ── Utility Label Functions ────────────────────────────────────────────────

describe("utility label functions", () => {
  it("getCategoryLabel returns correct labels", () => {
    expect(getCategoryLabel("restraint")).toBe("Physical Restraint");
    expect(getCategoryLabel("missing_from_care")).toBe("Missing from Care");
    expect(getCategoryLabel("self_harm")).toBe("Self-Harm");
    expect(getCategoryLabel("exploitation")).toBe("Exploitation");
    expect(getCategoryLabel("near_miss")).toBe("Near Miss");
  });

  it("getReviewStatusLabel returns correct labels", () => {
    expect(getReviewStatusLabel("pending")).toBe("Pending");
    expect(getReviewStatusLabel("completed")).toBe("Completed");
    expect(getReviewStatusLabel("overdue")).toBe("Overdue");
  });

  it("getEmbeddingStatusLabel returns correct labels", () => {
    expect(getEmbeddingStatusLabel("not_started")).toBe("Not Started");
    expect(getEmbeddingStatusLabel("embedded_evidenced")).toBe("Embedded & Evidenced");
    expect(getEmbeddingStatusLabel("failed_to_embed")).toBe("Failed to Embed");
  });

  it("getRatingLabel returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});
