"use client";

import React, { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileCheck, AlertTriangle, CheckCircle2, Clock, AlertCircle,
  Loader2, Info, Plus, Calendar, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useRecruitment,
  type RecruitmentCheck,
  type CandidateDetail,
} from "@/hooks/use-recruitment";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";

// ── Helpers ───────────────────────────────────────────────────────────────────

function rtwStatusLabel(status: RecruitmentCheck["status"]): string {
  const map: Record<string, string> = {
    not_started: "Not Checked",
    in_progress: "In Progress",
    received: "Needs Attention",
    verified: "Verified",
    blocked: "Blocked",
    override: "Override",
  };
  return map[status] ?? status;
}

function rtwStatusColor(status: RecruitmentCheck["status"]): string {
  switch (status) {
    case "verified": return "bg-emerald-100 text-emerald-700";
    case "in_progress": return "bg-blue-100 text-blue-700";
    case "received": return "bg-amber-100 text-amber-700";
    case "concern_flagged": return "bg-red-100 text-red-700";
    default: return "bg-slate-100 text-slate-500";
  }
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB");
}

function daysUntil(d: string | null): number | null {
  if (!d) return null;
  return Math.floor((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function expiryChipColor(days: number): string {
  if (days < 30) return "bg-red-100 text-red-700";
  if (days < 90) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

// ── Row ───────────────────────────────────────────────────────────────────────

interface RTWRowProps {
  candidate: CandidateDetail;
  rtwCheck: RecruitmentCheck | null;
}

function RTWRow({ candidate, rtwCheck }: RTWRowProps) {
  const status = rtwCheck?.status ?? "not_started";
  const expiryDays = rtwCheck?.expiry_date ? daysUntil(rtwCheck.expiry_date) : null;
  const isTimeLimited = rtwCheck?.expiry_date != null;

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-slate-900">
          {candidate.first_name} {candidate.last_name}
        </div>
        <div className="text-[10px] text-slate-400">{candidate.role_applied}</div>
      </td>
      <td className="px-4 py-3 text-xs text-slate-600">
        {rtwCheck?.document_type ?? "—"}
      </td>
      <td className="px-4 py-3 text-xs text-slate-600 font-mono">
        —
      </td>
      <td className="px-4 py-3 text-xs text-slate-600">
        {rtwCheck?.verified_by ?? "—"}
      </td>
      <td className="px-4 py-3 text-xs text-slate-600">
        {formatDate(rtwCheck?.verified_at ?? null)}
      </td>
      <td className="px-4 py-3">
        {isTimeLimited && expiryDays !== null ? (
          <Badge className={cn("text-[9px] rounded-full flex items-center gap-0.5 w-fit", expiryChipColor(expiryDays))}>
            <Calendar className="h-2.5 w-2.5" />
            {formatDate(rtwCheck!.expiry_date!)}
            {expiryDays < 90 && ` (${expiryDays}d)`}
          </Badge>
        ) : (
          <span className="text-[10px] text-slate-400">N/A</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge className={cn("text-[10px] rounded-full px-2.5 py-0.5", rtwStatusColor(status))}>
          {rtwStatusLabel(status)}
        </Badge>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RightToWorkPage() {
  const { data, isLoading, isError, error } = useRecruitment();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const { rows, stats } = useMemo(() => {
    const candidates = data?.candidates ?? [];
    const rs = candidates.map((c: CandidateDetail) => ({
      candidate: c,
      rtwCheck: c.checks.find(ch => ch.check_type === "right_to_work") ?? null,
    }));

    const st = {
      verified: rs.filter(r => r.rtwCheck?.status === "verified").length,
      pending: rs.filter(r => !r.rtwCheck || r.rtwCheck.status === "in_progress").length,
      time_limited: rs.filter(r => r.rtwCheck?.expiry_date != null).length,
      not_checked: rs.filter(r => !r.rtwCheck || r.rtwCheck.status === "not_started").length,
    };

    return { rows: rs, stats: st };
  }, [data]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(({ candidate, rtwCheck }) => {
      const hay = [candidate.first_name, candidate.last_name, candidate.role_applied, rtwCheck?.document_type || "", rtwCheck?.verified_by || "", rtwStatusLabel(rtwCheck?.status ?? "not_started")].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  return (
    <PageShell
      title="Right to Work"
      subtitle="Verify before first day of employment — legal requirement"
      ariaContext={{ pageTitle: "Oak House — RTW Verification", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Right to Work" subtitle="Oak House — RTW Verification" targetId="rtw-content" />
          <SmartUploadButton variant="inline" label="Upload RTW Evidence" uploadContext="Safer Recruitment — right to work evidence document upload" />
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Verification
          </Button>
        </div>
      }
    >
      <div id="rtw-content" className="space-y-0">
      {/* Critical compliance notice */}
      <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex gap-3 mb-6">
        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-red-800 mb-0.5">Legal Requirement</div>
          <div className="text-sm text-red-700">
            Right to Work checks <strong>MUST</strong> be completed before the candidate&apos;s first day.
            Failure to do so may result in a civil penalty of up to <strong>£60,000 per illegal worker</strong>.
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.verified}</div>
            <div className="text-xs text-slate-500 mt-0.5">Verified</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <div className="text-xs text-slate-500 mt-0.5">Pending</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-amber-600">{stats.time_limited}</div>
            <div className="text-xs text-slate-500 mt-0.5">Time-Limited (expiry tracking)</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-4">
            <div className={cn("text-2xl font-bold", stats.not_checked > 0 ? "text-red-600" : "text-slate-500")}>
              {stats.not_checked}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Not Checked</div>
          </CardContent>
        </Card>
      </div>

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3 text-red-600 mb-5">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{(error as Error)?.message || "Failed to load data"}</p>
        </div>
      )}

      {/* Info about time-limited RTW */}
      {stats.time_limited > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 flex gap-2 mb-5">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            {stats.time_limited} candidate(s) have time-limited right to work (e.g. visa). Follow-up checks required before expiry.
            Amber = expiring within 90 days. Red = expiring within 30 days.
          </div>
        </div>
      )}

      {/* Search */}
      {!isLoading && rows.length > 0 && (
        <div className="flex items-center gap-3 mb-5">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search candidates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          {search.trim() && (
            <span className="text-xs text-slate-400">{filteredRows.length} of {rows.length} candidates</span>
          )}
        </div>
      )}

      {/* Table */}
      <Card className="rounded-2xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span className="text-sm">Loading right to work data...</span>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileCheck className="h-10 w-10 mx-auto mb-3 text-slate-200" />
              <div className="text-sm">{search.trim() ? "No candidates match your search" : "No candidates to display"}</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Candidate</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Document Type</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Document Ref</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Verified By</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Verified Date</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Expiry</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map(({ candidate, rtwCheck }) => (
                    <RTWRow key={candidate.id} candidate={candidate} rtwCheck={rtwCheck} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add verification modal (simple inline) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="text-sm font-semibold text-slate-900 mb-4">Add Right to Work Verification</div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Candidate</label>
                <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                  <option value="">Select candidate...</option>
                  {(data?.candidates ?? []).map((c: CandidateDetail) => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Document Type</label>
                <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                  <option>UK Passport</option>
                  <option>EU Settled Status</option>
                  <option>BRP Card</option>
                  <option>Birth Certificate + NI Evidence</option>
                  <option>Visa / Leave to Remain</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Verified By</label>
                <input type="text" placeholder="Name of person who verified" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Verification Date</label>
                <input type="date" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Expiry Date (if time-limited)</label>
                <input type="date" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button size="sm" className="flex-1" onClick={() => setShowModal(false)}>Save Verification</Button>
              <Button size="sm" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
      </div>{/* close #rtw-content */}
    </PageShell>
  );
}
