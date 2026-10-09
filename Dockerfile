# Mirror AWS Public ECR (lebih andal daripada docker.io di server perusahaan)
FROM public.ecr.aws/docker/library/node:20-alpine AS base
RUN apk add --no-cache libc6-compat wget

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# npm ci bisa gagal di Alpine jika lock dibuat di Windows
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_TAX_REFUND_API_URL=https://api-gateway.delamibrands.com/api
ENV NEXT_PUBLIC_TAX_REFUND_API_URL=$NEXT_PUBLIC_TAX_REFUND_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=5160
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 5160

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5160/api/health || exit 1

CMD ["node", "server.js"]
