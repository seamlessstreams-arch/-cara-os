"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FileText, Send, CheckCircle2, Clock, Edit3,
  Sparkles, AlertTriangle, ChevronRight, Plus,
  Mail, Clipboard, Shield, Stethoscope,
  GraduationCap, Users, BookOpen, Archive,
  Eye, Copy, MessageSquare,
} from "lucide-react";
import {
  COMMUNICATION_TEMPLATES,
  type CommunicationType, type CommunicationStatus,
} from "@/lib/services/communication-intelligence";

// ── Config ─────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<CommunicationType, React.ElementType> = {
  handover_summary: BookOpen,
  social_worker_update: Mail,
  reg44_section: Clipboard,
  reg45_section: Clipboard,
  incident_notification: AlertTriangle,
  missing_notification: AlertTriangle,
  placement_update: FileText,
  multi_agency_brief: Users,
  shift_briefing: Clock,
  professional_update: Send,
  management_summary: Eye,
  ofsted_notification: Shield,
};

const STATUS_STYLES: Record<CommunicationStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  review: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  sent: "bg-emerald-100 text-emerald-700",
  archived: "bg-slate-100 text-slate-500",
};

const STATUS_LABELS: Record<CommunicationStatus, string> = {
  draft: "Draft",
  review: "In Review",
  approved: "Approved",
  sent: "Sent",
  archived: "Archived",
};

// ── Demo drafts ────────────────────────────────────────────────────────────

const DEMO_DRAFTS = [
  {
    id: "d1",
    communication_type: "handover_summary" as CommunicationType,
    title: "Day Shift Handover — 12 May 2026",
    content: "# Handover Summary — Day Shift, 12/05/2026\n\n## Young People Updates\n### Jayden\n**Mood:** Settled, engaged with activities...",
    status: "draft" as CommunicationStatus,
    child_id: null,
    aria_generated: true,
    created_by: "Sarah Mitchell",
    created_at: "2026-05-12T14:30:00Z",
    updated_at: "2026-05-12T14:30:00Z",
  },
  {
    id: "d2",
    communication_type: "social_worker_update" as CommunicationType,
    title: "Monthly Update — Amara Okafor",
    content: "# Professional Update: Amara Okafor\n**To:** David Chen (SW)\n\n## Placement Overview\nAmara continues to settle well...",
    status: "review" as CommunicationStatus,
    child_id: "c2",
    aria_generated: true,
    created_by: "James Wilson",
    created_at: "2026-05-10T09:15:00Z",
    updated_at: "2026-05-11T16:45:00Z",
  },
  {
    id: "d3",
    communication_type: "reg44_section" as CommunicationType,
    title: "Reg 44 Visit Report — April 2026",
    content: "# Regulation 44 Independent Visit\n**Date:** 28 April 2026\n\n## Summary of Visit\nVisit conducted...",
    status: "approved" as CommunicationStatus,
    child_id: null,
    aria_generated: false,
    created_by: "Independent Visitor",
    created_at: "2026-04-28T17:00:00Z",
    updated_at: "2026-05-02T10:00:00Z",
  },
  {
    id: "d4",
    communication_type: "incident_notification" as CommunicationType,
    title: "Incident Notification — Tyler Robinson",
    content: "# Incident Notification\n\n## Incident Summary\nAt approximately 15:30 on 11 May...",
    status: "sent" as CommunicationStatus,
    child_id: "c3",
    aria_generated: false,
    created_by: "Sarah Mitchell",
    created_at: "2026-05-11T16:00:00Z",
    updated_at: "2026-05-11T17:15:00Z",
  },
  {
    id: "d5",
    communication_type: "shift_briefing" as CommunicationType,
    title: "Night Shift Briefing — 12 May 2026",
    content: "# Night Shift Briefing — 12/05/2026\n\n## Risk Alerts\n- Tyler remains on enhanced monitoring...",
    status: "draft" as CommunicationStatus,
    child_id: null,
    aria_generated: true,
    created_by: "ARIA",
    created_at: "2026-05-12T19:30:00Z",
    updated_at: "2026-05-12T19:30:00Z",
  },
  {
    id: "d6",
    communication_type: "management_summary" as CommunicationType,
    title: "Weekly Management Summary — W/C 5 May 2026",
    content: "# Management Summary — Chamberlain House\n**Period:** 5–11 May 2026\n\n## Occupancy\n4/5 places occupied...",
    status: "sent" as CommunicationStatus,
    child_id: null,
    aria_generated: true,
    created_by: "Sarah Mitchell",
    created_at: "2026-05-11T18:00:00Z",
    updated_at: "2026-05-11T19:30:00Z",
  },
  {
    id: "d7",
    communication_type: "multi_agency_brief" as CommunicationType,
    title: "CLA Review Brief — Sophia Chen",
    content: "# CLA Review Meeting Brief\n**Meeting:** 15 May 2026\n\n## Meeting Context\nAnnual review...",
    status: "review" as CommunicationStatus,
    child_id: "c4",
    aria_generated: true,
    created_by: "James Wilson",
    created_at: "2026-05-09T11:00:00Z",
    updated_at: "2026-05-10T14:30:00Z",
  },
];

// ── Main page ──────────────────────────────────────────────────────────────

type FilterTab = "all" | "draft" | "review" | "approved" | "sent";

export default function CommunicationsPage() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "all") return DEMO_DRAFTS;
    return DEMO_DRAFTS.filter((d) => d.status === filter);
  }, [filter]);

  const selected = selectedId ? DEMO_DRAFTS.find((d) => d.id === selectedId) : null;

  // Stats
  const stats = {
    total: DEMO_DRAFTS.length,
    drafts: DEMO_DRAFTS.filter((d) => d.status === "draft").length,
    inReview: DEMO_DRAFTS.filter((d) => d.status === "review").length,
    sent: DEMO_DRAFTS.filter((d) => d.status === "sent").length,
    ariaGenerated: DEMO_DRAFTS.filter((d) => d.aria_generated).length,
  };

  return (
    <PageShell title="Communications Centre" subtitle="Professional communication drafts with ARIA writing support">
      <div className="space-y-6">
        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Total Drafts" value={stats.total} icon={FileText} />
          <StatCard label="In Progress" value={stats.drafts} icon={Edit3} color="text-gray-600 bg-gray-50" />
          <StatCard label="In Review" value={stats.inReview} icon={Eye} color="text-amber-600 bg-amber-50" />
          <StatCard label="Sent" value={stats.sent} icon={Send} color="text-emerald-600 bg-emerald-50" />
          <StatCard label="ARIA-Generated" value={stats.ariaGenerated} icon={Sparkles} color="text-violet-600 bg-violet-50" />
        </div>

        {/* Actions bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "draft", "review", "approved", "sent"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                filter === tab ? "bg-[var(--cs-primary)] text-white" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200",
              )}
            >
              {tab === "all" ? "All" : STATUS_LABELS[tab as CommunicationStatus]}
            </button>
          ))}
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(!showTemplates)} className="gap-1.5">
            <Clipboard className="h-4 w-4" /> Templates
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> New Draft
          </Button>
        </div>

        {/* Template picker */}
        {showTemplates && (
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" /> ARIA Communication Templates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(Object.entries(COMMUNICATION_TEMPLATES) as [CommunicationType, typeof COMMUNICATION_TEMPLATES[CommunicationType]][]).map(([key, tmpl]) => {
                  const Icon = TYPE_ICONS[key] ?? FileText;
                  return (
                    <button
                      key={key}
                      className="text-left p-3 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <Icon className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{tmpl.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{tmpl.description}</p>
                          {tmpl.regulationRef && (
                            <p className="text-[10px] text-violet-600 mt-1">{tmpl.regulationRef}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-6">
          {/* Draft list */}
          <div className={cn("space-y-3 transition-all", selected ? "w-1/2" : "w-full")}>
            {filtered.map((draft) => {
              const Icon = TYPE_ICONS[draft.communication_type] ?? FileText;
              const template = COMMUNICATION_TEMPLATES[draft.communication_type];
              const isActive = draft.id === selectedId;

              return (
                <Card
                  key={draft.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    isActive ? "ring-2 ring-[var(--cs-primary)] shadow-md" : "hover:shadow-sm",
                  )}
                  onClick={() => setSelectedId(isActive ? null : draft.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">{draft.title}</h4>
                          <Badge className={cn("text-[10px] shrink-0", STATUS_STYLES[draft.status])}>
                            {STATUS_LABELS[draft.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{template?.label ?? draft.communication_type}</span>
                          <span className="text-gray-300">|</span>
                          <span>By {draft.created_by}</span>
                          <span className="text-gray-300">|</span>
                          <span>{new Date(draft.created_at).toLocaleDateString("en-GB")}</span>
                          {draft.aria_generated && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span className="flex items-center gap-1 text-violet-600">
                                <Sparkles className="h-3 w-3" /> ARIA
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Preview panel */}
          {selected && (
            <div className="w-1/2 sticky top-4">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{selected.title}</h3>
                    <Badge className={cn(STATUS_STYLES[selected.status])}>{STATUS_LABELS[selected.status]}</Badge>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mb-4">
                    {selected.status === "draft" && (
                      <>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                          <Eye className="h-3.5 w-3.5" /> Submit for Review
                        </Button>
                      </>
                    )}
                    {selected.status === "review" && (
                      <Button size="sm" className="gap-1.5 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </Button>
                    )}
                    {selected.status === "approved" && (
                      <Button size="sm" className="gap-1.5 text-xs">
                        <Send className="h-3.5 w-3.5" /> Mark as Sent
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </Button>
                  </div>

                  {/* Content preview */}
                  <div className="bg-gray-50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap text-xs leading-relaxed font-mono">
                      {selected.content}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span>Created by {selected.created_by}</span>
                    <span>|</span>
                    <span>{new Date(selected.created_at).toLocaleString("en-GB")}</span>
                    {selected.aria_generated && (
                      <>
                        <span>|</span>
                        <span className="flex items-center gap-1 text-violet-600">
                          <Sparkles className="h-3 w-3" /> ARIA-generated draft
                        </span>
                      </>
                    )}
                  </div>

                  {/* Regulation reference */}
                  {COMMUNICATION_TEMPLATES[selected.communication_type]?.regulationRef && (
                    <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
                      <Shield className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-blue-700">
                        {COMMUNICATION_TEMPLATES[selected.communication_type].regulationRef}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color?: string }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", color ?? "text-blue-600 bg-blue-50")}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          <p className="text-[10px] text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
