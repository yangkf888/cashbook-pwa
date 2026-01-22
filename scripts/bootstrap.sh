#!/usr/bin/env bash
set -euo pipefail

pnpm prisma generate
node -e "require('@prisma/client'); console.log('prisma ok')"
pnpm prisma migrate deploy
pnpm prisma db seed
