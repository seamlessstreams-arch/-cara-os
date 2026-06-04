import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Reg46Review } from "@/types/extended";

export function useReg46Reviews() {
  return useQuery<Reg46Review[]>({
    queryKey: ["reg46-reviews"],
    queryFn: async () => {
      const res = await fetch("/api/v1/reg46-reviews");
      if (!res.ok) throw new Error("Failed to fetch Reg 46 reviews");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateReg46Review() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Reg46Review>) => {
      const res = await fetch("/api/v1/reg46-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create Reg 46 review");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reg46-reviews"] }),
  });
}
