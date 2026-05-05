import { describe, it, expect } from "vitest";
import { suggestSmartLinks, type SmartLinkContext } from "../smart-linking";

describe("suggestSmartLinks", () => {
  it("suggests child-related links for incidents involving a child", () => {
    const ctx: SmartLinkContext = {
      sourceType: "incident",
      sourceId: "inc-1",
      childId: "child-1",
      homeId: "home-1",
      severity: "low",
    };
    const suggestions = suggestSmartLinks(ctx);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((s) => s.targetType === "child_profile" && s.autoLink)).toBe(true);
    expect(suggestions.some((s) => s.targetType === "risk_assessment")).toBe(true);
    expect(suggestions.some((s) => s.targetType === "inspection_evidence")).toBe(true);
  });

  it("adds RI notification for serious incidents", () => {
    const ctx: SmartLinkContext = {
      sourceType: "incident",
      sourceId: "inc-1",
      childId: "child-1",
      homeId: "home-1",
      severity: "serious",
    };
    const suggestions = suggestSmartLinks(ctx);
    expect(suggestions.some((s) => s.targetType === "ri_notification")).toBe(true);
  });

  it("does not add RI notification for low-severity incidents", () => {
    const ctx: SmartLinkContext = {
      sourceType: "incident",
      sourceId: "inc-1",
      childId: "child-1",
      homeId: "home-1",
      severity: "low",
    };
    const suggestions = suggestSmartLinks(ctx);
    expect(suggestions.some((s) => s.targetType === "ri_notification")).toBe(false);
  });

  it("suggests voice capture for key_work", () => {
    const ctx: SmartLinkContext = {
      sourceType: "key_work",
      sourceId: "kw-1",
      childId: "child-1",
      homeId: "home-1",
    };
    const suggestions = suggestSmartLinks(ctx);
    expect(suggestions.some((s) => s.targetType === "child_voice")).toBe(true);
    expect(suggestions.some((s) => s.targetType === "child_progress")).toBe(true);
  });

  it("suggests evidence room link for complaints", () => {
    const ctx: SmartLinkContext = {
      sourceType: "complaint",
      sourceId: "comp-1",
      homeId: "home-1",
    };
    const suggestions = suggestSmartLinks(ctx);
    expect(suggestions.some((s) => s.targetType === "inspection_evidence" && s.autoLink)).toBe(true);
    expect(suggestions.some((s) => s.targetType === "reg45_evidence")).toBe(true);
  });

  it("suggests passport update for training_gap", () => {
    const ctx: SmartLinkContext = {
      sourceType: "training_gap",
      sourceId: "tg-1",
      staffId: "staff-1",
      homeId: "home-1",
    };
    const suggestions = suggestSmartLinks(ctx);
    expect(suggestions.some((s) => s.targetType === "staff_passport" && s.autoLink)).toBe(true);
    expect(suggestions.some((s) => s.targetType === "rota_warning")).toBe(true);
  });

  it("suggests evidence link for reg44_visit", () => {
    const ctx: SmartLinkContext = {
      sourceType: "reg44_visit",
      sourceId: "r44-1",
      homeId: "home-1",
    };
    const suggestions = suggestSmartLinks(ctx);
    expect(suggestions.some((s) => s.targetType === "inspection_evidence" && s.autoLink)).toBe(true);
    expect(suggestions.some((s) => s.targetType === "manager_dashboard")).toBe(true);
  });

  it("suggests risk and oversight links for missing_from_care", () => {
    const ctx: SmartLinkContext = {
      sourceType: "missing_from_care",
      sourceId: "mfc-1",
      childId: "child-1",
      homeId: "home-1",
    };
    const suggestions = suggestSmartLinks(ctx);
    expect(suggestions.some((s) => s.targetType === "risk_assessment")).toBe(true);
    expect(suggestions.some((s) => s.targetType === "manager_oversight")).toBe(true);
  });

  it("returns generic links for unknown source types with childId", () => {
    const ctx: SmartLinkContext = {
      sourceType: "unknown_type",
      sourceId: "x-1",
      childId: "child-1",
      homeId: "home-1",
    };
    const suggestions = suggestSmartLinks(ctx);
    expect(suggestions.some((s) => s.targetType === "child_profile")).toBe(true);
  });

  it("returns generic staff link for unknown source types with staffId", () => {
    const ctx: SmartLinkContext = {
      sourceType: "unknown_type",
      sourceId: "x-1",
      staffId: "staff-1",
      homeId: "home-1",
    };
    const suggestions = suggestSmartLinks(ctx);
    expect(suggestions.some((s) => s.targetType === "staff_passport")).toBe(true);
  });

  it("returns empty for incidents with no child and low severity", () => {
    const ctx: SmartLinkContext = {
      sourceType: "incident",
      sourceId: "inc-1",
      homeId: "home-1",
      severity: "low",
    };
    const suggestions = suggestSmartLinks(ctx);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((s) => s.targetType === "child_profile")).toBe(false);
  });
});
