"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useOrthoRecords } from "@/hooks/use-ortho-records";
import type { OrthoRecord, OrthoStage, OrthoHygieneCompliance, OrthoMotivation } from "@/types/extended";
import {
  ORTHO_STAGE_LABEL,
  ORTHO_TREATMENT_TYPE_LABEL,
  ORTHO_HYGIENE_COMPLIANCE_LABEL,
  ORTHO_MOTIVATION_LABEL,
} from "@/types/extended";
import {
  Sparkles,
  Calendar,
  Smile,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Award,
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
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const exportCols: ExportColumn<OrthoRecord>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Recorded", accessor: (r) => r.recorded_date },
  { header: "Stage", accessor: (r) => ORTHO_STAGE_LABEL[r.stage] },
  { header: "IOTN", accessor: (r) => r.iotn_score ?? "—" },
  { header: "NHS Eligible", accessor: (r) => (r.nhs_eligible ? "Yes" : "No") },
  { header: "Treatment Type", accessor: (r) => r.treatment_type ? ORTHO_TREATMENT_TYPE_LABEL[r.treatment_type] : "—" },
  { header: "Orthodontist", accessor: (r) => r.orthodontist ?? "—" },
  { header: "Practice", accessor: (r) => r.practice_name ?? "—" },
  { header: "Start", accessor: (r) => r.start_date ?? "—" },
  { header: "Expected End", accessor: (r) => r.expected_end_date ?? "—" },
  { header: "Frequency", accessor: (r) => r.appointment_frequency ?? "—" },
  { header: "Attended", accessor: (r) => String(r.appointments_attended) },
  { header: "Missed", accessor: (r) => String(r.appointments_missed) },
  { header: "Oral Hygiene", accessor: (r) => ORTHO_HYGIENE_COMPLIANCE_LABEL[r.oral_hygiene_compliance] },
  { header: "Retainer Type", accessor: (r) => r.retainer_type ?? "—" },
  { header: "Retainer Worn Nightly", accessor: (r) => r.retainer_wear_reported_nightly === undefined ? "—" : r.retainer_wear_reported_nightly ? "Yes" : "No" },
  { header: "Motivation", accessor: (r) => ORTHO_MOTIVATION_LABEL[r.child_motivation] },
  { header: "Cost", accessor: (r) => r.cost_covered ?? "—" },
  { header: "Child Voice", accessor: (r) => r.child_voice },
  { header: "Review", accessor: (r) => r.review_date },
  { header: "Key Worker", accessor: (r) => getStaffName(r.key_worker) },
];

const stageColour: Record<OrthoStage, string> = {
  awaiting_referral: "bg-slate-100 text-[var(--cs-navy)] border-[var(--cs-border)]",
  referred_assessment_booked: "bg-sky-100 text-sky-800 border-sky-200",
  assessed_on_waiting_list: "bg-blue-100 text-blue-800 border-blue-200",
  active_treatment: "bg-teal-100 text-teal-800 border-teal-200",
  retention_phase: "bg-emerald-100 text-emerald-800 border-emerald-200",
  discharged: "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
  not_currently_indicated: "bg-stone-100 text-stone-700 border-stone-200",
};

const motivationColour: Record<OrthoMotivation, string> = {
  high: "bg-emerald-100 text-emerald-800 border-emerald-200",
  moderate: "bg-sky-100 text-sky-800 border-sky-200",
  mixed: "bg-amber-100 text-amber-800 border-amber-200",
  low_wants_to_stop: "bg-rose-100 text-rose-800 border-rose-200",
};

const hygieneColour: Record<OrthoHygieneCompliance, string> = {
  excellent: "bg-emerald-100 text-emerald-800 border-emerald-200",
  good: "bg-teal-100 text-teal-800 border-teal-200",
  fair: "bg-amber-100 text-amber-800 border-amber-200",
  poor_needs_support: "bg-rose-100 text-rose-800 border-rose-200",
  not_yet_started: "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
};

const dFromNow = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

export default function ChildOrthodonticTreatmentPage() {
  const { data: res, isLoading } = useOrthoRecords();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "stage" | "review">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.child_id).toLowerCase().includes(search.toLowerCase()) ||
        (rec.practice_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (rec.orthodontist ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStage = stageFilter === "all" || rec.stage === stageFilter;
      return matchesSearch && matchesStage;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      if (sortBy === "stage") return a.stage.localeCompare(b.stage);
      if (sortBy === "review") return a.review_date.localeCompare(b.review_date);
      return b.recorded_date.localeCompare(a.recorded_date);
    });
    return r;
  }, [records, search, stageFilter, sortBy]);

  const stats = useMemo(() => {
    const active = records.filter((r) => r.stage === "active_treatment").length;
    const retention = records.filter((r) => r.stage === "retention_phase").length;
    const onNhs = records.filter((r) => r.nhs_eligible).length;
    const reviewsDue = records.filter((r) => r.review_date <= dFromNow(90)).length;
    return { active, retention, onNhs, reviewsDue };
  }, [records]);

  if (isLoading) {
    return (
      <PageShell title="Orthodontic Treatment" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Orthodontic Treatment"
      subtitle="Per-child orthodontic journey — referral, IOTN scoring, NHS eligibility, brace type, appointment attendance, oral hygiene compliance, retention phase. Coordinated with general dental records and dietary planning."
      caraContext={{ pageTitle: "Orthodontic Treatment", sourceType: "child_record" }}
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-orthodontic-treatment" />
          <PrintButton title="Orthodontic Treatment" />
          <CaraStudioQuickActionButton context={{ record_type: "health", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Sparkles className="h-4 w-4" />
            <span>Active treatment</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.active}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Smile className="h-4 w-4" />
            <span>Retention phase</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.retention}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Award className="h-4 w-4" />
            <span>NHS eligible</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.onNhs}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Calendar className="h-4 w-4" />
            <span>Reviews due (90d)</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.reviewsDue}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--cs-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search young person, practice or orthodontist..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--cs-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {Object.entries(ORTHO_STAGE_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Most recent</SelectItem>
            <SelectItem value="name">Young person A→Z</SelectItem>
            <SelectItem value="stage">Stage</SelectItem>
            <SelectItem value="review">Review date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isOpen = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-lg border border-[var(--cs-border)] bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : r.id)}
                className="w-full p-4 flex items-start justify-between gap-3 hover:bg-[var(--cs-surface)] text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-[var(--cs-navy)]">{getYPName(r.child_id)}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", stageColour[r.stage])}>
                      {ORTHO_STAGE_LABEL[r.stage]}
                    </span>
                    {r.nhs_eligible ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-100 text-blue-800 border-blue-200">NHS eligible</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-stone-100 text-stone-700 border-stone-200">NHS not eligible</span>
                    )}
                    {r.treatment_type ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-teal-100 text-teal-800 border-teal-200">
                        {ORTHO_TREATMENT_TYPE_LABEL[r.treatment_type]}
                      </span>
                    ) : null}
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", motivationColour[r.child_motivation])}>
                      Motivation: {ORTHO_MOTIVATION_LABEL[r.child_motivation]}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--cs-text-secondary)]">
                    Recorded {r.recorded_date} · Review {r.review_date} · {getStaffName(r.key_worker)}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-[var(--cs-text-muted)]" /> : <ChevronDown className="h-5 w-5 text-[var(--cs-text-muted)]" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-[var(--cs-border-subtle)] bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-sky-200 bg-sky-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-sky-700 uppercase mb-2">Child Voice</div>
                      <p className="text-sm text-sky-900 italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Staff Observation</div>
                      <p className="text-sm text-[var(--cs-text-secondary)]">{r.staff_observation}</p>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">IOTN & NHS</div>
                      <div className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                        <div><span className="text-[var(--cs-text-muted)]">IOTN score:</span> {r.iotn_score ?? "—"}</div>
                        <div><span className="text-[var(--cs-text-muted)]">NHS eligible:</span> {r.nhs_eligible ? "Yes" : "No"}</div>
                        {r.private_option ? <div><span className="text-[var(--cs-text-muted)]">Private option:</span> {r.private_option}</div> : null}
                        {r.cost_covered ? <div><span className="text-[var(--cs-text-muted)]">Cost cover:</span> {r.cost_covered}</div> : null}
                      </div>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Treatment details</div>
                      <div className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                        <div><span className="text-[var(--cs-text-muted)]">Type:</span> {r.treatment_type ? ORTHO_TREATMENT_TYPE_LABEL[r.treatment_type] : "—"}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Start:</span> {r.start_date ?? "—"}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Expected end:</span> {r.expected_end_date ?? "—"}</div>
                      </div>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Orthodontist</div>
                      <div className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                        <div><span className="text-[var(--cs-text-muted)]">Practice:</span> {r.practice_name ?? "—"}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Clinician:</span> {r.orthodontist ?? "—"}</div>
                      </div>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Appointments</div>
                      <div className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                        <div><span className="text-[var(--cs-text-muted)]">Frequency:</span> {r.appointment_frequency ?? "—"}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Attended:</span> {r.appointments_attended}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Missed:</span> {r.appointments_missed}</div>
                      </div>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Oral hygiene & motivation</div>
                      <div className="text-sm text-[var(--cs-text-secondary)] space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--cs-text-muted)]">Hygiene:</span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full border", hygieneColour[r.oral_hygiene_compliance])}>
                            {ORTHO_HYGIENE_COMPLIANCE_LABEL[r.oral_hygiene_compliance]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--cs-text-muted)]">Motivation:</span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full border", motivationColour[r.child_motivation])}>
                            {ORTHO_MOTIVATION_LABEL[r.child_motivation]}
                          </span>
                        </div>
                      </div>
                    </div>
                    {r.retainer_type || r.retainer_wear_reported_nightly !== undefined ? (
                      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                        <div className="text-xs font-semibold text-emerald-700 uppercase mb-2">Retention phase</div>
                        <div className="text-sm text-emerald-900 space-y-1">
                          {r.retainer_type ? <div><span className="text-emerald-700">Retainer type:</span> {r.retainer_type}</div> : null}
                          {r.retainer_wear_reported_nightly !== undefined ? <div><span className="text-emerald-700">Worn nightly:</span> {r.retainer_wear_reported_nightly ? "Yes" : "No"}</div> : null}
                        </div>
                      </div>
                    ) : null}
                    {r.emergency_contacts.length ? (
                      <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Emergency contacts</div>
                        <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                          {r.emergency_contacts.map((c, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-teal-500">·</span>
                              <span><span className="font-medium">{c.name}</span> — {c.role} · <span className="text-[var(--cs-text-secondary)]">{c.phone}</span></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.flags_concerns.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Flags & concerns</div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.flags_concerns.map((f, i) => (
                            <li key={i} className="flex gap-2"><span>!</span><span>{f}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="lg:col-span-2">
                      <SmartLinkPanel sourceType="ortho-records" sourceId={r.id} childId={r.child_id} compact />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          NHS orthodontic treatment for under-18s is governed by the NHS Business Services Authority
          eligibility rules — IOTN (Index of Orthodontic Treatment Need) score of 4 or 5, or 3 with
          Aesthetic Component 6+ (often summarised as &ldquo;3.6+&rdquo;). Practice follows British
          Orthodontic Society standards, Children&rsquo;s Homes (England) Regulations 2015 Quality
          Standard 8 (Health &amp; Wellbeing), the NHS Long Term Dental Plan, and UNCRC Article 24
          (right to the highest attainable standard of health). Where a child is NHS-ineligible and
          private treatment is being considered, costs and consent must be agreed with the placing
          local authority before any commitment is made. Retainer replacement after debond is not
          NHS-funded — contingency must be planned.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Health"
        category="health"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Orthodontic Treatment — braces, retainer, dental appliance, orthodontist appointments, treatment plan, consent, school impact, AHA dental check, LAC health, Annex A evidence"
        recordType="health"
        className="mt-6"
      />
    </PageShell>
  );
}
