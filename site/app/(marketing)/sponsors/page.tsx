import type { Metadata } from "next";

import SponsorCard from "@site/components/pixels/SponsorCard";
import { sponsorsData } from "@site/components/pixels/data/sponsors";
import { GITHUB_REPO_URL } from "@site/lib/site";

export const metadata: Metadata = {
  title: "Sponsors | Cloud Invoice",
  description:
    "The companies supporting Cloud Invoice, an open-source, self-hosted invoice manager.",
  openGraph: {
    title: "Sponsors | Cloud Invoice",
    description:
      "The companies supporting Cloud Invoice, an open-source, self-hosted invoice manager.",
    type: "website",
  },
};

export default function SponsorsPage() {
  return (
    <>
      <section className="mx-auto mt-16 w-full max-w-6xl px-4 pt-16 pb-4 md:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            Our sponsors
          </h1>
          <p className="text-muted-foreground mt-4 text-lg text-pretty">
            Cloud Invoice is free and open source. These companies help us keep
            it that way.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <ul className="grid gap-6 md:grid-cols-2">
          {sponsorsData.map((sponsor) => (
            <li key={sponsor.name}>
              <SponsorCard sponsor={sponsor} />
            </li>
          ))}
        </ul>

        <div className="border-border mt-12 rounded-2xl border p-6 text-center">
          <h2 className="text-xl font-bold">Become a sponsor</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-sm text-pretty">
            Want to support an open-source invoice manager and reach people who
            self-host their tools? Start a conversation with us on GitHub.
          </p>
          <a
            href={`${GITHUB_REPO_URL}/discussions`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary mt-4 inline-block text-sm font-medium hover:underline"
          >
            Get in touch →
          </a>
        </div>
      </section>
    </>
  );
}
