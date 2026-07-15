"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — AUTH CONTEXT
// Provides the current user and role throughout the application.
// In production, replace the localStorage stub with NextAuth / Clerk session.
// ══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useEffect, useState } from "react";
import { useStaff } from "@/hooks/use-staff";
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
  const [userId, setUserId] = useState<string>(DEFAULT_USER_ID);
  const [isLoaded, setIsLoaded] = useState(false);

  // Read persisted user on mount (client-only)
  useEffect(() => {
    const stored = typeof window !== "undefined"
      ? localStorage.getItem(SESSION_KEY)
      : null;
    if (stored) setUserId(stored);
    setIsLoaded(true);
  }, []);

  const staffQuery = useStaff();
  const allStaff = staffQuery.data?.data ?? [];
  const currentUser: StaffMember | null =
    allStaff.find((s) => s.id === userId) ?? allStaff[0] ?? null;
  const currentRole: AppRole = toAppRole(currentUser?.role ?? "residential_care_worker");

  function setCurrentUserId(id: string) {
    setUserId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_KEY, id);
    }
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
