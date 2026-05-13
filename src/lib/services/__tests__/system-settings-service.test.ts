import { describe, it, expect } from "vitest";
import { _testing } from "../system-settings-service";

const { mergeWithDefaults, DEFAULT_SETTINGS } = _testing;

describe("DEFAULT_SETTINGS", () => {
  it("has settings across all 5 categories", () => {
    const categories = [...new Set(DEFAULT_SETTINGS.map((s) => s.category))];
    expect(categories).toContain("aria");
    expect(categories).toContain("notifications");
    expect(categories).toContain("compliance");
    expect(categories).toContain("operational");
    expect(categories).toContain("display");
  });

  it("has at least 20 settings", () => {
    expect(DEFAULT_SETTINGS.length).toBeGreaterThanOrEqual(20);
  });

  it("each setting has all required fields", () => {
    for (const s of DEFAULT_SETTINGS) {
      expect(s.category).toBeTruthy();
      expect(s.key).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(["string", "number", "boolean", "json"]).toContain(s.dataType);
      expect(s.defaultValue).toBeDefined();
    }
  });

  it("keys are unique", () => {
    const keys = DEFAULT_SETTINGS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("keys follow category.name convention", () => {
    for (const s of DEFAULT_SETTINGS) {
      expect(s.key).toContain(".");
    }
  });
});

describe("mergeWithDefaults", () => {
  it("returns all defaults when no DB settings provided", () => {
    const merged = mergeWithDefaults([]);
    expect(Object.keys(merged).length).toBe(DEFAULT_SETTINGS.length);
    for (const def of DEFAULT_SETTINGS) {
      expect(merged[def.key]).toEqual(def.defaultValue);
    }
  });

  it("overrides defaults with DB values", () => {
    const dbSettings = [
      { key: "aria.enabled", value: false },
      { key: "ops.home_capacity", value: 8 },
    ];
    const merged = mergeWithDefaults(dbSettings);
    expect(merged["aria.enabled"]).toBe(false);
    expect(merged["ops.home_capacity"]).toBe(8);
  });

  it("preserves defaults not in DB", () => {
    const dbSettings = [{ key: "aria.enabled", value: false }];
    const merged = mergeWithDefaults(dbSettings);
    // The default for aria.auto_scan_interval_hours is 24
    expect(merged["aria.auto_scan_interval_hours"]).toBe(24);
  });

  it("handles extra DB keys not in defaults", () => {
    const dbSettings = [{ key: "custom.setting", value: "custom_value" }];
    const merged = mergeWithDefaults(dbSettings);
    expect(merged["custom.setting"]).toBe("custom_value");
  });
});
