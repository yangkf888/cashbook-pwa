FROM node:20-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

COPY . .

RUN pnpm prisma generate
RUN pnpm build

FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable

COPY --from=base /app/package.json /app/pnpm-lock.yaml* ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/next.config.mjs ./next.config.mjs

EXPOSE 3000

CMD ["pnpm", "start"]
