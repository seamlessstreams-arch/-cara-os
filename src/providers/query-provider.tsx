"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

// The app runs 778 useMutation calls and 261 files carry no onError at all —
// so a failed save closed its dialog and looked identical to success, on
// surfaces like welfare rounds and LADO referrals where "looks recorded" is
// the one thing that must never be false. This cache-level handler is the
// backstop: any mutation that does not handle its own error surfaces the
// failure. A local onError still wins — the backstop stays silent for it —
// and `meta: { silentError: true }` opts a mutation out deliberately.
export function makeQueryClient(): QueryClient {
  return new QueryClient({
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
