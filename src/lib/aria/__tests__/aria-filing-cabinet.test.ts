// ══════════════════════════════════════════════════════════════════════════════
// ARIA Studio — filing cabinet writeback
// Verifies that committing an approved artifact pushes it into the
// filing cabinet, links the official record id, and is idempotent.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { db } from "@/lib/db/store";
import type { AriaArtifact } from "@/types/aria-studio";
import {
  approveArtifact,
  commitArtifact,
} from "@/lib/aria/aria-studio-service";
import {
  buildAriaFilingPath,
  fileCommittedArtifact,
} from "@/lib/aria/aria-filing-cabinet";

function seed(overrides: Partial<AriaArtifact> = {}): AriaArtifact {
  const base: AriaArtifact = {
    id: `art_filing_${Math.random().toString(36).slice(2, 10)}`,
    artifact_type: "reg45_summary",
    title: "May 2026 Reg 45 evidence summary",
    status: "in_review",
    child_id: null,
    home_id: "home_oak",
    staff_id: null,
    incident_id: null,
    linked_record_id: null,
    linked_record_type: null,
    framework: "none",
    tone: "professional",
    creative_mode: "balanced",
    generated_content: "Approved evidence summary for Regulation 45.",
    structured_content: null,
    plain_text_content: "Approved evidence summary for Regulation 45.",
    quality_score: 90,
    evidence_confidence_score: 80,
    safeguarding_level: "none",
    regulation_relevance: ["regulation_45"],
    source_ids: [],
    created_by: "manager_1",
    reviewed_by: null,
    approved_by: null,
    committed_by: null,
    rejected_by: null,
    created_at: new Date().toISOString(),
    submitted_for_review_at: new Date().toISOString(),
    reviewed_at: null,
    approved_at: null,
    committed_at: null,
    rejected_at: null,
    archived_at: null,
    version_number: 1,
    filing_cabinet_path: null,
    official_record_id: null,
    child_voice_present: false,
    quality_checks_passed: true,
    amendment_reason: null,
    ...overrides,
  };
  return db.ariaArtifacts.create(base);
}

describe("ARIA Studio — filing cabinet writeback", () => {
  it("buildAriaFilingPath uses scope, category, year, month, type and title", () => {
    const art = seed({
      child_id: "yp_001",
      committed_at: "2026-05-11T10:00:00.000Z",
      artifact_type: "keywork_session",
      title: "Reflection on weekend contact",
    });
    const path = buildAriaFilingPath(art, "daily_care");
    expect(path).toContain("Children/yp_001");
    expect(path).toContain("daily_care");
    expect(path).toContain("2026");
    expect(path).toContain("May");
    expect(path).toContain("keywork_session");
    expect(path).toContain("Reflection on weekend contact");
  });

  it("refuses to file a non-committed artifact", () => {
    const art = seed({ status: "approved" });
    const result = fileCommittedArtifact(art);
    expect(result.filed).toBe(false);
    expect(result.reason).toMatch(/not committed/i);
  });

  it("commitArtifact writes a filing cabinet item, links official_record_id, and persists path", () => {
    const art = seed({ status: "in_review" });
    const approved = approveArtifact(art.id, "manager_1", "Approved");
    expect(approved?.status).toBe("approved");

    const committed = commitArtifact(art.id, "manager_1");
    expect(committed?.status).toBe("committed");
    expect(committed?.filing_cabinet_path).toBeTruthy();
    expect(committed?.official_record_id).toBeTruthy();

    const linkedItem = db.filingCabinet
      .findAll()
      .find((f) => f.id === committed!.official_record_id);
    expect(linkedItem).toBeDefined();
    expect(linkedItem!.source_type).toBe("aria_studio");
    expect(linkedItem!.linked_record_id).toBe(art.id);
    expect(linkedItem!.linked_record_table).toBe("aria_artifacts");
    expect(linkedItem!.is_verified).toBe(true);
    expect(linkedItem!.tags).toContain("aria_studio");
    expect(linkedItem!.category).toBe("regulation_45");
  });

  it("re-filing the same artifact is idempotent (upsert by care_event_id+category)", () => {
    const art = seed({ status: "in_review" });
    approveArtifact(art.id, "manager_1");
    commitArtifact(art.id, "manager_1");

    const before = db.filingCabinet.findAll().length;
    // Re-running file directly on the same committed artifact.
    const refreshed = db.ariaArtifacts.findById(art.id)!;
    fileCommittedArtifact(refreshed);
    const after = db.filingCabinet.findAll().length;
    expect(after).toBe(before);
  });

  it("audit trail records the commit with the filing path", () => {
    const art = seed({ status: "in_review", child_id: "yp_002" });
    approveArtifact(art.id, "manager_1");
    commitArtifact(art.id, "manager_1");

    const events = db.ariaStudioAuditLog
      .findAll()
      .filter((e) => e.artifact_id === art.id && e.action_type === "artifact_committed");
    expect(events.length).toBe(1);
    const after = events[0].after_state as Record<string, unknown> | null;
    expect(after?.status).toBe("committed");
    expect(after?.filing_path).toBeTruthy();
    expect(after?.filing_item_id).toBeTruthy();
  });

  it("home-level artifact (no child) files under Home scope", () => {
    const art = seed({
      status: "in_review",
      child_id: null,
      artifact_type: "ofsted_readiness_summary",
      title: "Q2 readiness",
    });
    approveArtifact(art.id, "manager_1");
    const committed = commitArtifact(art.id, "manager_1");
    expect(committed?.filing_cabinet_path).toContain("Home/home_oak");
    expect(committed?.filing_cabinet_path).toContain("annex_a");
  });
});
