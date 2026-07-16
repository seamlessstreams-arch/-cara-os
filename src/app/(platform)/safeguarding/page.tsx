"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CaraPanel } from "@/components/cara/cara-panel";
import {
  AlertTriangle, Shield, Eye, CheckCircle2, Clock, FileText,
  Plus, Users, MapPin, Calendar, Phone, Bell, TrendingUp,
  ArrowUpRight, Loader2, X, ChevronRight, UserCheck, Sparkles,
  Link2, BookOpen, Activity, Brain, Link, Search, ArrowUpDown,
} from "lucide-react";
import { useIncidents, useAddOversight } from "@/hooks/use-incidents";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useCreateTrainingNeed } from "@/hooks/use-ri-learning";
import { useMissingEpisodes } from "@/hooks/use-missing-episodes";
import { useChronologyEntries } from "@/hooks/use-chronology-entries";
import { api } from "@/hooks/use-api";
import { getStaffName, getYPName, getYPById } from "@/lib/seed-data";
import { INCIDENT_TYPE_LABELS } from "@/lib/constants";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import type { Incident } from "@/types";
import type { MissingEpisode, ChronologyEntry, ChronologyCategory } from "@/types/extended";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import NextLink from "next/link";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Static seed data (display only) ──────────────────────────────────────────


// ── Design helpers ────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  low: { badge: "bg-slate-100 text-slate-700", dot: "bg-slate-400", label: "Low" },
  medium: { badge: "bg-[--cs-warning-bg] text-[--cs-warning]", dot: "bg-[--cs-warning]", label: "Medium" },
  high: { badge: "bg-orange-100 text-orange-800", dot: "bg-orange-500", label: "High" },
  critical: { badge: "bg-[--cs-risk-bg] text-[--cs-risk]", dot: "bg-[--cs-risk]", label: "Critical" },
} as const;

const SEV_CONFIG = {
  critical: { badge: "bg-[--cs-risk-bg] text-[--cs-risk]", border: "border-l-[--cs-risk]", dot: "bg-[--cs-risk]" },
  high: { badge: "bg-orange-100 text-orange-800", border: "border-l-orange-500", dot: "bg-orange-500" },
  medium: { badge: "bg-[--cs-warning-bg] text-[--cs-warning]", border: "border-l-[--cs-warning]", dot: "bg-[--cs-warning]" },
  low: { badge: "bg-slate-100 text-slate-700", border: "border-l-slate-300", dot: "bg-slate-400" },
} as const;

const CHRONO_CATEGORY_CONFIG: Record<ChronologyCategory, { color: string; dot: string; label: string }> = {
  placement: { color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", label: "Placement" },
  incident: { color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", label: "Incident" },
  missing: { color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500", label: "Missing" },
  safeguarding: { color: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500", label: "Safeguarding" },
  health: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Health" },
  education: { color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", label: "Education" },
  contact: { color: "bg-slate-50 text-slate-700 border-slate-200", dot: "bg-slate-500", label: "Contact" },
  legal: { color: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500", label: "Legal" },
  review: { color: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500", label: "Review" },
  behaviour: { color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500", label: "Behaviour" },
  other: { color: "bg-slate-50 text-slate-600 border-slate-200", dot: "bg-slate-400", label: "Other" },
};

const SIGNIFICANCE_CONFIG = {
  critical: { dot: "bg-[--cs-risk] ring-2 ring-[--cs-risk-soft]", label: "Critical" },
  significant: { dot: "bg-[--cs-warning] ring-2 ring-[--cs-warning-soft]", label: "Significant" },
  routine: { dot: "bg-slate-300", label: "Routine" },
};

const TABS = [
  { id: "concerns", label: "Safeguarding Concerns", icon: Shield },
  { id: "mfc", label: "Missing from Care", icon: TrendingUp },
  { id: "chronology", label: "Chronology", icon: BookOpen },
  { id: "manager", label: "Manager Actions", icon: UserCheck },
] as const;
type TabId = typeof TABS[number]["id"];

// ── YP Avatar ─────────────────────────────────────────────────────────────────

function YPAvatar({ childId }: { childId: string }) {
  const yp = getYPById(childId);
  const name = yp?.preferred_name || yp?.first_name || "?";
  return (
    <div className="h-8 w-8 rounded-full bg-violet-100 text-violet-700 text-sm font-bold flex items-center justify-center shrink-0">
      {name[0]}
    </div>
  );
}

// ── Severity / type maps for training needs ───────────────────────────────────

const SG_SEV_PRIORITY: Record<string, "urgent" | "high" | "medium" | "low"> = {
  critical: "urgent", high: "high", medium: "medium", low: "low",
};
const SG_TYPE_NEED: Record<string, string> = {
  safeguarding_concern: "safeguarding",
  exploitation_concern: "safeguarding",
  contextual_safeguarding: "safeguarding",
  allegation: "safeguarding",
  self_harm: "mental_health_first_aid",
  missing_from_care: "missing_from_care_response",
};

// ── Concern Card (extracted so each card owns its own state) ─────────────────

function ConcernCard({
  inc,
  onOversightClick,
}: {
  inc: Incident;
  onOversightClick: (inc: Incident) => void;
}) {
  const [needCreated, setNeedCreated] = useState(false);
  const createNeed = useCreateTrainingNeed();
  const sev = SEV_CONFIG[inc.severity] ?? SEV_CONFIG.low;
  const needsOversight = inc.requires_oversight && !inc.oversight_by;

  const handleCreateNeed = () => {
    createNeed.mutate({
      title: `Safeguarding learning: ${INCIDENT_TYPE_LABELS[inc.type] || inc.type}`,
      need_type: SG_TYPE_NEED[inc.type] ?? "safeguarding",
      priority: SG_SEV_PRIORITY[inc.severity] ?? "high",
      identified_by: "incident",
      status: "identified",
      description: `Identified from safeguarding concern ${inc.reference}. ${inc.description.slice(0, 200)}`,
      linked_incident_id: inc.id,
    }, { onSuccess: () => setNeedCreated(true) });
  };

  return (
    <div className={cn("rounded-2xl border bg-white border-l-4 p-5", sev.border)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <YPAvatar childId={inc.child_id} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-900">{inc.reference}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", sev.badge)}>
              {inc.severity}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              {INCIDENT_TYPE_LABELS[inc.type] || inc.type}
            </span>
            {(inc as never as { care_event_id?: string }).care_event_id && (
              <NextLink
                href={`/care-events/${(inc as never as { care_event_id: string }).care_event_id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <ArrowUpRight className="h-3 w-3" />
                From Care Event
              </NextLink>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="font-semibold text-violet-700">{getYPName(inc.child_id)}</span>
            <span>·</span>
            <span>{formatDate(inc.date)} at {inc.time}</span>
            {inc.location && <><span>·</span><span>{inc.location}</span></>}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 text-sm text-slate-700 leading-relaxed">{inc.description}</p>

      {/* Actions taken */}
      {inc.immediate_action && (
        <div className="mt-3 rounded-xl bg-slate-50 p-3">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Actions Taken</div>
          <p className="text-xs text-slate-700">{inc.immediate_action}</p>
        </div>
      )}

      {/* Notifications */}
      {inc.notifications.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {inc.notifications.map((n, i) => (
            <span
              key={i}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                n.acknowledged ? "bg-[--cs-success-bg] text-[--cs-success]" : "bg-slate-100 text-slate-600"
              )}
            >
              <Bell className="h-2.5 w-2.5" />
              {n.role}
              {n.acknowledged && <CheckCircle2 className="h-2.5 w-2.5" />}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <a
          href={`/safeguarding/${inc.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors ml-auto"
        >
          <ChevronRight className="h-3.5 w-3.5" />
          Full Record
        </a>
        {needsOversight ? (
          <button
            onClick={() => onOversightClick(inc)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[--cs-warning] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-colors"
          >
            <Shield className="h-3.5 w-3.5" />
            Record Oversight
          </button>
        ) : inc.oversight_by ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[--cs-success-bg] border border-[--cs-success-soft] px-2.5 py-1 text-xs font-medium text-[--cs-success]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Oversight by {getStaffName(inc.oversight_by)} · {formatDate(inc.oversight_at)}
          </span>
        ) : null}

        {needCreated ? (
          <a
            href="/learning/training-needs"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[--cs-success-bg] border border-[--cs-success-soft] px-2.5 py-1 text-xs font-medium text-[--cs-success] hover:bg-[--cs-success-soft] transition-colors"
          >
            <Link className="h-3.5 w-3.5" />
            Training need created
          </a>
        ) : (
          <button
            onClick={handleCreateNeed}
            disabled={createNeed.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 border border-violet-200 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors disabled:opacity-50"
          >
            {createNeed.isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Brain className="h-3.5 w-3.5" />
            }
            Create Training Need
          </button>
        )}
      </div>
    </div>
  );
}

// ── Tab 1: Safeguarding Concerns ──────────────────────────────────────────────

interface SafeguardingScanResult {
  themes: Array<{
    theme: string;
    incidents: string[];
    confidence: "high" | "medium" | "low";
    escalation_flag: boolean;
    severity: string;
  }>;
  overall_risk: "critical" | "high" | "medium" | "low";
  cross_yp_patterns: string[];
  recommended_actions: string[];
  timestamp: string;
}

function SafeguardingConcernsTab() {
  const { currentUser } = useAuthContext();
  const [filterChild, setFilterChild] = useState("all");
  const [concernSearch, setConcernSearch] = useState("");
  const [sortBy, setSortBy] = useState<"severity" | "date" | "type" | "child">("severity");
  const [oversightTarget, setOversightTarget] = useState<Incident | null>(null);
  const [oversightNote, setOversightNote] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [scanResults, setScanResults] = useState<SafeguardingScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const addOversight = useAddOversight();

  const query = useIncidents({ status: "open" });
  const ypQuery = useYoungPeople();
  const allYP = ypQuery.data?.data ?? [];
  const allOpen: Incident[] = query.data?.data ?? [];

  const SAFEGUARDING_TYPES = [
    "safeguarding_concern", "exploitation_concern", "self_harm",
    "missing_from_care", "contextual_safeguarding", "allegation",
  ];

  const concerns = useMemo(() => {
    let list = allOpen.filter((i) => SAFEGUARDING_TYPES.includes(i.type));
    if (filterChild !== "all") list = list.filter((i) => i.child_id === filterChild);
    if (concernSearch.trim()) {
      const q = concernSearch.toLowerCase();
      list = list.filter((i) => {
        const hay = [
          i.description,
          getYPName(i.child_id ?? ""),
          getStaffName(i.reported_by),
          INCIDENT_TYPE_LABELS[i.type] || i.type,
          i.severity,
          i.location || "",
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
    // Sort
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "type":
          return a.type.localeCompare(b.type);
        case "child":
          return getYPName(a.child_id ?? "").localeCompare(getYPName(b.child_id ?? ""));
        case "severity":
        default: {
          const w: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
          return (w[a.severity] ?? 2) - (w[b.severity] ?? 2);
        }
      }
    });
  }, [allOpen, filterChild, concernSearch, sortBy]);

  function handleOversight() {
    if (!oversightTarget || !oversightNote.trim()) return;
    addOversight.mutate(
      { id: oversightTarget.id, note: oversightNote, by: currentUser?.id ?? "staff_darren" },
      { onSuccess: () => { setOversightTarget(null); setOversightNote(""); } }
    );
  }

  async function handleScan() {
    if (concerns.length === 0) return;
    setIsScanning(true);
    try {
      const concernText = concerns.map((c) => `${c.reference} (${c.type}): ${c.description}`).join("\n\n");
      const res = await api.post<{ data: { response?: string; parsed?: SafeguardingScanResult; text?: string } }>(
        "/cara",
        {
          mode: "safeguarding_scan",
          source_content: concernText,
        }
      );
      
      // Try to get scan results from response field (as JSON string), parsed field, or text field
      let results: SafeguardingScanResult | null = null;
      
      if (res.data?.response) {
        try {
          // If response is a JSON string, parse it
          results = typeof res.data.response === 'string' ? JSON.parse(res.data.response) : res.data.response;
        } catch (parseErr) {
          console.error("Failed to parse response as JSON:", parseErr);
        }
      }
      
      if (!results && res.data?.parsed) {
        results = res.data.parsed as SafeguardingScanResult;
      }
      
      if (results) {
        setScanResults(results);
        setScanOpen(true);
      }
    } catch (e) {
      console.error("Safeguarding scan failed:", e);
    } finally {
      setIsScanning(false);
    }
  }

  if (query.isPending) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Alert for critical */}
      {concerns.some((c) => c.severity === "critical") && (
        <div className="rounded-2xl border border-[--cs-risk-soft] bg-[--cs-risk-bg] p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[--cs-risk] shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-[--cs-risk]">Critical safeguarding concerns require immediate action</div>
            <div className="text-xs text-[--cs-risk] mt-0.5">Ensure all statutory notifications have been made. Strategy discussion to be arranged where appropriate.</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Open Concerns", value: concerns.length, color: "text-[--cs-risk]" },
          { label: "Critical", value: concerns.filter((c) => c.severity === "critical").length, color: "text-[--cs-risk]" },
          { label: "Needs Oversight", value: concerns.filter((c) => c.requires_oversight && !c.oversight_by).length, color: "text-[--cs-warning]" },
          { label: "YP with Risk Flags", value: allYP.filter((y) => (y.risk_flags?.length ?? 0) > 0).length, color: "text-violet-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-white p-4 text-center">
            <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Safeguarding Scan Button */}
      {concerns.length > 0 && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-violet-900">Cara Safeguarding Scan</div>
              <div className="text-xs text-violet-700 mt-0.5">Analyse all concerns for themes, patterns, and escalation risks</div>
            </div>
            <Button
              onClick={() => { setScanResults(null); setScanOpen(true); handleScan(); }}
              disabled={isScanning}
              className="bg-violet-600 hover:bg-violet-700 shrink-0"
              size="sm"
            >
              {isScanning ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Scanning…</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5" />Scan Now</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search concerns, staff, type…"
            value={concernSearch}
            onChange={(e) => setConcernSearch(e.target.value)}
            className="pl-8 h-8 text-xs rounded-lg"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
          <ArrowUpDown className="h-3.5 w-3.5" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-white border rounded-md px-2 py-1.5 text-xs">
            <option value="severity">Severity (critical first)</option>
            <option value="date">Newest first</option>
            <option value="type">Type A–Z</option>
            <option value="child">Young person A–Z</option>
          </select>
        </div>
        <select
          value={filterChild}
          onChange={(e) => setFilterChild(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="all">All young people</option>
          {allYP.map((yp) => (
            <option key={yp.id} value={yp.id}>{yp.preferred_name || yp.first_name}</option>
          ))}
        </select>
        <span className="text-xs text-slate-400">{concerns.length} concern{concerns.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Concern cards */}
      {concerns.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center">
          <CheckCircle2 className="h-8 w-8 text-[--cs-success] mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-900">
            {concernSearch || filterChild !== "all" ? "No concerns match your filters" : "No open safeguarding concerns"}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {concerns.map((inc) => (
            <ConcernCard
              key={inc.id}
              inc={inc}
              onOversightClick={setOversightTarget}
            />
          ))}
        </div>
      )}

      {/* Oversight drawer */}
      {oversightTarget && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm" onClick={() => setOversightTarget(null)}>
          <div className="w-full max-w-lg bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[--cs-warning]" />
                  <span className="text-sm font-bold text-slate-900">Safeguarding Oversight</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{oversightTarget.reference} — {getYPName(oversightTarget.child_id)}</div>
              </div>
              <button onClick={() => setOversightTarget(null)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-700 leading-relaxed">{oversightTarget.description}</p>
              </div>
              <CaraPanel
                mode="oversee"
                pageContext="Safeguarding — Oversight"
                recordType="safeguarding_oversight"
                sourceContent={`${oversightTarget.description}\n\nImmediate action: ${oversightTarget.immediate_action}`}
                onInsert={(text) => setOversightNote(text)}
              />
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Oversight note <span className="text-[--cs-risk]">*</span></label>
                <textarea
                  value={oversightNote}
                  onChange={(e) => setOversightNote(e.target.value)}
                  rows={5}
                  placeholder="Record your safeguarding oversight — considerations, decisions, follow-up actions, strategy discussion outcomes…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-400 leading-relaxed"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleOversight} disabled={!oversightNote.trim() || addOversight.isPending} className="bg-[--cs-warning] hover:opacity-90 flex-1">
                  {addOversight.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</> : <><Shield className="h-3.5 w-3.5" />Record Oversight</>}
                </Button>
                <Button variant="outline" onClick={() => setOversightTarget(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safeguarding Scan Modal */}
      {scanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setScanOpen(false)}>
          <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-violet-600" />
                <span className="text-lg font-bold text-slate-900">Safeguarding Scan Results</span>
              </div>
              <button onClick={() => setScanOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
              {isScanning ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
                </div>
              ) : scanResults ? (
                <>
                  {/* Overall Risk */}
                  <div className={cn(
                    "rounded-2xl border-l-4 p-4",
                    scanResults.overall_risk === "critical" ? "border-l-[--cs-risk] bg-[--cs-risk-bg] border border-[--cs-risk-soft]" :
                    scanResults.overall_risk === "high" ? "border-l-orange-500 bg-orange-50 border border-orange-200" :
                    scanResults.overall_risk === "medium" ? "border-l-[--cs-warning] bg-[--cs-warning-bg] border border-[--cs-warning-soft]" :
                    "border-l-[--cs-success] bg-[--cs-success-bg] border border-[--cs-success-soft]"
                  )}>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Overall Risk</div>
                    <div className="text-lg font-bold capitalize text-slate-900">{scanResults.overall_risk}</div>
                  </div>

                  {/* Themes */}
                  {scanResults.themes.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Identified Themes ({scanResults.themes.length})
                      </div>
                      <div className="space-y-2">
                        {scanResults.themes.map((theme, i) => (
                          <div key={i} className={cn(
                            "rounded-xl border p-3",
                            theme.escalation_flag ? "border-[--cs-risk-soft] bg-[--cs-risk-bg]" : "border-slate-200 bg-slate-50"
                          )}>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1">
                                <div className="font-semibold text-slate-900 text-sm">{theme.theme}</div>
                                <div className="text-xs text-slate-600 mt-0.5">Severity: <span className="font-medium capitalize">{theme.severity}</span></div>
                              </div>
                              <span className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize shrink-0",
                                theme.confidence === "high" ? "bg-[--cs-success-bg] text-[--cs-success]" :
                                theme.confidence === "medium" ? "bg-[--cs-warning-bg] text-[--cs-warning]" :
                                "bg-slate-100 text-slate-600"
                              )}>
                                {theme.confidence} confidence
                              </span>
                            </div>
                            {theme.incidents.length > 0 && (
                              <div className="text-xs text-slate-700">
                                <span className="font-medium">Linked to:</span> {theme.incidents.join(", ")}
                              </div>
                            )}
                            {theme.escalation_flag && (
                              <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[--cs-risk-bg] px-2 py-1 text-[10px] font-semibold text-[--cs-risk]">
                                <AlertTriangle className="h-3 w-3" />
                                Escalation flagged
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cross-YP Patterns */}
                  {scanResults.cross_yp_patterns.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Cross-Young Person Patterns
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <ul className="space-y-1.5">
                          {scanResults.cross_yp_patterns.map((pattern, i) => (
                            <li key={i} className="text-xs text-slate-700 flex gap-2">
                              <span className="text-slate-400">•</span>
                              <span>{pattern}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Recommended Actions */}
                  {scanResults.recommended_actions.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Recommended Actions
                      </div>
                      <div className="rounded-xl border border-[--cs-success-soft] bg-[--cs-success-bg] p-3">
                        <ul className="space-y-1.5">
                          {scanResults.recommended_actions.map((action, i) => (
                            <li key={i} className="text-xs text-[--cs-success] flex gap-2">
                              <span className="text-[--cs-success]">✓</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t text-xs text-slate-500 text-center">
                    Scan completed {scanResults.timestamp ? `on ${formatDate(scanResults.timestamp)}` : ""}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center">
                  <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                  <div className="text-sm text-slate-600">Unable to complete scan</div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4">
              <Button onClick={() => setScanOpen(false)} className="w-full">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Missing from Care ──────────────────────────────────────────────────

function MFCEpisodeCard({ ep }: { ep: MissingEpisode }) {
  const risk = RISK_CONFIG[ep.risk_level] ?? RISK_CONFIG.low;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn(
      "rounded-2xl border bg-white overflow-hidden",
      ep.contextual_safeguarding_risk ? "border-rose-200" : "border-slate-200"
    )}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn("h-2.5 w-2.5 rounded-full mt-1.5 shrink-0", risk.dot)} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">{ep.reference}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", risk.badge)}>
                  {ep.risk_level} risk
                </span>
                {ep.contextual_safeguarding_risk && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    CS Risk
                  </span>
                )}
                {ep.status === "active" && (
                  <span className="rounded-full bg-[--cs-risk-bg] px-2 py-0.5 text-[10px] font-bold text-[--cs-risk] animate-pulse">
                    ACTIVE
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                <span>{formatDate(ep.date_missing)} at {ep.time_missing}</span>
                {ep.duration_hours && (
                  <span className="font-medium text-slate-700">{ep.duration_hours}h absent</span>
                )}
                {ep.return_location && <span>· Returned: {ep.return_location}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium text-violet-600 hover:text-violet-800 shrink-0"
          >
            {expanded ? "Less" : "Details"}
          </button>
        </div>

        {/* Location */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-medium text-slate-400 mb-0.5">Last seen</div>
            <div className="text-xs text-slate-700 leading-snug">{ep.location_last_seen}</div>
          </div>
          {ep.return_location && (
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <div className="text-[10px] font-medium text-slate-400 mb-0.5">Return location</div>
              <div className="text-xs text-slate-700 leading-snug">{ep.return_location}</div>
            </div>
          )}
        </div>

        {/* Status chips */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium",
            ep.reported_to_police ? "bg-[--cs-info-bg] text-[--cs-info]" : "bg-slate-100 text-slate-500"
          )}>
            <Shield className="h-3 w-3" />
            Police {ep.reported_to_police ? `— ${ep.police_reference || "Reported"}` : "Not reported"}
          </span>
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium",
            ep.reported_to_la ? "bg-[--cs-info-bg] text-[--cs-info]" : "bg-slate-100 text-slate-500"
          )}>
            <Bell className="h-3 w-3" />
            LA {ep.reported_to_la ? "notified" : "not notified"}
          </span>
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium",
            ep.return_interview_completed
              ? "bg-[--cs-success-bg] text-[--cs-success]"
              : "bg-[--cs-warning-bg] text-[--cs-warning]"
          )}>
            <UserCheck className="h-3 w-3" />
            RTH {ep.return_interview_completed ? `— ${getStaffName(ep.return_interview_by ?? "")}` : "Required"}
          </span>
          {ep.linked_incident_id && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-medium text-violet-700">
              <Link2 className="h-3 w-3" />
              Linked incident
            </span>
          )}
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 space-y-3 pt-4 border-t border-slate-100">
            {ep.pattern_notes && (
              <div className="rounded-xl bg-rose-50 border border-rose-100 p-3">
                <div className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider mb-1">Pattern Notes</div>
                <p className="text-xs text-rose-800 leading-relaxed">{ep.pattern_notes}</p>
              </div>
            )}
            {ep.return_interview_notes && (
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Return to Home Interview</div>
                <p className="text-xs text-slate-700 leading-relaxed">{ep.return_interview_notes}</p>
                <div className="mt-1.5 text-[10px] text-slate-400">
                  Completed by {getStaffName(ep.return_interview_by ?? "")} · {formatDate(ep.return_interview_date)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const EMPTY_LOG_FORM = { yp_id: "yp_alex", date: "", time: "", risk: "medium" as string, location: "" };

function MFCTab() {
  const [filterChild, setFilterChild] = useState("yp_alex");
  const [logOpen, setLogOpen] = useState(false);
  const [logForm, setLogForm] = useState(EMPTY_LOG_FORM);
  const [logError, setLogError] = useState("");
  const [logPending, setLogPending] = useState(false);
  const mfcYpQuery = useYoungPeople();
  const mfcAllYP = mfcYpQuery.data?.data ?? [];
  const { data: mfcResult } = useMissingEpisodes({ homeId: "home_oak" });
  const MFC_EPISODES = mfcResult?.data ?? [];

  const alexEpisodes = MFC_EPISODES.filter((e) => e.child_id === "yp_alex");
  const csEpisodes = MFC_EPISODES.filter((e) => e.contextual_safeguarding_risk);
  const highRisk = MFC_EPISODES.filter((e) => ["high", "critical"].includes(e.risk_level));

  const filtered = filterChild === "all"
    ? MFC_EPISODES
    : MFC_EPISODES.filter((e) => e.child_id === filterChild);

  const hasPattern = alexEpisodes.length >= 3;

  async function handleLogEpisodeSubmit() {
    if (!logForm.date) { setLogError("Date missing is required"); return; }
    setLogError("");
    setLogPending(true);
    try {
      await api.post("/missing-episodes", {
        child_id: logForm.yp_id,
        date_missing: logForm.date,
        time_missing: logForm.time || null,
        risk_level: logForm.risk,
        location_last_seen: logForm.location || null,
      });
      setLogOpen(false);
      setLogForm(EMPTY_LOG_FORM);
    } catch {
      setLogError("Failed to log episode. Please try again.");
    } finally {
      setLogPending(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Pattern analysis banner */}
      {hasPattern && (
        <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-rose-200 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-rose-700" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-rose-800">
                  ESCALATING PATTERN IDENTIFIED
                </span>
                <span className="rounded-full bg-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                  MASH Referral Made
                </span>
              </div>
              <div className="mt-1.5 text-sm text-rose-700 leading-relaxed">
                <strong>Alex</strong> has {alexEpisodes.length} missing episodes in 2026. The pattern shows late evening absences with an escalating peer network risk. Contextual safeguarding concern identified — older peer group suspected in criminal exploitation.
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: "Episodes (2026)", value: alexEpisodes.length },
                  { label: "CS Risk Episodes", value: csEpisodes.filter((e) => e.child_id === "yp_alex").length },
                  { label: "Police Referrals", value: alexEpisodes.filter((e) => e.reported_to_police).length },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-white/60 p-2.5 text-center">
                    <div className="text-lg font-bold text-rose-800">{s.value}</div>
                    <div className="text-[10px] text-rose-600">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MFC stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Episodes", value: MFC_EPISODES.length, color: "text-slate-900" },
          { label: "Active", value: MFC_EPISODES.filter((e) => e.status === "active").length, color: "text-[--cs-risk]" },
          { label: "High Risk", value: highRisk.length, color: "text-orange-600" },
          { label: "CS Concerns", value: csEpisodes.length, color: "text-rose-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-white p-4 text-center">
            <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <select
          value={filterChild}
          onChange={(e) => setFilterChild(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="all">All young people</option>
          {mfcAllYP.map((yp) => (
            <option key={yp.id} value={yp.id}>{yp.preferred_name || yp.first_name}</option>
          ))}
        </select>
        <Button size="sm" className="bg-rose-600 hover:bg-rose-700" onClick={() => setLogOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Log Missing Episode
        </Button>
      </div>

      {/* Episode cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-900">No missing episodes for this young person</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered
            .slice()
            .sort((a, b) => b.date_missing.localeCompare(a.date_missing))
            .map((ep) => (
              <MFCEpisodeCard key={ep.id} ep={ep} />
            ))}
        </div>
      )}

      {/* Log episode modal */}
      {logOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setLogOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-900">Log Missing Episode</span>
              <button onClick={() => setLogOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Young Person</label>
                <select
                  value={logForm.yp_id}
                  onChange={(e) => setLogForm((f) => ({ ...f, yp_id: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  {mfcAllYP.map((yp) => (
                    <option key={yp.id} value={yp.id}>{yp.preferred_name || yp.first_name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Date Missing <span className="text-[--cs-risk]">*</span></label>
                  <Input
                    type="date"
                    value={logForm.date}
                    onChange={(e) => setLogForm((f) => ({ ...f, date: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Time Missing</label>
                  <Input
                    type="time"
                    value={logForm.time}
                    onChange={(e) => setLogForm((f) => ({ ...f, time: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Risk Level</label>
                <select
                  value={logForm.risk}
                  onChange={(e) => setLogForm((f) => ({ ...f, risk: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Last Known Location</label>
                <Input
                  value={logForm.location}
                  onChange={(e) => setLogForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Where were they last seen?"
                  className="text-sm"
                />
              </div>
              {logError && <p className="text-xs text-[--cs-risk] font-medium">{logError}</p>}
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                className="flex-1 bg-rose-600 hover:bg-rose-700"
                disabled={logPending}
                onClick={handleLogEpisodeSubmit}
              >
                <Plus className="h-4 w-4" />
                {logPending ? "Logging…" : "Log Episode"}
              </Button>
              <Button variant="outline" onClick={() => setLogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Chronology ─────────────────────────────────────────────────────────

const EMPTY_ENTRY_FORM = { category: "meeting" as string, significance: "routine" as string, title: "", description: "" };

function ChronologyTab() {
  const [selectedChild, setSelectedChild] = useState("yp_alex");
  const [filterCategory, setFilterCategory] = useState("all");
  const [addEntryOpen, setAddEntryOpen] = useState(false);
  const [entryForm, setEntryForm] = useState(EMPTY_ENTRY_FORM);
  const [entryError, setEntryError] = useState("");
  const [entryPending, setEntryPending] = useState(false);
  const chronYpQuery = useYoungPeople();
  const chronAllYP = chronYpQuery.data?.data ?? [];
  const { data: chronResult } = useChronologyEntries(selectedChild);
  const CHRONOLOGY_ENTRIES = chronResult?.data ?? [];

  const entries = useMemo(() => {
    let list = CHRONOLOGY_ENTRIES.filter((e) => e.child_id === selectedChild);
    if (filterCategory !== "all") list = list.filter((e) => e.category === filterCategory);
    return list.slice().sort((a, b) => {
      const da = new Date(`${a.date}T${a.time || "00:00"}`);
      const db_ = new Date(`${b.date}T${b.time || "00:00"}`);
      return db_.getTime() - da.getTime();
    });
  }, [selectedChild, filterCategory]);

  const yp = getYPById(selectedChild);

  const categories = [...new Set(CHRONOLOGY_ENTRIES.filter((e) => e.child_id === selectedChild).map((e) => e.category))];

  async function handleAddEntrySubmit() {
    if (!entryForm.title.trim()) { setEntryError("Title is required"); return; }
    setEntryError("");
    setEntryPending(true);
    try {
      await api.post("/safeguarding", {
        child_id: selectedChild,
        category: entryForm.category,
        significance: entryForm.significance,
        title: entryForm.title.trim(),
        description: entryForm.description.trim() || null,
      });
      setAddEntryOpen(false);
      setEntryForm(EMPTY_ENTRY_FORM);
    } catch {
      setEntryError("Failed to add entry. Please try again.");
    } finally {
      setEntryPending(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            {chronAllYP.map((yp) => (
              <option key={yp.id} value={yp.id}>{yp.preferred_name || yp.first_name} {yp.last_name}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{CHRONO_CATEGORY_CONFIG[c]?.label || c}</option>
            ))}
          </select>
        </div>
        <Button size="sm" variant="outline" onClick={() => setAddEntryOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Entry
        </Button>
      </div>

      {/* YP info strip */}
      {yp && (
        <div className="rounded-2xl border bg-white p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-violet-100 text-violet-700 text-base font-bold flex items-center justify-center shrink-0">
            {(yp.preferred_name || yp.first_name)[0]}
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-slate-900">{yp.preferred_name || yp.first_name} {yp.last_name}</div>
            <div className="text-xs text-slate-500">{yp.legal_status} · {yp.local_authority} · Key worker: {getStaffName(yp.key_worker_id ?? "")}</div>
          </div>
          {(yp.risk_flags?.length ?? 0) > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {(yp.risk_flags ?? []).map((f) => (
                <span key={f} className="rounded-full bg-[--cs-risk-bg] border border-[--cs-risk-soft] px-2 py-0.5 text-[10px] font-medium text-[--cs-risk]">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
        <div className="space-y-4">
          {entries.map((entry, i) => {
            const cat = CHRONO_CATEGORY_CONFIG[entry.category] ?? CHRONO_CATEGORY_CONFIG.other;
            const sig = SIGNIFICANCE_CONFIG[entry.significance];

            return (
              <div key={entry.id} className="relative pl-12">
                {/* Timeline dot */}
                <div className={cn(
                  "absolute left-3.5 top-4 h-3 w-3 rounded-full -translate-x-1/2",
                  sig.dot,
                )} />

                {/* Entry card */}
                <div className={cn(
                  "rounded-2xl border bg-white p-4",
                  entry.significance === "critical" && "border-[--cs-risk-soft] ring-1 ring-[--cs-risk-bg]"
                )}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-wrap flex-1">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", cat.color)}>
                        {cat.label}
                      </span>
                      {entry.significance !== "routine" && (
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          entry.significance === "critical" ? "bg-[--cs-risk-bg] text-[--cs-risk]" : "bg-[--cs-warning-bg] text-[--cs-warning]"
                        )}>
                          {sig.label}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 shrink-0 text-right">
                      <div>{formatDate(entry.date)}</div>
                      {entry.time && <div>{entry.time}</div>}
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="text-sm font-semibold text-slate-900">{entry.title}</div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{entry.description}</p>
                  </div>

                  <div className="mt-2.5 flex items-center gap-3">
                    <span className="text-[10px] text-slate-400">Recorded by {getStaffName(entry.recorded_by)}</span>
                    {entry.linked_incident_id && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                        <Link2 className="h-2.5 w-2.5" />
                        Linked incident
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {entries.length === 0 && (
        <div className="rounded-2xl border bg-white p-12 text-center">
          <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-900">No chronology entries found</div>
        </div>
      )}

      {/* Add entry modal */}
      {addEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setAddEntryOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-900">Add Chronology Entry</span>
              <button onClick={() => setAddEntryOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Category</label>
                  <select
                    value={entryForm.category}
                    onChange={(e) => setEntryForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  >
                    {Object.entries(CHRONO_CATEGORY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Significance</label>
                  <select
                    value={entryForm.significance}
                    onChange={(e) => setEntryForm((f) => ({ ...f, significance: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  >
                    <option value="routine">Routine</option>
                    <option value="significant">Significant</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Title <span className="text-[--cs-risk]">*</span></label>
                <Input
                  value={entryForm.title}
                  onChange={(e) => setEntryForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Brief title for this entry…"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Description</label>
                <textarea
                  value={entryForm.description}
                  onChange={(e) => setEntryForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="What happened? Include relevant context, people present, and any outcomes…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-400 leading-relaxed"
                />
              </div>
              {entryError && <p className="text-xs text-[--cs-risk] font-medium">{entryError}</p>}
            </div>
            <div className="mt-4 flex gap-3">
              <Button className="flex-1" disabled={entryPending} onClick={handleAddEntrySubmit}>
                <Plus className="h-4 w-4" /> {entryPending ? "Saving…" : "Add Entry"}
              </Button>
              <Button variant="outline" onClick={() => setAddEntryOpen(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 4: Manager Actions ────────────────────────────────────────────────────

function ManagerActionsTab() {
  const { currentUser } = useAuthContext();
  const query = useIncidents({ needs_oversight: true });
  const addOversight = useAddOversight();
  const [oversightNote, setOversightNote] = useState<Record<string, string>>({});
  const [caraPanelId, setCaraPanelId] = useState<string | null>(null);

  const oversightQueue: Incident[] = (query.data?.data ?? [])
    .filter((i) => i.requires_oversight && !i.oversight_by)
    .sort((a, b) => {
      const w = { critical: 0, high: 1, medium: 2, low: 3 };
      return (w[a.severity] ?? 2) - (w[b.severity] ?? 2);
    });

  // Strategy discussion tracker (static display)
  const STRATEGY_DISCUSSIONS = [
    { ref: "STR-001", subject: "Alex — Contextual Safeguarding / MFC Pattern", date: "2026-04-01", status: "completed", attendees: ["Darren Laville", "Karen Holding", "DC Smith (Police)"], outcome: "MASH referral made. Risk assessment updated. Monitoring plan agreed." },
    { ref: "STR-002", subject: "Alex — Exploitation Disclosure (INC-2026-0043)", date: "2026-04-15", status: "scheduled", attendees: ["Darren Laville", "Karen Holding", "IRO", "MASH"], outcome: null },
  ];

  // Professional notifications log (static display)
  const NOTIF_LOG = [
    { date: "2026-04-14", time: "19:25", role: "Social Worker", contact: "Karen Holding", incident: "INC-2026-0043", method: "Phone", by: "staff_edward", acknowledged: true },
    { date: "2026-04-14", time: "19:20", role: "Registered Manager", contact: "Darren Laville", incident: "INC-2026-0043", method: "Phone", by: "staff_edward", acknowledged: true },
    { date: "2026-04-14", time: "20:00", role: "Police / MASH", contact: "MASH referral", incident: "INC-2026-0043", method: "Phone", by: "staff_darren", acknowledged: false },
    { date: "2026-04-13", time: "08:30", role: "Deputy Manager", contact: "Ryan Forsythe", incident: "INC-2026-0040", method: "In person", by: "staff_anna", acknowledged: true },
    { date: "2026-04-13", time: "09:15", role: "Social Worker", contact: "Karen Holding", incident: "INC-2026-0041", method: "Phone", by: "staff_darren", acknowledged: true },
  ];

  function handleOversight(inc: Incident) {
    const note = oversightNote[inc.id] ?? "";
    if (!note.trim()) return;
    addOversight.mutate({ id: inc.id, note, by: currentUser?.id ?? "staff_darren" }, {
      onSuccess: () => setOversightNote((prev) => { const n = { ...prev }; delete n[inc.id]; return n; }),
    });
  }

  return (
    <div className="space-y-6">
      {/* Oversight tasks */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-[--cs-warning]" />
          <span className="text-sm font-bold text-slate-900">Oversight Queue</span>
          {oversightQueue.length > 0 && (
            <span className="rounded-full bg-[--cs-warning] px-2 py-0.5 text-[10px] font-bold text-white">{oversightQueue.length}</span>
          )}
        </div>

        {query.isPending ? (
          <div className="flex items-center gap-2 py-6 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-xs">Loading…</span></div>
        ) : oversightQueue.length === 0 ? (
          <div className="rounded-2xl border border-[--cs-success-soft] bg-[--cs-success-bg] p-6 text-center">
            <CheckCircle2 className="h-6 w-6 text-[--cs-success] mx-auto mb-2" />
            <div className="text-sm font-semibold text-[--cs-success]">All incidents have oversight recorded</div>
          </div>
        ) : (
          <div className="space-y-3">
            {oversightQueue.map((inc) => {
              const sev = SEV_CONFIG[inc.severity] ?? SEV_CONFIG.low;
              return (
                <div key={inc.id} className={cn("rounded-2xl border bg-white border-l-4 p-4", sev.border)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{inc.reference}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", sev.badge)}>{inc.severity}</span>
                        <span className="text-xs text-slate-600">{getYPName(inc.child_id)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">{inc.description}</p>
                    </div>
                    <button
                      onClick={() => setCaraPanelId(caraPanelId === inc.id ? null : inc.id)}
                      className="flex items-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[10px] font-semibold text-violet-700 hover:bg-violet-100 shrink-0"
                    >
                      <Sparkles className="h-3 w-3" /> Cara
                    </button>
                  </div>

                  {caraPanelId === inc.id && (
                    <div className="mt-3">
                      <CaraPanel
                        mode="oversee"
                        pageContext="Safeguarding — Manager Actions"
                        recordType="incident_oversight"
                        sourceContent={`${inc.description}\n\nImmediate action: ${inc.immediate_action}`}
                        onInsert={(text) => setOversightNote((prev) => ({ ...prev, [inc.id]: text }))}
                      />
                    </div>
                  )}

                  <div className="mt-3 flex items-end gap-2">
                    <textarea
                      value={oversightNote[inc.id] ?? ""}
                      onChange={(e) => setOversightNote((prev) => ({ ...prev, [inc.id]: e.target.value }))}
                      rows={2}
                      placeholder="Record oversight note…"
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[var(--cs-warning-soft)] placeholder:text-slate-400"
                    />
                    <Button
                      size="sm"
                      className="bg-[--cs-warning] hover:opacity-90 shrink-0"
                      disabled={!(oversightNote[inc.id] ?? "").trim() || addOversight.isPending}
                      onClick={() => handleOversight(inc)}
                    >
                      <Shield className="h-3.5 w-3.5" /> Save
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Strategy Discussions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[--cs-info]" />
            <span className="text-sm font-bold text-slate-900">Strategy Discussions</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled
            title="Schedule strategy discussions via your local authority contact or use the external case management system."
          >
            <Plus className="h-3.5 w-3.5" /> Schedule
          </Button>
        </div>
        <div className="space-y-3">
          {STRATEGY_DISCUSSIONS.map((sd) => (
            <div key={sd.ref} className={cn(
              "rounded-2xl border bg-white p-4",
              sd.status === "scheduled" ? "border-[--cs-info-soft]" : "border-slate-200"
            )}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{sd.subject}</span>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      sd.status === "scheduled" ? "bg-[--cs-info-bg] text-[--cs-info]" : "bg-[--cs-success-bg] text-[--cs-success]"
                    )}>
                      {sd.status === "scheduled" ? "Scheduled" : "Completed"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">{sd.ref} · {formatDate(sd.date)}</div>
                  <div className="mt-1.5 text-[11px] text-slate-500">
                    Attendees: {sd.attendees.join(", ")}
                  </div>
                  {sd.outcome && (
                    <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">{sd.outcome}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Professional Notifications Log */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-slate-600" />
          <span className="text-sm font-bold text-slate-900">Professional Notifications Log</span>
        </div>
        <div className="rounded-2xl border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Date", "Role", "Contact", "Incident", "Method", "By", "Status"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {NOTIF_LOG.map((n, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">{n.date} {n.time}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-800">{n.role}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{n.contact}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-mono">{n.incident}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{n.method}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{getStaffName(n.by)}</td>
                    <td className="px-4 py-3">
                      {n.acknowledged ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[--cs-success]">
                          <CheckCircle2 className="h-3 w-3" /> Acknowledged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[--cs-warning]">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cara panel */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <span className="text-sm font-bold text-slate-900">Cara — Manager Support</span>
        </div>
        <CaraPanel
          mode="oversee"
          pageContext="Safeguarding — Manager Actions"
          linkedRecords="Incidents, missing episodes, chronology, strategy discussions"
          userRole="registered_manager"
        />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const SAFEGUARDING_EXPORT_COLS: ExportColumn<Incident>[] = [
  { header: "Reference", accessor: (i) => i.reference },
  { header: "Type", accessor: (i) => INCIDENT_TYPE_LABELS[i.type] ?? i.type },
  { header: "Young Person", accessor: (i) => getYPName(i.child_id ?? "") },
  { header: "Date", accessor: (i) => i.date },
  { header: "Severity", accessor: (i) => i.severity },
  { header: "Description", accessor: (i) => i.description },
  { header: "Immediate Action", accessor: (i) => i.immediate_action ?? "" },
  { header: "Reported By", accessor: (i) => getStaffName(i.reported_by) },
  { header: "Status", accessor: (i) => i.status },
  { header: "Oversight", accessor: (i) => i.oversight_by ? `${getStaffName(i.oversight_by)}` : "Pending" },
];

export default function SafeguardingPage() {
  const [activeTab, setActiveTab] = useState<TabId>("concerns");
  const query = useIncidents({ status: "open" });
  const { data: mfcTopResult } = useMissingEpisodes({ homeId: "home_oak" });
  const MFC_EPISODES = mfcTopResult?.data ?? [];

  const openSafeguarding = (query.data?.data ?? []).filter((i) =>
    ["safeguarding_concern", "exploitation_concern", "self_harm", "missing_from_care", "contextual_safeguarding", "allegation"].includes(i.type)
  );
  const awaitingOversight = openSafeguarding.filter((i) => i.requires_oversight && !i.oversight_by);

  return (
    <PageShell
      darkBody
      sensitive
      title="Safeguarding"
      subtitle={`${openSafeguarding.length} open concern${openSafeguarding.length !== 1 ? "s" : ""} · ${awaitingOversight.length} awaiting oversight · MASH referral active`}
      caraContext={{ pageTitle: "Safeguarding", sourceType: "general" }}
      quickCreateContext={{
        module: "safeguarding",
        defaultTaskCategory: "safeguarding",
        defaultFormType: "safeguarding_referral",
        preferredTab: "form",
      }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={openSafeguarding} columns={SAFEGUARDING_EXPORT_COLS} filename="safeguarding-concerns" />
          <PrintButton title="Safeguarding Records" subtitle="Safeguarding & Child Protection" targetId="safeguarding-content" />
          <SmartUploadButton variant="inline" label="Upload Document" uploadContext="Safeguarding — evidence upload" />
          <CaraStudioQuickActionButton context={{ record_type: "safeguarding", record_id: "home_oak", home_id: "home_oak" }} />
          <Button size="sm" className="bg-rose-600 hover:bg-rose-700">
            <Plus className="h-3.5 w-3.5" />
            Log Concern
          </Button>
        </div>
      }
    >
      <div id="safeguarding-content" className="space-y-6">
        {/* Tab bar */}
        <div className="flex items-center gap-1 rounded-2xl border bg-white p-1.5 flex-wrap">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            const badge = id === "concerns" && awaitingOversight.length > 0 ? awaitingOversight.length :
                          id === "mfc" ? MFC_EPISODES.length : 0;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {badge > 0 && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    isActive ? "bg-white text-slate-900" :
                    id === "concerns" ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-600"
                  )}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === "concerns" && <SafeguardingConcernsTab />}
        {activeTab === "mfc" && <MFCTab />}
        {activeTab === "chronology" && <ChronologyTab />}
        {activeTab === "manager" && <ManagerActionsTab />}
      </div>

      {/* Care Events pipeline — safeguarding events routed here */}
      <CareEventsPanel
        title="Care Events — Safeguarding"
        category={["safeguarding", "missing_episode"]}
        days={90}
        defaultCollapsed
      />
    </PageShell>
  );
}
