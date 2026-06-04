import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SaferRecruitmentRecord } from "@/types/extended";

export function useSaferRecruitmentRecords() {
  return useQuery<SaferRecruitmentRecord[]>({
    queryKey: ["safer-recruitment-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/safer-recruitment-records");
      if (!res.ok) throw new Error("Failed to fetch safer recruitment records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateSaferRecruitmentRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SaferRecruitmentRecord>) => {
      const res = await fetch("/api/v1/safer-recruitment-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create safer recruitment record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["safer-recruitment-records"] }),
  });
}
