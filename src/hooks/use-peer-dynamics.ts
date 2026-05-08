import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PeerDynamic } from "@/types/extended";

const KEY = "peer-dynamics";
const API = "/api/v1/peer-dynamics";

export function usePeerDynamics() {
  return useQuery<{ data: PeerDynamic[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreatePeerDynamic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PeerDynamic>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePeerDynamic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PeerDynamic> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
