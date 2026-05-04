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

interface PersonalPassport {
  id: string;
  youngPerson: string;
  preferredName: string;
  pronouns: string;
  age: number;
  myStrengths: string[];
  whatMakesMeHappy: string[];
  whatMakesMeUpset: string[];
  whatHelpsWhenIamUpset: string[];
  myInterests: string[];
  myFavouriteFood: string[];
  foodIDontLike: string[];
  myMusic: string[];
  myFriends: string;
  myFamily: string;
  myDreams: string[];
  myFears: string[];
  importantPeople: string[];
  myRoutines: string[];
  thingsImWorkingOn: string[];
  signsImNotOkay: string[];
  thingsToKnowAboutMe: string[];
  myCulture: string;
  myFaith: string;
  myStyle: string;
  myBedroom: string;
  schoolLife: string;
  helpfulPhrases: string[];
  unhelpfulPhrases: string[];
  childAuthored: boolean;
  lastUpdated: string;
  reviewedWith: string;
  reviewWithChildDate: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: PersonalPassport[] = [
  {
    id: "pp-001",
    youngPerson: "yp_alex",
    preferredName: "Alex",
    pronouns: "he/him",
    age: 13,
    myStrengths: [
      "I'm a good friend when I trust someone",
      "I'm getting really good at boxing",
      "I'm honest — even when it's hard",
      "I'm braver than people think",
      "I notice things other people miss",
    ],
    whatMakesMeHappy: [
      "Boxing club nights",
      "When my key worker remembers stuff I told them",
      "Beating someone at FIFA",
      "Hot chocolate before bed",
      "Earning my own money",
    ],
    whatMakesMeUpset: [
      "Being told to hurry up",
      "Adults arguing or shouting (even if not at me)",
      "When people break promises",
      "Feeling stupid at school",
      "Surprise changes to the day",
    ],
    whatHelpsWhenIamUpset: [
      "Space — give me 10 minutes alone first",
      "Then someone offering to walk with me",
      "Don't try to fix it straight away",
      "Hot chocolate is good",
      "Boxing helps the next day",
    ],
    myInterests: ["Boxing", "Football (Arsenal fan)", "Gaming", "Music", "Cooking"],
    myFavouriteFood: ["Chicken curry", "Spaghetti bolognese", "Cookies", "Anything with cheese", "Mum's roast (when I see her)"],
    foodIDontLike: ["Mushrooms (texture)", "Spicy food I don't choose myself", "Fish (most kinds)"],
    myMusic: ["UK rap (Stormzy, Dave)", "R&B sometimes", "Coach plays oldies at boxing — I secretly like them"],
    myFriends: "Two close friends from school. Some friends from boxing. Try to keep different groups separate.",
    myFamily: "Mum (I love her, it's complicated). Younger sister at mum's. Don't see Dad. Maternal Gran is important.",
    myDreams: [
      "Be a boxing coach",
      "Have my own place by 18",
      "Make Mum proud",
      "Help kids who've had it tough",
    ],
    myFears: [
      "Being moved again",
      "Mum getting hurt",
      "Failing my GCSEs",
      "People finding out about my past",
    ],
    importantPeople: [
      "Anna (key worker — she gets me)",
      "Coach James at boxing",
      "Mum",
      "Maternal Grandma",
      "Sarah (social worker)",
    ],
    myRoutines: [
      "Bedtime 21:30 (with phone wind-down at 21:00)",
      "Boxing Tuesday and Thursday",
      "Hot chocolate with Anna before bed when she's on shift",
    ],
    thingsImWorkingOn: [
      "Not getting overwhelmed",
      "Asking for help instead of going quiet",
      "Sticking with school even when it's hard",
    ],
    signsImNotOkay: [
      "Going quiet (this is the big one)",
      "Sleeping more",
      "Not wanting to go to boxing",
      "Picking arguments with Jordan",
    ],
    thingsToKnowAboutMe: [
      "I have ADHD — sometimes my brain just needs to MOVE",
      "I'm not lazy when I look like I'm doing nothing",
      "I take medication in the morning — please remind me but don't make a thing of it",
      "I'm proud of how far I've come",
    ],
    myCulture: "British. Mixed heritage on Mum's side. We don't really do big cultural stuff but I want to learn more.",
    myFaith: "Don't really believe in any religion. Mum's family is loosely Christian. I'm respectful of others' faith.",
    myStyle: "Comfortable. Tracksuits mostly. Trainers are important to me.",
    myBedroom: "Tidy when I'm feeling good, messy when I'm not. Football scarf on wall. Phone charger always sorted. Don't move my stuff.",
    schoolLife: "Year 9. Maths is hard, English is okay, PE is best. Trying to attend more — was on PRU last year.",
    helpfulPhrases: [
      "&apos;Take your time&apos;",
      "&apos;What would help right now?&apos;",
      "&apos;I noticed you...&apos; (without it being a thing)",
      "&apos;You&apos;ve got this&apos;",
    ],
    unhelpfulPhrases: [
      "&apos;Just calm down&apos;",
      "&apos;You should be grateful&apos;",
      "&apos;Stop being dramatic&apos;",
      "&apos;Why can&apos;t you just...&apos;",
    ],
    childAuthored: true,
    lastUpdated: d(-21),
    reviewedWith: "staff_anna",
    reviewWithChildDate: d(-21),
  },
  {
    id: "pp-002",
    youngPerson: "yp_jordan",
    preferredName: "Jordan",
    pronouns: "he/him",
    age: 13,
    myStrengths: [
      "I lead well — football team captain",
      "I'm loyal to the people I love",
      "I'm funny",
      "I'm good with younger kids",
      "I don't give up",
    ],
    whatMakesMeHappy: [
      "Football match days",
      "Cooking with the team",
      "Talking to Mum on the phone",
      "When my hair looks good",
      "Being trusted with stuff",
    ],
    whatMakesMeUpset: [
      "Being told what to do without explanation",
      "When people act like they know me but they don't",
      "Stuff about Mum I can't fix",
      "Other kids being unfair",
    ],
    whatHelpsWhenIamUpset: [
      "Being asked, not told, what I need",
      "Music in my room with door slightly open",
      "Football",
      "Time with Chervelle (key worker)",
    ],
    myInterests: ["Football (Manchester United)", "Music", "Skincare and style", "Cooking", "Hanging with mates"],
    myFavouriteFood: ["Jollof rice", "Roast chicken", "Plantain", "Chocolate ice cream", "Anyone's home cooking"],
    foodIDontLike: ["Sprouts", "Anything overcooked", "Cold food that should be hot"],
    myMusic: ["Afrobeats", "UK rap", "Gospel sometimes", "Old-school R&B from Mum's playlist"],
    myFriends: "Best mate Tyrese from school. Football team lads. Some friends I don't see anymore (it's complicated).",
    myFamily: "Mum (I love her — she's been through a lot). Sister Tia (younger, with foster carer). Maternal grandparents complicated.",
    myDreams: [
      "Play professional football",
      "Have my own family one day",
      "Get Mum stable so we can have a real relationship",
      "Travel — see Africa",
    ],
    myFears: [
      "Mum disappearing again",
      "Being like the men in my history",
      "Losing football",
      "Letting people down",
    ],
    importantPeople: [
      "Mum (most important person in my life)",
      "Chervelle (key worker)",
      "Coach Mike (football)",
      "Sister Tia",
      "Tyrese (best mate)",
    ],
    myRoutines: [
      "Bedtime 22:00 (10:00pm)",
      "Football Tuesday, Thursday, Saturday match",
      "Phone call with Mum on Sundays",
    ],
    thingsImWorkingOn: [
      "Telling people when I'm struggling instead of disappearing",
      "Trusting that people will stay",
      "Boundaries with old mates from before",
    ],
    signsImNotOkay: [
      "Skipping football",
      "Quiet at meals",
      "Phone glued to me more than usual",
      "Wanting to be alone for hours",
    ],
    thingsToKnowAboutMe: [
      "Music is part of how I process — let me have it loud sometimes",
      "I look tougher than I feel",
      "If I leave the room mid-conversation, I&apos;ll come back. Let me",
      "I&apos;m proud of being Black — please respect that",
    ],
    myCulture: "Black British of Caribbean and West African heritage. Important to me. I want to know more, do more, eat more cultural food.",
    myFaith: "Mum's family is Christian. I'm not sure what I believe yet. Respect for the church.",
    myStyle: "Sharp. Trainers, fresh haircut, gold chain. Skincare routine is non-negotiable.",
    myBedroom: "My space. Football kit organised. Photos of Mum and Tia. Speaker for music. My sanctuary.",
    schoolLife: "Year 9. Doing alright. Maths and English are my best. PE my passion. Some teachers get me, some don't.",
    helpfulPhrases: [
      "&apos;What would help, mate?&apos;",
      "&apos;You&apos;re doing well&apos; (specific)",
      "&apos;Take your time&apos;",
      "Football compliments — they really land",
    ],
    unhelpfulPhrases: [
      "&apos;Boys don&apos;t cry&apos; (people actually still say this)",
      "&apos;Your mum...&apos; from someone who doesn&apos;t know her",
      "&apos;Just behave&apos;",
      "Anything that sounds like a teacher told off in front of mates",
    ],
    childAuthored: true,
    lastUpdated: d(-14),
    reviewedWith: "staff_chervelle",
    reviewWithChildDate: d(-14),
  },
  {
    id: "pp-003",
    youngPerson: "yp_casey",
    preferredName: "Casey",
    pronouns: "they/them (Casey doesn't mind she/her either, please ask)",
    age: 12,
    myStrengths: [
      "I notice patterns",
      "I'm good at art",
      "I remember things really well",
      "I can read faces and feelings if I try",
      "I'm kind to animals",
    ],
    whatMakesMeHappy: [
      "Drawing",
      "My weighted blanket",
      "Otter (my soft toy)",
      "Sensory bath bombs (specific brand)",
      "Anna being on shift",
      "Quiet days",
    ],
    whatMakesMeUpset: [
      "Sudden changes",
      "Bright lights",
      "Loud noises (especially shouting)",
      "Being touched without warning",
      "Different food when I expect the same",
    ],
    whatHelpsWhenIamUpset: [
      "My weighted blanket",
      "Quiet — please stop talking when I'm overwhelmed",
      "Otter",
      "Art materials",
      "Time alone in my room",
      "Visual cards to point at how I feel",
    ],
    myInterests: ["Art (especially watercolour and sketching)", "Animals (especially otters and foxes)", "Reading (specific authors)", "Nature documentaries", "Specific YouTubers"],
    myFavouriteFood: ["Cheerios with cold milk", "Plain toast", "Mac and cheese (specific recipe)", "Apple slices", "Vanilla ice cream (no toppings)"],
    foodIDontLike: ["Mixed textures (e.g. soup with bits)", "Spicy food", "Strong smells", "Anything that touches another food on the plate"],
    myMusic: ["Calm classical (Ludovico Einaudi)", "Ambient music", "My specific sleep playlist", "Nothing with words when I'm regulating"],
    myFriends: "One friend from art group (Ellie). I find friends hard but I'm trying. Animals are my best friends really.",
    myFamily: "Birth family is complicated and I don't want to talk about them mostly. Anna feels like family now.",
    myDreams: [
      "Be an artist or vet",
      "Have a forever family",
      "Travel to see otters in the wild",
      "Live somewhere quiet with a garden",
    ],
    myFears: [
      "Loud places",
      "Being misunderstood",
      "Having to leave Oak House",
      "Losing Otter",
    ],
    importantPeople: [
      "Anna (key worker — she really sees me)",
      "Ellie (art group friend)",
      "Lisa (my social worker)",
      "Sarah (art therapist)",
    ],
    myRoutines: [
      "Bedtime 20:30 with melatonin",
      "Wake 07:30 to specific playlist",
      "Same breakfast routine every day",
      "Visual schedule for every day",
      "Art time before bed",
    ],
    thingsImWorkingOn: [
      "Telling people when something's wrong (I usually go quiet)",
      "Trying new things sometimes",
      "Not panicking about changes I can't control",
    ],
    signsImNotOkay: [
      "Going completely silent",
      "Not eating",
      "Hands over ears",
      "Rocking",
      "Avoiding art (huge sign)",
    ],
    thingsToKnowAboutMe: [
      "I'm autistic — please look up &apos;autistic person says&apos; when you have time",
      "Eye contact is hard. Please don&apos;t make me",
      "I take things literally. Sarcasm confuses me",
      "I love deeply but I show it differently",
      "&apos;Quiet&apos; doesn&apos;t mean &apos;not engaged&apos;",
    ],
    myCulture: "White British. I don't really connect with cultural stuff except British nature/wildlife.",
    myFaith: "I don't really get religion. I find spirituality in nature.",
    myStyle: "Comfortable, soft fabrics, no tags ever. I have 3 sets of identical pyjamas. Greens and blues mostly.",
    myBedroom: "Sensory-friendly. Weighted blanket. Otter on bed. Art supplies organised. Specific items in specific places. PLEASE don't move things.",
    schoolLife: "Specialist provision. I do okay when supported. Need quiet space and visual support. Art is my best subject.",
    helpfulPhrases: [
      "&apos;I&apos;m here when you&apos;re ready&apos;",
      "&apos;Take your time&apos;",
      "&apos;Would visual cards help?&apos;",
      "Specific compliments about my art",
    ],
    unhelpfulPhrases: [
      "&apos;Look at me when I&apos;m talking&apos;",
      "&apos;Just try it&apos;",
      "&apos;You need to socialise more&apos;",
      "&apos;Don&apos;t be silly&apos;",
      "&apos;Just stop rocking&apos;",
    ],
    childAuthored: true,
    lastUpdated: d(-7),
    reviewedWith: "staff_anna",
    reviewWithChildDate: d(-7),
  },
];

const exportCols: ExportColumn<PersonalPassport>[] = [
  { header: "Young Person", accessor: (r: PersonalPassport) => getYPName(r.youngPerson) },
  { header: "Preferred Name", accessor: (r: PersonalPassport) => r.preferredName },
  { header: "Pronouns", accessor: (r: PersonalPassport) => r.pronouns },
  { header: "Age", accessor: (r: PersonalPassport) => String(r.age) },
  { header: "Child Authored", accessor: (r: PersonalPassport) => r.childAuthored ? "Yes" : "No" },
  { header: "Last Updated", accessor: (r: PersonalPassport) => r.lastUpdated },
  { header: "Reviewed With", accessor: (r: PersonalPassport) => getStaffName(r.reviewedWith) },
];

export default function PersonalPassportPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((p) => p.youngPerson === filterYP);
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.youngPerson.localeCompare(b.youngPerson);
        case "updated":
          return b.lastUpdated.localeCompare(a.lastUpdated);
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, sortBy]);

  const total = data.length;
  const allChildAuthored = data.every((p) => p.childAuthored);
  const updatedRecently = data.filter((p) => p.lastUpdated >= d(-30)).length;

  return (
    <PageShell
      title="Personal Passport"
      subtitle="One-page 'all about me' for each child — co-authored, updated regularly, shared with everyone who supports them"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="personal-passports" />
          <PrintButton title="Personal Passports" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Active Passports</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allChildAuthored ? "100%" : `${data.filter((p) => p.childAuthored).length}/${total}`}</p>
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
                    <p className="font-medium truncate">{p.preferredName} ({p.pronouns}) &middot; age {p.age}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Last updated {p.lastUpdated} &middot; Reviewed with {getStaffName(p.reviewedWith)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {p.childAuthored && (
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
                        {p.myStrengths.map((s, i) => (
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
                        {p.whatMakesMeHappy.map((s, i) => (
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
                        {p.whatMakesMeUpset.map((s, i) => (
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
                        {p.whatHelpsWhenIamUpset.map((s, i) => (
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
                      {p.myInterests.map((i, idx) => (
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
                        {p.myFavouriteFood.map((f, i) => (
                          <li key={i} className="text-sm">{f}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Don&apos;t Like</p>
                      <ul className="space-y-1">
                        {p.foodIDontLike.map((f, i) => (
                          <li key={i} className="text-sm">{f}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <Music className="h-3 w-3 inline mr-1" />Music
                      </p>
                      <ul className="space-y-1">
                        {p.myMusic.map((m, i) => (
                          <li key={i} className="text-sm">{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">My Family</p>
                    <p className="text-sm bg-white rounded-lg p-2 border">{p.myFamily}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">My Friends</p>
                    <p className="text-sm bg-white rounded-lg p-2 border">{p.myFriends}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Important People</p>
                    <ul className="space-y-1">
                      {p.importantPeople.map((person, i) => (
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
                        {p.myDreams.map((d, i) => (
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
                        {p.myFears.map((f, i) => (
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
                        {p.helpfulPhrases.map((ph, i) => (
                          <li key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: `&bull; ${ph}` }} />
                        ))}
                      </ul>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">Unhelpful Phrases</p>
                      <ul className="space-y-1">
                        {p.unhelpfulPhrases.map((ph, i) => (
                          <li key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: `&bull; ${ph}` }} />
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Things To Know About Me</p>
                    <ul className="space-y-1">
                      {p.thingsToKnowAboutMe.map((t, i) => (
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
                        {p.myRoutines.map((r, i) => (
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
                        {p.signsImNotOkay.map((s, i) => (
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
                      {p.thingsImWorkingOn.map((t, i) => (
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
                      <p>{p.myCulture}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Faith</p>
                      <p>{p.myFaith}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Style</p>
                      <p>{p.myStyle}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">School Life</p>
                      <p>{p.schoolLife}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">My Bedroom</p>
                    <p className="text-sm">{p.myBedroom}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Last updated: {p.lastUpdated}</span>
                    <span>Reviewed with: {getStaffName(p.reviewedWith)}</span>
                    <span>Pronouns: {p.pronouns}</span>
                    {p.childAuthored && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">Child Authored</span>}
                  </div>
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
