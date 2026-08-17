import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MutationOptions } from "@tanstack/react-query";
import { makeQueryClient } from "@/providers/query-provider";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// 261 files run mutations with no onError at all, so a failed save closed its
// dialog and looked identical to success — the UX face of fabricate-on-empty.
// The MutationCache backstop must surface exactly those, and ONLY those.
// Exercised through the same cache.build/execute path useMutation drives.
async function run(options: MutationOptions<unknown, Error, void>) {
  const qc = makeQueryClient();
  const mutation = qc.getMutationCache().build(qc, options);
  await mutation.execute(undefined).catch(() => {});
}

describe("global mutation error backstop", () => {
  beforeEach(() => vi.clearAllMocks());

  it("a mutation with no onError surfaces its failure as a toast", async () => {
    await run({ mutationFn: () => Promise.reject(new Error("HTTP 500")) });
    expect(toast.error).toHaveBeenCalledWith(
      "That didn't go through",
      expect.objectContaining({ description: "HTTP 500" }),
    );
  });

  it("a mutation handling its own error keeps the backstop silent", async () => {
    const own = vi.fn();
    await run({ mutationFn: () => Promise.reject(new Error("boom")), onError: own });
    expect(own).toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("meta.silentError opts out deliberately", async () => {
    await run({ mutationFn: () => Promise.reject(new Error("boom")), meta: { silentError: true } });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("an errorless rejection still gets an honest description", async () => {
    await run({ mutationFn: () => Promise.reject(new Error("")) });
    expect(toast.error).toHaveBeenCalledWith(
      "That didn't go through",
      expect.objectContaining({ description: "The change was not recorded — please try again." }),
    );
  });

  it("a successful mutation stays quiet", async () => {
    await run({ mutationFn: () => Promise.resolve({ ok: true }) });
    expect(toast.error).not.toHaveBeenCalled();
  });
});

// ── The read-side twin ───────────────────────────────────────────────────────
//
// `rows = data?.data ?? []` turns a failed query into an empty array, and 103
// pages then rendered "No welfare checks recorded yet" — an absence asserted
// without a successful read. The per-page fix is EmptyState's `error` prop;
// this cache-level handler is the backstop for the pages not yet reached.
async function read(queryKey: unknown[], queryFn: () => Promise<unknown>, meta?: Record<string, unknown>) {
  const qc = makeQueryClient();
  await qc.fetchQuery({ queryKey, queryFn, retry: false, meta }).catch(() => {});
}

describe("global query error backstop", () => {
  beforeEach(() => vi.clearAllMocks());

  it("a failed read surfaces, so an empty screen is not mistaken for an empty store", async () => {
    await read(["welfare-checks"], () => Promise.reject(new Error("HTTP 500")));
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't load that",
      expect.objectContaining({ description: "HTTP 500" }),
    );
  });

  it("dedupes by query key — a 60s refetchInterval must not stack a toast a minute", async () => {
    await read(["welfare-checks", { date: "2026-08-16" }], () => Promise.reject(new Error("nope")));
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't load that",
      expect.objectContaining({ id: 'query-error:["welfare-checks",{"date":"2026-08-16"}]' }),
    );
  });

  it("says what the consequence is when the error carries no message", async () => {
    await read(["x"], () => Promise.reject(new Error("")));
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't load that",
      expect.objectContaining({
        description: "This screen may be showing less than there is — it could not reach the store.",
      }),
    );
  });

  it("meta.silentError opts a probe out deliberately", async () => {
    await read(["probe"], () => Promise.reject(new Error("boom")), { silentError: true });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("a successful read stays quiet", async () => {
    await read(["ok"], () => Promise.resolve({ data: [] }));
    expect(toast.error).not.toHaveBeenCalled();
  });
});
