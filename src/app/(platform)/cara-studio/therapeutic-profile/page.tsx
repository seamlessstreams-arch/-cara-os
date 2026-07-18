"use client";

// ══════════════════════════════════════════════════════════════════════════════
// PRACTICE INTELLIGENCE — THERAPEUTIC PROFILE VIEWER
//
// Displays the child's full therapeutic profile: history, trauma themes,
// attachment presentation, triggers, soothing strategies, relational
// strengths, staff relationships, child voice, what helps/doesn't help,
// and current therapeutic priorities.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Heart, Brain, AlertTriangle, Shield, Users, MessageCircle,
  CheckCircle2, XCircle, Sparkles, Target, BookOpen,
  Lightbulb, Music, Activity, Clock, Star,
} from "lucide-react";
import { demoSeed } from "@/lib/demo/demo-seed";

// ── Types ───────────────────────────────────────────────────────────────────

interface TherapeuticProfile {
  id: string;
  child_id: string;
  childName: string;
  status: "draft" | "active" | "archived";
  version: number;
  pre_placement_history: string;
  known_trauma_themes: string[];
  attachment_presentation: string;
  emotional_regulation_needs: string[];
  known_triggers: string[];
  known_soothing_strategies: string[];
  relational_strengths: string[];
  staff_relationships: { staffName: string; quality: string; notes: string }[];
  family_contact_themes: string[];
  education_themes: string[];
  identity_culture_belonging: string[];
  communication_style: string;
  neurodiversity_considerations: string[];
  risk_themes: string[];
  protective_factors: string[];
  current_presentation: string;
  progress_over_time: { date: string; area: string; direction: string; note: string }[];
  child_voice_entries: { date: string; context: string; quote: string; theme: string; sentiment: string }[];
  what_staff_need_to_remember: string[];
  what_helps: string[];
  what_does_not_help: string[];
  current_therapeutic_priorities: { title: string; description: string; framework: string; status: string }[];
  approved_by: string | null;
  approved_at: string | null;
  updated_at: string;
}

// ── Demo profiles ──────────────────────────────────────────────────────────

const DEMO_PROFILES: TherapeuticProfile[] = [
  {
    id: "prof-1", child_id: "child_1", childName: "Jayden", status: "active", version: 1,
    pre_placement_history: "Jayden experienced early neglect and inconsistent parenting before entering care at age 7. Multiple placement moves before arriving at the current home.",
    known_trauma_themes: ["Early neglect", "Multiple placement moves", "Inconsistent caregiving", "Loss of significant relationships"],
    attachment_presentation: "Insecure-avoidant presentation with some ambivalent features. Struggles to trust adults initially but can form strong bonds once trust is established.",
    emotional_regulation_needs: ["Support with emotional vocabulary", "Co-regulation with trusted adults", "Predictable routines", "Advance warning of changes"],
    known_triggers: ["Unpredictable changes to routine", "Broken promises from adults", "Discussions about family contact", "Being told rather than asked", "Feeling excluded"],
    known_soothing_strategies: ["5 minutes quiet time", "Music during activities", "Choice of where to sit", "Drawing", "1:1 time with key worker"],
    relational_strengths: ["Responds well to PACE approach", "Can articulate feelings when calm", "Shows empathy towards peers", "Good sense of humour"],
    staff_relationships: [
      { staffName: "Sarah Thompson", quality: "strong", notes: "Primary key worker. Jayden trusts Sarah and can be open about feelings." },
      { staffName: "Marcus Williams", quality: "developing", notes: "New to the team. Building relationship through shared football interest." },
    ],
    family_contact_themes: ["Complex relationship with mum — wants contact but finds it emotionally difficult", "No contact with dad — expresses curiosity but also anger"],
    education_themes: ["Attendance improved to 92%", "Enjoys science and PE", "Struggles with literacy — possible undiagnosed dyslexia"],
    identity_culture_belonging: ["Mixed heritage — exploring identity", "Enjoys cooking cultural foods with staff", "Values friendships at school"],
    communication_style: "Prefers 1:1 conversations. Can feel overwhelmed in group discussions. Uses humour to deflect when uncomfortable.",
    neurodiversity_considerations: ["Possible ADHD traits — referral in progress", "Sensory sensitivity to loud noises"],
    risk_themes: ["Self-harm following difficult family contact", "Missing episodes linked to peer influence", "Online vulnerability"],
    protective_factors: ["Strong relationship with key worker", "Good peer relationships at school", "Enjoys sports", "Can identify feelings when supported"],
    current_presentation: "Generally settled over the past 3 months. Some regression following a cancelled contact visit last week. Engaging well in key work sessions.",
    progress_over_time: [
      { date: "2026-03-01", area: "School attendance", direction: "improving", note: "Up from 75% to 92%" },
      { date: "2026-04-01", area: "Emotional regulation", direction: "improving", note: "Fewer incidents of dysregulation" },
      { date: "2026-05-01", area: "Family contact", direction: "stable", note: "Still finding contact difficult but coping better" },
    ],
    child_voice_entries: [
      { date: "2026-05-01", context: "Key work session", quote: "I like it here. I feel safe most of the time.", theme: "belonging", sentiment: "positive" },
      { date: "2026-04-20", context: "After family contact", quote: "I don't know why she didn't come. Maybe she doesn't care.", theme: "family", sentiment: "negative" },
      { date: "2026-04-15", context: "School review", quote: "Science is my thing. I want to be an engineer.", theme: "aspiration", sentiment: "positive" },
    ],
    what_staff_need_to_remember: ["Always give Jayden a choice", "Let him have 5 minutes before key work", "Don't mention family contact without warning", "Music helps him regulate"],
    what_helps: ["PACE approach", "Advance warning of changes", "Choices", "Music", "1:1 time", "Humour", "Sports"],
    what_does_not_help: ["Being told rather than asked", "Sudden topic changes", "Staff showing frustration", "Group confrontation", "Rushing conversations"],
    current_therapeutic_priorities: [
      { title: "Strengthen emotional vocabulary", description: "Support Jayden to identify and name a wider range of emotions", framework: "PACE", status: "active" },
      { title: "Process family contact feelings", description: "Gentle life story and feelings work around family relationships", framework: "DDP", status: "active" },
      { title: "Build independence skills", description: "Age-appropriate independence work aligned with pathway plan", framework: "Therapeutic Parenting", status: "active" },
    ],
    approved_by: "Darren Laville", approved_at: "2026-04-15T10:00:00Z", updated_at: "2026-05-08T14:30:00Z",
  },
  {
    id: "prof-2", child_id: "child_2", childName: "Amara", status: "draft", version: 1,
    pre_placement_history: "Amara witnessed domestic abuse before entering care. Separated from extended family and cultural community.",
    known_trauma_themes: ["Domestic abuse witnessed", "Cultural displacement", "Loss of extended family network"],
    attachment_presentation: "Anxious-ambivalent presentation. Seeks closeness but finds it difficult to trust.",
    emotional_regulation_needs: ["Safe spaces to retreat to", "Creative expression outlets", "Trusted female staff relationships"],
    known_triggers: ["Raised voices", "Feeling excluded", "Discussions about going home"],
    known_soothing_strategies: ["Art and drawing", "Quiet space", "Cultural food and music", "1:1 with trusted female staff"],
    relational_strengths: ["Deep bond with key worker Sarah", "Cares about younger children"],
    staff_relationships: [{ staffName: "Sarah Thompson", quality: "strong", notes: "Primary key worker. Strong bond." }],
    family_contact_themes: ["Misses extended family deeply", "Complex feelings about home"],
    education_themes: ["Inconsistent attendance", "Strong in art and creative subjects"],
    identity_culture_belonging: ["Strong cultural identity", "Values cultural foods and music", "Exploring heritage"],
    communication_style: "Quiet. Opens up through art and creative activities. Prefers female staff.",
    neurodiversity_considerations: [],
    risk_themes: ["Self-isolation when overwhelmed", "Not eating with others when distressed"],
    protective_factors: ["Strong cultural identity", "Artistic ability", "Resilient and thoughtful"],
    current_presentation: "Quieter in recent weeks. Self-isolating more. Engaging well in art therapy.",
    progress_over_time: [
      { date: "2026-04-01", area: "Art engagement", direction: "improving", note: "Art has become an important outlet" },
      { date: "2026-05-01", area: "Social engagement", direction: "declining", note: "Self-isolating more in room" },
    ],
    child_voice_entries: [
      { date: "2026-05-05", context: "Art session", quote: "When I draw, I don't feel so sad.", theme: "coping", sentiment: "mixed" },
    ],
    what_staff_need_to_remember: ["Don't force group participation", "Art materials always available", "Respect her space"],
    what_helps: ["Art and drawing", "Quiet 1:1 time", "Cultural food", "Music from home culture", "Patient, gentle approach"],
    what_does_not_help: ["Group pressure", "Direct confrontation", "Raised voices", "Feeling unheard"],
    current_therapeutic_priorities: [
      { title: "Build felt safety", description: "Help Amara feel safe enough to engage socially again", framework: "Trauma-Informed", status: "active" },
      { title: "Cultural identity support", description: "Strengthen connection to cultural heritage", framework: "Anti-Oppressive", status: "active" },
    ],
    approved_by: null, approved_at: null, updated_at: "2026-05-10T14:00:00Z",
  },
];

const QUALITY_STYLES: Record<string, string> = {
  strong: "bg-emerald-50 text-emerald-700 border-emerald-200",
  developing: "bg-blue-50 text-blue-600 border-blue-200",
  strained: "bg-amber-50 text-amber-700 border-amber-200",
  new: "bg-gray-50 text-gray-600 border-gray-200",
};

const SENTIMENT_STYLES: Record<string, string> = {
  positive: "border-l-emerald-500",
  negative: "border-l-red-400",
  mixed: "border-l-amber-400",
  neutral: "border-l-gray-400",
};

const DIRECTION_ICONS: Record<string, { icon: string; color: string }> = {
  improving: { icon: "↑", color: "text-emerald-600" },
  stable: { icon: "→", color: "text-blue-600" },
  declining: { icon: "↓", color: "text-red-600" },
};

// ══════════════════════════════════════════════════════════════════════════════

export default function TherapeuticProfilePage() {
  const [profiles] = useState(demoSeed(DEMO_PROFILES));
  const [selectedChild, setSelectedChild] = useState(demoSeed(DEMO_PROFILES)[0]?.child_id ?? "");

  const profile = profiles.find((p) => p.child_id === selectedChild);

  return (
    <PageShell title="Therapeutic Profile" subtitle="Child therapeutic profile viewer">
      <div className="space-y-6 pb-12">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <Heart className="h-5 w-5 text-[var(--cs-cara-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Therapeutic Profile</h2>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                The complete therapeutic picture: what we know, what helps, what hurts, and what the child needs from us.
              </p>
            </div>
            <select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)}
              className="rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]">
              {profiles.map((p) => <option key={p.child_id} value={p.child_id}>{p.childName}</option>)}
            </select>
          </div>
        </div>

        {profile && (
          <>
            {/* ── Status bar ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={cn("text-[10px] border", profile.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200")}>
                {profile.status}
              </Badge>
              <span className="text-[10px] text-[var(--cs-text-muted)]">Version {profile.version}</span>
              {profile.approved_by && <span className="text-[10px] text-[var(--cs-text-muted)]">Approved by {profile.approved_by}</span>}
              <span className="text-[10px] text-[var(--cs-text-muted)]">Updated: {new Date(profile.updated_at).toLocaleDateString("en-GB")}</span>
            </div>

            {/* ── Current Presentation ───────────────────────────────────── */}
            <div className="rounded-xl border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] p-4">
              <p className="text-[10px] font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Current Presentation</p>
              <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{profile.current_presentation}</p>
            </div>

            {/* ── Pre-placement & Attachment ──────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Section icon={BookOpen} label="Pre-Placement History" colour="text-blue-600 bg-blue-50 border-blue-200">
                <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{profile.pre_placement_history}</p>
              </Section>
              <Section icon={Heart} label="Attachment Presentation" colour="text-pink-600 bg-pink-50 border-pink-200">
                <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{profile.attachment_presentation}</p>
              </Section>
            </div>

            {/* ── Key lists ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ListSection icon={AlertTriangle} label="Known Triggers" colour="text-red-600 bg-red-50 border-red-200" items={profile.known_triggers} />
              <ListSection icon={Music} label="Soothing Strategies" colour="text-emerald-600 bg-emerald-50 border-emerald-200" items={profile.known_soothing_strategies} />
              <ListSection icon={Star} label="Relational Strengths" colour="text-teal-600 bg-teal-50 border-teal-200" items={profile.relational_strengths} />
              <ListSection icon={AlertTriangle} label="Trauma Themes" colour="text-red-600 bg-red-50 border-red-200" items={profile.known_trauma_themes} />
              <ListSection icon={Shield} label="Protective Factors" colour="text-emerald-600 bg-emerald-50 border-emerald-200" items={profile.protective_factors} />
              <ListSection icon={AlertTriangle} label="Risk Themes" colour="text-red-600 bg-red-50 border-red-200" items={profile.risk_themes} />
              <ListSection icon={Activity} label="Regulation Needs" colour="text-purple-600 bg-purple-50 border-purple-200" items={profile.emotional_regulation_needs} />
              <ListSection icon={Users} label="Family Contact Themes" colour="text-blue-600 bg-blue-50 border-blue-200" items={profile.family_contact_themes} />
              <ListSection icon={BookOpen} label="Education Themes" colour="text-indigo-600 bg-indigo-50 border-indigo-200" items={profile.education_themes} />
            </div>

            {/* ── What Helps / What Doesn't ──────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-emerald-200 bg-white overflow-hidden">
                <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-800">What Helps</span>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {profile.what_helps.map((h, i) => (
                    <Badge key={i} className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">{h}</Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-red-200 bg-white overflow-hidden">
                <div className="px-4 py-2.5 bg-red-50 border-b border-red-200 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-semibold text-red-800">What Does Not Help</span>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {profile.what_does_not_help.map((d, i) => (
                    <Badge key={i} className="text-[10px] bg-red-50 text-red-700 border-red-200">{d}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* ── What Staff Need to Remember ────────────────────────────── */}
            <div className="rounded-xl border border-amber-200 bg-white overflow-hidden">
              <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-semibold text-amber-800">What Staff Need to Remember</span>
              </div>
              <div className="p-4 space-y-2">
                {profile.what_staff_need_to_remember.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-amber-700">{i + 1}</span>
                    </div>
                    <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{r}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Staff Relationships ─────────────────────────────────────── */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide">Staff Relationships</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profile.staff_relationships.map((sr, i) => (
                  <div key={i} className="rounded-xl border border-[var(--cs-border)] bg-white p-4 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--cs-navy)] text-white text-xs font-bold">
                      {sr.staffName.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--cs-navy)]">{sr.staffName}</span>
                        <Badge className={cn("text-[9px] border", QUALITY_STYLES[sr.quality])}>{sr.quality}</Badge>
                      </div>
                      <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">{sr.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Child Voice ─────────────────────────────────────────────── */}
            {profile.child_voice_entries.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-[var(--cs-cara-gold)]" /> Child Voice
                </h3>
                {profile.child_voice_entries.map((cv, i) => (
                  <div key={i} className={cn("rounded-xl border border-[var(--cs-border)] bg-white p-4 border-l-4", SENTIMENT_STYLES[cv.sentiment])}>
                    <p className="text-xs text-[var(--cs-text-secondary)] italic leading-relaxed">&ldquo;{cv.quote}&rdquo;</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-[var(--cs-text-muted)]">{cv.context}</span>
                      <span className="text-[10px] text-[var(--cs-text-muted)]">{new Date(cv.date).toLocaleDateString("en-GB")}</span>
                      <Badge className="text-[9px] bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)] border-[var(--cs-cara-gold-soft)]">{cv.theme}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Progress Over Time ─────────────────────────────────────── */}
            {profile.progress_over_time.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide">Progress Over Time</h3>
                <div className="space-y-2">
                  {profile.progress_over_time.map((p, i) => {
                    const dir = DIRECTION_ICONS[p.direction] ?? DIRECTION_ICONS.stable;
                    return (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-[var(--cs-border)] bg-white px-4 py-2.5">
                        <span className={cn("text-lg font-bold", dir.color)}>{dir.icon}</span>
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-[var(--cs-navy)]">{p.area}</span>
                          <span className="text-xs text-[var(--cs-text-secondary)] ml-2">{p.note}</span>
                        </div>
                        <span className="text-[10px] text-[var(--cs-text-muted)]">{new Date(p.date).toLocaleDateString("en-GB")}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Therapeutic Priorities ──────────────────────────────────── */}
            {profile.current_therapeutic_priorities.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide flex items-center gap-2">
                  <Target className="h-4 w-4 text-[var(--cs-cara-gold)]" /> Current Therapeutic Priorities
                </h3>
                {profile.current_therapeutic_priorities.map((tp, i) => (
                  <div key={i} className="rounded-xl border border-[var(--cs-border)] bg-white p-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--cs-navy)] text-white text-[10px] font-bold">{i + 1}</span>
                      <span className="text-sm font-semibold text-[var(--cs-navy)]">{tp.title}</span>
                      <Badge className="text-[9px] bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)] border-[var(--cs-cara-gold-soft)]">{tp.framework}</Badge>
                      <Badge className={cn("text-[9px] border", tp.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-600 border-gray-200")}>{tp.status}</Badge>
                    </div>
                    <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed pl-8">{tp.description}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}

// ── Helper components ───────────────────────────────────────────────────────

function Section({ icon: Icon, label, colour, children }: { icon: React.ElementType; label: string; colour: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
      <div className={cn("px-4 py-2.5 border-b flex items-center gap-2", colour)}>
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function ListSection({ icon: Icon, label, colour, items }: { icon: React.ElementType; label: string; colour: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
      <div className={cn("px-4 py-2.5 border-b flex items-center gap-2", colour)}>
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold">{label}</span>
        <Badge className="text-[9px] ml-auto bg-white/80 border-white/50">{items.length}</Badge>
      </div>
      <div className="p-4 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--cs-cara-gold)] mt-1.5 shrink-0" />
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
