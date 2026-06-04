import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { QAAuditRecord } from "@/types/extended";

export function useQaAuditRecords() {
  return useQuery<QAAuditRecord[]>({
    queryKey: ["qa-audit-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/qa-audit-records");
      if (!res.ok) throw new Error("Failed to fetch QA audit records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateQaAuditRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<QAAuditRecord>) => {
      const res = await fetch("/api/v1/qa-audit-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create QA audit record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["qa-audit-records"] }),
  });
}
