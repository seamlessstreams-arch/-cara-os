"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA HQ — data hooks
//
// Demo persona: requests carry x-user-role: platform_admin (the same header
// convention the rest of the demo API uses). Real session identity replaces
// this at the service gate when Supabase Auth lands.
// ══════════════════════════════════════════════════════════════════════════════

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  HqAiUsageRow,
  HqBreakGlassGrant,
  HqOrganisation,
} from "@/lib/hq/hq-types";
import type {
  HqAiSummary,
  HqBreakGlassSummary,
  HqOverview,
  HqUsageSummary,
} from "@/lib/engines/platform-hq-engine";

const HQ_HEADERS = {
  "content-type": "application/json",
  "x-user-role": "platform_admin",
  "x-user-id": "hq_owner",
};

async function hqFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...HQ_HEADERS, ...init?.headers } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json.data as T;
}

export interface HqOverviewData {
  overview: HqOverview;
  mode: { durable: boolean; ai_configured: boolean };
}

export function useHqOverview() {
  return useQuery({
    queryKey: ["hq-overview"],
    queryFn: () => hqFetch<HqOverviewData>("/api/v1/hq/overview"),
  });
}

export function useHqCustomers() {
  return useQuery({
    queryKey: ["hq-customers"],
    queryFn: () => hqFetch<{ customers: HqOrganisation[] }>("/api/v1/hq/customers"),
  });
}

export interface HqCustomerDetail {
  customer: HqOrganisation;
  usage: HqUsageSummary;
  ai: HqAiSummary;
  break_glass: HqBreakGlassSummary;
}

export function useHqCustomer(id: string | null) {
  return useQuery({
    queryKey: ["hq-customer", id],
    queryFn: () => hqFetch<HqCustomerDetail>(`/api/v1/hq/customers/${id}`),
    enabled: Boolean(id),
  });
}

export interface HqAiUsageData {
  summary: HqAiSummary;
  org_names: Record<string, string>;
  recent: HqAiUsageRow[];
}

export function useHqAiUsage() {
  return useQuery({
    queryKey: ["hq-ai-usage"],
    queryFn: () => hqFetch<HqAiUsageData>("/api/v1/hq/ai-usage"),
  });
}

function useHqInvalidate() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["hq-overview"] }),
      qc.invalidateQueries({ queryKey: ["hq-customers"] }),
      qc.invalidateQueries({ queryKey: ["hq-customer"] }),
    ]);
}

export function useProvisionCustomer() {
  const invalidate = useHqInvalidate();
  return useMutation({
    mutationFn: (input: {
      org_name: string;
      first_home_name: string;
      plan: string;
      manager_name: string;
      manager_email: string;
    }) =>
      hqFetch<{ customer: HqOrganisation }>("/api/v1/hq/customers", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidate(),
  });
}

export function useSetCustomerStatus(id: string) {
  const invalidate = useHqInvalidate();
  return useMutation({
    mutationFn: (status: "active" | "suspended" | "churned") =>
      hqFetch<{ customer: HqOrganisation }>(`/api/v1/hq/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => invalidate(),
  });
}

export function useRecordBreakGlass(id: string) {
  const invalidate = useHqInvalidate();
  return useMutation({
    mutationFn: (input: { reason: string; hours: number }) =>
      hqFetch<{ grant: HqBreakGlassGrant }>(`/api/v1/hq/customers/${id}/break-glass`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidate(),
  });
}

export function useRevokeBreakGlass(id: string) {
  const invalidate = useHqInvalidate();
  return useMutation({
    mutationFn: (grantId: string) =>
      hqFetch<{ grant: HqBreakGlassGrant }>(`/api/v1/hq/customers/${id}/break-glass`, {
        method: "PATCH",
        body: JSON.stringify({ grant_id: grantId }),
      }),
    onSuccess: () => invalidate(),
  });
}
