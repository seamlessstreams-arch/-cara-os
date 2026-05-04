"use client";

import { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Moon, Shield, Phone, Clock, AlertTriangle, CheckCircle2, Flame, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── types ─────────────────────────────────────────────────────────────────── */

interface GuidanceSection {
  id: string;
  title: string;
  icon: React.ElementType;
  priority: "essential" | "important" | "reference";
  lastUpdated: string;
  content: string[];
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const PRI_CLR: Record<string, string> = { essential: "bg-red-100 text-red-800", important: "bg-amber-100 text-amber-800", reference: "bg-blue-100 text-blue-800" };
const BORDER_PRI: Record<string, string> = { essential: "border-l-red-500", important: "border-l-amber-400", reference: "border-l-blue-400" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SECTIONS: GuidanceSection[] = [
  {
    id: "ns_1", title: "Night Check Schedule", icon: Moon, priority: "essential", lastUpdated: d(-14),
    content: [
      "Night checks are conducted at intervals specified in each young person's care plan:",
      "• Alex: Every 60 minutes (standard). Check breathing, covers, general welfare.",
      "• Jordan: Every 45 minutes (enhanced due to ASD — may have sleep disturbance). Check breathing, positioning, any signs of distress. Jordan may wake if door is opened — use visual check through observation panel where possible.",
      "• Casey: Every 30 minutes (enhanced due to self-harm risk). Check breathing, general welfare, check for any items of concern. Casey's risk management plan specifies torch check only — do not enter room unless concern identified.",
      "Record every check in the night check log with time, observation, and initials.",
      "If a young person is awake, acknowledge them calmly but avoid lengthy conversations that may prevent return to sleep.",
      "If any young person is not in their room during a check, follow the missing from care protocol immediately.",
    ],
  },
  {
    id: "ns_2", title: "Emergency Procedures", icon: AlertTriangle, priority: "essential", lastUpdated: d(-14),
    content: [
      "FIRE: Follow the fire evacuation plan displayed in the hallway. Assembly point: front garden by the gate. Call 999. Do not re-enter the building. Account for all young people and staff.",
      "MEDICAL EMERGENCY: Call 999 if any young person is unconscious, not breathing, having a seizure, or you suspect overdose. Administer first aid within your competency. Contact the on-call manager immediately after calling 999.",
      "MISSING: If any young person is discovered missing during a night check, call the police immediately (999 — child missing from care) and then call the on-call manager. Complete a missing from care report. Do not leave the home to search — remaining young people must be supervised.",
      "INTRUDER: Do not confront. Secure young people in their rooms. Call 999. Call on-call manager. Record details of intruder description.",
      "POWER FAILURE: Torches are in the office cupboard (top shelf) and in each young person's bedroom (drawer). Emergency lighting will activate in hallways. If prolonged, contact on-call manager.",
      "FLOODING / WATER LEAK: Turn off water at mains stopcock (under kitchen sink). Isolate electricity to affected area if safe. Contact on-call manager and emergency maintenance number.",
    ],
  },
  {
    id: "ns_3", title: "Medication — Night Procedures", icon: Heart, priority: "essential", lastUpdated: d(-14),
    content: [
      "Night medication administration times:",
      "• Alex — Melatonin 3mg at 21:00 (must be given by waking night staff at handover)",
      "• Casey — Promethazine 25mg PRN (only if Casey requests or is unable to sleep after 30 mins. Max 1 dose per night. 6-hour gap from any daytime dose.)",
      "All medication must be administered by a staff member with a current Level 3 medication competency certificate.",
      "Record all administrations on the MAR chart immediately. Record any refusals.",
      "If a young person vomits within 30 minutes of taking medication, do NOT give a second dose. Record on MAR chart and inform the on-call manager.",
      "Emergency medication: EpiPen locations — kitchen first aid box and office cabinet. Any staff member may administer in an emergency.",
      "Controlled drugs cabinet is locked. Night staff have access via the shift leader key.",
    ],
  },
  {
    id: "ns_4", title: "Lone Working Protocol", icon: Shield, priority: "essential", lastUpdated: d(-14),
    content: [
      "Waking night staff should never be the sole adult in the building. A sleep-in staff member must always be present.",
      "If the sleep-in staff member is called to a disturbance and does not return within 30 minutes, the waking night staff should check on them.",
      "Waking night staff must carry the emergency phone and personal alarm at all times.",
      "Buddy check system: waking night staff must text the on-call manager at 00:00 and 04:00 with a brief status update (e.g., 'All settled, no concerns'). If on-call does not receive the check-in, they will call the home.",
      "If you feel unwell during the night and cannot continue, call the on-call manager immediately. Do NOT leave the building until relief staff arrive.",
      "During night checks, carry your phone and personal alarm. If you feel at risk at any point, use the personal alarm to alert the sleep-in staff.",
    ],
  },
  {
    id: "ns_5", title: "Contact Numbers", icon: Phone, priority: "essential", lastUpdated: d(-7),
    content: [
      "ON-CALL MANAGER: Darren Laville — 07XXX XXXXXX (primary) / Ryan — 07XXX XXXXXX (backup)",
      "EMERGENCY SERVICES: 999",
      "NON-EMERGENCY POLICE: 101",
      "CHILDREN'S SOCIAL CARE (out of hours): 0300 XXX XXXX",
      "EMERGENCY MAINTENANCE: HomeFix 24/7 — 0800 XXX XXXX (account ref: OAK-001)",
      "NHS 111: For non-emergency medical advice",
      "POISON INFORMATION: 0344 892 0111 (National Poisons Information Service)",
      "These numbers are also displayed on the emergency contacts board in the office.",
    ],
  },
  {
    id: "ns_6", title: "Night Shift Handover", icon: Clock, priority: "important", lastUpdated: d(-14),
    content: [
      "Handover from evening staff to waking night staff must cover:",
      "• Each young person's mood, behaviour, and any incidents during the evening",
      "• Any medication given during the evening shift",
      "• Any specific concerns or instructions for the night (e.g., 'Casey had a difficult phone call — may be unsettled')",
      "• Any expected visitors or calls (e.g., emergency out-of-hours SW call expected)",
      "• Location of any confiscated items",
      "• Status of building security — all external doors locked, windows secured, alarm set",
      "Morning handover from waking night to day staff must include:",
      "• Summary of the night — any disturbances, wake-ups, or concerns",
      "• Night check summary",
      "• Any maintenance issues identified overnight",
      "• Medication administered overnight",
      "• Young people's wake-up status — who is awake, who needs waking for school",
    ],
  },
  {
    id: "ns_7", title: "Night Tasks Checklist", icon: CheckCircle2, priority: "important", lastUpdated: d(-14),
    content: [
      "21:00 — Receive handover from evening staff. Conduct building security check.",
      "21:30 — Administer night medications. Ensure all young people have water and are settling.",
      "22:00 — First night check. Wi-Fi curfew activates (Jordan and Casey — Alex has extended to 22:30 per agreement).",
      "22:30 onwards — Night checks at prescribed intervals. Complete night check log entries.",
      "23:00 — Kitchen check: appliances off, surfaces clean, bins secure.",
      "00:00 — Buddy check text to on-call manager.",
      "00:00–05:00 — Night checks continue. Complete any admin tasks: laundry, preparation for morning, filing.",
      "04:00 — Second buddy check text to on-call manager.",
      "05:30 — Prepare breakfast area. Check that packed lunches are ready (if pre-made).",
      "06:30 — Final night check. Begin wake-up routine for school-day young people.",
      "07:00 — Handover to day staff. Complete night log summary.",
      "Note: Admin tasks should never take priority over night checks. If you fall behind on checks due to a disturbance, note the reason in the log.",
    ],
  },
  {
    id: "ns_8", title: "Fire Evacuation — Night Specific", icon: Flame, priority: "essential", lastUpdated: d(-30),
    content: [
      "Night fire evacuation procedure differs from daytime:",
      "1. Sound the alarm manually if not already activated.",
      "2. Alert sleep-in staff member immediately.",
      "3. Waking night goes to bedrooms in order: Casey (closest to stairs), Jordan, Alex.",
      "4. Use calm but firm voice: '[Name], we need to leave the building. Follow me now.'",
      "5. Jordan may be disoriented — use visual cues (torch pointed at exit). Do NOT touch Jordan without warning — say 'I'm going to put my hand on your shoulder' first.",
      "6. Casey may need reassurance — brief and directive: 'You're safe, we just need to get outside.'",
      "7. Assembly at front garden gate. Count all persons. Call 999.",
      "8. Do NOT re-enter for belongings, phones, or anything else.",
      "9. Wrap in emergency blankets (stored in garden shed box).",
      "10. Wait for fire service. On-call manager will be called by waking night.",
    ],
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function NightStaffGuidancePage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ ns_1: true, ns_2: true });
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <PageShell title="Night Staff Guidance" subtitle="Waking Night & Sleep-In Procedures — Oak House" actions={<PrintButton title="Night Staff Guidance" />}>
      <div id="print-area">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <p className="font-semibold text-indigo-800 mb-1">For All Night Staff — Please Read Before Every Shift</p>
          <p className="text-indigo-700 text-sm">This guidance contains essential information for waking night and sleep-in staff. All sections marked &quot;Essential&quot; must be read and understood before commencing duty. If you are unsure about any procedure, contact the on-call manager before the situation arises.</p>
        </div>

        <div className="space-y-4">
          {SECTIONS.map((s) => {
            const open = expanded[s.id];
            return (
              <Card key={s.id} className={cn("border-l-4", BORDER_PRI[s.priority])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(s.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <s.icon className="h-4 w-4 text-indigo-600" />
                        {s.title}
                        <Badge variant="outline" className={PRI_CLR[s.priority]}>{s.priority}</Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Last updated: {s.lastUpdated}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-2 text-sm">
                    {s.content.map((line, i) => (
                      <p key={i} className={cn("text-muted-foreground", line.startsWith("•") ? "pl-4" : "", line.match(/^\d+\./) ? "pl-4" : "")}>{line}</p>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Document Control</p>
          <p>This guidance document is reviewed monthly by the Registered Manager. Last comprehensive review: {d(-14)}. Any changes are communicated at team meetings and via the communication book. Staff must sign to confirm they have read and understood updated guidance. This document supports compliance with Children&apos;s Homes (England) Regulations 2015 (Reg 12, 13, 23), Working Time Regulations 1998, and Lone Working Policy.</p>
        </div>
      </div>
    </PageShell>
  );
}