"use client";

import { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, CheckCircle2, Shield, Clock, Users, Pill, MapPin,
  Phone, Calendar, Moon, Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };
const today = d(0);

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function DailyRiskBriefingPage() {
  const [shift] = useState<"day" | "night">("day");

  return (
    <PageShell
      title="Daily Risk Briefing"
      subtitle={`${today} · ${shift === "day" ? "Day Shift" : "Waking Night"} · Handover & Risk Summary`}
      actions={<PrintButton title="Daily Risk Briefing" />}
    >
      <div id="print-area">
        {/* shift info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-start gap-2">
          {shift === "day" ? <Sun className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" /> : <Moon className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />}
          <div className="text-sm">
            <p className="font-semibold text-blue-800">Day Shift Briefing — {today}</p>
            <p className="text-blue-700">Shift Leader: {getStaffName("staff_ryan")} · Staff on shift: {getStaffName("staff_ryan")}, {getStaffName("staff_anna")}, {getStaffName("staff_chervelle")} · On-call: {getStaffName("staff_darren")}</p>
          </div>
        </div>

        {/* risk level per child */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            {
              ypId: "yp_alex", riskLevel: "Low", clr: "border-l-green-400",
              alerts: ["Asthma — reliever inhaler in medication safe", "Curfew: 20:00 (school night)"],
              medication: "Salbutamol PRN, Montelukast 5mg (evening)",
              keyInfo: "Football practice after school — back by 17:30. Homework club tomorrow.",
              mood: "Happy, settled. Good day at school yesterday.",
            },
            {
              ypId: "yp_jordan", riskLevel: "Medium", clr: "border-l-amber-400",
              alerts: [
                "Part-time timetable — home by 12:30",
                "Conjunctivitis — chloramphenicol drops 4x daily (day 5)",
                "ASD — follow sensory profile for transitions",
                "Knock-and-wait protocol: 10 seconds before entry",
              ],
              medication: "Melatonin 3mg (bedtime), Chloramphenicol drops (4x daily — due 08:00, 12:00, 16:00, 20:00)",
              keyInfo: "Jordan arrives home at 12:30. Lunch prepared in advance (preferred foods only — see dietary sheet). Quiet time 13:00-14:00. CAMHS phone appointment at 15:00 (staff to facilitate in quiet room). Visual schedule on bedroom door.",
              mood: "Slightly anxious — new teaching assistant at school. May need extra reassurance at transitions.",
            },
            {
              ypId: "yp_casey", riskLevel: "High", clr: "border-l-red-500",
              alerts: [
                "CSE risk: HIGH — no unsupervised contact with Marcus",
                "Self-harm risk: HIGH — 30-minute checks",
                "LADO investigation ongoing — Anna on restricted duties",
                "Missing education — not attending college (week 4)",
                "Window restrictor in place (bedroom)",
                "Phone monitoring active for Marcus contact",
              ],
              medication: "Fluoxetine 20mg (morning), Melatonin 6mg (bedtime)",
              keyInfo: "Casey is not attending college today. Direct work session with Chervelle at 14:00 (exploitation awareness). Casey's grandmother Margaret calling at 18:00 (weekly call — facilitate in lounge). Casey's social worker visiting at 10:30 for statutory visit. Contact restriction: NO contact with Marcus — report any attempts immediately to RM and police.",
              mood: "Casey has been low and withdrawn since self-harm incident. Staff to offer 1:1 time without pressure. Avoid discussing LADO unless Casey raises it. Use distress tolerance toolkit (located in Casey's room — box on shelf).",
            },
          ].map((yp) => (
            <Card key={yp.ypId} className={cn("border-l-4", yp.clr)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {getYPName(yp.ypId)}
                  <Badge variant="outline" className={cn(
                    yp.riskLevel === "Low" ? "bg-green-100 text-green-800" :
                    yp.riskLevel === "Medium" ? "bg-amber-100 text-amber-800" :
                    "bg-red-100 text-red-800"
                  )}>{yp.riskLevel} Risk</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {/* alerts */}
                <div>
                  <p className="font-medium mb-1 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Alerts</p>
                  <ul className="space-y-0.5">
                    {yp.alerts.map((a, i) => (
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
                  <p className="text-muted-foreground">{yp.keyInfo}</p>
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
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" /> Home-Level Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start gap-2 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
              <span><strong>LADO Investigation Active</strong> — Anna is on restricted duties (no unsupervised contact with Casey). All key working for Casey transferred to Chervelle. Do not discuss LADO details with YP.</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span><strong>Edward supervision overdue</strong> — Darren to schedule within this week. Do not assign Edward to lone-working tasks until supervision is completed.</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
              <span><strong>Maintenance</strong> — Plumber attending at 11:00 for kitchen tap repair. Staff to supervise (visitor protocol). Signed in at reception.</span>
            </div>
          </CardContent>
        </Card>

        {/* key contacts today */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" /> Key Contacts Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {[
                { time: "10:30", what: "Casey's SW (Lisa Green) — statutory visit", who: getStaffName("staff_darren") },
                { time: "11:00", what: "Plumber — kitchen tap repair", who: "Shift leader to supervise" },
                { time: "14:00", what: "Casey direct work session (exploitation)", who: getStaffName("staff_chervelle") },
                { time: "15:00", what: "Jordan CAMHS phone appointment", who: getStaffName("staff_anna") },
                { time: "17:30", what: "Alex returns from football practice", who: "Staff on shift" },
                { time: "18:00", what: "Casey — grandmother Margaret phone call", who: getStaffName("staff_chervelle") },
              ].map((item, i) => (
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

        {/* check frequencies */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" /> Check Frequencies (Night)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-green-50 rounded p-2 text-center">
                <p className="font-bold">{getYPName("yp_alex")}</p>
                <p className="text-lg font-bold text-green-700">60 min</p>
                <p className="text-muted-foreground">Standard checks</p>
              </div>
              <div className="bg-amber-50 rounded p-2 text-center">
                <p className="font-bold">{getYPName("yp_jordan")}</p>
                <p className="text-lg font-bold text-amber-700">45 min</p>
                <p className="text-muted-foreground">ASD — sensory needs</p>
              </div>
              <div className="bg-red-50 rounded p-2 text-center">
                <p className="font-bold">{getYPName("yp_casey")}</p>
                <p className="text-lg font-bold text-red-700">30 min</p>
                <p className="text-muted-foreground">Self-harm risk — HIGH</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* briefing sign-off */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Briefing Protocol</p>
          <p>This daily risk briefing must be reviewed by all staff at the start of each shift. The shift leader is responsible for delivering a verbal briefing covering all alerts, medication due, appointments, and risk levels. Any changes during the shift must be communicated to all staff on duty. Risk levels and check frequencies are reviewed daily by the RM or Deputy. This briefing does not replace the full care plans, risk assessments, and behaviour support plans — staff must be familiar with all individual plans.</p>
        </div>
      </div>
    </PageShell>
  );
}
