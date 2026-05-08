import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { YPSavingsAccountRecord } from "@/types/extended";

export function useYPSavingsAccountRecords(childId?: string) {
  return useQuery<YPSavingsAccountRecord[]>({
    queryKey: ["yp-savings-account-records", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/yp-savings-account-records?child_id=${childId}`
        : "/api/v1/yp-savings-account-records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch YP savings account records");
      return res.json();
    },
  });
}

export function useCreateYPSavingsAccountRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<YPSavingsAccountRecord, "id">) => {
      const res = await fetch("/api/v1/yp-savings-account-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create YP savings account record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["yp-savings-account-records"] }),
  });
}
