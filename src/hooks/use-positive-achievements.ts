import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PositiveAchievement } from "@/types/extended";

export function usePositiveAchievements(childId?: string) {
  return useQuery<PositiveAchievement[]>({
    queryKey: ["positive-achievements", childId],
    queryFn: async () => {
      const params = childId ? `?child_id=${childId}` : "";
      const res = await fetch(`/api/v1/positive-achievements${params}`);
      if (!res.ok) throw new Error("Failed to fetch positive achievements");
      return res.json();
    },
  });
}

export function useCreatePositiveAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PositiveAchievement>) => {
      const res = await fetch("/api/v1/positive-achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create positive achievement");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["positive-achievements"] }),
  });
}
