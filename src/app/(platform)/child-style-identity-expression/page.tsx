"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Shirt,
  Sparkles,
  Heart,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Star,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StyleIdentityRecord, BodyConfidence } from "@/types/extended";
import { BODY_CONFIDENCE_LABEL } from "@/types/extended";
import { useStyleIdentityRecords } from "@/hooks/use-style-identity-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const exportCols: ExportColumn<StyleIdentityRecord>[] = [
  { header: "Young Person", accessor: (r: StyleIdentityRecord) => getYPName(r.child_id) },
  { header: "Recorded", accessor: (r: StyleIdentityRecord) => r.recorded_date },
  { header: "Style Descriptors", accessor: (r: StyleIdentityRecord) => r.style_descriptors.join("; ") },
  { header: "Hair Style", accessor: (r: StyleIdentityRecord) => r.hair_style_current },
  { header: "Cultural Dress", accessor: (r: StyleIdentityRecord) => r.cultural_dress.join("; ") },
  { header: "Gender Expression Notes", accessor: (r: StyleIdentityRecord) => r.gender_expression_notes ?? "" },
  { header: "Body Confidence", accessor: (r: StyleIdentityRecord) => BODY_CONFIDENCE_LABEL[r.body_confidence] },
  { header: "Flags For Review", accessor: (r: StyleIdentityRecord) => r.flags_for_review.join("; ") },
  { header: "Review Date", accessor: (r: StyleIdentityRecord) => r.review_date },
  { header: "Key Worker", accessor: (r: StyleIdentityRecord) => getStaffName(r.key_worker) },
];

const confidenceStyle: Record<BodyConfidence, string> = {
  building: "bg-amber-100 text-amber-800",
  mixed: "bg-orange-100 text-orange-800",
  stable: "bg-sky-100 text-sky-800",
  strong: "bg-emerald-100 text-emerald-800",
};

export default function ChildStyleIdentityExpressionPage() {
  const { data: res, isLoading } = useStyleIdentityRecords();
  const items = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterConfidence, setFilterConfidence] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...items];
    if (filterConfidence !== "all") {
      list = list.filter((r) => r.body_confidence === filterConfidence);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => {
        const haystack = [
          getYPName(r.child_id),
          ...r.style_descriptors,
          ...r.identity_elements,
          r.hair_style_current,
          ...r.cultural_dress,
          r.gender_expression_notes ?? "",
          r.child_voice,
          r.staff_observation,
        ].join(" ").toLowerCase();
        return haystack.includes(q);
      });
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "review":
          return a.review_date.localeCompare(b.review_date);
        case "recorded":
          return b.recorded_date.localeCompare(a.recorded_date);
        case "confidence": {
          const order: Record<BodyConfidence, number> = {
            building: 0,
            mixed: 1,
            stable: 2,
            strong: 3,
          };
          return order[a.body_confidence] - order[b.body_confidence];
        }
        default:
          return 0;
      }
    });
    return list;
  }, [items, search, filterConfidence, sortBy]);

  if (isLoading) {
    return (
      <PageShell
        title="Style & Identity Expression"
        subtitle="Per-child style and identity expression — clothing, hair, accessories, cultural dress, gender expression"
      >
        <div />
      </PageShell>
    );
  }

  const totalProfiles = items.length;
  const genderAffirmingCount = items.filter((r) => r.gender_expression_notes && r.gender_expression_notes.length > 0).length;
  const buildingConfidenceCount = items.filter((r) => r.body_confidence === "building").length;
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const reviewsDue = items.filter((r) => r.review_date <= thirtyDaysFromNow).length;

  return (
    <PageShell
      title="Style & Identity Expression"
      subtitle="Per-child style and identity expression — clothing, hair, accessories, cultural dress, gender expression"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={items} columns={exportCols} filename="style-identity-expression" />
          <PrintButton title="Style & Identity Expression" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-rose-600">{totalProfiles}</p>
          <p className="text-xs text-muted-foreground">Style Profiles</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{genderAffirmingCount}</p>
          <p className="text-xs text-muted-foreground">Gender-Affirming Notes</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-sky-600">{buildingConfidenceCount}</p>
          <p className="text-xs text-muted-foreground">Building Body Confidence</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{reviewsDue}</p>
          <p className="text-xs text-muted-foreground">Reviews Due (30d)</p>
        </div>
      </div>

      <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 mb-6 flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
        <p className="text-sm text-rose-800">
          Identity expression is a child&apos;s right. Each profile records how the young person wants
          to be seen — their style, hair journey, cultural dress, gender expression, and the meaningful
          items that anchor them. This is not about shopping; this is about self.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search style, identity, voice..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border bg-white"
          />
        </div>
        <Select value={filterConfidence} onValueChange={setFilterConfidence}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Body Confidence" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Confidence</SelectItem>
            {(Object.entries(BODY_CONFIDENCE_LABEL) as [BodyConfidence, string][]).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="confidence">By Confidence</SelectItem>
              <SelectItem value="recorded">Most Recently Recorded</SelectItem>
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
                className="w-full flex items-center justify-between p-4 text-left hover:bg-rose-50/40 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Shirt className="h-5 w-5 text-rose-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(r.child_id)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {r.style_descriptors.slice(0, 2).join(" · ")} &middot; Recorded {r.recorded_date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", confidenceStyle[r.body_confidence])}>
                    {BODY_CONFIDENCE_LABEL[r.body_confidence]}
                  </span>
                  <span className="hidden md:inline text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                    {r.hair_style_current}
                  </span>
                  {r.flags_for_review.length > 0 && (
                    <Star className="h-4 w-4 text-amber-500" />
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-rose-50/30 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Shirt className="h-3 w-3 inline mr-1" />Style Descriptors
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {r.style_descriptors.map((s, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-medium">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Sparkles className="h-3 w-3 inline mr-1" />Identity Elements
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {r.identity_elements.map((e, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">{e}</span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
                      <Heart className="h-3 w-3 inline mr-1" />Meaningful Items
                    </p>
                    <div className="space-y-1">
                      {r.meaningful_items.map((m, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <p className="font-medium">{m.item}</p>
                          <p className="text-xs text-muted-foreground">{m.meaning}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {r.cultural_dress.length > 0 && (
                    <div className="bg-sky-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-sky-800 uppercase tracking-wide mb-1">Cultural Dress</p>
                      <ul className="space-y-1">
                        {r.cultural_dress.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-sky-600 mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {r.gender_expression_notes && (
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Gender Expression Notes</p>
                      <p className="text-sm text-purple-900">{r.gender_expression_notes}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Hair — Current</p>
                      <p className="text-sm font-medium mb-2">{r.hair_style_current}</p>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Hair Journey</p>
                      <ul className="space-y-1">
                        {r.hair_journey.map((h, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-rose-600 mt-0.5">•</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Accessories</p>
                      <ul className="space-y-1 mb-3">
                        {r.accessories_preferences.map((a, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Sparkles className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Shopping Preferences</p>
                      <ul className="space-y-1">
                        {r.shopping_preferences.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-sky-600 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {r.what_they_avoid.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">What They Avoid</p>
                      <ul className="space-y-1">
                        {r.what_they_avoid.map((w, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-orange-600 mt-0.5">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-rose-100/60 rounded-lg p-3 border border-rose-200">
                    <p className="text-xs font-semibold text-rose-800 uppercase tracking-wide mb-1">Child Voice</p>
                    <p className="text-sm italic text-rose-900">&ldquo;{r.child_voice}&rdquo;</p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Staff Observation</p>
                    <p className="text-sm">{r.staff_observation}</p>
                  </div>

                  {r.challenges_noted && (
                    <div className="bg-orange-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide mb-1">Challenges Noted</p>
                      <p className="text-sm">{r.challenges_noted}</p>
                    </div>
                  )}

                  {r.flags_for_review.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <Star className="h-3 w-3 inline mr-1" />Flags For Review
                      </p>
                      <ul className="space-y-1">
                        {r.flags_for_review.map((f, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Star className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <SmartLinkPanel sourceType="style-identity-record" sourceId={r.id} childId={r.child_id} compact />

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Recorded: {r.recorded_date}</span>
                    <span>Next review: {r.review_date}</span>
                    <span>Key worker: {getStaffName(r.key_worker)}</span>
                    <span className={cn("px-2 py-0.5 rounded-full font-medium", confidenceStyle[r.body_confidence])}>
                      Body confidence: {BODY_CONFIDENCE_LABEL[r.body_confidence]}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Style and identity expression supports Quality Standard 6
          (positive relationships and identity), Quality Standard 7 (health and wellbeing — including body
          image and gender-affirming care), the Equality Act 2010 (protected characteristics: gender
          reassignment, race, religion, disability), and UNCRC Articles 8 (right to identity), 13 (freedom
          of expression), 14 (freedom of thought, conscience and religion), and 30 (cultural identity).
          Records are co-authored with the young person and reviewed regularly. Today: {new Date().toISOString().slice(0, 10)}.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
