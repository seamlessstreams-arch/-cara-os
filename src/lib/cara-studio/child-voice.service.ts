// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — CHILD VOICE ENGINE
//
// Extracts, indexes, and surfaces the voice of the child from across all
// evidence sources. Ensures young people's wishes, feelings, direct quotes,
// and perspectives are captured, tracked, and embedded in professional outputs.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface ChildVoiceEntry {
  id: string;
  childId: string;
  sourceId: string | null;
  sourceType: string;
  sourceTitle: string | null;
  sourceDate: string | null;
  quote: string;
  context: string | null;
  sentiment: "positive" | "neutral" | "negative" | "distressed" | "unknown";
  theme: string | null;
  extractedAt: string;
}

export interface ChildVoiceSummary {
  childId: string;
  totalEntries: number;
  recentEntries: ChildVoiceEntry[];
  themes: { theme: string; count: number }[];
  sentimentBreakdown: Record<string, number>;
  lastCaptured: string | null;
  gapDays: number | null;
}

// ── Voice detection keywords ────────────────────────────────────────────────

const VOICE_INDICATORS = [
  // Direct speech markers
  /[""]([^""]{5,200})[""]/, // Quoted speech
  /said\s*[:;]?\s*["']([^"']{5,200})["']/i,
  /told\s+(?:us|me|staff|their?\s+key\s*worker)\s*[:;]?\s*["']([^"']{5,200})["']/i,
  /expressed\s+(?:that|how|a\s+wish|a\s+desire)\s+([^.]{10,200})/i,
  /(?:young\s+person|child|yp|they)\s+(?:said|stated|reported|shared|explained)\s+(?:that\s+)?["']?([^."']{10,200})["']?/i,
  // Wishes and feelings
  /wish(?:es|ed)?\s+(?:to|that|for)\s+([^.]{10,150})/i,
  /feel(?:s|ing|t)?\s+(?:that|like)\s+([^.]{10,150})/i,
  /(?:their?\s+)?view\s+(?:is|was)\s+(?:that\s+)?([^.]{10,150})/i,
];

const SENTIMENT_KEYWORDS = {
  positive: ["happy", "good", "great", "love", "enjoy", "like", "excited", "proud", "safe", "comfortable", "better", "brilliant", "amazing"],
  negative: ["angry", "sad", "upset", "hate", "don't like", "unfair", "scared", "worried", "annoyed", "frustrated", "bored", "lonely"],
  distressed: ["hurt", "scared", "frightened", "terrified", "want to die", "self-harm", "can't cope", "don't want to be here", "crying", "distressed"],
};

const THEMES = [
  { theme: "family_contact", keywords: ["mum", "dad", "family", "contact", "visit", "home", "brother", "sister", "parent"] },
  { theme: "education", keywords: ["school", "college", "teacher", "learning", "lesson", "homework", "education"] },
  { theme: "friendships", keywords: ["friend", "mate", "social", "lonely", "bullied", "peer"] },
  { theme: "placement", keywords: ["living here", "my room", "this place", "moving", "placement", "staff"] },
  { theme: "identity", keywords: ["who I am", "my culture", "my religion", "my identity", "belong"] },
  { theme: "health", keywords: ["health", "doctor", "medication", "sleep", "eating", "mental health", "anxious"] },
  { theme: "future", keywords: ["future", "when I'm older", "independent", "job", "career", "dream"] },
  { theme: "safety", keywords: ["safe", "unsafe", "scared", "protected", "danger", "worry"] },
  { theme: "activities", keywords: ["hobbies", "sport", "music", "art", "gaming", "activities", "fun"] },
  { theme: "rights", keywords: ["right", "fair", "unfair", "choice", "listen", "advocate", "complaint"] },
];

// ── Extract voice from content ──────────────────────────────────────────────

export function extractChildVoice(
  content: string,
  meta: {
    childId: string;
    sourceId?: string;
    sourceType: string;
    sourceTitle?: string;
    sourceDate?: string;
  },
): ChildVoiceEntry[] {
  const entries: ChildVoiceEntry[] = [];
  const now = new Date().toISOString();

  for (const pattern of VOICE_INDICATORS) {
    const matches = content.matchAll(new RegExp(pattern, "gi"));
    for (const match of matches) {
      const quote = (match[1] ?? match[0]).trim();
      if (quote.length < 5 || quote.length > 300) continue;

      // Deduplicate
      if (entries.some((e) => e.quote === quote)) continue;

      entries.push({
        id: `voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        childId: meta.childId,
        sourceId: meta.sourceId ?? null,
        sourceType: meta.sourceType,
        sourceTitle: meta.sourceTitle ?? null,
        sourceDate: meta.sourceDate ?? null,
        quote,
        context: extractSurroundingContext(content, quote),
        sentiment: detectSentiment(quote),
        theme: detectTheme(quote),
        extractedAt: now,
      });
    }
  }

  return entries;
}

// ── Scan all sources for a child's voice ────────────────────────────────────

export async function scanChildVoice(childId: string): Promise<ChildVoiceEntry[]> {
  const sb = createServerClient();
  if (!sb) return getDemoVoiceEntries(childId);

  const { data: sources, error } = await (sb.from("cara_studio_sources") as any)
    .select("id, source_type, title, content, summary, source_date")
    .eq("home_id", homeId())
    .eq("child_id", childId)
    .order("source_date", { ascending: false })
    .limit(100);

  if (error || !sources) return getDemoVoiceEntries(childId);

  const allEntries: ChildVoiceEntry[] = [];
  for (const src of sources as Array<{ id: string; source_type: string; title: string | null; content: string | null; summary: string | null; source_date: string | null }>) {
    const text = `${src.content ?? ""} ${src.summary ?? ""}`;
    if (!text.trim()) continue;

    const entries = extractChildVoice(text, {
      childId,
      sourceId: src.id,
      sourceType: src.source_type,
      sourceTitle: src.title ?? undefined,
      sourceDate: src.source_date ?? undefined,
    });
    allEntries.push(...entries);
  }

  return allEntries;
}

// ── Build voice summary for a child ─────────────────────────────────────────

export async function getChildVoiceSummary(childId: string): Promise<ChildVoiceSummary> {
  const entries = await scanChildVoice(childId);

  // Theme counts
  const themeCounts: Record<string, number> = {};
  for (const entry of entries) {
    if (entry.theme) {
      themeCounts[entry.theme] = (themeCounts[entry.theme] ?? 0) + 1;
    }
  }
  const themes = Object.entries(themeCounts)
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count);

  // Sentiment breakdown
  const sentimentBreakdown: Record<string, number> = {};
  for (const entry of entries) {
    sentimentBreakdown[entry.sentiment] = (sentimentBreakdown[entry.sentiment] ?? 0) + 1;
  }

  // Last captured and gap
  const sortedByDate = entries
    .filter((e) => e.sourceDate)
    .sort((a, b) => (b.sourceDate ?? "").localeCompare(a.sourceDate ?? ""));
  const lastCaptured = sortedByDate[0]?.sourceDate ?? null;
  let gapDays: number | null = null;
  if (lastCaptured) {
    gapDays = Math.floor((Date.now() - new Date(lastCaptured).getTime()) / (1000 * 60 * 60 * 24));
  }

  return {
    childId,
    totalEntries: entries.length,
    recentEntries: entries.slice(0, 10),
    themes,
    sentimentBreakdown,
    lastCaptured,
    gapDays,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function extractSurroundingContext(content: string, quote: string): string | null {
  const idx = content.indexOf(quote);
  if (idx < 0) return null;
  const start = Math.max(0, idx - 80);
  const end = Math.min(content.length, idx + quote.length + 80);
  return content.slice(start, end).trim();
}

function detectSentiment(text: string): ChildVoiceEntry["sentiment"] {
  const lower = text.toLowerCase();
  for (const kw of SENTIMENT_KEYWORDS.distressed) {
    if (lower.includes(kw)) return "distressed";
  }
  let posScore = 0;
  let negScore = 0;
  for (const kw of SENTIMENT_KEYWORDS.positive) {
    if (lower.includes(kw)) posScore++;
  }
  for (const kw of SENTIMENT_KEYWORDS.negative) {
    if (lower.includes(kw)) negScore++;
  }
  if (posScore > negScore) return "positive";
  if (negScore > posScore) return "negative";
  if (posScore === 0 && negScore === 0) return "unknown";
  return "neutral";
}

function detectTheme(text: string): string | null {
  const lower = text.toLowerCase();
  let bestTheme: string | null = null;
  let bestScore = 0;
  for (const { theme, keywords } of THEMES) {
    const score = keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestTheme = theme;
    }
  }
  return bestTheme;
}

// ── Demo data ───────────────────────────────────────────────────────────────

function getDemoVoiceEntries(childId: string): ChildVoiceEntry[] {
  const now = new Date().toISOString();
  return [
    {
      id: "demo-voice-1", childId, sourceId: "demo-src-1", sourceType: "keywork",
      sourceTitle: "Key work session — 8 May", sourceDate: "2026-05-08",
      quote: "Sometimes I just need five minutes and my headphones",
      context: "When asked what helps during difficult moments, the young person said: \"Sometimes I just need five minutes and my headphones\"",
      sentiment: "neutral", theme: "safety", extractedAt: now,
    },
    {
      id: "demo-voice-2", childId, sourceId: "demo-src-2", sourceType: "daily_log",
      sourceTitle: "Daily log — 6 May", sourceDate: "2026-05-06",
      quote: "I felt really good today, school was brilliant",
      context: "During tea time, the young person said: \"I felt really good today, school was brilliant\"",
      sentiment: "positive", theme: "education", extractedAt: now,
    },
    {
      id: "demo-voice-3", childId, sourceId: "demo-src-3", sourceType: "daily_log",
      sourceTitle: "Daily log — 4 May", sourceDate: "2026-05-04",
      quote: "I miss my mum, I wish I could see her more",
      context: "Before bedtime, the young person told staff: \"I miss my mum, I wish I could see her more\"",
      sentiment: "negative", theme: "family_contact", extractedAt: now,
    },
  ];
}
