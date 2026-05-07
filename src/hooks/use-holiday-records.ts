import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HolidayRecord } from "@/types/extended";

const KEY = "holiday-records";

export function useHolidayRecords(childId?: string) {
  return useQuery<{ data: HolidayRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () =>
      fetch(
        childId
          ? `/api/v1/holiday-records?child_id=${childId}`
          : "/api/v1/holiday-records"
      ).then((r) => r.json()),
  });
}

export function useCreateHolidayRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HolidayRecord>) =>
      fetch("/api/v1/holiday-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateHolidayRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HolidayRecord> & { id: string }) =>
      fetch("/api/v1/holiday-records", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
