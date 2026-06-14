// ══════════════════════════════════════════════════════════════════════════════
// CaraDocumentIntelligence — AI analysis of uploaded documents
//
// Tracks policy documents, certificates, and key paperwork. Identifies
// expiry dates, missing documents, policy gaps, and review cycles.
// Provides Cara suggestions for document management compliance.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useState } from "react";
import {
  Sparkles, FileText, AlertTriangle, CheckCircle2,
  Clock, XCircle, AlertCircle, ChevronDown, ChevronUp,
  Shield, BookOpen, Award, Briefcase,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type DocStatus = "current" | "expiring_soon" | "expired" | "missing" | "review_due";

type DocCategory =
  | "policy"
  | "certificate"
  | "insurance"
  | "registration"
  | "training_record"
  | "dbs_check"
  | "care_document"
  | "ofsted";

interface TrackedDocument {
  id: string;
  category: DocCategory;
  name: string;
  status: DocStatus;
  expiryDate?: string;
  daysUntilExpiry?: number;
  lastReviewed?: string;
  reviewCycleDays?: number;
  owner: string;
  caraNotes?: string;
}

// ── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DocStatus, { label: string; colour: string; bg: string; icon: React.ReactNode }> = {
  current:       { label: "Current",       colour: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> },
  expiring_soon: { label: "Expiring Soon", colour: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     icon: <Clock className="h-3.5 w-3.5 text-amber-500" /> },
  expired:       { label: "Expired",       colour: "text-red-700",     bg: "bg-red-50 border-red-200",         icon: <XCircle className="h-3.5 w-3.5 text-red-500" /> },
  missing:       { label: "Missing",       colour: "text-red-700",     bg: "bg-red-50 border-red-200",         icon: <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> },
  review_due:    { label: "Review Due",    colour: "text-orange-700",  bg: "bg-orange-50 border-orange-200",   icon: <AlertCircle className="h-3.5 w-3.5 text-orange-500" /> },
};

const CATEGORY_CONFIG: Record<DocCategory, { label: string; icon: React.ReactNode }> = {
  policy:          { label: "Policy",          icon: <BookOpen className="h-3.5 w-3.5" /> },
  certificate:     { label: "Certificate",     icon: <Award className="h-3.5 w-3.5" /> },
  insurance:       { label: "Insurance",       icon: <Shield className="h-3.5 w-3.5" /> },
  registration:    { label: "Registration",    icon: <FileText className="h-3.5 w-3.5" /> },
  training_record: { label: "Training Record", icon: <BookOpen className="h-3.5 w-3.5" /> },
  dbs_check:       { label: "DBS Check",       icon: <Shield className="h-3.5 w-3.5" /> },
  care_document:   { label: "Care Document",   icon: <FileText className="h-3.5 w-3.5" /> },
  ofsted:          { label: "Ofsted",          icon: <Briefcase className="h-3.5 w-3.5" /> },
};

// ── Demo data ────────────────────────────────────────────────────────────────

function getDemoDocuments(): TrackedDocument[] {
  return [
    {
      id: "doc_001", category: "policy", name: "Safeguarding Policy", status: "review_due",
      lastReviewed: "2025-11-10", reviewCycleDays: 180, owner: "Darren L (RM)",
      caraNotes: "Annual review overdue by 2 days. Safeguarding policy should reference latest KCSIE 2026 guidance.",
    },
    {
      id: "doc_002", category: "insurance", name: "Employers Liability Insurance", status: "expiring_soon",
      expiryDate: "2026-06-01", daysUntilExpiry: 20, owner: "Head Office",
      caraNotes: "Renewal should be arranged 30 days before expiry. Contact insurer.",
    },
    {
      id: "doc_003", category: "dbs_check", name: "DBS — Jordan P", status: "current",
      expiryDate: "2027-03-15", daysUntilExpiry: 307, owner: "HR",
    },
    {
      id: "doc_004", category: "certificate", name: "Fire Safety Certificate", status: "current",
      expiryDate: "2026-12-01", daysUntilExpiry: 203, owner: "Darren L (RM)",
    },
    {
      id: "doc_005", category: "registration", name: "Ofsted Registration Certificate", status: "current",
      owner: "Head Office",
    },
    {
      id: "doc_006", category: "policy", name: "Behaviour Management Policy", status: "current",
      lastReviewed: "2026-02-15", reviewCycleDays: 365, owner: "Darren L (RM)",
    },
    {
      id: "doc_007", category: "policy", name: "Missing from Care Protocol", status: "current",
      lastReviewed: "2026-01-20", reviewCycleDays: 365, owner: "Darren L (RM)",
    },
    {
      id: "doc_008", category: "training_record", name: "Team Training Matrix", status: "review_due",
      lastReviewed: "2026-02-01", reviewCycleDays: 90, owner: "Darren L (RM)",
      caraNotes: "Quarterly review due. 2 staff members have training gaps flagged by Cara.",
    },
    {
      id: "doc_009", category: "care_document", name: "Statement of Purpose", status: "current",
      lastReviewed: "2026-03-01", reviewCycleDays: 365, owner: "Responsible Individual",
    },
    {
      id: "doc_010", category: "policy", name: "Complaints Policy", status: "current",
      lastReviewed: "2026-04-10", reviewCycleDays: 365, owner: "Darren L (RM)",
    },
    {
      id: "doc_011", category: "certificate", name: "First Aid at Work — Pat M", status: "expiring_soon",
      expiryDate: "2026-05-30", daysUntilExpiry: 18, owner: "Pat M",
    },
    {
      id: "doc_012", category: "policy", name: "Physical Intervention Policy", status: "missing",
      owner: "Darren L (RM)",
      caraNotes: "Required under Reg 35. Must be in place and reviewed. Urgent action needed.",
    },
  ];
}

// ── Component ────────────────────────────────────────────────────────────────

export function CaraDocumentIntelligence() {
  const [filterStatus, setFilterStatus] = useState<DocStatus | "all">("all");
  const docs = getDemoDocuments();

  const displayed = filterStatus === "all" ? docs : docs.filter((d) => d.status === filterStatus);

  // Sort: expired/missing first, then expiring, review due, current
  const statusOrder: Record<DocStatus, number> = { expired: 0, missing: 0, expiring_soon: 1, review_due: 2, current: 3 };
  const sorted = [...displayed].sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

  const currentCount = docs.filter((d) => d.status === "current").length;
  const alertCount = docs.filter((d) => d.status !== "current").length;
  const expiredCount = docs.filter((d) => d.status === "expired" || d.status === "missing").length;

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[var(--cs-cara-gold-soft)] rounded-lg">
              <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Document Intelligence</h3>
              <p className="text-[10px] text-[var(--cs-text-muted)]">Cara-tracked policies, certificates & compliance documents</p>
            </div>
          </div>
          {alertCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${expiredCount > 0 ? "bg-red-100 text-red-700 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
              {alertCount} action{alertCount !== 1 ? "s" : ""} needed
            </span>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 divide-x divide-[var(--cs-border)] border-b border-[var(--cs-border)]">
        {[
          { label: "Total Docs",    value: docs.length,    colour: "text-[var(--cs-navy)]" },
          { label: "Current",       value: currentCount,   colour: "text-emerald-600" },
          { label: "Needs Action",  value: alertCount,     colour: alertCount > 0 ? "text-amber-600" : "text-emerald-600" },
          { label: "Expired/Missing", value: expiredCount, colour: expiredCount > 0 ? "text-red-600" : "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="px-3 py-2.5 text-center">
            <div className={`text-lg font-bold tabular-nums ${s.colour}`}>{s.value}</div>
            <div className="text-[10px] text-[var(--cs-text-muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="px-4 py-2 border-b border-[var(--cs-border)] flex items-center gap-1.5 flex-wrap">
        {(["all", "expired", "missing", "expiring_soon", "review_due", "current"] as const).map((f) => {
          const isActive = filterStatus === f;
          const label = f === "all" ? `All (${docs.length})` : `${STATUS_CONFIG[f as DocStatus]?.label ?? f}`;
          return (
            <button
              key={f}
              className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${isActive ? "bg-[var(--cs-navy)] text-white" : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200"}`}
              onClick={() => setFilterStatus(f)}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Document list */}
      <div className="divide-y divide-[var(--cs-border)]">
        {sorted.map((doc) => {
          const sCfg = STATUS_CONFIG[doc.status];
          const cCfg = CATEGORY_CONFIG[doc.category];

          return (
            <div key={doc.id} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
              <span className="mt-0.5 text-[var(--cs-text-muted)]">{cCfg.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-[var(--cs-navy)]">{doc.name}</span>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${sCfg.bg} ${sCfg.colour}`}>
                    {sCfg.icon} {sCfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-[var(--cs-text-gentle)]">
                  <span>{cCfg.label}</span>
                  <span>Owner: {doc.owner}</span>
                  {doc.expiryDate && <span>Expires: {new Date(doc.expiryDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
                  {doc.lastReviewed && <span>Reviewed: {new Date(doc.lastReviewed + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
                </div>
                {doc.caraNotes && (
                  <div className="mt-1.5 rounded-lg bg-[var(--cs-cara-gold-bg)] border border-[var(--cs-cara-gold-soft)] px-2.5 py-1.5">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Sparkles className="h-2.5 w-2.5 text-[var(--cs-cara-gold)]" />
                      <span className="text-[9px] font-semibold text-[var(--cs-navy)]">Cara</span>
                    </div>
                    <p className="text-[10px] text-[var(--cs-text-secondary)]">{doc.caraNotes}</p>
                  </div>
                )}
              </div>
              {doc.daysUntilExpiry !== undefined && (
                <span className={`text-[11px] font-medium tabular-nums shrink-0 ${doc.daysUntilExpiry <= 0 ? "text-red-600" : doc.daysUntilExpiry <= 30 ? "text-amber-600" : "text-[var(--cs-text-muted)]"}`}>
                  {doc.daysUntilExpiry <= 0 ? "Expired" : `${doc.daysUntilExpiry}d`}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[var(--cs-border)] bg-slate-50/50">
        <p className="text-[10px] text-[var(--cs-text-muted)] text-center">
          Cara tracks document expiry, review cycles, and regulatory requirements. Maintain all policies per your Statement of Purpose.
        </p>
      </div>
    </div>
  );
}

// ── Testing exports ──────────────────────────────────────────────────────────

export const _testing = { STATUS_CONFIG, CATEGORY_CONFIG, getDemoDocuments };
