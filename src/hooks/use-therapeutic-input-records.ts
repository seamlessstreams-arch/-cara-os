import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TherapeuticInputRecord } from "@/types/extended";

export function useTherapeuticInputRecords(childId?: string) {
  return useQuery<TherapeuticInputRecord[]>({
    queryKey: ["therapeutic-input-records", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/therapeutic-input-records?child_id=${childId}`
        : "/api/v1/therapeutic-input-records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch therapeutic input records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateTherapeuticInputRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<TherapeuticInputRecord, "id">) => {
      const res = await fetch("/api/v1/therapeutic-input-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create therapeutic input record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["therapeutic-input-records"] }),
  });
}
