"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useWorkExpRecords } from "@/hooks/use-work-exp-records";
import type { WorkExpRecord } from "@/types/extended";
import { WORK_EXP_TYPE_LABEL } from "@/types/extended";
import {
  Briefcase,
  Star,
  Award,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Calendar,
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

const exportCols: ExportColumn<WorkExpRecord>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Type", accessor: (r) => WORK_EXP_TYPE_LABEL[r.type] },
  { header: "Employer", accessor: (r) => r.employer ?? "—" },
  { header: "Industry", accessor: (r) => r.industry },
  { header: "Start", accessor: (r) => r.start_date },
  { header: "End", accessor: (r) => r.end_date ?? "—" },
  { header: "Days/Hours", accessor: (r) => r.days_hours_total },
  { header: "Supervisor", accessor: (r) => r.supervisor_name ?? "—" },
  { header: "Supervisor Role", accessor: (r) => r.supervisor_role ?? "—" },
  { header: "Tasks", accessor: (r) => r.tasks_undertaken.join("; ") },
  { header: "Skills Built", accessor: (r) => r.skills_built.join("; ") },
  { header: "Challenges", accessor: (r) => r.challenges_faced.join("; ") },
  { header: "Employer Feedback", accessor: (r) => r.employer_feedback ?? "—" },
  { header: "Child Reflection", accessor: (r) => r.child_reflection },
  { header: "Links to Aspirations", accessor: (r) => r.links_to_aspirations.join("; ") },
  { header: "Follow-up", accessor: (r) => r.follow_up_opportunity ?? "—" },
  { header: "Risk Assessed", accessor: (r) => (r.risk_assessment_done ? "Yes" : "No") },
  { header: "Safeguarding Checked", accessor: (r) => (r.safeguarding_checked ? "Yes" : "No") },
  { header: "Travel Budget", accessor: (r) => (r.travel_budget_used != null ? `£${r.travel_budget_used.toFixed(2)}` : "—") },
  { header: "Child Voice", accessor: (r) => r.child_voice },
  { header: "Staff Observation", accessor: (r) => r.staff_observation },
  { header: "Review", accessor: (r) => r.review_date },
  { header: "Key Worker", accessor: (r) => getStaffName(r.key_worker) },
];

const typeColour: Record<string, string> = {
  year_10_placement: "bg-sky-100 text-sky-800 border-sky-200",
  post_16_placement: "bg-blue-100 text-blue-800 border-blue-200",
  taster_day: "bg-amber-100 text-amber-800 border-amber-200",
  career_exploration_meeting: "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-navy)] border-[var(--cs-aria-gold-soft)]",
  employer_mentor_session: "bg-emerald-100 text-emerald-800 border-emerald-200",
  apprenticeship_taster: "bg-teal-100 text-teal-800 border-teal-200",
  volunteering_placement: "bg-pink-100 text-pink-800 border-pink-200",
  vocational_course_visit: "bg-orange-100 text-orange-800 border-orange-200",
  university_taster: "bg-purple-100 text-purple-800 border-purple-200",
};

export default function ChildWorkExperienceTrackerPage() {
  const { data: res, isLoading } = useWorkExpRecords();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "type">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.child_id).toLowerCase().includes(search.toLowerCase()) ||
        (rec.employer ?? "").toLowerCase().includes(search.toLowerCase()) ||
        rec.industry.toLowerCase().includes(search.toLowerCase()) ||
        WORK_EXP_TYPE_LABEL[rec.type].toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || rec.type === typeFilter;
      return matchesSearch && matchesType;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      if (sortBy === "type") return a.type.localeCompare(b.type);
      return b.recorded_date.localeCompare(a.recorded_date);
    });
    return r;
  }, [records, search, typeFilter, sortBy]);

  const stats = useMemo(() => {
    const mentorConnections = records.filter(
      (r) => r.type === "employer_mentor_session" || r.follow_up_opportunity != null,
    ).length;
    return { total: records.length, mentorConnections };
  }, [records]);

  if (isLoading) {
    return (
      <PageShell title="Work Experience & Career Exposure" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Work Experience & Career Exposure"
      subtitle="Per-child work experience and career exposure — Year 10 placements, post-16 work experience, taster days, career exploration meetings, employer mentors."
      ariaContext={{ pageTitle: "Work Experience & Career Exposure", sourceType: "child_record" }}
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-work-experience-tracker" />
          <PrintButton title="Work Experience & Career Exposure" />
          <AriaStudioQuickActionButton context={{ record_type: "education", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Briefcase className="h-4 w-4" />
            <span>Total records</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.total}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Calendar className="h-4 w-4" />
            <span>Showing</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{filtered.length}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Star className="h-4 w-4" />
            <span>Mentor connections</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.mentorConnections}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Award className="h-4 w-4" />
            <span>Types covered</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{[...new Set(records.map((r) => r.type))].length}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--cs-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search young person, employer, industry, type..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--cs-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(WORK_EXP_TYPE_LABEL).map(([k, v]) => (
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
            <SelectItem value="type">Type</SelectItem>
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
                    <span className="text-[var(--cs-text-secondary)]">{r.employer ?? r.industry}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", typeColour[r.type] ?? "bg-slate-100 text-[var(--cs-navy)] border-[var(--cs-border)]")}>
                      {WORK_EXP_TYPE_LABEL[r.type]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]">
                      {r.industry}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200">
                      {r.days_hours_total}
                    </span>
                    {r.follow_up_opportunity ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200">
                        Follow-up offered
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-[var(--cs-text-secondary)]">
                    {r.start_date}
                    {r.end_date ? ` → ${r.end_date}` : ""} · {getStaffName(r.key_worker)}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-[var(--cs-text-muted)]" /> : <ChevronDown className="h-5 w-5 text-[var(--cs-text-muted)]" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-[var(--cs-border-subtle)] bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Placement / session details</div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-[var(--cs-text-secondary)]">
                        <div><span className="text-[var(--cs-text-muted)]">Employer:</span> {r.employer ?? "—"}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Industry:</span> {r.industry}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Supervisor:</span> {r.supervisor_name ?? "—"}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Role:</span> {r.supervisor_role ?? "—"}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Started:</span> {r.start_date}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Ended:</span> {r.end_date ?? "—"}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Days/hours:</span> {r.days_hours_total}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Travel budget:</span> {r.travel_budget_used != null ? `£${r.travel_budget_used.toFixed(2)}` : "—"}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Risk assessed:</span> {r.risk_assessment_done ? "Yes" : "No"}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Safeguarding checked:</span> {r.safeguarding_checked ? "Yes" : "No"}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Review:</span> {r.review_date}</div>
                      </div>
                    </div>

                    <div className="rounded-md border border-sky-200 bg-sky-50 p-3">
                      <div className="text-xs font-semibold text-sky-700 uppercase mb-2">Tasks undertaken</div>
                      <ul className="text-sm text-sky-900 space-y-1">
                        {r.tasks_undertaken.map((t, i) => (
                          <li key={i} className="flex gap-2"><span>·</span><span>{t}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                      <div className="text-xs font-semibold text-emerald-700 uppercase mb-2">Skills built</div>
                      <ul className="text-sm text-emerald-900 space-y-1">
                        {r.skills_built.map((s, i) => (
                          <li key={i} className="flex gap-2"><span>+</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-rose-200 bg-rose-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-rose-700 uppercase mb-2">Challenges faced</div>
                      <ul className="text-sm text-rose-900 space-y-1">
                        {r.challenges_faced.map((s, i) => (
                          <li key={i} className="flex gap-2"><span>·</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>

                    {r.employer_feedback ? (
                      <div className="rounded-md border-2 border-amber-300 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Employer feedback</div>
                        <p className="text-sm text-amber-900">&ldquo;{r.employer_feedback}&rdquo;</p>
                      </div>
                    ) : null}

                    <div className="rounded-md border border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)] p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-aria-gold)] uppercase mb-2">Child reflection</div>
                      <p className="text-sm text-[var(--cs-navy)] italic">&ldquo;{r.child_reflection}&rdquo;</p>
                    </div>

                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Links to aspirations</div>
                      <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                        {r.links_to_aspirations.map((s, i) => (
                          <li key={i} className="flex gap-2"><span>→</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Follow-up opportunity</div>
                      <p className="text-sm text-[var(--cs-text-secondary)]">{r.follow_up_opportunity ?? "None recorded yet"}</p>
                    </div>

                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Child voice</div>
                      <p className="text-sm text-[var(--cs-text-secondary)] italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Staff observation</div>
                      <p className="text-sm text-[var(--cs-text-secondary)]">{r.staff_observation}</p>
                    </div>
                    <div className="lg:col-span-2">
                      <SmartLinkPanel sourceType="work-exp-records" sourceId={r.id} childId={r.child_id} compact />
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
          Work experience and career exposure are protective factors that reduce care leaver NEET risk.
          Practice is grounded in Pathway Plan duty (Care Leavers Regulations 2010) for children 16+,
          Quality Standard 5 (Education) and Quality Standard 6 (Enjoyment & Achievement),
          the Gatsby Benchmarks for career education (especially 5: encounters with employers and 6: experience of workplaces),
          HSE Young Workers guidance on workplace risk, KCSIE 2024 safeguarding for off-site activity,
          and UNCRC Articles 28 (right to education) and 29 (development of personality and talents).
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Education"
        category="education"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Work Experience & Career Exposure — placements, career days, job shadowing, employer visits, apprenticeship exploration, pathway 3 leaving care, PEP, skills, career aspiration"
        recordType="education"
        className="mt-6"
      />
    </PageShell>
  );
}
