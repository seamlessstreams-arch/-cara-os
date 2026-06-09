"use client";

import { useState } from "react";
import {
  BookOpen, Heart, Shield, Users, MessageSquare,
  Phone, Star, Home, Smile, HelpCircle,
  ChevronDown, ChevronUp, CheckCircle2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── types ───────────────────────────────────────────────────────────── */
interface GuideSection {
  id: string;
  title: string;
  icon: React.ElementType;
  colour: string;
  content: string[];
  lastUpdated: string;
}

/* ── sections ────────────────────────────────────────────────────────── */
const SECTIONS: GuideSection[] = [
  {
    id: "welcome", title: "Welcome to Chamberlain House", icon: Home, colour: "text-blue-600",
    lastUpdated: "2026-01-15",
    content: [
      "Welcome to Chamberlain House! This is your home and we want you to feel safe, happy, and comfortable here.",
      "This guide tells you everything you need to know about living here, your rights, and who can help you.",
      "We wrote this guide with the help of young people who live here. If anything is unclear, just ask a member of staff.",
    ],
  },
  {
    id: "rights", title: "Your Rights", icon: Star, colour: "text-amber-600",
    lastUpdated: "2026-01-15",
    content: [
      "You have the right to be treated with respect and dignity at all times.",
      "You have the right to privacy — your room is your space and staff will always knock before entering.",
      "You have the right to make choices about your daily life, including food, activities, and how you spend your free time.",
      "You have the right to see your social worker, family, and friends (unless there are safety reasons why this can't happen).",
      "You have the right to make a complaint if you're unhappy about anything — and we promise to listen.",
      "You have the right to an advocate — someone independent who can speak up for you.",
      "You have the right to be involved in decisions about your care and your future.",
      "You have the right to access your records and know what is written about you.",
    ],
  },
  {
    id: "people", title: "People Who Look After You", icon: Users, colour: "text-purple-600",
    lastUpdated: "2026-01-15",
    content: [
      "Darren (Registered Manager) — Darren is in charge of the home and makes sure everything runs well. You can talk to Darren about anything.",
      "Your Key Worker — Your key worker is a special member of staff assigned to you. They'll spend one-to-one time with you regularly and help with things you want to work on.",
      "The Staff Team — All the staff at Chamberlain House are here to support you. You can talk to any of them at any time.",
      "Your Social Worker — Your social worker visits regularly and makes sure your care plan is right for you.",
      "Independent Visitor — An independent person visits the home every month to check everything is okay. You can talk to them privately.",
      "Advocate — If you want someone independent to help you have your say, you can ask for an advocate.",
    ],
  },
  {
    id: "daily_life", title: "Daily Life", icon: Smile, colour: "text-green-600",
    lastUpdated: "2026-01-15",
    content: [
      "Mealtimes are together and we'll always try to cook meals you enjoy. You can help plan the menu and learn to cook!",
      "School/college attendance is really important — we'll support you to get there and do your best.",
      "You'll have a regular bedtime that suits your age, but we can talk about this together.",
      "Your pocket money is given each week. You can save it, spend it, or put some aside.",
      "Activities are planned but we also do spontaneous fun things. Your ideas are always welcome!",
      "We have house meetings where everyone can share ideas, give feedback, and help make decisions.",
      "WiFi is available but there are some age-appropriate restrictions. Staff can explain what these are.",
    ],
  },
  {
    id: "safety", title: "Keeping You Safe", icon: Shield, colour: "text-red-600",
    lastUpdated: "2026-01-15",
    content: [
      "Your safety is our top priority. If you ever feel unsafe, tell a member of staff immediately.",
      "We do fire drills regularly so you know what to do in an emergency. There's a fire plan in your room.",
      "Visitors to the home sign in and out. We do this to keep track of who is in the building.",
      "If something upsets you or someone hurts you, we want to know so we can help.",
      "We have rules about certain things — not to be mean, but to keep everyone safe.",
      "If you go out, we need to know where you are. This isn't about controlling you — it's because we care.",
    ],
  },
  {
    id: "voice", title: "Having Your Say", icon: MessageSquare, colour: "text-pink-600",
    lastUpdated: "2026-01-15",
    content: [
      "Your voice matters. We want to hear what you think about your home, your care, and your future.",
      "House meetings happen regularly — this is your chance to suggest changes and share ideas.",
      "Key work sessions are one-to-one time with your key worker where you can talk about anything.",
      "LAC reviews happen regularly — this is a meeting about your care plan and you should be at the centre of it.",
      "Feedback surveys are given out so you can share how you feel about living here.",
      "If you have a great idea, tell us! We've made changes based on what young people have suggested before.",
    ],
  },
  {
    id: "complaints", title: "If You're Not Happy", icon: HelpCircle, colour: "text-orange-600",
    lastUpdated: "2026-01-15",
    content: [
      "If you're unhappy about anything, you can talk to any member of staff, your key worker, or Darren.",
      "You can make a formal complaint — we'll give you a form and help you fill it in if you need.",
      "Your complaint will be taken seriously and dealt with fairly. You won't get in trouble for complaining.",
      "If you don't feel comfortable telling staff, you can contact your social worker, the independent visitor, or an advocate.",
      "You can also contact Ofsted directly — their number is on the notice board and at the bottom of this guide.",
      "If you're still not happy with how your complaint was handled, there are other people who can help. Staff can tell you about these.",
    ],
  },
  {
    id: "contacts", title: "Important Phone Numbers", icon: Phone, colour: "text-teal-600",
    lastUpdated: "2026-01-15",
    content: [
      "Chamberlain House: 0121 XXX XXXX",
      "Darren (Registered Manager): Available through staff on shift",
      "Childline: 0800 1111 — Free, confidential, available 24/7",
      "Ofsted: 0300 123 1231 — You can call Ofsted if you have concerns about the home",
      "NSPCC Helpline: 0808 800 5000",
      "Children's Commissioner: 0800 528 0731",
      "Your Social Worker: [Your social worker's number is in your care file — ask staff]",
      "Advocacy Service: [Number on the notice board]",
      "Police (non-emergency): 101 / Emergency: 999",
    ],
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function ChildrensGuidePage() {
  const [expanded, setExpanded] = useState<string | null>("welcome");

  return (
    <PageShell
      title="Children's Guide"
      subtitle="Everything young people need to know about living at Chamberlain House"
      ariaContext={{ pageTitle: "Children's Guide", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Children's Guide — Chamberlain House" />
          <AriaStudioQuickActionButton context={{ record_type: "ofsted_evidence", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── intro banner ──────────────────────────────────────── */}
        <div className="rounded-xl bg-gradient-to-r from-blue-50 to-pink-50 border border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-blue-900">Your Guide to Chamberlain House</h2>
              <p className="text-sm text-blue-700">A guide for young people, by young people</p>
            </div>
          </div>
          <p className="text-sm text-blue-800">
            This guide has been written to help you understand what it&apos;s like to live at Chamberlain House,
            what your rights are, and who you can talk to if you need help. It&apos;s <strong>your</strong> guide —
            if you think we should add anything or change something, tell us!
          </p>
        </div>

        {/* ── sections ──────────────────────────────────────────── */}
        <div className="space-y-3">
          {SECTIONS.map((section) => {
            const isExpanded = expanded === section.id;
            const Icon = section.icon;

            return (
              <div key={section.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : section.id)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-5 w-5", section.colour)} />
                    <div>
                      <p className="font-medium">{section.title}</p>
                      <p className="text-xs text-muted-foreground">Updated: {section.lastUpdated}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{section.content.length} items</Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4">
                    <ul className="space-y-3">
                      {section.content.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className={cn("h-4 w-4 mt-0.5 shrink-0", section.colour)} />
                          <p className="text-sm">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── version note ──────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Regulation 16:</strong> The registered person must produce a guide for children about
          the home. This guide must be provided to each child before or on their admission and must be
          reviewed regularly. The guide should be written in a way that children can understand and should
          include information about how to make a complaint, contact Ofsted, and access an advocate.
          <p className="mt-2 text-xs text-blue-700">
            Last full review: January 2026 · Next review due: July 2026 · Version reviewed with young people: Yes
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Children's Guide — what to expect at Chamberlain House, who's who, house rules, bedroom, rights, compliments & complaints, emergency contacts"
        recordType="ofsted_evidence"
        className="mt-6"
      />
    </PageShell>
  );
}
