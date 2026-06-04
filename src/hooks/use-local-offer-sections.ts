import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LocalOfferSection } from "@/types/extended";

export function useLocalOfferSections() {
  return useQuery<LocalOfferSection[]>({
    queryKey: ["local-offer-sections"],
    queryFn: async () => {
      const res = await fetch("/api/v1/local-offer-sections");
      if (!res.ok) throw new Error("Failed to fetch local offer sections");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateLocalOfferSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<LocalOfferSection>) => {
      const res = await fetch("/api/v1/local-offer-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create local offer section");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["local-offer-sections"] }),
  });
}
