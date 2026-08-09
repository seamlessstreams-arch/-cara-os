"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ADD A STAFF MEMBER — /staff/new
//
// Before this, the Staff page's "Add Staff Member" button was permanently
// disabled with a tooltip claiming staff records live in an external HR system —
// which a live home doesn't have, so the RM had no way to build the roster.
// This posts a real staff_members record via the dual-mode dal
// (POST /api/v1/staff → dal.staff.create), so it persists on a live tenant;
// full_name is a GENERATED column filled by the database from first + last.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { StaffMember } from "@/types";
import { todayStr } from "@/lib/utils";

// ── useCreateStaffMember (inlined from use-staff) ───────────────────────────

function useCreateStaffMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<StaffMember>) => api.post<{ data: StaffMember }>("/staff", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

// ── useHomeName (inlined from use-home-profile) ─────────────────────────────

interface HomeProfile {
  id: string;
  name: string;
  address: string;
  ofsted_urn: string | null;
}

interface HomeProfileResult {
  provisioned: boolean;
  home: HomeProfile | null;
}

function useHomeProfile() {
  return useQuery({
    queryKey: ["home-profile"],
    // apiFetch returns the route's envelope verbatim — {data: {...}} — so the
    // payload must be unwrapped here. Shipped without this, the hook read
    // undefined and served the fallback in BOTH modes: live looked correct by
    // coincidence (fallback is right there pre-provisioning), and the demo
    // sidebar quietly said "This home" instead of the seeded name.
    queryFn: () =>
      api.get<{ data: HomeProfileResult }>("/home-profile").then((r) => r.data),
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
  });
}

function useHomeName(fallback = "This home"): string {
  const { data } = useHomeProfile();
  return data?.home?.name?.trim() || fallback;
}

const FIELD =
  "w-full rounded-md border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-teal)]";

// Open the native date picker on any click/focus of the field, not only the
// tiny calendar glyph (easy to miss in the dark theme).
function openPicker(e: { currentTarget: EventTarget & HTMLInputElement }) {
  const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
  try { el.showPicker?.(); } catch { /* not user-activated / unsupported */ }
}

// Values must be system_role enum members on the live database.
const ROLES = [
  ["residential_care_worker", "Residential care worker"],
  ["team_leader", "Team leader"],
  ["deputy_manager", "Deputy manager"],
  ["registered_manager", "Registered manager"],
  ["bank_staff", "Bank staff"],
  ["admin", "Admin"],
] as const;

// Values must be employment_type enum members on the live database.
const EMPLOYMENT_TYPES = [
  ["permanent", "Permanent"],
  ["part_time", "Part-time"],
  ["fixed_term", "Fixed-term"],
  ["bank", "Bank"],
  ["agency", "Agency"],
  ["volunteer", "Volunteer"],
] as const;

export default function NewStaffMemberPage() {
  const router = useRouter();
  const homeName = useHomeName();
  const create = useCreateStaffMember();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    role: "residential_care_worker",
    job_title: "",
    employment_type: "permanent",
    start_date: todayStr(),
    email: "",
    phone: "",
    contracted_hours: "37.5",
  });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const missing = !form.first_name.trim() || !form.last_name.trim() || !form.job_title.trim() || !form.start_date;

  function submit() {
    if (missing || create.isPending) return;
    create.mutate(
      {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        role: form.role,
        job_title: form.job_title.trim(),
        employment_type: form.employment_type,
        employment_status: "active",
        start_date: form.start_date,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        contracted_hours: Number(form.contracted_hours) || 0,
        is_active: true,
      } as Parameters<typeof create.mutate>[0],
      { onSuccess: () => router.push("/staff") },
    );
  }

  return (
    <PageShell title="Add a staff member" description={`Add a team member to ${homeName}. They will appear in Staff immediately.`}>
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">First name *</span>
            <Input value={form.first_name} onChange={set("first_name")} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">Last name *</span>
            <Input value={form.last_name} onChange={set("last_name")} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">Role *</span>
            <select className={FIELD} value={form.role} onChange={set("role")}>
              {ROLES.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">Job title *</span>
            <Input value={form.job_title} onChange={set("job_title")} placeholder="e.g. Senior Residential Care Worker" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">Employment type</span>
            <select className={FIELD} value={form.employment_type} onChange={set("employment_type")}>
              {EMPLOYMENT_TYPES.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">Start date *</span>
            <Input type="date" value={form.start_date} onChange={set("start_date")} onClick={openPicker} onFocus={openPicker} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">Email</span>
            <Input type="email" value={form.email} onChange={set("email")} placeholder="Optional" />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">Phone</span>
            <Input value={form.phone} onChange={set("phone")} placeholder="Optional" />
          </label>
        </div>

        <label className="block max-w-[12rem] space-y-1">
          <span className="text-xs font-medium text-[var(--cs-slate)]">Contracted hours / week</span>
          <Input type="number" min="0" step="0.5" value={form.contracted_hours} onChange={set("contracted_hours")} />
        </label>

        {create.isError && (
          <p className="text-sm text-[var(--cs-danger)]">
            Could not create the staff member — please try again.
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={submit} disabled={missing || create.isPending}>
            {create.isPending ? "Adding…" : "Add staff member"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/staff")}>Cancel</Button>
        </div>
      </div>
    </PageShell>
  );
}
