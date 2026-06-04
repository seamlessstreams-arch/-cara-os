import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UnannouncedVisitRecord } from "@/types/extended";

export function useUnannouncedVisitRecords() {
  return useQuery<UnannouncedVisitRecord[]>({
    queryKey: ["unannounced-visit-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/unannounced-visit-records");
      if (!res.ok) throw new Error("Failed to fetch unannounced visit records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateUnannouncedVisitRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<UnannouncedVisitRecord, "id">) => {
      const res = await fetch("/api/v1/unannounced-visit-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create unannounced visit record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["unannounced-visit-records"] }),
  });
}
