import { CheckIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { IoLogoGithub } from "react-icons/io";

import { GITHUB_REPO_URL } from "@site/lib/site";

import TiltedImage from "../TiltImage";

export default function HeroSection() {
  const assurances = [
    "Free and AGPL-3.0 licensed",
    "Runs on your own database",
    "Never advertises in your invoices",
  ];

  return (
    <div className="relative flex w-full flex-col items-center justify-center">
      <div className="pointer-events-none absolute top-30 left-1/2 -z-10 size-72 -translate-x-1/2 bg-teal-600 opacity-40 blur-[300px] dark:opacity-100"></div>
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="border-border bg-muted text-foreground hover:bg-accent group mt-44 mb-6 flex max-w-full items-center gap-2 rounded-full p-1 pr-3 text-sm"
      >
        <span className="shrink-0 rounded-full bg-teal-800 px-3.5 py-1 text-xs whitespace-nowrap text-white">
          OSS
        </span>
        <p className="flex items-center gap-1 text-balance">
          <span>AGPL-3.0, read before you run it</span>
          <ChevronRightIcon className="shrink-0" size={16} />
        </p>
      </a>
      <h1 className="text-foreground max-w-2xl text-center text-4xl/11 font-medium text-balance sm:text-5xl/14 md:text-6xl/17">
        An invoice manager{" "}
        <span className="bg-linear-to-r from-teal-600 to-teal-500 bg-clip-text px-3 text-transparent dark:from-teal-500 dark:to-teal-300">
          you actually own.
        </span>
      </h1>
      <p className="text-muted-foreground mt-6 max-w-lg text-center text-base text-pretty">
        Cloud Invoice is a self-hosted invoicing app. Draft your invoices, track
        what you&apos;re still owed and export PDFs on your own database.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border hover:bg-muted flex h-11 items-center gap-2 rounded-full border px-6 transition-colors"
        >
          <IoLogoGithub className="size-5" />
          <span>View source</span>
        </a>
        <Link
          href="/docs/quickstart"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-teal-800 px-7 font-medium text-white transition-colors hover:bg-teal-900 dark:bg-teal-600 dark:hover:bg-teal-700"
        >
          Get started
        </Link>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center max-md:gap-4 md:gap-14">
        {assurances.map((item) => (
          <p
            className="text-muted-foreground flex items-center gap-2 text-center text-sm"
            key={item}
          >
            <CheckIcon className="text-primary size-5 shrink-0" />
            <span>{item}</span>
          </p>
        ))}
      </div>
      <TiltedImage />
    </div>
  );
}
