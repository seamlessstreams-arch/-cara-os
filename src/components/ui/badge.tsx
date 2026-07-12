import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--cs-navy)] text-white",
        secondary: "border-[var(--cs-border)] bg-[var(--cs-surface)] text-[var(--cs-text-secondary)]",
        outline: "border-[var(--cs-border)] text-[var(--cs-text-secondary)]",
        // Semantic fills use the --cs-*-bg tokens (light AND dark values) —
        // never raw Tailwind colour scales, which only survive the dark skin
        // via the .cara-dark shim.
        destructive: "border-transparent bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]",
        success: "border-transparent bg-[var(--cs-success-bg)] text-[var(--cs-success)]",
        warning: "border-transparent bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]",
        info: "border-transparent bg-[var(--cs-info-bg)] text-[var(--cs-info)]",
        purple: "border-transparent bg-[var(--cs-oversight-bg)] text-[var(--cs-oversight)]",
        cara: "border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)]",
        oversight: "border-transparent bg-[var(--cs-oversight-bg)] text-[var(--cs-oversight)]",
        risk: "border-transparent bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]",
        // Cara Calm severity vocabulary — at most ONE per row. Light tint + token text.
        overdue: "border-transparent bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]",
        due: "border-transparent bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]",
        watch: "border-transparent bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
