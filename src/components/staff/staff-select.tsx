"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * id -> the staff member's name, from the API.
 *
 * Pages resolve a stored staff id through getStaffName() in @/lib/seed-data,
 * which reads the demo seed's array. On a live tenant every real staff id
 * misses and renders "Unknown", so a record shows who wrote it only on the
 * demo.
 */

export interface StaffOption {
  id: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

export function useStaffName() {
  const { data } = useQuery({
    queryKey: ["staff"],
    queryFn: () => api.get<{ data: StaffOption[] }>("/staff"),
    staleTime: 5 * 60_000,
  });
  return useMemo(() => {
    const byId = new Map((data?.data ?? []).map((m) => [m.id, m]));
    return (id: string | null | undefined): string => {
      if (!id) return "Not recorded";
      const m = byId.get(id);
      if (!m) return "Unknown staff member";
      const full = m.full_name?.trim();
      if (full) return full;
      const parts = [m.first_name, m.last_name].filter(Boolean).join(" ").trim();
      return parts || "Unnamed staff member";
    };
  }, [data]);
}

/** The home's staff, from the API. Pages hardcode this list as the demo seed's
 *  eight people, so on a live tenant the picker offers staff who do not work
 *  there and omits everyone who does. */
export function useStaff() {
  const q = useQuery({
    queryKey: ["staff"],
    queryFn: () => api.get<{ data: StaffOption[] }>("/staff"),
    staleTime: 5 * 60_000,
  });
  return { staff: q.data?.data ?? [], isLoading: q.isLoading };
}

export function StaffSelect({
  value, onChange, id, placeholder = "Select staff member", disabled,
}: {
  value: string;
  onChange: (id: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const { staff, isLoading } = useStaff();
  const name = useStaffName();
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger id={id}>
        <SelectValue
          placeholder={
            isLoading ? "Loading staff\u2026"
            : staff.length === 0 ? "No staff on record"
            : placeholder
          }
        />
      </SelectTrigger>
      <SelectContent>
        {staff.map((m) => (
          <SelectItem key={m.id} value={m.id}>{name(m.id)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
