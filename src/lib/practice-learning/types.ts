// ══════════════════════════════════════════════════════════════════════════════
// CARA — LEARNING LAYER (Layer 5) · types
//
// Retrospective organisational learning. After events (incidents, missing
// episodes, physical interventions, …) and their debriefs, the engine asks:
// what worked, what didn't, what should we do differently, and what should Cara
// learn? It aggregates real recorded learning into durable organisational memory
// and forward-looking watch-points. Deterministic — no model calls.
//
// Namespaced as practice-learning to avoid collision with the existing
// src/lib/cara-learning (agent-readiness), which is a different concept.
// ══════════════════════════════════════════════════════════════════════════════

import type { Confidence } from "@/lib/cara-reasoning/types";

export type { Confidence };

/** A past event with whatever learning was recorded against it. */
export interface LearningEvent {
  type: string;
  date: string;
  /** Free text used for theme mining (description + outcome + oversight note). */
  text: string;
  outcome?: string;
  lessonsLearned: string[];
  whatWorked: string[];
  whatDidntWork: string[];
  changesNeeded: string[];
  reviewed: boolean;
}

export interface LearningInput {
  scope: "child" | "home";
  childName?: string;
  events: LearningEvent[];
  windowDays: number;
  today: string;
}

export interface LearningTheme {
  key: string;
  theme: string;
  frequency: number;
  confidence: Confidence;
  basis: string;
}

export interface WatchPoint {
  trigger: string;
  suggestion: string;
  confidence: Confidence;
}

export interface LearningRecord {
  scope: "child" | "home";
  childName?: string;
  eventsConsidered: number;
  windowDays: number;

  whatWorked: string[];
  whatDidntWork: string[];
  doDifferently: string[];

  learningThemes: LearningTheme[];
  whatCaraShouldLearn: WatchPoint[];
  organisationalMemory: string[];

  confidence: Confidence;
  disclaimer: string;
  engineVersion: string;
  generatedAt: string;
}

export const LEARNING_ENGINE_VERSION = "1.0.0";

export const LEARNING_DISCLAIMER =
  "Cara's learning is a deterministic synthesis of what the records and debriefs already say — it surfaces recurring themes and candidate watch-points for the team to weigh. It does not decide; learning is owned by the staff team and embedded through supervision, planning and reflective practice.";
