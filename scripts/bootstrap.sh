#!/usr/bin/env bash
set -e

pnpm prisma:generate
pnpm prisma:deploy
pnpm prisma:seed
