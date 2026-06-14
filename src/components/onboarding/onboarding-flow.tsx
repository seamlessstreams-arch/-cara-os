"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Plus, Sparkles, ArrowRight, X, Heart } from "lucide-react";

interface OnboardingFlowProps { onComplete: () => void }

const STEPS = [
  {
    icon: Heart,
    iconColor: "text-[var(--cs-cara-gold)]",
    iconBg: "bg-[var(--cs-cara-gold-bg)]",
    title: "Welcome to Cara",
    subtitle: "The operating system for children's residential care.",
    body: "Let's show you around — this takes about 30 seconds.",
  },
  {
    icon: LayoutDashboard,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    title: "Your Dashboard",
    subtitle: "This is your command centre.",
    body: "Everything you need is right here:\n• What needs attention today\n• Your active tasks\n• Children's key information\n\nYour view is customised for your role.",
  },
  {
    icon: Plus,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    title: "Record Once, Use Everywhere",
    subtitle: "Press Cmd+K or tap + Create to record anything.",
    body: "Your entry automatically:\n• Creates follow-up tasks\n• Updates the timeline\n• Generates inspection evidence\n• Makes data available to Cara intelligence\n\nNo duplicate recording. Ever.",
  },
  {
    icon: Sparkles,
    iconColor: "text-[var(--cs-cara-gold)]",
    iconBg: "bg-[var(--cs-cara-gold-bg)]",
    title: "Meet Cara",
    subtitle: "Your practice intelligence layer.",
    body: "Cara helps with:\n• Checking your writing tone\n• Identifying missing information\n• Spotting risk patterns\n• Preparing for inspections\n\nARIA suggests — you decide. Always.",
  },
];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const handleComplete = () => {
    try { localStorage.setItem("cs_onboarding_complete", "true"); } catch {}
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--cs-navy)]/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-[var(--cs-shadow-elevated)] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Skip */}
        <div className="flex justify-end px-4 pt-3">
          <button onClick={handleComplete} className="text-xs text-[var(--cs-text-muted)] hover:text-[var(--cs-text)] flex items-center gap-1 transition-colors">
            Skip <X className="h-3 w-3" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-6 text-center">
          <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4", current.iconBg)}>
            <Icon className={cn("h-8 w-8", current.iconColor)} />
          </div>
          <h2 className="text-xl font-bold text-[var(--cs-navy)] mb-1">{current.title}</h2>
          <p className="text-sm text-[var(--cs-text-secondary)] mb-4">{current.subtitle}</p>
          <div className="text-left text-sm text-[var(--cs-text-muted)] leading-relaxed whitespace-pre-line bg-[var(--cs-bg)] rounded-xl p-4">
            {current.body}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 flex items-center justify-between">
          {/* Dots */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={cn("h-2 rounded-full transition-all", i === step ? "w-6 bg-[var(--cs-cara-gold)]" : "w-2 bg-[var(--cs-border)]")} />
            ))}
          </div>

          {/* Button */}
          {isLast ? (
            <button
              onClick={handleComplete}
              className="rounded-xl bg-[var(--cs-navy)] text-white px-6 py-2.5 text-sm font-medium hover:bg-[var(--cs-navy-soft)] transition-colors flex items-center gap-2"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="rounded-xl bg-[var(--cs-cara-gold)] text-[var(--cs-navy)] px-6 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
