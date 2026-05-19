"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Input } from "@/components/ui/input";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Palette,
  Music,
  Pen,
  Camera,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Award,
  Star,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CreativeProjectRecord,
  CreativeProjectMedium,
  CreativeProjectStatus,
  CreativeProjectFunding,
} from "@/types/extended";
import {
  CREATIVE_PROJECT_MEDIUM_LABEL,
  CREATIVE_PROJECT_STATUS_LABEL,
  CREATIVE_PROJECT_FUNDING_LABEL,
} from "@/types/extended";
import { useCreativeProjectRecords } from "@/hooks/use-creative-project-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const mediumIcon = (m: CreativeProjectMedium) => {
  if (m === "music_instrument" || m === "music_production" || m === "singing") return Music;
  if (m === "writing_poetry" || m === "writing_prose") return Pen;
  if (m === "photography" || m === "video") return Camera;
  return Palette;
};

const statusColour: Record<string, string> = {
  idea: "bg-slate-100 text-[var(--cs-text-secondary)]",
  active: "bg-teal-100 text-teal-800",
  paused: "bg-amber-100 text-amber-800",
  completed: "bg-purple-100 text-purple-800",
  shared_publicly: "bg-pink-100 text-pink-800",
};

const exportCols: ExportColumn<CreativeProjectRecord>[] = [
  { header: "Young Person", accessor: (r: CreativeProjectRecord) => getYPName(r.child_id) },
  { header: "Project", accessor: (r: CreativeProjectRecord) => r.project_name },
  { header: "Medium", accessor: (r: CreativeProjectRecord) => CREATIVE_PROJECT_MEDIUM_LABEL[r.medium] },
  { header: "Status", accessor: (r: CreativeProjectRecord) => CREATIVE_PROJECT_STATUS_LABEL[r.status] },
  { header: "Started", accessor: (r: CreativeProjectRecord) => r.started_date },
  { header: "Last Worked On", accessor: (r: CreativeProjectRecord) => r.last_worked_on },
  { header: "Materials £", accessor: (r: CreativeProjectRecord) => `£${r.materials_cost}` },
  { header: "Funding", accessor: (r: CreativeProjectRecord) => CREATIVE_PROJECT_FUNDING_LABEL[r.materials_funding] },
  { header: "Showcase", accessor: (r: CreativeProjectRecord) => r.external_showcase ?? "—" },
  { header: "Key Worker", accessor: (r: CreativeProjectRecord) => getStaffName(r.key_worker) },
  { header: "Reviewed", accessor: (r: CreativeProjectRecord) => r.review_date },
];

export default function ChildCreativeProjectsPage() {
  const [search, setSearch] = useState("");
  const [filterMedium, setFilterMedium] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: response, isLoading } = useCreativeProjectRecords();
  const data = response?.data ?? [];

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterMedium !== "all") items = items.filter((r) => r.medium === filterMedium);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (r) =>
          r.project_name.toLowerCase().includes(q) ||
          getYPName(r.child_id).toLowerCase().includes(q) ||
          r.child_inspiration.toLowerCase().includes(q) ||
          CREATIVE_PROJECT_MEDIUM_LABEL[r.medium].toLowerCase().includes(q),
      );
    }
    items.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return b.last_worked_on.localeCompare(a.last_worked_on);
        case "started":
          return b.started_date.localeCompare(a.started_date);
        case "cost":
          return b.materials_cost - a.materials_cost;
        case "yp":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default:
          return 0;
      }
    });
    return items;
  }, [data, search, filterMedium, sortBy]);

  const activeCount = data.filter((r) => r.status === "active").length;
  const completedCount = data.filter((r) => r.status === "completed").length;
  const sharedCount = data.filter((r) => r.status === "shared_publicly" || r.external_showcase).length;
  const ytdCost = data.reduce((sum, r) => sum + r.materials_cost, 0);

  const mediums = Array.from(new Set(data.map((r) => r.medium)));

  if (isLoading) {
    return (
      <PageShell
        title="Child Creative Projects"
        subtitle="Per-child portfolios of creative work — therapeutic expression, identity, and growing skill"
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Child Creative Projects"
      subtitle="Per-child portfolios of creative work — therapeutic expression, identity, and growing skill"
      ariaContext={{ pageTitle: "Creative Projects", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="child-creative-projects" />
          <PrintButton title="Creative Projects" />
          <AriaStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">{activeCount}</p>
          <p className="text-xs text-muted-foreground">Active Projects</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{completedCount}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-pink-600">{sharedCount}</p>
          <p className="text-xs text-muted-foreground">Shared / Showcased</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">£{ytdCost}</p>
          <p className="text-xs text-muted-foreground">Materials Cost YTD</p>
        </div>
      </div>

      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Palette className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-900">
          Creative work is identity work. Each project is the child&apos;s voice taking form —
          we resource, witness, and protect the work without taking it over. The child decides
          what is shared and when.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
          <Input
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-[220px] h-9"
          />
        </div>
        <Select value={filterMedium} onValueChange={setFilterMedium}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Mediums" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Mediums</SelectItem>
            {mediums.map((m) => (
              <SelectItem key={m} value={m}>
                {CREATIVE_PROJECT_MEDIUM_LABEL[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recently Worked</SelectItem>
              <SelectItem value="started">Most Recently Started</SelectItem>
              <SelectItem value="cost">By Materials Cost</SelectItem>
              <SelectItem value="yp">By Young Person</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((p) => {
          const isExpanded = expandedId === p.id;
          const Icon = mediumIcon(p.medium);

          return (
            <div key={p.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-purple-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.project_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getYPName(p.child_id)} &middot; Started {p.started_date} &middot; Last worked {p.last_worked_on}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-teal-100 text-teal-800">
                    {CREATIVE_PROJECT_MEDIUM_LABEL[p.medium]}
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColour[p.status])}>
                    {CREATIVE_PROJECT_STATUS_LABEL[p.status]}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">
                    £{p.materials_cost}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Started</p>
                      <p className="font-medium">{p.started_date}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Last Worked</p>
                      <p className="font-medium">{p.last_worked_on}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Materials</p>
                      <p className="font-medium">£{p.materials_cost}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Funding</p>
                      <p className="font-medium">{CREATIVE_PROJECT_FUNDING_LABEL[p.materials_funding]}</p>
                    </div>
                  </div>

                  <div className="bg-teal-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide mb-1">
                      <Star className="h-3 w-3 inline mr-1" />Skills Growing
                    </p>
                    <ul className="space-y-1">
                      {p.skills_growing.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Star className="h-3 w-3 text-teal-500 mt-1 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">
                      Child&apos;s Inspiration
                    </p>
                    <p className="text-sm italic">{p.child_inspiration}</p>
                  </div>

                  {(p.collaborators || p.external_showcase) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {p.collaborators && (
                        <div className="bg-white rounded-lg p-3 border">
                          <p className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-1">
                            Collaborators
                          </p>
                          <p className="text-sm">{p.collaborators}</p>
                        </div>
                      )}
                      {p.external_showcase && (
                        <div className="bg-pink-50 rounded-lg p-3 border border-pink-100">
                          <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">
                            External Showcase
                          </p>
                          <p className="text-sm">{p.external_showcase}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {p.contests_entered.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <Award className="h-3 w-3 inline mr-1" />Contests Entered
                      </p>
                      <ul className="space-y-1">
                        {p.contests_entered.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Award className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            <span>
                              <strong>{c.name}</strong> ({c.date}){c.outcome ? ` — ${c.outcome}` : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      Child&apos;s Voice
                    </p>
                    <p className="text-sm italic">&ldquo;{p.child_voice}&rdquo;</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                      Staff Observation
                    </p>
                    <p className="text-sm">{p.staff_observation}</p>
                  </div>

                  {p.next_steps.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Next Steps
                      </p>
                      <ul className="space-y-1">
                        {p.next_steps.map((n, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-purple-600 mt-0.5">•</span>
                            <span>{n}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {p.flags_concerns.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        Flags / Things to Watch
                      </p>
                      <ul className="space-y-1">
                        {p.flags_concerns.map((f, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Key worker: {getStaffName(p.key_worker)}</span>
                    <span>Reviewed: {p.review_date}</span>
                  </div>

                  <SmartLinkPanel sourceType="creative-projects" sourceId={p.id} childId={p.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Creative project portfolios support Quality Standard 6
          (Enjoyment & Achievement) and uphold UNCRC Article 13 (freedom of expression) and Article 31
          (right to rest, play, leisure, and cultural life). Materials budget allocated per child.
          Linked to After-School Clubs, Activities, Cultural Identity, and Outcomes pages.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Activities"
        category="activity"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Creative Projects — art, music, writing, photography, drama, craft, film, individual creative pursuits, therapeutic expression, exhibition, portfolio, achievements, Reg 45 wellbeing"
        recordType="direct_work"
        className="mt-6"
      />
    </PageShell>
  );
}
