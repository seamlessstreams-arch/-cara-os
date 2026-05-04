"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Outcomes Tracker Hook
// React Query wrapper for /api/v1/outcomes
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OutcomeTarget, OutcomeReview, OutcomeDomain, OutcomeRating, OutcomeDirection } from "@/types/extended";

interface OutcomesResponse {
  data: OutcomeTarget[];
  reviews: OutcomeReview[];
  meta: {
    total_targets: number;
    active_targets: number;
    improving: number;
    stable: number;
    declining: number;
    achieved: number;
    avg_rating: number;
    reviews_due_soon: number;
    total_reviews: number;
  };
  per_child: {
    child_id: string;
    active_targets: number;
    avg_rating: number;
    improving: number;
    stable: number;
    declining: number;
  }[];
  per_domain: {
    domain: OutcomeDomain;
    count: number;
    avg_rating: number;
    improving: number;
    declining: number;
  }[];
}

interface UseOutcomesParams {
  childId?: string;
  domain?: OutcomeDomain;
}

export function useOutcomes(params?: UseOutcomesParams) {
  const qs = new URLSearchParams();
  if (params?.childId) qs.set("child_id", params.childId);
  if (params?.domain)  qs.set("domain", params.domain);

  return useQuery<OutcomesResponse>({
    queryKey: ["outcomes", params?.childId, params?.domain],
    queryFn: async () => {
      const res = await fetch(`/api/v1/outcomes?${qs.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch outcomes");
      return res.json();
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useCreateOutcomeTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OutcomeTarget>) => {
      const res = await fetch("/api/v1/outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create outcome target");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outcomes"] }),
  });
}

export function useCreateOutcomeReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      target_id: string;
      new_rating: OutcomeRating;
      progress_notes: string;
      yp_participated?: boolean;
      yp_voice?: string;
      barriers?: string;
      next_steps?: string;
      reviewer_id?: string;
      reviewer_role?: string;
    }) => {
      const res = await fetch("/api/v1/outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "review", ...data }),
      });
      if (!res.ok) throw new Error("Failed to create outcome review");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outcomes"] }),
  });
}
