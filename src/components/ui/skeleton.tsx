import { cn } from "@/lib/utils";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SKELETON (shared loading placeholder)
// The one loading primitive: a calm token-surface block with the .cs-shimmer
// sweep (globals.css), so every loading state shimmers the same way on light
// and dark surfaces. Pages had been re-declaring their own pulse divs — use
// this instead. Respects prefers-reduced-motion via the shimmer's own guard.
//
//   <Skeleton className="h-4 w-40" />
//   <Skeleton className="h-24 rounded-2xl" />
// ══════════════════════════════════════════════════════════════════════════════

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("cs-shimmer rounded-xl bg-[var(--cs-surface)]", className)}
      {...props}
    />
  );
}

export { Skeleton };
