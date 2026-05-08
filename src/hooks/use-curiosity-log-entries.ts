import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CuriosityLogEntry } from "@/types/extended";

export function useCuriosityLogEntries() {
  return useQuery<CuriosityLogEntry[]>({
    queryKey: ["curiosity-log-entries"],
    queryFn: async () => {
      const res = await fetch("/api/v1/curiosity-log-entries");
      if (!res.ok) throw new Error("Failed to fetch curiosity log entries");
      return res.json();
    },
  });
}

export function useCreateCuriosityLogEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CuriosityLogEntry>) => {
      const res = await fetch("/api/v1/curiosity-log-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create curiosity log entry");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["curiosity-log-entries"] }),
  });
}
