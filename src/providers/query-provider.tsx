"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,              // 30s — data doesn't change that fast in a care home
            gcTime: 5 * 60_000,             // 5 min garbage collection
            refetchOnWindowFocus: false,    // care staff switch tabs constantly, don't hammer API
            refetchInterval: 60_000,        // Refresh every 60s (live dashboard)
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
