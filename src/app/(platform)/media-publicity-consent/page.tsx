"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Camera,
  Lock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Heart,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConsentRecord {
  id: string;
  youngPerson: string;
  consentRequestedDate: string;
  purpose: string;
  category: "Internal Life Story Book" | "Internal display only" | "School photo / yearbook" | "Local newspaper" | "Cornerstone newsletter (anonymised)" | "Social media (sector-facing)" | "Inspection/Reg 44 evidence" | "Court/legal" | "Personal request (e.g. sibling)";
  whoIsRequesting: string;
  ageAtRequest: number;
  childCanGiveConsent: boolean;
  childGaveConsent: "Yes - explicit" | "Yes - assenting" | "Declined" | "Unsure - withdrawn" | "Conditional" | "Not asked - inappropriate";
  parentalResponsibilityConsent: boolean;
  laConsent: boolean;
  conditionsAgreed: string[];
  expiryOfConsent: string;
  childCanWithdrawConsent: boolean;
  withdrawalProcess: string;
  childIdentifiable: boolean;
  anonymisationApplied: string;
  storageLocation: string;
  retentionPeriod: string;
  recordedBy: string;
  notes: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: ConsentRecord[] = [
  {
    id: "mc-001",
    youngPerson: "yp_alex",
    consentRequestedDate: "2024-09-01",
    purpose: "Photographs of Alex at boxing club selected for inter-club competition for Life Story book",
    category: "Internal Life Story Book",
    whoIsRequesting: "Anna (key worker) on Alex's behalf",
    ageAtRequest: 13,
    childCanGiveConsent: true,
    childGaveConsent: "Yes - explicit",
    parentalResponsibilityConsent: true,
    laConsent: true,
    conditionsAgreed: [
      "Personal Life Story book only",
      "Not to be shared on social media",
      "Alex chooses which photos go in",
    ],
    expiryOfConsent: "Permanent — Alex's own document",
    childCanWithdrawConsent: true,
    withdrawalProcess: "Alex can remove any photo from his Life Story book at any time, no questions",
    childIdentifiable: true,
    anonymisationApplied: "Not required — internal personal document",
    storageLocation: "Alex's Life Story book + cloud copy",
    retentionPeriod: "Lifetime — Alex's choice",
    recordedBy: "staff_anna",
    notes: "Standard consent for Life Story work. Alex actively chose photos. Highly meaningful to him.",
  },
  {
    id: "mc-002",
    youngPerson: "yp_jordan",
    consentRequestedDate: "2024-11-15",
    purpose: "Local newspaper coverage of football team winning regional cup — Jordan as captain",
    category: "Local newspaper",
    whoIsRequesting: "Riverside Gazette via football club",
    ageAtRequest: 12,
    childCanGiveConsent: true,
    childGaveConsent: "Yes - explicit",
    parentalResponsibilityConsent: true,
    laConsent: true,
    conditionsAgreed: [
      "Photo only as part of full team — not solo",
      "First name only (no surname)",
      "No mention of Jordan being looked-after",
      "Jordan to receive copy of newspaper",
    ],
    expiryOfConsent: "Single use — already published",
    childCanWithdrawConsent: false,
    withdrawalProcess: "Once printed, withdrawal not possible. Online version can be requested removed.",
    childIdentifiable: true,
    anonymisationApplied: "First name only — surname withheld",
    storageLocation: "Office file (newspaper cutting) + cloud scan",
    retentionPeriod: "Newspaper cutting kept; online removable on request",
    recordedBy: "staff_chervelle",
    notes: "Carefully handled. Jordan proud of moment. LA legal team consulted before agreeing terms.",
  },
  {
    id: "mc-003",
    youngPerson: "yp_casey",
    consentRequestedDate: "2025-01-20",
    purpose: "Casey's artwork 'Finding Home' selected for Reach Out Arts community exhibition — public",
    category: "Internal display only",
    whoIsRequesting: "Sarah (art group leader) and Casey",
    ageAtRequest: 12,
    childCanGiveConsent: true,
    childGaveConsent: "Yes - explicit",
    parentalResponsibilityConsent: true,
    laConsent: true,
    conditionsAgreed: [
      "Casey's artwork only — Casey not photographed at exhibition",
      "First name only on artwork label",
      "No biographical information with the piece",
      "Casey decides whether to attend opening",
    ],
    expiryOfConsent: "Exhibition period (3 months) — then artwork returns to Casey",
    childCanWithdrawConsent: true,
    withdrawalProcess: "Artwork can be removed any time on Casey's request",
    childIdentifiable: false,
    anonymisationApplied: "First name only on label; no photo of Casey",
    storageLocation: "Photo of artwork + label kept; original returned post-exhibition",
    retentionPeriod: "Photo retained in Life Story book; original is Casey's",
    recordedBy: "staff_anna",
    notes: "Carefully managed. Casey thrilled but anxious about attention. Conditions ensure artistic identity affirmed without personal exposure.",
  },
  {
    id: "mc-004",
    youngPerson: "yp_alex",
    consentRequestedDate: "2025-03-05",
    purpose: "Photo of Alex at home (not identifiable) for Cornerstone newsletter article on therapy outcomes",
    category: "Cornerstone newsletter (anonymised)",
    whoIsRequesting: "Cornerstone Care Group communications team",
    ageAtRequest: 13,
    childCanGiveConsent: true,
    childGaveConsent: "Declined",
    parentalResponsibilityConsent: false,
    laConsent: false,
    conditionsAgreed: [
      "N/A — declined",
    ],
    expiryOfConsent: "N/A",
    childCanWithdrawConsent: true,
    withdrawalProcess: "Already declined; no photo used",
    childIdentifiable: false,
    anonymisationApplied: "N/A — no use",
    storageLocation: "N/A",
    retentionPeriod: "N/A",
    recordedBy: "staff_darren",
    notes: "Alex declined — said 'I don't want my picture used for adverts even anonymous'. Choice fully respected. Alternative stock photo used in newsletter.",
  },
  {
    id: "mc-005",
    youngPerson: "yp_jordan",
    consentRequestedDate: "2024-10-12",
    purpose: "Anonymised quote from Jordan in Reg 44 visitor's report (quoted by Helen Frost)",
    category: "Inspection/Reg 44 evidence",
    whoIsRequesting: "Helen Frost (Reg 44 visitor)",
    ageAtRequest: 12,
    childCanGiveConsent: true,
    childGaveConsent: "Yes - explicit",
    parentalResponsibilityConsent: true,
    laConsent: true,
    conditionsAgreed: [
      "Quote anonymised ('a young person at the home')",
      "No identifying details",
      "Jordan reviewed and approved final wording",
    ],
    expiryOfConsent: "Single use",
    childCanWithdrawConsent: false,
    withdrawalProcess: "Once submitted to LA, document is regulatory record",
    childIdentifiable: false,
    anonymisationApplied: "Quote attributed to 'a young person'",
    storageLocation: "Reg 44 report — LA + Ofsted accessible",
    retentionPeriod: "Per Reg 44 retention requirements",
    recordedBy: "staff_darren",
    notes: "Jordan empowered by being asked. Review of final wording was important to him. Featured powerfully in Reg 44 report.",
  },
  {
    id: "mc-006",
    youngPerson: "yp_casey",
    consentRequestedDate: "2024-12-01",
    purpose: "Photo of Casey for school yearbook (specialist provision)",
    category: "School photo / yearbook",
    whoIsRequesting: "School (specialist provision)",
    ageAtRequest: 12,
    childCanGiveConsent: true,
    childGaveConsent: "Conditional",
    parentalResponsibilityConsent: true,
    laConsent: true,
    conditionsAgreed: [
      "Photo only with sensory regulation tools visible (Casey wanted authentic representation)",
      "First name only — surname not used",
      "Yearbook only — not displayed publicly online",
      "Casey gets a copy",
    ],
    expiryOfConsent: "Single yearbook use",
    childCanWithdrawConsent: true,
    withdrawalProcess: "Yearbook physical — once printed cannot be withdrawn. School not to share online.",
    childIdentifiable: true,
    anonymisationApplied: "First name only",
    storageLocation: "School yearbook + Casey's copy",
    retentionPeriod: "Casey keeps her copy",
    recordedBy: "staff_anna",
    notes: "Casey's choice to be photographed with sensory tools was significant. Self-advocacy moment.",
  },
];

const consentColour: Record<string, string> = {
  "Yes - explicit": "bg-green-100 text-green-800",
  "Yes - assenting": "bg-blue-100 text-blue-800",
  "Conditional": "bg-amber-100 text-amber-800",
  "Declined": "bg-red-100 text-red-800",
  "Unsure - withdrawn": "bg-purple-100 text-purple-800",
  "Not asked - inappropriate": "bg-slate-100 text-slate-800",
};

const exportCols: ExportColumn<ConsentRecord>[] = [
  { header: "Young Person", accessor: (r: ConsentRecord) => getYPName(r.youngPerson) },
  { header: "Date", accessor: (r: ConsentRecord) => r.consentRequestedDate },
  { header: "Purpose", accessor: (r: ConsentRecord) => r.purpose },
  { header: "Category", accessor: (r: ConsentRecord) => r.category },
  { header: "Child Consent", accessor: (r: ConsentRecord) => r.childGaveConsent },
  { header: "PR Consent", accessor: (r: ConsentRecord) => r.parentalResponsibilityConsent ? "Yes" : "No" },
  { header: "LA Consent", accessor: (r: ConsentRecord) => r.laConsent ? "Yes" : "No" },
  { header: "Identifiable", accessor: (r: ConsentRecord) => r.childIdentifiable ? "Yes" : "No (anonymised)" },
];

export default function MediaPublicityConsentPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterConsent, setFilterConsent] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((r) => r.youngPerson === filterYP);
    if (filterCategory !== "all") items = items.filter((r) => r.category === filterCategory);
    if (filterConsent !== "all") items = items.filter((r) => r.childGaveConsent === filterConsent);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.consentRequestedDate.localeCompare(a.consentRequestedDate);
        case "name":
          return a.youngPerson.localeCompare(b.youngPerson);
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, filterCategory, filterConsent, sortBy]);

  const total = data.length;
  const declined = data.filter((r) => r.childGaveConsent === "Declined").length;
  const explicitConsent = data.filter((r) => r.childGaveConsent === "Yes - explicit").length;
  const anonymised = data.filter((r) => !r.childIdentifiable).length;

  return (
    <PageShell
      title="Media & Publicity Consent"
      subtitle="Records of consent for photographs, media use, and any external publication involving children"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="media-publicity-consent" />
          <PrintButton title="Media & Publicity Consent" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Consent Records</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{explicitConsent}</p>
          <p className="text-xs text-muted-foreground">Explicit Consent</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{declined}</p>
          <p className="text-xs text-muted-foreground">Declined (Respected)</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{anonymised}/{total}</p>
          <p className="text-xs text-muted-foreground">Anonymised</p>
        </div>
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
            <SelectItem value="Internal Life Story Book">Life Story Book</SelectItem>
            <SelectItem value="Internal display only">Internal Display</SelectItem>
            <SelectItem value="School photo / yearbook">School Photo</SelectItem>
            <SelectItem value="Local newspaper">Local Newspaper</SelectItem>
            <SelectItem value="Cornerstone newsletter (anonymised)">Newsletter</SelectItem>
            <SelectItem value="Social media (sector-facing)">Social Media</SelectItem>
            <SelectItem value="Inspection/Reg 44 evidence">Inspection</SelectItem>
            <SelectItem value="Court/legal">Court/Legal</SelectItem>
            <SelectItem value="Personal request (e.g. sibling)">Personal Request</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterConsent} onValueChange={setFilterConsent}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Consent" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Consent States</SelectItem>
            <SelectItem value="Yes - explicit">Explicit Yes</SelectItem>
            <SelectItem value="Yes - assenting">Assenting Yes</SelectItem>
            <SelectItem value="Conditional">Conditional</SelectItem>
            <SelectItem value="Declined">Declined</SelectItem>
            <SelectItem value="Unsure - withdrawn">Withdrawn</SelectItem>
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
          const declined = r.childGaveConsent === "Declined";

          return (
            <div key={r.id} className={cn("rounded-xl border bg-white overflow-hidden",
              declined && "border-l-4 border-l-red-500"
            )}>
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Camera className="h-5 w-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(r.youngPerson)} &middot; {r.purpose.slice(0, 70)}{r.purpose.length > 70 ? "..." : ""}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.consentRequestedDate} &middot; {r.category} &middot; {r.whoIsRequesting}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", consentColour[r.childGaveConsent])}>
                    {r.childGaveConsent}
                  </span>
                  {!r.childIdentifiable && (
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
                      r.childGaveConsent.startsWith("Yes") || r.childGaveConsent === "Conditional" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                    )}>
                      {r.childGaveConsent.startsWith("Yes") || r.childGaveConsent === "Conditional" ? <CheckCircle className="h-3 w-3 inline mr-1" /> : <XCircle className="h-3 w-3 inline mr-1" />}
                      Child: {r.childGaveConsent}
                    </div>
                    <div className={cn("rounded-lg p-2 border text-center text-sm",
                      r.parentalResponsibilityConsent ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                    )}>
                      {r.parentalResponsibilityConsent ? <CheckCircle className="h-3 w-3 inline mr-1" /> : <XCircle className="h-3 w-3 inline mr-1" />}
                      PR: {r.parentalResponsibilityConsent ? "Yes" : "No"}
                    </div>
                    <div className={cn("rounded-lg p-2 border text-center text-sm",
                      r.laConsent ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                    )}>
                      {r.laConsent ? <CheckCircle className="h-3 w-3 inline mr-1" /> : <XCircle className="h-3 w-3 inline mr-1" />}
                      LA: {r.laConsent ? "Yes" : "No"}
                    </div>
                  </div>

                  {r.conditionsAgreed.length > 0 && r.childGaveConsent !== "Declined" && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Conditions Agreed</p>
                      <ul className="space-y-1">
                        {r.conditionsAgreed.map((c, i) => (
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
                      <p className="text-sm">{r.anonymisationApplied}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">
                        <Heart className="h-3 w-3 inline mr-1" />Withdrawal Process
                      </p>
                      <p className="text-sm">{r.withdrawalProcess}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-2 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Storage</p>
                      <p>{r.storageLocation}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Retention</p>
                      <p>{r.retentionPeriod}</p>
                    </div>
                  </div>

                  {r.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{r.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Clock className="h-3 w-3 inline mr-1" />Expiry: {r.expiryOfConsent}</span>
                    <span>Recorded: {getStaffName(r.recordedBy)}</span>
                    <span>Age at request: {r.ageAtRequest}</span>
                    {r.childCanWithdrawConsent && <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">Withdrawable</span>}
                  </div>

                  {declined && (
                    <div className="bg-red-50 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-sm">Child declined. No use of image/quote/artwork. Decision fully respected.</p>
                    </div>
                  )}
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
    </PageShell>
  );
}
