"use client";

// CARA HQ — shared cockpit pieces (boundary note, badges, stat tiles)

import React from "react";
import { ShieldCheck } from "lucide-react";
import type { HqOrgStatus } from "@/lib/hq/hq-types";

/** The safeguarding boundary, stated wherever HQ renders. */
export function HqBoundaryNote() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-teal-bg)] px-4 py-3">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-teal)]" />
      <p className="text-xs leading-relaxed text-[var(--cs-text-secondary)]">
        <span className="font-semibold text-[var(--cs-navy)]">Platform admins see metadata only</span>{" "}
        — counts, usage, billing and health. Children&apos;s records are never
        visible from Cara HQ. Break-glass records intent; it does not open data.
      </p>
    </div>
  );
}

export function HqStatusBadge({ status }: { status: HqOrgStatus }) {
  const styles: Record<HqOrgStatus, string> = {
    active: "bg-[var(--cs-success-bg)] text-[var(--cs-success)]",
    suspended: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]",
    churned: "bg-[var(--cs-surface)] text-[var(--cs-text-muted)]",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

export function HqStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-[var(--cs-surface)] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--cs-navy)]">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-[var(--cs-text-gentle)]">{hint}</p>}
    </div>
  );
}

export function HqModeChip({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        on
          ? "bg-[var(--cs-success-bg)] text-[var(--cs-success)]"
          : "bg-[var(--cs-surface)] text-[var(--cs-text-muted)]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-[var(--cs-success)]" : "bg-[var(--cs-text-gentle)]"}`} />
      {on ? onLabel : offLabel}
    </span>
  );
}
