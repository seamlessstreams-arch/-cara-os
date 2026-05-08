import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PersonalPassport } from "@/types/extended";

const KEY = "personal-passports";
const API = "/api/v1/personal-passports";

export function usePersonalPassports(childId?: string) {
  return useQuery<{ data: PersonalPassport[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreatePersonalPassport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PersonalPassport>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePersonalPassport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PersonalPassport> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
