"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RECORD ONCE CONTEXT
// "Capture once, link intelligently, surface everywhere, never duplicate."
// Fetches child/staff profile data and provides it to any form via context,
// so staff never re-enter information the system already knows.
// ══════════════════════════════════════════════════════════════════════════════

import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useParams } from "next/navigation";
import { useYoungPerson, type YPEnriched } from "@/hooks/use-young-people";
import { useStaffMember, type StaffEnriched } from "@/hooks/use-staff";
import { useCarePlanByChild } from "@/hooks/use-care-plans";
import { useRiskAssessments } from "@/hooks/use-risk-assessments";
import { useAuthContext } from "@/contexts/auth-context";
import type { CarePlanGoal } from "@/types/extended";

// ── Auto-fill data shapes ────────────────────────────────────────────────────

export interface ChildAutoFill {
  childId: string;
  childName: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  dateOfBirth: string;
  age: number;
  gender: string;
  photoUrl: string | null;
  // Placement
  placementStart: string;
  placementType: string;
  homeId: string;
  homeName: string;
  localAuthority: string;
  legalStatus: string;
  // Key professionals
  keyWorkerId: string | null;
  keyWorkerName: string | null;
  socialWorkerName: string;
  socialWorkerPhone: string | null;
  socialWorkerEmail: string | null;
  iroName: string | null;
  // Risk
  currentRiskLevel: "low" | "medium" | "high" | "very_high" | "unknown";
  riskFlags: string[];
  knownTriggers: string[];
  currentControls: string[];
  // Care plan
  activeGoals: CarePlanGoal[];
  nextReviewDate: string | null;
  // Health
  allergies: string[];
  dietaryRequirements: string | null;
  gpName: string | null;
  // Education
  schoolName: string | null;
}

export interface StaffAutoFill {
  staffId: string;
  staffName: string;
  firstName: string;
  lastName: string;
  role: string;
  jobTitle: string;
  homeId: string;
  homeName: string;
  email: string | null;
  phone: string | null;
}

export interface RecordOnceData {
  child: ChildAutoFill | null;
  staff: StaffAutoFill | null;
  currentUser: StaffAutoFill | null;
  isLoading: boolean;
  /** Date string for today (YYYY-MM-DD) */
  today: string;
  /** Current time (HH:MM) */
  currentTime: string;
  /** Flat lookup: any autoFillKey -> value */
  getValue: (key: string) => string | number | null;
}

// ── Context ──────────────────────────────────────────────────────────────────

const RecordOnceContext = createContext<RecordOnceData>({
  child: null,
  staff: null,
  currentUser: null,
  isLoading: false,
  today: new Date().toISOString().slice(0, 10),
  currentTime: new Date().toTimeString().slice(0, 5),
  getValue: () => null,
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Home name is hard-coded to match seed data until a homes API exists. */
function resolveHomeName(homeId: string): string {
  const MAP: Record<string, string> = { home_oak: "Chamberlain House" };
  return MAP[homeId] ?? homeId;
}

function computeAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function deriveHighestRisk(
  riskData: { current_level: string }[] | undefined,
): "low" | "medium" | "high" | "very_high" | "unknown" {
  if (!riskData || riskData.length === 0) return "unknown";
  const order = ["very_high", "high", "medium", "low"] as const;
  for (const level of order) {
    if (riskData.some((r) => r.current_level === level)) return level;
  }
  return "low";
}

// ── Build auto-fill from fetched data ────────────────────────────────────────

function buildChildAutoFill(
  yp: YPEnriched,
  goals: CarePlanGoal[],
  nextReview: string | null,
  triggers: string[],
  controls: string[],
  riskLevel: "low" | "medium" | "high" | "very_high" | "unknown",
): ChildAutoFill {
  return {
    childId: yp.id,
    childName: yp.preferred_name
      ? `${yp.preferred_name} (${yp.first_name} ${yp.last_name})`
      : `${yp.first_name} ${yp.last_name}`,
    firstName: yp.first_name,
    lastName: yp.last_name,
    preferredName: yp.preferred_name,
    dateOfBirth: yp.date_of_birth,
    age: computeAge(yp.date_of_birth),
    gender: yp.gender,
    photoUrl: yp.photo_url,
    placementStart: yp.placement_start,
    placementType: yp.placement_type,
    homeId: yp.home_id,
    homeName: resolveHomeName(yp.home_id),
    localAuthority: yp.local_authority,
    legalStatus: yp.legal_status,
    keyWorkerId: yp.key_worker_id,
    keyWorkerName: yp.key_worker?.full_name ?? null,
    socialWorkerName: yp.social_worker_name,
    socialWorkerPhone: yp.social_worker_phone,
    socialWorkerEmail: yp.social_worker_email,
    iroName: yp.iro_name,
    currentRiskLevel: riskLevel,
    riskFlags: yp.risk_flags,
    knownTriggers: triggers,
    currentControls: controls,
    activeGoals: goals,
    nextReviewDate: nextReview,
    allergies: yp.allergies,
    dietaryRequirements: yp.dietary_requirements,
    gpName: yp.gp_name,
    schoolName: yp.school_name,
  };
}

function buildStaffAutoFill(s: StaffEnriched): StaffAutoFill {
  return {
    staffId: s.id,
    staffName: s.full_name,
    firstName: s.first_name,
    lastName: s.last_name,
    role: s.role,
    jobTitle: s.job_title,
    homeId: s.home_id,
    homeName: resolveHomeName(s.home_id),
    email: s.email,
    phone: s.phone,
  };
}

// ── Flat lookup builder ──────────────────────────────────────────────────────

function buildLookup(
  child: ChildAutoFill | null,
  staff: StaffAutoFill | null,
  today: string,
  currentTime: string,
): Record<string, string | number | null> {
  const map: Record<string, string | number | null> = {
    today,
    date: today,
    currentTime,
    time: currentTime,
  };

  if (child) {
    map.childName = child.childName;
    map.child_name = child.childName;
    map.childId = child.childId;
    map.child_id = child.childId;
    map.firstName = child.firstName;
    map.lastName = child.lastName;
    map.dateOfBirth = child.dateOfBirth;
    map.age = child.age;
    map.gender = child.gender;
    map.placementType = child.placementType;
    map.homeId = child.homeId;
    map.homeName = child.homeName;
    map.home = child.homeName;
    map.localAuthority = child.localAuthority;
    map.legalStatus = child.legalStatus;
    map.keyWorkerName = child.keyWorkerName;
    map.socialWorkerName = child.socialWorkerName;
    map.currentRiskLevel = child.currentRiskLevel;
    map.schoolName = child.schoolName;
    map.gpName = child.gpName;
    map.nextReviewDate = child.nextReviewDate;
  }

  if (staff) {
    map.staffName = staff.staffName;
    map.staff_name = staff.staffName;
    map.staffId = staff.staffId;
    map.staff_id = staff.staffId;
    map.staffRole = staff.jobTitle;
    map.staffHome = staff.homeName;
    map.recordingStaff = staff.staffName;
    map.recording_staff = staff.staffName;
  }

  return map;
}

// ── Provider ─────────────────────────────────────────────────────────────────

interface RecordOnceProviderProps {
  children: ReactNode;
  childId?: string;
  staffId?: string;
}

export function RecordOnceProvider({
  children,
  childId: childIdProp,
  staffId: staffIdProp,
}: RecordOnceProviderProps) {
  // Try to read childId from URL if not passed as prop
  const params = useParams();
  const childId = childIdProp ?? (params?.childId as string | undefined) ?? "";
  const staffIdFromProps = staffIdProp ?? "";

  // Current logged-in user
  const { currentUser } = useAuthContext();

  // Fetch child profile
  const ypQuery = useYoungPerson(childId);
  const ypData = ypQuery.data?.data ?? null;

  // Fetch care plan for this child
  const carePlanQuery = useCarePlanByChild(childId);
  const carePlan = carePlanQuery.data?.data ?? null;

  // Fetch risk assessments for this child
  const riskQuery = useRiskAssessments(childId ? { childId } : undefined);
  const riskData = riskQuery.data?.data ?? [];

  // Fetch specific staff member if requested (e.g. for staff-related forms)
  const staffQuery = useStaffMember(staffIdFromProps);
  const staffData = staffQuery.data?.data ?? null;

  const isLoading =
    (!!childId && ypQuery.isLoading) ||
    (!!childId && carePlanQuery.isLoading) ||
    (!!childId && riskQuery.isLoading) ||
    (!!staffIdFromProps && staffQuery.isLoading);

  const today = new Date().toISOString().slice(0, 10);
  const currentTime = new Date().toTimeString().slice(0, 5);

  // Derive child auto-fill
  const childAutoFill = useMemo<ChildAutoFill | null>(() => {
    if (!ypData) return null;

    const activeGoals = (carePlan?.goals ?? []).filter(
      (g) => g.status !== "achieved" && g.status !== "closed",
    );
    const nextReview = carePlan?.next_lac_review ?? null;

    // Collect triggers and mitigations from risk assessments
    const triggers = riskData.flatMap((r) => r.triggers ?? []);
    const controls = riskData.flatMap((r) =>
      (r.mitigations ?? []).map((m) => m.strategy),
    );
    const riskLevel = deriveHighestRisk(riskData);

    return buildChildAutoFill(
      ypData,
      activeGoals,
      nextReview,
      [...new Set(triggers)],
      [...new Set(controls)],
      riskLevel,
    );
  }, [ypData, carePlan, riskData]);

  // Derive staff auto-fill (from explicit staffId prop)
  const staffAutoFill = useMemo<StaffAutoFill | null>(() => {
    if (!staffData) return null;
    return buildStaffAutoFill(staffData);
  }, [staffData]);

  // Current user auto-fill (always available once auth loads)
  const currentUserAutoFill = useMemo<StaffAutoFill | null>(() => {
    if (!currentUser) return null;
    return {
      staffId: currentUser.id,
      staffName: currentUser.full_name,
      firstName: currentUser.first_name,
      lastName: currentUser.last_name,
      role: currentUser.role,
      jobTitle: currentUser.job_title,
      homeId: currentUser.home_id,
      homeName: resolveHomeName(currentUser.home_id),
      email: currentUser.email,
      phone: currentUser.phone,
    };
  }, [currentUser]);

  // Use currentUser as fallback staff context
  const effectiveStaff = staffAutoFill ?? currentUserAutoFill;

  const lookup = useMemo(
    () => buildLookup(childAutoFill, effectiveStaff, today, currentTime),
    [childAutoFill, effectiveStaff, today, currentTime],
  );

  const getValue = useMemo(
    () => (key: string) => lookup[key] ?? null,
    [lookup],
  );

  const value = useMemo<RecordOnceData>(
    () => ({
      child: childAutoFill,
      staff: effectiveStaff,
      currentUser: currentUserAutoFill,
      isLoading,
      today,
      currentTime,
      getValue,
    }),
    [childAutoFill, effectiveStaff, currentUserAutoFill, isLoading, today, currentTime, getValue],
  );

  return (
    <RecordOnceContext.Provider value={value}>
      {children}
    </RecordOnceContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useRecordOnce(): RecordOnceData {
  return useContext(RecordOnceContext);
}
