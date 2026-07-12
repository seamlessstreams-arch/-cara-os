// ══════════════════════════════════════════════════════════════════════════════
// CARA — CALM EMPTY STATE
// Centred, calm, not sad. "Nothing here yet" style, not error style.
// Optional action button.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import * as LucideIcons from "lucide-react";

interface CalmEmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

function resolveIcon(name?: string): React.ElementType | null {
  if (!name) return null;
  const icons = LucideIcons as Record<string, unknown>;
  const Icon = icons[name];
  if (typeof Icon === "function") return Icon as React.ElementType;
  return null;
}

export function CalmEmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: CalmEmptyStateProps) {
  const Icon = resolveIcon(icon);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        // Token surface (not bg-white) so it renders correctly on the dark skin
        // without the hardcoded-utility shim.
        "rounded-2xl border border-dashed border-[var(--cs-border)] bg-[var(--cs-surface-elevated)]",
        "px-8 py-16",
        className,
      )}
    >
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--cs-surface)] mb-4">
          <Icon className="h-7 w-7 text-[var(--cs-text-gentle)]" />
        </div>
      )}

      <h3 className="text-[15px] font-semibold text-[var(--cs-navy)] mb-1">
        {title}
      </h3>
      <p className="text-sm text-[var(--cs-text-muted)] max-w-sm leading-relaxed mb-6">
        {description}
      </p>

      {actionLabel && actionHref && (
        <Button variant="outline" size="sm" asChild>
          <Link href={actionHref} className="gap-1.5">
            {actionLabel}
          </Link>
        </Button>
      )}
    </div>
  );
}
