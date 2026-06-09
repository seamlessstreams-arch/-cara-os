"use client";

import { useQuery } from "@tanstack/react-query";
import type { OfstedWorkforceEvidence } from "@/lib/engines/ofsted-workforce-evidence-engine";

export function useOfstedWorkforceEvidence() {
  return useQuery<OfstedWorkforceEvidence>({
    queryKey: ["ofsted-workforce-evidence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/ofsted-workforce-evidence");
      if (!res.ok) throw new Error("Failed to fetch workforce evidence");
      return (await res.json()).data;
    },
    refetchInterval: 120_000,
  });
}
