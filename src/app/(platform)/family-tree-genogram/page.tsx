"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn, formatDate, todayStr } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Users,
  Heart,
  Phone,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  GenogramEntry,
  FamilyContactStatus,
  FamilyMemberStatus,
} from "@/types/extended";
import {
  FAMILY_CONTACT_STATUS_LABEL,
  FAMILY_MEMBER_STATUS_LABEL,
} from "@/types/extended";
import { useGenogramEntries } from "@/hooks/use-genogram-entries";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const exportCols: ExportColumn<GenogramEntry>[] = [
  { header: "Young Person", accessor: (r: GenogramEntry) => getYPName(r.child_id) },
  { header: "Generations Mapped", accessor: (r: GenogramEntry) => r.generations_represented.length.toString() },
  { header: "Active Contacts", accessor: (r: GenogramEntry) => r.immediate_family.filter((f) => f.contact_status === "active").length.toString() },
  { header: "Important Non-Family", accessor: (r: GenogramEntry) => r.important_non_family_adults.length.toString() },
  { header: "Child Input", accessor: (r: GenogramEntry) => r.child_input_provided ? "Yes" : "No" },
  { header: "Last Updated", accessor: (r: GenogramEntry) => r.last_updated_date },
  { header: "Reviewed By", accessor: (r: GenogramEntry) => getStaffName(r.reviewed_by) },
];

const contactColour: Record<FamilyContactStatus, string> = {
  active: "bg-green-100 text-green-800",
  letterbox_only: "bg-blue-100 text-blue-800",
  indirect: "bg-purple-100 text-purple-800",
  restricted: "bg-amber-100 text-amber-800",
  no_contact: "bg-slate-100 text-[var(--cs-navy)]",
};

export default function FamilyTreeGenogramPage() {
  const { data: res, isLoading } = useGenogramEntries();
  const records = res?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterYP !== "all") items = items.filter((g) => g.child_id === filterYP);
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.child_id.localeCompare(b.child_id);
        case "updated":
          return b.last_updated_date.localeCompare(a.last_updated_date);
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, sortBy, records]);

  const total = records.length;
  const allChildInput = records.every((g) => g.child_input_provided);
  const updatedRecently = records.filter((g) => g.last_updated_date >= new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)).length;

  const uniqueChildIds = useMemo(
    () => Array.from(new Set(records.map((g) => g.child_id))),
    [records],
  );

  if (isLoading) {
    return (
      <PageShell
        title="Family Tree / Genogram"
        subtitle="Each child's relational map — family, chosen family, places, identity"
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Family Tree / Genogram"
      subtitle="Each child's relational map — family, chosen family, places, identity"
      caraContext={{ pageTitle: "Family Tree / Genogram", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="family-tree-genogram" />
          <PrintButton title="Family Tree / Genogram" />
          <CaraStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Active Genograms</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allChildInput ? "100%" : `${records.filter((g) => g.child_input_provided).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Child Co-Authored</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{updatedRecently}</p>
          <p className="text-xs text-muted-foreground">Updated (90d)</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">100%</p>
          <p className="text-xs text-muted-foreground">Linked to Life Story</p>
        </div>
      </div>

      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-pink-600 mt-0.5 shrink-0" />
        <p className="text-sm text-pink-800">
          A genogram is more than a family tree — it&apos;s the child&apos;s map of who matters. Family,
          chosen family, important places, and identity-shaping relationships. Co-authored with each child,
          held with care, shared on a strict need-to-know basis.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {uniqueChildIds.map((id) => (
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
              <SelectItem value="updated">Recently Updated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((g) => {
          const isExpanded = expandedId === g.id;

          return (
            <div key={g.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : g.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Users className="h-5 w-5 text-pink-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(g.child_id)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {g.immediate_family.length} immediate family &middot; {g.important_non_family_adults.length} chosen family &middot; Updated {g.last_updated_date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {g.sensitive_content && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium flex items-center gap-1">
                      <EyeOff className="h-3 w-3" />Sensitive
                    </span>
                  )}
                  {g.child_input_provided && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Co-authored</span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* sensitive notice */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-2">
                    <EyeOff className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-purple-800">
                      <strong>Confidential:</strong> Genogram contains sensitive identity information.
                      Shareable with: {g.shareable_with.join(", ")}. Not for general staff distribution.
                    </p>
                  </div>

                  {/* generations */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Generations Represented</p>
                    <ul className="space-y-1">
                      {g.generations_represented.map((gen, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-pink-600 mt-0.5">•</span>
                          <span>{gen}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* immediate family */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Immediate Family</p>
                    <div className="space-y-2">
                      {g.immediate_family.map((f, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 border">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">{f.relation}: {f.name}</p>
                            <div className="flex items-center gap-1">
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", contactColour[f.contact_status] ?? "bg-slate-100 text-[var(--cs-text-secondary)]")}>
                                {FAMILY_CONTACT_STATUS_LABEL[f.contact_status] ?? f.contact_status}
                              </span>
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                                f.status === "living" ? "bg-emerald-50 text-emerald-700" :
                                f.status === "deceased" ? "bg-slate-100 text-[var(--cs-text-secondary)]" :
                                "bg-amber-50 text-amber-700"
                              )}>
                                {FAMILY_MEMBER_STATUS_LABEL[f.status] ?? f.status}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{f.safeguarding_notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* extended family */}
                  {g.extended_family.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Extended Family</p>
                      <div className="space-y-1">
                        {g.extended_family.map((f, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                            <p><strong>{f.relation}</strong> {f.name && `(${f.name})`} &middot; <span className="text-muted-foreground">{f.contact_status}</span></p>
                            <p className="text-xs text-muted-foreground">{f.significance}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* chosen family */}
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                      <Heart className="h-3 w-3 inline mr-1" />Chosen Family / Important Non-Family Adults
                    </p>
                    <div className="space-y-1">
                      {g.important_non_family_adults.map((p, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <p><strong>{p.name}</strong> ({p.role})</p>
                          <p className="text-xs text-muted-foreground">{p.significance}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* significant places */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Significant Places</p>
                    <ul className="space-y-1">
                      {g.significant_places.map((p, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Sparkles className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                          <span><strong>{p.place}</strong> — {p.significance}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* protective and risk */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">Protective Relationships</p>
                      <ul className="space-y-1">
                        {g.protective_relationships.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Heart className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Risk Relationships</p>
                      <ul className="space-y-1">
                        {g.risk_relationships.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <AlertCircle className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* family myths and child knowledge */}
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Family Narratives</p>
                    <p className="text-sm">{g.family_myths}</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">What The Child Knows</p>
                    <p className="text-sm">{g.child_knows_the_story}</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Age-Appropriate Summary (For Child)</p>
                    <p className="text-sm italic">{g.age_appropriate_summary}</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Identity Impact</p>
                    <p className="text-sm">{g.identity_impact}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Eye className="h-3 w-3 inline mr-1" />Created when child was age {g.child_age_when_created}</span>
                    <span>Last updated: {g.last_updated_date}</span>
                    <span>Reviewed by: {getStaffName(g.reviewed_by)}</span>
                    <span><Phone className="h-3 w-3 inline mr-1" />Contact details in Contact Directory</span>
                  </div>

                  <SmartLinkPanel sourceType="genogram-entry" sourceId={g.id} childId={g.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Genograms support Quality Standard 1 (child-centred care),
          Quality Standard 9 (relationships), UNCRC Article 8 (right to identity), and trauma-informed
          practice. Co-authored with each child, updated annually or when significant changes occur,
          shared on a strict need-to-know basis. Linked to Life Story Work, Personal Passport, Cultural
          Identity, Trauma-Informed Timeline, and Contact Directory.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Family Contact"
        category="family_contact"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Family Tree / Genogram — family history, significant relationships, attachment figures, parental relationships, siblings, extended family, trauma history, placement history"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
