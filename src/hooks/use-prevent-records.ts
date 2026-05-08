import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PreventRecord } from "@/types/extended";

export function usePreventRecords(childId?: string) {
  return useQuery<PreventRecord[]>({
    queryKey: ["prevent-records", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/prevent-records?child_id=${childId}`
        : "/api/v1/prevent-records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch prevent records");
      return res.json();
    },
  });
}

export function useCreatePreventRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PreventRecord>) => {
      const res = await fetch("/api/v1/prevent-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create prevent record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prevent-records"] }),
  });
}
