import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FriendshipMap } from "@/types/extended";

const KEY = "friendship-maps";
const API = "/api/v1/friendship-maps";

export function useFriendshipMaps(childId?: string) {
  return useQuery<{ data: FriendshipMap[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateFriendshipMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FriendshipMap>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateFriendshipMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FriendshipMap> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
