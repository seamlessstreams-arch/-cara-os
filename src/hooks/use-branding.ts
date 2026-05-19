"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  SystemBranding,
  OrganisationBranding,
  HomeBranding,
  BrandingAuditEntry,
  ResolvedBranding,
  SystemBrandingUpdate,
  OrganisationBrandingUpdate,
  HomeBrandingUpdate,
  LogoUploadResult,
} from "@/types/branding";
import { useAuthContext } from "@/contexts/auth-context";

// ── Query keys ─────────────────────────────────────────────────────────────────

export const BRANDING_KEYS = {
  system:             () => ["branding", "system"] as const,
  organisation:       (orgId: string) => ["branding", "organisation", orgId] as const,
  home:               (homeId: string) => ["branding", "home", homeId] as const,
  resolve:            (orgId?: string, homeId?: string) =>
    ["branding", "resolve", orgId, homeId] as const,
  audit:              (targetType?: string, targetId?: string) =>
    ["branding", "audit", targetType, targetId] as const,
};

// ── System branding ────────────────────────────────────────────────────────────

export function useSystemBranding() {
  return useQuery<SystemBranding>({
    queryKey: BRANDING_KEYS.system(),
    queryFn: async () => {
      const res = await fetch("/api/v1/branding/system");
      if (!res.ok) throw new Error("Failed to load system branding");
      const json = await res.json();
      return json.data as SystemBranding;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSystemBranding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: SystemBrandingUpdate & { updated_by?: string }) => {
      const res = await fetch("/api/v1/branding/system", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update system branding");
      return (await res.json()).data as SystemBranding;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BRANDING_KEYS.system() });
      qc.invalidateQueries({ queryKey: ["branding", "resolve"] });
    },
  });
}

// ── Organisation branding ──────────────────────────────────────────────────────

export function useOrganisationBranding(orgId = "org_oak") {
  return useQuery<OrganisationBranding | null>({
    queryKey: BRANDING_KEYS.organisation(orgId),
    queryFn: async () => {
      const res = await fetch(`/api/v1/branding/organisation?organisation_id=${orgId}`);
      if (!res.ok) throw new Error("Failed to load organisation branding");
      const json = await res.json();
      return json.data as OrganisationBranding | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateOrganisationBranding() {
  const qc = useQueryClient();
  const { currentUser } = useAuthContext();
  return useMutation({
    mutationFn: async ({
      organisation_id,
      ...updates
    }: OrganisationBrandingUpdate & { organisation_id: string; updated_by?: string }) => {
      const res = await fetch("/api/v1/branding/organisation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
          organisation_id,
          updated_by: currentUser?.id ?? "unknown",
        }),
      });
      if (!res.ok) throw new Error("Failed to update organisation branding");
      return (await res.json()).data as OrganisationBranding;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: BRANDING_KEYS.organisation(vars.organisation_id) });
      qc.invalidateQueries({ queryKey: ["branding", "resolve"] });
    },
  });
}

// ── Home branding ──────────────────────────────────────────────────────────────

export function useHomeBranding(homeId = "home_oak") {
  return useQuery<HomeBranding | null>({
    queryKey: BRANDING_KEYS.home(homeId),
    queryFn: async () => {
      const res = await fetch(`/api/v1/branding/home?home_id=${homeId}`);
      if (!res.ok) throw new Error("Failed to load home branding");
      const json = await res.json();
      return json.data as HomeBranding | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateHomeBranding() {
  const qc = useQueryClient();
  const { currentUser } = useAuthContext();
  return useMutation({
    mutationFn: async ({
      home_id,
      organisation_id,
      ...updates
    }: HomeBrandingUpdate & { home_id: string; organisation_id?: string; updated_by?: string }) => {
      const res = await fetch("/api/v1/branding/home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
          home_id,
          organisation_id: organisation_id ?? "org_oak",
          updated_by: currentUser?.id ?? "unknown",
        }),
      });
      if (!res.ok) throw new Error("Failed to update home branding");
      return (await res.json()).data as HomeBranding;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: BRANDING_KEYS.home(vars.home_id) });
      qc.invalidateQueries({ queryKey: ["branding", "resolve"] });
    },
  });
}

// ── Resolved branding ──────────────────────────────────────────────────────────

export function useResolvedBranding(orgId?: string, homeId?: string) {
  return useQuery<ResolvedBranding>({
    queryKey: BRANDING_KEYS.resolve(orgId, homeId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (orgId) params.set("organisation_id", orgId);
      if (homeId) params.set("home_id", homeId);
      const res = await fetch(`/api/v1/branding/resolve?${params}`);
      if (!res.ok) throw new Error("Failed to resolve branding");
      const json = await res.json();
      return json.data as ResolvedBranding;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── Logo upload ────────────────────────────────────────────────────────────────

export function useUploadBrandingLogo() {
  return useMutation({
    mutationFn: async (file: File): Promise<LogoUploadResult> => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/v1/branding/upload", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error((err as { error?: string }).error ?? "Upload failed");
      }
      return (await res.json()).data as LogoUploadResult;
    },
  });
}

// ── Audit log ──────────────────────────────────────────────────────────────────

export function useBrandingAuditLog(targetType?: string, targetId?: string) {
  return useQuery<BrandingAuditEntry[]>({
    queryKey: BRANDING_KEYS.audit(targetType, targetId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (targetType) params.set("target_type", targetType);
      if (targetId) params.set("target_id", targetId);
      const res = await fetch(`/api/v1/branding/audit?${params}`);
      if (!res.ok) throw new Error("Failed to load branding audit log");
      return (await res.json()).data as BrandingAuditEntry[];
    },
    staleTime: 60 * 1000,
  });
}
