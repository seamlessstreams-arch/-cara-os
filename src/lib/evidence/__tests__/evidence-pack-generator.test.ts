import { describe, it, expect } from "vitest";
import type { YoungPerson } from "@/types";
import {
  computeInspectionEvidencePack,
  type EvidencePackInput,
} from "../evidence-pack-generator";

// ─────────────────────────────────────────────────────────────────────────────
// Focus: the 23/06 Practice Intelligence Update evidence sections (rights &
// restriction, learning from incidents, child safety planning, protective
// relationships) that fold the new modules into the Inspection Evidence Pack.
// ─────────────────────────────────────────────────────────────────────────────

const TODAY = "2026-06-23";

function emptyInput(): EvidencePackInput {
  return {
    today: TODAY,
    home_id: "home_oak",
    home_name: "Oak House",
    period_from: "2026-01-01",
    period_to: TODAY,
    generated_by: "test",
    youngPeople: [],
    staff: [],
    careForms: [],
    riskAssessments: [],
    incidents: [],
    missingEpisodes: [],
    exploitationScreenings: [],
    keyWorkingSessions: [],
    keyworkerSessions: [],
    educationRecords: [],
    healthAssessments: [],
    dentalRecords: [],
    mentalHealthCheckIns: [],
    annualHealthAssessments: [],
    familyTimeSessions: [],
    contactPlans: [],
    multiAgencyMeetings: [],
    lacReviews: [],
    supervisions: [],
    audits: [],
    qaAuditRecords: [],
    caseFileAudits: [],
    tasks: [],
    dailyLog: [],
    behaviourLog: [],
    restraints: [],
    significantEvents: [],
    notifiableEvents: [],
    outcomeTargets: [],
    outcomeReviews: [],
    trainingRecords: [],
    medications: [],
    medicationAdministrations: [],
    independenceSkillsRecords: [],
    disclosures: [],
    safeguardingReferrals: [],
    complaintOutcomeRecords: [],
    chronology: [],
    handovers: [],
    therapeuticChildImpact: [],
    ypFeedback: [],
    advocacyRecords: [],
    participationEntries: [],
    improvementObjectives: [],
    lessonsLearned: [],
    restrictionReviews: [],
    postIncidentReflections: [],
    stayingSafePlans: [],
    relationshipEntries: [],
  };
}

/** Fixtures supply only the fields the assertion under test exercises.
 *  `Partial<T>` still checks every field name and value against the real
 *  type, so a typo or a value outside a union fails here just as it would
 *  in production — only the irrelevant required fields are omitted. */
function fx<T>(o: NoInfer<Partial<T>>): T {
  return o as T;
}

const ALEX = fx<YoungPerson>({ id: "yp_alex", first_name: "Alex", status: "current" });
const JORDAN = fx<YoungPerson>({ id: "yp_jordan", first_name: "Jordan", status: "current" });

function sectionById(input: EvidencePackInput, id: string) {
  return computeInspectionEvidencePack(input).sections.find((s) => s.id === id);
}

describe("evidence pack — practice-intelligence module sections", () => {
  it("includes all four new module sections", () => {
    const pack = computeInspectionEvidencePack(emptyInput());
    const ids = pack.sections.map((s) => s.id);
    expect(ids).toContain("rights_and_restriction");
    expect(ids).toContain("learning_from_incidents");
    expect(ids).toContain("child_safety_planning");
    expect(ids).toContain("protective_relationships");
  });

  it("rates a section not_assessed (no score) when its module has no records", () => {
    const rights = sectionById(emptyInput(), "rights_and_restriction");
    expect(rights?.items).toHaveLength(0);
    expect(rights?.score).toBeUndefined();
    expect(rights?.rating).toBe("not_assessed");
  });

  it("scores a restriction review on quality: child voice + least-restrictive + proportionality + review date", () => {
    const input = emptyInput();
    input.youngPeople = [ALEX];
    input.restrictionReviews = [
      fx({
        id: "rr_strong",
        child_id: "yp_alex",
        review_date: "2026-06-01",
        restriction_kind: "surveillance_monitoring",
        restriction_description: "Night-time door sensor",
        child_wishes_feelings: "Alex says it helps him feel safe at night.",
        least_restrictive_alternatives: "Checks every 30 mins considered but more intrusive.",
        proportionality_reasoning: "Proportionate to the night-time risk.",
        best_interests_reasoning: "In Alex's best interests.",
        next_review_date: "2026-09-01",
        manager_decision: "approved",
        created_at: "2026-06-01T08:00:00.000Z",
      }),
    ];
    const rights = sectionById(input, "rights_and_restriction");
    expect(rights?.items).toHaveLength(1);
    expect(rights?.score).toBe(100);
    expect(rights?.items[0].summary).toContain("wishes & feelings recorded: yes");
  });

  it("penalises a thin restriction review (no child voice, no alternatives)", () => {
    const input = emptyInput();
    input.youngPeople = [ALEX];
    input.restrictionReviews = [
      fx({
        id: "rr_thin",
        child_id: "yp_alex",
        review_date: "2026-06-01",
        restriction_kind: "contact_restriction",
        restriction_description: "Phone removed overnight",
        child_wishes_feelings: "",
        least_restrictive_alternatives: "",
        proportionality_reasoning: "",
        best_interests_reasoning: "",
        next_review_date: null,
        manager_decision: "approved",
        created_at: "2026-06-01T08:00:00.000Z",
      }),
    ];
    const rights = sectionById(input, "rights_and_restriction");
    expect(rights?.score).toBe(0);
  });

  it("reflects post-incident reflection stage completion in the learning section", () => {
    const input = emptyInput();
    input.youngPeople = [ALEX];
    input.postIncidentReflections = [
      fx({
        id: "pir_1",
        incident_id: "inc_001",
        child_id: "yp_alex",
        incident_date: "2026-06-10",
        severity: "high",
        status: "in_progress",
        stages: [
          fx({ key: "incident_recorded", status: "completed" }),
          fx({ key: "immediate_safety", status: "completed" }),
          fx({ key: "staff_reflection", status: "not_started" }),
          fx({ key: "child_debrief", status: "not_started" }),
        ],
        created_at: "2026-06-10T08:00:00.000Z",
      }),
    ];
    const learning = sectionById(input, "learning_from_incidents");
    expect(learning?.items).toHaveLength(1);
    // 2 of 4 stages complete → 50
    expect(learning?.score).toBe(50);
    expect(learning?.items[0].summary).toContain("2/4 stages complete");
  });

  it("measures safety-planning coverage across current children", () => {
    const input = emptyInput();
    input.youngPeople = [ALEX, JORDAN];
    input.stayingSafePlans = [
      fx({
        id: "ssp_alex",
        child_id: "yp_alex",
        preferred_name: "Alex",
        status: "active",
        manager_approved: true,
        child_contribution: "Alex helped write this.",
        approved_at: "2026-06-01T08:00:00.000Z",
        created_at: "2026-05-01T08:00:00.000Z",
      }),
    ];
    const planning = sectionById(input, "child_safety_planning");
    // 1 of 2 children has an active plan → 50
    expect(planning?.score).toBe(50);
    expect(planning?.summary).toContain("1/2 children");
  });

  it("measures protective-relationship coverage (trusted-adult reach)", () => {
    const input = emptyInput();
    input.youngPeople = [ALEX, JORDAN];
    input.relationshipEntries = [
      fx({ id: "re1", child_id: "yp_alex", name: "Nan", category: "family_support", rating: "protective" }),
      fx({ id: "re2", child_id: "yp_alex", name: "Danny", category: "exploitation_risk", rating: "risk" }),
    ];
    const rels = sectionById(input, "protective_relationships");
    // Alex has a protective relationship; Jordan has none → 1 of 2 → 50
    expect(rels?.score).toBe(50);
    expect(rels?.items).toHaveLength(1);
    expect(rels?.items[0].summary).toContain("1 protective relationship(s), 1 flagged as a risk");
  });

  it("surfaces overdue restriction reviews and unapproved active plans as outstanding actions", () => {
    const input = emptyInput();
    input.youngPeople = [ALEX];
    input.restrictionReviews = [
      fx({
        id: "rr_overdue",
        child_id: "yp_alex",
        review_date: "2026-02-01",
        restriction_kind: "surveillance_monitoring",
        restriction_description: "Sensor",
        next_review_date: "2026-05-01", // before TODAY
        manager_decision: "approved",
        created_at: "2026-02-01T08:00:00.000Z",
      }),
    ];
    input.stayingSafePlans = [
      fx({
        id: "ssp_unapproved",
        child_id: "yp_alex",
        preferred_name: "Alex",
        status: "active",
        manager_approved: false,
        created_at: "2026-06-01T08:00:00.000Z",
        updated_at: "2026-06-01T08:00:00.000Z",
      }),
    ];
    const pack = computeInspectionEvidencePack(input);
    const actionIds = pack.outstanding_actions.map((a) => a.id);
    expect(actionIds).toContain("action_restriction_rr_overdue");
    expect(actionIds).toContain("action_safeplan_ssp_unapproved");
  });

  it("includes a Statement-of-Purpose & organisational-assurance section, not_assessed with no engine results", () => {
    const pack = computeInspectionEvidencePack(emptyInput());
    const sec = pack.sections.find(
      (s) => s.id === "sop_and_organisational_assurance",
    );
    expect(sec).toBeDefined();
    expect(sec?.items).toHaveLength(0);
    expect(sec?.score).toBeUndefined();
    expect(sec?.rating).toBe("not_assessed");
  });

  it("maps SoP areas + high org indicators to evidence and lets organisational pressure pull the score down (no false green)", () => {
    const input = emptyInput();
    input.sopRealityCheck = {
      generatedAt: TODAY,
      headline: "h",
      overallConfidence: "developing",
      areasStrong: 1,
      areasDeveloping: 0,
      areasLimited: 1,
      inspectionRisks: [
        { area: "Safeguarding & behaviour", label: "no current risk assessment", detail: "d" },
      ],
      areas: [
        { key: "clarity", label: "Clarity of service", strength: "strong", summary: "Strong.", evidence: [], gaps: [], inspectionRisk: false },
        { key: "safeguarding", label: "Safeguarding & behaviour", strength: "limited", summary: "Thin.", evidence: [], gaps: [{ label: "no current risk assessment", severity: "high", detail: "d" }], inspectionRisk: true },
      ],
    } as any;
    input.orgRisk = {
      generatedAt: TODAY,
      overallLevel: "high",
      headline: "Organisational risk is high.",
      indicators: [
        { key: "supervision", label: "Supervision overdue", value: "3", level: "high", detail: "3 overdue" },
        { key: "agency", label: "Agency / bank mix", value: "10%", level: "low", detail: "ok" },
      ],
      correlations: [],
      trend: [],
    } as any;
    const sec = sectionById(input, "sop_and_organisational_assurance")!;
    const ids = sec.items.map((i) => i.id);
    // 2 SoP areas + org overall + 1 high indicator (the "low" indicator is filtered out)
    expect(sec.items).toHaveLength(4);
    expect(ids).toContain("ev_sop_safeguarding");
    expect(ids).toContain("ev_org_overall");
    expect(ids).toContain("ev_org_supervision");
    expect(ids).not.toContain("ev_org_agency");
    // a "limited" SoP area is flagged high risk
    expect(sec.items.find((i) => i.id === "ev_sop_safeguarding")?.risk_level).toBe("high");
    // sopScore = (1*100 + 0*50) / 2 = 50; high org penalty (15) → 35 → inadequate
    expect(sec.score).toBe(35);
    expect(sec.rating).toBe("inadequate");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// These sections read fields the young-person record does not carry
// (`date_of_placement`, `age`) and an education type spelled `"pep"` rather
// than `"pep_meeting"`, so the pack asserted a 0-day placement for every child
// and reported that no child had a PEP. An `any[]` parameter hid all of it.
// ─────────────────────────────────────────────────────────────────────────────

describe("placement history", () => {
  it("counts the days from the recorded placement start", () => {
    const input = emptyInput();
    input.youngPeople = [
      fx<YoungPerson>({
        id: "yp_alex",
        first_name: "Alex",
        status: "current",
        placement_start: "2026-06-13",
      }),
    ];
    const section = sectionById(input, "placement_history");
    expect(section?.items[0].title).toContain("10 days");
    expect(section?.items[0].summary).toBe("Placed for 10 days.");
  });

  it("says the start date is missing rather than claiming a 0-day placement", () => {
    const input = emptyInput();
    input.youngPeople = [ALEX]; // no placement_start on file
    const section = sectionById(input, "placement_history");
    expect(section?.items[0].title).not.toContain("0 days");
    expect(section?.items[0].summary).toContain("not recorded");
  });

  it("reports the child's age from date of birth, not as unknown", () => {
    const input = emptyInput();
    input.youngPeople = [
      fx<YoungPerson>({
        id: "yp_alex",
        first_name: "Alex",
        status: "current",
        date_of_birth: "2011-01-01",
      }),
    ];
    const section = sectionById(input, "child_overview");
    expect(section?.items[0].summary).toContain("Age 15");
  });
});

describe("education notes", () => {
  it("recognises a pep_meeting record as a PEP", () => {
    const input = emptyInput();
    input.youngPeople = [ALEX];
    input.educationRecords = [
      fx({
        id: "edu1",
        child_id: "yp_alex",
        record_type: "pep_meeting",
        date: "2026-06-01",
      }),
    ];
    const section = sectionById(input, "education_notes");
    // one of one child has a PEP — previously this read as none
    expect(section?.summary).toContain("100%");
  });
});

describe("typed collections (dead-read fixes)", () => {
  it("reports the recorded risk level, not 'unknown'", () => {
    const input = emptyInput();
    input.riskAssessments = [
      {
        id: "ra-1",
        child_id: "yp-1",
        domain: "self_harm",
        current_level: "high",
        previous_level: "medium",
        trend: "increasing",
        status: "current",
        assessed_by: "Alex Morgan",
        assessed_date: "2026-06-01",
        review_date: "2026-09-01",
        triggers: [],
        indicators: [],
        mitigations: [],
        contingency_plan: "",
        child_views: "",
        history_notes: "",
        linked_incidents: [],
        home_id: "home_oak",
        created_at: "2026-06-01T10:00:00Z",
      },
    ];
    const pack = computeInspectionEvidencePack(input);
    const allItems = pack.sections.flatMap((s) => s.items);
    const ra = allItems.find((i) => i.linked_record_id === "ra-1");
    expect(ra).toBeTruthy();
    expect(ra!.summary).toContain("high");
    expect(ra!.summary).not.toContain("unknown");
    expect(ra!.tags).toContain("high");
  });
});

describe("typed collections (sweep 4)", () => {
  it("reports a disclosure's type, referral state and severity from the real fields", () => {
    const input = emptyInput();
    input.disclosures = [
      {
        id: "disc-1",
        child_id: "yp-1",
        disclosure_date: "2026-06-02",
        disclosure_time: "14:00",
        location: "Kitchen",
        context_of_disclosure: "During cooking",
        heard_by: "Alex Morgan",
        disclosure_summary: "Summary",
        disclosure_type: "physical_abuse" as never,
        child_words_used: "",
        staff_response_at_time: "",
        reassurance_given: "",
        questions_asked: "none" as never,
        disclosure_severity: "critical" as never,
        immediate_actions_taken: [],
        reported_to_dsl: true,
        reported_to_dsl_date: "2026-06-02",
        reported_to_lado: false,
        reported_to_police: false,
        referrals_made: ["MASH"],
        child_informed_of_actions: true,
        child_given_agency: "",
        support_provided_to_child: [],
        staff_debrief: false,
        parallel_process_noted: "",
        status: "open" as never,
        created_at: "2026-06-05T10:00:00Z",
      },
    ];
    const pack = computeInspectionEvidencePack(input);
    const item = pack.sections.flatMap((s) => s.items).find((i) => i.linked_record_id === "disc-1");
    expect(item).toBeTruthy();
    expect(item!.title).toContain("physical_abuse");
    expect(item!.summary).toContain("yes");
    expect(item!.date).toBe("2026-06-02");
  });
});

describe("typed collections (sweep 5)", () => {
  it("summarises family time from the real supervision and safety fields", () => {
    const input = emptyInput();
    input.familyTimeSessions = [
      {
        id: "ft-1",
        child_id: "yp-1",
        date: "2026-06-03",
        time: "14:00",
        duration_minutes: 60,
        location: "Contact centre",
        family_member: "mother" as never,
        family_member_name: "Sam",
        supervised_by: "Alex Morgan",
        supervision_level: "supervised" as never,
        child_presentation_before: "settled",
        child_presentation_during: "engaged",
        child_presentation_after: "settled",
        interactions_observed: "",
        warmth_affection_shown: "",
        boundary_issues: "",
        concerns_raised: "",
        positive_observations: "",
        child_voice_after: "",
        parent_engagement: "",
        gifts_exchanged: "",
        food_shared_who: "",
        was_it_safe: "yes" as never,
        incidents_during: "",
        recommendations_for_next: "",
        report_sent_to_sw: false,
        report_sent_date: "",
        created_at: "2026-06-03T15:00:00Z",
      } as never,
    ];
    const pack = computeInspectionEvidencePack(input);
    const item = pack.sections.flatMap((s) => s.items).find((i) => i.linked_record_id === "ft-1");
    expect(item).toBeTruthy();
    expect(item!.title).toContain("Sam");
    expect(item!.summary).toContain("supervised");
    expect(item!.summary).not.toContain("not assessed");
  });
});
