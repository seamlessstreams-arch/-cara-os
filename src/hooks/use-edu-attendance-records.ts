import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EduAttendanceRecord } from "@/types/extended";

const KEY = "edu-attendance-records";
const API = "/api/v1/edu-attendance-records";

export function useEduAttendanceRecords(childId?: string) {
  return useQuery<{ data: EduAttendanceRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateEduAttendanceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EduAttendanceRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateEduAttendanceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EduAttendanceRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
