"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, CheckCircle2, Shield, Clock, Users, Pill, MapPin,
  Phone, Calendar, Moon, Sun, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useDailyRiskBriefings } from "@/hooks/use-daily-risk-briefings";
import type { DailyRiskBriefing, ChildRiskEntry, DailyAlert, DailyContact, DailyRiskLevel } from "@/types/extended";
import { DAILY_RISK_LEVEL_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const riskBorder = (level: DailyRiskLevel) =>
  level === "low" ? "border-l-green-400" : level === "medium" ? "border-l-amber-400" : "border-l-red-500";

const riskBadge = (level: DailyRiskLevel) =>
  level === "low" ? "bg-green-100 text-green-800" : level === "medium" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800";

const alertIcon = (severity: string) =>
  severity === "critical" ? "text-red-500" : severity === "warning" ? "text-amber-500" : "text-green-600";

const AlertIconComponent = ({ severity }: { severity: string }) =>
  severity === "info" ? <CheckCircle2 className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", alertIcon(severity))} /> : <AlertTriangle className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", alertIcon(severity))} />;

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function DailyRiskBriefingPage() {
  const { data: res, isLoading } = useDailyRiskBriefings();
  const briefings = res?.data ?? [];
  const [shift, setShift] = useState<"day" | "night">("day");

  if (isLoading) return <PageShell title="Daily Risk Briefing" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  /* use the most recent briefing if available */
  const briefing: DailyRiskBriefing | undefined = briefings[0];
  const today = briefing?.date ?? new Date().toISOString().slice(0, 10);
  const childRisks: ChildRiskEntry[] = briefing?.child_risks ?? [];
  const homeAlerts: DailyAlert[] = briefing?.home_alerts ?? [];
  const keyContacts: DailyContact[] = briefing?.key_contacts ?? [];

  return (
    <PageShell
      title="Daily Risk Briefing"
      subtitle={`${today} · ${shift === "day" ? "Day Shift" : "Waking Night"} · Handover & Risk Summary`}
      ariaContext={{ pageTitle: "Daily Risk Briefing", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border overflow-hidden">
            <button
              onClick={() => setShift("day")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors",
                shift === "day" ? "bg-amber-100 text-amber-800" : "bg-white text-slate-500 hover:bg-slate-50"
              )}
            >
              <Sun className="h-3.5 w-3.5" /> Day
            </button>
            <button
              onClick={() => setShift("night")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors border-l",
                shift === "night" ? "bg-blue-100 text-blue-800" : "bg-white text-slate-500 hover:bg-slate-50"
              )}
            >
              <Moon className="h-3.5 w-3.5" /> Night
            </button>
          </div>
          <PrintButton title="Daily Risk Briefing" />
          <AriaStudioQuickActionButton context={{ record_type: "daily_log", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        {/* shift info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-start gap-2">
          {shift === "day" ? <Sun className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" /> : <Moon className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />}
          <div className="text-sm">
            <p className="font-semibold text-blue-800">{shift === "day" ? "Day Shift" : "Waking Night"} Briefing — {today}</p>
            <p className="text-blue-700">
              Shift Leader: {briefing ? getStaffName(briefing.shift_leader) : "—"} ·
              Staff on shift: {briefing ? briefing.staff_on_shift.map(getStaffName).join(", ") : "—"} ·
              On-call: {briefing ? getStaffName(briefing.on_call) : "—"}
            </p>
          </div>
        </div>

        {/* risk level per child */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {childRisks.map((yp) => (
            <Card key={yp.child_id} className={cn("border-l-4", riskBorder(yp.risk_level))}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {getYPName(yp.child_id)}
                  <Badge variant="outline" className={cn(riskBadge(yp.risk_level))}>
                    {DAILY_RISK_LEVEL_LABEL[yp.risk_level]} Risk
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {/* alerts */}
                <div>
                  <p className="font-medium mb-1 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Alerts</p>
                  <ul className="space-y-0.5">
                    {(yp.alerts ?? []).map((a, i) => (
                      <li key={i} className="text-muted-foreground">• {a}</li>
                    ))}
                  </ul>
                </div>
                {/* medication */}
                <div>
                  <p className="font-medium mb-1 flex items-center gap-1"><Pill className="h-3.5 w-3.5 text-green-600" /> Medication</p>
                  <p className="text-muted-foreground">{yp.medication}</p>
                </div>
                {/* key info */}
                <div>
                  <p className="font-medium mb-1 flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-blue-600" /> Today</p>
                  <p className="text-muted-foreground">{yp.key_info}</p>
                </div>
                {/* mood */}
                <div>
                  <p className="font-medium mb-1 flex items-center gap-1"><Users className="h-3.5 w-3.5 text-purple-600" /> Presentation</p>
                  <p className="text-muted-foreground">{yp.mood}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* home-level alerts */}
        {homeAlerts.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" /> Home-Level Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {homeAlerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <AlertIconComponent severity={alert.severity} />
                  <span>{alert.message}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* key contacts today */}
        {keyContacts.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-600" /> Key Contacts Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {keyContacts.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 bg-muted/40 rounded p-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{item.time} — {item.what}</p>
                      <p className="text-muted-foreground">{item.who}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* check frequencies */}
        {childRisks.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600" /> Check Frequencies (Night)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("grid gap-2 text-xs", `grid-cols-${Math.min(childRisks.length, 3)}`)}>
                {childRisks.map((yp) => {
                  const bg = yp.risk_level === "low" ? "bg-green-50" : yp.risk_level === "medium" ? "bg-amber-50" : "bg-red-50";
                  const clr = yp.risk_level === "low" ? "text-green-700" : yp.risk_level === "medium" ? "text-amber-700" : "text-red-700";
                  return (
                    <div key={yp.child_id} className={cn(bg, "rounded p-2 text-center")}>
                      <p className="font-bold">{getYPName(yp.child_id)}</p>
                      <p className={cn("text-lg font-bold", clr)}>{yp.check_frequency_minutes} min</p>
                      <p className="text-muted-foreground">{yp.check_frequency_reason}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* briefing sign-off */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Briefing Protocol</p>
          <p>This daily risk briefing must be reviewed by all staff at the start of each shift. The shift leader is responsible for delivering a verbal briefing covering all alerts, medication due, appointments, and risk levels. Any changes during the shift must be communicated to all staff on duty. Risk levels and check frequencies are reviewed daily by the RM or Deputy. This briefing does not replace the full care plans, risk assessments, and behaviour support plans — staff must be familiar with all individual plans.</p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Behaviour & Safeguarding"
        category={["behaviour", "safeguarding"]}
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
