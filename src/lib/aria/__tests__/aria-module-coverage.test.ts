import { describe, it, expect } from "vitest";
import { _testing } from "@/components/aria/aria-module-coverage";

const { commandToModule, MODULE_MAP } = _testing;

// ── commandToModule ─────────────────────────────────────────────────────────

describe("commandToModule", () => {
  it("maps daily log commands", () => {
    expect(commandToModule("draft_daily_log")).toBe("daily_log");
    expect(commandToModule("improve_daily_log_entry")).toBe("daily_log");
  });

  it("maps incident commands", () => {
    expect(commandToModule("incident_risk_analysis")).toBe("incident");
    expect(commandToModule("suggest_incident_follow_up_tasks")).toBe("incident");
    expect(commandToModule("risk_assessment")).toBe("incident");
  });

  it("maps key work commands", () => {
    expect(commandToModule("draft_key_work_session")).toBe("key_work");
  });

  it("maps management oversight commands", () => {
    expect(commandToModule("draft_management_oversight")).toBe("management");
    expect(commandToModule("create_oversight_summary")).toBe("management");
  });

  it("maps supervision commands", () => {
    expect(commandToModule("supervision_prep")).toBe("supervision");
  });

  it("maps care plan commands", () => {
    expect(commandToModule("draft_care_plan_review")).toBe("care");
    expect(commandToModule("create_service_improvement_plan")).toBe("care");
  });

  it("maps safeguarding commands", () => {
    expect(commandToModule("safeguarding_review")).toBe("safeguarding");
  });

  it("maps handover commands", () => {
    expect(commandToModule("handover_summary")).toBe("handover");
  });

  it("returns null for general commands", () => {
    expect(commandToModule("improve_writing")).toBeNull();
    expect(commandToModule("summarise_text")).toBeNull();
  });
});

// ── MODULE_MAP ──────────────────────────────────────────────────────────────

describe("MODULE_MAP", () => {
  it("defines 8 modules", () => {
    expect(Object.keys(MODULE_MAP)).toHaveLength(8);
  });

  it("each module has label, icon, and color", () => {
    for (const [, config] of Object.entries(MODULE_MAP)) {
      expect(config).toHaveProperty("label");
      expect(config).toHaveProperty("icon");
      expect(config).toHaveProperty("color");
      expect(typeof config.label).toBe("string");
      expect(typeof config.color).toBe("string");
    }
  });

  it("covers key Cornerstone modules", () => {
    expect(MODULE_MAP).toHaveProperty("daily_log");
    expect(MODULE_MAP).toHaveProperty("incident");
    expect(MODULE_MAP).toHaveProperty("supervision");
    expect(MODULE_MAP).toHaveProperty("safeguarding");
  });
});
