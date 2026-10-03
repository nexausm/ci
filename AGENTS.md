## Critical: keep `middleware.ts`, do NOT rename to `proxy.ts`

Next.js 16 prints a build warning when it detects the legacy `middleware.ts`
convention:

> The "middleware" file convention is deprecated. Please use "proxy" instead.

**This warning must be ignored. Do NOT rename `middleware.ts` to `proxy.ts`**
(or move it to the `proxy` convention) to silence it.

Reason: the Cloudflare deployment pipeline (`npm run cf:deploy`, i.e.
`opennextjs-cloudflare build && opennextjs-cloudflare deploy`) cannot handle
the `proxy.ts` convention and fails with:

> ERROR Node.js middleware is not currently supported. Consider switching to Edge Middleware.

So `middleware.ts` is a required, non-negotiable part of the Cloudflare
deployment. Do not migrate it, do not "fix" the deprecation warning.

Note: although deprecated, Vercel and Netlify still accept the
`middleware.ts` convention today, so keeping it works across all three
deployment targets.
