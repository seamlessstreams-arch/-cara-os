"use client";

import { useState, useMemo } from "react";
import {
  ClipboardCheck, Search, ArrowUpDown, Filter,
  CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
  Calendar, User, Star, FileText, BookOpen,
  Folder, MessageSquare, Eye, EyeOff, MapPin,
  Sparkles, RefreshCw, XCircle, Clock, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useReadinessItems } from "@/hooks/use-readiness-items";
import type { ReadinessItem, SccifJudgementArea, ReadinessCategory, InPackStatus } from "@/types/extended";
import { SCCIF_JUDGEMENT_AREA_LABEL, READINESS_CATEGORY_LABEL, IN_PACK_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── colour maps ───────────────────────────────────────────────────────── */

const STATUS_COLOUR: Record<InPackStatus, string> = {
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  needs_refresh: "bg-amber-50 text-amber-700 border-amber-200",
  missing: "bg-red-50 text-red-700 border-red-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
};

const STATUS_BORDER: Record<InPackStatus, string> = {
  ready: "border-l-emerald-400",
  needs_refresh: "border-l-amber-400",
  missing: "border-l-red-400",
  in_progress: "border-l-blue-400",
};

const STATUS_ICON: Record<InPackStatus, React.ComponentType<{ className?: string }>> = {
  ready: CheckCircle2,
  needs_refresh: RefreshCw,
  missing: XCircle,
  in_progress: Clock,
};

const STATUS_ICON_COLOUR: Record<InPackStatus, string> = {
  ready: "text-emerald-600",
  needs_refresh: "text-amber-600",
  missing: "text-red-600",
  in_progress: "text-blue-600",
};

const SCCIF_COLOUR: Record<SccifJudgementArea, string> = {
  overall_experiences: "bg-indigo-50 text-indigo-700 border-indigo-200",
  helped_and_protected: "bg-rose-50 text-rose-700 border-rose-200",
  leaders_and_managers: "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)] border-[var(--cs-aria-gold-soft)]",
};

const CATEGORY_COLOUR: Record<ReadinessCategory, string> = {
  statutory_documentation: "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
  records_of_practice: "bg-blue-50 text-blue-700 border-blue-200",
  childrens_voice_evidence: "bg-pink-50 text-pink-700 border-pink-200",
  outcome_data: "bg-teal-50 text-teal-700 border-teal-200",
  workforce: "bg-amber-50 text-amber-700 border-amber-200",
  environment: "bg-lime-50 text-lime-700 border-lime-200",
  quality_assurance: "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)] border-[var(--cs-aria-gold-soft)]",
};

/* ── component ───────────────────────────────────────────────────────── */
export default function InspectionReadinessPackPage() {
  const { data: res, isLoading } = useReadinessItems();
  const entries: ReadinessItem[] = res?.data ?? [];
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterArea, setFilterArea] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "status" | "quality" | "review">("status");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ── filtering & sorting ────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...entries];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.item_name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.commentary.toLowerCase().includes(q) ||
          e.examples_included.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (filterStatus !== "all") list = list.filter((e) => e.in_pack_status === filterStatus);
    if (filterArea !== "all") list = list.filter((e) => e.sccif_judgement_area === filterArea);
    if (filterCategory !== "all") list = list.filter((e) => e.category === filterCategory);

    const statusOrder: Record<InPackStatus, number> = {
      missing: 0,
      needs_refresh: 1,
      in_progress: 2,
      ready: 3,
    };

    list.sort((a, b) => {
      switch (sortBy) {
        case "status":
          return statusOrder[a.in_pack_status] - statusOrder[b.in_pack_status];
        case "quality":
          return b.evidence_quality_rating - a.evidence_quality_rating;
        case "review":
          return a.next_review_due.localeCompare(b.next_review_due);
        case "name":
        default:
          return a.item_name.localeCompare(b.item_name);
      }
    });
    return list;
  }, [entries, search, filterStatus, filterArea, filterCategory, sortBy]);

  /* ── stats ──────────────────────────────────────────────────────── */
  const totalItems = entries.length;
  const readyCount = entries.filter((e) => e.in_pack_status === "ready").length;
  const readyPct = totalItems > 0 ? Math.round((readyCount / totalItems) * 100) : 0;
  const needsRefreshCount = entries.filter((e) => e.in_pack_status === "needs_refresh").length;
  const avgQuality = totalItems > 0
    ? (entries.reduce((sum, e) => sum + e.evidence_quality_rating, 0) / totalItems).toFixed(1)
    : "0.0";

  /* ── export columns ─────────────────────────────────────────────── */
  const exportCols: ExportColumn<ReadinessItem>[] = [
    { header: "Item", accessor: (r: ReadinessItem) => r.item_name },
    { header: "SCCIF Judgement Area", accessor: (r: ReadinessItem) => SCCIF_JUDGEMENT_AREA_LABEL[r.sccif_judgement_area] },
    { header: "Category", accessor: (r: ReadinessItem) => READINESS_CATEGORY_LABEL[r.category] },
    { header: "Status", accessor: (r: ReadinessItem) => IN_PACK_STATUS_LABEL[r.in_pack_status] },
    { header: "Version", accessor: (r: ReadinessItem) => r.current_version },
    { header: "Last Updated", accessor: (r: ReadinessItem) => r.last_updated },
    { header: "Next Review Due", accessor: (r: ReadinessItem) => r.next_review_due },
    { header: "Location", accessor: (r: ReadinessItem) => r.location_of_document },
    { header: "Owner", accessor: (r: ReadinessItem) => getStaffName(r.responsible_owner) },
    { header: "Quality (1-5)", accessor: (r: ReadinessItem) => r.evidence_quality_rating },
    { header: "Child Voice Woven", accessor: (r: ReadinessItem) => r.child_voice_woven ? "Yes" : "No" },
    { header: "Accessible to Inspector", accessor: (r: ReadinessItem) => r.accessible_to_inspector ? "Yes" : "No" },
    { header: "Accessible to Children", accessor: (r: ReadinessItem) => r.accessible_to_children ? "Yes" : "No" },
    { header: "Commentary", accessor: (r: ReadinessItem) => r.commentary },
  ];

  if (isLoading) return <PageShell title="Inspection Readiness Pack" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Inspection Readiness Pack"
      subtitle="Curated documents and evidence prepared for Ofsted inspection — readiness pack contents and currency"
      ariaContext={{ pageTitle: "Inspection Readiness Pack", sourceType: "document" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Inspection Readiness Pack" />
          <ExportButton data={filtered} columns={exportCols} filename="inspection-readiness-pack" />
          <AriaStudioQuickActionButton context={{ record_type: "ofsted_evidence", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── summary stats ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Items", value: totalItems, icon: Folder, colour: "text-indigo-600" },
            { label: "Ready %", value: `${readyPct}%`, icon: CheckCircle2, colour: "text-emerald-600" },
            { label: "Needs Refresh", value: needsRefreshCount, icon: RefreshCw, colour: "text-amber-600" },
            { label: "Avg Quality (1-5)", value: avgQuality, icon: Star, colour: "text-[var(--cs-aria-gold)]" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── filters & sort ─────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search items, descriptions, examples, commentary..."
              className="w-full rounded-lg border border-[var(--cs-border)] bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[170px] h-9 text-sm">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {(Object.entries(IN_PACK_STATUS_LABEL) as [InPackStatus, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="w-[260px] h-9 text-sm">
                <SelectValue placeholder="All SCCIF Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SCCIF Areas</SelectItem>
                {(Object.entries(SCCIF_JUDGEMENT_AREA_LABEL) as [SccifJudgementArea, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Folder className="h-4 w-4 text-muted-foreground" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[210px] h-9 text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {(Object.entries(READINESS_CATEGORY_LABEL) as [ReadinessCategory, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "name" | "status" | "quality" | "review")}>
              <SelectTrigger className="w-[170px] h-9 text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Status (most urgent)</SelectItem>
                <SelectItem value="name">Item name</SelectItem>
                <SelectItem value="quality">Quality rating</SelectItem>
                <SelectItem value="review">Next review due</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── readiness item cards ───────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardCheck className="h-10 w-10 mx-auto mb-3 text-[var(--cs-text-gentle)]" />
              No readiness items match your filters.
            </div>
          )}
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            const StatusIcon = STATUS_ICON[item.in_pack_status];
            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl border border-l-4 bg-white overflow-hidden",
                  STATUS_BORDER[item.in_pack_status]
                )}
              >
                {/* collapsed header */}
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <StatusIcon className={cn("h-5 w-5 shrink-0", STATUS_ICON_COLOUR[item.in_pack_status])} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{item.item_name}</p>
                        <span className="text-xs text-muted-foreground">{item.current_version}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", STATUS_COLOUR[item.in_pack_status])}>
                          {IN_PACK_STATUS_LABEL[item.in_pack_status]}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", SCCIF_COLOUR[item.sccif_judgement_area])}>
                          {SCCIF_JUDGEMENT_AREA_LABEL[item.sccif_judgement_area]}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", CATEGORY_COLOUR[item.category])}>
                          {READINESS_CATEGORY_LABEL[item.category]}
                        </Badge>
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Star className="h-3 w-3 text-[var(--cs-aria-gold)]" />
                          {item.evidence_quality_rating}/5
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground hidden md:inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Review {item.next_review_due}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {/* expanded detail */}
                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* description */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[var(--cs-text-muted)]" />
                          Description
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-[var(--cs-text-secondary)]">{item.description}</p>
                      </CardContent>
                    </Card>

                    {/* meta grid */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <ClipboardCheck className="h-4 w-4 text-indigo-500" />
                          Pack Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Location</p>
                              <p className="text-[var(--cs-text-secondary)]">{item.location_of_document}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <User className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Responsible Owner</p>
                              <p className="text-[var(--cs-text-secondary)]">{getStaffName(item.responsible_owner)}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Calendar className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Last Updated</p>
                              <p className="text-[var(--cs-text-secondary)]">{item.last_updated}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Calendar className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Next Review Due</p>
                              <p className="text-[var(--cs-text-secondary)]">{item.next_review_due}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Star className="h-3.5 w-3.5 text-[var(--cs-aria-gold)] shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Evidence Quality</p>
                              <p className="text-[var(--cs-text-secondary)] font-medium">{item.evidence_quality_rating} / 5</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <FileText className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Current Version</p>
                              <p className="text-[var(--cs-text-secondary)]">{item.current_version}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* examples included */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-emerald-500" />
                          Examples Included
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {item.examples_included.map((ex, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[var(--cs-text-secondary)]">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              {ex}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* access & voice flags */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Eye className="h-4 w-4 text-blue-500" />
                          Access &amp; Voice
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={cn(
                            "text-xs px-2 py-0.5 border inline-flex items-center gap-1",
                            item.child_voice_woven
                              ? "bg-pink-50 text-pink-700 border-pink-200"
                              : "bg-slate-50 text-[var(--cs-text-muted)] border-[var(--cs-border)]"
                          )}>
                            <MessageSquare className="h-3 w-3" />
                            {item.child_voice_woven ? "Child voice woven" : "Child voice not woven"}
                          </Badge>
                          <Badge variant="outline" className={cn(
                            "text-xs px-2 py-0.5 border inline-flex items-center gap-1",
                            item.accessible_to_inspector
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          )}>
                            {item.accessible_to_inspector ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            {item.accessible_to_inspector ? "Accessible to inspector" : "Inspector access blocked"}
                          </Badge>
                          <Badge variant="outline" className={cn(
                            "text-xs px-2 py-0.5 border inline-flex items-center gap-1",
                            item.accessible_to_children
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-50 text-[var(--cs-text-muted)] border-[var(--cs-border)]"
                          )}>
                            {item.accessible_to_children ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            {item.accessible_to_children ? "Accessible to children" : "Not for children"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* commentary */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          Commentary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-[var(--cs-text-secondary)] whitespace-pre-line">{item.commentary}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory note ──────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <div className="flex items-start gap-2">
            <BookOpen className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p>
                <strong>About the Inspection Readiness Pack:</strong> Ofsted inspections are short-notice
                events. The Registered Manager and Responsible Individual must be able to evidence the home&apos;s
                practice quickly, accurately, and honestly. This readiness pack is a living index of the
                documents and evidence an inspector may request — kept current, locatable, and quality-assured.
              </p>
              <p>
                The pack is structured around the three SCCIF judgement areas — overall experiences and
                progress, how well children are helped and protected, and the effectiveness of leaders and
                managers. Required by <strong>Reg 45</strong> (review of quality of care) and aligned to
                <strong> Quality Standard 13</strong> (the leadership and management standard) of the
                Children&apos;s Homes Regulations 2015. Reg 16 (Statement of Purpose) and Reg 32 (fitness of
                workers) are also core components.
              </p>
              <p>
                <strong>Important:</strong> Documents alone do not evidence a good home — practice does.
                The readiness pack is a starting point; inspectors will triangulate written evidence with
                children&apos;s lived experience, staff practice, and external partner views. Honest curation
                — including identifying what needs refresh — strengthens credibility far more than a pack
                that overstates readiness.
              </p>
            </div>
          </div>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Compliance Evidence"
        category="general"
        days={90}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Inspection Readiness Pack — Ofsted preparation, ILACS, Annex A, Reg 45, management oversight, evidence bundles, outstanding practice, areas for development, inspection history"
        recordType="ofsted_evidence"
        className="mt-6"
      />
    </PageShell>
  );
}
