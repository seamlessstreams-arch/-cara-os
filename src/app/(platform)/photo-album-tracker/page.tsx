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
  Heart,
  Sparkles,
  Lock,
  Star,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PhotoAlbumRecord, PhotoAlbumType } from "@/types/extended";
import { PHOTO_ALBUM_TYPE_LABEL, PHOTO_ALBUM_FORMAT_LABEL } from "@/types/extended";
import { usePhotoAlbumRecords } from "@/hooks/use-photo-album-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";

const albumTypeColour: Record<PhotoAlbumType, string> = {
  life_story_book: "bg-pink-100 text-pink-800",
  memory_book: "bg-purple-100 text-purple-800",
  annual_album: "bg-blue-100 text-blue-800",
  theme_album: "bg-amber-100 text-amber-800",
  achievement_album: "bg-emerald-100 text-emerald-800",
  family_album: "bg-rose-100 text-rose-800",
  identity_album: "bg-indigo-100 text-indigo-800",
};

const exportCols: ExportColumn<PhotoAlbumRecord>[] = [
  { header: "Young Person", accessor: (r: PhotoAlbumRecord) => getYPName(r.child_id) },
  { header: "Album", accessor: (r: PhotoAlbumRecord) => r.album_name },
  { header: "Type", accessor: (r: PhotoAlbumRecord) => PHOTO_ALBUM_TYPE_LABEL[r.album_type] },
  { header: "Format", accessor: (r: PhotoAlbumRecord) => PHOTO_ALBUM_FORMAT_LABEL[r.format] },
  { header: "Started", accessor: (r: PhotoAlbumRecord) => r.started_date },
  { header: "Total Photos", accessor: (r: PhotoAlbumRecord) => String(r.total_photos) },
  { header: "Child Owns", accessor: (r: PhotoAlbumRecord) => r.child_owns_album ? "Yes" : "No" },
  { header: "Last Reviewed", accessor: (r: PhotoAlbumRecord) => r.reviewed_date },
];

export default function PhotoAlbumTrackerPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: res, isLoading } = usePhotoAlbumRecords();
  const records = res?.data ?? [];

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterYP !== "all") items = items.filter((p) => p.child_id === filterYP);
    if (filterType !== "all") items = items.filter((p) => p.album_type === filterType);
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.child_id.localeCompare(b.child_id);
        case "photos":
          return b.total_photos - a.total_photos;
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterYP, filterType, sortBy]);

  const total = records.length;
  const allChildOwn = records.every((p) => p.child_owns_album);
  const totalPhotos = records.reduce((sum, p) => sum + p.total_photos, 0);
  const uniqueChildren = new Set(records.map((p) => p.child_id)).size;

  return (
    <PageShell
      title="Photo Album Tracker"
      subtitle="Per-child photo memory albums — owned by children, curated with care, protected with consent"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="photo-album-tracker" />
          <PrintButton title="Photo Album Tracker" />
        </div>
      }
    >
      {isLoading && <p className="text-center py-12 text-muted-foreground">Loading…</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Active Albums</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allChildOwn ? "100%" : `${records.filter((p) => p.child_owns_album).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Child-Owned</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalPhotos}</p>
          <p className="text-xs text-muted-foreground">Photos Curated</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{uniqueChildren}/3</p>
          <p className="text-xs text-muted-foreground">Children with Albums</p>
        </div>
      </div>

      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3 mb-6 flex items-start gap-2">
        <Camera className="h-4 w-4 text-pink-600 mt-0.5 shrink-0" />
        <p className="text-sm text-pink-800">
          Photo albums belong to the children. They choose what goes in. They choose who sees them. They
          can keep, take when they leave, and pass to their own families. Every photo respects triple
          consent (child, PR, LA).
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
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="life_story_book">{PHOTO_ALBUM_TYPE_LABEL.life_story_book}</SelectItem>
            <SelectItem value="memory_book">{PHOTO_ALBUM_TYPE_LABEL.memory_book}</SelectItem>
            <SelectItem value="annual_album">{PHOTO_ALBUM_TYPE_LABEL.annual_album}</SelectItem>
            <SelectItem value="theme_album">{PHOTO_ALBUM_TYPE_LABEL.theme_album}</SelectItem>
            <SelectItem value="achievement_album">{PHOTO_ALBUM_TYPE_LABEL.achievement_album}</SelectItem>
            <SelectItem value="family_album">{PHOTO_ALBUM_TYPE_LABEL.family_album}</SelectItem>
            <SelectItem value="identity_album">{PHOTO_ALBUM_TYPE_LABEL.identity_album}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="photos">Most Photos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((p) => {
          const isExpanded = expandedId === p.id;

          return (
            <div key={p.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Camera className="h-5 w-5 text-pink-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.album_name} ({getYPName(p.child_id)})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Started {p.started_date} &middot; {p.total_photos} photos &middot; {PHOTO_ALBUM_FORMAT_LABEL[p.format]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", albumTypeColour[p.album_type])}>{PHOTO_ALBUM_TYPE_LABEL[p.album_type]}</span>
                  {p.child_owns_album && <Heart className="h-4 w-4 text-pink-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Themes Covered</p>
                    <div className="flex flex-wrap gap-1">
                      {p.themes_covered.map((t, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{t}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Recent Additions</p>
                    <div className="space-y-1">
                      {p.recent_additions.map((r, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <p className="font-medium">{r.date} — {r.description}</p>
                          <p className="text-xs text-muted-foreground">Added by {getStaffName(r.added_by)}{r.child_involved && " (with child)"}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {p.significant_moments.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">
                        <Sparkles className="h-3 w-3 inline mr-1" />Significant Moments
                      </p>
                      <ul className="space-y-1">
                        {p.significant_moments.map((m, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Star className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">Child&apos;s Reflection</p>
                    <p className="text-sm italic">&ldquo;{p.child_reflection_on_album}&rdquo;</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Storage</p>
                      <p className="text-sm">{p.storage_location}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Sharing</p>
                      <p className="text-sm">{p.shared_with_family ? p.shareable_summary : "Personal — not externally shared"}</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                      <Lock className="h-3 w-3 inline mr-1" />Protection Measures
                    </p>
                    <ul className="space-y-1">
                      {p.protection_measures.map((m, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Lock className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Reviewed: {p.reviewed_date} with {getStaffName(p.reviewed_with)}</span>
                    {p.child_can_access && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Child has access</span>}
                    {p.child_can_edit && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">Child edits</span>}
                  </div>

                  <SmartLinkPanel sourceType="photo-album-tracker" sourceId={p.id} childId={p.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Photo albums support Quality Standard 1 (child-centred care),
          Quality Standard 9 (relationships), UNCRC Article 8 (right to identity), and Life Story work
          principles. Triple consent applies to every photo. Linked to Life Story Work, Personal Belongings,
          Media Publicity Consent, and Cards & Letters Tracker.
        </p>
      </div>
    </PageShell>
  );
}
