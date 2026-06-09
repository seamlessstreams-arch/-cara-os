"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { useParticipationEntries } from "@/hooks/use-participation-entries";
import type { ParticipationEntry } from "@/types/extended";
import { PARTICIPATION_CATEGORY_LABEL, PARTICIPATION_EVIDENCE_TYPE_LABEL } from "@/types/extended";
import {
  ChevronUp,
  ChevronDown,
  MessageCircle,
  CheckCircle2,
  Star,
  Users,
  ArrowUpDown,
  Lightbulb,
  Heart,
  Loader2,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const exportCols: ExportColumn<ParticipationEntry>[] = [
  { header: "Date", accessor: (r) => r.date },
  { header: "Context", accessor: (r) => r.context },
  { header: "Category", accessor: (r) => PARTICIPATION_CATEGORY_LABEL[r.category] },
  { header: "Children Involved", accessor: (r) => r.children_involved.map((c) => getYPName(c)).join(", ") },
  { header: "How Consulted", accessor: (r) => r.how_consulted },
  { header: "Child Said", accessor: (r) => r.what_child_said },
  { header: "Decision", accessor: (r) => r.decision_made },
  { header: "Influenced", accessor: (r) => r.child_influenced ? "Yes" : "No" },
  { header: "Influence Description", accessor: (r) => r.influence_description },
  { header: "Recorded By", accessor: (r) => getStaffName(r.recorded_by) },
];

const categoryColor = (cat: string) => {
  const colors: Record<string, string> = {
    care_planning: "bg-blue-100 text-blue-800",
    house_rules: "bg-purple-100 text-purple-800",
    activities: "bg-green-100 text-green-800",
    environment: "bg-amber-100 text-amber-800",
    staffing: "bg-indigo-100 text-indigo-800",
    complaints: "bg-red-100 text-red-800",
    menu: "bg-pink-100 text-pink-800",
    policy: "bg-slate-100 text-[var(--cs-navy)]",
  };
  return colors[cat] ?? "bg-gray-100 text-gray-800";
};

export default function ChildParticipationLogPage() {
  const { data: res, isLoading } = useParticipationEntries();
  const entries = useMemo(() => res?.data ?? [], [res]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterChild, setFilterChild] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filtered = useMemo(() => {
    let list = [...entries];
    if (filterCategory !== "all") list = list.filter((r) => r.category === filterCategory);
    if (filterChild !== "all") list = list.filter((r) => r.children_involved.includes(filterChild));
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "category":
          return a.category.localeCompare(b.category);
        case "context":
          return a.context.localeCompare(b.context);
        default:
          return 0;
      }
    });
    return list;
  }, [entries, filterCategory, filterChild, sortBy]);

  const stats = useMemo(() => {
    const total = entries.length;
    const influenced = entries.filter((e) => e.child_influenced).length;
    const pct = total > 0 ? Math.round((influenced / total) * 100) : 0;
    const categories = [...new Set(entries.map((e) => e.category))].length;
    return { total, influenced, pct, categories };
  }, [entries]);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  if (isLoading) {
    return (
      <PageShell title="Child Participation Log" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Child Participation Log"
      subtitle="Recording how children's views influence decisions — demonstrating genuine participation"
      ariaContext={{ pageTitle: "Child Participation Log", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={entries} columns={exportCols} filename="child-participation-log" />
          <PrintButton title="Child Participation Log" />
          <AriaStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Participation Records</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.pct}%</p>
            <p className="text-xs text-muted-foreground">Child Influenced Outcome</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.influenced}</p>
            <p className="text-xs text-muted-foreground">Decisions Changed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{stats.categories}</p>
            <p className="text-xs text-muted-foreground">Areas Covered</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <Star className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800">Genuine Participation</p>
            <p className="text-xs text-emerald-700 mt-1">
              This log evidences that children&apos;s voices genuinely influence decisions at Chamberlain House.
              Participation goes beyond &apos;being asked&apos; — children are shown how their views
              shaped outcomes. Where requests can&apos;t be met, honest explanations are given.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {Object.entries(PARTICIPATION_CATEGORY_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterChild}
          onChange={(e) => setFilterChild(e.target.value)}
        >
          <option value="all">All Children</option>
          <option value="yp_alex">Alex</option>
          <option value="yp_jordan">Jordan</option>
          <option value="yp_casey">Casey</option>
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Most Recent</option>
            <option value="category">Category</option>
            <option value="context">Context</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((entry) => {
          const expanded = expandedId === entry.id;
          return (
            <Card key={entry.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(entry.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-emerald-100">
                      <MessageCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{entry.context}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn("text-xs", categoryColor(entry.category))}>
                          {PARTICIPATION_CATEGORY_LABEL[entry.category]}
                        </Badge>
                        {entry.child_influenced && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-0.5" /> Influenced
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{entry.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex -space-x-1">
                      {entry.children_involved.map((cId) => (
                        <div key={cId} className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-800">
                            {getYPName(cId).charAt(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-1">
                      <Users className="h-4 w-4" /> How Were Children Consulted?
                    </p>
                    <p className="text-sm text-muted-foreground">{entry.how_consulted}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 flex items-center gap-1 mb-1">
                      <MessageCircle className="h-4 w-4" /> What Children Said
                    </p>
                    <p className="text-sm text-blue-700">{entry.what_child_said}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-1">
                      <Lightbulb className="h-4 w-4" /> Decision Made
                    </p>
                    <p className="text-sm text-muted-foreground">{entry.decision_made}</p>
                  </div>
                  {entry.child_influenced && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-800 flex items-center gap-1 mb-1">
                        <CheckCircle2 className="h-4 w-4" /> How Did Children Influence This?
                      </p>
                      <p className="text-sm text-green-700">{entry.influence_description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-1">
                      <Heart className="h-4 w-4" /> Feedback Given to Children
                    </p>
                    <p className="text-sm text-muted-foreground">{entry.feedback_given}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Evidence Type</p>
                      <p className="text-sm font-medium">{PARTICIPATION_EVIDENCE_TYPE_LABEL[entry.evidence_type]}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Recorded By</p>
                      <p className="text-sm font-medium">{getStaffName(entry.recorded_by)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Children</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {entry.children_involved.map((cId) => (
                          <Badge key={cId} variant="outline" className="text-xs">{getYPName(cId)}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-8 bg-slate-50 border border-[var(--cs-border)] rounded-lg p-4">
        <p className="text-sm font-medium text-[var(--cs-text-secondary)] mb-1">Regulatory Context</p>
        <p className="text-xs text-[var(--cs-text-secondary)]">
          Quality Standard 1 (Child-Centred Care) requires that children are consulted about
          decisions that affect them and that their views are given due weight according to their
          age and understanding (Children Act 1989 s.22). Regulation 7 requires that the child&apos;s
          views, wishes and feelings are ascertained regularly. UNCRC Article 12 establishes the
          right to be heard. Ofsted&apos;s SCCIF specifically examines evidence that children
          genuinely influence life in the home — not just that they are asked, but that their
          views lead to tangible changes. This log provides that evidence.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Child Participation Log — participation in meetings, groups, planning, feedback, voice, advocacy, children's rights, Article 12 UNCRC, wishes and feelings, LAC review participation"
        recordType="direct_work"
        className="mt-6"
      />
    </PageShell>
  );
}
