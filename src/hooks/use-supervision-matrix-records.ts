import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupervisionMatrixRecord } from "@/types/extended";

export function useSupervisionMatrixRecords() {
  return useQuery<SupervisionMatrixRecord[]>({
    queryKey: ["supervision-matrix-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/supervision-matrix-records");
      if (!res.ok) throw new Error("Failed to fetch supervision matrix records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateSupervisionMatrixRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<SupervisionMatrixRecord, "id">) => {
      const res = await fetch("/api/v1/supervision-matrix-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create supervision matrix record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supervision-matrix-records"] }),
  });
}
