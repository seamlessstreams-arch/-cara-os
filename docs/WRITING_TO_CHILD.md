# Writing to the Child — child-readable recording intelligence

A practice-intelligence layer that helps residential childcare staff write records
that are **evidence for professionals AND memory for the child**: trauma-informed,
rights-based, anti-oppressive, emotionally safe and safeguarding-clear.

> Core principle: *write the record as evidence for professionals, but as memory for the child.*

## What it does

Given a draft record + its type, Cara returns a structured review:

- **Flagged language** — institutional/shaming/blaming wording (e.g. "refused to engage",
  "absconded", "returned safe and well", "non-compliant", "challenging behaviour"), each with
  the reason and a careful alternative that **preserves risk clarity**.
- **Four practice-dimension checks** (each scored + explained): child's voice, risk clarity,
  adult accountability, future-reader value.
- **Record-type intelligence** — for missing episodes, incidents, room searches, family time,
  education, exploitation, health, medication, manager oversight and more, it checks the
  elements a good child-conscious record should contain and **names what's missing**.
- **Reflective questions** drawn from the ten-node knowledge network.
- **Two wording suggestions** — a *child-conscious* version (clearly labelled "for practitioner
  review") and a *professional* version that separates fact / interpretation / risk / next steps.
- **An explainable score out of 100** (child voice 15, factual clarity 15, safeguarding clarity 15,
  trauma-informed 15, dignity & language 15, adult accountability 10, future-reader value 10,
  next steps 5).

## What it does NOT do

- It is **not** a form builder, template generator or generic AI rewriter.
- It **never invents facts** or adds emotional meaning as fact — where information is missing it
  says so (with `[bracketed]` prompts) rather than filling the gap.
- It **never minimises or removes a safeguarding concern**, and never over-polishes a record into
  inaccuracy.
- It does **not** auto-save anything into a child's record — the practitioner reviews and records.

## Safeguarding limitations

- Suggestions are **drafts for human review**. The practitioner remains responsible for accuracy,
  professional judgement and the final wording (the disclaimer travels in every response).
- A child cannot consent to their own exploitation — exploitation wording is flagged as
  **risk-preserving**: the alternative keeps the power imbalance and concern explicit.
- The deterministic engine pattern-matches language; it is an aid to thinking, not a substitute for
  safeguarding procedures, supervision or professional judgement.

## How staff use it

1. Paste or draft a record and choose the record type.
2. Optionally add the child's age, communication needs and any of the child's exact words.
3. Run the review.
4. Read the flags, strengths, missing information, reflective questions and the two wording
   suggestions; copy what helps **after reviewing it carefully**.
5. Record the final version using professional judgement.

## Architecture

- **Engine** (pure, deterministic): `src/lib/writing-to-child/`
  - `knowledge.ts` (10 nodes + disclaimer + LLM system prompt), `language-bank.ts`,
    `record-type-intelligence.ts`, `writing-to-child-engine.ts` (`reviewWritingToChild` +
    `enrichWritingReview`), `examples.ts`, `types.ts`.
- **API**: `POST /api/v1/writing-to-child` (review), `GET ?examples` / `?nodes`.
- **Deterministic-first**: works with no AI key. When `ANTHROPIC_API_KEY` is configured,
  `enrichWritingReview` improves only the two wording suggestions via the shared `generateText`
  seam (`generatedBy: "ai"`); otherwise the deterministic suggestions stand (`"deterministic"`).
- **Reuses**: `scoreProfessionalLanguage` (recording-quality), the `generateText` provider seam.

## Tests

`src/lib/writing-to-child/__tests__/writing-to-child-engine.test.ts` — knowledge/bank shape,
language detection (incl. risk-preserving exploitation terms), scoring (system-led vs
child-conscious), no-fabrication, and all ten example scenarios.
