"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — AUDIT TRAIL
//
// Immutable, chronological audit trail of every ARIA Studio action.
// Every generation, edit, review, approval, and commit is logged.
// Designed for regulatory inspection — complete traceability.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Shield, Clock, User, FileText, Sparkles, Search,
  CheckCircle2, Send, Eye, AlertTriangle, Archive,
  Edit3, Trash2, Plus,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actorName: string;
  actorRole: string;
  artifactId: string | null;
  artifactTitle: string | null;
  artifactType: string | null;
  detail: string;
}

// ── Action config ───────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { icon: React.ElementType; colour: string; label: string }> = {
  generated: { icon: Sparkles, colour: "text-[var(--cs-aria-gold)] bg-[var(--cs-aria-gold-bg)]", label: "Generated" },
  edited: { icon: Edit3, colour: "text-blue-600 bg-blue-50", label: "Edited" },
  submitted_for_review: { icon: Send, colour: "text-amber-600 bg-amber-50", label: "Submitted" },
  reviewed: { icon: Eye, colour: "text-purple-600 bg-purple-50", label: "Reviewed" },
  approved: { icon: CheckCircle2, colour: "text-emerald-600 bg-emerald-50", label: "Approved" },
  rejected: { icon: AlertTriangle, colour: "text-red-600 bg-red-50", label: "Rejected" },
  committed: { icon: Archive, colour: "text-blue-700 bg-blue-100", label: "Committed" },
  created: { icon: Plus, colour: "text-[var(--cs-aria-gold)] bg-[var(--cs-aria-gold-bg)]", label: "Created" },
  deleted: { icon: Trash2, colour: "text-red-600 bg-red-50", label: "Deleted" },
};

// ── Demo data ───────────────────────────────────────────────────────────────

const DEMO_AUDIT: AuditEntry[] = [
  {
    id: "aud-1", timestamp: "2026-05-12T08:15:00Z", action: "generated",
    actorName: "Darren Laville", actorRole: "Registered Manager",
    artifactId: "art-1", artifactTitle: "Key Work Session — Jayden — Identity & Belonging",
    artifactType: "keywork_session",
    detail: "Generated with PACE framework, balanced tone, 3 evidence sources linked",
  },
  {
    id: "aud-2", timestamp: "2026-05-12T08:45:00Z", action: "edited",
    actorName: "Darren Laville", actorRole: "Registered Manager",
    artifactId: "art-1", artifactTitle: "Key Work Session — Jayden — Identity & Belonging",
    artifactType: "keywork_session",
    detail: "Edited generated content — added specific reference to yesterday's conversation",
  },
  {
    id: "aud-3", timestamp: "2026-05-12T09:00:00Z", action: "submitted_for_review",
    actorName: "Darren Laville", actorRole: "Registered Manager",
    artifactId: "art-1", artifactTitle: "Key Work Session — Jayden — Identity & Belonging",
    artifactType: "keywork_session",
    detail: "Submitted for peer review",
  },
  {
    id: "aud-4", timestamp: "2026-05-11T16:30:00Z", action: "generated",
    actorName: "Sarah Thompson", actorRole: "Deputy Manager",
    artifactId: "art-2", artifactTitle: "Management Oversight — w/c 5 May",
    artifactType: "management_oversight",
    detail: "Generated with inspection-ready tone, 12 evidence sources linked",
  },
  {
    id: "aud-5", timestamp: "2026-05-11T17:00:00Z", action: "approved",
    actorName: "Darren Laville", actorRole: "Registered Manager",
    artifactId: "art-2", artifactTitle: "Management Oversight — w/c 5 May",
    artifactType: "management_oversight",
    detail: "Approved — quality check passed, evidence confidence 78%",
  },
  {
    id: "aud-6", timestamp: "2026-05-11T17:15:00Z", action: "committed",
    actorName: "Darren Laville", actorRole: "Registered Manager",
    artifactId: "art-2", artifactTitle: "Management Oversight — w/c 5 May",
    artifactType: "management_oversight",
    detail: "Committed to official record — filed to governance/management-oversight/2026-05-11",
  },
  {
    id: "aud-7", timestamp: "2026-05-10T14:00:00Z", action: "generated",
    actorName: "Darren Laville", actorRole: "Registered Manager",
    artifactId: "art-3", artifactTitle: "Risk Review — Amara — Self-Harm Indicators",
    artifactType: "risk_review",
    detail: "Generated with trauma-informed framework, 5 evidence sources linked",
  },
  {
    id: "aud-8", timestamp: "2026-05-10T15:30:00Z", action: "reviewed",
    actorName: "Sarah Thompson", actorRole: "Deputy Manager",
    artifactId: "art-3", artifactTitle: "Risk Review — Amara — Self-Harm Indicators",
    artifactType: "risk_review",
    detail: "Reviewed — requested stronger evidence for protective factors section",
  },
  {
    id: "aud-9", timestamp: "2026-05-09T10:00:00Z", action: "generated",
    actorName: "Marcus Williams", actorRole: "Care Worker",
    artifactId: "art-4", artifactTitle: "What Happens at a Review — Amara",
    artifactType: "child_friendly_explanation",
    detail: "Generated with child-friendly tone, language simplified for young person",
  },
  {
    id: "aud-10", timestamp: "2026-05-09T11:00:00Z", action: "committed",
    actorName: "Darren Laville", actorRole: "Registered Manager",
    artifactId: "art-4", artifactTitle: "What Happens at a Review — Amara",
    artifactType: "child_friendly_explanation",
    detail: "Committed — filed to young-people/child_2/communication",
  },
];

// ══════════════════════════════════════════════════════════════════════════════

export default function AuditTrailPage() {
  const [entries, setEntries] = useState<AuditEntry[]>(DEMO_AUDIT);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string | null>(null);

  const filtered = entries.filter((e) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !e.artifactTitle?.toLowerCase().includes(q) &&
        !e.actorName.toLowerCase().includes(q) &&
        !e.detail.toLowerCase().includes(q)
      ) return false;
    }
    if (actionFilter && e.action !== actionFilter) return false;
    return true;
  });

  const actionCounts: Record<string, number> = {};
  for (const e of entries) {
    actionCounts[e.action] = (actionCounts[e.action] ?? 0) + 1;
  }

  return (
    <PageShell title="Audit Trail" subtitle="Complete traceability for every ARIA Studio action">
      <div className="space-y-6 pb-12">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[var(--cs-aria-gold-soft)] bg-gradient-to-r from-[var(--cs-aria-gold-bg)] to-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <Shield className="h-5 w-5 text-[var(--cs-aria-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Audit Trail</h2>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                Immutable record of every generation, edit, review, approval, and commitment. Designed for regulatory inspection — complete traceability.
              </p>
            </div>
            <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
              {entries.length} entries
            </Badge>
          </div>
        </div>

        {/* ── Search + action filters ─────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--cs-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full rounded-xl border border-[var(--cs-border)] bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold)]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActionFilter(null)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                !actionFilter ? "border-[var(--cs-aria-gold)] bg-[var(--cs-aria-gold-bg)] text-[var(--cs-navy)]" : "border-[var(--cs-border)] bg-white text-[var(--cs-text-secondary)]",
              )}
            >
              All
            </button>
            {Object.entries(actionCounts).map(([action, count]) => {
              const config = ACTION_CONFIG[action];
              if (!config) return null;
              return (
                <button
                  key={action}
                  onClick={() => setActionFilter(actionFilter === action ? null : action)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    actionFilter === action ? "ring-1 ring-[var(--cs-aria-gold-soft)]" : "",
                    "border-[var(--cs-border)] bg-white text-[var(--cs-text-secondary)] hover:border-[var(--cs-aria-gold-soft)]",
                  )}
                >
                  {config.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Timeline ────────────────────────────────────────────────────── */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-[var(--cs-border)]" />

          <div className="space-y-4">
            {filtered.map((entry) => {
              const config = ACTION_CONFIG[entry.action] ?? ACTION_CONFIG.created;
              const Icon = config.icon;
              return (
                <div key={entry.id} className="relative flex gap-4 pl-2">
                  {/* Timeline dot */}
                  <div className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", config.colour)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 rounded-xl border border-[var(--cs-border)] bg-white p-4 -mt-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={cn("text-[9px] border", config.colour)}>{config.label}</Badge>
                          <span className="text-xs font-semibold text-[var(--cs-navy)]">{entry.actorName}</span>
                          <span className="text-[10px] text-[var(--cs-text-muted)]">{entry.actorRole}</span>
                        </div>
                        {entry.artifactTitle && (
                          <p className="text-xs font-medium text-[var(--cs-text-secondary)] mt-1">{entry.artifactTitle}</p>
                        )}
                        <p className="text-[11px] text-[var(--cs-text-muted)] mt-1 leading-relaxed">{entry.detail}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-[var(--cs-text-muted)]">
                          {new Date(entry.timestamp).toLocaleDateString("en-GB")}
                        </p>
                        <p className="text-[10px] text-[var(--cs-text-muted)]">
                          {new Date(entry.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="rounded-xl border border-[var(--cs-border)] bg-white p-8 text-center">
            <Search className="h-8 w-8 text-[var(--cs-text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--cs-text-muted)]">No audit entries match the current filters.</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
