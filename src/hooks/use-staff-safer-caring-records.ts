import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StaffSaferCaringRecord } from "@/types/extended";

export function useStaffSaferCaringRecords() {
  return useQuery<StaffSaferCaringRecord[]>({
    queryKey: ["staff-safer-caring-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/staff-safer-caring-records");
      if (!res.ok) throw new Error("Failed to fetch staff safer caring records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateStaffSaferCaringRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StaffSaferCaringRecord, "id">) => {
      const res = await fetch("/api/v1/staff-safer-caring-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create staff safer caring record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-safer-caring-records"] }),
  });
}
