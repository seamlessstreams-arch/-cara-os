import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HouseholdTask } from "@/types/extended";

const KEY = "household-tasks";

export function useHouseholdTasks(childId?: string) {
  return useQuery<{ data: HouseholdTask[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: async () => {
      const params = childId ? `?child_id=${childId}` : "";
      const res = await fetch(`/api/v1/household-tasks${params}`);
      return res.json();
    },
  });
}

export function useCreateHouseholdTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<HouseholdTask>) => {
      const res = await fetch("/api/v1/household-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
