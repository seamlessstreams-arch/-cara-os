import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CulturalReligiousMentor } from "@/types/extended";

const KEY = "cultural-religious-mentors";
const API = "/api/v1/cultural-religious-mentors";

export function useCulturalReligiousMentors(childId?: string) {
  return useQuery<{ data: CulturalReligiousMentor[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateCulturalReligiousMentor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CulturalReligiousMentor>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCulturalReligiousMentor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CulturalReligiousMentor> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
