"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield, CheckCircle2, AlertTriangle, Clock, Download,
  Fingerprint, FileCheck, User, Users, Globe, GraduationCap,
  Briefcase, Heart, ExternalLink, FileText, ClipboardCheck,
  LayoutGrid, List, Filter, ChevronDown, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRecruitment } from "@/hooks/use-recruitment";
import type { CandidateDetail, RecruitmentCheck } from "@/hooks/use-recruitment";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";

// ── Constants ─────────────────────────────────────────────────────────────────

const CHECK_TYPES = [
  { id: "enhanced_dbs", label: "Enhanced DBS", icon: Fingerprint },
  { id: "barred_list", label: "Barred List", icon: Shield },
  { id: "right_to_work", label: "Right to Work", icon: FileCheck },
  { id: "identity", label: "Identity", icon: User },
  { id: "overseas_criminal_record", label: "Overseas Record", icon: Globe },
  { id: "professional_qualifications", label: "Qualifications", icon: GraduationCap },
  { id: "employment_history", label: "Employment History", icon: Briefcase },
  { id: "medical_fitness", label: "Medical Fitness", icon: Heart },
  { id: "references", label: "References", icon: Users },
  { id: "driving_licence", label: "Driving Licence", icon: FileText },
  { id: "safeguarding_training_check", label: "Safeguarding Training", icon: ClipboardCheck },
] as const;

type CheckTypeId = typeof CHECK_TYPES[number]["id"];

const STATUS_DISPLAY: Record<string, { label: string; short: string; color: string; dot: string }> = {
  not_started: { label: "Not Started", short: "—", color: "bg-slate-100 text-[var(--cs-text-muted)]", dot: "bg-slate-300" },
  requested: { label: "Requested", short: "REQ", color: "bg-blue-100 text-blue-700", dot: "bg-blue-400" },
  in_progress: { label: "In Progress", short: "IP", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  received: { label: "Received", short: "RCV", color: "bg-amber-100 text-amber-700", dot: "bg-amber-400" },
  verified: { label: "Verified", short: "✓", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  concern_flagged: { label: "Concern", short: "!", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
  override_approved: { label: "Override", short: "OVR", color: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  not_required: { label: "N/A", short: "N/A", color: "bg-slate-50 text-[var(--cs-text-gentle)]", dot: "bg-slate-200" },
};

// ── Grid Cell ─────────────────────────────────────────────────────────────────

function StatusCell({
  check,
  onClick,
}: {
  check: RecruitmentCheck | undefined;
  onClick?: () => void;
}) {
  if (!check) return <td className="px-2 py-2 text-center"><span className="text-[10px] text-slate-200">—</span></td>;
  const s = STATUS_DISPLAY[check.status] ?? STATUS_DISPLAY.not_started;
  return (
    <td className="px-2 py-2 text-center">
      <button
        onClick={onClick}
        title={s.label}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-2 py-1 text-[9px] font-semibold min-w-[32px] transition-all hover:opacity-80",
          s.color,
          check.concern_flag && "ring-1 ring-[var(--cs-risk)]"
        )}
      >
        {check.concern_flag ? "!" : s.short}
      </button>
    </td>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ViewMode = "grid" | "list";

export default function ChecksPage() {
  const { data, isLoading, error } = useRecruitment();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [stageFilter, setStageFilter] = useState("all");
  const [selectedCheckType, setSelectedCheckType] = useState<CheckTypeId | "all">("all");
  const [search, setSearch] = useState("");

  const candidates = useMemo<CandidateDetail[]>(() => {
    let all = data?.candidates ?? [];
    if (stageFilter !== "all") all = all.filter(c => c.stage === stageFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      all = all.filter(c => {
        const hay = `${c.first_name} ${c.last_name} ${c.role_applied} ${c.stage}`.toLowerCase();
        return hay.includes(q);
      });
    }
    return all;
  }, [data, stageFilter, search]);

  // Build a lookup: candidate_id → check_type → check
  const checkMap = useMemo(() => {
    const map: Record<string, Record<string, RecruitmentCheck>> = {};
    for (const c of candidates) {
      map[c.id] = {};
      for (const check of c.checks ?? []) {
        map[c.id][check.check_type] = check;
      }
    }
    return map;
  }, [candidates]);

  // Summary stats
  const stats = useMemo(() => {
    const allChecks = candidates.flatMap(c => c.checks ?? []);
    return {
      total: allChecks.length,
      verified: allChecks.filter(c => c.status === "verified").length,
      outstanding: allChecks.filter(c => ["not_started", "requested", "in_progress", "received"].includes(c.status)).length,
      concerns: allChecks.filter(c => c.concern_flag).length,
      overrides: allChecks.filter(c => c.override_reason != null).length,
    };
  }, [candidates]);

  if (isLoading) return (
    <PageShell title="Compliance Checks" subtitle="Loading...">
      <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
    </PageShell>
  );

  if (error) return (
    <PageShell title="Compliance Checks" subtitle="">
      <Card className="rounded-2xl border-red-100 bg-red-50">
        <CardContent className="py-8 text-center text-red-600">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
          Failed to load check data.
        </CardContent>
      </Card>
    </PageShell>
  );

  return (
    <PageShell
      title="Compliance Checks"
      subtitle="Single Central Record — compliance status for all candidates"
      caraContext={{ pageTitle: "Single Central Record — Compliance Checks", sourceType: "staff" }}
      actions={
        <div className="flex gap-2">
          <PrintButton title="Compliance Checks" subtitle="Chamberlain House — Single Central Record" targetId="sr-checks-content" />
          <SmartUploadButton variant="inline" label="Upload Check Document" uploadContext="Safer Recruitment — compliance check document or certificate upload" />
          <Button variant="outline" size="sm" className="rounded-xl text-xs" disabled title="SCR grid export is available from the Audit page.">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export Grid
          </Button>
          <div className="flex rounded-xl border border-[var(--cs-border)] overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn("px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors",
                viewMode === "grid" ? "bg-slate-900 text-white" : "bg-white text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors",
                viewMode === "list" ? "bg-slate-900 text-white" : "bg-white text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]"
              )}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
          </div>
        </div>
      }
    >
      <div id="sr-checks-content" className="space-y-0">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {[
          { label: "Total Checks", value: stats.total, color: "text-[var(--cs-text-secondary)]" },
          { label: "Verified", value: stats.verified, color: "text-emerald-600" },
          { label: "Outstanding", value: stats.outstanding, color: stats.outstanding > 0 ? "text-amber-600" : "text-emerald-600" },
          { label: "Concern Flags", value: stats.concerns, color: stats.concerns > 0 ? "text-red-600" : "text-[var(--cs-text-muted)]" },
          { label: "Overrides", value: stats.overrides, color: stats.overrides > 0 ? "text-purple-700" : "text-[var(--cs-text-muted)]" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="rounded-2xl border-[var(--cs-border-subtle)]">
            <CardContent className="py-3 px-4">
              <div className={cn("text-2xl font-bold", color)}>{value}</div>
              <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
        <Input
          placeholder="Search candidates by name or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs rounded-lg"
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(STATUS_DISPLAY).map(([key, { label, color }]) => (
          <span key={key} className={cn("text-[9px] rounded-full px-2 py-0.5 font-semibold", color)}>
            {label}
          </span>
        ))}
      </div>

      {/* GRID VIEW */}
      {viewMode === "grid" && (
        <Card className="rounded-2xl border-[var(--cs-border-subtle)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-50 border-b border-[var(--cs-border-subtle)]">
                  <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider whitespace-nowrap border-r border-[var(--cs-border-subtle)] min-w-[180px]">
                    Candidate
                  </th>
                  <th className="px-2 py-2 text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider whitespace-nowrap">Stage</th>
                  {CHECK_TYPES.map(({ id, label, icon: Icon }) => (
                    <th key={id} className="px-2 py-2 min-w-[50px]">
                      <div className="flex flex-col items-center gap-0.5">
                        <Icon className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
                        <span className="text-[8px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider leading-tight text-center max-w-[48px]">
                          {label.split(" ").map((w, i) => <span key={i} className="block">{w}</span>)}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan={CHECK_TYPES.length + 3} className="py-12 text-center text-[var(--cs-text-muted)] text-sm">
                      No candidates found
                    </td>
                  </tr>
                ) : candidates.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--cs-surface)] transition-colors">
                    <td className="sticky left-0 z-10 bg-white hover:bg-[var(--cs-surface)] px-4 py-2.5 border-r border-[var(--cs-border-subtle)]">
                      <Link href={`/recruitment/candidates/${c.id}`} className="hover:underline">
                        <div className="font-semibold text-[var(--cs-navy)] text-[11px]">{c.first_name} {c.last_name}</div>
                        <div className="text-[9px] text-[var(--cs-text-muted)] truncate max-w-[140px]">{c.role_applied}</div>
                      </Link>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className="text-[9px] bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 font-semibold whitespace-nowrap">
                        {c.stage?.replace(/_/g, " ")}
                      </span>
                    </td>
                    {CHECK_TYPES.map(({ id }) => (
                      <StatusCell
                        key={id}
                        check={checkMap[c.id]?.[id]}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-slate-50 bg-slate-50 text-[10px] text-[var(--cs-text-muted)]">
            {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} · Click any status cell to view check details
          </div>
        </Card>
      )}

      {/* LIST VIEW — by check type */}
      {viewMode === "list" && (
        <div className="space-y-3">
          {/* Check type filter */}
          <div className="flex gap-1.5 flex-wrap mb-2">
            <button
              onClick={() => setSelectedCheckType("all")}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                selectedCheckType === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200"
              )}
            >
              All Check Types
            </button>
            {CHECK_TYPES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setSelectedCheckType(id)}
                className={cn("px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                  selectedCheckType === id ? "bg-slate-900 text-white" : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {CHECK_TYPES.filter(t => selectedCheckType === "all" || t.id === selectedCheckType).map(({ id, label, icon: Icon }) => {
            const checksForType = candidates.map(c => ({
              candidate: c,
              check: checkMap[c.id]?.[id],
            }));
            const verified = checksForType.filter(x => x.check?.status === "verified").length;
            const outstanding = checksForType.filter(x => !x.check || ["not_started", "requested"].includes(x.check.status)).length;
            const concerns = checksForType.filter(x => x.check?.concern_flag).length;

            return (
              <Card key={id} className="rounded-2xl border-[var(--cs-border-subtle)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Icon className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
                      </div>
                      {label}
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-emerald-600 font-semibold">{verified} verified</span>
                      {outstanding > 0 && <span className="text-amber-600 font-semibold">{outstanding} outstanding</span>}
                      {concerns > 0 && <span className="text-red-600 font-semibold">{concerns} concern{concerns !== 1 ? "s" : ""}</span>}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="space-y-1">
                    {checksForType.map(({ candidate: c, check }) => {
                      const status = check ? (STATUS_DISPLAY[check.status] ?? STATUS_DISPLAY.not_started) : STATUS_DISPLAY.not_started;
                      return (
                        <Link key={c.id} href={`/recruitment/candidates/${c.id}`}>
                          <div className="flex items-center gap-3 py-1.5 px-2 rounded-xl hover:bg-[var(--cs-surface)] transition-colors">
                            <div className="flex-1">
                              <span className="text-xs font-medium text-[var(--cs-text-secondary)]">{c.first_name} {c.last_name}</span>
                              <span className="text-[10px] text-[var(--cs-text-muted)] ml-2">{c.role_applied}</span>
                            </div>
                            {check?.verified_at && (
                              <span className="text-[9px] text-[var(--cs-text-muted)]">Verified {new Date(check.verified_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                            )}
                            {check?.concern_flag && <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                            <span className={cn("text-[9px] rounded-full px-2 py-0.5 font-semibold shrink-0", status.color)}>
                              {status.label}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <div className="mt-4 p-3 rounded-2xl bg-blue-50 border border-blue-100 text-[11px] text-blue-700">
        <Shield className="h-3.5 w-3.5 inline mr-1.5" />
        <strong>Schedule 7 — Children&apos;s Homes Regulations 2015:</strong> All mandatory checks must be completed and verified before a candidate begins employment. Evidence of each check must be retained and available for Ofsted inspection.
      </div>
      </div>{/* close #sr-checks-content */}
      <CaraPanel
        mode="assist"
        pageContext="Single Central Record — compliance checks, DBS certificates, references, qualifications, right to work, safer recruitment standards, Ofsted inspection evidence, staff checks tracker"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
