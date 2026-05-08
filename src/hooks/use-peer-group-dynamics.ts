import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PeerGroupDynamic } from "@/types/extended";

const KEY = "peer-group-dynamics";
const API = "/api/v1/peer-group-dynamics";

export function usePeerGroupDynamics() {
  return useQuery<{ data: PeerGroupDynamic[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreatePeerGroupDynamic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PeerGroupDynamic>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePeerGroupDynamic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PeerGroupDynamic> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
