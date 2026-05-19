"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useSaltRecords } from "@/hooks/use-salt-records";
import type { SaltRecord, SaltStatus, SaltGoalStatus } from "@/types/extended";
import {
  SALT_AREA_LABEL,
  SALT_STATUS_LABEL,
  SALT_GOAL_STATUS_LABEL,
} from "@/types/extended";
import {
  MessageCircle,
  Mic,
  BookOpen,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Sparkles,
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
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const exportCols: ExportColumn<SaltRecord>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Recorded", accessor: (r) => r.recorded_date },
  { header: "Area", accessor: (r) => SALT_AREA_LABEL[r.area] },
  { header: "Status", accessor: (r) => SALT_STATUS_LABEL[r.status] },
  { header: "Service", accessor: (r) => r.salt_service },
  { header: "Clinician", accessor: (r) => r.salt_clinician ?? "—" },
  { header: "Started", accessor: (r) => r.start_date ?? "—" },
  { header: "Goals achieved", accessor: (r) => `${r.goals.filter((g) => g.status === "achieved").length}/${r.goals.length}` },
  { header: "Hearing cleared", accessor: (r) => r.hearing_clearance ? "Yes" : "No" },
  { header: "Home Frequency", accessor: (r) => r.home_programme_frequency ?? "—" },
  { header: "Bilingual notes", accessor: (r) => r.bilingual_considerations ?? "—" },
  { header: "Child comfort 1-5", accessor: (r) => `${r.child_comfort_discussing_comm}` },
  { header: "Child Voice", accessor: (r) => r.child_voice },
  { header: "Next appt", accessor: (r) => r.next_appointment ?? "—" },
  { header: "Review", accessor: (r) => r.review_date },
  { header: "Key Worker", accessor: (r) => getStaffName(r.key_worker) },
];

const statusColour: Record<SaltStatus, string> = {
  awaiting_referral: "bg-amber-100 text-amber-800 border-amber-200",
  assessed_no_salt_needed: "bg-slate-100 text-[var(--cs-navy)] border-[var(--cs-border)]",
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  maintenance_monitoring: "bg-blue-100 text-blue-800 border-blue-200",
  discharged: "bg-slate-100 text-[var(--cs-navy)] border-[var(--cs-border)]",
};

const goalStatusColour: Record<SaltGoalStatus, string> = {
  achieved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  on_track: "bg-blue-100 text-blue-800 border-blue-200",
  slow_progress: "bg-amber-100 text-amber-800 border-amber-200",
  not_started: "bg-slate-100 text-[var(--cs-navy)] border-[var(--cs-border)]",
};

const dFromNow = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

export default function ChildSpeechLanguageTherapyPage() {
  const { data: res, isLoading } = useSaltRecords();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "status" | "review">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.child_id).toLowerCase().includes(search.toLowerCase()) ||
        SALT_AREA_LABEL[rec.area].toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || rec.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      if (sortBy === "status") return a.status.localeCompare(b.status);
      if (sortBy === "review") return a.review_date.localeCompare(b.review_date);
      return b.recorded_date.localeCompare(a.recorded_date);
    });
    return r;
  }, [records, search, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const active = records.filter((r) => r.status === "active").length;
    const goalsAchieved = records.reduce((acc, r) => acc + r.goals.filter((g) => g.status === "achieved").length, 0);
    const homeProgrammeRunning = records.filter((r) => r.home_programme_frequency).length;
    const reviewsDue = records.filter((r) => r.review_date <= dFromNow(60)).length;
    return { active, goalsAchieved, homeProgrammeRunning, reviewsDue };
  }, [records]);

  if (isLoading) {
    return (
      <PageShell title="Speech & Language Therapy" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Speech & Language Therapy"
      subtitle="Per-child SaLT plans — articulation, language, social communication, voice, fluency, AAC. Goals, strategies, home programme, school involvement, child voice. RCSLT-aligned, child-paced."
      ariaContext={{ pageTitle: "Speech & Language Therapy", sourceType: "child_record" }}
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-speech-language-therapy" />
          <PrintButton title="Speech & Language Therapy" />
          <AriaStudioQuickActionButton context={{ record_type: "health", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <MessageCircle className="h-4 w-4" />
            <span>Active plans</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.active}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <CheckCircle className="h-4 w-4" />
            <span>Goals achieved</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.goalsAchieved}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <BookOpen className="h-4 w-4" />
            <span>Home programmes</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.homeProgrammeRunning}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Sparkles className="h-4 w-4" />
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
            placeholder="Search young person or area..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--cs-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(SALT_STATUS_LABEL).map(([k, v]) => (
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
                    <span className="text-[var(--cs-text-secondary)]">{SALT_AREA_LABEL[r.area]}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", statusColour[r.status])}>{SALT_STATUS_LABEL[r.status]}</span>
                    {r.salt_clinician ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]">
                        <Mic className="h-3 w-3 inline mr-1" />{r.salt_clinician}
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
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Child Voice</div>
                      <p className="text-sm text-[var(--cs-text-secondary)] italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Staff Observation</div>
                      <p className="text-sm text-[var(--cs-text-secondary)]">{r.staff_observation}</p>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Goals</div>
                      <div className="space-y-2">
                        {r.goals.map((g, i) => (
                          <div key={i} className="flex items-start justify-between gap-3 text-sm">
                            <div className="flex-1">
                              <div className="text-[var(--cs-navy)]">{g.goal}</div>
                              <div className="text-xs text-[var(--cs-text-muted)]">Baseline {g.baseline_date}{g.target_date ? ` · target ${g.target_date}` : ""}</div>
                            </div>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full border shrink-0", goalStatusColour[g.status])}>
                              {SALT_GOAL_STATUS_LABEL[g.status]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Strategies used</div>
                      <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                        {r.strategies_used.map((s, i) => (
                          <li key={i} className="flex gap-2"><span className="text-[var(--cs-text-muted)]">·</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Tools & resources</div>
                      <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                        {r.tools_resources.map((s, i) => (
                          <li key={i} className="flex gap-2"><span className="text-[var(--cs-text-muted)]">·</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    {r.home_programme_frequency ? (
                      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                        <div className="text-xs font-semibold text-emerald-700 uppercase mb-2">Home programme</div>
                        <div className="text-sm text-emerald-900 space-y-1">
                          <div><span className="text-emerald-700">Frequency:</span> {r.home_programme_frequency}</div>
                          <div><span className="text-emerald-700">Supported by:</span></div>
                          <ul className="space-y-0.5 ml-1">
                            {r.home_programme_who_supports.map((s, i) => (
                              <li key={i} className="flex gap-2"><span>·</span><span>{s}</span></li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : null}
                    {r.school_involvement.length ? (
                      <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                        <div className="text-xs font-semibold text-blue-800 uppercase mb-2">School involvement</div>
                        <ul className="text-sm text-blue-900 space-y-1">
                          {r.school_involvement.map((s, i) => (
                            <li key={i} className="flex gap-2"><span>·</span><span>{s}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Context</div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-[var(--cs-text-secondary)]">
                        <div><span className="text-[var(--cs-text-muted)]">Hearing cleared:</span> {r.hearing_clearance ? "Yes" : "No"}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Child comfort 1-5:</span> {r.child_comfort_discussing_comm}</div>
                        {r.bilingual_considerations ? (
                          <div className="col-span-2"><span className="text-[var(--cs-text-muted)]">Bilingual:</span> {r.bilingual_considerations}</div>
                        ) : null}
                        {r.next_appointment ? (
                          <div><span className="text-[var(--cs-text-muted)]">Next appt:</span> {r.next_appointment}</div>
                        ) : null}
                      </div>
                    </div>
                    {r.flags_concerns.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Flags / concerns</div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.flags_concerns.map((f, i) => (
                            <li key={i} className="flex gap-2"><span>!</span><span>{f}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="lg:col-span-2">
                      <SmartLinkPanel sourceType="salt-records" sourceId={r.id} childId={r.child_id} compact />
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
          Practice is grounded in Royal College of Speech & Language Therapists (RCSLT) guidance, NHS Children&rsquo;s
          SaLT pathway, the SEND Code of Practice 2015, Children&rsquo;s Homes Regulations Quality Standards 5
          (Education) and 8 (Health), and UNCRC Articles 12 (voice) and 13 (expression). Communication is a right.
          Hearing is screened before SaLT diagnosis. Bilingual considerations are factored in. Voice work is
          identity-respectful and child-paced.
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
        pageContext="Speech & Language Therapy — SALT sessions, communication targets, home programme, EHCP, school liaison, augmentative communication, AHA, developmental milestones, progress"
        recordType="health"
        className="mt-6"
      />
    </PageShell>
  );
}
