"use client";
import Link from "next/link";
import { Play } from "lucide-react";

export function ShiftModeToggle({ className }: { className?: string }) {
  return (
    <Link
      href="/shift-mode"
      className={`inline-flex items-center gap-2 rounded-xl bg-[var(--cs-navy)] text-white px-4 py-2.5 text-sm font-medium hover:bg-[var(--cs-navy-soft)] transition-colors min-h-[48px] ${className ?? ""}`}
    >
      <Play className="h-4 w-4" />
      Start Shift
    </Link>
  );
}
