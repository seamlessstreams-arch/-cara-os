"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type {
  RelationshipsOverview,
  ChildRelationshipAnalysis,
} from "@/lib/protective-relationships/protective-relationships-engine";
import type { RelationshipEntry } from "@/lib/protective-relationships/types";
import type { SocialConvoy } from "@/lib/protective-relationships/social-convoy-engine";

/** Whole-home relationship overview + alerts. */
export function useRelationshipsOverview() {
  return useQuery({
    queryKey: ["protective-relationships", "overview"],
    queryFn: async () => (await api.get<{ data: RelationshipsOverview }>(`/protective-relationships`)).data,
  });
}

export interface ChildRelationships {
  childId: string;
  childName: string;
  entries: RelationshipEntry[];
  analysis: ChildRelationshipAnalysis;
  /** Convoy circles + network-shape detections over the same entries. */
  convoy: SocialConvoy;
}

/** A single child's relationship map + analysis. */
export function useChildRelationships(childId: string | undefined) {
  return useQuery({
    queryKey: ["protective-relationships", "child", childId],
    enabled: !!childId,
    queryFn: async () =>
      (await api.get<{ data: ChildRelationships }>(`/protective-relationships?child_id=${encodeURIComponent(childId!)}`)).data,
  });
}

export function useAddRelationship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { child_id: string; name: string } & Partial<RelationshipEntry>) =>
      (await api.post<{ data: RelationshipEntry }>(`/protective-relationships`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["protective-relationships"] }),
  });
}

export function useUpdateRelationship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string } & Partial<RelationshipEntry>) =>
      (await api.patch<{ data: RelationshipEntry }>(`/protective-relationships`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["protective-relationships"] }),
  });
}
