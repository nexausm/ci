import Link from "next/link";
import { IoLogoGithub } from "react-icons/io";

import { GITHUB_REPO_URL } from "@site/lib/site";

export default function CTASection() {
  return (
    <div className="mt-20 w-full">
      <div className="flex w-full items-center justify-between rounded-2xl bg-linear-to-b from-teal-900 to-teal-950 p-8 py-10 text-left text-white max-md:flex-col max-md:gap-6 md:gap-8">
        <div>
          <h1 className="bg-linear-to-r from-white to-teal-400 bg-clip-text text-3xl font-semibold text-balance text-transparent sm:text-4xl md:text-[46px] md:leading-15">
            Ready to send an invoice?
          </h1>
          <p className="bg-linear-to-r from-white to-teal-400 bg-clip-text text-lg text-transparent">
            Point it at your database. You own everything after that.
          </p>
        </div>
        <Link
          href="/docs/quickstart"
          className="mt-4 rounded-full bg-white px-12 py-3 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-200"
        >
          Get started
        </Link>
      </div>
      <p className="text-muted-foreground mt-4 text-center text-sm">
        Prefer to read first? The{" "}
        <a
          href={`${GITHUB_REPO_URL}#readme`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 inline-flex items-center gap-1 align-middle"
        >
          <IoLogoGithub className="size-4 shrink-0" />
          <span>README</span>
        </a>{" "}
        covers the deploy buttons and environment variables.
      </p>
    </div>
  );
}
