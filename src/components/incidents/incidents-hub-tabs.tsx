"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AlertTriangle, BookOpen, UserCheck } from "lucide-react";

export function IncidentsHubTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: "/incidents", label: "Incidents", icon: AlertTriangle },
    { href: "/incidents/learning-review", label: "Learning Review", icon: BookOpen },
    { href: "/incidents/pi-debriefs", label: "PI Debriefs", icon: UserCheck },
  ];

  const isActive = (href: string) => {
    if (href === "/incidents") {
      return pathname === href || (!pathname.includes("/learning-review") && !pathname.includes("/pi-debriefs") && !pathname.includes("/incidents/[id]"));
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
