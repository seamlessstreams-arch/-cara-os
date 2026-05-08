import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CommunityEngagement } from "@/types/extended";

const KEY = "community-engagements";

export function useCommunityEngagements() {
  return useQuery<{ data: CommunityEngagement[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/community-engagements").then((r) => r.json()),
  });
}

export function useCreateCommunityEngagement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CommunityEngagement>) =>
      fetch("/api/v1/community-engagements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
