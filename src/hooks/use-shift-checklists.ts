import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ShiftChecklist } from "@/types/extended";

const KEY = "shift-checklists";

export function useShiftChecklists() {
  return useQuery<{ data: ShiftChecklist[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/shift-checklists").then((r) => r.json()),
  });
}

export function useCreateShiftChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ShiftChecklist>) =>
      fetch("/api/v1/shift-checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
