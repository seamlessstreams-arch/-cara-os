import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HomePolicy } from "@/types/extended";

export function useHomePolicies() {
  return useQuery<HomePolicy[]>({
    queryKey: ["home-policies"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-policies");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });
}

export function useCreateHomePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<HomePolicy>) => {
      const res = await fetch("/api/v1/home-policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-policies"] }),
  });
}
