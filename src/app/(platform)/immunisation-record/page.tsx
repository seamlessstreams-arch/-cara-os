"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  ArrowUpDown, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Syringe, Shield, Calendar, BookOpen, Stethoscope, ClipboardList,
  MessageSquare, FileText, ShieldAlert, ShieldCheck, Activity, Loader2,
} from "lucide-react";
import type { ImmunisationRecord, VaccineStatus } from "@/types/extended";
import { VACCINE_STATUS_LABEL } from "@/types/extended";
import { useImmunisationRecords } from "@/hooks/use-immunisation-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";

const STATUS_COLOUR: Record<VaccineStatus, string> = {
  up_to_date:          "bg-green-100 text-green-700",
  due_now:             "bg-amber-100 text-amber-700",
  overdue:             "bg-red-100 text-red-700",
  caught_up_after_gap: "bg-blue-100 text-blue-700",
  refused:             "bg-orange-100 text-orange-700",
  medically_exempt:    "bg-purple-100 text-purple-700",
};

export default function ImmunisationRecordPage() {
  const { data: raw, isLoading } = useImmunisationRecords();
  const records = useMemo(() => raw?.data ?? [], [raw]);
  const [ypFilter, setYpFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <PageShell title="Immunisation Record" subtitle="Loading…">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </PageShell>
    );
  }

  const filtered = useMemo(() => {
    let list = [...records];
    if (ypFilter !== "all") list = list.filter(r => r.child_id === ypFilter);
    if (statusFilter !== "all") {
      list = list.filter(r => r.records.some(v => v.status === statusFilter));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "name":     return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "review":   return b.review_date.localeCompare(a.review_date);
        case "updated":  return b.last_update.localeCompare(a.last_update);
        case "due": {
          const ad = a.upcoming_due_within_90_days[0]?.due_date ?? "9999-12-31";
          const bd = b.upcoming_due_within_90_days[0]?.due_date ?? "9999-12-31";
          return ad.localeCompare(bd);
        }
        default: return 0;
      }
    });
    return list;
  }, [records, ypFilter, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const upToDate = records.filter(r =>
      r.records.every(v =>
        v.status === "up_to_date" ||
        v.status === "caught_up_after_gap" ||
        v.status === "medically_exempt" ||
        v.status === "refused"
      )
    ).length;

    const dueWithin90 = records.reduce((acc, r) => acc + r.upcoming_due_within_90_days.length, 0);

    const refusalsHandled = records.filter(r =>
      r.records.some(v => v.status === "refused") && r.child_informed_and_consent
    ).length;

    const totalDoses = records.reduce((acc, r) => acc + r.records.length, 0);
    const completedDoses = records.reduce(
      (acc, r) => acc + r.records.filter(v =>
        v.status === "up_to_date" ||
        v.status === "caught_up_after_gap" ||
        v.status === "medically_exempt"
      ).length,
      0,
    );
    const compliance = totalDoses === 0 ? 0 : Math.round((completedDoses / totalDoses) * 100);

    return { upToDate, dueWithin90, refusalsHandled, compliance };
  }, [records]);

  const overdueChildren = useMemo(
    () => records.filter(r => r.records.some(v => v.status === "overdue")),
    [records]
  );

  const exportCols: ExportColumn<ImmunisationRecord>[] = [
    { header: "ID",                          accessor: (r) => r.id },
    { header: "Young Person",                accessor: (r) => getYPName(r.child_id) },
    { header: "GP Registration",             accessor: (r) => r.gp_registration },
    { header: "Red Book Held",               accessor: (r) => r.red_book_held ? "Yes" : "No" },
    { header: "Vaccines",                    accessor: (r) => r.records.map(v => `${v.vaccine} | ${v.age_due} | ${v.date_given || "—"} | ${v.batch_number || "—"} | ${v.brand || "—"} | ${VACCINE_STATUS_LABEL[v.status]}`).join("  ||  ") },
    { header: "Side Effects Observed",       accessor: (r) => r.records.filter(v => v.side_effects_observed).map(v => `${v.vaccine}: ${v.side_effects}`).join(" | ") },
    { header: "Missed At Age (historic)",    accessor: (r) => r.missed_at_age.join(" | ") },
    { header: "Caught Up During Placement",  accessor: (r) => r.caught_up_during_placement.join(" | ") },
    { header: "Upcoming (90 days)",          accessor: (r) => r.upcoming_due_within_90_days.map(u => `${u.vaccine} due ${u.due_date} (${u.scheduled ? "scheduled" : "to schedule"})`).join(" | ") },
    { header: "Child Attitude",              accessor: (r) => r.child_attitude },
    { header: "Child Informed & Consent",    accessor: (r) => r.child_informed_and_consent ? "Yes" : "No" },
    { header: "GP Reviewed Schedule",        accessor: (r) => r.gp_reviewed_schedule ? "Yes" : "No" },
    { header: "Review Date",                 accessor: (r) => r.review_date },
    { header: "Last Update",                 accessor: (r) => r.last_update },
  ];

  return (
    <PageShell
      title="Immunisation Record"
      subtitle="UK schedule tracking · Vaccine history · Side effects · Catch-up programmes · Child voice"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Immunisation Record" />
          <ExportButton data={filtered} columns={exportCols} filename="immunisation-record" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Children up to date",              value: `${stats.upToDate}/${records.length}`, icon: ShieldCheck, c: "text-green-600"  },
          { label: "Doses due within 90 days",         value: stats.dueWithin90,                     icon: Calendar,    c: "text-amber-600"  },
          { label: "Children with refusals (handled)", value: stats.refusalsHandled,                 icon: ShieldAlert, c: "text-orange-600" },
          { label: "Schedule compliance",              value: `${stats.compliance}%`,                icon: Activity,    c: "text-blue-600"   },
        ].map(s => (
          <div key={s.label} className="rounded-lg border bg-card p-3 flex items-center gap-3">
            <s.icon className={cn("h-5 w-5", s.c)} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {overdueChildren.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 mb-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800 dark:text-red-300">
            <p className="font-semibold">
              {overdueChildren.length} child{overdueChildren.length !== 1 ? "ren have" : " has"} overdue immunisations
            </p>
            <p className="text-xs mt-0.5">
              Liaise with GP and Looked-After Children health team to arrange catch-up appointments.
            </p>
          </div>
        </div>
      )}

      {stats.dueWithin90 > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3 mb-6 flex items-start gap-3">
          <Calendar className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold">
              {stats.dueWithin90} dose{stats.dueWithin90 !== 1 ? "s" : ""} due within the next 90 days
            </p>
            <p className="text-xs mt-0.5">
              Confirm appointments are booked. Update placement diary and inform key worker.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select value={ypFilter} onValueChange={setYpFilter}>
          <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Young person" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All young people</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] h-9"><SelectValue placeholder="Vaccine status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STATUS_COLOUR) as VaccineStatus[]).map(s => (
              <SelectItem key={s} value={s}>{VACCINE_STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Child name (A-Z)</SelectItem>
              <SelectItem value="review">Most recently reviewed</SelectItem>
              <SelectItem value="updated">Most recently updated</SelectItem>
              <SelectItem value="due">Earliest dose due</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        {(ypFilter !== "all" || statusFilter !== "all") && " (filtered)"}
      </p>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Syringe className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No immunisation records match the current filters</p>
          </div>
        )}

        {filtered.map(r => {
          const isOpen = expandedId === r.id;
          const hasOverdue = r.records.some(v => v.status === "overdue");
          const hasRefusal = r.records.some(v => v.status === "refused");
          const hasCatchup = r.caught_up_during_placement.length > 0 || r.records.some(v => v.status === "caught_up_after_gap");
          const upcomingCount = r.upcoming_due_within_90_days.length;
          const totalDoses = r.records.length;
          const completed = r.records.filter(v =>
            v.status === "up_to_date" ||
            v.status === "caught_up_after_gap" ||
            v.status === "medically_exempt"
          ).length;

          return (
            <div
              key={r.id}
              className={cn(
                "rounded-lg border bg-card overflow-hidden",
                hasOverdue ? "border-l-4 border-l-red-400"
                  : hasCatchup ? "border-l-4 border-l-blue-400"
                  : "border-l-4 border-l-green-400",
              )}
            >
              <button
                onClick={() => setExpandedId(isOpen ? null : r.id)}
                className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="rounded-full p-1.5 shrink-0 bg-blue-100 text-blue-700">
                  <Syringe className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{getYPName(r.child_id)}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-foreground/80">
                      {completed}/{totalDoses} doses logged
                    </span>
                    {hasOverdue && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                        <AlertTriangle className="h-3 w-3" /> Overdue
                      </span>
                    )}
                    {hasCatchup && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                        <Stethoscope className="h-3 w-3" /> Catch-up programme
                      </span>
                    )}
                    {hasRefusal && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
                        <ShieldAlert className="h-3 w-3" /> Refusal logged
                      </span>
                    )}
                    {upcomingCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
                        <Calendar className="h-3 w-3" /> {upcomingCount} due ≤90d
                      </span>
                    )}
                    {r.red_book_held && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">
                        <BookOpen className="h-3 w-3" /> Red Book held
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.gp_registration} · GP review {r.review_date} · Updated {r.last_update}
                  </p>
                </div>

                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 shrink-0 mt-1" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-4 bg-muted/30">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">GP registration</p>
                      <p className="font-medium">{r.gp_registration}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Red Book held</p>
                      <p className="font-medium">{r.red_book_held ? "Yes" : "No — copy of record obtained from GP"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">GP-reviewed schedule</p>
                      <p className="font-medium">{r.gp_reviewed_schedule ? "Yes" : "No"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last GP review</p>
                      <p className="font-medium">{r.review_date}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                      <Syringe className="h-3.5 w-3.5" /> UK schedule — vaccine history
                    </p>
                    <div className="rounded border bg-card overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50 text-left">
                          <tr>
                            <th className="px-2 py-1.5 font-medium">Vaccine</th>
                            <th className="px-2 py-1.5 font-medium">Age due</th>
                            <th className="px-2 py-1.5 font-medium">Date given</th>
                            <th className="px-2 py-1.5 font-medium">Brand</th>
                            <th className="px-2 py-1.5 font-medium">Batch</th>
                            <th className="px-2 py-1.5 font-medium">Site</th>
                            <th className="px-2 py-1.5 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.records.map((v, i) => (
                            <tr key={i} className="border-t align-top">
                              <td className="px-2 py-1.5 font-medium">{v.vaccine}</td>
                              <td className="px-2 py-1.5 text-muted-foreground">{v.age_due}</td>
                              <td className="px-2 py-1.5">{v.date_given || "—"}</td>
                              <td className="px-2 py-1.5">{v.brand || "—"}</td>
                              <td className="px-2 py-1.5">{v.batch_number || "—"}</td>
                              <td className="px-2 py-1.5">{v.location || "—"}</td>
                              <td className="px-2 py-1.5">
                                <span className={cn("px-2 py-0.5 rounded-full text-[11px]", STATUS_COLOUR[v.status])}>
                                  {VACCINE_STATUS_LABEL[v.status]}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {r.records.some(v => v.side_effects_observed) && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Side effects observed</p>
                      <ul className="text-sm space-y-1 list-disc pl-5">
                        {r.records.filter(v => v.side_effects_observed).map((v, i) => (
                          <li key={i}>
                            <span className="font-medium">{v.vaccine}</span> — {v.side_effects}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {r.missed_at_age.length > 0 && (
                    <div className="rounded border border-amber-200 bg-amber-50/50 p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase mb-1 flex items-center gap-1">
                        <ClipboardList className="h-3.5 w-3.5" /> Historic gaps (pre-placement)
                      </p>
                      <ul className="text-sm space-y-1 list-disc pl-5 text-amber-900">
                        {r.missed_at_age.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>
                  )}

                  {r.caught_up_during_placement.length > 0 && (
                    <div className="rounded border border-blue-200 bg-blue-50/50 p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase mb-1 flex items-center gap-1">
                        <Stethoscope className="h-3.5 w-3.5" /> Caught up during placement
                      </p>
                      <ul className="text-sm space-y-1 list-disc pl-5 text-blue-900">
                        {r.caught_up_during_placement.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}

                  {r.upcoming_due_within_90_days.length > 0 && (
                    <div className="rounded border bg-card p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Upcoming doses (next 90 days)
                      </p>
                      <ul className="text-sm space-y-1.5">
                        {r.upcoming_due_within_90_days.map((u, i) => (
                          <li key={i} className="flex items-center justify-between gap-2 rounded border bg-muted/30 px-2 py-1.5">
                            <span><span className="font-medium">{u.vaccine}</span> — due {u.due_date}</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-xs",
                              u.scheduled ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
                            )}>
                              {u.scheduled ? "Appointment booked" : "Needs booking"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="rounded border bg-card p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> Child&apos;s voice and consent
                    </p>
                    <p className="text-sm">{r.child_attitude}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="flex items-center gap-1">
                        {r.child_informed_and_consent
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          : <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                        Informed and giving consent: <span className="font-medium">{r.child_informed_and_consent ? "Yes" : "No"}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        {r.gp_reviewed_schedule
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          : <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                        GP-reviewed schedule: <span className="font-medium">{r.gp_reviewed_schedule ? "Yes" : "No"}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> Reviewed by {getStaffName("staff_darren")} with GP on {r.review_date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Updated {r.last_update} by {getStaffName("staff_anna")}
                    </span>
                  </div>

                  <SmartLinkPanel sourceType="immunisation-records" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg border border-dashed p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">Quality Standard 7 — Health and wellbeing</p>
            <p>
              Under the <strong>Children&apos;s Homes (England) Regulations 2015</strong>, the home must
              promote and protect each child&apos;s health. The registered person must ensure that each
              child is registered with a GP and that the child&apos;s health needs — including immunisation
              against vaccine-preventable disease in line with the <strong>UK routine immunisation schedule</strong> —
              are met. Looked-after children frequently arrive with incomplete vaccination histories;
              homes are expected to obtain previous records, identify gaps, agree a catch-up plan with
              the GP and the Looked-After Children health team, and prepare the child sensitively for
              any procedures.
            </p>
            <p>
              The child&apos;s wishes and feelings must be respected. A child with sufficient understanding
              (Gillick competence) may consent to or refuse vaccinations; refusals must be discussed,
              recorded, and reviewed without coercion. Vaccine batch numbers, brand, site of
              administration and any side effects must be retained on the child&apos;s file. Records are
              shared at the Initial Health Assessment, Annual Health Assessment, statutory review,
              and on placement transition.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
