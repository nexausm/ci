<div align="center">

<img src="public/images/logo/nci.svg" alt="Cloud Invoice logo" width="128" />

# Cloud Invoice

**Open-source, an invoice manager you own.**

[![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/nexausm/ci?utm_source=oss&utm_medium=github&utm_campaign=nexausm%2Fci&labelColor=171717&color=FF570A&label=CodeRabbit+Reviews)](https://coderabbit.ai)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat&logo=prisma&logoColor=01BEA4)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)

</div>

<div align="center">

![Cloudflare](https://img.shields.io/badge/Cloudflare%20Pages-build%20passing-brightgreen?style=flat&logo=cloudflare&logoColor=FF5F09)
![Vercel](https://img.shields.io/badge/Vercel-build%20passing-brightgreen?style=flat&logo=vercel&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-build%20passing-brightgreen?style=flat&logo=netlify&logoColor=05A29E)

</div>

<div align="center">

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/nexausm/ci)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnexausm%2Fci&project-name=cloud-invoice&repository-name=cloud-invoice&env=AUTH_SECRET,AUTH_TRUST_HOST,DATABASE_URL&envDefaults=%7B%22AUTH_TRUST_HOST%22%3A%22true%22%7D&envDescription=DATABASE_URL%3A%20PostgreSQL%20connection%20string%20%28Neon%2C%20Supabase%2C%20RDS...%29.%20AUTH_SECRET%3A%20random%20secret%2C%20generate%20with%3A%20openssl%20rand%20-base64%2032.%20AUTH_TRUST_HOST%3A%20set%20to%20true)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/nexausm/ci)

</div>

---

To learn about features, setup, contribution and more, visit
**[docs](https://invoice.nexaus.cloud/docs)**.

## Deploy your own instance

The buttons above clone the latest default branch into your own Git account
and wire it up for continuous deploys on Cloudflare, Vercel, or Netlify. The
repository must be public. No secrets are embedded in the repo or the link —
you are prompted for the environment variables below at deploy time.

Required:

- `DATABASE_URL` - a PostgreSQL connection string (Neon, Supabase, RDS, ...)
- `AUTH_SECRET` - a random secret: `openssl rand -base64 32`
- `AUTH_TRUST_HOST` - `true`

Optional:

- `ALGOLIA_APP_ID`, `ALGOLIA_SEARCH_API_KEY`, `ALGOLIA_ADMIN_API_KEY`,
  `ALGOLIA_INDEX_NAME` - global search. Search gracefully degrades when
  unset; indexing runs via `npm run index:algolia`.
- `SEED_USER_NAME`, `SEED_USER_EMAIL`, `SEED_USER_PASSWORD` - pre-provisions
  an admin user via `npm run seed`.

## License

[GNU Affero General Public License v3.0](LICENSE)

Bundled third-party code-

- `vendor/taepdf` —> MIT License (browser HTML-to-PDF engine)

> Cloud Invoice will never advertise inside your invoices.
