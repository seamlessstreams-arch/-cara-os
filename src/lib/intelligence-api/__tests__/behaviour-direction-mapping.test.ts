import { describe, it, expect } from "vitest";
import { dispatchHomeHandler } from "../home-dispatcher";
import { getStore } from "@/lib/db/store";

// `store.behaviourLog` spells a concerning entry "concern"; these two engines
// keep their own scale and filter for "concerning". The dispatcher passed the
// store value straight through, so both counted none — the therapeutic-climate
// ratio and the BSP effectiveness figures were built on zero concerning
// behaviour in a home that records plenty.
//
// The engines declare `direction: string`, so tsc cannot catch this; only
// running the mapping can.

describe("behaviour direction reaches the engines that filter on it", () => {
  it("the seed records concerning behaviour — otherwise this proves nothing", () => {
    const concern = getStore().behaviourLog.filter((b) => b.direction === "concern");
    expect(concern.length).toBeGreaterThan(0);
  });

  it("therapeutic climate counts it rather than reporting none", async () => {
    const handler = dispatchHomeHandler("therapeutic-climate-intelligence");
    expect(handler).toBeTruthy();
    const body = (await (await handler!()).json()) as {
      data?: { behaviour_profile?: { concerning_count?: number; total_entries?: number } };
      behaviour_profile?: { concerning_count?: number; total_entries?: number };
    };
    const profile = body.data?.behaviour_profile ?? body.behaviour_profile;
    expect(profile?.total_entries).toBeGreaterThan(0);
    // Sat at zero for every window while the mapping passed "concern" through.
    expect(profile?.concerning_count).toBeGreaterThan(0);
  });

  it("BSP effectiveness counts it too", async () => {
    const handler = dispatchHomeHandler("bsp-effectiveness-intelligence");
    expect(handler).toBeTruthy();
    const body = (await (await handler!()).json()) as {
      data?: Record<string, unknown>;
    };
    // The same mapping feeds this engine, which filters on "concerning" as well.
    const found = JSON.stringify(body.data ?? {});
    expect(found).toMatch(/"concerning_count":[1-9]/);
  });
});
