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
  Heart,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HandMetal,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { useSafeTouchProtocolRecords } from "@/hooks/use-safe-touch-protocol-records";
import type { SafeTouchProtocolRecord } from "@/types/extended";

/* ── helpers ─────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── page ────────────────────────────────────────────────────────────── */

export default function SafeTouchProtocolPage() {
  const { data: records = [], isLoading } = useSafeTouchProtocolRecords();
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const childIds = useMemo(() => Array.from(new Set(records.map((r) => r.child_id))), [records]);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterYP !== "all") items = items.filter((p) => p.child_id === filterYP);
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
  }, [records, filterYP, sortBy]);

  const allReviewedWithChild = records.length > 0 && records.every((p) => p.review_with_child);
  const allConsentUnderstood = records.length > 0 && records.every((p) => p.child_understands_consent);
  const dueReview = records.filter((p) => p.reviewed_date < d(-30)).length;

  const exportCols: ExportColumn<SafeTouchProtocolRecord>[] = [
    { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
    { header: "Age", accessor: (r) => String(r.child_age) },
    { header: "Trauma-Informed Basis", accessor: (r) => r.trauma_informed_basis },
    { header: "Personal Space", accessor: (r) => r.personal_space_requirements },
    { header: "Triggers Count", accessor: (r) => String(r.triggers.length) },
    { header: "Last Reviewed", accessor: (r) => r.reviewed_date },
    { header: "Reviewed With Child", accessor: (r) => r.review_with_child ? "Yes" : "No" },
    { header: "Child Understands Consent", accessor: (r) => r.child_understands_consent ? "Yes" : "No" },
  ];

  if (isLoading) {
    return (
      <PageShell title="Safe Touch Protocol" subtitle="Individual physical contact frameworks per child — trauma-informed, consent-led, sensory-aware">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Safe Touch Protocol"
      subtitle="Individual physical contact frameworks per child — trauma-informed, consent-led, sensory-aware"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="safe-touch-protocol" />
          <PrintButton title="Safe Touch Protocol" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{records.length}</p>
          <p className="text-xs text-muted-foreground">Active Protocols</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allReviewedWithChild ? "100%" : `${records.filter((p) => p.review_with_child).length}/${records.length}`}</p>
          <p className="text-xs text-muted-foreground">Reviewed With Child</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{allConsentUnderstood ? "100%" : `${records.filter((p) => p.child_understands_consent).length}/${records.length}`}</p>
          <p className="text-xs text-muted-foreground">Consent Understood</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", dueReview > 0 ? "text-amber-600" : "text-green-600")}>{dueReview}</p>
          <p className="text-xs text-muted-foreground">Due Review</p>
        </div>
      </div>

      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-pink-600 mt-0.5 shrink-0" />
        <p className="text-sm text-pink-800">
          Touch in our care is a relational, consensual act — never an assumption. Each child has a personalised
          protocol based on their trauma history, sensory profile, and stated preferences. All staff are
          briefed before working with each child.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {childIds.map((id) => (
              <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="review">Earliest Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((protocol) => {
          const isExpanded = expandedId === protocol.id;
          return (
            <div key={protocol.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : protocol.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <HandMetal className="h-5 w-5 text-pink-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(protocol.child_id)} (age {protocol.child_age})</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{protocol.trauma_informed_basis}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {protocol.review_with_child && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Co-produced</span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Trauma-Informed Basis</p>
                    <p className="text-sm text-purple-900">{protocol.trauma_informed_basis}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <CheckCircle className="h-3 w-3 inline mr-1" />Acceptable Touches
                    </p>
                    <div className="space-y-2">
                      {protocol.acceptable_touches.map((t, i) => (
                        <div key={i} className="bg-green-50 rounded-lg p-2 text-sm">
                          <p className="font-medium text-green-900">{t.type}</p>
                          <p className="text-xs text-green-700 mt-0.5">{t.context}</p>
                          {t.child_agreed && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-200 text-green-900 font-medium mt-1 inline-block">Child agreed</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">
                      <XCircle className="h-3 w-3 inline mr-1" />Unacceptable Touches
                    </p>
                    <ul className="space-y-1">
                      {protocol.unacceptable_touches.map((t, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <XCircle className="h-3 w-3 text-red-500 mt-1 shrink-0" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Greeting Preferences</p>
                      <p className="text-sm">{protocol.greeting_preferences}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Comfort Preferences</p>
                      <p className="text-sm">{protocol.comfort_preferences}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Physical Proximity</p>
                      <p className="text-sm">{protocol.physical_proximity}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Personal Space</p>
                      <p className="text-sm">{protocol.personal_space_requirements}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />Triggers
                    </p>
                    <ul className="space-y-1">
                      {protocol.triggers.map((t, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-red-600 mt-0.5">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Signs Of Distress</p>
                    <ul className="space-y-1">
                      {protocol.signs_of_distress.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-amber-600 mt-0.5">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">If Triggered: Response</p>
                    <ul className="space-y-1">
                      {protocol.response_if_triggered.map((r, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <CheckCircle className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Child&apos;s Preferred Language</p>
                    <p className="text-sm text-purple-900">{protocol.child_preferred_language}</p>
                  </div>

                  {protocol.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{protocol.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Shield className="h-3 w-3 inline mr-1" />Reviewed: {protocol.reviewed_date}</span>
                    <span>With: {getStaffName(protocol.reviewed_with)}</span>
                    <span>Staff briefed: {protocol.staff_briefing_date}</span>
                    {protocol.review_with_child && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Co-produced with child</span>}
                  </div>

                  <SmartLinkPanel sourceType="safe-touch-protocol" sourceId={protocol.id} childId={protocol.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Safe touch protocols support Quality Standard 5 (protection
          of children), Quality Standard 7 (health and wellbeing), and the home&apos;s positive handling
          framework. Aligned with NICE guidelines on attachment, trauma-informed care principles, and
          children&apos;s right to bodily autonomy (UNCRC Article 19). Reviewed with each child quarterly
          minimum.
        </p>
      </div>
    </PageShell>
  );
}
