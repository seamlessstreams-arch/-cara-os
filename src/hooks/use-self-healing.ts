"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Self-Healing Integrity hook (client)
// GET  /api/v1/self-healing            → scan (read-only) + recent heal-log
// POST /api/v1/self-healing {apply}    → apply safe repairs, return healed plan
// ══════════════════════════════════════════════════════════════════════════════

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HealEvent, SelfHealingPlan } from "@/lib/self-healing/types";

const KEY = "self-healing";
const URL = "/api/v1/self-healing";

export interface SelfHealingScan {
  plan: SelfHealingPlan;
  healLog: HealEvent[];
}

export function useSelfHealing() {
  return useQuery<{ data: SelfHealingScan }>({
    queryKey: [KEY],
    queryFn: () => fetch(URL).then((r) => r.json()),
    staleTime: 60 * 1000,
  });
}

export function useApplySelfHealing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "apply" }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
