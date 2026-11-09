import { describe, it, expect } from "vitest";
import { recordEvidencesChange } from "../recording-change";

describe("recordEvidencesChange", () => {
  it("flags administrative-completion-only records (eval case: tick/sign/date/upload)", () => {
    const r = recordEvidencesChange("Consent form uploaded and signed. Task completed.");
    expect(r.evidencesChange).toBe(false);
    expect(r.issue).toBe("administrative_completion_only");
    expect(r.adminCues.length).toBeGreaterThan(0);
    expect(r.prompt).toMatch(/not enough/i);
  });

  it("accepts a record that evidences experience / change", () => {
    const r = recordEvidencesChange(
      "Since the new bedtime routine, X said she feels safe and for the first time slept through the night.",
    );
    expect(r.evidencesChange).toBe(true);
    expect(r.issue).toBeUndefined();
  });

  it("accepts an admin action WHEN paired with experience/change", () => {
    const r = recordEvidencesChange("Care plan uploaded. The child said she felt heard in the meeting.");
    expect(r.evidencesChange).toBe(true);
  });

  it("flags a thin record with neither admin nor experience as no-account", () => {
    const r = recordEvidencesChange("Attended the home.");
    expect(r.evidencesChange).toBe(false);
    expect(r.issue).toBe("no_account_of_experience_or_change");
  });
});
