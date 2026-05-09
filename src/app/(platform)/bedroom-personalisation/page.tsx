"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useBedroomProfiles } from "@/hooks/use-bedroom-profiles";
import type { BedroomProfile } from "@/types/extended";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Home,
  Heart,
  Palette,
  Star,
  Lightbulb,
  Sparkles,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const exportCols: ExportColumn<BedroomProfile>[] = [
  { header: "Young Person", accessor: (r: BedroomProfile) => getYPName(r.child_id) },
  { header: "Room", accessor: (r: BedroomProfile) => r.room_number },
  { header: "Themes", accessor: (r: BedroomProfile) => r.decor_themes.join("; ") },
  { header: "Furniture Items", accessor: (r: BedroomProfile) => r.furniture_items.length.toString() },
  { header: "Budget Spent", accessor: (r: BedroomProfile) => `£${r.total_budget_spent}` },
  { header: "Budget Remaining", accessor: (r: BedroomProfile) => `£${r.budget_remaining}` },
  { header: "Child Satisfaction", accessor: (r: BedroomProfile) => `${r.child_satisfaction_rating}/5` },
  { header: "Last Reviewed", accessor: (r: BedroomProfile) => r.review_date },
];

export default function BedroomPersonalisationPage() {
  const { data: res, isLoading } = useBedroomProfiles();
  const data = useMemo(() => res?.data ?? [], [res]);
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <PageShell title="Bedroom Personalisation" subtitle="Each child's bedroom — co-designed, individually meaningful, sensory-aware">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const filtered = (() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((b) => b.child_id === filterYP);
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.child_id.localeCompare(b.child_id);
        case "satisfaction":
          return b.child_satisfaction_rating - a.child_satisfaction_rating;
        case "review":
          return a.review_date.localeCompare(b.review_date);
        default:
          return 0;
      }
    });
    return items;
  })();

  const total = data.length;
  const allChildAuthored = data.every((b) => b.child_authored);
  const avgSatisfaction = (data.reduce((sum, b) => sum + b.child_satisfaction_rating, 0) / Math.max(1, data.length)).toFixed(1);
  const totalBudget = data.reduce((sum, b) => sum + b.total_budget_spent + b.budget_remaining, 0);

  return (
    <PageShell
      title="Bedroom Personalisation"
      subtitle="Each child's bedroom — co-designed, individually meaningful, sensory-aware"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="bedroom-personalisation" />
          <PrintButton title="Bedroom Personalisation" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Personalised Rooms</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allChildAuthored ? "100%" : `${data.filter((b) => b.child_authored).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Co-Designed</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{avgSatisfaction}/5</p>
          <p className="text-xs text-muted-foreground">Avg Satisfaction</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">£{totalBudget}</p>
          <p className="text-xs text-muted-foreground">Personalisation Budget</p>
        </div>
      </div>

      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3 mb-6 flex items-start gap-2">
        <Home className="h-4 w-4 text-pink-600 mt-0.5 shrink-0" />
        <p className="text-sm text-pink-800">
          A bedroom is a child&apos;s sanctuary. Every room reflects the child who lives in it — colours,
          themes, personal items, sensory needs. Bedrooms are co-designed and respected: staff knock and wait,
          don&apos;t move things without permission, and treat each room as private space.
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
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="satisfaction">By Satisfaction</SelectItem>
              <SelectItem value="review">Earliest Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((b) => {
          const isExpanded = expandedId === b.id;

          return (
            <div key={b.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : b.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Home className="h-5 w-5 text-pink-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(b.child_id)} &middot; {b.room_number}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {b.decor_themes.slice(0, 3).join(" · ")} &middot; £{b.total_budget_spent} of £{b.total_budget_spent + b.budget_remaining} spent
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-sm font-bold text-amber-600">{b.child_satisfaction_rating}/5</span>
                  {b.child_authored && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <Palette className="h-3 w-3 inline mr-1" />Wall Colours
                      </p>
                      <ul className="space-y-1">
                        {b.wall_colours.map((c, i) => (
                          <li key={i} className="text-sm">{c}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Decor Themes</p>
                      <div className="flex flex-wrap gap-1">
                        {b.decor_themes.map((t, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Furniture</p>
                    <div className="space-y-1">
                      {b.furniture_items.map((f, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-start justify-between gap-2">
                          <div>
                            <span className="font-medium">{f.item}</span>
                            {f.special_note && <p className="text-xs text-muted-foreground mt-0.5">{f.special_note}</p>}
                          </div>
                          {f.child_chose && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium shrink-0">Child chose</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Sparkles className="h-3 w-3 inline mr-1" />Personal Artwork &amp; Photos
                    </p>
                    <ul className="space-y-1">
                      {[...b.personal_artwork_displayed, ...b.photos_displayed].map((p, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-pink-600 mt-0.5">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                      <Heart className="h-3 w-3 inline mr-1" />Comfort Items
                    </p>
                    <ul className="space-y-1">
                      {b.comfort_items.map((c, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Heart className="h-3 w-3 text-pink-500 mt-1 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tech Setup</p>
                    <div className="space-y-1">
                      {b.tech_setup.map((t, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <p className="font-medium">{t.device}</p>
                          <p className="text-xs text-muted-foreground">Rules: {t.agreed_use_rules} &middot; Location: {t.location_in_room}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {b.sensory_accommodations.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Sensory Accommodations</p>
                      <ul className="space-y-1">
                        {b.sensory_accommodations.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Lightbulb className="h-3 w-3 text-purple-500 mt-1 shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Meaningful Items</p>
                    <div className="space-y-1">
                      {b.meaningful_items.map((m, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <p className="font-medium">{m.item}</p>
                          <p className="text-xs text-muted-foreground">{m.significance}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Private Space</p>
                    <ul className="space-y-1">
                      {b.private_space.map((p, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Star className="h-3 w-3 inline mr-1" />Recent Changes
                    </p>
                    <ul className="space-y-1">
                      {b.recent_changes.map((c, i) => (
                        <li key={i} className="text-sm">
                          <span className="text-xs text-muted-foreground">{c.date}:</span> {c.change}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {b.improvement_wishes.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Wishes / Future Improvements</p>
                      <ul className="space-y-1">
                        {b.improvement_wishes.map((w, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Sparkles className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Reviewed: {b.review_date} with {getStaffName(b.reviewed_with)}</span>
                    <span>Budget: £{b.total_budget_spent} spent / £{b.budget_remaining} remaining</span>
                    <span>Satisfaction: {b.child_satisfaction_rating}/5</span>
                    {b.child_authored && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Child Co-Designed</span>}
                  </div>

                  <SmartLinkPanel sourceType="bedroom-profiles" sourceId={b.id} childId={b.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Bedroom personalisation supports Quality Standard 1
          (child-centred care), Quality Standard 7 (health and wellbeing — including sensory and sleep),
          Children&apos;s Homes Regulations 2015 Schedule 1 (homely environment), and UNCRC Article 16
          (right to privacy). Each child has a personalisation budget; bedrooms are co-designed and
          respected as private space.
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
