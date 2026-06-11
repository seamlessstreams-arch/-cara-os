import { describe, it, expect } from "vitest";
import {
  issueToken,
  hashToken,
  validateToken,
  applySubmission,
  TOKEN_TTL_DAYS,
  type ReferenceSubmission,
} from "../reference-link-service";
import type { CandidateReference } from "@/types/recruitment";

const NOW = "2026-06-11T12:00:00.000Z";

function reference(over: Partial<CandidateReference> = {}): CandidateReference {
  return {
    id: "ref_1",
    candidate_id: "cand_1",
    referee_name: "R. Manager",
    referee_role: null,
    organisation_name: "Previous Home Ltd",
    email: null,
    phone: null,
    relationship_to_candidate: "Former line manager",
    is_most_recent_employer: true,
    requested_at: NOW,
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
    created_at: NOW,
    updated_at: NOW,
    ...over,
  };
}

function submission(over: Partial<ReferenceSubmission> = {}): ReferenceSubmission {
  return {
    referee_name: "Rita Manager",
    referee_job_title: "Registered Manager",
    organisation: "Previous Home Ltd",
    work_email: "rita@previoushome.example",
    phone: "0161 000 0000",
    authorised_to_provide: true,
    relationship: "Line manager 2023–2026",
    employed_by_organisation: true,
    employment_dates: "Jan 2023 – May 2026",
    role_held: "Residential Care Worker",
    worked_with_children: true,
    reason_for_leaving: "Relocation",
    disciplinary_concerns: false,
    disciplinary_details: null,
    safeguarding_concerns: false,
    safeguarding_details: null,
    boundary_concerns: false,
    honesty_concerns: false,
    would_re_employ: true,
    suitable_for_children: true,
    anything_else: null,
    declaration_confirmed: true,
    ...over,
  };
}

describe("reference-link-service", () => {
  it("issues a token whose raw value is never equal to the stored hash, with a 7-day expiry", () => {
    const issued = issueToken(NOW, "demo-token-abc");
    expect(issued.token).toBe("demo-token-abc");
    expect(issued.secure_token_hash).toBe(hashToken("demo-token-abc"));
    expect(issued.secure_token_hash).not.toContain("demo-token");
    const expectedExpiry = new Date(new Date(NOW).getTime() + TOKEN_TTL_DAYS * 86_400_000).toISOString();
    expect(issued.token_expires_at).toBe(expectedExpiry);
  });

  it("validates a live token, rejects wrong / expired / used tokens", () => {
    const issued = issueToken(NOW, "tok-live");
    const live = reference({ secure_token_hash: issued.secure_token_hash, token_expires_at: issued.token_expires_at });
    expect(validateToken([live], "tok-live", NOW)).toMatchObject({ ok: true });
    expect(validateToken([live], "tok-wrong", NOW)).toEqual({ ok: false, reason: "invalid" });

    const afterExpiry = "2026-06-19T12:00:00.001Z";
    expect(validateToken([live], "tok-live", afterExpiry)).toEqual({ ok: false, reason: "expired" });

    const used = reference({ secure_token_hash: issued.secure_token_hash, token_expires_at: issued.token_expires_at, token_used_at: NOW });
    expect(validateToken([used], "tok-live", NOW)).toEqual({ ok: false, reason: "already_used" });
  });

  it("a clean submission becomes 'received' — never auto-satisfactory", () => {
    const out = applySubmission(reference(), submission(), { nowIso: NOW, ip: "1.2.3.4", user_agent: "test" });
    expect(out.valid).toBe(true);
    expect(out.adverse).toBe(false);
    expect(out.update?.status).toBe("received");
    expect(out.update?.token_used_at).toBe(NOW);
    expect(out.update?.submission_meta).toEqual({ ip: "1.2.3.4", user_agent: "test" });
    expect(out.update?.structured_response?.would_re_employ).toBe(true);
  });

  it("any adverse answer routes to 'concerns_noted' for manager review", () => {
    for (const adverse of [
      { safeguarding_concerns: true, safeguarding_details: "Allegation in 2024, investigated" },
      { disciplinary_concerns: true, disciplinary_details: "Written warning 2023" },
      { would_re_employ: false as const },
      { suitable_for_children: false as const },
      { boundary_concerns: true },
      { honesty_concerns: true },
    ]) {
      const out = applySubmission(reference(), submission(adverse), { nowIso: NOW, ip: null, user_agent: null });
      expect(out.valid).toBe(true);
      expect(out.adverse).toBe(true);
      expect(out.update?.status).toBe("concerns_noted");
    }
  });

  it("rejects without declaration, authorisation, or details for flagged concerns", () => {
    const noDecl = applySubmission(reference(), submission({ declaration_confirmed: false }), { nowIso: NOW, ip: null, user_agent: null });
    expect(noDecl.valid).toBe(false);
    expect(noDecl.errors.join(" ")).toMatch(/declaration/i);

    const notAuthorised = applySubmission(reference(), submission({ authorised_to_provide: false }), { nowIso: NOW, ip: null, user_agent: null });
    expect(notAuthorised.valid).toBe(false);

    const vague = applySubmission(reference(), submission({ safeguarding_concerns: true, safeguarding_details: "  " }), { nowIso: NOW, ip: null, user_agent: null });
    expect(vague.valid).toBe(false);
    expect(vague.errors.join(" ")).toMatch(/safeguarding/i);
    expect(vague.update).toBeNull();
  });

  it("preserves the adverse details in the structured response for the manager", () => {
    const out = applySubmission(
      reference(),
      submission({ safeguarding_concerns: true, safeguarding_details: "Substantiated concern, 2024", would_re_employ: false }),
      { nowIso: NOW, ip: null, user_agent: null },
    );
    expect(out.update?.structured_response?.safeguarding_concerns).toBe(true);
    expect(out.update?.structured_response?.would_re_employ).toBe(false);
    expect(out.update?.structured_response?.additional_comments).toMatch(/Substantiated concern/);
  });
});
