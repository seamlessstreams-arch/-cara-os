import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RegulatoryCorrespondenceLetter } from "@/types/extended";

const KEY = ["regulatory-correspondence-letters"];

async function fetchAll(): Promise<RegulatoryCorrespondenceLetter[]> {
  const res = await fetch("/api/v1/regulatory-correspondence-letters");
  if (!res.ok) throw new Error("Failed to fetch regulatory correspondence letters");
  return res.json();
}

export function useRegulatoryCorrespondenceLetters() {
  return useQuery<RegulatoryCorrespondenceLetter[]>({ queryKey: KEY, queryFn: fetchAll });
}

export function useCreateRegulatoryCorrespondenceLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<RegulatoryCorrespondenceLetter>) => {
      const res = await fetch("/api/v1/regulatory-correspondence-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create regulatory correspondence letter");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
