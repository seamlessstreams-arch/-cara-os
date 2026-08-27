import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { storageFailure } from "../storage-error";

// The routes that persist to Supabase used to answer a failed query with a bare
// 500 "A server error occurred." — which took a whole page down without saying
// which feature was unavailable or why. These tests pin the replacement's
// contract, and above all that a failed read never comes back looking empty.

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("storageFailure", () => {
  it("reports a missing table as storage that is not set up, not a server fault", async () => {
    // 42P01 = undefined_table: the usual shape when a migration was applied to
    // one environment but not another
    const res = storageFailure("Manager attention items", {
      code: "42P01",
      message: 'relation "manager_attention_items" does not exist',
    });
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.storage_unavailable).toBe(true);
    expect(body.storage_missing).toBe(true);
    expect(body.code).toBe("42P01");
    expect(body.feature).toBe("Manager attention items");
    expect(body.error).toContain("not set up in this environment");
  });

  it("NEVER returns data — an empty list would read as 'nothing recorded'", async () => {
    const res = storageFailure("Incident learning reviews", { code: "42P01" });
    const body = await res.json();

    // the fabricated-absence prohibition: a failed read must be impossible to
    // mistake for a home with nothing on file
    expect(body.ok).toBe(false);
    expect(body).not.toHaveProperty("items");
    expect(body).not.toHaveProperty("data");
    expect(body).not.toHaveProperty("reviews");
  });

  it("distinguishes a transient failure from missing storage", async () => {
    const res = storageFailure("Regulation 44 visits", {
      code: "57014",
      message: "canceling statement due to statement timeout",
    });
    const body = await res.json();

    expect(body.storage_unavailable).toBe(true);
    expect(body.storage_missing).toBe(false); // the table is there; the request failed
    expect(body.error).toContain("storage request failed");
  });

  it("survives an error object with no code at all", async () => {
    const res = storageFailure("Evidence items", null);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.code).toBeNull();
    expect(body.storage_missing).toBe(false);
  });

  it("logs the underlying error server-side, naming the feature", () => {
    const spy = vi.spyOn(console, "error");
    storageFailure("HR cases", { code: "42P01", message: "boom" });

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("HR cases"),
      expect.objectContaining({ code: "42P01" }),
    );
  });
});
