import { describe, it, expect } from "vitest";
import { generateRoleVersion, generateAllRoleVersions, getAvailableRoles } from "../role-output.service";
import type { AriaStudioArtifact } from "@/types/aria-studio";

function makeArtifact(overrides?: Partial<AriaStudioArtifact>): AriaStudioArtifact {
  return {
    id: "test-artifact-1",
    home_id: "home-1",
    artifact_type: "keywork_session",
    title: "Test Artifact",
    status: "committed",
    generated_content: "The young person's placement is going well. De-escalation strategies have been effective. The safeguarding review identified no concerns. Staff compliance with medication administration of Ritalin 10mg was good. An allegation against a staff member is being investigated.",
    plain_text_content: null,
    child_id: "child-1",
    created_by: "user-1",
    created_at: "2026-05-10T10:00:00Z",
    committed_at: "2026-05-10T12:00:00Z",
    ...overrides,
  } as AriaStudioArtifact;
}

describe("role-output.service", () => {
  describe("generateRoleVersion", () => {
    it("returns full content for registered_manager", () => {
      const artifact = makeArtifact();
      const version = generateRoleVersion(artifact, "registered_manager");

      expect(version.role).toBe("registered_manager");
      expect(version.label).toBe("Registered Manager");
      expect(version.content).toBe(artifact.generated_content);
      expect(version.redactions).toEqual([]);
    });

    it("redacts sensitive content for care worker", () => {
      const artifact = makeArtifact();
      const version = generateRoleVersion(artifact, "residential_care_worker");

      expect(version.role).toBe("residential_care_worker");
      expect(version.label).toBe("Care Worker");
      expect(version.redactions.length).toBeGreaterThan(0);
      expect(version.content).toContain("speak to your manager for details");
    });

    it("simplifies language for young person", () => {
      const artifact = makeArtifact();
      const version = generateRoleVersion(artifact, "young_person");

      expect(version.role).toBe("young_person");
      expect(version.label).toBe("Young Person");
      // "placement" should become "where you live"
      expect(version.content).toContain("where you live");
      // "de-escalation" should become "calming things down"
      expect(version.content).toContain("calming things down");
      // "safeguarding" should become "keeping you safe"
      expect(version.content).toContain("keeping you safe");
      expect(version.addedContext).toContain("Language simplified for young person");
    });

    it("adds disclaimer for young person", () => {
      const artifact = makeArtifact();
      const version = generateRoleVersion(artifact, "young_person");

      expect(version.content).toContain("You can ask your key worker or an advocate");
      expect(version.addedContext).toContain("Disclaimer added");
    });

    it("adds disclaimer for parent/carer", () => {
      const artifact = makeArtifact();
      const version = generateRoleVersion(artifact, "parent_carer");

      expect(version.content).toContain("please contact the home manager");
      expect(version.addedContext).toContain("Disclaimer added");
    });

    it("adds inspector disclaimer", () => {
      const artifact = makeArtifact();
      const version = generateRoleVersion(artifact, "inspector");

      expect(version.content).toContain("generated with AI assistance");
      expect(version.addedContext).toContain("Disclaimer added");
    });

    it("records tone override in addedContext", () => {
      const artifact = makeArtifact();
      const version = generateRoleVersion(artifact, "social_worker");

      expect(version.addedContext).toContain("Tone: professional_legal");
    });

    it("falls back to plain_text_content if generated_content is null", () => {
      const artifact = makeArtifact({
        generated_content: null,
        plain_text_content: "Fallback content for testing",
      });
      const version = generateRoleVersion(artifact, "registered_manager");

      expect(version.content).toBe("Fallback content for testing");
    });
  });

  describe("generateAllRoleVersions", () => {
    it("generates versions for all 9 roles when no roles specified", () => {
      const artifact = makeArtifact();
      const versions = generateAllRoleVersions(artifact);

      expect(versions.length).toBe(9);
      const roles = versions.map((v) => v.role);
      expect(roles).toContain("registered_manager");
      expect(roles).toContain("young_person");
      expect(roles).toContain("inspector");
    });

    it("generates versions for specified roles only", () => {
      const artifact = makeArtifact();
      const versions = generateAllRoleVersions(artifact, ["registered_manager", "young_person"]);

      expect(versions.length).toBe(2);
      expect(versions[0].role).toBe("registered_manager");
      expect(versions[1].role).toBe("young_person");
    });
  });

  describe("getAvailableRoles", () => {
    it("returns child-facing roles for keywork_session", () => {
      const roles = getAvailableRoles("keywork_session");

      expect(roles).toContain("registered_manager");
      expect(roles).toContain("young_person");
      expect(roles).toContain("social_worker");
    });

    it("returns governance roles for reg45_summary", () => {
      const roles = getAvailableRoles("reg45_summary");

      expect(roles).toContain("registered_manager");
      expect(roles).toContain("responsible_individual");
      expect(roles).toContain("inspector");
    });

    it("returns young_person and manager for child_friendly_worksheet", () => {
      const roles = getAvailableRoles("child_friendly_worksheet");

      expect(roles).toContain("young_person");
      expect(roles).toContain("registered_manager");
      expect(roles.length).toBe(2);
    });

    it("returns default roles for unknown artifact type", () => {
      const roles = getAvailableRoles("unknown_type");

      expect(roles).toContain("registered_manager");
      expect(roles).toContain("deputy_manager");
      expect(roles.length).toBe(2);
    });
  });
});
