import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ContactSupervisionSession } from "@/types/extended";

const KEY = "contact-supervision-sessions";
const API = "/api/v1/contact-supervision-sessions";

export function useContactSupervisionSessions(childId?: string) {
  return useQuery<{ data: ContactSupervisionSession[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateContactSupervisionSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ContactSupervisionSession>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateContactSupervisionSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ContactSupervisionSession> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
