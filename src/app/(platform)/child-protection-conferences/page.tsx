"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn, formatDate } from "@/lib/utils";
import type { CpConferenceRecord } from "@/types/extended";
import {
  CP_CONFERENCE_TYPE_LABEL,
  CP_CONFERENCE_OUTCOME_LABEL,
  CP_CATEGORY_LABEL,
} from "@/types/extended";
import { useCpConferences } from "@/hooks/use-cp-conferences";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Shield,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Users,
  FileText,
  Clock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

// ── config ──────────────────────────────────────────────────────────────────
const outcomeColour: Record<string, string> = {
  subject_to_cp_plan: "bg-[--cs-risk-bg] text-[--cs-risk]",
  plan_continued: "bg-[--cs-warning-bg] text-[--cs-warning]",
  plan_stepped_down: "bg-[--cs-info-bg] text-[--cs-info]",
  no_cp_plan_required: "bg-[--cs-success-bg] text-[--cs-success]",
  strategy_decision_made: "bg-purple-100 text-purple-800",
};

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<CpConferenceRecord>[] = [
  { header: "Young Person", accessor: (r: CpConferenceRecord) => getYPName(r.child_id) },
  { header: "Type", accessor: (r: CpConferenceRecord) => CP_CONFERENCE_TYPE_LABEL[r.conference_type] },
  { header: "Date", accessor: (r: CpConferenceRecord) => r.date },
  { header: "Outcome", accessor: (r: CpConferenceRecord) => CP_CONFERENCE_OUTCOME_LABEL[r.outcome] },
  { header: "Category", accessor: (r: CpConferenceRecord) => CP_CATEGORY_LABEL[r.category] },
  { header: "Chair", accessor: (r: CpConferenceRecord) => r.chairperson },
  { header: "Home Rep", accessor: (r: CpConferenceRecord) => r.attended_by.map((s) => getStaffName(s)).join(", ") },
  { header: "Child Attended", accessor: (r: CpConferenceRecord) => r.child_attended ? "Yes" : "No" },
  { header: "Next Review", accessor: (r: CpConferenceRecord) => r.next_review_date },
];

// ── component ───────────────────────────────────────────────────────────────
export default function ChildProtectionConferencesPage() {
  const { data: res, isLoading } = useCpConferences();
  const items = res?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const childOptions = useMemo(() => {
    const ids = Array.from(new Set(items.map((c) => c.child_id)));
    return ids.map((id) => ({ id, name: getYPName(id) }));
  }, [items]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (filterYP !== "all") list = list.filter((c) => c.child_id === filterYP);
    if (filterType !== "all") list = list.filter((c) => c.conference_type === filterType);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "next-review":
          return a.next_review_date.localeCompare(b.next_review_date);
        case "child":
          return a.child_id.localeCompare(b.child_id);
        default:
          return 0;
      }
    });
    return list;
  }, [items, filterYP, filterType, sortBy]);

  if (isLoading) {
    return (
      <PageShell title="Child Protection Conferences" subtitle="Loading…">
        <div />
      </PageShell>
    );
  }

  // ── stats ─────────────────────────────────────────────────────────────────
  const onCpPlan = items.filter((c) => c.outcome === "subject_to_cp_plan" || c.outcome === "plan_continued").length;
  const childrenAttended = items.filter((c) => c.child_attended).length;
  const followUpPending = items.filter((c) => !c.follow_up_complete).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const in60d = new Date();
  in60d.setDate(in60d.getDate() + 60);
  const in60dStr = in60d.toISOString().slice(0, 10);
  const upcomingReviews = items.filter((c) => c.next_review_date >= todayStr && c.next_review_date <= in60dStr).length;

  return (
    <PageShell
      title="Child Protection Conferences"
      subtitle="Statutory conference attendance, decisions, and follow-up — multi-agency safeguarding records"
      caraContext={{ pageTitle: "Child Protection Conferences", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={items} columns={exportCols} filename="cp-conferences" />
          <PrintButton title="Child Protection Conferences" />
          <CaraStudioQuickActionButton context={{ record_type: "safeguarding", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{items.length}</p>
          <p className="text-xs text-muted-foreground">Total Conferences</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[--cs-risk]">{onCpPlan}</p>
          <p className="text-xs text-muted-foreground">On CP Plan</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{upcomingReviews}</p>
          <p className="text-xs text-muted-foreground">Reviews Next 60 Days</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{childrenAttended}/{items.length}</p>
          <p className="text-xs text-muted-foreground">Children Attended</p>
        </div>
      </div>

      {/* ── alert banner ───────────────────────────────────────────────── */}
      {followUpPending > 0 && (
        <div className="rounded-lg bg-[--cs-warning-bg] border border-[--cs-warning-soft] p-3 mb-6 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-[--cs-warning] mt-0.5 shrink-0" />
          <p className="text-sm text-[--cs-warning]">
            <strong>{followUpPending} conference{followUpPending !== 1 ? "s" : ""}</strong> with outstanding follow-up actions. Review action tracker.
          </p>
        </div>
      )}

      {/* ── filters/sort ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {childOptions.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(CP_CONFERENCE_TYPE_LABEL).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="next-review">Next Review</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── conference cards ───────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No conferences match your filters.</div>
        )}
        {filtered.map((conf) => {
          const isExpanded = expandedId === conf.id;

          return (
            <div key={conf.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : conf.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Shield className="h-5 w-5 text-red-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{CP_CONFERENCE_TYPE_LABEL[conf.conference_type]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(conf.date)} &middot; {getYPName(conf.child_id)} &middot; Chair: {conf.chairperson.split(" — ")[0]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", outcomeColour[conf.outcome])}>
                    {CP_CONFERENCE_OUTCOME_LABEL[conf.outcome]}
                  </span>
                  {conf.follow_up_complete ? (
                    <CheckCircle className="h-4 w-4 text-[--cs-success]" />
                  ) : (
                    <Clock className="h-4 w-4 text-[--cs-warning]" />
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* attendance summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Home Representation</p>
                      <p className="text-sm">{conf.home_representation}</p>
                      <p className="text-xs text-muted-foreground mt-1">By: {conf.attended_by.map((s) => getStaffName(s)).join(", ")}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Child Participation</p>
                      <p className="text-sm">{conf.child_attended ? "Child attended" : "Child did not attend"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{conf.child_contribution}</p>
                    </div>
                  </div>

                  {/* agencies */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Users className="h-3 w-3 inline mr-1" />Agencies Present ({conf.agencies_present.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {conf.agencies_present.map((a, i) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{a}</span>
                      ))}
                    </div>
                  </div>

                  {/* concerns vs protective */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-[--cs-warning-bg] rounded-lg p-3">
                      <p className="text-xs font-semibold text-[--cs-warning] uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Key Concerns
                      </p>
                      <ul className="space-y-1">
                        {conf.key_concerns.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-[--cs-warning] mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-[--cs-success-bg] rounded-lg p-3">
                      <p className="text-xs font-semibold text-[--cs-success] uppercase tracking-wide mb-1">
                        <Shield className="h-3 w-3 inline mr-1" />Protective Factors
                      </p>
                      <ul className="space-y-1">
                        {conf.protective_factors.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-[--cs-success] mt-0.5">•</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* decisions */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <FileText className="h-3 w-3 inline mr-1" />Decisions Agreed
                    </p>
                    <ul className="space-y-1">
                      {conf.decisions_agreed.map((dec, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-[--cs-info] mt-1 shrink-0" />
                          {dec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* actions */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">CP Plan Actions</p>
                    <div className="space-y-1">
                      {conf.cp_plan_actions.map((act, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-start justify-between gap-2">
                          <span>{act.action}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {act.owner.split(" (")[0]} &middot; {formatDate(act.deadline)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* metadata */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Calendar className="h-3 w-3 inline mr-1" />Next review: {formatDate(conf.next_review_date)}</span>
                    <span>Report submitted: {formatDate(conf.report_submitted_date)}</span>
                    <span>Author: {getStaffName(conf.report_author)}</span>
                    <span>Category: {CP_CATEGORY_LABEL[conf.category]}</span>
                  </div>

                  {/* smart links */}
                  <SmartLinkPanel sourceType="cp-conferences" sourceId={conf.id} childId={conf.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Child protection conference records support Working Together to
          Safeguard Children 2023, Children Act 1989 (Section 47), and Quality Standard 5 (protection of children).
          The home submits comprehensive reports to all conferences and represents children where appropriate.
          Children&apos;s wishes and feelings are always central to conference decisions per the Lundy model of
          participation.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Safeguarding"
        category="safeguarding"
        days={90}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Child Protection Conferences — initial CP conferences, review conferences, CP plan, CP category, conference chair, attendees, plans agreed, looked-after child safeguarding"
        recordType="safeguarding"
        className="mt-6"
      />
    </PageShell>
  );
}
