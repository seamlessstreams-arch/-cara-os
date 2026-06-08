"use client";

import { useQuery } from "@tanstack/react-query";
import type { ChildReviewPackResult } from "@/lib/engines/child-review-pack-engine";

export interface ChildReviewPackResponse {
  children: { id: string; name: string }[];
  pack: ChildReviewPackResult | null;
}

export function useChildReviewPack(childId: string | null) {
  return useQuery<ChildReviewPackResponse>({
    queryKey: ["child-review-pack", childId ?? "none"],
    queryFn: async () => {
      const qs = childId ? `?childId=${encodeURIComponent(childId)}` : "";
      const res = await fetch(`/api/v1/child-review-pack${qs}`);
      if (!res.ok) throw new Error("Failed to fetch child review pack");
      const json = await res.json();
      return json.data;
    },
  });
}
