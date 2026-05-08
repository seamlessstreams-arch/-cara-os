import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChildrensRightEntry } from "@/types/extended";

export function useChildrensRights() {
  return useQuery<ChildrensRightEntry[]>({
    queryKey: ["childrens-rights"],
    queryFn: async () => {
      const res = await fetch("/api/v1/childrens-rights");
      if (!res.ok) throw new Error("Failed to fetch children's rights");
      return res.json();
    },
  });
}

export function useCreateChildrensRight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ChildrensRightEntry>) => {
      const res = await fetch("/api/v1/childrens-rights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create children's right");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["childrens-rights"] }),
  });
}
