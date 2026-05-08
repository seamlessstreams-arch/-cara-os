import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StatutoryCheckRecord } from "@/types/extended";

export function useStatutoryCheckRecords() {
  return useQuery<StatutoryCheckRecord[]>({
    queryKey: ["statutory-check-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/statutory-check-records");
      if (!res.ok) throw new Error("Failed to fetch statutory check records");
      return res.json();
    },
  });
}

export function useCreateStatutoryCheckRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StatutoryCheckRecord, "id">) => {
      const res = await fetch("/api/v1/statutory-check-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create statutory check record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["statutory-check-records"] }),
  });
}
