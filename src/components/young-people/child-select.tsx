"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { childDisplayName } from "@/lib/people/child-display-name";

/**
 * The children of this home, from the API.
 *
 * Pages across the app hardcode their child picker as
 * `["yp_alex", "yp_jordan", "yp_casey"]` — the demo seed's three children. On a
 * live tenant that dropdown offers three young people who do not exist and
 * omits every one who does, so a record cannot be attached to a real child at
 * all. Names came from the seed lookup too, and read "Unknown".
 *
 * This is the one place that answers "which children can this record be about".
 */

export interface ChildOption {
  id: string;
  preferred_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  status?: string | null;
}

/** The home's children, newest query cached for five minutes. */
export function useChildren(opts?: { includeFormer?: boolean }) {
  const q = useQuery({
    queryKey: ["young-people"],
    queryFn: () => api.get<{ data: ChildOption[] }>("/young-people"),
    staleTime: 5 * 60_000,
  });
  const children = useMemo(() => {
    const all = q.data?.data ?? [];
    // `status` is absent on some shapes; absent is treated as current rather
    // than filtered away, so a record can still be written against it.
    return opts?.includeFormer ? all : all.filter((c) => c.status == null || c.status === "current");
  }, [q.data, opts?.includeFormer]);
  return { children, isLoading: q.isLoading };
}

/** id -> display name, for rendering a stored child_id anywhere on a page. */
export function useChildName() {
  const { children } = useChildren({ includeFormer: true });
  return useMemo(() => {
    const byId = new Map(children.map((c) => [c.id, c]));
    return (id: string | null | undefined) =>
      id ? childDisplayName(byId.get(id)) : "No child recorded";
  }, [children]);
}

export function ChildSelect({
  value,
  onChange,
  id,
  placeholder = "Select child",
  includeFormer = false,
  disabled,
}: {
  value: string;
  onChange: (id: string) => void;
  id?: string;
  placeholder?: string;
  includeFormer?: boolean;
  disabled?: boolean;
}) {
  const { children, isLoading } = useChildren({ includeFormer });

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger id={id}>
        <SelectValue
          placeholder={
            isLoading ? "Loading children…"
            // An empty list is a fact about the home, not a loading state.
            : children.length === 0 ? "No children on record"
            : placeholder
          }
        />
      </SelectTrigger>
      <SelectContent>
        {children.map((c) => (
          <SelectItem key={c.id} value={c.id}>{childDisplayName(c)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
