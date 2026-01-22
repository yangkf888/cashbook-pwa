#!/usr/bin/env bash
set -euo pipefail

pnpm prisma:generate
pnpm prisma:deploy
pnpm prisma:seed
