"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Heart,
  BookOpen,
  Shield,
  MessageCircle,
  Sparkles,
  Calendar,
  Users,
  HelpCircle,
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
import { useRseTrackerRecords } from "@/hooks/use-rse-tracker-records";
import type { RseTrackerRecord, RseTrackerTopic, RseTrackerMethod } from "@/types/extended";
import { RSE_TRACKER_TOPIC_LABEL, RSE_TRACKER_METHOD_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── local config ────────────────────────────────────────────────────── */

const topicColour: Record<RseTrackerTopic, string> = {
  healthy_relationships: "bg-rose-100 text-rose-800",
  consent: "bg-purple-100 text-purple-800",
  online_safety_relationships: "bg-blue-100 text-blue-800",
  body_changes_puberty: "bg-emerald-100 text-emerald-800",
  boundaries: "bg-amber-100 text-amber-800",
  identity_lgbtq: "bg-pink-100 text-pink-800",
  family_relationships: "bg-teal-100 text-teal-800",
  friendship: "bg-cyan-100 text-cyan-800",
  coping_peer_pressure: "bg-orange-100 text-orange-800",
  recognising_harmful_relationships: "bg-red-100 text-red-800",
};

/* ── page ────────────────────────────────────────────────────────────── */

export default function RseTrackerPage() {
  const { data: records = [], isLoading } = useRseTrackerRecords();
  const [filterYP, setFilterYP] = useState("all");
  const [filterTopic, setFilterTopic] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const childIds = useMemo(() => Array.from(new Set(records.map((r) => r.child_id))), [records]);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterYP !== "all") items = items.filter((r) => r.child_id === filterYP);
    if (filterTopic !== "all") items = items.filter((r) => r.topic === filterTopic);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "duration":
          return b.duration_minutes - a.duration_minutes;
        case "topic":
          return a.topic.localeCompare(b.topic);
        case "child":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterYP, filterTopic, sortBy]);

  const total = records.length;
  const uniqueTopics = new Set(records.map((r) => r.topic)).size;
  const uniqueChildren = new Set(records.map((r) => r.child_id)).size;
  const externalResources = records.filter(
    (r) => r.method === "external_programme" || r.method === "through_school",
  ).length;

  const exportCols: ExportColumn<RseTrackerRecord>[] = [
    { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
    { header: "Date", accessor: (r) => r.date },
    { header: "Topic", accessor: (r) => RSE_TRACKER_TOPIC_LABEL[r.topic] },
    { header: "Method", accessor: (r) => RSE_TRACKER_METHOD_LABEL[r.method] },
    { header: "Duration (min)", accessor: (r) => `${r.duration_minutes}` },
    { header: "Delivered By", accessor: (r) => getStaffName(r.delivered_by) },
    { header: "Child Initiated", accessor: (r) => (r.child_initiation_of_topic ? "Yes" : "No") },
    { header: "Curriculum Link", accessor: (r) => r.curriculum_linked_to },
    { header: "Recorded By", accessor: (r) => getStaffName(r.recorded_by) },
  ];

  if (isLoading) {
    return (
      <PageShell title="RSE Tracker" subtitle="Relationships and Sex Education — per-child delivery covering relationships, consent, online safety, healthy bodies">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="RSE Tracker"
      subtitle="Relationships and Sex Education — per-child delivery covering relationships, consent, online safety, healthy bodies"
      caraContext={{ pageTitle: "RSE Tracker", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="rse-tracker" />
          <PrintButton title="RSE Tracker" />
          <CaraStudioQuickActionButton context={{ record_type: "education", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Sessions This Term</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-rose-600">{uniqueTopics}</p>
          <p className="text-xs text-muted-foreground">Topics Covered</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{uniqueChildren}</p>
          <p className="text-xs text-muted-foreground">Children Engaged</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{externalResources}</p>
          <p className="text-xs text-muted-foreground">External Resources Used</p>
        </div>
      </div>

      <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
        <p className="text-sm text-rose-800">
          RSE is delivered developmentally, child-led where possible, and always age-appropriate.
          We work alongside school PSHE and external programmes — not in place of them. Each child&apos;s
          questions and pace are honoured.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {childIds.map((id) => (
              <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterTopic} onValueChange={setFilterTopic}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="All Topics" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {(Object.keys(RSE_TRACKER_TOPIC_LABEL) as RseTrackerTopic[]).map((k) => (
              <SelectItem key={k} value={k}>{RSE_TRACKER_TOPIC_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">By Date</SelectItem>
              <SelectItem value="duration">By Duration</SelectItem>
              <SelectItem value="topic">By Topic</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;

          return (
            <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Heart className="h-5 w-5 text-rose-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{RSE_TRACKER_TOPIC_LABEL[r.topic]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getYPName(r.child_id)} &middot; {r.date} &middot; {RSE_TRACKER_METHOD_LABEL[r.method]} &middot; {r.duration_minutes} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {r.child_initiation_of_topic && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800">
                      Child-initiated
                    </span>
                  )}
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", topicColour[r.topic])}>
                    {RSE_TRACKER_TOPIC_LABEL[r.topic]}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-medium">{r.date}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-medium">{r.duration_minutes} min</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Method</p>
                      <p className="font-medium">{RSE_TRACKER_METHOD_LABEL[r.method]}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Delivered By</p>
                      <p className="font-medium">{getStaffName(r.delivered_by)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <BookOpen className="h-3 w-3 inline mr-1" />Key Concepts Covered
                    </p>
                    <ul className="space-y-1">
                      {r.key_concepts_covered.map((k, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Sparkles className="h-3 w-3 text-rose-500 mt-1 shrink-0" />
                          <span>{k}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      <MessageCircle className="h-3 w-3 inline mr-1" />Child&apos;s Contribution
                    </p>
                    <p className="text-sm">{r.child_contribution}</p>
                  </div>

                  {r.questions_raised.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">
                        <HelpCircle className="h-3 w-3 inline mr-1" />Questions Raised
                      </p>
                      <ul className="space-y-1">
                        {r.questions_raised.map((q, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-purple-600 mt-0.5">?</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Follow-Up</p>
                    <p className="text-sm">{r.follow_up}</p>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                      <Shield className="h-3 w-3 inline mr-1" />Parental Awareness
                    </p>
                    <p className="text-sm">{r.parental_awareness}</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Curriculum Link</p>
                    <p className="text-sm">{r.curriculum_linked_to}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Calendar className="h-3 w-3 inline mr-1" />{r.date}</span>
                    <span><Users className="h-3 w-3 inline mr-1" />Delivered by {getStaffName(r.delivered_by)}</span>
                    <span>Recorded by {getStaffName(r.recorded_by)}</span>
                    <span>Child-initiated: {r.child_initiation_of_topic ? "Yes" : "No"}</span>
                  </div>

                  {r.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{r.notes}</p>
                    </div>
                  )}

                  <SmartLinkPanel sourceType="rse-tracker" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> RSE delivery is required by KCSIE 2024 (online safety, harmful
          relationships, consent) and Children&apos;s Homes Quality Standard 7 (health and wellbeing — including
          sexual health and healthy relationships). Aligned with DfE RSE Statutory Guidance and delivered
          alongside school PSHE. Linked to Online Safety, Safeguarding, Health, and Identity pages.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Education"
        category="education"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="RSE Tracker — relationships and sex education delivery, age-appropriate RSE, PSHE provision, statutory RSE compliance, care plan education evidence, safeguarding context, Reg 45 education evidence"
        recordType="education"
        className="mt-6"
      />
    </PageShell>
  );
}
