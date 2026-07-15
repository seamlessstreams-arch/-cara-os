import { describe, it, expect, beforeEach, vi } from "vitest";

// hq-service pulls in the store (20,537 lines); the first case pays that import
// cost and times out against the default 5s budget on a loaded runner.
vi.setConfig({ testTimeout: 30_000 });

// Provisioning is the master-admin path for standing up a real customer. The
// properties that matter are the ones that were broken:
//
//   1. the HOME is a real record, not a text note on the org — nothing in the
//      app wrote to `homes` before this;
//   2. a home that fails to persist is NOT reported as created;
//   3. reads come back from the database, because the store is
//      per-serverless-instance and a provisioned customer used to vanish from
//      the list on a cold start while still sitting in Postgres.

const persistHqHome = vi.fn();
const persistHqOrganisation = vi.fn();
const loadHqOrganisations = vi.fn();
const loadHqHomes = vi.fn();
const isSupabaseEnabled = vi.fn();

vi.mock("@/lib/supabase/hq-persist", () => ({
  persistHqHome: (...a: unknown[]) => persistHqHome(...a),
  persistHqOrganisation: (...a: unknown[]) => persistHqOrganisation(...a),
  loadHqOrganisations: (...a: unknown[]) => loadHqOrganisations(...a),
  loadHqHomes: (...a: unknown[]) => loadHqHomes(...a),
  persistHqUsageEvent: vi.fn(),
  persistHqOrgStatus: vi.fn(),
  persistHqBreakGlass: vi.fn(),
  persistHqBreakGlassRevoke: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => isSupabaseEnabled(),
  createServerClient: () => null,
}));

const actor = { id: "platform_admin", role: "platform_admin" } as never;
const input = {
  org_name: "Northside Care Ltd",
  first_home_name: "Willow House",
  first_home_address: "12 Willow Road, Derby, DE1 1AA",
  first_home_ofsted_urn: "SC999111",
  first_home_max_beds: 4,
  plan: "pilot" as const,
  manager_name: "Sam Okafor",
  manager_email: "sam@northside.example",
};

beforeEach(() => {
  vi.clearAllMocks();
  persistHqHome.mockResolvedValue({ ok: true });
  isSupabaseEnabled.mockReturnValue(false);
});

describe("provisionCustomer creates a real home", () => {
  it("writes a homes row carrying the address and links it to the org", async () => {
    const { provisionCustomer } = await import("@/lib/hq/hq-service");
    const res = await provisionCustomer(input, actor);

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.home.name).toBe("Willow House");
    expect(res.home.address).toBe("12 Willow Road, Derby, DE1 1AA");
    expect(res.home.ofsted_urn).toBe("SC999111");
    expect(res.home.max_beds).toBe(4);
    expect(res.home.org_id).toBe(res.org.id);
    expect(persistHqHome).toHaveBeenCalledOnce();
  });

  it("mints a uuid for the home — homes.id is a uuid column, not a generateId() string", async () => {
    const { provisionCustomer } = await import("@/lib/hq/hq-service");
    const res = await provisionCustomer(input, actor);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.home.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(res.home.id).not.toMatch(/^home_/);
  });

  it("treats a blank Ofsted URN as absent rather than empty string", async () => {
    const { provisionCustomer } = await import("@/lib/hq/hq-service");
    const res = await provisionCustomer({ ...input, first_home_ofsted_urn: "   " }, actor);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.home.ofsted_urn).toBeNull();
  });
});

describe("a home that cannot be written is not reported as created", () => {
  it("returns an error and creates no org when the homes insert fails", async () => {
    persistHqHome.mockResolvedValue({ ok: false, error: "duplicate key value violates unique constraint" });
    const { provisionCustomer } = await import("@/lib/hq/hq-service");
    const { getStore } = await import("@/lib/db/store");
    const before = getStore().hqOrganisations.length;

    const res = await provisionCustomer(input, actor);

    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toMatch(/home could not be created/i);
    // Nothing half-created: no org row for a home that does not exist.
    expect(getStore().hqOrganisations).toHaveLength(before);
    expect(persistHqOrganisation).not.toHaveBeenCalled();
  });
});

describe("the customer list is read back from the database", () => {
  it("reads from Supabase when it is connected, not from the in-memory store", async () => {
    isSupabaseEnabled.mockReturnValue(true);
    loadHqOrganisations.mockResolvedValue([{ id: "org_from_db", name: "From Postgres" }]);
    const { listCustomers } = await import("@/lib/hq/hq-service");

    const rows = await listCustomers();
    expect(loadHqOrganisations).toHaveBeenCalledOnce();
    expect(rows?.[0]?.id).toBe("org_from_db");
  });

  it("returns null (not []) when the database is connected but unreadable", async () => {
    // An empty platform and a broken read must not render identically.
    isSupabaseEnabled.mockReturnValue(true);
    loadHqOrganisations.mockResolvedValue(null);
    loadHqHomes.mockResolvedValue(null);
    const { listCustomers, listHomes } = await import("@/lib/hq/hq-service");
    expect(await listCustomers()).toBeNull();
    expect(await listHomes()).toBeNull();
  });

  it("falls back to the store in demo mode", async () => {
    isSupabaseEnabled.mockReturnValue(false);
    const { listCustomers } = await import("@/lib/hq/hq-service");
    const rows = await listCustomers();
    expect(loadHqOrganisations).not.toHaveBeenCalled();
    expect(Array.isArray(rows)).toBe(true);
  });
});
