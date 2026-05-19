"use client";

import { useState, useMemo } from "react";
import {
  Award,
  Heart,
  PoundSterling,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  FileText,
  Calendar,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CharityGrantRecord,
  CharityGrantCategory,
  CharityGrantStatus,
} from "@/types/extended";
import {
  CHARITY_GRANT_CATEGORY_LABEL,
  CHARITY_GRANT_STATUS_LABEL,
} from "@/types/extended";
import { useCharityGrantRecords } from "@/hooks/use-charity-grant-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const STATUS_META: Record<CharityGrantStatus, { label: string; colour: string }> = {
  drafted: { label: "Drafted", colour: "bg-gray-100 text-gray-700" },
  submitted: { label: "Submitted", colour: "bg-blue-100 text-blue-700" },
  under_review: { label: "Under review", colour: "bg-indigo-100 text-indigo-700" },
  awarded: { label: "Awarded", colour: "bg-emerald-100 text-emerald-700" },
  declined: { label: "Declined", colour: "bg-red-100 text-red-700" },
  partial_award: { label: "Partial award", colour: "bg-amber-100 text-amber-700" },
  withdrawn: { label: "Withdrawn", colour: "bg-stone-100 text-stone-700" },
};

const CATEGORIES = Object.keys(CHARITY_GRANT_CATEGORY_LABEL) as CharityGrantCategory[];

const CATEGORY_COLOUR: Record<CharityGrantCategory, string> = {
  education: "bg-blue-100 text-blue-700",
  recreation_hobbies: "bg-amber-100 text-amber-800",
  therapy_wellbeing: "bg-teal-100 text-teal-800",
  sports_equipment: "bg-emerald-100 text-emerald-800",
  music_arts: "bg-purple-100 text-purple-700",
  driving_lessons: "bg-orange-100 text-orange-800",
  it_tech: "bg-slate-100 text-[var(--cs-text-secondary)]",
  travel_experience: "bg-sky-100 text-sky-800",
  family_support: "bg-rose-100 text-rose-700",
  other: "bg-gray-100 text-gray-700",
};

const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);

export default function ChildCharityGrantsApplicationsPage() {
  const { data: res, isLoading } = useCharityGrantRecords();
  const data = res?.data ?? [];
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("date");

  const stats = useMemo(() => {
    const yearStart = new Date();
    yearStart.setMonth(0, 1);
    const ytdAwarded = data
      .filter(
        (r) =>
          r.amount_awarded &&
          r.decision_date &&
          new Date(r.decision_date) >= yearStart
      )
      .reduce((s, r) => s + (r.amount_awarded ?? 0), 0);

    const open = data.filter((r) =>
      ["drafted", "submitted", "under_review"].includes(r.application_status)
    ).length;

    const charitiesUsed = new Set(data.map((r) => r.charity_name)).size;

    const pending = data.filter((r) =>
      ["submitted", "under_review"].includes(r.application_status)
    ).length;

    return { ytdAwarded, open, charitiesUsed, pending };
  }, [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (statusFilter !== "all")
      list = list.filter((r) => r.application_status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.child_id).toLowerCase().includes(q) ||
          r.charity_name.toLowerCase().includes(q) ||
          r.grant_purpose.toLowerCase().includes(q) ||
          CHARITY_GRANT_CATEGORY_LABEL[r.category].toLowerCase().includes(q) ||
          r.items_funded.some((i) => i.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return (b.amount_awarded ?? 0) - (a.amount_awarded ?? 0);
        case "yp":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "charity":
          return a.charity_name.localeCompare(b.charity_name);
        default:
          return b.application_date.localeCompare(a.application_date);
      }
    });
    return list;
  }, [data, statusFilter, search, sortBy]);

  const exportCols: ExportColumn<CharityGrantRecord>[] = [
    { header: "Young Person", accessor: (r: CharityGrantRecord) => getYPName(r.child_id) },
    { header: "Charity", accessor: (r: CharityGrantRecord) => r.charity_name },
    { header: "Category", accessor: (r: CharityGrantRecord) => CHARITY_GRANT_CATEGORY_LABEL[r.category] },
    { header: "Purpose", accessor: (r: CharityGrantRecord) => r.grant_purpose },
    {
      header: "Application Date",
      accessor: (r: CharityGrantRecord) => r.application_date,
    },
    {
      header: "Status",
      accessor: (r: CharityGrantRecord) => STATUS_META[r.application_status].label,
    },
    {
      header: "Amount Requested (GBP)",
      accessor: (r: CharityGrantRecord) => String(r.amount_requested),
    },
    {
      header: "Amount Awarded (GBP)",
      accessor: (r: CharityGrantRecord) =>
        r.amount_awarded != null ? String(r.amount_awarded) : "",
    },
    {
      header: "Decision Date",
      accessor: (r: CharityGrantRecord) => r.decision_date ?? "",
    },
    {
      header: "Items Funded",
      accessor: (r: CharityGrantRecord) => r.items_funded.join("; "),
    },
    {
      header: "Evidence Provided",
      accessor: (r: CharityGrantRecord) => r.evidence_provided_to_charity.join("; "),
    },
    {
      header: "Child Involved",
      accessor: (r: CharityGrantRecord) =>
        r.child_involved_in_application ? "Yes" : "No",
    },
    {
      header: "Acknowledgement Sent",
      accessor: (r: CharityGrantRecord) => (r.child_acknowledgement_sent ? "Yes" : "No"),
    },
    {
      header: "Follow-up Required",
      accessor: (r: CharityGrantRecord) => (r.follow_up_report_required ? "Yes" : "No"),
    },
    {
      header: "Follow-up Date",
      accessor: (r: CharityGrantRecord) => r.follow_up_report_date ?? "",
    },
    { header: "Child Voice", accessor: (r: CharityGrantRecord) => r.child_voice },
    {
      header: "Staff Observation",
      accessor: (r: CharityGrantRecord) => r.staff_observation,
    },
    { header: "Recorded By", accessor: (r: CharityGrantRecord) => getStaffName(r.recorded_by) },
    { header: "Recorded Date", accessor: (r: CharityGrantRecord) => r.recorded_date },
  ];

  if (isLoading) {
    return (
      <PageShell
        title="Charity Grants & Applications"
        subtitle="Per-child charity grant applications, decisions and items funded — Buttle UK, Family Fund, Coram Voice, Lift the Limit, Princess Royal Trust, BBC Children in Need"
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Charity Grants & Applications"
      subtitle="Per-child charity grant applications, decisions and items funded — Buttle UK, Family Fund, Coram Voice, Lift the Limit, Princess Royal Trust, BBC Children in Need"
      ariaContext={{ pageTitle: "Charity Grants & Applications", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            data={data}
            columns={exportCols}
            filename="charity-grants-applications"
          />
          <PrintButton title="Charity Grants & Applications" />
          <AriaStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              l: "Total Awarded YTD",
              v: gbp(stats.ytdAwarded),
              icon: PoundSterling,
              c: "text-amber-600",
            },
            {
              l: "Applications Open",
              v: stats.open,
              icon: FileText,
              c: "text-teal-600",
            },
            {
              l: "Charities Used",
              v: stats.charitiesUsed,
              icon: Heart,
              c: "text-rose-600",
            },
            {
              l: "Pending Decisions",
              v: stats.pending,
              icon: Calendar,
              c: "text-indigo-600",
            },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-lg border bg-white p-3 text-center"
            >
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search child, charity, purpose, item…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.keys(STATUS_META).map((k) => (
                <SelectItem key={k} value={k}>
                  {STATUS_META[k as CharityGrantStatus].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="date">Application Date</option>
              <option value="amount">Amount Awarded</option>
              <option value="yp">Young Person</option>
              <option value="charity">Charity</option>
            </select>
          </div>
        </div>

        {filtered.map((rec) => {
          const isOpen = expanded === rec.id;
          return (
            <div
              key={rec.id}
              className="rounded-lg border bg-white overflow-hidden"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : rec.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-amber-50/40"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-amber-100 p-2">
                    <Award className="h-5 w-5 text-amber-700" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{getYPName(rec.child_id)}</h3>
                      <span className="text-sm text-muted-foreground">
                        — {rec.charity_name}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_META[rec.application_status].colour
                        )}
                      >
                        {STATUS_META[rec.application_status].label}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          CATEGORY_COLOUR[rec.category]
                        )}
                      >
                        {CHARITY_GRANT_CATEGORY_LABEL[rec.category]}
                      </span>
                      {rec.amount_awarded != null && (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          Awarded {gbp(rec.amount_awarded)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Applied {rec.application_date} · Requested{" "}
                      {gbp(rec.amount_requested)}
                      {rec.decision_date
                        ? ` · Decision ${rec.decision_date}`
                        : ""}
                    </p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>

              {isOpen && (
                <div className="border-t p-4 space-y-4 bg-amber-50/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Charity:</span>{" "}
                      {rec.charity_name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>{" "}
                      {STATUS_META[rec.application_status].label}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Requested:</span>{" "}
                      {gbp(rec.amount_requested)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Awarded:</span>{" "}
                      {rec.amount_awarded != null
                        ? gbp(rec.amount_awarded)
                        : "—"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Applied:</span>{" "}
                      {rec.application_date}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Decision:</span>{" "}
                      {rec.decision_date ?? "Pending"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Recorded by:</span>{" "}
                      {getStaffName(rec.recorded_by)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Recorded:</span>{" "}
                      {rec.recorded_date}
                    </div>
                  </div>

                  <div className="rounded-lg bg-teal-50 border border-teal-200 p-3">
                    <h4 className="text-sm font-semibold text-teal-800 mb-1">
                      Grant Purpose
                    </h4>
                    <p className="text-sm text-teal-900">{rec.grant_purpose}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-white p-3">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                        <Award className="h-4 w-4 text-amber-600" /> Items
                        Funded
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {rec.items_funded.map((i, idx) => (
                          <li key={idx}>{i}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border bg-white p-3">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                        <FileText className="h-4 w-4 text-teal-600" /> Evidence
                        Provided to Charity
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {rec.evidence_provided_to_charity.map((i, idx) => (
                          <li key={idx}>{i}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-md border bg-white p-2">
                      <p className="text-xs text-muted-foreground">
                        Child involved
                      </p>
                      <p className="font-medium">
                        {rec.child_involved_in_application ? "Yes" : "No"}
                      </p>
                    </div>
                    <div className="rounded-md border bg-white p-2">
                      <p className="text-xs text-muted-foreground">
                        Acknowledgement sent
                      </p>
                      <p className="font-medium">
                        {rec.child_acknowledgement_sent ? "Yes" : "Not yet"}
                      </p>
                    </div>
                    <div className="rounded-md border bg-white p-2">
                      <p className="text-xs text-muted-foreground">
                        Follow-up required
                      </p>
                      <p className="font-medium">
                        {rec.follow_up_report_required ? "Yes" : "No"}
                      </p>
                    </div>
                    <div className="rounded-md border bg-white p-2">
                      <p className="text-xs text-muted-foreground">
                        Follow-up date
                      </p>
                      <p className="font-medium">
                        {rec.follow_up_report_date ?? "—"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                    <h4 className="text-sm font-semibold text-pink-800 mb-1 flex items-center gap-1">
                      <Heart className="h-4 w-4" /> Child&apos;s Voice
                    </h4>
                    <p className="text-sm text-pink-900 italic">
                      &ldquo;{rec.child_voice}&rdquo;
                    </p>
                  </div>

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-sm font-semibold text-amber-900 mb-1">
                      Staff Observation
                    </h4>
                    <p className="text-sm text-amber-950">
                      {rec.staff_observation}
                    </p>
                  </div>

                  <SmartLinkPanel sourceType="charity-grant-record" sourceId={rec.id} childId={rec.child_id} compact />
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-muted-foreground">
            No grant applications match the current filters.
          </div>
        )}

        <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>
            Why this matters — beyond statutory budgets
          </strong>{" "}
          — Charity grants from Buttle UK, Family Fund, Coram Voice, Lift the
          Limit, Princess Royal Trust and BBC Children in Need beneficiary
          funds are often the difference between a looked-after child surviving
          and thriving. They unlock the boots, the laptop, the workshop, the
          weighted blanket — the everyday things that build identity,
          confidence and a sense of being valued.
        </div>

        <div className="rounded-lg border-l-4 border-teal-500 bg-teal-50 p-4 text-sm text-teal-900">
          <strong>
            Regulatory framework — Care Leavers (England) Regs 2010
          </strong>{" "}
          (Pathway Plan funding supplements) · DfE Statutory Guidance for the
          Care of Looked-After Children · Children&apos;s Homes (England)
          Regulations 2015 — Quality Standard 5 (Education and learning),
          Quality Standard 6 (Enjoyment and achievement) and Quality Standard
          10 (Care planning). Charity grant applications must be evidenced,
          child-involved where possible and outcomes followed up in the
          Pathway / Placement Plan.
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Finance"
        category="finance"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Charity Grants & Applications — grant funding, charitable awards, activity funding, uniform grants, holiday grants, hobbies, vocational, application tracking, outcomes, thank you letters"
        recordType="direct_work"
        className="mt-6"
      />
    </PageShell>
  );
}
