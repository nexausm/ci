import { Check } from "lucide-react";
import { FaGithub } from "react-icons/fa";

import { GITHUB_REPO_URL } from "@site/lib/site";

const points = [
  "100% open-source and AGPL-3.0 licensed",
  "Self-host it anywhere a modern browser lives",
  "No phone-home, no analytics, no third-party ads",
];

export function OpenSource() {
  return (
    <section id="self-host" className="border-border bg-card/50 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Open source, self-hosted, yours
            </h2>
            <p className="text-muted-foreground mt-3 text-pretty">
              Cloud Invoice runs entirely under your control. Because the whole
              codebase is open, you can inspect it, audit it and deploy it
              wherever you already run services like Docker, a VPS or your own
              laptop.
            </p>
            <ul className="mt-6 space-y-2">
              {points.map((p) => (
                <li
                  key={p}
                  className="text-muted-foreground flex items-center gap-2 text-sm"
                >
                  <Check className="text-primary size-4" />
                  {p}
                </li>
              ))}
            </ul>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border bg-background hover:bg-muted mt-8 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              <FaGithub className="size-4" />
              View on GitHub
            </a>
          </div>

          <div className="border-border bg-background rounded-2xl border p-6 font-mono text-sm shadow-sm">
            <p className="text-muted-foreground">
              $ git clone {GITHUB_REPO_URL.replace("https://", "")}
            </p>
            <p className="text-muted-foreground mt-2">$ cd ci</p>
            <p className="text-muted-foreground mt-1">$ cp .env.example .env</p>
            <p className="text-muted-foreground mt-1">$ npm install</p>
            <p className="text-muted-foreground mt-1">$ npm run dev</p>
            <p className="mt-4 font-semibold text-emerald-600">
              ✓ Cloud Invoice is running at http://localhost:3000
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
