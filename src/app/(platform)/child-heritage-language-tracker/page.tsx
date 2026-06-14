"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Globe,
  BookOpen,
  MessageCircle,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Heart,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  HeritageLanguageRecord,
  HeritageLanguageStatus,
  LanguageIdentityImportance,
  HeritageSkillLevel,
} from "@/types/extended";
import {
  HERITAGE_LANGUAGE_STATUS_LABEL,
  LANGUAGE_IDENTITY_IMPORTANCE_LABEL,
} from "@/types/extended";
import { useHeritageLanguageRecords } from "@/hooks/use-heritage-language-records";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const statusColour: Record<HeritageLanguageStatus, string> = {
  mother_tongue: "bg-amber-100 text-amber-800",
  fluent: "bg-emerald-100 text-emerald-800",
  conversational: "bg-teal-100 text-teal-800",
  developing: "bg-blue-100 text-blue-800",
  receptive_only: "bg-purple-100 text-purple-800",
  lost_being_recovered: "bg-rose-100 text-rose-800",
};

const importanceColour: Record<LanguageIdentityImportance, string> = {
  central: "bg-amber-100 text-amber-800",
  important: "bg-teal-100 text-teal-800",
  becoming_important: "bg-blue-100 text-blue-800",
  mixed_feelings: "bg-slate-100 text-[var(--cs-navy)]",
  fading: "bg-rose-100 text-rose-800",
};

const exportCols: ExportColumn<HeritageLanguageRecord>[] = [
  { header: "Young Person", accessor: (r: HeritageLanguageRecord) => getYPName(r.child_id) },
  { header: "Recorded", accessor: (r: HeritageLanguageRecord) => r.recorded_date },
  {
    header: "Languages",
    accessor: (r: HeritageLanguageRecord) =>
      r.languages.map((l) => `${l.name} (${HERITAGE_LANGUAGE_STATUS_LABEL[l.status]})`).join("; "),
  },
  {
    header: "Primary Language at Placement",
    accessor: (r: HeritageLanguageRecord) => r.primary_language_at_placement,
  },
  {
    header: "Home Atmosphere Supports",
    accessor: (r: HeritageLanguageRecord) => (r.home_atmosphere_supports ? "Yes" : "No"),
  },
  {
    header: "Opportunities to Use",
    accessor: (r: HeritageLanguageRecord) => r.opportunities_to_use.join("; "),
  },
  {
    header: "Community Resources",
    accessor: (r: HeritageLanguageRecord) => r.community_resources.join("; "),
  },
  {
    header: "Family Contacts in Language",
    accessor: (r: HeritageLanguageRecord) =>
      r.family_contact_in_language
        .map((f) => `${f.person} (${f.relationship}) — ${f.language_used}`)
        .join("; "),
  },
  {
    header: "Reading Materials",
    accessor: (r: HeritageLanguageRecord) => r.reading_materials.join("; "),
  },
  { header: "Films/Music", accessor: (r: HeritageLanguageRecord) => r.films_music.join("; ") },
  { header: "Formal Learning", accessor: (r: HeritageLanguageRecord) => r.formal_learning ?? "" },
  { header: "Identity Importance", accessor: (r: HeritageLanguageRecord) => LANGUAGE_IDENTITY_IMPORTANCE_LABEL[r.identity_importance] },
  { header: "Child Voice", accessor: (r: HeritageLanguageRecord) => r.child_voice },
  { header: "Staff Observation", accessor: (r: HeritageLanguageRecord) => r.staff_observation },
  {
    header: "Flags/Concerns",
    accessor: (r: HeritageLanguageRecord) => r.flags_concerns.join("; "),
  },
  { header: "Next Step", accessor: (r: HeritageLanguageRecord) => r.next_step },
  { header: "Review Date", accessor: (r: HeritageLanguageRecord) => r.review_date },
  { header: "Key Worker", accessor: (r: HeritageLanguageRecord) => getStaffName(r.key_worker) },
];

const importanceOptions: LanguageIdentityImportance[] = [
  "central",
  "important",
  "becoming_important",
  "mixed_feelings",
  "fading",
];

function SkillBar({ level, label }: { level: HeritageSkillLevel; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-muted-foreground">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={cn(
              "h-2 w-4 rounded-sm",
              n <= level ? "bg-amber-500" : "bg-slate-200"
            )}
          />
        ))}
      </div>
      <span className="font-medium">{level}/5</span>
    </div>
  );
}

export default function ChildHeritageLanguageTrackerPage() {
  const { data: res, isLoading } = useHeritageLanguageRecords();
  const items = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterImportance, setFilterImportance] = useState("all");
  const [sortBy, setSortBy] = useState("recorded_date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...items];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => {
        const haystack = [
          getYPName(r.child_id),
          r.primary_language_at_placement,
          r.languages.map((l) => l.name).join(" "),
          r.opportunities_to_use.join(" "),
          r.community_resources.join(" "),
          r.child_voice,
          r.staff_observation,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    if (filterImportance !== "all") {
      list = list.filter((r) => r.identity_importance === filterImportance);
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "recorded_date":
          return b.recorded_date.localeCompare(a.recorded_date);
        case "review_date":
          return a.review_date.localeCompare(b.review_date);
        case "child_id":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "languageCount":
          return b.languages.length - a.languages.length;
        default:
          return 0;
      }
    });
    return list;
  }, [items, search, filterImportance, sortBy]);

  const childrenWithHeritage = items.filter((r) =>
    r.languages.some((l) => l.name !== "English")
  ).length;
  const motherTongueFluent = items.filter((r) =>
    r.languages.some((l) => l.status === "mother_tongue" && l.speaking_level === 5)
  ).length;
  const familyContactsCount = items.reduce(
    (acc, r) => acc + r.family_contact_in_language.length,
    0
  );
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 90);
  const horizonStr = horizon.toISOString().slice(0, 10);
  const reviewsDue90d = items.filter(
    (r) => r.review_date >= todayStr && r.review_date <= horizonStr
  ).length;

  if (isLoading) {
    return (
      <PageShell
        title="Heritage Language Tracker"
        subtitle="Per-child heritage language preservation and development — care preserves languages, never erases them"
      >
        <p>Loading…</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Heritage Language Tracker"
      subtitle="Per-child heritage language preservation and development — care preserves languages, never erases them"
      caraContext={{ pageTitle: "Heritage Language Tracker", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            data={items}
            columns={exportCols}
            filename="heritage-language-tracker"
          />
          <PrintButton title="Heritage Language Tracker" />
          <CaraStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{childrenWithHeritage}</p>
          <p className="text-xs text-muted-foreground">
            Children with heritage languages tracked
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">{motherTongueFluent}</p>
          <p className="text-xs text-muted-foreground">Mother-tongue fluent</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{familyContactsCount}</p>
          <p className="text-xs text-muted-foreground">Family contacts in language</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-rose-600">{reviewsDue90d}</p>
          <p className="text-xs text-muted-foreground">Reviews due (90 days)</p>
        </div>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-6 flex items-start gap-2">
        <Globe className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          A child&apos;s heritage language is a thread to family, identity, and belonging.
          Care preserves these languages — never erases them. We track, support, and actively
          develop each child&apos;s linguistic heritage with community and family input.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search child, language, community resource, voice…"
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm bg-white"
          />
        </div>
        <Select value={filterImportance} onValueChange={setFilterImportance}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Identity Importance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Identity Importance</SelectItem>
            {importanceOptions.map((imp) => (
              <SelectItem key={imp} value={imp}>
                {LANGUAGE_IDENTITY_IMPORTANCE_LABEL[imp]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recorded_date">By Recorded (newest)</SelectItem>
              <SelectItem value="review_date">By Review Date (soonest)</SelectItem>
              <SelectItem value="child_id">By Young Person</SelectItem>
              <SelectItem value="languageCount">By Languages (most)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;
          const primaryLang = r.languages[0];

          return (
            <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Globe className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {getYPName(r.child_id)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.primary_language_at_placement} &middot; recorded{" "}
                      {r.recorded_date} &middot; review {r.review_date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3 flex-wrap justify-end">
                  {primaryLang && (
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        statusColour[primaryLang.status]
                      )}
                    >
                      {primaryLang.name} — {HERITAGE_LANGUAGE_STATUS_LABEL[primaryLang.status]}
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      importanceColour[r.identity_importance]
                    )}
                  >
                    Identity: {LANGUAGE_IDENTITY_IMPORTANCE_LABEL[r.identity_importance]}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Languages & Skill Levels
                    </p>
                    <div className="space-y-2">
                      {r.languages.map((l, i) => (
                        <div
                          key={i}
                          className="bg-white rounded-lg p-3 border"
                        >
                          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                            <p className="font-medium text-sm">{l.name}</p>
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium",
                                statusColour[l.status]
                              )}
                            >
                              {HERITAGE_LANGUAGE_STATUS_LABEL[l.status]}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <SkillBar level={l.speaking_level} label="Speaking" />
                            <SkillBar level={l.reading_level} label="Reading" />
                            <SkillBar level={l.writing_level} label="Writing" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <MessageCircle className="h-3 w-3 inline mr-1" />
                        Opportunities to Use
                      </p>
                      <ul className="space-y-1">
                        {r.opportunities_to_use.map((o, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{o}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Community Resources
                      </p>
                      {r.community_resources.length > 0 ? (
                        <ul className="space-y-1">
                          {r.community_resources.map((c, i) => (
                            <li key={i} className="text-sm flex items-start gap-1">
                              <span className="text-teal-600 mt-0.5">•</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          None recorded
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Heart className="h-3 w-3 inline mr-1" />
                      Family Contact in Language
                    </p>
                    {r.family_contact_in_language.length > 0 ? (
                      <ul className="space-y-1">
                        {r.family_contact_in_language.map((f, i) => (
                          <li key={i} className="text-sm">
                            <span className="font-medium">{f.person}</span>{" "}
                            <span className="text-muted-foreground">
                              ({f.relationship})
                            </span>
                            — {f.language_used}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        None recorded
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <BookOpen className="h-3 w-3 inline mr-1" />
                        Reading Materials
                      </p>
                      {r.reading_materials.length > 0 ? (
                        <ul className="space-y-1">
                          {r.reading_materials.map((m, i) => (
                            <li key={i} className="text-sm flex items-start gap-1">
                              <span className="text-amber-600 mt-0.5">•</span>
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          None recorded
                        </p>
                      )}
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Films & Music
                      </p>
                      {r.films_music.length > 0 ? (
                        <ul className="space-y-1">
                          {r.films_music.map((m, i) => (
                            <li key={i} className="text-sm flex items-start gap-1">
                              <span className="text-teal-600 mt-0.5">•</span>
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          None recorded
                        </p>
                      )}
                    </div>
                  </div>

                  {r.formal_learning && (
                    <div className="bg-teal-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide mb-1">
                        Formal Learning
                      </p>
                      <p className="text-sm">{r.formal_learning}</p>
                    </div>
                  )}

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      Child&apos;s Voice
                    </p>
                    <p className="text-sm italic">&ldquo;{r.child_voice}&rdquo;</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                      Staff Observation
                    </p>
                    <p className="text-sm">{r.staff_observation}</p>
                  </div>

                  {r.flags_concerns.length > 0 && (
                    <div className="bg-rose-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-rose-800 uppercase tracking-wide mb-1">
                        Flags / Concerns
                      </p>
                      <ul className="space-y-1">
                        {r.flags_concerns.map((f, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-rose-600 mt-0.5">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                      Next Step
                    </p>
                    <p className="text-sm">{r.next_step}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Recorded: {r.recorded_date}</span>
                    <span>Review: {r.review_date}</span>
                    <span>Key worker: {getStaffName(r.key_worker)}</span>
                    <span>
                      Home atmosphere supports:{" "}
                      {r.home_atmosphere_supports ? "Yes" : "No"}
                    </span>
                  </div>

                  <SmartLinkPanel sourceType="heritage-language" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Heritage language preservation evidences UNCRC
          Articles 8 (preservation of identity), 13 (freedom of expression), 14 (freedom of
          thought, conscience and religion), 17 (access to information in own language) and
          30 (cultural identity and language of minorities). Underpins Children&apos;s Homes
          Regulations Quality Standard 6 (Enjoyment and Achievement — culturally affirming
          care), the Equality Act 2010 (race as a protected characteristic), and Working
          Together 2023 expectations on identity and culturally informed care. Linked to
          Cultural Identity, Language & Communication, Faith & Religion, and Family Contact
          pages.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Heritage Language Tracker — first language, bilingual support, translation, interpreter, cultural identity, heritage language classes, EAL, school language support, UASC, Annex A"
        recordType="direct_work"
        className="mt-6"
      />
    </PageShell>
  );
}
