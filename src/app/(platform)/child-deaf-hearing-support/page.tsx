"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Ear,
  Hand,
  Headphones,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Heart,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeafHearingSupportRecords } from "@/hooks/use-deaf-hearing-support-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type {
  DeafHearingSupportRecord,
  HearingStatus,
  HearingPreferredLanguage,
  BSLLevel,
} from "@/types/extended";
import {
  HEARING_STATUS_LABEL,
  HEARING_PREFERRED_LANGUAGE_LABEL,
  BSL_LEVEL_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const statusColour: Record<HearingStatus, string> = {
  hearing_full: "bg-emerald-100 text-emerald-800 border-emerald-200",
  mild_loss: "bg-blue-100 text-blue-800 border-blue-200",
  moderate_loss: "bg-sky-100 text-sky-800 border-sky-200",
  severe_loss: "bg-amber-100 text-amber-800 border-amber-200",
  profound_loss: "bg-orange-100 text-orange-800 border-orange-200",
  single_sided_deafness: "bg-purple-100 text-purple-800 border-purple-200",
  auditory_processing_difficulties: "bg-violet-100 text-violet-800 border-violet-200",
  awaiting_assessment: "bg-slate-100 text-[var(--cs-navy)] border-[var(--cs-border)]",
};

const exportCols: ExportColumn<DeafHearingSupportRecord>[] = [
  { header: "Young Person", accessor: (r: DeafHearingSupportRecord) => getYPName(r.child_id) },
  { header: "Recorded", accessor: (r: DeafHearingSupportRecord) => r.recorded_date },
  { header: "Hearing Status", accessor: (r: DeafHearingSupportRecord) => HEARING_STATUS_LABEL[r.hearing_status] },
  { header: "Identifies as Deaf", accessor: (r: DeafHearingSupportRecord) => (r.identify_as_deaf ? "Yes" : "No") },
  { header: "Preferred Language", accessor: (r: DeafHearingSupportRecord) => HEARING_PREFERRED_LANGUAGE_LABEL[r.preferred_language] },
  { header: "BSL Level", accessor: (r: DeafHearingSupportRecord) => (r.bsl_level ? BSL_LEVEL_LABEL[r.bsl_level] : "—") },
  { header: "Hearing Aids", accessor: (r: DeafHearingSupportRecord) => (r.hearing_aids ? `${r.hearing_aids.side} ${r.hearing_aids.type}` : "—") },
  { header: "Cochlear Implant", accessor: (r: DeafHearingSupportRecord) => (r.cochlear_implant ? `${r.cochlear_implant.side} ${r.cochlear_implant.processor}` : "—") },
  { header: "Audiology Service", accessor: (r: DeafHearingSupportRecord) => r.audiology_service },
  { header: "Last Review", accessor: (r: DeafHearingSupportRecord) => r.last_review ?? "—" },
  { header: "Next Review", accessor: (r: DeafHearingSupportRecord) => r.next_review_due ?? "—" },
  { header: "Staff Trained", accessor: (r: DeafHearingSupportRecord) => r.staff_signing_trained.join("; ") },
  { header: "School Plan", accessor: (r: DeafHearingSupportRecord) => (r.school_has_plan ? "Yes" : "No") },
  { header: "Child Voice", accessor: (r: DeafHearingSupportRecord) => r.child_voice },
  { header: "Review", accessor: (r: DeafHearingSupportRecord) => r.review_date },
  { header: "Key Worker", accessor: (r: DeafHearingSupportRecord) => getStaffName(r.key_worker) },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function ChildDeafHearingSupportPage() {
  const { data: response, isLoading } = useDeafHearingSupportRecords();
  const records = response?.data ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "status" | "review">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.child_id).toLowerCase().includes(search.toLowerCase()) ||
        HEARING_PREFERRED_LANGUAGE_LABEL[rec.preferred_language].toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || rec.hearing_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      if (sortBy === "status") return a.hearing_status.localeCompare(b.hearing_status);
      if (sortBy === "review") return a.review_date.localeCompare(b.review_date);
      return b.recorded_date.localeCompare(a.recorded_date);
    });
    return r;
  }, [records, search, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const tracked = records.length;
    const deafIdentifying = records.filter((r) => r.identify_as_deaf).length;
    const bslLearners = records.filter((r) => r.bsl_level && r.bsl_level !== "pre_introduction").length;
    const now = new Date();
    const sixtyDays = new Date(now);
    sixtyDays.setDate(sixtyDays.getDate() + 60);
    const cutoff = sixtyDays.toISOString().slice(0, 10);
    const reviewsDue = records.filter((r) => r.review_date <= cutoff).length;
    return { tracked, deafIdentifying, bslLearners, reviewsDue };
  }, [records]);

  if (isLoading) {
    return (
      <PageShell title="Deaf & Hearing Support" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Deaf & Hearing Support"
      subtitle="Per-child hearing status and Deaf identity work — hearing aids, cochlear implants, BSL/SSE language preference, audiology, school plans, home adaptations, Deaf community connection. Honours Deaf identity as culture, not deficit."
      ariaContext={{ pageTitle: "Deaf & Hearing Support", sourceType: "child_record" }}
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-deaf-hearing-support" />
          <PrintButton title="Deaf & Hearing Support" />
          <AriaStudioQuickActionButton context={{ record_type: "health", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Ear className="h-4 w-4" />
            <span>Children tracked</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.tracked}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Heart className="h-4 w-4" />
            <span>Deaf-identifying</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.deafIdentifying}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Hand className="h-4 w-4" />
            <span>BSL learners</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.bslLearners}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Headphones className="h-4 w-4" />
            <span>Reviews due (60d)</span>
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
            placeholder="Search young person or preferred language..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--cs-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Hearing status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="hearing_full">{HEARING_STATUS_LABEL.hearing_full}</SelectItem>
            <SelectItem value="mild_loss">{HEARING_STATUS_LABEL.mild_loss}</SelectItem>
            <SelectItem value="moderate_loss">{HEARING_STATUS_LABEL.moderate_loss}</SelectItem>
            <SelectItem value="severe_loss">{HEARING_STATUS_LABEL.severe_loss}</SelectItem>
            <SelectItem value="profound_loss">{HEARING_STATUS_LABEL.profound_loss}</SelectItem>
            <SelectItem value="single_sided_deafness">{HEARING_STATUS_LABEL.single_sided_deafness}</SelectItem>
            <SelectItem value="auditory_processing_difficulties">{HEARING_STATUS_LABEL.auditory_processing_difficulties}</SelectItem>
            <SelectItem value="awaiting_assessment">{HEARING_STATUS_LABEL.awaiting_assessment}</SelectItem>
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
            <SelectItem value="status">Status</SelectItem>
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
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", statusColour[r.hearing_status])}>
                      {HEARING_STATUS_LABEL[r.hearing_status]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]">
                      {HEARING_PREFERRED_LANGUAGE_LABEL[r.preferred_language]}
                    </span>
                    {r.bsl_level ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-violet-100 text-violet-800 border-violet-200">
                        BSL: {BSL_LEVEL_LABEL[r.bsl_level]}
                      </span>
                    ) : null}
                    {r.identify_as_deaf ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-pink-100 text-pink-800 border-pink-200">
                        Deaf identity
                      </span>
                    ) : null}
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
                    <div className="rounded-md border border-violet-200 bg-violet-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-violet-700 uppercase mb-2">Child Voice</div>
                      <p className="text-sm text-violet-900 italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Staff Observation</div>
                      <p className="text-sm text-[var(--cs-text-secondary)]">{r.staff_observation}</p>
                    </div>
                    {r.hearing_aids ? (
                      <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                        <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Hearing aids</div>
                        <div className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                          <div><span className="text-[var(--cs-text-muted)]">Side:</span> {r.hearing_aids.side}</div>
                          <div><span className="text-[var(--cs-text-muted)]">Type:</span> {r.hearing_aids.type}</div>
                          <div><span className="text-[var(--cs-text-muted)]">Fitted:</span> {r.hearing_aids.fitted}</div>
                          {r.hearing_aids.battery ? <div><span className="text-[var(--cs-text-muted)]">Battery:</span> {r.hearing_aids.battery}</div> : null}
                        </div>
                      </div>
                    ) : null}
                    {r.cochlear_implant ? (
                      <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                        <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Cochlear implant</div>
                        <div className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                          <div><span className="text-[var(--cs-text-muted)]">Side:</span> {r.cochlear_implant.side}</div>
                          <div><span className="text-[var(--cs-text-muted)]">Surgery:</span> {r.cochlear_implant.surgery_date}</div>
                          <div><span className="text-[var(--cs-text-muted)]">Processor:</span> {r.cochlear_implant.processor}</div>
                        </div>
                      </div>
                    ) : null}
                    {r.bsl_learning_plan.length ? (
                      <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">BSL learning plan</div>
                        <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                          {r.bsl_learning_plan.map((b, i) => (
                            <li key={i} className="flex gap-2"><span className="text-violet-500">·</span><span>{b}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Staff signing-trained</div>
                      <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                        {r.staff_signing_trained.map((s, i) => (
                          <li key={i} className="flex gap-2"><span className="text-emerald-500">·</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    {r.identity_work.length ? (
                      <div className="rounded-md border border-pink-200 bg-pink-50 p-3">
                        <div className="text-xs font-semibold text-pink-700 uppercase mb-2">Identity work</div>
                        <ul className="text-sm text-pink-900 space-y-1">
                          {r.identity_work.map((s, i) => (
                            <li key={i} className="flex gap-2"><span>♡</span><span>{s}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.social_opportunities_deaf.length ? (
                      <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Social opportunities — Deaf community</div>
                        <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                          {r.social_opportunities_deaf.map((s, i) => (
                            <li key={i} className="flex gap-2"><span className="text-[var(--cs-text-muted)]">·</span><span>{s}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.flags_for_review.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Flags for review</div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.flags_for_review.map((f, i) => (
                            <li key={i} className="flex gap-2"><span>!</span><span>{f}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>

                  <SmartLinkPanel sourceType="deaf-hearing-support" sourceId={r.id} childId={r.child_id} compact />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Deafness is recognised as cultural identity (the Deaf community), not solely a disability. Practice is
          grounded in the Equality Act 2010 (disability and language), British Sign Language Act 2022, Quality
          Standards 6 (Enjoyment & Achievement) and 8 (Health), the SEND Code of Practice 2015 (where applicable),
          NDCS (National Deaf Children&rsquo;s Society) family support guidance, and UNCRC Articles 8 (identity),
          13 (expression) and 23 (disability rights). Hearing aid maintenance, audiology review schedules, and
          school radio aid arrangements are coordinated through the Sensory Impairment / Teacher of the Deaf
          service where applicable.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Health"
        category="health"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Deaf & Hearing Support — hearing aids, BSL, lip-reading, audiology appointments, hearing assessment, communication adaptations, EHCP, school support, AHA, specialist equipment"
        recordType="health"
        className="mt-6"
      />
    </PageShell>
  );
}
