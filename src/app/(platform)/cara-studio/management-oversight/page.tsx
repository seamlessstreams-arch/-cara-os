"use client";

// ══════════════════════════════════════════════════════════════════════════════
// PRACTICE INTELLIGENCE — MANAGEMENT OVERSIGHT INTELLIGENCE
//
// Generate, review, approve, and commit management oversight drafts across
// 19 oversight types. Cara drafts evidence-based oversight comments — managers
// review, personalise, and commit to the official record.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ClipboardCheck, Eye, CheckCircle2, AlertTriangle,
  Shield, Clock, Target, Sparkles, Search, FileText,
} from "lucide-react";
import { demoSeed } from "@/lib/demo/demo-seed";

// ── Types ───────────────────────────────────────────────────────────────────

interface OversightDraft {
  id: string;
  oversight_type: string;
  type_label: string;
  child_name: string | null;
  status: "draft" | "reviewed" | "approved" | "committed";
  quality_score: number | null;
  created_at: string;
  content: {
    summary: string;
    evidence_reviewed: string;
    child_impact: string;
    staff_practice_analysis: string;
    risk_analysis: string;
    safeguarding_considerations: string;
    regulatory_relevance: string;
    actions_required: { action: string; owner: string | null; priority: string }[];
    human_review_note: string;
  };
}

// ── Demo data ───────────────────────────────────────────────────────────────

const DEMO_DRAFTS: OversightDraft[] = [
  {
    id: "od-1", oversight_type: "incident_oversight", type_label: "Incident Oversight",
    child_name: "Amara", status: "draft", quality_score: 82, created_at: "2026-05-11T09:00:00Z",
    content: {
      summary: "Incident involving Amara on 10 May. Amara became distressed following a group discussion about upcoming activities.",
      evidence_reviewed: "Incident report, daily log entries for the past 3 days, Amara's therapeutic profile.",
      child_impact: "Amara's self-isolation has increased. This incident appears connected to her pattern of withdrawal when feeling overwhelmed.",
      staff_practice_analysis: "Staff responded appropriately using PACE. Consider whether group discussion could have been managed differently.",
      risk_analysis: "Self-isolation is a known risk indicator. Current risk assessment remains valid but should be reviewed if pattern continues.",
      safeguarding_considerations: "No immediate safeguarding concerns. Continue to monitor.",
      regulatory_relevance: "Children's Homes Regs 2015, Reg 12 — Protection of Children.",
      actions_required: [
        { action: "Key work session with Amara to explore what happened", owner: "Sarah Thompson", priority: "high" },
        { action: "Review group activity planning", owner: "Shift Lead", priority: "medium" },
      ],
      human_review_note: "Cara-generated draft. RM to review, personalise, and approve.",
    },
  },
  {
    id: "od-2", oversight_type: "daily_log_oversight", type_label: "Daily Log Oversight",
    child_name: null, status: "approved", quality_score: 75, created_at: "2026-05-11T08:00:00Z",
    content: {
      summary: "Weekly daily log oversight review for 5-11 May 2026.",
      evidence_reviewed: "35 daily log entries across the week.",
      child_impact: "Logs capture day-to-day care well. Child voice present in ~40% of entries — needs improving.",
      staff_practice_analysis: "Recording quality is variable. Some detailed reflective entries, others brief factual statements.",
      risk_analysis: "No new risks identified.",
      safeguarding_considerations: "No safeguarding concerns from log review.",
      regulatory_relevance: "Quality Standards 2015 — recording must capture the child's lived experience.",
      actions_required: [
        { action: "Team briefing on capturing child voice", owner: "Registered Manager", priority: "medium" },
      ],
      human_review_note: "Reviewed and approved. Ready to commit.",
    },
  },
  {
    id: "od-3", oversight_type: "missing_from_care_oversight", type_label: "Missing from Care Oversight",
    child_name: "Jayden", status: "committed", quality_score: 88, created_at: "2026-05-10T22:30:00Z",
    content: {
      summary: "Missing episode on 10 May. Jayden left the home at 20:15 and was located by staff at 21:30 at a friend's house.",
      evidence_reviewed: "Missing from care report, return home interview, police notification, risk assessment.",
      child_impact: "Jayden was safe. Episode appears linked to peer influence rather than risk-to-self. Return home interview completed.",
      staff_practice_analysis: "Staff followed missing from care protocol correctly. Police notified within expected timeframe.",
      risk_analysis: "Missing from care risk assessment to be updated. This is the second episode this month.",
      safeguarding_considerations: "No exploitation indicators identified. Social worker notified.",
      regulatory_relevance: "Reg 12, Reg 32 — Notification of serious events.",
      actions_required: [
        { action: "Update missing from care risk assessment", owner: "Key Worker", priority: "high" },
        { action: "Discussion at next LAC review", owner: "Registered Manager", priority: "medium" },
      ],
      human_review_note: "Committed to record by RM.",
    },
  },
];

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  reviewed: "bg-blue-50 text-blue-600 border-blue-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  committed: "bg-purple-50 text-purple-600 border-purple-200",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-blue-50 text-blue-600 border-blue-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
  urgent: "bg-red-100 text-red-800 border-red-300",
};

// ══════════════════════════════════════════════════════════════════════════════

export default function ManagementOversightPage() {
  const [drafts] = useState(demoSeed(DEMO_DRAFTS));
  const [selectedId, setSelectedId] = useState<string>(DEMO_DRAFTS[0].id);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filtered = drafts.filter((d) => !statusFilter || d.status === statusFilter);
  const current = drafts.find((d) => d.id === selectedId);

  return (
    <PageShell title="Management Oversight" subtitle="AI-assisted oversight intelligence">
      <div className="space-y-6 pb-12">

        <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <ClipboardCheck className="h-5 w-5 text-[var(--cs-cara-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Management Oversight Intelligence</h2>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                Cara drafts evidence-based oversight comments across 19 types. Managers review, personalise, approve, and commit to the official record.
              </p>
            </div>
          </div>
        </div>

        {/* ── Status filters ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {["draft", "reviewed", "approved", "committed"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? null : s)}
              className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                statusFilter === s ? "ring-1 ring-[var(--cs-cara-gold-soft)]" : "", STATUS_STYLES[s])}>
              {s.charAt(0).toUpperCase() + s.slice(1)} ({drafts.filter((d) => d.status === s).length})
            </button>
          ))}
        </div>

        {/* ── List + Detail ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            {filtered.map((d) => (
              <button key={d.id} onClick={() => setSelectedId(d.id)}
                className={cn("w-full rounded-xl border p-4 text-left transition-all",
                  selectedId === d.id ? "border-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)] ring-1 ring-[var(--cs-cara-gold-soft)]" : "border-[var(--cs-border)] bg-white hover:border-[var(--cs-cara-gold-soft)]")}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-[var(--cs-navy)]">{d.type_label}</span>
                  {d.child_name && <span className="text-[10px] text-[var(--cs-text-muted)]">— {d.child_name}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-[9px] border", STATUS_STYLES[d.status])}>{d.status}</Badge>
                  {d.quality_score && <span className="text-[10px] text-[var(--cs-text-muted)]">Quality: {d.quality_score}%</span>}
                  <span className="text-[10px] text-[var(--cs-text-muted)] ml-auto">{new Date(d.created_at).toLocaleDateString("en-GB")}</span>
                </div>
              </button>
            ))}
          </div>

          {current && (
            <div className="lg:col-span-2 rounded-xl border border-[var(--cs-border)] bg-white p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-[var(--cs-navy)]">{current.type_label}</h3>
                  {current.child_name && <p className="text-xs text-[var(--cs-text-muted)]">{current.child_name}</p>}
                </div>
                <Badge className={cn("text-[10px] border", STATUS_STYLES[current.status])}>{current.status}</Badge>
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-[var(--cs-surface)] p-4">
                <p className="text-[10px] font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Summary</p>
                <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{current.content.summary}</p>
              </div>

              {/* Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Evidence Reviewed", icon: Eye, text: current.content.evidence_reviewed },
                  { label: "Child Impact", icon: Target, text: current.content.child_impact },
                  { label: "Staff Practice", icon: FileText, text: current.content.staff_practice_analysis },
                  { label: "Risk Analysis", icon: AlertTriangle, text: current.content.risk_analysis },
                  { label: "Safeguarding", icon: Shield, text: current.content.safeguarding_considerations },
                  { label: "Regulatory Relevance", icon: ClipboardCheck, text: current.content.regulatory_relevance },
                ].map(({ label, icon: Icon, text }) => (
                  <div key={label}>
                    <p className="text-[10px] font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Icon className="h-3 w-3" /> {label}
                    </p>
                    <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {current.content.actions_required.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-2">Actions Required</p>
                  {current.content.actions_required.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <Badge className={cn("text-[9px] border shrink-0 mt-0.5", PRIORITY_STYLES[a.priority])}>{a.priority}</Badge>
                      <div>
                        <p className="text-xs text-[var(--cs-text-secondary)]">{a.action}</p>
                        {a.owner && <p className="text-[10px] text-[var(--cs-text-muted)]">Owner: {a.owner}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Human review note */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-[10px] font-semibold text-amber-800 uppercase tracking-wide mb-1">Human Review Required</p>
                <p className="text-xs text-amber-700 leading-relaxed">{current.content.human_review_note}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
