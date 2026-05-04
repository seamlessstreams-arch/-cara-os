"use client";

import { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Phone,
  Flame,
  Droplets,
  Zap,
  Users,
  Wifi,
  CloudSnow,
  Building2,
  HeartPulse,
  ShieldCheck,
  Package,
  GitBranch,
  RotateCcw,
  AlertTriangle,
  ClipboardList,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ─────────────────────────────────────────────────────────────────── */

interface ScenarioPlan {
  id: string;
  title: string;
  icon: React.ElementType;
  severity: "critical" | "high" | "medium";
  content: string[];
}

/* ── scenario data ─────────────────────────────────────────────────────────── */

const SEV_CLR: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-amber-100 text-amber-800",
  medium: "bg-blue-100 text-blue-800",
};

const BORDER_SEV: Record<string, string> = {
  critical: "border-l-red-500",
  high: "border-l-amber-400",
  medium: "border-l-blue-400",
};

const SCENARIOS: ScenarioPlan[] = [
  {
    id: "sc_fire",
    title: "Fire / Evacuation",
    icon: Flame,
    severity: "critical",
    content: [
      "IMMEDIATE ACTIONS:",
      "1. Activate fire alarm and call 999.",
      "2. Evacuate all young people and staff via nearest safe exit.",
      "3. Assembly point: front garden by the main gate.",
      "4. Account for all persons using the evacuation register (grab bag).",
      "5. Do NOT re-enter the building for any reason.",
      "",
      "GRAB BAGS (located: office and kitchen exit):",
      "• Young people's emergency contact details and medication summary",
      "• Torches, emergency blankets, high-vis vests",
      "• First aid kit and mobile phone charger",
      "• Cash float (minimum £100)",
      "• Copy of this Business Continuity Plan",
      "",
      "TEMPORARY ACCOMMODATION:",
      `• Primary: Acacia Therapy Homes Head Office — contact ${getStaffName("staff_alicia")} (RI)`,
      "• Secondary: Pre-arranged agreement with Premier Inn Derby (account ref: OAK-BCP-001)",
      "• Tertiary: Contact LA emergency duty for placement assistance",
      "",
      "NOTIFICATION CHAIN:",
      `1. ${getStaffName("staff_darren")} (RM) — immediately`,
      `2. ${getStaffName("staff_alicia")} (RI) — within 15 minutes`,
      "3. Each young person's social worker — within 1 hour",
      "4. Ofsted — within 24 hours (Reg 40 notification)",
      "5. Parents/carers as per individual placement plans",
    ],
  },
  {
    id: "sc_flood",
    title: "Flood / Water Damage",
    icon: Droplets,
    severity: "high",
    content: [
      "SHUT-OFF PROCEDURES:",
      "1. Mains water stopcock: under the kitchen sink (turn clockwise to close).",
      "2. If electrical risk, isolate power at the consumer unit (utility cupboard, ground floor).",
      "3. Do NOT enter standing water if electricity has not been isolated.",
      "",
      "EMERGENCY ACCOMMODATION:",
      "• Follow the same temporary accommodation arrangements as Fire/Evacuation above.",
      "• If partial damage only, assess whether unaffected areas are safe for continued occupation.",
      "",
      "SALVAGE PRIORITIES (in order):",
      "1. Young people's medication and MAR charts",
      "2. Controlled drugs cabinet contents (secure transfer)",
      "3. Care files and placement plans (originals)",
      "4. IT equipment and backup drives",
      "5. Young people's personal belongings",
      "",
      "RESTORATION:",
      "• Contact emergency maintenance: HomeFix 24/7 — 0800 XXX XXXX (ref: OAK-001)",
      "• Contact insurance provider within 24 hours",
      "• Arrange professional drying and dehumidification",
      `• ${getStaffName("staff_darren")} to assess building safety before re-occupation`,
    ],
  },
  {
    id: "sc_power",
    title: "Power Failure",
    icon: Zap,
    severity: "high",
    content: [
      "GENERATOR:",
      "• Portable generator location: locked storage shed (key on main keyset).",
      "• Fuel: minimum 20L reserve maintained at all times.",
      "• Generator supplies power to priority circuits only.",
      "",
      "PRIORITY AREAS (generator connection order):",
      "1. Emergency lighting (hallways, staircase)",
      "2. Kitchen (fridge/freezer for medication and food)",
      "3. Office (IT systems and communications)",
      "",
      "TORCH AND CANDLE SAFETY:",
      "• Battery torches: office cupboard (top shelf) and in each young person's bedroom drawer.",
      "• Candles are NEVER to be used — fire risk. LED candles only.",
      "• Check torch batteries monthly (maintenance checklist item).",
      "",
      "FOOD SAFETY:",
      "• If power out for more than 4 hours, do NOT open the freezer.",
      "• Fridge contents safe for 2 hours if door remains closed.",
      "• Emergency food supplies: tinned goods and UHT milk in the pantry.",
      "• If prolonged outage (12+ hours), arrange hot meals from external provider.",
      "",
      "REPORTING:",
      "• Report power cut to Western Power Distribution: 105 (free call).",
      `• Notify ${getStaffName("staff_darren")} (RM) if outage expected to exceed 2 hours.`,
    ],
  },
  {
    id: "sc_staff",
    title: "Staff Shortages (Pandemic / Mass Sickness)",
    icon: Users,
    severity: "critical",
    content: [
      "MINIMUM STAFFING LEVELS (see Section 3 below for full table):",
      "• Day shift: 2 staff minimum (1 must be senior or shift leader).",
      "• Night: 1 waking night + 1 sleep-in minimum.",
      "• Below minimum = immediate on-call escalation.",
      "",
      "AGENCY CONTACTS (pre-approved, Ofsted-notified):",
      "• Prestige Nursing & Care — 0115 XXX XXXX (account ref: ACH-OAK-001)",
      "• Liquid Personnel — 0121 XXX XXXX (account ref: OAK-LP-002)",
      "• Reed Social Care — 0800 XXX XXXX",
      "",
      "PRIORITY ROLES (fill in this order):",
      `1. Shift leader / senior — ${getStaffName("staff_ryan")} (Deputy) to cover or arrange`,
      "2. Waking night staff — essential, cannot operate without",
      "3. Day care staff — maintain ratio compliance",
      "4. Admin/ancillary — can be deferred",
      "",
      "REDUCED SERVICE PLAN (pandemic activation):",
      "• Cancel non-essential appointments and activities.",
      "• Reduce to core care tasks: meals, medication, welfare, education support.",
      `• ${getStaffName("staff_darren")} and ${getStaffName("staff_ryan")} to work extended shifts as required.`,
      "• RI to consider temporary registration variation with Ofsted if prolonged.",
      "• All agency staff must receive emergency induction before first shift.",
      "• Daily staffing review meeting at 08:00 until crisis resolved.",
    ],
  },
  {
    id: "sc_it",
    title: "Loss of IT / Communications",
    icon: Wifi,
    severity: "medium",
    content: [
      "PAPER-BASED FALLBACK:",
      "• Blank forms for daily logs, medication records, and incident reports are stored in the office filing cabinet (drawer 3, labelled 'Emergency Paper Forms').",
      "• All paper records must be transferred to the digital system within 24 hours of IT restoration.",
      "",
      "PRIORITY CONTACTS LIST (printed copy):",
      "• A printed priority contacts list is kept in the grab bag and in the office emergency folder.",
      "• Includes: all young people's social workers, parents/carers, emergency services, LA duty teams, Ofsted.",
      "• Updated quarterly by the Deputy Manager.",
      "",
      "MEDICATION BACKUP:",
      "• A paper copy of all current MAR charts is printed weekly and stored in the medication cabinet.",
      "• If electronic MAR is unavailable, use paper MAR and record the time of each administration.",
      "• Pharmacist backup: Boots Derby — 01332 XXX XXXX (they hold our prescription records).",
      "",
      "COMMUNICATION ALTERNATIVES:",
      "• Staff personal mobile phones may be used as backup (with RM approval).",
      "• Landline: 01332 000 000 (Oak House main line, separate from broadband).",
      "• If total communications failure, send staff member to nearest phone (neighbour/payphone).",
    ],
  },
  {
    id: "sc_weather",
    title: "Severe Weather",
    icon: CloudSnow,
    severity: "medium",
    content: [
      "TRANSPORT CONTINGENCY:",
      "• If roads unsafe, young people remain at home. Education to be notified.",
      "• Staff who cannot travel safely should inform RM immediately — do not attempt dangerous journeys.",
      "• Nearest staff member may be redeployed to cover (check rota for proximity).",
      "",
      "SCHOOL CLOSURES:",
      "• If schools close, structured activities must be provided at home.",
      "• Educational packs for each young person are in the office (shelf 2).",
      "• Maintain routine as closely as possible (mealtimes, bedtimes).",
      "",
      "SUPPLIES CHECKLIST (maintain at all times Oct-Mar):",
      "• Minimum 3 days of non-perishable food supplies",
      "• Bottled water: 2L per person per day (3 days supply)",
      "• Rock salt / grit for paths and driveway",
      "• Snow shovels and ice scrapers (storage shed)",
      "• Extra blankets and warm clothing accessible",
      "• Fully charged power banks for phones",
      "• Battery-powered radio",
      "",
      "HEATING FAILURE:",
      "• Portable electric heaters: 3 available in storage shed (PAT tested).",
      "• If heating cannot be restored within 4 hours, contact RM to assess relocation.",
      "• Young people's bedrooms are priority for heating.",
    ],
  },
  {
    id: "sc_building",
    title: "Building Damage (Structural)",
    icon: Building2,
    severity: "critical",
    content: [
      "EVACUATION TRIGGERS (immediate evacuation required):",
      "• Visible structural cracks in load-bearing walls",
      "• Roof collapse or significant roof damage",
      "• Gas leak (smell of gas — evacuate, do not use switches/phones inside)",
      "• Subsidence causing doors/windows to jam",
      "• Any concern that the building is unsafe to occupy",
      "",
      "GAS LEAK PROCEDURE:",
      "1. Do NOT operate any electrical switches, phones, or doorbells.",
      "2. Open windows if safe to do so.",
      "3. Evacuate to assembly point.",
      "4. Call National Gas Emergency: 0800 111 999 from outside the building.",
      "",
      "ENGINEERING CONTACTS:",
      "• Structural: Derby Building Consultants — 01332 XXX XXXX",
      "• Gas: National Gas Emergency — 0800 111 999",
      "• Emergency maintenance: HomeFix 24/7 — 0800 XXX XXXX (ref: OAK-001)",
      "• Insurance: Zurich Municipal — policy ref: OAK-ZM-2025",
      "",
      "ALTERNATIVE PREMISES:",
      "• Follow temporary accommodation plan as per Fire/Evacuation scenario.",
      `• ${getStaffName("staff_alicia")} (RI) to assess whether alternative Acacia property is available.`,
      "• LA emergency duty team to be notified for placement contingency.",
      `• ${getStaffName("staff_darren")} (RM) to arrange Ofsted notification within 24 hours.`,
    ],
  },
  {
    id: "sc_death",
    title: "Death of a Child or Staff Member",
    icon: HeartPulse,
    severity: "critical",
    content: [
      "IMMEDIATE ACTIONS:",
      "1. Call 999 immediately. Administer CPR/first aid if appropriate.",
      "2. Do NOT move the person or disturb the scene (unless actively providing first aid).",
      "3. Secure the area — other young people and staff to be moved to a separate room.",
      "4. Ensure remaining young people are supervised and supported.",
      "",
      "NOTIFICATION CHAIN (in order):",
      `1. ${getStaffName("staff_darren")} (RM) — immediately, regardless of time`,
      `2. ${getStaffName("staff_alicia")} (RI) — immediately after RM`,
      "3. Police (if not already attending)",
      "4. Ofsted — within 24 hours (Reg 40 notification — serious event)",
      "5. Local Authority Designated Officer (LADO) if safeguarding concern",
      "6. Young person's social worker, IRO, and parents/carers",
      "7. DfE (if child death) via the Child Death Overview Panel",
      "",
      "SUPPORT ARRANGEMENTS:",
      "• Remaining young people: immediate 1:1 support. Offer contact with trusted adults.",
      "• Staff on duty: offer immediate relief if needed. Trauma support via EAP (0800 XXX XXXX).",
      "• Staff debriefing within 48 hours (facilitated by external professional).",
      `• ${getStaffName("staff_ryan")} (Deputy) to coordinate rota cover for affected staff.`,
      "• Critical incident debrief within 7 days.",
      "• Ongoing therapeutic support to be arranged for young people and staff.",
      "",
      "DOCUMENTATION:",
      "• Detailed written account from all staff present — to be completed before leaving shift.",
      "• Preserve all CCTV footage, daily logs, and medication records.",
      "• Do NOT discuss details with media — refer all enquiries to RI/Head Office.",
    ],
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function BusinessContinuityPage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    sc_fire: true,
    sc_death: true,
  });
  const toggle = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <PageShell
      title="Business Continuity Plan"
      subtitle="Emergency Preparedness · Operational Resilience · Civil Contingencies"
      actions={<PrintButton title="Business Continuity Plan" />}
    >
      <div id="print-area">
        {/* ── Review Status Banner ──────────────────────────────────────────── */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <p className="font-semibold text-emerald-800">
              Document Review Status
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-emerald-700">
            <span>
              Last reviewed:{" "}
              <strong>{d(-45)}</strong> by{" "}
              {getStaffName("staff_darren")} (RM)
            </span>
            <span>
              Next review due: <strong>{d(45)}</strong>
            </span>
            <span>Review frequency: Every 6 months or after any activation</span>
          </div>
        </div>

        {/* ── Section 1: Key Contacts ──────────────────────────────────────── */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-indigo-600" />
              Key Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  role: "Emergency On-Call",
                  name: getStaffName("staff_darren"),
                  detail: "07XXX XXXXXX (24/7)",
                  tag: "Primary",
                },
                {
                  role: "Deputy On-Call",
                  name: getStaffName("staff_ryan"),
                  detail: "07XXX XXXXXX (backup)",
                  tag: "Secondary",
                },
                {
                  role: "Responsible Individual",
                  name: getStaffName("staff_alicia"),
                  detail: "07XXX XXXXXX",
                  tag: "Escalation",
                },
                {
                  role: "Head Office",
                  name: "Acacia Therapy Homes",
                  detail: "01332 XXX XXXX",
                  tag: "Corporate",
                },
                {
                  role: "LA Emergency Duty (Derby)",
                  name: "Derby City Council",
                  detail: "0300 XXX XXXX",
                  tag: "External",
                },
                {
                  role: "LA Emergency Duty (Notts)",
                  name: "Nottinghamshire CC",
                  detail: "0300 XXX XXXX",
                  tag: "External",
                },
                {
                  role: "Emergency Maintenance",
                  name: "HomeFix 24/7",
                  detail: "0800 XXX XXXX (ref: OAK-001)",
                  tag: "Utilities",
                },
                {
                  role: "Water Emergency",
                  name: "Severn Trent",
                  detail: "0800 783 4444",
                  tag: "Utilities",
                },
                {
                  role: "Power Emergency",
                  name: "Western Power Distribution",
                  detail: "105 (free call)",
                  tag: "Utilities",
                },
                {
                  role: "Gas Emergency",
                  name: "National Gas",
                  detail: "0800 111 999",
                  tag: "Utilities",
                },
              ].map((c, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{c.role}</p>
                    <p className="text-sm text-muted-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.detail}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {c.tag}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Section 2: Scenario Plans ────────────────────────────────────── */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Scenario Plans
          </h2>
          <div className="space-y-4">
            {SCENARIOS.map((s) => {
              const open = expanded[s.id];
              return (
                <Card
                  key={s.id}
                  className={cn("border-l-4", BORDER_SEV[s.severity])}
                >
                  <CardHeader
                    className="pb-2 cursor-pointer"
                    onClick={() => toggle(s.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <s.icon className="h-4 w-4 text-indigo-600" />
                          {s.title}
                          <Badge
                            variant="outline"
                            className={SEV_CLR[s.severity]}
                          >
                            {s.severity}
                          </Badge>
                        </CardTitle>
                      </div>
                      {open ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  {open && (
                    <CardContent className="pt-0 space-y-2 text-sm">
                      {s.content.map((line, i) =>
                        line === "" ? (
                          <div key={i} className="h-2" />
                        ) : (
                          <p
                            key={i}
                            className={cn(
                              "text-muted-foreground",
                              line.startsWith("•") ? "pl-4" : "",
                              line.match(/^\d+\./) ? "pl-4" : "",
                              line.endsWith(":") ? "font-semibold text-foreground mt-2" : ""
                            )}
                          >
                            {line}
                          </p>
                        )
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* ── Section 3: Minimum Staffing Levels ──────────────────────────── */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              Minimum Staffing Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Based on 3 young people in placement. Levels must be maintained at
              all times. Any shortfall requires immediate RM/on-call
              notification.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium">Period</th>
                    <th className="text-left p-2 font-medium">Times</th>
                    <th className="text-center p-2 font-medium">Minimum Staff</th>
                    <th className="text-center p-2 font-medium">Senior Required</th>
                    <th className="text-left p-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      period: "Weekday — Day",
                      times: "07:00–22:00",
                      min: 2,
                      senior: "Yes",
                      notes: "1 senior/shift leader + 1 RCW minimum",
                    },
                    {
                      period: "Weekday — Night",
                      times: "22:00–07:00",
                      min: 2,
                      senior: "No",
                      notes: "1 waking night + 1 sleep-in",
                    },
                    {
                      period: "Weekend — Day",
                      times: "07:00–22:00",
                      min: 2,
                      senior: "Yes",
                      notes: "Activities require additional risk assessment",
                    },
                    {
                      period: "Weekend — Night",
                      times: "22:00–07:00",
                      min: 2,
                      senior: "No",
                      notes: "1 waking night + 1 sleep-in",
                    },
                    {
                      period: "Bank Holiday",
                      times: "07:00–22:00",
                      min: 2,
                      senior: "Yes",
                      notes: "On-call RM must be available within 30 mins",
                    },
                    {
                      period: "Emergency Minimum",
                      times: "Any",
                      min: 1,
                      senior: "Yes",
                      notes:
                        "Absolute minimum — only while replacement en route (max 2 hrs)",
                    },
                  ].map((row, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2 font-medium">{row.period}</td>
                      <td className="p-2 text-muted-foreground">{row.times}</td>
                      <td className="p-2 text-center">
                        <Badge
                          variant="outline"
                          className={
                            row.period === "Emergency Minimum"
                              ? "bg-red-100 text-red-800"
                              : "bg-emerald-100 text-emerald-800"
                          }
                        >
                          {row.min}
                        </Badge>
                      </td>
                      <td className="p-2 text-center text-muted-foreground">
                        {row.senior}
                      </td>
                      <td className="p-2 text-muted-foreground text-xs">
                        {row.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 4: Emergency Supplies Checklist ──────────────────────── */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-indigo-600" />
              Emergency Supplies Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2">
                Grab Bag Contents (2 bags — office and kitchen exit)
              </p>
              <div className="grid gap-1 sm:grid-cols-2 text-sm text-muted-foreground">
                {[
                  "Young people's emergency contact cards",
                  "Copy of current MAR charts",
                  "Medication summary sheet",
                  "Copy of Business Continuity Plan",
                  "Cash float — minimum £100",
                  "2 x torches with spare batteries",
                  "Emergency blankets (foil) x 6",
                  "High-vis vests x 6",
                  "First aid kit (HSE compliant)",
                  "Mobile phone + charger + power bank",
                  "Pen, notepad, and blank incident forms",
                  "Building keys (spare set)",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ClipboardList className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">First Aid Supplies</p>
              <div className="grid gap-1 sm:grid-cols-2 text-sm text-muted-foreground">
                {[
                  "HSE-compliant first aid kit (office)",
                  "HSE-compliant first aid kit (kitchen)",
                  "Burns kit (kitchen)",
                  "EpiPen — kitchen first aid box and office cabinet",
                  "Defibrillator — main hallway (if installed)",
                  "Eye wash station — kitchen",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ClipboardList className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">
                Backup Medication List
              </p>
              <p className="text-sm text-muted-foreground">
                A paper copy of all current prescriptions and MAR charts is
                printed every Monday by the shift leader and stored in the
                medication cabinet. This includes dosage, timing,
                contraindications, and pharmacy contact details. In the event of
                IT failure, paper MARs become the primary record.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 5: Communication Tree ───────────────────────────────── */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-indigo-600" />
              Communication Tree
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              In any emergency, the following communication chain is activated.
              Each person is responsible for contacting the next level. If unable
              to reach someone, move to the next contact and retry later.
            </p>
            <div className="space-y-3">
              {[
                {
                  step: 1,
                  who: "Staff on duty (discovering staff member)",
                  contacts: "999 (if applicable) + On-call Manager",
                  timeframe: "Immediately",
                },
                {
                  step: 2,
                  who: `${getStaffName("staff_darren")} (RM / On-call)`,
                  contacts: `${getStaffName("staff_alicia")} (RI) + ${getStaffName("staff_ryan")} (Deputy)`,
                  timeframe: "Within 15 minutes",
                },
                {
                  step: 3,
                  who: `${getStaffName("staff_ryan")} (Deputy)`,
                  contacts: "All rostered staff + agency if needed",
                  timeframe: "Within 30 minutes",
                },
                {
                  step: 4,
                  who: `${getStaffName("staff_darren")} (RM)`,
                  contacts:
                    "Young people's social workers + LA emergency duty",
                  timeframe: "Within 1 hour",
                },
                {
                  step: 5,
                  who: `${getStaffName("staff_alicia")} (RI)`,
                  contacts: "Ofsted + Head Office + insurance",
                  timeframe: "Within 24 hours",
                },
                {
                  step: 6,
                  who: `${getStaffName("staff_darren")} (RM)`,
                  contacts: "Parents/carers as per placement plans",
                  timeframe: "Within 24 hours",
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold">
                    {s.step}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.who}</p>
                    <p className="text-sm text-muted-foreground">
                      Contacts: {s.contacts}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Timeframe: {s.timeframe}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Section 6: Recovery Procedures ──────────────────────────────── */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-indigo-600" />
              Recovery Procedures
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-semibold mb-1">
                Phase 1: Immediate Stabilisation (0–24 hours)
              </p>
              <div className="space-y-1 text-muted-foreground">
                <p className="pl-4">
                  • Ensure all young people and staff are safe and accounted for.
                </p>
                <p className="pl-4">
                  • Secure temporary accommodation if home is uninhabitable.
                </p>
                <p className="pl-4">
                  • Ensure medication continuity — contact pharmacy if needed.
                </p>
                <p className="pl-4">
                  • Complete all regulatory notifications (Ofsted, LA, social
                  workers).
                </p>
                <p className="pl-4">
                  • Brief all staff — verbal and written communication.
                </p>
              </div>
            </div>

            <div>
              <p className="font-semibold mb-1">
                Phase 2: Short-Term Recovery (24 hours – 1 week)
              </p>
              <div className="space-y-1 text-muted-foreground">
                <p className="pl-4">
                  • Assess building safety and begin remediation if applicable.
                </p>
                <p className="pl-4">
                  • Restore IT systems and transfer any paper records to
                  digital.
                </p>
                <p className="pl-4">
                  • Arrange therapeutic support for affected young people and
                  staff.
                </p>
                <p className="pl-4">
                  • Review and adjust rotas to manage staff wellbeing.
                </p>
                <p className="pl-4">
                  • Insurance claim initiated and loss assessment completed.
                </p>
              </div>
            </div>

            <div>
              <p className="font-semibold mb-1">
                Phase 3: Return to Normal Operations (1–4 weeks)
              </p>
              <div className="space-y-1 text-muted-foreground">
                <p className="pl-4">
                  • Full return to home (if evacuated) — safety sign-off by RM
                  and RI.
                </p>
                <p className="pl-4">
                  • Resume all normal routines, activities, and education.
                </p>
                <p className="pl-4">
                  • Post-incident review meeting with all staff.
                </p>
                <p className="pl-4">
                  • Update this Business Continuity Plan with lessons learned.
                </p>
                <p className="pl-4">
                  • Reg 45 report to include details of incident and response.
                </p>
              </div>
            </div>

            <div>
              <p className="font-semibold mb-1">
                Phase 4: Review and Learning (4+ weeks)
              </p>
              <div className="space-y-1 text-muted-foreground">
                <p className="pl-4">
                  • Formal debrief and lessons-learned report produced.
                </p>
                <p className="pl-4">
                  • Training needs identified and scheduled.
                </p>
                <p className="pl-4">
                  • Policy and procedure updates implemented.
                </p>
                <p className="pl-4">
                  • Share learning with Acacia Therapy Homes group (if
                  applicable).
                </p>
                <p className="pl-4">
                  • RI to confirm sign-off that recovery is complete.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Regulatory Footer ───────────────────────────────────────────── */}
        <div className="bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Regulatory Framework</p>
              <p>
                This Business Continuity Plan is maintained in accordance with
                the Civil Contingencies Act 2004, the Children&apos;s Homes
                (England) Regulations 2015 (Regulation 5 — Statement of Purpose
                must include arrangements for emergency procedures; Regulation
                12 — the protection of children standard; Regulation 13 — the
                leadership and management standard), and the Guide to the
                Children&apos;s Homes Regulations including the Quality
                Standards. Ofsted inspectors will assess the home&apos;s
                emergency preparedness as part of the leadership and management
                judgement. This plan is reviewed every six months, following any
                activation, or following any significant change to the
                home&apos;s operation.
              </p>
              <p className="mt-2">
                Document owner: {getStaffName("staff_darren")} (Registered
                Manager) · Approved by: {getStaffName("staff_alicia")}{" "}
                (Responsible Individual) · Version: 3.1 · Classification:
                Internal — All Staff
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
