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
  Star,
  Smile,
  Sun,
  Moon,
  AlertCircle,
  Sparkles,
  Music,
  Utensils,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PersonalPassport } from "@/types/extended";
import { usePersonalPassports } from "@/hooks/use-personal-passports";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";

const exportCols: ExportColumn<PersonalPassport>[] = [
  { header: "Young Person", accessor: (r: PersonalPassport) => getYPName(r.child_id) },
  { header: "Preferred Name", accessor: (r: PersonalPassport) => r.preferred_name },
  { header: "Pronouns", accessor: (r: PersonalPassport) => r.pronouns },
  { header: "Age", accessor: (r: PersonalPassport) => String(r.age) },
  { header: "Child Authored", accessor: (r: PersonalPassport) => r.child_authored ? "Yes" : "No" },
  { header: "Last Updated", accessor: (r: PersonalPassport) => r.last_updated },
  { header: "Reviewed With", accessor: (r: PersonalPassport) => getStaffName(r.reviewed_with) },
];

export default function PersonalPassportPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: res, isLoading } = usePersonalPassports();
  const records = res?.data ?? [];

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterYP !== "all") items = items.filter((p) => p.child_id === filterYP);
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.child_id.localeCompare(b.child_id);
        case "updated":
          return b.last_updated.localeCompare(a.last_updated);
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, sortBy, records]);

  const total = records.length;
  const allChildAuthored = records.every((p) => p.child_authored);
  const updatedRecently = records.filter((p) => p.last_updated >= new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)).length;

  return (
    <PageShell
      title="Personal Passport"
      subtitle="One-page 'all about me' for each child — co-authored, updated regularly, shared with everyone who supports them"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="personal-passports" />
          <PrintButton title="Personal Passports" />
        </div>
      }
    >
      {isLoading && <p className="text-center py-12 text-muted-foreground">Loading…</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Active Passports</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allChildAuthored ? "100%" : `${records.filter((p) => p.child_authored).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Child Authored</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{updatedRecently}</p>
          <p className="text-xs text-muted-foreground">Updated (30d)</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">100%</p>
          <p className="text-xs text-muted-foreground">Shared with Team</p>
        </div>
      </div>

      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-pink-600 mt-0.5 shrink-0" />
        <p className="text-sm text-pink-800">
          A Personal Passport is the child&apos;s document about themselves. It tells everyone who works with them
          who they are — beyond their case file. Read it before every shift if you&apos;re new. Update it every time
          something meaningful changes. Children own this document.
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
              <SelectItem value="updated">Recently Updated</SelectItem>
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
                  <Sparkles className="h-5 w-5 text-pink-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.preferred_name} ({p.pronouns}) &middot; age {p.age}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Last updated {p.last_updated} &middot; Reviewed with {getStaffName(p.reviewed_with)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {p.child_authored && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">Child Authored</span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                        <Star className="h-3 w-3 inline mr-1" />My Strengths
                      </p>
                      <ul className="space-y-1">
                        {p.my_strengths.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-emerald-600 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <Smile className="h-3 w-3 inline mr-1" />What Makes Me Happy
                      </p>
                      <ul className="space-y-1">
                        {p.what_makes_me_happy.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">
                        <AlertCircle className="h-3 w-3 inline mr-1" />What Upsets Me
                      </p>
                      <ul className="space-y-1">
                        {p.what_makes_me_upset.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-red-600 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                        <Heart className="h-3 w-3 inline mr-1" />What Helps When I&apos;m Upset
                      </p>
                      <ul className="space-y-1">
                        {p.what_helps_when_i_am_upset.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">My Interests</p>
                    <div className="flex flex-wrap gap-1">
                      {p.my_interests.map((i, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">{i}</span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <Utensils className="h-3 w-3 inline mr-1" />Favourite Food
                      </p>
                      <ul className="space-y-1">
                        {p.my_favourite_food.map((f, i) => (
                          <li key={i} className="text-sm">{f}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Don&apos;t Like</p>
                      <ul className="space-y-1">
                        {p.food_i_dont_like.map((f, i) => (
                          <li key={i} className="text-sm">{f}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <Music className="h-3 w-3 inline mr-1" />Music
                      </p>
                      <ul className="space-y-1">
                        {p.my_music.map((m, i) => (
                          <li key={i} className="text-sm">{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">My Family</p>
                    <p className="text-sm bg-white rounded-lg p-2 border">{p.my_family}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">My Friends</p>
                    <p className="text-sm bg-white rounded-lg p-2 border">{p.my_friends}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Important People</p>
                    <ul className="space-y-1">
                      {p.important_people.map((person, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Heart className="h-3 w-3 text-pink-500 mt-1 shrink-0" />
                          <span>{person}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">My Dreams</p>
                      <ul className="space-y-1">
                        {p.my_dreams.map((d, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Star className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">My Fears</p>
                      <ul className="space-y-1">
                        {p.my_fears.map((f, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Helpful Phrases</p>
                      <ul className="space-y-1">
                        {p.helpful_phrases.map((ph, i) => (
                          <li key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: `&bull; ${ph}` }} />
                        ))}
                      </ul>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">Unhelpful Phrases</p>
                      <ul className="space-y-1">
                        {p.unhelpful_phrases.map((ph, i) => (
                          <li key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: `&bull; ${ph}` }} />
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Things To Know About Me</p>
                    <ul className="space-y-1">
                      {p.things_to_know_about_me.map((t, i) => (
                        <li key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: `&bull; ${t}` }} />
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <Sun className="h-3 w-3 inline mr-1" />Routines
                      </p>
                      <ul className="space-y-1">
                        {p.my_routines.map((r, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <Moon className="h-3 w-3 inline mr-1" />Signs I&apos;m Not Okay
                      </p>
                      <ul className="space-y-1">
                        {p.signs_im_not_okay.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Things I&apos;m Working On</p>
                    <ul className="space-y-1">
                      {p.things_im_working_on.map((t, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Star className="h-3 w-3 text-emerald-500 mt-1 shrink-0" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-2 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Culture</p>
                      <p>{p.my_culture}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Faith</p>
                      <p>{p.my_faith}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Style</p>
                      <p>{p.my_style}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">School Life</p>
                      <p>{p.school_life}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">My Bedroom</p>
                    <p className="text-sm">{p.my_bedroom}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Last updated: {p.last_updated}</span>
                    <span>Reviewed with: {getStaffName(p.reviewed_with)}</span>
                    <span>Pronouns: {p.pronouns}</span>
                    {p.child_authored && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">Child Authored</span>}
                  </div>

                  <SmartLinkPanel sourceType="personal-passport" sourceId={p.id} childId={p.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Personal Passports support Quality Standard 1 (child-centred care),
          Quality Standard 7 (health and wellbeing), and UNCRC Article 12 (right to be heard). Updated monthly
          minimum or whenever the child requests changes. Linked to Children&apos;s Pledges, Care Plans, and
          Personal Passports are read by every new staff member before they work with each child.
        </p>
      </div>
    </PageShell>
  );
}
