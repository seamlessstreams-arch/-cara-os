"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { WritingToChildInput, WritingToChildReview } from "@/lib/writing-to-child/types";
import type { WritingExample } from "@/lib/writing-to-child/examples";
import type { WritingNode, WritingRecordType } from "@/lib/writing-to-child";

/** Review a draft record for child-readability (deterministic; AI-enriched when configured). */
export function useReviewWritingToChild() {
  return useMutation({
    mutationFn: (input: WritingToChildInput) =>
      api.post<{ data: WritingToChildReview }>("/writing-to-child", input),
  });
}

/** Example scenarios + the supported record types (for the UI demo + selector). */
export function useWritingExamples() {
  return useQuery({
    queryKey: ["writing-to-child", "examples"],
    queryFn: () => api.get<{ data: { examples: WritingExample[]; recordTypes: WritingRecordType[]; principle: string } }>("/writing-to-child?examples=1"),
    staleTime: 10 * 60_000,
  });
}

/** The ten-node knowledge network. */
export function useWritingNodes() {
  return useQuery({
    queryKey: ["writing-to-child", "nodes"],
    queryFn: () => api.get<{ data: { nodes: WritingNode[]; principle: string; disclaimer: string } }>("/writing-to-child?nodes=1"),
    staleTime: 10 * 60_000,
  });
}
