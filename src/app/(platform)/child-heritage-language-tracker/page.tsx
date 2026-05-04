"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
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

type LanguageStatus =
  | "Mother tongue"
  | "Fluent"
  | "Conversational"
  | "Developing"
  | "Receptive only"
  | "Lost — being recovered";

type IdentityImportance =
  | "Central"
  | "Important"
  | "Becoming important"
  | "Mixed feelings"
  | "Fading";

type SkillLevel = 1 | 2 | 3 | 4 | 5;

interface LanguageEntry {
  name: string;
  status: LanguageStatus;
  speakingLevel: SkillLevel;
  readingLevel: SkillLevel;
  writingLevel: SkillLevel;
}

interface FamilyContact {
  person: string;
  relationship: string;
  languageUsed: string;
}

interface LanguageRecord {
  id: string;
  youngPerson: string;
  recordedDate: string;
  languages: LanguageEntry[];
  primaryLanguageAtPlacement: string;
  homeAtmosphereSupports: boolean;
  opportunitiesToUse: string[];
  communityResources: string[];
  familyContactInLanguage: FamilyContact[];
  readingMaterials: string[];
  filmsMusic: string[];
  formalLearning?: string;
  identityImportance: IdentityImportance;
  childVoice: string;
  staffObservation: string;
  flagsConcerns: string[];
  nextStep: string;
  reviewDate: string;
  keyWorker: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: LanguageRecord[] = [
  {
    id: "hlt-001",
    youngPerson: "yp_jordan",
    recordedDate: d(-12),
    languages: [
      {
        name: "Urdu",
        status: "Mother tongue",
        speakingLevel: 5,
        readingLevel: 3,
        writingLevel: 2,
      },
      {
        name: "English",
        status: "Fluent",
        speakingLevel: 5,
        readingLevel: 5,
        writingLevel: 5,
      },
      {
        name: "Arabic (Quranic)",
        status: "Receptive only",
        speakingLevel: 2,
        readingLevel: 3,
        writingLevel: 1,
      },
    ],
    primaryLanguageAtPlacement:
      "Urdu (with mum); English in school and most peer settings",
    homeAtmosphereSupports: true,
    opportunitiesToUse: [
      "Weekly WhatsApp video call with mum — entirely in Urdu",
      "Friday mosque attendance with Yusuf (mosque mentor) — Urdu and Arabic",
      "Cooking with Chervelle on Pakistani-heritage food nights — Urdu food vocabulary",
      "Teaching Casey Urdu greetings and counting (Casey curious) — reinforcing Jordan's confidence",
    ],
    communityResources: [
      "Riverside Central Mosque — Urdu/Arabic Quran-school weekly",
      "Pakistani Cultural Association — monthly youth night",
      "Local Urdu library section (Riverside Central Library)",
    ],
    familyContactInLanguage: [
      {
        person: "Mum (Sabeen)",
        relationship: "Mother",
        languageUsed: "Urdu — exclusively",
      },
      {
        person: "Cousin Devon",
        relationship: "Cousin",
        languageUsed: "Mix of English and Urdu — code-switches",
      },
      {
        person: "Nani (maternal grandmother)",
        relationship: "Grandmother",
        languageUsed: "Urdu only — Jordan's grandmother does not speak English",
      },
    ],
    readingMaterials: [
      "Urdu writing practice book (Anna sourced — 'Urdu Qaida' beginner's primer)",
      "Bilingual children's stories from library",
      "Urdu Quran with English translation",
    ],
    filmsMusic: [
      "Pakistani drama serials with mum (weekend catch-up)",
      "Nusrat Fateh Ali Khan playlist (Jordan's choice)",
      "Bollywood films — exposure to Urdu/Hindi mix",
    ],
    formalLearning:
      "Mosque Quran-school 2x/week — Arabic recitation. Anna sourced Urdu writing book at Jordan's request — practising 30 mins twice a week with key worker support.",
    identityImportance: "Central",
    childVoice:
      "Urdu is mum's language. When I speak Urdu I'm me. I want my writing to be as good as my speaking — Nani won't read English so I want to write to her properly.",
    staffObservation:
      "Jordan's heritage language is a core thread of identity and family connection. Active development — Jordan teaches Casey words (pride and reciprocity). Writing the weakest skill, now actively addressed. Mosque mentor Yusuf is a consistent Urdu/Arabic adult presence.",
    flagsConcerns: [
      "Writing competence well below speaking — risk of literacy gap if not supported",
      "Arabic mostly Quranic/receptive — Jordan curious about conversational Arabic",
    ],
    nextStep:
      "Continue Urdu writing book sessions with Anna. Plan handwritten letter to Nani by next review. Explore community Urdu literacy class if Jordan wishes.",
    reviewDate: d(78),
    keyWorker: "staff_anna",
  },
  {
    id: "hlt-002",
    youngPerson: "yp_alex",
    recordedDate: d(-30),
    languages: [
      {
        name: "English",
        status: "Mother tongue",
        speakingLevel: 5,
        readingLevel: 5,
        writingLevel: 4,
      },
    ],
    primaryLanguageAtPlacement: "English — sole language",
    homeAtmosphereSupports: true,
    opportunitiesToUse: [
      "All home and school settings — English mother tongue",
      "Boxing club banter — Alex's preferred informal register",
    ],
    communityResources: [],
    familyContactInLanguage: [
      {
        person: "Dad (occasional contact)",
        relationship: "Father",
        languageUsed: "English",
      },
    ],
    readingMaterials: [
      "Sports biographies — chosen by Alex",
      "Graphic novels (preferred reading format)",
    ],
    filmsMusic: ["UK grime and drill", "Boxing documentaries"],
    identityImportance: "Mixed feelings",
    childVoice:
      "English is just what I speak. I don't really think about it as a heritage thing.",
    staffObservation:
      "No additional heritage language relevant for Alex — English mother tongue with no other family or community languages identified. Record maintained for completeness and to evidence non-discriminatory tracking; revisit if Alex expresses interest in language learning.",
    flagsConcerns: [],
    nextStep:
      "No active heritage language work. Annual review only unless Alex expresses interest.",
    reviewDate: d(330),
    keyWorker: "staff_edward",
  },
  {
    id: "hlt-003",
    youngPerson: "yp_casey",
    recordedDate: d(-21),
    languages: [
      {
        name: "English",
        status: "Mother tongue",
        speakingLevel: 5,
        readingLevel: 5,
        writingLevel: 5,
      },
      {
        name: "British Sign Language (BSL)",
        status: "Developing",
        speakingLevel: 2,
        readingLevel: 2,
        writingLevel: 1,
      },
      {
        name: "Urdu (greetings/counting)",
        status: "Developing",
        speakingLevel: 1,
        readingLevel: 1,
        writingLevel: 1,
      },
    ],
    primaryLanguageAtPlacement: "English — sole language at placement",
    homeAtmosphereSupports: true,
    opportunitiesToUse: [
      "BSL Level 1 evening class — Casey enrolled at Riverside Adult Learning",
      "Signing with Ellie's deaf cousin Maya at sleepovers — real-life practice",
      "Anna learning BSL alongside Casey — household reinforcement",
      "Jordan teaches Casey Urdu greetings — household cross-pollination",
    ],
    communityResources: [
      "Riverside Adult Learning — BSL Level 1 course (Casey is youngest learner — staff confirmed safeguarding plan)",
      "Local Deaf Community Centre — open tea afternoon attended once with Anna",
    ],
    familyContactInLanguage: [
      {
        person: "Mum (where contact appropriate)",
        relationship: "Mother",
        languageUsed: "English",
      },
    ],
    readingMaterials: [
      "BSL fingerspelling chart (in Casey's bedroom)",
      "'Sign with Me' illustrated dictionary",
    ],
    filmsMusic: [
      "BSL music videos on YouTube (Casey curates own playlist)",
      "Subtitled films preferred — sensory-friendly and BSL learning crossover",
    ],
    formalLearning:
      "BSL Level 1 evening course — 10 weeks, week 4 of 10. Anna attending with Casey for support and to build joint household skill.",
    identityImportance: "Becoming important",
    childVoice:
      "Maya is my best friend's cousin. I want to talk to her properly. Signing also feels good — it's quieter than talking. I like that words can be hands.",
    staffObservation:
      "Heritage of friendship and community — Casey's BSL learning rooted in genuine relationship with Maya, not abstract goal. Sensory crossover (visual-spatial, no auditory load) suits Casey. Cross-household enrichment: Jordan teaching Urdu greetings strengthens household belonging.",
    flagsConcerns: [
      "Monitor that BSL class environment remains right for Casey (sensory) — Anna present as anchor",
    ],
    nextStep:
      "Complete BSL Level 1 with Casey. Plan signed conversation milestone with Maya by end of course. Continue Urdu greetings exchange with Jordan.",
    reviewDate: d(60),
    keyWorker: "staff_anna",
  },
];

const statusColour: Record<LanguageStatus, string> = {
  "Mother tongue": "bg-amber-100 text-amber-800",
  Fluent: "bg-emerald-100 text-emerald-800",
  Conversational: "bg-teal-100 text-teal-800",
  Developing: "bg-blue-100 text-blue-800",
  "Receptive only": "bg-purple-100 text-purple-800",
  "Lost — being recovered": "bg-rose-100 text-rose-800",
};

const importanceColour: Record<IdentityImportance, string> = {
  Central: "bg-amber-100 text-amber-800",
  Important: "bg-teal-100 text-teal-800",
  "Becoming important": "bg-blue-100 text-blue-800",
  "Mixed feelings": "bg-slate-100 text-slate-800",
  Fading: "bg-rose-100 text-rose-800",
};

const exportCols: ExportColumn<LanguageRecord>[] = [
  { header: "Young Person", accessor: (r: LanguageRecord) => getYPName(r.youngPerson) },
  { header: "Recorded", accessor: (r: LanguageRecord) => r.recordedDate },
  {
    header: "Languages",
    accessor: (r: LanguageRecord) =>
      r.languages.map((l) => `${l.name} (${l.status})`).join("; "),
  },
  {
    header: "Primary Language at Placement",
    accessor: (r: LanguageRecord) => r.primaryLanguageAtPlacement,
  },
  {
    header: "Home Atmosphere Supports",
    accessor: (r: LanguageRecord) => (r.homeAtmosphereSupports ? "Yes" : "No"),
  },
  {
    header: "Opportunities to Use",
    accessor: (r: LanguageRecord) => r.opportunitiesToUse.join("; "),
  },
  {
    header: "Community Resources",
    accessor: (r: LanguageRecord) => r.communityResources.join("; "),
  },
  {
    header: "Family Contacts in Language",
    accessor: (r: LanguageRecord) =>
      r.familyContactInLanguage
        .map((f) => `${f.person} (${f.relationship}) — ${f.languageUsed}`)
        .join("; "),
  },
  {
    header: "Reading Materials",
    accessor: (r: LanguageRecord) => r.readingMaterials.join("; "),
  },
  { header: "Films/Music", accessor: (r: LanguageRecord) => r.filmsMusic.join("; ") },
  { header: "Formal Learning", accessor: (r: LanguageRecord) => r.formalLearning ?? "" },
  { header: "Identity Importance", accessor: (r: LanguageRecord) => r.identityImportance },
  { header: "Child Voice", accessor: (r: LanguageRecord) => r.childVoice },
  { header: "Staff Observation", accessor: (r: LanguageRecord) => r.staffObservation },
  {
    header: "Flags/Concerns",
    accessor: (r: LanguageRecord) => r.flagsConcerns.join("; "),
  },
  { header: "Next Step", accessor: (r: LanguageRecord) => r.nextStep },
  { header: "Review Date", accessor: (r: LanguageRecord) => r.reviewDate },
  { header: "Key Worker", accessor: (r: LanguageRecord) => getStaffName(r.keyWorker) },
];

function SkillBar({ level, label }: { level: SkillLevel; label: string }) {
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
  const [search, setSearch] = useState("");
  const [filterImportance, setFilterImportance] = useState("all");
  const [sortBy, setSortBy] = useState("recordedDate");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((r) => {
        const haystack = [
          getYPName(r.youngPerson),
          r.primaryLanguageAtPlacement,
          r.languages.map((l) => l.name).join(" "),
          r.opportunitiesToUse.join(" "),
          r.communityResources.join(" "),
          r.childVoice,
          r.staffObservation,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    if (filterImportance !== "all") {
      items = items.filter((r) => r.identityImportance === filterImportance);
    }
    items.sort((a, b) => {
      switch (sortBy) {
        case "recordedDate":
          return b.recordedDate.localeCompare(a.recordedDate);
        case "reviewDate":
          return a.reviewDate.localeCompare(b.reviewDate);
        case "youngPerson":
          return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        case "languageCount":
          return b.languages.length - a.languages.length;
        default:
          return 0;
      }
    });
    return items;
  }, [search, filterImportance, sortBy]);

  const childrenWithHeritage = data.filter((r) =>
    r.languages.some((l) => l.name !== "English")
  ).length;
  const motherTongueFluent = data.filter((r) =>
    r.languages.some((l) => l.status === "Mother tongue" && l.speakingLevel === 5)
  ).length;
  const familyContactsCount = data.reduce(
    (acc, r) => acc + r.familyContactInLanguage.length,
    0
  );
  const horizon = d(90);
  const today = d(0);
  const reviewsDue90d = data.filter(
    (r) => r.reviewDate >= today && r.reviewDate <= horizon
  ).length;

  const importanceOptions: IdentityImportance[] = [
    "Central",
    "Important",
    "Becoming important",
    "Mixed feelings",
    "Fading",
  ];

  return (
    <PageShell
      title="Heritage Language Tracker"
      subtitle="Per-child heritage language preservation and development — care preserves languages, never erases them"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            data={data}
            columns={exportCols}
            filename="heritage-language-tracker"
          />
          <PrintButton title="Heritage Language Tracker" />
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
                {imp}
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
              <SelectItem value="recordedDate">By Recorded (newest)</SelectItem>
              <SelectItem value="reviewDate">By Review Date (soonest)</SelectItem>
              <SelectItem value="youngPerson">By Young Person</SelectItem>
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
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Globe className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {getYPName(r.youngPerson)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.primaryLanguageAtPlacement} &middot; recorded{" "}
                      {r.recordedDate} &middot; review {r.reviewDate}
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
                      {primaryLang.name} — {primaryLang.status}
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      importanceColour[r.identityImportance]
                    )}
                  >
                    Identity: {r.identityImportance}
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
                              {l.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <SkillBar level={l.speakingLevel} label="Speaking" />
                            <SkillBar level={l.readingLevel} label="Reading" />
                            <SkillBar level={l.writingLevel} label="Writing" />
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
                        {r.opportunitiesToUse.map((o, i) => (
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
                      {r.communityResources.length > 0 ? (
                        <ul className="space-y-1">
                          {r.communityResources.map((c, i) => (
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
                    {r.familyContactInLanguage.length > 0 ? (
                      <ul className="space-y-1">
                        {r.familyContactInLanguage.map((f, i) => (
                          <li key={i} className="text-sm">
                            <span className="font-medium">{f.person}</span>{" "}
                            <span className="text-muted-foreground">
                              ({f.relationship})
                            </span>
                            — {f.languageUsed}
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
                      {r.readingMaterials.length > 0 ? (
                        <ul className="space-y-1">
                          {r.readingMaterials.map((m, i) => (
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
                      {r.filmsMusic.length > 0 ? (
                        <ul className="space-y-1">
                          {r.filmsMusic.map((m, i) => (
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

                  {r.formalLearning && (
                    <div className="bg-teal-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide mb-1">
                        Formal Learning
                      </p>
                      <p className="text-sm">{r.formalLearning}</p>
                    </div>
                  )}

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      Child&apos;s Voice
                    </p>
                    <p className="text-sm italic">&ldquo;{r.childVoice}&rdquo;</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                      Staff Observation
                    </p>
                    <p className="text-sm">{r.staffObservation}</p>
                  </div>

                  {r.flagsConcerns.length > 0 && (
                    <div className="bg-rose-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-rose-800 uppercase tracking-wide mb-1">
                        Flags / Concerns
                      </p>
                      <ul className="space-y-1">
                        {r.flagsConcerns.map((f, i) => (
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
                    <p className="text-sm">{r.nextStep}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Recorded: {r.recordedDate}</span>
                    <span>Review: {r.reviewDate}</span>
                    <span>Key worker: {getStaffName(r.keyWorker)}</span>
                    <span>
                      Home atmosphere supports:{" "}
                      {r.homeAtmosphereSupports ? "Yes" : "No"}
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
    </PageShell>
  );
}
