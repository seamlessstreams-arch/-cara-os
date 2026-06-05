"use client";

import Link from "next/link";
import { ShieldCheck, Lock, LogIn, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useShiftAccess } from "@/hooks/use-shift-access";

/**
 * Off-shift portal banner (Phase 4). Shows a general staff member what operational
 * access they lose while off shift + a Clock-in CTA; reassures managers/senior
 * leaders they keep full off-shift access. Fetches in `preview` mode so it shows the
 * shift effect even before enforcement is switched on (clearly labelled as a preview
 * until SHIFT_BASED_ACCESS_ENFORCED is enabled). Renders nothing when on shift.
 */
export function OffShiftBanner() {
  const { data } = useShiftAccess(true);
  if (!data) return null;

  // On shift — nothing to nag about.
  if (data.on_shift) return null;

  // Managers / senior leaders / admin keep full off-shift access.
  if (data.keeps_off_shift_access) {
    return (
      <div className="rounded-2xl border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)] p-4 flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-[var(--cs-teal)]" />
        <p className="text-sm text-[var(--cs-text-secondary)]">
          <span className="font-semibold text-[var(--cs-navy)]">Senior access.</span> You keep full Cornerstone
          access while off shift — no need to clock in to view records.
        </p>
      </div>
    );
  }

  const blocked = data.resources.filter((r) => !r.allowed);
  const isLive = data.enforcement_enabled;

  // Off shift, general staff, but nothing gated (enforcement off & no preview effect).
  if (blocked.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--cs-avisaar-coral)]/40 bg-[var(--cs-avisaar-coral)]/8 p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <Lock className="h-4 w-4 mt-0.5 shrink-0 text-[var(--cs-avisaar-coral)]" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[var(--cs-navy)]">You're off shift</p>
            {isLive ? (
              <Badge variant="outline" className="text-[9px] text-[var(--cs-avisaar-coral)] border-[var(--cs-avisaar-coral)]/40">Restricted now</Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] gap-0.5 text-[var(--cs-text-muted)]"><Eye className="h-2.5 w-2.5" />Preview</Badge>
            )}
          </div>
          <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
            {isLive
              ? "Operational child records are restricted while you're off shift. Clock in to restore access."
              : "When shift sign-in is enforced, you'll need to clock in to use these off shift."}
          </p>
        </div>
      </div>

      <ul className="space-y-1 pl-1">
        {blocked.map((r) => (
          <li key={`${r.resourceType}:${r.action}`} className="flex items-center gap-1.5 text-xs text-[var(--cs-text-secondary)]">
            <Lock className="h-3 w-3 text-[var(--cs-avisaar-coral)]/70 shrink-0" />{r.label}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--cs-teal)] text-white text-xs font-semibold px-3 py-2 hover:opacity-90"
        >
          <LogIn className="h-3.5 w-3.5" />Clock in to restore access
        </Link>
        <Link href="/off-shift" className="text-xs font-medium text-[var(--cs-teal)] hover:underline">
          See what you can do off shift →
        </Link>
      </div>
    </div>
  );
}
