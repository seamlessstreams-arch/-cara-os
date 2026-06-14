"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraOnboardingCard
//
// Welcome card shown to users who haven't used Cara yet (or have low usage).
// Explains what Cara does, provides quick-start actions, and dismisses
// persistently via localStorage.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  X,
  Wand2,
  Mic,
  Shield,
  ListTodo,
  ChevronRight,
  Keyboard,
} from "lucide-react";

interface CaraOnboardingCardProps {
  className?: string;
}

const DISMISSED_KEY = "cs_aria_onboarding_dismissed";

const FEATURES = [
  {
    icon: Wand2,
    title: "Improve Your Writing",
    description: "Enhance daily logs, incident records, and care notes with professional tone and clarity.",
  },
  {
    icon: Mic,
    title: "Voice Dictation",
    description: "Speak your notes and Cara transcribes them directly into records.",
  },
  {
    icon: Shield,
    title: "Safeguarding Guardrails",
    description: "Every output is scanned for safeguarding sensitivity. Critical content is flagged for mandatory review.",
  },
  {
    icon: ListTodo,
    title: "Task Extraction",
    description: "Cara pulls action items from meeting notes, supervision records, and incident reviews.",
  },
] as const;

export function CaraOnboardingCard({ className }: CaraOnboardingCardProps) {
  const [dismissed, setDismissed] = useState(true); // Start hidden to prevent flash

  useEffect(() => {
    const stored = localStorage.getItem(DISMISSED_KEY);
    if (stored !== "true") {
      setDismissed(false);
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "true");
  }

  if (dismissed) return null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-gradient-to-br from-[var(--cs-cara-gold-bg)] via-white to-blue-50 overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[var(--cs-navy)] flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--cs-navy)]">
              Welcome to Cara Intelligence
            </h3>
            <p className="text-[11px] text-[var(--cs-text-muted)]">
              Your AI-powered care assistant
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] transition-colors p-1"
          aria-label="Dismiss onboarding"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Description */}
      <div className="px-5 py-3">
        <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
          Cara helps you write better records, extract actions, and maintain
          oversight. Every AI output is a <strong>draft suggestion</strong> that
          requires your review before use. Cara never commits to records without
          your approval.
        </p>
      </div>

      {/* Features grid */}
      <div className="px-5 pb-4 grid grid-cols-2 gap-2.5">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="rounded-xl border border-[var(--cs-border)] bg-white p-3"
            >
              <Icon className="h-4 w-4 text-[var(--cs-cara-gold)] mb-1.5" />
              <div className="text-xs font-semibold text-[var(--cs-navy)] mb-0.5">
                {feature.title}
              </div>
              <div className="text-[10px] text-[var(--cs-text-muted)] leading-relaxed">
                {feature.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick start actions */}
      <div className="px-5 pb-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 rounded-full bg-[var(--cs-navy)] px-3 py-1.5 text-white text-[10px] font-medium">
          <Keyboard className="h-3 w-3" />
          Press ⌘K for quick access
        </div>
        <button
          onClick={handleDismiss}
          className="flex items-center gap-1 text-[10px] text-[var(--cs-text-muted)] hover:text-[var(--cs-cara-gold)] transition-colors"
        >
          Got it, dismiss
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
