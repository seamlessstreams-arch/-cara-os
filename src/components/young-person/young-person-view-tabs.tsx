"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BookOpen, Heart, Activity } from "lucide-react";

export function YoungPersonViewTabs({ childId }: { childId: string }) {
  const pathname = usePathname();

  const tabs = [
    { href: `/young-people/${childId}`, label: "Overview", icon: Heart },
    { href: `/young-people/${childId}/story`, label: "Story", icon: BookOpen },
    { href: `/young-people/${childId}/chronology`, label: "Chronology", icon: Activity },
  ];

  const isActive = (href: string) => {
    if (href === `/young-people/${childId}`) {
      return pathname === href || (!pathname.includes("/story") && !pathname.includes("/chronology"));
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex gap-0.5 border-b border-[var(--cs-border)] bg-[var(--cs-surface)]">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
              active
                ? "text-[var(--cs-cara-gold)] border-[var(--cs-cara-gold)]"
                : "text-[var(--cs-text-secondary)] border-transparent hover:text-[var(--cs-text-primary)]"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
