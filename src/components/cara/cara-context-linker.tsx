"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraContextLinker
//
// Shows the bidirectional record links that Cara has created between records.
// For example, linking an incident to a risk assessment, a behaviour support
// plan, and a supervision record. Allows managers to view, verify, and
// dismiss links.
//
// Usage:
//   <CaraContextLinker sourceTable="incidents" recordId="inc_042" />
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Link2,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
  Shield,
  Users,
  AlertTriangle,
  Heart,
  ClipboardCheck,
  BookOpen,
  Brain,
  Loader2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type LinkStatus = "active" | "verified" | "dismissed" | "expired";
type LinkDirection = "outgoing" | "incoming";

interface ContextLink {
  id: string;
  direction: LinkDirection;
  sourceTable: string;
  sourceId: string;
  targetTable: string;
  targetId: string;
  relationshipType: string;
  description: string;
  confidence: number;
  status: LinkStatus;
  createdAt: string;
  createdBy: "cara" | "user";
}

// ── Config ─────────────────────────────────────────────────────────────────

const TABLE_CONFIG: Record<string, { label: string; icon: React.ElementType; colour: string; href: (id: string) => string }> = {
  incidents:             { label: "Incident",             icon: AlertTriangle,  colour: "text-red-600",     href: (id) => `/incidents/${id}` },
  daily_log_entries:     { label: "Daily Log",            icon: FileText,       colour: "text-blue-600",    href: (id) => `/daily-log#${id}` },
  supervisions:          { label: "Supervision",          icon: Users,          colour: "text-indigo-600",  href: (id) => `/supervision/${id}` },
  safeguarding_concerns: { label: "Safeguarding Concern", icon: Shield,         colour: "text-red-700",     href: (id) => `/safeguarding/${id}` },
  risk_assessments:      { label: "Risk Assessment",      icon: AlertTriangle,  colour: "text-orange-600",  href: (id) => `/young-people/${id}` },
  behaviour_support_plans: { label: "Behaviour Plan",     icon: Heart,          colour: "text-pink-600",    href: (id) => `/young-people/${id}` },
  care_plans:            { label: "Care Plan",            icon: ClipboardCheck, colour: "text-emerald-600", href: (id) => `/care-plans/${id}` },
  key_work_sessions:     { label: "Key Work",             icon: BookOpen,       colour: "text-violet-600",  href: (id) => `/key-work/${id}` },
  handovers:             { label: "Handover",             icon: FileText,       colour: "text-slate-600",   href: (id) => `/handover#${id}` },
  management_oversight:  { label: "Oversight Note",       icon: Brain,          colour: "text-amber-600",   href: (id) => `/incidents/${id}` },
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  triggered_by:        "Triggered by",
  relates_to:          "Relates to",
  informs:             "Informs",
  requires_review_of:  "Requires review of",
  evidence_for:        "Evidence for",
  follow_up_from:      "Follow-up from",
  supports:            "Supports",
  contradicts:         "May contradict",
  supersedes:          "Supersedes",
};

const STATUS_CONFIG: Record<LinkStatus, { label: string; colour: string }> = {
  active:    { label: "Active",    colour: "text-blue-600" },
  verified:  { label: "Verified",  colour: "text-emerald-600" },
  dismissed: { label: "Dismissed", colour: "text-[var(--cs-text-muted)]" },
  expired:   { label: "Expired",   colour: "text-[var(--cs-text-muted)]" },
};

// ── Demo data ──────────────────────────────────────────────────────────────

function getDemoLinks(sourceTable: string, recordId: string): ContextLink[] {
  if (sourceTable === "incidents") {
    return [
      {
        id: "cl_001",
        direction: "outgoing",
        sourceTable: "incidents",
        sourceId: recordId,
        targetTable: "risk_assessments",
        targetId: "ra_012",
        relationshipType: "requires_review_of",
        description: "This incident may indicate the risk assessment needs updating to reflect the current presentation.",
        confidence: 87,
        status: "active",
        createdAt: "2026-05-05T08:30:00Z",
        createdBy: "cara",
      },
      {
        id: "cl_002",
        direction: "outgoing",
        sourceTable: "incidents",
        sourceId: recordId,
        targetTable: "behaviour_support_plans",
        targetId: "bsp_008",
        relationshipType: "requires_review_of",
        description: "The behaviour described in this incident is not fully addressed in the current behaviour support plan.",
        confidence: 74,
        status: "active",
        createdAt: "2026-05-05T08:30:00Z",
        createdBy: "cara",
      },
      {
        id: "cl_003",
        direction: "outgoing",
        sourceTable: "incidents",
        sourceId: recordId,
        targetTable: "supervisions",
        targetId: "sup_024",
        relationshipType: "informs",
        description: "This incident should be discussed in the next supervision with the involved staff member.",
        confidence: 91,
        status: "verified",
        createdAt: "2026-05-05T08:30:00Z",
        createdBy: "cara",
      },
      {
        id: "cl_004",
        direction: "incoming",
        sourceTable: "daily_log_entries",
        sourceId: "dle_189",
        targetTable: "incidents",
        targetId: recordId,
        relationshipType: "relates_to",
        description: "Daily log entry mentions contextual factors that preceded this incident.",
        confidence: 68,
        status: "active",
        createdAt: "2026-05-05T08:30:00Z",
        createdBy: "cara",
      },
    ];
  }
  return [];
}

// ── Component ──────────────────────────────────────────────────────────────

interface CaraContextLinkerProps {
  sourceTable: string;
  recordId: string;
  className?: string;
}

export function CaraContextLinker({
  sourceTable,
  recordId,
  className,
}: CaraContextLinkerProps) {
  const [links, setLinks] = useState<ContextLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // In production, fetch from /api/cara/context-links
    const timer = setTimeout(() => {
      setLinks(getDemoLinks(sourceTable, recordId));
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [sourceTable, recordId]);

  const activeLinks = links.filter((l) => l.status !== "dismissed");

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-[10px] text-[var(--cs-text-muted)]", className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading linked records…
      </div>
    );
  }

  if (activeLinks.length === 0) return null;

  return (
    <div className={cn("rounded-xl border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] overflow-hidden", className)}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[var(--cs-cara-gold-soft)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Link2 className="h-3.5 w-3.5 text-[var(--cs-cara-gold)]" />
          <span className="text-xs font-semibold text-[var(--cs-navy)]">
            {activeLinks.length} linked record{activeLinks.length !== 1 ? "s" : ""}
          </span>
          <span className="text-[9px] text-[var(--cs-text-muted)]">
            identified by Cara
          </span>
        </div>
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-[var(--cs-text-muted)] transition-transform",
            expanded && "rotate-90",
          )}
        />
      </button>

      {/* Links list */}
      {expanded && (
        <div className="border-t border-[var(--cs-cara-gold-soft)] divide-y divide-[var(--cs-cara-gold-soft)]">
          {activeLinks.map((link) => {
            const linkedTable = link.direction === "outgoing" ? link.targetTable : link.sourceTable;
            const linkedId = link.direction === "outgoing" ? link.targetId : link.sourceId;
            const config = TABLE_CONFIG[linkedTable] ?? {
              label: linkedTable,
              icon: FileText,
              colour: "text-[var(--cs-text-muted)]",
              href: () => "#",
            };
            const Icon = config.icon;
            const relLabel = RELATIONSHIP_LABELS[link.relationshipType] ?? link.relationshipType;
            const statusConfig = STATUS_CONFIG[link.status];

            return (
              <div key={link.id} className="px-4 py-3 bg-white/60">
                <div className="flex items-start gap-2.5">
                  <div className={cn("h-6 w-6 rounded-lg bg-white border border-[var(--cs-border-subtle)] flex items-center justify-center shrink-0")}>
                    <Icon className={cn("h-3 w-3", config.colour)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-semibold text-[var(--cs-navy)]">
                        {config.label}
                      </span>
                      <span className="text-[9px] text-[var(--cs-text-muted)]">
                        {relLabel}
                      </span>
                      <span className={cn("text-[9px] font-medium", statusConfig.colour)}>
                        {link.status === "verified" && <CheckCircle2 className="h-2.5 w-2.5 inline mr-0.5" />}
                        {statusConfig.label}
                      </span>
                      <span className="text-[9px] text-[var(--cs-text-muted)]">
                        {link.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--cs-text-secondary)] leading-relaxed mt-0.5">
                      {link.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <Link
                        href={config.href(linkedId)}
                        className="inline-flex items-center gap-1 text-[9px] font-medium text-[var(--cs-cara-gold)] hover:text-[var(--cs-navy)] transition-colors"
                      >
                        View record <ChevronRight className="h-2.5 w-2.5" />
                      </Link>
                      {link.createdBy === "cara" && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] text-[var(--cs-text-muted)]">
                          <Sparkles className="h-2.5 w-2.5 text-[var(--cs-cara-gold)]" />
                          Cara identified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Expose for testing
export const _testing = { TABLE_CONFIG, RELATIONSHIP_LABELS, STATUS_CONFIG, getDemoLinks };
