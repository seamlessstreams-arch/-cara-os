"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Shield, AlertTriangle } from "lucide-react";

export function SafeguardingHubTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: "/safeguarding", label: "Safeguarding", icon: Shield },
    { href: "/safeguarding-overview", label: "Overview", icon: AlertTriangle },
  ];

  const isActive = (href: string) => {
    if (href === "/safeguarding") {
      return pathname === href || (!pathname.includes("/safeguarding-overview") && !pathname.includes("/safeguarding/[id]"));
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
