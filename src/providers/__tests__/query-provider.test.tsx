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
