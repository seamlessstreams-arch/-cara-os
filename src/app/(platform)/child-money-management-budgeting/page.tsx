"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useMoneyRecords } from "@/hooks/use-money-records";
import type { MoneyRecord, MoneyCompetency } from "@/types/extended";
import { MONEY_SKILL_CATEGORY_LABEL, MONEY_COMPETENCY_LABEL } from "@/types/extended";
import {
  PoundSterling,
  ShieldCheck,
  BookOpen,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  TrendingUp,
  AlertTriangle,
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

const exportCols: ExportColumn<MoneyRecord>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Date", accessor: (r) => r.recorded_date },
  { header: "Skill Category", accessor: (r) => MONEY_SKILL_CATEGORY_LABEL[r.skill_category] },
  { header: "Competency", accessor: (r) => MONEY_COMPETENCY_LABEL[r.competency] },
  { header: "Examples", accessor: (r) => r.practical_examples.join("; ") },
  { header: "Real-world", accessor: (r) => r.real_world_application.join("; ") },
  { header: "Tools", accessor: (r) => r.tools_used.join("; ") },
  { header: "Challenges", accessor: (r) => r.challenges_faced.join("; ") },
  { header: "Money Values", accessor: (r) => r.child_money_values_notes ?? "—" },
  { header: "Child Voice", accessor: (r) => r.child_voice },
  { header: "Next Step", accessor: (r) => r.next_step },
  { header: "Review", accessor: (r) => r.review_date },
  { header: "Key Worker", accessor: (r) => getStaffName(r.key_worker) },
];

const competencyColour: Record<MoneyCompetency, string> = {
  not_yet_introduced: "bg-slate-100 text-[var(--cs-navy)] border-[var(--cs-border)]",
  aware: "bg-blue-100 text-blue-800 border-blue-200",
  did_with_help: "bg-sky-100 text-sky-800 border-sky-200",
  did_independently: "bg-emerald-100 text-emerald-800 border-emerald-200",
  confident: "bg-purple-100 text-purple-800 border-purple-200",
};

const dFromNow = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

export default function ChildMoneyManagementBudgetingPage() {
  const { data: res, isLoading } = useMoneyRecords();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "category" | "competency">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.child_id).toLowerCase().includes(search.toLowerCase()) ||
        MONEY_SKILL_CATEGORY_LABEL[rec.skill_category].toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === "all" || rec.skill_category === categoryFilter;
      return matchesSearch && matchesCat;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      if (sortBy === "category") return a.skill_category.localeCompare(b.skill_category);
      if (sortBy === "competency") return a.competency.localeCompare(b.competency);
      return b.recorded_date.localeCompare(a.recorded_date);
    });
    return r;
  }, [records, search, categoryFilter, sortBy]);

  const stats = useMemo(() => {
    const skillsTracked = records.length;
    const confidentCount = records.filter((r) => r.competency === "confident" || r.competency === "did_independently").length;
    const reviewsDue = records.filter((r) => r.review_date <= dFromNow(60)).length;
    const realWorldApps = records.reduce((acc, r) => acc + r.real_world_application.length, 0);
    return { skillsTracked, confidentCount, reviewsDue, realWorldApps };
  }, [records]);

  if (isLoading) {
    return (
      <PageShell title="Money Management & Budgeting" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Money Management & Budgeting"
      subtitle="Per-child practical money management — bank app fluency, weekly budget, payslip reading, scam recognition, BNPL risks, comparison shopping, debt awareness. Critical preparation for leaving care."
      caraContext={{ pageTitle: "Money Management & Budgeting", sourceType: "child_record" }}
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-money-management-budgeting" />
          <PrintButton title="Money Management & Budgeting" />
          <CaraStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <BookOpen className="h-4 w-4" />
            <span>Skills tracked</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.skillsTracked}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Confident / independent</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.confidentCount}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <TrendingUp className="h-4 w-4" />
            <span>Real-world applications</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.realWorldApps}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <AlertTriangle className="h-4 w-4" />
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
            placeholder="Search young person or skill..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--cs-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Skill category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All skills</SelectItem>
            {Object.entries(MONEY_SKILL_CATEGORY_LABEL).map(([k, v]) => (
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
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="competency">Competency</SelectItem>
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
                    <span className="text-[var(--cs-text-secondary)]">{MONEY_SKILL_CATEGORY_LABEL[r.skill_category]}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", competencyColour[r.competency])}>
                      {MONEY_COMPETENCY_LABEL[r.competency]}
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
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Child Voice</div>
                      <p className="text-sm text-[var(--cs-text-secondary)] italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Staff Observation</div>
                      <p className="text-sm text-[var(--cs-text-secondary)]">{r.staff_observation}</p>
                    </div>
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                      <div className="text-xs font-semibold text-emerald-700 uppercase mb-2">Practical examples</div>
                      <ul className="text-sm text-emerald-900 space-y-1">
                        {r.practical_examples.map((p, i) => (
                          <li key={i} className="flex gap-2"><span>·</span><span>{p}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                      <div className="text-xs font-semibold text-blue-800 uppercase mb-2">Real-world application</div>
                      <ul className="text-sm text-blue-900 space-y-1">
                        {r.real_world_application.map((p, i) => (
                          <li key={i} className="flex gap-2"><span>·</span><span>{p}</span></li>
                        ))}
                      </ul>
                    </div>
                    {r.tools_used.length ? (
                      <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                        <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Tools used</div>
                        <div className="flex flex-wrap gap-1.5">
                          {r.tools_used.map((t, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full border bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)] border-[var(--cs-cara-gold-soft)]">{t}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {r.challenges_faced.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Challenges</div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.challenges_faced.map((c, i) => (
                            <li key={i} className="flex gap-2"><span>!</span><span>{c}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.child_money_values_notes ? (
                      <div className="rounded-md border border-pink-200 bg-pink-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-pink-700 uppercase mb-2">Child money values</div>
                        <p className="text-sm text-pink-900">{r.child_money_values_notes}</p>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-sky-200 bg-sky-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-sky-800 uppercase mb-2">Next step</div>
                      <p className="text-sm text-sky-900">{r.next_step}</p>
                    </div>
                    <div className="lg:col-span-2">
                      <SmartLinkPanel sourceType="money-records" sourceId={r.id} childId={r.child_id} compact />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] p-4 text-sm text-[var(--cs-navy)]">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Practice is grounded in the Pathway Plan duty (Care Leavers (England) Regulations 2010), Quality Standard 6
          (Enjoyment & Achievement), Money & Pensions Service (MaPS) financial education guidance, FCA ScamSmart,
          HMRC tax literacy resources, and UNCRC Articles 12 (voice) and 28 (education). Critical preparation for
          leaving care: financial literacy is one of the strongest protective factors against post-care debt and
          exploitation.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Finance"
        category="finance"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Money Management & Budgeting — pocket money, savings, spending records, independent living skills, financial education, benefit transitions, Pathway Plan finance, LAC entitlements"
        recordType="direct_work"
        className="mt-6"
      />
    </PageShell>
  );
}
