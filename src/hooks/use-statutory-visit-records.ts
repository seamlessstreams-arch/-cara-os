import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StatutoryVisitRecord } from "@/types/extended";

export function useStatutoryVisitRecords(childId?: string) {
  return useQuery<StatutoryVisitRecord[]>({
    queryKey: ["statutory-visit-records", childId],
    queryFn: async () => {
      const params = childId ? `?child_id=${childId}` : "";
      const res = await fetch(`/api/v1/statutory-visit-records${params}`);
      if (!res.ok) throw new Error("Failed to fetch statutory visit records");
      return res.json();
    },
  });
}

export function useCreateStatutoryVisitRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StatutoryVisitRecord, "id">) => {
      const res = await fetch("/api/v1/statutory-visit-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create statutory visit record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["statutory-visit-records"] }),
  });
}
