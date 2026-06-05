"use client";

import { useState } from "react";
import { Siren, Loader2, CheckCircle2, X, HandHelping, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTriggerEmergency, useEmergencyAlerts, useEmergencyAction } from "@/hooks/use-safe-staffing";
import { EMERGENCY_TYPE_LABEL, type EmergencyType } from "@/lib/staffing/emergency-types";

const TYPES = Object.keys(EMERGENCY_TYPE_LABEL) as EmergencyType[];

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// ── Panic / raise-emergency control (two-step to avoid accidental triggers) ────

export function EmergencyButton() {
  const trigger = useTriggerEmergency();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<EmergencyType | null>(null);
  const [location, setLocation] = useState("");
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!type) return;
    trigger.mutate(
      { type, location: location.trim() || undefined },
      { onSuccess: () => { setSent(true); setTimeout(() => { setOpen(false); setSent(false); setType(null); setLocation(""); }, 2500); } },
    );
  };

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 bg-[var(--cs-avisaar-coral)] hover:bg-[var(--cs-avisaar-coral)]/90 text-white border-0"
      >
        <Siren className="h-4 w-4" />Raise emergency
      </Button>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[var(--cs-avisaar-coral)]/40 bg-white p-4 space-y-3 max-w-md">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--cs-avisaar-coral)]"><Siren className="h-4 w-4" />Raise an emergency</p>
        <button onClick={() => setOpen(false)} className="text-[var(--cs-text-muted)] hover:text-[var(--cs-navy)]"><X className="h-4 w-4" /></button>
      </div>

      {sent ? (
        <p className="flex items-center gap-2 text-sm text-[var(--cs-teal-strong)] py-2"><CheckCircle2 className="h-4 w-4" />Alert sent — available staff have been notified.</p>
      ) : (
        <>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)] mb-1">Type</p>
            <div className="grid grid-cols-3 gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-[11px] font-medium",
                    type === t ? "border-[var(--cs-avisaar-coral)] bg-[var(--cs-avisaar-coral)]/10 text-[var(--cs-avisaar-coral)]" : "border-[var(--cs-border)] text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]",
                  )}
                >
                  {EMERGENCY_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location in the home (optional)"
              className="flex-1 rounded-lg border border-[var(--cs-border)] px-3 py-1.5 text-sm"
            />
          </div>
          <p className="text-[11px] text-[var(--cs-text-muted)]">
            This sends a generic alert to on-shift staff and managers — no child or sensitive details are shared.
          </p>
          <Button onClick={send} disabled={!type || trigger.isPending} className="w-full gap-1.5 bg-[var(--cs-avisaar-coral)] hover:bg-[var(--cs-avisaar-coral)]/90 text-white border-0">
            {trigger.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Siren className="h-4 w-4" />}Send emergency alert
          </Button>
          {trigger.isError && <p className="text-xs text-red-600">{(trigger.error as Error)?.message ?? "Could not send."}</p>}
        </>
      )}
    </div>
  );
}

// ── Active-emergency banner (respond / resolve) ───────────────────────────────

export function ActiveEmergencyBanner() {
  const { data: alerts = [] } = useEmergencyAlerts();
  const action = useEmergencyAction();
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((a) => (
        <div key={a.id} className="rounded-2xl border-2 border-[var(--cs-avisaar-coral)] bg-[var(--cs-avisaar-coral)]/8 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--cs-avisaar-coral)]">
                <Siren className="h-4 w-4 animate-pulse" />{EMERGENCY_TYPE_LABEL[a.type]} emergency{a.location ? ` — ${a.location}` : ""}
              </p>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                Raised by {a.raised_by_name} at {timeLabel(a.created_at)}
                {a.responders.length > 0 && <span> · {a.responders.length} responding</span>}
              </p>
              {a.responders.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {a.responders.map((r) => (
                    <Badge key={r.staff_id} variant="outline" className="text-[9px] gap-0.5 text-[var(--cs-teal-strong)] border-[var(--cs-teal-soft)]"><HandHelping className="h-2.5 w-2.5" />{r.name}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <Button size="sm" onClick={() => action.mutate({ id: a.id, action: "acknowledge" })} disabled={action.isPending} className="gap-1 text-xs">
                <HandHelping className="h-3.5 w-3.5" />I'm responding
              </Button>
              <Button size="sm" variant="outline" onClick={() => action.mutate({ id: a.id, action: "resolve" })} disabled={action.isPending} className="gap-1 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />Resolve
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
