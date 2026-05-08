"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BedtimeRoutine } from "@/types/extended";

const KEY = "bedtime-routines";

export function useBedtimeRoutines(childId?: string) {
  const qs = childId ? `?child_id=${childId}` : "";
  return useQuery<{ data: BedtimeRoutine[] }>({
    queryKey: [KEY, childId],
    queryFn: () => fetch(`/api/v1/bedtime-routines${qs}`).then((r) => r.json()),
  });
}

export function useCreateBedtimeRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BedtimeRoutine>) =>
      fetch("/api/v1/bedtime-routines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
