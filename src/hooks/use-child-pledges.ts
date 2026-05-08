import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChildPledge } from "@/types/extended";

const KEY = "child-pledges";

export function useChildPledges() {
  return useQuery<{ data: ChildPledge[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/child-pledges").then((r) => r.json()),
  });
}

export function useCreateChildPledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildPledge>) =>
      fetch("/api/v1/child-pledges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
