"use client";

import { Users, AlertTriangle, CheckCircle2, Moon, Sun, PhoneCall, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useSafeStaffing } from "@/hooks/use-safe-staffing";

export function SafeStaffingCard() {
  const { data, isLoading } = useSafeStaffing();

  if (isLoading || !data) {
    return <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4 text-sm text-[var(--cs-text-muted)]">Loading staffing…</div>;
  }

  const a = data.assessment;
  const tone =
    a.severity === "critical" ? "border-[var(--cs-avisaar-coral)]/40 bg-[var(--cs-avisaar-coral)]/8"
    : a.severity === "high" ? "border-amber-300 bg-amber-50"
    : "border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)]";

  return (
    <div className={cn("rounded-2xl border p-4 space-y-3", tone)}>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--cs-navy)]">
          <Users className="h-4 w-4 text-[var(--cs-teal)]" />Safe staffing now
          <span className="inline-flex items-center gap-0.5 text-[11px] font-normal text-[var(--cs-text-muted)]">
            {a.period === "night" ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}{a.period}
          </span>
        </p>
        {a.severity === "ok" ? (
          <Badge variant="outline" className="text-[10px] gap-0.5 text-[var(--cs-teal-strong)] border-[var(--cs-teal-soft)]"><CheckCircle2 className="h-2.5 w-2.5" />Safely staffed</Badge>
        ) : (
          <Badge variant="outline" className={cn("text-[10px] gap-0.5", a.severity === "critical" ? "text-[var(--cs-avisaar-coral)] border-[var(--cs-avisaar-coral)]/40" : "text-amber-700 border-amber-300")}>
            <ShieldAlert className="h-2.5 w-2.5" />{a.severity === "critical" ? "Action needed" : "Check"}
          </Badge>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-[var(--cs-navy)]">{a.on_shift_count}</span>
        <span className="text-xs text-[var(--cs-text-muted)]">on shift · minimum {a.minimum_required} for the {a.period}</span>
      </div>

      {a.alerts.length > 0 && (
        <ul className="space-y-1">
          {a.alerts.map((al, i) => (
            <li key={i} className={cn("flex items-start gap-1.5 text-xs", al.severity === "critical" ? "text-[var(--cs-avisaar-coral)]" : "text-amber-700")}>
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />{al.message}
            </li>
          ))}
        </ul>
      )}

      {data.on_shift.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.on_shift.map((s) => (
            <span key={s.staff_id} className="inline-flex items-center gap-1 rounded-full bg-white/70 border border-[var(--cs-border-subtle)] px-2 py-0.5 text-[11px] text-[var(--cs-text-secondary)]">
              {s.shift_type === "waking_night" || s.shift_type === "sleep_in" ? <Moon className="h-2.5 w-2.5" /> : <Sun className="h-2.5 w-2.5 text-[var(--cs-avisaar-amber)]" />}
              {s.name}
            </span>
          ))}
        </div>
      )}

      {data.on_call && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-secondary)] pt-1 border-t border-[var(--cs-border-subtle)]">
          <PhoneCall className="h-3.5 w-3.5 text-[var(--cs-teal)]" />
          On call: <span className="font-medium text-[var(--cs-navy)]">{data.on_call.name}</span>
          {data.on_call.contact_number && <a href={`tel:${data.on_call.contact_number}`} className="text-[var(--cs-teal)] hover:underline">{data.on_call.contact_number}</a>}
        </div>
      )}
    </div>
  );
}
