"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — EVIDENCE SOURCES
//
// Browse, search, and assess all evidence sources indexed by Cara Studio.
// Shows source type, confidence scoring, recency, and linked artifacts.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Database, Search, FileText, Calendar, BarChart3,
  CheckCircle2, AlertTriangle, Clock, Sparkles, Filter,
  Eye, Shield, Heart, Users, BookOpen, Pill,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface EvidenceSource {
  id: string;
  sourceType: string;
  title: string;
  summary: string | null;
  childId: string | null;
  childName: string | null;
  sourceDate: string;
  indexedAt: string;
  approved: boolean;
  confidence: number;
  linkedArtifacts: number;
}

// ── Source type config ───────────────────────────────────────────────────────

const SOURCE_ICONS: Record<string, React.ElementType> = {
  daily_log: FileText, incident: AlertTriangle, key_work: Heart,
  risk_assessment: Shield, safeguarding: Shield, medication: Pill,
  care_plan: BookOpen, placement_plan: BookOpen, supervision: Users,
  training: BookOpen, contact_log: Users, missing_episode: AlertTriangle,
  restraint: AlertTriangle, complaint: FileText,
};

const SOURCE_LABELS: Record<string, string> = {
  daily_log: "Daily Log", incident: "Incident", key_work: "Key Work",
  risk_assessment: "Risk Assessment", safeguarding: "Safeguarding",
  medication: "Medication", care_plan: "Care Plan",
  placement_plan: "Placement Plan", supervision: "Supervision",
  training: "Training", contact_log: "Contact Log",
  missing_episode: "Missing Episode", restraint: "Restraint",
  complaint: "Complaint",
};

// ── Demo data ───────────────────────────────────────────────────────────────

const DEMO_SOURCES: EvidenceSource[] = [
  { id: "src-1", sourceType: "daily_log", title: "Daily Log — Jayden — 11 May", summary: "Positive day. Engaged well with activities. Spoke about wanting to see mum.", childId: "child_1", childName: "Jayden", sourceDate: "2026-05-11", indexedAt: "2026-05-11T20:00:00Z", approved: true, confidence: 85, linkedArtifacts: 2 },
  { id: "src-2", sourceType: "incident", title: "Incident — Window Damage — Reuben", summary: "Reuben became dysregulated after phone call. Staff used de-escalation. Property damage.", childId: "child_3", childName: "Reuben", sourceDate: "2026-05-10", indexedAt: "2026-05-10T16:30:00Z", approved: true, confidence: 92, linkedArtifacts: 3 },
  { id: "src-3", sourceType: "key_work", title: "Key Work — Amara — Identity & Belonging", summary: "Explored cultural identity using creative activities. Amara shared feelings about placement.", childId: "child_2", childName: "Amara", sourceDate: "2026-05-09", indexedAt: "2026-05-09T15:00:00Z", approved: true, confidence: 88, linkedArtifacts: 1 },
  { id: "src-4", sourceType: "risk_assessment", title: "Risk Assessment — Jayden — Updated", summary: "Risk level maintained at medium. New protective factors identified from key work.", childId: "child_1", childName: "Jayden", sourceDate: "2026-05-08", indexedAt: "2026-05-08T12:00:00Z", approved: true, confidence: 78, linkedArtifacts: 4 },
  { id: "src-5", sourceType: "supervision", title: "Supervision — Marcus Williams", summary: "Discussed de-escalation practice. Identified training need for trauma-informed approaches.", childId: null, childName: null, sourceDate: "2026-05-07", indexedAt: "2026-05-07T14:00:00Z", approved: true, confidence: 72, linkedArtifacts: 1 },
  { id: "src-6", sourceType: "medication", title: "Medication Review — Jayden — May", summary: "Ritalin 10mg — compliance at 95%. No side effects reported.", childId: "child_1", childName: "Jayden", sourceDate: "2026-05-06", indexedAt: "2026-05-06T10:00:00Z", approved: true, confidence: 95, linkedArtifacts: 0 },
  { id: "src-7", sourceType: "daily_log", title: "Daily Log — Amara — 5 May", summary: "Quiet day. Amara spent time in her room. Declined evening activity.", childId: "child_2", childName: "Amara", sourceDate: "2026-05-05", indexedAt: "2026-05-05T21:00:00Z", approved: false, confidence: 60, linkedArtifacts: 0 },
  { id: "src-8", sourceType: "contact_log", title: "Contact — Jayden — Phone with Mum", summary: "30-minute phone call. Jayden seemed settled afterwards. Talked about weekend plans.", childId: "child_1", childName: "Jayden", sourceDate: "2026-05-04", indexedAt: "2026-05-04T18:00:00Z", approved: true, confidence: 82, linkedArtifacts: 1 },
];

const DEMO_CHILDREN = [
  { id: "child_1", name: "Jayden" },
  { id: "child_2", name: "Amara" },
  { id: "child_3", name: "Reuben" },
];

// ══════════════════════════════════════════════════════════════════════════════

export default function EvidencePage() {
  const [sources, setSources] = useState<EvidenceSource[]>(DEMO_SOURCES);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [childFilter, setChildFilter] = useState<string | null>(null);

  const filtered = sources.filter((s) => {
    if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase()) && !s.summary?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (typeFilter && s.sourceType !== typeFilter) return false;
    if (childFilter && s.childId !== childFilter) return false;
    return true;
  });

  const typeCounts: Record<string, number> = {};
  for (const s of sources) typeCounts[s.sourceType] = (typeCounts[s.sourceType] ?? 0) + 1;

  const avgConfidence = sources.length > 0 ? Math.round(sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length) : 0;
  const approvedCount = sources.filter((s) => s.approved).length;

  return (
    <PageShell title="Evidence Sources" subtitle="All indexed evidence for Cara Studio">
      <div className="space-y-6 pb-12">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <Database className="h-5 w-5 text-[var(--cs-cara-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Evidence Sources</h2>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                Browse all evidence indexed by Cara Studio. Every source is confidence-scored and linked to generated artifacts.
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Database className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Total Sources</span>
            </div>
            <p className="text-2xl font-bold text-[var(--cs-navy)]">{sources.length}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Approved</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{approvedCount}</p>
          </div>
          <div className={cn("rounded-xl border p-4", avgConfidence >= 75 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
            <div className="flex items-center gap-1.5 mb-2">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Avg Confidence</span>
            </div>
            <p className={cn("text-2xl font-bold", avgConfidence >= 75 ? "text-emerald-700" : "text-amber-700")}>{avgConfidence}%</p>
          </div>
          <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Filter className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
              <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Types</span>
            </div>
            <p className="text-2xl font-bold text-[var(--cs-navy)]">{Object.keys(typeCounts).length}</p>
          </div>
        </div>

        {/* ── Search + filters ────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--cs-text-muted)]" />
            <input
              type="text" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search evidence..."
              className="w-full rounded-xl border border-[var(--cs-border)] bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]"
            />
          </div>
          <select value={typeFilter ?? ""} onChange={(e) => setTypeFilter(e.target.value || null)}
            className="rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2.5 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]">
            <option value="">All types</option>
            {Object.entries(typeCounts).map(([type, count]) => (
              <option key={type} value={type}>{SOURCE_LABELS[type] ?? type} ({count})</option>
            ))}
          </select>
          <select value={childFilter ?? ""} onChange={(e) => setChildFilter(e.target.value || null)}
            className="rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2.5 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]">
            <option value="">All children</option>
            {DEMO_CHILDREN.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* ── Source list ──────────────────────────────────────────────────── */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-[var(--cs-border)] bg-white p-8 text-center">
              <Search className="h-8 w-8 text-[var(--cs-text-muted)] mx-auto mb-3" />
              <p className="text-sm text-[var(--cs-text-muted)]">No sources match the current filters.</p>
            </div>
          ) : (
            filtered.map((source) => {
              const Icon = SOURCE_ICONS[source.sourceType] ?? FileText;
              return (
                <div key={source.id} className="rounded-xl border border-[var(--cs-border)] bg-white p-4 hover:border-[var(--cs-cara-gold-soft)] transition-all">
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-[var(--cs-cara-gold)] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[var(--cs-navy)]">{source.title}</span>
                        {source.approved && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                        <Badge className="text-[9px] bg-[var(--cs-surface)] text-[var(--cs-text-muted)] border-[var(--cs-border)]">
                          {SOURCE_LABELS[source.sourceType] ?? source.sourceType}
                        </Badge>
                        {source.childName && (
                          <Badge className="text-[9px] bg-blue-50 text-blue-600 border-blue-200">{source.childName}</Badge>
                        )}
                      </div>
                      {source.summary && (
                        <p className="text-xs text-[var(--cs-text-muted)] mt-1 leading-relaxed line-clamp-2">{source.summary}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-[var(--cs-text-muted)]">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(source.sourceDate).toLocaleDateString("en-GB")}</span>
                        <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{source.linkedArtifacts} artifacts linked</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-[var(--cs-surface)] rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", source.confidence >= 80 ? "bg-emerald-500" : source.confidence >= 60 ? "bg-amber-500" : "bg-red-400")} style={{ width: `${source.confidence}%` }} />
                        </div>
                        <span className="text-[10px] font-medium text-[var(--cs-text-muted)]">{source.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </PageShell>
  );
}
