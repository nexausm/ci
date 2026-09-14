<div align="center">

# Cloud Invoice by Nexaus

**Self-hosted release v{{VERSION}}**

</div>

This is a pre-built, self-contained release of Cloud Invoice. Everything needed to run
is inside this archive. No build step required. Bring a PostgreSQL database and go.

---

## Requirements

- **Node.js >= 20.9** (required by Next.js 16)
- **npm** 10+
- **PostgreSQL** 15+ (managed or self-hosted, reachable from this machine)
- **npm registry access** (`npm ci` must reach the registry; no vendored
  dependencies are included except `vendor/taepdf`)

## Quick start

```bash
# 1. Unzip
unzip nci-{{VERSION}}.zip -d cloud-invoice && cd cloud-invoice

# 2. Create the environment file (BEFORE npm ci)
cp .env.example .env
#    edit .env and set DATABASE_URL + AUTH_SECRET

# 3. Install dependencies (regenerates the Prisma client)
npm ci

# 4. Apply database migrations
npm run db:deploy

# 5. Start the server
npm run start
```

Open http://localhost:3000 and sign in. See **First user** to create a login.

## Warnings

- **`.env` must exist before `npm ci`.** Installation runs a `postinstall` step
  (`prisma generate`) that reads `DATABASE_URL`, so a missing `.env` aborts the install.
- **Use `npm ci`, not `npm install`.** The release is locked and verified; `npm install`
  may pull newer dependency ranges and break the build.
- **Do not edit anything under `.next/`.** It is the compiled production bundle.
- **Config is environment-only.** No secrets are baked into the build; every setting
  lives in `.env`. Rotate `AUTH_SECRET` and existing sessions become invalid.
- **Back up before updating.** Keep your database (`.env` + database, not the code).

## Configuration

| Variable                                                                                     | Required | Description                                                                        |
| -------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                                               | yes      | PostgreSQL connection string, e.g. `postgresql://user:pass@localhost:5432/invoice` |
| `AUTH_SECRET`                                                                                | yes      | Session signing secret. Generate: `openssl rand -base64 32`                        |
| `AUTH_TRUST_HOST`                                                                            | no       | Set `true` when not running behind a reverse proxy (default in `.env.example`)     |
| `AUTH_SESSION_MAX_AGE`                                                                       | no       | Session lifetime in seconds (default 30 days)                                      |
| `SEED_USER_NAME` / `SEED_USER_EMAIL` / `SEED_USER_PASSWORD`                                  | no       | Used by `npm run seed` to create the first user                                    |
| `ALGOLIA_APP_ID` / `ALGOLIA_ADMIN_API_KEY` / `ALGOLIA_SEARCH_API_KEY` / `ALGOLIA_INDEX_NAME` | no       | Optional full-text search; leave empty to disable                                  |

### First user

```bash
# ensure .env has DATABASE_URL, AUTH_SECRET and SEED_USER_* set
npm run seed
```

### Available scripts

| Command                 | Purpose                                                      |
| ----------------------- | ------------------------------------------------------------ |
| `npm run start`         | Production start (migrations → Prisma client → `next start`) |
| `npm run db:deploy`     | Apply pending migrations                                     |
| `npm run db:migrate`    | Create a new migration                                       |
| `npm run seed`          | Create the first user from `SEED_USER_*`                     |
| `npm run index:algolia` | Re-index records to Algolia (optional)                       |

## Updating to a newer release

1. Stop the server.
2. Snapshot the database (`pg_dump`), required, migrations run automatically on start.
3. Extract the new archive over the existing install, keeping your `.env` and database.
4. Run `npm ci && npm run db:deploy && npm run start`.

## Troubleshooting

**Q: `npm ci` fails with "Missing ... from lock file"?**

You deleted or did not extract `.npmrc` (contains `install-links=true`). Re-extract the
full archive.

**Q: `db:deploy` cannot reach the database?**

Verify `DATABASE_URL` and that the database accepts connections from this host.

**Q: Sign-in works but sessions reset?**

You changed `AUTH_SECRET` or `AUTH_SESSION_MAX_AGE`. Existing sessions are invalidated.

**Q: Port already in use?**

Start on another port: `npm run start -- -p 3001`.

## License and attribution

- This release is licensed under the **GNU Affero General Public License v3.0**
  (`LICENSE`). Source code is available at https://github.com/nexausm/ci.
- Bundled third-party code:
  - `vendor/taepdf`; MIT License (browser HTML-to-PDF engine).
