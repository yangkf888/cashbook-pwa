#!/usr/bin/env bash
set -e

if command -v pg_isready >/dev/null 2>&1; then
  echo "Waiting for database to be ready..."
  for _ in $(seq 1 30); do
    if pg_isready -d "${DATABASE_URL}" >/dev/null 2>&1; then
      echo "Database is ready."
      break
    fi
    sleep 1
  done

  if ! pg_isready -d "${DATABASE_URL}" >/dev/null 2>&1; then
    echo "Database is not ready after 30 seconds."
    exit 1
  fi
fi

pnpm prisma:generate
pnpm prisma:deploy
pnpm prisma:seed
