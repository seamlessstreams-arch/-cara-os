"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Moon, Clock, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Eye, ShieldAlert, Pill, ArrowUpDown, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

interface NightCheck {
  time: string;
  childId: string;
  status: "asleep" | "awake_settled" | "awake_unsettled" | "not_in_room" | "refused_entry";
  notes: string;
}

interface NightIncident {
  time: string;
  childId: string | null;
  type: "disturbance" | "self_harm_concern" | "missing" | "medication" | "property" | "visitor" | "other";
  description: string;
  actionTaken: string;
  escalated: boolean;
  escalatedTo: string | null;
}

interface NightLogEntry {
  id: string;
  date: string;
  wakingNightStaff: string[];
  sleepInStaff: string | null;
  shiftStart: string;
  shiftEnd: string;
  handoverFromDay: string;
  handoverToMorning: string;
  checks: NightCheck[];
  incidents: NightIncident[];
  medicationGiven: { time: string; childId: string; medication: string; dose: string; notes: string }[];
  securityChecks: { time: string; item: string; status: "secure" | "issue" }[];
  summary: string;
  concerns: string | null;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const CHECK_STATUS_META: Record<string, { label: string; color: string }> = {
  asleep: { label: "Asleep", color: "bg-green-100 text-green-800" },
  awake_settled: { label: "Awake (Settled)", color: "bg-blue-100 text-blue-800" },
  awake_unsettled: { label: "Awake (Unsettled)", color: "bg-amber-100 text-amber-800" },
  not_in_room: { label: "Not in Room", color: "bg-red-100 text-red-800" },
  refused_entry: { label: "Refused Entry", color: "bg-purple-100 text-purple-800" },
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: NightLogEntry[] = [
  {
    id: "nl_001", date: d(-1),
    wakingNightStaff: ["staff_mirela"], sleepInStaff: "staff_lackson",
    shiftStart: "22:00", shiftEnd: "07:30",
    handoverFromDay: "All YP settled in rooms by 21:30. Casey had a good evening — engaged with grandmother's call. Jordan used visual bedtime routine. Alex in bed after watching football highlights. Casey's 30-min checks continue. Jordan's melatonin given at 20:45 by day staff. Casey's melatonin given at 21:00.",
    handoverToMorning: "Quiet night overall. All children slept well. Casey woke briefly at 02:15 — reassured and settled within 10 minutes. No incidents. Medication: Casey's melatonin was given by day staff. Building secure. Ready for morning handover.",
    checks: [
      { time: "22:30", childId: "yp_alex", status: "asleep", notes: "Asleep. Light breathing. Phone on charge on bedside table." },
      { time: "22:30", childId: "yp_jordan", status: "asleep", notes: "Asleep. Weighted blanket in place. Nightlight on as per sensory profile." },
      { time: "22:30", childId: "yp_casey", status: "awake_settled", notes: "Awake but calm. Listening to music with earphones. Acknowledged staff through door." },
      { time: "23:00", childId: "yp_casey", status: "asleep", notes: "Asleep. Earphones removed and placed on shelf." },
      { time: "23:30", childId: "yp_alex", status: "asleep", notes: "Asleep. No change." },
      { time: "23:30", childId: "yp_jordan", status: "asleep", notes: "Asleep. Repositioned slightly. Peaceful." },
      { time: "23:30", childId: "yp_casey", status: "asleep", notes: "Asleep. Window restrictor checked — secure." },
      { time: "00:30", childId: "yp_alex", status: "asleep", notes: "Asleep." },
      { time: "00:30", childId: "yp_casey", status: "asleep", notes: "Asleep. Quiet." },
      { time: "01:00", childId: "yp_casey", status: "asleep", notes: "Asleep." },
      { time: "01:30", childId: "yp_alex", status: "asleep", notes: "Asleep." },
      { time: "01:30", childId: "yp_jordan", status: "asleep", notes: "Asleep." },
      { time: "01:30", childId: "yp_casey", status: "asleep", notes: "Asleep." },
      { time: "02:00", childId: "yp_casey", status: "asleep", notes: "Asleep." },
      { time: "02:15", childId: "yp_casey", status: "awake_unsettled", notes: "Casey woke — appeared distressed (possible nightmare). Staff spoke gently through door. Casey said 'I'm fine.' Staff offered warm drink — declined. Casey asked staff to 'stay near' for a bit." },
      { time: "02:30", childId: "yp_casey", status: "awake_settled", notes: "Casey calmer. Sitting up in bed. Staff checked in — Casey said she was going back to sleep." },
      { time: "02:30", childId: "yp_alex", status: "asleep", notes: "Asleep. Undisturbed." },
      { time: "03:00", childId: "yp_casey", status: "asleep", notes: "Asleep again. Settled." },
      { time: "03:30", childId: "yp_alex", status: "asleep", notes: "Asleep." },
      { time: "03:30", childId: "yp_jordan", status: "asleep", notes: "Asleep." },
      { time: "03:30", childId: "yp_casey", status: "asleep", notes: "Asleep." },
      { time: "04:30", childId: "yp_casey", status: "asleep", notes: "Asleep." },
      { time: "05:30", childId: "yp_alex", status: "asleep", notes: "Asleep." },
      { time: "05:30", childId: "yp_jordan", status: "asleep", notes: "Asleep." },
      { time: "05:30", childId: "yp_casey", status: "asleep", notes: "Asleep." },
      { time: "06:30", childId: "yp_casey", status: "asleep", notes: "Asleep." },
      { time: "07:00", childId: "yp_alex", status: "awake_settled", notes: "Alex waking naturally. Getting ready for school." },
      { time: "07:00", childId: "yp_jordan", status: "asleep", notes: "Still asleep. Jordan's routine allows later wake — school starts at 10:00 (part-time)." },
      { time: "07:00", childId: "yp_casey", status: "asleep", notes: "Still asleep. Not attending college today." },
    ],
    incidents: [],
    medicationGiven: [],
    securityChecks: [
      { time: "22:15", item: "Front door — locked and alarmed", status: "secure" },
      { time: "22:15", item: "Back door — locked", status: "secure" },
      { time: "22:15", item: "All windows ground floor — closed and locked", status: "secure" },
      { time: "22:15", item: "Medication safe — locked", status: "secure" },
      { time: "22:15", item: "Office — locked", status: "secure" },
      { time: "22:15", item: "CCTV — operational (exterior cameras)", status: "secure" },
      { time: "03:00", item: "Front door — locked and alarmed (midpoint check)", status: "secure" },
      { time: "03:00", item: "All windows — checked", status: "secure" },
    ],
    summary: "Quiet night. All children settled by 23:00. Casey woke briefly at 02:15 — likely a nightmare — reassured by staff and settled within 15 minutes. No incidents. Building secure throughout. Alex waking at 07:00 for school.",
    concerns: null,
  },
  {
    id: "nl_002", date: d(-2),
    wakingNightStaff: ["staff_lackson"], sleepInStaff: "staff_ryan",
    shiftStart: "22:00", shiftEnd: "07:30",
    handoverFromDay: "Casey had a difficult evening — upset after social worker visit about LADO. Went to room at 19:30 and didn't come out for dinner. Staff left food outside door. Jordan slightly anxious — new TA at school. Melatonin given to both Jordan and Casey by day staff. Alex settled after homework.",
    handoverToMorning: "Difficult night. Casey was distressed at 23:45 — staff heard crying. Casey eventually accepted warm drink and talked briefly with Lackson. Casey disclosed feeling 'like everyone hates me.' Staff used distress tolerance techniques from toolkit. Casey eventually settled at 01:00. Jordan slept through. Alex slept through. Ryan (sleep-in) was briefed but not woken. Recommend extra support for Casey today.",
    checks: [
      { time: "22:30", childId: "yp_alex", status: "asleep", notes: "Asleep." },
      { time: "22:30", childId: "yp_jordan", status: "asleep", notes: "Asleep. Nightlight on." },
      { time: "22:30", childId: "yp_casey", status: "awake_unsettled", notes: "Light on. Sound of movement. Staff knocked — Casey said 'go away.' Staff acknowledged and said they'd check again soon." },
      { time: "23:00", childId: "yp_casey", status: "awake_unsettled", notes: "Still awake. Music playing. Staff knocked — Casey didn't respond." },
      { time: "23:30", childId: "yp_casey", status: "awake_unsettled", notes: "Light still on. Staff knocked — Casey said 'what?' Staff offered warm drink. Casey said 'fine.'" },
      { time: "23:45", childId: "yp_casey", status: "awake_unsettled", notes: "Staff heard crying. Knocked and asked if Casey was OK. Casey opened door — visibly upset. Staff offered to sit with her in the lounge." },
      { time: "00:15", childId: "yp_casey", status: "awake_settled", notes: "Casey in lounge with warm drink. Talked to Lackson about feeling overwhelmed. Used grounding technique from distress toolkit. Casey calmer." },
      { time: "00:30", childId: "yp_alex", status: "asleep", notes: "Asleep. Undisturbed by Casey's distress (rooms well-separated)." },
      { time: "00:30", childId: "yp_jordan", status: "asleep", notes: "Asleep." },
      { time: "01:00", childId: "yp_casey", status: "awake_settled", notes: "Casey returned to room voluntarily. Said she felt better. Staff offered to leave door ajar — Casey agreed." },
      { time: "01:30", childId: "yp_casey", status: "asleep", notes: "Asleep. Door slightly ajar as agreed." },
      { time: "02:30", childId: "yp_casey", status: "asleep", notes: "Asleep." },
      { time: "03:30", childId: "yp_casey", status: "asleep", notes: "Asleep." },
      { time: "04:30", childId: "yp_casey", status: "asleep", notes: "Asleep." },
      { time: "05:30", childId: "yp_casey", status: "asleep", notes: "Asleep." },
      { time: "06:30", childId: "yp_casey", status: "asleep", notes: "Asleep." },
    ],
    incidents: [
      {
        time: "23:45",
        childId: "yp_casey",
        type: "disturbance",
        description: "Casey heard crying in room. When staff checked, Casey was visibly upset and said she feels like 'everyone hates me' and 'what's the point.' No self-harm observed — staff checked hands and arms with Casey's consent. Casey denied any self-harm urges at this time.",
        actionTaken: "Staff used distress tolerance techniques. Offered warm drink and 1:1 time. Casey came to lounge voluntarily. Grounding exercises used. Casey settled after approximately 1 hour. Sleep-in staff (Ryan) briefed verbally. Documented in daily log. To be raised at morning handover. CAMHS to be informed.",
        escalated: false,
        escalatedTo: null,
      },
    ],
    medicationGiven: [],
    securityChecks: [
      { time: "22:15", item: "Front door — locked and alarmed", status: "secure" },
      { time: "22:15", item: "Back door — locked", status: "secure" },
      { time: "22:15", item: "All windows — checked", status: "secure" },
      { time: "22:15", item: "Medication safe — locked", status: "secure" },
      { time: "22:15", item: "Office — locked", status: "secure" },
      { time: "22:15", item: "CCTV — operational", status: "secure" },
    ],
    summary: "Difficult night for Casey. Distressed at 23:45 — used distress tolerance techniques successfully. No self-harm. Casey settled by 01:00. Alex and Jordan slept through undisturbed. Building secure. Morning staff to be briefed on Casey's emotional state.",
    concerns: "Casey's emotional state is deteriorating — LADO investigation is having a significant impact. CAMHS to be updated. Extra support today — offer 1:1 time without pressure. Monitor self-harm risk closely.",
  },
  {
    id: "nl_003", date: d(-8),
    wakingNightStaff: ["staff_mirela"], sleepInStaff: "staff_edward",
    shiftStart: "22:00", shiftEnd: "07:30",
    handoverFromDay: "Good day for all three. Alex had a good day at school — football practice. Jordan calm after art session. Casey attended direct work with Chervelle — went well. All children in good spirits at bedtime. Standard medications given.",
    handoverToMorning: "Excellent night. All three children slept through with no disturbances. No incidents. Building secure. All checks completed on schedule.",
    checks: [
      { time: "22:30", childId: "yp_alex", status: "asleep", notes: "Asleep. Tired after football — settled quickly." },
      { time: "22:30", childId: "yp_jordan", status: "asleep", notes: "Asleep. Weighted blanket." },
      { time: "22:30", childId: "yp_casey", status: "awake_settled", notes: "Awake. Reading. Calm." },
      { time: "23:00", childId: "yp_casey", status: "asleep", notes: "Asleep. Book on bedside table." },
      { time: "23:30", childId: "yp_alex", status: "asleep", notes: "Asleep." },
      { time: "23:30", childId: "yp_jordan", status: "asleep", notes: "Asleep." },
      { time: "23:30", childId: "yp_casey", status: "asleep", notes: "Asleep." },
      { time: "01:00", childId: "yp_casey", status: "asleep", notes: "Asleep." },
      { time: "02:00", childId: "yp_casey", status: "asleep", notes: "Asleep." },
      { time: "03:00", childId: "yp_casey", status: "asleep", notes: "Asleep." },
      { time: "04:00", childId: "yp_casey", status: "asleep", notes: "Asleep." },
      { time: "05:00", childId: "yp_casey", status: "asleep", notes: "Asleep." },
      { time: "06:00", childId: "yp_casey", status: "asleep", notes: "Asleep." },
      { time: "07:00", childId: "yp_alex", status: "awake_settled", notes: "Waking up. Good morning." },
    ],
    incidents: [],
    medicationGiven: [],
    securityChecks: [
      { time: "22:15", item: "All entry points — locked and alarmed", status: "secure" },
      { time: "22:15", item: "Medication safe — locked", status: "secure" },
      { time: "22:15", item: "CCTV — operational", status: "secure" },
      { time: "03:00", item: "Midpoint building check — all secure", status: "secure" },
    ],
    summary: "Excellent, uneventful night. All children slept well. No concerns. Good start to the morning.",
    concerns: null,
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function NightLogPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "incidents">("date");

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      switch (sortBy) {
        case "incidents": return b.incidents.length - a.incidents.length;
        default: return b.date.localeCompare(a.date);
      }
    });
  }, [data, sortBy]);

  const exportData = useMemo(() => {
    return data.flatMap((entry) =>
      entry.checks.map((chk) => ({
        date: entry.date,
        wakingStaff: entry.wakingNightStaff.map((s) => getStaffName(s)).join(", "),
        checkTime: chk.time,
        child: getYPName(chk.childId),
        status: CHECK_STATUS_META[chk.status]?.label || chk.status,
        notes: chk.notes,
        incidentCount: entry.incidents.length,
      }))
    );
  }, [data]);

  type ExportRow = (typeof exportData)[number];

  const exportCols: ExportColumn<ExportRow>[] = [
    { header: "Date", accessor: (r: ExportRow) => r.date },
    { header: "Waking Night Staff", accessor: (r: ExportRow) => r.wakingStaff },
    { header: "Check Time", accessor: (r: ExportRow) => r.checkTime },
    { header: "Child", accessor: (r: ExportRow) => r.child },
    { header: "Status", accessor: (r: ExportRow) => r.status },
    { header: "Notes", accessor: (r: ExportRow) => r.notes },
    { header: "Incidents", accessor: (r: ExportRow) => String(r.incidentCount) },
  ];

  const totalChecks = data.reduce((s, e) => s + e.checks.length, 0);
  const totalIncidents = data.reduce((s, e) => s + e.incidents.length, 0);
  const nightsWithConcerns = data.filter((e) => e.concerns).length;

  return (
    <PageShell
      title="Night Log"
      subtitle="Waking Night Records · Night Checks · Incidents · Security"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Night Log" />
          <ExportButton data={exportData} columns={exportCols} filename="night-log" />
        </div>
      }
    >
      <div id="print-area">
        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{data.length}</p>
              <p className="text-xs text-muted-foreground">Night Logs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{totalChecks}</p>
              <p className="text-xs text-muted-foreground">Total Checks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className={cn("text-2xl font-bold", totalIncidents > 0 ? "text-amber-600" : "text-green-600")}>{totalIncidents}</p>
              <p className="text-xs text-muted-foreground">Incidents</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className={cn("text-2xl font-bold", nightsWithConcerns > 0 ? "text-red-600" : "text-green-600")}>{nightsWithConcerns}</p>
              <p className="text-xs text-muted-foreground">Nights with Concerns</p>
            </CardContent>
          </Card>
        </div>

        {/* sort */}
        <div className="flex items-center gap-2 mb-4">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="text-sm border rounded px-2 py-1"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="date">Date (newest)</option>
            <option value="incidents">Incidents (most first)</option>
          </select>
        </div>

        {/* night log entries */}
        <div className="space-y-3">
          {sorted.map((entry) => {
            const isOpen = expandedId === entry.id;
            const hasIncidents = entry.incidents.length > 0;
            const hasConcerns = !!entry.concerns;
            return (
              <Card key={entry.id} className={cn(
                "border-l-4",
                hasConcerns ? "border-l-red-500" : hasIncidents ? "border-l-amber-400" : "border-l-green-400"
              )}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : entry.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Moon className="h-4 w-4 text-blue-600" />
                        Night of {entry.date}
                        {hasIncidents && <Badge variant="outline" className="bg-amber-100 text-amber-800">{entry.incidents.length} incident(s)</Badge>}
                        {hasConcerns && <Badge variant="outline" className="bg-red-100 text-red-800">Concerns</Badge>}
                        {!hasIncidents && !hasConcerns && <Badge variant="outline" className="bg-green-100 text-green-800">Uneventful</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {entry.shiftStart}–{entry.shiftEnd} · Waking night: {entry.wakingNightStaff.map((s) => getStaffName(s)).join(", ")}
                        {entry.sleepInStaff && ` · Sleep-in: ${getStaffName(entry.sleepInStaff)}`}
                        · {entry.checks.length} checks
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* handover from day */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1">Handover from Day Shift</p>
                      <p className="text-xs text-blue-700">{entry.handoverFromDay}</p>
                    </div>

                    {/* concerns */}
                    {entry.concerns && (
                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <p className="font-medium text-xs text-red-800 mb-1 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Concerns Raised</p>
                        <p className="text-xs text-red-700">{entry.concerns}</p>
                      </div>
                    )}

                    {/* incidents */}
                    {entry.incidents.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1"><ShieldAlert className="h-4 w-4 text-amber-500" /> Incidents</p>
                        {entry.incidents.map((inc, i) => (
                          <div key={i} className="bg-amber-50 border border-amber-200 rounded p-2 mb-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="bg-amber-100 text-amber-800 text-[10px]">{inc.time}</Badge>
                              {inc.childId && <span className="text-xs font-medium">{getYPName(inc.childId)}</span>}
                              <Badge variant="outline" className="text-[10px]">{inc.type.replace(/_/g, " ")}</Badge>
                            </div>
                            <p className="text-xs mb-1">{inc.description}</p>
                            <p className="text-xs text-muted-foreground"><strong>Action:</strong> {inc.actionTaken}</p>
                            {inc.escalated && <p className="text-xs text-red-700 mt-0.5">Escalated to: {inc.escalatedTo}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* checks timeline per child */}
                    <div>
                      <p className="font-medium mb-2 flex items-center gap-1"><Eye className="h-4 w-4 text-purple-600" /> Night Checks</p>
                      {["yp_alex", "yp_jordan", "yp_casey"].map((ypId) => {
                        const childChecks = entry.checks.filter((c) => c.childId === ypId);
                        if (childChecks.length === 0) return null;
                        return (
                          <div key={ypId} className="mb-2">
                            <p className="text-xs font-medium mb-1">{getYPName(ypId)}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                              {childChecks.map((chk, i) => (
                                <div key={i} className="bg-muted/40 rounded p-1.5 text-[10px]">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="font-medium">{chk.time}</span>
                                    <Badge variant="outline" className={cn("text-[9px] px-1 py-0", CHECK_STATUS_META[chk.status]?.color)}>
                                      {CHECK_STATUS_META[chk.status]?.label}
                                    </Badge>
                                  </div>
                                  <p className="text-muted-foreground">{chk.notes}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* medication */}
                    {entry.medicationGiven.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1"><Pill className="h-4 w-4 text-green-600" /> Medication Given During Night</p>
                        {entry.medicationGiven.map((med, i) => (
                          <div key={i} className="bg-muted/40 rounded p-2 mb-1 text-xs">
                            <span className="font-medium">{med.time}</span> — {getYPName(med.childId)}: {med.medication} ({med.dose}). {med.notes}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* security checks */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-600" /> Security Checks</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {entry.securityChecks.map((sec, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs bg-muted/40 rounded p-1.5">
                            {sec.status === "secure" ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 text-red-600 shrink-0" />
                            )}
                            <span>{sec.time} — {sec.item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* summary */}
                    <div>
                      <p className="font-medium mb-1">Night Summary</p>
                      <p className="text-xs text-muted-foreground">{entry.summary}</p>
                    </div>

                    {/* handover to morning */}
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <p className="font-medium text-xs text-green-800 mb-1">Handover to Morning Shift</p>
                      <p className="text-xs text-green-700">{entry.handoverToMorning}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Night Care Standards</p>
          <p>Waking night staff must complete checks at the frequency set by each child&apos;s risk assessment and care plan. Standard checks are hourly for low-risk children, 45 minutes for medium risk, and 30 minutes for high-risk children. All checks must be recorded with the time, child&apos;s status, and any observations. Night staff must remain awake and alert throughout the waking night shift. Security checks must be completed at the start of the night and at least once during the shift. Any incidents must be documented immediately and escalated where appropriate. The night log forms part of the home&apos;s daily record and is subject to review by the RM, Reg 44 visitor, and Ofsted inspectors.</p>
        </div>
      </div>
    </PageShell>
  );
}
