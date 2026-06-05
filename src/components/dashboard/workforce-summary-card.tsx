"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — WORKFORCE AT A GLANCE CARD
// Surfaces the live workforce-engine signals (sign-in / safe staffing / emergencies
// / message governance — Phases 1-8) on the dashboard, with deep-links. Reads the
// Phase 8 oversight API. Defensive: tolerates missing fields, never throws.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, ChevronRight, Loader2, Siren, AlertTriangle, UserCheck, MessageSquare, ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkforceOversight } from "@/hooks/use-workforce-oversight";

const SEV_STYLE: Record<string, string> = {
  critical: "text-red-600",
  high: "text-amber-600",
  ok: "text-green-600",
};
const FLAG_STYLE: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  attention: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};

export function WorkforceSummaryCard() {
  const { data: o, isLoading } = useWorkforceOversight();

  if (isLoading || !o) {
    return (
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const sev = o.staffing?.severity ?? "ok";
  const activeEmergencies = o.emergencies?.active ?? 0;
  const unverified = o.presence?.unverified ?? 0;
  const flags = (o.flags ?? []).slice(0, 2);

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-600" />
            <span className="text-slate-900">Workforce at a glance</span>
          </CardTitle>
          <Link href="/workforce-oversight" className="text-xs text-slate-600 hover:underline flex items-center gap-1">
            View <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className="text-lg font-bold tabular-nums text-slate-700">{o.staffing?.on_shift_count ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">On shift</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", sev === "critical" ? "bg-red-50" : sev === "high" ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-sm font-bold capitalize pt-0.5", SEV_STYLE[sev] ?? "text-slate-700")}>{sev === "ok" ? "Safe" : sev}</p>
            <p className="text-[10px] text-muted-foreground">Staffing</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", activeEmergencies > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", activeEmergencies > 0 ? "text-red-600" : "text-green-600")}>{activeEmergencies}</p>
            <p className="text-[10px] text-muted-foreground">Emergencies</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", unverified > 0 ? "bg-amber-50" : "bg-slate-50")}>
            <p className={cn("text-lg font-bold tabular-nums", unverified > 0 ? "text-amber-600" : "text-slate-700")}>{unverified}</p>
            <p className="text-[10px] text-muted-foreground">Unverified</p>
          </div>
        </div>

        {flags.length > 0 && (
          <div className="space-y-1.5">
            {flags.map((f, i) => (
              <div key={i} className={cn("flex items-center gap-1.5 rounded border p-2 text-xs leading-snug", FLAG_STYLE[f?.severity] ?? FLAG_STYLE.info)}>
                <AlertTriangle className="h-3 w-3 shrink-0" />{f?.label}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-0.5 text-[11px]">
          {activeEmergencies > 0 && (
            <Link href="/safe-staffing" className="inline-flex items-center gap-1 font-semibold text-red-600 hover:underline">
              <Siren className="h-3 w-3" />Respond
            </Link>
          )}
          <Link href="/sign-in" className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 hover:underline">
            <UserCheck className="h-3 w-3" />Sign-in
          </Link>
          <Link href="/safe-staffing" className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 hover:underline">
            <ShieldAlert className="h-3 w-3" />Staffing
          </Link>
          <Link href="/comms" className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 hover:underline">
            <MessageSquare className="h-3 w-3" />Comms
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
