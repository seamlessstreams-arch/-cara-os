// Regression: the comms channel seed must not live only in the channels-list
// read. On multi-instance serverless, a request that resolves a channel by id
// (messages/receipt/hold/convert) can land on an instance whose store was
// never seeded — the id from another instance's list then 404s. The fix seeds
// at the resolveCommsUser chokepoint; these tests pin the store-level invariant
// by simulating a cold instance (emptying the collections) between reads.

import { describe, it, expect, beforeEach } from "vitest";
import { db, getStore } from "@/lib/db/store";

const HOME = "home_oak";

function simulateColdInstance() {
  const store = getStore();
  store.commsChannels.length = 0;
  store.commsMessages.length = 0;
}

describe("comms channel seeding", () => {
  beforeEach(simulateColdInstance);

  it("findById resolves a listed channel id after chokepoint seeding on a cold instance", () => {
    // Instance A lists channels (seeds itself) — the client now holds an id.
    const listed = db.commsChannels.findForHome(HOME);
    expect(listed.length).toBeGreaterThan(0);
    const channelId = listed[0].id;

    // Instance B is cold: nothing seeded yet.
    simulateColdInstance();
    expect(db.commsChannels.findById(channelId)).toBeUndefined();

    // The chokepoint seed (what resolveCommsUser now does) heals the lookup.
    db.commsChannels.seedDefaults(HOME);
    expect(db.commsChannels.findById(channelId)).toBeDefined();
  });

  it("channel ids are deterministic across instances (the #307 half of the class)", () => {
    const a = db.commsChannels.findForHome(HOME).map((c) => c.id).sort();
    simulateColdInstance();
    const b = db.commsChannels.findForHome(HOME).map((c) => c.id).sort();
    expect(a).toEqual(b);
  });

  it("seeding is idempotent — repeated chokepoint calls never duplicate channels", () => {
    db.commsChannels.seedDefaults(HOME);
    const once = getStore().commsChannels.filter((c) => c.home_id === HOME).length;
    db.commsChannels.seedDefaults(HOME);
    db.commsChannels.seedDefaults(HOME);
    const thrice = getStore().commsChannels.filter((c) => c.home_id === HOME).length;
    expect(thrice).toBe(once);
  });

  it("seeded channels carry their message threads too", () => {
    db.commsChannels.seedDefaults(HOME);
    expect(getStore().commsMessages.filter((m) => m.home_id === HOME).length).toBeGreaterThan(0);
  });
});
