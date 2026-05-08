import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HairAppointment } from "@/types/extended";

const KEY = "hair-appointments";
const API = "/api/v1/hair-appointments";

export function useHairAppointments(childId?: string) {
  return useQuery<{ data: HairAppointment[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateHairAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HairAppointment>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateHairAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HairAppointment> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
