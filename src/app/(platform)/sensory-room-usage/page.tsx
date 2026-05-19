"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Sparkles,
  Clock,
  CheckCircle,
  Heart,
  Eye,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSensoryRoomUsageRecords } from "@/hooks/use-sensory-room-usage-records";
import type { SensoryRoomUsageRecord, SensoryRoomInitiatedBy } from "@/types/extended";
import { SENSORY_ROOM_INITIATED_BY_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const initiatedByColour: Record<SensoryRoomInitiatedBy, string> = {
  self: "bg-green-100 text-green-800",
  staff_prompted: "bg-blue-100 text-blue-800",
  routine_scheduled: "bg-purple-100 text-purple-800",
  crisis_de_escalation: "bg-red-100 text-red-800",
};

export default function SensoryRoomUsagePage() {
  const { data: records = [], isLoading } = useSensoryRoomUsageRecords();
  const [filterYP, setFilterYP] = useState("all");
  const [filterInitiated, setFilterInitiated] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const childIds = useMemo(() => Array.from(new Set(records.map((r) => r.child_id))), [records]);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterYP !== "all") items = items.filter((u) => u.child_id === filterYP);
    if (filterInitiated !== "all") items = items.filter((u) => u.initiated_by === filterInitiated);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "improvement":
          return (b.post_state_rating - b.pre_state_rating) - (a.post_state_rating - a.pre_state_rating);
        case "duration":
          return b.duration_minutes - a.duration_minutes;
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterYP, filterInitiated, sortBy]);

  const total = records.length;
  const selfInitiated = records.filter((u) => u.initiated_by === "self").length;
  const avgImprovement = total > 0 ? (records.reduce((sum, u) => sum + (u.post_state_rating - u.pre_state_rating), 0) / total).toFixed(1) : "0";
  const totalMinutes = records.reduce((sum, u) => sum + u.duration_minutes, 0);

  const exportCols: ExportColumn<SensoryRoomUsageRecord>[] = [
    { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
    { header: "Date", accessor: (r) => r.date },
    { header: "Duration (min)", accessor: (r) => String(r.duration_minutes) },
    { header: "Initiated By", accessor: (r) => SENSORY_ROOM_INITIATED_BY_LABEL[r.initiated_by] },
    { header: "Pre State", accessor: (r) => `${r.pre_state_rating}/10` },
    { header: "Post State", accessor: (r) => `${r.post_state_rating}/10` },
    { header: "Improvement", accessor: (r) => String(r.post_state_rating - r.pre_state_rating) },
    { header: "Effectiveness", accessor: (r) => `${r.effectiveness_rating}/5` },
  ];

  if (isLoading) {
    return (
      <PageShell title="Sensory Room Usage" subtitle="Records of sensory regulation space use — self-initiated, staff-prompted, scheduled, and crisis">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Sensory Room Usage"
      subtitle="Records of sensory regulation space use — self-initiated, staff-prompted, scheduled, and crisis"
      ariaContext={{ pageTitle: "Sensory Room Usage", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="sensory-room-usage" />
          <PrintButton title="Sensory Room Usage" />
          <AriaStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Recent Uses</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{selfInitiated}</p>
          <p className="text-xs text-muted-foreground">Self-Initiated</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">+{avgImprovement}</p>
          <p className="text-xs text-muted-foreground">Avg State Improvement</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{totalMinutes}m</p>
          <p className="text-xs text-muted-foreground">Total Time</p>
        </div>
      </div>

      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800">
          The sensory space is a regulating tool, not a punishment or seclusion. Children can self-initiate
          its use; staff may suggest it; routines may include it; and it can be used for crisis de-escalation
          with full child consent. Never used as restraint or restriction.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {childIds.map((id) => (
              <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterInitiated} onValueChange={setFilterInitiated}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Initiations" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Initiations</SelectItem>
            {(Object.keys(SENSORY_ROOM_INITIATED_BY_LABEL) as SensoryRoomInitiatedBy[]).map((k) => (
              <SelectItem key={k} value={k}>{SENSORY_ROOM_INITIATED_BY_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="improvement">Best Improvement</SelectItem>
              <SelectItem value="duration">Longest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((u) => {
          const isExpanded = expandedId === u.id;
          const improvement = u.post_state_rating - u.pre_state_rating;

          return (
            <div key={u.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : u.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Sparkles className="h-5 w-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(u.child_id)} &middot; {u.date} {u.start_time}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {u.duration_minutes} mins &middot; {u.pre_state_rating}/10 → {u.post_state_rating}/10 &middot; {u.tools_used.length} tools
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", initiatedByColour[u.initiated_by])}>
                    {SENSORY_ROOM_INITIATED_BY_LABEL[u.initiated_by]}
                  </span>
                  <span className={cn("text-sm font-bold", improvement >= 3 ? "text-green-600" : improvement >= 1 ? "text-blue-600" : "text-amber-600")}>+{improvement}</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Preceding State (rated {u.pre_state_rating}/10)</p>
                    <p className="text-sm">{u.preceding_state}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Tools Used</p>
                    <div className="flex flex-wrap gap-1">
                      {u.tools_used.map((t, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">{t}</span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child&apos;s Comment</p>
                    <p className="text-sm italic">&ldquo;{u.child_comment}&rdquo;</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Post State (rated {u.post_state_rating}/10) &middot; Effectiveness {u.effectiveness_rating}/5</p>
                    <p className="text-sm">{u.staff_observation}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Outcomes Achieved</p>
                    <ul className="space-y-1">
                      {u.outcomes_achieved.map((o, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <CheckCircle className="h-3 w-3 text-emerald-500 mt-1 shrink-0" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {u.follow_up_needed && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Follow-Up</p>
                      <p className="text-sm">{u.follow_up_needed}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Clock className="h-3 w-3 inline mr-1" />{u.start_time} – {u.end_time}</span>
                    <span><Eye className="h-3 w-3 inline mr-1" />{u.staff_present.length === 0 ? "No staff present" : `Staff: ${u.staff_present.map(getStaffName).join(", ")}`}</span>
                    <span><Heart className="h-3 w-3 inline mr-1" />Effectiveness: {u.effectiveness_rating}/5</span>
                  </div>

                  <SmartLinkPanel sourceType="sensory-room-usage" sourceId={u.id} childId={u.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Sensory room usage records support Quality Standard 7 (health
          and wellbeing), Quality Standard 5 (protection — non-restrictive practice), and trauma-informed
          care principles. Use is always voluntary and child-led. Linked to Sensory Profiles, Behaviour
          Support Plans, and Bedtime/Wake-Up Routines.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Health & Wellbeing"
        category={["health", "wellbeing"]}
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Sensory Room Usage — sensory regulation space use, self-initiated, staff-prompted, scheduled, crisis sessions, outcomes, behaviour impact, autism, ADHD, trauma response"
        recordType="direct_work"
        className="mt-6"
      />
    </PageShell>
  );
}
