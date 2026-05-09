"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award, AlertTriangle, CheckCircle2, Clock, AlertCircle, Loader2,
  ShieldAlert, User, Calendar, FileCheck, ChevronRight, X, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useRecruitment,
  type Offer,
  type CandidateDetail,
} from "@/hooks/use-recruitment";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB");
}

function offerStatusLabel(status: Offer["status"]): string {
  const map: Record<Offer["status"], string> = {
    not_made: "Not Made",
    conditional: "Conditional Sent",
    unconditional: "Unconditional",
    accepted: "Accepted",
    declined: "Declined",
    withdrawn: "Withdrawn",
  };
  return map[status] ?? status;
}

function offerStatusColor(status: Offer["status"]): string {
  switch (status) {
    case "accepted": return "bg-emerald-100 text-emerald-700";
    case "conditional": return "bg-blue-100 text-blue-700";
    case "unconditional": return "bg-teal-100 text-teal-700";
    case "declined": return "bg-red-100 text-red-700";
    case "withdrawn": return "bg-slate-200 text-slate-600";
    default: return "bg-slate-100 text-slate-500";
  }
}

function stageLabel(stage: string): string {
  return stage.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ── Final clearance checklist items ──────────────────────────────────────────

const CLEARANCE_ITEMS = [
  { key: "dbs", label: "Enhanced DBS received and reviewed by authorised person" },
  { key: "rtw", label: "Right to work verified" },
  { key: "refs", label: "2 satisfactory references received (incl. most recent employer)" },
  { key: "barred", label: "Barred list check completed" },
  { key: "identity", label: "Identity verified" },
  { key: "medical", label: "Medical fitness confirmed" },
  { key: "gaps", label: "All employment gaps explained and accepted" },
  { key: "safeguarding", label: "Safeguarding declaration signed" },
];

// ── Offer Row ─────────────────────────────────────────────────────────────────

interface OfferRowProps {
  candidate: CandidateDetail;
  offer: Offer;
  onSelect: () => void;
  isSelected: boolean;
}

function OfferRow({ candidate, offer, onSelect, isSelected }: OfferRowProps) {
  return (
    <tr
      className={cn(
        "border-b border-slate-100 last:border-0 cursor-pointer transition-colors",
        isSelected ? "bg-blue-50" : "hover:bg-slate-50"
      )}
      onClick={onSelect}
    >
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-slate-900">{candidate.first_name} {candidate.last_name}</div>
        <div className="text-[10px] text-slate-400">{candidate.role_applied}</div>
      </td>
      <td className="px-4 py-3">
        <Badge className="text-[9px] rounded-full bg-slate-100 text-slate-600">{stageLabel(candidate.stage)}</Badge>
      </td>
      <td className="px-4 py-3 text-xs text-slate-600">{formatDate(offer.offer_date)}</td>
      <td className="px-4 py-3 text-xs text-slate-600">{formatDate(offer.proposed_start_date)}</td>
      <td className="px-4 py-3">
        <Badge className={cn("text-[10px] rounded-full px-2.5 py-0.5", offerStatusColor(offer.status))}>
          {offerStatusLabel(offer.status)}
        </Badge>
      </td>
      <td className="px-4 py-3">
        {offer.exceptional_start ? (
          <Badge className="text-[9px] rounded-full bg-amber-100 text-amber-700 flex items-center gap-0.5 w-fit">
            <ShieldAlert className="h-2.5 w-2.5" />Exceptional Start
          </Badge>
        ) : (
          <span className="text-[10px] text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {offer.final_clearance_given ? (
          <Badge className="text-[9px] rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-0.5 w-fit">
            <CheckCircle2 className="h-2.5 w-2.5" />Cleared
          </Badge>
        ) : (
          <Badge className="text-[9px] rounded-full bg-slate-100 text-slate-500">Pending</Badge>
        )}
      </td>
      <td className="px-4 py-3">
        <ChevronRight className={cn("h-4 w-4 transition-colors", isSelected ? "text-blue-500" : "text-slate-300")} />
      </td>
    </tr>
  );
}

// ── Side Panel: Final Clearance Checklist ─────────────────────────────────────

interface ClearancePanelProps {
  candidate: CandidateDetail;
  offer: Offer;
  onClose: () => void;
}

function ClearancePanel({ candidate, offer, onClose }: ClearancePanelProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(CLEARANCE_ITEMS.map(i => [i.key, false]))
  );
  const [localCleared, setLocalCleared] = useState(offer.final_clearance_given);

  const allChecked = Object.values(checked).every(Boolean);

  function handleGrantClearance() {
    setLocalCleared(true);
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white border-l border-slate-200 shadow-xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div>
          <div className="text-sm font-semibold text-slate-900">Final Clearance</div>
          <div className="text-xs text-slate-500">{candidate.first_name} {candidate.last_name}</div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
          Clearance Checklist
        </div>
        {CLEARANCE_ITEMS.map(item => (
          <label
            key={item.key}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors",
              checked[item.key] ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
            )}
          >
            <input
              type="checkbox"
              checked={checked[item.key]}
              onChange={e => setChecked(prev => ({ ...prev, [item.key]: e.target.checked }))}
              className="mt-0.5 accent-emerald-600"
            />
            <span className="text-xs text-slate-700">{item.label}</span>
          </label>
        ))}

        {offer.exceptional_start && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
            <div className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" />Exceptional Start Active
            </div>
            <div className="text-xs text-amber-700">
              {offer.exceptional_start_risk_mitigation
                ? <><span className="font-medium">Mitigation: </span>{offer.exceptional_start_risk_mitigation}</>
                : <span className="text-red-600 font-medium">Risk mitigation plan NOT documented — required before start</span>}
            </div>
          </div>
        )}

        <div className="pt-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Offer Details</div>
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between"><span>Offer Date</span><span className="font-medium">{formatDate(offer.offer_date)}</span></div>
            <div className="flex justify-between"><span>Proposed Start</span><span className="font-medium">{formatDate(offer.proposed_start_date)}</span></div>
            <div className="flex justify-between"><span>Status</span>
              <Badge className={cn("text-[9px] rounded-full", offerStatusColor(offer.status))}>{offerStatusLabel(offer.status)}</Badge>
            </div>
            {offer.salary && (
              <div className="flex justify-between"><span>Salary</span><span className="font-medium">£{offer.salary.toLocaleString()}</span></div>
            )}
            {offer.hours_per_week && (
              <div className="flex justify-between"><span>Hours/week</span><span className="font-medium">{offer.hours_per_week}h</span></div>
            )}
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-slate-100 space-y-2">
        {localCleared && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800 font-medium flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" />Final clearance granted successfully.
          </div>
        )}
        <Button
          size="sm"
          disabled={!allChecked || localCleared}
          onClick={handleGrantClearance}
          className={cn("w-full", allChecked && !localCleared ? "bg-emerald-600 hover:bg-emerald-700" : "opacity-60")}
        >
          {localCleared
            ? "Final Clearance Given"
            : allChecked
              ? "Grant Final Clearance"
              : `Complete checklist (${Object.values(checked).filter(Boolean).length}/${CLEARANCE_ITEMS.length})`}
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface CandidateWithOffer {
  candidate: CandidateDetail;
  offer: Offer;
}

export default function OffersPage() {
  const { data, isLoading, isError, error } = useRecruitment();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const candidatesWithOffers = useMemo<CandidateWithOffer[]>(() => {
    if (!data?.candidates) return [];
    let list = (data.candidates as CandidateDetail[])
      .filter(c => c.offer !== null)
      .map(c => ({ candidate: c, offer: c.offer! }));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(({ candidate: c }) =>
        `${c.first_name} ${c.last_name} ${c.role_applied} ${c.stage}`.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, search]);

  const stats = useMemo(() => ({
    conditional: candidatesWithOffers.filter(r => r.offer.status === "conditional").length,
    final_clearance: candidatesWithOffers.filter(r => r.offer.final_clearance_given).length,
    exceptional: candidatesWithOffers.filter(r => r.offer.exceptional_start).length,
    started: (data?.candidates ?? []).filter((c: CandidateDetail) => c.stage === "appointed").length,
  }), [candidatesWithOffers, data]);

  const exceptionalStarts = candidatesWithOffers.filter(r => r.offer.exceptional_start);

  const selectedEntry = selectedId
    ? candidatesWithOffers.find(r => r.candidate.id === selectedId) ?? null
    : null;

  return (
    <PageShell
      title="Offers & Final Clearance"
      subtitle="Conditional offers, outstanding conditions, and final pre-start clearance"
      ariaContext={{ pageTitle: "Oak House — Pre-Start Clearance", sourceType: "child_record" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Offers & Final Clearance" subtitle="Oak House — Pre-Start Clearance" targetId="offers-content" />
          <SmartUploadButton variant="inline" label="Upload Offer Letter" uploadContext="Safer Recruitment — offer letter or clearance document upload" />
        </div>
      }
    >
      <div id="offers-content" className="space-y-0">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-blue-600">{stats.conditional}</div>
            <div className="text-xs text-slate-500 mt-0.5">Conditional Sent</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.final_clearance}</div>
            <div className="text-xs text-slate-500 mt-0.5">Final Clearance</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-4">
            <div className={cn("text-2xl font-bold", stats.exceptional > 0 ? "text-amber-600" : "text-slate-500")}>
              {stats.exceptional}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Exceptional Starts</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-slate-900">{stats.started}</div>
            <div className="text-xs text-slate-500 mt-0.5">Appointed / Started</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <Input
          placeholder="Search candidates by name or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs rounded-lg"
        />
      </div>

      {/* Exceptional starts alert banner */}
      {exceptionalStarts.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 mb-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-amber-800 mb-2">
                {exceptionalStarts.length} Exceptional Start{exceptionalStarts.length > 1 ? "s" : ""} Active
              </div>
              <div className="space-y-2">
                {exceptionalStarts.map(({ candidate, offer }) => (
                  <div key={candidate.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <span className="text-xs font-medium text-amber-800">
                        {candidate.first_name} {candidate.last_name}
                      </span>
                      {" "}
                      <span className="text-xs text-amber-700">
                        — Start: {formatDate(offer.proposed_start_date)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={cn(
                        "text-[9px] rounded-full",
                        offer.exceptional_start_risk_mitigation
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      )}>
                        {offer.exceptional_start_risk_mitigation ? "Mitigation documented" : "Mitigation MISSING"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3 text-red-600 mb-5">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{(error as Error)?.message || "Failed to load data"}</p>
        </div>
      )}

      {/* Table */}
      <Card className="rounded-2xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span className="text-sm">Loading offers...</span>
            </div>
          ) : candidatesWithOffers.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Award className="h-10 w-10 mx-auto mb-3 text-slate-200" />
              <div className="text-sm">No offers made yet</div>
              <div className="text-xs mt-1 text-slate-400">Offers are created from the candidate profile</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Candidate</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Stage</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Offer Sent</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Proposed Start</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Exceptional Start</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Final Clearance</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {candidatesWithOffers.map(({ candidate, offer }) => (
                    <OfferRow
                      key={candidate.id}
                      candidate={candidate}
                      offer={offer}
                      isSelected={selectedId === candidate.id}
                      onSelect={() => setSelectedId(prev => prev === candidate.id ? null : candidate.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Side panel */}
      {selectedEntry && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setSelectedId(null)} />
          <ClearancePanel
            candidate={selectedEntry.candidate}
            offer={selectedEntry.offer}
            onClose={() => setSelectedId(null)}
          />
        </>
      )}
      </div>{/* close #offers-content */}
    </PageShell>
  );
}
