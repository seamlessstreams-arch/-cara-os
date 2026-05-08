import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChildFriendlyPolicy } from "@/types/extended";

const KEY = "child-friendly-policies";
const API = "/api/v1/child-friendly-policies";

export function useChildFriendlyPolicies() {
  return useQuery<{ data: ChildFriendlyPolicy[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateChildFriendlyPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildFriendlyPolicy>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateChildFriendlyPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildFriendlyPolicy> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
