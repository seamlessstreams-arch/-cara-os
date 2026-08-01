// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME LIFE STORY & IDENTITY INTELLIGENCE ENGINE
// Life story work, personal passports, friendships, aspirations, LGBTQ+, style.
// Pure deterministic engine. CHR 2015 Reg 7/9.
// ══════════════════════════════════════════════════════════════════════════════

export interface LifeStoryInput {
  id: string; child_id: string; date: string;
  entry_type: string; child_voice: string; linked_to_book: boolean;
  status: string; // "in_progress" | "completed" | "planned"
}

export interface PersonalPassportInput {
  id: string; child_id: string; last_updated: string;
  child_authored: boolean; sections_completed: number; // out of typical 20
  reviewed_with_child: boolean;
}

export interface FriendshipMapInput {
  id: string; child_id: string; map_date: string;
  friends_count: number; isolation_risk: string; // "none" | "mild" | "moderate" | "high"
  support_strategies_count: number; reviewed: boolean;
}

export interface AspirationInput {
  id: string; child_id: string; recorded_date: string;
  child_chose: boolean; steps_taken_count: number;
  review_date: string; progress_status: string; // tracks realism
}

export interface LgbtqInclusionInput {
  id: string; child_id: string; last_updated: string;
  pronouns_used_consistently: boolean; preferred_name_used_consistently: boolean;
  identity_affirming_actions_count: number; child_voice_present: boolean;
}

export interface StyleIdentityInput {
  id: string; child_id: string; recorded_date: string;
  child_voice: string; style_descriptors_count: number;
  identity_elements_count: number; review_date: string;
}

export interface HomeLifeStoryIdentityInput {
  today: string;
  life_story_entries: LifeStoryInput[];
  personal_passports: PersonalPassportInput[];
  friendship_maps: FriendshipMapInput[];
  aspirations: AspirationInput[];
  lgbtq_inclusions: LgbtqInclusionInput[];
  style_identities: StyleIdentityInput[];
  total_children: number;
}

export type LifeStoryIdentityRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface LifeStorySummary { total: number; completed_rate: number | null; child_voice_rate: number | null; linked_to_book_rate: number | null; }
export interface PassportSummary { total: number; child_authored_rate: number | null; reviewed_rate: number | null; avg_sections: number | null; }
export interface FriendshipSummary { total: number; avg_friends: number | null; high_isolation_count: number; reviewed_rate: number | null; }
export interface AspirationSummary { total: number; child_chosen_rate: number | null; active_steps_rate: number | null; overdue_reviews: number; }
export interface LgbtqSummary { total: number; pronouns_consistent_rate: number | null; affirming_actions_rate: number | null; child_voice_rate: number | null; }
export interface StyleSummary { total: number; child_voice_rate: number | null; avg_descriptors: number | null; }

export interface HomeLifeStoryIdentityResult {
  life_story_rating: LifeStoryIdentityRating; life_story_score: number | null; headline: string;
  life_stories: LifeStorySummary; passports: PassportSummary; friendships: FriendshipSummary;
  aspirations: AspirationSummary; lgbtq: LgbtqSummary; style: StyleSummary;
  strengths: string[]; concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

function pct(n: number, d: number): number { return d === 0 ? 0 : Math.round((n / d) * 100); }
function daysBetween(a: string, b: string): number { return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000); }

export function computeHomeLifeStoryIdentity(input: HomeLifeStoryIdentityInput): HomeLifeStoryIdentityResult {
  const { today, life_story_entries, personal_passports, friendship_maps, aspirations, lgbtq_inclusions, style_identities, total_children } = input;

  if (total_children === 0 && life_story_entries.length === 0 && personal_passports.length === 0 && friendship_maps.length === 0 && aspirations.length === 0 && lgbtq_inclusions.length === 0 && style_identities.length === 0) {
    return {
      life_story_rating: "insufficient_data", life_story_score: 0,
      headline: "No life story or identity data available for analysis.",
      life_stories: { total: 0, completed_rate: 0, child_voice_rate: 0, linked_to_book_rate: 0 },
      passports: { total: 0, child_authored_rate: 0, reviewed_rate: 0, avg_sections: 0 },
      friendships: { total: 0, avg_friends: 0, high_isolation_count: 0, reviewed_rate: 0 },
      aspirations: { total: 0, child_chosen_rate: 0, active_steps_rate: 0, overdue_reviews: 0 },
      lgbtq: { total: 0, pronouns_consistent_rate: 0, affirming_actions_rate: 0, child_voice_rate: 0 },
      style: { total: 0, child_voice_rate: 0, avg_descriptors: 0 },
      strengths: [], concerns: [], recommendations: [], insights: [],
    };
  }

  // ── Summaries ────────────────────────────────────────────────────────────
  const lsCompleted = life_story_entries.filter(e => e.status === "completed").length;
  const lsWithVoice = life_story_entries.filter(e => e.child_voice.trim().length > 0).length;
  const lsLinked = life_story_entries.filter(e => e.linked_to_book).length;
  const life_stories: LifeStorySummary = {
    total: life_story_entries.length,
    completed_rate: pct(lsCompleted, life_story_entries.length),
    child_voice_rate: pct(lsWithVoice, life_story_entries.length),
    linked_to_book_rate: pct(lsLinked, life_story_entries.length),
  };

  const ppAuthored = personal_passports.filter(p => p.child_authored).length;
  const ppReviewed = personal_passports.filter(p => p.reviewed_with_child).length;
  const ppSections = personal_passports.length > 0 ? Math.round(personal_passports.reduce((s, p) => s + p.sections_completed, 0) / personal_passports.length) : null;
  const passports: PassportSummary = {
    total: personal_passports.length,
    child_authored_rate: pct(ppAuthored, personal_passports.length),
    reviewed_rate: pct(ppReviewed, personal_passports.length),
    avg_sections: ppSections,
  };

  const fAvgFriends = friendship_maps.length > 0 ? Math.round(friendship_maps.reduce((s, f) => s + f.friends_count, 0) / friendship_maps.length) : null;
  const fHighIso = friendship_maps.filter(f => f.isolation_risk === "high").length;
  const fReviewed = friendship_maps.filter(f => f.reviewed).length;
  const friendships: FriendshipSummary = {
    total: friendship_maps.length,
    avg_friends: fAvgFriends,
    high_isolation_count: fHighIso,
    reviewed_rate: pct(fReviewed, friendship_maps.length),
  };

  const aspChosen = aspirations.filter(a => a.child_chose).length;
  const aspActive = aspirations.filter(a => a.steps_taken_count > 0).length;
  const aspOverdue = aspirations.filter(a => a.review_date && daysBetween(a.review_date, today) > 30).length;
  const aspSummary: AspirationSummary = {
    total: aspirations.length,
    child_chosen_rate: pct(aspChosen, aspirations.length),
    active_steps_rate: pct(aspActive, aspirations.length),
    overdue_reviews: aspOverdue,
  };

  const lgPronouns = lgbtq_inclusions.filter(l => l.pronouns_used_consistently).length;
  const lgAffirming = lgbtq_inclusions.filter(l => l.identity_affirming_actions_count > 0).length;
  const lgVoice = lgbtq_inclusions.filter(l => l.child_voice_present).length;
  const lgbtq: LgbtqSummary = {
    total: lgbtq_inclusions.length,
    pronouns_consistent_rate: pct(lgPronouns, lgbtq_inclusions.length),
    affirming_actions_rate: pct(lgAffirming, lgbtq_inclusions.length),
    child_voice_rate: pct(lgVoice, lgbtq_inclusions.length),
  };

  const stVoice = style_identities.filter(s => s.child_voice.trim().length > 0).length;
  const stAvgDesc = style_identities.length > 0 ? Math.round(style_identities.reduce((s, r) => s + r.style_descriptors_count, 0) / style_identities.length) : null;
  const style: StyleSummary = {
    total: style_identities.length,
    child_voice_rate: pct(stVoice, style_identities.length),
    avg_descriptors: stAvgDesc,
  };

  // ── Score: base 52 + 8 modifiers (max ±28) ──────────────────────────────
  let score = 52;

  // Mod 1: Life story work quality (±5)
  let mod1 = 0;
  if (life_story_entries.length > 0) {
    if ((life_stories.completed_rate ?? 0) >= 80 && (life_stories.child_voice_rate ?? 0) >= 80) mod1 = 5;
    else if ((life_stories.completed_rate ?? 0) >= 60 && (life_stories.child_voice_rate ?? 0) >= 60) mod1 = 3;
    else if ((life_stories.completed_rate ?? 0) >= 40) mod1 = 1;
    else if ((life_stories.completed_rate ?? 0) < 20 && (life_stories.child_voice_rate ?? 0) < 20) mod1 = -5;
    else if ((life_stories.completed_rate ?? 0) < 40) mod1 = -3;
    else mod1 = -1;
  } else if (total_children >= 2) {
    mod1 = -2;
  }
  score += mod1;

  // Mod 2: Personal passports (±4)
  let mod2 = 0;
  if (personal_passports.length > 0) {
    if ((passports.child_authored_rate ?? 0) >= 80 && (passports.reviewed_rate ?? 0) >= 80) mod2 = 4;
    else if ((passports.child_authored_rate ?? 0) >= 60 && (passports.reviewed_rate ?? 0) >= 60) mod2 = 2;
    else if ((passports.child_authored_rate ?? 0) >= 40) mod2 = 1;
    else if ((passports.child_authored_rate ?? 0) < 20) mod2 = -4;
    else mod2 = -1;
  } else if (total_children >= 2) {
    mod2 = -2;
  }
  score += mod2;

  // Mod 3: Friendship mapping (±3)
  let mod3 = 0;
  if (friendship_maps.length > 0) {
    if (fHighIso === 0 && (friendships.reviewed_rate ?? 0) >= 80) mod3 = 3;
    else if (fHighIso <= 1 && (friendships.reviewed_rate ?? 0) >= 60) mod3 = 1;
    else if (fHighIso >= 3) mod3 = -3;
    else if (fHighIso >= 2) mod3 = -1;
    else mod3 = 0;
  } else if (total_children >= 2) {
    mod3 = -1;
  }
  score += mod3;

  // Mod 4: Aspirations (±4)
  let mod4 = 0;
  if (aspirations.length > 0) {
    if ((aspSummary.child_chosen_rate ?? 0) >= 80 && (aspSummary.active_steps_rate ?? 0) >= 70) mod4 = 4;
    else if ((aspSummary.child_chosen_rate ?? 0) >= 60 && (aspSummary.active_steps_rate ?? 0) >= 50) mod4 = 2;
    else if ((aspSummary.child_chosen_rate ?? 0) >= 40) mod4 = 1;
    else if ((aspSummary.child_chosen_rate ?? 0) < 20 && (aspSummary.active_steps_rate ?? 0) < 20) mod4 = -4;
    else if ((aspSummary.child_chosen_rate ?? 0) < 40) mod4 = -2;
    else mod4 = -1;
  } else if (total_children >= 2) {
    mod4 = -1;
  }
  score += mod4;

  // Mod 5: LGBTQ+ inclusion (±3) — neutral if no records (not every home has LGBTQ+ CYP)
  let mod5 = 0;
  if (lgbtq_inclusions.length > 0) {
    if ((lgbtq.pronouns_consistent_rate ?? 0) >= 90 && (lgbtq.affirming_actions_rate ?? 0) >= 80) mod5 = 3;
    else if ((lgbtq.pronouns_consistent_rate ?? 0) >= 70) mod5 = 1;
    else if ((lgbtq.pronouns_consistent_rate ?? 0) < 50) mod5 = -3;
    else mod5 = 0;
  }
  // No records = neutral (mod5 = 0)
  score += mod5;

  // Mod 6: Style & identity (±3)
  let mod6 = 0;
  if (style_identities.length > 0) {
    if ((style.child_voice_rate ?? 0) >= 80 && (stAvgDesc ?? 0) >= 4) mod6 = 3;
    else if ((style.child_voice_rate ?? 0) >= 60) mod6 = 1;
    else if ((style.child_voice_rate ?? 0) < 30) mod6 = -3;
    else mod6 = 0;
  } else if (total_children >= 2) {
    mod6 = -1;
  }
  score += mod6;

  // Mod 7: Child voice across identity domains (±3)
  let mod7 = 0;
  const voiceSources: boolean[] = [];
  if (life_story_entries.length > 0) voiceSources.push((life_stories.child_voice_rate ?? 0) >= 60);
  if (personal_passports.length > 0) voiceSources.push((passports.child_authored_rate ?? 0) >= 60);
  if (aspirations.length > 0) voiceSources.push((aspSummary.child_chosen_rate ?? 0) >= 60);
  if (lgbtq_inclusions.length > 0) voiceSources.push((lgbtq.child_voice_rate ?? 0) >= 60);
  if (style_identities.length > 0) voiceSources.push((style.child_voice_rate ?? 0) >= 60);
  if (voiceSources.length > 0) {
    const voiceRate = pct(voiceSources.filter(Boolean).length, voiceSources.length);
    if (voiceRate >= 80) mod7 = 3;
    else if (voiceRate >= 60) mod7 = 1;
    else if (voiceRate < 30) mod7 = -3;
    else mod7 = 0;
  }
  score += mod7;

  // Mod 8: Review & documentation currency (±3)
  let mod8 = 0;
  const staleCount = [
    ...life_story_entries.filter(e => e.date && daysBetween(e.date, today) > 180),
    ...friendship_maps.filter(f => f.map_date && daysBetween(f.map_date, today) > 180),
    ...style_identities.filter(s => s.recorded_date && daysBetween(s.recorded_date, today) > 180),
  ].length;
  const totalDocs = life_story_entries.length + friendship_maps.length + style_identities.length;
  if (totalDocs > 0) {
    const staleRate = pct(staleCount, totalDocs);
    if (staleRate === 0) mod8 = 3;
    else if (staleRate <= 20) mod8 = 1;
    else if (staleRate >= 60) mod8 = -3;
    else mod8 = -1;
  }
  score += mod8;

  score = Math.max(0, Math.min(100, score));

  // ── Rating ───────────────────────────────────────────────────────────────
  const life_story_rating: LifeStoryIdentityRating = score >= 80 ? "outstanding" : score >= 65 ? "good" : score >= 45 ? "adequate" : "inadequate";

  // ── Strengths ────────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if ((life_stories.child_voice_rate ?? 0) >= 80) strengths.push("Excellent child voice in life story work — children actively shaping their narratives.");
  if ((passports.child_authored_rate ?? 0) >= 80) strengths.push("Personal passports are child-authored, giving children ownership of their identity documents.");
  if (fHighIso === 0 && friendship_maps.length > 0) strengths.push("No children at high isolation risk — friendship mapping demonstrates strong social connections.");
  if ((aspSummary.child_chosen_rate ?? 0) >= 80) strengths.push("Aspirations are overwhelmingly child-chosen, showing genuine child participation in goal-setting.");
  if ((lgbtq.pronouns_consistent_rate ?? 0) >= 90 && lgbtq_inclusions.length > 0) strengths.push("Outstanding LGBTQ+ inclusion — pronouns and preferred names used consistently across the home.");
  if ((style.child_voice_rate ?? 0) >= 80 && style_identities.length > 0) strengths.push("Style and identity records centred on children's own words and preferences.");
  if (mod7 >= 3) strengths.push("Child voice is strong across all identity domains — children's views genuinely shape practice.");
  if (mod8 >= 3) strengths.push("All identity documentation is current and regularly reviewed.");

  // ── Concerns ─────────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (life_story_entries.length === 0 && total_children >= 2) concerns.push("No life story work recorded — children need support to understand their narrative and identity.");
  if ((life_stories.child_voice_rate ?? 0) < 30 && life_story_entries.length > 0) concerns.push(`Only ${(life_stories.child_voice_rate ?? 0)}% of life story entries include the child's voice — this should be child-led.`);
  if ((passports.child_authored_rate ?? 0) < 30 && personal_passports.length > 0) concerns.push("Most personal passports are not child-authored — these should reflect children's own perspectives.");
  if (fHighIso >= 2) concerns.push(`${fHighIso} children at high isolation risk — urgent friendship support needed.`);
  if (aspSummary.overdue_reviews >= 3) concerns.push(`${aspSummary.overdue_reviews} aspirations have overdue reviews — children's goals may have changed.`);
  if ((lgbtq.pronouns_consistent_rate ?? 0) < 50 && lgbtq_inclusions.length > 0) concerns.push("Pronouns not used consistently for some LGBTQ+ young people — fundamental to affirming practice.");
  if (personal_passports.length === 0 && total_children >= 2) concerns.push("No personal passports created — children need a document that captures who they are.");
  if (mod8 <= -3) concerns.push("Over 60% of identity documentation is stale (>6 months) — children's identities evolve rapidly.");

  // ── Recommendations ──────────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 0;
  if (fHighIso >= 2) recommendations.push({ rank: ++rank, recommendation: "Develop targeted friendship-building plans for children at high isolation risk.", urgency: "immediate", regulatory_ref: "Reg 9" });
  if ((lgbtq.pronouns_consistent_rate ?? 0) < 50 && lgbtq_inclusions.length > 0) recommendations.push({ rank: ++rank, recommendation: "Provide staff training on consistent use of pronouns and preferred names.", urgency: "immediate", regulatory_ref: "Reg 7" });
  if (life_story_entries.length === 0 && total_children >= 2) recommendations.push({ rank: ++rank, recommendation: "Initiate life story work for every child — this is fundamental to identity development.", urgency: "soon", regulatory_ref: "Reg 7" });
  if (personal_passports.length === 0 && total_children >= 2) recommendations.push({ rank: ++rank, recommendation: "Create child-authored personal passports so each child's identity is captured in their own words.", urgency: "soon", regulatory_ref: "Reg 7" });
  if (aspSummary.overdue_reviews >= 2) recommendations.push({ rank: ++rank, recommendation: `Review ${aspSummary.overdue_reviews} overdue aspiration records to ensure goals remain relevant.`, urgency: "soon", regulatory_ref: "Reg 9" });
  if (mod8 <= -1) recommendations.push({ rank: ++rank, recommendation: "Update stale identity records — children's preferences and identities change frequently.", urgency: "planned", regulatory_ref: "Reg 7" });
  if (friendship_maps.length === 0 && total_children >= 2) recommendations.push({ rank: ++rank, recommendation: "Implement friendship mapping to identify and support children's social networks.", urgency: "planned", regulatory_ref: "Reg 9" });

  // ── Insights ─────────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];
  if (life_story_rating === "outstanding") insights.push({ text: "Identity practice is outstanding — children's voices drive every aspect of their life story and identity work.", severity: "positive" });
  if (life_story_rating === "inadequate") insights.push({ text: "Identity and life story practice falls below acceptable standards — children's sense of self is not being adequately supported.", severity: "critical" });
  if (mod7 >= 3 && mod1 >= 3) insights.push({ text: "The integration of child voice across life story, passports, and aspirations suggests a genuinely child-centred identity culture.", severity: "positive" });
  if (fHighIso >= 2 && (aspSummary.active_steps_rate ?? 0) < 40) insights.push({ text: "High isolation risk combined with low aspiration activity suggests children may be disengaging — consider therapeutic identity work.", severity: "critical" });
  if (lgbtq_inclusions.length > 0 && (lgbtq.affirming_actions_rate ?? 0) >= 80) insights.push({ text: "LGBTQ+ affirming practice is embedded — identity-affirming actions are consistently recorded.", severity: "positive" });
  if ((life_stories.linked_to_book_rate ?? 0) >= 70 && life_story_entries.length >= 5) insights.push({ text: "Life story books are well-maintained with strong linkage — children have tangible records of their narrative.", severity: "positive" });

  // ── Headline ─────────────────────────────────────────────────────────────
  let headline = "";
  if (life_story_rating === "outstanding") headline = "Outstanding identity practice — children's voices shape every aspect of their life story work.";
  else if (life_story_rating === "good") headline = "Good identity practice with strong child participation in life story and aspiration work.";
  else if (life_story_rating === "adequate") headline = "Adequate identity work — some areas need stronger child voice and more regular reviews.";
  else headline = "Identity practice needs urgent improvement — children's sense of self is insufficiently supported.";

  return {
    life_story_rating, life_story_score: score, headline,
    life_stories, passports, friendships, aspirations: aspSummary, lgbtq, style,
    strengths, concerns, recommendations, insights,
  };
}
