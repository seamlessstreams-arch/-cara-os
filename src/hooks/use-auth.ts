"use client";

import { useAuthContext } from "@/contexts/auth-context";
import type { StaffMember } from "@/types";
import type { AppRole } from "@/lib/permissions";

export function useAuth() {
  return useAuthContext();
}

export function useCurrentUser(): StaffMember | null {
  return useAuthContext().currentUser;
}

export function useCurrentRole(): AppRole {
  return useAuthContext().currentRole;
}
