"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Brain,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HeartHandshake,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type {
  CamhsPathway,
  CamhsUrgency,
  CamhsReferralStatus,
  CamhsEngagementLevel,
  CamhsReferral,
} from "@/types/extended";
import { useCamhsReferrals } from "@/hooks/use-camhs-referrals";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── label maps ───────────────────────────────────────────────────────── */

const PATHWAY_LABEL: Record<CamhsPathway, string> = {
  standard_camhs: "Standard CAMHS",
  asd_neurodevelopmental: "ASD/Neurodevelopmental",
  trauma_focused: "Trauma-focused",
  crisis: "Crisis",
  routine: "Routine",
};

const URGENCY_LABEL: Record<CamhsUrgency, string> = {
  routine: "Routine",
  soon: "Soon",
  urgent: "Urgent",
  emergency: "Emergency",
};

const REFERRAL_STATUS_LABEL: Record<CamhsReferralStatus, string> = {
  submitted: "Submitted",
  triaged: "Triaged",
  on_waiting_list: "On waiting list",
  active_engagement: "Active engagement",
  discharged: "Discharged",
  re_referred: "Re-referred",
};

const ENGAGEMENT_LABEL: Record<CamhsEngagementLevel, string> = {
  strong: "Strong",
  building: "Building",
  inconsistent: "Inconsistent",
  disengaged: "Disengaged",
};

/* ── constants ─────────────────────────────────────────────────────────── */

const PATHWAYS: CamhsPathway[] = ["standard_camhs", "asd_neurodevelopmental", "trauma_focused", "crisis", "routine"];
const URGENCIES: CamhsUrgency[] = ["routine", "soon", "urgent", "emergency"];
const STATUSES: CamhsReferralStatus[] = ["submitted", "triaged", "on_waiting_list", "active_engagement", "discharged", "re_referred"];

const STATUS_META: Record<CamhsReferralStatus, { colour: string }> = {
  submitted:          { colour: "bg-blue-100 text-blue-700" },
  triaged:            { colour: "bg-indigo-100 text-indigo-700" },
  on_waiting_list:    { colour: "bg-amber-100 text-amber-700" },
  active_engagement:  { colour: "bg-green-100 text-green-700" },
  discharged:         { colour: "bg-gray-100 text-gray-700" },
  re_referred:        { colour: "bg-purple-100 text-purple-700" },
};

const URGENCY_META: Record<CamhsUrgency, { colour: string }> = {
  routine:   { colour: "bg-gray-100 text-gray-700" },
  soon:      { colour: "bg-blue-100 text-blue-700" },
  urgent:    { colour: "bg-amber-100 text-amber-700" },
  emergency: { colour: "bg-red-100 text-red-700" },
};

const ENGAGEMENT_META: Record<CamhsEngagementLevel, { colour: string }> = {
  strong:       { colour: "bg-green-100 text-green-700" },
  building:     { colour: "bg-blue-100 text-blue-700" },
  inconsistent: { colour: "bg-amber-100 text-amber-700" },
  disengaged:   { colour: "bg-red-100 text-red-700" },
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function CamhsReferralTrackerPage() {
  const { data: crData, isLoading } = useCamhsReferrals();
  const data = crData?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPathway, setFilterPathway] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const stats = useMemo(() => {
    const active = data.filter((r) => r.referral_status === "active_engagement").length;
    const waiting = data.filter((r) => r.referral_status === "on_waiting_list" || r.referral_status === "triaged" || r.referral_status === "submitted").length;
    const discharged = data.filter((r) => r.referral_status === "discharged").length;
    const waitsCounted = data.filter((r) => r.waiting_time_weeks > 0);
    const avgWait = waitsCounted.length
      ? Math.round(waitsCounted.reduce((s, r) => s + r.waiting_time_weeks, 0) / waitsCounted.length)
      : 0;
    return { active, waiting, avgWait, discharged };
  }, [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterStatus !== "all") list = list.filter((r) => r.referral_status === filterStatus);
    if (filterPathway !== "all") list = list.filter((r) => r.pathway_applied === filterPathway);
    if (filterYP !== "all") list = list.filter((r) => r.child_id === filterYP);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.referral_reason.toLowerCase().includes(q) ||
        r.current_clinician.toLowerCase().includes(q) ||
        r.referral_outcome.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "urgency": return URGENCIES.indexOf(b.urgency) - URGENCIES.indexOf(a.urgency);
        case "wait":    return b.waiting_time_weeks - a.waiting_time_weeks;
        case "yp":      return a.child_id.localeCompare(b.child_id);
        case "review":  return a.next_review_date.localeCompare(b.next_review_date);
        default:        return b.referral_date.localeCompare(a.referral_date);
      }
    });
    return list;
  }, [data, filterStatus, filterPathway, filterYP, search, sortBy]);

  const exportCols: ExportColumn<CamhsReferral>[] = [
    { header: "Young Person",           accessor: (r: CamhsReferral) => getYPName(r.child_id) },
    { header: "Referral Date",          accessor: (r: CamhsReferral) => r.referral_date },
    { header: "Referrer",               accessor: (r: CamhsReferral) => getStaffName(r.referrer) },
    { header: "Reason",                 accessor: (r: CamhsReferral) => r.referral_reason },
    { header: "Pathway",                accessor: (r: CamhsReferral) => PATHWAY_LABEL[r.pathway_applied] },
    { header: "Urgency",                accessor: (r: CamhsReferral) => URGENCY_LABEL[r.urgency] },
    { header: "Status",                 accessor: (r: CamhsReferral) => REFERRAL_STATUS_LABEL[r.referral_status] },
    { header: "Wait (weeks)",           accessor: (r: CamhsReferral) => String(r.waiting_time_weeks) },
    { header: "First Appointment",      accessor: (r: CamhsReferral) => r.first_appointment_date || "—" },
    { header: "Clinician",              accessor: (r: CamhsReferral) => r.current_clinician },
    { header: "Approach",               accessor: (r: CamhsReferral) => r.current_therapeutic_approach },
    { header: "Sessions Held",          accessor: (r: CamhsReferral) => String(r.sessions_held) },
    { header: "Sessions Scheduled",     accessor: (r: CamhsReferral) => String(r.sessions_scheduled) },
    { header: "Engagement",             accessor: (r: CamhsReferral) => ENGAGEMENT_LABEL[r.current_engagement_level] },
    { header: "Child's View",           accessor: (r: CamhsReferral) => r.child_view },
    { header: "Parental Consent",       accessor: (r: CamhsReferral) => r.parental_consent ? "Yes" : "No" },
    { header: "Outcome",                accessor: (r: CamhsReferral) => r.referral_outcome },
    { header: "Reviewed",               accessor: (r: CamhsReferral) => r.reviewed_date },
    { header: "Next Review",            accessor: (r: CamhsReferral) => r.next_review_date },
    { header: "Escalation Options",     accessor: (r: CamhsReferral) => r.escalation_options },
  ];

  const ypIds = [...new Set(data.map((r) => r.child_id))];

  if (isLoading) {
    return (
      <PageShell title="CAMHS Referral Tracker" subtitle="Quality Standard 7 (Health) — CAMHS referrals from initial concern to ongoing engagement">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="CAMHS Referral Tracker"
      subtitle="Quality Standard 7 (Health) — CAMHS referrals from initial concern to ongoing engagement"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="camhs-referrals" />
          <PrintButton title="CAMHS Referral Tracker" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Active Engagements", v: stats.active,     icon: HeartHandshake, c: "text-green-600" },
            { l: "On Waiting List",    v: stats.waiting,    icon: Clock,          c: "text-amber-600" },
            { l: "Avg Wait (weeks)",   v: stats.avgWait,    icon: AlertTriangle,  c: "text-red-600" },
            { l: "Discharged",         v: stats.discharged, icon: CheckCircle2,   c: "text-gray-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reason, clinician, outcome…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{REFERRAL_STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPathway} onValueChange={setFilterPathway}>
            <SelectTrigger className="w-[210px]"><SelectValue placeholder="Pathway" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pathways</SelectItem>
              {PATHWAYS.map((p) => <SelectItem key={p} value={p}>{PATHWAY_LABEL[p]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Young Person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {ypIds.map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="date">Referral Date</option>
              <option value="urgency">Urgency</option>
              <option value="wait">Wait Time</option>
              <option value="review">Next Review</option>
              <option value="yp">Young Person</option>
            </select>
          </div>
        </div>

        {filtered.map((rec) => (
          <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-brand" />
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{getYPName(rec.child_id)}</h3>
                    <span className="text-sm text-muted-foreground">— {PATHWAY_LABEL[rec.pathway_applied]}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[rec.referral_status].colour)}>
                      {REFERRAL_STATUS_LABEL[rec.referral_status]}
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", URGENCY_META[rec.urgency].colour)}>
                      {URGENCY_LABEL[rec.urgency]}
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ENGAGEMENT_META[rec.current_engagement_level].colour)}>
                      Engagement: {ENGAGEMENT_LABEL[rec.current_engagement_level]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Referred {rec.referral_date} by {getStaffName(rec.referrer)} · Wait {rec.waiting_time_weeks}w · {rec.sessions_held} sessions held
                  </p>
                </div>
              </div>
              {expandedId === rec.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expandedId === rec.id && (
              <div className="border-t p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Referral Date:</span> {rec.referral_date}</div>
                  <div><span className="text-muted-foreground">First Appointment:</span> {rec.first_appointment_date || "—"}</div>
                  <div><span className="text-muted-foreground">Wait:</span> {rec.waiting_time_weeks} weeks</div>
                  <div><span className="text-muted-foreground">Parental Consent:</span> {rec.parental_consent ? "Yes" : "No"}</div>
                  <div><span className="text-muted-foreground">Sessions Held:</span> {rec.sessions_held}</div>
                  <div><span className="text-muted-foreground">Sessions Scheduled:</span> {rec.sessions_scheduled}</div>
                  <div><span className="text-muted-foreground">Last Reviewed:</span> {rec.reviewed_date}</div>
                  <div><span className="text-muted-foreground">Next Review:</span> {rec.next_review_date}</div>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <h4 className="text-sm font-semibold mb-1">Referral Reason</h4>
                  <p className="text-sm text-muted-foreground">{rec.referral_reason}</p>
                </div>

                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Current Clinician &amp; Approach</h4>
                  <p className="text-sm text-blue-900 font-medium">{rec.current_clinician}</p>
                  <p className="text-sm text-blue-900 mt-1">{rec.current_therapeutic_approach}</p>
                </div>

                <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                  <h4 className="text-sm font-semibold text-pink-800 mb-1">Child&apos;s View</h4>
                  <p className="text-sm text-pink-900 italic">&ldquo;{rec.child_view}&rdquo;</p>
                </div>

                <div className="rounded-lg bg-green-50 p-3">
                  <h4 className="text-sm font-semibold text-green-800 mb-1">Outcome &amp; Treatment Plan</h4>
                  <p className="text-sm text-green-900">{rec.referral_outcome}</p>
                </div>

                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <h4 className="text-sm font-semibold text-amber-800 mb-1">Escalation Options</h4>
                  <p className="text-sm text-amber-900">{rec.escalation_options}</p>
                </div>

                <SmartLinkPanel sourceType="camhs_referral" sourceId={rec.id} childId={rec.child_id} compact />
              </div>
            )}
          </div>
        ))}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Quality Standard 7 (Health) &amp; Working Together 2023</strong> — Children must be supported to access timely health care, including specialist mental health services. CAMHS referrals must be tracked from initial concern through triage, waiting period, first appointment and ongoing engagement. Where waits are long, the home must agree interim support and clearly documented escalation options. The child&apos;s view of the referral and intervention must be recorded and revisited at every review.
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
