import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EmergencyReferral } from "@/types/extended";

const KEY = "emergency-referrals";
const API = "/api/v1/emergency-referrals";

export function useEmergencyReferrals() {
  return useQuery<{ data: EmergencyReferral[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateEmergencyReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EmergencyReferral>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateEmergencyReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EmergencyReferral> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
