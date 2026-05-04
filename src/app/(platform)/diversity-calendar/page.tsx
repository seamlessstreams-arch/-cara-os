"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
  Globe,
  Heart,
  Star,
  BookOpen,
  Users,
  Sparkles,
  Clock,
  CheckCircle2,
  Loader2,
  Filter,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
type EventCategory = "religious" | "cultural" | "awareness" | "national" | "lgbtq+" | "disability";
type EventStatus = "upcoming" | "completed" | "in_progress";

interface CalendarEvent {
  id: string;
  name: string;
  date: string;
  dateRange?: string;
  category: EventCategory;
  description: string;
  howWeMarkIt: string;
  relevantToChildren: string;
  resources: string[];
  status: EventStatus;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: CalendarEvent[] = [
  {
    id: "dc_1",
    name: "Holocaust Memorial Day",
    date: d(-95),
    category: "awareness",
    description: "A national day of remembrance for the victims of the Holocaust and subsequent genocides. An opportunity to learn from the past and stand against prejudice and hatred today.",
    howWeMarkIt: "Age-appropriate discussion in key work sessions. Staff-led activity exploring the theme of standing up for others. Display in communal area with information and reflections.",
    relevantToChildren: "All",
    resources: ["Holocaust Memorial Day Trust educational packs", "Age-appropriate books on tolerance and standing up to injustice", "HMD Trust website activities"],
    status: "completed",
  },
  {
    id: "dc_2",
    name: "Chinese New Year",
    date: d(-90),
    category: "cultural",
    description: "The most important traditional festival in Chinese culture, celebrating the beginning of a new year on the lunisolar calendar. Marked with family gatherings, feasts, red decorations, and fireworks.",
    howWeMarkIt: "Special Chinese-themed meal prepared together. Red decorations displayed in the home. Discussion about Chinese culture and traditions in group session. Craft activity making paper lanterns.",
    relevantToChildren: "All",
    resources: ["Chinese cooking recipe cards", "Paper lantern craft kits", "Books about Chinese culture and traditions"],
    status: "completed",
  },
  {
    id: "dc_3",
    name: "International Women's Day",
    date: d(-55),
    category: "awareness",
    description: "A global day celebrating the social, economic, cultural, and political achievements of women. Also a call to action for accelerating gender equality.",
    howWeMarkIt: "Key work session discussing inspirational women and gender equality. Activity exploring women who have made a difference. Staff modelling positive conversations about gender roles and equality.",
    relevantToChildren: "All",
    resources: ["Inspirational women poster set", "Books on women in history for young people", "Discussion prompt cards"],
    status: "completed",
  },
  {
    id: "dc_4",
    name: "Autism Acceptance Week",
    date: d(-40),
    category: "disability",
    description: "A week dedicated to increasing understanding and acceptance of autism in society. Focuses on embracing neurodiversity and understanding the experiences of autistic people.",
    howWeMarkIt: "Staff training refresher on neurodiversity. Sensory-friendly activities available throughout the week. Key work discussion about neurodiversity and acceptance. Display board with information and positive messaging.",
    relevantToChildren: "All — particularly relevant to Casey (ASD diagnosis)",
    resources: ["National Autistic Society resources", "Sensory activity kits", "Books on neurodiversity for young people", "Staff guidance on autism-informed practice"],
    status: "completed",
  },
  {
    id: "dc_5",
    name: "Ramadan",
    date: d(-25),
    dateRange: d(-25) + " to " + d(5),
    category: "religious",
    description: "The ninth month of the Islamic calendar, observed by Muslims worldwide as a month of fasting, prayer, reflection, and community. Ends with the celebration of Eid al-Fitr.",
    howWeMarkIt: "Information display about Ramadan in communal area. Discussion about fasting, generosity, and community in key work. Special Eid meal prepared at the end of Ramadan. Staff awareness of any dietary considerations.",
    relevantToChildren: "All — promotes understanding of Islamic traditions",
    resources: ["Information booklets about Ramadan and Eid", "Halal recipe cards for Eid meal", "Crescent moon and star craft activity"],
    status: "in_progress",
  },
  {
    id: "dc_6",
    name: "Eid al-Fitr",
    date: d(6),
    category: "religious",
    description: "The festival marking the end of Ramadan, celebrated with communal prayers, feasting, giving of gifts, and spending time with family and friends.",
    howWeMarkIt: "Special celebratory meal with dishes from different Muslim cultures. Children involved in preparing food. Discussion about the significance of Eid and generosity. Decorations displayed in the home.",
    relevantToChildren: "All",
    resources: ["Eid cooking recipes from different cultures", "Decoration craft packs", "Books about Eid traditions"],
    status: "upcoming",
  },
  {
    id: "dc_7",
    name: "Mental Health Awareness Week",
    date: d(12),
    dateRange: d(12) + " to " + d(18),
    category: "awareness",
    description: "An annual event hosted by the Mental Health Foundation, raising awareness of mental health issues and promoting good mental health for all.",
    howWeMarkIt: "Daily wellbeing activities throughout the week. Key work sessions focused on emotional literacy and coping strategies. Wellbeing display board. Staff-led mindfulness sessions. Open conversations about feelings normalised.",
    relevantToChildren: "All — particularly supportive for Casey (anxiety)",
    resources: ["Mental Health Foundation resource packs", "Mindfulness activity cards", "Feelings and emotions workbooks", "CAMHS young people's leaflets"],
    status: "upcoming",
  },
  {
    id: "dc_8",
    name: "Pride Month",
    date: d(30),
    dateRange: d(30) + " to " + d(60),
    category: "lgbtq+",
    description: "An annual celebration of LGBTQ+ communities, commemorating the Stonewall riots and promoting equality, dignity, and increased visibility of LGBTQ+ people.",
    howWeMarkIt: "Rainbow display in communal area. Age-appropriate discussion about LGBTQ+ identities and acceptance in key work. Staff wearing rainbow lanyards to show allyship. Books and media representing LGBTQ+ families and young people made available.",
    relevantToChildren: "All — promoting acceptance and inclusion",
    resources: ["Stonewall young people's resources", "LGBTQ+ inclusive books for young people", "Rainbow craft activity packs", "Staff guidance from Stonewall on supporting LGBTQ+ young people in care"],
    status: "upcoming",
  },
  {
    id: "dc_9",
    name: "Windrush Day",
    date: d(50),
    category: "cultural",
    description: "A national day marking the anniversary of the arrival of HMT Empire Windrush at Tilbury Docks in 1948, celebrating the contribution of the Windrush generation and their descendants to British life.",
    howWeMarkIt: "Caribbean-themed meal prepared together. Key work discussion about the Windrush generation and Caribbean heritage in Britain. Display with information and photographs. Music session featuring Caribbean music.",
    relevantToChildren: "All — particularly relevant to Jordan (Jamaican heritage)",
    resources: ["Windrush educational resources", "Caribbean recipe cards", "Books about Black British history", "Music playlist of Caribbean genres"],
    status: "upcoming",
  },
  {
    id: "dc_10",
    name: "Refugee Week",
    date: d(52),
    dateRange: d(52) + " to " + d(58),
    category: "awareness",
    description: "A UK-wide festival celebrating the contributions, creativity, and resilience of refugees and people seeking sanctuary. Promotes understanding and empathy.",
    howWeMarkIt: "Key work session exploring what it means to seek safety and belonging. Art activity inspired by the annual theme. Discussion about empathy and welcoming others. Display with stories of refugee contributions to British society.",
    relevantToChildren: "All",
    resources: ["Refugee Week activity packs", "Age-appropriate books about refugee experiences", "Art supplies for themed activity", "Refugee Council educational resources"],
    status: "upcoming",
  },
  {
    id: "dc_11",
    name: "Black History Month",
    date: d(155),
    dateRange: d(155) + " to " + d(185),
    category: "cultural",
    description: "An annual observance in October dedicated to celebrating and recognising the achievements, contributions, and history of Black people in Britain and beyond.",
    howWeMarkIt: "Weekly themed activities throughout October. Key work sessions exploring Black British history and achievements. Special meal celebrating Caribbean and African cuisines. Display board with profiles of inspiring Black figures. Visit to local cultural centre or museum if appropriate.",
    relevantToChildren: "All — particularly relevant to Jordan (Black Caribbean heritage)",
    resources: ["Black History Month resource packs", "Books on Black British history for young people", "Recipe cards for Caribbean and African dishes", "Local museum/cultural centre programme", "Discussion prompt cards"],
    status: "upcoming",
  },
  {
    id: "dc_12",
    name: "Diwali",
    date: d(180),
    category: "religious",
    description: "The Hindu, Sikh, and Jain festival of lights, celebrating the triumph of light over darkness, good over evil, and knowledge over ignorance. Marked with lamps, fireworks, sweets, and family gatherings.",
    howWeMarkIt: "Diya lamp craft activity. Special Indian-themed meal prepared together. Discussion about the meaning of Diwali and its significance. Decorations with lights and rangoli patterns. Key work session on Hindu and Sikh traditions.",
    relevantToChildren: "All",
    resources: ["Diya lamp craft kits", "Indian recipe cards", "Rangoli pattern templates", "Books about Diwali and Hindu traditions"],
    status: "upcoming",
  },
];

/* ── constants ───────────────────────────────────────────────────────── */
const CATEGORY_LABELS: Record<EventCategory, string> = {
  religious: "Religious", cultural: "Cultural", awareness: "Awareness",
  national: "National", "lgbtq+": "LGBTQ+", disability: "Disability",
};

const CATEGORY_COLOURS: Record<EventCategory, string> = {
  religious: "bg-purple-100 text-purple-800",
  cultural: "bg-amber-100 text-amber-800",
  awareness: "bg-blue-100 text-blue-800",
  national: "bg-red-100 text-red-800",
  "lgbtq+": "bg-pink-100 text-pink-800",
  disability: "bg-teal-100 text-teal-800",
};

const CATEGORY_ICONS: Record<EventCategory, typeof Globe> = {
  religious: Star,
  cultural: Globe,
  awareness: Heart,
  national: Users,
  "lgbtq+": Sparkles,
  disability: BookOpen,
};

const STATUS_LABELS: Record<EventStatus, string> = {
  upcoming: "Upcoming", completed: "Completed", in_progress: "In Progress",
};

const STATUS_COLOURS: Record<EventStatus, string> = {
  upcoming: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  in_progress: "bg-orange-100 text-orange-800",
};

const STATUS_ICONS: Record<EventStatus, typeof Clock> = {
  upcoming: Clock,
  completed: CheckCircle2,
  in_progress: Loader2,
};

/* ── component ───────────────────────────────────────────────────────── */
export default function DiversityCalendarPage() {
  const [events] = useState<CalendarEvent[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  /* derived */
  const upcoming = events.filter((e) => e.status === "upcoming").length;
  const inProgress = events.filter((e) => e.status === "in_progress").length;
  const completed = events.filter((e) => e.status === "completed").length;
  const categories = [...new Set(events.map((e) => e.category))];

  const filtered = useMemo(() => {
    let list = events;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    }
    if (filterCategory !== "all") list = list.filter((e) => e.category === filterCategory);
    if (filterStatus !== "all") list = list.filter((e) => e.status === filterStatus);
    return list;
  }, [events, search, filterCategory, filterStatus]);

  return (
    <PageShell
      title="Diversity & Cultural Calendar"
      subtitle="Religious observances, awareness days, and cultural celebrations — and how we mark them in the home"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Diversity & Cultural Calendar" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── summary stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Upcoming Events", value: upcoming, icon: Clock, colour: "text-blue-600" },
            { label: "In Progress", value: inProgress, icon: Loader2, colour: "text-orange-600" },
            { label: "Completed", value: completed, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Categories Covered", value: categories.length, icon: Globe, colour: "text-purple-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── filters ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
            />
          </div>

          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-gray-400" />
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setFilterCategory("all")}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                  filterCategory === "all"
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                All Categories
              </button>
              {(Object.entries(CATEGORY_LABELS) as [EventCategory, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilterCategory(filterCategory === key ? "all" : key)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                    filterCategory === key
                      ? CATEGORY_COLOURS[key]
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1">
            {(Object.entries(STATUS_LABELS) as [EventStatus, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                  filterStatus === key
                    ? STATUS_COLOURS[key]
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── event cards ────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
              No events match the current filters.
            </div>
          )}

          {filtered.map((event) => {
            const isExpanded = expanded === event.id;
            const Icon = CATEGORY_ICONS[event.category];
            const StatusIcon = STATUS_ICONS[event.status];

            return (
              <div key={event.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : event.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn("rounded-lg p-2 shrink-0", CATEGORY_COLOURS[event.category])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{event.name}</p>
                        <Badge className={cn("text-xs", CATEGORY_COLOURS[event.category])}>
                          {CATEGORY_LABELS[event.category]}
                        </Badge>
                        <Badge className={cn("text-xs", STATUS_COLOURS[event.status])}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {STATUS_LABELS[event.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {event.dateRange || event.date}
                        {event.relevantToChildren !== "All" && (
                          <span className="ml-2">
                            <Users className="inline h-3 w-3 mr-1" />
                            {event.relevantToChildren}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 ml-2">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* description */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">What is it?</p>
                      <p className="text-sm">{event.description}</p>
                    </div>

                    {/* how we mark it */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">How We Mark It</p>
                      <p className="text-sm">{event.howWeMarkIt}</p>
                    </div>

                    {/* relevant to */}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="text-muted-foreground">Relevant to:</span>{" "}
                        <span className="font-medium">{event.relevantToChildren}</span>
                      </span>
                    </div>

                    {/* resources */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Resources & Activities</p>
                      <div className="flex flex-wrap gap-1">
                        {event.resources.map((r, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-blue-50">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* date info */}
                    <div className="text-xs text-muted-foreground">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      Date: {event.dateRange || event.date} · Status: {STATUS_LABELS[event.status]}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory note ────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Equality Act 2010 &amp; Cultural Identity:</strong> Children&apos;s homes must actively
          promote diversity and inclusion, ensuring that every child&apos;s cultural, religious, and
          linguistic background is understood, respected, and celebrated. The home must provide
          opportunities for children to learn about and engage with a range of cultures, faiths, and
          identities, supporting them to develop a positive sense of self. This calendar supports
          compliance with Regulation 5 (engaging with wider society) and Regulation 11 (providing
          an environment that promotes equality and diversity), ensuring that the home is a place
          where all children feel valued and represented.
        </div>
      </div>
    </PageShell>
  );
}
