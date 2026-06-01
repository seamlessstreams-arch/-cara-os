"use client";

// ==============================================================================
// CORNERSTONE — SEARCH HOOK
//
// Debounced React Query hook for full-text search.
// Only fires when query is at least 2 characters.
// ==============================================================================

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { api } from "./use-api";
import type { SearchResponse, SearchResultType } from "@/lib/search/search-engine";

interface UseSearchOptions {
  types?: SearchResultType[];
  homeId?: string;
  limit?: number;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useSearch(query: string, options?: UseSearchOptions) {
  const debouncedQuery = useDebounce(query.trim(), 300);

  const enabled = debouncedQuery.length >= 2;

  const params = new URLSearchParams();
  if (enabled) params.set("q", debouncedQuery);
  if (options?.types?.length) params.set("types", options.types.join(","));
  if (options?.homeId) params.set("home_id", options.homeId);
  if (options?.limit) params.set("limit", String(options.limit));

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["search", debouncedQuery, options?.types, options?.homeId, options?.limit],
    queryFn: () => api.get<SearchResponse>(`/search?${params}`),
    enabled,
    staleTime: 30_000,
    gcTime: 60_000,
  });

  return {
    results: data?.results ?? [],
    total: data?.total ?? 0,
    facets: data?.facets ?? [],
    query: data?.query ?? debouncedQuery,
    tookMs: data?.took_ms ?? 0,
    isLoading: enabled && (isLoading || isFetching),
    error,
  };
}
