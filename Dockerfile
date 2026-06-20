# Eftirlit KEF – sjálfstæð keyrsla án Vercel.
# Margra þrepa mynd: byggir Next.js forritið, keyrir svo "standalone"
# útgáfuna sem Next.js skapar (lágmarks runtime, engin þörf á node_modules).

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
