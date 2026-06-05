"use client";

import Link from "next/link";
import {
  LogIn, Megaphone, CalendarDays, BookOpen, BookMarked, Lock, PhoneCall, ShieldCheck,
  CheckCircle2, ArrowRight, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShiftAccess } from "@/hooks/use-shift-access";
import { useSafeStaffing } from "@/hooks/use-safe-staffing";
import { useAuthContext } from "@/contexts/auth-context";

// Things a general staff member can do while OFF shift (non-operational only).
const CAN_DO = [
  { href: "/comms", icon: Megaphone, title: "Announcements & updates", desc: "Home announcements, rota cover, training & policy notices" },
  { href: "/rota", icon: CalendarDays, title: "Your rota & shifts", desc: "See when you're next on and request cover" },
  { href: "/policies", icon: BookOpen, title: "Training & policies", desc: "Read up on policies and complete training" },
  { href: "/staff-handbook", icon: BookMarked, title: "Staff handbook", desc: "Guidance and how-to for the home" },
];

export function OffShiftPortal() {
  const { currentUser } = useAuthContext();
  const { data: access, isLoading } = useShiftAccess(true); // preview → always show what's gated off shift
  const { data: staffing } = useSafeStaffing();

  if (isLoading || !access) {
    return <div className="p-10 text-center text-sm text-[var(--cs-text-muted)]"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>;
  }

  const name = currentUser?.first_name ?? "there";

  // Managers / senior leaders keep full access off shift.
  if (access.keeps_off_shift_access) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)] p-6 text-center">
        <ShieldCheck className="h-7 w-7 text-[var(--cs-teal)] mx-auto mb-2" />
        <p className="text-lg font-bold text-[var(--cs-navy)]">You have full access</p>
        <p className="text-sm text-[var(--cs-text-secondary)] mt-1">As a senior member of staff you keep full Cornerstone access off shift.</p>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-[var(--cs-teal)] hover:underline">Go to dashboard <ArrowRight className="h-4 w-4" /></Link>
      </div>
    );
  }

  // Already on shift.
  if (access.on_shift) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)] p-6 text-center">
        <CheckCircle2 className="h-7 w-7 text-[var(--cs-teal)] mx-auto mb-2" />
        <p className="text-lg font-bold text-[var(--cs-navy)]">You're on shift</p>
        <p className="text-sm text-[var(--cs-text-secondary)] mt-1">You have full operational access right now.</p>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-[var(--cs-teal)] hover:underline">Go to dashboard <ArrowRight className="h-4 w-4" /></Link>
      </div>
    );
  }

  // Off-shift general staff → the portal.
  const blocked = (access.resources ?? []).filter((r) => !r.allowed);
  const onCall = staffing?.on_call;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Hero — clock in */}
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-6">
        <p className="text-lg font-bold text-[var(--cs-navy)]">Hi {name}, you're off shift</p>
        <p className="text-sm text-[var(--cs-text-secondary)] mt-1 mb-4">
          Clock in to get your full operational access back. Until then, here's what you can still do.
        </p>
        <Link href="/sign-in">
          <Button className="gap-1.5"><LogIn className="h-4 w-4" />Clock in to your shift</Button>
        </Link>
      </div>

      {/* What you can do */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted)] mb-2 px-1">What you can do right now</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {CAN_DO.map((c) => (
            <Link key={c.href} href={c.href} className="group flex items-start gap-3 rounded-xl border border-[var(--cs-border)] bg-white p-3.5 hover:border-[var(--cs-teal)] hover:bg-[var(--cs-teal-bg)] transition-colors">
              <c.icon className="h-5 w-5 shrink-0 text-[var(--cs-teal)] mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--cs-navy)]">{c.title}</p>
                <p className="text-[11px] text-[var(--cs-text-muted)] leading-snug">{c.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Restricted until you clock in */}
      {blocked.length > 0 && (
        <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--cs-text-secondary)] mb-2">
            <Lock className="h-3.5 w-3.5 text-[var(--cs-avisaar-coral)]" />Restricted until you clock in
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {blocked.map((r) => (
              <li key={`${r.resourceType}:${r.action}`} className="flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)]">
                <Lock className="h-3 w-3 text-[var(--cs-avisaar-coral)]/60 shrink-0" />{r.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* On-call */}
      {onCall && (
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--cs-border)] bg-white p-4 text-sm text-[var(--cs-text-secondary)]">
          <PhoneCall className="h-4 w-4 text-[var(--cs-teal)] shrink-0" />
          Need a manager? On call: <span className="font-semibold text-[var(--cs-navy)]">{onCall.name}</span>
          {onCall.contact_number && <a href={`tel:${onCall.contact_number}`} className="text-[var(--cs-teal)] hover:underline">{onCall.contact_number}</a>}
        </div>
      )}
    </div>
  );
}
