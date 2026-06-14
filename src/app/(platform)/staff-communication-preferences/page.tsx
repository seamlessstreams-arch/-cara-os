"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare, Search, ArrowUpDown, Filter,
  CheckCircle2, Clock, Accessibility, Globe,
  ChevronDown, ChevronUp, User, Phone, Video,
  FileText, Brain, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useStaffCommunicationPreferenceRecords } from "@/hooks/use-staff-communication-preference-records";
import type { StaffCommunicationPreferenceRecord, StaffCommsContactMethod, StaffCommsFeedbackStyle } from "@/types/extended";
import {
  STAFF_COMMS_CONTACT_METHOD_LABEL,
  STAFF_COMMS_FEEDBACK_STYLE_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── local config ───────────────────────────────────────────────────── */

const CONTACT_ICONS: Record<StaffCommsContactMethod, typeof User> = {
  face_to_face: User,
  written: FileText,
  phone: Phone,
  teams_video: Video,
};

/* ── component ───────────────────────────────────────────────────────── */

export default function StaffCommunicationPreferencesPage() {
  const { data: records = [], isLoading } = useStaffCommunicationPreferenceRecords();
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getStaffName(r.staff_id).toLowerCase().includes(q) ||
          r.meeting_preferences.toLowerCase().includes(q) ||
          r.neurodivergent_needs.toLowerCase().includes(q) ||
          r.language_needs.toLowerCase().includes(q) ||
          r.supervision_adjustments.toLowerCase().includes(q)
      );
    }
    if (filterMethod !== "all") list = list.filter((r) => r.preferred_contact_method === filterMethod);

    list.sort((a, b) => {
      switch (sortBy) {
        case "name": return getStaffName(a.staff_id).localeCompare(getStaffName(b.staff_id));
        case "review": return a.last_review_date.localeCompare(b.last_review_date);
        case "method": return a.preferred_contact_method.localeCompare(b.preferred_contact_method);
        case "feedback": return a.feedback_style.localeCompare(b.feedback_style);
        default: return 0;
      }
    });
    return list;
  }, [records, search, filterMethod, sortBy]);

  /* ── summary stats ── */
  const profilesComplete = records.length;
  const dueForReview = records.filter((r) => {
    const reviewDate = new Date(r.last_review_date);
    const now = new Date();
    const diffDays = (now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 60;
  }).length;
  const adjustmentsInPlace = records.filter(
    (r) => r.neurodivergent_needs || r.supervision_adjustments !== "" || r.language_needs
  ).length;
  const languagesSupported = new Set(
    records
      .filter((r) => r.language_needs)
      .flatMap((r) => {
        const langs: string[] = [];
        if (r.language_needs.toLowerCase().includes("french")) langs.push("French");
        if (r.language_needs.toLowerCase().includes("bemba")) langs.push("Bemba");
        if (r.language_needs.toLowerCase().includes("lingala")) langs.push("Lingala");
        return langs;
      })
  ).size;

  const exportCols: ExportColumn<StaffCommunicationPreferenceRecord>[] = [
    { header: "Staff Member", accessor: (r) => getStaffName(r.staff_id) },
    { header: "Last Review", accessor: (r) => r.last_review_date },
    { header: "Preferred Contact", accessor: (r) => STAFF_COMMS_CONTACT_METHOD_LABEL[r.preferred_contact_method] },
    { header: "Meeting Preferences", accessor: (r) => r.meeting_preferences },
    { header: "Feedback Style", accessor: (r) => STAFF_COMMS_FEEDBACK_STYLE_LABEL[r.feedback_style] },
    { header: "Supervision Adjustments", accessor: (r) => r.supervision_adjustments },
    { header: "Neurodivergent Needs", accessor: (r) => r.neurodivergent_needs },
    { header: "Language Needs", accessor: (r) => r.language_needs },
    { header: "Best Time", accessor: (r) => r.best_time_for_discussions },
    { header: "Stress Indicators", accessor: (r) => r.stress_indicators.join("; ") },
    { header: "De-escalation", accessor: (r) => r.de_escalation_preferences },
    { header: "Confidential Notes", accessor: (r) => r.confidential_notes },
    { header: "Reviewed By", accessor: (r) => getStaffName(r.reviewed_by) },
  ];

  if (isLoading) {
    return (
      <PageShell title="Staff Communication Preferences" subtitle="Recording individual communication needs and reasonable adjustments for all team members">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Staff Communication Preferences"
      subtitle="Recording individual communication needs and reasonable adjustments for all team members"
      caraContext={{ pageTitle: "Staff Communication Preferences", sourceType: "staff" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Communication Preferences" />
          <ExportButton data={filtered} columns={exportCols} filename="staff-communication-preferences" />
          <CaraStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Profiles Complete", value: profilesComplete, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Due for Review", value: dueForReview, icon: Clock, colour: dueForReview > 0 ? "text-amber-600" : "text-[var(--cs-text-muted)]" },
            { label: "Adjustments in Place", value: adjustmentsInPlace, icon: Accessibility, colour: "text-blue-600" },
            { label: "Languages Supported", value: languagesSupported, icon: Globe, colour: "text-purple-600" },
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

        {/* ── filters / sort ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff, adjustments, needs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Contact method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {(Object.keys(STAFF_COMMS_CONTACT_METHOD_LABEL) as StaffCommsContactMethod[]).map((k) => (
                  <SelectItem key={k} value={k}>{STAFF_COMMS_CONTACT_METHOD_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="review">Last Review</SelectItem>
                <SelectItem value="method">Contact Method</SelectItem>
                <SelectItem value="feedback">Feedback Style</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── card list ─────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((rec) => {
            const isExpanded = expandedId === rec.id;
            const Icon = CONTACT_ICONS[rec.preferred_contact_method];
            const reviewDate = new Date(rec.last_review_date);
            const now = new Date();
            const daysSinceReview = Math.floor((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
            const overdue = daysSinceReview > 60;

            return (
              <div key={rec.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--cs-surface)] transition-colors text-left"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MessageSquare className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="font-medium text-sm truncate">{getStaffName(rec.staff_id)}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs gap-1">
                      <Icon className="h-3 w-3" />
                      {STAFF_COMMS_CONTACT_METHOD_LABEL[rec.preferred_contact_method]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {STAFF_COMMS_FEEDBACK_STYLE_LABEL[rec.feedback_style]}
                    </Badge>
                    {rec.neurodivergent_needs && (
                      <Badge className="text-xs bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)] hover:bg-[var(--cs-cara-gold-bg)]">
                        <Brain className="h-3 w-3 mr-1" />
                        ND adjustments
                      </Badge>
                    )}
                    {rec.language_needs && (
                      <Badge className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-100">
                        <Globe className="h-3 w-3 mr-1" />
                        Language
                      </Badge>
                    )}
                    {overdue && (
                      <Badge className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-100">
                        Review overdue
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t px-4 py-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Meeting Preferences</p>
                        <p className="text-sm">{rec.meeting_preferences}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Best Time for Discussions</p>
                        <p className="text-sm">{rec.best_time_for_discussions}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Supervision Adjustments</p>
                        <p className="text-sm">{rec.supervision_adjustments}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">De-escalation Preferences</p>
                        <p className="text-sm">{rec.de_escalation_preferences}</p>
                      </div>
                    </div>

                    {rec.neurodivergent_needs && (
                      <div className="rounded-lg bg-[var(--cs-cara-gold-bg)] p-3">
                        <p className="text-xs font-medium text-[var(--cs-navy)] mb-1">Neurodivergent Needs & Adjustments</p>
                        <p className="text-sm text-[var(--cs-navy)]">{rec.neurodivergent_needs}</p>
                      </div>
                    )}

                    {rec.language_needs && (
                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="text-xs font-medium text-blue-800 mb-1">Language Needs</p>
                        <p className="text-sm text-blue-900">{rec.language_needs}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Stress Indicators</p>
                      <div className="flex flex-wrap gap-1.5">
                        {rec.stress_indicators.map((indicator, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {indicator}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Confidential Notes</p>
                      <p className="text-sm">{rec.confidential_notes}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span>Last reviewed: {rec.last_review_date} by {getStaffName(rec.reviewed_by)}</span>
                      <span className={cn(overdue && "text-amber-600 font-medium")}>
                        {overdue ? `${daysSinceReview} days since review — overdue` : `${daysSinceReview} days since review`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory note ──────────────────────────────────── */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900 mb-1">Regulatory Framework</p>
          <p className="text-sm text-blue-800">
            This record supports compliance with the <strong>Equality Act 2010</strong> duty to make reasonable adjustments for staff with disabilities or specific needs, including neurodivergent conditions. It also aligns with <strong>Quality Standard 13 (Leadership and Management)</strong>, which requires that leaders create an environment where staff feel supported, their individual needs are understood, and communication is adapted to promote effective team working.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Staff Communication Preferences — staff communication styles, preferred contact methods, accessibility requirements, reasonable adjustments, HR records, staff wellbeing, Reg 40 workforce evidence"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
