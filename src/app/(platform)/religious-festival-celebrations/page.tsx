"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Calendar,
  Users,
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
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { useReligiousFestivalRecords } from "@/hooks/use-religious-festival-records";
import type { ReligiousFestivalRecord, ReligiousFestivalFaith } from "@/types/extended";
import { RELIGIOUS_FESTIVAL_FAITH_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── local colour map ─────────────────────────────────────────────── */

const faithColour: Record<ReligiousFestivalFaith, string> = {
  islam: "bg-emerald-100 text-emerald-800 border-emerald-200",
  christianity: "bg-red-100 text-red-800 border-red-200",
  hinduism: "bg-amber-100 text-amber-800 border-amber-200",
  sikhism: "bg-orange-100 text-orange-800 border-orange-200",
  judaism: "bg-blue-100 text-blue-800 border-blue-200",
  buddhism: "bg-yellow-100 text-yellow-800 border-yellow-200",
  rastafari: "bg-green-100 text-green-800 border-green-200",
  secular: "bg-slate-100 text-[var(--cs-navy)] border-[var(--cs-border)]",
  other_multi_faith: "bg-purple-100 text-purple-800 border-purple-200",
};

/* ── helpers ───────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── page ──────────────────────────────────────────────────────────── */

export default function ReligiousFestivalCelebrationsPage() {
  const { data: records = [], isLoading } = useReligiousFestivalRecords();
  const [search, setSearch] = useState("");
  const [faithFilter, setFaithFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "festival" | "faith">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        rec.festival.toLowerCase().includes(search.toLowerCase()) ||
        rec.children_involved.some((c) => getYPName(c).toLowerCase().includes(search.toLowerCase()));
      const matchesFaith = faithFilter === "all" || rec.faith === faithFilter;
      return matchesSearch && matchesFaith;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "festival") return a.festival.localeCompare(b.festival);
      if (sortBy === "faith") return a.faith.localeCompare(b.faith);
      return b.date.localeCompare(a.date);
    });
    return r;
  }, [records, search, faithFilter, sortBy]);

  const stats = useMemo(() => {
    const today = d(0);
    const upcoming = records.filter((r) => r.date > today).length;
    const childLed = records.filter((r) => r.led_by_child).length;
    const totalSpent = records.reduce((acc, r) => acc + r.spent, 0);
    const distinctFaiths = new Set(records.map((r) => r.faith)).size;
    return { upcoming, childLed, totalSpent, distinctFaiths };
  }, [records]);

  const exportCols: ExportColumn<ReligiousFestivalRecord>[] = [
    { header: "Festival", accessor: (r) => r.festival },
    { header: "Faith", accessor: (r) => RELIGIOUS_FESTIVAL_FAITH_LABEL[r.faith] },
    { header: "Date", accessor: (r) => r.date },
    { header: "Children Involved", accessor: (r) => r.children_involved.map(getYPName).join("; ") },
    { header: "Led by Child", accessor: (r) => (r.led_by_child ? getYPName(r.led_by_child) : "—") },
    { header: "Budget", accessor: (r) => `£${r.budget.toFixed(2)}` },
    { header: "Spent", accessor: (r) => `£${r.spent.toFixed(2)}` },
    { header: "Food", accessor: (r) => r.food.join("; ") },
    { header: "Rituals Observed", accessor: (r) => r.rituals_observed.join("; ") },
    { header: "Child Voice", accessor: (r) => r.child_voice },
    { header: "Reflections", accessor: (r) => r.reflections },
    { header: "Recorded By", accessor: (r) => getStaffName(r.recorded_by) },
  ];

  if (isLoading) {
    return (
      <PageShell title="Religious & Cultural Festival Celebrations">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Religious & Cultural Festival Celebrations"
      ariaContext={{ pageTitle: "Religious & Cultural Festival Celebrations", sourceType: "child_record" }}
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="religious-festival-celebrations" />
          <PrintButton title="Religious & Cultural Festival Celebrations" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Calendar className="h-4 w-4" />
            <span>Upcoming festivals</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.upcoming}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Heart className="h-4 w-4" />
            <span>Child-led celebrations</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.childLed}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Sparkles className="h-4 w-4" />
            <span>Distinct faiths</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.distinctFaiths}</div>
        </div>
        <div className="rounded-lg border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <Users className="h-4 w-4" />
            <span>Total spent</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">£{stats.totalSpent.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--cs-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search festival or child..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--cs-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={faithFilter} onValueChange={setFaithFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Faith" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All faiths</SelectItem>
            {(Object.keys(RELIGIOUS_FESTIVAL_FAITH_LABEL) as ReligiousFestivalFaith[]).map((k) => (
              <SelectItem key={k} value={k}>{RELIGIOUS_FESTIVAL_FAITH_LABEL[k]}</SelectItem>
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
            <SelectItem value="festival">Festival A→Z</SelectItem>
            <SelectItem value="faith">Faith A→Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isOpen = expandedId === r.id;
          const upcoming = r.date > d(0);
          return (
            <div key={r.id} className="rounded-lg border border-[var(--cs-border)] bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : r.id)}
                className="w-full p-4 flex items-start justify-between gap-3 hover:bg-[var(--cs-surface)] text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-[var(--cs-navy)]">{r.festival}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", faithColour[r.faith])}>
                      {RELIGIOUS_FESTIVAL_FAITH_LABEL[r.faith]}
                    </span>
                    {r.led_by_child ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-pink-100 text-pink-800 border-pink-200">
                        Led by {getYPName(r.led_by_child)}
                      </span>
                    ) : null}
                    {upcoming ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                        Upcoming
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-[var(--cs-text-secondary)]">
                    {r.date} · {r.children_involved.map(getYPName).join(", ")} · £{r.spent.toFixed(2)} of £{r.budget.toFixed(2)}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-[var(--cs-text-muted)]" /> : <ChevronDown className="h-5 w-5 text-[var(--cs-text-muted)]" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-[var(--cs-border-subtle)] bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Child Voice</div>
                      <p className="text-sm text-[var(--cs-text-secondary)] italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Staff Observation</div>
                      <p className="text-sm text-[var(--cs-text-secondary)]">{r.staff_observation}</p>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Preparation</div>
                      <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                        {r.preparation.map((t, i) => (
                          <li key={i} className="flex gap-2"><span className="text-[var(--cs-text-muted)]">·</span><span>{t}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Food</div>
                      <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                        {r.food.map((t, i) => (
                          <li key={i} className="flex gap-2"><span className="text-[var(--cs-text-muted)]">·</span><span>{t}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Rituals Observed</div>
                      <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                        {r.rituals_observed.map((t, i) => (
                          <li key={i} className="flex gap-2"><span className="text-emerald-500">·</span><span>{t}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Child-Chosen Aspects</div>
                      <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                        {r.child_chosen_aspects.map((t, i) => (
                          <li key={i} className="flex gap-2"><span className="text-pink-500">·</span><span>{t}</span></li>
                        ))}
                      </ul>
                    </div>
                    {r.guests_invited.length ? (
                      <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                        <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Guests</div>
                        <ul className="text-sm text-[var(--cs-text-secondary)] space-y-1">
                          {r.guests_invited.map((t, i) => (
                            <li key={i} className="flex gap-2"><span className="text-[var(--cs-text-muted)]">·</span><span>{t}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.improvements_for_next_time.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">For next time</div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.improvements_for_next_time.map((t, i) => (
                            <li key={i} className="flex gap-2"><span>→</span><span>{t}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Reflections</div>
                      <p className="text-sm text-[var(--cs-text-secondary)]">{r.reflections}</p>
                      <div className="text-xs text-[var(--cs-text-muted)] mt-2">Recorded by {getStaffName(r.recorded_by)}</div>
                    </div>
                  </div>
                  {r.children_involved.length > 0 && (
                    <div className="mt-4">
                      <SmartLinkPanel sourceType="religious-festival-record" sourceId={r.id} childId={r.children_involved[0]} compact />
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Religious and cultural festivals are central to identity and belonging. Practice is grounded in Quality
          Standard 6 (Enjoyment & Achievement) and the Equality Act 2010 (religion or belief). Children lead the design
          of their own festivals where possible, with staff resourcing and joining respectfully. Children of other faiths
          (or no faith) are invited but never required to participate. The Statement of Purpose, UNCRC Articles 14
          (freedom of thought, conscience and religion) and 30 (cultural identity), and the home&rsquo;s Equality &
          Diversity policy underpin this work.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Activities & Wellbeing"
        category={["activity", "wellbeing"]}
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Religious & Cultural Festival Celebrations — cultural celebrations, religious observance, identity, faith practices, cultural planning, care plan cultural needs, diversity evidence, Reg 45"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
