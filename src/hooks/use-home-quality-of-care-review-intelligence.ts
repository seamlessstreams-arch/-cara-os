"use client";

import { useQuery } from "@tanstack/react-query";
import type { QualityOfCareReviewResult } from "@/lib/engines/home-quality-of-care-review-intelligence-engine";

interface QualityOfCareReviewResponse { data: QualityOfCareReviewResult; }

export function useHomeQualityOfCareReviewIntelligence() {
  return useQuery<QualityOfCareReviewResponse>({
    queryKey: ["home-quality-of-care-review-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-quality-of-care-review-intelligence");
      if (!res.ok) throw new Error("Failed to fetch quality of care review intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
