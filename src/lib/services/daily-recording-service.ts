// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DAILY RECORDING & SHIFT NOTES SERVICE
// Manages daily logs, shift notes, handover records, and recording quality
// analytics. Powers ARIA's recording intelligence and Reg 36 compliance.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ───────────────────────────────────────────────────────────────────

export type RecordType =
  | "daily_log"
  | "shift_note"
  | "handover"
  | "night_log"
  | "activity_log"
  | "sleep_log"
  | "welfare_check"
  | "key_session";

export type RecordQuality = "excellent" | "good" | "adequate" | "poor" | "missing";

export type ShiftType = "early" | "late" | "long_day" | "waking_night" | "sleep_in";

export interface DailyRecord {
  id: string;
  home_id: string;
  child_id: string | null;
  record_type: RecordType;
  shift_type: ShiftType | null;
  author_id: string;
  content: string;
  word_count: number;
  mentions_children: string[];
  mentions_staff: string[];
  mood_observations: string | null;
  behaviour_notes: string | null;
  medication_notes: string | null;
  safeguarding_flags: string[];
  positive_highlights: string[];
  concerns: string[];
  attachments_count: number;
  signed_off_by: string | null;
  signed_off_at: string | null;
  quality_score: RecordQuality | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const RECORDING_STANDARDS = {
  min_word_count: 50,
  target_word_count: 150,
  required_fields: ["content", "mood_observations"] as const,
  max_hours_after_shift: 2,
  children_per_shift_minimum: 1,
} as const;

export const SHIFT_TIMES: Record<ShiftType, { start: string; end: string; label: string }> = {
  early:        { start: "07:00", end: "14:30", label: "Early Shift" },
  late:         { start: "14:00", end: "22:00", label: "Late Shift" },
  long_day:     { start: "07:00", end: "22:00", label: "Long Day" },
  waking_night: { start: "22:00", end: "07:00", label: "Waking Night" },
  sleep_in:     { start: "22:00", end: "07:00", label: "Sleep-In" },
};

export const QUALITY_INDICATORS: Record<RecordQuality, string> = {
  excellent: "word_count >= 200, includes mood, behaviour, highlights, AND no concerns omitted",
  good:      "word_count >= 150, includes at least mood OR behaviour",
  adequate:  "word_count >= 50",
  poor:      "word_count < 50",
  missing:   "no record at all for the shift",
};

// ── Pure functions ──────────────────────────────────────────────────────────

export function assessRecordQuality(record: {
  content: string;
  word_count: number;
  mood_observations: string | null;
  behaviour_notes: string | null;
  positive_highlights: string[];
  concerns: string[];
  safeguarding_flags: string[];
}): { quality: RecordQuality; score: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;

  // Word count contribution: min(word_count/200, 1) * 40 points
  const wordScore = Math.min(record.word_count / 200, 1) * 40;
  score += wordScore;

  if (record.word_count < RECORDING_STANDARDS.min_word_count) {
    feedback.push(`Record is below minimum word count (${RECORDING_STANDARDS.min_word_count} words)`);
  } else if (record.word_count < RECORDING_STANDARDS.target_word_count) {
    feedback.push(`Consider expanding the record to at least ${RECORDING_STANDARDS.target_word_count} words`);
  }

  // Mood observations present: +15 points
  if (record.mood_observations) {
    score += 15;
  } else {
    feedback.push("Consider adding mood observations");
  }

  // Behaviour notes present: +15 points
  if (record.behaviour_notes) {
    score += 15;
  } else {
    feedback.push("Consider adding behaviour notes");
  }

  // Positive highlights length > 0: +10 points
  if (record.positive_highlights.length > 0) {
    score += 10;
  } else {
    feedback.push("Include positive highlights to balance the record");
  }

  // Concerns documented: +10 points
  if (record.concerns.length > 0) {
    score += 10;
  } else {
    feedback.push("Document any concerns, or note that there are none");
  }

  // Safeguarding mentioned: +10 points
  if (record.safeguarding_flags.length > 0) {
    score += 10;
  } else {
    feedback.push("Consider whether any safeguarding observations apply");
  }

  score = Math.round(score);

  // Map score to quality
  let quality: RecordQuality;
  if (score >= 85) {
    quality = "excellent";
  } else if (score >= 65) {
    quality = "good";
  } else if (score >= 40) {
    quality = "adequate";
  } else {
    quality = "poor";
  }

  return { quality, score, feedback };
}

export function computeRecordingCompliance(
  records: DailyRecord[],
  expectedRecords: { date: string; shift: ShiftType }[],
  now: Date,
): {
  total_expected: number;
  total_submitted: number;
  missing: number;
  late_submissions: number;
  compliance_percentage: number;
  quality_breakdown: Record<RecordQuality, number>;
  average_quality_score: number;
} {
  const total_expected = expectedRecords.length;
  const total_submitted = records.length;
  const missing = Math.max(0, total_expected - total_submitted);

  // Count late submissions: submitted > 2 hours after shift end
  let late_submissions = 0;
  for (const record of records) {
    if (record.shift_type) {
      const shiftEnd = SHIFT_TIMES[record.shift_type].end;
      const recordDate = record.created_at.slice(0, 10);
      const [endH, endM] = shiftEnd.split(":").map(Number);

      // Build shift end datetime — for overnight shifts, end is next day
      const endDate = new Date(recordDate);
      endDate.setHours(endH, endM, 0, 0);

      // For overnight shifts (waking_night, sleep_in), end time is next day
      if (record.shift_type === "waking_night" || record.shift_type === "sleep_in") {
        endDate.setDate(endDate.getDate() + 1);
      }

      const deadline = new Date(endDate.getTime() + RECORDING_STANDARDS.max_hours_after_shift * 60 * 60 * 1000);
      const createdAt = new Date(record.created_at);

      if (createdAt > deadline) {
        late_submissions++;
      }
    }
  }

  // Quality breakdown
  const quality_breakdown: Record<RecordQuality, number> = {
    excellent: 0,
    good: 0,
    adequate: 0,
    poor: 0,
    missing: missing,
  };

  let qualityScoreSum = 0;
  let qualityScoreCount = 0;

  for (const record of records) {
    const assessment = assessRecordQuality({
      content: record.content,
      word_count: record.word_count,
      mood_observations: record.mood_observations,
      behaviour_notes: record.behaviour_notes,
      positive_highlights: record.positive_highlights,
      concerns: record.concerns,
      safeguarding_flags: record.safeguarding_flags,
    });

    quality_breakdown[assessment.quality]++;
    qualityScoreSum += assessment.score;
    qualityScoreCount++;
  }

  const average_quality_score =
    qualityScoreCount > 0 ? Math.round((qualityScoreSum / qualityScoreCount) * 10) / 10 : 0;

  const compliance_percentage =
    total_expected > 0 ? Math.round((total_submitted / total_expected) * 100) : 100;

  return {
    total_expected,
    total_submitted,
    missing,
    late_submissions,
    compliance_percentage,
    quality_breakdown,
    average_quality_score,
  };
}

export function computeStaffRecordingProfile(records: DailyRecord[]): {
  total_records: number;
  average_word_count: number;
  average_quality_score: number;
  quality_trend: "improving" | "stable" | "declining";
  common_gaps: string[];
  strengths: string[];
} {
  const total_records = records.length;

  if (total_records === 0) {
    return {
      total_records: 0,
      average_word_count: 0,
      average_quality_score: 0,
      quality_trend: "stable",
      common_gaps: [],
      strengths: [],
    };
  }

  // Average word count
  const totalWords = records.reduce((sum, r) => sum + r.word_count, 0);
  const average_word_count = Math.round(totalWords / total_records);

  // Assess each record
  const assessments = records.map((r) =>
    assessRecordQuality({
      content: r.content,
      word_count: r.word_count,
      mood_observations: r.mood_observations,
      behaviour_notes: r.behaviour_notes,
      positive_highlights: r.positive_highlights,
      concerns: r.concerns,
      safeguarding_flags: r.safeguarding_flags,
    }),
  );

  const totalScore = assessments.reduce((sum, a) => sum + a.score, 0);
  const average_quality_score = Math.round((totalScore / total_records) * 10) / 10;

  // Quality trend: compare last 10 vs previous 10
  let quality_trend: "improving" | "stable" | "declining" = "stable";
  if (assessments.length >= 20) {
    const recent = assessments.slice(-10);
    const previous = assessments.slice(-20, -10);
    const recentAvg = recent.reduce((s, a) => s + a.score, 0) / 10;
    const previousAvg = previous.reduce((s, a) => s + a.score, 0) / 10;
    const diff = recentAvg - previousAvg;
    if (diff > 5) quality_trend = "improving";
    else if (diff < -5) quality_trend = "declining";
  }

  // Common gaps: which fields are most often missing
  let missingMood = 0;
  let missingBehaviour = 0;
  let missingHighlights = 0;
  let missingConcerns = 0;
  let missingSafeguarding = 0;

  for (const r of records) {
    if (!r.mood_observations) missingMood++;
    if (!r.behaviour_notes) missingBehaviour++;
    if (r.positive_highlights.length === 0) missingHighlights++;
    if (r.concerns.length === 0) missingConcerns++;
    if (r.safeguarding_flags.length === 0) missingSafeguarding++;
  }

  const common_gaps: string[] = [];
  const threshold = total_records * 0.5;
  if (missingMood > threshold) common_gaps.push("mood_observations");
  if (missingBehaviour > threshold) common_gaps.push("behaviour_notes");
  if (missingHighlights > threshold) common_gaps.push("positive_highlights");
  if (missingConcerns > threshold) common_gaps.push("concerns");
  if (missingSafeguarding > threshold) common_gaps.push("safeguarding_flags");

  // Strengths: which areas are consistently good
  const strengths: string[] = [];
  const strengthThreshold = total_records * 0.7;
  if (total_records - missingMood >= strengthThreshold) strengths.push("mood_observations");
  if (total_records - missingBehaviour >= strengthThreshold) strengths.push("behaviour_notes");
  if (total_records - missingHighlights >= strengthThreshold) strengths.push("positive_highlights");
  if (total_records - missingConcerns >= strengthThreshold) strengths.push("concerns");
  if (total_records - missingSafeguarding >= strengthThreshold) strengths.push("safeguarding_flags");
  if (average_word_count >= RECORDING_STANDARDS.target_word_count) strengths.push("word_count");

  return {
    total_records,
    average_word_count,
    average_quality_score,
    quality_trend,
    common_gaps,
    strengths,
  };
}

export function identifyRecordingGaps(
  records: DailyRecord[],
  childIds: string[],
  dateRange: { start: string; end: string },
): {
  children_not_mentioned: string[];
  low_mention_children: { child_id: string; mentions: number }[];
  days_without_records: string[];
  shifts_without_records: { date: string; shift: ShiftType }[];
} {
  // Count mentions per child
  const mentionCounts = new Map<string, number>();
  for (const cid of childIds) {
    mentionCounts.set(cid, 0);
  }

  for (const r of records) {
    for (const cid of r.mentions_children) {
      if (mentionCounts.has(cid)) {
        mentionCounts.set(cid, (mentionCounts.get(cid) ?? 0) + 1);
      }
    }
    // Also count direct child_id references
    if (r.child_id && mentionCounts.has(r.child_id)) {
      mentionCounts.set(r.child_id, (mentionCounts.get(r.child_id) ?? 0) + 1);
    }
  }

  const children_not_mentioned: string[] = [];
  const low_mention_children: { child_id: string; mentions: number }[] = [];

  for (const [cid, count] of mentionCounts.entries()) {
    if (count === 0) {
      children_not_mentioned.push(cid);
    } else if (count < 3) {
      low_mention_children.push({ child_id: cid, mentions: count });
    }
  }

  // Build set of dates that should have records
  const recordDates = new Set(records.map((r) => r.created_at.slice(0, 10)));

  const days_without_records: string[] = [];
  const current = new Date(dateRange.start);
  const end = new Date(dateRange.end);

  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);
    if (!recordDates.has(dateStr)) {
      days_without_records.push(dateStr);
    }
    current.setDate(current.getDate() + 1);
  }

  // Build set of shifts covered
  const coveredShifts = new Set(
    records
      .filter((r) => r.shift_type)
      .map((r) => `${r.created_at.slice(0, 10)}:${r.shift_type}`),
  );

  const shifts_without_records: { date: string; shift: ShiftType }[] = [];
  const allShiftTypes: ShiftType[] = ["early", "late", "waking_night"];

  const checkDate = new Date(dateRange.start);
  while (checkDate <= end) {
    const dateStr = checkDate.toISOString().slice(0, 10);
    for (const shift of allShiftTypes) {
      if (!coveredShifts.has(`${dateStr}:${shift}`)) {
        shifts_without_records.push({ date: dateStr, shift });
      }
    }
    checkDate.setDate(checkDate.getDate() + 1);
  }

  return {
    children_not_mentioned,
    low_mention_children,
    days_without_records,
    shifts_without_records,
  };
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function listDailyRecords(
  homeId: string,
  opts?: {
    childId?: string;
    authorId?: string;
    recordType?: RecordType;
    shiftType?: ShiftType;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<DailyRecord[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_daily_records") as SB).select("*").eq("home_id", homeId);

  if (opts?.childId) q = q.eq("child_id", opts.childId);
  if (opts?.authorId) q = q.eq("author_id", opts.authorId);
  if (opts?.recordType) q = q.eq("record_type", opts.recordType);
  if (opts?.shiftType) q = q.eq("shift_type", opts.shiftType);
  if (opts?.dateFrom) q = q.gte("created_at", opts.dateFrom);
  if (opts?.dateTo) q = q.lte("created_at", opts.dateTo);

  q = q.order("created_at", { ascending: false }).limit(opts?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getDailyRecord(id: string): Promise<ServiceResult<DailyRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_daily_records") as SB)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createDailyRecord(input: {
  homeId: string;
  childId?: string;
  recordType: RecordType;
  shiftType?: ShiftType;
  authorId: string;
  content: string;
  mentionsChildren?: string[];
  mentionsStaff?: string[];
  moodObservations?: string;
  behaviourNotes?: string;
  medicationNotes?: string;
  safeguardingFlags?: string[];
  positiveHighlights?: string[];
  concerns?: string[];
  attachmentsCount?: number;
}): Promise<ServiceResult<DailyRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const wordCount = input.content.trim().split(/\s+/).filter(Boolean).length;

  const positiveHighlights = input.positiveHighlights ?? [];
  const concerns = input.concerns ?? [];
  const safeguardingFlags = input.safeguardingFlags ?? [];

  // Auto-assess quality
  const assessment = assessRecordQuality({
    content: input.content,
    word_count: wordCount,
    mood_observations: input.moodObservations ?? null,
    behaviour_notes: input.behaviourNotes ?? null,
    positive_highlights: positiveHighlights,
    concerns,
    safeguarding_flags: safeguardingFlags,
  });

  const { data, error } = await (s.from("cs_daily_records") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId ?? null,
      record_type: input.recordType,
      shift_type: input.shiftType ?? null,
      author_id: input.authorId,
      content: input.content,
      word_count: wordCount,
      mentions_children: input.mentionsChildren ?? [],
      mentions_staff: input.mentionsStaff ?? [],
      mood_observations: input.moodObservations ?? null,
      behaviour_notes: input.behaviourNotes ?? null,
      medication_notes: input.medicationNotes ?? null,
      safeguarding_flags: safeguardingFlags,
      positive_highlights: positiveHighlights,
      concerns,
      attachments_count: input.attachmentsCount ?? 0,
      quality_score: assessment.quality,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateDailyRecord(
  id: string,
  updates: {
    content?: string;
    moodObservations?: string;
    behaviourNotes?: string;
    medicationNotes?: string;
    safeguardingFlags?: string[];
    positiveHighlights?: string[];
    concerns?: string[];
    mentionsChildren?: string[];
    mentionsStaff?: string[];
    attachmentsCount?: number;
  },
): Promise<ServiceResult<DailyRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const patch: Record<string, unknown> = {};

  if (updates.content !== undefined) {
    patch.content = updates.content;
    patch.word_count = updates.content.trim().split(/\s+/).filter(Boolean).length;
  }
  if (updates.moodObservations !== undefined) patch.mood_observations = updates.moodObservations;
  if (updates.behaviourNotes !== undefined) patch.behaviour_notes = updates.behaviourNotes;
  if (updates.medicationNotes !== undefined) patch.medication_notes = updates.medicationNotes;
  if (updates.safeguardingFlags !== undefined) patch.safeguarding_flags = updates.safeguardingFlags;
  if (updates.positiveHighlights !== undefined) patch.positive_highlights = updates.positiveHighlights;
  if (updates.concerns !== undefined) patch.concerns = updates.concerns;
  if (updates.mentionsChildren !== undefined) patch.mentions_children = updates.mentionsChildren;
  if (updates.mentionsStaff !== undefined) patch.mentions_staff = updates.mentionsStaff;
  if (updates.attachmentsCount !== undefined) patch.attachments_count = updates.attachmentsCount;

  // Re-fetch the full record to re-assess quality if content-related fields changed
  if (
    updates.content !== undefined ||
    updates.moodObservations !== undefined ||
    updates.behaviourNotes !== undefined ||
    updates.positiveHighlights !== undefined ||
    updates.concerns !== undefined ||
    updates.safeguardingFlags !== undefined
  ) {
    // Get current record to merge with updates for quality assessment
    const { data: current } = await (s.from("cs_daily_records") as SB)
      .select("*")
      .eq("id", id)
      .single();

    if (current) {
      const merged = {
        content: (patch.content as string) ?? current.content,
        word_count: (patch.word_count as number) ?? current.word_count,
        mood_observations: (patch.mood_observations as string | null) ?? current.mood_observations,
        behaviour_notes: (patch.behaviour_notes as string | null) ?? current.behaviour_notes,
        positive_highlights: (patch.positive_highlights as string[]) ?? current.positive_highlights,
        concerns: (patch.concerns as string[]) ?? current.concerns,
        safeguarding_flags: (patch.safeguarding_flags as string[]) ?? current.safeguarding_flags,
      };

      const assessment = assessRecordQuality(merged);
      patch.quality_score = assessment.quality;
    }
  }

  patch.updated_at = new Date().toISOString();

  const { data, error } = await (s.from("cs_daily_records") as SB)
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function signOffRecord(
  id: string,
  signedOffBy: string,
): Promise<ServiceResult<DailyRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_daily_records") as SB)
    .update({
      signed_off_by: signedOffBy,
      signed_off_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ─────────────────────────────────────────────────────────

export const _testing = {
  assessRecordQuality,
  computeRecordingCompliance,
  computeStaffRecordingProfile,
  identifyRecordingGaps,
  RECORDING_STANDARDS,
  SHIFT_TIMES,
  QUALITY_INDICATORS,
};
