"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

// The app runs 778 useMutation calls and 261 files carry no onError at all —
// so a failed save closed its dialog and looked identical to success, on
// surfaces like welfare rounds and LADO referrals where "looks recorded" is
// the one thing that must never be false. This cache-level handler is the
// backstop: any mutation that does not handle its own error surfaces the
// failure. A local onError still wins — the backstop stays silent for it —
// and `meta: { silentError: true }` opts a mutation out deliberately.
// The read-side twin of the same bug. `rows = data?.data ?? []` turns a failed
// query into an empty array, and 103 pages then render "No welfare checks
// recorded yet" — a claim that nothing was recorded, made without ever having
// successfully looked. The per-page fix is EmptyState's `error` prop; this is
// the backstop that covers the pages not yet reached, and every future one.
//
// Deduped by query key: `refetchInterval` is 60s, so a persistently failing
// query would otherwise stack a new toast every minute. A stable id replaces
// the existing toast instead. `meta: { silentError: true }` opts out — for
// probes and optional side-panels where a failure is not worth interrupting.
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query.meta?.silentError) return;
        const detail =
          error instanceof Error && error.message ? error.message.slice(0, 140) : undefined;
        toast.error("Couldn't load that", {
          id: `query-error:${JSON.stringify(query.queryKey)}`,
          description:
            detail ?? "This screen may be showing less than there is — it could not reach the store.",
        });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.options.onError) return;
        if (mutation.meta?.silentError) return;
        const detail =
          error instanceof Error && error.message ? error.message.slice(0, 140) : undefined;
        toast.error("That didn't go through", {
          description: detail ?? "The change was not recorded — please try again.",
        });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,              // 30s — data doesn't change that fast in a care home
        gcTime: 5 * 60_000,             // 5 min garbage collection
        refetchOnWindowFocus: false,    // care staff switch tabs constantly, don't hammer API
        refetchInterval: 60_000,        // Refresh every 60s (live dashboard)
        retry: 1,
      },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
