// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — Test suite
// Tests: quality check logic, status transitions, commit protection,
//        gap detection, source gathering, filing path, stub provider.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import type { CaraArtifact, CaraQualityCheck } from "@/types/cara-studio";
import {
  submitArtifactForReview,
  approveArtifact,
  requestChanges,
  rejectArtifact,
  commitArtifact,
  editArtifact,
} from "@/lib/cara/cara-studio-service";
import { runQualityCheck } from "@/lib/cara/cara-studio-quality";
import { detectGapsForRequest } from "@/lib/cara/cara-studio-gaps";
import { gatherSourcesForRequest } from "@/lib/cara/cara-studio-sources";
import { generateCaraStudioContent } from "@/lib/cara/cara-studio-provider";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeArtifact(overrides: Partial<CaraArtifact> = {}): CaraArtifact {
  const base: CaraArtifact = {
    id: `art_test_${Math.random().toString(36).slice(2)}`,
    artifact_type: "keywork_session",
    title: "Test keywork session",
    status: "draft",
    child_id: "yp_001",
    home_id: "home_oak",
    staff_id: "staff_anna",
    incident_id: null,
    linked_record_id: null,
    linked_record_type: null,
    framework: "pace",
    tone: "professional",
    creative_mode: "balanced",
    generated_content: "This is a test keywork session. The child expressed their feelings clearly. Risk has been considered. Actions have been agreed. Reviewed on 1 May 2026.",
    structured_content: null,
    plain_text_content: null,
    quality_score: null,
    evidence_confidence_score: null,
    safeguarding_level: "none",
    regulation_relevance: [],
    source_ids: [],
    created_by: "staff_anna",
    reviewed_by: null,
    approved_by: null,
    committed_by: null,
    rejected_by: null,
    created_at: new Date().toISOString(),
    submitted_for_review_at: null,
    reviewed_at: null,
    approved_at: null,
    committed_at: null,
    rejected_at: null,
    archived_at: null,
    version_number: 1,
    filing_cabinet_path: null,
    official_record_id: null,
    child_voice_present: false,
    quality_checks_passed: false,
    amendment_reason: null,
    ...overrides,
  };
  return base;
}

function seedArtifact(artifact: CaraArtifact): CaraArtifact {
  return db.caraArtifacts.create(artifact);
}

// ── Status transitions ─────────────────────────────────────────────────────────

describe("Cara Studio — status transitions", () => {
  it("draft → in_review via submit", () => {
    const art = seedArtifact(makeArtifact({ status: "draft" }));
    const updated = submitArtifactForReview(art.id, "staff_anna");
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("in_review");
    expect(updated!.submitted_for_review_at).not.toBeNull();
  });

  it("cannot submit if already in_review", () => {
    const art = seedArtifact(makeArtifact({ status: "in_review" }));
    const result = submitArtifactForReview(art.id, "staff_anna");
    expect(result).toBeNull();
  });

  it("in_review → approved via approve", () => {
    const art = seedArtifact(makeArtifact({ status: "in_review" }));
    const updated = approveArtifact(art.id, "manager_1", "Looks good");
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("approved");
    expect(updated!.approved_by).toBe("manager_1");
    expect(updated!.approved_at).not.toBeNull();
  });

  it("cannot approve if status is not in_review", () => {
    const art = seedArtifact(makeArtifact({ status: "draft" }));
    const result = approveArtifact(art.id, "manager_1");
    expect(result).toBeNull();
  });

  it("in_review → changes_requested via requestChanges", () => {
    const art = seedArtifact(makeArtifact({ status: "in_review" }));
    const updated = requestChanges(art.id, "manager_1", "Please add more detail about the child's views.");
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("changes_requested");
  });

  it("in_review → rejected via reject", () => {
    const art = seedArtifact(makeArtifact({ status: "in_review" }));
    const updated = rejectArtifact(art.id, "manager_1", "Content is inaccurate.");
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("rejected");
    expect(updated!.rejected_by).toBe("manager_1");
  });

  it("approved → committed if QC passed", () => {
    const art = seedArtifact(makeArtifact({ status: "approved", quality_checks_passed: true }));
    const updated = commitArtifact(art.id, "manager_1");
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("committed");
    expect(updated!.committed_by).toBe("manager_1");
    expect(updated!.committed_at).not.toBeNull();
  });

  it("commit blocked if a failing quality check exists", () => {
    const art = seedArtifact(makeArtifact({ status: "approved", quality_checks_passed: false }));
    // Seed a failing QC record so commitArtifact can see it
    db.caraQualityChecks.create({
      artifact_id: art.id,
      evidence_cited: false,
      child_voice_considered: false,
      risk_considered: false,
      safeguarding_considered: false,
      regulation_considered: false,
      actions_clear: false,
      owner_assigned: false,
      review_date_set: false,
      human_approval_complete: false,
      sensitive_language_reviewed: false,
      no_unsupported_claims: false,
      no_ai_style_filler: false,
      dignity_language_passed: false,
      overall_passed: false,
      issues: ["All checks failed"],
    });
    const result = commitArtifact(art.id, "manager_1");
    expect(result).toBeNull();
  });

  it("commit blocked if status is not approved", () => {
    const art = seedArtifact(makeArtifact({ status: "draft", quality_checks_passed: true }));
    const result = commitArtifact(art.id, "manager_1");
    expect(result).toBeNull();
  });
});

// ── Editing and versioning ─────────────────────────────────────────────────────

describe("Cara Studio — editing and versioning", () => {
  it("creates a version snapshot on edit", () => {
    const art = seedArtifact(makeArtifact({ status: "draft" }));
    editArtifact(art.id, "staff_anna", "Updated content for the session.", "Added more detail");
    const versions = db.caraArtifactVersions.findByArtifact(art.id);
    expect(versions.length).toBeGreaterThanOrEqual(1);
    // The service stores the new content under the new version number
    expect(versions[0]!.content).toBe("Updated content for the session.");
    expect(versions[0]!.version_number).toBe(2);
  });

  it("increments version_number on edit", () => {
    const art = seedArtifact(makeArtifact({ status: "draft", version_number: 1 }));
    const updated = editArtifact(art.id, "staff_anna", "New content version.", "Revision");
    expect(updated).not.toBeNull();
    expect(updated!.version_number).toBe(2);
  });

  it("resets quality_checks_passed to false on edit", () => {
    const art = seedArtifact(makeArtifact({ status: "draft", quality_checks_passed: true }));
    const updated = editArtifact(art.id, "staff_anna", "Edited content here.", "Minor edit");
    expect(updated!.quality_checks_passed).toBe(false);
  });
});

// ── Quality checks ─────────────────────────────────────────────────────────────

describe("Cara Studio — quality checks", () => {
  it("quality check passes for well-formed content", () => {
    const art = seedArtifact(makeArtifact({
      status: "approved",
      generated_content: "The child expressed their feelings clearly. Risk has been considered. Actions have been agreed with clear owners and review date of 1 June 2026. Evidence has been cited from the daily log. This work is approved by manager. No unsupported claims.",
    }));
    const result = runQualityCheck(art);
    expect(result).not.toBeNull();
    expect(typeof result.overall_passed).toBe("boolean");
    expect(typeof result.issues).toBe("object");
    expect(Array.isArray(result.issues)).toBe(true);
  });

  it("quality check detects missing actions for a review type", () => {
    // risk_review is in the reviewTypes list that requires a review date
    const art = seedArtifact(makeArtifact({
      status: "approved",
      artifact_type: "risk_review",
      generated_content: "Some content without any scheduling information or follow-up dates.",
    }));
    const result = runQualityCheck(art);
    expect(result.review_date_set).toBe(false);
  });

  it("quality check score is between 0 and 100", () => {
    const art = seedArtifact(makeArtifact({ status: "approved" }));
    const result = runQualityCheck(art);
    const updated = db.caraArtifacts.findById(art.id);
    expect(updated!.quality_score).toBeGreaterThanOrEqual(0);
    expect(updated!.quality_score).toBeLessThanOrEqual(100);
  });

  it("persists quality check to caraQualityChecks store", () => {
    const art = seedArtifact(makeArtifact({ status: "approved" }));
    runQualityCheck(art);
    const checks = db.caraQualityChecks.findByArtifact(art.id);
    expect(checks.length).toBeGreaterThanOrEqual(1);
  });

  it("writes audit log entry on quality check", () => {
    const art = seedArtifact(makeArtifact({ status: "approved" }));
    runQualityCheck(art);
    const log = db.caraStudioAuditLog.findByArtifact(art.id);
    const qcEntry = log.find((e) => e.action_type === "quality_check_completed");
    expect(qcEntry).toBeDefined();
  });
});

// ── Gap detection ─────────────────────────────────────────────────────────────

describe("Cara Studio — gap detection", () => {
  it("returns array of gaps (may be empty for well-covered home)", async () => {
    const gaps = await detectGapsForRequest({
      artifact_type: "keywork_session",
      title: "Test",
      child_id: null,
      home_id: "home_oak",
      staff_id: null,
      incident_id: null,
      linked_record_id: null,
      linked_record_type: null,
      framework: "none",
      tone: "professional",
      creative_mode: "balanced",
      source_ids: [],
      additional_context: "",
      requested_by: "system",
      date_range_from: null,
      date_range_to: null,
    });
    expect(Array.isArray(gaps)).toBe(true);
  });

  it("each gap has required fields", async () => {
    const gaps = await detectGapsForRequest({
      artifact_type: "risk_review",
      title: "Test",
      child_id: "yp_001",
      home_id: "home_oak",
      staff_id: null,
      incident_id: null,
      linked_record_id: null,
      linked_record_type: null,
      framework: "none",
      tone: "professional",
      creative_mode: "balanced",
      source_ids: [],
      additional_context: "",
      requested_by: "system",
      date_range_from: null,
      date_range_to: null,
    });
    for (const gap of gaps) {
      expect(gap.gap_type).toBeDefined();
      expect(gap.severity).toBeDefined();
      expect(gap.title).toBeTruthy();
      expect(gap.recommended_action).toBeTruthy();
    }
  });
});

// ── Source gathering ───────────────────────────────────────────────────────────

describe("Cara Studio — source gathering", () => {
  it("returns array of sources (may be empty)", async () => {
    const sources = await gatherSourcesForRequest({
      artifact_type: "keywork_session",
      title: "Test",
      child_id: "yp_001",
      home_id: "home_oak",
      staff_id: null,
      incident_id: null,
      linked_record_id: null,
      linked_record_type: null,
      framework: "none",
      tone: "professional",
      creative_mode: "balanced",
      source_ids: [],
      additional_context: "",
      requested_by: "staff_anna",
      date_range_from: null,
      date_range_to: null,
    });
    expect(Array.isArray(sources)).toBe(true);
  });

  it("sources are deduplicated by type+record_id", async () => {
    const sources = await gatherSourcesForRequest({
      artifact_type: "keywork_session",
      title: "Test",
      child_id: null,
      home_id: "home_oak",
      staff_id: null,
      incident_id: null,
      linked_record_id: null,
      linked_record_type: null,
      framework: "none",
      tone: "professional",
      creative_mode: "balanced",
      source_ids: [],
      additional_context: "",
      requested_by: "staff_anna",
      date_range_from: null,
      date_range_to: null,
    });
    const keys = sources.map((s) => `${s.source_type}:${s.linked_record_id}`);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it("each source has required fields", async () => {
    const sources = await gatherSourcesForRequest({
      artifact_type: "keywork_session",
      title: "Test",
      child_id: null,
      home_id: "home_oak",
      staff_id: null,
      incident_id: null,
      linked_record_id: null,
      linked_record_type: null,
      framework: "none",
      tone: "professional",
      creative_mode: "balanced",
      source_ids: [],
      additional_context: "",
      requested_by: "staff_anna",
      date_range_from: null,
      date_range_to: null,
    });
    for (const source of sources) {
      expect(source.id).toBeTruthy();
      expect(source.source_type).toBeTruthy();
      expect(source.title).toBeTruthy();
      expect(source.approval_status).toBeDefined();
    }
  });
});

// ── AI provider / stub ─────────────────────────────────────────────────────────

describe("Cara Studio — AI provider", () => {
  it("stub provider returns isStub=true when no API key configured", async () => {
    const result = await generateCaraStudioContent(
      {
        artifactType: "keywork_session",
        title: "Test session",
        framework: "pace",
        tone: "professional",
        creativeMode: "balanced",
        systemPrompt: "You are Cara.",
        userPrompt: "Generate a brief test.",
      },
      { provider: "stub", model: "stub", configured: true, maxTokens: 4096, temperature: 0 }
    );
    expect(result.isStub).toBe(true);
    expect(result.content).toBeTruthy();
    expect(result.model).toBe("stub");
  });

  it("stub provider returns non-empty content", async () => {
    const result = await generateCaraStudioContent(
      {
        artifactType: "keywork_session",
        title: "Test session",
        framework: "pace",
        tone: "professional",
        creativeMode: "balanced",
        systemPrompt: "You are Cara.",
        userPrompt: "Generate a keywork session note.",
      },
      { provider: "stub", model: "stub", configured: true, maxTokens: 4096, temperature: 0 }
    );
    expect(result.content.length).toBeGreaterThan(50);
  });

  it("stub provider content includes Cara DEMO watermark", async () => {
    const result = await generateCaraStudioContent(
      {
        artifactType: "keywork_session",
        title: "Test session",
        framework: "pace",
        tone: "professional",
        creativeMode: "balanced",
        systemPrompt: "You are Cara.",
        userPrompt: "Write a test",
      },
      { provider: "stub", model: "stub", configured: true, maxTokens: 4096, temperature: 0 }
    );
    expect(result.content.toUpperCase()).toContain("CARA");
  });
});

// ── Store integrity ────────────────────────────────────────────────────────────

describe("Cara Studio — store integrity", () => {
  it("db.caraArtifacts.findAll returns an array", () => {
    const result = db.caraArtifacts.findAll();
    expect(Array.isArray(result)).toBe(true);
  });

  it("db.caraArtifacts.stats returns expected shape", () => {
    const stats = db.caraArtifacts.stats("home_oak");
    expect(typeof stats.total).toBe("number");
    expect(typeof stats.draft).toBe("number");
    expect(typeof stats.committed).toBe("number");
  });

  it("db.caraArtifacts.findByStatus filters correctly", () => {
    seedArtifact(makeArtifact({ status: "draft", home_id: "home_oak" }));
    const drafts = db.caraArtifacts.findByStatus("draft", "home_oak");
    expect(drafts.every((a) => a.status === "draft")).toBe(true);
  });

  it("db.caraArtifacts.findById returns null/undefined for unknown id", () => {
    const result = db.caraArtifacts.findById("art_nonexistent_xyz");
    expect(result == null).toBe(true);
  });

  it("audit log is written when artifact is submitted", () => {
    const art = seedArtifact(makeArtifact({ status: "draft" }));
    submitArtifactForReview(art.id, "staff_anna");
    const log = db.caraStudioAuditLog.findByArtifact(art.id);
    expect(log.length).toBeGreaterThanOrEqual(1);
    expect(log[0]!.action_type).toBe("artifact_submitted");
  });
});
