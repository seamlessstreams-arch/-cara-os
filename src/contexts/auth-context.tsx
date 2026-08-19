"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — AUTH CONTEXT
// Provides the current user and role throughout the application.
// In production, replace the localStorage stub with NextAuth / Clerk session.
// ══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import { useClientValue } from "@/hooks/use-client-value";
import { useMounted } from "@/hooks/use-mounted";

// ── useStaff (inlined from use-staff) ───────────────────────────────────────

interface StaffEnriched extends StaffMember {
  is_on_shift_today: boolean;
  today_shift_type: string | null;
  today_shift_status: string | null;
  supervision_overdue: boolean;
  supervision_days_until_due: number | null;
  training_total_count: number;
  training_expired_count: number;
  training_expiring_count: number;
  active_tasks: number;
  overdue_tasks: number;
  is_on_leave_today: boolean;
  notifications_unread: number;
}

function useStaff(params?: { role?: string; status?: string; employment_type?: string }) {
  const query = new URLSearchParams();
  if (params?.role) query.set("role", params.role);
  if (params?.status) query.set("status", params.status);
  if (params?.employment_type) query.set("employment_type", params.employment_type);

  return useQuery({
    queryKey: ["staff", params],
    queryFn: () =>
      api.get<{ data: StaffEnriched[]; meta: Record<string, number> }>(`/staff?${query}`),
  });
}
import { toAppRole, type AppRole } from "@/lib/permissions";
import type { StaffMember } from "@/types";
import { DEMO_DEFAULT_USER_ID } from "@/lib/auth/current-user";

const SESSION_KEY = "cs_user_id";
const DEFAULT_USER_ID = DEMO_DEFAULT_USER_ID;

export interface AuthContextValue {
  /** The currently logged-in staff member. Null only during initial hydration. */
  currentUser: StaffMember | null;
  /** Derived AppRole from currentUser.role. Defaults to 'residential_care_worker' if user not found. */
  currentRole: AppRole;
  /** False only for the brief window before localStorage is read on the client. */
  isLoaded: boolean;
  /** Switch the active user by ID (demo / dev mode only). */
  setCurrentUserId: (id: string) => void;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  currentRole: "residential_care_worker",
  isLoaded: false,
  setCurrentUserId: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // The persisted user is an external store (localStorage), not React state:
  // "" on the server and during hydration, the stored id after. In-session
  // switches land in sessionUserId, so the derivation below prefers them.
  const storedUserId = useClientValue(
    () => {
      try { return localStorage.getItem(SESSION_KEY) ?? ""; } catch { return ""; }
    },
    "",
  );
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const userId = sessionUserId ?? (storedUserId || DEFAULT_USER_ID);
  const isLoaded = useMounted();

  const staffQuery = useStaff();
  const allStaff = staffQuery.data?.data ?? [];
  const currentUser: StaffMember | null =
    allStaff.find((s) => s.id === userId) ?? allStaff[0] ?? null;
  const currentRole: AppRole = toAppRole(currentUser?.role ?? "residential_care_worker");

  function setCurrentUserId(id: string) {
    setSessionUserId(id);
    try { localStorage.setItem(SESSION_KEY, id); } catch { /* ignore */ }
  }

  return (
    <AuthContext.Provider value={{ currentUser, currentRole, isLoaded, setCurrentUserId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}
