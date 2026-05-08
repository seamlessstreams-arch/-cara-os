import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SubjectAccessRequestRecord } from "@/types/extended";

export function useSubjectAccessRequestRecords() {
  return useQuery<SubjectAccessRequestRecord[]>({
    queryKey: ["subject-access-request-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/subject-access-request-records");
      if (!res.ok) throw new Error("Failed to fetch subject access request records");
      return res.json();
    },
  });
}

export function useCreateSubjectAccessRequestRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<SubjectAccessRequestRecord, "id">) => {
      const res = await fetch("/api/v1/subject-access-request-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create subject access request record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subject-access-request-records"] }),
  });
}
