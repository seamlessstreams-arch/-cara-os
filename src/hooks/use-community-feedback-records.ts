import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CommunityFeedbackRecord } from "@/types/extended";

const KEY = "community-feedback-records";
const API = "/api/v1/community-feedback-records";

export function useCommunityFeedbackRecords() {
  return useQuery<{ data: CommunityFeedbackRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateCommunityFeedbackRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CommunityFeedbackRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCommunityFeedbackRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CommunityFeedbackRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
