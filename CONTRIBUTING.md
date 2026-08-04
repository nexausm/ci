# Contributing to Nexaus Cloud Invoice

Thanks for your interest in contributing! This project is a self-hostable,
cloud-ready invoice generator built with Next.js. It is licensed under the
[GNU Affero General Public License v3.0](LICENSE).

## Ways to contribute

- Report bugs and request features by [opening an issue](https://github.com/nexausm/ci/issues)
- Improve documentation
- Review open pull requests
- Submit code fixes or features

Before starting work, check existing issues to avoid duplicating effort and to
see whether a discussion already exists about the change you want to make.

## Project setup

### Prerequisites

- Node.js 20+ and npm
- A MongoDB instance (local or hosted)
- Git

### Local development

```bash
1. Clone the repository
git clone https://github.com/nexausm/ci.git
cd ci

2. Install dependencies
npm install

3. Configure environment variables
cp .env.example .env or create .env from the variables below
```

Required environment variables:

| Variable               | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `AUTH_SESSION_MAX_AGE` | Session lifetime in seconds for authenticated users |
| `AUTH_SECRET`          | Secret used by NextAuth to sign sessions            |
| `DATABASE_URL`         | PostgreSQL connection string (Prisma)               |

Before running the app, set up the database schema:

```bash
npm run db:push  # sync the Prisma schema to PostgreSQL
```

Used by the seed script (`npm run seed`):

| Variable             | Description                       |
| -------------------- | --------------------------------- |
| `SEED_USER_NAME`     | Name of the seeded admin user     |
| `SEED_USER_EMAIL`    | Email of the seeded admin user    |
| `SEED_USER_PASSWORD` | Password of the seeded admin user |

### Running the app

```bash
npm run dev    # start the dev server
npm run lint   # run ESLint
npm run build  # production build
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Code style and conventions

- TypeScript is required for all source files. Strict typing is enforced.
- Run `npm run lint` and make sure it passes before submitting.
- Follow the existing project structure: app routes in `app/`, server logic in
  `controllers/`, domain types in `lib/types.ts`, shared UI in
  `components/`.

### Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/).
Messages are written in lowercase, for example:

```
feat: add support for recurring invoices
fix: recalculate totals when a line item is removed
refactor: extract PDF rendering into a reusable component
chore: update dependencies
style: align totals column in the invoice editor
```

## Pull request workflow

1. Fork the repository and create a feature branch:
   `git checkout -b feat/your-feature-name`.
2. Make your changes and commit them with a clear Conventional Commit message.
3. Push the branch and open a pull request against `main`.
4. Describe what the change does and how it was tested.
5. Keep pull requests focused on a single concern. Split large changes into
   multiple pull requests if needed.

## Reporting bugs

When opening a bug report, include:

- Steps to reproduce the issue
- Expected vs. actual behavior
- Relevant environment details (Node.js version, browser, deployment method)

## Licensing

All contributions are licensed under the
[AGPL-3.0](LICENSE) license. By contributing, you agree that your contributions
will be licensed under this license. If your contribution includes code under a
different license, make it clear in the pull request.

## Attribution

If you build on this project or host a modified version publicly, please credit
the original project in the UI or the repository README, as permitted under the
license.
