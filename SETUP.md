# Cara OS — Setup Guide

> "Cara turns care records into action, evidence, and time back with children."

## Quick Start (Local Development)

```bash
# 1. Clone and install
git clone https://github.com/seamlessstreams-arch/cornerstone-v2.git
cd cornerstone-v2
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys (see Environment Variables below)

# 3. Run development server
npm run dev
# Open http://localhost:3000
```

## Environment Variables

### Required for AI (Cara Intelligence)

| Variable | Description | Example |
|----------|-------------|---------|
| `CARA_AI_ENABLED` | AI kill-switch: set `false` to hard-disable AI | `true` |
| `CARA_MODEL` | Model pin (see docs/ai-providers.md) | `claude-sonnet-5` |
| `AI_PROVIDER` | `anthropic` (API key) or `claude_subscription` (owner's Max login, **local only**) | `anthropic` |
| `ANTHROPIC_API_KEY` | Anthropic API key (if using Anthropic) | `sk-ant-api03-...` |
| `OPENAI_API_KEY` | OpenAI API key (if using OpenAI) | `sk-...` |

### Optional (Database Persistence)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_SUPABASE_ENABLED` | Set `true` to enable DB persistence |

Without Supabase, the platform runs in demo mode using an in-memory data store. All features work — data resets on server restart.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui + Radix UI
- **Database**: Supabase (PostgreSQL) with 384 migrations
- **AI**: Anthropic Claude / OpenAI (via Cara provider abstraction)
- **State**: TanStack React Query
- **Testing**: Vitest (11,886+ tests)
- **Deployment**: Vercel

## Project Structure

```
src/
  app/(platform)/          # 623 pages (Next.js App Router)
  app/api/                 # 1,333 API routes
  components/              # 1,308 React components
    aria/                  #   Cara AI components (85+)
    dashboard/             #   Dashboard intelligence cards (323)
    forms/                 #   Smart form components
    layout/                #   Sidebar, nav, layout
    ui/                    #   shadcn/ui primitives
  config/                  # Navigation, form registry
  contexts/                # Auth, sidebar, record-once
  hooks/                   # 868 React Query hooks
  lib/
    aria/                  # Cara AI engine, providers, health
    automation/            # Trigger-action automation engine
    db/                    # In-memory store
    engines/               # 376 intelligence engines
    evidence/              # Inspection evidence pack generator
    impact/                # Child impact view engine
    services/              # 362 domain services
    timeline/              # Universal timeline engine
    supabase/              # Database client & queries
  types/                   # TypeScript type definitions
supabase/
  migrations/              # 384 SQL migrations
```

## Key Features

### Intelligence Engines (301 deployed)
Pure deterministic engines covering every aspect of children's residential care. Each produces a score (0-100), rating (outstanding/good/adequate/inadequate), strengths, concerns, recommendations, and insights.

### Cara AI Assistant
Role-aware AI assistant with 18 safety rules, 12 registered tools, and 5 role-specific behaviour configurations. Supports both Anthropic and OpenAI.

### Task-Centric Domain Architecture
Minimal 3-domain sidebar (Young People, Employees, Home) with contextual Create menus, Quick Create FAB (Cmd+K), and smart form context.

### Automation Engine
18 default rules: incident triggers manager review, missing daily log creates alerts, safeguarding concerns escalate automatically.

### Inspection Evidence Pack
15 Ofsted-aligned sections generated from live data. Scores per section, overall rating, strengths, areas for improvement.

## Running Tests

```bash
# Run all engine tests
npx vitest run src/lib/engines/__tests__/

# Run a specific test
npx vitest run src/lib/engines/__tests__/home-safeguarding-intelligence-engine.test.ts

# Watch mode
npx vitest watch
```

## Production Deployment (Vercel)

```bash
# Set environment variables
vercel env add ANTHROPIC_API_KEY production
vercel env add AI_PROVIDER production        # "anthropic"
vercel env add ARIA_AI_ENABLED production     # "true"
vercel env add CARA_MODEL production          # "claude-sonnet-5"

# Deploy
npx vercel --prod --yes
```

**Live URL**: https://cara-os-fresh.vercel.app
**Domain**: cornerstonecareos.one

## Regulatory Alignment

Cara is designed around:
- Children's Homes (England) Regulations 2015
- Quality Standards (Reg 1-14)
- SCCIF (Social Care Common Inspection Framework)
- Ofsted inspection methodology
- Safeguarding best practice
- Trauma-informed care principles

## Licence

Proprietary. All rights reserved.
