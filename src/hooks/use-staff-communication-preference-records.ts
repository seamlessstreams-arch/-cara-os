import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StaffCommunicationPreferenceRecord } from "@/types/extended";

export function useStaffCommunicationPreferenceRecords() {
  return useQuery<StaffCommunicationPreferenceRecord[]>({
    queryKey: ["staff-communication-preference-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/staff-communication-preference-records");
      if (!res.ok) throw new Error("Failed to fetch staff communication preference records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateStaffCommunicationPreferenceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StaffCommunicationPreferenceRecord, "id">) => {
      const res = await fetch("/api/v1/staff-communication-preference-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create staff communication preference record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-communication-preference-records"] }),
  });
}
