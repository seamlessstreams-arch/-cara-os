import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ServiceUserAgreementRecord } from "@/types/extended";

export function useServiceUserAgreementRecords(childId?: string) {
  return useQuery<ServiceUserAgreementRecord[]>({
    queryKey: ["service-user-agreement-records", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/service-user-agreement-records?child_id=${childId}`
        : "/api/v1/service-user-agreement-records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch service user agreement records");
      return res.json();
    },
  });
}

export function useCreateServiceUserAgreementRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<ServiceUserAgreementRecord, "id">) => {
      const res = await fetch("/api/v1/service-user-agreement-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create service user agreement record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-user-agreement-records"] }),
  });
}
