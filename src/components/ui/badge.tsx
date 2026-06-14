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
        destructive: "border-transparent bg-red-100 text-[var(--cs-risk)]",
        success: "border-transparent bg-emerald-100 text-[var(--cs-success)]",
        warning: "border-transparent bg-amber-100 text-[var(--cs-warning)]",
        info: "border-transparent bg-blue-100 text-[var(--cs-info)]",
        purple: "border-transparent bg-violet-100 text-violet-800",
        cara: "border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)]",
        oversight: "border-transparent bg-purple-100 text-[var(--cs-oversight)]",
        risk: "border-transparent bg-red-50 text-[var(--cs-risk)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
