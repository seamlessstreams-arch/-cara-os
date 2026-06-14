import { describe, it, expect } from "vitest";
import { buildFilingPath } from "../filing-cabinet.service";
import type { CaraStudioArtifact } from "@/types/cara-studio";

function makeArtifact(overrides?: Partial<CaraStudioArtifact>): CaraStudioArtifact {
  return {
    id: "test-artifact-1",
    home_id: "home-1",
    artifact_type: "keywork_session",
    title: "Test Key Work",
    status: "committed",
    generated_content: "Test content",
    plain_text_content: null,
    child_id: "child-abc-123",
    created_by: "user-1",
    created_at: "2026-05-10T10:00:00Z",
    committed_at: "2026-05-10T12:00:00Z",
    ...overrides,
  } as CaraStudioArtifact;
}

describe("filing-cabinet.service", () => {
  describe("buildFilingPath", () => {
    it("builds child-facing path with child_id and date", () => {
      const artifact = makeArtifact({ artifact_type: "keywork_session" });
      const path = buildFilingPath(artifact);

      expect(path).toBe("young-people/child-abc-123/key-work");
    });

    it("builds governance path with date", () => {
      const artifact = makeArtifact({
        artifact_type: "management_oversight",
        child_id: null,
        committed_at: "2026-05-10T12:00:00Z",
      });
      const path = buildFilingPath(artifact);

      expect(path).toBe("governance/management-oversight/2026-05-10");
    });

    it("builds risk review path", () => {
      const artifact = makeArtifact({ artifact_type: "risk_review" });
      const path = buildFilingPath(artifact);

      expect(path).toBe("young-people/child-abc-123/risk-assessments");
    });

    it("builds staff training path with date", () => {
      const artifact = makeArtifact({
        artifact_type: "staff_training",
        committed_at: "2026-03-15T09:00:00Z",
      });
      const path = buildFilingPath(artifact);

      expect(path).toBe("staff/training/2026-03-15");
    });

    it("builds reg45 path with date", () => {
      const artifact = makeArtifact({
        artifact_type: "reg45_summary",
        committed_at: "2026-04-01T08:00:00Z",
      });
      const path = buildFilingPath(artifact);

      expect(path).toBe("governance/reg45/2026-04-01");
    });

    it("uses 'home' when child_id is null for child-facing types", () => {
      const artifact = makeArtifact({
        artifact_type: "direct_work_session",
        child_id: null,
      });
      const path = buildFilingPath(artifact);

      expect(path).toBe("young-people/home/direct-work");
    });

    it("uses created_at when committed_at is null", () => {
      const artifact = makeArtifact({
        artifact_type: "management_oversight",
        committed_at: null,
        created_at: "2026-01-20T14:00:00Z",
      });
      const path = buildFilingPath(artifact);

      expect(path).toBe("governance/management-oversight/2026-01-20");
    });

    it("builds social worker update path", () => {
      const artifact = makeArtifact({ artifact_type: "social_worker_update" });
      const path = buildFilingPath(artifact);

      expect(path).toBe("young-people/child-abc-123/social-worker-updates");
    });

    it("builds safeguarding review path with child and date", () => {
      const artifact = makeArtifact({
        artifact_type: "safeguarding_review",
        committed_at: "2026-06-01T10:00:00Z",
      });
      const path = buildFilingPath(artifact);

      expect(path).toBe("safeguarding/child-abc-123/2026-06-01");
    });

    it("builds incident learning review path", () => {
      const artifact = makeArtifact({
        artifact_type: "incident_learning_review",
        committed_at: "2026-02-28T16:00:00Z",
      });
      const path = buildFilingPath(artifact);

      expect(path).toBe("incidents/2026-02-28/learning-reviews");
    });
  });
});
