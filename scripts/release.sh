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
  auth.ts \
  middleware.ts \
  next.config.ts \
  package.json \
  package-lock.json \
  tsconfig.json \
  .env.example \
  scripts \
  -x "*/.git/*" -x "node_modules/*" \
  -x ".next/cache/*" -x ".next/dev/*" -x ".next/types/*" \
  -x ".next/trace*" -x ".next/diagnostics/*"

echo "==> ${release_dir}/${name}.zip ready"