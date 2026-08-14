import { londonWeekStart } from "@/lib/utils";

// Demo-seed dates float with the calendar: each is an offset in days from the
// current London week's Monday, so "recent activity" stays recent, history
// stays deep, "upcoming" stays upcoming, and week-structured records stay
// Monday-aligned — re-anchored on every module load. Fixed date strings decay:
// the two stores' April-2026 seeds had silently aged four months (#916/#917),
// and 93 more files carried 1,300+ fixed dates anchored to their authoring
// week. Offsets preserve each file's authored layout relative to its own
// "present" (the git-creation week). Genuine provenance stamps — config
// created_at, knowledge-base ingested_at — stay fixed on purpose: floating
// those would fake freshness.
export const seedDay = (offset: number): string => {
  const [y, m, d] = londonWeekStart(0).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + offset)).toISOString().slice(0, 10);
};
