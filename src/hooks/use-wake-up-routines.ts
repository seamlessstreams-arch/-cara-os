"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WakeUpRoutine } from "@/types/extended";

const KEY = "wake-up-routines";

export function useWakeUpRoutines(childId?: string, homeId?: string) {
  const qs = childId ? `?child_id=${childId}` : homeId ? `?home_id=${homeId}` : "";
  return useQuery<{ data: WakeUpRoutine[] }>({
    queryKey: [KEY, childId, homeId],
    queryFn: () => fetch(`/api/v1/wake-up-routines${qs}`).then((r) => r.json()),
  });
}

export function useCreateWakeUpRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<WakeUpRoutine>) =>
      fetch("/api/v1/wake-up-routines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
