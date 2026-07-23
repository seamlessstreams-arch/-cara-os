"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { KBEntry, KBEntryType, KBHeart, KBStatus } from "@/lib/cara/knowledge-base";

export type { KBEntry, KBEntryType, KBHeart, KBStatus };

export interface KBMeta {
  total: number;
  totalApproved: number;
  totalPendingReview: number;
  typeCounts: Record<KBEntryType, number>;
  tags: string[];
  schemaVersion: string;
}

export interface KBResponse {
  heart: KBHeart;
  entries: KBEntry[];
  meta: KBMeta;
}

export function useCaraKnowledgeBase(params?: {
  type?: KBEntryType;
  status?: "approved" | "pending_review" | "all";
  tag?: string;
}) {
  const query = new URLSearchParams();
  if (params?.type) query.set("type", params.type);
  if (params?.status) query.set("status", params.status);
  if (params?.tag) query.set("tag", params.tag);

  const qs = query.toString();

  return useQuery({
    queryKey: ["cara-knowledge-base", params],
    queryFn: () =>
      api.get<{ data: KBResponse }>(`/cara-knowledge-base${qs ? `?${qs}` : ""}`),
    staleTime: 300_000,
  });
}
