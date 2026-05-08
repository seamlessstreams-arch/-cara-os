import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChildStaffFeedback } from "@/types/extended";

const KEY = "child-staff-feedback";
const API = "/api/v1/child-staff-feedback";

export function useChildStaffFeedback(childId?: string) {
  return useQuery<{ data: ChildStaffFeedback[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateChildStaffFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildStaffFeedback>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateChildStaffFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildStaffFeedback> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
