import { describe, it, expect, afterEach } from "vitest";
import {
  FEATURE_FLAGS,
  FLAG_KEYS,
  isFeatureEnabled,
  describeFlags,
  type FlagKey,
} from "../feature-flags";

// Restore any env var we touch so tests don't leak into each other.
const touched = new Set<string>();
function setEnv(name: string, value: string | undefined) {
  touched.add(name);
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
afterEach(() => {
  for (const n of touched) delete process.env[n];
  touched.clear();
});

describe("feature-flags — registry invariants", () => {
  it("every flag's stored default matches its polarity", () => {
    for (const key of FLAG_KEYS) {
      const f = FEATURE_FLAGS[key];
      expect(f.default).toBe(f.polarity === "opt_out");
    }
  });

  it("key field equals the registry key (no copy/paste drift)", () => {
    for (const key of FLAG_KEYS) {
      expect(FEATURE_FLAGS[key].key).toBe(key);
    }
  });

  it("env var names are unique across flags", () => {
    const envs = FLAG_KEYS.map((k) => FEATURE_FLAGS[k].env);
    expect(new Set(envs).size).toBe(envs.length);
  });
});

describe("feature-flags — resolution", () => {
  it("resolves to the documented default when the env var is unset", () => {
    for (const key of FLAG_KEYS) {
      setEnv(FEATURE_FLAGS[key].env, undefined);
      expect(isFeatureEnabled(key)).toBe(FEATURE_FLAGS[key].default);
    }
  });

  it("opt-out flags are ON by default and OFF only when explicitly false", () => {
    const optOut = FLAG_KEYS.filter((k) => FEATURE_FLAGS[k].polarity === "opt_out");
    expect(optOut.length).toBeGreaterThan(0);
    for (const key of optOut) {
      const env = FEATURE_FLAGS[key].env;
      setEnv(env, undefined);
      expect(isFeatureEnabled(key)).toBe(true);
      setEnv(env, "false");
      expect(isFeatureEnabled(key)).toBe(false);
    }
  });

  it("opt-in flags are OFF by default and ON only when explicitly true", () => {
    const optIn = FLAG_KEYS.filter((k) => FEATURE_FLAGS[k].polarity === "opt_in");
    expect(optIn.length).toBeGreaterThan(0);
    for (const key of optIn) {
      const env = FEATURE_FLAGS[key].env;
      setEnv(env, undefined);
      expect(isFeatureEnabled(key)).toBe(false);
      setEnv(env, "true");
      expect(isFeatureEnabled(key)).toBe(true);
    }
  });

  it("parses common truthy/falsy spellings (case + whitespace insensitive)", () => {
    const key: FlagKey = "cron_scheduler"; // opt-in, default false
    const env = FEATURE_FLAGS[key].env;
    for (const v of ["true", "1", "on", "YES", " Enabled "]) {
      setEnv(env, v);
      expect(isFeatureEnabled(key)).toBe(true);
    }
    for (const v of ["false", "0", "off", "NO", " disabled "]) {
      setEnv(env, v);
      expect(isFeatureEnabled(key)).toBe(false);
    }
  });

  it("falls back to the default on an unrecognised value", () => {
    setEnv(FEATURE_FLAGS.cron_scheduler.env, "banana"); // opt-in → default false
    expect(isFeatureEnabled("cron_scheduler")).toBe(false);
    setEnv(FEATURE_FLAGS.writing_assistant.env, "banana"); // opt-out → default true
    expect(isFeatureEnabled("writing_assistant")).toBe(true);
  });
});

describe("feature-flags — describeFlags", () => {
  it("returns one resolved entry per flag with overridden computed correctly", () => {
    for (const k of FLAG_KEYS) setEnv(FEATURE_FLAGS[k].env, undefined);
    const all = describeFlags();
    expect(all.length).toBe(FLAG_KEYS.length);
    // With an empty env, nothing is overridden.
    expect(all.every((f) => f.overridden === false)).toBe(true);
    expect(all.every((f) => f.enabled === f.default)).toBe(true);
  });

  it("marks a flag overridden when the env flips it off its default", () => {
    setEnv(FEATURE_FLAGS.sensitive_access_enforced.env, "false"); // opt-out default true → now false
    const entry = describeFlags().find((f) => f.key === "sensitive_access_enforced")!;
    expect(entry.enabled).toBe(false);
    expect(entry.overridden).toBe(true);
  });

  it("exposes no secrets — only metadata + booleans", () => {
    const entry = describeFlags()[0];
    expect(Object.keys(entry).sort()).toEqual(
      ["default", "description", "enabled", "env", "key", "overridden", "polarity", "stability"].sort(),
    );
  });
});
