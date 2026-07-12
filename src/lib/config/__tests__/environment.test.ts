import { describe, it, expect, afterEach } from "vitest";
import {
  getEnvironment,
  isPractice,
  isLive,
  isSeparationActive,
  guardLiveAction,
  environmentTag,
  describeEnvironment,
} from "../environment";

// The primitive reads two env vars: the Module 8 flag (CARA_PRACTICE_LIVE_SEPARATION)
// and CARA_ENVIRONMENT. Restore both after each test so cases don't leak.
const FLAG = "CARA_PRACTICE_LIVE_SEPARATION";
const ENV = "CARA_ENVIRONMENT";
afterEach(() => {
  delete process.env[FLAG];
  delete process.env[ENV];
});

describe("environment — separation inactive (demo default)", () => {
  it("resolves to live, inactive, no banner, guards are no-ops", () => {
    delete process.env[FLAG];
    delete process.env[ENV];
    expect(isSeparationActive()).toBe(false);
    expect(getEnvironment()).toBe("live");
    expect(isLive()).toBe(true);
    expect(isPractice()).toBe(false);
    expect(guardLiveAction("send Reg 40 notification")).toBeNull();
    expect(environmentTag()).toBeNull();
    const d = describeEnvironment();
    expect(d).toMatchObject({ environment: "live", separationActive: false, banner: null, liveActionsBlocked: false });
  });

  it("stays live even if CARA_ENVIRONMENT=practice while the flag is off", () => {
    process.env[ENV] = "practice"; // ignored — separation not switched on
    expect(getEnvironment()).toBe("live");
    expect(guardLiveAction("x")).toBeNull();
  });
});

describe("environment — separation active", () => {
  it("fails safe to PRACTICE when CARA_ENVIRONMENT is unset", () => {
    process.env[FLAG] = "true";
    delete process.env[ENV];
    expect(isSeparationActive()).toBe(true);
    expect(getEnvironment()).toBe("practice");
    expect(isPractice()).toBe(true);
  });

  it("resolves to LIVE only when CARA_ENVIRONMENT is explicitly live", () => {
    process.env[FLAG] = "true";
    process.env[ENV] = "live";
    expect(getEnvironment()).toBe("live");
    expect(isLive()).toBe(true);
    expect(guardLiveAction("send")).toBeNull(); // live → allowed
    expect(environmentTag()).toBe("live");
  });

  it("blocks live-only actions in practice and tags records", () => {
    process.env[FLAG] = "true";
    process.env[ENV] = "practice";
    const blocked = guardLiveAction("send Reg 40 notification");
    expect(blocked).toContain("practice environment");
    expect(environmentTag()).toBe("practice");
    const d = describeEnvironment();
    expect(d.separationActive).toBe(true);
    expect(d.environment).toBe("practice");
    expect(d.liveActionsBlocked).toBe(true);
    expect(d.banner).toContain("PRACTICE");
  });

  it("treats any non-live label (typo/unknown) as practice — fail-safe", () => {
    process.env[FLAG] = "true";
    process.env[ENV] = "prod"; // not the sentinel "live"
    expect(getEnvironment()).toBe("practice");
  });
});
