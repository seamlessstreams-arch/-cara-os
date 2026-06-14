"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — ROLE-BASED OUTPUT VERSIONS
//
// Side-by-side comparison of how the same content looks for different readers:
// manager full detail, care worker simplified, young person child-friendly,
// social worker professional summary, inspector evidence-heavy.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Users, Eye, Shield, AlertTriangle, Heart, BookOpen,
  Sparkles, GraduationCap, Home, UserCheck, FileSearch,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface RoleVersion {
  role: string;
  label: string;
  content: string;
  redactions: string[];
  addedContext: string[];
}

// ── Role config ─────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { icon: React.ElementType; colour: string; description: string }> = {
  registered_manager: { icon: Shield, colour: "text-[var(--cs-navy)] bg-blue-50 border-blue-200", description: "Full detail + regulatory references" },
  deputy_manager: { icon: UserCheck, colour: "text-blue-600 bg-blue-50 border-blue-200", description: "Full detail, financial excluded" },
  team_leader: { icon: Users, colour: "text-purple-600 bg-purple-50 border-purple-200", description: "Summary, actions, staff guidance" },
  residential_care_worker: { icon: Heart, colour: "text-pink-600 bg-pink-50 border-pink-200", description: "Simplified, sensitive content redacted" },
  young_person: { icon: Home, colour: "text-amber-600 bg-amber-50 border-amber-200", description: "Child-friendly language, safe content" },
  social_worker: { icon: BookOpen, colour: "text-emerald-600 bg-emerald-50 border-emerald-200", description: "Professional summary, risk focus" },
  parent_carer: { icon: Heart, colour: "text-rose-600 bg-rose-50 border-rose-200", description: "Plain English, safe content only" },
  responsible_individual: { icon: FileSearch, colour: "text-indigo-600 bg-indigo-50 border-indigo-200", description: "Full detail, inspection-ready tone" },
  inspector: { icon: Eye, colour: "text-slate-600 bg-slate-50 border-slate-200", description: "Full detail + AI disclaimer, formal tone" },
};

// ── Demo content ────────────────────────────────────────────────────────────

const DEMO_VERSIONS: RoleVersion[] = [
  {
    role: "registered_manager",
    label: "Registered Manager",
    content: "Jayden has shown positive progress in engaging with key work sessions over the past two weeks. The therapeutic framework (PACE) has been particularly effective during discussions about family contact. His placement stability has improved since the de-escalation plan was updated on 28 April.\n\nAn allegation against a member of staff is being investigated through proper channels. Medication compliance with Ritalin 10mg remains at 95% this month.\n\nSafeguarding review identified no immediate concerns. The multi-agency meeting on 15 May will review the current risk assessment.\n\nRegulatory relevance: Regulation 12 (Health), Regulation 13 (Protection of children), Regulation 34 (Placement plan).",
    redactions: [],
    addedContext: [],
  },
  {
    role: "residential_care_worker",
    label: "Care Worker",
    content: "Jayden has shown positive progress in engaging with key work sessions over the past two weeks. The therapeutic framework (PACE) has been particularly effective during discussions about family contact. His where you live stability has improved since the calming things down plan was updated on 28 April.\n\n[Staff-sensitive content — speak to your manager for details] [Medication details — speak to your manager for details]\n\nKeeping you safe review identified no immediate concerns. The different professionals working together meeting on 15 May will review the current risk assessment.\n\n---\nThis is a summary version. Speak to your manager for the full detail.",
    redactions: ["Staff-sensitive content", "Medication details"],
    addedContext: ["Language simplified for care worker", "Disclaimer added", "Tone: plain_english"],
  },
  {
    role: "young_person",
    label: "Young Person",
    content: "Things have been going really well for you in your key work sessions over the past couple of weeks. The way your team talks with you (being playful, accepting, curious and kind) has helped during chats about seeing your family.\n\nWhere you live has been more settled since the calming things down plan was updated.\n\nKeeping you safe — no worries right now. There's a meeting with different professionals working together on 15 May to check in.\n\n---\nThis has been written to help you understand what is happening. You can ask your key worker or an advocate if you have any questions.",
    redactions: ["Staff-sensitive content", "Legal content", "Medication details"],
    addedContext: ["Language simplified for young person", "Disclaimer added", "Tone: child_friendly"],
  },
  {
    role: "social_worker",
    label: "Social Worker",
    content: "Jayden has demonstrated positive engagement with therapeutic key work sessions utilising the PACE framework. Family contact remains a priority area.\n\nPlacement stability has improved following an updated de-escalation plan (28 April). Risk assessment review is scheduled for the multi-agency meeting on 15 May.\n\nSafeguarding position: no immediate concerns identified. Current risk level maintained.\n\nChild voice: Jayden has expressed a wish to see his family more frequently and has reported feeling safer in his placement.",
    redactions: [],
    addedContext: ["Tone: professional_legal"],
  },
  {
    role: "inspector",
    label: "Inspector View",
    content: "Jayden has shown positive progress in engaging with key work sessions over the past two weeks. The therapeutic framework (PACE) has been particularly effective during discussions about family contact. His placement stability has improved since the de-escalation plan was updated on 28 April.\n\nSafeguarding review identified no immediate concerns. The multi-agency meeting on 15 May will review the current risk assessment.\n\nRegulatory relevance: Regulation 12 (Health), Regulation 13 (Protection of children), Regulation 34 (Placement plan).\n\n---\nThis document was generated with AI assistance and has been reviewed and approved by the Registered Manager.",
    redactions: [],
    addedContext: ["Disclaimer added", "Tone: inspection_ready"],
  },
];

// ══════════════════════════════════════════════════════════════════════════════

export default function RoleVersionsPage() {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["registered_manager", "young_person"]);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) return prev.filter((r) => r !== role);
      if (prev.length >= 3) return [...prev.slice(1), role]; // Max 3 side-by-side
      return [...prev, role];
    });
  };

  const selectedVersions = DEMO_VERSIONS.filter((v) => selectedRoles.includes(v.role));

  return (
    <PageShell title="Role Versions" subtitle="Same content, different readers">
      <div className="space-y-6 pb-12">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <Users className="h-5 w-5 text-[var(--cs-cara-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Role-Based Output Versions</h2>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                Compare how the same content is presented to different readers. Select up to 3 roles for side-by-side comparison.
              </p>
            </div>
          </div>
        </div>

        {/* ── Role selector ───────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 space-y-3">
          <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide">Select Roles to Compare</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ROLE_CONFIG).map(([role, config]) => {
              const Icon = config.icon;
              const isSelected = selectedRoles.includes(role);
              return (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-3 py-2 transition-all",
                    isSelected
                      ? "border-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)] ring-2 ring-[var(--cs-cara-gold-soft)]"
                      : "border-[var(--cs-border)] bg-[var(--cs-surface)] hover:border-[var(--cs-cara-gold-soft)]",
                  )}
                >
                  <Icon className={cn("h-4 w-4", isSelected ? "text-[var(--cs-cara-gold)]" : "text-[var(--cs-text-muted)]")} />
                  <span className={cn("text-xs font-medium", isSelected ? "text-[var(--cs-navy)]" : "text-[var(--cs-text-secondary)]")}>
                    {ROLE_CONFIG[role]?.description?.split(",")[0] ?? role.replace(/_/g, " ")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Side-by-side comparison ─────────────────────────────────────── */}
        {selectedVersions.length > 0 && (
          <div className={cn("grid gap-4", selectedVersions.length === 1 ? "grid-cols-1" : selectedVersions.length === 2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 lg:grid-cols-3")}>
            {selectedVersions.map((version) => {
              const config = ROLE_CONFIG[version.role];
              const Icon = config?.icon ?? Users;
              return (
                <div key={version.role} className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
                  {/* Role header */}
                  <div className={cn("px-4 py-3 border-b flex items-center gap-2", config?.colour ?? "bg-gray-50")}>
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-semibold">{version.label}</span>
                  </div>

                  {/* Modifications badges */}
                  {(version.redactions.length > 0 || version.addedContext.length > 0) && (
                    <div className="px-4 py-2 border-b border-[var(--cs-border-subtle)] flex flex-wrap gap-1.5">
                      {version.redactions.map((r) => (
                        <Badge key={r} className="text-[9px] bg-red-50 text-red-600 border-red-200">
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Redacted: {r}
                        </Badge>
                      ))}
                      {version.addedContext.map((c) => (
                        <Badge key={c} className="text-[9px] bg-blue-50 text-blue-600 border-blue-200">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <div className="text-xs text-[var(--cs-text)] leading-relaxed whitespace-pre-wrap">
                      {version.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedVersions.length === 0 && (
          <div className="rounded-xl border border-[var(--cs-border)] bg-white p-8 text-center">
            <Users className="h-10 w-10 text-[var(--cs-text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--cs-text-muted)]">Select at least one role above to see the output version.</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
