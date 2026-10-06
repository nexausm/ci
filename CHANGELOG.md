# Changelog

## [1.3.1](https://github.com/nexausm/ci/compare/v1.3.0...v1.3.1) (2026-10-06)


### 🔧 Maintenance

* **client:** centralize collection state in external stores ([cd4c8c3](https://github.com/nexausm/ci/commit/cd4c8c3488f4ed1cc88f795c96bd49b7e7dd4c73))
* **client:** centralize company profile state in provider ([95a2613](https://github.com/nexausm/ci/commit/95a26134fc9620d9baa9eb7cebdd48453505f5c7))
* **deps:** add cn, drop react-icons, pin recharts to 3.8.0 ([31e396c](https://github.com/nexausm/ci/commit/31e396cffbf4f703e604e74817d6c30c3ac64f5d))
* **invoices:** extract list from dashboard into dedicated page ([abb6f9d](https://github.com/nexausm/ci/commit/abb6f9d531457aecc09b33b021a44e64d740cef5))
* **search:** drop algolia integration ([1824df8](https://github.com/nexausm/ci/commit/1824df8161a219ba9b7ab7ffda5e77cb503e296c))
* **ui:** add breadcrumb, chart, empty and spinner components ([6263c9f](https://github.com/nexausm/ci/commit/6263c9f0e42ecd33688625f6faa41261bf8f4407))
* **ui:** adopt new sidebar, breadcrumb, chart, empty, skeleton and spinner components ([8db1044](https://github.com/nexausm/ci/commit/8db104466352a3b1e2f527b0df71e3719801f286))
* **ui:** drop ring border from card ([b652d14](https://github.com/nexausm/ci/commit/b652d140c476da8b97f9432eb02ef3136fc9fcff))

## [1.3.0](https://github.com/nexausm/ci/compare/v1.2.0...v1.3.0) (2026-10-03)

### 🚀 Features

- **ci:** add a manual trigger to revalidate the download page on demand ([e220c94](https://github.com/nexausm/ci/commit/e220c94871eecb6a53d904e0e04c9f09f0677924))

### 🐛 Bug Fixes

- **ci:** stop editing the release PR title before merge ([10f83c6](https://github.com/nexausm/ci/commit/10f83c6b80a829da8b8f008fe4acfc9ad760d195))
- **ci:** stop editing the release PR title before merge ([5b8d253](https://github.com/nexausm/ci/commit/5b8d2531a8534361349504dbaf4563ac8c63bd5e))

### 🔧 Maintenance

- **client:** improve dialog description wording ([9a5cac5](https://github.com/nexausm/ci/commit/9a5cac5515334deff2fe48acca5810abefe0cd65))

## [1.2.0](https://github.com/nexausm/ci/compare/v1.1.0...v1.2.0) (2026-10-03)

### 🚀 Features

- **ci:** revalidate marketing download page on release ([1589eed](https://github.com/nexausm/ci/commit/1589eed850804a0079b9913ab13274b495f2b954))

### 🐛 Bug Fixes

- **ci:** close script-injection and branch-spoof gaps in release pipeline ([f870601](https://github.com/nexausm/ci/commit/f870601059ad0f0766175e118a5281d4be2080ee))
- **ci:** resolve bot commit email in format workflow ([36ce360](https://github.com/nexausm/ci/commit/36ce360c06eaf51c6e443f1404565309231ddd44))
- **ci:** resolve bot commit email in format workflow ([ca89a69](https://github.com/nexausm/ci/commit/ca89a69888178b08d94ed0387b4c0d2cefa49f5d))
- **ci:** switch release and format workflows to GitHub App tokens ([fde89dc](https://github.com/nexausm/ci/commit/fde89dc40a3e3135fae114bf0c172d6132837a16))

### 🔧 Maintenance

- add spacing between pledge and standards sections ([f74300e](https://github.com/nexausm/ci/commit/f74300edbd356a23ce9a39cd2c0d83d8e18974da))
- add spacing between pledge and standards sections ([f7eb3dc](https://github.com/nexausm/ci/commit/f7eb3dc2072a0b3b45b8fdae5fee92b8fd663c32))
- **ci:** prefix format and release bot PR titles with emoji ([38d9819](https://github.com/nexausm/ci/commit/38d98192b5965dc336ff904c73699f503ec663c7))
- **ci:** skip preview deploys on release config and lockfile changes ([6969d3f](https://github.com/nexausm/ci/commit/6969d3f44737e8eb3a449a828548742594e1e96d))
- **site:** drop "by Nexaus" from site title ([61beca0](https://github.com/nexausm/ci/commit/61beca0fade815170d87b49394c4364a8116b365))
- **site:** drop static export build and harden release revalidation ([e3b6217](https://github.com/nexausm/ci/commit/e3b6217081ecd38bec2c0f5d9b2dec32305ab352))

## [1.1.0](https://github.com/nexausm/ci/compare/v1.0.0...v1.1.0) (2026-10-03)

### 🚀 Features

- **assets:** add logo assets in various formats and colors ([ecf7b6f](https://github.com/nexausm/ci/commit/ecf7b6feef3cb8e42aa65a818de24d403e0683ce))
- **brand:** add brand guidelines documentation with logo usage and color palette ([eb5dcc1](https://github.com/nexausm/ci/commit/eb5dcc1c044d146132a435229c00d331f0e880f9))
- **brand:** update brand palette and usage guidelines for improved clarity and accessibility ([5cf94be](https://github.com/nexausm/ci/commit/5cf94beefbd8f327f1e56c9bcababe41812b7d8f))
- **ci:** auto-merge the release-please PR once checks pass ([72812cc](https://github.com/nexausm/ci/commit/72812cc3fbea6cebc07213629890b37e8c7d0e12))
- **ci:** skip preview deploy on skills-lock.json changes ([2449d6b](https://github.com/nexausm/ci/commit/2449d6b2b23415c0e84085ca0f110aba54479c4d))
- **company:** add safe loader with fallback to default profile ([cb8bf63](https://github.com/nexausm/ci/commit/cb8bf63ee802fbb4a18a2a08ce6a6894600c7783))
- **deploy:** add database preflight check and update deployment workflow ([fcbfc72](https://github.com/nexausm/ci/commit/fcbfc72e42222368f7ca1866581a251500fb5eb5))
- **deploy:** add seed user and session env vars to Vercel deploy button ([d8643a6](https://github.com/nexausm/ci/commit/d8643a63774f28626fe83bd96663b0affde26b68))
- **deploy:** automate db setup on build and drop AUTH_TRUST_HOST requirement ([4c31f98](https://github.com/nexausm/ci/commit/4c31f980b7a820a57ce6fcb3f6eab51e2b2aacfc))
- **deployment:** add deployment buttons to README and update Netlify config for environment variables ([98b47f0](https://github.com/nexausm/ci/commit/98b47f025a2058b50948a51db4d972deaa90372f))
- **docs:** add deployment documentation and update index with deployment link ([6bf1340](https://github.com/nexausm/ci/commit/6bf1340408804db8ea78d3f6f33e914066ae7b55))
- **docs:** add navigation items for features, download, and community in docs layout ([aec35e5](https://github.com/nexausm/ci/commit/aec35e56faba532fb586f8e5850f046ed74d5885))
- **docs:** refresh overview copy and expand brand palette reference ([d6a888c](https://github.com/nexausm/ci/commit/d6a888c73adb32254f6b3f21bd6cbbbebe69b7f2))
- **footer:** enhance site footer with product and community links ([aec35e5](https://github.com/nexausm/ci/commit/aec35e56faba532fb586f8e5850f046ed74d5885))
- **github:** add GitHub API integration for releases and utility functions ([aec35e5](https://github.com/nexausm/ci/commit/aec35e56faba532fb586f8e5850f046ed74d5885))
- **header:** enhance site header with responsive navigation and menu toggle ([db74ee7](https://github.com/nexausm/ci/commit/db74ee7725c19aeddef59e72c5978ea6d61ceb29))
- **header:** update navigation links for features, download, and community ([aec35e5](https://github.com/nexausm/ci/commit/aec35e56faba532fb586f8e5850f046ed74d5885))
- **header:** update site header to include GitHub link and improve navigation structure ([09e6edc](https://github.com/nexausm/ci/commit/09e6edc4b74240fb4b41ee0e39c29ec0189bf9d6))
- **layout:** implement marketing layout with header and footer components ([aec35e5](https://github.com/nexausm/ci/commit/aec35e56faba532fb586f8e5850f046ed74d5885))
- **page:** create homepage with metadata and landing components ([aec35e5](https://github.com/nexausm/ci/commit/aec35e56faba532fb586f8e5850f046ed74d5885))
- **pages:** add community, download, and features pages with metadata and content ([fccfa08](https://github.com/nexausm/ci/commit/fccfa08eb697034d16834f20b0422964013c6cb6))
- **release:** regenerate prisma client and bundle lib sources in archive ([10f10f2](https://github.com/nexausm/ci/commit/10f10f2278aa93838a740aeab2db0c0a503d5378))
- **site:** add animation dependencies ([c2aac7e](https://github.com/nexausm/ci/commit/c2aac7e07abbd1e266665ace9fc0e64c3c0b519d))
- **site:** add community pixel section with involved data ([34aa002](https://github.com/nexausm/ci/commit/34aa002e2e17b146873153120bd27a29b2421870))
- **site:** add cta section pixel component with showcase assets ([b4103ea](https://github.com/nexausm/ci/commit/b4103eaeff7ec978a8afd59b62da5f6a52057b87))
- **site:** add features pixel section with section title and showcase assets ([c129a3b](https://github.com/nexausm/ci/commit/c129a3b72b9e22c812527f6d08d5a8fc8b74aa01))
- **site:** add footer pixel component with link sections ([2e473b6](https://github.com/nexausm/ci/commit/2e473b6fc00f91b91003f4b4f1083960a5bc6842))
- **site:** add hero section pixel component with showcase assets ([aa194b2](https://github.com/nexausm/ci/commit/aa194b27f0ef281a3fb795001631a7386b6a8b3a))
- **site:** add navbar pixel component with responsive mobile menu ([c49c8b7](https://github.com/nexausm/ci/commit/c49c8b708f1b350d1540e3775b86df7ea8cd8ab9))
- **site:** add open graph metadata and refine hero image alt text ([ed5a468](https://github.com/nexausm/ci/commit/ed5a468750a8ac5cd6bb7a70ba95189decd23e0e))
- **site:** add open graph metadata to docs pages ([898c6d0](https://github.com/nexausm/ci/commit/898c6d04113642b92a75909b5de44c0905ebdccd))
- **site:** add teal theme palette and site-container utility ([37f62f1](https://github.com/nexausm/ci/commit/37f62f171ccd67f3f1b830e6287a228ca8337edb))
- **site:** add tilt image pixel component with hero showcase asset ([f0e7e54](https://github.com/nexausm/ci/commit/f0e7e540584b10609c37617021bd70bf9fc3a11b))
- **site:** enable smooth scrolling with reduced-motion fallback ([88e7f82](https://github.com/nexausm/ci/commit/88e7f82c0398286426c1e72b9706c15b2df35d93))
- **site:** migrate landing page to pixel sections and clean up styles ([028287c](https://github.com/nexausm/ci/commit/028287c8f880ccef1a9b34b02e58e245525a75c4))
- **site:** remove unused landing page components ([b833f99](https://github.com/nexausm/ci/commit/b833f999705496fd2c8bd7316781ce10f3383682))
- **site:** switch layout to pixel components and simplify GitHub constants ([16dd20f](https://github.com/nexausm/ci/commit/16dd20f670d81a16b1e2c4b6b18b07a78006a3e7))
- **site:** switch theme toggle to react-icons and add className prop ([e04f555](https://github.com/nexausm/ci/commit/e04f5559fbcecf4521b57cf09e8af32982341981))
- **site:** trap focus within mobile menu dialog ([cd98b36](https://github.com/nexausm/ci/commit/cd98b369cd480ebcf0d41242540f213d063c212d))
- **skills:** add GSAP agent skills with Claude symlinks ([4e7508c](https://github.com/nexausm/ci/commit/4e7508c3265dcf91b8d59ac99d70bf4652b2eeb2))
- **skills:** add GSAP agent skills with Claude symlinks ([#55](https://github.com/nexausm/ci/issues/55)) ([c0e3e1c](https://github.com/nexausm/ci/commit/c0e3e1cba2653be6d8e471fa8337a4d29b60bae9))
- **vercel:** add configuration for URL rewrites to redirect root to index ([7cca288](https://github.com/nexausm/ci/commit/7cca2889875cf310fc12a78ef4d370b3c9319452))

### 🐛 Bug Fixes

- **docs:** remove unused icon imports from documentation library ([6e495f5](https://github.com/nexausm/ci/commit/6e495f5b7aba1c89d1e64dff1bee8bb5aa6338a8))
- **format:** match uppercase CLEAN merge state status ([56a2413](https://github.com/nexausm/ci/commit/56a24138c1eefe7f511de78e75aac794071dca29))
- **header:** remove unnecessary icon from 'Getting started' link in site header ([1afc8e0](https://github.com/nexausm/ci/commit/1afc8e082e7c1c7e4a665d54120f4180d434aa32))
- **logo:** update logo image source to new SVG format and remove old PNG ([ba7c42b](https://github.com/nexausm/ci/commit/ba7c42b6f6bd5330498521a3a18138a6e285c3c5))
- **preflight:** avoid leaking raw DATABASE_URL in error messages ([f825722](https://github.com/nexausm/ci/commit/f825722cfa06d9a5b7f12d11634ad44d816c6b7f))
- **preflight:** format SSL negotiation server errors like startup errors ([0e49841](https://github.com/nexausm/ci/commit/0e4984171978b41106e55d9d31ad3504de477f05))
- **preflight:** validate DATABASE_URL format before connecting ([87fbcc7](https://github.com/nexausm/ci/commit/87fbcc777806a7e1646965faa8f9190f031e6791))
- **seed:** handle unique constraint violation when creating admin user ([bc37423](https://github.com/nexausm/ci/commit/bc3742327b04e7bfdfe7a84d675227c97b47b023))
- **session:** warn when AUTH_SESSION_MAX_AGE is zero or negative ([432ae3b](https://github.com/nexausm/ci/commit/432ae3b6b0a214de61d3a8db1e9519dfbd509e85))
- **site:** remove redundant dark background on mobile menu cta ([d092ec2](https://github.com/nexausm/ci/commit/d092ec24f2bc30bf00998db89d728f5934f20a4e))
- **workflow:** update paths-ignore in preview deploy for better clarity ([f94ed31](https://github.com/nexausm/ci/commit/f94ed316fb278809384a490ad55723ff8518de6f))

### 📝 Documentation

- **deploy:** document seed user and session max age settings ([e128309](https://github.com/nexausm/ci/commit/e128309c698252976f050937c00b40f814a456da))
- **deploy:** warn that seed does not update existing users ([3b3bd87](https://github.com/nexausm/ci/commit/3b3bd87f4f5559d7f8756e64d34ec6fad19d1d79))

### 🔧 Maintenance

- add release automation ([b86f6ad](https://github.com/nexausm/ci/commit/b86f6adec9ec7e217d3f1cff94cb7f7510c8c5c2))
- add release automation ([ce61266](https://github.com/nexausm/ci/commit/ce6126635423d42d1f126e4ade09f75ec2b07677))
- **ci:** ignore release PRs in code review ([5691728](https://github.com/nexausm/ci/commit/56917289a240535c51e5845d5a8e933fddea5e91))
- **ci:** pin release-please action and simplify pr source check ([141c78b](https://github.com/nexausm/ci/commit/141c78b8fafb907d46419ffd8c0485211eaf5541))
- **ci:** skip CodeRabbit on release PRs, auto-merge once checks pass ([7cf0086](https://github.com/nexausm/ci/commit/7cf00869c77163c0afbc241429b9a67332da59ab))
- **format:** open and merge a formatting PR instead of direct push ([0c5b359](https://github.com/nexausm/ci/commit/0c5b359c044d8ebab84fca7f29216d712ce81b30))
- **github:** improve GitHub release validation and error handling in getReleases function ([cd110f3](https://github.com/nexausm/ci/commit/cd110f3527be0492e7f13d4054fc845ad16ff4cd))
- **prettier:** ignore wrangler.jsonc in prettier formatting ([9ae99ba](https://github.com/nexausm/ci/commit/9ae99baa583e5f6fe0aaa1e397138938ad9186ad))
- **prettier:** ignore wrangler.jsonc in prettier formatting ([5a507c2](https://github.com/nexausm/ci/commit/5a507c2922008a92ffd9a409946c714bac9eaa52))
- **site:** drop dark mode variant from features blur glow ([aa05776](https://github.com/nexausm/ci/commit/aa0577661739c3ed772e143eca1b28a00964d1b8))
- **site:** drop dark mode variant from involved section icons ([9765047](https://github.com/nexausm/ci/commit/97650472065bc5dac674c228bcc5491f92fdb7af))
- **site:** drop docs home link and unused features icon import ([5599845](https://github.com/nexausm/ci/commit/5599845dc50b9828ee886c989e19d1b94b20dbbb))
- **site:** drop hero client directive and refine feature image alts ([211b653](https://github.com/nexausm/ci/commit/211b653bded72fad626f79bd5ec8712f853f312b))
- **site:** drop standalone community page and point links to home section ([84556e8](https://github.com/nexausm/ci/commit/84556e8f9418c42152238a6975589f4b8f1d7b16))
- **site:** drop standalone features page and point links to home section ([b5dba00](https://github.com/nexausm/ci/commit/b5dba001651793f3b45ecede642fd4e4f4a82229))
- **site:** drop unused chat icon import ([d169d00](https://github.com/nexausm/ci/commit/d169d000419c8d1a5bec51ec62dd1e9435b61c17))
- **site:** point docs features link to home section ([d169d00](https://github.com/nexausm/ci/commit/d169d000419c8d1a5bec51ec62dd1e9435b61c17))
- **site:** remove included section from marketing page ([3c9194a](https://github.com/nexausm/ci/commit/3c9194a0995655ccba99565755f4ab9c55f1de8b))
- **site:** simplify features section card styling and drop unused section title prop ([69e1300](https://github.com/nexausm/ci/commit/69e13008f06184f33808ef6bf79bc1e5fe767b5e))
- **site:** trim download page to release cards only ([ebe2dc1](https://github.com/nexausm/ci/commit/ebe2dc131274d8e116e187d96d83bdf4f313e2f8))
