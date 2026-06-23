"use client";

import Link from "next/link";
import { Users, Target, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A small shared sub-nav that ties the three whole-home manager intelligence
 * views together — relationships, outcomes and inspection readiness — so a
 * manager can move between "who needs us", "whose outcomes need focus" and
 * "are we inspection-ready" without going back to the main nav.
 */
const TABS = [
  { key: "relationships", href: "/intelligence/cara/relationship-intelligence/home", label: "Home Relationships", icon: Users },
  { key: "outcomes", href: "/intelligence/cara/outcome-intelligence/home", label: "Home Outcomes", icon: Target },
  { key: "inspection", href: "/intelligence/cara/inspection-intelligence", label: "Inspection", icon: ClipboardCheck },
] as const;

export type ManagerIntelligenceTab = (typeof TABS)[number]["key"];

export function ManagerIntelligenceNav({ active }: { active: ManagerIntelligenceTab }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              isActive
                ? "border-[var(--cs-cara-gold,#b45309)] bg-amber-50 text-[var(--cs-cara-gold,#b45309)]"
                : "border-[var(--cs-border,#e2e8f0)] bg-white text-[var(--cs-text-secondary,#475569)] hover:bg-slate-50",
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {t.label}
          </Link>
        );
      })}
    </div>
  );
}
