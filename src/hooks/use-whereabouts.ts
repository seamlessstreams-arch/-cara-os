"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { InOutBoard } from "@/lib/whereabouts/whereabouts-engine";

export type { InOutBoard };

type Response = { data: InOutBoard };

/** The child in-out board (read-only). Refetches every minute — it's a live board. */
export function useWhereabouts() {
  return useQuery({
    queryKey: ["whereabouts"],
    queryFn: () => api.get<Response>("/whereabouts"),
    staleTime: 30_000,
    refetchInterval: 60_000,
    gcTime: 5 * 60_000,
  });
}
