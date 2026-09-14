#!/usr/bin/env bash

set -euo pipefail
cd "$(dirname "$0")/.."

version=$(node -p "require('./package.json').version")
release_dir="release"
name="nci-${version}"
mkdir -p "$release_dir"

echo "==> format:check"
npm run format:check

echo "==> lint"
npm run lint

echo "==> typecheck (root + site)"
npm run typecheck

echo "==> production build"
npm run build

echo "==> packaging ${name}.zip"
rm -f "${release_dir}/${name}.zip"
zip -r "${release_dir}/${name}.zip" \
  .next \
  public \
  prisma \
  vendor \
  auth.ts \
  auth.config.ts \
  middleware.ts \
  next.config.ts \
  prisma.config.ts \
  postcss.config.mjs \
  package.json \
  package-lock.json \
  tsconfig.json \
  .npmrc \
  .env.example \
  scripts \
  -x "*/.git/*" -x "node_modules/*" \
  -x ".next/cache/*" -x ".next/dev/*" -x ".next/types/*" \
  -x ".next/trace*" -x ".next/diagnostics/*"

echo "==> ${release_dir}/${name}.zip ready"
