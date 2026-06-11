import { describe, it, expect } from "vitest";
import {
  computeSaferRecruitmentCommand,
  type CommandCandidateInput,
} from "../safer-recruitment-command-engine";
import type {
  CandidateProfile,
  CandidateCheck,
  CandidateReference,
  ConditionalOffer,
  CheckType,
} from "@/types/recruitment";

const TODAY = "2026-06-11";

function profile(over: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    id: "cand_t1",
    home_id: "home_oak",
    vacancy_id: null,
    first_name: "Tess",
    last_name: "Whitfield",
    preferred_name: null,
    email: "tess@example.com",
    phone: null,
    dob: null,
    current_address: null,
    source: "indeed",
    current_stage: "pre_start_checks",
    compliance_status: "in_progress",
    risk_level: "low",
    shortlisted: true,
    appointed: false,
    assigned_manager_id: "staff_olivia",
    cv_url: null,
    application_form_url: null,
    cover_letter_url: null,
    adjustments_requested: false,
    adjustments_notes: null,
    notes: null,
    created_at: "2026-05-20T09:00:00Z",
    updated_at: "2026-06-01T09:00:00Z",
    created_by: "staff_olivia",
    ...over,
  };
}

function check(type: CheckType, status: CandidateCheck["status"], over: Partial<CandidateCheck> = {}): CandidateCheck {
  return {
    id: `chk_${type}`,
    candidate_id: "cand_t1",
    check_type: type,
    status,
    required: true,
    owner_id: null,
    due_date: null,
    requested_at: null,
    received_at: null,
    verified_at: status === "verified" ? "2026-06-01T09:00:00Z" : null,
    verified_by: status === "verified" ? "staff_olivia" : null,
    concern_flag: false,
    concern_summary: null,
    override_used: false,
    override_reason: null,
    overridden_by: null,
    overridden_at: null,
    certificate_number: type === "enhanced_dbs" && status === "verified" ? "0012345678" : null,
    document_type: null,
    document_expiry: null,
    metadata: {},
    created_at: "2026-05-20T09:00:00Z",
    updated_at: "2026-06-01T09:00:00Z",
    ...over,
  };
}

function reference(over: Partial<CandidateReference> = {}): CandidateReference {
  return {
    id: `ref_${Math.abs(JSON.stringify(over).length)}`,
    candidate_id: "cand_t1",
    referee_name: "R. Manager",
    referee_role: "Registered Manager",
    organisation_name: "Previous Home Ltd",
    email: "rm@previoushome.example",
    phone: null,
    relationship_to_candidate: "Former line manager",
    is_most_recent_employer: false,
    requested_at: "2026-06-01T09:00:00Z",
    chased_at: null,
    received_at: null,
    structured_response: null,
    verbal_verification_completed: false,
    verbal_verified_by: null,
    verbal_verified_at: null,
    discrepancy_flag: false,
    discrepancy_notes: null,
    reliability_rating: null,
    status: "requested",
    created_at: "2026-06-01T09:00:00Z",
    updated_at: "2026-06-01T09:00:00Z",
    ...over,
  };
}

function offer(over: Partial<ConditionalOffer> = {}): ConditionalOffer {
  return {
    id: "off_t1",
    candidate_id: "cand_t1",
    status: "conditional_accepted",
    conditional_offer_sent_at: "2026-05-28T09:00:00Z",
    proposed_start_date: "2026-07-01",
    salary: 27000,
    hours: 37.5,
    probation_months: 6,
    conditions: ["Clear DBS", "2 satisfactory references"],
    exceptional_start: false,
    exceptional_start_approved_by: null,
    exceptional_start_rationale: null,
    exceptional_start_risk_mitigation: null,
    final_clearance_completed_at: null,
    final_clearance_by: null,
    created_at: "2026-05-28T09:00:00Z",
    updated_at: "2026-05-28T09:00:00Z",
    ...over,
  };
}

const ALL_VERIFIED: CandidateCheck[] = [
  check("enhanced_dbs", "verified"),
  check("barred_list", "verified"),
  check("right_to_work", "verified"),
  check("identity", "verified"),
  check("references", "verified"),
  check("employment_history", "verified"),
  check("medical_fitness", "verified"),
  check("professional_qualifications", "verified"),
];

const TWO_GOOD_REFS: CandidateReference[] = [
  reference({ id: "ref_1", status: "satisfactory", received_at: "2026-06-05T09:00:00Z", is_most_recent_employer: true }),
  reference({ id: "ref_2", status: "satisfactory", received_at: "2026-06-06T09:00:00Z", referee_name: "S. Lead", organisation_name: "Care Org" }),
];

function candidate(over: Partial<CommandCandidateInput> = {}): CommandCandidateInput {
  return {
    profile: profile(),
    vacancy: null,
    checks: ALL_VERIFIED,
    references: TWO_GOOD_REFS,
    employment_history: [],
    gaps: [],
    interviews: [],
    offer: offer(),
    ...over,
  };
}

function run(c: CommandCandidateInput) {
  return computeSaferRecruitmentCommand({ today: TODAY, candidates: [c] }).candidates[0];
}

describe("computeSaferRecruitmentCommand", () => {
  it("HARD RULE: a complete pack is NEVER 'cleared' without the human sign-off", () => {
    const r = run(candidate());
    expect(r.start_eligibility).not.toBe("cleared");
    expect(r.start_eligibility).toBe("conditional");
    expect(r.traffic_light).toBe("amber");
    expect(r.next_action.label).toMatch(/sign-off by the Registered Manager/i);
  });

  it("clears only when final clearance is recorded by a named human", () => {
    const r = run(candidate({ offer: offer({ final_clearance_by: "staff_olivia", final_clearance_completed_at: "2026-06-10T10:00:00Z" }) }));
    expect(r.start_eligibility).toBe("cleared");
    expect(r.traffic_light).toBe("green");
    expect(r.human_signoff?.by).toBe("staff_olivia");
  });

  it("DBS concern flag forces red and an urgent manager review action", () => {
    const checks = [...ALL_VERIFIED.filter((c) => c.check_type !== "enhanced_dbs"), check("enhanced_dbs", "verified", { concern_flag: true, concern_summary: "Disclosure to assess" })];
    const r = run(candidate({ checks }));
    expect(r.traffic_light).toBe("red");
    expect(r.start_eligibility).toBe("not_eligible");
    expect(r.next_action.urgency).toBe("urgent");
    expect(r.next_action.label).toMatch(/DBS concern/i);
  });

  it("missing most-recent-employer reference blocks at advanced stage", () => {
    const refs = [
      reference({ id: "ref_1", status: "satisfactory", is_most_recent_employer: false }),
      reference({ id: "ref_2", status: "satisfactory", is_most_recent_employer: false, referee_name: "Other" }),
    ];
    const r = run(candidate({ references: refs }));
    expect(r.traffic_light).toBe("red");
    expect(r.blockers.some((b) => b.code === "REF_NO_MOST_RECENT_EMPLOYER")).toBe(true);
  });

  it("exceptional start with all controls = supervised-only eligibility, never cleared", () => {
    const r = run(candidate({
      checks: [check("identity", "verified"), check("enhanced_dbs", "received"), check("right_to_work", "verified")],
      references: [reference({ id: "ref_1", status: "requested" }), reference({ id: "ref_2", status: "requested", referee_name: "B" })],
      offer: offer({
        exceptional_start: true,
        exceptional_start_approved_by: "staff_olivia",
        exceptional_start_rationale: "Staffing emergency",
        exceptional_start_risk_mitigation: "Supervised at all times; not in ratios; checks chased daily",
      }),
      profile: profile({ current_stage: "references_requested" }),
    }));
    expect(r.start_eligibility).toBe("exceptional_supervised_only");
    expect(r.exceptional_start?.active).toBe(true);
    expect(r.exceptional_start?.daily_review_due).toBe(true);
    expect(r.eligibility_reason).toMatch(/no sole charge/i);
  });

  it("exceptional start WITHOUT recorded approval or mitigation stays not-eligible with the gap named", () => {
    const r = run(candidate({
      checks: [check("identity", "verified"), check("enhanced_dbs", "received")],
      references: [],
      offer: offer({ exceptional_start: true }),
      profile: profile({ current_stage: "references_requested" }),
    }));
    expect(r.start_eligibility).toBe("not_eligible");
    expect(r.exceptional_start?.active).toBe(false);
    expect(r.exceptional_start?.missing.join(" ")).toMatch(/approval must be recorded/i);
    expect(r.next_action.urgency).toBe("urgent");
  });

  it("reference chase ladder escalates by days waiting", () => {
    const refs = [
      reference({ id: "ref_a", requested_at: "2026-06-10T09:00:00Z" }), // 1 day → awaiting
      reference({ id: "ref_b", requested_at: "2026-06-08T09:00:00Z", referee_name: "B" }), // 3 days → remind_48h
      reference({ id: "ref_c", requested_at: "2026-06-05T09:00:00Z", referee_name: "C" }), // 6 days → second_reminder
      reference({ id: "ref_d", requested_at: "2026-06-03T09:00:00Z", referee_name: "D" }), // 8 days → escalate
      reference({ id: "ref_e", requested_at: "2026-05-30T09:00:00Z", referee_name: "E" }), // 12 days → alternative
    ];
    const r = run(candidate({ references: refs, profile: profile({ current_stage: "references_requested" }) }));
    const byId = Object.fromEntries(r.reference_chases.map((c) => [c.reference_id, c.state]));
    expect(byId.ref_a).toBe("awaiting");
    expect(byId.ref_b).toBe("remind_48h");
    expect(byId.ref_c).toBe("second_reminder");
    expect(byId.ref_d).toBe("escalate_manager");
    expect(byId.ref_e).toBe("suggest_alternative");
  });

  it("staff-file index marks the pack honestly and missing evidence explains why", () => {
    const r = run(candidate({ references: [reference({ id: "ref_1", status: "requested" })], checks: [check("identity", "verified")] }));
    const index = Object.fromEntries(r.staff_file_index.map((f) => [f.key, f.status]));
    expect(index.identity).toBe("on_file");
    expect(index.dbs).toBe("missing");
    expect(index.signoff).toBe("missing");
    expect(r.missing_evidence.length).toBeGreaterThan(0);
    expect(r.missing_evidence.every((m) => m.why_it_matters.length > 0)).toBe(true);
  });

  it("withdrawn and appointed candidates are excluded; summary counts the rest", () => {
    const result = computeSaferRecruitmentCommand({
      today: TODAY,
      candidates: [
        candidate(),
        candidate({ profile: profile({ id: "cand_t2", current_stage: "withdrawn" }) }),
        candidate({ profile: profile({ id: "cand_t3", first_name: "Cleared" }), offer: offer({ final_clearance_by: "staff_olivia", final_clearance_completed_at: "2026-06-10T10:00:00Z" }) }),
      ],
    });
    expect(result.summary.total_candidates).toBe(2);
    expect(result.summary.cleared).toBe(1);
    expect(result.summary.headline).toMatch(/cleared to start/);
  });

  it("red candidates sort first and the one-line status leads with the light", () => {
    const result = computeSaferRecruitmentCommand({
      today: TODAY,
      candidates: [
        candidate({ profile: profile({ id: "cand_ok" }) }),
        candidate({
          profile: profile({ id: "cand_red", first_name: "Bea" }),
          checks: [...ALL_VERIFIED.filter((c) => c.check_type !== "enhanced_dbs"), check("enhanced_dbs", "verified", { concern_flag: true })],
        }),
      ],
    });
    expect(result.candidates[0].candidate_id).toBe("cand_red");
    expect(result.candidates[0].one_line_status).toMatch(/^Red:/);
    expect(result.candidates[1].one_line_status).toMatch(/^Amber:/);
  });

  it("is deterministic for a fixed today", () => {
    const input = { today: TODAY, candidates: [candidate()] };
    expect(computeSaferRecruitmentCommand(input)).toEqual(computeSaferRecruitmentCommand(input));
  });
});
