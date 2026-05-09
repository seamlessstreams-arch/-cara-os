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
  Phone, BedDouble, Eye, FileText, Sparkles, Bell, Loader2,
} from "lucide-react";
import { useNightStaffHandovers } from "@/hooks/use-night-staff-handovers";
import type { NightStaffHandover } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Date helper (relative) ─────────────────────────────────────────────────

const d = (offset: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString().slice(0, 10);
};

// ── Export columns ─────────────────────────────────────────────────────────

const EXPORT_COLS: ExportColumn<NightStaffHandover>[] = [
  { header: "Date", accessor: (r: NightStaffHandover) => r.date },
  { header: "Handover Time", accessor: (r: NightStaffHandover) => r.handover_time },
  { header: "Evening Staff", accessor: (r: NightStaffHandover) => getStaffName(r.evening_staff) },
  { header: "Night Staff", accessor: (r: NightStaffHandover) => getStaffName(r.night_staff) },
  { header: "Morning Staff", accessor: (r: NightStaffHandover) => getStaffName(r.morning_staff) },
  { header: "Wake Time", accessor: (r: NightStaffHandover) => r.morning_wake_time },
  { header: "Children in Home", accessor: (r: NightStaffHandover) => r.children_at_home.map(getYPName).join(", ") },
  { header: "Medication Given", accessor: (r: NightStaffHandover) => (r.medication_given ? "Yes" : "No") },
  { header: "Medication Due Overnight", accessor: (r: NightStaffHandover) => r.medication_due },
  { header: "Risk Briefing", accessor: (r: NightStaffHandover) => r.risk_briefing.join(" | ") },
  { header: "Specific Concerns", accessor: (r: NightStaffHandover) =>
      Object.entries(r.specific_concerns).map(([id, c]) => `${getYPName(id)}: ${c}`).join(" | ") },
  { header: "Night Checks", accessor: (r: NightStaffHandover) =>
      Object.entries(r.night_checks_required).map(([id, f]) => `${getYPName(id)}: ${f}`).join(" | ") },
  { header: "Expected Returns", accessor: (r: NightStaffHandover) => r.expected_returns },
  { header: "Emergency Contacts", accessor: (r: NightStaffHandover) => r.emergency_contacts },
  { header: "Night Events", accessor: (r: NightStaffHandover) => r.night_events.join(" | ") },
  { header: "Morning Handover Complete", accessor: (r: NightStaffHandover) => (r.morning_handover_complete ? "Yes" : "No") },
];

// ── Sort options ───────────────────────────────────────────────────────────

type SortKey = "date_desc" | "date_asc" | "events" | "concerns";

// ── Page ───────────────────────────────────────────────────────────────────

export default function NightStaffHandoverPage() {
  const { data: res, isLoading } = useNightStaffHandovers();
  const records: NightStaffHandover[] = res?.data ?? [];

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
          getStaffName(r.evening_staff),
          getStaffName(r.night_staff),
          getStaffName(r.morning_staff),
          r.children_at_home.map(getYPName).join(" "),
          r.children_awake,
          r.medication_due,
          r.risk_briefing.join(" "),
          Object.entries(r.specific_concerns).map(([id, c]) => `${getYPName(id)} ${c}`).join(" "),
          r.expected_returns,
          r.emergency_contacts,
          r.night_events.join(" "),
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
    if (staffFilter !== "all") {
      list = list.filter(
        (r) => r.night_staff === staffFilter || r.evening_staff === staffFilter || r.morning_staff === staffFilter,
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "date_asc":  return a.date.localeCompare(b.date);
        case "events":    return b.night_events.length - a.night_events.length;
        case "concerns":  return Object.keys(b.specific_concerns).length - Object.keys(a.specific_concerns).length;
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
      (n, r) => n + Object.keys(r.specific_concerns).length, 0,
    );
    const avgChildren = records.length > 0
      ? (records.reduce((a, r) => a + r.children_at_home.length, 0) / records.length).toFixed(1)
      : "0";
    const eventNights = records.filter((r) => r.night_events.length > 0).length;
    return { thisWeek, activeConcerns, avgChildren, eventNights };
  }, [records]);

  // Alerts: tonight's concerns + outstanding morning handovers
  const tonightId = useMemo(() => {
    const today = d(0);
    return records.find((r) => r.date === today)?.id ?? null;
  }, [records]);

  const incompleteMorning = useMemo(
    () => records.filter((r) => !r.morning_handover_complete && r.date < d(0)),
    [records],
  );

  const allStaffIds = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      set.add(r.evening_staff);
      set.add(r.night_staff);
      set.add(r.morning_staff);
    });
    return Array.from(set);
  }, [records]);

  if (isLoading) return <PageShell title="Night Staff Handover" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

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
            const hasEvents = r.night_events.length > 0;
            const concernCount = Object.keys(r.specific_concerns).length;
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
                            {r.night_events.length} event{r.night_events.length === 1 ? "" : "s"}
                          </Badge>
                        )}
                        {concernCount > 0 && (
                          <Badge className="bg-amber-100 text-amber-800 text-xs">
                            <ShieldAlert className="h-3 w-3 mr-1" />
                            {concernCount} concern{concernCount === 1 ? "" : "s"}
                          </Badge>
                        )}
                        {!r.morning_handover_complete ? (
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
                        {getStaffName(r.evening_staff)} <span className="text-muted-foreground font-normal">→</span>{" "}
                        {getStaffName(r.night_staff)} <span className="text-muted-foreground font-normal">→</span>{" "}
                        {getStaffName(r.morning_staff)}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Handover {r.handover_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Sun className="h-3 w-3" /> Wake {r.morning_wake_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {r.children_at_home.length} in home
                        </span>
                        <span className="flex items-center gap-1">
                          <Pill className="h-3 w-3" />
                          {r.medication_given ? "Evening meds done" : "Evening meds outstanding"}
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
                      {r.risk_briefing.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1 flex items-center gap-1">
                            <ShieldAlert className="h-3.5 w-3.5" /> Risk Briefing
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-rose-900 bg-rose-50 border border-rose-100 rounded-lg p-3">
                            {r.risk_briefing.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Children at home — sleeping / concerns / checks */}
                      <div>
                        <p className="font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <BedDouble className="h-3.5 w-3.5" /> Children in Home Tonight
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {r.children_at_home.map((id) => {
                            const bedtime = r.children_sleeping[id];
                            const concern = r.specific_concerns[id];
                            const checkFreq = r.night_checks_required[id];
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
                          <p>{r.children_awake || "—"}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <Pill className="h-3 w-3" /> Medication Due Overnight
                          </p>
                          <p>{r.medication_due || "None"}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <Clock className="h-3 w-3" /> Expected Returns
                          </p>
                          <p>{r.expected_returns || "None"}</p>
                        </div>
                      </div>

                      {/* Emergency contacts */}
                      <div className="rounded-lg border bg-slate-50 p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                          <Phone className="h-3 w-3" /> Emergency Contacts
                        </p>
                        <p className="font-mono text-xs">{r.emergency_contacts}</p>
                      </div>

                      {/* Night events */}
                      <div>
                        <p className="font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <Bell className="h-3.5 w-3.5" /> Night Events
                        </p>
                        {r.night_events.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">
                            {isToday ? "No events recorded yet." : "Quiet night — no events."}
                          </p>
                        ) : (
                          <ul className="list-disc list-inside space-y-1">
                            {r.night_events.map((e, i) => <li key={i}>{e}</li>)}
                          </ul>
                        )}
                      </div>

                      {/* Footer summary */}
                      <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t">
                        <span>
                          Handover at {r.handover_time} from {getStaffName(r.evening_staff)} to {getStaffName(r.night_staff)}.
                          Wake {r.morning_wake_time} — handover to {getStaffName(r.morning_staff)}.
                        </span>
                        {r.morning_handover_complete ? (
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
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
