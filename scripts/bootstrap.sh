#!/usr/bin/env bash
set -euo pipefail

pnpm prisma generate
node -e "require('@prisma/client/default'); console.log('default ok')"
pnpm prisma migrate deploy
pnpm prisma db seed
