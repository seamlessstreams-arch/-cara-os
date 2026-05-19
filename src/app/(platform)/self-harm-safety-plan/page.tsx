"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Shield, Heart, Phone, ChevronUp, ChevronDown, ArrowUpDown,
  Search, AlertTriangle, CheckCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { useSelfHarmSafetyPlanRecords } from "@/hooks/use-self-harm-safety-plan-records";
import type { SelfHarmSafetyPlanRecord, SelfHarmSafetyPlanStatus, SelfHarmSafetyPlanReviewFrequency } from "@/types/extended";
import { SELF_HARM_SAFETY_PLAN_STATUS_LABEL, SELF_HARM_SAFETY_PLAN_REVIEW_FREQUENCY_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── local config ─────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const STATUS_COLOURS: Record<SelfHarmSafetyPlanStatus, string> = {
  not_currently_needed:      "bg-slate-100 text-[var(--cs-text-secondary)] border border-[var(--cs-border)]",
  active_preventive:         "bg-teal-100 text-teal-800 border border-teal-200",
  active_recent_incident:    "bg-rose-100 text-rose-800 border border-rose-200",
  in_review:                 "bg-sky-100 text-sky-800 border border-sky-200",
};

const FREQUENCY_COLOURS: Record<SelfHarmSafetyPlanReviewFrequency, string> = {
  weekly:          "bg-rose-50 text-rose-700 border border-rose-200",
  fortnightly:     "bg-amber-50 text-amber-800 border border-amber-200",
  monthly:         "bg-teal-50 text-teal-800 border border-teal-200",
  quarterly:       "bg-sky-50 text-sky-800 border border-sky-200",
  after_incident:  "bg-slate-50 text-[var(--cs-text-secondary)] border border-[var(--cs-border)]",
};

type SortKey = "child" | "status" | "nextReviewDate" | "planDate";
type SortDir = "asc" | "desc";

/* ── component ─────────────────────────────────────────────────────────── */

export default function SelfHarmSafetyPlanPage() {
  const { data: records = [], isLoading } = useSelfHarmSafetyPlanRecords();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("nextReviewDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const today = new Date().toISOString().slice(0, 10);
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const cycleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) =>
          getYPName(p.child_id).toLowerCase().includes(s) ||
          SELF_HARM_SAFETY_PLAN_STATUS_LABEL[p.status].toLowerCase().includes(s) ||
          p.co_produced_with.some((c) => c.toLowerCase().includes(s)) ||
          p.child_voice.toLowerCase().includes(s) ||
          p.staff_observation.toLowerCase().includes(s),
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }
    list.sort((a, b) => {
      let av: string;
      let bv: string;
      switch (sortKey) {
        case "child":
          av = getYPName(a.child_id);
          bv = getYPName(b.child_id);
          break;
        case "status":
          av = a.status;
          bv = b.status;
          break;
        case "planDate":
          av = a.plan_date;
          bv = b.plan_date;
          break;
        case "nextReviewDate":
        default:
          av = a.next_review_date;
          bv = b.next_review_date;
          break;
      }
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [records, search, statusFilter, sortKey, sortDir]);

  const stats = useMemo(() => {
    const active = records.filter(
      (p) => p.status === "active_preventive" || p.status === "active_recent_incident",
    ).length;
    const inReview = records.filter((p) => p.status === "in_review").length;
    const coProducedWithChild = records.filter(
      (p) =>
        p.child_signed_off ||
        p.co_produced_with.some((c) => c.toLowerCase().includes("young person")),
    ).length;
    const horizon = d(14);
    const dueSoon = records.filter(
      (p) => p.next_review_date >= today && p.next_review_date <= horizon,
    ).length;
    return { active, inReview, coProducedWithChild, dueSoon };
  }, [records, today]);

  const exportCols: ExportColumn<SelfHarmSafetyPlanRecord>[] = [
    { header: "Young Person",         accessor: (r) => getYPName(r.child_id) },
    { header: "Plan Date",            accessor: (r) => r.plan_date },
    { header: "Status",               accessor: (r) => SELF_HARM_SAFETY_PLAN_STATUS_LABEL[r.status] },
    { header: "Co-Produced With",     accessor: (r) => r.co_produced_with.join("; ") },
    { header: "External Warning Signs", accessor: (r) => r.warning_signs_external.join("; ") },
    { header: "Internal Warning Signs", accessor: (r) => r.warning_signs_internal.join("; ") },
    { header: "Early Triggers",       accessor: (r) => r.early_triggers.join("; ") },
    { header: "Internal Coping",      accessor: (r) => r.internal_coping_strategies.join("; ") },
    { header: "Social Distractions",  accessor: (r) => r.social_distractions.join("; ") },
    { header: "People to Contact",    accessor: (r) => r.people_to_contact.map((p) => `${p.name} (${p.relationship})`).join("; ") },
    { header: "Professional Contacts",accessor: (r) => r.professional_contacts.map((p) => `${p.name} (${p.role})`).join("; ") },
    { header: "Means Restriction",    accessor: (r) => r.means_restriction_agreed.join("; ") },
    { header: "Reasons to Live",      accessor: (r) => r.reasons_to_live.join("; ") },
    { header: "Reasons for Hope",     accessor: (r) => r.reasons_for_hope.join("; ") },
    { header: "Child Signed Off",     accessor: (r) => (r.child_signed_off ? "Yes" : "No") },
    { header: "Child Signed Date",    accessor: (r) => r.child_signed_date ?? "" },
    { header: "Professionals Informed", accessor: (r) => r.professionals_informed.join("; ") },
    { header: "Review Frequency",     accessor: (r) => SELF_HARM_SAFETY_PLAN_REVIEW_FREQUENCY_LABEL[r.review_frequency] },
    { header: "Next Review Date",     accessor: (r) => r.next_review_date },
    { header: "Child Voice",          accessor: (r) => r.child_voice },
    { header: "Staff Observation",    accessor: (r) => r.staff_observation },
    { header: "Flags for Review",     accessor: (r) => r.flags_for_review.join("; ") },
    { header: "Key Worker",           accessor: (r) => getStaffName(r.key_worker) },
  ];

  if (isLoading) {
    return (
      <PageShell title="Self-Harm Safety Plans" subtitle="Per-child, co-produced safety plans using the Stanley-Brown framework. Trauma-informed, hopeful, and child-led — never sensational.">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Self-Harm Safety Plans"
      subtitle="Per-child, co-produced safety plans using the Stanley-Brown framework. Trauma-informed, hopeful, and child-led — never sensational."
      ariaContext={{ pageTitle: "Self-Harm Safety Plans", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Self-Harm Safety Plans" />
          <ExportButton data={filtered} columns={exportCols} filename="self-harm-safety-plans" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Active plans", value: stats.active, icon: Shield, colour: "text-teal-700" },
            { label: "In review", value: stats.inReview, icon: AlertTriangle, colour: "text-sky-700" },
            { label: "Co-produced with child", value: stats.coProducedWithChild, icon: Heart, colour: "text-rose-600" },
            { label: "Review due (next 14 days)", value: stats.dueSoon, icon: CheckCircle, colour: stats.dueSoon > 0 ? "text-amber-700" : "text-teal-700" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* tone banner */}
        <Card className="border-teal-200 bg-teal-50/60">
          <CardContent className="p-4 text-sm text-teal-900">
            <p className="font-medium mb-1">A note on these plans</p>
            <p>
              Each plan is co-produced with the young person, never written about them.
              The Stanley-Brown framework is followed sequentially — the young person
              is supported to use earlier steps before reaching out to professionals.
              Plans are hopeful documents that name reasons to live alongside warning
              signs. They are reviewed regularly with CAMHS and the key worker.
            </p>
          </CardContent>
        </Card>

        {/* filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search young person, status, key worker..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(SELF_HARM_SAFETY_PLAN_STATUS_LABEL) as SelfHarmSafetyPlanStatus[]).map((k) => (
                <SelectItem key={k} value={k}>{SELF_HARM_SAFETY_PLAN_STATUS_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sortKey}
            onValueChange={(v) => cycleSort(v as SortKey)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nextReviewDate">Sort by next review</SelectItem>
              <SelectItem value="child">Sort by young person</SelectItem>
              <SelectItem value="status">Sort by status</SelectItem>
              <SelectItem value="planDate">Sort by plan date</SelectItem>
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="inline-flex items-center gap-1 rounded-md border bg-white px-3 py-2 text-xs hover:bg-[var(--cs-surface)]"
            aria-label="Toggle sort direction"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortDir === "asc" ? "Ascending" : "Descending"}
          </button>
        </div>

        {/* plan cards */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No safety plans match your filters.
            </p>
          )}
          {filtered.map((plan) => {
            const isExpanded = !!expanded[plan.id];
            const reviewSoon =
              plan.next_review_date >= today && plan.next_review_date <= d(14);
            const reviewOverdue = plan.next_review_date < today;

            return (
              <div
                key={plan.id}
                className={cn(
                  "rounded-xl border bg-white overflow-hidden",
                  plan.status === "active_recent_incident" && "border-l-4 border-l-rose-300",
                  plan.status === "active_preventive"      && "border-l-4 border-l-teal-300",
                  plan.status === "in_review"                && "border-l-4 border-l-sky-300",
                )}
              >
                {/* header */}
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                  onClick={() => toggle(plan.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Shield className="h-5 w-5 text-teal-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{getYPName(plan.child_id)}</p>
                        <Badge className={cn("text-xs font-normal", STATUS_COLOURS[plan.status])}>
                          {SELF_HARM_SAFETY_PLAN_STATUS_LABEL[plan.status]}
                        </Badge>
                        {plan.child_signed_off && (
                          <Badge className="text-xs font-normal bg-rose-50 text-rose-700 border border-rose-200">
                            <Heart className="h-3 w-3 mr-1" />
                            Child signed off
                          </Badge>
                        )}
                        <Badge className={cn("text-xs font-normal", FREQUENCY_COLOURS[plan.review_frequency])}>
                          Review: {SELF_HARM_SAFETY_PLAN_REVIEW_FREQUENCY_LABEL[plan.review_frequency].toLowerCase()}
                        </Badge>
                        {reviewOverdue && (
                          <Badge className="text-xs font-normal bg-amber-100 text-amber-800 border border-amber-200">
                            Review overdue
                          </Badge>
                        )}
                        {reviewSoon && !reviewOverdue && (
                          <Badge className="text-xs font-normal bg-amber-50 text-amber-700 border border-amber-200">
                            Review due soon
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                        <span>Plan date: {plan.plan_date}</span>
                        <span>Next review: {plan.next_review_date}</span>
                        <span>Key worker: {getStaffName(plan.key_worker)}</span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {/* expanded */}
                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* co-produced with */}
                    <div>
                      <p className="text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Co-produced with</p>
                      <div className="flex flex-wrap gap-1">
                        {plan.co_produced_with.map((c) => (
                          <Badge key={c} variant="outline" className="text-xs bg-white text-[var(--cs-text-secondary)] border-[var(--cs-border)]">{c}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* step 1 — warning signs */}
                    <div className="rounded-lg bg-white border border-sky-200 p-3">
                      <p className="text-xs font-semibold text-sky-800 mb-2">1. Warning signs (so we notice early — together)</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1">External (others may notice)</p>
                          <ul className="space-y-1">
                            {plan.warning_signs_external.map((w, i) => (
                              <li key={i} className="text-sm flex gap-1"><span className="text-sky-400">&#8226;</span><span>{w}</span></li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1">Internal (how it feels)</p>
                          <ul className="space-y-1">
                            {plan.warning_signs_internal.map((w, i) => (
                              <li key={i} className="text-sm flex gap-1"><span className="text-sky-400">&#8226;</span><span>{w}</span></li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1">Early triggers</p>
                          <ul className="space-y-1">
                            {plan.early_triggers.map((t, i) => (
                              <li key={i} className="text-sm flex gap-1"><span className="text-sky-400">&#8226;</span><span>{t}</span></li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* step 2 — internal coping */}
                    <div className="rounded-lg bg-white border border-teal-200 p-3">
                      <p className="text-xs font-semibold text-teal-800 mb-2">2. Things I can do on my own (internal coping)</p>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                        {plan.internal_coping_strategies.map((c, i) => (
                          <li key={i} className="text-sm flex gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-teal-500 mt-0.5 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* step 3 — social distractions */}
                    <div className="rounded-lg bg-white border border-teal-200 p-3">
                      <p className="text-xs font-semibold text-teal-800 mb-2">3. People and places that take my mind off it</p>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                        {plan.social_distractions.map((c, i) => (
                          <li key={i} className="text-sm flex gap-1"><span className="text-teal-400">&#8226;</span><span>{c}</span></li>
                        ))}
                      </ul>
                    </div>

                    {/* step 4 — people to contact */}
                    <div className="rounded-lg bg-white border border-rose-200 p-3">
                      <p className="text-xs font-semibold text-rose-800 mb-2">4. People I can reach out to</p>
                      <div className="space-y-2">
                        {plan.people_to_contact.map((p, i) => (
                          <div key={i} className="text-sm flex items-start gap-2">
                            <Heart className="h-3.5 w-3.5 text-rose-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-medium">{p.name} <span className="font-normal text-muted-foreground">— {p.relationship}</span></p>
                              <p className="text-xs text-muted-foreground">{p.how}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* step 5 — professional contacts */}
                    <div className="rounded-lg bg-white border border-sky-200 p-3">
                      <p className="text-xs font-semibold text-sky-800 mb-2">5. Professionals and crisis lines</p>
                      <div className="space-y-2">
                        {plan.professional_contacts.map((p, i) => (
                          <div key={i} className="text-sm flex items-start gap-2">
                            <Phone className="h-3.5 w-3.5 text-sky-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-medium">{p.name} <span className="font-normal text-muted-foreground">— {p.role}</span></p>
                              <p className="text-xs text-muted-foreground">{p.how}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* step 6 — means safety */}
                    <div className="rounded-lg bg-white border border-[var(--cs-border)] p-3">
                      <p className="text-xs font-semibold text-[var(--cs-text-secondary)] mb-2">6. Keeping the environment safer (agreed together)</p>
                      <ul className="space-y-1">
                        {plan.means_restriction_agreed.map((m, i) => (
                          <li key={i} className="text-sm flex gap-1">
                            <Shield className="h-3.5 w-3.5 text-[var(--cs-text-muted)] mt-0.5 shrink-0" />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* step 7 — reasons to live */}
                    <div className="rounded-xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-amber-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="h-4 w-4 text-rose-500" />
                        <p className="text-sm font-semibold text-rose-900">7. Reasons for living</p>
                      </div>
                      <ul className="space-y-1.5">
                        {plan.reasons_to_live.map((r, i) => (
                          <li key={i} className="text-sm text-rose-900 flex gap-2">
                            <span className="text-rose-400 font-semibold">&#9825;</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                      {plan.reasons_for_hope.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-rose-200/70">
                          <p className="text-xs font-medium text-rose-800 mb-1">Reasons for hope right now</p>
                          <ul className="space-y-1">
                            {plan.reasons_for_hope.map((r, i) => (
                              <li key={i} className="text-sm text-rose-900/90 flex gap-2">
                                <span className="text-rose-400">&#10022;</span>
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* child voice */}
                    <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Heart className="h-4 w-4 text-rose-600" />
                        <p className="text-xs font-semibold text-rose-800">In their own words</p>
                      </div>
                      <p className="text-sm italic text-rose-900">&ldquo;{plan.child_voice}&rdquo;</p>
                      {plan.child_signed_off && plan.child_signed_date && (
                        <p className="text-xs text-rose-700 mt-1">
                          Signed off by young person on {plan.child_signed_date}
                        </p>
                      )}
                    </div>

                    {/* staff observation */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Staff observation</p>
                      <p className="text-sm text-[var(--cs-navy)]">{plan.staff_observation}</p>
                    </div>

                    {/* professionals informed + flags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Professionals informed</p>
                        <ul className="space-y-0.5">
                          {plan.professionals_informed.map((p, i) => (
                            <li key={i} className="text-sm flex gap-1"><span className="text-[var(--cs-text-muted)]">&#8226;</span><span>{p}</span></li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Flags for next review</p>
                        {plan.flags_for_review.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No flags raised.</p>
                        ) : (
                          <ul className="space-y-0.5">
                            {plan.flags_for_review.map((f, i) => (
                              <li key={i} className="text-sm flex gap-1">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <SmartLinkPanel sourceType="self-harm-safety-plan" sourceId={plan.id} childId={plan.child_id} compact />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="rounded-lg bg-sky-50 border border-sky-200 p-4 text-sm text-sky-900">
          <strong>Regulatory framework:</strong>{" "}
          Plans follow the Stanley-Brown Safety Planning Intervention and align with
          NICE NG225 (self-harm), Working Together to Safeguard Children 2023, and
          Children&apos;s Homes Quality Standards 8 (Protection) and 9 (Leadership and
          Management). Capacity to consent is assessed under the Mental Capacity Act
          2005 and Gillick competence. CAMHS clinical input is integral to every
          active plan. The young person&apos;s right to be heard (UNCRC Article 12) and
          to the highest attainable standard of health (Article 24) underpin the
          co-production approach. Plans are held with care, reviewed regularly, and
          never used in place of clinical assessment.
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Safeguarding & Wellbeing"
        category={["safeguarding", "wellbeing"]}
        days={90}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Self-Harm Safety Plans — individual safety plans, risk triggers, protective factors, crisis responses, staff guidance, safeguarding evidence, care plan evidence, Reg 45 quality evidence"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
