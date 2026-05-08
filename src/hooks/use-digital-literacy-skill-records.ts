import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DigitalLiteracySkillRecord } from "@/types/extended";

const KEY = "digital-literacy-skill-records";
const API = "/api/v1/digital-literacy-skill-records";

export function useDigitalLiteracySkillRecords(childId?: string) {
  return useQuery<{ data: DigitalLiteracySkillRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateDigitalLiteracySkillRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DigitalLiteracySkillRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateDigitalLiteracySkillRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DigitalLiteracySkillRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
