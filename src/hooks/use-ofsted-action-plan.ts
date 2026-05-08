import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OfstedActionItem } from "@/types/extended";

const KEY = "ofsted-action-items";

async function fetchRecords(): Promise<{ data: OfstedActionItem[] }> {
  const res = await fetch("/api/v1/ofsted-action-items");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function useOfstedActionPlan() {
  return useQuery({ queryKey: [KEY], queryFn: fetchRecords });
}

export function useCreateOfstedActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OfstedActionItem>) => {
      const res = await fetch("/api/v1/ofsted-action-items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateOfstedActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OfstedActionItem> & { id: string }) => {
      const res = await fetch("/api/v1/ofsted-action-items", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
