import { describe, it, expect } from "vitest";
import { mergeWithDefaults, DEFAULT_SETTINGS } from "./system-settings-service";

// ── Tests ────────────────────────────────────────────────────────────────

describe("mergeWithDefaults", () => {
  it("returns all defaults when no DB settings provided", () => {
    const merged = mergeWithDefaults([]);
    // Should contain every default key
    for (const def of DEFAULT_SETTINGS) {
      expect(merged).toHaveProperty(def.key);
      expect(merged[def.key]).toEqual(def.defaultValue);
    }
  });

  it("overrides defaults with DB values", () => {
    const dbSettings = [
      { key: "cara.enabled", value: false },
      { key: "ops.home_capacity", value: 8 },
    ];
    const merged = mergeWithDefaults(dbSettings);
    expect(merged["cara.enabled"]).toBe(false);
    expect(merged["ops.home_capacity"]).toBe(8);
  });

  it("preserves defaults for keys not in DB", () => {
    const dbSettings = [{ key: "cara.enabled", value: false }];
    const merged = mergeWithDefaults(dbSettings);
    // cara.auto_scan_interval_hours default is 24
    expect(merged["cara.auto_scan_interval_hours"]).toBe(24);
  });

  it("handles DB settings with keys not in defaults", () => {
    const dbSettings = [{ key: "custom.new_setting", value: "hello" }];
    const merged = mergeWithDefaults(dbSettings);
    expect(merged["custom.new_setting"]).toBe("hello");
  });

  it("last DB value wins for duplicate keys", () => {
    const dbSettings = [
      { key: "cara.enabled", value: false },
      { key: "cara.enabled", value: true },
    ];
    const merged = mergeWithDefaults(dbSettings);
    expect(merged["cara.enabled"]).toBe(true);
  });

  it("includes correct number of default keys", () => {
    const merged = mergeWithDefaults([]);
    const defaultKeys = DEFAULT_SETTINGS.map((d) => d.key);
    expect(Object.keys(merged).length).toBe(defaultKeys.length);
  });

  it("default for display.theme is 'default'", () => {
    const merged = mergeWithDefaults([]);
    expect(merged["display.theme"]).toBe("default");
  });

  it("default for display.date_format is DD/MM/YYYY", () => {
    const merged = mergeWithDefaults([]);
    expect(merged["display.date_format"]).toBe("DD/MM/YYYY");
  });
});

describe("DEFAULT_SETTINGS structure", () => {
  it("has at least 20 settings defined", () => {
    expect(DEFAULT_SETTINGS.length).toBeGreaterThanOrEqual(20);
  });

  it("every setting has category, key, label, dataType, defaultValue", () => {
    for (const s of DEFAULT_SETTINGS) {
      expect(s.category).toBeTruthy();
      expect(s.key).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect(s.dataType).toBeTruthy();
      expect(s.defaultValue !== undefined).toBe(true);
    }
  });
});
