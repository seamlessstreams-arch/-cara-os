// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MULTI-AGENCY WORKING INTELLIGENCE ENGINE TESTS
// Comprehensive test suite: unit + integration
// Reg 5, Reg 13, Working Together to Safeguard Children 2018
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeMultiAgencyIntelligence,
  getMeetingTypeLabel,
  getRoleLabel,
  type LACReviewInput,
  type ProfessionalContactInput,
  type MultiAgencyMeetingInput,
  type ChildRef,
  type StaffRef,
  type MultiAgencyEngineInput,
} from "../multi-agency-intelligence-engine";

// ── Constants ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

// ── Factories ───────────────────────────────────────────────────────────────

function makeChild(overrides: Partial<ChildRef> = {}): ChildRef {
  return {
    id: "yp_test",
    name: "Test Child",
    ...overrides,
  };
}

function makeStaff(overrides: Partial<StaffRef> = {}): StaffRef {
  return {
    id: "staff_test",
    name: "Test Staff",
    ...overrides,
  };
}

function makeLACReview(overrides: Partial<LACReviewInput> = {}): LACReviewInput {
  return {
    id: "lac_test",
    child_id: "yp_test",
    review_type: "subsequent",
    date: "2026-04-25",
    iro_name: "Sarah Mitchell",
    child_participated: true,
    home_report_submitted: true,
    care_plan_agreed: true,
    actions: ["Action 1", "Action 2"],
    next_review_due: "2026-10-22",
    ...overrides,
  };
}

function makeProfessionalContact(overrides: Partial<ProfessionalContactInput> = {}): ProfessionalContactInput {
  return {
    id: "pc_test",
    child_id: "yp_test",
    professional_role: "social_worker",
    name: "Sarah Williams",
    last_contact_date: "2026-05-10",
    contact_frequency_days: 30,
    status: "active",
    ...overrides,
  };
}

function makeMeeting(overrides: Partial<MultiAgencyMeetingInput> = {}): MultiAgencyMeetingInput {
  return {
    id: "mtg_test",
    meeting_type: "lac_review",
    date: "2026-04-25",
    child_id: "yp_test",
    attendees: ["Sarah Mitchell", "Darren Laville", "Social Worker"],
    actions_count: 3,
    actions_completed: 3,
    home_report_submitted: true,
    ...overrides,
  };
}

function makeInput(overrides: Partial<MultiAgencyEngineInput> = {}): MultiAgencyEngineInput {
  return {
    lacReviews: [],
    professionalContacts: [],
    meetings: [],
    children: [makeChild()],
    staff: [makeStaff()],
    today: TODAY,
    ...overrides,
  };
}

// ── Chamberlain House integration data ──────────────────────────────────────────────

const OAK_CHILDREN: ChildRef[] = [
  { id: "yp_alex", name: "Alex" },
  { id: "yp_jordan", name: "Jordan" },
  { id: "yp_casey", name: "Casey" },
];

const OAK_STAFF: StaffRef[] = [
  { id: "staff_darren", name: "Darren" },
  { id: "staff_anna", name: "Anna" },
  { id: "staff_ryan", name: "Ryan" },
];

const OAK_LAC_REVIEWS: LACReviewInput[] = [
  {
    id: "lac_001",
    child_id: "yp_alex",
    review_type: "subsequent",
    date: "2026-04-25", // 30 days ago
    iro_name: "Sarah Mitchell",
    child_participated: true,
    home_report_submitted: true,
    care_plan_agreed: true,
    actions: ["Support college application", "Arrange meeting with leaving care PA"],
    next_review_due: "2026-10-22", // 150 days from today
  },
  {
    id: "lac_002",
    child_id: "yp_jordan",
    review_type: "subsequent",
    date: "2026-03-26", // 60 days ago
    iro_name: "David Wright",
    child_participated: true,
    home_report_submitted: true,
    care_plan_agreed: true,
    actions: ["Arrange fortnightly supervised contact", "Visit supported accommodation"],
    next_review_due: "2026-09-22", // 120 days from today
  },
  {
    id: "lac_003",
    child_id: "yp_casey",
    review_type: "second",
    date: "2026-05-10", // 15 days ago
    iro_name: "Sarah Mitchell",
    child_participated: true,
    home_report_submitted: false, // NOT submitted
    care_plan_agreed: true,
    actions: ["Fast-track CAMHS referral", "Begin life story work"],
    next_review_due: "2026-11-06", // 165 days from today
  },
];

const OAK_PROFESSIONAL_CONTACTS: ProfessionalContactInput[] = [
  // All 3 children: social_worker (Sarah Williams), last contact within 30 days, frequency 30
  { id: "pc_001", child_id: "yp_alex", professional_role: "social_worker", name: "Sarah Williams", last_contact_date: "2026-05-01", contact_frequency_days: 30, status: "active" },
  { id: "pc_002", child_id: "yp_jordan", professional_role: "social_worker", name: "Sarah Williams", last_contact_date: "2026-05-05", contact_frequency_days: 30, status: "active" },
  { id: "pc_003", child_id: "yp_casey", professional_role: "social_worker", name: "Sarah Williams", last_contact_date: "2026-05-10", contact_frequency_days: 30, status: "active" },
  // All 3: IRO (active)
  { id: "pc_004", child_id: "yp_alex", professional_role: "iro", name: "Sarah Mitchell", last_contact_date: "2026-04-25", contact_frequency_days: 180, status: "active" },
  { id: "pc_005", child_id: "yp_jordan", professional_role: "iro", name: "David Wright", last_contact_date: "2026-03-26", contact_frequency_days: 180, status: "active" },
  { id: "pc_006", child_id: "yp_casey", professional_role: "iro", name: "Sarah Mitchell", last_contact_date: "2026-05-10", contact_frequency_days: 180, status: "active" },
  // Jordan: CAMHS (last 45 days ago, frequency 28 days — OVERDUE)
  { id: "pc_007", child_id: "yp_jordan", professional_role: "camhs", name: "Dr Karen Hughes", last_contact_date: "2026-04-10", contact_frequency_days: 28, status: "active" },
  // Jordan: YOT (last 20 days ago, frequency 14 days — OVERDUE)
  { id: "pc_008", child_id: "yp_jordan", professional_role: "yot", name: "James Carter", last_contact_date: "2026-05-05", contact_frequency_days: 14, status: "active" },
  // Alex: education liaison (active, on time)
  { id: "pc_009", child_id: "yp_alex", professional_role: "education", name: "Mr Thompson", last_contact_date: "2026-05-15", contact_frequency_days: 30, status: "active" },
];

const OAK_MEETINGS: MultiAgencyMeetingInput[] = [
  // 2 LAC reviews (Alex & Casey)
  { id: "mtg_001", meeting_type: "lac_review", date: "2026-04-25", child_id: "yp_alex", attendees: ["Sarah Mitchell", "Darren Laville", "Lisa Chen", "Alex"], actions_count: 3, actions_completed: 1, home_report_submitted: true },
  { id: "mtg_002", meeting_type: "lac_review", date: "2026-05-10", child_id: "yp_casey", attendees: ["Sarah Mitchell", "Darren Laville", "Priya Sharma", "Casey"], actions_count: 3, actions_completed: 2, home_report_submitted: false },
  // 1 PEP meeting (Alex, all actions complete)
  { id: "mtg_003", meeting_type: "pep", date: "2026-04-15", child_id: "yp_alex", attendees: ["Mr Thompson", "Darren Laville", "Alex"], actions_count: 2, actions_completed: 2, home_report_submitted: true },
  // 1 Professionals meeting (Jordan, 3 actions, 2 complete)
  { id: "mtg_004", meeting_type: "professionals_meeting", date: "2026-04-20", child_id: "yp_jordan", attendees: ["Dr Karen Hughes", "James Carter", "Anna Kovacs"], actions_count: 3, actions_completed: 2, home_report_submitted: true },
  // 1 Strategy meeting (Casey, 2 actions, 2 complete)
  { id: "mtg_005", meeting_type: "strategy", date: "2026-05-01", child_id: "yp_casey", attendees: ["Sarah Mitchell", "Priya Sharma", "Darren Laville"], actions_count: 2, actions_completed: 2, home_report_submitted: true },
];

function makeOakInput(): MultiAgencyEngineInput {
  return {
    lacReviews: OAK_LAC_REVIEWS,
    professionalContacts: OAK_PROFESSIONAL_CONTACTS,
    meetings: OAK_MEETINGS,
    children: OAK_CHILDREN,
    staff: OAK_STAFF,
    today: TODAY,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// getMeetingTypeLabel
// ══════════════════════════════════════════════════════════════════════════════

describe("getMeetingTypeLabel", () => {
  it("returns LAC Review for lac_review", () => {
    expect(getMeetingTypeLabel("lac_review")).toBe("LAC Review");
  });

  it("returns PEP Meeting for pep", () => {
    expect(getMeetingTypeLabel("pep")).toBe("PEP Meeting");
  });

  it("returns Professionals Meeting for professionals_meeting", () => {
    expect(getMeetingTypeLabel("professionals_meeting")).toBe("Professionals Meeting");
  });

  it("returns Strategy Meeting for strategy", () => {
    expect(getMeetingTypeLabel("strategy")).toBe("Strategy Meeting");
  });

  it("returns Child Protection Conference for child_protection", () => {
    expect(getMeetingTypeLabel("child_protection")).toBe("Child Protection Conference");
  });

  it("returns raw value for unknown type", () => {
    expect(getMeetingTypeLabel("unknown_type")).toBe("unknown_type");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRoleLabel
// ══════════════════════════════════════════════════════════════════════════════

describe("getRoleLabel", () => {
  it("returns Social Worker for social_worker", () => {
    expect(getRoleLabel("social_worker")).toBe("Social Worker");
  });

  it("returns IRO for iro", () => {
    expect(getRoleLabel("iro")).toBe("IRO");
  });

  it("returns CAMHS for camhs", () => {
    expect(getRoleLabel("camhs")).toBe("CAMHS");
  });

  it("returns YOT for yot", () => {
    expect(getRoleLabel("yot")).toBe("YOT");
  });

  it("returns Education for education", () => {
    expect(getRoleLabel("education")).toBe("Education");
  });

  it("returns Health for health", () => {
    expect(getRoleLabel("health")).toBe("Health");
  });

  it("returns raw value for unknown role", () => {
    expect(getRoleLabel("specialist")).toBe("specialist");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeMultiAgencyIntelligence — Overview
// ════��═════════════════════════════════════════════════════════════════════════

describe("computeMultiAgencyIntelligence — overview", () => {
  it("counts active professionals only", () => {
    const input = makeInput({
      professionalContacts: [
        makeProfessionalContact({ id: "pc1", status: "active" }),
        makeProfessionalContact({ id: "pc2", status: "inactive" }),
        makeProfessionalContact({ id: "pc3", status: "active", professional_role: "iro" }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.overview.total_professionals).toBe(2);
  });

  it("counts children with social worker", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1" }), makeChild({ id: "c2" })],
      professionalContacts: [
        makeProfessionalContact({ child_id: "c1", professional_role: "social_worker", status: "active" }),
        makeProfessionalContact({ child_id: "c2", professional_role: "iro", status: "active" }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.overview.children_with_social_worker).toBe(1);
  });

  it("counts total children", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1" }), makeChild({ id: "c2" }), makeChild({ id: "c3" })],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.overview.total_children).toBe(3);
  });

  it("identifies overdue contacts", () => {
    const input = makeInput({
      professionalContacts: [
        makeProfessionalContact({
          last_contact_date: "2026-04-01", // 54 days ago
          contact_frequency_days: 30, // due after 30 days = Apr 30, overdue
          status: "active",
        }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.overview.overdue_contacts).toBe(1);
  });

  it("does not count contacts that are not yet due", () => {
    const input = makeInput({
      professionalContacts: [
        makeProfessionalContact({
          last_contact_date: "2026-05-20", // 5 days ago
          contact_frequency_days: 30, // not due until Jun 19
          status: "active",
        }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.overview.overdue_contacts).toBe(0);
  });

  it("counts LAC reviews in this year (365-day window)", () => {
    const input = makeInput({
      lacReviews: [
        makeLACReview({ id: "r1", date: "2026-04-25" }), // within 365 days
        makeLACReview({ id: "r2", date: "2025-06-01" }), // within 365 days (just under a year)
        makeLACReview({ id: "r3", date: "2025-05-01" }), // over 365 days ago, excluded
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.overview.lac_reviews_this_year).toBe(2);
  });

  it("calculates child participation rate", () => {
    const input = makeInput({
      lacReviews: [
        makeLACReview({ id: "r1", child_participated: true, date: "2026-04-01" }),
        makeLACReview({ id: "r2", child_participated: false, date: "2026-03-01" }),
        makeLACReview({ id: "r3", child_participated: true, date: "2026-02-01" }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.overview.child_participation_rate).toBe(67); // 2/3
  });

  it("calculates home report submission rate", () => {
    const input = makeInput({
      lacReviews: [
        makeLACReview({ id: "r1", home_report_submitted: true, date: "2026-04-01" }),
        makeLACReview({ id: "r2", home_report_submitted: false, date: "2026-03-01" }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.overview.home_report_rate).toBe(50);
  });

  it("counts meetings this quarter (90-day window)", () => {
    const input = makeInput({
      meetings: [
        makeMeeting({ id: "m1", date: "2026-05-01" }), // 24 days ago
        makeMeeting({ id: "m2", date: "2026-03-01" }), // 85 days ago
        makeMeeting({ id: "m3", date: "2026-02-01" }), // 113 days ago — outside
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.overview.meetings_this_quarter).toBe(2);
  });

  it("calculates follow-up completion rate", () => {
    const input = makeInput({
      meetings: [
        makeMeeting({ id: "m1", date: "2026-05-01", actions_count: 4, actions_completed: 2 }),
        makeMeeting({ id: "m2", date: "2026-04-01", actions_count: 6, actions_completed: 6 }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.overview.follow_up_completion_rate).toBe(80); // 8/10
  });

  it("returns 0 rates for empty data", () => {
    const result = computeMultiAgencyIntelligence(makeInput());
    expect(result.overview.child_participation_rate).toBe(0);
    expect(result.overview.home_report_rate).toBe(0);
    expect(result.overview.follow_up_completion_rate).toBe(0);
    expect(result.overview.meetings_this_quarter).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeMultiAgencyIntelligence — Meeting Types
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMultiAgencyIntelligence — meeting_types", () => {
  it("groups meetings by type with labels", () => {
    const input = makeInput({
      meetings: [
        makeMeeting({ id: "m1", meeting_type: "lac_review", date: "2026-05-01", actions_count: 3, actions_completed: 3 }),
        makeMeeting({ id: "m2", meeting_type: "lac_review", date: "2026-04-15", actions_count: 2, actions_completed: 1 }),
        makeMeeting({ id: "m3", meeting_type: "pep", date: "2026-04-20", actions_count: 4, actions_completed: 4 }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.meeting_types).toHaveLength(2);
    const lacType = result.meeting_types.find((t) => t.meeting_type === "lac_review");
    expect(lacType?.type_label).toBe("LAC Review");
    expect(lacType?.count).toBe(2);
    expect(lacType?.actions_completion_rate).toBe(80); // 4/5
  });

  it("calculates 100% completion rate when all actions done", () => {
    const input = makeInput({
      meetings: [
        makeMeeting({ id: "m1", meeting_type: "pep", date: "2026-05-01", actions_count: 5, actions_completed: 5 }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const pep = result.meeting_types.find((t) => t.meeting_type === "pep");
    expect(pep?.actions_completion_rate).toBe(100);
  });

  it("returns 0% completion rate when no actions completed", () => {
    const input = makeInput({
      meetings: [
        makeMeeting({ id: "m1", meeting_type: "strategy", date: "2026-05-01", actions_count: 3, actions_completed: 0 }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const strat = result.meeting_types.find((t) => t.meeting_type === "strategy");
    expect(strat?.actions_completion_rate).toBe(0);
  });

  it("only includes meetings from this quarter", () => {
    const input = makeInput({
      meetings: [
        makeMeeting({ id: "m1", meeting_type: "lac_review", date: "2026-05-01", actions_count: 2, actions_completed: 2 }),
        makeMeeting({ id: "m2", meeting_type: "lac_review", date: "2025-01-01", actions_count: 2, actions_completed: 0 }), // old
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.meeting_types).toHaveLength(1);
    expect(result.meeting_types[0].count).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeMultiAgencyIntelligence — Child Engagement
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMultiAgencyIntelligence — child_engagement", () => {
  it("calculates professional count per child", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1", name: "Alex" })],
      professionalContacts: [
        makeProfessionalContact({ id: "p1", child_id: "c1", professional_role: "social_worker", status: "active" }),
        makeProfessionalContact({ id: "p2", child_id: "c1", professional_role: "iro", status: "active" }),
        makeProfessionalContact({ id: "p3", child_id: "c1", professional_role: "camhs", status: "inactive" }), // excluded
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.child_engagement[0].professional_count).toBe(2);
  });

  it("calculates overdue contacts per child", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1" })],
      professionalContacts: [
        makeProfessionalContact({ id: "p1", child_id: "c1", last_contact_date: "2026-04-01", contact_frequency_days: 30, status: "active" }), // overdue
        makeProfessionalContact({ id: "p2", child_id: "c1", last_contact_date: "2026-05-20", contact_frequency_days: 30, status: "active" }), // ok
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.child_engagement[0].overdue_contacts).toBe(1);
  });

  it("gets last review date from most recent review", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1" })],
      lacReviews: [
        makeLACReview({ id: "r1", child_id: "c1", date: "2026-03-01", next_review_due: "2026-09-01" }),
        makeLACReview({ id: "r2", child_id: "c1", date: "2026-05-01", next_review_due: "2026-11-01" }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.child_engagement[0].last_review_date).toBe("2026-05-01");
    expect(result.child_engagement[0].next_review_due).toBe("2026-11-01");
  });

  it("returns null for last_review_date when no reviews exist", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1" })],
      lacReviews: [],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.child_engagement[0].last_review_date).toBeNull();
    expect(result.child_engagement[0].next_review_due).toBeNull();
  });

  it("calculates participation rate per child", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1" })],
      lacReviews: [
        makeLACReview({ id: "r1", child_id: "c1", child_participated: true }),
        makeLACReview({ id: "r2", child_id: "c1", child_participated: true }),
        makeLACReview({ id: "r3", child_id: "c1", child_participated: false }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.child_engagement[0].participation_rate).toBe(67); // 2/3
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeMultiAgencyIntelligence — Upcoming Reviews
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMultiAgencyIntelligence — upcoming_reviews", () => {
  it("includes reviews with next_review_due within 30 days", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1", name: "Alex" })],
      lacReviews: [
        makeLACReview({ id: "r1", child_id: "c1", next_review_due: "2026-06-10" }), // 16 days — within 30
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.upcoming_reviews).toHaveLength(1);
    expect(result.upcoming_reviews[0].child_name).toBe("Alex");
    expect(result.upcoming_reviews[0].days_until).toBe(16);
  });

  it("excludes reviews due more than 30 days out", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1" })],
      lacReviews: [
        makeLACReview({ id: "r1", child_id: "c1", next_review_due: "2026-10-01" }), // 129 days
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.upcoming_reviews).toHaveLength(0);
  });

  it("excludes reviews that are already overdue (negative days)", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1" })],
      lacReviews: [
        makeLACReview({ id: "r1", child_id: "c1", next_review_due: "2026-05-20" }), // 5 days ago
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.upcoming_reviews).toHaveLength(0);
  });

  it("sorts upcoming reviews by days_until ascending", () => {
    const input = makeInput({
      children: [
        makeChild({ id: "c1", name: "First" }),
        makeChild({ id: "c2", name: "Second" }),
      ],
      lacReviews: [
        makeLACReview({ id: "r1", child_id: "c1", next_review_due: "2026-06-20" }), // 26 days
        makeLACReview({ id: "r2", child_id: "c2", next_review_due: "2026-06-01" }), // 7 days
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.upcoming_reviews[0].child_name).toBe("Second");
    expect(result.upcoming_reviews[1].child_name).toBe("First");
  });

  it("includes iro_name and home_report_submitted", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1" })],
      lacReviews: [
        makeLACReview({
          id: "r1",
          child_id: "c1",
          next_review_due: "2026-06-01",
          iro_name: "David Wright",
          home_report_submitted: false,
        }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.upcoming_reviews[0].iro_name).toBe("David Wright");
    expect(result.upcoming_reviews[0].home_report_submitted).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeMultiAgencyIntelligence — Alerts
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMultiAgencyIntelligence — alerts", () => {
  it("raises critical alert for child without social worker", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1", name: "Alex" })],
      professionalContacts: [
        makeProfessionalContact({ child_id: "c1", professional_role: "iro", status: "active" }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const critical = result.alerts.filter((a) => a.severity === "critical");
    expect(critical).toHaveLength(1);
    expect(critical[0].message).toContain("Alex");
    expect(critical[0].message).toContain("social worker");
  });

  it("does not raise critical alert when child has active social worker", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1" })],
      professionalContacts: [
        makeProfessionalContact({ child_id: "c1", professional_role: "social_worker", status: "active" }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const critical = result.alerts.filter((a) => a.severity === "critical");
    expect(critical).toHaveLength(0);
  });

  it("does not count inactive social worker for critical alert", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1", name: "Jordan" })],
      professionalContacts: [
        makeProfessionalContact({ child_id: "c1", professional_role: "social_worker", status: "inactive" }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const critical = result.alerts.filter((a) => a.severity === "critical");
    expect(critical).toHaveLength(1);
    expect(critical[0].message).toContain("Jordan");
  });

  it("raises high alert for home report not submitted within 5 days of review", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1", name: "Casey" })],
      lacReviews: [
        makeLACReview({
          child_id: "c1",
          next_review_due: "2026-05-28", // 3 days from today
          home_report_submitted: false,
        }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const high = result.alerts.filter((a) => a.severity === "high");
    expect(high.some((a) => a.message.includes("Home report") && a.message.includes("Casey"))).toBe(true);
  });

  it("does not raise high alert for home report if submitted", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1" })],
      lacReviews: [
        makeLACReview({
          child_id: "c1",
          next_review_due: "2026-05-28",
          home_report_submitted: true,
        }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const homeReportAlerts = result.alerts.filter((a) => a.message.includes("Home report"));
    expect(homeReportAlerts).toHaveLength(0);
  });

  it("raises high alert for overdue LAC review", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1", name: "Jordan" })],
      lacReviews: [
        makeLACReview({
          child_id: "c1",
          next_review_due: "2026-05-20", // 5 days ago
        }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const high = result.alerts.filter((a) => a.severity === "high");
    expect(high.some((a) => a.message.includes("overdue") && a.message.includes("Jordan"))).toBe(true);
  });

  it("raises medium alert for overdue professional contact", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1", name: "Jordan" })],
      professionalContacts: [
        makeProfessionalContact({
          child_id: "c1",
          professional_role: "camhs",
          name: "Dr Hughes",
          last_contact_date: "2026-04-01",
          contact_frequency_days: 28,
          status: "active",
        }),
        makeProfessionalContact({ child_id: "c1", professional_role: "social_worker", status: "active" }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const medium = result.alerts.filter((a) => a.severity === "medium");
    expect(medium.some((a) => a.message.includes("CAMHS") && a.message.includes("Jordan"))).toBe(true);
  });

  it("raises medium alert when follow-up completion rate below 70%", () => {
    const input = makeInput({
      meetings: [
        makeMeeting({ id: "m1", date: "2026-05-01", actions_count: 10, actions_completed: 5 }), // 50%
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const medium = result.alerts.filter((a) => a.severity === "medium");
    expect(medium.some((a) => a.message.includes("follow-up completion rate"))).toBe(true);
  });

  it("does not raise medium alert when completion rate is 70% or above", () => {
    const input = makeInput({
      meetings: [
        makeMeeting({ id: "m1", date: "2026-05-01", actions_count: 10, actions_completed: 7 }), // 70%
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const completionAlerts = result.alerts.filter((a) => a.message.includes("follow-up completion rate"));
    expect(completionAlerts).toHaveLength(0);
  });

  it("raises low alert for meeting with no documented actions", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1", name: "Alex" })],
      meetings: [
        makeMeeting({ id: "m1", meeting_type: "pep", date: "2026-05-01", child_id: "c1", actions_count: 0, actions_completed: 0 }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const low = result.alerts.filter((a) => a.severity === "low");
    expect(low.some((a) => a.message.includes("no documented actions") && a.message.includes("Alex"))).toBe(true);
  });

  it("does not raise low alert when meeting has actions", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1" })],
      meetings: [
        makeMeeting({ id: "m1", date: "2026-05-01", child_id: "c1", actions_count: 2, actions_completed: 1 }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const low = result.alerts.filter((a) => a.severity === "low");
    expect(low.filter((a) => a.message.includes("no documented actions"))).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeMultiAgencyIntelligence — Insights
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMultiAgencyIntelligence — insights", () => {
  it("generates critical insight when children missing social worker", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1" }), makeChild({ id: "c2" })],
      professionalContacts: [
        makeProfessionalContact({ child_id: "c1", professional_role: "social_worker", status: "active" }),
        // c2 has no social worker
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const critical = result.insights.filter((i) => i.severity === "critical");
    expect(critical).toHaveLength(1);
    expect(critical[0].text).toContain("1 child missing allocated social worker");
  });

  it("uses plural 'children' when multiple missing SW", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1" }), makeChild({ id: "c2" })],
      professionalContacts: [], // none
    });
    const result = computeMultiAgencyIntelligence(input);
    const critical = result.insights.filter((i) => i.severity === "critical");
    expect(critical[0].text).toContain("2 children missing");
  });

  it("generates warning insight for multiple overdue contacts", () => {
    const input = makeInput({
      professionalContacts: [
        makeProfessionalContact({ id: "p1", last_contact_date: "2026-03-01", contact_frequency_days: 30, status: "active" }),
        makeProfessionalContact({ id: "p2", last_contact_date: "2026-03-01", contact_frequency_days: 28, status: "active" }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const warnings = result.insights.filter((i) => i.severity === "warning");
    expect(warnings.some((w) => w.text.includes("2 professional contacts overdue"))).toBe(true);
  });

  it("generates warning insight for single overdue contact", () => {
    const input = makeInput({
      professionalContacts: [
        makeProfessionalContact({ id: "p1", last_contact_date: "2026-03-01", contact_frequency_days: 30, status: "active" }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const warnings = result.insights.filter((i) => i.severity === "warning");
    expect(warnings.some((w) => w.text.includes("1 professional contact overdue"))).toBe(true);
  });

  it("generates warning insight for home report rate below 100%", () => {
    const input = makeInput({
      lacReviews: [
        makeLACReview({ id: "r1", home_report_submitted: true, date: "2026-04-01" }),
        makeLACReview({ id: "r2", home_report_submitted: false, date: "2026-03-01" }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const warnings = result.insights.filter((i) => i.severity === "warning");
    expect(warnings.some((w) => w.text.includes("Home report submission rate at 50%"))).toBe(true);
  });

  it("generates positive insight when all children have SW and IRO", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1" }), makeChild({ id: "c2" })],
      professionalContacts: [
        makeProfessionalContact({ id: "p1", child_id: "c1", professional_role: "social_worker", status: "active" }),
        makeProfessionalContact({ id: "p2", child_id: "c1", professional_role: "iro", status: "active" }),
        makeProfessionalContact({ id: "p3", child_id: "c2", professional_role: "social_worker", status: "active" }),
        makeProfessionalContact({ id: "p4", child_id: "c2", professional_role: "iro", status: "active" }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((p) => p.text.includes("All children have allocated social workers and IROs"))).toBe(true);
  });

  it("does not generate positive SW/IRO insight when one child missing IRO", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1" }), makeChild({ id: "c2" })],
      professionalContacts: [
        makeProfessionalContact({ id: "p1", child_id: "c1", professional_role: "social_worker", status: "active" }),
        makeProfessionalContact({ id: "p2", child_id: "c1", professional_role: "iro", status: "active" }),
        makeProfessionalContact({ id: "p3", child_id: "c2", professional_role: "social_worker", status: "active" }),
        // c2 missing IRO
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((p) => p.text.includes("All children have allocated social workers and IROs"))).toBe(false);
  });

  it("generates positive insight for 100% child participation", () => {
    const input = makeInput({
      lacReviews: [
        makeLACReview({ id: "r1", child_participated: true, date: "2026-04-01" }),
        makeLACReview({ id: "r2", child_participated: true, date: "2026-03-01" }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((p) => p.text.includes("100% child participation"))).toBe(true);
  });

  it("does not generate positive participation insight when below 100%", () => {
    const input = makeInput({
      lacReviews: [
        makeLACReview({ id: "r1", child_participated: true, date: "2026-04-01" }),
        makeLACReview({ id: "r2", child_participated: false, date: "2026-03-01" }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((p) => p.text.includes("100% child participation"))).toBe(false);
  });

  it("generates positive insight when all meeting actions completed", () => {
    const input = makeInput({
      meetings: [
        makeMeeting({ id: "m1", date: "2026-05-01", actions_count: 3, actions_completed: 3 }),
        makeMeeting({ id: "m2", date: "2026-04-15", actions_count: 2, actions_completed: 2 }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((p) => p.text.includes("All meeting actions completed on time"))).toBe(true);
  });

  it("does not generate positive actions insight when some incomplete", () => {
    const input = makeInput({
      meetings: [
        makeMeeting({ id: "m1", date: "2026-05-01", actions_count: 3, actions_completed: 2 }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((p) => p.text.includes("All meeting actions completed"))).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeMultiAgencyIntelligence — Edge Cases
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMultiAgencyIntelligence — edge cases", () => {
  it("handles empty input gracefully", () => {
    const input: MultiAgencyEngineInput = {
      lacReviews: [],
      professionalContacts: [],
      meetings: [],
      children: [],
      staff: [],
      today: TODAY,
    };
    const result = computeMultiAgencyIntelligence(input);
    expect(result.overview.total_professionals).toBe(0);
    expect(result.overview.total_children).toBe(0);
    expect(result.meeting_types).toHaveLength(0);
    expect(result.child_engagement).toHaveLength(0);
    expect(result.upcoming_reviews).toHaveLength(0);
    expect(result.alerts).toHaveLength(0);
    expect(result.insights).toHaveLength(0);
  });

  it("defaults today to current date when not provided", () => {
    const input: MultiAgencyEngineInput = {
      lacReviews: [],
      professionalContacts: [],
      meetings: [],
      children: [makeChild()],
      staff: [],
      // no today parameter
    };
    const result = computeMultiAgencyIntelligence(input);
    expect(result.overview.total_children).toBe(1);
  });

  it("handles review due exactly today as upcoming (0 days)", () => {
    const input = makeInput({
      children: [makeChild({ id: "c1", name: "Alex" })],
      lacReviews: [
        makeLACReview({ child_id: "c1", next_review_due: "2026-05-25" }), // today = 0 days
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.upcoming_reviews).toHaveLength(1);
    expect(result.upcoming_reviews[0].days_until).toBe(0);
  });

  it("handles contact due exactly today as not overdue", () => {
    const input = makeInput({
      professionalContacts: [
        makeProfessionalContact({
          last_contact_date: "2026-04-25", // 30 days ago
          contact_frequency_days: 30, // due today
          status: "active",
        }),
      ],
    });
    const result = computeMultiAgencyIntelligence(input);
    expect(result.overview.overdue_contacts).toBe(0);
  });

  it("does not generate positive SW/IRO insight when no children", () => {
    const input = makeInput({ children: [] });
    const result = computeMultiAgencyIntelligence(input);
    const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("social workers"));
    expect(positive).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Chamberlain House — Full Integration Test
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMultiAgencyIntelligence — Chamberlain House integration", () => {
  const result = computeMultiAgencyIntelligence(makeOakInput());

  it("overview: counts 9 active professionals", () => {
    expect(result.overview.total_professionals).toBe(9);
  });

  it("overview: all 3 children have social worker", () => {
    expect(result.overview.children_with_social_worker).toBe(3);
  });

  it("overview: total children is 3", () => {
    expect(result.overview.total_children).toBe(3);
  });

  it("overview: identifies 2 overdue contacts (Jordan CAMHS + YOT)", () => {
    expect(result.overview.overdue_contacts).toBe(2);
  });

  it("overview: counts 3 LAC reviews this year", () => {
    expect(result.overview.lac_reviews_this_year).toBe(3);
  });

  it("overview: 100% child participation rate", () => {
    expect(result.overview.child_participation_rate).toBe(100);
  });

  it("overview: 67% home report rate (Casey missing)", () => {
    expect(result.overview.home_report_rate).toBe(67);
  });

  it("overview: 5 meetings this quarter", () => {
    expect(result.overview.meetings_this_quarter).toBe(5);
  });

  it("overview: follow-up completion rate is 69%", () => {
    // Total actions: 3+3+2+3+2 = 13, completed: 1+2+2+2+2 = 9, rate = 69%
    expect(result.overview.follow_up_completion_rate).toBe(69);
  });

  it("meeting_types: has 4 different meeting types", () => {
    expect(result.meeting_types).toHaveLength(4);
  });

  it("meeting_types: lac_review has 2 meetings", () => {
    const lac = result.meeting_types.find((t) => t.meeting_type === "lac_review");
    expect(lac?.count).toBe(2);
  });

  it("child_engagement: Alex has 3 professionals", () => {
    const alex = result.child_engagement.find((c) => c.child_id === "yp_alex");
    expect(alex?.professional_count).toBe(3);
  });

  it("child_engagement: Jordan has 2 overdue contacts", () => {
    const jordan = result.child_engagement.find((c) => c.child_id === "yp_jordan");
    expect(jordan?.overdue_contacts).toBe(2);
  });

  it("upcoming_reviews: none within 30 days (all >120 days out)", () => {
    expect(result.upcoming_reviews).toHaveLength(0);
  });

  it("alerts: no critical alerts (all have SW)", () => {
    const critical = result.alerts.filter((a) => a.severity === "critical");
    expect(critical).toHaveLength(0);
  });

  it("alerts: has medium alerts for overdue contacts", () => {
    const medium = result.alerts.filter((a) => a.severity === "medium");
    expect(medium.some((a) => a.message.includes("CAMHS"))).toBe(true);
    expect(medium.some((a) => a.message.includes("YOT"))).toBe(true);
  });

  it("alerts: has medium alert for completion rate below 70%", () => {
    const medium = result.alerts.filter((a) => a.severity === "medium");
    expect(medium.some((a) => a.message.includes("69%"))).toBe(true);
  });

  it("insights: warning for overdue contacts", () => {
    const warnings = result.insights.filter((i) => i.severity === "warning");
    expect(warnings.some((w) => w.text.includes("2 professional contacts overdue"))).toBe(true);
  });

  it("insights: warning for home report rate below 100%", () => {
    const warnings = result.insights.filter((i) => i.severity === "warning");
    expect(warnings.some((w) => w.text.includes("Home report submission rate at 67%"))).toBe(true);
  });

  it("insights: positive for all children having SW and IRO", () => {
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((p) => p.text.includes("All children have allocated social workers and IROs"))).toBe(true);
  });

  it("insights: positive for 100% participation", () => {
    const positive = result.insights.filter((i) => i.severity === "positive");
    expect(positive.some((p) => p.text.includes("100% child participation"))).toBe(true);
  });
});
