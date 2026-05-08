import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChildFeedbackLoop } from "@/types/extended";

const KEY = "child-feedback-loops";
const API = "/api/v1/child-feedback-loops";

export function useChildFeedbackLoops(childId?: string) {
  return useQuery<{ data: ChildFeedbackLoop[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateChildFeedbackLoop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildFeedbackLoop>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateChildFeedbackLoop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildFeedbackLoop> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
