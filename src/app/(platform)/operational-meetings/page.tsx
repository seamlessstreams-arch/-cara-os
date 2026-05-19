"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useOperationalMeetings } from "@/hooks/use-operational-meetings";
import type { OperationalMeeting, OperationalMeetingType, OperationalActionStatus } from "@/types/extended";
import { OPERATIONAL_MEETING_TYPE_LABEL, OPERATIONAL_ACTION_STATUS_LABEL } from "@/types/extended";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Search,
  Users, Clock, CheckCircle2, AlertTriangle,
  Calendar, Heart, Smile, ShieldAlert, ClipboardList,
  Megaphone, Sparkles, MessageSquare, Loader2,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

// ── Meta maps ───────────────────────────────────────────────────────────────

const TYPE_META: Record<OperationalMeetingType, { color: string; border: string; icon: React.ReactNode }> = {
  morning_huddle:          { color: "bg-blue-100 text-blue-800",       border: "border-l-blue-400",    icon: <Megaphone className="h-3.5 w-3.5" /> },
  shift_change_handover:   { color: "bg-cyan-100 text-cyan-800",       border: "border-l-cyan-400",    icon: <Users className="h-3.5 w-3.5" /> },
  end_of_day_debrief:      { color: "bg-indigo-100 text-indigo-800",   border: "border-l-indigo-400",  icon: <ClipboardList className="h-3.5 w-3.5" /> },
  weekly_team_meeting:     { color: "bg-purple-100 text-purple-800",   border: "border-l-purple-400",  icon: <Users className="h-3.5 w-3.5" /> },
  crisis_briefing:         { color: "bg-red-100 text-red-800",         border: "border-l-red-400",     icon: <ShieldAlert className="h-3.5 w-3.5" /> },
  rm_121_deputy:           { color: "bg-emerald-100 text-emerald-800", border: "border-l-emerald-400", icon: <MessageSquare className="h-3.5 w-3.5" /> },
};

const STATUS_META: Record<OperationalActionStatus, { label: string; color: string }> = {
  open:        { label: "Open",        color: "text-amber-600" },
  in_progress: { label: "In progress", color: "text-blue-600" },
  complete:    { label: "Complete",    color: "text-green-600" },
};

// ── Export columns ───────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<OperationalMeeting>[] = [
  { header: "ID",                accessor: (r: OperationalMeeting) => r.id },
  { header: "Date",              accessor: (r: OperationalMeeting) => r.date },
  { header: "Time",              accessor: (r: OperationalMeeting) => r.time },
  { header: "Type",              accessor: (r: OperationalMeeting) => OPERATIONAL_MEETING_TYPE_LABEL[r.meeting_type] },
  { header: "Duration (mins)",   accessor: (r: OperationalMeeting) => r.duration_minutes },
  { header: "Chair",             accessor: (r: OperationalMeeting) => getStaffName(r.chair) },
  { header: "Attendees",         accessor: (r: OperationalMeeting) => r.attendees.map(getStaffName).join(", ") },
  { header: "Agenda",            accessor: (r: OperationalMeeting) => r.agenda.join("; ") },
  { header: "Key Decisions",     accessor: (r: OperationalMeeting) => r.key_decisions.join("; ") },
  { header: "Child Updates",     accessor: (r: OperationalMeeting) => Object.entries(r.child_updates).map(([id, u]) => `${getYPName(id)}: ${u}`).join(" | ") },
  { header: "Risks",             accessor: (r: OperationalMeeting) => r.risks_identified.join("; ") },
  { header: "Wellbeing",         accessor: (r: OperationalMeeting) => r.staff_wellbeing_observations },
  { header: "Actions Agreed",    accessor: (r: OperationalMeeting) => r.actions_agreed.map((a) => `${a.action} (${getStaffName(a.owner)}, due ${a.deadline}, ${STATUS_META[a.status].label})`).join("; ") },
  { header: "Positive Moments",  accessor: (r: OperationalMeeting) => r.positive_moments_shared.join("; ") },
  { header: "Next Meeting",      accessor: (r: OperationalMeeting) => r.next_meeting },
  { header: "Minuted By",        accessor: (r: OperationalMeeting) => getStaffName(r.minuted_by) },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function OperationalMeetingsPage() {
  const { data: res, isLoading } = useOperationalMeetings();
  const meetings: OperationalMeeting[] = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  const filtered = useMemo(() => {
    let list = [...meetings];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((m) =>
        OPERATIONAL_MEETING_TYPE_LABEL[m.meeting_type].toLowerCase().includes(s) ||
        m.agenda.some((a) => a.toLowerCase().includes(s)) ||
        m.key_decisions.some((k) => k.toLowerCase().includes(s)) ||
        Object.values(m.child_updates).some((u) => u.toLowerCase().includes(s)) ||
        m.staff_wellbeing_observations.toLowerCase().includes(s)
      );
    }
    if (typeFilter !== "all") list = list.filter((m) => m.meeting_type === typeFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date_desc":     return (b.date + b.time).localeCompare(a.date + a.time);
        case "date_asc":      return (a.date + a.time).localeCompare(b.date + b.time);
        case "duration_desc": return b.duration_minutes - a.duration_minutes;
        case "type":          return a.meeting_type.localeCompare(b.meeting_type);
        default:              return 0;
      }
    });
    return list;
  }, [meetings, search, typeFilter, sortBy]);

  const stats = useMemo(() => {
    const dt = new Date();
    dt.setDate(dt.getDate() - 6);
    const sevenDaysAgo = dt.toISOString().slice(0, 10);
    const thisWeek = meetings.filter((m) => m.date >= sevenDaysAgo);
    const avgDuration = meetings.length
      ? Math.round(meetings.reduce((sum, m) => sum + m.duration_minutes, 0) / meetings.length)
      : 0;
    const openActions = meetings.flatMap((m) => m.actions_agreed).filter((a) => a.status !== "complete").length;
    const wellbeingChecks = meetings.filter((m) => m.staff_wellbeing_observations.trim().length > 0).length;
    return {
      thisWeek: thisWeek.length,
      avgDuration,
      openActions,
      wellbeingChecks,
    };
  }, [meetings]);

  if (isLoading) {
    return (
      <PageShell
        title="Operational Meetings"
        subtitle="Daily huddles, handovers, debriefs, and weekly team meetings (QS 13)"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Operational Meetings"
      subtitle="Daily huddles, handovers, debriefs, and weekly team meetings (QS 13)"
      ariaContext={{ pageTitle: "Operational Meetings", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Operational Meetings" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="operational-meetings" />
          <AriaStudioQuickActionButton context={{ record_type: "team_meeting", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Meetings this week", value: stats.thisWeek,        icon: <Calendar className="h-4 w-4" />,        color: "text-blue-600" },
            { label: "Avg duration",       value: `${stats.avgDuration} mins`, icon: <Clock className="h-4 w-4" />,     color: "text-indigo-600" },
            { label: "Open actions",       value: stats.openActions,     icon: <AlertTriangle className="h-4 w-4" />,   color: "text-amber-600" },
            { label: "Wellbeing checks",   value: stats.wellbeingChecks, icon: <Heart className="h-4 w-4" />,           color: "text-rose-600" },
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

        {/* Filters / sort */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search meetings, agenda, decisions, updates…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {(Object.keys(TYPE_META) as OperationalMeetingType[]).map((t) => (
                <SelectItem key={t} value={t}>{OPERATIONAL_MEETING_TYPE_LABEL[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Newest first</SelectItem>
                <SelectItem value="date_asc">Oldest first</SelectItem>
                <SelectItem value="duration_desc">Longest first</SelectItem>
                <SelectItem value="type">By type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Meeting cards */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No meetings match your filters.</p>
          )}
          {filtered.map((m) => {
            const open = expandedId === m.id;
            const meta = TYPE_META[m.meeting_type];
            const openCount = m.actions_agreed.filter((a) => a.status !== "complete").length;

            return (
              <Card key={m.id} className={cn("border-l-4", meta.border)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(m.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs flex items-center gap-1", meta.color)}>
                          {meta.icon}{OPERATIONAL_MEETING_TYPE_LABEL[m.meeting_type]}
                        </Badge>
                        {openCount > 0 && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                            {openCount} open action{openCount === 1 ? "" : "s"}
                          </Badge>
                        )}
                      </div>
                      <p className="font-semibold">
                        {m.date} · {m.time} · {m.duration_minutes} mins
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span>Chair: {getStaffName(m.chair)}</span>
                        <span>{m.attendees.length} attended</span>
                        <span>Minuted by: {getStaffName(m.minuted_by)}</span>
                      </div>
                    </div>
                    {open
                      ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />
                    }
                  </div>

                  {open && (
                    <div className="mt-4 space-y-4 border-t pt-3 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Attendees</p>
                        <div className="flex flex-wrap gap-1">
                          {m.attendees.map((a) => (
                            <Badge key={a} variant="secondary" className="text-xs">{getStaffName(a)}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Agenda</p>
                        <ul className="list-disc pl-5 space-y-0.5 text-xs">
                          {m.agenda.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>

                      {m.key_decisions.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Key decisions</p>
                          <ul className="space-y-1">
                            {m.key_decisions.map((k, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>{k}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {Object.keys(m.child_updates).length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Child updates</p>
                          <div className="space-y-1.5">
                            {Object.entries(m.child_updates).map(([id, update]) => (
                              <div key={id} className="bg-muted/40 p-2 rounded text-xs">
                                <span className="font-medium">{getYPName(id)}:</span>{" "}
                                <span className="text-muted-foreground">{update}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {m.risks_identified.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Risks identified</p>
                          <ul className="space-y-1">
                            {m.risks_identified.map((r, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {m.staff_wellbeing_observations && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Staff wellbeing observations</p>
                          <p className="text-xs flex items-start gap-1.5">
                            <Heart className="h-3.5 w-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                            <span>{m.staff_wellbeing_observations}</span>
                          </p>
                        </div>
                      )}

                      {m.actions_agreed.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Actions agreed</p>
                          <div className="space-y-1">
                            {m.actions_agreed.map((a, i) => {
                              const sm = STATUS_META[a.status];
                              return (
                                <div key={i} className="flex items-center gap-2 text-xs flex-wrap">
                                  {a.status === "complete"
                                    ? <CheckCircle2 className={cn("h-3.5 w-3.5", sm.color)} />
                                    : <Clock className={cn("h-3.5 w-3.5", sm.color)} />}
                                  <span>{a.action}</span>
                                  <span className="text-muted-foreground">({getStaffName(a.owner)})</span>
                                  <Badge variant="outline" className="text-xs">Due: {a.deadline}</Badge>
                                  <Badge variant="outline" className={cn("text-xs", sm.color)}>{sm.label}</Badge>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {m.positive_moments_shared.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Positive moments shared</p>
                          <ul className="space-y-1">
                            {m.positive_moments_shared.map((p, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs">
                                <Smile className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground pt-1 border-t">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        Next meeting: {m.next_meeting}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Regulatory note */}
        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Quality Standard 13 (Leadership and Management):</strong> The registered manager
              must lead and manage the home effectively. Daily operational meetings — huddles,
              handovers, and debriefs — provide the rhythm of safe, child-centred practice. Records
              of decisions, child updates, risks, actions, and staff wellbeing checks must be
              maintained and made available for inspection (Reg 33, Reg 44/45).
            </span>
          </CardContent>
        </Card>
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Operational Meetings — team meetings, handover meetings, management meetings, multi-agency meetings, placement planning meetings, action tracking, minutes, Reg 45 governance evidence"
        recordType="team_meeting"
        className="mt-6"
      />
    </PageShell>
  );
}
