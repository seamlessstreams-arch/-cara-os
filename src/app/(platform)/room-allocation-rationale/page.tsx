"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Home,
  Users,
  Heart,
  Volume2,
  Sun,
  Bed,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { useRoomAllocationRecords } from "@/hooks/use-room-allocation-records";
import type { RoomAllocationRecord } from "@/types/extended";
import { ROOM_ALLOCATION_SUITABILITY_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── page ────────────────────────────────────────────────────────────── */

export default function RoomAllocationRationalePage() {
  const { data: records = [], isLoading } = useRoomAllocationRecords();
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const childIds = useMemo(() => Array.from(new Set(records.map((r) => r.child_id))), [records]);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterYP !== "all") items = items.filter((r) => r.child_id === filterYP);
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.child_id.localeCompare(b.child_id);
        case "rating":
          return b.fit_for_purpose_rating - a.fit_for_purpose_rating;
        case "date":
          return b.allocated_date.localeCompare(a.allocated_date);
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterYP, sortBy]);

  const total = records.length;
  const avgRating = total > 0 ? (records.reduce((sum, r) => sum + r.fit_for_purpose_rating, 0) / total).toFixed(1) : "0";
  const totalReviews = records.reduce((sum, r) => sum + r.has_been_reviewed.length, 0);

  const exportCols: ExportColumn<RoomAllocationRecord>[] = [
    { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
    { header: "Room", accessor: (r) => r.room_number },
    { header: "Allocated", accessor: (r) => r.allocated_date },
    { header: "Decision Maker", accessor: (r) => getStaffName(r.decision_maker) },
    { header: "Fit Rating", accessor: (r) => `${r.fit_for_purpose_rating}/5` },
    { header: "Reviews Held", accessor: (r) => String(r.has_been_reviewed.length) },
    { header: "Last Reviewed", accessor: (r) => r.has_been_reviewed.length > 0 ? r.has_been_reviewed[r.has_been_reviewed.length - 1].review_date : "Never" },
  ];

  if (isLoading) {
    return (
      <PageShell title="Room Allocation Rationale" subtitle="Why each child has the bedroom they have — documented, child-led, regularly reviewed">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Room Allocation Rationale"
      subtitle="Why each child has the bedroom they have — documented, child-led, regularly reviewed"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="room-allocation-rationale" />
          <PrintButton title="Room Allocation Rationale" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Active Allocations</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{avgRating}/5</p>
          <p className="text-xs text-muted-foreground">Avg Fit Rating</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalReviews}</p>
          <p className="text-xs text-muted-foreground">Total Reviews</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">100%</p>
          <p className="text-xs text-muted-foreground">Child Input Recorded</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Home className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          Room allocation is one of the first decisions made about a child&apos;s life here. The choice
          shapes daily experience — sensory, social, identity, privacy. We document why each child has
          the room they have, what alternatives were considered, and how the child&apos;s voice shaped
          the decision.
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
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="rating">By Fit Rating</SelectItem>
              <SelectItem value="date">Most Recent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;

          return (
            <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Bed className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(r.child_id)} &middot; {r.room_number}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Allocated {r.allocated_date} &middot; {r.has_been_reviewed.length} reviews &middot; Fit {r.fit_for_purpose_rating}/5
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-sm font-bold text-green-600">{r.fit_for_purpose_rating}/5</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Room Description</p>
                    <p className="text-sm">{r.room_description}</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Reasons for This Allocation</p>
                    <ul className="space-y-1">
                      {r.reasons_for_allocation.map((reason, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <CheckCircle className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Considerations at Decision</p>
                    <ul className="space-y-1">
                      {r.considerations_at_panel_discussion.map((c, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-purple-600 mt-0.5">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">
                      <Heart className="h-3 w-3 inline mr-1" />Child&apos;s Input
                    </p>
                    <p className="text-sm">{r.child_input_on_allocation}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Alternatives Considered</p>
                    <div className="space-y-1">
                      {r.alternative_rooms_considered.map((a, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <p className="font-medium">{a.room}</p>
                          <p className="text-xs text-muted-foreground">Not chosen: {a.why_not_chosen}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Room Characteristics</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {r.room_characteristics.map((c, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-center justify-between">
                          <span>{c.feature}</span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                            c.suitability === "strong_fit" ? "bg-green-100 text-green-800" :
                            c.suitability === "acceptable" ? "bg-blue-100 text-blue-800" :
                            c.suitability === "adapted" ? "bg-purple-100 text-purple-800" :
                            "bg-amber-100 text-amber-800"
                          )}>
                            {ROOM_ALLOCATION_SUITABILITY_LABEL[c.suitability]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                        <Volume2 className="h-3 w-3 inline mr-1" />Sensory Considerations
                      </p>
                      <ul className="space-y-1">
                        {r.sensory_considerations.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-emerald-600 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Safeguarding Considerations</p>
                      <ul className="space-y-1">
                        {r.safeguarding_considerations.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Users className="h-3 w-3 inline mr-1" />Proximity to Other Children
                    </p>
                    <div className="space-y-1">
                      {r.proximity_to_other_children.map((p, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <p className="font-medium">{p.peer}</p>
                          <p className="text-xs text-muted-foreground">{p.relationship} &middot; {p.impact}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Communal Areas Proximity</p>
                      <p>{r.proximity_to_communal_areas}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Staff Office Proximity</p>
                      <p>{r.proximity_to_staff_office}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Review History</p>
                    <div className="space-y-1">
                      {r.has_been_reviewed.map((rev, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-start justify-between gap-2">
                          <span>{rev.outcome}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{rev.review_date}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                      <Sun className="h-3 w-3 inline mr-1" />Child&apos;s Satisfaction
                    </p>
                    <p className="text-sm">{r.child_satisfaction_with_room}</p>
                  </div>

                  {r.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{r.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Decision: {getStaffName(r.decision_maker)}</span>
                    <span>Reviews: {r.has_been_reviewed.length}</span>
                    <span>Fit rating: {r.fit_for_purpose_rating}/5</span>
                  </div>

                  <SmartLinkPanel sourceType="room-allocation" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Room allocation rationale supports Quality Standard 1
          (child-centred care), Children&apos;s Homes Regulations 2015 Schedule 1 (homely environment),
          and Quality Standard 5 (protection — proximity considerations). Reviewed annually or when
          group dynamic changes. Linked to Bedroom Personalisation, Cohort Analysis, and Pre-Admission
          Checklist.
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
