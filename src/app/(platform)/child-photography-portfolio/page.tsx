"use client";

import { useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Camera,
  Heart,
  Star,
  BookOpen,
  Frame,
  Image as ImageIcon,
  CheckCircle,
  Shield,
  Users,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChildPhotoEntry, PhotoCategory } from "@/types/extended";
import { PHOTO_CATEGORY_LABEL, PHOTO_CONSENT_METHOD_LABEL } from "@/types/extended";
import { useChildPhotoEntries } from "@/hooks/use-child-photo-entries";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { useState } from "react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const categoryColours: Record<PhotoCategory, string> = {
  birthday: "bg-pink-100 text-pink-800",
  achievement: "bg-amber-100 text-amber-800",
  activity: "bg-blue-100 text-blue-800",
  family_contact: "bg-rose-100 text-rose-800",
  holiday_trip: "bg-cyan-100 text-cyan-800",
  everyday_moment: "bg-emerald-100 text-emerald-800",
  cultural_event: "bg-purple-100 text-purple-800",
  school_milestone: "bg-indigo-100 text-indigo-800",
};

export default function ChildPhotographyPortfolioPage() {
  const { data: raw, isLoading } = useChildPhotoEntries();
  const items = raw?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const exportCols: ExportColumn<ChildPhotoEntry>[] = useMemo(() => [
    { header: "Young Person", accessor: (r: ChildPhotoEntry) => getYPName(r.child_id) },
    { header: "Date", accessor: (r: ChildPhotoEntry) => r.date },
    { header: "Occasion", accessor: (r: ChildPhotoEntry) => r.occasion },
    { header: "Category", accessor: (r: ChildPhotoEntry) => PHOTO_CATEGORY_LABEL[r.photo_category] },
    {
      header: "Photographer",
      accessor: (r: ChildPhotoEntry) =>
        r.photographer === "Self" || r.photographer === "External"
          ? r.photographer
          : getStaffName(r.photographer),
    },
    { header: "Consent", accessor: (r: ChildPhotoEntry) => (r.consent_given ? `Yes (${PHOTO_CONSENT_METHOD_LABEL[r.consent_method]})` : "No") },
    { header: "Group Photo", accessor: (r: ChildPhotoEntry) => (r.group_photo ? "Yes" : "No") },
    { header: "Life Story Book", accessor: (r: ChildPhotoEntry) => (r.part_of_life_story_book ? "Yes" : "No") },
    { header: "Bedroom Display", accessor: (r: ChildPhotoEntry) => (r.part_of_bedroom_display ? "Yes" : "No") },
    { header: "Gallery Wall", accessor: (r: ChildPhotoEntry) => (r.part_of_gallery_wall ? "Yes" : "No") },
    { header: "Description", accessor: (r: ChildPhotoEntry) => r.description },
  ], []);

  const filtered = useMemo(() => {
    let list = [...items];
    if (filterYP !== "all") list = list.filter((p) => p.child_id === filterYP);
    if (filterCategory !== "all") list = list.filter((p) => p.photo_category === filterCategory);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "oldest":
          return a.date.localeCompare(b.date);
        case "name":
          return a.child_id.localeCompare(b.child_id);
        case "category":
          return a.photo_category.localeCompare(b.photo_category);
        default:
          return 0;
      }
    });
    return list;
  }, [items, filterYP, filterCategory, sortBy]);

  if (isLoading) {
    return (
      <PageShell title="Child Photography Portfolio" subtitle="Loading…">
        <div />
      </PageShell>
    );
  }

  const ypIds = [...new Set(items.map((r) => r.child_id))];

  const total = items.length;
  const thisYear = items.filter((p) => p.date.startsWith(new Date().getFullYear().toString())).length;
  const lifeStoryCount = items.filter((p) => p.part_of_life_story_book).length;
  const achievementCount = items.filter((p) => p.photo_category === "achievement").length;
  const allConsented = items.every((p) => p.consent_given);

  return (
    <PageShell
      title="Child Photography Portfolio"
      subtitle="Photo memories per child — milestones, achievements, everyday joy, documented with consent"
      ariaContext={{ pageTitle: "Child Photography Portfolio", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={items} columns={exportCols} filename="child-photography-portfolio" />
          <PrintButton title="Child Photography Portfolio" />
          <AriaStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Photos Catalogued</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{thisYear}</p>
          <p className="text-xs text-muted-foreground">This Year</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{lifeStoryCount}</p>
          <p className="text-xs text-muted-foreground">Life Story Photos</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{achievementCount}</p>
          <p className="text-xs text-muted-foreground">Achievement Photos</p>
        </div>
      </div>

      <div
        className={cn(
          "rounded-lg p-3 mb-6 flex items-start gap-2 border",
          allConsented ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200",
        )}
      >
        <Shield
          className={cn(
            "h-4 w-4 mt-0.5 shrink-0",
            allConsented ? "text-emerald-600" : "text-amber-600",
          )}
        />
        <p
          className={cn(
            "text-sm",
            allConsented ? "text-emerald-800" : "text-amber-800",
          )}
        >
          <strong>Consent first, always.</strong> Every photo is taken with the child&apos;s
          informed agreement using a method they understand (verbal, written, visual cards, or via
          advocate). Children can request removal at any time. Group photos are checked with all
          others present. Faces of unconsenting parties are anonymised. This is a metadata
          register — image files are stored separately within secure care records.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Children" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {ypIds.map((id) => (
              <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(PHOTO_CATEGORY_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="category">By Category</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((p) => {
          const isExpanded = expandedId === p.id;
          const photographerName =
            p.photographer === "Self" || p.photographer === "External"
              ? p.photographer
              : getStaffName(p.photographer);

          return (
            <div key={p.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Camera className="h-5 w-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {getYPName(p.child_id)} &middot; {p.occasion}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {p.date} &middot; Photographer: {photographerName}
                      {p.group_photo && p.others_in_photo.length > 0
                        ? ` · Group of ${p.others_in_photo.length + 1}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium hidden sm:inline-block",
                      categoryColours[p.photo_category],
                    )}
                  >
                    {PHOTO_CATEGORY_LABEL[p.photo_category]}
                  </span>
                  {p.consent_given && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {p.part_of_life_story_book && <BookOpen className="h-4 w-4 text-purple-500" />}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <ImageIcon className="h-3 w-3 inline mr-1" />
                      Description
                    </p>
                    <p className="text-sm">{p.description}</p>
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Note: this is a metadata record only — image not stored in this register.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Photographer &amp; Framing
                      </p>
                      <ul className="text-sm space-y-0.5">
                        <li>
                          <span className="text-muted-foreground">Taken by:</span>{" "}
                          {photographerName}
                        </li>
                        <li>
                          <span className="text-muted-foreground">Child posed:</span>{" "}
                          {p.child_posed ? "Yes" : "No (candid)"}
                        </li>
                        <li>
                          <span className="text-muted-foreground">Child chose to take it:</span>{" "}
                          {p.child_choose_to_take ? "Yes" : "No"}
                        </li>
                        <li>
                          <span className="text-muted-foreground">Location:</span> {p.photo_location}
                        </li>
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <Shield className="h-3 w-3 inline mr-1" />
                        Consent
                      </p>
                      <ul className="text-sm space-y-0.5">
                        <li>
                          <span className="text-muted-foreground">Given:</span>{" "}
                          {p.consent_given ? "Yes" : "No"}
                        </li>
                        <li>
                          <span className="text-muted-foreground">Method:</span> {PHOTO_CONSENT_METHOD_LABEL[p.consent_method]}
                        </li>
                        <li className="flex items-start gap-1">
                          <Trash2 className="h-3 w-3 text-rose-500 mt-1 shrink-0" />
                          <span>
                            {p.child_can_request_removal
                              ? "Child can request removal at any time"
                              : "Removal restricted (review required)"}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {p.group_photo && p.others_in_photo.length > 0 && (
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <Users className="h-3 w-3 inline mr-1" />
                        Others in Photo (anonymised)
                      </p>
                      <ul className="space-y-0.5">
                        {p.others_in_photo.map((o, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-purple-600 mt-0.5">•</span>
                            <span>{o}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Frame className="h-3 w-3 inline mr-1" />
                      Where the Photo Lives
                    </p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {p.part_of_life_story_book && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">
                          <BookOpen className="h-3 w-3 inline mr-1" />
                          Life Story Book
                        </span>
                      )}
                      {p.part_of_bedroom_display && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 font-medium">
                          Bedroom Display
                        </span>
                      )}
                      {p.part_of_gallery_wall && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                          Communal Gallery Wall
                        </span>
                      )}
                    </div>
                    <ul className="space-y-0.5">
                      {p.copies.map((c, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {p.child_comment && (
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                        Child&apos;s Words
                      </p>
                      <p className="text-sm italic">&ldquo;{p.child_comment}&rdquo;</p>
                    </div>
                  )}

                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                      <Star className="h-3 w-3 inline mr-1" />
                      Special Significance
                    </p>
                    <p className="text-sm">{p.special_significance}</p>
                  </div>

                  <SmartLinkPanel sourceType="child-photo-entry" sourceId={p.id} childId={p.child_id} compact />

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Date: {p.date}</span>
                    <span>Category: {PHOTO_CATEGORY_LABEL[p.photo_category]}</span>
                    <span>
                      <Heart className="h-3 w-3 inline mr-1 text-pink-500" />
                      Consent: {PHOTO_CONSENT_METHOD_LABEL[p.consent_method]}
                    </span>
                    {p.child_choose_to_take && (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">
                        Child-led
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Photographic memory-keeping supports Quality
          Standard 1 (child-centred care and identity work), Quality Standard 6 (positive
          relationships and family connection), Children&apos;s Homes Regulations 2015 Schedule 1
          (records of significant events), UNCRC Article 8 (right to identity) and Article 16
          (right to privacy). Each photo is taken with informed consent in a method the child
          understands; children retain the right to request removal at any time. Image files
          are held in secure care records — this register stores metadata only. Group photos
          require consent from all identifiable parties; otherwise, faces are anonymised.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Activities"
        category="activity"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Child Photography Portfolio — photos of achievements, life story work, special moments, activities, celebrations, memory keeping, photo consent, placement stability, Reg 45 positive outcomes"
        recordType="direct_work"
        className="mt-6"
      />
    </PageShell>
  );
}
