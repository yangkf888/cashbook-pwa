FROM node:20-bullseye-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y openssl libssl1.1 ca-certificates && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

FROM base AS build

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

COPY . .
RUN test -f scripts/bootstrap.sh
RUN pnpm prisma generate
RUN node -e "require('@prisma/client'); console.log('prisma ok')"
RUN pnpm build

FROM node:20-bullseye-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

COPY --from=build /app/package.json /app/pnpm-lock.yaml* ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/next.config.mjs ./next.config.mjs
RUN test -f scripts/bootstrap.sh

EXPOSE 3000

CMD ["pnpm", "start"]
