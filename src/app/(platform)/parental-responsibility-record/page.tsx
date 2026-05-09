"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  KeyRound,
  Gavel,
  Heart,
  AlertCircle,
  CheckCircle,
  Users,
  FileText,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParentalResponsibilityRecords } from "@/hooks/use-parental-responsibility-records";
import type {
  ParentalResponsibilityRecord,
  PrPartyType,
  PrAcquiredMethod,
  PrDelegatedTo,
  PrLegalStatus,
} from "@/types/extended";
import {
  PR_PARTY_TYPE_LABEL,
  PR_ACQUIRED_METHOD_LABEL,
  PR_DELEGATED_TO_LABEL,
  PR_LEGAL_STATUS_LABEL,
} from "@/types/extended";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const STATUS_COLOUR: Record<PrLegalStatus, string> = {
  section_20_voluntary: "bg-yellow-100 text-yellow-800",
  section_31_care_order: "bg-blue-100 text-blue-800",
  section_38_interim_care_order: "bg-orange-100 text-orange-800",
  section_17_child_in_need: "bg-green-100 text-green-800",
  police_protection_s46: "bg-red-100 text-red-800",
  emergency_protection_order: "bg-red-100 text-red-800",
  special_guardianship: "bg-purple-100 text-purple-800",
};

const DELEGATED_COLOUR: Record<PrDelegatedTo, string> = {
  home: "bg-green-100 text-green-800",
  social_worker: "bg-blue-100 text-blue-800",
  parent_specific: "bg-blue-100 text-blue-800",
  joint: "bg-blue-100 text-blue-800",
  la_director: "bg-amber-100 text-amber-800",
};

const exportCols: ExportColumn<ParentalResponsibilityRecord>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Legal Status", accessor: (r) => PR_LEGAL_STATUS_LABEL[r.legal_status] },
  { header: "Legal Status Since", accessor: (r) => r.legal_status_date },
  { header: "PR Holders", accessor: (r) => r.pr_holders.filter((p) => p.current).length.toString() },
  { header: "Court Orders Active", accessor: (r) => r.court_orders_in_place.length.toString() },
  { header: "Last Reviewed", accessor: (r) => r.reviewed_date },
  { header: "LA Sign-Off", accessor: (r) => r.signed_off_by_la ? "Yes" : "No" },
];

export default function ParentalResponsibilityRecordPage() {
  const { data: res, isLoading } = useParentalResponsibilityRecords();
  const data = res?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((r) => r.child_id === filterYP);
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.child_id.localeCompare(b.child_id);
        case "review":
          return a.reviewed_date.localeCompare(b.reviewed_date);
        default:
          return 0;
      }
    });
    return items;
  }, [data, filterYP, sortBy]);

  const today = new Date().toISOString().slice(0, 10);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const total = data.length;
  const allSignedOff = data.every((r) => r.signed_off_by_la);
  const totalCourtOrders = data.reduce((sum, r) => sum + r.court_orders_in_place.length, 0);
  const dueReview = data.filter((r) => r.reviewed_date <= ninetyDaysAgo).length;

  const ypIds = [...new Set(data.map((r) => r.child_id))];

  return (
    <PageShell
      title="Parental Responsibility Record"
      subtitle="Per-child legal status, PR holders, delegated authorities, and consent matrix"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="parental-responsibility-records" />
          <PrintButton title="Parental Responsibility Records" />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Active Records</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allSignedOff ? "100%" : `${data.filter((r) => r.signed_off_by_la).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">LA Signed Off</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalCourtOrders}</p>
          <p className="text-xs text-muted-foreground">Active Court Orders</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", dueReview > 0 ? "text-amber-600" : "text-green-600")}>{dueReview}</p>
          <p className="text-xs text-muted-foreground">Reviews Overdue</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <KeyRound className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          Parental Responsibility (PR) determines who can make decisions about a child. For looked-after
          children, PR is shared between parent(s) and Local Authority. The home holds delegated day-to-day
          authority. Knowing exactly who consents to what — and consulting the right parties — is fundamental
          to lawful, child-centred practice.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {ypIds.map((id) => (
              <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="review">Earliest Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;

          return (
            <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Gavel className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(r.child_id)} &middot; {PR_LEGAL_STATUS_LABEL[r.legal_status]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Status since {r.legal_status_date} &middot; {r.pr_holders.filter((p) => p.current).length} PR holders &middot; Reviewed {r.reviewed_date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {r.signed_off_by_la && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* PR Holders */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Users className="h-3 w-3 inline mr-1" />Who Holds Parental Responsibility
                    </p>
                    <div className="space-y-2">
                      {r.pr_holders.map((p, i) => (
                        <div key={i} className={cn("rounded-lg p-3 border", p.current ? "bg-white" : "bg-slate-100 opacity-75")}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">{p.party}</p>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                              p.current ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"
                            )}>
                              {p.current ? "Current" : "Ended"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{PR_PARTY_TYPE_LABEL[p.party_type]} &middot; Acquired {PR_ACQUIRED_METHOD_LABEL[p.acquired]} on {p.acquired_date}</p>
                          {!p.current && p.ended_date && <p className="text-xs text-muted-foreground">Ended {p.ended_date}: {p.ended_reason}</p>}
                          <p className="text-xs mt-1">{p.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Court Orders */}
                  {r.court_orders_in_place.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-2">
                        <Gavel className="h-3 w-3 inline mr-1" />Court Orders in Place
                      </p>
                      <div className="space-y-1">
                        {r.court_orders_in_place.map((c, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                            <p className="font-medium">{c.order}</p>
                            <p className="text-xs text-muted-foreground">Issued {c.date_issued} &middot; Expiry: {c.expiry}</p>
                            <p className="text-xs">{c.terms}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Delegated Authority */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Delegated Authorities</p>
                    <div className="space-y-1">
                      {r.delegated_authorities.map((da, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{da.category}</span>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                              DELEGATED_COLOUR[da.delegated_to]
                            )}>
                              {PR_DELEGATED_TO_LABEL[da.delegated_to]}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{da.rationale}</p>
                          {da.exceptions.length > 0 && (
                            <ul className="mt-1 space-y-0.5">
                              {da.exceptions.map((e, ei) => (
                                <li key={ei} className="text-xs text-amber-700 flex items-start gap-1">
                                  <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                  <span>{e}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Consent Matrix */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Consent Matrix (Common Decisions)</p>
                    <div className="space-y-1">
                      {r.consent_matrix.map((c, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-center justify-between">
                          <div>
                            <p className="font-medium">{c.activity}</p>
                            <p className="text-xs text-muted-foreground">{c.who_consents}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">Last: {c.last_used}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Identity Documents */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <FileText className="h-3 w-3 inline mr-1" />Identity Documents
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {r.identity_documents.map((doc, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-center justify-between">
                          <span>{doc.document}</span>
                          <span className={cn("text-xs",
                            doc.held ? "text-green-600" : "text-amber-600"
                          )}>
                            {doc.held ? `Held (${doc.location})` : `Not held — ${doc.location}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child Awareness</p>
                    <p className="text-sm">{r.child_awareness_of_status}</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">PR Complexity Notes</p>
                    <p className="text-sm">{r.parental_responsibility_complex_notes}</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                      <Heart className="h-3 w-3 inline mr-1" />Contact Arrangements
                    </p>
                    <p className="text-sm">{r.contact_arrangements}</p>
                  </div>

                  {r.prohibited_steps.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">
                        <AlertCircle className="h-3 w-3 inline mr-1" />Prohibited Steps
                      </p>
                      <ul className="space-y-1">
                        {r.prohibited_steps.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-red-600 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Reviewed: {r.reviewed_date} by {getStaffName(r.reviewed_by)}</span>
                    {r.signed_off_by_la && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">LA Signed Off</span>}
                    <span>{r.routinely_consulted_parties.length} parties routinely consulted</span>
                  </div>

                  <SmartLinkPanel sourceType="parental_responsibility_record" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Parental Responsibility records support Children Act 1989,
          Care Planning Regulations 2010, Quality Standard 4 (the child&apos;s plan), and Quality Standard 13.
          Reviewed at every LAC review, when legal status changes, or when delegated authorities are
          revisited. Linked to Delegated Authority page, Court Orders, and Consent Records.
        </p>
      </div>
      </>
      )}
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
