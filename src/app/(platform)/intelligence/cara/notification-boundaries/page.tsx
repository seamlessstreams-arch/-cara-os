"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — NOTIFICATION BOUNDARIES (doctrine 1.16 / 2.3.6)
//
// Protecting the protectors, made inspectable. What would reach you now, what
// is being held because you are off shift, and the short list of things that
// may breach protected time. Cara is not allowed to be another source of
// out-of-hours noise or guilt — this page is where that promise is checkable.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useNotificationBoundaries } from "@/hooks/use-notification-boundaries";
import { BREAKTHROUGH_TYPES } from "@/lib/notifications/delivery-boundaries";
import { BellOff, Moon, ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";

const label = (s: string) => s.replace(/_/g, " ");

export default function NotificationBoundariesPage() {
  const q = useNotificationBoundaries();
  const d = q.data;

  return (
    <PageShell
      title="Notification Boundaries"
      subtitle="What Cara is allowed to send you, and what waits until you're back — protected time is infrastructure, not a nicety"
    >
      <div className="space-y-6 animate-fade-in">
        {q.isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading your delivery plan…
          </div>
        )}

        {d && (
          <>
            <Card className={cn(d.onShift ? "border-[var(--cs-border,#e2e8f0)]" : "border-[var(--cs-info-soft,#bae6fd)] bg-[var(--cs-info-bg,#f0f9ff)]")}>
              <CardContent className="flex items-start gap-3 pt-5">
                {d.onShift ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <Moon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--cs-info,#0284c7)]" />}
                <div>
                  <p className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">
                    {d.staffName} — {d.onShift ? "on shift" : "off shift"}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--cs-text-secondary,#475569)]">{d.summary}</p>
                  <p className="mt-2 text-xs text-[var(--cs-text-muted,#64748b)]">
                    The boundary is your shift, not the clock. 2am is working time on waking nights and protected time
                    at home — a quiet-hours window would get that backwards.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-3">
              {([
                ["Would deliver now", d.counts.deliverNow, "text-[var(--cs-navy,#1e293b)]"],
                ["Held until you're back", d.counts.held, "text-[var(--cs-info,#0284c7)]"],
                ["Breaching protected time", d.counts.breaches, d.counts.breaches > 0 ? "text-rose-700" : "text-emerald-700"],
              ] as const).map(([l, v, cls]) => (
                <Card key={l}><CardContent className="pt-5">
                  <p className={cn("text-2xl font-extrabold tabular-nums", cls)}>{v}</p>
                  <p className="mt-0.5 text-xs font-semibold text-[var(--cs-text-secondary,#475569)]">{l}</p>
                </CardContent></Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldAlert className="h-4 w-4 text-rose-600" /> The only things that may reach you off shift
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {BREAKTHROUGH_TYPES.map((t) => (
                    <span key={t} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold capitalize text-rose-900">
                      {label(t)}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-[var(--cs-text-muted,#64748b)]">
                  A short, explicit list — not a priority threshold. &ldquo;Urgent&rdquo; gets applied generously by
                  well-meaning code; an overdue task marked urgent will never wake you.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BellOff className="h-4 w-4 text-[var(--cs-cara-gold,#b45309)]" /> Every notification, and what happens to it
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {d.decisions.map((dec) => {
                  const n = d.notifications.find((x) => x.id === dec.notificationId);
                  return (
                    <div key={dec.notificationId} className="rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-surface,#fff)] px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--cs-text,#0f172a)]">{n?.title ?? dec.notificationId}</span>
                        <span className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                          dec.mode === "deliver_now" && dec.breachesProtectedTime && "border-rose-300 bg-rose-50 text-rose-900",
                          dec.mode === "deliver_now" && !dec.breachesProtectedTime && "border-emerald-300 bg-emerald-50 text-emerald-800",
                          dec.mode === "hold_until_on_shift" && "border-sky-300 bg-sky-50 text-sky-900",
                        )}>
                          {dec.mode === "hold_until_on_shift" ? "Held" : dec.breachesProtectedTime ? "Breaks through" : "Delivers"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--cs-text-secondary,#475569)]">{dec.reason}</p>
                    </div>
                  );
                })}
                {d.decisions.length === 0 && <p className="text-sm text-[var(--cs-text-muted,#64748b)]">Nothing pending.</p>}
              </CardContent>
            </Card>

            {d.guilt.length > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader><CardTitle className="text-base text-amber-900">Cara&rsquo;s own copy needs a look</CardTitle></CardHeader>
                <CardContent className="space-y-1.5">
                  {d.guilt.map((g, i) => (
                    <p key={i} className="text-xs text-amber-800">
                      <span className="font-mono font-semibold">&ldquo;{g.phrase}&rdquo;</span> — {g.why} <span className="font-semibold">Instead:</span> {g.instead}
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}

            <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
              This governs whether a notification <em>pings your phone</em> — never whether a concern can be raised, seen
              or escalated. The record is always there, and the team on shift is never held back. No streaks, no
              &ldquo;you haven&rsquo;t logged in&rdquo;, no red badges for things that can wait.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
