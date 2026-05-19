"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Award,
  ArrowUpDown,
  Search,
  Users,
  Sparkles,
  Calendar,
  Heart,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { ChildExpertEntry, ExpertiseType } from "@/types/extended";
import { EXPERTISE_TYPE_LABEL } from "@/types/extended";
import { useChildExpertEntries } from "@/hooks/use-child-expert-entries";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── constants ─────────────────────────────────────────────────────────── */

const EXPERTISE_COLOUR: Record<ExpertiseType, string> = {
  care_planning_advice:         "bg-blue-100 text-blue-700",
  staff_training_contribution:  "bg-purple-100 text-purple-700",
  recruitment_panel:            "bg-green-100 text-green-700",
  policy_co_production:         "bg-amber-100 text-amber-700",
  service_improvement_input:    "bg-teal-100 text-teal-700",
  inspection_contribution:      "bg-indigo-100 text-indigo-700",
  external_speaking:            "bg-rose-100 text-rose-700",
  mentoring_younger_child:      "bg-pink-100 text-pink-700",
  research_participation:       "bg-cyan-100 text-cyan-700",
};

const expertDisplay = (id: string) => {
  if (id.startsWith("yp_")) return getYPName(id);
  if (id.startsWith("former_resident_")) {
    const name = id.replace("former_resident_", "");
    return `${name.charAt(0).toUpperCase()}${name.slice(1)} (former resident)`;
  }
  return id;
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function ChildrenAsExpertsPage() {
  const { data: res, isLoading } = useChildExpertEntries();
  const items = res?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterExpertise, setFilterExpertise] = useState("all");
  const [filterChild, setFilterChild] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const stats = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() - 90);
    const ninetyDaysAgo = now.toISOString().slice(0, 10);
    const byType: Record<string, number> = {};
    items.forEach((r) => {
      byType[r.expertise] = (byType[r.expertise] || 0) + 1;
    });
    return {
      total: items.length,
      byType,
      typeCount: Object.keys(byType).length,
      contributors: new Set(items.map((r) => r.child_id)).size,
      recent: items.filter((r) => r.date >= ninetyDaysAgo).length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (filterExpertise !== "all") list = list.filter((r) => r.expertise === filterExpertise);
    if (filterChild !== "all") list = list.filter((r) => r.child_id === filterChild);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.context.toLowerCase().includes(q) ||
          r.contribution.toLowerCase().includes(q) ||
          r.audience.toLowerCase().includes(q) ||
          r.impact_recorded.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "expertise": return a.expertise.localeCompare(b.expertise);
        case "child":     return expertDisplay(a.child_id).localeCompare(expertDisplay(b.child_id));
        default:          return b.date.localeCompare(a.date);
      }
    });
    return list;
  }, [items, filterExpertise, filterChild, search, sortBy]);

  const exportCols: ExportColumn<ChildExpertEntry>[] = [
    { header: "Date",              accessor: (r: ChildExpertEntry) => r.date },
    { header: "Child",             accessor: (r: ChildExpertEntry) => expertDisplay(r.child_id) },
    { header: "Expertise",         accessor: (r: ChildExpertEntry) => EXPERTISE_TYPE_LABEL[r.expertise] },
    { header: "Context",           accessor: (r: ChildExpertEntry) => r.context },
    { header: "Contribution",      accessor: (r: ChildExpertEntry) => r.contribution },
    { header: "Audience",          accessor: (r: ChildExpertEntry) => r.audience },
    { header: "Preparation",       accessor: (r: ChildExpertEntry) => r.preparation },
    { header: "Accommodations",    accessor: (r: ChildExpertEntry) => r.accommodations.join("; ") },
    { header: "Child Motivation",  accessor: (r: ChildExpertEntry) => r.child_motivation },
    { header: "Child Reflection",  accessor: (r: ChildExpertEntry) => r.child_reflection },
    { header: "Impact",            accessor: (r: ChildExpertEntry) => r.impact_recorded },
    { header: "Recognition",       accessor: (r: ChildExpertEntry) => r.recognition_given },
    { header: "Token of Thanks",   accessor: (r: ChildExpertEntry) => r.token_of_thanks },
    { header: "Long-term Learning",accessor: (r: ChildExpertEntry) => r.long_term_learning },
    { header: "Reviewed By",       accessor: (r: ChildExpertEntry) => getStaffName(r.reviewed_by) },
  ];

  const childIds = [...new Set(items.map((r) => r.child_id))];

  if (isLoading) {
    return (
      <PageShell
        title="Children as Experts by Experience"
        subtitle="UNCRC Article 12 · Quality Standard 1 — children advising the home, shaping policy, training staff, recruiting"
      >
        <div />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Children as Experts by Experience"
      subtitle="UNCRC Article 12 · Quality Standard 1 — children advising the home, shaping policy, training staff, recruiting"
      ariaContext={{ pageTitle: "Children as Experts", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={items} columns={exportCols} filename="children-as-experts" />
          <PrintButton title="Children as Experts by Experience" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Expert Entries",    v: stats.total,       icon: Award,    c: "text-amber-600" },
            { l: "Expertise Types",   v: stats.typeCount,   icon: Sparkles, c: "text-purple-600" },
            { l: "Children Contributing", v: stats.contributors, icon: Users, c: "text-blue-600" },
            { l: "Recent (90 days)",  v: stats.recent,      icon: Calendar, c: "text-green-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* By expertise type breakdown */}
        <div className="rounded-lg border bg-white p-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" /> By expertise type
          </h3>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(EXPERTISE_TYPE_LABEL) as [ExpertiseType, string][]).filter(([k]) => stats.byType[k]).map(([k, v]) => (
              <span key={k} className={cn("rounded-full px-3 py-1 text-xs font-medium", EXPERTISE_COLOUR[k])}>
                {v} · {stats.byType[k]}
              </span>
            ))}
          </div>
        </div>

        {/* Philosophy banner */}
        <div className="rounded-lg border-l-4 border-amber-400 bg-gradient-to-r from-amber-50 to-pink-50 p-5">
          <div className="flex items-start gap-3">
            <Heart className="h-6 w-6 text-rose-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-base font-semibold text-amber-900">
                &ldquo;The children who live here are the experts on this place.&rdquo;
              </p>
              <p className="mt-1 text-sm text-amber-800">
                Expertise by experience is real expertise. We log it, recognise it, pay for it where appropriate, and let it change how the home is run.
              </p>
            </div>
          </div>
        </div>

        {/* Filters & sort */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search context, contribution, impact…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterExpertise} onValueChange={setFilterExpertise}>
            <SelectTrigger className="w-[210px]"><SelectValue placeholder="Expertise" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All expertise types</SelectItem>
              {(Object.entries(EXPERTISE_TYPE_LABEL) as [ExpertiseType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterChild} onValueChange={setFilterChild}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Child" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All children</SelectItem>
              {childIds.map((id) => <SelectItem key={id} value={id}>{expertDisplay(id)}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="date">Date</option>
              <option value="expertise">Expertise</option>
              <option value="child">Child</option>
            </select>
          </div>
        </div>

        {/* Expandable cards */}
        {filtered.map((rec) => (
          <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-amber-600" />
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{expertDisplay(rec.child_id)}</h3>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", EXPERTISE_COLOUR[rec.expertise])}>
                      {EXPERTISE_TYPE_LABEL[rec.expertise]}
                    </span>
                    <span className="text-xs text-muted-foreground">{rec.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{rec.context}</p>
                </div>
              </div>
              {expandedId === rec.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expandedId === rec.id && (
              <div className="border-t p-4 space-y-4">
                <div className="rounded-lg bg-gray-50 p-3">
                  <h4 className="text-sm font-semibold mb-1">Context</h4>
                  <p className="text-sm text-muted-foreground">{rec.context}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-1">What the child did</h4>
                  <p className="text-sm text-muted-foreground">{rec.contribution}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <h4 className="text-sm font-semibold mb-1">Audience</h4>
                    <p className="text-sm text-muted-foreground">{rec.audience}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <h4 className="text-sm font-semibold mb-1">Preparation &amp; support</h4>
                    <p className="text-sm text-muted-foreground">{rec.preparation}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Accommodations that made it accessible</h4>
                  <ul className="list-disc list-inside text-sm text-blue-900 space-y-0.5">
                    {rec.accommodations.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                    <h4 className="text-sm font-semibold text-pink-800 mb-1">Why the child wanted to do it</h4>
                    <p className="text-sm text-pink-900 italic">&ldquo;{rec.child_motivation}&rdquo;</p>
                  </div>
                  <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                    <h4 className="text-sm font-semibold text-rose-800 mb-1">Child&apos;s reflection afterwards</h4>
                    <p className="text-sm text-rose-900 italic">&ldquo;{rec.child_reflection}&rdquo;</p>
                  </div>
                </div>

                <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                  <h4 className="text-sm font-semibold text-green-800 mb-1">Impact recorded</h4>
                  <p className="text-sm text-green-900">{rec.impact_recorded}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-sm font-semibold text-amber-800 mb-1">Recognition</h4>
                    <p className="text-sm text-amber-900">{rec.recognition_given}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-sm font-semibold text-amber-800 mb-1">Token of thanks</h4>
                    <p className="text-sm text-amber-900">{rec.token_of_thanks}</p>
                  </div>
                  <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                    <h4 className="text-sm font-semibold text-purple-800 mb-1">Long-term learning for the home</h4>
                    <p className="text-sm text-purple-900">{rec.long_term_learning}</p>
                  </div>
                </div>

                <SmartLinkPanel sourceType="child-expert-entry" sourceId={rec.id} childId={rec.child_id} compact />

                <div className="text-xs text-muted-foreground border-t pt-2">
                  Reviewed by <span className="font-medium">{getStaffName(rec.reviewed_by)}</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Regulatory note */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>UNCRC Article 12 &amp; Quality Standard 1 (Children&apos;s Views, Wishes and Feelings)</strong> — Children must be supported not just to give views about their own care, but to influence the home itself. Recording instances of children acting as experts by experience evidences that the home treats children&apos;s expertise as real expertise: prepared for, accommodated, recognised, paid for where appropriate, and translated into lasting change. Participation must always be genuinely optional, never tokenistic, and accessible — the child sets the terms.
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
        pageContext="Children as Experts — participation, child voice, lived experience, peer mentoring, expert by experience, review contributions, co-production, advocacy, rights"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
