"use client";

// ══════════════════════════════════════════════════════════════════════════════
// AriaProviderStatus
//
// Small indicator showing whether the ARIA AI provider is configured and
// operational. Appears in the ARIA dashboard and governance page.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

interface AriaProviderStatusProps {
  className?: string;
}

type ProviderState = "loading" | "connected" | "fallback" | "unavailable";

export function AriaProviderStatus({ className }: AriaProviderStatusProps) {
  const [state, setState] = useState<ProviderState>("loading");
  const [providerName, setProviderName] = useState<string>("");

  useEffect(() => {
    async function checkProvider() {
      try {
        // Try a lightweight test request to the generate endpoint
        const res = await fetch("/api/aria/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commandId: "improve_writing",
            inputText: "test",
            actorUserId: "system_check",
            actorRole: "viewer",
            dryRun: true,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.data?.providerUsed) {
            setProviderName(data.data.providerUsed);
            setState("connected");
          } else {
            setState("fallback");
            setProviderName("Template Mode");
          }
        } else {
          setState("fallback");
          setProviderName("Template Mode");
        }
      } catch {
        setState("unavailable");
      }
    }
    checkProvider();
  }, []);

  const config = {
    loading: {
      icon: Loader2,
      label: "Checking provider...",
      color: "text-[var(--cs-text-muted)]",
      bg: "bg-gray-50",
      border: "border-gray-200",
      animate: true,
    },
    connected: {
      icon: CheckCircle2,
      label: `Connected — ${providerName}`,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
      animate: false,
    },
    fallback: {
      icon: AlertCircle,
      label: `${providerName || "Template Mode"} — no AI provider`,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      animate: false,
    },
    unavailable: {
      icon: XCircle,
      label: "ARIA service unavailable",
      color: "text-red-500",
      bg: "bg-red-50",
      border: "border-red-200",
      animate: false,
    },
  }[state];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
        config.bg,
        config.border,
        className,
      )}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5",
          config.color,
          config.animate && "animate-spin",
        )}
      />
      <span className={cn("text-[10px] font-medium", config.color)}>
        {config.label}
      </span>
    </div>
  );
}
