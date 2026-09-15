# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────────────
# Cara OS — Northflank container image (Next.js 16, standalone output).
#
# Build memory matches the old Vercel build (NODE_OPTIONS below): give the
# Northflank BUILD plan >= 6-8 GB RAM or `next build` OOMs.
#
# NEXT_PUBLIC_* are compiled into the browser bundle at BUILD time — pass them
# as build ARGs (Northflank: set them as build-time env). Everything else
# (SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, VAPID_*, CRON_SECRET, the CARA_*
# config, …) is read at runtime — set those as runtime env on the service.
# ─────────────────────────────────────────────────────────────────────────────

# ---- deps: install node_modules from the lockfile ----
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- builder: compile the app ----
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_SHORT_NAME
ARG NEXT_PUBLIC_AI_NAME
ARG NEXT_PUBLIC_ASSISTANT_NAME
ARG NEXT_PUBLIC_CARA_MODE
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SUPABASE_ENABLED
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_APP_SHORT_NAME=$NEXT_PUBLIC_APP_SHORT_NAME \
    NEXT_PUBLIC_AI_NAME=$NEXT_PUBLIC_AI_NAME \
    NEXT_PUBLIC_ASSISTANT_NAME=$NEXT_PUBLIC_ASSISTANT_NAME \
    NEXT_PUBLIC_CARA_MODE=$NEXT_PUBLIC_CARA_MODE \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
    NEXT_PUBLIC_SUPABASE_ENABLED=$NEXT_PUBLIC_SUPABASE_ENABLED \
    NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=--max-old-space-size=6144
RUN npm run build

# ---- runner: minimal runtime image ----
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Stamp the deployed commit so /api/v1/health-check reports it (Northflank has
# no VERCEL_GIT_COMMIT_SHA). In Northflank, wire this build arg to the commit.
ARG GIT_COMMIT_SHA=""
ENV GIT_COMMIT_SHA=$GIT_COMMIT_SHA

RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs

# Standalone server + its static assets + public/.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# The writing-assistant reads these .md files at runtime via process.cwd() —
# standalone tracing only bundles JS, so copy them to the path the code expects.
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/writing-assistant/style ./src/lib/writing-assistant/style

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
