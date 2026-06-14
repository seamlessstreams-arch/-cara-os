"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — GENERATION HISTORY
//
// Searchable, filterable list of all artifacts generated through Cara Studio.
// Shows status, type, child, confidence score, and links to detail view.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  History, Search, Filter, FileText, CheckCircle2,
  AlertTriangle, Clock, Eye, Sparkles, ChevronRight,
  Send, Archive, XCircle, BarChart3,
} from "lucide-react";
import {
  ARTIFACT_TYPE_LABELS,
  STATUS_LABELS,
  type CaraStudioArtifact,
  type CaraStudioArtifactType,
} from "@/types/cara-studio";

// ── Status config ───────────────────────────────────────────────────────────

const STATUS_ICON: Record<string, React.ElementType> = {
  draft: FileText,
  in_review: Send,
  changes_requested: AlertTriangle,
  approved: CheckCircle2,
  rejected: XCircle,
  committed: Archive,
  archived: Archive,
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-[var(--cs-surface)] text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
  in_review: "bg-amber-50 text-amber-700 border-amber-200",
  changes_requested: "bg-orange-50 text-orange-700 border-orange-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  committed: "bg-blue-50 text-blue-700 border-blue-200",
  archived: "bg-gray-50 text-gray-500 border-gray-200",
};

// ── Demo artifacts ──────────────────────────────────────────────────────────

const DEMO_ARTIFACTS: CaraStudioArtifact[] = [
  {
    id: "hist-1", home_id: "home-1", artifact_type: "keywork_session", title: "Key Work Session — Jayden — Identity & Belonging",
    status: "committed", child_id: "child_1", created_by: "user-1",
    created_at: "2026-05-10T09:00:00Z", committed_at: "2026-05-10T14:00:00Z",
    generated_content: "", plain_text_content: null,
    evidence_confidence_score: 82,
  } as CaraStudioArtifact,
  {
    id: "hist-2", home_id: "home-1", artifact_type: "management_oversight", title: "Weekly Management Oversight — w/c 5 May",
    status: "committed", child_id: null, created_by: "user-1",
    created_at: "2026-05-09T08:30:00Z", committed_at: "2026-05-09T16:00:00Z",
    generated_content: "", plain_text_content: null,
    evidence_confidence_score: 78,
  } as CaraStudioArtifact,
  {
    id: "hist-3", home_id: "home-1", artifact_type: "risk_review", title: "Risk Review — Amara — Self-Harm Indicators",
    status: "approved", child_id: "child_2", created_by: "user-1",
    created_at: "2026-05-08T11:00:00Z", committed_at: null,
    generated_content: "", plain_text_content: null,
    evidence_confidence_score: 71,
  } as CaraStudioArtifact,
  {
    id: "hist-4", home_id: "home-1", artifact_type: "staff_training", title: "De-escalation Refresher — Practice-Based Scenarios",
    status: "in_review", child_id: null, created_by: "user-2",
    created_at: "2026-05-08T10:00:00Z", committed_at: null,
    generated_content: "", plain_text_content: null,
    evidence_confidence_score: 65,
  } as CaraStudioArtifact,
  {
    id: "hist-5", home_id: "home-1", artifact_type: "incident_learning_review", title: "Incident Learning — Window Damage 6 May",
    status: "draft", child_id: "child_3", created_by: "user-1",
    created_at: "2026-05-07T15:00:00Z", committed_at: null,
    generated_content: "", plain_text_content: null,
    evidence_confidence_score: 55,
  } as CaraStudioArtifact,
  {
    id: "hist-6", home_id: "home-1", artifact_type: "social_worker_update", title: "Social Worker Update — Jayden — April Progress",
    status: "committed", child_id: "child_1", created_by: "user-1",
    created_at: "2026-05-06T09:00:00Z", committed_at: "2026-05-06T17:00:00Z",
    generated_content: "", plain_text_content: null,
    evidence_confidence_score: 88,
  } as CaraStudioArtifact,
  {
    id: "hist-7", home_id: "home-1", artifact_type: "child_friendly_explanation", title: "What Happens at a Review — Amara",
    status: "committed", child_id: "child_2", created_by: "user-1",
    created_at: "2026-05-05T14:00:00Z", committed_at: "2026-05-05T16:30:00Z",
    generated_content: "", plain_text_content: null,
    evidence_confidence_score: 92,
  } as CaraStudioArtifact,
  {
    id: "hist-8", home_id: "home-1", artifact_type: "reg45_summary", title: "Regulation 45 Summary — April 2026",
    status: "committed", child_id: null, created_by: "user-1",
    created_at: "2026-05-03T09:00:00Z", committed_at: "2026-05-04T11:00:00Z",
    generated_content: "", plain_text_content: null,
    evidence_confidence_score: 85,
  } as CaraStudioArtifact,
];

const DEMO_CHILDREN = [
  { id: "child_1", name: "Jayden" },
  { id: "child_2", name: "Amara" },
  { id: "child_3", name: "Reuben" },
];

// ══════════════════════════════════════════════════════════════════════════════

export default function HistoryPage() {
  const [artifacts, setArtifacts] = useState<CaraStudioArtifact[]>(DEMO_ARTIFACTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [childFilter, setChildFilter] = useState<string | null>(null);

  const filtered = artifacts.filter((a) => {
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter && a.status !== statusFilter) return false;
    if (typeFilter && a.artifact_type !== typeFilter) return false;
    if (childFilter && a.child_id !== childFilter) return false;
    return true;
  });

  const statusCounts: Record<string, number> = {};
  for (const a of artifacts) {
    statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
  }

  return (
    <PageShell title="Generation History" subtitle="All Cara Studio artifacts">
      <div className="space-y-6 pb-12">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <History className="h-5 w-5 text-[var(--cs-cara-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Generation History</h2>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                Browse, search, and filter all artifacts generated through Cara Studio. Track status from draft through to committed record.
              </p>
            </div>
          </div>
        </div>

        {/* ── Status pills ────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter(null)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              !statusFilter
                ? "border-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)] ring-1 ring-[var(--cs-cara-gold-soft)]"
                : "border-[var(--cs-border)] bg-white text-[var(--cs-text-secondary)] hover:border-[var(--cs-cara-gold-soft)]",
            )}
          >
            All ({artifacts.length})
          </button>
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? null : status)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                statusFilter === status
                  ? "ring-1 ring-[var(--cs-cara-gold-soft)]"
                  : "hover:border-[var(--cs-cara-gold-soft)]",
                STATUS_STYLES[status],
              )}
            >
              {STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status} ({count})
            </button>
          ))}
        </div>

        {/* ── Search + filters ────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--cs-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artifacts..."
              className="w-full rounded-xl border border-[var(--cs-border)] bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]"
            />
          </div>
          <select
            value={typeFilter ?? ""}
            onChange={(e) => setTypeFilter(e.target.value || null)}
            className="rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2.5 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]"
          >
            <option value="">All types</option>
            {[...new Set(artifacts.map((a) => a.artifact_type))].map((type) => (
              <option key={type} value={type}>{ARTIFACT_TYPE_LABELS[type as CaraStudioArtifactType] ?? type}</option>
            ))}
          </select>
          <select
            value={childFilter ?? ""}
            onChange={(e) => setChildFilter(e.target.value || null)}
            className="rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2.5 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]"
          >
            <option value="">All children</option>
            {DEMO_CHILDREN.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* ── Artifact list ───────────────────────────────────────────────── */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-[var(--cs-border)] bg-white p-8 text-center">
              <Search className="h-8 w-8 text-[var(--cs-text-muted)] mx-auto mb-3" />
              <p className="text-sm text-[var(--cs-text-muted)]">No artifacts match the current filters.</p>
            </div>
          ) : (
            filtered.map((artifact) => {
              const StatusIcon = STATUS_ICON[artifact.status] ?? FileText;
              const confidence = (artifact as any).evidence_confidence_score ?? 0;
              const childName = DEMO_CHILDREN.find((c) => c.id === artifact.child_id)?.name;
              return (
                <div
                  key={artifact.id}
                  className="flex items-center gap-4 rounded-xl border border-[var(--cs-border)] bg-white p-4 hover:border-[var(--cs-cara-gold-soft)] hover:bg-[var(--cs-cara-gold-bg)]/20 transition-all cursor-pointer group"
                >
                  <StatusIcon className={cn("h-5 w-5 shrink-0", artifact.status === "committed" ? "text-blue-500" : artifact.status === "approved" ? "text-emerald-500" : artifact.status === "draft" ? "text-[var(--cs-text-muted)]" : "text-amber-500")} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[var(--cs-navy)] truncate">{artifact.title}</span>
                      <Badge className={cn("text-[9px] border shrink-0", STATUS_STYLES[artifact.status])}>
                        {STATUS_LABELS[artifact.status as keyof typeof STATUS_LABELS] ?? artifact.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--cs-text-muted)]">
                      <span>{ARTIFACT_TYPE_LABELS[artifact.artifact_type] ?? artifact.artifact_type}</span>
                      {childName && <span>{childName}</span>}
                      <span>{new Date(artifact.created_at).toLocaleDateString("en-GB")}</span>
                      {artifact.committed_at && (
                        <span className="text-blue-500">Committed {new Date(artifact.committed_at).toLocaleDateString("en-GB")}</span>
                      )}
                    </div>
                  </div>
                  {/* Confidence bar */}
                  <div className="flex items-center gap-2 min-w-[6rem] shrink-0">
                    <BarChart3 className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
                    <div className="flex-1 h-1.5 bg-[var(--cs-surface)] rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", confidence >= 80 ? "bg-emerald-500" : confidence >= 60 ? "bg-amber-500" : "bg-red-400")}
                        style={{ width: `${confidence}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-[var(--cs-text-muted)]">{confidence}%</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--cs-text-muted)] group-hover:text-[var(--cs-cara-gold)] transition-colors shrink-0" />
                </div>
              );
            })
          )}
        </div>

        {/* ── Summary stats ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4 text-center">
            <p className="text-2xl font-bold text-[var(--cs-navy)]">{artifacts.length}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)] uppercase tracking-wide mt-1">Total Generated</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{statusCounts.committed ?? 0}</p>
            <p className="text-[10px] text-emerald-600 uppercase tracking-wide mt-1">Committed</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{(statusCounts.in_review ?? 0) + (statusCounts.approved ?? 0)}</p>
            <p className="text-[10px] text-amber-600 uppercase tracking-wide mt-1">In Progress</p>
          </div>
          <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4 text-center">
            <p className="text-2xl font-bold text-[var(--cs-navy)]">{statusCounts.draft ?? 0}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)] uppercase tracking-wide mt-1">Drafts</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
