"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — AUTH CONTEXT
// Provides the current user and role throughout the application.
// In production, replace the localStorage stub with NextAuth / Clerk session.
// ══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useEffect, useState } from "react";
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
import { DEMO_DEFAULT_USER_ID, setSessionUserId as publishSessionUserId } from "@/lib/auth/current-user";
import { isLiveTenant } from "@/lib/db/live-mode";

const SESSION_KEY = "cs_user_id";
const DEFAULT_USER_ID = DEMO_DEFAULT_USER_ID;

export interface AuthContextValue {
  /** The signed-in staff member. Null during hydration, and on a live tenant
   *  whenever the session cannot be resolved to a staff_members row — see
   *  `identityUnresolved`. NEVER a stand-in for someone else. */
  currentUser: StaffMember | null;
  /** Derived AppRole from currentUser.role. Falls back to the LEAST privileged
   *  role, never to whichever staff member happened to load first. */
  currentRole: AppRole;
  /** False only for the brief window before the client has read its identity. */
  isLoaded: boolean;
  /** Switch the active user by ID (demo / dev mode only — a no-op on live). */
  setCurrentUserId: (id: string) => void;
  /** Live tenant only: loaded, but the session names no staff record. The app
   *  must not guess who this is; surfaces should say so rather than render. */
  identityUnresolved: boolean;
  /** The home this session belongs to, from /me. Null until resolved. Pages
   *  hardcoded "home_oak" for this, a seed id that is not any real home. */
  homeId: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  currentRole: "residential_care_worker",
  isLoaded: false,
  setCurrentUserId: () => {},
  identityUnresolved: false,
  homeId: null,
});

/** The session identity, from the one endpoint that can read it. Demo returns
 *  the header identity, so this is safe to call in both modes. */
function useSessionIdentity() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<{ data: { userId: string; role: string; homeId: string | null; source: string } }>("/me"),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const live = isLiveTenant();

  // The persisted user is an external store (localStorage), not React state:
  // "" on the server and during hydration, the stored id after. In-session
  // switches land in switchedUserId, so the derivation below prefers them.
  // DEMO ONLY — on a live tenant the session decides and this is ignored.
  const storedUserId = useClientValue(
    () => {
      try { return localStorage.getItem(SESSION_KEY) ?? ""; } catch { return ""; }
    },
    "",
  );
  const [switchedUserId, setSwitchedUserId] = useState<string | null>(null);

  const meQuery = useSessionIdentity();
  const sessionUserId = meQuery.data?.data?.userId ?? null;
  const homeId = meQuery.data?.data?.homeId ?? null;

  // Live: the session, full stop. Demo: the switcher, then the default.
  const userId = live
    ? sessionUserId
    : (switchedUserId ?? (storedUserId || DEFAULT_USER_ID));

  // Publish it to the synchronous helper the ~30 non-React call sites use, so
  // their `x-user-id` headers carry the real actor instead of the demo id.
  useEffect(() => {
    publishSessionUserId(live ? sessionUserId : null);
  }, [live, sessionUserId]);

  const mounted = useMounted();
  const isLoaded = live ? mounted && !meQuery.isPending : mounted;

  const staffQuery = useStaff();
  const allStaff = staffQuery.data?.data ?? [];

  // No allStaff[0] fallback. It existed so the demo always had somebody to
  // show, but on a live tenant it silently presented EVERY signed-in user as
  // the first staff member by surname — and derived their permissions from
  // that record. An identity we cannot resolve is null, and says so.
  const currentUser: StaffMember | null =
    (userId ? allStaff.find((s) => s.id === userId) : undefined)
    ?? (live ? null : allStaff[0] ?? null);

  // Least privilege when unresolved, rather than inheriting a stranger's role.
  const currentRole: AppRole = toAppRole(currentUser?.role ?? "residential_care_worker");

  const identityUnresolved =
    live && isLoaded && !staffQuery.isPending && currentUser === null;

  function setCurrentUserId(id: string) {
    // Demo affordance only. On a live tenant identity comes from the session;
    // letting the client pick would be the very thing this fix removes.
    if (live) return;
    setSwitchedUserId(id);
    try { localStorage.setItem(SESSION_KEY, id); } catch { /* ignore */ }
  }

  return (
    <AuthContext.Provider value={{ currentUser, currentRole, isLoaded, setCurrentUserId, identityUnresolved, homeId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}
