"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — YOUNG PERSON PROFILE (redesigned)
// 15-tab profile grouped into Care · Wellbeing · Plans · Records · Intelligence
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  ArrowLeft, Heart, AlertTriangle, Shield, Pill, CalendarDays, CalendarClock,
  GraduationCap, Phone, Mail, User, MapPin, FileText,
  Activity, Loader2, AlertCircle, ChevronRight, Clock,
  Brain, CheckCircle2, Sparkles, X, MessageCircle, Plus, Tag,
  MessageSquare, HeartHandshake, Target, BookOpen, CheckSquare,
  Pencil, Archive,
} from "lucide-react";
import { ChildExperienceTab } from "@/components/intelligence/child-experience-tab";
import { CaraQuickActions } from "@/components/intelligence/cara-quick-actions";
import { useYoungPerson, useArchiveYoungPerson } from "@/hooks/use-young-people";
import { YoungPersonEditDialog } from "@/components/young-people/young-person-edit-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCreateTrainingNeed } from "@/hooks/use-ri-learning";
import { PrintButton } from "@/components/common/print-button";
import { ChildCalendarTab } from "@/components/calendar/child-calendar-tab";
import { ChildChronologyTab } from "@/components/young-person/child-chronology-tab";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { useDocumentIntelligence } from "@/hooks/use-doc-intelligence";
import { api } from "@/hooks/use-api";
import { useAuthContext } from "@/contexts/auth-context";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { INCIDENT_TYPE_LABELS } from "@/lib/constants";
import { useContactArrangements, useContactLogs } from "@/hooks/use-contact";
import { useMissingEpisodes } from "@/hooks/use-missing-episodes";
import type { Incident, Medication, CareForm, DailyLogEntry } from "@/types";
import type {
  ChronologyEntry, KeyWorkSession, KeyWorkTheme,
  ContactArrangement, ContactLog, MissingEpisode,
} from "@/types/extended";
import { useKeyWorkSessions, useCreateKeyWorkSession } from "@/hooks/use-intelligence";
import { EmptyState } from "@/components/ui/empty-state";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { Child360IntelligenceCard } from "@/components/intelligence/child-360-intelligence-card";
import { TherapeuticProgressCard } from "@/components/intelligence/therapeutic-progress-card";
import { FamilyRelationshipsCard } from "@/components/intelligence/family-relationships-card";
import { ChildEducationIntelligenceCard } from "@/components/intelligence/child-education-intelligence-card";
import { ChildHealthIntelligenceCard } from "@/components/intelligence/child-health-intelligence-card";
import { ChildBehaviourSafetyIntelligenceCard } from "@/components/intelligence/child-behaviour-safety-intelligence-card";
import { ChildIndependenceIntelligenceCard } from "@/components/intelligence/child-independence-intelligence-card";
import { ChildSafeguardingIntelligenceCard } from "@/components/intelligence/child-safeguarding-intelligence-card";
import { ChildSafeguardingActionsCard } from "@/components/intelligence/child-safeguarding-actions-card";
import { ChildPlacementQualityCard } from "@/components/intelligence/child-placement-quality-card";
import { ChildMissingIntelligenceCard } from "@/components/intelligence/child-missing-intelligence-card";
import { ChildLACReviewIntelligenceCard } from "@/components/intelligence/child-lac-review-intelligence-card";
import { ChildOutcomeIntelligenceCard } from "@/components/intelligence/child-outcome-intelligence-card";
import { ChildKeyworkingIntelligenceCard } from "@/components/intelligence/child-keyworking-intelligence-card";
import { ChildRiskProfileIntelligenceCard } from "@/components/intelligence/child-risk-profile-intelligence-card";
import { ChildDailyLifeIntelligenceCard } from "@/components/intelligence/child-daily-life-intelligence-card";
import { ChildMedicationIntelligenceCard } from "@/components/intelligence/child-medication-intelligence-card";
import { ChildRestrictivePracticeIntelligenceCard } from "@/components/intelligence/child-restrictive-practice-intelligence-card";
import { ChildEmotionalWellbeingIntelligenceCard } from "@/components/intelligence/child-emotional-wellbeing-intelligence-card";
import { ChildPracticeModulesCard } from "@/components/intelligence/child-practice-modules-card";
import { InlineRelationalPanel } from "@/components/relational-timeline/inline-relational-panel";
import { InlinePracticeReasoning } from "@/components/cara-reasoning/inline-practice-reasoning";

// ── Constants ─────────────────────────────────────────────────────────────────

const SEV_BADGE: Record<string, string> = {
  low:      "bg-slate-100 text-slate-700",
  medium:   "bg-amber-100 text-amber-800",
  high:     "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const MOOD_COLOR = (score: number | null) => {
  if (score === null) return "bg-slate-200";
  if (score >= 8) return "bg-emerald-400";
  if (score >= 6) return "bg-teal-400";
  if (score >= 4) return "bg-amber-400";
  return "bg-red-400";
};

const CONTACT_TYPE_LABELS: Record<string, string> = {
  face_to_face: "Face to face", telephone: "Telephone", video_call: "Video call",
  letter: "Letter", indirect: "Indirect", supervised_community: "Supervised (community)",
  overnight_stay: "Overnight stay",
};

const CONTACT_OUTCOME_COLORS: Record<string, string> = {
  positive: "text-emerald-600 bg-emerald-50 border-emerald-200",
  mixed: "text-amber-600 bg-amber-50 border-amber-200",
  difficult: "text-orange-600 bg-orange-50 border-orange-200",
  did_not_happen: "text-slate-500 bg-slate-50 border-slate-200",
  cancelled_by_family: "text-slate-500 bg-slate-50 border-slate-200",
  cancelled_by_yp: "text-violet-600 bg-violet-50 border-violet-200",
};

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function SectionHeading({ icon: Icon, label, count }: { icon: React.ElementType; label: string; count?: number }) {
  return (
    <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5" />{label}
      {count !== undefined && (
        <span className="ml-auto text-[10px] font-normal">{count} record{count !== 1 ? "s" : ""}</span>
      )}
    </h3>
  );
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-xs">
      {Icon && <Icon className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />}
      <span className="text-slate-500 shrink-0 w-32">{label}</span>
      <span className="text-slate-900 font-medium">{value}</span>
    </div>
  );
}

function EmptyTabState({ icon: Icon, label, description, action }: {
  icon: React.ElementType;
  label: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-8 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 mb-4">
        <Icon className="h-7 w-7 text-slate-300" />
      </div>
      <p className="text-[15px] font-semibold text-slate-800 mb-1">{label}</p>
      <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-0">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ── Cara tools (previously "Intelligence") ────────────────────────────────────

function ChildVoiceSummarySection({ childId, childName }: { childId: string; childName: string }) {
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  async function generate() {
    setGenerating(true);
    try {
      const res = await api.post<{ data: { response?: string; parsed?: { summary?: string }; text?: string } }>(
        "/cara",
        { mode: "voice_summary", source_content: `Child profile: ${childName}. Generate voice summary from care records.` }
      );
      const text = res.data?.response || res.data?.parsed?.summary || res.data?.text;
      if (text) { setSummary(text); setShowModal(true); }
    } catch { /* silent */ }
    finally { setGenerating(false); }
  }

  return (
    <>
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-emerald-900">Child Voice Summary</div>
            <div className="text-xs text-emerald-700 mt-0.5">Cara synthesis of what {childName} has said, felt, and expressed</div>
          </div>
          <Button onClick={generate} disabled={generating} className="bg-emerald-600 hover:bg-emerald-700 shrink-0 gap-1.5" size="sm">
            {generating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generating…</> : <><Sparkles className="h-3.5 w-3.5" />Generate</>}
          </Button>
        </div>
      </div>
      {showModal && summary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-y-auto overflow-x-hidden max-h-[calc(100dvh-2rem)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-emerald-600" /><span className="text-lg font-bold text-slate-900">Child Voice Summary</span></div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{summary}</div>
            </div>
            <div className="px-6 py-4 border-t">
              <Button onClick={() => setShowModal(false)} className="w-full">Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function WhatChangedSection({ childName, incidents, chronology, recentLog }: {
  childName: string;
  incidents: Incident[];
  chronology: ChronologyEntry[];
  recentLog: DailyLogEntry[];
}) {
  const [generating, setGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  async function generate() {
    setGenerating(true);
    try {
      const res = await api.post<{ data: { response?: string; text?: string } }>("/cara", {
        mode: "what_changed",
        source_content: `Young person: ${childName}\n\nRecent incidents:\n${incidents.slice(0, 5).map((i) => `${i.date}: ${i.type} — ${i.description}`).join("\n") || "(none)"}\n\nChronology:\n${chronology.slice(0, 8).map((c) => `${c.date}: [${c.category}] ${c.title}`).join("\n") || "(none)"}\n\nDaily logs:\n${recentLog.slice(0, 5).map((l) => `${l.date} [${l.entry_type}]: ${l.content}`).join("\n") || "(none)"}`,
      });
      const text = res.data?.response || res.data?.text;
      if (text) { setAnalysis(text); setShowModal(true); }
    } catch { /* silent */ }
    finally { setGenerating(false); }
  }

  return (
    <>
      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-violet-900">What Has Changed?</div>
            <div className="text-xs text-violet-700 mt-0.5">Cara analysis of progress, regression, risks and relationships over time</div>
          </div>
          <Button onClick={generate} disabled={generating} className="bg-violet-600 hover:bg-violet-700 shrink-0 gap-1.5" size="sm">
            {generating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Analysing…</> : <><Sparkles className="h-3.5 w-3.5" />Analyse</>}
          </Button>
        </div>
      </div>
      {showModal && analysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-y-auto overflow-x-hidden max-h-[calc(100dvh-2rem)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2"><Activity className="h-5 w-5 text-violet-600" /><span className="text-lg font-bold text-slate-900">What Has Changed — {childName}</span></div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{analysis}</div>
            </div>
            <div className="px-6 py-4 border-t"><Button onClick={() => setShowModal(false)} className="w-full">Close</Button></div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Tab type ──────────────────────────────────────────────────────────────────

type ProfileTab =
  | "overview" | "daily-life" | "calendar" | "voice"
  | "health" | "medication" | "education"
  | "plans-risk" | "keywork" | "family-time" | "missing"
  | "incidents" | "outcomes" | "chronology" | "documents"
  | "cara";

// ── Main page ─────────────────────────────────────────────────────────────────

export default function YoungPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [tab, setTab] = useState<ProfileTab>("overview");
  const [needsCreated, setNeedsCreated] = useState<Set<string>>(new Set());
  const createNeed = useCreateTrainingNeed();
  const docsQuery  = useDocumentIntelligence();

  const query   = useYoungPerson(id);
  const yp      = query.data?.data;
  const related = query.data?.related;
  const meta    = query.data?.meta;

  const [editOpen, setEditOpen]       = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const archive = useArchiveYoungPerson();

  const keyWorkQuery  = useKeyWorkSessions({ childId: id });
  const createSession = useCreateKeyWorkSession();
  const keyWorkSessions: KeyWorkSession[] = keyWorkQuery.data?.data ?? [];

  const contactArrangementsQuery = useContactArrangements({ childId: id });
  const contactLogsQuery         = useContactLogs({ childId: id });
  const arrangements: ContactArrangement[] = contactArrangementsQuery.data?.data ?? [];
  const contactLogs: ContactLog[]          = contactLogsQuery.data?.data ?? [];

  const missingQuery   = useMissingEpisodes({ childId: id });
  const missingEpisodes: MissingEpisode[] = missingQuery.data?.data ?? [];

  const [showKWForm, setShowKWForm] = useState(false);
  const [kwForm, setKwForm] = useState({
    title: "", theme: "general" as KeyWorkTheme,
    reason: "", aims: "", desired_outcomes: "", child_voice: "", staff_reflection: "",
  });

  function handleLogSession() {
    if (!kwForm.title.trim()) return;
    createSession.mutate(
      {
        home_id: homeId, child_id: id, title: kwForm.title, theme: kwForm.theme,
        reason: kwForm.reason, aims: kwForm.aims, desired_outcomes: kwForm.desired_outcomes,
        child_voice: kwForm.child_voice || undefined,
        staff_reflection: kwForm.staff_reflection || undefined,
        status: "completed", created_by: currentUser?.id ?? "staff_darren",
      },
      {
        onSuccess: () => {
          setShowKWForm(false);
          setKwForm({ title: "", theme: "general", reason: "", aims: "", desired_outcomes: "", child_voice: "", staff_reflection: "" });
        },
      }
    );
  }

  const linkedDocs = useMemo(() =>
    (docsQuery.data?.data ?? []).filter((d) => d.linked_child_id === id),
    [docsQuery.data, id]
  );

  // Aggregate child voice from all sources
  const voiceEntries = useMemo(() => {
    const entries: Array<{ id: string; date: string; text: string; source: string; context: string }> = [];
    keyWorkSessions.forEach((s) => {
      if (s.child_voice) entries.push({
        id: s.id, date: s.created_at?.slice(0, 10) ?? "",
        text: s.child_voice, source: "Key Work", context: s.title,
      });
    });
    contactLogs.forEach((l) => {
      if (l.yp_voice) entries.push({
        id: l.id, date: l.date,
        text: l.yp_voice, source: "Family Contact", context: CONTACT_TYPE_LABELS[l.contact_type] ?? l.contact_type,
      });
    });
    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }, [keyWorkSessions, contactLogs]);

  if (query.isLoading) {
    return (
      <PageShell title="Young Person Profile" showQuickCreate={false}>
        <div className="flex items-center justify-center py-24 gap-2 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading profile…</span>
        </div>
      </PageShell>
    );
  }

  if (query.isError || !yp) {
    return (
      <PageShell title="Young Person Profile" showQuickCreate={false}>
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-sm font-medium text-slate-600">Profile not found</p>
          <Button size="sm" variant="outline" onClick={() => router.push("/young-people")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />Back
          </Button>
        </div>
      </PageShell>
    );
  }

  const displayName = yp.preferred_name ?? yp.first_name;
  const hasRisk     = (yp.risk_flags?.length ?? 0) > 0;

  // Tab groups — defined here to access live counts
  const TAB_GROUPS: Array<{
    label: string;
    tabs: Array<{ id: ProfileTab; label: string; icon: React.ElementType; count?: number }>;
  }> = [
    {
      label: "Care",
      tabs: [
        { id: "overview",   label: "Overview",   icon: User },
        { id: "daily-life", label: "Daily Life",  icon: CalendarDays, count: related?.recent_log?.length || undefined },
        { id: "calendar",   label: "Calendar",    icon: CalendarClock },
        { id: "voice",      label: "Voice",       icon: MessageSquare, count: voiceEntries.length || undefined },
      ],
    },
    {
      label: "Wellbeing",
      tabs: [
        { id: "health",     label: "Health",     icon: Heart },
        { id: "medication", label: "Medication", icon: Pill,          count: related?.medications?.length || undefined },
        { id: "education",  label: "Education",  icon: GraduationCap },
      ],
    },
    {
      label: "Plans",
      tabs: [
        { id: "plans-risk",  label: "Plans & Risk", icon: Shield,         count: related?.care_forms?.length || undefined },
        { id: "keywork",     label: "Key Work",     icon: MessageCircle,  count: keyWorkSessions.length || undefined },
        { id: "family-time", label: "Family Time",  icon: HeartHandshake, count: arrangements.length || undefined },
        { id: "missing",     label: "Missing",      icon: MapPin,         count: missingEpisodes.length || undefined },
      ],
    },
    {
      label: "Records",
      tabs: [
        { id: "incidents",  label: "Incidents",  icon: AlertTriangle, count: meta?.total_incidents || undefined },
        { id: "outcomes",   label: "Outcomes",   icon: Target },
        { id: "chronology", label: "Chronology", icon: Activity,      count: (related?.chronology as unknown[])?.length || undefined },
        { id: "documents",  label: "Documents",  icon: FileText,      count: linkedDocs.length || undefined },
      ],
    },
    {
      label: "Intelligence",
      tabs: [
        { id: "cara", label: "Cara", icon: Sparkles },
      ],
    },
  ];

  return (
    <PageShell
      sensitive
      title={`${displayName} ${yp.last_name}`}
      subtitle={`${yp.legal_status} · ${yp.local_authority} · Age ${yp.age}`}
      showQuickCreate={false}
      recordAnything
      recordChildId={id}
      caraContext={{ sourceType: "child_record", sourceId: id, childId: id, childName: `${displayName} ${yp.last_name}` }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title={`${displayName} ${yp.last_name}`} subtitle="Young Person Profile" targetId="yp-detail-content" />
          <SmartUploadButton variant="icon" linkedChildId={id} uploadContext={`Young person profile — ${yp.first_name} ${yp.last_name}`} />
          <CaraStudioQuickActionButton context={{ record_type: "keywork", record_id: id, child_id: id, home_id: "home_oak" }} />
          <Link href={`/intelligence/cara/relationship-intelligence?child=${id}`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[var(--cs-cara-gold,#b45309)]" />Relationship Intelligence
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />Edit details
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-red-600 hover:text-red-700"
            disabled={yp.status === "ended"}
            onClick={() => setArchiveOpen(true)}
          >
            <Archive className="h-3.5 w-3.5" />{yp.status === "ended" ? "Archived" : "Archive"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/young-people")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />All Young People
          </Button>
        </div>
      }
    >
      <YoungPersonEditDialog child={yp} open={editOpen} onOpenChange={setEditOpen} />
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>End placement & archive</DialogTitle>
            <DialogDescription>
              This ends {displayName}&apos;s placement — the status becomes “Ended” and they leave
              the current roster. The record and its full history are preserved (this is not a
              deletion) and can be reactivated by editing the status. The change is recorded in the
              audit trail.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveOpen(false)} disabled={archive.isPending}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={archive.isPending}
              onClick={async () => {
                try {
                  await archive.mutateAsync(id);
                  toast.success("Placement ended and archived.");
                  setArchiveOpen(false);
                } catch {
                  toast.error("Could not archive the record. Please try again.");
                }
              }}
            >
              {archive.isPending ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Archiving…</> : "End placement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div id="yp-detail-content" className="space-y-4 animate-fade-in">

        <CaraPanel
          mode="assist"
          pageContext={`Young Person Profile — ${displayName} ${yp.last_name}`}
          recordType="child_record"
          sourceContent={`Name: ${displayName} ${yp.last_name}. Age: ${yp.age}. Legal status: ${yp.legal_status}. Local authority: ${yp.local_authority}.`}
          userRole="registered_manager"
          className="mb-4"
        />

        {/* ── Profile header ─────────────────────────────────────────────────── */}
        <div className={cn(
          "rounded-2xl border p-5 shadow-[var(--cs-shadow-card)] bg-gradient-to-br from-white via-white to-teal-50/40",
          hasRisk && "border-l-4 border-l-amber-400",
          (missingEpisodes.some((e) => !e.date_returned)) && "border-l-4 border-l-red-500",
        )}>
          {/* Currently missing alert */}
          {missingEpisodes.some((e) => !e.date_returned) && (
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <MapPin className="h-5 w-5 text-red-600 shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-800">Currently missing from care</p>
                <p className="text-xs text-red-600 mt-0.5">Police notified · LA informed · Active episode open</p>
              </div>
              <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 shrink-0" asChild>
                <Link href="/missing-from-care">View episode</Link>
              </Button>
            </div>
          )}

          <div className="flex items-start gap-4">
            <Avatar name={displayName} size="lg" className="shrink-0 ring-2 ring-[var(--cs-teal)]/15 ring-offset-2 ring-offset-white shadow-sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">{displayName} {yp.last_name}</h2>
                <Badge variant={yp.status === "current" ? "success" : "secondary"} className="rounded-full capitalize text-[10px]">
                  {yp.status}
                </Badge>
                {hasRisk && (
                  <Badge variant="warning" className="rounded-full text-[9px] gap-0.5">
                    <AlertTriangle className="h-2.5 w-2.5" />Risk flags
                  </Badge>
                )}
              </div>
              <div className="text-sm text-slate-500 mt-0.5">{yp.placement_type} · {yp.local_authority}</div>

              {/* Stats row */}
              <div className="cs-stagger mt-3 flex flex-wrap gap-5">
                {[
                  { label: "Incidents",  value: meta?.open_incidents ?? 0,       color: meta?.open_incidents ? "text-red-600" : "text-emerald-600" },
                  { label: "Tasks",      value: meta?.active_tasks ?? 0,         color: meta?.active_tasks ? "text-amber-600" : "text-slate-700" },
                  { label: "Medication", value: yp.active_medications ?? 0,      color: "text-blue-600" },
                  { label: "Missing",    value: yp.missing_episodes_total ?? 0,  color: yp.missing_episodes_total ? "text-violet-600" : "text-slate-700" },
                  { label: "Key Work",   value: keyWorkSessions.length,           color: "text-teal-600" },
                  { label: "Contacts",   value: arrangements.length,             color: "text-indigo-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <div className={cn("text-2xl font-bold leading-none tabular-nums", color)}>{value}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk flags */}
          {hasRisk && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(yp.risk_flags ?? []).map((flag) => (
                <Badge key={flag} variant="warning" className="text-[9px] rounded-full gap-0.5 px-2 py-0.5">
                  <AlertTriangle className="h-2.5 w-2.5 shrink-0" />{flag}
                </Badge>
              ))}
            </div>
          )}

          {yp.allergies.length > 0 && (
            <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              <strong>Allergy:</strong> {yp.allergies.join(", ")}
            </div>
          )}
        </div>

        {/* ── Tab bar ────────────────────────────────────────────────────────── */}
        <div className="flex items-end overflow-x-auto border-b border-slate-200 gap-0.5 scrollbar-none -mb-1">
          {TAB_GROUPS.map((group, gi) => (
            <React.Fragment key={group.label}>
              {gi > 0 && (
                <div className="w-px shrink-0 self-stretch bg-slate-150 mx-1" style={{ marginBottom: 2 }} />
              )}
              {group.tabs.map(({ id: tabId, label, icon: Icon, count }) => (
                <button
                  key={tabId}
                  onClick={() => setTab(tabId)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium border-b-2 whitespace-nowrap transition-all shrink-0",
                    tab === tabId
                      ? "border-indigo-500 text-indigo-700"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                  {count !== undefined && count > 0 && (
                    <span className={cn(
                      "rounded-full px-1.5 text-[9px] font-bold",
                      tab === tabId ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600",
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB PANELS                                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4 space-y-2">
              <SectionHeading icon={MapPin} label="Placement Details" />
              <InfoRow label="Placement start"  value={formatDate(yp.placement_start)} />
              {yp.placement_end && <InfoRow label="Placement end"   value={formatDate(yp.placement_end)} />}
              <InfoRow label="Placement type"   value={yp.placement_type} />
              <InfoRow label="Legal status"     value={yp.legal_status} />
              <InfoRow label="Local authority"  value={yp.local_authority} />
              <InfoRow label="Date of birth"    value={formatDate(yp.date_of_birth)} />
              <InfoRow label="Gender"           value={yp.gender} />
              {yp.ethnicity && <InfoRow label="Ethnicity"    value={yp.ethnicity} />}
              {yp.religion  && <InfoRow label="Religion"     value={yp.religion}  />}
              {yp.dietary_requirements && <InfoRow label="Dietary req." value={yp.dietary_requirements} />}
            </div>

            <div className="rounded-2xl border bg-white p-4 space-y-4">
              <SectionHeading icon={User} label="Key Contacts" />
              {yp.key_worker && (
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Key Worker</div>
                  <div className="flex items-center gap-2">
                    <Avatar name={yp.key_worker.full_name} size="sm" />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{yp.key_worker.full_name}</div>
                      <div className="text-[10px] text-slate-500">{yp.key_worker.job_title}</div>
                    </div>
                  </div>
                </div>
              )}
              {yp.secondary_worker && (
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Secondary Worker</div>
                  <div className="flex items-center gap-2">
                    <Avatar name={yp.secondary_worker.full_name} size="sm" />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{yp.secondary_worker.full_name}</div>
                      <div className="text-[10px] text-slate-500">{yp.secondary_worker.job_title}</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Social Worker</div>
                <div className="text-xs font-semibold text-slate-900">{yp.social_worker_name}</div>
                {yp.social_worker_phone && <a href={`tel:${yp.social_worker_phone}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Phone className="h-3 w-3" />{yp.social_worker_phone}</a>}
                {yp.social_worker_email && <a href={`mailto:${yp.social_worker_email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Mail className="h-3 w-3" />{yp.social_worker_email}</a>}
              </div>
              {yp.iro_name && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">IRO</div>
                  <div className="text-xs font-semibold text-slate-900">{yp.iro_name}</div>
                  {yp.iro_phone && <a href={`tel:${yp.iro_phone}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Phone className="h-3 w-3" />{yp.iro_phone}</a>}
                </div>
              )}
            </div>

            {/* Active tasks widget */}
            {(related?.tasks?.length ?? 0) > 0 && (
              <div className="rounded-2xl border bg-white p-4 sm:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <SectionHeading icon={CheckSquare} label="Active Tasks" count={related?.tasks?.length} />
                  <Link href="/tasks" className="text-[11px] text-blue-600 hover:underline">All tasks →</Link>
                </div>
                <div className="space-y-1">
                  {related?.tasks?.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs">
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0",
                        task.priority === "urgent" ? "bg-red-500" :
                        task.priority === "high" ? "bg-orange-500" : "bg-slate-400"
                      )} />
                      <span className="flex-1 text-slate-700 font-medium truncate">{task.title}</span>
                      {task.due_date && (
                        <span className={cn("text-[10px] shrink-0",
                          task.due_date < new Date().toISOString().slice(0, 10) ? "text-red-600 font-semibold" : "text-slate-400"
                        )}>
                          {formatRelative(task.due_date)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practice reasoning — Cara's read of this child across all engines */}
            <div className="sm:col-span-2">
              <InlinePracticeReasoning childId={id} childName={displayName} />
            </div>

            {/* Child 360 Intelligence Profile */}
            <div className="sm:col-span-2">
              <Child360IntelligenceCard childId={id} />
            </div>

            {/* Therapeutic Progress Intelligence */}
            <div className="sm:col-span-2">
              <TherapeuticProgressCard childId={id} />
            </div>

            {/* Family & Relationships Intelligence */}
            <div className="sm:col-span-2">
              <FamilyRelationshipsCard childId={id} />
            </div>

            {/* Education & Learning Intelligence */}
            <div className="sm:col-span-2">
              <ChildEducationIntelligenceCard childId={id} />
            </div>

            {/* Health & Wellbeing Intelligence */}
            <div className="sm:col-span-2">
              <ChildHealthIntelligenceCard childId={id} />
            </div>

            {/* Behaviour & Safety Intelligence */}
            <div className="sm:col-span-2">
              <ChildBehaviourSafetyIntelligenceCard childId={id} />
            </div>

            {/* Independence & Life Skills Intelligence */}
            <div className="sm:col-span-2">
              <ChildIndependenceIntelligenceCard childId={id} />
            </div>

            {/* Safeguarding — open actions (operational) then the analysis */}
            <div className="sm:col-span-2">
              <ChildSafeguardingActionsCard childId={id} childName={displayName} />
            </div>

            {/* Safeguarding Intelligence */}
            <div className="sm:col-span-2">
              <ChildSafeguardingIntelligenceCard childId={id} />
            </div>

            {/* Placement Quality Intelligence */}
            <div className="sm:col-span-2">
              <ChildPlacementQualityCard childId={id} />
            </div>

            {/* Missing & Return Intelligence */}
            <div className="sm:col-span-2">
              <ChildMissingIntelligenceCard childId={id} />
            </div>

            {/* LAC Review Intelligence */}
            <div className="sm:col-span-2">
              <ChildLACReviewIntelligenceCard childId={id} />
            </div>

            {/* Outcome Progress Intelligence */}
            <div className="sm:col-span-2">
              <ChildOutcomeIntelligenceCard childId={id} />
            </div>

            {/* Keyworking Intelligence */}
            <div className="sm:col-span-2">
              <ChildKeyworkingIntelligenceCard childId={id} />
            </div>

            {/* Risk Profile Intelligence */}
            <div className="sm:col-span-2">
              <ChildRiskProfileIntelligenceCard childId={id} />
            </div>

            {/* Daily Life Intelligence */}
            <div className="sm:col-span-2">
              <ChildDailyLifeIntelligenceCard childId={id} />
            </div>

            {/* Medication Safety Intelligence */}
            <div className="sm:col-span-2">
              <ChildMedicationIntelligenceCard childId={id} />
            </div>

            {/* Restrictive Practice Intelligence */}
            <div className="sm:col-span-2">
              <ChildRestrictivePracticeIntelligenceCard childId={id} />
            </div>

            {/* Emotional Wellbeing Intelligence */}
            <div className="sm:col-span-2">
              <ChildEmotionalWellbeingIntelligenceCard childId={id} />
            </div>

            {/* Rights, Safety & Relationships — practice modules surfaced inline at the child record */}
            <div className="sm:col-span-2">
              <ChildPracticeModulesCard childId={id} />
            </div>

            {/* Relational timeline — the child's relationship story (connection / repair / rupture) */}
            <div className="sm:col-span-2">
              <InlineRelationalPanel childId={id} />
            </div>
          </div>
        )}

        {/* ── Daily Life ────────────────────────────────────────────────────── */}
        {tab === "daily-life" && (
          <div className="space-y-2">
            {(!related?.recent_log || related.recent_log.length === 0) ? (
              <EmptyTabState icon={CalendarDays} label="No daily log entries" description="Daily log entries for this young person will appear here." />
            ) : (
              <div className="relative pl-4">
                <div className="absolute left-0 top-2 bottom-2 w-px bg-slate-200" />
                {related.recent_log.map((entry: DailyLogEntry, i) => (
                  <div key={i} className="relative mb-3 ml-4">
                    <span className="absolute -left-6 top-3 flex h-2.5 w-2.5 items-center justify-center">
                      <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", MOOD_COLOR(entry.mood_score))} />
                    </span>
                    <div className="rounded-2xl border border-slate-100 bg-white p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                          entry.entry_type === "behaviour" ? "bg-orange-100 text-orange-700" :
                          entry.entry_type === "health" ? "bg-blue-100 text-blue-700" :
                          entry.entry_type === "education" ? "bg-teal-100 text-teal-700" :
                          entry.entry_type === "mood" ? "bg-violet-100 text-violet-700" :
                          "bg-slate-100 text-slate-600"
                        )}>
                          {entry.entry_type}
                        </span>
                        {entry.mood_score !== null && (
                          <span className="text-[10px] text-slate-400">Mood: {entry.mood_score}/10</span>
                        )}
                        {entry.is_significant && (
                          <Badge variant="warning" className="text-[9px] rounded-full">Significant</Badge>
                        )}
                        <span className="ml-auto text-[10px] text-slate-400">{formatDate(entry.date)} {entry.time}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{entry.content}</p>
                      <div className="mt-2 text-[10px] text-slate-400">by {getStaffName(entry.staff_id)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Calendar ─────────────────────────────────────────────────────── */}
        {tab === "calendar" && (
          <ChildCalendarTab childId={id} childName={displayName} />
        )}

        {/* ── Voice ────────────────────────────────────────────────────────── */}
        {tab === "voice" && (
          <div className="space-y-3">
            {voiceEntries.length === 0 ? (
              <EmptyTabState
                icon={MessageSquare}
                label="No voice entries yet"
                description={`${displayName}'s voice will appear here from key work sessions and family contact logs.`}
              />
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3">
                  <MessageSquare className="h-5 w-5 text-teal-600 shrink-0" />
                  <p className="text-sm text-teal-800">
                    <strong>{voiceEntries.length}</strong> voice {voiceEntries.length === 1 ? "entry" : "entries"} recorded from {displayName} — aggregated from key work and family contact sessions.
                  </p>
                </div>
                {voiceEntries.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-teal-100 bg-white p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 rounded-full px-2 py-0.5">{entry.source}</span>
                      <span className="text-[10px] text-slate-400">{entry.context}</span>
                      <span className="ml-auto text-[10px] text-slate-400">{formatDate(entry.date)}</span>
                    </div>
                    <blockquote className="border-l-2 border-teal-300 pl-3">
                      <p className="text-sm text-slate-800 leading-relaxed italic">&ldquo;{entry.text}&rdquo;</p>
                    </blockquote>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── Health ───────────────────────────────────────────────────────── */}
        {tab === "health" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4 space-y-3">
              <SectionHeading icon={Heart} label="GP & Medical" />
              {yp.gp_name ? (
                <div className="space-y-1.5">
                  <InfoRow label="GP" value={yp.gp_name} />
                  {yp.gp_phone && (
                    <a href={`tel:${yp.gp_phone}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      <Phone className="h-3 w-3" />{yp.gp_phone}
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No GP recorded</p>
              )}
              {yp.dietary_requirements && (
                <InfoRow label="Dietary req." value={yp.dietary_requirements} />
              )}
            </div>

            <div className="rounded-2xl border bg-white p-4 space-y-3">
              <SectionHeading icon={AlertTriangle} label="Allergies & Alerts" />
              {yp.allergies.length > 0 ? (
                yp.allergies.map((allergy) => (
                  <div key={allergy} className="rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <span className="text-sm font-semibold text-red-800">{allergy}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> No known allergies
                </div>
              )}
            </div>

            {hasRisk && (
              <div className="rounded-2xl border bg-white p-4 sm:col-span-2">
                <SectionHeading icon={Shield} label="Health-related Risk Flags" />
                <div className="flex flex-wrap gap-2 mt-2">
                  {yp.risk_flags
                    .filter((f) => ["self_harm", "mental_health", "substance_misuse"].includes(f))
                    .map((flag) => (
                      <Badge key={flag} variant="warning" className="rounded-full text-[10px] gap-1">
                        <AlertTriangle className="h-2.5 w-2.5" />{flag.replace("_", " ")}
                      </Badge>
                    ))}
                  {(yp.risk_flags ?? []).filter((f) => ["self_harm", "mental_health", "substance_misuse"].includes(f)).length === 0 && (
                    <p className="text-xs text-slate-400">No health-specific risk flags</p>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-2xl border bg-white p-4 sm:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <SectionHeading icon={Pill} label="Current Medication" count={related?.medications?.length} />
                <button onClick={() => setTab("medication")} className="text-[11px] text-blue-600 hover:underline">Full medication tab →</button>
              </div>
              {(related?.medications?.length ?? 0) === 0 ? (
                <p className="text-xs text-slate-400 italic">No active medications</p>
              ) : (
                <div className="space-y-2">
                  {related?.medications?.slice(0, 3).map((med: Medication) => (
                    <div key={med.id} className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2">
                      <Pill className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="text-xs font-semibold text-blue-900">{med.name} {med.dosage}</span>
                      <span className="text-xs text-blue-600 ml-auto">{med.frequency}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Medication ───────────────────────────────────────────────────── */}
        {tab === "medication" && (
          <div className="space-y-3">
            {(!related?.medications || related.medications.length === 0) ? (
              <EmptyTabState icon={Pill} label="No active medications" description="Active medication records for this young person will appear here." />
            ) : (
              related.medications.map((med: Medication) => (
                <div key={med.id} className="rounded-2xl border bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{med.name} — {med.dosage}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{med.type === "regular" ? "Regular" : "PRN (as required)"}</div>
                    </div>
                    <Badge variant={med.type === "regular" ? "default" : "secondary"} className="text-[9px] rounded-full capitalize">
                      {med.type}
                    </Badge>
                  </div>
                  <div className="mt-3 grid sm:grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-400">Frequency: </span><span className="font-medium text-slate-700">{med.frequency}</span></div>
                    <div><span className="text-slate-400">Route: </span><span className="font-medium text-slate-700">{med.route}</span></div>
                    <div><span className="text-slate-400">Prescriber: </span><span className="font-medium text-slate-700">{med.prescriber}</span></div>
                    <div><span className="text-slate-400">Pharmacy: </span><span className="font-medium text-slate-700">{med.pharmacy}</span></div>
                    <div><span className="text-slate-400">Stock: </span><span className="font-medium text-slate-700">{med.stock_count} remaining</span></div>
                    <div><span className="text-slate-400">Started: </span><span className="font-medium text-slate-700">{formatDate(med.start_date)}</span></div>
                  </div>
                  {med.special_instructions && (
                    <div className="mt-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-800">{med.special_instructions}</div>
                  )}
                  {med.side_effects && (
                    <div className="mt-2 text-xs text-slate-500"><span className="font-medium">Side effects: </span>{med.side_effects}</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Education ────────────────────────────────────────────────────── */}
        {tab === "education" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4 space-y-3">
              <SectionHeading icon={GraduationCap} label="School Placement" />
              {yp.school_name ? (
                <>
                  <InfoRow label="School name" value={yp.school_name} icon={GraduationCap} />
                  {yp.school_contact && (
                    <a href={`tel:${yp.school_contact}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      <Phone className="h-3 w-3" />{yp.school_contact}
                    </a>
                  )}
                </>
              ) : (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-3">
                  <p className="text-xs font-semibold text-amber-800">No school placement recorded</p>
                  <p className="text-[10px] text-amber-600 mt-0.5">This should be addressed in the care plan. A school place should be secured within 20 days of placement.</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border bg-white p-4 space-y-3">
              <SectionHeading icon={BookOpen} label="Education Notes" />
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Personal Education Plan (PEP)</p>
                <p className="text-xs text-slate-600">PEP records are maintained by the placing local authority. Contact the social worker for access.</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">EHCP / SEN</p>
                <p className="text-xs text-slate-600">Education, Health and Care Plan details held by the placing authority.</p>
              </div>
              <Link href="/documents" className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                <FileText className="h-3.5 w-3.5" />View education documents →
              </Link>
            </div>
          </div>
        )}

        {/* ── Plans & Risk ─────────────────────────────────────────────────── */}
        {tab === "plans-risk" && (
          <div className="space-y-4">
            {hasRisk && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <SectionHeading icon={AlertTriangle} label="Risk Flags" count={(yp.risk_flags?.length ?? 0)} />
                <div className="flex flex-wrap gap-2 mt-1">
                  {(yp.risk_flags ?? []).map((flag) => (
                    <Badge key={flag} variant="warning" className="text-[10px] rounded-full gap-1 px-2.5 py-1">
                      <AlertTriangle className="h-2.5 w-2.5 shrink-0" />{flag.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <SectionHeading icon={FileText} label="Care Forms & Plans" count={related?.care_forms?.length} />
              {(!related?.care_forms || related.care_forms.length === 0) ? (
                <EmptyTabState icon={FileText} label="No care forms" description="Care plans, risk assessments, and welfare checks will appear here." />
              ) : (
                related.care_forms.map((form: CareForm) => (
                  <div
                    key={form.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/forms/${form.id}`)}
                    onKeyDown={(e) => e.key === "Enter" && router.push(`/forms/${form.id}`)}
                    className="rounded-2xl border bg-white p-4 hover:bg-[var(--cs-surface)] transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{form.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5 capitalize">{form.form_type.replace(/_/g, " ")}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={form.status === "approved" ? "success" : form.status === "pending_review" ? "warning" : "secondary"} className="text-[9px] rounded-full capitalize">
                          {form.status.replace(/_/g, " ")}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Key Work ─────────────────────────────────────────────────────── */}
        {tab === "keywork" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Key Work Sessions</h3>
                <p className="text-xs text-slate-500 mt-0.5">Individual key work record for {displayName} — Reg 36 Children&apos;s Homes Regulations 2015</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/intelligence/cara/keywork">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-violet-500" />Cara Planner
                  </Button>
                </Link>
                <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShowKWForm((p) => !p)}>
                  <Plus className="h-3.5 w-3.5" />{showKWForm ? "Cancel" : "Log Session"}
                </Button>
              </div>
            </div>

            {showKWForm && (
              <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 space-y-3">
                <p className="text-xs font-semibold text-teal-800 flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5" />Log a completed key work session
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide block mb-1">Session Title *</label>
                    <input className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-slate-400"
                      placeholder="e.g. Safety planning session"
                      value={kwForm.title} onChange={(e) => setKwForm((p) => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide block mb-1">Theme</label>
                    <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      value={kwForm.theme} onChange={(e) => setKwForm((p) => ({ ...p, theme: e.target.value as KeyWorkTheme }))}>
                      {(["staying_safe_online","missing_from_care","exploitation","healthy_relationships","emotional_regulation","trust","identity","self_esteem","education","safety_planning","voice_of_the_child","future_goals","general"] as KeyWorkTheme[]).map((t) => (
                        <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide block mb-1">Reason for Session</label>
                  <textarea rows={2} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-slate-400"
                    placeholder="Why was this session held?"
                    value={kwForm.reason} onChange={(e) => setKwForm((p) => ({ ...p, reason: e.target.value }))} />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide block mb-1">Aims</label>
                    <textarea rows={2} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-slate-400"
                      placeholder="What did you aim to achieve?"
                      value={kwForm.aims} onChange={(e) => setKwForm((p) => ({ ...p, aims: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide block mb-1">Desired Outcomes</label>
                    <textarea rows={2} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-slate-400"
                      placeholder="What were the hoped-for outcomes?"
                      value={kwForm.desired_outcomes} onChange={(e) => setKwForm((p) => ({ ...p, desired_outcomes: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-teal-700 uppercase tracking-wide block mb-1">Child Voice *</label>
                  <textarea rows={3} className="w-full rounded-xl border border-teal-200 bg-white px-3 py-2 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-slate-400"
                    placeholder={`What did ${displayName} say, feel, or express? Use their own words where possible…`}
                    value={kwForm.child_voice} onChange={(e) => setKwForm((p) => ({ ...p, child_voice: e.target.value }))} />
                  <p className="text-[10px] text-teal-600 mt-1">Record faithfully — this is the voice of the child</p>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide block mb-1">Staff Reflection</label>
                  <textarea rows={2} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-slate-400"
                    placeholder="How did the session go? What will you do differently next time?"
                    value={kwForm.staff_reflection} onChange={(e) => setKwForm((p) => ({ ...p, staff_reflection: e.target.value }))} />
                </div>
                <Button size="sm" onClick={handleLogSession} disabled={!kwForm.title.trim() || createSession.isPending} className="gap-1.5 bg-teal-600 hover:bg-teal-700">
                  {createSession.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Save Key Work Record
                </Button>
              </div>
            )}

            {keyWorkSessions.length === 0 && !showKWForm ? (
              <EmptyTabState
                icon={MessageCircle}
                label="No key work sessions recorded"
                description="Log sessions here or plan them using the Cara Key Work Builder."
                action={
                  <div className="flex items-center justify-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowKWForm(true)} className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" />Log Session</Button>
                    <Link href="/intelligence/cara/keywork"><Button size="sm" variant="outline" className="gap-1.5 text-xs"><Sparkles className="h-3.5 w-3.5 text-violet-500" />Cara Planner</Button></Link>
                  </div>
                }
              />
            ) : (
              <div className="space-y-3">
                {keyWorkSessions.map((session) => {
                  const statusColour =
                    session.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                    session.status === "reviewed" ? "bg-blue-100 text-blue-700" :
                    session.status === "completed" ? "bg-teal-100 text-teal-700" :
                    "bg-slate-100 text-slate-600";
                  return (
                    <div key={session.id} className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 shrink-0">
                          <MessageCircle className="h-4 w-4 text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900">{session.title}</span>
                            <Badge className={cn("text-[9px] rounded-full capitalize h-4 px-1.5", statusColour)}>{session.status}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1 text-[10px] text-slate-500"><Tag className="h-2.5 w-2.5" />{session.theme.replace(/_/g, " ")}</span>
                            {session.created_at && <span className="text-[10px] text-slate-400">{formatRelative(session.created_at.slice(0, 10))}</span>}
                            {session.created_by && <span className="text-[10px] text-slate-400">· {getStaffName(session.created_by)}</span>}
                          </div>
                        </div>
                      </div>
                      {session.reason && <div><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Reason</p><p className="text-xs text-slate-600 leading-relaxed">{session.reason}</p></div>}
                      {session.child_voice && (
                        <div className="rounded-xl border border-teal-100 bg-teal-50 p-3">
                          <p className="text-[10px] font-semibold text-teal-700 uppercase tracking-wide mb-1 flex items-center gap-1"><MessageCircle className="h-2.5 w-2.5" />Child Voice</p>
                          <p className="text-xs text-teal-900 leading-relaxed italic">&ldquo;{session.child_voice}&rdquo;</p>
                        </div>
                      )}
                      {session.staff_reflection && <div><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Staff Reflection</p><p className="text-xs text-slate-600 leading-relaxed">{session.staff_reflection}</p></div>}
                      {session.cara_summary && (
                        <div className="rounded-xl border border-violet-100 bg-violet-50/40 px-3 py-2">
                          <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide mb-0.5 flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" />Cara Summary</p>
                          <p className="text-xs text-slate-700">{session.cara_summary}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-2.5">
              <Shield className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide mb-0.5">Regulation 36 — Key Working</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">Each looked after child must have a designated keyworker who maintains regular individual sessions. Sessions must be recorded and evidence the child&apos;s voice, aims, and follow-up actions.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Family Time ──────────────────────────────────────────────────── */}
        {tab === "family-time" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Family Contact</h3>
                <p className="text-xs text-slate-500 mt-0.5">Approved contact arrangements and recorded sessions for {displayName}</p>
              </div>
              <Link href="/family-contact">
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  <HeartHandshake className="h-3.5 w-3.5" />Full Contact Register
                </Button>
              </Link>
            </div>

            {contactArrangementsQuery.isLoading ? (
              <div className="flex items-center gap-2 py-6 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Loading contact data…</span></div>
            ) : arrangements.length === 0 ? (
              <EmptyTabState
                icon={HeartHandshake}
                label="No contact arrangements"
                description="Contact arrangements for this young person will appear here once added."
                action={<Link href="/family-contact"><Button size="sm" variant="outline" className="text-xs">Go to Family Contact Register</Button></Link>}
              />
            ) : (
              <>
                <div className="space-y-3">
                  <SectionHeading icon={HeartHandshake} label="Contact Arrangements" count={arrangements.length} />
                  {arrangements.map((arr) => (
                    <div key={arr.id} className="rounded-2xl border bg-white p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-slate-900 capitalize">
                            {CONTACT_TYPE_LABELS[arr.contact_type] ?? arr.contact_type}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {arr.frequency_detail} · {arr.supervision_level?.replace(/_/g, " ")}
                          </div>
                        </div>
                        <Badge className={cn("text-[9px] rounded-full capitalize",
                          arr.status === "active" ? "bg-emerald-100 text-emerald-700" :
                          arr.status === "suspended" ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-600"
                        )}>
                          {arr.status}
                        </Badge>
                      </div>
                      {arr.court_ordered && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-violet-600">
                          <Shield className="h-2.5 w-2.5" />Court ordered {arr.court_order_reference && `· ${arr.court_order_reference}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {contactLogs.length > 0 && (
                  <div className="space-y-2">
                    <SectionHeading icon={Clock} label="Recent Contact Sessions" count={contactLogs.length} />
                    {contactLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className={cn("rounded-2xl border p-4", CONTACT_OUTCOME_COLORS[log.outcome] ?? "border-slate-100 bg-white")}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-slate-900">{formatDate(log.date)}</span>
                          <span className="text-xs text-slate-500">{CONTACT_TYPE_LABELS[log.contact_type] ?? log.contact_type}</span>
                          <Badge className={cn("text-[9px] rounded-full capitalize ml-auto", CONTACT_OUTCOME_COLORS[log.outcome])}>
                            {log.outcome?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        {log.narrative && <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{log.narrative}</p>}
                        {log.yp_voice && (
                          <div className="mt-2 rounded-lg border-l-2 border-teal-300 pl-3">
                            <p className="text-xs text-teal-800 italic">&ldquo;{log.yp_voice}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Missing Episodes ─────────────────────────────────────────────── */}
        {tab === "missing" && (
          <div className="space-y-3">
            {missingQuery.isLoading ? (
              <div className="flex items-center gap-2 py-6 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Loading missing episodes…</span></div>
            ) : missingEpisodes.length === 0 ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-emerald-800">No missing episodes recorded</p>
                <p className="text-xs text-emerald-600 mt-1">{displayName} has no recorded missing from care episodes.</p>
              </div>
            ) : (
              <>
                {missingEpisodes.some((e) => !e.date_returned) && (
                  <div className="flex items-center gap-3 rounded-2xl border border-red-300 bg-red-50 px-5 py-4">
                    <MapPin className="h-6 w-6 text-red-600 shrink-0 animate-pulse" />
                    <div>
                      <p className="text-sm font-bold text-red-800">Active missing episode</p>
                      <p className="text-xs text-red-600 mt-0.5">Police and LA should be notified. Return interview required upon return.</p>
                    </div>
                  </div>
                )}
                {missingEpisodes.map((episode) => (
                  <div key={episode.id} className={cn(
                    "rounded-2xl border bg-white p-4 border-l-4",
                    !episode.date_returned ? "border-l-red-500" :
                    episode.risk_level === "critical" ? "border-l-red-400" :
                    episode.risk_level === "high" ? "border-l-orange-400" :
                    episode.risk_level === "medium" ? "border-l-amber-400" :
                    "border-l-slate-300"
                  )}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{episode.reference}</span>
                          <Badge className={cn("text-[9px] rounded-full capitalize", SEV_BADGE[episode.risk_level])}>
                            {episode.risk_level} risk
                          </Badge>
                          {!episode.date_returned && (
                            <Badge variant="destructive" className="text-[9px] rounded-full">Active</Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Missing: {formatDate(episode.date_missing)} at {episode.time_missing}
                          {episode.date_returned && ` · Returned: ${formatDate(episode.date_returned)}`}
                          {episode.duration_hours && ` · ${Math.round(episode.duration_hours)}h`}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid sm:grid-cols-3 gap-2 text-xs">
                      <div className={cn("rounded-lg px-2.5 py-2 text-center",
                        episode.reported_to_police ? "bg-emerald-50" : "bg-red-50"
                      )}>
                        <div className={cn("font-semibold", episode.reported_to_police ? "text-emerald-700" : "text-red-700")}>
                          {episode.reported_to_police ? "✓" : "✗"} Police
                        </div>
                        {episode.police_reference && <div className="text-[10px] text-slate-500">{episode.police_reference}</div>}
                      </div>
                      <div className={cn("rounded-lg px-2.5 py-2 text-center",
                        episode.reported_to_la ? "bg-emerald-50" : "bg-red-50"
                      )}>
                        <div className={cn("font-semibold", episode.reported_to_la ? "text-emerald-700" : "text-red-700")}>
                          {episode.reported_to_la ? "✓" : "✗"} LA Notified
                        </div>
                      </div>
                      <div className={cn("rounded-lg px-2.5 py-2 text-center",
                        episode.return_interview_completed ? "bg-emerald-50" : episode.date_returned ? "bg-amber-50" : "bg-slate-50"
                      )}>
                        <div className={cn("font-semibold",
                          episode.return_interview_completed ? "text-emerald-700" :
                          episode.date_returned ? "text-amber-700" : "text-slate-400"
                        )}>
                          {episode.return_interview_completed ? "✓" : "—"} Return Interview
                        </div>
                        {episode.return_interview_date && <div className="text-[10px] text-slate-500">{formatDate(episode.return_interview_date)}</div>}
                      </div>
                    </div>
                    {episode.contextual_safeguarding_risk && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-2.5 py-2 text-xs text-red-700">
                        <AlertTriangle className="h-3 w-3 shrink-0" />Contextual safeguarding risk identified
                      </div>
                    )}
                    {episode.pattern_notes && (
                      <div className="mt-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-2.5 py-2">
                        <span className="font-medium">Pattern notes: </span>{episode.pattern_notes}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── Incidents ────────────────────────────────────────────────────── */}
        {tab === "incidents" && (
          <div className="space-y-2">
            {(!related?.incidents || related.incidents.length === 0) ? (
              <EmptyTabState icon={AlertTriangle} label="No incidents recorded" description="Incidents linked to this young person will appear here." />
            ) : (
              related.incidents.map((inc: Incident) => (
                <div
                  key={inc.id}
                  role="button" tabIndex={0}
                  onClick={() => router.push(`/incidents/${inc.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && router.push(`/incidents/${inc.id}`)}
                  className="rounded-2xl border bg-white p-4 hover:bg-[var(--cs-surface)] transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{inc.reference}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", SEV_BADGE[inc.severity])}>{inc.severity}</span>
                        <Badge variant={inc.status === "open" ? "destructive" : inc.status === "closed" ? "success" : "warning"} className="text-[9px] rounded-full capitalize">
                          {inc.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{INCIDENT_TYPE_LABELS[inc.type]}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400">{formatDate(inc.date)}</span>
                      <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{inc.description}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Outcomes ─────────────────────────────────────────────────────── */}
        {tab === "outcomes" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-indigo-900">Placement Outcomes</p>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Outcomes are tracked against the care plan and pathway plan. Use Cara to generate a progress summary against stated outcomes.
                  </p>
                </div>
              </div>
            </div>

            {/* Outcomes from care plan forms */}
            {(related?.care_forms?.filter((f: CareForm) => f.form_type?.includes("plan") || f.form_type?.includes("review")).length ?? 0) > 0 ? (
              <div className="space-y-2">
                <SectionHeading icon={FileText} label="Plan Reviews" />
                {related?.care_forms?.filter((f: CareForm) => f.form_type?.includes("plan") || f.form_type?.includes("review")).map((form: CareForm) => (
                  <div key={form.id} role="button" tabIndex={0}
                    onClick={() => router.push(`/forms/${form.id}`)}
                    onKeyDown={(e) => e.key === "Enter" && router.push(`/forms/${form.id}`)}
                    className="rounded-2xl border bg-white p-4 hover:bg-[var(--cs-surface)] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{form.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5 capitalize">{form.form_type.replace(/_/g, " ")}</div>
                      </div>
                      <Badge variant={form.status === "approved" ? "success" : "warning"} className="text-[9px] rounded-full capitalize">
                        {form.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyTabState
                icon={Target}
                label="No outcome records found"
                description="Link care plans and review forms to track progress against stated outcomes."
                action={
                  <Button size="sm" variant="outline" onClick={() => setTab("plans-risk")} className="text-xs">
                    View Plans & Risk →
                  </Button>
                }
              />
            )}
          </div>
        )}

        {/* ── Chronology ───────────────────────────────────────────────────── */}
        {tab === "chronology" && (
          <ChildChronologyTab childId={id} childName={displayName} />
        )}

        {/* ── Documents ────────────────────────────────────────────────────── */}
        {tab === "documents" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Linked Documents</h3>
                <p className="text-xs text-slate-500 mt-0.5">All documents uploaded and linked to {displayName}</p>
              </div>
              <SmartUploadButton variant="inline" label="Upload Document" linkedChildId={id} uploadContext={`${displayName} ${yp.last_name} — document upload`} />
            </div>

            {linkedDocs.length === 0 ? (
              <EmptyTabState
                icon={FileText}
                label="No documents yet"
                description="Upload placement plans, risk assessments, LAC reviews, and more — Cara will classify and extract intelligence automatically."
                action={<SmartUploadButton variant="button" label="Upload First Document" linkedChildId={id} uploadContext={`${displayName} ${yp.last_name} — first document`} />}
              />
            ) : (
              <div className="space-y-3">
                {linkedDocs.map((doc) => {
                  const riskLeft: Record<string, string> = { low: "border-l-emerald-400", medium: "border-l-amber-400", high: "border-l-orange-500", critical: "border-l-red-600" };
                  const statusBg: Record<string, string> = { review: "bg-amber-100 text-amber-700", approved: "bg-blue-100 text-blue-700", actioned: "bg-emerald-100 text-emerald-700", analysing: "bg-violet-100 text-violet-700", pending: "bg-slate-100 text-slate-600" };
                  return (
                    <div key={doc.id} className={`rounded-2xl border bg-white p-4 border-l-4 ${riskLeft[doc.ai_risk_level ?? "low"] ?? "border-l-slate-200"}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                          <FileText className="h-4 w-4 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold text-slate-900 truncate">{doc.original_file_name}</span>
                            {doc.document_status && (
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusBg[doc.document_status] ?? statusBg.pending}`}>
                                {doc.document_status.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                          {doc.ai_result?.ai_summary && <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{doc.ai_result.ai_summary}</p>}
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                            <span>{formatDate(doc.uploaded_at)}</span>
                            {doc.tasks_created.length > 0 && <span className="text-violet-600 font-medium">{doc.tasks_created.length} task{doc.tasks_created.length !== 1 ? "s" : ""} created</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Cara (Intelligence) ──────────────────────────────────────────── */}
        {tab === "cara" && (
          <div className="space-y-5">
            <CaraQuickActions childId={yp.id} sourceType="young_person_profile" sourceId={yp.id} defaultOpen />
            <ChildVoiceSummarySection childId={yp.id} childName={displayName} />
            <WhatChangedSection
              childName={displayName}
              incidents={related?.incidents ?? []}
              chronology={(related?.chronology ?? []) as ChronologyEntry[]}
              recentLog={related?.recent_log ?? []}
            />
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100">
                  <Brain className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Raise Training Need</div>
                  <div className="text-xs text-slate-500">Flag a staff training need from {displayName}&apos;s care profile</div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {([
                  { key: "safeguarding",   label: "Safeguarding awareness",     type: "safeguarding",          priority: "high"   as const },
                  { key: "de_escalation",  label: "De-escalation techniques",   type: "de_escalation",         priority: "high"   as const },
                  { key: "mental_health",  label: "Mental health first aid",    type: "mental_health_first_aid",priority: "medium" as const },
                  { key: "exploitation",   label: "Exploitation awareness",     type: "exploitation_awareness", priority: "high"   as const },
                  { key: "trauma",         label: "Trauma-informed practice",   type: "trauma_informed",       priority: "medium" as const },
                  { key: "medication",     label: "Medication management",      type: "medication_management",  priority: "medium" as const },
                ] as Array<{ key: string; label: string; type: string; priority: "urgent" | "high" | "medium" | "low" }>).map(({ key, label, type, priority }) => (
                  <button
                    key={key}
                    disabled={needsCreated.has(key) || createNeed.isPending}
                    onClick={() =>
                      createNeed.mutate(
                        {
                          home_id: homeId, identified_by: "manual", need_type: type,
                          title: `${label} — ${displayName}'s care team`,
                          description: `Training need identified from ${displayName}'s care profile.`,
                          priority, status: "identified",
                          cara_evidence: `Identified from YP profile: ${displayName}. Care team training need: ${label}.`,
                        },
                        { onSuccess: () => setNeedsCreated((p) => new Set(p).add(key)) }
                      )
                    }
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition-colors",
                      needsCreated.has(key)
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default"
                        : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50 text-slate-700"
                    )}
                  >
                    {needsCreated.has(key) ? (
                      <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /><span className="font-medium">{label}</span><span className="text-emerald-500 text-[10px]">logged</span></>
                    ) : (
                      <><Brain className="h-3.5 w-3.5 text-violet-500" /><span className="font-medium">{label}</span><Sparkles className="h-3 w-3 text-slate-300" /></>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <ChildExperienceTab childId={yp.id} childName={displayName} />
          </div>
        )}

      <CareEventsPanel
        title={`${displayName}'s Care Events`}
        childId={id}
        days={90}
        defaultCollapsed={false}
        className="mt-6"
      />
      </div>
    </PageShell>
  );
}
