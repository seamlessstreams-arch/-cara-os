import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HouseRule } from "@/types/extended";

const KEY = "house-rules";

export function useHouseRules() {
  return useQuery<{ data: HouseRule[] }>({
    queryKey: [KEY],
    queryFn: async () => {
      const res = await fetch("/api/v1/house-rules");
      return res.json();
    },
  });
}

export function useCreateHouseRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<HouseRule>) => {
      const res = await fetch("/api/v1/house-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
