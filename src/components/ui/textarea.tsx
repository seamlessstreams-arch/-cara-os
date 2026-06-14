import React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-3 py-2 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-gentle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cs-cara-gold)]/40 focus-visible:border-[var(--cs-cara-gold)] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
