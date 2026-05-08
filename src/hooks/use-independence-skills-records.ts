import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { IndependenceSkillsRecord } from "@/types/extended";

const KEY = "independence-skills-records";

export function useIndependenceSkillsRecords(childId?: string) {
  return useQuery<{ data: IndependenceSkillsRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () =>
      fetch(childId ? `/api/v1/independence-skills-records?child_id=${childId}` : "/api/v1/independence-skills-records").then((r) => r.json()),
  });
}

export function useCreateIndependenceSkillsRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IndependenceSkillsRecord>) =>
      fetch("/api/v1/independence-skills-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
