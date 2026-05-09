"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useCommunityEngagements } from "@/hooks/use-community-engagements";
import type { CommunityEngagement } from "@/types/extended";
import { COMMUNITY_ACTIVITY_TYPE_LABEL } from "@/types/extended";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Users,
  Heart,
  Star,
  MapPin,
  GraduationCap,
  Palette,
  Activity,
  Globe,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const typeIcons: Record<string, typeof Users> = {
  sports_fitness: Activity,
  arts_culture: Palette,
  volunteering: Heart,
  education: GraduationCap,
  religious_spiritual: Globe,
  social: Users,
  civic: MapPin,
  environmental: Globe,
};

const typeColour: Record<string, string> = {
  sports_fitness: "bg-blue-100 text-blue-800",
  arts_culture: "bg-purple-100 text-purple-800",
  volunteering: "bg-pink-100 text-pink-800",
  education: "bg-amber-100 text-amber-800",
  religious_spiritual: "bg-indigo-100 text-indigo-800",
  social: "bg-green-100 text-green-800",
  civic: "bg-slate-100 text-slate-800",
  environmental: "bg-emerald-100 text-emerald-800",
};

const exportCols: ExportColumn<CommunityEngagement>[] = [
  { header: "Date", accessor: (r) => r.date },
  { header: "Young People", accessor: (r) => r.young_people.map(getYPName).join("; ") },
  { header: "Activity Type", accessor: (r) => COMMUNITY_ACTIVITY_TYPE_LABEL[r.activity_type] },
  { header: "Activity", accessor: (r) => r.activity },
  { header: "Location", accessor: (r) => r.location },
  { header: "Organisation", accessor: (r) => r.organisation },
  { header: "Duration (mins)", accessor: (r) => String(r.duration_minutes) },
  { header: "Builds Connections", accessor: (r) => r.builds_connections ? "Yes" : "No" },
  { header: "Ongoing", accessor: (r) => r.ongoing_commitment ? "Yes" : "No" },
  { header: "Child Feedback", accessor: (r) => r.child_feedback },
];

export default function CommunityEngagementLogPage() {
  const { data: res, isLoading } = useCommunityEngagements();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [filterType, setFilterType] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterType !== "all") items = items.filter((e) => e.activity_type === filterType);
    if (filterYP !== "all") items = items.filter((e) => e.young_people.includes(filterYP));

    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "duration":
          return b.duration_minutes - a.duration_minutes;
        case "type":
          return a.activity_type.localeCompare(b.activity_type);
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterType, filterYP, sortBy]);

  const totalActivities = records.length;
  const ongoingCommitments = records.filter((e) => e.ongoing_commitment).length;
  const buildingConnections = records.filter((e) => e.builds_connections).length;
  const totalHours = Math.round(records.reduce((sum, e) => sum + e.duration_minutes, 0) / 60);

  if (isLoading) {
    return (
      <PageShell title="Community Engagement Log" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Community Engagement Log"
      subtitle="Recording integration into the local community — building belonging, connections, and citizenship"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="community-engagement-log" />
          <PrintButton title="Community Engagement Log" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{totalActivities}</p>
          <p className="text-xs text-muted-foreground">Total Activities</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{ongoingCommitments}</p>
          <p className="text-xs text-muted-foreground">Ongoing Commitments</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{buildingConnections}</p>
          <p className="text-xs text-muted-foreground">Building Connections</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{totalHours}h</p>
          <p className="text-xs text-muted-foreground">Total Hours</p>
        </div>
      </div>

      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Globe className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800">
          Children grow through belonging. Every entry here represents a relationship, a memory, or a connection
          that exists beyond the home — building the foundation for adulthood and citizenship.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(COMMUNITY_ACTIVITY_TYPE_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="duration">Longest First</SelectItem>
              <SelectItem value="type">By Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No activities match your filters.</div>
        )}
        {filtered.map((evt) => {
          const isExpanded = expandedId === evt.id;
          const TypeIcon = typeIcons[evt.activity_type] || Users;

          return (
            <div key={evt.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : evt.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <TypeIcon className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{evt.activity}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {evt.date} &middot; {evt.young_people.map(getYPName).join(", ")} &middot; {evt.organisation}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", typeColour[evt.activity_type])}>
                    {COMMUNITY_ACTIVITY_TYPE_LABEL[evt.activity_type]}
                  </span>
                  {evt.ongoing_commitment && <Star className="h-4 w-4 text-amber-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Outcomes</p>
                    <ul className="space-y-1">
                      {evt.outcomes.map((o, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Star className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child&apos;s Feedback</p>
                    <p className="text-sm text-blue-900 italic">&ldquo;{evt.child_feedback}&rdquo;</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-sm">{evt.notes}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><MapPin className="h-3 w-3 inline mr-1" />{evt.location}</span>
                    <span>Duration: {evt.duration_minutes} mins</span>
                    <span>Staff: {evt.staff_present.map(getStaffName).join(", ")}</span>
                    {evt.builds_connections && (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Builds Connections</span>
                    )}
                    {evt.ongoing_commitment && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">Ongoing</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Community engagement supports Quality Standard 6 (positive
          relationships), Quality Standard 8 (education), and the Children&apos;s Homes Regulations 2015
          Regulation 8 (educational achievement) and Regulation 11 (contact and relationships).
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
