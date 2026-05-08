import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PathwayPlan } from "@/types/extended";

const KEY = "pathway-plans";

async function fetchRecords(childId?: string): Promise<{ data: PathwayPlan[] }> {
  const url = childId ? `/api/v1/pathway-plans?child_id=${childId}` : "/api/v1/pathway-plans";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function usePathwayPlans(childId?: string) {
  return useQuery({ queryKey: childId ? [KEY, childId] : [KEY], queryFn: () => fetchRecords(childId) });
}

export function useCreatePathwayPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PathwayPlan>) => {
      const res = await fetch("/api/v1/pathway-plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePathwayPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PathwayPlan> & { id: string }) => {
      const res = await fetch("/api/v1/pathway-plans", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
