"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_WA_SETTINGS,
  type WACategory,
  type WritingAssistantSettings,
  type WritingAuditEvent,
  type IssueType,
} from "@/lib/writing-assistant/types";
import { currentUserId } from "@/lib/auth/current-user";

const SETTINGS_ENDPOINT = "/api/writing-assistant/settings";
const AUDIT_ENDPOINT    = "/api/writing-assistant/audit";

function userHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    h["x-user-id"] = currentUserId();
  }
  return h;
}

export interface UseWritingAssistantSettingsReturn {
  settings: WritingAssistantSettings;
  loading: boolean;
  toggleCategory: (cat: WACategory, enabled: boolean) => void;
  addToDictionary: (word: string) => void;
  removeFromDictionary: (word: string) => void;
  logAudit: (event: Omit<WritingAuditEvent, "id" | "user_id" | "created_at">) => void;
}

export function useWritingAssistantSettings(): UseWritingAssistantSettingsReturn {
  const [settings, setSettings] = useState<WritingAssistantSettings>({ ...DEFAULT_WA_SETTINGS });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(SETTINGS_ENDPOINT, { headers: userHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (json?.data) setSettings(json.data as WritingAssistantSettings); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback((patch: Partial<WritingAssistantSettings>) => {
    fetch(SETTINGS_ENDPOINT, {
      method: "PUT",
      headers: userHeaders(),
      body: JSON.stringify(patch),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (json?.data) setSettings(json.data as WritingAssistantSettings); })
      .catch(() => {});
  }, []);

  const toggleCategory = useCallback(
    (cat: WACategory, enabled: boolean) => {
      setSettings((prev) => {
        const next = { ...prev, categories: { ...prev.categories, [cat]: enabled } };
        persist({ categories: next.categories });
        return next;
      });
    },
    [persist],
  );

  const addToDictionary = useCallback(
    (word: string) => {
      const trimmed = word.trim().toLowerCase();
      if (!trimmed) return;
      setSettings((prev) => {
        if (prev.dictionary.includes(trimmed)) return prev;
        const next = { ...prev, dictionary: [...prev.dictionary, trimmed] };
        persist({ dictionary: next.dictionary });
        return next;
      });
    },
    [persist],
  );

  const removeFromDictionary = useCallback(
    (word: string) => {
      const trimmed = word.toLowerCase();
      setSettings((prev) => {
        const next = { ...prev, dictionary: prev.dictionary.filter((w) => w !== trimmed) };
        persist({ dictionary: next.dictionary });
        return next;
      });
    },
    [persist],
  );

  const logAudit = useCallback(
    (event: Omit<WritingAuditEvent, "id" | "user_id" | "created_at">) => {
      fetch(AUDIT_ENDPOINT, {
        method: "POST",
        headers: userHeaders(),
        body: JSON.stringify(event),
      }).catch(() => {});
    },
    [],
  );

  return { settings, loading, toggleCategory, addToDictionary, removeFromDictionary, logAudit };
}

/** Derive `IssueType`s that are currently enabled from settings categories. */
export function enabledIssueTypes(settings: WritingAssistantSettings): IssueType[] {
  const all: IssueType[] = [
    "spelling", "grammar", "punctuation", "safeguarding-quality",
    "chronology", "writing-to-child", "tone", "professional-language",
    "clarity", "policy-language",
  ];
  if (!settings.enabled) return [];
  const CAT_MAP: Record<string, IssueType[]> = {
    spelling:    ["spelling"],
    grammar:     ["grammar", "punctuation"],
    safeguarding: ["safeguarding-quality", "chronology", "writing-to-child"],
    tone:        ["tone", "professional-language"],
    clarity:     ["clarity", "policy-language"],
  };
  return all.filter((type) => {
    const cat = Object.entries(CAT_MAP).find(([, types]) => types.includes(type))?.[0];
    return cat ? settings.categories[cat as WACategory] !== false : true;
  });
}
