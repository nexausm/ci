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

release_readme="${release_dir}/README.staged"
sed "s/{{VERSION}}/${version}/g" RELEASE.md > "${release_readme}"

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
  "${release_readme}" \
  LICENSE \
  scripts/seed-user.ts \
  scripts/index-algolia.ts \
  -x "*/.git/*" -x "node_modules/*" \
  -x ".next/cache/*" -x ".next/dev/*" -x ".next/types/*" \
  -x ".next/trace*" -x ".next/diagnostics/*"

echo "==> renaming README.staged -> README.md inside archive"
printf "@ release/README.staged\n@=README.md\n" | zipnote -w "${release_dir}/${name}.zip"
rm -f "${release_readme}"

echo "==> ${release_dir}/${name}.zip ready"
