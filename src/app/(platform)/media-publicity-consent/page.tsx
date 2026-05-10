"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown, ChevronUp, ArrowUpDown, Camera, Lock,
  CheckCircle, XCircle, AlertCircle, Clock, Heart, Loader2,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useMediaPublicityConsents } from "@/hooks/use-media-publicity-consents";
import type { MediaPublicityConsent, MediaConsentCategory, ChildConsentResponse } from "@/types/extended";
import { MEDIA_CONSENT_CATEGORY_LABEL, CHILD_CONSENT_RESPONSE_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const consentColour: Record<ChildConsentResponse, string> = {
  yes_explicit: "bg-green-100 text-green-800",
  yes_assenting: "bg-blue-100 text-blue-800",
  conditional: "bg-amber-100 text-amber-800",
  declined: "bg-red-100 text-red-800",
  unsure_withdrawn: "bg-purple-100 text-purple-800",
  not_asked_inappropriate: "bg-slate-100 text-slate-800",
};

export default function MediaPublicityConsentPage() {
  const { data: res, isLoading } = useMediaPublicityConsents();
  const data: MediaPublicityConsent[] = res?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterConsent, setFilterConsent] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((r) => r.child_id === filterYP);
    if (filterCategory !== "all") items = items.filter((r) => r.category === filterCategory);
    if (filterConsent !== "all") items = items.filter((r) => r.child_gave_consent === filterConsent);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.consent_requested_date.localeCompare(a.consent_requested_date);
        case "name": return a.child_id.localeCompare(b.child_id);
        default: return 0;
      }
    });
    return items;
  }, [data, filterYP, filterCategory, filterConsent, sortBy]);

  const total = data.length;
  const declinedCount = data.filter((r) => r.child_gave_consent === "declined").length;
  const explicitConsent = data.filter((r) => r.child_gave_consent === "yes_explicit").length;
  const anonymised = data.filter((r) => !r.child_identifiable).length;

  const exportCols: ExportColumn<MediaPublicityConsent>[] = [
    { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
    { header: "Date", accessor: (r) => r.consent_requested_date },
    { header: "Purpose", accessor: (r) => r.purpose },
    { header: "Category", accessor: (r) => MEDIA_CONSENT_CATEGORY_LABEL[r.category] },
    { header: "Child Consent", accessor: (r) => CHILD_CONSENT_RESPONSE_LABEL[r.child_gave_consent] },
    { header: "PR Consent", accessor: (r) => r.parental_responsibility_consent ? "Yes" : "No" },
    { header: "LA Consent", accessor: (r) => r.la_consent ? "Yes" : "No" },
    { header: "Identifiable", accessor: (r) => r.child_identifiable ? "Yes" : "No (anonymised)" },
  ];

  if (isLoading) return <PageShell title="Media & Publicity Consent" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Media & Publicity Consent"
      subtitle="Records of consent for photographs, media use, and any external publication involving children"
      ariaContext={{ pageTitle: "Media & Publicity Consent", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="media-publicity-consent" />
          <PrintButton title="Media & Publicity Consent" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Consent Records</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-green-600">{explicitConsent}</p><p className="text-xs text-muted-foreground">Explicit Consent</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-red-600">{declinedCount}</p><p className="text-xs text-muted-foreground">Declined (Respected)</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-blue-600">{anonymised}/{total}</p><p className="text-xs text-muted-foreground">Anonymised</p></div>
      </div>

      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Lock className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800">
          Children control their image. Every use of a photo, quote, artwork, or story requires explicit
          consent — from the child (where competent), parental responsibility holders, and the LA. Children
          can decline, set conditions, or withdraw. &ldquo;Looked-after&rdquo; status is never used as a story.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(Object.keys(MEDIA_CONSENT_CATEGORY_LABEL) as MediaConsentCategory[]).map((k) => (
              <SelectItem key={k} value={k}>{MEDIA_CONSENT_CATEGORY_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterConsent} onValueChange={setFilterConsent}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Consent" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Consent States</SelectItem>
            {(Object.keys(CHILD_CONSENT_RESPONSE_LABEL) as ChildConsentResponse[]).map((k) => (
              <SelectItem key={k} value={k}>{CHILD_CONSENT_RESPONSE_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="name">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;
          const isDeclined = r.child_gave_consent === "declined";

          return (
            <div key={r.id} className={cn("rounded-xl border bg-white overflow-hidden", isDeclined && "border-l-4 border-l-red-500")}>
              <button className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Camera className="h-5 w-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(r.child_id)} &middot; {r.purpose.slice(0, 70)}{r.purpose.length > 70 ? "..." : ""}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.consent_requested_date} &middot; {MEDIA_CONSENT_CATEGORY_LABEL[r.category]} &middot; {r.who_is_requesting}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", consentColour[r.child_gave_consent])}>
                    {CHILD_CONSENT_RESPONSE_LABEL[r.child_gave_consent]}
                  </span>
                  {!r.child_identifiable && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                      <Lock className="h-3 w-3 inline mr-1" />Anonymised
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Full Purpose</p>
                    <p className="text-sm">{r.purpose}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className={cn("rounded-lg p-2 border text-center text-sm",
                      r.child_gave_consent === "yes_explicit" || r.child_gave_consent === "yes_assenting" || r.child_gave_consent === "conditional" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                    )}>
                      {r.child_gave_consent === "yes_explicit" || r.child_gave_consent === "yes_assenting" || r.child_gave_consent === "conditional" ? <CheckCircle className="h-3 w-3 inline mr-1" /> : <XCircle className="h-3 w-3 inline mr-1" />}
                      Child: {CHILD_CONSENT_RESPONSE_LABEL[r.child_gave_consent]}
                    </div>
                    <div className={cn("rounded-lg p-2 border text-center text-sm", r.parental_responsibility_consent ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
                      {r.parental_responsibility_consent ? <CheckCircle className="h-3 w-3 inline mr-1" /> : <XCircle className="h-3 w-3 inline mr-1" />}
                      PR: {r.parental_responsibility_consent ? "Yes" : "No"}
                    </div>
                    <div className={cn("rounded-lg p-2 border text-center text-sm", r.la_consent ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
                      {r.la_consent ? <CheckCircle className="h-3 w-3 inline mr-1" /> : <XCircle className="h-3 w-3 inline mr-1" />}
                      LA: {r.la_consent ? "Yes" : "No"}
                    </div>
                  </div>

                  {r.conditions_agreed.length > 0 && r.child_gave_consent !== "declined" && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Conditions Agreed</p>
                      <ul className="space-y-1">
                        {r.conditions_agreed.map((c: string, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Anonymisation</p>
                      <p className="text-sm">{r.anonymisation_applied}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">
                        <Heart className="h-3 w-3 inline mr-1" />Withdrawal Process
                      </p>
                      <p className="text-sm">{r.withdrawal_process}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-2 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Storage</p>
                      <p>{r.storage_location}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Retention</p>
                      <p>{r.retention_period}</p>
                    </div>
                  </div>

                  {r.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{r.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Clock className="h-3 w-3 inline mr-1" />Expiry: {r.expiry_of_consent}</span>
                    <span>Recorded: {getStaffName(r.recorded_by)}</span>
                    <span>Age at request: {r.age_at_request}</span>
                    {r.child_can_withdraw_consent && <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">Withdrawable</span>}
                  </div>

                  {isDeclined && (
                    <div className="bg-red-50 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-sm">Child declined. No use of image/quote/artwork. Decision fully respected.</p>
                    </div>
                  )}

                  <SmartLinkPanel sourceType="media-publicity-consent" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Media and publicity consent records support UK GDPR/Data
          Protection Act 2018 (lawful basis: consent), Quality Standard 1 (child-centred care), Quality
          Standard 5 (protection), and UNCRC Article 16 (privacy). Triple consent (child, PR, LA) required
          for any external use. Linked to Photo Consent, Personal Belongings, and Children&apos;s Pledges.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Media & Publicity Consent — photography consent, social media restrictions, TV/newspaper consent, anonymisation, GDPR, LAC identity protection, information sharing"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
