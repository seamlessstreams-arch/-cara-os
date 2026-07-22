"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ADD A CHILD — /young-people/new
//
// The direct "admit a child to the home" form. Before this there was no way to
// add a young person outside the full admission-referral workflow (which writes
// to cs_* tables that aren't provisioned on a live tenant, so it failed), and
// the quick-create menu only produced generic forms. This posts a real
// young_people record via the dual-mode dal (POST /api/v1/young-people →
// dal.youngPeople.create), so it persists on a live tenant, then opens the new
// child's record.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateYoungPerson } from "@/hooks/use-young-people";
import { useHomeName } from "@/hooks/use-home-profile";

const FIELD =
  "w-full rounded-md border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-teal)]";

// Open the native date picker on any click/focus of the field, not only the
// tiny calendar glyph (which is easy to miss in the dark theme). showPicker is
// widely supported; the optional-chain guards older browsers.
function openPicker(e: { currentTarget: EventTarget & HTMLInputElement }) {
  const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
  try { el.showPicker?.(); } catch { /* not user-activated / unsupported */ }
}

const LEGAL_STATUSES = [
  "Section 20 (voluntary accommodation)",
  "Section 31 (care order)",
  "Section 38 (interim care order)",
  "Section 25 (secure accommodation)",
  "Emergency protection order",
  "Remand",
  "Other",
];

export default function NewYoungPersonPage() {
  const router = useRouter();
  const homeName = useHomeName();
  const create = useCreateYoungPerson();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    preferred_name: "",
    date_of_birth: "",
    gender: "",
    placement_start: new Date().toISOString().slice(0, 10),
    local_authority: "",
    legal_status: LEGAL_STATUSES[0],
  });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const missing =
    !form.first_name.trim() ||
    !form.last_name.trim() ||
    !form.date_of_birth ||
    !form.placement_start ||
    !form.local_authority.trim();

  function submit() {
    if (missing || create.isPending) return;
    create.mutate(
      {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        preferred_name: form.preferred_name.trim() || null,
        date_of_birth: form.date_of_birth,
        gender: form.gender.trim() || null,
        placement_start: form.placement_start,
        local_authority: form.local_authority.trim(),
        legal_status: form.legal_status,
        status: "current",
      } as Parameters<typeof create.mutate>[0],
      { onSuccess: (res) => router.push(`/young-people/${res.data.id}`) },
    );
  }

  return (
    <PageShell title="Admit a child" description={`Add a young person to ${homeName}. They will appear in Young People immediately.`}>
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
            <span className="text-xs font-medium text-[var(--cs-slate)]">Preferred name</span>
            <Input value={form.preferred_name} onChange={set("preferred_name")} placeholder="Optional" />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">Gender</span>
            <Input value={form.gender} onChange={set("gender")} placeholder="Optional" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">Date of birth *</span>
            <Input type="date" value={form.date_of_birth} onChange={set("date_of_birth")} onClick={openPicker} onFocus={openPicker} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">Placement start *</span>
            <Input type="date" value={form.placement_start} onChange={set("placement_start")} onClick={openPicker} onFocus={openPicker} />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-[var(--cs-slate)]">Placing local authority *</span>
          <Input value={form.local_authority} onChange={set("local_authority")} placeholder="e.g. Liverpool City Council" />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-[var(--cs-slate)]">Legal status</span>
          <select className={FIELD} value={form.legal_status} onChange={set("legal_status")}>
            {LEGAL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        {create.isError && (
          <p className="text-sm text-[var(--cs-red)]">Couldn&rsquo;t admit the child. Please try again.</p>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button onClick={submit} disabled={missing || create.isPending}>
            {create.isPending ? "Admitting…" : "Admit child"}
          </Button>
          <Link href="/young-people" className="text-sm text-[var(--cs-slate)] hover:underline">
            Cancel
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
