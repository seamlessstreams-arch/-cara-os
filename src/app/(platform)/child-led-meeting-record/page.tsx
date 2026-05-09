"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Mic,
  Heart,
  Star,
  Users,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChildLedMeetingRecord, ChildLedMeetingType } from "@/types/extended";
import { CHILD_LED_MEETING_TYPE_LABEL } from "@/types/extended";
import { useChildLedMeetings } from "@/hooks/use-child-led-meetings";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const exportCols: ExportColumn<ChildLedMeetingRecord>[] = [
  { header: "Date", accessor: (r: ChildLedMeetingRecord) => r.date },
  { header: "Child Chair", accessor: (r: ChildLedMeetingRecord) => getYPName(r.child_id) },
  { header: "Purpose", accessor: (r: ChildLedMeetingRecord) => r.meeting_purpose },
  { header: "Type", accessor: (r: ChildLedMeetingRecord) => CHILD_LED_MEETING_TYPE_LABEL[r.meeting_type] },
  { header: "Duration (min)", accessor: (r: ChildLedMeetingRecord) => String(r.duration_minutes) },
  { header: "Attendees", accessor: (r: ChildLedMeetingRecord) => String(r.attendees.length + r.external_attendees.length) },
  { header: "Decisions Reached", accessor: (r: ChildLedMeetingRecord) => String(r.decisions_reached.length) },
];

export default function ChildLedMeetingRecordPage() {
  const { data: queryData, isLoading } = useChildLedMeetings();
  const items = queryData?.data ?? [];

  const [filterChair, setFilterChair] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...items];
    if (filterChair !== "all") list = list.filter((m) => m.child_id === filterChair);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "duration":
          return b.duration_minutes - a.duration_minutes;
        default:
          return 0;
      }
    });
    return list;
  }, [filterChair, sortBy, items]);

  const total = items.length;
  const uniqueChairs = new Set(items.map((m) => m.child_id)).size;
  const totalDecisions = items.reduce((sum, m) => sum + m.decisions_reached.length, 0);
  const visibleChanges = items.filter((m) => m.visible_change).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <PageShell
      title="Child-Led Meeting Record"
      subtitle="Records of meetings children themselves chaired or led — voice with audience and influence"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={items} columns={exportCols} filename="child-led-meetings" />
          <PrintButton title="Child-Led Meeting Record" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Meetings Led</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{uniqueChairs}/3</p>
          <p className="text-xs text-muted-foreground">Children as Chair</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{totalDecisions}</p>
          <p className="text-xs text-muted-foreground">Decisions Reached</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{visibleChanges}</p>
          <p className="text-xs text-muted-foreground">Visible Changes</p>
        </div>
      </div>

      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Mic className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800">
          When children lead meetings, they have voice, audience, and influence — the four-part Lundy
          model in action. Staff support but do not steer. Decisions made are real. Children see their
          authority result in change.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterChair} onValueChange={setFilterChair}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Chairs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Chairs</SelectItem>
            {[...new Set(items.map(m => m.child_id))].map((childId) => (
              <SelectItem key={childId} value={childId}>{getYPName(childId)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="duration">Longest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((m) => {
          const isExpanded = expandedId === m.id;

          return (
            <div key={m.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : m.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Mic className="h-5 w-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.meeting_purpose}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.date} &middot; Chaired by {getYPName(m.child_id)} &middot; {m.duration_minutes} mins &middot; {m.decisions_reached.length} decisions
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">{CHILD_LED_MEETING_TYPE_LABEL[m.meeting_type]}</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Pre-Meeting Preparation</p>
                    <ul className="space-y-1">
                      {m.pre_meeting_preparation.map((p, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-purple-600 mt-0.5">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Child-Proposed Agenda</p>
                    <ul className="space-y-1">
                      {m.agenda_proposed_by_child.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Star className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      <Mic className="h-3 w-3 inline mr-1" />Child Role in Chairing
                    </p>
                    <p className="text-sm">{m.child_role_in_chairing}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Decisions Reached</p>
                    <ul className="space-y-1">
                      {m.decisions_reached.map((d, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Staff Role (Background)</p>
                    <p className="text-sm">{m.staff_role}</p>
                  </div>

                  {m.child_contributors.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <Users className="h-3 w-3 inline mr-1" />Other Children&apos;s Contributions
                      </p>
                      <div className="space-y-1">
                        {m.child_contributors.map((c, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                            <p className="font-medium">{getYPName(c.contributor)}</p>
                            <p className="text-xs text-muted-foreground">{c.contribution}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {m.challenges_navigated.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Challenges Navigated</p>
                      <ul className="space-y-1">
                        {m.challenges_navigated.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Proud Moments</p>
                    <ul className="space-y-1">
                      {m.proud_moments.map((p, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Star className="h-3 w-3 text-emerald-500 mt-1 shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">
                      <Heart className="h-3 w-3 inline mr-1" />Child&apos;s Reflection After
                    </p>
                    <p className="text-sm italic">&ldquo;{m.child_reflection_after}&rdquo;</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Visible Change</p>
                    <p className="text-sm">{m.visible_change}</p>
                  </div>

                  {m.follow_up && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Follow-Up</p>
                      <p className="text-sm">{m.follow_up}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Users className="h-3 w-3 inline mr-1" />{m.attendees.length + m.external_attendees.length} attendees</span>
                    <span><Clock className="h-3 w-3 inline mr-1" />{m.duration_minutes} mins</span>
                    <span>Recorded: {getStaffName(m.recorded_by)}</span>
                  </div>

                  <SmartLinkPanel sourceType="child_led_meeting" sourceId={m.id} childId={m.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Child-led meeting records support UNCRC Article 12 (right
          to be heard and taken seriously), Quality Standard 1 (child-centred care), and the Lundy model
          of participation (space, voice, audience, influence). Linked to Children&apos;s Meetings, Voice
          of Child, Children&apos;s Pledges, and Feedback Loops.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
