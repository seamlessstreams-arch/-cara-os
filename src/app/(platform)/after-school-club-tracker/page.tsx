"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useClubRecords } from "@/hooks/use-club-records";
import type { ClubRecord } from "@/types/extended";
import {
  CLUB_TYPE_LABEL,
  CLUB_ONGOING_STATUS_LABEL,
  CLUB_FUNDING_SOURCE_LABEL,
  CLUB_SOCIAL_ASPECT_LABEL,
} from "@/types/extended";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Star,
  Heart,
  Users,
  Clock,
  Calendar,
  Sparkles,
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
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const statusColour: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  trialled_declined: "bg-blue-100 text-blue-800",
  on_break: "bg-amber-100 text-amber-800",
  ended: "bg-slate-100 text-[var(--cs-navy)]",
};

const exportCols: ExportColumn<ClubRecord>[] = [
  { header: "Young Person", accessor: (r: ClubRecord) => getYPName(r.child_id) },
  { header: "Club", accessor: (r: ClubRecord) => r.club_name },
  { header: "Type", accessor: (r: ClubRecord) => CLUB_TYPE_LABEL[r.club_type] },
  { header: "Schedule", accessor: (r: ClubRecord) => r.schedule },
  { header: "Started", accessor: (r: ClubRecord) => r.started_date },
  { header: "Status", accessor: (r: ClubRecord) => CLUB_ONGOING_STATUS_LABEL[r.ongoing_status] },
  { header: "Attendance", accessor: (r: ClubRecord) => `${r.attendance.sessions_attended}/${r.attendance.sessions_held_last_term}` },
  { header: "Enjoyment", accessor: (r: ClubRecord) => `${r.child_enjoyment_rating}/5` },
  { header: "Cost £", accessor: (r: ClubRecord) => `£${r.cost}` },
];

export default function AfterSchoolClubTrackerPage() {
  const { data: res, isLoading } = useClubRecords();
  const data = useMemo(() => res?.data ?? [], [res]);
  const [filterYP, setFilterYP] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("status");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <PageShell title="After-School Club Tracker" subtitle="Per-child club and activity engagement — investments in identity, belonging, and skill">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const filtered = (() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((r) => r.child_id === filterYP);
    if (filterStatus !== "all") items = items.filter((r) => r.ongoing_status === filterStatus);
    items.sort((a, b) => {
      switch (sortBy) {
        case "status": {
          const ord: Record<string, number> = { active: 0, on_break: 1, trialled_declined: 2, ended: 3 };
          return (ord[a.ongoing_status] ?? 9) - (ord[b.ongoing_status] ?? 9);
        }
        case "attendance": {
          const pctA = a.attendance.sessions_attended / Math.max(1, a.attendance.sessions_held_last_term);
          const pctB = b.attendance.sessions_attended / Math.max(1, b.attendance.sessions_held_last_term);
          return pctB - pctA;
        }
        case "enjoyment":
          return b.child_enjoyment_rating - a.child_enjoyment_rating;
        default:
          return 0;
      }
    });
    return items;
  })();

  const total = data.length;
  const active = data.filter((r) => r.ongoing_status === "active").length;
  const totalCost = data.filter((r) => r.ongoing_status === "active").reduce((sum, r) => sum + r.cost, 0);
  const avgEnjoyment = (data.filter((r) => r.ongoing_status === "active").reduce((sum, r) => sum + r.child_enjoyment_rating, 0) / Math.max(1, active)).toFixed(1);

  return (
    <PageShell
      title="After-School Club Tracker"
      subtitle="Per-child club and activity engagement — investments in identity, belonging, and skill"
      ariaContext={{ pageTitle: "After-School Club Tracker", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="after-school-clubs" />
          <PrintButton title="After-School Club Tracker" />
          <AriaStudioQuickActionButton context={{ record_type: "education", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Total Records</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{active}</p>
          <p className="text-xs text-muted-foreground">Active Engagements</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">£{totalCost}</p>
          <p className="text-xs text-muted-foreground">Annual Investment (active)</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{avgEnjoyment}/5</p>
          <p className="text-xs text-muted-foreground">Avg Enjoyment</p>
        </div>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-6 flex items-start gap-2">
        <Star className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          Clubs and activities are not just hobbies — they are identity, belonging, and protective relationships.
          We invest in each child&apos;s clubs intentionally. Trying and choosing not to continue is also valid.
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
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">{CLUB_ONGOING_STATUS_LABEL.active}</SelectItem>
            <SelectItem value="trialled_declined">{CLUB_ONGOING_STATUS_LABEL.trialled_declined}</SelectItem>
            <SelectItem value="on_break">{CLUB_ONGOING_STATUS_LABEL.on_break}</SelectItem>
            <SelectItem value="ended">{CLUB_ONGOING_STATUS_LABEL.ended}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="status">By Status</SelectItem>
              <SelectItem value="attendance">By Attendance</SelectItem>
              <SelectItem value="enjoyment">By Enjoyment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((c) => {
          const isExpanded = expandedId === c.id;
          const attPct = Math.round((c.attendance.sessions_attended / Math.max(1, c.attendance.sessions_held_last_term)) * 100);

          return (
            <div key={c.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Star className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.club_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getYPName(c.child_id)} &middot; {CLUB_TYPE_LABEL[c.club_type]} &middot; {c.schedule}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColour[c.ongoing_status])}>
                    {CLUB_ONGOING_STATUS_LABEL[c.ongoing_status]}
                  </span>
                  <span className="text-sm font-bold text-amber-600">{c.child_enjoyment_rating}/5</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Started</p>
                      <p className="font-medium">{c.started_date}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Attendance</p>
                      <p className="font-medium">{c.attendance.sessions_attended}/{c.attendance.sessions_held_last_term} ({attPct}%)</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Cost</p>
                      <p className="font-medium">£{c.cost}/yr</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Funding</p>
                      <p className="font-medium">{CLUB_FUNDING_SOURCE_LABEL[c.funding_source]}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Star className="h-3 w-3 inline mr-1" />Achievements
                    </p>
                    <ul className="space-y-1">
                      {c.achievements_at_club.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Star className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {c.challenges_at_club.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Challenges</p>
                      <ul className="space-y-1">
                        {c.challenges_at_club.map((ch, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{ch}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child&apos;s Comments</p>
                    <p className="text-sm italic">&ldquo;{c.child_comments}&rdquo;</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Staff Observations</p>
                    <p className="text-sm">{c.staff_observations}</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Contributes To</p>
                    <ul className="space-y-1">
                      {c.contributes_to_outcomes.map((o, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Heart className="h-3 w-3 text-purple-500 mt-1 shrink-0" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {c.ended_date && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Ended {c.ended_date}</p>
                      <p className="text-sm">{c.reason_for_ending}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Calendar className="h-3 w-3 inline mr-1" />{c.schedule}</span>
                    <span><Users className="h-3 w-3 inline mr-1" />{CLUB_SOCIAL_ASPECT_LABEL[c.social_aspect]}</span>
                    <span>Travel: {c.travel_arrangements}</span>
                    <span>Staff: {getStaffName(c.staff_escort)}</span>
                  </div>

                  {c.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{c.notes}</p>
                    </div>
                  )}

                  <SmartLinkPanel sourceType="club-records" sourceId={c.id} childId={c.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> After-school clubs and activities support Quality Standard 6
          (positive relationships), Quality Standard 7 (health and wellbeing), Quality Standard 1 (child-centred
          care), and UNCRC Article 31 (right to play and leisure). Activity budget allocated per child.
          Linked to Activities, Community Engagement, and Outcomes pages.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Education & Activities"
        category={["education", "activity"]}
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="After-School Club Tracker — clubs attended, transport arrangements, permission, cost, participation, enrichment, LAC entitlement, PEP targets, education outcomes"
        recordType="education"
        className="mt-6"
      />
    </PageShell>
  );
}
