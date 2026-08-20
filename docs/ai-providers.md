# Cara AI providers — which route, when, and why

Every model call in Cara goes through one chokepoint, `invokeAiGateway`
(`src/lib/cara/ai-gateway/ai-gateway.ts`), whose ladder runs rules-first →
learned cache → kill-switch → role permission → sensitivity classification →
provider risk register → PII redaction → prompt-injection guard → cost caps →
the metered provider call → response safety scan → audit. **Nothing below
changes that.** The provider matrix only decides what happens at the
generation seam — step 8 — and how the call is authenticated.

## The matrix

| Route | Select with | Costs | Where it may run | Notes |
| --- | --- | --- | --- | --- |
| **Deterministic engines** | nothing — always on | £0 | everywhere | The floor. Every AI feature degrades to this when a model is unavailable, refused, capped, or errors. Most calls never reach a model at all (rules-first + cache). |
| **Anthropic API key** | `AI_PROVIDER=anthropic` (default) + `ANTHROPIC_API_KEY` | pay-per-token, metered in GBP | anywhere server-side | The production route. Per-request and daily-per-org GBP caps enforced by the gateway. |
| **Claude subscription** | `AI_PROVIDER=claude_subscription` | £0 API spend — consumes the **owner's Claude Max usage limits** | **local / self-host ONLY, single operator** | The owner's own Claude login via `@anthropic-ai/claude-agent-sdk`. Refuses serverless (`VERCEL`, `AWS_LAMBDA_FUNCTION_NAME`) and CI at configuration time; the gateway then degrades deterministically. `ANTHROPIC_API_KEY` is not needed and is ignored. |
| **Local LLM** | `CARA_AI_MODE` (see `ai-gateway/providers/`) | £0 | on-premises | Data never leaves the building; exempt from the external-provider risk register only when no external provider could be fallen back to. |

## Subscription auth is single-operator, local only

Anthropic's terms do not permit routing **other users'** requests through one
person's subscription. The subscription provider exists so the owner, running
Cara locally or self-hosted for their own use, can rewrite with their Max plan
instead of API credits. It must never serve a multi-user deployment — which is
why `isAvailable()` hard-refuses serverless environments rather than trusting
configuration discipline. Deployments use the API key or stay deterministic.

Honest metering: subscription calls are **not free** — they consume Max usage
limits. Every call records real tokens with `cost_gbp: 0` and
`auth_source: "subscription"` (on the gateway audit entry and the `ai_usage`
row), so the audit trail never claims an API spend that didn't happen and
never hides that a model ran. The gateway's GBP caps treat subscription calls
as £0 by design: the caps exist to protect API spend.

Requirements: a machine with a logged-in Claude Code environment (the Agent
SDK drives it), `AI_PROVIDER=claude_subscription`, and nothing else. Timeout
is `CARA_REWRITE_TIMEOUT_MS` (default 8000ms); on any failure the deterministic
engine answers, exactly as it does for an API failure. The Agent SDK does not
expose a temperature parameter — rewrite consistency comes from the locked
prompt and the deterministic post-pass, not sampling settings.

## Model pin

The default model is pinned in **one place**: `CARA_DEFAULT_MODEL` in
`src/lib/cara/cara-provider.ts` (currently `claude-sonnet-5`). Override per
environment with `CARA_MODEL`. Never use a floating alias in configuration —
a pin change is a reviewed change, and the golden set is the review.

## Changing the house style safely

The rewrite system prompt is assembled from reviewable files — never inline
strings:

- `src/lib/writing-assistant/style/house-style.md` — every rule, with
  before/after examples. The single source of truth.
- `src/lib/writing-assistant/style/examples/<mode>.md` — few-shot pairs per
  mode, seeded from the deterministic engine and marked for the owner's
  review. Replacing a pair with a better real-world example is encouraged.
- `src/lib/writing-assistant/style/system-prompt.ts` — the assembler. The
  record text itself is delimited as untrusted data in the user prompt.

After **any** change to those files, the model pin, or the provider route:

```bash
# CI-safe half (deterministic snapshots + prompt assembly):
npx vitest run src/lib/writing-assistant/__tests__/golden

# Model half — runs against whichever auth route is configured locally:
CARA_GOLDEN_MODEL=1 npx vitest run src/lib/writing-assistant/__tests__/golden
```

The route also runs the deterministic engine as a post-pass over every model
output and returns what it had to correct (`postPass.corrections`). A long
corrections list means the prompt needs work — and now it is measurable.

## Data protection (read before using real records)

Sending children's records to an external model — **by either auth route** —
is a data-processing matter: it requires a DPIA, a no-training commitment from
the provider, and sub-processor disclosure to placing authorities. The
gateway's sensitivity classification, safeguarding block, redaction, and
response scanning **mitigate but do not remove** this. That work is outside
this codebase and is a blocker on real-data use of any external model route.
