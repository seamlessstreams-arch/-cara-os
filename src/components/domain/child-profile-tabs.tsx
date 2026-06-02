"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ChildProfileTabsProps { childId: string }

const TABS = [
  { label: "Overview", path: "" },
  { label: "Story", path: "/story" },
  { label: "Timeline", path: "/timeline" },
  { label: "Plans", path: "/plans" },
  { label: "Risks", path: "/risks" },
];

export function ChildProfileTabs({ childId }: ChildProfileTabsProps) {
  const pathname = usePathname();
  const base = `/young-people/${childId}`;

  return (
    <div className="flex gap-1 overflow-x-auto border-b border-[var(--cs-border)] mb-4 pb-0">
      {TABS.map((tab) => {
        const href = `${base}${tab.path}`;
        const isActive = tab.path === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={tab.label}
            href={href}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px",
              isActive
                ? "border-[var(--cs-aria-gold)] text-[var(--cs-navy)]"
                : "border-transparent text-[var(--cs-text-muted)] hover:text-[var(--cs-text)] hover:border-[var(--cs-border)]",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
