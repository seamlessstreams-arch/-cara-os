"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  ChevronUp,
  ChevronDown,
  Home,
  AlertTriangle,
  CheckCircle2,
  Users,
  Shield,
  ArrowUpDown,
  TrendingUp,
  Heart,
  Loader2,
} from "lucide-react";
import type {
  PlacementStabilityMeeting,
  StabilityMeetingAgreement,
  StabilityMeetingStatus,
  StabilityMeetingRiskLevel,
} from "@/types/extended";
import {
  STABILITY_MEETING_STATUS_LABEL,
  STABILITY_MEETING_RISK_LEVEL_LABEL,
} from "@/types/extended";
import { usePlacementStabilityMeetings } from "@/hooks/use-placement-stability-meetings";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ─── export columns ─── */
const exportCols: ExportColumn<PlacementStabilityMeeting>[] = [
  { header: "Young Person", accessor: (r: PlacementStabilityMeeting) => getYPName(r.child_id) },
  { header: "Date", accessor: (r: PlacementStabilityMeeting) => r.meeting_date },
  { header: "Chair", accessor: (r: PlacementStabilityMeeting) => r.chairperson },
  { header: "Trigger", accessor: (r: PlacementStabilityMeeting) => r.trigger },
  { header: "Risk Level", accessor: (r: PlacementStabilityMeeting) => r.risk_level },
  { header: "Status", accessor: (r: PlacementStabilityMeeting) => r.status.replace(/_/g, " ") },
  { header: "Agreements", accessor: (r: PlacementStabilityMeeting) => r.agreements_reached.length.toString() },
  { header: "Outcome", accessor: (r: PlacementStabilityMeeting) => r.outcome },
  { header: "Child View", accessor: (r: PlacementStabilityMeeting) => r.child_view },
];

/* ─── component ─── */
export default function PlacementStabilityMeetingsPage() {
  const { data: res, isLoading } = usePlacementStabilityMeetings();
  const entries = res?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const childIds = useMemo(() => [...new Set(entries.map(e => e.child_id))], [entries]);

  const filtered = useMemo(() => {
    let list = [...entries];
    if (filterYP !== "all") list = list.filter((r) => r.child_id === filterYP);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.meeting_date.localeCompare(a.meeting_date);
        case "risk": {
          const rOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
          return rOrder[a.risk_level] - rOrder[b.risk_level];
        }
        default:
          return 0;
      }
    });
    return list;
  }, [entries, filterYP, sortBy]);

  const stats = useMemo(() => {
    const total = entries.length;
    const stabilised = entries.filter((m) => m.status === "stabilised" || m.status === "placement_stable").length;
    const ended = entries.filter((m) => m.status === "ended").length;
    const avgAgreements = total > 0 ? Math.round(entries.reduce((s, m) => s + m.agreements_reached.length, 0) / total) : 0;
    return { total, stabilised, ended, avgAgreements };
  }, [entries]);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const statusBadge = (status: StabilityMeetingStatus) => {
    const colours: Record<StabilityMeetingStatus, string> = {
      placement_stable: "bg-green-100 text-green-800",
      stabilised: "bg-blue-100 text-blue-800",
      at_risk: "bg-red-100 text-red-800",
      ended: "bg-gray-100 text-gray-800",
    };
    return <Badge className={colours[status]}>{STABILITY_MEETING_STATUS_LABEL[status]}</Badge>;
  };

  const riskBadge = (risk: StabilityMeetingRiskLevel) => {
    const colours: Record<StabilityMeetingRiskLevel, string> = {
      high: "bg-red-100 text-red-800 text-xs",
      medium: "bg-amber-100 text-amber-800 text-xs",
      low: "bg-green-100 text-green-800 text-xs",
    };
    return <Badge className={colours[risk]}>{STABILITY_MEETING_RISK_LEVEL_LABEL[risk]} Risk</Badge>;
  };

  if (isLoading) {
    return (
      <PageShell title="Placement Stability Meetings" subtitle="Multi-agency meetings to prevent placement breakdown and keep children in the right home">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Placement Stability Meetings"
      subtitle="Multi-agency meetings to prevent placement breakdown and keep children in the right home"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={entries} columns={exportCols} filename="stability-meetings" />
          <PrintButton title="Placement Stability Meetings" />
        </div>
      }
    >
      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Meetings Held</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.stabilised}</p>
            <p className="text-xs text-muted-foreground">Placements Saved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.ended}</p>
            <p className="text-xs text-muted-foreground">Ended</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.avgAgreements}</p>
            <p className="text-xs text-muted-foreground">Avg Agreements/Meeting</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── success note ─── */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">100% Placement Stability</p>
            <p className="text-xs text-green-700 mt-1">
              All placements at Oak House have been maintained. Where stability was at risk,
              proactive multi-agency intervention and genuine listening to children&apos;s voices
              resolved concerns. Zero unplanned endings in 12 months.
            </p>
          </div>
        </div>
      </div>

      {/* ─── filters ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterYP}
          onChange={(e) => setFilterYP(e.target.value)}
        >
          <option value="all">All Young People</option>
          {childIds.map((c) => (
            <option key={c} value={c}>{getYPName(c)}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Most Recent</option>
            <option value="risk">Risk Level</option>
          </select>
        </div>
      </div>

      {/* ─── meeting cards ─── */}
      <div className="space-y-4">
        {filtered.map((meeting) => {
          const expanded = expandedId === meeting.id;

          return (
            <Card key={meeting.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(meeting.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      meeting.status === "stabilised" || meeting.status === "placement_stable" ? "bg-green-100" : "bg-red-100"
                    )}>
                      <Home className={cn(
                        "h-5 w-5",
                        meeting.status === "stabilised" || meeting.status === "placement_stable" ? "text-green-600" : "text-red-600"
                      )} />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {getYPName(meeting.child_id)} — {meeting.meeting_date}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {statusBadge(meeting.status)}
                        {riskBadge(meeting.risk_level)}
                      </div>
                    </div>
                  </div>
                  {expanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-5">
                  {/* trigger */}
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                    <p className="text-sm font-medium text-amber-800">Trigger</p>
                    <p className="text-sm text-amber-700 mt-1">{meeting.trigger}</p>
                  </div>

                  {/* attendees */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Attendees</p>
                    <div className="flex flex-wrap gap-1">
                      {meeting.attendees.map((att, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {att.startsWith("staff_") ? getStaffName(att) : att}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* concerns & strengths */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Concerns
                      </p>
                      <ul className="space-y-1">
                        {meeting.concerns.map((c, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-red-400 mt-1.5">•</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Strengths
                      </p>
                      <ul className="space-y-1">
                        {meeting.strengths.map((s, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-green-400 mt-1.5">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* child view */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 mb-1 flex items-center gap-1">
                      <Heart className="h-4 w-4" /> Child&apos;s View
                    </p>
                    <p className="text-sm text-blue-700">{meeting.child_view}</p>
                  </div>

                  {/* agreements */}
                  <div>
                    <p className="text-sm font-medium mb-2">Agreements Reached</p>
                    <div className="space-y-2">
                      {meeting.agreements_reached.map((agr, i) => (
                        <div key={i} className="border rounded-md p-2 flex items-center justify-between">
                          <div>
                            <p className="text-sm">{agr.agreement}</p>
                            <p className="text-xs text-muted-foreground">
                              {agr.owner.startsWith("staff_") ? getStaffName(agr.owner) : agr.owner} · by {agr.deadline}
                            </p>
                          </div>
                          <Badge className={cn(
                            "text-xs",
                            agr.status === "completed" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                          )}>
                            {agr.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* outcome */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-800 mb-1">Outcome</p>
                    <p className="text-sm text-green-700">{meeting.outcome}</p>
                  </div>

                  {/* notes */}
                  <div className="bg-muted/30 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">Reflective Notes</p>
                    <p className="text-sm text-muted-foreground">{meeting.notes}</p>
                  </div>

                  {/* smart link panel */}
                  <SmartLinkPanel sourceType="placement-stability-meeting" sourceId={meeting.id} childId={meeting.child_id} compact />

                  {/* footer */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Chaired By</p>
                      <p className="text-sm font-medium">{meeting.chairperson}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Review Date</p>
                      <p className="text-sm font-medium">{meeting.review_date ?? "No further review needed"}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">Regulatory Context</p>
        <p className="text-xs text-slate-600">
          Placement stability is a key outcome measure for Ofsted. The SCCIF examines whether the
          home works proactively to maintain placements and prevents unplanned endings. Quality
          Standard 1 requires that children experience stable, consistent care. Where placements
          are at risk, Regulation 7 requires that the registered person takes all reasonable steps
          to address concerns. Multi-agency stability meetings demonstrate professional
          accountability, partnership working, and commitment to keeping children in the right home.
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
