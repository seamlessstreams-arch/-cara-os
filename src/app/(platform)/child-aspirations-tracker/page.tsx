"use client";

import { useState, useMemo } from "react";
import {
  Star,
  Compass,
  Sparkles,
  Heart,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Loader2,
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
import type { AspirationRecord, AspirationDomain, AspirationRealism } from "@/types/extended";
import { ASPIRATION_DOMAIN_LABEL, ASPIRATION_REALISM_LABEL } from "@/types/extended";
import { useAspirationRecords } from "@/hooks/use-aspiration-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── constants ─────────────────────────────────────────────────────────── */

const DOMAIN_META: Record<AspirationDomain, { colour: string; icon: typeof Star }> = {
  career:                 { colour: "bg-amber-100 text-amber-800",     icon: Compass },
  education:              { colour: "bg-sky-100 text-sky-800",         icon: Sparkles },
  where_ill_live:         { colour: "bg-emerald-100 text-emerald-800", icon: Heart },
  family_i_want:          { colour: "bg-rose-100 text-rose-800",       icon: Heart },
  skills_i_want:          { colour: "bg-indigo-100 text-indigo-800",   icon: Sparkles },
  travel:                 { colour: "bg-cyan-100 text-cyan-800",       icon: Compass },
  identity_and_belonging: { colour: "bg-orange-100 text-orange-800",   icon: Star },
  relationships:          { colour: "bg-pink-100 text-pink-800",       icon: Heart },
  wellbeing:              { colour: "bg-teal-100 text-teal-800",       icon: Sparkles },
  creative:               { colour: "bg-purple-100 text-purple-800",   icon: Sparkles },
};

const REALISM_META: Record<AspirationRealism, { colour: string }> = {
  very_achievable:         { colour: "bg-green-100 text-green-800" },
  achievable_with_support: { colour: "bg-emerald-100 text-emerald-800" },
  stretch_goal:            { colour: "bg-amber-100 text-amber-800" },
  big_dream_long_term:     { colour: "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-navy)]" },
};

const REALISM_ORDER: Record<AspirationRealism, number> = {
  very_achievable: 0,
  achievable_with_support: 1,
  stretch_goal: 2,
  big_dream_long_term: 3,
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function ChildAspirationsTrackerPage() {
  const { data: resp, isLoading } = useAspirationRecords();
  const data = resp?.data ?? [];
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const stats = useMemo(() => {
    const stretch = data.filter(
      (r) => r.current_realism === "stretch_goal" || r.current_realism === "big_dream_long_term"
    ).length;
    const reviewsDue = data.filter((r) => r.review_date <= today).length;
    const childrenWithPlans = new Set(data.map((r) => r.child_id)).size;
    return {
      total: data.length,
      stretch,
      reviewsDue,
      childrenWithPlans,
    };
  }, [data, today]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterDomain !== "all") list = list.filter((r) => r.domain === filterDomain);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.aspiration.toLowerCase().includes(q) ||
          r.why_it_matters.toLowerCase().includes(q) ||
          getYPName(r.child_id).toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "child":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "domain":
          return a.domain.localeCompare(b.domain);
        case "realism":
          return REALISM_ORDER[a.current_realism] - REALISM_ORDER[b.current_realism];
        default:
          return b.recorded_date.localeCompare(a.recorded_date);
      }
    });
    return list;
  }, [data, filterDomain, search, sortBy]);

  const exportCols: ExportColumn<AspirationRecord>[] = [
    { header: "Young Person",   accessor: (r: AspirationRecord) => getYPName(r.child_id) },
    { header: "Recorded",       accessor: (r: AspirationRecord) => r.recorded_date },
    { header: "Domain",         accessor: (r: AspirationRecord) => ASPIRATION_DOMAIN_LABEL[r.domain] },
    { header: "Aspiration",     accessor: (r: AspirationRecord) => r.aspiration },
    { header: "Why it matters", accessor: (r: AspirationRecord) => r.why_it_matters },
    { header: "Realism",        accessor: (r: AspirationRecord) => ASPIRATION_REALISM_LABEL[r.current_realism] },
    { header: "Steps Taken",    accessor: (r: AspirationRecord) => r.steps_taken.join("; ") },
    { header: "Steps Next",     accessor: (r: AspirationRecord) => r.steps_next.join("; ") },
    { header: "Support Needed", accessor: (r: AspirationRecord) => r.support_needed.join("; ") },
    { header: "Blockers",       accessor: (r: AspirationRecord) => r.blockers.join("; ") },
    { header: "Evolved From",   accessor: (r: AspirationRecord) => r.evolved_from_previous || "" },
    { header: "Child Chose",    accessor: (r: AspirationRecord) => (r.child_chose ? "Yes" : "No") },
    { header: "Review Date",    accessor: (r: AspirationRecord) => r.review_date },
    { header: "Key Worker",     accessor: (r: AspirationRecord) => getStaffName(r.key_worker) },
  ];

  if (isLoading) {
    return (
      <PageShell
        title="Child Aspirations Tracker"
        subtitle="Hopes, dreams and ambitions — child-led, evolving over time, woven into care planning"
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Child Aspirations Tracker"
      subtitle="Hopes, dreams and ambitions — child-led, evolving over time, woven into care planning"
      ariaContext={{ pageTitle: "Child Aspirations Tracker", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="child-aspirations" />
          <PrintButton title="Child Aspirations Tracker" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { l: "Aspirations tracked",       v: stats.total,              icon: Star,     c: "text-amber-600" },
            { l: "Stretch goals",             v: stats.stretch,            icon: Sparkles, c: "text-[var(--cs-aria-gold)]" },
            { l: "Reviews due",               v: stats.reviewsDue,         icon: Compass,  c: "text-sky-600" },
            { l: "Children with active plans", v: stats.childrenWithPlans, icon: Heart,    c: "text-rose-600" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-4 text-center shadow-sm"
            >
              <s.icon className={cn("mx-auto h-6 w-6 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search aspirations, child, or why it matters…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterDomain} onValueChange={setFilterDomain}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All domains</SelectItem>
              {(Object.keys(ASPIRATION_DOMAIN_LABEL) as AspirationDomain[]).map((d) => (
                <SelectItem key={d} value={d}>
                  {ASPIRATION_DOMAIN_LABEL[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Recorded date</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="domain">Domain</SelectItem>
                <SelectItem value="realism">Realism</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cards */}
        {filtered.map((rec) => {
          const DomainIcon = DOMAIN_META[rec.domain].icon;
          const isOpen = expanded === rec.id;
          return (
            <div
              key={rec.id}
              className="rounded-lg border border-amber-100 bg-white overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : rec.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-amber-50/50 transition"
              >
                <div className="flex items-start gap-3 text-left">
                  <div className="rounded-full bg-gradient-to-br from-amber-100 to-sky-100 p-2">
                    <DomainIcon className="h-5 w-5 text-amber-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{getYPName(rec.child_id)}</h3>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          DOMAIN_META[rec.domain].colour
                        )}
                      >
                        {ASPIRATION_DOMAIN_LABEL[rec.domain]}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          REALISM_META[rec.current_realism].colour
                        )}
                      >
                        {ASPIRATION_REALISM_LABEL[rec.current_realism]}
                      </span>
                      {rec.child_chose && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
                          Child chose
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                      {rec.aspiration}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Recorded {rec.recorded_date} · Review {rec.review_date}
                    </p>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {isOpen && (
                <div className="border-t border-amber-100 bg-gradient-to-b from-amber-50/40 to-white p-5 space-y-5">
                  {/* Aspiration BIG */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold">
                      Aspiration
                    </p>
                    <p className="mt-1 text-xl md:text-2xl font-semibold leading-snug text-gray-900">
                      &ldquo;{rec.aspiration}&rdquo;
                    </p>
                  </div>

                  {/* Why it matters */}
                  <div className="rounded-lg border border-rose-100 bg-rose-50/60 p-3">
                    <p className="text-xs uppercase tracking-wide text-rose-700 font-semibold mb-1">
                      Why it matters
                    </p>
                    <p className="text-sm italic text-rose-900 leading-relaxed">
                      {rec.why_it_matters}
                    </p>
                  </div>

                  {/* Steps grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-green-800 font-semibold mb-2">
                        Steps taken
                      </p>
                      {rec.steps_taken.length ? (
                        <ul className="space-y-1 text-sm text-green-900">
                          {rec.steps_taken.map((s, i) => (
                            <li key={i} className="flex gap-2">
                              <span aria-hidden>•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-green-900/70 italic">None yet.</p>
                      )}
                    </div>

                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-blue-800 font-semibold mb-2">
                        Next steps
                      </p>
                      {rec.steps_next.length ? (
                        <ul className="space-y-1 text-sm text-blue-900">
                          {rec.steps_next.map((s, i) => (
                            <li key={i} className="flex gap-2">
                              <span aria-hidden>•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-blue-900/70 italic">None planned.</p>
                      )}
                    </div>
                  </div>

                  {/* Support + blockers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-white p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                        Support needed
                      </p>
                      {rec.support_needed.length ? (
                        <ul className="space-y-1 text-sm text-gray-800">
                          {rec.support_needed.map((s, i) => (
                            <li key={i} className="flex gap-2">
                              <span aria-hidden>•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No specific support needed.</p>
                      )}
                    </div>

                    <div className="rounded-lg border bg-white p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                        Blockers
                      </p>
                      {rec.blockers.length ? (
                        <ul className="space-y-1 text-sm text-gray-800">
                          {rec.blockers.map((s, i) => (
                            <li key={i} className="flex gap-2">
                              <span aria-hidden>•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No current blockers.</p>
                      )}
                    </div>
                  </div>

                  {/* Evolved + key worker */}
                  {rec.evolved_from_previous && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                      <p className="text-xs uppercase tracking-wide text-amber-800 font-semibold mb-1">
                        Evolved from previous version
                      </p>
                      <p className="text-sm text-amber-900">{rec.evolved_from_previous}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-100 text-sm">
                    <div className="text-muted-foreground">
                      Key worker: <span className="text-gray-900 font-medium">{getStaffName(rec.key_worker)}</span>
                    </div>
                    <div className="text-muted-foreground">
                      Next review: <span className="text-gray-900 font-medium">{rec.review_date}</span>
                    </div>
                  </div>

                  <SmartLinkPanel sourceType="aspiration-record" sourceId={rec.id} childId={rec.child_id} compact />
                </div>
              )}
            </div>
          );
        })}

        {/* Regulatory footer */}
        <div className="rounded-lg border-l-4 border-amber-400 bg-gradient-to-r from-amber-50 via-white to-sky-50 p-4 text-sm text-gray-800 space-y-1">
          <p>
            <strong>UNCRC Article 12 (voice)</strong> &amp;{" "}
            <strong>Article 29 (development of personality, talents and abilities)</strong> — Children
            have the right to express their views in matters affecting them and to grow into the fullest
            version of themselves. Aspirations are recorded in the child&apos;s own words wherever possible.
          </p>
          <p>
            <strong>Children&apos;s Homes Quality Standards</strong> —{" "}
            <strong>QS 5 (Education)</strong> and{" "}
            <strong>QS 6 (Enjoyment &amp; Achievement)</strong>. Aspirations evidence the home&apos;s
            commitment to high expectations, individualised goals, and recognition of each child&apos;s
            wider talents and identity.
          </p>
          <p>
            <strong>Pathway Plan integration</strong> — for children aged 16+, aspirations recorded here
            should be carried into the Pathway Plan and reviewed alongside the PA, ensuring continuity of
            ambition into care leaver support up to age 25.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Child Aspirations Tracker — goals, dreams, future plans, career interests, hobbies, vocational training, higher education, personal achievements, PEP targets, Reg 45 positive outcomes"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
