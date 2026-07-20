"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — THERAPEUTIC FORMULATIONS
//
// Visual formulations for each child: presenting behaviour, unmet needs,
// triggers, protective factors, relational strengths, and staff response
// patterns. Built from evidence and refined through professional review.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Brain, Heart, AlertTriangle, Shield, Target,
  Sparkles, CheckCircle2, Users, Clock, Activity,
} from "lucide-react";
import { demoSeed } from "@/lib/demo/demo-seed";

// ── Types ───────────────────────────────────────────────────────────────────

interface Formulation {
  id: string;
  childId: string;
  childName: string;
  framework: string;
  status: "draft" | "approved";
  approvedBy: string | null;
  approvedAt: string | null;
  updatedAt: string;
  data: {
    presenting_behaviour: string[];
    possible_unmet_needs: string[];
    trauma_links: string[];
    triggers: string[];
    protective_factors: string[];
    relational_strengths: string[];
    staff_response_patterns: string[];
    what_helps: string[];
    what_escalates: string[];
  };
}

// ── Demo data ───────────────────────────────────────────────────────────────

const DEMO_FORMULATIONS: Formulation[] = [
  {
    id: "form-1", childId: "child_1", childName: "Jayden", framework: "psychologically_informed",
    status: "approved", approvedBy: "Olivia Hayes", approvedAt: "2026-05-08T10:00:00Z", updatedAt: "2026-05-08T10:00:00Z",
    data: {
      presenting_behaviour: ["Withdrawal during family discussions", "Reluctance to engage with new staff", "Positive engagement when given choice"],
      possible_unmet_needs: ["Belonging and identity", "Consistent adult relationships", "Sense of control over own life"],
      trauma_links: ["Early neglect — inconsistent care", "Multiple placement moves — loss of relationships"],
      triggers: ["Unpredictable changes to routine", "Broken promises from adults", "Discussions about family contact"],
      protective_factors: ["Strong verbal skills", "Good peer relationships at school", "Trusting relationship with key worker"],
      relational_strengths: ["Responds well to PACE approach", "Can articulate feelings when calm", "Shows empathy towards peers"],
      staff_response_patterns: ["Staff A uses PACE consistently — positive outcomes", "Staff B tends to rush conversations — Jayden withdraws"],
      what_helps: ["5 minutes quiet time before key work", "Music during activities", "Choice of where to sit"],
      what_escalates: ["Being told rather than asked", "Sudden topic changes", "Staff showing frustration"],
    },
  },
  {
    id: "form-2", childId: "child_2", childName: "Amara", framework: "trauma_informed",
    status: "draft", approvedBy: null, approvedAt: null, updatedAt: "2026-05-10T14:00:00Z",
    data: {
      presenting_behaviour: ["Self-isolation in room", "Reluctance to eat with others", "Creative expression through art"],
      possible_unmet_needs: ["Cultural identity and belonging", "Safety from past experiences", "Trusted female relationships"],
      trauma_links: ["Domestic abuse witnessed", "Cultural displacement", "Loss of extended family network"],
      triggers: ["Raised voices", "Feeling excluded", "Discussions about going home"],
      protective_factors: ["Strong cultural identity", "Artistic ability", "Resilient and thoughtful"],
      relational_strengths: ["Deep bond with key worker Sarah", "Cares about younger children in the home"],
      staff_response_patterns: ["Female staff get better engagement", "Amara responds to quiet, 1:1 approaches"],
      what_helps: ["Art materials always available", "Quiet space to retreat to", "Cultural food and music"],
      what_escalates: ["Group pressure", "Direct confrontation", "Feeling unheard"],
    },
  },
];

// ── Section config ──────────────────────────────────────────────────────────

const SECTION_CONFIG: { key: keyof Formulation["data"]; label: string; icon: React.ElementType; colour: string }[] = [
  { key: "presenting_behaviour", label: "Presenting Behaviour", icon: Activity, colour: "text-blue-600 bg-blue-50 border-blue-200" },
  { key: "possible_unmet_needs", label: "Possible Unmet Needs", icon: Heart, colour: "text-pink-600 bg-pink-50 border-pink-200" },
  { key: "trauma_links", label: "Trauma Links", icon: AlertTriangle, colour: "text-red-600 bg-red-50 border-red-200" },
  { key: "triggers", label: "Triggers", icon: AlertTriangle, colour: "text-amber-600 bg-amber-50 border-amber-200" },
  { key: "protective_factors", label: "Protective Factors", icon: Shield, colour: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { key: "relational_strengths", label: "Relational Strengths", icon: Users, colour: "text-teal-600 bg-teal-50 border-teal-200" },
  { key: "staff_response_patterns", label: "Staff Response Patterns", icon: Users, colour: "text-purple-600 bg-purple-50 border-purple-200" },
  { key: "what_helps", label: "What Helps", icon: CheckCircle2, colour: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { key: "what_escalates", label: "What Escalates", icon: AlertTriangle, colour: "text-red-600 bg-red-50 border-red-200" },
];

// ══════════════════════════════════════════════════════════════════════════════

export default function FormulationsPage() {
  const [formulations] = useState<Formulation[]>(demoSeed(DEMO_FORMULATIONS));
  const [selectedChild, setSelectedChild] = useState<string>(demoSeed(DEMO_FORMULATIONS)[0]?.childId ?? "");

  const current = formulations.find((f) => f.childId === selectedChild);

  return (
    <PageShell title="Formulations" subtitle="Therapeutic formulations for each child">
      <div className="space-y-6 pb-12">

        <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <Brain className="h-5 w-5 text-[var(--cs-cara-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Therapeutic Formulations</h2>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                Evidence-based therapeutic formulations: presenting behaviour, unmet needs, triggers, protective factors, and what helps each child.
              </p>
            </div>
            <select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)}
              className="rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]">
              {formulations.map((f) => (
                <option key={f.childId} value={f.childId}>{f.childName}</option>
              ))}
            </select>
          </div>
        </div>

        {current ? (
          <>
            {/* ── Meta bar ──────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={cn("text-[10px] border", current.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200")}>
                {current.status === "approved" ? "Approved" : "Draft"}
              </Badge>
              <span className="text-[10px] text-[var(--cs-text-muted)]">Framework: {current.framework.replace(/_/g, " ")}</span>
              {current.approvedBy && <span className="text-[10px] text-[var(--cs-text-muted)]">Approved by {current.approvedBy}</span>}
              <span className="text-[10px] text-[var(--cs-text-muted)]">Updated: {new Date(current.updatedAt).toLocaleDateString("en-GB")}</span>
            </div>

            {/* ── Formulation sections ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SECTION_CONFIG.map(({ key, label, icon: Icon, colour }) => {
                const items = current.data[key];
                if (!items || items.length === 0) return null;
                return (
                  <div key={key} className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
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
              })}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-[var(--cs-border)] bg-white p-8 text-center">
            <Brain className="h-10 w-10 text-[var(--cs-text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--cs-text-muted)]">No formulation found for this child.</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
