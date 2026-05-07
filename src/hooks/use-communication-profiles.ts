import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CommunicationProfile } from "@/types/extended";

const KEY = "communication-profiles";

export function useCommunicationProfiles(childId?: string) {
  return useQuery<{ data: CommunicationProfile[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () =>
      fetch(
        childId
          ? `/api/v1/communication-profiles?child_id=${childId}`
          : "/api/v1/communication-profiles"
      ).then((r) => r.json()),
  });
}

export function useCreateCommunicationProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CommunicationProfile>) =>
      fetch("/api/v1/communication-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCommunicationProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CommunicationProfile> & { id: string }) =>
      fetch("/api/v1/communication-profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
