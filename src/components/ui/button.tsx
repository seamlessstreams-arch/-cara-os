import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--cs-navy)] text-white shadow-sm hover:bg-[var(--cs-navy)]/90",
        destructive: "bg-[var(--cs-risk)] text-white shadow-sm hover:bg-[var(--cs-risk)]/90",
        outline: "border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] text-[var(--cs-text-secondary)] shadow-sm hover:bg-[var(--cs-surface)]",
        secondary: "bg-[var(--cs-surface)] text-[var(--cs-navy)] shadow-sm hover:bg-[var(--cs-surface)]/80 border border-[var(--cs-border)]",
        ghost: "text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]",
        link: "text-[var(--cs-info)] underline-offset-4 hover:underline",
        success: "bg-[var(--cs-success)] text-white shadow-sm hover:bg-[var(--cs-success)]/90",
        warning: "bg-[var(--cs-warning)] text-white shadow-sm hover:bg-[var(--cs-warning)]/90",
        cara: "bg-[var(--cs-cara-gold)] text-[var(--cs-navy)] shadow-sm hover:bg-[var(--cs-cara-gold)]/90 shadow-[var(--cs-shadow-glow-gold)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
