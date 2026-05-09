"use client";

import { useState, useMemo } from "react";
import {
  Scale,
  BookOpen,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Award,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn, formatDate } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RightsLiteracyRecord, RightsKnowledgeLevel } from "@/types/extended";
import { RIGHTS_KNOWLEDGE_LEVEL_LABEL } from "@/types/extended";
import { useRightsLiteracyRecords } from "@/hooks/use-rights-literacy-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────── */

const LEVEL_META: Record<RightsKnowledgeLevel, { colour: string; weight: number }> = {
  doesnt_know:          { colour: "bg-rose-100 text-rose-800",      weight: 0 },
  has_heard_of:         { colour: "bg-amber-100 text-amber-800",    weight: 1 },
  understands_basics:   { colour: "bg-yellow-100 text-yellow-800",  weight: 2 },
  confident:            { colour: "bg-teal-100 text-teal-800",      weight: 3 },
  can_explain_to_others:{ colour: "bg-emerald-100 text-emerald-800", weight: 4 },
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function ChildRightsLiteracyTrackerPage() {
  const { data: res, isLoading } = useRightsLiteracyRecords();
  const items = res?.data ?? [];

  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterChild, setFilterChild] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const childrenOptions = useMemo(() => {
    const ids = Array.from(new Set(items.map((r) => r.child_id)));
    return ids.map((id) => ({ id, name: getYPName(id) }));
  }, [items]);

  const stats = useMemo(() => {
    const withPlans = items.filter((r) => !!r.learning_plan_this_quarter).length;
    const confident = items.filter((r) => {
      const avg =
        r.rights_knowledge.reduce((sum, k) => sum + LEVEL_META[k.level].weight, 0) /
        Math.max(1, r.rights_knowledge.length);
      return avg >= 2.5;
    }).length;
    const advocates = items.filter((r) => !!r.knows_advocate_name).length;
    const reviewsDue60 = items.filter((r) => {
      const reviewDt = new Date(r.review_date).getTime();
      const todayDt = new Date(today).getTime();
      const diffDays = (reviewDt - todayDt) / (1000 * 60 * 60 * 24);
      return diffDays <= 60;
    }).length;
    return { withPlans, confident, advocates, reviewsDue60 };
  }, [items, today]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (filterChild !== "all") list = list.filter((r) => r.child_id === filterChild);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.child_id).toLowerCase().includes(q) ||
          r.child_voice.toLowerCase().includes(q) ||
          r.staff_observation.toLowerCase().includes(q) ||
          r.rights_knowledge.some((k) => k.right.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "child":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "review":
          return a.review_date.localeCompare(b.review_date);
        case "knowledge": {
          const avgA =
            a.rights_knowledge.reduce((s, k) => s + LEVEL_META[k.level].weight, 0) /
            Math.max(1, a.rights_knowledge.length);
          const avgB =
            b.rights_knowledge.reduce((s, k) => s + LEVEL_META[k.level].weight, 0) /
            Math.max(1, b.rights_knowledge.length);
          return avgB - avgA;
        }
        default:
          return b.recorded_date.localeCompare(a.recorded_date);
      }
    });
    return list;
  }, [items, filterChild, search, sortBy]);

  const exportCols: ExportColumn<RightsLiteracyRecord>[] = [
    { header: "Young Person",            accessor: (r: RightsLiteracyRecord) => getYPName(r.child_id) },
    { header: "Recorded",                accessor: (r: RightsLiteracyRecord) => r.recorded_date },
    { header: "Rights Knowledge",        accessor: (r: RightsLiteracyRecord) => r.rights_knowledge.map((k) => `${k.right}: ${RIGHTS_KNOWLEDGE_LEVEL_LABEL[k.level]}`).join("; ") },
    { header: "Knows How To Complain",   accessor: (r: RightsLiteracyRecord) => (r.knows_how_to_complain ? "Yes" : "No") },
    { header: "Advocate",                accessor: (r: RightsLiteracyRecord) => r.knows_advocate_name || "" },
    { header: "Independent Visitor",     accessor: (r: RightsLiteracyRecord) => r.knows_independent_visitor_name || "" },
    { header: "Knows Ofsted Contact",    accessor: (r: RightsLiteracyRecord) => (r.knows_how_to_contact_ofsted ? "Yes" : "No") },
    { header: "Knows Records Right",     accessor: (r: RightsLiteracyRecord) => (r.knows_right_to_access_records ? "Yes" : "No") },
    { header: "Knows Refuse Contact",    accessor: (r: RightsLiteracyRecord) => (r.knows_right_to_refuse_contact ? "Yes" : "No") },
    { header: "Has Used Rights",         accessor: (r: RightsLiteracyRecord) => r.has_used_rights.map((h) => `${h.date} — ${h.what} (${h.outcome})`).join("; ") },
    { header: "Learning Plan",           accessor: (r: RightsLiteracyRecord) => r.learning_plan_this_quarter || "" },
    { header: "Resources Used",          accessor: (r: RightsLiteracyRecord) => r.resources_used.join("; ") },
    { header: "Child Voice",             accessor: (r: RightsLiteracyRecord) => r.child_voice },
    { header: "Staff Observation",       accessor: (r: RightsLiteracyRecord) => r.staff_observation },
    { header: "Review Date",             accessor: (r: RightsLiteracyRecord) => r.review_date },
    { header: "Key Worker",              accessor: (r: RightsLiteracyRecord) => getStaffName(r.key_worker) },
  ];

  if (isLoading) {
    return (
      <PageShell title="Child Rights Literacy Tracker" subtitle="Loading…">
        <div />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Child Rights Literacy Tracker"
      subtitle="Per-child rights knowledge, advocacy connections and empowerment learning — UNCRC, CHR 2015, Children Act 1989"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={items} columns={exportCols} filename="child-rights-literacy" />
          <PrintButton title="Children's Rights Literacy" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { l: "Children with literacy plans", v: stats.withPlans,    icon: BookOpen,    c: "text-sky-600" },
            { l: "Confident in their rights",    v: stats.confident,    icon: Award,       c: "text-teal-600" },
            { l: "Advocates assigned",           v: stats.advocates,    icon: ShieldCheck, c: "text-emerald-600" },
            { l: "Reviews due (60d)",            v: stats.reviewsDue60, icon: Scale,       c: "text-amber-600" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-lg border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-teal-50 p-4 text-center shadow-sm"
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
              placeholder="Search child, right, voice or observation…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterChild} onValueChange={setFilterChild}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Child" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All children</SelectItem>
              {childrenOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Recorded date</SelectItem>
                <SelectItem value="child">Child name</SelectItem>
                <SelectItem value="review">Review date</SelectItem>
                <SelectItem value="knowledge">Knowledge level</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cards */}
        {filtered.map((rec) => {
          const isOpen = expanded === rec.id;
          const avg =
            rec.rights_knowledge.reduce((s, k) => s + LEVEL_META[k.level].weight, 0) /
            Math.max(1, rec.rights_knowledge.length);
          const headlineLevel: RightsKnowledgeLevel =
            avg >= 3.25 ? "can_explain_to_others" :
            avg >= 2.5  ? "confident" :
            avg >= 1.5  ? "understands_basics" :
            avg >= 0.75 ? "has_heard_of" :
                          "doesnt_know";

          return (
            <div
              key={rec.id}
              className="rounded-lg border border-sky-100 bg-white overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : rec.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-sky-50/50 transition"
              >
                <div className="flex items-start gap-3 text-left">
                  <div className="rounded-full bg-gradient-to-br from-sky-100 to-teal-100 p-2">
                    <Scale className="h-5 w-5 text-sky-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{getYPName(rec.child_id)}</h3>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          LEVEL_META[headlineLevel].colour
                        )}
                      >
                        {RIGHTS_KNOWLEDGE_LEVEL_LABEL[headlineLevel]}
                      </span>
                      {rec.knows_advocate_name && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          Advocate: {rec.knows_advocate_name}
                        </span>
                      )}
                      {rec.knows_independent_visitor_name && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                          IV: {rec.knows_independent_visitor_name}
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          rec.knows_how_to_complain
                            ? "bg-teal-100 text-teal-800"
                            : "bg-rose-100 text-rose-800"
                        )}
                      >
                        {rec.knows_how_to_complain ? "Knows how to complain" : "Complaints route gap"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Recorded {formatDate(rec.recorded_date)} · Review {formatDate(rec.review_date)} · Key worker {getStaffName(rec.key_worker)}
                    </p>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {isOpen && (
                <div className="border-t border-sky-100 bg-gradient-to-b from-sky-50/40 to-white p-5 space-y-5">
                  {/* Rights knowledge map */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-sky-700 font-semibold mb-2">
                      Rights knowledge map
                    </p>
                    <ul className="space-y-1.5">
                      {rec.rights_knowledge.map((k, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between gap-3 rounded-md border bg-white px-3 py-1.5 text-sm"
                        >
                          <span className="text-gray-900">{k.right}</span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                              LEVEL_META[k.level].colour
                            )}
                          >
                            {RIGHTS_KNOWLEDGE_LEVEL_LABEL[k.level]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Specific knowledge flags */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { label: "Knows complaints route", val: rec.knows_how_to_complain },
                      { label: "Knows Ofsted contact",   val: rec.knows_how_to_contact_ofsted },
                      { label: "Knows records right",    val: rec.knows_right_to_access_records },
                      { label: "Knows refuse contact",   val: rec.knows_right_to_refuse_contact },
                      { label: "Has advocate named",     val: !!rec.knows_advocate_name },
                      { label: "Has IV named",           val: !!rec.knows_independent_visitor_name },
                    ].map((f) => (
                      <div
                        key={f.label}
                        className={cn(
                          "rounded-md border px-3 py-2 text-xs font-medium flex items-center justify-between",
                          f.val
                            ? "border-teal-200 bg-teal-50 text-teal-900"
                            : "border-rose-200 bg-rose-50 text-rose-900"
                        )}
                      >
                        <span>{f.label}</span>
                        <span>{f.val ? "Yes" : "No"}</span>
                      </div>
                    ))}
                  </div>

                  {/* Has used rights */}
                  {rec.has_used_rights.length > 0 && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                      <p className="text-xs uppercase tracking-wide text-emerald-800 font-semibold mb-2">
                        Times rights have been used
                      </p>
                      <ul className="space-y-2 text-sm text-emerald-950">
                        {rec.has_used_rights.map((h, i) => (
                          <li key={i} className="border-l-2 border-emerald-300 pl-3">
                            <p className="font-medium">{h.what}</p>
                            <p className="text-xs text-emerald-800">{formatDate(h.date)}</p>
                            <p className="text-sm">{h.outcome}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Learning plan + resources */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-sky-800 font-semibold mb-2">
                        Learning plan this quarter
                      </p>
                      {rec.learning_plan_this_quarter ? (
                        <p className="text-sm text-sky-900">{rec.learning_plan_this_quarter}</p>
                      ) : (
                        <p className="text-sm italic text-sky-900/70">No active plan.</p>
                      )}
                    </div>

                    <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-teal-800 font-semibold mb-2">
                        Resources used
                      </p>
                      {rec.resources_used.length ? (
                        <ul className="space-y-1 text-sm text-teal-900">
                          {rec.resources_used.map((s, i) => (
                            <li key={i} className="flex gap-2">
                              <span aria-hidden>•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm italic text-teal-900/70">None recorded.</p>
                      )}
                    </div>
                  </div>

                  {/* Voice + observation */}
                  <div className="rounded-lg border border-rose-100 bg-rose-50/60 p-3">
                    <p className="text-xs uppercase tracking-wide text-rose-700 font-semibold mb-1">
                      Child voice
                    </p>
                    <p className="text-sm italic text-rose-950 leading-relaxed">
                      &ldquo;{rec.child_voice}&rdquo;
                    </p>
                  </div>

                  <div className="rounded-lg border bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                      Staff observation
                    </p>
                    <p className="text-sm text-gray-800 leading-relaxed">{rec.staff_observation}</p>
                  </div>

                  {/* Smart link panel */}
                  <SmartLinkPanel sourceType="rights-literacy-records" sourceId={rec.id} childId={rec.child_id} compact />
                </div>
              )}
            </div>
          );
        })}

        {/* Regulatory footer */}
        <div className="rounded-lg border-l-4 border-sky-400 bg-gradient-to-r from-sky-50 via-white to-teal-50 p-4 text-sm text-gray-800 space-y-1">
          <p>
            <strong>UNCRC</strong> — Articles 12 (voice), 13 (expression), 14 (thought), 16 (privacy),
            17 (information), 19 (protection from harm), 25 (review of placement), 28 (education), 29
            (development of personality and abilities). Children have the right to know their rights —
            rights literacy is itself a right.
          </p>
          <p>
            <strong>Children&apos;s Homes (England) Regulations 2015</strong> — Reg 7 (children&apos;s
            views, wishes and feelings, including access to advocacy) and Reg 39 (complaints procedure
            and the duty to ensure children know how to make a complaint and to whom).
          </p>
          <p>
            <strong>Children Act 1989 s.26</strong> — duty to establish and operate a representations
            and complaints procedure for looked-after children. Coupled with{" "}
            <strong>Independent Visitor regulations</strong> (CA 1989 Sch 2 para 17 / Care Planning
            Regs 2010 Reg 47), every eligible child should know who their IV is and how to contact
            them.
          </p>
          <p>
            <strong>Ofsted complaints route</strong> — children have the right to complain directly to
            Ofsted (enquiries@ofsted.gov.uk / 0300 123 1231). The home must ensure this route is
            accessible, age-appropriate and not gate-kept by staff.
          </p>
          <p>
            <strong>Data Protection Act 2018 / UK GDPR</strong> — children have the right to access
            their own records (Subject Access Request), with appropriate scaffolding given the
            emotional weight of file content.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
