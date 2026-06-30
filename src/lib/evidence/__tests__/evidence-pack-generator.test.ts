import { describe, it, expect } from "vitest";
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

const ALEX = { id: "yp_alex", name: "Alex", status: "current" };
const JORDAN = { id: "yp_jordan", name: "Jordan", status: "current" };

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
      {
        id: "rr_strong",
        child_id: "yp_alex",
        review_date: "2026-06-01",
        restriction_kind: "door_alarm",
        restriction_description: "Night-time door sensor",
        child_wishes_feelings: "Alex says it helps him feel safe at night.",
        least_restrictive_alternatives: "Checks every 30 mins considered but more intrusive.",
        proportionality_reasoning: "Proportionate to the night-time risk.",
        best_interests_reasoning: "In Alex's best interests.",
        next_review_date: "2026-09-01",
        manager_decision: "approved",
        created_at: "2026-06-01T08:00:00.000Z",
      },
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
      {
        id: "rr_thin",
        child_id: "yp_alex",
        review_date: "2026-06-01",
        restriction_kind: "phone_restriction",
        restriction_description: "Phone removed overnight",
        child_wishes_feelings: "",
        least_restrictive_alternatives: "",
        proportionality_reasoning: "",
        best_interests_reasoning: "",
        next_review_date: null,
        manager_decision: "approved",
        created_at: "2026-06-01T08:00:00.000Z",
      },
    ];
    const rights = sectionById(input, "rights_and_restriction");
    expect(rights?.score).toBe(0);
  });

  it("reflects post-incident reflection stage completion in the learning section", () => {
    const input = emptyInput();
    input.youngPeople = [ALEX];
    input.postIncidentReflections = [
      {
        id: "pir_1",
        incident_id: "inc_001",
        child_id: "yp_alex",
        incident_date: "2026-06-10",
        severity: "high",
        status: "in_progress",
        stages: [
          { key: "a", status: "completed" },
          { key: "b", status: "completed" },
          { key: "c", status: "not_started" },
          { key: "d", status: "not_started" },
        ],
        created_at: "2026-06-10T08:00:00.000Z",
      },
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
      {
        id: "ssp_alex",
        child_id: "yp_alex",
        preferred_name: "Alex",
        status: "active",
        manager_approved: true,
        child_contribution: "Alex helped write this.",
        approved_at: "2026-06-01T08:00:00.000Z",
        created_at: "2026-05-01T08:00:00.000Z",
      },
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
      { id: "re1", child_id: "yp_alex", name: "Nan", category: "family_support", rating: "protective" },
      { id: "re2", child_id: "yp_alex", name: "Danny", category: "exploitation_risk", rating: "risk" },
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
      {
        id: "rr_overdue",
        child_id: "yp_alex",
        review_date: "2026-02-01",
        restriction_kind: "door_alarm",
        restriction_description: "Sensor",
        next_review_date: "2026-05-01", // before TODAY
        manager_decision: "approved",
        created_at: "2026-02-01T08:00:00.000Z",
      },
    ];
    input.stayingSafePlans = [
      {
        id: "ssp_unapproved",
        child_id: "yp_alex",
        preferred_name: "Alex",
        status: "active",
        manager_approved: false,
        created_at: "2026-06-01T08:00:00.000Z",
        updated_at: "2026-06-01T08:00:00.000Z",
      },
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
