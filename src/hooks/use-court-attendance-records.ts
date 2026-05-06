import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CourtAttendanceRecord } from "@/types/extended";

const KEY = "court-attendance-records";
const API = "/api/v1/court-attendance-records";

export function useCourtAttendanceRecords(childId?: string) {
  return useQuery<{ data: CourtAttendanceRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateCourtAttendanceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CourtAttendanceRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCourtAttendanceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CourtAttendanceRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
