"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Moon, Sun, Search, ArrowUpDown, ChevronUp, ChevronDown, Plus,
  AlertTriangle, CheckCircle2, Clock, Users, Pill, ShieldAlert,
  Phone, BedDouble, Eye, FileText, Sparkles, Bell,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface NightHandover {
  id: string;
  date: string;                                   // YYYY-MM-DD (the night that started)
  eveningStaff: string;                           // staff ID (handing over to night)
  nightStaff: string;                             // staff ID (sleep-in / waking night)
  handoverTime: string;                           // HH:mm (evening → night)
  childrenAtHome: string[];                       // yp IDs present overnight
  childrenSleeping: Record<string, string>;       // yp ID → bedtime HH:mm
  childrenAwake: string;                          // free-text: who was awake / why
  medicationGiven: boolean;                       // evening meds administered before handover
  medicationDue: string;                          // any meds due during the night
  riskBriefing: string[];                         // top risk items the night staff need to know
  specificConcerns: Record<string, string>;       // yp ID → concern text
  nightChecksRequired: Record<string, string>;    // yp ID → frequency, e.g. "Every 30 mins"
  expectedReturns: string;                        // anyone expected back during the night
  emergencyContacts: string;                      // on-call manager, OOH, etc.
  morningWakeTime: string;                        // HH:mm
  morningStaff: string;                           // staff ID receiving handover at wake
  nightEvents: string[];                          // what actually happened overnight
  morningHandoverComplete: boolean;
}

// ── Date helper (relative) ─────────────────────────────────────────────────

const d = (offset: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString().slice(0, 10);
};

// ── Seed records ───────────────────────────────────────────────────────────

const SEED: NightHandover[] = [
  {
    id: "nh_001",
    date: d(-1),
    eveningStaff: "staff_anna",
    nightStaff: "staff_ryan",
    handoverTime: "22:15",
    childrenAtHome: ["yp_alex", "yp_jordan", "yp_casey"],
    childrenSleeping: { yp_alex: "22:00", yp_jordan: "22:30", yp_casey: "21:45" },
    childrenAwake: "All settled by 22:45.",
    medicationGiven: true,
    medicationDue: "None overnight.",
    riskBriefing: [
      "Jordan presented as low after family contact call — monitor for nightmares.",
      "Casey using new sensory weighted blanket, check breathing if visibly restless.",
    ],
    specificConcerns: {
      yp_jordan: "Low mood post-contact. Wants door slightly open. Reassure if wakes.",
    },
    nightChecksRequired: {
      yp_alex: "Every 60 mins",
      yp_jordan: "Every 30 mins",
      yp_casey: "Every 60 mins",
    },
    expectedReturns: "None.",
    emergencyContacts: "On-call: Darren (RM) 07700 900111. OOH EDT: 0300 999 1234.",
    morningWakeTime: "07:00",
    morningStaff: "staff_chervelle",
    nightEvents: [
      "Jordan woke at 02:10 distressed — used grounding script, settled by 02:35.",
      "Routine 30-min checks all in order.",
    ],
    morningHandoverComplete: true,
  },
  {
    id: "nh_002",
    date: d(-2),
    eveningStaff: "staff_chervelle",
    nightStaff: "staff_edward",
    handoverTime: "22:00",
    childrenAtHome: ["yp_alex", "yp_jordan", "yp_casey"],
    childrenSleeping: { yp_alex: "22:15", yp_jordan: "22:00", yp_casey: "21:30" },
    childrenAwake: "Alex reading until 22:30 — agreed and recorded.",
    medicationGiven: true,
    medicationDue: "Casey: PRN inhaler available if required.",
    riskBriefing: [
      "Casey mild cold — observe breathing during checks.",
    ],
    specificConcerns: {
      yp_casey: "Cold symptoms. Inhaler in locked cupboard, key on board.",
    },
    nightChecksRequired: {
      yp_alex: "Every 60 mins",
      yp_jordan: "Every 60 mins",
      yp_casey: "Every 30 mins",
    },
    expectedReturns: "None.",
    emergencyContacts: "On-call: Darren (RM) 07700 900111.",
    morningWakeTime: "07:00",
    morningStaff: "staff_anna",
    nightEvents: [
      "Quiet night. All checks completed and logged.",
    ],
    morningHandoverComplete: true,
  },
  {
    id: "nh_003",
    date: d(-3),
    eveningStaff: "staff_anna",
    nightStaff: "staff_lackson",
    handoverTime: "22:30",
    childrenAtHome: ["yp_alex", "yp_jordan"],
    childrenSleeping: { yp_alex: "22:00", yp_jordan: "22:45" },
    childrenAwake: "Jordan settled at 22:45 after late phone call from sister.",
    medicationGiven: true,
    medicationDue: "None overnight.",
    riskBriefing: [
      "Casey at planned family overnight contact — not in home.",
      "Front door alarm reactivated at 22:30.",
    ],
    specificConcerns: {},
    nightChecksRequired: {
      yp_alex: "Every 60 mins",
      yp_jordan: "Every 60 mins",
    },
    expectedReturns: "Casey returning approx 10:00 tomorrow (not overnight).",
    emergencyContacts: "On-call: Darren (RM) 07700 900111.",
    morningWakeTime: "07:00",
    morningStaff: "staff_mirela",
    nightEvents: [
      "Uneventful night.",
    ],
    morningHandoverComplete: true,
  },
  {
    id: "nh_004",
    date: d(-4),
    eveningStaff: "staff_mirela",
    nightStaff: "staff_ryan",
    handoverTime: "22:00",
    childrenAtHome: ["yp_alex", "yp_jordan", "yp_casey"],
    childrenSleeping: { yp_alex: "22:30", yp_jordan: "22:00", yp_casey: "21:45" },
    childrenAwake: "All settled.",
    medicationGiven: true,
    medicationDue: "None overnight.",
    riskBriefing: [
      "Alex finished college exam — may want early breakfast.",
    ],
    specificConcerns: {},
    nightChecksRequired: {
      yp_alex: "Every 60 mins",
      yp_jordan: "Every 60 mins",
      yp_casey: "Every 60 mins",
    },
    expectedReturns: "None.",
    emergencyContacts: "On-call: Darren (RM) 07700 900111.",
    morningWakeTime: "06:30",
    morningStaff: "staff_chervelle",
    nightEvents: [
      "Smoke alarm test at 23:00 — all units functional.",
      "All checks completed.",
    ],
    morningHandoverComplete: true,
  },
  {
    id: "nh_005",
    date: d(-5),
    eveningStaff: "staff_edward",
    nightStaff: "staff_lackson",
    handoverTime: "22:00",
    childrenAtHome: ["yp_alex", "yp_jordan", "yp_casey"],
    childrenSleeping: { yp_alex: "22:00", yp_jordan: "22:30", yp_casey: "21:30" },
    childrenAwake: "Casey took 20 mins to settle — used calming routine.",
    medicationGiven: true,
    medicationDue: "Jordan: morning dose 07:30 — leave blister pack on counter.",
    riskBriefing: [
      "Heightened safeguarding awareness — stranger reported in lane earlier.",
      "Police aware. Front gate locked.",
    ],
    specificConcerns: {
      yp_casey: "Anxious about news. Reassure if wakes. Door open inch.",
      yp_jordan: "Asked about door alarm — confirmed it is set.",
    },
    nightChecksRequired: {
      yp_alex: "Every 30 mins",
      yp_jordan: "Every 30 mins",
      yp_casey: "Every 30 mins",
    },
    expectedReturns: "None.",
    emergencyContacts: "On-call: Darren (RM) 07700 900111. Police 101 (ref 24/0987).",
    morningWakeTime: "07:00",
    morningStaff: "staff_anna",
    nightEvents: [
      "External light tripped at 01:20 — fox on driveway, confirmed via CCTV.",
      "Casey woke at 03:00 anxious — reassured, settled by 03:20.",
      "All 30-min checks completed and signed.",
    ],
    morningHandoverComplete: true,
  },
  {
    id: "nh_006",
    date: d(-6),
    eveningStaff: "staff_chervelle",
    nightStaff: "staff_edward",
    handoverTime: "22:15",
    childrenAtHome: ["yp_jordan", "yp_casey"],
    childrenSleeping: { yp_jordan: "22:15", yp_casey: "21:45" },
    childrenAwake: "Both settled.",
    medicationGiven: true,
    medicationDue: "None overnight.",
    riskBriefing: [
      "Alex on planned overnight respite at maternal aunt's — not in home.",
    ],
    specificConcerns: {},
    nightChecksRequired: {
      yp_jordan: "Every 60 mins",
      yp_casey: "Every 60 mins",
    },
    expectedReturns: "Alex returning approx 17:00 tomorrow (not overnight).",
    emergencyContacts: "On-call: Darren (RM) 07700 900111.",
    morningWakeTime: "07:30",
    morningStaff: "staff_mirela",
    nightEvents: [
      "Quiet night, no disturbances.",
    ],
    morningHandoverComplete: true,
  },
  {
    id: "nh_007",
    date: d(0),
    eveningStaff: "staff_anna",
    nightStaff: "staff_ryan",
    handoverTime: "22:00",
    childrenAtHome: ["yp_alex", "yp_jordan", "yp_casey"],
    childrenSleeping: { yp_alex: "22:00", yp_jordan: "22:30", yp_casey: "21:45" },
    childrenAwake: "All settled by 22:45.",
    medicationGiven: true,
    medicationDue: "Alex: PRN paracetamol available (headache earlier).",
    riskBriefing: [
      "Casey LAC review tomorrow — may be anxious.",
      "Jordan recently raised concerns about a peer at school — listening ear if wakes.",
    ],
    specificConcerns: {
      yp_jordan: "May want to talk if wakes. Use active listening — do NOT problem-solve at night.",
      yp_casey: "Wants night light on. Confirm review time at breakfast.",
    },
    nightChecksRequired: {
      yp_alex: "Every 60 mins",
      yp_jordan: "Every 30 mins",
      yp_casey: "Every 30 mins",
    },
    expectedReturns: "None.",
    emergencyContacts: "On-call: Darren (RM) 07700 900111. OOH EDT: 0300 999 1234.",
    morningWakeTime: "07:00",
    morningStaff: "staff_chervelle",
    nightEvents: [],
    morningHandoverComplete: false,
  },
];

// ── Export columns ─────────────────────────────────────────────────────────

const EXPORT_COLS: ExportColumn<NightHandover>[] = [
  { header: "Date", accessor: (r: NightHandover) => r.date },
  { header: "Handover Time", accessor: (r: NightHandover) => r.handoverTime },
  { header: "Evening Staff", accessor: (r: NightHandover) => getStaffName(r.eveningStaff) },
  { header: "Night Staff", accessor: (r: NightHandover) => getStaffName(r.nightStaff) },
  { header: "Morning Staff", accessor: (r: NightHandover) => getStaffName(r.morningStaff) },
  { header: "Wake Time", accessor: (r: NightHandover) => r.morningWakeTime },
  { header: "Children in Home", accessor: (r: NightHandover) => r.childrenAtHome.map(getYPName).join(", ") },
  { header: "Medication Given", accessor: (r: NightHandover) => (r.medicationGiven ? "Yes" : "No") },
  { header: "Medication Due Overnight", accessor: (r: NightHandover) => r.medicationDue },
  { header: "Risk Briefing", accessor: (r: NightHandover) => r.riskBriefing.join(" | ") },
  { header: "Specific Concerns", accessor: (r: NightHandover) =>
      Object.entries(r.specificConcerns).map(([id, c]) => `${getYPName(id)}: ${c}`).join(" | ") },
  { header: "Night Checks", accessor: (r: NightHandover) =>
      Object.entries(r.nightChecksRequired).map(([id, f]) => `${getYPName(id)}: ${f}`).join(" | ") },
  { header: "Expected Returns", accessor: (r: NightHandover) => r.expectedReturns },
  { header: "Emergency Contacts", accessor: (r: NightHandover) => r.emergencyContacts },
  { header: "Night Events", accessor: (r: NightHandover) => r.nightEvents.join(" | ") },
  { header: "Morning Handover Complete", accessor: (r: NightHandover) => (r.morningHandoverComplete ? "Yes" : "No") },
];

// ── Sort options ───────────────────────────────────────────────────────────

type SortKey = "date_desc" | "date_asc" | "events" | "concerns";

// ── Page ───────────────────────────────────────────────────────────────────

export default function NightStaffHandoverPage() {
  const [records] = useState<NightHandover[]>(SEED);
  const [search, setSearch] = useState("");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("date_desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...records];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const hay = [
          r.date,
          getStaffName(r.eveningStaff),
          getStaffName(r.nightStaff),
          getStaffName(r.morningStaff),
          r.childrenAtHome.map(getYPName).join(" "),
          r.childrenAwake,
          r.medicationDue,
          r.riskBriefing.join(" "),
          Object.entries(r.specificConcerns).map(([id, c]) => `${getYPName(id)} ${c}`).join(" "),
          r.expectedReturns,
          r.emergencyContacts,
          r.nightEvents.join(" "),
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
    if (staffFilter !== "all") {
      list = list.filter(
        (r) => r.nightStaff === staffFilter || r.eveningStaff === staffFilter || r.morningStaff === staffFilter,
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "date_asc":  return a.date.localeCompare(b.date);
        case "events":    return b.nightEvents.length - a.nightEvents.length;
        case "concerns":  return Object.keys(b.specificConcerns).length - Object.keys(a.specificConcerns).length;
        case "date_desc":
        default:          return b.date.localeCompare(a.date);
      }
    });
    return list;
  }, [records, search, staffFilter, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const weekAgo = d(-7);
    const thisWeek = records.filter((r) => r.date >= weekAgo).length;
    const activeConcerns = records.reduce(
      (n, r) => n + Object.keys(r.specificConcerns).length, 0,
    );
    const avgChildren = records.length > 0
      ? (records.reduce((a, r) => a + r.childrenAtHome.length, 0) / records.length).toFixed(1)
      : "0";
    const eventNights = records.filter((r) => r.nightEvents.length > 0).length;
    return { thisWeek, activeConcerns, avgChildren, eventNights };
  }, [records]);

  // Alerts: tonight's concerns + outstanding morning handovers
  const tonightId = useMemo(() => {
    const today = d(0);
    return records.find((r) => r.date === today)?.id ?? null;
  }, [records]);

  const incompleteMorning = useMemo(
    () => records.filter((r) => !r.morningHandoverComplete && r.date < d(0)),
    [records],
  );

  const allStaffIds = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      set.add(r.eveningStaff);
      set.add(r.nightStaff);
      set.add(r.morningStaff);
    });
    return Array.from(set);
  }, [records]);

  return (
    <PageShell
      title="Night Staff Handover"
      subtitle="Sleep-in / waking night handover records — distinct from main shift handover"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Night Staff Handover" />
          <ExportButton
            data={filtered}
            columns={EXPORT_COLS}
            filename="night-staff-handover"
          />
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" /> New Night Handover
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Handovers This Week", value: stats.thisWeek,        icon: <Moon className="h-4 w-4" />,           color: "text-indigo-600" },
            { label: "Active Concerns",     value: stats.activeConcerns,  icon: <ShieldAlert className="h-4 w-4" />,    color: "text-amber-600" },
            { label: "Avg Children in Home",value: stats.avgChildren,     icon: <Users className="h-4 w-4" />,          color: "text-blue-600" },
            { label: "Night Events",        value: stats.eventNights,     icon: <Bell className="h-4 w-4" />,           color: "text-rose-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", s.color)}>{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Alerts ────────────────────────────────────────────────────── */}
        {(tonightId || incompleteMorning.length > 0) && (
          <div className="space-y-2">
            {tonightId && (
              <Card className="border-l-4 border-l-indigo-500 bg-indigo-50/40">
                <CardContent className="p-3 flex items-start gap-2 text-sm">
                  <Sparkles className="h-4 w-4 mt-0.5 text-indigo-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-indigo-900">Tonight&apos;s handover is logged.</p>
                    <p className="text-xs text-indigo-700/80">
                      Expand the record below to review concerns, check frequencies and emergency contacts before lights out.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {incompleteMorning.length > 0 && (
              <Card className="border-l-4 border-l-amber-500 bg-amber-50/40">
                <CardContent className="p-3 flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-900">
                      {incompleteMorning.length} morning handover{incompleteMorning.length === 1 ? "" : "s"} not yet signed off.
                    </p>
                    <p className="text-xs text-amber-700/80">
                      Night staff must complete the morning handover before going off shift — required by Quality Standard 13.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Filters ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by staff, child, concern, event…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={staffFilter} onValueChange={setStaffFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All staff</SelectItem>
              {allStaffIds.map((id) => (
                <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Newest first</SelectItem>
                <SelectItem value="date_asc">Oldest first</SelectItem>
                <SelectItem value="events">Most events</SelectItem>
                <SelectItem value="concerns">Most concerns</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── List ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No night handover records match your filters.
            </p>
          )}

          {filtered.map((r) => {
            const open = expandedId === r.id;
            const hasEvents = r.nightEvents.length > 0;
            const concernCount = Object.keys(r.specificConcerns).length;
            const isToday = r.date === d(0);

            return (
              <Card
                key={r.id}
                className={cn(
                  "border-l-4 transition-shadow",
                  hasEvents
                    ? "border-l-rose-400"
                    : concernCount > 0
                      ? "border-l-amber-400"
                      : "border-l-indigo-300",
                )}
              >
                <CardContent className="p-4">
                  <div
                    className="flex items-start justify-between cursor-pointer gap-3"
                    onClick={() => setExpandedId(open ? null : r.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className="bg-indigo-100 text-indigo-800 text-xs">
                          <Moon className="h-3 w-3 mr-1" />
                          Night {r.date}
                        </Badge>
                        {isToday && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">Tonight</Badge>
                        )}
                        {hasEvents && (
                          <Badge className="bg-rose-100 text-rose-800 text-xs">
                            <Bell className="h-3 w-3 mr-1" />
                            {r.nightEvents.length} event{r.nightEvents.length === 1 ? "" : "s"}
                          </Badge>
                        )}
                        {concernCount > 0 && (
                          <Badge className="bg-amber-100 text-amber-800 text-xs">
                            <ShieldAlert className="h-3 w-3 mr-1" />
                            {concernCount} concern{concernCount === 1 ? "" : "s"}
                          </Badge>
                        )}
                        {!r.morningHandoverComplete ? (
                          <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
                            Morning handover pending
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-300">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                      </div>
                      <p className="font-semibold">
                        {getStaffName(r.eveningStaff)} <span className="text-muted-foreground font-normal">→</span>{" "}
                        {getStaffName(r.nightStaff)} <span className="text-muted-foreground font-normal">→</span>{" "}
                        {getStaffName(r.morningStaff)}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Handover {r.handoverTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Sun className="h-3 w-3" /> Wake {r.morningWakeTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {r.childrenAtHome.length} in home
                        </span>
                        <span className="flex items-center gap-1">
                          <Pill className="h-3 w-3" />
                          {r.medicationGiven ? "Evening meds done" : "Evening meds outstanding"}
                        </span>
                      </div>
                    </div>
                    {open
                      ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                      : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                    }
                  </div>

                  {open && (
                    <div className="mt-4 space-y-4 border-t pt-4 text-sm">
                      {/* Risk briefing */}
                      {r.riskBriefing.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1 flex items-center gap-1">
                            <ShieldAlert className="h-3.5 w-3.5" /> Risk Briefing
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-rose-900 bg-rose-50 border border-rose-100 rounded-lg p-3">
                            {r.riskBriefing.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Children at home — sleeping / concerns / checks */}
                      <div>
                        <p className="font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <BedDouble className="h-3.5 w-3.5" /> Children in Home Tonight
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {r.childrenAtHome.map((id) => {
                            const bedtime = r.childrenSleeping[id];
                            const concern = r.specificConcerns[id];
                            const checkFreq = r.nightChecksRequired[id];
                            return (
                              <div key={id} className="rounded-lg border bg-slate-50 p-3 space-y-1">
                                <p className="font-semibold text-slate-900">{getYPName(id)}</p>
                                <p className="text-xs text-slate-600 flex items-center gap-1">
                                  <BedDouble className="h-3 w-3" /> Bedtime: {bedtime ?? "—"}
                                </p>
                                {checkFreq && (
                                  <p className="text-xs text-slate-700 flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    <span className="font-medium">Checks:</span> {checkFreq}
                                  </p>
                                )}
                                {concern && (
                                  <div className="mt-1 text-xs bg-amber-50 border border-amber-200 rounded p-2 text-amber-900">
                                    <span className="font-medium flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" /> Concern
                                    </span>
                                    <span>{concern}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Awake / medication / returns */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <Eye className="h-3 w-3" /> Children Awake
                          </p>
                          <p>{r.childrenAwake || "—"}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <Pill className="h-3 w-3" /> Medication Due Overnight
                          </p>
                          <p>{r.medicationDue || "None"}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <Clock className="h-3 w-3" /> Expected Returns
                          </p>
                          <p>{r.expectedReturns || "None"}</p>
                        </div>
                      </div>

                      {/* Emergency contacts */}
                      <div className="rounded-lg border bg-slate-50 p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                          <Phone className="h-3 w-3" /> Emergency Contacts
                        </p>
                        <p className="font-mono text-xs">{r.emergencyContacts}</p>
                      </div>

                      {/* Night events */}
                      <div>
                        <p className="font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <Bell className="h-3.5 w-3.5" /> Night Events
                        </p>
                        {r.nightEvents.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">
                            {isToday ? "No events recorded yet." : "Quiet night — no events."}
                          </p>
                        ) : (
                          <ul className="list-disc list-inside space-y-1">
                            {r.nightEvents.map((e, i) => <li key={i}>{e}</li>)}
                          </ul>
                        )}
                      </div>

                      {/* Footer summary */}
                      <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t">
                        <span>
                          Handover at {r.handoverTime} from {getStaffName(r.eveningStaff)} to {getStaffName(r.nightStaff)}.
                          Wake {r.morningWakeTime} — handover to {getStaffName(r.morningStaff)}.
                        </span>
                        {r.morningHandoverComplete ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Morning handover signed off
                          </span>
                        ) : (
                          <span className="text-amber-700 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Morning handover outstanding
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Regulatory note ───────────────────────────────────────────── */}
        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Night handover is a discrete record from the main shift handover. It captures
              risk, sleep status, check frequency and overnight events for sleep-in or
              waking-night staff, and is a key safeguarding control under Quality Standard 5
              (protection of children) and Quality Standard 13 (leadership and management).
              The morning handover must be signed off before the night staff member leaves shift.
            </span>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
