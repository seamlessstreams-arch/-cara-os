"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Input } from "@/components/ui/input";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Palette,
  Music,
  Pen,
  Camera,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Award,
  Star,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectRecord {
  id: string;
  youngPerson: string;
  projectName: string;
  medium:
    | "Drawing"
    | "Painting"
    | "Music — instrument"
    | "Music — production"
    | "Singing"
    | "Writing — poetry"
    | "Writing — prose"
    | "Photography"
    | "Video"
    | "Coding"
    | "Crafts"
    | "Sculpture"
    | "Dance"
    | "Mixed media";
  status: "Idea" | "Active" | "Paused" | "Completed" | "Shared publicly";
  startedDate: string;
  lastWorkedOn: string;
  materialsCost: number;
  materialsFunding:
    | "Home budget"
    | "Pocket money"
    | "Family contribution"
    | "Grant/award"
    | "Free";
  skillsGrowing: string[];
  childInspiration: string;
  collaborators?: string;
  externalShowcase?: string;
  contestsEntered: { name: string; date: string; outcome?: string }[];
  childVoice: string;
  staffObservation: string;
  nextSteps: string[];
  flagsConcerns: string[];
  reviewDate: string;
  keyWorker: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: ProjectRecord[] = [
  {
    id: "ccp-001",
    youngPerson: "yp_jordan",
    projectName: "Match-Day Tactics — Jordan's Football Edits",
    medium: "Video",
    status: "Active",
    startedDate: "2024-11-04",
    lastWorkedOn: d(-2),
    materialsCost: 48,
    materialsFunding: "Home budget",
    skillsGrowing: [
      "Video editing (Capcut transitions, captions, slow-mo)",
      "Sports analysis vocabulary",
      "Self-presentation and pacing",
      "Audience awareness — what makes a clip land",
    ],
    childInspiration:
      "Wants to make the kind of clips he watches on YouTube — proper analysis, proper edits. Hopes to one day analyse Premier League games for a living.",
    collaborators: "Coach Mike (consents to filming at training); Devon (cousin, audience)",
    externalShowcase: "Private Instagram account (8 followers — close family + Coach Mike)",
    contestsEntered: [],
    childVoice:
      "I'm not just a player. I see the game. The edits make people see what I see.",
    staffObservation:
      "Edward sat with Jordan to set up the private account properly. Real growth in concentration — Jordan can spend 90 minutes editing without prompts. Coach Mike's positive response gave a confidence surge.",
    nextSteps: [
      "Edward to keep light-touch oversight of Instagram (privacy, comments)",
      "Explore Riverside FC's social channel — Coach Mike open to featuring a Jordan edit",
      "Look at Year 9 Media Studies as GCSE option",
    ],
    flagsConcerns: [
      "Public posting decisions need careful staging — currently private account is right",
    ],
    reviewDate: d(-7),
    keyWorker: "staff_edward",
  },
  {
    id: "ccp-002",
    youngPerson: "yp_jordan",
    projectName: "Bars in the Notebook — Jordan's Grime Lyrics",
    medium: "Writing — poetry",
    status: "Active",
    startedDate: "2024-08-20",
    lastWorkedOn: d(-5),
    materialsCost: 12,
    materialsFunding: "Pocket money",
    skillsGrowing: [
      "Lyrical craft (rhyme schemes, internal rhyme)",
      "Emotional vocabulary",
      "Self-reflection through writing",
      "Cultural literacy (UK grime tradition, lineage)",
    ],
    childInspiration:
      "Started after listening to Stormzy's older mixtapes with cousin Devon. Says writing helps him think about being Black, being in care, being a footballer — all at once.",
    collaborators: "Devon (cousin, sometimes reads bars back)",
    externalShowcase: undefined,
    contestsEntered: [],
    childVoice:
      "It's mine. Not for anyone yet. Maybe one day. Maybe not. The notebook is just for me.",
    staffObservation:
      "Chervelle aware of project — Jordan trusts her with it. We do not read the notebook unsolicited. Highly therapeutic; one of Jordan's strongest self-regulation tools.",
    nextSteps: [
      "Hold space — do not push Jordan to share before he's ready",
      "Cultural mentor (Saturday Club) is aware — open door if Jordan wants a more knowledgeable adult to share with",
      "Replace notebook when current one fills (Jordan asked for the same brand)",
    ],
    flagsConcerns: [],
    reviewDate: d(-14),
    keyWorker: "staff_chervelle",
  },
  {
    id: "ccp-003",
    youngPerson: "yp_alex",
    projectName: "Queer in Care — Alex's Poetry Collection",
    medium: "Writing — poetry",
    status: "Active",
    startedDate: "2024-06-10",
    lastWorkedOn: d(-3),
    materialsCost: 18,
    materialsFunding: "Pocket money",
    skillsGrowing: [
      "Poetic form (free verse, prose poetry)",
      "Identity articulation",
      "Editing and revision",
      "Courage to share at chosen moments",
    ],
    childInspiration:
      "Reading Andrew McMillan and Ocean Vuong with Anna. Wanted a place to say things about being queer and being in care that conversations couldn't hold.",
    collaborators: "Anna (gentle reader when Alex offers a poem)",
    externalShowcase:
      "One piece shared anonymously at Proud Trust youth group open-mic (Alex chose to read; well-received)",
    contestsEntered: [
      {
        name: "Foyle Young Poets of the Year (national)",
        date: "2025-04-30",
        outcome: "Submitted; awaiting result",
      },
    ],
    childVoice:
      "Writing it down means it can't be twisted into something else. The page just listens.",
    staffObservation:
      "Anna's relationship is the trusted bridge here. Alex's growth in articulating identity has been visible since starting. Boxing and poetry together — Alex's two pillars.",
    nextSteps: [
      "Continue to follow Alex's lead on what is shared and when",
      "Encourage entry to Proud Trust's annual youth anthology (Alex interested)",
      "Buy McMillan's new collection when out — Alex asked",
    ],
    flagsConcerns: [
      "If Foyle result negative, Anna ready to hold the disappointment carefully",
    ],
    reviewDate: d(-10),
    keyWorker: "staff_anna",
  },
  {
    id: "ccp-004",
    youngPerson: "yp_alex",
    projectName: "Boxing Portfolio — Alex Behind the Lens",
    medium: "Photography",
    status: "Active",
    startedDate: "2025-01-20",
    lastWorkedOn: d(-4),
    materialsCost: 220,
    materialsFunding: "Home budget",
    skillsGrowing: [
      "Composition (action capture, low light)",
      "Camera handling (manual mode, shutter priority)",
      "Curation — choosing best frames",
      "Permission and consent (asks before shooting)",
    ],
    childInspiration:
      "Coach James showed Alex some old fight photography books. Alex wants to document Riverside Boxing Club from the inside — a side most photographers don't get.",
    collaborators:
      "Coach James (gave written permission; introduces Alex to fighters before sessions)",
    externalShowcase: "Building portfolio — not yet shared externally",
    contestsEntered: [],
    childVoice:
      "I see the gym different from inside. The photos show what it actually feels like — not what people think it is.",
    staffObservation:
      "Lackson sources second-hand prime lens (50mm) for £80 — Alex thrilled. Photography giving Alex a quiet, observational role at the gym alongside the active boxing — a rich combination.",
    nextSteps: [
      "Print best 10 shots for portfolio binder",
      "Look at Reach Out Arts CIC — they run a youth photography exhibition annually",
      "Year 10 GCSE Photography possible — speak with school",
    ],
    flagsConcerns: [
      "All subjects must continue to give explicit permission — Alex understands this well",
    ],
    reviewDate: d(-7),
    keyWorker: "staff_anna",
  },
  {
    id: "ccp-005",
    youngPerson: "yp_casey",
    projectName: "Dot Painting — Casey's Sensory Canvases",
    medium: "Painting",
    status: "Active",
    startedDate: "2023-11-08",
    lastWorkedOn: d(-1),
    materialsCost: 165,
    materialsFunding: "Home budget",
    skillsGrowing: [
      "Fine motor control (dot precision)",
      "Colour theory (complementary, analogous)",
      "Patience and rhythm — sensory regulation through repetition",
      "Artistic voice (Casey's signature style emerging)",
    ],
    childInspiration:
      "Aboriginal dot art books from the library. Casey says the rhythm of dotting is the calmest her brain ever feels — like a switch.",
    collaborators: "Anna (sources materials; sits alongside in silence on dot days)",
    externalShowcase:
      "One canvas in Reach Out Arts CIC community exhibition (autumn 2024)",
    contestsEntered: [
      {
        name: "Riverside Junior Art Prize",
        date: "2025-03-15",
        outcome: "Highly commended (top 5 in age group)",
      },
    ],
    childVoice:
      "When I dot, my brain goes quiet. The world stops being too loud.",
    staffObservation:
      "Anna keeps a stocked supply box — Casey's most therapeutic activity. Highly commended at Junior Art Prize was a defining moment for Casey's identity as 'an artist'.",
    nextSteps: [
      "Frame the highly-commended piece for Casey's bedroom",
      "Explore an autism-friendly art residency programme (Anna researching)",
      "Continue Wednesday Sensory Art Group attendance",
    ],
    flagsConcerns: [],
    reviewDate: d(-14),
    keyWorker: "staff_anna",
  },
  {
    id: "ccp-006",
    youngPerson: "yp_casey",
    projectName: "Butterfly Sculptures — Clay Gifts",
    medium: "Sculpture",
    status: "Active",
    startedDate: "2025-02-28",
    lastWorkedOn: d(-6),
    materialsCost: 38,
    materialsFunding: "Home budget",
    skillsGrowing: [
      "3D form and balance",
      "Glazing and firing process",
      "Gift-giving as social skill",
      "Following through on a project for someone else",
    ],
    childInspiration:
      "Casey's friend Ellie loves butterflies. Ellie's mum Linda has been kind to Casey at pickups — Casey wants to make Linda a clay butterfly as a thank-you gift.",
    collaborators:
      "Sarah (Sensory Art Group leader, kiln access); Anna (transport, encouragement)",
    externalShowcase: "Will be a private gift to Linda when finished (planned for Linda's birthday, July)",
    contestsEntered: [],
    childVoice:
      "Linda is nice to me. The butterfly is to say thank you. It has to be the best one I've ever made.",
    staffObservation:
      "Major social-emotional milestone — Casey thinking about another person's joy and acting on it. Anna and Sarah supporting carefully so Casey can finish without overwhelm.",
    nextSteps: [
      "Glaze second attempt (first cracked in firing — disappointment managed well)",
      "Plan how Casey will hand the gift over (rehearse with Anna)",
      "Photograph finished piece for Casey's portfolio",
    ],
    flagsConcerns: [
      "Manage perfectionism gently — first one cracked; Casey rebounded with support",
    ],
    reviewDate: d(-7),
    keyWorker: "staff_anna",
  },
];

const mediumIcon = (m: ProjectRecord["medium"]) => {
  if (m.startsWith("Music") || m === "Singing") return Music;
  if (m.startsWith("Writing")) return Pen;
  if (m === "Photography" || m === "Video") return Camera;
  return Palette;
};

const statusColour: Record<string, string> = {
  Idea: "bg-slate-100 text-slate-700",
  Active: "bg-teal-100 text-teal-800",
  Paused: "bg-amber-100 text-amber-800",
  Completed: "bg-purple-100 text-purple-800",
  "Shared publicly": "bg-pink-100 text-pink-800",
};

const exportCols: ExportColumn<ProjectRecord>[] = [
  { header: "Young Person", accessor: (r: ProjectRecord) => getYPName(r.youngPerson) },
  { header: "Project", accessor: (r: ProjectRecord) => r.projectName },
  { header: "Medium", accessor: (r: ProjectRecord) => r.medium },
  { header: "Status", accessor: (r: ProjectRecord) => r.status },
  { header: "Started", accessor: (r: ProjectRecord) => r.startedDate },
  { header: "Last Worked On", accessor: (r: ProjectRecord) => r.lastWorkedOn },
  { header: "Materials £", accessor: (r: ProjectRecord) => `£${r.materialsCost}` },
  { header: "Funding", accessor: (r: ProjectRecord) => r.materialsFunding },
  { header: "Showcase", accessor: (r: ProjectRecord) => r.externalShowcase ?? "—" },
  { header: "Key Worker", accessor: (r: ProjectRecord) => getStaffName(r.keyWorker) },
  { header: "Reviewed", accessor: (r: ProjectRecord) => r.reviewDate },
];

export default function ChildCreativeProjectsPage() {
  const [search, setSearch] = useState("");
  const [filterMedium, setFilterMedium] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterMedium !== "all") items = items.filter((r) => r.medium === filterMedium);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (r) =>
          r.projectName.toLowerCase().includes(q) ||
          getYPName(r.youngPerson).toLowerCase().includes(q) ||
          r.childInspiration.toLowerCase().includes(q) ||
          r.medium.toLowerCase().includes(q),
      );
    }
    items.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return b.lastWorkedOn.localeCompare(a.lastWorkedOn);
        case "started":
          return b.startedDate.localeCompare(a.startedDate);
        case "cost":
          return b.materialsCost - a.materialsCost;
        case "yp":
          return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        default:
          return 0;
      }
    });
    return items;
  }, [search, filterMedium, sortBy]);

  const activeCount = data.filter((r) => r.status === "Active").length;
  const completedCount = data.filter((r) => r.status === "Completed").length;
  const sharedCount = data.filter((r) => r.status === "Shared publicly" || r.externalShowcase).length;
  const ytdCost = data.reduce((sum, r) => sum + r.materialsCost, 0);

  const mediums = Array.from(new Set(data.map((r) => r.medium)));

  return (
    <PageShell
      title="Child Creative Projects"
      subtitle="Per-child portfolios of creative work — therapeutic expression, identity, and growing skill"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="child-creative-projects" />
          <PrintButton title="Creative Projects" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">{activeCount}</p>
          <p className="text-xs text-muted-foreground">Active Projects</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{completedCount}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-pink-600">{sharedCount}</p>
          <p className="text-xs text-muted-foreground">Shared / Showcased</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">£{ytdCost}</p>
          <p className="text-xs text-muted-foreground">Materials Cost YTD</p>
        </div>
      </div>

      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Palette className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-900">
          Creative work is identity work. Each project is the child&apos;s voice taking form —
          we resource, witness, and protect the work without taking it over. The child decides
          what is shared and when.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-[220px] h-9"
          />
        </div>
        <Select value={filterMedium} onValueChange={setFilterMedium}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Mediums" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Mediums</SelectItem>
            {mediums.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recently Worked</SelectItem>
              <SelectItem value="started">Most Recently Started</SelectItem>
              <SelectItem value="cost">By Materials Cost</SelectItem>
              <SelectItem value="yp">By Young Person</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((p) => {
          const isExpanded = expandedId === p.id;
          const Icon = mediumIcon(p.medium);

          return (
            <div key={p.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-purple-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.projectName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getYPName(p.youngPerson)} &middot; Started {p.startedDate} &middot; Last worked {p.lastWorkedOn}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-teal-100 text-teal-800">
                    {p.medium}
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColour[p.status])}>
                    {p.status}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">
                    £{p.materialsCost}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Started</p>
                      <p className="font-medium">{p.startedDate}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Last Worked</p>
                      <p className="font-medium">{p.lastWorkedOn}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Materials</p>
                      <p className="font-medium">£{p.materialsCost}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Funding</p>
                      <p className="font-medium">{p.materialsFunding}</p>
                    </div>
                  </div>

                  <div className="bg-teal-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide mb-1">
                      <Star className="h-3 w-3 inline mr-1" />Skills Growing
                    </p>
                    <ul className="space-y-1">
                      {p.skillsGrowing.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Star className="h-3 w-3 text-teal-500 mt-1 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">
                      Child&apos;s Inspiration
                    </p>
                    <p className="text-sm italic">{p.childInspiration}</p>
                  </div>

                  {(p.collaborators || p.externalShowcase) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {p.collaborators && (
                        <div className="bg-white rounded-lg p-3 border">
                          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                            Collaborators
                          </p>
                          <p className="text-sm">{p.collaborators}</p>
                        </div>
                      )}
                      {p.externalShowcase && (
                        <div className="bg-pink-50 rounded-lg p-3 border border-pink-100">
                          <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">
                            External Showcase
                          </p>
                          <p className="text-sm">{p.externalShowcase}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {p.contestsEntered.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <Award className="h-3 w-3 inline mr-1" />Contests Entered
                      </p>
                      <ul className="space-y-1">
                        {p.contestsEntered.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Award className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            <span>
                              <strong>{c.name}</strong> ({c.date}){c.outcome ? ` — ${c.outcome}` : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      Child&apos;s Voice
                    </p>
                    <p className="text-sm italic">&ldquo;{p.childVoice}&rdquo;</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                      Staff Observation
                    </p>
                    <p className="text-sm">{p.staffObservation}</p>
                  </div>

                  {p.nextSteps.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Next Steps
                      </p>
                      <ul className="space-y-1">
                        {p.nextSteps.map((n, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-purple-600 mt-0.5">•</span>
                            <span>{n}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {p.flagsConcerns.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        Flags / Things to Watch
                      </p>
                      <ul className="space-y-1">
                        {p.flagsConcerns.map((f, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Key worker: {getStaffName(p.keyWorker)}</span>
                    <span>Reviewed: {p.reviewDate}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Creative project portfolios support Quality Standard 6
          (Enjoyment & Achievement) and uphold UNCRC Article 13 (freedom of expression) and Article 31
          (right to rest, play, leisure, and cultural life). Materials budget allocated per child.
          Linked to After-School Clubs, Activities, Cultural Identity, and Outcomes pages.
        </p>
      </div>
    </PageShell>
  );
}
