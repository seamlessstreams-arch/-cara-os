import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SuccessFactor } from "@/types/extended";

export function useSuccessFactors() {
  return useQuery<SuccessFactor[]>({
    queryKey: ["success-factors"],
    queryFn: async () => {
      const res = await fetch("/api/v1/success-factors");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });
}

export function useCreateSuccessFactor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SuccessFactor>) => {
      const res = await fetch("/api/v1/success-factors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["success-factors"] }),
  });
}
