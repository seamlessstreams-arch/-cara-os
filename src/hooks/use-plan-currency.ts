"use client";

import { useQuery } from "@tanstack/react-query";
import type { PlanCurrencyResult } from "@/lib/engines/plan-currency-engine";

export function usePlanCurrency() {
  return useQuery<PlanCurrencyResult>({
    queryKey: ["plan-currency"],
    queryFn: async () => {
      const res = await fetch("/api/v1/plan-currency");
      if (!res.ok) throw new Error("Failed to fetch plan currency");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 120_000,
  });
}
