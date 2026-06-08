import { describe, it, expect } from "vitest";
import { engineHref } from "../intelligence-links";

describe("engineHref", () => {
  it("maps a known engine to its specific action page", () => {
    expect(engineHref("home-self-harm-safety-plan-intelligence", "protection")).toBe("/self-harm-safety-plan");
    expect(engineHref("home-medication-governance-intelligence", "protection")).toBe("/medication");
    expect(engineHref("home-outcome-star-assessment-intelligence", "experiences")).toBe("/outcome-star");
  });

  it("falls back to the domain landing page for an unmapped engine", () => {
    expect(engineHref("home-some-new-engine-intelligence", "protection")).toBe("/safeguarding");
    expect(engineHref("home-some-new-engine-intelligence", "experiences")).toBe("/young-people");
    expect(engineHref("home-some-new-engine-intelligence", "workforce")).toBe("/workforce-oversight");
    expect(engineHref("home-some-new-engine-intelligence", "leadership")).toBe("/compliance");
  });

  it("falls back to /dashboard when neither engine nor domain is known", () => {
    expect(engineHref("totally-unknown")).toBe("/dashboard");
    expect(engineHref("totally-unknown", "nonexistent-domain")).toBe("/dashboard");
  });
});
