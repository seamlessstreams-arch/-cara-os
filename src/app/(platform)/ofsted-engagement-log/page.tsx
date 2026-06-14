"use client";

import { useState, useMemo } from "react";
import {
  Search, ArrowUpDown, Filter, Building2, Phone, Mail, FileText,
  ClipboardCheck, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2,
  Clock, Send, BookOpen, Calendar, MessageSquare, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useOfstedEngagementLog } from "@/hooks/use-ofsted-engagement-log";
import type {
  OfstedEngagementRecord,
  OfstedEngagementType,
  OfstedEngagementStatus,
  OfstedEngagementAction,
} from "@/types/extended";
import {
  OFSTED_ENGAGEMENT_TYPE_LABEL,
  OFSTED_ENGAGEMENT_STATUS_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── derived constants ──────────────────────────────────────────────── */
const ENGAGEMENT_TYPES = Object.entries(OFSTED_ENGAGEMENT_TYPE_LABEL) as [OfstedEngagementType, string][];
const ENGAGEMENT_STATUSES = Object.entries(OFSTED_ENGAGEMENT_STATUS_LABEL) as [OfstedEngagementStatus, string][];

/* ── component ───────────────────────────────────────────────────────── */
export default function OfstedEngagementLogPage() {
  const { data: res, isLoading } = useOfstedEngagementLog();
  const records: OfstedEngagementRecord[] = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ── derived data ────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.topic_or_reason.toLowerCase().includes(q) ||
          r.summary.toLowerCase().includes(q) ||
          r.inspector_or_team.toLowerCase().includes(q) ||
          r.reference.toLowerCase().includes(q) ||
          OFSTED_ENGAGEMENT_TYPE_LABEL[r.engagement_type].toLowerCase().includes(q)
      );
    }
    if (filterType !== "all") {
      list = list.filter((r) => r.engagement_type === filterType);
    }
    if (filterStatus !== "all") {
      list = list.filter((r) => r.engagement_status === filterStatus);
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "date_asc":
          return a.date.localeCompare(b.date);
        case "type":
          return OFSTED_ENGAGEMENT_TYPE_LABEL[a.engagement_type].localeCompare(
            OFSTED_ENGAGEMENT_TYPE_LABEL[b.engagement_type]
          );
        case "status":
          return OFSTED_ENGAGEMENT_STATUS_LABEL[a.engagement_status].localeCompare(
            OFSTED_ENGAGEMENT_STATUS_LABEL[b.engagement_status]
          );
        default:
          return 0;
      }
    });
    return list;
  }, [records, search, filterType, filterStatus, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────── */
  const today = new Date();
  const yearAgo = new Date();
  yearAgo.setFullYear(today.getFullYear() - 1);

  const engagementsThisYear = records.filter((r) => new Date(r.date) >= yearAgo).length;
  const notificationsSubmitted = records.filter(
    (r) => r.engagement_type === "statutory_notification"
  ).length;
  const outstandingActions = records.reduce(
    (sum, r) =>
      sum +
      r.actions_agreed.filter((a) => a.status !== "Completed" && a.status !== "Closed").length,
    0
  );
  const lastEngagementDate = records
    .map((r) => r.date)
    .sort((a, b) => b.localeCompare(a))[0];
  const daysSinceLast = lastEngagementDate
    ? Math.floor(
        (today.getTime() - new Date(lastEngagementDate).getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  /* ── icon helper ─────────────────────────────────────────────────── */
  const iconFor = (type: OfstedEngagementType) => {
    switch (type) {
      case "phone_call_hmi":
      case "phone_call_rm":
        return Phone;
      case "email":
        return Mail;
      case "monitoring_visit":
      case "inspection_full":
      case "mock_inspection":
        return ClipboardCheck;
      case "statutory_notification":
        return Send;
      case "reg45_submission":
      case "annual_return":
      case "update_letter":
        return FileText;
      default:
        return Building2;
    }
  };

  /* ── export columns ──────────────────────────────────────────────── */
  const exportCols: ExportColumn<OfstedEngagementRecord>[] = [
    { header: "ID", accessor: (r) => r.id },
    { header: "Date", accessor: (r) => r.date },
    { header: "Type", accessor: (r) => OFSTED_ENGAGEMENT_TYPE_LABEL[r.engagement_type] },
    { header: "Reference", accessor: (r) => r.reference },
    { header: "Inspector / Team", accessor: (r) => r.inspector_or_team },
    { header: "Topic / Reason", accessor: (r) => r.topic_or_reason },
    { header: "Summary", accessor: (r) => r.summary },
    { header: "Our Response", accessor: (r) => r.our_response },
    {
      header: "Documents Shared",
      accessor: (r) => r.documents_shared.join("; "),
    },
    {
      header: "Actions Agreed",
      accessor: (r) =>
        r.actions_agreed
          .map((a) => `${a.action} (owner: ${getStaffName(a.owner)}, due ${a.deadline}, ${a.status})`)
          .join(" | "),
    },
    { header: "Inspector Feedback", accessor: (r) => r.inspector_feedback },
    { header: "Our Reflection", accessor: (r) => r.our_reflection },
    { header: "Recorded By", accessor: (r) => getStaffName(r.recorded_by) },
    { header: "Next Engagement", accessor: (r) => r.next_engagement },
    { header: "Status", accessor: (r) => OFSTED_ENGAGEMENT_STATUS_LABEL[r.engagement_status] },
  ];

  /* ── loading state ───────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <PageShell
        title="Ofsted Engagement Log"
        subtitle="All contact with Ofsted between full inspections — notifications, calls, emails, monitoring visits and statutory submissions"
      >
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Ofsted Engagement Log"
      subtitle="All contact with Ofsted between full inspections — notifications, calls, emails, monitoring visits and statutory submissions"
      caraContext={{ pageTitle: "Ofsted Engagement Log", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Ofsted Engagement Log" />
          <ExportButton data={filtered} columns={exportCols} filename="ofsted-engagement-log" />
          <CaraStudioQuickActionButton context={{ record_type: "ofsted_evidence", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── summary stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Engagements this year",
              value: engagementsThisYear,
              icon: Building2,
              colour: "text-blue-600",
            },
            {
              label: "Notifications submitted",
              value: notificationsSubmitted,
              icon: Send,
              colour: "text-indigo-600",
            },
            {
              label: "Outstanding actions",
              value: outstandingActions,
              icon: AlertTriangle,
              colour: outstandingActions > 0 ? "text-amber-600" : "text-[var(--cs-text-muted)]",
            },
            {
              label: "Days since last engagement",
              value: daysSinceLast,
              icon: Calendar,
              colour: "text-emerald-600",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border bg-white p-4 flex items-center gap-3"
            >
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── outstanding actions banner ─────────────────────────── */}
        {outstandingActions > 0 && (
          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">
                  {outstandingActions} action{outstandingActions > 1 ? "s" : ""} agreed with Ofsted
                  still open.
                </p>
                <p className="mt-1">
                  Track progress against agreed actions and reflect closure in the next Reg 45 cycle.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── filters ────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search engagements..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[210px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ENGAGEMENT_TYPES.map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ENGAGEMENT_STATUSES.map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="date_asc">Date (Oldest)</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── engagement cards ───────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No engagements match your filters.
            </div>
          )}
          {filtered.map((rec) => {
            const isExpanded = expandedId === rec.id;
            const TypeIcon = iconFor(rec.engagement_type);
            const openActions = rec.actions_agreed.filter(
              (a) => a.status !== "Completed" && a.status !== "Closed"
            ).length;
            const statusLabel = OFSTED_ENGAGEMENT_STATUS_LABEL[rec.engagement_status];
            const typeLabel = OFSTED_ENGAGEMENT_TYPE_LABEL[rec.engagement_type];

            return (
              <div key={rec.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <TypeIcon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        rec.engagement_status === "active"
                          ? "text-amber-600"
                          : rec.engagement_status === "following_up"
                          ? "text-blue-600"
                          : "text-[var(--cs-text-muted)]"
                      )}
                    />
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {typeLabel} &middot;{" "}
                        <span className="text-muted-foreground font-normal">{rec.reference}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {rec.date} &middot; {rec.inspector_or_team} &middot;{" "}
                        {getStaffName(rec.recorded_by)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {openActions > 0 && (
                      <Badge className="text-xs bg-amber-100 text-amber-800">
                        {openActions} open action{openActions > 1 ? "s" : ""}
                      </Badge>
                    )}
                    <Badge
                      className={cn(
                        "text-xs",
                        rec.engagement_status === "closed_resolved"
                          ? "bg-green-100 text-green-800"
                          : rec.engagement_status === "following_up"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      )}
                    >
                      {statusLabel}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* topic / reason */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">
                        Topic / Reason
                      </p>
                      <p className="text-sm">{rec.topic_or_reason}</p>
                    </div>

                    {/* summary + our response */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Summary</p>
                        <p className="text-sm">{rec.summary}</p>
                      </div>
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Our Response</p>
                        <p className="text-sm">{rec.our_response}</p>
                      </div>
                    </div>

                    {/* documents shared */}
                    {rec.documents_shared.length > 0 && (
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          Documents Shared
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.documents_shared.map((doc, i) => (
                            <Badge
                              key={`${rec.id}-doc-${i}`}
                              className="bg-slate-100 text-[var(--cs-text-secondary)] text-xs font-normal"
                            >
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* actions agreed */}
                    {rec.actions_agreed.length > 0 && (
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1">
                          <ClipboardCheck className="h-3.5 w-3.5" />
                          Actions Agreed
                        </p>
                        <ul className="space-y-2">
                          {rec.actions_agreed.map((a, i) => {
                            const done = a.status === "Completed" || a.status === "Closed";
                            return (
                              <li
                                key={`${rec.id}-act-${i}`}
                                className={cn(
                                  "rounded border p-2 text-sm",
                                  done
                                    ? "bg-green-50 border-green-200"
                                    : "bg-amber-50 border-amber-200"
                                )}
                              >
                                <div className="flex items-start gap-2">
                                  {done ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <p className="font-medium">{a.action}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      Owner: {getStaffName(a.owner)} &middot; Due: {a.deadline}{" "}
                                      &middot; Status: {a.status}
                                    </p>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {/* feedback + reflection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-medium text-blue-700 mb-1 flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Inspector Feedback
                        </p>
                        <p className="text-sm">{rec.inspector_feedback}</p>
                      </div>
                      <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                        <p className="text-xs font-medium text-indigo-700 mb-1 flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          Our Reflection
                        </p>
                        <p className="text-sm">{rec.our_reflection}</p>
                      </div>
                    </div>

                    {/* footer details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Recorded by:</span>{" "}
                        {getStaffName(rec.recorded_by)}
                      </div>
                      <div>
                        <span className="font-medium">Next engagement:</span> {rec.next_engagement}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory note ────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              Quality Standard 13 — Leadership and Management
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3 text-muted-foreground">
            <p>
              The Children&apos;s Homes (England) Regulations 2015, Regulation 13 (the leadership
              and management standard), requires the registered person to lead and manage the home
              effectively and develop strong, transparent relationships with the regulator and
              other partners.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 border p-3">
                <p className="font-medium text-[var(--cs-navy)] mb-1">Why we keep this log</p>
                <ul className="space-y-1 text-xs">
                  <li>Demonstrates open, ongoing relationship with Ofsted between inspections</li>
                  <li>Provides an audit trail for every notification, call, email and visit</li>
                  <li>Captures actions agreed and tracks them through to closure</li>
                  <li>Feeds into Reg 45 reporting and inspection readiness work</li>
                  <li>Supports learning by recording our reflection on each engagement</li>
                </ul>
              </div>
              <div className="rounded-lg bg-slate-50 border p-3">
                <p className="font-medium text-[var(--cs-navy)] mb-1">What good practice looks like</p>
                <ul className="space-y-1 text-xs">
                  <li>Notify Ofsted on awareness of a Reg 40 event, not on confirmation</li>
                  <li>Confirm verbal exchanges (calls) in writing the same day</li>
                  <li>Share supporting documents proactively where they aid context</li>
                  <li>Record the inspector&apos;s feedback verbatim where possible</li>
                  <li>
                    Reflect honestly on what the engagement told us — including where we could have
                    done better
                  </li>
                  <li>Close the loop on every agreed action with evidence of completion</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <CareEventsPanel
        title="Care Events — Compliance Evidence"
        category="general"
        days={90}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Ofsted Engagement Log — inspector visits, monitoring visits, Reg 44 visits, Reg 45 reports, Ofsted correspondence, self-referrals, notifications, grade history, ILACS preparation"
        recordType="ofsted_evidence"
        className="mt-6"
      />
    </PageShell>
  );
}
